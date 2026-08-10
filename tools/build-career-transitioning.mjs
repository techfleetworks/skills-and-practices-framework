// build-transitions.mjs
// Consolidates the 7 "Transitioning Into <field>" Baserow tables into ONE clean dataset:
// data/json/transitions.json. Adds an explicit "Target Field" column, standardizes the
// column names across all tables, and normalizes link fields to {slug,label}.
// Run: BASEROW_TOKEN=... node tools/build-transitions.mjs
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const T = process.env.BASEROW_TOKEN;
if (!T) { console.error("Missing BASEROW_TOKEN"); process.exit(1); }
const BASE = "https://api.baserow.io";
const hdr = { Authorization: `Token ${T}` };
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// table id -> target field label.  *** 5 confident (from content), 2 NEED FOUNDER CONFIRMATION ***
// Target fields per founder-confirmed table URLs (the "Duties in the Field" column in the
// source is unreliable, so these labels come from the table identity, not row content).
const TARGET = {
  669484: "UX Design",
  1124365: "UX Research",
  1124072: "UX Writing",            // by elimination (founder's UX Writing URL duplicated the UXR one)
  1124076: "Business Analysis",
  1124078: "Product Ownership",
  1124364: "Product Management",    // multi-hat role (also spans BA/PO/SolArch/ProdOps) by design
  1124367: "Agile Coaching",        // multi-hat role (also spans Scrum Master/ProdOps) by design
};

// Correct source-industry typos from the Baserow "Transition From" field.
const FROM_FIX = { "Indutrial Design": "Industrial Design" };

// canonical column names (regex on the varying Baserow field name -> one clean key)
const FIELD = [
  [/^Transition From/i, "Transition From"],
  [/^Industry$/i, "Industry"],
  [/Duties in the Field/i, "Duties in the New Field"],
  [/Transfer.*Skills/i, "Transferable Skills From This Industry"],
  [/Foundational Skills/i, "Foundational Skills to Build"],
  [/Tasks You Will Be Responsible/i, "Tasks in the New Field"],
  [/Tools You Will Need/i, "Tools to Learn"],
  [/Methodologies/i, "Methodologies to Learn"],
  [/Deliverables to Learn/i, "Deliverables to Learn"],
  [/Practices/i, "Practices Needed to Succeed"],
  [/Summary of the Gaps/i, "Summary of the Gaps"],
  [/First Steps/i, "First Steps"],
  [/Training Recommendations/i, "Training Recommendations"],
];
const canon = name => (FIELD.find(([re]) => re.test(name)) || [])[1];

const slugify = s => String(s ?? "").toLowerCase().normalize("NFKD")
  .replace(/[’'"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
const isLink = v => Array.isArray(v) && v.length && typeof v[0] === "object" && v[0] && "value" in v[0];
const isEmpty = v => v == null || v === "" || (Array.isArray(v) && v.length === 0);

async function rowsOf(id) {
  const o = []; let p = 1;
  while (true) {
    const d = await (await fetch(`${BASE}/api/database/rows/table/${id}/?user_field_names=true&size=200&page=${p}`, { headers: hdr })).json();
    o.push(...d.results); if (!d.next) break; p++;
  }
  return o;
}

const out = [];
const coverage = {};
for (const [id, target] of Object.entries(TARGET)) {
  const rows = await rowsOf(id);
  coverage[target] = rows.length;
  for (const row of rows) {
    const raw = row["Transition From"] || "";
    const from = FROM_FIX[raw] || raw;
    const rec = { slug: `${slugify(target)}-from-${slugify(from)}`, "Target Field": target };
    for (const [k, v] of Object.entries(row)) {
      if (k === "id" || k === "order") continue;
      const key = canon(k);
      if (!key || isEmpty(v)) continue;
      rec[key] = isLink(v) ? v.map(x => ({ slug: slugify(x.value), label: x.value })) : v;
    }
    rec["Transition From"] = from; // apply typo correction
    out.push(rec);
  }
}

writeFileSync(join(ROOT, "data", "json", "transitions.json"), JSON.stringify(out, null, 2));
console.log(`transitions.json: ${out.length} rows across ${Object.keys(TARGET).length} target fields`);
console.log("coverage (rows per target field):");
for (const [t, n] of Object.entries(coverage)) console.log(`  ${t.padEnd(20)} ${n}`);
const froms = [...new Set(out.map(r => r["Transition From"]))].sort();
console.log(`\nsource industries seen (${froms.length}): ${froms.join(", ")}`);

// upsert a manifest entry so consumers see the transitions dataset (run after sync-from-baserow)
const manPath = join(ROOT, "data", "json", "manifest.json");
try {
  const man = JSON.parse(readFileSync(manPath, "utf8"));
  man.entities = man.entities.filter(e => e.entity !== "transitions");
  man.entities.push({ entity: "transitions", file: "transitions.json", count: out.length, primaryField: "slug" });
  writeFileSync(manPath, JSON.stringify(man, null, 2));
  console.log("manifest.json updated with the transitions entry");
} catch (e) { console.log("manifest not updated:", e.message); }
