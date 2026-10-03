import { labelFor } from "./records";

/**
 * The product's status vocabulary: every stored status, state, decision, severity and impact value
 * the screens show, with the words it reads as, its tone and its place in the order. One map per
 * concept, shared by every badge, indicator, column, filter and sort, so a value reads the same on
 * every screen. The tones follow Badge's meanings in the kit (neutral: no judgment; information:
 * in progress; success: done and good; warning: needs attention; danger: wrong or late); a level
 * (severity, impact, likelihood, priority) is a rank drawn as an Indicator, loud to quiet.
 *
 * Domain code: nothing here imports the kit. `StatusTone` is the kit's `Tone` by value, so a map is
 * a `StatusMap` for `c.status(key, { statuses })` as it stands.
 */
export type StatusTone = "neutral" | "information" | "success" | "warning" | "danger";
export type StatusDefinition = {
  readonly label: string;
  readonly tone: StatusTone;
  /** Where the value sorts: lower first. The map's order. */
  readonly rank: number;
};
export type StatusVocabulary<Value extends string = string> = Readonly<
  Record<Value, StatusDefinition>
>;
/** A status is a Badge, a record's state; a level is an Indicator, a rank beside it. */
export type VocabularyKind = "status" | "level";

const levels = new WeakSet<object>();

function vocabulary<const Value extends string>(
  entries: readonly (readonly [Value, string, StatusTone])[],
): StatusVocabulary<Value> {
  return Object.freeze(
    Object.fromEntries(
      entries.map(([value, label, tone], rank) => [value, Object.freeze({ label, tone, rank })]),
    ),
  ) as StatusVocabulary<Value>;
}
function level<const Value extends string>(
  entries: readonly (readonly [Value, string, StatusTone])[],
): StatusVocabulary<Value> {
  const map = vocabulary(entries);
  levels.add(map);
  return map;
}

/* ——— Work ——————————————————————————————————————————————————————————————————————————————————— */

export const taskStatuses = vocabulary([
  ["open", "Open", "neutral"],
  ["in_progress", "In progress", "information"],
  ["waiting", "Waiting", "warning"],
  ["blocked", "Blocked", "danger"],
  ["done", "Done", "success"],
  ["cancelled", "Cancelled", "neutral"],
]);
/** Active is success, as on a product: the program is under way and in good standing. */
export const programStatuses = vocabulary([
  ["planned", "Planned", "neutral"],
  ["active", "Active", "success"],
  ["suspended", "Suspended", "warning"],
  ["closed", "Closed", "neutral"],
]);
/** Assessment campaigns and their events. */
export const campaignStatuses = vocabulary([
  ["planned", "Planned", "neutral"],
  ["active", "Active", "information"],
  ["completed", "Completed", "success"],
  ["cancelled", "Cancelled", "neutral"],
]);
export const workstreamStatuses = vocabulary([
  ["planned", "Planned", "neutral"],
  ["active", "Active", "information"],
  ["blocked", "Blocked", "danger"],
  ["completed", "Completed", "success"],
  ["cancelled", "Cancelled", "neutral"],
]);
export const lifecycleGateStatuses = vocabulary([
  ["not_started", "Not started", "neutral"],
  ["in_review", "In review", "information"],
  ["at_risk", "At risk", "warning"],
  ["blocked", "Blocked", "danger"],
  ["failed", "Failed", "danger"],
  ["completed", "Completed", "success"],
  ["passed", "Passed", "success"],
  ["waived", "Waived", "neutral"],
]);
export const scheduledTaskStatuses = vocabulary([
  ["planned", "Planned", "neutral"],
  ["ready", "Ready", "neutral"],
  ["in_progress", "In progress", "information"],
  ["blocked", "Blocked", "danger"],
  ["completed", "Completed", "success"],
  ["cancelled", "Cancelled", "neutral"],
]);
export const testRunStatuses = vocabulary([
  ["planned", "Planned", "neutral"],
  ["in_progress", "In progress", "information"],
  ["completed", "Completed", "success"],
  ["aborted", "Aborted", "danger"],
]);
export const changeRequestStatuses = vocabulary([
  ["open", "Open", "neutral"],
  ["in_review", "In review", "information"],
  ["approved", "Approved", "success"],
  ["rejected", "Rejected", "danger"],
  ["implemented", "Implemented", "success"],
]);
export const ingestionJobStatuses = vocabulary([
  ["queued", "Queued", "neutral"],
  ["validating", "Validating", "information"],
  ["ready", "Ready", "neutral"],
  ["importing", "Importing", "information"],
  ["completed", "Completed", "success"],
  ["failed", "Failed", "danger"],
  ["cancelled", "Cancelled", "neutral"],
]);

