// Rejected camelCase implementations, kept runnable so the benchmark can
// substantiate the claims in `camel-case.md` and the parity test can prove
// which ones are actually correct. Repo-only: never re-exported from the
// barrel, never shipped in `dist`. The chosen implementation lives in
// `camel-case.ts` and is the single source of truth; these exist only for
// comparison.

const UNICODE_ALPHANUMERIC_REGEX = /\p{L}|\p{N}/u;

/**
 * Alternative §2 from the notes: iterate by code point with `for...of`.
 * Correct (handles surrogate pairs natively), but cannot pre-size the output
 * array, so it falls back to `push`.
 */
export function camelCaseForOf(value: string): string {
  const output: string[] = [];
  let capitalizeNext = false;
  let started = false;

  for (const character of value) {
    if (!UNICODE_ALPHANUMERIC_REGEX.test(character)) {
      capitalizeNext = started;
      continue;
    }
    output.push(
      capitalizeNext ? character.toUpperCase() : character.toLowerCase(),
    );
    capitalizeNext = false;
    started = true;
  }

  return output.join('');
}

/**
 * The chosen algorithm exactly, but with `push` instead of a pre-sized array.
 * Isolates the contribution of the pre-sized-array optimization: same logic,
 * same correctness, different allocation strategy.
 */
export function camelCasePush(value: string): string {
  const length = value.length;
  const output: string[] = [];

  let capitalizeNext = false;
  let i = 0;
  let started = false;

  while (i < length) {
    const code = value.charCodeAt(i);
    const isAsciiAlphanumeric =
      (code >= 48 && code <= 57) ||
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122);

    if (isAsciiAlphanumeric) {
      const character = value.charAt(i);
      output.push(
        capitalizeNext ? character.toUpperCase() : character.toLowerCase(),
      );
      capitalizeNext = false;
      started = true;
      i++;
      continue;
    }

    if (code < 128) {
      capitalizeNext = started;
      i++;
      continue;
    }

    const codePoint = value.codePointAt(i);
    if (codePoint === undefined) {
      break;
    }
    const character = String.fromCodePoint(codePoint);
    const charLength = codePoint > 0xffff ? 2 : 1;

    if (UNICODE_ALPHANUMERIC_REGEX.test(character)) {
      output.push(
        capitalizeNext ? character.toUpperCase() : character.toLowerCase(),
      );
      capitalizeNext = false;
      started = true;
    } else {
      capitalizeNext = started;
    }
    i += charLength;
  }

  return output.join('');
}

/**
 * Alternative §4 from the notes: ASCII-only with bitwise case conversion and
 * no Unicode handling at all. The fastest variant, and deliberately
 * **incorrect** — it treats every non-ASCII byte as a delimiter (dropping
 * accented letters, CJK, non-ASCII digits) and can split surrogate pairs. Kept
 * only to demonstrate that speed does not override correctness; the parity test
 * asserts it diverges.
 */
export function camelCaseAsciiBitwise(value: string): string {
  let output = '';
  let capitalizeNext = false;
  let started = false;

  for (let i = 0; i < value.length; i++) {
    let code = value.charCodeAt(i);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;

    if (isUpper || isLower || isDigit) {
      if (capitalizeNext && isLower) {
        code -= 32; // to upper
      } else if (!capitalizeNext && isUpper) {
        code += 32; // to lower
      }
      output += String.fromCharCode(code);
      capitalizeNext = false;
      started = true;
    } else {
      capitalizeNext = started;
    }
  }

  return output;
}
