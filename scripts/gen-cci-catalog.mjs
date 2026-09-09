#!/usr/bin/env node
/**
 * Generate the DISA CCI layer from the raw U_CCI_List_2024.xml.
 *
 *   node scripts/gen-cci-catalog.mjs
 *
 * Writes:
 *   src/lib/cci-catalog.ts        always-loaded, prose-free index + crosswalk
 *   src/lib/cci-text/<family>.ts  per-family CCI definitions (the prose)
 *
 * Node built-ins only. The XML is a small, regular, entity-free document, so it
 * is scanned with a tolerant reader rather than a parser dependency; the default
 * namespace (xmlns="http://iase.disa.mil/cci") is simply never consulted, which
 * is the whole reason a namespace-aware XPath returns nothing on this file.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The one control-id implementation in the repo. Node strips the types.
import { controlIdFromOscalId, normalizeControlId } from "../src/lib/control-id.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const corpus = path.join(root, "docs/examples/weapons_system_oscal_dummy");
const CCI_XML = path.join(corpus, "raw/cci/U_CCI_List_2024.xml");
const OSCAL_CATALOG = path.join(corpus, "raw/nist/NIST_SP-800-53_rev5_catalog.json");

const OUT_INDEX = path.join(root, "src/lib/cci-catalog.ts");
const OUT_TEXT_DIR = path.join(root, "src/lib/cci-text");

/** Provenance, copied from raw/source-manifest.json + raw/fetch-report.json. */
const PROVENANCE = {
  sourceId: "disa-cci-list-2024-mirror",
  authority: "DISA",
  file: "U_CCI_List_2024.xml",
  sourceUrl:
    "https://raw.githubusercontent.com/CyberSecDef/Cyber.Trackr.Live/master/cyber.trackr.live/resources/data/cci/U_CCI_List_2024.xml",
  officialLandingPage: "https://www.cyber.mil/stigs/downloads/",
  sha256: "5548e327ed0f5b920928787fd498b7d192d638bdcb09cc891085b26ea2785795",
  bytes: 3223829,
};

function die(message) {
  console.error(`\ngen-cci-catalog: ${message}\n`);
  process.exit(1);
}

function requireFile(file, role) {
  if (existsSync(file)) return;
  die(
    `missing ${role}\n  ${file}\n\n` +
      `The reference corpus is git-ignored. Hydrate it with:\n` +
      `  cd ${path.relative(root, corpus)} && python3 raw/fetch_reference_data.py\n` +
      `  cd ${path.relative(root, corpus)} && python3 raw/normalize_reference_data.py`,
  );
}

// ---------------------------------------------------------------------------
// XML reading
// ---------------------------------------------------------------------------

const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeXml(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body) => {
    if (body.startsWith("#x") || body.startsWith("#X"))
      return String.fromCodePoint(parseInt(body.slice(2), 16));
    if (body.startsWith("#")) return String.fromCodePoint(Number(body.slice(1)));
    const named = NAMED_ENTITIES[body];
    return named ?? whole;
  });
}

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) out[m[1]] = decodeXml(m[2]);
  return out;
}

function childText(block, name) {
  const m = block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decodeXml(m[1]).trim() : null;
}

function childTexts(block, name) {
  const out = [];
  for (const m of block.matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "g"))) {
    out.push(decodeXml(m[1]).trim());
  }
  return out;
}

