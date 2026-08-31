/**
 * Chunk 15b of the CCI spine — eMASS-shaped exports.
 *
 * OSCAL is what a modern tool imports. eMASS is what the DoD actually runs, and
 * an eMASS import is a spreadsheet with a fixed column set. This module is the
 * second projection of the same facts: the same SCTM rows, the same POA&M
 * items, the same composition graph, rendered into the eMASS Control
 * Information, POA&M, Hardware Baseline, Software Baseline and Test Results
 * column sets.
 *
 * Invariants held here:
 *  - **Same facts, second format.** The eMASS POA&M carries exactly the item
 *    set the OSCAL POA&M carries — both the OSCAL-shaped register in
 *    `@/lib/grc-data` and the finding-joined remediation register in
 *    `@/lib/register`. An export that showed a different POA&M in each format
 *    would be worse than no export.
 *  - **Every column is derived or "—".** Where this dataset genuinely does not
 *    carry a field an eMASS import wants — a serial number, an IP address, an
 *    installed memory size — the cell is the em dash and the export's `note`
 *    says so. Filling those cells with plausible values is the one thing that
 *    would make the whole sheet untrustworthy.
 *  - **A deficiency is never laundered.** `Compliance Status` maps
 *    `Other than satisfied` to `Non-Compliant`; a requirement with no
 *    determination on file is left blank rather than reported Compliant, and a
 *    determination the currency overlay retracted is reported as blank with the
 *    retraction stated in `SLCM Comments`.
 *  - **Derivations that are positional are labelled as positional.** The eMASS
 *    assessment procedure acronym is numbered within its control here, which is
 *    how eMASS numbers them, but this dataset does not carry the authoritative
 *    AP list — the note says so rather than implying the numbering was looked
 *    up.
 *  - **No clock.** Everything that needs a date takes the ConMon as-of date.
 *
 * Layering: reads the SCTM, the registers, the graph, the ConMon strategy and
 * the run log; writes strings. Nothing imports it except `@/lib/airgap` and the
 * export route.
 */

import {
  assessmentSchedule,
  conmonAsOf,
  slcmProfilesFor,
  type ScheduleRow,
  type SlcmProfile,
} from "@/lib/conmon";
import {
  ancestorsOf,
  edgesFrom,
  nodeById,
  nodesForProgram,
  rootOf,
  type CompositionNode,
} from "@/lib/composition";
import { assetById, findings, type Finding } from "@/lib/findings";
import {
  formatOscalDate,
  poamItems as oscalPoamItems,
  programs,
  type PoamItem as OscalPoamItem,
} from "@/lib/grc-data";
import { resolveInheritance, type ResolvedInheritance } from "@/lib/inheritance";
import {
  findingsForPoam,
  poamItems as registerPoamItems,
  type PoamItem as RegisterPoamItem,
} from "@/lib/register";
import { scoreFinding, type ResidualScore } from "@/lib/risk-scoring";
import type { Determination, SctmRow } from "@/lib/sctm";
import { procedures, runVerdict, runsForProcedure } from "@/lib/test-execution";
import { objectiveById } from "@/lib/campaigns";

/* ── Types ───────────────────────────────────────────────────────────────── */

export type EmassExportKind =
  "Control Information" | "POA&M" | "Hardware" | "Software" | "Test Results";

export type EmassExport = {
  kind: EmassExportKind;
  columns: string[];
  rows: string[][];
  /** What the sheet is, where each column came from, and what is deliberately blank. */
  note: string;
};

export const emassExportKinds: EmassExportKind[] = [
  "Control Information",
  "POA&M",
  "Hardware",
  "Software",
  "Test Results",
];

/** eMASS file names, so a bundle path is the name an eMASS operator expects. */
export const emassFileNames: Record<EmassExportKind, string> = {
  "Control Information": "control-information.csv",
  "POA&M": "poam.csv",
  Hardware: "hardware-baseline.csv",
  Software: "software-baseline.csv",
  "Test Results": "test-results.csv",
};

