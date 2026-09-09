#!/usr/bin/env node
/**
 * assemble-wsx90-content.mjs
 *
 * Deterministic, re-runnable assembly of the 12 authored WS-X90 content fragments
 * (B1..B12) into the UPSTREAM corpus seed:
 *
 *   docs/examples/weapons_system_oscal_dummy/platform/platform-seed.json
 *
 * It validates every fragment BEFORE merging and refuses to write on any violation,
 * naming the offending record. It mints uuid5 values with the recipe in section 2.1
 * of docs/wsx90-content-gap-brief.md, renumbers the local EVD-<batch>-NNN evidence ids
 * into a final contiguous block, and appends to requirements / control_implementations /
 * evidence only. assessments, assessment_results, findings, risks, poam_items and
 * traceability_views are left byte-identical - the Campaign step owns those.
 *
 * Node built-ins only. Usage:
 *   node scripts/assemble-wsx90-content.mjs [--dry-run] [--evidence-start=auto|091|120]
 *
 * Re-running is idempotent: rows previously written by this script (matched by id) are
 * removed from the target collections before the merged set is appended, so the pristine
 * upstream rows are always preserved untouched and in order.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");

const UPSTREAM = path.join(
  REPO,
  "docs/examples/weapons_system_oscal_dummy/platform/platform-seed.json",
);
const GENERATED = path.join(REPO, "src/data/wsx90-platform-seed.json");
const FRAGMENT_DIR =
  process.env.WSX90_FRAGMENT_DIR ??
  "/private/tmp/claude-501/-Users-joseflagorio-Downloads-program-assurance/87519d8d-95c7-488a-805b-e2641feba435/scratchpad/authoring";

const BATCHES = Array.from({ length: 12 }, (_, i) => `B${i + 1}`);

/** Requirement id ranges allocated per batch (§1.3 + the authoring plan). */
const REQ_RANGES = {
  B1: [121, 192],
  B2: [193, 250],
  B3: [251, 297],
  B4: [298, 343],
  B5: [344, 389],
  B6: [390, 435],
  B7: [436, 480],
  B8: [481, 519],
  B9: [520, 558],
  B10: [559, 596],
  B11: [597, 630],
  B12: [631, 640],
};

/** Per-batch implementation-status targets from the authoring plan. */
const STATUS_TARGETS = {
  B1: { implemented: 7, "partially-implemented": 19, planned: 30, "not-implemented": 9 },
  B2: { implemented: 18, "partially-implemented": 24, planned: 9, "not-implemented": 2 },
  B3: { implemented: 15, "partially-implemented": 18, planned: 8, "not-implemented": 2 },
  B4: { implemented: 8, "partially-implemented": 15, planned: 15, "not-implemented": 4 },
  B5: { implemented: 12, "partially-implemented": 17, planned: 10, "not-implemented": 3 },
  B6: { implemented: 7, "partially-implemented": 14, planned: 16, "not-implemented": 5 },
  B7: { implemented: 14, "partially-implemented": 18, planned: 7, "not-implemented": 2 },
  B8: { implemented: 8, "partially-implemented": 13, planned: 11, "not-implemented": 3 },
  B9: { implemented: 4, "partially-implemented": 10, planned: 16, "not-implemented": 5 },
  B10: { implemented: 12, "partially-implemented": 15, planned: 6, "not-implemented": 1 },
  B11: { implemented: 11, "partially-implemented": 14, planned: 5, "not-implemented": 1 },
  B12: { implemented: 2, "partially-implemented": 3, planned: 3, "not-implemented": 1 },
};

const GLOBAL_STATUS_TARGET = {
  implemented: 118,
  "partially-implemented": 180,
  planned: 136,
  "not-implemented": 38,
};

const OWNER_ROLES = new Set([
  "System Security Engineer",
  "Product Security Engineer",
  "Firmware Lead",
  "Platform Lead",
]);

const EVIDENCE_TYPES = new Set([
  "configuration-export",
  "test-report",
  "audit-log-sample",
  "procedure",
  "scan-result",
  "attestation",
  "design-record",
]);

const ID_COLLECTIONS = [
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
];

const EARLIEST_DATE = "2026-09-08";
const STAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const CONTROL_ID_RE = /^[A-Z]{2}-\d{1,2}(?:\(\d{1,2}\))?$/;
const CCI_ANY_RE = /CCI-[A-Za-z0-9][A-Za-z0-9-]*/g;

// ---------------------------------------------------------------------------
// uuid5 - the exact recipe from section 2.1 of the brief
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
const mintUuid = (id) => uuid5(`wsx90.aurora.example/${id}`);
const evidenceSha = (id) =>
  createHash("sha256").update(`wsx90-evidence:${id}`, "utf8").digest("hex");

