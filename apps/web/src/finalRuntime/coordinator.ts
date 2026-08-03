import {
  getAiModelBytes,
} from '../aiModelCache'
import {
  decodeFinalAccurateOutput,
  FINAL_ACCURATE_INPUT_SIZE,
  FINAL_ACCURATE_MAXIMUM_DETECTIONS,
  FINAL_ACCURATE_PRE_NMS_TOP_K,
  getFinalAccurateRuntimeSettings,
  prepareFinalAccurateInput,
  type FinalAccurateRunResult,
} from '../ml/finalAccurateModel'
import {
  classifyFinalRuntimeError,
  runtimeFailureError,
} from './errors'
import {
  assertFinalModelContract,
  resolveFinalModelVariant,
} from './modelRegistry'
import {
  selectFinalRuntimePlans,
} from './planSelector'
import {
  recordPlanFailure,
  recordPlanSuccess,
} from './planStore'
import {
  readDeviceStrategy,
  recordDeviceStrategyPlanFailure,
  recordDeviceStrategyPlanSuccess,
} from './deviceStrategy'
import {
  profileFinalRuntimeCapabilities,
} from './capabilityProfiler'
import {
  FINAL_RUNTIME_MARKER,
  FINAL_RUNTIME_SCHEMA_VERSION,
  type FinalRuntimeCapabilities,
  type FinalRuntimeDiagnostics,
  type FinalRuntimeFailure,
  type FinalRuntimePlan,
  type FinalRuntimeReadiness,
  type FinalRuntimeStatusListener,
} from './protocol'
import {
  SingleFlight,
} from './singleFlight'
import {
  FinalRuntimeStateMachine,
} from './stateMachine'
import {
  emitFinalRuntimeTelemetry,
  failureTelemetryDetails,
} from './telemetry'
import {
  FinalRuntimeWorkerClient,
  type RuntimeWorkerEvent,
} from './workerClient'
import {
  type WorkerReadyPayload,
} from './workers/protocol'

type ReadyRuntime = {
  plan: FinalRuntimePlan
  modelLoadMs: number
  worker:
    FinalRuntimeWorkerClient
  workerReady:
    WorkerReadyPayload
  fingerprint: string
  initializedAtMs: number
}

function takeOwnedArrayBuffer(
  bytes:
    Uint8Array,
): {
  buffer: ArrayBuffer
  copied: boolean
} {
  const sourceBuffer =
    bytes.buffer

  if (
    sourceBuffer instanceof
      ArrayBuffer &&
    bytes.byteOffset === 0 &&
    bytes.byteLength ===
      sourceBuffer.byteLength
  ) {
    return {
      buffer: sourceBuffer,
      copied: false,
    }
  }

  return {
    buffer:
      sourceBuffer.slice(
        bytes.byteOffset,
        bytes.byteOffset +
          bytes.byteLength,
      ) as ArrayBuffer,
    copied: true,
  }
}

function randomId(
  prefix: string,
  sequence: number,
): string {
  const random =
    typeof crypto.randomUUID ===
      'function'
      ? crypto.randomUUID()
      : Math.random()
          .toString(36)
          .slice(2)

  return (
    `${prefix}-${sequence}-${random}`
  )
}

class FinalRuntimeCoordinator {
  private readonly stateMachine =
    new FinalRuntimeStateMachine()

  private readonly prepareFlight =
    new SingleFlight<
      FinalRuntimeReadiness
    >()

  private generation = 1
  private transactionSequence = 0
  private requestSequence = 0

  private activeTransactionId:
    string | null = null

  private activeRequestId:
    string | null = null

  private capabilities:
    FinalRuntimeCapabilities | null =
      null

  private readyRuntime:
    ReadyRuntime | null = null

  private currentWorker:
    FinalRuntimeWorkerClient | null =
      null

  private releaseTimer:
    number | null = null

  private inferencePromise:
    Promise<
      FinalAccurateRunResult
    > | null = null

  private releasePromise:
    Promise<void> | null = null

  private lastFailure:
    FinalRuntimeFailure | null =
      null

