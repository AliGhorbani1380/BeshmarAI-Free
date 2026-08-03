import {
  FINAL_RUNTIME_MARKER,
  FINAL_RUNTIME_SCHEMA_VERSION,
  type FinalRuntimeFailure,
  type FinalRuntimePlan,
  type FinalRuntimeProvider,
  type FinalRuntimeState,
} from './protocol'

type FinalRuntimeTelemetryLevel =
  | 'debug'
  | 'info'
  | 'warning'
  | 'error'

export type FinalRuntimeTelemetryEvent = {
  marker: string
  schemaVersion: number
  event: string
  level: FinalRuntimeTelemetryLevel
  clientTime: string
  elapsedMs: number
  generation: number
  transactionId: string | null
  requestId: string | null
  provider: FinalRuntimeProvider | null
  planId: string | null
  state: FinalRuntimeState
  details: Record<string, unknown>
}

const startedAt =
  performance.now()

const forbiddenDetailKeys =
  /image|frame|crop|tensor|box|coordinate|modelbytes|model_bytes|key|token|phone|otp|authorization/i

function sanitizeDetails(
  details:
    Record<string, unknown>,
): Record<string, unknown> {
  const output:
    Record<string, unknown> = {}

  for (
    const [
      key,
      value,
    ] of Object.entries(details)
  ) {
    if (
      forbiddenDetailKeys.test(key)
    ) {
      output[key] =
        '[REDACTED]'
      continue
    }

    if (
      typeof value ===
        'string' &&
      value.length > 500
    ) {
      output[key] =
        value.slice(0, 500)
      continue
    }

    output[key] = value
  }

  return output
}

export function emitFinalRuntimeTelemetry(
  input: {
    event: string
    level?:
      FinalRuntimeTelemetryLevel
    generation: number
    transactionId:
      string | null
    requestId:
      string | null
    provider:
      FinalRuntimeProvider | null
    plan:
      FinalRuntimePlan | null
    state:
      FinalRuntimeState
    details?:
      Record<string, unknown>
  },
): void {
  const payload:
    FinalRuntimeTelemetryEvent = {
      marker:
        FINAL_RUNTIME_MARKER,
      schemaVersion:
        FINAL_RUNTIME_SCHEMA_VERSION,
      event:
        input.event,
      level:
        input.level ??
        'info',
      clientTime:
        new Date().toISOString(),
      elapsedMs:
        performance.now() -
        startedAt,
      generation:
        input.generation,
      transactionId:
        input.transactionId,
      requestId:
        input.requestId,
      provider:
        input.provider,
      planId:
        input.plan?.planId ??
        null,
      state:
        input.state,
      details:
        sanitizeDetails(
          input.details ??
          {},
        ),
    }

  console.info(
    'BESHMARAI_FINAL_RUNTIME_EVENT',
    payload,
  )

  window.dispatchEvent(
    new CustomEvent(
      'beshmarai:final-runtime-event',
      {
        detail: payload,
      },
    ),
  )
}

export function failureTelemetryDetails(
  failure:
    FinalRuntimeFailure,
): Record<string, unknown> {
  return {
    failure_code:
      failure.code,
    failure_phase:
      failure.phase,
    failure_retryable:
      failure.retryable,
    failure_message:
      failure.message,
  }
}
