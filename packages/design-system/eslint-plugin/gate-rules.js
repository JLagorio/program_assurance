// Rules for the mistakes the 24 September audit found repeated across screens: focus that an
// overlay cannot return, a pending flag that disables the focused button, pixel widths and design
// values in style, hand-written alerts, and buttons that navigate. Each rule reads one file; the
// browser suites check what crosses files.
import path from "node:path";

import { classSites } from "./class-sites.js";
import { isNamedColour, literalColour } from "./colours.js";
import {
  displayNameOf,
  forwardedTo,
  isKitSourceFile,
  jsxTag,
  kitSrcOf,
  partNameOf,
  propOwnerOf,
  shadowsOuterName,
} from "./identity.js";
import { PLAIN_LAYOUT, presetAdvice, styleSpaceUse } from "./advice.js";
import { classesOf } from "./classes.js";
import { fitted, lengthPx, styleColourHint, styleLengthHint, widthOfClass } from "./nearest.js";
import { defineRules, render } from "./report.js";
import {
  entriesOf,
  globalMethod,
  importOf,
  keyName,
  leaves,
  objectsOf,
  styleEntries,
  styleObjects,
  unwrap as unwrapValue,
  valueWalker,
  variableOf,
} from "./values.js";

// The allowance every rule takes lives in report.js, and is exported here as well.
export { withAllowance } from "./report.js";

const tag = (node) =>
  node.type === "JSXIdentifier"
    ? node.name
    : node.type === "JSXMemberExpression"
      ? `${tag(node.object)}.${tag(node.property)}`
      : node.type === "JSXNamespacedName"
        ? `${node.namespace.name}:${node.name.name}`
        : "";
const attribute = (node, name) =>
  node.attributes.findLast((item) => item.type === "JSXAttribute" && item.name.name === name);
const unwrap = (node) => {
  while (
    node &&
    [
      "JSXExpressionContainer",
      "TSAsExpression",
      "TSSatisfiesExpression",
      "TSNonNullExpression",
      "ChainExpression",
    ].includes(node.type)
  )
    node = node.expression;
  return node;
};
const literal = (node) => {
  node = unwrap(node);
  return node?.type === "Literal" ? node.value : undefined;
};

function binding(context, node, name) {
  let scope = context.sourceCode.getScope(node);
  while (scope && !scope.set.has(name)) scope = scope.upper;
  return scope?.set.get(name);
}

/** The initialiser of a single-definition const, so `const style = {…}` is read where it is used.
    A destructured binding is one slot of its initialiser, so it gives nothing. */
function constInit(context, node) {
  if (node?.type !== "Identifier") return undefined;
  const definitions = binding(context, node, node.name)?.defs;
  if (definitions?.length !== 1) return undefined;
  const [definition] = definitions;
  if (definition.type !== "Variable" || definition.parent?.kind !== "const") return undefined;
  if (definition.node.id?.type !== "Identifier") return undefined;
  return definition.node.init ?? undefined;
}

/**
 * The name these rules judge a JSX tag by, since the defect is the same in any part of that name
 * (identity.js): an alias in `import { Button as Action }` or a namespace member `Kit.Button` of
 * the kit is Button, and so is a relative import inside the package; a look-alike or another
 * package's part keeps its name as written; a parameter or a local that shadows an outer name is
 * no part ("").
 */
const kitName = (context, nameNode) => partNameOf(context, nameNode);

/* ---------- overlays ---------- */

const OVERLAY =
  /^(Dialog|Sheet|AlertDialog|Drawer|Popover|HoverCard|DropdownMenu|ContextMenu|Command)(Content|Popup)$|^(PickerSheet|RecordBrowser|PreviewSheet|CommandDialog|CommandPalette)$/;

/** The overlay part a node is inside, as the kit names it (`DialogContent`), or "". */
function insideOverlay(context, node) {
  for (let parent = node.parent; parent; parent = parent.parent)
    if (parent.type === "JSXElement") {
      const name = kitName(context, parent.openingElement.name);
      if (OVERLAY.test(name)) return name;
    }
  return "";
}

/** The overlay a component of this file hands the children of `opening` on to, as `{ overlay,
    wrapper }`, when a node reaches it among those children (not through a prop): `<Pane><input
    autoFocus /></Pane>` with `const Pane = (props) => <DialogContent {...props} />`. */
function forwardedOverlay(context, node) {
  for (let child = node, parent = node.parent; parent; child = parent, parent = parent.parent) {
    if (parent.type !== "JSXElement") continue;
    if (!parent.children.includes(child)) continue;
    const forwarded = forwardedTo(context, parent.openingElement, "children");
    const name = forwarded ? kitName(context, forwarded.element.name) : "";
    if (OVERLAY.test(name)) return { overlay: name, wrapper: forwarded.wrapper };
  }
  return undefined;
}

/** The names of the function components around a node, innermost first. */
function componentsOf(node) {
  const names = [];
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === "FunctionDeclaration" && parent.id) names.push(parent.id.name);
    if (
      parent.type === "VariableDeclarator" &&
      parent.id.type === "Identifier" &&
      /Function|Call/.test(parent.init?.type ?? "")
    )
      names.push(parent.id.name);
  }
  return names.filter((name) => /^[A-Z]/.test(name));
}

/* ---------- a pending flag in disabled ---------- */

/** What an expression reads: whole member chains (`save.isPending`) and bare identifiers. */
function references(context, node, out = new Set()) {
  node = unwrap(node);
  if (!node) return out;
  switch (node.type) {
    case "Identifier":
      if (node.name !== "undefined") out.add(node.name);
      return out;
    case "MemberExpression":
      out.add(context.sourceCode.getText(node).replace(/\?\./g, ".").replace(/\s+/g, ""));
      return out;
    case "UnaryExpression":
      return references(context, node.argument, out);
    case "LogicalExpression":
    case "BinaryExpression":
      references(context, node.left, out);
      return references(context, node.right, out);
    case "ConditionalExpression":
      references(context, node.test, out);
      references(context, node.consequent, out);
      return references(context, node.alternate, out);
    case "CallExpression":
      for (const argument of node.arguments) references(context, argument, out);
      return out;
    default:
      return out;
  }
}

/* ---------- widths and design values in style ---------- */

const WIDTH_PROPS = new Set([
  "width",
  "minWidth",
  "maxWidth",
  "inlineSize",
  "minInlineSize",
  "maxInlineSize",
]);
const SIZED_OVERLAY = /^(Dialog|Sheet|AlertDialog|Drawer)Content$/;
const WIDTH_CLASS = /^-?(w|min-w|max-w|size)-/;

const LENGTH_PROPS =
  /^(width|height|(min|max)(Width|Height)|(min|max)?(Inline|Block)Size|inlineSize|blockSize|padding(Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd)?|gap|rowGap|columnGap|top|right|bottom|left|inset(Inline|Block)?(Start|End)?|fontSize|letterSpacing|borderRadius|border(Top|Bottom|Start|End)(Left|Right|Start|End)Radius|border(Top|Right|Bottom|Left|Inline|Block)?(Start|End)?Width|outlineWidth|outlineOffset|flexBasis|textIndent|gridTemplateColumns|gridTemplateRows|gridAutoRows|gridAutoColumns|containIntrinsic(Size|Width|Height|InlineSize|BlockSize)|scroll(Padding|Margin)(Top|Right|Bottom|Left|Inline|Block)?(Start|End)?)$/;
