import {
  FINAL_RUNTIME_MODEL_VERSION,
  FINAL_RUNTIME_ORT_VERSION,
  FINAL_RUNTIME_SCHEMA_VERSION,
  type FinalRuntimeCapabilities,
  type FinalRuntimePlan,
  type FinalRuntimeProvider,
} from './protocol'

// BESHMARAI_DEVICE_STRATEGY_STORE_SAFE_V2

export const DEVICE_STRATEGY_RUNTIME_MARKER =
  'BESHMARAI_DEVICE_STRATEGY_STORE_SAFE_V2'

export type DeviceStrategy = {
  version: 1
  fingerprint: string
  createdAtMs: number
  expiresAtMs: number
  capabilities:
    FinalRuntimeCapabilities
  provider:
    FinalRuntimeProvider
  wasmThreads: 1 | 2 | 4
  previewThreads: 1 | 2 | 4
  graphOptimizationLevel:
    | 'basic'
    | 'extended'
    | 'all'
  enableMemPattern: boolean
  enableCpuMemArena: boolean
  backgroundPrewarm: boolean
  failureCount: number
  source: 'one-time-autotune-safe'
}

const storageKey =
  'beshmarai_device_strategy_safe_v2'

const strategyMaximumAgeMs =
  30 * 24 * 60 * 60_000

type NavigatorFingerprint =
  Navigator & {
    deviceMemory?: number
    userAgentData?: {
      mobile?: boolean
      brands?: readonly {
        brand: string
        version: string
      }[]
    }
    gpu?: unknown
  }

function browserMajorFingerprint():
  string {
  const navigation =
    navigator as
      NavigatorFingerprint

  const brands =
    navigation.userAgentData
      ?.brands
      ?.map(
        (item) =>
          `${item.brand}:${item.version.split('.')[0]}`,
      )
      .sort()
      .join('|')

  if (brands) {
    return brands
  }

  return navigator.userAgent
    .replace(
      /\d+\.\d+(?:\.\d+)*/g,
      (version) =>
        version.split('.')[0],
    )
    .slice(0, 180)
}

export function currentDeviceStrategyFingerprint():
  string {
  const navigation =
    navigator as
      NavigatorFingerprint

  return [
    `strategy-safe:2`,
    `schema:${FINAL_RUNTIME_SCHEMA_VERSION}`,
    `ort:${FINAL_RUNTIME_ORT_VERSION}`,
    `model:${FINAL_RUNTIME_MODEL_VERSION}`,
    `browser:${browserMajorFingerprint()}`,
    `mobile:${Boolean(navigation.userAgentData?.mobile)}`,
    `memory:${navigation.deviceMemory ?? 0}`,
    `cores:${Math.min(32, Math.max(1, navigation.hardwareConcurrency || 1))}`,
    `isolated:${window.crossOriginIsolated}`,
    `gpu-api:${Boolean(navigation.gpu)}`,
  ].join(';')
}

function validCapabilities(
  value: unknown,
): value is FinalRuntimeCapabilities {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return false
  }

  const candidate =
    value as
      Partial<FinalRuntimeCapabilities>

  return (
    typeof candidate.secureContext ===
      'boolean' &&
    typeof candidate.crossOriginIsolated ===
      'boolean' &&
    typeof candidate.sharedArrayBuffer ===
      'boolean' &&
    typeof candidate.atomics ===
      'boolean' &&
    typeof candidate.hardwareConcurrency ===
      'number' &&
    typeof candidate.deviceMemoryGb ===
      'number' &&
    typeof candidate.saveData ===
      'boolean' &&
    typeof candidate.mobileLike ===
      'boolean' &&
    Boolean(candidate.webGpu)
  )
}

