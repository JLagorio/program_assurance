// Compile the package's public value exports into data that ESLint can load without TypeScript
// or the component source tree: each part's name, its home, the module under src that declares it
// (so the lint can tell the kit's own Card from a private one of the same name inside the kit), and
// its styling props (so a finding can offer a prop before a class), in components.json; and what
// each part and member sets itself, by prop and value, and its className's contract, in
// parts.json (build/lint-parts.mjs). Keep this file build-only; consumers import the generated
// JSON.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { partsData } from "./lint-parts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(root, "src/index.ts");
export const inventoryPath = path.join(root, "eslint-plugin/components.json");
export const partsPath = path.join(root, "eslint-plugin/parts.json");

/** The module's value type follows named, aliased and star exports, excluding type-only exports. */
export function publicComponentNames(program, entryFile) {
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryFile);
  const symbol = source && checker.getSymbolAtLocation(source);
  if (!symbol) throw new Error(`Cannot resolve public component exports from ${entryFile}`);
  return checker
    .getTypeOfSymbolAtLocation(symbol, source)
    .getProperties()
    .map((part) => part.name)
    .filter((name) => /^[A-Z]\w*$/.test(name) && !/^[A-Z0-9_]+$/.test(name))
    .sort();
}

/** Each public part's home: the file that declares it, under `srcDir`, without its extension. */
export function publicComponentHomes(program, entryFile, srcDir) {
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryFile);
  const symbol = source && checker.getSymbolAtLocation(source);
  if (!symbol) throw new Error(`Cannot resolve public component exports from ${entryFile}`);
  const names = new Set(publicComponentNames(program, entryFile));
  const homes = {};
  for (const exported of checker.getExportsOfModule(symbol)) {
    if (!names.has(exported.name)) continue;
    const target =
      exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const file = target.declarations?.[0]?.getSourceFile().fileName;
    if (file)
      homes[exported.name] = path
        .relative(srcDir, file)
        .replace(/\.[cm]?[jt]sx?$/, "")
        .split(path.sep)
        .join("/");
  }
  return Object.fromEntries(Object.entries(homes).sort(([a], [b]) => (a < b ? -1 : 1)));
}

/** Props that never stand in for a class: the element, the classes themselves, handlers. */
const NOT_STYLE = new Set(["className", "style", "children", "as", "render", "ref", "key"]);
/** Props whose choice is behaviour or data rather than a look: a role, a reading direction, a
    value, a data or load state, a view, a heading level, an hour cycle, a pending or decorative
    flag, and the state a part shows for its data (the current page or item, an open row, an
    unread event, a calendar's month count, a side nav's collapsed form). */
const NOT_A_LOOK = new Set([
  "role",
  "dir",
  "value",
  "defaultValue",
  "state",
  "status",
  "view",
  "defaultView",
  "level",
  "titleLevel",
  "hourCycle",
  "modifier",
  "entry",
  "capture",
  "scrollOn",
  "isLoading",
  "isTooltipDisabled",
  "isDecorative",
  "isDragging",
  "isCollapsible",
  "isActive",
  "isExpanded",
  "isUnread",
  "numberOfMonths",
  "collapsedSideNav",
]);

/**
 * Each public part's own styling props, and its members' (`Table.Cell`), by dotted name: the props
 * the kit declares (not the DOM's or Base UI's) whose value is a choice of a few literals (variant,
 * size, tone, a token) and then its `is…` flags (isSelected), each in the order the source declares
 * them: by file under `srcDir`, then by position. A lint finding offers them before it offers a
 * class. A part with none is left out.
 */
