import { describe, expect, it } from 'vitest';

import { isRecord } from './is-record';

describe('isRecord', () => {
  it('returns `true` for record values', () => {
    expect(isRecord({ a: 1, b: 2 })).toBe(true);
    expect(isRecord({})).toBe(true);
    expect(isRecord({ key: undefined })).toBe(true);
    expect(isRecord(Object.create(null))).toBe(true);
  });

  it('returns `false` for non-record values', () => {
    expect(
      isRecord(
        new (class Example {
          value = 1;
        })(),
      ),
    ).toBe(false);
    expect(isRecord(new Map())).toBe(false);
    expect(isRecord(new Set())).toBe(false);
    expect(isRecord(new Date())).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord(() => undefined)).toBe(false);
    expect(isRecord('hello')).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });

  it('narrows the value to Record<string, unknown> when it returns true', () => {
    const value: unknown = { a: 1, b: 2 };
    expect(isRecord(value)).toBe(true);
    if (isRecord(value)) {
      // Compiles only because `value` is narrowed to Record<string, unknown>;
      // accessing a property on an `unknown` would be a type error.
      expect(value['a']).toBe(1);
    }
  });
});
