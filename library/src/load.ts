import { Framework } from "./engine.js";
import type { Snapshot } from "./types.js";

/** The official published framework (GitHub Pages). */
export const DEFAULT_BASE_URL = "https://techfleetworks.github.io/skills-and-practices-framework";

export interface LoadOptions {
  /** Use an already-loaded snapshot (for example, one bundled into your app). */
  snapshot?: Snapshot;
  /** Base URL of a published framework. Defaults to the official site. */
  baseUrl?: string;
  /** Full URL to a snapshot file. Overrides `baseUrl`. */
  snapshotUrl?: string;
  /** A custom fetch implementation. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

/** Build a framework from a snapshot you already have in memory. Synchronous. */
export function createFramework(snapshot: Snapshot): Framework {
  return new Framework(snapshot);
}

/**
 * Load the framework. With no options it fetches the official published snapshot in one
 * request. Pass `snapshot` to use bundled data, or `baseUrl` to point at your own copy.
 */
export async function loadFramework(options: LoadOptions = {}): Promise<Framework> {
  if (options.snapshot) return new Framework(options.snapshot);

  const doFetch = options.fetch ?? globalThis.fetch;
  if (typeof doFetch !== "function") {
    throw new Error("No fetch available in this environment. Pass options.fetch or options.snapshot.");
  }

  const base = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const url = options.snapshotUrl ?? `${base}/data/json/framework.snapshot.json`;

  const res = await doFetch(url);
  if (!res.ok) throw new Error(`Failed to load framework snapshot (${res.status}): ${url}`);
  const snapshot = (await res.json()) as Snapshot;
  return new Framework(snapshot);
}
