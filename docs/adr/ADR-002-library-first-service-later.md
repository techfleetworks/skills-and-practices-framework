# ADR-002: Library first, hosted service later

## Status

Accepted (2026-08-10)

## Context

Consumers need to *query* the framework (filter, search, traverse relationships), not just
download files. Two ways to offer that: an embeddable client library, or a hosted HTTP query
service. The maintainer needs querying for its own custom development now, and may want a
public/commercial API later. The data is small, read-only, and already on a CDN.

## Decision

Build the **query engine as an embeddable TypeScript library** (`@techfleet/spf`) first. It
loads the framework into memory (from a bundled snapshot, a base URL, or the live data) and
provides filtering, search, and relationship traversal, with generated types. A hosted HTTP
service, if built later, will be a **thin wrapper around the same engine**, so the library is
the foundation either way and nothing is throwaway.

## Alternatives considered

- **Hosted query service first.** Rejected for now: it is the deferred "security phase" —
  auth, rate limiting, input validation, monitoring, uptime, hosting cost — none of which is
  justified before there is an external consumer that needs remote querying. The maintainer's
  own apps (TypeScript) are better served by ingesting a copy locally than by depending on
  their own public endpoint's uptime.
- **Both at once.** Rejected: takes on the server/security burden before it is needed.

## Consequences

- **Easier:** the maintainer's custom development is unblocked immediately; the free library
  is the SDK open-source consumers expect; no new infrastructure.
- **Harder / accepted:** non-JavaScript consumers and those wanting always-fresh remote
  queries are not served until the hosted service exists. That is acceptable at current
  scale and is the natural future commercial surface (open-core: free data + free library,
  paid managed API). The service's security, performance, and operational requirements are
  pre-specified in [service-design.md](../service-design.md) so it is built to standard from
  day one.
