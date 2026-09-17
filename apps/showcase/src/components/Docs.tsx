import { useState } from 'react';
import { CodeBlock, SectionHeading } from './ui';

const TABS = {
  React: `import { useEffect } from 'react';
import { Formatir } from 'formatir';

export function ApplicationForm() {
  useEffect(() => {
    const formatir = Formatir.init({
      endpoint: '/api/formatir',
      root: '#application-form',
    });

    const off = formatir.on('form_dropoff', (event) => {
      console.warn('Abbruch bei', event.data.lastField?.key);
    });

    return () => {
      off();
      formatir.destroy();
    };
  }, []);

  return <form id="application-form">{/* … */}</form>;
}`,
  Vue: `<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { Formatir, type FormatirInstance } from 'formatir';

let formatir: FormatirInstance;

onMounted(() => {
  formatir = Formatir.init({ endpoint: '/api/formatir' });
  formatir.on('hesitation', (e) => track(e.field?.key, e.data.ms));
});

onBeforeUnmount(() => formatir.destroy());
</script>`,
  HTML: `<form id="application-form"> … </form>

<script src="https://unpkg.com/formatir/dist/index.global.js"></script>
<script>
  var formatir = Formatir.init({
    endpoint: '/api/formatir',
    root: '#application-form',
  });

  formatir.on('rage_click', function (event) {
    console.warn('rage click', event.data.selector);
  });
</script>`,
} as const;

type TabName = keyof typeof TABS;

const OPTIONS: [string, string, string][] = [
  ['endpoint', '–', 'Collector-URL. Ohne sie bleibt alles im Browser.'],
  ['appId', '–', 'Wird mit jedem Batch mitgesendet.'],
  ['root', 'document', 'Selektor oder Element, das beobachtet wird.'],
  ['batchSize', '20', 'Events pro Batch bis zum automatischen Flush.'],
  ['flushIntervalMs', '5000', 'Periodischer Flush; 0 deaktiviert ihn.'],
  ['sampleRate', '1', 'Anteil der aufgezeichneten Sessions.'],
  ['transport', "'beacon'", "'beacon' | 'fetch' | 'none'."],
  ['ignoreSelector', '[data-formatir-ignore]', 'Opt-out für ganze Teilbäume.'],
  ['thresholds', 'siehe Detektoren', 'Schwellenwerte pro Detektor.'],
];

export function Docs() {
  const [tab, setTab] = useState<TabName>('React');

  return (
    <section id="docs" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeading
        eyebrow="Dokumentation"
        title="In drei Zeilen eingebunden"
        description="Formatir ist abhängigkeitsfrei, tree-shakebar und liefert ESM, CJS sowie einen klassischen <script>-Build."
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
formatir.reportDropoff();`}
          />
        </div>

        <div className="space-y-5">
          <div className="panel overflow-hidden">
            <div className="flex gap-1 border-b border-slate-400/10 px-3 py-2">
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
              <li>Sampling über <code className="font-mono text-brand-300">sampleRate</code>.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
