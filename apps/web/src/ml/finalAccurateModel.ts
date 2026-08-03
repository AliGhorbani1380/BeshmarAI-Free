// BESHMARAI_FINAL_MODEL_CONTRACT_CLEAN_ROOM_V3

export const FINAL_ACCURATE_INPUT_SIZE =
  1152

export const FINAL_ACCURATE_OUTPUT_CHANNELS =
  5

export const FINAL_ACCURATE_OUTPUT_CANDIDATES =
  27216

const inputSize =
  FINAL_ACCURATE_INPUT_SIZE

const outputChannels =
  FINAL_ACCURATE_OUTPUT_CHANNELS

const outputCandidates =
  FINAL_ACCURATE_OUTPUT_CANDIDATES

// BESHMARAI_RUNTIME_DETECTION_SETTINGS_V13_BEGIN
export const FINAL_ACCURATE_DEFAULT_SETTINGS = {
  confidenceThreshold: 0.05,
  iouThreshold: 0.45,
} as const

export type FinalAccurateRuntimeSettings = {
  confidenceThreshold: number
  iouThreshold: number
}

export const FINAL_ACCURATE_SETTINGS_STORAGE_KEY =
  'beshmarai_final_accurate_settings_v13'

function normalizeFinalAccurateSettings(
  settings: Partial<FinalAccurateRuntimeSettings>,
): FinalAccurateRuntimeSettings {
  const confidenceThreshold =
    typeof settings.confidenceThreshold === 'number' &&
    Number.isFinite(settings.confidenceThreshold)
      ? Math.min(
          0.95,
          Math.max(
            0.01,
            settings.confidenceThreshold,
          ),
        )
      : FINAL_ACCURATE_DEFAULT_SETTINGS
          .confidenceThreshold

  const iouThreshold =
    typeof settings.iouThreshold === 'number' &&
    Number.isFinite(settings.iouThreshold)
      ? Math.min(
          0.9,
          Math.max(
            0.1,
            settings.iouThreshold,
          ),
        )
      : FINAL_ACCURATE_DEFAULT_SETTINGS
          .iouThreshold

  return {
    confidenceThreshold,
    iouThreshold,
  }
}

export function getFinalAccurateRuntimeSettings():
  FinalAccurateRuntimeSettings {
  try {
    const storedValue =
      window.localStorage.getItem(
        FINAL_ACCURATE_SETTINGS_STORAGE_KEY,
      )

    if (!storedValue) {
      return {
        ...FINAL_ACCURATE_DEFAULT_SETTINGS,
      }
    }

    const parsed = JSON.parse(
      storedValue,
    ) as Partial<FinalAccurateRuntimeSettings>

    return normalizeFinalAccurateSettings(
      parsed,
    )
  } catch {
    return {
      ...FINAL_ACCURATE_DEFAULT_SETTINGS,
    }
  }
}

export function saveFinalAccurateRuntimeSettings(
  settings: Partial<FinalAccurateRuntimeSettings>,
): FinalAccurateRuntimeSettings {
  const normalized =
    normalizeFinalAccurateSettings(
      settings,
    )

  try {
    window.localStorage.setItem(
      FINAL_ACCURATE_SETTINGS_STORAGE_KEY,
      JSON.stringify(normalized),
    )
  } catch {
    // Local storage is best effort.
  }

  return normalized
}

export function resetFinalAccurateRuntimeSettings():
  FinalAccurateRuntimeSettings {
  try {
    window.localStorage.removeItem(
      FINAL_ACCURATE_SETTINGS_STORAGE_KEY,
    )
  } catch {
    // Local storage is best effort.
  }

  return {
    ...FINAL_ACCURATE_DEFAULT_SETTINGS,
  }
}
// BESHMARAI_RUNTIME_DETECTION_SETTINGS_V13_END

export const FINAL_ACCURATE_PRE_NMS_TOP_K =
  3000

export const FINAL_ACCURATE_MAXIMUM_DETECTIONS =
  512

const preNmsTopK =
  FINAL_ACCURATE_PRE_NMS_TOP_K

const maximumDetections =
  FINAL_ACCURATE_MAXIMUM_DETECTIONS

export type FinalAccurateExecutionProvider =
  | 'webgpu'
  | 'wasm'

export type FinalAccurateDetection = {
  x1: number
  y1: number
  x2: number
  y2: number
  score: number
  classId: 0
}

export type FinalPreparedInput = {
  tensorData: Float32Array
  sourceWidth: number
  sourceHeight: number
  resizedWidth: number
  resizedHeight: number
  padX: number
  padY: number
  scale: number
  preprocessMs: number
}

export type FinalDecodedOutput = {
  detections:
    FinalAccurateDetection[]
  preNmsCount: number
  postprocessMs: number
}

