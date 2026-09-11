/**
 * The reference layer as one enumerable list.
 *
 * `reference-provenance.ts` declares the shape and the order and says a registry
 * "a UI can enumerate" belongs with it. It could not live there: the generated
 * modules import that file for the type, so importing their values back into it
 * would be a cycle. This module sits above all of them and does the assembly.
 *
 * The point of enumerating them is `authoritative`. Two of the five are not:
 * DISA's CCI list came from a public mirror rather than the Cyber Exchange, and
 * the CNSSI 1253 allocation is a third-party extraction of published PDF tables.
 * Both are used, and a screen that shows a control's CCIs or its C/I/A selection
 * has to be able to say where that came from.
 */
import { cciProvenance } from "@/lib/cci-catalog";
import { cnssiProvenance } from "@/lib/cnssi-1253";
import { nistBaselineProvenance } from "@/lib/nist-baselines";
import { nistAssessmentProvenance, nistCatalogProvenance } from "@/lib/nist-catalog";
import {
  referenceSourceOrder,
  type ReferenceProvenance,
  type ReferenceSourceId,
} from "@/lib/reference-provenance";

const byId: Record<ReferenceSourceId, ReferenceProvenance> = {
  "NIST-800-53-R5": nistCatalogProvenance,
  "NIST-800-53A-R5": nistAssessmentProvenance,
  // SP 800-53B is one publication carrying four profiles under one source id.
  // High is the profile the WS-X90 derivation starts from, and its bytes are the
  // ones hashed here; the name is rewritten so it does not read as though only
  // the high baseline shipped.
  "NIST-800-53B-R5": {
    ...nistBaselineProvenance.high,
    source: "NIST SP 800-53B control baselines (OSCAL) 5.2.0",
    notes: [
      "Low, Moderate, High and Privacy ship together; the hash is the High profile's.",
      ...(nistBaselineProvenance.high.notes ?? []),
    ],
  },
  "DISA-CCI-2024": cciProvenance,
  "CNSSI-1253-2022-EXTRACT": cnssiProvenance,
};

/**
 * The dataset's name, without the local path the generator appends.
 *
 * `gen-cnssi-baselines.mjs` writes `source` as `"<name> — <corpus path>"`, and the
 * corpus directory is git-ignored, so the path names a file that exists on one
 * machine. It is provenance for the generator, not for a reader; `sourceUrl` is
 * where the bytes actually came from and that is what the screen links.
 */
export function referenceSourceName(source: ReferenceProvenance): string {
  const [name] = source.source.split(" — ");
  return name ?? source.source;
}

/** Every source the reference layer ships, in publication order. */
export const referenceSources: ReferenceProvenance[] = referenceSourceOrder.map((id) => byId[id]);

export function referenceSource(id: ReferenceSourceId): ReferenceProvenance {
  return byId[id];
}

/** Sources that are not a machine-readable release from the body that owns the document. */
export const nonAuthoritativeSources = referenceSources.filter((s) => !s.authoritative);
