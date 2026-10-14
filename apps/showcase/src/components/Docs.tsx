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
    console.warn('Abbruch bei', event.data.lastField?.key);
  });

  return <form id="application-form">{/* … */}</form>;
}`,
  Vue: `// main.ts
import { FormatirPlugin } from 'formatir/vue';

createApp(App)
  .use(FormatirPlugin, { endpoint: '/api/formatir' })
  .mount('#app');

// Komponente (<script setup>)
import { useFormatirEvent } from 'formatir/vue';

useFormatirEvent('hesitation', (e) => track(e.field?.key, e.data.ms));`,
  Svelte: `<script>
  import { formatir } from 'formatir/svelte';
  let tracker;
</script>

<!-- Das Element wird zum beobachteten root -->
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
  Validierung: `// React Hook Form: nur der Fehlertyp, nie die Meldung
import { formatirOnInvalid } from 'formatir/react-hook-form';

<form onSubmit={handleSubmit(onValid, formatirOnInvalid(formatir))}>

// Zod: Issue-Codes pro Pfad (address.zip → too_small)
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

// 204 gespeichert · 400 ungültig · 500 → SDK versucht es später erneut`,
} as const;

type TabName = keyof typeof TABS;

const OPTIONS: [string, string, string][] = [
  ['endpoint', '–', 'Collector-URL. Ohne sie bleibt alles im Browser.'],
  ['appId', '–', 'Wird mit jedem Batch mitgesendet.'],
  ['root', 'document', 'Selektor oder Element, das beobachtet wird.'],
  ['sessionId', 'generiert', 'Bestehende Session-ID weiterverwenden.'],
  ['autoStart', 'true', 'false wartet auf start() / optIn() - z. B. nach Consent.'],
  ['batchSize', '20', 'Events pro Batch bis zum automatischen Flush.'],
  ['flushIntervalMs', '5000', 'Periodischer Flush; 0 deaktiviert ihn.'],
  ['sampleRate', '1', 'Anteil der aufgezeichneten Sessions.'],
  ['transport', "'beacon'", "'beacon' | 'fetch' | 'none'."],
  ['offline', 'true', 'Nicht zugestellte Batches speichern und später erneut senden.'],
  ['ignoreSelector', '[data-formatir-ignore]', 'Opt-out für ganze Teilbäume.'],
  ['thresholds', 'siehe Detektoren', 'Schwellenwerte pro Detektor.'],
  ['score', 'siehe Doku', 'Gewichte, Sättigung und Stufen des Frustrations-Scores.'],
  ['plugins', '[]', 'Zusätzliche Detektoren, z. B. aus formatir/extras.'],
  ['redactErrors', 'true', 'E-Mails und Ziffernfolgen aus js_error entfernen.'],
  ['beforeSend', '–', 'Event umschreiben oder mit null verwerfen, bevor es gesendet wird.'],
  ['onEvent', '–', 'Callback für jedes Event.'],
  ['debug', 'false', 'Jedes Event in der Konsole ausgeben.'],
];

export function Docs() {
  const [tab, setTab] = useState<TabName>('React');

  return (
    <section id="docs" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeading
        eyebrow="Dokumentation"
        title="In drei Zeilen eingebunden"
        description="Formatir ist abhängigkeitsfrei, tree-shakebar und liefert ESM, CJS sowie einen klassischen <script>-Build - dazu Bindings für React, Vue und Svelte, Validierungs-Adapter und einen Collector."
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <CodeBlock caption="Installation" code={'pnpm add formatir\n# npm i formatir · yarn add formatir'} />
          <CodeBlock
            caption="Initialisierung"
            code={`import { Formatir } from 'formatir';

const formatir = Formatir.init({
  endpoint: '/api/formatir',
  appId: 'careers-portal',
  root: '#application-form',
  thresholds: { hesitationMs: 2500 },
});`}
          />
          <CodeBlock
            caption="Consent (DSGVO)"
            code={`const formatir = Formatir.init({
  endpoint: '/api/formatir',
  autoStart: false,          // erst nach Zustimmung messen
});

banner.onAccept(() => formatir.optIn());  // starten
banner.onReject(() => formatir.optOut()); // stoppen, Queue leeren, merken`}
          />
          <CodeBlock
            caption="Events beobachten"
            code={`formatir.on('rage_click', (e) => report(e.data.selector));
formatir.on('field_effort', (e) => {
  if (e.data.refills > 1) flagField(e.field?.key);
});

// Alles auf einmal:
formatir.on('*', (event) => stream.push(event));

// Für SPAs und eigene Validierung:
formatir.setStep('experience');
formatir.reportValidationError('salary', 'belowMarketRate');
formatir.reportDropoff();

// Mehrere Formulare auf einer Seite:
const newsletter = Formatir.create({ root: '#newsletter' });`}
          />
        </div>

        <div className="space-y-5">
          <div className="panel overflow-hidden">
            <div className="scroll-thin flex gap-1 overflow-x-auto border-b border-slate-400/10 px-3 py-2">
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
            <pre className="scroll-thin max-h-[22rem] overflow-auto px-4 py-3 text-[12.5px] leading-relaxed text-slate-200">
              <code className="font-mono">{TABS[tab]}</code>
            </pre>
          </div>

          <div className="panel p-5">
            <h3 className="text-sm font-bold text-slate-50">Optionen</h3>
            <div className="scroll-thin mt-3 max-h-64 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">Option</th>
                    <th className="pb-2 pr-3 font-medium">Default</th>
                    <th className="pb-2 font-medium">Bedeutung</th>
                  </tr>
                </thead>
                <tbody>
                  {OPTIONS.map(([name, value, text]) => (
                    <tr key={name} className="border-t border-slate-400/10 align-top">
                      <td className="py-1.5 pr-3 font-mono text-brand-300">{name}</td>
                      <td className="py-1.5 pr-3 font-mono text-slate-500">{value}</td>
                      <td className="py-1.5 text-slate-400">{text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="panel mt-6 p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-lg">
            🔒
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-50">Privacy by Design</h3>
            <ul className="mt-3 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
              <li>Keine Werte, keine Texte, kein Clipboard - nur Längen, Zähler und Zeitdeltas.</li>
              <li>
                Felder werden über <code className="font-mono text-brand-300">name</code>,{' '}
                <code className="font-mono text-brand-300">id</code> oder{' '}
                <code className="font-mono text-brand-300">data-formatir-field</code> identifiziert.
              </li>
              <li>
                Klickziele als strukturelle Selektoren (Tag / ID / Klasse / Position) - nie als Text.
              </li>
              <li>
                <code className="font-mono text-brand-300">data-formatir-ignore</code> nimmt ganze
                Teilbäume aus der Messung heraus.
              </li>
              <li>
                Browser-Validierungstexte werden bewusst ignoriert - sie können die Eingabe
                enthalten. Erfasst wird nur der <code className="font-mono">ValidityState</code>.
              </li>
              <li>
                Fehlermeldungen in <code className="font-mono text-brand-300">js_error</code> werden
                von E-Mail-Adressen und Ziffernfolgen (Telefon, IBAN) bereinigt.
              </li>
              <li>
                <code className="font-mono text-brand-300">beforeSend</code> kann jedes Event vor dem
                Versand umschreiben oder verwerfen.
              </li>
              <li>
                Consent eingebaut: <code className="font-mono text-brand-300">autoStart: false</code>,{' '}
                <code className="font-mono text-brand-300">optIn()</code> und{' '}
                <code className="font-mono text-brand-300">optOut()</code> (wird gespeichert).
              </li>
              <li>Sampling über <code className="font-mono text-brand-300">sampleRate</code>.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
