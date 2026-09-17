import { memo, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { FormatirInstance } from 'formatir';
import { STEPS, type FieldDef } from '../data/steps';
import { Field } from './Field';

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Values = Record<string, string>;
type Errors = Record<string, string>;

/** German validation copy derived from the native ValidityState. */
function messageFor(el: FieldElement): string {
  const v = el.validity;
  if (v.valueMissing) {
    return el.type === 'checkbox'
      ? 'Bitte bestätigen, um fortzufahren.'
      : 'Dieses Feld ist ein Pflichtfeld.';
  }
  if (v.typeMismatch) {
    return el.type === 'email'
      ? 'Bitte eine gültige E-Mail-Adresse angeben.'
      : 'Bitte eine vollständige URL angeben (https://…).';
  }
  if (v.patternMismatch) return 'Das Format passt nicht zur Vorgabe.';
  if (v.tooShort) {
    const min = (el as HTMLInputElement).minLength;
    return `Mindestens ${min} Zeichen - aktuell ${el.value.length}.`;
  }
  if (v.rangeUnderflow) return 'Der Wert ist zu klein.';
  if (v.rangeOverflow) return 'Der Wert ist zu groß.';
  if (v.badInput) return 'Die Eingabe konnte nicht gelesen werden.';
  return 'Ungültige Eingabe.';
}

/**
 * Runs native constraint validation for one step. `checkValidity()` fires the
 * `invalid` event, which is exactly what Formatir's validation detector listens
 * for - no extra wiring needed.
 */
function collectErrors(container: HTMLElement | null): Errors {
  const errors: Errors = {};
  if (!container) return errors;
  const seen = new Set<string>();
  container.querySelectorAll<FieldElement>('input,select,textarea').forEach((el) => {
    if (!el.name || seen.has(el.name)) return;
    if (el.type === 'radio') seen.add(el.name);
    if (!el.checkValidity()) errors[el.name] = messageFor(el);
  });
  return errors;
}

interface Props {
  formatir: FormatirInstance | null;
}

/** Memoised: the telemetry panel re-renders every second, the form must not. */
export const ApplicationForm = memo(function ApplicationForm({ formatir }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<{ durationMs: number; score: number } | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const step = STEPS[stepIndex]!;

  useEffect(() => {
    formatir?.setStep(step.id);
  }, [formatir, step.id]);

  const setValue = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
  };

  /** Demo of `reportValidationError` for rules the browser cannot express. */
  const customErrors = (index: number): Errors => {
    const out: Errors = {};
    if (STEPS[index]?.id !== 'experience') return out;
    const salary = Number(values.salary);
    if (values.salary && salary > 0 && salary < 20000) {
      out.salary = 'Unter 20.000 EUR wirkt unplausibel - bitte prüfen.';
      formatir?.reportValidationError('salary', 'belowMarketRate');
    }
    return out;
  };

  const validate = (index: number): Errors => {
    const found = { ...collectErrors(stepRefs.current[index] ?? null), ...customErrors(index) };
    for (const key of Object.keys(found)) if (!found[key]) delete found[key];
    return found;
  };

  const focusFirst = (index: number, found: Errors) => {
    const first = Object.keys(found)[0];
    if (!first) return;
    const el = stepRefs.current[index]?.querySelector<FieldElement>(`[name="${first}"]`);
    el?.focus();
  };

  const goNext = () => {
    const found = validate(stepIndex);
    setErrors(found);
    if (Object.keys(found).length) return focusFirst(stepIndex, found);

    formatir?.track('step_completed', { step: step.id, index: stepIndex });
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    // The form is `noValidate`, so the submit event always reaches Formatir -
    // the SDK itself records whether the attempt was valid.
    event.preventDefault();

    for (let i = 0; i < STEPS.length; i++) {
      const found = validate(i);
      if (Object.keys(found).length) {
        setStepIndex(i);
        setErrors(found);
        window.setTimeout(() => focusFirst(i, found), 0);
        return;
      }
    }

    setErrors({});
    formatir?.markSubmitted();
    formatir?.track('application_submitted', { steps: STEPS.length });
    const snapshot = formatir?.getSnapshot();
    setDone({ durationMs: snapshot?.durationMs ?? 0, score: snapshot?.score ?? 0 });
  };

  const reset = () => {
    setValues({});
    setErrors({});
    setDone(null);
    setStepIndex(0);
  };

  const summary = useMemo(
    () =>
      STEPS.slice(0, 3).map((s) => ({
        title: s.short,
        entries: s.fields
          .map((f: FieldDef) => ({ label: f.label, value: values[f.name] ?? '' }))
          .filter((entry) => entry.value !== ''),
      })),
    [values],
  );

  if (done) {
    return (
      <section className="panel p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-xl">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-50">Bewerbung eingegangen</h2>
            <p className="mt-2 text-sm text-slate-400">
              Formatir hat die Session als abgeschlossen markiert - es wird also kein Abbruch
              gemeldet. Bearbeitungsdauer: {(done.durationMs / 1000).toFixed(1)} s,
              Frustrations-Score beim Absenden: {done.score}/100.
            </p>
            <button type="button" onClick={reset} className="btn btn-ghost mt-5">
              Neue Session starten
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-400/10 px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">
              Bewerbung · Senior Frontend Engineer
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-50">{step.title}</h2>
          </div>
          <span className="chip">
            Schritt {stepIndex + 1} / {STEPS.length}
          </span>
        </div>

        {/* Deliberately not clickable: a classic dead-click magnet. */}
        <ol className="mt-4 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li key={s.id} className="min-w-0">
              <div
                className={`h-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-brand-500' : 'bg-slate-500/25'
                }`}
              />
              <span
                className={`mt-1.5 block truncate text-[11px] ${
                  i === stepIndex ? 'font-semibold text-slate-200' : 'text-slate-500'
                }`}
              >
                {s.short}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <form
        id="application-form"
        data-formatir-form="bewerbung"
        noValidate
        onSubmit={onSubmit}
        className="px-5 py-6 sm:px-7"
      >
        <p className="mb-5 text-sm text-slate-400">{step.description}</p>

        {STEPS.map((s, i) => (
          <div
            key={s.id}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            hidden={i !== stepIndex}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {s.fields.map((def) => (
              <Field
                key={def.name}
                def={def}
                value={values[def.name] ?? ''}
                error={errors[def.name]}
                onChange={setValue}
              />
            ))}

            {s.id === 'experience' ? (
              /* Inert on purpose - clicking it produces a dead click. */
              <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-400/25 bg-slate-400/5 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-slate-300">Lebenslauf hochladen</p>
                <p className="mt-1 text-xs text-slate-500">
                  PDF oder DOCX, max. 8 MB - Datei hier ablegen
                </p>
              </div>
            ) : null}

            {s.id === 'review' ? (
              <div className="sm:col-span-2 space-y-4">
                {summary.map((group) => (
                  <div key={group.title} className="panel-tight px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                      {group.title}
                    </p>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                      {group.entries.length ? (
                        group.entries.map((entry) => (
                          <div key={entry.label} className="flex justify-between gap-3 text-sm">
                            <dt className="text-slate-500">{entry.label}</dt>
                            <dd className="truncate font-medium text-slate-200">{entry.value}</dd>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Noch nichts ausgefüllt.</p>
                      )}
                    </dl>
                  </div>
                ))}
                <p className="text-xs text-slate-500">
                  Diese Zusammenfassung lebt ausschließlich im React-State der Demo. Formatir sieht
                  davon nur Zeichenlängen, Zähler und Zeitabstände.
                </p>
              </div>
            ) : null}
          </div>
        ))}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-400/10 pt-5">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
          >
            Zurück
          </button>

          {stepIndex < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn btn-primary">
              Weiter
            </button>
          ) : (
            <button type="submit" className="btn btn-primary">
              Bewerbung absenden
            </button>
          )}
        </div>
      </form>
    </section>
  );
});
