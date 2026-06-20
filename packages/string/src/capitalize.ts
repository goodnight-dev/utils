/**
 * Capitalize the first character of a string and lowercase the rest.
 *
 * @param value - The string to capitalize.
 * @returns The capitalized string. An empty string is returned unchanged.
 *
 * @example
 * ```ts
 * capitalize('hELLO') // => 'Hello'
 * capitalize('world') // => 'World'
 * ```
 */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
