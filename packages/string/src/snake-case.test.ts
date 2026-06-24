import { describe, expect, it } from 'vitest';

import { snakeCase } from './snake-case';

describe('snakeCase', () => {
  it('converts delimited words to snake_case', () => {
    expect(snakeCase('hello world')).toBe('hello_world');
    expect(snakeCase('foo_bar')).toBe('foo_bar');
    expect(snakeCase('baz-qux')).toBe('baz_qux');
    expect(snakeCase('  leading and trailing  ')).toBe('leading_and_trailing');
    expect(snakeCase('--multiple---separators--')).toBe('multiple_separators');
  });

  it('handles an empty string', () => {
    expect(snakeCase('')).toBe('');
  });

  it('handles a single word and lowercases it', () => {
    expect(snakeCase('hello')).toBe('hello');
    expect(snakeCase('HELLO')).toBe('hello');
  });

  it('collapses any run of delimiters into a single underscore', () => {
    expect(snakeCase('foo--bar')).toBe('foo_bar');
    expect(snakeCase('foo__bar')).toBe('foo_bar');
    expect(snakeCase('foo  bar')).toBe('foo_bar');
    expect(snakeCase('hello@world')).toBe('hello_world');
    expect(snakeCase('foo_-!bar')).toBe('foo_bar');
  });

  it('drops leading and trailing delimiters', () => {
    expect(snakeCase('_user_id')).toBe('user_id');
    expect(snakeCase('.foo.bar.')).toBe('foo_bar');
  });

  it('splits camelCase and PascalCase humps', () => {
    expect(snakeCase('fooBar')).toBe('foo_bar');
    expect(snakeCase('PascalCaseName')).toBe('pascal_case_name');
    expect(snakeCase('alreadyCamelCase')).toBe('already_camel_case');
  });

  it('splits acronyms at the word that follows them', () => {
    expect(snakeCase('XMLHttpRequest')).toBe('xml_http_request');
    expect(snakeCase('getHTTPResponse')).toBe('get_http_response');
    expect(snakeCase('ABC')).toBe('abc');
  });

  it('keeps digits and treats a digit-to-uppercase transition as a boundary', () => {
    expect(snakeCase('foo2Bar')).toBe('foo2_bar');
    expect(snakeCase('version-2-final')).toBe('version_2_final');
    expect(snakeCase('SCREAMING_SNAKE_CASE')).toBe('screaming_snake_case');
  });

  it('handles Unicode characters and humps', () => {
    expect(snakeCase('héllo wörld')).toBe('héllo_wörld');
    expect(snakeCase('HélloWörld')).toBe('héllo_wörld');
    expect(snakeCase('baz-Δqux')).toBe('baz_δqux');
    expect(snakeCase('日本語Text')).toBe('日本語_text');
  });

  it('handles astral-plane code points without splitting surrogate pairs', () => {
    expect(snakeCase('foo😀bar')).toBe('foo_bar');
    expect(snakeCase('😀leading')).toBe('leading');
  });
});
