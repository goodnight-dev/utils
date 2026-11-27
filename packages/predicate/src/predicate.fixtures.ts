// Shared input corpus for the predicate package's parity checks and benchmarks.
// Repo-only: not re-exported from the barrel, so it never reaches `dist`. These
// are string inputs for the string-typed predicates; when a predicate over a
// different input type lands, give it its own corpus.

export const PREDICATE_INPUTS = [
  '',
  'hello world',
  'Foo_Bar-123!',
  'the quick brown fox jumps over the lazy dog',
  'café', // non-ASCII near the start (early exit)
  'a mostly ascii sentence that only trips at the very end é', // late exit
  '日本語',
  'foo😀bar', // astral-plane (surrogate pair)
  'a'.repeat(256), // long all-ASCII, to measure throughput not fixed overhead
  'lorem ipsum dolor sit amet '.repeat(8),
];

// Mixed-type corpus for `isIterable`, which takes `unknown` rather than a
// string. It deliberately spans iterable and non-iterable values of both
// object and primitive types, so the parity check exercises the string edge
// (where the naive `typeof === 'object'` guard is wrong) and the benchmark
// sees the wrapper-allocation cost paid on primitives.
export const ITERABLE_INPUTS: readonly unknown[] = [
  [1, 2, 3], // array — iterable
  'hello', // string — iterable (the case the object-guard drops)
  '', // empty string — still iterable
  new Map([['a', 1]]), // Map — iterable
  new Set([1, 2, 3]), // Set — iterable
  (function* () {
    /* no-op */
  })(), // generator object — iterable (and its own iterator)
  {
    [Symbol.iterator]: function* () {
      /* no-op */
    },
  }, // custom iterable
  {}, // plain object — not iterable
  new Date(), // object without Symbol.iterator — not iterable
  () => undefined, // function — not iterable
  42, // number — not iterable
  true, // boolean — not iterable
  null, // not iterable
  undefined, // not iterable
];

// Mixed-type corpus for `isRecord`, which takes `unknown` rather than a string.
// It deliberately spans record and non-record values of both object and
// primitive types. The discriminating inputs are the built-in exotics and the
// class instance: a "record" is a plain object, so anything carrying a
// prototype other than `Object.prototype` or `null` is excluded, which is where
// the naive "non-null object that is not an array" guard goes wrong. The class
// instance in particular separates "is a plain object" from the looser "prints
// as `[object Object]`". The primitives exercise the `typeof` early exit.
export const RECORD_INPUTS: readonly unknown[] = [
  { a: 1, b: 2 }, // plain object — record
  {}, // empty object — still a record
  { key: undefined }, // object with an undefined value — still a record
  Object.create(null), // null-prototype object — still a record
  new (class Example {
    value = 1;
  })(), // class instance — not a record (custom prototype)
  new Map(), // Map — not a record
  new Set(), // Set — not a record
  new Date(), // Date — not a record
  [], // array — not a record
  () => undefined, // function — not a record
  'hello', // string primitive — not a record
  42, // number primitive — not a record
  true, // boolean primitive — not a record
  null, // not an object — not a record
  undefined, // not an object — not a record
];
