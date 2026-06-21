# 3. Substantiating performance claims with benchmarks

- **Status:** Accepted
- **Date:** 2026-06-21

## Context

[Principle §1](../../CONTRIBUTING.md#1-the-safest-most-performant-implementation-wins)
commits every function to being "the safest **and most performant**"
implementation, and instructs the author to "measure, then write down the
reasoning." Until now there was no apparatus for the measuring: the per-function
notes assert relative performance ("slower on every call," "fastest variant
measured by a wide margin") without evidence. For a repository whose product is
craftsmanship, an unsubstantiated "most performant" is the weakest claim in it.

The obvious move — a CI check that fails when our implementation is not the
fastest — is a trap. Microbenchmarks on shared CI runners are noisy (virtualized
CPUs, JIT warmup, GC, neighbour load), routinely vary by 2–3× run to run, and
the Node 20/22/24 matrix ranks implementations differently. A "must be fastest"
gate either flakes constantly or is loosened until meaningless. We also cannot
honestly prove "fastest possible" — only "fastest among the alternatives we
considered."

## Decision

Treat benchmarks as **reproducible evidence, not a CI gate.**

1. **Rejected alternatives are checked in as runnable code** —
   `<name>.alternatives.ts`, repo-only (never re-exported from the barrel, never
   in `dist`). The chosen implementation in `<name>.ts` stays the single source
   of truth; the alternatives exist only for comparison.
2. **Correctness is the gate, speed is the table.**
   `<name>.alternatives.test.ts` asserts that every benchmarked alternative
   produces identical output to the chosen implementation across a shared input
   corpus. A faster-but-incorrect implementation is _disqualified_, not chosen —
   and that disqualification is itself a test. This runs in `pnpm check`.
3. **Benchmarks run on demand** via `pnpm bench` (Vitest's `bench` API, backed
   by tinybench), reusing the existing test harness — no new runner.
4. **Results are snapshotted into the notes.** Each `<name>.md` carries a
   _Benchmarks_ section with the results table, an environment stamp (Node
   version, CPU, OS, date), and the `pnpm bench` command to regenerate it. The
   numbers are relative evidence for a recorded environment, not portable
   guarantees.

The pilot is [`camel-case.md`](../../packages/string/src/camel-case.md); the
walkthrough is [Benchmarking a function](../recipes/benchmarking-a-function.md).

## Alternatives considered

- **A CI performance gate** ("ours must be fastest," or "within X% of fastest").
  Rejected: microbenchmark noise across shared runners and the Node matrix makes
  it flaky or meaningless, and it erodes trust in CI.
- **CodSpeed** (instruction-count simulation, deterministic and flake-free). A
  genuinely viable way to gate on regressions in CI without wall-clock noise.
  Deferred — it adds an external service and setup, and is not needed until
  there is demand for an enforced gate. Revisit then.
- **A standalone runner** (Benchmark.js, mitata). mitata in particular produces
  lower-overhead, more precise numbers. Rejected for now to reuse the Vitest
  harness rather than introduce a second run path; revisit if tinybench's
  precision proves insufficient for a real decision.
- **Prose-only claims** (the status quo). Rejected: it is exactly the
  unsubstantiated assertion this ADR exists to remove.

## Consequences

- Claims become reproducible: anyone can run `pnpm bench` and re-derive the
  ordering for their own environment.
- Speed never blocks a merge; **correctness (parity) does** — a fast, wrong
  alternative fails `pnpm check`.
- Checked-in alternatives carry maintenance cost: they are kept correct by the
  parity test, and the snapshotted numbers must be regenerated when the chosen
  implementation changes. Accepted — the rigor is the point of the repository.
- Principle §1's wording is softened from "most performant" to "the fastest of
  the correct alternatives we measured," which is what the evidence supports.
- If an enforced, flake-free regression gate is ever wanted, adopt CodSpeed and
  revisit this decision.
