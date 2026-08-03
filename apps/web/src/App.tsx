import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { flushSync } from 'react-dom'
import { brand } from './config/brand'
import {
  loadPreviewModelSession,
  resetPreviewModelStability,
  runPreviewModelFrameOnce,
  type PreviewCrop,
  type PreviewDetection,
} from './ml/iosPreviewModel'
import {
  FINAL_ACCURATE_DEFAULT_SETTINGS,
  getFinalAccurateRuntimeSettings,
  resetFinalAccurateRuntimeSettings,
  saveFinalAccurateRuntimeSettings,
  type FinalAccurateDetection,
  type FinalAccurateRuntimeSettings,
} from './ml/finalAccurateModel'
import {
  clearDeviceStrategy,
  clearFinalRuntimePlanHistory,
  ensureDeviceStrategyOnce,
  getFinalRuntimeDiagnostics,
  readDeviceStrategy,
  readDeviceStrategyPreference,
  releaseFinalRuntime,
  resetDeviceStrategyPreference,
  runFinalAccurateModel,
  writeDeviceStrategyPreference,
  type DeviceStrategyPreference,
} from './finalRuntime'
// BESHMARAI_FINAL_RUNTIME_CLEAN_ROOM_APP_V3
import './styles.css'



type AppScreen = 'menu' | 'camera' | 'settings'
type CameraState = 'opening' | 'ready' | 'error'

type CameraDeviceOption = {
  deviceId: string
  label: string
  groupId: string
}

// BESHMARAI_AUTO_LENS_SETTINGS_V13_BEGIN
type CameraSelectionMode =
  | 'auto'
  | 'manual'

type CameraTrackCapabilities =
  MediaTrackCapabilities & {
    torch?: boolean
    zoom?: {
      min?: number
      max?: number
    }
    focusMode?: string[]
    exposureMode?: string[]
    whiteBalanceMode?: string[]
  }

type CameraDeviceEvidence = {
  deviceId: string
  label: string
  facingMode: string
  torchSupported: boolean
  score: number
  strongMainCandidate: boolean
}

const cameraSelectionModeStorageKey =
  'beshmarai_camera_selection_mode_v13'

const cameraManualDeviceStorageKey =
  'beshmarai_camera_manual_device_id_v13'

const cameraAutoDeviceStorageKey =
  'beshmarai_camera_auto_device_id_v13'

const cameraAutoLabelStorageKey =
  'beshmarai_camera_auto_device_label_v13'

function readLocalStorageValue(
  key: string,
): string {
  try {
    return window.localStorage
      .getItem(key) ?? ''
  } catch {
    return ''
  }
}

function writeLocalStorageValue(
  key: string,
  value: string,
): void {
  try {
    if (value) {
      window.localStorage.setItem(
        key,
        value,
      )
    } else {
      window.localStorage.removeItem(
        key,
      )
    }
  } catch {
    // Local storage is best effort.
  }
}

function getCameraSelectionMode():
  CameraSelectionMode {
  return readLocalStorageValue(
    cameraSelectionModeStorageKey,
  ) === 'manual'
    ? 'manual'
    : 'auto'
}

function saveCameraSelectionMode(
  mode: CameraSelectionMode,
): void {
  writeLocalStorageValue(
    cameraSelectionModeStorageKey,
    mode,
  )
}

function normalizeCameraDeviceLabel(
  label: string,
): string {
  return label
    .toLocaleLowerCase('en-US')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cameraDeviceLabelIncludesAny(
  normalizedLabel: string,
  values: string[],
): boolean {
  return values.some((value) =>
    normalizedLabel.includes(value),
  )
}

function getCameraDeviceHint(
  label: string,
): string {
  const normalizedLabel =
    normalizeCameraDeviceLabel(label)

  if (
    cameraDeviceLabelIncludesAny(
      normalizedLabel,
      [
        'front',
        'selfie',
        'facetime',
        'user facing',
        'facing front',
        'دوربین جلو',
      ],
    )
  ) {
    return 'سلفی'
  }

  if (
    cameraDeviceLabelIncludesAny(
      normalizedLabel,
      [
        'ultra wide',
        'ultrawide',
        'ultra-wide',
        '0.5x',
        '0,5x',
        '0.5 x',
        '0,5 x',
        'فوق عریض',
        'فوق‌عریض',
      ],
    )
  ) {
    return 'فوق‌عریض ۰٫۵×'
  }

  if (
    cameraDeviceLabelIncludesAny(
      normalizedLabel,
      [
        'telephoto',
        'tele camera',
        'tele lens',
        'periscope',
        '3x camera',
        '5x camera',
      ],
    )
  ) {
    return 'تله'
  }

  if (
    cameraDeviceLabelIncludesAny(
      normalizedLabel,
      [
        'main camera',
        'primary camera',
        'wide camera',
        'wide angle camera',
        '1x',
        '1 x',
      ],
    )
  ) {
    return 'احتمالاً دوربین اصلی ۱×'
  }

  if (
    cameraDeviceLabelIncludesAny(
      normalizedLabel,
      [
        'back',
        'rear',
        'environment',
        'پشت',
      ],
    )
  ) {
    return 'دوربین پشت'
  }

  return 'نوع لنز نامشخص'
}

function formatCameraDeviceOption(
  device: CameraDeviceOption,
  index: number,
): string {
  const rawLabel =
    device.label.trim() ||
    `دوربین ${index + 1}`

  return `${rawLabel} — ${getCameraDeviceHint(
    rawLabel,
  )}`
}

function getCameraTrackCapabilities(
  track: MediaStreamTrack,
): CameraTrackCapabilities | null {
  if (
    typeof track.getCapabilities !==
    'function'
  ) {
    return null
  }

  return track.getCapabilities() as
    CameraTrackCapabilities
}

function createCameraDeviceEvidence(
  deviceId: string,
  label: string,
  settings: MediaTrackSettings | null,
  capabilities: CameraTrackCapabilities | null,
  isEnvironmentDefault = false,
): CameraDeviceEvidence {
  const normalizedLabel =
    normalizeCameraDeviceLabel(label)

  const facingMode =
    typeof settings?.facingMode ===
    'string'
      ? settings.facingMode
      : ''

  const isFront =
    facingMode === 'user' ||
    cameraDeviceLabelIncludesAny(
      normalizedLabel,
      [
        'front',
        'selfie',
        'facetime',
        'user facing',
        'facing front',
        'دوربین جلو',
      ],
    )

  const isUltraWide =
    cameraDeviceLabelIncludesAny(
      normalizedLabel,
      [
        'ultra wide',
        'ultrawide',
        'ultra-wide',
        '0.5x',
        '0,5x',
        '0.5 x',
        '0,5 x',
        'فوق عریض',
        'فوق‌عریض',
      ],
    )

  const isTelephoto =
    cameraDeviceLabelIncludesAny(
      normalizedLabel,
      [
        'telephoto',
        'tele camera',
        'tele lens',
        'periscope',
        '3x camera',
        '5x camera',
      ],
    )

  const isRear =
    facingMode === 'environment' ||
    cameraDeviceLabelIncludesAny(
      normalizedLabel,
      [
        'back',
        'rear',
        'environment',
        'پشت',
      ],
    )

  const looksMain =
    cameraDeviceLabelIncludesAny(
      normalizedLabel,
      [
        'main camera',
        'primary camera',
        'wide camera',
        'wide angle camera',
        '1x',
        '1 x',
      ],
    )

  const torchSupported =
    capabilities?.torch === true

  let score = 0

  if (isFront) {
    score -= 10000
  }

  if (isUltraWide) {
    score -= 4500
  }

  if (isTelephoto) {
    score -= 1400
  }

  if (isRear) {
    score += 2200
  }

  if (torchSupported) {
    score += 4200
  }

  if (looksMain) {
    score += 1800
  }

  if (isEnvironmentDefault) {
    score += 200
  }

  const width =
    typeof settings?.width === 'number'
      ? settings.width
      : 0

  const height =
    typeof settings?.height === 'number'
      ? settings.height
      : 0

  if (width > 0 && height > 0) {
    score += Math.min(
      320,
      Math.round(
        (width * height) / 30000,
      ),
    )
  }

  return {
    deviceId,
    label,
    facingMode,
    torchSupported,
    score,
    strongMainCandidate:
      torchSupported &&
      isRear &&
      !isFront &&
      !isUltraWide &&
      !isTelephoto,
  }
}

function cameraLabelProbePriority(
  device: CameraDeviceOption,
): number {
  return createCameraDeviceEvidence(
    device.deviceId,
    device.label,
    null,
    null,
  ).score
}

// BESHMARAI_AUTO_LENS_SETTINGS_V13_END

type PreviewModelState =
  | 'loading'
  | 'ready'
  | 'error'

type PreviewFrameTestState =
  | 'idle'
  | 'running'
  | 'success'
  | 'error'



type CameraScreenProps = {
  onBack: () => void
  onOpenSettings: () => void
}

type RoiRect = {
  x: number
  y: number
  width: number
  height: number
}

type RoiInteractionMode =
  | 'move'
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'

type RoiInteraction = {
  pointerId: number
  mode: RoiInteractionMode
  startX: number
  startY: number
  startRoi: RoiRect
}

type StageSize = {
  width: number
  height: number
}

type CapturedRoiPreview = {
  url: string
  width: number
  height: number
  count: number
  detections: FinalAccurateDetection[]
  rawCandidateCount: number
  preprocessMs: number
  inferenceMs: number
  postprocessMs: number
  sessionCreateMs: number
  runtimePrepareMs: number
  totalMs: number
  executionProvider: 'webgpu' | 'wasm'
  fallbackOccurred: boolean
}

type AccurateResultZoomState = {
  scale: number
  x: number
  y: number
}

type AccurateResultPoint = {
  x: number
  y: number
}

type AccurateResultGestureState = {
  mode: 'idle' | 'pan' | 'pinch'
  lastX: number
  lastY: number
  lastDistance: number
  moved: boolean
}

function accurateResultPointDistance(
  first: AccurateResultPoint,
  second: AccurateResultPoint,
) {
  return Math.hypot(
    first.x - second.x,
    first.y - second.y,
  )
}

function accurateResultPointCenter(
  first: AccurateResultPoint,
  second: AccurateResultPoint,
): AccurateResultPoint {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  }
}

function clampNumber(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  )
}

// BESHMARAI_ACCURATE_FREEZE_PAINT_V8_BEGIN

async function decodeFrozenPreviewImage(
  sourceUrl: string,
): Promise<void> {
  const image = new Image()

  const loadPromise =
    new Promise<void>(
      (resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => {
          reject(
            new Error(
              'Frozen accurate preview image could not be decoded.',
            ),
          )
        }
      },
    )

  image.decoding = 'sync'
  image.src = sourceUrl

  try {
    await image.decode()
  } catch {
    await loadPromise
  }
}

function waitForFrozenPreviewPaint():
  Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(resolve, 120)
      })
    })
  })
}

// BESHMARAI_ACCURATE_FREEZE_PAINT_V8_END

function fitRoiToStage(
  roi: RoiRect,
  stageWidth: number,
  stageHeight: number,
): RoiRect {
  const margin = Math.min(
    18,
    stageWidth * 0.04,
    stageHeight * 0.04,
  )

  const availableWidth = Math.max(
    1,
    stageWidth - margin * 2,
  )

  const availableHeight = Math.max(
    1,
    stageHeight - margin * 2,
  )

  const minimumWidth = Math.min(
    120,
    availableWidth,
  )

  const minimumHeight = Math.min(
    140,
    availableHeight,
  )

  const safeWidth = Math.min(
    availableWidth,
    Math.max(minimumWidth, roi.width),
  )

  const safeHeight = Math.min(
    availableHeight,
    Math.max(minimumHeight, roi.height),
  )

  const maximumX = Math.max(
    margin,
    stageWidth - margin - safeWidth,
  )

  const maximumY = Math.max(
    margin,
    stageHeight - margin - safeHeight,
  )

  return {
    x: clampNumber(
      roi.x,
      margin,
      maximumX,
    ),

    y: clampNumber(
      roi.y,
      margin,
      maximumY,
    ),

    width: safeWidth,
    height: safeHeight,
  }
}

function createInitialRoi(
  stageWidth: number,
  stageHeight: number,
): RoiRect {
  const initialWidth = Math.min(
    stageWidth * 0.8,
    430,
  )

  const initialHeight = Math.min(
    stageHeight * 0.58,
    390,
  )

  return fitRoiToStage(
    {
      x: (stageWidth - initialWidth) / 2,
      y: (stageHeight - initialHeight) / 2,
      width: initialWidth,
      height: initialHeight,
    },
    stageWidth,
    stageHeight,
  )
}


function mapStageRoiToVideoCrop(
  video: HTMLVideoElement,
  stage: HTMLElement,
  roi: RoiRect,
): PreviewCrop | null {
  if (
    video.videoWidth <= 0 ||
    video.videoHeight <= 0
  ) {
    return null
  }

  const bounds = stage.getBoundingClientRect()
  const stageWidth = bounds.width
  const stageHeight = bounds.height

  if (stageWidth <= 0 || stageHeight <= 0) {
    return null
  }

  const coverScale = Math.max(
    stageWidth / video.videoWidth,
    stageHeight / video.videoHeight,
  )
  const renderedWidth = video.videoWidth * coverScale
  const renderedHeight = video.videoHeight * coverScale
  const hiddenOffsetX = (renderedWidth - stageWidth) / 2
  const hiddenOffsetY = (renderedHeight - stageHeight) / 2

  const x = clampNumber(
    (roi.x + hiddenOffsetX) / coverScale,
    0,
    video.videoWidth - 2,
  )
  const y = clampNumber(
    (roi.y + hiddenOffsetY) / coverScale,
    0,
    video.videoHeight - 2,
  )
  const width = clampNumber(
    roi.width / coverScale,
    2,
    video.videoWidth - x,
  )
  const height = clampNumber(
    roi.height / coverScale,
    2,
    video.videoHeight - y,
  )

  return { x, y, width, height }
}

// BESHMARAI_IOS_SPATIAL_NUMBERING_V1_1

type PreviewSpatialDetection = {
  x1: number
  y1: number
  x2: number
  y2: number
  centerX: number
  centerY: number
  score?: number
}

type PreviewSpatialNumberedDetection =
  PreviewSpatialDetection & {
    number: number
  }

type PreviewSpatialNumberTrack = {
  number: number
  x1: number
  y1: number
  x2: number
  y2: number
  centerX: number
  centerY: number
  lastSeenAt: number
}

type PreviewSpatialNumberingResult = {
  detections:
    PreviewSpatialNumberedDetection[]

  tracks:
    PreviewSpatialNumberTrack[]

  nextNumber: number
  matchedCount: number
  reinitialized: boolean
}

const previewSpatialTrackRetentionMs =
  1100

function previewSpatialWidth(
  box: PreviewSpatialDetection,
): number {
  return Math.max(
    1,
    box.x2 - box.x1,
  )
}

function previewSpatialHeight(
  box: PreviewSpatialDetection,
): number {
  return Math.max(
    1,
    box.y2 - box.y1,
  )
}

function previewSpatialIou(
  first: PreviewSpatialDetection,
  second: PreviewSpatialDetection,
): number {
  const intersectionX1 =
    Math.max(
      first.x1,
      second.x1,
    )

  const intersectionY1 =
    Math.max(
      first.y1,
      second.y1,
    )

  const intersectionX2 =
    Math.min(
      first.x2,
      second.x2,
    )

  const intersectionY2 =
    Math.min(
      first.y2,
      second.y2,
    )

  const intersectionWidth =
    Math.max(
      0,
      intersectionX2 -
        intersectionX1,
    )

  const intersectionHeight =
    Math.max(
      0,
      intersectionY2 -
        intersectionY1,
    )

  const intersectionArea =
    intersectionWidth *
    intersectionHeight

  const firstArea =
    previewSpatialWidth(first) *
    previewSpatialHeight(first)

  const secondArea =
    previewSpatialWidth(second) *
    previewSpatialHeight(second)

  const unionArea =
    firstArea +
    secondArea -
    intersectionArea

  if (unionArea <= 0) {
    return 0
  }

  return (
    intersectionArea /
    (
      unionArea +
      0.000001
    )
  )
}

function previewSpatialCenterDistance(
  first: PreviewSpatialDetection,
  second: PreviewSpatialDetection,
): number {
  const deltaX =
    first.centerX -
    second.centerX

  const deltaY =
    first.centerY -
    second.centerY

  return Math.sqrt(
    deltaX * deltaX +
    deltaY * deltaY,
  )
}

function previewSpatialSizeAccepted(
  first: PreviewSpatialDetection,
  second: PreviewSpatialDetection,
): boolean {
  const firstWidth =
    previewSpatialWidth(first)

  const firstHeight =
    previewSpatialHeight(first)

  const secondWidth =
    previewSpatialWidth(second)

  const secondHeight =
    previewSpatialHeight(second)

  const widthRatio =
    Math.max(
      firstWidth,
      secondWidth,
    ) /
    Math.min(
      firstWidth,
      secondWidth,
    )

  const heightRatio =
    Math.max(
      firstHeight,
      secondHeight,
    ) /
    Math.min(
      firstHeight,
      secondHeight,
    )

  return (
    widthRatio <= 2.7 &&
    heightRatio <= 2.7
  )
}

function comparePreviewSpatialPosition(
  first: PreviewSpatialDetection,
  second: PreviewSpatialDetection,
): number {
  const averageHeight =
    (
      previewSpatialHeight(first) +
      previewSpatialHeight(second)
    ) / 2

  const sameRow =
    Math.abs(
      first.centerY -
      second.centerY,
    ) <=
    Math.max(
      10,
      averageHeight * 0.55,
    )

  if (sameRow) {
    return (
      first.centerX -
      second.centerX
    )
  }

  return (
    first.centerY -
    second.centerY
  )
}

function createFreshPreviewSpatialNumbers(
  detections:
    PreviewSpatialDetection[],

  currentTime: number,
): PreviewSpatialNumberingResult {
  const sortedIndices =
    detections
      .map(
        (_detection, index) =>
          index,
      )
      .sort(
        (
          firstIndex,
          secondIndex,
        ) =>
          comparePreviewSpatialPosition(
            detections[firstIndex],
            detections[secondIndex],
          ),
      )

  const numbers =
    new Array<number>(
      detections.length,
    ).fill(0)

  sortedIndices.forEach(
    (detectionIndex, orderIndex) => {
      numbers[detectionIndex] =
        orderIndex + 1
    },
  )

  const numberedDetections =
    detections.map(
      (detection, index) => ({
        ...detection,
        number: numbers[index],
      }),
    )

  const tracks =
    numberedDetections.map(
      (detection) => ({
        number:
          detection.number,

        x1: detection.x1,
        y1: detection.y1,
        x2: detection.x2,
        y2: detection.y2,

        centerX:
          detection.centerX,

        centerY:
          detection.centerY,

        lastSeenAt:
          currentTime,
      }),
    )

  return {
    detections:
      numberedDetections,

    tracks,

    nextNumber:
      detections.length + 1,

    matchedCount: 0,
    reinitialized: true,
  }
}

