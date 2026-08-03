/// <reference lib="webworker" />

import {
  type FinalRuntimePlan,
  type FinalRuntimeProvider,
} from '../protocol'
import {
  type FinalWorkerInboundMessage,
  type FinalWorkerOutboundMessage,
  type WorkerFailurePayload,
} from './protocol'

type OrtTensorData =
  | Float32Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | BigInt64Array
  | BigUint64Array
  | readonly string[]

type OrtTensor = {
  readonly data:
    OrtTensorData
  readonly dims:
    readonly number[]
}

type OrtSession = {
  readonly inputNames:
    readonly string[]
  readonly outputNames:
    readonly string[]
  run: (
    feeds:
      Record<string, unknown>,
  ) => Promise<
    Record<string, OrtTensor>
  >
  release: () => void
}

type OrtRuntime = {
  env: {
    logLevel: string
    wasm: {
      wasmPaths:
        | string
        | {
            mjs: string
            wasm: string
          }
      numThreads: number
      proxy: boolean
      initTimeout: number
    }
    webgpu?: {
      powerPreference?:
        | 'high-performance'
        | 'low-power'
      forceFallbackAdapter?:
        boolean
      device?: {
        lost?: Promise<{
          reason?: string
          message?: string
        }>
      }
    }
  }
  Tensor: new (
    type: 'float32',
    data: Float32Array,
    dims: readonly number[],
  ) => unknown
  InferenceSession: {
    create: (
      model:
        Uint8Array,
      options:
        Record<string, unknown>,
    ) => Promise<OrtSession>
  }
}

const workerScope =
  self as unknown as
    DedicatedWorkerGlobalScope

const runtimeMarker =
  'BESHMARAI_FINAL_WORKER_CLEAN_ROOM_V3'

const ortVersion = '1.27.0'

const ortAssetContractMarker =
  'BESHMARAI_FINAL_ORT_ASSET_CONTRACT_V3'

let workerEntryMarker =
  'BESHMARAI_FINAL_WORKER_ENTRY_UNINITIALIZED_V3'

const inputSize = 1152
const inputElements =
  1 * 3 * inputSize * inputSize
const outputCandidates = 27216
const outputElements =
  1 * 5 * outputCandidates

function errorText(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : String(error)
}

function classifyWorkerFailure(
  error: unknown,
  phase:
    | 'session'
    | 'run',
): WorkerFailurePayload {
  const message =
    errorText(error)

  const normalized =
    message.toLowerCase()

  if (
    normalized.includes(
      'out of memory',
    ) ||
    normalized.includes(
      'memory access out of bounds',
    ) ||
    normalized.includes(
      'allocation failed',
    )
  ) {
    return {
      code:
        'inference-out-of-memory',
      message,
    }
  }

  if (
    normalized.includes(
      'device lost',
    )
  ) {
    return {
      code:
        'webgpu-device-lost',
      message,
    }
  }

  if (
    normalized.includes(
      'io contract',
    ) ||
    normalized.includes(
      'input name',
    ) ||
    normalized.includes(
      'output name',
    )
  ) {
    return {
      code:
        'session-io-contract-invalid',
      message,
    }
  }

  if (
    normalized.includes(
      'output shape',
    ) ||
    normalized.includes(
      'output length',
    ) ||
    normalized.includes(
      'output type',
    )
  ) {
    return {
      code:
        'output-contract-invalid',
      message,
    }
  }

  return {
    code:
      phase === 'session'
        ? 'session-create-failed'
        : 'inference-failed',
    message,
  }
}

function post(
  message:
    FinalWorkerOutboundMessage,
  transfer:
    Transferable[] = [],
): void {
  workerScope.postMessage(
    message,
    transfer,
  )
}

function postEvent(
  input: {
    generation: number
    transactionId: string
    event: string
    provider:
      FinalRuntimeProvider
    details?:
      Record<string, unknown>
  },
): void {
  post({
    kind: 'event',
    generation:
      input.generation,
    transactionId:
      input.transactionId,
    event:
      input.event,
    provider:
      input.provider,
    details: {
      runtime_marker:
        runtimeMarker,
      worker_entry_marker:
        workerEntryMarker,
      ort_asset_contract_marker:
        ortAssetContractMarker,
      ort_version:
        ortVersion,
      ...input.details,
    },
  })
}

function postFailure(
  input: {
    generation: number
    transactionId: string
    requestId: string
    error: unknown
    phase:
      | 'session'
      | 'run'
  },
): void {
  post({
    kind: 'response',
    generation:
      input.generation,
    transactionId:
      input.transactionId,
    requestId:
      input.requestId,
    ok: false,
    failure:
      classifyWorkerFailure(
        input.error,
        input.phase,
      ),
  })
}

function validateOutputShape(
  shape:
    readonly number[],
): void {
  if (
    shape.length !== 3 ||
    shape[0] !== 1 ||
    shape[1] !== 5 ||
    shape[2] !==
      outputCandidates
  ) {
    throw new Error(
      'FINAL_OUTPUT_SHAPE_INVALID=' +
      JSON.stringify(shape),
    )
  }
}

