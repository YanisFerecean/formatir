import { SectionHeading } from './ui';

const METRICS = [
  {
    icon: '🖱️',
    name: 'Rage Click Detector',
    threshold: '>= 3 Klicks / 500 ms',
    text: 'Mehrfaches hektisches Klicken auf dasselbe Element oder innerhalb eines 32-px-Radius - das klassische Signal für „reagiert nicht".',
  },
  {
    icon: '💀',
    name: 'Dead Click Detector',
    threshold: '1000 ms ohne Reaktion',
    text: 'Klick auf ein statisches Element, dem weder DOM-Mutation noch Navigation oder Fokuswechsel folgt. Deckt falsch verstandene Affordanzen auf.',
  },
  {
    icon: '⏱️',
    name: 'Hesitation Time Detector',
    threshold: '> 3000 ms bis zum 1. Anschlag',
    text: 'Zeit zwischen Fokus und erster Eingabe. Wird ein Feld ganz ohne Eingabe verlassen, meldet Formatir es als abgebrochen.',
  },
  {
    icon: '✍️',
    name: 'Field Effort & Refill',
    threshold: 'pro Feld',
    text: 'Anschläge, Korrekturen (Backspace/Delete), Refills nach Leeren des Feldes und Validierungsfehler - der Aufwand pro Feld auf einen Blick.',
  },
  {
    icon: '🚪',
    name: 'Form Drop-off Detector',
    threshold: 'pagehide / visibilitychange',
    text: 'Erkennt das zuletzt berührte Feld vor Abbruch oder Seitenwechsel - inklusive Fortschritt und Sitzungsdauer, per Beacon zuverlässig zugestellt.',
  },
  {
    icon: '🐞',
    name: 'Error Tracker',
    threshold: 'error & unhandledrejection',
    text: 'Ungefangene JavaScript-Fehler im Kontext der laufenden Formular-Session, verknüpft mit dem Feld, an dem gerade gearbeitet wurde. E-Mail-Adressen und Ziffernfolgen werden vorher entfernt.',
  },
];

/** Opt-in detectors from `formatir/extras` - all enabled in this demo. */
const EXTRAS = [
  {
    icon: '📋',
    name: 'paste()',
    metric: 'paste',
    text: 'Einfügen in ein Feld - und ob die Seite es blockiert. Gemessen wird nur die Längenänderung, nie der Inhalt.',
  },
  {
    icon: '🪄',
    name: 'autofill()',
    metric: 'autofill',
    text: 'Vom Browser automatisch ausgefüllte Felder, gebündelt als ein Event. Erklärt Felder mit Wert, aber ohne Aufwand.',
  },
  {
    icon: '↩️',
    name: 'revisits()',
    metric: 'field_revisit',
    text: 'Rückkehr zu einem Feld, nachdem schon ein anderes bearbeitet wurde - typisch nach einem Fehler weiter unten.',
  },
  {
    icon: '🧭',
    name: 'funnel()',
    metric: 'step_change',
    text: 'Schrittwechsel über setStep() mit Verweildauer pro Schritt und Erkennung von Zurück-Navigation.',
  },
  {
    icon: '🌀',
    name: 'thrash()',
    metric: 'thrash',
    text: 'Hektisches Hin-und-her der Maus - ein Zeichen für Verwirrung oder Ungeduld. Schwellenwerte einstellbar.',
  },
];

export function Metrics() {
  return (
    <section id="metriken" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeading
        eyebrow="Detektoren"
        title="Sechs Signale, die Conversion-Zahlen nicht liefern"
        description="Jeder Detektor ist einzeln konfigurierbar und liefert typisierte Events - lokal auswertbar oder direkt an deinen Collector."
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
          Fünf optionale Detektoren als Plugins - nicht im Kern-Bundle, zusammen 1,4 KB gzipped und
          tree-shakebar.
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
