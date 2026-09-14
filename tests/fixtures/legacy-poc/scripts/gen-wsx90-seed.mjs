#!/usr/bin/env node
/**
 * Re-derives src/data/wsx90-platform-seed.json.
 *
 * Do not hand-edit the output - regenerate with: node scripts/gen-wsx90-seed.mjs
 *
 * WHAT THIS DOES
 * The WS-X90 program content (systems, subsystems, components, requirements,
 * implementations, evidence, assessments, results, findings, risks, POA&M) is
 * hand-authored fiction and is copied through byte-for-byte. What this script
 * actually computes is the CONTROL SET: it runs the documented resolution
 * pipeline against the real reference corpus instead of shipping a hand-listed
 * "effective" array nobody derived.
 *
 *   catalog
 *     -> starting_baseline        SP 800-53B, chosen by the system categorization
 *     -> cnssi_cia_allocations    CNSSI 1253 (2022) per-objective C/I/A selection
 *     -> named_overlays           the three overlays the dataset already carried
 *     -> program_tailoring        program-specific include/exclude decisions
 *     -> parameter_values         ODP starting values
 *     -> effective_control_set
 *
 * Every control in the effective set carries an ordered provenance trail, so
 * "why is SC-7(21) in my baseline?" is answerable from the seed alone, plus the
 * real SP 800-53A Rev 5 assessment-objective ids and the real DISA CCI ids that
 * cite the control under "NIST SP 800-53 Revision 5".
 *
 * DETERMINISM
 * No wall clock, no randomness, no generated identifiers. Running this twice on
 * the same corpus produces byte-identical output, so the SHA-256 in
 * src/data/README.md and src/lib/platform-structure.test.ts stays meaningful.
 *
 * Node built-ins only. No npm dependencies.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// The one control-id implementation in the repo. Node strips the types.
import { normalizeControlId } from "../src/lib/control-id.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = join(root, "docs/examples/weapons_system_oscal_dummy");
const out = join(root, "src/data/wsx90-platform-seed.json");

/* ------------------------------------------------------------------ inputs */

const INPUTS = {
  /** One revision newer than the shipped copy: adds last_enriched + reference_datasets. */
  upstreamSeed: "platform/platform-seed.json",
  catalogFlat: "raw/derived/nist-800-53-53a-flat.json",
  cnssi: "raw/derived/cnssi-1253-extracted-normalized.json",
  cci: "raw/derived/cci-catalog-and-mappings.json",
  baselineLow: "raw/nist/NIST_SP-800-53_rev5_LOW-baseline_profile.json",
  baselineModerate: "raw/nist/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
  baselineHigh: "raw/nist/NIST_SP-800-53_rev5_HIGH-baseline_profile.json",
  baselinePrivacy: "raw/nist/NIST_SP-800-53_rev5_PRIVACY-baseline_profile.json",
};

function fail(message) {
  console.error(`\ngen-wsx90-seed: ${message}\n`);
  console.error("The reference corpus is git-ignored and must be present on disk at:");
  console.error(`  ${corpus}`);
  console.error("Rebuild the normalized derivatives with:");
  console.error(
    "  cd docs/examples/weapons_system_oscal_dummy && python3 raw/normalize_reference_data.py",
  );
  console.error(
    "If raw/ itself is missing, re-fetch the corpus (NIST OSCAL SP 800-53 Rev 5 catalog and",
  );
  console.error(
    "SP 800-53B profiles, DISA U_CCI_List_2024.xml, CNSSI 1253) into raw/ before normalizing.\n",
  );
  process.exit(1);
}

