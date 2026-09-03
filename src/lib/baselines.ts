/**
 * Chunk 13 of the CCI spine — configuration baselines and change invalidation.
 *
 * A determination is only ever true *of a configuration*. "AC-11 is satisfied"
 * is not a fact about the system, it is a fact about the system as it was
 * pinned when the assessor looked. This module holds the pin (`BLD-`), the
 * proposal to move it (`CHG-`), and the machinery that works out what stops
 * being true when it moves (`INV-`).
 *
 * Invariants held here:
 *  - **CM-3(2) is a gate, not a formality.** A change whose recorded security
 *    impact analysis says "None" or "Administrative" invalidates NOTHING. It
 *    still produces an audit record, because the reason forty rows did not turn
 *    amber is exactly as accountable as the reason they would have. A naive
 *    implementation cascades every change it is handed; that is how a
 *    configuration management tool trains its users to ignore it.
 *  - **The cascade is asymmetric, and the direction is doctrine.** Descending
 *    the composition tree yields `Invalidated`: a part contained in a component
 *    that changed is no longer the part that was assessed. Ascending yields
 *    `Suspect`: a container that holds a changed part may well still meet its
 *    own controls, and saying otherwise would make a package bump invalidate the
 *    whole system. Never the reverse.
 *  - **Ascent stops carrying signal at a whole-system allocation.** Every
 *    ancestor chain ends at the authorization boundary, and the SCTM allocates
 *    physical, personnel and media protection — and every family with no
 *    node-level rule — to that boundary and nothing else. "Something inside the
 *    boundary moved" is therefore true of every change, so a row reached ONLY by
 *    ascent onto a whole-system allocation is left Current. It is still reached
 *    by a change seeded on the boundary, by an ODP change, by a provider
 *    re-assessment, or over a critical edge — `TouchedNode.ascentOnly` is what
 *    tells those apart. Both consumers apply the same gate: a currency the
 *    matrix and the impact ledger disagree about is worse than a noisy one.
 *  - **A cascade is bounded by the build lifecycle, not just by the analysis.**
 *    CM-2 says the authorized baseline is the configuration in force. A change
 *    the CCB has already absorbed into it cannot invalidate a determination
 *    taken after that approval, and a change staged in a candidate build has not
 *    reached the operating system at all, so it flags determinations rather than
 *    withdrawing them. Only a change filed against the authorized baseline after
 *    its approval retracts a claim outright. See `postureOf`.
 *  - **An unrecorded pin movement is a finding, not a diff row.** `buildDiff`
 *    is mechanical; `unrecordedChanges` is the CM-3 assertion on top of it. A
 *    pin that moved between the authorized baseline and the candidate with no
 *    change record against it was never proposed, never analysed and never
 *    approved, and the product says so.
 *  - **`reopenCandidates` is a queue, never a mutation.** A finding closed
 *    against a configuration that no longer exists has not been proven closed
 *    against the one that does — but re-opening it is the assessor's decision,
 *    not this module's.
 *  - **Acknowledgement does not fabricate evidence.** `acknowledgeChange` is the
 *    operator saying "I re-ran it"; it removes the change from the live overlay
 *    and changes nothing else.
 *  - Nothing here reads a clock. Every date is a seed string compared through
 *    `parseGateDate`, so the server and client renders agree.
 *
 * Layering with `sctm.ts`: the SCTM needs the currency overlay to render a row as
 * struck through, and the impact analysis needs real SCTM rows to name what it
 * invalidates. Those are opposite directions, so they are opposite layers rather
 * than a cycle. `rowCurrency` and `nodeImpact` live HERE, below the matrix: they
 * are computed from the composition graph and the change log alone and never
 * build one. Everything that does build one lives in `@/lib/change-impact`, one
 * layer above the SCTM, and suppresses the overlay through
 * `withoutCurrencyOverlay` while it is building. Nothing in this file imports
 * `@/lib/sctm`, and that is the property to preserve.
 */

import { useSyncExternalStore } from "react";

import type { Tone } from "@ledger/design-system";
import {
  ancestorsOf,
  descendantsOf,
  edgesTo,
  nodeById,
  subscribeGraph,
  type CompositionEdge,
} from "@/lib/composition";
import { findings } from "@/lib/findings";
import { resolveInheritance } from "@/lib/inheritance";
import { parseGateDate } from "@/lib/program-stage";
import type { VerificationMethod } from "@/lib/spine";
import { testRuns } from "@/lib/test-execution";

/* ── Types ───────────────────────────────────────────────────────────────── */

/** NIST SP 800-53 CM-2 configuration states. */
export type BuildState = "Draft" | "Under test" | "Authorized baseline" | "Superseded";

/** One node pinned to a version and, where it has one, a digest. */
export type ComponentPin = {
  node: string; // CN-
  version: string;
  digest: string | null;
  partNumber: string | null;
};

/** An organization-defined parameter value in force. */
export type ParameterPin = { control: string; parameter: string; value: string };

export type Build = {
  id: string; // BLD-
  name: string;
  program: string; // PRG-
  state: BuildState;
  /** "MMM DD, YYYY", "—" while Draft. */
  approved: string;
  /** The change control board / approving authority. */
  ccb: string;
  supersedes: string | null;
  pins: ComponentPin[];
  parameters: ParameterPin[];
  note: string;
};

/** NIST SP 800-53 CM-3 change kinds. */
export type ChangeKind =
  | "Firmware version"
  | "Board revision"
  | "Container digest"
  | "Software version"
  | "Control parameter"
  | "Supplier"
  | "Composition"
  | "Provider assessment";

/** CM-3(2) security impact analysis. THE GATE — only "Significant" invalidates. */
export type SecurityImpact = "None" | "Administrative" | "Significant";

export type ChangeRecord = {
  id: string; // CHG-
  program: string; // PRG-
  build: string; // BLD- the change is proposed against
  kind: ChangeKind;
  /** CN- for node-scoped kinds; "—" for Control parameter and Provider assessment. */
  node: string;
  /** Control natural key for "Control parameter"; CMP- for "Provider assessment". */
  subject: string;
  from: string;
  to: string;
  requested: string; // "MMM DD, YYYY"
  requestedBy: string;
  approvedBy: string;
  impact: SecurityImpact;
  /** The ISSE's written security impact analysis. Recorded whether or not it invalidates. */
  analysis: string;
  acknowledged: boolean;
};

export type ImpactState = "Invalidated" | "Suspect";

export type TouchedNode = {
  node: string;
  state: ImpactState;
  hops: number;
  reason: string;
  /**
   * True while the ONLY thing that reached this node is containment ascent —
   * it holds something that moved, and nothing more. A node the change seeds,
   * descends into, or reaches over a critical edge is never ascent-only.
   *
   * Provenance is a property of the paths that landed, not of the last one to
   * land: ascent (stage 3) runs before the blast radius (stage 4), so a single
   * label would tag an ancestor that is ALSO reached over a critical edge as
   * ascent-only and silence a real signal. `put` therefore only ever clears
   * the flag.
   */
  ascentOnly: boolean;
};

