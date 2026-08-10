# Runbooks & Operational Readiness

Operational procedures for the published framework. Written so someone who did not build it
can operate and recover it. Pairs with the [NFRs](non-functional-requirements.md) and the
[conformance report](engineering-standards-conformance.md).

## Service level objectives (lightweight)

This is a static open-data site, so reliability rests on the GitHub Pages CDN, not on code we
run. Indicators we care about, measured from the consumer's side:

- **Availability (SLI):** the three key URLs (`/api/`, `/openapi/openapi.json`,
  `/data/json/manifest.json`) return HTTP 200. **SLO:** 99.9% reachable. Watched by the
  `healthcheck` workflow (`.github/workflows/healthcheck.yml`), which opens an issue on
  failure.
- **Data integrity (SLI):** 100% of relationship links resolve. **SLO:** 100%, enforced as a
  hard CI gate (`tools/validate.mjs`) — a broken reference can never ship.
- **Freshness (SLI):** published data matches Baserow within one refresh cycle.

There is no error budget policy to manage because there is no feature-velocity-vs-reliability
tradeoff to make on a static CDN. If a hosted service launches, it gets a real SLO + error
budget (see [service-design.md](service-design.md)).

## Runbook: refresh the published data from Baserow

When the source data changes in Baserow and the site should be updated.

1. Automated path: the `refresh` workflow runs on a schedule (and can be run manually from the
   Actions tab). It re-syncs, rebuilds every artifact, validates, and commits.
2. Manual path (from a clean local clone, with `BASEROW_TOKEN` set):
   ```bash
   node tools/sync-from-baserow.mjs
   node tools/build-career-transitioning.mjs
   node tools/build-jsonld.mjs
   node tools/build-schemas.mjs
   node tools/build-openapi.mjs
   node tools/build-snapshot.mjs
   node tools/validate.mjs        # must pass before committing
   ```
3. Commit and push. GitHub Pages redeploys automatically (deploy-from-branch).

## Runbook: roll back a bad data push

Symptom: incorrect data went live, or `validate` was bypassed and links are broken.

1. Find the last good commit: `git log --oneline`.
2. Revert it (safe, non-destructive — never force-push `main`):
   ```bash
   git revert <bad-commit-sha>
   git push origin main
   ```
3. Pages redeploys the reverted state within ~1 minute.
4. Consumers who need absolute stability should pin to a release tag (e.g. `v1.0.0`); release
   assets are immutable and unaffected by a bad push to `main`.

## Runbook: the site is down / endpoints return errors

1. Check GitHub Pages status: repo → Settings → Pages, and https://www.githubstatus.com.
2. Check the latest Pages build: `gh api repos/techfleetworks/skills-and-practices-framework/pages/builds/latest`.
3. If a build errored, the last successful deploy is still live; fix the offending commit
   (usually a malformed file) and push, or revert (above).
4. If GitHub Pages itself is down, this is a provider outage — nothing to deploy around;
   communicate status and wait. The data is also available in the repo and release assets.

## Runbook: rotate the Baserow token

The `refresh` workflow uses a `BASEROW_TOKEN` repository secret (Settings → Secrets and
variables → Actions). To rotate: create a new token in Baserow, update the secret, delete the
old token in Baserow. The token is a read/write database token — never commit it to the repo
(the workflow reads it from the secret at run time only).

## Escalation

Maintainer: Tech Fleet (https://techfleet.org). Repo issues:
https://github.com/techfleetworks/skills-and-practices-framework/issues
