// Transcribes the system life cycle processes of NIST SP 800-160 Vol. 1 Rev. 1 (Appendices H to K)
// from the publication's PDF, which is the only form NIST publishes them in.
//
//   node scripts/reference-transcribe/sp800-160v1r1-processes.mjs --pdf <path> [--json <copy>] [--check]
//
// It writes supabase/reference/NIST_SP-800-160v1r1_life-cycle-processes.json.gz, and a plain copy
// to --json. With --check it compares the transcription with that file and writes nothing.
//
// The items are the four process groups (group.<name>, one for each appendix), the thirty processes
// (process.<identifier>, such as process.BA) and each process's security outcomes
// (outcome.<identifier>.<n>, one for each entry of the section's list, in printed order). A
// process carries its name and no prose.
//
// Each process section opens with the purpose of the process as ISO/IEC/IEEE 15288 states it, over
// the line "Reprinted with permission from IEEE, Copyright IEEE 2015, All rights reserved." That
// paragraph is IEEE's text and is left out. The Security Purpose under it is left out too: the
// publication prints it as NIST's own, without the notice, but in many sections it follows the
// reprinted IEEE sentence closely, with the security wording set into it. The Security Outcomes
// are NIST's and are transcribed. The Security Purpose is read only for the section's structure,
// and the Security Activities and Tasks only for the identifier they are numbered with.

import { fileURLToPath } from "node:url";

import {
  FORMAT,
  matchesPinned,
  parseArguments,
  pdftotext,
  pdftotextVersion,
  readSourcePdf,
  serializeFramework,
  sha256,
  slug,
  writeFramework,
} from "./lib.mjs";

const SCRIPT = "scripts/reference-transcribe/sp800-160v1r1-processes.mjs";
const PINNED = fileURLToPath(
  new URL(
    "../../supabase/reference/NIST_SP-800-160v1r1_life-cycle-processes.json.gz",
    import.meta.url,
  ),
);

const FRAMEWORK = {
  code: "nist-sp800-160v1r1-processes",
  title: "NIST SP 800-160 Vol. 1 Rev. 1 system life cycle processes",
  version: "Rev. 1",
};

const SOURCE = {
  title: "Engineering Trustworthy Secure Systems",
  authority: "NIST",
  url: "https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-160v1r1.pdf",
  doi: "https://doi.org/10.6028/NIST.SP.800-160v1r1",
  sha256: "eced250e47e542698ddfd5e72bd7feae14268e72a1e9ea49af9984c0e01ff7b8",
  bytes: 8181396,
  pages: 195,
  published: "2022-11-16",
};

// The publication's designation and date, as its running head prints them on every page. The PDF
// prints the month only: the day in SOURCE.published is not printed in it.
const DESIGNATION = "NIST SP 800-160v1r1";
const RUNNING_DATE = "November 2022";

// The identifier each process's activities and tasks are numbered with (BA-1, BA-1.1), by appendix
// and in printed order. The script reads the identifiers from the PDF; this list only checks them.
const IDENTIFIERS = {
  H: ["BA", "SN", "SR", "AR", "DE", "SA", "IP", "IN", "VE", "TR", "VA", "OP", "MA", "DS"],
  I: ["PL", "PA", "DM", "RM", "CM", "IM", "MS", "QA"],
  J: ["LM", "IF", "PM", "HR", "QM", "KM"],
  K: ["AQ", "SP"],
};

// The three parts of a process section after the reprinted purpose, in printed order.
const PARTS = ["Security Purpose", "Security Outcomes", "Security Activities and Tasks"];

// The notice the publication prints under every paragraph reprinted from ISO/IEC/IEEE 15288.
const REPRINT_NOTICE =
  "Reprinted with permission from IEEE, Copyright IEEE 2015, All rights reserved.";

// What the front matter says about copyright and reuse: each passage by its first and its last
// words. The text between them comes from the PDF.
const RIGHTS_PASSAGES = [
  {
    from: "This publication may be used by nongovernmental organizations",
    to: "be appreciated by NIST.",
  },
  {
    from: "Content from ISO/IEC/IEEE 15288 referenced in this publication",
    to: "to reflect any changes in the international standard.",
  },
];