export type RetestItem = {
  control: string;
  requirement: string;
  node: string;
  method: VerificationMethod;
  reason: string;
  /** TP- that can execute it, when one exists. */
  procedure: string | null;
};

export type ChangeImpact = {
  change: string; // CHG-
  /** True when the CM-3(2) gate stopped it. */
  contained: boolean;
  touched: TouchedNode[];
  /** SctmRow.key values whose determination is invalidated. */
  invalidatedRows: string[];
  /** SctmRow.key values downgraded to Suspect. */
  suspectRows: string[];
  invalidatedEvidence: string[]; // EVD-
  /** FND- whose closure was proven on a configuration that no longer exists. */
  reopenCandidates: string[];
  /** `${program}|${component}|${control}` inheritance references invalidated. */
  invalidatedInheritance: string[];
  retests: RetestItem[];
  /**
   * One line per state transition, for the audit trail.
   *
   * `to` is the row's CURRENCY — the axis this module computes. `toDetermination`
   * is the DETERMINATION the matrix actually ends up carrying, and `outcome` is
   * the one-phrase reading of the pair. Both are carried as data because the
   * rule is doctrine: `buildSctm` withdraws a positive claim and refuses to
   * withdraw a deficiency, and a view that re-derived that branch for itself
   * would eventually print the opposite of what the matrix holds.
   */
  records: {
    id: string;
    scope: string;
    ref: string;
    from: string;
    to: string;
    why: string;
    /** The determination in force after the overlay. Absent on non-row records. */
    toDetermination?: string;
    /** What happened to the determination, in one phrase. */
    outcome?: string;
  }[];
};

/**
 * One pin that moved between two builds.
 *
 * `label` is not in the mechanical pin record and is carried alongside it
 * because a parameter delta has no `CN-` to name: an ODP is a property of the
 * requirement, not of a component, so `node` reads "—" and the row would
 * otherwise render with nothing to identify it.
 */
export type PinDelta = {
  node: string; // CN-, or "—" for a parameter delta
  label: string;
  kind: ChangeKind;
  from: string;
  to: string;
  /** CHG- proposed against this movement, or null — an unrecorded change. */
  recorded: string | null;
};

/* ── Tones ───────────────────────────────────────────────────────────────── */

export const buildStateTone: Record<BuildState, Tone> = {
  Draft: "neutral",
  "Under test": "warning",
  "Authorized baseline": "success",
  Superseded: "neutral",
};

/**
 * "Significant" is caution, not danger: it triggers invalidation but it is not
 * itself a failure. A program that never records a significant change is not a
 * healthy program, it is one that is not doing impact analysis.
 */
export const securityImpactTone: Record<SecurityImpact, Tone> = {
  None: "neutral",
  Administrative: "neutral",
  Significant: "warning",
};

/** A change kind is a property of the change, never a status. All neutral. */
export const changeKindTone: Record<ChangeKind, Tone> = {
  "Firmware version": "neutral",
  "Board revision": "neutral",
  "Container digest": "neutral",
  "Software version": "neutral",
  "Control parameter": "neutral",
  Supplier: "neutral",
  Composition: "neutral",
  "Provider assessment": "neutral",
};

export const impactStateTone: Record<ImpactState, Tone> = {
  Invalidated: "danger",
  Suspect: "warning",
};

/* ── Baselines ───────────────────────────────────────────────────────────── */

/**
 * PRG-1041 carries one authorized baseline and one release candidate under
 * test. Every node in the composition graph is pinned in both, because a
 * baseline that pins only the interesting parts cannot prove that the rest did
 * not move — and the whole value of `buildDiff` is that the answer is
 * mechanical rather than remembered.
 */
