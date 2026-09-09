#!/usr/bin/env node
/**
 * gen-wsx90-campaign.mjs
 *
 * Authors the assessment campaign layer over the expanded WS-X90 control set and
 * writes it back into the upstream seed at
 *   docs/examples/weapons_system_oscal_dummy/platform/platform-seed.json
 *
 * What it appends / rewrites
 *   - one assessment          ASM-2026-002       (expanded control set, in-progress)
 *   - 300 assessment_results  AR-002-0001..0300  (every row carries id + assessment_id)
 *   - 36 findings             FND-017..FND-052   (one per fail result)
 *   - 24 risks                RSK-017..RSK-040   (each clusters 1-3 findings by theme)
 *   - 24 poam_items           POAM-017..POAM-040 (one per new risk)
 *   - all four traceability_views, recomputed from the final records
 *   - open item O-2: the 9 existing milestones spelled "complete" -> "completed"
 *
 * Properties
 *   - Node built-ins only.
 *   - Deterministic: no Math.random, no Date.now, no locale-dependent sort.
 *   - Idempotent: prior campaign rows are stripped by id before the rebuild, so a
 *     second run reproduces the first byte for byte.
 *   - Validates before it writes. Any error aborts with the offending record id and
 *     nothing is written.
 *
 * Authoring rules honoured (docs/wsx90-content-gap-brief.md)
 *   - No NIST or DISA prose is reproduced. Controls are cited by id only.
 *   - Every authored string carries a synthetic-content marker.
 *   - Only the 6 existing subsystems and 20 existing LRUs are referenced.
 *   - Nothing is dated before 2026-09-08.
 *   - The four pinned warning counts (23 / 6 / 3 / 48) gain nothing:
 *       * every pass and fail row carries >= 1 evidence_id, and the artifact lists
 *         the same requirement_id in its own requirement_ids;
 *       * every closed finding has a strictly later passing retest that is also the
 *         requirement's most recent result;
 *       * every new milestone carries a target_date;
 *       * no result row is written against REQ-001..REQ-120, so the existing
 *         campaign's warnings cannot shift.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SEED_PATH = path.join(
  ROOT,
  "docs/examples/weapons_system_oscal_dummy/platform/platform-seed.json",
);
/**
 * The upstream seed still carries the pre-resolution 74-id effective set; the
 * generator is what resolves the full 546. Read the resolved set from the
 * generated seed, exactly as scripts/assemble-wsx90-content.mjs does.
 */
const GENERATED_PATH = path.join(ROOT, "src/data/wsx90-platform-seed.json");
/**
 * Hand-authored finding text. One entry per fail, keyed by finding id, carrying the
 * title, the description body and the severity. Nothing about a finding's wording is
 * derived here: an assessment finding has to name the defect the assessor actually
 * found, on the LRU it was found on, and no rule can produce that from the record
 * shape. The generator's job is to assemble the record around this text and to refuse
 * to write if the authored entry and the record have drifted apart.
 */
const FINDINGS_PATH = path.join(HERE, "wsx90-findings.json");

// ---------------------------------------------------------------------------
// uuid5 - the same recipe assembly used (brief section 2.1)
// ---------------------------------------------------------------------------

const NS = "6ba7b8109dad11d180b400c04fd430c8"; // 6ba7b810-9dad-11d1-80b4-00c04fd430c8
const uuid5 = (name) => {
  const h = createHash("sha1")
    .update(Buffer.from(NS, "hex"))
    .update(Buffer.from(name, "utf8"))
    .digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
};
const mintUuid = (recordId) => uuid5(`wsx90.aurora.example/${recordId}`);

// ---------------------------------------------------------------------------
// error accumulation - nothing is written while errors stands non-empty
// ---------------------------------------------------------------------------

const errors = [];
const fail = (code, record, detail) => errors.push(`${code} [${record}] ${detail}`);

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------

const ASSESSMENT_ID = "ASM-2026-002";
const WINDOW_START = "2026-09-14T08:00:00Z";
const WINDOW_END = "2026-11-20T18:00:00Z";
const RESULTS_FIRST_DAY = "2026-09-16";
const RESULTS_LAST_DAY = "2026-11-18";
const EARLIEST_DATE = "2026-09-08";
const MARKER = "This observation is synthetic demo content.";
const PROSE_MARKER = "This narrative is synthetic demo content.";
const OWNER_ROLES = new Set([
  "System Security Engineer",
  "Product Security Engineer",
  "Firmware Lead",
  "Platform Lead",
]);
const CONTROL_ID_RE = /^[A-Z]{2}-\d{1,2}(?:\(\d{1,2}\))?$/;
const CCI_ANY_RE = /CCI-[A-Za-z0-9][A-Za-z0-9-]*/g;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Target row counts, straight from section 6.5 of the brief. */
const TARGET = {
  results: 300,
  pass: 186,
  fail: 36,
  inconclusive: 12,
  notAssessed: 66,
  retests: 6,
  findings: 36,
  risks: 24,
  poam: 24,
  severity: { critical: 2, high: 8, moderate: 18, low: 8 },
  findingStatus: { open: 30, closed: 6 },
  poamStatus: { open: 20, completed: 4 },
};

// ---------------------------------------------------------------------------
// deterministic day arithmetic on plain YYYY-MM-DD strings
// ---------------------------------------------------------------------------

const toDay = (iso) =>
  Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86400000);
const fromDay = (day) => new Date(day * 86400000).toISOString().slice(0, 10);
const addMonths = (year, month, delta) => {
  const total = year * 12 + (month - 1) + delta;
  return [Math.floor(total / 12), (total % 12) + 1];
};
const RESULT_DAY0 = toDay(RESULTS_FIRST_DAY);
const RESULT_SPAN = toDay(RESULTS_LAST_DAY) - RESULT_DAY0; // 63

/** An assessor reads an artifact 0-4 days after it is collected, never before. */
const REVIEW_LAG_DAYS = 5;
/** The remediation gap a closed finding aims for between its fail and its retest. */
const RETEST_GAP_DAYS = 10;
/** The gap the window can always deliver, whatever day the fail is forced onto. */
const MIN_RETEST_GAP_DAYS = 4;

/** Assessment work happens in office hours; the hour varies so the UI has texture. */
const stampFor = (dayOffset, slot) => {
  const clamped = Math.max(0, Math.min(RESULT_SPAN, dayOffset));
  const hour = [9, 11, 13, 14, 16, 17][slot % 6];
  return `${fromDay(RESULT_DAY0 + clamped)}T${String(hour).padStart(2, "0")}:00:00Z`;
};

// ---------------------------------------------------------------------------
// themes - the functional grouping that drives fail selection, findings, risks,
// POA&M ownership and the domain texture in every authored sentence.
// ---------------------------------------------------------------------------

/** SC splits: cryptography and session/transmission protection vs. everything boundary. */
const SC_CRYPTO = new Set([8, 11, 12, 13, 17, 23, 28, 40]);

const FAMILY_THEME = {
  AU: "audit",
  AC: "access",
  IA: "ident",
  SI: "integrity",
  CM: "config",
  MA: "maint",
  CP: "contingency",
  SA: "supply",
  SR: "supply",
  CA: "assessrisk",
  RA: "assessrisk",
  IR: "incident",
  PE: "physical",
  MP: "physical",
  PS: "people",
  AT: "people",
  PL: "people",
};

const themeOf = (controlId) => {
  const family = controlId.slice(0, 2);
  const base = Number.parseInt(controlId.slice(3).split("(")[0], 10);
  if (family === "SC") return SC_CRYPTO.has(base) ? "crypto" : "boundary";
  return FAMILY_THEME[family] ?? "assessrisk";
};