// The corrections: every place the transcription departs from the printed text. Each one is
// checked against the PDF as it is applied, and one that the PDF does not bear out stops the run.

// Table 5 abbreviates three processes differently from the identifier their own activities and
// tasks are numbered with. The transcription follows the activities and tasks.
const ABBREVIATION_CORRECTIONS = [
  {
    identifier: "AR",
    printed: "System Architecture Definition (SA)",
    reason:
      "Table 5 abbreviates System Architecture Definition as SA, the abbreviation it also gives System Analysis. Section H.4.3 numbers the activities and tasks of System Architecture Definition with AR, and the process identifier follows them.",
  },
  {
    identifier: "LM",
    printed: "Life Cycle Model Management (LC)",
    reason:
      "Table 5 abbreviates Life Cycle Model Management as LC. Section J.1.3 numbers the activities and tasks of the process with LM, and the process identifier follows them.",
  },
  {
    identifier: "IF",
    printed: "Infrastructure Management (IM)",
    reason:
      "Table 5 abbreviates Infrastructure Management as IM, the abbreviation it also gives Information Management. Section J.2.3 numbers the activities and tasks of Infrastructure Management with IF, and the process identifier follows them.",
  },
];

// An outcome printed as a paragraph of its own, without the dash that starts every other outcome.
const UNDASHED_CORRECTIONS = [
  {
    section: "J.4.2",
    printed: "Personnel with necessary security skills are provided to projects.",
    reason:
      "The sentence is printed as a paragraph of its own between the first and the third outcome, at the list's indent and without the dash that starts every other outcome. It is transcribed as the second outcome of the process.",
  },
];

const collapse = (text) => text.replace(/\s+/g, " ").trim();

function stop(message) {
  throw new Error(`The PDF does not read as expected: ${message}`);
}

/** The PDF's pages, each as the lines pdftotext gives in the page's layout. */
function readPages(pdf) {
  const pages = pdftotext(pdf, ["-layout"]).split("\f");
  // pdftotext ends every page with a form feed, the last one too.
  if (pages.at(-1) === "") pages.pop();
  if (pages.length !== SOURCE.pages) stop(`it has ${pages.length} pages, not ${SOURCE.pages}.`);
  return pages.map((page) => page.split("\n"));
}

/** The one passage of the publication that runs from `from` to `to`, as a single line. */
function readPassage(pages, { from, to }) {
  const found = pages
    .map((lines) => collapse(lines.join(" ")))
    .filter((text) => text.includes(from));
  if (found.length !== 1) stop(`"${from}" is on ${found.length} pages.`);
  const [text] = found;
  const start = text.indexOf(from);
  const end = text.indexOf(to, start);
  if (text.indexOf(from, start + 1) !== -1 || end === -1) stop(`"${from}" has no single end.`);
  return text.slice(start, end + to.length);
}

/**
 * A page's printed number and its lines between the running head and that number, without the
 * blank ones, each with the page it is printed on. The printed number is read from the foot of
 * the page: the appendices are numbered 16 behind the PDF's pages.
 */
function readBody(lines, pdfPage) {
  if (
    collapse(lines[0] ?? "") !== `${DESIGNATION} ${SOURCE.title}` ||
    collapse(lines[1] ?? "") !== RUNNING_DATE
  ) {
    stop(`PDF page ${pdfPage} does not start with the running head.`);
  }
  let last = lines.length - 1;
  while (last > 1 && lines[last].trim() === "") last -= 1;
  const number = lines[last].match(/^ *([1-9][0-9]*)$/);
  if (!number) stop(`PDF page ${pdfPage} does not end with its page number.`);
  const printedPage = Number(number[1]);
  return {
    printedPage,
    lines: lines
      .slice(2, last)
      .filter((text) => text.trim() !== "")
      .map((text) => ({ text, pdfPage, printedPage })),
  };
}

