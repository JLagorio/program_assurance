#!/usr/bin/env node
/**
 * Transcribes Appendix G of NIST SP 800-160 Vol. 2 Rev. 1 from the pinned PDF: the analysis of ATT&CK
 * for Industrial Control Systems (ICS), Tables G-1 to G-12 (one per ATT&CK for ICS tactic:
 * technique, mitigation or candidate mitigation, cyber resiliency approaches, potential effects,
 * controls) and Table G-13 (the candidate mitigations defined for ATT&CK for ICS). NIST publishes
 * them only as a PDF.
 *
 *   node scripts/reference-transcribe/sp800-160v2r1-appendix-g.mjs --pdf <path> [--json <copy>] [--check]
 *
 * The tables have Appendix F's columns and are read the same way, by attack-appendix.mjs (see
 * sp800-160v2r1-appendix-f.mjs). ATT&CK for ICS numbers its own tactics, techniques and
 * mitigations, and the appendix presents its mappings "as separate tables" (Section G.1), so they
 * are a framework of their own beside Appendix F's. Appendix G prints no table of effects: a row's
 * effects are those of Table F-1, read from the pinned Appendix F transcription, and named by title
 * as Appendix F's rows name them. The notes after each table, which relate the techniques to ATT&CK
 * for Enterprise, are not transcribed.
 *
 * Section G.1.2 says a control is printed in bold where it matches the mitigation better than the
 * SP 800-53 controls ATT&CK for ICS identifies for it, "to indicate the divergence from the
 * original ATT&CK for ICS mapping". pdftotext reports no typeface, but a bold word's box is taller
 * than a regular one's of the same size, and every control label is one or the other; a control
 * printed in bold keeps `bold: true` on its link.
 *
 * Nothing is typed in from the tables but the corrections below, each bound to one cell of one
 * page, the vocabularies the result is checked against and the counts it must reach.
 */
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PAGE_OFFSET,
  SOURCE,
  appendixTables,
  attackItems,
  controlResolver,
  fail,
  projectRoot,
  readCandidateTables,
  readPages,
  readRightsStatement,
  readTacticTable,
} from "./attack-appendix.mjs";
import {
  FORMAT,
  matchesPinned,
  parseArguments,
  pdftotextVersion,
  readPinned,
  readSourcePdf,
  writeFramework,
} from "./lib.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const PINNED = join(projectRoot, "supabase/reference/NIST_SP-800-160v2r1_appendix-g.json.gz");
// Appendix F's transcription, whose Table F-1 defines the effects a row of Appendix G names.
const APPENDIX_F = join(projectRoot, "supabase/reference/NIST_SP-800-160v2r1_appendix-f.json.gz");

const FRAMEWORK = {
  code: "nist-sp800-160v2r1-attack-ics",
  title: "ATT&CK for ICS techniques and mitigations in NIST SP 800-160 Vol. 2 Rev. 1, Appendix G",
  version: "Rev. 1",
};

// Appendix G in the pinned PDF: its pages, to the end of the document.
const FIRST_PAGE = 267;
const LAST_PAGE = 310;

// The tactic of each of Tables G-1 to G-12, in the order the appendix prints them. A caption
// prints the name in capitals, and each name is checked against its table's caption.
const TACTICS = [
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Evasion",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Command and Control",
  "Inhibit Response Function",
  "Impair Process Control",
  "Impact",
];
const TACTIC_TABLES = TACTICS.map((_, index) => `Table G-${1 + index}`);
const CANDIDATE_TABLES = ["Table G-13"];
const EFFECTS_TABLE = "Table F-1";

// What the reading must find, as it stood when the transcription was checked against the pages:
// the effects of Table F-1, the techniques, rows, printed control labels and labels printed in bold
// of each tactic's table, and the candidate mitigations Table G-13 defines. A run that reads
// anything else fails before it writes.
const EXPECTED = {
  effects: 20,
  tactics: {
    "Table G-1": { techniques: 13, rows: 109, controls: 196, bold: 98 },
    "Table G-2": { techniques: 9, rows: 40, controls: 66, bold: 41 },
    "Table G-3": { techniques: 5, rows: 37, controls: 80, bold: 59 },
    "Table G-4": { techniques: 2, rows: 13, controls: 23, bold: 12 },
    "Table G-5": { techniques: 6, rows: 34, controls: 58, bold: 34 },
    "Table G-6": { techniques: 5, rows: 21, controls: 39, bold: 16 },
    "Table G-7": { techniques: 6, rows: 48, controls: 75, bold: 44 },
    "Table G-8": { techniques: 10, rows: 46, controls: 75, bold: 42 },
    "Table G-9": { techniques: 3, rows: 12, controls: 27, bold: 16 },
    "Table G-10": { techniques: 13, rows: 64, controls: 124, bold: 67 },
    "Table G-11": { techniques: 5, rows: 36, controls: 74, bold: 50 },
    "Table G-12": { techniques: 12, rows: 148, controls: 162, bold: 68 },
  },
  candidates: { "Table G-13": 50 },
};

