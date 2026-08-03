import {
  type FinalRuntimeCapabilities,
  type FinalRuntimeMemoryClass,
  type FinalRuntimeWebGpuProbe,
} from './protocol'

type NavigatorCapabilities =
  Navigator & {
    deviceMemory?: number
    connection?: {
      saveData?: boolean
    }
    userAgentData?: {
      mobile?: boolean
      brands?: readonly {
        brand: string
        version: string
      }[]
    }
  }

type MinimalGpu = {
  requestAdapter: (
    options?: {
      powerPreference?:
        | 'high-performance'
        | 'low-power'
    },
  ) => Promise<
    MinimalGpuAdapter | null
  >
}

type MinimalGpuAdapter = {
  features: {
    has: (
      name: string,
    ) => boolean
  }
  limits: {
    maxBufferSize?: number
    maxStorageBufferBindingSize?: number
    maxComputeInvocationsPerWorkgroup?: number
  }
  requestDevice: () => Promise<
    MinimalGpuDevice
  >
}

type MinimalGpuDevice = {
  lost: Promise<{
    reason?: string
    message?: string
  }>
  createShaderModule: (
    descriptor: {
      code: string
    },
  ) => unknown
  createBindGroupLayout: (
    descriptor: unknown,
  ) => unknown
  createPipelineLayout: (
    descriptor: unknown,
  ) => unknown
  createComputePipeline: (
    descriptor: unknown,
  ) => unknown
  createBuffer: (
    descriptor: {
      size: number
      usage: number
      mappedAtCreation?:
        boolean
    },
  ) => MinimalGpuBuffer
  createBindGroup: (
    descriptor: unknown,
  ) => unknown
  createCommandEncoder: () =>
    MinimalGpuCommandEncoder
  queue: {
    submit: (
      commands:
        readonly unknown[],
    ) => void
  }
  destroy?: () => void
}

type MinimalGpuBuffer = {
  mapAsync: (
    mode: number,
  ) => Promise<void>
  getMappedRange: () =>
    ArrayBuffer
  unmap: () => void
  destroy?: () => void
}

type MinimalGpuCommandEncoder = {
  beginComputePass: () =>
    MinimalGpuComputePass
  copyBufferToBuffer: (
    source: MinimalGpuBuffer,
    sourceOffset: number,
    destination:
      MinimalGpuBuffer,
    destinationOffset: number,
    size: number,
  ) => void
  finish: () => unknown
}

type MinimalGpuComputePass = {
  setPipeline: (
    pipeline: unknown,
  ) => void
  setBindGroup: (
    index: number,
    bindGroup: unknown,
  ) => void
  dispatchWorkgroups: (
    count: number,
  ) => void
  end: () => void
}

type GpuConstants = {
  GPUBufferUsage: {
    MAP_READ: number
    COPY_SRC: number
    COPY_DST: number
    STORAGE: number
  }
  GPUMapMode: {
    READ: number
  }
  GPUShaderStage: {
    COMPUTE: number
  }
}

const probeTimeoutMs = 7000

function numericCapability(
  value: unknown,
  fallback: number,
): number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
    ? value
    : fallback
}

function resolveMemoryClass(
  input: {
    deviceMemoryGb: number
    hardwareConcurrency: number
    saveData: boolean
  },
): FinalRuntimeMemoryClass {
  if (
    input.saveData ||
    input.deviceMemoryGb <= 4 ||
    input.hardwareConcurrency <= 4
  ) {
    return 'low'
  }

  if (
    input.deviceMemoryGb >= 8 &&
    input.hardwareConcurrency >= 8
  ) {
    return 'high'
  }

  return 'medium'
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId:
    number | null = null

  const timeout =
    new Promise<never>(
      (_resolve, reject) => {
        timeoutId =
          window.setTimeout(
            () => {
              reject(
                new Error(
                  'FINAL_WEBGPU_PROBE_TIMEOUT',
                ),
              )
            },
            timeoutMs,
          )
      },
    )

  try {
    return await Promise.race([
      promise,
      timeout,
    ])
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(
        timeoutId,
      )
    }
  }
}

function unavailableProbe(
  durationMs: number,
  failureCode:
    FinalRuntimeWebGpuProbe[
      'failureCode'
    ],
): FinalRuntimeWebGpuProbe {
  return {
    available: false,
    computeVerified: false,
    durationMs,
    maximumBufferBytes: 0,
    maximumStorageBindingBytes: 0,
    maximumComputeInvocations: 0,
    shaderF16: false,
    subgroups: false,
    failureCode,
  }
}

