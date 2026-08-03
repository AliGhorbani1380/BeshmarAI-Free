import {
  FINAL_RUNTIME_MODEL_VERSION,
  type FinalRuntimeModelVariantId,
  type FinalRuntimeProvider,
} from './protocol'

export type FinalModelVariant = {
  id: FinalRuntimeModelVariantId
  aiModelId: 'final'
  inputSize: 1152
  outputChannels: 5
  outputCandidates: 27216
  plainBytes: number
  plainSha256: string
  providers:
    readonly FinalRuntimeProvider[]
  precision:
    | 'fp32'
    | 'fp16'
    | 'uint8'
  productionReady: boolean
}

const currentFinalModel:
  FinalModelVariant = {
    id: 'final-fp32-1152',
    aiModelId: 'final',
    inputSize: 1152,
    outputChannels: 5,
    outputCandidates: 27216,
    plainBytes: 80805153,
    plainSha256:
      '6EB79C2CA51B74A50EF6E9F7AC1413CB50405BB4E9AFDE6502D2239E4B8CE121',
    providers: [
      'webgpu',
      'wasm',
    ],
    precision: 'fp32',
    productionReady: true,
  }

const variants:
  readonly FinalModelVariant[] = [
    currentFinalModel,
  ]

export function finalModelRegistryVersion():
  string {
  return FINAL_RUNTIME_MODEL_VERSION
}

export function listProductionFinalModels():
  readonly FinalModelVariant[] {
  return variants.filter(
    (variant) =>
      variant.productionReady,
  )
}

export function resolveFinalModelVariant(
  provider:
    FinalRuntimeProvider,
): FinalModelVariant {
  const matching =
    variants.find(
      (variant) =>
        variant.productionReady &&
        variant.providers.includes(
          provider,
        ),
    )

  if (!matching) {
    throw new Error(
      'FINAL_MODEL_VARIANT_UNAVAILABLE=' +
      provider,
    )
  }

  return matching
}

export function assertFinalModelContract(
  variant:
    FinalModelVariant,
): void {
  if (
    variant.inputSize !== 1152 ||
    variant.outputChannels !== 5 ||
    variant.outputCandidates !==
      27216
  ) {
    throw new Error(
      'FINAL_MODEL_REGISTRY_CONTRACT_INVALID=' +
      variant.id,
    )
  }
}