  private lastSessionCreateMs = 0
  private lastInferenceMs = 0
  private successfulRuns = 0
  private failedRuns = 0

  private transition(
    next:
      Parameters<
        FinalRuntimeStateMachine[
          'transition'
        ]
      >[0],
  ): void {
    this.stateMachine.transition(
      next,
    )
  }

  private emit(
    event: string,
    input: {
      level?:
        'debug'
        | 'info'
        | 'warning'
        | 'error'
      plan?:
        FinalRuntimePlan | null
      details?:
        Record<string, unknown>
    } = {},
  ): void {
    emitFinalRuntimeTelemetry({
      event,
      level:
        input.level,
      generation:
        this.generation,
      transactionId:
        this.activeTransactionId,
      requestId:
        this.activeRequestId,
      provider:
        input.plan?.provider ??
        this.readyRuntime
          ?.plan.provider ??
        null,
      plan:
        input.plan ??
        this.readyRuntime?.plan ??
        null,
      state:
        this.stateMachine.state,
      details:
        input.details,
    })
  }

  private workerEvent =
    (
      event:
        RuntimeWorkerEvent,
    ): void => {
      this.emit(
        `worker.${event.event}`,
        {
          plan:
            this.readyRuntime
              ?.plan ??
            null,
          details: {
            provider:
              event.provider,
            ...event.details,
          },
        },
      )
    }

  private assertGeneration(
    expected:
      number,
  ): void {
    if (
      expected !==
      this.generation
    ) {
      throw runtimeFailureError({
        code: 'cancelled',
        provider: null,
        planId: null,
        phase: 'release',
        retryable: true,
        message:
          'Final runtime generation changed.',
      })
    }
  }

  private clearReleaseTimer():
    void {
    if (
      this.releaseTimer !== null
    ) {
      window.clearTimeout(
        this.releaseTimer,
      )
      this.releaseTimer = null
    }
  }

  private scheduleRelease():
    void {
    this.clearReleaseTimer()

    const retentionMs =
      this.readyRuntime
        ?.plan
        .sessionRetentionMs ??
      0

    if (retentionMs <= 0) {
      void this.release(
        'zero-retention',
      )
      return
    }

    this.releaseTimer =
      window.setTimeout(
        () => {
          void this.release(
            'idle-retention-expired',
          )
        },
        retentionMs,
      )
  }

  private readiness():
    FinalRuntimeReadiness {
    return {
      ready:
        this.readyRuntime !== null,
      state:
        this.stateMachine.state,
      plan:
        this.readyRuntime
          ?.plan ??
        null,
      capabilities:
        this.capabilities,
      initializedAtMs:
        this.readyRuntime
          ?.initializedAtMs ??
        null,
      sessionCreateMs:
        this.readyRuntime
          ?.workerReady
          .sessionCreateMs ??
        this.lastSessionCreateMs,
      failure:
        this.lastFailure,
    }
  }

  private newTransaction():
    string {
    this.transactionSequence += 1

    const id =
      randomId(
        'final-tx',
        this.transactionSequence,
      )

    this.activeTransactionId =
      id

    return id
  }

  private newRequest():
    string {
    this.requestSequence += 1

    const id =
      randomId(
        'final-req',
        this.requestSequence,
      )

    this.activeRequestId = id

    return id
  }

  private async closeWorker(
    reason: string,
  ): Promise<void> {
    this.clearReleaseTimer()

    const worker =
      this.currentWorker

    this.currentWorker = null
    this.readyRuntime = null

    if (!worker) {
      return
    }

    const transactionId =
      this.activeTransactionId ??
      this.newTransaction()

    const requestId =
      this.newRequest()

    try {
      await worker.release({
        generation:
          worker.generation,
        transactionId,
        requestId,
      })
    } catch {
      worker.terminate(reason)
    }
  }

