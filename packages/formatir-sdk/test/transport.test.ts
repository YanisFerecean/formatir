import { describe, expect, it, vi } from 'vitest';
import { start, useDom } from './helpers';

useDom();

describe('transport', () => {
  it('sends batches with sendBeacon', () => {
    const beacon = vi.fn((_url: string, _data?: BodyInit) => true);
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    const { formatir } = start({ endpoint: '/collect', transport: 'beacon', appId: 'app' });
    formatir.flush();
    expect(beacon).toHaveBeenCalledOnce();
    expect(beacon.mock.calls[0]![0]).toBe('/collect');
  });

  it('flushes when batchSize is reached', () => {
    const fetchMock = vi.fn((_url: string, _init: RequestInit) => Promise.resolve(new Response(null)));
    vi.stubGlobal('fetch', fetchMock);
    const { formatir } = start({ endpoint: '/collect', transport: 'fetch', batchSize: 3 });
    formatir.track('a');
    formatir.track('b');
    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body).toMatchObject({ sdk: 'formatir', sessionId: formatir.sessionId });
    expect(body.events).toHaveLength(3);
  });
});
