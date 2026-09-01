/**
 * Chunk 15a of the CCI spine — OSCAL 1.1.2 document generation.
 *
 * Everything the rest of this codebase holds — the composition graph, the
 * SCTM, the inheritance resolution, the T&E procedures, the finding register,
 * the risk scoring trail — exists in an assessor's world as four NIST OSCAL
 * documents: the SSP, the assessment plan, the assessment results and the
 * POA&M. This module is the projection. It writes real OSCAL 1.1.2 field names
 * and nesting, because the whole value of the artifact is that a receiving
 * tool can import it; a plausible-looking shape that fails validation is worth
 * less than no export at all.
 *
 * Invariants held here:
 *  - **Nothing is invented that can be checked.** Where this dataset does not
 *    carry a real external identifier — the SP 800-60 information-type ids, the
 *    NIST OSCAL catalog parameter ids — the field is omitted or the derivation
 *    is disclaimed in `remarks` rather than guessed at. A wrong `control-id` or
 *    a fabricated `information-type-id` discredits every correct field beside
 *    it.
 *  - **`stableUuid` is a real RFC 4122 version 5 UUID.** SHA-1 over a namespace
 *    UUID and a name, exactly as the RFC specifies, so the same seed yields the
 *    same uuid on every render, on the server and in the browser, forever. That
 *    determinism is what lets `@/lib/airgap` hash a generated bundle and have
 *    the hash mean something.
 *  - **`sha256Hex` is a real SHA-256**, implemented here rather than imported,
 *    because this build has no crypto dependency and a digest labelled SHA-256
 *    has to actually be SHA-256. It lives in this module rather than in
 *    `@/lib/airgap` so the dependency runs one way: airgap imports oscal.
 *  - **A deficiency is never laundered.** `implementation-status` maps
 *    `Other than satisfied` to `partial`, never to `planned` or
 *    `not-applicable`, and every status carries the determination verbatim in
 *    its remarks. A row whose determination the currency overlay retracted says
 *    so in remarks instead of quietly exporting the retracted claim.
 *  - **No clock.** `generated` and every OSCAL `last-modified` is the dataset's
 *    own date. Generating the same document twice produces identical bytes,
 *    which is the only reason a manifest hash over it is verifiable.
 *
 * Layering: this module reads from the spine and writes JSON. Nothing imports
 * it except `@/lib/airgap` and the export route, so it introduces no cycle.
 */

import { authorizedBuild } from "@/lib/baselines";
import { campaigns, objectiveById } from "@/lib/campaigns";
import {
  compositionEdges,
  descendantsOf,
  nodeById,
  nodesForProgram,
  pathLabel,
  type CompositionNode,
} from "@/lib/composition";
import { controlMatrix } from "@/lib/control-matrix";
import { assetById, assets, findings, isOpen, type Finding } from "@/lib/findings";
import {
  poamItems as oscalPoamItems,
  programs,
  type Milestone,
  type PoamItem as OscalPoamItem,
  type Program,
} from "@/lib/grc-data";
import { scansForProgram } from "@/lib/ingestion";
import { resolveInheritance, type ResolvedInheritance } from "@/lib/inheritance";
import {
  findingsForPoam,
  findingsForRisk,
  poamItems as registerPoamItems,
  registerRisks,
  worstSeverity,
} from "@/lib/register";
import { scoreRisk } from "@/lib/risk-scoring";
import type { SctmRow } from "@/lib/sctm";
import { effectsForScenario, phasesForProgram, scenariosForProgram } from "@/lib/te-phases";
import { procedures } from "@/lib/test-execution";

/* ── JSON model ──────────────────────────────────────────────────────────── */

export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
export type JsonObject = { [key: string]: JsonValue };

export type OscalModel =
  | "system-security-plan"
  | "assessment-plan"
  | "assessment-results"
  | "plan-of-action-and-milestones";

export type OscalDocument = {
  model: OscalModel;
  json: JsonValue;
  uuid: string;
  /** OSCAL `date-time-with-timezone`. The dataset's own date, never a clock. */
  generated: string;
};

/** The OSCAL release these documents are written against. */
export const oscalVersion = "1.1.2";

/** The dataset's "now", as an OSCAL `date-time-with-timezone`. */
export const oscalNow = "2026-08-30T12:00:00-04:00";

/** Custom property namespaces. Anything not in the OSCAL core vocabulary. */
export const equinoxNs = "https://equinox.example/ns/oscal";
export const emassNs = "https://equinox.example/ns/emass";

/**
 * The NIST SP 800-53 Rev. 5 HIGH baseline profile, as NIST publishes it. Used
 * as the SSP's `import-profile` href for a High-impact system.
 */
const nistProfiles: Record<string, string> = {
  High: "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_HIGH-baseline_profile.json",
  Moderate:
    "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
  Low: "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_LOW-baseline_profile.json",
};

/* ── SHA-256 ─────────────────────────────────────────────────────────────── */

/**
 * FIPS 180-4 SHA-256. Implemented rather than imported: this build ships no
 * crypto dependency, `crypto.subtle` is async and unavailable during SSR, and a
 * digest printed under the label "SHA-256" has to be one. Verified against the
 * FIPS 180-4 test vectors and against Node's own implementation.
 */
const k256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/** Merkle–Damgård padding shared by SHA-1 and SHA-256: 0x80, zeroes, 64-bit big-endian bit length. */
function padded(bytes: Uint8Array): Uint8Array {
  const bitLength = bytes.length * 8;
  const total = ((bytes.length + 9 + 63) >>> 6) << 6;
  const out = new Uint8Array(total);
  out.set(bytes);
  out[bytes.length] = 0x80;
  const view = new DataView(out.buffer);
  view.setUint32(total - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(total - 4, bitLength >>> 0, false);
  return out;
}

function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function sha256Bytes(input: Uint8Array): Uint8Array {
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const message = padded(input);
  const view = new DataView(message.buffer);
  const w = new Uint32Array(64);

  for (let offset = 0; offset < message.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i += 1) {
      const a = w[i - 15] ?? 0;
      const b = w[i - 2] ?? 0;
      const s0 = (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) >>> 0;
      const s1 = (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10)) >>> 0;
      w[i] = (((w[i - 16] ?? 0) + s0 + (w[i - 7] ?? 0) + s1) >>> 0) >>> 0;
    }

    let a = h[0] ?? 0;
    let b = h[1] ?? 0;
    let c = h[2] ?? 0;
    let d = h[3] ?? 0;
    let e = h[4] ?? 0;
    let f = h[5] ?? 0;
    let g = h[6] ?? 0;
    let hh = h[7] ?? 0;

    for (let i = 0; i < 64; i += 1) {
      const s1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const t1 = (hh + s1 + ch + (k256[i] ?? 0) + (w[i] ?? 0)) >>> 0;
      const s0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const t2 = (s0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }

    h[0] = ((h[0] ?? 0) + a) >>> 0;
    h[1] = ((h[1] ?? 0) + b) >>> 0;
    h[2] = ((h[2] ?? 0) + c) >>> 0;
    h[3] = ((h[3] ?? 0) + d) >>> 0;
    h[4] = ((h[4] ?? 0) + e) >>> 0;
    h[5] = ((h[5] ?? 0) + f) >>> 0;
    h[6] = ((h[6] ?? 0) + g) >>> 0;
    h[7] = ((h[7] ?? 0) + hh) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i += 1) outView.setUint32(i * 4, h[i] ?? 0, false);
  return out;
}

/** FIPS 180-4 SHA-1. Present only because RFC 4122 version 5 UUIDs are defined over SHA-1. */
function sha1Bytes(input: Uint8Array): Uint8Array {
  const h = new Uint32Array([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]);
  const message = padded(input);
  const view = new DataView(message.buffer);
  const w = new Uint32Array(80);

  for (let offset = 0; offset < message.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 80; i += 1) {
      const x = ((w[i - 3] ?? 0) ^ (w[i - 8] ?? 0) ^ (w[i - 14] ?? 0) ^ (w[i - 16] ?? 0)) >>> 0;
      w[i] = ((x << 1) | (x >>> 31)) >>> 0;
    }

    let a = h[0] ?? 0;
    let b = h[1] ?? 0;
    let c = h[2] ?? 0;
    let d = h[3] ?? 0;
    let e = h[4] ?? 0;

    for (let i = 0; i < 80; i += 1) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = ((b & c) ^ (~b & d)) >>> 0;
        k = 0x5a827999;
      } else if (i < 40) {
        f = (b ^ c ^ d) >>> 0;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = ((b & c) ^ (b & d) ^ (c & d)) >>> 0;
        k = 0x8f1bbcdc;
      } else {
        f = (b ^ c ^ d) >>> 0;
        k = 0xca62c1d6;
      }
      const temp = ((((a << 5) | (a >>> 27)) >>> 0) + f + e + k + (w[i] ?? 0)) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = temp;
    }

    h[0] = ((h[0] ?? 0) + a) >>> 0;
    h[1] = ((h[1] ?? 0) + b) >>> 0;
    h[2] = ((h[2] ?? 0) + c) >>> 0;
    h[3] = ((h[3] ?? 0) + d) >>> 0;
    h[4] = ((h[4] ?? 0) + e) >>> 0;
  }

  const out = new Uint8Array(20);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 5; i += 1) outView.setUint32(i * 4, h[i] ?? 0, false);
  return out;
}

const encoder = new TextEncoder();

function hex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

/**
 * Lowercase hex SHA-256 of a UTF-8 string. Pure: the same text always produces
 * the same digest, with no clock, no salt and no randomness.
 */
export function sha256Hex(text: string): string {
  return hex(sha256Bytes(encoder.encode(text)));
}

/* ── Deterministic identifiers ───────────────────────────────────────────── */

