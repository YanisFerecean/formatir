import { SectionHeading } from './ui';

const METRICS = [
  {
    icon: '🖱️',
    name: 'Rage Click Detector',
    threshold: '>= 3 clicks / 500 ms',
    text: 'Repeated frantic clicking on the same element or within a 32 px radius - the classic "this does not respond" signal.',
  },
  {
    icon: '💀',
    name: 'Dead Click Detector',
    threshold: '1000 ms without reaction',
    text: 'A click on a static element followed by no DOM mutation, navigation or focus change. Reveals misunderstood affordances.',
  },
  {
    icon: '⏱️',
    name: 'Hesitation Time Detector',
    threshold: '> 3000 ms to the first keystroke',
    text: 'Time between focus and the first input. A field left without any input is reported as abandoned.',
  },
  {
    icon: '✍️',
    name: 'Field Effort & Refill',
    threshold: 'per field',
    text: 'Keystrokes, corrections (Backspace/Delete), refills after clearing the field and validation errors - the effort per field at a glance.',
  },
  {
    icon: '🚪',
    name: 'Form Drop-off Detector',
    threshold: 'pagehide / visibilitychange',
    text: 'Detects the last field touched before abandoning or leaving the page - including progress and session duration, reliably delivered via beacon.',
  },
  {
    icon: '🐞',
    name: 'Error Tracker',
    threshold: 'error & unhandledrejection',
    text: 'Uncaught JavaScript errors while someone works in the form, linked to the field they were on. Email addresses and digit sequences are removed first.',
  },
];

/** Opt-in detectors from `formatir/extras` - all enabled in this demo. */
const EXTRAS = [
  {
    icon: '📋',
    name: 'paste()',
    metric: 'paste',
    text: 'Pasting into a field - and whether the page blocks it. Only the change in length is measured, never the content.',
  },
  {
    icon: '🪄',
    name: 'autofill()',
    metric: 'autofill',
    text: 'Fields the browser filled in, bundled into one event. Explains fields with a value but no effort.',
  },
  {
    icon: '↩️',
    name: 'revisits()',
    metric: 'field_revisit',
    text: 'Returning to a field after working on another one - typical after an error further down.',
  },
  {
    icon: '🧭',
    name: 'funnel()',
    metric: 'step_change',
    text: 'Step changes via setStep(), with time per step and detection of going back.',
  },
  {
    icon: '🌀',
    name: 'thrash()',
    metric: 'thrash',
    text: 'Frantic back-and-forth mouse movement - a sign of confusion or impatience. Thresholds are tunable.',
  },
];

export function Metrics() {
  return (
    <section id="metrics" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeading
        eyebrow="Detectors"
        title="Six signals conversion numbers cannot give you"
        description="Every detector is configurable on its own and emits typed events - evaluate them locally or send them straight to your collector."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((metric) => (
          <article key={metric.name} className="panel p-5 transition hover:border-brand-500/40">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500/15 text-lg">
                {metric.icon}
              </span>
              <h3 className="text-sm font-bold text-slate-50">{metric.name}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{metric.text}</p>
            <p className="mt-4 font-mono text-[11px] text-brand-300">{metric.threshold}</p>
          </article>
        ))}
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-bold text-slate-50">
          Extras <span className="font-mono text-sm font-medium text-brand-300">formatir/extras</span>
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Five optional detectors as plugins - not in the core bundle, 1.4 KB gzipped together and
          tree-shakeable.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {EXTRAS.map((extra) => (
            <article key={extra.name} className="panel p-4">
              <div className="flex items-center gap-2">
                <span className="text-base">{extra.icon}</span>
                <h4 className="font-mono text-sm font-bold text-slate-50">{extra.name}</h4>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{extra.text}</p>
              <p className="mt-3 font-mono text-[11px] text-brand-300">{extra.metric}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
