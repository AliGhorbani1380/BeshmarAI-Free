/// <reference lib="webworker" />

import * as ort from 'onnxruntime-web/wasm'
import {
  installFinalWorkerRuntime,
} from './runtime'

installFinalWorkerRuntime(
  ort as unknown as
    Parameters<
      typeof installFinalWorkerRuntime
    >[0],
  'wasm',
  'BESHMARAI_FINAL_WASM_WORKER_V3',
)