/* ——— Findings, risks and remediation ——————————————————————————————————————————————————————— */

export const operationalIssueStatuses = vocabulary([
  ["open", "Open", "neutral"],
  ["triaged", "Triaged", "information"],
  ["in_progress", "In progress", "information"],
  ["resolved", "Resolved", "success"],
  ["closed", "Closed", "success"],
]);
/** Accepted is neutral: it records a decision to live with the risk, not that the risk is good. */
export const riskStatuses = vocabulary([
  ["open", "Open", "neutral"],
  ["investigating", "Investigating", "information"],
  ["responding", "Responding", "information"],
  ["accepted", "Accepted", "neutral"],
  ["closed", "Closed", "success"],
]);
/** Remediation items (the `poam_items` table). */
export const remediationStatuses = vocabulary([
  ["open", "Open", "neutral"],
  ["in_progress", "In progress", "information"],
  ["deferred", "Deferred", "warning"],
  ["overdue", "Overdue", "danger"],
  ["completed", "Completed", "success"],
  ["risk_accepted", "Risk accepted", "neutral"],
  ["cancelled", "Cancelled", "neutral"],
]);
export const milestoneStatuses = vocabulary([
  ["planned", "Planned", "neutral"],
  ["in_progress", "In progress", "information"],
  ["completed", "Completed", "success"],
  ["cancelled", "Cancelled", "neutral"],
]);

/* ——— Assessment and authorization ——————————————————————————————————————————————————————————— */

/** RMF phrasing: Satisfied, Partially satisfied, Other than satisfied, Not assessed. */
export const determinations = vocabulary([
  ["satisfied", "Satisfied", "success"],
  ["partially_satisfied", "Partially satisfied", "warning"],
  ["other_than_satisfied", "Other than satisfied", "danger"],
  ["not_assessed", "Not assessed", "neutral"],
]);
/** A test step's result. */
export const stepDeterminations = vocabulary([
  ["met", "Met", "success"],
  ["not_met", "Not met", "danger"],
  ["blocked", "Blocked", "danger"],
  ["not_applicable", "Not applicable", "neutral"],
]);
export const implementationStatuses = vocabulary([
  ["planned", "Planned", "neutral"],
  ["not_implemented", "Not implemented", "danger"],
  ["partial", "Partial", "warning"],
  ["implemented", "Implemented", "success"],
  ["alternative", "Alternative", "information"],
  ["not_applicable", "Not applicable", "neutral"],
]);
/**
 * A selected control's implementation as the SSP assembly reads it: the recorded statuses, after
 * the controls nobody has implemented yet, which `src/lib/ssp-assembly.ts` derives as `unrecorded`
 * (first in the sort, shown as Absent).
 */
export const recordedImplementationStatuses: StatusVocabulary<
  "unrecorded" | keyof typeof implementationStatuses
