// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// Control status: where a program stands on a control of its control baseline, the
// furthest step reached. No requirement, No evidence and Not assessed say what the program records
// against it, by the control's assessment objectives where it has them: No requirement until the
// program's requirements map every objective (a control mapped in part stays here), No evidence
// until each objective is mapped by a requirement that cites evidence; a mapping of the whole
// control covers every objective. Every system counts: an objective, or a control with none, is
// mapped only once mapped on every system of the program whose control baseline selects the control
// (its authorization boundaries, the systems that hold an SSP; a mapping on an element counts on
// its boundary, one that names no system on every system, and a control no system selects is
// covered by any mapping). Other than satisfied, Partially satisfied and Satisfied are a
// determination: the worst among the control's objectives once an assessor has judged every
// objective the control counts, each objective decided by the latest published determination that
// judges it (a determination on an objective judges it and the objectives under it, one on the
// statement or an item of its text judges them all, and the newest of them decides: Latest per
// objective), else the worst a product assessment made where every variant inherits the control; a
// control judged on some of its objectives reads No requirement, No evidence or Not assessed,
// whichever it reaches, and no one's determination (Not assessed until all). Objectives assessed
// counts the objectives judged (3 of 26). Determined by says whose: Program assessment or Product
// assessment. `controlStatuses` and `controlDeterminers` in status own the words. It is not the
// Baseline standing (In baseline, Added, Removed, Not selected), which says how the baseline was
// formed. Next step is the one thing that moves a control up the ladder, in the words of the
// operation: Map a requirement (Map 14 more objectives for a control mapped in part; Map on
// R210-STD-CUSA for one short on a system, or Allocate to R210-STD-CUSA where no requirement is
// allocated there), Link evidence to REQ-442, Add to assessment campaign, Plan an assessment, Open
// assessment campaign (for a control judged in part, the campaign whose plan holds the objectives
// not yet judged), Open assessment findings, Open product assessment. Map a requirement, Allocate
// requirements, Add to assessment campaign and Plan an assessment are done on the control itself,
// over its page. On its trace a control the product decided offers no requirement and names the
// assessment instead: Decided by X800 Missile version 2 product assessment.
//
// Product delta: Delta: where a control of a variant's control baseline stands against the product
// the variant was created from. Inherited (as the product delivers it), Shared (the product covers
// part), Changed here (an element behind it was modified or removed) and Program only (the product
// gives nothing for it); `variantDeltas` in status owns the words. The controls to assess are those
// Changed here and Program only. Mark as modified records what a program changed in an element it
// inherited (Software, Firmware, Hardware, Data) and why; Mark as inherited withdraws it. An
// element's Change is Modified or Removed. Plan delta assessment makes an assessment campaign over
// what is owed, each control as the assessment objectives it counts; such a campaign is a delta
// assessment, and its Variant is the system it assesses. Take version brings a newer product
// version into the variant; what the program changed stays.
//
// Product status: what a product version gives for a control, in its core or in one
// configuration: Satisfied, Partially satisfied, Other than satisfied, Not assessed (an element
// claims it and nobody judged it) and Not covered (nothing of the scope claims it);
// `productControlStatuses` owns the words. Core is the elements every configuration includes. A
// Product assessment judges a published version against a control baseline. It is not the Control
// status, which is a program's. Its verbs are Record determination and Clear determination; Publish
// product assessment freezes it.
//
// Compliance: a program's answer to a requirement of a customer's document: Compliant,
// Partially compliant, Non-compliant or Not applicable, and Unanswered while nobody has answered.
// Requirements document is the customer's document and Reference the requirement's paragraph in it.
// Compliance statement is the answer's record: Create compliance statement, Edit compliance
// statement. Met by says what meets the requirement: Product (as delivered), Variant change,
// Program or Not allocated. Import requirements reads a document in; Compliance matrix is the
// program's focused view of one.

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
  /**
   * `bold` for the one rung of a level that must not read as its neighbour in the same tone
   * (Critical beside High): its Indicator draws the word in the tone at semibold.
   */
  readonly emphasis?: "bold" | undefined;
};
export type StatusVocabulary<Value extends string = string> = Readonly<
  Record<Value, StatusDefinition>
