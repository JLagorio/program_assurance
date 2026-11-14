// Shared by the two scripts that transcribe the ATT&CK analyses of NIST SP 800-160 Vol. 2 Rev. 1:
// Appendix F, on ATT&CK for Enterprise, and Appendix G, on ATT&CK for Industrial Control Systems.
// Each appendix prints one table a tactic (technique, mitigation or candidate mitigation, cyber
// resiliency approaches, potential effects, controls) and tables of the candidate mitigations it
// defines, in the same columns. This module reads those tables from the words' boxes and turns a
// tactic's table into items and links; each script names its appendix's tables, the counts its
// reading must reach and its corrections. See sp800-160v2r1-appendix-f.mjs for how the tables are
// read.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

import { pdftotext, slug } from "./lib.mjs";

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CATALOG = join(projectRoot, "supabase/reference/NIST_SP-800-53_rev5_catalog.json.gz");

/** The publication both appendices are printed in, as its PDF is pinned. */
export const SOURCE = {
  title: "Developing Cyber-Resilient Systems: A Systems Security Engineering Approach",
  authority: "NIST",
  url: "https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-160v2r1.pdf",
  doi: "https://doi.org/10.6028/NIST.SP.800-160v2r1",
  sha256: "d3e9830faadfd1e7a43392194320c5203935c3d7f30f78896b55a8a53e0f0b15",
  bytes: 5201396,
  pages: 310,
  published: "2021-12-09",
};

// The framework that holds the cyber resiliency approaches a row names.
export const APPROACH_FRAMEWORK = "nist-sp800-160v2r1-cref";

// How far a PDF page is from the number it prints, and the page of the front matter that says how
// the publication may be used.
export const PAGE_OFFSET = 16;
const RIGHTS_PAGE = 3;