  private async preparePlan(
    input: {
      plan: FinalRuntimePlan
      fingerprint: string
      expectedGeneration: number
      transactionId: string
      onStatus?:
        FinalRuntimeStatusListener
    },
  ): Promise<ReadyRuntime> {
    const {
      plan,
      fingerprint,
      expectedGeneration,
      transactionId,
      onStatus,
    } = input

    this.assertGeneration(
      expectedGeneration,
    )

    this.transition(
      'loading-model',
    )

    const variant =
      resolveFinalModelVariant(
        plan.provider,
      )

    assertFinalModelContract(
      variant,
    )

    onStatus?.(
      plan.provider === 'webgpu'
        ? 'در حال بارگذاری امن مدل دقیق برای موتور گرافیکی...'
        : `در حال بارگذاری امن مدل دقیق برای موتور سازگار ${plan.wasmThreads.toLocaleString('fa-IR')} رشته‌ای...`,
    )

    this.emit(
      'plan.model.load.begin',
      {
        plan,
        details: {
          model_variant_id:
            variant.id,
          model_plain_bytes:
            variant.plainBytes,
          model_precision:
            variant.precision,
        },
      },
    )

    const modelStartedAt =
      performance.now()

    const modelBytes =
      await getAiModelBytes(
        variant.aiModelId,
      )

    const modelLoadMs =
      performance.now() -
      modelStartedAt

    this.assertGeneration(
      expectedGeneration,
    )

    if (
      modelBytes.byteLength !==
      variant.plainBytes
    ) {
      modelBytes.fill(0)

      throw runtimeFailureError({
        code:
          'model-integrity-failed',
        provider:
          plan.provider,
        planId:
          plan.planId,
        phase: 'model',
        retryable: false,
        message:
          'Final model size does not match the registry.',
      })
    }

    const ownedModel =
      takeOwnedArrayBuffer(
        modelBytes,
      )

    if (ownedModel.copied) {
      modelBytes.fill(0)
    }

    const modelBuffer =
      ownedModel.buffer

    this.transition(
      'creating-session',
    )

    onStatus?.(
      plan.provider === 'webgpu'
        ? 'در حال ساخت موتور مستقل WebGPU...'
        : `در حال ساخت موتور مستقل WASM با ${plan.wasmThreads.toLocaleString('fa-IR')} رشته...`,
    )

    const worker =
      new FinalRuntimeWorkerClient(
        plan.provider,
        expectedGeneration,
        this.workerEvent,
      )

    this.currentWorker =
      worker

    const requestId =
      this.newRequest()

    this.emit(
      'plan.session.create.begin',
      {
        plan,
        details: {
          model_load_ms:
            modelLoadMs,
          model_variant_id:
            variant.id,
          wasm_threads:
            plan.wasmThreads,
          graph_capture:
            plan.graphCapture,
        },
      },
    )

    try {
      const workerReady =
        await worker.initialize({
          generation:
            expectedGeneration,
          transactionId,
          requestId,
          plan,
          modelBuffer,
        })

      this.assertGeneration(
        expectedGeneration,
      )

      const ready:
        ReadyRuntime = {
          plan,
          modelLoadMs,
          worker,
          workerReady,
          fingerprint,
          initializedAtMs:
            Date.now(),
        }

      this.currentWorker =
        worker
      this.readyRuntime =
        ready
      this.lastSessionCreateMs =
        workerReady
          .sessionCreateMs
      this.lastFailure = null

      this.transition('ready')

      this.emit(
        'plan.session.create.success',
        {
          plan,
          details: {
            model_load_ms:
              modelLoadMs,
            session_create_ms:
              workerReady
                .sessionCreateMs,
            input_name:
              workerReady.inputName,
            output_name:
              workerReady.outputName,
            thread_count:
              workerReady.threadCount,
          },
        },
      )

      return ready
    } catch (error) {
      worker.terminate(
        'session-create-failed',
      )

      if (
        this.currentWorker ===
        worker
      ) {
        this.currentWorker = null
      }

      if (
        this.readyRuntime
          ?.worker === worker
      ) {
        this.readyRuntime = null
      }

      throw error
    }
  }

