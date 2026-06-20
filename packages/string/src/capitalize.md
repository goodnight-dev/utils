# `capitalize`

> Uppercase the first character of a string and lowercase the rest. (Same
> semantics as lodash `capitalize`; for upper-first-only see a future
> `upperFirst`.)

## Chosen implementation

```ts
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
```

Why this one:

- **No regex** — no pattern compilation or engine invocation.
- **Unicode-correct casing.** `toUpperCase` / `toLowerCase` apply the default
  Unicode case mappings, so `é`, `ß`, Cyrillic, Greek, etc. are handled. This is
  the "safe / bomb-proof" requirement.
- **Empty string falls out for free.** `''.charAt(0)` is `''` and `''.slice(1)`
  is `''`, so the result is `''` with no branch.
- **Cheap.** Two short-lived strings (first char, the rest) plus one
  concatenation; no loop, no branching.

## Alternatives considered

### 1. Regex replace

```ts
value.replace(/^./, (c) => c.toUpperCase());
```

- Different semantics: only uppercases the first character, does **not** lower
  the rest.
- Regex compile + engine invocation is overhead we don't need in a hot path.
- `^.` matches a single UTF-16 code unit, not a full code point.
- Rejected: slower and semantically narrower for no benefit.

### 2. Bracket / `at()` indexing

```ts
const first = value[0]; // `string | undefined` under noUncheckedIndexedAccess
```

- Forces an `undefined` guard for the empty-string case. `charAt(0)` sidesteps
  that by returning `''`, which keeps the function branchless.
- `value.at(0)` has the same `undefined` issue and is historically a touch
  slower than `charAt`.

### 3. ASCII fast path via `charCodeAt`

```ts
const c = value.charCodeAt(0);
if (c >= 97 && c <= 122) {
  return String.fromCharCode(c - 32) + value.slice(1).toLowerCase();
}
```

- Fastest option for pure-ASCII input.
- **Not bomb-proof:** silently ignores every non-ASCII letter (`é`, `ç`, `ß`,
  Cyrillic, …). Fails the "safe" bar in §1 of CONTRIBUTING. Rejected.

### 4. Locale-aware casing

```ts
value.charAt(0).toLocaleUpperCase() + value.slice(1).toLocaleLowerCase();
```

- Correct for locale-sensitive mappings (e.g. Turkish dotless `ı` / `İ`).
- Depends on the host locale, so results become non-deterministic across
  environments — surprising for a general-purpose util.
- Better expressed as a future opt-in: `capitalize(value, { locale })`.

### 5. Grapheme-correct first "character" (`Intl.Segmenter`)

```ts
const [first] = new Intl.Segmenter().segment(value);
// uppercase first.segment, append the rest
```

- Most correct when the first "character" is a grapheme cluster spanning
  multiple code points (emoji ZWJ sequences, combining marks).
- Heavyweight: constructing a `Segmenter` per call is far more expensive than
  the common case warrants.
- Candidate for a separate `capitalizeGrapheme` if a real need appears.

## Gotchas

- Astral-plane first characters (e.g. `𝒜`) are processed at the UTF-16 code-unit
  level, not the grapheme level. Acceptable for the general case, and documented
  here for honesty. Use approach #5 if grapheme correctness matters.
