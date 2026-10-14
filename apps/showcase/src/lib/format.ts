import type { FormatirEvent, FrustrationLevel, MetricName } from 'formatir';
import { FIELD_LABELS } from '../data/steps';

export interface MetricMeta {
  label: string;
  /** Tailwind classes for the badge. */
  tone: string;
  /** Severity ranking used for filtering and ordering. */
  weight: number;
}

export const METRIC_META: Record<MetricName, MetricMeta> = {
  session_start: { label: 'Session', tone: 'bg-slate-500/15 text-slate-300', weight: 0 },
  field_focus: { label: 'Focus', tone: 'bg-slate-500/15 text-slate-300', weight: 0 },
  field_blur: { label: 'Blur', tone: 'bg-slate-500/15 text-slate-300', weight: 0 },
  rage_click: { label: 'Rage Click', tone: 'bg-rose-500/15 text-rose-300', weight: 5 },
  dead_click: { label: 'Dead Click', tone: 'bg-orange-500/15 text-orange-300', weight: 4 },
  hesitation: { label: 'Hesitation', tone: 'bg-amber-500/15 text-amber-300', weight: 3 },
  field_effort: { label: 'Field effort', tone: 'bg-sky-500/15 text-sky-300', weight: 2 },
  validation_error: { label: 'Validation', tone: 'bg-red-500/15 text-red-300', weight: 4 },
  form_submit: { label: 'Submit', tone: 'bg-emerald-500/15 text-emerald-300', weight: 1 },
  form_dropoff: { label: 'Drop-off', tone: 'bg-fuchsia-500/15 text-fuchsia-300', weight: 5 },
  js_error: { label: 'JS error', tone: 'bg-red-600/20 text-red-300', weight: 5 },
  score: { label: 'Score', tone: 'bg-violet-500/15 text-violet-300', weight: 1 },
  custom: { label: 'Custom', tone: 'bg-cyan-500/15 text-cyan-300', weight: 1 },
  paste: { label: 'Paste', tone: 'bg-teal-500/15 text-teal-300', weight: 1 },
  autofill: { label: 'Autofill', tone: 'bg-teal-500/15 text-teal-300', weight: 0 },
  field_revisit: { label: 'Revisit', tone: 'bg-amber-500/15 text-amber-300', weight: 2 },
  step_change: { label: 'Step', tone: 'bg-indigo-500/15 text-indigo-300', weight: 1 },
  thrash: { label: 'Thrash', tone: 'bg-orange-500/15 text-orange-300', weight: 3 },
};

export const LEVEL_META: Record<FrustrationLevel, { label: string; color: string }> = {
  calm: { label: 'Calm', color: 'var(--color-calm)' },
  mild: { label: 'Mildly irritated', color: 'var(--color-mild)' },
  elevated: { label: 'Elevated', color: 'var(--color-elevated)' },
  severe: { label: 'Critical', color: 'var(--color-severe)' },
};

const VALIDITY_LABELS: Record<string, string> = {
  valueMissing: 'Required field empty',
  typeMismatch: 'Wrong format',
  patternMismatch: 'Pattern not matched',
  tooShort: 'Too short',
  tooLong: 'Too long',
  rangeUnderflow: 'Value too small',
  rangeOverflow: 'Value too large',
  stepMismatch: 'Invalid step',
  badInput: 'Invalid input',
  belowMarketRate: 'Implausible salary',
  invalid: 'Invalid',
};

export const fieldLabel = (key?: string): string =>
  (key && FIELD_LABELS[key]) || key || 'unknown field';

export const validityLabel = (reason: string): string => VALIDITY_LABELS[reason] ?? reason;

export const ms = (value: number): string =>
  value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`;

export const clock = (ts: number): string =>
  new Date(ts).toLocaleTimeString('en-GB', { hour12: false });

/** One-line, human readable summary of an event - used in the live stream. */
export function describe(event: FormatirEvent): string {
  const field = fieldLabel(event.field?.key);
  switch (event.type) {
    case 'session_start':
      return `Session started · ${event.data.viewport.w}×${event.data.viewport.h}`;
    case 'field_focus':
      return `${field} focused (${event.data.focusCount}×)`;
    case 'field_blur':
      return `${field} left · ${ms(event.data.timeFocusedMs)} · ${event.data.length} characters`;
    case 'rage_click':
      return `${event.data.count} clicks in ${ms(event.data.withinMs)} · ${event.data.selector}`;
    case 'dead_click':
      return `Click without reaction · ${event.data.selector}`;
    case 'hesitation':
      return event.data.abandoned
        ? `${field} left after ${ms(event.data.ms)} without input`
        : `${ms(event.data.ms)} until the first input in ${field}`;
    case 'field_effort':
      return `${field} · ${event.data.keystrokes} keystrokes, ${event.data.corrections} corrections, ${event.data.refills} refills`;
    case 'validation_error':
      return `${field} · ${validityLabel(event.data.reason)}`;
    case 'form_submit':
      return event.data.valid
        ? `Form submitted after ${ms(event.data.durationMs)} · ${event.data.filled}/${event.data.fields} fields`
        : `Submit attempt blocked · ${event.data.filled}/${event.data.fields} fields filled`;
    case 'form_dropoff':
      return `Abandoned at ${fieldLabel(event.data.lastField?.key)} · ${Math.round(event.data.progress * 100)} % filled`;
    case 'js_error':
      return `${event.data.kind === 'error' ? 'Error' : 'Rejection'}: ${event.data.message}`;
    case 'score':
      return `Frustration score ${event.data.score} (${LEVEL_META[event.data.level].label})`;
    case 'custom':
      return String(event.data.name ?? 'custom');
    case 'paste':
      return event.data.blocked
        ? `Paste into ${field} blocked`
        : `${field} · ${event.data.delta} characters pasted (${event.data.pastes}×)`;
    case 'autofill':
      return `Browser autofill · ${event.data.fields.map(fieldLabel).join(', ')}`;
    case 'field_revisit':
      return `Back to ${field} (visit ${event.data.visits})`;
    case 'step_change':
      return `${event.data.back ? 'Back' : 'On'} to ${event.data.to ?? '-'} · ${ms(event.data.durationMs)} on ${event.data.from ?? 'start'}`;
    case 'thrash':
      return `Erratic mouse movement · ${event.data.reversals} direction changes in ${ms(event.data.withinMs)}`;
  }
}

/** Mirrors the envelope the SDK would POST to `endpoint`. */
export const beaconPayload = (
  sessionId: string,
  version: string,
  events: FormatirEvent[],
): string =>
  JSON.stringify(
    {
      sdk: 'formatir',
      v: version,
      appId: 'formatir-showcase',
      sessionId,
      sentAt: Date.now(),
      reason: 'batch',
      events: events.slice(0, 3),
    },
    null,
    2,
  );
