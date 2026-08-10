// build-mindmaps.mjs
// Generates one radial mind map (SVG) per data type from data/v1/data-types.json.
// Each map: center box (focus type + definition), one box per related data type
// (name + definition), and the two-way relationship sentences along each spoke.
// Run: node tools/build-mindmaps.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "visualizations");
mkdirSync(OUT, { recursive: true });

const rows = JSON.parse(readFileSync(join(ROOT, "data", "json", "framework-data", "data-types.json"), "utf8"));

// name -> {desc, slug}
const byName = {};
for (const r of rows) byName[r["Data Type Name"]] = { desc: r["Data Type Description"] || "", slug: r.slug };

// "Relationship to X" field -> target Data Type Name
const REL = {
  "Relationship to Skills": "Skills",
  "Relationship to Practices": "Practices",
  "Relationship to Projects": "Project",
  "Relationship to Duties": "Duty",
  "Relationship to Stakeholders": "Stakeholder",
  "Relationship to Milestones": "Milestone",
  "Relationship to Tools": "Tool",
  "Relationship to Activities": "Activity",
  "Relationship to Deliverables": "Deliverable",
  "Relationship to Job Functions": "Job Function",
  "Relationship to Job Specializations": "Job Specialization",
  "Relationship to Company Types": "Company Type",
  "Relationship to Methodologies": "Methodology",
  "Relationship to Workshops": "Workshop",
  "Relationship to Job Industries": "Job Industry",
};

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function wrap(text, max) {
  const words = String(text).split(/\s+/); const lines = []; let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

// parse the two numbered sentences out of a relationship field
function twoWay(text) {
  const after = String(text).split(/related in the following ways:\s*/i).pop();
  const parts = after.split(/\s*\d+\.\s+/).map(s => s.trim()).filter(Boolean);
  return parts.slice(0, 2);
}

const CX = 900, CY = 900, R = 660, RL = 340;

function nodeBox(x, y, name, desc, fill, stroke, nameSize, w, h) {
  const defLines = wrap(desc, 30).slice(0, 3);
  let t = `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  t += `<text x="${x}" y="${y - h / 2 + 20}" text-anchor="middle" font-size="${nameSize}" font-weight="700" fill="#1f2937">${esc(name)}</text>`;
  defLines.forEach((ln, i) => {
    t += `<text x="${x}" y="${y - h / 2 + 20 + 16 + i * 12}" text-anchor="middle" font-size="9.5" fill="#374151">${esc(ln)}</text>`;
  });
  return t;
}

function build(focus) {
  const rel = [];
  for (const [field, target] of Object.entries(REL)) {
    if (focus[field] && byName[target] && target !== focus["Data Type Name"]) {
      rel.push({ target, sentences: twoWay(focus[field]) });
    }
  }
  const N = rel.length;
  let svg = `<svg viewBox="0 0 1800 1800" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif">`;
  svg += `<title>${esc(focus["Data Type Name"])} — relationships to every other data type</title>`;
  svg += `<rect x="0" y="0" width="1800" height="1800" fill="#ffffff"/>`;
  svg += `<text x="60" y="70" font-size="30" font-weight="700" fill="#111827">${esc(focus["Data Type Name"])}</text>`;
  svg += `<text x="60" y="100" font-size="15" fill="#6b7280">Every line is a two-way relationship to another data type in the framework.</text>`;

  // spokes: connectors + rotated relationship sentences
  const marker = `<defs><marker id="ah" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#9ca3af"/></marker></defs>`;
  svg += marker;
  const nodes = [];
  rel.forEach((rl, i) => {
    const ang = (-90 + (360 / N) * i) * Math.PI / 180;
    const dx = Math.cos(ang), dy = Math.sin(ang);
    const nx = CX + R * dx, ny = CY + R * dy;
    nodes.push({ nx, ny, rl });
    // connector with arrowheads both ends
    const sx = CX + 70 * dx, sy = CY + 70 * dy;
    const ex = CX + (R - 52) * dx, ey = CY + (R - 52) * dy;
    svg += `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#d1d5db" stroke-width="1.5" marker-start="url(#ah)" marker-end="url(#ah)"/>`;
    // rotated two-way labels along the spoke
    let deg = -90 + (360 / N) * i;
    if (deg > 90 && deg < 270) deg -= 180;
    const lx = CX + RL * dx, ly = CY + RL * dy;
    const s0 = rl.sentences[0] || "", s1 = rl.sentences[1] || "";
    svg += `<g transform="translate(${lx.toFixed(1)},${ly.toFixed(1)}) rotate(${deg.toFixed(1)})">`;
    svg += `<text x="0" y="-5" text-anchor="middle" font-size="8" fill="#6b7280">${esc(s0)}</text>`;
    svg += `<text x="0" y="9" text-anchor="middle" font-size="8" fill="#6b7280">${esc(s1)}</text>`;
    svg += `</g>`;
  });
  // neighbor node boxes on top
  for (const n of nodes) {
    svg += nodeBox(n.nx, n.ny, n.rl.target, byName[n.rl.target].desc, "#ede9fe", "#7c3aed", 14, 220, 74);
  }
  // center box on top
  svg += nodeBox(CX, CY, focus["Data Type Name"], focus["Data Type Description"] || "", "#bbf7d0", "#16a34a", 18, 240, 90);
  svg += `</svg>`;
  return svg;
}

let made = 0;
for (const focus of rows) {
  const svg = build(focus);
  writeFileSync(join(OUT, `${focus.slug}.svg`), svg);
  made++;
  console.log(`${focus.slug}.svg  (${Object.keys(REL).filter(f => focus[f]).length} relationships)`);
}
console.log(`\n${made} mind maps written to docs/diagrams/`);
