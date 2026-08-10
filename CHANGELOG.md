# Changelog

This is the plain-language history of the Skills & Practices Framework. The newest
changes are at the top. When something is added, changed, or fixed in the data or the
docs, it gets written here so anyone can see how the framework has grown over time.

## How the version numbers work

Versions look like **1.2.3**. Reading left to right:

- The **first number** changes when we make a big change that could break how people
  already use the data (for example, renaming a field everyone depends on).
- The **second number** changes when we add something new without breaking anything
  (for example, a new set of workshops).
- The **third number** changes for small fixes (for example, correcting a typo or a
  broken link).

So a jump from 1.2.3 to 1.3.0 means "new stuff, safe to update," and a jump to 2.0.0
means "read the notes before you update."

---

## Unreleased

**Added**
- The career-change layer: eight "Transitioning Into" fields (UX Research, UX Design, UX
  Writing, Business Analysis, Product Ownership, Product Management, Agile Coaching, Software
  Engineering) as per-field files under `data/json/career-transitioning/`. Each row carries a
  unique Gaps summary and Training path for that source-to-target move, and each field carries
  one role-level "A Day in the Life", all grounded in the role's Responsible, Accountable, and
  Consulted work. Built by `tools/build-career-transitioning.mjs`, authored via
  `tools/populate-career-transitioning.mjs`, with a structure doc at
  `docs/data-types/transitioning-into-a-field.md`.
- The three Tech Fleet handbooks (Agile, Teammate, Project Success) pulled from GitBook as
  Markdown into `data/handbooks/` (168 pages), synced by `tools/extract-handbooks.mjs`.
- A mind map (SVG) for each of the 15 data types in `data/visualizations/`, showing the data
  type at the center and its two-way relationship to every other data type, generated from
  the data by `tools/build-mindmaps.mjs`.
- A machine-readable schema layer that keeps our own names: `schema/context.jsonld` maps every
  field name and type to schema.org, SKOS, or our `spf:` namespace; `data/jsonld/` is the
  JSON-LD view (our exact field names as keys); `schema/framework-data/*.schema.json` is a JSON
  Schema per entity; and `tools/validate.mjs` fails the build if any relationship points at a
  row that does not exist. Built by `tools/build-jsonld.mjs` and `tools/build-schemas.mjs`.
- `project-phases` added as a data entity (the milestone-to-phase links now resolve).
- A documented API: `openapi/openapi.json` describes every dataset as a standard OpenAPI 3.1
  contract (generated from the manifest by `tools/build-openapi.mjs`, so it always matches the
  data), and `api/index.html` renders it as a browsable docs website using Scalar (free and open
  source), with a live "Try it" against the real files. A `.nojekyll` marker lets GitHub Pages
  serve the JSON and docs as-is.

**Changed**
- Grouped the framework's data forms under `data/`: `data/json` (structured data),
  `data/handbooks` (long-form prose), and `data/visualizations` (mind maps). The handbooks
  and visualizations are the same framework data in other forms, so they live with the JSON.
  Documentation about the framework (the per-type READMEs) stays in `docs/data-types/`.
- Normalized `data/json` to product-grade: dropped 46 Baserow lookup/duplicate columns,
  converted lookup fields to clean, deduplicated `{slug, label}` relationships, and renamed
  the mislabeled `UX Design Deliverables copy` to `UX Design Deliverables` (no data lost).
  The cleaning rules live in `tools/sync-from-baserow.mjs`, so every future export stays clean.
- Split `data/json` into `data/json/framework-data/` (the core entities) and
  `data/json/career-transitioning/` (the eight career-change fields), with the manifest at the
  `data/json/` root, so the dataset can grow cleanly.
- Refreshed the workshops data (Steps to Complete and Expected Outcomes) from Baserow.

## v0.1.0 — 2026-08-10

The first milestone: the framework's data and docs, in a public repo. This is an early
pre-release, not the public launch (that will be v1.0.0).

**Added**
- The repository structure, licensing (CC BY 4.0 for the data, Apache-2.0 for the code),
  and a contribution guide.
- The full data layer: 20 data files exported from the framework's database, covering the
  15 data types plus workshop steps, workshop template sections, and the hand-off
  deliverables map. Every row has a stable slug and human-readable labels on every
  relationship.
- A plain-language README for each of the 15 data types.
- This changelog.

**Coming next**
- The three Tech Fleet handbooks (Agile, Teammate, Project Success) pulled in as Markdown.
- A cleanup pass on the data and a schema that checks every relationship points somewhere real.
- A documented API and a docs website anyone can browse.
- A one-click way to refresh the published data whenever the database changes.

---

*Versions below 1.0.0 are early pre-releases. Version 1.0.0 will mark the public launch.*
