import { bench, describe } from 'vitest';

import {
  kebabCaseAsciiOnly,
  kebabCaseRegex,
  kebabCaseViaSnake,
} from './kebab-case.alternatives';
import { kebabCase } from './kebab-case';
import { STRING_INPUTS } from './string.fixtures';

// Evidence for the claims in kebab-case.md. Run with `pnpm bench`. These numbers
// are not a CI gate — microbenchmarks are too noisy to fail a build on — they
// are reproducible evidence, snapshotted into the notes with an environment
// stamp. Correctness is enforced separately by kebab-case.alternatives.test.ts.

function run(fn: (value: string) => string): void {
  for (const input of STRING_INPUTS) {
    fn(input);
  }
}

describe('kebabCase — correct candidates', () => {
  bench('kebabCase (chosen: shared engine, one pass)', () => {
    run(kebabCase);
  });

  bench('delegate to snakeCase, then swap separators', () => {
    run(kebabCaseViaSnake);
  });

  bench('two-pass regex (split and join)', () => {
    run(kebabCaseRegex);
  });
});

describe('kebabCase — reference only (fails parity, never shipped)', () => {
  bench('ASCII only (not Unicode-correct)', () => {
    run(kebabCaseAsciiOnly);
  });
});
