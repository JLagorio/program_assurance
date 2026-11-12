// Shared by the scripts that transcribe a reference publication's tables from its PDF into the
// "reference-framework/1" JSON that scripts/seed-reference.mjs imports. A transcription is this
// project's reading of a publication that has no machine-readable form: the PDF is pinned by its
// SHA-256, every departure from the printed text is listed under `corrections`, and a script
// refuses any PDF but the pinned one. See docs/reference-seeding.md.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

export const FORMAT = "reference-framework/1";

const DOCUMENT_KEYS = [
  "format",
  "framework",
  "source",
  "method",
  "items",
  "item_links",
  "control_links",
  "corrections",
];
const FRAMEWORK_KEYS = ["code", "title", "version"];
const SOURCE_KEYS = [
  "title",
  "authority",
  "url",
  "doi",
  "sha256",
  "bytes",
  "pages",
  "published",
  "rights_statement",
];
const METHOD_KEYS = ["tool", "tool_version", "script"];
const ITEM_KEYS = ["code", "kind", "title", "prose", "parent", "ordinal", "props", "printed_in"];
const ITEM_LINK_KEYS = [
  "source_identifier",
  "source",
  "target",
  "relation",
  "ordinal",
  "props",
  "printed_in",
];
const CONTROL_LINK_KEYS = [
  "source_identifier",
  "control",
  "item",
  "relation",
  "ordinal",
  "props",
  "printed_in",
];
const CORRECTION_KEYS = ["printed_in", "printed", "transcribed", "reason"];

const CODE = /^[A-Za-z0-9][A-Za-z0-9._()-]*$/;
const FRAMEWORK_CODE = /^[a-z0-9][a-z0-9-]*$/;
const CONTROL_LABEL = /^[A-Z]{2}-[1-9][0-9]*(\([1-9][0-9]*\))?$/;

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Reads the source PDF and refuses any file but the pinned one. */
export function readSourcePdf(path, expected) {
  if (!path || !existsSync(path)) {
    throw new Error(`Pass the pinned PDF with --pdf <path>. Download it from ${expected.url}`);
  }
  const bytes = readFileSync(path);
  const digest = sha256(bytes);
  if (digest !== expected.sha256 || bytes.length !== expected.bytes) {
    throw new Error(
      `${path} is not the pinned source (sha256 ${digest}, ${bytes.length} bytes). ` +
        `Expected sha256 ${expected.sha256}, ${expected.bytes} bytes, from ${expected.url}`,
    );
  }
  return bytes;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
    ...options,
  });
  if (result.error) {
    throw new Error(
      `${command} could not run (${result.error.message}). The transcription needs poppler.`,
    );
  }
  return result;
}

/** The installed pdftotext version, such as "26.04.0". A transcription names the one it used. */
export function pdftotextVersion() {
  const result = run("pdftotext", ["-v"]);
  const match = `${result.stderr}${result.stdout}`.match(/pdftotext version ([0-9.]+)/);
  if (!match) throw new Error("pdftotext did not report its version.");
  return match[1];
}

/**
 * The PDF's text through pdftotext. Pass `["-layout"]` to keep each page's columns, and
 * `["-f", first, "-l", last]` for a page range. Pages are separated by form feeds.
 */
export function pdftotext(path, args = []) {
  const result = run("pdftotext", [...args, path, "-"]);
  if (result.status !== 0) throw new Error(`pdftotext failed: ${result.stderr}`);
  return result.stdout;
}

/** An item code's last part: lower case, every run of other characters one hyphen. */
export function slug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fail(message) {
  throw new Error(`Invalid ${FORMAT} document: ${message}`);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isText(value) {
  return typeof value === "string" && value.trim() !== "" && value === value.trim();
}

function isCount(value) {
  return Number.isInteger(value) && value > 0;
}

// Rebuilds an object with exactly the listed keys, in the listed order.
function shaped(value, keys, where) {
  if (!isPlainObject(value)) fail(`${where} is not an object.`);
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) fail(`${where} has an unknown key "${key}".`);
  }
  const result = {};
  for (const key of keys) {
    if (!(key in value)) fail(`${where} is missing "${key}".`);
    result[key] = value[key];
  }
  return result;
}

function checkReference(reference, codes, where) {
  if (!isText(reference)) fail(`${where} is not a reference.`);
  const separator = reference.indexOf(":");
  if (separator === -1) {
    if (!codes.has(reference)) fail(`${where} names no item of this document: "${reference}".`);
    return;
  }
  const framework = reference.slice(0, separator);
  const code = reference.slice(separator + 1);
  if (!FRAMEWORK_CODE.test(framework) || !CODE.test(code)) {
    fail(`${where} is not "<framework code>:<item code>": "${reference}".`);
  }
}

function checkOrdinal(value, where) {
  if (value !== null && !isCount(value)) fail(`${where} is neither null nor a positive integer.`);
}

/**
 * Checks a document and returns it with every object's keys in the format's order, so the same
 * content always serializes to the same bytes. Throws on the first problem.
 */
