# Recipe: adding a function

How to add a new utility to an _existing_ package — for example, a new helper in
`@goodnight-dev/string`. To add a whole new area package first, see
[Adding a package](./adding-a-package.md).

Replace `string` / `capitalize` below with your area and function name.

## Checklist

Every step matters, but step 4 is the one that bites: a function can be written,
tested, documented, and released while still being **unreachable** by consumers,
because nothing fails. Treat the barrel and the entry-point test as part of
"done," not paperwork.

- [ ] 1. Source file with thorough TSDoc — `src/<fn>.ts`
- [ ] 2. Per-function tests — `src/<fn>.test.ts`
- [ ] 3. (Optional) implementation notes — `src/<fn>.md`
- [ ] 4. **Re-export from the barrel** — `src/index.ts` _(the step that makes it
     importable; skipping it still passes `pnpm check`)_
- [ ] 5. **Add it to the entry-point test** — `src/index.test.ts`
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

## 4. Export it from the barrel

Re-export from the package barrel `packages/string/src/index.ts`, kept in
alphabetical order:

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