export type FinalAccurateRunResult = {
  inputShape: [1, 3, 1152, 1152]
  outputShape: number[]
  outputLength: number
  sourceWidth: number
  sourceHeight: number
  resizedWidth: number
  resizedHeight: number
  offsetX: number
  offsetY: number
  rawCandidateCount: number
  detections:
    FinalAccurateDetection[]
  count: number
  confidenceThreshold: number
  iouThreshold: number
  preNmsTopK: number
  maximumDetections: number
  preprocessMs: number
  inferenceMs: number
  postprocessMs: number
  totalMs: number
  executionProvider:
    FinalAccurateExecutionProvider
  fallbackOccurred: boolean
  modelLoadMs: number
  sessionCreateMs: number
  runtimePrepareMs: number
  runtimeProfileId: string
  sessionRetentionMs: number
  threadCount: number
  wasmProxyEnabled: false
  memoryClass:
    | 'low'
    | 'medium'
    | 'high'
  modelVariantId: string
}

const preprocessCanvas =
  document.createElement('canvas')

preprocessCanvas.width =
  inputSize

preprocessCanvas.height =
  inputSize

const preprocessContext = (() => {
  const context =
    preprocessCanvas.getContext(
      '2d',
      {
        alpha: false,
        willReadFrequently: true,
      },
    )

  if (!context) {
    throw new Error(
      'FINAL_1152_PREPROCESS_CONTEXT_NOT_AVAILABLE',
    )
  }

  return context
})()

const inputPlaneSize =
  inputSize * inputSize

function clampNumber(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  )
}

export function prepareFinalAccurateInput(
  source: HTMLCanvasElement,
): FinalPreparedInput {
  const startedAt = performance.now()
  const sourceWidth = source.width
  const sourceHeight = source.height

  if (
    sourceWidth <= 1 ||
    sourceHeight <= 1
  ) {
    throw new Error(
      'FINAL_1152_SOURCE_CANVAS_SIZE_INVALID',
    )
  }

  const scale = Math.min(
    inputSize / sourceWidth,
    inputSize / sourceHeight,
  )

  const resizedWidth =
    sourceWidth * scale

  const resizedHeight =
    sourceHeight * scale

  const padX =
    (inputSize - resizedWidth) / 2

  const padY =
    (inputSize - resizedHeight) / 2

  preprocessContext.fillStyle =
    'rgb(114, 114, 114)'

  preprocessContext.fillRect(
    0,
    0,
    inputSize,
    inputSize,
  )

  preprocessContext.imageSmoothingEnabled =
    true

  preprocessContext.imageSmoothingQuality =
    'high'

  preprocessContext.drawImage(
    source,
    0,
    0,
    sourceWidth,
    sourceHeight,
    padX,
    padY,
    resizedWidth,
    resizedHeight,
  )

  const rgba =
    preprocessContext.getImageData(
      0,
      0,
      inputSize,
      inputSize,
    ).data

  const planeSize =
    inputPlaneSize

  const tensorData =
    new Float32Array(
      inputPlaneSize * 3,
    )

  for (
    let pixelIndex = 0;
    pixelIndex < planeSize;
    pixelIndex += 1
  ) {
    const rgbaOffset =
      pixelIndex * 4

    tensorData[pixelIndex] =
      rgba[rgbaOffset] / 255

    tensorData[
      planeSize + pixelIndex
    ] =
      rgba[rgbaOffset + 1] / 255

    tensorData[
      planeSize * 2 + pixelIndex
    ] =
      rgba[rgbaOffset + 2] / 255
  }

  return {
    tensorData,
    sourceWidth,
    sourceHeight,
    resizedWidth,
    resizedHeight,
    padX,
    padY,
    scale,
    preprocessMs:
      performance.now() - startedAt,
  }
}

export function validateFinalAccurateOutputShape(
  shape: readonly number[],
): void {
  if (
    shape.length !== 3 ||
    shape[0] !== 1 ||
    shape[1] !== outputChannels ||
    shape[2] !== outputCandidates
  ) {
    throw new Error(
      'FINAL_1152_OUTPUT_SHAPE_INVALID=' +
        JSON.stringify({
          actual: shape,
          expected: [
            1,
            outputChannels,
            outputCandidates,
          ],
        }),
    )
  }
}

function getOutputValue(
  outputData: Float32Array,
  candidateIndex: number,
  channelIndex: number,
): number {
  return Number(
    outputData[
      channelIndex *
        outputCandidates +
        candidateIndex
    ],
  )
}

