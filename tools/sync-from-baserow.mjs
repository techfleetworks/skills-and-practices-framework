// sync-from-baserow.mjs
// Pulls every framework table from Baserow and writes clean, versioned JSON into data/v1/.
// Relationships are emitted as [{slug, label}] so the data is machine- and human-friendly.
// Run: BASEROW_TOKEN=... node tools/sync-from-baserow.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const T = process.env.BASEROW_TOKEN;
if (!T) { console.error("Missing BASEROW_TOKEN"); process.exit(1); }
const BASE = "https://api.baserow.io";
const hdr = { Authorization: `Token ${T}` };
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "json");
mkdirSync(OUT, { recursive: true });

const ENTITIES = [
  { id: 669465, file: "data-types" },
  { id: 669468, file: "skills" },
  { id: 669469, file: "practices" },
  { id: 669470, file: "practice-components" },
  { id: 669472, file: "activities" },
  { id: 669473, file: "duties" },
  { id: 669474, file: "job-functions" },
  { id: 669475, file: "deliverables" },
  { id: 669476, file: "milestones" },
  { id: 669477, file: "specializations" },
  { id: 669478, file: "methodologies" },
  { id: 669480, file: "tools" },
  { id: 669481, file: "company-types" },
  { id: 669482, file: "stakeholders" },
  { id: 669483, file: "job-industries" },
  { id: 669459, file: "project-types" },
  { id: 1124240, file: "workshops" },
  { id: 1124480, file: "workshop-steps" },
  { id: 1124481, file: "workshop-template-sections" },
  { id: 1124520, file: "handoff-deliverables-map" },
];

const slugify = s => String(s ?? "").toLowerCase().normalize("NFKD")
  .replace(/[’'"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

async function getFields(id) {
  const r = await fetch(`${BASE}/api/database/fields/table/${id}/`, { headers: hdr });
  if (!r.ok) throw new Error(`fields ${id}: ${r.status}`);
  return r.json();
}
async function getRows(id) {
  const out = []; let p = 1;
  while (true) {
    const u = `${BASE}/api/database/rows/table/${id}/?user_field_names=true&size=200&page=${p}`;
    const d = await (await fetch(u, { headers: hdr })).json();
    out.push(...d.results);
    if (!d.next) break; p++;
  }
  return out;
}

const isEmpty = v => v == null || v === "" || (Array.isArray(v) && v.length === 0);

function normalize(value, field) {
  switch (field.type) {
    case "link_row":
      return value.map(v => ({ slug: slugify(v.value), label: v.value }));
    case "single_select":
      return value ? value.value : null;
    case "multiple_select":
      return value.map(v => v.value);
    case "file":
      return value.map(v => ({ name: v.visible_name || v.name, url: v.url }));
    case "multiple_collaborators":
      return value.map(v => v.name);
    default:
      return value; // text, long_text, number, boolean, date, formula, lookup, rollup, etc.
  }
}

const manifest = { framework: "Skills & Practices Framework", version: "v1", generatedFromBaserow: 287350, entities: [] };

for (const ent of ENTITIES) {
  const fields = await getFields(ent.id);
  const primary = fields.find(f => f.primary) || fields[0];
  const rows = await getRows(ent.id);
  const seen = new Map();
  const records = rows.map(row => {
    let slug = slugify(row[primary.name]) || `row-${row.id}`;
    if (seen.has(slug)) { const n = seen.get(slug) + 1; seen.set(slug, n); slug = `${slug}-${n}`; }
    else seen.set(slug, 1);
    const rec = { id: row.id, slug };
    for (const f of fields) {
      const v = row[f.name];
      if (isEmpty(v)) continue;
      const nv = normalize(v, f);
      if (isEmpty(nv)) continue;
      rec[f.name] = nv;
    }
    return rec;
  });
  writeFileSync(join(OUT, `${ent.file}.json`), JSON.stringify(records, null, 2));
  manifest.entities.push({ entity: ent.file, file: `${ent.file}.json`, count: records.length, primaryField: primary.name });
  console.log(`${ent.file.padEnd(28)} ${String(records.length).padStart(4)} rows`);
}

writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nmanifest.json written with ${manifest.entities.length} entities.`);
