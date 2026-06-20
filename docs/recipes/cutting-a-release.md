# Recipe: cutting a release

Releases are automated with
[Changesets](https://github.com/changesets/changesets) and published to npm via
**Trusted Publishing (OIDC)** with provenance — no stored token. See
[ADR 0001](../adr/0001-versioning-and-commit-conventions.md) for the rationale.

## The normal flow

1. **Every PR that changes a published package includes a changeset.** Run
   `pnpm changeset`, pick the affected package(s) and bump level (`patch` /
   `minor` / `major`), and write a one-line summary. Commit the generated
   `.changeset/*.md` file alongside your change.

2. **Merge your PR(s) to `main`.** The `Release` workflow sees the pending
   changesets and opens (or updates) a **"Version Packages" PR** that bumps each
   affected package's version, regenerates `CHANGELOG.md` files, and bumps the
   umbrella whenever a package it re-exports changed.

3. **Review and merge the "Version Packages" PR.** On merge, the workflow runs
   `changeset publish`, publishing the newly-versioned packages to npm with
   provenance.

In the normal flow you never run `npm publish` by hand.

## One-time setup

### a. Let the workflow open the Version PR

The `Release` workflow opens the "Version Packages" PR with the workflow token,
which GitHub blocks by default. Enable it **once** (both levels, org first):

- **Org:** `https://github.com/organizations/goodnight-dev/settings/actions` →
  _Workflow permissions_ → check **"Allow GitHub Actions to create and approve
  pull requests."**
- **Repo:** _Settings → Actions → General_ → the same checkbox — or
  `gh api --method PUT repos/goodnight-dev/utils/actions/permissions/workflow -F can_approve_pull_request_reviews=true -f default_workflow_permissions=read`.

### b. Bootstrap each new package onto npm

A package can't be "trusted" before it exists, so the **first** publish of each
new package is a one-time manual bootstrap:

```sh
npm login
pnpm --filter @goodnight-dev/<name> publish --access public
```

- Use `pnpm publish` (not `npm publish`) so the `workspace:` protocol in the
  umbrella's dependencies is resolved to real versions.
- This bootstrap has **no provenance** — provenance is generated only by the CI
  release workflow (via `NPM_CONFIG_PROVENANCE` + OIDC). That's expected; the
  bootstrap version just exists to create the package. (Do **not** put
  `provenance: true` in a package's `publishConfig`, or local publishes fail
  with "provider: null".)

### c. Configure the trusted publisher

On npmjs.com, open the package → **Settings → Trusted Publisher** and add:

- Provider: **GitHub Actions**
- Repository: `goodnight-dev/utils`
- Workflow: `release.yml`

From then on, the `Release` workflow publishes that package over OIDC — no token
needed.

## Notes

- Packages version **independently**; a single changeset can target one package
  or several at different bump levels.
- The "Version Packages" PR is created by the workflow's `GITHUB_TOKEN`, so it
  does not itself re-trigger CI (a GitHub safeguard against recursive runs). Its
  contents are mechanical (version + changelog bumps) — review and merge.
- Want to see what a release _would_ include without cutting it? Run
  `pnpm changeset status`.
