import {
  type FinalRuntimeState,
} from './protocol.ts'

const allowedTransitions:
  Record<
    FinalRuntimeState,
    readonly FinalRuntimeState[]
  > = {
    idle: [
      'profiling',
      'releasing',
      'unavailable',
    ],
    profiling: [
      'selecting-plan',
      'recording-failure',
      'releasing',
      'unavailable',
      'idle',
    ],
    'selecting-plan': [
      'loading-model',
      'recording-failure',
      'releasing',
      'unavailable',
      'idle',
    ],
    'loading-model': [
      'creating-session',
      'recording-failure',
      'releasing',
      'unavailable',
    ],
    'creating-session': [
      'ready',
      'recording-failure',
      'releasing',
      'unavailable',
    ],
    ready: [
      'running',
      'profiling',
      'releasing',
      'recording-failure',
      'unavailable',
    ],
    running: [
      'ready',
      'recording-failure',
      'releasing',
      'unavailable',
    ],
    'recording-failure': [
      'selecting-plan',
      'profiling',
      'releasing',
      'unavailable',
      'idle',
    ],
    releasing: [
      'idle',
      'unavailable',
    ],
    unavailable: [
      'profiling',
      'releasing',
      'idle',
    ],
  }

export class FinalRuntimeStateMachine {
  private currentState:
    FinalRuntimeState = 'idle'

  get state(): FinalRuntimeState {
    return this.currentState
  }

  canTransition(
    next:
      FinalRuntimeState,
  ): boolean {
    if (
      next ===
      this.currentState
    ) {
      return true
    }

    return allowedTransitions[
      this.currentState
    ].includes(next)
  }

  transition(
    next:
      FinalRuntimeState,
  ): void {
    if (
      next ===
      this.currentState
    ) {
      return
    }

    if (
      !this.canTransition(next)
    ) {
      throw new Error(
        'FINAL_RUNTIME_ILLEGAL_STATE_TRANSITION=' +
        `${this.currentState}->${next}`,
      )
    }

    this.currentState = next
  }

  reset(): void {
    this.currentState = 'idle'
  }
}
