import { useMemo, useState } from 'react';
import type { FormatirEvent, FormatirInstance, FormatirSnapshot } from 'formatir';
import { METRIC_META, beaconPayload, clock, describe, fieldLabel, ms } from '../lib/format';
import { ScoreGauge } from './ScoreGauge';

const SIGNAL_TILES: { key: string; label: string }[] = [
  { key: 'rage_click', label: 'Rage Clicks' },
  { key: 'dead_click', label: 'Dead Clicks' },
  { key: 'hesitation', label: 'Hesitation' },
  { key: 'validation_error', label: 'Validation' },
  { key: 'refill', label: 'Refills' },
  { key: 'correction', label: 'Corrections' },
  { key: 'js_error', label: 'JS errors' },
  { key: 'form_dropoff', label: 'Drop-offs' },
];

interface Warning {
  id: string;
  title: string;
  detail: string;
  tone: string;
}

function buildWarnings(snapshot: FormatirSnapshot): Warning[] {
  const out: Warning[] = [];
  const s = snapshot.signals;

  if (snapshot.level === 'severe' || snapshot.level === 'elevated') {
    out.push({
      id: 'score',
      title: 'Frustration is rising',
      detail: `Score ${snapshot.score}/100 - this session is at risk of being abandoned.`,
      tone: 'border-severe/40 bg-severe/10',
    });
  }
  if (s.rage_click) {
    out.push({
      id: 'rage',
      title: `${s.rage_click}× Rage Click`,
      detail: 'Repeated fast clicks point to an element that does not respond.',
      tone: 'border-rose-400/40 bg-rose-500/10',
    });
  }
  if (s.js_error) {
    out.push({
      id: 'err',
      title: `${s.js_error} JavaScript error${s.js_error === 1 ? '' : 's'}`,
      detail: 'Errors during the form session - a high risk of abandonment.',
      tone: 'border-red-400/40 bg-red-500/10',
    });
  }
  if (s.dead_click) {
    out.push({
      id: 'dead',
      title: `${s.dead_click}× click without effect`,
      detail: 'Users take a static element for an interactive one.',
      tone: 'border-orange-400/40 bg-orange-500/10',
    });
  }

  for (const field of snapshot.fields) {
    if (field.refills >= 2) {
      out.push({
        id: `refill-${field.key}`,
        title: `${fieldLabel(field.key)}: ${field.refills} Refills`,
        detail: 'The field was cleared and refilled several times - review its wording.',
        tone: 'border-amber-400/40 bg-amber-500/10',
      });
    }
    if (field.validationErrors >= 2) {
      out.push({
        id: `val-${field.key}`,
        title: `${fieldLabel(field.key)}: ${field.validationErrors} failed attempts`,
        detail: 'The validation rule is apparently hard to meet.',
        tone: 'border-red-400/40 bg-red-500/10',
      });
    }
    if (field.hesitationMs >= 3000) {
      out.push({
        id: `hes-${field.key}`,
        title: `${fieldLabel(field.key)}: ${ms(field.hesitationMs)} hesitation`,
        detail: 'A long pause before the first input - a help text may be missing.',
        tone: 'border-amber-400/40 bg-amber-500/10',
      });
    }
    if (field.corrections >= 12) {
      out.push({
        id: `corr-${field.key}`,
        title: `${fieldLabel(field.key)}: ${field.corrections} corrections`,
        detail: 'Lots of fixing - reconsider the input format or mask.',
        tone: 'border-sky-400/40 bg-sky-500/10',
      });
    }
  }

  return out.slice(0, 6);
}

interface Props {
  formatir: FormatirInstance | null;
  events: FormatirEvent[];
  snapshot: FormatirSnapshot | null;
  clearEvents: () => void;
}

