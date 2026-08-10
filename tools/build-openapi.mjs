// build-openapi.mjs
// Generates openapi/openapi.json (OpenAPI 3.1) describing the framework's static JSON API.
// "Static-first": every endpoint is a JSON file served by GitHub Pages; this spec documents
// them and points responses at the JSON Schemas in schema/framework-data/. Reusable: rerun
// after adding entities. Run: node tools/build-openapi.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "data", "json", "manifest.json"), "utf8"));
const BASE = "https://techfleetworks.github.io/skills-and-practices-framework";

const title = s => s.replace(/[-_/]/g, " ").replace(/\.json$/, "").replace(/\b\w/g, c => c.toUpperCase()).trim();

const paths = {};
paths["/data/json/manifest.json"] = {
  get: {
    tags: ["Index"],
    summary: "Dataset manifest",
    description: "Lists every dataset in the framework, its file, record count, and primary field. Start here to discover what is available.",
    operationId: "getManifest",
    responses: { "200": { description: "The manifest.", content: { "application/json": { schema: { type: "object" } } } } },
  },
};

for (const e of manifest.entities) {
  const isFramework = e.file.startsWith("framework-data/");
  const tag = isFramework ? "Framework data" : "Career transitioning";
  const name = e.file.replace(/^.*\//, "").replace(/\.json$/, "");
  const items = isFramework
    ? { $ref: `../schema/framework-data/${name}.schema.json` }
    : { type: "object", description: "A source-to-target career-transition row: Target Field, Transition From, the unique Summary of the Gaps and Training Recommendations, the shared A Day in the Life, and linked skills, tasks, tools, and deliverables." };
  paths["/data/json/" + e.file] = {
    get: {
      tags: [tag],
      summary: `Get ${title(name)}`,
      description: `Returns the full ${title(name)} dataset (${e.count} records). Each relationship is a {slug, label} reference to another record.`,
      operationId: "get_" + name.replace(/[^A-Za-z0-9]+/g, "_"),
      responses: {
        "200": {
          description: `The ${title(name)} records.`,
          content: { "application/json": { schema: { type: "array", items } } },
        },
      },
    },
  };
}

const spec = {
  openapi: "3.1.0",
  info: {
    title: "The Skills & Practices Framework API",
    version: "0.1.0",
    summary: "An open, machine-readable map of how people work well together.",
    description:
      "A static, read-only API over the Skills & Practices Framework. Every endpoint is a JSON " +
      "file served by GitHub Pages, so it is free and always available. Field names are the " +
      "framework's own; see schema/context.jsonld for the schema.org and SKOS mapping. Data is " +
      "licensed CC BY 4.0 (credit Tech Fleet); the code is Apache-2.0.",
    license: { name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
    contact: { name: "Tech Fleet", url: "https://techfleet.org" },
  },
  servers: [{ url: BASE, description: "GitHub Pages (static JSON)" }],
  tags: [
    { name: "Index", description: "Start here: what datasets exist." },
    { name: "Framework data", description: "The core data types (skills, practices, deliverables, milestones, and more)." },
    { name: "Career transitioning", description: "For each target field, how to move into it from another line of work." },
  ],
  paths,
};

mkdirSync(join(ROOT, "openapi"), { recursive: true });
writeFileSync(join(ROOT, "openapi", "openapi.json"), JSON.stringify(spec, null, 2));
console.log(`Wrote openapi/openapi.json with ${Object.keys(paths).length} endpoints.`);
