import type { ImportedRequirement } from "./product-assurance";
import { requirementTypes } from "./requirement-edit";

/*
 * A customer's requirements as a table: a CSV a requirements tool exports, rows pasted from a
 * spreadsheet (which arrive separated by tabs), the first sheet of an Excel workbook, or a ReqIF
 * exchange file. The first row names the columns. A column is recognized by what its heading says,
 * since every tool names them its own way; Reference and Statement are the two a requirement
 * cannot be read without. Nothing here writes: the rows go to `import_customer_requirements`
 * through `importCustomerRequirements`.
 */

/** The fields of a requirement a column can carry. */
export const IMPORT_FIELDS = [
  "reference",
  "title",
  "statement",
  "type",
  "acceptanceCriteria",
  "rationale",
  "elements",
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

/** The words of a column heading that say which field it carries, most telling first. */
const headings: Record<ImportField, readonly string[]> = {
  reference: [
    "reference",
    "ref",
    "reqif foreignid",
    "requirement id",
    "req id",
    "identifier",
    "id",
    "paragraph",
    "para",
    "number",
    "no",
    "section",
    "clause",
    "foreignid",
  ],
  title: ["title", "name", "heading", "short text", "summary", "chaptername"],
  statement: [
    "statement",
    "requirement text",
    "requirement",
    "text",
    "shall statement",
    "shall",
    "description",
    "primary text",
    "object text",
  ],
  type: ["type", "category", "kind", "classification"],
  acceptanceCriteria: [
    "acceptance criteria",
    "acceptance",
    "verification criteria",
    "success criteria",
    "fit criterion",
    "criteria",
  ],
  rationale: ["rationale", "justification", "reason", "notes", "comment"],
  elements: [
    "elements",
    "element",
    "allocated to",
    "allocation",
    "system element",
    "subsystem",
    "component",
  ],
};

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  reference: "Reference",
  title: "Title",
  statement: "Statement",
  type: "Type",
  acceptanceCriteria: "Acceptance criteria",
  rationale: "Rationale",
  elements: "Elements",
};

const plain = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Text as rows of cells. A comma, a semicolon or a tab separates cells, whichever the first line
 * uses most; a cell in double quotes keeps its separators and line breaks, and a doubled quote
 * inside it is one quote. Lines that hold nothing are left out.
 */
export function parseDelimited(text: string): string[][] {
  // A file saved by a spreadsheet may open with a byte order mark.
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const count = (mark: string) => firstLine.split(mark).length - 1;
  const separator =
    count("\t") >= count(",") && count("\t") >= count(";") && count("\t") > 0
      ? "\t"
      : count(";") > count(",")
        ? ";"
        : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endCell = () => {
    row.push(cell.trim());
    cell = "";
  };
  const endRow = () => {
    endCell();
    if (row.some((value) => value)) rows.push(row);
    row = [];
  };
  for (let at = 0; at < source.length; at += 1) {
    const mark = source[at]!;
    if (quoted) {
      if (mark === '"') {
        if (source[at + 1] === '"') {
          cell += '"';
          at += 1;
        } else quoted = false;
      } else cell += mark;
    } else if (mark === '"' && !cell.trim()) {
      cell = "";
      quoted = true;
    } else if (mark === separator) endCell();
    else if (mark === "\n") endRow();
    else if (mark !== "\r") cell += mark;
  }
  if (cell.trim() || row.length) endRow();
  return rows;
}

/** The two a requirement needs choose first, so "Requirement ID" and "Requirement" do not clash. */
const FIND_ORDER = [
  "reference",
  "statement",
  "title",
  "acceptanceCriteria",
  "elements",
  "type",
  "rationale",
] as const satisfies readonly ImportField[];

