# ADR-004: Data classification — public, non-personal

## Status

Accepted (2026-08-10)

## Context

The compliance and data-lifecycle standard requires classifying data before applying
controls, because classification drives every downstream decision (encryption, access,
logging, retention, privacy rights). We must state what this data is — and honestly scope
out controls that do not apply — rather than apply privacy theater.

## Decision

Classify the entire published dataset as **PUBLIC** and **NON-PERSONAL**. It is an ontology
of skills, practices, duties, roles, deliverables, workshops, methodologies, and career
paths. It contains **no personal data** (no names, contacts, identifiers, user records, or
any information about identifiable individuals). It is licensed CC BY 4.0 for anyone to use.

## Consequences

- **Applicable controls:** integrity (every relationship must resolve — enforced by
  `tools/validate.mjs` in CI), versioning and retention of published snapshots (ADR-003),
  supply-chain integrity of build/runtime dependencies, and safe/recoverable changes to the
  source of truth (Baserow) with an export/backup cadence.
- **Legitimately NOT applicable (documented, not overlooked):** GDPR/CCPA data-subject
  rights (access, deletion/"right to be forgotten", correction, portability, restriction),
  consent management, PII/PHI handling, data residency/cross-border transfer rules, and
  tamper-evident PII audit logging. There is no personal data for any of these to act on.
- **If this ever changes** (e.g. a future feature ingests contributor accounts or user data),
  this ADR must be superseded and the privacy controls in `compliance-data-lifecycle`
  applied to that data. The public/non-personal classification applies only to the framework
  ontology itself.
