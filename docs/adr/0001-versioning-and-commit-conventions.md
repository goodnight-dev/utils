# 1. Versioning and commit conventions

- **Status:** Accepted
- **Date:** 2026-06-18

## Context

`@goodnight-dev/utils` is a pnpm monorepo of small, independently published
packages (`@goodnight-dev/string`, `@goodnight-dev/array`, …) plus an umbrella
package (`@goodnight-dev/utils`) that re-exports them. We need:

1. a way to assign **per-package, independent semantic versions**, and
2. a **commit-message convention** for a clean, legible history.

A natural temptation is to let Conventional Commits _drive_ the versions
automatically. The question is whether that actually fits a monorepo with
independent per-package versioning.

## Decision

1. **Changesets is the single source of truth for versioning.** Every change
   that affects a published package includes a changeset declaring the affected
   package(s) and the bump level. Packages version independently (`fixed` and
   `linked` are empty in `.changeset/config.json`). The umbrella is auto-bumped
   when a package it re-exports changes (`updateInternalDependencies: "patch"`).

2. **Conventional Commits are enforced for history hygiene only — not for
   versioning.** `commitlint` (with `@commitlint/config-conventional`) runs on
   the `commit-msg` git hook via `lefthook`. The commit _type_ (`feat`, `fix`,
   …) documents intent in the log; it does **not** compute version numbers.

## Alternatives considered

- **release-please (commit-driven, monorepo manifest mode).** Infers each
  package's bump from Conventional Commits scoped to that package by changed
  file paths, and opens per-package release PRs. Rejected as the _primary_
  mechanism: the per-package bump intent has to be _inferred_ from file paths,
  which is fragile for cross-cutting commits or shared files, and it surrenders
  explicit author control over per-package bumps.

- **semantic-release (+ multi-semantic-release / semantic-release-monorepo).**
  semantic-release is fundamentally single-package; monorepo support is bolted
  on. Rejected as more brittle than Changesets here.

- **Manual version edits.** Error-prone and no changelog automation. Rejected.

## Consequences

- Explicit, reviewable, per-package version bumps; independent versioning "just
  works", and the umbrella is kept in sync automatically.
- Conventional Commits still give a clean history and keep the door open to
  commit-based tooling later, without being load-bearing for releases.
- Intent is expressed in two places (the commit _and_ the changeset). This
  redundancy is the accepted cost of clean per-package versioning.
- CI should run `changeset status` on pull requests to remind contributors to
  include a changeset, and use the Changesets GitHub Action to open the "Version
  Packages" PR and publish on merge (with npm provenance). _Deferred to the CI
  bootstrap step._
