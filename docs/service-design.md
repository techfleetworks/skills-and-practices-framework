# Future Hosted Query Service — Design Spec

**Status: not built.** This spec pre-commits the standards the hosted service will meet from
day one, so it is built right rather than retrofitted. It exists because ADR-002 defers the
service but requires it be designed to standard when it comes. The service will be a thin
wrapper around the same query engine as the `@techfleet/spf` library.

## When to build it

Build when there is a real consumer that needs remote querying from a non-JavaScript
environment, or a commercial (open-core) offering: free data + free library, paid managed
API. Not before — a server before that point is unjustified cost and operational burden.

## API design (from `enterprise-architecture-standards` / `api-integration-design`)

- Resources as nouns; correct HTTP status codes (2xx/4xx/5xx), never 200-with-error-body.
- **Structured error responses:** machine-readable code + human message + correlation ID.
  Never a stack trace, internal path, or raw exception. Fail closed on any auth error.
- **Pagination on every list endpoint:** cursor-based, with a sane default and an enforced
  maximum page size (also a DoS control). No unbounded `?limit=`.
- Explicit versioning consistent with [ADR-003](adr/ADR-003-api-versioning.md) (`/v1/…`).
- Idempotency keys for any future write/side-effecting operation.
- The OpenAPI document remains the source of truth; consumer-driven contract tests
  (Pact-style) verify the provider cannot break a documented consumer, wired into CI.

## Security (from `owasp-secure-coding-bdd`)

- **AuthN/Z (paid tier):** API keys or JWT. If JWT: verify signature server-side, whitelist
  the accepted `alg` (reject `alg:none` and RS256→HS256 confusion), validate `exp`/`iss`/`aud`,
  keep access tokens short-lived with revocable refresh tokens.
- **CORS:** free public read endpoints may keep `*` (public data). Any authenticated endpoint
  must allow-list specific origins and never combine `*` with `Access-Control-Allow-Credentials`.
- **Input validation:** allow-list validation of every query parameter (entity name against
  the known set, field names against the schema, operators against an allow-list). Reject
  unexpected `Content-Type`. Parameterize any datastore query — never string-build one.
- **DoS controls:** request-size limits, bounded query cost, and **rate limiting per API key**
  (not just per IP). Timeouts on every downstream call. Reject oversized inputs with 413.
- **Logging:** structured, correlated logs of security-relevant events; never log secrets or
  tokens; sanitize user input before logging (no log injection). Debug mode off in production.
- **Supply chain:** pin and scan dependencies (`npm audit` gate); least-privilege runners;
  pin CI actions to SHAs; secrets from a vault, never in the image or repo; prefer OIDC.
- Read-only service ⇒ **mass assignment and CSRF are N/A** until write endpoints exist.

## Performance (from `performance-scalability`)

- Set a performance budget (p95 < 200 ms) tied to real expected load before choosing
  infrastructure. Measure before optimizing.
- The dataset is tiny and read-mostly: serve queries from an in-memory copy of the graph
  (the same engine), refreshed on a schedule — no per-request database round trip, no N+1.
- Stateless instances behind a load balancer so it scales horizontally; cache responses at
  the CDN where cacheable; connection-pool any datastore with a checkout timeout.

## Operational readiness (from `sre-operational-readiness`)

Before launch, a **Production Readiness Review** must pass:

- [ ] SLIs/SLOs defined (availability, p95 latency, correctness) with an error-budget policy.
- [ ] Four golden signals instrumented (latency, traffic, errors, saturation); metrics, logs
      (correlated by request ID), and traces in place.
- [ ] Symptom-based alerts (SLO burn-rate), each actionable and runbook-linked; no noise pages.
- [ ] `/health` (liveness) and `/ready` (readiness — reflects real dependency state, so the
      load balancer stops sending traffic to an instance that can't serve).
- [ ] Incident severities, roles, comms plan, and a blameless-postmortem template.
- [ ] Runbooks: deploy, roll back, common failure modes, dashboards, escalation.
- [ ] Rollback tested; capacity planned against the load test; on-call defined.

## Release (from `release-deployment-safety`)

- Build once, promote the same immutable artifact through dev → staging → prod with gates.
- Progressive rollout (canary) watching golden signals; automated rollback on error-budget
  burn; every change independently deployable, backward-compatible, observable, and reversible
  within minutes.
- Deployment record (SHA, artifact, actor, time) for incident forensics.

## Reliability (from `resilience-reliability-patterns`)

- Timeouts, retries with backoff+jitter, and a circuit breaker on any outbound dependency.
- Idempotent handlers. Graceful degradation: if the data-refresh source is unavailable, keep
  serving the last-good in-memory snapshot rather than failing.
