import { useCallback, useEffect, useState } from 'react';
import { init, type FormatirEvent, type FormatirInstance, type FormatirSnapshot } from 'formatir';

const MAX_EVENTS = 120;

export interface Telemetry {
  formatir: FormatirInstance | null;
  events: FormatirEvent[];
  snapshot: FormatirSnapshot | null;
  clearEvents: () => void;
}

/**
 * Wires the Formatir SDK into React. The demo keeps `transport: 'none'` so no
 * data leaves the browser - the panel renders the envelope that *would* be sent.
 */
export function useFormatir(): Telemetry {
  const [formatir, setFormatir] = useState<FormatirInstance | null>(null);
  const [events, setEvents] = useState<FormatirEvent[]>([]);
  const [snapshot, setSnapshot] = useState<FormatirSnapshot | null>(null);

  useEffect(() => {
    const instance = init({
      appId: 'formatir-showcase',
      transport: 'none',
      flushIntervalMs: 0,
      thresholds: { hesitationMs: 3000, rageClicks: 3, rageWindowMs: 500 },
    });

    setFormatir(instance);
    setSnapshot(instance.getSnapshot());

    const off = instance.on('*', (event) => {
      setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
      setSnapshot(instance.getSnapshot());
    });

    // Keeps timers (focus duration, session length) ticking between events.
    const timer = window.setInterval(() => setSnapshot(instance.getSnapshot()), 1000);

    return () => {
      off();
      window.clearInterval(timer);
      instance.destroy();
    };
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { formatir, events, snapshot, clearEvents };
}
