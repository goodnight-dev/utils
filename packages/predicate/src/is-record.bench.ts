import { bench, describe } from 'vitest';

import { isRecordWalkProto } from './is-record.alternatives';
import { isRecord } from './is-record';
import { RECORD_INPUTS } from './predicate.fixtures';

// Evidence for the claim in is-record.md. Run with `pnpm bench`. Not a CI gate —
// microbenchmarks are too noisy — just reproducible evidence, snapshotted into
// the notes with an environment stamp. Correctness is enforced separately by
// is-record.alternatives.test.ts.

function run(fn: (value: unknown) => boolean): void {
  for (const input of RECORD_INPUTS) {
    fn(input);
  }
}

describe('isRecord', () => {
  bench('isRecord (chosen)', () => {
    run(isRecord);
  });

  bench('walk the prototype chain to its root', () => {
    run(isRecordWalkProto);
  });
});
