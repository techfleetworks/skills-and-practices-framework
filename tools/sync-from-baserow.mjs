// sync-from-baserow.mjs
// Pulls every framework table from Baserow and writes clean, versioned JSON into data/v1/.
// Relationships are emitted as [{slug, label}] so the data is machine- and human-friendly.
// Run: BASEROW_TOKEN=... node tools/sync-from-baserow.mjs
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const T = process.env.BASEROW_TOKEN;
if (!T) { console.error("Missing BASEROW_TOKEN"); process.exit(1); }
const BASE = "https://api.baserow.io";
const hdr = { Authorization: `Token ${T}` };
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "json", "framework-data");
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
  { id: 1124363, file: "project-phases" },
];

const slugify = s => String(s ?? "").toLowerCase().normalize("NFKD")
  .replace(/[’'"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// --- cleaning rules (normalization pass) ---
// Drop Baserow lookup/duplicate columns: any field named "…copy" or ending in " <number>".
const DROP = /\bcopy\b|\s\d+$/i;
// Rename real fields Baserow happened to name with a "copy" suffix (per-entity).
const RENAME = { "project-types": { "UX Design Deliverables copy": "UX Design Deliverables" } };
const dedupe = arr => { const seen = new Set(); return arr.filter(x => { const k = x.slug ?? JSON.stringify(x); if (seen.has(k)) return false; seen.add(k); return true; }); };
const isRawLookup = v => Array.isArray(v) && v.length && typeof v[0] === "object" && v[0] && "value" in v[0] && !("slug" in v[0]);

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
      return dedupe(value.map(v => ({ slug: slugify(v.value), label: v.value })));
    case "single_select":
      return value ? value.value : null;
    case "multiple_select":
      return value.map(v => v.value);
    case "file":
      return value.map(v => ({ name: v.visible_name || v.name, url: v.url }));
    case "multiple_collaborators":
      return value.map(v => v.name);
    default:
      // lookup/rollup fields come back as [{ids,value}]; normalize to clean {slug,label}
      if (isRawLookup(value)) return dedupe(value.map(v => ({ slug: slugify(v.value), label: v.value })));
      return value; // text, long_text, number, boolean, date, etc.
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
      const key = (RENAME[ent.file] && RENAME[ent.file][f.name]) || f.name;
      if (DROP.test(key)) continue; // drop lookup/duplicate cruft columns
      const v = row[f.name];
      if (isEmpty(v)) continue;
      const nv = normalize(v, f);
      if (isEmpty(nv)) continue;
      rec[key] = nv;
    }
    return rec;
  });
  writeFileSync(join(OUT, `${ent.file}.json`), JSON.stringify(records, null, 2));
  manifest.entities.push({ entity: ent.file, file: `framework-data/${ent.file}.json`, count: records.length, primaryField: primary.name });
  console.log(`${ent.file.padEnd(28)} ${String(records.length).padStart(4)} rows`);
}

// Preserve manifest entries for datasets this tool does not own (e.g. the
// career-transitioning files, upserted by tools/build-career-transitioning.mjs), so a sync
// never drops them. Only the framework-data entities above are rewritten here.
const owned = new Set(ENTITIES.map(e => e.file));
try {
  const prev = JSON.parse(readFileSync(join(ROOT, "data", "json", "manifest.json"), "utf8"));
  for (const e of prev.entities || []) if (!owned.has(e.entity)) manifest.entities.push(e);
} catch { /* no prior manifest: nothing to preserve */ }

writeFileSync(join(ROOT, "data", "json", "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\nmanifest.json written with ${manifest.entities.length} entities.`);
