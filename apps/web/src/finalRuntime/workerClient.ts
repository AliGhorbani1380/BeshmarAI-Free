import {
  type FinalRuntimePlan,
  type FinalRuntimeProvider,
} from './protocol'
import {
  type FinalWorkerOutboundMessage,
  type WorkerReadyPayload,
  type WorkerRunPayload,
} from './workers/protocol'

type PendingWorkerRequest = {
  generation: number
  transactionId: string
  resolve: (
    payload: unknown,
  ) => void
  reject: (
    error: Error,
  ) => void
  timeoutId: number
}

export type RuntimeWorkerEvent = {
  event: string
  provider:
    FinalRuntimeProvider
  details:
    Record<string, unknown>
}

export class FinalRuntimeWorkerClient {
  readonly provider:
    FinalRuntimeProvider

  readonly generation:
    number

  private readonly onEvent:
    (
      event:
        RuntimeWorkerEvent,
    ) => void

  private readonly worker:
    Worker

  private readonly pending =
    new Map<
      string,
      PendingWorkerRequest
    >()

  private terminated = false

  private bootSettled = false

  private readonly bootPromise:
    Promise<void>

  private resolveBoot:
    () => void =
      () => undefined

  private rejectBoot:
    (error: Error) => void =
      () => undefined

  constructor(
    provider:
      FinalRuntimeProvider,
    generation:
      number,
    onEvent:
      (
        event:
          RuntimeWorkerEvent,
      ) => void,
  ) {
    this.provider = provider
    this.generation = generation
    this.onEvent = onEvent

    this.bootPromise =
      new Promise<void>(
        (resolve, reject) => {
          this.resolveBoot =
            resolve
          this.rejectBoot =
            reject
        },
      )

    this.worker =
      provider === 'webgpu'
        ? new Worker(
            new URL(
              './workers/webgpu.worker.ts',
              import.meta.url,
            ),
            {
              type: 'module',
              name:
                'beshmarai-final-webgpu-v3',
            },
          )
        : new Worker(
            new URL(
              './workers/wasm.worker.ts',
              import.meta.url,
            ),
            {
              type: 'module',
              name:
                'beshmarai-final-wasm-v3',
            },
          )

    this.worker.addEventListener(
      'message',
      this.handleMessage,
    )

    this.worker.addEventListener(
      'error',
      this.handleWorkerError,
    )

    this.worker.addEventListener(
      'messageerror',
      this.handleMessageError,
    )
  }

  private handleMessage = (
    event:
      MessageEvent<
        FinalWorkerOutboundMessage
      >,
  ): void => {
    const message =
      event.data

    if (
      message.generation !==
        this.generation &&
      !(
        message.kind ===
          'event' &&
        message.generation === 0
      )
    ) {
      return
    }

    if (
      message.kind ===
      'event'
    ) {
      if (
        message.event ===
          'worker.boot' &&
        !this.bootSettled
      ) {
        this.bootSettled = true
        this.resolveBoot()
      }

      this.onEvent({
        event:
          message.event,
        provider:
          message.provider,
        details:
          message.details,
      })
      return
    }

    const pending =
      this.pending.get(
        message.requestId,
      )

    if (
      !pending ||
      pending.generation !==
        message.generation ||
      pending.transactionId !==
        message.transactionId
    ) {
      return
    }

    this.pending.delete(
      message.requestId,
    )

    window.clearTimeout(
      pending.timeoutId,
    )

    if ('failure' in message) {
      const error =
        new Error(
          message.failure.message,
        )

      error.name =
        message.failure.code

      pending.reject(error)
      return
    }

    pending.resolve(
      message.payload,
    )
  }

  private handleWorkerError = (
    event: ErrorEvent,
  ): void => {
    const error =
      new Error(
        'FINAL_WORKER_SCRIPT_ERROR=' +
        event.message,
      )

    if (!this.bootSettled) {
      this.bootSettled = true
      this.rejectBoot(error)
    }

    this.rejectAll(error)
  }

  private handleMessageError =
    (): void => {
      const error =
        new Error(
          'FINAL_WORKER_MESSAGE_ERROR',
        )

      if (!this.bootSettled) {
        this.bootSettled = true
        this.rejectBoot(error)
      }

      this.rejectAll(error)
    }

  private rejectAll(
    error: Error,
  ): void {
    for (
      const pending of
      this.pending.values()
    ) {
      window.clearTimeout(
        pending.timeoutId,
      )
      pending.reject(error)
    }

    this.pending.clear()
  }

