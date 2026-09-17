import type { FormatirEvent, FormatirOptions } from '../types';
import { noop } from './util';

/** Hard cap so a session without an endpoint can never grow unbounded. */
const MAX_QUEUE = 500;

export interface Transport {
  push(event: FormatirEvent): void;
  flush(reason: string): void;
  size(): number;
  dispose(): void;
}

/**
 * Batching sender. Uses `navigator.sendBeacon` (survives page unload) and falls
 * back to `fetch(..., { keepalive: true })` when the beacon is rejected.
 */
export function createTransport(
  opts: Required<Pick<FormatirOptions, 'batchSize' | 'flushIntervalMs' | 'transport'>> &
    Pick<FormatirOptions, 'endpoint' | 'appId' | 'debug'>,
  sessionId: string,
  version: string,
): Transport {
  const queue: FormatirEvent[] = [];
  let timer: ReturnType<typeof setInterval> | undefined;

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

    if (transport === 'beacon' && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
    fetch(endpoint, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'content-type': 'application/json' },
    }).catch(noop);
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
    dispose() {
      if (timer) clearInterval(timer);
      flush('dispose');
    },
  };
}
