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
 * those boxes alone. The lines of a cell start at its column's left edge, so a table's columns
 * are where its lines start. Down a column, the lines of one cell follow each other closely and
 * the first line of the next cell stands further off, past the rule between two rows. A row of a
 * tactic's table is the approaches, effects and controls that start at one height; its mitigation
 * and its technique are the last ones that started at or above it, on an earlier page too.
 *
 * Nothing is typed in from the tables but the corrections below, each bound to one cell of one
 * page, the vocabularies the result is checked against and the counts it must reach.
 */
import { readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

import {
  FORMAT,
  matchesPinned,
  parseArguments,
  pdftotext,
  pdftotextVersion,
  readSourcePdf,
  slug,
  writeFramework,
} from "./lib.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(scriptPath), "../..");
const PINNED = join(projectRoot, "supabase/reference/NIST_SP-800-160v2r1_appendix-f.json.gz");
const CATALOG = join(projectRoot, "supabase/reference/NIST_SP-800-53_rev5_catalog.json.gz");

const SOURCE = {
  title: "Developing Cyber-Resilient Systems: A Systems Security Engineering Approach",
  authority: "NIST",
  url: "https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-160v2r1.pdf",
  doi: "https://doi.org/10.6028/NIST.SP.800-160v2r1",
  sha256: "d3e9830faadfd1e7a43392194320c5203935c3d7f30f78896b55a8a53e0f0b15",
  bytes: 5201396,
  pages: 310,
  published: "2021-12-09",
};

const FRAMEWORK = {
  code: "nist-sp800-160v2r1-attack",
  title: "ATT&CK techniques and mitigations in NIST SP 800-160 Vol. 2 Rev. 1, Appendix F",
  version: "Rev. 1",
};

// The framework that holds the cyber resiliency approaches a row names.
const APPROACH_FRAMEWORK = "nist-sp800-160v2r1-cref";

// Appendix F in the pinned PDF: its pages, and how far a PDF page is from the number it prints.
const FIRST_PAGE = 171;
const LAST_PAGE = 266;
const PAGE_OFFSET = 16;
// The page of the front matter that says how the publication may be used.
const RIGHTS_PAGE = 3;

// The 50 cyber resiliency approaches of the framework. Every approach a table names is one of them.
const APPROACHES = [
  "Adaptive Management",
  "Architectural Diversity",
  "Asset Mobility",
  "Attribute-Based Usage Restriction",
  "Behavior Validation",
  "Calibrated Defense-in-Depth",
  "Consistency Analysis",
  "Contextual Unpredictability",
  "Design Diversity",
  "Disinformation",
  "Distributed Functionality",
  "Dynamic Privileges",
  "Dynamic Reconfiguration",
  "Dynamic Resource Allocation",
  "Dynamic Resource Awareness",
  "Dynamic Segmentation and Isolation",
  "Dynamic Threat Awareness",
  "Evolvability",
  "Forensic and Behavioral Analysis",
  "Fragmentation",
  "Functional Relocation of Cyber Resources",
  "Functional Relocation of Sensors",
  "Information Diversity",
  "Integrity Checks",
  "Misdirection",
  "Mission Dependency and Status Visualization",
  "Monitoring and Damage Assessment",
  "Non-Persistent Connectivity",
  "Non-Persistent Information",
  "Non-Persistent Services",
  "Obfuscation",
  "Offloading",
  "Orchestration",
  "Path Diversity",
  "Predefined Segmentation",
  "Protected Backup and Restore",
  "Provenance Tracking",
  "Purposing",
  "Replacement",
  "Replication",
  "Restriction",
  "Self-Challenge",
  "Sensor Fusion and Analysis",
  "Specialization",
  "Supply Chain Diversity",
  "Surplus Capacity",
  "Synthetic Diversity",
  "Tainting",
  "Temporal Unpredictability",
  "Trust-Based Privilege Management",
];

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

// What three rows print where an approach belongs: their mitigation applies no approach of the
// framework. Such a row keeps the words and links its technique to no approach.
const NO_APPROACH = "Standard practice";

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

// ---------------------------------------------------------------------------------------------
// Words and lines. Lengths are PDF points; a page is 612 wide and 792 high.
// ---------------------------------------------------------------------------------------------

// The notice printed up the left margin of every page ends left of this.
const MARGIN_NOTICE = 80;
// A table's text starts right of this. Running text, footnotes and the footer start at 90.
const TABLE_LEFT = 95;
// The tops of the words of one printed line differ by less, and so do the tops of the cells of
// one row.
const LEVEL = 1.5;
// A wider gap on a line lies between two cells. A word space is under 3.
const CELL_GAP = 6;
// A footnote mark's box is lower than this. A cell's text is 11.7 high or more.
const MARK_HEIGHT = 10;
// From one line's top to the next, down a column: a line of the same paragraph, a new paragraph
// of the same cell, and the first line of the next cell. Tables F-3 to F-19 have no line pitch
// outside these.
const LINE_PITCH = [10.5, 12.5];
const PARAGRAPH_PITCH = [13.5, 14.6];
const CELL_PITCH = 15.2;
// A page's first row starts 21.8 or more under the last line of the header row. Text that
// carries on from the page before starts 18.9 under it.
const CARRIED_OVER = 20.5;

function fail(message) {
  throw new Error(message);
}

function decodeEntities(text) {
  return text.replace(
    /&(amp|lt|gt|quot|apos);/g,
    (_, name) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[name],
  );
}

/** The words of pages `first` to `last` with their boxes, without the notice in the margin. */
function readPages(pdf, first, last) {
  const xhtml = pdftotext(pdf, ["-bbox-layout", "-f", String(first), "-l", String(last)]);
  const pages = xhtml
    .split(/<page /)
    .slice(1)
    .map((chunk, index) => {
      const words = [
        ...chunk.matchAll(
          /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g,
        ),
      ].map((match) => ({
        x0: Number(match[1]),
        y0: Number(match[2]),
        x1: Number(match[3]),
        y1: Number(match[4]),
        text: decodeEntities(match[5]),
      }));
      return { number: first + index, words: words.filter((word) => word.x1 > MARGIN_NOTICE) };
    });
  if (pages.length !== last - first + 1) fail(`pdftotext gave ${pages.length} pages.`);
  return pages;
}

/**
 * The printed lines of a page, top to bottom, each split into runs: the words that stand a word
 * space apart, left to right. Two cells never come that close, so a run is one line of one cell.
 */
function linesOf(words) {
  const lines = [];
  for (const word of [...words].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)) {
    let line = lines.find((candidate) => Math.abs(candidate.y - word.y0) <= LEVEL);
    if (!line) {
      line = { y: word.y0, words: [] };
      lines.push(line);
    }
    line.words.push(word);
  }
  for (const line of lines) {
    line.words.sort((a, b) => a.x0 - b.x0);
    line.runs = [];
    for (const word of line.words) {
      const run = line.runs.at(-1);
      if (run && word.x0 - run.at(-1).x1 < CELL_GAP) run.push(word);
      else line.runs.push([word]);
    }
    line.text = line.words.map((word) => word.text).join(" ");
  }
  return lines;
}

