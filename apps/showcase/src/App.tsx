import { ApplicationForm } from './components/ApplicationForm';
import { Docs } from './components/Docs';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Metrics } from './components/Metrics';
import { TelemetryPanel } from './components/TelemetryPanel';
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
          eyebrow="Live-Demo"
          title="Mehrstufiges Bewerbungsformular"
          description="Fülle das Formular aus - oder sabotiere es absichtlich. Das Panel rechts zeigt jedes Signal in dem Moment, in dem das SDK es erkennt."
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

      <Metrics />
      <Docs />
      <Footer />
    </div>
  );
}
