/**
 * Test whether a given value is a record — a plain object whose prototype is
 * `Object.prototype` (an object literal, `{}`, `new Object()`) or `null`
 * (`Object.create(null)`). Useful for narrowing an `unknown` down to an
 * indexable dictionary before reading its keys.
 *
 * Returns `false` for everything that is not a plain object: arrays, functions,
 * primitives, `null`, built-in exotic objects (`Map`, `Set`, `Date`, …), and
 * class instances, all of which carry a prototype other than `Object.prototype`
 * or `null`.
 *
 * @param value - The value to test for being a record.
 * @returns `true` when the value is a plain object; `false` otherwise. As a type
 * guard, a `true` result narrows `value` to `Record<string, unknown>`, so its
 * properties can be read without a cast.
 *
 * @example
 * ```ts
 * isRecord({ a: 1, b: 2 }) // => true
 * isRecord({}) // => true
 * isRecord(Object.create(null)) // => true
 * isRecord([1, 2, 3]) // => false
 * isRecord(new Date()) // => false
 * isRecord(new Map()) // => false
 * isRecord(null) // => false
 * isRecord('hello') // => false
 * ```
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // Identity on the prototype, not `typeof` plus an array guard: an object
  // literal's prototype is `Object.prototype` and `Object.create(null)`'s is
  // `null`; every array, built-in exotic, and class instance carries some other
  // prototype, so this one comparison subsumes the `!Array.isArray` check and
  // rejects them all.
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
