// BESHMARAI_PUBLIC_STATIC_MODEL_LOADER_V1

export type AiModelId =
  | 'preview'
  | 'final'

export type AiPersistentModelProgress = {
  loadedBytes: number
  totalBytes: number
  percent: number
  message: string
}

export type AiDownloadProgress = {
  loadedBytes: number
  totalBytes: number
  percent: number
  currentLabel: string
  fromCache: boolean
}

type PublicModelPart = {
  path: string
  bytes: number
  sha256: string
}

type PublicModelDescriptor = {
  id: AiModelId
  label: string
  bytes: number
  sha256: string
  parts: PublicModelPart[]
}

type PublicModelManifest = {
  marker: 'BESHMARAI_PUBLIC_MODEL_MANIFEST_V1'
  version: 1
  models: PublicModelDescriptor[]
}

const cacheName =
  'beshmarai-public-models-v1'

const manifestRelativePath =
  'models/public-v1/manifest.json'

export const AI_TOTAL_BYTES =
  2_674_908 + 80_805_153

let manifestPromise:
  Promise<PublicModelManifest> | null =
    null

function baseUrl(): string {
  const value =
    import.meta.env.BASE_URL || '/'

  return value.endsWith('/')
    ? value
    : `${value}/`
}

function publicUrl(
  relativePath: string,
): string {
  const normalized =
    relativePath.replace(/^\/+/, '')

  return new URL(
    `${baseUrl()}${normalized}`,
    window.location.origin,
  ).href
}

function arrayBufferFromView(
  bytes: Uint8Array,
): ArrayBuffer {
  if (
    bytes.byteOffset === 0 &&
    bytes.byteLength ===
      bytes.buffer.byteLength
  ) {
    return bytes.buffer as ArrayBuffer
  }

  return bytes.slice().buffer
}

async function sha256Hex(
  bytes: Uint8Array,
): Promise<string> {
  const digest =
    await crypto.subtle.digest(
      'SHA-256',
      arrayBufferFromView(bytes),
    )

  return Array.from(
    new Uint8Array(digest),
    (value) =>
      value
        .toString(16)
        .padStart(2, '0'),
  )
    .join('')
    .toUpperCase()
}

function assertDescriptor(
  descriptor:
    PublicModelDescriptor,
): void {
  if (
    descriptor.id !== 'preview' &&
    descriptor.id !== 'final'
  ) {
    throw new Error(
      'PUBLIC_MODEL_ID_INVALID',
    )
  }

  if (
    !Number.isInteger(
      descriptor.bytes,
    ) ||
    descriptor.bytes <= 0 ||
    !/^[A-F0-9]{64}$/i.test(
      descriptor.sha256,
    ) ||
    !Array.isArray(
      descriptor.parts,
    ) ||
    descriptor.parts.length <= 0
  ) {
    throw new Error(
      `PUBLIC_MODEL_DESCRIPTOR_INVALID=${descriptor.id}`,
    )
  }

  const partsBytes =
    descriptor.parts.reduce(
      (sum, part) =>
        sum + part.bytes,
      0,
    )

  if (
    partsBytes !==
    descriptor.bytes
  ) {
    throw new Error(
      `PUBLIC_MODEL_PART_SIZE_SUM_INVALID=${descriptor.id}`,
    )
  }

  for (
    const part of
    descriptor.parts
  ) {
    if (
      !part.path ||
      part.path.startsWith('/') ||
      part.path.includes('..') ||
      !Number.isInteger(
        part.bytes,
      ) ||
      part.bytes <= 0 ||
      !/^[A-F0-9]{64}$/i.test(
        part.sha256,
      )
    ) {
      throw new Error(
        `PUBLIC_MODEL_PART_INVALID=${descriptor.id}`,
      )
    }
  }
}

async function loadManifest():
  Promise<PublicModelManifest> {
  if (manifestPromise) {
    return manifestPromise
  }

  manifestPromise =
    (async () => {
      const response =
        await fetch(
          publicUrl(
            manifestRelativePath,
          ),
          {
            cache: 'no-store',
          },
        )

      if (!response.ok) {
        throw new Error(
          `PUBLIC_MODEL_MANIFEST_HTTP_${response.status}`,
        )
      }

      const manifest =
        await response.json() as
          PublicModelManifest

      if (
        manifest.marker !==
          'BESHMARAI_PUBLIC_MODEL_MANIFEST_V1' ||
        manifest.version !== 1 ||
        !Array.isArray(
          manifest.models,
        )
      ) {
        throw new Error(
          'PUBLIC_MODEL_MANIFEST_INVALID',
        )
      }

      for (
        const descriptor of
        manifest.models
      ) {
        assertDescriptor(
          descriptor,
        )
      }

      for (
        const requiredId of
        ['preview', 'final'] as const
      ) {
        if (
          !manifest.models.some(
            (model) =>
              model.id ===
              requiredId,
          )
        ) {
          throw new Error(
            `PUBLIC_MODEL_MISSING=${requiredId}`,
          )
        }
      }

      return manifest
    })()

  return manifestPromise
}