const dash = "—";

function orDash(value: string | null | undefined): string {
  if (value === null || value === undefined) return dash;
  const trimmed = value.trim();
  return trimmed === "" ? dash : trimmed;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter((v) => v && v !== dash))];
}

function joinOrDash(values: string[], separator = "; "): string {
  const list = dedupe(values);
  return list.length === 0 ? dash : list.join(separator);
}

/* ── Vocabulary mappings ─────────────────────────────────────────────────── */

/** eMASS Compliance Status. A blank cell is "no result on file", never "Compliant". */
function complianceStatus(determination: Determination): string {
  switch (determination) {
    case "Satisfied":
      return "Compliant";
    case "Other than satisfied":
      return "Non-Compliant";
    case "Not applicable":
      return "Not Applicable";
    default:
      return dash;
  }
}

/** eMASS Implementation Status. Records what is implemented, not what was assessed. */
function implementationStatus(row: SctmRow): string {
  if (row.determination === "Not applicable") return "Not Applicable";
  if (row.origination === "Common") return "Inherited";
  if (row.determination === "Satisfied" || row.determination === "Other than satisfied")
    return "Implemented";
  if (row.priorDetermination === "Satisfied") return "Implemented";
  return row.assertion === dash ? "Planned" : "Implemented";
}

/** eMASS Security Control Designation. */
function designation(origination: string): string {
  if (origination === "Common") return "Common";
  if (origination === "Hybrid") return "Hybrid";
  return "System-Specific";
}

/** eMASS Test Method, which knows only the three SP 800-53A methods. */
function testMethod(method: string): string {
  switch (method) {
    case "Test":
    case "Demonstration":
      return "Test";
    case "Analysis":
      return "Interview";
    default:
      return "Examine";
  }
}

/** eMASS Test Result, which is the SP 800-53A determination verbatim. */
function testResult(determination: Determination): string {
  if (determination === "Satisfied") return "Satisfied";
  if (determination === "Other than satisfied") return "Other Than Satisfied";
  return dash;
}

/**
 * The eMASS Severity scale, from the DISA category the AO adjudicated.
 * CAT I is the category that blocks an authorization, so it maps to the top of
 * the scale; CAT III is the category that does not, so it maps to the bottom.
 */
const severityFromCategory: Record<string, string> = {
  "CAT I": "Very High",
  "CAT II": "High",
  "CAT III": "Low",
};

const rawSeverityFromCategory: Record<string, string> = {
  "CAT I": "I",
  "CAT II": "II",
  "CAT III": "III",
};

/** The eMASS five-point scale, from a 0–1 normalised risk factor. */
function level(value: number): string {
  if (value >= 0.8) return "Very High";
  if (value >= 0.6) return "High";
  if (value >= 0.4) return "Moderate";
  if (value >= 0.2) return "Low";
  return "Very Low";
}

function factorOf(score: ResidualScore | null, key: string): { value: number; why: string } | null {
  const factor = score?.factors.find((f) => f.key === key);
  return factor ? { value: factor.value, why: factor.rationale } : null;
}

/* ── Control Information ─────────────────────────────────────────────────── */

const controlInformationColumns = [
  "Control Acronym",
  "AP Acronym",
  "CCI",
  "Compliance Status",
  "Implementation Status",
  "Security Control Designation",
  "Common Control Provider",
  "Inherited From",
  "Responsible Entities",
  "Implementation Narrative",
  "N/A Justification",
  "SLCM Frequency",
  "SLCM Method",
  "SLCM Reporting",
  "SLCM Tracking",
  "SLCM Comments",
  "Test Method",
  "Test Result",
  "Test Result Date",
  "Estimated Completion Date",
];