function assignPreviewSpatialNumbers(
  detections:
    PreviewSpatialDetection[],

  previousTracks:
    PreviewSpatialNumberTrack[],

  previousNextNumber: number,

  currentTime: number,
): PreviewSpatialNumberingResult {
  const retainedTracks =
    previousTracks.filter(
      (track) =>
        (
          currentTime -
          track.lastSeenAt
        ) <=
        previewSpatialTrackRetentionMs,
    )

  if (detections.length === 0) {
    return {
      detections: [],
      tracks: retainedTracks,

      nextNumber:
        previousNextNumber,

      matchedCount: 0,
      reinitialized: false,
    }
  }

  if (retainedTracks.length === 0) {
    return (
      createFreshPreviewSpatialNumbers(
        detections,
        currentTime,
      )
    )
  }

  const candidates: Array<{
    detectionIndex: number
    trackIndex: number
    score: number
  }> = []

  detections.forEach(
    (detection, detectionIndex) => {
      retainedTracks.forEach(
        (track, trackIndex) => {
          if (
            !previewSpatialSizeAccepted(
              detection,
              track,
            )
          ) {
            return
          }

          const iou =
            previewSpatialIou(
              detection,
              track,
            )

          const distance =
            previewSpatialCenterDistance(
              detection,
              track,
            )

          const minimumObjectSize =
            Math.min(
              previewSpatialWidth(
                detection,
              ),

              previewSpatialHeight(
                detection,
              ),

              previewSpatialWidth(
                track,
              ),

              previewSpatialHeight(
                track,
              ),
            )

          const distanceGate =
            Math.max(
              24,

              Math.min(
                120,
                minimumObjectSize *
                  2.15,
              ),
            )

          const distanceAccepted =
            distance <=
            distanceGate

          const overlapAccepted =
            iou >= 0.035

          if (
            !distanceAccepted &&
            !overlapAccepted
          ) {
            return
          }

          const normalizedDistance =
            Math.min(
              1,
              distance /
                distanceGate,
            )

          const score =
            iou * 12 +
            (
              1 -
              normalizedDistance
            ) * 3

          candidates.push({
            detectionIndex,
            trackIndex,
            score,
          })
        },
      )
    },
  )

  candidates.sort(
    (first, second) =>
      second.score -
      first.score,
  )

  const detectionMatched =
    new Array<boolean>(
      detections.length,
    ).fill(false)

  const trackMatched =
    new Array<boolean>(
      retainedTracks.length,
    ).fill(false)

  const detectionNumbers =
    new Array<number>(
      detections.length,
    ).fill(0)

  const currentTracks:
    PreviewSpatialNumberTrack[] = []

  let matchedCount = 0

  for (const candidate of candidates) {
    if (
      detectionMatched[
        candidate.detectionIndex
      ] ||
      trackMatched[
        candidate.trackIndex
      ]
    ) {
      continue
    }

    const detection =
      detections[
        candidate.detectionIndex
      ]

    const previousTrack =
      retainedTracks[
        candidate.trackIndex
      ]

    detectionMatched[
      candidate.detectionIndex
    ] = true

    trackMatched[
      candidate.trackIndex
    ] = true

    detectionNumbers[
      candidate.detectionIndex
    ] =
      previousTrack.number

    matchedCount += 1

    const currentWeight = 0.72
    const previousWeight = 0.28

    currentTracks.push({
      number:
        previousTrack.number,

      x1:
        previousTrack.x1 *
          previousWeight +
        detection.x1 *
          currentWeight,

      y1:
        previousTrack.y1 *
          previousWeight +
        detection.y1 *
          currentWeight,

      x2:
        previousTrack.x2 *
          previousWeight +
        detection.x2 *
          currentWeight,

      y2:
        previousTrack.y2 *
          previousWeight +
        detection.y2 *
          currentWeight,

      centerX:
        previousTrack.centerX *
          previousWeight +
        detection.centerX *
          currentWeight,

      centerY:
        previousTrack.centerY *
          previousWeight +
        detection.centerY *
          currentWeight,

      lastSeenAt:
        currentTime,
    })
  }

  const comparableCount =
    Math.min(
      detections.length,
      retainedTracks.length,
    )

  const matchRatio =
    comparableCount > 0
      ? matchedCount /
        comparableCount
      : 0

  const largeNewScene =
    detections.length >= 6 &&
    retainedTracks.length <= 2

  const incompatibleScene =
    detections.length >= 6 &&
    retainedTracks.length >= 6 &&
    matchRatio < 0.22

  if (
    largeNewScene ||
    incompatibleScene
  ) {
    return (
      createFreshPreviewSpatialNumbers(
        detections,
        currentTime,
      )
    )
  }

  const usedNumbers =
    new Set<number>()

  retainedTracks.forEach(
    (track) => {
      usedNumbers.add(
        track.number,
      )
    },
  )

  const unmatchedDetectionIndices =
    detections
      .map(
        (_detection, index) =>
          index,
      )
      .filter(
        (index) =>
          !detectionMatched[index],
      )
      .sort(
        (
          firstIndex,
          secondIndex,
        ) =>
          comparePreviewSpatialPosition(
            detections[firstIndex],
            detections[secondIndex],
          ),
      )

  let nextNumber =
    Math.max(
      1,
      previousNextNumber,
    )

  function allocateNumber(): number {
    let candidateNumber = 1

    while (
      usedNumbers.has(
        candidateNumber,
      )
    ) {
      candidateNumber += 1
    }

    usedNumbers.add(
      candidateNumber,
    )

    nextNumber =
      Math.max(
        nextNumber,
        candidateNumber + 1,
      )

    return candidateNumber
  }

  unmatchedDetectionIndices.forEach(
    (detectionIndex) => {
      const detection =
        detections[
          detectionIndex
        ]

      const number =
        allocateNumber()

      detectionNumbers[
        detectionIndex
      ] = number

      currentTracks.push({
        number,

        x1: detection.x1,
        y1: detection.y1,
        x2: detection.x2,
        y2: detection.y2,

        centerX:
          detection.centerX,

        centerY:
          detection.centerY,

        lastSeenAt:
          currentTime,
      })
    },
  )

  retainedTracks.forEach(
    (track, trackIndex) => {
      if (!trackMatched[trackIndex]) {
        currentTracks.push(
          track,
        )
      }
    },
  )

  const numberedDetections =
    detections.map(
      (detection, index) => {
        const number =
          detectionNumbers[index]

        if (number <= 0) {
          throw new Error(
            'IOS_SPATIAL_NUMBER_ASSIGNMENT_FAILED',
          )
        }

        return {
          ...detection,
          number,
        }
      },
    )

  return {
    detections:
      numberedDetections,

    tracks:
      currentTracks,

    nextNumber,
    matchedCount,
    reinitialized: false,
  }
}

type SettingsScreenProps = {
  onBack: () => void
}

function SettingsScreen({
  onBack,
}: SettingsScreenProps) {
  const [cameraDevices, setCameraDevices] =
    useState<CameraDeviceOption[]>([])

  const [cameraChoice, setCameraChoice] =
    useState(() => {
      const mode =
        getCameraSelectionMode()

      if (mode === 'manual') {
        const manualDeviceId =
          readLocalStorageValue(
            cameraManualDeviceStorageKey,
          )

        if (manualDeviceId) {
          return manualDeviceId
        }
      }

      return 'auto'
    })

  const [modelSettings, setModelSettings] =
    useState<FinalAccurateRuntimeSettings>(
      () =>
        getFinalAccurateRuntimeSettings(),
    )

  const [
    runtimePreference,
    setRuntimePreference,
  ] = useState<DeviceStrategyPreference>(
    () =>
      readDeviceStrategyPreference(),
  )

  const [
    effectiveDeviceStrategy,
    setEffectiveDeviceStrategy,
  ] = useState(
    () =>
      readDeviceStrategy(),
  )

  const [runtimePreferenceBusy, setRuntimePreferenceBusy] =
    useState(false)

  const [settingsMessage, setSettingsMessage] =
    useState(
      'تنظیمات به‌صورت خودکار ذخیره می‌شوند.',
    )

  useEffect(() => {
    let cancelled = false

    async function loadDevices() {
      try {
        const devices =
          await navigator.mediaDevices
            ?.enumerateDevices?.()

        if (cancelled || !devices) {
          return
        }

        setCameraDevices(
          devices
            .filter(
              (device) =>
                device.kind ===
                  'videoinput' &&
                Boolean(device.deviceId),
            )
            .map((device) => ({
              deviceId: device.deviceId,
              label: device.label,
              groupId: device.groupId,
            })),
        )
      } catch {
        if (!cancelled) {
          setSettingsMessage(
            'برای نمایش نام لنزها، ابتدا یک‌بار دوربین را باز کنید.',
          )
        }
      }
    }

    void loadDevices()

    return () => {
      cancelled = true
    }
  }, [])

  const autoSelectedLabel =
    readLocalStorageValue(
      cameraAutoLabelStorageKey,
    )

  function updateModelSettings(
    next: FinalAccurateRuntimeSettings,
  ) {
    const saved =
      saveFinalAccurateRuntimeSettings(
        next,
      )

    setModelSettings(saved)
    setSettingsMessage(
      'تنظیمات مدل ذخیره شد و از شمارش دقیق بعدی اعمال می‌شود.',
    )
  }

  function updateCameraChoice(
    nextChoice: string,
  ) {
    setCameraChoice(nextChoice)

    if (nextChoice === 'auto') {
      saveCameraSelectionMode('auto')
      writeLocalStorageValue(
        cameraManualDeviceStorageKey,
        '',
      )
      writeLocalStorageValue(
        cameraAutoDeviceStorageKey,
        '',
      )
      writeLocalStorageValue(
        cameraAutoLabelStorageKey,
        '',
      )

      setSettingsMessage(
        'در ورود بعدی به دوربین، بهترین لنز پشت دوباره به‌صورت خودکار شناسایی می‌شود.',
      )

      return
    }

    saveCameraSelectionMode('manual')
    writeLocalStorageValue(
      cameraManualDeviceStorageKey,
      nextChoice,
    )

    setSettingsMessage(
      'لنز دستی ذخیره شد و در ورود بعدی به دوربین استفاده می‌شود.',
    )
  }

  function redetectAutomaticCamera() {
    saveCameraSelectionMode('auto')
    setCameraChoice('auto')
    writeLocalStorageValue(
      cameraManualDeviceStorageKey,
      '',
    )
    writeLocalStorageValue(
      cameraAutoDeviceStorageKey,
      '',
    )
    writeLocalStorageValue(
      cameraAutoLabelStorageKey,
      '',
    )

    setSettingsMessage(
      'انتخاب قبلی پاک شد. در ورود بعدی به دوربین، لنز اصلی دوباره بررسی می‌شود.',
    )
  }

  function resetDetectionSettings() {
    const defaults =
      resetFinalAccurateRuntimeSettings()

    setModelSettings(defaults)
    setSettingsMessage(
      'تنظیمات تشخیص به مقدارهای پیشنهادی بازگشت.',
    )
  }

  async function applyRuntimePreference(
    next:
      DeviceStrategyPreference,
  ) {
    if (runtimePreferenceBusy) {
      return
    }

    setRuntimePreferenceBusy(true)

    const saved =
      writeDeviceStrategyPreference(
        next,
      )

    setRuntimePreference(saved)
    setSettingsMessage(
      'استراتژی اجرا ذخیره شد؛ در حال آماده‌سازی دوباره موتور شمارش...',
    )

    try {
      await releaseFinalRuntime(
        'user-runtime-preference-change',
      )

      clearFinalRuntimePlanHistory()
      clearDeviceStrategy()

      const strategy =
        await ensureDeviceStrategyOnce()

      setEffectiveDeviceStrategy(
        readDeviceStrategy() ??
          strategy,
      )

      setSettingsMessage(
        saved.provider === 'webgpu'
          ? 'حالت GPU ذخیره شد. در صورت ناسازگاری، برنامه به‌صورت خودکار از CPU استفاده می‌کند.'
          : saved.provider === 'wasm'
            ? 'حالت CPU ذخیره شد و از شمارش دقیق بعدی اعمال می‌شود.'
            : 'انتخاب خودکار ذخیره شد و بهترین موتور پایدار این دستگاه دوباره انتخاب شد.',
      )
    } catch {
      setEffectiveDeviceStrategy(
        readDeviceStrategy(),
      )

      setSettingsMessage(
        'تنظیمات ذخیره شد. موتور جدید هنگام شمارش دقیق بعدی آماده می‌شود.',
      )
    } finally {
      setRuntimePreferenceBusy(false)
    }
  }

  async function resetRuntimePreference() {
    const defaults =
      resetDeviceStrategyPreference()

    await applyRuntimePreference(
      defaults,
    )
  }

  return (
    <main
      className="settings-shell"
      dir="rtl"
    >
      <section className="settings-content">
        <header className="settings-header">
          <button
            className="settings-back-button"
            type="button"
            onClick={onBack}
          >
            بازگشت
          </button>

          <div>
            <strong>تنظیمات</strong>
            <span>دوربین و شمارش دقیق</span>
          </div>
        </header>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span aria-hidden="true">◉</span>
            <div>
              <strong>انتخاب لنز دوربین</strong>
              <small>حالت خودکار پیشنهاد می‌شود</small>
            </div>
          </div>

          <label
            className="settings-field-label"
            htmlFor="beshmarai-settings-camera"
          >
            لنز مورد استفاده
          </label>

          <select
            id="beshmarai-settings-camera"
            className="settings-select"
            value={cameraChoice}
            onChange={(event) =>
              updateCameraChoice(
                event.currentTarget.value,
              )
            }
          >
            <option value="auto">
              انتخاب خودکار لنز اصلی پشت
            </option>

            {
              cameraChoice !== 'auto' &&
              !cameraDevices.some(
                (device) =>
                  device.deviceId ===
                  cameraChoice,
              ) && (
                <option value={cameraChoice}>
                  لنز ذخیره‌شده
                </option>
              )
            }

            {cameraDevices.map(
              (device, index) => (
                <option
                  key={device.deviceId}
                  value={device.deviceId}
                >
                  {formatCameraDeviceOption(
                    device,
                    index,
                  )}
                </option>
              ),
            )}
          </select>

          <p className="settings-help-text">
            برنامه در حالت خودکار از جهت دوربین، نام لنز، قابلیت فلش و مشخصات Track برای انتخاب دوربین اصلی استفاده می‌کند.
          </p>

          {autoSelectedLabel && (
            <p className="settings-detected-camera">
              انتخاب خودکار فعلی: 
              <strong>{autoSelectedLabel}</strong>
            </p>
          )}

          {cameraDevices.length === 0 && (
            <p className="settings-warning-text">
              نام لنزها هنوز در دسترس نیست. یک‌بار وارد صفحه دوربین شوید و مجوز دوربین را صادر کنید.
            </p>
          )}

          <button
            className="settings-secondary-button"
            type="button"
            onClick={redetectAutomaticCamera}
          >
            تشخیص دوباره لنز اصلی
          </button>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span aria-hidden="true">◈</span>
            <div>
              <strong>استراتژی اجرای هوش مصنوعی</strong>
              <small>انتخاب خودکار، GPU یا CPU</small>
            </div>
          </div>

          <label
            className="settings-field-label"
            htmlFor="beshmarai-runtime-provider"
          >
            موتور شمارش دقیق
          </label>

          <select
            id="beshmarai-runtime-provider"
            className="settings-select"
            value={runtimePreference.provider}
            disabled={runtimePreferenceBusy}
            onChange={(event) => {
              const provider =
                event.currentTarget.value as
                  DeviceStrategyPreference['provider']

              void applyRuntimePreference({
                ...runtimePreference,
                provider,
              })
            }}
          >
            <option value="auto">
              انتخاب خودکار پیشنهادی
            </option>
            <option value="webgpu">
              GPU — WebGPU با بازگشت امن به CPU
            </option>
            <option value="wasm">
              CPU — WebAssembly
            </option>
          </select>

          <label
            className="settings-field-label"
            htmlFor="beshmarai-runtime-threads"
          >
            تعداد رشته‌های CPU
          </label>

          <select
            id="beshmarai-runtime-threads"
            className="settings-select"
            value={runtimePreference.wasmThreads}
            disabled={
              runtimePreferenceBusy ||
              runtimePreference.provider ===
                'webgpu'
            }
            onChange={(event) => {
              const rawValue =
                event.currentTarget.value

              const wasmThreads:
                DeviceStrategyPreference['wasmThreads'] =
                rawValue === '1' ||
                rawValue === '2' ||
                rawValue === '4'
                  ? Number(rawValue) as
                      1 | 2 | 4
                  : 'auto'

              void applyRuntimePreference({
                ...runtimePreference,
                wasmThreads,
              })
            }}
          >
            <option value="auto">
              انتخاب خودکار
            </option>
            <option value="1">
              ۱ رشته — پایدارترین
            </option>
            <option value="2">
              ۲ رشته — متعادل
            </option>
            <option value="4">
              ۴ رشته — سریع برای دستگاه قوی
            </option>
          </select>

          <p className="settings-help-text">
            حالت خودکار توان دستگاه را یک‌بار می‌سنجد و نتیجه را ذخیره می‌کند. حالت GPU سریع‌تر است، اما در صورت ناسازگاری به مسیر امن CPU برمی‌گردد.
          </p>

          <p className="settings-detected-camera">
            موتور مؤثر فعلی:
            {' '}
            <strong>
              {effectiveDeviceStrategy
                ? effectiveDeviceStrategy.provider ===
                    'webgpu'
                  ? 'WebGPU'
                  : `CPU / WASM — ${effectiveDeviceStrategy.wasmThreads.toLocaleString('fa-IR')} رشته`
                : 'هنوز سنجیده نشده'}
            </strong>
          </p>

          <button
            className="settings-secondary-button"
            type="button"
            disabled={runtimePreferenceBusy}
            onClick={() => {
              void resetRuntimePreference()
            }}
          >
            سنجش دوباره و انتخاب خودکار
          </button>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span aria-hidden="true">◎</span>
            <div>
              <strong>تنظیمات شمارش دقیق</strong>
              <small>برای کاربران حرفه‌ای</small>
            </div>
          </div>

          <div className="settings-range-field">
            <div className="settings-range-title">
              <label htmlFor="beshmarai-confidence">
                حد اطمینان تشخیص
              </label>
              <output>
                {(
                  modelSettings
                    .confidenceThreshold *
                  100
                ).toLocaleString(
                  'fa-IR',
                  {
                    maximumFractionDigits: 0,
                  },
                )}
                ٪
              </output>
            </div>

            <input
              id="beshmarai-confidence"
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={
                modelSettings
                  .confidenceThreshold
              }
              onChange={(event) =>
                updateModelSettings({
                  ...modelSettings,
                  confidenceThreshold:
                    Number(
                      event.currentTarget
                        .value,
                    ),
                })
              }
            />

            <small>
              مقدار بالاتر تشخیص‌های ضعیف را حذف می‌کند؛ مقدار خیلی بالا ممکن است بعضی قرص‌ها را از دست بدهد.
            </small>
          </div>

          <div className="settings-range-field">
            <div className="settings-range-title">
              <label htmlFor="beshmarai-iou">
                حذف کادرهای هم‌پوشان
              </label>
              <output>
                {modelSettings.iouThreshold
                  .toLocaleString(
                    'fa-IR',
                    {
                      maximumFractionDigits: 2,
                    },
                  )}
              </output>
            </div>

            <input
              id="beshmarai-iou"
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={
                modelSettings.iouThreshold
              }
              onChange={(event) =>
                updateModelSettings({
                  ...modelSettings,
                  iouThreshold:
                    Number(
                      event.currentTarget
                        .value,
                    ),
                })
              }
            />

            <small>
              مقدار پیشنهادی {FINAL_ACCURATE_DEFAULT_SETTINGS.iouThreshold.toLocaleString('fa-IR')} است. تغییر نادرست می‌تواند شمارش تکراری یا حذف قرص‌های نزدیک را بیشتر کند.
            </small>
          </div>

          <button
            className="settings-reset-button"
            type="button"
            onClick={resetDetectionSettings}
          >
            بازگردانی تنظیمات پیشنهادی مدل
          </button>
        </section>

        <p
          className="settings-message"
          role="status"
        >
          {settingsMessage}
        </p>
      </section>
    </main>
  )
}