> = Object.freeze({
  unrecorded: Object.freeze({ label: "Not recorded", tone: "neutral", rank: -1 } as const),
  ...implementationStatuses,
});
export const authorizationStatuses = vocabulary([
  ["not_assessed", "Not assessed", "neutral"],
  ["in_progress", "In progress", "information"],
  ["authorized", "Authorized", "success"],
  ["denied", "Denied", "danger"],
  ["expired", "Expired", "danger"],
]);
export const authorizationDecisions = vocabulary([
  ["authorized", "Authorized", "success"],
  ["authorized_with_conditions", "Authorized with conditions", "warning"],
  ["denied", "Denied", "danger"],
  ["revoked", "Revoked", "danger"],
]);
export const evidenceReviewDecisions = vocabulary([
  ["pending", "Pending", "neutral"],
  ["accepted", "Accepted", "success"],
  ["needs_revision", "Needs revision", "warning"],
  ["rejected", "Rejected", "danger"],
]);
export const evidenceUseDecisions = vocabulary([
  ["pending", "Pending", "neutral"],
  ["accepted", "Accepted", "success"],
  ["not_applicable", "Not applicable", "neutral"],
]);
export const reviewDecisions = vocabulary([
  ["accepted", "Accepted", "success"],
  // docs/guides/status-vocabulary.md: a review that sends the work back fails the bar.
  ["changes_requested", "Changes requested", "danger"],
  ["rejected", "Rejected", "danger"],
  ["waived", "Waived", "neutral"],
]);
export const applicabilityDecisions = vocabulary([
  ["applicable", "Applicable", "neutral"],
  ["conditionally_applicable", "Conditionally applicable", "warning"],
  ["not_applicable", "Not applicable", "neutral"],
]);

/* ——— Systems, components and products ——————————————————————————————————————————————————————— */

export const systemLifecycleStatuses = vocabulary([
  ["planned", "Planned", "neutral"],
  ["development", "In development", "information"],
  ["operational", "Operational", "success"],
  ["retired", "Retired", "neutral"],
]);
export const componentStatuses = vocabulary([
  ["planned", "Planned", "neutral"],
  ["under_development", "Under development", "information"],
  ["operational", "Operational", "success"],
  ["disposition", "Disposition", "neutral"],
  ["other", "Other", "neutral"],
]);
/** Products and product configurations. */
export const recordLifecycleStates = vocabulary([
  ["active", "Active", "success"],
  ["retired", "Retired", "neutral"],
]);

/* ——— Versions and reference data ——————————————————————————————————————————————————————————— */

/** Every revision's State: a draft, or the published version in force. */
export const revisionStates = vocabulary([
  ["draft", "Draft", "neutral"],
  ["published", "Published", "success"],
]);
export const libraryAssignmentStates = vocabulary([
  ["accepted", "Accepted", "success"],
  ["superseded", "Superseded", "neutral"],
]);
export const libraryTargetStates = vocabulary([
  ["proposed", "Proposed", "information"],
  ["accepted", "Accepted", "success"],
  ["already_applied", "Already applied", "neutral"],
  ["excluded", "Excluded", "neutral"],
  ["not_in_baseline", "Not in baseline", "neutral"],
  ["no_ssp", "No SSP", "warning"],
  ["conflicting", "Conflicting", "warning"],
]);
export const cciStatuses = vocabulary([
  ["draft", "Draft", "neutral"],
  ["active", "Active", "success"],
  ["deprecated", "Deprecated", "warning"],
]);
export const controlPublicationStatuses = vocabulary([
  ["active", "Active", "success"],
  ["withdrawn", "Withdrawn", "neutral"],
]);
export const referenceResolutionStatuses = vocabulary([
  ["resolved", "Resolved", "success"],
  ["unresolved", "Unresolved", "danger"],
  ["unsupported-publication", "Unsupported publication", "warning"],
]);

/* ——— Levels: drawn as an Indicator, never a pill; every Low (and Very low) is neutral ———————— */

