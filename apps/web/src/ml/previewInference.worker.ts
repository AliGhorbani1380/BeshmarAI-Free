/// <reference lib="webworker" />

import * as ort from 'onnxruntime-web/wasm'

const workerScope = self as unknown as DedicatedWorkerGlobalScope
const previewWorkerMarker = 'BESHMARAI_PREVIEW_DEDICATED_WORKER_V4_SAFE'
const ortVersion = '1.27.0'
const inputSize = 512
const outputChannels = 5
const outputCandidates = 5376

type InitMessage = {
  kind: 'init'
  requestId: string
  modelBuffer: ArrayBuffer
  threadCount: 1 | 2 | 4
  sessionCreateTimeoutMs: number
}

type RunMessage = {
  kind: 'run'
  requestId: string
  inputBuffer: ArrayBuffer
}

type ReleaseMessage = {
  kind: 'release'
  requestId: string
}

type InboundMessage = InitMessage | RunMessage | ReleaseMessage

type OutboundMessage =
  | {
      kind: 'event'
      event: string
      details: Record<string, unknown>
    }
  | {
      kind: 'response'
      requestId: string
      ok: true
      payload: Record<string, unknown>
    }
  | {
      kind: 'response'
      requestId: string
      ok: false
      failure: {
        code: string
        message: string
      }
    }

let session: ort.InferenceSession | null = null
let inputName = ''
let outputName = ''
let configuredThreadCount: 1 | 2 | 4 = 1

function post(
  message: OutboundMessage,
  transfer: Transferable[] = [],
): void {
  workerScope.postMessage(message, transfer)
}

