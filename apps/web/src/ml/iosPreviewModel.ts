import { getAiModelBytes } from '../aiModelCache'
import {
  readDeviceStrategy,
  updateDeviceStrategyPreviewThreads,
} from '../finalRuntime/deviceStrategy'

// BESHMARAI_IOS_RAW_WASM_PREVIEW_V7_SAFE
// BESHMARAI_PREVIEW_DEDICATED_WORKER_CLIENT_V4_SAFE
// BESHMARAI_PREVIEW_SESSION_NO_STARTUP_WARMUP_V1
// BESHMARAI_PREVIEW_SESSION_CREATE_TIMEOUT_V1

const inputSize = 512
const outputChannels = 5
const outputCandidates = 5376
const confidenceThreshold = 0.425
const iouThreshold = 0.45
const maximumDetections = 1000

const previewSessionRuntimeMarker =
  'BESHMARAI_PREVIEW_SESSION_RUNTIME_V1'

const previewWorkerClientMarker =
  'BESHMARAI_PREVIEW_DEDICATED_WORKER_CLIENT_V4_SAFE'

const previewSessionCreateTimeoutMs = 60_000
const previewInferenceTimeoutMs = 30_000
const previewWorkerBootTimeoutMs = 15_000

const navigation = navigator as Navigator & {
  deviceMemory?: number
}

const hardwareConcurrency = Math.max(
  1,
  navigation.hardwareConcurrency || 1,
)

const deviceMemoryGb = navigation.deviceMemory ?? 4

export type PreviewThreadCount =
  1 | 2 | 4

type PreviewCalibrationResult = {
  threadCount:
    PreviewThreadCount
  sessionCreateMs: number
  warmupMs: number
  scoreMs: number
}

function previewCalibrationCandidates():
  readonly PreviewThreadCount[] {
  if (
    !window.crossOriginIsolated ||
    hardwareConcurrency < 4 ||
    deviceMemoryGb < 4
  ) {
    return [1]
  }

  const mobileLike =
    /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent,
    )

  if (
    !mobileLike &&
    hardwareConcurrency >= 8 &&
    deviceMemoryGb >= 8
  ) {
    return [4, 2, 1]
  }

  if (
    hardwareConcurrency >= 6 &&
    deviceMemoryGb >= 6
  ) {
    return [2, 1]
  }

  return [1]
}

export type PreviewExecutionProvider =
  | 'webgpu-graph-capture'
  | 'webgpu'
  | 'wasm'

export type PreviewModelSession = {
  inputName: string
  outputName: string
  threadCount: number
  crossOriginIsolated: boolean
  executionProvider: PreviewExecutionProvider
  graphCaptureEnabled: false
  warmupMs: number
  webGpuAvailable: boolean
  secureContext: boolean
  workerEnabled: true
  fallbackOccurred: boolean
}

export type PreviewCrop = {
  x: number
  y: number
  width: number
  height: number
}

export type PreviewDetection = {
  x1: number
  y1: number
  x2: number
  y2: number
  score: number
  classId: number
}

export type PreviewFrameRunResult = {
  inputShape: number[]
  outputShape: number[]
  outputLength: number
  sourceWidth: number
  sourceHeight: number
  resizedWidth: number
  resizedHeight: number
  offsetX: number
  offsetY: number
  rawCandidateCount: number
  rawDetectionCount: number
  detections: PreviewDetection[]
  displayedCount: number
  stableCount: number
  isCountStable: boolean
  countHistory: number[]
  confidenceThreshold: number
  iouThreshold: number
  preprocessMs: number
  inferenceMs: number
  postprocessMs: number
  totalMs: number
  endToEndMs: number
  maximumRawScore: number
  minimumRawScore: number
  executionProvider: PreviewExecutionProvider
  modelKind: 'raw-wasm-ios'
  fallbackOccurred: false
  workerEnabled: true
}

type LocalDetection = PreviewDetection

type PreparedInput = {
  tensorData: Float32Array
  crop: PreviewCrop
  resizedWidth: number
  resizedHeight: number
  padX: number
  padY: number
  scale: number
  preprocessMs: number
}

type DecodedOutput = {
  detections: LocalDetection[]
  preNmsCount: number
  maximumRawScore: number
  minimumRawScore: number
  postprocessMs: number
}

type CountState = {
  displayedCount: number
  stableCount: number
  isCountStable: boolean
  history: number[]
}

const preprocessCanvas = document.createElement('canvas')
preprocessCanvas.width = inputSize
preprocessCanvas.height = inputSize

const preprocessContext = (() => {
  const context = preprocessCanvas.getContext(
    '2d',
    {
      alpha: false,
      willReadFrequently: true,
    },
  )

  if (!context) {
    throw new Error('IOS_PREVIEW_CONTEXT_NOT_AVAILABLE')
  }

  return context
})()

type PreviewWorkerResponse =
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

