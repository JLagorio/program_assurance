// The public API's contract, read from the source of every part the package exports (the
// component library guide's Component contracts, docs/guides/component-library.md): an optional
// prop is spelled `?: T | undefined`, the caller's `ref` and `className` reach the element the part
// renders, and the part's `data-slot` comes after the caller's props, so a stray prop cannot rename
// it, except on the base parts other parts render under their own name. The API baseline
// (api/public-api.json) records the surface; this test holds the surface to the contract.
//
// A part that differs by design names it in EXCEPTIONS with the reason; BASE_PARTS are the parts
// that set their data-slot first, each with the parts that render it. An entry that no longer
// holds fails until it is removed. Set LEDGER_CONFORMANCE_PRINT=1 to print every finding before
// the assertions.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { publicComponentNames } from "../build/lint-inventory.mjs";
import { publicParts } from "../build/lint-parts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const entry = path.join(srcDir, "index.ts");

/* ---------- the program ---------- */

function buildProgram() {
  const config = ts.readConfigFile(path.join(root, "tsconfig.build.json"), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  return ts.createProgram([entry], parsed.options);
}
const program = buildProgram();
const checker = program.getTypeChecker();

/** Whether a node is declared in the kit's own source, not a library's. */
const ours = (node) =>
  Boolean(node) && path.resolve(node.getSourceFile().fileName).startsWith(`${srcDir}${path.sep}`);
/** `components/badge.tsx:245`, where a node is written. */
function where(node) {
  const file = node.getSourceFile();
  const { line } = file.getLineAndCharacterOfPosition(node.getStart());
  return `${path.relative(srcDir, file.fileName).split(path.sep).join("/")}:${line + 1}`;
}

/* ---------- optional props ---------- */

/** Whether a type takes `undefined`: it is undefined, any, unknown or void, or a union with one. */
const takesUndefined = (type) =>
  Boolean(
    type.flags &
    (ts.TypeFlags.Undefined | ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Void),
  ) ||
  (type.isUnion() && type.types.some(takesUndefined));

/**
 * Every optional property the kit declares on a type the package exports, or on the props of a
 * part it exports, that does not take `undefined` as written: `{ name, at }` per declaration.
 * Under exactOptionalPropertyTypes, `?: T` alone rejects `label={maybe}` where `maybe` can be
 * undefined; `?: T | undefined` takes it.
 */
function optionalWithoutUndefined(parts) {
  const seen = new Set();
  const found = [];
  const check = (owner, type) => {
    let properties;
    try {
      properties = checker.getPropertiesOfType(type);
    } catch {
      return;
    }
    for (const property of properties) {
      if (!(property.flags & ts.SymbolFlags.Optional)) continue;
      for (const declaration of property.declarations ?? []) {
        if (!ours(declaration) || seen.has(declaration)) continue;
        seen.add(declaration);
        const signature = ts.isPropertySignature(declaration) || ts.isMethodSignature(declaration);
        if (!signature || !declaration.questionToken) continue;
        // A method signature's type is its function, which never takes undefined: write it as a
        // property whose type is the function or undefined.
        const fine =
          ts.isPropertySignature(declaration) &&
          declaration.type &&
          takesUndefined(checker.getTypeFromTypeNode(declaration.type));
        if (!fine) found.push({ name: `${owner}.${property.name}`, at: where(declaration) });
      }
    }
  };
  for (const part of parts) if (part.props) check(part.name, part.props);
  const source = program.getSourceFile(entry);
  for (const exported of checker.getExportsOfModule(checker.getSymbolAtLocation(source))) {
    const target =
      exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    if (target.flags & (ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface))
      check(exported.name, checker.getDeclaredTypeOfSymbol(target));
  }
  return found.sort((a, z) => (a.name < z.name ? -1 : 1));
}

/* ---------- what a part renders ---------- */

const unwrap = (node) => {
  while (
    node &&
    (ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isNonNullExpression(node))
  )
    node = node.expression;
  return node;
};

/** A local const's initializer, where an identifier names one declared in `fn`. */
function localValue(identifier, fn) {
  const symbol = checker.getSymbolAtLocation(identifier);
  const declaration = symbol?.valueDeclaration;
  if (
    !declaration ||
    !ts.isVariableDeclaration(declaration) ||
    !declaration.initializer ||
    !ts.isIdentifier(declaration.name) ||
    declaration.pos < fn.pos ||
    declaration.end > fn.end
  )
    return undefined;
  return declaration.initializer;
}

/** The caller's props as the part's function names them: the rest of a destructured parameter
    (or of a destructuring of the props in the body), the props object itself, and the props it
    takes out of them, each with its local name (`ref: callerRef`). */
function propsNames(fn) {
  const [first] = fn.parameters;
  const named = new Map();
  const whole = new Set();
  const take = (pattern) => {
    for (const element of pattern.elements) {
      if (element.dotDotDotToken) whole.add(element.name.getText());
      else {
        const prop = (element.propertyName ?? element.name).getText().replace(/^["']|["']$/g, "");
        named.set(prop, element.name.getText());
      }
    }
  };
  if (!first) return { named, whole };
  if (ts.isObjectBindingPattern(first.name)) take(first.name);
  else if (ts.isIdentifier(first.name)) {
    whole.add(first.name.text);
    // `const { className, ...rest } = props` at the top of the body.
    if (fn.body && ts.isBlock(fn.body))
      for (const statement of fn.body.statements)
        if (ts.isVariableStatement(statement))
          for (const declaration of statement.declarationList.declarations)
            if (
              ts.isObjectBindingPattern(declaration.name) &&
              declaration.initializer &&
              ts.isIdentifier(unwrap(declaration.initializer)) &&
              unwrap(declaration.initializer).text === first.name.text
            ) {
              whole.delete(first.name.text);
              take(declaration.name);
            }
  }
  return { named, whole };
}

/**
 * Whether an expression reads one of `names` (an identifier, or `props.<name>` of the props
 * object), through the local consts it reads in `fn`, a few steps deep.
 */
function reads(node, names, fn, depth = 0) {
  if (!node || depth > 4) return false;
  let found = false;
  const visit = (child) => {
    if (found) return;
    if (ts.isIdentifier(child)) {
      const parent = child.parent;
      const isKey =
        (ts.isPropertyAccessExpression(parent) && parent.name === child) ||
        (ts.isPropertyAssignment(parent) && parent.name === child) ||
        (ts.isJsxAttribute(parent) && parent.name === child);
      if (!isKey && names.has(child.text)) found = true;
      else if (!isKey) {
        const value = localValue(child, fn);
        if (value && value !== node && reads(value, names, fn, depth + 1)) found = true;
      }
      return;
    }
    if (
      ts.isPropertyAccessExpression(child) &&
      names.has(child.name.text) &&
      ts.isIdentifier(child.expression)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}

/** A JSX attribute's name, as written. */
const attributeName = (attribute) =>
  ts.isJsxAttribute(attribute) ? attribute.name.getText() : undefined;

/**
 * How the caller's props and the part's own attributes land on one element (a JSX element, or the
 * one a `useRender` call makes), as a list in the order they are applied: `{ caller }` where the
 * caller's props are spread, `{ name, value }` for an attribute or a merged object's property the
 * part sets.
 */
function landingOrder(root, fn, callerNames) {
  const order = [];
  /** Whether an expression is the caller's props as a whole: the rest, or the props object. A
      value read out of them (`props["aria-label"]`) is not. */
  const isCaller = (node) => {
    node = unwrap(node);
    if (!node) return false;
    if (ts.isIdentifier(node)) return callerNames.has(node.text);
    // The caller's props under a condition (`blocked ? guard(props) : props`), or passed through a
    // helper that returns them filtered or guarded (`guardActivation(props)`).
    if (ts.isConditionalExpression(node))
      return isCaller(node.whenTrue) || isCaller(node.whenFalse);
    return ts.isCallExpression(node) && node.arguments.some((argument) => isCaller(argument));
  };
  /** The entries of a props object or a `mergeProps(…)` call, in order. */
  const entriesOf = (node) => {
    node = unwrap(node);
    if (!node) return;
    if (
      ts.isCallExpression(node) &&
      /(?:^|\.)mergeProps(?:<[^>]*>)?$/.test(node.expression.getText())
    )
      for (const argument of node.arguments) entriesOf(argument);
    else if (ts.isObjectLiteralExpression(node))
      for (const property of node.properties) {
        if (ts.isSpreadAssignment(property)) entriesOf(property.expression);
        else if (property.name)
          order.push({
            name: ts.isStringLiteral(property.name) ? property.name.text : property.name.getText(),
            value: ts.isPropertyAssignment(property) ? property.initializer : property.name,
          });
      }
    else if (isCaller(node)) order.push({ caller: true });
    else if (ts.isIdentifier(node) && localValue(node, fn)) entriesOf(localValue(node, fn));
  };
  if (root.kind === "element")
    for (const attribute of root.opening.attributes.properties) {
      if (ts.isJsxSpreadAttribute(attribute)) entriesOf(attribute.expression);
      else
        order.push({
          name: attributeName(attribute),
          value: attribute.initializer
            ? ts.isJsxExpression(attribute.initializer)
              ? attribute.initializer.expression
              : attribute.initializer
            : undefined,
        });
    }
  else {
    const [options] = root.call.arguments;
    const config = unwrap(options);
    if (config && ts.isObjectLiteralExpression(config))
      for (const property of config.properties) {
        const name = property.name?.getText();
        if (name === "props" && ts.isPropertyAssignment(property)) entriesOf(property.initializer);
        else if (name === "ref")
          order.push({
            name: "ref",
            value: ts.isPropertyAssignment(property) ? property.initializer : property.name,
          });
        else if (ts.isSpreadAssignment(property)) entriesOf(property.expression);
      }
  }
  return order;
}

/** Every JSX element and `useRender` call a function writes, callbacks inside it included. */
function elementsIn(fn) {
  const out = [];
  const visit = (node) => {
    if (ts.isJsxElement(node)) out.push({ kind: "element", opening: node.openingElement });
    else if (ts.isJsxSelfClosingElement(node)) out.push({ kind: "element", opening: node });
    else if (ts.isCallExpression(node) && /(?:^|\.)useRender$/.test(node.expression.getText()))
      out.push({ kind: "render", call: node });
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(fn.body, visit);
  return out;
}

/** `<Tag>` or `useRender`, where an element is written, for a finding. */
const shown = (element) =>
  element.kind === "element"
    ? `<${element.opening.tagName.getText()}> at ${where(element.opening)}`
    : `useRender at ${where(element.call)}`;

/**
 * One part's findings against the rendering rules, by rule: the element the caller's props land
 * on (where the part spreads them, else where it writes their className or ref) takes the
 * caller's `className` and `ref` when the part's props take them, and sets its `data-slot` after
 * the caller's props.
 */
function renderingFindings(part) {
  const { fn } = part;
  const { named, whole } = propsNames(fn);
  const elements = elementsIn(fn).map((element) => ({
    ...element,
    order: landingOrder(element, fn, whole),
  }));
  const found = {};
  const takes = (prop) => Boolean(part.props && checker.getPropertyOfType(part.props, prop));
  const callerAt = (element) => element.order.findLastIndex((entry) => entry.caller);
  /** Whether the caller's `prop` lands on this element. */
  const lands = (element, prop) => {
    const own = element.order.filter((entry) => entry.name === prop);
    if (named.has(prop))
      return own.some(({ value }) => reads(value, new Set([named.get(prop)]), fn));
    // Left in the caller's props: they reach the element, and nothing the part writes after them
    // replaces it without reading them.
    const at = callerAt(element);
    return (
      at >= 0 &&
      !own.some((entry) => element.order.indexOf(entry) > at && !reads(entry.value, whole, fn))
    );
  };
  const spread = elements.filter((element) => callerAt(element) >= 0);
  for (const prop of ["className", "ref"]) {
    if (!takes(prop)) {
      found[prop] = `takes no ${prop}`;
      continue;
    }
    const at = elements.filter((element) => lands(element, prop));
    if (!at.length)
      found[prop] = `the caller's ${prop} reaches no element ${
        spread.length ? `(its props land on ${shown(spread[0])})` : ""
      }`.trim();
    else if (spread.length && !at.some((element) => spread.includes(element)))
      found[prop] =
        `the caller's ${prop} lands on ${shown(at[0])}, its other props on ${shown(spread[0])}`;
  }
  for (const element of spread) {
    const slotAt = element.order.findLastIndex((entry) => entry.name === "data-slot");
    if (slotAt >= 0 && callerAt(element) > slotAt) {
      found.slot = `data-slot comes before the caller's props on ${shown(element)}`;
      break;
    }
  }
  return found;
}

/* ---------- the parts ---------- */

const names = publicComponentNames(program, entry);
const parts = publicParts(program, entry, names);
/** The parts the kit renders itself, once per function (a compound's member and its named export
    share one), under the first name. */
const rendered = [];
{
  const seen = new Map();
  for (const part of parts) {
    if (!part.fn || !ours(part.fn)) continue;
    const first = seen.get(part.fn);
    if (first) first.aliases.push(part.name);
    else {
      const entry = { ...part, aliases: [] };
      seen.set(part.fn, entry);
      rendered.push(entry);
    }
  }
}

const optional = optionalWithoutUndefined(parts);
const findings = new Map(rendered.map((part) => [part.name, renderingFindings(part)]));

if (process.env.LEDGER_CONFORMANCE_PRINT === "1") {
  for (const { name, at } of optional) console.log(`optional ${name} ${at}`);
  for (const [name, found] of findings)
    for (const [rule, text] of Object.entries(found)) console.log(`${rule} ${name}: ${text}`);
}

/* ---------- what holds otherwise, and why ---------- */

/**
 * The base parts other kit parts render under their own name, which set their `data-slot` before
 * the caller's props so the composing part's name wins (the component library guide names them).
 * Each must set it before; every other part sets it after.
 */
const BASE_PARTS = {
  Alert: "ErrorSummary and the search and palette errors render it",
  AlertDialogCancel: "an AlertDialogAction with no command renders it",
  AlertDialogDescription: "an overlay's description",
  AlertDialogTitle: "an overlay's title, which a PageHeader.Title renders as",
  Breadcrumb: "a PageHeader.Lead renders it as a record's trail",
  Collapsible: "Diff, Inspector and DataTable.Metrics render it under their own names",
  CollapsibleContent: "Section and DataTable.Metrics render it under their own names",
  DialogDescription: "an overlay's description",
  DialogTitle: "an overlay's title, which a PageHeader.Title renders as",
  DrawerDescription: "an overlay's description",
  DrawerTitle: "an overlay's title, which a PageHeader.Title renders as",
  Field: "CheckboxGroupSelectAll renders it",
  IconButton: "a copy button, an attachment's actions and a panel's close render it",
  Input: "InputGroupInput renders it",
  InputGroup: "SearchField, TimeField, DatePicker and Editable render it",
  InputGroupButton: "SearchField's clear button renders it",
  InputGroupText: "TimeField's suffix renders it",
  PopoverDescription: "an overlay's description",
  PopoverTitle: "an overlay's title",
  ScrollArea: "TabsList renders it as the strip's scroller",
  Separator: "ButtonGroup's separator renders it",
  SheetDescription: "an overlay's description",
  SheetTitle: "an overlay's title, which a PageHeader.Title renders as",
  Textarea: "InputGroupTextarea renders it",
  TooltipContent: "Truncate and a table's cut cells render it",
  TooltipTrigger: "Truncate renders it",
};

/** Parts that take no className or no ref, or put one on another element than their other props,
    by design: `{ [part]: { className?, ref? } }`, each the reason. */
const STATE_ROOT = "a state root renders no element; its Trigger and Content do, and take both";
const PROVIDER = "a provider renders its children and no element of its own";
const DRAG = "a drag context around a table's rows or columns renders no element of its own";
const OVERLAY =
  "an overlay pattern: its props are its open state and its task's data, and the Dialog or Sheet it renders is drawn by the kit";
const both = (reason) => ({ className: reason, ref: reason });
const EXCEPTIONS = {
  ActionBar: both("deprecated for PageHeader, and gone in the next version"),
  AlertDialog: both(STATE_ROOT),
  Calendar: { ref: "react-day-picker renders the calendar's elements and takes no ref for them" },
  CalendarDayButton: { ref: "react-day-picker renders the day button and hands it no ref" },
  ColumnSortable: both(DRAG),
  Combobox: both(STATE_ROOT),
  ComboboxCollection: both("it renders its items through its children function, no element"),
  ComboboxValue: both("it renders the chosen value's text, no element"),
  CommandDialog: {
    className:
      "a Dialog root takes the open state, and the caller's className and style dress the content it renders",
    ref: "a Dialog root takes the open state and renders no element of its own",
  },
  CommandPalette: both(OVERLAY),
  CommandSeparator: {
    className: "cmdk's Separator renders as its child through asChild, the div that takes it",
  },
  Dialog: both(STATE_ROOT),
  DragContext: both(DRAG),
  Drawer: both(STATE_ROOT),
  DropdownMenu: both(STATE_ROOT),
  DropdownMenuSub: both(STATE_ROOT),
  HeadingLevelProvider: both(PROVIDER),
  HoverCard: both(STATE_ROOT),
  LedgerProvider: both(PROVIDER),
  ModeProvider: both(PROVIDER),
  NumberField: { ref: "the ref is the input's, so a form can focus it; the Root takes the rest" },
  PickerSheet: both(OVERLAY),
  Popover: both(STATE_ROOT),
  PreviewSheet: both(OVERLAY),
  RecordBrowser: both(OVERLAY),
  RecordPicker: both(OVERLAY),
  ResizableHandle: { ref: "react-resizable-panels takes the element's ref as elementRef" },
  ResizablePanel: { ref: "react-resizable-panels takes the element's ref as elementRef" },
  ResizablePanelGroup: { ref: "react-resizable-panels takes the element's ref as elementRef" },
  RowSortable: both(DRAG),
  SearchField: {
    className:
      "the native props and the ref are the input's, so a form can focus and name it; className dresses the frame around it",
  },
  Select: both(STATE_ROOT),
  Sheet: both(STATE_ROOT),
  "Shell.Panel.Splitter": both("the Shell places, sizes and draws its splitter"),
  "Shell.SideNav.Splitter": both("the Shell places, sizes and draws its splitter"),
  TimeField: {
    className:
      "the native props and the ref are the input's, so a form can focus and name it; className dresses the frame around it",
  },
  ToastProvider: both(PROVIDER),
  Toaster: both("it renders the toasts' region in a portal, an element per open toast"),
  Tooltip: both(STATE_ROOT),
  TooltipProvider: both(PROVIDER),
};

/** A rule's findings that nothing above excuses, and the excuses that no longer hold. */
function judged(rule) {
  const unexcused = [];
  const stale = [];
  for (const part of rendered) {
    const finding = findings.get(part.name)[rule];
    const excused = Boolean(EXCEPTIONS[part.name]?.[rule]);
    if (finding && !excused) unexcused.push(`${part.name}: ${finding}`);
    if (!finding && excused) stale.push(`${part.name} holds now: remove its ${rule} entry`);
  }
  for (const name of Object.keys(EXCEPTIONS))
    if (!findings.has(name)) stale.push(`${name} is no part the package exports`);
  return { unexcused, stale: [...new Set(stale)] };
}

/* ---------- the tests ---------- */

test("the parts are read from the package's exports", () => {
  assert.ok(rendered.length > 300, `only ${rendered.length} parts were read`);
});

test("every optional prop takes undefined: `?: T | undefined`", () => {
  assert.deepEqual(
    optional.map(({ name, at }) => `${name} (${at}) is \`?: T\`; write \`?: T | undefined\``),
    [],
  );
});

for (const rule of ["className", "ref"])
  test(`the caller's ${rule} reaches the element the part's props land on`, () => {
    const { unexcused, stale } = judged(rule);
    assert.deepEqual(unexcused, [], `\n${unexcused.join("\n")}`);
    assert.deepEqual(stale, [], `\n${stale.join("\n")}`);
  });

test("a part sets its data-slot after the caller's props, and a base part before them", () => {
  const problems = [];
  for (const part of rendered) {
    const before = Boolean(findings.get(part.name).slot);
    if (before && !BASE_PARTS[part.name])
      problems.push(`${part.name}: ${findings.get(part.name).slot}; write it after them`);
    if (!before && BASE_PARTS[part.name])
      problems.push(
        `${part.name} is a base part (${BASE_PARTS[part.name]}) and sets its data-slot after the caller's props, so a part that renders it loses its own name`,
      );
  }
  for (const name of Object.keys(BASE_PARTS))
    if (!findings.has(name)) problems.push(`${name} is no part the package exports`);
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

/** Base parts in use that the component library guide's list does not name yet; the list only
    shrinks as the guide names them. */
const UNDOCUMENTED_BASE = new Set([]);

test("the base parts are the ones the component library guide names", () => {
  const guide = fs.readFileSync(path.join(root, "../../docs/guides/component-library.md"), "utf8");
  const list =
    /A\s+base\s+part\s+that\s+other\s+kit\s+parts\s+render[\s\S]*?Every\s+other\s+part\s+sets\s+it\s+last\./.exec(
      guide,
    )?.[0] ?? "";
  assert.ok(list, "the guide's list of base parts was not found");
  const names = (name) => new RegExp(`\\b${name}\\b`).test(list);
  const problems = [];
  for (const name of Object.keys(BASE_PARTS)) {
    // The guide names an overlay's title and description together.
    const named = /(?:Title|Description)$/.test(name) || names(name);
    if (!named && !UNDOCUMENTED_BASE.has(name))
      problems.push(`${name} is a base part the guide does not name: name it there`);
    if (named && UNDOCUMENTED_BASE.has(name))
      problems.push(`the guide names ${name} now: remove it from UNDOCUMENTED_BASE`);
  }
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});
