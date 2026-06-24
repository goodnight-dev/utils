# `snakeCase`

> Convert a string to `snake_case`: lowercase every word and join the words with
> single underscores. A word boundary is any of three things — a run of
> non-alphanumeric characters (dropped), a lower/digit/caseless character
> followed by an uppercase letter (`fooBar` → `foo_bar`), or the tail of an
> acronym (`XMLHttp` → `xml_http`). Word detection and casing are both
> Unicode-correct, not ASCII-only. This is the inverse of
> [`camelCase`](./camel-case.md) plus camelHump splitting — which is the usual
> reason to reach for `snakeCase` at all.

## Chosen implementation

```ts
const UNICODE_ALPHANUMERIC_REGEX = /\p{L}|\p{N}/u;

function isLowercaseAt(value: string, index: number): boolean {
  if (index >= value.length) return false;
  const code = value.charCodeAt(index);
  if (code < 128) return code >= 97 && code <= 122;
  const codePoint = value.codePointAt(index);
  if (codePoint === undefined) return false;
  const character = String.fromCodePoint(codePoint);
  return character.toUpperCase() !== character;
}

export function snakeCase(value: string): string {
  const length = value.length;
  const output: string[] = [];

  let pendingSeparator = false;
  let prevWasUpper = false;
  let started = false;
  let i = 0;

  while (i < length) {
    const code = value.charCodeAt(i);

    let character: string;
    let isUpper: boolean;
    let step: number;

    if (code < 128) {
      const upper = code >= 65 && code <= 90;
      if (
        !(upper || (code >= 97 && code <= 122) || (code >= 48 && code <= 57))
      ) {
        pendingSeparator = started;
        i++;
        continue;
      }
      character = upper ? String.fromCharCode(code + 32) : value.charAt(i);
      isUpper = upper;
      step = 1;
    } else {
      const codePoint = value.codePointAt(i);
      if (codePoint === undefined) {
        break;
      }
      const raw = String.fromCodePoint(codePoint);
      step = codePoint > 0xffff ? 2 : 1;
      if (!UNICODE_ALPHANUMERIC_REGEX.test(raw)) {
        pendingSeparator = started;
        i += step;
        continue;
      }
      character = raw.toLowerCase();
      isUpper = character !== raw;
    }

    if (started) {
      if (pendingSeparator) {
        output.push('_');
      } else if (isUpper && (!prevWasUpper || isLowercaseAt(value, i + step))) {
        output.push('_');
      }
    }

    pendingSeparator = false;
    output.push(character);
    started = true;
    prevWasUpper = isUpper;
    i += step;
  }

  return output.join('');
}
```

Why this one:

- **One pass, ASCII fast path, regex on the cold path only.** Like
  [`camelCase`](./camel-case.md), the common case (ASCII letters and digits) is
  classified with pure numeric comparisons; the Unicode alphanumeric regex runs
  only for code points `>= 128`. Casing comes for free in both paths — ASCII
  uppercase is lowercased with `code + 32`, non-ASCII with one `toLowerCase()`
  whose result also tells us the character _was_ uppercase (`lower !== raw`).
- **Boundaries are decided from one bit of history and, rarely, one of
  lookahead.** `prevWasUpper` plus the current character covers the two common
  boundaries — delimiter runs (via `pendingSeparator`) and `lower|Upper`
  transitions. The third — the tail of an acronym, the `R` in `HTTPResponse` —
  is the only case needing lookahead, and `&&` short-circuiting means
  `isLowercaseAt` is consulted _only_ when an uppercase letter directly follows
  another uppercase letter. For ordinary text it never runs.
- **`push`, not a pre-sized array.** This is the deliberate departure from
  `camelCase`. There, the output is never longer than the input, so
  `new Array(value.length)` with indexed writes is a safe, free win. Here a
  camelHump inserts a `_` _without consuming an input character_
  (`'aB'.length === 2` but `snakeCase('aB') === 'a_b'`, three characters), so
  that bound no longer holds. Rather than pre-size to a looser `2 * length` and
  carry the trimming bookkeeping, the chosen form uses `push`. The benchmark
  (below) confirms this is the right call: the readable regex is the only
  correct rival and it is far slower, so there is no pre-sizing win being left
  on the table.
- **Unicode-correct case detection.** "Uppercase" is "has a distinct lowercase
  form" (`character !== raw`), so accented Latin, Greek, and Cyrillic split at
  their humps (`HélloWörld` → `héllo_wörld`); caseless scripts (CJK) and digits
  are treated as non-uppercase, so they never start an acronym tail but a
  following capital still opens a new word (`日本語Text` → `日本語_text`).

