# `kebabCase`

> Convert a string to `kebab-case`: lowercase every word and join the words with
> single hyphens. Word boundaries are non-alphanumeric runs (dropped),
> camelHumps (`fooBar` → `foo-bar`), and acronym tails (`XMLHttp` → `xml-http`),
> all Unicode-correct. It is `snakeCase` with hyphens, and shares the exact same
> engine. This file is repo-only — it is never published to npm.

## Chosen implementation

```ts
import { toDelimitedCase } from './delimited-case';

export function kebabCase(value: string): string {
  return toDelimitedCase(value, '-');
}
```

kebab-case and snake_case are the same transformation with a different joining
character, so the word-splitting engine lives once in
[`delimited-case.ts`](./delimited-case.ts) and both converters are one-line
wrappers over it: `kebabCase` passes `'-'`, [`snakeCase`](./snake-case.md)
passes `'_'`. The engine's algorithm — the single-pass ASCII fast path, the
boundary/acronym logic, the Unicode-correct casing — is documented in
[`snake-case.md`](./snake-case.md); this note covers only why the code is shared
rather than duplicated or chained.

The repo has two standing goals (CONTRIBUTING §1 and §4): the **fastest**
correct implementation, and the **smallest** possible import (tree-shakeable).
Sharing the engine serves both:

- **Speed is unchanged.** The engine is still one pass; the separator is passed
  as an argument (`output.push(separator)`) rather than hard-coded, which is
  free — it is the same interned one-character string either way. Measured,
  `kebabCase` runs at the same throughput as `snakeCase`, and extracting the
  engine did not regress `snakeCase` (see Benchmarks).
- **Tree-shaking is preserved, and import size improves.** `toDelimitedCase` is
  not re-exported from the barrel, and the package is `sideEffects: false`, so a
  bundler includes the engine only for the converter a consumer actually
  imports. Import just `kebabCase` and `snakeCase` is dropped; import **both**
  and the ~70-line engine is included **once**, not copied twice. A duplicated
  self-contained implementation would be the same size for one import and twice
  the size for both.

The two roads not taken — duplicating the loop with `'-'` hard-coded, or
delegating to `snakeCase` and rewriting separators — are the alternatives below.

## Alternatives considered

### 1. Delegate to `snakeCase`, then swap separators

```ts
return snakeCase(value).replaceAll('_', '-');
```

The obvious "don't repeat the algorithm" move, and genuinely correct:
`snakeCase` only ever emits `_` as a word separator, so rewriting every `_` to
`-` yields exactly kebab-case. It is a parity-oracle rival in
[`kebab-case.alternatives.test.ts`](./kebab-case.alternatives.test.ts) and
matches the chosen implementation across the whole corpus. Rejected on two
counts: it runs the engine and then a **second** pass over the whole result
(plus an extra string allocation), measured ~1.38× slower than sharing the
engine; and it couples kebab-case's correctness to an internal detail of
`snakeCase`'s output — were `snakeCase` ever to emit a literal `_` inside a
word, this would silently corrupt. Sharing the engine is just as DRY, faster,
and decoupled.

### 2. Two-pass regex, then split/join

```ts
value
  .replace(/([\p{Ll}\p{Lo}\p{N}])(\p{Lu})/gu, '$1-$2') // word|Word
  .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1-$2') // acroNymTail
  .split(/[^\p{L}\p{N}]+/u)
  .filter(Boolean)
  .map((word) => word.toLowerCase())
  .join('-');
```

The readable approach, also correct and corpus-verified. But it runs the regex
engine over the whole string several times per call and allocates intermediate
arrays — ~1.69× slower than the single-pass engine (see Benchmarks). It is the
same trade-off [`snakeCase`](./snake-case.md) documents, rejected for the same
reason: the chosen engine is the fastest _correct_ option (CONTRIBUTING §1).

### 3. ASCII-only with bitwise case conversion (no Unicode handling)

```ts
output += isUpper ? String.fromCharCode(code + 32) : value.charAt(i);
```

Fastest variant measured (~2.2×), and deliberately **incorrect**: every
non-ASCII byte is treated as a delimiter, so accented letters, CJK, and
non-ASCII digits are dropped and astral-plane input risks surrogate-pair
corruption — `kebabCase('héllo wörld')` would lose the `é`/`ö`. The parity test
asserts it diverges so it can never be mistaken for shippable.

## Benchmarks

Evidence for the claims above — not a guarantee. Microbenchmarks are noisy and
environment-specific; what these numbers substantiate is the _relative_ ordering
of the candidates. Regenerate with `pnpm bench`. The runnable candidates live in
[`kebab-case.alternatives.ts`](./kebab-case.alternatives.ts), and their
correctness is gated separately by
[`kebab-case.alternatives.test.ts`](./kebab-case.alternatives.test.ts) — only
implementations that match the chosen one across the corpus are eligible.

Environment: Node 24.14.1, Apple M1 Max, macOS 26.6.2 (arm64), 2026-11-28, over
the shared corpus in [`string.fixtures.ts`](./string.fixtures.ts). Higher `hz`
(operations per second over the corpus) is better.

| Implementation                       | hz (ops/s) |    RME | vs. chosen                  |
| ------------------------------------ | ---------: | -----: | --------------------------- |
| **chosen** (shared engine, one pass) |    110,772 | ±0.55% | —                           |
| delegate to `snakeCase` + swap       |     80,062 | ±0.42% | chosen 1.38× faster         |
| two-pass regex (split and join)      |     65,628 | ±1.61% | chosen 1.69× faster         |
| ASCII only (**not** Unicode-safe)    |    244,565 | ±0.58% | 2.21× faster — disqualified |

Reading the table:

- The chosen wrapper runs at the shared engine's full speed — identical, within
  noise, to `snakeCase` — because it _is_ the same one pass.
- Delegating to `snakeCase` is correct but ~1.38× slower: it pays a second full
  pass to rewrite `_` to `-`. That gap is the whole argument for sharing the
  engine rather than chaining onto `snakeCase`.
- The ASCII-only variant is ~2.2× faster and **still rejected** — it drops every
  non-ASCII letter, so it fails parity. It is in the table only to make the
  trade-off concrete.

## Gotchas

- **Same engine as `snakeCase`, so the same word rules.** camelHumps are
  boundaries, acronyms split at their tail (`kebabCase('XMLHttpRequest')` →
  `'xml-http-request'`), digits attach to the preceding word but a
  digit→uppercase transition is a boundary (`'foo2Bar'` → `'foo2-bar'`), and
  consecutive or leading/trailing delimiters collapse to nothing. The full
  behaviour and edge cases are documented in [`snake-case.md`](./snake-case.md).
- **Output uses `-` and nothing else as a separator.** Any run of
  non-alphanumeric input — spaces, underscores, dots, arbitrary punctuation —
  becomes a single hyphen, which is what makes `kebabCase` a reasonable slugger
  for most input.
- **It is not a URL encoder.** Unicode letters are preserved
  (`kebabCase('héllo wörld')` → `'héllo-wörld'`), not transliterated or
  percent-encoded. For an ASCII-only slug, fold diacritics first.
- Locale-sensitive casing (Turkish dotless `ı`/`İ`) and multi-code-point
  grapheme clusters carry the same caveats as `snakeCase`; see its notes.
