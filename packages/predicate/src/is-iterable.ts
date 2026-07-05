/**
 * Test whether a given value is iterable. An iterable is any value that
 * implements the `Symbol.iterator` method, allowing it to be used in a
 * `for...of` loop or with the spread operator. Strings qualify alongside
 * arrays, `Map`, `Set`, typed arrays, and generator objects.
 *
 * @param value - The value to test for iterability.
 * @returns `true` when the value is iterable; `false` otherwise.
 *
 * @example
 * ```ts
 * isIterable([1, 2, 3]) // => true
 * isIterable('hello') // => true
 * isIterable(new Map()) // => true
 * isIterable(new Set()) // => true
 * isIterable({ [Symbol.iterator]: function* () {} }) // => true
 * isIterable({}) // => false
 * isIterable(null) // => false
 * isIterable(undefined) // => false
 * ```
 */
export function isIterable(value: unknown): boolean {
  return (
    value !== null &&
    value !== undefined &&
    typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] ===
      'function'
  );
}