export const builds: Build[] = [
  {
    id: "BLD-0007",
    name: "Atlas ground segment 4.7.2",
    program: "PRG-1041",
    state: "Authorized baseline",
    approved: "Jul 18, 2026",
    ccb: "Atlas Configuration Control Board (chair: Marcus Hale, ISSM)",
    supersedes: null,
    pins: [
      { node: "CN-0001", version: "—", digest: null, partNumber: null },
      { node: "CN-0100", version: "—", digest: null, partNumber: null },
      { node: "CN-0110", version: "—", digest: null, partNumber: "R760-CHS" },
      { node: "CN-0111", version: "Rev A03", digest: null, partNumber: "R760-MB" },
      {
        node: "CN-0112",
        version: "2.14.1",
        digest: "sha256:857e881b911b2b73d19a271d43e6547423a4670f411db0c1a79031926dbccbcf",
        partNumber: null,
      },
      { node: "CN-0116", version: "Rev B1", digest: null, partNumber: "BCM57414-OCP3" },
      {
        node: "CN-0117",
        version: "7.10.50.10",
        digest: "sha256:f7dda7db68e981b3da0822d5cefb848d9f9083e4e1862053e3b6c90991b96013",
        partNumber: null,
      },
      { node: "CN-0113", version: "5.14.0-427.28.1.el9_4", digest: null, partNumber: null },
      { node: "CN-0114", version: "8.7p1-38.el9", digest: null, partNumber: null },
      { node: "CN-0115", version: "3.0.7-104.el9", digest: null, partNumber: null },
      { node: "CN-0118", version: "3.0.7-27.el9", digest: null, partNumber: null },
      { node: "CN-0120", version: "—", digest: null, partNumber: "R760-CHS" },
      { node: "CN-0121", version: "Rev A03", digest: null, partNumber: "R760-MB" },
      {
        node: "CN-0123",
        version: "2.14.1",
        digest: "sha256:857e881b911b2b73d19a271d43e6547423a4670f411db0c1a79031926dbccbcf",
        partNumber: null,
      },
      { node: "CN-0122", version: "5.14.0-427.28.1.el9_4", digest: null, partNumber: null },
      { node: "CN-0124", version: "8.7p1-38.el9", digest: null, partNumber: null },
      { node: "CN-0130", version: "—", digest: null, partNumber: "R660-CHS" },
      { node: "CN-0133", version: "Rev A01", digest: null, partNumber: "R660-MB" },
      { node: "CN-0131", version: "5.14.0-427.28.1.el9_4", digest: null, partNumber: null },
      { node: "CN-0132", version: "15.6-1PGDG.rhel9", digest: null, partNumber: null },
      { node: "CN-0200", version: "—", digest: null, partNumber: null },
      {
        node: "CN-0210",
        version: "2.14.0",
        digest: "sha256:72591e579afd0f029ac0caff912107bdd9f180a675405ae2f8a787e6fe4670f1",
        partNumber: null,
      },
      {
        node: "CN-0211",
        version: "22.04.4 LTS",
        digest: "sha256:29ad08166aade176aae4510e54ec815a2ce7efbb9110379326573e82452a2a2e",
        partNumber: null,
      },
      { node: "CN-0212", version: "3.0.11-1ubuntu2", digest: null, partNumber: null },
      { node: "CN-0213", version: "v1.8.0", digest: null, partNumber: null },
      { node: "CN-0214", version: "v2.0.19", digest: null, partNumber: null },
      { node: "CN-0215", version: "2.14.0", digest: null, partNumber: null },
      { node: "CN-0220", version: "24.0.5", digest: null, partNumber: null },
      { node: "CN-0221", version: "24.0.5", digest: null, partNumber: null },
      { node: "CN-0222", version: "21.0.3+9", digest: null, partNumber: null },
      { node: "CN-0223", version: "1.0.2.4", digest: null, partNumber: null },
      { node: "CN-0300", version: "—", digest: null, partNumber: null },
      { node: "CN-0310", version: "—", digest: null, partNumber: "C9300-24T-A" },
      { node: "CN-0311", version: "Rev B2", digest: null, partNumber: "C9300-24T rev B2" },
      { node: "CN-0312", version: "Rev A2", digest: null, partNumber: "88E6390-A2-TFJ2C000" },
      {
        node: "CN-0313",
        version: "17.9.4a",
        digest: "sha256:29516ec5e274216e7fd22fec9dfe3f63a6892a0bf7d286dcd249003ce1387dcf",
        partNumber: null,
      },
      {
        node: "CN-0314",
        version: "17.9.1r",
        digest: "sha256:d5d8d1c5f2596340f5991076229cc22ce627c428e21987a377a7ea2431117624",
        partNumber: null,
      },
    ],
    parameters: [
      {
        control: "AC-11",
        parameter: "Session lock time period of user inactivity",
        value: "30 minutes",
      },
      {
        control: "AC-7",
        parameter: "Consecutive invalid logon attempts and the time window they are counted over",
        value: "3 attempts in 15 minutes, account locked until released by an administrator",
      },
      {
        control: "IA-5(1)",
        parameter: "Minimum password length and composition for local emergency accounts",
        value: "15 characters, no dictionary word, no reuse of the previous 24",
      },
      {
        control: "AU-11",
        parameter: "Audit record retention period",
        value: "90 days online in the enclave sink, 3 years in the S3 Glacier archive",
      },
      {
        control: "SC-10",
        parameter: "Network disconnect time period of inactivity",
        value: "10 minutes on the management plane, 30 minutes on the mission API",
      },
      {
        control: "SI-2",
        parameter: "Flaw remediation time period from release of the update",
        value: "CAT I within 7 days, CAT II within 30 days, CAT III within 90 days",
      },
    ],
    note: "Baselined at the Jul 18 CCB after the 4.7.2 regression campaign closed. This is the configuration every determination in the current SAR was taken against, and the one the ATO package will name.",
  },
  {
    id: "BLD-0009",
    name: "Atlas ground segment 4.8.0-rc1",
    program: "PRG-1041",
    state: "Under test",
    approved: "—",
    ccb: "Atlas Configuration Control Board (chair: Marcus Hale, ISSM)",
    supersedes: "BLD-0007",
    pins: [
      { node: "CN-0001", version: "—", digest: null, partNumber: null },
      { node: "CN-0100", version: "—", digest: null, partNumber: null },
      { node: "CN-0110", version: "—", digest: null, partNumber: "R760-CHS" },
      { node: "CN-0111", version: "Rev A03", digest: null, partNumber: "R760-MB" },
      {
        node: "CN-0112",
        version: "2.14.1",
        digest: "sha256:857e881b911b2b73d19a271d43e6547423a4670f411db0c1a79031926dbccbcf",
        partNumber: null,
      },
      { node: "CN-0116", version: "Rev B1", digest: null, partNumber: "BCM57414-OCP3" },
      {
        node: "CN-0117",
        version: "7.10.70.00",
        digest: "sha256:4c9a0e6f81d5b73a2e0cf4489b6d1a37e5c82f04d9137ba6e0c85d21f7439ae8",
        partNumber: null,
      },
      { node: "CN-0113", version: "5.14.0-427.28.1.el9_4", digest: null, partNumber: null },
      { node: "CN-0114", version: "8.7p1-38.el9", digest: null, partNumber: null },
      { node: "CN-0115", version: "3.0.7-104.el9", digest: null, partNumber: null },
      { node: "CN-0118", version: "3.0.7-27.el9", digest: null, partNumber: null },
      { node: "CN-0120", version: "—", digest: null, partNumber: "R760-CHS" },
      { node: "CN-0121", version: "Rev A03", digest: null, partNumber: "R760-MB" },
      {
        node: "CN-0123",
        version: "2.14.1",
        digest: "sha256:857e881b911b2b73d19a271d43e6547423a4670f411db0c1a79031926dbccbcf",
        partNumber: null,
      },
      { node: "CN-0122", version: "5.14.0-427.28.1.el9_4", digest: null, partNumber: null },
      { node: "CN-0124", version: "8.7p1-38.el9", digest: null, partNumber: null },
      { node: "CN-0130", version: "—", digest: null, partNumber: "R660-CHS" },
      { node: "CN-0133", version: "Rev A01", digest: null, partNumber: "R660-MB" },
      { node: "CN-0131", version: "5.14.0-427.28.1.el9_4", digest: null, partNumber: null },
      { node: "CN-0132", version: "15.6-1PGDG.rhel9", digest: null, partNumber: null },
      { node: "CN-0200", version: "—", digest: null, partNumber: null },
      {
        node: "CN-0210",
        version: "2.14.0",
        digest: "sha256:72591e579afd0f029ac0caff912107bdd9f180a675405ae2f8a787e6fe4670f1",
        partNumber: null,
      },
      {
        node: "CN-0211",
        version: "22.04.4 LTS",
        digest: "sha256:29ad08166aade176aae4510e54ec815a2ce7efbb9110379326573e82452a2a2e",
        partNumber: null,
      },
      { node: "CN-0212", version: "3.0.13-0ubuntu3.4", digest: null, partNumber: null },
      { node: "CN-0213", version: "v1.8.0", digest: null, partNumber: null },
      { node: "CN-0214", version: "v2.0.19", digest: null, partNumber: null },
      { node: "CN-0215", version: "2.14.0", digest: null, partNumber: null },
      { node: "CN-0220", version: "24.0.5", digest: null, partNumber: null },
      { node: "CN-0221", version: "24.0.5", digest: null, partNumber: null },
      { node: "CN-0222", version: "21.0.3+9", digest: null, partNumber: null },
      { node: "CN-0223", version: "1.0.2.4", digest: null, partNumber: null },
      { node: "CN-0300", version: "—", digest: null, partNumber: null },
      { node: "CN-0310", version: "—", digest: null, partNumber: "C9300-24T-A" },
      { node: "CN-0311", version: "Rev B3", digest: null, partNumber: "C9300-24T rev B3" },
      { node: "CN-0312", version: "Rev A2", digest: null, partNumber: "88E6390-A2-TFJ2C000" },
      {
        node: "CN-0313",
        version: "17.12.3",
        digest: "sha256:b1f4c07d9e2a58cf3d6b0a4471ee83c9a20d5f6ec8b7419d0a3e6c25f8d14b7a",
        partNumber: null,
      },
      {
        node: "CN-0314",
        version: "17.9.1r",
        digest: "sha256:d5d8d1c5f2596340f5991076229cc22ce627c428e21987a377a7ea2431117624",
        partNumber: null,
      },
    ],
    parameters: [
      {
        control: "AC-11",
        parameter: "Session lock time period of user inactivity",
        value: "15 minutes",
      },
      {
        control: "AC-7",
        parameter: "Consecutive invalid logon attempts and the time window they are counted over",
        value: "3 attempts in 15 minutes, account locked until released by an administrator",
      },
      {
        control: "IA-5(1)",
        parameter: "Minimum password length and composition for local emergency accounts",
        value: "15 characters, no dictionary word, no reuse of the previous 24",
      },
      {
        control: "AU-11",
        parameter: "Audit record retention period",
        value: "90 days online in the enclave sink, 3 years in the S3 Glacier archive",
      },
      {
        control: "SC-10",
        parameter: "Network disconnect time period of inactivity",
        value: "10 minutes on the management plane, 30 minutes on the mission API",
      },
      {
        control: "SI-2",
        parameter: "Flaw remediation time period from release of the update",
        value: "CAT I within 7 days, CAT II within 30 days, CAT III within 90 days",
      },
    ],
    note: "Release candidate staged for the 4.8.0 regression campaign. Five pins move against BLD-0007; four carry a change record and one does not, which is itself the CM-3 finding on this build.",
  },
];

