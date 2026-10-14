# Formatir

[![npm](https://img.shields.io/npm/v/formatir?color=7c3aed)](https://www.npmjs.com/package/formatir)
[![bundle size](https://img.shields.io/badge/core%20gzipped-5.5%20KB-22d3ee)](https://bundlephobia.com/package/formatir)
[![dependencies](https://img.shields.io/badge/dependencies-0-34d399)](https://www.npmjs.com/package/formatir?activeTab=dependencies)
[![license](https://img.shields.io/npm/l/formatir?color=64748b)](../../LICENSE)

> Privacy-first behaviour analytics for web forms and application processes.
> Zero dependencies, **~5.5 KB gzipped**, works with plain HTML, React, Vue, Svelte and SPAs.

Formatir answers the question analytics funnels cannot: *why* people struggle in
your form. It watches interaction behaviour - not content - and turns it into
actionable metrics plus a frustration score.

```bash
npm i formatir      # pnpm add formatir / yarn add formatir
```

## Contents

- [Quickstart](#quickstart)
- [Detectors](#detectors) and [extras](#extras-formatirextras)
- [Privacy by design](#privacy-by-design) and [consent](#consent)
- [API](#api) and [options](#options)
- [Transport and offline outbox](#transport)
- [Framework bindings](#framework-bindings) - React, Vue, Svelte
- [Validation adapters](#validation-adapters) - React Hook Form, Zod
- [Collector](#collector-formatirserver) - `formatir/server` and the JSON schema
- [Writing plugins](#writing-plugins)

## Quickstart

```ts
import { Formatir } from 'formatir';

const formatir = Formatir.init({
  endpoint: '/api/formatir',      // omit to stay fully client-side
  appId: 'careers-portal',
  root: '#application-form',      // observe this subtree only
});

formatir.on('rage_click', (event) => {
  console.warn('rage click', event.data.selector, event.data.count);
});

formatir.on('*', (event) => queueMicrotask(() => render(event)));
```

Without a bundler:

```html
<script src="https://unpkg.com/formatir/dist/index.global.js"></script>
<script src="https://unpkg.com/formatir/dist/extras.global.js"></script>
<script>
  var formatir = Formatir.init({
    endpoint: '/api/formatir',
    plugins: [FormatirExtras.paste(), FormatirExtras.thrash()],
  });
</script>
```

## Detectors

| Metric             | Fires when                                                                     | Payload highlights                          |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------- |
| `rage_click`       | >= 3 clicks within 500 ms on the same element or within a 32 px radius          | `count`, `withinMs`, `selector`, `x`, `y`   |
| `dead_click`       | Click on a static element with no DOM mutation, navigation or focus change      | `selector`, `waitedMs`                      |
| `hesitation`       | Focus -> first keystroke takes > 3000 ms, or the field is left untouched        | `ms`, `threshold`, `abandoned`              |
| `field_effort`     | A field is left after real work happened                                        | `keystrokes`, `corrections`, `refills`, ... |
| `validation_error` | Constraint validation fails (or `reportValidationError()` is called)            | `reason` (`valueMissing`, `typeMismatch`)   |
| `form_dropoff`     | The page is hidden or unloaded without a submit                                 | `lastField`, `progress`, `durationMs`       |
| `js_error`         | Uncaught error or unhandled rejection during the form session                   | `message` (redacted), `source`, `line`      |

Lifecycle events round out the stream: `session_start`, `field_focus`,
`field_blur`, `form_submit`, `score` and `custom`.

Field references carry `key`, `type`, `step` and - when the field sits in a
`<form>` - `form` (`data-formatir-form`, `id` or `name`), so several forms on
one page stay apart. Fields added after `init()` and fields inside open shadow
roots are tracked as well.

### Extras (`formatir/extras`)

Opt-in detectors that live outside the core bundle (1.4 KB gzipped together,
tree-shakeable):

```ts
import { autofill, funnel, paste, revisits, thrash } from 'formatir/extras';

Formatir.init({ plugins: [paste(), autofill(), revisits(), funnel(), thrash()] });
```

| Plugin       | Metric          | Fires when                                                         | Payload                                    |
| ------------ | --------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `paste()`    | `paste`         | Content is pasted into a field; flags pages that block pasting      | `pastes`, `delta` (length), `blocked`      |
| `autofill()` | `autofill`      | The browser autofills fields (one event per burst)                 | `count`, `fields`                          |
| `revisits()` | `field_revisit` | The user returns to a field after moving on to another one         | `visits`, `length`, `changed`              |
| `funnel()`   | `step_change`   | `setStep()` changes the step; detects going back                   | `from`, `to`, `durationMs`, `back`, `visits` |
| `thrash()`   | `thrash`        | Rapid back-and-forth pointer movement (tunable)                    | `reversals`, `withinMs`                    |

The clipboard is never read: `paste` only reports how much the value length changed.

### Frustration score

Every weighted signal feeds a saturating score, `100 * (1 - e^(-raw/saturation))`,
so it approaches but never exceeds 100. A `score` event is emitted whenever the
value changes; `level` is one of `calm`, `mild`, `elevated`, `severe`.

| Signal             | Weight | Signal          | Weight |
| ------------------ | -----: | --------------- | -----: |
| `form_dropoff`     |     20 | `refill`        |      8 |
| `rage_click`       |     18 | `thrash`        |      8 |
| `js_error`         |     14 | `hesitation`    |      6 |
| `dead_click`       |     10 | `step_back`     |      5 |
| `paste_blocked`    |     10 | `field_revisit` |      3 |
| `validation_error` |      9 | `correction`    |    0.4 |

Everything is tunable:

```ts
Formatir.init({
  score: {
    weights: { dead_click: 4, custom: 10 }, // merged over the defaults; 0 disables a signal
    saturation: 80,                         // default 55 - higher is more forgiving
    levels: [25, 50, 75],                   // mild / elevated / severe lower bounds
  },
});
```

## Privacy by design

Formatir never reads what a user typed.

- No values, no `innerText`, no clipboard, no keystroke content - only
  `value.length`, counters and time deltas.
- Fields are identified by `data-formatir-field`, `name` or `id`; otherwise a
  structural fallback key is generated.
- Click targets are described with structural selectors (tag / id / class /
  position), never with text content.
- `data-formatir-ignore` on any element opts its whole subtree out (including
  shadow roots below it).
- Browser validation *messages* are deliberately ignored (they can echo the
  entered value); only the `ValidityState` flag name is reported.
- `js_error` messages are scrubbed of e-mail addresses and long digit runs
  (phone, IBAN, card numbers), and query strings are stripped from script URLs.
  Disable with `redactErrors: false`.
- `beforeSend` is the last stop before the network - rewrite or drop anything:

```ts
Formatir.init({
  beforeSend(event) {
    if (event.type === 'custom' && event.data.name === 'debug') return null; // drop
    if (event.type === 'session_start') {
      return { ...event, data: { ...event.data, url: location.pathname } };   // rewrite
    }
    return event;
  },
});
```

Local listeners (`on()`, `onEvent`) still receive the original events.

### Consent

```ts
const formatir = Formatir.init({ endpoint: '/api/formatir', autoStart: false });

consentBanner.onAccept(() => formatir.optIn());   // start + forget an earlier opt-out
consentBanner.onReject(() => formatir.optOut());  // stop, drop queued data, remember it
```

- `autoStart: false` creates the instance without attaching any listener.
- `start()` / `stop()` attach and detach the detectors; the session continues.
- `optOut()` stores `formatir:optout` in `localStorage`. While it is set,
  `start()` and `autoStart` do nothing until `optIn()` is called.

## API

```ts
const formatir = Formatir.init(options);  // the page-wide instance (replaces a previous one)
const other = Formatir.create(options);   // an independent instance you destroy yourself
Formatir.getInstance();                   // the instance from the last init()

formatir.on(metric, listener);      // returns an unsubscribe function
formatir.off(metric, listener);
formatir.track('cv_uploaded', { sizeKb: 812 });
formatir.setStep('experience');     // tag events with a wizard step
formatir.reportValidationError('email', 'typeMismatch');
formatir.markSubmitted();
formatir.reportDropoff();           // e.g. on an SPA route change
formatir.getSnapshot();             // score, per-field stats, queue size
formatir.start(); formatir.stop();  // attach / detach the detectors
formatir.optIn(); formatir.optOut();
formatir.active;                    // true while collecting
formatir.flush();
formatir.destroy();
```

`reportValidationError('email')` looks the name up as `data-formatir-field`,
`name` or `id` inside the root, so the event carries the real field type and
form when the field is rendered.

### Options

| Option            | Default                    | Description                                                       |
| ----------------- | -------------------------- | ----------------------------------------------------------------- |
| `endpoint`        | -                          | Collector URL. Without it Formatir stays local.                    |
| `appId`           | -                          | Sent with every batch.                                             |
| `root`            | `document`                 | Selector or element to observe.                                    |
| `sessionId`       | generated                  | Reuse an existing id.                                              |
| `autoStart`       | `true`                     | `false` waits for `start()` / `optIn()`.                           |
| `batchSize`       | `20`                       | Events per batch before an automatic flush.                        |
| `flushIntervalMs` | `5000`                     | Periodic flush; `0` disables it.                                   |
| `sampleRate`      | `1`                        | Fraction of sessions recorded.                                     |
| `transport`       | `'beacon'`                 | `beacon` \| `fetch` \| `none`.                                     |
| `offline`         | `true`                     | Keep undelivered batches in `localStorage` and retry them.         |
| `ignoreSelector`  | `'[data-formatir-ignore]'` | Opt-out selector.                                                  |
| `thresholds`      | see detectors              | `rageClicks`, `rageWindowMs`, `rageRadiusPx`, `deadClickMs`, `hesitationMs`. |
| `score`           | see above                  | `weights`, `saturation`, `levels`.                                 |
| `plugins`         | `[]`                       | Extra detectors, e.g. from `formatir/extras`.                      |
| `redactErrors`    | `true`                     | Scrub PII from `js_error` payloads.                                |
| `beforeSend`      | -                          | Rewrite (return the event) or drop (`null` / `false`) before sending. |
| `onEvent`         | -                          | Convenience hook for every event.                                  |
| `debug`           | `false`                    | Log every event to the console.                                    |

### Transport

Batches are sent with `navigator.sendBeacon` and fall back to
`fetch(..., { keepalive: true })`. Flushes happen on `batchSize`, on the flush
interval, on `visibilitychange` (hidden) and on `pagehide`, so the final
drop-off event survives the unload.

With `offline` (default), a batch that cannot be delivered - the browser is
offline, the request fails, or the collector answers `429` / `5xx` - is kept in
`localStorage` (`formatir:outbox`, at most 20 batches) and resent on the next
`start()` or when the browser fires `online`. `optOut()` wipes the outbox.
Batches rejected with `4xx` are dropped. Beacons cannot report failures, so
retries apply to the `fetch` path and to batches parked while offline.

```jsonc
// POST body
{
  "sdk": "formatir",
  "v": "0.2.0",
  "appId": "careers-portal",
  "sessionId": "fmt_1a2b3c4d0",
  "sentAt": 1737050400000,
  "reason": "pagehide",
  "events": [{ "id": "…", "type": "hesitation", "t": 8421, "field": { "key": "salary", "form": "apply" }, "data": { "ms": 5310 } }]
}
```

Sending to another origin? Prefer a same-origin endpoint (a reverse proxy
route) or `transport: 'fetch'`: a beacon with a JSON body triggers a CORS
preflight with credentials, which `formatir/server` supports via `cors`.

## Framework bindings

Each binding is a separate entry point with an optional peer dependency.

### React - `formatir/react`

```tsx
import { FormatirProvider, useFormatir, useFormatirEvent, useFormatirSnapshot } from 'formatir/react';

<FormatirProvider endpoint="/api/formatir" root="#application-form">
  <ApplicationForm />
</FormatirProvider>;

function ApplicationForm() {
  const formatir = useFormatir();                       // null until mounted
  const snapshot = useFormatirSnapshot(1000);           // live score and field stats
  useFormatirEvent('form_dropoff', (e) => console.warn(e.data.lastField));
  // ...
}
```

`useFormatirInstance(options)` creates a component-scoped instance without a
provider; `root` also accepts a ref. Instances are created after mount and
destroyed on unmount, so StrictMode double-mounts never double-count.

### Vue - `formatir/vue`

```ts
import { FormatirPlugin, useFormatir, useFormatirEvent, useFormatirInstance } from 'formatir/vue';

createApp(App).use(FormatirPlugin, { endpoint: '/api/formatir' }).mount('#app');

// in setup():
const formatir = useFormatir();                         // ShallowRef<FormatirInstance | null>
useFormatirEvent('rage_click', (e) => console.warn(e.data.selector));

// or a component-scoped instance on a template ref:
const form = ref<HTMLFormElement>();
const scoped = useFormatirInstance({ root: form });
```

### Svelte - `formatir/svelte`

```svelte
<script>
  import { formatir } from 'formatir/svelte';
  let tracker;
</script>

<form use:formatir={{ endpoint: '/api/formatir', onInstance: (f) => (tracker = f) }}>
```

The action has no dependency on Svelte and works as a SolidJS `use:` directive too.

### SPA routing

Formatir cannot see a client-side route change, so tell it about one:

```ts
router.beforeEach(() => formatir.reportDropoff());
```

## Validation adapters

Framework validation never reaches the browser's constraint validation, so
report it explicitly. Both adapters send only the error *type* or *code*,
never the message.

### React Hook Form - `formatir/react-hook-form`

```tsx
import { createErrorReporter, formatirOnInvalid } from 'formatir/react-hook-form';

// On submit:
<form onSubmit={handleSubmit(onValid, formatirOnInvalid(formatir))}>

// Or continuously (mode: 'onBlur' / 'onChange') - reports new or changed errors only:
const report = useMemo(() => createErrorReporter(formatir), [formatir]);
useEffect(() => report(formState.errors), [report, formState.errors, formState.submitCount]);
```

Nested objects and field arrays use RHF's dot paths (`jobs.1.title`), which
match the `name` attributes RHF renders.

### Zod - `formatir/zod`

```ts
import { reportZodError, withFormatir } from 'formatir/zod';

const schema = withFormatir(formatir, ApplicationSchema);
const result = schema.safeParse(values);   // failures are reported automatically

// or by hand:
if (!result.success) reportZodError(formatir, result.error);
```

## Collector - `formatir/server`

A runtime-agnostic receiving end built on the Fetch API (Node >= 18, Deno,
Bun, Cloudflare Workers, Vercel, Netlify, Hono).

```ts
import { createHandler } from 'formatir/server';

const handler = createHandler({
  onBatch: async (batch) => db.insert('events', batch.events),
  appIds: ['careers-portal'],          // optional allowlist
  cors: ['https://careers.example'],   // optional; default same-origin only
  maxBytes: 256 * 1024,                // default
});

// Cloudflare Workers / Deno / Bun
export default { fetch: handler };

// Hono
app.post('/api/formatir', (c) => handler(c.req.raw));

// Express / node:http - mount before any body parser
import { toNodeListener } from 'formatir/server';
app.post('/api/formatir', toNodeListener(handler));
```

Responses: `204` stored, `400` invalid batch, `403` origin or app not allowed,
`405` wrong method, `413` too large, `500` when `onBatch` throws - which makes
the SDK keep the batch and retry it later.

`parseBatch(body)` validates a batch on its own, and the JSON schema ships with
the package as `formatir/schema.json` for other languages and pipelines.

## Writing plugins

A plugin is a function that receives the same context the built-in detectors
use. Listeners registered through `ctx.on()` and timers from `ctx.timer()` are
cleaned up by `stop()` and `destroy()`.

```ts
import type { Plugin } from 'formatir';

const tooltipOpened: Plugin = (ctx) => {
  ctx.on(document, 'toggle', (e) => {
    const el = e.target as Element;
    if (ctx.watches(el) && el.matches('[data-help]')) ctx.emit('custom', { name: 'help_opened' });
  }, true);
};

Formatir.init({ plugins: [tooltipOpened] });
```

The context also offers `ctx.state` (session state), `ctx.stats(field)` (per
field counters), `ctx.signal(name)` (feed the score without an event) and
`ctx.onStep(fn)`.

## Bundle size

| Entry                      | gzipped |
| -------------------------- | ------: |
| `formatir`                 |  5.5 KB |
| `formatir/extras`          |  1.4 KB |
| `formatir/react`           |  0.5 KB |
| `formatir/vue`             |  0.5 KB |
| `formatir/svelte`          |  0.2 KB |
| `formatir/react-hook-form` |  0.5 KB |
| `formatir/zod`             |  0.3 KB |
| `formatir/server`          |  1.7 KB |

`pnpm build` prints the sizes and fails above the budgets in
`scripts/size.mjs` (6 KB for the core, 2 KB for the extras).

## License

[MIT](../../LICENSE)
