// build-schemas.mjs
// Generates a JSON Schema per entity from data/json/framework-data/, inferred from the data.
// This is the validation CONTRACT: field names (our names), types, and the {slug,label} shape
// of every relationship. Output: schema/framework-data/<entity>.schema.json
// Run: node tools/build-schemas.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "data", "json", "framework-data");
const OUT = join(ROOT, "schema", "framework-data");
mkdirSync(OUT, { recursive: true });
const NS = "https://techfleetworks.github.io/skills-and-practices-framework";

const linkItem = { type: "object", properties: { slug: { type: "string" }, label: { type: "string" } }, required: ["slug", "label"], additionalProperties: false };
const fileItem = { type: "object", properties: { name: { type: "string" }, url: { type: "string" } }, additionalProperties: true };

function schemaFor(v) {
  if (Array.isArray(v)) {
    if (v.length && v[0] && typeof v[0] === "object" && "slug" in v[0]) return { type: "array", items: linkItem };
    if (v.length && v[0] && typeof v[0] === "object" && "url" in v[0]) return { type: "array", items: fileItem };
    return { type: "array", items: { type: "string" } };
  }
  if (typeof v === "number") return { type: "number" };
  if (typeof v === "boolean") return { type: "boolean" };
  return { type: "string" };
}
// prefer the "richest" observed shape for a field (link > file > array > scalar)
const rank = s => s?.items === linkItem ? 4 : s?.items === fileItem ? 3 : s?.type === "array" ? 2 : 1;

const files = readdirSync(SRC).filter(f => f.endsWith(".json"));
for (const f of files) {
  const ent = f.replace(/\.json$/, "");
  const rows = JSON.parse(readFileSync(join(SRC, f), "utf8"));
  const props = { id: { type: "integer" }, slug: { type: "string" } };
  for (const r of rows) for (const [k, v] of Object.entries(r)) {
    if (k === "id" || k === "slug" || v == null) continue;
    const s = schemaFor(v);
    if (!props[k] || rank(s) > rank(props[k])) props[k] = s;
  }
  const schema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${NS}/schema/framework-data/${ent}.schema.json`,
    title: ent,
    description: `A record in the ${ent} dataset of the Skills & Practices Framework. Field names are the framework's own; see schema/context.jsonld for the schema.org / SKOS mapping.`,
    type: "object",
    required: ["slug"],
    additionalProperties: false,
    properties: props,
  };
  writeFileSync(join(OUT, `${ent}.schema.json`), JSON.stringify(schema, null, 2));
}
console.log(`Wrote ${files.length} JSON Schemas to schema/framework-data/`);