// ---------------------------------------------------------------------------
// error accumulation - nothing is written while errors stands non-empty
// ---------------------------------------------------------------------------

const errors = [];
const warnings = [];
const fail = (code, record, detail) => errors.push(`[${code}] ${record}: ${detail}`);
const warn = (code, detail) => warnings.push(`[${code}] ${detail}`);

const die = (msg) => {
  console.error(`\nFATAL: ${msg}`);
  process.exit(1);
};

// ---------------------------------------------------------------------------
// load
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const evStartArg =
  (argv.find((a) => a.startsWith("--evidence-start=")) ?? "").split("=")[1] ?? "auto";

if (!existsSync(UPSTREAM)) die(`upstream seed not found at ${UPSTREAM}`);
if (!existsSync(GENERATED)) die(`generated seed not found at ${GENERATED}`);

const upstream = JSON.parse(readFileSync(UPSTREAM, "utf8"));
const generated = JSON.parse(readFileSync(GENERATED, "utf8"));

const profile = generated.profiles?.[0];
if (!profile) die("generated seed has no profiles[0]");
const EFFECTIVE = new Set(profile.effective_control_ids ?? []);
const DERIVATIONS = profile.control_derivations ?? {};
if (EFFECTIVE.size !== 546)
  warn("effective-set-size", `expected 546 effective controls, found ${EFFECTIVE.size}`);

const UNAUTHORED = Object.entries(DERIVATIONS)
  .filter(([, r]) => r.authoring_status === "unauthored")
  .map(([id]) => id);
const UNAUTHORED_SET = new Set(UNAUTHORED);

const COMPONENTS = new Map(upstream.components.map((c) => [c.id, c]));
const SUBSYSTEMS = new Set(upstream.subsystems.map((s) => s.id));

const fragments = new Map();
for (const b of BATCHES) {
  const p = path.join(FRAGMENT_DIR, `${b}.json`);
  if (!existsSync(p)) die(`fragment ${b} not found at ${p}`);
  const f = JSON.parse(readFileSync(p, "utf8"));
  for (const key of ["requirements", "control_implementations", "evidence"]) {
    if (!Array.isArray(f[key])) die(`fragment ${b} is missing array "${key}"`);
  }
  fragments.set(b, f);
}

// ---------------------------------------------------------------------------
// idempotence: strip any rows a previous run of this script already appended,
// then treat what remains as the pristine baseline.
// ---------------------------------------------------------------------------

const newRequirementIds = new Set();
const newImplementationIds = new Set();
for (const b of BATCHES) {
  for (const r of fragments.get(b).requirements) newRequirementIds.add(r.id);
  for (const i of fragments.get(b).control_implementations) newImplementationIds.add(i.id);
}

const priorRunEvidenceIds = new Set(
  upstream.evidence
    .filter(
      (e) => typeof e.uuid === "string" && e.uuid === mintUuid(e.id) && /^EVD-\d{3}$/.test(e.id),
    )
    .map((e) => e.id),
);

const baseline = {
  requirements: upstream.requirements.filter((r) => !newRequirementIds.has(r.id)),
  control_implementations: upstream.control_implementations.filter(
    (i) => !newImplementationIds.has(i.id),
  ),
  // Evidence rows this script wrote are identified by the deterministic uuid5 of
  // their own id; pristine upstream rows do not satisfy that.
  evidence: upstream.evidence.filter((e) => !priorRunEvidenceIds.has(e.id)),
};

const rerun =
  baseline.requirements.length !== upstream.requirements.length ||
  baseline.control_implementations.length !== upstream.control_implementations.length ||
  baseline.evidence.length !== upstream.evidence.length;

if (baseline.requirements.length !== 120)
  warn(
    "baseline-shape",
    `expected 120 pristine requirements, found ${baseline.requirements.length}`,
  );
if (baseline.control_implementations.length !== 74)
  warn(
    "baseline-shape",
    `expected 74 pristine control_implementations, found ${baseline.control_implementations.length}`,
  );
if (baseline.evidence.length !== 90)
  warn("baseline-shape", `expected 90 pristine evidence rows, found ${baseline.evidence.length}`);

/** Every id already present in the file, across all id-bearing collections. */
const existingIds = new Set();
for (const coll of ID_COLLECTIONS) {
  const rows = coll in baseline ? baseline[coll] : upstream[coll];
  for (const r of rows ?? []) if (r?.id) existingIds.add(r.id);
}

