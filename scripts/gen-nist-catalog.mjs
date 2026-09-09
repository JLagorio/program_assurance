#!/usr/bin/env node
/**
 * Generate the NIST SP 800-53 Rev. 5 / SP 800-53A Rev. 5 catalog layer.
 *
 *   node scripts/gen-nist-catalog.mjs
 *
 * Reads the authoritative OSCAL sources directly (no python-derived
 * intermediates, so app generation is self-contained):
 *
 *   docs/examples/weapons_system_oscal_dummy/raw/nist/NIST_SP-800-53_rev5_catalog.json
 *   docs/examples/weapons_system_oscal_dummy/raw/nist/NIST_SP-800-53_rev5_{LOW,MODERATE,HIGH,PRIVACY}-baseline_profile.json
 *
 * Writes:
 *
 *   src/lib/nist-catalog.ts                index of all 1196 controls + enhancements (prose-free)
 *   src/lib/nist-control-text/<fam>.ts     one chunk per family, full 800-53 + 800-53A text
 *   src/lib/nist-control-text/registry.ts  per-family lazy loaders
 *   src/lib/nist-control-text.ts           facade preserving the historic `controlText` export
 *
 * NIST publications are US Government works in the public domain.
 *
 * Node built-ins only. No npm dependencies.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The one control-id implementation in the repo. Node strips the types.
import { controlIdFromOscalId } from "../src/lib/control-id.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const RAW = join(ROOT, "docs/examples/weapons_system_oscal_dummy/raw/nist");
const OUT_LIB = join(ROOT, "src/lib");
const OUT_CHUNKS = join(OUT_LIB, "nist-control-text");

const CATALOG_FILE = join(RAW, "NIST_SP-800-53_rev5_catalog.json");
const PROFILES = [
  ["Low", join(RAW, "NIST_SP-800-53_rev5_LOW-baseline_profile.json")],
  ["Moderate", join(RAW, "NIST_SP-800-53_rev5_MODERATE-baseline_profile.json")],
  ["High", join(RAW, "NIST_SP-800-53_rev5_HIGH-baseline_profile.json")],
  ["Privacy", join(RAW, "NIST_SP-800-53_rev5_PRIVACY-baseline_profile.json")],
];

/** Baseline bit positions — the order they appear in `NistBaseline`. */
const BASELINE_BITS = { Low: 1, Moderate: 2, High: 4, Privacy: 8 };

// ---------------------------------------------------------------------------
// Loud failure when the corpus is absent
// ---------------------------------------------------------------------------

const HOW_TO_FETCH = `
The authoritative OSCAL corpus is missing (it lives in a git-ignored directory).
Hydrate it, then re-run this generator:

  mkdir -p docs/examples/weapons_system_oscal_dummy/raw/nist
  cd docs/examples/weapons_system_oscal_dummy/raw/nist
  curl -LO https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json
  curl -LO https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_LOW-baseline_profile.json
  curl -LO https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json
  curl -LO https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_HIGH-baseline_profile.json
  curl -LO https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_PRIVACY-baseline_profile.json

  cd docs/examples/weapons_system_oscal_dummy && python3 raw/normalize_reference_data.py   # optional: the derived flat files
`;

function die(message) {
  console.error(`\ngen-nist-catalog: ${message}\n${HOW_TO_FETCH}`);
  process.exit(1);
}

