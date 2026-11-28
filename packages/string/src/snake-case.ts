import { toDelimitedCase } from './delimited-case';

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
  // Delegates to the shared engine with an underscore; `kebabCase` calls the
  // same engine with a hyphen. See `snake-case.md` for why the algorithm lives
  // in `delimited-case.ts`.
  return toDelimitedCase(value, '_');
}