export function TelemetryPanel({ formatir, events, snapshot, clearEvents }: Props) {
  const [onlySignals, setOnlySignals] = useState(false);

  const warnings = useMemo(() => (snapshot ? buildWarnings(snapshot) : []), [snapshot]);
  const visible = useMemo(
    () => (onlySignals ? events.filter((e) => METRIC_META[e.type].weight >= 3) : events),
    [events, onlySignals],
  );
  const fields = useMemo(
    () =>
      (snapshot?.fields ?? [])
        .filter((f) => f.focusCount > 0)
        .sort((a, b) => b.corrections + b.refills * 5 - (a.corrections + a.refills * 5)),
    [snapshot],
  );

  // The panel is outside the form, and the demo uses `errorScope: 'root'`, so
  // this error is deliberately *not* reported. The form's "Simulate failed
  // upload" button shows the counterpart.
  const triggerOutsideError = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.setTimeout(() => {
      throw new Error('Demo: chat widget crashed');
    }, 0);
  };

  return (
    <aside
      data-formatir-ignore
      data-testid="telemetry"
      aria-label="Live telemetry"
      className="panel scroll-thin flex max-h-[calc(100vh-6rem)] flex-col overflow-y-auto lg:sticky lg:top-20"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-400/10 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-50">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping-slow" />
            Live telemetry
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500" data-testid="session-id">
            {snapshot?.sessionId ?? 'initialising …'}
          </p>
        </div>
        <span className="chip">transport: none</span>
      </div>

      <div className="space-y-5 px-5 py-5">
        <ScoreGauge
          score={snapshot?.score ?? 0}
          level={snapshot?.level ?? 'calm'}
          events={snapshot?.events ?? 0}
        />

        <div className="grid grid-cols-4 gap-2">
          {SIGNAL_TILES.map((tile) => {
            const value = snapshot?.signals[tile.key] ?? 0;
            return (
              <div
                key={tile.key}
                className={`panel-tight px-2 py-2 text-center ${value ? 'border-brand-500/40' : ''}`}
                title={tile.label}
                data-testid={`signal-${tile.key}`}
                data-value={value}
              >
                <div
                  className={`text-base font-bold ${value ? 'text-brand-300' : 'text-slate-600'}`}
                >
                  {Math.round(value)}
                </div>
                <div className="truncate text-[9.5px] uppercase tracking-wide text-slate-500">
                  {tile.label}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Insights
          </h3>
          <ul className="mt-2 space-y-2" data-testid="insights">
            {warnings.length ? (
              warnings.map((warning) => (
                <li
                  key={warning.id}
                  data-insight={warning.id}
                  className={`rounded-lg border px-3 py-2 ${warning.tone}`}
                >
                  <p className="text-xs font-semibold text-slate-100">{warning.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                    {warning.detail}
                  </p>
                </li>
              ))
            ) : (
              <li className="panel-tight px-3 py-3 text-[11px] leading-relaxed text-slate-500">
                Nothing unusual yet. Click the step indicator three times quickly, leave a field
                empty for a while or clear a filled-in field - the detectors fire right away.
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Field effort
          </h3>
          <div className="scroll-thin mt-2 max-h-52 overflow-y-auto">
            <table className="w-full text-left text-[11px]" data-testid="field-effort">
              <thead className="sticky top-0 bg-ink-900/95 text-slate-500">
                <tr>
                  <th className="py-1.5 pr-2 font-medium">Field</th>
                  <th className="py-1.5 px-1 text-right font-medium" title="Keystrokes">
                    ⌨
                  </th>
                  <th className="py-1.5 px-1 text-right font-medium" title="Corrections">
                    ⌫
                  </th>
                  <th className="py-1.5 px-1 text-right font-medium" title="Refills">
                    ↻
                  </th>
                  <th className="py-1.5 pl-1 text-right font-medium" title="Hesitation">
                    ⏱
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {fields.length ? (
                  fields.map((field) => (
                    <tr
                      key={field.key}
                      className="border-t border-slate-400/10"
                      data-field={field.key}
                      data-keystrokes={field.keystrokes}
                      data-corrections={field.corrections}
                      data-refills={field.refills}
                      data-hesitation-ms={field.hesitationMs}
                    >
                      <td className="truncate py-1.5 pr-2 font-medium text-slate-200">
                        {fieldLabel(field.key)}
                      </td>
                      <td className="px-1 text-right tabular-nums">{field.keystrokes}</td>
                      <td
                        className={`px-1 text-right tabular-nums ${field.corrections >= 10 ? 'text-amber-300' : ''}`}
                      >
                        {field.corrections}
                      </td>
                      <td
                        className={`px-1 text-right tabular-nums ${field.refills ? 'text-rose-300' : ''}`}
                      >
                        {field.refills}
                      </td>
                      <td className="pl-1 text-right tabular-nums">
                        {field.hesitationMs ? ms(field.hesitationMs) : '–'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-3 text-slate-500">
                      No field touched yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Event stream
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOnlySignals((v) => !v)}
                className={`btn btn-mini ${onlySignals ? 'btn-primary' : 'btn-ghost'}`}
              >
                Signals only
              </button>
              <button type="button" onClick={clearEvents} className="btn btn-ghost btn-mini">
                Clear
              </button>
            </div>
          </div>

          <ul
            className="scroll-thin mt-2 max-h-72 space-y-1.5 overflow-y-auto pr-1"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Event stream, newest first"
            data-testid="event-stream"
          >
            {visible.length ? (
              visible.map((event) => {
                const meta = METRIC_META[event.type];
                return (
                  <li
                    key={event.id}
                    data-event-type={event.type}
                    data-field={event.field?.key}
                    className="animate-slide-in rounded-lg border border-slate-400/10 bg-ink-950/60 px-2.5 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`chip border-transparent ${meta.tone}`}>{meta.label}</span>
                      <span className="font-mono text-[10px] text-slate-600">{clock(event.ts)}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                      {describe(event)}
                    </p>
                  </li>
                );
              })
            ) : (
              <li className="panel-tight px-3 py-3 text-[11px] text-slate-500">
                No events yet - start with the form on the left.
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Demo triggers
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={triggerOutsideError}
              data-testid="outside-error"
              className="btn btn-ghost btn-mini"
            >
              JS error outside the form
            </button>
            <button
              type="button"
              onClick={() => formatir?.reportDropoff()}
              data-testid="report-dropoff"
              className="btn btn-ghost btn-mini"
            >
              Report drop-off
            </button>
            <button
              type="button"
              onClick={() => formatir?.track('demo_ping', { source: 'panel' })}
              data-testid="custom-event"
              className="btn btn-ghost btn-mini"
            >
              Custom event
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Only errors that happen while someone works in the form are reported (
            <code className="font-mono">errorScope: 'root'</code>) - the button above is ignored.
            Try <em>Simulate failed upload</em> in step 2 instead.
          </p>
        </div>

        <details className="panel-tight px-3 py-2">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Beacon-Payload
          </summary>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Exactly this would go to your <code className="font-mono">endpoint</code> via{' '}
            <code className="font-mono">navigator.sendBeacon</code> - no typed input.
          </p>
          <pre className="scroll-thin mt-2 max-h-56 overflow-auto rounded-lg bg-ink-950/80 p-2.5 font-mono text-[10px] leading-relaxed text-slate-300">
            {beaconPayload(
              snapshot?.sessionId ?? '-',
              formatir?.version ?? '0.0.0',
              events,
            )}
          </pre>
        </details>
      </div>
    </aside>
  );
}