export function normalizeFramework(input) {
  const document = shaped(input, DOCUMENT_KEYS, "The document");
  if (document.format !== FORMAT) fail(`format is not "${FORMAT}".`);

  document.framework = shaped(document.framework, FRAMEWORK_KEYS, "framework");
  if (!FRAMEWORK_CODE.test(document.framework.code ?? "")) fail("framework.code is not a code.");
  for (const key of ["title", "version"]) {
    if (!isText(document.framework[key])) fail(`framework.${key} is empty.`);
  }

  document.source = shaped(document.source, SOURCE_KEYS, "source");
  for (const key of ["title", "authority", "url", "doi", "published"]) {
    if (!isText(document.source[key])) fail(`source.${key} is empty.`);
  }
  if (!/^[0-9a-f]{64}$/.test(document.source.sha256 ?? "")) fail("source.sha256 is not a digest.");
  for (const key of ["bytes", "pages"]) {
    if (!isCount(document.source[key])) fail(`source.${key} is not a positive integer.`);
  }
  if (document.source.rights_statement !== null && !isText(document.source.rights_statement)) {
    fail("source.rights_statement is neither null nor text.");
  }

  document.method = shaped(document.method, METHOD_KEYS, "method");
  for (const key of METHOD_KEYS) {
    if (!isText(document.method[key])) fail(`method.${key} is empty.`);
  }

  for (const key of ["items", "item_links", "control_links", "corrections"]) {
    if (!Array.isArray(document[key])) fail(`${key} is not an array.`);
  }

  const codes = new Set();
  document.items = document.items.map((value, index) => {
    const item = shaped(value, ITEM_KEYS, `items[${index}]`);
    if (!CODE.test(item.code ?? "")) fail(`items[${index}].code is not a code.`);
    if (codes.has(item.code)) fail(`item code "${item.code}" is used twice.`);
    codes.add(item.code);
    for (const key of ["kind", "title", "printed_in"]) {
      if (!isText(item[key])) fail(`item ${item.code}: ${key} is empty.`);
    }
    if (item.prose !== null && !isText(item.prose)) fail(`item ${item.code}: prose is empty.`);
    if (!isCount(item.ordinal)) fail(`item ${item.code}: ordinal is not a positive integer.`);
    if (!isPlainObject(item.props)) fail(`item ${item.code}: props is not an object.`);
    return item;
  });
  for (const item of document.items) {
    if (item.parent === null) continue;
    if (!codes.has(item.parent)) fail(`item ${item.code}: parent "${item.parent}" is not an item.`);
    if (item.parent === item.code) fail(`item ${item.code} is its own parent.`);
  }

  const identifiers = new Set();
  const checkIdentifier = (identifier, where) => {
    if (!isText(identifier)) fail(`${where}.source_identifier is empty.`);
    if (identifiers.has(identifier)) fail(`source_identifier "${identifier}" is used twice.`);
    identifiers.add(identifier);
  };

  document.item_links = document.item_links.map((value, index) => {
    const link = shaped(value, ITEM_LINK_KEYS, `item_links[${index}]`);
    checkIdentifier(link.source_identifier, `item_links[${index}]`);
    checkReference(link.source, codes, `item link ${link.source_identifier}: source`);
    checkReference(link.target, codes, `item link ${link.source_identifier}: target`);
    for (const key of ["relation", "printed_in"]) {
      if (!isText(link[key])) fail(`item link ${link.source_identifier}: ${key} is empty.`);
    }
    checkOrdinal(link.ordinal, `item link ${link.source_identifier}: ordinal`);
    if (!isPlainObject(link.props)) fail(`item link ${link.source_identifier}: props.`);
    return link;
  });

  document.control_links = document.control_links.map((value, index) => {
    const link = shaped(value, CONTROL_LINK_KEYS, `control_links[${index}]`);
    checkIdentifier(link.source_identifier, `control_links[${index}]`);
    if (!CONTROL_LABEL.test(link.control ?? "")) {
      fail(`control link ${link.source_identifier}: "${link.control}" is not a control label.`);
    }
    checkReference(link.item, codes, `control link ${link.source_identifier}: item`);
    for (const key of ["relation", "printed_in"]) {
      if (!isText(link[key])) fail(`control link ${link.source_identifier}: ${key} is empty.`);
    }
    checkOrdinal(link.ordinal, `control link ${link.source_identifier}: ordinal`);
    if (!isPlainObject(link.props)) fail(`control link ${link.source_identifier}: props.`);
    return link;
  });

  document.corrections = document.corrections.map((value, index) => {
    const correction = shaped(value, CORRECTION_KEYS, `corrections[${index}]`);
    for (const key of CORRECTION_KEYS) {
      if (!isText(correction[key])) fail(`corrections[${index}].${key} is empty.`);
    }
    return correction;
  });

  return document;
}

/** The document's bytes: checked, keys in the format's order, one space of indent, a newline. */
export function serializeFramework(document) {
  return `${JSON.stringify(normalizeFramework(document), null, 1)}\n`;
}

/** Reads a pinned `.json.gz` transcription back as text. */
export function readPinned(path) {
  return gunzipSync(readFileSync(path)).toString("utf8");
}

/**
 * Writes the transcription: `gz` is the pinned file under supabase/reference, `json` an optional
 * plain copy for review. Returns the SHA-256 and byte count of the JSON, which the manifest pins.
 */
export function writeFramework(document, { gz, json }) {
  const text = serializeFramework(document);
  const bytes = Buffer.from(text, "utf8");
  if (json) writeFileSync(json, bytes);
  if (gz) writeFileSync(gz, gzipSync(bytes, { level: 9 }));
  return { sha256: sha256(bytes), bytes: bytes.length };
}

/**
 * Compares a fresh transcription with the pinned file. Returns whether they are the same bytes.
 */
export function matchesPinned(document, gz) {
  return existsSync(gz) && readPinned(gz) === serializeFramework(document);
}

/**
 * `--pdf <path>` the pinned PDF, `--json <path>` a plain copy for review, `--check` compare with
 * the pinned file and write nothing.
 */
export function parseArguments(argv) {
  const options = { pdf: undefined, json: undefined, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--pdf" || argument === "--json") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} needs a path.`);
      options[argument.slice(2)] = value;
      index += 1;
    } else
      throw new Error(`Unknown argument ${argument}. Use --pdf <path> [--json <path>] [--check].`);
  }
  return options;
}
