/**
 * Collector helpers for the receiving end. Runtime-agnostic: the handler
 * speaks the Fetch API (`Request` -> `Response`), so it runs on Node >= 18,
 * Deno, Bun, Cloudflare Workers, Vercel / Netlify functions and Hono as is.
 *
 * ```ts
 * import { createHandler } from 'formatir/server';
 *
 * export default {
 *   fetch: createHandler({ onBatch: (batch) => db.insert(batch.events) }),
 * };
 * ```
 */
import type { FormatirEvent, MetricName } from 'formatir';

/** Every metric name the SDK can emit (core and `formatir/extras`). */
export const METRICS = [
  'session_start',
  'field_focus',
  'field_blur',
  'rage_click',
  'dead_click',
  'hesitation',
  'field_effort',
  'validation_error',
  'form_submit',
  'form_dropoff',
  'js_error',
  'score',
  'custom',
  'paste',
  'autofill',
  'field_revisit',
  'step_change',
  'thrash',
] as const satisfies readonly MetricName[];

// Compile-time guard: fails when a metric is added to the SDK but not here.
type Missing = Exclude<MetricName, (typeof METRICS)[number]>;
const exhaustive: Missing extends never ? true : Missing = true;
void exhaustive;

/** The envelope the SDK POSTs to `endpoint`. */
export interface FormatirBatch {
  sdk: 'formatir';
  /** SDK version. */
  v: string;
  appId?: string;
  sessionId: string;
  /** Client clock when the batch was sent (epoch ms). */
  sentAt: number;
  /** Why the batch was flushed: `batch`, `interval`, `hidden`, `pagehide`, ... */
  reason: string;
  events: FormatirEvent[];
}

export type ParseResult =
  | { ok: true; batch: FormatirBatch }
  | { ok: false; error: string };

export interface ParseOptions {
  /** Reject batches with more events. Default 500 (the SDK's queue cap). */
  maxEvents?: number;
}

const METRIC_SET = new Set<string>(METRICS);
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

function eventError(e: unknown): string | undefined {
  if (!isObject(e)) return 'is not an object';
  if (!isStr(e.id)) return 'has no id';
  if (!isStr(e.type) || !METRIC_SET.has(e.type)) return `has an unknown type ${JSON.stringify(e.type)}`;
  if (!isNum(e.ts) || !isNum(e.t)) return 'has no ts / t';
  if (!isStr(e.sessionId)) return 'has no sessionId';
  if (!isObject(e.data)) return 'has no data object';
  if (e.step !== undefined && !isStr(e.step)) return 'has a non-string step';
  if (e.field !== undefined && !(isObject(e.field) && isStr(e.field.key))) return 'has an invalid field';
  return undefined;
}

/**
 * Validate an untrusted batch (already JSON-parsed, or a JSON string). Checks
 * the envelope and the shape every event shares; `data` payloads are only
 * required to be objects.
 */
export function parseBatch(input: unknown, options: ParseOptions = {}): ParseResult {
  const maxEvents = options.maxEvents ?? 500;
  let body = input;
  if (isStr(body)) {
    try {
      body = JSON.parse(body);
    } catch {
      return { ok: false, error: 'body is not valid JSON' };
    }
  }
  if (!isObject(body)) return { ok: false, error: 'body is not an object' };
  if (body.sdk !== 'formatir') return { ok: false, error: 'sdk must be "formatir"' };
  if (!isStr(body.v)) return { ok: false, error: 'v must be a string' };
  if (body.appId !== undefined && !isStr(body.appId)) return { ok: false, error: 'appId must be a string' };
  if (!isStr(body.sessionId)) return { ok: false, error: 'sessionId must be a string' };
  if (!isNum(body.sentAt)) return { ok: false, error: 'sentAt must be a number' };
  if (!isStr(body.reason)) return { ok: false, error: 'reason must be a string' };
  if (!Array.isArray(body.events)) return { ok: false, error: 'events must be an array' };
  if (body.events.length > maxEvents) return { ok: false, error: `more than ${maxEvents} events` };
  for (let i = 0; i < body.events.length; i++) {
    const problem = eventError(body.events[i]);
    if (problem) return { ok: false, error: `events[${i}] ${problem}` };
  }
  return { ok: true, batch: body as unknown as FormatirBatch };
}