function CameraScreen({
  onBack,
  onOpenSettings,
}: CameraScreenProps) {
  // BESHMARAI_PUBLIC_FREE_CAMERA_ACCESS_V1


  // WEB_ROI_TOUCH_MOVE_RESIZE_FINAL

  const videoRef =
    useRef<HTMLVideoElement | null>(null)

  const canvasRef =
    useRef<HTMLCanvasElement | null>(null)

  const stageRef =
    useRef<HTMLElement | null>(null)

  const streamRef =
    useRef<MediaStream | null>(null)

  // BESHMARAI_ANDROID_COUNTING_UI_V1_STATE_BEGIN

  const [
    countingTorchEnabled,
    setCountingTorchEnabled,
  ] = useState(false)

  const [
    countingTorchAvailable,
    setCountingTorchAvailable,
  ] = useState(false)

  const [
    countingZoomLevel,
    setCountingZoomLevel,
  ] = useState<1 | 2 | 3>(1)

  const [
    countingZoomAvailable,
    setCountingZoomAvailable,
  ] = useState(false)

  const previewAutoStartedRef =
    useRef(false)

  // BESHMARAI_ANDROID_COUNTING_UI_V1_STATE_END

  const roiRef =
    useRef<RoiRect | null>(null)

  const stageSizeRef =
    useRef<StageSize>({
      width: 0,
      height: 0,
    })

  const interactionRef =
    useRef<RoiInteraction | null>(null)

  const capturedObjectUrlRef =
    useRef<string | null>(null)

  const accuratePreviewWasLiveRef =
    useRef(false)

  const accurateRunTokenRef =
    useRef(0)

  const accurateCountBusyRef =
    useRef(false)

  const accurateResultViewerRef =
    useRef<HTMLDivElement | null>(null)

  const accurateResultPointersRef =
    useRef<Map<number, AccurateResultPoint>>(
      new Map(),
    )

  const accurateResultGestureRef =
    useRef<AccurateResultGestureState>({
      mode: 'idle',
      lastX: 0,
      lastY: 0,
      lastDistance: 0,
      moved: false,
    })

  const accurateResultLastTapRef =
    useRef({
      time: 0,
      x: 0,
      y: 0,
    })

  // WEB_PREVIEW_DETECTION_OVERLAY_FINAL

  const detectionCanvasRef =
    useRef<HTMLCanvasElement | null>(null)

  const previewDetectionsRef =
    useRef<PreviewDetection[]>([])

  const previewSpatialNumberTracksRef =
    useRef<PreviewSpatialNumberTrack[]>([])

  const previewSpatialNextNumberRef =
    useRef(1)

  const resetPreviewSpatialNumbers =
    useCallback(() => {
      previewSpatialNumberTracksRef.current = []

      previewSpatialNextNumberRef.current = 1
    }, [])


  const [cameraState, setCameraState] =
    useState<CameraState>('opening')

  const [cameraMessage, setCameraMessage] =
    useState('در حال آماده‌سازی دوربین...')

  const [
    cameraOpeningProgress,
    setCameraOpeningProgress,
  ] = useState(8)

  const [
    cameraOpeningDetail,
    setCameraOpeningDetail,
  ] = useState(
    'در حال بررسی مجوز دوربین و انتخاب بهترین لنز...',
  )

  // BESHMARAI_IOS_CAMERA_LIFECYCLE_V1

  const [
    cameraRestartKey,
    setCameraRestartKey,
  ] = useState(0)

  const cameraRestartTimerRef =
    useRef<number | null>(null)

  const cameraLifecycleSuspendedRef =
    useRef(false)

  // BESHMARAI_CAMERA_DEVICE_DROPDOWN_V7_STATE_BEGIN

  const cameraOpenGenerationRef =
    useRef(0)

  const cameraRequestedDeviceIdRef =
    useRef('')

  const cameraTrackMuteTimerRef =
    useRef<number | null>(null)

  const cameraLifecycleSuspendTimerRef =
    useRef<number | null>(null)

  const [, setCameraSwitchBusy] =
    useState(false)

  // BESHMARAI_CAMERA_DEVICE_DROPDOWN_V7_STATE_END

  // BESHMARAI_IOS_PRODUCTION_RAW_WASM_INTEGRATION_V2
  // WEB_PREVIEW_MODEL_SESSION_LOAD_FINAL

  const [
    previewModelState,
    setPreviewModelState,
  ] = useState<PreviewModelState>('loading')

  const [
    previewModelMessage,
    setPreviewModelMessage,
  ] = useState(
    'در حال بارگذاری مدل مخصوص iOS...',
  )

  // WEB_PREVIEW_SINGLE_FRAME_UI_FINAL

  const [
    previewFrameTestState,
    setPreviewFrameTestState,
  ] = useState<PreviewFrameTestState>(
    'idle',
  )

  const [
    previewFrameTestMessage,
    setPreviewFrameTestMessage,
  ] = useState(
    'شمارش لحظه‌ای متوقف است.',
  )

  // WEB_PREVIEW_LIVE_LOOP_FINAL

  const [
    previewLiveEnabled,
    setPreviewLiveEnabled,
  ] = useState(false)

  const [
    previewDetectionCount,
    setPreviewDetectionCount,
  ] = useState(0)

  const [roiHelpText, setRoiHelpText] =
    useState(
      'داخل کادر را بکشید؛ گوشه‌ها اندازه کادر را تغییر می‌دهند.',
    )

  // WEB_ROI_CAPTURE_PREVIEW_FINAL

  const [capturedPreview, setCapturedPreview] =
    useState<CapturedRoiPreview | null>(null)

  const [captureMessage, setCaptureMessage] =
    useState(
      'پس از تنظیم کادر، دکمه شمارش دقیق را بزنید.',
    )

  const [
    accurateCountBusy,
    setAccurateCountBusy,
  ] = useState(false)

  const [
    accurateCountError,
    setAccurateCountError,
  ] = useState<string | null>(null)

  // BESHMARAI_ACCURATE_FREEZE_SCAN_V1
  // BESHMARAI_ACCURATE_RESULT_ZOOM_ANDROID_PARITY_V1

  const [
    accurateResultZoom,
    setAccurateResultZoom,
  ] = useState<AccurateResultZoomState>({
    scale: 1,
    x: 0,
    y: 0,
  })

  const [
    accurateResultViewerSize,
    setAccurateResultViewerSize,
  ] = useState<StageSize>({
    width: 0,
    height: 0,
  })

  const clampAccurateResultZoom =
    useCallback(
      (
        candidate:
          AccurateResultZoomState,
      ): AccurateResultZoomState => {
        const viewer =
          accurateResultViewerRef.current

        const nextScale =
          clampNumber(
            candidate.scale,
            1,
            5,
          )

        if (
          nextScale <=
          1.0001
        ) {
          return {
            scale: 1,
            x: 0,
            y: 0,
          }
        }

        const viewerWidth =
          Math.max(
            1,
            viewer?.clientWidth ?? 1,
          )

        const viewerHeight =
          Math.max(
            1,
            viewer?.clientHeight ?? 1,
          )

        const maximumX =
          viewerWidth *
          (nextScale - 1)

        const maximumY =
          viewerHeight *
          (nextScale - 1)

        return {
          scale: nextScale,
          x: clampNumber(
            candidate.x,
            -maximumX,
            0,
          ),
          y: clampNumber(
            candidate.y,
            -maximumY,
            0,
          ),
        }
      },
      [],
    )

  const resetAccurateResultZoom =
    useCallback(() => {
      accurateResultPointersRef.current
        .clear()

      accurateResultGestureRef.current = {
        mode: 'idle',
        lastX: 0,
        lastY: 0,
        lastDistance: 0,
        moved: false,
      }

      accurateResultLastTapRef.current = {
        time: 0,
        x: 0,
        y: 0,
      }

      setAccurateResultZoom({
        scale: 1,
        x: 0,
        y: 0,
      })
    }, [])

  const setAccurateResultZoomAtPoint =
    useCallback(
      (
        requestedScale: number,
        focusX: number,
        focusY: number,
      ) => {
        setAccurateResultZoom(
          (currentZoom) => {
            const nextScale =
              clampNumber(
                requestedScale,
                1,
                5,
              )

            if (
              nextScale <=
              1.0001
            ) {
              return {
                scale: 1,
                x: 0,
                y: 0,
              }
            }

            const scaleFactor =
              nextScale /
              currentZoom.scale

            return clampAccurateResultZoom({
              scale: nextScale,
              x:
                focusX -
                (
                  focusX -
                  currentZoom.x
                ) *
                  scaleFactor,
              y:
                focusY -
                (
                  focusY -
                  currentZoom.y
                ) *
                  scaleFactor,
            })
          },
        )
      },
      [clampAccurateResultZoom],
    )

  const changeAccurateResultZoom =
    useCallback(
      (factor: number) => {
        const viewer =
          accurateResultViewerRef.current

        if (!viewer) {
          return
        }

        setAccurateResultZoomAtPoint(
          accurateResultZoom.scale *
            factor,
          viewer.clientWidth / 2,
          viewer.clientHeight / 2,
        )
      },
      [
        accurateResultZoom.scale,
        setAccurateResultZoomAtPoint,
      ],
    )

  const getAccurateResultPointerPoint =
    useCallback(
      (
        event:
          React.PointerEvent<HTMLDivElement>,
      ): AccurateResultPoint => {
        const bounds =
          event.currentTarget
            .getBoundingClientRect()

        return {
          x:
            event.clientX -
            bounds.left,
          y:
            event.clientY -
            bounds.top,
        }
      },
      [],
    )

  const handleAccurateResultPointerDown =
    useCallback(
      (
        event:
          React.PointerEvent<HTMLDivElement>,
      ) => {
        if (accurateCountBusy) {
          return
        }

        event.preventDefault()

        event.currentTarget
          .setPointerCapture(
            event.pointerId,
          )

        const point =
          getAccurateResultPointerPoint(
            event,
          )

        const pointers =
          accurateResultPointersRef.current

        pointers.set(
          event.pointerId,
          point,
        )

        const points =
          Array.from(
            pointers.values(),
          )

        const gesture =
          accurateResultGestureRef.current

        gesture.moved = false

        if (points.length >= 2) {
          const first = points[0]
          const second = points[1]

          const center =
            accurateResultPointCenter(
              first,
              second,
            )

          gesture.mode = 'pinch'
          gesture.lastX = center.x
          gesture.lastY = center.y
          gesture.lastDistance =
            accurateResultPointDistance(
              first,
              second,
            )

          return
        }

        gesture.mode = 'pan'
        gesture.lastX = point.x
        gesture.lastY = point.y
        gesture.lastDistance = 0
      },
      [
        accurateCountBusy,
        getAccurateResultPointerPoint,
      ],
    )

  const handleAccurateResultPointerMove =
    useCallback(
      (
        event:
          React.PointerEvent<HTMLDivElement>,
      ) => {
        const pointers =
          accurateResultPointersRef.current

        const previousPoint =
          pointers.get(
            event.pointerId,
          )

        if (!previousPoint) {
          return
        }

        event.preventDefault()

        const point =
          getAccurateResultPointerPoint(
            event,
          )

        const gesture =
          accurateResultGestureRef.current

        if (
          Math.hypot(
            point.x -
              previousPoint.x,
            point.y -
              previousPoint.y,
          ) > 1.5
        ) {
          gesture.moved = true
        }

        pointers.set(
          event.pointerId,
          point,
        )

        const points =
          Array.from(
            pointers.values(),
          )

        if (points.length >= 2) {
          const first = points[0]
          const second = points[1]

          const newDistance =
            accurateResultPointDistance(
              first,
              second,
            )

          const center =
            accurateResultPointCenter(
              first,
              second,
            )

          const previousDistance =
            gesture.lastDistance > 0
              ? gesture.lastDistance
              : newDistance

          const previousCenterX =
            gesture.lastX

          const previousCenterY =
            gesture.lastY

          const distanceFactor =
            previousDistance > 0
              ? newDistance /
                previousDistance
              : 1

          setAccurateResultZoom(
            (currentZoom) => {
              const nextScale =
                clampNumber(
                  currentZoom.scale *
                    distanceFactor,
                  1,
                  5,
                )

              const scaleFactor =
                nextScale /
                currentZoom.scale

              return clampAccurateResultZoom({
                scale: nextScale,
                x:
                  center.x -
                  (
                    center.x -
                    currentZoom.x
                  ) *
                    scaleFactor +
                  (
                    center.x -
                    previousCenterX
                  ),
                y:
                  center.y -
                  (
                    center.y -
                    currentZoom.y
                  ) *
                    scaleFactor +
                  (
                    center.y -
                    previousCenterY
                  ),
              })
            },
          )

          gesture.mode = 'pinch'
          gesture.lastX = center.x
          gesture.lastY = center.y
          gesture.lastDistance =
            newDistance

          return
        }

        const deltaX =
          point.x -
          gesture.lastX

        const deltaY =
          point.y -
          gesture.lastY

        setAccurateResultZoom(
          (currentZoom) => {
            if (
              currentZoom.scale <= 1
            ) {
              return currentZoom
            }

            return clampAccurateResultZoom({
              ...currentZoom,
              x:
                currentZoom.x +
                deltaX,
              y:
                currentZoom.y +
                deltaY,
            })
          },
        )

        gesture.mode = 'pan'
        gesture.lastX = point.x
        gesture.lastY = point.y
        gesture.lastDistance = 0
      },
      [
        clampAccurateResultZoom,
        getAccurateResultPointerPoint,
      ],
    )

  const finishAccurateResultPointer =
    useCallback(
      (
        event:
          React.PointerEvent<HTMLDivElement>,
        allowDoubleTap: boolean,
      ) => {
        const pointers =
          accurateResultPointersRef.current

        const gesture =
          accurateResultGestureRef.current

        const wasSinglePointer =
          pointers.size === 1

        const point =
          getAccurateResultPointerPoint(
            event,
          )

        pointers.delete(
          event.pointerId,
        )

        if (
          event.currentTarget
            .hasPointerCapture(
              event.pointerId,
            )
        ) {
          event.currentTarget
            .releasePointerCapture(
              event.pointerId,
            )
        }

        if (
          allowDoubleTap &&
          wasSinglePointer &&
          !gesture.moved &&
          !accurateCountBusy
        ) {
          const currentTime =
            performance.now()

          const previousTap =
            accurateResultLastTapRef.current

          const tapDistance =
            Math.hypot(
              point.x -
                previousTap.x,
              point.y -
                previousTap.y,
            )

          if (
            currentTime -
              previousTap.time <
              320 &&
            tapDistance < 36
          ) {
            const targetScale =
              accurateResultZoom.scale >
              1.01
                ? 1
                : 2.5

            setAccurateResultZoomAtPoint(
              targetScale,
              point.x,
              point.y,
            )

            accurateResultLastTapRef.current =
              {
                time: 0,
                x: 0,
                y: 0,
              }
          } else {
            accurateResultLastTapRef.current =
              {
                time: currentTime,
                x: point.x,
                y: point.y,
              }
          }
        }

        const remainingPoints =
          Array.from(
            pointers.values(),
          )

        if (
          remainingPoints.length === 1
        ) {
          gesture.mode = 'pan'
          gesture.lastX =
            remainingPoints[0].x
          gesture.lastY =
            remainingPoints[0].y
          gesture.lastDistance = 0
          gesture.moved = true
        } else {
          gesture.mode = 'idle'
          gesture.lastDistance = 0
          gesture.moved = false
        }

        event.currentTarget.parentElement
          ?.requestFullscreen
      },
      [
        accurateCountBusy,
        accurateResultZoom.scale,
        getAccurateResultPointerPoint,
        setAccurateResultZoomAtPoint,
      ],
    )

  const handleAccurateResultPointerUp =
    useCallback(
      (
        event:
          React.PointerEvent<HTMLDivElement>,
      ) => {
        finishAccurateResultPointer(
          event,
          true,
        )
      },
      [finishAccurateResultPointer],
    )

  const handleAccurateResultPointerCancel =
    useCallback(
      (
        event:
          React.PointerEvent<HTMLDivElement>,
      ) => {
        finishAccurateResultPointer(
          event,
          false,
        )
      },
      [finishAccurateResultPointer],
    )

  const handleAccurateResultWheel =
    useCallback(
      (
        event:
          React.WheelEvent<HTMLDivElement>,
      ) => {
        if (accurateCountBusy) {
          return
        }

        event.preventDefault()

        const bounds =
          event.currentTarget
            .getBoundingClientRect()

        const focusX =
          event.clientX -
          bounds.left

        const focusY =
          event.clientY -
          bounds.top

        const factor =
          event.deltaY < 0
            ? 1.18
            : 1 / 1.18

        setAccurateResultZoomAtPoint(
          accurateResultZoom.scale *
            factor,
          focusX,
          focusY,
        )
      },
      [
        accurateCountBusy,
        accurateResultZoom.scale,
        setAccurateResultZoomAtPoint,
      ],
    )

  useEffect(() => {
    resetAccurateResultZoom()
  }, [
    capturedPreview?.url,
    resetAccurateResultZoom,
  ])

  useEffect(() => {
    const viewer =
      accurateResultViewerRef.current

    if (
      !capturedPreview ||
      !viewer
    ) {
      setAccurateResultViewerSize({
        width: 0,
        height: 0,
      })

      return
    }

    const updateSize = () => {
      setAccurateResultViewerSize({
        width:
          viewer.clientWidth,
        height:
          viewer.clientHeight,
      })

      setAccurateResultZoom(
        (currentZoom) =>
          clampAccurateResultZoom(
            currentZoom,
          ),
      )
    }

    updateSize()

    if (
      typeof ResizeObserver ===
      'undefined'
    ) {
      window.addEventListener(
        'resize',
        updateSize,
      )

      return () => {
        window.removeEventListener(
          'resize',
          updateSize,
        )
      }
    }

    const observer =
      new ResizeObserver(
        updateSize,
      )

    observer.observe(viewer)

    return () => {
      observer.disconnect()
    }
  }, [
    capturedPreview,
    clampAccurateResultZoom,
  ])

  const clearCapturedPreview =
    useCallback(() => {
      if (capturedObjectUrlRef.current) {
        URL.revokeObjectURL(
          capturedObjectUrlRef.current,
        )

        capturedObjectUrlRef.current = null
      }

      resetAccurateResultZoom()
      setAccurateCountError(null)
      setCapturedPreview(null)
    }, [resetAccurateResultZoom])

  const closeCapturedPreview =
    useCallback(() => {
      clearCapturedPreview()

      if (
        accuratePreviewWasLiveRef.current &&
        cameraState === 'ready' &&
        previewModelState === 'ready'
      ) {
        setPreviewFrameTestState(
          'running',
        )

        setPreviewFrameTestMessage(
          'در حال بازگشت به شمارش لحظه‌ای...',
        )

        setPreviewLiveEnabled(true)
      }

      accuratePreviewWasLiveRef.current =
        false
    }, [
      cameraState,
      clearCapturedPreview,
      previewModelState,
    ])

  const stopCamera = useCallback(() => {
    cameraOpenGenerationRef.current += 1

    if (
      cameraTrackMuteTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        cameraTrackMuteTimerRef.current,
      )

      cameraTrackMuteTimerRef.current =
        null
    }

    streamRef.current
      ?.getTracks()
      .forEach((track) => track.stop())

    streamRef.current = null

    previewAutoStartedRef.current = false

    setCountingTorchEnabled(false)
    setCountingTorchAvailable(false)
    setCountingZoomLevel(1)
    setCountingZoomAvailable(false)

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    previewDetectionsRef.current = []
    resetPreviewModelStability()
    resetPreviewSpatialNumbers()
  }, [])

  const requestCameraRestart =
    useCallback(() => {
      if (
        cameraRestartTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          cameraRestartTimerRef.current,
        )

        cameraRestartTimerRef.current =
          null
      }

      stopCamera()
      setCameraSwitchBusy(true)
      setCameraState('opening')

      setCameraMessage(
        'در حال بازیابی دوربین...',
      )

      cameraRestartTimerRef.current =
        window.setTimeout(() => {
          cameraRestartTimerRef.current =
            null

          setCameraRestartKey(
            (currentKey) =>
              currentKey + 1,
          )

          console.info(
            'UNIVERSAL_CAMERA_RESTART_REQUESTED',
          )
        }, 220)
    }, [stopCamera])

  const drawOverlay = useCallback(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current

    if (!stage || !canvas) {
      return
    }

    const bounds =
      stage.getBoundingClientRect()

    const width = Math.max(
      1,
      Math.round(bounds.width),
    )

    const height = Math.max(
      1,
      Math.round(bounds.height),
    )

    const pixelRatio = Math.max(
      1,
      window.devicePixelRatio || 1,
    )

    const oldStageSize =
      stageSizeRef.current

    let roi = roiRef.current

    if (!roi) {
      roi = createInitialRoi(
        width,
        height,
      )
    }

    if (
      oldStageSize.width > 0 &&
      oldStageSize.height > 0 &&
      (
        oldStageSize.width !== width ||
        oldStageSize.height !== height
      )
    ) {
      roi = {
        x:
          roi.x *
          (width / oldStageSize.width),

        y:
          roi.y *
          (height / oldStageSize.height),

        width:
          roi.width *
          (width / oldStageSize.width),

        height:
          roi.height *
          (height / oldStageSize.height),
      }
    }

    roi = fitRoiToStage(
      roi,
      width,
      height,
    )

    roiRef.current = roi

    stageSizeRef.current = {
      width,
      height,
    }

    canvas.width = Math.round(
      width * pixelRatio,
    )

    canvas.height = Math.round(
      height * pixelRatio,
    )

    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const context =
      canvas.getContext('2d')

    if (!context) {
      return
    }

    context.setTransform(
      pixelRatio,
      0,
      0,
      pixelRatio,
      0,
      0,
    )

    context.clearRect(
      0,
      0,
      width,
      height,
    )

    const cornerLength = Math.min(
      34,
      roi.width * 0.12,
      roi.height * 0.12,
    )

    context.fillStyle =
      'rgba(0, 0, 0, 0.28)'

    context.fillRect(
      0,
      0,
      width,
      height,
    )

    context.clearRect(
      roi.x,
      roi.y,
      roi.width,
      roi.height,
    )

    context.strokeStyle =
      'rgba(0, 229, 255, 0.40)'

    context.lineWidth = 1
    context.setLineDash([8, 8])

    context.strokeRect(
      roi.x,
      roi.y,
      roi.width,
      roi.height,
    )

    context.setLineDash([])

    context.strokeStyle = '#ffffff'
    context.lineWidth = 4
    context.lineCap = 'round'
    context.lineJoin = 'round'

    function drawCorner(
      points: Array<[number, number]>,
    ) {
      context?.beginPath()
      context?.moveTo(
        points[0][0],
        points[0][1],
      )

      context?.lineTo(
        points[1][0],
        points[1][1],
      )

      context?.lineTo(
        points[2][0],
        points[2][1],
      )

      context?.stroke()
    }

    drawCorner([
      [
        roi.x + cornerLength,
        roi.y,
      ],
      [roi.x, roi.y],
      [
        roi.x,
        roi.y + cornerLength,
      ],
    ])

    drawCorner([
      [
        roi.x +
          roi.width -
          cornerLength,
        roi.y,
      ],
      [
        roi.x + roi.width,
        roi.y,
      ],
      [
        roi.x + roi.width,
        roi.y + cornerLength,
      ],
    ])

    drawCorner([
      [
        roi.x,
        roi.y +
          roi.height -
          cornerLength,
      ],
      [
        roi.x,
        roi.y + roi.height,
      ],
      [
        roi.x + cornerLength,
        roi.y + roi.height,
      ],
    ])

    drawCorner([
      [
        roi.x +
          roi.width -
          cornerLength,
        roi.y + roi.height,
      ],
      [
        roi.x + roi.width,
        roi.y + roi.height,
      ],
      [
        roi.x + roi.width,
        roi.y +
          roi.height -
          cornerLength,
      ],
    ])
  }, [])

  const getPointerPosition = useCallback(
    (
      event:
        React.PointerEvent<HTMLCanvasElement>,
    ) => {
      const stage = stageRef.current

      if (!stage) {
        return null
      }

      const bounds =
        stage.getBoundingClientRect()

      return {
        x: clampNumber(
          event.clientX - bounds.left,
          0,
          bounds.width,
        ),

        y: clampNumber(
          event.clientY - bounds.top,
          0,
          bounds.height,
        ),

        width: bounds.width,
        height: bounds.height,
      }
    },
    [],
  )

  const findInteractionMode = useCallback(
    (
      pointX: number,
      pointY: number,
      roi: RoiRect,
    ): RoiInteractionMode | null => {
      const hitRadius = Math.max(
        46,
        Math.min(
          64,
          Math.min(
            roi.width,
            roi.height,
          ) * 0.17,
        ),
      )

      const corners: Array<{
        mode: RoiInteractionMode
        x: number
        y: number
      }> = [
        {
          mode: 'nw',
          x: roi.x,
          y: roi.y,
        },
        {
          mode: 'ne',
          x: roi.x + roi.width,
          y: roi.y,
        },
        {
          mode: 'sw',
          x: roi.x,
          y: roi.y + roi.height,
        },
        {
          mode: 'se',
          x: roi.x + roi.width,
          y: roi.y + roi.height,
        },
      ]

      let nearest:
        | {
            mode: RoiInteractionMode
            distance: number
          }
        | null = null

      for (const corner of corners) {
        const distance = Math.hypot(
          pointX - corner.x,
          pointY - corner.y,
        )

        if (distance > hitRadius) {
          continue
        }

        if (
          !nearest ||
          distance < nearest.distance
        ) {
          nearest = {
            mode: corner.mode,
            distance,
          }
        }
      }

      if (nearest) {
        return nearest.mode
      }

      const inside =
        pointX >= roi.x &&
        pointX <= roi.x + roi.width &&
        pointY >= roi.y &&
        pointY <= roi.y + roi.height

      if (inside) {
        return 'move'
      }

      return null
    },
    [],
  )

  const handleRoiPointerDown = useCallback(
    (
      event:
        React.PointerEvent<HTMLCanvasElement>,
    ) => {
      if (cameraState !== 'ready') {
        return
      }

      const roi = roiRef.current
      const point = getPointerPosition(event)

      if (!roi || !point) {
        return
      }

      const mode = findInteractionMode(
        point.x,
        point.y,
        roi,
      )

      if (!mode) {
        return
      }

      event.preventDefault()

      try {
        event.currentTarget.setPointerCapture(
          event.pointerId,
        )
      } catch {
        // Pointer capture may be unavailable
        // on a small group of browsers.
      }

      interactionRef.current = {
        pointerId: event.pointerId,
        mode,
        startX: point.x,
        startY: point.y,
        startRoi: { ...roi },
      }

      setRoiHelpText(
        mode === 'move'
          ? 'کادر را جابه‌جا کنید.'
          : 'گوشه را بکشید تا اندازه کادر تغییر کند.',
      )
    },
    [
      cameraState,
      findInteractionMode,
      getPointerPosition,
    ],
  )

  const handleRoiPointerMove = useCallback(
    (
      event:
        React.PointerEvent<HTMLCanvasElement>,
    ) => {
      const interaction =
        interactionRef.current

      if (
        !interaction ||
        interaction.pointerId !==
          event.pointerId
      ) {
        return
      }

      const point = getPointerPosition(event)

      if (!point) {
        return
      }

      event.preventDefault()

      const start =
        interaction.startRoi

      const deltaX =
        point.x - interaction.startX

      const deltaY =
        point.y - interaction.startY

      const margin = Math.min(
        18,
        point.width * 0.04,
        point.height * 0.04,
      )

      const minimumWidth = Math.min(
        120,
        point.width - margin * 2,
      )

      const minimumHeight = Math.min(
        140,
        point.height - margin * 2,
      )

      let next: RoiRect = {
        ...start,
      }

      if (interaction.mode === 'move') {
        next.x = clampNumber(
          start.x + deltaX,
          margin,
          point.width -
            margin -
            start.width,
        )

        next.y = clampNumber(
          start.y + deltaY,
          margin,
          point.height -
            margin -
            start.height,
        )
      }

      if (interaction.mode === 'nw') {
        const right =
          start.x + start.width

        const bottom =
          start.y + start.height

        next.x = clampNumber(
          start.x + deltaX,
          margin,
          right - minimumWidth,
        )

        next.y = clampNumber(
          start.y + deltaY,
          margin,
          bottom - minimumHeight,
        )

        next.width = right - next.x
        next.height = bottom - next.y
      }

      if (interaction.mode === 'ne') {
        const bottom =
          start.y + start.height

        const right = clampNumber(
          start.x +
            start.width +
            deltaX,
          start.x + minimumWidth,
          point.width - margin,
        )

        next.y = clampNumber(
          start.y + deltaY,
          margin,
          bottom - minimumHeight,
        )

        next.width = right - start.x
        next.height = bottom - next.y
      }

      if (interaction.mode === 'sw') {
        const right =
          start.x + start.width

        const bottom = clampNumber(
          start.y +
            start.height +
            deltaY,
          start.y + minimumHeight,
          point.height - margin,
        )

        next.x = clampNumber(
          start.x + deltaX,
          margin,
          right - minimumWidth,
        )

        next.width = right - next.x
        next.height = bottom - start.y
      }

      if (interaction.mode === 'se') {
        const right = clampNumber(
          start.x +
            start.width +
            deltaX,
          start.x + minimumWidth,
          point.width - margin,
        )

        const bottom = clampNumber(
          start.y +
            start.height +
            deltaY,
          start.y + minimumHeight,
          point.height - margin,
        )

        next.width = right - start.x
        next.height = bottom - start.y
      }

      roiRef.current = fitRoiToStage(
        next,
        point.width,
        point.height,
      )

      drawOverlay()
    },
    [
      drawOverlay,
      getPointerPosition,
    ],
  )

  const finishRoiInteraction =
    useCallback(
      (
        event:
          React.PointerEvent<HTMLCanvasElement>,
      ) => {
        const interaction =
          interactionRef.current

        if (
          !interaction ||
          interaction.pointerId !==
            event.pointerId
        ) {
          return
        }

        event.preventDefault()

        try {
          if (
            event.currentTarget
              .hasPointerCapture(
                event.pointerId,
              )
          ) {
            event.currentTarget
              .releasePointerCapture(
                event.pointerId,
              )
          }
        } catch {
          // Safe fallback.
        }

        interactionRef.current = null

        previewDetectionsRef.current = []
        setPreviewDetectionCount(0)
        resetPreviewModelStability()
        resetPreviewSpatialNumbers()
        const detectionCanvas =
          detectionCanvasRef.current
        const detectionContext =
          detectionCanvas?.getContext('2d')

        detectionContext?.clearRect(
          0,
          0,
          detectionCanvas?.width || 0,
          detectionCanvas?.height || 0,
        )

        setRoiHelpText(
          'داخل کادر را بکشید؛ گوشه‌ها اندازه کادر را تغییر می‌دهند.',
        )
      },
      [],
    )

  const drawPreviewDetectionOverlay =
    useCallback(
      (
        detections:
          PreviewDetection[],
      ): number => {
        const stage = stageRef.current
        const video = videoRef.current
        const canvas =
          detectionCanvasRef.current
        const roi = roiRef.current

        if (
          !stage ||
          !video ||
          !canvas ||
          video.videoWidth <= 0 ||
          video.videoHeight <= 0
        ) {
          return 0
        }

        const stageBounds =
          stage.getBoundingClientRect()

        const stageWidth =
          Math.max(
            1,
            stageBounds.width,
          )

        const stageHeight =
          Math.max(
            1,
            stageBounds.height,
          )

        const pixelRatio =
          Math.max(
            1,
            window.devicePixelRatio || 1,
          )

        canvas.width =
          Math.round(
            stageWidth * pixelRatio,
          )

        canvas.height =
          Math.round(
            stageHeight * pixelRatio,
          )

        canvas.style.width =
          `${stageWidth}px`

        canvas.style.height =
          `${stageHeight}px`

        const context =
          canvas.getContext('2d')

        if (!context) {
          return 0
        }

        context.setTransform(
          pixelRatio,
          0,
          0,
          pixelRatio,
          0,
          0,
        )

        context.clearRect(
          0,
          0,
          stageWidth,
          stageHeight,
        )

        if (detections.length === 0) {
          return 0
        }

        /*
         * video با object-fit: cover نمایش داده
         * می‌شود. این تبدیل مختصات اصلی فریم
         * را به مختصات واقعی صفحه تبدیل می‌کند.
         */
        const coverScale =
          Math.max(
            stageWidth /
              video.videoWidth,

            stageHeight /
              video.videoHeight,
          )

        const displayedWidth =
          video.videoWidth *
          coverScale

        const displayedHeight =
          video.videoHeight *
          coverScale

        const displayedOffsetX =
          (
            stageWidth -
            displayedWidth
          ) / 2

        const displayedOffsetY =
          (
            stageHeight -
            displayedHeight
          ) / 2

        const visibleDetections =
          detections
            .map((detection) => {
              const x1 =
                displayedOffsetX +
                detection.x1 *
                coverScale

              const y1 =
                displayedOffsetY +
                detection.y1 *
                coverScale

              const x2 =
                displayedOffsetX +
                detection.x2 *
                coverScale

              const y2 =
                displayedOffsetY +
                detection.y2 *
                coverScale

              const centerX =
                (x1 + x2) / 2

              const centerY =
                (y1 + y2) / 2

              return {
                x1,
                y1,
                x2,
                y2,
                centerX,
                centerY,
                score:
                  detection.score,
              }
            })
            .filter((detection) => {
              if (!roi) {
                return true
              }

              return (
                detection.centerX >=
                  roi.x &&
                detection.centerX <=
                  roi.x + roi.width &&
                detection.centerY >=
                  roi.y &&
                detection.centerY <=
                  roi.y + roi.height
              )
            })

        const spatialNumbering =
          assignPreviewSpatialNumbers(
            visibleDetections,
            previewSpatialNumberTracksRef.current,
            previewSpatialNextNumberRef.current,
            performance.now(),
          )

        previewSpatialNumberTracksRef.current =
          spatialNumbering.tracks

        previewSpatialNextNumberRef.current =
          spatialNumbering.nextNumber

        const numberedDetections =
          spatialNumbering.detections

        if (
          spatialNumbering.reinitialized
        ) {
          console.info(
            'IOS_SPATIAL_NUMBERING_REINITIALIZED',
            {
              visibleCount:
                numberedDetections.length,

              matchedCount:
                spatialNumbering.matchedCount,
            },
          )
        }

        context.save()

        context.lineWidth = 2.4
        context.strokeStyle =
          '#00e5ff'

        context.shadowColor =
          'rgba(0, 229, 255, 0.8)'

        context.shadowBlur = 8

        numberedDetections.forEach(
          (detection) => {
            const left =
              Math.max(
                0,
                detection.x1,
              )

            const top =
              Math.max(
                0,
                detection.y1,
              )

            const right =
              Math.min(
                stageWidth,
                detection.x2,
              )

            const bottom =
              Math.min(
                stageHeight,
                detection.y2,
              )

            const boxWidth =
              Math.max(
                1,
                right - left,
              )

            const boxHeight =
              Math.max(
                1,
                bottom - top,
              )

            context.strokeRect(
              left,
              top,
              boxWidth,
              boxHeight,
            )

            const numberText =
              detection.number
                .toLocaleString('fa-IR')

            const fontSize =
              Math.max(
                13,
                Math.min(
                  23,
                  Math.min(
                    boxWidth,
                    boxHeight,
                  ) * 0.3,
                ),
              )

            context.save()

            context.shadowBlur = 0
            context.textAlign = 'center'
            context.textBaseline =
              'middle'

            context.font =
              `800 ${fontSize}px system-ui, sans-serif`

            const textX =
              left +
              boxWidth / 2

            const textY =
              top +
              boxHeight / 2

            context.lineWidth = 4
            context.strokeStyle =
              'rgba(0, 8, 12, 0.9)'

            context.strokeText(
              numberText,
              textX,
              textY,
            )

            context.fillStyle =
              '#00e5ff'

            context.fillText(
              numberText,
              textX,
              textY,
            )

            context.restore()
          },
        )

        context.restore()

        return numberedDetections.length
      },
      [],
    )

  useEffect(() => {
    const redrawDetections = () => {
      drawPreviewDetectionOverlay(
        previewDetectionsRef.current,
      )
    }

    const stage = stageRef.current

    if (!stage) {
      return
    }

    const observer =
      typeof ResizeObserver !==
      'undefined'
        ? new ResizeObserver(
            redrawDetections,
          )
        : null

    observer?.observe(stage)

    window.addEventListener(
      'orientationchange',
      redrawDetections,
    )

    return () => {
      observer?.disconnect()

      window.removeEventListener(
        'orientationchange',
        redrawDetections,
      )
    }
  }, [
    drawPreviewDetectionOverlay,
  ])

  const runPreviewDetectionFrame =
    useCallback(async () => {
      const video = videoRef.current
      const stage = stageRef.current
      const roi = roiRef.current

      if (previewModelState !== 'ready') {
        throw new Error(
          'مدل مخصوص iOS هنوز آماده نیست.',
        )
      }

      if (cameraState !== 'ready') {
        throw new Error(
          'دوربین هنوز آماده نیست.',
        )
      }

      if (
        !video ||
        !stage ||
        !roi ||
        video.readyState < 2 ||
        video.videoWidth <= 0 ||
        video.videoHeight <= 0
      ) {
        throw new Error(
          'فریم یا ROI معتبر در دسترس نیست.',
        )
      }

      const crop = mapStageRoiToVideoCrop(
        video,
        stage,
        roi,
      )

      if (!crop) {
        throw new Error(
          'تبدیل ROI به مختصات دوربین ناموفق بود.',
        )
      }

      setPreviewFrameTestState('running')
      setPreviewFrameTestMessage(
        'در حال شمارش محلی روی iPhone...',
      )

      const result = await runPreviewModelFrameOnce(
        video,
        crop,
      )

      previewDetectionsRef.current =
        result.detections

      const rawVisibleCount =
        drawPreviewDetectionOverlay(
          result.detections,
        )

      setPreviewDetectionCount(
        result.displayedCount,
      )

      const inferenceText = Math.round(
        result.inferenceMs,
      ).toLocaleString('fa-IR')
      const preprocessText = Math.round(
        result.preprocessMs,
      ).toLocaleString('fa-IR')
      const totalText = Math.round(
        result.endToEndMs,
      ).toLocaleString('fa-IR')
      const stableText =
        result.displayedCount.toLocaleString('fa-IR')
      const rawText =
        rawVisibleCount.toLocaleString('fa-IR')
      const stabilityText = result.isCountStable
        ? 'پایدار'
        : 'در حال تثبیت'
      const approximateFps =
        result.endToEndMs > 0
          ? 1000 / result.endToEndMs
          : 0
      const fpsText = approximateFps.toLocaleString(
        'fa-IR',
        {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        },
      )

      setPreviewFrameTestState('success')
      setPreviewFrameTestMessage(
        `تعداد ${stableText} (${stabilityText}) | تشخیص فریم ${rawText} | آماده‌سازی ${preprocessText} ms | مدل ${inferenceText} ms | کل ${totalText} ms | ${fpsText} FPS`,
      )

      console.info(
        'IOS_WEB_PREVIEW_FRAME_RESULT',
        {
          ...result,
          rawVisibleCount,
          approximateFps,
          crop,
        },
      )
    }, [
      cameraState,
      previewModelState,
      drawPreviewDetectionOverlay,
    ])

  useEffect(() => {
    if (!previewLiveEnabled) {
      return
    }

    let cancelled = false
    let timerId: number | null = null
    let consecutivePreviewFailures = 0

    const scheduleNextFrame = (
      delayMs: number,
    ) => {
      if (cancelled) {
        return
      }

      timerId = window.setTimeout(
        () => {
          void runLoop()
        },
        delayMs,
      )
    }

    const runLoop = async () => {
      if (cancelled) {
        return
      }

      /*
       * هنگامی که تب مرورگر در پس‌زمینه است،
       * پردازش متوقف می‌شود تا باتری و CPU
       * بیهوده مصرف نشوند.
       */
      if (
        document.visibilityState !==
        'visible'
      ) {
        scheduleNextFrame(500)
        return
      }

      try {
        await runPreviewDetectionFrame()
        consecutivePreviewFailures = 0
      } catch (error) {
        console.error(
          'Preview live inference failed',
          error,
        )

        if (cancelled) {
          return
        }

        const errorDetail =
          error instanceof Error
            ? error.message
            : String(error)

        const errorCode =
          error instanceof Error
            ? error.name
            : 'unknown'

        consecutivePreviewFailures += 1

        if (
          consecutivePreviewFailures <= 2
        ) {
          setPreviewFrameTestState(
            'running',
          )

          setPreviewFrameTestMessage(
            `تلاش مجدد شمارش لحظه‌ای ${consecutivePreviewFailures.toLocaleString('fa-IR')}/۲ | ${errorCode}`,
          )

          scheduleNextFrame(
            500 *
            consecutivePreviewFailures,
          )

          return
        }

        previewDetectionsRef.current = []

        setPreviewDetectionCount(0)

        resetPreviewModelStability()

        resetPreviewSpatialNumbers()
        drawPreviewDetectionOverlay([])

        setPreviewFrameTestState(
          'error',
        )

        setPreviewFrameTestMessage(
          `خطای شمارش لحظه‌ای پس از ۳ تلاش: ${errorCode} | ${errorDetail}`,
        )

        setPreviewLiveEnabled(false)

        return
      }

      /*
       * اجرای بعدی تنها پس از پایان اجرای قبلی
       * آغاز می‌شود؛ بنابراین دو inference
       * به‌صورت هم‌زمان اجرا نخواهند شد.
       */
      /*
       * WEB_PREVIEW_PARALLEL_WORKER_LOOP_FINAL
       *
       * اجرای مدل در Dedicated Worker انجام می‌شود.
       * Thread اصلی منتظر پردازش CPU مدل نمی‌ماند
       * و نمایش دوربین، لمس ROI و رابط روان می‌مانند.
       *
       * فقط یک فریم در هر لحظه در Worker پردازش می‌شود؛
       * فریم بعدی بلافاصله پس از پاسخ قبلی ارسال می‌شود.
       */
      // BESHMARAI_IOS_PREVIEW_SPEED_FIX_V1_1
      scheduleNextFrame(0)
    }

    void runLoop()

    return () => {
      cancelled = true

      if (timerId !== null) {
        window.clearTimeout(timerId)
      }
    }
  }, [
    previewLiveEnabled,
    runPreviewDetectionFrame,
    drawPreviewDetectionOverlay,
  ])

  const togglePreviewLive =
    useCallback(() => {
      if (previewLiveEnabled) {
        setPreviewLiveEnabled(false)

        previewDetectionsRef.current = []

        setPreviewDetectionCount(0)

        resetPreviewModelStability()

        resetPreviewSpatialNumbers()
        drawPreviewDetectionOverlay([])

        setPreviewFrameTestState(
          'idle',
        )

        setPreviewFrameTestMessage(
          'شمارش لحظه‌ای متوقف است.',
        )

        return
      }

      if (
        cameraState !== 'ready' ||
        previewModelState !== 'ready'
      ) {
        setPreviewFrameTestState(
          'error',
        )

        setPreviewFrameTestMessage(
          'دوربین یا مدل لحظه‌ای هنوز آماده نیست.',
        )

        return
      }

      setPreviewFrameTestState(
        'running',
      )

      setPreviewFrameTestMessage(
        'در حال شروع شمارش لحظه‌ای...',
      )

      setPreviewLiveEnabled(true)
    }, [
      cameraState,
      previewModelState,
      previewLiveEnabled,
      drawPreviewDetectionOverlay,
    ])

  const captureCurrentRoi =
    useCallback(async () => {
      const video = videoRef.current
      const stage = stageRef.current
      const roi = roiRef.current

      if (accurateCountBusyRef.current) {
        return
      }

      if (cameraState !== 'ready') {
        setCaptureMessage(
          'دوربین هنوز آماده ثبت تصویر نیست.',
        )

        return
      }

      if (!video || !stage || !roi) {
        setCaptureMessage(
          'اطلاعات دوربین یا کادر ROI در دسترس نیست.',
        )

        return
      }

      if (
        video.readyState < 2 ||
        video.videoWidth <= 0 ||
        video.videoHeight <= 0
      ) {
        setCaptureMessage(
          'فریم دوربین هنوز کامل دریافت نشده است.',
        )

        return
      }

      if (!capturedPreview) {
        accuratePreviewWasLiveRef.current =
          previewLiveEnabled
      }

      const runToken =
        accurateRunTokenRef.current + 1

      accurateRunTokenRef.current =
        runToken

      accurateCountBusyRef.current =
        true

      setAccurateCountBusy(true)
      setAccurateCountError(null)
      setPreviewLiveEnabled(false)

      previewDetectionsRef.current = []

      resetPreviewModelStability()
      resetPreviewSpatialNumbers()
      drawPreviewDetectionOverlay([])

      setPreviewFrameTestState(
        'running',
      )

      setPreviewFrameTestMessage(
        'شمارش لحظه‌ای برای اجرای مدل دقیق متوقف شد.',
      )

      clearCapturedPreview()

      try {
        setCaptureMessage(
          'در حال استخراج تصویر داخل کادر...',
        )

        const stageBounds =
          stage.getBoundingClientRect()

        const stageWidth =
          stageBounds.width

        const stageHeight =
          stageBounds.height

        const videoWidth =
          video.videoWidth

        const videoHeight =
          video.videoHeight

        if (
          stageWidth <= 0 ||
          stageHeight <= 0
        ) {
          throw new Error(
            'Camera stage has invalid dimensions.',
          )
        }

        /*
         * camera-video از object-fit: cover استفاده می‌کند.
         * بنابراین بخشی از فریم اصلی بیرون Stage قرار می‌گیرد.
         * این محاسبه ROI نمایشی را دقیقاً به مختصات
         * واقعی ویدئو تبدیل می‌کند.
         */
        const coverScale = Math.max(
          stageWidth / videoWidth,
          stageHeight / videoHeight,
        )

        const renderedVideoWidth =
          videoWidth * coverScale

        const renderedVideoHeight =
          videoHeight * coverScale

        const hiddenOffsetX =
          (
            renderedVideoWidth -
            stageWidth
          ) / 2

        const hiddenOffsetY =
          (
            renderedVideoHeight -
            stageHeight
          ) / 2

        let sourceX =
          (
            roi.x +
            hiddenOffsetX
          ) / coverScale

        let sourceY =
          (
            roi.y +
            hiddenOffsetY
          ) / coverScale

        let sourceWidth =
          roi.width / coverScale

        let sourceHeight =
          roi.height / coverScale

        sourceX = clampNumber(
          sourceX,
          0,
          videoWidth - 1,
        )

        sourceY = clampNumber(
          sourceY,
          0,
          videoHeight - 1,
        )

        sourceWidth = clampNumber(
          sourceWidth,
          1,
          videoWidth - sourceX,
        )

        sourceHeight = clampNumber(
          sourceHeight,
          1,
          videoHeight - sourceY,
        )

        // BESHMARAI_ACCURATE_ROI_INPUT_V10_BEGIN
        /*
         * ورودی مدل ثابت 1152×1152 است. ساخت Canvas با
         * رزولوشن خام چندمگاپیکسلی ROI فقط باعث مصرف حافظه،
         * Encode/Decode و کپی اضافه می‌شود. ROI مستقیماً و با
         * حفظ نسبت در حداکثر اندازه موردنیاز مدل Raster می‌شود.
         * اگر ROI از 1152 کوچک‌تر باشد، هیچ Upscale زودهنگامی
         * انجام نمی‌شود و Upscale نهایی همچنان در preprocess
         * اصلی مدل انجام خواهد شد.
         */
        const accurateCaptureMaximumSide =
          1152

        const captureScale = Math.min(
          1,
          accurateCaptureMaximumSide /
            sourceWidth,
          accurateCaptureMaximumSide /
            sourceHeight,
        )

        const outputWidth = Math.max(
          1,
          Math.round(
            sourceWidth * captureScale,
          ),
        )

        const outputHeight = Math.max(
          1,
          Math.round(
            sourceHeight * captureScale,
          ),
        )

        // BESHMARAI_ACCURATE_ROI_INPUT_V10_END

        const captureCanvas =
          document.createElement('canvas')

        captureCanvas.width =
          outputWidth

        captureCanvas.height =
          outputHeight

        const captureContext =
          captureCanvas.getContext(
            '2d',
            {
              alpha: false,
            },
          )

        if (!captureContext) {
          throw new Error(
            'Capture canvas context is unavailable.',
          )
        }

        captureContext.imageSmoothingEnabled =
          true

        captureContext.imageSmoothingQuality =
          'high'

        captureContext.drawImage(
          video,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          outputWidth,
          outputHeight,
        )

        /*
         * فریم قبل از شروع مدل ذخیره و فوراً نمایش داده
         * می‌شود تا کاربر تصویر ثابت و خط اسکن را ببیند.
         */
        const frozenBlob =
          await new Promise<Blob>(
            (resolve, reject) => {
              captureCanvas.toBlob(
                (result) => {
                  if (result) {
                    resolve(result)
                    return
                  }

                  reject(
                    new Error(
                      'Creating frozen accurate ROI image failed.',
                    ),
                  )
                },
                'image/jpeg',
                0.96,
              )
            },
          )

        if (
          accurateRunTokenRef.current !==
          runToken
        ) {
          return
        }

        const frozenPreviewUrl =
          URL.createObjectURL(frozenBlob)

        try {
          await decodeFrozenPreviewImage(
            frozenPreviewUrl,
          )
        } catch (decodeError) {
          URL.revokeObjectURL(
            frozenPreviewUrl,
          )

          throw decodeError
        }

        if (
          accurateRunTokenRef.current !==
          runToken
        ) {
          URL.revokeObjectURL(
            frozenPreviewUrl,
          )

          return
        }

        capturedObjectUrlRef.current =
          frozenPreviewUrl

        /*
         * React باید قبل از ورود به preprocessing و WASM
         * تصویر ثابت و لایه اسکن را واقعاً Commit کند.
         * flushSync فقط همین UI انتظار را Commit می‌کند و
         * هیچ تغییری در ورودی یا اجرای مدل ایجاد نمی‌کند.
         */
        flushSync(() => {
          setCapturedPreview({
            url: frozenPreviewUrl,
            width: outputWidth,
            height: outputHeight,
            count: 0,
            detections: [],
            rawCandidateCount: 0,
            preprocessMs: 0,
            inferenceMs: 0,
            postprocessMs: 0,
            sessionCreateMs: 0,
            runtimePrepareMs: 0,
            totalMs: 0,
            executionProvider: 'wasm',
            fallbackOccurred: false,
          })

          setCaptureMessage(
            'تصویر ثابت شد؛ در حال اسکن و شمارش دقیق...',
          )
        })

        /*
         * decode به‌تنهایی Paint را تضمین نمی‌کند. دو فریم
         * و یک yield کوتاه اجازه می‌دهند تصویر و اولین موقعیت
         * Scanner پیش از مسدودشدن احتمالی Thread اصلی دیده شوند.
         */
        await waitForFrozenPreviewPaint()

        const frozenViewer =
          accurateResultViewerRef.current

        if (frozenViewer) {
          const scanDistance = Math.max(
            80,
            frozenViewer.clientHeight * 0.92 - 3,
          )

          frozenViewer.style.setProperty(
            '--accurate-scan-distance',
            `${scanDistance}px`,
          )
        }

        await waitForFrozenPreviewPaint()

        if (
          accurateRunTokenRef.current !==
          runToken
        ) {
          return
        }

        setCaptureMessage(
          'در حال آماده‌سازی مدل دقیق ۱۱۵۲...',
        )

        const finalResult =
          await runFinalAccurateModel(
            captureCanvas,
            (message) => {
              if (
                accurateRunTokenRef.current ===
                runToken
              ) {
                setCaptureMessage(message)
              }
            },
          )

        if (
          accurateRunTokenRef.current !==
          runToken
        ) {
          return
        }

        setCaptureMessage(
          'نتیجه آماده شد؛ در حال ترسیم باکس‌ها...',
        )
        setPreviewDetectionCount(
          finalResult.count,
        )

        setCapturedPreview(
          (currentPreview) => {
            if (!currentPreview) {
              return null
            }

            return {
              ...currentPreview,
              count: finalResult.count,
              detections:
                finalResult.detections,
              rawCandidateCount:
                finalResult.rawCandidateCount,
              preprocessMs:
                finalResult.preprocessMs,
              inferenceMs:
                finalResult.inferenceMs,
              postprocessMs:
                finalResult.postprocessMs,
              sessionCreateMs:
                finalResult.sessionCreateMs,
              runtimePrepareMs:
                finalResult.runtimePrepareMs,
              totalMs:
                finalResult.totalMs,
              executionProvider:
                finalResult.executionProvider,
              fallbackOccurred:
                finalResult.fallbackOccurred,
            }
          },
        )

        const countText =
          finalResult.count
            .toLocaleString('fa-IR')

        const preprocessText =
          Math.round(
            finalResult.preprocessMs,
          ).toLocaleString('fa-IR')

        const inferenceText =
          Math.round(
            finalResult.inferenceMs,
          ).toLocaleString('fa-IR')

        const postprocessText =
          Math.round(
            finalResult.postprocessMs,
          ).toLocaleString('fa-IR')

        const sessionCreateText =
          Math.round(
            finalResult.sessionCreateMs,
          ).toLocaleString('fa-IR')

        const runtimePrepareText =
          Math.round(
            finalResult.runtimePrepareMs,
          ).toLocaleString('fa-IR')

        const totalText =
          Math.round(
            finalResult.totalMs,
          ).toLocaleString('fa-IR')

        const providerText =
          finalResult.executionProvider ===
            'webgpu'
            ? 'WebGPU'
            : 'WASM'


        const runtimeProfileText =
          finalResult.executionProvider ===
            'wasm'
            ? `${finalResult.runtimeProfileId} / ${finalResult.threadCount.toLocaleString('fa-IR')} رشته`
            : finalResult.runtimeProfileId

        const modelLoadText =
          Math.round(
            finalResult.modelLoadMs,
          ).toLocaleString('fa-IR')

        setPreviewFrameTestState(
          'success',
        )

        setPreviewFrameTestMessage(
          `نتیجه دقیق: ${countText} قرص | ${providerText} | ${runtimeProfileText} | رمزگشایی مدل ${modelLoadText} ms | ساخت session ${sessionCreateText} ms | آماده‌سازی runtime ${runtimePrepareText} ms | آماده‌سازی تصویر ${preprocessText} ms | اجرای مدل ${inferenceText} ms | پردازش نتیجه ${postprocessText} ms | کل ${totalText} ms`,
        )

        setCaptureMessage(
          `شمارش دقیق انجام شد: ${countText} قرص.`,
        )

        console.info(
          'BESHMARAI_FINAL_1152_RESULT',
          {
            ...finalResult,
            videoWidth,
            videoHeight,
            roi,
            roiSourceWidth:
              sourceWidth,
            roiSourceHeight:
              sourceHeight,
            captureScale,
            outputWidth,
            outputHeight,
          },
        )
      } catch (error) {
        if (
          accurateRunTokenRef.current !==
          runToken
        ) {
          return
        }

        console.error(
          'Accurate 1152 count failed',
          error,
        )

        const errorDetail =
          error instanceof Error
            ? error.message
            : String(error)

        const diagnostics =
          getFinalRuntimeDiagnostics()

        const failure =
          diagnostics.lastFailure

        const failureCode =
          failure?.code ??
          (
            error instanceof Error
              ? error.name
              : 'unknown'
          )

        const planId =
          failure?.planId ??
          diagnostics.plan?.planId ??
          'none'

        const supportCode =
          `${failureCode}/${planId}`

        setAccurateCountError(
          `پردازش شمارش دقیق ناموفق بود. کد فنی: ${supportCode}`,
        )

        setPreviewFrameTestState(
          'error',
        )

        setPreviewFrameTestMessage(
          `خطای شمارش دقیق: ${errorDetail} | ${supportCode}`,
        )

        setCaptureMessage(
          `شمارش دقیق کامل نشد؛ کد ${supportCode}`,
        )

        console.error(
          'BESHMARAI_FINAL_RUNTIME_FAILURE_DIAGNOSTICS',
          diagnostics,
        )

        /*
         * اگر فریم ثابت ساخته شده باشد، همان تصویر برای
         * تلاش دوباره باقی می‌ماند. فقط خطاهای قبل از
         * ثبت فریم باعث بازگشت خودکار به حالت زنده می‌شوند.
         */
        if (
          !capturedObjectUrlRef.current &&
          accuratePreviewWasLiveRef.current
        ) {
          setPreviewLiveEnabled(true)
        }
      } finally {
        if (
          accurateRunTokenRef.current ===
          runToken
        ) {
          accurateCountBusyRef.current =
            false

          setAccurateCountBusy(false)
        }
      }
    }, [
      cameraState,
      capturedPreview,
      clearCapturedPreview,
      drawPreviewDetectionOverlay,
      previewLiveEnabled,
      resetPreviewSpatialNumbers,
    ])
  useEffect(() => {
    let cancelled = false

    const startedAt =
      performance.now()

    setPreviewModelState('loading')

    setPreviewModelMessage(
      'در حال بارگذاری مدل مخصوص iOS...',
    )

    void loadPreviewModelSession()
      .then((model) => {
        if (cancelled) {
          return
        }

        const elapsedMs = Math.max(
          0,
          Math.round(
            performance.now() -
            startedAt,
          ),
        )

        setPreviewModelState('ready')

        // WEB_WASM_MULTITHREAD_STATUS_FINAL
        // WEB_PREVIEW_WEBGPU_STATUS_FINAL

        const threadText =
          model.threadCount
            .toLocaleString('fa-IR')

        const warmupText =
          Math.round(
            model.warmupMs,
          ).toLocaleString('fa-IR')

        const providerText =
          model.executionProvider ===
          'webgpu-graph-capture'
            ? 'WebGPU + Graph Capture'
            : model.executionProvider ===
                'webgpu'
              ? 'WebGPU'
              : `WASM ${threadText} رشته`

        setPreviewModelMessage(
          `مدل آماده است؛ ${providerText}؛ Warm-up ${warmupText} ms؛ بارگذاری ${elapsedMs.toLocaleString('fa-IR')} ms`,
        )

        console.info(
          'IOS_WEB_PREVIEW_MODEL_SESSION_READY',
          {
            inputName: model.inputName,
            outputName: model.outputName,
            elapsedMs,
            threadCount:
              model.threadCount,
            crossOriginIsolated:
              model.crossOriginIsolated,
            executionProvider:
              model.executionProvider,
            graphCaptureEnabled:
              model.graphCaptureEnabled,
            warmupMs:
              model.warmupMs,
            webGpuAvailable:
              model.webGpuAvailable,
            secureContext:
              model.secureContext,
          },
        )

        console.info(
          'BESHMARAI_FINAL_RUNTIME_ON_DEMAND_ONLY',
          {
            automatic_prewarm: false,
            trigger: 'explicit-accurate-count',
          },
        )
      })
      .catch((error: unknown) => {
        console.error(
          'Preview model session load failed',
          error,
        )

        if (cancelled) {
          return
        }

        setPreviewModelState('error')

        // WEB_PREVIEW_MODEL_ERROR_DETAIL_FINAL

        const errorDetail =
          error instanceof Error
            ? error.message
            : String(error)

        const errorCode =
          error instanceof Error
            ? error.name
            : 'unknown'

        setPreviewModelMessage(
          `خطای مدل لحظه‌ای: ${errorCode} | ${errorDetail}`,
        )
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (capturedObjectUrlRef.current) {
        URL.revokeObjectURL(
          capturedObjectUrlRef.current,
        )

        capturedObjectUrlRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      void releaseFinalRuntime(
        'camera-screen-unmount',
      )
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function openCamera() {
      if (
        !navigator.mediaDevices
          ?.getUserMedia
      ) {
        setCameraState('error')

        setCameraMessage(
          'مرورگر این دستگاه دسترسی دوربین را پشتیبانی نمی‌کند.',
        )

        return
      }

      const cameraGeneration =
        ++cameraOpenGenerationRef.current

      const cameraOpenIsCurrent =
        (): boolean =>
          !cancelled &&
          cameraOpenGenerationRef.current ===
            cameraGeneration

      try {
        setCameraSwitchBusy(true)
        setCameraState('opening')
        setCameraMessage(
          'در حال آماده‌سازی دوربین...',
        )
        setCameraOpeningProgress(8)
        setCameraOpeningDetail(
          'در حال بررسی مجوز دوربین و انتخاب بهترین لنز...',
        )

        // BESHMARAI_CAMERA_OPENING_MODEL_WARMUP_V20_BEGIN

        /*
         * Preview is always prepared while the camera opens.
         * The adaptive Final coordinator may also prewarm on strong devices;
         * medium and low-memory devices defer the 80 MB model until requested.
         */
        let cameraFrameIsReady = false
        let previewModelPrepared = false

        const reportModelPreparationProgress =
          () => {
            if (
              !cameraFrameIsReady ||
              !cameraOpenIsCurrent()
            ) {
              return
            }

            setCameraMessage(
              'در حال آماده‌سازی هوش مصنوعی...',
            )

            if (!previewModelPrepared) {
              setCameraOpeningProgress(62)
              setCameraOpeningDetail(
                'مدل شمارش لحظه‌ای در حال آماده‌سازی است؛ موتور دقیق بر اساس توان دستگاه مدیریت می‌شود.',
              )
              return
            }

            setCameraOpeningProgress(92)
            setCameraOpeningDetail(
              'مدل شمارش لحظه‌ای آماده شد؛ در حال تکمیل محیط شمارش...',
            )
          }

        const previewModelPreparation =
          loadPreviewModelSession().finally(
            () => {
              previewModelPrepared = true
              reportModelPreparationProgress()
            },
          )

        const cameraOpeningModelPreparation =
          Promise.allSettled([
            previewModelPreparation,
          ])

        // BESHMARAI_CAMERA_OPENING_MODEL_WARMUP_V20_END

        // BESHMARAI_CAMERA_DEVICE_DROPDOWN_V7_BEGIN

        // V13 uses separate automatic and manual preferences.
        // The old V7 key mixed both cases and is intentionally retired.
        writeLocalStorageValue(
          'beshmarai_camera_device_id_v7',
          '',
        )

        const cameraSleep = (
          milliseconds: number,
        ) =>
          new Promise<void>(
            (resolve) => {
              window.setTimeout(
                resolve,
                milliseconds,
              )
            },
          )

        const stopTemporaryStream = (
          candidateStream:
            MediaStream | null,
        ): void => {
          candidateStream
            ?.getTracks()
            .forEach(
              (track) =>
                track.stop(),
            )
        }

        const createCameraConstraints = (
          cameraDeviceId?: string,
        ): MediaTrackConstraints => {
          const constraints:
            MediaTrackConstraints = {
              width: {
                ideal: 1920,
              },

              height: {
                ideal: 1080,
              },

              frameRate: {
                ideal: 30,
                max: 30,
              },
            }

          if (cameraDeviceId) {
            constraints.deviceId = {
              exact: cameraDeviceId,
            }
          } else {
            constraints.facingMode = {
              ideal: 'environment',
            }
          }

          return constraints
        }

        const cameraErrorIsTransient = (
          error: unknown,
        ): boolean =>
          error instanceof DOMException &&
          (
            error.name ===
              'NotReadableError' ||
            error.name ===
              'AbortError'
          )

        const createSupersededError =
          (): Error =>
            new Error(
              'CAMERA_OPEN_SUPERSEDED',
            )

        const openCameraWithRetry =
          async (
            cameraDeviceId?: string,
          ): Promise<MediaStream> => {
            let lastError: unknown =
              new Error(
                'CAMERA_OPEN_FAILED',
              )

            for (
              let attempt = 0;
              attempt < 3;
              attempt += 1
            ) {
              if (
                !cameraOpenIsCurrent()
              ) {
                throw createSupersededError()
              }

              try {
                const openedStream =
                  await navigator
                    .mediaDevices
                    .getUserMedia({
                      audio: false,

                      video:
                        createCameraConstraints(
                          cameraDeviceId,
                        ),
                    })

                if (
                  !cameraOpenIsCurrent()
                ) {
                  stopTemporaryStream(
                    openedStream,
                  )

                  throw createSupersededError()
                }

                return openedStream
              } catch (error) {
                lastError = error

                if (
                  error instanceof Error &&
                  error.message ===
                    'CAMERA_OPEN_SUPERSEDED'
                ) {
                  throw error
                }

                if (
                  !cameraErrorIsTransient(
                    error,
                  ) ||
                  attempt >= 2
                ) {
                  break
                }

                await cameraSleep(
                  450 +
                    attempt * 350,
                )
              }
            }

            throw lastError
          }

        const waitForVideoFrameReady =
          async (
            videoElement:
              HTMLVideoElement,
          ): Promise<void> => {
            const deadline =
              performance.now() +
              8000

            while (
              performance.now() <
              deadline
            ) {
              if (
                !cameraOpenIsCurrent()
              ) {
                throw createSupersededError()
              }

              if (
                videoElement.readyState >=
                  2 &&
                videoElement.videoWidth >
                  0 &&
                videoElement.videoHeight >
                  0
              ) {
                return
              }

              await cameraSleep(80)
            }

            throw new Error(
              'CAMERA_FRAME_READY_TIMEOUT',
            )
          }

        const cameraSelectionMode =
          getCameraSelectionMode()

        let requestedDeviceId =
          cameraRequestedDeviceIdRef.current

        if (!requestedDeviceId) {
          requestedDeviceId =
            cameraSelectionMode === 'manual'
              ? readLocalStorageValue(
                  cameraManualDeviceStorageKey,
                )
              : readLocalStorageValue(
                  cameraAutoDeviceStorageKey,
                )
        }

        let stream:
          MediaStream | null = null

        let selectionStrategy =
          requestedDeviceId
            ? cameraSelectionMode === 'manual'
              ? 'manual-settings-device'
              : 'cached-auto-device'
            : 'automatic-evidence-selection'

        if (requestedDeviceId) {
          try {
            stream =
              await openCameraWithRetry(
                requestedDeviceId,
              )
          } catch (storedCameraError) {
            if (!cameraOpenIsCurrent()) {
              throw createSupersededError()
            }

            console.warn(
              'Stored camera failed; camera evidence selection will run again.',
              storedCameraError,
            )

            if (
              cameraSelectionMode ===
              'manual'
            ) {
              writeLocalStorageValue(
                cameraManualDeviceStorageKey,
                '',
              )
              saveCameraSelectionMode(
                'auto',
              )
            } else {
              writeLocalStorageValue(
                cameraAutoDeviceStorageKey,
                '',
              )
              writeLocalStorageValue(
                cameraAutoLabelStorageKey,
                '',
              )
            }

            requestedDeviceId = ''
            cameraRequestedDeviceIdRef.current =
              ''
            selectionStrategy =
              'automatic-evidence-fallback'
          }
        }

        if (!stream) {
          stream =
            await openCameraWithRetry()
        }

        if (
          !stream ||
          !cameraOpenIsCurrent()
        ) {
          stopTemporaryStream(stream)
          throw createSupersededError()
        }

        let selectedCameraTrack =
          stream.getVideoTracks()[0]

        if (!selectedCameraTrack) {
          stopTemporaryStream(stream)
          throw new Error(
            'CAMERA_VIDEO_TRACK_NOT_CREATED',
          )
        }

        let selectedCameraSettings =
          typeof selectedCameraTrack
            .getSettings === 'function'
            ? selectedCameraTrack
                .getSettings()
            : null

        let selectedCameraCapabilities =
          getCameraTrackCapabilities(
            selectedCameraTrack,
          )

        let actualDeviceId =
          selectedCameraSettings?.deviceId ??
          requestedDeviceId

        const enumeratedDevices =
          await navigator.mediaDevices
            .enumerateDevices()

        if (!cameraOpenIsCurrent()) {
          stopTemporaryStream(stream)
          throw createSupersededError()
        }

        const videoDevices:
          CameraDeviceOption[] =
          enumeratedDevices
            .filter(
              (device) =>
                device.kind ===
                  'videoinput' &&
                Boolean(device.deviceId),
            )
            .map((device) => ({
              deviceId: device.deviceId,
              label: device.label,
              groupId: device.groupId,
            }))

        if (
          actualDeviceId &&
          !videoDevices.some(
            (device) =>
              device.deviceId ===
              actualDeviceId,
          )
        ) {
          videoDevices.unshift({
            deviceId: actualDeviceId,
            label:
              selectedCameraTrack.label,
            groupId: '',
          })
        }

        const shouldDetectAutomatically =
          getCameraSelectionMode() ===
            'auto' &&
          !requestedDeviceId &&
          videoDevices.length > 1

        const currentEvidence =
          createCameraDeviceEvidence(
            actualDeviceId,
            selectedCameraTrack.label,
            selectedCameraSettings,
            selectedCameraCapabilities,
            true,
          )

        let selectedEvidence =
          currentEvidence

        if (
          shouldDetectAutomatically &&
          !currentEvidence
            .strongMainCandidate
        ) {
          const evidenceResults:
            CameraDeviceEvidence[] = [
              currentEvidence,
            ]

          const candidatesToProbe =
            [...videoDevices]
              .filter(
                (device) =>
                  device.deviceId !==
                  actualDeviceId,
              )
              .sort(
                (first, second) =>
                  cameraLabelProbePriority(
                    second,
                  ) -
                  cameraLabelProbePriority(
                    first,
                  ),
              )
              .slice(0, 5)

          stopTemporaryStream(stream)
          stream = null
          await cameraSleep(260)

          for (
            const candidate of
            candidatesToProbe
          ) {
            if (!cameraOpenIsCurrent()) {
              throw createSupersededError()
            }

            let probeStream:
              MediaStream | null = null

            try {
              probeStream =
                await openCameraWithRetry(
                  candidate.deviceId,
                )

              const probeTrack =
                probeStream
                  .getVideoTracks()[0]

              if (!probeTrack) {
                continue
              }

              const probeSettings =
                typeof probeTrack
                  .getSettings ===
                'function'
                  ? probeTrack
                      .getSettings()
                  : null

              const probeCapabilities =
                getCameraTrackCapabilities(
                  probeTrack,
                )

              const evidence =
                createCameraDeviceEvidence(
                  probeSettings
                    ?.deviceId ??
                    candidate.deviceId,
                  probeTrack.label ||
                    candidate.label,
                  probeSettings,
                  probeCapabilities,
                )

              evidenceResults.push(
                evidence,
              )

              if (
                evidence
                  .strongMainCandidate
              ) {
                break
              }
            } catch (probeError) {
              console.info(
                'BESHMARAI_CAMERA_AUTO_PROBE_SKIPPED',
                {
                  deviceId:
                    candidate.deviceId,
                  label:
                    candidate.label,
                  error:
                    probeError instanceof
                    Error
                      ? probeError.message
                      : String(
                          probeError,
                        ),
                },
              )
            } finally {
              stopTemporaryStream(
                probeStream,
              )
            }

            await cameraSleep(180)
          }

          selectedEvidence =
            evidenceResults.sort(
              (first, second) =>
                second.score -
                first.score,
            )[0] ?? currentEvidence

          stream =
            await openCameraWithRetry(
              selectedEvidence.deviceId ||
                undefined,
            )

          selectedCameraTrack =
            stream.getVideoTracks()[0]

          if (!selectedCameraTrack) {
            stopTemporaryStream(stream)
            throw new Error(
              'CAMERA_AUTO_SELECTED_TRACK_MISSING',
            )
          }

          selectedCameraSettings =
            typeof selectedCameraTrack
              .getSettings === 'function'
              ? selectedCameraTrack
                  .getSettings()
              : null

          selectedCameraCapabilities =
            getCameraTrackCapabilities(
              selectedCameraTrack,
            )

          actualDeviceId =
            selectedCameraSettings
              ?.deviceId ??
            selectedEvidence.deviceId

          selectionStrategy =
            'automatic-label-facing-torch-score'
        }

        if (
          getCameraSelectionMode() ===
            'auto' &&
          actualDeviceId
        ) {
          writeLocalStorageValue(
            cameraAutoDeviceStorageKey,
            actualDeviceId,
          )

          writeLocalStorageValue(
            cameraAutoLabelStorageKey,
            selectedCameraTrack.label ||
              selectedEvidence.label ||
              'دوربین اصلی پشت',
          )
        }

        if (cameraOpenIsCurrent()) {
          setCameraOpeningProgress(38)
          setCameraOpeningDetail(
            'لنز مناسب انتخاب شد؛ در حال دریافت تصویر زنده از دوربین...',
          )
        }

        console.info(
          'BESHMARAI_CAMERA_AUTO_SELECTION_V13',
          {
            selectionMode:
              getCameraSelectionMode(),
            selectionStrategy,
            requestedDeviceId,
            actualDeviceId,
            selectedEvidence,
            availableDevices:
              videoDevices.map(
                (device, index) => ({
                  index,
                  deviceId:
                    device.deviceId,
                  label: device.label,
                  hint:
                    getCameraDeviceHint(
                      device.label,
                    ),
                }),
              ),
          },
        )

        const restartForTrackFailure = (
          reason: string,
        ) => {
          if (
            !cameraOpenIsCurrent() ||
            document.visibilityState !==
              'visible' ||
            cameraLifecycleSuspendedRef
              .current
          ) {
            return
          }

          console.warn(
            'BESHMARAI_CAMERA_TRACK_RESTART',
            {
              reason,
              deviceId:
                actualDeviceId,
            },
          )

          requestCameraRestart()
        }

        selectedCameraTrack
          .addEventListener(
            'ended',
            () => {
              restartForTrackFailure(
                'track-ended',
              )
            },
          )

        selectedCameraTrack
          .addEventListener(
            'mute',
            () => {
              if (
                cameraTrackMuteTimerRef
                  .current !== null
              ) {
                window.clearTimeout(
                  cameraTrackMuteTimerRef
                    .current,
                )
              }

              cameraTrackMuteTimerRef.current =
                window.setTimeout(() => {
                  cameraTrackMuteTimerRef.current =
                    null

                  if (
                    selectedCameraTrack
                      .muted
                  ) {
                    restartForTrackFailure(
                      'track-muted',
                    )
                  }
                }, 1200)
            },
          )

        selectedCameraTrack
          .addEventListener(
            'unmute',
            () => {
              if (
                cameraTrackMuteTimerRef
                  .current === null
              ) {
                return
              }

              window.clearTimeout(
                cameraTrackMuteTimerRef
                  .current,
              )

              cameraTrackMuteTimerRef.current =
                null
            },
          )

        const selectedLensZoom = 1

        console.info(
          'BESHMARAI_CAMERA_DEVICE_SELECTED_V7',
          {
            selectionStrategy,
            requestedDeviceId,
            actualDeviceId,

            label:
              selectedCameraTrack
                .label,

            facingMode:
              selectedCameraSettings
                ?.facingMode,

            width:
              selectedCameraSettings
                ?.width,

            height:
              selectedCameraSettings
                ?.height,

            availableDevices:
              videoDevices.map(
                (
                  device,
                  index,
                ) => ({
                  index,
                  deviceId:
                    device.deviceId,
                  label:
                    device.label,
                  hint:
                    getCameraDeviceHint(
                      device.label,
                    ),
                }),
              ),
          },
        )

        // BESHMARAI_CAMERA_DEVICE_DROPDOWN_V7_END

        if (
          !cameraOpenIsCurrent()
        ) {
          stream
            .getTracks()
            .forEach(
              (track) => track.stop(),
            )

          return
        }

        streamRef.current = stream

        const cameraTrack =
          stream.getVideoTracks()[0]

        const cameraCapabilities =
          selectedCameraCapabilities ??
          (cameraTrack
            ? getCameraTrackCapabilities(
                cameraTrack,
              )
            : null)

        setCountingTorchEnabled(false)

        setCountingTorchAvailable(
          Boolean(
            cameraCapabilities?.torch,
          ),
        )

        setCountingZoomLevel(1)

        setCountingZoomAvailable(
          Boolean(
            cameraCapabilities?.zoom,
          ),
        )

        console.info(
          'BESHMARAI_CAMERA_ZOOM_CAPABILITY_V16',
          {
            available: Boolean(
              cameraCapabilities?.zoom,
            ),
            zoom: cameraCapabilities?.zoom ?? null,
          },
        )

        // BESHMARAI_CAMERA_QUALITY_AUTOFOCUS_V1_BEGIN

        const cameraEnhancementConstraints:
          MediaTrackConstraintSet[] = []

        const activeCameraZoom =
          cameraTrack &&
          typeof cameraTrack
            .getSettings ===
            'function'
            ? (
                cameraTrack
                  .getSettings() as
                  MediaTrackSettings & {
                    zoom?: number
                  }
              ).zoom ??
                selectedLensZoom
            : selectedLensZoom

        console.info(
          'BESHMARAI_MAIN_LENS_CONFIRMED_ZOOM',
          {
            selectedLensZoom,
            activeCameraZoom,
            automaticStartupZoom:
              false,
          },
        )

        if (
          cameraCapabilities?.focusMode
            ?.includes('continuous')
        ) {
          cameraEnhancementConstraints.push(
            ({
              focusMode: 'continuous',
            } as unknown) as
              MediaTrackConstraintSet,
          )
        }

        if (
          cameraCapabilities?.exposureMode
            ?.includes('continuous')
        ) {
          cameraEnhancementConstraints.push(
            ({
              exposureMode: 'continuous',
            } as unknown) as
              MediaTrackConstraintSet,
          )
        }

        if (
          cameraCapabilities
            ?.whiteBalanceMode
            ?.includes('continuous')
        ) {
          cameraEnhancementConstraints.push(
            ({
              whiteBalanceMode:
                'continuous',
            } as unknown) as
              MediaTrackConstraintSet,
          )
        }

        if (
          cameraTrack &&
          cameraEnhancementConstraints
            .length > 0
        ) {
          try {
            await cameraTrack
              .applyConstraints({
                advanced:
                  cameraEnhancementConstraints,
              })
          } catch (
            enhancementError
          ) {
            console.warn(
              'Camera enhancement constraints failed',
              enhancementError,
            )
          }
        }

        const cameraSettings =
          cameraTrack &&
          typeof cameraTrack
            .getSettings ===
            'function'
            ? cameraTrack.getSettings()
            : null

        console.info(
          'BESHMARAI_CAMERA_QUALITY_ACTIVE',
          {
            requestedWidth: 1920,
            requestedHeight: 1080,
            requestedFrameRate: 30,

            actualWidth:
              cameraSettings?.width,

            actualHeight:
              cameraSettings?.height,

            actualFrameRate:
              cameraSettings?.frameRate,

            continuousFocusSupported:
              Boolean(
                cameraCapabilities
                  ?.focusMode
                  ?.includes(
                    'continuous',
                  ),
              ),

            continuousExposureSupported:
              Boolean(
                cameraCapabilities
                  ?.exposureMode
                  ?.includes(
                    'continuous',
                  ),
              ),

            continuousWhiteBalanceSupported:
              Boolean(
                cameraCapabilities
                  ?.whiteBalanceMode
                  ?.includes(
                    'continuous',
                  ),
              ),
          },
        )

        // BESHMARAI_CAMERA_QUALITY_AUTOFOCUS_V1_END

        const video = videoRef.current

        if (!video) {
          throw new Error(
            'Video element is not ready.',
          )
        }

        video.srcObject = stream
        await video.play()
        await waitForVideoFrameReady(video)

        if (!cameraOpenIsCurrent()) {
          throw createSupersededError()
        }

        cameraFrameIsReady = true
        reportModelPreparationProgress()

        const cameraOpeningModelResults =
          await cameraOpeningModelPreparation

        const previewPreparationResult =
          cameraOpeningModelResults[0]

        if (
          previewPreparationResult?.status ===
          'rejected'
        ) {
          console.warn(
            'BINADARU_PREVIEW_MODEL_CAMERA_OPENING_FAILED',
            previewPreparationResult.reason,
          )
        }

        if (
          cameraOpenIsCurrent()
        ) {
          setCameraMessage(
            'در حال نهایی‌سازی محیط شمارش...',
          )
          setCameraOpeningProgress(97)
          setCameraOpeningDetail(
            'تنظیمات دوربین و مدل شمارش لحظه‌ای در حال اتصال نهایی هستند.',
          )

          await new Promise<void>((resolve) => {
            window.requestAnimationFrame(() => {
              resolve()
            })
          })

          if (!cameraOpenIsCurrent()) {
            return
          }

          setCameraOpeningProgress(100)
          setCameraMessage(
            'دوربین و هوش مصنوعی آماده‌اند',
          )
          setCameraOpeningDetail(
            'همه‌چیز آماده است؛ نمای شمارش در حال نمایش است.',
          )
          setCameraSwitchBusy(false)
          setCameraState('ready')

          window.requestAnimationFrame(
            drawOverlay,
          )
        }
      } catch (error) {
        const superseded =
          error instanceof Error &&
          error.message ===
            'CAMERA_OPEN_SUPERSEDED'

        if (
          superseded ||
          !cameraOpenIsCurrent()
        ) {
          return
        }

        console.error(
          'Camera open failed',
          error,
        )

        stopCamera()
        setCameraSwitchBusy(false)
        setCameraState('error')

        setCameraMessage(
          'دسترسی دوربین برقرار نشد. مجوز دوربین مرورگر را بررسی کنید.',
        )
      }
    }

    void openCamera()

    return () => {
      cancelled = true
      cameraOpenGenerationRef.current += 1
      stopCamera()
    }
  }, [
    cameraRestartKey,
    drawOverlay,
    requestCameraRestart,
    stopCamera,
  ])

  useEffect(() => {
    const clearRestartTimer = () => {
      if (
        cameraRestartTimerRef.current ===
        null
      ) {
        return
      }

      window.clearTimeout(
        cameraRestartTimerRef.current,
      )

      cameraRestartTimerRef.current =
        null
    }

    const clearSuspendTimer = () => {
      if (
        cameraLifecycleSuspendTimerRef
          .current === null
      ) {
        return
      }

      window.clearTimeout(
        cameraLifecycleSuspendTimerRef
          .current,
      )

      cameraLifecycleSuspendTimerRef.current =
        null
    }

    const suspendCamera = (
      reason: string,
    ) => {
      cameraLifecycleSuspendedRef.current =
        true

      clearRestartTimer()
      clearSuspendTimer()
      stopCamera()
      setCameraSwitchBusy(true)
      setCameraState('opening')

      setCameraMessage(
        'دوربین موقتاً متوقف شده است.',
      )

      console.info(
        'IOS_CAMERA_LIFECYCLE_SUSPENDED',
        {
          reason,
          visibilityState:
            document.visibilityState,
        },
      )
    }

    const resumeCamera = (
      reason: string,
    ) => {
      clearSuspendTimer()

      if (
        document.visibilityState !==
        'visible'
      ) {
        return
      }

      if (
        !cameraLifecycleSuspendedRef.current
      ) {
        return
      }

      cameraLifecycleSuspendedRef.current =
        false

      console.info(
        'IOS_CAMERA_LIFECYCLE_RESUMING',
        {
          reason,
        },
      )

      requestCameraRestart()
    }

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        'hidden'
      ) {
        clearSuspendTimer()

        cameraLifecycleSuspendTimerRef.current =
          window.setTimeout(() => {
            cameraLifecycleSuspendTimerRef.current =
              null

            if (
              document.visibilityState ===
              'hidden'
            ) {
              suspendCamera(
                'visibility-hidden-debounced',
              )
            }
          }, 450)

        return
      }

      resumeCamera(
        'visibility-visible',
      )
    }

    const handlePageHide = () => {
      clearSuspendTimer()

      suspendCamera(
        'pagehide',
      )
    }

    const handlePageShow = (
      event: PageTransitionEvent,
    ) => {
      if (event.persisted) {
        cameraLifecycleSuspendedRef.current =
          true
      }

      resumeCamera(
        event.persisted
          ? 'pageshow-bfcache'
          : 'pageshow',
      )
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    window.addEventListener(
      'pagehide',
      handlePageHide,
    )

    window.addEventListener(
      'pageshow',
      handlePageShow,
    )

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )

      window.removeEventListener(
        'pagehide',
        handlePageHide,
      )

      window.removeEventListener(
        'pageshow',
        handlePageShow,
      )

      clearRestartTimer()
      clearSuspendTimer()
    }
  }, [
    requestCameraRestart,
    stopCamera,
  ])

  useEffect(() => {
    const stage = stageRef.current

    if (!stage) {
      return
    }

    const observer =
      typeof ResizeObserver !==
      'undefined'
        ? new ResizeObserver(() => {
            drawOverlay()
          })
        : null

    observer?.observe(stage)

    window.addEventListener(
      'orientationchange',
      drawOverlay,
    )

    return () => {
      observer?.disconnect()

      window.removeEventListener(
        'orientationchange',
        drawOverlay,
      )
    }
  }, [drawOverlay])

  // BESHMARAI_ANDROID_COUNTING_UI_V1_HANDLERS_BEGIN

  const toggleCountingTorch =
    useCallback(async () => {
      const track =
        streamRef.current
          ?.getVideoTracks()[0]

      if (!track) {
        setCameraMessage(
          'دوربین هنوز آماده نیست.',
        )

        return
      }

      const capabilities =
        typeof track.getCapabilities ===
        'function'
          ? (
              track.getCapabilities() as
                MediaTrackCapabilities & {
                  torch?: boolean
                }
            )
          : null

      if (!capabilities?.torch) {
        setCountingTorchAvailable(false)
        setCountingTorchEnabled(false)

        setCameraMessage(
          'این دستگاه امکان کنترل فلش را ندارد.',
        )

        return
      }

      const nextEnabled =
        !countingTorchEnabled

      const torchConstraint =
        ({
          torch: nextEnabled,
        } as unknown) as
          MediaTrackConstraintSet

      try {
        await track.applyConstraints({
          advanced: [
            torchConstraint,
          ],
        })

        setCountingTorchAvailable(true)

        setCountingTorchEnabled(
          nextEnabled,
        )

        setCameraMessage(
          nextEnabled
            ? 'فلش روشن شد.'
            : 'فلش خاموش شد.',
        )
      } catch {
        setCountingTorchEnabled(false)

        setCameraMessage(
          'کنترل فلش در این مرورگر در دسترس نیست.',
        )
      }
    }, [
      countingTorchEnabled,
    ])

  const setCountingCameraZoom =
    useCallback(
      async (
        level: 1 | 2 | 3,
      ) => {
        const track =
          streamRef.current
            ?.getVideoTracks()[0]

        if (!track) {
          setCameraMessage(
            'دوربین هنوز آماده نیست.',
          )

          return
        }

        const capabilities =
          typeof track.getCapabilities ===
          'function'
            ? (
                track.getCapabilities() as
                  MediaTrackCapabilities & {
                    zoom?: {
                      min?: number
                      max?: number
                    }
                  }
              )
            : null

        const zoomCapability =
          capabilities?.zoom

        if (!zoomCapability) {
          setCountingZoomAvailable(false)

          setCameraMessage(
            'زوم سخت‌افزاری روی این دستگاه در دسترس نیست.',
          )

          return
        }

        const minimumZoom =
          typeof zoomCapability.min ===
          'number'
            ? zoomCapability.min
            : 1

        const maximumZoom =
          typeof zoomCapability.max ===
          'number'
            ? zoomCapability.max
            : 3

        const requestedZoom =
          Math.min(
            maximumZoom,
            Math.max(
              minimumZoom,
              level,
            ),
          )

        const zoomConstraint =
          ({
            zoom: requestedZoom,
          } as unknown) as
            MediaTrackConstraintSet

        try {
          await track.applyConstraints({
            advanced: [
              zoomConstraint,
            ],
          })

          setCountingZoomAvailable(true)
          setCountingZoomLevel(level)

          setCameraMessage(
            'زوم x' +
            level.toString() +
            ' فعال شد.',
          )
        } catch {
          setCameraMessage(
            'اعمال زوم روی این دوربین ممکن نیست.',
          )
        }
      },
      [],
    )

  useEffect(() => {
    if (
      cameraState !== 'ready' ||
      previewModelState !== 'ready'
    ) {
      previewAutoStartedRef.current =
        false

      return
    }

    if (
      previewLiveEnabled ||
      previewAutoStartedRef.current
    ) {
      return
    }

    previewAutoStartedRef.current =
      true

    togglePreviewLive()
  }, [
    cameraState,
    previewModelState,
    previewLiveEnabled,
    togglePreviewLive,
  ])

  // BESHMARAI_ANDROID_COUNTING_UI_V1_HANDLERS_END
  function handleOpenSettings() {
    accurateRunTokenRef.current += 1
    accuratePreviewWasLiveRef.current = false
    accurateCountBusyRef.current = false
    setAccurateCountBusy(false)
    clearCapturedPreview()
    stopCamera()
    onOpenSettings()
  }

  function handleBack() {
    accurateRunTokenRef.current += 1

    accuratePreviewWasLiveRef.current =
      false

    accurateCountBusyRef.current =
      false

    setAccurateCountBusy(false)
    clearCapturedPreview()
    stopCamera()
    onBack()
  }

  return (
    <main
      className="camera-shell"
      dir="rtl"
    >
      <header className="camera-header">
        <button
          className="camera-header-button"
          type="button"
          onClick={handleBack}
          aria-label="بازگشت به منو"
        >
          بازگشت
        </button>

        <div className="camera-title-block">
          <img
            className="camera-header-logo"
            src={`${import.meta.env.BASE_URL}assets/qorshshomar-logo.png`}
            alt="قرص‌شمار BeshmarAI"
          />
        </div>

        <div
          className={
            `camera-status-pill ` +
            `camera-status-${cameraState}`
          }
          role="status"
          aria-live="polite"
        >
          <span className="camera-status-dot" />
          {cameraMessage}
        </div>

      </header>

      <section
        ref={stageRef}
        className="camera-stage"
        aria-label="نمای زنده دوربین"
      >
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          muted
          playsInline
          onLoadedMetadata={drawOverlay}
        />

        <canvas
          ref={canvasRef}
          className="camera-overlay"
          aria-label="کادر قابل تنظیم شمارش"
          onPointerDown={
            handleRoiPointerDown
          }
          onPointerMove={
            handleRoiPointerMove
          }
          onPointerUp={
            finishRoiInteraction
          }
          onPointerCancel={
            finishRoiInteraction
          }
          onContextMenu={(event) =>
            event.preventDefault()
          }
        />
        <canvas
          ref={detectionCanvasRef}
          className="camera-detection-overlay"
          aria-hidden="true"
        />

        {cameraState === 'opening' && (
          <div className="camera-loading">
            <img
              src={`${import.meta.env.BASE_URL}assets/robot-loading.gif`}
              alt=""
            />

            <div className="camera-loading-copy">
              <strong>{cameraMessage}</strong>

              <p>{cameraOpeningDetail}</p>
            </div>

            <div
              className="camera-opening-progress"
              role="progressbar"
              aria-label="پیشرفت آماده‌سازی دوربین و هوش مصنوعی"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                cameraOpeningProgress
              }
            >
              <span
                className="camera-opening-progress-value"
                style={{
                  width: `${cameraOpeningProgress}%`,
                }}
              />
            </div>

            <span className="camera-opening-progress-label">
              {cameraOpeningProgress.toLocaleString(
                'fa-IR',
              )}
              ٪
            </span>
          </div>
        )}

        {cameraState === 'error' && (
          <div className="camera-error-panel">
            <strong>دوربین باز نشد</strong>

            <p>{cameraMessage}</p>

            <button
              className="camera-retry-button"
              type="button"
              onClick={() => {
                cameraLifecycleSuspendedRef.current =
                  false

                console.info(
                  'UNIVERSAL_CAMERA_MANUAL_RETRY',
                )

                requestCameraRestart()
              }}
            >
              تلاش دوباره
            </button>
          </div>
        )}

        {/* BESHMARAI_CAMERA_STAGE_GLASS_CONTROLS_V11_BEGIN */}
        <div
          className="camera-stage-controls"
          aria-label="کنترل‌های دوربین روی تصویر"
        >
          <div className="camera-stage-top-controls">
          <div className="camera-count-badge">
            <span
              className="camera-plan-badge"
              aria-label="نسخه عمومی رایگان"
            >
              {menuAccessBadgeText()}
            </span>

            <div className="camera-count-value">
              <span>تعداد قرص:</span>

              <strong>
                {previewDetectionCount
                  .toLocaleString('fa-IR')}
              </strong>
            </div>
          </div>
          <button
            className="camera-settings-button"
            type="button"
            onClick={handleOpenSettings}
            aria-label="باز کردن تنظیمات"
          >
            <span aria-hidden="true">⚙</span>
            <strong>تنظیمات</strong>
          </button>

          </div>

          <div
            className="camera-zoom-row"
            aria-label="انتخاب زوم"
          >
            <button
              className={
                countingZoomLevel === 1
                  ? 'camera-zoom-button is-active'
                  : 'camera-zoom-button'
              }
              type="button"
              disabled={
                cameraState !== 'ready' ||
                !countingZoomAvailable
              }
              onClick={() => {
                void setCountingCameraZoom(1)
              }}
            >
              x1
            </button>

            <button
              className={
                countingZoomLevel === 2
                  ? 'camera-zoom-button is-active'
                  : 'camera-zoom-button'
              }
              type="button"
              disabled={
                cameraState !== 'ready' ||
                !countingZoomAvailable
              }
              onClick={() => {
                void setCountingCameraZoom(2)
              }}
            >
              x2
            </button>

            <button
              className={
                countingZoomLevel === 3
                  ? 'camera-zoom-button is-active'
                  : 'camera-zoom-button'
              }
              type="button"
              disabled={
                cameraState !== 'ready' ||
                !countingZoomAvailable
              }
              onClick={() => {
                void setCountingCameraZoom(3)
              }}
            >
              x3
            </button>

          </div>

        </div>
        {/* BESHMARAI_CAMERA_STAGE_GLASS_CONTROLS_V11_END */}

      </section>

      <section
        className="camera-bottom-panel"
        aria-label="کنترل‌های شمارش"
      >
        <div className="camera-controls-row">
          <button
            className={
              countingTorchEnabled
                ? 'camera-side-control camera-flash-control is-active'
                : 'camera-side-control camera-flash-control'
            }
            type="button"
            disabled={
              cameraState !== 'ready' ||
              !countingTorchAvailable
            }
            aria-label={
              countingTorchEnabled
                ? 'خاموش کردن فلش'
                : 'روشن کردن فلش'
            }
            aria-pressed={countingTorchEnabled}
            onClick={() => {
              void toggleCountingTorch()
            }}
          >
            <span aria-hidden="true">
              ϟ
            </span>
          </button>

          <button
            className={
              accurateCountBusy
                ? 'accurate-count-button is-running'
                : 'accurate-count-button'
            }
            type="button"
            disabled={
              cameraState !== 'ready' ||
              accurateCountBusy
            }
            aria-busy={accurateCountBusy}
            onClick={() => {
              void captureCurrentRoi()
            }}
          >
            <span
              className="accurate-scan-icon"
              aria-hidden="true"
            />

            <span className="accurate-count-label">
              {accurateCountBusy
                ? 'در حال شمارش...'
                : 'شمارش دقیق'}
            </span>
          </button>

          <button
            className="camera-side-control camera-help-control"
            type="button"
            aria-label="راهنمای شمارش"
            onClick={() => {
              const guideMessage =
                'قرص‌ها را داخل محدوده قرار دهید و شمارش دقیق را بزنید.'

              setRoiHelpText(
                guideMessage,
              )

              setCameraMessage(
                guideMessage,
              )
            }}
          >
            <span aria-hidden="true">
              ؟
            </span>
          </button>
        </div>

        <div
          className="camera-runtime-status"
          data-preview-state={
            previewFrameTestState
          }
          role="status"
          aria-live="polite"
        >
          <span>{previewModelMessage}</span>
          <span>{previewFrameTestMessage}</span>
          <span>{roiHelpText}</span>
          <span>{captureMessage}</span>
        </div>
      </section>

      {capturedPreview && (
        <div
          className={
            accurateCountBusy
              ? 'roi-preview-backdrop is-scanning'
              : accurateCountError
                ? 'roi-preview-backdrop is-error'
                : 'roi-preview-backdrop'
          }
          role="dialog"
          aria-modal="true"
          aria-label={
            accurateCountBusy
              ? 'در حال اسکن و شمارش دقیق'
              : accurateCountError
                ? 'خطای شمارش دقیق'
                : 'نتیجه شمارش دقیق'
          }
          onClick={() => {
            if (!accurateCountBusy) {
              closeCapturedPreview()
            }
          }}
        >
          <section
            className={
              accurateCountBusy
                ? 'roi-preview-card is-scanning'
                : accurateCountError
                  ? 'roi-preview-card is-error'
                  : 'roi-preview-card is-complete'
            }
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <header className="roi-preview-header">
              <div>
                <strong>
                  {accurateCountBusy
                    ? 'در حال شمارش دقیق'
                    : accurateCountError
                      ? 'شمارش دقیق ناموفق'
                      : 'نتیجه شمارش دقیق'}
                </strong>

                <span>
                  {accurateCountBusy
                    ? 'تصویر ثابت شده و مدل ۱۵۳۶ در حال پردازش است'
                    : accurateCountError
                      ? 'تصویر ثابت برای بررسی و تلاش دوباره حفظ شده است'
                      : 'مدل نهایی ۱۵۳۶ پیکسل'}
                </span>
              </div>

              <button
                type="button"
                disabled={accurateCountBusy}
                onClick={closeCapturedPreview}
                aria-label="بستن نتیجه شمارش دقیق"
              >
                ×
              </button>
            </header>

            <div
              className={
                accurateResultZoom.scale > 1
                  ? 'roi-preview-image-frame accurate-result-viewer-shell is-zoomed'
                  : 'roi-preview-image-frame accurate-result-viewer-shell'
              }
            >
              <div
                ref={accurateResultViewerRef}
                className="accurate-result-zoom-viewer"
                role="img"
                aria-label={
                  accurateCountBusy
                    ? 'تصویر ثابت در حال اسکن'
                    : accurateCountError
                      ? 'تصویر ثابت شمارش ناموفق'
                      : 'تصویر نتیجه؛ با دو انگشت زوم کنید و تصویر را بکشید'
                }
                onPointerDown={
                  handleAccurateResultPointerDown
                }
                onPointerMove={
                  handleAccurateResultPointerMove
                }
                onPointerUp={
                  handleAccurateResultPointerUp
                }
                onPointerCancel={
                  handleAccurateResultPointerCancel
                }
                onWheel={
                  handleAccurateResultWheel
                }
                onContextMenu={(event) => {
                  event.preventDefault()
                }}
              >
                {accurateCountBusy && (
                  <img
                    className="accurate-frozen-preview-image"
                    src={capturedPreview.url}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                  />
                )}

                <svg
                  className={
                    accurateCountBusy
                      ? 'accurate-result-zoom-surface is-waiting'
                      : 'accurate-result-zoom-surface'
                  }
                  viewBox={
                    `0 0 ` +
                    `${capturedPreview.width} ` +
                    `${capturedPreview.height}`
                  }
                  preserveAspectRatio="xMidYMid meet"
                  style={{
                    transform:
                      `translate3d(` +
                      `${accurateResultZoom.x}px, ` +
                      `${accurateResultZoom.y}px, 0) ` +
                      `scale(${accurateResultZoom.scale})`,
                  }}
                  aria-hidden="true"
                >
                  <image
                    href={capturedPreview.url}
                    x="0"
                    y="0"
                    width={capturedPreview.width}
                    height={capturedPreview.height}
                    preserveAspectRatio="none"
                  />

                  {!accurateCountBusy &&
                    !accurateCountError &&
                    accurateResultViewerSize.width >
                      0 &&
                    accurateResultViewerSize.height >
                      0 &&
                    capturedPreview.detections.map(
                      (detection, index) => {
                        const centerX =
                          (
                            detection.x1 +
                            detection.x2
                          ) / 2

                        const centerY =
                          (
                            detection.y1 +
                            detection.y2
                          ) / 2

                        const displayScale =
                          Math.max(
                            0.0001,
                            Math.min(
                              accurateResultViewerSize.width /
                                capturedPreview.width,
                              accurateResultViewerSize.height /
                                capturedPreview.height,
                            ),
                          )

                        /*
                         * Android parity:
                         * dotScale = clamp(
                         *   1 / sqrt(zoom),
                         *   0.45,
                         *   1,
                         * )
                         *
                         * SVG داخل یک سطح زوم‌شده است؛
                         * بنابراین مقیاس محلی باید اثر
                         * زوم والد را نیز خنثی کند.
                         */
                        const androidDotScale =
                          clampNumber(
                            1 /
                              Math.sqrt(
                                accurateResultZoom.scale,
                              ),
                            0.45,
                            1,
                          )

                        // BESHMARAI_ACCURATE_RESULT_MARKER_SMALLER_SAFE_V1
                        // BESHMARAI_ACCURATE_RESULT_MARKER_PLUS10_NO_NUMBERS_V1
                        const markerUnitScale =
                          (
                            androidDotScale *
                            0.22
                          ) /
                          (
                            displayScale *
                            accurateResultZoom.scale
                          )

                        return (
                          <g
                            className="accurate-result-pill-marker"
                            key={
                              `${index}-` +
                              `${detection.x1}-` +
                              `${detection.y1}`
                            }
                            transform={
                              `translate(` +
                              `${centerX} ` +
                              `${centerY}) ` +
                              `scale(` +
                              `${markerUnitScale})`
                            }
                          >
                            <circle
                              className="accurate-result-pill-glow"
                              cx="0"
                              cy="0"
                              r="25"
                            />

                            <circle
                              className="accurate-result-pill-dot"
                              cx="0"
                              cy="0"
                              r="15"
                            />

                            <circle
                              className="accurate-result-pill-ring"
                              cx="0"
                              cy="0"
                              r="18"
                            />

                          </g>
                        )
                      },
                    )}
                </svg>

                {accurateCountBusy && (
                  <>
                    <div
                      className="accurate-freeze-scan-layer"
                      aria-hidden="true"
                    >
                      <span className="accurate-freeze-scan-glow" />
                      <span className="accurate-freeze-scan-beam" />
                    </div>

                    <div
                      className="accurate-freeze-scan-status"
                      role="status"
                      aria-live="polite"
                    >
                      <span
                        className="accurate-freeze-pulse-dot"
                        aria-hidden="true"
                      />

                      <strong>
                        در حال اسکن تصویر
                      </strong>

                      <small>
                        {captureMessage}
                      </small>
                    </div>
                  </>
                )}

                {!accurateCountBusy &&
                  accurateCountError && (
                    <div
                      className="accurate-freeze-error-status"
                      role="alert"
                    >
                      <strong>
                        شمارش کامل نشد
                      </strong>

                      <span>
                        {accurateCountError}
                      </span>
                    </div>
                  )}

                {!accurateCountBusy &&
                  !accurateCountError && (
                    <>
                      <div
                        className="accurate-result-zoom-controls"
                        dir="ltr"
                        onPointerDown={(event) => {
                          event.stopPropagation()
                        }}
                        onPointerMove={(event) => {
                          event.stopPropagation()
                        }}
                        onPointerUp={(event) => {
                          event.stopPropagation()
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            accurateResultZoom.scale <=
                            1.001
                          }
                          onClick={() => {
                            changeAccurateResultZoom(
                              1 / 1.35,
                            )
                          }}
                          aria-label="کوچک‌نمایی تصویر"
                        >
                          −
                        </button>

                        <output>
                          {Math.round(
                            accurateResultZoom.scale *
                              100,
                          ).toLocaleString(
                            'fa-IR',
                          )}
                          ٪
                        </output>

                        <button
                          type="button"
                          disabled={
                            accurateResultZoom.scale >=
                            4.999
                          }
                          onClick={() => {
                            changeAccurateResultZoom(
                              1.35,
                            )
                          }}
                          aria-label="بزرگ‌نمایی تصویر"
                        >
                          +
                        </button>

                        <button
                          className="accurate-result-reset-button"
                          type="button"
                          disabled={
                            accurateResultZoom.scale <=
                            1.001
                          }
                          onClick={
                            resetAccurateResultZoom
                          }
                        >
                          ۱:۱
                        </button>
                      </div>

                      <div
                        className="accurate-result-zoom-hint"
                        aria-hidden="true"
                      >
                        دو انگشت برای زوم · کشیدن برای جابه‌جایی · دوبار لمس برای بازنشانی
                      </div>
                    </>
                  )}
              </div>
            </div>
            {accurateCountBusy && (
              <div className="accurate-scan-wait-panel">
                <span
                  className="accurate-scan-wait-spinner"
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    در حال تحلیل قرص‌ها
                  </strong>

                  <span>
                    لطفاً چند لحظه صبر کنید و صفحه را نبندید.
                  </span>
                </div>
              </div>
            )}

            {!accurateCountBusy &&
              !accurateCountError && (
                <>
                  <div className="accurate-result-summary">
                    <div>
                      <span>تعداد دقیق</span>

                      <strong>
                        {capturedPreview.count
                          .toLocaleString('fa-IR')}
                      </strong>
                    </div>

                    {/* BESHMARAI_ACCURATE_TIMING_SUMMARY_VISIBLE_V1 */}
                    <div>
                      <span>آماده‌سازی</span>

                      <strong>
                        {Math.round(
                          capturedPreview.preprocessMs,
                        ).toLocaleString('fa-IR')}
                        {' ms'}
                      </strong>
                    </div>

                    <div>
                      <span>ساخت موتور</span>

                      <strong>
                        {Math.round(
                          capturedPreview.sessionCreateMs,
                        ).toLocaleString('fa-IR')}
                        {' ms'}
                      </strong>
                    </div>

                    <div>
                      <span>آماده‌سازی runtime</span>

                      <strong>
                        {Math.round(
                          capturedPreview.runtimePrepareMs,
                        ).toLocaleString('fa-IR')}
                        {' ms'}
                      </strong>
                    </div>

                    <div>
                      <span>مدل</span>

                      <strong>
                        {Math.round(
                          capturedPreview.inferenceMs,
                        ).toLocaleString('fa-IR')}
                        {' ms'}
                      </strong>
                    </div>

                    <div>
                      <span>پردازش نتیجه</span>

                      <strong>
                        {Math.round(
                          capturedPreview.postprocessMs,
                        ).toLocaleString('fa-IR')}
                        {' ms'}
                      </strong>
                    </div>

                    <div>
                      <span>کل</span>

                      <strong>
                        {Math.round(
                          capturedPreview.totalMs,
                        ).toLocaleString('fa-IR')}
                        {' ms'}
                      </strong>
                    </div>

                    <div>
                      <span>پردازنده</span>

                      <strong>
                        {capturedPreview
                          .executionProvider ===
                        'webgpu'
                          ? 'WebGPU'
                          : 'WASM'}
                      </strong>
                    </div>
                  </div>

                  <div className="roi-preview-meta">
                    <span>
                      ابعاد تصویر
                    </span>

                    <strong>
                      {capturedPreview.width}
                      {' × '}
                      {capturedPreview.height}
                      {' پیکسل'}
                    </strong>
                  </div>

                  <p className="roi-preview-description">
                    دایره‌های فیروزه‌ای محل قرص‌های
                    شمرده‌شده را مشخص می‌کنند. با زوم
                    و جابه‌جایی، نتیجه را کامل بررسی کنید.
                  </p>
                </>
              )}

            {!accurateCountBusy &&
              accurateCountError && (
                <p className="roi-preview-description accurate-error-description">
                  تصویر ثابت باقی مانده است. شرایط نور،
                  فاصله و فوکوس را اصلاح کنید و دوباره
                  شمارش را اجرا کنید.
                </p>
              )}

            {/* BESHMARAI_ACCURATE_RESULT_ACTIONS_MARKER_SIZE_V2 */}
            {!accurateCountBusy && (
              <div className="roi-preview-actions">
                <button
                  className="roi-preview-secondary"
                  type="button"
                  onClick={closeCapturedPreview}
                >
                  بازگشت
                </button>
              </div>
            )}
          </section>
        </div>
      )}    </main>
  )
}

