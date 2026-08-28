/**
 * Chunk 4 of the CCI spine — the authorization package (PKG-).
 *
 * A package is not a folder of documents. It is a snapshot of the spine at a
 * point in time: every in-scope CCI, the verification that touched it, the
 * result, the evidence behind it, and whatever residual work is carried as
 * POA&M. The SSP / SAR / POA&M artifacts are *generated views* of that
 * snapshot, which is why each one names the objects it was assembled from.
 */

import type { Tone } from "@/components/app/ui";
import { ccis, rulesByCci } from "@/lib/catalog";
import { findings, isOpen } from "@/lib/findings";
import { objectives } from "@/lib/campaigns";

export type PackageState =
  | "Assembling"
  | "Internal review"
  | "Submitted"
  | "SCA review"
  | "Returned"
  | "Authorized";

export type Pkg = {
  id: string; // PKG-
  program: string; // PRG-
  system: string; // SYS-
  name: string;
  version: string;
  state: PackageState;
  decision: "ATO" | "ATO w/ conditions" | "IATT" | "Denial" | "Pending";
  snapshotAt: string;
  submittedTo: string;
  owner: string;
  boundary: string;
  ccisInScope: string[];
};

export type ArtifactKind = "SSP" | "SAR" | "POA&M" | "Appendix";

export type GeneratedArtifact = {
  id: string;
  pkg: string;
  kind: ArtifactKind;
  name: string;
  format: "OSCAL JSON" | "DOCX" | "XLSX" | "PDF";
  generated: string;
  pages: number;
  /** The spine objects this artifact was assembled from. */
  sources: string[];
  state: "Current" | "Stale" | "Not generated";
  note: string;
};

