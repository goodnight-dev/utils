// Shared input corpus for camelCase parity checks and benchmarks. Repo-only:
// not re-exported from the barrel, so it never reaches `dist`. Kept in one
// place so the parity test and the benchmark exercise the exact same workload.

export const CAMEL_CASE_INPUTS = [
  'hello world',
  'foo_bar_baz',
  'baz-qux',
  '  --Mixed---Separators__here  ',
  'already camelCase',
  'SCREAMING_SNAKE_CASE',
  'dotted.path.segments',
  'héllo wörld',
  'baz-Δqux',
  '_user_id',
  'version-2-final',
  'foo😀bar',
  // a longer, mixed string to exercise throughput rather than fixed overhead
  `${'lorem ipsum dolor sit amet '.repeat(8)}consectetur-adipiscing_elit`,
];
