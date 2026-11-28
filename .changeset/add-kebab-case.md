---
'@goodnight-dev/string': minor
---

Add `kebabCase`, which converts a string to kebab-case: words are lowercased and
joined with single hyphens, with non-alphanumeric runs and camelHumps as word
boundaries (`kebabCase('fooBar')` is `'foo-bar'` and
`kebabCase('XMLHttpRequest')` is `'xml-http-request'`). Word detection and
casing are Unicode-correct. It shares its word-splitting engine with
`snakeCase`, which is refactored onto the same engine with no change in
behaviour.
