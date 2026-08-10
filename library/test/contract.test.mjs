// Contract test: the OpenAPI spec, the manifest, and the snapshot cannot drift apart.
// This is the static-API equivalent of consumer-driven contract testing — the published
// contract (openapi.json) must match the published data. Runs in CI as a gate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const manifest = JSON.parse(readFileSync(join(REPO, "data", "json", "manifest.json"), "utf8"));
const openapi = JSON.parse(readFileSync(join(REPO, "openapi", "openapi.json"), "utf8"));
const snapshot = JSON.parse(readFileSync(join(REPO, "data", "json", "framework.snapshot.json"), "utf8"));

test("every dataset in the manifest has a documented GET endpoint", () => {
  for (const e of manifest.entities) {
    const path = "/data/json/" + e.file;
    assert.ok(openapi.paths[path], `missing OpenAPI path for ${e.entity} (${path})`);
    assert.ok(openapi.paths[path].get, `path ${path} has no GET`);
  }
});

test("the manifest endpoint itself is documented", () => {
  assert.ok(openapi.paths["/data/json/manifest.json"]?.get, "manifest endpoint not documented");
});

test("no OpenAPI data path is orphaned (points at a non-existent dataset)", () => {
  const validFiles = new Set(manifest.entities.map((e) => "/data/json/" + e.file));
  validFiles.add("/data/json/manifest.json");
  for (const path of Object.keys(openapi.paths)) {
    assert.ok(validFiles.has(path), `OpenAPI documents ${path} but no such dataset exists`);
  }
});

test("the snapshot contains every dataset, with counts matching the manifest", () => {
  for (const e of manifest.entities) {
    const rows = snapshot.data[e.entity];
    assert.ok(Array.isArray(rows), `snapshot missing dataset ${e.entity}`);
    assert.equal(rows.length, e.count, `snapshot count mismatch for ${e.entity}`);
  }
  assert.equal(snapshot.version, manifest.version, "snapshot/manifest version mismatch");
});