const isMark = (word) => word.y1 - word.y0 < MARK_HEIGHT && /^\d+$/.test(word.text);

/**
 * A run of a table's body: where it starts and ends, its top, the height of its first word and
 * its text without footnote marks. Each mark is kept with its footnote and the word it follows,
 * bare of a comma after it or parentheses around it: an effect, a control label or an identifier.
 */
function bodyRun(run, footnotes, where) {
  const words = run.filter((word) => !isMark(word));
  if (words.length === 0) fail(`${where}: a footnote mark stands alone.`);
  const marks = run.filter(isMark).map((mark) => {
    const before = words.filter((word) => word.x1 <= mark.x0 + 1).at(-1);
    const text = footnotes.get(mark.text);
    if (!before || !text) fail(`${where}: footnote mark ${mark.text} has no word or no footnote.`);
    const on = before.text.replace(/,$/, "");
    return { marker: mark.text, on: /^\(.*\)$/.test(on) ? on.slice(1, -1) : on, text };
  });
  return {
    x0: words[0].x0,
    x1: words.at(-1).x1,
    y: words[0].y0,
    height: words[0].y1 - words[0].y0,
    text: words.map((word) => word.text).join(" "),
    marks,
  };
}

/** Lines as one text. A line that ends in a hyphen carries on in the next without a space. */
function joinLines(lines) {
  let text = "";
  for (const line of lines) {
    if (text.endsWith("-") && /^(and|or|to)\b/.test(line)) {
      fail(`A hyphen at the end of a line hangs before "${line}".`);
    }
    text += text === "" || text.endsWith("-") ? line : ` ${line}`;
  }
  return text;
}

