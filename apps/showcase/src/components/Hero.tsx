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
            Behaviour analytics for forms
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-50 sm:text-5xl">
            See <span className="text-brand-400">why</span> applicants
            <br className="hidden sm:block" /> give up.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400">
            Conversion numbers show <em>that</em> a form fails. Formatir shows why: rage clicks,
            dead clicks, hesitation, correction loops, abandonment fields and JavaScript errors -
            in real time, without capturing a single typed value.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#demo" className="btn btn-primary">
              Try the live demo
            </a>
            <a href="#docs" className="btn btn-ghost">
              Integrate in 3 lines
            </a>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value="5.5 KB" label="gzipped" />
            <Stat value="0" label="dependencies" accent="text-accent-300" />
            <Stat value="6 + 5" label="detectors" />
            <Stat value="0 PII" label="typed text captured" accent="text-emerald-300" />
          </div>
        </div>

        <CodeBlock caption="quickstart.ts" code={SNIPPET} />
      </div>
    </section>
  );
}
