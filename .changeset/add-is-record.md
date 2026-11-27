---
'@goodnight-dev/predicate': minor
---

Add `isRecord`, a predicate that tests whether a value is a plain object — one
whose prototype is `Object.prototype` or `null`. Returns `true` for object
literals, `new Object()`, and `Object.create(null)`, and `false` for arrays,
functions, primitives, `null`, built-in exotic objects (`Map`, `Set`, `Date`,
…), and class instances. As a type guard, a `true` result narrows the value to
`Record<string, unknown>`.
