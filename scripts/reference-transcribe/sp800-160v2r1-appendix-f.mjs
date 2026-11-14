#!/usr/bin/env node
/**
 * Transcribes Appendix F of NIST SP 800-160 Vol. 2 Rev. 1 from the pinned PDF: Table F-1 (the
 * effects a mitigation can have on a threat event), Tables F-3 to F-16 (one per ATT&CK tactic:
 * technique, mitigation or candidate mitigation, cyber resiliency approaches, potential effects,
 * controls) and Tables F-17 to F-19 (the candidate mitigations). NIST publishes them only as a PDF.
 *
 *   node scripts/reference-transcribe/sp800-160v2r1-appendix-f.mjs --pdf <path> [--json <copy>] [--check]
 *
 * `pdftotext -bbox-layout` gives every word of a page with its box, and the tables are read from
 * those boxes alone (attack-appendix.mjs, which Appendix G's script shares). The lines of a cell
 * start at its column's left edge, so a table's columns are where its lines start. Down a column,
 * the lines of one cell follow each other closely and the first line of the next cell stands
 * further off, past the rule between two rows. A row of a tactic's table is the approaches,
 * effects and controls that start at one height; its mitigation and its technique are the last
 * ones that started at or above it, on an earlier page too.
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
  joinLines,
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
  readSourcePdf,
  slug,
  writeFramework,
} from "./lib.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const PINNED = join(projectRoot, "supabase/reference/NIST_SP-800-160v2r1_appendix-f.json.gz");

const FRAMEWORK = {
  code: "nist-sp800-160v2r1-attack",
  title: "ATT&CK techniques and mitigations in NIST SP 800-160 Vol. 2 Rev. 1, Appendix F",
  version: "Rev. 1",
};

// Appendix F in the pinned PDF: its pages.
const FIRST_PAGE = 171;
const LAST_PAGE = 266;

// The tactic of each of Tables F-3 to F-16, in the order the appendix prints them. A caption
// prints the name in capitals, and each name is checked against its table's caption.
const TACTICS = [
  "Reconnaissance",
  "Resource Development",
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Command and Control",
  "Exfiltration",
  "Impact",
];
const EFFECTS_TABLE = "Table F-1";
const TACTIC_TABLES = TACTICS.map((_, index) => `Table F-${3 + index}`);
const CANDIDATE_TABLES = ["Table F-17", "Table F-18", "Table F-19"];

// What the reading must find, as it stood when the transcription was checked against the pages:
// the effects of Table F-1, the techniques, rows and printed control labels of each tactic's
// table, and the candidate mitigations each of the last three tables defines. A run that reads
// anything else fails before it writes.
const EXPECTED = {
  effects: 20,
  tactics: {
    "Table F-3": { techniques: 10, rows: 54, controls: 75 },
    "Table F-4": { techniques: 7, rows: 16, controls: 39 },
    "Table F-5": { techniques: 9, rows: 57, controls: 90 },
    "Table F-6": { techniques: 12, rows: 123, controls: 158 },
    "Table F-7": { techniques: 18, rows: 104, controls: 147 },
    "Table F-8": { techniques: 13, rows: 87, controls: 125 },
    "Table F-9": { techniques: 39, rows: 246, controls: 341 },
    "Table F-10": { techniques: 14, rows: 64, controls: 85 },
    "Table F-11": { techniques: 27, rows: 91, controls: 137 },
    "Table F-12": { techniques: 9, rows: 79, controls: 109 },
    "Table F-13": { techniques: 17, rows: 90, controls: 128 },
    "Table F-14": { techniques: 16, rows: 103, controls: 159 },
    "Table F-15": { techniques: 9, rows: 68, controls: 98 },
    "Table F-16": { techniques: 13, rows: 182, controls: 230 },
  },
  candidates: { "Table F-17": 64, "Table F-18": 35, "Table F-19": 16 },
};

// A printed label that names no control of SP 800-53 Rev. 5. It makes no control link, and the
// links of its row keep it as printed.
const NOT_IN_CATALOG = [{ table: "Table F-8", page: 186, label: "CM-4(4)" }];

// The tables print two kinds of name in capitals only. Their items take the letter case the
// publication writes the names in elsewhere, and one entry of the corrections says so for each.
const LETTER_CASE = [
  {
    printed_in: "Table F-1",
    printed: "Effect names in capitals, such as REDIRECT and DETER",
    transcribed: "Effect names with an initial capital, such as Redirect and Deter",
    reason:
      "Tables F-3 to F-16 write the fifteen specific effects this way, and Section F.2.4 writes Expose so. The other four high-level effects take the same form.",
  },
  {
    printed_in: "Tables F-3 to F-16",
    printed:
      "Tactic names in capitals in the captions, such as RESOURCE DEVELOPMENT and COMMAND AND CONTROL",
    transcribed: "Tactic names in title case, such as Resource Development and Command and Control",
    reason:
      "The running text writes the tactics this way, as in Reconnaissance, Resource Development, Defense Evasion and Command and Control.",
  },
];

const SLASH =
  "The name breaks after its slash at the end of a line, and the two parts are joined without a space.";
const NO_SUCH_APPROACH_CM1164 =
  "No approach has this name. The row is AC-6(5) under Calibrate Administrative Access (CM1164). Table E-1 gives AC-6(5) the one approach Trust-Based Privilege Management, and Table F-17 gives CM1164 the approaches Attribute-Based Usage Restriction, Trust-Based Privilege Management and Restriction, of which the row above holds the first.";

/**
 * Where the transcription departs from the printed text of a cell. Each entry names one cell by
 * its table, the page number the page prints, its column and the cell's whole text as its lines
 * give it, then the part that changes. Every entry is used exactly once, or the run fails. They
 * stand in the order of the appendix, which is the order the document lists them in.
 */
