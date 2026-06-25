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
