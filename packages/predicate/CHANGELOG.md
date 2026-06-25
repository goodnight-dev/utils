# @goodnight-dev/predicate

## 0.1.0

### Minor Changes

- e60da21: Add the `@goodnight-dev/predicate` package — runtime type and value
  predicates (`is*`), not limited to one input type. Ships `isAsciiString`,
  which tests whether a string contains only ASCII characters (U+0000–U+007F).
  Available standalone, via the umbrella subpath
  `@goodnight-dev/utils/predicate`, and from the umbrella barrel
  `@goodnight-dev/utils` — the new subpath is why `utils` takes a minor bump.