function emit(
  event: string,
  details: Record<string, unknown> = {},
): void {
  post({
    kind: 'event',
    event,
    details: {
      preview_worker_marker: previewWorkerMarker,
      ort_version: ortVersion,
      ...details,
    },
  })
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function errorCode(
  error: unknown,
  phase: 'session' | 'run',
): string {
  const text = errorText(error).toLowerCase()
  if (
    text.includes('out of memory') ||
    text.includes('memory access out of bounds') ||
    text.includes('allocation failed')
  ) {
    return 'preview-out-of-memory'
  }
  if (text.includes('timeout')) {
    return phase === 'session'
      ? 'preview-session-timeout'
      : 'preview-inference-timeout'
  }
  return phase === 'session'
    ? 'preview-session-failed'
    : 'preview-inference-failed'
}

function fail(
  requestId: string,
  error: unknown,
  phase: 'session' | 'run',
): void {
  post({
    kind: 'response',
    requestId,
    ok: false,
    failure: {
      code: errorCode(error, phase),
      message: errorText(error),
    },
  })
}

function releaseSession(): void {
  session?.release()
  session = null
  inputName = ''
  outputName = ''
}

function configureRuntime(
  threadCount: 1 | 2 | 4,
  timeoutMs: number,
): void {
  const baseUrl = import.meta.env.BASE_URL || '/'
  const root = new URL(
    `${baseUrl}ort-runtime-${ortVersion}/`,
    workerScope.location.origin,
  )

  ort.env.logLevel = 'warning'
  ort.env.wasm.proxy = false
  ort.env.wasm.numThreads = threadCount
  ort.env.wasm.initTimeout = timeoutMs
  ort.env.wasm.wasmPaths = {
    mjs: new URL('ort-wasm-simd-threaded.mjs', root).href,
    wasm: new URL('ort-wasm-simd-threaded.wasm', root).href,
  }
}

async function initialize(message: InitMessage): Promise<void> {
  releaseSession()
  configuredThreadCount = message.threadCount
  configureRuntime(message.threadCount, message.sessionCreateTimeoutMs)

  const modelBytes = new Uint8Array(message.modelBuffer)
  const startedAt = performance.now()

  emit('preview.worker.session.create.begin', {
    thread_count: message.threadCount,
    model_size_bytes: modelBytes.byteLength,
  })

  try {
    session = await ort.InferenceSession.create(modelBytes, {
      executionProviders: ['wasm'],
      graphOptimizationLevel:
        'basic',
      executionMode:
        'sequential',
      enableMemPattern:
        false,
      enableCpuMemArena:
        false,
    })
  } finally {
    modelBytes.fill(0)
  }

  inputName = session.inputNames[0] ?? ''
  outputName = session.outputNames[0] ?? ''

  if (!inputName || !outputName) {
    releaseSession()
    throw new Error(
      'PREVIEW_WORKER_IO_NAMES_MISSING',
    )
  }

  const sessionCreateMs =
    performance.now() -
    startedAt

  const warmupStartedAt =
    performance.now()

  const warmupOutputs =
    await session.run({
      [inputName]:
        new ort.Tensor(
          'float32',
          new Float32Array(
            3 *
            inputSize *
            inputSize,
          ),
          [
            1,
            3,
            inputSize,
            inputSize,
          ],
        ),
  })

  const warmupOutput =
    warmupOutputs[outputName]

  if (!warmupOutput) {
    releaseSession()
    throw new Error(
      'PREVIEW_WORKER_WARMUP_OUTPUT_MISSING',
    )
  }

  const warmupShape =
    warmupOutput.dims.map(
      Number,
    )

  if (
    warmupShape.length !== 3 ||
    warmupShape[0] !== 1 ||
    warmupShape[1] !==
      outputChannels ||
    warmupShape[2] !==
      outputCandidates
  ) {
    releaseSession()
    throw new Error(
      'PREVIEW_WORKER_WARMUP_SHAPE_INVALID=' +
      JSON.stringify(
        warmupShape,
      ),
    )
  }

  const warmupMs =
    performance.now() -
    warmupStartedAt

  emit(
    'preview.worker.session.create.end',
    {
      thread_count:
        message.threadCount,
      session_create_ms:
        sessionCreateMs,
      warmup_ms:
        warmupMs,
      input_name:
        inputName,
      output_name:
        outputName,
    },
  )

  post({
    kind: 'response',
    requestId:
      message.requestId,
    ok: true,
    payload: {
      inputName,
      outputName,
      threadCount:
        message.threadCount,
      sessionCreateMs,
      warmupMs,
    },
  })
}

function toFloat32(data: ort.Tensor['data']): Float32Array {
  if (data instanceof Float32Array) return data
  return new Float32Array(
    Array.from(data as ArrayLike<number>, Number),
  )
}

async function run(message: RunMessage): Promise<void> {
  if (!session || !inputName || !outputName) {
    throw new Error('PREVIEW_WORKER_SESSION_NOT_READY')
  }

  const inputData = new Float32Array(message.inputBuffer)
  if (inputData.length !== 3 * inputSize * inputSize) {
    throw new Error('PREVIEW_WORKER_INPUT_LENGTH_INVALID')
  }

  const startedAt = performance.now()
  const outputs = await session.run({
    [inputName]: new ort.Tensor(
      'float32',
      inputData,
      [1, 3, inputSize, inputSize],
    ),
  })
  const output = outputs[outputName]
  if (!output) throw new Error('PREVIEW_WORKER_OUTPUT_MISSING')

  const shape = output.dims.map(Number)
  if (
    shape.length !== 3 ||
    shape[0] !== 1 ||
    shape[1] !== outputChannels ||
    shape[2] !== outputCandidates
  ) {
    throw new Error(
      'PREVIEW_WORKER_OUTPUT_SHAPE_INVALID=' + JSON.stringify(shape),
    )
  }

  const raw = toFloat32(output.data)
  const owned =
    raw.byteOffset === 0 &&
    raw.byteLength === raw.buffer.byteLength
      ? raw
      : new Float32Array(raw)

  post(
    {
      kind: 'response',
      requestId: message.requestId,
      ok: true,
      payload: {
        outputBuffer: owned.buffer,
        outputShape: shape,
        inferenceMs: performance.now() - startedAt,
        threadCount: configuredThreadCount,
      },
    },
    [owned.buffer],
  )
}

workerScope.addEventListener(
  'message',
  (event: MessageEvent<InboundMessage>) => {
    const message = event.data

    if (message.kind === 'release') {
      releaseSession()
      post({
        kind: 'response',
        requestId: message.requestId,
        ok: true,
        payload: {},
      })
      return
    }

    if (message.kind === 'init') {
      void initialize(message).catch((error: unknown) => {
        fail(message.requestId, error, 'session')
      })
      return
    }

    void run(message).catch((error: unknown) => {
      fail(message.requestId, error, 'run')
    })
  },
)

emit('preview.worker.boot')
