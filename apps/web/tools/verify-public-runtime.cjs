const {
  existsSync,
  readFileSync,
} = require('node:fs')
const {
  join,
  resolve,
} = require('node:path')

const root = resolve(__dirname, '..')

function read(relative) {
  return readFileSync(join(root, relative), 'utf8')
}

function requireText(relative, markers) {
  const source = read(relative)
  for (const marker of markers) {
    if (!source.includes(marker)) {
      throw new Error(`SOURCE_MARKER_MISSING=${relative}:${marker}`)
    }
  }
  return source
}

function forbidText(relative, markers) {
  const source = read(relative)
  for (const marker of markers) {
    if (source.includes(marker)) {
      throw new Error(`FORBIDDEN_SOURCE_MARKER=${relative}:${marker}`)
    }
  }
}

requireText('src/aiModelCache.ts', [
  'BESHMARAI_PUBLIC_STATIC_MODEL_LOADER_V1',
  'BESHMARAI_PUBLIC_MODEL_MANIFEST_V1',
  'models/public-v1/manifest.json',
  'PUBLIC_MODEL_PART_HASH_INVALID',
  'PUBLIC_MODEL_HASH_INVALID',
])

forbidText('src/aiModelCache.ts', [
  '/v1/',
  'MODEL_KEY_REQUEST',
  'access_token',
  'refresh_token',
])

requireText('src/main.tsx', [
  '<AiStartupGate>',
  '<App />',
])

forbidText('src/main.tsx', [
  'ProductShell',
  'AdminApp',
  'authContractBridge',
  'clientTelemetry',
])

requireText('src/App.tsx', [
  'BESHMARAI_PUBLIC_FREE_ACCESS_CONTRACT_V1',
  "reason: 'public_free'",
  'شروع شمارش',
])

forbidText('src/App.tsx', [
  'beshmaraiOpenPlans',
  'beshmaraiRefreshAccess',
  'request-otp',
  'verify-otp',
])

requireText('vite.config.ts', [
  "base: '/app/'",
  "start_url: '/app/'",
  "scope: '/app/'",
  "globIgnores: [\n          'models/public-v1/**'",
])

requireText('src/finalRuntime/modelRegistry.ts', [
  'plainBytes: 80805153',
  '6EB79C2CA51B74A50EF6E9F7AC1413CB50405BB4E9AFDE6502D2239E4B8CE121',
  "id: 'final-fp32-1152'",
])

for (const relative of [
  'src/adminApp.tsx',
  'src/productShell.tsx',
  'src/authContractBridge.ts',
  'src/clientTelemetry.ts',
  'src/trialNoticeBridge.ts',
  'src/devMockBackend.ts',
]) {
  if (existsSync(join(root, relative))) {
    throw new Error(`PRIVATE_SOURCE_STILL_PRESENT=${relative}`)
  }
}

console.log('BESHMARAI_PUBLIC_RUNTIME_VERIFY=PASSED')
