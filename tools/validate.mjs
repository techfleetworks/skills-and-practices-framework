// validate.mjs
// Referential-integrity check for the framework data. Every relationship in the dataset is a
// {slug, label} reference; this fails the build if any slug points at a row that does not exist.
// Also checks that every record has a slug. Run: node tools/validate.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "data", "json", "framework-data");
const files = readdirSync(SRC).filter(f => f.endsWith(".json"));

const isLink = v => Array.isArray(v) && v.length && typeof v[0] === "object" && v[0] && "slug" in v[0];

// build the set of every valid slug in the framework
const slugs = new Set();
const data = {};
for (const f of files) {
  const rows = JSON.parse(readFileSync(join(SRC, f), "utf8"));
  data[f] = rows;
  for (const r of rows) if (r.slug) slugs.add(r.slug);
}

let missingSlug = 0, brokenLinks = 0, checkedLinks = 0;
const broken = {};
for (const [f, rows] of Object.entries(data)) {
  for (const r of rows) {
    if (!r.slug) { console.log(`MISSING slug: ${f} id=${r.id}`); missingSlug++; }
    for (const [k, v] of Object.entries(r)) {
      if (!isLink(v)) continue;
      for (const x of v) {
        checkedLinks++;
        if (!slugs.has(x.slug)) { (broken[f] ??= []).push(`${r.slug}  ·  "${k}" -> ${x.slug} (${x.label})`); brokenLinks++; }
      }
    }
  }
}

console.log(`Entities: ${files.length}   Records: ${Object.values(data).reduce((a, r) => a + r.length, 0)}   Relationship links checked: ${checkedLinks}`);
if (missingSlug || brokenLinks) {
  if (brokenLinks) {
    console.log(`\n${brokenLinks} relationship link(s) point at a slug that does not exist:`);
    for (const [f, list] of Object.entries(broken)) {
      console.log(`\n  ${f}:`);
      for (const l of list.slice(0, 15)) console.log(`    ${l}`);
      if (list.length > 15) console.log(`    ...and ${list.length - 15} more`);
    }
  }
  console.log(`\nFAILED: ${missingSlug} missing slug(s), ${brokenLinks} broken link(s).`);
  process.exit(1);
}
console.log("PASSED: every record has a slug and every relationship resolves.");