function toFloat32(
  data:
    OrtTensorData,
): Float32Array {
  if (
    data instanceof
    Float32Array
  ) {
    return data
  }

  return new Float32Array(
    Array.from(
      data as
        ArrayLike<number>,
      Number,
    ),
  )
}

export function installFinalWorkerRuntime(
  ort: OrtRuntime,
  provider:
    FinalRuntimeProvider,
  entryMarker: string,
): void {
  workerEntryMarker =
    entryMarker

  let generation = 0
  let transactionId = ''
  let session:
    OrtSession | null = null
  let plan:
    FinalRuntimePlan | null = null
  let inputName = ''
  let outputName = ''
  let deviceLost = false

  const releaseSession =
    (): void => {
      session?.release()
      session = null
      plan = null
      inputName = ''
      outputName = ''
      deviceLost = false
    }

  const configureRuntime =
    (
      selectedPlan:
        FinalRuntimePlan,
    ): void => {
      const baseUrl =
        import.meta.env.BASE_URL ||
        '/'

      const root =
        new URL(
          `${baseUrl}ort-runtime-${ortVersion}/`,
          workerScope.location.origin,
        )

      ort.env.logLevel =
        'warning'
      ort.env.wasm.proxy =
        false
      ort.env.wasm.initTimeout =
        selectedPlan
          .sessionCreateTimeoutMs

      if (
        provider === 'webgpu'
      ) {
        ort.env.wasm.numThreads = 1
        ort.env.wasm.wasmPaths = {
          mjs:
            new URL(
              'ort-wasm-simd-threaded.jsep.mjs',
              root,
            ).href,
          wasm:
            new URL(
              'ort-wasm-simd-threaded.jsep.wasm',
              root,
            ).href,
        }

        if (ort.env.webgpu) {
          ort.env.webgpu
            .powerPreference =
              'high-performance'
          ort.env.webgpu
            .forceFallbackAdapter =
              false
        }

        return
      }

      ort.env.wasm.numThreads =
        selectedPlan.wasmThreads
      ort.env.wasm.wasmPaths = {
        mjs:
          new URL(
            'ort-wasm-simd-threaded.mjs',
            root,
          ).href,
        wasm:
          new URL(
            'ort-wasm-simd-threaded.wasm',
            root,
          ).href,
      }
    }

  const createSession =
    async (
      message:
        Extract<
          FinalWorkerInboundMessage,
          {
            kind: 'init'
          }
        >,
    ): Promise<void> => {
      releaseSession()

      generation =
        message.generation
      transactionId =
        message.transactionId
      plan =
        message.plan

      if (
        plan.provider !==
        provider
      ) {
        throw new Error(
          'FINAL_WORKER_PROVIDER_PLAN_MISMATCH',
        )
      }

      configureRuntime(plan)

      const modelBytes =
        new Uint8Array(
          message.modelBuffer,
        )

      const startedAt =
        performance.now()

      postEvent({
        generation,
        transactionId,
        event:
          'worker.session.create.begin',
        provider,
        details: {
          plan_id:
            plan.planId,
          model_variant_id:
            plan.modelVariantId,
          wasm_threads:
            plan.wasmThreads,
          enable_mem_pattern:
            plan.enableMemPattern,
          enable_cpu_mem_arena:
            plan.enableCpuMemArena,
          graph_optimization_level:
            plan.graphOptimizationLevel,
          graph_capture:
            false,
          cross_origin_isolated:
            workerScope
              .crossOriginIsolated,
          model_size_bytes:
            modelBytes.byteLength,
        },
      })

      try {
        const options:
          Record<string, unknown> = {
            executionProviders: [
              provider,
            ],
            graphOptimizationLevel:
              plan.graphOptimizationLevel,
            executionMode:
              'sequential',
            enableGraphCapture:
              false,
          }

        if (
          provider === 'wasm'
        ) {
          options.enableMemPattern =
            plan.enableMemPattern
          options.enableCpuMemArena =
            plan.enableCpuMemArena
        }

        session =
          await ort
            .InferenceSession
            .create(
              modelBytes,
              options,
            )
      } finally {
        modelBytes.fill(0)
      }

      inputName =
        session.inputNames[0] ??
        ''
      outputName =
        session.outputNames[0] ??
        ''

      if (
        inputName !== 'images' ||
        outputName !== 'output0'
      ) {
        releaseSession()
        throw new Error(
          'FINAL_SESSION_IO_CONTRACT_INVALID=' +
          `${inputName}/${outputName}`,
        )
      }

      if (
        provider === 'webgpu'
      ) {
        const lost =
          ort.env.webgpu
            ?.device
            ?.lost

        if (lost) {
          void lost.then(
            (info) => {
              deviceLost = true

              postEvent({
                generation,
                transactionId,
                event:
                  'worker.webgpu.device_lost',
                provider,
                details: {
                  reason:
                    info.reason ??
                    'unknown',
                  message:
                    info.message ??
                    '',
                },
              })
            },
          )
        }
      }

      const sessionCreateMs =
        performance.now() -
        startedAt

      postEvent({
        generation,
        transactionId,
        event:
          'worker.session.create.end',
        provider,
        details: {
          plan_id:
            plan.planId,
          session_create_ms:
            sessionCreateMs,
          wasm_threads:
            provider === 'wasm'
              ? plan.wasmThreads
              : 0,
        },
      })

      post({
        kind: 'response',
        generation,
        transactionId,
        requestId:
          message.requestId,
        ok: true,
        payload: {
          provider,
          inputName,
          outputName,
          sessionCreateMs,
          threadCount:
            provider === 'wasm'
              ? plan.wasmThreads
              : 0,
        },
      })
    }

  const run =
    async (
      message:
        Extract<
          FinalWorkerInboundMessage,
          {
            kind: 'run'
          }
        >,
    ): Promise<void> => {
      if (
        message.generation !==
          generation ||
        message.transactionId !==
          transactionId
      ) {
        throw new Error(
          'FINAL_STALE_WORKER_REQUEST',
        )
      }

      if (
        !session ||
        !plan ||
        !inputName ||
        !outputName
      ) {
        throw new Error(
          'FINAL_SESSION_NOT_READY',
        )
      }

      if (deviceLost) {
        throw new Error(
          'FINAL_WEBGPU_DEVICE_LOST',
        )
      }

      const inputData =
        new Float32Array(
          message.inputBuffer,
        )

      if (
        inputData.length !==
        inputElements
      ) {
        throw new Error(
          'FINAL_INPUT_LENGTH_INVALID=' +
          `${inputData.length}/${inputElements}`,
        )
      }

      const tensorStartedAt =
        performance.now()

      const tensor =
        new ort.Tensor(
          'float32',
          inputData,
          [
            1,
            3,
            inputSize,
            inputSize,
          ],
        )

      const tensorCreateMs =
        performance.now() -
        tensorStartedAt

      const inferenceStartedAt =
        performance.now()

      postEvent({
        generation,
        transactionId,
        event:
          'worker.inference.begin',
        provider,
        details: {
          plan_id:
            plan.planId,
          wasm_threads:
            provider === 'wasm'
              ? plan.wasmThreads
              : 0,
        },
      })

      const outputs =
        await session.run({
          [inputName]:
            tensor,
        })

      const inferenceMs =
        performance.now() -
        inferenceStartedAt

      const output =
        outputs[outputName]

      if (!output) {
        throw new Error(
          'FINAL_OUTPUT_MISSING',
        )
      }

      const outputShape =
        Array.from(
          output.dims,
          Number,
        )

      validateOutputShape(
        outputShape,
      )

      const outputData =
        toFloat32(
          output.data,
        )

      if (
        outputData.length !==
        outputElements
      ) {
        throw new Error(
          'FINAL_OUTPUT_LENGTH_INVALID=' +
          `${outputData.length}/${outputElements}`,
        )
      }

      const copyStartedAt =
        performance.now()

      const outputCopy =
        outputData.slice()

      const outputCopyMs =
        performance.now() -
        copyStartedAt

      postEvent({
        generation,
        transactionId,
        event:
          'worker.inference.end',
        provider,
        details: {
          plan_id:
            plan.planId,
          inference_ms:
            inferenceMs,
          tensor_create_ms:
            tensorCreateMs,
          output_copy_ms:
            outputCopyMs,
        },
      })

      post(
        {
          kind: 'response',
          generation,
          transactionId,
          requestId:
            message.requestId,
          ok: true,
          payload: {
            provider,
            outputBuffer:
              outputCopy.buffer,
            outputShape,
            inferenceMs,
            tensorCreateMs,
            outputCopyMs,
          },
        },
        [
          outputCopy.buffer,
        ],
      )
    }

  workerScope.addEventListener(
    'message',
    (
      event:
        MessageEvent<
          FinalWorkerInboundMessage
        >,
    ) => {
      const message =
        event.data

      void (async () => {
        if (
          message.kind === 'init'
        ) {
          try {
            await createSession(
              message,
            )
          } catch (error) {
            postFailure({
              generation:
                message.generation,
              transactionId:
                message.transactionId,
              requestId:
                message.requestId,
              error,
              phase: 'session',
            })
          }
          return
        }

        if (
          message.kind === 'run'
        ) {
          try {
            await run(message)
          } catch (error) {
            postFailure({
              generation:
                message.generation,
              transactionId:
                message.transactionId,
              requestId:
                message.requestId,
              error,
              phase: 'run',
            })
          }
          return
        }

        releaseSession()

        post({
          kind: 'response',
          generation:
            message.generation,
          transactionId:
            message.transactionId,
          requestId:
            message.requestId,
          ok: true,
          payload: {
            released: true,
          },
        })
      })()
    },
  )

  postEvent({
    generation: 0,
    transactionId: 'boot',
    event: 'worker.boot',
    provider,
    details: {
      cross_origin_isolated:
        workerScope
          .crossOriginIsolated,
      hardware_concurrency:
        workerScope.navigator
          .hardwareConcurrency ??
        1,
    },
  })
}
