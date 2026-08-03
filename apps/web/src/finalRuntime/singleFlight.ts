export class SingleFlight<T> {
  private active:
    Promise<T> | null = null

  get running(): boolean {
    return this.active !== null
  }

  run(
    factory: () => Promise<T>,
  ): Promise<T> {
    if (this.active) {
      return this.active
    }

    const operation =
      Promise.resolve()
        .then(factory)

    this.active = operation

    const clearIfCurrent =
      (): void => {
        if (
          this.active ===
          operation
        ) {
          this.active = null
        }
      }

    void operation.then(
      clearIfCurrent,
      clearIfCurrent,
    )

    return operation
  }

  clear(): void {
    this.active = null
  }
}