/** The PDF page each appendix starts on, by its letter. A line of the contents is not a heading. */
function findAppendices(pages) {
  const starts = new Map();
  pages.forEach((lines, index) => {
    const first = lines.slice(2).find((line) => line.trim() !== "") ?? "";
    const heading = first.match(/^Appendix ([A-Z])\. \S/);
    if (!heading || /\.{3,} *[0-9]+$/.test(first)) return;
    if (starts.has(heading[1])) stop(`Appendix ${heading[1]} starts twice.`);
    starts.set(heading[1], index + 1);
  });
  return starts;
}

/** Where lines are printed: "Section H.1.2, p. 115 (PDF p. 131)", or the pages they run across. */
function printedIn(place, lines) {
  const first = lines[0];
  const last = lines.at(-1);
  if (first.pdfPage === last.pdfPage) {
    return `${place}, p. ${first.printedPage} (PDF p. ${first.pdfPage})`;
  }
  return (
    `${place}, pp. ${first.printedPage}-${last.printedPage} ` +
    `(PDF pp. ${first.pdfPage}-${last.pdfPage})`
  );
}

/**
 * The lines of Appendices H to K as the four groups and, in each, one section for each process:
 * its number, the name of the process, the reprinted purpose under the heading and the lines of
 * its three parts. The headings must come in the publication's order: each section numbered after
 * the one before it, then its three parts.
 */
function readSections(lines) {
  const groups = [];
  let group;
  let section;
  let part;
  const checkParts = () => {
    if (section && section.parts.length !== PARTS.length) {
      stop(`Section ${section.number} does not have its three parts.`);
    }
  };
  for (const line of lines) {
    const appendix = line.text.match(/^Appendix ([H-K])\. (\S.*)$/);
    const partHeading = line.text.match(/^ ?([H-K]\.[1-9][0-9]*)\.([1-9])\. +(\S.*)$/);
    const heading = line.text.match(/^ ?(([H-K])\.([1-9][0-9]*))\. +(\S.*)$/);
    if (appendix) {
      checkParts();
      group = { appendix: appendix[1], title: collapse(appendix[2]), heading: line, sections: [] };
      groups.push(group);
      section = undefined;
      part = undefined;
    } else if (partHeading) {
      const [, number, index, title] = partHeading;
      if (!section || section.number !== number) {
        stop(`"${line.text.trim()}" is outside its section.`);
      }
      const expected = PARTS[section.parts.length];
      if (Number(index) !== section.parts.length + 1 || collapse(title) !== expected) {
        stop(`"${line.text.trim()}" is not the next part of Section ${section.number}.`);
      }
      part = { lines: [] };
      section.parts.push(part);
    } else if (heading) {
      const [, number, letter, index, title] = heading;
      checkParts();
      if (!group || group.appendix !== letter || Number(index) !== group.sections.length + 1) {
        stop(`"${line.text.trim()}" is not the next section of its appendix.`);
      }
      section = { number, title: collapse(title), heading: line, reprinted: [], parts: [] };
      group.sections.push(section);
      part = undefined;
    } else if (part) {
      part.lines.push(line);
    } else if (section) {
      section.reprinted.push(line);
    }
    // Any other line is in the paragraph that opens an appendix, which is not transcribed.
  }
  checkParts();
  return groups;
}

/** Every hyphenated word the publication prints unbroken inside a line, in lower case. */
function readCompounds(pages) {
  const words = new Set();
  for (const lines of pages) {
    for (const line of lines) {
      for (const word of line.match(/[A-Za-z]+(?:-[A-Za-z]+)+/g) ?? []) {
        words.add(word.toLowerCase());
      }
    }
  }
  return words;
}

/**
 * A paragraph's lines as one line of text. A line that ends in a hyphen is the first half of a
 * hyphenated word: it joins the next line without a space, and only when the publication prints
 * the whole word unbroken somewhere else, so the hyphen is the word's own and not the line
 * break's. A line that ends in a slash or in a dash set against its word stops the run, since its
 * join is not known.
 */