export function publicComponentStyleProps(program, entryFile, srcDir) {
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryFile);
  const symbol = source && checker.getSymbolAtLocation(source);
  if (!symbol) throw new Error(`Cannot resolve public component exports from ${entryFile}`);
  const inside = `${path.resolve(srcDir)}${path.sep}`;
  const own = (prop) =>
    Boolean(prop.declarations?.length) &&
    prop.declarations.every((declaration) =>
      path.resolve(declaration.getSourceFile().fileName).startsWith(inside),
    );
  const LITERAL = ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral;
  // Where a prop is first written. The checker lists an intersection's props in the order it met
  // their types, which differs between this entry-only program and the package build's, which
  // checks every file first; the source's own order is the same in both.
  const place = (prop) =>
    prop.declarations
      .map((declaration) => ({
        file: path.relative(srcDir, declaration.getSourceFile().fileName),
        at: declaration.pos,
      }))
      .sort(byPlace)[0];
  const byPlace = (a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.at - b.at);
  const inOrder = (props) =>
    props
      .map((prop) => ({ prop, where: place(prop) }))
      .sort((a, b) => byPlace(a.where, b.where))
      .map(({ prop }) => prop.getName());
  const propsOf = (type) => {
    const [signature] = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
    const [first] = signature?.getParameters() ?? [];
    if (!first) return [];
    const choices = [];
    const flags = [];
    for (const prop of checker.getPropertiesOfType(
      checker.getTypeOfSymbolAtLocation(first, source),
    )) {
      const name = prop.getName();
      if (NOT_STYLE.has(name) || NOT_A_LOOK.has(name) || /^on[A-Z]|^(aria|data)-/.test(name))
        continue;
      if (!own(prop)) continue;
      const value = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(prop, source));
      const members = value.isUnion() ? value.types : [value];
      if (
        value.flags & ts.TypeFlags.Boolean ||
        members.every((m) => m.flags & ts.TypeFlags.BooleanLiteral)
      ) {
        if (/^is[A-Z]/.test(name)) flags.push(prop);
      } else if (members.length >= 2 && members.every((m) => m.flags & LITERAL)) choices.push(prop);
    }
    return [...inOrder(choices), ...inOrder(flags)];
  };
  const found = {};
  const visit = (name, type, depth) => {
    const props = propsOf(type);
    if (props.length) found[name] = props;
    if (depth >= 3) return;
    for (const member of type.getProperties()) {
      if (!/^[A-Z]\w*$/.test(member.name)) continue;
      const memberType = checker.getTypeOfSymbolAtLocation(member, source);
      if (checker.getSignaturesOfType(memberType, ts.SignatureKind.Call).length)
        visit(`${name}.${member.name}`, memberType, depth + 1);
    }
  };
  const names = new Set(publicComponentNames(program, entryFile));
  for (const part of checker.getTypeOfSymbolAtLocation(symbol, source).getProperties())
    if (names.has(part.name)) visit(part.name, checker.getTypeOfSymbolAtLocation(part, source), 0);
  return Object.fromEntries(Object.entries(found).sort(([a], [b]) => (a < b ? -1 : 1)));
}

/**
 * Each sized overlay's width steps, read from the source that keeps them, the kit's one place for them:
 * the prop that takes a step, and each step's name with its width in px, in the order its type
 * lists them (null for a step with no width of its own, such as fullscreen). Each keeps them in a
 * map: DialogContent and AlertDialogContent share dialogWidths, each taking the steps its own type
 * names, and SheetContent has sheetWidths. ledger/overlay-width-preset names the step nearest a
 * width written by hand from these, part by part, since a Sheet's small is not a Dialog's.
 */
const PRESET_SOURCES = {
  AlertDialogContent: {
    file: "components/dialog.tsx",
    prop: "width",
    type: "AlertDialogWidth",
    map: "dialogWidths",
  },
  DialogContent: {
    file: "components/dialog.tsx",
    prop: "width",
    type: "DialogWidth",
    map: "dialogWidths",
  },
  SheetContent: {
    file: "components/sheet.tsx",
    prop: "width",
    type: "SheetWidth",
    map: "sheetWidths",
  },
};

/** The string literals of a union type node, in order. */
const unionLiterals = (node) =>
  (ts.isUnionTypeNode(node) ? node.types : [node]).flatMap((member) =>
    ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal) ? [member.literal.text] : [],
  );

