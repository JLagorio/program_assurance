#!/usr/bin/env node
/**
 * Generate the CNSSI 1253 C/I/A allocation table and the four NIST SP 800-53B baselines
 * as first-class application data.
 *
 *   node scripts/gen-cnssi-baselines.mjs
 *
 * Reads (git-ignored reference corpus):
 *   docs/examples/weapons_system_oscal_dummy/raw/nist/NIST_SP-800-53_rev5_catalog.json
 *   docs/examples/weapons_system_oscal_dummy/raw/nist/NIST_SP-800-53_rev5_{LOW,MODERATE,HIGH,PRIVACY}-baseline_profile.json
 *   docs/examples/weapons_system_oscal_dummy/raw/cnssi/extracted_cnssi_1253.json
 *
 * Writes:
 *   src/lib/nist-baselines.ts
 *   src/lib/cnssi-1253.ts
 *
 * Node built-ins only. No npm dependencies.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// The one control-id implementation in the repo. Node strips the types.
import { controlIdFromOscalId, normalizeControlId } from "../src/lib/control-id.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CORPUS = join(ROOT, "docs/examples/weapons_system_oscal_dummy");
const RAW = join(CORPUS, "raw");

const HYDRATE = [
  "The reference corpus is git-ignored. Hydrate it with:",
  "  cd docs/examples/weapons_system_oscal_dummy",
  "  python3 raw/fetch_reference_data.py",
  "  python3 raw/normalize_reference_data.py",
].join("\n");

/** Membership counts published in SP 800-53B. A mismatch means the corpus moved; verify before bumping. */
const EXPECTED_BASELINE_SIZES = { low: 149, moderate: 287, high: 370, privacy: 96 };
/** Rev. 5.2.0 catalog size: 324 base controls + 872 enhancements. */
const EXPECTED_CATALOG_SIZE = 1196;
/** Rows in the third-party CNSSI 1253 (2022) extraction. */
const EXPECTED_CNSSI_ROWS = 1189;

const OBJECTIVES = ["confidentiality", "integrity", "availability"];
const IMPACTS = ["low", "moderate", "high"];

function fail(message) {
  console.error(`\ngen-cnssi-baselines: ${message}\n`);
  process.exit(1);
}