  private async waitForBoot(
    timeoutMs: number,
  ): Promise<void> {
    if (this.bootSettled) {
      return this.bootPromise
    }

    let timeoutId:
      number | null = null

    const timeout =
      new Promise<never>(
        (_resolve, reject) => {
          timeoutId =
            window.setTimeout(
              () => {
                const error =
                  new Error(
                    'FINAL_WORKER_BOOT_TIMEOUT',
                  )

                error.name =
                  'worker-boot-timeout'

                reject(error)
              },
              timeoutMs,
            )
        },
      )

    try {
      await Promise.race([
        this.bootPromise,
        timeout,
      ])
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(
          timeoutId,
        )
      }
    }
  }

  private request<T>(
    input: {
      kind:
        | 'init'
        | 'run'
        | 'release'
      generation: number
      transactionId: string
      requestId: string
      plan?:
        FinalRuntimePlan
      modelBuffer?:
        ArrayBuffer
      inputBuffer?:
        ArrayBuffer
    },
    transfer:
      Transferable[],
    timeoutMs: number,
  ): Promise<T> {
    if (this.terminated) {
      return Promise.reject(
        new Error(
          'FINAL_WORKER_ALREADY_TERMINATED',
        ),
      )
    }

    return new Promise<T>(
      (resolve, reject) => {
        const timeoutId =
          window.setTimeout(
            () => {
              this.pending.delete(
                input.requestId,
              )

              const error =
                new Error(
                  'FINAL_WORKER_REQUEST_TIMEOUT=' +
                  input.kind,
                )

              error.name =
                input.kind === 'run'
                  ? 'inference-timeout'
                  : input.kind ===
                      'init'
                    ? 'session-create-timeout'
                    : 'worker-timeout'

              reject(error)
            },
            timeoutMs,
          )

        this.pending.set(
          input.requestId,
          {
            generation:
              input.generation,
            transactionId:
              input.transactionId,
            resolve:
              resolve as (
                payload: unknown,
              ) => void,
            reject,
            timeoutId,
          },
        )

        this.worker.postMessage(
          input,
          transfer,
        )
      },
    )
  }

  async initialize(
    input: {
      generation: number
      transactionId: string
      requestId: string
      plan: FinalRuntimePlan
      modelBuffer: ArrayBuffer
    },
  ): Promise<WorkerReadyPayload> {
    await this.waitForBoot(
      input.plan
        .workerBootTimeoutMs,
    )

    return this.request<
      WorkerReadyPayload
    >(
      {
        kind: 'init',
        ...input,
      },
      [
        input.modelBuffer,
      ],
      input.plan
        .sessionCreateTimeoutMs,
    )
  }

  run(
    input: {
      generation: number
      transactionId: string
      requestId: string
      plan: FinalRuntimePlan
      inputBuffer: ArrayBuffer
    },
  ): Promise<WorkerRunPayload> {
    return this.request<
      WorkerRunPayload
    >(
      {
        kind: 'run',
        generation:
          input.generation,
        transactionId:
          input.transactionId,
        requestId:
          input.requestId,
        inputBuffer:
          input.inputBuffer,
      },
      [
        input.inputBuffer,
      ],
      input.plan
        .inferenceTimeoutMs,
    )
  }

  async release(
    input: {
      generation: number
      transactionId: string
      requestId: string
    },
  ): Promise<void> {
    if (this.terminated) {
      return
    }

    try {
      await this.request(
        {
          kind: 'release',
          ...input,
        },
        [],
        5000,
      )
    } catch {
      // Termination below is authoritative.
    } finally {
      this.terminate(
        'release',
      )
    }
  }

  terminate(
    reason: string,
  ): void {
    if (this.terminated) {
      return
    }

    this.terminated = true

    if (!this.bootSettled) {
      this.bootSettled = true
      this.rejectBoot(
        new Error(
          'FINAL_WORKER_TERMINATED_BEFORE_BOOT=' +
          reason,
        ),
      )
    }

    this.rejectAll(
      new Error(
        'FINAL_WORKER_TERMINATED=' +
        reason,
      ),
    )

    this.worker.removeEventListener(
      'message',
      this.handleMessage,
    )
    this.worker.removeEventListener(
      'error',
      this.handleWorkerError,
    )
    this.worker.removeEventListener(
      'messageerror',
      this.handleMessageError,
    )

    this.worker.terminate()
  }
}
