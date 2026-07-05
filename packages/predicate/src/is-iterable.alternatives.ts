// Rejected isIterable implementations, kept runnable so the benchmark can
// substantiate the claim in `is-iterable.md` and the parity test can prove
// which ones are actually correct. Repo-only: never re-exported from the
// barrel, never shipped in `dist`. The chosen implementation lives in
// `is-iterable.ts` and is the single source of truth; these exist only for
// comparison.

/**
 * Coerce the value to an object with `Object(...)`, then test membership with
 * the `in` operator. Correct: `Object('hello')` is a `String` wrapper that
 * carries `Symbol.iterator`, while `Object(null)` and `Object(undefined)`
 * become a fresh `{}` that does not — so it agrees with the chosen
 * implementation across the whole corpus. Rejected because it allocates a
 * wrapper object on every primitive call, which the direct property access in
 * `is-iterable.ts` avoids; see the benchmark in `is-iterable.md`.
 */
export function isIterableObjectCoerce(value: unknown): boolean {
  return Symbol.iterator in Object(value);
}

/**
 * The "obvious" guard: narrow to a non-null object first, then use `in`.
 * Disqualified — it silently drops strings (and any other iterable primitive)
 * because `typeof 'hello' === 'string'`, not `'object'`, even though a string
 * satisfies the iterable protocol. `is-iterable.alternatives.test.ts` proves
 * the divergence. Kept as a cautionary example, never a candidate.
 */
export function isIterableTypeofObject(value: unknown): boolean {
  return (
    typeof value === 'object' && value !== null && Symbol.iterator in value
  );
}
