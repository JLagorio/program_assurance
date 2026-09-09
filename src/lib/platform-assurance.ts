/** WS-X90 imports are base records in the existing program stores. Browser edits remain overlays. */
import { platformSeed, platformSeedIssues } from "@/lib/platform-seed";
import {
  platformProgramId,
  platformRootScopeId,
  platformAssetId,
  platformNodeId,
  platformScopeId,
  platformSourceRecord,
} from "@/lib/platform-ids";
import {
  campaigns,
  campaignById,
  events,
  eventById,
  objectives,
  objectiveById,
  type Campaign,
  type TestEvent,
  type TestObjective,
} from "@/lib/campaigns";
import { findings, type Finding } from "@/lib/findings";
import {
  poamItems,
  poamById,
  registerRisks,
  riskById,
  type PoamItem,
  type RegisterRisk,
} from "@/lib/register";
import {
  registerEvidenceSource,
  type EvidenceArtifact,
  type EvidenceLink,
} from "@/lib/evidence-catalog";
import { registerTestExecutionSeed, type TestProcedure, type TestRun } from "@/lib/test-execution";
import { registerAssessmentVerification } from "@/lib/requirement-verification";

export const platformCampaignId = "TC-1090";
export const platformEventId = "TE-1090";
/**
 * One campaign and one test event per imported assessment. The first assessment keeps
 * the original ids so existing links, overrides and saved snapshots still resolve.
 */
export const platformCampaignIdFor = (index: number) =>
  index === 0 ? platformCampaignId : `${platformCampaignId}-${index + 1}`;
export const platformEventIdFor = (index: number) =>
  index === 0 ? platformEventId : `${platformEventId}-${index + 1}`;
/** Objectives, procedures and runs are numbered across all campaigns, not per campaign. */
export const platformObjectiveId = (index: number) => `TO-${109001 + index}`;
export const platformProcedureId = (index: number) => `TP-${109001 + index}`;
export const platformRunId = (index: number) => `TR-${109001 + index}`;

const issuesFor = (id: string) =>
  platformSeedIssues.filter((issue) => issue.recordId === id).map((issue) => issue.message);
const severity = (value: string): Finding["rawSeverity"] =>
  value === "critical" || value === "high" ? "CAT I" : value === "moderate" ? "CAT II" : "CAT III";
const assessmentMethod = (value: string) =>
  value === "examine"
    ? ("Examine" as const)
    : value === "interview"
      ? ("Interview" as const)
      : ("Test" as const);

