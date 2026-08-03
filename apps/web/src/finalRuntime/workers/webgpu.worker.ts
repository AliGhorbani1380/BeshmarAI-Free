/// <reference lib="webworker" />

import * as ort from 'onnxruntime-web/webgpu'
import {
  installFinalWorkerRuntime,
} from './runtime'

installFinalWorkerRuntime(
  ort as unknown as
    Parameters<
      typeof installFinalWorkerRuntime
    >[0],
  'webgpu',
  'BESHMARAI_FINAL_WEBGPU_WORKER_V3',
)