const THEMES = {
  crypto: {
    short: "Cryptographic protection",
    noun: "cryptographic protection and transmission confidentiality",
    owner: "Product Security Engineer",
    detail: [
      "The check centred on how key material is used and retired rather than on the algorithms themselves.",
      "Attention fell on the boundary between mission compute and the protected cryptographic services.",
      "Scope was limited to keys in operational use on WS-X90; wrapped spares were not opened.",
      "Key generation was left to the module's own attestation; the assessor looked at issue, use and destruction.",
      "The question was whether protected data leaving the mission enclave stays protected, not how fast it is processed.",
    ],
    fix: "Complete the key-handling change and re-cut the cryptographic configuration baseline",
  },
  boundary: {
    short: "Boundary protection",
    noun: "boundary protection and network policy enforcement",
    owner: "Product Security Engineer",
    detail: [
      "The mediation path between the mission enclave and every external interface was the focus.",
      "Both the permitted flows and the default-deny fallback were considered, not the permitted set alone.",
      "The assessor followed one representative flow from origin to egress rather than sampling rules at rest.",
      "Interfaces that are only enabled during integration were included, since they exist on the delivered article.",
      "The assessor distinguished a policy that is configured from a policy that is actually enforced at the gateway.",
    ],
    fix: "Correct the flow policy and re-baseline the mediated interface set",
  },
  audit: {
    short: "Audit integrity",
    noun: "audit record generation, retention and log integrity",
    owner: "System Security Engineer",
    detail: [
      "Both the generating component and the collector that holds the exported record were in scope.",
      "Retention was checked against the program schedule rather than against available storage.",
      "The assessor traced one event from generation through export to the retained copy.",
      "Clock quality was considered, because an audit record that cannot be ordered is of limited use.",
      "The assessor checked what happens when the collector is unreachable, not only the nominal path.",
    ],
    fix: "Correct audit generation and retention, then reconcile the collector holdings",
  },
  access: {
    short: "Access enforcement",
    noun: "access enforcement, least privilege and session control",
    owner: "System Security Engineer",
    detail: [
      "Privileged and unprivileged roles were exercised separately; the two paths differ on WS-X90.",
      "Enforcement was checked at the point of decision, not only in the role register.",
      "Emergency and maintenance roles were included because they carry the widest reach.",
      "Enforcement after a session is established was checked as well as enforcement at the point of entry.",
      "Payload command paths were treated as a distinct case because a wrong authorisation there is not recoverable.",
    ],
    fix: "Tighten the enforcement decision and reconcile the role register",
  },
  ident: {
    short: "Authentication",
    noun: "identification, authentication and credential management",
    owner: "System Security Engineer",
    detail: [
      "Device authentication was treated separately from operator authentication throughout.",
      "Credential lifecycle steps were followed as far as revocation, not only as far as issue.",
      "Both the interactive path and the machine-to-machine path were exercised.",
      "Shared and service identities were pulled out and looked at on their own terms.",
      "Re-authentication after a role change was exercised, not only the initial bind.",
    ],
    fix: "Close the credential lifecycle gap and re-verify both authentication paths",
  },
  integrity: {
    short: "System integrity",
    noun: "software, firmware and information integrity",
    owner: "Firmware Lead",
    detail: [
      "Verification at load and verification at rest were treated as separate questions.",
      "The signed artifact chain was followed back to the approved release record.",
      "Integrity reaction, not just integrity detection, was in scope for this objective.",
      "The assessor looked for what the system does when verification fails, not only that it verifies.",
      "Update staging was included, since an artifact is exposed for longest while it waits to be applied.",
    ],
    fix: "Restore end-to-end integrity verification and re-sign the affected artifacts",
  },
  config: {
    short: "Configuration baseline",
    noun: "configuration baselines, change control and inventory accuracy",
    owner: "Firmware Lead",
    detail: [
      "The as-built state was compared against the approved baseline, not against the design intent.",
      "Unauthorized-change detection was exercised as well as the recorded baseline itself.",
      "Inventory accuracy was checked against the components physically present in the test rig.",
      "Configuration settings applied at runtime were compared with the settings recorded as approved.",
      "The assessor asked what happens to an unapproved component that appears in the inventory, not only whether it is noticed.",
    ],
    fix: "Reconcile the as-built state with the approved baseline and close the change record",
  },
  maint: {
    short: "Maintenance control",
    noun: "maintenance authorization, tooling and service access",
    owner: "Platform Lead",
    detail: [
      "Both scheduled depot activity and unscheduled field service were considered.",
      "Authorization of the technician and authorization of the tool were checked separately.",
      "The session record, not the technician's account of it, was treated as the artifact.",
      "Remote and on-platform service paths were separated, because they authorise differently on WS-X90.",
      "The assessor followed one service action from request through authorisation to the closing record.",
    ],
    fix: "Correct the maintenance authorization workflow and re-baseline the tool set",
  },
  contingency: {
    short: "Recovery readiness",
    noun: "contingency planning, backup and controlled recovery",
    owner: "Platform Lead",
    detail: [
      "Availability for WS-X90 is categorised moderate, so the objective was read at that level and no continuous failover was expected.",
      "Recovery to a known-good configuration was the question, not uninterrupted operation.",
      "The restore path was walked as far as a verified configuration, not merely a readable copy.",
      "Backup currency was read against the last approved baseline rather than against the backup schedule.",
      "The assessor asked what state the system comes back in, not only whether it comes back.",
    ],
    fix: "Rehearse the recovery path and lodge a verified restore record",
  },
  supply: {
    short: "Supply chain assurance",
    noun: "acquisition, development process and supply chain assurance",
    owner: "Product Security Engineer",
    detail: [
      "Supplier obligations were read against the flow-down actually present in the contract set.",
      "Development-process artifacts were checked for currency against the shipping release.",
      "Component provenance was traced to the approved source of record rather than to a purchase note.",
      "The assessor separated what the program requires of a supplier from what the supplier has agreed in writing.",
      "Development-environment protections were treated as in scope, since they shape what ships.",
    ],
    fix: "Flow the requirement down to the supplier set and refresh the provenance record",
  },
  assessrisk: {
    short: "Continuous monitoring",
    noun: "assessment, continuous monitoring and risk determination",
    owner: "System Security Engineer",
    detail: [
      "The monitoring cadence was read against the program schedule, not against tool availability.",
      "Both the scan coverage and the disposition of what it returned were in scope.",
      "Risk determinations were checked for a named decision authority, not only for a score.",
      "The assessor looked for evidence the monitoring output reaches a decision, not only that it is produced.",
      "Coverage was compared against the expanded control set rather than the original authorization scope.",
    ],
    fix: "Restore the monitoring cadence and close out the outstanding dispositions",
  },
  incident: {
    short: "Incident response",
    noun: "incident handling, tracking and reporting",
    owner: "System Security Engineer",
    detail: [
      "Detection, containment and reporting were treated as three separate obligations.",
      "The reporting path off-platform was exercised as well as the on-platform handling.",
      "Exercise records were read for corrective actions, not only for attendance.",
      "Timeliness of reporting was checked against the program obligation rather than against team practice.",
      "The assessor asked how an incident on a fielded article reaches the program, not only how one in the lab does.",
    ],
    fix: "Close the incident handling gap and re-run the reporting rehearsal",
  },
  physical: {
    short: "Physical and media protection",
    noun: "physical access control and media protection",
    owner: "Platform Lead",
    detail: [
      "The integration facility and the flight-line enclosure were assessed as distinct environments.",
      "Media in transit between the two was included, not only media at rest.",
      "Sanitisation was read as far as verification of the result.",
      "Escort and unescorted access were separated, and the record of each was read on its own.",
      "Removable media used to move builds between environments was treated as in scope.",
    ],
    fix: "Correct the physical and media handling procedure and re-verify the controlled areas",
  },
  people: {
    short: "Personnel and training",
    noun: "personnel security, role-based training and security planning",
    owner: "Platform Lead",
    detail: [
      "Role-based content was distinguished from the general awareness material throughout.",
      "Position risk designations were read against the roles actually performing the work.",
      "Plan currency was checked against the expanded WS-X90 scope, not the original scope.",
      "Training records were read for the roles that actually touch the expanded scope, not for headcount.",
      "The assessor checked that a role change triggers a review, not only that an initial screening happened.",
    ],
    fix: "Refresh the role-based content and re-issue the affected plan",
  },
};

/** Ordered so every downstream loop is deterministic. */
const THEME_ORDER = [
  "crypto",
  "boundary",
  "audit",
  "access",
  "ident",
  "integrity",
  "config",
  "maint",
  "contingency",
  "supply",
  "assessrisk",
  "incident",
  "physical",
  "people",
];

/** How many fail results each theme carries. Sums to 36, and every count fits the pool. */
const FAIL_PLAN = {
  crypto: 0,
  boundary: 6,
  audit: 4,
  access: 4,
  ident: 3,
  integrity: 3,
  config: 3,
  maint: 2,
  contingency: 2,
  supply: 3,
  assessrisk: 2,
  incident: 2,
  physical: 1,
  people: 1,
};

/**
 * Severity is not planned by theme. It is carried on each authored finding in
 * scripts/wsx90-findings.json, because it has to follow the impact of the defect the
 * assessor found rather than the family the control sits in - a policy currency gap
 * and a lost authentication factor are not the same finding because they share a
 * theme. The distribution (critical 2 / high 8 / moderate 18 / low 8) is checked
 * against TARGET.severity below, so a drift in the authored table fails the run.
 */
const SEVERITIES = new Set(["low", "moderate", "high", "critical"]);

/** How each theme's findings cluster into risks. Sums to 24 risks over 36 findings. */
const RISK_PLAN = {
  crypto: [],
  boundary: [3, 2, 1],
  audit: [3, 1],
  access: [2, 1, 1],
  ident: [2, 1],
  integrity: [3],
  config: [2, 1],
  maint: [1, 1],
  contingency: [1, 1],
  supply: [3],
  assessrisk: [1, 1],
  incident: [1, 1],
  physical: [1],
  people: [1],
};

// ---------------------------------------------------------------------------
// observation frames - four per (method, outcome), then a theme sentence.
// The frames say what the assessor did; the theme sentence says what it was about.
// ---------------------------------------------------------------------------

