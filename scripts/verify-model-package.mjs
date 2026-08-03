import {
  createHash,
} from 'node:crypto'
import {
  existsSync,
  readFileSync,
  statSync,
} from 'node:fs'
import {
  resolve,
} from 'node:path'

const root = resolve(import.meta.dirname, '..')
const publicRoot = resolve(
  root,
  'apps/web/public',
)
const manifestPath = resolve(
  publicRoot,
  'models/public-v1/manifest.json',
)

function fail(message) {
  throw new Error(message)
}

function sha256(path) {
  return createHash('sha256')
    .update(readFileSync(path))
    .digest('hex')
    .toUpperCase()
}

if (!existsSync(manifestPath)) {
  fail(
    'PUBLIC_MODEL_MANIFEST_MISSING. Run the Stage 2 PowerShell model packaging script.',
  )
}

const manifest = JSON.parse(
  readFileSync(manifestPath, 'utf8'),
)

if (
  manifest.marker !==
    'BESHMARAI_PUBLIC_MODEL_MANIFEST_V1' ||
  manifest.version !== 1 ||
  !Array.isArray(manifest.models)
) {
  fail('PUBLIC_MODEL_MANIFEST_INVALID')
}

const expected = new Map([
  [
    'preview',
    {
      bytes: 2674908,
      sha256:
        '283AFE028C6977C16CF2AF26332D022C896038EEF5A2947B4D3E1A4F46390662',
    },
  ],
  [
    'final',
    {
      bytes: 80805153,
      sha256:
        '6EB79C2CA51B74A50EF6E9F7AC1413CB50405BB4E9AFDE6502D2239E4B8CE121',
    },
  ],
])

for (const [id, contract] of expected) {
  const model = manifest.models.find(
    (candidate) => candidate.id === id,
  )

  if (!model) {
    fail(`PUBLIC_MODEL_DESCRIPTOR_MISSING=${id}`)
  }

  if (
    model.bytes !== contract.bytes ||
    String(model.sha256).toUpperCase() !==
      contract.sha256 ||
    !Array.isArray(model.parts) ||
    model.parts.length === 0
  ) {
    fail(`PUBLIC_MODEL_CONTRACT_INVALID=${id}`)
  }

  let totalBytes = 0
  const fullHash = createHash('sha256')

  for (const part of model.parts) {
    if (
      typeof part.path !== 'string' ||
      part.path.startsWith('/') ||
      part.path.includes('..')
    ) {
      fail(`PUBLIC_MODEL_PART_PATH_INVALID=${id}`)
    }

    const partPath = resolve(publicRoot, part.path)

    if (!partPath.startsWith(publicRoot)) {
      fail(`PUBLIC_MODEL_PART_PATH_ESCAPE=${part.path}`)
    }

    if (!existsSync(partPath)) {
      fail(`PUBLIC_MODEL_PART_MISSING=${part.path}`)
    }

    const bytes = statSync(partPath).size

    if (
      bytes !== part.bytes ||
      sha256(partPath) !==
        String(part.sha256).toUpperCase()
    ) {
      fail(`PUBLIC_MODEL_PART_INTEGRITY_FAILED=${part.path}`)
    }

    if (bytes > 21 * 1024 * 1024) {
      fail(`PUBLIC_MODEL_PART_TOO_LARGE=${part.path}:${bytes}`)
    }

    const data = readFileSync(partPath)
    fullHash.update(data)
    totalBytes += bytes
  }

  if (
    totalBytes !== contract.bytes ||
    fullHash.digest('hex').toUpperCase() !==
      contract.sha256
  ) {
    fail(`PUBLIC_MODEL_REASSEMBLY_FAILED=${id}`)
  }
}

console.log('BESHMARAI_PUBLIC_MODEL_PACKAGE_VERIFIED=true')
