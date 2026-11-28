import { describe, expect, it } from 'vitest';

import { kebabCase } from './kebab-case';

describe('kebabCase', () => {
  it('converts delimited words to kebab-case', () => {
    expect(kebabCase('hello world')).toBe('hello-world');
    expect(kebabCase('foo_bar')).toBe('foo-bar');
    expect(kebabCase('baz-qux')).toBe('baz-qux');
    expect(kebabCase('  leading and trailing  ')).toBe('leading-and-trailing');
    expect(kebabCase('--multiple---separators--')).toBe('multiple-separators');
  });

  it('handles an empty string', () => {
    expect(kebabCase('')).toBe('');
  });

  it('handles a single word and lowercases it', () => {
    expect(kebabCase('hello')).toBe('hello');
    expect(kebabCase('HELLO')).toBe('hello');
  });

  it('collapses any run of delimiters into a single hyphen', () => {
    expect(kebabCase('foo--bar')).toBe('foo-bar');
    expect(kebabCase('foo__bar')).toBe('foo-bar');
    expect(kebabCase('foo  bar')).toBe('foo-bar');
    expect(kebabCase('hello@world')).toBe('hello-world');
    expect(kebabCase('foo_-!bar')).toBe('foo-bar');
  });

  it('drops leading and trailing delimiters', () => {
    expect(kebabCase('_user_id')).toBe('user-id');
    expect(kebabCase('.foo.bar.')).toBe('foo-bar');
  });

  it('splits camelCase and PascalCase humps', () => {
    expect(kebabCase('fooBar')).toBe('foo-bar');
    expect(kebabCase('PascalCaseName')).toBe('pascal-case-name');
    expect(kebabCase('alreadyCamelCase')).toBe('already-camel-case');
  });

  it('splits acronyms at the word that follows them', () => {
    expect(kebabCase('XMLHttpRequest')).toBe('xml-http-request');
    expect(kebabCase('getHTTPResponse')).toBe('get-http-response');
    expect(kebabCase('ABC')).toBe('abc');
  });

  it('keeps digits and treats a digit-to-uppercase transition as a boundary', () => {
    expect(kebabCase('foo2Bar')).toBe('foo2-bar');
    expect(kebabCase('version-2-final')).toBe('version-2-final');
    expect(kebabCase('SCREAMING_SNAKE_CASE')).toBe('screaming-snake-case');
  });

  it('handles Unicode characters and humps', () => {
    expect(kebabCase('héllo wörld')).toBe('héllo-wörld');
    expect(kebabCase('HélloWörld')).toBe('héllo-wörld');
    expect(kebabCase('baz-Δqux')).toBe('baz-δqux');
    expect(kebabCase('日本語Text')).toBe('日本語-text');
  });

  it('handles astral-plane code points without splitting surrogate pairs', () => {
    expect(kebabCase('foo😀bar')).toBe('foo-bar');
    expect(kebabCase('😀leading')).toBe('leading');
  });
});