const buildIndex = new Map(builds.map((b) => [b.id, b]));

/* ── Change records ──────────────────────────────────────────────────────── */

/**
 * Nine changes across the 4.7.2 baseline and the 4.8.0 candidate. Every one
 * carries a written CM-3(2) security impact analysis, including — especially —
 * the ones that were found to have no security impact. Those are the records
 * that keep the cascade honest: each of CHG-0409, CHG-0416 and CHG-0421 would
 * have turned most of the matrix amber under an implementation that skipped the
 * gate, and the analysis says in plain words why it did not.
 */
export const changeRecords: ChangeRecord[] = [
  {
    id: "CHG-0409",
    program: "PRG-1041",
    build: "BLD-0007",
    kind: "Firmware version",
    node: "CN-0112",
    subject: "CN-0112",
    from: "2.14.0",
    to: "2.14.1",
    requested: "Jun 24, 2026",
    requestedBy: "Dana Whitlock (Platform ops)",
    approvedBy: "Atlas CCB — Marcus Hale",
    impact: "None",
    analysis:
      "Dell's 2.14.1 spin of the R760 system BIOS corrects a fan-curve regression and a PCIe AER logging defect. The flash replaces the firmware image, so it necessarily moves what is measured into PCR 0 — and the image digest pinned for CN-0112 with it: the golden PCR set and the firmware digest were re-baselined at 2.14.1 under this same CCB action, and the measured-boot quote on gcs-app-01 was re-verified against the new golden values after the flash. What the determinations on this host rest on did not move: the Secure Boot policy and the DoD PKI db and dbx contents are unchanged, so PCR 7 is unchanged with them, and the SR-IOV and IOMMU settings are byte-identical between 2.14.0 and 2.14.1. No control determination on this host is written against a BIOS build number, so no determination is invalidated, no evidence is superseded and no re-test is owed. Recorded under CM-3 for configuration accountability only.",
    acknowledged: false,
  },
  {
    id: "CHG-0413",
    program: "PRG-1041",
    build: "BLD-0007",
    kind: "Software version",
    node: "CN-0132",
    subject: "CN-0132",
    from: "15.5-1PGDG.rhel9",
    to: "15.6-1PGDG.rhel9",
    requested: "Jul 09, 2026",
    requestedBy: "Ines Okafor (Data platform)",
    approvedBy: "Atlas CCB — Marcus Hale",
    impact: "Significant",
    analysis:
      "PostgreSQL 15.6 changes the default channel-binding behaviour for scram-sha-256 and the include-directive semantics in pg_hba.conf, both of which the AU-4, SC-8 and SI-2 determinations on gcs-db-01 were taken against in the 15.5 tree. The audit offload configuration is expressed through pgaudit settings that the upgrade rewrites on first start, and the SI-2(3) remediation-cadence determination on this host is measured against the package set the upgrade replaces. The database is also the far end of every critical connection in the boundary, so the assertion that mission-api and Keycloak reach it over an authenticated, encrypted channel is now written against an untested transport configuration. Significant: re-test the audit sink coverage, the transport configuration and the flaw-remediation cadence before the row set is claimed again.",
    acknowledged: false,
  },
  {
    id: "CHG-0416",
    program: "PRG-1041",
    build: "BLD-0007",
    kind: "Composition",
    node: "CN-0223",
    subject: "CN-0223",
    from: "Contained in CN-0221 (Keycloak 24.0.5)",
    to: "Contained in CN-0222 (OpenJDK 21.0.3)",
    requested: "Jul 12, 2026",
    requestedBy: "Ravi Menon (Identity platform)",
    approvedBy: "Atlas CCB — Marcus Hale",
    impact: "Administrative",
    analysis:
      "The CycloneDX producer had been emitting Bouncy Castle FIPS as a Keycloak dependency; it is in fact installed as a JVM security provider in java.security and is loaded by the runtime, not by the application. The SBOM was corrected to hang the node beneath OpenJDK. The binary, its SHA-256, its supplier and its CMVP validation certificate are unchanged, and IA-7 and SC-13 name the validated module rather than its position in the tree. This is a correction to the description of the system, not to the system, so nothing is invalidated. Administrative.",
    acknowledged: true,
  },
  {
    id: "CHG-0421",
    program: "PRG-1041",
    build: "BLD-0007",
    kind: "Provider assessment",
    node: "—",
    subject: "CMP-021",
    from: "AR-2026.1",
    to: "AR-2026.2",
    requested: "Jul 27, 2026",
    requestedBy: "Grace Hoppel (Program office)",
    approvedBy: "Atlas CCB — Marcus Hale",
    impact: "None",
    analysis:
      "The GovCloud landing zone's annual re-assessment re-executed the same SP 800-53A objectives against an unchanged control implementation and returned the same determinations. The assessment identifier moved because the assessment year moved, not because the control did: the provider's SC-7, AU-9, CM-6 and CP-9 assertions are unchanged word for word, the boundary account structure and the SCP set are unchanged, and the platform version stayed at v9.6. Atlas's accepted reference already names AR-2026.2. No inherited determination rests on the assessment identifier, so nothing is invalidated and no re-acceptance is owed. Recorded so that the next reviewer does not have to work that out again.",
    acknowledged: false,
  },
  {
    id: "CHG-0424",
    program: "PRG-1041",
    build: "BLD-0007",
    kind: "Provider assessment",
    node: "—",
    subject: "CMP-014",
    from: "v4.1 / AR-2026.1",
    to: "v4.2 / AR-2026.2",
    requested: "Aug 05, 2026",
    requestedBy: "Ravi Menon (Identity platform)",
    approvedBy: "Atlas CCB — Marcus Hale",
    impact: "Significant",
    analysis:
      "idp-core released v4.2 and re-assessed under AR-2026.2. The release replaces the authenticator flow engine and changes how step-up authentication is bound to a client scope, which is the mechanism the provider's IA-2, IA-5(1) and IA-8 assertions describe, and it re-scopes the AC-2 shared responsibility split so more of the account lifecycle sits with the consumer. Atlas accepted v4.1 under AR-2026.1 on Jun 02 and has not re-accepted, so every row inherited from CMP-014 is currently claiming a provider implementation the program has never assessed. Significant: the inheritance reference is invalidated until the program reviews the v4.2 assessment result and re-accepts, and the consumer obligations on the shared rows have to be re-read before they are.",
    acknowledged: false,
  },
  {
    id: "CHG-0431",
    program: "PRG-1041",
    build: "BLD-0009",
    kind: "Software version",
    node: "CN-0212",
    subject: "CN-0212",
    from: "3.0.11-1ubuntu2",
    to: "3.0.13-0ubuntu3.4",
    requested: "Aug 27, 2026",
    requestedBy: "Priya Raghunathan (Mission software)",
    approvedBy: "Atlas CCB — Marcus Hale",
    impact: "Significant",
    analysis:
      "The mission-api image's OpenSSL moves two patch releases and, with it, the default security level and the set of signature algorithms offered in the TLS 1.3 handshake. libcrypto is the cryptographic module behind every outbound call the service makes, so the SC-8, SC-8(1), SC-13 and SC-23 assertions for mission-api are all written against the 3.0.11 provider configuration. FND-2246 is open against this exact package, and its remediation is the reason the version moves at all, so the assessment on file describes a component that will not be in the delivered image. Significant: the TLS configuration and the FIPS provider selection have to be re-demonstrated on the rebuilt image before SC-8(1) can be claimed again.",
    acknowledged: false,
  },
  {
    id: "CHG-0437",
    program: "PRG-1041",
    build: "BLD-0009",
    kind: "Firmware version",
    node: "CN-0313",
    subject: "CN-0313",
    from: "17.9.4a",
    to: "17.12.3",
    requested: "Aug 28, 2026",
    requestedBy: "Owen Castellanos (Network engineering)",
    approvedBy: "Atlas CCB — Marcus Hale",
    impact: "Significant",
    analysis:
      "IOS-XE 17.12.3 is a train change, not a maintenance rebuild. It replaces the management-plane transport stack, changes the default state of the legacy line VTY transports, and re-writes the CLI parser for the very configuration lines FND-2231 is raised against. The SC-8(1) determination on edge-sw-a1 and the AC-17 and IA-3 determinations that depend on the management plane were all taken by inspecting a 17.9.4a running configuration; the same commands do not necessarily produce the same enforcement on 17.12. The image digest also changes, so the firmware manifest and the supplier attestation on file no longer describe the loaded image. Significant: re-inspect the management plane and re-verify the image digest against the Cisco manifest.",
    acknowledged: false,
  },
  {
    id: "CHG-0439",
    program: "PRG-1041",
    build: "BLD-0009",
    kind: "Board revision",
    node: "CN-0311",
    subject: "CN-0311",
    from: "Rev B2",
    to: "Rev B3",
    requested: "Aug 28, 2026",
    requestedBy: "Owen Castellanos (Network engineering)",
    approvedBy: "Atlas CCB — Marcus Hale",
    impact: "Significant",
    analysis:
      "The B3 spin of the C9300-24T line board is not cosmetic. It relocates the 88E6390 forwarding ASIC's secure-boot fuse bank and changes the MDIO strap configuration the ASIC reads at reset, which is what selects the port-security and MACsec key-store behaviour. The ASIC that sits beneath the board is therefore no longer in the state the port-based access control determinations were taken in, even though its part number has not moved. Significant: the parts contained in the board are re-verified with it, while the chassis above it is flagged for the assessor rather than invalidated — the switch's own controls may well still hold.",
    acknowledged: false,
  },
  {
    id: "CHG-0442",
    program: "PRG-1041",
    build: "BLD-0009",
    kind: "Control parameter",
    node: "—",
    subject: "AC-11",
    from: "30 minutes",
    to: "15 minutes",
    requested: "Aug 29, 2026",
    requestedBy: "Nadia Fournier (Security assessment)",
    approvedBy: "Atlas CCB — Marcus Hale",
    impact: "Significant",
    analysis:
      "The organization-defined session lock period tightens from 30 minutes to 15 to align with the enclave standard the AO cited at the last gate. An ODP is a property of the requirement, not of any one component: every AC-11 determination on file was taken against a 30-minute threshold and none of them says anything about a 15-minute one, so the whole AC-11 row set is invalidated regardless of where in the graph the requirement is allocated. FND-2258 was raised and evidenced against the old value. Significant: re-test the session lock on every host, workstation and console in the boundary.",
    acknowledged: false,
  },
];

