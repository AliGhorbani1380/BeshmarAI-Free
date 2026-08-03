import {
  type FinalRuntimeFailure,
  type FinalRuntimeFailureCode,
  type FinalRuntimePlan,
  type FinalRuntimeProvider,
} from './protocol'

export class FinalRuntimeError extends Error {
  readonly failure:
    FinalRuntimeFailure

  constructor(
    failure:
      FinalRuntimeFailure,
  ) {
    super(failure.message)
    this.name = 'FinalRuntimeError'
    this.failure = failure
  }
}

function normalizedErrorText(
  error: unknown,
): string {
  if (error instanceof Error) {
    return (
      `${error.name}: ${error.message}`
    ).toLowerCase()
  }

  return String(error)
    .toLowerCase()
}

export function classifyFinalRuntimeError(
  error: unknown,
  input: {
    provider:
      FinalRuntimeProvider | null
    plan:
      FinalRuntimePlan | null
    phase:
      FinalRuntimeFailure['phase']
    timeout?: boolean
    cancelled?: boolean
  },
): FinalRuntimeFailure {
  if (
    error instanceof
      FinalRuntimeError
  ) {
    return error.failure
  }

  const text =
    normalizedErrorText(error)

  const typedName =
    error instanceof Error
      ? error.name as
          FinalRuntimeFailureCode
      : null

  const typedFailureNames:
    readonly FinalRuntimeFailureCode[] = [
      'runtime-asset-load-failed',
      'session-create-failed',
      'session-io-contract-invalid',
      'inference-failed',
      'inference-out-of-memory',
      'webgpu-device-lost',
      'output-contract-invalid',
      'worker-boot-timeout',
      'worker-script-error',
      'worker-message-error',
      'session-create-timeout',
      'inference-timeout',
    ]

  let code:
    FinalRuntimeFailureCode =
      'unknown'

  if (input.cancelled) {
    code = 'cancelled'
  } else if (
    typedName &&
    typedFailureNames.includes(
      typedName,
    )
  ) {
    code = typedName
  } else if (input.timeout) {
    code =
      input.phase === 'session'
        ? 'session-create-timeout'
        : input.phase === 'run'
          ? 'inference-timeout'
          : input.phase === 'worker'
            ? 'worker-boot-timeout'
            : 'unknown'
  } else if (
    text.includes('out of memory') ||
    text.includes('memory access out of bounds') ||
    text.includes('allocation failed')
  ) {
    code = 'inference-out-of-memory'
  } else if (
    text.includes('device lost') ||
    text.includes('gpudevicelost')
  ) {
    code = 'webgpu-device-lost'
  } else if (
    text.includes('io names') ||
    text.includes('input name') ||
    text.includes('output name')
  ) {
    code =
      'session-io-contract-invalid'
  } else if (
    text.includes('output shape') ||
    text.includes('output length') ||
    text.includes('output type')
  ) {
    code =
      'output-contract-invalid'
  } else if (
    text.includes('decrypt') ||
    text.includes('بازکردن امن')
  ) {
    code = 'model-decrypt-failed'
  } else if (
    text.includes('sha256') ||
    text.includes('integrity') ||
    text.includes('حجم مدل')
  ) {
    code = 'model-integrity-failed'
  } else if (
    text.includes('worker script')
  ) {
    code = 'worker-script-error'
  } else if (
    text.includes('messageerror')
  ) {
    code = 'worker-message-error'
  } else if (
    input.phase === 'session'
  ) {
    code = 'session-create-failed'
  } else if (
    input.phase === 'run'
  ) {
    code = 'inference-failed'
  } else if (
    input.phase === 'model'
  ) {
    code = 'model-load-failed'
  }

  return {
    code,
    provider:
      input.provider,
    planId:
      input.plan?.planId ??
      null,
    phase:
      input.phase,
    retryable:
      code !==
        'model-integrity-failed' &&
      code !==
        'session-io-contract-invalid' &&
      code !==
        'output-contract-invalid',
    message:
      error instanceof Error
        ? error.message
        : String(error),
  }
}

export function runtimeFailureError(
  failure:
    FinalRuntimeFailure,
): FinalRuntimeError {
  return new FinalRuntimeError(
    failure,
  )
}
