# `camelCase`

> Convert a string to `camelCase`. Word boundaries are any run of one or more
> non-alphanumeric characters (`\p{L}` / `\p{N}`) — this covers the common
> delimiters (space, hyphen, underscore) as well as arbitrary punctuation.
> Non-alphanumeric characters are dropped from the output, not preserved.
> Unicode-correct: alphanumeric detection and casing both use Unicode semantics,
> not ASCII-only bit math.

## Chosen implementation

```ts
// for unicode fallback detection
const UNICODE_ALPHANUMERIC_REGEX = /\p{L}|\p{N}/u;

export function camelCase(value: string): string {
  const length = value.length;
  const output = new Array<string>(length);

  let capitalizeNext = false;
  let i = 0;
  let outIndex = 0;
  let started = false;

  while (i < length) {
    const code = value.charCodeAt(i);
    // ascii character fast path, skipping any regex checks for non-alphanumeric
    const isAsciiAlphanumeric =
      (code >= 48 && code <= 57) || // 0-9
      (code >= 65 && code <= 90) || // A-Z
      (code >= 97 && code <= 122); // a-z

    if (isAsciiAlphanumeric) {
      const character = value.charAt(i);
      output[outIndex++] = capitalizeNext
        ? character.toUpperCase()
        : character.toLowerCase();
      capitalizeNext = false;
      started = true;
      i++;
      continue;
    }

    // any other ASCII byte is a non-alphanumeric delimiter: dropped, and it
    // marks the next alphanumeric for capitalization. Catching the whole ASCII
    // range here (not just space/hyphen/underscore) means the Unicode regex
    // below never runs on ASCII input at all.
    if (code < 128) {
      capitalizeNext = started;
      i++;
      continue;
    }

    // non-ascii (code point >= 128): full code point handling with a regex
    // check for alphanumeric
    const codePoint = value.codePointAt(i);
    if (codePoint === undefined) {
      break; // safety check, should not happen
    }
    const character = String.fromCodePoint(codePoint);
    const charLength = codePoint > 0xffff ? 2 : 1; // surrogate pair handling

    if (UNICODE_ALPHANUMERIC_REGEX.test(character)) {
      output[outIndex++] = capitalizeNext
        ? character.toUpperCase()
        : character.toLowerCase();
      capitalizeNext = false;
      started = true;
    } else {
      capitalizeNext = started;
    }
    i += charLength;
  }

  output.length = outIndex; // trim the output array to the actual length
  return output.join('');
}
```

Why this one:

- **Three-branch loop, ordered by frequency.** ASCII-alphanumeric (most common
  in real input — identifiers, slugs, words) is checked first via pure numeric
  comparison, then _any_ remaining ASCII byte (`code < 128`) is handled as a
  dropped delimiter, then non-ASCII (`code >= 128`) as the slow path. Because
  the second branch claims the entire rest of the ASCII range, the expensive
  regex check only ever runs on genuinely non-ASCII code points — never on
  punctuation like `.`/`@`/`/` that a space/hyphen/underscore-only test would
  have leaked onto the slow path.
- **Module-level, single-compile regex, used only on the cold path.** This is
  not "regex as the transformation engine" — it's one classification test,
  compiled once at module load, invoked only for non-ASCII code points. For the
  overwhelming majority of real-world input it never executes at all.
- **Pre-sized output array.** `new Array<string>(length)` plus indexed writes
  avoids the incremental-growth checks `push` does on every call. Trimmed via
  `output.length = outIndex` at the end — an O(1) property update, not a
  reallocation.
- **`codePointAt` + explicit length advance (`charLength`) for full Unicode
  correctness.** Surrogate pairs (emoji, astral-plane characters) are read as a
  single code point and the loop index steps by 2 instead of 1, avoiding the
  classic bug of splitting a pair mid-character.
- **No non-null assertion.** `codePointAt` is typed to return
  `number | undefined`; rather than asserting that away with `!`, the function
  narrows with an explicit `if (codePoint === undefined) break`. Provably dead
  code given `i < length`, but an honest guard instead of a silenced type hole.
- **`started` flag instead of an output-length check.**
  `capitalizeNext = started` collapses "a delimiter has been seen" and "suppress
  capitalization on leading delimiters" into one assignment.
- **Unicode-correct casing**, same rationale as `capitalize`:
  `toUpperCase`/`toLowerCase` apply default Unicode case mappings, so accented
  Latin, Cyrillic, Greek, etc. are capitalized correctly.

## Alternatives considered

### 1. Regex replace (whole transformation)

```ts
value
  .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
  .replace(/^[A-Z]/, (c) => c.toLowerCase());
```

- Simplest to read, and fine for non-hot-path call sites.
- Regex compile + engine invocation overhead on _every_ call, on the _entire_
  string — a fundamentally different cost profile than the single module-level,
  cold-path-only regex in the chosen implementation.
- `[a-zA-Z0-9]` is ASCII-only, so it's actually less correct than the chosen
  version: non-ASCII letters and digits would be treated as delimiters. `(.)`
  also matches a single UTF-16 code unit, not a full code point — same
  surrogate-pair risk as a naive indexed loop.
- Rejected as the library default: slower on every call and less correct on
  non-ASCII input than the chosen implementation.

### 2. `for...of` over the string

```ts
for (const character of value) {
  if (!UNICODE_ALPHANUMERIC.test(character)) {
    capitalizeNext = started
    continue
  }
  output.push(capitalizeNext ? character.toUpperCase() : character.toLowerCase())
  ...
}
```

