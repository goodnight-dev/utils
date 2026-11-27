import { describe, expect, it } from 'vitest';

import {
  isRecordNonArrayObject,
  isRecordToStringTag,
  isRecordWalkProto,
} from './is-record.alternatives';
import { isRecord } from './is-record';
import { RECORD_INPUTS } from './predicate.fixtures';

// Correctness is the gate, speed is the table. The chosen implementation is the
// oracle: an alternative only earns a place in the benchmark if it produces
// identical output across the whole corpus. This also keeps the checked-in
// alternatives from silently bit-rotting.
describe('isRecord alternatives', () => {
  const correct = { isRecordWalkProto };

  for (const [name, fn] of Object.entries(correct)) {
    it(`${name} matches isRecord across the corpus`, () => {
      // Label by index: the corpus holds a null-prototype object, which has no
      // `toString`, so stringifying it for the message would throw.
      RECORD_INPUTS.forEach((input, index) => {
        expect(fn(input), `input #${String(index)}`).toBe(isRecord(input));
      });
    });
  }

  it('isRecordNonArrayObject is disqualified — it admits exotic objects', () => {
    // A non-null object that is not an array covers every built-in exotic too,
    // so it reports `new Date()` (and `Map`, `Set`, …) as a record even though
    // none is a plain object. Benchmarked/documented for reference only.
    expect(isRecordNonArrayObject(new Date())).not.toBe(isRecord(new Date()));
  });

  it('isRecordToStringTag is disqualified — it admits class instances', () => {
    // A class instance with no `Symbol.toStringTag` still stringifies as
    // `[object Object]`, so the tag check reports it as a record even though
    // its prototype is not `Object.prototype`. Never a shippable candidate.
    const instance = new (class Example {
      value = 1;
    })();
    expect(isRecordToStringTag(instance)).not.toBe(isRecord(instance));
  });
});
