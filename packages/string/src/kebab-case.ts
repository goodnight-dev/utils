import { toDelimitedCase } from './delimited-case';

/**
 * Convert a string to kebab-case. Words are lowercased and joined with single
 * hyphens. A word boundary is any of: a run of non-alphanumeric characters
 * (dropped), a lower-or-digit followed by an uppercase letter (`fooBar`), or
 * the tail of an acronym (`XMLHttp` → `xml-http`). Word detection and casing
 * are both Unicode-correct, not ASCII-only.
 *
 * Shares its word-splitting engine with {@link snakeCase}; the two differ only
 * in the joining character. kebab-case is the usual spelling for URL slugs, CSS
 * identifiers, and CLI flags: `kebabCase('fooBar')` is `'foo-bar'`.
 *
 * @param value - The string to convert.
 * @returns The kebab-case string. An empty string is returned unchanged.
 *
 * @example
 * ```ts
 * kebabCase('hello world') // => 'hello-world'
 * kebabCase('fooBar') // => 'foo-bar'
 * kebabCase('XMLHttpRequest') // => 'xml-http-request'
 * kebabCase('baz_qux') // => 'baz-qux'
 * kebabCase('héllo wörld') // => 'héllo-wörld'
 * ```
 */
export function kebabCase(value: string): string {
  // Delegates to the shared engine with a hyphen; `snakeCase` calls the same
  // engine with an underscore. See `kebab-case.md` for why the algorithm is
  // shared rather than duplicated or chained onto `snakeCase`.
  return toDelimitedCase(value, '-');
}
