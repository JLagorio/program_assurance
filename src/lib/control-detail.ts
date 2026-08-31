/**
 * Full control detail for a single matrix row.
 *
 * All of the requirement text is real: the SP 800-53 Rev. 5 statement,
 * discussion, organization-defined parameters and references come straight from
 * the NIST OSCAL catalog, and the assessment objectives and methods are the
 * SP 800-53A procedures the assessor executes. The only thing this module adds
 * is the join to the program's own records — the DISA CCI decomposition, and
 * which related controls the program actually carries.
 *
 * The text lives in a large generated module, so a caller loads it (a route
 * loader) and passes it in rather than importing it here.
 */

import { ccisByControl, type Cci } from "@/lib/catalog";
import type { ControlRow } from "@/lib/control-matrix";
import type { NistControlText } from "@/lib/nist-catalog";

export type ControlDetail = NistControlText & {
  /** DISA CCIs decomposing this control, where the list covers it. */
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
    ccis: ccisByControl.get(row.id) ?? [],
    relatedInScope: source.related.filter(inScope),
    relatedOutOfScope: source.related.filter((id) => !inScope(id)),
  };
}
