# Contributing

Thanks for your interest in `@goodnight-dev/utils`. This repository doubles as a
showcase of how to build a modern, strict, well-packaged TypeScript utility
suite — so _how_ the code is written matters as much as _what_ it does. These
principles are the point of the project.

## Principles

### 1. The safest, most performant implementation wins

Every function is implemented in the safest **and fastest** way we can justify —
where "fastest" means the quickest of the _correct_ alternatives we benchmarked,
not an unmeasured boast. We explicitly do **not** optimize for readability,
cleverness, or functional-programming aesthetics.

- **Correctness first, then speed.** "Safe" means correct across the entire
  input domain — Unicode, empty values, boundary cases — and free of footguns.
  We never trade correctness for a microbenchmark win. "Bomb-proof" beats "fast
  but wrong."
- **Avoid regular expressions** when a direct `charCodeAt` / `charAt` / `slice`
  approach is as correct and faster. Regex is a last resort, not a reflex.
- **Minimize allocations** and intermediate strings/arrays in hot paths.
- **Lean on built-ins** (`String.prototype.*`, `Array.prototype.*`, `Math.*`)
  when they are as fast — and hand-roll a loop when it is measurably faster.
- When two approaches are close — or whenever the notes claim one is faster —
  **measure it.** Check the alternatives in as runnable code, gate their
  correctness with a parity test, and benchmark them; see
  [ADR 0003](./docs/adr/0003-substantiating-performance-claims.md) and the
  [benchmarking recipe](./docs/recipes/benchmarking-a-function.md). Record the
  result, and the environment it was measured on, in the function's sibling doc
  (§3).

### 2. Zero third-party runtime dependencies

A published package must add **nothing** to a consumer's `node_modules` except
our own code.

- **Leaf packages** (`@goodnight-dev/string`, `@goodnight-dev/array`, …) declare
  **no** runtime `dependencies` at all.
- The **umbrella** `@goodnight-dev/utils` is the _only_ place runtime
  dependencies are permitted, and only on other `@goodnight-dev/*` packages.
  This is intentional: it re-exports them while they version independently.
- If a third-party runtime dependency ever becomes genuinely unavoidable in a
  leaf package, **bundle it into `dist`** with tsdown rather than declaring it,
  so consumers never receive a separate transitive install.
- `devDependencies` are unrestricted — they never ship to consumers.

### 3. Per-function academic docs

A function may carry a sibling Markdown file describing _how else it could be
done_ and _why we chose what we chose_:

```
packages/string/src/capitalize.ts
packages/string/src/capitalize.md   ← sibling note
```

These are reference notes — and seeds for future blog posts — **not** API docs.
API docs are generated from the TSDoc comments on the function itself. A good
per-function note covers:

- the chosen implementation and its rationale,
- alternative implementations,
- their trade-offs (performance, correctness, readability), and
- benchmarks or gotchas worth remembering.

