import type { FormatirEvent, FormatirOptions } from '../types';
import { read, store } from './util';

/** Hard cap so a session without an endpoint can never grow unbounded. */
const MAX_QUEUE = 500;

/** `localStorage` key of batches that could not be delivered yet. */
export const OUTBOX_KEY = 'formatir:outbox';
/** Oldest batches are dropped beyond this many. */
const MAX_OUTBOX = 20;

const outbox = (): string[] => {
  try {
    const box = JSON.parse(read(OUTBOX_KEY) || '[]');
    return Array.isArray(box) ? box : [];
  } catch {
    return [];
  }
};

export interface Transport {
  push(event: FormatirEvent): void;
  flush(reason: string): void;
  size(): number;
  /** Drop queued events (and the offline outbox) without sending them. */
  clear(): void;
  /** Resend batches stored in the offline outbox. */
  replay(): void;
  dispose(): void;
}

/**
 * Batching sender. Uses `navigator.sendBeacon` (survives page unload) and falls
 * back to `fetch(..., { keepalive: true })` when the beacon is rejected. With
 * `offline`, batches that fail (offline, network error, 429, 5xx) are kept in
 * `localStorage` and replayed on the next start or when the browser is online.
 */
export function createTransport(
  opts: Required<Pick<FormatirOptions, 'batchSize' | 'flushIntervalMs' | 'transport' | 'offline'>> &
    Pick<FormatirOptions, 'endpoint' | 'appId' | 'debug'>,
  sessionId: string,
  version: string,
): Transport {
  const queue: FormatirEvent[] = [];
  let timer: ReturnType<typeof setInterval> | undefined;

  const keep = (body: string): void => {
    if (opts.offline) store(OUTBOX_KEY, JSON.stringify(outbox().concat(body).slice(-MAX_OUTBOX)));
  };

  const post = (body: string): void => {
    fetch(opts.endpoint!, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'content-type': 'application/json' },
    }).then((res) => {
      if (res.status === 429 || res.status >= 500) keep(body);
    }, () => keep(body));
  };

  const send = (events: FormatirEvent[], reason: string): void => {
    const { endpoint, transport } = opts;
    if (!endpoint || transport === 'none') return;
    const body = JSON.stringify({
      sdk: 'formatir',
      v: version,
      appId: opts.appId,
      sessionId,
      sentAt: Date.now(),
      reason,
      events,
    });

    // A beacon "succeeds" even without a network - park the batch instead.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return keep(body);
    if (transport === 'beacon' && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
    post(body);
  };

  const flush = (reason: string): void => {
    if (!queue.length) return;
    const batch = queue.splice(0, queue.length);
    if (opts.debug) console.debug('[formatir] flush', reason, batch.length);
    send(batch, reason);
  };

  if (opts.flushIntervalMs > 0 && opts.endpoint) {
    timer = setInterval(() => flush('interval'), opts.flushIntervalMs);
  }

  return {
    push(event) {
      queue.push(event);
      if (queue.length > MAX_QUEUE) queue.shift();
      if (queue.length >= opts.batchSize) flush('batch');
    },
    flush,
    size: () => queue.length,
    clear() {
      queue.length = 0;
      store(OUTBOX_KEY, null);
    },
    replay() {
      const box = opts.offline && opts.endpoint && opts.transport !== 'none' ? outbox() : [];
      if (!box.length || navigator.onLine === false) return;
      store(OUTBOX_KEY, null);
      box.forEach(post);
    },
    dispose() {
      if (timer) clearInterval(timer);
      flush('dispose');
    },
  };
}
