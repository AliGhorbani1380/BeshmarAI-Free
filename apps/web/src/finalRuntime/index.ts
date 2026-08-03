import {
  getFinalRuntimeDiagnostics,
  prepareFinalRuntime,
  prewarmFinalRuntimeIfRecommended,
  releaseFinalRuntime,
  runFinalAccurateModel,
} from './coordinator'
import {
  clearFinalRuntimePlanHistory,
} from './planStore'
import {
  ensureDeviceStrategyOnce,
} from './deviceStrategyBootstrap'
import {
  clearDeviceStrategy,
  readDeviceStrategy,
} from './deviceStrategy'

export {
  getFinalRuntimeDiagnostics,
  prepareFinalRuntime,
  prewarmFinalRuntimeIfRecommended,
  releaseFinalRuntime,
  runFinalAccurateModel,
  ensureDeviceStrategyOnce,
  readDeviceStrategy,
}

export {
  clearFinalRuntimePlanHistory,
  clearDeviceStrategy,
}

export type {
  FinalRuntimeDiagnostics,
  FinalRuntimeFailure,
  FinalRuntimePlan,
  FinalRuntimeReadiness,
} from './protocol'

declare global {
  interface Window {
    __BESHMARAI_FINAL_RUNTIME_V3__?: {
      marker:
        'BESHMARAI_FINAL_RUNTIME_DIAGNOSTICS_API_V3'
      diagnostics:
        typeof getFinalRuntimeDiagnostics
      release: (
        reason?: string,
      ) => Promise<void>
      clearPlanHistory:
        typeof clearFinalRuntimePlanHistory
    }
  }
}

window.__BESHMARAI_FINAL_RUNTIME_V3__ = {
  marker:
    'BESHMARAI_FINAL_RUNTIME_DIAGNOSTICS_API_V3',
  diagnostics:
    getFinalRuntimeDiagnostics,
  release:
    (reason = 'diagnostics-api') =>
      releaseFinalRuntime(reason),
  clearPlanHistory:
    clearFinalRuntimePlanHistory,
}