>;
/** A status is a Badge, a record's state; a level is an Indicator, a rank beside it. */
export type VocabularyKind = "status" | "level";

const levels = new WeakSet<object>();

function vocabulary<const Value extends string>(
  entries: readonly (readonly [Value, string, StatusTone, "bold"?])[],
): StatusVocabulary<Value> {
  return Object.freeze(
    Object.fromEntries(
      entries.map(([value, label, tone, emphasis], rank) => [
        value,
        Object.freeze(emphasis ? { label, tone, rank, emphasis } : { label, tone, rank }),
      ]),
    ),
  ) as StatusVocabulary<Value>;
}
function level<const Value extends string>(
  entries: readonly (readonly [Value, string, StatusTone, "bold"?])[],
): StatusVocabulary<Value> {
  const map = vocabulary(entries);
  levels.add(map);
  return map;
}

/* ——— Work ——————————————————————————————————————————————————————————————————————————————————— */

export const reviewStatuses = vocabulary([
  ["open", "Open", "information"],
  ["resolved", "Resolved", "success"],
]);
export const attentionStates = vocabulary([
  ["seen", "Seen", "neutral"],
  ["done", "Done", "success"],
]);
/**
 * What a record in the Review queue waits on a reviewer for (`review_queue_rows.kind`), in the
 * order the assurance chain reaches it: evidence first, then the determinations made on it, then
 * the decisions they lead to, and the discussions about any of them; an offer of a program's result
 * to a shared component's owner comes last. A kind is not a judgment, so every one is neutral.
 */
export const reviewQueueKinds = vocabulary([
  ["evidence", "Evidence to verify", "neutral"],
  ["assessment_results", "Assessment results to publish", "neutral"],
  ["product_assessment", "Product assessment to publish", "neutral"],
  ["gate", "Gate to decide", "neutral"],
  ["package", "Package to decide", "neutral"],
  ["discussion", "Discussion to resolve", "neutral"],
  ["component_offer", "Offer to review", "neutral"],
]);
/**
 * The roles a program records who holds (`program_role_assignments.role`), in RMF's order: the
 * authorizing official signs (records the program's authorization decisions), the lead assessor
 * publishes its assessment results, assessors judge, the ISSM and the ISSO keep its security, and
 * the system owner (the program manager, in RMF's words) answers for the system; program manager,
 * control owner and reviewer are the program's other recorded responsibilities. A role is not a
 * judgment, so every one is neutral. The database keeps the same order (`program_role_vocabulary`),
 * which program-roles reads.
 */
export const programRoles = vocabulary([
  ["authorizing_official", "Authorizing official", "neutral"],
  ["lead_assessor", "Lead assessor", "neutral"],
  ["assessor", "Assessor", "neutral"],
  ["security_manager", "ISSM", "neutral"],
  ["security_officer", "ISSO", "neutral"],
  ["system_owner", "System owner", "neutral"],
  ["program_manager", "Program manager", "neutral"],
  ["control_owner", "Control owner", "neutral"],
  ["reviewer", "Reviewer", "neutral"],
]);
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
/**
 * What kind of assessment a campaign or a component assessment is (`assessment_campaigns.kind`,
 * `component_assessments.kind`): a control assessment, as one is unless it says otherwise, or a
 * cyber test. A kind is not a judgment, so both are neutral.
 */
export const assessmentKinds = vocabulary([
  ["control_assessment", "Control assessment", "neutral"],
  ["cyber_test", "Cyber T&E", "neutral"],
]);
/**
 * The Cyber T&E phase a cyber test campaign names (`assessment_campaigns.cyber_test_phase`), in
 * the order a program runs them. A phase is not a judgment, so every one is neutral.
 */
