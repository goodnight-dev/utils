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
    // check for space (32), hyphen (45), and underscore (95)
    if (code === 32 || code === 45 || code === 95) {
      capitalizeNext = started;
      i++;
      continue;
    }

    const codePoint = value.codePointAt(i);
    if (codePoint === undefined) {
      break; // safety check, should not happen
    }
    const character = String.fromCodePoint(codePoint);
    const charLength = codePoint > 0xffff ? 2 : 1; // surrogate pair handling

    output[outIndex++] = capitalizeNext
      ? character.toUpperCase()
      : character.toLowerCase();
    capitalizeNext = false;
    started = true;
    i += charLength;
  }

  output.length = outIndex; // trim the output array to the actual length
  return output.join('');
}
