import { useState } from 'react';
import { CodeBlock, SectionHeading } from './ui';

const TABS = {
  React: `import { FormatirProvider, useFormatirEvent } from 'formatir/react';

export function App() {
  return (
    <FormatirProvider endpoint="/api/formatir" root="#application-form">
      <ApplicationForm />
    </FormatirProvider>
  );
}

function ApplicationForm() {
  useFormatirEvent('form_dropoff', (event) => {
    console.warn('Abandoned at', event.data.lastField?.key);
  });

  return <form id="application-form">{/* … */}</form>;
}`,
  Vue: `// main.ts
import { FormatirPlugin } from 'formatir/vue';

createApp(App)
  .use(FormatirPlugin, { endpoint: '/api/formatir' })
  .mount('#app');

// Component (<script setup>)
import { useFormatirEvent } from 'formatir/vue';

useFormatirEvent('hesitation', (e) => track(e.field?.key, e.data.ms));`,
  Svelte: `<script>
  import { formatir } from 'formatir/svelte';
  let tracker;
</script>

<!-- The element becomes the observed root -->
<form use:formatir={{
  endpoint: '/api/formatir',
  onInstance: (f) => (tracker = f),
}}>
  …
</form>`,
  HTML: `<form id="application-form"> … </form>

<script src="https://unpkg.com/formatir/dist/index.global.js"></script>
<script src="https://unpkg.com/formatir/dist/extras.global.js"></script>
<script>
  var formatir = Formatir.init({
    endpoint: '/api/formatir',
    root: '#application-form',
    plugins: [FormatirExtras.paste(), FormatirExtras.funnel()],
  });

  formatir.on('rage_click', function (event) {
    console.warn('rage click', event.data.selector);
  });
</script>`,
  Validation: `// React Hook Form: only the error type, never the message
import { formatirOnInvalid } from 'formatir/react-hook-form';

<form onSubmit={handleSubmit(onValid, formatirOnInvalid(formatir))}>

// Zod: issue codes per path (address.zip → too_small)
import { withFormatir } from 'formatir/zod';

const result = withFormatir(formatir, ApplicationSchema)
  .safeParse(values);`,
  Server: `// Fetch-API: Node >= 18, Deno, Bun, Workers, Hono
import { createHandler, toNodeListener } from 'formatir/server';

const handler = createHandler({
  onBatch: (batch) => db.insert('events', batch.events),
  appIds: ['careers-portal'],
});

export default { fetch: handler };            // Workers / Bun
app.post('/api/formatir', toNodeListener(handler)); // Express

// 204 stored · 400 invalid · 500 → the SDK retries later`,
} as const;

type TabName = keyof typeof TABS;

const OPTIONS: [string, string, string][] = [
  ['endpoint', '–', 'Collector URL. Without it everything stays in the browser.'],
  ['appId', '–', 'Sent with every batch.'],
  ['root', 'document', 'Selector or element to observe; a selector follows re-renders.'],
  ['sessionId', 'generated', 'Reuse an existing session id.'],
  ['autoStart', 'true', 'false waits for start() / optIn() - e.g. after consent.'],
  ['batchSize', '20', 'Events per batch before an automatic flush.'],
  ['flushIntervalMs', '5000', 'Periodic flush; 0 disables it.'],
  ['sampleRate', '1', 'Share of sessions that are recorded.'],
  ['transport', "'beacon'", "'beacon' | 'fetch' | 'none'."],
  ['offline', 'true', 'Keep undelivered batches and resend them later.'],
  ['ignoreSelector', '[data-formatir-ignore]', 'Opt-out for whole subtrees.'],
  ['thresholds', 'see detectors', 'Thresholds per detector.'],
  ['score', 'see docs', 'Weights, saturation and levels of the frustration score.'],
  ['plugins', '[]', 'Extra detectors, e.g. from formatir/extras.'],
  ['errorScope', "'page'", "'root' reports only errors while the user works in the root."],
  ['redactErrors', 'true', 'Remove emails and digit sequences from js_error.'],
  ['beforeSend', '–', 'Rewrite an event, or drop it with null, before it is sent.'],
  ['onEvent', '–', 'Callback for every event.'],
  ['debug', 'false', 'Log every event to the console.'],
];

