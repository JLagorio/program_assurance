/**
 * Chunk 15c of the CCI spine — the cross-domain transfer bundle.
 *
 * Nothing leaves an air-gapped enclave by API. It leaves as a set of files on
 * write-once media with a manifest, and the receiving side's whole job is to
 * decide whether what arrived is what was sent and how it differs from what the
 * receiver already holds. That is what this module does: generate the files,
 * hash them, sign the manifest, and reconcile a received manifest against the
 * locally generated one path by path.
 *
 * Invariants held here:
 *  - **`sha256` is a real SHA-256 of the real bytes.** `sha256Hex` in
 *    `@/lib/oscal` is a FIPS 180-4 implementation verified against the standard
 *    test vectors; every digest in this module is computed over the exact UTF-8
 *    bytes of the artifact it names. There is no random hex anywhere in this
 *    file, and nothing is labelled "sha256" that is not one.
 *  - **`signatureValid` is re-derived, never asserted.** `reconcile`
 *    reconstructs the received bundle's manifest from its own artifact rows,
 *    hashes it, and compares that to the value the manifest carries. A stored
 *    boolean would prove nothing.
 *  - **What the signature block is, honestly.** This build holds no key
 *    material and no PKI, so the "signature" is a detached SHA-256 digest of
 *    the manifest. It proves integrity — the manifest was not altered between
 *    signing and reading — and it proves nothing about authenticity. The
 *    algorithm string, the `signatureNote` and the UI all say exactly that
 *    rather than implying a cryptographic signature that does not exist.
 *  - **Determinism is the point.** Every input is derived, no clock is read,
 *    and no random value is generated, so building the same bundle twice
 *    produces identical bytes and therefore an identical manifest hash. Without
 *    that, the manifest would be unverifiable and the whole artifact pointless.
 *  - **The received bundle's digests are real too.** The seeded far-side
 *    bundle is not a table of invented hex strings: its artifacts are generated
 *    here — the SCTM as it read before the currency overlay retracted two
 *    determinations, a hardware baseline whose C9300-24T row never carried the
 *    board revision, and an attached provider assessment summary — and then
 *    hashed exactly like the local ones. The diff `reconcile` reports is a real
 *    diff of real content.
 *
 * Layering: airgap → oscal, emass, sctm, baselines. Nothing imports back.
 */

import { authorizedBuild, withoutCurrencyOverlay } from "@/lib/baselines";
import {
  emassCsv,
  emassExportFor,
  emassExportKinds,
  type EmassExport,
  type EmassExportKind,
} from "@/lib/emass";
import { programs } from "@/lib/grc-data";
import { oscalJson, oscalPackage, oscalPoam, sha256Hex, type OscalDocument } from "@/lib/oscal";
import { buildSctm, sctmCsv, type SctmRow } from "@/lib/sctm";
import { controlMatrix } from "@/lib/control-matrix";
import type { ReconcileState } from "@/lib/spine";
import type { Tone } from "@ledger/design-system";

/* ── Types ───────────────────────────────────────────────────────────────── */

/** The reconciliation vocabulary, re-exported so a consumer needs one import. */
export type { ReconcileState };

/** One generated file, before it is hashed into a manifest row. */
export type BundleFile = {
  path: string;
  kind: string;
  producer: string;
  /** The exact text that would be written to the media. */
  text: string;
};

export type BundleArtifact = {
  /** Path on the media, e.g. "oscal/ssp.json". */
  path: string;
  kind: string;
  /** UTF-8 byte length of the artifact, which is what the media holds. */
  bytes: number;
  /**
   * FIPS 180-4 SHA-256 of the artifact's exact UTF-8 bytes, lowercase hex.
   * Computed here from the generated content — not a recorded literal.
   */
  sha256: string;
  /** What produced it, so a receiver can tell a generated file from an attached one. */
  producer: string;
};