## Alternatives considered

### 1. Two-pass regex, then split/join

```ts
value
  .replace(/([\p{Ll}\p{Lo}\p{N}])(\p{Lu})/gu, '$1_$2') // word|Word
  .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1_$2') // acroNymTail
  .split(/[^\p{L}\p{N}]+/u)
  .filter(Boolean)
  .map((word) => word.toLowerCase())
  .join('_');
```

- The readable approach, and genuinely correct — it is the parity oracle's rival
  in [`snake-case.alternatives.test.ts`](./snake-case.alternatives.test.ts) and
  matches the chosen implementation across the whole corpus, acronyms and
  Unicode included.
- But it runs the regex engine over the entire string several times per call and
  allocates intermediate arrays. Measured ~1.7× slower than the single-pass loop
  (see Benchmarks). Rejected as the default for that reason — the chosen loop is
  the fastest _correct_ option, which is the bar (CONTRIBUTING §1).

### 2. ASCII-only with bitwise case conversion (no Unicode handling)

```ts
output += isUpper ? String.fromCharCode(code + 32) : value.charAt(i);
```

- Fastest variant measured, by a wide margin (~2.1×).
- **Not bomb-proof:** every non-ASCII byte is treated as a delimiter, so
  accented letters, CJK, and non-ASCII digits are dropped, and astral-plane
  input risks surrogate-pair corruption — `snakeCase('héllo wörld')` would lose
  the `é`/`ö`.
- Rejected: same reasoning as `camelCase` §4. The parity test asserts this
  variant diverges so it can never be mistaken for shippable.

## Benchmarks

Evidence for the claims above — not a guarantee. Microbenchmarks are noisy and
environment-specific; what these numbers substantiate is the _relative_ ordering
of the candidates. Regenerate with `pnpm bench`. The runnable candidates live in
[`snake-case.alternatives.ts`](./snake-case.alternatives.ts), and their
correctness is gated separately by
[`snake-case.alternatives.test.ts`](./snake-case.alternatives.test.ts) — only
implementations that match the chosen one across the corpus are eligible.

Environment: Node 24.14.1, Apple M1 Max, macOS (arm64), 2026-06-24, over the
shared corpus in [`string.fixtures.ts`](./string.fixtures.ts). Higher `hz`
(operations per second over the corpus) is better.

| Implementation                    | hz (ops/s) |    RME | vs. chosen                  |
| --------------------------------- | ---------: | -----: | --------------------------- |
| **chosen** (inline, push)         |    114,820 | ±0.56% | —                           |
| two-pass regex (split and join)   |     67,490 | ±0.48% | chosen 1.70× faster         |
| ASCII only (**not** Unicode-safe) |    246,115 | ±0.37% | 2.14× faster — disqualified |

Reading the table:

- The single-pass loop is ~1.7× the throughput of the readable regex, the only
  correct rival — the ASCII fast path and the avoided intermediate allocations
  are what earn it.
- The ASCII-only variant is ~2.1× faster than the chosen implementation and is
  **still rejected** — it drops every non-ASCII letter, so it fails parity. It
  is in the table only to make the trade-off concrete.

## Gotchas

- **camelHumps are boundaries, acronyms are split at their tail.**
  `snakeCase('XMLHttpRequest')` is `'xml_http_request'`: a run of capitals stays
  together until the last one, which begins the next word because it is followed
  by a lowercase letter. A trailing all-caps run with no following lowercase is
  left whole (`snakeCase('ABC') === 'abc'`).
- **Digits attach to the preceding word, but a digit→uppercase transition is a
  boundary.** `snakeCase('foo2Bar')` is `'foo2_bar'`. This keeps round-trips
  with `camelCase` sane (`camelCase` likewise keeps digits inside a word).
- Consecutive delimiters of any kind (`"user__id"`, `"foo...bar"`,
  `"foo_-!bar"`) collapse to a single underscore, and leading/trailing
  delimiters are dropped rather than turned into stray underscores —
  `pendingSeparator` is only ever flushed in front of a real character.
- The `if (codePoint === undefined) break` branch is unreachable given the
  `while (i < length)` guard; it exists purely to satisfy strict typing without
  a non-null assertion, same as `camelCase`.
- Locale-sensitive casing (Turkish dotless `ı`/`İ`) is **not** handled — this
  uses `toLowerCase`/`toUpperCase`, not the locale variants, for determinism.
- Grapheme clusters spanning multiple code points (emoji ZWJ sequences,
  combining marks) are processed per code point, not per grapheme — an
  `Intl.Segmenter` variant would be the fix if it ever matters in practice.

```

```
