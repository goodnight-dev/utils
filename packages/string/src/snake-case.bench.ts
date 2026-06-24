import { bench, describe } from 'vitest';

import { snakeCaseAsciiOnly, snakeCaseRegex } from './snake-case.alternatives';
import { snakeCase } from './snake-case';
import { STRING_INPUTS } from './string.fixtures';

// Evidence for the claims in snake-case.md. Run with `pnpm bench`. These
// numbers are not a CI gate — microbenchmarks are too noisy to fail a build on
// — they are reproducible evidence, snapshotted into the notes with an
// environment stamp. Correctness is enforced separately by
// snake-case.alternatives.test.ts.

function run(fn: (value: string) => string): void {
  for (const input of STRING_INPUTS) {
    fn(input);
  }
}

describe('snakeCase — correct candidates', () => {
  bench('snakeCase (chosen: inline classification, push)', () => {
    run(snakeCase);
  });

  bench('two-pass regex (split and join)', () => {
    run(snakeCaseRegex);
  });
});

describe('snakeCase — reference only (fails parity, never shipped)', () => {
  bench('ASCII only (not Unicode-correct)', () => {
    run(snakeCaseAsciiOnly);
  });
});
