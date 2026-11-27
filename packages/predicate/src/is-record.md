# `isRecord`

> Test whether a value is a plain object (a "record") — one whose prototype is
> `Object.prototype` or `null`. `true` for object literals, `new Object()`, and
> `Object.create(null)`; `false` for arrays, functions, primitives, `null`,
> built-in exotics (`Map`, `Set`, `Date`, …), and class instances. This file is
> repo-only — it is never published to npm.

## Chosen implementation

```ts
export function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
```

It is a **type guard** (`value is Record<string, unknown>`), not a plain
`boolean` predicate: a `true` result narrows the value at the call site, so its
keys can be read without a cast. That is the point of a predicate that takes
`unknown` — `isAsciiString` returns `boolean` because it already has a `string`
and there is nothing to narrow.

A "record" here means a **plain object**: something built from an object
literal, `new Object()`, or `Object.create(null)` and used as a string-keyed
dictionary. The defining trait is the prototype. An object literal's prototype
is `Object.prototype`; a null-prototype object's is `null`; everything else —
arrays, `Map`, `Set`, `Date`, functions, class instances — carries some other
prototype. So the most direct question, "is the prototype `Object.prototype` or
`null`?", is also the implementation.

Two deliberate choices sit in that one comparison:

- **`null` prototypes count.** `Object.create(null)` is the canonical
  prototype-free dictionary — no inherited `toString`, no `__proto__` foot-gun —
  and it is a record. Dropping the `|| prototype === null` arm would reject it,
  so the arm is deliberate.
- **No `!Array.isArray` guard.** An array's prototype is `Array.prototype`,
  which is neither `Object.prototype` nor `null`, so the prototype check already
  excludes arrays. A separate array guard would be redundant — and on its own it
  is not even sufficient, since "a non-null object that is not an array" still
  admits every exotic (alternative 2 below).

The `typeof value !== 'object'` guard also screens out functions (`typeof` is
`'function'`) and every primitive before the prototype read; `value === null` is
handled explicitly because `typeof null === 'object'`.

## Alternatives considered

### 1. Walk the prototype chain to its root (lodash `isPlainObject`)

```ts
let prototype = Object.getPrototypeOf(value);
if (prototype === null) return true;

let root = prototype;
let next = Object.getPrototypeOf(root);
while (next !== null) {
  root = next;
  next = Object.getPrototypeOf(root);
}
return prototype === root;
```

Correct across the corpus, and in one way _more_ correct than the chosen
implementation: it is **realm-independent**. An object created in another realm
(an iframe, a `vm` context, a worker) has a prototype that is `!==` this realm's
`Object.prototype` by identity even though it is a plain object; the chosen
check reports it as a non-record, while walking to the top of its own chain
accepts it. Rejected for the workload this package targets — single-realm Node —
where that case is rare and the walk costs: it reads the prototype `n + 1` times
and loops, where the chosen implementation reads it once. ~2.2× slower on the
corpus (see Benchmarks). It is the correct alternative benchmarked below.

### 2. Non-null object that is not an array

```ts
return typeof value === 'object' && value !== null && !Array.isArray(value);
```

The intuitive shape — "a record is an object, and arrays are the one object type
to rule out." It is **wrong**: excluding only arrays leaves every other exotic
in, so it reports `new Date()`, `new Map()`, `new Set()`, and class instances as
records. Disqualified by
[`is-record.alternatives.test.ts`](./is-record.alternatives.test.ts), which
asserts it diverges from the oracle on `new Date()`. Kept runnable as the
cautionary example — it is the shortcut the chosen prototype check is built to
avoid.

### 3. `Object.prototype.toString` tag check

```ts
return Object.prototype.toString.call(value) === '[object Object]';
```

The classic one-liner, but it answers a different question — "does this
stringify as `[object Object]`?" — not "is this a plain object?". A class
instance with no `Symbol.toStringTag` still stringifies as `[object Object]`, so
this admits it; conversely a genuine plain object carrying a
`Symbol.toStringTag` is reported as a non-record. Disqualified by
[`is-record.alternatives.test.ts`](./is-record.alternatives.test.ts) on a class
instance. Kept runnable as a cautionary example, never a candidate.

## Benchmarks

Evidence for the claim above — not a guarantee. Microbenchmarks are noisy and
environment-specific; what these numbers substantiate is the _relative_
ordering. Regenerate with `pnpm bench`. The runnable candidates live in
[`is-record.alternatives.ts`](./is-record.alternatives.ts); their correctness is
gated by [`is-record.alternatives.test.ts`](./is-record.alternatives.test.ts).

Environment: Node 24.14.1, Apple M1 Max, macOS 26.6.2 (arm64), 2026-11-27, over
the shared corpus in [`predicate.fixtures.ts`](./predicate.fixtures.ts)
(`RECORD_INPUTS`). Higher `hz` (operations per second over the corpus) is
better.

| Implementation                       | hz (ops/s) |    RME | vs. chosen         |
| ------------------------------------ | ---------: | -----: | ------------------ |
| **chosen** (prototype identity)      |  5,529,810 | ±0.08% | —                  |
| walk the prototype chain to its root |  2,511,414 | ±0.08% | chosen 2.2× faster |

Reading the table:

- The chosen check reads the prototype once and compares; the walk reads it
  again for every link in the chain and loops, which is where the time goes. A
  record is one hop from the root (`Object.prototype`), but every non-record is
  walked to the top of its own chain before it can be rejected.
- **What it does not buy.** The speed comes at the cost of cross-realm
  correctness (see alternative 1). On a single-realm workload the two agree on
  every input; the walk only earns its cost when plain objects cross a realm
  boundary.

## Gotchas

- **Class instances are not records.** `isRecord(new Foo())` is `false` — its
  prototype is `Foo.prototype`, not `Object.prototype`. "Any non-null object" is
  a different, looser predicate.
- **`Object.create(null)` is a record**, even though it has no inherited
  `toString`, `hasOwnProperty`, or anything else. That is usually the point of
  using it; just reach for `Object.hasOwn(value, key)` rather than
  `value.hasOwnProperty(key)` on the result.
- **Cross-realm plain objects read as non-records.** The prototype-identity
  check is realm-local by design (see Benchmarks). Code that juggles objects
  from `vm` contexts, iframes, or worker threads wants the walk-to-root variant.
- **Spoofing cuts the other way from `toString`.** A plain object carrying a
  `Symbol.toStringTag` is still a record here — its prototype is unchanged —
  where the tag check (alternative 3) would miss it.

```

```
