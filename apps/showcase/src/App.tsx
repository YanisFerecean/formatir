import { ApplicationForm } from './components/ApplicationForm';
import { Docs } from './components/Docs';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Metrics } from './components/Metrics';
import { TelemetryPanel } from './components/TelemetryPanel';
import { TestScenarios } from './components/TestScenarios';
import { SectionHeading } from './components/ui';
import { useFormatir } from './lib/useFormatir';

export default function App() {
  const { formatir, events, snapshot, clearEvents } = useFormatir();

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />

      <main id="demo" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <SectionHeading
          eyebrow="Live demo"
          title="Multi-step application form"
          description="Fill in the form - or sabotage it on purpose. The panel on the right shows every signal the moment the SDK detects it."
        />

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <ApplicationForm formatir={formatir} />
          <TelemetryPanel
            formatir={formatir}
            events={events}
            snapshot={snapshot}
            clearEvents={clearEvents}
          />
        </div>
      </main>

      <TestScenarios />
      <Metrics />
      <Docs />
      <Footer />
    </div>
  );
}