type PendingPreviewRequest = {
  resolve: (payload: Record<string, unknown>) => void
  reject: (error: Error) => void
  timeoutId: number
}

let previewWorker: Worker | null = null
let previewWorkerBootPromise: Promise<void> | null = null
let previewWorkerBootResolve: (() => void) | null = null
let previewWorkerBootReject: ((error: Error) => void) | null = null
let sessionInfo: PreviewModelSession | null = null
let sessionPromise: Promise<PreviewModelSession> | null = null
let previewRequestSequence = 0

const pendingPreviewRequests = new Map<string, PendingPreviewRequest>()

function nextPreviewRequestId(): string {
  previewRequestSequence += 1
  return `preview-${previewRequestSequence}-${Math.random().toString(36).slice(2)}`
}

function clearPreviewPending(error: Error): void {
  for (const pending of pendingPreviewRequests.values()) {
    window.clearTimeout(pending.timeoutId)
    pending.reject(error)
  }
  pendingPreviewRequests.clear()
}

function terminatePreviewWorker(reason: string): void {
  const worker = previewWorker
  previewWorker = null
  sessionInfo = null
  sessionPromise = null
  previewWorkerBootPromise = null
  previewWorkerBootResolve = null
  previewWorkerBootReject = null
  clearPreviewPending(new Error('PREVIEW_WORKER_TERMINATED=' + reason))
  worker?.terminate()
}

function handlePreviewWorkerMessage(
  event: MessageEvent<PreviewWorkerResponse>,
): void {
  const message = event.data

  if (message.kind === 'event') {
    if (message.event === 'preview.worker.boot') {
      previewWorkerBootResolve?.()
      previewWorkerBootResolve = null
      previewWorkerBootReject = null
    }

    console.info('BESHMARAI_PREVIEW_WORKER_EVENT', {
      preview_worker_client_marker: previewWorkerClientMarker,
      event: message.event,
      details: message.details,
    })
    return
  }

  const pending = pendingPreviewRequests.get(message.requestId)
  if (!pending) return

  pendingPreviewRequests.delete(message.requestId)
  window.clearTimeout(pending.timeoutId)

  if ('failure' in message) {
    const error = new Error(message.failure.message)
    error.name = message.failure.code
    pending.reject(error)
    return
  }

  pending.resolve(message.payload)
}

function ensurePreviewWorker(): Worker {
  if (previewWorker) return previewWorker

  previewWorkerBootPromise = new Promise<void>((resolve, reject) => {
    previewWorkerBootResolve = resolve
    previewWorkerBootReject = reject
  })

  const worker = new Worker(
    new URL('./previewInference.worker.ts', import.meta.url),
    {
      type: 'module',
      name: 'beshmarai-preview-wasm-v1',
    },
  )

  worker.addEventListener('message', handlePreviewWorkerMessage)
  worker.addEventListener('error', (event: ErrorEvent) => {
    const error = new Error('PREVIEW_WORKER_SCRIPT_ERROR=' + event.message)
    previewWorkerBootReject?.(error)
    terminatePreviewWorker('script-error')
  })
  worker.addEventListener('messageerror', () => {
    const error = new Error('PREVIEW_WORKER_MESSAGE_ERROR')
    previewWorkerBootReject?.(error)
    terminatePreviewWorker('message-error')
  })

  previewWorker = worker
  return worker
}

async function waitForPreviewWorkerBoot(): Promise<void> {
  ensurePreviewWorker()
  const bootPromise = previewWorkerBootPromise
  if (!bootPromise) return

  let timeoutId: number | null = null
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = window.setTimeout(() => {
      const error = new Error('PREVIEW_WORKER_BOOT_TIMEOUT')
      error.name = 'preview-worker-boot-timeout'
      reject(error)
    }, previewWorkerBootTimeoutMs)
  })

  try {
    await Promise.race([bootPromise, timeout])
  } finally {
    if (timeoutId !== null) window.clearTimeout(timeoutId)
  }
}

function previewWorkerRequest(
  input: Record<string, unknown> & {
    kind: 'init' | 'run' | 'release'
    requestId: string
  },
  transfer: Transferable[],
  timeoutMs: number,
): Promise<Record<string, unknown>> {
  const worker = ensurePreviewWorker()

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pendingPreviewRequests.delete(input.requestId)
      const error = new Error('PREVIEW_WORKER_REQUEST_TIMEOUT=' + input.kind)
      error.name =
        input.kind === 'init'
          ? 'preview-session-timeout'
          : input.kind === 'run'
            ? 'preview-inference-timeout'
            : 'preview-worker-timeout'
      reject(error)

      if (input.kind !== 'release') {
        terminatePreviewWorker(
          input.kind === 'run'
            ? 'inference-timeout'
            : 'session-timeout',
        )
      }
    }, timeoutMs)

    pendingPreviewRequests.set(input.requestId, {
      resolve,
      reject,
      timeoutId,
    })

    worker.postMessage(input, transfer)
  })
}

