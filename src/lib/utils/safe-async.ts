/**
 * World-Class UX: Search Race Condition Guard (Issue 2 - "The Seam")
 * Prevents old, slow API results from overwriting new ones.
 * Implements AbortController logic for all UI-driven searches.
 */

export class SafeAsync {
  private static controllers: Map<string, AbortController> = new Map();

  /**
   * Generates a new signal and cancels any pending requests for the same key.
   */
  static getSignal(key: string): AbortSignal {
    if (this.controllers.has(key)) {
      this.controllers.get(key)?.abort("NEW_REQUEST_STARTED");
    }
    const controller = new AbortController();
    this.controllers.set(key, controller);
    return controller.signal;
  }

  /**
   * Helper to check if an error is a planned cancellation.
   */
  static isAbort(error: unknown): boolean {
    return (
      error === "NEW_REQUEST_STARTED" || (error instanceof Error && error.name === "AbortError")
    );
  }
}
