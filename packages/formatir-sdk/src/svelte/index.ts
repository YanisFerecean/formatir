/**
 * Svelte action (also usable as a SolidJS `use:` directive):
 *
 * ```svelte
 * <script>
 *   import { formatir } from 'formatir/svelte';
 * </script>
 *
 * <form use:formatir={{ endpoint: '/api/formatir', onInstance: (f) => (tracker = f) }}>
 * ```
 *
 * The element becomes the observed `root`. Parameters are read once - the
 * session must not restart because a parent re-rendered with a new object.
 */
import { create } from 'formatir';
import type { FormatirInstance, FormatirOptions } from 'formatir';

export interface FormatirActionParams extends Omit<FormatirOptions, 'root'> {
  /** Receives the instance, e.g. to call `setStep()` or `markSubmitted()`. */
  onInstance?: (instance: FormatirInstance) => void;
}

export function formatir(
  node: Element,
  params: FormatirActionParams = {},
): { destroy(): void } {
  const { onInstance, ...options } = params;
  const instance = create({ ...options, root: node });
  onInstance?.(instance);
  return { destroy: () => instance.destroy() };
}