/** Which column of a heading row carries each field: the first whose heading says so. */
export function importColumns(header: readonly string[]): Partial<Record<ImportField, number>> {
  const names = header.map(plain);
  const taken = new Set<number>();
  const columns: Partial<Record<ImportField, number>> = {};
  for (const field of FIND_ORDER) {
    let found = -1;
    for (const word of headings[field]) {
      found = names.findIndex((name, index) => !taken.has(index) && name === word);
      if (found >= 0) break;
    }
    if (found < 0)
      for (const word of headings[field]) {
        found = names.findIndex(
          (name, index) => !taken.has(index) && ` ${name} `.includes(` ${word} `),
        );
        if (found >= 0) break;
      }
    if (found >= 0) {
      columns[field] = found;
      taken.add(found);
    }
  }
  return columns;
}

/** What a file gave: its requirements in order, and what a reader should know before importing. */
export type ReadRequirements = {
  requirements: ImportedRequirement[];
  /** The fields a column was found for, in the file's column order. */
  fields: ImportField[];
  /** What stops the import: a column the file does not have. Empty when it can be read. */
  issues: string[];
  /** Rows passed over because they hold no reference or no statement. */
  skipped: number;
};

export const FILE_NEEDS_ROWS = "The file holds no rows under its headings.";

/** The element codes a cell names: separated by a comma, a semicolon or a line break. */
const elementCodes = (cell: string) => [
  ...new Set(
    cell
      .split(/[,;\n]+/)
      .map((code) => code.trim())
      .filter(Boolean),
  ),
];

/** A customer's requirements from a table of cells, first row the headings. */
export function readRequirementTable(table: readonly (readonly string[])[]): ReadRequirements {
  const [header, ...rows] = table.filter((row) => row.some((cell) => cell.trim()));
  if (!header) return { requirements: [], fields: [], issues: [FILE_NEEDS_ROWS], skipped: 0 };
  const columns = importColumns(header);
  const issues: string[] = [];
  if (columns.reference === undefined)
    issues.push("No column says where each requirement is in the document. Name one Reference.");
  if (columns.statement === undefined)
    issues.push("No column holds the requirement's text. Name one Statement.");
  const fields = IMPORT_FIELDS.filter((field) => columns[field] !== undefined).sort(
    (a, b) => columns[a]! - columns[b]!,
  );
  if (issues.length) return { requirements: [], fields, issues, skipped: 0 };
  if (!rows.length) return { requirements: [], fields, issues: [FILE_NEEDS_ROWS], skipped: 0 };
  const read = (row: readonly string[], field: ImportField) => {
    const at = columns[field];
    return at === undefined ? "" : (row[at] ?? "").trim();
  };
  const requirements: ImportedRequirement[] = [];
  let skipped = 0;
  for (const row of rows) {
    const reference = read(row, "reference");
    const statement = read(row, "statement");
    if (!reference || !statement) {
      skipped += 1;
      continue;
    }
    const type = requirementTypes.find((value) => value === plain(read(row, "type")));
    const title = read(row, "title");
    const acceptanceCriteria = read(row, "acceptanceCriteria");
    const rationale = read(row, "rationale");
    const elements = elementCodes(read(row, "elements"));
    requirements.push({
      reference,
      statement,
      ...(title ? { title } : {}),
      ...(type ? { type } : {}),
      ...(acceptanceCriteria ? { acceptanceCriteria } : {}),
      ...(rationale ? { rationale } : {}),
      ...(elements.length ? { elements } : {}),
    });
  }
  return { requirements, fields, issues: [], skipped };
}

/** A customer's requirements from a CSV or pasted spreadsheet rows, first row the headings. */
export function readRequirementRows(text: string): ReadRequirements {
  return readRequirementTable(parseDelimited(text));
}

/** A workbook as its importer gives it: sheets of rows and columns, a cell's text under both ids. */
type SheetCells = {
  sheets: readonly {
    rows: readonly { id: string }[];
    columns: readonly { id: string }[];
    cells: Record<string, Record<string, { input: string } | undefined> | undefined>;
  }[];
};