function takePreviewModelBuffer(bytes: Uint8Array): ArrayBuffer {
  if (
    bytes.buffer instanceof ArrayBuffer &&
    bytes.byteOffset === 0 &&
    bytes.byteLength === bytes.buffer.byteLength
  ) {
    return bytes.buffer
  }

  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

let previousSmoothedDetections: LocalDetection[] = []
const countHistory: number[] = []
let committedCount: number | null = null
let pendingCandidateCount: number | null = null
let pendingCandidateStreak = 0
let zeroDetectionStreak = 0
let zeroDetectionStartedAt = 0

const countHistoryLimit = 8
const countRecentWindowSize = 5
const initialCommitRequiredStreak = 2
const changedCountRequiredStreak = 3
const adjacentCountRequiredStreak = 4
const zeroReleaseRequiredFrames = 7
const zeroReleaseRequiredMs = 1100
const currentBoxWeight = 0.78

function clampNumber(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort(
    (first, second) => first - second,
  )
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) {
    return sorted[middle]
  }

  return (sorted[middle - 1] + sorted[middle]) / 2
}

function normalizeCrop(
  video: HTMLVideoElement,
  requestedCrop?: PreviewCrop,
): PreviewCrop {
  const videoWidth = video.videoWidth
  const videoHeight = video.videoHeight

  if (videoWidth <= 1 || videoHeight <= 1) {
    throw new Error('IOS_PREVIEW_VIDEO_SIZE_INVALID')
  }

  if (!requestedCrop) {
    return {
      x: 0,
      y: 0,
      width: videoWidth,
      height: videoHeight,
    }
  }

  const x = Math.floor(
    clampNumber(requestedCrop.x, 0, videoWidth - 2),
  )
  const y = Math.floor(
    clampNumber(requestedCrop.y, 0, videoHeight - 2),
  )
  const width = Math.floor(
    clampNumber(requestedCrop.width, 2, videoWidth - x),
  )
  const height = Math.floor(
    clampNumber(requestedCrop.height, 2, videoHeight - y),
  )

  return { x, y, width, height }
}

function prepareInput(
  video: HTMLVideoElement,
  requestedCrop?: PreviewCrop,
): PreparedInput {
  const startedAt = performance.now()
  const crop = normalizeCrop(video, requestedCrop)
  const scale = Math.min(
    inputSize / crop.width,
    inputSize / crop.height,
  )
  const resizedWidth = crop.width * scale
  const resizedHeight = crop.height * scale
  const padX = (inputSize - resizedWidth) / 2
  const padY = (inputSize - resizedHeight) / 2

  preprocessContext.fillStyle = 'rgb(114, 114, 114)'
  preprocessContext.fillRect(0, 0, inputSize, inputSize)
  preprocessContext.imageSmoothingEnabled = true
  preprocessContext.imageSmoothingQuality = 'high'
  preprocessContext.drawImage(
    video,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    padX,
    padY,
    resizedWidth,
    resizedHeight,
  )

  const rgba = preprocessContext.getImageData(
    0,
    0,
    inputSize,
    inputSize,
  ).data
  const planeSize = inputSize * inputSize
  const tensorData = new Float32Array(planeSize * 3)

  for (
    let pixelIndex = 0;
    pixelIndex < planeSize;
    pixelIndex += 1
  ) {
    const rgbaOffset = pixelIndex * 4
    tensorData[pixelIndex] = rgba[rgbaOffset] / 255
    tensorData[planeSize + pixelIndex] =
      rgba[rgbaOffset + 1] / 255
    tensorData[planeSize * 2 + pixelIndex] =
      rgba[rgbaOffset + 2] / 255
  }

  return {
    tensorData,
    crop,
    resizedWidth,
    resizedHeight,
    padX,
    padY,
    scale,
    preprocessMs: performance.now() - startedAt,
  }
}

function validateRawOutputShape(
  shape: readonly number[],
): void {
  if (
    shape.length !== 3 ||
    shape[0] !== 1 ||
    shape[1] !== outputChannels ||
    shape[2] !== outputCandidates
  ) {
    throw new Error(
      'IOS_RAW_OUTPUT_SHAPE_INVALID=' +
        JSON.stringify({
          actual: shape,
          expected: [1, outputChannels, outputCandidates],
        }),
    )
  }
}

function getRawOutputValue(
  outputData: Float32Array,
  candidateIndex: number,
  channelIndex: number,
): number {
  return Number(
    outputData[
      channelIndex * outputCandidates + candidateIndex
    ],
  )
}

