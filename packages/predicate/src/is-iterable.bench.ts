import { bench, describe } from 'vitest';

import { isIterableObjectCoerce } from './is-iterable.alternatives';
import { isIterable } from './is-iterable';
import { ITERABLE_INPUTS } from './predicate.fixtures';

// Evidence for the claim in is-iterable.md. Run with `pnpm bench`. Not a CI
// gate — microbenchmarks are too noisy — just reproducible evidence,
// snapshotted into the notes with an environment stamp. Correctness is enforced
// separately by is-iterable.alternatives.test.ts.

function run(fn: (value: unknown) => boolean): void {
  for (const input of ITERABLE_INPUTS) {
    fn(input);
  }
}

describe('isIterable', () => {
  bench('isIterable (chosen)', () => {
    run(isIterable);
  });

  bench('Symbol.iterator in Object(value)', () => {
    run(isIterableObjectCoerce);
  });
});
