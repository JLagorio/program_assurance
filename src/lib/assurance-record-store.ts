import { useEffect, useSyncExternalStore } from "react";
import { toast } from "@ledger/design-system";
import { z } from "zod";
import { programs } from "@/lib/grc-data";
import {
  assetById,
  findingProgram,
  findings,
  isDeficiency,
  type Finding,
  type FindingRetest,
} from "@/lib/findings";
import {
  poamById,
  poamItems,
  findingsForPoam,
  type PoamItem,
  type PoamMilestone,
} from "@/lib/register";
import { scopeById } from "@/lib/scopes";
import { getRequirement } from "@/lib/requirements";
import { evidenceById, notifyEvidenceSourcesChanged } from "@/lib/evidence-catalog";
import { campaignById } from "@/lib/campaigns";

/** One transaction persists both ends of a finding/remediation relationship. */
export const assuranceStorageKey = "equinox.assurance-records.v1";
const listeners = new Set<() => void>();
let version = 0;
let restored = false;
type SavedRecords = { findings: Finding[]; poams: PoamItem[] };
let saved: SavedRecords = { findings: [], poams: [] };

const nonempty = z.string().trim().min(1);
/**
 * Severity, accepting the scale this store was written under.
 *
 * Records persisted before the CAT I/II/III scale was replaced still name the
 * old values, and they are in a reader's browser, not in a file anyone can
 * migrate. Rejecting one fails the whole restore and costs the reader every
 * finding and POA&M edit they had made — so the legacy grades are translated on
 * the way in, which is what the scale change did to the seed as well.
 */
const severity = z.preprocess(
  (value) =>
    value === "CAT I"
      ? "High"
      : value === "CAT II"
        ? "Moderate"
        : value === "CAT III"
          ? "Low"
          : value,
  z.enum(["Critical", "High", "Moderate", "Low"]),
);
const lifecycle = z.enum([
  "Open",
  "Triaged",
  "Remediating",
  "Retest pending",
  "Closed",
  "Risk accepted",
  "False positive",
]);
const retestSchema = z.object({
  id: nonempty,
  result: z.enum(["Passed", "Failed"]),
  evidence: z.array(nonempty).min(1),
  note: nonempty,
  assessor: nonempty,
  assessedOn: nonempty,
});
const findingSchema = z.object({
  id: nonempty,
  program: nonempty,
  scope: z.string().optional(),
  requirements: z.array(nonempty).optional(),
  assessmentId: z.string().optional(),
  controls: z.array(z.string()).optional(),
  assets: z.array(z.string()).optional(),
  nodes: z.array(z.string()).optional(),
  sourceId: z.string().optional(),
  sourceUuid: z.string().optional(),
  sourceStatus: z.string().optional(),
  sourceSeverity: z.string().optional(),
  sourceIssues: z.array(z.string()).optional(),
  title: nonempty,
  control: nonempty,
  cci: z.string(),
  asset: z.string(),
  node: z.string().optional(),
  rule: z.string().optional(),
  source: z.enum(["STIG checklist", "ACAS scan", "Code scan", "Test event", "Manual procedure"]),
  sourceArtifact: z.string(),
  rawSeverity: severity,
  mitigatedSeverity: severity,
  mitigation: z.string().optional(),
  lifecycle,
  firstSeen: nonempty,
  lastSeen: nonempty,
  occurrences: z.number().int().positive(),
  owner: nonempty,
  poam: z.string().optional(),
  risk: z.string().optional(),
  detail: nonempty,
  assessment: z.object({
    method: z.enum(["Examine", "Interview", "Test"]),
    procedure: z.string(),
    assessedBy: z.string(),
    assessedOn: z.string(),
    determination: z.string(),
    evidence: z.array(z.string()),
  }),
  recommendation: z.string(),
  retests: z.array(retestSchema).optional(),
});
const milestoneSchema = z.object({
  id: nonempty,
  title: nonempty,
  targetDate: z.string(),
  completedDate: z.string().nullable().optional(),
  status: z.enum(["Planned", "In progress", "Completed", "Missed"]),
});
const poamSchema = z.object({
  id: nonempty,
  title: nonempty,
  program: nonempty,
  status: z.enum(["Ongoing", "Completed", "Risk accepted", "Overdue"]),
  owner: nonempty,
  resources: z.string(),
  scheduledCompletion: nonempty,
  originalCompletion: nonempty,
  milestoneNote: z.string(),
  risk: z.string().optional(),
  remediation: nonempty,
  controls: z.array(z.string()).optional(),
  milestones: z.array(milestoneSchema).optional(),
  legacyUuid: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  nodes: z.array(z.string()).optional(),
  findingIds: z.array(z.string()).optional(),
  riskIds: z.array(z.string()).optional(),
  sourceStatus: z.string().optional(),
  sourceIssues: z.array(z.string()).optional(),
});
const savedSchema = z.object({ findings: z.array(findingSchema), poams: z.array(poamSchema) });