export const severityLevels = level([
  ["low", "Low", "neutral"],
  ["moderate", "Moderate", "warning"],
  ["high", "High", "danger"],
  ["critical", "Critical", "danger"],
]);
/** FIPS 199 confidentiality, integrity and availability impact. */
export const impactLevels = level([
  ["low", "Low", "neutral"],
  ["moderate", "Moderate", "warning"],
  ["high", "High", "danger"],
]);
/** A risk's likelihood and impact. */
export const riskLevels = level([
  ["very_low", "Very low", "neutral"],
  ["low", "Low", "neutral"],
  ["moderate", "Moderate", "warning"],
  ["high", "High", "danger"],
  ["very_high", "Very high", "danger"],
]);
export const taskPriorities = level([
  ["low", "Low", "neutral"],
  ["normal", "Normal", "neutral"],
  ["high", "High", "warning"],
  ["urgent", "Urgent", "danger"],
]);
export const importIssueSeverities = level([
  ["information", "Information", "information"],
  ["warning", "Warning", "warning"],
  ["error", "Error", "danger"],
]);

/* ——— Which field uses which vocabulary ————————————————————————————————————————————————————— */

const revisionTables = [
  "assessment_plan_revisions",
  "assessment_results_revisions",
  "catalog_revisions",
  "cci_revisions",
  "component_definition_revisions",
  "configuration_baselines",
  "evidence_versions",
  "mapping_collections",
  "offered_implementations",
  "oscal_document_revisions",
  "package_revisions",
  "poam_item_revisions",
  "poam_revisions",
  "procedure_revisions",
  "product_revisions",
  "profile_resolutions",
  "profile_revisions",
  "requirement_definition_revisions",
  "requirement_revisions",
  "risk_revisions",
  "ssp_revisions",
] as const;

/** Every stored field the screens show as a status or a level, by table and column. */
export const fieldVocabularies: Readonly<
  Record<string, Readonly<Record<string, StatusVocabulary>>>
> = {
  ...Object.fromEntries(revisionTables.map((table) => [table, { state: revisionStates }])),
  assessment_campaigns: { status: campaignStatuses },
  assessment_events: { status: campaignStatuses },
  assessment_findings: { determination: determinations },
  authorization_decisions: { decision: authorizationDecisions },
  cci_items: { status: cciStatuses },
  cci_references: { resolution_status: referenceResolutionStatuses },
  change_requests: { status: changeRequestStatuses },
  component_contributions: { implementation_status: implementationStatuses },
  controls: { status: controlPublicationStatuses },
  defined_component_implementations: { implementation_status: implementationStatuses },
  evidence_reviews: { decision: evidenceReviewDecisions },
  evidence_uses: { decision: evidenceUseDecisions },
  implemented_requirements: { implementation_status: implementationStatuses },
  import_issues: { severity: importIssueSeverities },
  ingestion_jobs: { status: ingestionJobStatuses },
  library_assignment_targets: { state: libraryTargetStates },
  library_assignments: { state: libraryAssignmentStates },
  lifecycle_gates: { status: lifecycleGateStatuses },
  operational_issues: { status: operationalIssueStatuses, severity: severityLevels },
  oscal_document_imports: { resolution_status: referenceResolutionStatuses },
  poam_items: { status: remediationStatuses },
  poam_milestones: { status: milestoneStatuses },
  product_configurations: { state: recordLifecycleStates },
  products: { state: recordLifecycleStates },
  programs: { status: programStatuses },
  requirement_applicability: { decision: applicabilityDecisions },
  review_decisions: { decision: reviewDecisions },
  risk_revisions: {
    state: revisionStates,
    severity: severityLevels,
    likelihood: riskLevels,
    impact: riskLevels,
  },
  risks: { status: riskStatuses },
  scheduled_assessment_tasks: { status: scheduledTaskStatuses },
  scopes: {
    confidentiality_impact: impactLevels,
    integrity_impact: impactLevels,
    availability_impact: impactLevels,
  },
  step_results: { determination: stepDeterminations },
  system_components: { status: componentStatuses },
  systems: {
    authorization_status: authorizationStatuses,
    lifecycle_status: systemLifecycleStatuses,
    confidentiality_impact: impactLevels,
    integrity_impact: impactLevels,
    availability_impact: impactLevels,
  },
  tasks: { status: taskStatuses, priority: taskPriorities },
  test_runs: { status: testRunStatuses },
  workstreams: { status: workstreamStatuses },
};