export function readDeviceStrategy():
  DeviceStrategy | null {
  try {
    const raw =
      window.localStorage.getItem(
        storageKey,
      )

    if (!raw) {
      return null
    }

    const parsed =
      JSON.parse(raw) as
        Partial<DeviceStrategy>

    if (
      parsed.version !== 1 ||
      parsed.fingerprint !==
        currentDeviceStrategyFingerprint() ||
      typeof parsed.createdAtMs !==
        'number' ||
      typeof parsed.expiresAtMs !==
        'number' ||
      parsed.expiresAtMs <=
        Date.now() ||
      !validCapabilities(
        parsed.capabilities,
      ) ||
      (
        parsed.provider !==
          'webgpu' &&
        parsed.provider !==
          'wasm'
      ) ||
      ![
        1,
        2,
        4,
      ].includes(
        Number(parsed.wasmThreads),
      ) ||
      ![
        1,
        2,
        4,
      ].includes(
        Number(parsed.previewThreads),
      ) ||
      ![
        'basic',
        'extended',
        'all',
      ].includes(
        String(parsed.graphOptimizationLevel),
      ) ||
      typeof parsed.backgroundPrewarm !==
        'boolean'
    ) {
      return null
    }

    const strategy =
      parsed as
        DeviceStrategy

    const preference =
      readDeviceStrategyPreference()

    return {
      ...strategy,
      provider:
        preference.provider ===
          'auto'
          ? strategy.provider
          : preference.provider,
      wasmThreads:
        preference.wasmThreads ===
          'auto'
          ? strategy.wasmThreads
          : preference.wasmThreads,
      previewThreads:
        preference.wasmThreads ===
          'auto'
          ? strategy.previewThreads
          : preference.wasmThreads,
    }
  } catch {
    return null
  }
}

export function writeDeviceStrategy(
  input: Omit<
    DeviceStrategy,
    | 'version'
    | 'fingerprint'
    | 'createdAtMs'
    | 'expiresAtMs'
    | 'failureCount'
    | 'source'
  >,
): DeviceStrategy {
  const now =
    Date.now()

  const strategy:
    DeviceStrategy = {
      version: 1,
      fingerprint:
        currentDeviceStrategyFingerprint(),
      createdAtMs: now,
      expiresAtMs:
        now +
        strategyMaximumAgeMs,
      failureCount: 0,
      source:
        'one-time-autotune-safe',
      ...input,
  }

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(strategy),
    )
  } catch {
    // Strategy persistence is best effort.
  }

  console.info(
    'BESHMARAI_DEVICE_STRATEGY_PERSISTED',
    {
      device_strategy_runtime_marker:
        DEVICE_STRATEGY_RUNTIME_MARKER,
      provider:
        strategy.provider,
      wasm_threads:
        strategy.wasmThreads,
      preview_threads:
        strategy.previewThreads,
      expires_at_ms:
        strategy.expiresAtMs,
    },
  )

  return strategy
}

function persistExisting(
  strategy:
    DeviceStrategy,
): void {
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(strategy),
    )
  } catch {
    // Best effort.
  }
}

export function recordDeviceStrategyPlanSuccess(
  plan: FinalRuntimePlan,
  capabilities:
    FinalRuntimeCapabilities,
): void {
  const current =
    readDeviceStrategy()

  const next:
    DeviceStrategy = {
      version: 1,
      fingerprint:
        currentDeviceStrategyFingerprint(),
      createdAtMs:
        current?.createdAtMs ??
        Date.now(),
      expiresAtMs:
        Date.now() +
        strategyMaximumAgeMs,
      capabilities,
      provider:
        plan.provider,
      wasmThreads:
        plan.wasmThreads,
      previewThreads:
        current?.previewThreads ??
        plan.wasmThreads,
      graphOptimizationLevel:
        plan.graphOptimizationLevel ===
          'disabled'
          ? 'basic'
          : plan.graphOptimizationLevel,
      enableMemPattern:
        plan.enableMemPattern,
      enableCpuMemArena:
        plan.enableCpuMemArena,
      backgroundPrewarm:
        false,
      failureCount: 0,
      source:
        'one-time-autotune-safe',
    }

  persistExisting(next)
}