const FRAMES = {
  "examine|pass": [
    "The assessor examined the configuration export and release record lodged for {R} and confirmed every acceptance criterion holds on {K}.",
    "Document review against {R} traced each {C} acceptance criterion to a dated artifact covering {K}, with no unexplained gap.",
    "Examination of the change record and its approvals showed the state {R} calls for is present on {K} and attributable to an approved baseline.",
    "The artifact supplied for {R} was read against {C} criterion by criterion; the recorded state on {K} matches what the requirement asks for.",
  ],
  "examine|fail": [
    "Examination of the artifact supplied for {R} found the {C} criteria only partly evidenced on {K}; one criterion has no supporting record at all.",
    "Review against {R} showed the documented state on {K} has drifted from the approved baseline, so the {C} criteria cannot be judged met.",
    "Document review for {R} found the artifact covers a subset of {K}; the remaining components in scope are unaddressed.",
    "Examination found the record lodged for {R} predates the last approved change to {K}, so it does not evidence the current {C} state.",
  ],
  "examine|inconclusive": [
    "The artifact offered for {R} is dated inside the window but does not identify which of {K} it covers, so the assessor reached no determination.",
    "Examination of {R} was suspended pending a complete export from {K}; the supplied record stops part way through the period.",
    "Review of {R} raised a scoping question the program has not yet answered for {K}, so the {C} determination is held over.",
    "The evidence for {R} disagrees with the change record for {K}; the {C} judgement waits on that reconciliation.",
  ],
  "examine|not-assessed": [
    "{R} is inside the campaign scope but the {C} examination on {K} is not yet scheduled in this period.",
    "No examination of {R} has begun; the work on {K} is still in build and no artifact has been offered.",
    "The assessor deferred {R} to a later increment because the {C} baseline for {K} has not been approved.",
    "{R} remains unexamined this period; the program lists the {C} activity on {K} as planned rather than delivered.",
  ],
  "interview|pass": [
    "Interviews with the engineers accountable for {K} described the practice {R} calls for, and their account reconciled with the {C} record on file.",
    "The responsible role walked the assessor through the {C} workflow on {K}; the described practice meets every acceptance criterion in {R}.",
    "Discussion with the operating staff confirmed the {R} steps are performed as written for {K}, with named accountability at each hand-off.",
    "Interview responses about {K} were consistent across roles and matched the {C} expectation recorded in {R}.",
  ],
  "interview|fail": [
    "Interviews about {K} described a practice that departs from {R} at the hand-off step, and no compensating step for {C} was identified.",
    "The roles interviewed for {R} gave differing accounts of who authorises the {C} action on {K}; accountability is not established.",
    "Discussion showed the {R} procedure for {K} is understood but not performed at the stated cadence, so the {C} criteria are not met.",
    "Interview responses for {R} confirmed the {C} step on {K} is skipped when the schedule compresses, which the requirement does not allow.",
  ],
  "interview|inconclusive": [
    "Only one of the two roles named in {R} was available this period, so the {C} account for {K} could not be corroborated.",
    "Interviews for {R} described a practice on {K} that the assessor could not reconcile with the record before the window closed.",
    "The staff interviewed about {K} referred the {C} question in {R} to a role that has since changed hands; the determination is held over.",
    "Accounts of the {C} step on {K} varied between shifts, and {R} was left unresolved pending a further session.",
  ],
  "interview|not-assessed": [
    "The interview for {R} was not held; the roles that perform the {C} activity on {K} are not yet stood up for the expanded scope.",
    "{R} carries no determination because the {C} responsibilities for {K} are still being assigned.",
    "No interview covering {R} took place this period; the program deferred the {C} discussion for {K} to the next increment.",
    "The assessor scheduled but did not conduct the {R} session; {C} practice on {K} remains undescribed.",
  ],
  "test|pass": [
    "A sample of {N} runs on {K} exercised the behaviour {R} specifies, and every run produced the {C} outcome the requirement expects.",
    "Functional testing against {K} reproduced the enforcement {R} describes across {N} cases with no exception recorded.",
    "The assessor drove {N} negative cases at {K}; each was refused as {R} requires and each refusal was recorded as {C} expects.",
    "Test execution on {K} confirmed the {C} state {R} calls for, including across restart, over {N} observations.",
  ],
  "test|fail": [
    "Of {N} test cases run against {K}, {F} did not produce the outcome {R} specifies; the {C} enforcement is not consistent.",
    "Testing on {K} showed the {C} behaviour {R} requires holds on the primary path but not on the fallback path, which failed {F} of {N} times.",
    "The assessor reproduced a bypass of the enforcement {R} describes on {K} in {F} of {N} attempts.",
    "Test runs against {K} recorded {F} of {N} cases where the {C} state {R} expects was not reached inside the required interval.",
  ],
  "test|inconclusive": [
    "The test on {K} could not be completed: {N} runs ended in an instrumentation fault, leaving the {R} determination open.",
    "Testing of {R} was cut short when the harness lost telemetry from {K}; the {C} judgement waits on a rerun.",
    "Results from {N} runs on {K} split between the expected state and an unexplained one, so {R} is recorded as unresolved.",
    "The assessor could not separate {C} behaviour on {K} from adjacent activity in the rig, so {R} carries no determination this period.",
  ],
  "test|not-assessed": [
    "{R} was not tested this period; the {C} function on {K} is not yet available in the integration rig.",
    "No test of {R} has been run because the {C} build for {K} has not been released to the assessor.",
    "The assessor deferred testing of {R}; rig time for {K} is committed to the original scope through this window.",
    "{R} remains untested; the program has scheduled the {C} activity on {K} for a later increment.",
  ],
};

// ---------------------------------------------------------------------------
// load
// ---------------------------------------------------------------------------

const seed = JSON.parse(readFileSync(SEED_PATH, "utf8"));
const authoredFindings = JSON.parse(readFileSync(FINDINGS_PATH, "utf8"));

const componentName = new Map(seed.components.map((c) => [c.id, c.name]));
const componentSubsystem = new Map(seed.components.map((c) => [c.id, c.subsystem_id]));
const requirementById = new Map(seed.requirements.map((r) => [r.id, r]));
const evidenceById = new Map(seed.evidence.map((e) => [e.id, e]));
const generatedProfile = JSON.parse(readFileSync(GENERATED_PATH, "utf8")).profiles[0];
const effectiveControls = new Set(generatedProfile.effective_control_ids);
if (effectiveControls.size !== 546)
  fail(
    "effective-set-size",
    "profiles[0]",
    `expected 546 effective controls, found ${effectiveControls.size}`,
  );

/** requirement id -> evidence ids that name it. */
const evidenceByRequirement = new Map();
for (const artifact of seed.evidence)
  for (const requirementId of artifact.requirement_ids) {
    if (!evidenceByRequirement.has(requirementId)) evidenceByRequirement.set(requirementId, []);
    evidenceByRequirement.get(requirementId).push(artifact.id);
  }
/** Earliest collection first, so a citation reaches for the artifact that existed soonest. */
for (const ids of evidenceByRequirement.values())
  ids.sort((a, b) => {
    const left = evidenceById.get(a)?.collected_at ?? "";
    const right = evidenceById.get(b)?.collected_at ?? "";
    return left < right ? -1 : left > right ? 1 : a.localeCompare(b);
  });

/** The artifact a result row or finding cites for a requirement. */
const citedEvidence = (requirementId) =>
  (evidenceByRequirement.get(requirementId) ?? []).slice(0, 1);

/**
 * Cause before effect (brief section 6.4). An assessor cannot have relied on an
 * artifact that did not yet exist, so the first day offset a row may carry is the
 * day after the latest collection among the artifacts it cites. Returning a day
 * offset rather than a stamp keeps the comparison strict whatever hour either side
 * happens to fall on.
 */
const earliestOffsetFor = (evidenceIds) => {
  let day = RESULT_DAY0;
  for (const id of evidenceIds) {
    const artifact = evidenceById.get(id);
    if (artifact) day = Math.max(day, toDay(artifact.collected_at) + 1);
  }
  return day - RESULT_DAY0;
};

const reqNumber = (id) => Number.parseInt(id.slice(4), 10);
const byReqId = (a, b) => reqNumber(a.id) - reqNumber(b.id);

/** The expanded scope: everything the assembly step added. */
const newRequirements = seed.requirements.filter((r) => reqNumber(r.id) >= 121).sort(byReqId);

// ---------------------------------------------------------------------------
// idempotency - strip anything a previous run of THIS script wrote
// ---------------------------------------------------------------------------

const before = {
  assessments: seed.assessments.length,
  results: seed.assessment_results.length,
  findings: seed.findings.length,
  risks: seed.risks.length,
  poam: seed.poam_items.length,
};

seed.assessments = seed.assessments.filter((a) => a.id !== ASSESSMENT_ID);
seed.assessment_results = seed.assessment_results.filter(
  (r) => r.assessment_id !== ASSESSMENT_ID && !String(r.id ?? "").startsWith("AR-002-"),
);
seed.findings = seed.findings.filter((f) => Number.parseInt(f.id.slice(4), 10) <= 16);
seed.risks = seed.risks.filter((r) => Number.parseInt(r.id.slice(4), 10) <= 16);
seed.poam_items = seed.poam_items.filter((p) => Number.parseInt(p.id.slice(5), 10) <= 16);

const baseline = {
  assessments: seed.assessments.length,
  results: seed.assessment_results.length,
  findings: seed.findings.length,
  risks: seed.risks.length,
  poam: seed.poam_items.length,
};

// ---------------------------------------------------------------------------
// requirement pools
// ---------------------------------------------------------------------------

const hasEvidence = (r) => (evidenceByRequirement.get(r.id) ?? []).length > 0;

const implementedWithEvidence = newRequirements.filter(
  (r) => r.implementation_status === "implemented" && hasEvidence(r),
);
const partialWithEvidence = newRequirements.filter(
  (r) => r.implementation_status === "partially-implemented" && hasEvidence(r),
);
const unevidenced = newRequirements.filter(
  (r) => r.implementation_status === "planned" || r.implementation_status === "not-implemented",
);

/**
 * Even stride over an ordered pool. Used everywhere a subset is drawn so the
 * selection spreads across families and id ranges instead of clustering.
 */
const stride = (pool, count) => {
  if (count > pool.length) return null;
  const picked = [];
  for (let i = 0; i < count; i += 1) picked.push(pool[Math.floor((i * pool.length) / count)]);
  return picked;
};

// --- fail requirements, drawn per theme from partially-implemented + evidence ---

const partialByTheme = new Map(THEME_ORDER.map((t) => [t, []]));
for (const requirement of partialWithEvidence)
  partialByTheme.get(themeOf(requirement.control_ids[0])).push(requirement);

