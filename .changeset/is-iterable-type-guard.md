---
'@goodnight-dev/predicate': minor
---

`isIterable` is now a type guard: it narrows a `true` result to
`Iterable<unknown>`, so callers can spread the value or drive it with `for...of`
without a cast. Runtime behaviour is unchanged.
