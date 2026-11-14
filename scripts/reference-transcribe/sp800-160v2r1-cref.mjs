#!/usr/bin/env node
/**
 * Transcribes the cyber resiliency constructs of NIST SP 800-160 Vol. 2 Rev. 1 from its PDF, the
 * only form NIST publishes them in: the goals (Table 2) and the objectives (Table 3) with the
 * discussion printed for each, the techniques and their approaches with the discussion and the
 * examples printed for each (Table D-4), the architectural layers each approach can be used at
 * (Table D-5), the strategic and structural design principles (Tables D-6 and D-9), what supports
 * what (Tables D-12 to D-15) and the SP 800-53 controls that support each approach (Table E-1).
 *
 *   node scripts/reference-transcribe/sp800-160v2r1-cref.mjs --pdf <path> [--json <copy>] [--check]
 *
 * It writes the pinned file under supabase/reference, or with --check compares with it and writes
 * nothing. It reads every word with its box on the page (`pdftotext -tsv`), so a table's columns
 * are told apart by where they stand and never by the spacing of a text dump. Nothing a table
 * holds is typed here but the corrections list; the small vocabularies below only check what was
 * read, and anything the script does not expect stops it.
 */
import { fileURLToPath } from "node:url";

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

const SCRIPT = "scripts/reference-transcribe/sp800-160v2r1-cref.mjs";
const PINNED = fileURLToPath(
  new URL("../../supabase/reference/NIST_SP-800-160v2r1_cyber-resiliency.json.gz", import.meta.url),
);

const FRAMEWORK = {
  code: "nist-sp800-160v2r1-cref",
  title: "NIST SP 800-160 Vol. 2 Rev. 1 cyber resiliency constructs",
  version: "Rev. 1",
};

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

// Where each table is. `pages` are PDF pages, 16 ahead of the page numbers the publication
// prints. `headingEnd` is the word that closes the column headings, which every page of a table
// repeats. `starts` are the left edges of the columns, in points: where the text of each starts,
// or, in a table of X marks, a point between the names and the first marks.
const TABLES = {
  goals: {
    name: "Table 2",
    caption: "2:",
    pages: [26, 26],
    headingEnd: "DESCRIPTION",
    starts: [95.64, 162.9],
  },
  objectives: {
    name: "Table 3",
    caption: "3:",
    pages: [27, 28],
    headingEnd: "DESCRIPTION",
    starts: [95.64, 171.9],
  },
  approaches: {
    name: "Table D-4",
    caption: "D-4:",
    pages: [109, 121],
    headingEnd: "EXAMPLES",
    starts: [95.64, 216.9, 367.9],
  },
  // The techniques, their approaches and a column of X marks under each layer. The layers'
  // headings are printed turned up the page, above the word that closes the headings.
  layers: {
    name: "Table D-5",
    caption: "D-5:",
    pages: [122, 125],
    headingEnd: "TECHNIQUES",
    starts: [95.28, 170, 240],
  },
  strategic: {
    name: "Table D-6",
    caption: "D-6:",
    pages: [126, 128],
    headingEnd: "DISCIPLINES",
    starts: [95.64, 207.9, 369.9],
  },
  structural: {
    name: "Table D-9",
    caption: "D-9:",
    pages: [134, 136],
    headingEnd: "DISCIPLINES",
    starts: [95.64, 207.9, 373.9],
  },
  objectiveGoals: {
    name: "Table D-12",
    caption: "D-12:",
    pages: [148, 148],
    headingEnd: "Objectives",
    starts: [95.64, 200],
  },
  techniqueObjectives: {
    name: "Table D-13",
    caption: "D-13:",
    pages: [149, 151],
    headingEnd: "Techniques/Approaches",
    starts: [95.64, 230],
  },
  strategicObjectives: {
    name: "Table D-14",
    caption: "D-14:",
    pages: [151, 151],
    headingEnd: "Principles",
    starts: [95.64, 230],
  },
  structuralTechniques: {
    name: "Table D-15",
    caption: "D-15:",
    pages: [151, 152],
    headingEnd: "TECHNIQUE",
    starts: [95.64, 252.9],
  },
  controls: {
    name: "Table E-1",
    caption: "E-1:",
    pages: [156, 170],
    headingEnd: "[APPROACHES]",
    starts: [95.64, 144.9, 342.9],
  },
};

