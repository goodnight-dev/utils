---
'@goodnight-dev/string': minor
---

Add `snakeCase`. Converts a string to snake_case: words are lowercased and
joined with single underscores. Word boundaries are non-alphanumeric runs as
well as camelHumps and acronym tails, so `snakeCase('fooBar')` is `'foo_bar'`
and `snakeCase('XMLHttpRequest')` is `'xml_http_request'`. Unicode-correct, the
inverse of `camelCase` with hump splitting added.