Sibling `.md` files live in `src/` and are **not published to npm** — only
`dist/` ships (see each package's `files` field). They exist for the repository
and its author.

### 4. Every export tree-shakes

A consumer who imports one utility must bundle only that utility — never its
siblings. Three habits keep that true:

- **One function per module**, re-exported from the barrel with a static
  `export { fn } from './fn'`. The unit a bundler keeps or drops is a single
  function.
- **`"sideEffects": false`** on every package, and no top-level side effects in
  any module. Watch for computed top-level values like `const TABLE = build()` —
  wrap them in `/* @__PURE__ */` or compute lazily.
- **Import siblings by file path, never through the barrel.** Inside a package
  write `import { isNumber } from './is-number'`, not `from './index'` or the
  package's own name. Routing internal reuse through the barrel couples your
  module to everything the barrel re-exports; a direct path keeps the module
  graph an acyclic set of leaves.

A note on what actually does the shaking, because it is easy to over-credit
`sideEffects: false`: tsdown bundles each leaf into a single `dist/index.mjs`,
so esbuild and Rollup drop an unused function through ordinary statement-level
dead-code elimination — independent of the flag. `sideEffects: false` earns its
keep for **webpack** consumers (more conservative; it leans on the flag to prune
across modules) and for any future multi-module package shape. Keep it
everywhere; just know it is belt-and-suspenders for the current single-file
leaves, not the load-bearing wall.

What genuinely defeats shaking is **coupling** — one function calling another, a
shared mutable top-level value, or a side-effecting barrel — because then the
unused export can no longer be separated from the used one. That guarantee is
enforced by a regression fixture
([`packages/utils/src/tree-shaking.test.ts`](./packages/utils/src/tree-shaking.test.ts)):
it bundles a single import from each entry point and asserts the other
function's code is absent.

## Development

This is a [pnpm](https://pnpm.io) workspace; Node `>=20` (see `.nvmrc`).

```sh
pnpm install        # install + link workspace packages
pnpm build          # build every package (tsdown)
pnpm test           # run the test suite (vitest)
pnpm typecheck      # tsc --noEmit across packages
pnpm lint           # eslint (strictTypeChecked)
pnpm format         # prettier --check
pnpm check:exports  # publint + are-the-types-wrong
pnpm check          # everything above, in order
```

Run `pnpm check` before opening a pull request.

## Adding a function

1. Create `src/<name>.ts` with a thorough TSDoc comment (summary, `@param`,
   `@returns`, `@example`), implemented per §1 — safest and most performant, no
   regex unless justified.
2. Add `src/<name>.test.ts` covering the edge cases (empty input, Unicode,
   boundaries).
3. Re-export it from the package's `src/index.ts`. This is the step that makes
   it importable, and the easiest to skip — `pnpm check` still passes without
   it.
4. Add it to the package's entry-point test (`src/index.test.ts`) so a forgotten
   re-export fails the build instead of shipping.
5. Add the function to the package's `README.md` API section (hand-maintained,
   so a new export is invisible to consumers until you do).
6. If the implementation has interesting alternatives, add `src/<name>.md` (§3).
7. Run `pnpm check`, then add a changeset: `pnpm changeset`.

For the full walkthrough — including adding a whole new package and cutting a
release — see the [recipes](./docs/recipes/):

- [Adding a function](./docs/recipes/adding-a-function.md)
- [Adding a package](./docs/recipes/adding-a-package.md)
- [Cutting a release](./docs/recipes/cutting-a-release.md)

## Commit conventions

Commit messages follow
[Conventional Commits](https://www.conventionalcommits.org/) and are
**enforced** by `commitlint` on the `commit-msg` git hook. The hooks are wired
up with [lefthook](https://lefthook.dev) and installed automatically by the
`prepare` script when you run `pnpm install`.

Format:

```
<type>(<optional scope>): <description>
```

- **type** — `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`,
  `chore`, `revert`, …
- **scope** (optional, encouraged) — the affected package or area: `string`,
  `utils`, `repo`, `ci`, `deps`.

```
feat(string): add kebabCase
fix(array): handle empty input in chunk
docs(string): expand capitalize.md notes
chore(repo): bump dev dependencies
```

> **Conventional commits here are for history hygiene only — they do _not_ drive
> version numbers.** Version bumps are declared explicitly with Changesets (see
> below). Rationale:
> [docs/adr/0001-versioning-and-commit-conventions.md](./docs/adr/0001-versioning-and-commit-conventions.md).

The `pre-commit` hook also runs Prettier and ESLint (`--fix`) on staged files.

## Versioning & releases

[Changesets](https://github.com/changesets/changesets) is the **single source of
truth** for version bumps. Packages are versioned **independently** — `fixed`
and `linked` are empty in `.changeset/config.json`, so each package moves on its
own.

Workflow:

1. Make your change and commit it with a conventional-commit message.
2. Run `pnpm changeset`, pick the affected package(s) and the bump level (patch
   / minor / major), and write a short summary. This writes a markdown file
   under `.changeset/`.
3. Commit that changeset alongside your change.

At release time, `pnpm version-packages` (`changeset version`) consumes the
accumulated changesets: it bumps each package independently, regenerates
per-package `CHANGELOG.md` files, and bumps internal dependents (the
`@goodnight-dev/utils` umbrella is patched whenever a package it re-exports
changes). `pnpm release` then builds and runs `changeset publish`.

**Why not derive versions from the commit messages?** In a monorepo a single
commit message can't cleanly express "bump `string` minor and `array` patch" —
the message is global, but versioning is per-package. Changesets lets the author
state per-package intent explicitly. Full rationale in the ADR linked above.