export type SubmissionEvent = {
  id: string;
  pkg: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

export const packageStateTone: Record<PackageState, Tone> = {
  Assembling: "neutral",
  "Internal review": "info",
  Submitted: "info",
  "SCA review": "info",
  Returned: "warning",
  Authorized: "success",
};

export const packages: Pkg[] = [
  {
    id: "PKG-0007",
    program: "PRG-1041",
    system: "SYS-2210",
    name: "Trident C2 — full authorization package",
    version: "v4.2",
    state: "SCA review",
    decision: "Pending",
    snapshotAt: "Aug 24, 09:12",
    submittedTo: "Navy AO staff (AODR: M. Okonjo)",
    owner: "Priya Raman",
    boundary: "Mission enclave, ground segment and tactical edge nodes.",
    ccisInScope: ["CCI-000765", "CCI-000015", "CCI-001199", "CCI-000169", "CCI-000366"],
  },
  {
    id: "PKG-0011",
    program: "PRG-1041",
    system: "SYS-2214",
    name: "Ground data platform — IATT package",
    version: "v1.3",
    state: "Returned",
    decision: "IATT",
    snapshotAt: "Aug 12, 16:40",
    submittedTo: "Navy AO staff",
    owner: "Dane Whitcombe",
    boundary: "Ground data platform only; excludes edge nodes.",
    ccisInScope: ["CCI-000169", "CCI-001199", "CCI-000366"],
  },
  {
    id: "PKG-0014",
    program: "PRG-1052",
    system: "SYS-2301",
    name: "Autonomy sandbox — assembling for MS-C",
    version: "v0.6",
    state: "Assembling",
    decision: "Pending",
    snapshotAt: "Aug 27, 07:55",
    submittedTo: "—",
    owner: "Lena Vogt",
    boundary: "Autonomy sandbox enclave, lab environment.",
    ccisInScope: ["CCI-000765", "CCI-000015", "CCI-000366"],
  },
];

export const artifacts: GeneratedArtifact[] = [
  {
    id: "ART-0091",
    pkg: "PKG-0007",
    kind: "SSP",
    name: "System Security Plan",
    format: "OSCAL JSON",
    generated: "Aug 24, 09:14",
    pages: 412,
    sources: ["Tailored baseline", "Component inheritance", "CCI implementation statements"],
    state: "Current",
    note: "Implementation narrative pulled per CCI; inherited statements marked with the providing component.",
  },
  {
    id: "ART-0092",
    pkg: "PKG-0007",
    kind: "SAR",
    name: "Security Assessment Report",
    format: "DOCX",
    generated: "Aug 24, 09:16",
    pages: 188,
    sources: ["TC-0031", "TC-0034", "Objective results", "Findings FND-*"],
    state: "Stale",
    note: "TE-0046 reported after generation — two new CAT II findings are not in this SAR.",
  },
  {
    id: "ART-0093",
    pkg: "PKG-0007",
    kind: "POA&M",
    name: "Plan of Action and Milestones",
    format: "XLSX",
    generated: "Aug 26, 18:02",
    pages: 24,
    sources: ["Open findings", "Milestones", "Risk acceptance rationale"],
    state: "Current",
    note: "One row per open finding, scheduled completion carried from the milestone due dates.",
  },
  {
    id: "ART-0094",
    pkg: "PKG-0007",
    kind: "Appendix",
    name: "Appendix E — hardware/software inventory",
    format: "XLSX",
    generated: "Aug 24, 09:17",
    pages: 61,
    sources: ["Asset inventory AST-*"],
    state: "Current",
    note: "Generated from the asset register; environment and owner carried through.",
  },
  {
    id: "ART-0095",
    pkg: "PKG-0007",
    kind: "Appendix",
    name: "Appendix J — continuous monitoring strategy",
    format: "PDF",
    generated: "—",
    pages: 0,
    sources: ["ConMon plan"],
    state: "Not generated",
    note: "Blocked: no monitoring frequency recorded for three CCIs in scope.",
  },
  {
    id: "ART-0101",
    pkg: "PKG-0011",
    kind: "SSP",
    name: "System Security Plan (IATT scope)",
    format: "OSCAL JSON",
    generated: "Aug 12, 16:41",
    pages: 210,
    sources: ["Tailored baseline", "CCI implementation statements"],
    state: "Stale",
    note: "Boundary changed after the return; regenerate before resubmission.",
  },
  {
    id: "ART-0102",
    pkg: "PKG-0011",
    kind: "POA&M",
    name: "Plan of Action and Milestones",
    format: "XLSX",
    generated: "Aug 12, 16:42",
    pages: 9,
    sources: ["Open findings"],
    state: "Stale",
    note: "Two items closed since generation.",
  },
  {
    id: "ART-0111",
    pkg: "PKG-0014",
    kind: "SSP",
    name: "System Security Plan (draft)",
    format: "OSCAL JSON",
    generated: "Aug 27, 07:56",
    pages: 96,
    sources: ["Tailored baseline"],
    state: "Current",
    note: "Implementation statements missing for 14 CCIs.",
  },
];

export const submissions: SubmissionEvent[] = [
  {
    id: "SUB-0031",
    pkg: "PKG-0007",
    at: "Aug 26, 18:05",
    actor: "Priya Raman",
    action: "POA&M regenerated",
    detail: "Two findings closed, one new CAT II added from TE-0046.",
  },
  {
    id: "SUB-0030",
    pkg: "PKG-0007",
    at: "Aug 25, 11:20",
    actor: "M. Okonjo (AODR)",
    action: "Observation logged",
    detail: "Requested sampling rationale for CCI-001199 audit offload testing.",
  },
  {
    id: "SUB-0029",
    pkg: "PKG-0007",
    at: "Aug 24, 09:30",
    actor: "Priya Raman",
    action: "Submitted to SCA",
    detail: "v4.2 snapshot locked; read-only enclave grant issued to the assessor team.",
  },
  {
    id: "SUB-0022",
    pkg: "PKG-0011",
    at: "Aug 18, 14:02",
    actor: "SCA — Whitcombe LLP",
    action: "Returned",
    detail: "Boundary diagram did not match the asset inventory; IATT held at 90 days.",
  },
  {
    id: "SUB-0018",
    pkg: "PKG-0011",
    at: "Aug 12, 16:45",
    actor: "Dane Whitcombe",
    action: "Submitted to SCA",
    detail: "v1.3 snapshot for interim testing authority.",
  },
];

export type TraceRow = {
  cci: string;
  control: string;
  statement: string;
  /** How the CCI is meant to be verified. */
  paths: string[];
  /** Objective(s) that claim to prove it. */
  objectives: string[];
  result: "Met" | "Partially met" | "Not met" | "Not run";
  openFindings: number;
  worstSeverity: string;
  /** Whether the row is complete enough to ship in the package. */
  gap: string | null;
};

const cciById = new Map(ccis.map((c) => [c.id, c]));

export function traceability(pkg: Pkg): TraceRow[] {
  return pkg.ccisInScope.map((id) => {
    const cci = cciById.get(id);
    const objs = objectives.filter((o) => o.ccis.includes(id));
    const open = findings.filter((f) => f.cci === id && isOpen(f));
    const worst =
      open.find((f) => f.mitigatedSeverity === "CAT I")?.mitigatedSeverity ??
      open.find((f) => f.mitigatedSeverity === "CAT II")?.mitigatedSeverity ??
      open[0]?.mitigatedSeverity ??
      "—";

    let result: TraceRow["result"] = "Not run";
    if (objs.some((o) => o.result === "Not met")) result = "Not met";
    else if (objs.some((o) => o.result === "Partially met")) result = "Partially met";
    else if (objs.length > 0 && objs.every((o) => o.result === "Met")) result = "Met";
    else if (objs.some((o) => o.result === "Met")) result = "Partially met";

    let gap: string | null = null;
    if (objs.length === 0) gap = "No test objective names this CCI";
    else if (result === "Not run") gap = "Objective written but never executed";
    else if (open.length > 0 && result === "Met") gap = "Marked met while findings remain open";
    else if (result === "Not met" && open.length === 0)
      gap = "Failed objective with no finding recorded";

    return {
      cci: id,
      control: cci?.control ?? "—",
      statement: cci?.definition ?? "Statement not in the loaded catalog slice.",
      paths: (rulesByCci.get(id) ?? []).map((r) => r.id),
      objectives: objs.map((o) => o.id),
      result,
      openFindings: open.length,
      worstSeverity: worst,
      gap,
    };
  });
}

export function readiness(pkg: Pkg) {
  const rows = traceability(pkg);
  const gaps = rows.filter((r) => r.gap);
  const arts = artifacts.filter((a) => a.pkg === pkg.id);
  const stale = arts.filter((a) => a.state !== "Current");
  return {
    rows,
    gaps,
    artifacts: arts,
    stale,
    coverage: rows.length === 0 ? 0 : Math.round(((rows.length - gaps.length) / rows.length) * 100),
    openFindings: rows.reduce((n, r) => n + r.openFindings, 0),
    shippable: gaps.length === 0 && stale.length === 0,
  };
}

export function submissionsFor(pkgId: string) {
  return submissions.filter((s) => s.pkg === pkgId);
}