// BESHMARAI_PUBLIC_FREE_NO_TRIAL_NOTICE_V1


// BESHMARAI_MENU_STATUS_BOXES_V1_HELPERS_BEGIN
// BESHMARAI_PUBLIC_FREE_ACCESS_CONTRACT_V1

type MenuAccessStatus = {
  can_count: true
  reason: 'public_free'
}

const PUBLIC_ACCESS_STATUS:
  MenuAccessStatus = {
    can_count: true,
    reason: 'public_free',
  }

function menuTrialActive(
  _status: MenuAccessStatus | null,
  _nowMs = Date.now(),
): boolean {
  return false
}

function menuCanCount(
  _status: MenuAccessStatus | null,
  _nowMs = Date.now(),
): boolean {
  return true
}

function menuSubscriptionText(
  _status: MenuAccessStatus | null,
  _nowMs = Date.now(),
): string {
  return 'عمومی رایگان'
}

function menuTrialRemainingText(
  _status: MenuAccessStatus | null,
  _nowMs = Date.now(),
): string {
  return 'بدون محدودیت'
}

function menuAccessText(
  _status: MenuAccessStatus | null,
  _nowMs = Date.now(),
): string {
  return 'فعال'
}

function menuAccessBadgeText(): string {
  return 'نسخه رایگان'
}