/** Every uuid already present anywhere in the file, at any depth. */
const existingUuids = new Set();
(function collect(node) {
  if (Array.isArray(node)) {
    for (const v of node) collect(v);
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "uuid" && typeof v === "string") existingUuids.add(v);
      else collect(v);
    }
  }
})({
  ...upstream,
  requirements: baseline.requirements,
  control_implementations: baseline.control_implementations,
  evidence: baseline.evidence,
});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const isText = (v) => typeof v === "string" && v.length > 0;
const isTextArray = (v) => Array.isArray(v) && v.every(isText);
const uniqSorted = (a) => [...new Set(a)].sort();
const implIdFor = (controlId) => `IMPL-${controlId.replace(/[-()]/g, "_").replace(/_+$/, "")}`;

// ---------------------------------------------------------------------------
// VALIDATION PASS 1 - per fragment, structural + referential
// ---------------------------------------------------------------------------

const seenIds = new Set(); // new ids minted across all fragments
const requirementIndex = new Map(); // id -> { batch, record }
const implByControl = new Map(); // control id -> { batch, record }
const rawEvidence = []; // { batch, index, record }

const claimId = (id, batch, kind) => {
  if (!isText(id)) {
    fail("empty-id", `${batch}/${kind}`, "record has an empty or missing id");
    return false;
  }
  if (existingIds.has(id)) {
    fail("id-collision-with-file", id, `${batch}: id already exists in the upstream seed`);
    return false;
  }
  if (seenIds.has(id)) {
    fail("duplicate-id-across-fragments", id, `${batch}: id used by more than one fragment record`);
    return false;
  }
  seenIds.add(id);
  return true;
};