function joinLines(lines, compounds, where) {
  let text = "";
  for (const line of lines) {
    if (text === "") {
      text = line;
    } else if (text.endsWith("-")) {
      const head = text.match(/([A-Za-z]+(?:-[A-Za-z]+)*)-$/);
      const tail = line.match(/^[A-Za-z]+(?:-[A-Za-z]+)*/);
      const word = head && tail ? `${head[1]}-${tail[0]}` : "";
      if (!compounds.has(word.toLowerCase())) {
        stop(`${where}: a line ends in a hyphen and "${word}" is printed nowhere else.`);
      }
      text += line;
    } else if (/(?:\/|\S[\u2013\u2014])$/.test(text)) {
      stop(`${where}: the line "${text}" ends in a character whose join is not known.`);
    } else {
      text += ` ${line}`;
    }
  }
  return collapse(text);
}

/**
 * An outcome is one sentence: it starts with a capital letter and its only full stop ends it. It
 * holds no digit, so no footnote reference or page number stands inside it, and no character but
 * letters, spaces and the punctuation these lists use, which includes the apostrophe U+2019 and
 * the en dash U+2013.
 */
function checkOutcome(text, where) {
  if (text.indexOf(".") !== text.length - 1) stop(`${where} is not one sentence: "${text}"`);
  if (!/^[A-Z][A-Za-z ,.()/\u2019\u2013-]*$/.test(text)) {
    stop(`${where} holds an unexpected character: "${text}"`);
  }
}

/**
 * The paragraph between a section's heading and its Security Purpose is the purpose of the process
 * reprinted from ISO/IEC/IEEE 15288 and nothing else: it names the process and ends with the
 * reprint notice. It is checked and left out.
 */
function checkReprintedPurpose(section) {
  const lines = section.reprinted.map((line) => line.text.trim());
  const text = collapse(lines.slice(0, -1).join(" "));
  if (lines.at(-1) !== REPRINT_NOTICE || text.includes(REPRINT_NOTICE)) {
    stop(`Section ${section.number} does not end its purpose with the one reprint notice.`);
  }
  if (!text.startsWith(`The purpose of the ${section.title} process is to `)) {
    stop(`Section ${section.number} does not open with the purpose of ${section.title}.`);
  }
}

/**
 * A section's Security Purpose is not transcribed: in many sections it follows the reprinted IEEE
 * sentence above it closely. It is read as far as the section's structure goes: readSections finds
 * it between the reprinted purpose and the Security Outcomes, and here it must not be empty.
 */
function checkSecurityPurpose(section) {
  if (section.parts[0].lines.length === 0) {
    stop(`Section ${section.number}.1 prints no security purpose.`);
  }
}

/**
 * A process's security outcomes in printed order, each with the lines it is printed on, and the
 * corrections that make an outcome of a paragraph printed without a dash. An outcome starts at its
 * dash, or where a correction names a paragraph printed without one, and any other line carries on
 * the outcome above it. On each page every line starts at the one column of the list's text.
 */
function readOutcomes(section, compounds) {
  const part = `${section.number}.2`;
  const undashed = UNDASHED_CORRECTIONS.filter((entry) => entry.section === part);
  const outcomes = [];
  const columns = new Map();
  for (const line of section.parts[1].lines) {
    const dash = line.text.match(/^( *)-( +)(\S.*)$/);
    const column = dash ? dash[1].length + 1 + dash[2].length : line.text.search(/\S/);
    if (!columns.has(line.pdfPage)) columns.set(line.pdfPage, column);
    if (columns.get(line.pdfPage) !== column) {
      stop(`Section ${part}: "${line.text.trim()}" is outside the list's column.`);
    }
    const text = dash ? dash[3].trim() : line.text.trim();
    const correction = dash ? undefined : undashed.find((entry) => entry.printed === text);
    if (dash || correction) {
      outcomes.push({ lines: [line], texts: [text], correction });
    } else if (outcomes.length === 0) {
      stop(`Section ${part}: "${text}" stands before the first outcome.`);
    } else {
      outcomes.at(-1).lines.push(line);
      outcomes.at(-1).texts.push(text);
    }
  }
  if (outcomes.length === 0) stop(`Section ${part} lists no outcome.`);
  const corrections = [];
  for (const outcome of outcomes) {
    outcome.text = joinLines(outcome.texts, compounds, `Section ${part}`);
    checkOutcome(outcome.text, `an outcome of Section ${part}`);
    if (!outcome.correction) continue;
    corrections.push({
      entry: outcome.correction,
      record: {
        printed_in: printedIn(`Section ${part}`, outcome.lines),
        printed: outcome.correction.printed,
        transcribed: outcome.text,
        reason: outcome.correction.reason,
      },
    });
  }
  return { outcomes, corrections };
}

