import { bench, describe } from 'vitest';

import {
  camelCaseAsciiBitwise,
  camelCaseForOf,
  camelCasePush,
} from './camel-case.alternatives';
import { camelCase } from './camel-case';
import { STRING_INPUTS } from './string.fixtures';

// Evidence for the claims in camel-case.md. Run with `pnpm bench`. These
// numbers are not a CI gate — microbenchmarks are too noisy to fail a build on
// — they are reproducible evidence, snapshotted into the notes with an
// environment stamp. Correctness is enforced separately by
// camel-case.alternatives.test.ts.

function run(fn: (value: string) => string): void {
  for (const input of STRING_INPUTS) {
    fn(input);
  }
}

describe('camelCase — correct candidates', () => {
  bench('camelCase (chosen: indexed, pre-sized array)', () => {
    run(camelCase);
  });

  bench('for...of (code-point iteration, push)', () => {
    run(camelCaseForOf);
  });

  bench('indexed, push (no pre-sized array)', () => {
    run(camelCasePush);
  });
});

describe('camelCase — reference only (fails parity, never shipped)', () => {
  bench('ASCII bitwise (not Unicode-correct)', () => {
    run(camelCaseAsciiBitwise);
  });
});
