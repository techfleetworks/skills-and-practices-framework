import type { FrameworkRecord, Link, Snapshot } from "./types.js";
import type { EntityTypes } from "./generated.js";

/** True when a value is a relationship field: an array of {slug, label} links. */
function isLinkArray(v: unknown): v is Link[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    typeof v[0] === "object" &&
    v[0] !== null &&
    "slug" in (v[0] as object)
  );
}

/** Match one record field against a wanted value (handles link arrays, string arrays, scalars). */
function matchField(field: unknown, wanted: unknown): boolean {
  if (Array.isArray(field)) {
    return field.some((item) => {
      if (item && typeof item === "object" && "slug" in (item as object)) {
        const l = item as Link;
        return l.slug === wanted || l.label === wanted;
      }
      return item === wanted;
    });
  }
  return field === wanted;
}

function collectText(v: unknown, out: string[]): void {
  if (typeof v === "string") out.push(v);
  else if (typeof v === "number") out.push(String(v));
  else if (Array.isArray(v)) {
    for (const item of v) {
      if (item && typeof item === "object" && "label" in (item as object)) {
        out.push(String((item as Link).label));
      } else {
        collectText(item, out);
      }
    }
  }
}

function recordText(r: FrameworkRecord): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(r)) {
    if (k === "$entity") continue;
    collectText(v, parts);
  }
  return parts.join("  ").toLowerCase();
}

export type Predicate<T> = (record: T) => boolean;

/** A queryable set of records from one dataset. */
export class Collection<T extends FrameworkRecord = FrameworkRecord> {
  constructor(
    readonly name: string,
    readonly records: T[],
  ) {}

  get size(): number {
    return this.records.length;
  }

  /** Every record in the dataset (a copy). */
  all(): T[] {
    return this.records.slice();
  }

  /** One record by its slug. */
  get(slug: string): T | undefined {
    return this.records.find((r) => r.slug === slug);
  }

  /**
   * Filter records. Pass a field map (matched against links, string arrays, or scalars) or a
   * predicate function. `where({ "Data Type": "Interpersonal" })` or `where(r => ...)`.
   */
  where(query: Record<string, unknown> | Predicate<T>): T[] {
    if (typeof query === "function") return this.records.filter(query);
    const entries = Object.entries(query);
    return this.records.filter((r) => entries.every(([k, val]) => matchField(r[k], val)));
  }

  /** Case-insensitive text search across every string and label in each record. */
  search(text: string): T[] {
    const q = text.toLowerCase();
    if (!q) return [];
    return this.records.filter((r) => recordText(r).includes(q));
  }

  [Symbol.iterator](): Iterator<T> {
    return this.records[Symbol.iterator]();
  }
}

/**
 * The whole framework, loaded into memory and indexed for querying. Relationships resolve
 * globally by slug, exactly as the framework's own validator checks them.
 */
export class Framework {
  readonly version: string;
  private readonly byEntity = new Map<string, FrameworkRecord[]>();
  private readonly bySlug = new Map<string, FrameworkRecord>();
  private readonly incoming = new Map<string, FrameworkRecord[]>();
  private readonly collections = new Map<string, Collection>();

  constructor(snapshot: Snapshot) {
    this.version = snapshot.version;

    // Index records by entity and globally by slug (first record wins on a slug collision).
    for (const [entity, rows] of Object.entries(snapshot.data)) {
      const tagged = rows.map((r) => ({ ...r, $entity: entity }));
      this.byEntity.set(entity, tagged);
      for (const r of tagged) {
        if (r.slug && !this.bySlug.has(r.slug)) this.bySlug.set(r.slug, r);
      }
    }

    // Build the reverse index: for each record, which records point at it.
    for (const rows of this.byEntity.values()) {
      for (const r of rows) {
        const targets = new Set<string>();
        for (const v of Object.values(r)) {
          if (!isLinkArray(v)) continue;
          for (const l of v) targets.add(l.slug);
        }
        for (const slug of targets) {
          const arr = this.incoming.get(slug);
          if (arr) arr.push(r);
          else this.incoming.set(slug, [r]);
        }
      }
    }

    for (const [entity, rows] of this.byEntity) {
      this.collections.set(entity, new Collection(entity, rows));
    }
  }

  /** The names of every loaded dataset. */
  get entities(): string[] {
    return [...this.byEntity.keys()];
  }

  /** A dataset by name. Known datasets are typed; any name is accepted. */
  of<K extends keyof EntityTypes>(name: K): Collection<EntityTypes[K]>;
  of(name: string): Collection<FrameworkRecord>;
  of(name: string): Collection {
    return this.collections.get(name) ?? new Collection(name, []);
  }

  /** Resolve any slug to its record, globally (the same view the validator uses). */
  lookup(slug: string): FrameworkRecord | undefined {
    return this.bySlug.get(slug);
  }

  /**
   * Resolve one relationship field of a record to the records it points at.
   * Pass a dataset name as the third argument to keep only that entity (and type the result).
   */
  relations<K extends keyof EntityTypes>(record: FrameworkRecord, field: string, as: K): EntityTypes[K][];
  relations(record: FrameworkRecord, field: string, as?: string): FrameworkRecord[];
  relations(record: FrameworkRecord, field: string, as?: string): FrameworkRecord[] {
    const v = record[field];
    if (!isLinkArray(v)) return [];
    const out: FrameworkRecord[] = [];
    for (const l of v) {
      const t = this.bySlug.get(l.slug);
      if (t && (as === undefined || t.$entity === as)) out.push(t);
    }
    return out;
  }

  /** Every record this record points at, across all of its relationship fields. */
  neighbors(record: FrameworkRecord): FrameworkRecord[] {
    const seen = new Set<string>();
    const out: FrameworkRecord[] = [];
    for (const v of Object.values(record)) {
      if (!isLinkArray(v)) continue;
      for (const l of v) {
        const t = this.bySlug.get(l.slug);
        if (t && !seen.has(t.slug)) {
          seen.add(t.slug);
          out.push(t);
        }
      }
    }
    return out;
  }

  /** Every record that points at this record (reverse relationships). */
  backlinks(record: FrameworkRecord): FrameworkRecord[] {
    return (this.incoming.get(record.slug) ?? []).slice();
  }
}