function intersectionOverUnion(
  first: LocalDetection,
  second: LocalDetection,
): number {
  const intersectionX1 = Math.max(first.x1, second.x1)
  const intersectionY1 = Math.max(first.y1, second.y1)
  const intersectionX2 = Math.min(first.x2, second.x2)
  const intersectionY2 = Math.min(first.y2, second.y2)
  const intersectionWidth = Math.max(
    0,
    intersectionX2 - intersectionX1,
  )
  const intersectionHeight = Math.max(
    0,
    intersectionY2 - intersectionY1,
  )
  const intersectionArea =
    intersectionWidth * intersectionHeight
  const firstArea =
    Math.max(0, first.x2 - first.x1) *
    Math.max(0, first.y2 - first.y1)
  const secondArea =
    Math.max(0, second.x2 - second.x1) *
    Math.max(0, second.y2 - second.y1)
  const unionArea = firstArea + secondArea - intersectionArea

  return unionArea > 0 ? intersectionArea / unionArea : 0
}

function applyClassAwareNms(
  candidates: LocalDetection[],
): LocalDetection[] {
  const sorted = [...candidates]
    .sort((first, second) => second.score - first.score)
    .slice(0, maximumDetections)
  const selected: LocalDetection[] = []

  for (const candidate of sorted) {
    let suppressed = false

    for (const kept of selected) {
      if (
        candidate.classId === kept.classId &&
        intersectionOverUnion(candidate, kept) > iouThreshold
      ) {
        suppressed = true
        break
      }
    }

    if (!suppressed) {
      selected.push(candidate)
    }

    if (selected.length >= maximumDetections) {
      break
    }
  }

  return selected
}

function decodeOutput(
  outputData: Float32Array,
  outputShape: readonly number[],
  prepared: PreparedInput,
): DecodedOutput {
  const startedAt = performance.now()
  validateRawOutputShape(outputShape)

  const candidates: LocalDetection[] = []
  let maximumRawScore = Number.NEGATIVE_INFINITY
  let minimumRawScore = Number.POSITIVE_INFINITY

  for (
    let candidateIndex = 0;
    candidateIndex < outputCandidates;
    candidateIndex += 1
  ) {
    let centerX = getRawOutputValue(
      outputData,
      candidateIndex,
      0,
    )
    let centerY = getRawOutputValue(
      outputData,
      candidateIndex,
      1,
    )
    let width = getRawOutputValue(
      outputData,
      candidateIndex,
      2,
    )
    let height = getRawOutputValue(
      outputData,
      candidateIndex,
      3,
    )
    const score = getRawOutputValue(
      outputData,
      candidateIndex,
      4,
    )

    if (Number.isFinite(score)) {
      maximumRawScore = Math.max(maximumRawScore, score)
      minimumRawScore = Math.min(minimumRawScore, score)
    }

    if (!Number.isFinite(score) || score < confidenceThreshold) {
      continue
    }

    if (
      !Number.isFinite(centerX) ||
      !Number.isFinite(centerY) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height)
    ) {
      continue
    }

    if (
      Math.max(
        Math.abs(centerX),
        Math.abs(centerY),
        Math.abs(width),
        Math.abs(height),
      ) <= 2
    ) {
      centerX *= inputSize
      centerY *= inputSize
      width *= inputSize
      height *= inputSize
    }

    const localX1 = clampNumber(
      (centerX - width / 2 - prepared.padX) /
        prepared.scale,
      0,
      prepared.crop.width,
    )
    const localY1 = clampNumber(
      (centerY - height / 2 - prepared.padY) /
        prepared.scale,
      0,
      prepared.crop.height,
    )
    const localX2 = clampNumber(
      (centerX + width / 2 - prepared.padX) /
        prepared.scale,
      0,
      prepared.crop.width,
    )
    const localY2 = clampNumber(
      (centerY + height / 2 - prepared.padY) /
        prepared.scale,
      0,
      prepared.crop.height,
    )

    if (localX2 - localX1 < 2 || localY2 - localY1 < 2) {
      continue
    }

    candidates.push({
      x1: localX1,
      y1: localY1,
      x2: localX2,
      y2: localY2,
      score,
      classId: 0,
    })
  }

  return {
    detections: applyClassAwareNms(candidates),
    preNmsCount: candidates.length,
    maximumRawScore: Number.isFinite(maximumRawScore)
      ? maximumRawScore
      : 0,
    minimumRawScore: Number.isFinite(minimumRawScore)
      ? minimumRawScore
      : 0,
    postprocessMs: performance.now() - startedAt,
  }
}

function detectionWidth(detection: LocalDetection): number {
  return Math.max(0, detection.x2 - detection.x1)
}

function detectionHeight(detection: LocalDetection): number {
  return Math.max(0, detection.y2 - detection.y1)
}

function detectionCenterX(detection: LocalDetection): number {
  return (detection.x1 + detection.x2) / 2
}

function detectionCenterY(detection: LocalDetection): number {
  return (detection.y1 + detection.y2) / 2
}