for (const batch of BATCHES) {
  const frag = fragments.get(batch);
  const [lo, hi] = REQ_RANGES[batch];

  // --- requirements ---
  const reqNums = [];
  for (const r of frag.requirements) {
    const rid = r.id;
    claimId(rid, batch, "requirement");
    if (requirementIndex.has(rid))
      fail("duplicate-requirement", rid, `${batch}: duplicate requirement id`);
    requirementIndex.set(rid, { batch, record: r });

    if ("uuid" in r)
      fail("fragment-carries-uuid", rid, `${batch}: fragments must not carry a uuid field`);

    const m = /^REQ-(\d{3})$/.exec(rid ?? "");
    if (!m) {
      fail("requirement-id-format", String(rid), `${batch}: expected REQ-NNN`);
    } else {
      const n = Number(m[1]);
      reqNums.push(n);
      if (n < lo || n > hi)
        fail(
          "requirement-out-of-range",
          rid,
          `${batch}: outside allocated range REQ-${lo}..REQ-${hi}`,
        );
    }

    for (const f of [
      "title",
      "description",
      "source",
      "priority",
      "verification_method",
      "implementation_status",
      "owner_role",
    ]) {
      if (!isText(r[f])) fail("missing-required-field", rid, `${batch}: "${f}" missing or empty`);
    }
    for (const f of [
      "control_ids",
      "component_ids",
      "subsystem_ids",
      "acceptance_criteria",
      "tags",
    ]) {
      if (!isTextArray(r[f]))
        fail(
          "missing-required-field",
          rid,
          `${batch}: "${f}" is not an array of non-empty strings`,
        );
    }
    if (r.source_profile_id !== undefined && r.source_profile_id !== "PROFILE-WSX90-TAILORED")
      fail("bad-source-profile", rid, `${batch}: source_profile_id="${r.source_profile_id}"`);
    if (!["P1", "P2", "P3"].includes(r.priority))
      fail("bad-priority", rid, `${batch}: priority="${r.priority}"`);
    if (!["examine", "interview", "test"].includes(r.verification_method))
      fail("bad-method", rid, `${batch}: verification_method="${r.verification_method}"`);
    if (!Object.keys(GLOBAL_STATUS_TARGET).includes(r.implementation_status))
      fail("bad-status", rid, `${batch}: implementation_status="${r.implementation_status}"`);
    if (!OWNER_ROLES.has(r.owner_role))
      fail("bad-owner-role", rid, `${batch}: owner_role="${r.owner_role}" is not one of the four`);
    if (!Array.isArray(r.acceptance_criteria) || r.acceptance_criteria.length === 0)
      fail("empty-acceptance-criteria", rid, `${batch}: acceptance_criteria must have 2-4 entries`);

    for (const cid of r.control_ids ?? []) {
      if (!CONTROL_ID_RE.test(cid))
        fail("control-id-format", rid, `${batch}: "${cid}" is not the fixed AC-2 / AC-2(1) form`);
      if (!EFFECTIVE.has(cid))
        fail(
          "control-not-effective",
          rid,
          `${batch}: control "${cid}" is not in effective_control_ids`,
        );
    }
    if (!Array.isArray(r.component_ids) || r.component_ids.length < 1 || r.component_ids.length > 3)
      fail(
        "component-count",
        rid,
        `${batch}: expected 1-3 component_ids, found ${r.component_ids?.length}`,
      );
    for (const cid of r.component_ids ?? []) {
      if (!COMPONENTS.has(cid))
        fail(
          "unknown-component",
          rid,
          `${batch}: component "${cid}" is not one of LRU-001..LRU-020`,
        );
    }
    const derivedSubs = uniqSorted(
      (r.component_ids ?? []).map((c) => COMPONENTS.get(c)?.subsystem_id).filter(Boolean),
    );
    if (JSON.stringify(uniqSorted(r.subsystem_ids ?? [])) !== JSON.stringify(derivedSubs))
      fail(
        "subsystem-allocation-mismatch",
        rid,
        `${batch}: subsystem_ids ${JSON.stringify(r.subsystem_ids)} != derived ${JSON.stringify(derivedSubs)}`,
      );
    for (const s of r.subsystem_ids ?? [])
      if (!SUBSYSTEMS.has(s))
        fail("unknown-subsystem", rid, `${batch}: subsystem "${s}" does not resolve`);
  }
  reqNums.sort((a, b) => a - b);
  const expected = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  if (JSON.stringify(reqNums) !== JSON.stringify(expected))
    fail(
      "requirement-range-not-contiguous",
      batch,
      `expected a contiguous REQ-${lo}..REQ-${hi} (${expected.length} rows), got ${reqNums.length} rows spanning ${reqNums[0]}..${reqNums[reqNums.length - 1]}`,
    );

  // --- control_implementations ---
  for (const im of frag.control_implementations) {
    const iid = im.id;
    claimId(iid, batch, "control_implementation");
    if ("uuid" in im)
      fail("fragment-carries-uuid", iid, `${batch}: fragments must not carry a uuid field`);
    if (!isText(im.control_id)) {
      fail("missing-required-field", String(iid), `${batch}: control_id missing`);
      continue;
    }
    const cid = im.control_id;
    if (!CONTROL_ID_RE.test(cid))
      fail("control-id-format", iid, `${batch}: "${cid}" is not the fixed control id form`);
    if (!EFFECTIVE.has(cid))
      fail(
        "control-not-effective",
        iid,
        `${batch}: control "${cid}" is not in effective_control_ids`,
      );
    if (!UNAUTHORED_SET.has(cid))
      fail(
        "control-already-authored",
        iid,
        `${batch}: "${cid}" is already authored upstream - do not re-author`,
      );
    if (iid !== implIdFor(cid))
      fail(
        "implementation-id-convention",
        iid,
        `${batch}: expected "${implIdFor(cid)}" for ${cid}`,
      );
    if (implByControl.has(cid))
      fail(
        "duplicate-implementation-for-control",
        iid,
        `${batch}: ${cid} already implemented by ${implByControl.get(cid).record.id} (${implByControl.get(cid).batch})`,
      );
    implByControl.set(cid, { batch, record: im });

    if (!Object.keys(GLOBAL_STATUS_TARGET).includes(im.status))
      fail("bad-status", iid, `${batch}: status="${im.status}"`);
    if (!isText(im.narrative))
      fail("empty-narrative", iid, `${batch}: narrative must not be empty (§6.3)`);
    if (!isTextArray(im.responsible_roles) || im.responsible_roles.length === 0)
      fail("missing-required-field", iid, `${batch}: responsible_roles missing`);
    for (const role of im.responsible_roles ?? [])
      if (!OWNER_ROLES.has(role))
        fail("bad-owner-role", iid, `${batch}: responsible role "${role}" is not one of the four`);
    if (!Array.isArray(im.requirement_ids) || im.requirement_ids.length === 0)
      fail("implementation-without-requirement", iid, `${batch}: requirement_ids is empty`);
    if (!Array.isArray(im.by_component) || im.by_component.length === 0)
      fail("implementation-without-component", iid, `${batch}: by_component is empty`);
    for (const bc of im.by_component ?? []) {
      const comp = COMPONENTS.get(bc.component_id);
      if (!comp) {
        fail(
          "unknown-component",
          iid,
          `${batch}: by_component "${bc.component_id}" is not LRU-001..LRU-020`,
        );
        continue;
      }
      if (bc.component_uuid !== comp.uuid)
        fail(
          "component-uuid-mismatch",
          iid,
          `${batch}: ${bc.component_id} uuid "${bc.component_uuid}" != real "${comp.uuid}"`,
        );
      if (!isText(bc.description))
        fail(
          "empty-by-component-description",
          iid,
          `${batch}: ${bc.component_id} has no description`,
        );
    }
  }

  // --- evidence (local ids, renumbered later) ---
  frag.evidence.forEach((e, index) => {
    const label = `${batch}/${e.id ?? `#${index}`}`;
    if ("uuid" in e) fail("fragment-carries-uuid", label, "fragments must not carry a uuid field");
    if (!/^EVD-B\d{1,2}-\d{3}$/.test(e.id ?? ""))
      fail("evidence-local-id-format", label, `expected EVD-<batch>-NNN, got "${e.id}"`);
    for (const f of ["title", "type", "description", "assessment_reuse", "collected_at"])
      if (!isText(e[f])) fail("missing-required-field", label, `"${f}" missing or empty`);
    if (!EVIDENCE_TYPES.has(e.type))
      fail("evidence-type", label, `type="${e.type}" is outside the seven types in use`);
    if (!["eligible", "review-required"].includes(e.assessment_reuse))
      fail("evidence-reuse", label, `assessment_reuse="${e.assessment_reuse}"`);
    if (!STAMP_RE.test(e.collected_at ?? ""))
      fail("bad-stamp", label, `collected_at="${e.collected_at}" is not an offset datetime`);
    else if (e.collected_at.slice(0, 10) < EARLIEST_DATE)
      fail("date-before-floor", label, `collected_at ${e.collected_at} is before ${EARLIEST_DATE}`);
    if (e.valid_through !== "" && !STAMP_RE.test(e.valid_through ?? ""))
      fail(
        "bad-stamp",
        label,
        `valid_through="${e.valid_through}" is neither "" nor an offset datetime`,
      );
    if (!Array.isArray(e.requirement_ids) || e.requirement_ids.length === 0)
      fail("evidence-without-requirement", label, "requirement_ids is empty");
    for (const c of e.control_ids ?? [])
      if (!EFFECTIVE.has(c))
        fail("control-not-effective", label, `control "${c}" is not effective`);
    for (const c of e.component_ids ?? [])
      if (!COMPONENTS.has(c))
        fail("unknown-component", label, `component "${c}" is not LRU-001..LRU-020`);
    rawEvidence.push({ batch, index, record: e });
  });
}