export const cyberTestPhases = vocabulary([
  ["cvi", "Cooperative vulnerability identification", "neutral"],
  ["acd", "Adversarial cybersecurity DT&E", "neutral"],
  ["cvpa", "Cooperative vulnerability and penetration assessment", "neutral"],
  ["aa", "Adversarial assessment", "neutral"],
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
/**
 * A CVE on a component of an SBOM (`sbom_component_vulnerabilities.state`), in VEX's words and in
 * the order a reader acts on them: the component carries it, nobody knows yet, this version holds
 * the fix, or it never applied.
 */
export const vulnerabilityStates = vocabulary([
  ["affected", "Affected", "danger"],
  ["under_investigation", "Under investigation", "warning"],
  ["fixed", "Fixed", "success"],
  ["not_affected", "Not affected", "neutral"],
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
/**
 * An authorization decision in RMF's short words (NIST SP 800-37 Rev. 2), defined once: every
 * screen that shows a decision reads them here, through the vocabularies below (a decision on a
 * package, the authorization a system records, a program's standing). ATD is the authorization
 * termination date, the day an authorization ends, never a decision: a revoked one reads Revoked.
 * IATT (interim authorization to test) and ATU (authorization to use) have no stored value yet:
 * no record can hold them until the data change lands, so no screen shows them today.
 */
export const authorizationTypes = vocabulary([
  ["ato", "ATO", "success"],
  ["ato_with_conditions", "ATO with conditions", "warning"],
  ["iatt", "IATT", "information"],
  ["atu", "ATU", "success"],
  ["dato", "DATO", "danger"],
  ["atd", "ATD", "neutral"],
]);
type AuthorizationType = keyof typeof authorizationTypes;
/** A stored value that records a decision of a type, in that type's words and tone. */
const decided = <const Value extends string>(value: Value, type: AuthorizationType) =>
  [value, authorizationTypes[type].label, authorizationTypes[type].tone] as const;
/** An authorization whose expiry has passed: the type's words, then expired ("ATO expired"). */
const lapsed = <const Value extends string>(value: Value) =>
  [value, `${authorizationTypes.ato.label} expired`, "danger"] as const;

/** The authorization a system records (`systems.authorization_status`). */
export const authorizationStatuses = vocabulary([
  ["not_assessed", "Not assessed", "neutral"],
  ["in_progress", "In progress", "information"],
  decided("authorized", "ato"),
  decided("denied", "dato"),
  lapsed("expired"),
]);
/** A decision recorded on a package version (`authorization_decisions.decision`). */
export const authorizationDecisions = vocabulary([
  decided("authorized", "ato"),
  decided("authorized_with_conditions", "ato_with_conditions"),
  decided("denied", "dato"),
  ["revoked", "Revoked", "danger"],
]);
/**
 * A program's authorization standing in RMF's short words, as its header says it beside its
 * categorization: the newest decision on its packages (an expired authorization reads ATO expired,
 * a denial DATO, a revocation Revoked), or, with none, what the program has instead. Derived by
 * `programStanding` in program-standing; no column stores it.
 */
export const authorizationStandings = vocabulary([
  lapsed("ato_expired"),
  decided("dato", "dato"),
  ["revoked", "Revoked", "danger"],
  ["no_package", "No authorization package", "neutral"],
  ["package_draft", "Package in draft", "neutral"],
  ["package_submitted", "Package submitted", "information"],
  decided("ato_with_conditions", "ato_with_conditions"),
  decided("ato", "ato"),
]);
/**
 * An evidence version's review. Its accepted outcome reads Verified (decided 2026-11-14), so it is
 * never taken for the assessor's Satisfied; the stored value stays `accepted`.
 */
export const evidenceReviewDecisions = vocabulary([
  ["pending", "Pending", "neutral"],
  ["accepted", "Verified", "success"],
  ["needs_revision", "Needs revision", "warning"],
  ["rejected", "Rejected", "danger"],
]);
/** An offer of a program's result to a shared component's owner (`component_offers.state`). */
export const componentOfferStates = vocabulary([
  ["offered", "Offered", "neutral"],
  ["accepted", "Accepted", "success"],
  ["returned", "Returned", "warning"],
  ["withdrawn", "Withdrawn", "neutral"],
]);
/**
 * What a reader does with an offer, in the words every screen that acts on one says: the program's
 * side offers it to the component's owner and may withdraw it while it waits; the owner's side
 * accepts it or returns it with a note (`offer_to_component`, `withdraw_component_offer`,
 * `review_component_offer`). The Review queue lists an offer that waits, as Offer to review, but
 * no screen acts on one yet.
 */
export const componentOfferVerbs = {
  offer: "Offer to owner",
  withdraw: "Withdraw offer",
  accept: "Accept",
  return: "Return",
} as const;
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
/** A program's answer to a requirement of its customer's document. */
export const complianceStatuses = vocabulary([
  ["compliant", "Compliant", "success"],
  ["partially_compliant", "Partially compliant", "warning"],
  ["non_compliant", "Non-compliant", "danger"],
  ["not_applicable", "Not applicable", "neutral"],
]);
/**
 * A requirement's answer as the compliance matrix reads it: the program's answer, or Unanswered
 * while nobody has given one, which is never counted as non-compliant.
 */
export const complianceAnswers = vocabulary([
  ["compliant", "Compliant", "success"],
  ["partially_compliant", "Partially compliant", "warning"],
  ["non_compliant", "Non-compliant", "danger"],
  ["not_applicable", "Not applicable", "neutral"],
  ["unanswered", "Unanswered", "information"],
]);
/** How an element behind a control or a requirement stands in a variant against its product. */
export const elementStandings = vocabulary([
  ["inherited", "Inherited", "success"],
  ["modified", "Modified", "warning"],
  ["removed", "Removed", "neutral"],
  ["own", "Program's own", "information"],
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
/** Where a catalog control stands in a program's control baseline, derived from its stack. */
export const baselineControlStatuses = vocabulary([
  ["in_baseline", "In baseline", "neutral"],
  ["added", "Added", "information"],
  ["removed", "Removed", "warning"],
  ["not_selected", "Not selected", "neutral"],
]);
/**
 * What one decision of an overlay does to the baseline beneath it, as `control_overlay_decisions`
 * stores it: it adds a control the baseline lacks, or removes one the baseline selects. An
 * overlay's own State is a revision's (`revisionStates`): a draft, or published and frozen.
 */
export const overlayDecisionActions = vocabulary([
  ["include", "Adds", "success"],
  ["exclude", "Removes", "warning"],
]);
/**
 * Where a program stands on a control of its control baseline: the furthest step it has reached,
 * as `program_control_status` answers it. The first three say what the program records against
 * the control; the last three are an assessor's determination, in RMF's words. A control with
 * assessment objectives stays No requirement until the program's requirements map every one of
 * them, and No evidence until each is mapped by one that cites evidence.
 */
export const controlStatuses = vocabulary([
  ["no_requirement", "No requirement", "neutral"],
  ["no_evidence", "No evidence", "warning"],
  ["not_assessed", "Not assessed", "information"],
  ["other_than_satisfied", "Other than satisfied", "danger"],
  ["partially_satisfied", "Partially satisfied", "warning"],
  ["satisfied", "Satisfied", "success"],
]);
/**
 * Whose determination a program's control status is, as `program_control_status` answers it: an
 * assessor of the program's own campaigns, or the product assessment every product variant of the
 * program inherits the control from. Neutral both: the status beside it carries the judgment.
 */
export const controlDeterminers = vocabulary([
  ["program", "Program assessment", "neutral"],
  ["product", "Product assessment", "neutral"],
]);
/**
 * What a control mapping covers, as both Map dialogs ask it: the whole control (every assessment
 * objective, the default), or the objectives the reader chooses, one mapping an objective.
 */
export const mappingCoverages = vocabulary([
  ["whole", "Whole control", "neutral"],
  ["objectives", "Chosen objectives", "neutral"],
]);
/**
 * What a product version gives for a control, for its core or one configuration, as
 * `product_control_status` answers it: nothing of the product claims the control, an element claims
 * it and nobody judged it, or the worst determination on the elements in scope.
 */
export const productControlStatuses = vocabulary([
  ["not_covered", "Not covered", "neutral"],
  ["not_assessed", "Not assessed", "information"],
  ["other_than_satisfied", "Other than satisfied", "danger"],
  ["partially_satisfied", "Partially satisfied", "warning"],
  ["satisfied", "Satisfied", "success"],
]);
/**
 * Where a control of a variant's control baseline stands against the product it was created
 * from, as `variant_control_delta` answers it, from what the program owes most to what it owes
 * nothing: the whole control, a new assessment, its own part, or nothing.
 */
export const variantDeltas = vocabulary([
  ["program_only", "Program only", "neutral"],
  ["changed_here", "Changed here", "warning"],
  ["shared", "Shared", "information"],
  ["inherited", "Inherited", "success"],
]);
/**
 * What becomes of an element when a variant takes a newer version of its product, what is new
 * first: created here, handed to the program, left out, and kept (with the program's change or as
 * the product delivers it).
 */
export const versionOutcomes = vocabulary([
  ["added", "Added", "information"],
  ["released", "Program's own", "warning"],
  ["skipped", "Not added", "neutral"],
  ["stays_removed", "Stays removed", "neutral"],
  ["kept_modified", "Kept, still modified", "warning"],
  ["kept", "Kept", "success"],
]);
/** What meets a requirement of a customer's document, read from the elements it is allocated to. */
export const requirementMetBy = vocabulary([
  ["product", "Product", "success"],
  ["variant_change", "Variant change", "warning"],
  ["program", "Program", "information"],
  ["unallocated", "Not allocated", "neutral"],
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
  // Critical and High share the danger tone; Critical's word is bold so the two never read alike.
  ["critical", "Critical", "danger", "bold"],
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
  "component_assessments",
  "component_definition_revisions",
  "configuration_baselines",
  "control_overlays",
  "evidence_versions",
  "framework_revisions",
  "mapping_collections",
  "offered_implementations",
  "oscal_document_revisions",
  "package_revisions",
  "poam_item_revisions",
  "poam_revisions",
  "procedure_revisions",
  "product_assessments",
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
  assurance_review_threads: { status: reviewStatuses },
  assurance_attention_acknowledgments: { state: attentionStates },
  ...Object.fromEntries(revisionTables.map((table) => [table, { state: revisionStates }])),
  assessment_campaigns: { status: campaignStatuses },
  assessment_events: { status: campaignStatuses },
  assessment_findings: { determination: determinations },
  authorization_decisions: { decision: authorizationDecisions },
  business_lines: { state: recordLifecycleStates },
  cci_items: { status: cciStatuses },
  cci_references: { resolution_status: referenceResolutionStatuses },
  change_requests: { status: changeRequestStatuses },
  component_contributions: { implementation_status: implementationStatuses },
  component_determinations: { determination: determinations },
  component_offers: { state: componentOfferStates },
  control_overlay_decisions: { action: overlayDecisionActions },
  controls: { status: controlPublicationStatuses },
  defined_component_implementations: { implementation_status: implementationStatuses },
  evidence_reviews: { decision: evidenceReviewDecisions },
  evidence_uses: { decision: evidenceUseDecisions },
  framework_control_links: { resolution_status: referenceResolutionStatuses },
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
  product_determinations: { determination: determinations },
  products: { state: recordLifecycleStates },
  programs: { status: programStatuses },
  requirement_applicability: { decision: applicabilityDecisions },
  requirement_compliance: { status: complianceStatuses },
  review_decisions: { decision: reviewDecisions },
  risk_revisions: {
    state: revisionStates,
    severity: severityLevels,
    likelihood: riskLevels,
    impact: riskLevels,
  },
  risks: { status: riskStatuses },
  sbom_component_vulnerabilities: { state: vulnerabilityStates },
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
  vulnerabilities: { severity: severityLevels },
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
  // A review decision before an evidence review's: an "accepted" found by its value alone reads
  // Accepted, never the evidence review's Verified.
  reviewDecisions,
  evidenceReviewDecisions,
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
  complianceStatuses,
  evidenceUseDecisions,
  systemLifecycleStatuses,
  componentStatuses,
  recordLifecycleStates,
  libraryAssignmentStates,
  libraryTargetStates,
  ingestionJobStatuses,
  cciStatuses,
  controlPublicationStatuses,
  overlayDecisionActions,
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
