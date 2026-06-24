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
 * Convert a string to snake_case. Words are lowercased and joined with single
 * underscores. A word boundary is any of: a run of non-alphanumeric characters
 * (dropped), a lower-or-digit followed by an uppercase letter (`fooBar`), or
 * the tail of an acronym (`XMLHttp` → `xml_http`). Word detection and casing
 * are both Unicode-correct, not ASCII-only.
 *
 * This is the inverse of {@link camelCase} and additionally splits camelHumps,
 * which is the usual reason to reach for it: `snakeCase('fooBar')` is
 * `'foo_bar'`.
 *
 * @param value - The string to convert.
 * @returns The snake_case string. An empty string is returned unchanged.
 *
 * @example
 * ```ts
 * snakeCase('hello world') // => 'hello_world'
 * snakeCase('fooBar') // => 'foo_bar'
 * snakeCase('XMLHttpRequest') // => 'xml_http_request'
 * snakeCase('baz-qux') // => 'baz_qux'
 * snakeCase('héllo wörld') // => 'héllo_wörld'
 * ```
 */
export function snakeCase(value: string): string {
  const length = value.length;
  // push, not a pre-sized array: a camelHump inserts '_' without consuming an
  // input character, so the output can be longer than `value`, which defeats
  // the cheap `new Array(length)` bound that camelCase relies on.
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
        output.push('_');
      } else if (isUpper && (!prevWasUpper || isLowercaseAt(value, i + step))) {
        // a new word starts at this uppercase letter: either after a
        // lower/digit/caseless run, or at the tail of an acronym
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
