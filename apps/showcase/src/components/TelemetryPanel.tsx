import { useMemo, useState } from 'react';
import type { FormatirEvent, FormatirInstance, FormatirSnapshot } from 'formatir';
import { METRIC_META, beaconPayload, clock, describe, fieldLabel, ms } from '../lib/format';
import { ScoreGauge } from './ScoreGauge';

const SIGNAL_TILES: { key: string; label: string }[] = [
  { key: 'rage_click', label: 'Rage Clicks' },
  { key: 'dead_click', label: 'Dead Clicks' },
  { key: 'hesitation', label: 'Zögern' },
  { key: 'validation_error', label: 'Validierung' },
  { key: 'refill', label: 'Refills' },
  { key: 'correction', label: 'Korrekturen' },
  { key: 'js_error', label: 'JS-Fehler' },
  { key: 'form_dropoff', label: 'Abbrüche' },
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
      title: 'Frustration steigt',
      detail: `Score ${snapshot.score}/100 - diese Session droht abzubrechen.`,
      tone: 'border-severe/40 bg-severe/10',
    });
  }
  if (s.rage_click) {
    out.push({
      id: 'rage',
      title: `${s.rage_click}× Rage Click`,
      detail: 'Wiederholte schnelle Klicks deuten auf ein nicht reagierendes Element hin.',
      tone: 'border-rose-400/40 bg-rose-500/10',
    });
  }
  if (s.js_error) {
    out.push({
      id: 'err',
      title: `${s.js_error} JavaScript-Fehler`,
      detail: 'Fehler während der Formular-Session - hohe Abbruchwahrscheinlichkeit.',
      tone: 'border-red-400/40 bg-red-500/10',
    });
  }
  if (s.dead_click) {
    out.push({
      id: 'dead',
      title: `${s.dead_click}× Klick ohne Wirkung`,
      detail: 'Nutzer halten ein statisches Element für interaktiv.',
      tone: 'border-orange-400/40 bg-orange-500/10',
    });
  }

  for (const field of snapshot.fields) {
    if (field.refills >= 2) {
      out.push({
        id: `refill-${field.key}`,
        title: `${fieldLabel(field.key)}: ${field.refills} Refills`,
        detail: 'Das Feld wurde mehrfach geleert und neu befüllt - Formulierung prüfen.',
        tone: 'border-amber-400/40 bg-amber-500/10',
      });
    }
    if (field.validationErrors >= 2) {
      out.push({
        id: `val-${field.key}`,
        title: `${fieldLabel(field.key)}: ${field.validationErrors} Fehlversuche`,
        detail: 'Die Validierungsregel ist offenbar schwer zu treffen.',
        tone: 'border-red-400/40 bg-red-500/10',
      });
    }
    if (field.hesitationMs >= 3000) {
      out.push({
        id: `hes-${field.key}`,
        title: `${fieldLabel(field.key)}: ${ms(field.hesitationMs)} Zögern`,
        detail: 'Lange Denkpause vor der ersten Eingabe - Hilfetext könnte fehlen.',
        tone: 'border-amber-400/40 bg-amber-500/10',
      });
    }
    if (field.corrections >= 12) {
      out.push({
        id: `corr-${field.key}`,
        title: `${fieldLabel(field.key)}: ${field.corrections} Korrekturen`,
        detail: 'Viel Nachbessern - Eingabeformat oder Maske überdenken.',
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

  const triggerError = () => {
    window.setTimeout(() => {
      throw new Error('Demo: Lebenslauf-Upload fehlgeschlagen (HTTP 502)');
    }, 0);
  };

  const triggerRejection = () => {
    void Promise.reject(new Error('Demo: /api/skills antwortet nicht'));
  };

  return (
    <aside
      data-formatir-ignore
      className="panel scroll-thin flex max-h-[calc(100vh-6rem)] flex-col overflow-y-auto lg:sticky lg:top-20"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-400/10 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-50">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping-slow" />
            Live-Telemetrie
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500">
            {snapshot?.sessionId ?? 'initialisiere …'}
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
            Hinweise
          </h3>
          <ul className="mt-2 space-y-2">
            {warnings.length ? (
              warnings.map((warning) => (
                <li key={warning.id} className={`rounded-lg border px-3 py-2 ${warning.tone}`}>
                  <p className="text-xs font-semibold text-slate-100">{warning.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                    {warning.detail}
                  </p>
                </li>
              ))
            ) : (
              <li className="panel-tight px-3 py-3 text-[11px] leading-relaxed text-slate-500">
                Noch keine Auffälligkeiten. Klicke dreimal schnell auf die Schrittanzeige, lass ein
                Feld lange leer oder leere ein ausgefülltes Feld wieder - die Detektoren schlagen
                sofort an.
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Feld-Aufwand
          </h3>
          <div className="scroll-thin mt-2 max-h-52 overflow-y-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-ink-900/95 text-slate-500">
                <tr>
                  <th className="py-1.5 pr-2 font-medium">Feld</th>
                  <th className="py-1.5 px-1 text-right font-medium" title="Anschläge">
                    ⌨
                  </th>
                  <th className="py-1.5 px-1 text-right font-medium" title="Korrekturen">
                    ⌫
                  </th>
                  <th className="py-1.5 px-1 text-right font-medium" title="Refills">
                    ↻
                  </th>
                  <th className="py-1.5 pl-1 text-right font-medium" title="Zögern">
                    ⏱
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {fields.length ? (
                  fields.map((field) => (
                    <tr key={field.key} className="border-t border-slate-400/10">
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
                      Noch kein Feld berührt.
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
              Event-Stream
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOnlySignals((v) => !v)}
                className={`btn btn-mini ${onlySignals ? 'btn-primary' : 'btn-ghost'}`}
              >
                Nur Signale
              </button>
              <button type="button" onClick={clearEvents} className="btn btn-ghost btn-mini">
                Leeren
              </button>
            </div>
          </div>

          <ul className="scroll-thin mt-2 max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {visible.length ? (
              visible.map((event) => {
                const meta = METRIC_META[event.type];
                return (
                  <li
                    key={event.id}
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
                Noch keine Events - fang links mit dem Formular an.
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Demo-Auslöser
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={triggerError} className="btn btn-ghost btn-mini">
              JS-Fehler
            </button>
            <button type="button" onClick={triggerRejection} className="btn btn-ghost btn-mini">
              Promise-Rejection
            </button>
            <button
              type="button"
              onClick={() => formatir?.reportDropoff()}
              className="btn btn-ghost btn-mini"
            >
              Abbruch melden
            </button>
            <button
              type="button"
              onClick={() => formatir?.track('demo_ping', { source: 'panel' })}
              className="btn btn-ghost btn-mini"
            >
              Custom Event
            </button>
          </div>
        </div>

        <details className="panel-tight px-3 py-2">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Beacon-Payload
          </summary>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Genau das würde per <code className="font-mono">navigator.sendBeacon</code> an dein
            <code className="font-mono"> endpoint</code> gehen - keine Klartext-Eingaben.
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