  private async prepareInternal(
    input: {
      forcedProvider?:
        'webgpu'
        | 'wasm'
      onStatus?:
        FinalRuntimeStatusListener
    } = {},
  ): Promise<FinalRuntimeReadiness> {
    if (this.releasePromise) {
      await this.releasePromise
    }

    this.clearReleaseTimer()

    if (
      this.readyRuntime &&
      (
        !input.forcedProvider ||
        this.readyRuntime.plan
          .provider ===
          input.forcedProvider
      )
    ) {
      return this.readiness()
    }

    const expectedGeneration =
      this.generation

    const transactionId =
      this.newTransaction()

    this.transition(
      'profiling',
    )

    const storedStrategy =
      readDeviceStrategy()

    let capabilities:
      FinalRuntimeCapabilities

    if (storedStrategy) {
      input.onStatus?.(
        'در حال راه‌اندازی مستقیم استراتژی ذخیره‌شده دستگاه...',
      )

      this.emit(
        'strategy.cache.hit',
        {
          details: {
            provider:
              storedStrategy.provider,
            wasm_threads:
              storedStrategy.wasmThreads,
            preview_threads:
              storedStrategy.previewThreads,
            graph_optimization_level:
              storedStrategy.graphOptimizationLevel,
            repeated_capability_probe:
              false,
            repeated_thread_benchmark:
              false,
          },
        },
      )

      capabilities =
        storedStrategy.capabilities
    } else {
      input.onStatus?.(
        'در حال سنجش یک‌باره توان واقعی این دستگاه...',
      )

      this.emit(
        'capability.profile.begin',
      )

      capabilities =
        await profileFinalRuntimeCapabilities()

      this.emit(
        'capability.profile.end',
        {
          details: {
            memory_class:
              capabilities.memoryClass,
            hardware_concurrency:
              capabilities
                .hardwareConcurrency,
            device_memory_gb:
              capabilities
                .deviceMemoryGb,
            cross_origin_isolated:
              capabilities
                .crossOriginIsolated,
            webgpu_available:
              capabilities
                .webGpu.available,
            webgpu_compute_verified:
              capabilities
                .webGpu.computeVerified,
            webgpu_probe_ms:
              capabilities
                .webGpu.durationMs,
            webgpu_max_buffer_bytes:
              capabilities
                .webGpu.maximumBufferBytes,
            webgpu_max_storage_binding_bytes:
              capabilities
                .webGpu.maximumStorageBindingBytes,
          },
        },
      )
    }

    this.assertGeneration(
      expectedGeneration,
    )

    this.capabilities =
      capabilities

    this.transition(
      'selecting-plan',
    )

    const selection =
      selectFinalRuntimePlans(
        capabilities,
      )

    const plans =
      input.forcedProvider
        ? selection.plans.filter(
            (plan) =>
              plan.provider ===
              input.forcedProvider,
          )
        : selection.plans

    this.emit(
      'plan.selection',
      {
        details: {
          selected_plan_ids:
            plans.map(
              (plan) =>
                plan.planId,
            ),
          selected_plan_sources:
            plans.map(
              (plan) =>
                plan.source,
            ),
          stored_strategy_used:
            plans.some(
              (plan) =>
                plan.source ===
                  'stored-strategy',
            ),
          forced_provider:
            input.forcedProvider ??
            null,
        },
      },
    )

    let lastFailure:
      FinalRuntimeFailure | null =
        null

    for (const plan of plans) {
      this.assertGeneration(
        expectedGeneration,
      )

      if (
        this.currentWorker
      ) {
        await this.closeWorker(
          'plan-replacement',
        )
      }

      try {
        await this.preparePlan({
          plan,
          fingerprint:
            selection.fingerprint,
          expectedGeneration,
          transactionId,
          onStatus:
            input.onStatus,
        })

        return this.readiness()
      } catch (error) {
        const failure =
          classifyFinalRuntimeError(
            error,
            {
              provider:
                plan.provider,
              plan,
              phase:
                this.stateMachine
                  .state ===
                  'loading-model'
                  ? 'model'
                  : 'session',
              timeout:
                error instanceof Error &&
                error.name ===
                  'session-create-timeout',
            },
          )

        lastFailure =
          failure
        this.lastFailure =
          failure

        recordPlanFailure(
          selection.fingerprint,
          plan,
          failure.code,
        )

        recordDeviceStrategyPlanFailure(
          plan,
        )

        this.transition(
          'recording-failure',
        )

        this.emit(
          'plan.failed',
          {
            level: 'warning',
            plan,
            details:
              failureTelemetryDetails(
                failure,
              ),
          },
        )

        const nextPlan =
          plans[
            plans.indexOf(plan) + 1
          ]

        input.onStatus?.(
          plan.provider === 'webgpu'
            ? 'موتور گرافیکی با این مدل سازگار نبود؛ در حال انتقال به مسیر مطمئن CPU...'
            : nextPlan?.provider === 'wasm'
              ? `تنظیم ${plan.wasmThreads.toLocaleString('fa-IR')} رشته پایدار نبود؛ در حال امتحان حالت ${nextPlan.wasmThreads.toLocaleString('fa-IR')} رشته...`
              : 'هیچ تنظیم CPU سازگار دیگری باقی نمانده است.',
        )

        this.transition(
          'selecting-plan',
        )
      }
    }

    this.lastFailure =
      lastFailure ?? {
        code:
          'all-plans-exhausted',
        provider: null,
        planId: null,
        phase: 'select',
        retryable: true,
        message:
          'No final runtime plan succeeded.',
      }

    this.transition(
      'unavailable',
    )

    throw runtimeFailureError(
      this.lastFailure,
    )
  }

