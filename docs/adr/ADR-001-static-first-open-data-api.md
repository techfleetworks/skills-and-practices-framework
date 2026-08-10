# ADR-001: Static-first open-data API

## Status

Accepted (2026-08-10)

## Context

The Skills & Practices Framework publishes a small (~1,100 records, a few MB), read-only,
slow-moving reference dataset for public consumption. Consumers include people forking the
data, chatbots and AI agents, narrative/relationship tools, and applications building on it.
The maintainer is a nonprofit that must keep running cost and operational burden low, and
wants to own its infrastructure rather than depend on a proprietary platform.

## Decision

Publish the framework as **static JSON files served by GitHub Pages** (a CDN), described by
a standard OpenAPI 3.1 document and browsable through a self-hosted Scalar docs site. There
is no application server, no database, and no authentication in the published data layer.
Every dataset is a file; every "endpoint" is a `GET` of that file. A single combined
`framework.snapshot.json` lets a consumer load everything in one request.

## Alternatives considered

- **A dynamic API server over a database (from day one).** Rejected for now: it adds
  hosting cost, an operational and security surface (rate limiting, input validation,
  monitoring, uptime), and ongoing maintenance that the current scale and access pattern do
  not justify. The data is tiny and read-only, so a server would mostly be serving what a CDN
  serves for free. See ADR-002 for the sequencing.
- **A managed data-platform / API SaaS.** Rejected: reintroduces vendor lock-in the project
  deliberately avoids, and costs money for capabilities a static site already provides.

## Consequences

- **Easier:** zero hosting cost, high availability via CDN, trivial scaling, no server to
  secure or patch, fully owned by the maintainer, permissive CORS (`*`) is safe because the
  data is public and unauthenticated.
- **Harder:** no server-side querying — consumers fetch datasets and query them client-side
  (this is what the `@techfleet/spf` library is for) or ingest a copy into their own store.
  No per-request filtering over the wire; that is a deliberate, documented tradeoff and the
  reason the query library exists.
- This is a **static-site / client-library architecture style**, explicitly *not*
  microservices. Simplicity that meets the actual requirement is the design goal, not a
  shortcut around one.