const changeIndex = new Map(changeRecords.map((c) => [c.id, c]));

/* ── Store ───────────────────────────────────────────────────────────────── */

/**
 * Acknowledgement is the only mutable fact in this module. It is the operator
 * saying "I re-ran it", which stops the change suppressing determinations; it
 * does not fabricate evidence, close a finding or move a pin.
 */
const ackOverrides = new Map<string, boolean>();
const listeners = new Set<() => void>();
let ackVersion = 0;

function notify() {
  for (const l of listeners) l();
}

export function subscribeBaselines(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Bumps on every acknowledgement so the impact cache in `@/lib/change-impact` can
 * key off it. That cache clears itself whenever this number moves, which is why
 * `acknowledgeChange` does not reach into it.
 */
export function baselineVersion(): number {
  return ackVersion;
}

function resolveChange(change: ChangeRecord): ChangeRecord {
  const patch = ackOverrides.get(change.id);
  return patch === undefined ? change : { ...change, acknowledged: patch };
}

export function acknowledgeChange(changeId: string): void {
  if (!changeIndex.has(changeId)) return;
  ackOverrides.set(changeId, true);
  ackVersion += 1;
  notify();
}

export function unacknowledgeChange(changeId: string): void {
  if (!changeIndex.has(changeId)) return;
  ackOverrides.set(changeId, false);
  ackVersion += 1;
  notify();
}

/* ── Selectors ───────────────────────────────────────────────────────────── */

export function buildById(id: string): Build | null {
  return buildIndex.get(id) ?? null;
}

export function buildsForProgram(programId: string): Build[] {
  return builds.filter((b) => b.program === programId);
}

export function authorizedBuild(programId: string): Build | null {
  return buildsForProgram(programId).find((b) => b.state === "Authorized baseline") ?? null;
}

/**
 * The build being worked toward. "Under test" outranks "Draft": a candidate in
 * the middle of a regression campaign is the one whose pins the assessor is
 * arguing about.
 */
export function candidateBuild(programId: string): Build | null {
  const rows = buildsForProgram(programId);
  return (
    rows.find((b) => b.state === "Under test") ?? rows.find((b) => b.state === "Draft") ?? null
  );
}

export function changeById(id: string): ChangeRecord | null {
  const row = changeIndex.get(id);
  return row ? resolveChange(row) : null;
}

export function changesForProgram(programId: string): ChangeRecord[] {
  return changeRecords.filter((c) => c.program === programId).map(resolveChange);
}

/* ── Mechanical diff ─────────────────────────────────────────────────────── */

export function nodeName(nodeId: string): string {
  return nodeById.get(nodeId)?.name ?? nodeId;
}

function shortDigest(digest: string | null): string {
  if (!digest) return "—";
  return digest.length > 23 ? `${digest.slice(0, 23)}…` : digest;
}

/**
 * Which CM-3 change kind a pin movement is, inferred from what the node is.
 * A version move on a firmware image is a firmware change whatever the person
 * filing it called it; a digest move with no version move is a rebuild.
 */
function deltaKind(nodeId: string, versionMoved: boolean): ChangeKind {
  const node = nodeById.get(nodeId);
  if (!node) return versionMoved ? "Software version" : "Container digest";
  if (node.class === "Firmware") return versionMoved ? "Firmware version" : "Container digest";
  if (node.kind === "Container image")
    return versionMoved ? "Software version" : "Container digest";
  if (node.class === "Hardware") return "Board revision";
  return versionMoved ? "Software version" : "Container digest";
}

/** Mechanical diff — finds pins that moved. No judgement, no gate. */
export function buildDiff(fromId: string, toId: string): PinDelta[] {
  const from = buildIndex.get(fromId);
  const to = buildIndex.get(toId);
  if (!from || !to) return [];

  const recorded = new Map<string, string>();
  for (const change of changeRecords) {
    if (change.build !== toId) continue;
    const key = change.node === "—" ? `param:${change.subject}` : change.node;
    if (!recorded.has(key)) recorded.set(key, change.id);
  }

  const out: PinDelta[] = [];
  const fromPins = new Map(from.pins.map((p) => [p.node, p]));
  const toPins = new Map(to.pins.map((p) => [p.node, p]));

  for (const [nodeId, before] of fromPins) {
    const after = toPins.get(nodeId);
    if (!after) {
      out.push({
        node: nodeId,
        label: nodeName(nodeId),
        kind: "Composition",
        from: before.version,
        to: "—",
        recorded: recorded.get(nodeId) ?? null,
      });
      continue;
    }
    const versionMoved = before.version !== after.version;
    const digestMoved = before.digest !== after.digest;
    const partMoved = before.partNumber !== after.partNumber;
    if (!versionMoved && !digestMoved && !partMoved) continue;
    out.push({
      node: nodeId,
      label: nodeName(nodeId),
      kind: deltaKind(nodeId, versionMoved || partMoved),
      from: versionMoved || partMoved ? before.version : shortDigest(before.digest),
      to: versionMoved || partMoved ? after.version : shortDigest(after.digest),
      recorded: recorded.get(nodeId) ?? null,
    });
  }

  for (const [nodeId, after] of toPins) {
    if (fromPins.has(nodeId)) continue;
    out.push({
      node: nodeId,
      label: nodeName(nodeId),
      kind: "Composition",
      from: "—",
      to: after.version,
      recorded: recorded.get(nodeId) ?? null,
    });
  }

  const fromParams = new Map(from.parameters.map((p) => [`${p.control}|${p.parameter}`, p]));
  for (const after of to.parameters) {
    const key = `${after.control}|${after.parameter}`;
    const before = fromParams.get(key);
    if (before && before.value === after.value) continue;
    out.push({
      node: "—",
      label: `${after.control} — ${after.parameter}`,
      kind: "Control parameter",
      from: before?.value ?? "—",
      to: after.value,
      recorded: recorded.get(`param:${after.control}`) ?? null,
    });
  }

  return out.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * A pin that moved with NO change record against it.
 *
 * This is the CM-3 assertion, not a diff: the movement was never proposed,
 * never analysed under CM-3(2) and never approved by the board, so there is no
 * one to ask what it was supposed to do.
 */
export function unrecordedChanges(programId: string): PinDelta[] {
  const authorized = authorizedBuild(programId);
  const candidate = candidateBuild(programId);
  if (!authorized || !candidate) return [];
  return buildDiff(authorized.id, candidate.id).filter((d) => d.recorded === null);
}

/* ── Evidence dating ─────────────────────────────────────────────────────── */

/**
 * When each EVD- was collected, taken from the two places the repo actually
 * records it: the assessment date on the finding that cites the artifact, and
 * the timestamp on the test-run step record that captured it. The LATEST known
 * date wins, because the question this index answers is "can this item be shown
 * to postdate the change" and the most recent collection is the fairest answer.
 * An item with no recorded date cannot be shown to postdate anything, so it
 * does not survive a change that invalidates the row citing it.
 */
const evidenceCollected = new Map<string, string>();

/** The recorded collection date for an `EVD-`, or undefined when none is known. */
export function evidenceCollectedOn(id: string): string | undefined {
  return evidenceCollected.get(id);
}

export function stampOf(value: string): number {
  return parseGateDate(value)?.getTime() ?? 0;
}

function recordEvidenceDate(id: string, on: string) {
  if (!id.startsWith("EVD-")) return;
  const previous = evidenceCollected.get(id);
  if (previous === undefined || stampOf(on) > stampOf(previous)) evidenceCollected.set(id, on);
}

for (const f of findings) {
  recordEvidenceDate(f.sourceArtifact, f.assessment.assessedOn);
  for (const e of f.assessment.evidence) recordEvidenceDate(e, f.assessment.assessedOn);
}

for (const run of testRuns) {
  for (const record of run.records) {
    // "MMM DD, YYYY HH:MM" — the first 12 characters are the only part
    // `parseGateDate` accepts, and the clock time is not material here.
    const on = record.at.slice(0, 12);
    for (const e of record.evidence) recordEvidenceDate(e, on);
  }
}

/* ── Cascade ─────────────────────────────────────────────────────────────── */

const reachableKinds = new Set(["Depends on", "Hosts", "Authenticates to"]);

/**
 * Which reachability edges carry impact. Containment is walked separately; this
 * is the "who else assumed something about this thing" question. A redundant
 * connection is not a blast-radius path, which is what `edge.critical` records.
 */
function carriesImpact(edge: CompositionEdge): boolean {
  if (reachableKinds.has(edge.kind)) return true;
  return (edge.kind === "Connects to" || edge.kind === "Flows to") && edge.critical;
}

/**
 * Stages 1-4 of the cascade, with no SCTM row in sight.
 *
 * Keeping this row-free is what lets `sctm.ts` ask for a row's currency without
 * the two modules recursing through each other: the overlay is a function of
 * the composition graph and the change record, never of the matrix it is
 * applied to. `@/lib/change-impact` reads it for the row-level stages.
 */
export function touchedFor(change: ChangeRecord, maxHops: number): Map<string, TouchedNode> {
  const touched = new Map<string, TouchedNode>();

  const put = (
    nodeId: string,
    state: ImpactState,
    hops: number,
    reason: string,
    via: "ascent" | "direct" = "direct",
  ) => {
    const existing = touched.get(nodeId);
    if (!existing) {
      touched.set(nodeId, { node: nodeId, state, hops, reason, ascentOnly: via === "ascent" });
      return;
    }
    // Provenance only ever WIDENS: once any non-ascent path lands, the node is
    // not ascent-only, whatever order the stages ran in. Doing this before the
    // upgrade test is what keeps stage 4 from being silenced by stage 3.
    const ascentOnly = existing.ascentOnly && via === "ascent";
    // Entries only ever upgrade. A node already invalidated is not talked back
    // down to suspect by a longer path that happens to reach it.
    if (existing.state === "Suspect" && state === "Invalidated") {
      touched.set(nodeId, {
        node: nodeId,
        state,
        hops: Math.min(existing.hops, hops),
        reason,
        ascentOnly,
      });
    } else {
      touched.set(nodeId, { ...existing, hops: Math.min(existing.hops, hops), ascentOnly });
    }
  };

  const seed = nodeById.get(change.node);
  if (!seed) return touched;

  // 1. The changed node itself.
  put(
    seed.id,
    "Invalidated",
    0,
    `${change.id} moves ${seed.name} from ${change.from} to ${change.to}, so this is no longer the component the determinations were taken against.`,
  );

  // 2. Descend composition — Invalidated.
  for (const descendant of descendantsOf(seed.id)) {
    const chain = ancestorsOf(descendant.id);
    const hops = chain.findIndex((a) => a.id === seed.id) + 1;
    put(
      descendant.id,
      "Invalidated",
      hops > 0 ? hops : 1,
      `Contained in ${seed.name}, which the change alters; a part inside a component that moved is not the part that was assessed.`,
    );
  }

  // 3. Ascend composition — Suspect, never Invalidated. A package bump makes
  //    the image that carries it suspect, not invalid: the image's own controls
  //    may still hold, and the assessor is the one who decides that.
  const chain = ancestorsOf(seed.id);
  for (let i = 0; i < chain.length; i += 1) {
    const ancestor = chain[i]!;
    put(
      ancestor.id,
      "Suspect",
      i + 1,
      `Contains ${seed.name}, which the change alters. Its own determinations may still hold, so the assessor is asked rather than told.`,
      "ascent",
    );
  }

  // 4. Blast radius over inbound reachability edges.
  const queue = [...touched.values()]
    .map((t) => ({ id: t.node, hops: t.hops }))
    .sort((a, b) => a.hops - b.hops);
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current.id)) continue;
    visited.add(current.id);
    if (current.hops >= maxHops) continue;
    for (const edge of edgesTo(current.id)) {
      if (!carriesImpact(edge)) continue;
      const hops = current.hops + 1;
      put(
        edge.from,
        "Suspect",
        hops,
        `Reaches ${nodeName(current.id)} over ${edge.kind.toLowerCase()} (${edge.via}) and is ${hops} hop${hops === 1 ? "" : "s"} from the change, so what it assumed about that path is no longer proven.`,
      );
      queue.push({ id: edge.from, hops });
    }
  }

  return touched;
}

