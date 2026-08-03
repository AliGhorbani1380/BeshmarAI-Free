// BESHMARAI_FINAL_RUNTIME_CLEAN_ROOM_V3

export const FINAL_RUNTIME_SCHEMA_VERSION = 6
export const FINAL_RUNTIME_ORT_VERSION = '1.27.0'
export const FINAL_RUNTIME_MODEL_VERSION = 'web-v1-final-fp32-1152'
export const FINAL_RUNTIME_MARKER =
  'BESHMARAI_FINAL_RUNTIME_CLEAN_ROOM_V3'

export type FinalRuntimeProvider =
  | 'webgpu'
  | 'wasm'

export type FinalRuntimeState =
  | 'idle'
  | 'profiling'
  | 'selecting-plan'
  | 'loading-model'
  | 'creating-session'
  | 'ready'
  | 'running'
  | 'recording-failure'
  | 'releasing'
  | 'unavailable'

export type FinalRuntimeMemoryClass =
  | 'low'
  | 'medium'
  | 'high'

export type FinalRuntimeModelVariantId =
  | 'final-fp32-1152'
  | 'final-fp16-1152'
  | 'final-u8-1152'
  | 'final-u8-balanced'

export type FinalRuntimeFailureCode =
  | 'cancelled'
  | 'capability-webgpu-unavailable'
  | 'capability-webgpu-probe-timeout'
  | 'capability-webgpu-probe-failed'
  | 'capability-wasm-threads-unavailable'
  | 'runtime-asset-load-failed'
  | 'runtime-asset-version-mismatch'
  | 'model-unavailable'
  | 'model-load-failed'
  | 'model-decrypt-failed'
  | 'model-integrity-failed'
  | 'worker-boot-timeout'
  | 'worker-script-error'
  | 'worker-message-error'
  | 'session-create-timeout'
  | 'session-create-failed'
  | 'session-io-contract-invalid'
  | 'inference-timeout'
  | 'inference-failed'
  | 'inference-out-of-memory'
  | 'webgpu-device-lost'
  | 'output-contract-invalid'
  | 'stale-worker-response'
  | 'illegal-state-transition'
  | 'all-plans-exhausted'
  | 'unknown'

export type FinalRuntimeFailure = {
  code: FinalRuntimeFailureCode
  provider: FinalRuntimeProvider | null
  planId: string | null
  phase:
    | 'profile'
    | 'select'
    | 'model'
    | 'worker'
    | 'session'
    | 'run'
    | 'release'
  retryable: boolean
  message: string
}

export type FinalRuntimeWebGpuProbe = {
  available: boolean
  computeVerified: boolean
  durationMs: number
  maximumBufferBytes: number
  maximumStorageBindingBytes: number
  maximumComputeInvocations: number
  shaderF16: boolean
  subgroups: boolean
  failureCode:
    | 'unavailable'
    | 'timeout'
    | 'request-adapter'
    | 'request-device'
    | 'compute'
    | null
}

export type FinalRuntimeCapabilities = {
  secureContext: boolean
  crossOriginIsolated: boolean
  sharedArrayBuffer: boolean
  atomics: boolean
  hardwareConcurrency: number
  deviceMemoryGb: number
  saveData: boolean
  mobileLike: boolean
  memoryClass: FinalRuntimeMemoryClass
  webGpu: FinalRuntimeWebGpuProbe
}

export type FinalRuntimePlan = {
  planId: string
  provider: FinalRuntimeProvider
  modelVariantId: FinalRuntimeModelVariantId
  wasmThreads: 1 | 2 | 4
  enableMemPattern: boolean
  enableCpuMemArena: boolean
  graphOptimizationLevel:
    | 'disabled'
    | 'basic'
    | 'extended'
    | 'all'
  graphCapture: false
  sessionRetentionMs: number
  workerBootTimeoutMs: number
  sessionCreateTimeoutMs: number
  inferenceTimeoutMs: number
  memoryClass: FinalRuntimeMemoryClass
  prewarm: boolean
  source:
    | 'measured-history'
    | 'capability-profile'
    | 'stored-strategy'
    | 'safe-fallback'
}

export type FinalRuntimeReadiness = {
  ready: boolean
  state: FinalRuntimeState
  plan: FinalRuntimePlan | null
  capabilities: FinalRuntimeCapabilities | null
  initializedAtMs: number | null
  sessionCreateMs: number
  failure: FinalRuntimeFailure | null
}

export type FinalRuntimeDiagnostics = {
  marker: string
  schemaVersion: number
  generation: number
  state: FinalRuntimeState
  activeTransactionId: string | null
  activeRequestId: string | null
  plan: FinalRuntimePlan | null
  capabilities: FinalRuntimeCapabilities | null
  lastFailure: FinalRuntimeFailure | null
  lastSessionCreateMs: number
  lastInferenceMs: number
  successfulRuns: number
  failedRuns: number
}

export type FinalRuntimeStatusListener = (
  message: string,
) => void
