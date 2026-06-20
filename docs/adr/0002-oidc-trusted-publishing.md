# 2. OIDC trusted publishing via a custom publish step

- **Status:** Accepted
- **Date:** 2026-06-20

## Context

Packages publish to npm from CI (the `Release` workflow). We want **npm OIDC
trusted publishing** — no long-lived npm token stored as a secret, with
provenance attestations — which is npm's recommended approach for CI/CD.

The standard Changesets flow uses `changesets/action` with a `publish:` command
of `changeset publish`. That works with a stored `NPM_TOKEN`, but
**`changeset publish` does not drive npm's OIDC trusted-publishing handshake.**
Observed on this repo: with npm 11.17 (well past the 11.5.1 that added OIDC
trusted publishing), `id-token: write`, a configured trusted publisher, and no
token, `changeset publish` still fails with `ENEEDAUTH`. `changesets/action`
even logs "No NPM_TOKEN found, but OIDC is available - using npm trusted
publishing", yet the underlying publish never completes the OIDC exchange.

A second constraint: this is a pnpm workspace, so the umbrella package's
dependencies use the `workspace:` protocol, which `npm publish` cannot resolve —
only `pnpm pack` / `pnpm publish` rewrite it to real versions.

## Decision

Keep `changesets/action` for **versioning only** (the "Version Packages" PR),
and do the **publish** in
[`scripts/release-publish.mjs`](../../scripts/release-publish.mjs).

For each public workspace package whose version is not yet on npm, in dependency
order:

1. `pnpm pack` the package — resolves the `workspace:` protocol into real
   versions in the packed manifest.
2. `npm publish <tarball> --provenance` — plain `npm publish` **does** perform
   the OIDC trusted-publishing handshake and attach provenance.
3. Tag the published version (`name@version`).

The workflow's `publish:` command points at this script (via the `release` npm
script).

## Alternatives considered

- **`changeset publish` + OIDC.** The intended path, but it does not work today
  (see Context). Revisit if/when Changesets adds OIDC support — at which point
  this script can be deleted in favor of `changeset publish`.
- **`NPM_TOKEN` secret + `changeset publish`.** Reliable, standard, and keeps
  provenance, but stores a long-lived token (which npm explicitly discourages
  for CI), and a granular token expires and becomes future breakage. Rejected in
  favor of storing no secret.
- **`pnpm publish` in CI.** Resolves `workspace:`, but does not (as of pnpm 10)
  perform npm's OIDC trusted-publishing handshake.

## Consequences

- No npm token stored anywhere; CI authenticates per-publish via OIDC, with
  provenance — npm's recommended posture.
- `pnpm pack` correctly resolves the umbrella's `workspace:` dependencies.
- We maintain a small publish script instead of one `changeset publish` call,
  reproducing its "publish changed packages + tag" behaviour (it does not create
  GitHub Releases; git tags are created).
- When Changesets supports OIDC, delete the script and revert `release` to
  `changeset publish`.
