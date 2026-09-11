/**
 * Full control detail for a single matrix row.
 *
 * All of the requirement text is real: the SP 800-53 Rev. 5 statement,
 * discussion, organization-defined parameters and references come straight from
 * the NIST OSCAL catalog, and the assessment objectives and methods are the
 * SP 800-53A procedures the assessor executes. The only thing this module adds
 * is the join to the program's own records: which related controls the program
 * actually carries.
 *
 * The DISA CCI decomposition rides along as a cross-reference. It used to come
 * from a 17-row hand-written fixture while this header claimed it was real; it
 * now comes from the published 2024 list. It is a *reference*, not the unit of
 * verification — SP 800-53A objectives are that, and unlike the CCI list they
 * come from the body that owns the document (`cciProvenance.authoritative` is
 * false, and a screen showing these should be able to say so).
 *
 * The text lives in a large generated module, so a caller loads it (a route
 * loader) and passes it in rather than importing it here.
 */

import { ccisForControl, type Cci } from "@/lib/cci-catalog";
import type { ControlRow } from "@/lib/control-matrix";
import type { NistControlText } from "@/lib/nist-catalog";

export type ControlDetail = NistControlText & {
  /** DISA CCIs that cross-reference this control in the Rev. 5 mapping. */
  ccis: Cci[];
  /** Related controls, split by whether this program carries them. */
  relatedInScope: string[];
  relatedOutOfScope: string[];
};

export const emptyControlText: NistControlText = {
  statement: [],
  discussion: [],
  params: [],
  related: [],
  objectives: [],
  methods: [],
  references: [],
};

export function controlDetail(
  row: ControlRow,
  text: NistControlText | null,
  inScope: (id: string) => boolean,
): ControlDetail {
  const source = text ?? emptyControlText;
  return {
    ...source,
    ccis: ccisForControl(row.id),
    relatedInScope: source.related.filter(inScope),
    relatedOutOfScope: source.related.filter((id) => !inScope(id)),
  };
}
