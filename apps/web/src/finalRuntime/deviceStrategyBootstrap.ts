import {
  loadPreviewModelSession,
} from '../ml/iosPreviewModel'
import {
  profileFinalRuntimeCapabilities,
} from './capabilityProfiler'
import {
  readDeviceStrategy,
  writeDeviceStrategy,
  type DeviceStrategy,
} from './deviceStrategy'

// BESHMARAI_ONE_TIME_DEVICE_AUTOTUNE_SAFE_V2

const deviceAutotuneRuntimeMarker =
  'BESHMARAI_ONE_TIME_DEVICE_AUTOTUNE_SAFE_V2'

export type DeviceStrategyProgress = {
  message: string
  percent: number
  fromCache: boolean
}

function webGpuSuitable(
  capabilities:
    Awaited<
      ReturnType<
        typeof profileFinalRuntimeCapabilities
      >
    >,
): boolean {
  return (
    capabilities.webGpu.available &&
    capabilities.webGpu.computeVerified &&
    (
      capabilities.webGpu.maximumBufferBytes === 0 ||
      capabilities.webGpu.maximumBufferBytes >=
        128 * 1024 * 1024
    ) &&
    (
      capabilities.webGpu.maximumStorageBindingBytes === 0 ||
      capabilities.webGpu.maximumStorageBindingBytes >=
        64 * 1024 * 1024
    )
  )
}

function graphOptimizationLevel(
  provider:
    'webgpu' | 'wasm',
): 'basic' | 'all' {
  return provider ===
    'webgpu'
    ? 'all'
    : 'basic'
}

export async function ensureDeviceStrategyOnce(
  onProgress?: (
    progress:
      DeviceStrategyProgress,
  ) => void,
): Promise<DeviceStrategy> {
  const cached =
    readDeviceStrategy()

  if (cached) {
    onProgress?.({
      message:
        'استراتژی ذخیره‌شده این دستگاه آماده است.',
      percent: 100,
      fromCache: true,
    })

    return cached
  }

  onProgress?.({
    message:
      'در حال سنجش یک‌باره توان مرورگر و سخت‌افزار...',
    percent: 10,
    fromCache: false,
  })

  const capabilities =
    await profileFinalRuntimeCapabilities()

  onProgress?.({
    message:
      'در حال انتخاب سریع‌ترین تنظیم پایدار CPU...',
    percent: 42,
    fromCache: false,
  })

  const preview =
    await loadPreviewModelSession()

  const previewThreads =
    (
      preview.threadCount === 4 ||
      preview.threadCount === 2
    )
      ? preview.threadCount
      : 1

  const provider =
    webGpuSuitable(capabilities)
      ? 'webgpu'
      : 'wasm'

  const optimization =
    graphOptimizationLevel(
      provider,
    )

  const strategy =
    writeDeviceStrategy({
      capabilities,
      provider,
      wasmThreads:
        previewThreads,
      previewThreads,
      graphOptimizationLevel:
        optimization,
      enableMemPattern:
        false,
      enableCpuMemArena:
        false,
      backgroundPrewarm:
        false,
    })

  onProgress?.({
    message:
      provider === 'webgpu'
        ? 'استراتژی WebGPU این دستگاه ذخیره شد.'
        : `استراتژی CPU با ${previewThreads.toLocaleString('fa-IR')} رشته ذخیره شد.`,
    percent: 100,
    fromCache: false,
  })

  console.info(
    'BESHMARAI_DEVICE_STRATEGY_READY',
    {
      strategy,
      one_time_autotune:
        true,
      repeated_benchmark:
        false,
      device_autotune_runtime_marker:
        deviceAutotuneRuntimeMarker,
    },
  )

  return strategy
}
