// Shared word-splitting engine for the delimiter-joined case converters —
// `snakeCase` (joins with `_`) and `kebabCase` (joins with `-`). They are the
// same algorithm differing only in one character, so it lives here once rather
// than in two near-identical copies.
//
// Repo-only in spirit: `toDelimitedCase` is never re-exported from the barrel,
// so it is not part of the package's public surface. It is not dead weight,
// though — because the package is `sideEffects: false`, a bundler pulls this
// engine in only for whichever converter a consumer actually imports, and only
// once when they import both. See `snake-case.md` and `kebab-case.md`.

// cold-path classification for non-ASCII code points; ASCII is handled inline
const UNICODE_ALPHANUMERIC_REGEX = /\p{L}|\p{N}/u;

// lookahead for the acronym-tail boundary (the `R` in `HTTPResponse`) — the
// only place the algorithm needs to peek past the current character
function isLowercaseAt(value: string, index: number): boolean {
  if (index >= value.length) return false;
  const code = value.charCodeAt(index);
  if (code < 128) return code >= 97 && code <= 122;
  const codePoint = value.codePointAt(index);
  if (codePoint === undefined) return false;
  const character = String.fromCodePoint(codePoint);
  return character.toUpperCase() !== character;
}

/**
 * Lowercase every word in `value` and join the words with `separator`. A word
 * boundary is any of: a run of non-alphanumeric characters (dropped), a
 * lower-or-digit followed by an uppercase letter (`fooBar`), or the tail of an
 * acronym (`XMLHttp`). Word detection and casing are both Unicode-correct, not
 * ASCII-only.
 *
 * This is the shared engine behind {@link snakeCase} (`separator: '_'`) and
 * {@link kebabCase} (`separator: '-'`); the converters differ only in the
 * joining character, so the one-pass algorithm lives here.
 *
 * @param value - The string to convert.
 * @param separator - The single character placed between words.
 * @returns The delimited, lowercased string. An empty string is returned
 * unchanged.
 */
export function toDelimitedCase(value: string, separator: string): string {
  const length = value.length;
  // push, not a pre-sized array: a camelHump inserts the separator without
  // consuming an input character, so the output can be longer than `value`,
  // which defeats the cheap `new Array(length)` bound that camelCase relies on.
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
      if (!(
        upper ||
        (code >= 97 && code <= 122) ||
        (code >= 48 && code <= 57)
      )) {
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
        break; // unreachable given i < length; an honest guard, not a `!`
      }
      const raw = String.fromCodePoint(codePoint);
      step = codePoint > 0xffff ? 2 : 1;
      if (!UNICODE_ALPHANUMERIC_REGEX.test(raw)) {
        pendingSeparator = started;
        i += step;
        continue;
      }
      character = raw.toLowerCase();
      isUpper = character !== raw; // a distinct lowercase form means it was upper
    }

    if (started) {
      if (pendingSeparator) {
        output.push(separator);
      } else if (isUpper && (!prevWasUpper || isLowercaseAt(value, i + step))) {
        // a new word starts at this uppercase letter: either after a
        // lower/digit/caseless run, or at the tail of an acronym
        output.push(separator);
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
