# formatir

## 0.2.0

### Minor Changes

- 7adef5a: Consent controls (`autoStart`, `start()` / `stop()`, `optIn()` / `optOut()`), a `beforeSend` hook, PII redaction for `js_error`, configurable score weights, a persistent offline outbox with retries, `create()` for multiple instances, per-form attribution and shadow DOM support. New entries: `formatir/extras` (paste, autofill, revisits, funnel, thrash), `formatir/react`, `formatir/vue`, `formatir/svelte`, `formatir/react-hook-form`, `formatir/zod` and `formatir/server` plus a JSON schema for batches.
- 4b5392b: New `errorScope` option: `'root'` limits `js_error` to errors that happen while the user works in `root` (focus inside it, or within 2 s of an interaction there). The default `'page'` keeps reporting every error.

### Patch Changes

- a8c6b87: A selector `root` is now matched on every event instead of once at `init()`. Tracking keeps working when a framework replaces the element, and a selector that matches nothing no longer falls back to tracking the whole document.
- 47b5cfd: `init()` no longer throws during server-side rendering when `root` is a selector; it returns a disabled instance like it does without `root`.

## 0.1.0

### Minor Changes

- Initial release: six behavioural detectors (`rage_click`, `dead_click`,
  `hesitation`, `field_effort`, `form_dropoff`, `js_error`), a saturating
  frustration score and a beacon transport. ESM, CJS and IIFE builds.
