/**
 * Public type surface of the Formatir SDK.
 *
 * Privacy by design: no payload in this file ever carries the *content* a user
 * typed. Only structural metadata (identifiers, lengths, counters, durations).
 */

/** Every behavioural metric Formatir can emit. */
export type MetricName =
  | 'session_start'
  | 'field_focus'
  | 'field_blur'
  | 'rage_click'
  | 'dead_click'
  | 'hesitation'
  | 'field_effort'
  | 'validation_error'
  | 'form_submit'
  | 'form_dropoff'
  | 'js_error'
  | 'score'
  | 'custom';

/** Stable, non-PII reference to a form field. */
export interface FieldRef {
  /** `name`, `id`, `data-formatir-field` or a structural fallback key. */
  key: string;
  /** Input type (`text`, `email`, `select-one`, ...). Never a value. */
  type?: string;
  /** Logical step / fieldset the field belongs to (see `setStep()`). */
  step?: string;
}

/** Aggregated effort counters kept per field. */
export interface FieldStats extends FieldRef {
  /** Number of `input` events. */
  keystrokes: number;
  /** Backspace / Delete presses. */
  corrections: number;
  /** Times the field was emptied and filled again. */
  refills: number;
  /** Constraint-validation failures observed on the field. */
  validationErrors: number;
  /** How often the field received focus. */
  focusCount: number;
  /** Accumulated focus time in ms. */
  timeFocusedMs: number;
  /** Longest measured focus -> first keystroke delay in ms. */
  hesitationMs: number;
  /** Character count of the current value. Never the value itself. */
  length: number;
  /** Whether the user changed the field at least once. */
  changed: boolean;
}

export type FrustrationLevel = 'calm' | 'mild' | 'elevated' | 'severe';

/** Payload shape per metric. */
export interface MetricPayloads {
  session_start: {
    url: string;
    referrer: string;
    viewport: { w: number; h: number };
    language: string;
  };
  field_focus: { focusCount: number };
  field_blur: { timeFocusedMs: number; length: number; changed: boolean };
  rage_click: {
    /** Clicks inside the detection window. */
    count: number;
    /** Time span the burst covered, in ms. */
    withinMs: number;
    selector: string;
    x: number;
    y: number;
  };
  dead_click: {
    selector: string;
    x: number;
    y: number;
    /** How long we waited for a reaction before calling it dead. */
    waitedMs: number;
  };
  hesitation: {
    /** Focus -> first keystroke, or focus -> blur when abandoned. */
    ms: number;
    threshold: number;
    /** True when the field was left without a single keystroke. */
    abandoned: boolean;
  };
  field_effort: FieldStats;
  validation_error: { reason: string };
  form_submit: {
    formId: string;
    durationMs: number;
    fields: number;
    filled: number;
    /** False when the browser's constraint validation would have blocked it. */
    valid: boolean;
  };
  form_dropoff: {
    formId: string;
    /** Last field the user touched before leaving. */
    lastField?: FieldRef;
    durationMs: number;
    fields: number;
    filled: number;
    /** Share of touched fields, 0..1. */
    progress: number;
    reason: 'pagehide' | 'hidden' | 'manual';
  };
  js_error: {
    message: string;
    source?: string;
    line?: number;
    column?: number;
    kind: 'error' | 'unhandledrejection';
  };
  score: { score: number; level: FrustrationLevel; signals: Record<string, number> };
  custom: Record<string, unknown>;
}

interface EventBase {
  /** Unique event id. */
  id: string;
  /** Wall clock time (epoch ms). */
  ts: number;
  /** Milliseconds since session start. */
  t: number;
  sessionId: string;
  /** Logical step at the time of the event, if set. */
  step?: string;
  /** Field context, when the metric relates to one. */
  field?: FieldRef;
}

/** Discriminated union over all metrics; narrow with `event.type`. */
export type FormatirEvent<K extends MetricName = MetricName> = {
  [P in K]: EventBase & { type: P; data: MetricPayloads[P] };
}[K];

export type MetricListener<K extends MetricName = MetricName> = (
  event: FormatirEvent<K>,
) => void;

export interface Thresholds {
  /** Clicks required for a rage click. Default 3. */
  rageClicks: number;
  /** Rage click window in ms. Default 500. */
  rageWindowMs: number;
  /** Radius in px that still counts as "the same spot". Default 32. */
  rageRadiusPx: number;
  /** Grace period for a page reaction before a click is dead. Default 1000. */
  deadClickMs: number;
  /** Focus -> first keystroke delay that counts as hesitation. Default 3000. */
  hesitationMs: number;
}

export interface FormatirOptions {
  /** Collector URL. Without it Formatir stays local (observers only). */
  endpoint?: string;
  /** Free-form app/tenant identifier sent with every batch. */
  appId?: string;
  /**
   * Root to observe: clicks, fields and submits outside of it are ignored.
   * Selector or element, defaults to the whole `document`.
   */
  root?: string | Element;
  /** Reuse an existing session id instead of generating one. */
  sessionId?: string;
  /** Events per batch before an automatic flush. Default 20. */
  batchSize?: number;
  /** Periodic flush interval in ms. Default 5000. `0` disables it. */
  flushIntervalMs?: number;
  /** Fraction of sessions that are recorded, 0..1. Default 1. */
  sampleRate?: number;
  /** Transport strategy. Default `beacon` (falls back to keepalive fetch). */
  transport?: 'beacon' | 'fetch' | 'none';
  /** Elements matching this selector are ignored entirely. */
  ignoreSelector?: string;
  /** Log every event to the console. Default false. */
  debug?: boolean;
  /** Overrides for the detector thresholds. */
  thresholds?: Partial<Thresholds>;
  /** Convenience hook, called for every event before listeners. */
  onEvent?: MetricListener;
}

/** Point-in-time view of everything Formatir knows about the session. */
export interface FormatirSnapshot {
  sessionId: string;
  startedAt: number;
  durationMs: number;
  step?: string;
  score: number;
  level: FrustrationLevel;
  signals: Record<string, number>;
  fields: FieldStats[];
  events: number;
  queued: number;
  submitted: boolean;
}