const CORRECTIONS = [
  {
    table: "Table F-6",
    page: 176,
    column: "approaches",
    cell: "Trust-Based Usage Restriction",
    printed: "Trust-Based Usage Restriction",
    transcribed: "Trust-Based Privilege Management",
    reason: NO_SUCH_APPROACH_CM1164,
  },
  {
    table: "Table F-9",
    page: 189,
    column: "technique",
    cell: "Deobfuscate/ Decode Files or Information (T1140)",
    printed: "Deobfuscate/ Decode",
    transcribed: "Deobfuscate/Decode",
    reason: SLASH,
  },
  {
    table: "Table F-9",
    page: 194,
    column: "controls",
    cell: "AC-6(5",
    printed: "AC-6(5",
    transcribed: "AC-6(5)",
    reason: "The closing parenthesis is missing.",
  },
  {
    table: "Table F-9",
    page: 195,
    column: "approaches",
    cell: "Trust-Based Usage Restriction",
    printed: "Trust-Based Usage Restriction",
    transcribed: "Trust-Based Privilege Management",
    reason: NO_SUCH_APPROACH_CM1164,
  },
  {
    table: "Table F-9",
    page: 198,
    column: "technique",
    cell: "Unused/ Unsupported Cloud Regions (T1535)",
    printed: "Unused/ Unsupported",
    transcribed: "Unused/Unsupported",
    reason: SLASH,
  },
  {
    table: "Table F-9",
    page: 199,
    column: "technique",
    cell: "Virtualization/ Sandbox Evasion (T1497)",
    printed: "Virtualization/ Sandbox",
    transcribed: "Virtualization/Sandbox",
    reason: SLASH,
  },
  {
    table: "Table F-11",
    page: 204,
    column: "mitigation",
    cell: "Application- or Utility-Specific Monitoring (CM2020",
    printed: "(CM2020",
    transcribed: "(CM2020)",
    reason: "The closing parenthesis is missing.",
  },
  {
    table: "Table F-11",
    page: 208,
    column: "technique",
    cell: "Virtualization/ Sandbox Evasion (T1497)",
    printed: "Virtualization/ Sandbox",
    transcribed: "Virtualization/Sandbox",
    reason: SLASH,
  },
  {
    table: "Table F-16",
    page: 227,
    column: "approaches",
    cell: "Dynamic Privilege, Dynamic Reconfiguration",
    printed: "Dynamic Privilege",
    transcribed: "Dynamic Privileges",
    reason: "The approach is Dynamic Privileges; the final s is missing.",
  },
  {
    table: "Table F-16",
    page: 230,
    column: "approaches",
    cell: "Dynamic Reconfiguration,",
    printed: "Dynamic Reconfiguration,",
    transcribed: "Dynamic Reconfiguration",
    reason: "A comma ends the cell and no approach follows it.",
  },
  {
    table: "Table F-16",
    page: 237,
    column: "technique",
    cell: "System Shutdown/ Reboot (T1529)",
    printed: "Shutdown/ Reboot",
    transcribed: "Shutdown/Reboot",
    reason: `${SLASH} Appendix G prints System Shutdown/Reboot (T1529) on one line.`,
  },
  {
    table: "Table F-17",
    page: 244,
    column: "approaches",
    cell: "Orchestration Design Diversity, Replication, Trust-Based Privilege Management, Predefined Segmentation",
    printed: "Orchestration Design Diversity",
    transcribed: "Orchestration, Design Diversity",
    reason: "The comma between two approaches is missing.",
  },
  {
    table: "Table F-18",
    page: 245,
    column: "controls",
    cell: "AC-2 (12), AU-6, IR-4(13), SI-4(2), SI-4(4), SI-4(10), SI-4 (18), SI-4(25)",
    printed: "AC-2 (12)",
    transcribed: "AC-2(12)",
    reason: "A space stands inside the control's label.",
  },
  {
    table: "Table F-18",
    page: 245,
    column: "controls",
    cell: "AC-2 (12), AU-6, IR-4(13), SI-4(2), SI-4(4), SI-4(10), SI-4 (18), SI-4(25)",
    printed: "SI-4 (18)",
    transcribed: "SI-4(18)",
    reason:
      "The label breaks before its parenthesis at the end of a line, and the two parts are joined without a space.",
  },
  {
    table: "Table F-18",
    page: 246,
    column: "approaches",
    cell: "Monitoring and Damage Assessment, Sensor Fusion and Analysis, Dynamic Resource Analysis, Behavior Validation",
    printed: "Dynamic Resource Analysis",
    transcribed: "Dynamic Resource Awareness",
    reason:
      "No approach has this name. A candidate mitigation's approaches are those of its controls, and Table E-1 gives SI-4(16), one of the three controls of CM2005, Dynamic Resource Awareness.",
  },
  {
    table: "Table F-18",
    page: 248,
    column: "controls",
    cell: "IR4(13), SI-4(18)",
    printed: "IR4(13)",
    transcribed: "IR-4(13)",
    reason: "The hyphen of the control's label is missing.",
  },
];