function readCciList(file) {
  const xml = readFileSync(file, "utf8");
  if (!/xmlns\s*=\s*"http:\/\/iase\.disa\.mil\/cci"/.test(xml)) {
    die(`${file} does not declare the DISA CCI namespace — is this the right file?`);
  }
  if (/<!\[CDATA\[/.test(xml))
    die("unexpected CDATA in the CCI list; the tolerant reader would mangle it");

  const metaBlock = xml.match(/<metadata>([\s\S]*?)<\/metadata>/);
  if (!metaBlock) die("no <metadata> block in the CCI list");
  const version = childText(metaBlock[1], "version");
  const publishDate = childText(metaBlock[1], "publishdate");

  const items = [];
  for (const m of xml.matchAll(/<cci_item\b([^>]*)>([\s\S]*?)<\/cci_item>/g)) {
    const id = attrs(m[1]).id;
    const block = m[2];
    const references = [];
    for (const r of block.matchAll(/<reference\b([^>]*?)\/>/g)) {
      const a = attrs(r[1]);
      references.push({
        creator: a.creator ?? "",
        title: a.title ?? "",
        version: a.version ?? "",
        location: a.location ?? "",
        index: a.index ?? "",
      });
    }
    items.push({
      id,
      status: childText(block, "status") ?? "",
      publishDate: childText(block, "publishdate") ?? "",
      contributor: childText(block, "contributor") ?? "",
      definition: childText(block, "definition") ?? "",
      types: childTexts(block, "type"),
      // <parameter> / <note> are in the schema but empty in every 2024 record;
      // count them so a future release that fills them in fails this generator
      // loudly instead of silently dropping content.
      parameters: childTexts(block, "parameter").filter((v) => v !== ""),
      notes: childTexts(block, "note").filter((v) => v !== ""),
      references,
    });
  }
  return { version, publishDate, items };
}

// ---------------------------------------------------------------------------
// The Rev. 5 control id set (the join target)
// ---------------------------------------------------------------------------

function readControlIds(file) {
  const catalog = JSON.parse(readFileSync(file, "utf8")).catalog;
  const ids = new Map(); // control id -> family
  const families = [];
  const walkControls = (controls, family) => {
    for (const c of controls ?? []) {
      const id = controlIdFromOscalId(c.id);
      if (id) ids.set(id, family);
      walkControls(c.controls, family);
    }
  };
  const walkGroups = (groups) => {
    for (const g of groups ?? []) {
      const family = String(g.id ?? "").toUpperCase();
      if (family) families.push({ id: family, name: g.title });
      walkControls(g.controls, family);
      walkGroups(g.groups);
    }
  };
  walkGroups(catalog.groups);
  return { ids, families, version: catalog.metadata?.version ?? "" };
}

// ---------------------------------------------------------------------------
// Reference index -> control id
// ---------------------------------------------------------------------------

const REVISION_BY_TITLE = new Map([
  ["NIST SP 800-53", "800-53r3"],
  ["NIST SP 800-53 Revision 4", "800-53r4"],
  ["NIST SP 800-53 Revision 5", "800-53r5"],
  ["NIST SP 800-53A", "800-53Ar1"],
]);

const REV_CODE = { "800-53r3": "3", "800-53r4": "4", "800-53r5": "5", "800-53Ar1": "A" };

/**
 * Parse one free-text reference index.
 *
 * Rev. 3/4/5 indexes read "AC-2", "AC-2 (1)", "AC-1 a 1 (a)", "IA-5 (2) (b) (1)",
 * "CP-9 (a)". A parenthesised NUMBER straight after the control number is the
 * enhancement; a parenthesised LETTER is a statement item. 800-53A Rev. 1 indexes
 * read "AC-1.1 (i and ii)" / "AC-2 (1).2 (ii)" — Rev-3-era objective numbering,
 * so only the control portion is parsed and the objective path is left verbatim.
 *
 * Returns { ids: string[], item: string | null }.
 */
const INDEX_HEAD = /([A-Za-z]{2})-0*(\d+)\s*(?:\(0*(\d+)\))?/g;

function parseIndex(rawIndex) {
  const ids = [];
  let item = null;
  for (const piece of rawIndex.split(",")) {
    const text = piece.replace(/\s+/g, " ").trim();
    if (!text) continue;
    // Scan the WHOLE piece, not just its head: six legacy 800-53A Rev. 1 indexes
    // separate several controls with a space rather than a comma
    // ("SA-5 (1).1 SA-5(2).1 SA-5(3).1 SA-5(4).1 (i)s"), and anchoring at ^ threw
    // the trailing ids away without recording them anywhere.
    INDEX_HEAD.lastIndex = 0;
    const heads = [];
    let m;
    while ((m = INDEX_HEAD.exec(text)) !== null) heads.push({ m, end: INDEX_HEAD.lastIndex });
    for (let i = 0; i < heads.length; i += 1) {
      const h = heads[i].m;
      const id = normalizeControlId(
        h[3] === undefined ? `${h[1]}-${h[2]}` : `${h[1]}-${h[2]}(${h[3]})`,
      );
      if (!id) continue;
      ids.push(id);
      if (i === 0 && item === null) {
        // The statement path: "a 1 (a)" -> "a.1.a". Only meaningful for the
        // 800-53 revisions; 800-53A objective paths keep their verbatim index.
        const next = heads[i + 1] ? heads[i + 1].m.index : text.length;
        const tokens = text.slice(heads[i].end, next).match(/[A-Za-z]+|\d+/g);
        item = tokens && tokens.length > 0 ? tokens.join(".").toLowerCase() : null;
      }
    }
  }
  return { ids, item };
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

const STATUS_CODE = { draft: "d", deprecated: "x" };
const TYPE_CODE = { policy: "p", technical: "t", "policy+technical": "b" };

function packedBlock(lines, label) {
  for (const line of lines) {
    if (line.includes("`") || line.includes("${") || line.includes("\\")) {
      die(`packed ${label} row would break its template literal: ${line}`);
    }
  }
  return lines.join("\n");
}

function tsString(value) {
  return JSON.stringify(value);
}

function main() {
  requireFile(CCI_XML, "the DISA CCI list");
  requireFile(OSCAL_CATALOG, "the NIST SP 800-53 Rev. 5 OSCAL catalog");

  const { version, publishDate, items } = readCciList(CCI_XML);
  const {
    ids: catalogIds,
    families: catalogFamilies,
    version: catalogVersion,
  } = readControlIds(OSCAL_CATALOG);

  if (items.length === 0) die("parsed 0 cci_item records — the tolerant reader is broken");
  if (catalogIds.size === 0) die("parsed 0 controls out of the OSCAL catalog");

  const familyName = new Map(catalogFamilies.map((f) => [f.id, f.name]));

  // ---- items ----------------------------------------------------------------
  const dates = [];
  const dateIndex = new Map();
  const contributors = [];
  const contributorIndex = new Map();
  const dictIndex = (value, list, map) => {
    let at = map.get(value);
    if (at === undefined) {
      at = list.length;
      list.push(value);
      map.set(value, at);
    }
    return at;
  };

  const counts = {
    items: items.length,
    draft: 0,
    deprecated: 0,
    policy: 0,
    technical: 0,
    dualType: 0,
    references: 0,
    byRevision: { "800-53r3": 0, "800-53r4": 0, "800-53r5": 0, "800-53Ar1": 0 },
    rev5Resolved: 0,
    rev5Unresolved: 0,
    legacyParsed: 0,
    legacyUnparsed: 0,
    ccisWithRev5: 0,
    ccisWithoutRev5: 0,
  };

  const parsedItems = [];
  const parsedRefs = [];
  const unresolvedRev5 = new Map(); // index -> count
  const partialRev5 = []; // rev-5 index naming a control the catalog does not have
  const unparsable = []; // index no reader can turn into a control id at all
  const families = new Map(); // family key -> [{ id, definition }]
  let stray = 0;

  for (const item of items) {
    const num = /^CCI-(\d{6})$/.exec(item.id);
    if (!num) die(`unexpected CCI id "${item.id}" — the packed index assumes CCI-nnnnnn`);
    if (item.parameters.length > 0 || item.notes.length > 0) {
      die(
        `CCI ${item.id} carries a <parameter>/<note> with content; the 2024 release has no such element and ` +
          `the generated layer deliberately does not model them. Re-check the release before regenerating.`,
      );
    }
    if (!(item.status in STATUS_CODE)) die(`unknown CCI status "${item.status}" on ${item.id}`);
    const typeKey = item.types.join("+");
    if (!(typeKey in TYPE_CODE)) die(`unknown CCI type combination "${typeKey}" on ${item.id}`);

    counts[item.status] += 1;
    const primaryType = item.types[0];
    counts[primaryType] += 1;
    if (item.types.length > 1) counts.dualType += 1;

    // References, and the family this CCI files under.
    let family = null;
    let fallbackFamily = null;
    let sawRev5 = false;
    for (const ref of item.references) {
      const revision = REVISION_BY_TITLE.get(ref.title);
      if (!revision) die(`unknown reference publication "${ref.title}" on ${item.id}`);
      counts.references += 1;
      counts.byRevision[revision] += 1;

      const { ids, item: statementItem } = parseIndex(ref.index);
      const prefix = /^\s*([A-Za-z]{2})-/.exec(ref.index);
      if (prefix && !fallbackFamily) fallbackFamily = prefix[1].toUpperCase();

      if (ids.length === 0) unparsable.push({ cci: item.id, revision, index: ref.index });

      let controlIds = [];
      let legacyIds = [];
      if (revision === "800-53r5") {
        sawRev5 = true;
        controlIds = ids.filter((id) => catalogIds.has(id));
        for (const dropped of ids.filter((id) => !catalogIds.has(id))) {
          partialRev5.push({ cci: item.id, index: ref.index, dropped });
        }
        if (controlIds.length > 0) {
          counts.rev5Resolved += 1;
          if (!family) family = catalogIds.get(controlIds[0]);
        } else {
          counts.rev5Unresolved += 1;
          unresolvedRev5.set(ref.index, (unresolvedRev5.get(ref.index) ?? 0) + 1);
        }
      } else {
        legacyIds = ids;
        if (legacyIds.length > 0) counts.legacyParsed += 1;
        else counts.legacyUnparsed += 1;
      }

      parsedRefs.push({
        num: Number(num[1]),
        revision,
        index: ref.index,
        ids: revision === "800-53r5" ? controlIds : legacyIds,
        item: revision === "800-53r5" ? statementItem : null,
      });
    }
    if (sawRev5) counts.ccisWithRev5 += 1;
    else counts.ccisWithoutRev5 += 1;

    if (!family) {
      family =
        fallbackFamily && familyName.has(fallbackFamily)
          ? fallbackFamily
          : (fallbackFamily ?? "XX");
      if (!familyName.has(family)) stray += 1;
    }

    parsedItems.push({
      num: Number(num[1]),
      id: item.id,
      status: item.status,
      typeKey,
      dateIdx: dictIndex(item.publishDate, dates, dateIndex),
      contributorIdx: dictIndex(item.contributor, contributors, contributorIndex),
      family,
    });

    const bucket = families.get(family) ?? [];
    bucket.push({ id: item.id, definition: item.definition });
    families.set(family, bucket);
  }

  const familyKeys = [...families.keys()].sort();

  // ---- packed index ---------------------------------------------------------
  const familyList = familyKeys;
  const familyIdx = new Map(familyKeys.map((f, i) => [f, i]));
  const itemLines = parsedItems.map(
    (i) =>
      `${i.num}|${STATUS_CODE[i.status]}|${TYPE_CODE[i.typeKey]}|${i.dateIdx}|${i.contributorIdx}|${familyIdx.get(i.family)}`,
  );
  const refLines = parsedRefs.map((r) => {
    if (r.index.includes("|")) die(`reference index contains the packing delimiter: ${r.index}`);
    // `index` is documented as verbatim, so it is packed verbatim. Only a
    // newline would break the row format, and the 2024 release has none.
    if (/[\r\n]/.test(r.index))
      die(`reference index contains a newline: ${JSON.stringify(r.index)}`);
    return `${r.num}|${REV_CODE[r.revision]}|${r.index}|${r.ids.join(" ")}|${r.item ?? ""}`;
  });

  const coveredControls = new Set();
  for (const ref of parsedRefs) {
    if (ref.revision === "800-53r5") for (const id of ref.ids) coveredControls.add(id);
  }

  const unresolvedRows = [...unresolvedRev5.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const rev5Total = counts.byRevision["800-53r5"];
  const noneResolvedNote = `  // none — every one of the ${rev5Total} Rev. 5 indexes resolved`;

  const header = `/**
 * DISA Control Correlation Identifiers (CCI) — index and NIST crosswalk.
 *
 * Do not hand-edit — regenerate with: node scripts/gen-cci-catalog.mjs
 *
 * Source: ${PROVENANCE.file} (DISA CCI list, version ${version}), read from a
 * PUBLIC MIRROR of the DISA Cyber Exchange list rather than from Cyber Exchange
 * itself, which may require interactive/CAC access. The mirror states the file
 * is included unmodified. DISA CCI is a US Government work.
 *
 * Prose-free by design: the definitions live in per-family chunks under
 * ./cci-text and are fetched on demand — see loadCciFamily / loadCciDefinition.
 * Rows are packed as delimited text and decoded once at module load, which keeps
 * this file a fraction of the size the equivalent object literals would be.
 *
 * Control ids follow the same convention as @/lib/nist-catalog: "AC-2",
 * "AC-2(1)" — never zero padded.
 */
`;

  const types = `
import type { ReferenceFamilyLoader, ReferenceProvenance } from "./reference-provenance";

export type CciStatus = "draft" | "deprecated";
export type CciType = "policy" | "technical";

/** Which publication a CCI reference points at. A CCI cites up to all four. */
export type CciRevision = "800-53r3" | "800-53r4" | "800-53r5" | "800-53Ar1";

export type Cci = {
  /** Natural key: "CCI-000001". */
  id: string;
  status: CciStatus;
  /** First <type> element — the CCI's primary classification. */
  type: CciType;
  /** Every <type> element. ${counts.dualType} CCIs are both policy and technical. */
  types: CciType[];
  publishDate: string;
  contributor: string;
  /**
   * Chunk key: the family of this CCI's Rev. 5 control, or — for the
   * ${counts.ccisWithoutRev5} CCIs that cite no Rev. 5 control — the family named by its
   * oldest reference, which may be a pre-Rev.-5 family such as AR or TR.
   */
  family: string;
};

/**
 * One <reference> element, kept 1:1 with the source.
 *
 * \`controlId\` / \`controlIds\` are populated ONLY for 800-53 Rev. 5 references and
 * only when the parsed id exists in the Rev. 5 catalog, so a Rev. 3/4 index can
 * never masquerade as a Rev. 5 mapping. Older publications keep their parsed id
 * in \`legacyControlIds\`, which is what that publication said and nothing more:
 * Rev. 4 "AC-2 (2)" is not Rev. 5 AC-2(2).
 */
export type CciReference = {
  cci: string;
  /** Publication title, verbatim: "NIST SP 800-53 Revision 5". */
  title: string;
  /** Version attribute, verbatim: "5". */
  version: string;
  revision: CciRevision;
  /** Free-text index, verbatim: "AC-1 a 1 (a)", "AC-2 (1)", "AC-1.1 (i and ii)". */
  index: string;
  /** Rev. 5 control this reference resolves to, or null. */
  controlId: string | null;
  /** Every Rev. 5 control the index names (a handful name two). */
  controlIds: string[];
  /** Control ids as written in a pre-Rev.-5 publication. Not a Rev. 5 mapping. */
  legacyControlIds: string[];
  /** Statement path inside the Rev. 5 control: "a.1.a", "b.1". Rev. 5 only. */
  item: string | null;
};

/**
 * A chunk of the list. The 20 SP 800-53 Rev. 5 families, plus the pre-Rev.-5
 * families (the Rev. 4 Appendix J privacy families) that CCIs still cite; the
 * Rev. 5 catalog names no title for those, so \`name\` is null and \`inRev5\` false.
 */
export type CciFamily = { id: string; name: string | null; inRev5: boolean; count: number };

/**
 * The reference layer's one provenance shape. Kept under the local name so
 * existing imports still resolve.
 */
export type CciProvenance = ReferenceProvenance;
`;

  const provenance = `
export const cciVersion = "DISA CCI List ${version}";
/** The release stamped in the file's own <metadata>. */
export const cciSourceVersion = ${tsString(version)};
export const cciPublishDate = ${tsString(publishDate)};

/** The Rev. 5 catalog these CCIs were resolved against. */
export const cciJoinCatalogVersion = ${tsString(catalogVersion)};

export const cciProvenance: CciProvenance = {
  id: "DISA-CCI-2024",
  source: ${tsString(`DISA CCI List ${version}`)},
  authority: ${tsString(PROVENANCE.authority)},
  citation: "DISA Control Correlation Identifier (CCI) List",
  release: ${tsString(version)},
  sourceUrl: ${tsString(PROVENANCE.sourceUrl)},
  officialLandingPage: ${tsString(PROVENANCE.officialLandingPage)},
  /** False: this byte stream is a mirror, not the authority's own download. */
  authoritative: false,
  rights: "DISA CCI is a US Government work. The content is DISA's; the mirroring is not.",
  sha256: ${tsString(PROVENANCE.sha256)},
  notes: [
    "Read from a public mirror of the DISA Cyber Exchange CCI list, not from Cyber Exchange directly; the mirror states the XML is included unmodified.",
    "DISA CCI is a US Government work. The content is DISA's; the mirroring is not.",
    "Every record in this release is status draft (${counts.draft}) or deprecated (${counts.deprecated}) — no CCI is ever published as 'final', so status is not a maturity signal.",
    "No <parameter> or <note> element appears anywhere in this release's ${counts.items} records; they are deliberately not modelled, and regeneration fails loudly if a future release adds one.",
    "Every 800-53A reference in this list is 800-53A Revision 1 — Rev-3-era objective numbering such as 'AC-1.1 (i and ii)'. There is no CCI-to-800-53A-Rev-5 linkage in the source; Rev. 5 objectives come from the OSCAL catalog instead.",
  ],
};

/** Counts observed when this file was generated. Verify a regeneration against them. */
export const cciCounts = {
  items: ${counts.items},
  draft: ${counts.draft},
  deprecated: ${counts.deprecated},
  policy: ${counts.policy},
  technical: ${counts.technical},
  /** CCIs carrying both <type> elements; counted under policy above. */
  dualType: ${counts.dualType},
  references: ${counts.references},
  byRevision: {
    "800-53r3": ${counts.byRevision["800-53r3"]},
    "800-53r4": ${counts.byRevision["800-53r4"]},
    "800-53r5": ${counts.byRevision["800-53r5"]},
    "800-53Ar1": ${counts.byRevision["800-53Ar1"]},
  },
  /** Rev. 5 references whose index resolved to a control in the ${catalogIds.size}-control catalog. */
  rev5Resolved: ${counts.rev5Resolved},
  rev5Unresolved: ${counts.rev5Unresolved},
  ccisWithRev5Reference: ${counts.ccisWithRev5},
  ccisWithoutRev5Reference: ${counts.ccisWithoutRev5},
  /** Controls in the ${catalogIds.size}-control Rev. 5 catalog that at least one CCI decomposes. */
  controlsWithCcis: ${coveredControls.size},
  catalogControls: ${catalogIds.size},
} as const;

/** Every Rev. 5 index that names no control in the catalog, with its occurrence count. Nothing is dropped silently. */
export const cciUnresolvedRev5Indexes: { index: string; count: number }[] = [
${unresolvedRows.map(([index, count]) => `  { index: ${tsString(index)}, count: ${count} },`).join("\n") || noneResolvedNote}
];

/**
 * Indexes so malformed that no control id comes out of them at all. Both are
 * 800-53A Rev. 1 typos in the source list; their references are still present,
 * with the index verbatim and no parsed id.
 */
export const cciUnparsableIndexes: { cci: string; revision: CciRevision; index: string }[] = [
${unparsable.map((u) => `  { cci: ${tsString(u.cci)}, revision: ${tsString(u.revision)}, index: ${tsString(u.index)} },`).join("\n") || "  // none"}
];
`;

  const data = `
const statusByCode: Record<string, CciStatus> = { d: "draft", x: "deprecated" };
const typesByCode: Record<string, CciType[]> = {
  p: ["policy"],
  t: ["technical"],
  b: ["policy", "technical"],
};
const revisionByCode: Record<string, CciRevision> = {
  "3": "800-53r3",
  "4": "800-53r4",
  "5": "800-53r5",
  A: "800-53Ar1",
};
const titleByRevision: Record<CciRevision, { title: string; version: string }> = {
  "800-53r3": { title: "NIST SP 800-53", version: "3" },
  "800-53r4": { title: "NIST SP 800-53 Revision 4", version: "4" },
  "800-53r5": { title: "NIST SP 800-53 Revision 5", version: "5" },
  "800-53Ar1": { title: "NIST SP 800-53A", version: "1" },
};

/** Publications a CCI can cite, newest first. */
export const cciRevisions: { revision: CciRevision; title: string; version: string }[] = (
  ["800-53r5", "800-53r4", "800-53r3", "800-53Ar1"] as CciRevision[]
).map((revision) => ({ revision, ...titleByRevision[revision] }));

/** The join every screen means when it says "the CCIs for this control". */
export const defaultCciRevision: CciRevision = "800-53r5";

/** The chunks, in family order. Pass an id to loadCciFamily. */
export const cciFamilies: CciFamily[] = [
${familyList
  .map((f) => {
    const name = familyName.get(f);
    return `  { id: ${tsString(f)}, name: ${name ? tsString(name) : "null"}, inRev5: ${familyName.has(f)}, count: ${(families.get(f) ?? []).length} },`;
  })
  .join("\n")}
];

export const cciFamilyName = new Map(cciFamilies.map((f) => [f.id, f.name]));

const familyIds = cciFamilies.map((f) => f.id);

const publishDates = ${JSON.stringify(dates)};
const contributors = ${JSON.stringify(contributors)};

/** num|status|type|publishDate|contributor|family */
const packedItems = \`
${packedBlock(itemLines, "item")}
\`;

/** cci|revision|index|controlIds|item */
const packedReferences = \`
${packedBlock(refLines, "reference")}
\`;

function cciId(num: string): string {
  return \`CCI-\${num.padStart(6, "0")}\`;
}

function decodeItems(): Cci[] {
  const rows: Cci[] = [];
  for (const line of packedItems.trim().split("\\n")) {
    const [num, status, type, date, contributor, family] = line.split("|");
    rows.push({
      id: cciId(num!),
      status: statusByCode[status!]!,
      types: typesByCode[type!]!,
      type: typesByCode[type!]![0]!,
      publishDate: publishDates[Number(date)]!,
      contributor: contributors[Number(contributor)]!,
      family: familyIds[Number(family)]!,
    });
  }
  return rows;
}

function decodeReferences(): CciReference[] {
  const rows: CciReference[] = [];
  for (const line of packedReferences.trim().split("\\n")) {
    const [num, code, index, ids, item] = line.split("|");
    const revision = revisionByCode[code!]!;
    const parsed = ids ? ids.split(" ") : [];
    const rev5 = revision === "800-53r5";
    rows.push({
      cci: cciId(num!),
      ...titleByRevision[revision],
      revision,
      index: index!,
      controlId: rev5 ? (parsed[0] ?? null) : null,
      controlIds: rev5 ? parsed : [],
      legacyControlIds: rev5 ? [] : parsed,
      item: item ? item : null,
    });
  }
  return rows;
}

/** Every CCI in the release, in id order. */
export const cciItems: Cci[] = decodeItems();

export const cciById = new Map(cciItems.map((c) => [c.id, c]));

/** Every <reference> element, in source order. */
export const cciReferences: CciReference[] = decodeReferences();
`;

  const helpers = `
const referencesByCci = new Map<string, CciReference[]>();
for (const ref of cciReferences) {
  const bucket = referencesByCci.get(ref.cci);
  if (bucket) bucket.push(ref);
  else referencesByCci.set(ref.cci, [ref]);
}

const referencesByControl = new Map<string, CciReference[]>();
for (const ref of cciReferences) {
  for (const controlId of ref.controlIds) {
    const bucket = referencesByControl.get(controlId);
    if (bucket) bucket.push(ref);
    else referencesByControl.set(controlId, [ref]);
  }
}

const ccisByControl = new Map<string, string[]>();
for (const [controlId, refs] of referencesByControl) {
  ccisByControl.set(controlId, [...new Set(refs.map((r) => r.cci))]);
}

const legacyReferencesByControl = new Map<string, CciReference[]>();
for (const ref of cciReferences) {
  for (const controlId of ref.legacyControlIds) {
    const key = \`\${ref.revision} \${controlId}\`;
    const bucket = legacyReferencesByControl.get(key);
    if (bucket) bucket.push(ref);
    else legacyReferencesByControl.set(key, [ref]);
  }
}

/** Every reference a CCI carries, across all four publications. */
export function referencesForCci(cciId: string): CciReference[] {
  return referencesByCci.get(cciId) ?? [];
}

/** CCI ids mapped to a control by SP 800-53 Rev. 5 — the default join. */
export function cciIdsForControl(controlId: string): string[] {
  return ccisByControl.get(controlId) ?? [];
}

/** The same join, as records. */
export function ccisForControl(controlId: string): Cci[] {
  const ids = cciIdsForControl(controlId);
  const rows: Cci[] = [];
  for (const id of ids) {
    const row = cciById.get(id);
    if (row) rows.push(row);
  }
  return rows;
}

/** Rev. 5 references for a control, so a screen can show which statement item each CCI decomposes. */
export function cciReferencesForControl(controlId: string): CciReference[] {
  return referencesByControl.get(controlId) ?? [];
}

/**
 * Controls a CCI maps to. Defaults to Rev. 5; ask for an older revision and you
 * get that publication's own ids, which are NOT Rev. 5 controls.
 */
export function controlIdsForCci(cciId: string, revision: CciRevision = defaultCciRevision): string[] {
  const refs = referencesForCci(cciId).filter((r) => r.revision === revision);
  const ids = refs.flatMap((r) => (revision === "800-53r5" ? r.controlIds : r.legacyControlIds));
  return [...new Set(ids)];
}

/** The revision-crosswalk story: what an older publication called this control's CCIs. */
export function legacyCciReferences(controlId: string, revision: CciRevision): CciReference[] {
  if (revision === "800-53r5") return cciReferencesForControl(controlId);
  return legacyReferencesByControl.get(\`\${revision} \${controlId}\`) ?? [];
}

const familyCache = new Map<string, Cci[]>();

/** Every CCI filed under a family key, in id order. */
export function cciItemsForFamily(family: string): Cci[] {
  const hit = familyCache.get(family);
  if (hit) return hit;
  const rows = cciItems.filter((c) => c.family === family);
  familyCache.set(family, rows);
  return rows;
}
`;

  const loaders = `
/**
 * Definition prose, split per family so nothing but the index is in the initial
 * bundle. Mirrors the way @/lib/nist-control-text is imported dynamically.
 */
const definitionChunks: Record<string, () => Promise<Record<string, string>>> = {
${familyKeys.map((f) => `  ${JSON.stringify(f)}: () => import("./cci-text/${f.toLowerCase()}").then((m) => m.cciDefinitions),`).join("\n")}
};

const loadedChunks = new Map<string, Promise<Record<string, string>>>();

/** The chunk families, in family order — the shape @/lib/nist-control-text/registry uses. */
export const cciTextFamilies: string[] = Object.keys(definitionChunks);

/** "AC", "ac" or a control id in the family ("AC-2(3)") -> "AC". */
function cciFamilyKey(value: string): string {
  const head = value.split("-", 1)[0] ?? value;
  return head.trim().toUpperCase();
}

/** True when the value names a family that has a definitions chunk. */
export function isCciTextFamily(family: string): boolean {
  return cciFamilyKey(family) in definitionChunks;
}

/**
 * The definitions for one family. Cached: the second caller shares the first fetch.
 * Rejects on a family with no chunk, matching loadControlFamily in
 * @/lib/nist-control-text/registry — use isCciTextFamily first for user input.
 */
export function loadCciFamily(family: string): Promise<Record<string, string>> {
  const key = cciFamilyKey(family);
  const cached = loadedChunks.get(key);
  if (cached) return cached;
  const load = definitionChunks[key];
  if (!load) {
    return Promise.reject(
      new Error(\`Unknown CCI family "\${family}" — expected one of \${cciTextFamilies.join(", ")}\`),
    );
  }
  const pending = load();
  loadedChunks.set(key, pending);
  return pending;
}

/** Every family, in parallel, merged into one index. */
export async function loadAllCciDefinitions(): Promise<Record<string, string>> {
  const chunks = await Promise.all(cciTextFamilies.map((f) => loadCciFamily(f)));
  return Object.assign({}, ...chunks) as Record<string, string>;
}

/**
 * The same four calls under the reference layer's shared names, so a screen can
 * treat this and the 800-53 control text as one kind of thing.
 */
export const cciDefinitionLoader: ReferenceFamilyLoader<string> = {
  families: cciTextFamilies,
  isFamily: isCciTextFamily,
  loadFamily: loadCciFamily,
  loadAll: loadAllCciDefinitions,
};

/** One CCI's definition, fetching only the family chunk it lives in. */
export async function loadCciDefinition(id: string): Promise<string | null> {
  const row = cciById.get(id);
  if (!row) return null;
  const chunk = await loadCciFamily(row.family);
  return chunk[id] ?? null;
}

/** Definitions for a control's Rev. 5 CCIs, fetching each family chunk once. */
export async function loadCciDefinitionsForControl(controlId: string): Promise<Map<string, string>> {
  const rows = ccisForControl(controlId);
  const chunks = new Map<string, Record<string, string>>();
  for (const family of new Set(rows.map((r) => r.family))) {
    chunks.set(family, await loadCciFamily(family));
  }
  const out = new Map<string, string>();
  for (const row of rows) {
    const definition = chunks.get(row.family)?.[row.id];
    if (definition) out.set(row.id, definition);
  }
  return out;
}
`;

  writeFileSync(OUT_INDEX, `${header}${types}${provenance}${data}${helpers}${loaders}`);

  // ---- family chunks --------------------------------------------------------
  mkdirSync(OUT_TEXT_DIR, { recursive: true });
  const expected = new Set(familyKeys.map((f) => `${f.toLowerCase()}.ts`));
  for (const file of readdirSync(OUT_TEXT_DIR)) {
    if (!expected.has(file)) rmSync(path.join(OUT_TEXT_DIR, file));
  }

  const chunkSizes = [];
  for (const family of familyKeys) {
    const rows = families.get(family) ?? [];
    rows.sort((a, b) => a.id.localeCompare(b.id));
    const name = familyName.get(family);
    const label = name
      ? `${family} — ${name}`
      : `${family} (a pre-Rev.-5 family; these CCIs cite no Rev. 5 control)`;
    const body = `/**
 * DISA CCI definitions — ${label}.
 *
 * Do not hand-edit — regenerate with: node scripts/gen-cci-catalog.mjs
 *
 * Loaded on demand by loadCciFamily("${family}") in @/lib/cci-catalog. The index
 * there carries every other field; this chunk is only the definition prose.
 *
 * Source: ${PROVENANCE.file} (DISA CCI list ${version}), via a public mirror of the
 * DISA Cyber Exchange list. DISA CCI is a US Government work.
 */

export const cciDefinitions: Record<string, string> = {
${rows.map((r) => `  ${JSON.stringify(r.id)}: ${JSON.stringify(r.definition)},`).join("\n")}
};
`;
    const file = path.join(OUT_TEXT_DIR, `${family.toLowerCase()}.ts`);
    writeFileSync(file, body);
    chunkSizes.push({ family, rows: rows.length, kb: Math.round(body.length / 102.4) / 10 });
  }

  // ---- report ---------------------------------------------------------------
  const indexKb = Math.round(readFileSync(OUT_INDEX).length / 102.4) / 10;
  console.log(`\nDISA CCI list ${version} (publishdate ${publishDate})`);
  console.log(`joined against OSCAL catalog ${catalogVersion} — ${catalogIds.size} controls\n`);
  console.log(
    `  CCIs                 ${counts.items}   draft ${counts.draft} / deprecated ${counts.deprecated}`,
  );
  console.log(
    `  types                policy ${counts.policy} / technical ${counts.technical}  (${counts.dualType} carry both <type> elements)`,
  );
  console.log(`  references           ${counts.references}`);
  for (const [revision, n] of Object.entries(counts.byRevision))
    console.log(`    ${revision.padEnd(18)} ${n}`);
  console.log(
    `  Rev. 5 resolved      ${counts.rev5Resolved} / ${counts.byRevision["800-53r5"]}   unresolved ${counts.rev5Unresolved} (${unresolvedRows.length} distinct)`,
  );
  console.log(
    `  CCIs with a Rev. 5 reference ${counts.ccisWithRev5} / without ${counts.ccisWithoutRev5}`,
  );
  console.log(`  legacy indexes parsed ${counts.legacyParsed} / unparsed ${counts.legacyUnparsed}`);
  for (const u of unparsable)
    console.log(`    unparsable  ${u.cci}  ${u.revision}  ${JSON.stringify(u.index)}`);
  if (partialRev5.length > 0) {
    console.log(`  Rev. 5 ids parsed but absent from the catalog: ${partialRev5.length}`);
    for (const p of partialRev5.slice(0, 20))
      console.log(`    ${p.cci}  ${JSON.stringify(p.index)} -> ${p.dropped}`);
  }
  console.log(
    `  controls covered      ${coveredControls.size} / ${catalogIds.size} Rev. 5 controls have at least one CCI`,
  );
  if (stray > 0) console.log(`  CCIs filed under a pre-Rev.-5 family: ${stray}`);
  if (unresolvedRows.length > 0) {
    console.log("\n  unresolved Rev. 5 indexes:");
    for (const [index, n] of unresolvedRows.slice(0, 40))
      console.log(`    ${String(n).padStart(4)}  ${index}`);
    if (unresolvedRows.length > 40) console.log(`    … ${unresolvedRows.length - 40} more`);
  }
  console.log(`\n  wrote src/lib/cci-catalog.ts  ${indexKb} KB`);
  console.log(`  wrote ${chunkSizes.length} chunks under src/lib/cci-text/`);
  for (const c of chunkSizes)
    console.log(
      `    ${c.family.toLowerCase().padEnd(4)} ${String(c.rows).padStart(5)} CCIs  ${c.kb} KB`,
    );
  console.log("");
}

main();