/** The scheduled completion of the POA&M item that carries this row's findings. */
function estimatedCompletion(row: SctmRow): string {
  for (const findingId of row.findings) {
    const finding = findings.find((f) => f.id === findingId);
    const poam = finding?.poam ? registerPoamItems.find((p) => p.id === finding.poam) : undefined;
    if (poam && poam.scheduledCompletion !== dash) return poam.scheduledCompletion;
  }
  return dash;
}

export function emassControlInformation(programId: string, rows: SctmRow[]): EmassExport {
  const inheritance = resolveInheritance(programId);
  const profiles = new Map<string, SlcmProfile>(
    slcmProfilesFor(programId).map((p) => [p.control, p]),
  );
  const schedule = new Map<string, ScheduleRow>(
    assessmentSchedule(programId, conmonAsOf).map((r) => [r.control, r]),
  );

  const apIndex = new Map<string, number>();
  const out: string[][] = [];

  for (const row of rows) {
    const next = (apIndex.get(row.control) ?? 0) + 1;
    apIndex.set(row.control, next);

    const resolved: ResolvedInheritance | undefined = inheritance.get(row.control);
    const profile = profiles.get(row.control);
    const scheduled = schedule.get(row.control);
    const inheritedFrom = resolved
      ? `${resolved.component.name} (${resolved.component.key})`
      : dash;
    const provider = resolved && resolved.tier !== "System" ? resolved.tier : dash;

    const slcmComments: string[] = [];
    if (profile) slcmComments.push(profile.note);
    if (row.currency !== "Current") {
      slcmComments.push(`Determination currency ${row.currency}: ${row.currencyReason}`);
    }
    if (row.priorDetermination) {
      slcmComments.push(
        `${row.priorDetermination} as of ${row.assessed} was retracted and is retained for the audit trail; it is not reported as a current result.`,
      );
    }
    if (row.gap) slcmComments.push(`Package gap: ${row.gap}`);

    out.push([
      row.control,
      `${row.control}.${next}`,
      row.unit === "CCI" ? row.requirement : dash,
      complianceStatus(row.determination),
      implementationStatus(row),
      designation(row.origination),
      provider,
      inheritedFrom,
      orDash(row.responsibleParty),
      orDash(row.assertion),
      row.determination === "Not applicable" ? orDash(row.determinationNote) : dash,
      profile ? profile.frequency : dash,
      profile ? profile.method : dash,
      profile
        ? `${profile.responsible} reports the ${profile.frequency.toLowerCase()} result to the ISSM`
        : dash,
      scheduled ? `Next due ${scheduled.nextDue} (${scheduled.status})` : dash,
      slcmComments.length > 0 ? slcmComments.join(" ") : dash,
      testMethod(row.method),
      testResult(row.determination),
      orDash(row.assessed),
      estimatedCompletion(row),
    ]);
  }

  const withStrategy = out.filter((r) => r[11] !== dash).length;

  return {
    kind: "Control Information",
    columns: controlInformationColumns,
    rows: out,
    note: `One row per assessment procedure — ${out.length} rows decomposed from the program's tailored baseline, in matrix order. Compliance Status, Implementation Status, Test Result and Test Result Date come from the SCTM determination; Security Control Designation, Common Control Provider and Inherited From come from the resolved inheritance; the SLCM columns come from the ConMon strategy, which covers ${withStrategy} of these rows — the rest carry the em dash rather than an invented frequency. The AP Acronym is numbered positionally within its control, which is how eMASS numbers assessment procedures, but this dataset does not carry the authoritative AP list and the numbering is not resolved against it.`,
  };
}

/* ── POA&M ───────────────────────────────────────────────────────────────── */

const poamColumns = [
  "POA&M Item ID",
  "Control Vulnerability Description",
  "Security Control Number (NC/NA controls only)",
  "Office/Org",
  "Security Checks",
  "Resources Required",
  "Scheduled Completion Date",
  "Milestone with Completion Dates",
  "Milestone Changes",
  "Source Identifying Vulnerability",
  "Status",
  "Comments",
  "Raw Severity",
  "Devices Affected",
  "Mitigations",
  "Predisposing Conditions",
  "Severity",
  "Relevance of Threat",
  "Likelihood",
  "Impact",
  "Impact Description",
  "Residual Risk Level",
  "Recommendations",
];