export type TransferBundle = {
  id: string; // BND-
  program: string; // PRG-
  build: string; // BLD- the bundle describes
  created: string;
  createdBy: string;
  classification: string;
  artifacts: BundleArtifact[];
  /**
   * SHA-256 over the sorted artifact manifest — the thing that gets signed.
   * Equal to `sha256Hex(bundleManifest(bundle))` by construction, which is what
   * makes it checkable rather than decorative.
   */
  manifestHash: string;
  /**
   * The integrity block travelling with the media.
   *
   * `algorithm` states plainly that this is a detached digest and not a digital
   * signature: this build has no signing key, so `value` is the manifest hash
   * itself. It proves the manifest is intact; it does not prove who produced it.
   */
  signature: {
    algorithm: string;
    keyId: string;
    signer: string;
    signedOn: string;
    value: string;
  };
  note: string;
};

export type ReconcileRow = {
  path: string;
  state: ReconcileState;
  localHash: string;
  remoteHash: string;
  /** What actually differs, in one sentence, with the numbers in it. */
  detail: string;
};

export type Reconciliation = {
  bundle: string;
  received: string;
  rows: ReconcileRow[];
  identical: number;
  changed: number;
  added: number;
  missing: number;
  /** Re-derived from the received manifest, never read off the record. */
  signatureValid: boolean;
  signatureNote: string;
  /** The single sentence a receiving ISSM needs. */
  verdict: string;
};

export const reconcileStateTone: Record<ReconcileState, Tone> = {
  Identical: "success",
  Changed: "warning",
  "Added on this side": "information",
  "Missing on this side": "danger",
};

/** The digest this module computes, named honestly wherever it is shown. */
export const digestAlgorithm = "SHA-256 (FIPS 180-4)";

/**
 * What the signature block actually is. Stated once, here, and reused by the
 * reconciliation and the UI so the two cannot drift apart.
 */
export const signatureAlgorithm =
  "SHA-256 detached manifest digest — integrity only, not a digital signature";

const classification = "CUI//SP-PRIV";
const bundleCreated = "Aug 30, 2026 14:20";

const encoder = new TextEncoder();

