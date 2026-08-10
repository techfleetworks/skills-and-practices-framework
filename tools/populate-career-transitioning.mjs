// populate-career-transitioning.mjs
// Writes authored "Summary of the Gaps" and "Training Recommendations" back into a
// "Transitioning Into <field>" Baserow table, one unique pair per source industry.
// Reusable: to fill a new table, author a content file (keyed by source industry) and run:
//   BASEROW_TOKEN=... node tools/populate-career-transitioning.mjs <tableId> tools/career-transitioning-content/<field>.json
// Content file shape: { "Academia": { "gaps": "...", "training": "..." }, ... }
import { readFileSync } from "node:fs";

const T = process.env.BASEROW_TOKEN;
const [tableId, contentPath] = process.argv.slice(2);
if (!T || !tableId || !contentPath) { console.error("usage: node tools/populate-career-transitioning.mjs <tableId> <contentFile.json>"); process.exit(1); }
const BASE = "https://api.baserow.io";
const auth = { Authorization: `Token ${T}` };
const FROM_FIX = { "Indutrial Design": "Industrial Design" }; // correct source typo while we are here

const content = JSON.parse(readFileSync(contentPath, "utf8"));
const rows = (await (await fetch(`${BASE}/api/database/rows/table/${tableId}/?user_field_names=true&size=200`, { headers: auth })).json()).results;

const items = [], missing = [];
for (const r of rows) {
  const raw = r["Transition From"] || "";
  const key = FROM_FIX[raw] || raw;
  const c = content[key];
  if (!c) { missing.push(raw); continue; }
  const item = { id: r.id, "Summary of the Gaps": c.gaps, "Training Recommendations": c.training };
  if (FROM_FIX[raw]) item["Transition From"] = key; // fix the typo at the source too
  items.push(item);
}
if (missing.length) console.log(`WARNING: no authored content for: ${missing.join(", ")}`);
const contentKeys = Object.keys(content).filter(k => !rows.some(r => (FROM_FIX[r["Transition From"]] || r["Transition From"]) === k));
if (contentKeys.length) console.log(`WARNING: content keys with no matching row: ${contentKeys.join(", ")}`);

const res = await fetch(`${BASE}/api/database/rows/table/${tableId}/batch/?user_field_names=true`, {
  method: "PATCH", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ items })
});
if (!res.ok) { console.error("PATCH failed", res.status, await res.text()); process.exit(1); }
console.log(`Populated ${items.length} rows in table ${tableId} from ${contentPath}`);
