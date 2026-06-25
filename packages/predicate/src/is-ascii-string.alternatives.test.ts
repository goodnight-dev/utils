import { describe, expect, it } from 'vitest';

import {
  isAsciiStringEvery,
  isAsciiStringForLoop,
  isAsciiStringWhileCachedLength,
} from './is-ascii-string.alternatives';
import { isAsciiString } from './is-ascii-string';
import { PREDICATE_INPUTS } from './predicate.fixtures';

describe('isAsciiString alternatives', () => {
  const correct = {
    isAsciiStringForLoop,
    isAsciiStringWhileCachedLength,
    isAsciiStringEvery,
  };

  for (const [name, fn] of Object.entries(correct)) {
    it(`${name} matches isAsciiString across the corpus`, () => {
      for (const input of PREDICATE_INPUTS) {
        expect(fn(input), input).toBe(isAsciiString(input));
      }
    });
  }
});
