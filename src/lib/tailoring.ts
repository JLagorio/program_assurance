/* --------------------------------------------------- Smart tailoring engine
   Phase 1 of the weapon-system lifecycle: an SSE sits with the program
   manager, describes the system, and the engine derives the NIST SP 800-53
   Rev. 5 baseline plus the DoD/CNSSI 1253 overlays that apply. The program
   manager then approves the resulting compliance scope before engineering
   commits to it. */

import type { Tone } from "@/components/app/ui";
import { baselineCounts, type ImpactLevel } from "./grc-data";

export type SystemClass =
  | "Tactical / deployed"
  | "Enterprise IT"
  | "Space platform"
  | "Embedded weapon system";

export type Hosting =
  | "Hardware / platform"
  | "Cloud (IL4)"
  | "Cloud (IL5)"
  | "SaaS component"
  | "Hybrid";

export type Classification = "Unclassified" | "CUI" | "Secret" | "TS/SCI";

export type Connectivity = "Continuous" | "Intermittent (DDIL)" | "Standalone";

export type SystemParameters = {
  confidentiality: ImpactLevel;
  integrity: ImpactLevel;
  availability: ImpactLevel;
  systemClass: SystemClass;
  hosting: Hosting;
  classification: Classification;
  connectivity: Connectivity;
  handlesPii: boolean;
  crossDomain: boolean;
  safetyCritical: boolean;
};

export const defaultParameters: SystemParameters = {
  confidentiality: "High",
  integrity: "High",
  availability: "Moderate",
  systemClass: "Tactical / deployed",
  hosting: "Hardware / platform",
  classification: "Secret",
  connectivity: "Intermittent (DDIL)",
  handlesPii: false,
  crossDomain: false,
  safetyCritical: true,
};

export const systemClasses: SystemClass[] = [
  "Tactical / deployed",
  "Enterprise IT",
  "Space platform",
  "Embedded weapon system",
];
export const hostingOptions: Hosting[] = [
  "Hardware / platform",
  "Cloud (IL4)",
  "Cloud (IL5)",
  "SaaS component",
  "Hybrid",
];
export const classifications: Classification[] = ["Unclassified", "CUI", "Secret", "TS/SCI"];
export const connectivityOptions: Connectivity[] = [
  "Continuous",
  "Intermittent (DDIL)",
  "Standalone",
];
export const impactLevels: ImpactLevel[] = ["Low", "Moderate", "High"];

/* ------------------------------------------------------------- Overlays */

export type OverlayControl = {
  id: string;
  title: string;
  action: "Added" | "Tailored out" | "Parameter set";
  rationale: string;
};

export type Overlay = {
  id: string;
  name: string;
  authority: string;
  /** Why this overlay was selected for the system as parameterized. */
  trigger: string;
  controls: OverlayControl[];
};