// ---------------------------------------------------------------------------------------------
// Tables: a caption, then on every page the header row and the body under it.
// ---------------------------------------------------------------------------------------------

// For each kind of table: the words of its header row, whatever lines the row breaks them into,
// its number of columns, and the widest indent a line takes inside a cell (Table F-1 hangs the
// lines of a bullet 7.2 in).
const KINDS = {
  effects: {
    header: ["INTENDED EFFECT", "IMPACT ON RISK", "EXPECTED RESULTS"],
    columns: 3,
    indent: 8,
  },
  tactic: {
    header: [
      "ATT&CK",
      "Technique",
      "Mitigation or Candidate",
      "Mitigation",
      "Cyber Resiliency",
      "Implementation",
      "Approaches",
      "Potential",
      "Effects",
      "Cyber",
      "Resiliency",
      "Controls",
    ],
    columns: 5,
    indent: 3,
  },
  candidate: {
    header: ["Identifier", "Name", "Description", "Cyber Resiliency", "Approaches", "Controls"],
    columns: 5,
    indent: 3,
  },
};

function kindOfTable(name) {
  if (name === EFFECTS_TABLE) return "effects";
  if (TACTIC_TABLES.includes(name)) return "tactic";
  if (CANDIDATE_TABLES.includes(name)) return "candidate";
  return null;
}

/** The kind of table whose header row ends with `lines[index]`, or null. */
function headerEndingAt(lines, index) {
  const texts = (line) => line.runs.map((run) => run.map((word) => word.text).join(" "));
  for (const [kind, { header }] of Object.entries(KINDS)) {
    const found = [];
    for (
      let first = index;
      first >= 0 &&
      found.length < header.length &&
      texts(lines[first]).every((text) => header.includes(text));
      first -= 1
    ) {
      found.push(...texts(lines[first]));
    }
    if ([...found].sort().join("|") === [...header].sort().join("|")) return kind;
  }
  return null;
}

/** The footnotes under a page's tables, by their mark: from a mark at the margin to the next. */
function footnotesOf(lines) {
  const notes = new Map();
  let mark = null;
  let text = [];
  const close = () => {
    if (mark !== null) notes.set(mark, joinLines(text));
    mark = null;
    text = [];
  };
  for (const line of lines) {
    const [first, ...rest] = line.words;
    if (/^(APPENDIX F PAGE \d+|TABLE F-\d+: .*)$/.test(line.text)) close();
    else if (isMark(first) && first.x0 < TABLE_LEFT) {
      close();
      mark = first.text;
      text = [rest.map((word) => word.text).join(" ")];
    } else if (mark !== null) text.push(line.text);
  }
  close();
  return notes;
}

/**
 * The appendix's tables in order. Each has its caption and one segment a page: the page number
 * the page prints, the top of the header row's last line and the runs of the body under it. A
 * body ends where a line starts at the page margin or the next table's caption stands.
 */
function readTables(pages) {
  const tables = [];
  for (const page of pages) {
    const lines = linesOf(page.words);
    const footer = lines.at(-1).text.match(/^APPENDIX F PAGE (\d+)$/);
    if (!footer || Number(footer[1]) !== page.number - PAGE_OFFSET) {
      fail(`PDF page ${page.number} does not print page ${page.number - PAGE_OFFSET}.`);
    }
    const printedPage = Number(footer[1]);
    let caption = null;
    for (let index = 0; index < lines.length; index += 1) {
      const captioned = lines[index].text.match(/^TABLE (F-\d+): (.+)$/);
      if (captioned) {
        caption = { name: `Table ${captioned[1]}`, caption: captioned[2] };
        continue;
      }
      const kind = headerEndingAt(lines, index);
      if (!kind) continue;
      let end = index + 1;
      while (
        end < lines.length &&
        lines[end].words[0].x0 >= TABLE_LEFT &&
        !/^TABLE [A-Z]-\d+: /.test(lines[end].text)
      ) {
        end += 1;
      }
      const where = `${caption?.name ?? tables.at(-1)?.name}, page ${printedPage}`;
      const footnotes = footnotesOf(lines.slice(end));
      const segment = {
        page: printedPage,
        headerY: lines[index].y,
        runs: lines
          .slice(index + 1, end)
          .flatMap((line) => line.runs.map((run) => bodyRun(run, footnotes, where))),
      };
      if (caption) {
        if (kindOfTable(caption.name) !== kind) fail(`${caption.name} has the header of ${kind}.`);
        tables.push({ ...caption, kind, segments: [segment] });
      } else {
        const table = tables.at(-1);
        if (!table || table.kind !== kind || table.segments.at(-1).page !== printedPage - 1) {
          fail(`Page ${printedPage} continues no table.`);
        }
        table.segments.push(segment);
      }
      caption = null;
      index = end - 1;
    }
  }
  return tables;
}

