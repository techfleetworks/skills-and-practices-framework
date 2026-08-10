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
  /** Abort the network load after this many milliseconds (default 15000). */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

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

  // Bound the outbound call so a slow or hanging endpoint can't stall the caller forever.
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await doFetch(url, { signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) throw new Error(`Timed out after ${timeoutMs}ms loading framework snapshot: ${url}`);
    throw new Error(`Failed to load framework snapshot: ${url} (${(err as Error).message})`);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`Failed to load framework snapshot (${res.status}): ${url}`);
  const snapshot = (await res.json()) as Snapshot;
  return new Framework(snapshot);
}
