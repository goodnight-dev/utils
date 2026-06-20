// for unicode fallback detection
const UNICODE_ALPHANUMERIC_REGEX = /\p{L}|\p{N}/u;

/**
 * Convert a string to camelCase. Any run of non-alphanumeric characters is a
 * word boundary and is dropped from the output; word detection and casing are
 * both Unicode-correct, not ASCII-only.
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

    // any other ASCII byte is a non-alphanumeric delimiter: dropped, and it
    // marks the next alphanumeric for capitalization. Catching the whole ASCII
    // range here (not just space/hyphen/underscore) means the Unicode regex
    // below never runs on ASCII input at all.
    if (code < 128) {
      capitalizeNext = started;
      i++;
      continue;
    }

    // non-ascii (code point >= 128): full code point handling with a regex
    // check for alphanumeric
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
