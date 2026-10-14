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
import { createInstance, OPT_OUT_KEY, VERSION, type FormatirInstance } from './core/runtime';
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

/**
 * Create an independent instance that `init()` neither tracks nor replaces -
 * e.g. one per form on a page with several forms (`root: '#newsletter'`).
 * The caller owns its lifecycle and must `destroy()` it.
 */
export const create = (options: FormatirOptions = {}): FormatirInstance =>
  createInstance(options);

/** The instance created by the last `init()` call, if any. */
export const getInstance = (): FormatirInstance | undefined => current;

export const Formatir = { init, create, getInstance, version: VERSION };

export { OPT_OUT_KEY, VERSION };
export { OUTBOX_KEY } from './core/transport';
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
  ScoreOptions,
  Thresholds,
} from './types';

export default Formatir;
