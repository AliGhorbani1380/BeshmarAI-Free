import {
  type FinalRuntimePlan,
  type FinalRuntimeProvider,
} from '../protocol'

export type WorkerInitMessage = {
  kind: 'init'
  generation: number
  transactionId: string
  requestId: string
  plan: FinalRuntimePlan
  modelBuffer: ArrayBuffer
}

export type WorkerRunMessage = {
  kind: 'run'
  generation: number
  transactionId: string
  requestId: string
  inputBuffer: ArrayBuffer
}

export type WorkerReleaseMessage = {
  kind: 'release'
  generation: number
  transactionId: string
  requestId: string
}

export type FinalWorkerInboundMessage =
  | WorkerInitMessage
  | WorkerRunMessage
  | WorkerReleaseMessage

export type WorkerReadyPayload = {
  provider: FinalRuntimeProvider
  inputName: string
  outputName: string
  sessionCreateMs: number
  threadCount: number
}

export type WorkerRunPayload = {
  provider: FinalRuntimeProvider
  outputBuffer: ArrayBuffer
  outputShape: number[]
  inferenceMs: number
  tensorCreateMs: number
  outputCopyMs: number
}

export type WorkerReleasePayload = {
  released: true
}

export type WorkerFailurePayload = {
  code:
    | 'runtime-asset-load-failed'
    | 'session-create-failed'
    | 'session-io-contract-invalid'
    | 'inference-failed'
    | 'inference-out-of-memory'
    | 'webgpu-device-lost'
    | 'output-contract-invalid'
    | 'unknown'
  message: string
}

export type WorkerSuccessMessage = {
  kind: 'response'
  generation: number
  transactionId: string
  requestId: string
  ok: true
  payload:
    | WorkerReadyPayload
    | WorkerRunPayload
    | WorkerReleasePayload
}

export type WorkerFailureMessage = {
  kind: 'response'
  generation: number
  transactionId: string
  requestId: string
  ok: false
  failure: WorkerFailurePayload
}

export type WorkerEventMessage = {
  kind: 'event'
  generation: number
  transactionId: string
  event: string
  provider:
    FinalRuntimeProvider
  details:
    Record<string, unknown>
}

export type FinalWorkerOutboundMessage =
  | WorkerSuccessMessage
  | WorkerFailureMessage
  | WorkerEventMessage
