/**
 * One provenance shape for the whole reference layer.
 *
 * Four generators build this layer from four corpora with four different
 * standings — NIST's own OSCAL release, DISA's CCI list from a public mirror, a
 * third party's PDF extraction of CNSSI 1253, and the fictional WS-X90 program
 * data. A screen that shows a control, an objective, a CCI or an allocation has
 * to be able to say where it came from and whether it is authoritative, in the
 * same words every time. `authoritative` is the load-bearing field: it is true
 * only for a machine-readable release published by the body that owns the
 * document.
 *
 * Hand-written. The generated modules import these types and export values that
 * satisfy them; `referenceSources` below is the registry a UI can enumerate.
 */

/** Stable id for a source, used by records that point back at their origin. */
export type ReferenceSourceId =
  | "NIST-800-53-R5"
  | "NIST-800-53A-R5"
  | "NIST-800-53B-R5"
  | "DISA-CCI-2024"
  | "CNSSI-1253-2022-EXTRACT";

export type ReferenceProvenance = {
  id: ReferenceSourceId;
  /** Human name of the dataset as shipped, e.g. "DISA CCI List 2024-01-10". */
  source: string;
  /** Body that owns the underlying publication. */
  authority: string;
  /** The normative publication this data expresses. */
  citation: string;
  /** Release identifier: a version, a publication date, or both. */
  release: string;
  /** Where these exact bytes were fetched from. */
  sourceUrl: string;
  /** The publisher's own landing page, when the bytes came from a mirror. */
  officialLandingPage?: string;
  /**
   * True only for a machine-readable release from the owning body. A mirror of
   * an official file is still a mirror; a PDF extraction is never authoritative.
   */
  authoritative: boolean;
  /** Rights statement, e.g. "US Government work — public domain". */
  rights: string;
  /**
   * The normative publication a derived dataset expresses, when the shipped
   * bytes are NOT that publication — e.g. a PDF extraction points at the PDF.
   */
  normativePublication?: string;
  /** SHA-256 of the corpus bytes the generator actually read, when computed. */
  sha256?: string;
  /** `last-modified` or equivalent carried by the source document. */
  lastModified?: string;
  /** Caveats a reader needs before trusting a record from this source. */
  notes?: readonly string[];
};

/**
 * The lazy per-family chunk contract, shared by the 800-53 control text and the
 * DISA CCI definitions. Both split a multi-megabyte corpus into one chunk per
 * family, keep an always-loaded index, and expose the same four calls.
 */
export type ReferenceFamilyLoader<T> = {
  /** Family ids that have a chunk, in catalog order. */
  families: readonly string[];
  /** Accepts a family ("AC"), a lower-case family ("ac") or a control id. */
  isFamily: (value: string) => boolean;
  /** Fetch one family's chunk. Memoised; rejects on an unknown family. */
  loadFamily: (family: string) => Promise<Record<string, T>>;
  /** Fetch every chunk in parallel and merge. */
  loadAll: () => Promise<Record<string, T>>;
};

/**
 * Every source the reference layer ships, so a screen can render the set without
 * importing four generated modules. Values are re-exported from the generated
 * modules, which own the sha256 and release detail; this file owns the shape.
 */
export const referenceSourceOrder: readonly ReferenceSourceId[] = [
  "NIST-800-53-R5",
  "NIST-800-53A-R5",
  "NIST-800-53B-R5",
  "DISA-CCI-2024",
  "CNSSI-1253-2022-EXTRACT",
];

export function isAuthoritative(p: ReferenceProvenance): boolean {
  return p.authoritative;
}