/** A length only as a string: a number is flex's grow factor (`flex: 1`), `"1 1 12rem"` a basis. */
const STRING_LENGTH_PROPS = /^flex$/;
/** Properties whose value can hold a colour: every `*Color` (stopColor, scrollbarColor,
    borderInlineStartColor, WebkitTextFillColor), the border shorthands, physical and logical, and
    the shorthands, shadows and filters that take one. */
const COLOR_PROPS =
  /^(color|background|backgroundImage|border(Top|Right|Bottom|Left|Inline|Block)?(Start|End)?|outline|fill|stroke|boxShadow|textShadow|filter|textDecoration|columnRule|\w*Color)$/;
const MARGIN_PROPS = /^margin/;
/** A length with a unit that is a design value. A viewport length (`100dvh`, `90vw`, `10dvh` in
    `min()`) is structure, the window's own size, and is not one. */
const LITERAL_LENGTH = /(?:^|[^\w-])(-?(?:\d*\.)?\d+(?:px|rem|em|ch|ex|pt|pc|cm|mm|in|q))\b/i;

/** var(--x) with no fallback, a token reference, and url(#id), which names a pattern or a
    gradient: no literal in either counts. A fallback (`var(--x, 288px)`) is read, since it is what
    the page shows wherever the variable is not set. */
const VAR_CALL = /var\(--[\w-]+\)/g;
const URL_CALL = /url\([^)]*\)/g;
/** Every literal length in a value, as written. */
const LITERAL_LENGTHS = new RegExp(LITERAL_LENGTH.source, "gi");
/** The first literal length in a value that is not zero (`0px`, `0rem` and `-0` are 0 in any
    unit, which no scale needs a token for), or undefined. */
function nonZeroLength(text) {
  for (const match of text.matchAll(LITERAL_LENGTHS))
    if (Number.parseFloat(match[1]) !== 0) return match[1];
  return undefined;
}

/**
 * A literal's text two ways: `written`, as the code writes it (a template's `${…}` included), and
 * `read`, the same with each `${…}` blanked to spaces of its length, so a match in it is at the
 * same place in `written`. Undefined when the literal is not a string or a template.
 */
function styleText(node, sourceCode) {
  if (node.type === "Literal" && typeof node.value === "string")
    return { written: node.value, read: node.value };
  if (node.type !== "TemplateLiteral") return undefined;
  const cooked = node.quasis.map((part) => part.value.cooked ?? "");
  const holes = node.expressions.map((expression) => `\${${sourceCode.getText(expression)}}`);
  const joined = (hole) =>
    cooked.map((part, i) => part + (i < holes.length ? hole(i) : "")).join("");
  return {
    written: joined((i) => holes[i]),
    read: joined((i) => " ".repeat(holes[i].length)),
  };
}

/** A negative number literal's value, a number literal's, or undefined. */
function numberOf(leaf) {
  if (leaf.type === "Literal") return typeof leaf.value === "number" ? leaf.value : undefined;
  const argument = unwrapValue(leaf.argument);
  return leaf.type === "UnaryExpression" && typeof argument?.value === "number"
    ? -argument.value
    : undefined;
}

/**
 * The literal design value in one leaf of a style property's value, as its message id and the
 * value it quotes (`{ kind: "length", value: "16px", whole: true }`), or undefined when it is a
 * token, structure or computed. A custom property carries any computed value, so only a literal
 * colour in one is a problem.
 */
function leafProblem(name, leaf, sourceCode) {
  const custom = name.startsWith("--");
  const number = numberOf(leaf);
  if (number !== undefined) {
    if (number === 0 || custom) return undefined;
    if (MARGIN_PROPS.test(name)) return { kind: "margin" };
    if (name === "fontWeight") return { kind: "fontWeight" };
    if (LENGTH_PROPS.test(name)) return { kind: "length", value: `${number}px`, whole: true };
    return undefined;
  }
  const parts = styleText(leaf, sourceCode);
  if (!parts) return undefined;
  // A token reference and url(#id), which names a pattern or gradient, are taken out before the
  // value is read; a var()'s fallback stays.
  const bare = parts.read.replace(VAR_CALL, "var").replace(URL_CALL, "url");
  if (custom) {
    const colour = literalColour(parts.read, parts.written);
    if (colour) return { kind: "customColour", value: colour };
    // A custom property set to a length written whole, not built around a hole, is a design
    // value under another name (`"--ds-space-200": "13px"`).
    const whole = leaf.type === "Literal" || leaf.expressions.length === 0;
    const length = whole ? nonZeroLength(bare) : undefined;
    return length ? { kind: "customLength", value: length } : undefined;
  }
  if (MARGIN_PROPS.test(name) && !/^\s*(0|0px|auto)?\s*$/.test(bare)) return { kind: "margin" };
  if (name === "fontFamily" && bare.trim()) return { kind: "fontFamily" };
  if (name === "fontWeight" && /\d/.test(bare)) return { kind: "fontWeight" };
  const length =
    LENGTH_PROPS.test(name) || STRING_LENGTH_PROPS.test(name) || COLOR_PROPS.test(name)
      ? nonZeroLength(bare)
      : undefined;
  if (length) return { kind: "length", value: length, whole: bare.trim() === length };
  if (COLOR_PROPS.test(name)) {
    const colour = literalColour(parts.read, parts.written);
    if (colour) return { kind: "colour", value: colour };
  }
  return undefined;
}

/* ---------- where a literal came from, and the kit's preset maps ---------- */

/** Where a leaf is written when that is outside the value it was read from: `{ name, line }` for
    a const, `{ line }` elsewhere; undefined when it is written in the value itself. */
function originOf(leaf, value) {
  if (leaf.range[0] >= value.range[0] && leaf.range[1] <= value.range[1]) return undefined;
  const line = leaf.loc.start.line;
  for (let node = leaf.parent; node; node = node.parent) {
    // A literal inside a function (a call's argument in a component) is no const's value.
    if (/Function/.test(node.type)) break;
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier")
      return { name: node.id.name, line };
  }
  return { line };
}
/** An origin as a clause inside parentheses: `, from INDENT on line 12`. */
const fromClause = (origin) =>
  origin ? `, from ${origin.name ? `${origin.name} on ` : ""}line ${origin.line}` : "";

/** A const declared at the top of a module, exported or not. */
const topLevel = (declarator) => {
  const declaration = declarator.parent;
  const holder = declaration?.parent;
  return (
    declaration?.type === "VariableDeclaration" &&
    declaration.kind === "const" &&
    (holder?.type === "Program" ||
      (holder?.type === "ExportNamedDeclaration" && holder.parent?.type === "Program"))
  );
};

/**
 * The kit's preset maps: the one place its Dialog and Sheet widths are written, each read by its
 * width prop. A width or a height in one is the preset's step, not a style, so no-style-design-value
 * leaves it alone; by the file under the kit's src and the top-level const's name, and only in the
 * kit. Any other property written in one (a colour, a padding, a radius) is read as anywhere else.
 */
export const PRESET_MAPS = Object.freeze({
  "components/dialog.tsx": "dialogWidths",
  "components/sheet.tsx": "sheetWidths",
});
/** The properties a preset map's step sets. */
const PRESET_PROPS =
  /^((min|max)?(Width|Height)|width|height|(min|max)?(Inline|Block)Size|inlineSize|blockSize)$/;

/**
 * Each `dimension.part.*` token, with the part it sizes and the files under the kit's src that
 * draw that part (a stylesheet among them, which reads it as `var(--ds-dimension-part-…)`): a
 * part's own size is read by that part alone. A product sizes the part through
 * its props, and another kit part is not that part (test/lint-gates.test.mjs holds this map to the
 * tokens and to where the kit reads them).
 */