// The heights of a bold and of a regular control label, in points.
const WEIGHTS = { bold: 12.49, regular: 12.04 };

// What Table G-7 prints where a technique's mitigation belongs when it gives none, over approaches,
// effects and controls that hold nothing.
const NO_MITIGATION = "No cyber resiliency mitigations or candidate mitigations";

// A printed label that names no control of SP 800-53 Rev. 5 makes no control link. Appendix G
// prints none.
const NOT_IN_CATALOG = [];

// The captions print the tactics in capitals only. Their items take the letter case the
// publication writes them in elsewhere, and this entry of the corrections says so.
const LETTER_CASE = [
  {
    printed_in: "Tables G-1 to G-12",
    printed:
      "Tactic names in capitals in the captions, such as INHIBIT RESPONSE FUNCTION and COMMAND AND CONTROL",
    transcribed:
      "Tactic names in title case, such as Inhibit Response Function and Command and Control",
    reason:
      "The notes under Table G-1 and Table G-2 write the tactics this way, as in the Initial Access tactic and the Inhibit Response Function tactic.",
  },
];

/**
 * Where the transcription departs from the printed text of a cell. Each entry names one cell by
 * its table, the page number the page prints, its column and the cell's whole text as its lines
 * give it, then the part that changes. Every entry is used exactly once, or the run fails. They
 * stand in the order of the appendix, which is the order the document lists them in.
 */
const CORRECTIONS = [
  {
    table: "Table G-1",
    page: 254,
    column: "controls",
    cell: "AC-4(21), AC-6(4), SC-18 (5), SC-39, CM-7(6), SI-3",
    printed: "SC-18 (5)",
    transcribed: "SC-18(5)",
    reason: "A space stands inside the control's label.",
  },
  {
    table: "Table G-1",
    page: 255,
    column: "mitigation",
    cell: "Present Deceptive Information",
    printed: "Present Deceptive Information",
    transcribed: "Present Deceptive Information (CM1201)",
    reason:
      "The candidate mitigation's identifier is missing. Table G-13 defines Present Deceptive Information as CM1201, and every other row of the appendix names it so.",
  },
  {
    table: "Table G-13",
    page: 292,
    column: "approaches",
    cell: "Monitoring and Damage Assessment, Behavior Analysis",
    printed: "Behavior Analysis",
    transcribed: "Behavior Validation",
    reason:
      "No approach has this name. A candidate mitigation's approaches are those of its controls, and Table E-1 gives Behavior Validation to IR-4(13), SI-4(2) and SI-4(4), three of the five controls of CM2102.",
  },
];

function kindOfTable(name) {
  if (TACTIC_TABLES.includes(name)) return "tactic";
  if (CANDIDATE_TABLES.includes(name)) return "candidate";
  return null;
}

const reader = appendixTables({ letter: "G", kindOfTable, corrections: CORRECTIONS });

/** The effects of Table F-1, as the pinned Appendix F transcription holds them. */
function readEffectTitles() {
  const { items } = JSON.parse(readPinned(APPENDIX_F));
  const effects = items.filter(
    (item) => item.kind === "effect" && item.printed_in === EFFECTS_TABLE,
  );
  if (effects.length !== EXPECTED.effects) {
    fail(
      `The pinned Appendix F transcription holds ${effects.length} effects of ${EFFECTS_TABLE}.`,
    );
  }
  return effects.map((effect) => effect.title);
}

