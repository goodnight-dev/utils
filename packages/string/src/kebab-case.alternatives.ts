// Rejected kebabCase implementations, kept runnable so the benchmark can
// substantiate the claims in `kebab-case.md` and the parity test can prove which
// ones are actually correct. Repo-only: never re-exported from the barrel, never
// shipped in `dist`. The chosen implementation lives in `kebab-case.ts`, which
// calls the shared `toDelimitedCase` engine with a hyphen.

import { snakeCase } from './snake-case';

/**
 * Delegate to `snakeCase` and swap the separators. The obvious "don't repeat the
 * algorithm" move, and genuinely correct: `snakeCase` only ever emits `_` as a
 * word separator, so replacing every `_` with `-` yields exactly kebab-case.
 * Rejected as the chosen form because it runs the full conversion and then a
 * second pass over the whole result to rewrite separators (plus an extra string
 * allocation), where sharing the engine does it in one pass. It also couples
 * kebab-case's correctness to an internal detail of `snakeCase`'s output. See
 * the benchmark in `kebab-case.md`.
 */
export function kebabCaseViaSnake(value: string): string {
  return snakeCase(value).replaceAll('_', '-');
}

/**
 * The readable approach: insert boundaries with two regex passes, then split on
 * delimiters, lowercase, and join. Correct, but pays the regex engine on the
 * whole string for every call rather than classifying inline with an ASCII fast
 * path — the same trade-off documented for `snakeCase`.
 */
export function kebabCaseRegex(value: string): string {
  return value
    .replace(/([\p{Ll}\p{Lo}\p{N}])(\p{Lu})/gu, '$1-$2') // word|Word
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1-$2') // acroNymTail
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((word) => word.toLowerCase())
    .join('-');
}

/**
 * ASCII-only with bitwise case conversion and no Unicode handling. The fastest
 * variant, and deliberately **incorrect** — every non-ASCII byte is treated as
 * a delimiter (dropping accented letters, CJK, non-ASCII digits) and surrogate
 * pairs can be split. Kept only to show that speed does not override
 * correctness; the parity test asserts it diverges.
 */
export function kebabCaseAsciiOnly(value: string): string {
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
        output += '-';
      } else if (
        isUpper &&
        (!prevWasUpper ||
          (i + 1 < value.length &&
            value.charCodeAt(i + 1) >= 97 &&
            value.charCodeAt(i + 1) <= 122))
      ) {
        output += '-';
      }
    }

    pendingSeparator = false;
    output += isUpper ? String.fromCharCode(code + 32) : value.charAt(i);
    started = true;
    prevWasUpper = isUpper;
  }

  return output;
}