export const PART_TOKENS = Object.freeze({
  "dimension.part.tooltip": { part: "Tooltip", files: ["components/tooltip.tsx"] },
  "dimension.part.hoverCard": { part: "HoverCard", files: ["components/hover-card.tsx"] },
  "dimension.part.popover": { part: "Popover", files: ["components/popover.tsx"] },
  "dimension.part.command": { part: "CommandDialog", files: ["components/command.tsx"] },
  "dimension.part.menu": { part: "DropdownMenu", files: ["components/dropdown-menu.tsx"] },
  "dimension.part.submenu": { part: "DropdownMenu", files: ["components/dropdown-menu.tsx"] },
  "dimension.part.select": { part: "Select", files: ["components/select.tsx"] },
  "dimension.part.search": { part: "Toolbar", files: ["patterns/toolbar.tsx"] },
  "dimension.part.steps": {
    part: "Stepper",
    files: ["components/stepper.tsx", "components/timeline.tsx"],
  },
  "dimension.part.skeletonCircle": { part: "Skeleton", files: ["components/skeleton.tsx"] },
  "dimension.part.skeletonBlock": { part: "Skeleton", files: ["components/skeleton.tsx"] },
  "dimension.part.emptyMeasure": { part: "Empty", files: ["components/empty.tsx"] },
  "dimension.part.keyValue": { part: "KeyValue", files: ["components/key-value.tsx"] },
  "dimension.part.keyValueLabelNarrow": { part: "KeyValue", files: ["components/key-value.tsx"] },
  "dimension.part.keyValueLabel": { part: "KeyValue", files: ["components/key-value.tsx"] },
  "dimension.part.keyValueLabelWide": { part: "KeyValue", files: ["components/key-value.tsx"] },
  "dimension.part.codeBlock": { part: "CodeBlock", files: ["components/code-block.tsx"] },
  "dimension.part.itemId": { part: "Item", files: ["components/item.tsx"] },
  "dimension.part.filter": { part: "DataTable.Filter", files: ["patterns/data-table/filter.tsx"] },
  "dimension.part.tableSearch": {
    part: "DataTable.Search",
    files: ["patterns/data-table/filter.tsx"],
  },
  "dimension.part.previewSheet": { part: "PreviewSheet", files: ["patterns/preview-sheet.tsx"] },
  "dimension.part.filterChipValue": { part: "FilterChip", files: ["components/chip.tsx"] },
  "dimension.part.commandList": { part: "Command", files: ["components/command.tsx"] },
  "dimension.part.cellCard": {
    part: "Table.List",
    files: ["components/table.tsx", "patterns/data-table/data-table.tsx"],
  },
  "dimension.part.composerSuggestions": { part: "Composer", files: ["patterns/composer.tsx"] },
  "dimension.part.composerSuggestionsHeight": {
    part: "Composer",
    files: ["patterns/composer.tsx"],
  },
  "dimension.part.tableMenu": {
    part: "DataTable.Columns",
    files: ["patterns/data-table/columns-menu.tsx"],
  },
  "dimension.part.tableColumnMenu": {
    part: "DataTable.HeaderMenu",
    files: ["patterns/data-table/columns-menu.tsx"],
  },
  "dimension.part.tableGroupBy": {
    part: "DataTable.GroupBy",
    files: ["patterns/data-table/group-by.tsx"],
  },
  "dimension.part.tablePresets": {
    part: "DataTable.Presets",
    files: ["patterns/data-table/filter.tsx"],
  },
  "dimension.part.editableSelect": { part: "EditableSelect", files: ["patterns/editable.tsx"] },
  "dimension.part.editableCombobox": { part: "EditableSelect", files: ["patterns/editable.tsx"] },
  "dimension.part.editableComboboxList": {
    part: "EditableSelect",
    files: ["patterns/editable.tsx"],
  },
  "dimension.part.recordSearch": {
    part: "SearchDialog",
    files: ["patterns/search-dialog.tsx", "patterns/record-picker.tsx"],
  },
  "dimension.part.relatedCard": { part: "Related", files: ["patterns/related.tsx"] },
  "dimension.part.recordBrowser": { part: "RecordBrowser", files: ["patterns/record-browser.tsx"] },
  "dimension.part.recordBrowserPreview": { part: "RecordBrowser", files: ["styles/layout.css"] },
  "dimension.part.drawerSmall": { part: "Drawer", files: ["styles/drawer.css"] },
  "dimension.part.drawer": { part: "Drawer", files: ["styles/drawer.css"] },
  "dimension.part.drawerLarge": { part: "Drawer", files: ["styles/drawer.css"] },
  "dimension.part.toast": { part: "Toaster", files: ["styles/toast.css"] },
  "dimension.part.pageHeaderHeading": { part: "PageHeader", files: ["styles/layout.css"] },
  "dimension.part.sectionHeading": { part: "Section", files: ["styles/layout.css"] },
});
/** The linted file's path under the kit's src, in the kit's own source. */
function kitFileOf(context) {
  const src = kitSrcOf(context);
  if (!src || !context.filename) return undefined;
  return path.relative(src, context.filename).split(path.sep).join("/");
}
/** Whether a part token is the linted file's own: the kit draws that part here. */
const ownPartToken = (context, name) =>
  Object.hasOwn(PART_TOKENS, name) && PART_TOKENS[name].files.includes(kitFileOf(context) ?? "");

/** Whether a call reads a token of the kit: `token()` or `tokenValue()` imported from the package,
    or in the kit's own source from its generated tokens. */
function tokenCall(context, call) {
  if (call?.type !== "CallExpression") return false;
  const callee = unwrapValue(call.callee);
  if (callee?.type !== "Identifier") return false;
  const binding = importOf(variableOf(context, callee));
  return (
    (binding?.imported === "token" || binding?.imported === "tokenValue") &&
    (binding.source === "@ledger/design-system" ||
      (Boolean(kitSrcOf(context)) &&
        /^\.\.?\/(.*\/)?generated\/tokens(\.[jt]s)?$/.test(binding.source)))
  );
}
/** The part token a value reads, `token("dimension.part.…")` or `var(--ds-dimension-part-…)`,
    as its name, or undefined. */
