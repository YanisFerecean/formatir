/**
 * Formatir - behaviour analytics for web forms.
 *
 * ```ts
 * import { Formatir } from 'formatir';
 *
 * const formatir = Formatir.init({ endpoint: '/api/formatir', appId: 'careers' });
 * formatir.on('rage_click', (e) => console.log(e.data.selector));
 * ```
 */
import { createInstance, VERSION, type FormatirInstance } from './core/runtime';
import type { FormatirOptions } from './types';

let current: FormatirInstance | undefined;

/**
 * Start a session. Re-initialising destroys the previous instance, so hot
 * reloads and StrictMode double-mounts never double-count.
 */
export function init(options: FormatirOptions = {}): FormatirInstance {
  current?.destroy();
  current = createInstance(options);
  return current;
}

/** The instance created by the last `init()` call, if any. */
export const getInstance = (): FormatirInstance | undefined => current;

export const Formatir = { init, getInstance, version: VERSION };

export { VERSION };
/** Alias of {@link VERSION}, convenient on the `window.Formatir` global. */
export const version = VERSION;
export type { FormatirInstance };
export type {
  FieldRef,
  FieldStats,
  FormatirEvent,
  FormatirOptions,
  FormatirSnapshot,
  FrustrationLevel,
  MetricListener,
  MetricName,
  MetricPayloads,
  Thresholds,
} from './types';

export default Formatir;
