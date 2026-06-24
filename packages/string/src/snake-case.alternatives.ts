// Rejected snakeCase implementations, kept runnable so the benchmark can
// substantiate the claims in `snake-case.md` and the parity test can prove
// which ones are actually correct. Repo-only: never re-exported from the
// barrel, never shipped in `dist`. The chosen implementation lives in
// `snake-case.ts`.

/**
 * The readable approach: insert boundaries with two regex passes, then split
 * on delimiters, lowercase, and join. Correct, but pays the regex engine on the
 * whole string for every call rather than classifying inline with an ASCII fast
 * path.
 */
export function snakeCaseRegex(value: string): string {
  return value
    .replace(/([\p{Ll}\p{Lo}\p{N}])(\p{Lu})/gu, '$1_$2') // word|Word
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1_$2') // acroNymTail
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((word) => word.toLowerCase())
    .join('_');
}

/**
 * ASCII-only with bitwise case conversion and no Unicode handling. The fastest
 * variant, and deliberately **incorrect** — every non-ASCII byte is treated as
 * a delimiter (dropping accented letters, CJK, non-ASCII digits) and surrogate
 * pairs can be split. Kept only to show that speed does not override
 * correctness; the parity test asserts it diverges.
 */
export function snakeCaseAsciiOnly(value: string): string {
  let output = '';
  let pendingSeparator = false;
  let prevWasUpper = false;
  let started = false;

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;

    if (!(isUpper || isLower || isDigit)) {
      pendingSeparator = started;
      continue;
    }

    if (started) {
      if (pendingSeparator) {
        output += '_';
      } else if (
        isUpper &&
        (!prevWasUpper ||
          (i + 1 < value.length &&
            value.charCodeAt(i + 1) >= 97 &&
            value.charCodeAt(i + 1) <= 122))
      ) {
        output += '_';
      }
    }

    pendingSeparator = false;
    output += isUpper ? String.fromCharCode(code + 32) : value.charAt(i);
    started = true;
    prevWasUpper = isUpper;
  }

  return output;
}
