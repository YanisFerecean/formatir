# Formatir

**English** · [Deutsch](README.de.md)

[![npm](https://img.shields.io/npm/v/formatir?color=7c3aed)](https://www.npmjs.com/package/formatir)
[![CI](https://github.com/YanisFerecean/formatir/actions/workflows/ci.yml/badge.svg)](https://github.com/YanisFerecean/formatir/actions/workflows/ci.yml)
[![Pages](https://github.com/YanisFerecean/formatir/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/YanisFerecean/formatir/actions/workflows/deploy-pages.yml)
[![license](https://img.shields.io/npm/l/formatir?color=64748b)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-34d399)](CONTRIBUTING.md)

**Live demo: [yanisferecean.github.io/formatir](https://yanisferecean.github.io/formatir/)** ·
**npm: [`formatir`](https://www.npmjs.com/package/formatir)**

> Behaviour analytics for web forms and application processes.
> A dependency-free TypeScript SDK (core **~5.5 KB gzipped**) plus an interactive showcase app.

Conversion numbers tell you **that** a form fails. Formatir tells you **why**:
rage clicks, dead clicks, hesitation, correction loops, abandonment fields and
JavaScript errors - in real time and without capturing a single typed value.

## Monorepo

```
.
├── packages/formatir-sdk   # the SDK (npm package "formatir", ESM + CJS + IIFE)
├── apps/showcase           # Vite + React + Tailwind demo with a live dashboard
├── .changeset              # pending release notes (changesets)
└── .github                 # CI, Pages deployment, npm publishing, templates
```

| Package                 | Description                                                         |
| ----------------------- | ------------------------------------------------------------------- |
| `packages/formatir-sdk` | Detectors, frustration score, transport, bindings and collector. [Docs](packages/formatir-sdk/README.md) |
| `apps/showcase`         | Multi-step application form with a telemetry panel and developer docs. |

### Entry points

| Import                     | What it is                                                     |
| -------------------------- | -------------------------------------------------------------- |
| `formatir`                 | Core SDK: six detectors, score, consent, transport, plugins     |
| `formatir/extras`          | Opt-in detectors: paste, autofill, revisits, funnel, thrash     |
| `formatir/react`           | `FormatirProvider` and hooks                                    |
| `formatir/vue`             | Vue plugin and composables                                      |
| `formatir/svelte`          | `use:formatir` action                                           |
| `formatir/react-hook-form` | Report RHF validation errors                                    |
| `formatir/zod`             | Report Zod issues                                               |
| `formatir/server`          | Fetch-API collector handler, `parseBatch`, Node adapter         |
| `formatir/schema.json`     | JSON schema of the batch envelope                               |

## Quickstart

```bash
npm i formatir   # add the SDK to an existing project

# or work on this monorepo:
pnpm install     # pnpm >= 10, Node >= 20.19
pnpm build       # build the SDK (with size budgets), then the showcase
pnpm dev         # showcase on http://localhost:5173
```

More scripts:

| Script                 | Effect                                                         |
| ---------------------- | -------------------------------------------------------------- |
| `pnpm build`           | Builds all workspaces in topological order.                     |
| `pnpm dev`             | Dev server; the SDK is aliased to its source (HMR).             |
| `pnpm preview`         | Local preview of the production build.                          |
| `pnpm test`            | Runs the SDK's Vitest suite (happy-dom).                        |
| `pnpm typecheck`       | `tsc --noEmit` across all packages.                             |
| `pnpm size`            | Gzip / Brotli size of every entry against its budget.           |
| `pnpm changeset`       | Describe your change for the changelog.                         |

## The six core detectors

| Metric         | Trigger                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| `rage_click`   | >= 3 clicks within 500 ms on the same element or within a 32 px radius       |
| `dead_click`   | Click on a static element with no visible reaction (1000 ms)                |
| `hesitation`   | > 3000 ms between focus and first input - or a field left without input     |
| `field_effort` | Keystrokes, corrections, refills and validation errors per field            |
| `form_dropoff` | The page is left without submitting; reports the last touched field         |
| `js_error`     | Uncaught errors and promise rejections during the form session              |

Plus `session_start`, `field_focus`, `field_blur`, `validation_error`,
`form_submit`, `score` and `custom` - and, through `formatir/extras`, `paste`,
`autofill`, `field_revisit`, `step_change` and `thrash`.

## Integration

```ts
import { Formatir } from 'formatir';
import { funnel, paste } from 'formatir/extras';

const formatir = Formatir.init({
  endpoint: '/api/formatir',
  appId: 'careers-portal',
  root: '#application-form',
  autoStart: false,                 // wait for consent
  plugins: [paste(), funnel()],
});

consent.onAccept(() => formatir.optIn());

formatir.on('form_dropoff', (event) => {
  console.warn('Abandoned at', event.data.lastField?.key);
});
```

The full API, options, bindings and collector docs live in
[`packages/formatir-sdk/README.md`](packages/formatir-sdk/README.md).

## Privacy by design

Formatir never reads **what** someone types - only `value.length`, counters and
time deltas. Click targets are described with structural selectors, browser
validation messages are ignored on purpose (they can echo the input),
`js_error` messages are scrubbed of e-mail addresses and number sequences, and
`data-formatir-ignore` removes whole subtrees from measurement. Consent is
built in (`autoStart: false`, `optIn()`, `optOut()`), and `beforeSend` lets you
rewrite or drop any event before it leaves the browser.

## Deployment

* **GitHub Pages** - `.github/workflows/deploy-pages.yml` builds the showcase
  and publishes `apps/showcase/dist`. The base path is derived from
  `GITHUB_REPOSITORY` in `apps/showcase/vite.config.ts` and can be overridden
  with `VITE_BASE`. One-time setup: *Settings -> Pages -> Source: GitHub Actions*.
* **npm** - `.github/workflows/publish-npm.yml` publishes the SDK when a GitHub
  release is published, using `npm publish --provenance` over OIDC. No
  `NPM_TOKEN` is needed, only a Trusted Publisher on npmjs.com.
  Release flow: merge PRs with changesets -> `pnpm version-packages` -> commit
  -> publish a GitHub release.

## Contributing

Contributions are welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md) to get
started, and please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security
issues go through [SECURITY.md](SECURITY.md), not public issues.

## License

[MIT](LICENSE)
