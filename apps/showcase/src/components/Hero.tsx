import { CodeBlock, Stat } from './ui';

const SNIPPET = `import { Formatir } from 'formatir';

const formatir = Formatir.init({
  endpoint: '/api/formatir',
  appId: 'careers-portal',
  root: '#application-form',
});

formatir.on('rage_click', (event) => {
  reportToSlack(event.data.selector, event.data.count);
});`;

export function Hero() {
  return (
    <section id="top" className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <span className="chip border-brand-500/30 bg-brand-500/10 text-brand-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            Verhaltensanalytik für Formulare
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-50 sm:text-5xl">
            Sehen, <span className="text-brand-400">warum</span> Bewerber
            <br className="hidden sm:block" /> abbrechen.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400">
            Conversion-Zahlen zeigen, <em>dass</em> ein Formular scheitert. Formatir zeigt, woran:
            Rage Clicks, tote Klicks, Zögern, Korrekturschleifen, Abbruchfelder und
            JavaScript-Fehler - in Echtzeit, ohne eine einzige Klartext-Eingabe zu erfassen.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#demo" className="btn btn-primary">
              Live-Demo ausprobieren
            </a>
            <a href="#docs" className="btn btn-ghost">
              Integration in 3 Zeilen
            </a>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value="4,3 KB" label="gzipped" />
            <Stat value="0" label="Dependencies" accent="text-accent-300" />
            <Stat value="6" label="Detektoren" />
            <Stat value="0 PII" label="Klartext erfasst" accent="text-emerald-300" />
          </div>
        </div>

        <CodeBlock caption="quickstart.ts" code={SNIPPET} />
      </div>
    </section>
  );
}
