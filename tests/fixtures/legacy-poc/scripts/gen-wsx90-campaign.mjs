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
 *   - 300 assessment_results  AR-002-0001..0300  (every row carries id + assessment_id;
 *                                                 the notes are hand-authored, one entry per
 *                                                 requirement and outcome, in
 *                                                 scripts/wsx90-result-notes.json)
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
 *   - Only the four owner roles, in a field or in prose.
 *   - Cause before effect, in both directions the data can run backwards:
 *       * no result cites evidence collected on or after its own assessed_on;
 *       * no milestone reports work finished that the reporting date (2026-11-20)
 *         has not reached - a completed milestone carries a completed_at at or
 *         before it, and a milestone targeted after it is planned or in-progress.
 *         Milestone status is derived from the schedule, never asserted beside it.
 *   - The POA&M horizon 2026-10-01 -> 2027-03-31 holds for milestone target_dates
 *     AND for planned_completion, close-out review included.
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

/**
 * The risks and the POA&M items are authored the same way and for the same reason.
 * A risk statement has to say what could happen to WS-X90 if the findings clustered
 * under it are left standing, which is a judgement about this platform and its
 * H-H-M categorization rather than a restatement of the findings, and a milestone
 * title has to name the remediation step - a fix, a rebuild, a config change on a
 * named LRU. Neither can be derived from the record shape without collapsing into a
 * handful of repeated strings, so scripts/wsx90-risks.json carries one hand-written
 * entry per risk: the statement, the POA&M title, description and one title per
 * milestone, plus finding_ids and overall as binding assertions the generator checks
 * against the cluster it built.
 */
const RISKS_PATH = path.join(HERE, "wsx90-risks.json");

/**
 * The assessment result notes are authored the same way, and for the sharpest version
 * of the same reason. A note is the assessor's observation for one requirement on the
 * LRUs allocated to it: what was examined, interviewed or tested, and what was seen.
 * That is a judgement about this requirement, its implementation gap and the artifact
 * cited, and no rule can produce 300 of them from the record shape without collapsing
 * into a sentence bank. scripts/wsx90-result-notes.json carries one hand-written entry
 * per (requirement, outcome) pair, plus the verification method as a binding assertion
 * the generator checks, so a note and the row it lands on cannot drift apart.
 */
