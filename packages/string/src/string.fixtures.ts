// Shared input corpus for the string package's parity checks and benchmarks.
// Repo-only: not re-exported from the barrel, so it never reaches `dist`. One
// corpus per package so every function is measured on the same inputs; split it
// back into per-function corpora only if a function genuinely needs different
// shapes.

export const STRING_INPUTS = [
  '',
  'hello world',
  'foo_bar_baz',
  'baz-qux',
  '  --Mixed---Separators__here  ',
  'fooBar',
  'XMLHttpRequest',
  'getHTTPResponse',
  'PascalCaseName',
  'already camelCase',
  'SCREAMING_SNAKE_CASE',
  'dotted.path.segments',
  'version-2-final',
  'foo2Bar',
  'héllo wörld',
  'HélloWörld',
  'baz-Δqux',
  '日本語Text',
  '_user_id',
  'foo😀bar',
  // a longer, mixed string to exercise throughput rather than fixed overhead
  `${'lorem ipsum dolor sit amet '.repeat(8)}consecteturAdipiscing-elit`,
];
