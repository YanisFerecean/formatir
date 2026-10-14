import { useCallback, useEffect, useState } from 'react';
import { init, type FormatirEvent, type FormatirInstance, type FormatirSnapshot } from 'formatir';
import { autofill, funnel, paste, revisits, thrash } from 'formatir/extras';

const MAX_EVENTS = 120;
/** Cap of the full log exposed on `window` for agents and tests. */
const MAX_LOG = 1000;

/** Name of the DOM event dispatched on `window` for every Formatir event. */
export const EVENT_NAME = 'formatir:event';

declare global {
  interface Window {
    /** The demo's Formatir instance - for agents, tests and the console. */
    formatir?: FormatirInstance;
    /** Every event of this session, oldest first (capped at 1000). */
    formatirEvents?: FormatirEvent[];
  }
  interface WindowEventMap {
    'formatir:event': CustomEvent<FormatirEvent>;
  }
}

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
    // Machine-readable view of the session (see /llms.txt). `onEvent` also sees
    // the `session_start` emitted inside init(), which `on()` would miss.
    const log: FormatirEvent[] = [];
    const record = (event: FormatirEvent) => {
      log.push(event);
      if (log.length > MAX_LOG) log.shift();
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: event }));
    };

    const instance = init({
      appId: 'formatir-showcase',
      // Only the application form is observed - clicks on the rest of the page
      // (hero, docs, telemetry panel) are ignored. A selector keeps working when
      // React swaps the form for the success screen and back.
      root: '#application',
      // Errors from elsewhere on the page (or the telemetry panel) are ignored.
      errorScope: 'root',
      transport: 'none',
      flushIntervalMs: 0,
      thresholds: { hesitationMs: 3000, rageClicks: 3, rageWindowMs: 500 },
      plugins: [paste(), autofill(), revisits(), funnel(), thrash()],
      onEvent: record,
    });
    window.formatir = instance;
    window.formatirEvents = log;

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
      if (window.formatir === instance) {
        delete window.formatir;
        delete window.formatirEvents;
      }
    };
  }, []);

  // Clears the panel only; `window.formatirEvents` keeps the full session.
  const clearEvents = useCallback(() => setEvents([]), []);

  return { formatir, events, snapshot, clearEvents };
}
