import { bench, describe } from 'vitest';

import {
  isAsciiStringEvery,
  isAsciiStringForLoop,
  isAsciiStringWhileCachedLength,
} from './is-ascii-string.alternatives';
import { isAsciiString } from './is-ascii-string';
import { PREDICATE_INPUTS } from './predicate.fixtures';

function run(fn: (value: string) => boolean): void {
  for (const input of PREDICATE_INPUTS) {
    fn(input);
  }
}

describe('isAsciiString', () => {
  bench('isAsciiString (chosen: ReDoS-safe regex)', () => {
    run(isAsciiString);
  });
  bench('for loop (charCodeAt)', () => {
    run(isAsciiStringForLoop);
  });
  bench('while loop (cached length)', () => {
    run(isAsciiStringWhileCachedLength);
  });
  bench('spread + every', () => {
    run(isAsciiStringEvery);
  });
});
