# @goodnight-dev/predicate

## 0.4.0

### Minor Changes

- c3a7f99: `isIterable` is now a type guard: it narrows a `true` result to
  `Iterable<unknown>`, so callers can spread the value or drive it with
  `for...of` without a cast. Runtime behaviour is unchanged.

## 0.3.0

### Minor Changes

- 71de3f1: Add `isIterable`, a predicate that tests whether a value satisfies
  the iterable protocol (a callable `Symbol.iterator`). Returns `true` for
  arrays, strings, `Map`, `Set`, typed arrays, and generator objects, and
  `false` for plain objects, `null`, and `undefined`.

## 0.2.0

### Minor Changes

- 7ce9822: Raise the minimum supported Node.js to `>=22`. Node 20 reached
  end-of-life on 2026-04-30, so these packages are now built and tested only on
  Node 22, 24, and 26.

## 0.1.0

### Minor Changes

- e60da21: Add the `@goodnight-dev/predicate` package — runtime type and value
  predicates (`is*`), not limited to one input type. Ships `isAsciiString`,
  which tests whether a string contains only ASCII characters (U+0000–U+007F).
  Available standalone, via the umbrella subpath
  `@goodnight-dev/utils/predicate`, and from the umbrella barrel
  `@goodnight-dev/utils` — the new subpath is why `utils` takes a minor bump.
