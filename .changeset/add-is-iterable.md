---
'@goodnight-dev/predicate': minor
---

Add `isIterable`, a predicate that tests whether a value satisfies the iterable
protocol (a callable `Symbol.iterator`). Returns `true` for arrays, strings,
`Map`, `Set`, typed arrays, and generator objects, and `false` for plain
objects, `null`, and `undefined`.