/** Controls the program inherits from one provider, for a Provider-assessment change. */
export function controlsFromProvider(programId: string, componentId: string): Set<string> {
  const out = new Set<string>();
  for (const resolved of resolveInheritance(programId).values()) {
    if (resolved.component.id === componentId) out.add(resolved.control);
  }
  return out;
}

/**
 * Where a change sits in the CM-2/CM-3 build lifecycle, which decides what its
 * cascade is allowed to do to a determination.
 *
 *  - `Incorporated` — the CCB baselined the resulting configuration. CM-2 says
 *    the authorized baseline IS the configuration in force, so a determination
 *    taken on or after that date was taken against what the change produced and
 *    cannot have been invalidated by it. `asOf` is the approval date, and the
 *    test is per row: determinations older than the CCB action really are stale
 *    and are still withdrawn.
 *  - `Candidate` — the change is filed against a build that is not authorized.
 *    It has not shipped, so it cannot retract a determination about the box
 *    operating today; it caps at `Suspect`, which is exactly "the determination
 *    stands and is flagged for the assessor". The re-test queue is unchanged,
 *    because the regression campaign for the candidate still owes the work.
 *  - `Live` — filed against the authorized baseline after it was approved. This
 *    is the only class that withdraws a determination outright.
 */
export type ChangePosture = "Incorporated" | "Candidate" | "Live";

