/**
 * Framework editions a program can select its controls from.
 *
 * `§5.1`: framework content is versioned source data and a program stays
 * traceable to the exact edition it decided against.
 *
 * One edition is imported. The Rev. 4, SP 800-171 and ISO 27001 rows that used
 * to sit here carried `controls: 0` and `available: false` — they described
 * editions nobody had loaded, so they were removed rather than kept as
 * permanently disabled options. `available` and `reason` stay on the type: the
 * moment a second catalog is generated, the one that is not in it has to say so.
 */

import { catalogVersion, nistControls } from "@/lib/nist-catalog";

export type FrameworkId = "nist-800-53-r5";

export type Framework = {
  id: FrameworkId;
  name: string;
  /** Immutable edition identifier. */
  version: string;
  /** How a categorization selects from it. */
  policy: string;
  controls: number;
  available: boolean;
  /** Why it cannot be chosen, when it cannot. */
  reason: string | null;
};

export const frameworks: Framework[] = [
  {
    id: "nist-800-53-r5",
    name: "NIST SP 800-53 Rev. 5",
    version: catalogVersion,
    policy: "CNSSI 1253",
    controls: nistControls.length,
    available: true,
    reason: null,
  },
];

export const frameworkById = new Map(frameworks.map((f) => [f.id, f]));

export const defaultFramework: FrameworkId = "nist-800-53-r5";

/* ---------------------------------------------------------- Edition changes */

/**
 * Control text that changed between editions. A derivation that cites the
 * control goes suspect until someone re-reads the requirement against the new
 * text; the DOORS rule, applied to the one link where the framework is the
 * upstream.
 */
export type EditionChange = {
  control: string;
  edition: string;
  on: string;
  summary: string;
};

export const editionChanges: EditionChange[] = [
  {
    control: "SC-12",
    edition: "Rev. 5.1.1",
    on: "Aug 29, 2026",
    summary: "The key-establishment parameter now names the cryptoperiod.",
  },
];