/** The left edges of a table's columns: where the lines of its cells start. */
function columnEdges(table) {
  const { indent, columns } = KINDS[table.kind];
  const starts = table.segments.flatMap((segment) => segment.runs.map((run) => run.x0));
  const edges = [];
  let previous = -Infinity;
  for (const x of starts.sort((a, b) => a - b)) {
    if (x - previous > indent) edges.push(x);
    previous = x;
  }
  if (edges.length !== columns || edges[0] < TABLE_LEFT) {
    fail(`${table.name}: lines start at ${edges.length} columns, at ${edges.join(", ")}.`);
  }
  return edges;
}

/**
 * The cells of each column of each of a table's segments. A cell is its lines in paragraphs. Text
 * at the top of a page that carries on from the page before joins the last cell of its column
 * there, as more of that cell's last paragraph.
 */
function readCells(table) {
  const edges = columnEdges(table);
  const columnOf = (run) => edges.findLastIndex((edge) => run.x0 >= edge - 0.5);
  const segments = table.segments.map((segment) => {
    const where = `${table.name}, page ${segment.page}`;
    for (const run of segment.runs) {
      const next = edges[columnOf(run) + 1];
      if (next !== undefined && run.x1 > next - 2) fail(`${where}: "${run.text}" leaves its cell.`);
    }
    const columns = edges.map((_, column) => {
      const runs = segment.runs.filter((run) => columnOf(run) === column);
      const cells = [];
      let previous = null;
      for (const run of runs.sort((a, b) => a.y - b.y)) {
        const pitch = previous === null ? Infinity : run.y - previous.y;
        if (pitch >= CELL_PITCH) {
          cells.push({ top: run.y, page: segment.page, paragraphs: [[run]] });
        } else if (pitch >= PARAGRAPH_PITCH[0] && pitch <= PARAGRAPH_PITCH[1]) {
          cells.at(-1).paragraphs.push([run]);
        } else if (pitch >= LINE_PITCH[0] && pitch <= LINE_PITCH[1]) {
          cells.at(-1).paragraphs.at(-1).push(run);
        } else {
          fail(`${where}: "${run.text}" stands ${pitch.toFixed(2)} under the line above it.`);
        }
        previous = run;
      }
      return cells;
    });
    return { page: segment.page, headerY: segment.headerY, columns };
  });
  segments.forEach((segment, index) => {
    segment.columns.forEach((cells, column) => {
      if (cells.length === 0 || cells[0].top - segment.headerY >= CARRIED_OVER) return;
      const before = segments[index - 1]?.columns[column].at(-1);
      if (!before) fail(`${table.name}, page ${segment.page}: text carries on from no cell.`);
      const [carried] = cells.splice(0, 1);
      before.paragraphs.at(-1).push(...carried.paragraphs[0]);
      before.paragraphs.push(...carried.paragraphs.slice(1));
    });
  });
  return segments;
}

const cellMarks = (cell) => cell.paragraphs.flat().flatMap((run) => run.marks);
const paragraphTexts = (cell) =>
  cell.paragraphs.map((paragraph) => joinLines(paragraph.map((run) => run.text)));

// ---------------------------------------------------------------------------------------------
// Cells as text and lists, with the corrections.
// ---------------------------------------------------------------------------------------------

// Each correction as it is used, in the order of the tables' reading.
const applied = [];

/** A cell's text with the corrections that name it applied. */
function corrected(text, table, page, column) {
  let result = text;
  for (const correction of CORRECTIONS) {
    if (
      correction.table !== table ||
      correction.page !== page ||
      correction.column !== column ||
      correction.cell !== text
    ) {
      continue;
    }
    if (result.split(correction.printed).length !== 2) {
      fail(`${table}, page ${page}: "${correction.printed}" is not once in "${result}".`);
    }
    result = result.replace(correction.printed, correction.transcribed);
    applied.push(correction);
  }
  return result;
}

