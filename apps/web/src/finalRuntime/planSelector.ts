import {
  type FinalRuntimeCapabilities,
  type FinalRuntimePlan,
} from './protocol'
import {
  createPlanFingerprint,
  planHistoryScore,
} from './planStore'
import {
  resolveFinalModelVariant,
} from './modelRegistry'
import {
  readDeviceStrategy,
  type DeviceStrategy,
} from './deviceStrategy'

function supportedWasmThreads(
  capabilities:
    FinalRuntimeCapabilities,
): readonly (1 | 2 | 4)[] {
  if (
    !capabilities.crossOriginIsolated ||
    !capabilities.sharedArrayBuffer ||
    !capabilities.atomics
  ) {
    return [1]
  }

  /*
   * Runtime construction dominated measured end-to-end latency.
   * Verified WebGPU is still selected first. Mobile starts directly with
   * the stable one-thread Worker instead of paying a failed thread timeout.
   */
  if (
    capabilities.mobileLike
  ) {
    if (
      capabilities.memoryClass !==
        'low' &&
      capabilities
        .hardwareConcurrency >= 6
    ) {
      return [2, 1]
    }

    return [1]
  }

  if (
    capabilities.memoryClass ===
      'high' &&
    capabilities
      .hardwareConcurrency >= 8
  ) {
    return [4, 2, 1]
  }

  if (
    capabilities.memoryClass !==
      'low' &&
    capabilities
      .hardwareConcurrency >= 6
  ) {
    return [2, 1]
  }

  return [1]
}

function wasmPlan(
  capabilities: FinalRuntimeCapabilities,
  threads: 1 | 2 | 4,
  strategy?: DeviceStrategy,
): FinalRuntimePlan {
  const model = resolveFinalModelVariant('wasm')
  const profile =
    threads === 4 ? 'fast' : threads === 2 ? 'balanced' : 'safe'

  /*
   * Keep a successful session throughout the camera workflow.
   * Page lifecycle and the retention timer remain the release boundaries.
   */
  const retention =
    30 * 60_000

  return {
    planId: `wasm-${threads}t-${profile}-${model.id}`,
    provider: 'wasm',
    modelVariantId: model.id,
    wasmThreads: threads,
    enableMemPattern:
      strategy?.enableMemPattern ??
      false,
    enableCpuMemArena:
      strategy?.enableCpuMemArena ??
      false,
    graphOptimizationLevel:
      strategy?.graphOptimizationLevel ??
      'basic',
    graphCapture: false,
    sessionRetentionMs: retention,
    workerBootTimeoutMs: 20_000,
    sessionCreateTimeoutMs:
      threads === 2
        ? 75_000
        : 120_000,
    inferenceTimeoutMs:
      threads === 2
        ? 120_000
        : 180_000,
    memoryClass: capabilities.memoryClass,
    prewarm: false,
    source:
      strategy
        ? 'stored-strategy'
        : threads === 1
          ? 'safe-fallback'
          : 'capability-profile',
  }
}

function webGpuPlan(
  capabilities:
    FinalRuntimeCapabilities,
  strategy?: DeviceStrategy,
): FinalRuntimePlan | null {
  const gpu =
    capabilities.webGpu

  if (
    !gpu.available ||
    !gpu.computeVerified
  ) {
    return null
  }

  /*
   * The current 80.8 MB FP32 model needs substantial
   * transient GPU and WASM memory during session creation.
   * These limits are deliberately conservative.
   */
  if (
    gpu.maximumBufferBytes > 0 &&
    gpu.maximumBufferBytes <
      128 * 1024 * 1024
  ) {
    return null
  }

  if (
    gpu.maximumStorageBindingBytes > 0 &&
    gpu.maximumStorageBindingBytes <
      64 * 1024 * 1024
  ) {
    return null
  }

  const model =
    resolveFinalModelVariant(
      'webgpu',
    )

  return {
    planId:
      `webgpu-${model.id}`,
    provider: 'webgpu',
    modelVariantId:
      model.id,
    wasmThreads: 1,
    enableMemPattern: false,
    enableCpuMemArena: false,
    graphOptimizationLevel:
      'all',
    graphCapture: false,
    sessionRetentionMs:
      capabilities.memoryClass ===
        'high'
        ? 15 * 60_000
        : capabilities.memoryClass ===
            'medium'
          ? 4 * 60_000
          : 60_000,
    workerBootTimeoutMs:
      20_000,
    sessionCreateTimeoutMs:
      120_000,
    inferenceTimeoutMs:
      90_000,
    memoryClass:
      capabilities.memoryClass,
    prewarm:
      capabilities.memoryClass ===
      'high',
    source:
      strategy
        ? 'stored-strategy'
        : 'capability-profile',
  }
}

