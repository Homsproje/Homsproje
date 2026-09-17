/** Minimal production-grade retry (no offline queue). */

export type RetryOptions = {
  attempts?: number;
  baseMs?: number;
  /** Return true to retry this error. */
  shouldRetry?: (err: unknown) => boolean;
};

const defaultShouldRetry = (err: unknown): boolean => {
  if (err instanceof Error && err.message === "Unauthorized") return false;
  return true;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseMs = opts.baseMs ?? 250;
  const shouldRetry = opts.shouldRetry ?? defaultShouldRetry;
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (i === attempts - 1 || !shouldRetry(err)) throw err;
      await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
    }
  }
  throw last;
}
