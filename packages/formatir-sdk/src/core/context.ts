import type {
  FieldRef,
  FieldStats,
  FormatirOptions,
  MetricName,
  MetricPayloads,
  Thresholds,
} from '../types';
import type { FieldElement } from './dom';

export type ResolvedOptions = Required<
  Pick<
    FormatirOptions,
    | 'batchSize'
    | 'flushIntervalMs'
    | 'sampleRate'
    | 'transport'
    | 'ignoreSelector'
    | 'debug'
  >
> &
  FormatirOptions & { thresholds: Thresholds };

/** Mutable session state shared by all detectors. */
export interface SessionState {
  startedAt: number;
  step?: string;
  /** Effort counters per field key. */
  fields: Map<string, FieldStats>;
  /** Field keys that were emptied and are waiting for a refill. */
  emptied: Set<string>;
  /** Currently focused field, with the data the hesitation detector needs. */
  focus?: { el: FieldElement; ref: FieldRef; at: number; typed: boolean };
  /** Last field the user interacted with - the drop-off anchor. */
  lastField?: FieldRef;
  submitted: boolean;
  dropped: boolean;
}

/** Everything a detector is allowed to touch. */
export interface DetectorContext {
  opts: ResolvedOptions;
  root: Document | Element;
  state: SessionState;
  /** Emit a metric event. */
  emit<K extends MetricName>(type: K, data: MetricPayloads[K], field?: FieldRef): void;
  /** Feed the frustration score without emitting an event. */
  signal(name: string, amount?: number): void;
  /** Per-field counters, created on first touch. */
  stats(el: FieldElement): FieldStats;
  /** Register an auto-removed DOM listener. */
  on<T extends Event>(
    target: EventTarget,
    type: string,
    fn: (event: T) => void,
    capture?: boolean,
  ): void;
  /** Register an auto-cleared timeout. */
  timer(fn: () => void, ms: number): void;
  /** Register a teardown callback. */
  cleanup(fn: () => void): void;
  /** Opted-out subtree (`ignoreSelector`)? */
  ignored(el: Element | null): boolean;
  /** Inside the observed `root`? */
  inScope(el: Element | null): boolean;
  /** Observable at all: in scope and not opted out. */
  watches(el: Element | null): boolean;
  /** Callbacks a detector exposes to the public instance API. */
  hooks: { dropoff?: () => void };
}

export type Detector = (ctx: DetectorContext) => void;