// --- cross-fragment referential checks ---
for (const batch of BATCHES) {
  const frag = fragments.get(batch);
  for (const im of frag.control_implementations)
    for (const rid of im.requirement_ids ?? [])
      if (!requirementIndex.has(rid))
        fail("broken-reference", im.id, `${batch}: requirement_ids -> "${rid}" does not resolve`);
  for (const e of frag.evidence)
    for (const rid of e.requirement_ids ?? [])
      if (!requirementIndex.has(rid))
        fail(
          "broken-reference",
          `${batch}/${e.id}`,
          `requirement_ids -> "${rid}" does not resolve`,
        );
}

// --- every unauthored control covered exactly once ---
for (const cid of UNAUTHORED)
  if (!implByControl.has(cid))
    fail(
      "control-without-implementation",
      cid,
      "no fragment authored an implementation for this control",
    );
if (implByControl.size !== UNAUTHORED.length)
  fail(
    "implementation-count",
    "delivery",
    `${implByControl.size} implementations for ${UNAUTHORED.length} unauthored controls`,
  );

// --- forbidden strings anywhere in the authored payload ---
{
  const blob = JSON.stringify([...fragments.values()]);
  if (blob.includes("CCI-DEMO"))
    fail(
      "synthetic-cci",
      "delivery",
      'the forbidden string "CCI-DEMO" appears in the authored content',
    );
  const badCci = [...new Set((blob.match(CCI_ANY_RE) ?? []).filter((c) => !/^CCI-\d{6}$/.test(c)))];
  if (badCci.length)
    fail("synthetic-cci", "delivery", `non-conforming CCI identifiers: ${badCci.join(", ")}`);
}

// ---------------------------------------------------------------------------
// EVIDENCE RENUMBERING - batch order, then fragment order
// ---------------------------------------------------------------------------

const takenEvidenceNumbers = new Set(
  [...existingIds]
    .map((id) => /^EVD-(\d{3,})$/.exec(id))
    .filter(Boolean)
    .map((m) => Number(m[1])),
);

