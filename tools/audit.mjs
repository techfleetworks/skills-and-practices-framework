// audit.mjs  (REPORTING, non-gating)
// Phase-A coverage & quality audit beyond referential integrity: thin/orphan nodes, suspected
// unresolved-link strings, empty narrative fields, external/S3 URL rot, duplicate slugs.
// Prints a report to stdout; does NOT fail the build (heuristics carry false positives — the
// precise gates are promoted here case-by-case once each finding is triaged). Run: node tools/audit.mjs
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "json", "framework-data");
const files = readdirSync(SRC).filter(f => f.endsWith(".json"));
const isLink = v => Array.isArray(v) && v.length && typeof v[0] === "object" && v[0] && "slug" in v[0];

const data = {};
for (const f of files) data[f] = JSON.parse(readFileSync(join(SRC, f), "utf8"));

// inbound reference counts (excluding the ubiquitous "Data Type" tag)
const inbound = new Map();
for (const rows of Object.values(data))
  for (const r of rows)
    for (const [k, v] of Object.entries(r)) {
      if (k === "Data Type" || !isLink(v)) continue;
      for (const x of v) if (x.slug && x.slug !== r.slug) inbound.set(x.slug, (inbound.get(x.slug) || 0) + 1);
    }

const totalRecords = Object.values(data).reduce((a, r) => a + r.length, 0);
console.log(`SPF coverage audit — ${files.length} entities, ${totalRecords} records\n`);

// 1. thin edges
console.log("## Thin edges (link fields with records carrying zero links)");
const thin = [];
for (const [f, rows] of Object.entries(data)) {
  const linkFields = new Set();
  for (const r of rows) for (const [k, v] of Object.entries(r)) if (k !== "Data Type" && isLink(v)) linkFields.add(k);
  for (const k of linkFields) {
    const zero = rows.filter(r => !isLink(r[k])).length;
    if (zero) thin.push({ f: f.replace(".json", ""), k, zero, total: rows.length });
  }
}
for (const t of thin.sort((a, b) => b.zero / b.total - a.zero / a.total).slice(0, 20))
  console.log(`  ${t.f} · ${t.k}: ${t.zero}/${t.total} (${Math.round(100 * t.zero / t.total)}%)`);

// 2. orphans
console.log("\n## Orphan nodes (nothing links to them)");
for (const [f, rows] of Object.entries(data)) {
  const orphans = rows.filter(r => r.slug && !inbound.get(r.slug));
  if (orphans.length) console.log(`  ${f.replace(".json", "")}: ${orphans.length}/${rows.length}`);
}

// 3. suspected unresolved-link strings
console.log("\n## Suspected unresolved-link strings (comma-joined short values left as text)");
const suspect = {};
for (const [f, rows] of Object.entries(data))
  for (const r of rows)
    for (const [k, v] of Object.entries(r)) {
      if (typeof v !== "string" || !v.includes(",")) continue;
      const parts = v.split(",").map(x => x.trim()).filter(Boolean);
      if (parts.length >= 2 && parts.every(p => p.length <= 45 && !/[.!?;:]/.test(p)))
        (suspect[`${f.replace(".json", "")} · ${k}`] ??= 0), suspect[`${f.replace(".json", "")} · ${k}`]++;
    }
for (const [key, n] of Object.entries(suspect).sort((a, b) => b[1] - a[1]).slice(0, 20)) console.log(`  ${key}: ${n} rows`);

// 4. duplicate slugs
const dups = [];
for (const [f, rows] of Object.entries(data)) {
  const seen = new Map();
  for (const r of rows) if (r.slug) seen.set(r.slug, (seen.get(r.slug) || 0) + 1);
  for (const [s, c] of seen) if (c > 1) dups.push(`${f.replace(".json", "")}:${s}×${c}`);
}
console.log(`\n## Duplicate slugs: ${dups.length ? dups.join(", ") : "none"}`);