export function postureOf(change: ChangeRecord): { posture: ChangePosture; asOf: string } {
  const build = buildIndex.get(change.build);
  if (!build) return { posture: "Live", asOf: change.requested };
  if (build.state !== "Authorized baseline")
    return { posture: "Candidate", asOf: change.requested };
  return stampOf(build.approved) >= stampOf(change.requested)
    ? { posture: "Incorporated", asOf: build.approved }
    : { posture: "Live", asOf: change.requested };
}

/* ── Currency overlay ────────────────────────────────────────────────────── */

/**
 * Re-entrancy latch. `@/lib/change-impact` builds a real SCTM to name the rows a
 * change invalidates; the SCTM asks this module for each row's currency. The
 * latch makes the second question answer "nothing yet" while the first is in
 * flight, so the overlay is always computed against the base matrix and the two
 * modules cannot recurse through each other.
 */
let cascading = false;

/**
 * Runs `fn` with the currency overlay suppressed, and turns it back on however
 * `fn` returns. The one caller is the impact analysis, which has to read the base
 * determination a change would withdraw rather than one another change already
 * struck through. Exported as a wrapper rather than as a flag the caller sets, so
 * the latch cannot be left on and nothing outside this pair can reach it.
 */
export function withoutCurrencyOverlay<T>(fn: () => T): T {
  cascading = true;
  try {
    return fn();
  } finally {
    cascading = false;
  }
}

