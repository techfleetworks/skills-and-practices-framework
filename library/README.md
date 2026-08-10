# @techfleet/spf

The query library for **The Skills & Practices Framework** open data. It loads the framework
into memory and lets you filter, search, and walk the relationships between skills, practices,
roles, deliverables, workshops, and more — with full TypeScript types for every field.

It runs anywhere JavaScript runs (browser and Node), has no runtime dependencies, and works
against a bundled snapshot, your own copy, or the live published data.

> The same query engine is designed to be wrapped by a hosted API service later. The library is
> the foundation; nothing here is throwaway.

## Install

```bash
npm install @techfleet/spf
```

## Quick start

```ts
import { loadFramework } from "@techfleet/spf";

// With no arguments, loads the official published snapshot in one request.
const spf = await loadFramework();

// A dataset, by name (known datasets are fully typed).
const skills = spf.of("skills");
skills.size;                       // 115
skills.get("interviewing");        // one record, by slug

// Filter by any field. Values match links, string arrays, or scalars.
spf.of("skills").where({ "Data Type": "Interpersonal" });

// Filter with a function when you need more.
spf.of("deliverables").where((d) => Array.isArray(d["Required Skills"]));

// Full-text search across a dataset.
spf.of("workshops").search("retrospective");

// Walk relationships. Resolution is global-by-slug, exactly as the framework validates.
const roadmap = spf.of("deliverables").get("product-roadmap");
spf.relations(roadmap, "Required Skills");   // the skills this deliverable needs
spf.neighbors(roadmap);                       // everything it points at
spf.backlinks(roadmap);                       // everything that points at it
```

## Loading options

`loadFramework(options)` decides where the data comes from:

```ts
// 1. Bundled snapshot — no network at all. Vendor a copy of framework.snapshot.json into your
//    app (the code package ships no data, so the CC BY data stays separate from Apache code).
import snapshot from "./data/framework.snapshot.json";
const spf = await loadFramework({ snapshot });

// 2. Your own published copy.
const spf = await loadFramework({ baseUrl: "https://data.example.org/spf" });

// 3. The official live data (the default) — fetches framework.snapshot.json in one request.
const spf = await loadFramework();
```

The snapshot file is published at
`https://techfleetworks.github.io/skills-and-practices-framework/data/json/framework.snapshot.json`.

In Node, you can also load straight from a local `data/json` directory:

```ts
import { fromDirectory } from "@techfleet/spf/node";
const spf = await fromDirectory("./data/json");
```

## How to use it in an app (the important part)

This is slow-moving reference data, so **do not fetch it on every user interaction.** Load a
copy once and serve every request from it. Two good patterns:

- **Bundle a snapshot at build time** and query it in memory with this library. Best when the
  app only displays framework data. Refresh by bumping the snapshot and redeploying.
- **Sync the snapshot into your own database** on a schedule, and query your database. Best when
  you need to join framework data with your own user data or query at scale.

Either way the flow is the same: pull once per release or schedule, keep your own copy, serve
all users from it. The data changes when you refresh it, not when a user clicks.

## API

- `loadFramework(options?)` → `Promise<Framework>` — load from a snapshot, a base URL, or the
  official data.
- `createFramework(snapshot)` → `Framework` — build synchronously from a snapshot you already have.
- `fromDirectory(dir)` (from `@techfleet/spf/node`) → `Promise<Framework>` — load a local `data/json`.

**`Framework`**
- `version` — the snapshot version.
- `entities` — the names of every loaded dataset.
- `of(name)` — a `Collection` for a dataset (typed for known datasets).
- `lookup(slug)` — resolve any slug to its record, globally.
- `relations(record, field, as?)` — resolve one relationship field to records (optionally kept to one dataset).
- `neighbors(record)` — every record this record points at.
- `backlinks(record)` — every record that points at this record.

**`Collection<T>`**
- `size`, `all()`, `get(slug)`, `where(fieldMap | predicate)`, `search(text)`, and it is iterable.

## Types

Every known dataset has a generated interface with the framework's own field names, so your
editor autocompletes `"Skill Name"`, `"Required Skills"`, and the rest. The types are generated
from the framework's JSON Schemas by `tools/build-types.mjs`.

## License

Apache-2.0 (code). The framework **data** is licensed CC BY 4.0 — credit Tech Fleet. See the
repository for details.
