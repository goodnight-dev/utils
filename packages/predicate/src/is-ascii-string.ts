// A single character class with one `*` between anchors: every prefix has
// exactly one match path, so there is nothing to backtrack into and the match
// is linear in the input length. That makes it ReDoS-safe on adversarial input,
// which is what lets a regex be the chosen implementation here (CONTRIBUTING §1
// — it is the fastest *correct and safe* option; see is-ascii-string.md). No
// `g` flag, so the shared instance is stateless and safe to reuse.
const ASCII_PATTERN = /^\p{ASCII}*$/u;

/**
 * Test whether a string is entirely ASCII — every code point in the range
 * U+0000–U+007F. Unicode-aware via the `u` flag, so an astral-plane character
 * (a single non-ASCII code point) correctly fails.
 *
 * @param value - The string to test.
 * @returns `true` if every character is ASCII; `true` for an empty string.
 *
 * @example
 * ```ts
 * isAsciiString('hello world') // => true
 * isAsciiString('café') // => false
 * isAsciiString('') // => true
 * ```
 */
export function isAsciiString(value: string): boolean {
  return ASCII_PATTERN.test(value);
}
