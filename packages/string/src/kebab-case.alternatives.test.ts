import { describe, expect, it } from 'vitest';

import {
  kebabCaseAsciiOnly,
  kebabCaseRegex,
  kebabCaseViaSnake,
} from './kebab-case.alternatives';
import { kebabCase } from './kebab-case';
import { STRING_INPUTS } from './string.fixtures';

// Correctness is the gate, speed is the table. The chosen implementation is the
// oracle: an alternative only earns a place in the benchmark if it produces
// identical output across the whole corpus. This also keeps the checked-in
// alternatives from silently bit-rotting.
describe('kebabCase alternatives', () => {
  const correct = { kebabCaseViaSnake, kebabCaseRegex };

  for (const [name, fn] of Object.entries(correct)) {
    it(`${name} matches kebabCase across the corpus`, () => {
      for (const input of STRING_INPUTS) {
        expect(fn(input), input).toBe(kebabCase(input));
      }
    });
  }

  it('kebabCaseAsciiOnly is disqualified — it is not Unicode-correct', () => {
    expect(kebabCaseAsciiOnly('héllo wörld')).not.toBe(
      kebabCase('héllo wörld'),
    );
  });
});