/**
 * The identifier a section's activities and tasks are numbered with, and how many there are. They
 * must share the identifier and count up without a gap: activities 1, 2, 3 and under each one its
 * tasks .1, .2, .3.
 */
function readIdentifier(section) {
  const part = `${section.number}.3`;
  let identifier;
  let activities = 0;
  let task = 0;
  let tasks = 0;
  for (const line of section.parts[2].lines) {
    const number = line.text.match(/^ *([A-Z]{2})-([1-9][0-9]*)(?:\.([1-9][0-9]*))? +\S/);
    if (!number) continue;
    identifier ??= number[1];
    if (number[1] !== identifier) stop(`Section ${part} also numbers with ${number[1]}.`);
    if (number[3] === undefined) {
      if (Number(number[2]) !== activities + 1 || (activities > 0 && task === 0)) {
        stop(`Section ${part}: the activity "${line.text.trim()}" is out of order.`);
      }
      activities += 1;
      task = 0;
    } else {
      if (Number(number[2]) !== activities || Number(number[3]) !== task + 1) {
        stop(`Section ${part}: the task "${line.text.trim()}" is out of order.`);
      }
      task += 1;
      tasks += 1;
    }
  }
  if (!identifier || task === 0) stop(`Section ${part} does not end with a task.`);
  return { identifier, activities, tasks };
}

/**
 * The contents pages name every appendix and section with the page it starts on. The headings in
 * the appendices must give the same names on the same pages.
 */
function checkContents(pages, firstAppendix, groups) {
  const contents = new Map();
  for (const lines of pages.slice(0, firstAppendix - 1)) {
    for (const line of lines) {
      const entry = line.match(/^ *(Appendix [H-K]|[H-K]\.[0-9]+)\. +(\S.*?) *\.{3,} *([0-9]+)$/);
      if (!entry) continue;
      if (contents.has(entry[1])) stop(`the contents list ${entry[1]} twice.`);
      contents.set(entry[1], `${collapse(entry[2])}, page ${entry[3]}`);
    }
  }
  const headings = new Map();
  for (const group of groups) {
    headings.set(`Appendix ${group.appendix}`, `${group.title}, page ${group.heading.printedPage}`);
    for (const section of group.sections) {
      headings.set(section.number, `${section.title}, page ${section.heading.printedPage}`);
    }
  }
  for (const key of new Set([...contents.keys(), ...headings.keys()])) {
    if (contents.get(key) !== headings.get(key)) {
      stop(
        `the contents give ${key} as "${contents.get(key)}", its heading "${headings.get(key)}".`,
      );
    }
  }
}

/**
 * Table 5 lists every process with an abbreviation. Its names must be the section headings and
 * its abbreviations the identifiers of the activities and tasks, except where a correction says
 * what the table prints instead. `rows` holds each process's name and identifier. Returns those
 * corrections with the place the table is printed.
 */