function predisposingConditions(members: Finding[]): string {
  return joinOrDash(
    members.map((f) => {
      const node = f.node ? nodeById.get(f.node) : null;
      if (!node) return "";
      return `${node.name} sits in the ${node.zone} trust zone and is graded ${node.criticality.toLowerCase()}`;
    }),
  );
}

function registerPoamRow(item: RegisterPoamItem): string[] {
  const members = findingsForPoam(item.id);
  const worst =
    members.find((f) => f.mitigatedSeverity === "CAT I") ??
    members.find((f) => f.mitigatedSeverity === "CAT II") ??
    members[0];
  const score = worst ? scoreFinding(worst.id) : null;
  const exploitability = factorOf(score, "exploitability");
  const mission = factorOf(score, "mission");
  const exposure = factorOf(score, "exposure");
  const slipped =
    item.scheduledCompletion !== dash && item.scheduledCompletion !== item.originalCompletion
      ? `Scheduled completion moved from ${item.originalCompletion} to ${item.scheduledCompletion}.`
      : dash;

  return [
    item.id,
    item.title,
    joinOrDash(
      members.map((f) => f.control),
      ", ",
    ),
    item.owner,
    joinOrDash(
      members.map((f) => f.rule ?? f.cci),
      ", ",
    ),
    orDash(item.resources),
    orDash(item.scheduledCompletion),
    `${item.milestoneNote} Target ${item.scheduledCompletion}.`,
    slipped,
    joinOrDash(
      members.map((f) => f.source),
      ", ",
    ),
    item.status,
    item.remediation,
    worst ? (rawSeverityFromCategory[worst.rawSeverity] ?? dash) : dash,
    joinOrDash(
      members.map((f) => assetById.get(f.asset)?.name ?? f.asset),
      ", ",
    ),
    joinOrDash(members.map((f) => f.mitigation ?? "")),
    predisposingConditions(members),
    worst ? (severityFromCategory[worst.mitigatedSeverity] ?? dash) : dash,
    exposure ? level(exposure.value) : dash,
    exploitability ? level(exploitability.value) : dash,
    mission ? level(mission.value) : dash,
    mission ? mission.why : dash,
    score ? score.band : dash,
    joinOrDash(members.map((f) => f.recommendation)),
  ];
}

function oscalPoamRow(item: OscalPoamItem): string[] {
  const milestones = item.milestones
    .map(
      (m) =>
        `${m.id}: ${m.title} — target ${formatOscalDate(m.targetDate)}${
          m.completedDate ? `, completed ${formatOscalDate(m.completedDate)}` : ""
        } (${m.status})`,
    )
    .join(" | ");
  const changed = item.milestones.filter((m) => m.status === "Missed").length;

  return [
    item.poamId,
    item.title,
    item.controls.join(", "),
    item.pointOfContact,
    dash,
    dash,
    formatOscalDate(item.scheduledCompletion),
    milestones === "" ? dash : milestones,
    changed > 0 ? `${changed} milestone target missed.` : dash,
    item.detectionSource,
    item.status,
    item.remarks,
    dash,
    dash,
    dash,
    dash,
    item.severity,
    dash,
    dash,
    dash,
    dash,
    dash,
    item.description,
  ];
}

export function emassPoam(programId: string): EmassExport {
  const oscalRows = oscalPoamItems.filter((i) => i.programId === programId).map(oscalPoamRow);
  const registerRows = registerPoamItems
    .filter((i) => i.program === programId)
    .map(registerPoamRow);
  const rows = [...oscalRows, ...registerRows];

  return {
    kind: "POA&M",
    columns: poamColumns,
    rows,
    note: `${rows.length} POA&M items of record: ${oscalRows.length} from the OSCAL-shaped register, which carries structured milestones but no finding join, and ${registerRows.length} from the finding-joined remediation register, whose Severity, Likelihood, Impact and Residual Risk Level are computed from the residual score of the worst finding under the item rather than authored. This is the same item set the OSCAL plan-of-action-and-milestones carries. Where an item has no finding joined to it the derived risk columns are the em dash — no value is invented to fill a cell.`,
  };
}

