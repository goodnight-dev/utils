# @goodnight-dev/utils

A small, strict, modern TypeScript utility suite — the everyday helpers you end
up rewriting in every project, packaged the right way.

[![npm](https://img.shields.io/npm/v/@goodnight-dev/utils)](https://www.npmjs.com/package/@goodnight-dev/utils)
[![CI](https://github.com/goodnight-dev/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/goodnight-dev/utils/actions/workflows/ci.yml)
[![docs](https://img.shields.io/badge/docs-online-blue)](https://goodnight-dev.github.io/utils/)

> **Status:** published on npm — the packaging, CI, docs, and release pipeline
> are in place; the utility surface is still small and growing. As much a
> showcase of npm packaging best practices as a utility library.

## Install

```sh
# the whole suite
pnpm add @goodnight-dev/utils

# or just the area you need (independently versioned)
pnpm add @goodnight-dev/string
```

## Three ways to import

```ts
// 1. Granular package — smallest dependency surface, versioned on its own.
import { capitalize } from '@goodnight-dev/string';

// 2. Umbrella subpath — one dependency, organized by area.
import { capitalize } from '@goodnight-dev/utils/string';

// 3. Whole suite — everything from one entry point.
import { capitalize } from '@goodnight-dev/utils';
```

All three are fully typed, ESM-only, and tree-shakable.

## Packages

| Package                 | Description      |
| ----------------------- | ---------------- |
| `@goodnight-dev/utils`  | Umbrella package |
| `@goodnight-dev/string` | String utilities |

## Project goals

- 100% TypeScript with declaration files generated for consumers
- Modern ESM only
- Strictest practical linting + formatting (typescript-eslint
  `strictTypeChecked` + Prettier)
- Importable as a whole or by tree-shakable subpath / per-area package
- Independently versioned packages via Changesets
- Comprehensive generated API docs
- **Zero third-party runtime dependencies**
- Every function implemented the safest, most performant way

## Principles

This repo is opinionated about _how_ the code is written. See
[CONTRIBUTING.md](./CONTRIBUTING.md) for the full rationale; in short:

- **Performance over prettiness.** Functions are implemented in the safest and
  most performant way the platform allows — not for readability or functional
  style. Regex is avoided where a faster, equally-correct approach exists.
- **Zero third-party runtime dependencies.** Installing a package adds nothing
  to your `node_modules` but our own code.
- **Per-function notes.** Many functions carry a sibling `*.md` (repo-only,
  academic) explaining alternative implementations and why we chose ours — e.g.
  [`capitalize.md`](./packages/string/src/capitalize.md).

## Development

This is a [pnpm](https://pnpm.io) workspace. Requires Node `>=20`.

```sh
pnpm install        # install + link workspace packages
pnpm build          # build every package (tsdown)
pnpm test           # run the test suite (vitest)
pnpm typecheck      # tsc --noEmit across packages
pnpm lint           # eslint
pnpm format         # prettier --check
pnpm check          # everything: format, lint, build, typecheck, test, exports
pnpm docs:build     # generate the API docs site (TypeDoc)
```

## Documentation

- **[API reference](https://goodnight-dev.github.io/utils/)** — generated from
  TSDoc comments.
- **[`docs/`](./docs/)** — recipes (adding a function, adding a package, cutting
  a release) and architecture decision records.

## License

[MIT](./LICENSE) © Ian Goodnight