/** A cell that holds one name or one text: its paragraphs read as one. */
function textOf(cell, table, column) {
  return corrected(paragraphTexts(cell).join(" "), table, cell.page, column);
}

/**
 * The entries of a cell that lists them: separated by commas, and by a new paragraph where the
 * cell breaks its list without one. An empty entry, as a stray comma leaves, is a failure, and so
 * is an entry listed twice.
 */
function listOf(cell, table, column) {
  if (!cell) return [];
  let text = "";
  for (const paragraph of paragraphTexts(cell)) {
    if (text === "") text = paragraph;
    else text += text.endsWith(",") ? ` ${paragraph}` : `, ${paragraph}`;
  }
  const entries = corrected(text, table, cell.page, column)
    .split(",")
    .map((entry) => entry.trim());
  if (entries.includes("") || new Set(entries).size !== entries.length) {
    fail(`${table}, page ${cell.page}: "${text}" has an empty entry or lists one twice.`);
  }
  return entries;
}

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
  const [, secondColumn] = columnEdges(table);
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
// Tables F-3 to F-16: a tactic's techniques.
// ---------------------------------------------------------------------------------------------

const level = (a, b) => Math.abs(a - b) <= LEVEL;

function named(text, pattern, where) {
  const match = text.match(pattern);
  if (!match) fail(`${where}: "${text}" is not a name and its identifier.`);
  return { name: match[1], id: match[2] };
}

/**
 * The rows of a tactic's table, top to bottom. A row is the approaches, effects and controls
 * that start at one height. Its mitigation is the last one that started at or above it, and its
 * technique likewise. A table names a technique once, and a technique a mitigation once.
 */
