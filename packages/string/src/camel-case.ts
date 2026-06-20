// for unicode fallback detection
const UNICODE_ALPHANUMERIC_REGEX = /\p{L}|\p{N}/u;

/**
 * Convert a string to camelCase.
 *
 * @param value - The string to convert.
 * @returns The camelCase string. An empty string is returned unchanged.
 *
 * @example
 * ```ts
 * camelCase('hello world') // => 'helloWorld'
 * camelCase('foo_bar') // => 'fooBar'
 * camelCase('baz-qux') // => 'bazQux'
 * camelCase('  leading and trailing  ') // => 'leadingAndTrailing'
 * camelCase('--multiple---separators--') // => 'multipleSeparators'
 * camelCase('héllo wörld') // => 'hélloWörld'
 * ```
 */
export function camelCase(value: string): string {
  const length = value.length;
  const output = new Array<string>(length);

  let capitalizeNext = false;
  let i = 0;
  let outIndex = 0;
  let started = false;

  while (i < length) {
    const code = value.charCodeAt(i);
    // ascii character fast path, skipping any regex checks for non-alphanumeric
    const isAsciiAlphanumeric =
      (code >= 48 && code <= 57) || // 0-9
      (code >= 65 && code <= 90) || // A-Z
      (code >= 97 && code <= 122); // a-z

    if (isAsciiAlphanumeric) {
      const character = value.charAt(i);
      output[outIndex++] = capitalizeNext
        ? character.toUpperCase()
        : character.toLowerCase();
      capitalizeNext = false;
      started = true;
      i++;
      continue;
    }

    // ascii delimiters fast path: space (32), hyphen (45), and underscore (95)
    if (code === 32 || code === 45 || code === 95) {
      capitalizeNext = started;
      i++;
      continue;
    }

    // non-ascii: full code point handling with regex check for alphanumeric
    const codePoint = value.codePointAt(i);
    if (codePoint === undefined) {
      break; // safety check, should not happen
    }
    const character = String.fromCodePoint(codePoint);
    const charLength = codePoint > 0xffff ? 2 : 1; // surrogate pair handling

    if (UNICODE_ALPHANUMERIC_REGEX.test(character)) {
      output[outIndex++] = capitalizeNext
        ? character.toUpperCase()
        : character.toLowerCase();
      capitalizeNext = false;
      started = true;
    } else {
      capitalizeNext = started;
    }
    i += charLength;
  }

  output.length = outIndex; // trim the output array to the actual length
  return output.join('');
}
