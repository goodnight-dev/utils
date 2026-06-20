# @goodnight-dev/string

## 0.2.1

### Patch Changes

- f17c743: Export `camelCase` from the package entry point. It was added in
  `0.2.0` but never re-exported from the barrel, so it was not importable from
  the published package; this release makes it reachable. Also drops the Unicode
  classification regex for all ASCII input as a small performance refinement,
  and adds an entry-point test that fails the build if a function is implemented
  but not exported.

## 0.2.0

### Minor Changes

- 135d246: Adds a `camelCase` string utility.

## 0.1.0

### Minor Changes

- 89591ac: Initial bootstrapping and publishing flow.
