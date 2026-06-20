import { describe, expect, it } from 'vitest';

import { camelCase } from './camel-case';

describe('camelCase', () => {
  it('converts a string to camelCase', () => {
    expect(camelCase('hello world')).toBe('helloWorld');
    expect(camelCase('foo_bar')).toBe('fooBar');
    expect(camelCase('baz-qux')).toBe('bazQux');
    expect(camelCase('  leading and trailing  ')).toBe('leadingAndTrailing');
    expect(camelCase('--multiple---separators--')).toBe('multipleSeparators');
  });

  it('handles an empty string', () => {
    expect(camelCase('')).toBe('');
  });

  it('handles a single word', () => {
    expect(camelCase('hello')).toBe('hello');
  });

  it('handles multiple consecutive separators', () => {
    expect(camelCase('foo--bar')).toBe('fooBar');
    expect(camelCase('foo__bar')).toBe('fooBar');
    expect(camelCase('foo  bar')).toBe('fooBar');
  });

  it('treats any non-alphanumeric run as a boundary and drops it', () => {
    expect(camelCase('hello@world')).toBe('helloWorld');
    expect(camelCase('foo#bar')).toBe('fooBar');
    expect(camelCase('baz$qux')).toBe('bazQux');
    expect(camelCase('foo.bar')).toBe('fooBar');
    expect(camelCase('foo_-!bar')).toBe('fooBar');
  });

  it('ignores leading and trailing delimiters', () => {
    expect(camelCase('_user_id')).toBe('userId');
    expect(camelCase('.foo.bar.')).toBe('fooBar');
  });

  it('keeps digits and capitalizes the letter after a boundary', () => {
    expect(camelCase('foo 123 bar')).toBe('foo123Bar');
    expect(camelCase('version-2-final')).toBe('version2Final');
  });

  it('handles Unicode characters', () => {
    expect(camelCase('héllo wörld')).toBe('hélloWörld');
    expect(camelCase('baz-Δqux')).toBe('bazΔqux');
  });

  it('handles astral-plane code points without splitting surrogate pairs', () => {
    expect(camelCase('foo😀bar')).toBe('fooBar');
    expect(camelCase('😀leading')).toBe('leading');
  });
});
