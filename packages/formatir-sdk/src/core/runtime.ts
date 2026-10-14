import type {
  FieldStats,
  FormatirEvent,
  FormatirOptions,
  FormatirSnapshot,
  MetricListener,
  MetricName,
  MetricPayloads,
  Thresholds,
} from '../types';
import type { DetectorContext, ResolvedOptions, SessionState } from './context';
import { createEmitter } from './emitter';
import { createScorer } from './score';
import { createTransport } from './transport';
import { fieldKey, fieldType, formOf, isField, type FieldElement } from './dom';
import { noop, read, store, uid } from './util';

/** `localStorage` key that remembers an opt-out across page loads. */
export const OPT_OUT_KEY = 'formatir:optout';

const optedOut = (): boolean => read(OPT_OUT_KEY) === '1';

/** Run a user hook; a throwing hook drops the event instead of breaking the page. */
function safeCall<A, R>(fn: (a: A) => R, a: A): R | undefined {
  try {
    return fn(a);
  } catch {
    return undefined;
  }
}
import { rageClick } from '../detectors/rageClick';
import { deadClick } from '../detectors/deadClick';
import { hesitation } from '../detectors/hesitation';
import { fieldEffort } from '../detectors/fieldEffort';
import { dropOff } from '../detectors/dropOff';
import { errorTracker } from '../detectors/errorTracker';

export const VERSION: string =
  typeof __FORMATIR_VERSION__ === 'string' ? __FORMATIR_VERSION__ : '0.0.0';

const THRESHOLDS: Thresholds = {
  rageClicks: 3,
  rageWindowMs: 500,
  rageRadiusPx: 32,
  deadClickMs: 1000,
  hesitationMs: 3000,
};

/**
 * Detector order matters: `hesitation` must see `focusout` before `fieldEffort`
 * clears the focus bookkeeping.
 */
const DETECTORS = [rageClick, deadClick, hesitation, fieldEffort, dropOff, errorTracker];

export interface FormatirInstance {
  readonly sessionId: string;
  readonly version: string;
  /** False when the session was not sampled or the DOM is unavailable. */
  readonly enabled: boolean;
  /** True while detectors are attached and events are collected. */
  readonly active: boolean;
  /** Attach the detectors (needed with `autoStart: false`, e.g. after consent). */
  start(): void;
  /** Detach the detectors but keep the session; `start()` resumes it. */
  stop(): void;
  /** Clear a stored opt-out and start collecting. */
  optIn(): void;
  /** Stop, discard queued events and remember the choice in `localStorage`. */
  optOut(): void;
  /** Subscribe to a metric (or `'*'` for every event). Returns an unsubscribe. */
  on<K extends MetricName>(metric: K | '*', listener: MetricListener<K>): () => void;
  off<K extends MetricName>(metric: K | '*', listener: MetricListener<K>): void;
  /** Emit a custom event alongside the behavioural metrics. */
  track(name: string, data?: Record<string, unknown>): void;
  /** Tag subsequent events with a logical step (wizard page, fieldset, ...). */
  setStep(step: string | undefined): void;
  /** Report a framework-level validation error (React Hook Form, Zod, ...). */
  reportValidationError(field: string | Element, reason?: string): void;
  /** Mark the form as completed so no drop-off is reported. */
  markSubmitted(): void;
  /** Report an abandonment explicitly, e.g. on an SPA route change. */
  reportDropoff(): void;
  /** Everything Formatir currently knows about the session. */
  getSnapshot(): FormatirSnapshot;
  /** Send all queued events now. */
  flush(): void;
  /** Detach all listeners and stop collecting. */
  destroy(): void;
}

function resolve(options: FormatirOptions): ResolvedOptions {
  return {
    batchSize: 20,
    flushIntervalMs: 5000,
    sampleRate: 1,
    transport: 'beacon',
    ignoreSelector: '[data-formatir-ignore]',
    debug: false,
    redactErrors: true,
    autoStart: true,
    offline: true,
    ...options,
    thresholds: { ...THRESHOLDS, ...options.thresholds },
  };
}