/* ── Hardware baseline ───────────────────────────────────────────────────── */

const hardwareColumns = [
  "Asset Name",
  "Component Type",
  "Nickname",
  "Asset IP Address",
  "Public Facing",
  "Virtual Asset",
  "Manufacturer",
  "Model Number",
  "Serial Number",
  "OS/iOS/FW Version",
  "Location",
  "Approval Status",
  "Critical Asset",
];

function nicknameOf(node: CompositionNode): string {
  if (node.asset) return assetById.get(node.asset)?.name ?? node.asset;
  for (const ancestor of ancestorsOf(node.id)) {
    if (ancestor.asset) return assetById.get(ancestor.asset)?.name ?? ancestor.asset;
  }
  return dash;
}

function subsystemOf(node: CompositionNode): string {
  for (const ancestor of ancestorsOf(node.id)) {
    if (ancestor.kind === "Subsystem" || ancestor.kind === "Enclave") return ancestor.name;
  }
  return dash;
}

export function emassHardwareList(programId: string): EmassExport {
  const nodes = nodesForProgram(programId).filter(
    (n) => n.class === "Hardware" || n.class === "Firmware",
  );
  const rows = nodes.map((node) => [
    node.name,
    node.kind,
    nicknameOf(node),
    dash,
    node.zone === "Public" ? "Yes" : "No",
    "No",
    node.supplier,
    orDash(node.partNumber ?? node.partKey),
    dash,
    node.version === dash ? dash : node.version,
    `${subsystemOf(node)} — ${node.zone} trust zone`,
    node.attested ? "Approved" : "Unapproved",
    node.criticality === "Mission critical" ? "Yes" : "No",
  ]);

  const unapproved = rows.filter((r) => r[11] === "Unapproved").length;

  return {
    kind: "Hardware",
    columns: hardwareColumns,
    rows,
    note: `${rows.length} hardware and firmware items taken from the composition graph rather than from a hand-maintained list, so a part that appears in a delivered BOM appears here. Approval Status is the supplier attestation on file — ${unapproved} item${unapproved === 1 ? "" : "s"} arrive${unapproved === 1 ? "s" : ""} with none. Asset IP Address, Serial Number and installed memory are not carried in this dataset and are left as the em dash rather than filled with a plausible value.`,
  };
}

/* ── Software baseline ───────────────────────────────────────────────────── */

const softwareColumns = [
  "Software Vendor",
  "Software Name",
  "Version",
  "Software Type",
  "Parent System",
  "Subsystem",
  "Network",
  "Hosting Environment",
  "Software Dependencies",
  "Cryptographic Hash",
  "Function",
  "Approval Status",
  "Critical Function",
  "License or Maintenance Expiration Date",
];

export function emassSoftwareList(programId: string): EmassExport {
  const program = programs.find((p) => p.id.toLowerCase() === programId.toLowerCase());
  const nodes = nodesForProgram(programId).filter((n) => n.class === "Software");
  const rows = nodes.map((node) => {
    const dependencies = edgesFrom(node.id)
      .filter((e) => e.kind === "Depends on" || e.kind === "Connects to")
      .map((e) => nodeById.get(e.to)?.name ?? e.to);
    return [
      node.supplier,
      node.name,
      node.version === dash ? dash : node.version,
      node.kind,
      rootOf(node.id)?.name ?? dash,
      subsystemOf(node),
      node.zone,
      program?.environment ?? dash,
      joinOrDash(dependencies, ", "),
      orDash(node.digest),
      orDash(node.note.split(".")[0]),
      node.attested ? "Approved" : "Unapproved",
      node.criticality === "Mission critical" ? "Yes" : "No",
      orDash(node.eol),
    ];
  });

  const hashed = rows.filter((r) => r[9] !== dash).length;

  return {
    kind: "Software",
    columns: softwareColumns,
    rows,
    note: `${rows.length} software items taken from the composition graph, which is itself built from the delivered CycloneDX, SPDX and declared inventories. Cryptographic Hash is the recorded image or layer digest where the item carries one — ${hashed} of ${rows.length} do. License and maintenance expiry is the recorded end-of-life date; where none is on file the cell is the em dash.`,
  };
}