const evidenceCount = rawEvidence.length;
let evidenceStart;
if (evStartArg === "auto") {
  // The brief's stated block (EVD-091..) collides with sparse existing ids that
  // run to EVD-119. Find the lowest start >= 91 whose whole block is free.
  let n = 91;
  for (;;) {
    let clear = true;
    for (let k = 0; k < evidenceCount; k += 1) {
      if (takenEvidenceNumbers.has(n + k)) {
        n = n + k + 1;
        clear = false;
        break;
      }
    }
    if (clear) break;
    if (n > 10000) die("could not find a free contiguous evidence block");
  }
  evidenceStart = n;
} else {
  evidenceStart = Number(evStartArg);
  if (!Number.isInteger(evidenceStart)) die(`--evidence-start=${evStartArg} is not a number`);
}
if (evidenceStart !== 91)
  warn(
    "evidence-block-shifted",
    `brief §1.3 specifies EVD-091.., but ${[...takenEvidenceNumbers].filter((n) => n >= 91).length} ids in that range are already taken by the shipped seed (highest EVD-${String(Math.max(...takenEvidenceNumbers)).padStart(3, "0")}); the contiguous block starts at EVD-${String(evidenceStart).padStart(3, "0")} instead`,
  );

const pad = (n) => String(n).padStart(3, "0");
const evidenceIdMap = new Map(); // "batch/localId" -> final id
const mergedEvidence = rawEvidence.map(({ batch, record }, i) => {
  const finalId = `EVD-${pad(evidenceStart + i)}`;
  if (takenEvidenceNumbers.has(evidenceStart + i))
    fail(
      "id-collision-with-file",
      finalId,
      `${batch}: renumbered evidence id collides with an existing row`,
    );
  evidenceIdMap.set(`${batch}/${record.id}`, finalId);
  const out = { ...record };
  out.id = finalId;
  out.uuid = mintUuid(finalId);
  out.uri = `urn:demo:evidence:${finalId.toLowerCase()}`;
  out.sha256 = evidenceSha(finalId);
  // uuid must be the second key, matching the existing row shape
  const { id, uuid, ...rest } = out;
  return { id, uuid, ...rest };
});

// ---------------------------------------------------------------------------
// UUID MINTING + the three worked examples from §2.1
// ---------------------------------------------------------------------------

const WORKED_EXAMPLES = {
  "REQ-121": "be8681ad-1971-5c63-91ad-0309e2b0234f",
  "IMPL-AC_2_1": "c2bddecb-3229-5437-90bc-6750c6c29d85",
  "EVD-091": "c0902228-ccad-5030-b981-1e8bec246158",
};
for (const [name, want] of Object.entries(WORKED_EXAMPLES)) {
  const got = mintUuid(name);
  if (got !== want)
    fail("uuid5-recipe", name, `uuid5 recipe mismatch: got ${got}, brief §2.1 says ${want}`);
}

const mergedRequirements = [];
const mergedImplementations = [];
for (const batch of BATCHES) {
  const frag = fragments.get(batch);
  for (const r of frag.requirements) {
    const { id, ...rest } = r;
    mergedRequirements.push({ id, uuid: mintUuid(id), ...rest });
  }
  for (const im of frag.control_implementations) {
    const { id, ...rest } = im;
    mergedImplementations.push({ id, uuid: mintUuid(id), ...rest });
  }
}

// uuid collision check across the whole file
{
  const seenUuid = new Map();
  for (const row of [...mergedRequirements, ...mergedImplementations, ...mergedEvidence]) {
    if (existingUuids.has(row.uuid))
      fail("uuid-collision-with-file", row.id, `uuid ${row.uuid} already exists in the seed`);
    if (seenUuid.has(row.uuid))
      fail("duplicate-uuid", row.id, `uuid ${row.uuid} also minted for ${seenUuid.get(row.uuid)}`);
    seenUuid.set(row.uuid, row.id);
  }
}

// ---------------------------------------------------------------------------
// REFUSE TO WRITE ON ANY VIOLATION
// ---------------------------------------------------------------------------