/** Whether a vocabulary is a level (an Indicator) rather than a status (a Badge). */
export function vocabularyKind(values: StatusVocabulary): VocabularyKind {
  return levels.has(values) ? "level" : "status";
}

/** The vocabulary of a stored field, or undefined when the field is not a status or a level. */
export function vocabularyFor(
  table: string,
  field: string,
): { kind: VocabularyKind; values: StatusVocabulary } | undefined {
  const values = Object.prototype.hasOwnProperty.call(fieldVocabularies, table)
    ? fieldVocabularies[table]?.[field]
    : undefined;
  return values ? { kind: vocabularyKind(values), values } : undefined;
}

/** A value's entry in its vocabulary, or undefined for a value the vocabulary does not know. */
export function statusEntry(
  values: StatusVocabulary | undefined,
  value: unknown,
): StatusDefinition | undefined {
  return values && typeof value === "string" && Object.prototype.hasOwnProperty.call(values, value)
    ? values[value]
    : undefined;
}

/** The words a value reads as: its label, or the value humanised when the vocabulary lacks it. */
export function statusLabel(values: StatusVocabulary | undefined, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  return statusEntry(values, value)?.label ?? labelFor(String(value));
}

/** A value's tone; neutral for a value the vocabulary does not know. */
export function statusTone(values: StatusVocabulary | undefined, value: unknown): StatusTone {
  return statusEntry(values, value)?.tone ?? "neutral";
}

/** Sort by rank, unknown values after the known ones, then by value; for lists outside DataTable. */
export function compareStatus(values: StatusVocabulary) {
  const rank = (value: unknown) => statusEntry(values, value)?.rank ?? Number.POSITIVE_INFINITY;
  return (a: unknown, b: unknown) => {
    const difference = rank(a) - rank(b);
    if (difference !== 0 && !Number.isNaN(difference)) return difference;
    return String(a ?? "").localeCompare(String(b ?? ""));
  };
}

/** Where a value alone is looked up: the statuses first, in this order, then the levels. */
const byValue: readonly StatusVocabulary[] = [
  taskStatuses,
  revisionStates,
  determinations,
  implementationStatuses,
  evidenceReviewDecisions,
  reviewDecisions,
  programStatuses,
  campaignStatuses,
  workstreamStatuses,
  remediationStatuses,
  milestoneStatuses,
  operationalIssueStatuses,
  riskStatuses,
  authorizationStatuses,
  authorizationDecisions,
  lifecycleGateStatuses,
  scheduledTaskStatuses,
  testRunStatuses,
  changeRequestStatuses,
  stepDeterminations,
  applicabilityDecisions,
  evidenceUseDecisions,
  systemLifecycleStatuses,
  componentStatuses,
  recordLifecycleStates,
  libraryAssignmentStates,
  libraryTargetStates,
  ingestionJobStatuses,
  cciStatuses,
  controlPublicationStatuses,
  referenceResolutionStatuses,
  severityLevels,
  impactLevels,
  riskLevels,
  taskPriorities,
  importIssueSeverities,
];

/**
 * The first vocabulary that knows a value, for the transitional helpers that receive a value with
 * no field (`statusTone` in work-format, `StateBadge` in record-tools). New code names its
 * vocabulary, or asks `vocabularyFor(table, field)`: a value two concepts share ("active",
 * "accepted", "closed") reads as the first concept here.
 */
export function vocabularyForValue(value: unknown): StatusVocabulary | undefined {
  return byValue.find((values) => statusEntry(values, value) !== undefined);
}

/**
 * A neutral vocabulary for a status-like field the product has not mapped (a derived projection,
 * a diagnostic column): each value in words, in first-seen order. Never a substitute for a map.
 */
export function neutralVocabulary(values: Iterable<unknown>): StatusVocabulary {
  const seen = [
    ...new Set(
      [...values].filter((value): value is string => typeof value === "string" && !!value),
    ),
  ];
  return vocabulary(seen.map((value) => [value, labelFor(value), "neutral"] as const));
}
