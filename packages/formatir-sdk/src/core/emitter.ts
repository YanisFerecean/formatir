import type { FormatirEvent, MetricListener, MetricName } from '../types';
import { safe } from './util';

type AnyListener = MetricListener<MetricName>;

export interface Emitter {
  on(metric: MetricName | '*', fn: AnyListener): () => void;
  off(metric: MetricName | '*', fn: AnyListener): void;
  emit(event: FormatirEvent): void;
  clear(): void;
}

/** Minimal typed pub/sub with a `*` wildcard channel. */
export function createEmitter(debug?: boolean): Emitter {
  const channels = new Map<string, Set<AnyListener>>();

  const on = (metric: MetricName | '*', fn: AnyListener) => {
    let set = channels.get(metric);
    if (!set) channels.set(metric, (set = new Set()));
    set.add(fn);
    return () => void set!.delete(fn);
  };

  return {
    on,
    off(metric, fn) {
      channels.get(metric)?.delete(fn);
    },
    emit(event) {
      channels.get(event.type)?.forEach((fn) => safe(fn, event, debug));
      channels.get('*')?.forEach((fn) => safe(fn, event, debug));
    },
    clear() {
      channels.clear();
    },
  };
}