const NOTES_PATH = path.join(HERE, "wsx90-result-notes.json");

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
/** Maximum 4-gram Jaccard permitted between any two authored result notes. */
const NOTE_SIMILARITY_CEILING = 0.2;
let noteSimilarityObserved = 0;
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
  // The 48 undated milestones of the first campaign are a pinned warning count, so
  // the second campaign's contribution is pinned too: 81 dated rows, 129 in total.
  milestones: 81,
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
// themes - the functional grouping that drives fail selection, how findings cluster
// into risks and POA&M ownership. A theme carries no prose at all: every sentence that
// reaches a finding, a risk, a POA&M item or an assessment result note is authored per
// record in wsx90-findings.json, wsx90-risks.json and wsx90-result-notes.json.
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
    owner: "Product Security Engineer",
  },
  boundary: {
    owner: "Product Security Engineer",
  },
  audit: {
    owner: "System Security Engineer",
  },
  access: {
    owner: "System Security Engineer",
  },
  ident: {
    owner: "System Security Engineer",
  },
  integrity: {
    owner: "Firmware Lead",
  },
  config: {
    owner: "Firmware Lead",
  },
  maint: {
    owner: "Platform Lead",
  },
  contingency: {
    owner: "Platform Lead",
  },
  supply: {
    owner: "Product Security Engineer",
  },
  assessrisk: {
    owner: "System Security Engineer",
  },
  incident: {
    owner: "System Security Engineer",
  },
  physical: {
    owner: "Platform Lead",
  },
  people: {
    owner: "Platform Lead",
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
// load
// ---------------------------------------------------------------------------

const seed = JSON.parse(readFileSync(SEED_PATH, "utf8"));
const authoredFindings = JSON.parse(readFileSync(FINDINGS_PATH, "utf8"));
const authoredRisks = JSON.parse(readFileSync(RISKS_PATH, "utf8"));
const authoredNotes = JSON.parse(readFileSync(NOTES_PATH, "utf8"));

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

/**
 * The pools below draw on the state the assessor MET, which is not always the state
 * the corpus records today. Where a finding was remediated inside the assessment
 * window and retested to a pass, the implementation record and its requirements now
 * read "implemented" - that is the point of closing a finding - but the assessor
 * walked in on a partial implementation and that is what produced the fail. Reading
 * `implementation_status` here instead would move those requirements out of the fail
 * pool, shift every stride selection after them, and re-pair the authored finding
 * text with a different requirement (the `finding-binding-drift` abort below).
 *
 * So: one entry per requirement whose current status is the post-remediation claim,
 * carrying the status that was true when ASM-2026-002 assessed it.
 */
const ASSESSED_STATUS = new Map([
  ["REQ-229", "partially-implemented"], // FND-021 SC-18, closed 2026-11-10
  ["REQ-349", "partially-implemented"], // FND-024 AU-6(3), closed 2026-11-11
  ["REQ-363", "partially-implemented"], // sibling of REQ-364 on AU-12(1)
  ["REQ-364", "partially-implemented"], // FND-026 AU-12(1), closed 2026-11-12
  ["REQ-379", "partially-implemented"], // FND-041 MA-3(5), closed 2026-11-18
  ["REQ-583", "partially-implemented"], // FND-039 CM-7(9), closed 2026-11-15
]);
const assessedStatus = (r) => ASSESSED_STATUS.get(r.id) ?? r.implementation_status;
/** A pin that no longer overrides anything is a pin nobody maintained. */
for (const [id, assessed] of ASSESSED_STATUS) {
  const requirement = newRequirements.find((r) => r.id === id);
  if (!requirement) fail("assessed-status-orphan", id, "no such requirement in the expanded scope");
  else if (requirement.implementation_status === assessed)
    fail(
      "assessed-status-redundant",
      id,
      `still reads "${assessed}" upstream, so the pin overrides nothing`,
    );
}

const implementedWithEvidence = newRequirements.filter(
  (r) => assessedStatus(r) === "implemented" && hasEvidence(r),
);
const partialWithEvidence = newRequirements.filter(
  (r) => assessedStatus(r) === "partially-implemented" && hasEvidence(r),
);
const unevidenced = newRequirements.filter(
  (r) => assessedStatus(r) === "planned" || assessedStatus(r) === "not-implemented",
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

/** A stable small integer per record, used for the review lag and the hour slot. */
const spread = (key, modulo) => {
  const digest = createHash("sha1").update(key, "utf8").digest();
  return ((digest[0] << 8) | digest[1]) % modulo;
};

/**
 * The authored observation for one result row. Nothing is composed here: the note is
 * looked up by (requirement, outcome), the pairing is checked against the requirement
 * the record actually carries, and the synthetic marker is appended so every note ends
 * the same way whatever the authored text says. A row with no authored entry, or one
 * whose authored method has drifted from the requirement, aborts the run rather than
 * shipping an observation that describes work the assessor did not do.
 */
const noteKey = (requirementId, outcome) => `${requirementId}|${outcome}`;
const usedNoteKeys = new Set();
const composeNote = (requirement, outcome) => {
  const key = noteKey(requirement.id, outcome);
  const authored = authoredNotes[key];
  if (!authored) {
    fail("note-not-authored", key, "no entry in scripts/wsx90-result-notes.json");
    return `Observation pending for ${requirement.id}. ${MARKER}`;
  }
  if (usedNoteKeys.has(key))
    fail("note-key-reused", key, "two result rows would take the same authored observation");
  usedNoteKeys.add(key);
  if (authored.method !== requirement.verification_method)
    fail(
      "note-method-drift",
      key,
      `authored for ${authored.method}, ${requirement.id} is verified by ${requirement.verification_method}`,
    );
  const text = String(authored.note ?? "").trim();
  if (text.includes(MARKER))
    fail("note-carries-marker", key, "the marker is appended here, not authored into the note");
  return `${text} ${MARKER}`;
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
    notes: composeNote(requirement, outcome),
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

/**
 * The risk record. Title and statement come from the authored entry; the ids, the
 * roll-up and the dates are assembled here. The authored entry restates the cluster
 * it was written for and the severity it was written against, so a shift in the fail
 * pool or a re-cut finding severity aborts the run instead of leaving a statement
 * describing a risk the record no longer carries.
 */
const riskRecords = riskClusters.map((cluster) => {
  const authored = authoredRisks[cluster.id];
  const worst = cluster.members.reduce((rank, m) => Math.max(rank, SEVERITY_RANK[m.severity]), 0);
  const overall = RANK_SEVERITY[worst];
  const allClosed = cluster.members.every((m) => closedFindingIds.has(m.id));
  const findingIds = cluster.members.map((m) => m.id);
  if (!authored) fail("risk-not-authored", cluster.id, "no entry in scripts/wsx90-risks.json");
  else {
    if (authored.finding_ids.join("|") !== findingIds.join("|"))
      fail(
        "risk-binding-drift",
        cluster.id,
        `authored for ${authored.finding_ids.join(", ")}, generator clustered ${findingIds.join(", ")}`,
      );
    if (authored.overall !== overall)
      fail(
        "risk-overall-drift",
        cluster.id,
        `authored ${authored.overall}, findings roll up to ${overall}`,
      );
  }
  return {
    id: cluster.id,
    uuid: mintUuid(cluster.id),
    title: authored?.title ?? cluster.id,
    statement: `${authored?.statement ?? ""} ${PROSE_MARKER}`,
    likelihood: allClosed ? "low" : LIKELIHOOD[overall],
    impact: IMPACT[overall],
    overall,
    finding_ids: findingIds,
    status: allClosed ? "mitigated" : "open",
  };
});
for (const id of Object.keys(authoredRisks))
  if (id.startsWith("RSK-") && !riskClusters.some((cluster) => cluster.id === id))
    fail("risk-authored-orphan", id, "authored but no cluster carries this id");

// ---------------------------------------------------------------------------
// poam_items
// ---------------------------------------------------------------------------

/**
 * The day the dataset reports as of. Nothing in the POA&M layer may claim work
 * finished after it: a milestone whose target_date falls beyond this date has not
 * happened yet, whatever the remediation plan intended, so it can only be planned
 * or in-progress. Milestone status is therefore DERIVED from the schedule below
 * rather than stamped from a fixed pattern, and the validation block refuses to
 * write if any milestone ends up asserting a completion the timeline has not
 * reached. (An earlier revision used three fixed status patterns and suppressed
 * completed_at when the target ran past the window; that left 14 milestones
 * reading "completed" with a December-or-later target and no completion date.)
 */
const REPORT_DAY = WINDOW_END.slice(0, 10); // 2026-11-20

/** The brief fixes the POA&M horizon at 2026-10 -> 2027-03; nothing may escape it. */
const POAM_WINDOW_START = "2026-10-01";
const POAM_WINDOW_END = "2027-03-31";
/** The close-out review that sets planned_completion sits three weeks after the last step. */
const CLOSEOUT_DAYS = 21;

/** 0-based position of a closed-out cluster among the closed-out clusters. */
const closedClusterIndexes = riskClusters
  .map((cluster, index) => ({ cluster, index }))
  .filter(({ cluster }) => cluster.members.every((m) => closedFindingIds.has(m.id)))
  .map(({ index }) => index);
const closedPoamRank = (index) => closedClusterIndexes.indexOf(index);

const poamRecords = riskClusters.map((cluster, index) => {
  const risk = riskRecords[index];
  const authored = authoredRisks[cluster.id]?.poam;
  const meta = THEMES[cluster.theme];
  const id = `POAM-${String(17 + index).padStart(3, "0")}`;
  const allClosed = cluster.members.every((m) => closedFindingIds.has(m.id));
  const controls = [...new Set(cluster.members.flatMap((m) => m.requirement.control_ids))].sort();
  const components = [
    ...new Set(cluster.members.flatMap((m) => m.requirement.component_ids)),
  ].sort();
  const requirementIds = cluster.members.map((m) => m.requirement.id);

  // The step count is the length of the authored milestone list: the remediation
  // for one risk is as long as it is, and the schedule below stretches to fit it.
  const milestoneCount = authored?.milestones.length ?? 0;
  if (!authored) fail("poam-not-authored", id, `no poam block on ${cluster.id}`);
  const day = 5 + (index % 20);
  const closedRank = allClosed ? closedPoamRank(index) : 0;

  // ---- the schedule ------------------------------------------------------
  // A closed-out item did its work inside the assessment window, so its milestones
  // run on a three-week cadence from early October and every one of them lands on
  // or before the reporting date. An open item runs monthly from an October /
  // November / December start. The whole ladder plus its three-week close-out has
  // to fit 2026-10-01 -> 2027-03-31, so an item whose monthly cadence would push
  // planned_completion past the horizon starts a month earlier instead of spilling
  // out of the window (this is what used to send POAM-025 to 2027-04-03).
  const ladder = (offset) =>
    Array.from({ length: milestoneCount }, (_, step) => {
      if (allClosed)
        return fromDay(toDay(`2026-10-${String(3 + closedRank * 2).padStart(2, "0")}`) + step * 21);
      const [year, month] = addMonths(2026, 10, offset + step);
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    });
  let startOffset = index % 3;
  let targets = ladder(startOffset);
  while (
    !allClosed &&
    startOffset > 0 &&
    fromDay(toDay(targets[targets.length - 1]) + CLOSEOUT_DAYS) > POAM_WINDOW_END
  ) {
    startOffset -= 1;
    targets = ladder(startOffset);
  }
  const lastTarget = targets[targets.length - 1] ?? "";

  // ---- the statuses, derived from that schedule --------------------------
  // How many steps the reporting date has already passed. Nothing beyond that
  // count can be complete, so `completed` can never outrun the timeline.
  const pastDue = targets.filter((target) => target <= REPORT_DAY).length;
  // Half the open items are behind their own ladder: the most recent past-due step
  // is still open on those, one fewer step is done. The other half are on pace.
  const slipped = index % 2 === 1;
  // An item with nothing yet past due may still have visibly begun its first step.
  const started = index % 4 < 2;
  const completedSteps = allClosed ? milestoneCount : slipped ? Math.max(0, pastDue - 1) : pastDue;
  // The cursor is the first step not yet finished. An overdue cursor is always
  // under way; a cursor whose target is still ahead is under way only once begun.
  const cursorUnderway = completedSteps < pastDue || started;

  const milestones = targets.map((target, step) => {
    const milestone = {
      id: `${id}-M${step + 1}`,
      title: authored?.milestones[step] ?? `${id} step ${step + 1}`,
      status:
        step < completedSteps
          ? "completed"
          : step === completedSteps && cursorUnderway
            ? "in-progress"
            : "planned",
      target_date: target,
    };
    // A completed milestone says when it completed, and it completed on its target
    // day - which the derivation above guarantees is on or before the report date.
    if (milestone.status === "completed") milestone.completed_at = `${target}T17:00:00Z`;
    return milestone;
  });
  if (!allClosed && completedSteps >= milestoneCount)
    fail("open-poam-fully-completed", id, "an open item cannot have every milestone completed");

  return {
    id,
    uuid: mintUuid(id),
    title: authored?.title ?? id,
    description: `${authored?.description ?? ""} ${PROSE_MARKER}`,
    risk_ids: [risk.id],
    finding_ids: cluster.members.map((m) => m.id),
    control_ids: controls,
    requirement_ids: requirementIds,
    component_ids: components,
    owner_role: meta.owner,
    status: allClosed ? "completed" : "open",
    planned_completion: fromDay(toDay(lastTarget) + CLOSEOUT_DAYS),
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

  /**
   * Every authored note has to be spent, or the table and the campaign have drifted.
   */
  for (const key of Object.keys(authoredNotes))
    if (key !== "_comment" && !usedNoteKeys.has(key))
      fail("note-authored-orphan", key, "authored but no result row takes this observation");

  /**
   * The notes are the largest authored collection in the assurance layer, and the
   * failure mode a template produces is not duplication but similarity. Two guards run
   * over the finished set: no sentence may appear in two notes, and no pair of notes may
   * share more than NOTE_SIMILARITY_CEILING of their 4-gram vocabulary. The observed
   * maximum over the authored table is about 0.07; the ceiling sits well under the 0.315
   * the requirement descriptions clear, so a mail-merged replacement fails the run rather
   * than shipping.
   */
  const sentenceOwner = new Map();
  for (const row of assessmentResults)
    for (const sentence of String(row.notes ?? "")
      .split(/(?<=\.)\s+/)
      .map((s2) => s2.trim())
      .filter((s2) => s2 && s2 !== MARKER)) {
      const held = sentenceOwner.get(sentence);
      if (held) fail("shared-note-sentence", row.id, `${held} uses the same sentence`);
      else sentenceOwner.set(sentence, row.id);
    }

  const shingles = assessmentResults.map((row) => {
    const words = String(row.notes ?? "")
      .replace(MARKER, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    const set = new Set();
    for (let i = 0; i + 4 <= words.length; i += 1) set.add(words.slice(i, i + 4).join(" "));
    return { id: row.id, set };
  });
  let worstPair = 0;
  for (let i = 0; i < shingles.length; i += 1)
    for (let j = i + 1; j < shingles.length; j += 1) {
      const a = shingles[i].set;
      const b = shingles[j].set;
      if (a.size === 0 || b.size === 0) continue;
      let shared = 0;
      for (const gram of a) if (b.has(gram)) shared += 1;
      const score = shared / (a.size + b.size - shared);
      if (score > worstPair) worstPair = score;
      if (score > NOTE_SIMILARITY_CEILING)
        fail(
          "note-similarity",
          `${shingles[i].id}/${shingles[j].id}`,
          `4-gram Jaccard ${score.toFixed(3)} exceeds ${NOTE_SIMILARITY_CEILING}`,
        );
    }
  noteSimilarityObserved = worstPair;
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
  const titles = new Set();
  /** Same sentence-ownership rule the findings carry, applied across the statements. */
  const sentenceOwner = new Map();
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

    if (titles.has(risk.title)) fail("duplicate-title", risk.id, risk.title);
    titles.add(risk.title);
    const body = risk.statement.replace(PROSE_MARKER, "").trim();
    if (body.length < 400)
      fail("risk-statement-thin", risk.id, `${body.length} characters of narrative`);
    const members = risk.finding_ids.map((f) => findingById.get(f));
    const memberComponents = [...new Set(members.flatMap((m) => m.requirement.component_ids))];
    const memberControls = [...new Set(members.flatMap((m) => m.requirement.control_ids))];
    if (!memberComponents.some((componentId) => body.includes(componentId)))
      fail("risk-without-component-named", risk.id, `names none of ${memberComponents.join(", ")}`);
    if (!memberControls.some((controlId) => body.includes(controlId)))
      fail("risk-without-control-cited", risk.id, `cites none of ${memberControls.join(", ")}`);
    /**
     * The template this replaced swapped the noun in a "{n} findings" slot and left
     * the verb behind, so sixteen statements read "One assessment finding ... show".
     * There is no slot any more, and this guard keeps it that way.
     */
    if (/\bfinding\b[^.]{0,80}\b(show|are|were|describe)\b/.test(body))
      fail("risk-number-disagreement", risk.id, "singular finding with a plural verb");
    if (/\bfindings\b[^.]{0,80}\b(shows|is|was|describes)\b/.test(body))
      fail("risk-number-disagreement", risk.id, "plural findings with a singular verb");
    for (const sentence of body.split(". ")) {
      const key = sentence.trim();
      if (key.length < 20) continue;
      if (sentenceOwner.has(key))
        fail(
          "risk-shared-sentence",
          risk.id,
          `shares a sentence with ${sentenceOwner.get(key)}: ${key.slice(0, 60)}`,
        );
      else sentenceOwner.set(key, risk.id);
    }
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
  const totalMilestones = poamRecords.reduce((n, p) => n + p.milestones.length, 0);
  if (totalMilestones !== TARGET.milestones)
    fail(
      "poam-milestone-total",
      "poam_items",
      `${totalMilestones} new milestones, pinned at ${TARGET.milestones}`,
    );
  const titles = new Set();
  /**
   * Milestone titles are the surface the old template collapsed hardest: 48 of the 81
   * rows carried one of two strings. A milestone has to name the step it stands for,
   * so no title may be reused anywhere in the campaign and none may be a stub.
   */
  const milestoneTitles = new Map();
  const sentenceOwner = new Map();
  for (const item of poamRecords) {
    if (titles.has(item.title)) fail("duplicate-title", item.id, item.title);
    titles.add(item.title);
    const body = item.description.replace(PROSE_MARKER, "").trim();
    if (body.length < 200)
      fail("poam-description-thin", item.id, `${body.length} characters of narrative`);
    for (const sentence of body.split(". ")) {
      const key = sentence.trim();
      if (key.length < 20) continue;
      if (sentenceOwner.has(key))
        fail(
          "poam-shared-sentence",
          item.id,
          `shares a sentence with ${sentenceOwner.get(key)}: ${key.slice(0, 60)}`,
        );
      else sentenceOwner.set(key, item.id);
    }
    for (const milestone of item.milestones) {
      const title = milestone.title.trim();
      if (title.length < 30)
        fail("milestone-title-thin", milestone.id, `${title.length} characters`);
      if (milestoneTitles.has(title))
        fail("duplicate-milestone-title", milestone.id, `also on ${milestoneTitles.get(title)}`);
      else milestoneTitles.set(title, milestone.id);
    }
  }
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
        if (milestone.target_date < POAM_WINDOW_START || milestone.target_date > POAM_WINDOW_END)
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
    if (item.planned_completion < POAM_WINDOW_START || item.planned_completion > POAM_WINDOW_END)
      fail(
        "planned-completion-window",
        item.id,
        `${item.planned_completion} escapes ${POAM_WINDOW_START}..${POAM_WINDOW_END}`,
      );
    if (item.status === "completed" && item.milestones.some((m) => m.status !== "completed"))
      fail("completed-poam-open-milestone", item.id, "a completed item cannot carry an open step");
    if (item.status === "open" && item.milestones.every((m) => m.status === "completed"))
      fail("open-poam-fully-completed", item.id, "every step is done but the item is still open");
    if (!item.description.includes(PROSE_MARKER)) fail("missing-marker", item.id, "description");
  }
}

/**
 * Cause before effect in the POA&M layer: nothing may report work finished that the
 * dataset's own reporting date has not reached. This runs over EVERY item in the
 * file, the 16 original ones included, so a hand edit upstream cannot reintroduce
 * the defect either. The original milestones carry no dates at all - they are the
 * 48 pinned `undated-milestone` warnings - so the target_date rules pass over them
 * vacuously and only the completed_at rules can bite.
 */
{
  for (const item of seed.poam_items)
    for (const milestone of item.milestones ?? []) {
      if (milestone.status === "completed") {
        if (milestone.target_date && milestone.target_date > REPORT_DAY)
          fail(
            "completion-beyond-report-date",
            milestone.id,
            `target_date ${milestone.target_date} is after the report date ${REPORT_DAY}, so it cannot be completed`,
          );
        // The 48 original rows are undated by design and keep their status as-is;
        // anything that carries a target_date has to say when it finished.
        if (milestone.target_date && !milestone.completed_at)
          fail(
            "completed-without-completed-at",
            milestone.id,
            "a dated milestone that reports completion must carry completed_at",
          );
      } else if (milestone.completed_at) {
        fail(
          "completed-at-without-completion",
          milestone.id,
          `status ${milestone.status} but completed_at ${milestone.completed_at}`,
        );
      }
      if (milestone.completed_at) {
        if (!STAMP_RE.test(milestone.completed_at))
          fail("date-format", milestone.id, milestone.completed_at);
        if (milestone.completed_at > WINDOW_END)
          fail(
            "completion-beyond-report-date",
            milestone.id,
            `completed_at ${milestone.completed_at} is after the report date ${WINDOW_END}`,
          );
        if (milestone.completed_at < EARLIEST_DATE)
          fail("date-floor", milestone.id, milestone.completed_at);
      }
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
line(
  `  result notes             ${assessmentResults.length} authored, max pairwise 4-gram Jaccard ` +
    `${noteSimilarityObserved.toFixed(3)} (ceiling ${NOTE_SIMILARITY_CEILING})`,
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