// BESHMARAI_MENU_STATUS_BOXES_V1_HELPERS_END

function App() {

  // BESHMARAI_PUBLIC_FREE_NO_TRIAL_STATE_V1


  // BESHMARAI_MENU_STATUS_BOXES_V1_STATE_BEGIN
  // BESHMARAI_PUBLIC_FREE_ACCESS_STATE_V1

  const menuAccessStatus =
    PUBLIC_ACCESS_STATUS

  const menuNowMs = 0

  // BESHMARAI_MENU_STATUS_BOXES_V1_STATE_END
  const [screen, setScreen] =
    useState<AppScreen>('menu')

  const [settingsReturnScreen, setSettingsReturnScreen] =
    useState<'menu' | 'camera'>('menu')

  const [message, setMessage] = useState(
    'نسخه پایه وب با موفقیت آماده شده است.',
  )

  if (screen === 'camera') {
    return (
      <>
        <CameraScreen
          onBack={() => setScreen('menu')}
          onOpenSettings={() => {
            setSettingsReturnScreen(
              'camera',
            )
            setScreen('settings')
          }}
        />
      </>
    )
  }

  if (screen === 'settings') {
    return (
      <>
        <SettingsScreen
          onBack={() =>
            setScreen(
              settingsReturnScreen,
            )
          }
        />
      </>
    )
  }

  function handleStartCounting() {
    setMessage(
      'در حال ورود به دوربین شمارش...',
    )

    setScreen(
      'camera',
    )
  }


  return (
    <main
      className="app-shell"
      dir="rtl"
    >
      <div className="background-image" />
      <div className="background-shade" />

      <section className="screen-content">
        <header className="top-header">
          <img
            className="brand-logo"
            src={`${import.meta.env.BASE_URL}assets/qorshshomar-logo.png`}
            alt="قرص‌شمار BeshmarAI"
          />
        </header>

        {/* BESHMARAI_MENU_STATUS_BOXES_V1_JSX_BEGIN */}

        <section
          className="menu-status-row"
          aria-label="وضعیت نسخه عمومی"
        >
          <article
            className={
              menuTrialActive(
                menuAccessStatus,
                menuNowMs,
              )
                ? 'menu-status-box menu-status-box-gold'
                : 'menu-status-box'
            }
          >
            <strong className="menu-status-title">
              نوع دسترسی
            </strong>

            <span className="menu-status-value">
              {menuSubscriptionText(
                menuAccessStatus,
                menuNowMs,
              )}
            </span>

            <span
              className="menu-status-icon"
              aria-hidden="true"
            >
              ♛
            </span>
          </article>

          <article className="menu-status-box">
            <strong className="menu-status-title">
              محدودیت زمانی
            </strong>

            <span
              className="menu-status-value"
              role="timer"
              aria-live="off"
            >
              {menuTrialRemainingText(
                menuAccessStatus,
                menuNowMs,
              )}
            </span>

            <span
              className="menu-status-icon"
              aria-hidden="true"
            >
              ◷
            </span>
          </article>

          <article className="menu-status-box">
            <strong className="menu-status-title">
              دسترسی شمارش
            </strong>

            <span className="menu-status-value">
              {menuAccessText(
                menuAccessStatus,
                menuNowMs,
              )}
            </span>

            <span
              className="menu-status-icon"
              aria-hidden="true"
            >
              {menuCanCount(
                menuAccessStatus,
                menuNowMs,
              )
                ? '✓'
                : '!'}
            </span>
          </article>
        </section>

        {/* BESHMARAI_MENU_STATUS_BOXES_V1_JSX_END */}

        <section className="hero-card">
          <img
            className="hero-image"
            src={`${import.meta.env.BASE_URL}assets/menu-hero.png`}
            alt=""
          />

          <button
            className="primary-button hero-start-button"
            type="button"
            onClick={handleStartCounting}
          >
            <span className="button-arrow">
              ➜
            </span>

            <span>شروع شمارش</span>
          </button>
        </section>

        {/* BESHMARAI_ANDROID_MENU_CARDS_V1 */}

        <section
          className="menu-grid"
          aria-label="منوی اصلی"
        >
          <button
            className="menu-card"
            type="button"
            onClick={() => {
              setMessage(
                'راهنمای شمارش: قرص‌ها را جدا از هم، زیر نور یکنواخت و داخل کادر قرار دهید.',
              )
            }}
          >
            <span
              className="menu-icon"
              aria-hidden="true"
            >
              📖
            </span>

            <span className="menu-card-title">
              راهنمای شمارش
            </span>

            <span className="menu-card-subtitle">
              آموزش گام به گام
            </span>
          </button>

          <button
            className="menu-card menu-card-gold"
            type="button"
            onClick={() => {
              setMessage(
                'برای نصب، گزینه Add to Home Screen یا نصب برنامه را از منوی مرورگر انتخاب کنید.',
              )
            }}
          >
            <span
              className="menu-icon"
              aria-hidden="true"
            >
              ♛
            </span>

            <span className="menu-card-title">
              راهنمای نصب برنامه
            </span>

            <span className="menu-card-subtitle">
              افزودن به صفحه اصلی
            </span>
          </button>

          <button
            className="menu-card"
            type="button"
            onClick={() => {
              setSettingsReturnScreen(
                'menu',
              )
              setScreen('settings')
            }}
          >
            <span
              className="menu-icon"
              aria-hidden="true"
            >
              ⚙
            </span>

            <span className="menu-card-title">
              تنظیمات
            </span>

            <span className="menu-card-subtitle">
              دوربین و دقت شمارش
            </span>
          </button>

          <button
            className="menu-card"
            type="button"
            onClick={() => {
              window.open(
                'https://beshmarai.ir',
                '_blank',
                'noopener,noreferrer',
              )
            }}
          >
            <span
              className="menu-icon"
              aria-hidden="true"
            >
              🌐
            </span>

            <span className="menu-card-title">
              سایت
            </span>

            <span className="menu-card-subtitle">
              وب‌سایت رسمی
            </span>
          </button>

          <button
            className="menu-card"
            type="button"
            onClick={() => {
              setMessage(
                'پاسخ مشکلات رایج: نور، فاصله دوربین، تمیزی لنز و جدا بودن قرص‌ها را بررسی کنید.',
              )
            }}
          >
            <span
              className="menu-icon"
              aria-hidden="true"
            >
              ؟
            </span>

            <span className="menu-card-title">
              سوالات متداول
            </span>

            <span className="menu-card-subtitle">
              پاسخ مشکلات رایج
            </span>
          </button>

          <button
            className="menu-card"
            type="button"
            onClick={() => {
              setMessage(
                'برای شروع دوباره، صفحه را بازخوانی کنید. تنظیمات شمارش از بخش تنظیمات قابل بازگردانی است.',
              )
            }}
          >
            <span
              className="menu-icon"
              aria-hidden="true"
            >
              ↪
            </span>

            <span className="menu-card-title">
              پاک‌کردن پیام‌های برنامه
            </span>

            <span className="menu-card-subtitle">
              تنظیم مجدد رابط
            </span>
          </button>

          <button
            className="menu-card"
            type="button"
            onClick={() => {
              window.location.href =
                'tel:09213314813'
            }}
          >
            <span
              className="menu-icon"
              aria-hidden="true"
            >
              🎧
            </span>

            <span className="menu-card-title">
              پشتیبانی
            </span>

            <span className="menu-card-subtitle">
              تماس تلفنی
            </span>
          </button>
        </section>

        <p
          className="system-message"
          role="status"
        >
          {message}
        </p>

        <footer>
          <strong>{brand.englishName}</strong>
          <span>{brand.domain}</span>
        </footer>
      </section>
    </main>
  )
}

export default App