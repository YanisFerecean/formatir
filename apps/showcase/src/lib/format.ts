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
  field_focus: { label: 'Fokus', tone: 'bg-slate-500/15 text-slate-300', weight: 0 },
  field_blur: { label: 'Blur', tone: 'bg-slate-500/15 text-slate-300', weight: 0 },
  rage_click: { label: 'Rage Click', tone: 'bg-rose-500/15 text-rose-300', weight: 5 },
  dead_click: { label: 'Dead Click', tone: 'bg-orange-500/15 text-orange-300', weight: 4 },
  hesitation: { label: 'Zögern', tone: 'bg-amber-500/15 text-amber-300', weight: 3 },
  field_effort: { label: 'Feld-Aufwand', tone: 'bg-sky-500/15 text-sky-300', weight: 2 },
  validation_error: { label: 'Validierung', tone: 'bg-red-500/15 text-red-300', weight: 4 },
  form_submit: { label: 'Absenden', tone: 'bg-emerald-500/15 text-emerald-300', weight: 1 },
  form_dropoff: { label: 'Abbruch', tone: 'bg-fuchsia-500/15 text-fuchsia-300', weight: 5 },
  js_error: { label: 'JS-Fehler', tone: 'bg-red-600/20 text-red-300', weight: 5 },
  score: { label: 'Score', tone: 'bg-violet-500/15 text-violet-300', weight: 1 },
  custom: { label: 'Custom', tone: 'bg-cyan-500/15 text-cyan-300', weight: 1 },
};

export const LEVEL_META: Record<FrustrationLevel, { label: string; color: string }> = {
  calm: { label: 'Entspannt', color: 'var(--color-calm)' },
  mild: { label: 'Leicht gereizt', color: 'var(--color-mild)' },
  elevated: { label: 'Erhöht', color: 'var(--color-elevated)' },
  severe: { label: 'Kritisch', color: 'var(--color-severe)' },
};

const VALIDITY_LABELS: Record<string, string> = {
  valueMissing: 'Pflichtfeld leer',
  typeMismatch: 'Falsches Format',
  patternMismatch: 'Muster nicht erfüllt',
  tooShort: 'Zu kurz',
  tooLong: 'Zu lang',
  rangeUnderflow: 'Wert zu klein',
  rangeOverflow: 'Wert zu groß',
  stepMismatch: 'Ungültiger Schritt',
  badInput: 'Ungültige Eingabe',
  belowMarketRate: 'Unplausibles Gehalt',
  invalid: 'Ungültig',
};

export const fieldLabel = (key?: string): string =>
  (key && FIELD_LABELS[key]) || key || 'unbekanntes Feld';

export const validityLabel = (reason: string): string => VALIDITY_LABELS[reason] ?? reason;

export const ms = (value: number): string =>
  value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`;

export const clock = (ts: number): string =>
  new Date(ts).toLocaleTimeString('de-DE', { hour12: false });

/** One-line, human readable summary of an event - used in the live stream. */
export function describe(event: FormatirEvent): string {
  const field = fieldLabel(event.field?.key);
  switch (event.type) {
    case 'session_start':
      return `Session gestartet · ${event.data.viewport.w}×${event.data.viewport.h}`;
    case 'field_focus':
      return `${field} fokussiert (${event.data.focusCount}×)`;
    case 'field_blur':
      return `${field} verlassen · ${ms(event.data.timeFocusedMs)} · ${event.data.length} Zeichen`;
    case 'rage_click':
      return `${event.data.count} Klicks in ${ms(event.data.withinMs)} · ${event.data.selector}`;
    case 'dead_click':
      return `Klick ohne Reaktion · ${event.data.selector}`;
    case 'hesitation':
      return event.data.abandoned
        ? `${field} nach ${ms(event.data.ms)} ohne Eingabe verlassen`
        : `${ms(event.data.ms)} bis zur ersten Eingabe in ${field}`;
    case 'field_effort':
      return `${field} · ${event.data.keystrokes} Anschläge, ${event.data.corrections} Korrekturen, ${event.data.refills} Refills`;
    case 'validation_error':
      return `${field} · ${validityLabel(event.data.reason)}`;
    case 'form_submit':
      return event.data.valid
        ? `Formular abgeschickt nach ${ms(event.data.durationMs)} · ${event.data.filled}/${event.data.fields} Felder`
        : `Absendeversuch blockiert · ${event.data.filled}/${event.data.fields} Felder ausgefüllt`;
    case 'form_dropoff':
      return `Abbruch bei ${fieldLabel(event.data.lastField?.key)} · ${Math.round(event.data.progress * 100)} % ausgefüllt`;
    case 'js_error':
      return `${event.data.kind === 'error' ? 'Fehler' : 'Rejection'}: ${event.data.message}`;
    case 'score':
      return `Frustrations-Score ${event.data.score} (${LEVEL_META[event.data.level].label})`;
    case 'custom':
      return String(event.data.name ?? 'custom');
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
