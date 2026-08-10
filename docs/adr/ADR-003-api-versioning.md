# ADR-003: API and data versioning strategy

## Status

Accepted (2026-08-10)

## Context

The API contract (dataset shapes and field names) will evolve. Consumers — forks, chatbots,
apps — depend on it. Breaking a contract silently breaks every consumer at once with no
migration window. The enterprise API-design standard requires explicit versioning that
distinguishes additive (backward-compatible) changes from breaking ones.

## Decision

- Every published payload carries a **`version`** field (in `manifest.json` and
  `framework.snapshot.json`), sourced from the dataset. This is the machine-readable version.
- **Additive changes** (a new dataset, a new optional field) do **not** change any URL —
  consumers ignore fields they do not know. These ship continuously.
- **Breaking changes** (renaming/removing a field, changing a field's type or meaning) are
  published under a **new versioned path** (`/v2/...`), with the previous version left in
  place for a deprecation window so existing consumers keep working. Today's data lives at
  the unversioned/`v1` paths.
- Every release is also captured as an **immutable Git tag + GitHub Release** (e.g.
  `v1.0.0`), so any consumer can pin to an exact historical snapshot regardless of what
  "latest" becomes.
- The OpenAPI document is the **single source of truth** for the contract; a CI contract
  check verifies the spec and the published data cannot drift apart.

## Alternatives considered

- **No explicit versioning (mutate in place).** Rejected: a breaking change would break all
  consumers simultaneously with no warning — the exact failure the standard prohibits.
- **Version-bump the path for every change, including additive.** Rejected: fragments the
  API unnecessarily and forces consumers to migrate for changes that do not affect them.

## Consequences

- **Easier:** consumers can rely on additive-only evolution at a stable URL, or pin to a
  release tag for absolute stability. Breaking changes have a defined, non-disruptive path.
- **Harder / accepted:** a breaking change requires maintaining two paths during the
  deprecation window. Deprecation timelines must be communicated in the CHANGELOG.
