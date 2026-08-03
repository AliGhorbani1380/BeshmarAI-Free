const {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
} = require('node:fs')
const {
  createHash,
} = require('node:crypto')
const {
  join,
  resolve,
} = require('node:path')

const projectRoot =
  resolve(__dirname, '..')

const packageJson =
  JSON.parse(
    readFileSync(
      join(
        projectRoot,
        'package.json',
      ),
      'utf8',
    ),
  )

const expectedVersion =
  '1.27.0'

if (
  packageJson.dependencies
    ?.['onnxruntime-web'] !==
  expectedVersion
) {
  throw new Error(
    'ONNXRUNTIME_WEB_MUST_BE_EXACTLY_' +
    expectedVersion,
  )
}

const installedPackage =
  JSON.parse(
    readFileSync(
      join(
        projectRoot,
        'node_modules',
        'onnxruntime-web',
        'package.json',
      ),
      'utf8',
    ),
  )

if (
  installedPackage.version !==
  expectedVersion
) {
  throw new Error(
    'ONNXRUNTIME_WEB_INSTALLED_VERSION_MISMATCH=' +
    `${installedPackage.version}/${expectedVersion}`,
  )
}

const distRoot =
  join(
    projectRoot,
    'node_modules',
    'onnxruntime-web',
    'dist',
  )

const outputRoot =
  join(
    projectRoot,
    'public',
    `ort-runtime-${expectedVersion}`,
  )

const files = [
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.jsep.mjs',
  'ort-wasm-simd-threaded.jsep.wasm',
]

rmSync(
  outputRoot,
  {
    recursive: true,
    force: true,
  },
)

mkdirSync(
  outputRoot,
  {
    recursive: true,
  },
)

function sha256(path) {
  return createHash('sha256')
    .update(
      readFileSync(path),
    )
    .digest('hex')
}

const manifest = {
  marker:
    'BESHMARAI_ORT_RUNTIME_ASSET_MANIFEST_V3',
  onnxruntimeWebVersion:
    expectedVersion,
  generatedAt:
    new Date().toISOString(),
  files: {},
}

for (const filename of files) {
  const source =
    join(
      distRoot,
      filename,
    )

  if (!existsSync(source)) {
    throw new Error(
      'ORT_RUNTIME_SOURCE_MISSING=' +
      source,
    )
  }

  const destination =
    join(
      outputRoot,
      filename,
    )

  copyFileSync(
    source,
    destination,
  )

  const sourceHash =
    sha256(source)

  const destinationHash =
    sha256(destination)

  if (
    sourceHash !==
    destinationHash
  ) {
    throw new Error(
      'ORT_RUNTIME_HASH_MISMATCH=' +
      filename,
    )
  }

  manifest.files[filename] = {
    sha256:
      sourceHash,
  }
}

require('node:fs')
  .writeFileSync(
    join(
      outputRoot,
      'manifest.json',
    ),
    JSON.stringify(
      manifest,
      null,
      2,
    ) + '\n',
  )

console.log(
  'ORT_RUNTIME_VERSION=' +
  expectedVersion,
)
console.log(
  'ORT_RUNTIME_ASSET_PARITY=PASSED',
)
