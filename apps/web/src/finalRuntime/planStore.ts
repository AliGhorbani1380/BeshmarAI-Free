import {
  FINAL_RUNTIME_MODEL_VERSION,
  FINAL_RUNTIME_ORT_VERSION,
  FINAL_RUNTIME_SCHEMA_VERSION,
  type FinalRuntimeCapabilities,
  type FinalRuntimeFailureCode,
  type FinalRuntimePlan,
} from './protocol'

type StoredPlanStats = {
  planId: string
  successfulRuns: number
  failedRuns: number
  averageSessionCreateMs: number
  averageInferenceMs: number
  disabledUntilMs: number
  lastFailureCode:
    FinalRuntimeFailureCode | null
}

type StoredPlanHistory = {
  version: 1
  fingerprint: string
  updatedAtMs: number
  plans:
    Record<
      string,
      StoredPlanStats
    >
}

const storageKey =
  'beshmarai_final_runtime_plan_history_v5'

function browserFingerprint():
  string {
  const navigation =
    navigator as Navigator & {
      userAgentData?: {
        brands?: readonly {
          brand: string
          version: string
        }[]
        mobile?: boolean
      }
    }

  const brands =
    navigation.userAgentData
      ?.brands
      ?.map(
        (item) =>
          `${item.brand}:${item.version.split('.')[0]}`,
      )
      .sort()
      .join('|') ??
    navigator.userAgent
      .replace(
        /\d+\.\d+(?:\.\d+)*/g,
        (version) =>
          version.split('.')[0],
      )
      .slice(0, 160)

  return brands
}

export function createPlanFingerprint(
  capabilities:
    FinalRuntimeCapabilities,
): string {
  return [
    `schema:${FINAL_RUNTIME_SCHEMA_VERSION}`,
    `ort:${FINAL_RUNTIME_ORT_VERSION}`,
    `model:${FINAL_RUNTIME_MODEL_VERSION}`,
    `browser:${browserFingerprint()}`,
    `mobile:${capabilities.mobileLike}`,
    `memory:${capabilities.memoryClass}`,
    `cores:${Math.min(16, capabilities.hardwareConcurrency)}`,
    `isolated:${capabilities.crossOriginIsolated}`,
    `webgpu:${capabilities.webGpu.computeVerified}`,
    `gpu-buffer:${Math.floor(capabilities.webGpu.maximumBufferBytes / (64 * 1024 * 1024))}`,
  ].join(';')
}

function emptyHistory(
  fingerprint: string,
): StoredPlanHistory {
  return {
    version: 1,
    fingerprint,
    updatedAtMs: 0,
    plans: {},
  }
}

export function readPlanHistory(
  fingerprint: string,
): StoredPlanHistory {
  try {
    const raw =
      window.localStorage.getItem(
        storageKey,
      )

    if (!raw) {
      return emptyHistory(
        fingerprint,
      )
    }

    const parsed =
      JSON.parse(raw) as
        Partial<StoredPlanHistory>

    if (
      parsed.version !== 1 ||
      parsed.fingerprint !==
        fingerprint ||
      !parsed.plans
    ) {
      return emptyHistory(
        fingerprint,
      )
    }

    return {
      version: 1,
      fingerprint,
      updatedAtMs:
        typeof parsed.updatedAtMs ===
          'number'
          ? parsed.updatedAtMs
          : 0,
      plans:
        parsed.plans,
    }
  } catch {
    return emptyHistory(
      fingerprint,
    )
  }
}

function writeHistory(
  history:
    StoredPlanHistory,
): void {
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...history,
        updatedAtMs:
          Date.now(),
      }),
    )
  } catch {
    // Performance history is best effort.
  }
}

function movingAverage(
  previous: number,
  value: number,
  previousCount: number,
): number {
  if (
    previous <= 0 ||
    previousCount <= 0
  ) {
    return value
  }

  const weight =
    1 /
    Math.min(
      8,
      previousCount + 1,
    )

  return (
    previous * (1 - weight) +
    value * weight
  )
}

function statsFor(
  history:
    StoredPlanHistory,
  planId: string,
): StoredPlanStats {
  return history.plans[
    planId
  ] ?? {
    planId,
    successfulRuns: 0,
    failedRuns: 0,
    averageSessionCreateMs: 0,
    averageInferenceMs: 0,
    disabledUntilMs: 0,
    lastFailureCode: null,
  }
}

export function recordPlanSuccess(
  fingerprint: string,
  plan:
    FinalRuntimePlan,
  sessionCreateMs: number,
  inferenceMs: number,
): void {
  const history =
    readPlanHistory(
      fingerprint,
    )

  const stats =
    statsFor(
      history,
      plan.planId,
    )

  const previousCount =
    stats.successfulRuns

  stats.successfulRuns += 1
  stats.averageSessionCreateMs =
    movingAverage(
      stats.averageSessionCreateMs,
      sessionCreateMs,
      previousCount,
    )
  stats.averageInferenceMs =
    movingAverage(
      stats.averageInferenceMs,
      inferenceMs,
      previousCount,
    )
  stats.disabledUntilMs = 0
  stats.lastFailureCode = null

  history.plans[
    plan.planId
  ] = stats

  writeHistory(history)
}

export function recordPlanFailure(
  fingerprint: string,
  plan:
    FinalRuntimePlan,
  code:
    FinalRuntimeFailureCode,
): void {
  const history =
    readPlanHistory(
      fingerprint,
    )

  const stats =
    statsFor(
      history,
      plan.planId,
    )

  stats.failedRuns += 1
  stats.lastFailureCode = code

  const cooldownMs =
    code ===
      'webgpu-device-lost'
      ? 30 * 60_000
      : code ===
          'inference-out-of-memory'
        ? 24 * 60 * 60_000
        : code ===
            'session-create-timeout'
          ? 6 * 60 * 60_000
          : 60 * 60_000

  stats.disabledUntilMs =
    Date.now() +
    cooldownMs

  history.plans[
    plan.planId
  ] = stats

  writeHistory(history)
}

export function planHistoryScore(
  fingerprint: string,
  plan:
    FinalRuntimePlan,
): {
  disabled: boolean
  measured: boolean
  inferenceMs: number
  reliability: number
} {
  const history =
    readPlanHistory(
      fingerprint,
    )

  const stats =
    statsFor(
      history,
      plan.planId,
    )

  const attempts =
    stats.successfulRuns +
    stats.failedRuns

  return {
    disabled:
      stats.disabledUntilMs >
      Date.now(),
    measured:
      stats.successfulRuns > 0 &&
      stats.averageInferenceMs > 0,
    inferenceMs:
      stats.averageInferenceMs,
    reliability:
      attempts > 0
        ? stats.successfulRuns /
          attempts
        : 0.5,
  }
}

export function clearFinalRuntimePlanHistory():
  void {
  try {
    window.localStorage.removeItem(
      storageKey,
    )
  } catch {
    // Best effort.
  }
}
