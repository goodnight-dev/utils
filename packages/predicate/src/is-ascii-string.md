# `isAsciiString`

> Test whether a string is entirely ASCII (every code point U+0000–U+007F).
> Unicode-aware via the `u` flag, so an astral-plane character — a single
> non-ASCII code point — correctly fails.

## Chosen implementation

```ts
const ASCII_PATTERN = /^\p{ASCII}*$/u;

export function isAsciiString(value: string): boolean {
  return ASCII_PATTERN.test(value);
}
```

A regex — which is the surprise. `camelCase` and `snakeCase` both rejected regex
in favour of a hand-rolled loop, and
[CONTRIBUTING §1](../../../CONTRIBUTING.md#1-the-safest-most-performant-implementation-wins)
calls regex "a last resort." But §1's actual rule is _the fastest correct
implementation wins, measured rather than assumed_, and here the measurement
inverts the usual answer: V8's regex engine classifies ASCII faster than a
per-character `charCodeAt` loop (~1.5× on the corpus; see Benchmarks). So this
time the loop is the candidate being rejected.

Two properties make the regex the right call rather than a footgun:

- **It is the fastest of the correct candidates** (§1). The hand-rolled loop —
  the shape the string functions chose — is ~1.5× slower here because the regex
  engine runs in optimized native code while the loop pays per-character
  interpreter overhead.
- **It is ReDoS-safe.** `^\p{ASCII}*$` is a single character class with one `*`
  between anchors: every prefix has exactly one match path, so there is nothing
  to backtrack into and the match is linear in the input length. Even the
  give-back when a late character turns out non-ASCII is linear, not exponential
  — categorically unlike the `(a+)+` family that causes catastrophic
  backtracking. Adversarial input cannot push it past O(n). It carries no `g`
  flag, so the shared module-level instance is stateless and safe to reuse.

That second property is why this is a defensible exception rather than a
slippery slope: a regex earns "chosen" status only when it is both the measured
winner **and** provably safe. The benchmark and this safety check are exactly
the tools that let us claim both.

## Alternatives considered

### 1. Hand-rolled `charCodeAt` loop

```ts
for (let i = 0; i < value.length; i++) {
  if (value.charCodeAt(i) > 0x7f) return false;
}
return true;
```

The shape `camelCase` / `snakeCase` use. Correct, code-unit based (so a
surrogate half is caught for free), and it bails on the first non-ASCII unit.
Rejected only because it is ~1.5× slower than the regex on the corpus. Caching
`value.length` in a local (a `while` variant) makes no measurable difference —
V8 already treats string length as immutable, which also lays the original
"precomputed length is faster" hypothesis to rest.

### 2. `Array.from` + `every`

```ts
Array.from(value).every((char) => char.charCodeAt(0) <= 0x7f);
```

Iterates by code point, but allocates an array of one-character strings plus a
closure per call — ~7× slower than the regex. Rejected.

## Benchmarks

Evidence for the claims above — not a guarantee. Microbenchmarks are noisy and
environment-specific; what these numbers substantiate is the _relative_
ordering. Regenerate with `pnpm bench`. The runnable candidates live in
[`is-ascii-string.alternatives.ts`](./is-ascii-string.alternatives.ts); their
correctness is gated by
[`is-ascii-string.alternatives.test.ts`](./is-ascii-string.alternatives.test.ts).

Environment: Node 24.14.1, Apple M1 Max, macOS (arm64), 2026-06-25, over the
shared corpus in [`predicate.fixtures.ts`](./predicate.fixtures.ts). Higher `hz`
(operations per second over the corpus) is better.

| Implementation                | hz (ops/s) |    RME | vs. chosen          |
| ----------------------------- | ---------: | -----: | ------------------- |
| **chosen** (ReDoS-safe regex) |  1,698,681 | ±0.13% | —                   |
| `for` loop (`charCodeAt`)     |  1,105,566 | ±0.14% | chosen 1.54× faster |
| `while` loop (cached length)  |  1,108,433 | ±0.12% | chosen 1.53× faster |
| spread + `every`              |    228,360 | ±0.56% | chosen 7.44× faster |

Reading the table:

- The regex wins, the two loop forms tie (length caching is a no-op), and spread
  trails badly.
- **Workload caveat.** The regex's edge comes from long, mostly-ASCII inputs
  where the loop cannot early-exit. For inputs that are usually non-ASCII near
  the start, the loop's early bail would narrow or close the gap. The corpus
  reflects the common case — validating a string that is expected to be ASCII —
  where the whole string is scanned.

## Gotchas

- Code-point based via the `u` flag: an astral character is one non-ASCII code
  point and fails. The loop alternative is code-unit based but agrees — a
  surrogate half is also above `0x7f`.
- The empty string is `true` (`^$` matches zero ASCII characters).
- ReDoS safety is a property of _this_ pattern's shape. If it is ever
  generalized (alternation, nested quantifiers, a backreference), re-verify
  linearity — that is the point at which a regex predicate could become unsafe.