function checkTable5(pdf, pages, appendixG, rows) {
  const caption = "Table 5. System Life Cycle Processes";
  const index = pages.findIndex(
    (lines, page) => page >= appendixG - 1 && lines.some((line) => line.trim() === caption),
  );
  if (index === -1) stop("Table 5 is missing.");
  const pdfPage = index + 1;
  const { printedPage } = readBody(pages[index], pdfPage);
  // Without -layout pdftotext gives the table cell by cell, so each entry reads as one run.
  const text = collapse(pdftotext(pdf, ["-f", String(pdfPage), "-l", String(pdfPage)]));
  const table = new Map();
  const entries = text
    .slice(text.indexOf(caption))
    .matchAll(/- ([A-Z][A-Za-z ]*?) \(([A-Z]{2})\)/g);
  for (const [, name, abbreviation] of entries) {
    if (table.has(name)) stop(`Table 5 lists ${name} twice.`);
    table.set(name, abbreviation);
  }
  if (table.size !== rows.length) stop(`Table 5 lists ${table.size} processes.`);
  const corrections = [];
  for (const { title, identifier } of rows) {
    if (!table.has(title)) stop(`Table 5 does not list ${title}.`);
    const printed = `${title} (${table.get(title)})`;
    const entry = ABBREVIATION_CORRECTIONS.find(
      (correction) => correction.identifier === identifier,
    );
    if (entry ? entry.printed !== printed : table.get(title) !== identifier) {
      stop(`Table 5 prints "${printed}" and the tasks are numbered with ${identifier}.`);
    }
    if (!entry) continue;
    corrections.push({
      entry,
      record: {
        printed_in: `Table 5, p. ${printedPage} (PDF p. ${pdfPage})`,
        printed,
        transcribed: identifier,
        reason: entry.reason,
      },
    });
  }
  return corrections;
}

/**
 * The transcription as a reference-framework/1 document, and one row for each process for the
 * report.
 */
function transcribe(pdf) {
  const pages = readPages(pdf);
  const cover = collapse(pages[0].join(" "));
  if (![DESIGNATION, SOURCE.title, SOURCE.doi].every((text) => cover.includes(text))) {
    stop("the cover does not print the designation, the title and the DOI.");
  }

  const appendices = findAppendices(pages);
  for (const letter of ["A", "G", "H", "I", "J", "K", "L"]) {
    if (!appendices.has(letter)) stop(`Appendix ${letter} is missing.`);
  }
  const lines = [];
  let printedPage;
  for (let pdfPage = appendices.get("H"); pdfPage < appendices.get("L"); pdfPage += 1) {
    const body = readBody(pages[pdfPage - 1], pdfPage);
    if (printedPage !== undefined && body.printedPage !== printedPage + 1) {
      stop(`PDF page ${pdfPage} is not numbered after the page before it.`);
    }
    printedPage = body.printedPage;
    lines.push(...body.lines);
  }

  const groups = readSections(lines);
  if (groups.map((group) => group.appendix).join("") !== Object.keys(IDENTIFIERS).join("")) {
    stop("Appendices H to K are not the four process groups.");
  }
  checkContents(pages, appendices.get("A"), groups);

  const compounds = readCompounds(pages);
  const items = [];
  const corrections = [];
  const rows = [];
  groups.forEach((group, groupIndex) => {
    const groupCode = `group.${slug(group.title)}`;
    items.push({
      code: groupCode,
      kind: "process-group",
      title: group.title,
      prose: null,
      parent: null,
      ordinal: groupIndex + 1,
      props: { appendix: group.appendix },
      printed_in: printedIn(`Appendix ${group.appendix}`, [group.heading]),
    });
    if (group.sections.length !== IDENTIFIERS[group.appendix].length) {
      stop(`Appendix ${group.appendix} has ${group.sections.length} process sections.`);
    }
    group.sections.forEach((section, sectionIndex) => {
      checkReprintedPurpose(section);
      checkSecurityPurpose(section);
      const { outcomes, corrections: undashed } = readOutcomes(section, compounds);
      const { identifier, activities, tasks } = readIdentifier(section);
      if (identifier !== IDENTIFIERS[group.appendix][sectionIndex]) {
        stop(`Section ${section.number} numbers its activities and tasks with ${identifier}.`);
      }
      corrections.push(...undashed);
      // A process is its name, printed in the section's heading. Its purpose is not transcribed:
      // see the head of this file.
      items.push({
        code: `process.${identifier}`,
        kind: "process",
        title: section.title,
        prose: null,
        parent: groupCode,
        ordinal: sectionIndex + 1,
        props: { section: section.number, identifier },
        printed_in: printedIn(`Section ${section.number}`, [section.heading]),
      });
      outcomes.forEach((outcome, outcomeIndex) => {
        items.push({
          code: `outcome.${identifier}.${outcomeIndex + 1}`,
          kind: "outcome",
          title: outcome.text,
          prose: null,
          parent: `process.${identifier}`,
          ordinal: outcomeIndex + 1,
          props: {},
          printed_in: printedIn(`Section ${section.number}.2`, outcome.lines),
        });
      });
      rows.push({
        group: group.title,
        section: section.number,
        identifier,
        title: section.title,
        outcomes: outcomes.length,
        activities,
        tasks,
      });
    });
  });

  // The publication marks reprinted text once in its front matter, where it explains the notice,
  // and once in each process section, under the purpose that checkReprintedPurpose leaves out.
  // No other text carries the notice.
  const notices = pages.flat().filter((line) => line.includes("Reprinted with permission"));
  if (notices.length !== rows.length + 1) {
    stop(`${notices.length} lines say "Reprinted with permission", not ${rows.length + 1}.`);
  }

  // Table 5 is printed before the sections, so its corrections come first.
  corrections.unshift(...checkTable5(pdf, pages, appendices.get("G"), rows));
  for (const entry of [...ABBREVIATION_CORRECTIONS, ...UNDASHED_CORRECTIONS]) {
    const applied = corrections.filter((correction) => correction.entry === entry).length;
    if (applied !== 1) stop(`the correction of "${entry.printed}" applies ${applied} times.`);
  }

  const document = {
    format: FORMAT,
    framework: FRAMEWORK,
    source: {
      ...SOURCE,
      rights_statement: RIGHTS_PASSAGES.map((passage) => readPassage(pages, passage)).join("\n"),
    },
    method: { tool: "pdftotext", tool_version: pdftotextVersion(), script: SCRIPT },
    items,
    item_links: [],
    control_links: [],
    corrections: corrections.map((correction) => correction.record),
  };
  return { document, rows };
}

