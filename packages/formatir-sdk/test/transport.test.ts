import { afterEach, describe, expect, it, vi } from 'vitest';
import { OUTBOX_KEY } from '../src/core/transport';
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

  it('falls back to keepalive fetch when the beacon is rejected', () => {
    const beacon = vi.fn((_url: string, _data?: BodyInit) => false);
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    const fetchMock = vi.fn((_url: string, _init: RequestInit) => Promise.resolve(new Response(null)));
    vi.stubGlobal('fetch', fetchMock);
    const { formatir } = start({ endpoint: '/collect', transport: 'beacon' });
    formatir.flush();
    expect(beacon).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/collect');
    expect(init).toMatchObject({ method: 'POST', keepalive: true });
    // Same payload the beacon was offered.
    expect(JSON.parse(init.body as string).sessionId).toBe(formatir.sessionId);
  });

  it('never calls sendBeacon with transport: fetch', () => {
    const beacon = vi.fn((_url: string, _data?: BodyInit) => true);
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    const fetchMock = vi.fn((_url: string, _init: RequestInit) => Promise.resolve(new Response(null)));
    vi.stubGlobal('fetch', fetchMock);
    start({ endpoint: '/collect', transport: 'fetch' }).formatir.flush();
    expect(beacon).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
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

describe('offline outbox', () => {
  const setOnline = (online: boolean) =>
    Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });

  afterEach(() => {
    setOnline(true);
    localStorage.clear();
  });

  const fetchWith = (status: number | 'error') => {
    const fetchMock = vi.fn((_url: string, _init: RequestInit) =>
      status === 'error'
        ? Promise.reject(new TypeError('network'))
        : Promise.resolve(new Response(null, { status })),
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };

  const box = () => JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]') as string[];

  it('parks batches while offline and replays them when back online', async () => {
    setOnline(false);
    const fetchMock = fetchWith(200);
    const { formatir } = start({ endpoint: '/c', transport: 'fetch' });
    formatir.flush();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(box()).toHaveLength(1);

    setOnline(true);
    window.dispatchEvent(new Event('online'));
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(box()).toHaveLength(0);
  });

  it.each([503, 429, 'error'] as const)('keeps the batch on %s', async (status) => {
    fetchWith(status);
    const { formatir } = start({ endpoint: '/c', transport: 'fetch' });
    formatir.flush();
    await vi.waitFor(() => expect(box()).toHaveLength(1));
  });

  it('does not keep batches rejected with 4xx', async () => {
    const fetchMock = fetchWith(400);
    const { formatir } = start({ endpoint: '/c', transport: 'fetch' });
    formatir.flush();
    await fetchMock.mock.results[0]!.value;
    await Promise.resolve();
    expect(box()).toHaveLength(0);
  });

  it('replays the outbox on the next start', () => {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(['{"events":[]}']));
    const fetchMock = fetchWith(200);
    start({ endpoint: '/c', transport: 'fetch' });
    expect(fetchMock.mock.calls[0]![1].body).toBe('{"events":[]}');
  });

  it('can be disabled', () => {
    setOnline(false);
    fetchWith(200);
    const { formatir } = start({ endpoint: '/c', transport: 'fetch', offline: false });
    formatir.flush();
    expect(box()).toHaveLength(0);
  });

  it('optOut() wipes the outbox', () => {
    setOnline(false);
    const { formatir } = start({ endpoint: '/c', transport: 'fetch' });
    formatir.flush();
    formatir.optOut();
    expect(box()).toHaveLength(0);
  });
});
