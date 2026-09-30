// The lint data the token build writes (build/lint-data.mjs): what Tailwind says about the kit's
// CSS, asked once at build time, so the lint never loads Tailwind. Nothing is read at import; each
// file is read the first time a rule asks for it, and then kept:
// - lint.json, the facts a linted file may need: the Tailwind version the data reflects, the
//   inputs it was built from (by hash), the name of every @utility, the utilities a leading minus
//   negates, the variant grammar, the ARIA attribute names and shadcn's theme names;
// - lint-values.json, what only a finding's advice needs: each @utility's file, line and
//   properties, token values by kind, the token behind each token class, the specialised colour
//   classes, the Ledger classes for shadcn's theme names and Tailwind's stock scales.
// A file with no finding that needs a value never parses lint-values.json; the first file reads
// only its head, the hash of the build that wrote it.
//
// Both files come from one folder: src/generated when it has lint.json, else dist/generated, as
// classes.js reads utilities.json. A missing or unreadable file is an error that names the fix.
// Stale data is a finding, reported once per file at line 1 (reportStale), instead of an error, so
// an editor keeps every other diagnostic: lint-values.json from another build than lint.json, or,
// in the kit's own checkout, an input changed since the build (a consumer's package has no
// docs.json, one of the inputs, so it compares nothing and pays nothing).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** A generated file the plugin reads: src/generated's, else dist/generated's; undefined when
    neither has it. */
export const generatedPath = (file) =>
  ["src/generated", "dist/generated"]
    .map((dir) => path.join(packageRoot, dir, file))
    .find((candidate) => fs.existsSync(candidate));

/* ---------- what the data is built from ---------- */

/** The files the lint data is built from, as paths in the package, sorted: the token build's
    allowlist and token docs, every stylesheet the kit's Storybook entry reads, where Tailwind
    finds the kit's @utility names, variants and theme, and the table of shadcn's theme names. */
export function inputFiles(root = packageRoot) {
  const sheets = (dir) =>
    fs
      .readdirSync(path.join(root, dir))
      .filter((file) => file.endsWith(".css"))
      .map((file) => `${dir}/${file}`);
  return [
    "build/vocabulary-aliases.json",
    "src/generated/docs.json",
    "src/generated/utilities.json",
    ...sheets("src/generated"),
    ...sheets("src/styles"),
  ].sort();
}

/** Each input's sha256, by path, with its line endings read as \n, so a checkout that changes
    them is not stale: what lint.json records as `inputs`. A file with no carriage return is hashed
    as its bytes, which is the same and costs no decoding. */
export const inputHashes = (root = packageRoot) =>
  Object.fromEntries(
    inputFiles(root).map((file) => {
      const bytes = fs.readFileSync(path.join(root, file));
      const text = bytes.includes(13) ? bytes.toString("utf8").replace(/\r\n?/g, "\n") : bytes;
      return [file, crypto.createHash("sha256").update(text).digest("hex")];
    }),
  );

/** The build's identity, which both files record as `inputsHash`: sha256 of its inputs' hashes. */
export const inputsHash = (inputs) =>
  crypto.createHash("sha256").update(JSON.stringify(inputs)).digest("hex");

/* ---------- reading ---------- */

/** A path in the package as a finding shows it: `src/generated/lint.json`. */
const shown = (at) => path.relative(packageRoot, at).split(path.sep).join("/");

/** The folder both files are read from: the one that has lint.json, or an error that names the
    fix. */
function dataDir() {
  const found = generatedPath("lint.json");
  if (!found)
    throw new Error(
      "Ledger lint data is missing: lint.json is in neither src/generated nor dist/generated of @ledger/design-system. Run npm run build:tokens there, or reinstall the package.",
    );
  return path.dirname(found);
}

/** One of the two files, from the folder lint.json is in; an error that names the fix when it is
    not there. */
function dataPath(file) {
  const at = path.join(dataDir(), file);
  if (!fs.existsSync(at))
    throw new Error(
      `Ledger lint data is missing: ${shown(path.dirname(at))} has lint.json but no ${file}. Run npm run build:tokens in @ledger/design-system, or reinstall the package.`,
    );
  return at;
}