// Every place the transcription departs from the printed text, in the order of the publication.
// An entry with a `row` rewrites the text of that row where it is read. An entry with `alias` is
// a name one table prints in other words than the table that defines it. The others say how the
// names are written. The run stops unless every entry of the first two kinds fits what it reads.
const CORRECTIONS = [
  {
    printed_in: "Table 2",
    printed: "Goal names in capitals, such as ANTICIPATE",
    transcribed: "Goal names with an initial capital, such as Anticipate",
    reason: "The running text of the publication writes the goals this way.",
  },
  {
    printed_in: "Table 3",
    printed: "Objective names in capitals, such as RE-ARCHITECT and PREVENT OR AVOID",
    transcribed: "Objective names in title case, such as Re-Architect and Prevent or Avoid",
    reason:
      'Table D-13 and the running text write seven of the names this way. They shorten the eighth to Prevent/Avoid; its title keeps the words of Table 3 in the letter case of the section headings of Appendix D, which keep "or" in lower case.',
  },
  {
    printed_in: "Table 3",
    row: "CONSTRAIN",
    printed: "Limit damage 26 from adversity.",
    transcribed: "Limit damage from adversity.",
    reason: "The 26 is the raised reference mark of footnote 26, not part of the definition.",
  },
  {
    printed_in: "Table D-4",
    printed:
      "Technique and approach names in capitals, such as NON-PERSISTENCE and MONITORING AND DAMAGE ASSESSMENT",
    transcribed:
      "Technique and approach names in title case, such as Non-Persistence and Monitoring and Damage Assessment",
    reason: "Tables D-13, D-15 and E-1 write every one of the names this way.",
  },
  {
    printed_in: "Table D-4",
    row: "DECEPTION, Definition",
    printed: "to the adversary. 115",
    transcribed: "to the adversary.",
    reason: "The 115 is the raised reference mark of footnote 115, not part of the definition.",
  },
  {
    printed_in: "Table D-5",
    printed:
      "Layer names and the headings above them in capitals, such as OPERATING SYSTEM, TECHNICAL SYSTEM AS A WHOLE and SOCIO-TECHNICAL SYSTEM",
    transcribed:
      "Layer names and the headings above them in title case, such as Operating System, Technical System as a Whole and Socio-Technical System",
    reason:
      "The letter case of the publication's headings, in which the transcription writes every name a table prints in capitals, as the techniques and approaches of Table D-4. The text before the table writes the layers in lower case, as in “other software”.",
  },
  {
    printed_in: "Table D-6",
    printed: "Principle names in capitals with a full stop, such as REDUCE ATTACK SURFACES.",
    transcribed:
      "Principle names in title case without the full stop, such as Reduce Attack Surfaces",
    reason: "The headings of Sections D.5.1.1 to D.5.1.5 write the names this way.",
  },
  {
    printed_in: "Table D-9",
    printed: "Principle names in capitals with a full stop, such as LIMIT THE NEED FOR TRUST.",
    transcribed:
      "Principle names in title case without the full stop, such as Limit the Need for Trust",
    reason:
      "The headings of Sections D.5.2.1 to D.5.2.13 write the names this way. The heading of Section D.5.2.14 words the last principle differently, as Make Deception and Unpredictability Effects User-Transparent; its title keeps the words of the table.",
  },
  {
    printed_in: "Table D-12",
    alias: true,
    printed: "PREVENT/AVOID",
    transcribed: "Prevent or Avoid",
    reason: "The row shortens the name Table 3 gives the objective.",
  },
  {
    printed_in: "Table D-13",
    alias: true,
    printed: "Prevent / Avoid",
    transcribed: "Prevent or Avoid",
    reason: "The column heading shortens the name Table 3 gives the objective.",
  },
  {
    printed_in: "Table D-14",
    alias: true,
    printed: "Prevent / Avoid",
    transcribed: "Prevent or Avoid",
    reason: "The column heading shortens the name Table 3 gives the objective.",
  },
  {
    printed_in: "Table D-15",
    row: "MAINTAIN SITUATIONAL AWARENESS.",
    printed: "Analytic Monitoring, Contextual Awareness,",
    transcribed: "Analytic Monitoring, Contextual Awareness",
    reason: "The row ends in a comma that no third technique follows.",
  },
  {
    printed_in: "Table E-1",
    row: "CM-5(6)",
    printed: "Privilege Restriction Trust-Based Privilege Management]",
    transcribed: "Privilege Restriction [Trust-Based Privilege Management]",
    reason: "The row for CM-5(6) leaves out the bracket that opens the approaches.",
  },
  {
    printed_in: "Table E-1",
    row: "SC-7(15)",
    printed: "Trust-Based Privileged Management",
    transcribed: "Trust-Based Privilege Management",
    reason:
      "The row for SC-7(15) misspells the approach that Table D-4 and every other row name Trust-Based Privilege Management.",
  },
  {
    printed_in: "Table E-1",
    row: "SI-19(6)",
    printed: "Uncertainty [Contextual Uncertainty]",
    transcribed: "Unpredictability [Contextual Unpredictability]",
    reason:
      "The row for SI-19(6) names a technique and an approach the publication does not define. Table D-4 defines Unpredictability and its approach Contextual Unpredictability, and Table F-19 names SI-19(6) for a mitigation that uses Contextual Unpredictability.",
  },
];

// The first part of an item's code, by the item's kind.
const CODE_PREFIX = {
  goal: "goal",
  objective: "objective",
  technique: "technique",
  approach: "approach",
  "architectural-layer": "layer",
  "strategic-design-principle": "strategic-principle",
  "structural-design-principle": "structural-principle",
};

// What the tables hold. A count that differs means the PDF was read differently, not that the
// publication changed: the PDF is pinned.
const EXPECTED = {
  items: {
    goal: 4,
    objective: 8,
    technique: 14,
    approach: 50,
    "architectural-layer": 11,
    "strategic-design-principle": 5,
    "structural-design-principle": 14,
  },
  links: {
    "Table D-5": 240,
    "Table D-12": 19,
    "Table D-13": 204,
    "Table D-14": 26,
    "Table D-15": 65,
  },
  controlRows: 265,
  controlLinks: 421,
  // Tables 2 and 3 print a discussion for every goal and objective, Table D-4 for every technique
  // and approach, and examples for every approach: 193 bullets in all.
  discussions: { goal: 4, objective: 8, technique: 14, approach: 50 },
  approachesWithExamples: 50,
  examples: 193,
};

// The control families Table E-1 prints as headings, with the label prefix of the rows under each.
const FAMILIES = new Map([
  ["ACCESS CONTROL", "AC"],
  ["AWARENESS AND TRAINING", "AT"],
  ["AUDIT AND ACCOUNTABILITY", "AU"],
  ["ASSESSMENT, AUTHORIZATION, AND MONITORING", "CA"],
  ["CONFIGURATION MANAGEMENT", "CM"],
  ["CONTINGENCY PLANNING", "CP"],
  ["IDENTIFICATION AND AUTHENTICATION", "IA"],
  ["INCIDENT RESPONSE", "IR"],
  ["MAINTENANCE", "MA"],
  ["PHYSICAL AND ENVIRONMENTAL PROTECTION", "PE"],
  ["PLANNING", "PL"],
  ["PROGRAM MANAGEMENT", "PM"],
  ["RISK ASSESSMENT", "RA"],
  ["SYSTEM AND SERVICES ACQUISITION", "SA"],
  ["SYSTEM AND COMMUNICATIONS PROTECTION", "SC"],
  ["SYSTEM AND INFORMATION INTEGRITY", "SI"],
  ["SUPPLY CHAIN RISK MANAGEMENT", "SR"],
]);

// The words a title keeps in lower case, as the publication's headings do.
const MINOR_WORDS = new Set(["a", "and", "as", "for", "in", "of", "on", "or", "the", "to"]);

const MARGIN_NOTE =
  "This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-160v2r1";