function readJson(absPath) {
  if (!existsSync(absPath)) {
    fail(`missing required source ${relative(ROOT, absPath)}\n\n${HYDRATE}`);
  }
  const bytes = readFileSync(absPath);
  try {
    return {
      json: JSON.parse(bytes.toString("utf8")),
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  } catch (error) {
    return fail(`could not parse ${relative(ROOT, absPath)}: ${error.message}`);
  }
}

/** PDF and OSCAL text carries hard wraps; collapse to one line and treat blank as absent. */
function collapse(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : null;
}

/**
 * ID CONTRACT: the app writes control ids the way a human and DISA do — "AC-2", "AC-2(1)",
 * "SC-7(21)". No zero padding. OSCAL ids are lowercase and dotted ("ac-2.1"); OSCAL "label"
 * props are zero-padded ("AC-02(01)"). Both normalize to the same key, and the one
 * implementation of that rule lives in src/lib/control-id.ts (imported above).
 */
function fromOscalId(oscalId) {
  return controlIdFromOscalId(String(oscalId));
}

// ---------------------------------------------------------------------------- catalog

function loadCatalog() {
  const path = join(RAW, "nist/NIST_SP-800-53_rev5_catalog.json");
  const { json, sha256 } = readJson(path);
  const catalog = json.catalog;
  if (!catalog) fail(`${relative(ROOT, path)} has no "catalog" root — is this the OSCAL catalog?`);

  const controls = [];
  const walk = (control, family, parentId) => {
    const props = control.props ?? [];
    const label = props.find((p) => p.name === "label")?.value;
    const status = props.find((p) => p.name === "status")?.value ?? null;
    if (!label)
      fail(`catalog control ${control.id} has no label prop; cannot apply the id contract`);
    const id = normalizeControlId(label);
    if (id !== fromOscalId(control.id)) {
      fail(
        `id contract broke: OSCAL id ${control.id} -> ${fromOscalId(control.id)} but label ${label} -> ${id}`,
      );
    }
    controls.push({
      id,
      family,
      title: collapse(control.title),
      parentId,
      withdrawn: status === "withdrawn",
    });
    for (const child of control.controls ?? []) walk(child, family, id);
  };
  for (const group of catalog.groups ?? []) {
    for (const control of group.controls ?? []) walk(control, String(group.id).toUpperCase(), null);
  }

  if (controls.length !== EXPECTED_CATALOG_SIZE) {
    fail(`catalog has ${controls.length} controls, expected ${EXPECTED_CATALOG_SIZE}`);
  }
  return {
    sha256,
    version: catalog.metadata?.version ?? null,
    lastModified: catalog.metadata?.["last-modified"] ?? null,
    controls,
    index: new Map(controls.map((c, i) => [c.id, i])),
    byId: new Map(controls.map((c) => [c.id, c])),
  };
}

// ---------------------------------------------------------------------------- 800-53B baselines

const BASELINE_FILES = {
  low: "NIST_SP-800-53_rev5_LOW-baseline_profile.json",
  moderate: "NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
  high: "NIST_SP-800-53_rev5_HIGH-baseline_profile.json",
  privacy: "NIST_SP-800-53_rev5_PRIVACY-baseline_profile.json",
};

const BASELINE_SOURCE_URL = (file) =>
  `https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/${file}`;

function loadBaselines(catalog) {
  const baselines = {};
  for (const [id, file] of Object.entries(BASELINE_FILES)) {
    const path = join(RAW, "nist", file);
    const { json, sha256 } = readJson(path);
    const profile = json.profile;
    if (!profile) fail(`${relative(ROOT, path)} has no "profile" root — is this an OSCAL profile?`);

    const seen = new Set();
    const controlIds = [];
    for (const imported of profile.imports ?? []) {
      for (const include of imported["include-controls"] ?? []) {
        for (const oscalId of include["with-ids"] ?? []) {
          const controlId = fromOscalId(oscalId);
          if (!catalog.byId.has(controlId)) {
            fail(
              `${id} baseline selects ${oscalId} (${controlId}) which is not in the Rev. 5.2.0 catalog`,
            );
          }
          if (seen.has(controlId)) fail(`${id} baseline lists ${controlId} twice`);
          seen.add(controlId);
          controlIds.push(controlId);
        }
      }
    }
    controlIds.sort((a, b) => catalog.index.get(a) - catalog.index.get(b));

    const expected = EXPECTED_BASELINE_SIZES[id];
    if (controlIds.length !== expected) {
      fail(
        `${id} baseline resolved ${controlIds.length} controls, expected ${expected}. ` +
          `If NIST republished 800-53B, update EXPECTED_BASELINE_SIZES in this script deliberately.`,
      );
    }
    baselines[id] = {
      id,
      controlIds,
      uuid: profile.uuid ?? null,
      title: collapse(profile.metadata?.title),
      version: profile.metadata?.version ?? null,
      lastModified: profile.metadata?.["last-modified"] ?? null,
      sha256,
      sourceFile: relative(ROOT, path),
      sourceUrl: BASELINE_SOURCE_URL(file),
    };
  }

  // 800-53B nests the three impact baselines; assert it rather than assume it.
  const inside = (a, b) =>
    baselines[a].controlIds.filter((id) => !baselines[b].controlIds.includes(id));
  const lowGap = inside("low", "moderate");
  const modGap = inside("moderate", "high");
  if (lowGap.length || modGap.length) {
    console.warn(
      `  ! 800-53B nesting broke: low\\moderate=${lowGap.join(",")} moderate\\high=${modGap.join(",")}`,
    );
  }
  return baselines;
}

// ---------------------------------------------------------------------------- CNSSI 1253

/** The two allocation notes the 2022 tables carry outside the impact-level columns. */
const ALLOCATION_NOTES = [
  { kind: "organization-wide", match: (t) => t.startsWith("Deployed organization-wide") },
  {
    kind: "not-allocated",
    match: (t) => t.includes("not allocated to the security control baselines"),
  },
];

function loadCnssi(catalog) {
  const path = join(RAW, "cnssi/extracted_cnssi_1253.json");
  const { json, sha256 } = readJson(path);
  const keys = Object.keys(json);
  if (keys.length !== EXPECTED_CNSSI_ROWS) {
    console.warn(`  ! CNSSI extraction has ${keys.length} rows, expected ${EXPECTED_CNSSI_ROWS}`);
  }

  const rows = [];
  const unresolved = [];
  const nonMonotonic = [];
  const selectedMismatch = [];

  for (const key of keys) {
    const record = json[key];
    const controlId = normalizeControlId(record.control_id ?? key);
    const inCatalog = catalog.byId.has(controlId);
    if (!inCatalog) unresolved.push({ key, controlId });

    const selections = record.selections ?? {};
    const bits = {};
    for (const objective of OBJECTIVES) {
      const column = selections[objective] ?? {};
      const low = column.low === true;
      const moderate = column.moderate === true;
      const high = column.high === true;
      if ((low && !moderate) || (moderate && !high)) {
        nonMonotonic.push({ controlId, objective, low, moderate, high });
      }
      bits[objective] = (low ? 1 : 0) | (moderate ? 2 : 0) | (high ? 4 : 0);
    }

    const specialText = collapse(selections.special_text);
    let allocation = "impact-level";
    if (specialText) {
      const note = ALLOCATION_NOTES.find((n) => n.match(specialText));
      if (!note) fail(`unrecognised CNSSI allocation note on ${controlId}: ${specialText}`);
      allocation = note.kind;
    }

    // The extraction's own "selected" flag should equal (any impact column set) OR organization-wide.
    const derivedSelected =
      bits.confidentiality + bits.integrity + bits.availability > 0 ||
      allocation === "organization-wide";
    if (record.selected !== derivedSelected) {
      selectedMismatch.push({
        controlId,
        extraction: record.selected === true,
        derived: derivedSelected,
      });
    }

    rows.push({
      controlId,
      inCatalog,
      bits,
      allocation,
      allocationNote: specialText,
      withdrawn: record.withdrawn === true,
      parameterValue: collapse(record.parameter_value),
      justification: collapse(record.justification),
      extractedTitle: collapse(record.title),
    });
  }

  rows.sort((a, b) => {
    const ai = catalog.index.get(a.controlId) ?? Number.MAX_SAFE_INTEGER;
    const bi = catalog.index.get(b.controlId) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi || a.controlId.localeCompare(b.controlId);
  });

  return {
    sha256,
    sourceFile: relative(ROOT, path),
    rows,
    unresolved,
    nonMonotonic,
    selectedMismatch,
  };
}

// ---------------------------------------------------------------------------- emit

const HEADER = (title) => `/**
 * ${title}
 *
 * Do not hand-edit — regenerate with: node scripts/gen-cnssi-baselines.mjs
 */
`;

function lit(value) {
  return value === null || value === undefined ? "null" : JSON.stringify(value);
}

function emitBaselines(catalog, baselines) {
  const order = ["low", "moderate", "high", "privacy"];
  const names = { low: "Low", moderate: "Moderate", high: "High", privacy: "Privacy" };

  const definitions = order
    .map((id) => {
      const b = baselines[id];
      const ids = b.controlIds.map((c) => JSON.stringify(c)).join(", ");
      return `  ${id}: {
    id: "${id}",
    name: "${names[id]}",
    oscalUuid: ${lit(b.uuid)},
    title: ${lit(b.title)},
    version: ${lit(b.version)},
    lastModified: ${lit(b.lastModified)},
    controlIds: [${ids}],
  },`;
    })
    .join("\n");

  const provenance = order
    .map((id) => {
      const b = baselines[id];
      return `  ${id}: {
    id: "NIST-800-53B-R5",
    source: ${lit(`NIST SP 800-53B ${id} baseline (OSCAL) — ${b.sourceFile}`)},
    authority: "National Institute of Standards and Technology",
    citation: "NIST SP 800-53B, Control Baselines for Information Systems and Organizations",
    release: ${lit(b.version ?? "unknown")},
    sourceUrl: ${lit(b.sourceUrl)},
    authoritative: true,
    rights: "US Government work — public domain.",
    sha256: ${lit(b.sha256)},
    lastModified: ${lit(b.lastModified ?? undefined)},
  },`;
    })
    .join("\n");

  return `${HEADER("The four NIST SP 800-53B control baselines, as queryable data.")}
/**
 * Source: the NIST OSCAL profiles for SP 800-53B Low / Moderate / High / Privacy, release
 * ${baselines.low.version}. These are authoritative NIST publications (US Government work, public domain).
 *
 * SP 800-53B selects controls from a SINGLE impact level derived by the FIPS 199 high-water
 * mark. National security systems use CNSSI 1253 instead, which categorizes confidentiality,
 * integrity and availability independently — see ./cnssi-1253.
 */

import type { ReferenceProvenance } from "./reference-provenance";

export type NistBaselineId = "low" | "moderate" | "high" | "privacy";

/** The three FIPS 199 impact levels. "privacy" is a separate overlay, not an impact level. */
export type NistBaselineImpact = "low" | "moderate" | "high";

export type NistBaselineDefinition = {
  id: NistBaselineId;
  /** Display name; matches the \`NistBaseline\` union in ./nist-catalog for the three impact baselines. */
  name: string;
  oscalUuid: string | null;
  title: string | null;
  version: string | null;
  lastModified: string | null;
  /** Control ids in catalog order, normalized to the app convention ("AC-2", "AC-2(1)"). */
  controlIds: readonly string[];
};

/**
 * The reference layer's one provenance shape (see ./reference-provenance). Kept
 * under the local name so existing imports still resolve. \`authoritative\` is
 * true here: these profiles are NIST's own OSCAL release.
 */
export type NistBaselineProvenance = ReferenceProvenance;

export const nistBaselineOrder: readonly NistBaselineId[] = ["low", "moderate", "high", "privacy"];

/** The three impact baselines, in ascending order. Excludes the privacy overlay. */
export const nistImpactBaselines: readonly NistBaselineImpact[] = ["low", "moderate", "high"];

export const nistBaselineCatalogVersion = ${lit(catalog.version)};

export const nistBaselines: Record<NistBaselineId, NistBaselineDefinition> = {
${definitions}
};

export const nistBaselineProvenance: Record<NistBaselineId, NistBaselineProvenance> = {
${provenance}
};

const membership: Record<NistBaselineId, ReadonlySet<string>> = {
  low: new Set(nistBaselines.low.controlIds),
  moderate: new Set(nistBaselines.moderate.controlIds),
  high: new Set(nistBaselines.high.controlIds),
  privacy: new Set(nistBaselines.privacy.controlIds),
};

/** Control ids selected by one baseline, in catalog order. */
export function baselineControlIds(baseline: NistBaselineId): readonly string[] {
  return nistBaselines[baseline].controlIds;
}

export function baselineSize(baseline: NistBaselineId): number {
  return nistBaselines[baseline].controlIds.length;
}

export function isInBaseline(controlId: string, baseline: NistBaselineId): boolean {
  return membership[baseline].has(controlId);
}

/** Every baseline that selects a control, in \`nistBaselineOrder\`. Empty means "tailored in only". */
export function baselinesForControl(controlId: string): NistBaselineId[] {
  return nistBaselineOrder.filter((baseline) => membership[baseline].has(controlId));
}

/**
 * SP 800-53B's own selection rule: one impact level in, one control set out. The impact level
 * comes from the FIPS 199 high-water mark across the three security objectives, which is
 * exactly the simplification CNSSI 1253 declines to make.
 */
export function resolveNistBaseline(impact: NistBaselineImpact): readonly string[] {
  return nistBaselines[impact].controlIds;
}

const displayNames: Record<string, NistBaselineId> = {
  low: "low",
  moderate: "moderate",
  high: "high",
  privacy: "privacy",
};

/** Accepts "Low"/"low"/"LOW" so callers can bridge the display-cased union in ./nist-catalog. */
export function nistBaselineIdFromName(name: string): NistBaselineId | null {
  return displayNames[name.trim().toLowerCase()] ?? null;
}
`;
}

function emitCnssi(catalog, cnssi, stats) {
  const FLAG_WITHDRAWN = 1;
  const FLAG_ORG_WIDE = 2;
  const FLAG_NOT_ALLOCATED = 4;

  const rows = cnssi.rows
    .map((row) => {
      const flags =
        (row.withdrawn ? FLAG_WITHDRAWN : 0) |
        (row.allocation === "organization-wide" ? FLAG_ORG_WIDE : 0) |
        (row.allocation === "not-allocated" ? FLAG_NOT_ALLOCATED : 0);
      return `  [${JSON.stringify(row.controlId)}, ${row.bits.confidentiality}, ${row.bits.integrity}, ${row.bits.availability}, ${flags}, ${lit(row.parameterValue)}, ${lit(row.justification)}],`;
    })
    .join("\n");

  const orgNote =
    cnssi.rows.find((r) => r.allocation === "organization-wide")?.allocationNote ?? null;
  const notAllocatedNote =
    cnssi.rows.find((r) => r.allocation === "not-allocated")?.allocationNote ?? null;

  const reconciliation = ["low", "moderate", "high"]
    .map(
      (impact) =>
        `  ${impact}: [${stats.baselineOnly[impact].map((id) => JSON.stringify(id)).join(", ")}],`,
    )
    .join("\n");

  return `${HEADER("CNSSI No. 1253 (2022) security control allocation for national security systems.")}
/**
 * CNSSI 1253 categorizes confidentiality, integrity and availability INDEPENDENTLY. A national
 * security system carries a triple — C:high I:high A:moderate — not one FIPS 199 high-water
 * impact level, and the control set is read per objective and unioned. That is the whole point
 * of the publication, so this table is modelled per objective rather than per impact level.
 *
 * PROVENANCE, honestly stated. The normative publication is CNSSI No. 1253 (2022), a PDF. The
 * data below comes from a THIRD-PARTY EXTRACTION of that PDF obtained from a public mirror; it
 * is NOT an official CNSS machine-readable release, and \`cnssiProvenance.authoritative\` is
 * false for that reason. Treat the PDF as the citation of record and re-verify before using
 * any allocation for an accreditation decision.
 *
 * Two independent checks give confidence the extraction is faithful:
 *   - all ${stats.rowCount} rows resolve to a control in the Rev. ${catalog.version} catalog (${stats.unresolvedCount} orphans);
 *   - its ${stats.withdrawnCount} withdrawn rows are exactly the catalog's ${stats.catalogWithdrawn} withdrawn controls.
 *
 * The extraction's control TITLES are not carried here: ${stats.mangledTitles} of ${stats.rowCount} are truncated or
 * re-hyphenated by the PDF's column layout ("Restricted Access to" for AC-3(1)). Titles come
 * from ./nist-catalog, which carries NIST's own.
 */

import type { ReferenceProvenance } from "./reference-provenance";

export type Impact = "low" | "moderate" | "high";
export type SecurityObjective = "confidentiality" | "integrity" | "availability";

/** A FIPS 199 / CNSSI 1253 categorization: one impact level per security objective. */
export type SecurityCategorization = Record<SecurityObjective, Impact>;

/**
 * Where CNSSI 1253 places a control.
 * - "impact-level": allocated by the C/I/A columns below.
 * - "organization-wide": PM-family controls deployed program-wide, independent of impact level.
 * - "not-allocated": PT-family controls not allocated to the security control baselines.
 */
export type CnssiAllocationKind = "impact-level" | "organization-wide" | "not-allocated";

export type CnssiAllocation = {
  /** App convention: "AC-2", "AC-2(1)". */
  controlId: string;
  /** Per objective, per impact level: does CNSSI select this control in that column? */
  selections: Record<SecurityObjective, Record<Impact, boolean>>;
  /** CNSSI-specified parameter value (an ODP the publication fixes), verbatim. */
  parameterValue: string | null;
  /** CNSSI's stated rationale for the allocation. */
  justification: string | null;
  /** CNSSI selects the control somewhere, or applies it organization-wide. */
  selected: boolean;
  /** Withdrawn in SP 800-53 Rev. 5. Carried, not dropped, so the table stays auditable. */
  withdrawn: boolean;
  allocation: CnssiAllocationKind;
  allocationNote: string | null;
};

/**
 * The reference layer's one provenance shape (see ./reference-provenance). Kept
 * under the local name so existing imports still resolve. \`authoritative\` is
 * FALSE here: this is a third-party PDF extraction, not a CNSS release.
 */
export type CnssiProvenance = ReferenceProvenance;

export const cnssiProvenance: CnssiProvenance = {
  id: "CNSSI-1253-2022-EXTRACT",
  source: ${lit(`CNSSI 1253 (2022) third-party extraction — ${cnssi.sourceFile}`)},
  authority: "Committee on National Security Systems (extraction by a third party)",
  citation: "CNSSI No. 1253, Security Categorization and Control Selection for National Security Systems (2022)",
  release: "2022",
  sourceUrl: "https://raw.githubusercontent.com/securitylevel5/il6-control-catalog/main/cnssi_1253/extracted_cnssi_1253.json",
  authoritative: false,
  rights: "CNSSI 1253 is a US Government publication; the JSON extraction is derived work.",
  normativePublication: "docs/examples/weapons_system_oscal_dummy/raw/cnssi/CNSSI_1253_2022.pdf",
  sha256: ${lit(cnssi.sha256)},
  notes: [
    "Extracted from the published PDF by a third party. It is NOT an official CNSS machine-readable release; re-verify against the PDF before any accreditation decision.",
    "142 of the 1189 extracted titles are corrupted by the PDF column layout and are deliberately dropped; titles come from ./nist-catalog.",
    "CNSSI 1253 (2022) predates Rev. 5.2.0, so 7 catalog controls have no NSS allocation at all — see cnssiControlsWithoutAllocation.",
  ],
};

const OBJECTIVES: readonly SecurityObjective[] = ["confidentiality", "integrity", "availability"];

const ORGANIZATION_WIDE_NOTE = ${lit(orgNote)};
const NOT_ALLOCATED_NOTE = ${lit(notAllocatedNote)};

const FLAG_WITHDRAWN = ${FLAG_WITHDRAWN};
const FLAG_ORGANIZATION_WIDE = ${FLAG_ORG_WIDE};
const FLAG_NOT_ALLOCATED = ${FLAG_NOT_ALLOCATED};

/**
 * Packed row: [controlId, C bits, I bits, A bits, flags, parameterValue, justification].
 * Impact bits are low = 1, moderate = 2, high = 4; flags are the FLAG_* constants above.
 * Packed because the expanded per-objective form is ~4x the bytes for identical information.
 */
type CnssiRow = readonly [string, number, number, number, number, string | null, string | null];

const rows: readonly CnssiRow[] = [
${rows}
];

function decode(bits: number): Record<Impact, boolean> {
  return { low: (bits & 1) !== 0, moderate: (bits & 2) !== 0, high: (bits & 4) !== 0 };
}

function expand(row: CnssiRow): CnssiAllocation {
  const [controlId, c, i, a, flags, parameterValue, justification] = row;
  const allocation: CnssiAllocationKind =
    (flags & FLAG_ORGANIZATION_WIDE) !== 0
      ? "organization-wide"
      : (flags & FLAG_NOT_ALLOCATED) !== 0
        ? "not-allocated"
        : "impact-level";
  return {
    controlId,
    selections: { confidentiality: decode(c), integrity: decode(i), availability: decode(a) },
    parameterValue,
    justification,
    selected: c + i + a > 0 || allocation === "organization-wide",
    withdrawn: (flags & FLAG_WITHDRAWN) !== 0,
    allocation,
    allocationNote:
      allocation === "organization-wide"
        ? ORGANIZATION_WIDE_NOTE
        : allocation === "not-allocated"
          ? NOT_ALLOCATED_NOTE
          : null,
  };
}

/** Every CNSSI 1253 row, in SP 800-53 catalog order. */
export const cnssiAllocations: readonly CnssiAllocation[] = rows.map(expand);

export const cnssiAllocationById: ReadonlyMap<string, CnssiAllocation> = new Map(
  cnssiAllocations.map((allocation) => [allocation.controlId, allocation]),
);

export function cnssiAllocation(controlId: string): CnssiAllocation | null {
  return cnssiAllocationById.get(controlId) ?? null;
}

/** PM-family controls CNSSI applies program-wide regardless of the system's categorization. */
export const cnssiOrganizationWideControlIds: readonly string[] = cnssiAllocations
  .filter((a) => a.allocation === "organization-wide")
  .map((a) => a.controlId);

/** PT-family controls CNSSI does not allocate to the security control baselines at all. */
export const cnssiUnallocatedControlIds: readonly string[] = cnssiAllocations
  .filter((a) => a.allocation === "not-allocated")
  .map((a) => a.controlId);

export const cnssiWithdrawnControlIds: readonly string[] = cnssiAllocations
  .filter((a) => a.withdrawn)
  .map((a) => a.controlId);

/** Does CNSSI select this control in one objective's column at one impact level? */
export function selectsAtImpact(
  allocation: CnssiAllocation,
  objective: SecurityObjective,
  impact: Impact,
): boolean {
  return allocation.selections[objective][impact];
}

/**
 * THE CNSSI 1253 SELECTION RULE.
 *
 * A control is in a system's set when CNSSI selects it for AT LEAST ONE security objective read
 * at THAT OBJECTIVE'S OWN impact level — the UNION across the three objectives, never the
 * maximum. For C:high I:high A:moderate that means: selected for confidentiality at high, OR
 * for integrity at high, OR for availability at moderate.
 *
 * The union is what makes independent categorization mean anything. Collapsing the triple to a
 * single high-water level (the SP 800-53B rule) would pull in availability controls this system
 * does not need, and is not what CNSSI says.
 */
export function selectsForCategorization(
  allocation: CnssiAllocation,
  categorization: SecurityCategorization,
): boolean {
  return OBJECTIVES.some((objective) => allocation.selections[objective][categorization[objective]]);
}

export type CnssiResolveOptions = {
  /** Add the PM controls CNSSI deploys organization-wide. Off by default: they are not impact-driven. */
  includeOrganizationWide?: boolean;
  /**
   * Keep controls withdrawn from Rev. 5. Off by default.
   *
   * INERT AGAINST THIS RELEASE. All ${stats.withdrawnCount} withdrawn rows in the 2022
   * extraction have every selection bit false, so no categorization can select
   * one and turning this on changes nothing. It is a forward guard: a future
   * extraction that marks a withdrawn control selected would otherwise leak it
   * into a resolved set silently. cnssi-1253.test.ts pins the inertness so the
   * option cannot quietly start mattering unnoticed.
   */
  includeWithdrawn?: boolean;
};

/** Control ids CNSSI 1253 selects for a categorization triple, in catalog order. */
export function resolveCnssiControlIds(
  categorization: SecurityCategorization,
  options: CnssiResolveOptions = {},
): string[] {
  const includeOrganizationWide = options.includeOrganizationWide ?? false;
  const includeWithdrawn = options.includeWithdrawn ?? false;
  const selected: string[] = [];
  for (const allocation of cnssiAllocations) {
    if (allocation.withdrawn && !includeWithdrawn) continue;
    const hit =
      selectsForCategorization(allocation, categorization) ||
      (includeOrganizationWide && allocation.allocation === "organization-wide");
    if (hit) selected.push(allocation.controlId);
  }
  return selected;
}

export type CnssiResolution = {
  categorization: SecurityCategorization;
  /** The union across the three objectives. */
  controlIds: string[];
  /** What each objective contributes on its own, before the union. */
  byObjective: Record<SecurityObjective, string[]>;
  organizationWideControlIds: readonly string[];
};

/** \`resolveCnssiControlIds\` plus the per-objective breakdown, so a UI can show why a control is in. */
export function resolveCnssiBaseline(
  categorization: SecurityCategorization,
  options: CnssiResolveOptions = {},
): CnssiResolution {
  const includeWithdrawn = options.includeWithdrawn ?? false;
  const usable = cnssiAllocations.filter((a) => includeWithdrawn || !a.withdrawn);
  const contribution = (objective: SecurityObjective): string[] =>
    usable.filter((a) => a.selections[objective][categorization[objective]]).map((a) => a.controlId);
  return {
    categorization,
    controlIds: resolveCnssiControlIds(categorization, options),
    byObjective: {
      confidentiality: contribution("confidentiality"),
      integrity: contribution("integrity"),
      availability: contribution("availability"),
    },
    organizationWideControlIds: cnssiOrganizationWideControlIds,
  };
}

/**
 * The FIPS 199 high-water mark: the highest of the three objectives. SP 800-53B selects from
 * this single level. Exposed for contrast — CNSSI systems do NOT select this way.
 */
export function highWaterMark(categorization: SecurityCategorization): Impact {
  const order: readonly Impact[] = ["low", "moderate", "high"];
  return OBJECTIVES.reduce<Impact>(
    (worst, objective) =>
      order.indexOf(categorization[objective]) > order.indexOf(worst) ? categorization[objective] : worst,
    "low",
  );
}

/** "H-H-M" — the shorthand a categorization is written in on a system record. */
export function formatCategorization(categorization: SecurityCategorization): string {
  return OBJECTIVES.map((objective) => categorization[objective][0]!.toUpperCase()).join("-");
}

/**
 * Reference numbers observed when this file was generated, so a consumer can assert against
 * them instead of hard-coding a guess.
 */
export const cnssiDatasetStats = {
  rows: ${stats.rowCount},
  resolvedAgainstCatalog: ${stats.resolvedCount},
  unresolved: ${stats.unresolvedCount},
  withdrawn: ${stats.withdrawnCount},
  organizationWide: ${stats.orgWideCount},
  notAllocated: ${stats.notAllocatedCount},
  withParameterValue: ${stats.paramCount},
  withJustification: ${stats.justificationCount},
  catalogVersion: ${lit(catalog.version)},
  catalogControls: ${stats.catalogSize},
} as const;

/** Rows whose control id does not exist in the Rev. 5.2.0 catalog. Surfaced, never dropped. */
export const cnssiUnresolvedControlIds: readonly string[] = [${stats.unresolvedIds.map((id) => JSON.stringify(id)).join(", ")}];

/**
 * Catalog controls the 2022 extraction has no row for — all added to SP 800-53 after CNSSI 1253
 * (2022) went to press. A national security system needs a tailoring decision for each.
 */
export const cnssiControlsWithoutAllocation: readonly string[] = [${stats.catalogWithoutAllocation
    .map((id) => JSON.stringify(id))
    .join(", ")}];

/**
 * Controls SP 800-53B selects at an impact level that CNSSI 1253 does not select for ANY
 * objective at that level. CNSSI is generally a superset (it is an NSS overlay), so a non-empty
 * entry is either a deliberate NSS tailoring or an extraction artifact — confirm against the PDF.
 */
export const cnssiBaselineDivergence: Record<Impact, readonly string[]> = {
${reconciliation}
};
`;
}

// ---------------------------------------------------------------------------- main

function main() {
  const catalog = loadCatalog();
  const baselines = loadBaselines(catalog);
  const cnssi = loadCnssi(catalog);

  const cnssiIds = new Set(cnssi.rows.map((r) => r.controlId));
  const catalogWithoutAllocation = catalog.controls
    .filter((c) => !cnssiIds.has(c.id))
    .map((c) => c.id);
  const catalogWithdrawn = catalog.controls.filter((c) => c.withdrawn).map((c) => c.id);
  const cnssiWithdrawn = cnssi.rows.filter((r) => r.withdrawn).map((r) => r.controlId);
  const withdrawnOnlyInCnssi = cnssiWithdrawn.filter((id) => !catalogWithdrawn.includes(id));
  const withdrawnOnlyInCatalog = catalogWithdrawn.filter(
    (id) => !cnssiIds.has(id) || !cnssiWithdrawn.includes(id),
  );

  const mangledTitles = cnssi.rows.filter((r) => {
    const title = catalog.byId.get(r.controlId)?.title;
    return title && r.extractedTitle && title.toLowerCase() !== r.extractedTitle.toLowerCase();
  }).length;

  // Reconciliation: 800-53B members that CNSSI does not select at the same impact level.
  const baselineOnly = {};
  for (const impact of IMPACTS) {
    const union = new Set(resolveUnion(cnssi.rows, impact));
    baselineOnly[impact] = baselines[impact].controlIds.filter((id) => !union.has(id));
  }

  const stats = {
    rowCount: cnssi.rows.length,
    resolvedCount: cnssi.rows.filter((r) => r.inCatalog).length,
    unresolvedCount: cnssi.unresolved.length,
    unresolvedIds: cnssi.unresolved.map((u) => u.controlId),
    withdrawnCount: cnssiWithdrawn.length,
    orgWideCount: cnssi.rows.filter((r) => r.allocation === "organization-wide").length,
    notAllocatedCount: cnssi.rows.filter((r) => r.allocation === "not-allocated").length,
    paramCount: cnssi.rows.filter((r) => r.parameterValue).length,
    justificationCount: cnssi.rows.filter((r) => r.justification).length,
    catalogSize: catalog.controls.length,
    catalogWithdrawn: catalogWithdrawn.length,
    catalogWithoutAllocation,
    mangledTitles,
    baselineOnly,
  };

  const baselinesPath = join(ROOT, "src/lib/nist-baselines.ts");
  const cnssiPath = join(ROOT, "src/lib/cnssi-1253.ts");
  writeFileSync(baselinesPath, emitBaselines(catalog, baselines));
  writeFileSync(cnssiPath, emitCnssi(catalog, cnssi, stats));

  const kb = (p) => `${(readFileSync(p).length / 1024).toFixed(1)} KB`;
  console.log(
    `catalog ................ ${catalog.controls.length} controls, Rev. ${catalog.version} (${catalogWithdrawn.length} withdrawn)`,
  );
  for (const id of ["low", "moderate", "high", "privacy"]) {
    console.log(`800-53B ${id.padEnd(14)} ${baselines[id].controlIds.length} controls`);
  }
  console.log(`CNSSI 1253 rows ........ ${stats.rowCount}`);
  console.log(
    `  resolve to catalog ... ${stats.resolvedCount}/${stats.rowCount} (${stats.unresolvedCount} unresolved${stats.unresolvedIds.length ? `: ${stats.unresolvedIds.join(", ")}` : ""})`,
  );
  console.log(
    `  withdrawn ............ ${stats.withdrawnCount} (catalog says ${catalogWithdrawn.length}; only-in-CNSSI ${withdrawnOnlyInCnssi.length}, only-in-catalog ${withdrawnOnlyInCatalog.length})`,
  );
  console.log(`  organization-wide .... ${stats.orgWideCount}`);
  console.log(`  not allocated ........ ${stats.notAllocatedCount}`);
  console.log(`  parameter values ..... ${stats.paramCount}`);
  console.log(`  justifications ....... ${stats.justificationCount}`);
  console.log(
    `  truncated titles ..... ${stats.mangledTitles} (dropped; titles come from nist-catalog)`,
  );
  console.log(`  non-monotonic cols ... ${cnssi.nonMonotonic.length}`);
  console.log(`  selected-flag drift .. ${cnssi.selectedMismatch.length}`);
  console.log(
    `catalog w/o allocation . ${catalogWithoutAllocation.length}${catalogWithoutAllocation.length ? `: ${catalogWithoutAllocation.join(", ")}` : ""}`,
  );
  for (const impact of IMPACTS) {
    const union = resolveUnion(cnssi.rows, impact);
    console.log(
      `CNSSI union @ ${impact.padEnd(9)} ${union.length} vs 800-53B ${baselines[impact].controlIds.length}; 800-53B-only: ${baselineOnly[impact].length ? baselineOnly[impact].join(", ") : "none"}`,
    );
  }
  console.log(`wrote ${relative(ROOT, baselinesPath)} (${kb(baselinesPath)})`);
  console.log(`wrote ${relative(ROOT, cnssiPath)} (${kb(cnssiPath)})`);
}

function resolveUnion(rows, impact) {
  const bit = impact === "low" ? 1 : impact === "moderate" ? 2 : 4;
  return rows
    .filter((r) => OBJECTIVES.some((o) => (r.bits[o] & bit) !== 0))
    .map((r) => r.controlId);
}

main();
