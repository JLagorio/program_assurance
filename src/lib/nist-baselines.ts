/**
 * The four NIST SP 800-53B control baselines, as queryable data.
 *
 * Do not hand-edit — regenerate with: node scripts/gen-cnssi-baselines.mjs
 */

/**
 * Source: the NIST OSCAL profiles for SP 800-53B Low / Moderate / High / Privacy, release
 * 5.2.0. These are authoritative NIST publications (US Government work, public domain).
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
  /** Display name; matches the `NistBaseline` union in ./nist-catalog for the three impact baselines. */
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
 * under the local name so existing imports still resolve. `authoritative` is
 * true here: these profiles are NIST's own OSCAL release.
 */
export type NistBaselineProvenance = ReferenceProvenance;

export const nistBaselineOrder: readonly NistBaselineId[] = ["low", "moderate", "high", "privacy"];

/** The three impact baselines, in ascending order. Excludes the privacy overlay. */
export const nistImpactBaselines: readonly NistBaselineImpact[] = ["low", "moderate", "high"];

export const nistBaselineCatalogVersion = "5.2.0";

export const nistBaselines: Record<NistBaselineId, NistBaselineDefinition> = {
  low: {
    id: "low",
    name: "Low",
    oscalUuid: "201765f8-6d45-4941-8789-9eef2effd7d0",
    title: "Electronic (OSCAL) Version of NIST Special Publication 800-53 Revision 5.2.0 LOW IMPACT BASELINE",
    version: "5.2.0",
    lastModified: "2026-05-11T16:10:16.00000-00:00",
    controlIds: ["AC-1", "AC-2", "AC-3", "AC-7", "AC-8", "AC-14", "AC-17", "AC-18", "AC-19", "AC-20", "AC-22", "AT-1", "AT-2", "AT-2(2)", "AT-3", "AT-4", "AU-1", "AU-2", "AU-3", "AU-4", "AU-5", "AU-6", "AU-8", "AU-9", "AU-11", "AU-12", "CA-1", "CA-2", "CA-3", "CA-5", "CA-6", "CA-7", "CA-7(4)", "CA-9", "CM-1", "CM-2", "CM-4", "CM-5", "CM-6", "CM-7", "CM-8", "CM-10", "CM-11", "CP-1", "CP-2", "CP-3", "CP-4", "CP-9", "CP-10", "IA-1", "IA-2", "IA-2(1)", "IA-2(2)", "IA-2(8)", "IA-2(12)", "IA-4", "IA-5", "IA-5(1)", "IA-6", "IA-7", "IA-8", "IA-8(1)", "IA-8(2)", "IA-8(4)", "IA-11", "IR-1", "IR-2", "IR-4", "IR-5", "IR-6", "IR-7", "IR-8", "MA-1", "MA-2", "MA-4", "MA-5", "MP-1", "MP-2", "MP-6", "MP-7", "PE-1", "PE-2", "PE-3", "PE-6", "PE-8", "PE-12", "PE-13", "PE-14", "PE-15", "PE-16", "PL-1", "PL-2", "PL-4", "PL-4(1)", "PL-10", "PL-11", "PS-1", "PS-2", "PS-3", "PS-4", "PS-5", "PS-6", "PS-7", "PS-8", "PS-9", "RA-1", "RA-2", "RA-3", "RA-3(1)", "RA-5", "RA-5(2)", "RA-5(11)", "RA-7", "SA-1", "SA-2", "SA-3", "SA-4", "SA-4(10)", "SA-5", "SA-8", "SA-9", "SA-22", "SC-1", "SC-5", "SC-7", "SC-12", "SC-13", "SC-15", "SC-20", "SC-21", "SC-22", "SC-39", "SI-1", "SI-2", "SI-3", "SI-4", "SI-5", "SI-12", "SR-1", "SR-2", "SR-2(1)", "SR-3", "SR-5", "SR-8", "SR-10", "SR-11", "SR-11(1)", "SR-11(2)", "SR-12"],
  },
  moderate: {
    id: "moderate",
    name: "Moderate",
    oscalUuid: "b07979a6-1b98-42dc-a776-60ee575b061e",
    title: "Electronic (OSCAL) Version of NIST Special Publication 800-53 Revision 5.2.0 MODERATE IMPACT BASELINE",
    version: "5.2.0",
    lastModified: "2026-05-11T16:10:16.00000-00:00",
    controlIds: ["AC-1", "AC-2", "AC-2(1)", "AC-2(2)", "AC-2(3)", "AC-2(4)", "AC-2(5)", "AC-2(13)", "AC-3", "AC-4", "AC-5", "AC-6", "AC-6(1)", "AC-6(2)", "AC-6(5)", "AC-6(7)", "AC-6(9)", "AC-6(10)", "AC-7", "AC-8", "AC-11", "AC-11(1)", "AC-12", "AC-14", "AC-17", "AC-17(1)", "AC-17(2)", "AC-17(3)", "AC-17(4)", "AC-18", "AC-18(1)", "AC-18(3)", "AC-19", "AC-19(5)", "AC-20", "AC-20(1)", "AC-20(2)", "AC-21", "AC-22", "AT-1", "AT-2", "AT-2(2)", "AT-2(3)", "AT-3", "AT-4", "AU-1", "AU-2", "AU-3", "AU-3(1)", "AU-4", "AU-5", "AU-6", "AU-6(1)", "AU-6(3)", "AU-7", "AU-7(1)", "AU-8", "AU-9", "AU-9(4)", "AU-11", "AU-12", "CA-1", "CA-2", "CA-2(1)", "CA-3", "CA-5", "CA-6", "CA-7", "CA-7(1)", "CA-7(4)", "CA-9", "CM-1", "CM-2", "CM-2(2)", "CM-2(3)", "CM-2(7)", "CM-3", "CM-3(2)", "CM-3(4)", "CM-4", "CM-4(2)", "CM-5", "CM-6", "CM-7", "CM-7(1)", "CM-7(2)", "CM-7(5)", "CM-8", "CM-8(1)", "CM-8(3)", "CM-9", "CM-10", "CM-11", "CM-12", "CM-12(1)", "CP-1", "CP-2", "CP-2(1)", "CP-2(3)", "CP-2(8)", "CP-3", "CP-4", "CP-4(1)", "CP-6", "CP-6(1)", "CP-6(3)", "CP-7", "CP-7(1)", "CP-7(2)", "CP-7(3)", "CP-8", "CP-8(1)", "CP-8(2)", "CP-9", "CP-9(1)", "CP-9(8)", "CP-10", "CP-10(2)", "IA-1", "IA-2", "IA-2(1)", "IA-2(2)", "IA-2(8)", "IA-2(12)", "IA-3", "IA-4", "IA-4(4)", "IA-5", "IA-5(1)", "IA-5(2)", "IA-5(6)", "IA-6", "IA-7", "IA-8", "IA-8(1)", "IA-8(2)", "IA-8(4)", "IA-11", "IA-12", "IA-12(2)", "IA-12(3)", "IA-12(5)", "IR-1", "IR-2", "IR-3", "IR-3(2)", "IR-4", "IR-4(1)", "IR-5", "IR-6", "IR-6(1)", "IR-6(3)", "IR-7", "IR-7(1)", "IR-8", "MA-1", "MA-2", "MA-3", "MA-3(1)", "MA-3(2)", "MA-3(3)", "MA-4", "MA-5", "MA-6", "MP-1", "MP-2", "MP-3", "MP-4", "MP-5", "MP-6", "MP-7", "PE-1", "PE-2", "PE-3", "PE-4", "PE-5", "PE-6", "PE-6(1)", "PE-8", "PE-9", "PE-10", "PE-11", "PE-12", "PE-13", "PE-13(1)", "PE-14", "PE-15", "PE-16", "PE-17", "PL-1", "PL-2", "PL-4", "PL-4(1)", "PL-8", "PL-10", "PL-11", "PS-1", "PS-2", "PS-3", "PS-4", "PS-5", "PS-6", "PS-7", "PS-8", "PS-9", "RA-1", "RA-2", "RA-3", "RA-3(1)", "RA-5", "RA-5(2)", "RA-5(5)", "RA-5(11)", "RA-7", "RA-9", "SA-1", "SA-2", "SA-3", "SA-4", "SA-4(1)", "SA-4(2)", "SA-4(9)", "SA-4(10)", "SA-5", "SA-8", "SA-9", "SA-9(2)", "SA-10", "SA-11", "SA-15", "SA-15(3)", "SA-22", "SC-1", "SC-2", "SC-4", "SC-5", "SC-7", "SC-7(3)", "SC-7(4)", "SC-7(5)", "SC-7(7)", "SC-7(8)", "SC-8", "SC-8(1)", "SC-10", "SC-12", "SC-13", "SC-15", "SC-17", "SC-18", "SC-20", "SC-21", "SC-22", "SC-23", "SC-28", "SC-28(1)", "SC-39", "SI-1", "SI-2", "SI-2(2)", "SI-3", "SI-4", "SI-4(2)", "SI-4(4)", "SI-4(5)", "SI-5", "SI-7", "SI-7(1)", "SI-7(7)", "SI-8", "SI-8(2)", "SI-10", "SI-11", "SI-12", "SI-16", "SR-1", "SR-2", "SR-2(1)", "SR-3", "SR-5", "SR-6", "SR-8", "SR-10", "SR-11", "SR-11(1)", "SR-11(2)", "SR-12"],
  },
  high: {
    id: "high",
    name: "High",
    oscalUuid: "b5c9c74d-b24d-4e80-815a-80936528fb6d",
    title: "Electronic (OSCAL) Version of NIST Special Publication 800-53 Revision 5.1.1 HIGH IMPACT BASELINE",
    version: "5.2.0",
    lastModified: "2026-05-11T16:10:16.00000-00:00",
    controlIds: ["AC-1", "AC-2", "AC-2(1)", "AC-2(2)", "AC-2(3)", "AC-2(4)", "AC-2(5)", "AC-2(11)", "AC-2(12)", "AC-2(13)", "AC-3", "AC-4", "AC-4(4)", "AC-5", "AC-6", "AC-6(1)", "AC-6(2)", "AC-6(3)", "AC-6(5)", "AC-6(7)", "AC-6(9)", "AC-6(10)", "AC-7", "AC-8", "AC-10", "AC-11", "AC-11(1)", "AC-12", "AC-14", "AC-17", "AC-17(1)", "AC-17(2)", "AC-17(3)", "AC-17(4)", "AC-18", "AC-18(1)", "AC-18(3)", "AC-18(4)", "AC-18(5)", "AC-19", "AC-19(5)", "AC-20", "AC-20(1)", "AC-20(2)", "AC-21", "AC-22", "AT-1", "AT-2", "AT-2(2)", "AT-2(3)", "AT-3", "AT-4", "AU-1", "AU-2", "AU-3", "AU-3(1)", "AU-4", "AU-5", "AU-5(1)", "AU-5(2)", "AU-6", "AU-6(1)", "AU-6(3)", "AU-6(5)", "AU-6(6)", "AU-7", "AU-7(1)", "AU-8", "AU-9", "AU-9(2)", "AU-9(3)", "AU-9(4)", "AU-10", "AU-11", "AU-12", "AU-12(1)", "AU-12(3)", "CA-1", "CA-2", "CA-2(1)", "CA-2(2)", "CA-3", "CA-3(6)", "CA-5", "CA-6", "CA-7", "CA-7(1)", "CA-7(4)", "CA-8", "CA-8(1)", "CA-9", "CM-1", "CM-2", "CM-2(2)", "CM-2(3)", "CM-2(7)", "CM-3", "CM-3(1)", "CM-3(2)", "CM-3(4)", "CM-3(6)", "CM-4", "CM-4(1)", "CM-4(2)", "CM-5", "CM-5(1)", "CM-6", "CM-6(1)", "CM-6(2)", "CM-7", "CM-7(1)", "CM-7(2)", "CM-7(5)", "CM-8", "CM-8(1)", "CM-8(2)", "CM-8(3)", "CM-8(4)", "CM-9", "CM-10", "CM-11", "CM-12", "CM-12(1)", "CP-1", "CP-2", "CP-2(1)", "CP-2(2)", "CP-2(3)", "CP-2(5)", "CP-2(8)", "CP-3", "CP-3(1)", "CP-4", "CP-4(1)", "CP-4(2)", "CP-6", "CP-6(1)", "CP-6(2)", "CP-6(3)", "CP-7", "CP-7(1)", "CP-7(2)", "CP-7(3)", "CP-7(4)", "CP-8", "CP-8(1)", "CP-8(2)", "CP-8(3)", "CP-8(4)", "CP-9", "CP-9(1)", "CP-9(2)", "CP-9(3)", "CP-9(5)", "CP-9(8)", "CP-10", "CP-10(2)", "CP-10(4)", "IA-1", "IA-2", "IA-2(1)", "IA-2(2)", "IA-2(5)", "IA-2(8)", "IA-2(12)", "IA-3", "IA-4", "IA-4(4)", "IA-5", "IA-5(1)", "IA-5(2)", "IA-5(6)", "IA-6", "IA-7", "IA-8", "IA-8(1)", "IA-8(2)", "IA-8(4)", "IA-11", "IA-12", "IA-12(2)", "IA-12(3)", "IA-12(4)", "IA-12(5)", "IR-1", "IR-2", "IR-2(1)", "IR-2(2)", "IR-3", "IR-3(2)", "IR-4", "IR-4(1)", "IR-4(4)", "IR-4(11)", "IR-5", "IR-5(1)", "IR-6", "IR-6(1)", "IR-6(3)", "IR-7", "IR-7(1)", "IR-8", "MA-1", "MA-2", "MA-2(2)", "MA-3", "MA-3(1)", "MA-3(2)", "MA-3(3)", "MA-4", "MA-4(3)", "MA-5", "MA-5(1)", "MA-6", "MP-1", "MP-2", "MP-3", "MP-4", "MP-5", "MP-6", "MP-6(1)", "MP-6(2)", "MP-6(3)", "MP-7", "PE-1", "PE-2", "PE-3", "PE-3(1)", "PE-4", "PE-5", "PE-6", "PE-6(1)", "PE-6(4)", "PE-8", "PE-8(1)", "PE-9", "PE-10", "PE-11", "PE-11(1)", "PE-12", "PE-13", "PE-13(1)", "PE-13(2)", "PE-14", "PE-15", "PE-15(1)", "PE-16", "PE-17", "PE-18", "PL-1", "PL-2", "PL-4", "PL-4(1)", "PL-8", "PL-10", "PL-11", "PS-1", "PS-2", "PS-3", "PS-4", "PS-4(2)", "PS-5", "PS-6", "PS-7", "PS-8", "PS-9", "RA-1", "RA-2", "RA-3", "RA-3(1)", "RA-5", "RA-5(2)", "RA-5(4)", "RA-5(5)", "RA-5(11)", "RA-7", "RA-9", "SA-1", "SA-2", "SA-3", "SA-4", "SA-4(1)", "SA-4(2)", "SA-4(5)", "SA-4(9)", "SA-4(10)", "SA-5", "SA-8", "SA-9", "SA-9(2)", "SA-10", "SA-11", "SA-15", "SA-15(3)", "SA-16", "SA-17", "SA-21", "SA-22", "SC-1", "SC-2", "SC-3", "SC-4", "SC-5", "SC-7", "SC-7(3)", "SC-7(4)", "SC-7(5)", "SC-7(7)", "SC-7(8)", "SC-7(18)", "SC-7(21)", "SC-8", "SC-8(1)", "SC-10", "SC-12", "SC-12(1)", "SC-13", "SC-15", "SC-17", "SC-18", "SC-20", "SC-21", "SC-22", "SC-23", "SC-24", "SC-28", "SC-28(1)", "SC-39", "SI-1", "SI-2", "SI-2(2)", "SI-3", "SI-4", "SI-4(2)", "SI-4(4)", "SI-4(5)", "SI-4(10)", "SI-4(12)", "SI-4(14)", "SI-4(20)", "SI-4(22)", "SI-5", "SI-5(1)", "SI-6", "SI-7", "SI-7(1)", "SI-7(2)", "SI-7(5)", "SI-7(7)", "SI-7(15)", "SI-8", "SI-8(2)", "SI-10", "SI-11", "SI-12", "SI-16", "SR-1", "SR-2", "SR-2(1)", "SR-3", "SR-5", "SR-6", "SR-8", "SR-9", "SR-9(1)", "SR-10", "SR-11", "SR-11(1)", "SR-11(2)", "SR-12"],
  },
  privacy: {
    id: "privacy",
    name: "Privacy",
    oscalUuid: "fed9f8ca-dcc2-492c-8a13-f9d979973e24",
    title: "Electronic (OSCAL) Version of NIST Special Publication 800-53 Revision 5.2.0 PRIVACY BASELINE",
    version: "5.2.0",
    lastModified: "2026-05-11T16:10:16.00000-00:00",
    controlIds: ["AC-1", "AC-3(14)", "AT-1", "AT-2", "AT-3", "AT-3(5)", "AT-4", "AU-1", "AU-2", "AU-3(3)", "AU-11", "CA-1", "CA-2", "CA-5", "CA-6", "CA-7", "CA-7(4)", "CM-1", "CM-4", "IR-1", "IR-2", "IR-2(3)", "IR-3", "IR-4", "IR-5", "IR-6", "IR-7", "IR-8", "IR-8(1)", "MP-1", "MP-6", "PE-8(3)", "PL-1", "PL-2", "PL-4", "PL-4(1)", "PL-8", "PL-9", "PM-3", "PM-4", "PM-5(1)", "PM-6", "PM-7", "PM-8", "PM-9", "PM-10", "PM-11", "PM-13", "PM-14", "PM-17", "PM-18", "PM-19", "PM-20", "PM-20(1)", "PM-21", "PM-22", "PM-24", "PM-25", "PM-26", "PM-27", "PM-28", "PM-31", "PS-6", "PT-1", "PT-2", "PT-3", "PT-4", "PT-5", "PT-5(2)", "PT-6", "PT-6(1)", "PT-6(2)", "PT-7", "PT-7(1)", "PT-7(2)", "PT-8", "RA-1", "RA-3", "RA-7", "RA-8", "SA-1", "SA-2", "SA-3", "SA-4", "SA-8(33)", "SA-9", "SA-11", "SC-7(24)", "SI-1", "SI-12", "SI-12(1)", "SI-12(2)", "SI-12(3)", "SI-18", "SI-18(4)", "SI-19"],
  },
};

