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

  it('handles non-alphanumeric characters', () => {
    expect(camelCase('hello@world')).toBe('helloWorld');
    expect(camelCase('foo#bar')).toBe('fooBar');
    expect(camelCase('baz$qux')).toBe('bazQux');
  });

  it('handles Unicode characters', () => {
    expect(camelCase('héllo wörld')).toBe('hélloWörld');
    expect(camelCase('baz-Δqux')).toBe('bazΔqux');
  });
});
