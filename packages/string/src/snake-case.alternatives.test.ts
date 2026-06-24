import { describe, expect, it } from 'vitest';

import { snakeCaseAsciiOnly, snakeCaseRegex } from './snake-case.alternatives';
import { snakeCase } from './snake-case';
import { STRING_INPUTS } from './string.fixtures';

// Correctness is the gate, speed is the table. The chosen implementation is the
// oracle: an alternative only earns a place in the benchmark if it produces
// identical output across the whole corpus. This also keeps the checked-in
// alternatives from silently bit-rotting.
describe('snakeCase alternatives', () => {
  const correct = { snakeCaseRegex };

  for (const [name, fn] of Object.entries(correct)) {
    it(`${name} matches snakeCase across the corpus`, () => {
      for (const input of STRING_INPUTS) {
        expect(fn(input), input).toBe(snakeCase(input));
      }
    });
  }

  it('snakeCaseAsciiOnly is disqualified — it is not Unicode-correct', () => {
    expect(snakeCaseAsciiOnly('héllo wörld')).not.toBe(
      snakeCase('héllo wörld'),
    );
  });
});