/** One overlay's steps from its source file (PRESET_SOURCES), or an error that names what moved. */
function presetOf(part, { file, prop, type, map }, srcDir) {
  const where = path.join(srcDir, file);
  const source = ts.createSourceFile(
    where,
    fs.readFileSync(where, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const fail = (what) => {
    throw new Error(
      `${part}'s width steps: ${what} in src/${file}. Update PRESET_SOURCES in build/lint-inventory.mjs.`,
    );
  };
  let names;
  let widths;
  const visit = (node) => {
    // The steps' names: a type alias's union (DialogWidth).
    if (ts.isTypeAliasDeclaration(node) && node.name.text === type)
      names = unionLiterals(node.type);
    // A map of the steps' widths: a number, or a style whose maxWidth is one.
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === map) {
      const init = node.initializer;
      if (!init || !ts.isObjectLiteralExpression(init)) fail(`${map} is not an object literal`);
      widths = {};
      for (const entry of init.properties) {
        if (!ts.isPropertyAssignment(entry)) continue;
        const value = entry.initializer;
        const max = ts.isObjectLiteralExpression(value)
          ? value.properties.find(
              (item) => ts.isPropertyAssignment(item) && item.name.getText(source) === "maxWidth",
            )?.initializer
          : value;
        widths[entry.name.getText(source)] =
          max && ts.isNumericLiteral(max) ? Number(max.text) : null;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!names?.length) fail(`no string union named ${type}`);
  if (!widths) fail(`no map named ${map}`);
  const steps = Object.fromEntries(names.map((name) => [name, widths[name] ?? null]));
  if (!Object.values(steps).some((width) => width !== null)) fail("no step with a width");
  return { prop, steps };
}

/** Every sized overlay's width steps, by part (PRESET_SOURCES). */
export function overlayPresets(srcDir = path.join(root, "src")) {
  return Object.fromEntries(
    Object.entries(PRESET_SOURCES).map(([part, from]) => [part, presetOf(part, from, srcDir)]),
  );
}

function buildProgram(program) {
  if (!program) {
    const config = ts.readConfigFile(path.join(root, "tsconfig.build.json"), ts.sys.readFile);
    if (config.error)
      throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    if (parsed.errors.length)
      throw new Error(
        parsed.errors
          .map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n"))
          .join("\n"),
      );
    program = ts.createProgram([entry], parsed.options);
  }
  return program;
}

/** The inventory as components.json holds it: the part names, each part's home, each part's
    styling props, and each sized overlay's width steps. */
export function packageInventory(program) {
  const built = buildProgram(program);
  return {
    components: publicComponentNames(built, entry),
    homes: publicComponentHomes(built, entry, path.join(root, "src")),
    styleProps: publicComponentStyleProps(built, entry, path.join(root, "src")),
    presets: overlayPresets(),
  };
}

/** JSON as Prettier writes it at 100 columns: a list of names that fits on its line stays on it. */
const printed = (value) =>
  JSON.stringify(value, null, 2).replace(
    /^( *)(".*": )?\[\n((?: *".*",?\n)+) *\](,?)$/gm,
    (list, indent, key = "", items, comma) => {
      const line = `${indent}${key}[${items
        .trim()
        .split(/,?\n\s*/)
        .join(", ")}]${comma}`;
      return line.length <= 100 ? line : list;
    },
  );

/** parts.json: what each public part and member sets itself, read from the kit's source
    (build/lint-parts.mjs). `srcDir` is the kit's src, for a program over another tree. */
export function partsInventory(
  program,
  { entryFile = entry, srcDir = path.join(root, "src") } = {},
) {
  const built = buildProgram(program);
  return {
    about:
      "Generated by build/lint-inventory.mjs from the kit's source; do not edit. Run npm run build:lint.",
    parts: partsData(built, entryFile, srcDir, publicComponentNames(built, entryFile)),
  };
}

/** Writes parts.json; returns the names it describes. */
export function writePartsData(program) {
  const parts = partsInventory(program);
  fs.writeFileSync(partsPath, `${printed(parts)}\n`);
  return Object.keys(parts.parts);
}

export function writeLintInventory(program) {
  const built = buildProgram(program);
  const inventory = packageInventory(built);
  fs.writeFileSync(inventoryPath, `${printed(inventory)}\n`);
  return { components: inventory.components, parts: writePartsData(built) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { components, parts } = writeLintInventory();
  console.log(
    `ESLint inventory: ${components.length} public component names, ${parts.length} parts and members`,
  );
}
