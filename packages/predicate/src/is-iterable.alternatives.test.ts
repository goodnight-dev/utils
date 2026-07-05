import { describe, expect, it } from 'vitest';

import {
  isIterableObjectCoerce,
  isIterableTypeofObject,
} from './is-iterable.alternatives';
import { isIterable } from './is-iterable';
import { ITERABLE_INPUTS } from './predicate.fixtures';

// Correctness is the gate, speed is the table. The chosen implementation is the
// oracle: an alternative only earns a place in the benchmark if it produces
// identical output across the whole corpus. This also keeps the checked-in
// alternatives from silently bit-rotting.
describe('isIterable alternatives', () => {
  const correct = { isIterableObjectCoerce };

  for (const [name, fn] of Object.entries(correct)) {
    it(`${name} matches isIterable across the corpus`, () => {
      for (const input of ITERABLE_INPUTS) {
        expect(fn(input), String(input)).toBe(isIterable(input));
      }
    });
  }

  it('isIterableTypeofObject is disqualified — it drops strings', () => {
    // `typeof 'hello' === 'string'`, not 'object', so the object-guard reports
    // strings as non-iterable even though they satisfy the iterable protocol.
    // Benchmarked/documented for reference only; never a shippable candidate.
    expect(isIterableTypeofObject('hello')).not.toBe(isIterable('hello'));
  });
});