export interface HandlerOptions extends ParseOptions {
  /** Called with every valid batch. Throwing answers 500, so the SDK retries it later. */
  onBatch(batch: FormatirBatch, request: Request): void | Promise<void>;
  /**
   * Origins allowed to send cross-origin: `true` for any, or a list.
   * Default: none (same-origin only, no CORS headers).
   */
  cors?: boolean | string[];
  /** Accept batches only for these `appId`s. */
  appIds?: string[];
  /** Maximum body size in bytes. Default 256 KB. */
  maxBytes?: number;
}

/** Read at most `max` bytes; `null` when the body is larger. */
async function readLimited(request: Request, max: number): Promise<string | null> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return out + decoder.decode();
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    out += decoder.decode(value, { stream: true });
  }
}

const text = (status: number, body: string, headers: Record<string, string>): Response =>
  new Response(body, { status, headers: { ...headers, 'content-type': 'text/plain' } });

/** Fetch-API request handler for the SDK's batches. */
export function createHandler(options: HandlerOptions): (request: Request) => Promise<Response> {
  const maxBytes = options.maxBytes ?? 256 * 1024;

  const corsHeaders = (request: Request): Record<string, string> | null => {
    const origin = request.headers.get('origin');
    const { cors } = options;
    if (!origin || !cors) return {};
    if (cors !== true && !cors.includes(origin)) return null;
    // `sendBeacon` sends credentials, so the origin must be echoed (not `*`).
    return {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      vary: 'origin',
    };
  };

  return async (request) => {
    const headers = corsHeaders(request);
    if (!headers) return text(403, 'origin not allowed', {});

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...headers,
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type',
          'access-control-max-age': '86400',
        },
      });
    }
    if (request.method !== 'POST') {
      return text(405, 'method not allowed', { ...headers, allow: 'POST, OPTIONS' });
    }

    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > maxBytes) return text(413, 'payload too large', headers);
    const raw = await readLimited(request, maxBytes);
    if (raw === null) return text(413, 'payload too large', headers);

    const result = parseBatch(raw, options);
    if (!result.ok) return text(400, result.error, headers);
    if (options.appIds && !options.appIds.includes(result.batch.appId || '')) {
      return text(403, 'appId not allowed', headers);
    }

    try {
      await options.onBatch(result.batch, request);
    } catch {
      return text(500, 'could not store batch', headers);
    }
    return new Response(null, { status: 204, headers });
  };
}

/** Minimal shape of Node's `IncomingMessage` (keeps `@types/node` optional). */
export interface NodeRequestLike extends AsyncIterable<Uint8Array | string> {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
}

/** Minimal shape of Node's `ServerResponse`. */
export interface NodeResponseLike {
  statusCode: number;
  setHeader(name: string, value: string): unknown;
  end(body?: string): unknown;
}

/**
 * Adapt a Fetch handler to Node's `(req, res)` signature - for `node:http`,
 * Express, Fastify (`reply.raw`) or Next.js pages API routes.
 *
 * ```ts
 * app.post('/api/formatir', toNodeListener(createHandler({ onBatch })));
 * ```
 * Mount it before any body parser - it reads the raw request stream.
 */
export function toNodeListener(
  handler: (request: Request) => Promise<Response>,
  /** Stop reading beyond this many bytes and answer 413. Default 1 MB. */
  maxBytes = 1024 * 1024,
): (req: NodeRequestLike, res: NodeResponseLike) => Promise<void> {
  return async (req, res) => {
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
    const method = req.method || 'GET';
    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      const decoder = new TextDecoder();
      let size = 0;
      body = '';
      for await (const chunk of req) {
        const bytes = typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk;
        size += bytes.byteLength;
        if (size > maxBytes) {
          res.statusCode = 413;
          res.setHeader('content-type', 'text/plain');
          res.end('payload too large');
          return;
        }
        body += decoder.decode(bytes, { stream: true });
      }
      body += decoder.decode();
    }
    const url = new URL(req.url || '/', `http://${headers.get('host') || 'localhost'}`);
    const response = await handler(new Request(url, { method, headers, body }));
    res.statusCode = response.status;
    response.headers.forEach((value, name) => void res.setHeader(name, value));
    res.end(await response.text());
  };
}
