# Recipe: adding a function

How to add a new utility to an _existing_ package — for example, a new helper in
`@goodnight-dev/string`. To add a whole new area package first, see
[Adding a package](./adding-a-package.md).

Replace `string` / `capitalize` below with your area and function name.

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

## 3. Export it

Re-export from the package barrel `packages/string/src/index.ts`:

```ts
export { capitalize } from './capitalize';
```

## 4. (Optional) Add implementation notes

If there are interesting alternatives, add a sibling
`packages/string/src/capitalize.md` documenting how else it could be done and
why you chose what you chose. These notes are repo-only (never published). See
[`capitalize.md`](../../packages/string/src/capitalize.md) for the format.

## 5. Verify and changeset

```sh
pnpm check        # format, lint, build, typecheck, test, package exports
pnpm changeset    # select the package; a new function is a `minor` bump
```

A new function is a new feature → **minor**. A bug fix → **patch**.

## 6. Commit and open a PR

Use a Conventional Commit message, e.g. `feat(string): add capitalize`, and open
a PR. CI runs `pnpm check` on Node 20, 22, and 24; merge once it's green.