function intersectionOverUnion(
  first: FinalAccurateDetection,
  second: FinalAccurateDetection,
): number {
  const intersectionX1 = Math.max(
    first.x1,
    second.x1,
  )

  const intersectionY1 = Math.max(
    first.y1,
    second.y1,
  )

  const intersectionX2 = Math.min(
    first.x2,
    second.x2,
  )

  const intersectionY2 = Math.min(
    first.y2,
    second.y2,
  )

  const intersectionWidth = Math.max(
    0,
    intersectionX2 -
      intersectionX1,
  )

  const intersectionHeight = Math.max(
    0,
    intersectionY2 -
      intersectionY1,
  )

  const intersectionArea =
    intersectionWidth *
    intersectionHeight

  const firstArea =
    Math.max(
      0,
      first.x2 - first.x1,
    ) *
    Math.max(
      0,
      first.y2 - first.y1,
    )

  const secondArea =
    Math.max(
      0,
      second.x2 - second.x1,
    ) *
    Math.max(
      0,
      second.y2 - second.y1,
    )

  const unionArea =
    firstArea +
    secondArea -
    intersectionArea

  return unionArea > 0
    ? intersectionArea /
        unionArea
    : 0
}

function applyNms(
  candidates: FinalAccurateDetection[],
  iouThreshold: number,
): FinalAccurateDetection[] {
  const sorted = [...candidates]
    .sort(
      (first, second) =>
        second.score - first.score,
    )
    .slice(0, preNmsTopK)

  const selected:
    FinalAccurateDetection[] = []

  for (const candidate of sorted) {
    let suppressed = false

    for (const kept of selected) {
      if (
        intersectionOverUnion(
          candidate,
          kept,
        ) > iouThreshold
      ) {
        suppressed = true
        break
      }
    }

    if (!suppressed) {
      selected.push(candidate)
    }

    if (
      selected.length >=
      maximumDetections
    ) {
      break
    }
  }

  return selected
}

function sortDetectionsSpatially(
  detections:
    FinalAccurateDetection[],
): FinalAccurateDetection[] {
  return [...detections].sort(
    (first, second) => {
      const firstCenterY =
        (first.y1 + first.y2) / 2

      const secondCenterY =
        (second.y1 + second.y2) / 2

      const averageHeight =
        (
          first.y2 -
          first.y1 +
          second.y2 -
          second.y1
        ) / 2

      const sameVisualRow =
        Math.abs(
          firstCenterY -
          secondCenterY,
        ) <=
        Math.max(
          10,
          averageHeight * 0.5,
        )

      if (sameVisualRow) {
        return first.x1 - second.x1
      }

      return firstCenterY -
        secondCenterY
    },
  )
}

export function decodeFinalAccurateOutput(
  outputData: Float32Array,
  outputShape: readonly number[],
  prepared: FinalPreparedInput,
  runtimeSettings: FinalAccurateRuntimeSettings,
): FinalDecodedOutput {
  const {
    confidenceThreshold,
    iouThreshold,
  } = runtimeSettings

  const startedAt =
    performance.now()

  validateFinalAccurateOutputShape(outputShape)

  const candidates:
    FinalAccurateDetection[] = []

  for (
    let candidateIndex = 0;
    candidateIndex <
    outputCandidates;
    candidateIndex += 1
  ) {
    let centerX = getOutputValue(
      outputData,
      candidateIndex,
      0,
    )

    let centerY = getOutputValue(
      outputData,
      candidateIndex,
      1,
    )

    let width = getOutputValue(
      outputData,
      candidateIndex,
      2,
    )

    let height = getOutputValue(
      outputData,
      candidateIndex,
      3,
    )

    const score = getOutputValue(
      outputData,
      candidateIndex,
      4,
    )

    if (
      !Number.isFinite(score) ||
      score < confidenceThreshold
    ) {
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

    const x1 = clampNumber(
      (
        centerX -
        width / 2 -
        prepared.padX
      ) / prepared.scale,
      0,
      prepared.sourceWidth,
    )

    const y1 = clampNumber(
      (
        centerY -
        height / 2 -
        prepared.padY
      ) / prepared.scale,
      0,
      prepared.sourceHeight,
    )

    const x2 = clampNumber(
      (
        centerX +
        width / 2 -
        prepared.padX
      ) / prepared.scale,
      0,
      prepared.sourceWidth,
    )

    const y2 = clampNumber(
      (
        centerY +
        height / 2 -
        prepared.padY
      ) / prepared.scale,
      0,
      prepared.sourceHeight,
    )

    if (
      x2 - x1 < 2 ||
      y2 - y1 < 2
    ) {
      continue
    }

    candidates.push({
      x1,
      y1,
      x2,
      y2,
      score,
      classId: 0,
    })
  }

  const detections =
    sortDetectionsSpatially(
      applyNms(
        candidates,
        iouThreshold,
      ),
    )

  return {
    detections,
    preNmsCount:
      candidates.length,
    postprocessMs:
      performance.now() -
      startedAt,
  }
}