const overlayCatalog: (Overlay & { applies: (p: SystemParameters) => boolean })[] = [
  {
    id: "CNSSI-1253-SPACE",
    name: "Space platform overlay",
    authority: "CNSSI 1253F Attachment 2",
    trigger: "System class is a space platform",
    applies: (p) => p.systemClass === "Space platform",
    controls: [
      { id: "AC-17(9)", title: "Disconnect or disable access", action: "Added", rationale: "Ground segment must sever remote links on command." },
      { id: "CP-2(6)", title: "Alternate processing / storage site", action: "Added", rationale: "Alternate TT&C ground station required." },
      { id: "SC-40", title: "Wireless link protection", action: "Added", rationale: "Uplink/downlink anti-jam and spoofing protection." },
      { id: "SI-4(18)", title: "Analyze traffic / covert exfiltration", action: "Added", rationale: "Bus telemetry monitored for anomalous command traffic." },
      { id: "PE-3", title: "Physical access control", action: "Tailored out", rationale: "On-orbit segment has no reachable physical perimeter." },
    ],
  },
  {
    id: "CNSSI-1253-TACT",
    name: "Tactical / DDIL overlay",
    authority: "CNSSI 1253 tactical appendix",
    trigger: "Tactical or embedded system operating in a DDIL environment",
    applies: (p) =>
      (p.systemClass === "Tactical / deployed" || p.systemClass === "Embedded weapon system") &&
      p.connectivity !== "Continuous",
    controls: [
      { id: "AU-4(1)", title: "Transfer to alternate storage", action: "Added", rationale: "Audit offload deferred until reachback is restored." },
      { id: "CP-10(4)", title: "Restore within time period", action: "Added", rationale: "Mission-defined restore window in degraded comms." },
      { id: "IA-5(2)", title: "PKI-based authentication", action: "Parameter set", rationale: "Cached credential validity set to mission duration." },
      { id: "SI-2(5)", title: "Automatic security-relevant updates", action: "Tailored out", rationale: "Push updates infeasible without persistent link." },
      { id: "MA-4", title: "Nonlocal maintenance", action: "Tailored out", rationale: "No nonlocal maintenance path exists in the field." },
    ],
  },
  {
    id: "CNSSI-1253-CLASS",
    name: "Classified information overlay",
    authority: "CNSSI 1253 Appendix F",
    trigger: "System processes Secret or higher",
    applies: (p) => p.classification === "Secret" || p.classification === "TS/SCI",
    controls: [
      { id: "AC-4(6)", title: "Metadata-based flow control", action: "Added", rationale: "Classification labels enforced on all flows." },
      { id: "MP-6(2)", title: "Equipment testing (sanitization)", action: "Added", rationale: "Classified media destruction verification." },
      { id: "PE-19(1)", title: "National emissions policies", action: "Added", rationale: "TEMPEST controls per CNSSAM TEMPEST 01-02." },
      { id: "SC-8(3)", title: "Cryptographic protection for message externals", action: "Added", rationale: "NSA type-1 protection of header data." },
    ],
  },
  {
    id: "CDS",
    name: "Cross domain solution overlay",
    authority: "NCDSMO Raise-the-Bar",
    trigger: "System transfers data between security domains",
    applies: (p) => p.crossDomain,
    controls: [
      { id: "AC-4(2)", title: "Flow control — protected processing domains", action: "Added", rationale: "Filter enforcement on the high-to-low path." },
      { id: "AC-4(8)", title: "Security / privacy policy filters", action: "Added", rationale: "Dirty-word and format filters required by RTB." },
      { id: "SC-7(21)", title: "Isolation of system components", action: "Added", rationale: "Physically separated upgrade / downgrade paths." },
    ],
  },
  {
    id: "PRIV",
    name: "Privacy overlay (moderate PII)",
    authority: "CNSSI 1253 Privacy Overlay",
    trigger: "System stores or processes PII",
    applies: (p) => p.handlesPii,
    controls: [
      { id: "PT-3", title: "PII processing purposes", action: "Added", rationale: "Documented authorized processing purposes." },
      { id: "PT-5", title: "Privacy notice", action: "Added", rationale: "Notice required at collection points." },
      { id: "SI-18", title: "PII quality operations", action: "Added", rationale: "Correction workflow for inaccurate records." },
    ],
  },
  {
    id: "SRG-IL5",
    name: "DoD Cloud Computing SRG IL5",
    authority: "DISA CC SRG v1r4",
    trigger: "Hosted on cloud or SaaS infrastructure",
    applies: (p) =>
      p.hosting === "Cloud (IL4)" || p.hosting === "Cloud (IL5)" || p.hosting === "SaaS component" || p.hosting === "Hybrid",
    controls: [
      { id: "SA-9(5)", title: "Processing, storage and service location", action: "Added", rationale: "US-only regions with cleared personnel." },
      { id: "SC-7(4)", title: "External telecommunications services", action: "Added", rationale: "BCAP / CAP connection through the DISN." },
      { id: "CA-3(6)", title: "Transfer authorizations", action: "Added", rationale: "Inherited CSP boundary documented in the SSP." },
    ],
  },
  {
    id: "SAFETY",
    name: "Safety-critical system overlay",
    authority: "MIL-STD-882E / JSSSEH alignment",
    trigger: "System performs a safety-critical function",
    applies: (p) => p.safetyCritical,
    controls: [
      { id: "SA-11(1)", title: "Static code analysis", action: "Added", rationale: "Safety-critical software assurance evidence." },
      { id: "SI-10(3)", title: "Predictable behavior on invalid input", action: "Added", rationale: "Fail-safe behavior for weapon release logic." },
      { id: "SR-4(3)", title: "Validate as genuine and not altered", action: "Added", rationale: "Anti-tamper of mission-critical components." },
    ],
  },
  {
    id: "STANDALONE",
    name: "Standalone / non-networked overlay",
    authority: "CNSSI 1253 tailoring guidance",
    trigger: "System has no external network connection",
    applies: (p) => p.connectivity === "Standalone",
    controls: [
      { id: "SC-7", title: "Boundary protection", action: "Tailored out", rationale: "No external boundary exists." },
      { id: "AC-17", title: "Remote access", action: "Tailored out", rationale: "Remote access is not permitted or possible." },
      { id: "MP-5", title: "Media transport", action: "Added", rationale: "Sneakernet is the only data path; transport is controlled." },
    ],
  },
];