async function runWebGpuComputeProbe(
  adapter:
    MinimalGpuAdapter,
): Promise<void> {
  const constants =
    globalThis as unknown as
      GpuConstants

  if (
    !constants.GPUBufferUsage ||
    !constants.GPUMapMode ||
    !constants.GPUShaderStage
  ) {
    throw new Error(
      'WEBGPU_CONSTANTS_UNAVAILABLE',
    )
  }

  const device =
    await adapter.requestDevice()

  const elementCount = 64
  const byteLength =
    elementCount * 4

  const shader =
    device.createShaderModule({
      code: `
        @group(0) @binding(0)
        var<storage, read_write>
          values: array<u32>;

        @compute @workgroup_size(64)
        fn main(
          @builtin(global_invocation_id)
          id: vec3<u32>,
        ) {
          values[id.x] =
            id.x * 3u + 7u;
        }
      `,
    })

  const bindGroupLayout =
    device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility:
            constants
              .GPUShaderStage
              .COMPUTE,
          buffer: {
            type: 'storage',
          },
        },
      ],
    })

  const pipelineLayout =
    device.createPipelineLayout({
      bindGroupLayouts: [
        bindGroupLayout,
      ],
    })

  const pipeline =
    device.createComputePipeline({
      layout:
        pipelineLayout,
      compute: {
        module: shader,
        entryPoint: 'main',
      },
    })

  const storage =
    device.createBuffer({
      size: byteLength,
      usage:
        constants
          .GPUBufferUsage
          .STORAGE |
        constants
          .GPUBufferUsage
          .COPY_SRC,
    })

  const readback =
    device.createBuffer({
      size: byteLength,
      usage:
        constants
          .GPUBufferUsage
          .COPY_DST |
        constants
          .GPUBufferUsage
          .MAP_READ,
    })

  try {
    const bindGroup =
      device.createBindGroup({
        layout:
          bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: storage,
            },
          },
        ],
      })

    const encoder =
      device.createCommandEncoder()

    const pass =
      encoder.beginComputePass()

    pass.setPipeline(pipeline)
    pass.setBindGroup(
      0,
      bindGroup,
    )
    pass.dispatchWorkgroups(1)
    pass.end()

    encoder.copyBufferToBuffer(
      storage,
      0,
      readback,
      0,
      byteLength,
    )

    device.queue.submit([
      encoder.finish(),
    ])

    await readback.mapAsync(
      constants
        .GPUMapMode
        .READ,
    )

    const values =
      new Uint32Array(
        readback
          .getMappedRange()
          .slice(0),
      )

    for (
      let index = 0;
      index < elementCount;
      index += 1
    ) {
      if (
        values[index] !==
        index * 3 + 7
      ) {
        throw new Error(
          'WEBGPU_COMPUTE_PROBE_MISMATCH',
        )
      }
    }

    readback.unmap()
  } finally {
    storage.destroy?.()
    readback.destroy?.()
    device.destroy?.()
  }
}

async function probeWebGpu():
  Promise<FinalRuntimeWebGpuProbe> {
  const startedAt =
    performance.now()

  const gpu =
    (
      navigator as unknown as {
        gpu?: MinimalGpu
      }
    ).gpu

  if (
    !window.isSecureContext ||
    !gpu
  ) {
    return unavailableProbe(
      performance.now() -
        startedAt,
      'unavailable',
    )
  }

  let adapter:
    MinimalGpuAdapter | null =
      null

  try {
    adapter =
      await withTimeout(
        gpu.requestAdapter({
            powerPreference:
              'high-performance',
          }),
        probeTimeoutMs,
      )
  } catch (error) {
    const timeout =
      error instanceof Error &&
      error.message ===
        'FINAL_WEBGPU_PROBE_TIMEOUT'

    return unavailableProbe(
      performance.now() -
        startedAt,
      timeout
        ? 'timeout'
        : 'request-adapter',
    )
  }

  if (!adapter) {
    return unavailableProbe(
      performance.now() -
        startedAt,
      'request-adapter',
    )
  }

  try {
    await withTimeout(
      runWebGpuComputeProbe(
        adapter,
      ),
      probeTimeoutMs,
    )
  } catch (error) {
    const timeout =
      error instanceof Error &&
      error.message ===
        'FINAL_WEBGPU_PROBE_TIMEOUT'

    return unavailableProbe(
      performance.now() -
        startedAt,
      timeout
        ? 'timeout'
        : 'compute',
    )
  }

  return {
    available: true,
    computeVerified: true,
    durationMs:
      performance.now() -
      startedAt,
    maximumBufferBytes:
      numericCapability(
        adapter.limits
          .maxBufferSize,
        0,
      ),
    maximumStorageBindingBytes:
      numericCapability(
        adapter.limits
          .maxStorageBufferBindingSize,
        0,
      ),
    maximumComputeInvocations:
      numericCapability(
        adapter.limits
          .maxComputeInvocationsPerWorkgroup,
        0,
      ),
    shaderF16:
      adapter.features.has(
        'shader-f16',
      ),
    subgroups:
      adapter.features.has(
        'subgroups',
      ),
    failureCode: null,
  }
}

function mobileLike(
  navigation:
    NavigatorCapabilities,
): boolean {
  if (
    navigation.userAgentData
      ?.mobile === true
  ) {
    return true
  }

  return (
    navigator.maxTouchPoints > 1 &&
    Math.min(
      window.screen.width,
      window.screen.height,
    ) < 1024
  )
}

export async function profileFinalRuntimeCapabilities():
  Promise<FinalRuntimeCapabilities> {
  const navigation =
    navigator as
      NavigatorCapabilities

  const hardwareConcurrency =
    Math.max(
      1,
      Math.floor(
        navigation
          .hardwareConcurrency ||
        1,
      ),
    )

  const deviceMemoryGb =
    Math.max(
      1,
      numericCapability(
        navigation.deviceMemory,
        4,
      ),
    )

  const saveData =
    navigation.connection
      ?.saveData === true

  return {
    secureContext:
      window.isSecureContext,
    crossOriginIsolated:
      window.crossOriginIsolated,
    sharedArrayBuffer:
      typeof SharedArrayBuffer !==
      'undefined',
    atomics:
      typeof Atomics !==
      'undefined',
    hardwareConcurrency,
    deviceMemoryGb,
    saveData,
    mobileLike:
      mobileLike(navigation),
    memoryClass:
      resolveMemoryClass({
        deviceMemoryGb,
        hardwareConcurrency,
        saveData,
      }),
    webGpu:
      await probeWebGpu(),
  }
}