function uuidBytes(value: string): Uint8Array {
  const clean = value.replace(/-/g, "");
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function formatUuid(bytes: Uint8Array): string {
  const s = hex(bytes);
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

function uuidV5(namespace: string, name: string): string {
  const ns = uuidBytes(namespace);
  const nameBytes = encoder.encode(name);
  const buffer = new Uint8Array(ns.length + nameBytes.length);
  buffer.set(ns);
  buffer.set(nameBytes, ns.length);
  const digest = sha1Bytes(buffer).slice(0, 16);
  digest[6] = ((digest[6] ?? 0) & 0x0f) | 0x50; // version 5
  digest[8] = ((digest[8] ?? 0) & 0x3f) | 0x80; // RFC 4122 variant
  return formatUuid(digest);
}

/** RFC 4122 Appendix C, the URL namespace. */
const urlNamespace = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

/** This product's own UUID namespace, itself a v5 UUID under the URL namespace. */
export const equinoxUuidNamespace = uuidV5(urlNamespace, equinoxNs);

/**
 * A real RFC 4122 version 5 UUID — SHA-1 over the Equinox namespace and the
 * seed — so a re-export of the same content is byte-identical. Never call this
 * with anything that varies between renders.
 */
export function stableUuid(seed: string): string {
  return uuidV5(equinoxUuidNamespace, seed);
}

/* ── Small shape helpers ─────────────────────────────────────────────────── */

/** "AC-2(3)" → "ac-2.3" — the NIST OSCAL Rev. 5 catalog control identifier. */
export function oscalControlId(control: string): string {
  return control.toLowerCase().replace(/\((\w+)\)/g, ".$1");
}

/** Coerces a string into an OSCAL `token`: starts with a letter, then letters, digits, `.-_`. */
function token(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return /^[a-z_]/.test(cleaned) ? cleaned : `x-${cleaned}`;
}

/**
 * An SP 800-53A determination-statement label as an OSCAL token.
 * "AC-02a.[01]" → "ac-02a.01"; "AC-02(03)(a)" → "ac-02.03.a".
 */
function objectiveToken(label: string): string {
  return token(label.replace(/[[(]/g, ".").replace(/[\])]/g, ""))
    .replace(/\.{2,}/g, ".")
    .replace(/\.$/, "");
}

function prop(name: string, value: string, ns?: string): JsonObject {
  const out: JsonObject = { name, value };
  if (ns) out["ns"] = ns;
  return out;
}

function eq(name: string, value: string): JsonObject {
  return prop(name, value, equinoxNs);
}

function link(href: string, rel: string, text?: string): JsonObject {
  const out: JsonObject = { href, rel };
  if (text) out["text"] = text;
  return out;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

/**
 * Sets `key` on `object` only when the collection has members.
 *
 * Every single `"type": "array"` in OSCAL 1.1.2 carries `minItems: 1` — 137 of
 * 137 in the SSP schema, 194 of 194 in the assessment plan, 206 of 206 in the
 * assessment results, 199 of 199 in the POA&M. There is no array anywhere in
 * the model where `[]` is legal, so the way to say "there is nothing here" is
 * to omit the key, never to serialise an empty list. Every optional collection
 * in this module goes through this or through `listOf` below, and
 * `oscalEmptyArrays` re-checks the finished document.
 */
function putList(object: JsonObject, key: string, values: JsonValue[]): void {
  if (values.length > 0) object[key] = values;
}

/** The same rule as `putList`, spread into an object literal so key order holds. */
function listOf(key: string, values: JsonValue[]): JsonObject {
  return values.length > 0 ? { [key]: values } : {};
}

const monthIndex: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

/**
 * "Aug 27, 2026" or "Aug 27, 2026 04:10" → an OSCAL `date-time-with-timezone`.
 * Returns null for "—" and for anything that does not parse, so the caller can
 * omit the field rather than emit a malformed timestamp.
 */
function oscalStamp(display: string): string | null {
  const match = /^([A-Z][a-z]{2}) (\d{2}), (\d{4})(?: (\d{2}):(\d{2}))?$/.exec(display.trim());
  if (!match) return null;
  const month = monthIndex[match[1] ?? ""];
  if (!month) return null;
  const day = match[2] ?? "01";
  const year = match[3] ?? "2026";
  const hour = match[4] ?? "00";
  const minute = match[5] ?? "00";
  // The dataset's programs run on US Eastern time; Mar–Oct is daylight saving.
  const offset = month >= 3 && month <= 10 ? "-04:00" : "-05:00";
  return `${year}-${String(month).padStart(2, "0")}-${day}T${hour}:${minute}:00${offset}`;
}

/** "Apr 07 – Jun 18, 2025" → the two OSCAL timestamps that bound it. */
function windowRange(window: string): { start: string; end: string } | null {
  const match = /^([A-Z][a-z]{2}) (\d{2}) [–-] ([A-Z][a-z]{2}) (\d{2}), (\d{4})$/.exec(
    window.trim(),
  );
  if (!match) return null;
  const start = oscalStamp(`${match[1]} ${match[2]}, ${match[5]}`);
  const end = oscalStamp(`${match[3]} ${match[4]}, ${match[5]}`);
  if (!start || !end) return null;
  return { start, end };
}

function fipsLevel(level: string): string {
  return `fips-199-${level.toLowerCase()}`;
}

function programOf(programId: string): Program | null {
  return programs.find((p) => p.id.toLowerCase() === programId.toLowerCase()) ?? null;
}

/* ── Parties and roles ───────────────────────────────────────────────────── */

const roleDefinitions: { id: string; title: string }[] = [
  { id: "system-owner", title: "System Owner" },
  { id: "authorizing-official", title: "Authorizing Official" },
  { id: "system-security-officer", title: "Information System Security Manager" },
  { id: "assessor", title: "Security Control Assessor" },
  { id: "prepared-by", title: "Prepared By" },
  { id: "asset-owner", title: "Asset Owner" },
  { id: "common-control-provider", title: "Common Control Provider" },
  { id: "test-lead", title: "Test and Evaluation Lead" },
];

function partyUuid(name: string): string {
  return stableUuid(`party|${name}`);
}

function personParty(name: string): JsonObject {
  return { uuid: partyUuid(name), type: "person", name };
}

function orgParty(name: string): JsonObject {
  return { uuid: partyUuid(name), type: "organization", name };
}

/**
 * "Whitcombe LLP (assessor)" → "Whitcombe LLP".
 *
 * The POA&M register records an origin as the firm plus its role in
 * parentheses. The party of record is the firm, which is already declared, and
 * two parties for one organization is worse for a resolver than one — so the
 * parenthetical is stripped before the uuid is taken rather than minting a
 * near-duplicate.
 */
function partyName(value: string): string {
  return value.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

/**
 * The POA&M origin as a party, or null where the recorded origin names a
 * detection mechanism rather than an organization.
 *
 * "Internal continuous monitoring" is a source, not a party. An
 * `origins[].actors[]` entry pointing at it would be a reference that resolves
 * to nothing, so no actor is minted and the string is carried on the item as
 * an `origin-actor` prop instead — which is where it survives an import.
 */
function poamOriginParty(origin: string): string | null {
  if (/continuous monitoring/i.test(origin)) return null;
  const name = partyName(origin);
  return name.length > 0 ? name : null;
}

const programOffice = "Atlas program office";

type PartySet = { parties: JsonObject[]; responsible: JsonObject[] };

function partySet(program: Program, providers: ResolvedInheritance[]): PartySet {
  const programAssets = assets.filter((a) => a.program === program.id);
  const assetOwners = dedupe(programAssets.map((a) => a.owner)).sort();
  const providerOrgs = dedupe(providers.map((r) => r.component.provider)).sort();

  /*
   * `actor-uuid` is a reference, not a label: everyone a document names in an
   * `origins[].actors[]` has to be a party the document declares, or an
   * importer resolving provenance gets nothing back for who assessed the
   * finding and who raised the POA&M item. The assessment result names the
   * assessor of each finding, and the POA&M names the origin of each register
   * item and the owner of each remediation item, so all three are declared
   * here. `partySet` is shared by all four models, so the SSP and the plan
   * carry them too: a declared party nothing references is inert, while a
   * reference to a party nothing declares is a broken artifact.
   */
  const assetIds = new Set(programAssets.map((a) => a.id));
  const findingAssessors = dedupe(
    findings.filter((f) => assetIds.has(f.asset)).map((f) => f.assessment.assessedBy),
  ).sort();
  const poamOrigins = dedupe(
    oscalPoamItems
      .filter((i) => i.programId === program.id)
      .map((i) => poamOriginParty(i.origin))
      .filter((name): name is string => name !== null),
  ).sort();
  const poamOwners = dedupe(
    registerPoamItems.filter((i) => i.program === program.id).map((i) => i.owner),
  ).sort();

  const parties: JsonObject[] = [
    orgParty(programOffice),
    personParty(program.owner),
    personParty(program.authorizingOfficial),
    orgParty(program.assessor),
    ...assetOwners.map(orgParty),
    ...providerOrgs.map(orgParty),
    ...findingAssessors.map((name) => ({
      ...personParty(name),
      "member-of-organizations": [partyUuid(program.assessor)],
    })),
    ...poamOrigins.map(orgParty),
    ...poamOwners.map(orgParty),
  ];
  const seen = new Set<string>();
  const unique = parties.filter((p) => {
    const id = String(p["uuid"]);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const responsible: JsonObject[] = [
    { "role-id": "system-owner", "party-uuids": [partyUuid(program.owner)] },
    { "role-id": "system-security-officer", "party-uuids": [partyUuid(program.owner)] },
    {
      "role-id": "authorizing-official",
      "party-uuids": [partyUuid(program.authorizingOfficial)],
    },
    { "role-id": "assessor", "party-uuids": [partyUuid(program.assessor)] },
    { "role-id": "prepared-by", "party-uuids": [partyUuid(programOffice)] },
  ];
  if (assetOwners.length > 0) {
    responsible.push({ "role-id": "asset-owner", "party-uuids": assetOwners.map(partyUuid) });
  }
  if (providerOrgs.length > 0) {
    responsible.push({
      "role-id": "common-control-provider",
      "party-uuids": providerOrgs.map(partyUuid),
    });
  }
  return { parties: unique, responsible };
}

function metadata(
  program: Program,
  title: string,
  parties: PartySet,
  extraProps: JsonObject[] = [],
): JsonObject {
  return {
    title,
    published: oscalNow,
    "last-modified": oscalNow,
    version: `${program.id}-2026.08`,
    "oscal-version": oscalVersion,
    props: [prop("marking", "CUI//SP-PRIV"), ...extraProps],
    roles: roleDefinitions,
    parties: parties.parties,
    "responsible-parties": parties.responsible,
  };
}

/* ── Components and inventory ────────────────────────────────────────────── */

function componentUuid(id: string): string {
  return stableUuid(`component|${id}`);
}

function componentType(node: CompositionNode, isRoot: boolean): string {
  if (isRoot) return "this-system";
  if (node.kind === "System" || node.kind === "Subsystem" || node.kind === "Enclave")
    return "system";
  if (node.kind === "Service") return "service";
  if (node.class === "Hardware") return "hardware";
  return "software";
}

function nodeComponent(node: CompositionNode, isRoot: boolean): JsonObject {
  const props: JsonObject[] = [
    eq("component-kind", node.kind),
    eq("component-class", node.class),
    eq("part-key", node.partKey),
    eq("supplier", node.supplier),
    eq("supplier-origin", node.origin),
    eq("criticality", node.criticality),
    eq("trust-zone", node.zone),
    eq("bom-source", node.bomSource),
    eq("supplier-attested", node.attested ? "yes" : "no"),
  ];
  if (node.version !== "—") props.unshift(prop("version", node.version));
  if (node.digest) props.push(eq("component-digest", node.digest));
  if (node.partNumber) props.push(eq("part-number", node.partNumber));
  if (node.eol) props.push(eq("end-of-life", node.eol));
  if (node.bom) props.push(eq("bom-document", node.bom));
  if (node.asset) props.push(prop("asset-id", node.asset));

  const out: JsonObject = {
    uuid: componentUuid(node.id),
    type: componentType(node, isRoot),
    title: node.name,
    description: `${pathLabel(node.id)}. ${node.note}`,
    props,
    status: { state: "operational" },
  };
  if (node.parent) {
    out["links"] = [link(`#${componentUuid(node.parent)}`, "depends-on", "Parent component")];
  }
  return out;
}

function providerComponent(resolved: ResolvedInheritance): JsonObject {
  const component = resolved.component;
  const typeMap: Record<string, string> = {
    Service: "service",
    Platform: "system",
    Policy: "policy",
    Facility: "physical",
  };
  return {
    uuid: componentUuid(component.id),
    type: typeMap[component.type] ?? "service",
    title: component.name,
    description: component.summary,
    props: [
      prop("version", component.version),
      eq("provider", component.provider),
      eq("provider-authorization", component.authorization),
      eq("common-control-provider-tier", resolved.tier),
      eq("component-record", component.id),
    ],
    status: { state: "operational" },
    "responsible-roles": [
      {
        "role-id": "common-control-provider",
        "party-uuids": [partyUuid(component.provider)],
      },
    ],
  };
}

function inventoryItems(programId: string): JsonObject[] {
  return assets
    .filter((a) => a.program === programId)
    .map((asset) => {
      const anchor = nodeById.get(asset.node);
      const subtree = anchor ? descendantsOf(anchor.id) : [];
      const implemented = subtree.map((node) => ({
        "component-uuid": componentUuid(node.id),
        props: [eq("composition-path", pathLabel(node.id))],
      }));
      return {
        uuid: stableUuid(`inventory-item|${asset.id}`),
        description: `${asset.name} — ${asset.technology} in the ${asset.environment.toLowerCase()} environment, anchored to composition node ${asset.node}. The kind is carried as \`asset-kind\` in this product's namespace rather than as the core \`asset-type\` prop: OSCAL's asset-type vocabulary has no member that means "host" or "container image", and asserting one that does not fit would be a wrong value in a checkable field.`,
        props: [
          prop("asset-id", asset.id),
          eq("asset-kind", asset.kind),
          eq("environment", asset.environment),
          eq("last-scan", asset.lastScan),
          eq("ccis-covered", String(asset.ccisCovered)),
          eq("scanner-declared-cat-i", String(asset.openCatI)),
          eq("scanner-declared-cat-ii", String(asset.openCatII)),
          eq("scanner-declared-cat-iii", String(asset.openCatIII)),
        ],
        "responsible-parties": [
          { "role-id": "asset-owner", "party-uuids": [partyUuid(asset.owner)] },
        ],
        "implemented-components": implemented,
      } satisfies JsonObject;
    });
}

/* ── System characteristics ──────────────────────────────────────────────── */

function systemCharacteristics(program: Program): JsonObject {
  const nodes = nodesForProgram(program.id);
  const zones = dedupe(nodes.map((n) => n.zone));
  const crossings = compositionEdges.filter((e) => {
    const from = nodeById.get(e.from);
    const to = nodeById.get(e.to);
    return from && to && from.program === program.id && from.zone !== to.zone;
  });

  return {
    "system-ids": [
      { "identifier-type": "https://equinox.example/ns/system-id", id: program.system },
      { "identifier-type": "https://equinox.example/ns/program-id", id: program.id },
    ],
    "system-name": program.name,
    "system-name-short": program.acronym,
    description: program.summary,
    props: [
      eq("system-type", program.type),
      eq("hosting-environment", program.environment),
      eq("authorization-status", program.status),
      eq("catalog-baseline", program.baseline),
    ],
    "security-sensitivity-level": program.impact.toLowerCase(),
    "system-information": {
      /*
       * `system-information` is a closed assembly — {props, links,
       * information-types} — so the disclaimer rides as a prop. It is not
       * decoration: without it a reader cannot tell an omitted
       * `categorizations` from a forgotten one.
       */
      props: [
        eq(
          "categorization-basis",
          "The SP 800-60 Volume 2 information-type identifiers are not carried in this dataset, so `categorizations` is omitted rather than populated with a guessed identifier. The FIPS 199 impact values are the program's own categorization of record.",
        ),
      ],
      "information-types": [
        {
          uuid: stableUuid(`information-type|${program.id}|primary`),
          title: `${program.name} operational data`,
          description: program.summary,
          "confidentiality-impact": {
            base: fipsLevel(program.confidentiality),
            selected: fipsLevel(program.confidentiality),
          },
          "integrity-impact": {
            base: fipsLevel(program.integrity),
            selected: fipsLevel(program.integrity),
          },
          "availability-impact": {
            base: fipsLevel(program.availability),
            selected: fipsLevel(program.availability),
          },
        },
      ],
    },
    "security-impact-level": {
      "security-objective-confidentiality": fipsLevel(program.confidentiality),
      "security-objective-integrity": fipsLevel(program.integrity),
      "security-objective-availability": fipsLevel(program.availability),
    },
    status: {
      state:
        program.status === "Authorized" || program.status === "POA&M open"
          ? "operational"
          : "under-development",
      remarks: `Authorization status of record: ${program.status}. Authorized ${program.authorized}, expires ${program.expires}.`,
    },
    "authorization-boundary": {
      description: `The boundary is the ${nodes.length} composition nodes recorded for ${program.acronym} in ${program.environment}, spanning the ${zones.join(", ")} trust zones. Everything inside is configuration-managed under the authorized baseline; everything the system reaches outside it is an interconnection, not a component.`,
      remarks: `${crossings.length} recorded reachability edges cross a trust-zone boundary and are enumerated in the composition graph.`,
    },
    "network-architecture": {
      description: `Segmentation follows the trust-zone ranks on the composition nodes: ${zones.join(" → ")}. Reachability is an explicit edge list rather than a consequence of containment, so a path that crosses a boundary is visible as an edge and not inferred.`,
    },
    "data-flow": {
      description: compositionEdges
        .filter((e) => nodeById.get(e.from)?.program === program.id)
        .slice(0, 6)
        .map(
          (e) =>
            `${nodeById.get(e.from)?.name ?? e.from} ${e.kind.toLowerCase()} ${nodeById.get(e.to)?.name ?? e.to} (${e.via})`,
        )
        .join("; "),
    },
  };
}

function systemUsers(program: Program): JsonObject[] {
  return [
    {
      uuid: stableUuid(`user|${program.id}|operator`),
      title: "Mission operator",
      description: `Operates ${program.acronym} through the authenticated application routes; holds no administrative rights on any host in the boundary.`,
      "role-ids": ["system-owner"],
      "authorized-privileges": [
        {
          title: "Mission operation",
          "functions-performed": [
            "Submit and monitor mission transactions",
            "Read operational dashboards",
          ],
        },
      ],
    },
    {
      uuid: stableUuid(`user|${program.id}|administrator`),
      title: "Platform administrator",
      description:
        "Privileged access to the ground-control hosts and the database, obtained only through PIV-derived multifactor authentication and logged to the enclave audit sink.",
      "role-ids": ["asset-owner"],
      "authorized-privileges": [
        {
          title: "Privileged platform administration",
          "functions-performed": [
            "Apply configuration baselines",
            "Patch and reboot hosts in the boundary",
            "Administer the database instance",
          ],
        },
      ],
    },
    {
      uuid: stableUuid(`user|${program.id}|assessor`),
      title: "Security control assessor",
      description: `Read-only access granted to ${program.assessor} for the assessment period, scoped to evidence collection and configuration inspection.`,
      "role-ids": ["assessor"],
      "authorized-privileges": [
        {
          title: "Assessment access",
          "functions-performed": ["Collect evidence", "Read configuration and audit records"],
        },
      ],
    },
  ];
}

/* ── Control implementation ──────────────────────────────────────────────── */

function emassDesignation(origination: string): string {
  if (origination === "Common") return "Common";
  if (origination === "Hybrid") return "Hybrid";
  return "System-Specific";
}

type StatusMapping = { state: string; remarks: string };

/**
 * The SSP records what is implemented; the SAR records what was assessed. The
 * two are kept apart here, and the determination is repeated verbatim in the
 * remarks so nothing is lost in the mapping. `Other than satisfied` maps to
 * `partial` and never to `planned` or `not-applicable`.
 */
function implementationStatus(row: SctmRow): StatusMapping {
  const currency =
    row.currency === "Current"
      ? ""
      : ` Determination currency: ${row.currency} — ${row.currencyReason}`;
  switch (row.determination) {
    case "Not applicable":
      return {
        state: "not-applicable",
        remarks: `Scoped out: the requirement does not apply to this system. ${row.determinationNote}`,
      };
    case "Satisfied":
      return {
        state: "implemented",
        remarks: `Assessed Satisfied on ${row.assessed}. ${row.determinationNote}${currency}`,
      };
    case "Other than satisfied":
      return {
        state: "partial",
        remarks: `Assessed Other than satisfied${row.openFindings > 0 ? ` with ${row.openFindings} open finding${row.openFindings === 1 ? "" : "s"} (${row.findings.join(", ")})` : ""}. ${row.determinationNote}${currency}`,
      };
    default:
      if (row.priorDetermination === "Satisfied") {
        return {
          state: "implemented",
          remarks: `The implementation is asserted in the SSP, but the Satisfied determination recorded on ${row.assessed} was retracted and the requirement is awaiting re-assessment. ${row.currencyReason}`,
        };
      }
      if (row.assertion !== "—") {
        return {
          state: "implemented",
          remarks:
            "The implementation is asserted in the SSP; no assessment result is on file for this requirement, so nothing here claims it was verified.",
        };
      }
      return {
        state: "planned",
        remarks:
          "No implementation statement is authored and no assessment result is on file for this requirement.",
      };
  }
}

function setParameters(control: string, programId: string): JsonObject[] {
  const build = authorizedBuild(programId);
  if (!build) return [];
  const pins = build.parameters.filter((p) => p.control === control);
  const cid = oscalControlId(control);
  return pins.map((pin, index) => ({
    "param-id": `${cid}_prm_${index + 1}`,
    values: [pin.value],
    remarks: `Organization-defined value for "${pin.parameter}", pinned by ${build.id} (${build.name}), approved ${build.approved}. The parameter identifier is positional within this control's pinned parameters — this dataset does not carry the NIST OSCAL catalog parameter identifiers, so it is not resolved against them.`,
  }));
}

/**
 * The per-component half of an implemented requirement.
 *
 * Only the implementation STATE is carried here. The assessor's determination
 * prose belongs to the assessment result, where it is written once against the
 * requirement, not copied onto every component the requirement is allocated to
 * — a High-baseline SSP allocates most requirements to seven components, and
 * repeating a paragraph seven times per control produced a four-megabyte
 * document that said nothing seven times.
 */
function byComponent(
  row: SctmRow,
  componentUuidValue: string,
  description: string,
  extra: JsonObject = {},
): JsonObject {
  return {
    "component-uuid": componentUuidValue,
    uuid: stableUuid(`by-component|${row.key}|${componentUuidValue}`),
    description,
    "implementation-status": { state: implementationStatus(row).state },
    ...extra,
  };
}

/**
 * The SSP statements for one control.
 *
 * The uuid seed carries the program: `statement|AC-1|smt` would be the same
 * uuid in all five SSPs, and this is the key the assessment result joins back
 * on, so a non-unique one silently binds a finding to another program's
 * statement.
 */
function statementsFor(control: string, rows: SctmRow[], programId: string): JsonObject[] {
  const cid = oscalControlId(control);
  const byLetter = new Map<string, SctmRow[]>();
  for (const row of rows) {
    if (row.unit !== "Objective") continue;
    const match = /^[A-Z]{2}-\d{2}(?:\(\d{2}\))?([a-z])\./.exec(row.requirement);
    const letter = match?.[1];
    if (!letter) continue;
    const bucket = byLetter.get(letter);
    if (bucket) bucket.push(row);
    else byLetter.set(letter, [row]);
  }

  if (byLetter.size === 0) {
    return [
      {
        "statement-id": `${cid}_smt`,
        uuid: stableUuid(`statement|${programId}|${control}|smt`),
        props: [eq("requirement-rows", String(rows.length))],
        remarks: `No SP 800-53A determination statement is published for ${control} in this catalog slice, so the whole control statement is the unit of implementation. The implementation assertion is carried on the requirement.`,
      },
    ];
  }

  return [...byLetter.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([letter, group]) => ({
      "statement-id": `${cid}_smt.${letter}`,
      uuid: stableUuid(`statement|${programId}|${control}|${letter}`),
      props: group.map((row) => eq("assessment-objective", row.requirement)),
      remarks: group
        .map((row) => row.statement)
        .filter((s) => s && s !== "—")
        .join(" "),
    }));
}

/**
 * The `statement-id` → `uuid` map for one control, taken from the same builder
 * the SSP emits so the assessment result's `implementation-statement-uuid` and
 * the SSP's `statements[].uuid` cannot drift apart.
 */
function statementUuidsFor(
  control: string,
  rows: SctmRow[],
  programId: string,
): Map<string, string> {
  return new Map(
    statementsFor(control, rows, programId).map((s) => [
      String(s["statement-id"]),
      String(s["uuid"]),
    ]),
  );
}

function implementedRequirement(
  control: string,
  rows: SctmRow[],
  programId: string,
  resolved: ResolvedInheritance | undefined,
): JsonObject {
  const first = rows[0];
  if (!first) return {};
  const cid = oscalControlId(control);

  const nodes = dedupe(rows.flatMap((r) => r.responsibleNodes));
  const evidence = dedupe(rows.flatMap((r) => r.evidence));
  const findingIds = dedupe(rows.flatMap((r) => r.findings));
  const worstRow =
    rows.find((r) => r.determination === "Other than satisfied") ??
    rows.find((r) => r.determination === "Satisfied") ??
    first;

  const props: JsonObject[] = [
    eq("control-origination", first.origination),
    prop("security-control-designation", emassDesignation(first.origination), emassNs),
    eq("verification-method", first.method),
    eq("allocation-scope", first.allocationScope),
    eq("requirement-rows", String(rows.length)),
    eq("determination-currency", worstRow.currency),
  ];
  if (first.responsibleParty !== "—") props.push(eq("responsible-entity", first.responsibleParty));

  const links: JsonObject[] = evidence.map((id) =>
    link(`#${stableUuid(`resource|${id}`)}`, "evidence", id),
  );
  if (resolved) {
    links.push(
      link(
        `#${componentUuid(resolved.component.id)}`,
        "inherited-from",
        `${resolved.component.name} (${resolved.tier} common control provider)`,
      ),
    );
  }
  if (findingIds.length > 0) {
    for (const id of findingIds) {
      links.push(link(`#${stableUuid(`observation|finding|${id}`)}`, "related", id));
    }
  }

  const byComponents: JsonObject[] = [];

  if (resolved) {
    const providedUuid = stableUuid(`provided|${control}|${resolved.component.id}`);
    const responsibilityUuid = stableUuid(`responsibility|${control}|${resolved.component.id}`);
    const exportBlock: JsonObject = {
      description: `${resolved.component.name} publishes ${control} to consuming systems as a ${resolved.designation} control on assessment ${resolved.provided.assessmentVersion} (${resolved.provided.assessedOn}).`,
      provided: [
        {
          uuid: providedUuid,
          description: resolved.provided.assertion,
          "responsible-roles": [
            {
              "role-id": "common-control-provider",
              "party-uuids": [partyUuid(resolved.component.provider)],
            },
          ],
        },
      ],
    };
    if (resolved.consumerObligation !== "—") {
      exportBlock["responsibilities"] = [
        {
          uuid: responsibilityUuid,
          "provided-uuid": providedUuid,
          description: resolved.consumerObligation,
          "responsible-roles": [{ "role-id": "system-owner" }],
        },
      ];
    }
    byComponents.push(
      byComponent(
        worstRow,
        componentUuid(resolved.component.id),
        `${resolved.component.name} implements ${control} on behalf of consuming systems as a ${resolved.designation} control.`,
        { export: exportBlock },
      ),
    );
  }

  for (const nodeId of nodes) {
    const node = nodeById.get(nodeId);
    if (!node) continue;
    const row = rows.find((r) => r.responsibleNodes.includes(nodeId)) ?? worstRow;
    const extra: JsonObject = {};
    if (resolved) {
      const providedUuid = stableUuid(`provided|${control}|${resolved.component.id}`);
      extra["inherited"] = [
        {
          uuid: stableUuid(`inherited|${control}|${nodeId}`),
          "provided-uuid": providedUuid,
          description: `${node.name} takes ${control} from ${resolved.component.name} (${resolved.state}).`,
        },
      ];
      if (resolved.consumerObligation !== "—") {
        extra["satisfied"] = [
          {
            uuid: stableUuid(`satisfied|${control}|${nodeId}`),
            "responsibility-uuid": stableUuid(`responsibility|${control}|${resolved.component.id}`),
            description: `${node.name} discharges the consumer half of ${control}, as stated on the provider's responsibility above.`,
          },
        ];
      }
    }
    byComponents.push(
      byComponent(
        row,
        componentUuid(nodeId),
        `${node.name} (${node.kind}) is an enforcement point for ${control} on this system.`,
        extra,
      ),
    );
  }

  const out: JsonObject = {
    uuid: stableUuid(`implemented-requirement|${programId}|${control}`),
    "control-id": cid,
    props,
    statements: statementsFor(control, rows, programId),
    /*
     * An unallocated requirement omits the key rather than emitting `[]`: the
     * fact that nothing is allocated is disclosed in `remarks` below, which
     * survives an import, where an empty array is simply invalid.
     */
    ...listOf("by-components", byComponents),
    remarks: `${
      first.assertion !== "—"
        ? first.assertion
        : `No implementation statement is authored for ${control} in this SSP.`
    } ${implementationStatus(worstRow).remarks}`,
  };
  if (links.length > 0) out["links"] = links;
  const params = setParameters(control, programId);
  if (params.length > 0) out["set-parameters"] = params;
  if (byComponents.length === 0) {
    out["remarks"] =
      `${String(out["remarks"])} This requirement is not allocated to any component in the composition graph, so no by-component implementation is asserted.`;
  }
  return out;
}

/* ── Back matter ─────────────────────────────────────────────────────────── */

function evidenceResources(rows: SctmRow[]): JsonObject[] {
  return dedupe(rows.flatMap((r) => r.evidence))
    .sort()
    .map((id) => ({
      uuid: stableUuid(`resource|${id}`),
      title: id,
      description: /^EVD-/.test(id)
        ? `Evidence artifact ${id} held in the assessment record.`
        : `Provider attestation "${id}" carried on an inherited control offer.`,
      props: [eq("evidence-kind", /^EVD-/.test(id) ? "artifact" : "provider attestation")],
    }));
}

/* ── SSP ─────────────────────────────────────────────────────────────────── */

function emptyDocument(model: OscalModel, programId: string): OscalDocument {
  const uuid = stableUuid(`${model}|${programId}`);
  return {
    model,
    uuid,
    generated: oscalNow,
    json: {
      [model]: {
        uuid,
        metadata: {
          title: `${model} — program ${programId} is not in this catalog`,
          "last-modified": oscalNow,
          version: "0",
          "oscal-version": oscalVersion,
        },
      },
    },
  };
}

export function oscalSsp(programId: string, rows: SctmRow[]): OscalDocument {
  const program = programOf(programId);
  if (!program) return emptyDocument("system-security-plan", programId);

  const uuid = stableUuid(`system-security-plan|${program.id}`);
  const inheritance = resolveInheritance(program.id);
  const providers = [...inheritance.values()];
  const parties = partySet(program, providers);
  const nodes = nodesForProgram(program.id);
  const rootId = nodes.find((n) => n.parent === null)?.id ?? null;

  const providerComponents = dedupe(providers.map((r) => r.component.id))
    .map((id) => providers.find((r) => r.component.id === id))
    .filter((r): r is ResolvedInheritance => r !== undefined)
    .map(providerComponent);

  const byControl = new Map<string, SctmRow[]>();
  for (const row of rows) {
    const bucket = byControl.get(row.control);
    if (bucket) bucket.push(row);
    else byControl.set(row.control, [row]);
  }

  const implementedRequirements = [...byControl.entries()].map(([control, group]) =>
    implementedRequirement(control, group, program.id, inheritance.get(control)),
  );

  const build = authorizedBuild(program.id);
  const sspResources = evidenceResources(rows);

  const json: JsonObject = {
    "system-security-plan": {
      uuid,
      metadata: metadata(program, `${program.name} — System Security Plan`, parties, [
        eq("ssp-source", "Generated from the Equinox control matrix and composition graph"),
      ]),
      "import-profile": {
        href: nistProfiles[program.impact] ?? nistProfiles["Moderate"] ?? "",
        remarks: `${program.baseline}, as published by NIST in OSCAL.`,
      },
      "system-characteristics": systemCharacteristics(program),
      "system-implementation": {
        ...listOf(
          "props",
          build
            ? [
                eq("authorized-baseline", build.id),
                eq("authorized-baseline-name", build.name),
                eq("authorized-baseline-approved", build.approved),
              ]
            : [],
        ),
        ...listOf(
          "leveraged-authorizations",
          providers
          .filter(
            (r, index, all) => all.findIndex((x) => x.component.id === r.component.id) === index,
          )
            .map((r) => ({
              uuid: stableUuid(`leveraged-authorization|${program.id}|${r.component.id}`),
              title: `${r.component.name} — ${r.component.authorization}`,
              "party-uuid": partyUuid(r.component.provider),
              "date-authorized": (oscalStamp(r.provided.assessedOn) ?? oscalNow).slice(0, 10),
              remarks: `Accepted at ${r.component.name} ${r.accepted?.acceptedVersion ?? r.component.version}; the provider now ships ${r.component.version}.`,
            })),
        ),
        users: systemUsers(program),
        components: [
          ...nodes.map((node) => nodeComponent(node, node.id === rootId)),
          ...providerComponents,
        ],
        ...listOf("inventory-items", inventoryItems(program.id)),
      },
      "control-implementation": {
        description: `One implemented requirement per control in the ${program.baseline} tailored baseline. Each carries the components the requirement is allocated to, the organization-defined parameter values pinned by the authorized baseline, and — for common and hybrid controls — the provider's export and this system's inherited and satisfied responsibilities.`,
        "implemented-requirements": implementedRequirements,
      },
      // `back-matter` with no resources is legal but says nothing; omit both.
      ...(sspResources.length > 0 ? { "back-matter": { resources: sspResources } } : {}),
    },
  };

  return { model: "system-security-plan", json, uuid, generated: oscalNow };
}

/* ── Assessment plan ─────────────────────────────────────────────────────── */

function procedureActivity(procedureId: string): JsonObject | null {
  const procedure = procedures.find((p) => p.id === procedureId);
  if (!procedure) return null;
  const objective = objectiveById.get(procedure.objective);
  /*
   * A control-selection that includes nothing selects nothing, so the whole
   * `related-controls` assembly is dropped rather than left hollow.
   */
  const includeControls = dedupe(
    (objective?.ccis ?? []).flatMap((cci) =>
      findings.filter((f) => f.cci === cci).map((f) => f.control),
    ),
  ).map((control) => ({ "control-id": oscalControlId(control) }));
  return {
    uuid: stableUuid(`activity|${procedure.id}`),
    title: `${procedure.id} — ${procedure.title}`,
    description: `${objective?.statement ?? "Test objective not on file."} Written against ${procedure.nodes.join(", ")}; ${procedure.duration} minutes of wall clock; authored by ${procedure.author} at ${procedure.version}.`,
    props: [
      eq("verification-method", procedure.method),
      eq("test-objective", procedure.objective),
      eq("duration-minutes", String(procedure.duration)),
      ...procedure.preconditions.map((p) => eq("precondition", p)),
    ],
    steps: procedure.steps.map((step) => ({
      uuid: stableUuid(`activity-step|${step.id}`),
      title: `Step ${step.n}`,
      description: step.action,
      props: [eq("expected-result", step.expected), eq("evidence-to-collect", step.collect)],
    })),
    ...(includeControls.length > 0
      ? {
          "related-controls": {
            "control-selections": [
              {
                description: `Controls reached through the CCIs ${objective?.ccis.join(", ") ?? "—"} that ${procedure.id} proves.`,
                "include-controls": includeControls,
              },
            ],
          },
        }
      : {}),
    "responsible-roles": [{ "role-id": "test-lead" }],
  };
}

export function oscalAssessmentPlan(programId: string): OscalDocument {
  const program = programOf(programId);
  if (!program) return emptyDocument("assessment-plan", programId);

  const uuid = stableUuid(`assessment-plan|${program.id}`);
  const sspUuid = stableUuid(`system-security-plan|${program.id}`);
  const inheritance = resolveInheritance(program.id);
  const parties = partySet(program, [...inheritance.values()]);
  const matrix = controlMatrix(program.id);
  const programCampaigns = campaigns.filter((c) => c.program === program.id);
  const scans = scansForProgram(program.id);
  const tools = dedupe(scans.map((s) => s.tool)).sort();

  const activities = procedures
    .map((p) => procedureActivity(p.id))
    .filter((a): a is JsonObject => a !== null);
  const programAssets = assets.filter((a) => a.program === program.id);

  /*
   * A program with no tracked assets gets no inventory-item subject at all.
   * Omitting only `include-subjects` would leave an assessment-subject that
   * selects nothing, which is not an improvement on an empty array.
   */
  const assessmentSubjects: JsonObject[] = [
    {
      type: "component",
      description: `Every component in the ${program.acronym} composition graph.`,
      "include-all": {},
    },
  ];
  if (programAssets.length > 0) {
    assessmentSubjects.push({
      type: "inventory-item",
      description: "The tracked boundary assets.",
      "include-subjects": programAssets.map((a) => ({
        "subject-uuid": stableUuid(`inventory-item|${a.id}`),
        type: "inventory-item",
      })),
    });
  }

  /*
   * `assessment-assets` is optional at the plan root and requires at least one
   * `assessment-platforms` entry. A program with no scan runs of record has no
   * tooling to declare, and a platform that uses no components is a platform
   * that does nothing, so the whole assembly is dropped rather than emitted
   * hollow.
   */
  const assessmentAssets: JsonObject | null =
    tools.length > 0
      ? {
          components: tools.map((tool) => ({
            uuid: componentUuid(`tool|${tool}`),
            type: "software",
            title: tool,
            description: `Assessment tooling used to collect evidence against ${program.acronym}.`,
            props: [eq("assessment-tool", "yes")],
            status: { state: "operational" },
          })),
          "assessment-platforms": [
            {
              uuid: stableUuid(`assessment-platform|${program.id}`),
              title: `${program.acronym} assessment platform`,
              props: [eq("scan-runs-of-record", String(scans.length))],
              "uses-components": tools.map((tool) => ({
                "component-uuid": componentUuid(`tool|${tool}`),
              })),
            },
          ],
        }
      : null;

  const tasks: JsonObject[] = phasesForProgram(program.id).map((phase) => {
    const range = windowRange(phase.window);
    const task: JsonObject = {
      uuid: stableUuid(`task|${phase.id}`),
      type: "action",
      title: `${phase.id} — ${phase.name}`,
      description: phase.purpose,
      props: [
        eq("phase-kind", phase.kind),
        eq("phase-state", phase.state),
        eq("test-lead", phase.lead),
        eq("rmf-gate", phase.gate),
      ],
      "responsible-roles": [{ "role-id": "test-lead" }],
      subjects: [
        {
          type: "component",
          description: `Every component in the ${program.acronym} boundary.`,
          "include-all": {},
        },
      ],
    };
    if (range) task["timing"] = { "within-date-range": { start: range.start, end: range.end } };
    const phaseActivities = programCampaigns
      .filter((c) => phase.campaigns.includes(c.id))
      .flatMap(() => activities);
    if (phase.campaigns.length > 0 && phaseActivities.length > 0) {
      /*
       * `associated-activity` is a closed assembly with no `uuid` member: the
       * association is identified solely by the activity it names.
       */
      task["associated-activities"] = activities.map((activity) => ({
        "activity-uuid": activity["uuid"] as JsonValue,
        subjects: [
          {
            type: "component",
            description: "The components the procedure is written against.",
            "include-all": {},
          },
        ],
      }));
    }
    return task;
  });

  for (const campaign of programCampaigns) {
    const start = oscalStamp(`${campaign.opened}, 2026`);
    const end = oscalStamp(`${campaign.target}, 2026`);
    const task: JsonObject = {
      uuid: stableUuid(`task|${campaign.id}`),
      type: "milestone",
      title: `${campaign.id} — ${campaign.name}`,
      description: `${campaign.scope} Triggered by: ${campaign.trigger}. Gate served: ${campaign.gate}.`,
      props: [eq("campaign-state", campaign.state), eq("campaign-lead", campaign.lead)],
    };
    if (start && end) task["timing"] = { "within-date-range": { start, end } };
    else if (end) task["timing"] = { "on-date": { date: end } };
    tasks.push(task);
  }

  const json: JsonObject = {
    "assessment-plan": {
      uuid,
      metadata: metadata(program, `${program.name} — Security Assessment Plan`, parties),
      "import-ssp": {
        href: `#${sspUuid}`,
        remarks: `The ${program.acronym} System Security Plan generated from the same control matrix.`,
      },
      "local-definitions": {
        activities,
        remarks: `Activities are the ${activities.length} written test procedures of record, with their steps, expected results and required evidence carried verbatim.`,
      },
      "terms-and-conditions": {
        parts: [
          {
            name: "rules-of-engagement",
            title: "Rules of engagement",
            prose: `Testing is conducted against ${program.system} in ${program.environment}. Destructive techniques, denial-of-service and any action that would deny the mission function are out of scope for cooperative events and require written authorization from the ${program.acronym} test lead and the system owner for adversarial events. The assessor stops on discovery of an active compromise and notifies the ISSM before continuing.`,
          },
          {
            name: "scope-limitations",
            title: "Scope limitations",
            prose:
              "Common controls published by an external provider are assessed by reference to the provider's own assessment, not re-tested here; what is tested is this system's consumer obligation and the evidence that the offer applies to this inventory. Where a provider's assessment has moved since acceptance, the row is reported as inherited-but-not-current rather than as satisfied.",
          },
          {
            name: "notification",
            title: "Coordination and notification",
            prose: `The test lead notifies ${program.owner} and the platform on-call at least one business day before any event that touches the production boundary, and immediately on any unplanned outage attributable to the assessment.`,
          },
          {
            name: "data-handling",
            title: "Evidence and data handling",
            prose:
              "All collected evidence is CUI. Artifacts are hashed at collection, stored in the assessment record under their EVD- identifier, and transferred only through the accredited one-way path. No production data leaves the boundary.",
          },
        ],
      },
      "reviewed-controls": {
        description: `Every control in the ${program.baseline} tailored baseline for ${program.acronym}: ${matrix.length} controls.`,
        "control-selections": [
          {
            description: "The tailored baseline of record.",
            "include-controls": matrix.map((row) => ({ "control-id": oscalControlId(row.id) })),
          },
        ],
        "control-objective-selections": [
          {
            description:
              "Every published SP 800-53A assessment objective and DISA CCI decomposed from the selected controls. The decomposition is generated from the catalog rather than enumerated here.",
            "include-all": {},
          },
        ],
      },
      "assessment-subjects": assessmentSubjects,
      ...(assessmentAssets ? { "assessment-assets": assessmentAssets } : {}),
      ...listOf("tasks", tasks),
    },
  };

  return { model: "assessment-plan", json, uuid, generated: oscalNow };
}

/* ── Assessment results ──────────────────────────────────────────────────── */

const methodOf: Record<string, string> = {
  Examine: "EXAMINE",
  Interview: "INTERVIEW",
  Test: "TEST",
};

function findingObservation(finding: Finding): JsonObject {
  const node = finding.node ? nodeById.get(finding.node) : null;
  const asset = assetById.get(finding.asset);
  const collected = oscalStamp(finding.assessment.assessedOn) ?? oscalNow;
  const subjects: JsonObject[] = [];
  if (node) {
    subjects.push({
      "subject-uuid": componentUuid(node.id),
      type: "component",
      title: node.name,
      props: [eq("composition-path", pathLabel(node.id))],
    });
  }
  if (asset) {
    subjects.push({
      "subject-uuid": stableUuid(`inventory-item|${asset.id}`),
      type: "inventory-item",
      title: asset.name,
    });
  }
  return {
    uuid: stableUuid(`observation|finding|${finding.id}`),
    title: `${finding.id} — ${finding.title}`,
    description: finding.detail,
    props: [
      eq("finding-id", finding.id),
      eq("cci", finding.cci),
      eq("control", finding.control),
      eq("verification-path", finding.source),
      eq("raw-severity", finding.rawSeverity),
      eq("mitigated-severity", finding.mitigatedSeverity),
      eq("lifecycle", finding.lifecycle),
      eq("occurrences", String(finding.occurrences)),
      ...(finding.rule ? [eq("stig-rule", finding.rule)] : []),
    ],
    methods: [methodOf[finding.assessment.method] ?? "EXAMINE"],
    types: ["finding"],
    origins: [
      {
        actors: [
          {
            type: "party",
            "actor-uuid": partyUuid(finding.assessment.assessedBy),
            "role-id": "assessor",
          },
        ],
      },
    ],
    ...listOf("subjects", subjects),
    "relevant-evidence": dedupe([finding.sourceArtifact, ...finding.assessment.evidence]).map(
      (id) => ({
        href: `#${stableUuid(`resource|${id}`)}`,
        description: `Evidence artifact ${id}.`,
      }),
    ),
    collected,
    remarks: `${finding.assessment.procedure} Determination: ${finding.assessment.determination} Recommendation: ${finding.recommendation}`,
  };
}

function riskStatus(disposition: string): string {
  switch (disposition) {
    case "Accepted":
      return "deviation-approved";
    case "Deferred":
      return "deviation-requested";
    case "Rejected":
      return "closed";
    default:
      return "open";
  }
}

/**
 * The scoring engine, as a uuid and as a component.
 *
 * `riskCharacterizations` names this as the `tool` actor that computed the
 * facets. An `actor-uuid` is a reference, not a label, so the component it
 * names has to be declared in whatever document carries the characterization —
 * which is both the assessment result and the POA&M, since `registerRiskEntry`
 * is called from each.
 */
const riskScoringActorUuid = stableUuid("actor|equinox-risk-scoring");

function riskScoringComponent(): JsonObject {
  return {
    uuid: riskScoringActorUuid,
    type: "software",
    title: "Equinox residual risk scoring",
    description:
      "The scoring engine that produced the residual-score facets on each risk characterization: six weighted factors, each computed from recorded evidence rather than entered by hand.",
    props: [eq("assessment-tool", "yes")],
    status: { state: "operational" },
  };
}

/**
 * One component per distinct scanner that produced an observation. Each scan
 * observation names its tool as an `actor-uuid`, and an actor is a reference
 * rather than a label — so every tool named has to be declared somewhere in the
 * document or the reference dangles.
 */
function scanToolComponent(tool: string): JsonObject {
  return {
    uuid: componentUuid(`tool|${tool}`),
    type: "software",
    title: tool,
    description: `Scanner of record for the observations attributed to ${tool}.`,
    props: [eq("assessment-tool", "yes")],
    status: { state: "operational" },
  };
}

/**
 * The residual-score factors, exported as OSCAL risk characterization facets.
 * This is what makes the scoring trail portable: a receiving tool sees the same
 * six factors, their normalised values, their weights and the contribution each
 * made, rather than a bare number nobody can argue with.
 */
function riskCharacterizations(riskId: string): JsonObject[] {
  const score = scoreRisk(riskId);
  if (!score) return [];
  const facets: JsonObject[] = [
    {
      name: "residual-score",
      system: equinoxNs,
      value: String(score.score),
      props: [eq("band", score.band), eq("inherent-score", String(score.inherent))],
      remarks: score.leverage,
    },
    ...score.factors.map((factor) => ({
      name: factor.key,
      system: equinoxNs,
      value: factor.value.toFixed(3),
      props: [
        eq("factor-label", factor.label),
        eq("factor-input", factor.input),
        eq("factor-weight", factor.weight.toFixed(2)),
        eq("factor-contribution", String(factor.contribution)),
        ...factor.evidence.map((id) => eq("factor-evidence", id)),
      ],
      remarks: factor.rationale,
    })),
  ];
  return [
    {
      /*
       * `characterization` is a closed assembly — {props, links, origin,
       * facets} — with no `remarks`. The note is about the characterization as
       * a whole rather than about one factor, so it rides as a prop here rather
       * than on the residual-score facet, which does define `remarks`.
       */
      props: [
        eq(
          "characterization-note",
          score.caveats.length > 0
            ? `Provisional: ${score.caveats.join(" ")}`
            : "Every factor was computed from recorded evidence; no factor was defaulted.",
        ),
      ],
      origin: {
        actors: [{ type: "tool", "actor-uuid": riskScoringActorUuid }],
      },
      facets,
    },
  ];
}

function registerRiskEntry(riskId: string): JsonObject | null {
  const risk = registerRisks.find((r) => r.id === riskId);
  if (!risk) return null;
  const members = findingsForRisk(risk.id);
  const characterizations = riskCharacterizations(risk.id);
  const out: JsonObject = {
    uuid: stableUuid(`risk|${risk.id}`),
    title: `${risk.id} — ${risk.title}`,
    description: risk.statement,
    statement: risk.statement,
    props: [
      eq("risk-id", risk.id),
      eq("authored-likelihood", String(risk.likelihood)),
      eq("authored-impact", String(risk.impact)),
      eq("authored-inherent", String(risk.inherent)),
      eq("authored-residual", String(risk.residual)),
      eq("treatment", risk.treatment),
      eq("ao-disposition", risk.disposition),
      eq("last-reviewed", risk.reviewed),
    ],
    status: riskStatus(risk.disposition),
  };
  putList(
    out,
    "related-observations",
    members.map((f) => ({
      "observation-uuid": stableUuid(`observation|finding|${f.id}`),
    })),
  );
  const remarks: string[] = [];
  if (characterizations.length > 0) out["characterizations"] = characterizations;
  else {
    remarks.push(
      "No member finding of this risk could be scored, so no characterization is exported. The authored likelihood and impact are carried as properties and are not re-badged as a computed score.",
    );
  }
  if (risk.aoNote) remarks.push(`AO note: ${risk.aoNote}`);
  /*
   * `risk` is a closed assembly with no `remarks`. The prose folds into the
   * required `statement`, which until now was a verbatim copy of `description`
   * and so carried nothing an importer could not already read.
   */
  if (remarks.length > 0) out["statement"] = `${risk.statement} ${remarks.join(" ")}`;
  return out;
}

function sctmFinding(
  row: SctmRow,
  programId: string,
  statementUuids: Map<string, Map<string, string>>,
): JsonObject | null {
  if (row.determination !== "Satisfied" && row.determination !== "Other than satisfied") {
    return null;
  }
  const satisfied = row.determination === "Satisfied";
  const targetProps: JsonObject[] = [
    eq("requirement-unit", row.unit),
    eq("verification-method", row.method),
    eq("determination-currency", row.currency),
  ];
  let targetType: string;
  let targetId: string;
  if (row.unit === "CCI") {
    targetType = "objective-id";
    targetId = row.requirement;
    targetProps.push(eq("objective-system", "DISA Control Correlation Identifier"));
  } else if (row.unit === "Objective") {
    targetType = "objective-id";
    targetId = objectiveToken(row.requirement);
    targetProps.push(
      eq("assessment-objective-label", row.requirement),
      eq("objective-system", "NIST SP 800-53A Rev. 5 determination statement"),
    );
  } else {
    targetType = "statement-id";
    targetId = `${oscalControlId(row.control)}_smt`;
    targetProps.push(
      eq(
        "target-basis",
        "No CCI or SP 800-53A objective is published for this control, so the whole control statement is the target.",
      ),
    );
  }

  const status: JsonObject = {
    state: satisfied ? "satisfied" : "not-satisfied",
    reason: satisfied ? "pass" : "fail",
    remarks: row.determinationNote,
  };

  const statementLetter =
    row.unit === "Objective"
      ? /^[A-Z]{2}-\d{2}(?:\(\d{2}\))?([a-z])\./.exec(row.requirement)?.[1]
      : undefined;
  const cid = oscalControlId(row.control);
  const statementUuid = statementUuids
    .get(row.control)
    ?.get(statementLetter ? `${cid}_smt.${statementLetter}` : `${cid}_smt`);

  const label = row.unit === "Control" ? row.controlTitle : row.requirement;
  const out: JsonObject = {
    uuid: stableUuid(`finding|${programId}|${row.key}`),
    title: `${row.control} — ${label}`,
    description: row.statement !== "—" ? row.statement : row.controlTitle,
    props: [
      eq("sctm-row", row.key),
      eq("control-origination", row.origination),
      eq("responsible-entity", row.responsibleParty),
      ...(row.gap ? [eq("package-gap", row.gap)] : []),
    ],
    target: {
      type: targetType,
      "target-id": targetId,
      title: `${row.control} — ${label}`,
      props: targetProps,
      status,
      "implementation-status": { state: implementationStatus(row).state },
      ...(row.currency === "Current"
        ? {}
        : { remarks: `Determination currency ${row.currency}: ${row.currencyReason}` }),
    },
    /*
     * The field names the SSP *statement* this result assessed, not the
     * implemented requirement that contains it. It is resolved through the same
     * map the SSP emits, keyed on the statement-id the finding's own `target`
     * already names — keying on `row.unit === "Control"` instead would leave
     * every CCI row pointing at the wrong object, since `statementsFor` builds
     * letter buckets only from Objective rows.
     *
     * The guard is load-bearing: where a control mixes lettered and letter-less
     * Objective rows only the lettered statements exist, so a letter-less row
     * has no statement to name. Omitting an optional reference is correct
     * there; pointing at the wrong assembly is not.
     */
    ...(statementUuid ? { "implementation-statement-uuid": statementUuid } : {}),
  };
  if (row.findings.length > 0) {
    out["related-observations"] = row.findings.map((id) => ({
      "observation-uuid": stableUuid(`observation|finding|${id}`),
    }));
    const risks = dedupe(
      row.findings
        .map((id) => findings.find((f) => f.id === id)?.risk)
        .filter((id): id is string => typeof id === "string"),
    );
    if (risks.length > 0) {
      out["related-risks"] = risks.map((id) => ({ "risk-uuid": stableUuid(`risk|${id}`) }));
    }
  }
  return out;
}

export function oscalAssessmentResults(programId: string, rows: SctmRow[]): OscalDocument {
  const program = programOf(programId);
  if (!program) return emptyDocument("assessment-results", programId);

  const uuid = stableUuid(`assessment-results|${program.id}`);
  const apUuid = stableUuid(`assessment-plan|${program.id}`);
  const inheritance = resolveInheritance(program.id);
  const parties = partySet(program, [...inheritance.values()]);
  const programAssets = new Set(assets.filter((a) => a.program === program.id).map((a) => a.id));
  const programFindings = findings.filter((f) => programAssets.has(f.asset));
  const scans = scansForProgram(program.id);

  const cooperativeObservations: JsonObject[] = [
    ...programFindings.map(findingObservation),
    ...scans.map((scan) => ({
      uuid: stableUuid(`observation|scan|${scan.id}`),
      title: `${scan.id} — ${scan.tool} against ${scan.targets.join(", ")}`,
      description: scan.note,
      props: [
        eq("scan-run", scan.id),
        eq("scan-format", scan.format),
        eq("benchmark", scan.benchmark),
        eq("native-record-count", String(scan.rawItems)),
        eq("scan-state", scan.state),
        eq("source-file", scan.file),
        eq("source-file-sha256", scan.sha256),
      ],
      methods: ["TEST"],
      types: ["historic"],
      origins: [
        {
          actors: [{ type: "tool", "actor-uuid": componentUuid(`tool|${scan.tool}`) }],
        },
      ],
      ...listOf(
        "subjects",
        scan.targets
          .filter((id) => nodeById.has(id))
          .map((id) => ({
            "subject-uuid": componentUuid(id),
            type: "component",
            title: nodeById.get(id)?.name ?? id,
          })),
      ),
      collected: oscalStamp(scan.completed) ?? oscalNow,
    })),
  ];

  const riskEntries = dedupe(
    programFindings.map((f) => f.risk).filter((id): id is string => typeof id === "string"),
  )
    .sort()
    .map(registerRiskEntry)
    .filter((r): r is JsonObject => r !== null);

  /*
   * The same grouping the SSP uses, over the identical rows, so the statement
   * uuids the findings reference are the ones the SSP actually emits.
   */
  const byControl = new Map<string, SctmRow[]>();
  for (const row of rows) {
    const bucket = byControl.get(row.control);
    if (bucket) bucket.push(row);
    else byControl.set(row.control, [row]);
  }
  const statementUuids = new Map(
    [...byControl.entries()].map(
      ([control, group]) => [control, statementUuidsFor(control, group, program.id)] as const,
    ),
  );

  const sctmFindings = rows
    .map((row) => sctmFinding(row, program.id, statementUuids))
    .filter((f): f is JsonObject => f !== null);

  const undetermined = rows.length - sctmFindings.length;

  const scenarios = scenariosForProgram(program.id).filter((s) => s.status === "Executed");
  const adversarialObservations: JsonObject[] = scenarios.map((scenario) => {
    const effects = effectsForScenario(scenario.id);
    return {
      uuid: stableUuid(`observation|scenario|${scenario.id}`),
      title: `${scenario.id} — ${scenario.name}`,
      description: `${scenario.objective} Entry point ${scenario.entryPoint}; chain ${scenario.chain.map((t) => `${t.id} ${t.name}`).join(" → ")}.`,
      props: [
        eq("threat-scenario", scenario.id),
        eq("adversary-tier", scenario.tier),
        eq("mission-function", scenario.missionFunction),
        ...scenario.chain.map((t) => eq("attack-technique", `${t.id} — ${t.name} (${t.tactic})`)),
        ...effects.map((e) => eq("mission-effect", `${e.id} — ${e.effect}: ${e.observed}`)),
      ],
      methods: ["TEST"],
      types: ["finding"],
      ...listOf(
        "subjects",
        scenario.path
          .filter((id) => nodeById.has(id))
          .map((id) => ({
            "subject-uuid": componentUuid(id),
            type: "component",
            title: nodeById.get(id)?.name ?? id,
          })),
      ),
      collected: oscalNow,
      remarks: scenario.note,
    };
  });

  const resultComponents: JsonObject[] = [
    ...(riskEntries.some((r) => r["characterizations"] !== undefined)
      ? [riskScoringComponent()]
      : []),
    ...dedupe(scans.map((s) => s.tool)).map(scanToolComponent),
  ];

  const results: JsonObject[] = [
    {
      uuid: stableUuid(`result|${program.id}|cooperative`),
      title: "Cooperative control assessment",
      description: `The SP 800-53A assessment of record for ${program.acronym}: ${rows.length} requirement rows decomposed from the tailored baseline, evidenced by ${programFindings.length} findings and ${scans.length} scan runs.`,
      start: oscalStamp("Feb 03, 2026") ?? oscalNow,
      end: oscalNow,
      props: [
        eq("assessment-kind", "Cooperative"),
        eq("requirement-rows", String(rows.length)),
        eq("rows-without-a-determination", String(undetermined)),
      ],
      /*
       * A result's `local-definitions` is the only place in the assessment
       * results that can hold a component, and an `actor-uuid` is a REFERENCE,
       * not a label — every actor named anywhere in this result has to resolve
       * to something declared in the document. That means the scoring engine
       * the characterizations name AND each scanner the observations name.
       */
      ...(resultComponents.length > 0
        ? { "local-definitions": { components: resultComponents } }
        : {}),
      "reviewed-controls": {
        description: "Every control the SCTM decomposed for this program.",
        "control-selections": [
          {
            description: "The tailored baseline of record.",
            "include-controls": dedupe(rows.map((r) => r.control)).map((control) => ({
              "control-id": oscalControlId(control),
            })),
          },
        ],
      },
      ...listOf("observations", cooperativeObservations),
      ...listOf("risks", riskEntries),
      ...listOf("findings", sctmFindings),
      remarks: `${undetermined} of ${rows.length} requirement rows carry no OSCAL finding: SP 800-53A recognises only "satisfied" and "not-satisfied", and a row that is Not assessed or Not applicable has neither. They are visible in the SSP with their implementation status and are not silently reported as satisfied.`,
    },
  ];

  if (adversarialObservations.length > 0) {
    results.push({
      uuid: stableUuid(`result|${program.id}|adversarial`),
      title: "Adversarial cybersecurity assessment",
      description: `Executed threat scenarios against ${program.acronym}, with the mission effects each produced. These are observations against the system as a whole rather than determinations against a single requirement.`,
      start: oscalStamp("May 04, 2026") ?? oscalNow,
      end: oscalNow,
      props: [eq("assessment-kind", "Adversarial")],
      "reviewed-controls": {
        description:
          "Controls reached by the executed attack chains, through the findings the chains raised.",
        "control-selections": [
          {
            description: "Controls named by findings raised from an executed scenario.",
            "include-controls": dedupe(
              programFindings.filter((f) => isOpen(f)).map((f) => f.control),
            ).map((control) => ({ "control-id": oscalControlId(control) })),
          },
        ],
      },
      observations: adversarialObservations,
    });
  }

  const arResources = evidenceResources(rows);

  const json: JsonObject = {
    "assessment-results": {
      uuid,
      metadata: metadata(program, `${program.name} — Security Assessment Report`, parties),
      "import-ap": {
        href: `#${apUuid}`,
        remarks: `The ${program.acronym} Security Assessment Plan generated from the same T&E record.`,
      },
      "local-definitions": {
        remarks:
          "Components, inventory items and users are defined once in the System Security Plan this assessment imports; they are referenced here by uuid rather than redefined.",
      },
      results,
      ...(arResources.length > 0 ? { "back-matter": { resources: arResources } } : {}),
    },
  };

  return { model: "assessment-results", json, uuid, generated: oscalNow };
}

/* ── POA&M ───────────────────────────────────────────────────────────────── */

function poamRiskStatus(status: string): string {
  switch (status) {
    case "Open":
      return "open";
    case "Ongoing":
      return "remediating";
    case "Risk accepted":
      return "deviation-approved";
    case "Completed":
      return "closed";
    case "Deferred":
      return "deviation-requested";
    default:
      return "investigating";
  }
}

function milestoneTask(item: OscalPoamItem, milestone: Milestone): JsonObject {
  const out: JsonObject = {
    uuid: milestone.uuid,
    type: "milestone",
    title: `${milestone.id} — ${milestone.title}`,
    description: milestone.description,
    props: [
      prop("milestone-status", milestone.status, emassNs),
      ...(milestone.completedDate
        ? [prop("milestone-completed", milestone.completedDate, emassNs)]
        : []),
      eq("poam-item", item.poamId),
    ],
    timing: { "on-date": { date: milestone.targetDate } },
  };
  return out;
}

/**
 * OSCAL has no milestone object on `poam-item`; milestones belong to the
 * remediation of a risk. Where the item names an associated risk that risk
 * carries them; where it names none, the item is itself the risk — which is
 * what a POA&M item is in RMF — and one is minted deterministically from it.
 */
function poamRisks(items: OscalPoamItem[]): JsonObject[] {
  const risks = new Map<string, JsonObject>();

  for (const item of items) {
    const tasks = item.milestones.map((m) => milestoneTask(item, m));
    const remediation: JsonObject = {
      uuid: stableUuid(`remediation|${item.uuid}`),
      lifecycle: item.status === "Completed" ? "completed" : "planned",
      title: `Remediation plan for ${item.poamId}`,
      description: item.remarks,
      ...(tasks.length > 0 ? { tasks } : {}),
    };

    if (item.associatedRisks.length === 0) {
      risks.set(item.uuid, {
        uuid: stableUuid(`poam-risk|${item.uuid}`),
        title: item.title,
        description: item.description,
        statement: item.description,
        props: [
          eq("risk-source", "POA&M item"),
          prop("poam-id", item.poamId, emassNs),
          prop("severity", item.severity, emassNs),
        ],
        status: poamRiskStatus(item.status),
        "related-observations": item.relatedObservations.map((o) => ({
          "observation-uuid": o.observationUuid,
        })),
        remediations: [remediation],
        deadline: item.scheduledCompletion,
      });
      continue;
    }

    for (const associated of item.associatedRisks) {
      const existing = risks.get(associated.riskUuid);
      if (existing) {
        const list = existing["remediations"];
        if (Array.isArray(list)) list.push(remediation);
        continue;
      }
      const characterizations = riskCharacterizations(associated.riskId);
      const entry: JsonObject = {
        uuid: associated.riskUuid,
        title: associated.title,
        description: `Risk ${associated.riskId} as recorded in the ${items[0]?.programId ?? ""} risk register.`,
        statement: associated.title,
        props: [eq("risk-id", associated.riskId), prop("poam-id", item.poamId, emassNs)],
        status: poamRiskStatus(item.status),
        "related-observations": item.relatedObservations.map((o) => ({
          "observation-uuid": o.observationUuid,
        })),
        remediations: [remediation],
        deadline: item.scheduledCompletion,
      };
      if (characterizations.length > 0) entry["characterizations"] = characterizations;
      else {
        entry["remarks"] =
          `${associated.riskId} is not joined to a scored finding in this dataset, so no characterization is exported rather than a defaulted one.`;
      }
      risks.set(associated.riskUuid, entry);
    }
  }

  return [...risks.values()];
}

export function oscalPoam(programId: string): OscalDocument {
  const program = programOf(programId);
  if (!program) return emptyDocument("plan-of-action-and-milestones", programId);

  const uuid = stableUuid(`plan-of-action-and-milestones|${program.id}`);
  const sspUuid = stableUuid(`system-security-plan|${program.id}`);
  const inheritance = resolveInheritance(program.id);
  const parties = partySet(program, [...inheritance.values()]);
  const items = oscalPoamItems.filter((i) => i.programId === program.id);

  const observations: JsonObject[] = [];
  const seenObservations = new Set<string>();
  for (const item of items) {
    for (const observation of item.relatedObservations) {
      if (seenObservations.has(observation.observationUuid)) continue;
      seenObservations.add(observation.observationUuid);
      observations.push({
        uuid: observation.observationUuid,
        title: observation.title,
        description: `${observation.title} — collected in support of ${item.poamId}.`,
        props: [eq("detection-source", item.detectionSource), eq("origin-actor", item.origin)],
        methods: [observation.method],
        types: ["finding"],
        subjects: [
          {
            "subject-uuid": stableUuid(`system|${program.id}`),
            type: "component",
            title: program.name,
          },
        ],
        "relevant-evidence": [
          { href: observation.href, description: `Workpaper for ${observation.title}.` },
        ],
        collected: observation.collected,
      });
    }
  }

  const risks = poamRisks(items);

  const poamItemEntries: JsonObject[] = items.map((item) => {
    const relatedRisks = item.associatedRisks.length
      ? item.associatedRisks.map((r) => ({ "risk-uuid": r.riskUuid }))
      : [{ "risk-uuid": stableUuid(`poam-risk|${item.uuid}`) }];
    return {
      uuid: item.uuid,
      title: item.title,
      description: item.description,
      props: [
        prop("poam-id", item.poamId, emassNs),
        prop("status", item.status, emassNs),
        prop("severity", item.severity, emassNs),
        prop("office-org", item.pointOfContact, emassNs),
        prop("detection-source", item.detectionSource, emassNs),
        prop("scheduled-completion-date", item.scheduledCompletion, emassNs),
        prop("security-control-number", item.controls.join(", "), emassNs),
        ...item.props.map((p) =>
          p.ns ? prop(p.name, p.value, p.ns) : prop(p.name, p.value, equinoxNs),
        ),
      ],
      ...listOf(
        "links",
        item.links.map((l) => link(l.href, l.rel, l.text)),
      ),
      /*
       * The actor has to be the party `partySet` actually declared, which is
       * `poamOriginParty(origin)` — not the raw origin string. Deriving the uuid
       * from the raw string produced a reference to a party no document holds.
       * An origin that maps to no party (continuous monitoring is nobody) gets
       * no origins block rather than a dangling one.
       */
      ...(poamOriginParty(item.origin) !== null
        ? {
            origins: [
              {
                actors: [
                  {
                    type: "party",
                    "actor-uuid": partyUuid(poamOriginParty(item.origin) as string),
                    "role-id": "assessor",
                  },
                ],
              },
            ],
          }
        : {}),
      ...listOf(
        "related-observations",
        item.relatedObservations.map((o) => ({
          "observation-uuid": o.observationUuid,
        })),
      ),
      "related-risks": relatedRisks,
      remarks: item.remarks,
    };
  });

  /*
   * The finding-joined remediation register carries its own POA&M items, and a
   * POA&M export that dropped them would understate the program's commitments.
   * They are emitted alongside the OSCAL-shaped items with deterministic uuids,
   * their findings as observations and their register risk as the related risk,
   * so the OSCAL and eMASS POA&M carry exactly the same item set.
   */
  for (const item of registerPoamItems.filter((i) => i.program === program.id)) {
    const members = findingsForPoam(item.id);
    for (const finding of members) {
      const observationUuid = stableUuid(`observation|finding|${finding.id}`);
      if (seenObservations.has(observationUuid)) continue;
      seenObservations.add(observationUuid);
      observations.push(findingObservation(finding));
    }

    const remediation: JsonObject = {
      uuid: stableUuid(`remediation|${item.id}`),
      lifecycle: item.status === "Completed" ? "completed" : "planned",
      title: `Remediation plan for ${item.id}`,
      description: item.remediation,
      "required-assets": [
        {
          uuid: stableUuid(`required-asset|${item.id}`),
          title: "Resources required",
          description: item.resources,
        },
      ],
      tasks: [
        {
          uuid: stableUuid(`milestone|${item.id}`),
          type: "milestone",
          title: `Scheduled completion of ${item.id}`,
          description: item.milestoneNote,
          props: [
            prop("original-completion-date", item.originalCompletion, emassNs),
            prop("scheduled-completion-date", item.scheduledCompletion, emassNs),
          ],
          ...(oscalStamp(item.scheduledCompletion)
            ? { timing: { "on-date": { date: oscalStamp(item.scheduledCompletion) ?? oscalNow } } }
            : {}),
        },
      ],
    };

    let riskUuid: string;
    if (item.risk) {
      riskUuid = stableUuid(`risk|${item.risk}`);
      const existing = risks.find((r) => r["uuid"] === riskUuid);
      if (existing) {
        const list = existing["remediations"];
        if (Array.isArray(list)) list.push(remediation);
        else existing["remediations"] = [remediation];
      } else {
        const entry = registerRiskEntry(item.risk);
        if (entry) {
          entry["remediations"] = [remediation];
          risks.push(entry);
        }
      }
    } else {
      riskUuid = stableUuid(`poam-risk|${item.id}`);
      risks.push({
        uuid: riskUuid,
        title: item.title,
        description: item.remediation,
        statement: item.remediation,
        props: [eq("risk-source", "POA&M item"), prop("poam-id", item.id, emassNs)],
        status: poamRiskStatus(item.status),
        "related-observations": members.map((f) => ({
          "observation-uuid": stableUuid(`observation|finding|${f.id}`),
        })),
        remediations: [remediation],
      });
    }

    const worst = worstSeverity(members);
    poamItemEntries.push({
      uuid: stableUuid(`poam-item|${item.id}`),
      title: item.title,
      description: item.remediation,
      props: [
        prop("poam-id", item.id, emassNs),
        prop("status", item.status, emassNs),
        prop("office-org", item.owner, emassNs),
        prop("resources-required", item.resources, emassNs),
        prop("scheduled-completion-date", item.scheduledCompletion, emassNs),
        prop("original-completion-date", item.originalCompletion, emassNs),
        prop(
          "security-control-number",
          dedupe(members.map((f) => f.control)).join(", ") || "—",
          emassNs,
        ),
        prop("raw-severity", worst ?? "—", emassNs),
        prop(
          "source-identifying-vulnerability",
          dedupe(members.map((f) => f.source)).join(", ") || "Internal continuous monitoring",
          emassNs,
        ),
        eq("poam-source", "Finding-joined remediation register"),
      ],
      origins: [
        {
          actors: [
            { type: "party", "actor-uuid": partyUuid(item.owner), "role-id": "system-owner" },
          ],
        },
      ],
      ...listOf(
        "related-observations",
        members.map((f) => ({
          "observation-uuid": stableUuid(`observation|finding|${f.id}`),
        })),
      ),
      "related-risks": [{ "risk-uuid": riskUuid }],
      remarks: item.milestoneNote,
    });
  }

  const nodes = nodesForProgram(program.id);
  const rootId = nodes.find((n) => n.parent === null)?.id ?? null;

  /*
   * The risks carried here reuse the assessment results' characterizations, and
   * those name the scoring engine as their actor. An actor is a reference, so
   * the engine has to be declared in THIS document too — the assessment results
   * declaring it does not help a POA&M transferred on its own.
   */
  const localComponents = [
    ...nodes
      .filter((n) => n.asset !== null || n.id === rootId)
      .map((n) => nodeComponent(n, n.id === rootId)),
    ...(risks.some((r) => r["characterizations"] !== undefined) ? [riskScoringComponent()] : []),
  ];
  const localInventory = inventoryItems(program.id);
  const localDefinitions: JsonObject = {
    ...listOf("components", localComponents),
    ...listOf("inventory-items", localInventory),
    remarks:
      "Only the boundary assets, the system root and the scoring engine the risk characterizations name are redefined here so the POA&M can stand alone if the SSP is not transferred with it; the full component set lives in the SSP.",
  };

  const resources = dedupe(items.flatMap((i) => i.links.map((l) => l.text)))
    .sort()
    .map((title) => ({
      uuid: stableUuid(`resource|${title}`),
      title,
      description: `Referenced from a POA&M item in the ${program.acronym} register.`,
    }));

  /**
   * `poam-items` is the one collection that is BOTH required at the root and
   * `minItems: 1`, so OSCAL simply cannot express an empty POA&M: omitting the
   * key trades a minItems error for a required one. A program with nothing open
   * therefore carries one item that says exactly that — a true statement, rather
   * than an invented weakness.
   */
  const poamItemsOut: JsonValue[] =
    poamItemEntries.length > 0
      ? poamItemEntries
      : [
          {
            uuid: stableUuid(`poam-item|none|${program.id}`),
            title: "No open POA&M items",
            description: `No open POA&M item is of record for ${program.acronym} as of ${oscalNow.slice(0, 10)}.`,
          },
        ];

  const json: JsonObject = {
    "plan-of-action-and-milestones": {
      uuid,
      metadata: metadata(program, `${program.name} — Plan of Action and Milestones`, parties),
      "import-ssp": { href: `#${sspUuid}` },
      "system-id": {
        "identifier-type": "https://equinox.example/ns/system-id",
        id: program.system,
      },
      "local-definitions": localDefinitions,
      ...listOf("observations", observations),
      ...listOf("risks", risks),
      "poam-items": poamItemsOut,
      ...(resources.length > 0 ? { "back-matter": { resources } } : {}),
    },
  };

  return { model: "plan-of-action-and-milestones", json, uuid, generated: oscalNow };
}

/* ── Serialization ───────────────────────────────────────────────────────── */

/**
 * The document as the bytes that would be written to disk. Two-space indent and
 * a trailing newline, matching NIST's own published OSCAL content, and stable
 * for a given document because every value in it is derived rather than
 * observed.
 */
export function oscalJson(doc: OscalDocument): string {
  return `${JSON.stringify(doc.json, null, 2)}\n`;
}

/** The four documents this module can produce, in package order. */
export const oscalModels: OscalModel[] = [
  "system-security-plan",
  "assessment-plan",
  "assessment-results",
  "plan-of-action-and-milestones",
];

export const oscalModelLabels: Record<OscalModel, string> = {
  "system-security-plan": "System Security Plan",
  "assessment-plan": "Assessment Plan",
  "assessment-results": "Assessment Results",
  "plan-of-action-and-milestones": "Plan of Action and Milestones",
};

/** Every model for a program, in package order. */
export function oscalPackage(programId: string, rows: SctmRow[]): OscalDocument[] {
  return [
    oscalSsp(programId, rows),
    oscalAssessmentPlan(programId),
    oscalAssessmentResults(programId, rows),
    oscalPoam(programId),
  ];
}
