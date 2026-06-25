import { describe, expect, it } from 'vitest';

import { isAsciiString } from './is-ascii-string';

describe('isAsciiString', () => {
  it('returns true for ASCII strings', () => {
    expect(isAsciiString('hello world')).toBe(true);
    expect(isAsciiString('Foo_Bar-123!')).toBe(true);
  });

  it('returns true for an empty string', () => {
    expect(isAsciiString('')).toBe(true);
  });

  it('treats U+007F as the upper ASCII bound', () => {
    expect(isAsciiString(String.fromCharCode(0x7f))).toBe(true); // DEL, top of ASCII
    expect(isAsciiString(String.fromCharCode(0x80))).toBe(false); // first non-ASCII
  });

  it('returns false when any character is non-ASCII', () => {
    expect(isAsciiString('héllo')).toBe(false);
    expect(isAsciiString('café')).toBe(false);
    expect(isAsciiString('日本語')).toBe(false);
    expect(isAsciiString('a→b')).toBe(false);
  });

  it('returns false for astral-plane characters (surrogate pairs)', () => {
    expect(isAsciiString('foo😀')).toBe(false);
    expect(isAsciiString('😀')).toBe(false);
  });
});
