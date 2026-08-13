// check-no-personal-data.mjs
// Compliance gate: the PUBLIC framework is a taxonomy of work, NOT people. It must contain no
// personal data. This fails the build if any published record carries an email address, a
// personal-contact field, or an obviously personal field name. (Individual assessment RESPONSES
// are personal and live only in the private app — they must never reach this repo.)
// Run: node tools/check-no-personal-data.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = [join(ROOT, "data", "json", "framework-data"), join(ROOT, "data", "json", "career-transitioning")];

// email; and field NAMES that would only exist to hold personal data.
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PII_FIELD = /\b(e-?mail|phone|mobile|ssn|social security|date of birth|dob|home address|personal address|contact (info|number|email))\b/i;

const hits = [];
for (const DIR of DIRS) {
  if (!existsSync(DIR)) continue;
  for (const f of readdirSync(DIR).filter(x => x.endsWith(".json"))) {
    const rows = JSON.parse(readFileSync(join(DIR, f), "utf8"));
    for (const r of Array.isArray(rows) ? rows : [rows]) {
      for (const [k, v] of Object.entries(r)) {
        if (PII_FIELD.test(k)) hits.push({ f, slug: r.slug ?? r.id, kind: "PII field name", field: k });
        const scan = s => { if (typeof s === "string" && EMAIL.test(s)) hits.push({ f, slug: r.slug ?? r.id, kind: "email in value", field: k, sample: s.match(EMAIL)[0].replace(/(.).+(@.+)/, "$1***$2") }); };
        if (typeof v === "string") scan(v);
        else if (Array.isArray(v)) for (const x of v) scan(typeof x === "string" ? x : x?.label);
      }
    }
  }
}

if (hits.length) {
  console.log(`FAILED: ${hits.length} possible personal-data occurrence(s) in the public dataset:\n`);
  for (const h of hits.slice(0, 40)) console.log(`  ${h.f} · ${h.slug} · ${h.kind}: "${h.field}"${h.sample ? ` (${h.sample})` : ""}`);
  if (hits.length > 40) console.log(`  ...and ${hits.length - 40} more`);
  process.exit(1);
}
console.log("PASSED: no personal data (emails / personal-contact fields) found in the public dataset.");
