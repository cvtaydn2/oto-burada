/**
 * Result<T, E> — a lightweight discriminated union for explicit error handling.
 *
 * Replaces the inconsistent mix of `null`, `{ error }`, and thrown errors
 * across the service layer with a single, predictable pattern.
 *
 * Usage:
 *   function getUser(id: string): Promise<Result<User>> { ... }
 *
 *   const result = await getUser(id);
 *   if (!result.ok) {
 *     console.error(result.error);
 *     return;
 *   }
 *   console.log(result.data);
 */

export type Result<T, E = string> = { ok: true; data: T } | { ok: false; error: E };

/** Wrap a successful value in a Result. */
export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

/** Wrap an error in a Result. */
export function err<E = string>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Safely execute an async function and return a Result.
 * Catches thrown errors and converts them to `err(message)`.
 */
export async function safeRun<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.";
    return err(message);
  }
}