function kindOfTable(name) {
  if (name === EFFECTS_TABLE) return "effects";
  if (TACTIC_TABLES.includes(name)) return "tactic";
  if (CANDIDATE_TABLES.includes(name)) return "candidate";
  return null;
}

const reader = appendixTables({ letter: "F", kindOfTable, corrections: CORRECTIONS });

// ---------------------------------------------------------------------------------------------
// Table F-1: the effects.
// ---------------------------------------------------------------------------------------------

// pdftotext reports no font, but a word's box is as high as its font: an effect's name is bold,
// its definition regular and the informal note under it italic. Table F-1 spaces its rows
// unevenly near a page's end, so its first column is read by these heights and not by line pitch.
const EFFECT_PARTS = { 12.49: "name", 12.04: "definition", 11.72: "note" };

const capitalized = (word) => word[0].toUpperCase() + word.slice(1).toLowerCase();

/**
 * The effects of Table F-1 from its first column: a name in capitals, with the effects a
 * high-level one includes, then the definition and any informal note. An effect runs from its
 * name to the next name, over a page break too. A high-level effect is the parent of the effects
 * that follow it, which are the ones it says it includes.
 */
function readEffects(table) {
  const [, secondColumn] = reader.columnEdges(table);
  const parts = [];
  for (const segment of table.segments) {
    const runs = segment.runs.filter((run) => run.x0 < secondColumn - 0.5);
    for (const run of runs.sort((a, b) => a.y - b.y)) {
      const part = EFFECT_PARTS[run.height.toFixed(2)];
      const last = parts.at(-1);
      if (part === "name" && (!last || last.definition.length > 0)) {
        parts.push({ name: [run.text], definition: [], note: [] });
      } else if (
        !part ||
        !last ||
        run.marks.length > 0 ||
        (part !== "note" && last.note.length > 0) ||
        (part === "note" && last.definition.length === 0)
      ) {
        fail(`${table.name}, page ${segment.page}: "${run.text}" is out of place.`);
      } else {
        last[part].push(run.text);
      }
    }
  }
  const effects = [];
  let parent = null;
  for (const part of parts) {
    const name = joinLines(part.name).match(/^([A-Z]+)(?: \(includes ([a-z, ]+)\))?$/);
    if (!name || part.definition.length === 0) {
      fail(`${table.name}: "${joinLines(part.name)}" names no effect.`);
    }
    const effect = {
      title: capitalized(name[1]),
      includes: name[2]?.split(/, and |, | and /).map(capitalized) ?? null,
      parent: null,
      definition: joinLines(part.definition),
      note: part.note.length > 0 ? joinLines(part.note) : null,
    };
    if (effect.includes) parent = effect;
    else if (parent?.includes.includes(effect.title)) effect.parent = parent.title;
    else fail(`${table.name}: ${effect.title} follows no effect that includes it.`);
    effects.push(effect);
  }
  for (const effect of effects.filter((candidate) => candidate.includes)) {
    const held = effects.filter((candidate) => candidate.parent === effect.title);
    if (held.length !== effect.includes.length) {
      fail(`${table.name}: ${effect.title} does not hold the effects it includes.`);
    }
  }
  if (new Set(effects.map((effect) => effect.title)).size !== effects.length) {
    fail(`${table.name}: an effect is defined twice.`);
  }
  return effects;
}