if (errors.length) {
  console.error(`\nREFUSING TO WRITE - ${errors.length} validation error(s):\n`);
  for (const e of errors.slice(0, 200)) console.error("  " + e);
  if (errors.length > 200) console.error(`  ... and ${errors.length - 200} more`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// MERGE - append only; every other collection is left exactly as it is
// ---------------------------------------------------------------------------

const out = { ...upstream };
out.requirements = [...baseline.requirements, ...mergedRequirements];
out.control_implementations = [...baseline.control_implementations, ...mergedImplementations];
out.evidence = [...baseline.evidence, ...mergedEvidence];
// assessments, assessment_results, findings, risks, poam_items, traceability_views:
// deliberately untouched - the Campaign step owns those.

if (!DRY_RUN) {
  const tmp = `${UPSTREAM}.tmp`;
  writeFileSync(tmp, JSON.stringify(out, null, 2) + "\n", "utf8");
  renameSync(tmp, UPSTREAM);
}

// ---------------------------------------------------------------------------
// REPORT
// ---------------------------------------------------------------------------

const count = (rows, key) => {
  const c = new Map();
  for (const r of rows) c.set(r[key], (c.get(r[key]) ?? 0) + 1);
  return c;
};

const line = (s = "") => console.log(s);
const bar = () => line("-".repeat(78));

line();
bar();
line(
  `WS-X90 content assembly ${DRY_RUN ? "(DRY RUN - nothing written)" : "- WROTE " + path.relative(REPO, UPSTREAM)}`,
);
if (rerun) line("re-run detected: rows from a previous run were replaced, not duplicated");
bar();

line();
line("COLLECTION TOTALS");
line("  collection                  before   added    after");
const totals = [
  ["requirements", baseline.requirements.length, mergedRequirements.length],
  [
    "control_implementations",
    baseline.control_implementations.length,
    mergedImplementations.length,
  ],
  ["evidence", baseline.evidence.length, mergedEvidence.length],
];
for (const [name, before, added] of totals)
  line(
    `  ${name.padEnd(26)} ${String(before).padStart(6)} ${String(added).padStart(7)} ${String(before + added).padStart(8)}`,
  );
for (const name of ["assessments", "assessment_results", "findings", "risks", "poam_items"])
  line(
    `  ${name.padEnd(26)} ${String(upstream[name].length).padStart(6)} ${"0".padStart(7)} ${String(upstream[name].length).padStart(8)}   (Campaign step owns this)`,
  );
line(
  `  traceability_views         ${Object.keys(upstream.traceability_views ?? {}).length} maps, untouched (stale until the Campaign step regenerates them)`,
);

line();
line("IMPLEMENTATION STATUS - 472 new control_implementations vs target");
const implStatus = count(mergedImplementations, "status");
let statusOk = true;
for (const [k, target] of Object.entries(GLOBAL_STATUS_TARGET)) {
  const got = implStatus.get(k) ?? 0;
  if (got !== target) statusOk = false;
  const pct = ((got / mergedImplementations.length) * 100).toFixed(1);
  line(
    `  ${k.padEnd(24)} ${String(got).padStart(4)}  (${pct.padStart(4)}%)   target ${String(target).padStart(4)}  ${got === target ? "OK" : `OFF BY ${got - target}`}`,
  );
}
line(
  `  ${statusOk ? "-> global distribution matches the target exactly" : "-> GLOBAL DISTRIBUTION DOES NOT MATCH THE TARGET"}`,
);

line();
line("PER-BATCH STATUS TARGETS");
const missedBatches = [];
for (const batch of BATCHES) {
  const rows = fragments.get(batch).control_implementations;
  const c = count(rows, "status");
  const t = STATUS_TARGETS[batch];
  const deltas = Object.entries(t)
    .map(([k, v]) => [k, (c.get(k) ?? 0) - v])
    .filter(([, d]) => d !== 0);
  if (deltas.length) {
    missedBatches.push(batch);
    line(
      `  ${batch.padEnd(4)} MISSED: ${deltas.map(([k, d]) => `${k} ${d > 0 ? "+" : ""}${d}`).join(", ")}`,
    );
  } else {
    line(
      `  ${batch.padEnd(4)} on target (${rows.length} implementations, ${fragments.get(batch).requirements.length} requirements, ${fragments.get(batch).evidence.length} evidence)`,
    );
  }
}
if (!missedBatches.length) line("  -> every batch hit its status target exactly");

line();
line("REQUIREMENT STATUS (520 new requirements; each inherits its control's status)");
for (const [k, v] of [...count(mergedRequirements, "implementation_status")].sort(
  (a, b) => b[1] - a[1],
))
  line(`  ${k.padEnd(24)} ${String(v).padStart(4)}`);

line();
line("REQUIREMENTS PER LRU (existing + new; floor 8, ceiling ~90)");
const lruExisting = new Map();
for (const r of baseline.requirements)
  for (const c of r.component_ids ?? []) lruExisting.set(c, (lruExisting.get(c) ?? 0) + 1);
const lruNew = new Map();
for (const r of mergedRequirements)
  for (const c of r.component_ids ?? []) lruNew.set(c, (lruNew.get(c) ?? 0) + 1);
const flagsLow = [];
const flagsHigh = [];
for (const id of [...COMPONENTS.keys()].sort()) {
  const was = lruExisting.get(id) ?? 0;
  const added = lruNew.get(id) ?? 0;
  const now = was + added;
  let flag = "";
  if (now < 8) {
    flag = "  <-- BELOW FLOOR (8)";
    flagsLow.push(id);
  } else if (now > 90) {
    flag = "  <-- ABOVE CEILING (~90)";
    flagsHigh.push(id);
  }
  line(
    `  ${id}  ${COMPONENTS.get(id).name.padEnd(30)} was ${String(was).padStart(3)}  +${String(added).padStart(3)}  = ${String(now).padStart(3)}${flag}`,
  );
}
line(`  -> ${flagsLow.length} LRU(s) below 8${flagsLow.length ? ": " + flagsLow.join(", ") : ""}`);
line(
  `  -> ${flagsHigh.length} LRU(s) above 90${flagsHigh.length ? ": " + flagsHigh.join(", ") : ""}`,
);

line();
line("CNSSI 1253 ODP UPTAKE");
const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const odpPieces = (pv) =>
  String(pv)
    .split(/[;\n]|(?:\d(?:st|nd|rd|th) PV:)/g)
    .map((p) => normalize(p.replace(/^[a-z]\.\d+\.,?/i, "")))
    .filter((p) => p.length > 6);
let odpAvailable = 0;
let odpVerbatim = 0;
for (const r of mergedRequirements) {
  const pvs = (r.control_ids ?? [])
    .map((c) => DERIVATIONS[c]?.cnssi_1253?.parameter_value)
    .filter(Boolean);
  if (!pvs.length) continue;
  odpAvailable += 1;
  const text = normalize(`${r.title} ${r.description} ${(r.acceptance_criteria ?? []).join(" ")}`);
  if (pvs.some((pv) => odpPieces(pv).some((p) => text.includes(p)))) odpVerbatim += 1;
}
line(`  requirements whose control carries a real CNSSI 1253 parameter_value : ${odpAvailable}`);
line(
  `  ...of those, embedding that value verbatim in the requirement text   : ${odpVerbatim} (${((odpVerbatim / Math.max(1, odpAvailable)) * 100).toFixed(0)}%)`,
);
line(
  `  ...the remainder restate the parameter as an equivalent program number (e.g. "at least annually" -> a 12-month review-overdue flag)`,
);

line();
line("EVIDENCE");
line(
  `  local ids EVD-B*-NNN renumbered to EVD-${pad(evidenceStart)} .. EVD-${pad(evidenceStart + evidenceCount - 1)} (contiguous, batch order then fragment order)`,
);
line(
  `  every uri rewritten to urn:demo:evidence:<lowercased final id>; sha256 = sha256("wsx90-evidence:" + id)`,
);
const evByStatus = new Map();
const reqHasEvidence = new Set();
for (const e of mergedEvidence) for (const rid of e.requirement_ids) reqHasEvidence.add(rid);
for (const r of mergedRequirements) {
  const key = `${r.implementation_status}/${reqHasEvidence.has(r.id) ? "with evidence" : "no evidence"}`;
  evByStatus.set(key, (evByStatus.get(key) ?? 0) + 1);
}
for (const k of [...evByStatus.keys()].sort())
  line(`  ${k.padEnd(42)} ${String(evByStatus.get(k)).padStart(4)}`);
line(
  `  types: ${[...count(mergedEvidence, "type")]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(", ")}`,
);
line(
  `  reuse: ${[...count(mergedEvidence, "assessment_reuse")].map(([k, v]) => `${k} ${v}`).join(", ")}`,
);
const evTarget = 360;
const evDelta = (((mergedEvidence.length - evTarget) / evTarget) * 100).toFixed(0);
if (Math.abs(Number(evDelta)) > 10)
  line(
    `  NOTE: ${mergedEvidence.length} artifacts vs the §1.3 target of ${evTarget} (${evDelta}%) - outside the +/-10% tolerance`,
  );

line();
line("REQUIREMENT MIX");
line(
  `  verification_method: ${[...count(mergedRequirements, "verification_method")]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(", ")}`,
);
line(
  `  priority:            ${[...count(mergedRequirements, "priority")]
    .sort()
    .map(([k, v]) => `${k} ${v}`)
    .join(", ")}`,
);
line(
  `  owner_role:          ${[...count(mergedRequirements, "owner_role")]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(", ")}`,
);

if (warnings.length) {
  line();
  line("WARNINGS (non-blocking)");
  for (const w of warnings) line("  " + w);
}

line();
bar();
line(
  "VALIDATION: 0 errors. Controls covered: " +
    implByControl.size +
    "/" +
    UNAUTHORED.length +
    " previously-unauthored controls, exactly one implementation each.",
);
line("uuid5 worked examples from §2.1 reproduced: REQ-121, IMPL-AC_2_1, EVD-091.");
line(
  "NOT touched: assessments, assessment_results, findings, risks, poam_items, traceability_views.",
);
line("Next: the Campaign step, then node scripts/gen-wsx90-seed.mjs.");
bar();
line();