// The note runs up the left margin, left of MARGIN_NOTE_RIGHT. Running text, footnotes and
// footers start at 90 pt and a table's cells at 95.64 pt, so a line that starts left of TEXT_LEFT
// is no cell.
const MARGIN_NOTE_RIGHT = 60;
const TEXT_LEFT = 93;
// Words whose tops are closer than this stand on one line: the tops of one line differ by at
// most 2.4 pt and two lines are at least 9.5 pt apart.
const SAME_LINE = 4;
// A name's next line follows within this, at 11 pt; the name of the next row starts at least
// 17 pt further down.
const NEXT_ROW = 14;

function stop(message) {
  throw new Error(message);
}

function requireCount(what, found, expected) {
  if (found !== expected) stop(`${what}: read ${found}, expected ${expected}.`);
}

/** Every word of the PDF with its box in points, by page number. */
function readPages(pdf) {
  const pages = [];
  for (const row of pdftotext(pdf, ["-tsv"]).split("\n")) {
    const [level, page, , , , , left, top, width, height, , ...text] = row.split("\t");
    if (level === "1") pages[Number(page)] = [];
    if (level !== "5") continue;
    pages[Number(page)].push({
      page: Number(page),
      left: Number(left),
      top: Number(top),
      right: Number(left) + Number(width),
      bottom: Number(top) + Number(height),
      height: Number(height),
      text: text.join("\t"),
    });
  }
  requireCount("Pages", pages.length - 1, SOURCE.pages);
  return pages;
}

/** A page's words without the note printed up its left margin. */
function pageWords(pages, page) {
  const note = pages[page].filter((word) => word.left < MARGIN_NOTE_RIGHT);
  const printed = note.map((word) => word.text).join(" ");
  if (note.length > 0 && printed !== MARGIN_NOTE) {
    stop(`Page ${page} prints something else than the note in its margin: ${printed}`);
  }
  return pages[page].filter((word) => word.left >= MARGIN_NOTE_RIGHT);
}

/** Words as lines of text, top to bottom and page after page. */
function linesOf(words) {
  const lines = [];
  const inOrder = [...words].sort((a, b) => a.page - b.page || a.top - b.top || a.left - b.left);
  for (const word of inOrder) {
    const line = lines.at(-1);
    if (line && line.page === word.page && word.top - line.top < SAME_LINE) line.words.push(word);
    else lines.push({ page: word.page, top: word.top, words: [word] });
  }
  for (const line of lines) {
    line.words.sort((a, b) => a.left - b.left);
    line.text = line.words.map((word) => word.text).join(" ");
  }
  return lines;
}

/**
 * Lines as running text. A line that ends in a hyphen breaks a hyphenated word, so the next line
 * joins it without a space.
 */
function joinLines(lines) {
  return lines.reduce(
    (text, line) =>
      text === "" || /[A-Za-z]-$/.test(text) ? text + line.text : `${text} ${line.text}`,
    "",
  );
}

/**
 * One page of a table: `body` holds the words below the word that closes the column headings and
 * above the next line that starts at the page margin (running text, a footnote, the footer) or
 * opens another table. `heading` is that closing word and `words` the whole page.
 */
function tableBody(pages, table, page) {
  const words = pageWords(pages, page);
  if (
    page === table.pages[0] &&
    !words.some((word, at) => word.text === "TABLE" && words[at + 1]?.text === table.caption)
  ) {
    stop(`${table.name} does not start on page ${page}.`);
  }
  const headings = words.filter((word) => word.text === table.headingEnd);
  if (headings.length !== 1) {
    stop(`${table.name}, page ${page}: ${headings.length} words read "${table.headingEnd}".`);
  }
  const [heading] = headings;
  const below = words.filter((word) => word.top > heading.bottom - SAME_LINE);
  const end = Math.min(
    ...below
      .filter((word) => word.left < TEXT_LEFT || word.text === "TABLE")
      .map((word) => word.top),
  );
  return { words, heading, body: below.filter((word) => word.top < end - SAME_LINE) };
}

/** Sorts words into a table's columns by where each word starts. */
function columnsOf(table, words) {
  const columns = table.starts.map(() => []);
  for (const word of words) {
    const column = table.starts.findLastIndex((start) => word.left > start - 1);
    const next = table.starts[column + 1];
    if (column === -1 || (next !== undefined && word.right > next - 1)) {
      stop(`${table.name}, page ${word.page}: "${word.text}" does not stand inside a column.`);
    }
    columns[column].push(word);
  }
  return columns;
}

/** A table's columns as lines of text, over all its pages. */
function readColumns(pages, table) {
  const words = [];
  for (let page = table.pages[0]; page <= table.pages[1]; page += 1) {
    words.push(...tableBody(pages, table, page).body);
  }
  return columnsOf(table, words).map(linesOf);
}

/** Whether a line stands at or below the first line of a row, page after page. */
function isBeside(line, row) {
  return line.page > row.page || (line.page === row.page && line.top > row.top - SAME_LINE);
}

/**
 * The rows of a table that names each row in its first column, each with the lines the other
 * columns print beside it. A cell may run on to the next page.
 */
function rowsOf(table, names, ...columns) {
  const rows = [];
  for (const line of names) {
    const row = rows.at(-1);
    if (row && row.page === line.page && line.top - row.lines.at(-1).top < NEXT_ROW) {
      row.lines.push(line);
    } else {
      rows.push({ page: line.page, top: line.top, lines: [line], cells: columns.map(() => []) });
    }
  }
  columns.forEach((lines, column) => {
    for (const line of lines) {
      const row = rows.findLast((candidate) => isBeside(line, candidate));
      if (!row) stop(`${table.name}: "${line.text}" stands above the first row.`);
      row.cells[column].push(line);
    }
  });
  for (const row of rows) row.name = joinLines(row.lines);
  return rows;
}

// The corrections that fitted what they read.
const used = new Set();

/** The text of one row after the corrections listed for it. */
function corrected(table, row, printed) {
  let text = printed;
  for (const correction of CORRECTIONS) {
    if (correction.printed_in !== table.name || correction.row !== row) continue;
    if (text.split(correction.printed).length !== 2) {
      stop(`${table.name}, ${row}: the correction does not fit what is printed: ${printed}`);
    }
    text = text.replace(correction.printed, correction.transcribed);
    used.add(correction);
  }
  return text;
}

