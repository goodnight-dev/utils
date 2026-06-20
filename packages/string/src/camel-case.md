# `camelCase`

> Convert a delimited string (`snake_case`, `kebab-case`, `space separated`) to
> `camelCase`. Unicode-correct: casing is applied via the default Unicode case
> mappings, not ASCII-only bit math.

## Chosen implementation

\`\`\`ts /\*\*

- Convert a string to camelCase.
-
- @param value - The string to convert.
- @returns The camelCase string. An empty string is returned unchanged.
-
- @example
- \`\`\`ts
- camelCase('hello world') // => 'helloWorld'
- camelCase('foo_bar') // => 'fooBar'
- camelCase('baz-qux') // => 'bazQux'
- camelCase(' leading and trailing ') // => 'leadingAndTrailing'
- camelCase('--multiple---separators--') // => 'multipleSeparators'
- \`\`\` \*/ export function camelCase(value: string): string { const length =
  value.length; const output = new Array<string>(length);

let capitalizeNext = false; let i = 0; let outIndex = 0; let started = false;

while (i < length) { const code = value.charCodeAt(i); // check for space (32),
hyphen (45), and underscore (95) if (code === 32 || code === 45 || code === 95)
{ capitalizeNext = started; i++; continue; }

    const codePoint = value.codePointAt(i);
    if (codePoint === undefined) {
      break; // safety check, should not happen
    }
    const character = String.fromCodePoint(codePoint);
    const charLength = codePoint > 0xffff ? 2 : 1; // surrogate pair handling

    output[outIndex++] = capitalizeNext
      ? character.toUpperCase()
      : character.toLowerCase();
    capitalizeNext = false;
    started = true;
    i += charLength;

}

output.length = outIndex; // trim the output array to the actual length return
output.join(''); } \`\`\`

Why this one:

- **Pre-sized output array.** `new Array<string>(length)` (sized to input
  length, an upper bound on output length) plus indexed writes avoids the
  incremental-growth checks `push` does on every call. The array is trimmed via
  `output.length = outIndex` at the end — an O(1) property update, not a
  reallocation — so delimiter-heavy input doesn't cost more than one array
  allocation.
- **`codePointAt` + explicit length advance (`charLength`) for full Unicode
  correctness.** Surrogate pairs (emoji, astral-plane characters) are read as a
  single code point and the loop index steps by 2 instead of 1, avoiding the
  classic bug of splitting a pair mid-character.
- **No non-null assertion.** `codePointAt` is typed to return
  `number | undefined`; rather than asserting that away with `!`, the function
  narrows with an explicit `if (codePoint === undefined) break`. This is
  provably dead code given `i < length`, but it's an honest guard instead of a
  silenced type hole — the function fails safe rather than risking `NaN`/garbage
  output if the invariant is ever violated by a future edit.
- **`charCodeAt` retained for the delimiter check.** Delimiters (`' '`, `'-'`,
  `'_'`) are guaranteed single-code-unit ASCII, so there's no reason to pay for
  `codePointAt` there — it's reserved for content characters, where correctness
  actually depends on it.
- **`started` flag instead of an output-length check.**
  `capitalizeNext = started` collapses "a delimiter has been seen" and "suppress
  capitalization on leading delimiters" into one assignment, avoiding a separate
  length check per character.
- **Unicode-correct casing**, same rationale as `capitalize`:
  `toUpperCase`/`toLowerCase` apply default Unicode case mappings, so accented
  Latin, Cyrillic, Greek, etc. are capitalized correctly.

## Alternatives considered

### 1. Regex replace

\`\`\`ts value .replace(/[^a-zA-Z0-9]+(.)/g, (\_, c: string) => c.toUpperCase())
.replace(/^[A-Z]/, (c) => c.toLowerCase()) \`\`\`

- Simplest to read, and fine for non-hot-path call sites.
- Regex compile + engine invocation overhead on every call; consistently the
  slowest option across every variant benchmarked.
- `(.)` matches a single UTF-16 code unit, not a full code point — same
  surrogate-pair risk as a naive indexed loop.
- Rejected as the library default: this is a shared utility, not a one-off
  script, so the per-call regex overhead isn't worth paying for every consumer.

### 2. `for...of` over the string

\`\`\`ts for (const character of value) { if (character === ' ' || character ===
'-' || character === '\_') { capitalizeNext = started continue }
output.push(capitalizeNext ? character.toUpperCase() : character.toLowerCase())
... } \`\`\`

- Iterates by code point natively, so surrogate pairs are handled with no manual
  width bookkeeping and no `undefined` case to guard at all.
- Notably more readable — no index arithmetic, no `codePointAt`/`charCodeAt`
  split, no defensive `break`.
- Doesn't expose an index, so the output array can't be pre-sized; falls back to
  `push`, which carries incremental-growth overhead absent from the indexed
  version.
- Rejected as the default, but only narrowly: the perf delta versus the chosen
  implementation is small (single-digit percent in practice). Worth reaching for
  instead of the indexed version in contexts where readability is weighted
  higher than this library's bar, or if a maintenance burden ever shows up
  around the manual index math.

### 3. ASCII fast path via `charCodeAt` + bitwise case conversion

\`\`\`ts if (cc >= 97 && cc <= 122) cc -= 32 // lower -> upper, ASCII only
\`\`\`

- Fastest variant measured by a wide margin: no `toUpperCase()` call overhead,
  single typed-array allocation, no per-character string allocation until the
  final join.
- **Not bomb-proof:** the `+32`/`-32` relationship only holds for ASCII A–Z/a–z.
  Non-ASCII letters (`é`, `ñ`, Cyrillic, Greek) pass through uncapitalized
  rather than erroring — silently wrong, not a crash, which is worse for a
  shared utility no one is guaranteed to read before importing.
- Also breaks on astral-plane input if implemented over a `Uint16Array`, since
  each UTF-16 code unit is processed independently rather than as a full code
  point — same class of bug this implementation's `charLength` logic exists to
  prevent.
- Rejected: same reasoning as `capitalize` §3 — a function named `camelCase`
  (not `camelCaseAscii`) carries an implicit contract to handle arbitrary string
  input correctly. Speed on a subset of inputs isn't a substitute for
  correctness on the full domain, especially when the function will be imported
  into contexts where the input isn't predictable.

### 4. `Set` of delimiter characters instead of chained `===`

\`\`\`ts const delimiters = new Set([' ', '-', '_']) if
(delimiters.has(character)) { ... } \`\`\`

- Theoretically cleaner if the delimiter list grows.
- Slower in practice for a fixed set this small: `Set.has()` pays for hashing +
  bucket traversal + a method call, while 2–3 chained `===` comparisons (or, as
  chosen, `charCodeAt` numeric comparisons) on primitives are about as cheap as
  a check can be and are well-optimized by modern engines. The crossover point
  favoring `Set` is generally 8–10+ members.
- Rejected: more ceremony, measurably slower, no benefit at this scale.

## Gotchas

- Consecutive delimiters (`"user__id"`) collapse correctly — `capitalizeNext`
  simply stays `true` across them, so no double-capitalization or stray
  characters appear.
- Leading delimiters (`"_user_id"`) are handled via the `started` flag rather
  than capitalizing the first real character — produces `"userId"`, not
  `"UserId"`.
- The `if (codePoint === undefined) break` branch is unreachable given the
  `while (i < length)` guard; it exists purely to satisfy strict typing without
  an assertion, and is documented here so a future reader doesn't mistake it for
  reachable logic worth testing around.
- Locale-sensitive casing (e.g. Turkish dotless `ı`/`İ`) is **not** handled —
  this uses `toUpperCase`/`toLowerCase`, not `toLocaleUpperCase`/
  `toLocaleLowerCase`, for the same determinism rationale as `capitalize` §4. A
  locale-aware variant would be a separate opt-in if a real need appears.
- Grapheme clusters spanning multiple code points (emoji ZWJ sequences,
  combining marks) are processed per code point, not per grapheme — same caveat
  as `capitalize`'s astral-plane note. Acceptable for the general case; a
  `camelCaseGrapheme` via `Intl.Segmenter` would be the fix if this ever matters
  in practice.
