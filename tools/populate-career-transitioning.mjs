// populate-career-transitioning.mjs
// Writes authored fields back into a "Transitioning Into <field>" Baserow table:
//   - "Summary of the Gaps" and "Training Recommendations": UNIQUE per source industry
//   - "A Day in the Life": one ROLE-LEVEL description, written to every row
// Reusable: author a content file and run:
//   BASEROW_TOKEN=... node tools/populate-career-transitioning.mjs <tableId> tools/career-transitioning-content/<field>.json
// Content file shape:
//   { "__dayInLife": "...role day...", "Academia": { "gaps": "...", "training": "..." }, ... }
import { readFileSync } from "node:fs";

const T = process.env.BASEROW_TOKEN;
const [tableId, contentPath] = process.argv.slice(2);
if (!T || !tableId || !contentPath) { console.error("usage: node tools/populate-career-transitioning.mjs <tableId> <contentFile.json>"); process.exit(1); }
const BASE = "https://api.baserow.io";
const auth = { Authorization: `Token ${T}` };
const FROM_FIX = { "Indutrial Design": "Industrial Design" }; // correct source typo while we are here

const content = JSON.parse(readFileSync(contentPath, "utf8"));
const dayInLife = content.__dayInLife || null;
const rows = (await (await fetch(`${BASE}/api/database/rows/table/${tableId}/?user_field_names=true&size=200`, { headers: auth })).json()).results;

const items = [], missing = [];
for (const r of rows) {
  const raw = r["Transition From"] || "";
  const key = FROM_FIX[raw] || raw;
  const c = content[key];
  if (!c) { missing.push(raw); continue; }
  const item = { id: r.id, "Summary of the Gaps": c.gaps, "Training Recommendations": c.training };
  if (dayInLife) item["A Day in the Life"] = dayInLife;
  if (FROM_FIX[raw]) item["Transition From"] = key; // fix the typo at the source too
  items.push(item);
}
if (missing.length) console.log(`WARNING: no authored content for: ${missing.join(", ")}`);
const srcKeys = Object.keys(content).filter(k => k !== "__dayInLife");
const orphan = srcKeys.filter(k => !rows.some(r => (FROM_FIX[r["Transition From"]] || r["Transition From"]) === k));
if (orphan.length) console.log(`WARNING: content keys with no matching row: ${orphan.join(", ")}`);

const res = await fetch(`${BASE}/api/database/rows/table/${tableId}/batch/?user_field_names=true`, {
  method: "PATCH", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ items })
});
if (!res.ok) { console.error("PATCH failed", res.status, await res.text()); process.exit(1); }
console.log(`Populated ${items.length} rows in table ${tableId}${dayInLife ? " (incl. A Day in the Life)" : ""}`);