function utf8Bytes(text: string): number {
  return encoder.encode(text).length;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

/* ── Generated files ─────────────────────────────────────────────────────── */

const oscalPaths: Record<OscalDocument["model"], string> = {
  "system-security-plan": "oscal/ssp.json",
  "assessment-plan": "oscal/assessment-plan.json",
  "assessment-results": "oscal/assessment-results.json",
  "plan-of-action-and-milestones": "oscal/poam.json",
};

const oscalKinds: Record<OscalDocument["model"], string> = {
  "system-security-plan": "OSCAL 1.1.2 system-security-plan",
  "assessment-plan": "OSCAL 1.1.2 assessment-plan",
  "assessment-results": "OSCAL 1.1.2 assessment-results",
  "plan-of-action-and-milestones": "OSCAL 1.1.2 plan-of-action-and-milestones",
};

const emassPaths: Record<EmassExport["kind"], string> = {
  "Control Information": "emass/control-information.csv",
  "POA&M": "emass/poam.csv",
  Hardware: "emass/hardware-baseline.csv",
  Software: "emass/software-baseline.csv",
  "Test Results": "emass/test-results.csv",
};

function oscalFile(doc: OscalDocument): BundleFile {
  return {
    path: oscalPaths[doc.model],
    kind: oscalKinds[doc.model],
    producer: `Equinox OSCAL generator — ${doc.model}, OSCAL 1.1.2`,
    text: oscalJson(doc),
  };
}

function emassFile(kind: EmassExportKind, programId: string, rows: SctmRow[]): BundleFile {
  const sheet: EmassExport = emassExportFor(kind, programId, rows);
  return {
    path: emassPaths[sheet.kind],
    kind: `eMASS ${sheet.kind} (RFC 4180 CSV)`,
    producer: `Equinox eMASS ${sheet.kind} export — ${sheet.columns.length} columns`,
    text: emassCsv(sheet),
  };
}

function sctmFile(programId: string, rows: SctmRow[]): BundleFile {
  return {
    path: "sctm/sctm.csv",
    kind: "Security Controls Traceability Matrix (RFC 4180 CSV)",
    producer: `Equinox SCTM export — ${rows.length} requirement rows`,
    text: sctmCsv({
      program: programId,
      rows,
      generated: bundleCreated,
      counts: {
        total: rows.length,
        satisfied: rows.filter((r) => r.determination === "Satisfied").length,
        other: rows.filter((r) => r.determination === "Other than satisfied").length,
        notAssessed: rows.filter((r) => r.determination === "Not assessed").length,
        notApplicable: rows.filter((r) => r.determination === "Not applicable").length,
        invalidated: rows.filter((r) => r.currency === "Invalidated").length,
        suspect: rows.filter((r) => r.currency === "Suspect").length,
      },
      byMethod: [],
      byOrigination: [],
      gaps: rows.filter((r) => r.gap !== null).length,
      unevidenced: rows.filter((r) => r.evidence.length === 0).length,
      coverage: 0,
    }),
  };
}

/**
 * Every file the local side generates for a transfer, in media order.
 *
 * `rows` is the SCTM row set the bundle describes. Pass the same row set to
 * `buildBundle` twice and you get the same bytes twice; that is the whole
 * contract this module rests on.
 */
export function bundleFiles(programId: string, rows: SctmRow[]): BundleFile[] {
  return [
    ...oscalPackage(programId, rows).map(oscalFile),
    ...emassExportKinds.map((kind) => emassFile(kind, programId, rows)),
    sctmFile(programId, rows),
  ];
}

/* ── Manifest ────────────────────────────────────────────────────────────── */

type ManifestHeader = Pick<
  TransferBundle,
  "id" | "program" | "build" | "created" | "createdBy" | "classification"
>;

/**
 * The signable manifest text.
 *
 * Fixed field order, artifacts sorted by path, tab-separated digest rows. It
 * deliberately does NOT include `manifestHash` or the signature block — a
 * manifest that covered its own digest could not be verified.
 */
function manifestText(header: ManifestHeader, artifacts: BundleArtifact[]): string {
  const lines = [
    "EQUINOX-TRANSFER-MANIFEST/1",
    `bundle\t${header.id}`,
    `program\t${header.program}`,
    `build\t${header.build}`,
    `created\t${header.created}`,
    `created-by\t${header.createdBy}`,
    `classification\t${header.classification}`,
    `digest-algorithm\t${digestAlgorithm}`,
    `artifacts\t${artifacts.length}`,
  ];
  for (const artifact of [...artifacts].sort((a, b) => a.path.localeCompare(b.path))) {
    lines.push(`${artifact.sha256}\t${artifact.bytes}\t${artifact.path}\t${artifact.producer}`);
  }
  return lines.join("\n");
}

export function bundleManifest(b: TransferBundle): string {
  return manifestText(b, b.artifacts);
}

/* ── Content index ───────────────────────────────────────────────────────── */

/**
 * The bytes behind each manifest row, keyed `${bundleId}|${path}`.
 *
 * `TransferBundle` carries the manifest, not the media, which is right — a
 * manifest is what crosses the gap first. Keeping the generated text beside it
 * is what lets `reconcile` say WHAT differs rather than only THAT it differs.
 */
const contentIndex = new Map<string, string>();
const bundleIndex = new Map<string, TransferBundle>();

function register(bundle: TransferBundle, files: BundleFile[]): TransferBundle {
  bundleIndex.set(bundle.id, bundle);
  for (const file of files) contentIndex.set(`${bundle.id}|${file.path}`, file.text);
  return bundle;
}

/** A bundle this session has generated or holds as received, by id. */
export function bundleById(id: string): TransferBundle | null {
  return bundleIndex.get(id) ?? null;
}

/* ── Building ────────────────────────────────────────────────────────────── */

function artifactOf(file: BundleFile): BundleArtifact {
  return {
    path: file.path,
    kind: file.kind,
    bytes: utf8Bytes(file.text),
    sha256: sha256Hex(file.text),
    producer: file.producer,
  };
}

function assemble(
  header: ManifestHeader,
  files: BundleFile[],
  signer: string,
  signedOn: string,
  note: string,
): TransferBundle {
  const artifacts = files.map(artifactOf).sort((a, b) => a.path.localeCompare(b.path));
  const hash = sha256Hex(manifestText(header, artifacts));
  return register(
    {
      ...header,
      artifacts,
      manifestHash: hash,
      signature: {
        algorithm: signatureAlgorithm,
        keyId: "— (no signing key in this build)",
        signer,
        signedOn,
        value: hash,
      },
      note,
    },
    files,
  );
}

/**
 * Bundles are memoized on the identity of the row set they describe, because
 * hashing four OSCAL documents is not work to repeat on every render, and
 * `useSctm` hands out a reference-stable row array. Two calls with the same
 * array return the same object; two calls with equal-but-distinct arrays
 * return equal bundles, byte for byte.
 */
const localCache = new WeakMap<SctmRow[], Map<string, TransferBundle>>();

export function buildBundle(programId: string, rows: SctmRow[]): TransferBundle {
  const perProgram = localCache.get(rows) ?? new Map<string, TransferBundle>();
  const cached = perProgram.get(programId);
  if (cached) return cached;

  const program = programs.find((p) => p.id.toLowerCase() === programId.toLowerCase());
  const build = authorizedBuild(programId);
  const files = bundleFiles(programId, rows);
  const suffix = (build?.id ?? "NOBUILD").replace(/^BLD-/, "");
  const header: ManifestHeader = {
    id: `BND-${programId.replace(/^PRG-/, "")}-${suffix}`,
    program: programId,
    build: build?.id ?? "—",
    created: bundleCreated,
    createdBy: program?.owner ?? "—",
    classification,
  };

  const bundle = assemble(
    header,
    files,
    `${program?.owner ?? "—"}, ISSM — transfer authority of record`,
    bundleCreated,
    `Outbound transfer set for ${program?.name ?? programId} against ${build?.name ?? "no authorized baseline"}. Generated from the live control matrix, composition graph and finding register — every artifact is derived, so regenerating this bundle from the same row set reproduces every digest exactly.`,
  );

  perProgram.set(programId, bundle);
  localCache.set(rows, perProgram);
  return bundle;
}

/* ── The received bundle ─────────────────────────────────────────────────── */

/**
 * The provider assessment summary the far side attached by hand.
 *
 * Attached rather than generated, which is exactly what `producer` exists to
 * record: nothing on this side produces this file, so the reconciliation
 * reports it as missing here rather than as a mismatch.
 */
const providerAssessmentSummary = [
  "PROVIDER ASSESSMENT SUMMARY — CUI",
  "",
  "Provider:            Corporate identity provider (idp-core), CMP-014",
  "Assessment version:  AR-2026.2",
  "Assessed on:         Aug 28, 2026",
  "Superseded:          AR-2026.1 (Feb 11, 2026)",
  "Prepared for:        Atlas payments platform (PRG-1041) — inheritance acceptance review",
  "",
  "Scope",
  "  The provider re-assessed the twelve controls it publishes to consuming",
  "  systems after the v4.2 upgrade of the brokered authentication path. The",
  "  upgrade replaced the SAML assertion consumer and changed the session",
  "  fixation defence, both of which sit under controls this program inherits.",
  "",
  "Result",
  "  Eleven of twelve controls re-assessed Satisfied. AC-2 remains Hybrid: the",
  "  provider disables an idle account at 35 days across every realm, but the",
  "  consuming system still owns its own account types, role-to-group mapping",
  "  and the quarterly recertification of those groups.",
  "",
  "Consumer action required",
  "  The Atlas acceptance on file names v4.1 / AR-2026.1. It must be re-signed",
  "  against v4.2 / AR-2026.2 before the inherited rows can be read as current.",
  "  Until it is, the consuming system's matrix is correct to show these rows as",
  "  inherited from an assessment it has not reviewed.",
  "",
  "Point of contact:    Dana Whitlock, ISSM — Corporate identity provider",
].join("\n");

/**
 * The far side's own export of the same program, as it arrived on write-once
 * media.
 *
 * Every byte of it is generated here so that every digest is a real digest of
 * real content. It differs from what this side generates in three specific,
 * believable ways, and each one is produced by actually generating the
 * different thing rather than by editing a hash:
 *
 *  - The SCTM export and the eMASS Control Information sheet were taken with
 *    the currency overlay suppressed — that is, as they read before the Aug
 *    27–28 change records were entered, with no determination retracted and no
 *    row flagged suspect.
 *  - The hardware baseline's C9300-24T line board row never carried the board
 *    revision, which is the classic defect of a hand-maintained eMASS hardware
 *    list.
 *  - It carries the provider assessment summary as an attachment, and it does
 *    not carry the OSCAL SSP, assessment plan or assessment results at all —
 *    the far side runs eMASS and exports the OSCAL POA&M only.
 */
function buildReceivedBundle(): TransferBundle {
  const programId = "PRG-1041";
  const currentRows = buildSctm(programId, controlMatrix(programId), null).rows;
  const priorRows = withoutCurrencyOverlay(
    () => buildSctm(programId, controlMatrix(programId), null).rows,
  );

  // The far side's hardware row for the line board never carried the revision.
  const hardware = emassFile("Hardware", programId, currentRows);
  const hardwareText = hardware.text
    .split("\r\n")
    .map((line) =>
      line.startsWith("C9300-24T line board,") ? line.replace(",Rev B2,", ",—,") : line,
    )
    .join("\r\n");

  const files: BundleFile[] = [
    oscalFile(oscalPoam(programId)),
    emassFile("Control Information", programId, priorRows),
    emassFile("POA&M", programId, currentRows),
    { ...hardware, text: hardwareText, producer: "eMASS Hardware Baseline export (far side)" },
    emassFile("Software", programId, currentRows),
    emassFile("Test Results", programId, currentRows),
    sctmFile(programId, priorRows),
    {
      path: "attachments/provider-assessment-AR-2026.2.txt",
      kind: "Attached document (plain text)",
      producer: "Attached by hand at the far side — not generated by this platform",
      text: providerAssessmentSummary,
    },
  ].map((file) =>
    file.producer.endsWith("(far side)")
      ? file
      : { ...file, producer: `${file.producer} (far side)` },
  );

  const header: ManifestHeader = {
    id: "BND-0117",
    program: programId,
    build: "BLD-0007",
    created: "Aug 29, 2026 16:05",
    createdBy: "Elena Marchetti, ISSO — Sierra Vista facility",
    classification,
  };

  return assemble(
    header,
    files,
    "Elena Marchetti, ISSO — Sierra Vista facility",
    "Aug 29, 2026 16:05",
    "Inbound transfer received Aug 30 on write-once media from the Sierra Vista facility. The far side runs eMASS and exports the eMASS sheets plus the OSCAL POA&M; it does not produce an OSCAL SSP, assessment plan or assessment results. Its control information and SCTM exports were taken before the Aug 27–28 change records were entered, so no determination in them carries a currency retraction or a suspect flag.",
  );
}

export const receivedBundles: TransferBundle[] = [buildReceivedBundle()];

/* ── Reconciliation ──────────────────────────────────────────────────────── */

/**
 * A readable window onto a line, centred on `at` so two excerpts of two
 * differing lines actually show the difference rather than the identical
 * prefix they happen to share.
 */
function excerpt(line: string, at: number): string {
  const from = Math.max(0, at - 30);
  const to = Math.min(line.length, from + 110);
  const body = line.slice(from, to);
  return `${from > 0 ? "…" : ""}${body}${to < line.length ? "…" : ""}`;
}

/** Index of the first character at which two strings diverge. */
function firstDifference(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  for (let i = 0; i < max; i += 1) if (a[i] !== b[i]) return i;
  return max;
}

/**
 * A real line-level comparison of the two texts. Used for the `detail`
 * sentence so a Changed row says what moved, not merely that something did.
 */
function textDelta(localText: string, remoteText: string): string {
  const a = localText.split(/\r?\n/);
  const b = remoteText.split(/\r?\n/);
  const max = Math.max(a.length, b.length);
  let differing = 0;
  let firstIndex = -1;
  for (let i = 0; i < max; i += 1) {
    if ((a[i] ?? "") !== (b[i] ?? "")) {
      differing += 1;
      if (firstIndex < 0) firstIndex = i;
    }
  }
  const lineNote =
    a.length === b.length
      ? `${a.length} lines on both sides`
      : `${a.length} lines here against ${b.length} received`;
  if (firstIndex < 0) {
    return `Every line matches once line endings are normalised (${lineNote}), so the two files differ only in their line terminators — one side wrote CRLF and the other LF.`;
  }
  const localLine = a[firstIndex] ?? "";
  const remoteLine = b[firstIndex] ?? "";
  const at = firstDifference(localLine, remoteLine);
  return `${differing} of ${max} lines differ (${lineNote}); the first is line ${firstIndex + 1}, from character ${at + 1} — here "${excerpt(localLine, at)}", received "${excerpt(remoteLine, at)}".`;
}

function detailFor(
  path: string,
  local: BundleArtifact | undefined,
  remote: BundleArtifact | undefined,
  localId: string,
  receivedId: string,
): { state: ReconcileState; detail: string } {
  if (local && remote) {
    if (local.sha256 === remote.sha256) {
      return {
        state: "Identical",
        detail: `Byte-identical — ${local.bytes.toLocaleString("en-US")} bytes under the same SHA-256 on both sides.`,
      };
    }
    const localText = contentIndex.get(`${localId}|${path}`);
    const remoteText = contentIndex.get(`${receivedId}|${path}`);
    const size = `${local.bytes.toLocaleString("en-US")} bytes here against ${remote.bytes.toLocaleString("en-US")} received`;
    if (localText !== undefined && remoteText !== undefined) {
      return { state: "Changed", detail: `${size}. ${textDelta(localText, remoteText)}` };
    }
    return {
      state: "Changed",
      detail: `${size}, and the digests differ. The received content is not held on this side, so only the manifest rows could be compared.`,
    };
  }
  if (local) {
    return {
      state: "Added on this side",
      detail: `Generated here by ${local.producer} at ${local.bytes.toLocaleString("en-US")} bytes; the received manifest does not list this path at all.`,
    };
  }
  if (remote) {
    return {
      state: "Missing on this side",
      detail: `Listed in the received manifest at ${remote.bytes.toLocaleString("en-US")} bytes, produced by ${remote.producer}. Nothing on this side generates it, so it has to be taken from the received media.`,
    };
  }
  return { state: "Identical", detail: "—" };
}

export function reconcile(localId: string, receivedId: string): Reconciliation | null {
  const local = bundleById(localId);
  const received = bundleById(receivedId);
  if (!local || !received) return null;

  const localByPath = new Map(local.artifacts.map((a) => [a.path, a]));
  const remoteByPath = new Map(received.artifacts.map((a) => [a.path, a]));
  const paths = dedupe([...localByPath.keys(), ...remoteByPath.keys()]).sort();

  const rows: ReconcileRow[] = paths.map((path) => {
    const localArtifact = localByPath.get(path);
    const remoteArtifact = remoteByPath.get(path);
    const { state, detail } = detailFor(path, localArtifact, remoteArtifact, localId, receivedId);
    return {
      path,
      state,
      localHash: localArtifact?.sha256 ?? "—",
      remoteHash: remoteArtifact?.sha256 ?? "—",
      detail,
    };
  });

  const identical = rows.filter((r) => r.state === "Identical").length;
  const changed = rows.filter((r) => r.state === "Changed").length;
  const added = rows.filter((r) => r.state === "Added on this side").length;
  const missing = rows.filter((r) => r.state === "Missing on this side").length;

  // Re-derived, not read: the manifest is rebuilt from the received bundle's
  // own artifact rows and hashed again, and the result is compared to the value
  // the media carries.
  const rederived = sha256Hex(bundleManifest(received));
  const signatureValid = rederived === received.signature.value;

  const signatureNote = signatureValid
    ? `The manifest was rebuilt from the ${received.artifacts.length} artifact rows on the media and re-hashed; the result matches the digest the media carries (${rederived.slice(0, 16)}…). That proves the manifest is intact. It proves nothing about who produced it — ${signatureAlgorithm.toLowerCase()}, and this build holds no key material, so authenticity rests on the chain of custody of the media, not on this value.`
    : `The manifest rebuilt from the ${received.artifacts.length} artifact rows hashes to ${rederived.slice(0, 16)}…, which does not match the ${received.signature.value.slice(0, 16)}… the media carries. The manifest and the artifact rows disagree; treat the media as untrusted and request a re-transfer.`;

  const changedPaths = rows.filter((r) => r.state === "Changed").map((r) => r.path);
  const missingPaths = rows.filter((r) => r.state === "Missing on this side").map((r) => r.path);

  const differences: string[] = [];
  if (changed > 0) differences.push(`${changed} ${changed === 1 ? "differs" : "differ"}`);
  if (added > 0) differences.push(`${added} ${added === 1 ? "exists" : "exist"} only here`);
  if (missing > 0) {
    differences.push(`${missing} ${missing === 1 ? "exists" : "exist"} only on the media`);
  }

  // Every clause below names the paths it is about rather than asserting a
  // reason for the difference; the reason, where there is one, is in the row's
  // own `detail`, which is a real line-level comparison.
  const sentences: string[] = [
    `The manifest verifies and ${identical} of ${rows.length} artifacts are byte-identical, but ${differences.join(", ")}.`,
  ];
  if (changedPaths.length > 0) {
    sentences.push(
      `${changedPaths.join(", ")} ${changedPaths.length === 1 ? "does" : "do"} not match what this side generates today, so ${changedPaths.length === 1 ? "it is a historical snapshot" : "they are historical snapshots"} and must not be read as the current record.`,
    );
  }
  if (missingPaths.length > 0) {
    sentences.push(
      `Take ${missingPaths.join(", ")} from the received media — nothing on this side regenerates ${missingPaths.length === 1 ? "it" : "them"}.`,
    );
  }

  const verdict = !signatureValid
    ? `Do not import: the received manifest does not verify against its own digest, so the ${rows.length} artifact rows cannot be trusted to describe what is on the media.`
    : differences.length === 0
      ? `All ${rows.length} artifacts are byte-identical and the manifest verifies against its own digest; the two sides hold the same package.`
      : sentences.join(" ");

  return {
    bundle: local.id,
    received: received.id,
    rows,
    identical,
    changed,
    added,
    missing,
    signatureValid,
    signatureNote,
    verdict,
  };
}

/** Received bundles that describe a given program. */
export function receivedBundlesFor(programId: string): TransferBundle[] {
  return receivedBundles.filter((b) => b.program === programId);
}

/** The text of one artifact, for a download or a preview. Null when not held. */
export function bundleArtifactText(bundleId: string, path: string): string | null {
  return contentIndex.get(`${bundleId}|${path}`) ?? null;
}
