# Engineering Standards Conformance

How the framework's data products (the open-data repository, the `@techfleet/spf` query
library, and the future hosted service) conform to the six engineering standards the project
adopts. Status values: **Met**, **Met by design** (the architecture makes it true), **Planned
(service)** (pre-specified for the future hosted service in
[service-design.md](service-design.md)), **N/A** (does not apply, with reason).

Scope note: the published data is classified **public / non-personal**
([ADR-004](adr/ADR-004-data-classification.md)), which legitimately removes the personal-data
controls. Everything is right-sized — the standards forbid over-engineering, so there is no
message bus, microservice, or chaos suite for a static open-data site.

## 1. enterprise-architecture-standards

| Requirement | Status | Evidence |
|---|---|---|
| Architecture decisions explicit, with alternatives/tradeoffs | Met | [ADRs 001–004](adr/) |
| Right-sized (no over-engineering) | Met | Static-site + client-library style, stated in ADR-001 |
| API design: nouns, status codes, versioning, contract-first | Met / Planned (service) | OpenAPI 3.1 is the contract; versioning in [ADR-003](adr/ADR-003-api-versioning.md); structured errors + pagination specified for the service |
| Performance: measure, budget, caching, no N+1 | Met by design | Tiny in-memory dataset served via CDN; one-request load; lazy search index; budgets in [NFRs](non-functional-requirements.md) |
| Resilience: timeouts on outbound calls | Met | `loadFramework` fetch timeout (default 15 s) |
| Coding principles (SOLID/KISS/YAGNI) | Met | Dependency-free engine; single responsibility per module |
| NFRs explicit and measurable | Met | [non-functional-requirements.md](non-functional-requirements.md) |
| Governance: ADRs, definition of done | Met | This report + ADRs; DoD checklist below |

## 2. owasp-secure-coding-bdd

| Requirement | Status | Evidence |
|---|---|---|
| Injection / input validation | Met by design | Engine builds no query strings; `where`/`search` are in-memory comparisons — no injection surface. Verified by `@security` tests |
| DoS: ReDoS, resource limits | Met by design | Search uses `String.includes`, no regex on user input (ReDoS test); fetch timeout; snapshot size budget |
| Supply chain: pin + scan deps, SRI on CDN scripts | Met | Scalar engine **self-hosted** (`api/scalar.js`, pinned 1.64.1) — no third-party CDN script; `npm audit` gate in CI; library has zero runtime deps; CI actions pinned to SHAs |
| CORS | Met by design | `*` is correct for public, unauthenticated, non-personal data ([ADR-004](adr/ADR-004-data-classification.md)); allow-list rule applies to the future authenticated service |
| Error handling: no stack traces, fail closed | Planned (service) | [service-design.md](service-design.md) |
| AuthN/Z (JWT best practices), rate limiting | Planned (service) | [service-design.md](service-design.md) |
| `@security` BDD scenarios wired into CI | Met | [features/data-api.feature](../features/data-api.feature) + `library/test/security.test.mjs` in CI |
| Lockout / accidental-deletion safety check | N/A | No permission/credential/deletion changes in this work; the refresh workflow only reads Baserow and commits data |
| Mass assignment, CSRF, SAML/OAuth | N/A | Read-only, no cookie auth, no federated login (until the service adds them) |

## 3. comprehensive-test-strategy

| Requirement | Status | Evidence |
|---|---|---|
| Test pyramid (unit-heavy) | Met | `library/test/*` — 24 fast tests, no e2e ice-cream-cone |
| Contract testing | Met | `library/test/contract.test.mjs`: OpenAPI ↔ manifest ↔ snapshot cannot drift; CI also fails on stale generated artifacts |
| Coverage quality gate | Met | c8 gate (lines/statements 80, functions 80, branches 70); currently ~97% lines / 100% functions |
| Property/edge coverage | Met by design | Contract test iterates all datasets; integrity test checks all ~29k links |
| Load / performance / chaos | N/A (static) / Planned (service) | A CDN file has no app tier to load-test; deferred to the service with justification |
| Flaky-test hygiene | Met | Deterministic `node --test`; no known flaky tests |