function trackingCenterDistanceSquared(
  first: LocalDetection,
  second: LocalDetection,
): number {
  const deltaX = detectionCenterX(first) - detectionCenterX(second)
  const deltaY = detectionCenterY(first) - detectionCenterY(second)
  return deltaX * deltaX + deltaY * deltaY
}

function currentFrameBoxSizeAccepted(
  previous: LocalDetection,
  current: LocalDetection,
): boolean {
  const previousWidth = Math.max(1, detectionWidth(previous))
  const previousHeight = Math.max(1, detectionHeight(previous))
  const currentWidth = Math.max(1, detectionWidth(current))
  const currentHeight = Math.max(1, detectionHeight(current))
  const widthRatio =
    Math.max(previousWidth, currentWidth) /
    Math.min(previousWidth, currentWidth)
  const heightRatio =
    Math.max(previousHeight, currentHeight) /
    Math.min(previousHeight, currentHeight)

  return widthRatio <= 2.2 && heightRatio <= 2.2
}

function currentFrameMatchScore(
  previous: LocalDetection,
  current: LocalDetection,
): number | null {
  if (previous.classId !== current.classId) {
    return null
  }

  if (!currentFrameBoxSizeAccepted(previous, current)) {
    return null
  }

  const iou = intersectionOverUnion(previous, current)
  const centerDistance = Math.sqrt(
    trackingCenterDistanceSquared(previous, current),
  )
  const minimumSize = Math.min(
    detectionWidth(previous),
    detectionHeight(previous),
    detectionWidth(current),
    detectionHeight(current),
  )
  const distanceGate = clampNumber(
    minimumSize * 1.45,
    18,
    72,
  )
  const distanceAccepted = centerDistance <= distanceGate
  const overlapAccepted = iou >= 0.08

  if (!distanceAccepted && !overlapAccepted) {
    return null
  }

  const normalizedDistance = Math.min(
    1,
    centerDistance / distanceGate,
  )

  return (
    iou * 10 +
    (1 - normalizedDistance) * 2 +
    current.score
  )
}

function smoothCurrentFrameDetections(
  rawDetections: LocalDetection[],
): LocalDetection[] {
  const currentDetections = [...rawDetections].sort(
    (first, second) => second.score - first.score,
  )
  const previousUsed = new Array(
    previousSmoothedDetections.length,
  ).fill(false)
  const smoothedDetections: LocalDetection[] = []

  for (const current of currentDetections) {
    let bestPreviousIndex = -1
    let bestMatchScore = Number.NEGATIVE_INFINITY

    for (
      let previousIndex = 0;
      previousIndex < previousSmoothedDetections.length;
      previousIndex += 1
    ) {
      if (previousUsed[previousIndex]) {
        continue
      }

      const previous = previousSmoothedDetections[previousIndex]
      const matchScore = currentFrameMatchScore(previous, current)

      if (matchScore !== null && matchScore > bestMatchScore) {
        bestPreviousIndex = previousIndex
        bestMatchScore = matchScore
      }
    }

    if (bestPreviousIndex >= 0) {
      const previous = previousSmoothedDetections[bestPreviousIndex]
      previousUsed[bestPreviousIndex] = true
      const oldWeight = 1 - currentBoxWeight

      smoothedDetections.push({
        x1: previous.x1 * oldWeight + current.x1 * currentBoxWeight,
        y1: previous.y1 * oldWeight + current.y1 * currentBoxWeight,
        x2: previous.x2 * oldWeight + current.x2 * currentBoxWeight,
        y2: previous.y2 * oldWeight + current.y2 * currentBoxWeight,
        score: previous.score * 0.22 + current.score * 0.78,
        classId: current.classId,
      })
    } else {
      smoothedDetections.push({ ...current })
    }
  }

  previousSmoothedDetections = smoothedDetections.map(
    (detection) => ({ ...detection }),
  )

  if (smoothedDetections.length !== rawDetections.length) {
    throw new Error(
      'IOS_TRACK_COUNT_INVARIANT_FAILED=' +
        JSON.stringify({
          raw: rawDetections.length,
          tracked: smoothedDetections.length,
        }),
    )
  }

  return smoothedDetections
}

function calculateCountConsensus(
  values: number[],
  fallbackValue: number,
): {
  value: number
  support: number
} {
  if (values.length === 0) {
    return { value: fallbackValue, support: 0 }
  }

  const possibleValues = [...new Set(values)]
  let bestValue = fallbackValue
  let bestSupport = -1
  let bestExactFrequency = -1

  for (const possibleValue of possibleValues) {
    const support = values.filter(
      (value) => Math.abs(value - possibleValue) <= 1,
    ).length
    const exactFrequency = values.filter(
      (value) => value === possibleValue,
    ).length
    const distanceToCurrent = Math.abs(
      possibleValue - fallbackValue,
    )
    const bestDistanceToCurrent = Math.abs(
      bestValue - fallbackValue,
    )

    if (
      support > bestSupport ||
      (support === bestSupport &&
        exactFrequency > bestExactFrequency) ||
      (support === bestSupport &&
        exactFrequency === bestExactFrequency &&
        distanceToCurrent < bestDistanceToCurrent)
    ) {
      bestValue = possibleValue
      bestSupport = support
      bestExactFrequency = exactFrequency
    }
  }

  const supportedValues = values.filter(
    (value) => Math.abs(value - bestValue) <= 1,
  )
  const robustValue =
    supportedValues.length > 0
      ? Math.round(median(supportedValues))
      : bestValue

  return {
    value: robustValue,
    support: bestSupport,
  }
}

