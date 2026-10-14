import { CodeBlock } from './ui';

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
    <section id="top" className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
          See why people give up on your forms.
        </h1>

        <p className="mt-4 text-base leading-relaxed text-neutral-700">
          Conversion numbers show <em>that</em> a form fails. Formatir shows why: rage clicks,
          dead clicks, hesitation, correction loops, abandonment fields and JavaScript errors - in
          real time, without capturing a single typed value.
        </p>

        <p className="mt-3 text-sm text-neutral-500">
          5.5 KB gzipped · zero dependencies · 6 core detectors + 5 extras · no typed text captured
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href="#demo" className="btn btn-primary">
            Try the live demo
          </a>
          <a href="#docs" className="btn">
            Read the docs
          </a>
        </div>
      </div>

      <CodeBlock caption="quickstart.ts" code={SNIPPET} className="mt-8 max-w-3xl" />
    </section>
  );
}