export function selectFinalRuntimePlans(
  capabilities:
    FinalRuntimeCapabilities,
): {
  fingerprint: string
  plans: FinalRuntimePlan[]
} {
  const fingerprint =
    createPlanFingerprint(
      capabilities,
    )

  const candidates:
    FinalRuntimePlan[] = []

  const storedStrategy =
    readDeviceStrategy()

  if (storedStrategy) {
    if (
      storedStrategy.provider ===
        'webgpu'
    ) {
      const storedWebGpu =
        webGpuPlan(
          storedStrategy.capabilities,
          storedStrategy,
        )

      if (storedWebGpu) {
        candidates.push(
          storedWebGpu,
        )
      }
    }

    candidates.push(
      wasmPlan(
        storedStrategy.capabilities,
        storedStrategy.wasmThreads,
        storedStrategy.provider ===
          'wasm'
          ? storedStrategy
          : undefined,
      ),
    )

    if (
      storedStrategy.wasmThreads !== 1
    ) {
      candidates.push(
        wasmPlan(
          storedStrategy.capabilities,
          1,
        ),
      )
    }
  }

  const webGpu =
    storedStrategy
      ? null
      : webGpuPlan(
          capabilities,
        )

  if (webGpu) {
    candidates.push(
      webGpu,
    )
  }

  if (!storedStrategy) {
    candidates.push(
      ...supportedWasmThreads(capabilities).map(
        (threads) => wasmPlan(capabilities, threads),
      ),
    )
  }

  const enabled =
    candidates.filter(
      (plan) =>
        !planHistoryScore(
          fingerprint,
          plan,
        ).disabled,
    )

  const available =
    enabled.length > 0
      ? enabled
      : candidates

  available.sort(
    (first, second) => {
      const firstHistory =
        planHistoryScore(
          fingerprint,
          first,
        )

      const secondHistory =
        planHistoryScore(
          fingerprint,
          second,
        )

      const firstStoredStrategy =
        first.source ===
          'stored-strategy'

      const secondStoredStrategy =
        second.source ===
          'stored-strategy'

      if (
        firstStoredStrategy !==
        secondStoredStrategy
      ) {
        return firstStoredStrategy
          ? -1
          : 1
      }

      if (
        firstHistory.measured &&
        secondHistory.measured
      ) {
        const reliabilityDelta =
          secondHistory.reliability -
          firstHistory.reliability

        if (
          Math.abs(
            reliabilityDelta,
          ) > 0.1
        ) {
          return reliabilityDelta
        }

        return (
          firstHistory.inferenceMs -
          secondHistory.inferenceMs
        )
      }

      if (
        firstHistory.measured !==
        secondHistory.measured
      ) {
        return firstHistory.measured
          ? -1
          : 1
      }

      if (
        first.provider !==
        second.provider
      ) {
        return first.provider ===
          'webgpu'
          ? -1
          : 1
      }

      return (
        second.wasmThreads -
        first.wasmThreads
      )
    },
  )

  return {
    fingerprint,
    plans:
      available.map(
        (plan, index) => ({
          ...plan,
          source:
            planHistoryScore(
              fingerprint,
              plan,
            ).measured
              ? 'measured-history'
              : index === 0
                ? plan.source
                : 'safe-fallback',
        }),
      ),
  }
}
