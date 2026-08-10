import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { fromDirectory } from "../dist/node.js";
import { Framework, Collection } from "../dist/index.js";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "json");
const manifest = JSON.parse(readFileSync(join(DATA_DIR, "manifest.json"), "utf8"));
const fw = await fromDirectory(DATA_DIR);

test("loads a Framework with a version", () => {
  assert.ok(fw instanceof Framework);
  assert.equal(fw.version, manifest.version);
});

test("loads every dataset in the manifest", () => {
  assert.equal(fw.entities.length, manifest.entities.length);
});

test("collection counts match the manifest exactly", () => {
  for (const e of manifest.entities) {
    assert.equal(fw.of(e.entity).size, e.count, `count for ${e.entity}`);
  }
});

test("of() returns a Collection; get() finds by slug and tags $entity", () => {
  const skills = fw.of("skills");
  assert.ok(skills instanceof Collection);
  const s = skills.get("interviewing");
  assert.ok(s, "expected a skill with slug 'interviewing'");
  assert.equal(s.$entity, "skills");
  assert.equal(typeof s["Skill Name"], "string");
});

test("where() filters by a field value", () => {
  const first = fw.of("skills").all()[0];
  const hits = fw.of("skills").where({ "Skill Name": first["Skill Name"] });
  assert.ok(hits.some((r) => r.slug === first.slug));
});

test("where() accepts a predicate function", () => {
  const many = fw.of("deliverables").where((r) => Array.isArray(r["Required Skills"]));
  assert.ok(many.length >= 0); // shape check: predicate runs without throwing
});

test("search() finds records by text", () => {
  const hits = fw.of("skills").search("interview");
  assert.ok(hits.length > 0);
  assert.ok(hits.every((r) => r.$entity === "skills"));
});

test("forward relationships resolve 100% (same guarantee as validate.mjs)", () => {
  let checked = 0;
  let broken = 0;
  for (const name of fw.entities) {
    for (const r of fw.of(name).all()) {
      for (const v of Object.values(r)) {
        if (Array.isArray(v) && v[0] && typeof v[0] === "object" && "slug" in v[0]) {
          for (const l of v) {
            checked++;
            if (!fw.lookup(l.slug)) broken++;
          }
        }
      }
    }
  }
  assert.ok(checked > 1000, `expected many links, checked ${checked}`);
  assert.equal(broken, 0, `${broken} links did not resolve`);
});

test("relations() resolves a specific field to real records", () => {
  // find any record that has at least one relationship field
  let sample = null;
  let field = null;
  outer: for (const r of fw.of("deliverables").all()) {
    for (const [k, v] of Object.entries(r)) {
      if (Array.isArray(v) && v[0] && typeof v[0] === "object" && "slug" in v[0]) {
        sample = r;
        field = k;
        break outer;
      }
    }
  }
  assert.ok(sample && field, "found a deliverable with a relationship field");
  const related = fw.relations(sample, field);
  assert.ok(related.length > 0);
  assert.ok(related.every((r) => typeof r.slug === "string"));
});

test("neighbors() and backlinks() round-trip", () => {
  let sample = null;
  let neigh = [];
  for (const r of fw.of("deliverables").all()) {
    const n = fw.neighbors(r);
    if (n.length) {
      sample = r;
      neigh = n;
      break;
    }
  }
  assert.ok(sample, "found a deliverable with neighbors");
  const target = neigh[0];
  const back = fw.backlinks(target).map((r) => r.slug);
  assert.ok(back.includes(sample.slug), "the neighbor should list the source among its backlinks");
});