  prepare(
    input: {
      forcedProvider?:
        'webgpu'
        | 'wasm'
      onStatus?:
        FinalRuntimeStatusListener
    } = {},
  ): Promise<FinalRuntimeReadiness> {
    return this.prepareFlight.run(
      () =>
        this.prepareInternal(
          input,
        ),
    )
  }

  async prewarmIfRecommended(
    onStatus?:
      FinalRuntimeStatusListener,
  ): Promise<boolean> {
    if (
      this.readyRuntime
    ) {
      return true
    }

    const strategy =
      readDeviceStrategy()

    if (
      !strategy ||
      !strategy.backgroundPrewarm
    ) {
      this.emit(
        'prewarm.deferred',
        {
          details: {
            reason:
              strategy
                ? 'stored-strategy-disables-background-prewarm'
                : 'device-strategy-not-ready',
          },
        },
      )

      return false
    }

    onStatus?.(
      strategy.provider ===
        'webgpu'
        ? 'موتور انتخاب‌شده WebGPU در پس‌زمینه آماده می‌شود...'
        : `موتور انتخاب‌شده CPU با ${strategy.wasmThreads.toLocaleString('fa-IR')} رشته در پس‌زمینه آماده می‌شود...`,
    )

    try {
      const readiness =
        await this.prepare({
          onStatus,
        })

      return readiness.ready
    } catch (error) {
      this.emit(
        'prewarm.failed',
        {
          level: 'warning',
          details: {
            reason:
              'stored-strategy-prewarm-failed',
            error_name:
              error instanceof Error
                ? error.name
                : 'unknown',
          },
        },
      )

      return false
    }
  }

  run(
    source:
      HTMLCanvasElement,
    onStatus?:
      FinalRuntimeStatusListener,
  ): Promise<FinalAccurateRunResult> {
    if (
      this.inferencePromise
    ) {
      return Promise.reject(
        new Error(
          'FINAL_RUNTIME_INFERENCE_ALREADY_RUNNING',
        ),
      )
    }

    const operation =
      this.runInternal(
        source,
        onStatus,
      )

    this.inferencePromise =
      operation

    const clearInferenceIfCurrent =
      (): void => {
        if (
          this.inferencePromise ===
          operation
        ) {
          this.inferencePromise = null
        }
      }

    void operation.then(
      clearInferenceIfCurrent,
      clearInferenceIfCurrent,
    )

    return operation
  }

