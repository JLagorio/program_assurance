/**
 * The per-program control matrix — the object the RMF program actually turns on.
 *
 * Every tailored control gets one row: assessment status, who implements it,
 * the POA&M section that carries the remediation, the findings that knocked it
 * down, a next action and a due date. Coverage percentages, the family
 * breakdown and the Overview coverage band are all derived from these rows, so
 * editing a control (or a finding rolling into a POA&M) moves the numbers.
 *
 * Data is deterministic mock data plus a small in-memory override store so
 * inline edits persist for the session.
 */

import { useSyncExternalStore } from "react";

import { controlFamilies, programControls } from "@/lib/grc-data";
import { findings, isOpen, type Finding } from "@/lib/findings";
import { poamItems } from "@/lib/register";
import { inheritanceForProgram, staleThresholdDays } from "@/lib/reusable-components";
import { workstreamsForProgram } from "@/lib/people";
import { parseGateDate } from "@/lib/program-stage";
import { gatesForProgram } from "@/lib/grc-data";

export const controlStatuses = [
  "Satisfied",
  "Partial",
  "Other than satisfied",
  "Not assessed",
] as const;
export type ControlStatus = (typeof controlStatuses)[number];

export const controlStatusTone: Record<
  ControlStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  Satisfied: "success",
  Partial: "warning",
  "Other than satisfied": "danger",
  "Not assessed": "neutral",
};

export const implementations = ["System", "Inherited", "Hybrid", "Planned"] as const;
export type Implementation = (typeof implementations)[number];

export type ControlRow = {
  id: string;
  title: string;
  family: string;
  familyName: string;
  status: ControlStatus;
  implementation: Implementation;
  source: string;
  owner: string;
  assessed: string;
  /** "Sep 12, 2026" or "—". Remediation target when not satisfied. */
  due: string;
  /** POAM- id carrying the remediation, when one exists. */
  poam: string | null;
  findings: Finding[];
  openFindings: number;
  nextAction: string;
  workstream: string | null;
  stale: boolean;
};

/* --------------------------------------------------------- generation */

const titlePool: Record<string, string[]> = {
  AC: [
    "Policy and procedures",
    "Account management",
    "Access enforcement",
    "Information flow enforcement",
    "Separation of duties",
    "Least privilege",
    "Unsuccessful logon attempts",
    "System use notification",
    "Concurrent session control",
    "Session lock",
    "Session termination",
    "Permitted actions without identification",
    "Remote access",
    "Wireless access",
    "Access control for mobile devices",
    "Use of external systems",
    "Information sharing",
    "Publicly accessible content",
    "Data mining protection",
    "Access control decisions",
  ],
  AU: [
    "Policy and procedures",
    "Event logging",
    "Content of audit records",
    "Audit log storage capacity",
    "Response to audit logging failures",
    "Audit record review, analysis and reporting",
    "Audit record reduction and report generation",
    "Time stamps",
    "Protection of audit information",
    "Non-repudiation",
    "Audit record retention",
    "Audit record generation",
  ],
  CA: [
    "Policy and procedures",
    "Control assessments",
    "Information exchange",
    "Plan of action and milestones",
    "Authorization",
    "Continuous monitoring",
    "Penetration testing",
    "Internal system connections",
  ],
  CM: [
    "Policy and procedures",
    "Baseline configuration",
    "Configuration change control",
    "Impact analyses",
    "Access restrictions for change",
    "Configuration settings",
    "Least functionality",
    "System component inventory",
    "Configuration management plan",
    "Software usage restrictions",
    "User-installed software",
    "Signed components",
  ],
  CP: [
    "Policy and procedures",
    "Contingency plan",
    "Contingency training",
    "Contingency plan testing",
    "Alternate storage site",
    "Alternate processing site",
    "Telecommunications services",
    "System backup",
    "System recovery and reconstitution",
    "Alternate communications protocols",
  ],
  IA: [
    "Policy and procedures",
    "Identification and authentication (organizational users)",
    "Device identification and authentication",
    "Identifier management",
    "Authenticator management",
    "Authentication feedback",
    "Cryptographic module authentication",
    "Identification and authentication (non-organizational users)",
    "Service identification and authentication",
    "Re-authentication",
  ],
  IR: [
    "Policy and procedures",
    "Incident response training",
    "Incident response testing",
    "Incident handling",
    "Incident monitoring",
    "Incident reporting",
    "Incident response assistance",
    "Incident response plan",
    "Information spillage response",
    "Integrated information security analysis team",
  ],
  RA: [
    "Policy and procedures",
    "Security categorization",
    "Risk assessment",
    "Vulnerability monitoring and scanning",
    "Technical surveillance countermeasures survey",
    "Risk response",
    "Criticality analysis",
    "Threat hunting",
  ],
  SC: [
    "Policy and procedures",
    "Separation of system and user functionality",
    "Security function isolation",
    "Denial-of-service protection",
    "Boundary protection",
    "Transmission confidentiality and integrity",
    "Network disconnect",
    "Cryptographic key establishment and management",
    "Cryptographic protection",
    "Collaborative computing devices",
    "Public key infrastructure certificates",
    "Mobile code",
    "Secure name/address resolution",
    "Session authenticity",
    "Protection of information at rest",
    "Process isolation",
    "Operations security",
    "Covert channel analysis",
  ],
  SI: [
    "Policy and procedures",
    "Flaw remediation",
    "Malicious code protection",
    "System monitoring",
    "Security alerts, advisories and directives",
    "Security and privacy function verification",
    "Software, firmware and information integrity",
    "Spam protection",
    "Information input validation",
    "Error handling",
    "Information management and retention",
    "Memory protection",
    "Fail-safe procedures",
  ],
};