/** The correction that says a table prints a name in other words, if one does. */
function aliasOf(table, title) {
  return CORRECTIONS.find(
    (entry) => entry.alias && entry.printed_in === table.name && entry.transcribed === title,
  );
}

/**
 * A cell's lines as text. A footnote's reference mark is printed small and raised and is not part
 * of the text, so it goes, and nothing else, where the corrections list says so.
 */
function proseOf(table, row, lines) {
  const printed = joinLines(lines);
  const withoutMarks = joinLines(
    lines.map((line) => {
      const tallest = Math.max(...line.words.map((word) => word.height));
      const kept = line.words.filter(
        (word) => !(/^\d+$/.test(word.text) && word.height < 0.75 * tallest),
      );
      return { text: kept.map((word) => word.text).join(" ") };
    }),
  );
  const text = corrected(table, row, printed);
  if (text !== withoutMarks) {
    stop(`${table.name}, ${row}: the corrections do not account for a footnote mark: ${printed}`);
  }
  return text;
}

function isCapitals(text) {
  return /[A-Z]/.test(text) && !/[a-z]/.test(text);
}

/** A name printed in capitals, in the letter case the publication's headings use. */
function titleCase(capitals) {
  return capitals
    .toLowerCase()
    .replace(/[a-z]+/g, (word, at) =>
      at > 0 && MINOR_WORDS.has(word) ? word : word[0].toUpperCase() + word.slice(1),
    );
}

/**
 * Tables 2 and 3: a name, then its definition, which ends where "Discussion:" starts, and the
 * discussion to the end of the row, on the next page too.
 */
function readDefinitions(pages, table) {
  const [names, descriptions] = readColumns(pages, table);
  return rowsOf(table, names, descriptions).map((row) => {
    const discussion = row.cells[0].findIndex((line) => line.text.startsWith("Discussion:"));
    if (!isCapitals(row.name) || discussion < 1) {
      stop(`${table.name}: "${row.name}" is not a name with a definition and a discussion.`);
    }
    const discussed = proseOf(table, `${row.name}, Discussion`, row.cells[0].slice(discussion));
    return {
      title: titleCase(row.name),
      prose: proseOf(table, row.name, row.cells[0].slice(0, discussion)),
      discussion: discussed.slice("Discussion:".length).trim(),
    };
  });
}

/**
 * One column of Table D-4 as its entries: a name in capitals, then paragraphs that each open with
 * one of `labels`, such as "Definition:".
 */
function entriesOf(table, lines, labels) {
  const entries = [];
  let collecting = null;
  for (const line of lines) {
    const entry = entries.at(-1);
    const label = labels.find((candidate) => line.text.startsWith(candidate));
    if (label) {
      if (!entry || entry.parts[label]) stop(`${table.name}: a stray "${label}" paragraph.`);
      collecting = entry.parts[label] = [line];
    } else if (isCapitals(line.text) && collecting !== entry?.name) {
      entries.push({ page: line.page, top: line.top, name: [line], parts: {} });
      collecting = entries.at(-1).name;
    } else if (collecting && isCapitals(line.text) === (collecting === entry.name)) {
      collecting.push(line);
    } else {
      stop(`${table.name}: "${line.text}" follows a name without a label.`);
    }
  }
  for (const entry of entries) {
    entry.printed = joinLines(entry.name);
    entry.title = titleCase(entry.printed);
  }
  return entries;
}

/** The mark that opens each entry of a bulleted list. */
const BULLET = "\u2022";

/**
 * Table D-4: every technique with its definition and discussion, and under it its approaches with
 * theirs and with the examples the third column lists beside each.
 */
function readApproaches(pages) {
  const table = TABLES.approaches;
  const [techniqueLines, approachLines, exampleLines] = readColumns(pages, table);
  const techniques = entriesOf(table, techniqueLines, ["Definition:", "Discussion:"]);
  const approaches = entriesOf(table, approachLines, [
    "Definition:",
    "Informal description:",
    "Discussion:",
  ]);
  /** One labelled paragraph of an entry, without its label. */
  const paragraph = (entry, label) => {
    if (!entry.parts[label]) return null;
    const text = proseOf(table, `${entry.printed}, ${label.slice(0, -1)}`, entry.parts[label]);
    return text.slice(label.length).trim();
  };
  for (const entry of [...techniques, ...approaches]) {
    entry.definition = paragraph(entry, "Definition:");
    if (!entry.definition) stop(`${table.name}: ${entry.printed} has no definition.`);
    entry.discussion = paragraph(entry, "Discussion:");
  }
  for (const approach of approaches) {
    approach.informal = paragraph(approach, "Informal description:");
    approach.technique = techniques.findLast((technique) => isBeside(approach, technique));
    if (!approach.technique) stop(`${table.name}: ${approach.printed} stands under no technique.`);
    approach.bullets = [];
  }

  // The examples stand beside their approach, in the row that opens at its name and runs to the
  // next approach's, on the next page too. A bullet opens an example and its other lines follow.
  let bullet = null;
  for (const line of exampleLines) {
    const approach = approaches.findLast((candidate) => isBeside(line, candidate));
    if (!approach) stop(`${table.name}: "${line.text}" stands above the first approach.`);
    if (line.words[0].text === BULLET) {
      const words = line.words.slice(1);
      if (words.length === 0) stop(`${table.name}, ${approach.printed}: a bullet with no text.`);
      bullet = { approach, lines: [{ words, text: words.map((word) => word.text).join(" ") }] };
      approach.bullets.push(bullet);
    } else if (bullet?.approach === approach) {
      bullet.lines.push(line);
    } else {
      stop(`${table.name}, ${approach.printed}: "${line.text}" follows no bullet.`);
    }
  }
  for (const approach of approaches) {
    approach.examples = approach.bullets.map((one, at) => {
      const example = proseOf(table, `${approach.printed}, Examples, ${at + 1}`, one.lines);
      if (example.includes(BULLET)) stop(`${table.name}: a bullet inside "${example}".`);
      return example;
    });
  }
  return { techniques, approaches };
}

