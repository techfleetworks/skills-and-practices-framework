// Edge-case coverage: exercises every branch of the engine and loader using small synthetic
// frameworks, so behavior on unusual inputs (string arrays, dangling links, duplicate slugs,
// missing fields, network failures) is pinned down — not just the happy path on real data.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createFramework, loadFramework } from "../dist/index.js";

// A synthetic framework covering every field shape and edge the engine handles.
const synth = createFramework({
  version: "syn",
  data: {
    demo: [
      {
        slug: "d1",
        "Name": "Alpha",
        "Tags": ["red", "blue"], // string array
        "Flag": true, // non-text scalar (collectText no-op)
        "Empty": [], // empty array
        "Nulls": [null], // array whose first item is null
        "Fileish": [{ name: "f", url: "u" }], // object array without a slug
        "Links": [{ slug: "d2", label: "Dee Two" }], // relationship
      },
      {
        slug: "d2",
        "Name": "Beta",
        "Links": [
          { slug: "missing", label: "Gone" }, // dangling link (does not resolve)
          { slug: "d1", label: "Dee One" },
          { slug: "d1", label: "dup" }, // duplicate target (dedupe in neighbors)
        ],
      },
      {}, // record with no slug
      { slug: "d1" }, // duplicate slug (first record wins in the global index)
    ],
  },
});

test("where() matches a scalar field", () => {
  assert.equal(synth.of("demo").where({ Name: "Alpha" }).length, 1);
});

test("where() matches a value inside a string array", () => {
  assert.ok(synth.of("demo").where({ Tags: "red" }).some((r) => r.slug === "d1"));
});

test("where() matches a relationship by slug and by label", () => {
  assert.ok(synth.of("demo").where({ Links: "d2" }).some((r) => r.slug === "d1"));
  assert.ok(synth.of("demo").where({ Links: "Dee One" }).some((r) => r.slug === "d2"));
});

test("search() indexes string arrays, ignores non-text, and returns [] on empty query", () => {
  assert.ok(synth.of("demo").search("blue").some((r) => r.slug === "d1")); // string-array item
  assert.equal(synth.of("demo").search("").length, 0); // empty query short-circuit
});

test("of() returns an empty collection for an unknown dataset", () => {
  assert.equal(synth.of("does-not-exist").size, 0);
});

test("a Collection is iterable", () => {
  assert.equal([...synth.of("demo")].length, synth.of("demo").size);
});

test("neighbors() skips dangling links and de-duplicates targets", () => {
  const d2 = synth.of("demo").get("d2");
  const n = synth.neighbors(d2);
  assert.deepEqual(
    n.map((r) => r.slug),
    ["d1"],
  ); // "missing" skipped, "d1" listed once despite two links
});

test("relations() honors the target-dataset filter and empty/unknown fields", () => {
  const d2 = synth.of("demo").get("d2");
  // Links = [missing, d1, d1]: "missing" is skipped; d1 resolves twice (relations does not
  // de-duplicate — that is neighbors()' job).
  assert.equal(synth.relations(d2, "Links").length, 2);
  assert.equal(synth.relations(d2, "Links", "demo").length, 2); // kept: same entity
  assert.equal(synth.relations(d2, "Links", "other-entity").length, 0); // filtered out
  assert.equal(synth.relations(d2, "NoSuchField").length, 0); // not a relationship field
});

test("backlinks() returns [] for a record nothing points at", () => {
  assert.deepEqual(synth.backlinks({ slug: "nobody", $entity: "demo" }), []);
});

test("lookup() resolves globally and returns undefined for a missing slug", () => {
  assert.equal(synth.lookup("d2")?.slug, "d2");
  assert.equal(synth.lookup("nope"), undefined);
});

// --- loader edge cases ---

test("loadFramework throws when no fetch is available", async () => {
  await assert.rejects(loadFramework({ fetch: {} }), /No fetch available/);
});

test("loadFramework surfaces a non-timeout network error", async () => {
  const failFetch = () => Promise.reject(new Error("boom"));
  await assert.rejects(
    loadFramework({ baseUrl: "https://example.invalid", fetch: failFetch, timeoutMs: 5000 }),
    /Failed to load framework snapshot/,
  );
});

test("loadFramework uses the global fetch and default URL when none are given", async () => {
  const original = globalThis.fetch;
  const snapshot = { version: "global", data: { tools: [{ slug: "t", "Tool Name": "T" }] } };
  globalThis.fetch = (url) => {
    assert.match(url, /techfleetworks\.github\.io.*framework\.snapshot\.json$/);
    return Promise.resolve({ ok: true, status: 200, json: async () => snapshot });
  };
  try {
    const fw = await loadFramework();
    assert.equal(fw.version, "global");
  } finally {
    globalThis.fetch = original;
  }
});

test("loadFramework honors an explicit snapshotUrl", async () => {
  const snapshot = { version: "custom", data: {} };
  let called;
  const stub = (url) => {
    called = url;
    return Promise.resolve({ ok: true, status: 200, json: async () => snapshot });
  };
  const fw = await loadFramework({ snapshotUrl: "https://host/custom.json", fetch: stub });
  assert.equal(called, "https://host/custom.json");
  assert.equal(fw.version, "custom");
});
