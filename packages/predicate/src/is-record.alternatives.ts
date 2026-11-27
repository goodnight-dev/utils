// Rejected isRecord implementations, kept runnable so the benchmark can
// substantiate the claim in `is-record.md` and the parity test can prove which
// ones are actually correct. Repo-only: never re-exported from the barrel,
// never shipped in `dist`. The chosen implementation lives in `is-record.ts`
// and is the single source of truth; these exist only for comparison.

/**
 * Walk the prototype chain to its root and compare, the way lodash's
 * `isPlainObject` does. Correct across the corpus and, unlike the chosen
 * implementation, correct across realms: a plain object from another realm (an
 * iframe, a `vm` context, a worker) has a prototype that is `!==` this realm's
 * `Object.prototype` by identity, but it is still the top of its own chain, so
 * this test accepts it. Rejected for the single-realm Node workload this
 * package targets: it reads the prototype `n + 1` times and loops where the
 * chosen implementation reads it once (see the benchmark in `is-record.md`),
 * and the realm-crossing it buys is rare here. Kept as the benchmarked correct
 * alternative.
 */
export function isRecordWalkProto(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as object | null;
  if (prototype === null) {
    return true;
  }

  let root = prototype;
  let next = Object.getPrototypeOf(root) as object | null;
  while (next !== null) {
    root = next;
    next = Object.getPrototypeOf(root) as object | null;
  }
  return prototype === root;
}

/**
 * The "obvious" guard: a non-null object that is not an array. Disqualified —
 * it is far too loose, reporting `true` for every built-in exotic (`Map`,
 * `Set`, `Date`, …) and every class instance, none of which is a plain record.
 * `is-record.alternatives.test.ts` proves the divergence on `new Date()`. This
 * is the shortcut the chosen implementation deliberately rejects: excluding
 * only arrays is neither sufficient (exotics slip through) nor necessary (the
 * prototype check already excludes arrays). Kept as a cautionary example, never
 * a candidate.
 */
export function isRecordNonArrayObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The classic `Object.prototype.toString` tag check. Disqualified — it answers
 * a different question ("does this stringify as `[object Object]`?") than "is
 * this a plain object?". A class instance with no `Symbol.toStringTag`
 * stringifies as `[object Object]`, so this reports it as a record even though
 * its prototype is not `Object.prototype`; conversely a genuine plain object
 * carrying a `Symbol.toStringTag` is reported as a non-record.
 * `is-record.alternatives.test.ts` proves the divergence on a class instance.
 * Kept as a cautionary example, never a candidate.
 */
export function isRecordToStringTag(value: unknown): boolean {
  return Object.prototype.toString.call(value) === '[object Object]';
}