function readJson(file, label) {
  if (!existsSync(file)) die(`${label} not found at ${file}`);
  const bytes = statSync(file).size;
  if (bytes === 0) die(`${label} at ${file} is empty`);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    die(`${label} at ${file} is not valid JSON: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// OSCAL helpers
// ---------------------------------------------------------------------------

/** Every `label` prop, optionally filtered by its `class`. */
function labelProp(node, cls) {
  for (const p of node.props ?? []) {
    if (p.name !== "label") continue;
    if (cls === undefined ? p.class === undefined : p.class === cls) return p.value;
  }
  return null;
}

/**
 * OSCAL id -> the id a human (and DISA) writes: "ac-2" -> "AC-2",
 * "ac-2.1" -> "AC-2(1)", "sc-7.21" -> "SC-7(21)". No zero padding.
 * One implementation, in src/lib/control-id.ts.
 */
const humanId = controlIdFromOscalId;

function* walkControls(control, parent = null) {
  yield [control, parent];
  for (const sub of control.controls ?? []) yield* walkControls(sub, control);
}

function partsNamed(node, name) {
  return (node.parts ?? []).filter((p) => p.name === name);
}

// ---------------------------------------------------------------------------
// Parameter rendering — "{{ insert: param, ac-02_odp.01 }}" -> "[Assignment: ...]"
// ---------------------------------------------------------------------------

const INSERT = /\{\{\s*insert:\s*param,\s*([^}\s]+)\s*\}\}/g;

/** Built once over the whole catalog: OSCAL param ids are globally unique. */
const paramById = new Map();

function renderParam(param, seen) {
  if (param.select) {
    const how = param.select["how-many"];
    const qualifier = how === "one-or-more" ? " (one or more)" : how === "one" ? " (one)" : "";
    const choices = (param.select.choice ?? []).map((c) => resolveInserts(c, seen).trim());
    return `[Selection${qualifier}: ${choices.join("; ")}]`;
  }
  const label = param.label ?? "parameter";
  const body = label.startsWith("organization-defined") ? label : `organization-defined ${label}`;
  return `[Assignment: ${body}]`;
}

/**
 * OSCAL prose is authored around the insert tokens, so it carries stray spacing
 * once they are substituted: "{{ insert: param, x }} ; and" -> "[Assignment: ...] ; and",
 * and the reference markup arrives as "( [PE](#pe) )". Tidy it back to the way
 * the publication reads. Newlines are left alone; paragraphs are split first.
 */
function tidy(text) {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\(([ \t]+)/g, "(")
    .replace(/[ \t]+([)\],;.:!?])/g, "$1")
    .trim();
}

/** Replace every `{{ insert: param, X }}` with X's rendered placeholder. */
function resolveInserts(text, seen = new Set()) {
  if (typeof text !== "string" || !text.includes("{{")) return text ?? "";
  return text.replace(INSERT, (whole, id) => {
    if (seen.has(id)) return whole; // cyclic reference: leave the token alone
    const param = paramById.get(id);
    if (!param) {
      unresolvedInserts.push(id);
      return whole;
    }
    const next = new Set(seen);
    next.add(id);
    return renderParam(param, next);
  });
}

const unresolvedInserts = [];

// ---------------------------------------------------------------------------
// Control text extraction
// ---------------------------------------------------------------------------

/** Statement items, recursively. `label` is omitted when OSCAL carries none. */
function statementItems(part) {
  const items = partsNamed(part, "item");
  return items.map((item) => {
    const out = {};
    const label = labelProp(item);
    if (label) out.label = label;
    out.prose = tidy(resolveInserts(item.prose ?? ""));
    const kids = statementItems(item);
    if (kids.length) out.items = kids;
    return out;
  });
}

/**
 * The statement part itself carries no label, so its own prose (when it has
 * one) is a lead-in paragraph ahead of the lettered items rather than a parent
 * of them: "Disable accounts within [...] when the accounts:" then (a)...(d).
 */
function extractStatement(control) {
  const stmt = partsNamed(control, "statement")[0];
  if (!stmt) return [];
  const out = [];
  const prose = tidy(resolveInserts(stmt.prose ?? ""));
  if (prose) out.push({ prose });
  out.push(...statementItems(stmt));
  return out;
}

function extractDiscussion(control) {
  const gdn = partsNamed(control, "guidance")[0];
  if (!gdn?.prose) return [];
  return gdn.prose
    .split(/\n\n+/)
    .map((p) => tidy(resolveInserts(p)))
    .filter((p) => p.length > 0);
}

function extractParams(control) {
  return (control.params ?? []).map((p) => {
    const out = {
      // The SP 800-53A label ("AC-02_ODP[01]") when NIST publishes one, else the
      // OSCAL id upper-cased ("AC-1_PRM_1" for the aggregate 800-53 parameters).
      id: labelProp(p, "sp800-53a") ?? p.id.toUpperCase(),
      kind: p.select ? "Selection" : "Assignment",
      value: renderParam(p, new Set([p.id])),
    };
    const guideline = tidy(
      (p.guidelines ?? [])
        .map((g) => tidy(resolveInserts(g.prose ?? "")))
        .filter(Boolean)
        .join(" ")
        .replace(/\s*;\s*$/, ""),
    );
    if (guideline) out.guideline = guideline;
    return out;
  });
}

/**
 * SP 800-53A Rev. 5 assessment objectives, recursively.
 *
 * The historic generator only kept objectives that had nested sub-items, which
 * silently dropped every control whose objective is a single flat statement
 * (AC-3, AC-4, AC-6, AC-2(1), ... — 149 of the 377 controls it shipped). The
 * outermost part is a container in OSCAL, so it is unwrapped when it HAS
 * children AND carries no prose of its own, and kept as the objective itself
 * otherwise. The prose test matters: seven control-level containers (CA-7(4),
 * CM-7(7), PE-11(2), PM-24, PM-31, SA-24, SI-2(7)) carry BOTH prose and
 * children, and unwrapping those on the child test alone deleted a real
 * SP 800-53A Rev. 5 objective. Nothing is ever dropped with prose on it.
 */
function objectiveNode(part) {
  const out = {
    // The SP 800-53A part id ("ac-2_obj.a-1"). It is what the WS-X90 seed and any
    // OSCAL assessment result cite, so it is the join key back into this text.
    id: part.id,
    label: labelProp(part, "sp800-53a") ?? labelProp(part) ?? "",
    prose: tidy(resolveInserts(part.prose ?? "")),
  };
  const kids = partsNamed(part, "assessment-objective").map(objectiveNode);
  if (kids.length) out.items = kids;
  return out;
}

let unwrappedContainers = 0;

function extractObjectives(control) {
  const tops = partsNamed(control, "assessment-objective");
  const out = [];
  for (const top of tops) {
    const kids = partsNamed(top, "assessment-objective");
    const prose = tidy(resolveInserts(top.prose ?? ""));
    if (kids.length && !prose) {
      unwrappedContainers += 1;
      for (const kid of kids) out.push(objectiveNode(kid));
    } else {
      out.push(objectiveNode(top));
    }
  }
  return out;
}

const METHOD_NAMES = { EXAMINE: "Examine", INTERVIEW: "Interview", TEST: "Test" };

function extractMethods(control) {
  return partsNamed(control, "assessment-method").map((part) => {
    const raw = (part.props ?? []).find((p) => p.name === "method")?.value ?? "";
    const method = METHOD_NAMES[raw.toUpperCase()] ?? "Examine";
    const objects = [];
    for (const objs of partsNamed(part, "assessment-objects")) {
      for (const line of (objs.prose ?? "").split(/\n\n+/)) {
        const t = tidy(resolveInserts(line));
        if (t) objects.push(t);
      }
    }
    return { method, objects };
  });
}

function extractReferences(control, resources) {
  const out = [];
  for (const link of control.links ?? []) {
    if (link.rel !== "reference") continue;
    const res = resources.get(link.href.replace(/^#/, ""));
    if (!res) continue;
    const ref = { title: res.title ?? link.href };
    const href = (res.rlinks ?? [])[0]?.href;
    if (href) ref.url = href;
    out.push(ref);
  }
  return out;
}

const droppedLinks = [];

/**
 * Resolve a control link to the ids a consumer can act on.
 *
 * Three upstream shapes, all real:
 *   "#ac-2"        a control
 *   "#ac-2_smt.k"  statement item k of AC-2 — coarsened to the control, which is
 *                  the granularity NistControl carries (AC-2(10) is the one case)
 *   "#sr"          a whole family — SA-12's only incorporated-into link. Returned
 *                  as the family id "SR" so the one withdrawn control with a
 *                  disposition does not silently end up with none.
 * Anything else is recorded and fails the build rather than being dropped.
 */
function linkTargets(control, rel) {
  const out = [];
  const seen = new Set();
  for (const link of control.links ?? []) {
    if (link.rel !== rel) continue;
    const target = link.href.replace(/^#/, "").split("_")[0];
    const id =
      humanId(target) ?? (familyIds.has(target.toUpperCase()) ? target.toUpperCase() : null);
    if (!id) {
      droppedLinks.push(`${labelProp(control) ?? control.id} ${rel} -> ${link.href}`);
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Read the corpus
// ---------------------------------------------------------------------------

const catalogSha256 = existsSync(CATALOG_FILE)
  ? createHash("sha256").update(readFileSync(CATALOG_FILE)).digest("hex")
  : "";
const catalogDoc = readJson(CATALOG_FILE, "SP 800-53 Rev. 5 OSCAL catalog");
const catalog = catalogDoc.catalog;
if (!catalog?.groups?.length)
  die(`${CATALOG_FILE} has no catalog.groups — is it the OSCAL catalog?`);

const meta = catalog.metadata ?? {};
const catalogVersion = `NIST SP 800-53 Rev. 5 (${meta.version ?? "unknown"})`;
const lastModified = (meta["last-modified"] ?? "").slice(0, 10);

const resources = new Map((catalog["back-matter"]?.resources ?? []).map((r) => [r.uuid, r]));

/** Ordered [group, control, parentControl] for every control and enhancement. */
const rows = [];
for (const group of catalog.groups) {
  for (const control of group.controls ?? []) {
    for (const [ctl, parent] of walkControls(control)) rows.push([group, ctl, parent]);
  }
}

for (const [, ctl] of rows) {
  for (const p of ctl.params ?? []) {
    if (paramById.has(p.id)) die(`duplicate OSCAL parameter id ${p.id}`);
    paramById.set(p.id, p);
  }
}

// Baseline membership, straight from the four SP 800-53B OSCAL profiles.
const baselineMask = new Map();
const baselineCounts = {};
for (const [name, file] of PROFILES) {
  const profile = readJson(file, `SP 800-53B ${name} baseline profile`).profile;
  const ids = [];
  for (const imp of profile?.imports ?? []) {
    for (const inc of imp["include-controls"] ?? []) ids.push(...(inc["with-ids"] ?? []));
  }
  if (!ids.length) die(`${file} selected no controls — is it an OSCAL profile?`);
  baselineCounts[name] = ids.length;
  for (const oscalId of ids) {
    const id = humanId(oscalId);
    if (!id) die(`baseline ${name} names an id this generator cannot normalize: ${oscalId}`);
    baselineMask.set(id, (baselineMask.get(id) ?? 0) | BASELINE_BITS[name]);
  }
}

// ---------------------------------------------------------------------------
// Build the index rows and the per-family text
// ---------------------------------------------------------------------------

const families = catalog.groups.map((g) => ({
  id: (labelProp(g) ?? g.id).toUpperCase(),
  name: g.title,
  key: g.id.toLowerCase(),
}));

const familyIds = new Set(families.map((f) => f.id));

const index = [];
const textByFamily = new Map(families.map((f) => [f.id, []]));
const withdrawnIds = [];
const incorporatedInto = [];
const movedTo = [];
let objectiveNodes = 0;
let methodCount = 0;
let objectCount = 0;
let paramCount = 0;
const objectivesUpstream = new Map();
const objectiveProseUpstream = new Map();

function countNodes(list) {
  let n = 0;
  for (const o of list) {
    n += 1;
    if (o.items) n += countNodes(o.items);
  }
  return n;
}

function upstreamObjectiveParts(control) {
  let n = 0;
  const visit = (part) => {
    n += 1;
    for (const kid of partsNamed(part, "assessment-objective")) visit(kid);
  };
  for (const top of partsNamed(control, "assessment-objective")) visit(top);
  return n;
}

/** Every non-empty objective prose upstream, so the emit can be proved lossless. */
function upstreamObjectiveProse(control) {
  const out = [];
  const visit = (part) => {
    const p = tidy(resolveInserts(part.prose ?? ""));
    if (p) out.push(p);
    for (const kid of partsNamed(part, "assessment-objective")) visit(kid);
  };
  for (const top of partsNamed(control, "assessment-objective")) visit(top);
  return out;
}

function emittedObjectiveProse(list, out = []) {
  for (const o of list) {
    if (o.prose) out.push(o.prose);
    if (o.items) emittedObjectiveProse(o.items, out);
  }
  return out;
}

for (const [group, control, parent] of rows) {
  const famId = (labelProp(group) ?? group.id).toUpperCase();
  const id = labelProp(control) ?? humanId(control.id);
  if (!id) die(`control ${control.id} carries no plain label prop and cannot be normalized`);
  if (humanId(control.id) !== id) {
    die(
      `control ${control.id} label "${id}" disagrees with the id convention "${humanId(control.id)}"`,
    );
  }
  const parentId = parent ? (labelProp(parent) ?? humanId(parent.id)) : null;

  const withdrawn = (control.props ?? []).some(
    (p) => p.name === "status" && p.value === "withdrawn",
  );
  if (withdrawn) withdrawnIds.push(id);
  const into = linkTargets(control, "incorporated-into");
  const moved = linkTargets(control, "moved-to");
  if (into.length) incorporatedInto.push([id, into]);
  if (moved.length) movedTo.push([id, moved]);

  index.push({
    id,
    family: famId,
    title: control.title,
    parent: parentId,
    mask: baselineMask.get(id) ?? 0,
  });

  const text = {
    statement: extractStatement(control),
    discussion: extractDiscussion(control),
    params: extractParams(control),
    related: linkTargets(control, "related"),
    objectives: extractObjectives(control),
    methods: extractMethods(control),
    references: extractReferences(control, resources),
  };
  objectiveNodes += countNodes(text.objectives);
  methodCount += text.methods.length;
  objectCount += text.methods.reduce((n, m) => n + m.objects.length, 0);
  paramCount += text.params.length;
  objectivesUpstream.set(id, upstreamObjectiveParts(control));
  objectiveProseUpstream.set(id, upstreamObjectiveProse(control));

  textByFamily.get(famId).push([id, text]);
}

// ---------------------------------------------------------------------------
// Assertions — a wrong catalog is worse than no catalog
// ---------------------------------------------------------------------------

const problems = [];
if (index.length !== 1196) problems.push(`expected 1196 controls, built ${index.length}`);
if (families.length !== 20) problems.push(`expected 20 families, found ${families.length}`);
if (droppedLinks.length) {
  problems.push(
    `${droppedLinks.length} control links resolve to nothing: ${droppedLinks.slice(0, 5).join(", ")}`,
  );
}
if (unresolvedInserts.length) {
  problems.push(
    `${unresolvedInserts.length} unresolved parameter inserts, e.g. ${unresolvedInserts.slice(0, 5).join(", ")}`,
  );
}
{
  const seen = new Set();
  for (const row of index) {
    if (seen.has(row.id)) problems.push(`duplicate control id ${row.id}`);
    seen.add(row.id);
  }
  for (const row of index) {
    if (row.parent && !seen.has(row.parent))
      problems.push(`${row.id} names an unknown parent ${row.parent}`);
  }
  for (const id of baselineMask.keys()) {
    if (!seen.has(id)) problems.push(`baselines select ${id}, which is not in the catalog`);
  }
}
for (const [name, bit] of Object.entries(BASELINE_BITS)) {
  const n = index.filter((r) => (r.mask & bit) !== 0).length;
  if (n !== baselineCounts[name]) {
    problems.push(
      `${name} baseline: profile lists ${baselineCounts[name]} controls, index has ${n}`,
    );
  }
}
// The bug this generator exists to fix: nothing that has objectives upstream may report zero.
{
  const byId = new Map();
  for (const [famId, entries] of textByFamily) {
    void famId;
    for (const [id, text] of entries) byId.set(id, text);
  }
  const dropped = [];
  for (const [id, upstream] of objectivesUpstream) {
    if (upstream > 0 && byId.get(id).objectives.length === 0) dropped.push(id);
  }
  if (dropped.length) {
    problems.push(
      `${dropped.length} controls have objectives upstream but none in the output: ${dropped.slice(0, 10).join(", ")}`,
    );
  }
  // Losslessness, not just presence: every non-empty objective prose upstream must
  // survive the unwrap. This is what the child-only unwrap rule used to violate.
  const proseLosses = [];
  for (const [id, upstream] of objectiveProseUpstream) {
    const emitted = new Set(emittedObjectiveProse(byId.get(id).objectives));
    const missing = upstream.filter((p) => !emitted.has(p));
    if (missing.length)
      proseLosses.push(
        `${id} (${missing.length}, e.g. ${JSON.stringify(missing[0].slice(0, 60))})`,
      );
  }
  if (proseLosses.length) {
    problems.push(
      `${proseLosses.length} controls lose assessment-objective prose: ${proseLosses.slice(0, 8).join("; ")}`,
    );
  }
  for (const id of [
    "AC-3",
    "AC-4",
    "AC-6",
    "AC-2(1)",
    "CA-7(4)",
    "CM-7(7)",
    "PE-11(2)",
    "PM-24",
    "PM-31",
  ]) {
    if (!byId.get(id)?.objectives.length)
      problems.push(`${id} must have at least one assessment objective`);
  }
  const ac2 = byId.get("AC-2");
  if (ac2.params.length !== 10)
    problems.push(`AC-2 should have 10 parameters, has ${ac2.params.length}`);
  const discussionChars = ac2.discussion.join(" ").length;
  if (discussionChars !== 2946)
    problems.push(`AC-2 discussion should be 2946 chars joined, is ${discussionChars}`);
}
if (problems.length) {
  console.error("\ngen-nist-catalog: refusing to write — the catalog did not validate:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

const REGEN = "Do not hand-edit — regenerate with: node scripts/gen-nist-catalog.mjs";
const PROVENANCE = [
  ` * Generated from the NIST OSCAL release of SP 800-53 Rev. 5 (catalog version`,
  ` * ${meta.version ?? "unknown"}, ${lastModified}, OSCAL ${meta["oscal-version"] ?? "?"}) and the SP 800-53B Low /`,
  ` * Moderate / High / Privacy baseline profiles.`,
  ` * NIST publications are US Government works in the public domain.`,
].join("\n");

mkdirSync(OUT_CHUNKS, { recursive: true });

// --- src/lib/nist-catalog.ts ----------------------------------------------

const catalogLines = [];
catalogLines.push(`/**
 * The real NIST SP 800-53 Rev. 5 control catalog — index.
 *
 * Every control and enhancement in the catalog (${index.length} rows, ${families.length} families), with no
 * prose: this module is imported statically all over the app, so the statements,
 * discussion and SP 800-53A objectives live in the per-family chunks under
 * \`./nist-control-text/\` and are fetched on demand.
 *
${PROVENANCE}
 *
 * ${REGEN}
 */

import type { ReferenceProvenance } from "./reference-provenance";

export type NistBaseline = "Low" | "Moderate" | "High" | "Privacy";

export type NistControl = {
  /** Natural key as a human writes it: "AC-2", "AC-2(3)". */
  id: string;
  family: string;
  /** Rev. 5 title, verbatim. Enhancements carry only their own half. */
  title: string;
  /** Base control an enhancement extends, or null. */
  parent: string | null;
  parentTitle: string | null;
  /** SP 800-53B baselines that select this control. Empty = tailored in by an overlay. */
  baselines: NistBaseline[];
  /** Withdrawn in Rev. 5. Absent on the ${index.length - withdrawnIds.length} active controls. */
  withdrawn?: true;
  /**
   * For a withdrawn control, the controls its requirement was folded into.
   * Two upstream shapes are coarsened here: a statement-level target
   * ("#ac-2_smt.k" on AC-2(10)) becomes its control, and a family-level target
   * ("#sr" on SA-12) becomes the two-letter family id "SR".
   */
  incorporatedInto?: string[];
  /** For a withdrawn control, the control it was renumbered to. */
  movedTo?: string[];
};

export type NistStatementItem = { label?: string; prose: string; items?: NistStatementItem[] };
export type NistParameter = { id: string; kind: "Assignment" | "Selection"; value: string; guideline?: string };
/**
 * One SP 800-53A Rev. 5 assessment objective. \`id\` is the OSCAL part id
 * ("ac-2_obj.a-1"), which is what an assessment result cites.
 */
export type NistObjective = { id: string; label: string; prose: string; items?: NistObjective[] };
export type NistMethod = { method: "Examine" | "Interview" | "Test"; objects: string[] };
export type NistReference = { title: string; url?: string };

/** Everything SP 800-53 and 800-53A say about one control. */
export type NistControlText = {
  statement: NistStatementItem[];
  discussion: string[];
  params: NistParameter[];
  related: string[];
  objectives: NistObjective[];
  methods: NistMethod[];
  references: NistReference[];
};

export const catalogVersion = ${JSON.stringify(catalogVersion)};

/**
 * Where this module's content comes from, machine-readable.
 *
 * One OSCAL file carries both publications: the statement, discussion and
 * parameters on \`NistControlText\` are SP 800-53 Rev. 5, and its objectives and
 * assessment methods are SP 800-53A Rev. 5. Both are NIST's own release, so both
 * are authoritative; they are separate records because a screen that cites an
 * assessment objective must cite 800-53A, not 800-53.
 */
export const nistCatalogProvenance: ReferenceProvenance = {
  id: "NIST-800-53-R5",
  source: "NIST SP 800-53 Rev. 5 (OSCAL) ${meta.version ?? "unknown"}",
  authority: "National Institute of Standards and Technology",
  citation: "NIST SP 800-53 Rev. 5, Security and Privacy Controls for Information Systems and Organizations",
  release: ${JSON.stringify(meta.version ?? "unknown")},
  sourceUrl:
    "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json",
  authoritative: true,
  rights: "NIST publications are US Government works in the public domain.",
  sha256: ${JSON.stringify(catalogSha256)},
  lastModified: ${JSON.stringify(lastModified)},
  notes: [
    "OSCAL ${meta["oscal-version"] ?? "?"}. The same file carries the SP 800-53A Rev. 5 assessment procedures.",
    "Control ids are stored in the human/DISA convention — AC-2(1) — never zero padded; see src/lib/control-id.ts.",
  ],
};

/** The SP 800-53A Rev. 5 half of the same OSCAL release: objectives and methods. */
export const nistAssessmentProvenance: ReferenceProvenance = {
  ...nistCatalogProvenance,
  id: "NIST-800-53A-R5",
  source: "NIST SP 800-53A Rev. 5 assessment procedures (OSCAL) ${meta.version ?? "unknown"}",
  citation: "NIST SP 800-53A Rev. 5, Assessing Security and Privacy Controls in Information Systems and Organizations",
  notes: [
    "Published inside the SP 800-53 Rev. 5 OSCAL catalog as assessment-objective, assessment-method and assessment-objects parts.",
    "NistObjective.id is the OSCAL part id, which is what an assessment result cites.",
  ],
};

/**
 * Per-record provenance without ${index.length} copies of one object: every row in
 * this module comes from the OSCAL release above. Null for an id the catalog
 * does not have, so a caller cannot accidentally attribute a foreign id to NIST.
 */
export function controlProvenance(id: string): ReferenceProvenance | null {
  return nistControlById.has(id) ? nistCatalogProvenance : null;
}

/** Provenance for a control's SP 800-53A objectives and methods. */
export function objectiveProvenance(id: string): ReferenceProvenance | null {
  return nistControlById.has(id) ? nistAssessmentProvenance : null;
}

export const nistFamilies: { id: string; name: string }[] = ${JSON.stringify(
  families.map((f) => ({ id: f.id, name: f.name })),
)};

export const nistFamilyName = new Map(nistFamilies.map((f) => [f.id, f.name]));
`);

catalogLines.push(`
/**
 * One row per control: [id, title, parent id or null, baseline bitmask].
 * The mask is Low 1 | Moderate 2 | High 4 | Privacy 8 — the array form is
 * rebuilt below so \`nistControls\` keeps the shape every consumer expects.
 */
type CatalogRow = [id: string, title: string, parent: string | null, baselines: number];

const catalogRows: CatalogRow[] = [`);
for (const row of index) {
  catalogLines.push(
    `  [${JSON.stringify(row.id)},${JSON.stringify(row.title)},${row.parent ? JSON.stringify(row.parent) : "null"},${row.mask}],`,
  );
}
catalogLines.push(`];

/** Withdrawn in Rev. 5 — kept in the index so historic references still resolve. */
const withdrawn = new Set<string>(${JSON.stringify(withdrawnIds.join(" "))}.split(" "));

const incorporatedInto = new Map<string, string[]>(${JSON.stringify(incorporatedInto)});
const movedTo = new Map<string, string[]>(${JSON.stringify(movedTo)});

const baselineNames: NistBaseline[] = ["Low", "Moderate", "High", "Privacy"];
const baselinesByMask = new Map<number, NistBaseline[]>();

function baselinesFor(mask: number): NistBaseline[] {
  let hit = baselinesByMask.get(mask);
  if (!hit) {
    hit = baselineNames.filter((_, i) => (mask & (1 << i)) !== 0);
    Object.freeze(hit);
    baselinesByMask.set(mask, hit);
  }
  return hit;
}

const titleByIdRaw = new Map(catalogRows.map((r) => [r[0], r[1]]));

export const nistControls: NistControl[] = catalogRows.map(([id, title, parent, mask]) => {
  const row: NistControl = {
    id,
    family: id.slice(0, id.indexOf("-")),
    title,
    parent,
    parentTitle: parent ? (titleByIdRaw.get(parent) ?? null) : null,
    baselines: baselinesFor(mask),
  };
  if (withdrawn.has(id)) row.withdrawn = true;
  const into = incorporatedInto.get(id);
  if (into) row.incorporatedInto = into;
  const moved = movedTo.get(id);
  if (moved) row.movedTo = moved;
  return row;
});

export const nistControlById = new Map(nistControls.map((c) => [c.id, c]));

const baselineCache = new Map<NistBaseline, NistControl[]>();

/** The SP 800-53B baseline for an impact level, in catalog order. */
export function baselineControls(level: NistBaseline): NistControl[] {
  const hit = baselineCache.get(level);
  if (hit) return hit;
  const rows = nistControls.filter((c) => c.baselines.includes(level));
  baselineCache.set(level, rows);
  return rows;
}

/** "Account Management | Disable Accounts" — how a control reads in an RMF tool. */
export function controlTitle(c: NistControl): string {
  return c.parentTitle ? \`\${c.parentTitle} | \${c.title}\` : c.title;
}

/** Title for a bare id, falling back to the id itself. */
export function titleOf(id: string): string {
  const c = nistControlById.get(id);
  return c ? controlTitle(c) : id;
}
`);

writeFileSync(join(OUT_LIB, "nist-catalog.ts"), catalogLines.join("\n"));

// --- src/lib/nist-control-text/<family>.ts ---------------------------------

for (const fam of families) {
  const entries = textByFamily.get(fam.id);
  const lines = [
    `/**`,
    ` * SP 800-53 Rev. 5 control text and SP 800-53A Rev. 5 assessment procedures`,
    ` * for the ${fam.id} (${fam.name}) family — ${entries.length} controls and enhancements.`,
    ` *`,
    ` * One chunk per family so a screen can fetch only what it renders. Load it`,
    ` * through \`./registry\`, or the whole catalog through \`../nist-control-text\`.`,
    ` *`,
    PROVENANCE,
    ` *`,
    ` * ${REGEN}`,
    ` */`,
    ``,
    `import type { NistControlText } from "../nist-catalog";`,
    ``,
    `export const controlText: Record<string, NistControlText> = {`,
  ];
  for (const [id, text] of entries) lines.push(`${JSON.stringify(id)}: ${JSON.stringify(text)},`);
  lines.push(`};`, ``);
  writeFileSync(join(OUT_CHUNKS, `${fam.key}.ts`), lines.join("\n"));
}

// --- src/lib/nist-control-text/registry.ts ---------------------------------

const registry = `/**
 * Per-family lazy access to the SP 800-53 / 800-53A control text.
 *
 * This is the module to import when a screen needs one family or one control:
 * each family is its own chunk, so \`loadControlText("AC-2")\` fetches AC and
 * nothing else. Importing \`../nist-control-text\` instead materialises all
 * ${families.length} families, which is what the SCTM, ConMon and baseline screens want.
 *
${PROVENANCE}
 *
 * ${REGEN}
 */

import type { NistControlText } from "../nist-catalog";
import type { ReferenceFamilyLoader } from "../reference-provenance";

type Chunk = { controlText: Record<string, NistControlText> };

const chunks: Record<string, () => Promise<Chunk>> = {
${families.map((f) => `  ${f.id}: () => import("./${f.key}"),`).join("\n")}
};

/** The 20 SP 800-53 Rev. 5 family ids, in catalog order. */
export const controlTextFamilies: string[] = Object.keys(chunks);

const cache = new Map<string, Promise<Record<string, NistControlText>>>();

/** "AC", "ac", or any control id in the family ("AC-2(3)") -> "AC". */
function familyKey(value: string): string {
  const head = value.split("-", 1)[0] ?? value;
  return head.trim().toUpperCase();
}

/** True when \`family\` names one of the 20 SP 800-53 families. */
export function isControlTextFamily(family: string): boolean {
  return familyKey(family) in chunks;
}

/**
 * The control text for one family, fetched once and cached.
 * Throws on a family the catalog does not have — that is a programming error,
 * not a miss; use \`isControlTextFamily\` first when the value is user input.
 */
export function loadControlFamily(family: string): Promise<Record<string, NistControlText>> {
  const key = familyKey(family);
  const load = chunks[key];
  if (!load) {
    return Promise.reject(
      new Error(\`Unknown SP 800-53 family "\${family}" — expected one of \${controlTextFamilies.join(", ")}\`),
    );
  }
  let hit = cache.get(key);
  if (!hit) {
    hit = load().then((m) => m.controlText);
    cache.set(key, hit);
  }
  return hit;
}

/** One control's text, fetching only that control's family. Null when unknown. */
export async function loadControlText(id: string): Promise<NistControlText | null> {
  const key = familyKey(id);
  if (!(key in chunks)) return null;
  const family = await loadControlFamily(key);
  return family[id] ?? null;
}

/** Every family, in parallel, merged into one index. */
export async function loadAllControlText(): Promise<Record<string, NistControlText>> {
  const families = await Promise.all(controlTextFamilies.map((f) => loadControlFamily(f)));
  return Object.assign({}, ...families) as Record<string, NistControlText>;
}

/**
 * The same four calls under the reference layer's shared names, so a screen can
 * treat this and the DISA CCI definitions (\`cciDefinitionLoader\` in
 * ./cci-catalog) as one kind of thing.
 */
export const controlTextLoader: ReferenceFamilyLoader<NistControlText> = {
  families: controlTextFamilies,
  isFamily: isControlTextFamily,
  loadFamily: loadControlFamily,
  loadAll: loadAllControlText,
};
`;
writeFileSync(join(OUT_CHUNKS, "registry.ts"), registry);

// --- src/lib/nist-control-text.ts (facade) ---------------------------------

const facade = `/**
 * SP 800-53 Rev. 5 control statements, discussion, parameters and
 * SP 800-53A Rev. 5 assessment objectives, methods and objects, keyed by
 * control id — the whole catalog, ${index.length} controls and enhancements.
 *
 * Large: import it dynamically (a route loader) so it never lands in the
 * initial bundle. The text is split into ${families.length} per-family chunks under
 * \`./nist-control-text/\`; this facade pulls all of them and merges, which is
 * what a screen wanting the entire catalog (SCTM, ConMon, baseline) needs.
 *
 * A screen that needs ONE family or ONE control must import
 * \`./nist-control-text/registry\` instead — importing this module materialises
 * every family, so \`loadControlText\` re-exported here is a convenience, not a
 * saving.
 *
${PROVENANCE}
 *
 * ${REGEN}
 */

import type { NistControlText } from "./nist-catalog";
${families.map((f) => `import { controlText as ${f.key} } from "./nist-control-text/${f.key}";`).join("\n")}

export {
  controlTextFamilies,
  controlTextLoader,
  isControlTextFamily,
  loadAllControlText,
  loadControlFamily,
  loadControlText,
} from "./nist-control-text/registry";

/** The whole catalog. The ${families.length} family chunks load in parallel and merge here. */
export const controlText: Record<string, NistControlText> = Object.assign(
  {},
${families.map((f) => `  ${f.key},`).join("\n")}
);
`;
writeFileSync(join(OUT_LIB, "nist-control-text.ts"), facade);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const bytes = (file) => statSync(file).size;
const chunkBytes = families.reduce((n, f) => n + bytes(join(OUT_CHUNKS, `${f.key}.ts`)), 0);

console.log(
  `gen-nist-catalog — ${catalogVersion}, OSCAL ${meta["oscal-version"]}, ${lastModified}`,
);
console.log(
  `  controls+enhancements   ${index.length}  (${index.length - withdrawnIds.length} active, ${withdrawnIds.length} withdrawn)`,
);
console.log(`  families                ${families.length}`);
console.log(`  parameters              ${paramCount}`);
console.log(
  `  objective nodes         ${objectiveNodes}  (${objectiveNodes + unwrappedContainers} OSCAL parts, less ${unwrappedContainers} unwrapped control-level containers)`,
);
console.log(`  assessment methods      ${methodCount}   objects ${objectCount}`);
console.log(
  `  baselines               ` +
    Object.entries(BASELINE_BITS)
      .map(([n, b]) => `${n} ${index.filter((r) => (r.mask & b) !== 0).length}`)
      .join("  "),
);
console.log(
  `  src/lib/nist-catalog.ts        ${(bytes(join(OUT_LIB, "nist-catalog.ts")) / 1024).toFixed(1)} KB`,
);
console.log(
  `  src/lib/nist-control-text/*.ts ${(chunkBytes / 1024 / 1024).toFixed(2)} MB across ${families.length} chunks`,
);
console.log(
  `  largest chunk                  ` +
    families
      .map((f) => [f.key, bytes(join(OUT_CHUNKS, `${f.key}.ts`))])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, b]) => `${k} ${(b / 1024).toFixed(0)} KB`)
      .join(", "),
);