  private async runInternal(
    source:
      HTMLCanvasElement,
    onStatus?:
      FinalRuntimeStatusListener,
  ): Promise<FinalAccurateRunResult> {
    const totalStartedAt =
      performance.now()

    const readiness =
      await this.prepare({
        onStatus,
      })

    const runtimePrepareMs =
      performance.now() -
      totalStartedAt

    if (
      !readiness.ready ||
      !this.readyRuntime
    ) {
      throw new Error(
        'FINAL_RUNTIME_NOT_READY',
      )
    }

    const runGeneration =
      this.generation

    let fallbackOccurred =
      false

    const execute =
      async (): Promise<{
        ready: ReadyRuntime
        prepared:
          ReturnType<
            typeof prepareFinalAccurateInput
          >
        outputData:
          Float32Array
        outputShape: number[]
        inferenceMs: number
      }> => {
        const ready =
          this.readyRuntime

        if (!ready) {
          throw new Error(
            'FINAL_RUNTIME_READY_SESSION_MISSING',
          )
        }

        this.clearReleaseTimer()

        const requestId =
          this.newRequest()

        this.transition('running')

        onStatus?.(
          ready.plan.provider ===
            'webgpu'
            ? 'مدل دقیق روی شتاب‌دهنده گرافیکی در حال اجرا است...'
            : `مدل دقیق روی CPU با ${ready.plan.wasmThreads.toLocaleString('fa-IR')} رشته در حال اجرا است...`,
        )

        const prepared =
          prepareFinalAccurateInput(
            source,
          )

        const inputBufferCandidate =
          prepared.tensorData
            .buffer

        if (
          !(
            inputBufferCandidate instanceof
            ArrayBuffer
          )
        ) {
          throw new Error(
            'FINAL_RUNTIME_INPUT_BUFFER_NOT_TRANSFERABLE',
          )
        }

        const inputBuffer =
          inputBufferCandidate

        this.emit(
          'inference.begin',
          {
            plan:
              ready.plan,
            details: {
              preprocess_ms:
                prepared
                  .preprocessMs,
              source_width:
                prepared
                  .sourceWidth,
              source_height:
                prepared
                  .sourceHeight,
              input_size:
                FINAL_ACCURATE_INPUT_SIZE,
              thread_count:
                ready.plan
                  .provider ===
                  'wasm'
                  ? ready.plan
                      .wasmThreads
                  : 0,
            },
          },
        )

        const output =
          await ready.worker.run({
            generation:
              this.generation,
            transactionId:
              this.activeTransactionId ??
              this.newTransaction(),
            requestId,
            plan:
              ready.plan,
            inputBuffer,
          })

        this.transition('ready')

        return {
          ready,
          prepared,
          outputData:
            new Float32Array(
              output.outputBuffer,
            ),
          outputShape:
            output.outputShape,
          inferenceMs:
            output.inferenceMs,
        }
      }

    let execution:
      Awaited<
        ReturnType<
          typeof execute
        >
      >

    try {
      execution =
        await execute()
    } catch (error) {
      if (
        runGeneration !==
        this.generation
      ) {
        throw runtimeFailureError({
          code: 'cancelled',
          provider: null,
          planId: null,
          phase: 'run',
          retryable: true,
          message:
            'Final inference was cancelled by a runtime release.',
        })
      }

      const failedReady =
        this.readyRuntime

      if (
        failedReady
          ?.plan.provider !==
        'webgpu'
      ) {
        this.failedRuns += 1

        const failure =
          classifyFinalRuntimeError(
            error,
            {
              provider:
                failedReady?.plan
                  .provider ??
                null,
              plan:
                failedReady?.plan ??
                null,
              phase: 'run',
              timeout:
                error instanceof Error &&
                error.name ===
                  'inference-timeout',
            },
          )

        this.lastFailure =
          failure
        this.transition(
          'recording-failure',
        )

        if (failedReady) {
          recordPlanFailure(
            failedReady.fingerprint,
            failedReady.plan,
            failure.code,
          )

          recordDeviceStrategyPlanFailure(
            failedReady.plan,
          )
        }

        this.emit(
          'inference.failed',
          {
            level: 'error',
            plan:
              failedReady?.plan ??
              null,
            details:
              failureTelemetryDetails(
                failure,
              ),
          },
        )

        await this.closeWorker(
          'inference-failed',
        )

        this.transition('idle')

        throw runtimeFailureError(
          failure,
        )
      }

      fallbackOccurred =
        true
      this.failedRuns += 1

      const failure =
        classifyFinalRuntimeError(
          error,
          {
            provider: 'webgpu',
            plan:
              failedReady.plan,
            phase: 'run',
            timeout:
              error instanceof Error &&
              error.name ===
                'inference-timeout',
          },
        )

      recordPlanFailure(
        failedReady.fingerprint,
        failedReady.plan,
        failure.code,
      )

      recordDeviceStrategyPlanFailure(
        failedReady.plan,
      )

      this.lastFailure =
        failure
      this.transition(
        'recording-failure',
      )

      this.emit(
        'inference.webgpu.failed',
        {
          level: 'warning',
          plan:
            failedReady.plan,
          details:
            failureTelemetryDetails(
              failure,
            ),
        },
      )

      onStatus?.(
        'WebGPU این مدل را پایدار اجرا نکرد؛ در حال انتقال کنترل‌شده به Worker سازگار CPU...',
      )

      await this.closeWorker(
        'webgpu-run-failed',
      )

      this.transition('idle')

      await this.prepareInternal({
        forcedProvider:
          'wasm',
        onStatus,
      })

      execution =
        await execute()
    }

    const runtimeSettings =
      getFinalAccurateRuntimeSettings()

    const decoded =
      decodeFinalAccurateOutput(
        execution.outputData,
        execution.outputShape,
        execution.prepared,
        runtimeSettings,
      )

    this.lastInferenceMs =
      execution.inferenceMs
    this.successfulRuns += 1
    this.lastFailure = null

    recordPlanSuccess(
      execution.ready
        .fingerprint,
      execution.ready.plan,
      execution.ready
        .workerReady
        .sessionCreateMs,
      execution.inferenceMs,
    )

    if (this.capabilities) {
      recordDeviceStrategyPlanSuccess(
        execution.ready.plan,
        this.capabilities,
      )
    }

    const result:
      FinalAccurateRunResult = {
        inputShape: [
          1,
          3,
          1152,
          1152,
        ],
        outputShape:
          execution.outputShape,
        outputLength:
          execution.outputData
            .length,
        sourceWidth:
          execution.prepared
            .sourceWidth,
        sourceHeight:
          execution.prepared
            .sourceHeight,
        resizedWidth:
          execution.prepared
            .resizedWidth,
        resizedHeight:
          execution.prepared
            .resizedHeight,
        offsetX:
          execution.prepared
            .padX,
        offsetY:
          execution.prepared
            .padY,
        rawCandidateCount:
          decoded.preNmsCount,
        detections:
          decoded.detections,
        count:
          decoded.detections
            .length,
        confidenceThreshold:
          runtimeSettings
            .confidenceThreshold,
        iouThreshold:
          runtimeSettings
            .iouThreshold,
        preNmsTopK:
          FINAL_ACCURATE_PRE_NMS_TOP_K,
        maximumDetections:
          FINAL_ACCURATE_MAXIMUM_DETECTIONS,
        preprocessMs:
          execution.prepared
            .preprocessMs,
        inferenceMs:
          execution.inferenceMs,
        postprocessMs:
          decoded.postprocessMs,
        totalMs:
          performance.now() -
          totalStartedAt,
        executionProvider:
          execution.ready
            .plan.provider,
        fallbackOccurred,
        modelLoadMs:
          execution.ready
            .modelLoadMs,
        sessionCreateMs:
          execution.ready
            .workerReady
            .sessionCreateMs,
        runtimePrepareMs,
        runtimeProfileId:
          execution.ready
            .plan.planId,
        sessionRetentionMs:
          execution.ready
            .plan.sessionRetentionMs,
        threadCount:
          execution.ready
            .plan.provider ===
            'wasm'
            ? execution.ready
                .plan.wasmThreads
            : 0,
        wasmProxyEnabled:
          false,
        memoryClass:
          execution.ready
            .plan.memoryClass,
        modelVariantId:
          execution.ready
            .plan.modelVariantId,
      }

    this.emit(
      'inference.success',
      {
        plan:
          execution.ready.plan,
        details: {
          count:
            result.count,
          preprocess_ms:
            result.preprocessMs,
          inference_ms:
            result.inferenceMs,
          postprocess_ms:
            result.postprocessMs,
          runtime_prepare_ms:
            result.runtimePrepareMs,
          session_create_ms:
            result.sessionCreateMs,
          total_ms:
            result.totalMs,
          fallback_occurred:
            fallbackOccurred,
          output_shape:
            result.outputShape,
        },
      },
    )

    this.scheduleRelease()

    return result
  }

