# Recipe: adding a package

How to add a new area package (e.g. `@goodnight-dev/array`), wired into the
umbrella and the docs site. Replace `array` with your area name throughout.

The repo's structure: each leaf package is standalone and independently
versioned; the umbrella `@goodnight-dev/utils` re-exports them so consumers can
import the whole suite or by subpath.

## Scaffold with `pnpm new`

```sh
pnpm new            # pick "package", then answer the prompts
```

The `package` generator does the mechanical parts of steps 1–4 below: it writes
the leaf's files from `templates/package/`, wires the package into the umbrella
(runtime dependency, `./<area>` export subpath, tsdown entry, barrel re-export)
and the TypeDoc entry points, and — because a package is rarely useful empty —
offers to roll straight into [Adding a function](./adding-a-function.md) for the
first function. Then finish with:

```sh
pnpm install        # link the new workspace package
pnpm check          # format, lint, build, typecheck, test, package exports
pnpm changeset      # select the new package
```

The numbered sections below are the manual reference for what the generator
produces — follow them by hand only when not using `pnpm new`.

## 1. Scaffold the package

Create `packages/array/` with these files.

`packages/array/package.json`:

```json
{
  "name": "@goodnight-dev/array",
  "version": "0.0.0",
  "description": "Array utilities — part of the @goodnight-dev utility suite.",
  "keywords": ["utils", "array", "typescript", "esm", "tree-shakable"],
  "license": "MIT",
  "author": "Ian Goodnight",
  "homepage": "https://github.com/goodnight-dev/utils/tree/main/packages/array#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/goodnight-dev/utils.git",
    "directory": "packages/array"
  },
  "bugs": { "url": "https://github.com/goodnight-dev/utils/issues" },
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": { "types": "./dist/index.d.mts", "import": "./dist/index.mjs" },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "engines": { "node": ">=20" },
  "publishConfig": { "access": "public" },
  "scripts": { "build": "tsdown" }
}
```

`packages/array/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "tsdown.config.ts"]
}
```

`packages/array/tsdown.config.ts`:

```ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  dts: true,
  clean: true,
});
```

`packages/array/src/index.ts` — start empty, or with your first export.

Also copy a `README.md` and `LICENSE` from an existing package (npm always
includes them in the tarball, even though `files` only lists `dist`).

## 2. Install the package's build tools

Each package owns its build tooling so its `build` script can resolve it:

```sh
pnpm --filter @goodnight-dev/array add -D tsdown typescript
```

## 3. Wire it into the umbrella

So `import { ... } from '@goodnight-dev/utils/array'` and the whole-suite barrel
both work:

- Add the runtime dependency to `packages/utils/package.json`:

  ```json
  "dependencies": {
    "@goodnight-dev/array": "workspace:*"
  }
  ```

- Add the subpath to `packages/utils/package.json` `exports`:

  ```json
  "./array": { "types": "./dist/array.d.mts", "import": "./dist/array.mjs" }
  ```

- Add the entry to `packages/utils/tsdown.config.ts`:

  ```ts
  entry: ['src/index.ts', 'src/string.ts', 'src/array.ts'],
  ```

- Create `packages/utils/src/array.ts`:

  ```ts
  export * from '@goodnight-dev/array';
  ```

- Add it to the barrel `packages/utils/src/index.ts`:

  ```ts
  export * from '@goodnight-dev/array';
  ```

## 4. Add it to the API docs

Add the package to `entryPoints` in the root `typedoc.json`:

```json
"entryPoints": ["packages/string", "packages/array"]
```

And create `packages/array/typedoc.json`:

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["src/index.ts"]
}
```

Finally, add a row for the package to the two hand-maintained tables: the
`## Packages` table in the root `README.md` and the `## Subpaths` table in
`packages/utils/README.md`. (The `pnpm new` generator does not touch these —
like the per-package README API sections, they are prose the author maintains.)

## 5. Add a first function

Follow [Adding a function](./adding-a-function.md).

## 6. Install, verify, release

```sh
pnpm install      # links the new workspace package
pnpm check        # format, lint, build, typecheck, test, package exports
pnpm changeset    # select the new package; the umbrella is bumped automatically
```

Then commit (`feat(array): add the array package`) and open a PR.

## 7. First publish to npm (one-time)

A brand-new package needs two one-time steps on npm that existing packages
already have — CI's OIDC publish **cannot create a package that does not exist
yet**, so the first release will not work until these are done:

1. **Bootstrap publish** to create the package on npm:
   `pnpm --filter @goodnight-dev/array publish --access public`.
2. **Configure its Trusted Publisher** on npmjs.com so the `Release` workflow
   can publish it over OIDC afterwards.

Both are covered in detail in
[Cutting a release → One-time setup](./cutting-a-release.md#one-time-setup) (§b
and §c). After that, the package releases automatically through the normal
Changesets flow like every other package.
