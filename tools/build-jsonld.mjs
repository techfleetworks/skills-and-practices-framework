// build-jsonld.mjs
// Emits a standards-compliant JSON-LD view of the framework from data/json/.
// Design (per founder decision):
//   - Our names stay canonical (a Job Function is still a Job Function).
//   - schema.org types/properties are attached ADDITIVELY via @type + @context.
//   - Where schema.org has no fit, we use SKOS + our own namespace (spf:).
// Output: schema/context.jsonld (the crosswalk) + data/jsonld/<entity>.jsonld.
// Run: node tools/build-jsonld.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "data", "json", "framework-data");
const OUT = join(ROOT, "data", "jsonld");
mkdirSync(OUT, { recursive: true });
const manifest = JSON.parse(readFileSync(join(ROOT, "data", "json", "manifest.json"), "utf8"));
const primaryOf = Object.fromEntries(manifest.entities.map(e => [e.entity, e.primaryField]));

// entity file -> [schema.org @type, our spf: @type].  skos:Concept is appended to all.
const TYPE = {
  "skills": ["schema:DefinedTerm", "spf:Skill"],
  "practices": ["schema:DefinedTerm", "spf:Practice"],
  "practice-components": ["schema:DefinedTerm", "spf:PracticeComponent"],
  "duties": ["schema:DefinedTerm", "spf:Duty"],
  "job-functions": ["schema:Occupation", "spf:JobFunction"],
  "job-specializations": ["schema:Occupation", "spf:JobSpecialization"],
  "deliverables": ["schema:CreativeWork", "spf:Deliverable"],
  "activities": ["schema:HowTo", "spf:Activity"],
  "workshops": ["schema:HowTo", "spf:Workshop"],
  "workshop-steps": ["schema:HowToStep", "spf:WorkshopStep"],
  "workshop-template-sections": ["spf:WorkshopTemplateSection"],
  "milestones": ["schema:DefinedTerm", "spf:Milestone"],
  "tools": ["schema:SoftwareApplication", "spf:Tool"],
  "company-types": ["schema:DefinedTerm", "spf:CompanyType"],
  "stakeholders": ["schema:DefinedTerm", "spf:Stakeholder"],
  "job-industries": ["schema:DefinedTerm", "spf:JobIndustry"],
  "project-types": ["schema:DefinedTerm", "spf:ProjectType"],
  "data-types": ["schema:DefinedTermSet", "spf:DataType"],
  "methodologies": ["schema:HowTo", "spf:Methodology"],
  "handoff-deliverables-map": ["spf:HandoffMapping"],
  "transitions": ["schema:HowTo", "spf:CareerTransition"],
};

const camel = k => k.replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ")
  .map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");

// map a friendly term -> its IRI (schema.org where it fits, else our namespace)
function iri(term) {
  if (term === "name") return "schema:name";
  if (term === "slug") return "skos:notation";
  if (/description$/i.test(term)) return "schema:description";
  if (/^whereCanILearnMore/.test(term)) return { "@id": "schema:url", "@type": "@id" };
  if (/requiredSkills|foundationalSkills|skillsRequired|transferableSkills/i.test(term)) return "schema:competencyRequired";
  if (/^requiredTools|^toolsToLearn/.test(term)) return "spf:requiresTool";
  return "spf:" + term; // our own vocabulary for everything schema.org can't express
}

const termName = (key, primary) => key === primary ? "name" : key === "slug" ? "slug" : camel(key);

const files = readdirSync(SRC).filter(f => f.endsWith(".json") && f !== "manifest.json");
const context = { spf: "https://techfleetworks.github.io/skills-and-practices-framework/ns#", schema: "https://schema.org/", skos: "http://www.w3.org/2004/02/skos/core#", id: "@id", type: "@type" };

// pass 1: collect every term into the shared context
for (const f of files) {
  const ent = f.replace(/\.json$/, "");
  const rows = JSON.parse(readFileSync(join(SRC, f), "utf8"));
  for (const r of rows) for (const k of Object.keys(r)) {
    if (k === "id") continue;
    const t = termName(k, primaryOf[ent]);
    if (!(t in context)) context[t] = iri(t);
  }
}
writeFileSync(join(ROOT, "schema", "context.jsonld"), JSON.stringify({ "@context": context }, null, 2));

// pass 2: emit JSON-LD per entity
const isLink = v => Array.isArray(v) && v.length && typeof v[0] === "object" && v[0] && "slug" in v[0];
let total = 0;
for (const f of files) {
  const ent = f.replace(/\.json$/, "");
  const rows = JSON.parse(readFileSync(join(SRC, f), "utf8"));
  const types = [...(TYPE[ent] || ["spf:Thing"]), ent === "data-types" ? "skos:ConceptScheme" : "skos:Concept"];
  const graph = rows.map(r => {
    const node = { id: "spf:" + r.slug, type: types };
    for (const [k, v] of Object.entries(r)) {
      if (k === "id" || k === "slug") continue;
      const t = termName(k, primaryOf[ent]);
      node[t] = isLink(v) ? v.map(x => ({ id: "spf:" + x.slug, name: x.label })) : v;
    }
    return node;
  });
  writeFileSync(join(OUT, `${ent}.jsonld`), JSON.stringify({ "@context": "../../schema/context.jsonld", "@graph": graph }, null, 2));
  total += graph.length;
}
console.log(`Wrote schema/context.jsonld and ${files.length} JSON-LD files (${total} nodes) to data/jsonld/`);
