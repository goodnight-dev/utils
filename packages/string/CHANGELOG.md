# @goodnight-dev/string

## 0.4.0

### Minor Changes

- 7ce9822: Raise the minimum supported Node.js to `>=22`. Node 20 reached
  end-of-life on 2026-04-30, so these packages are now built and tested only on
  Node 22, 24, and 26.

## 0.3.0

### Minor Changes

- b0d75c7: Add `snakeCase`. Converts a string to snake_case: words are
  lowercased and joined with single underscores. Word boundaries are
  non-alphanumeric runs as well as camelHumps and acronym tails, so
  `snakeCase('fooBar')` is `'foo_bar'` and `snakeCase('XMLHttpRequest')` is
  `'xml_http_request'`. Unicode-correct, the inverse of `camelCase` with hump
  splitting added.

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
