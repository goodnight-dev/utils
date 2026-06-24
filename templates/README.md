# Scaffolding templates

[Plop](https://plopjs.com) templates behind `pnpm new`. Run the generator from
the repo root:

```sh
pnpm new            # pick a generator, then answer the prompts
```

See [Adding a function](../docs/recipes/adding-a-function.md) for the full
workflow these templates fit into.

## Layout

```
templates/
  function/            ← the default function shape (string in, string out)
    source.ts.hbs
    test.ts.hbs
    notes.md.hbs
    fixtures.ts.hbs            ┐
    alternatives.ts.hbs        │ the optional benchmark harness
    alternatives.test.ts.hbs   │ (only emitted if you answer yes)
    bench.ts.hbs               ┘
```

Templates are [Handlebars](https://handlebarsjs.com); `{{name}}` is the function
name and `{{pkg}}` the target package directory. They lean on plop's
[baked-in case helpers](https://plopjs.com/documentation/#case-modifiers):
`{{dashCase name}}` (→ `snake-case`, file paths) and `{{constantCase pkg}}`
(→ `STRING`, the fixture constant prefix).

The benchmark harness shares one corpus per package: `fixtures.ts.hbs` is written
to `<pkg>.fixtures.ts` only if it does not exist yet, so the first benchmarked
function in a package creates it and the rest import the same `<PKG>_INPUTS`.

## Extending it for a new package type

The generator resolves each template per-run: for a target package in
`packages/<dir>/`, it looks for `templates/<dir>/<file>` first and falls back to
`templates/function/<file>`. So the `function/` set is the default, and any
package can override individual templates without touching the others.

The defaults are string-shaped — `(value: string): string`. When a package
needs a different shape, add an override directory rather than editing the
defaults. For example, a future `predicate` package whose functions are
`(value: unknown): boolean` would add:

```
templates/
  predicate/
    source.ts.hbs      ← (value: unknown): boolean
    test.ts.hbs        ← truthy/falsy assertions
    # notes.md.hbs, the benchmark harness, etc. fall through to function/
```

Only the files that genuinely differ need an override; everything else keeps
falling back to `function/`. Keep that fallback in mind — a generic template
edit changes every package that has not overridden it.

## Why the output is full of TODOs

The scaffold deliberately leaves `TODO` markers wherever it cannot make the call
for you — the implementation itself, the README entry, the changeset. The
repo's ESLint config bans `todo`/`fixme` comments
([`eslint.config.js`](../eslint.config.js)), so `pnpm check` stays red until you
resolve every one. The barrel export — the step that silently shipped a broken
`camelCase` in `0.2.0` — is the exception: the generator writes it for you
(sorted), which flips the missing-export failure mode from silent to a loud,
failing entry-point test.
