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
    text: 'Ungefangene JavaScript-Fehler im Kontext der laufenden Formular-Session, verknüpft mit dem Feld, an dem gerade gearbeitet wurde.',
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
    </section>
  );
}
