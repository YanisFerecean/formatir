import { memo, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { FormatirInstance } from 'formatir';
import { STEPS, type FieldDef } from '../data/steps';
import { Field } from './Field';

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Values = Record<string, string>;
type Errors = Record<string, string>;

/** Validation copy derived from the native ValidityState. */
function messageFor(el: FieldElement): string {
  const v = el.validity;
  if (v.valueMissing) {
    return el.type === 'checkbox'
      ? 'Please confirm to continue.'
      : 'This field is required.';
  }
  if (v.typeMismatch) {
    return el.type === 'email'
      ? 'Please enter a valid email address.'
      : 'Please enter a full URL (https://…).';
  }
  if (v.patternMismatch) return 'The format does not match.';
  if (v.tooShort) {
    const min = (el as HTMLInputElement).minLength;
    return `At least ${min} characters - currently ${el.value.length}.`;
  }
  if (v.rangeUnderflow) return 'The value is too small.';
  if (v.rangeOverflow) return 'The value is too large.';
  if (v.badInput) return 'The input could not be read.';
  return 'Invalid input.';
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
      out.salary = 'Below EUR 20,000 looks implausible - please check.';
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

  /** An unhandled rejection right after a click in the form - reported as `js_error`. */
  const simulateUpload = () => {
    void Promise.reject(new Error('Demo: CV upload failed (HTTP 502)'));
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
        <div>
          <div>
            <h2 className="text-xl font-semibold text-green-700">Application received</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Formatir marked the session as completed, so no abandonment is reported. Time
              taken: {(done.durationMs / 1000).toFixed(1)} s, frustration score at submit:{' '}
              {done.score}/100.
            </p>
            <button type="button" onClick={reset} className="btn btn-ghost mt-5" data-testid="restart">
              Start a new session
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    // Formatir's root: the form plus its step header (the dead-click demo).
    <section id="application" className="panel overflow-hidden" data-step={step.id}>
      <div className="border-b border-neutral-200 px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-blue-700">
              Application · Senior Frontend Engineer
            </p>
            <h2 className="mt-1 text-lg font-bold text-neutral-900">{step.title}</h2>
          </div>
          <span className="chip">
            Step {stepIndex + 1} / {STEPS.length}
          </span>
        </div>

        {/* Deliberately not clickable: a classic dead-click magnet. */}
        <ol className="mt-4 grid grid-cols-4 gap-2" data-testid="step-indicator">
          {STEPS.map((s, i) => (
            <li key={s.id} className="min-w-0">
              <div
                className={`h-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-blue-600' : 'bg-neutral-200'
                }`}
              />
              <span
                className={`mt-1.5 block truncate text-[11px] ${
                  i === stepIndex ? 'font-semibold text-neutral-800' : 'text-neutral-500'
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
        <p className="mb-5 text-sm text-neutral-600">{step.description}</p>

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
              <div
                data-testid="cv-dropzone"
                className="sm:col-span-2 rounded border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-neutral-700">Upload your CV</p>
                <p className="mt-1 text-xs text-neutral-500">
                  PDF or DOCX, max. 8 MB - drop the file here
                </p>
                <button
                  type="button"
                  onClick={simulateUpload}
                  data-testid="simulate-upload"
                  className="btn btn-ghost btn-mini mt-3"
                >
                  Simulate failed upload
                </button>
              </div>
            ) : null}

            {s.id === 'review' ? (
              <div className="sm:col-span-2 space-y-4">
                {summary.map((group) => (
                  <div key={group.title} className="panel-tight px-4 py-3">
                    <p className="text-xs font-semibold text-blue-700">
                      {group.title}
                    </p>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                      {group.entries.length ? (
                        group.entries.map((entry) => (
                          <div key={entry.label} className="flex justify-between gap-3 text-sm">
                            <dt className="text-neutral-500">{entry.label}</dt>
                            <dd className="truncate font-medium text-neutral-800">{entry.value}</dd>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-neutral-500">Nothing filled in yet.</p>
                      )}
                    </dl>
                  </div>
                ))}
                <p className="text-xs text-neutral-500">
                  This summary lives only in the demo's React state. Formatir sees nothing but
                  character counts, counters and time deltas.
                </p>
              </div>
            ) : null}
          </div>
        ))}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-5">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            data-testid="back"
            className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>

          {stepIndex < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn btn-primary" data-testid="next">
              Next
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" data-testid="submit">
              Submit application
            </button>
          )}
        </div>
      </form>
    </section>
  );
});
