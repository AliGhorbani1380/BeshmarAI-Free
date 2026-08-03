const assert = require('node:assert/strict')
const {readFileSync} = require('node:fs')
const {join, resolve} = require('node:path')
const ts = require('typescript')

const root = resolve(__dirname, '..')

function loadTypeScriptModule(relative) {
  const path = join(root, relative)
  const source = readFileSync(path, 'utf8')
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      strict: true,
      erasableSyntaxOnly: true,
    },
    fileName: path,
    reportDiagnostics: true,
  })

  const errors = (result.diagnostics || []).filter(
    (diagnostic) =>
      diagnostic.category === ts.DiagnosticCategory.Error,
  )

  if (errors.length > 0) {
    throw new Error(
      errors.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          '\n',
        ),
      ).join('\n'),
    )
  }

  const module = {exports: {}}
  const execute = new Function(
    'exports',
    'module',
    'require',
    result.outputText,
  )

  execute(module.exports, module, require)
  return module.exports
}

const {SingleFlight} = loadTypeScriptModule(
  'src/finalRuntime/singleFlight.ts',
)
const {FinalRuntimeStateMachine} = loadTypeScriptModule(
  'src/finalRuntime/stateMachine.ts',
)

async function testConcurrentSingleFlight() {
  const gate = new SingleFlight()
  let factoryCalls = 0
  let release

  const deferred = new Promise((resolve) => {
    release = resolve
  })

  const operations = Array.from({length: 32}, () =>
    gate.run(async () => {
      factoryCalls += 1
      await deferred
      return 42
    }),
  )

  await Promise.resolve()
  assert.equal(factoryCalls, 1)

  release()
  const results = await Promise.all(operations)
  assert.deepEqual(new Set(results), new Set([42]))
  assert.equal(gate.running, false)
}

async function testFailureAllowsRetryWithoutUnhandledRejection() {
  const gate = new SingleFlight()
  let calls = 0

  await assert.rejects(
    gate.run(async () => {
      calls += 1
      throw new Error('expected')
    }),
  )

  const result = await gate.run(async () => {
    calls += 1
    return 'recovered'
  })

  assert.equal(result, 'recovered')
  assert.equal(calls, 2)
}

async function testOldCompletionCannotClearNewOperation() {
  const gate = new SingleFlight()

  let firstRelease
  const first = gate.run(() =>
    new Promise((resolve) => {
      firstRelease = resolve
    }),
  )

  await Promise.resolve()
  gate.clear()

  let secondRelease
  const second = gate.run(() =>
    new Promise((resolve) => {
      secondRelease = resolve
    }),
  )

  firstRelease('first')
  await first
  assert.equal(gate.running, true)

  secondRelease('second')
  await second
  assert.equal(gate.running, false)
}

function testStateMachine() {
  const machine = new FinalRuntimeStateMachine()
  machine.transition('profiling')
  machine.transition('selecting-plan')
  machine.transition('loading-model')
  machine.transition('creating-session')
  machine.transition('ready')
  machine.transition('running')
  machine.transition('ready')
  machine.transition('releasing')
  machine.transition('idle')
  assert.equal(machine.state, 'idle')

  assert.throws(
    () => machine.transition('running'),
    /ILLEGAL_STATE_TRANSITION/,
  )
}

async function main() {
  await testConcurrentSingleFlight()
  await testFailureAllowsRetryWithoutUnhandledRejection()
  await testOldCompletionCannotClearNewOperation()
  testStateMachine()
  console.log('FINAL_RUNTIME_RACE_TESTS=PASSED')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
