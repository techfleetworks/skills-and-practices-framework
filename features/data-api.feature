# Behavioral, security, and reliability scenarios for the framework's data API and query
# library. These are the human-readable specification; each is enforced by an executable test
# (node --test) noted beside it, wired into CI. Tags follow the engineering-standards skills.

Feature: Skills & Practices Framework data API and query library

  # --- Data integrity (compliance-data-lifecycle: migration/invariant checks) ---

  @data-integrity
  Scenario: Every relationship resolves to a real record
    Given the published datasets are loaded
    When every relationship link is checked against the set of all record slugs
    Then every link resolves to an existing record
    # enforced by: tools/validate.mjs (CI gate) and library/test/query.test.mjs

  @data-integrity
  Scenario: The OpenAPI contract matches the published data
    Given the OpenAPI document and the manifest
    When each is compared to the other
    Then every dataset has a documented endpoint and no endpoint is orphaned
    And the snapshot contains every dataset with matching record counts
    # enforced by: library/test/contract.test.mjs

  # --- Security (owasp-secure-coding-bdd: injection, DoS) ---

  @security
  Scenario Outline: Injection-style input is treated as literal text
    Given the query library is loaded
    When a caller searches for "<payload>"
    Then the search executes as a plain text match, not a query or interpreter statement
    And a normal (possibly empty) result set is returned with no error or side effect

    Examples:
      | payload                 |
      | ' OR '1'='1             |
      | '; DROP TABLE users; -- |
      | {"$ne": null}           |
      | <script>alert(1)</script> |
    # enforced by: library/test/security.test.mjs

  @security
  Scenario: Text search is not vulnerable to catastrophic-backtracking (ReDoS)
    Given the query library is loaded
    When a caller searches with a catastrophic-backtracking pattern
    Then the search returns quickly because it matches literally, using no regex engine
    # enforced by: library/test/security.test.mjs

  @security
  Scenario: Public data is served with an open CORS policy, by design
    Given the data is classified public and non-personal (ADR-004) and requires no authentication
    When any origin requests a dataset file
    Then Access-Control-Allow-Origin is "*"
    # rationale: docs/adr/ADR-004; the "no wildcard CORS" rule applies to authenticated endpoints

  # --- Reliability (enterprise-architecture-standards: timeouts) ---

  @reliability
  Scenario: A hung network load is aborted within a bounded timeout
    Given the query library is loading from a remote endpoint
    When the endpoint does not respond within the configured timeout
    Then the load is aborted and a clear timeout error is raised
    # enforced by: library/test/security.test.mjs

  @reliability
  Scenario: A bundled snapshot loads with no network I/O
    Given a caller provides an in-memory snapshot
    When the framework is loaded
    Then no network request is made
    # enforced by: library/test/security.test.mjs
