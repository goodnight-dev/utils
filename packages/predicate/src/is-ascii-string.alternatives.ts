/**
 * The hand-rolled loop — the shape camelCase and snakeCase chose. Correct and
 * bails on the first non-ASCII code unit, but ~1.4x slower than the regex on
 * the corpus: V8's regex engine scans ASCII faster than per-character
 * `charCodeAt`.
 */
export function isAsciiStringForLoop(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 0x7f) {
      return false;
    }
  }
  return true;
}

/**
 * The loop with `value.length` hoisted into a local. Indistinguishable from the
 * `for` form in the benchmark — V8 already treats string length as immutable,
 * so caching it buys nothing.
 */
export function isAsciiStringWhileCachedLength(value: string): boolean {
  const length = value.length;
  let i = 0;
  while (i < length) {
    if (value.charCodeAt(i) > 0x7f) {
      return false;
    }
    i++;
  }
  return true;
}

/**
 * Code-point iteration (`Array.from`) then `every`. Correct, but allocates an
 * array of one-character strings plus a closure per call — ~7x slower.
 */
export function isAsciiStringEvery(value: string): boolean {
  return Array.from(value).every((char) => char.charCodeAt(0) <= 0x7f);
}
