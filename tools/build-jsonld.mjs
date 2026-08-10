// build-jsonld.mjs
// Emits a standards-compliant JSON-LD view of the framework from data/json/framework-data/.
// Design (founder rule): OUR names stay the keys and the types. The universal vocabularies
// (schema.org, SKOS) are bound TO our names through the @context, never replacing them:
//   - Every record keeps our exact field names as keys; @context maps each to its meaning.
//   - Each node's @type carries our own type (spf:Deliverable, spf:JobFunction, ...) alongside
//     the closest schema.org type and skos:Concept.
//   - schema.org is used where it fits; SKOS + our namespace (spf:) cover the rest.
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

// entity -> [closest schema.org @type, our own spf: @type]. skos:Concept is appended to every node.
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
  "project-phases": ["schema:DefinedTerm", "spf:ProjectPhase"],
};

// slug/camelCase of a field name, used only for the spf: IRI local part (the KEY stays our exact name)
const camel = k => k.replace(/[^A-Za-z0-9]+/g, " ").trim().split(" ")
  .map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");

// Bind one of OUR field names to its universal meaning. schema.org where it fits, else spf:.
function iri(name, isPrimary) {
  if (isPrimary) return "schema:name";
  const c = camel(name);
  if (/description$/i.test(c)) return "schema:description";
  if (/^whereCanILearnMore/.test(c)) return { "@id": "schema:url", "@type": "@id" };
  if (/(requiredSkills|foundationalSkills|skillsRequired|transferableSkills)/i.test(c)) return "schema:competencyRequired";
  return "spf:" + c; // our own vocabulary term, still keyed by our exact field name
}

const files = readdirSync(SRC).filter(f => f.endsWith(".json"));
// fixed context terms; our field names are added below
const context = {
  spf: "https://techfleetworks.github.io/skills-and-practices-framework/ns#",
  schema: "https://schema.org/",
  skos: "http://www.w3.org/2004/02/skos/core#",
  id: "@id",
  type: "@type",
  slug: "skos:notation",
  label: "schema:name", // used on nested {id,label} relationship references
};

// pass 1: bind every one of our field names in the shared context
for (const f of files) {
  const ent = f.replace(/\.json$/, "");
  const rows = JSON.parse(readFileSync(join(SRC, f), "utf8"));
  for (const r of rows) for (const k of Object.keys(r)) {
    if (k === "id" || k === "slug") continue;
    if (!(k in context)) context[k] = iri(k, k === primaryOf[ent]);
  }
}
writeFileSync(join(ROOT, "schema", "context.jsonld"), JSON.stringify({ "@context": context }, null, 2));

// pass 2: emit JSON-LD per entity, keeping our exact field names as keys
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
      node[k] = isLink(v) ? v.map(x => ({ id: "spf:" + x.slug, label: x.label })) : v;
    }
    return node;
  });
  writeFileSync(join(OUT, `${ent}.jsonld`), JSON.stringify({ "@context": "../../schema/context.jsonld", "@graph": graph }, null, 2));
  total += graph.length;
}
console.log(`Wrote schema/context.jsonld and ${files.length} JSON-LD files (${total} nodes) to data/jsonld/`);
