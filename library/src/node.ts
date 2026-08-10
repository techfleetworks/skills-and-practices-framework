import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Framework } from "./engine.js";
import type { FrameworkRecord } from "./types.js";

interface ManifestEntity {
  entity: string;
  file: string;
}
interface Manifest {
  version: string;
  entities: ManifestEntity[];
}

/**
 * Load a framework from a local `data/json` directory (Node only). Useful for tests, build
 * steps, and sync jobs that read the repository directly instead of fetching over the network.
 */
export async function fromDirectory(dataJsonDir: string): Promise<Framework> {
  const manifest = JSON.parse(await readFile(join(dataJsonDir, "manifest.json"), "utf8")) as Manifest;
  const data: Record<string, FrameworkRecord[]> = {};
  for (const e of manifest.entities) {
    data[e.entity] = JSON.parse(await readFile(join(dataJsonDir, e.file), "utf8")) as FrameworkRecord[];
  }
  return new Framework({ version: manifest.version, data });
}
