import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import {
  extname,
  join,
  relative,
  resolve,
} from 'node:path'

const root = resolve(import.meta.dirname, '..')
const textExtensions = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.html', '.css', '.md', '.txt', '.yml', '.yaml',
])
const ignoredNames = new Set([
  'node_modules', '.next', 'out', 'dist', 'deploy', '.git',
])

function walk(directory, output = []) {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    if (ignoredNames.has(entry.name)) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) walk(path, output)
    else output.push(path)
  }
  return output
}

const files = walk(resolve(root, 'apps'))
const failures = []

for (const path of files) {
  const rel = relative(root, path).replaceAll('\\', '/')
  const name = rel.split('/').at(-1) ?? ''

  if (rel === 'apps/web/tools/verify-public-runtime.cjs') continue

  if (
    /^\.env(?:\.|$)/i.test(name) &&
    !/\.example$/i.test(name)
  ) {
    failures.push(`REAL_ENV_FILE=${rel}`)
  }

  if (/\.(?:pem|key|p12|pfx|jks|keystore)$/i.test(name)) {
    failures.push(`PRIVATE_KEY_FILE=${rel}`)
  }

  if (
    rel.startsWith('apps/web/public/models/') &&
    statSync(path).size > 21 * 1024 * 1024
  ) {
    failures.push(`UNSPLIT_MODEL_FILE=${rel}`)
  }

  if (!textExtensions.has(extname(path).toLowerCase())) continue
  if (statSync(path).size > 5 * 1024 * 1024) continue

  const text = readFileSync(path, 'utf8')

  const forbidden = [
    ['PRIVATE_API_DOMAIN', /api\.beshmarai\.ir/i],
    ['PRIVATE_VERSIONED_API', /["'`]\/v1\//i],
    ['PRIVATE_AUTH_SOURCE', /(?:request-otp|verify-otp|authContractBridge|productShell|adminApp|clientTelemetry|trialNoticeBridge|devMockBackend)/i],
    ['PRIVATE_SECRET', /(?:AIza[0-9A-Za-z_-]{30,}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/],
  ]

  for (const [label, pattern] of forbidden) {
    if (pattern.test(text)) failures.push(`${label}=${rel}`)
  }
}

for (const required of [
  'apps/site/next.config.ts',
  'apps/web/vite.config.ts',
  '.github/workflows/pages.yml',
  'scripts/build-pages.mjs',
]) {
  if (!existsSync(resolve(root, required))) {
    failures.push(`REQUIRED_FILE_MISSING=${required}`)
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log('BESHMARAI_PUBLIC_BOUNDARY_VERIFY=PASSED')
}
