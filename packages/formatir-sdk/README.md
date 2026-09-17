# Formatir

> Privacy-first behaviour analytics for web forms and application processes.
> Zero dependencies, **< 5 KB gzipped**, works with plain HTML, React, Vue and SPAs.

Formatir answers the question analytics funnels cannot: *why* people struggle in
your form. It watches interaction behaviour - not content - and turns it into
six actionable metrics plus a frustration score.

```bash
npm i formatir      # pnpm add formatir / yarn add formatir
```

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
<script>
  var formatir = Formatir.init({ endpoint: '/api/formatir' });
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
| `js_error`         | Uncaught error or unhandled rejection during the form session                   | `message`, `source`, `line`, `kind`         |

Lifecycle events round out the stream: `session_start`, `field_focus`,
`field_blur`, `form_submit`, `score` and `custom`.

### Frustration score

Every weighted signal feeds a saturating score, `100 * (1 - e^(-raw/55))`, so it
approaches but never exceeds 100. A `score` event is emitted whenever the value
changes; `level` is one of `calm`, `mild`, `elevated`, `severe`.

## Privacy by design

Formatir never reads what a user typed.

- No values, no `innerText`, no clipboard, no keystroke content - only
  `value.length`, counters and time deltas.
- Fields are identified by `data-formatir-field`, `name` or `id`; otherwise a
  structural fallback key is generated.
- Click targets are described with structural selectors (tag / id / class /
  position), never with text content.
- `data-formatir-ignore` on any element opts its whole subtree out.
- Browser validation *messages* are deliberately ignored (they can echo the
  entered value); only the `ValidityState` flag name is reported.

## API

```ts
const formatir = Formatir.init(options);

formatir.on(metric, listener);      // returns an unsubscribe function
formatir.off(metric, listener);
formatir.track('cv_uploaded', { sizeKb: 812 });
formatir.setStep('experience');     // tag events with a wizard step
formatir.reportValidationError('email', 'typeMismatch');
formatir.markSubmitted();
formatir.reportDropoff();           // e.g. on an SPA route change
formatir.getSnapshot();             // score, per-field stats, queue size
formatir.flush();
formatir.destroy();
```

### Options

| Option            | Default                    | Description                                        |
| ----------------- | -------------------------- | -------------------------------------------------- |
| `endpoint`        | -                          | Collector URL. Without it Formatir stays local.     |
| `appId`           | -                          | Sent with every batch.                              |
| `root`            | `document`                 | Selector or element to observe.                     |
| `sessionId`       | generated                  | Reuse an existing id.                               |
| `batchSize`       | `20`                       | Events per batch before an automatic flush.         |
| `flushIntervalMs` | `5000`                     | Periodic flush; `0` disables it.                    |
| `sampleRate`      | `1`                        | Fraction of sessions recorded.                      |
| `transport`       | `'beacon'`                 | `beacon` \| `fetch` \| `none`.                      |
| `ignoreSelector`  | `'[data-formatir-ignore]'` | Opt-out selector.                                   |
| `thresholds`      | see above                  | Per-detector tuning.                                |
| `onEvent`         | -                          | Convenience hook for every event.                   |
| `debug`           | `false`                    | Log every event to the console.                     |

### Transport

Batches are sent with `navigator.sendBeacon` and fall back to
`fetch(..., { keepalive: true })`. Flushes happen on `batchSize`, on the flush
interval, on `visibilitychange` (hidden) and on `pagehide`, so the final
drop-off event survives the unload.

```jsonc
// POST body
{
  "sdk": "formatir",
  "v": "0.1.0",
  "appId": "careers-portal",
  "sessionId": "fmt_1a2b3c4d0",
  "sentAt": 1737050400000,
  "reason": "pagehide",
  "events": [{ "id": "…", "type": "hesitation", "t": 8421, "field": { "key": "salary" }, "data": { "ms": 5310 } }]
}
```

## Framework usage

### React

```tsx
useEffect(() => {
  const formatir = Formatir.init({ root: '#application-form' });
  const off = formatir.on('*', setLatestEvent);
  return () => {
    off();
    formatir.destroy();
  };
}, []);
```

### Vue

```ts
onMounted(() => (formatir = Formatir.init({ root: '#application-form' })));
onBeforeUnmount(() => formatir.destroy());
```

### SPA routing

Formatir cannot see a client-side route change, so tell it about one:

```ts
router.beforeEach(() => formatir.reportDropoff());
```

## Bundle size

`pnpm build` prints the gzipped size and fails above the 5 KB budget.

