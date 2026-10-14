# Contributing to Formatir

Thanks for taking the time to contribute! Bug reports, ideas, docs fixes and
code are all welcome.

## Ground rules

- Be kind - this project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
- Report security issues privately, see [SECURITY.md](SECURITY.md).
- For larger changes, open an issue first so we can agree on the approach.

## Project principles

Every change to the SDK is measured against these:

1. **Privacy first.** Never read, store or send what a user typed. Lengths,
   counters, timings and structural identifiers only.
2. **Small.** The core must stay below its gzip budget (6 KB). New detectors
   belong in `formatir/extras` unless every user needs them.
3. **Zero dependencies.** Framework bindings use optional peer dependencies;
   adapters use structural types instead of importing the library.
4. **Never break the host page.** User callbacks and DOM handlers must not
   throw into the page.

## Development setup

Requirements: Node >= 20.19 and pnpm (the version comes from `packageManager`;
`corepack enable` sets it up).

```bash
git clone https://github.com/YanisFerecean/formatir.git
cd formatir
pnpm install
pnpm dev          # showcase with the SDK aliased to its source (HMR)
```

| Command          | What it does                                              |
| ---------------- | --------------------------------------------------------- |
| `pnpm test`      | Vitest suite (`packages/formatir-sdk/test`, happy-dom)     |
| `pnpm typecheck` | `tsc --noEmit` in every workspace                          |
| `pnpm build`     | Builds the SDK, checks size budgets, builds the showcase   |
| `pnpm size`      | Size report for every entry point                          |

### Layout

```
packages/formatir-sdk/src
├── index.ts          # core entry (formatir)
├── types.ts          # public types
├── core/             # runtime, transport, score, DOM helpers
├── detectors/        # built-in detectors
├── extras/           # opt-in detectors (formatir/extras)
├── react/ vue/ svelte/            # framework bindings
├── react-hook-form/ zod/          # validation adapters
└── server/           # collector (formatir/server)
```

A detector is a function `(ctx) => void` that registers listeners through
`ctx.on()` and reports through `ctx.emit()` - see `src/detectors/rageClick.ts`
for a compact example.

## Making a change

1. Fork the repo and create a branch: `git checkout -b feat/my-change`.
2. Add or update tests in `packages/formatir-sdk/test`.
3. Run `pnpm typecheck && pnpm test && pnpm build`.
4. Add a changeset if the published package changes: `pnpm changeset`.
5. Update the docs (`packages/formatir-sdk/README.md`) for user-facing changes.
6. Open a pull request and fill in the template.

### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):
`feat(sdk): ...`, `fix(react): ...`, `docs: ...`, `test: ...`, `ci: ...`,
`chore: ...`. Keep each commit focused on one change.

### Adding a metric

New metrics need to be added in a few places so everything stays in sync:

- `MetricName` and `MetricPayloads` in `src/types.ts`
- `METRICS` in `src/server/index.ts` (a type check fails if you forget)
- `schema/batch.schema.json` (a test fails if it drifts)
- a default weight in `src/core/score.ts`, if it should feed the score
- the labels in `apps/showcase/src/lib/format.ts`
- the docs

## Releasing (maintainers)

1. Merge pull requests with their changesets.
2. `pnpm version-packages` bumps the version and writes the changelog; commit it.
3. Publish a GitHub release - the `publish-npm` workflow does the rest.
