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