export function nodeImpact(programId: string, nodeId: string): ImpactState | null {
  if (cascading) return null;
  let state: ImpactState | null = null;
  for (const change of changesForProgram(programId)) {
    if (change.acknowledged || change.impact !== "Significant") continue;
    const touched = touchedFor(change, 3).get(nodeId);
    if (!touched) continue;
    // A change staged in an unauthorized build has not reached the node that is
    // running, so it flags it rather than invalidating it.
    if (touched.state === "Invalidated" && postureOf(change).posture !== "Candidate") {
      return "Invalidated";
    }
    state = "Suspect";
  }
  return state;
}

/**
 * The currency overlay for one SCTM row, computed from the composition graph
 * and the change log alone.
 *
 * This is the entry point `sctm.ts` uses, and it deliberately never builds a
 * matrix: the row's own identity is passed in. `provider` is the `CMP-` the row
 * is inherited from, or null.
 */
export function rowCurrency(
  programId: string,
  input: {
    control: string;
    responsibleNodes: string[];
    /**
     * The members of `responsibleNodes` the requirement carries only because it
     * is allocated to the system as a whole. Bare containment ascent onto one of
     * these carries no signal — a whole-system allocation is the statement that
     * no individual part implements the requirement, so "a part inside the
     * boundary moved" is true of every change and discriminates nothing.
     */
    systemNodes: string[];
    /** When the determination was taken. */
    assessed: string;
    provider: string | null;
  },
): { state: ImpactState; reason: string; change: string } | null {
  if (cascading) return null;
  const systemNodes = new Set(input.systemNodes);
  const assessedStamp = stampOf(input.assessed);
  let best: { state: ImpactState; reason: string; change: string } | null = null;
  for (const change of changesForProgram(programId)) {
    if (change.acknowledged || change.impact !== "Significant") continue;

    const { posture, asOf } = postureOf(change);
    // The CCB baselined the result of this change on `asOf`, so a determination
    // taken on or after that date was taken against the configuration the change
    // produced. It cannot have been invalidated by it.
    if (posture === "Incorporated" && assessedStamp >= stampOf(asOf)) continue;

    // `candidate` is the same fact worded for a change that has not shipped:
    // the movement is real, the determination it would retract is not yet the
    // one describing the system. Carried alongside rather than rewritten from
    // the invalidation sentence, so neither reading is derived from the other.
    let hit: { state: ImpactState; reason: string; candidate: string } | null = null;
    if (change.kind === "Control parameter" && change.subject === input.control) {
      hit = {
        state: "Invalidated",
        reason: `${change.id} moved the ${change.subject} organization-defined parameter from ${change.from} to ${change.to}; the determination on file was taken against the old value.`,
        candidate: `${change.id} moves the ${change.subject} organization-defined parameter from ${change.from} to ${change.to} in ${change.build}.`,
      };
    } else if (
      change.kind === "Provider assessment" &&
      input.provider !== null &&
      change.subject === input.provider
    ) {
      hit = {
        state: "Invalidated",
        reason: `${change.subject} moved from ${change.from} to ${change.to}; the program inherits this row from an assessment it has not reviewed.`,
        candidate: `${change.id} moves ${change.subject} from ${change.from} to ${change.to} in ${change.build}, and the program inherits this row from it.`,
      };
    } else {
      const touched = touchedFor(change, 3);
      let rowState: ImpactState | null = null;
      for (const nodeId of input.responsibleNodes) {
        const entry = touched.get(nodeId);
        if (!entry) continue;
        if (entry.ascentOnly && systemNodes.has(nodeId)) continue;
        if (entry.state === "Invalidated") {
          rowState = "Invalidated";
          break;
        }
        rowState = "Suspect";
      }
      if (rowState === "Invalidated") {
        hit = {
          state: "Invalidated",
          reason: `${change.id} alters a component this requirement is allocated to (${nodeName(change.node)}: ${change.from} → ${change.to}), so the determination no longer describes the configuration in force.`,
          candidate: `${change.id} alters a component this requirement is allocated to (${nodeName(change.node)}: ${change.from} → ${change.to}) in ${change.build}.`,
        };
      } else if (rowState === "Suspect") {
        hit = {
          state: "Suspect",
          reason: `${change.id} alters ${nodeName(change.node)}, which is contained in or reached by a component this requirement is allocated to. The determination stands and is flagged for the assessor.`,
          candidate: "",
        };
      }
    }
    if (hit === null) continue;

    // A change staged in a build that is not the authorized baseline has not
    // reached the configuration this determination describes, so it flags the
    // row rather than retracting a claim about the system operating today.
    if (hit.state === "Invalidated" && posture === "Candidate") {
      hit = {
        state: "Suspect",
        reason: `${hit.candidate} That build is not the authorized baseline, so the determination on the configuration in force stands and is flagged for re-test before the candidate is authorized.`,
        candidate: hit.candidate,
      };
    }

    if (hit.state === "Invalidated") {
      return { state: "Invalidated", reason: hit.reason, change: change.id };
    }
    if (best === null) best = { state: hit.state, reason: hit.reason, change: change.id };
  }
  return best;
}

/* ── Hook ────────────────────────────────────────────────────────────────── */

const hookCache = new Map<string, { builds: Build[]; changes: ChangeRecord[] }>();
let hookVersion = -1;

function baselineSnapshot(programId: string): { builds: Build[]; changes: ChangeRecord[] } {
  if (hookVersion !== ackVersion) {
    hookCache.clear();
    hookVersion = ackVersion;
  }
  const hit = hookCache.get(programId);
  if (hit) return hit;
  const snapshot = { builds: buildsForProgram(programId), changes: changesForProgram(programId) };
  hookCache.set(programId, snapshot);
  return snapshot;
}

function subscribeAll(cb: () => void): () => void {
  const stopAck = subscribeBaselines(cb);
  const stopGraph = subscribeGraph(cb);
  return () => {
    stopAck();
    stopGraph();
  };
}

export function useBaselines(programId: string): { builds: Build[]; changes: ChangeRecord[] } {
  const get = () => baselineSnapshot(programId);
  return useSyncExternalStore(subscribeAll, get, get);
}