/** The first sheet of a workbook that holds anything, as rows of text. */
export function workbookTable(workbook: SheetCells): string[][] {
  for (const sheet of workbook.sheets) {
    const table = sheet.rows
      .map((row) =>
        sheet.columns.map((column) => String(sheet.cells[row.id]?.[column.id]?.input ?? "").trim()),
      )
      .filter((row) => row.some((cell) => cell));
    if (table.length) return table;
  }
  return [];
}

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Markup as the words it shows: a block or a line break ends a line, and entities are decoded. */
function markupText(markup: string): string {
  return markup
    .replace(/<\s*(?:[a-z0-9]+:)?br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(?:[a-z0-9]+:)?(?:p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
      const key = name.toLowerCase();
      if (key.startsWith("#x")) return String.fromCodePoint(parseInt(key.slice(2), 16));
      if (key.startsWith("#")) return String.fromCodePoint(parseInt(key.slice(1), 10));
      return entities[key] ?? whole;
    })
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

const attribute = (tag: string, name: string) =>
  new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i").exec(tag)?.[1];

export const REQIF_NEEDS_OBJECTS = "The ReqIF file holds no requirement objects.";

/**
 * A ReqIF exchange file as a table: one column an attribute its specification types define, by the
 * attribute's name (ReqIF.ForeignID, ReqIF.Name, ReqIF.Text and a tool's own), and one row a
 * SPEC-OBJECT, in the file's order. An object with no identifier of the customer's takes its own.
 */
export function reqifTable(xml: string): string[][] {
  const names = new Map<string, string>();
  for (const [tag] of xml.matchAll(/<ATTRIBUTE-DEFINITION-[A-Z]+\b[^>]*>/g)) {
    const id = attribute(tag, "IDENTIFIER");
    if (id) names.set(id, attribute(tag, "LONG-NAME") ?? id);
  }
  const header: string[] = [];
  const column = (name: string) => {
    const at = header.indexOf(name);
    return at >= 0 ? at : header.push(name) - 1;
  };
  // Always present, and last to be chosen: it answers for a file with no reference of its own.
  const own = "Object identifier";
  const rows: string[][] = [];
  for (const [, open, body] of xml.matchAll(
    /<SPEC-OBJECT(?=[\s>])([^>]*)>([\s\S]*?)<\/SPEC-OBJECT>/g,
  )) {
    const row: string[] = [];
    for (const [, kind, tag, inner] of (body ?? "").matchAll(
      /<ATTRIBUTE-VALUE-([A-Z]+)\b([^>]*)>([\s\S]*?)<\/ATTRIBUTE-VALUE-\1>/g,
    )) {
      const ref = /<ATTRIBUTE-DEFINITION-[A-Z]+-REF>\s*([^<\s]+)\s*</.exec(inner ?? "")?.[1];
      if (!ref) continue;
      const value =
        kind === "XHTML"
          ? markupText(/<THE-VALUE>([\s\S]*?)<\/THE-VALUE>/.exec(inner ?? "")?.[1] ?? "")
          : markupText(attribute(tag ?? "", "THE-VALUE") ?? "");
      row[column(names.get(ref) ?? ref)] = value;
    }
    row[column(own)] =
      attribute(open ?? "", "LONG-NAME") ?? attribute(open ?? "", "IDENTIFIER") ?? "";
    rows.push(row);
  }
  return [header, ...rows.map((row) => header.map((_, at) => row[at] ?? ""))];
}

/** A customer's requirements from a ReqIF exchange file. */
export function readReqif(xml: string): ReadRequirements {
  const table = reqifTable(xml);
  if (table.length < 2)
    return { requirements: [], fields: [], issues: [REQIF_NEEDS_OBJECTS], skipped: 0 };
  return readRequirementTable(table);
}

/** How a chosen file is read, from its name: a workbook, a ReqIF exchange file, or text. */
export function importFileKind(name: string): "workbook" | "reqif" | "text" {
  const lower = name.toLowerCase();
  if (lower.endsWith(".xlsx")) return "workbook";
  if (lower.endsWith(".reqif") || lower.endsWith(".xml")) return "reqif";
  return "text";
}