export const nistBaselineProvenance: Record<NistBaselineId, NistBaselineProvenance> = {
  low: {
    id: "NIST-800-53B-R5",
    source: "NIST SP 800-53B low baseline (OSCAL) — docs/examples/weapons_system_oscal_dummy/raw/nist/NIST_SP-800-53_rev5_LOW-baseline_profile.json",
    authority: "National Institute of Standards and Technology",
    citation: "NIST SP 800-53B, Control Baselines for Information Systems and Organizations",
    release: "5.2.0",
    sourceUrl: "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_LOW-baseline_profile.json",
    authoritative: true,
    rights: "US Government work — public domain.",
    sha256: "8fd206017c8d718b44bdef612c2ff321a9fd84d97a515c8ec33c4619accbef6e",
    lastModified: "2026-05-11T16:10:16.00000-00:00",
  },
  moderate: {
    id: "NIST-800-53B-R5",
    source: "NIST SP 800-53B moderate baseline (OSCAL) — docs/examples/weapons_system_oscal_dummy/raw/nist/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
    authority: "National Institute of Standards and Technology",
    citation: "NIST SP 800-53B, Control Baselines for Information Systems and Organizations",
    release: "5.2.0",
    sourceUrl: "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
    authoritative: true,
    rights: "US Government work — public domain.",
    sha256: "9030dbf1f13169947eb97eb101b4bd2f00d3c151b100455a923ac75803f00ea1",
    lastModified: "2026-05-11T16:10:16.00000-00:00",
  },
  high: {
    id: "NIST-800-53B-R5",
    source: "NIST SP 800-53B high baseline (OSCAL) — docs/examples/weapons_system_oscal_dummy/raw/nist/NIST_SP-800-53_rev5_HIGH-baseline_profile.json",
    authority: "National Institute of Standards and Technology",
    citation: "NIST SP 800-53B, Control Baselines for Information Systems and Organizations",
    release: "5.2.0",
    sourceUrl: "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_HIGH-baseline_profile.json",
    authoritative: true,
    rights: "US Government work — public domain.",
    sha256: "60576970caef91b2cba56d46e5948b72e3b879434fc2a4840bc4179e5e75cfd7",
    lastModified: "2026-05-11T16:10:16.00000-00:00",
  },
  privacy: {
    id: "NIST-800-53B-R5",
    source: "NIST SP 800-53B privacy baseline (OSCAL) — docs/examples/weapons_system_oscal_dummy/raw/nist/NIST_SP-800-53_rev5_PRIVACY-baseline_profile.json",
    authority: "National Institute of Standards and Technology",
    citation: "NIST SP 800-53B, Control Baselines for Information Systems and Organizations",
    release: "5.2.0",
    sourceUrl: "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_PRIVACY-baseline_profile.json",
    authoritative: true,
    rights: "US Government work — public domain.",
    sha256: "7e650c4397ad633eadeaf510baa523372849b1fa3e18207b6c6b70ed456224f9",
    lastModified: "2026-05-11T16:10:16.00000-00:00",
  },
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

/** Every baseline that selects a control, in `nistBaselineOrder`. Empty means "tailored in only". */
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
