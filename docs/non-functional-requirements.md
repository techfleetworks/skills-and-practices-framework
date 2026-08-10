# Non-Functional Requirements (NFRs)

Explicit, measurable targets for the framework's data products. These are real requirements,
weighed alongside functional ones. "Fast" and "scalable" are not requirements; the numbers
below are.

## Published data API (static, on GitHub Pages)

| Property | Target |
|---|---|
| Availability | Rely on GitHub Pages CDN SLA; target 99.9% reachability of the published endpoints |
| Latency | p95 time-to-first-byte < 200 ms for a dataset file from the CDN edge |
| Snapshot size | `framework.snapshot.json` stays under 5 MB (currently ~1–3 MB) so a one-request load is cheap |
| Data integrity | 100% of relationship links resolve to an existing record (enforced by `tools/validate.mjs` as a CI gate; build fails otherwise) |
| Freshness | Published data reflects the source (Baserow) within one scheduled refresh cycle (default: daily) or on demand |
| CORS | `Access-Control-Allow-Origin: *` (safe: public, unauthenticated, non-personal data) |

## Query library (`@techfleet/spf`)

| Property | Target |
|---|---|
| Load time | Full graph (~1,100 records) hydrates in < 50 ms in Node after the snapshot is in memory |
| Network | Exactly one request to load (the combined snapshot); a bounded fetch timeout (default 15 s) so a hung endpoint never stalls a caller |
| Runtime deps | Zero (reduces supply-chain surface); browser + Node (Node ≥ 18) |
| Query cost | Filter/search over the full dataset is a single in-memory pass; search builds its text index once and reuses it |
| Types | Every known dataset has generated field types; the build fails on a type error |
| Test coverage | ≥ 80% line coverage on the library, enforced in CI |

## Future hosted query service (not yet built — targets to design to)

| Property | Target |
|---|---|
| Latency | p95 < 200 ms per query under expected load |
| Throughput | Define against real expected traffic before launch; load-test to it |
| Availability | Define an SLO (e.g. 99.9%) with an error budget before launch (see [service-design.md](service-design.md)) |
| Pagination | Every list response paginated with a sane default and enforced maximum page size |
| Abuse control | Rate limiting per API key; request-size limits; bounded query cost |

## Growth horizon

Designed for the framework's current and near-term scale (thousands of records, growing as
new fields and career paths are added). It is explicitly **not** pre-built for a scale it
does not have — no sharding, message bus, or service mesh. Revisit these NFRs if the dataset
grows by an order of magnitude or a hosted service takes real traffic.
