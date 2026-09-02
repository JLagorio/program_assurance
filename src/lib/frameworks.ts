/**
 * Framework editions a program can select its controls from.
 *
 * `§5.1`: framework content is versioned source data and a program stays
 * traceable to the exact edition it decided against. Only the edition that is
 * actually in the catalog is selectable; the others are listed with the reason
 * they are not, so the choice is a fact rather than a hidden option.
 */

import { catalogVersion, nistControls } from "@/lib/nist-catalog";

export type FrameworkId = "nist-800-53-r5" | "nist-800-53-r4" | "nist-800-171-r2" | "iso-27001";

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
  {
    id: "nist-800-53-r4",
    name: "NIST SP 800-53 Rev. 4",
    version: "4.0 (2015-01-22)",
    policy: "CNSSI 1253",
    controls: 0,
    available: false,
    reason: "Withdrawn edition — not in the catalog",
  },
  {
    id: "nist-800-171-r2",
    name: "NIST SP 800-171 Rev. 2",
    version: "2.0 (2021-01-28)",
    policy: "CUI baseline",
    controls: 0,
    available: false,
    reason: "Not imported — no OSCAL source loaded",
  },
  {
    id: "iso-27001",
    name: "ISO/IEC 27001:2022",
    version: "2022",
    policy: "Annex A",
    controls: 0,
    available: false,
    reason: "Not imported — licensed content",
  },
];

export const frameworkById = new Map(frameworks.map((f) => [f.id, f]));

export const defaultFramework: FrameworkId = "nist-800-53-r5";