function updatePendingCandidate(
  candidateValue: number,
  requiredStreak: number,
): void {
  if (pendingCandidateCount === candidateValue) {
    pendingCandidateStreak += 1
  } else {
    pendingCandidateCount = candidateValue
    pendingCandidateStreak = 1
  }

  if (pendingCandidateStreak < requiredStreak) {
    return
  }

  committedCount = candidateValue
  pendingCandidateCount = null
  pendingCandidateStreak = 0
}

function updateCountState(currentCount: number): CountState {
  const currentTime = performance.now()

  if (countHistory.length >= countHistoryLimit) {
    countHistory.shift()
  }
  countHistory.push(currentCount)

  if (currentCount === 0) {
    if (zeroDetectionStreak === 0) {
      zeroDetectionStartedAt = currentTime
    }
    zeroDetectionStreak += 1
  } else {
    zeroDetectionStreak = 0
    zeroDetectionStartedAt = 0
  }

  const recentValues = countHistory.slice(-countRecentWindowSize)
  const recentConsensus = calculateCountConsensus(
    recentValues,
    currentCount,
  )
  const fullConsensus = calculateCountConsensus(
    countHistory,
    currentCount,
  )
  const recentRequiredSupport =
    recentValues.length >= countRecentWindowSize
      ? 4
      : recentValues.length
  const fullRequiredSupport = Math.max(
    1,
    Math.ceil(countHistory.length * 0.625),
  )
  const recentAccepted =
    recentValues.length >= countRecentWindowSize &&
    recentConsensus.support >= recentRequiredSupport
  const fullAccepted =
    fullConsensus.support >= fullRequiredSupport
  const candidateValue = recentAccepted
    ? recentConsensus.value
    : fullConsensus.value
  let candidateAccepted = recentAccepted && fullAccepted
  const zeroElapsedMs =
    zeroDetectionStartedAt > 0
      ? currentTime - zeroDetectionStartedAt
      : 0
  const zeroReleaseAccepted =
    zeroDetectionStreak >= zeroReleaseRequiredFrames &&
    zeroElapsedMs >= zeroReleaseRequiredMs

  if (
    candidateValue === 0 &&
    committedCount !== null &&
    committedCount > 0 &&
    !zeroReleaseAccepted
  ) {
    candidateAccepted = false
  }

  if (candidateAccepted) {
    if (committedCount === null) {
      updatePendingCandidate(
        candidateValue,
        initialCommitRequiredStreak,
      )
    } else if (candidateValue === committedCount) {
      pendingCandidateCount = null
      pendingCandidateStreak = 0
    } else {
      const difference = Math.abs(
        candidateValue - committedCount,
      )
      updatePendingCandidate(
        candidateValue,
        difference <= 1
          ? adjacentCountRequiredStreak
          : changedCountRequiredStreak,
      )
    }
  } else if (pendingCandidateStreak > 0) {
    pendingCandidateStreak = Math.max(
      0,
      pendingCandidateStreak - 1,
    )
    if (pendingCandidateStreak === 0) {
      pendingCandidateCount = null
    }
  }

  const displayedCount = committedCount ?? currentCount
  const stableCount = committedCount ?? candidateValue
  const isCountStable =
    committedCount !== null &&
    (candidateAccepted ||
      Math.abs(currentCount - committedCount) <= 1)

  return {
    displayedCount,
    stableCount,
    isCountStable,
    history: [...countHistory],
  }
}

function mapToVideoCoordinates(
  detections: LocalDetection[],
  crop: PreviewCrop,
): PreviewDetection[] {
  return detections.map((detection) => ({
    x1: detection.x1 + crop.x,
    y1: detection.y1 + crop.y,
    x2: detection.x2 + crop.x,
    y2: detection.y2 + crop.y,
    score: detection.score,
    classId: detection.classId,
  }))
}

export function resetPreviewModelStability(): void {
  previousSmoothedDetections = []
  countHistory.length = 0
  committedCount = null
  pendingCandidateCount = null
  pendingCandidateStreak = 0
  zeroDetectionStreak = 0
  zeroDetectionStartedAt = 0
}

type PreviewCandidateResult = {
  session:
    PreviewModelSession
  sessionCreateMs: number
  warmupMs: number
}