/* -------------------------------------------------------------- Engine */

export type TailoringResult = {
  impact: ImpactLevel;
  baselineLabel: string;
  baselineCount: number;
  overlays: Overlay[];
  added: OverlayControl[];
  removed: OverlayControl[];
  parameterized: OverlayControl[];
  total: number;
};

const rank: Record<ImpactLevel, number> = { Low: 0, Moderate: 1, High: 2 };

export function highWaterMark(p: SystemParameters): ImpactLevel {
  return [p.confidentiality, p.integrity, p.availability].reduce((a, b) =>
    rank[a] >= rank[b] ? a : b,
  );
}

export function computeTailoring(p: SystemParameters): TailoringResult {
  const impact = highWaterMark(p);
  const baselineCount = baselineCounts[impact];
  const overlays = overlayCatalog
    .filter((o) => o.applies(p))
    .map(({ applies: _applies, ...o }) => o);

  const all = overlays.flatMap((o) => o.controls);
  const added = all.filter((c) => c.action === "Added");
  const removed = all.filter((c) => c.action === "Tailored out");
  const parameterized = all.filter((c) => c.action === "Parameter set");

  return {
    impact,
    baselineLabel: `NIST SP 800-53 Rev. 5 — ${impact}`,
    baselineCount,
    overlays,
    added,
    removed,
    parameterized,
    total: baselineCount + added.length - removed.length,
  };
}

export function overlayFor(control: OverlayControl, result: TailoringResult) {
  return result.overlays.find((o) => o.controls.includes(control));
}

/* ------------------------------------------------------- Scope approval */

export type ApprovalState = "Draft" | "Pending PM approval" | "Approved" | "Changes requested";

export const approvalTone: Record<ApprovalState, Tone> = {
  Draft: "neutral",
  "Pending PM approval": "warning",
  Approved: "success",
  "Changes requested": "danger",
};

export type ScopeApproval = {
  programId: string;
  state: ApprovalState;
  submittedBy: string;
  submitted: string;
  decidedBy: string | null;
  decided: string | null;
  note: string | null;
  controlCount: number;
  overlayCount: number;
};

export const scopeApprovals: ScopeApproval[] = [
  {
    programId: "PRG-1041",
    state: "Pending PM approval",
    submittedBy: "Sarah Chen (SSE)",
    submitted: "Aug 26, 09:14",
    decidedBy: null,
    decided: null,
    note: null,
    controlCount: 383,
    overlayCount: 4,
  },
  {
    programId: "PRG-1028",
    state: "Approved",
    submittedBy: "Marcus Ryde (SSE)",
    submitted: "Jul 30, 13:02",
    decidedBy: "R. Feldman (PM)",
    decided: "Aug 01, 08:45",
    note: "Scope accepted; privacy overlay funded under FY27.",
    controlCount: 294,
    overlayCount: 2,
  },
  {
    programId: "PRG-1015",
    state: "Changes requested",
    submittedBy: "Dana Whitlock (SSE)",
    submitted: "Aug 12, 16:30",
    decidedBy: "L. Ortega (PM)",
    decided: "Aug 14, 11:20",
    note: "Tactical overlay must apply — the ground kit deploys forward.",
    controlCount: 176,
    overlayCount: 1,
  },
];

export type ScopeEvent = { at: string; actor: string; text: string; tone: Tone };

export const scopeHistory: Record<string, ScopeEvent[]> = {
  "PRG-1041": [
    { at: "Aug 26, 09:14", actor: "Sarah Chen (SSE)", text: "Submitted tailored scope for PM approval — 383 controls, 4 overlays", tone: "info" },
    { at: "Aug 26, 09:02", actor: "Sarah Chen (SSE)", text: "Applied classified information overlay after classification changed to Secret", tone: "neutral" },
    { at: "Aug 24, 15:41", actor: "Sarah Chen (SSE)", text: "Categorized C:High I:High A:Moderate — High baseline selected", tone: "neutral" },
  ],
};
