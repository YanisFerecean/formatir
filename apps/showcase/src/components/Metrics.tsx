import { SectionHeading } from './ui';

const METRICS = [
  {
    name: 'Rage Click Detector',
    threshold: '>= 3 clicks / 500 ms',
    text: 'Repeated frantic clicking on the same element or within a 32 px radius - the classic "this does not respond" signal.',
  },
  {
    name: 'Dead Click Detector',
    threshold: '1000 ms without reaction',
    text: 'A click on a static element followed by no DOM mutation, navigation or focus change. Reveals misunderstood affordances.',
  },
  {
    name: 'Hesitation Time Detector',
    threshold: '> 3000 ms to the first keystroke',
    text: 'Time between focus and the first input. A field left without any input is reported as abandoned.',
  },
  {
    name: 'Field Effort & Refill',
    threshold: 'per field',
    text: 'Keystrokes, corrections (Backspace/Delete), refills after clearing the field and validation errors - the effort per field at a glance.',
  },
  {
    name: 'Form Drop-off Detector',
    threshold: 'pagehide / visibilitychange',
    text: 'Detects the last field touched before abandoning or leaving the page - including progress and session duration, reliably delivered via beacon.',
  },
  {
    name: 'Error Tracker',
    threshold: 'error & unhandledrejection',
    text: 'Uncaught JavaScript errors while someone works in the form, linked to the field they were on. Email addresses and digit sequences are removed first.',
  },
];

/** Opt-in detectors from `formatir/extras` - all enabled in this demo. */
const EXTRAS = [
  {
    name: 'paste()',
    metric: 'paste',
    text: 'Pasting into a field - and whether the page blocks it. Only the change in length is measured, never the content.',
  },
  {
    name: 'autofill()',
    metric: 'autofill',
    text: 'Fields the browser filled in, bundled into one event. Explains fields with a value but no effort.',
  },
  {
    name: 'revisits()',
    metric: 'field_revisit',
    text: 'Returning to a field after working on another one - typical after an error further down.',
  },
  {
    name: 'funnel()',
    metric: 'step_change',
    text: 'Step changes via setStep(), with time per step and detection of going back.',
  },
  {
    name: 'thrash()',
    metric: 'thrash',
    text: 'Frantic back-and-forth mouse movement - a sign of confusion or impatience. Thresholds are tunable.',
  },
];

export function Metrics() {
  return (
    <section id="metrics" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <SectionHeading
        title="Detectors"
        description="Six signals conversion numbers cannot give you. Each detector is configurable and emits typed events - evaluate them locally or send them to your collector."
      />

      <div className="panel mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Detector</th>
              <th className="px-4 py-2 font-medium">Trigger</th>
              <th className="px-4 py-2 font-medium">What it tells you</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => (
              <tr key={metric.name} className="border-t border-neutral-200 align-top">
                <td className="whitespace-nowrap px-4 py-2.5 font-medium text-neutral-900">{metric.name}</td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-neutral-600">{metric.threshold}</td>
                <td className="px-4 py-2.5 text-neutral-700">{metric.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-10 text-base font-semibold text-neutral-900">
        Extras <span className="font-mono text-sm font-normal text-neutral-500">formatir/extras</span>
      </h3>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Five optional detectors as plugins - not in the core bundle, 1.4 KB gzipped together.
      </p>
      <div className="panel mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Plugin</th>
              <th className="px-4 py-2 font-medium">Event</th>
              <th className="px-4 py-2 font-medium">What it tells you</th>
            </tr>
          </thead>
          <tbody>
            {EXTRAS.map((extra) => (
              <tr key={extra.name} className="border-t border-neutral-200 align-top">
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-neutral-900">{extra.name}</td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-neutral-600">{extra.metric}</td>
                <td className="px-4 py-2.5 text-neutral-700">{extra.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
