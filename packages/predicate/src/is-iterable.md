# `isIterable`

> Test whether a value satisfies the iterable protocol — a callable
> `Symbol.iterator`. `true` for arrays, strings, `Map`, `Set`, typed arrays, and
> generator objects; `false` for plain objects, `null`, and `undefined`. This
> file is repo-only — it is never published to npm.

## Chosen implementation

```ts
export function isIterable(value: unknown): value is Iterable<unknown> {
  return (
    value !== null &&
    value !== undefined &&
    typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] ===
      'function'
  );
}
```

It is a **type guard** (`value is Iterable<unknown>`), not a plain `boolean`
predicate: a `true` result narrows the value at the call site, so it can be
spread or driven with `for...of` without a cast. That is the whole point of a
predicate that takes `unknown` — `isAsciiString` returns `boolean` because it
already has a `string` and there is nothing to narrow.

The iterable protocol is defined by one thing: a callable `Symbol.iterator`. So
the most direct question — "is `value[Symbol.iterator]` a function?" — is also
the implementation. The `null`/`undefined` guard is mandatory because reading a
property off either throws; every other value, primitives included, can be
property-accessed directly, and V8 boxes a primitive transiently to do so
without a heap allocation. That makes this both correct across the full input
domain and the fastest of the correct candidates (see Benchmarks).

The correctness point that matters most: **strings are iterable.**
`isIterable('hello')` is `true` — a string carries
`String.prototype[Symbol.iterator]` and works in `for...of` and spread. The
tempting `typeof value === 'object'` narrowing (alternative 2 below) silently
drops every string, which is why it is disqualified rather than merely slower.

## Alternatives considered

### 1. `Symbol.iterator in Object(value)`

```ts
return Symbol.iterator in Object(value);
```

Correct and pleasingly terse: `Object(x)` boxes a primitive into its wrapper (so
`Object('hello')` is a `String` object that carries `Symbol.iterator`) and turns
`null`/`undefined` into a fresh `{}` that does not — so it needs no explicit
guard and agrees with the chosen implementation across the whole corpus.
Rejected on cost: it allocates a wrapper object on **every primitive call**,
where the chosen property access allocates nothing. ~1.47× slower on the mixed
corpus (see Benchmarks). It is the correct alternative benchmarked below.

### 2. Object-type guard

```ts
return typeof value === 'object' && value !== null && Symbol.iterator in value;
```

The intuitive shape — "only objects are iterable, so narrow to a non-null
object, then use `in`." It is **wrong**: `typeof 'hello' === 'string'`, not
`'object'`, so it reports every string as non-iterable, contradicting the
language. Disqualified by
[`is-iterable.alternatives.test.ts`](./is-iterable.alternatives.test.ts), which
asserts it diverges from the oracle on strings. Kept runnable as the cautionary
example, never a candidate.

## Benchmarks

Evidence for the claim above — not a guarantee. Microbenchmarks are noisy and
environment-specific; what these numbers substantiate is the _relative_
ordering. Regenerate with `pnpm bench`. The runnable candidates live in
[`is-iterable.alternatives.ts`](./is-iterable.alternatives.ts); their
correctness is gated by
[`is-iterable.alternatives.test.ts`](./is-iterable.alternatives.test.ts).

Environment: Node 24.14.1, Apple M1 Max, macOS 26.5.1 (arm64), 2026-07-05, over
the shared corpus in [`predicate.fixtures.ts`](./predicate.fixtures.ts)
(`ITERABLE_INPUTS`). Higher `hz` (operations per second over the corpus) is
better.

| Implementation                          | hz (ops/s) |    RME | vs. chosen          |
| --------------------------------------- | ---------: | -----: | ------------------- |
| **chosen** (duck-typed property access) |  4,460,243 | ±0.13% | —                   |
| `Symbol.iterator in Object(value)`      |  3,033,532 | ±0.70% | chosen 1.47× faster |

Reading the table:

- The chosen property access wins because it does no allocation; `Object(value)`
  pays a wrapper allocation on each of the corpus's primitive inputs (the two
  strings, the number, and the boolean).
- **Workload caveat.** The edge comes entirely from primitives. On a corpus of
  only objects (arrays, `Map`, `Set`), `Object(value)` returns its argument
  unchanged — no allocation — and the gap narrows to noise. The corpus mixes
  both, reflecting a predicate that must accept `unknown`.

## Gotchas

- **Strings are iterable**, so `isIterable('hello')` is `true`; so are typed
  arrays and generator objects. Only a `typeof === 'object'` shortcut would
  claim otherwise, and it would be wrong.
- **An iterator is not necessarily an iterable**, but the built-ins are both: a
  generator object returned by `gen()` has a `Symbol.iterator` that returns
  itself, so it passes.
- `null` and `undefined` are the only values that need guarding — reading a
  property off them throws. Every other non-iterable (numbers, booleans,
  symbols, plain objects) property-accesses safely and returns `false`.
- This is a **structural** check: it confirms a callable `Symbol.iterator`, but
  does not call it or validate what it yields. A value whose `Symbol.iterator`
  is not a function (e.g. `{ [Symbol.iterator]: 42 }`) is correctly `false`.