// Table D-5 turns its layers' headings up the page. The lines of one heading stand 10 pt apart
// and two headings 16.8 pt or more. A heading stands in the middle of its cell, and the cells under
// a row of the headings that group the layers start where that row ends, so the middles of the
// headings under one row stand within 3.6 pt of each other and 6.7 pt or more from the next.
const HEADING_LINES = 14;
const DEPTH_GAP = 5;
// A row of grouping headings stands over the middle of the layers it groups, within 2.7 pt, and a
// mark stands under the middle of its layer's heading, within 1 pt.
const CENTRED = 4;
const UNDER = 6;

/**
 * The headings of one page of Table D-5: every layer's, turned up the page and read from the
 * bottom, its lines from left to right, and the rows of headings above them that group them. A
 * row holds one heading, which stands over the layers under it: the layers whose headings stand in
 * the band of heights for that row or a deeper one. Each layer keeps the headings it stands under,
 * the outermost first.
 */
function layerHeadings(table, page, words, heading) {
  const caption = words.find(
    (word, at) => word.text === "TABLE" && words[at + 1]?.text === table.caption,
  );
  const rules = words.filter((word) => /^_+$/.test(word.text));
  const above = caption?.bottom ?? Math.max(...rules.map((word) => word.bottom));
  if (!Number.isFinite(above))
    stop(`${table.name}, page ${page}: no caption or rule above the headings.`);
  const band = words.filter((word) => word.top > above && word.top < heading.top - SAME_LINE);
  const level = band.filter((word) => Math.abs(word.height - heading.height) < 0.1);
  const turned = band.filter((word) => !level.includes(word));
  const widths = new Set(turned.map((word) => (word.right - word.left).toFixed(1)));
  if (turned.length === 0 || widths.size !== 1) {
    stop(`${table.name}, page ${page}: the layers' headings are not all turned up the page.`);
  }
  // The turned words as lines, each read from the bottom up, and the lines as headings.
  const lines = [];
  for (const word of [...turned].sort((a, b) => a.left - b.left || b.top - a.top)) {
    const line = lines.at(-1);
    if (line && Math.abs(line.left - word.left) < 0.5) line.words.push(word);
    else lines.push({ left: word.left, words: [word] });
  }
  const columns = [];
  for (const line of lines) {
    const column = columns.at(-1);
    if (column && line.left - column.lines.at(-1).left < HEADING_LINES) column.lines.push(line);
    else columns.push({ lines: [line] });
  }
  for (const column of columns) {
    const all = column.lines.flatMap((line) => line.words);
    column.printed = column.lines
      .map((line) => line.words.map((word) => word.text).join(" "))
      .join(" ");
    column.left = Math.min(...all.map((word) => word.left));
    column.right = Math.max(...all.map((word) => word.right));
    column.center = (column.left + column.right) / 2;
    column.middle =
      (Math.min(...all.map((word) => word.top)) + Math.max(...all.map((word) => word.bottom))) / 2;
    if (!isCapitals(column.printed))
      stop(`${table.name}, page ${page}: "${column.printed}" is no heading.`);
  }
  // How deep each heading stands: the bands of heights its middle falls in, from the top.
  const middles = [...columns].sort((a, b) => a.middle - b.middle);
  let depth = 1;
  middles.forEach((column, at) => {
    if (at > 0 && column.middle - middles[at - 1].middle >= DEPTH_GAP) depth += 1;
    column.depth = depth;
  });
  const rows = linesOf(level).map((line) => ({
    printed: line.text,
    center: (line.words[0].left + line.words.at(-1).right) / 2,
  }));
  if (rows.length !== depth || rows.some((row) => !isCapitals(row.printed))) {
    stop(
      `${table.name}, page ${page}: ${rows.length} rows of headings over ${depth} depths of layers.`,
    );
  }
  rows.forEach((row, at) => {
    const held = columns.map((column) => column.depth > at);
    const first = held.indexOf(true);
    const last = held.lastIndexOf(true);
    const center = (columns[first].left + columns[last].right) / 2;
    if (held.slice(first, last + 1).includes(false) || Math.abs(center - row.center) > CENTRED) {
      stop(`${table.name}, page ${page}: "${row.printed}" stands over no run of layers.`);
    }
  });
  return columns.map((column) => ({
    printed: column.printed,
    title: titleCase(column.printed),
    center: column.center,
    within: rows.slice(0, column.depth).map((row) => titleCase(row.printed)),
  }));
}

/**
 * Table D-5: the architectural layers, and the approaches that can be used at each. The table
 * lists the approaches under their techniques, as Table D-4 does, with an X under each layer an
 * approach can be used at. Every page repeats the layers' headings, and they must read alike.
 */
function readLayers(pages) {
  const table = TABLES.layers;
  let layers = null;
  const techniques = [];
  const approaches = [];
  for (let page = table.pages[0]; page <= table.pages[1]; page += 1) {
    const { words, heading, body } = tableBody(pages, table, page);
    const headings = layerHeadings(table, page, words, heading);
    if (!layers) layers = headings;
    const same = (a, b) =>
      a.printed === b.printed &&
      a.within.join("|") === b.within.join("|") &&
      Math.abs(a.center - b.center) < 1.5;
    if (headings.length !== layers.length || headings.some((one, at) => !same(one, layers[at]))) {
      stop(`${table.name}, page ${page}: the layers' headings differ from the first page's.`);
    }
    const [names, rows, marks] = columnsOf(table, body).map(linesOf);
    techniques.push(...rowsOf(table, names));
    const pageRows = rowsOf(table, rows).map((row) => ({ ...row, marked: new Set() }));
    for (const mark of marks.flatMap((line) => line.words)) {
      const center = (mark.left + mark.right) / 2;
      const row = pageRows.filter((candidate) => Math.abs(candidate.top - mark.top) < 2);
      const column = layers.filter((candidate) => Math.abs(candidate.center - center) < UNDER);
      if (mark.text !== "X" || row.length !== 1 || column.length !== 1) {
        stop(
          `${table.name}, page ${page}: "${mark.text}" at ${mark.left}, ${mark.top} is no mark.`,
        );
      }
      row[0].marked.add(column[0].title);
    }
    approaches.push(...pageRows);
  }
  for (const technique of techniques) {
    if (!isCapitals(technique.name)) stop(`${table.name}: "${technique.name}" is no technique.`);
  }
  return {
    layers,
    approaches: approaches.map((row) => {
      const technique = techniques.findLast((candidate) => isBeside(row, candidate));
      if (!technique) stop(`${table.name}: ${row.name} stands under no technique.`);
      return {
        printed: row.name,
        technique: technique.name,
        // In the order of the layers' columns.
        layers: layers.filter((layer) => row.marked.has(layer.title)).map((layer) => layer.title),
      };
    }),
  };
}

