import { describe, expect, it } from 'vitest';

import { isIterable } from './is-iterable';

describe('isIterable', () => {
  it('returns `true` for iterable values', () => {
    expect(isIterable([1, 2, 3])).toBe(true);
    expect(isIterable('hello')).toBe(true);
    expect(isIterable(new Map())).toBe(true);
    expect(isIterable(new Set())).toBe(true);
    expect(
      isIterable({
        [Symbol.iterator]: function* () {
          /* no-op */
        },
      }),
    ).toBe(true);
  });

  it('returns `false` for non-iterable values', () => {
    expect(isIterable({})).toBe(false);
    expect(isIterable(null)).toBe(false);
    expect(isIterable(undefined)).toBe(false);
    expect(isIterable(42)).toBe(false);
    expect(isIterable(true)).toBe(false);
  });
});