export function subscribeAssurance(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function assuranceVersion() {
  return version;
}
function publish() {
  version += 1;
  notifyEvidenceSourcesChanged();
  for (const listener of listeners) listener();
}

function apply(records: SavedRecords) {
  for (const finding of records.findings) {
    const previous = findings.find((item) => item.id === finding.id);
    if (previous) Object.assign(previous, finding);
    else findings.push(finding);
  }
  for (const poam of records.poams) {
    const previous = poamById.get(poam.id);
    if (previous) Object.assign(previous, poam);
    else {
      poamItems.push(poam);
      poamById.set(poam.id, poam);
    }
  }
}

export function restoreAssuranceRecords() {
  if (restored || typeof window === "undefined") return;
  const raw = window.localStorage.getItem(assuranceStorageKey);
  if (raw) {
    const parsed = savedSchema.parse(JSON.parse(raw));
    // Validate the whole relationship graph before replacing any live record.
    for (const finding of parsed.findings) {
      validateOwnership(finding);
      if (finding.poam) {
        const poam =
          parsed.poams.find((item) => item.id === finding.poam) ?? poamById.get(finding.poam);
        if (!poam || poam.program !== finding.program)
          throw new Error("Saved finding has an invalid POA&M relationship.");
      }
    }
    for (const poam of parsed.poams) requireProgram(poam.program);
    saved = parsed;
    apply(saved);
  }
  restored = true;
  publish();
}

export function useAssuranceVersion() {
  useEffect(() => {
    try {
      restoreAssuranceRecords();
    } catch (error) {
      toast.add({
        title: "Assurance records could not be restored",
        type: "error",
        timeout: 8000,
        description: error instanceof Error ? error.message : "Saved records are invalid.",
      });
    }
  }, []);
  return useSyncExternalStore(subscribeAssurance, assuranceVersion, () => 0);
}

function commit(changes: Partial<SavedRecords>) {
  const merge = <T extends { id: string }>(existing: T[], changed: T[]) => {
    const map = new Map(existing.map((item) => [item.id, item]));
    for (const item of changed) map.set(item.id, item);
    return [...map.values()];
  };
  const next = {
    findings: merge(saved.findings, changes.findings ?? []),
    poams: merge(saved.poams, changes.poams ?? []),
  };
  // Storage failure must leave the live graph untouched.
  if (typeof window === "undefined") throw new Error("Saving records requires browser storage.");
  window.localStorage.setItem(assuranceStorageKey, JSON.stringify(next));
  saved = next;
  apply({ findings: changes.findings ?? [], poams: changes.poams ?? [] });
  publish();
}

function requireProgram(programId: string) {
  if (!programs.some((program) => program.id === programId)) throw new Error("Program not found.");
}
function required(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}
function validateOwnership(finding: Pick<Finding, "program" | "scope" | "asset" | "requirements">) {
  const programId = required(finding.program ?? "", "Program");
  requireProgram(programId);
  if (finding.scope && scopeById.get(finding.scope)?.program !== programId)
    throw new Error("Scope must belong to this program.");
  if (finding.asset && assetById.get(finding.asset)?.program !== programId)
    throw new Error("Asset must belong to this program.");
  for (const id of finding.requirements ?? [])
    if (getRequirement(id)?.program !== programId)
      throw new Error("Requirements must belong to this program.");
}
function validateEvidence(programId: string, ids: string[]) {
  for (const id of ids) {
    const artifact = evidenceById(id);
    if (!artifact || artifact.program !== programId)
      throw new Error("Evidence must be an artifact in this program.");
  }
}
function nextId(prefix: string, records: { id: string }[]) {
  const highest = records.reduce(
    (max, item) =>
      item.id.startsWith(prefix) ? Math.max(max, Number(item.id.slice(prefix.length)) || 0) : max,
    0,
  );
  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
}
function now() {
  return new Date().toISOString();
}
function getFinding(id: string) {
  const finding = findings.find((item) => item.id === id);
  if (!finding) throw new Error("Finding not found.");
  return finding;
}
function asOwned(finding: Finding): Finding {
  return { ...finding, program: findingProgram(finding) };
}

export type NewFinding = {
  program: string;
  scope?: string | undefined;
  asset?: string | undefined;
  requirements?: string[] | undefined;
  assessmentId?: string | undefined;
  title: string;
  detail: string;
  control: string;
  cci?: string;
  owner: string;
  severity: Finding["rawSeverity"];
  source?: Finding["source"];
  method?: Finding["assessment"]["method"];
  evidence?: string[];
  recommendation?: string;
  assessor?: string;
};

export function createFinding(input: NewFinding): Finding {
  restoreAssuranceRecords();
  validateOwnership({ ...input, asset: input.asset ?? "" });
  if (input.assessmentId && campaignById.get(input.assessmentId)?.program !== input.program)
    throw new Error("Assessment must belong to this program.");
  const evidence = [...new Set(input.evidence ?? [])];
  validateEvidence(input.program, evidence);
  const date = now();
  const created: Finding = {
    id: nextId("FND-", findings),
    program: input.program,
    scope: input.scope,
    asset: input.asset ?? "",
    requirements: input.requirements ?? [],
    assessmentId: input.assessmentId,
    node: input.asset ? assetById.get(input.asset)?.node : undefined,
    title: required(input.title, "Finding title"),
    detail: required(input.detail, "Observed condition"),
    control: required(input.control, "Control"),
    cci: input.cci?.trim() ?? "",
    owner: required(input.owner, "Owner"),
    rawSeverity: input.severity,
    mitigatedSeverity: input.severity,
    source: input.source ?? "Manual procedure",
    sourceArtifact: evidence[0] ?? "",
    lifecycle: "Open",
    firstSeen: date,
    lastSeen: date,
    occurrences: 1,
    recommendation: input.recommendation?.trim() ?? "",
    assessment: {
      method: input.method ?? (input.source === "Test event" ? "Test" : "Examine"),
      procedure: "",
      assessedBy: input.assessor?.trim() ?? input.owner.trim(),
      assessedOn: date,
      determination: input.detail.trim(),
      evidence,
    },
    retests: [],
  };
  findingSchema.parse(created);
  commit({ findings: [created], poams: [] });
  return created;
}

export type FindingPatch = Partial<
  Pick<
    Finding,
    | "title"
    | "detail"
    | "owner"
    | "recommendation"
    | "mitigation"
    | "mitigatedSeverity"
    | "lifecycle"
    | "requirements"
  >
>;
export function updateFinding(id: string, patch: FindingPatch) {
  restoreAssuranceRecords();
  const previous = getFinding(id);
  if (patch.lifecycle === "Closed" && previous.lifecycle !== "Closed")
    throw new Error("Record a passing retest with evidence to close this finding.");
  if (
    (patch.lifecycle === "Risk accepted" || patch.lifecycle === "False positive") &&
    !patch.mitigation?.trim() &&
    !previous.mitigation?.trim()
  )
    throw new Error(
      "Record the disposition rationale before accepting risk or dismissing a finding.",
    );
  const next = { ...asOwned(previous), ...patch };
  required(next.title, "Finding title");
  required(next.detail, "Observed condition");
  required(next.owner, "Owner");
  validateOwnership(next);
  findingSchema.parse(next);
  commit({ findings: [next], poams: reopenedCommitments(previous, next) });
  return getFinding(id);
}

export function linkFindingEvidence(id: string, evidenceId: string) {
  restoreAssuranceRecords();
  const previous = getFinding(id);
  validateEvidence(findingProgram(previous) ?? "", [evidenceId]);
  const next = {
    ...asOwned(previous),
    sourceArtifact: previous.sourceArtifact || evidenceId,
    assessment: {
      ...previous.assessment,
      evidence: [...new Set([...previous.assessment.evidence, evidenceId])],
    },
  };
  commit({ findings: [next], poams: [] });
}

export function recordFindingRetest(
  id: string,
  input: Omit<FindingRetest, "id" | "assessedOn">,
): FindingRetest {
  restoreAssuranceRecords();
  const previous = getFinding(id);
  if (!input.evidence.length) throw new Error("Attach retest evidence before recording a result.");
  validateEvidence(findingProgram(previous) ?? "", input.evidence);
  const retest: FindingRetest = {
    ...input,
    id: `RT-${id}-${(previous.retests?.length ?? 0) + 1}`,
    note: required(input.note, "Retest determination"),
    assessor: required(input.assessor, "Assessor"),
    evidence: [...new Set(input.evidence)],
    assessedOn: now(),
  };
  retestSchema.parse(retest);
  const next: Finding = {
    ...asOwned(previous),
    lifecycle: input.result === "Passed" ? "Closed" : "Remediating",
    lastSeen: retest.assessedOn,
    retests: [...(previous.retests ?? []), retest],
  };
  commit({ findings: [next], poams: reopenedCommitments(previous, next) });
  return retest;
}

function reopenedCommitments(previous: Finding, next: Finding): PoamItem[] {
  const poam = previous.poam ? poamById.get(previous.poam) : undefined;
  return !isDeficiency(previous) && isDeficiency(next) && poam?.status === "Completed"
    ? [{ ...poam, status: "Ongoing" }]
    : [];
}

export type NewPoam = {
  program: string;
  title: string;
  owner: string;
  remediation: string;
  scheduledCompletion: string;
  resources?: string;
  findingIds?: string[];
};
export function createPoam(input: NewPoam): PoamItem {
  restoreAssuranceRecords();
  requireProgram(input.program);
  const members = [...new Set(input.findingIds ?? [])].map(getFinding);
  if (members.some((finding) => findingProgram(finding) !== input.program))
    throw new Error("Linked findings must belong to this program.");
  if (members.some((finding) => finding.poam))
    throw new Error("A selected finding already has a POA&M. Update its existing commitment.");
  const completion = validDate(input.scheduledCompletion);
  const item: PoamItem = {
    id: nextId("POAM-", poamItems),
    program: input.program,
    title: required(input.title, "POA&M title"),
    owner: required(input.owner, "Owner"),
    remediation: required(input.remediation, "Remediation plan"),
    scheduledCompletion: completion,
    originalCompletion: completion,
    status: "Ongoing",
    resources: input.resources?.trim() ?? "",
    milestoneNote: "",
    milestones: [],
    controls: [...new Set(members.flatMap((finding) => finding.controls ?? [finding.control]))],
    requirements: [...new Set(members.flatMap((finding) => finding.requirements ?? []))],
    nodes: [
      ...new Set(
        members.flatMap((finding) => finding.nodes ?? (finding.node ? [finding.node] : [])),
      ),
    ],
  };
  const changed = members.map((finding) => ({
    ...asOwned(finding),
    poam: item.id,
    lifecycle: isDeficiency(finding) ? ("Remediating" as const) : finding.lifecycle,
  }));
  commit({ findings: changed, poams: [item] });
  return item;
}

export function linkFindingToPoam(findingId: string, poamId: string) {
  restoreAssuranceRecords();
  const finding = getFinding(findingId);
  const poam = poamById.get(poamId);
  if (!poam || poam.program !== findingProgram(finding))
    throw new Error("POA&M must belong to the finding's program.");
  if (poam.status === "Completed")
    throw new Error("Reopen the POA&M before attaching another finding.");
  if (finding.poam && finding.poam !== poamId)
    throw new Error("This finding already has a POA&M. Keep its existing remediation history.");
  commit({
    findings: [{ ...asOwned(finding), poam: poamId }],
    poams: [
      {
        ...poam,
        controls: [
          ...new Set([...(poam.controls ?? []), ...(finding.controls ?? [finding.control])]),
        ],
        requirements: [...new Set([...(poam.requirements ?? []), ...(finding.requirements ?? [])])],
        nodes: [
          ...new Set([
            ...(poam.nodes ?? []),
            ...(finding.nodes ?? (finding.node ? [finding.node] : [])),
          ]),
        ],
      },
    ],
  });
}

function validDate(value: string) {
  const date = value.slice(0, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw new Error("Choose a valid completion date.");
  return date;
}
export function updatePoam(
  id: string,
  patch: Partial<
    Pick<
      PoamItem,
      | "title"
      | "owner"
      | "remediation"
      | "resources"
      | "scheduledCompletion"
      | "milestoneNote"
      | "status"
    >
  >,
) {
  restoreAssuranceRecords();
  const previous = poamById.get(id);
  if (!previous) throw new Error("POA&M not found.");
  if (patch.status === "Completed" && previous.status !== "Completed") {
    const members = findingsForPoam(id);
    if (!members.length || members.some(isDeficiency))
      throw new Error("Verify closure of every linked finding before completing this POA&M.");
    if (previous.milestones?.some((milestone) => milestone.status !== "Completed"))
      throw new Error("Complete the remediation milestones before completing this POA&M.");
  }
  const next = {
    ...previous,
    ...patch,
    ...(patch.scheduledCompletion
      ? { scheduledCompletion: validDate(patch.scheduledCompletion) }
      : {}),
  };
  required(next.title, "POA&M title");
  required(next.owner, "Owner");
  required(next.remediation, "Remediation plan");
  poamSchema.parse(next);
  commit({ findings: [], poams: [next] });
  return poamById.get(id)!;
}

export function addPoamMilestone(
  poamId: string,
  input: Pick<PoamMilestone, "title" | "targetDate">,
) {
  restoreAssuranceRecords();
  const item = poamById.get(poamId);
  if (!item) throw new Error("POA&M not found.");
  const milestone: PoamMilestone = {
    id: `${poamId}-M${(item.milestones?.length ?? 0) + 1}`,
    title: required(input.title, "Milestone title"),
    targetDate: validDate(input.targetDate),
    status: "Planned",
  };
  commit({
    findings: [],
    poams: [{ ...item, milestones: [...(item.milestones ?? []), milestone] }],
  });
  return milestone;
}
export function updatePoamMilestone(
  poamId: string,
  milestoneId: string,
  patch: Partial<Pick<PoamMilestone, "title" | "targetDate" | "status">>,
) {
  restoreAssuranceRecords();
  const item = poamById.get(poamId);
  if (!item?.milestones?.some((milestone) => milestone.id === milestoneId))
    throw new Error("Milestone not found.");
  const milestones = item.milestones.map((milestone) =>
    milestone.id !== milestoneId
      ? milestone
      : {
          ...milestone,
          ...patch,
          ...(patch.targetDate ? { targetDate: validDate(patch.targetDate) } : {}),
          completedDate:
            patch.status === "Completed" ? now() : patch.status ? null : milestone.completedDate,
        },
  );
  for (const milestone of milestones) milestoneSchema.parse(milestone);
  commit({ findings: [], poams: [{ ...item, milestones }] });
}