// ---------------------------------------------------------------------------------------------
// The document.
// ---------------------------------------------------------------------------------------------

const effectCode = (title) => `effect.${slug(title)}`;

function buildDocument(pdf) {
  const tables = reader.readTables(readPages(pdf, FIRST_PAGE, LAST_PAGE));
  const expected = [EFFECTS_TABLE, ...TACTIC_TABLES, ...CANDIDATE_TABLES];
  if (tables.map((table) => table.name).join() !== expected.join()) {
    fail(`The appendix holds ${tables.map((table) => table.name).join(", ")}.`);
  }
  // A table starts on the page where the one before it ends, or on the next: no page between
  // two tactics' tables, or between two tables of candidate mitigations, goes unread.
  tables.slice(2).forEach((table, index) => {
    const before = tables[index + 1];
    const gap = table.segments[0].page - before.segments.at(-1).page;
    if (table.kind === before.kind && gap !== 0 && gap !== 1) {
      fail(`${gap} pages lie between ${before.name} and ${table.name}.`);
    }
  });
  const byName = new Map(tables.map((table) => [table.name, table]));
  const controls = controlResolver(NOT_IN_CATALOG);

  const effects = readEffects(byName.get(EFFECTS_TABLE));
  if (effects.length !== EXPECTED.effects) fail(`${EFFECTS_TABLE} has ${effects.length} effects.`);

  const candidates = readCandidateTables(byName, reader, controls, EXPECTED.candidates);

  // The names each technique and mitigation is printed under in the tactics' tables, by its
  // identifier: every name with the tables that print it, the first printed first.
  const names = new Map();
  const tactics = TACTICS.map((tactic, index) =>
    readTacticTable(byName.get(TACTIC_TABLES[index]), tactic, index + 1, {
      effectTitles: effects.map((effect) => effect.title),
      effectsTable: EFFECTS_TABLE,
      candidates,
      controls,
      names,
      expected: EXPECTED.tactics[TACTIC_TABLES[index]],
      readTactic: (table) => reader.readTactic(table),
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

  const items = [
    ...tactics.map((tactic) => tactic.item),
    ...attackItems({ names, candidates }),
    ...effects.map((effect, index) => ({
      code: effectCode(effect.title),
      kind: "effect",
      title: effect.title,
      prose: effect.definition,
      parent: effect.parent ? effectCode(effect.parent) : null,
      ordinal: index + 1,
      props: effect.note ? { note: effect.note } : {},
      printed_in: EFFECTS_TABLE,
    })),
  ];

  const document = {
    format: FORMAT,
    framework: FRAMEWORK,
    source: { ...SOURCE, rights_statement: readRightsStatement(pdf) },
    method: {
      tool: "pdftotext",
      tool_version: pdftotextVersion(),
      script: relative(projectRoot, scriptPath),
    },
    items,
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
  return [
    ...summaries.map(
      (s) =>
        `${s.table} ${s.tactic}: ${s.techniques} techniques, ${s.mitigations} mitigations in ${s.pairs} pairs with a technique, ${s.rows} rows (${s.severalApproaches} of several approaches), ${s.controls} controls printed`,
    ),
    `Tables F-3 to F-16: ${total("techniques")} techniques in their tables, ${techniques.length} different, ${count(techniques, (id) => tacticsOf(id) > 1)} in more than one table; ${total("pairs")} pairs, ${total("rows")} rows (${total("severalApproaches")} of several approaches), ${total("controls")} controls printed.`,
    `Mitigations: ${count([...names.keys()], (id) => id.startsWith("M"))} of ATT&CK, ${candidates.size} candidates defined, ${unused.length} of them in no tactic's table (${unused.join(", ")}).`,
    `Items ${document.items.length}, item links ${document.item_links.length}, control links ${document.control_links.length}, corrections ${document.corrections.length}.`,
    ...document.items.flatMap((item) =>
      (item.props.other_names ?? []).map(
        (other) =>
          `${item.code} "${item.title}" is also printed as "${other.name}" in ${other.printed_in.join(", ")}.`,
      ),
    ),
    ...NOT_IN_CATALOG.map(
      (entry) =>
        `${entry.label} (${entry.table}, page ${entry.page}) is no control of the catalog and makes no control link.`,
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