/** Tables D-6 and D-9: a principle's name, closed by a full stop, and its key ideas. */
function readPrinciples(pages, table) {
  const [names, ideas] = readColumns(pages, table);
  return rowsOf(table, names, ideas).map((row) => {
    if (!isCapitals(row.name) || row.name.indexOf(".") !== row.name.length - 1) {
      stop(`${table.name}: "${row.name}" is not a principle's name.`);
    }
    return { printed: row.name, title: titleCase(row.name.slice(0, -1)), lines: row.cells[0] };
  });
}

/**
 * A table of X marks: every row's printed name with the columns it marks. `headings` gives each
 * column's key and the words its heading prints. A mark belongs to the heading it stands under
 * and to the row whose name starts at its height: marks stand within 0.2 pt of the top of the
 * name and within 1.1 pt of the middle of the heading, and the headings are 35 pt apart.
 */
function readMarks(pages, table, headings) {
  const rows = [];
  for (let page = table.pages[0]; page <= table.pages[1]; page += 1) {
    const { words, heading, body } = tableBody(pages, table, page);
    const band = words.filter(
      (word) => word.bottom < heading.bottom + SAME_LINE && word.top > heading.top - 60,
    );
    const columns = headings.map(({ key, printed }) => {
      const found = printed.split(" ").map((text) => {
        const matches = band.filter((word) => word.text === text);
        if (matches.length !== 1) stop(`${table.name}, page ${page}: no one heading "${text}".`);
        return matches[0];
      });
      const left = Math.min(...found.map((word) => word.left));
      const right = Math.max(...found.map((word) => word.right));
      return { key, center: (left + right) / 2 };
    });
    const [names, marks] = columnsOf(table, body);
    const pageRows = rowsOf(table, linesOf(names)).map((row) => ({ ...row, marked: new Set() }));
    for (const mark of marks) {
      const center = (mark.left + mark.right) / 2;
      const row = pageRows.filter((candidate) => Math.abs(candidate.top - mark.top) < 2);
      const column = columns.filter((candidate) => Math.abs(candidate.center - center) < 6);
      if (mark.text !== "X" || row.length !== 1 || column.length !== 1) {
        stop(
          `${table.name}, page ${page}: "${mark.text}" at ${mark.left}, ${mark.top} is no mark.`,
        );
      }
      row[0].marked.add(column[0].key);
    }
    rows.push(...pageRows);
  }
  return rows.map((row) => ({ printed: row.name, marked: row.marked }));
}

/**
 * Table D-15: every structural principle with the techniques related to it. The table prints a
 * technique the principle requires in bold. pdftotext reports no typeface, but a bold word's box
 * is taller than a regular one's of the same size, and the principle names are all bold.
 */
function readRelatedTechniques(pages) {
  const table = TABLES.structuralTechniques;
  const [names, lists] = readColumns(pages, table);
  const bold = new Set(names.flatMap((line) => line.words.map((word) => word.height)));
  const heights = new Set(lists.flatMap((line) => line.words.map((word) => word.height)));
  if (bold.size !== 1 || heights.size !== 2 || !heights.has([...bold][0])) {
    stop(`${table.name}: bold and regular words cannot be told apart by their height.`);
  }
  return rowsOf(table, names, lists).map((row) => {
    const titles = corrected(table, row.name, joinLines(row.cells[0])).split(", ");
    // The words of each technique: a comma closes all but the last.
    const groups = [[]];
    for (const word of row.cells[0].flatMap((line) => line.words)) {
      groups.at(-1).push(word);
      if (word.text.endsWith(",")) groups.push([]);
    }
    if (groups.at(-1).length === 0) groups.pop();
    requireCount(`${table.name}, ${row.name}`, groups.length, titles.length);
    const techniques = titles.map((title, at) => {
      const weights = new Set(groups[at].map((word) => bold.has(word.height)));
      if (weights.size !== 1) stop(`${table.name}: "${title}" is not all bold or all regular.`);
      return { title, required: weights.has(true) };
    });
    return { printed: row.name, techniques };
  });
}

/**
 * Table E-1: every control with its groups of a technique and that technique's approaches, in the
 * order printed, which lists the technique with the strongest linkage first.
 */
function readControls(pages) {
  const table = TABLES.controls;
  const rows = [];
  let family = null;
  for (let page = table.pages[0]; page <= table.pages[1]; page += 1) {
    const lines = linesOf(tableBody(pages, table, page).body);
    const cells = lines.filter((line) => !FAMILIES.has(line.text)).flatMap((line) => line.words);
    const [labels, , techniques] = columnsOf(table, cells).map(linesOf);
    // A row starts at its label and a family at its heading; a cell ends where the next starts.
    const starts = [...labels, ...lines.filter((line) => FAMILIES.has(line.text))];
    starts.sort((a, b) => a.top - b.top);
    if (starts[0].top > lines[0].top + SAME_LINE) {
      stop(`${table.name}, page ${page}: a row runs on from the page before.`);
    }
    starts.forEach((start, at) => {
      if (FAMILIES.has(start.text)) {
        family = FAMILIES.get(start.text);
        return;
      }
      if (!/^[A-Z]{2}-\d+(\(\d+\))?$/.test(start.text) || !start.text.startsWith(`${family}-`)) {
        stop(`${table.name}, page ${page}: "${start.text}" is not a control of family ${family}.`);
      }
      const end = starts[at + 1]?.top ?? Infinity;
      const cell = techniques.filter(
        (line) => line.top > start.top - SAME_LINE && line.top < end - SAME_LINE,
      );
      rows.push({ control: start.text, text: joinLines(cell) });
    });
  }
  return rows.map(({ control, text }) => {
    const groups = [];
    let rest = corrected(table, control, text);
    while (rest !== "") {
      const group = rest.match(/^([A-Z][A-Za-z-]*(?: [A-Z][A-Za-z-]*)*) \[ ?([^[\]]+)\] ?/);
      if (!group) stop(`${table.name}, ${control}: cannot read "${rest}".`);
      groups.push({ technique: group[1], approaches: group[2].split(", ") });
      rest = rest.slice(group[0].length);
    }
    if (groups.length === 0) stop(`${table.name}, ${control}: no technique.`);
    return { control, groups };
  });
}