function readTactic(table) {
  const rows = [];
  const techniques = new Set();
  let mitigations = new Set();
  let technique = null;
  let mitigation = null;
  for (const segment of readCells(table)) {
    const where = `${table.name}, page ${segment.page}`;
    const [techniqueCells, mitigationCells, ...right] = segment.columns;
    const tops = [];
    for (const cell of right.flat().sort((a, b) => a.top - b.top)) {
      if (tops.length === 0 || !level(tops.at(-1), cell.top)) tops.push(cell.top);
    }
    const at = (cells, top) => cells.find((cell) => level(cell.top, top));
    for (const cell of [...techniqueCells, ...mitigationCells]) {
      if (!tops.some((top) => level(cell.top, top))) {
        fail(`${where}: "${paragraphTexts(cell).join(" ")}" starts at no row.`);
      }
    }
    for (const top of tops) {
      const started = at(techniqueCells, top);
      if (started) {
        technique = named(textOf(started, table.name, "technique"), /^(.+) \((T\d{4})\)$/, where);
        if (techniques.has(technique.id) || cellMarks(started).length > 0) {
          fail(`${where}: ${technique.id} stands twice or carries a footnote.`);
        }
        techniques.add(technique.id);
        mitigations = new Set();
        mitigation = null;
      }
      const offered = at(mitigationCells, top);
      if (offered) {
        mitigation = {
          ...named(textOf(offered, table.name, "mitigation"), /^(.+) \((C?M\d{4})\)$/, where),
          footnotes: cellMarks(offered),
        };
        if (!technique || mitigations.has(mitigation.id)) {
          fail(`${where}: ${mitigation.id} stands under no technique or twice under one.`);
        }
        mitigations.add(mitigation.id);
      }
      if (!technique || !mitigation) fail(`${where}: a row has no technique or no mitigation.`);
      const [approachCell, effectCell, controlCell] = right.map((cells) => at(cells, top));
      const approaches = listOf(approachCell, table.name, "approaches");
      const effects = listOf(effectCell, table.name, "effects");
      const controls = listOf(controlCell, table.name, "controls");
      const unnamed = approaches.length === 1 && approaches[0] === NO_APPROACH;
      if (
        approaches.length === 0 ||
        (!unnamed && (effects.length === 0 || controls.length === 0))
      ) {
        fail(`${where}: a row of ${mitigation.id} under ${technique.id} lacks a cell.`);
      }
      // A footnote stands on a mitigation's identifier, on an effect or on a control. The first
      // two qualify the whole row, the last one control.
      const marks = {
        approach: approachCell ? cellMarks(approachCell) : [],
        effect: effectCell ? cellMarks(effectCell) : [],
        control: controlCell ? cellMarks(controlCell) : [],
      };
      if (
        marks.approach.length > 0 ||
        mitigation.footnotes.some((mark) => mark.on !== mitigation.id) ||
        marks.effect.some((mark) => !effects.includes(mark.on)) ||
        marks.control.some((mark) => !controls.includes(mark.on))
      ) {
        fail(`${where}: a footnote mark of ${mitigation.id} under ${technique.id} is misplaced.`);
      }
      rows.push({
        page: segment.page,
        technique,
        mitigation,
        approaches: unnamed ? [] : approaches,
        unnamed,
        effects,
        controls,
        footnotes: [...mitigation.footnotes, ...marks.effect],
        controlFootnotes: marks.control,
      });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------------------------
// Tables F-17 to F-19: the candidate mitigations.
// ---------------------------------------------------------------------------------------------

/** The rows of a table of candidate mitigations. The five cells of a row start at one height. */
function readCandidates(table) {
  const candidates = [];
  for (const segment of readCells(table)) {
    const where = `${table.name}, page ${segment.page}`;
    const [identifiers, ...rest] = segment.columns;
    if (rest.some((cells) => cells.length !== identifiers.length)) {
      fail(`${where}: the columns do not hold one cell a row.`);
    }
    identifiers.forEach((identifier, row) => {
      const id = paragraphTexts(identifier).join(" ");
      const cells = rest.map((column) => column[row]);
      if (
        !/^CM\d{4}$/.test(id) ||
        [identifier, ...cells].some(
          (cell) => !level(cell.top, identifier.top) || cellMarks(cell).length > 0,
        )
      ) {
        fail(`${where}: the row of "${id}" is not a candidate mitigation's.`);
      }
      const [name, description, approaches, controls] = cells;
      candidates.push({
        table: table.name,
        page: segment.page,
        id,
        name: textOf(name, table.name, "name"),
        description: textOf(description, table.name, "description"),
        approaches: listOf(approaches, table.name, "approaches"),
        controls: listOf(controls, table.name, "controls"),
      });
    });
  }
  return candidates;
}

// ---------------------------------------------------------------------------------------------
// The document.
// ---------------------------------------------------------------------------------------------

/** What the publication says about its own reuse, from the front matter. */
function readRightsStatement(pdf) {
  const text = pdftotext(pdf, ["-f", String(RIGHTS_PAGE), "-l", String(RIGHTS_PAGE)]);
  const statement = text
    .replace(/\s+/g, " ")
    .match(
      /This publication may be used by [^.]* not subject to copyright [^.]*\. Attribution [^.]*\./,
    );
  if (!statement) fail(`Page ${RIGHTS_PAGE} does not say how the publication may be used.`);
  return statement[0];
}

/**
 * The labels of the active controls of the pinned SP 800-53 Rev. 5 catalog, as `SC-30(4)`: the
 * label the catalog gives a control without a class, which is the one the import resolves.
 */
function activeControls() {
  const { catalog } = JSON.parse(gunzipSync(readFileSync(CATALOG)).toString("utf8"));
  const active = new Set();
  const walk = (controls) => {
    for (const control of controls ?? []) {
      const label = control.props?.find((p) => p.name === "label" && p.class === undefined)?.value;
      if (!label) fail(`The catalog gives ${control.id} no label.`);
      const withdrawn = control.props.some((p) => p.name === "status" && p.value === "withdrawn");
      if (!withdrawn) active.add(label);
      walk(control.controls);
    }
  };
  for (const group of catalog.groups) walk(group.controls);
  return active;
}

// A link is identified by its table's number, as `F-3`, and what it links.
const tableCode = (name) => name.slice("Table ".length);
const approachReference = (name) => `${APPROACH_FRAMEWORK}:approach.${slug(name)}`;
const tacticCode = (name) => `tactic.${slug(name)}`;
const effectCode = (title) => `effect.${slug(title)}`;

function checkApproaches(names, where) {
  for (const name of names) {
    if (!APPROACHES.includes(name)) fail(`${where}: "${name}" is no approach of the framework.`);
  }
}

/**
 * Sorts printed control labels into those that name an active control of the catalog and those
 * listed as naming none. Any other label is a failure.
 */
function controlResolver() {
  const active = activeControls();
  const met = new Set();
  return {
    met,
    resolve(labels, table, page) {
      const resolved = [];
      const missing = [];
      for (const label of labels) {
        if (!/^[A-Z]{2}-[1-9][0-9]*(\([1-9][0-9]*\))?$/.test(label)) {
          fail(`${table}, page ${page}: "${label}" is not a control label.`);
        }
        const listed = NOT_IN_CATALOG.find(
          (entry) => entry.table === table && entry.page === page && entry.label === label,
        );
        if (active.has(label) === Boolean(listed)) {
          fail(`${table}, page ${page}: ${label} is ${listed ? "an" : "no"} active control.`);
        }
        if (listed) met.add(listed);
        (listed ? missing : resolved).push(label);
      }
      return { resolved, missing };
    },
  };
}

/** The item of a tactic and the links of its table's rows. */
function readTacticTable(table, tactic, ordinal, { effectTitles, candidates, controls, names }) {
  if (!new RegExp(` ON ${tactic.toUpperCase()}( TECHNIQUES)?$`).test(table.caption)) {
    fail(`${table.name} is not the table of ${tactic}: ${table.caption}`);
  }
  const item = {
    code: tacticCode(tactic),
    kind: "tactic",
    title: tactic,
    prose: null,
    parent: null,
    ordinal,
    props: { caption: table.caption },
    printed_in: table.name,
  };
  const itemLinks = [];
  const controlLinks = [];
  const tacticLinks = new Map();
  const rowsOfPair = new Map();
  const rows = readTactic(table);
  for (const row of rows) {
    const { technique, mitigation } = row;
    for (const printed of [technique, mitigation]) {
      if (!names.has(printed.id)) names.set(printed.id, new Map());
      const tables = names.get(printed.id).get(printed.name) ?? [];
      if (!tables.includes(table.name)) tables.push(table.name);
      names.get(printed.id).set(printed.name, tables);
    }
    if (mitigation.id.startsWith("CM") && !candidates.has(mitigation.id)) {
      fail(`${table.name}: Tables F-17 to F-19 do not define ${mitigation.id}.`);
    }
    const pair = `${tableCode(table.name)}:${technique.id}:${mitigation.id}`;
    const rowOrdinal = (rowsOfPair.get(pair) ?? 0) + 1;
    rowsOfPair.set(pair, rowOrdinal);
    const identifier = `${pair}:${rowOrdinal}`;
    if (!tacticLinks.has(technique.id)) {
      tacticLinks.set(technique.id, {
        source_identifier: `${tableCode(table.name)}:${technique.id}`,
        source: technique.id,
        target: item.code,
        relation: "tactic",
        ordinal: null,
        props: {},
        printed_in: table.name,
      });
      itemLinks.push(tacticLinks.get(technique.id));
    }
    for (const effect of row.effects) {
      if (!effectTitles.includes(effect)) {
        fail(`${identifier}: "${effect}" is no effect of ${EFFECTS_TABLE}.`);
      }
    }
    checkApproaches(row.approaches, identifier);
    const { resolved, missing } = controls.resolve(row.controls, table.name, row.page);
    const approaches = row.approaches.map(approachReference);
    // What every link of the row carries besides its own target.
    const shared = {
      ...(missing.length > 0 ? { controls_not_in_catalog: missing } : {}),
      ...(row.footnotes.length > 0 ? { footnotes: row.footnotes } : {}),
    };
    if (row.unnamed) {
      // The row has no approach to link its technique to, so the technique's tactic link keeps it.
      const { props } = tacticLinks.get(technique.id);
      props.rows_without_approach = [
        ...(props.rows_without_approach ?? []),
        {
          mitigation: mitigation.id,
          ordinal: rowOrdinal,
          approach_as_printed: NO_APPROACH,
          effects: row.effects,
          controls: resolved,
          ...shared,
        },
      ];
    }
    for (const approach of approaches) {
      itemLinks.push({
        // A row of several approaches makes a link for each, told apart by the approach.
        source_identifier:
          approaches.length === 1 ? identifier : `${identifier}:${approach.split(".")[1]}`,
        source: technique.id,
        target: approach,
        relation: "affected-by",
        ordinal: rowOrdinal,
        props: {
          tactic: item.code,
          mitigation: mitigation.id,
          effects: row.effects,
          ...shared,
        },
        printed_in: table.name,
      });
    }
    for (const control of resolved) {
      const footnotes = [
        ...row.footnotes,
        ...row.controlFootnotes.filter((note) => note.on === control),
      ];
      controlLinks.push({
        source_identifier: `${identifier}:${control}`,
        control,
        item: technique.id,
        relation: "mitigates",
        ordinal: rowOrdinal,
        props: {
          tactic: item.code,
          mitigation: mitigation.id,
          approach: approaches.length === 1 ? approaches[0] : null,
          approaches,
          ...(row.unnamed ? { approach_as_printed: NO_APPROACH } : {}),
          effects: row.effects,
          ...shared,
          ...(footnotes.length > 0 ? { footnotes } : {}),
        },
        printed_in: table.name,
      });
    }
  }
  const summary = {
    table: table.name,
    tactic,
    techniques: tacticLinks.size,
    mitigations: new Set(rows.map((row) => row.mitigation.id)).size,
    pairs: rowsOfPair.size,
    rows: rows.length,
    severalApproaches: rows.filter((row) => row.approaches.length > 1).length,
    controls: rows.reduce((sum, row) => sum + row.controls.length, 0),
  };
  for (const [what, count] of Object.entries(EXPECTED.tactics[table.name])) {
    if (summary[what] !== count) fail(`${table.name} has ${summary[what]} ${what}, not ${count}.`);
  }
  return { item, itemLinks, controlLinks, summary };
}

function buildDocument(pdf) {
  const tables = readTables(readPages(pdf, FIRST_PAGE, LAST_PAGE));
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
  const controls = controlResolver();

  const effects = readEffects(byName.get(EFFECTS_TABLE));
  if (effects.length !== EXPECTED.effects) fail(`${EFFECTS_TABLE} has ${effects.length} effects.`);

  const candidates = new Map();
  for (const name of CANDIDATE_TABLES) {
    for (const candidate of readCandidates(byName.get(name))) {
      const where = `${name}, page ${candidate.page}, ${candidate.id}`;
      if (candidates.has(candidate.id)) fail(`${where} is defined twice.`);
      checkApproaches(candidate.approaches, where);
      controls.resolve(candidate.controls, name, candidate.page);
      if (!candidate.description.endsWith(".")) fail(`${where}: the description is cut short.`);
      candidates.set(candidate.id, candidate);
    }
    const defined = [...candidates.values()].filter((candidate) => candidate.table === name);
    if (defined.length !== EXPECTED.candidates[name]) {
      fail(`${name} defines ${defined.length} candidate mitigations.`);
    }
  }

  // The names each technique and mitigation is printed under in the tactics' tables, by its
  // identifier: every name with the tables that print it, the first printed first.
  const names = new Map();
  const context = {
    effectTitles: effects.map((effect) => effect.title),
    candidates,
    controls,
    names,
  };
  const tactics = TACTICS.map((tactic, index) =>
    readTacticTable(byName.get(TACTIC_TABLES[index]), tactic, index + 1, context),
  );

  const unused = [
    ...CORRECTIONS.filter((correction) => applied.filter((a) => a === correction).length !== 1),
    ...NOT_IN_CATALOG.filter((entry) => !controls.met.has(entry)),
  ];
  if (unused.length > 0) {
    const [{ table, page, printed, label }] = unused;
    fail(`"${printed ?? label}" (${table}, page ${page}) is not met exactly once.`);
  }

  // A technique and an ATT&CK mitigation take the name the first table that prints them gives,
  // a candidate mitigation the name of the table that defines it. Other printed names stay on
  // the item.
  const otherNames = (id, title) => {
    const others = [...(names.get(id) ?? [])].filter(([name]) => name !== title);
    if (others.length === 0) return {};
    return { other_names: others.map(([name, printedIn]) => ({ name, printed_in: printedIn })) };
  };
  const firstNamed = (kind, prefix) =>
    [...names.keys()]
      .filter((id) => id.startsWith(prefix))
      .map((id, index) => {
        const [[title, [printedIn]]] = names.get(id);
        return {
          code: id,
          kind,
          title,
          prose: null,
          parent: null,
          ordinal: index + 1,
          props: otherNames(id, title),
          printed_in: printedIn,
        };
      });
  const items = [
    ...tactics.map((tactic) => tactic.item),
    ...firstNamed("attack-technique", "T"),
    ...firstNamed("mitigation", "M"),
    ...[...candidates.values()].map((candidate, index) => ({
      code: candidate.id,
      kind: "candidate-mitigation",
      title: candidate.name,
      prose: candidate.description,
      parent: null,
      ordinal: index + 1,
      props: {
        approaches: candidate.approaches.map(approachReference),
        controls: candidate.controls,
        ...otherNames(candidate.id, candidate.name),
      },
      printed_in: candidate.table,
    })),
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
