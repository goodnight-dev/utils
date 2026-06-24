# Recipe: benchmarking a function

How to substantiate a performance claim. Optional — reach for it when a
function's `<name>.md` asserts that one implementation is faster than another
and you want evidence rather than an assertion. The policy behind this
(benchmarks are evidence, not a CI gate) is
[ADR 0003](../adr/0003-substantiating-performance-claims.md). The worked example
is [`camel-case`](../../packages/string/src/camel-case.md#benchmarks).

Replace `string` / `camelCase` below with your area and function name.

> **Fast path:** `pnpm new` with "yes" to the benchmark prompt scaffolds steps
> 1–4 — the shared corpus (only if the package doesn't have one yet), the
> alternatives stub, the parity test, and the bench file. The steps below are
> what it produces and how to fill them in.

## 1. A shared input corpus

The corpus is **per package**, not per function: one
`packages/string/src/string.fixtures.ts` exporting `STRING_INPUTS`, used by
every function's parity test and benchmark so they all exercise the same
workload. `pnpm new` creates it on the first benchmarked function and leaves it
alone afterwards — extend the existing array rather than adding a per-function
file. Cover the real domain (ASCII words, delimiters, mixed casing, Unicode,
surrogate pairs) and include at least one longer string so you measure
throughput, not just per-call overhead.

```ts
export const STRING_INPUTS = [
  'hello world',
  'fooBar',
  'XMLHttpRequest',
  'héllo wörld' /* … */,
];
```

## 2. The candidate implementations

Create `packages/string/src/camel-case.alternatives.ts` and export the rejected
implementations as runnable functions. These are repo-only — never re-export
them from the barrel, so they stay out of `dist`. Import the chosen
implementation from `./camel-case`; never copy it, so the benchmark measures
what actually ships.

## 3. The correctness gate

Create `packages/string/src/camel-case.alternatives.test.ts`. The chosen
implementation is the oracle: assert every benchmarked alternative produces
identical output across the corpus, and assert that any deliberately incorrect
candidate (kept for reference) _diverges_. This runs in `pnpm check`, so a
fast-but-wrong alternative fails the build instead of sneaking into the table.

```ts
for (const input of STRING_INPUTS) {
  expect(alternative(input), input).toBe(camelCase(input));
}
```

## 4. The benchmark

Create `packages/string/src/camel-case.bench.ts` using Vitest's `bench` API.
Group correct candidates together; put any reference-only incorrect candidate in
a separate, clearly labelled group.

```ts
import { bench, describe } from 'vitest';

describe('camelCase — correct candidates', () => {
  bench('camelCase (chosen)', () => {
    run(camelCase);
  });
  bench('for...of', () => {
    run(camelCaseForOf);
  });
});
```

Run it:

```sh
pnpm bench                                      # all benchmarks
pnpm bench packages/string/src/camel-case.bench.ts   # just this one
```

`*.bench.ts` files are not picked up by `pnpm test` / `pnpm check`; only
`pnpm bench` runs them.

## 5. Snapshot the results into the notes

Add a `## Benchmarks` section to `camel-case.md` with the results table, and —
because the numbers are not portable — an **environment stamp** (Node version,
CPU, OS, date) and the `pnpm bench` command to regenerate them. State the
relative ordering, since that is what the benchmark actually supports; do not
present the absolute `hz` as a guarantee. If a reference-only incorrect
candidate is faster, say so and say why it is still rejected — that contrast is
the point.

## 6. Keep it honest

- Re-run and re-snapshot when you change the chosen implementation.
- Numbers are evidence for a recorded environment, not a CI gate (ADR 0003).
- An alternative that fails the parity test is disqualified, not benchmarked as
  a contender — speed never overrides correctness
  ([principle §1](../../CONTRIBUTING.md#1-the-safest-most-performant-implementation-wins)).