/** What the front matter says about copyright, quoted from the Authority page. */
function readRightsStatement(pages) {
  const text = joinLines(linesOf(pageWords(pages, 3)));
  const statement = text.match(
    /This publication may be used by [^.]+\. [^.]+ appreciated by NIST\./,
  );
  if (!statement) stop("The Authority page does not carry the copyright statement.");
  return statement[0];
}

/** Checks the cover and the title page against what this script says about the source. */
function requireSource(pages) {
  const cover = joinLines(linesOf(pageWords(pages, 1)));
  const titlePage = joinLines(linesOf(pageWords(pages, 2)));
  if (!cover.includes(SOURCE.title) || !titlePage.includes("December 2021")) {
    stop("The first pages do not carry the pinned title and month of publication.");
  }
}

/**
 * The code of the item of one kind that a table names: by its title, by its title in capitals, or
 * by the alias the corrections list gives that table.
 */
function codeOf(items, table, kind, printed) {
  const item = items.find((candidate) => {
    if (candidate.kind !== kind) return false;
    const name = aliasOf(table, candidate.title)?.printed ?? candidate.title;
    return printed === name || printed === name.toUpperCase();
  });
  if (!item) stop(`${table.name}: "${printed}" is no ${kind}.`);
  const alias = aliasOf(table, item.title);
  if (alias) used.add(alias);
  return item.code;
}

/**
 * The goals, the objectives, the techniques with their approaches, the architectural layers
 * (`layerTable`, Table D-5 as `readLayers` reads it) and the design principles.
 */
function readItems(pages, layerTable) {
  const items = [];
  /** Adds an item, numbered in printed order among the items of its kind under its parent. */
  const add = (kind, table, title, prose, { parent = null, props = {} } = {}) => {
    const code = `${CODE_PREFIX[kind]}.${slug(title)}`;
    const ordinal = items.filter((item) => item.kind === kind && item.parent === parent).length + 1;
    items.push({ code, kind, title, prose, parent, ordinal, props, printed_in: table.name });
    return code;
  };

  // A goal's and an objective's prose is its definition; the discussion under it is a property,
  // as a technique's is.
  for (const goal of readDefinitions(pages, TABLES.goals)) {
    add("goal", TABLES.goals, goal.title, goal.prose, {
      props: { discussion: goal.discussion },
    });
  }
  for (const objective of readDefinitions(pages, TABLES.objectives)) {
    add("objective", TABLES.objectives, objective.title, objective.prose, {
      props: { discussion: objective.discussion },
    });
  }

  // An item's prose is its definition. What Table D-4 prints beside it is the guidance: a
  // discussion, and for an approach an informal description and a list of examples.
  const { techniques, approaches } = readApproaches(pages);
  for (const technique of techniques) {
    technique.code = add("technique", TABLES.approaches, technique.title, technique.definition, {
      props: technique.discussion ? { discussion: technique.discussion } : {},
    });
  }
  for (const approach of approaches) {
    add("approach", TABLES.approaches, approach.title, approach.definition, {
      parent: approach.technique.code,
      props: {
        ...(approach.informal ? { informal_description: approach.informal } : {}),
        ...(approach.discussion ? { discussion: approach.discussion } : {}),
        ...(approach.examples.length > 0 ? { examples: approach.examples } : {}),
      },
    });
  }
  for (const [kind, count] of Object.entries(EXPECTED.discussions)) {
    const found = items.filter((item) => item.kind === kind && item.props.discussion).length;
    requireCount(`Items of kind ${kind} with a discussion`, found, count);
  }
  const exampled = items.filter((item) => item.props.examples);
  requireCount("Approaches with examples", exampled.length, EXPECTED.approachesWithExamples);
  requireCount(
    "Examples",
    exampled.reduce((sum, item) => sum + item.props.examples.length, 0),
    EXPECTED.examples,
  );

  // Table D-5's layers, in the order of its columns. The table defines none of them, and each keeps
  // the headings it is printed under, the outermost first.
  for (const layer of layerTable.layers) {
    add("architectural-layer", TABLES.layers, layer.title, null, {
      props: { within: layer.within },
    });
  }

  // Table D-6 prints a principle's key ideas as two labelled paragraphs.
  for (const principle of readPrinciples(pages, TABLES.strategic)) {
    const table = TABLES.strategic;
    const guidance = principle.lines.findIndex((line) => line.text.startsWith("Guidance:"));
    if (!principle.lines[0].text.startsWith("Motivation:") || guidance < 1) {
      stop(`${table.name}: ${principle.printed} does not print a motivation and a guidance.`);
    }
    const paragraphs = [
      proseOf(table, `${principle.printed}, Motivation`, principle.lines.slice(0, guidance)),
      proseOf(table, `${principle.printed}, Guidance`, principle.lines.slice(guidance)),
    ];
    add("strategic-design-principle", table, principle.title, paragraphs.join("\n\n"), {
      props: {
        motivation: paragraphs[0].slice("Motivation:".length).trim(),
        guidance: paragraphs[1].slice("Guidance:".length).trim(),
      },
    });
  }
  for (const principle of readPrinciples(pages, TABLES.structural)) {
    const table = TABLES.structural;
    add(
      "structural-design-principle",
      table,
      principle.title,
      proseOf(table, principle.printed, principle.lines),
    );
  }

  for (const [kind, count] of Object.entries(EXPECTED.items)) {
    requireCount(`Items of kind ${kind}`, items.filter((item) => item.kind === kind).length, count);
  }
  return items;
}

/**
 * The layers each approach can be used at (Table D-5, `layerTable`), and what supports what among
 * the items (Tables D-12 to D-15).
 */