function partTokenOf(context, node) {
  if (tokenCall(context, node)) {
    const [name] = node.arguments;
    const value = name?.type === "Literal" ? String(name.value) : "";
    return value.startsWith("dimension.part.") ? value : undefined;
  }
  const text =
    node?.type === "Literal" && typeof node.value === "string"
      ? node.value
      : node?.type === "TemplateLiteral"
        ? node.quasis.map((quasi) => quasi.value.cooked ?? "").join(" ")
        : "";
  const found = /var\(--ds-dimension-part-([\w-]+)/.exec(text);
  return found
    ? `dimension.part.${found[1].replace(/-(\w)/g, (_, c) => c.toUpperCase())}`
    : undefined;
}
/** The preset map's name in the linted file, when it is one of the kit's files that holds one. */
function presetMapOf(context) {
  const file = kitFileOf(context);
  return file && Object.hasOwn(PRESET_MAPS, file) ? PRESET_MAPS[file] : undefined;
}
/** Whether a node is written inside the top-level const `name`. */
function insideConst(node, name) {
  for (let parent = node; parent; parent = parent.parent)
    if (parent.type === "VariableDeclarator" && parent.id.type === "Identifier")
      return parent.id.name === name && topLevel(parent);
  return false;
}

/* ---------- which consts are style, and which elements are recharts' ---------- */

const typeName = (name) =>
  name?.type === "Identifier"
    ? name.name
    : name?.type === "TSQualifiedName"
      ? `${typeName(name.left)}.${name.right.name}`
      : "";
const isStyleType = (type) =>
  type?.type === "TSTypeReference" && /(^|\.)CSSProperties$/.test(typeName(type.typeName));
/** What a declared type says a const holds: "style" (CSSProperties, alone or in a union or an
    intersection), "map" (a Record of them), or undefined. */
function styleKind(type) {
  if (!type) return undefined;
  if (isStyleType(type)) return "style";
  if (type.type === "TSUnionType" || type.type === "TSIntersectionType")
    return type.types.some(isStyleType) ? "style" : undefined;
  const params = (type.typeArguments ?? type.typeParameters)?.params;
  if (type.type === "TSTypeReference" && typeName(type.typeName) === "Record")
    return isStyleType(params?.[1]) ? "map" : undefined;
  return undefined;
}
/** The type a const is declared with, or asserted to (`as` or `satisfies` on its initialiser). */
function declaredType(declarator) {
  const annotated = declarator.id.typeAnnotation?.typeAnnotation;
  if (annotated) return annotated;
  const init = declarator.init;
  return init?.type === "TSAsExpression" || init?.type === "TSSatisfiesExpression"
    ? init.typeAnnotation
    : undefined;
}

/** Whether a file imports recharts at all, read once per file. */
const rechartsFiles = new WeakMap();
const importsRecharts = (context) => {
  const { ast } = context.sourceCode;
  if (!rechartsFiles.has(ast))
    rechartsFiles.set(
      ast,
      ast.body.some(
        (statement) =>
          statement.type === "ImportDeclaration" && /^recharts(\/|$)/.test(statement.source.value),
      ),
    );
  return rechartsFiles.get(ast);
};
/** Whether a JSX tag is a part imported from recharts, by name, alias or namespace. */
function fromRecharts(context, nameNode) {
  if (!importsRecharts(context)) return false;
  let root = nameNode;
  while (root.type === "JSXMemberExpression") root = root.object;
  if (root.type !== "JSXIdentifier") return false;
  return importOf(variableOf(context, root))?.source === "recharts";
}
/**
 * Whether a value is the size a kit part keeps for itself, in the file that draws that part:
 * `token("dimension.part.…")` read from the kit's generated tokens, the width a sized overlay of
 * the kit (CommandDialog) is given by its own role token, which is the kit's one place for it, as
 * the Dialog and Sheet steps are theirs; or the part's own size prop falling back to it (`width ??
 * token("dimension.part.previewSheet")`). Another part's token, and a product's `token()`, never
 * count.
 */
function partSize(context, value) {
  const node = unwrapValue(value);
  if (!kitSrcOf(context) || !node) return false;
  if (node.type === "LogicalExpression" && (node.operator === "??" || node.operator === "||")) {
    const left = unwrapValue(node.left);
    const prop =
      left?.type === "Identifier" && variableOf(context, left)?.defs[0]?.type === "Parameter";
    return prop && partSize(context, node.right);
  }
  const name = node.type === "CallExpression" ? partTokenOf(context, node) : undefined;
  return name !== undefined && ownPartToken(context, name);
}

/** Recharts' props that take a style object, which no-style-design-value judges as style. */
const RECHARTS_STYLES = new Set(["contentStyle", "wrapperStyle", "labelStyle", "itemStyle"]);

/** A module's top-level declarator whose `[filter]` holds, as a selector: ESLint matches it in its
    traversal, so the rules that judge a module's consts are not called for every declarator of
    every function. */
const topLevelDeclarator = (filter) =>
  [
    `Program > VariableDeclaration > VariableDeclarator${filter}`,
    `Program > ExportNamedDeclaration > VariableDeclaration > VariableDeclarator${filter}`,
  ].join(", ");
/** A const that can be a list of colours: an array or object literal, asserted or frozen. */
const LIST_DECLARATOR = topLevelDeclarator(
  "[init.type=/^(ArrayExpression|ObjectExpression|TSAsExpression|TSSatisfiesExpression|CallExpression)$/]",
);
/** A const that can be typed as a style: annotated, or asserted with `as` or `satisfies`. */
const TYPED_DECLARATOR = [
  topLevelDeclarator("[id.typeAnnotation]"),
  topLevelDeclarator("[init.type=/^(TSAsExpression|TSSatisfiesExpression)$/]"),
].join(", ");
/** A JSX attribute whose name is one of `names`, as a selector. */
const attributeNamed = (names) => `JSXAttribute[name.name=/^(${[...names].join("|")})$/]`;

/* ---------- colours outside style: SVG and chart attributes, and a module's colour lists ---------- */

/** The JSX attributes that take a colour on an SVG element or a recharts part. */
const COLOUR_ATTRIBUTES = new Set([
  "fill",
  "stroke",
  "color",
  "stopColor",
  "floodColor",
  "lightingColor",
]);
/** Recharts' props that take an object of an element's attributes, and the keys that colour it. */
const CHART_OBJECT_PROPS = new Set([
  "cursor",
  "activeBar",
  "activeDot",
  "dot",
  "tick",
  "label",
  "labelLine",
  "activeShape",
  "background",
]);
const CHART_COLOUR_KEYS = new Set(["fill", "stroke", "color"]);
/** Recharts' props that take a list of records, each of which may carry its own colour: a Pie's
    sectors paint from each record's `fill` (recharts 3; `Cell` is deprecated), and a Legend's
    payload from each entry's `color`. */
const CHART_RECORD_PROPS = new Set(["data", "payload"]);
/** Intrinsic elements whose colour attribute is no paint: `<link rel="mask-icon" color>` and a
    `<meta>`'s, which the browser's own chrome reads and no token can reach. */
const NO_COLOUR_ELEMENTS = new Set(["link", "meta"]);
/** A key that makes an object a style, which no-style-design-value judges instead. */
const STYLE_KEY = (key) =>
  key.startsWith("--") || COLOR_PROPS.test(key) || LENGTH_PROPS.test(key) || MARGIN_PROPS.test(key);

/**
 * The colours a top-level const holds when it is a list of colours (`const COLORS = ["#0088FE",
 * "#00C49F"]`, `const palette = { danger: "#e11d48" }`, either in `Object.freeze`): every string
 * written in its array or object, at any depth, is a literal colour, and one at least is a hex or a
 * colour function. A list of colour names alone is as often a list of token or tone names
 * (`["blue", "teal"]` keys the accent tokens), so it is judged where a colour attribute reads it.
 * A const typed as a style, an object with a style's keys (no-style-design-value's), a generated
 * module, and a list with anything else (a name, a call, a spread) are not colour lists.
 */
function colourListOf(context, declarator) {
  if (/[\\/]src[\\/]generated[\\/]/.test(context.filename ?? "")) return undefined;
  // A list is an array or an object literal (in Object.freeze too) that holds a hex or a colour
  // function at least, so most of a module's consts are read no further.
  let held = unwrapValue(declarator.init);
  // Object.freeze([…]) holds what it is handed.
  if (held?.type === "CallExpression" && globalMethod(context, held.callee, "Object", "freeze"))
    held = unwrapValue(held.arguments[0]);
  if (held?.type !== "ArrayExpression" && held?.type !== "ObjectExpression") return undefined;
  if (styleKind(declaredType(declarator))) return undefined;
  const colours = [];
  let written = false;
  let other = false;
  const visit = (node) => {
    const value = unwrapValue(node);
    if (!value || other) return;
    if (value.type === "ArrayExpression") {
      for (const element of value.elements) if (!other) visit(element);
    } else if (value.type === "ObjectExpression")
      for (const property of value.properties) {
        if (other) return;
        const key = keyName(property);
        if (property.type !== "Property" || (key !== null && STYLE_KEY(key))) other = true;
        else visit(property.value);
      }
    else if (
      (value.type === "Literal" && typeof value.value === "string") ||
      (value.type === "TemplateLiteral" && value.expressions.length === 0)
    ) {
      const text = value.type === "Literal" ? value.value : (value.quasis[0].value.cooked ?? "");
      // A colour written whole starts with # or a function's name, or is a colour's name.
      const trimmed = text.trim();
      const colour =
        trimmed.startsWith("#") || /^[a-z]+\(/i.test(trimmed) || isNamedColour(trimmed)
          ? literalColour(text)
          : null;
      if (colour && colour === trimmed) {
        colours.push(colour);
        if (!isNamedColour(colour)) written = true;
      } else other = true;
      // A number, a boolean or null beside the colours (an opacity, a flag) leaves them a list.
    } else if (value.type !== "Literal") other = true;
  };
  visit(held);
  return !other && written ? colours : undefined;
}

/** Each top-level const's colour list (colourListOf), or null, read once for both rules. */
const colourLists = new WeakMap();
function colourListAt(context, declarator) {
  if (!colourLists.has(declarator))
    colourLists.set(declarator, colourListOf(context, declarator) ?? null);
  return colourLists.get(declarator) ?? undefined;
}
/** Whether a literal is written in a module's colour list, which no-raw-colour reports once where
    it is written: the style that reads it is not reported for it again. */
function inColourList(context, leaf) {
  let declarator;
  for (let node = leaf.parent; node; node = node.parent)
    if (node.type === "VariableDeclarator") declarator = node;
  return (
    declarator !== undefined &&
    topLevel(declarator) &&
    colourListAt(context, declarator) !== undefined
  );
}

const propertyName = (property) =>
  property.type === "Property" && !property.computed
    ? (property.key.name ?? property.key.value)
    : undefined;

/* ---------- navigation from a button ---------- */

/** The router or location call a handler consists of, when that is all it does. */
function onlyNavigates(context, handler) {
  let node = unwrap(handler);
  const init = constInit(context, node);
  if (init) node = unwrap(init);
  if (node?.type !== "ArrowFunctionExpression" && node?.type !== "FunctionExpression") return false;
  let body = node.body;
  if (body.type === "BlockStatement") {
    if (body.body.length !== 1) return false;
    const [statement] = body.body;
    if (statement.type === "ExpressionStatement") body = statement.expression;
    else if (statement.type === "ReturnStatement") body = statement.argument;
    else return false;
  }
  body = unwrap(body);
  if (body?.type === "UnaryExpression" && body.operator === "void") body = unwrap(body.argument);
  if (body?.type === "AwaitExpression") body = unwrap(body.argument);
  if (body?.type === "CallExpression") {
    const callee = unwrap(body.callee);
    if (callee.type === "Identifier") return callee.name === "navigate";
    if (callee.type === "MemberExpression" && !callee.computed) {
      const name = callee.property.name;
      const object = context.sourceCode.getText(callee.object);
      return (
        name === "navigate" ||
        (["assign", "replace"].includes(name) && /(^|\.)location$/.test(object)) ||
        (name === "push" && /(^|\.)history$/.test(object))
      );
    }
    return false;
  }
  if (body?.type === "AssignmentExpression") {
    const target = context.sourceCode.getText(body.left);
    return /(^|\.)location(\.href)?$/.test(target);
  }
  return false;
}

/* ---------- the rules ---------- */

const STYLE_WHY = "style is for computed values (a measured size, a CSS variable).";
/** no-disabled-while-loading's flags when not even the first fits: one flag or several, in the
    element's message (mid-sentence) and the object's (its start). */
const FLAGS_NAMED = {
  element: ["a pending flag", "pending flags"],
  object: ["A pending flag", "Pending flags"],
};
const STYLE_TAIL = `Use a token utility or a primitive prop; ${STYLE_WHY}`;

export const gateRules = defineRules({
  "no-overlay-autofocus": {
    description:
      "No autoFocus inside overlay content: initialFocus on the content chooses the first field.",
    messages: {
      // `tag` is the element as written, `overlay` the overlay part it is inside, directly or
      // through a component of the file that part renders.
      // `tag` is fitted to the message limit (a long component name gives way to its last part).
      autoFocus:
        "<{{tag}} autoFocus> is inside {{overlay}}, where it races the overlay's own focus and can lose where focus returns on close. Give {{overlay}} initialFocus, a ref to this element, and finalFocus where the opener goes away.{{note}}",
      // `wrapper` is the component of this file that hands its children on to the overlay.
      forwarded:
        "<{{tag}} autoFocus> is inside <{{wrapper}}>, which forwards its children to <{{overlay}}>, where it races the overlay's own focus. Give {{overlay}} initialFocus, a ref to this element, and finalFocus where the opener goes away.{{note}}",
    },
    create(context) {
      // Each component of this file rendered inside an overlay, with that overlay's name.
      const insideRendered = new Map();
      // Which components of this file each component renders, so content two levels down counts.
      const renders = new Map();
      const pending = [];
      const report = (node, overlay, wrapper) => {
        const written = tag(node.parent.name);
        const messageId = wrapper ? "forwarded" : "autoFocus";
        const words = (name) =>
          render(gateRules["no-overlay-autofocus"].meta.messages[messageId], {
            tag: name,
            overlay,
            wrapper,
            note: "",
          });
        context.report({
          node,
          messageId,
          data: {
            tag: fitted([written, written.split(".").at(-1), "the element"], words),
            overlay,
            ...(wrapper ? { wrapper } : {}),
          },
        });
      };
      return {
        JSXAttribute(node) {
          if (node.name.name !== "autoFocus") return;
          const value = literal(node.value);
          if (value === false) return;
          const element = node.parent;
          const overlay = insideOverlay(context, element);
          if (overlay) {
            report(node, overlay);
            return;
          }
          // Among the children of a component of this file that hands them on to an overlay.
          const forwarded = forwardedOverlay(context, element);
          if (forwarded) {
            report(node, forwarded.overlay, forwarded.wrapper);
            return;
          }
          const components = componentsOf(node);
          if (components.length > 0) pending.push({ node, components });
        },
        JSXOpeningElement(node) {
          const name = tag(node.name);
          if (!/^[A-Z]/.test(name) || name.includes(".")) return;
          if (!insideRendered.has(name)) {
            const overlay =
              insideOverlay(context, node) || forwardedOverlay(context, node)?.overlay || "";
            if (overlay) insideRendered.set(name, overlay);
          }
          for (const owner of componentsOf(node)) {
            if (!renders.has(owner)) renders.set(owner, new Set());
            renders.get(owner).add(name);
          }
        },
        "Program:exit"() {
          // A component of this file rendered inside an overlay of this file is overlay content,
          // and so is every component of this file it renders in turn, inside the same overlay.
          const content = new Map(insideRendered);
          for (const [name, overlay] of content)
            for (const child of renders.get(name) ?? [])
              if (!content.has(child)) content.set(child, overlay);
          for (const { node, components } of pending) {
            const inside = components.find((name) => content.has(name));
            if (inside) report(node, content.get(inside));
          }
        },
      };
    },
  },
  "no-disabled-while-loading": {
    description: "A pending flag goes to isLoading only, never also to disabled.",
    // `flags` is what isLoading and disabled both read, as written, named once and fitted to the
    // message limit (past what fits, the first and how many more); `them` is "it" or "them", and
    // `is` "is" or "are".
    messages: {
      pending:
        "<{{tag}}> reads {{flags}} in isLoading and in disabled, so the pressed button goes disabled mid-save and drops focus to the page. isLoading alone blocks a repeat press and keeps focus: take {{them}} out of disabled, and give any other reason as disabledReason.{{note}}",
      // Props built as an object, for a button, an action or a helper.
      pendingObject:
        "{{flags}} {{is}} read by this object's isLoading and its disabled, so the button it sets up goes disabled mid-save and drops focus to the page. isLoading alone blocks a repeat press and keeps focus: take {{them}} out of disabled.{{note}}",
    },
    create(context) {
      const check = (loading, disabled, node, element) => {
        if (!loading || !disabled) return;
        const loads = references(context, loading);
        const shared = [...references(context, disabled)].filter((name) => loads.has(name));
        if (shared.length === 0) return;
        const messageId = element ? "pending" : "pendingObject";
        const them = shared.length > 1 ? "them" : "it";
        const named = element
          ? { tag: tag(node.name), them }
          : { them, is: shared.length > 1 ? "are" : "is" };
        const words = (flags) =>
          render(gateRules["no-disabled-while-loading"].meta.messages[messageId], {
            ...named,
            flags,
            note: "",
          });
        const flags = fitted(
          [
            shared.join(", "),
            ...(shared.length > 1 ? [`${shared[0]} and ${shared.length - 1} more`] : []),
            // The last resort, named by what it is, in the number the words agree with.
            FLAGS_NAMED[element ? "element" : "object"][shared.length > 1 ? 1 : 0],
          ],
          words,
        );
        context.report({ node, messageId, data: { ...named, flags } });
      };
      return {
        JSXOpeningElement(node) {
          const loading = attribute(node, "isLoading")?.value;
          const disabled = attribute(node, "disabled")?.value;
          // Any component that takes both is judged, a parameter's too; a parameter or a local that
          // shadows an outer name (the kit's Button) is not that name's part, and is left alone.
          if (!loading || !disabled || shadowsOuterName(context, node.name)) return;
          check(loading, disabled, node, true);
        },
        ObjectExpression(node) {
          const find = (name) =>
            node.properties.find((property) => propertyName(property) === name)?.value;
          check(find("isLoading"), find("disabled"), node, false);
        },
      };
    },
  },
  "overlay-width-preset": {
    description:
      "Dialog, Sheet, AlertDialog and Drawer content take their width from a preset, not style or a width class.",
    // `advice` is the step of the part's own map nearest the width, when the lint can read one,
    // else every step (advice.js's presetAdvice); `width` the width it read, as ` (480px)`.
    messages: {
      style: "{{part}} sets {{property}} in style{{width}}. {{advice}}{{note}}",
      className: '{{part}} sets its width with "{{cls}}"{{width}}. {{advice}}{{note}}',
      // `wrapper` is the component of this file that hands its style or className on to `part`.
      forwardedStyle:
        "<{{wrapper}}> forwards style to <{{part}}>, which then sets {{property}} in style{{width}}. {{advice}}{{note}}",
      forwardedClassName:
        '<{{wrapper}}> forwards className to <{{part}}>, which then sets its width with "{{cls}}"{{width}}. {{advice}}{{note}}',
    },
    create(context) {
      // A const style object shared by several overlays is reported once, where it is written.
      const reported = new WeakSet();
      /** The width's words and the advice for it: `{ width, advice }`. */
      const sized = (name, px) => ({
        width: px === undefined ? "" : ` (${Number(px.toFixed(2))}px)`,
        advice: presetAdvice(name, px),
      });
      return {
        JSXOpeningElement(node) {
          const name = kitName(context, node.name);
          /** The overlay a component of this file hands `prop` on to: `{ part, wrapper }`. */
          const through = (prop) => {
            const forwarded = forwardedTo(context, node, prop);
            const part = forwarded ? kitName(context, forwarded.element.name) : "";
            return SIZED_OVERLAY.test(part) ? { part, wrapper: forwarded.wrapper } : undefined;
          };
          const self = SIZED_OVERLAY.test(name) ? { part: name } : undefined;
          const style = attribute(node, "style");
          const styleTo = self ?? (style ? through("style") : undefined);
          // A className reaches a component of the file as an attribute or in a spread.
          const classTo =
            self ??
            (node.attributes.some(
              (item) => item.type === "JSXSpreadAttribute" || item.name.name === "className",
            )
              ? through("className")
              : undefined);
          if (!styleTo && !classTo) return;
          // Every object its style can be: a branch, a const, a map's entry, a spread, a style
          // callback's return, useMemo, a same-file helper's (values.styleObjects).
          for (const object of style && styleTo ? styleObjects(context, style.value) : [])
            for (const property of object.properties) {
              const key = keyName(property);
              if (!WIDTH_PROPS.has(key) || reported.has(property)) continue;
              const value = unwrap(property.value);
              if (value?.type === "Identifier" && value.name === "undefined") continue;
              if (partSize(context, value)) continue;
              reported.add(property);
              const px =
                value?.type === "Literal" && typeof value.value === "number"
                  ? value.value
                  : value?.type === "Literal" && typeof value.value === "string"
                    ? lengthPx(value.value)
                    : undefined;
              context.report({
                node: property,
                messageId: styleTo.wrapper ? "forwardedStyle" : "style",
                data: {
                  part: styleTo.part,
                  property: key,
                  ...(styleTo.wrapper ? { wrapper: styleTo.wrapper } : {}),
                  ...sized(styleTo.part, px),
                },
              });
            }
          if (!classTo) return;
          // Its className, through a const, a map, a helper or a spread too (class-sites.js).
          const sites = classSites(context).classSitesOf(node);
          const width = sites
            .flatMap((site) => site.strings.flatMap(({ text }) => text.split(/\s+/)))
            .find((cls) => WIDTH_CLASS.test(cls.split(":").at(-1).replace(/^!|!$/g, "")));
          if (width) {
            const base = classesOf(width)[0]?.base ?? width;
            context.report({
              node: sites[0].at,
              messageId: classTo.wrapper ? "forwardedClassName" : "className",
              data: {
                part: classTo.part,
                cls: width,
                ...(classTo.wrapper ? { wrapper: classTo.wrapper } : {}),
                ...sized(classTo.part, widthOfClass(base)),
              },
            });
          }
        },
      };
    },
  },
  "no-plain-alert-role": {
    description:
      'A form or page result is an Alert with an explicit role, never role="alert" on a plain element.',
    messages: {
      plainAlert:
        'role="alert" on a plain element. Use Alert with role="alert" for a form-level result, FieldError under the field it is about, or ErrorSummary for several issues.{{note}}',
    },
    create: (context) => ({
      JSXOpeningElement(node) {
        if (!/^[a-z]/.test(tag(node.name))) return;
        const role = attribute(node, "role");
        if (literal(role?.value) !== "alert") return;
        context.report({ node: role, messageId: "plainAlert" });
      },
    }),
  },
  "link-button-navigation": {
    description:
      "Navigation that looks like a button is LinkButton or LinkIconButton, not a Button that renders a link or navigates.",
    messages: {
      rendersLink:
        "{{part}} renders a link (<{{tag}}>). Use {{replacement}} with render={<{{tag}} … />}: Base UI's Button expects a native button, and a link must stay a link.{{note}}",
      navigates:
        "{{part}} navigates from onClick. Use {{replacement}} with the router Link in render, so the destination can be opened in a new tab, copied and announced as a link.{{note}}",
      // `wrapper` is the component of this file that hands render or onClick on to `part`.
      forwardedLink:
        "<{{wrapper}}> forwards render to <{{part}}>, which then renders a link (<{{tag}}>). Use {{replacement}} with render={<{{tag}} … />}: Base UI's Button expects a native button, and a link must stay a link.{{note}}",
      forwardedNavigates:
        "<{{wrapper}}> forwards onClick to <{{part}}>, which then navigates. Use {{replacement}} with the router Link in render, so the destination can be opened in a new tab, copied and announced as a link.{{note}}",
    },
    create: (context) => ({
      JSXOpeningElement(node) {
        const name = kitName(context, node.name);
        const isButton = (part) => part === "Button" || part === "IconButton";
        /** The Button a prop of this element reaches: its own, or the one a component of this
            file hands the prop on to, with that component's name. */
        const target = (prop) => {
          if (isButton(name)) return { part: name };
          if (!attribute(node, prop)) return undefined;
          const forwarded = forwardedTo(context, node, prop);
          const part = forwarded ? kitName(context, forwarded.element.name) : "";
          return isButton(part) ? { part, wrapper: forwarded.wrapper } : undefined;
        };
        const said = (to, own, forwarded) =>
          to.wrapper
            ? { messageId: forwarded, wrapper: to.wrapper }
            : { messageId: own, wrapper: undefined };
        const replacementOf = (part) => (part === "Button" ? "LinkButton" : "LinkIconButton");
        const renderTo = target("render");
        let rendered = renderTo && unwrap(attribute(node, "render")?.value);
        // A render function, `(props) => <Link {...props} />`, renders what it returns.
        if (
          rendered?.type === "ArrowFunctionExpression" ||
          rendered?.type === "FunctionExpression"
        ) {
          const body = rendered.body;
          rendered =
            body.type === "BlockStatement"
              ? unwrap(
                  body.body.find((statement) => statement.type === "ReturnStatement")?.argument,
                )
              : unwrap(body);
        }
        if (rendered?.type === "JSXElement") {
          const opening = rendered.openingElement;
          // The rendered element as the kit names it, or as written: a router Link is no kit part.
          const renderedName = displayNameOf(context, opening.name);
          if (
            renderedName === "a" ||
            /(^|\.)(Link|NavLink)$/.test(renderedName) ||
            attribute(opening, "href") ||
            attribute(opening, "to")
          ) {
            const { messageId, wrapper } = said(renderTo, "rendersLink", "forwardedLink");
            context.report({
              node: attribute(node, "render"),
              messageId,
              data: {
                part: renderTo.part,
                tag: renderedName,
                replacement: replacementOf(renderTo.part),
                ...(wrapper ? { wrapper } : {}),
              },
            });
            return;
          }
        }
        const onClick = attribute(node, "onClick");
        const clickTo = onClick && target("onClick");
        if (clickTo && onlyNavigates(context, onClick.value)) {
          const { messageId, wrapper } = said(clickTo, "navigates", "forwardedNavigates");
          context.report({
            node: onClick,
            messageId,
            data: {
              part: clickTo.part,
              replacement: replacementOf(clickTo.part),
              ...(wrapper ? { wrapper } : {}),
            },
          });
        }
      },
    }),
  },
  "no-style-design-value": {
    description:
      "Style carries computed values only: literal lengths, colours, weights and margins are tokens.",
    messages: {
      margin: `{{attribute}}.{{property}} is a margin. ${STYLE_TAIL}{{note}}`,
      fontWeight: `{{attribute}}.{{property}} is a literal font weight. ${STYLE_TAIL}{{note}}`,
      fontFamily: `{{attribute}}.{{property}} is a literal font family. ${STYLE_TAIL}{{note}}`,
      length: `{{attribute}}.{{property}} is a literal length ({{value}}{{from}}). ${STYLE_TAIL}{{token}}{{note}}`,
      // A padding or a gap at a space step exactly: `use` names its utility and prop (advice.js's
      // styleSpaceUse).
      spaceLength: `{{attribute}}.{{property}} is a literal length ({{value}}{{from}}). {{use}}; ${STYLE_WHY}{{note}}`,
      colour: `{{attribute}}.{{property}} is a literal colour ({{value}}{{from}}). ${STYLE_TAIL}{{token}}{{note}}`,
      customColour:
        '{{attribute}}["{{property}}"] is a literal colour ({{value}}{{from}}). A custom property carries a computed value or a token, token("color.…"), never a literal colour.{{note}}',
      customLength:
        '{{attribute}}["{{property}}"] is a literal length ({{value}}{{from}}). A custom property carries a computed value or a token, token("space.…"), never a literal length.{{note}}',
      partToken:
        "{{attribute}}.{{property}} reads {{token}}, the size {{part}} keeps for itself. Size {{part}} through its own props; any other element takes a token of its own role, in a token utility or a primitive prop.{{note}}",
      styleElement:
        "<style> writes CSS that no token rule reads. Use token utilities in className; a rule the kit needs belongs in its own stylesheets, on tokens.{{note}}",
    },
    create(context) {
      // A const style object used by several elements is reported once, where it is written.
      const reported = new WeakSet();
      // The kit's Dialog or Sheet preset map in this file, whose widths and heights are the
      // preset's steps.
      const preset = presetMapOf(context);
      const exempt = (node, key) =>
        preset !== undefined && PRESET_PROPS.test(key) && insideConst(node, preset);
      /** Where a style is written, as styleSpaceUse reads it: the kit's own source, a plain
          element use-primitives reads, or the layout primitive the style lands on (the element,
          its render, or the part a component of the file hands its style to, which need not be
          the one its className reaches); `wrapper` names that component. */
      const kit = isKitSourceFile(context);
      const whereOf = (element) => {
        if (!element) return { kit };
        const plain = element.name.type === "JSXIdentifier" && PLAIN_LAYOUT.test(element.name.name);
        if (plain) return { kit, plain };
        const owner = propOwnerOf(context, element, "style");
        return { kit, plain, part: owner.part, wrapper: owner.via === "wrapper" && owner.wrapper };
      };
      /** styleSpaceUse's words, placed on the part a component of the file hands the style to,
          whose props the component need not take, while the finding `data` keeps in its limit. */
      const spaceUse = (key, value, element, data) => {
        const where = whereOf(element);
        const use = styleSpaceUse(key, value, where);
        if (!use || !where.wrapper) return use;
        const placed = `For the <${where.part}> inside <${where.wrapper}>, ${use.charAt(0).toLowerCase()}${use.slice(1)}`;
        return fitted([placed, use], (words) =>
          render(gateRules["no-style-design-value"].meta.messages.spaceLength, {
            ...data,
            use: words,
            note: "",
          }),
        );
      };
      const judge = (entries, attribute, element) => {
        for (const { object, given } of entries)
          for (const property of object.properties) {
            const key = keyName(property);
            if (key === null || reported.has(property)) continue;
            // One read of the value: its literals, and the part tokens it reads (a call of
            // token() is what the walk cannot follow).
            const borrowed = [];
            const onUnreadable = ({ node }) => {
              const name = partTokenOf(context, node);
              if (name) borrowed.push(name);
            };
            const found = leaves(context, property.value, { named: true, given, onUnreadable });
            for (const leaf of found) {
              const name = partTokenOf(context, leaf);
              if (name) borrowed.push(name);
            }
            // A part's own size read by anything but that part.
            const token = borrowed.find((name) => !ownPartToken(context, name));
            if (token) {
              reported.add(property);
              context.report({
                node: property,
                messageId: "partToken",
                data: {
                  attribute,
                  property: key,
                  token,
                  part: PART_TOKENS[token]?.part ?? "its part",
                },
              });
              continue;
            }
            for (const leaf of found) {
              if (exempt(leaf, key) || inColourList(context, leaf)) continue;
              const problem = leafProblem(key, leaf, context.sourceCode);
              if (!problem) continue;
              reported.add(property);
              const data = {
                attribute,
                property: key,
                value: problem.value,
                from: fromClause(originOf(leaf, property.value)),
              };
              // The token of the property's role nearest a whole length, or the roles a colour's
              // hue plays for it (nearest.js), in the words that keep the message in its limit.
              const words = (token) =>
                render(gateRules["no-style-design-value"].meta.messages[problem.kind], {
                  ...data,
                  token,
                  note: "",
                });
              // A padding or a gap written as its whole value at a space step exactly names its
              // utility and prop; a part of a sum, or a const's, keeps its token.
              const use =
                problem.kind === "length" && problem.whole && unwrapValue(property.value) === leaf
                  ? spaceUse(key, problem.value, element, data)
                  : undefined;
              if (use) {
                context.report({
                  node: property,
                  messageId: "spaceLength",
                  data: { ...data, use },
                });
                break;
              }
              const token =
                problem.kind === "length" && problem.whole
                  ? styleLengthHint(key, problem.value, words)
                  : problem.kind === "colour"
                    ? styleColourHint(key, problem.value, words)
                    : "";
              context.report({
                node: property,
                messageId: problem.kind,
                data: { ...data, token },
              });
              break;
            }
          }
      };
      return {
        [attributeNamed(["style", ...RECHARTS_STYLES])](node) {
          const name = node.name.type === "JSXIdentifier" ? node.name.name : "";
          if (name === "style") judge(styleEntries(context, node.value), "style", node.parent);
          else if (RECHARTS_STYLES.has(name) && fromRecharts(context, node.parent.name))
            judge(styleEntries(context, node.value), name);
        },
        // `{...{ style: { … } }}`, or a props object of the file that carries a style.
        JSXSpreadAttribute(node) {
          // The props a component received (`{...props}`, `{...rest}`) are the caller's.
          const spread = unwrapValue(node.argument);
          if (
            spread?.type === "Identifier" &&
            variableOf(context, spread)?.defs[0]?.type === "Parameter"
          )
            return;
          for (const object of objectsOf(context, node.argument))
            for (const entry of entriesOf(context, object))
              if (entry.key === "style")
                judge(styleEntries(context, entry.value), "style", node.parent);
        },
        'JSXOpeningElement[name.name="style"]'(node) {
          if (node.name.type === "JSXIdentifier" && node.name.name === "style")
            context.report({ node, messageId: "styleElement" });
        },
        // A module's const typed as a style, or a map of styles, is judged where it is written,
        // whether or not this file renders it.
        [TYPED_DECLARATOR](node) {
          if (node.id.type !== "Identifier" || !node.init || !topLevel(node)) return;
          const kind = styleKind(declaredType(node));
          if (kind === "style") judge(styleEntries(context, node.init), "style");
          else if (kind === "map")
            for (const object of objectsOf(context, node.init))
              for (const entry of entriesOf(context, object))
                if (!entry.unknown) judge(styleEntries(context, entry.value), "style");
        },
      };
    },
  },
  "no-raw-colour": {
    description:
      "An SVG or chart colour is currentColor or a token, never a literal colour in a colour attribute, a chart part's props or a module's colour list.",
    messages: {
      attribute:
        '<{{tag}}> {{attribute}}="{{value}}" is a literal colour{{from}}. Write currentColor with a text or icon token class, or token("color.chart.…") in a chart.{{note}}',
      entry:
        '<{{tag}} {{attribute}}> {{key}} is a literal colour ({{value}}{{from}}). Write token("color.chart.…"), or give the Chart part its tone.{{note}}',
      list: '{{name}} holds literal colours ({{value}}). A chart series takes token("color.chart.…") or chartColor(); an icon takes currentColor.{{note}}',
    },
    create(context) {
      // An entry two parts read (a const data list) is reported once, where it is written.
      const reported = new WeakSet();
      /** The first literal colour a value can be, with where it is written, or undefined. */
      const rawColourOf = (value) => {
        // The strings a template's holes or a concatenation put in the value count too
        // (`"#f00" + alpha`).
        for (const leaf of leaves(context, value, { named: true })) {
          const parts = styleText(leaf, context.sourceCode);
          const colour = parts && literalColour(parts.read, parts.written);
          if (colour && !inColourList(context, leaf))
            return { colour, origin: originOf(leaf, value) };
        }
        return undefined;
      };
      /** Reports the colour keys of each object a recharts prop is given. */
      const entries = (objects, tag, attribute) => {
        for (const object of objects)
          for (const entry of entriesOf(context, object)) {
            if (entry.unknown || !CHART_COLOUR_KEYS.has(entry.key) || reported.has(entry.property))
              continue;
            const found = rawColourOf(entry.value);
            if (!found) continue;
            reported.add(entry.property);
            context.report({
              node: entry.property,
              messageId: "entry",
              data: {
                tag,
                attribute,
                key: entry.key,
                value: found.colour,
                from: fromClause(found.origin),
              },
            });
          }
      };
      /** The records a recharts `data` or `payload` list holds: each object it can be, or each
          object element of each list it can be. */
      const recordsOf = (value) => {
        const records = [];
        const { found } = valueWalker(context).containers(value);
        for (const container of found)
          if (container.type === "ObjectExpression") records.push(container);
          else if (container.type === "ArrayExpression")
            for (const element of container.elements)
              if (element && element.type !== "SpreadElement")
                records.push(...objectsOf(context, element));
        return records;
      };
      return {
        [attributeNamed([...COLOUR_ATTRIBUTES, ...CHART_OBJECT_PROPS, ...CHART_RECORD_PROPS])](
          node,
        ) {
          if (!node.value || node.name.type !== "JSXIdentifier") return;
          const attribute = node.name.name;
          const colour = COLOUR_ATTRIBUTES.has(attribute);
          if (!colour && !CHART_OBJECT_PROPS.has(attribute) && !CHART_RECORD_PROPS.has(attribute))
            return;
          const element = node.parent.name;
          const intrinsic =
            element.type === "JSXIdentifier" &&
            /^[a-z]/.test(element.name) &&
            !NO_COLOUR_ELEMENTS.has(element.name);
          const recharts = !intrinsic && fromRecharts(context, element);
          if (colour && (intrinsic || recharts)) {
            const found = rawColourOf(node.value);
            if (found)
              context.report({
                node,
                messageId: "attribute",
                data: {
                  tag: jsxTag(element),
                  attribute,
                  value: found.colour,
                  from: found.origin ? ` (${fromClause(found.origin).slice(2)})` : "",
                },
              });
          } else if (recharts && CHART_OBJECT_PROPS.has(attribute))
            entries(objectsOf(context, node.value), jsxTag(element), attribute);
          else if (recharts && CHART_RECORD_PROPS.has(attribute))
            entries(recordsOf(node.value), jsxTag(element), attribute);
        },
        [LIST_DECLARATOR](node) {
          if (node.id.type !== "Identifier" || !topLevel(node)) return;
          const colours = colourListAt(context, node);
          if (!colours) return;
          context.report({
            node,
            messageId: "list",
            data: {
              name: node.id.name,
              value:
                colours.length > 3
                  ? `${colours.slice(0, 3).join(", ")} and ${colours.length - 3} more`
                  : colours.join(", "),
            },
          });
        },
      };
    },
  },
});