  release(
    reason: string,
  ): Promise<void> {
    if (this.releasePromise) {
      return this.releasePromise
    }

    const operation =
      this.releaseInternal(
        reason,
      )

    this.releasePromise =
      operation

    const clearReleaseIfCurrent =
      (): void => {
        if (
          this.releasePromise ===
          operation
        ) {
          this.releasePromise = null
        }
      }

    void operation.then(
      clearReleaseIfCurrent,
      clearReleaseIfCurrent,
    )

    return operation
  }

  private async releaseInternal(
    reason: string,
  ): Promise<void> {
    this.generation += 1
    this.prepareFlight.clear()

    if (
      this.stateMachine.state !==
      'releasing'
    ) {
      if (
        this.stateMachine
          .canTransition(
            'releasing',
          )
      ) {
        this.transition(
          'releasing',
        )
      } else {
        this.stateMachine.reset()
        this.transition(
          'releasing',
        )
      }
    }

    this.emit(
      'runtime.release.begin',
      {
        details: {
          reason,
        },
      },
    )

    await this.closeWorker(
      reason,
    )

    this.activeTransactionId =
      null
    this.activeRequestId = null

    this.transition('idle')

    this.emit(
      'runtime.release.end',
      {
        details: {
          reason,
        },
      },
    )
  }