// The 50 cyber resiliency approaches of the framework. Every approach a table names is one of them.
export const APPROACHES = [
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

// What three rows of Appendix F print where an approach belongs: their mitigation applies no
// approach of the framework. Such a row keeps the words and links its technique to no approach.
export const NO_APPROACH = "Standard practice";

// ---------------------------------------------------------------------------------------------
// Words and lines. Lengths are PDF points; a page is 612 wide and 792 high.
// ---------------------------------------------------------------------------------------------

// The notice printed up the left margin of every page ends left of this.
const MARGIN_NOTICE = 80;
// A table's text starts right of this. Running text, footnotes and the footer start at 90.
export const TABLE_LEFT = 95;
// The tops of the words of one printed line differ by less, and so do the tops of the cells of
// one row.
const LEVEL = 1.5;
// A wider gap on a line lies between two cells. A word space is under 3.
const CELL_GAP = 6;
// A footnote mark's box is lower than this. A cell's text is 11.7 high or more.
const MARK_HEIGHT = 10;
// From one line's top to the next, down a column: a line of the same paragraph, a new paragraph
// of the same cell, and the first line of the next cell. Tables F-3 to F-19 and G-1 to G-13 have
// no line pitch outside these.
const LINE_PITCH = [10.5, 12.5];
const PARAGRAPH_PITCH = [13.5, 14.6];
const CELL_PITCH = 15.2;
// A page's first row starts 21.8 or more under the last line of the header row. Text that
// carries on from the page before starts 18.9 under it.
const CARRIED_OVER = 20.5;
// A short cell set in the middle of a tall row starts this far under the row's top at most: 5.4 pt
// in Tables G-1, G-6 and G-8. The next row starts 15.2 pt or more under the last line of a row.
const SET_LOWER = 6;

export function fail(message) {
  throw new Error(message);
}

function decodeEntities(text) {
  return text.replace(
    /&(amp|lt|gt|quot|apos);/g,
    (_, name) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[name],
  );
}

/** The words of pages `first` to `last` with their boxes, without the notice in the margin. */
export function readPages(pdf, first, last) {
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
export function linesOf(words) {
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

export const isMark = (word) => word.y1 - word.y0 < MARK_HEIGHT && /^\d+$/.test(word.text);

/**
 * A run of a table's body: where it starts and ends, its top, the height of its first word, its
 * text without footnote marks, and its words with their heights, which tell a bold word from a
 * regular one. Each mark is kept with its footnote and the word it follows, bare of a comma after
 * it or parentheses around it: an effect, a control label or an identifier.
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
    words: words.map((word) => ({ text: word.text, height: word.y1 - word.y0 })),
    marks,
  };
}

/** Lines as one text. A line that ends in a hyphen carries on in the next without a space. */
export function joinLines(lines) {
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
export const KINDS = {
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

/**
 * The kind of table whose header row ends with `lines[index]`, or null. The row is told by its
 * words, every one of them as often as the header holds it, whichever lines it breaks them into:
 * Table G-12 prints "Mitigation or" over "Candidate Mitigation" and "Potential Effects" on one line.
 */
function headerEndingAt(lines, index) {
  const texts = (line) => line.words.map((word) => word.text);
  for (const [kind, { header }] of Object.entries(KINDS)) {
    const words = header.flatMap((text) => text.split(" "));
    const found = [];
    for (
      let first = index;
      first >= 0 &&
      found.length < words.length &&
      texts(lines[first]).every((text) => words.includes(text));
      first -= 1
    ) {
      found.push(...texts(lines[first]));
    }
    if ([...found].sort().join("|") === [...words].sort().join("|")) return kind;
  }
  return null;
}

// What a cell prints where it holds nothing: Table G-7 prints it, set in the middle of the cell, in
// the approaches, effects and controls of a technique it gives no mitigation.
const NOTHING = "---";

const cellMarks = (cell) => cell.paragraphs.flat().flatMap((run) => run.marks);
const paragraphTexts = (cell) =>
  cell.paragraphs.map((paragraph) => joinLines(paragraph.map((run) => run.text)));

/**
 * The reader of one appendix's tables. `letter` is the appendix's ("F"), which its captions
 * ("TABLE F-3:") and footers ("APPENDIX F PAGE 159") print; `kindOfTable` names the kind of each
 * table by its name; `corrections` are the appendix's departures from the printed text of a cell,
 * each naming its table, the page number the page prints, its column and the cell's whole text as
 * its lines give it, and `applied` lists each one as it is used.
 */
export function appendixTables({ letter, kindOfTable, corrections }) {
  const footerPattern = new RegExp(`^APPENDIX ${letter} PAGE (\\d+)$`);
  const captionPattern = new RegExp(`^TABLE (${letter}-\\d+): (.+)$`);
  const pageBreakPattern = new RegExp(`^(APPENDIX ${letter} PAGE \\d+|TABLE ${letter}-\\d+: .*)$`);
  const applied = [];

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
      if (pageBreakPattern.test(line.text)) close();
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
      const footer = lines.at(-1).text.match(footerPattern);
      if (!footer || Number(footer[1]) !== page.number - PAGE_OFFSET) {
        fail(`PDF page ${page.number} does not print page ${page.number - PAGE_OFFSET}.`);
      }
      const printedPage = Number(footer[1]);
      let caption = null;
      for (let index = 0; index < lines.length; index += 1) {
        const captioned = lines[index].text.match(captionPattern);
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
          if (kindOfTable(caption.name) !== kind) {
            fail(`${caption.name} has the header of ${kind}.`);
          }
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

  /**
   * The left edges of a table's columns: where the lines of its cells start. A cell that holds
   * nothing sets its dashes in its middle, so they say nothing of where the column starts.
   */
  function columnEdges(table) {
    const { indent, columns } = KINDS[table.kind];
    const starts = table.segments.flatMap((segment) =>
      segment.runs.filter((run) => run.text !== NOTHING).map((run) => run.x0),
    );
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
   * The cells of each column of each of a table's segments. A cell is its lines in paragraphs.
   * Text at the top of a page that carries on from the page before joins the last cell of its
   * column there, as more of that cell's last paragraph.
   */
  function readCells(table) {
    const edges = columnEdges(table);
    const columnOf = (run) => edges.findLastIndex((edge) => run.x0 >= edge - 0.5);
    const segments = table.segments.map((segment) => {
      const where = `${table.name}, page ${segment.page}`;
      for (const run of segment.runs) {
        const next = edges[columnOf(run) + 1];
        if (next !== undefined && run.x1 > next - 2)
          fail(`${where}: "${run.text}" leaves its cell.`);
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

  /** A cell's text with the corrections that name it applied. */
  function corrected(text, table, page, column) {
    let result = text;
    for (const correction of corrections) {
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

  /** A cell's list as printed: its paragraphs joined, a new paragraph where the list breaks. */
  function listText(cell) {
    let text = "";
    for (const paragraph of paragraphTexts(cell)) {
      if (text === "") text = paragraph;
      else text += text.endsWith(",") ? ` ${paragraph}` : `, ${paragraph}`;
    }
    return text;
  }

  /**
   * The entries of a cell that lists them: separated by commas, and by a new paragraph where the
   * cell breaks its list without one. An empty entry, as a stray comma leaves, is a failure, and
   * so is an entry listed twice.
   */
  function listOf(cell, table, column) {
    if (!cell) return [];
    const text = listText(cell);
    const entries = corrected(text, table, cell.page, column)
      .split(",")
      .map((entry) => entry.trim());
    if (entries.includes("") || new Set(entries).size !== entries.length) {
      fail(`${table}, page ${cell.page}: "${text}" has an empty entry or lists one twice.`);
    }
    return entries;
  }

  /**
   * Whether each entry of a list is printed in bold, in the order of the entries as printed: a
   * comma ends an entry, and so does a new paragraph. A bold word's box is taller than a regular
   * one's of the same size: `weights` gives the height of each, every word must be of one of them,
   * and every word of one entry of the same one.
   */
  function weightsOf(cell, table, { bold, regular }) {
    const entries = [];
    for (const paragraph of cell.paragraphs) {
      entries.push([]);
      for (const word of paragraph.flatMap((run) => run.words)) {
        entries.at(-1).push(word);
        if (word.text.endsWith(",")) entries.push([]);
      }
      if (entries.at(-1).length === 0) entries.pop();
    }
    return entries.map((words) => {
      const printed = words.map((word) => word.text).join(" ");
      const weights = new Set(
        words.map((word) => {
          if (Math.abs(word.height - bold) < 0.1) return true;
          if (Math.abs(word.height - regular) < 0.1) return false;
          return fail(`${table}, page ${cell.page}: "${word.text}" in "${printed}" is no weight.`);
        }),
      );
      if (weights.size !== 1) {
        fail(`${table}, page ${cell.page}: "${printed}" is not all bold or all regular.`);
      }
      return weights.has(true);
    });
  }

  const level = (a, b) => Math.abs(a - b) <= LEVEL;

  function named(text, pattern, where) {
    const match = text.match(pattern);
    if (!match) fail(`${where}: "${text}" is not a name and its identifier.`);
    return { name: match[1], id: match[2] };
  }

  /**
   * The rows of a tactic's table, top to bottom. A row starts where an approaches cell starts, and
   * its effects and controls start at the same height, or a little lower where the table sets a
   * short cell in the middle of a tall row (three rows of Appendix G, 5.4 pt down). Its mitigation
   * is the last one that started at or above it, and its technique likewise. A table names a
   * technique once, and a technique a mitigation once. A technique the table gives no mitigation
   * (`noMitigation`, the words its mitigation cell prints then, over cells that hold nothing) is a
   * row with no mitigation. With `boldControls`, the heights of a bold and a regular word, each row
   * says which of its controls are printed in bold.
   */
  function readTactic(table, { boldControls, noMitigation } = {}) {
    const rows = [];
    const techniques = new Set();
    let mitigations = new Set();
    let technique = null;
    let mitigation = null;
    for (const segment of readCells(table)) {
      const where = `${table.name}, page ${segment.page}`;
      const [techniqueCells, mitigationCells, ...right] = segment.columns;
      const tops = [];
      for (const cell of [...right[0]].sort((a, b) => a.top - b.top)) {
        if (tops.length === 0 || !level(tops.at(-1), cell.top)) tops.push(cell.top);
      }
      const at = (cells, top) => cells.find((cell) => level(cell.top, top));
      // The row an effects or controls cell belongs to: the last that starts at or above it.
      const rowOf = (cell) => {
        const top = tops.findLast((candidate) => candidate <= cell.top + LEVEL);
        if (top === undefined || cell.top - top > SET_LOWER) {
          fail(`${where}: "${paragraphTexts(cell).join(" ")}" starts at no row.`);
        }
        return top;
      };
      const inRow = (cells, top) => {
        const held = cells.filter((cell) => rowOf(cell) === top);
        if (held.length > 1) fail(`${where}: a row holds two cells of one column.`);
        return held[0];
      };
      for (const cell of [...techniqueCells, ...mitigationCells]) {
        if (!tops.some((top) => level(cell.top, top))) {
          fail(`${where}: "${paragraphTexts(cell).join(" ")}" starts at no row.`);
        }
      }
      for (const cell of [...right[1], ...right[2]]) rowOf(cell);
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
        const [approachCell, effectCell, controlCell] = [
          at(right[0], top),
          inRow(right[1], top),
          inRow(right[2], top),
        ];
        const printed = offered ? textOf(offered, table.name, "mitigation") : null;
        if (noMitigation && printed === noMitigation) {
          const empty = [approachCell, effectCell, controlCell].every(
            (cell) => cell && paragraphTexts(cell).join(" ") === NOTHING,
          );
          if (!started || !empty || cellMarks(offered).length > 0) {
            fail(`${where}: "${printed}" stands beside cells that hold something.`);
          }
          rows.push({ page: segment.page, technique, mitigation: null, none: printed });
          mitigation = null;
          continue;
        }
        if (offered) {
          mitigation = {
            ...named(printed, /^(.+) \((C?M\d{4})\)$/, where),
            footnotes: cellMarks(offered),
          };
          if (!technique || mitigations.has(mitigation.id)) {
            fail(`${where}: ${mitigation.id} stands under no technique or twice under one.`);
          }
          mitigations.add(mitigation.id);
        }
        if (!technique || !mitigation) fail(`${where}: a row has no technique or no mitigation.`);
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
        // Which controls are printed in bold, by their place in the list. A correction never
        // splits or joins the labels of a cell, so the places are the same before and after it.
        let bold = null;
        if (boldControls && controlCell) {
          const weights = weightsOf(controlCell, table.name, boldControls);
          if (weights.length !== controls.length) {
            fail(`${where}: the controls of ${mitigation.id} under ${technique.id} do not part.`);
          }
          bold = controls.filter((_, index) => weights[index]);
        }
        rows.push({
          page: segment.page,
          technique,
          mitigation,
          approaches: unnamed ? [] : approaches,
          unnamed,
          effects,
          controls,
          bold,
          footnotes: [...mitigation.footnotes, ...marks.effect],
          controlFootnotes: marks.control,
        });
      }
    }
    return rows;
  }

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

  return { applied, readTables, columnEdges, readTactic, readCandidates };
}

// ---------------------------------------------------------------------------------------------
// The document.
// ---------------------------------------------------------------------------------------------

/** What the publication says about its own reuse, from the front matter. */
export function readRightsStatement(pdf) {
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
export const tableCode = (name) => name.slice("Table ".length);
export const approachReference = (name) => `${APPROACH_FRAMEWORK}:approach.${slug(name)}`;
export const tacticCode = (name) => `tactic.${slug(name)}`;

export function checkApproaches(names, where) {
  for (const name of names) {
    if (!APPROACHES.includes(name)) fail(`${where}: "${name}" is no approach of the framework.`);
  }
}

/**
 * Sorts printed control labels into those that name an active control of the catalog and those
 * listed in `notInCatalog` (each by its table, page number and label) as naming none. Any other
 * label is a failure.
 */
export function controlResolver(notInCatalog) {
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
        const listed = notInCatalog.find(
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

/**
 * The item of a tactic and the links of its table's rows. `effectTitles` are the effects a row
 * may name (Table F-1's), `effectsTable` the table that defines them, `candidates` the candidate
 * mitigations by identifier, `controls` a `controlResolver`, `names` collects the names each
 * technique and mitigation is printed under, `expected` the counts the table must reach, and
 * `readTactic` the appendix's reader of a tactic's rows. A row read with its bold controls keeps
 * them on its links (`bold`, each control link `bold: true`).
 */
export function readTacticTable(table, tactic, ordinal, context) {
  const { effectTitles, effectsTable, candidates, controls, names, expected, readTactic } = context;
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
      if (!printed) continue;
      if (!names.has(printed.id)) names.set(printed.id, new Map());
      const tables = names.get(printed.id).get(printed.name) ?? [];
      if (!tables.includes(table.name)) tables.push(table.name);
      names.get(printed.id).set(printed.name, tables);
    }
    if (!mitigation) {
      // A technique the table gives no mitigation: its tactic link keeps what the row prints, and
      // nothing else links it.
      if (tacticLinks.has(technique.id)) fail(`${table.name}: ${technique.id} stands twice.`);
      tacticLinks.set(technique.id, {
        source_identifier: `${tableCode(table.name)}:${technique.id}`,
        source: technique.id,
        target: item.code,
        relation: "tactic",
        ordinal: null,
        props: { mitigation_as_printed: row.none },
        printed_in: table.name,
      });
      itemLinks.push(tacticLinks.get(technique.id));
      continue;
    }
    if (mitigation.id.startsWith("CM") && !candidates.has(mitigation.id)) {
      fail(
        `${table.name}: the appendix's tables of candidate mitigations do not define ${mitigation.id}.`,
      );
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
        fail(`${identifier}: "${effect}" is no effect of ${effectsTable}.`);
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
    const bold = row.bold ? resolved.filter((control) => row.bold.includes(control)) : [];
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
          ...(bold.length > 0 ? { bold } : {}),
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
          ...(bold.includes(control) ? { bold: true } : {}),
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
    mitigations: new Set(rows.filter((row) => row.mitigation).map((row) => row.mitigation.id)).size,
    pairs: rowsOfPair.size,
    rows: rows.length,
    severalApproaches: rows.filter((row) => (row.approaches?.length ?? 0) > 1).length,
    controls: rows.reduce((sum, row) => sum + (row.controls?.length ?? 0), 0),
    bold: rows.reduce((sum, row) => sum + (row.bold?.length ?? 0), 0),
  };
  for (const [what, count] of Object.entries(expected)) {
    if (summary[what] !== count) fail(`${table.name} has ${summary[what]} ${what}, not ${count}.`);
  }
  return { item, itemLinks, controlLinks, summary };
}

/**
 * The items of the techniques, the ATT&CK mitigations and the candidate mitigations. A technique
 * and an ATT&CK mitigation take the name the first table that prints them gives, a candidate
 * mitigation the name of the table that defines it; other printed names stay on the item.
 * `names` holds the names each identifier is printed under in the tactics' tables, every name with
 * the tables that print it, the first printed first.
 */
export function attackItems({ names, candidates }) {
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
  return [
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
  ];
}

/**
 * Reads an appendix's tables of candidate mitigations into one map by identifier: each defined
 * once, with approaches of the framework, controls of the catalog and a whole description, and as
 * many in each table as `expected` says.
 */
export function readCandidateTables(tables, reader, controls, expected) {
  const candidates = new Map();
  for (const [name, count] of Object.entries(expected)) {
    for (const candidate of reader.readCandidates(tables.get(name))) {
      const where = `${name}, page ${candidate.page}, ${candidate.id}`;
      if (candidates.has(candidate.id)) fail(`${where} is defined twice.`);
      checkApproaches(candidate.approaches, where);
      controls.resolve(candidate.controls, name, candidate.page);
      if (!candidate.description.endsWith(".")) fail(`${where}: the description is cut short.`);
      candidates.set(candidate.id, candidate);
    }
    const defined = [...candidates.values()].filter((candidate) => candidate.table === name);
    if (defined.length !== count) fail(`${name} defines ${defined.length} candidate mitigations.`);
  }
  return candidates;
}