async function descriptorFor(
  id: AiModelId,
): Promise<PublicModelDescriptor> {
  const manifest =
    await loadManifest()

  const descriptor =
    manifest.models.find(
      (model) =>
        model.id === id,
    )

  if (!descriptor) {
    throw new Error(
      `PUBLIC_MODEL_MISSING=${id}`,
    )
  }

  return descriptor
}

async function readResponseBytes(
  response: Response,
  expectedBytes: number,
  onChunk?: (
    loadedBytes: number,
  ) => void,
): Promise<Uint8Array> {
  if (!response.body) {
    const bytes =
      new Uint8Array(
        await response.arrayBuffer(),
      )

    onChunk?.(
      bytes.byteLength,
    )

    return bytes
  }

  const reader =
    response.body.getReader()

  const chunks:
    Uint8Array[] = []

  let loadedBytes = 0

  while (true) {
    const result =
      await reader.read()

    if (result.done) {
      break
    }

    if (result.value) {
      chunks.push(
        result.value,
      )

      loadedBytes +=
        result.value.byteLength

      onChunk?.(
        loadedBytes,
      )

      if (
        loadedBytes >
        expectedBytes
      ) {
        throw new Error(
          'PUBLIC_MODEL_PART_TOO_LARGE',
        )
      }
    }
  }

  const result =
    new Uint8Array(
      loadedBytes,
    )

  let offset = 0

  for (const chunk of chunks) {
    result.set(
      chunk,
      offset,
    )

    offset +=
      chunk.byteLength
  }

  return result
}

async function validatePart(
  bytes: Uint8Array,
  part: PublicModelPart,
): Promise<void> {
  if (
    bytes.byteLength !==
    part.bytes
  ) {
    throw new Error(
      `PUBLIC_MODEL_PART_SIZE_INVALID=${part.path}`,
    )
  }

  const hash =
    await sha256Hex(bytes)

  if (
    hash !==
    part.sha256.toUpperCase()
  ) {
    throw new Error(
      `PUBLIC_MODEL_PART_HASH_INVALID=${part.path}`,
    )
  }
}

async function cachedPart(
  cache: Cache,
  part: PublicModelPart,
): Promise<Uint8Array | null> {
  const url =
    publicUrl(part.path)

  const response =
    await cache.match(url)

  if (!response) {
    return null
  }

  try {
    const bytes =
      new Uint8Array(
        await response.arrayBuffer(),
      )

    await validatePart(
      bytes,
      part,
    )

    return bytes
  } catch {
    await cache.delete(url)
    return null
  }
}

async function downloadPart(
  cache: Cache,
  part: PublicModelPart,
  onChunk?: (
    loadedBytes: number,
  ) => void,
): Promise<Uint8Array> {
  const url =
    publicUrl(part.path)

  const response =
    await fetch(
      url,
      {
        cache: 'no-store',
      },
    )

  if (!response.ok) {
    throw new Error(
      `PUBLIC_MODEL_PART_HTTP_${response.status}=${part.path}`,
    )
  }

  const bytes =
    await readResponseBytes(
      response,
      part.bytes,
      onChunk,
    )

  await validatePart(
    bytes,
    part,
  )

  await cache.put(
    url,
    new Response(
      bytes.slice(),
      {
        status: 200,
        headers: {
          'Content-Type':
            'application/octet-stream',
          'Content-Length':
            String(
              bytes.byteLength,
            ),
          'Cache-Control':
            'public, max-age=31536000, immutable',
          'X-BeshmarAI-Part-SHA256':
            part.sha256,
        },
      },
    ),
  )

  return bytes
}

type PartReadResult = {
  bytes: Uint8Array
  fromCache: boolean
}

async function readPart(
  cache: Cache,
  part: PublicModelPart,
  onChunk?: (
    loadedBytes: number,
  ) => void,
): Promise<PartReadResult> {
  const stored =
    await cachedPart(
      cache,
      part,
    )

  if (stored) {
    onChunk?.(
      stored.byteLength,
    )

    return {
      bytes: stored,
      fromCache: true,
    }
  }

  return {
    bytes:
      await downloadPart(
        cache,
        part,
        onChunk,
      ),
    fromCache: false,
  }
}