## 4. release-deployment-safety

| Requirement | Status | Evidence |
|---|---|---|
| Automated pipeline, gates | Met | [ci.yml](../.github/workflows/ci.yml): validate → contract → build → test/coverage → audit |
| Backward compatibility / versioning | Met | [ADR-003](adr/ADR-003-api-versioning.md): additive-only at stable paths; breaking changes get a new path; immutable release tags |
| Reversible releases, rollback path | Met | `git revert` + immutable release assets; [runbook](runbooks.md) |
| Build-once / deployment record | Met | Library published as one artifact (`prepublishOnly` build); Git history + GitHub Releases are the deployment record |
| Secrets from a store, never in repo | Met | `BASEROW_TOKEN` is a repo secret used only at run time ([refresh.yml](../.github/workflows/refresh.yml)) |
| CI supply-chain (pinned actions, least privilege) | Met | Actions pinned to SHAs; `permissions:` scoped per workflow |
| Progressive rollout / feature flags / canary | N/A (static) / Planned (service) | Not meaningful for static files; specified for the service |
| Zero-downtime DB migrations | N/A | No live database in the open-data layer |

## 5. sre-operational-readiness

| Requirement | Status | Evidence |
|---|---|---|
| SLIs/SLOs defined | Met (lightweight) | Availability + integrity + freshness SLOs in [runbooks.md](runbooks.md) and [NFRs](non-functional-requirements.md) |
| Availability monitoring / alerting | Met | [healthcheck.yml](../.github/workflows/healthcheck.yml) checks endpoints every 6 h and opens an issue on failure |
| Runbooks | Met | [runbooks.md](runbooks.md): refresh, rollback, site-down, token rotation |
| Golden signals, health/readiness, on-call, PRR | Planned (service) | Full SRE posture + Production Readiness Review specified in [service-design.md](service-design.md) |
| Error budget policy | N/A (static) | No feature-velocity-vs-reliability tradeoff on a static CDN; applies to the service |

## 6. compliance-data-lifecycle

| Requirement | Status | Evidence |
|---|---|---|
| Data classification | Met | [ADR-004](adr/ADR-004-data-classification.md): public / non-personal |
| Data integrity on change (invariants) | Met | `tools/validate.mjs` gate: every relationship resolves; contract test guards counts/version |
| Retention & versioning of data | Met | Immutable release tags + `version` field ([ADR-003](adr/ADR-003-api-versioning.md)) |
| Source backup & restore | Met (documented) | Baserow is the source of truth; export/backup + rollback in [runbooks.md](runbooks.md) |
| GDPR/CCPA rights, consent, PII audit logging, residency | N/A | No personal data — see ADR-004. To be applied only if a future feature ingests personal data |

## Definition of Done (governance synthesis)

- [x] Meets the functional requirement (queryable framework data)
- [x] Behavioral + `@security` + `@reliability` scenarios exist and run in CI ([feature file](../features/data-api.feature) enforced by executable tests)
- [x] Threat-modeling pass done for the real attack surface; lockout check N/A (no perms/deletion)
- [x] Fits the documented architecture (ADRs), or deviations are documented ADRs
- [x] Meets stated NFRs (or tradeoffs documented)
- [x] Observable in production (healthcheck + runbooks) to the extent a static site allows
- [x] Documented for others to operate and extend (READMEs, ADRs, runbooks, service spec)
- [x] Runs in CI as automated gates, not manual checklist items

## Known residuals (honest tracking)

- **Gherkin execution:** scenarios live in a `.feature` file and are enforced by mirrored
  `node --test` cases rather than a full Cucumber runner — deliberate, to avoid a heavy
  dependency; the scenarios still run and gate CI.
- **`npm audit` scope:** includes dev dependencies (runtime deps are zero); a high-severity
  advisory in a build-only tool would block CI, which is acceptable.
- **Action pinning:** pinned to the `v4` major tag's current commit SHA; could pin to an exact
  patch release for even tighter control.
- **Service tier:** all "Planned (service)" items are specified, not implemented, because the
  hosted service is intentionally deferred ([ADR-002](adr/ADR-002-library-first-service-later.md)).
