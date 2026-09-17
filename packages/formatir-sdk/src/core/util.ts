/** Tiny helpers shared by the detectors. Keep them allocation-free where possible. */

export const noop = (): void => {};

/** Monotonic-ish timestamp. */
export const now = (): number => Date.now();

let seq = 0;

/** Short unique id; uses `crypto.randomUUID` when available. */
export function uid(prefix = ''): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  const raw =
    c && typeof c.randomUUID === 'function'
      ? c.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return prefix + raw + (seq++).toString(36);
}

export const clamp = (n: number, min: number, max: number): number =>
  n < min ? min : n > max ? max : n;

/** Truncate a string so oversized payloads never leave the browser. */
export const cut = (s: unknown, max: number): string =>
  String(s == null ? '' : s).slice(0, max);

/** Run a callback without ever letting it escape into a DOM handler. */
export function safe<T>(fn: (arg: T) => void, arg: T, debug?: boolean): void {
  try {
    fn(arg);
  } catch (err) {
    if (debug) console.error('[formatir] listener failed', err);
  }
}