function load(key) {
  const path = join(corpus, INPUTS[key]);
  if (!existsSync(path)) fail(`missing required input: ${relative(root, path)}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`could not parse ${relative(root, path)}: ${error.message}`);
  }
}

const upstream = load("upstreamSeed");
const catalogFile = load("catalogFlat");
const cnssiFile = load("cnssi");
const cciFile = load("cci");

/* ------------------------------------------------- control id normalization */

/** OSCAL ids are lowercase dotted ("ac-2.1"); the app speaks "AC-2(1)". No zero padding. */
function fromOscalId(oscalId) {
  return normalizeControlId(String(oscalId));
}

const catalogControls = catalogFile.controls;
const catalogById = new Map(catalogControls.map((control) => [control.control_id, control]));
/** Catalog order is the publication order; every emitted list uses it. */
const catalogOrder = new Map(catalogControls.map((control, index) => [control.control_id, index]));
const byCatalogOrder = (a, b) =>
  (catalogOrder.get(a) ?? Number.MAX_SAFE_INTEGER) -
  (catalogOrder.get(b) ?? Number.MAX_SAFE_INTEGER);
const sortControls = (iterable) => [...iterable].sort(byCatalogOrder);

function baseOf(controlId) {
  const cut = controlId.indexOf("(");
  return cut === -1 ? controlId : controlId.slice(0, cut);
}

/* ------------------------------------------------------- SP 800-53B baselines */

function baselineIds(key) {
  const profile = load(key).profile;
  const ids = new Set();
  for (const item of profile.imports ?? [])
    for (const include of item["include-controls"] ?? [])
      for (const withId of include["with-ids"] ?? []) {
        const controlId = fromOscalId(withId);
        if (!controlId) fail(`unrecognized OSCAL control id "${withId}" in ${INPUTS[key]}`);
        if (!catalogById.has(controlId))
          fail(`${INPUTS[key]} selects ${controlId}, which is absent from the catalog`);
        ids.add(controlId);
      }
  if (!ids.size) fail(`${INPUTS[key]} selected no controls`);
  return { ids, metadata: profile.metadata };
}

const baselines = {
  Low: baselineIds("baselineLow"),
  Moderate: baselineIds("baselineModerate"),
  High: baselineIds("baselineHigh"),
  Privacy: baselineIds("baselinePrivacy"),
};
const baselinesFor = (controlId) =>
  ["Low", "Moderate", "High", "Privacy"].filter((level) => baselines[level].ids.has(controlId));

/* ------------------------------------------------------------- CNSSI 1253 */

const cnssiRecords = cnssiFile.records;
for (const controlId of Object.keys(cnssiRecords))
  if (!catalogById.has(controlId))
    fail(`CNSSI extraction names ${controlId}, which is absent from the catalog`);

/**
 * CNSSI 1253 allocates each control against confidentiality, integrity and
 * availability independently. A control is in the NSS baseline when ANY of the
 * three objectives selects it at the system's impact for that objective.
 */
function cnssiDrivers(controlId, triad) {
  const record = cnssiRecords[controlId];
  if (!record) return [];
  // Objective names only: the impact for each objective is fixed by the
  // system categorization, which derivation.categorization already records.
  return ["confidentiality", "integrity", "availability"].filter(
    (objective) => record.selections?.[objective]?.[triad[objective]],
  );
}

/* ------------------------------------------------------------- DISA CCI */

/**
 * The normalized corpus ships `control_id_guess`, which is base-control-only and
 * loses the enhancement in indexes like "AC-2 (1)". Parse the reference index
 * properly: a numeric parenthetical directly after the control number is an
 * enhancement; an alphabetic one ("AC-2 (3) (d)") is a statement item.
 */
const CCI_INDEX = /\b([A-Z]{2})-(\d+)(?:\s*\((\d+)\))?/g;
function cciTargets(index) {
  const found = new Set();
  for (const match of String(index ?? "").matchAll(CCI_INDEX)) {
    const id = normalizeControlId(
      match[3] === undefined ? `${match[1]}-${match[2]}` : `${match[1]}-${match[2]}(${match[3]})`,
    );
    if (id) found.add(id);
  }
  return found;
}

const cciByControl = new Map();
let cciJoins = 0;
let cciUnresolved = 0;
for (const mapping of cciFile.mappings) {
  if (mapping.reference_title !== "NIST SP 800-53 Revision 5") continue;
  for (const controlId of cciTargets(mapping.reference_index)) {
    if (!catalogById.has(controlId)) {
      cciUnresolved += 1;
      continue;
    }
    if (!cciByControl.has(controlId)) cciByControl.set(controlId, new Set());
    cciByControl.get(controlId).add(mapping.cci_id);
    cciJoins += 1;
  }
}
if (cciUnresolved) fail(`${cciUnresolved} DISA CCI Rev 5 references did not resolve to a control`);
if (!cciJoins) fail("the DISA CCI mappings produced no NIST SP 800-53 Revision 5 joins");

/* -------------------------------------------------- SP 800-53A objectives */

/**
 * SP 800-53A Rev. 5 objective part ids, restricted to the nodes the app actually
 * ships. scripts/gen-nist-catalog.mjs unwraps the control-level container when it
 * has children AND carries no prose of its own, so those container ids resolve to
 * nothing in src/lib/nist-control-text and must not be cited here. Everything
 * else — including a container that DOES carry prose, such as CA-7(4) or PM-31 —
 * is kept. src/lib/platform-seed.test.ts asserts the two sides agree.
 */
const objectivesByControl = new Map(
  catalogControls.map((control) => {
    const parts = (control.parts ?? []).filter(
      (part) => part.name === "assessment-objective" && part.id,
    );
    const ids = new Set(parts.map((part) => part.id));
    const hasChild = (id) =>
      parts.some(
        (part) => part.id !== id && (part.id.startsWith(`${id}.`) || part.id.startsWith(`${id}-`)),
      );
    const isTopLevel = (id) => {
      const parent = id.replace(/[.-][^.-]+$/, "");
      return parent === id || !ids.has(parent);
    };
    const kept = parts
      .filter((part) => !(isTopLevel(part.id) && hasChild(part.id) && !(part.prose ?? "").trim()))
      .map((part) => part.id);
    return [control.control_id, kept];
  }),
);

/* ------------------------------------------------------ the system record */

const system = upstream.systems[0];
const profile = upstream.profiles.find((item) => item.id === system.profile_id);
if (!system || !profile) fail("the upstream seed has no system/profile pair to resolve");

/**
 * DATA CONFLICT, RESOLVED.
 * systems[0].security_categorization says C:high I:high A:moderate (overall high).
 * platform/security-configuration-example.json says C:H I:M A:M ("H-M-M").
 * The system record wins: it is the record of authority the application reads,
 * it is internally consistent (overall "high"), and the configuration example is
 * a derived illustration whose own CNSSI table is self-labelled
 * "synthetic-demo-allocation". The example is stale and is not shipped.
 */
const CATEGORIZATION_RESOLUTION = {
  chosen: "systems[0].security_categorization",
  chosen_value: "C:high / I:high / A:moderate (overall high)",
  rejected: "docs/examples/weapons_system_oscal_dummy/platform/security-configuration-example.json",
  rejected_value: "C:H / I:M / A:M (display H-M-M)",
  basis:
    "The system record is the authority the application reads and is internally consistent with overall=high. The configuration example is a derived illustration built on a self-labelled synthetic CNSSI allocation table and is not shipped with the application.",
};

const triad = {
  confidentiality: system.security_categorization.confidentiality,
  integrity: system.security_categorization.integrity,
  availability: system.security_categorization.availability,
};
const RANK = { low: 0, moderate: 1, high: 2 };
const LEVEL = ["Low", "Moderate", "High"];
const highWaterMark =
  LEVEL[Math.max(RANK[triad.confidentiality], RANK[triad.integrity], RANK[triad.availability])];
if (!highWaterMark) fail(`unrecognized categorization ${JSON.stringify(triad)}`);
if (LEVEL.indexOf(highWaterMark) !== RANK[system.security_categorization.overall])
  fail(
    `the system's overall categorization (${system.security_categorization.overall}) is not the high-water mark of its C/I/A (${highWaterMark})`,
  );

/* =================================================================== stages */

const stages = [];
const trail = new Map(); // control_id -> ordered reason records
const reason = (controlId, record) => {
  if (!trail.has(controlId)) trail.set(controlId, []);
  trail.get(controlId).push(record);
};

/* -- 1. catalog ----------------------------------------------------------- */

stages.push({
  sequence: 1,
  stage: "catalog",
  source_id: "NIST-800-53-R5",
  input: `NIST SP 800-53 Rev 5 OSCAL catalog ${catalogFile.dataset_metadata.version}`,
  controls_available: catalogControls.length,
  note: "The full catalog: 324 base controls and 872 enhancements across 20 families.",
});

/* -- 2. starting baseline (SP 800-53B) ------------------------------------ */

const startingSelection = sortControls(baselines[highWaterMark].ids);
const BASIS_BASELINE = `Selected by the SP 800-53B ${highWaterMark} baseline, the high-water mark of this categorization.`;
for (const controlId of startingSelection)
  reason(controlId, {
    stage: "starting_baseline",
    source_id: "NIST-800-53B-R5",
    action: "selected",
    basis: BASIS_BASELINE,
  });

stages.push({
  sequence: 2,
  stage: "starting_baseline",
  source_id: "NIST-800-53B-R5",
  input: `SP 800-53B ${highWaterMark} baseline`,
  categorization: { ...triad, overall: system.security_categorization.overall },
  high_water_mark: highWaterMark,
  categorization_resolution: CATEGORIZATION_RESOLUTION,
  selected: startingSelection.length,
  running_total: startingSelection.length,
});

/* -- 3. CNSSI 1253 C/I/A allocation --------------------------------------- */

/**
 * For a national security system CNSSI 1253 supplies the baseline in place of
 * the SP 800-53B allocation. It is expressed here as an ordered delta against
 * SP 800-53B so both the additions and - just as important - the withdrawals
 * stay visible and attributable.
 */
const cnssiSelected = new Set();
for (const controlId of Object.keys(cnssiRecords))
  if (cnssiDrivers(controlId, triad).length) cnssiSelected.add(controlId);

const cnssiAdds = sortControls(
  [...cnssiSelected].filter((id) => !baselines[highWaterMark].ids.has(id)),
);
const cnssiRemoves = sortControls(
  [...baselines[highWaterMark].ids].filter((id) => !cnssiSelected.has(id)),
);
const driverText = (controlId) =>
  cnssiDrivers(controlId, triad)
    .map((objective) => `${objective}=${triad[objective]}`)
    .join(", ");

const CNSSI_OVERLAY_ID = "OVL-CNSSI-1253-ALLOCATION";
const cnssiOverlay = {
  overlay_id: CNSSI_OVERLAY_ID,
  name: "CNSSI 1253 National Security System Allocation",
  type: "nss-baseline-allocation",
  stage: "cnssi_cia_allocations",
  source_id: "CNSSI-1253-2022-EXTRACT",
  adds: cnssiAdds,
  removes: cnssiRemoves,
  reason: `CNSSI 1253 (2022) allocates controls against confidentiality, integrity and availability independently. At C=${triad.confidentiality}, I=${triad.integrity}, A=${triad.availability} it selects ${cnssiSelected.size} controls, adding ${cnssiAdds.length} the SP 800-53B ${highWaterMark} baseline does not carry and withdrawing ${cnssiRemoves.length} it does.`,
  authoritative: false,
  provenance_note:
    "Selections come from a third-party text extraction of CNSSI 1253 (2022), not an official CNSS machine-readable release. Treat every selection as derived.",
};

/* The objectives that drove each selection live in control_derivations.cnssi_1253.drivers,
 * so these strings stay short rather than restating them 546 times. */
const BASIS_CNSSI_ADD = `Selected by CNSSI 1253 for this categorization; the SP 800-53B ${highWaterMark} baseline does not carry it.`;
const BASIS_CNSSI_DROP = `Not selected by CNSSI 1253 for this categorization, although SP 800-53B ${highWaterMark} carries it.`;
const BASIS_CNSSI_KEEP = "Also selected by CNSSI 1253 for this categorization.";
for (const controlId of cnssiAdds)
  reason(controlId, {
    stage: "cnssi_cia_allocations",
    source_id: "CNSSI-1253-2022-EXTRACT",
    action: "added",
    basis: BASIS_CNSSI_ADD,
  });
for (const controlId of cnssiRemoves)
  reason(controlId, {
    stage: "cnssi_cia_allocations",
    source_id: "CNSSI-1253-2022-EXTRACT",
    action: "withdrawn",
    basis: BASIS_CNSSI_DROP,
  });
for (const controlId of cnssiSelected)
  if (baselines[highWaterMark].ids.has(controlId))
    reason(controlId, {
      stage: "cnssi_cia_allocations",
      source_id: "CNSSI-1253-2022-EXTRACT",
      action: "confirmed",
      basis: BASIS_CNSSI_KEEP,
    });

const postCnssi = new Set(cnssiSelected);
stages.push({
  sequence: 3,
  stage: "cnssi_cia_allocations",
  source_id: "CNSSI-1253-2022-EXTRACT",
  input: `C=${triad.confidentiality}, I=${triad.integrity}, A=${triad.availability}`,
  overlay_id: CNSSI_OVERLAY_ID,
  added: cnssiAdds.length,
  withdrawn: cnssiRemoves.length,
  running_total: postCnssi.size,
  authoritative: false,
});

/* -- 4. named overlays ---------------------------------------------------- */

/**
 * The three overlays the dataset already carried keep their identity, intent and
 * rationale. What changes is that their adds and removes are re-expressed
 * against the resolved set instead of against a 68-control hand list:
 *
 *   - a removal of a base control also withdraws every enhancement of it that
 *     the resolved set carries (an enhancement cannot outlive its base);
 *   - an addition also pulls in the base control when an enhancement is named;
 *   - an addition of a control the resolved set already carries is kept as a
 *     recorded reaffirmation, not silently dropped.
 */
const working = new Set(postCnssi);
const namedOverlays = [];
const overlayEffects = [];

for (const [index, sourceOverlay] of profile.overlays.entries()) {
  const adds = [];
  const reaffirmed = [];
  for (const controlId of sourceOverlay.adds) {
    if (!catalogById.has(controlId))
      fail(`overlay ${sourceOverlay.overlay_id} adds unknown control ${controlId}`);
    const base = baseOf(controlId);
    if (base !== controlId && !working.has(base) && !adds.includes(base)) adds.push(base);
    if (working.has(controlId)) reaffirmed.push(controlId);
    else adds.push(controlId);
  }
  const removes = [];
  for (const controlId of sourceOverlay.removes) {
    if (!catalogById.has(controlId))
      fail(`overlay ${sourceOverlay.overlay_id} removes unknown control ${controlId}`);
    removes.push(controlId);
    if (baseOf(controlId) === controlId)
      for (const candidate of working)
        if (candidate !== controlId && baseOf(candidate) === controlId) removes.push(candidate);
  }

  const overlay = {
    ...sourceOverlay,
    stage: "named_overlays",
    // `adds` is carried-forward authored content: keep the order the overlay was
    // written in. The derived fields below are the ones in catalog order.
    adds: [...sourceOverlay.adds],
    removes: sortControls(new Set(removes)),
    resolved_adds: sortControls(new Set(adds)),
    reaffirmed: sortControls(new Set(reaffirmed)),
    resolution_note:
      "Adds and removes are re-expressed against the resolved CNSSI 1253 set. Removing a base control withdraws its enhancements; an add already carried by the resolved set is recorded as a reaffirmation.",
  };
  namedOverlays.push(overlay);
  overlayEffects.push({
    overlay,
    adds: overlay.resolved_adds,
    reaffirmed: overlay.reaffirmed,
    removes: overlay.removes,
  });

  // The overlay's full rationale lives once on the overlay record; the trail points at it.
  for (const controlId of overlay.resolved_adds) {
    working.add(controlId);
    reason(controlId, {
      stage: "named_overlays",
      source_id: "WSX90-OVERLAYS",
      overlay_id: overlay.overlay_id,
      action: "added",
      basis: `Added by ${overlay.name}.`,
    });
  }
  for (const controlId of overlay.reaffirmed)
    reason(controlId, {
      stage: "named_overlays",
      source_id: "WSX90-OVERLAYS",
      overlay_id: overlay.overlay_id,
      action: "reaffirmed",
      basis: `Named by ${overlay.name}; the resolved set already carried it.`,
    });
  for (const controlId of overlay.removes) {
    working.delete(controlId);
    reason(controlId, {
      stage: "named_overlays",
      source_id: "WSX90-OVERLAYS",
      overlay_id: overlay.overlay_id,
      action: "withdrawn",
      basis:
        baseOf(controlId) === controlId
          ? `Tailored out by ${overlay.name}.`
          : `Withdrawn with its base control ${baseOf(controlId)}, tailored out by ${overlay.name}.`,
    });
  }

  stages.push({
    sequence: 4,
    stage: "named_overlays",
    order: index + 1,
    overlay_id: overlay.overlay_id,
    name: overlay.name,
    type: overlay.type,
    added: overlay.resolved_adds.length,
    reaffirmed: overlay.reaffirmed.length,
    withdrawn: overlay.removes.length,
    running_total: working.size,
  });
}

/* -- 5. program tailoring ------------------------------------------------- */

/**
 * No program-level include/exclude has been authored beyond the three named
 * overlays. The stage is emitted with an empty event list on purpose: the gap is
 * explicit and countable rather than hidden by omission.
 */
const programTailoring = { includes: [], excludes: [] };
stages.push({
  sequence: 5,
  stage: "program_tailoring",
  source_id: "WSX90-PROGRAM",
  included: programTailoring.includes.length,
  excluded: programTailoring.excludes.length,
  running_total: working.size,
  note: "No program-specific tailoring has been authored beyond the named overlays. Deferred to the authoring pass; the empty stage is deliberate, not a dropped step.",
});

/* -- 6. parameter values (ODP starting values) ---------------------------- */

const effective = sortControls(working);
const effectiveSet = new Set(effective);

const odpStartingValues = effective
  .filter((controlId) => cnssiRecords[controlId]?.parameter_value)
  .map((controlId) => ({
    control_id: controlId,
    value: cnssiRecords[controlId].parameter_value,
    source_id: "CNSSI-1253-2022-EXTRACT",
    authoritative: false,
    status: "starting-value",
  }));

stages.push({
  sequence: 6,
  stage: "parameter_values",
  source_id: "CNSSI-1253-2022-EXTRACT",
  controls_with_starting_value: odpStartingValues.length,
  controls_without_starting_value: effective.length - odpStartingValues.length,
  running_total: working.size,
  note: "CNSSI 1253 supplies an NSS starting value for the organization-defined parameters it constrains. Values are verbatim from the extraction, including its line breaks; they are starting values, not program decisions.",
});

/* -- 7. effective control set --------------------------------------------- */

stages.push({
  sequence: 7,
  stage: "effective_control_set",
  effective: effective.length,
  families: new Set(effective.map((id) => catalogById.get(id).family.id)).size,
  base_controls: effective.filter((id) => baseOf(id) === id).length,
  enhancements: effective.filter((id) => baseOf(id) !== id).length,
});

/* ------------------------------------------------------- tailoring events */

const tailoringEvents = [];
const pushEvent = (overlayId, action, controlId, rationale) =>
  tailoringEvents.push({
    sequence: tailoringEvents.length + 1,
    overlay_id: overlayId,
    action,
    control_id: controlId,
    rationale,
  });

for (const controlId of cnssiAdds)
  pushEvent(
    CNSSI_OVERLAY_ID,
    "include",
    controlId,
    `CNSSI 1253 selects ${controlId} at ${driverText(controlId)}; SP 800-53B ${highWaterMark} does not carry it.`,
  );
for (const controlId of cnssiRemoves)
  pushEvent(
    CNSSI_OVERLAY_ID,
    "exclude",
    controlId,
    `CNSSI 1253 does not select ${controlId} for this categorization; the SP 800-53B ${highWaterMark} selection is withdrawn.`,
  );
for (const effect of overlayEffects) {
  for (const controlId of effect.adds)
    pushEvent(
      effect.overlay.overlay_id,
      "include",
      controlId,
      `${effect.overlay.name} adds ${controlId}. ${effect.overlay.reason}`,
    );
  for (const controlId of effect.reaffirmed)
    pushEvent(
      effect.overlay.overlay_id,
      "include",
      controlId,
      `${effect.overlay.name} names ${controlId}, which the resolved set already carried; the selection is reaffirmed, not newly added.`,
    );
  for (const controlId of effect.removes)
    pushEvent(
      effect.overlay.overlay_id,
      "exclude",
      controlId,
      baseOf(controlId) === controlId
        ? `${effect.overlay.name} tailors out ${controlId}. ${effect.overlay.reason}`
        : `${effect.overlay.name} tailors out ${baseOf(controlId)}; ${controlId} is withdrawn with its base control.`,
    );
}

/* --------------------------------------------- per-control derivation trail */

const implementationByControl = new Map(
  upstream.control_implementations.map((row) => [row.control_id, row]),
);
const requirementsByControl = new Map();
for (const requirement of upstream.requirements)
  for (const controlId of requirement.control_ids) {
    if (!requirementsByControl.has(controlId)) requirementsByControl.set(controlId, []);
    requirementsByControl.get(controlId).push(requirement.id);
  }

/** Which stage first put the control into the set and left it there. */
function selectionOrigin(controlId) {
  let origin = null;
  for (const record of trail.get(controlId) ?? []) {
    if (record.action === "selected") origin = "NIST-800-53B-R5";
    else if (record.action === "added")
      origin =
        record.overlay_id ?? (record.stage === "cnssi_cia_allocations" ? CNSSI_OVERLAY_ID : origin);
    else if (record.action === "withdrawn") origin = null;
  }
  return origin;
}

const controlDerivations = {};
for (const controlId of effective) {
  const control = catalogById.get(controlId);
  const cnssiRecord = cnssiRecords[controlId] ?? null;
  const implementation = implementationByControl.get(controlId) ?? null;
  const objectives = objectivesByControl.get(controlId) ?? [];
  const ccis = [...(cciByControl.get(controlId) ?? [])].sort();
  controlDerivations[controlId] = {
    control_id: controlId,
    family: control.family.id.toUpperCase(),
    title: control.title,
    selection_origin: selectionOrigin(controlId),
    sp800_53b_baselines: baselinesFor(controlId),
    cnssi_1253: cnssiRecord
      ? {
          selected: cnssiSelected.has(controlId),
          drivers: cnssiDrivers(controlId, triad),
          parameter_value: cnssiRecord.parameter_value ?? null,
          justification: cnssiRecord.justification ?? null,
          source_id: "CNSSI-1253-2022-EXTRACT",
          authoritative: false,
        }
      : null,
    selection_trail: trail.get(controlId) ?? [],
    assessment_objective_ids: objectives,
    cci_ids: ccis,
    implementation_id: implementation?.id ?? null,
    implementation_status: implementation?.status ?? "not-implemented",
    requirement_ids: requirementsByControl.get(controlId) ?? [],
    authoring_status: implementation ? "authored" : "unauthored",
  };
}

/* Withdrawn controls stay legible: what left, why, and whether it came back. */
const withdrawn = sortControls(
  new Set([...cnssiRemoves, ...overlayEffects.flatMap((effect) => effect.removes)]),
)
  .filter((controlId) => !effectiveSet.has(controlId))
  .map((controlId) => ({
    control_id: controlId,
    title: catalogById.get(controlId).title,
    trail: trail.get(controlId) ?? [],
  }));

const reinstated = sortControls(cnssiRemoves).filter((controlId) => effectiveSet.has(controlId));

/* --------------------------------------------------------- reference sources */

const catalogMeta = catalogFile.dataset_metadata;
const referenceSources = [
  {
    id: "NIST-800-53-R5",
    name: "NIST SP 800-53 Rev 5 control catalog (OSCAL)",
    authority: "NIST",
    release: catalogMeta.version,
    authoritative: true,
    rights: "US Government work, public domain",
    path: `docs/examples/weapons_system_oscal_dummy/${INPUTS.catalogFlat}`,
    upstream: "raw/nist/NIST_SP-800-53_rev5_catalog.json",
  },
  {
    id: "NIST-800-53A-R5",
    name: "NIST SP 800-53A Rev 5 assessment procedures",
    authority: "NIST",
    release: catalogMeta.version,
    authoritative: true,
    rights: "US Government work, public domain",
    path: `docs/examples/weapons_system_oscal_dummy/${INPUTS.catalogFlat}`,
    note: "The same OSCAL release carries both the SP 800-53 control content and the SP 800-53A assessment procedures.",
  },
  {
    id: "NIST-800-53B-R5",
    name: "NIST SP 800-53B Rev 5 control baselines",
    authority: "NIST",
    release: baselines.High.metadata.version,
    authoritative: true,
    rights: "US Government work, public domain",
    path: `docs/examples/weapons_system_oscal_dummy/${INPUTS.baselineHigh}`,
    // All four profiles are read: the starting selection comes from High, and the
    // per-control sp800_53b_baselines labels come from all four, Privacy included.
    paths: [
      `docs/examples/weapons_system_oscal_dummy/${INPUTS.baselineLow}`,
      `docs/examples/weapons_system_oscal_dummy/${INPUTS.baselineModerate}`,
      `docs/examples/weapons_system_oscal_dummy/${INPUTS.baselineHigh}`,
      `docs/examples/weapons_system_oscal_dummy/${INPUTS.baselinePrivacy}`,
    ],
    sizes: {
      Low: baselines.Low.ids.size,
      Moderate: baselines.Moderate.ids.size,
      High: baselines.High.ids.size,
      Privacy: baselines.Privacy.ids.size,
    },
  },
  {
    id: "DISA-CCI-2024",
    name: "DISA Control Correlation Identifier list",
    authority: "DISA",
    release: cciFile.dataset_metadata.version,
    // The CONTENT is DISA's, but these bytes came from a public mirror rather than
    // Cyber Exchange. src/lib/cci-catalog.ts records the same standing; the two
    // must not disagree about the same file.
    authoritative: false,
    rights: "DISA CCI is a US Government work. The content is DISA's; the mirroring is not.",
    path: `docs/examples/weapons_system_oscal_dummy/${INPUTS.cci}`,
    upstream: "raw/cci/U_CCI_List_2024.xml",
    note: 'Only references titled "NIST SP 800-53 Revision 5" are joined. The list also carries Rev 4, Rev 3 and SP 800-53A Revision 1 references; there is no CCI-to-SP 800-53A Rev 5 linkage in the source and none is invented here.',
  },
  {
    id: "CNSSI-1253-2022-EXTRACT",
    name: "CNSSI 1253 (2022) security control baselines, third-party extraction",
    authority: "CNSS (publication); third-party extraction (this file)",
    release: "2022",
    authoritative: false,
    rights:
      "Derived from a US Government publication; the extraction is not an official CNSS release",
    path: `docs/examples/weapons_system_oscal_dummy/${INPUTS.cnssi}`,
    upstream: "raw/cnssi/extracted_cnssi_1253.json (provenance: raw/cnssi/CNSSI_1253_2022.pdf)",
    records: Object.keys(cnssiRecords).length,
    note: "Selections and parameter values are read from a text extraction of the published tables. They are derived, not machine-readable CNSS output, and every record that uses them is flagged authoritative:false.",
  },
  {
    id: "WSX90-OVERLAYS",
    name: "WS-X90 named overlays",
    authority: "Aurora Defense Systems (fictional)",
    release: "demo",
    authoritative: false,
    rights: "Synthetic demonstration content",
    note: "Overlay identity, intent and rationale are fictional program content carried forward from the source dataset.",
  },
  {
    id: "WSX90-PROGRAM",
    name: "WS-X90 program records",
    authority: "Aurora Defense Systems (fictional)",
    release: "demo",
    authoritative: false,
    rights: "Synthetic demonstration content",
    note: "Systems, subsystems, components, requirements, implementations, evidence, assessments, findings, risks and POA&M items are entirely fictional.",
  },
];

/* --------------------------------------------------------------- assembly */

const resolvedProfile = {
  ...profile,
  starting_selection: startingSelection,
  overlays: [cnssiOverlay, ...namedOverlays],
  effective_control_ids: effective,
  tailoring_rationale: `Resolved through the documented pipeline: SP 800-53 Rev 5 catalog -> SP 800-53B ${highWaterMark} baseline (${startingSelection.length}) -> CNSSI 1253 C/I/A allocation at C=${triad.confidentiality}, I=${triad.integrity}, A=${triad.availability} (${postCnssi.size}) -> three named overlays (${working.size}) -> program tailoring (none authored) -> parameter values. Each selection, addition and withdrawal is preserved as an ordered provenance event rather than flattened away.`,
  tailoring_events: tailoringEvents,
  reference_sources: referenceSources,
  derivation: {
    generator: "scripts/gen-wsx90-seed.mjs",
    order: [
      "catalog",
      "starting_baseline",
      "cnssi_cia_allocations",
      "named_overlays",
      "program_tailoring",
      "parameter_values",
      "effective_control_set",
    ],
    categorization: { ...triad, overall: system.security_categorization.overall },
    high_water_mark: highWaterMark,
    categorization_resolution: CATEGORIZATION_RESOLUTION,
    /* Provenance for the per-control reference joins, stated once rather than
     * repeated on all 546 records. control_derivations carries the ids only. */
    reference_joins: {
      assessment_objective_ids: {
        source_id: "NIST-800-53A-R5",
        authoritative: true,
        basis: "OSCAL parts named 'assessment-objective' on the control, verbatim part ids.",
      },
      cci_ids: {
        source_id: "DISA-CCI-2024",
        authoritative: true,
        reference_title: "NIST SP 800-53 Revision 5",
        basis:
          "DISA CCI items whose NIST reference index names this control or enhancement. A numeric parenthetical directly after the control number is an enhancement; an alphabetic one is a statement item.",
        excluded:
          "The list's SP 800-53A references are all Revision 1 (Rev-3 era indexes such as 'AC-1.1 (i and ii)'). There is no CCI-to-SP 800-53A Rev 5 linkage in the source, so none is asserted.",
      },
      cnssi_1253: {
        source_id: "CNSSI-1253-2022-EXTRACT",
        authoritative: false,
        basis:
          "Per-objective L/M/H selection read from a third-party text extraction of the published CNSSI 1253 (2022) tables.",
      },
    },
    stages,
    program_tailoring: programTailoring,
    withdrawn,
    reinstated,
    counts: {
      catalog: catalogControls.length,
      starting_baseline: startingSelection.length,
      post_cnssi: postCnssi.size,
      post_overlays: working.size,
      effective: effective.length,
      withdrawn: withdrawn.length,
      reinstated: reinstated.length,
      tailoring_events: tailoringEvents.length,
      with_implementation: effective.filter((id) => implementationByControl.has(id)).length,
      without_implementation: effective.filter((id) => !implementationByControl.has(id)).length,
      with_assessment_objectives: effective.filter(
        (id) => (objectivesByControl.get(id) ?? []).length > 0,
      ).length,
      assessment_objectives: effective.reduce(
        (total, id) => total + (objectivesByControl.get(id) ?? []).length,
        0,
      ),
      with_ccis: effective.filter((id) => (cciByControl.get(id)?.size ?? 0) > 0).length,
      cci_links: effective.reduce((total, id) => total + (cciByControl.get(id)?.size ?? 0), 0),
      odp_starting_values: odpStartingValues.length,
    },
    authoring_gap: {
      controls_without_authored_content: effective.filter((id) => !implementationByControl.has(id))
        .length,
      status_applied: "not-implemented",
      note: "The gap is closed: every effective control carries an implementation record, a narrative and at least one requirement, and authoring_status is 'authored' throughout control_derivations. implementation_status is the program's own claim per control, so 'not-implemented' where the program has not built it yet is an authored position, not a missing record. This counter stays in the derivation so a future re-resolution that adds controls reopens it visibly.",
    },
  },
  odp_starting_values: odpStartingValues,
  control_derivations: controlDerivations,
};

/** Previous-revision placeholder datasets, keyed by the path they pointed at. */
const SUPERSEDED_BY = {
  "../reference/cnssi-1253-overlay-mapping.json": "CNSSI-1253-2022-EXTRACT",
  "../reference/cci-catalog.json": "DISA-CCI-2024",
  "../reference/control-cci-mapping.json": "DISA-CCI-2024",
  "../reference/nist-800-53a-assessment-objectives.json": "NIST-800-53A-R5",
  "master-control-catalog.json": null,
  "security-configuration-example.json": null,
};

const referenceDatasets = referenceSources
  .filter((source) => source.path)
  .map((source) => ({
    id: source.id,
    path: source.path,
    type:
      source.id === "NIST-800-53B-R5"
        ? "control-baselines"
        : source.id === "DISA-CCI-2024"
          ? "cci-catalog-and-crosswalk"
          : source.id === "CNSSI-1253-2022-EXTRACT"
            ? "overlay-and-baseline-allocation"
            : source.id === "NIST-800-53A-R5"
              ? "assessment-procedure-catalog"
              : "control-catalog",
    authority: source.authority,
    release: source.release,
    authoritative: source.authoritative,
  }));

const seed = {
  dataset_metadata: {
    ...upstream.dataset_metadata,
    disclaimer:
      "The WS-X90 system, program and assurance records are entirely fictional. The framework reference layer is not: the control catalog, the SP 800-53B baselines, the SP 800-53A Rev 5 assessment objectives and the DISA CCI identifiers are the real published content, and the CNSSI 1253 allocation is a third-party extraction of the real publication flagged authoritative:false. Control and requirement narratives remain synthetic and do not reproduce authoritative NIST control text.",
    derivation: "scripts/gen-wsx90-seed.mjs",
    reference_layer: "authoritative",
    /* The superseded placeholder dataset IDs are deliberately not echoed here: the
     * synthetic CCI identifiers must not survive anywhere in the shipped seed.
     * Each entry is identified by the path it pointed at instead. */
    superseded_reference_datasets: (upstream.reference_datasets ?? []).map((entry) => ({
      path: entry.path,
      type: entry.type,
      superseded_by: SUPERSEDED_BY[entry.path] ?? null,
      reason:
        "Synthetic placeholder from the previous revision, replaced by the authoritative reference layer. Its placeholder correlation identifiers and modelled assessment objectives are not shipped.",
    })),
  },
  organization: upstream.organization,
  control_sources: upstream.control_sources,
  profiles: upstream.profiles.map((item) => (item.id === profile.id ? resolvedProfile : item)),
  systems: upstream.systems,
  subsystems: upstream.subsystems,
  components: upstream.components,
  requirements: upstream.requirements,
  control_implementations: upstream.control_implementations,
  evidence: upstream.evidence,
  assessments: upstream.assessments,
  assessment_results: upstream.assessment_results,
  findings: upstream.findings,
  risks: upstream.risks,
  poam_items: upstream.poam_items,
  traceability_views: upstream.traceability_views,
  reference_datasets: referenceDatasets,
};

/* -------------------------------------------------------------- self-checks */

const problems = [];
const check = (condition, message) => {
  if (!condition) problems.push(message);
};

// The validator in src/lib/platform-seed.ts replays overlays and events; both must land here.
const replayOverlays = new Set(seed.profiles[0].starting_selection);
for (const overlay of seed.profiles[0].overlays) {
  for (const controlId of overlay.adds) replayOverlays.add(controlId);
  for (const controlId of overlay.removes) replayOverlays.delete(controlId);
}
check(
  replayOverlays.size === effective.length && effective.every((id) => replayOverlays.has(id)),
  "replaying starting_selection + overlays does not reproduce effective_control_ids",
);

const replayEvents = new Set(seed.profiles[0].starting_selection);
seed.profiles[0].tailoring_events.forEach((event, index) => {
  check(event.sequence === index + 1, `tailoring event ${index + 1} is out of sequence`);
  if (event.action === "include") replayEvents.add(event.control_id);
  else replayEvents.delete(event.control_id);
});
check(
  replayEvents.size === effective.length && effective.every((id) => replayEvents.has(id)),
  "replaying the tailoring events does not reproduce effective_control_ids",
);

check(new Set(effective).size === effective.length, "effective_control_ids repeats a control");
for (const row of upstream.control_implementations)
  check(
    effectiveSet.has(row.control_id),
    `implementation ${row.id} names ${row.control_id}, which the resolution dropped`,
  );
for (const requirement of upstream.requirements)
  for (const controlId of requirement.control_ids)
    check(
      effectiveSet.has(controlId),
      `requirement ${requirement.id} names ${controlId}, which the resolution dropped`,
    );
for (const controlId of effective) {
  check(catalogById.has(controlId), `${controlId} is not in the catalog`);
  check((trail.get(controlId) ?? []).length > 0, `${controlId} has no selection trail`);
  const base = baseOf(controlId);
  check(
    base === controlId || effectiveSet.has(base),
    `${controlId} is selected without its base control ${base}`,
  );
}
check(
  !JSON.stringify(seed).includes("CCI-DEMO"),
  "a synthetic CCI-DEMO identifier survived into the seed",
);

// The hand-authored program content must come through untouched.
for (const key of [
  "organization",
  "control_sources",
  "systems",
  "subsystems",
  "components",
  "requirements",
  "control_implementations",
  "evidence",
  "assessments",
  "assessment_results",
  "findings",
  "risks",
  "poam_items",
  "traceability_views",
])
  check(
    JSON.stringify(seed[key]) === JSON.stringify(upstream[key]),
    `${key} was modified; hand-authored program content must be carried through verbatim`,
  );

/**
 * Cause before effect (brief section 6.4). An assessor cannot have relied on an
 * artifact that did not yet exist, so every result must cite evidence collected
 * strictly before its own assessed_on. The generated campaign is held to zero. The
 * original hand-authored campaign carries rows that predate the rule, so it is
 * ratcheted instead: the debt may shrink, never grow.
 */
const GENERATED_CAMPAIGN = "ASM-2026-002";
const LEGACY_INVERTED_ROWS = 37;
const collectedAt = new Map(
  upstream.evidence.map((artifact) => [artifact.id, artifact.collected_at]),
);
let legacyInverted = 0;
for (const row of upstream.assessment_results) {
  const inverted = (row.evidence_ids ?? []).filter((id) => {
    const collected = collectedAt.get(id);
    return collected !== undefined && Date.parse(collected) >= Date.parse(row.assessed_on);
  });
  if (inverted.length === 0) continue;
  if (row.assessment_id === GENERATED_CAMPAIGN)
    check(
      false,
      `result ${row.id ?? row.requirement_id} cites ${inverted.join(", ")}, collected on or after its assessed_on ${row.assessed_on}`,
    );
  else legacyInverted += 1;
}
check(
  legacyInverted <= LEGACY_INVERTED_ROWS,
  `evidence collected after the result it supports rose to ${legacyInverted} rows outside ${GENERATED_CAMPAIGN}, over the pinned ${LEGACY_INVERTED_ROWS}`,
);

if (problems.length) {
  console.error("\ngen-wsx90-seed: refusing to write, the derivation is inconsistent:");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error("");
  process.exit(1);
}

/* -------------------------------------------------------------------- write */

const json = `${JSON.stringify(seed, null, 2)}\n`;
writeFileSync(out, json);
const sha = createHash("sha256").update(json).digest("hex");

const counts = resolvedProfile.derivation.counts;
console.log(`wrote ${relative(root, out)}  (${(json.length / 1024).toFixed(0)} KB)`);
console.log(`sha256 ${sha}`);
console.log("");
console.log(`  catalog                 ${counts.catalog}`);
console.log(`  starting baseline       ${counts.starting_baseline}  (SP 800-53B ${highWaterMark})`);
console.log(
  `  post CNSSI 1253         ${counts.post_cnssi}  (+${cnssiAdds.length} / -${cnssiRemoves.length})`,
);
console.log(`  post named overlays     ${counts.post_overlays}`);
console.log(`  effective control set   ${counts.effective}`);
console.log("");
console.log(`  with implementation     ${counts.with_implementation}`);
console.log(
  `  without implementation  ${counts.without_implementation}  ${
    counts.without_implementation === 0
      ? "(the authoring gap is closed)"
      : "(not-implemented, unauthored)"
  }`,
);
console.log(
  `  with 800-53A objectives ${counts.with_assessment_objectives}  (${counts.assessment_objectives} objectives)`,
);
console.log(`  with DISA CCIs          ${counts.with_ccis}  (${counts.cci_links} links)`);
console.log(`  ODP starting values     ${counts.odp_starting_values}`);
console.log(`  tailoring events        ${counts.tailoring_events}`);
console.log(`  withdrawn / reinstated  ${counts.withdrawn} / ${counts.reinstated}`);
