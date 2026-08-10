// extract-handbooks.mjs
// Pulls the three Tech Fleet handbooks from GitBook as Markdown into docs/handbooks/.
// GitBook publishes clean Markdown at every page URL (they already end in .md) and an
// index at guide.techfleet.org/llms.txt. No copy-paste, no auth.
// Run: node tools/extract-handbooks.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs", "handbooks");
const UA = { headers: { "User-Agent": "Mozilla/5.0 (skills-framework handbook sync)" } };

// URL path prefix -> local handbook folder
const HANDBOOKS = [
  { prefix: "/agile-training-portal/agile-handbook", dir: "agile-handbook", title: "Agile Handbook" },
  { prefix: "/team-portal/new-teammate-handbook", dir: "teammate-handbook", title: "New Teammate Handbook" },
  { prefix: "/project-portal/project-success-handbook", dir: "project-success-handbook", title: "Project Success Handbook" },
];

console.log("Fetching index (llms.txt)...");
const idx = await (await fetch("https://guide.techfleet.org/llms.txt", UA)).text();
const urls = [...new Set((idx.match(/https:\/\/guide\.techfleet\.org\/[^\s)]+\.md/g) || []))];
console.log(`Found ${urls.length} page URLs in the index.\n`);

const counts = {};
for (const hb of HANDBOOKS) {
  const pages = urls.filter(u => new URL(u).pathname.startsWith(hb.prefix));
  counts[hb.dir] = 0;
  for (const u of pages) {
    const rel = new URL(u).pathname.slice(hb.prefix.length).replace(/^\//, "") || "index.md";
    const dest = join(OUT, hb.dir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    const res = await fetch(u, UA);
    if (!res.ok) { console.log(`  MISS ${res.status} ${u}`); continue; }
    const md = await res.text();
    writeFileSync(dest, md);
    counts[hb.dir]++;
  }
  console.log(`${hb.title.padEnd(26)} ${counts[hb.dir]} pages -> docs/handbooks/${hb.dir}/`);
}

// index README for the handbooks folder
let readme = `# Handbooks\n\nLong-form Tech Fleet handbooks, pulled from GitBook (guide.techfleet.org) as Markdown.\nThey are the narrative companion to the structured data in \`data/\`: the data says *what*\nthe pieces are, the handbooks teach *how* the work is done.\n\n`;
for (const hb of HANDBOOKS) readme += `- **${hb.title}** — \`${hb.dir}/\` (${counts[hb.dir]} pages)\n`;
readme += `\n> Source of truth for the prose is GitBook; this is a synced snapshot. Regenerate with \`node tools/extract-handbooks.mjs\`.\n`;
writeFileSync(join(OUT, "README.md"), readme);

const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log(`\nDone. ${total} handbook pages written to docs/handbooks/.`);