async function ensureModelParts(
  descriptor:
    PublicModelDescriptor,
  onProgress?: (
    input: {
      loadedBytes: number
      totalBytes: number
      percent: number
      currentLabel: string
      fromCache: boolean
      message: string
    },
  ) => void,
): Promise<void> {
  if (
    !window.isSecureContext ||
    !globalThis.crypto?.subtle ||
    !('caches' in window)
  ) {
    throw new Error(
      'PUBLIC_MODEL_SECURE_CONTEXT_REQUIRED',
    )
  }

  const cache =
    await caches.open(
      cacheName,
    )

  let completedBytes = 0

  for (
    let index = 0;
    index <
      descriptor.parts.length;
    index += 1
  ) {
    const part =
      descriptor.parts[index]

    let partLoaded = 0

    const result =
      await readPart(
        cache,
        part,
        (
          loadedBytes,
        ) => {
          partLoaded =
            loadedBytes

          const loaded =
            completedBytes +
            partLoaded

          onProgress?.({
            loadedBytes:
              loaded,
            totalBytes:
              descriptor.bytes,
            percent:
              Math.min(
                100,
                Math.round(
                  (
                    loaded /
                    descriptor.bytes
                  ) * 100,
                ),
              ),
            currentLabel:
              descriptor.label,
            fromCache: false,
            message:
              `در حال آماده‌سازی ${descriptor.label}؛ قطعه ${
                index + 1
              } از ${
                descriptor.parts.length
              }`,
          })
        },
      )

    completedBytes +=
      result.bytes.byteLength

    onProgress?.({
      loadedBytes:
        completedBytes,
      totalBytes:
        descriptor.bytes,
      percent:
        Math.min(
          100,
          Math.round(
            (
              completedBytes /
              descriptor.bytes
            ) * 100,
          ),
        ),
      currentLabel:
        descriptor.label,
      fromCache:
        result.fromCache,
      message:
        result.fromCache
          ? `${descriptor.label} از حافظه دستگاه بررسی شد.`
          : `${descriptor.label} روی دستگاه ذخیره شد.`,
    })
  }
}

export async function prepareAiModels(
  onProgress?: (
    progress:
      AiDownloadProgress,
  ) => void,
): Promise<void> {
  const descriptor =
    await descriptorFor(
      'preview',
    )

  await ensureModelParts(
    descriptor,
    (progress) => {
      onProgress?.({
        loadedBytes:
          progress.loadedBytes,
        totalBytes:
          progress.totalBytes,
        percent:
          progress.percent,
        currentLabel:
          progress.currentLabel,
        fromCache:
          progress.fromCache,
      })
    },
  )
}

export async function
prepareFinalModelForOfflineUse(
  onProgress?: (
    progress:
      AiPersistentModelProgress,
  ) => void,
): Promise<void> {
  const descriptor =
    await descriptorFor(
      'final',
    )

  await ensureModelParts(
    descriptor,
    (progress) => {
      onProgress?.({
        loadedBytes:
          progress.loadedBytes,
        totalBytes:
          progress.totalBytes,
        percent:
          progress.percent,
        message:
          progress.message,
      })
    },
  )
}

export async function getAiModelBytes(
  id: AiModelId,
): Promise<Uint8Array> {
  const descriptor =
    await descriptorFor(id)

  await ensureModelParts(
    descriptor,
  )

  const cache =
    await caches.open(
      cacheName,
    )

  const modelBytes =
    new Uint8Array(
      descriptor.bytes,
    )

  let offset = 0

  for (
    const part of
    descriptor.parts
  ) {
    const bytes =
      await cachedPart(
        cache,
        part,
      )

    if (!bytes) {
      throw new Error(
        `PUBLIC_MODEL_CACHE_READ_FAILED=${part.path}`,
      )
    }

    modelBytes.set(
      bytes,
      offset,
    )

    offset +=
      bytes.byteLength
  }

  if (
    offset !==
    descriptor.bytes
  ) {
    modelBytes.fill(0)

    throw new Error(
      `PUBLIC_MODEL_SIZE_INVALID=${id}`,
    )
  }

  const fullHash =
    await sha256Hex(
      modelBytes,
    )

  if (
    fullHash !==
    descriptor.sha256.toUpperCase()
  ) {
    modelBytes.fill(0)

    throw new Error(
      `PUBLIC_MODEL_HASH_INVALID=${id}`,
    )
  }

  return modelBytes
}