const failRequirements = []; // { requirement, theme, severity }
for (const theme of THEME_ORDER) {
  const pool = partialByTheme.get(theme);
  const want = FAIL_PLAN[theme];
  const picked = stride(pool, want);
  if (!picked) {
    fail(
      "fail-pool-exhausted",
      theme,
      `needs ${want} partially-implemented rows with evidence, pool holds ${pool.length}`,
    );
    continue;
  }
  for (const requirement of picked.sort(byReqId)) failRequirements.push({ requirement, theme });
}

const failIds = new Set(failRequirements.map((f) => f.requirement.id));
const partialRemaining = partialWithEvidence.filter((r) => !failIds.has(r.id));

const inconclusiveRequirements = stride(partialRemaining, TARGET.inconclusive) ?? [];
const inconclusiveIds = new Set(inconclusiveRequirements.map((r) => r.id));
const partialForPass = partialRemaining.filter((r) => !inconclusiveIds.has(r.id));

const partialPasses =
  stride(partialForPass, TARGET.pass - TARGET.retests - implementedWithEvidence.length) ?? [];
const passRequirements = [...implementedWithEvidence, ...partialPasses].sort(byReqId);

const notAssessedRequirements = stride(unevidenced, TARGET.notAssessed) ?? [];

// ---------------------------------------------------------------------------
// findings, risks and closures - decided before the results so the retest rows
// can be dated after the fail they answer.
// ---------------------------------------------------------------------------

/**
 * Findings, in theme order, one per fail. The id-to-requirement binding is the
 * contract between this script and the authored table: if a pool ever shifts under
 * the generator, the requirement the authored text describes and the requirement the
 * record points at part company, and the run aborts here rather than shipping a
 * finding that describes the wrong defect.
 */
const findings = failRequirements.map((entry, index) => {
  const id = `FND-${String(17 + index).padStart(3, "0")}`;
  const authored = authoredFindings[id];
  if (!authored) {
    fail("finding-not-authored", id, "no entry in scripts/wsx90-findings.json");
    return { ...entry, id, authored: null, severity: "moderate" };
  }
  if (authored.requirement_id !== entry.requirement.id)
    fail(
      "finding-binding-drift",
      id,
      `authored for ${authored.requirement_id}, generator paired it with ${entry.requirement.id}`,
    );
  if (!SEVERITIES.has(authored.severity))
    fail("finding-severity-enum", id, `${authored.severity} is not a severity`);
  return { ...entry, id, authored, severity: authored.severity };
});
const findingById = new Map(findings.map((f) => [f.id, f]));
for (const id of Object.keys(authoredFindings))
  if (id.startsWith("FND-") && !findingById.has(id))
    fail("finding-authored-orphan", id, "authored but no fail result carries this id");

/** Risk clusters: walk each theme's findings in order and chunk by RISK_PLAN. */
const riskClusters = [];
{
  let cursor = 0;
  for (const theme of THEME_ORDER) {
    const themeFindings = findings.filter((f) => f.theme === theme);
    let offset = 0;
    for (const size of RISK_PLAN[theme]) {
      riskClusters.push({
        id: `RSK-${String(17 + cursor).padStart(3, "0")}`,
        theme,
        members: themeFindings.slice(offset, offset + size),
      });
      offset += size;
      cursor += 1;
    }
    if (offset !== themeFindings.length)
      fail(
        "risk-plan-mismatch",
        theme,
        `plan covers ${offset} findings, theme has ${themeFindings.length}`,
      );
  }
}

/** finding id -> risk id */
const riskOfFinding = new Map();
for (const cluster of riskClusters)
  for (const member of cluster.members) riskOfFinding.set(member.id, cluster.id);

/**
 * Closures. Four are the sole finding of a singleton risk and carry a low severity,
 * so their risk closes out and its POA&M reads completed. Two more sit inside
 * multi-finding risks, which therefore stay open. Every one gets a passing retest.
 */
const closedFindingIds = new Set();
/**
 * A closure has to fit a fail and then a retest into the window, and both rows have
 * to follow the artifact they cite. A requirement whose evidence lands too late for
 * that cannot carry the story at all, so candidacy is filtered on the artifact's own
 * date rather than discovered later by a date that will not fit.
 */
const CLOSURE_EVIDENCE_LIMIT = RESULT_SPAN - MIN_RETEST_GAP_DAYS; // 59
const retestable = (member) =>
  earliestOffsetFor(citedEvidence(member.requirement.id)) <= CLOSURE_EVIDENCE_LIMIT;
for (const cluster of riskClusters) {
  if (closedFindingIds.size >= 4) break;
  if (
    cluster.members.length === 1 &&
    cluster.members[0].severity === "low" &&
    retestable(cluster.members[0])
  )
    closedFindingIds.add(cluster.members[0].id);
}
for (const cluster of riskClusters) {
  if (closedFindingIds.size >= TARGET.retests) break;
  if (cluster.members.length < 2) continue;
  const candidate = cluster.members.find(
    (m) => m.severity === "moderate" && !closedFindingIds.has(m.id) && retestable(m),
  );
  if (candidate) closedFindingIds.add(candidate.id);
}
if (closedFindingIds.size !== TARGET.retests)
  fail(
    "closure-plan",
    "findings",
    `selected ${closedFindingIds.size} closures, expected ${TARGET.retests}`,
  );

/** Fail rows whose finding closes are dated early so the retest can land late. */
const closedRequirementIds = new Set(
  findings.filter((f) => closedFindingIds.has(f.id)).map((f) => f.requirement.id),
);

// ---------------------------------------------------------------------------
// authored prose
// ---------------------------------------------------------------------------

const joinNames = (componentIds) => {
  const names = componentIds.map((id) => `${componentName.get(id)} (${id})`);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};
const joinIds = (list) => {
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
};

/** A stable small integer per record, used for sample sizes and frame rotation. */
const spread = (key, modulo) => {
  const digest = createHash("sha1").update(key, "utf8").digest();
  return ((digest[0] << 8) | digest[1]) % modulo;
};

const composeNote = (requirement, outcome, salt) => {
  const key = `${FRAMES[`${requirement.verification_method}|${outcome}`] ? "" : "x"}${requirement.id}:${outcome}:${salt}`;
  const bank = FRAMES[`${requirement.verification_method}|${outcome}`];
  const frame = bank[spread(`frame:${key}`, bank.length)];
  const theme = THEMES[themeOf(requirement.control_ids[0])];
  const detail = theme.detail[spread(`detail:${key}`, theme.detail.length)];
  const sample = 6 + spread(`sample:${key}`, 19); // 6..24
  const failed = 1 + spread(`failed:${key}`, Math.max(1, Math.floor(sample / 3)));
  const text = frame
    .replaceAll("{R}", requirement.id)
    .replaceAll("{C}", joinIds(requirement.control_ids))
    .replaceAll("{K}", joinNames(requirement.component_ids))
    .replaceAll("{N}", String(sample))
    .replaceAll("{F}", String(failed));
  return `${text} ${detail} ${MARKER}`;
};

// ---------------------------------------------------------------------------
// assessment_results
// ---------------------------------------------------------------------------

/**
 * Rows are built per outcome, then sorted into a single stable order by
 * (assessed_on, requirement id) before ids are stamped, so AR-002-NNNN runs
 * forward in time the way an assessment log does.
 */
const draftRows = [];

const pushRow = (requirement, outcome, dayOffset, salt, { hurry = false } = {}) => {
  const evidenceIds =
    outcome === "pass" || outcome === "fail" || outcome === "inconclusive"
      ? citedEvidence(requirement.id)
      : [];
  /**
   * The requested offset is a wish, not a date. A row may only land once the
   * artifact it cites exists: one asked for earlier slides past the collection with
   * a short review lag, one already clear of it keeps the day it was given, and one
   * marked hurry takes the first legal day so whatever has to follow it has room.
   * The result window runs three days past the evidence window, so a legal day
   * always exists.
   */
  const floorOffset = earliestOffsetFor(evidenceIds);
  const lag = hurry ? 0 : spread(`lag:${requirement.id}:${salt}`, REVIEW_LAG_DAYS);
  const resolved =
    dayOffset >= floorOffset
      ? dayOffset
      : Math.max(floorOffset, Math.min(RESULT_SPAN, floorOffset + lag));
  if (resolved > RESULT_SPAN)
    fail(
      "evidence-outruns-window",
      requirement.id,
      `evidence for the ${outcome} row is collected past ${RESULTS_LAST_DAY}`,
    );
  draftRows.push({
    requirement_id: requirement.id,
    control_ids: [...requirement.control_ids],
    component_ids: [...requirement.component_ids],
    method: requirement.verification_method,
    outcome,
    evidence_ids: evidenceIds,
    dayOffset: resolved,
    slot: spread(`slot:${requirement.id}:${salt}`, 6),
    notes: composeNote(requirement, outcome, salt),
  });
};

/** Primary rows: one per reached requirement, dated evenly across the window. */
const primaries = [
  ...passRequirements.map((r) => ({ requirement: r, outcome: "pass" })),
  ...failRequirements.map((f) => ({ requirement: f.requirement, outcome: "fail" })),
  ...inconclusiveRequirements.map((r) => ({ requirement: r, outcome: "inconclusive" })),
  ...notAssessedRequirements.map((r) => ({ requirement: r, outcome: "not-assessed" })),
].sort((a, b) => byReqId(a.requirement, b.requirement) || a.outcome.localeCompare(b.outcome));

