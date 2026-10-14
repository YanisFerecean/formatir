# Changesets

Every pull request that changes the published `formatir` package should add a
changeset describing the change for the changelog:

```bash
pnpm changeset
```

Pick the bump (`patch` for fixes, `minor` for features, `major` for breaking
changes) and write one or two user-facing sentences. Maintainers run
`pnpm version-packages` before a release, which bumps the version and writes
`packages/formatir-sdk/CHANGELOG.md`.
