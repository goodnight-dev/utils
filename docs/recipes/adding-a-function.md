# Recipe: adding a function

How to add a new utility to an _existing_ package — for example, a new helper in
`@goodnight-dev/string`. To add a whole new area package first, see
[Adding a package](./adding-a-package.md).

Replace `string` / `capitalize` below with your area and function name.

## Scaffold it with `pnpm new`

```sh
pnpm new            # pick "function", then answer the prompts
```

The generator ([`plopfile.ts`](../../plopfile.ts), templates in
[`templates/`](../../templates/)) writes the files in steps 1–3 below from
templates, and **wires up the barrel export (step 4) for you** — the one step
that is a silent failure if forgotten (it shipped a broken `camelCase` in
`0.2.0`). Answer yes to the benchmark prompt to also scaffold the harness from
[Benchmarking a function](./benchmarking-a-function.md).

What it deliberately leaves to you it marks with `TODO` comments: the
implementation itself, the entry-point test, the README, and the changeset. The
repo bans `todo`/`fixme` comments in ESLint, so **`pnpm check` stays red until
you resolve every one** — the scaffold cannot be half-finished and still pass.
The checklist below is therefore both the manual recipe and the description of
what the generator hands you.

## Checklist

Every step matters, but step 4 is the one that bites: a function can be written,
tested, documented, and released while still being **unreachable** by consumers,
because nothing fails. Treat the barrel and the entry-point test as part of
"done," not paperwork.

- [ ] 1. Source file with thorough TSDoc — `src/<fn>.ts` _(scaffolded)_
- [ ] 2. Per-function tests — `src/<fn>.test.ts` _(scaffolded)_
- [ ] 3. (Optional) implementation notes — `src/<fn>.md` _(scaffolded)_
- [ ] 4. **Re-export from the barrel** — `src/index.ts` _(done for you by
     `pnpm new`; the step that makes it importable, and the one that still
     passes `pnpm check` if skipped)_
- [ ] 5. **Add it to the entry-point test** — `src/index.test.ts` _(fails until
     you do: the auto-added export is now in the surface, so the test goes red)_
- [ ] 6. Update the package's `README.md` API section
- [ ] 7. `pnpm check`, then `pnpm changeset` (a new function is a `minor` bump)
- [ ] 8. Conventional-commit + PR

## 1. Write the source

Create `packages/string/src/capitalize.ts` with a thorough TSDoc comment —
summary, `@param`, `@returns`, and an `@example`. The TSDoc is what renders in
the [API reference](https://goodnight-dev.github.io/utils/), so make it good.

```ts
/**
 * Capitalize the first character of a string and lowercase the rest.
 *
 * @param value - The string to capitalize.
 * @returns The capitalized string; an empty string is returned unchanged.
 *
 * @example capitalize('hELLO') // => 'Hello'
 */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
```

Implement it per the [principles](../../CONTRIBUTING.md#principles): safest
**and** most performant, correctness across the full input domain first, and no
regex where a direct `charCodeAt` / `charAt` / `slice` approach is as correct
and faster.

## 2. Write tests

Create `packages/string/src/capitalize.test.ts` and cover the edge cases (empty
input, Unicode, boundaries):

```ts
import { describe, expect, it } from 'vitest';

import { capitalize } from './capitalize';

describe('capitalize', () => {
  it('capitalizes the first letter and lowercases the rest', () => {
    expect(capitalize('hELLO')).toBe('Hello');
  });

  it('returns an empty string unchanged', () => {
    expect(capitalize('')).toBe('');
  });
});
```

## 3. (Optional) Add implementation notes

If there are interesting alternatives, add a sibling
`packages/string/src/capitalize.md` documenting how else it could be done and
why you chose what you chose. These notes are repo-only (never published). See
[`capitalize.md`](../../packages/string/src/capitalize.md) for the format.

If a note claims one approach is _faster_, back it with a benchmark rather than
an assertion — see [Benchmarking a function](./benchmarking-a-function.md).

## 4. Export it from the barrel

`pnpm new` does this for you, inserting the line in alphabetical order — so this
step is really "confirm it happened" unless you are working by hand. The barrel
`packages/string/src/index.ts` is a sorted list of re-exports
(`perfectionist/sort-exports` keeps it that way under `eslint --fix`):

```ts
export { camelCase } from './camel-case';
export { capitalize } from './capitalize';
```

> **This is the step that's easy to skip and hard to notice.** The tests in step
> 2 import the function directly (`from './capitalize'`), so they pass with or
> without this line. `build`, `typecheck`, `publint`, and `attw` all describe
> what the barrel _does_ export — none of them know your new function was
> supposed to be in it. Miss this line and you can write, test, document,
> version, and publish a function that consumers simply cannot import. (This
> happened with `camelCase` in `0.2.0`.) Step 5 is the guard against it.

## 5. Add it to the entry-point test

Update `packages/string/src/index.test.ts` so the new function is part of the
package's asserted public surface. This is the one test that exercises the
barrel, so a forgotten re-export from step 4 now fails `pnpm check` instead of
shipping:

```ts
import * as api from './index';

it('exports exactly the documented public surface', () => {
  expect(Object.keys(api).sort()).toStrictEqual(['camelCase', 'capitalize']);
});
```

## 6. Update the README

Add the function to the `## API` section of the package's `README.md` (and to
the usage example if it's a headline addition). The README is hand-maintained —
it is not generated from the source — so a new export is invisible to consumers
browsing npm until you add it here.

## 7. Verify and changeset

```sh
pnpm check        # format, lint, build, typecheck, test, package exports
pnpm changeset    # select the package; a new function is a `minor` bump
```

A new function is a new feature → **minor**. A bug fix → **patch**. The umbrella
`@goodnight-dev/utils` re-exports the leaves, so it is bumped automatically as a
dependency update — you do not need a separate changeset for it.

## 8. Commit and open a PR

Use a Conventional Commit message, e.g. `feat(string): add capitalize`, and open
a PR. CI runs `pnpm check` on Node 20, 22, and 24; merge once it's green. Docs
redeploy to GitHub Pages automatically on the next push to `main`.
