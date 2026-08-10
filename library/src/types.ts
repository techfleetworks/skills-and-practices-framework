/** A relationship reference: another record's stable slug plus its human-readable label. */
export interface Link {
  slug: string;
  label: string;
}

/** An uploaded file reference (name + URL). */
export interface FileRef {
  name: string;
  url: string;
}

/**
 * The base shape of every record. Specific entity interfaces (see generated.ts) extend this
 * with the framework's own field names. The index signature keeps unknown fields accessible.
 */
export interface FrameworkRecord {
  id?: number;
  slug: string;
  /** The dataset this record belongs to. Added by the loader; never stored in the data. */
  $entity: string;
  [field: string]: unknown;
}

/** A loaded snapshot of the whole framework: a version tag and records keyed by dataset. */
export interface Snapshot {
  version: string;
  data: Record<string, FrameworkRecord[]>;
}