export function recordDeviceStrategyPlanFailure(
  plan: FinalRuntimePlan,
): void {
  const current =
    readDeviceStrategy()

  if (!current) {
    return
  }

  const nextThreads:
    1 | 2 | 4 =
    plan.wasmThreads === 4
      ? 2
      : 1

  const next:
    DeviceStrategy = {
      ...current,
      provider:
        plan.provider ===
          'webgpu'
          ? 'wasm'
          : current.provider,
      wasmThreads:
        plan.provider ===
          'webgpu'
          ? current.previewThreads
          : nextThreads,
      graphOptimizationLevel:
        'basic',
      enableMemPattern:
        false,
      enableCpuMemArena:
        false,
      failureCount:
        current.failureCount + 1,
      expiresAtMs:
        Date.now() +
        strategyMaximumAgeMs,
    }

  persistExisting(next)
}

export function updateDeviceStrategyPreviewThreads(
  threadCount:
    1 | 2 | 4,
): void {
  const current =
    readDeviceStrategy()

  if (!current) {
    return
  }

  persistExisting({
    ...current,
    previewThreads:
      threadCount,
    wasmThreads:
      current.provider ===
        'wasm'
        ? threadCount
        : current.wasmThreads,
    expiresAtMs:
      Date.now() +
      strategyMaximumAgeMs,
  })
}

export function clearDeviceStrategy():
  void {
  try {
    window.localStorage.removeItem(
      storageKey,
    )
  } catch {
    // Best effort.
  }
}


// BESHMARAI_PUBLIC_RUNTIME_PREFERENCE_V1

export type DeviceStrategyPreference = {
  version: 1
  provider:
    | 'auto'
    | 'webgpu'
    | 'wasm'
  wasmThreads:
    | 'auto'
    | 1
    | 2
    | 4
}

const preferenceStorageKey =
  'beshmarai_public_runtime_preference_v1'

export const DEFAULT_DEVICE_STRATEGY_PREFERENCE:
  DeviceStrategyPreference = {
    version: 1,
    provider: 'auto',
    wasmThreads: 'auto',
  }

function normalizeDeviceStrategyPreference(
  value:
    Partial<DeviceStrategyPreference> | null,
): DeviceStrategyPreference {
  const provider =
    value?.provider === 'webgpu' ||
    value?.provider === 'wasm'
      ? value.provider
      : 'auto'

  const wasmThreads =
    value?.wasmThreads === 1 ||
    value?.wasmThreads === 2 ||
    value?.wasmThreads === 4
      ? value.wasmThreads
      : 'auto'

  return {
    version: 1,
    provider,
    wasmThreads,
  }
}

export function readDeviceStrategyPreference():
  DeviceStrategyPreference {
  try {
    const raw =
      window.localStorage.getItem(
        preferenceStorageKey,
      )

    if (!raw) {
      return {
        ...DEFAULT_DEVICE_STRATEGY_PREFERENCE,
      }
    }

    return normalizeDeviceStrategyPreference(
      JSON.parse(raw) as
        Partial<DeviceStrategyPreference>,
    )
  } catch {
    return {
      ...DEFAULT_DEVICE_STRATEGY_PREFERENCE,
    }
  }
}

export function writeDeviceStrategyPreference(
  value:
    Partial<DeviceStrategyPreference>,
): DeviceStrategyPreference {
  const normalized =
    normalizeDeviceStrategyPreference(
      value,
    )

  try {
    window.localStorage.setItem(
      preferenceStorageKey,
      JSON.stringify(normalized),
    )
  } catch {
    // Preference persistence is best effort.
  }

  return normalized
}

export function resetDeviceStrategyPreference():
  DeviceStrategyPreference {
  try {
    window.localStorage.removeItem(
      preferenceStorageKey,
    )
  } catch {
    // Best effort.
  }

  return {
    ...DEFAULT_DEVICE_STRATEGY_PREFERENCE,
  }
}