primaries.forEach((entry, index) => {
  let dayOffset = Math.floor((index * RESULT_SPAN) / Math.max(1, primaries.length - 1));
  // A fail that gets closed out sits as early as its own evidence allows, so the
  // remediation and the retest have room to follow it inside the window.
  const closing = entry.outcome === "fail" && closedRequirementIds.has(entry.requirement.id);
  if (closing) dayOffset = Math.min(dayOffset, 6 + (index % 14));
  pushRow(entry.requirement, entry.outcome, dayOffset, "primary", { hurry: closing });
});

/** Retests: the six closed findings, each a later pass on the same requirement. */
const retestOrder = findings
  .filter((f) => closedFindingIds.has(f.id))
  .sort((a, b) => byReqId(a.requirement, b.requirement));
retestOrder.forEach((entry, index) => {
  /**
   * Late in the window, and never on or before the fail it answers. The remediation
   * gap is the aim; where the fail was forced late by its own evidence the retest
   * takes the last day the window has, which candidacy guarantees is at least
   * MIN_RETEST_GAP_DAYS past the fail.
   */
  const failed = draftRows.find(
    (row) => row.requirement_id === entry.requirement.id && row.outcome === "fail",
  );
  if (!failed) {
    fail("retest-without-fail", entry.requirement.id, "no fail row to answer");
    return;
  }
  const day = Math.min(
    RESULT_SPAN,
    Math.max(RESULT_SPAN - 8 + index, failed.dayOffset + RETEST_GAP_DAYS),
  );
  if (day - failed.dayOffset < MIN_RETEST_GAP_DAYS)
    fail(
      "retest-gap-too-narrow",
      entry.requirement.id,
      `${day - failed.dayOffset} day(s) between the fail and its retest`,
    );
  pushRow(entry.requirement, "pass", day, "retest");
});

/** Stamp, order and id. */
for (const row of draftRows) row.assessed_on = stampFor(row.dayOffset, row.slot);
draftRows.sort(
  (a, b) =>
    Date.parse(a.assessed_on) - Date.parse(b.assessed_on) ||
    reqNumber(a.requirement_id) - reqNumber(b.requirement_id) ||
    a.outcome.localeCompare(b.outcome),
);

const assessmentResults = draftRows.map((row, index) => ({
  id: `AR-002-${String(index + 1).padStart(4, "0")}`,
  assessment_id: ASSESSMENT_ID,
  requirement_id: row.requirement_id,
  control_ids: row.control_ids,
  component_ids: row.component_ids,
  method: row.method,
  outcome: row.outcome,
  evidence_ids: row.evidence_ids,
  assessed_on: row.assessed_on,
  notes: row.notes,
}));

/** The most recent result per requirement, used to prove the retest lands last. */
const latestResultByRequirement = new Map();
for (const row of assessmentResults) {
  const held = latestResultByRequirement.get(row.requirement_id);
  if (!held || Date.parse(row.assessed_on) >= Date.parse(held.assessed_on))
    latestResultByRequirement.set(row.requirement_id, row);
}

// ---------------------------------------------------------------------------
// assessment
// ---------------------------------------------------------------------------

const scopeRequirementIds = newRequirements.map((r) => r.id);
const scopeControlIds = [...new Set(newRequirements.flatMap((r) => r.control_ids))].sort((a, b) =>
  a.localeCompare(b, "en"),
);
const scopeComponentIds = [...new Set(newRequirements.flatMap((r) => r.component_ids))].sort();
const scopeSubsystemIds = [
  ...new Set(scopeComponentIds.map((id) => componentSubsystem.get(id))),
].sort();

const assessment = {
  id: ASSESSMENT_ID,
  uuid: mintUuid(ASSESSMENT_ID),
  name: "WS-X90 Expanded Control Set Assessment",
  type: "authorization",
  scope: {
    system_id: "SYS-WSX90",
    subsystem_ids: scopeSubsystemIds,
    component_ids: scopeComponentIds,
    control_ids: scopeControlIds,
    requirement_ids: scopeRequirementIds,
  },
  methods: ["examine", "interview", "test"],
  status: "in-progress",
  planned_start: WINDOW_START,
  planned_end: WINDOW_END,
  assessor_role: "Independent Security Assessor",
  description:
    "Independent assessment of the WS-X90 Sentinel Mission System against the expanded tailored control set, run by Aurora Defense Systems after the original 74-control authorization scope was widened. Roughly half the scope has a determination at the reporting date; the remainder is scheduled into later increments. " +
    PROSE_MARKER,
};

// ---------------------------------------------------------------------------
// findings
// ---------------------------------------------------------------------------

/**
 * Titles and descriptions come from scripts/wsx90-findings.json, one hand-written
 * entry per finding, derived from the failing requirement's threshold, the control
 * implementation narrative that states what is missing, and the artifact the assessor
 * read. The only string added here is the synthetic-content marker, so no wording is
 * shared between two findings and each one names its own defect and its own LRU.
 */
const findingRecords = findings.map((entry) => {
  const { requirement, severity, id, authored } = entry;
  const closed = closedFindingIds.has(id);
  const evidenceIds = citedEvidence(requirement.id);
  return {
    id,
    uuid: mintUuid(id),
    title: authored?.title ?? id,
    description: `${authored?.description ?? ""} ${PROSE_MARKER}`,
    assessment_id: ASSESSMENT_ID,
    requirement_ids: [requirement.id],
    control_ids: [...requirement.control_ids],
    component_ids: [...requirement.component_ids],
    status: closed ? "closed" : "open",
    severity,
    evidence_ids: evidenceIds,
    risk_id: riskOfFinding.get(id),
  };
});

// ---------------------------------------------------------------------------
// risks
// ---------------------------------------------------------------------------

const SEVERITY_RANK = { low: 0, moderate: 1, high: 2, critical: 3 };
const RANK_SEVERITY = ["low", "moderate", "high", "critical"];
const LIKELIHOOD = { low: "low", moderate: "moderate", high: "moderate", critical: "moderate" };
const IMPACT = { low: "low", moderate: "moderate", high: "high", critical: "high" };

const riskRecords = riskClusters.map((cluster) => {
  const meta = THEMES[cluster.theme];
  const worst = cluster.members.reduce((rank, m) => Math.max(rank, SEVERITY_RANK[m.severity]), 0);
  const overall = RANK_SEVERITY[worst];
  const allClosed = cluster.members.every((m) => closedFindingIds.has(m.id));
  const controls = [...new Set(cluster.members.flatMap((m) => m.requirement.control_ids))].sort();
  const components = [
    ...new Set(cluster.members.flatMap((m) => m.requirement.component_ids)),
  ].sort();
  const requirementIds = cluster.members.map((m) => m.requirement.id);
  return {
    id: cluster.id,
    uuid: mintUuid(cluster.id),
    title: `${meta.short} risk on ${componentName.get(components[0])} arising from ${joinIds(controls)}`,
    statement:
      `${cluster.members.length === 1 ? "One assessment finding" : `${cluster.members.length} assessment findings`} in ${ASSESSMENT_ID} show ${meta.noun} is not fully established for ${joinIds(requirementIds)} on ${joinNames(components)}. ` +
      `If the condition persists, WS-X90 may not hold the protection its tailored selection of ${joinIds(controls)} was chosen to provide, and the authorization package would carry that gap forward. ` +
      (allClosed
        ? `The contributing findings have been corrected and retested, so the risk is recorded as mitigated pending the next monitoring cycle. `
        : `The risk stays open until every contributing finding is corrected, re-evidenced and retested. `) +
      PROSE_MARKER,
    likelihood: allClosed ? "low" : LIKELIHOOD[overall],
    impact: IMPACT[overall],
    overall,
    finding_ids: cluster.members.map((m) => m.id),
    status: allClosed ? "mitigated" : "open",
  };
});

// ---------------------------------------------------------------------------
// poam_items
// ---------------------------------------------------------------------------

const MILESTONE_STATUS_PATTERNS = [
  ["completed", "in-progress", "planned", "planned"],
  ["in-progress", "planned", "planned", "planned"],
  ["completed", "completed", "in-progress", "planned"],
];

const milestoneTitle = (theme, step, controls) => {
  const meta = THEMES[theme];
  return [
    `${meta.fix} for ${controls}`,
    `Update the WS-X90 configuration baseline and release record for the corrected state`,
    `Collect replacement evidence and lodge it against the affected requirements`,
    `Retest with the independent assessor and close the ${meta.short.toLowerCase()} finding`,
  ][step];
};

/** 0-based position of a closed-out cluster among the closed-out clusters. */
const closedClusterIndexes = riskClusters
  .map((cluster, index) => ({ cluster, index }))
  .filter(({ cluster }) => cluster.members.every((m) => closedFindingIds.has(m.id)))
  .map(({ index }) => index);
const closedPoamRank = (index) => closedClusterIndexes.indexOf(index);