/** A file's content, or an error that names the fix. */
function readData(file) {
  const at = dataPath(file);
  try {
    return { path: at, data: JSON.parse(fs.readFileSync(at, "utf8")) };
  } catch (error) {
    throw new Error(
      `Ledger lint data is unreadable: ${shown(at)} (${error.message}). Run npm run build:tokens in @ledger/design-system, or reinstall the package.`,
    );
  }
}

/** The hash of the build that wrote a file, from its head, which the build writes first; undefined
    when the head does not show it. */
function buildOf(at) {
  const head = Buffer.alloc(1024);
  const fd = fs.openSync(at, "r");
  try {
    const read = fs.readSync(fd, head, 0, head.length, 0);
    return /"inputsHash": "([0-9a-f]{64})"/.exec(head.toString("utf8", 0, read))?.[1];
  } finally {
    fs.closeSync(fd);
  }
}

let facts;
/** The values as read: the file's path and data, or data null when another build wrote them. */
let values;
/** undefined until asked; then null when the data is fresh, or the stale finding's data. */
let stale;

/** lint.json: the facts, read on first use. */
export function lintFacts() {
  facts ??= readData("lint.json");
  return facts.data;
}

/** lint-values.json: the values, read the first time a rule needs one; null when another build
    wrote them than lint.json's, so a rule gives its advice without them (the stale finding says
    so). */
export function lintValues() {
  if (!values) {
    const read = readData("lint-values.json");
    // The two files are written together; apart, the values may be another build's.
    const same = read.data.inputsHash === lintFacts().inputsHash;
    values = { path: read.path, data: same ? read.data : null };
    if (!same) stale ??= anotherBuild(read.path);
  }
  return values.data;
}

/** The stale finding's data for lint-values.json written by another build than lint.json. */
const anotherBuild = (at) => ({
  file: shown(at),
  why: "it comes from another token build than lint.json",
});

/**
 * Whether the lint data is stale, asked once: null when it is fresh, else the finding's `{ file,
 * why }`. It is stale when lint-values.json comes from another build than lint.json (by its head),
 * and, in the kit's own checkout, when an input has changed since the build wrote lint.json.
 */
export function staleness() {
  if (stale === undefined) {
    const { inputs, inputsHash: built } = lintFacts();
    const valuesAt = dataPath("lint-values.json");
    const valuesBuilt = buildOf(valuesAt);
    if (valuesBuilt !== undefined && valuesBuilt !== built) stale = anotherBuild(valuesAt);
    else if (fs.existsSync(path.join(packageRoot, "src/generated/docs.json"))) {
      const now = inputHashes();
      const changed = [...new Set([...Object.keys(now), ...Object.keys(inputs ?? {})])]
        .sort()
        .find((file) => now[file] !== inputs?.[file]);
      stale = changed
        ? {
            file: shown(facts.path),
            why: `${changed} has changed since the token build wrote it`,
          }
        : null;
    } else stale = null;
  }
  return stale;
}

/** The words of the stale finding, for a rule that carries it in meta.messages as `stale`. */
export const STALE_MESSAGE =
  '"{{file}}" is stale: {{why}}. Run npm run build:tokens in @ledger/design-system.{{note}}';

/** The files already told, so the finding is made once per file whichever rules carry it. */
const told = new WeakSet();

/** Reports stale lint data once per file, at line 1, with message id `stale`. */
export function reportStale(context) {
  const found = staleness();
  if (!found || told.has(context.sourceCode)) return;
  told.add(context.sourceCode);
  context.report({ loc: { line: 1, column: 0 }, messageId: "stale", data: found });
}

/** A rule's visitors that also report stale lint data, as the file starts and, for data a rule
    first found stale while reading this file, as it ends. */
export const reportingStaleData = (context, visitors) => ({
  ...visitors,
  Program(node) {
    reportStale(context);
    visitors.Program?.(node);
  },
  "Program:exit"(node) {
    visitors["Program:exit"]?.(node);
    reportStale(context);
  },
});