export function Docs() {
  const [tab, setTab] = useState<TabName>('React');

  return (
    <section id="docs" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <SectionHeading
        title="Integrated in three lines"
        description="Formatir is dependency-free and tree-shakeable, and ships ESM, CJS and a classic <script> build - plus bindings for React, Vue and Svelte, validation adapters and a collector."
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <CodeBlock caption="Installation" code={'pnpm add formatir\n# npm i formatir · yarn add formatir'} />
          <CodeBlock
            caption="Initialisation"
            code={`import { Formatir } from 'formatir';

const formatir = Formatir.init({
  endpoint: '/api/formatir',
  appId: 'careers-portal',
  root: '#application-form',
  thresholds: { hesitationMs: 2500 },
});`}
          />
          <CodeBlock
            caption="Extras plugins"
            code={`import { autofill, funnel, paste, revisits, thrash } from 'formatir/extras';

const formatir = Formatir.init({
  endpoint: '/api/formatir',
  // Call each plugin - paste(), not paste.
  plugins: [paste(), autofill(), revisits(), funnel(), thrash({ reversals: 8 })],
});

// funnel() only fires on step changes - report them:
formatir.setStep('personal');
formatir.setStep('experience'); // step_change { from, to, durationMs, back }`}
          />
          <CodeBlock
            caption="Consent (GDPR)"
            code={`const formatir = Formatir.init({
  endpoint: '/api/formatir',
  autoStart: false,          // measure only after consent
});

banner.onAccept(() => formatir.optIn());  // start
banner.onReject(() => formatir.optOut()); // stop, clear the queue, remember`}
          />
          <CodeBlock
            caption="Listening to events"
            code={`formatir.on('rage_click', (e) => report(e.data.selector));
formatir.on('field_effort', (e) => {
  if (e.data.refills > 1) flagField(e.field?.key);
});

// Everything at once:
formatir.on('*', (event) => stream.push(event));

// For SPAs and custom validation:
formatir.setStep('experience');
formatir.reportValidationError('salary', 'belowMarketRate');
formatir.reportDropoff();

// Several forms on one page:
const newsletter = Formatir.create({ root: '#newsletter' });`}
          />
        </div>

        <div className="space-y-5">
          <div className="panel overflow-hidden">
            <div className="scroll-thin flex gap-1 overflow-x-auto border-b border-neutral-200 px-3 py-2">
              {(Object.keys(TABS) as TabName[]).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTab(name)}
                  className={`btn btn-mini ${tab === name ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {name}
                </button>
              ))}
            </div>
            <pre className="scroll-thin max-h-[22rem] overflow-auto px-4 py-3 text-[12.5px] leading-relaxed text-neutral-800">
              <code className="font-mono">{TABS[tab]}</code>
            </pre>
          </div>

          <div className="panel p-5">
            <h3 className="text-sm font-bold text-neutral-900">Options</h3>
            <div className="scroll-thin mt-3 max-h-64 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-neutral-500">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Option</th>
                    <th className="pb-2 pr-3 font-medium">Default</th>
                    <th className="pb-2 font-medium">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {OPTIONS.map(([name, value, text]) => (
                    <tr key={name} className="border-t border-neutral-200 align-top">
                      <td className="py-1.5 pr-3 font-mono text-blue-700">{name}</td>
                      <td className="py-1.5 pr-3 font-mono text-neutral-500">{value}</td>
                      <td className="py-1.5 text-neutral-600">{text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="panel mt-6 p-6">
        <div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Privacy by design</h3>
            <ul className="mt-3 grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
              <li>No values, no text, no clipboard - only lengths, counters and time deltas.</li>
              <li>
                Fields are identified by <code className="font-mono text-blue-700">name</code>,{' '}
                <code className="font-mono text-blue-700">id</code> or{' '}
                <code className="font-mono text-blue-700">data-formatir-field</code>.
              </li>
              <li>
                Click targets as structural selectors (tag / id / class / position) - never as text.
              </li>
              <li>
                <code className="font-mono text-blue-700">data-formatir-ignore</code> removes whole
                subtrees from measurement.
              </li>
              <li>
                Browser validation messages are ignored on purpose - they can contain the input.
                Only the <code className="font-mono">ValidityState</code> is recorded.
              </li>
              <li>
                Error messages in <code className="font-mono text-blue-700">js_error</code> are
                scrubbed of email addresses and digit sequences (phone, IBAN).
              </li>
              <li>
                <code className="font-mono text-blue-700">beforeSend</code> can rewrite or drop any
                event before it is sent.
              </li>
              <li>
                Consent built in: <code className="font-mono text-blue-700">autoStart: false</code>,{' '}
                <code className="font-mono text-blue-700">optIn()</code> and{' '}
                <code className="font-mono text-blue-700">optOut()</code> (remembered).
              </li>
              <li>Sampling via <code className="font-mono text-blue-700">sampleRate</code>.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
