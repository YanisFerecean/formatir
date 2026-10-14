// @vitest-environment node
import { Readable } from 'node:stream';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createHandler, METRICS, parseBatch, toNodeListener, type FormatirBatch } from '../src/server';

const event = (over: Record<string, unknown> = {}) => ({
  id: 'e1',
  type: 'rage_click',
  ts: 1,
  t: 0,
  sessionId: 's',
  data: { count: 3 },
  ...over,
});
const batch = (over: Record<string, unknown> = {}) => ({
  sdk: 'formatir',
  v: '0.1.0',
  appId: 'careers',
  sessionId: 's',
  sentAt: 1,
  reason: 'batch',
  events: [event()],
  ...over,
});

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://collector.test/api', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
  });

describe('parseBatch', () => {
  it('accepts a valid batch (object or JSON string)', () => {
    expect(parseBatch(batch()).ok).toBe(true);
    expect(parseBatch(JSON.stringify(batch())).ok).toBe(true);
  });

  it.each([
    ['not json', '{', 'not valid JSON'],
    ['wrong sdk', batch({ sdk: 'other' }), 'sdk'],
    ['missing events', batch({ events: undefined }), 'events must be an array'],
    ['unknown type', batch({ events: [event({ type: 'nope' })] }), 'events[0] has an unknown type'],
    ['bad field', batch({ events: [event({ field: { key: 1 } })] }), 'invalid field'],
    ['missing data', batch({ events: [event({ data: null })] }), 'no data'],
  ])('rejects %s', (_, input, message) => {
    const result = parseBatch(input);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain(message);
  });

  it('caps the number of events', () => {
    expect(parseBatch(batch({ events: [event(), event()] }), { maxEvents: 1 }).ok).toBe(false);
  });

  it('agrees with the JSON schema on metric names', () => {
    const schema = JSON.parse(readFileSync(new URL('../schema/batch.schema.json', import.meta.url), 'utf8'));
    expect(schema.$defs.event.properties.type.enum).toEqual([...METRICS]);
  });
});

describe('createHandler', () => {
  it('passes valid batches to onBatch and answers 204', async () => {
    const onBatch = vi.fn((_: FormatirBatch) => {});
    const res = await createHandler({ onBatch })(post(batch()));
    expect(res.status).toBe(204);
    expect(onBatch.mock.calls[0]![0].events[0]!.type).toBe('rage_click');
  });

  it('answers 400 for invalid bodies and 405 for other methods', async () => {
    const handler = createHandler({ onBatch: () => {} });
    expect((await handler(post({ sdk: 'x' }))).status).toBe(400);
    expect((await handler(new Request('https://c.test/', { method: 'GET' }))).status).toBe(405);
  });

  it('answers 413 above maxBytes', async () => {
    const handler = createHandler({ onBatch: () => {}, maxBytes: 100 });
    expect((await handler(post(batch()))).status).toBe(413);
  });

  it('answers 500 when storing fails, so the SDK retries', async () => {
    const handler = createHandler({
      onBatch: () => {
        throw new Error('db down');
      },
    });
    expect((await handler(post(batch()))).status).toBe(500);
  });

  it('filters by appId', async () => {
    const handler = createHandler({ onBatch: () => {}, appIds: ['other'] });
    expect((await handler(post(batch()))).status).toBe(403);
  });

  it('handles CORS preflight for allowed origins only', async () => {
    const handler = createHandler({ onBatch: () => {}, cors: ['https://app.test'] });
    const preflight = (origin: string) =>
      handler(new Request('https://c.test/', { method: 'OPTIONS', headers: { origin } }));
    const ok = await preflight('https://app.test');
    expect(ok.status).toBe(204);
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://app.test');
    expect(ok.headers.get('access-control-allow-credentials')).toBe('true');
    expect((await preflight('https://evil.test')).status).toBe(403);
    const sent = await handler(post(batch(), { origin: 'https://app.test' }));
    expect(sent.headers.get('access-control-allow-origin')).toBe('https://app.test');
  });
});

describe('toNodeListener', () => {
  const nodeReq = (body: string, method = 'POST') =>
    Object.assign(Readable.from([Buffer.from(body)]), {
      method,
      url: '/api/formatir',
      headers: { host: 'localhost', 'content-type': 'application/json' },
    });
  const nodeRes = () => {
    const res = { statusCode: 0, headers: {} as Record<string, string>, body: '' };
    return Object.assign(res, {
      setHeader: (k: string, v: string) => void (res.headers[k] = v),
      end: (b?: string) => void (res.body = b || ''),
    });
  };

  it('bridges node:http style requests', async () => {
    const onBatch = vi.fn();
    const res = nodeRes();
    await toNodeListener(createHandler({ onBatch }))(nodeReq(JSON.stringify(batch())), res);
    expect(res.statusCode).toBe(204);
    expect(onBatch).toHaveBeenCalledOnce();
  });

  it('stops reading oversized bodies', async () => {
    const res = nodeRes();
    await toNodeListener(createHandler({ onBatch: () => {} }), 10)(nodeReq(JSON.stringify(batch())), res);
    expect(res.statusCode).toBe(413);
  });
});