const poamRecords = riskClusters.map((cluster, index) => {
  const risk = riskRecords[index];
  const meta = THEMES[cluster.theme];
  const id = `POAM-${String(17 + index).padStart(3, "0")}`;
  const allClosed = cluster.members.every((m) => closedFindingIds.has(m.id));
  const controls = [...new Set(cluster.members.flatMap((m) => m.requirement.control_ids))].sort();
  const components = [
    ...new Set(cluster.members.flatMap((m) => m.requirement.component_ids)),
  ].sort();
  const requirementIds = cluster.members.map((m) => m.requirement.id);

  const milestoneCount = allClosed ? 3 : index % 2 === 0 ? 4 : 3;
  const startOffset = index % 3; // Oct / Nov / Dec 2026, so the last one lands by 2027-03
  const day = 5 + (index % 20);
  const statuses = allClosed
    ? ["completed", "completed", "completed", "completed"]
    : MILESTONE_STATUS_PATTERNS[index % MILESTONE_STATUS_PATTERNS.length];

  const milestones = [];
  let lastTarget = "";
  const closedRank = allClosed ? closedPoamRank(index) : 0;
  for (let step = 0; step < milestoneCount; step += 1) {
    // A closed-out item did its work inside the assessment window, so its three
    // milestones run on a three-week cadence from early October and every one of
    // them lands on or before the reporting date. An open item runs monthly from
    // its October / November / December start so the last target stays inside March.
    let target;
    if (allClosed) {
      target = fromDay(toDay(`2026-10-${String(3 + closedRank * 2).padStart(2, "0")}`) + step * 21);
    } else {
      const [year, month] = addMonths(2026, 10, startOffset + step);
      target = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    lastTarget = target;
    const milestone = {
      id: `${id}-M${step + 1}`,
      title: milestoneTitle(cluster.theme, step, joinIds(controls)),
      status: statuses[step],
      target_date: target,
    };
    // A completed milestone only carries completed_at when its target falls on or
    // before the assessment report date; nothing claims a completion that has
    // not happened yet in the dataset's own timeline.
    if (statuses[step] === "completed" && target <= WINDOW_END.slice(0, 10))
      milestone.completed_at = `${target}T17:00:00Z`;
    milestones.push(milestone);
  }

  return {
    id,
    uuid: mintUuid(id),
    title: `Remediate ${meta.short.toLowerCase()} gap in ${joinIds(controls)}`,
    description:
      `Close the ${meta.noun} shortfall recorded by ${ASSESSMENT_ID} against ${joinIds(requirementIds)} on ${joinNames(components)}. ` +
      `The work covers the engineering correction, the baseline and release record that carries it, the replacement evidence and the independent retest. ` +
      PROSE_MARKER,
    risk_ids: [risk.id],
    finding_ids: cluster.members.map((m) => m.id),
    control_ids: controls,
    requirement_ids: requirementIds,
    component_ids: components,
    owner_role: meta.owner,
    status: allClosed ? "completed" : "open",
    planned_completion: fromDay(toDay(lastTarget) + 21),
    milestones,
  };
});

// ---------------------------------------------------------------------------
// commit the new records
// ---------------------------------------------------------------------------

seed.assessments.push(assessment);
seed.assessment_results.push(...assessmentResults);
seed.findings.push(...findingRecords);
seed.risks.push(...riskRecords);
seed.poam_items.push(...poamRecords);

// ---------------------------------------------------------------------------
// open item O-2 - the existing "complete" milestones render as Planned
// ---------------------------------------------------------------------------

let o2Fixed = 0;
for (const item of seed.poam_items)
  for (const milestone of item.milestones)
    if (milestone.status === "complete") {
      milestone.status = "completed";
      o2Fixed += 1;
    }

// ---------------------------------------------------------------------------
// traceability_views - recomputed from the final records
//
// Key policy (open item O-5): control_to_requirements and component_to_requirements
// key only what actually appears; requirement_to_evidence and requirement_to_findings
// carry a key for EVERY requirement, empty array included. That is the policy the
// shipped file already follows.
// ---------------------------------------------------------------------------

const controlToRequirements = new Map();
const componentToRequirements = new Map();
for (const requirement of seed.requirements) {
  for (const control of requirement.control_ids) {
    if (!controlToRequirements.has(control)) controlToRequirements.set(control, []);
    controlToRequirements.get(control).push(requirement.id);
  }
  for (const component of requirement.component_ids) {
    if (!componentToRequirements.has(component)) componentToRequirements.set(component, []);
    componentToRequirements.get(component).push(requirement.id);
  }
}

const requirementToEvidence = new Map(seed.requirements.map((r) => [r.id, []]));
for (const artifact of seed.evidence)
  for (const requirementId of artifact.requirement_ids)
    requirementToEvidence.get(requirementId)?.push(artifact.id);

const requirementToFindings = new Map(seed.requirements.map((r) => [r.id, []]));
for (const finding of seed.findings)
  for (const requirementId of finding.requirement_ids)
    requirementToFindings.get(requirementId)?.push(finding.id);

const controlSortKey = (controlId) => {
  const family = controlId.slice(0, 2);
  const rest = controlId.slice(3);
  const base = Number.parseInt(rest, 10);
  const enhancement = rest.includes("(") ? Number.parseInt(rest.split("(")[1], 10) : 0;
  return `${family}|${String(base).padStart(3, "0")}|${String(enhancement).padStart(3, "0")}`;
};

const objectFrom = (map, keys) => {
  const out = {};
  for (const key of keys)
    out[key] = [...new Set(map.get(key))].sort((a, b) => reqNumber(a) - reqNumber(b));
  return out;
};
const objectFromValuesById = (map, keys) => {
  const out = {};
  for (const key of keys) out[key] = [...new Set(map.get(key))].sort();
  return out;
};

seed.traceability_views = {
  control_to_requirements: objectFrom(
    controlToRequirements,
    [...controlToRequirements.keys()].sort((a, b) =>
      controlSortKey(a).localeCompare(controlSortKey(b), "en"),
    ),
  ),
  component_to_requirements: objectFrom(
    componentToRequirements,
    [...componentToRequirements.keys()].sort(),
  ),
  requirement_to_evidence: objectFromValuesById(
    requirementToEvidence,
    seed.requirements.map((r) => r.id),
  ),
  requirement_to_findings: objectFromValuesById(
    requirementToFindings,
    seed.requirements.map((r) => r.id),
  ),
};

// ---------------------------------------------------------------------------
// validation - refuse on the first error class, naming the record
// ---------------------------------------------------------------------------

const tally = (values) =>
  values.reduce((counts, value) => ((counts[value] = (counts[value] ?? 0) + 1), counts), {});

// ids and uuids unique across every scanned collection
{
  const seen = new Map();
  for (const key of [
    "profiles",
    "systems",
    "subsystems",
    "components",
    "requirements",
    "control_implementations",
    "evidence",
    "assessments",
    "findings",
    "risks",
    "poam_items",
    "control_sources",
  ])
    for (const record of seed[key]) {
      if (seen.has(record.id)) fail("duplicate-id", record.id, `also in ${seen.get(record.id)}`);
      seen.set(record.id, key);
    }
  const uuids = new Map();
  const walk = (node, path) => {
    if (Array.isArray(node)) return node.forEach((child, i) => walk(child, `${path}[${i}]`));
    if (node && typeof node === "object")
      for (const [key, value] of Object.entries(node)) {
        if (key === "uuid" && typeof value === "string") {
          if (uuids.has(value))
            fail("duplicate-uuid", path, `${value} also at ${uuids.get(value)}`);
          uuids.set(value, path);
        } else walk(value, `${path}.${key}`);
      }
  };
  walk(seed, "$");
  const arIds = new Set();
  for (const row of seed.assessment_results) {
    if (!row.id) continue;
    if (arIds.has(row.id))
      fail("duplicate-result-id", row.id, "assessment_results ids must be unique");
    arIds.add(row.id);
  }
}

// no synthetic CCI identifiers, no malformed control ids, marker present
{
  const authored = JSON.stringify([
    assessment,
    assessmentResults,
    findingRecords,
    riskRecords,
    poamRecords,
  ]);
  for (const match of authored.match(CCI_ANY_RE) ?? [])
    if (!/^CCI-\d{6}$/.test(match))
      fail("synthetic-cci", match, "CCI ids must match /^CCI-\\d{6}$/");
  for (const control of scopeControlIds) {
    if (!CONTROL_ID_RE.test(control)) fail("control-id-format", control, "bad control id shape");
    if (!effectiveControls.has(control))
      fail("control-not-effective", control, "not in effective_control_ids");
    if (control.startsWith("PM-") || control.startsWith("PT-"))
      fail("forbidden-family", control, "PM and PT are absent from the effective set");
  }
}

// assessment
{
  if (!STAMP_RE.test(assessment.planned_start) || !STAMP_RE.test(assessment.planned_end))
    fail("stamp-format", assessment.id, "planned_start/planned_end must carry an offset");
  if (assessment.planned_start.slice(0, 10) < EARLIEST_DATE)
    fail("date-before-floor", assessment.id, assessment.planned_start);
  for (const subsystem of assessment.scope.subsystem_ids)
    if (!seed.subsystems.some((s) => s.id === subsystem))
      fail("broken-reference", assessment.id, `${subsystem} is not a subsystem`);
  for (const component of assessment.scope.component_ids)
    if (!componentName.has(component))
      fail("broken-reference", assessment.id, `${component} is not a component`);
  for (const requirementId of assessment.scope.requirement_ids)
    if (!requirementById.has(requirementId))
      fail("broken-reference", assessment.id, `${requirementId} is not a requirement`);
  if (assessment.scope.system_id !== seed.systems[0].id)
    fail("broken-reference", assessment.id, "system_id does not resolve");
}

// assessment_results
{
  const outcomes = tally(assessmentResults.map((r) => r.outcome));
  const expect = {
    pass: TARGET.pass,
    fail: TARGET.fail,
    inconclusive: TARGET.inconclusive,
    "not-assessed": TARGET.notAssessed,
  };
  if (assessmentResults.length !== TARGET.results)
    fail(
      "result-count",
      ASSESSMENT_ID,
      `${assessmentResults.length} rows, expected ${TARGET.results}`,
    );
  for (const [outcome, want] of Object.entries(expect))
    if ((outcomes[outcome] ?? 0) !== want)
      fail("outcome-distribution", outcome, `${outcomes[outcome] ?? 0} rows, expected ${want}`);

  const windowStart = WINDOW_START;
  const windowEnd = WINDOW_END;
  const notes = new Set();
  for (const row of assessmentResults) {
    const requirement = requirementById.get(row.requirement_id);
    if (!requirement) {
      fail("broken-reference", row.id, `${row.requirement_id} does not resolve`);
      continue;
    }
    if (reqNumber(row.requirement_id) < 121)
      fail("out-of-scope-result", row.id, "the new campaign must not touch REQ-001..REQ-120");
    if (row.method !== requirement.verification_method)
      fail("method-mismatch", row.id, `${row.method} != ${requirement.verification_method}`);
    if (!STAMP_RE.test(row.assessed_on)) fail("stamp-format", row.id, row.assessed_on);
    if (row.assessed_on < windowStart || row.assessed_on > windowEnd)
      fail("assessed-outside-window", row.id, row.assessed_on);
    if (row.assessed_on.slice(0, 10) < EARLIEST_DATE)
      fail("date-before-floor", row.id, row.assessed_on);
    if ((row.outcome === "pass" || row.outcome === "fail") && row.evidence_ids.length === 0)
      fail("pinned-warning", row.id, `${row.outcome} without evidence would move a pinned count`);
    for (const evidenceId of row.evidence_ids) {
      const artifact = evidenceById.get(evidenceId);
      if (!artifact) {
        fail("broken-reference", row.id, `${evidenceId} does not resolve`);
        continue;
      }
      if (!artifact.requirement_ids.includes(row.requirement_id))
        fail(
          "evidence-scope-mismatch",
          row.id,
          `${evidenceId} does not list ${row.requirement_id}`,
        );
      // Cause before effect: the artifact has to exist before the row that leans on it.
      if (Date.parse(artifact.collected_at) >= Date.parse(row.assessed_on))
        fail(
          "evidence-after-result",
          row.id,
          `${evidenceId} was collected ${artifact.collected_at}, not before assessed_on ${row.assessed_on}`,
        );
    }
    if (
      (row.outcome === "pass" || row.outcome === "fail") &&
      (requirement.implementation_status === "planned" ||
        requirement.implementation_status === "not-implemented")
    )
      fail(
        "unevidenced-status",
        row.id,
        `${requirement.implementation_status} cannot pass or fail`,
      );
    if (!row.notes || row.notes.trim().length < 40)
      fail("empty-note", row.id, "notes must be a real observation");
    if (!row.notes.includes(MARKER))
      fail("missing-marker", row.id, "note lacks the synthetic marker");
    if (notes.has(row.notes)) fail("duplicate-note", row.id, "two rows share the same observation");
    notes.add(row.notes);
    const controlsOk = row.control_ids.every((c) => effectiveControls.has(c));
    if (!controlsOk) fail("control-not-effective", row.id, row.control_ids.join(","));
    if (row.component_ids.some((c) => !componentName.has(c)))
      fail("broken-reference", row.id, row.component_ids.join(","));
  }
}

// findings
{
  if (findingRecords.length !== TARGET.findings)
    fail("finding-count", "findings", `${findingRecords.length}, expected ${TARGET.findings}`);
  const severities = tally(findingRecords.map((f) => f.severity));
  for (const [severity, want] of Object.entries(TARGET.severity))
    if ((severities[severity] ?? 0) !== want)
      fail("severity-distribution", severity, `${severities[severity] ?? 0}, expected ${want}`);
  const statuses = tally(findingRecords.map((f) => f.status));
  for (const [status, want] of Object.entries(TARGET.findingStatus))
    if ((statuses[status] ?? 0) !== want)
      fail("finding-status-distribution", status, `${statuses[status] ?? 0}, expected ${want}`);
  const titles = new Set();
  /**
   * Sentence ownership. A finding has to be told apart from every other finding
   * without reading its id, so no sentence may appear in two descriptions. The
   * synthetic-content marker is the one deliberate exception: it is required on every
   * authored narrative in the dataset, so it is excluded before the comparison.
   */
  const sentenceOwner = new Map();
  for (const finding of findingRecords) {
    if (finding.assessment_id !== ASSESSMENT_ID)
      fail("finding-without-assessment", finding.id, "missing assessment");
    if (!finding.risk_id || !riskRecords.some((r) => r.id === finding.risk_id))
      fail("finding-without-risk", finding.id, "risk_id does not resolve");
    if (finding.evidence_ids.length === 0)
      fail("finding-without-evidence", finding.id, "needs the failing artifact");
    for (const evidenceId of finding.evidence_ids)
      if (!evidenceById.has(evidenceId)) fail("broken-reference", finding.id, evidenceId);
    if (titles.has(finding.title)) fail("duplicate-title", finding.id, finding.title);
    titles.add(finding.title);
    if (!finding.description.includes(PROSE_MARKER))
      fail("missing-marker", finding.id, "description");
    const body = finding.description.replace(PROSE_MARKER, "").trim();
    if (body.length < 400)
      fail("finding-description-thin", finding.id, `${body.length} characters of narrative`);
    if (!body.includes(finding.requirement_ids[0]))
      fail("finding-without-requirement-cited", finding.id, finding.requirement_ids[0]);
    if (!finding.component_ids.some((componentId) => body.includes(componentId)))
      fail(
        "finding-without-component-named",
        finding.id,
        `names none of ${finding.component_ids.join(", ")}`,
      );
    if (!finding.evidence_ids.some((evidenceId) => body.includes(evidenceId)))
      fail(
        "finding-without-artifact-named",
        finding.id,
        `names none of ${finding.evidence_ids.join(", ")}`,
      );
    for (const sentence of body.split(". ")) {
      const key = sentence.trim();
      if (key.length < 20) continue;
      if (sentenceOwner.has(key))
        fail(
          "finding-shared-sentence",
          finding.id,
          `shares a sentence with ${sentenceOwner.get(key)}: ${key.slice(0, 60)}`,
        );
      else sentenceOwner.set(key, finding.id);
    }
    if (finding.status === "closed") {
      const requirementId = finding.requirement_ids[0];
      const latest = latestResultByRequirement.get(requirementId);
      if (!latest || latest.outcome !== "pass")
        fail("closure-without-passing-retest", finding.id, "latest result is not a pass");
      const failed = assessmentResults.find(
        (r) => r.requirement_id === requirementId && r.outcome === "fail",
      );
      if (!failed) fail("closure-without-fail", finding.id, "no failing result to close out");
      else if (latest && Date.parse(latest.assessed_on) <= Date.parse(failed.assessed_on))
        fail(
          "retest-not-after-fail",
          finding.id,
          `retest ${latest.assessed_on} does not follow the fail ${failed.assessed_on}`,
        );
    }
  }
  const failRequirementIds = assessmentResults
    .filter((r) => r.outcome === "fail")
    .map((r) => r.requirement_id);
  const findingRequirementIds = findingRecords.map((f) => f.requirement_ids[0]);
  if ([...failRequirementIds].sort().join("|") !== [...findingRequirementIds].sort().join("|"))
    fail("finding-fail-pairing", "findings", "findings must pair one-to-one with fail results");
}

// risks
{
  if (riskRecords.length !== TARGET.risks)
    fail("risk-count", "risks", `${riskRecords.length}, expected ${TARGET.risks}`);
  const covered = new Set();
  for (const risk of riskRecords) {
    if (risk.finding_ids.length < 1 || risk.finding_ids.length > 3)
      fail("risk-cluster-size", risk.id, `${risk.finding_ids.length} findings, expected 1-3`);
    const worst = Math.max(
      ...risk.finding_ids.map((f) => SEVERITY_RANK[findingById.get(f).severity]),
    );
    if (SEVERITY_RANK[risk.overall] < worst)
      fail(
        "risk-overall-too-low",
        risk.id,
        `${risk.overall} under a ${RANK_SEVERITY[worst]} finding`,
      );
    for (const findingId of risk.finding_ids) {
      if (covered.has(findingId)) fail("finding-in-two-risks", findingId, risk.id);
      covered.add(findingId);
    }
    if (!risk.statement.includes(PROSE_MARKER)) fail("missing-marker", risk.id, "statement");
  }
  if (covered.size !== TARGET.findings)
    fail(
      "risk-coverage",
      "risks",
      `${covered.size} findings clustered, expected ${TARGET.findings}`,
    );
}

// poam
{
  if (poamRecords.length !== TARGET.poam)
    fail("poam-count", "poam_items", `${poamRecords.length}, expected ${TARGET.poam}`);
  const statuses = tally(poamRecords.map((p) => p.status));
  for (const [status, want] of Object.entries(TARGET.poamStatus))
    if ((statuses[status] ?? 0) !== want)
      fail("poam-status-distribution", status, `${statuses[status] ?? 0}, expected ${want}`);
  for (const item of poamRecords) {
    if (!OWNER_ROLES.has(item.owner_role)) fail("bad-owner-role", item.id, item.owner_role);
    if (!DATE_RE.test(item.planned_completion))
      fail("date-format", item.id, item.planned_completion);
    if (item.milestones.length < 3 || item.milestones.length > 4)
      fail("milestone-count", item.id, `${item.milestones.length}, expected 3-4`);
    let last = "";
    for (const milestone of item.milestones) {
      if (!milestone.target_date)
        fail("undated-milestone", milestone.id, "every new milestone needs a target_date");
      else {
        if (!DATE_RE.test(milestone.target_date))
          fail("date-format", milestone.id, milestone.target_date);
        if (milestone.target_date < "2026-10-01" || milestone.target_date > "2027-03-31")
          fail("milestone-window", milestone.id, milestone.target_date);
        if (milestone.target_date <= last)
          fail("milestone-order", milestone.id, "targets must advance");
        last = milestone.target_date;
      }
      if (!["planned", "in-progress", "completed"].includes(milestone.status))
        fail("milestone-status-spelling", milestone.id, milestone.status);
    }
    if (item.planned_completion <= last)
      fail("planned-completion-order", item.id, "must fall after the last milestone target_date");
    if (!item.description.includes(PROSE_MARKER)) fail("missing-marker", item.id, "description");
  }
}

// traceability views agree with the live relationships
{
  const expected = {
    control_to_requirements: new Map(),
    component_to_requirements: new Map(),
    requirement_to_evidence: new Map(),
    requirement_to_findings: new Map(),
  };
  const add = (view, key, value) => {
    if (!expected[view].has(key)) expected[view].set(key, new Set());
    expected[view].get(key).add(value);
  };
  for (const requirement of seed.requirements) {
    for (const control of requirement.control_ids)
      add("control_to_requirements", control, requirement.id);
    for (const component of requirement.component_ids)
      add("component_to_requirements", component, requirement.id);
  }
  for (const artifact of seed.evidence)
    for (const requirementId of artifact.requirement_ids)
      add("requirement_to_evidence", requirementId, artifact.id);
  for (const finding of seed.findings)
    for (const requirementId of finding.requirement_ids)
      add("requirement_to_findings", requirementId, finding.id);
  for (const [view, projection] of Object.entries(expected)) {
    const supplied = seed.traceability_views[view];
    const keys = new Set([...projection.keys(), ...Object.keys(supplied)]);
    for (const key of keys) {
      const want = [...(projection.get(key) ?? [])].sort().join("|");
      const got = [...new Set(supplied[key] ?? [])].sort().join("|");
      if (want !== got)
        fail(
          "stale-traceability-view",
          `${view}/${key}`,
          `${got || "(empty)"} != ${want || "(empty)"}`,
        );
    }
  }
}

// nothing authored predates the floor
{
  const authored = JSON.stringify([
    assessment,
    assessmentResults,
    findingRecords,
    riskRecords,
    poamRecords,
  ]);
  for (const match of authored.match(/\d{4}-\d{2}-\d{2}/g) ?? [])
    if (match < EARLIEST_DATE) fail("date-before-floor", match, "nothing may predate 2026-09-08");
}

if (errors.length) {
  console.error(`gen-wsx90-campaign: refusing to write, ${errors.length} error(s)`);
  for (const error of errors.slice(0, 40)) console.error(`  ${error}`);
  if (errors.length > 40) console.error(`  ... and ${errors.length - 40} more`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// write
// ---------------------------------------------------------------------------

const serialized = JSON.stringify(seed, null, 2) + "\n";
const tmp = `${SEED_PATH}.tmp`;
writeFileSync(tmp, serialized, "utf8");
renameSync(tmp, SEED_PATH);

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

const line = (text) => console.log(text);
const pct = (n, d) => `${((n / d) * 100).toFixed(1)}%`;

line(
  "gen-wsx90-campaign: wrote docs/examples/weapons_system_oscal_dummy/platform/platform-seed.json",
);
line("");
line(
  `  file sha256                ${createHash("sha256").update(serialized, "utf8").digest("hex")}`,
);
line(
  `  prior campaign rows removed assessments ${before.assessments - baseline.assessments}, results ${before.results - baseline.results}, findings ${before.findings - baseline.findings}, risks ${before.risks - baseline.risks}, poam ${before.poam - baseline.poam}`,
);
line("");
line("  collection            before   added    after");
line(
  `  assessments           ${String(baseline.assessments).padStart(6)}  ${String(1).padStart(6)}  ${String(seed.assessments.length).padStart(7)}`,
);
line(
  `  assessment_results    ${String(baseline.results).padStart(6)}  ${String(assessmentResults.length).padStart(6)}  ${String(seed.assessment_results.length).padStart(7)}`,
);
line(
  `  findings              ${String(baseline.findings).padStart(6)}  ${String(findingRecords.length).padStart(6)}  ${String(seed.findings.length).padStart(7)}`,
);
line(
  `  risks                 ${String(baseline.risks).padStart(6)}  ${String(riskRecords.length).padStart(6)}  ${String(seed.risks.length).padStart(7)}`,
);
line(
  `  poam_items            ${String(baseline.poam).padStart(6)}  ${String(poamRecords.length).padStart(6)}  ${String(seed.poam_items.length).padStart(7)}`,
);
line("");

const outcomes = tally(assessmentResults.map((r) => r.outcome));
line("  result outcomes");
for (const outcome of ["pass", "fail", "inconclusive", "not-assessed"])
  line(
    `    ${outcome.padEnd(14)} ${String(outcomes[outcome]).padStart(4)}  ${pct(outcomes[outcome], assessmentResults.length)}`,
  );
line(
  `    of which retests    ${String(retestOrder.length).padStart(2)} passing rows dated after the fail they answer`,
);
line(
  `    distinct requirements with a result  ${new Set(assessmentResults.map((r) => r.requirement_id)).size} of ${newRequirements.length} new (${pct(new Set(assessmentResults.map((r) => r.requirement_id)).size, newRequirements.length)})`,
);
line(
  `    requirements left with no result     ${newRequirements.length - new Set(assessmentResults.map((r) => r.requirement_id)).size}`,
);
line("");

line(
  "  result methods           " +
    Object.entries(tally(assessmentResults.map((r) => r.method)))
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(", "),
);
line(
  "  results by requirement status  " +
    Object.entries(
      tally(
        assessmentResults.map((r) => requirementById.get(r.requirement_id).implementation_status),
      ),
    )
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(", "),
);
line(
  `  assessed_on span         ${assessmentResults[0].assessed_on} -> ${assessmentResults[assessmentResults.length - 1].assessed_on}`,
);
line(
  `  rows carrying evidence   ${assessmentResults.filter((r) => r.evidence_ids.length > 0).length} (every pass, fail and inconclusive row)`,
);
line("");

line(
  "  finding severity         " +
    ["critical", "high", "moderate", "low"]
      .map((s) => `${s} ${tally(findingRecords.map((f) => f.severity))[s] ?? 0}`)
      .join(", "),
);
line(
  "  finding status           " +
    Object.entries(tally(findingRecords.map((f) => f.status)))
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(", "),
);
line(
  "  findings by theme        " +
    THEME_ORDER.map(
      (t) => `${t} ${findingRecords.filter((_, i) => findings[i].theme === t).length}`,
    ).join(", "),
);
line("");

line(
  "  risk cluster sizes       " +
    Object.entries(tally(riskRecords.map((r) => String(r.finding_ids.length))))
      .sort()
      .map(([k, v]) => `${v} risks of ${k}`)
      .join(", "),
);
line(
  "  risk overall             " +
    ["critical", "high", "moderate", "low"]
      .map((s) => `${s} ${tally(riskRecords.map((r) => r.overall))[s] ?? 0}`)
      .join(", "),
);
line(
  "  risk status              " +
    Object.entries(tally(riskRecords.map((r) => r.status)))
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(", "),
);
line("");

const allMilestones = poamRecords.flatMap((p) => p.milestones);
line(
  "  poam status              " +
    Object.entries(tally(poamRecords.map((p) => p.status)))
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(", "),
);
line(
  "  poam owner_role          " +
    Object.entries(tally(poamRecords.map((p) => p.owner_role)))
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(", "),
);
line(`  new milestones           ${allMilestones.length} (all dated)`);
line(
  "  milestone status         " +
    Object.entries(tally(allMilestones.map((m) => m.status)))
      .sort()
      .map(([k, v]) => `${k} ${v}`)
      .join(", "),
);
line(
  `  milestone target span    ${allMilestones.map((m) => m.target_date).sort()[0]} -> ${allMilestones.map((m) => m.target_date).sort()[allMilestones.length - 1]}`,
);
line(
  `  planned_completion span  ${poamRecords.map((p) => p.planned_completion).sort()[0]} -> ${poamRecords.map((p) => p.planned_completion).sort()[poamRecords.length - 1]}`,
);
line("");

const originalPoam = seed.poam_items.filter((p) => Number.parseInt(p.id.slice(5), 10) <= 16);
const originalCompleted = originalPoam
  .flatMap((p) => p.milestones)
  .filter((m) => m.status === "completed").length;
line(
  `  O-2 fix                  ${o2Fixed} milestone(s) respelled "complete" -> "completed" on this run; ${originalCompleted} of the original 16 POA&M items' milestones now carry the spelling the UI reads as Completed`,
);
line(
  `  O-2 residue              ${seed.poam_items.flatMap((p) => p.milestones).filter((m) => m.status === "complete").length} milestone(s) still spelled "complete" (must be 0)`,
);
line(
  `  undated milestones total ${seed.poam_items.flatMap((p) => p.milestones).filter((m) => !m.target_date && !m.planned_completion).length} (pinned at 48; all of them are the original rows)`,
);
line("");
line(
  "  traceability_views       control_to_requirements " +
    Object.keys(seed.traceability_views.control_to_requirements).length +
    " keys, component_to_requirements " +
    Object.keys(seed.traceability_views.component_to_requirements).length +
    " keys, requirement_to_evidence " +
    Object.keys(seed.traceability_views.requirement_to_evidence).length +
    " keys, requirement_to_findings " +
    Object.keys(seed.traceability_views.requirement_to_findings).length +
    " keys",
);
line(
  "  key policy               first two maps key only what exists; last two carry a key for EVERY requirement, empty array included (open item O-5).",
);