let registered = false;
/** Call after program structure, control scopes, and requirements, before restoring browser overrides. */
export function registerPlatformAssurance(): void {
  if (registered) return;
  const data = platformSeed;
  const requirementById = new Map(
    data.requirements.map((requirement) => [requirement.id, requirement]),
  );
  const assessmentById = new Map(data.assessments.map((item) => [item.id, item]));
  /**
   * A result or finding is attached to the assessment its `assessment_id` names. A row
   * that omits one belongs to the first assessment — the original 120 results do.
   */
  const assessmentFor = (id: string | undefined) =>
    (id ? assessmentById.get(id) : undefined) ?? data.assessments[0]!;

  const objectivesByAssessment = new Map<string, string[]>();
  for (const [index, result] of data.assessment_results.entries()) {
    const id = assessmentFor(result.assessment_id).id;
    objectivesByAssessment.set(id, [
      ...(objectivesByAssessment.get(id) ?? []),
      platformObjectiveId(index),
    ]);
  }
  const findingsByAssessment = new Map<string, string[]>();
  for (const finding of data.findings) {
    const id = assessmentFor(finding.assessment_id).id;
    findingsByAssessment.set(id, [...(findingsByAssessment.get(id) ?? []), finding.id]);
  }

  const campaignByAssessment = new Map<string, Campaign>();
  const eventByAssessment = new Map<string, TestEvent>();
  for (const [index, assessment] of data.assessments.entries()) {
    const campaign: Campaign = {
      id: platformCampaignIdFor(index),
      name: assessment.name,
      program: platformProgramId,
      trigger: "Gate entry",
      gate: "—",
      state: assessment.status === "completed" ? "Reporting" : "Planning",
      lead: assessment.assessor_role,
      opened: assessment.planned_start.slice(0, 10),
      target: assessment.planned_end.slice(0, 10),
      scope: platformRootScopeId,
      sourceRecord: platformSourceRecord(assessment),
    };
    const event: TestEvent = {
      id: platformEventIdFor(index),
      campaign: campaign.id,
      name: assessment.name,
      kind: "Cooperative",
      state: assessment.status === "completed" ? "Reported" : "Planned",
      window: `${assessment.planned_start.slice(0, 10)} – ${assessment.planned_end.slice(0, 10)}`,
      start: assessment.planned_start.slice(0, 10),
      end: assessment.planned_end.slice(0, 10),
      team: assessment.assessor_role,
      assets: assessment.scope.component_ids.map(platformAssetId),
      objectives: objectivesByAssessment.get(assessment.id) ?? [],
      findings: findingsByAssessment.get(assessment.id) ?? [],
      notes: `Imported assessment ${assessment.id}. Source status: ${assessment.status}.`,
    };
    campaignByAssessment.set(assessment.id, campaign);
    eventByAssessment.set(assessment.id, event);
    if (!campaignById.has(campaign.id)) {
      campaigns.push(campaign);
      campaignById.set(campaign.id, campaign);
    }
    if (!eventById.has(event.id)) {
      events.push(event);
      eventById.set(event.id, event);
    }
  }

  const procedures: TestProcedure[] = [];
  const runs: TestRun[] = [];
  for (const [index, result] of data.assessment_results.entries()) {
    const requirement = requirementById.get(result.requirement_id)!;
    const assessment = assessmentFor(result.assessment_id);
    const event = eventByAssessment.get(assessment.id)!;
    const objectiveId = platformObjectiveId(index);
    const procedureId = platformProcedureId(index);
    const nodes = result.component_ids.map(platformNodeId);
    const sourceRecord = platformSourceRecord({
      ...result,
      id: result.id ?? `${assessment.id}/${result.requirement_id}`,
    });
    const objective: TestObjective = {
      id: objectiveId,
      statement: requirement.description,
      ccis: [],
      method:
        result.method === "examine"
          ? "Examination"
          : result.method === "interview"
            ? "Interview"
            : "Demonstration",
      result:
        result.outcome === "pass"
          ? "Met"
          : result.outcome === "fail"
            ? "Not met"
            : result.outcome === "inconclusive"
              ? "Partially met"
              : "Not run",
      event: event.id,
      controls: [...result.control_ids],
      nodes,
      sourceRecord,
      ...(result.evidence_ids[0] ? { evidence: result.evidence_ids[0] } : {}),
    };
    if (!objectiveById.has(objectiveId)) {
      objectives.push(objective);
      objectiveById.set(objectiveId, objective);
    }
    procedures.push({
      id: procedureId,
      title: requirement.title,
      objective: objectiveId,
      assessmentMethod: assessmentMethod(result.method),
      method:
        result.method === "examine"
          ? "Inspection"
          : result.method === "interview"
            ? "Analysis"
            : "Test",
      nodes,
      preconditions: [],
      duration: 0,
      author: assessment.assessor_role,
      version: "Unrecorded",
      steps: [
        {
          id: `${procedureId}-S1`,
          n: 1,
          action: requirement.description,
          expected: requirement.acceptance_criteria.join("\n"),
          collect: "Record the observation and supporting evidence.",
        },
      ],
    });
    if (result.outcome !== "not-assessed")
      runs.push({
        id: platformRunId(index),
        procedure: procedureId,
        event: event.id,
        operator: assessment.assessor_role,
        witness: "—",
        state: "Complete",
        started: result.assessed_on,
        completed: result.assessed_on,
        build: "Unrecorded",
        configuration: "Unrecorded in source assessment",
        nodes,
        records: [
          {
            step: `${procedureId}-S1`,
            result:
              result.outcome === "pass"
                ? "Pass"
                : result.outcome === "fail"
                  ? "Fail"
                  : "Inconclusive",
            observed: result.notes,
            evidence: [...result.evidence_ids],
            at: result.assessed_on,
          },
        ],
        retestOf: null,
        findings: data.findings
          .filter((finding) => finding.requirement_ids.includes(requirement.id))
          .map((finding) => finding.id),
        notes: `Imported determination; procedure execution details and tested build were not supplied. ${issuesFor(requirement.id).join(" ")}`,
        sourceRecord,
      });
    registerAssessmentVerification({
      requirement: requirement.id,
      objective: objectiveId,
      linkedBy: assessment.assessor_role,
      linkedOn: result.assessed_on,
    });
  }
  registerTestExecutionSeed({ procedures, runs });

  for (const source of data.findings) {
    if (findings.some((finding) => finding.id === source.id)) continue;
    const assessment = assessmentFor(source.assessment_id);
    const campaign = campaignByAssessment.get(assessment.id)!;
    const result = data.assessment_results.find((row) =>
      source.requirement_ids.includes(row.requirement_id),
    );
    const poam = data.poam_items.find((item) => item.finding_ids.includes(source.id));
    findings.push({
      id: source.id,
      program: platformProgramId,
      scope: platformRootScopeId,
      sourceId: source.id,
      sourceUuid: source.uuid,
      sourceStatus: source.status,
      sourceSeverity: source.severity,
      sourceIssues: issuesFor(source.id),
      title: source.title,
      detail: source.description,
      control: source.control_ids[0] ?? "",
      controls: [...source.control_ids],
      cci: "",
      asset: source.component_ids[0] ? platformAssetId(source.component_ids[0]) : "",
      assets: source.component_ids.map(platformAssetId),
      nodes: source.component_ids.map(platformNodeId),
      ...(source.component_ids[0] ? { node: platformNodeId(source.component_ids[0]) } : {}),
      requirements: [...source.requirement_ids],
      ...(source.assessment_id ? { assessmentId: campaign.id } : {}),
      source: "Test event",
      sourceArtifact: source.evidence_ids[0] ?? "",
      rawSeverity: severity(source.severity),
      mitigatedSeverity: severity(source.severity),
      lifecycle: source.status === "closed" ? "Closed" : "Open",
      retests: [],
      firstSeen: result?.assessed_on ?? "Unrecorded",
      lastSeen: result?.assessed_on ?? "Unrecorded",
      occurrences: 1,
      owner: poam?.owner_role ?? "Unassigned",
      ...(poam ? { poam: poam.id } : {}),
      ...(source.risk_id ? { risk: source.risk_id } : {}),
      recommendation: "",
      assessment: {
        method: assessmentMethod(result?.method ?? "test"),
        procedure: source.requirement_ids.join(", "),
        assessedBy: source.assessment_id ? assessment.assessor_role : "",
        assessedOn: result?.assessed_on ?? "",
        determination: source.description,
        evidence: [...source.evidence_ids],
      },
    });
  }
  for (const source of data.risks) {
    if (riskById.has(source.id)) continue;
    const risk: RegisterRisk = {
      id: source.id,
      title: source.title,
      program: platformProgramId,
      owner: "Unassigned",
      disposition: "Pending AO",
      likelihood: null,
      impact: null,
      inherent: null,
      residual: null,
      treatment: "Mitigate",
      statement: source.statement,
      reviewed: "Unrecorded",
      sourceStatus: source.status,
      sourceUuid: source.uuid,
      findingIds: [...source.finding_ids],
      sourceRating: {
        likelihood: source.likelihood,
        impact: source.impact,
        overall: source.overall,
      },
    };
    registerRisks.push(risk);
    riskById.set(risk.id, risk);
  }
  for (const source of data.poam_items) {
    if (poamById.has(source.id)) continue;
    const item: PoamItem = {
      id: source.id,
      legacyUuid: source.uuid,
      title: source.title,
      program: platformProgramId,
      sourceStatus: source.status,
      sourceIssues: source.milestones.flatMap((milestone) => issuesFor(milestone.id)),
      status: source.status === "completed" ? "Completed" : "Ongoing",
      owner: source.owner_role,
      resources: "",
      scheduledCompletion: source.planned_completion,
      originalCompletion: source.planned_completion,
      milestoneNote: "",
      remediation: source.description,
      controls: [...source.control_ids],
      requirements: [...source.requirement_ids],
      nodes: source.component_ids.map(platformNodeId),
      findingIds: [...source.finding_ids],
      riskIds: [...source.risk_ids],
      ...(source.risk_ids[0] ? { risk: source.risk_ids[0] } : {}),
      milestones: source.milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        targetDate: milestone.target_date ?? milestone.planned_completion ?? "",
        ...(milestone.completed_at ? { completedDate: milestone.completed_at } : {}),
        status:
          milestone.status === "completed"
            ? "Completed"
            : milestone.status === "in-progress"
              ? "In progress"
              : "Planned",
      })),
    };
    poamItems.push(item);
    poamById.set(item.id, item);
  }

  const artifacts: EvidenceArtifact[] = data.evidence.map((source) => {
    const scopedComponents = source.component_ids.map(platformScopeId);
    const scopeIds = [platformRootScopeId, ...scopedComponents];
    const links: EvidenceLink[] = [
      ...source.control_ids.flatMap((id) =>
        scopeIds.map((scopeId): EvidenceLink => ({ kind: "control", id, scopeId })),
      ),
      ...source.requirement_ids.map((id): EvidenceLink => ({
        kind: "requirement",
        id,
        scopeId: platformRootScopeId,
      })),
      ...data.findings
        .filter((finding) => finding.evidence_ids.includes(source.id))
        .map((finding): EvidenceLink => ({ kind: "finding", id: finding.id })),
    ];
    return {
      id: source.id,
      program: platformProgramId,
      label: source.title,
      collected: source.collected_at.slice(0, 10),
      scopeIds,
      owner: "Unrecorded",
      version: "Unrecorded",
      review: "Pending review",
      kind:
        source.type === "configuration-export"
          ? "Configuration"
          : source.type === "scan-result"
            ? "Scan output"
            : source.type === "test-report"
              ? "Test result"
              : "Document",
      provenance: source.description,
      referenceUri: source.uri,
      sourceId: source.id,
      sourceUuid: source.uuid,
      sha256: source.sha256,
      validThrough: source.valid_through,
      componentIds: [...source.component_ids],
      assessmentReuse: source.assessment_reuse,
      ...(/^https?:\/\//.test(source.uri) ? { url: source.uri } : {}),
      links,
    };
  });
  registerEvidenceSource(() => artifacts);
  registered = true;
}