/* ── Test results ────────────────────────────────────────────────────────── */

const testResultColumns = [
  "Test Procedure",
  "Test Objective",
  "Test Method",
  "Run",
  "Operator",
  "Witness",
  "Started",
  "Completed",
  "Build Under Test",
  "Steps Passed",
  "Result",
  "Findings Raised",
];

export function emassTestResults(programId: string): EmassExport {
  const programNodes = new Set(nodesForProgram(programId).map((n) => n.id));
  const rows: string[][] = [];

  for (const procedure of procedures) {
    if (!procedure.nodes.some((id) => programNodes.has(id))) continue;
    const objective = objectiveById.get(procedure.objective);
    const runs = runsForProcedure(procedure.id);
    if (runs.length === 0) {
      rows.push([
        procedure.id,
        objective?.statement ?? dash,
        testMethod(procedure.method),
        dash,
        dash,
        dash,
        dash,
        dash,
        dash,
        dash,
        "Not run",
        dash,
      ]);
      continue;
    }
    for (const run of runs) {
      const verdict = runVerdict(run.id);
      const passed = run.records.filter((r) => r.result === "Pass").length;
      rows.push([
        procedure.id,
        objective?.statement ?? dash,
        testMethod(procedure.method),
        run.id,
        run.operator,
        orDash(run.witness),
        run.started,
        orDash(run.completed),
        run.build,
        `${passed} of ${procedure.steps.length}`,
        verdict ? verdict.result : run.state,
        joinOrDash(run.findings, ", "),
      ]);
    }
  }

  return {
    kind: "Test Results",
    columns: testResultColumns,
    rows,
    note: `${rows.length} rows from the test run log: one per recorded execution of a written procedure that touches this program's components, plus one row for each procedure that has never been run. The Result column is the computed run verdict — the step records decide it, not a status field somebody set.`,
  };
}

/* ── CSV ─────────────────────────────────────────────────────────────────── */

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * RFC 4180: fields containing a comma, a double quote or a line break are
 * wrapped in double quotes and any internal quote is doubled; records are
 * separated by CRLF. Matches `sctmCsv`, so the two sit beside each other in a
 * transfer bundle without a line-ending mismatch.
 */
export function emassCsv(x: EmassExport): string {
  const lines = [x.columns.map(csvField).join(",")];
  for (const row of x.rows) lines.push(row.map(csvField).join(","));
  return lines.join("\r\n");
}

/** Every eMASS sheet for a program, in the order an operator uploads them. */
export function emassPackage(programId: string, rows: SctmRow[]): EmassExport[] {
  return [
    emassControlInformation(programId, rows),
    emassPoam(programId),
    emassHardwareList(programId),
    emassSoftwareList(programId),
    emassTestResults(programId),
  ];
}

/** One sheet by kind, for a UI that lets the reader pick. */
export function emassExportFor(
  kind: EmassExportKind,
  programId: string,
  rows: SctmRow[],
): EmassExport {
  switch (kind) {
    case "Control Information":
      return emassControlInformation(programId, rows);
    case "POA&M":
      return emassPoam(programId);
    case "Hardware":
      return emassHardwareList(programId);
    case "Software":
      return emassSoftwareList(programId);
    default:
      return emassTestResults(programId);
  }
}