const genericTitles = [
  "Policy and procedures",
  "Implementation statement",
  "Continuous monitoring",
  "Supporting evidence",
];

function controlId(family: string, i: number) {
  const base = Math.floor(i / 3) + 1;
  const enh = i % 3;
  return enh === 0 ? `${family}-${base}` : `${family}-${base}(${enh})`;
}

function titleFor(family: string, i: number) {
  const pool = titlePool[family] ?? genericTitles;
  const base = pool[Math.floor(i / 3) % pool.length]!;
  const enh = i % 3;
  return enh === 0 ? base : `${base} — enhancement ${enh}`;
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmt(d: Date) {
  return `${monthNames[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}, ${d.getUTCFullYear()}`;
}

function shift(from: Date, days: number) {
  return fmt(new Date(from.getTime() + days * 86_400_000));
}

/** Deterministic per-program jitter so two programs don't look identical. */
function seed(programId: string) {
  let h = 0;
  for (const ch of programId) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  return h;
}

function nextActionFor(row: Omit<ControlRow, "nextAction">): string {
  if (row.openFindings > 0)
    return `Remediate ${row.openFindings} open finding${row.openFindings > 1 ? "s" : ""}`;
  if (row.status === "Other than satisfied") return "Open a POA&M section";
  if (row.status === "Partial") return "Complete implementation statement";
  if (row.status === "Not assessed") return "Schedule assessment";
  if (row.stale) return "Refresh inherited evidence";
  return "—";
}

function buildMatrix(programId: string): ControlRow[] {
  const inheritance = inheritanceForProgram(programId);
  const poams = poamItems.filter((p) => p.program === programId);
  const authored = new Map(programControls.map((c) => [c.id, c]));

  const findingsByControl = new Map<string, Finding[]>();
  const poamById = new Map(poams.map((p) => [p.id, p]));
  for (const f of findings) {
    if (!f.poam || !poamById.has(f.poam)) continue;
    const list = findingsByControl.get(f.control) ?? [];
    list.push(f);
    findingsByControl.set(f.control, list);
  }

  const workstreamByControl = new Map<string, string>();
  for (const w of workstreamsForProgram(programId)) {
    for (const c of w.controls) if (!workstreamByControl.has(c)) workstreamByControl.set(c, w.id);
  }

  const gates = gatesForProgram(programId);
  const nextGate = gates.find((g) => g.status !== "Complete");
  const anchor = (nextGate && parseGateDate(nextGate.planned)) || new Date();
  const jitter = seed(programId);

  const rows: ControlRow[] = [];

  for (const fam of controlFamilies) {
    // Spread the family rollup across the list deterministically so the matrix
    // doesn't read as one satisfied block followed by one failing block.
    const order = Array.from({ length: fam.total }, (_, n) => n).sort(
      (a, b) => ((a * 7919 + jitter) % 1013) - ((b * 7919 + jitter) % 1013),
    );
    const statusByIndex = new Array<ControlStatus>(fam.total).fill("Not assessed");
    order.forEach((idx, rank) => {
      statusByIndex[idx] =
        rank < fam.satisfied
          ? "Satisfied"
          : rank < fam.satisfied + fam.other
            ? "Partial"
            : rank < fam.satisfied + fam.other + fam.failing
              ? "Other than satisfied"
              : "Not assessed";
    });

    for (let i = 0; i < fam.total; i++) {
      const id = controlId(fam.id, i);
      const author = authored.get(id);
      const edge = inheritance.get(id);
      const fnds = findingsByControl.get(id) ?? [];
      const open = fnds.filter(isOpen);

      // Baseline distribution matches the family rollup, then real signals win.
      let status: ControlStatus = statusByIndex[i]!;

      if (author) {
        status =
          author.assessment === "Satisfied"
            ? "Satisfied"
            : author.assessment === "Not assessed"
              ? "Not assessed"
              : author.implementation === "Partially implemented"
                ? "Partial"
                : "Other than satisfied";
      }
      if (open.length > 0) status = "Other than satisfied";

      const implementation: Implementation = edge
        ? "Inherited"
        : author?.implementation === "Planned"
          ? "Planned"
          : author?.implementation === "Partially implemented"
            ? "Hybrid"
            : status === "Not assessed"
              ? "Planned"
              : "System";

      const poam = open.find((f) => f.poam)?.poam ?? null;
      const stale = !!edge && edge.control.evidenceAge > staleThresholdDays;

      const due =
        status === "Satisfied"
          ? "—"
          : poam
            ? (poamById.get(poam)?.scheduledCompletion ?? shift(anchor, 14))
            : shift(anchor, ((i * 7 + jitter) % 90) - 10);

      const assessed =
        status === "Not assessed"
          ? "—"
          : (author?.assessed ?? shift(anchor, -30 - ((i + jitter) % 60)));

      const partial: Omit<ControlRow, "nextAction"> = {
        id,
        title: author?.title ?? titleFor(fam.id, i),
        family: fam.id,
        familyName: fam.name,
        status,
        implementation,
        source: edge
          ? `${edge.component.name} (inherited)`
          : (author?.source ?? "System-implemented"),
        owner: fam.owner,
        assessed,
        due,
        poam,
        findings: fnds,
        openFindings: open.length,
        workstream: workstreamByControl.get(id) ?? null,
        stale,
      };

      rows.push({ ...partial, nextAction: nextActionFor(partial) });
    }
  }

  return rows;
}

/* ------------------------------------------------------------- store */

type Patch = Partial<
  Pick<ControlRow, "status" | "nextAction" | "due" | "owner" | "implementation">
>;

const overrides = new Map<string, Map<string, Patch>>();
const cache = new Map<string, ControlRow[]>();
const listeners = new Set<() => void>();

function snapshot(programId: string): ControlRow[] {
  const hit = cache.get(programId);
  if (hit) return hit;
  const patches = overrides.get(programId);
  const rows = buildMatrix(programId).map((r) => {
    const patch = patches?.get(r.id);
    return patch ? { ...r, ...patch } : r;
  });
  cache.set(programId, rows);
  return rows;
}

export function controlMatrix(programId: string): ControlRow[] {
  return snapshot(programId);
}

export function updateControl(programId: string, id: string, patch: Patch) {
  const map = overrides.get(programId) ?? new Map<string, Patch>();
  map.set(id, { ...map.get(id), ...patch });
  overrides.set(programId, map);
  cache.delete(programId);
  for (const l of listeners) l();
}

export function useControlMatrix(programId: string): ControlRow[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot(programId),
    () => snapshot(programId),
  );
}