async function initializePreviewCandidate(
  threadCount:
    PreviewThreadCount,
  fallbackOccurred: boolean,
): Promise<PreviewCandidateResult> {
  await waitForPreviewWorkerBoot()

  const modelBytes =
    await getAiModelBytes(
      'preview',
    )

  const modelBuffer =
    takePreviewModelBuffer(
      modelBytes,
    )

  const startedAt =
    performance.now()

  const requestId =
    nextPreviewRequestId()

  const payload =
    await previewWorkerRequest(
      {
        kind: 'init',
        requestId,
        modelBuffer,
        threadCount,
        sessionCreateTimeoutMs:
          previewSessionCreateTimeoutMs,
      },
      [modelBuffer],
      previewSessionCreateTimeoutMs,
    )

  const inputName =
    String(
      payload.inputName ??
      '',
    )

  const outputName =
    String(
      payload.outputName ??
      '',
    )

  if (
    !inputName ||
    !outputName
  ) {
    throw new Error(
      'PREVIEW_WORKER_IO_NAMES_MISSING',
    )
  }

  const sessionCreateMs =
    Number(
      payload.sessionCreateMs ??
      (
        performance.now() -
        startedAt
      ),
    )

  const warmupMs =
    Number(
      payload.warmupMs ??
      0,
    )

  const session:
    PreviewModelSession = {
      inputName,
      outputName,
      threadCount,
      crossOriginIsolated:
        window.crossOriginIsolated,
      executionProvider:
        'wasm',
      graphCaptureEnabled:
        false,
      warmupMs,
      webGpuAvailable:
        'gpu' in navigator,
      secureContext:
        window.isSecureContext,
      workerEnabled:
        true,
      fallbackOccurred,
  }

  sessionInfo =
    session

  return {
    session,
    sessionCreateMs,
    warmupMs,
  }
}

function previewCandidateScore(
  candidate:
    PreviewCandidateResult,
): number {
  return (
    candidate.warmupMs +
    Math.min(
      1500,
      candidate.sessionCreateMs *
        0.08,
    )
  )
}

async function calibratePreviewStrategy():
  Promise<PreviewCalibrationResult> {
  const candidates =
    previewCalibrationCandidates()

  const results:
    {
      threadCount:
        PreviewThreadCount
      sessionCreateMs: number
      warmupMs: number
      scoreMs: number
    }[] = []

  for (
    const threadCount of
    candidates
  ) {
    try {
      const candidate =
        await initializePreviewCandidate(
          threadCount,
          false,
        )

      results.push({
        threadCount,
        sessionCreateMs:
          candidate.sessionCreateMs,
        warmupMs:
          candidate.warmupMs,
        scoreMs:
          previewCandidateScore(
            candidate,
          ),
      })
    } catch (error) {
      console.warn(
        'BESHMARAI_PREVIEW_AUTOTUNE_CANDIDATE_FAILED',
        {
          threadCount,
          code:
            error instanceof Error
              ? error.name
              : 'unknown',
          message:
            error instanceof Error
              ? error.message
              : String(error),
        },
      )
    } finally {
      terminatePreviewWorker(
        `autotune-${threadCount}t-complete`,
      )
    }
  }

  if (
    results.length === 0
  ) {
    throw new Error(
      'PREVIEW_AUTOTUNE_ALL_CANDIDATES_FAILED',
    )
  }

  results.sort(
    (first, second) => {
      const scoreDelta =
        first.scoreMs -
        second.scoreMs

      if (
        Math.abs(scoreDelta) <=
        Math.min(
          first.scoreMs,
          second.scoreMs,
        ) * 0.06
      ) {
        return (
          first.threadCount -
          second.threadCount
        )
      }

      return scoreDelta
    },
  )

  const winner =
    results[0]

  console.info(
    'BESHMARAI_PREVIEW_AUTOTUNE_COMPLETE',
    {
      candidates:
        results,
      selected_thread_count:
        winner.threadCount,
      repeated_on_next_launch:
        false,
      strategy_storage:
        'beshmarai_device_strategy_safe_v2',
    },
  )

  return winner
}

