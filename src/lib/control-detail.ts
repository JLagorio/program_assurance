/**
 * Full control detail for a single matrix row: the 800-53 statement and
 * discussion text, assessment objectives, parameters, related controls, and
 * the CCI decomposition where the catalog covers the control.
 *
 * The catalog only carries verbatim CCIs for a handful of controls, so the
 * statement/discussion text is generated deterministically from the family
 * and title — the same control always reads the same, and the shape matches
 * 800-53 (statement, supplemental guidance, assessment objective, references).
 */

import { ccisByControl, type Cci } from "@/lib/catalog";
import type { ControlRow } from "@/lib/control-matrix";

export type ControlDetail = {
  /** 800-53 control statement, broken into lettered items. */
  statement: string[];
  /** Supplemental guidance paragraph. */
  guidance: string;
  /** 800-53A assessment objective the SCA tests against. */
  objective: string;
  /** Assignment/selection parameters the program must set. */
  parameters: string[];
  related: string[];
  references: string[];
  ccis: Cci[];
};

const familyVerb: Record<string, string> = {
  AC: "manage access to the system",
  AU: "capture, protect, and review audit records",
  CA: "assess, authorize, and continuously monitor controls",
  CM: "establish and enforce baseline configurations",
  CP: "plan for and recover from disruptive events",
  IA: "uniquely identify and authenticate users and devices",
  IR: "detect, report, and respond to incidents",
  RA: "categorize and assess risk to the system",
  SC: "protect the system boundary and communications",
  SI: "identify, remediate, and prevent flaws and malicious activity",
};

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h;
}

function baseId(id: string) {
  return id.replace(/\(\d+\)$/, "");
}

const referencePool = [
  "NIST SP 800-53 Rev. 5",
  "NIST SP 800-53A Rev. 5",
  "CNSSI 1253",
  "DoDI 8510.01",
  "FIPS 199",
  "FIPS 200",
  "SP 800-37 Rev. 2",
  "SP 800-30 Rev. 1",
];

export function controlDetail(row: ControlRow): ControlDetail {
  const h = hash(row.id);
  const verb = familyVerb[row.family] ?? "satisfy the security requirement";
  const lower = row.title.toLowerCase();
  const enhancement = /\(\d+\)$/.test(row.id);

  const statement = [
    `Develop, document, and maintain ${lower} capabilities that ${verb} for ${row.familyName.toLowerCase()}.`,
    `Define, document, and apply organization-defined values for each ${lower} parameter before the control is assessed.`,
    `Review and update the ${lower} implementation ${h % 2 === 0 ? "annually" : "at least every 18 months"} and following significant changes to the system.`,
    ...(enhancement
      ? [
          `Enhancement: extend the base control (${baseId(row.id)}) so that ${lower.replace(/^.*—\s*enhancement\s*\d+$/, "the enhanced capability")} is enforced wherever the base control applies.`,
        ]
      : []),
  ];

  const guidance =
    `${row.title} is satisfied when the control is implemented consistently across the system boundary, ` +
    `evidence is current, and exceptions are tracked to closure. For ${row.familyName.toLowerCase()}, ` +
    `assessors expect the implementation statement, the responsible owner (${row.owner}), and recent ` +
    `test results to agree. ${row.implementation === "Inherited" ? "This control inherits from a common control provider; the program is responsible for reviewing the provider's evidence and documenting any residual responsibility." : "Where parts of the requirement are met by another layer, document the split so the assessor can trace each objective to an owner."}`;

  const objective = `Determine whether the organization ${verb} in accordance with the ${lower} requirement, and whether the implementation is operating as intended.`;

  const parameters = [
    `Frequency of review: organization-defined (currently ${h % 2 === 0 ? "annual" : "semi-annual"})`,
    `Personnel or roles responsible: organization-defined`,
    `Events requiring reassessment: organization-defined`,
  ].slice(0, 2 + (h % 2));

  const related: string[] = [];
  const fam = row.family;
  const n = Number(baseId(row.id).split("-")[1] ?? 1);
  for (const d of [1, 2, 3]) {
    if (related.length >= 3) break;
    const cand = `${fam}-${Math.max(1, n + ((h + d * 3) % 5) - 2)}`;
    if (cand !== baseId(row.id) && !related.includes(cand)) related.push(cand);
  }

  const references = [
    referencePool[0]!,
    referencePool[1]!,
    referencePool[2 + (h % (referencePool.length - 2))]!,
  ].filter((v, i, a) => a.indexOf(v) === i);

  return {
    statement,
    guidance,
    objective,
    parameters,
    related,
    references,
    ccis: ccisByControl.get(row.id) ?? [],
  };
}
