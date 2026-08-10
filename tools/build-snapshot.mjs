// build-snapshot.mjs
// Bundles every dataset + the manifest version into ONE file: data/json/framework.snapshot.json.
// This is the single artifact the query library loads in one request, an app bundles at build
// time, or a database sync job ingests. Run: node tools/build-snapshot.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const JSON_DIR = join(ROOT, "data", "json");
const manifest = JSON.parse(readFileSync(join(JSON_DIR, "manifest.json"), "utf8"));

const data = {};
let records = 0;
for (const e of manifest.entities) {
  const rows = JSON.parse(readFileSync(join(JSON_DIR, e.file), "utf8"));
  data[e.entity] = rows;
  records += rows.length;
}

const snapshot = {
  framework: manifest.framework,
  version: manifest.version,
  generatedFromBaserow: manifest.generatedFromBaserow,
  entities: manifest.entities,
  data,
};

const OUT = join(JSON_DIR, "framework.snapshot.json");
writeFileSync(OUT, JSON.stringify(snapshot, null, 2));
console.log(`Wrote framework.snapshot.json: ${manifest.entities.length} datasets, ${records} records.`);