export function createInstance(options: FormatirOptions = {}): FormatirInstance {
  const opts = resolve(options);
  const sessionId = opts.sessionId || uid('fmt_');
  const emitter = createEmitter(opts.debug);
  const state: SessionState = {
    startedAt: Date.now(),
    fields: new Map<string, FieldStats>(),
    emptied: new Set<string>(),
    submitted: false,
    dropped: false,
  };

  const sampled = Math.random() < opts.sampleRate;
  const enabled = sampled && typeof document !== 'undefined';
  const transport = createTransport(opts, sessionId, VERSION);
  const scorer = createScorer(opts.score);

  const teardown: (() => void)[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];
  let events = 0;
  let lastScore = -1;
  let dead = false;

  const root: Document | Element =
    (typeof opts.root === 'string' ? document.querySelector(opts.root) : opts.root) ||
    (typeof document !== 'undefined' ? document : (null as never));

  function emit<K extends MetricName>(
    type: K,
    data: MetricPayloads[K],
    field?: FormatirEvent['field'],
  ): void {
    if (dead) return;
    const event = {
      id: uid(),
      type,
      ts: Date.now(),
      t: Date.now() - state.startedAt,
      sessionId,
      step: state.step,
      field,
      data,
    } as FormatirEvent;

    events++;
    if (opts.debug) console.debug('[formatir]', type, data);
    opts.onEvent?.(event);
    emitter.emit(event);
    const out = opts.beforeSend ? safeCall(opts.beforeSend, event) : event;
    if (out) transport.push(out);

    if (type === 'score') return;
    scorer.add(type);
    const score = scorer.score();
    if (score !== lastScore) {
      lastScore = score;
      emit('score', { score, level: scorer.level(), signals: scorer.signals() });
    }
  }

  const ensure = (key: string, type: string, form?: string): FieldStats => {
    let s = state.fields.get(key);
    if (!s) {
      s = {
        key,
        type,
        keystrokes: 0,
        corrections: 0,
        refills: 0,
        validationErrors: 0,
        focusCount: 0,
        timeFocusedMs: 0,
        hesitationMs: 0,
        length: 0,
        changed: false,
      };
      state.fields.set(key, s);
    }
    if (form) s.form = form;
    if (state.step) s.step = state.step;
    return s;
  };

  const ctx: DetectorContext = {
    opts,
    root,
    state,
    emit,
    signal: (name, amount) => {
      scorer.add(name, amount);
    },
    stats: (el: FieldElement) => ensure(fieldKey(el), fieldType(el), formOf(el)),
    on(target, type, fn, capture) {
      const handler = fn as EventListener;
      target.addEventListener(type, handler, capture);
      teardown.push(() => target.removeEventListener(type, handler, capture));
    },
    timer(fn, ms) {
      const id = setTimeout(fn, ms);
      timers.push(id);
    },
    cleanup: (fn) => void teardown.push(fn),
    ignored: (el) => !!el && !!opts.ignoreSelector && !!el.closest(opts.ignoreSelector),
    inScope: (el) => !!el && (root === document || (root as Element).contains(el)),
    watches: (el) => ctx.inScope(el) && !ctx.ignored(el),
    hooks: {},
  };

  let active = false;
  let started = false;

  const start = (): void => {
    if (active || dead || !enabled || optedOut()) return;
    active = true;
    for (const detector of DETECTORS) detector(ctx);

    // Registered after the detectors so their unload events make it into the batch.
    ctx.on(window, 'pagehide', () => transport.flush('pagehide'));
    ctx.on(document, 'visibilitychange', () => {
      if (document.visibilityState === 'hidden') transport.flush('hidden');
    });
    ctx.on(window, 'online', transport.replay);
    transport.replay();

    if (started) return;
    started = true;
    emit('session_start', {
      url: location.href,
      referrer: document.referrer,
      viewport: { w: innerWidth, h: innerHeight },
      language: navigator.language,
    });
  };

  const stop = (): void => {
    for (const fn of teardown) fn();
    for (const id of timers) clearTimeout(id);
    teardown.length = timers.length = 0;
    ctx.hooks = {};
    active = false;
  };

  if (opts.autoStart) start();

  return {
    sessionId,
    version: VERSION,
    enabled,
    get active() {
      return active;
    },
    start,
    stop() {
      stop();
      transport.flush('stop');
    },
    optIn() {
      store(OPT_OUT_KEY, null);
      start();
    },
    optOut() {
      store(OPT_OUT_KEY, '1');
      stop();
      transport.clear();
    },
    on: (metric, listener) => emitter.on(metric, listener as MetricListener),
    off: (metric, listener) => emitter.off(metric, listener as MetricListener),
    track: (name, data) => emit('custom', { name, ...data }),
    setStep(step) {
      state.step = step;
    },
    reportValidationError(field, reason = 'invalid') {
      const el = typeof field === 'string' ? null : field;
      const known = el && isField(el) ? el : null;
      const key = known ? fieldKey(known) : String(field);
      const stats = known
        ? ensure(key, fieldType(known), formOf(known))
        : ensure(key, state.fields.get(key)?.type || 'custom');
      stats.validationErrors++;
      emit('validation_error', { reason }, { key, type: stats.type, form: stats.form, step: state.step });
    },
    markSubmitted() {
      state.submitted = true;
    },
    reportDropoff: () => (ctx.hooks.dropoff || noop)(),
    getSnapshot: (): FormatirSnapshot => ({
      sessionId,
      startedAt: state.startedAt,
      durationMs: Date.now() - state.startedAt,
      step: state.step,
      score: scorer.score(),
      level: scorer.level(),
      signals: scorer.signals(),
      fields: [...state.fields.values()],
      events,
      queued: transport.size(),
      submitted: state.submitted,
    }),
    flush: () => transport.flush('manual'),
    destroy() {
      if (dead) return;
      stop();
      dead = true;
      transport.dispose();
      emitter.clear();
    },
  };
}
