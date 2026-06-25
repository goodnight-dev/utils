# @goodnight-dev/utils

## 0.3.0

### Minor Changes

- e60da21: Add the `@goodnight-dev/predicate` package — runtime type and value
  predicates (`is*`), not limited to one input type. Ships `isAsciiString`,
  which tests whether a string contains only ASCII characters (U+0000–U+007F).
  Available standalone, via the umbrella subpath
  `@goodnight-dev/utils/predicate`, and from the umbrella barrel
  `@goodnight-dev/utils` — the new subpath is why `utils` takes a minor bump.

### Patch Changes

- Updated dependencies [e60da21]
  - @goodnight-dev/predicate@0.1.0

## 0.2.2

### Patch Changes

- Updated dependencies [b0d75c7]
  - @goodnight-dev/string@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies [f17c743]
  - @goodnight-dev/string@0.2.1

## 0.2.0

### Minor Changes

- 135d246: Adds a `camelCase` string utility.

### Patch Changes

- Updated dependencies [135d246]
  - @goodnight-dev/string@0.2.0

## 0.1.0

### Minor Changes

- 89591ac: Initial bootstrapping and publishing flow.

### Patch Changes

- Updated dependencies [89591ac]
  - @goodnight-dev/string@0.1.0