function readItemLinks(pages, items, layerTable) {
  const links = [];
  const link = (table, source, target, props = {}, relation = "supports") => {
    links.push({
      source_identifier: `${table.name.slice("Table ".length)}:${source}:${target}`,
      source,
      target,
      relation,
      ordinal: null,
      props,
      printed_in: table.name,
    });
  };

  // Table D-5 lists every approach once, under the technique Table D-4 holds it under. It puts
  // Coordinated Protection before Contextual Awareness, which Table D-4 does not.
  const layers = TABLES.layers;
  const listed = layerTable.approaches.map((row) => [
    codeOf(items, layers, "technique", row.technique),
    codeOf(items, layers, "approach", row.printed),
  ]);
  const defined = items
    .filter((item) => item.kind === "approach")
    .map((approach) => [approach.parent, approach.code]);
  const pairs = (list) =>
    list
      .map((pair) => pair.join(" "))
      .sort()
      .join("|");
  if (listed.length !== defined.length || pairs(listed) !== pairs(defined)) {
    stop("Table D-5 does not list every approach once under its technique.");
  }
  layerTable.approaches.forEach((row, at) => {
    for (const title of row.layers) {
      link(
        layers,
        listed[at][1],
        codeOf(items, layers, "architectural-layer", title),
        {},
        "used-at",
      );
    }
  });
  /** The headings of a table whose columns are the items of one kind, in their printed order. */
  const headingsOf = (table, kind, capitals) =>
    items
      .filter((item) => item.kind === kind)
      .map((item) => {
        const alias = aliasOf(table, item.title);
        if (alias) used.add(alias);
        const printed = alias?.printed ?? item.title;
        return { key: item.code, printed: capitals ? printed.toUpperCase() : printed };
      });
  /** Links every marked cell of a table of X marks, row by row and column by column. */
  const linkMarks = (table, headings, kindOf) => {
    const rows = readMarks(pages, table, headings);
    for (const row of rows) {
      const source = codeOf(items, table, kindOf(row), row.printed.replace(/\.$/, ""));
      for (const { key } of headings) if (row.marked.has(key)) link(table, source, key);
    }
    return rows.map((row) => row.printed);
  };

  linkMarks(
    TABLES.objectiveGoals,
    headingsOf(TABLES.objectiveGoals, "goal", true),
    () => "objective",
  );

  // Table D-13 prints each technique in capitals and its approaches under it, as Table D-4 does.
  const rows = linkMarks(
    TABLES.techniqueObjectives,
    headingsOf(TABLES.techniqueObjectives, "objective", false),
    (row) => (isCapitals(row.printed) ? "technique" : "approach"),
  );
  const order = items
    .filter((item) => item.kind === "technique")
    .flatMap((technique) => [
      technique.title.toUpperCase(),
      ...items.filter((item) => item.parent === technique.code).map((approach) => approach.title),
    ]);
  if (rows.join("|") !== order.join("|")) {
    stop("Table D-13 does not list the techniques and approaches as Table D-4 does.");
  }

  linkMarks(
    TABLES.strategicObjectives,
    headingsOf(TABLES.strategicObjectives, "objective", false),
    () => "strategic-design-principle",
  );

  for (const row of readRelatedTechniques(pages)) {
    const table = TABLES.structuralTechniques;
    const principle = row.printed.slice(0, -1);
    const source = codeOf(items, table, "structural-design-principle", principle);
    for (const { title, required } of row.techniques) {
      link(table, source, codeOf(items, table, "technique", title), { required });
    }
  }

  for (const [name, count] of Object.entries(EXPECTED.links)) {
    requireCount(`${name} links`, links.filter((one) => one.printed_in === name).length, count);
  }
  return links;
}

/** The controls that support each approach: Table E-1. */
function readControlLinks(pages, items) {
  const table = TABLES.controls;
  const links = [];
  const controls = readControls(pages);
  requireCount(`${table.name} rows`, controls.length, EXPECTED.controlRows);
  for (const { control, groups } of controls) {
    groups.forEach((group, groupAt) => {
      const technique = codeOf(items, table, "technique", group.technique);
      group.approaches.forEach((title, approachAt) => {
        links.push({
          source_identifier: `E-1:${control}:${groupAt + 1}:${approachAt + 1}`,
          control,
          item: codeOf(items, table, "approach", title),
          relation: "supports",
          ordinal: groupAt + 1,
          props: { technique },
          printed_in: table.name,
        });
      });
    });
  }
  requireCount(`${table.name} links`, links.length, EXPECTED.controlLinks);
  return links;
}

function transcribe(pdf) {
  const pages = readPages(pdf);
  requireSource(pages);
  const layerTable = readLayers(pages);
  const items = readItems(pages, layerTable);
  const itemLinks = readItemLinks(pages, items, layerTable);
  const controlLinks = readControlLinks(pages, items);

  const unused = CORRECTIONS.filter((entry) => (entry.row || entry.alias) && !used.has(entry));
  if (unused.length > 0) {
    stop(
      `Corrections that fit nothing printed: ${unused.map((entry) => entry.printed).join("; ")}`,
    );
  }

  return {
    format: FORMAT,
    framework: FRAMEWORK,
    source: { ...SOURCE, rights_statement: readRightsStatement(pages) },
    method: { tool: "pdftotext", tool_version: pdftotextVersion(), script: SCRIPT },
    items,
    item_links: itemLinks,
    control_links: controlLinks,
    corrections: CORRECTIONS.map(({ printed_in, printed, transcribed, reason }) => ({
      printed_in,
      printed,
      transcribed,
      reason,
    })),
  };
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  readSourcePdf(options.pdf, SOURCE);
  const document = transcribe(options.pdf);
  if (options.check) {
    if (!matchesPinned(document, PINNED)) {
      stop(`The transcription differs from the pinned ${PINNED}.`);
    }
    console.log(`The transcription matches the pinned ${PINNED}.`);
    return;
  }
  const { sha256, bytes } = writeFramework(document, { gz: PINNED, json: options.json });
  console.log(
    `${document.items.length} items, ${document.item_links.length} item links, ` +
      `${document.control_links.length} control links, ${document.corrections.length} corrections.`,
  );
  console.log(`JSON sha256 ${sha256}, ${bytes} bytes. Wrote ${PINNED}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