export async function loadPreviewModelSession():
  Promise<PreviewModelSession> {
  if (sessionInfo) {
    return sessionInfo
  }

  if (sessionPromise) {
    return sessionPromise
  }

  sessionPromise =
    (async () => {
      const deviceStrategy =
        readDeviceStrategy()

      const selected =
        deviceStrategy
          ? {
              threadCount:
                deviceStrategy.previewThreads,
              sessionCreateMs: 0,
              warmupMs: 0,
              scoreMs: 0,
            }
          : await calibratePreviewStrategy()

      const candidates:
        PreviewThreadCount[] = [
          selected.threadCount,
        ]

      if (
        selected.threadCount !== 1
      ) {
        candidates.push(1)
      }

      let lastError:
        unknown = null

      for (
        const [
          candidateIndex,
          threadCount,
        ] of candidates.entries()
      ) {
        try {
          const result =
            await initializePreviewCandidate(
              threadCount,
              candidateIndex > 0,
            )

          if (
            candidateIndex > 0
          ) {
            updateDeviceStrategyPreviewThreads(
              threadCount,
            )
          }

          console.info(
            'IOS_WEB_RAW_WASM_MODEL_READY',
            {
              ...result.session,
              sessionCreateMs:
                result.sessionCreateMs,
              previewSessionRuntimeMarker,
              previewWorkerClientMarker,
              startupWarmupSkipped:
                false,
              startupWarmupLocation:
                'dedicated-worker',
              sessionCreateTimeoutMs:
                previewSessionCreateTimeoutMs,
              strategy_from_cache:
                Boolean(
                  deviceStrategy,
                ),
              single_strategy_record:
                true,
              inputShape: [
                1,
                3,
                inputSize,
                inputSize,
              ],
              outputShape: [
                1,
                outputChannels,
                outputCandidates,
              ],
              confidenceThreshold,
              iouThreshold,
            },
          )

          return result.session
        } catch (error) {
          lastError = error

          console.warn(
            'BESHMARAI_PREVIEW_SESSION_PLAN_FAILED',
            {
              threadCount,
              candidateIndex,
              code:
                error instanceof Error
                  ? error.name
                  : 'unknown',
              message:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          )

          terminatePreviewWorker(
            `session-${threadCount}t-failed`,
          )
        }
      }

      const terminalError =
        new Error(
          lastError instanceof Error
            ? lastError.message
            : 'No Preview runtime plan succeeded.',
        )

      terminalError.name =
        lastError instanceof Error
          ? lastError.name
          : 'preview-all-plans-exhausted'

      throw terminalError
    })().catch(
      (error: unknown) => {
        terminatePreviewWorker(
          'all-session-plans-failed',
        )
        throw error
      },
    )

  return sessionPromise
}

export async function runPreviewModelFrameOnce(
  video: HTMLVideoElement,
  crop?: PreviewCrop,
): Promise<PreviewFrameRunResult> {
  await loadPreviewModelSession()

  if (!sessionInfo) {
    throw new Error('PREVIEW_WORKER_SESSION_NOT_READY')
  }

  const endToEndStartedAt = performance.now()
  const prepared = prepareInput(video, crop)
  const inputBufferCandidate = prepared.tensorData.buffer

  if (!(inputBufferCandidate instanceof ArrayBuffer)) {
    throw new Error('PREVIEW_INPUT_BUFFER_NOT_TRANSFERABLE')
  }

  const requestId = nextPreviewRequestId()
  const payload = await previewWorkerRequest(
    {
      kind: 'run',
      requestId,
      inputBuffer: inputBufferCandidate,
    },
    [inputBufferCandidate],
    previewInferenceTimeoutMs,
  )

  const outputBuffer = payload.outputBuffer
  if (!(outputBuffer instanceof ArrayBuffer)) {
    throw new Error('PREVIEW_WORKER_OUTPUT_BUFFER_INVALID')
  }

  const outputShape = Array.isArray(payload.outputShape)
    ? payload.outputShape.map(Number)
    : []
  const outputData = new Float32Array(outputBuffer)
  const inferenceMs = Number(payload.inferenceMs ?? 0)
  const decoded = decodeOutput(
    outputData,
    outputShape,
    prepared,
  )
  const smoothedLocalDetections = smoothCurrentFrameDetections(
    decoded.detections,
  )
  const countState = updateCountState(
    smoothedLocalDetections.length,
  )
  const detections = mapToVideoCoordinates(
    smoothedLocalDetections,
    prepared.crop,
  )
  const endToEndMs = performance.now() - endToEndStartedAt

  return {
    inputShape: [1, 3, inputSize, inputSize],
    outputShape,
    outputLength: outputData.length,
    sourceWidth: prepared.crop.width,
    sourceHeight: prepared.crop.height,
    resizedWidth: prepared.resizedWidth,
    resizedHeight: prepared.resizedHeight,
    offsetX: prepared.padX,
    offsetY: prepared.padY,
    rawCandidateCount: decoded.preNmsCount,
    rawDetectionCount: smoothedLocalDetections.length,
    detections,
    displayedCount: countState.displayedCount,
    stableCount: countState.stableCount,
    isCountStable: countState.isCountStable,
    countHistory: countState.history,
    confidenceThreshold,
    iouThreshold,
    preprocessMs: prepared.preprocessMs,
    inferenceMs,
    postprocessMs: decoded.postprocessMs,
    totalMs: endToEndMs,
    endToEndMs,
    maximumRawScore: decoded.maximumRawScore,
    minimumRawScore: decoded.minimumRawScore,
    executionProvider: 'wasm',
    modelKind: 'raw-wasm-ios',
    fallbackOccurred: false,
    workerEnabled: true,
  }
}