  diagnostics():
    FinalRuntimeDiagnostics {
    return {
      marker:
        FINAL_RUNTIME_MARKER,
      schemaVersion:
        FINAL_RUNTIME_SCHEMA_VERSION,
      generation:
        this.generation,
      state:
        this.stateMachine.state,
      activeTransactionId:
        this.activeTransactionId,
      activeRequestId:
        this.activeRequestId,
      plan:
        this.readyRuntime
          ?.plan ??
        null,
      capabilities:
        this.capabilities,
      lastFailure:
        this.lastFailure,
      lastSessionCreateMs:
        this.lastSessionCreateMs,
      lastInferenceMs:
        this.lastInferenceMs,
      successfulRuns:
        this.successfulRuns,
      failedRuns:
        this.failedRuns,
    }
  }
}

const coordinator =
  new FinalRuntimeCoordinator()

export function prepareFinalRuntime(
  onStatus?:
    FinalRuntimeStatusListener,
): Promise<FinalRuntimeReadiness> {
  return coordinator.prepare({
    onStatus,
  })
}

export function prewarmFinalRuntimeIfRecommended(
  onStatus?:
    FinalRuntimeStatusListener,
): Promise<boolean> {
  return coordinator
    .prewarmIfRecommended(
      onStatus,
    )
}

export function runFinalAccurateModel(
  source:
    HTMLCanvasElement,
  onStatus?:
    FinalRuntimeStatusListener,
): Promise<FinalAccurateRunResult> {
  return coordinator.run(
    source,
    onStatus,
  )
}

export function releaseFinalRuntime(
  reason = 'manual',
): Promise<void> {
  return coordinator.release(
    reason,
  )
}

export function getFinalRuntimeDiagnostics():
  FinalRuntimeDiagnostics {
  return coordinator
    .diagnostics()
}

window.addEventListener(
  'pagehide',
  () => {
    void releaseFinalRuntime(
      'pagehide',
    )
  },
)

document.addEventListener(
  'visibilitychange',
  () => {
    if (
      document.visibilityState ===
      'hidden'
    ) {
      const diagnostics =
        getFinalRuntimeDiagnostics()

      if (
        diagnostics.plan
          ?.memoryClass === 'low'
      ) {
        void releaseFinalRuntime(
          'hidden-low-memory',
        )
      }
    }
  },
)
