// @security / @reliability executable checks for the query library.
// These implement the scenarios in ../../features/data-api.feature.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { fromDirectory } from "../dist/node.js";
import { loadFramework } from "../dist/index.js";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "json");
const fw = await fromDirectory(DATA_DIR);

test("@security search treats injection-style payloads as literal text (no query surface)", () => {
  // The engine never builds a query string or interpreter statement, so these are just text.
  for (const payload of ["' OR '1'='1", "'; DROP TABLE users; --", '{"$ne": null}', "<script>alert(1)</script>"]) {
    assert.doesNotThrow(() => fw.of("skills").search(payload));
    const hits = fw.of("skills").search(payload);
    assert.ok(Array.isArray(hits)); // a normal (empty) result set, not an error or side effect
  }
});

test("@security search is not vulnerable to ReDoS (no regex engine on user input)", () => {
  // A catastrophic-backtracking pattern is matched literally via String.includes — no regex.
  const start = process.hrtime.bigint();
  const hits = fw.of("skills").search("(a+)+$".repeat(20));
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  assert.ok(Array.isArray(hits));
  assert.ok(ms < 250, `literal search should be fast, took ${ms}ms`);
});

test("@security where() with an unknown field does not throw and returns no matches", () => {
  assert.doesNotThrow(() => fw.of("skills").where({ "No Such Field": "x" }));
  assert.equal(fw.of("skills").where({ "No Such Field": "x" }).length, 0);
});

test("@reliability loadFramework aborts a hung network load within the timeout", async () => {
  const hangingFetch = (_url, opts) =>
    new Promise((_resolve, reject) => {
      opts.signal.addEventListener("abort", () => reject(new Error("aborted")));
    });
  await assert.rejects(
    loadFramework({ baseUrl: "https://example.invalid", fetch: hangingFetch, timeoutMs: 50 }),
    /Timed out/,
  );
});

test("@security loadFramework with a bundled snapshot performs no network I/O", async () => {
  const snapshot = { version: "test", data: { skills: [{ slug: "a", "Skill Name": "A" }] } };
  const throwingFetch = () => {
    throw new Error("network must not be used when a snapshot is provided");
  };
  const local = await loadFramework({ snapshot, fetch: throwingFetch });
  assert.equal(local.of("skills").size, 1);
});

test("loadFramework fetches the snapshot from baseUrl and parses it", async () => {
  const snapshot = { version: "remote", data: { tools: [{ slug: "figma", "Tool Name": "Figma" }] } };
  let calledUrl;
  const okFetch = (url) => {
    calledUrl = url;
    return Promise.resolve({ ok: true, status: 200, json: async () => snapshot });
  };
  const remote = await loadFramework({ baseUrl: "https://data.example.org/spf", fetch: okFetch });
  assert.match(calledUrl, /framework\.snapshot\.json$/);
  assert.equal(remote.version, "remote");
  assert.equal(remote.of("tools").get("figma")["Tool Name"], "Figma");
});

test("loadFramework rejects with the status code on a non-OK response", async () => {
  const badFetch = () => Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  await assert.rejects(loadFramework({ baseUrl: "https://data.example.org/spf", fetch: badFetch }), /404/);
});