/** Prints the count of outcomes and tasks for each group and process. */
function report(rows, corrections) {
  const total = (list, key) => list.reduce((sum, row) => sum + row[key], 0);
  for (const group of new Set(rows.map((row) => row.group))) {
    const processes = rows.filter((row) => row.group === group);
    console.log(
      `${group}: ${processes.length} processes, ${total(processes, "outcomes")} outcomes`,
    );
    for (const row of processes) {
      console.log(
        `  ${row.section.padEnd(4)} ${row.identifier}  ${String(row.outcomes).padStart(2)} outcomes  ` +
          `${String(row.tasks).padStart(2)} tasks  ${row.title}`,
      );
    }
  }
  console.log(
    `${rows.length} processes, ${total(rows, "outcomes")} outcomes, ${corrections.length} corrections. ` +
      `Read for their identifiers only: ${total(rows, "activities")} activities, ` +
      `${total(rows, "tasks")} tasks.`,
  );
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  readSourcePdf(options.pdf, SOURCE);
  const { document, rows } = transcribe(options.pdf);
  if (options.check) {
    if (!matchesPinned(document, PINNED)) {
      throw new Error(
        `The transcription differs from ${PINNED}. Nothing is written. ` +
          `This run used pdftotext ${document.method.tool_version}; the file names the version ` +
          "it was made with.",
      );
    }
    const bytes = Buffer.from(serializeFramework(document), "utf8");
    console.log(`The transcription matches ${PINNED}`);
    console.log(`JSON sha256 ${sha256(bytes)}, ${bytes.length} bytes`);
    return;
  }
  const written = writeFramework(document, { gz: PINNED, json: options.json });
  report(rows, document.corrections);
  console.log(`Wrote ${PINNED}`);
  if (options.json) console.log(`Wrote ${options.json}`);
  console.log(`JSON sha256 ${written.sha256}, ${written.bytes} bytes`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