- Iterates by code point natively, so surrogate pairs are handled with no manual
  width bookkeeping and no `undefined` case to guard at all.
- Notably more readable — no index arithmetic, no `codePointAt`/`charCodeAt`
  split, no defensive `break`.
- Doesn't expose an index, so the output array can't be pre-sized; falls back to
  `push`.
- Doesn't expose a cheap way to skip the regex for the ASCII common case without
  re-adding a `charCodeAt` check anyway — at which point you've reconstructed
  most of the chosen implementation's branching but lost the pre-sized array.
- Rejected as the default, but only narrowly: worth reaching for instead of the
  indexed version if the regex branch ends up being hit often enough that the
  lost ASCII fast-path advantage stops mattering, or if the manual index math
  becomes a real maintenance burden.

### 3. ASCII-only alphanumeric test, no regex, non-ASCII letters preserved as content

```ts
// non-ASCII: treat as alphanumeric only if casing changes it
const upper = character.toUpperCase();
const lower = character.toLowerCase();
const isAlphanumeric = upper !== lower; // catches cased letters, misses CJK & non-ASCII digits
```

- Avoids any `RegExp` entirely, riding on `toUpperCase`/`toLowerCase` calls
  already in the function.
- Correctly classifies _cased_ non-ASCII letters (é, ñ, Cyrillic, Greek,
  Armenian) without a Unicode data dependency.
- **Incomplete:** caseless scripts (CJK ideographs) and non-ASCII digits
  (Arabic-Indic numerals, full-width digits) have no case distinction at all, so
  this test silently misclassifies them as delimiters. No regex-free primitive
  in JS distinguishes "Unicode letter/digit" from "punctuation" for those
  without embedding actual Unicode category data.
- Rejected: a partial, undocumented-by-default gap (CJK as the most
  consequential case) felt riskier than a single, clearly-scoped, cold-path
  regex test. Worth reconsidering if a hard no-regex constraint outweighs the
  CJK gap for this library's actual user base.

### 4. ASCII fast path via `charCodeAt` + bitwise case conversion (no Unicode handling at all)

```ts
if (cc >= 97 && cc <= 122) cc -= 32; // lower -> upper, ASCII only
```

- Fastest variant measured by a wide margin.
- **Not bomb-proof:** non-ASCII letters pass through unconverted rather than
  erroring, and astral-plane input risks surrogate-pair corruption if
  implemented over a fixed-width buffer.
- Rejected: same reasoning as `capitalize` §3 and the original `camelCase`
  writeup — a function named `camelCase` carries an implicit contract to handle
  arbitrary string input correctly, and that's true with even more force now
  that non-alphanumeric _detection_ (not just casing) needs to be Unicode-aware
  too.

### 5. `Set` of delimiter characters instead of numeric/regex checks

```ts
const delimiters = new Set([' ', '-', '_'])
if (delimiters.has(character)) { ... }
```

- No longer expressive enough on its own once delimiters expanded from a fixed
  list of three to "anything non-alphanumeric" — would need to be paired with
  the same alphanumeric test regardless, so it doesn't actually replace any of
  the logic above, just the three-character ASCII case.
- Slower than chained `===`/numeric comparisons for a set this small, same
  reasoning as before.
- Rejected: doesn't solve the actual problem (classifying arbitrary punctuation)
  and is slower than the numeric check it would replace.

## Gotchas

- **Behavior change from earlier drafts:** non-alphanumeric characters are now
  **dropped**, not preserved. `camelCase('foo.bar')` produces `'fooBar'`, not
  `'foo.bar'`. Worth calling out prominently in release notes / changelog if
  this ships after an earlier version that preserved punctuation.
- Consecutive delimiters of any kind (`"user__id"`, `"foo...bar"`,
  `"foo_-!bar"`) collapse correctly — `capitalizeNext` simply stays `true`
  across them, regardless of which non-alphanumeric characters compose the run.
- Leading delimiters (`"_user_id"`, `".foo"`) are handled via the `started` flag
  rather than capitalizing the first real character — produces `"userId"` /
  `"foo"`, not `"UserId"` / `"Foo"`.
- The `if (codePoint === undefined) break` branch is unreachable given the
  `while (i < length)` guard; it exists purely to satisfy strict typing without
  an assertion, and is documented here so a future reader doesn't mistake it for
  reachable logic worth testing around.
- `UNICODE_ALPHANUMERIC_REGEX` is only ever tested against non-ASCII
  (`code >= 128`) characters — the two ASCII branches `continue` before reaching
  it, and between them they partition the whole ASCII range (alphanumeric vs.
  everything else). This is sound only because for ASCII, `\p{L}`/`\p{N}` is
  exactly `0-9 A-Z a-z`; if the alphanumeric range checks are ever changed, the
  `code < 128` delimiter branch will silently absorb the difference, so
  re-verify the two paths still agree at the boundary.
- Locale-sensitive casing (e.g. Turkish dotless `ı`/`İ`) is **not** handled —
  this uses `toUpperCase`/`toLowerCase`, not `toLocaleUpperCase`/
  `toLocaleLowerCase`, for the same determinism rationale as `capitalize` §4. A
  locale-aware variant would be a separate opt-in if a real need appears.
- Grapheme clusters spanning multiple code points (emoji ZWJ sequences,
  combining marks) are processed per code point, not per grapheme — same caveat
  as `capitalize`'s astral-plane note. Acceptable for the general case; a
  `camelCaseGrapheme` via `Intl.Segmenter` would be the fix if this ever matters
  in practice.