function buildDocument(pdf) {
  const tables = reader.readTables(readPages(pdf, FIRST_PAGE, LAST_PAGE));
  const expected = [...TACTIC_TABLES, ...CANDIDATE_TABLES];
  if (tables.map((table) => table.name).join() !== expected.join()) {
    fail(`The appendix holds ${tables.map((table) => table.name).join(", ")}.`);
  }
  // A table starts on the page where the one before it ends, or on the next: no page between two
  // tactics' tables goes unread.
  tables.slice(1).forEach((table, index) => {
    const before = tables[index];
    const gap = table.segments[0].page - before.segments.at(-1).page;
    if (gap !== 0 && gap !== 1) fail(`${gap} pages lie between ${before.name} and ${table.name}.`);
  });
  const byName = new Map(tables.map((table) => [table.name, table]));
  const controls = controlResolver(NOT_IN_CATALOG);
  const candidates = readCandidateTables(byName, reader, controls, EXPECTED.candidates);

  // The names each technique and mitigation is printed under in the tactics' tables, by its
  // identifier: every name with the tables that print it, the first printed first.
  const names = new Map();
  const effectTitles = readEffectTitles();
  const tactics = TACTICS.map((tactic, index) =>
    readTacticTable(byName.get(TACTIC_TABLES[index]), tactic, index + 1, {
      effectTitles,
      effectsTable: EFFECTS_TABLE,
      candidates,
      controls,
      names,
      expected: EXPECTED.tactics[TACTIC_TABLES[index]],
      readTactic: (table) =>
        reader.readTactic(table, { boldControls: WEIGHTS, noMitigation: NO_MITIGATION }),
    }),
  );

  const unused = [
    ...CORRECTIONS.filter(
      (correction) => reader.applied.filter((a) => a === correction).length !== 1,
    ),
    ...NOT_IN_CATALOG.filter((entry) => !controls.met.has(entry)),
  ];
  if (unused.length > 0) {
    const [{ table, page, printed, label }] = unused;
    fail(`"${printed ?? label}" (${table}, page ${page}) is not met exactly once.`);
  }

  const document = {
    format: FORMAT,
    framework: FRAMEWORK,
    source: { ...SOURCE, rights_statement: readRightsStatement(pdf) },
    method: {
      tool: "pdftotext",
      tool_version: pdftotextVersion(),
      script: relative(projectRoot, scriptPath),
    },
    items: [...tactics.map((tactic) => tactic.item), ...attackItems({ names, candidates })],
    item_links: tactics.flatMap((tactic) => tactic.itemLinks),
    control_links: tactics.flatMap((tactic) => tactic.controlLinks),
    corrections: [
      ...LETTER_CASE,
      ...CORRECTIONS.map(({ table, page, printed, transcribed, reason }) => ({
        printed_in: `${table}, p. ${page} (PDF p. ${page + PAGE_OFFSET})`,
        printed,
        transcribed,
        reason,
      })),
    ],
  };
  return { document, summaries: tactics.map((tactic) => tactic.summary), candidates, names };
}

/** What a run found, for whoever reads the result against the PDF. */
function report({ document, summaries, candidates, names }) {
  const total = (key) => summaries.reduce((sum, summary) => sum + summary[key], 0);
  const count = (list, test) => list.filter(test).length;
  const techniques = [...names.keys()].filter((id) => id.startsWith("T"));
  const tacticsOf = (id) =>
    count(document.item_links, (link) => link.relation === "tactic" && link.source === id);
  const unused = [...candidates.keys()].filter((id) => !names.has(id));
  const bare = document.item_links.filter((link) => link.props.mitigation_as_printed);
  return [
    ...summaries.map(
      (s) =>
        `${s.table} ${s.tactic}: ${s.techniques} techniques, ${s.mitigations} mitigations in ${s.pairs} pairs with a technique, ${s.rows} rows (${s.severalApproaches} of several approaches), ${s.controls} controls printed, ${s.bold} in bold`,
    ),
    `Tables G-1 to G-12: ${total("techniques")} techniques in their tables, ${techniques.length} different, ${count(techniques, (id) => tacticsOf(id) > 1)} in more than one table; ${total("pairs")} pairs, ${total("rows")} rows (${total("severalApproaches")} of several approaches), ${total("controls")} controls printed, ${total("bold")} in bold.`,
    `Mitigations: ${count([...names.keys()], (id) => id.startsWith("M"))} of ATT&CK for ICS, ${candidates.size} candidates defined, ${unused.length} of them in no tactic's table (${unused.join(", ")}).`,
    ...bare.map((link) => `${link.source} (${link.printed_in}) is given no mitigation.`),
    `Items ${document.items.length}, item links ${document.item_links.length}, control links ${document.control_links.length}, corrections ${document.corrections.length}.`,
    ...document.items.flatMap((item) =>
      (item.props.other_names ?? []).map(
        (other) =>
          `${item.code} "${item.title}" is also printed as "${other.name}" in ${other.printed_in.join(", ")}.`,
      ),
    ),
  ].join("\n");
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  readSourcePdf(options.pdf, SOURCE);
  const built = buildDocument(options.pdf);
  const pinned = relative(projectRoot, PINNED);
  if (options.check) {
    if (!matchesPinned(built.document, PINNED)) {
      fail(
        `${pinned} is not what this script reads from the PDF with pdftotext ${built.document.method.tool_version}.`,
      );
    }
    console.log(`${pinned} is what this script reads from the PDF.`);
    return;
  }
  const written = writeFramework(built.document, { gz: PINNED, json: options.json });
  console.log(report(built));
  console.log(`Wrote ${pinned}: sha256 ${written.sha256}, ${written.bytes} bytes of JSON.`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
