import { describe, expect, it } from 'vitest';

import {
  camelCaseAsciiBitwise,
  camelCaseForOf,
  camelCasePush,
} from './camel-case.alternatives';
import { camelCase } from './camel-case';
import { STRING_INPUTS } from './string.fixtures';

// Correctness is the gate, speed is the table. The chosen implementation is the
// oracle: an alternative only earns a place in the benchmark if it produces
// identical output across the whole corpus. This also keeps the checked-in
// alternatives from silently bit-rotting.
describe('camelCase alternatives', () => {
  const correct = { camelCaseForOf, camelCasePush };

  for (const [name, fn] of Object.entries(correct)) {
    it(`${name} matches camelCase across the corpus`, () => {
      for (const input of STRING_INPUTS) {
        expect(fn(input), input).toBe(camelCase(input));
      }
    });
  }

  it('camelCaseAsciiBitwise is disqualified — it is not Unicode-correct', () => {
    // The fastest variant, but it drops non-ASCII letters; it is benchmarked
    // for reference only and must never be mistaken for a shippable candidate.
    expect(camelCaseAsciiBitwise('héllo wörld')).not.toBe(
      camelCase('héllo wörld'),
    );
  });
});
