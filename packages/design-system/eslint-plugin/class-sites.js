// Where a class string enters a file, and what it reads as there: the one class reader every
// Ledger rule that judges classes shares. A site is a place the file hands classes to something:
//
//   attribute         className, class or any *ClassName attribute of a JSX element
//   slot-map          a classNames map (react-day-picker's), read by its values at every depth; a
//                     classNames string (react-transition-group's prefix) is no site
//   spread            a class-keyed entry of a readable object spread onto an element
//   key               a class-keyed entry of any object (a column's cellClassName)
//   helper            a class helper call no other site holds (cn, clsx, cva, tv …)
//   declaration       a module-level string that reads as classes, read where it is declared
//   declaration-map   a string of a module-level map or list whose strings mostly read as classes
//   assignment        a DOM element's className written in place (`el.className = "…"`, `+=`)
//   class-list        a DOM element's classList.add(…) arguments, and classList.toggle's first
//
// Each site is { node, origin, attribute, element, at, strings, unresolved, part, owner }: `strings`
// are the class strings that reach it ({ text, node }, reported at the string itself), `unresolved`
// what the reader could not read ({ node, reason }, values.js), `element` the JSX element it lands
// on, `at` the attribute or property that holds it, and `part` and `owner` which kit part that is
// (identity.js). Sites are computed once per file and settings signature, whichever rule asks first,
// and shared: a literal several sites reach is in each site's strings, and a rule that checks the
// vocabulary claims it once (index.js's forEachClass). Ported from @shadcn/lint's sites/collect.ts,
// with Ledger's className callbacks, config keys and module-level constants.
import path from "node:path";

import { classesOf, isKnown } from "./classes.js";
import { classOwnerOf, kitPartOf, kitSrcOf } from "./identity.js";
import { settings } from "./settings.js";
import {
  bindingOf,
  callbackOf,
  constInit,
  globalMethod,
  keyName,
  memberKey,
  objectsOf,
  returningFunction,
  returnsOf,
  unwrap,
  valueWalker,
  variableOf,
} from "./values.js";

/** Helpers whose arguments are classes, read clsx-style: an object's keys are classes. */
export const MERGE_FUNCTIONS = ["cn", "clsx", "cx", "twMerge", "twJoin", "classNames", "classes"];
/** Helpers whose config holds classes as values (cva, tv): variant names are not classes. */
export const VARIANT_FUNCTIONS = ["cva", "tv"];
/** Built-in names that count only where the file imports them: a same-file `cx` (a chart's centre),
    `tv` or `classNames` (a parameter) is something else. A name in the settings counts as written. */
const IMPORTED_ONLY = new Set(["cx", "twJoin", "classNames", "tv"]);
/** The keys that make an object a cva or tv config; tv's first argument is always one. */
const CONFIG_KEYS = new Set([
  "base",
  "slots",
  "variants",
  "compoundVariants",
  "compoundSlots",
  "defaultVariants",
  "responsiveVariants",
  "extend",
]);
/** Methods that hand on their receiver's strings: `[…].filter(Boolean).join(" ")`, `` `…`.trim() ``. */
const PASS_THROUGH = new Set([
  "join",
  "filter",
  "flat",
  "trim",
  "trimStart",
  "trimEnd",
  "toString",
  "valueOf",
]);
/** Attributes and object keys that hold classes: className, class, and any *ClassName. */
export const CLASS_KEY = /^(className|class|[a-z]\w*ClassName)$/;
/** A slot map (react-day-picker's `classNames`): the keys are slots and the values are classes. */
export const SLOT_MAP_KEY = /^([a-z]\w*)?classNames$/i;
/** How the reader reads a value: an object's keys as classes, its values, or a slot map's. */
const STYLES = ["class", "values", "slots"];

/** The helper modules a call is resolved through when it is imported under another name
    (`import { cn as merge }`) or read from a namespace (`u.cn`): each export's kind. */
const HELPER_MODULES = {
  "@ledger/design-system": { cn: "merge" },
  "@ledger/design-system/cn": { cn: "merge" },
  clsx: { default: "merge", clsx: "merge" },
  classnames: { default: "merge" },
  "tailwind-merge": { twMerge: "merge", twJoin: "merge" },
  "class-variance-authority": { cva: "cva", cx: "merge" },
  "tailwind-variants": { tv: "variant" },
};
/** In the kit's own source, its helper modules under src (package mode). */
const KIT_HELPER_MODULES = { "lib/cn": { cn: "merge" }, "lib/base-ui": { classes: "merge" } };
/** A relative source that can name one of them, before its path is resolved. */
const KIT_HELPER_FILE = /(^|\/)(cn|base-ui)(\.[cm]?[jt]sx?)?$/;

/* ---------- what reads as classes ---------- */

/** A class-list token: optional variants, then a lowercase utility (arbitrary values allowed). */
const UTILITY_TOKEN = /^[a-z0-9@*!\-[\](){}_.,:/&>=#%'"+~|]+$/;

/** Every word of the text is shaped like a class: lowercase, outside brackets. */
export const tokenShaped = (text) => {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return (
    tokens.length > 0 &&
    tokens.every(
      (token) => UTILITY_TOKEN.test(token) && !/[A-Z]/.test(token.replace(/\[[^\]]*\]/g, "")),
    )
  );
};

/** looksLikeClasses's answers by text: a module-level map asks it of every string it holds. */
const looks = new Map();
/** A string that is a class list: lowercase utilities, most of them ones the lint knows. */
export function looksLikeClasses(text) {
  let known = looks.get(text);
  if (known === undefined) {
    if (looks.size > 50000) looks.clear();
    looks.set(text, (known = readsAsClasses(text)));
  }
  return known;
}
function readsAsClasses(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens.some((t) => /[A-Z]|[^\x21-\x7e]/.test(t.split(":").at(-1))))
    return false;
  const known = classesOf(text).filter(({ base }) => isKnown(base)).length;
  return known >= Math.max(1, Math.ceil(tokens.length / 2));
}

/** A string a class map may hold as a class: one that reads as classes, or a word with a class's
    syntax (a dash, a variant, a bracket, a slash); a bare word no rule knows ("danger", "board",
    "none") is data. */
const classWord = (text) => looksLikeClasses(text) || /[-:[/]/.test(text);

/** A `class` key's string that is a class: one that reads as classes, or class-shaped with a
    variant or a bracket; OSCAL's "SP800-53" and "sp800-53a" are data. */
const classKeyValue = (text) => looksLikeClasses(text) || (tokenShaped(text) && /[:[]/.test(text));

const topLevel = (declaration) =>
  declaration.parent.type === "Program" ||
  (declaration.parent.type === "ExportNamedDeclaration" &&
    declaration.parent.parent.type === "Program");

/** The strings of a literal map or list (and of `[…].join(" ")`), as their nodes: a string, a
    template (its own text, around its holes), each branch of a condition or a fallback, what an
    `Object.freeze` holds, and the entries a same-file object or list spreads into it. `groups` gets
    each string that is a record's value (an object inside the map or list) under its key, so the
    values of one key across sibling records can be judged together. */
function stringLeaves(
  context,
  node,
  out = [],
  groups = new Map(),
  depth = 0,
  key = null,
  seen = new Set(),
) {
  const value = unwrap(node);
  if (!value || seen.has(value)) return out;
  const inner = (child, level = depth, under = key) =>
    stringLeaves(context, child, out, groups, level, under, seen);
  /** What a spread brings, as entries of this one: a literal, or a same-file const's object or
      list (under an `Object.freeze` too). Only its evidence counts: the const's own strings are
      read where it is declared. */
  const spread = (argument) => {
    let held = unwrap(argument);
    if (held?.type === "Identifier") {
      const definition = variableOf(context, held)?.defs[0];
      held =
        definition?.type === "Variable" &&
        definition.parent?.kind === "const" &&
        definition.node.id === definition.name
          ? unwrap(definition.node.init)
          : undefined;
    }
    if (held?.type === "CallExpression" && globalMethod(context, held.callee, "Object", "freeze"))
      held = unwrap(held.arguments[0]);
    if (held?.type === value.type) inner(held, depth, key);
  };
  if (
    (value.type === "Literal" && typeof value.value === "string") ||
    value.type === "TemplateLiteral"
  ) {
    out.push(value);
    if (key !== null) groups.set(key, [...(groups.get(key) ?? []), value]);
  } else if (value.type === "ObjectExpression") {
    seen.add(value);
    for (const property of value.properties)
      if (property.type === "Property")
        inner(property.value, depth + 1, depth > 0 ? keyName(property) : null);
      else if (property.type === "SpreadElement") spread(property.argument);
  } else if (value.type === "ArrayExpression") {
    seen.add(value);
    for (const element of value.elements)
      if (element?.type === "SpreadElement") spread(element.argument);
      else inner(element, depth + 1, null);
  } else if (value.type === "ConditionalExpression") {
    inner(value.consequent);
    inner(value.alternate);
  } else if (value.type === "LogicalExpression") {
    // `on && "…"` puts a condition on the left; `a || "…"` and `a ?? "…"` put a value there.
    if (value.operator !== "&&") inner(value.left);
    inner(value.right);
  } else if (isJoin(value)) inner(value.callee.object);
  else if (
    value.type === "CallExpression" &&
    globalMethod(context, value.callee, "Object", "freeze")
  )
    inner(value.arguments[0]);
  return out;
}

/** A string's text, or a template's own text around its holes: a word glued to a hole is built at
    runtime, so it is left out. */
const textOf = (node) => {
  if (node.type === "Literal") return node.value;
  const last = node.quasis.length - 1;
  return node.quasis
    .map((quasi, index) => {
      let text = quasi.value.cooked ?? "";
      if (index > 0 && !/^\s/.test(text)) text = text.replace(/^\S+/, "");
      if (index < last && !/\s$/.test(text)) text = text.replace(/\S+$/, "");
      return text;
    })
    .join(" ");
};
/** A string that is no evidence either way: nothing, or one bare word, which is also a CSS value,
    an attribute or a view name (`"flex"`, `"table"`, `"hidden"`). */
const noEvidence = (text) => /^\s*(?:[a-z]+)?\s*$/.test(text);
const isJoin = (call) =>
  call?.type === "CallExpression" &&
  unwrap(call.callee)?.type === "MemberExpression" &&
  memberKey(unwrap(call.callee)) === "join";

/**
 * The pieces a value glues into one string, in order, when it is a concatenation: the operands of
 * `a + b + …`; a string's `.concat(…)` (`"bg-".concat(tone)`); and a list literal's `.join(sep)`
 * with a separator that has no whitespace (`["bg-", tone].join("")`), its separator between each
 * element. Undefined for anything else: a list's `.concat()` and a spaced `.join(" ")` hand on
 * whole classes.
 */
export function gluedOperands(node) {
  const value = unwrap(node);
  const operands = [];
  const flatten = (operand) => {
    const inner = unwrap(operand);
    if (inner?.type === "BinaryExpression" && inner.operator === "+") {
      flatten(inner.left);
      flatten(inner.right);
    } else operands.push(inner);
  };
  if (value?.type === "BinaryExpression" && value.operator === "+") {
    flatten(value);
    return operands;
  }
  if (value?.type !== "CallExpression") return undefined;
  const callee = unwrap(value.callee);
  if (callee?.type !== "MemberExpression") return undefined;
  const method = memberKey(callee);
  const receiver = unwrap(callee.object);
  const text = (item) =>
    (item?.type === "Literal" && typeof item.value === "string") ||
    (item?.type === "TemplateLiteral" && !item.expressions.length);
  if (method === "concat" && (text(receiver) || receiver?.type === "TemplateLiteral")) {
    if (value.arguments.some((argument) => argument.type === "SpreadElement")) return undefined;
    return [receiver, ...value.arguments.map(unwrap)];
  }
  if (method !== "join" || receiver?.type !== "ArrayExpression") return undefined;
  const [separator] = value.arguments;
  const sep = unwrap(separator);
  if (
    separator &&
    !(
      text(sep) &&
      !/\s/.test(sep.type === "Literal" ? sep.value : (sep.quasis[0].value.cooked ?? ""))
    )
  )
    return undefined;
  if (receiver.elements.some((element) => !element || element.type === "SpreadElement"))
    return undefined;
  // `.join()` with no separator puts a comma between the elements.
  const between = sep ?? {
    type: "Literal",
    value: ",",
    raw: '","',
    range: value.range,
    loc: value.loc,
  };
  return receiver.elements.flatMap((element, index) =>
    index ? [between, unwrap(element)] : [unwrap(element)],
  );
}

/** `String.raw`, whose template is its text as written. */
const isStringRaw = (context, tag) =>
  tag.type === "MemberExpression" &&
  tag.object.type === "Identifier" &&
  tag.object.name === "String" &&
  memberKey(tag) === "raw" &&
  !variableOf(context, tag.object)?.defs.length;

/* ---------- the per-file reader ---------- */

const programs = new WeakMap();
/** Each settings object's signatures, outside the kit's source and in it. */
const signatures = new WeakMap();
/** The signature a file's sites depend on: the helper names and whether it is the kit's source. */
const signatureOf = (read, self) => {
  let both = signatures.get(read);
  if (!both) {
    const names = [[...read.classFunctions].sort(), [...read.variantFunctions].sort()];
    signatures.set(read, (both = [false, true].map((flag) => JSON.stringify([...names, flag]))));
  }
  return both[self ? 1 : 0];
};
/** The pattern each list of helper names is found by, built once. */
const helperPatterns = new Map();

/**
 * The class sites of the file `context` lints, computed once per file and settings signature and
 * shared by every rule that asks: `visitors(onSite)` gives a rule the listeners that hand it each
 * site, `sitesAt(node)` the sites a node holds, `classSitesOf(element)` the sites that give a JSX
 * element its className, and `hasSites` whether the file can hold any.
 */
export function classSites(context) {
  const program = context.sourceCode.ast;
  let byKey = programs.get(program);
  if (!byKey) programs.set(program, (byKey = new Map()));
  const read = settings(context);
  const self = context.settings?.ledger?.kit === "self";
  const key = signatureOf(read, self);
  let shared = byKey.get(key);
  if (!shared) byKey.set(key, (shared = createReader(context, read, self)));
  return shared;
}

/** The pattern a file names a helper by, one per list of names. */
function helperPattern(names) {
  const key = names.join("|");
  let pattern = helperPatterns.get(key);
  if (!pattern) helperPatterns.set(key, (pattern = new RegExp(`(?<![\\w$])(?:${key})(?![\\w$])`)));
  return pattern;
}

function createReader(context, { classFunctions, variantFunctions }, self) {
  const variantNames = new Set([...VARIANT_FUNCTIONS, ...variantFunctions]);
  const configured = new Set([...classFunctions, ...variantFunctions]);
  const mergeNames = new Set(
    [...MERGE_FUNCTIONS, ...classFunctions].filter((name) => !variantNames.has(name)),
  );
  const names = [...mergeNames, ...variantNames].map((name) => name.replace(/\$/g, "\\$"));
  const text = context.sourceCode.text;
  // A file whose text says "class" nowhere and names no helper holds no site but a module-level
  // string, so its class rules listen for declarations alone. A helper imported under another name
  // still names itself in its import.
  const hasSites =
    typeof text !== "string" || /class/i.test(text) || helperPattern(names).test(text);
  const kitSrc = self ? kitSrcOf(context) : undefined;
  // The token build's own output declares values, not classes.
  const generated = /[\\/]src[\\/]generated[\\/]/.test(context.filename ?? "");
  const dir = path.dirname(context.filename ?? "");
  /** Helper calls a site reads directly, which are no site of their own. */
  const consumed = new WeakSet();
  const cache = new WeakMap();

  /** A helper module's kind for an export, by source as written or, in the kit, by resolved path. */
  const moduleHelper = (source, imported) => {
    const known = Object.hasOwn(HELPER_MODULES, source) ? HELPER_MODULES[source] : undefined;
    if (known) return Object.hasOwn(known, imported) ? known[imported] : undefined;
    if (!kitSrc || !source.startsWith(".") || !KIT_HELPER_FILE.test(source)) return undefined;
    const inside = path
      .relative(kitSrc, path.resolve(dir, source))
      .replace(/\.[cm]?[jt]sx?$/, "")
      .split(path.sep)
      .join("/");
    const kit = Object.hasOwn(KIT_HELPER_MODULES, inside) ? KIT_HELPER_MODULES[inside] : undefined;
    return kit && Object.hasOwn(kit, imported) ? kit[imported] : undefined;
  };

  // The names the file imports from a helper module, read once: a local name for an export
  // (`import { cn as merge }`, `import clsx from "clsx"`) and a namespace (`import * as u`).
  const aliases = new Map();
  const namespaces = new Map();
  for (const statement of context.sourceCode.ast.body) {
    if (statement.type !== "ImportDeclaration" || statement.importKind === "type") continue;
    const source = String(statement.source.value);
    for (const specifier of statement.specifiers) {
      if (specifier.importKind === "type") continue;
      if (specifier.type === "ImportNamespaceSpecifier") {
        if (
          Object.hasOwn(HELPER_MODULES, source) ||
          moduleHelper(source, "cn") ||
          moduleHelper(source, "classes")
        )
          namespaces.set(specifier.local.name, source);
        continue;
      }
      const imported =
        specifier.type === "ImportDefaultSpecifier"
          ? "default"
          : (specifier.imported.name ?? String(specifier.imported.value));
      const kind = moduleHelper(source, imported);
      if (kind) aliases.set(specifier.local.name, kind);
    }
  }
  // The module-level consts that hold another name (`const merge = cn`), which may be a helper.
  const held = new Set();
  for (const statement of context.sourceCode.ast.body) {
    const declaration =
      statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
    if (declaration?.type !== "VariableDeclaration" || declaration.kind !== "const") continue;
    for (const { id, init } of declaration.declarations) {
      const value = unwrap(init);
      if (
        id.type === "Identifier" &&
        (value?.type === "Identifier" || value?.type === "MemberExpression")
      )
        held.add(id.name);
    }
  }
  /** Whether a name refers to the file's import of it, not a local that shadows it. */
  const imported = (identifier) =>
    variableOf(context, identifier)?.defs[0]?.type === "ImportBinding";

  /**
   * What a callee is as a class helper: "merge", "cva", "variant" (tv and the variant functions in
   * the settings) or undefined. A name is matched as written (cn, clsx, twMerge, cva, `classes`,
   * and the names in the settings; cx, twJoin, classNames and tv only where the file imports
   * them), and an import from a known helper module by the name it imports, so an alias and a
   * namespace member count too.
   */
  const helperKind = (callee, depth = 0) => {
    const node = unwrap(callee);
    if (node?.type === "Identifier") {
      if (aliases.has(node.name) && imported(node)) return aliases.get(node.name);
      if (IMPORTED_ONLY.has(node.name) && !configured.has(node.name) && !imported(node))
        return undefined;
      const kind =
        node.name === "cva"
          ? "cva"
          : variantNames.has(node.name)
            ? "variant"
            : mergeNames.has(node.name)
              ? "merge"
              : undefined;
      if (kind || depth > 3) return kind;
      // `const merge = cn`: a const that is never written and holds a helper is that helper.
      const value = unwrap(constInit(context, node));
      return value?.type === "Identifier" || value?.type === "MemberExpression"
        ? helperKind(value, depth + 1)
        : undefined;
    }
    if (node?.type === "MemberExpression") {
      const object = unwrap(node.object);
      const key = memberKey(node);
      if (object?.type !== "Identifier" || key === null || !namespaces.has(object.name))
        return undefined;
      return imported(object) ? moduleHelper(namespaces.get(object.name), key) : undefined;
    }
    return undefined;
  };

  const isVariant = (kind) => kind === "cva" || kind === "variant";

  /** The variant helper call a recipe is built by (`const recipe = cva(…)`), when a callee is one. */
  const recipeOf = (callee) => {
    const node = unwrap(callee);
    if (node?.type !== "Identifier") return undefined;
    const found = bindingOf(context, node);
    const init = found.init && !found.steps.length ? unwrap(found.init) : undefined;
    return init?.type === "CallExpression" && isVariant(helperKind(init.callee)) ? init : undefined;
  };

  /**
   * The strings a value gives, read from `root` in `style` ("class": an object's keys are classes,
   * clsx-style; "values": its values are), and what could not be read. With `readHoles` false, a
   * template gives its own text alone: a module-level template's holes are read where it is used.
   */
  function readClasses(root, style, readHoles = true) {
    const strings = [];
    const unresolved = [];
    const push = (text, node) => strings.push({ text, node });
    const say = (node, reason, extra) => {
      if (!unresolved.some((entry) => entry.node === node && entry.reason === reason))
        unresolved.push({ node, reason, ...extra });
    };
    const walk = valueWalker(context, { mode: "vocabulary" });
    // How many resolutions deep the reader is: a helper call read directly (at depth 0) belongs to
    // this site; one reached through a name, a member or a function is a site of its own.
    let hops = 0;
    const hop = (key, fn) =>
      walk.guard(key, () => {
        hops += 1;
        try {
          fn();
        } finally {
          hops -= 1;
        }
      });
    // While a same-file function's returns are read for a call, the walk binds each parameter to
    // what the call gives it (`note("text-danger")`; values.js's called and argumentOf): one the
    // call leaves out is its default, or undefined. `frame` names the call being read, since the
    // same node can give other strings under another call.
    let frame = 0;
    let frames = 0;
    /** Reads what `fn` returns for `call`, its parameters bound to the call's arguments. */
    const called = (fn, call, read) =>
      walk.called(fn, call, () => {
        if (!fn.params?.length || !call.arguments?.length) return read();
        const outer = frame;
        frame = ++frames;
        try {
          read();
        } finally {
          frame = outer;
        }
      });
    /** What the call a parameter's function is read for gives it (values.js's argumentOf). */
    const argumentOf = walk.argumentOf;
    /** Reads the argument a call gives a parameter, along `steps` past its own route. */
    const readArgument = (argument, steps, style) => {
      if (argument?.unknown) return say(argument.unknown, "spread");
      if (!argument?.node) return;
      hop(argument.node, () =>
        walk.project(
          argument.node,
          [...argument.steps, ...steps],
          (value) => visit(value, style),
          say,
        ),
      );
    };
    /** Whether a binding is the props object: a whole parameter, or the rest of a destructured one
        (`{ label, ...rest }`), whose className is the one the caller gave. */
    const propsObject = (found) => {
      if (!found.parameter || found.element) return false;
      if (found.parameter.whole) return true;
      const binding = found.variable?.defs[0]?.name;
      return (
        binding?.parent?.type === "RestElement" && binding.parent.parent?.type === "ObjectPattern"
      );
    };
    /** The key of the slot a never-written const destructures from the props object (`tone` in
        `const { tone } = props`), or undefined. */
    const propsSlot = (found) => {
      const [step] = found.steps ?? [];
      const init = unwrap(found.init);
      if (found.steps?.length !== 1 || !("key" in step) || init?.type !== "Identifier")
        return undefined;
      return propsObject(bindingOf(context, init)) ? step.key : undefined;
    };
    // What each node has been read as: a node two names share (a chain of consts that each name
    // the one below twice) is read once per style, call and depth, not once per route to it.
    const seen = new Map();

    /** Which sides of each hole glue it to the text beside it: the text has no whitespace there
        and the hole's value does not always bring its own (`flex${on ? " x" : ""}` is two whole
        classes). `texts` has one more entry than `holes`. */
    const sidesOf = (texts, holes) =>
      holes.map((hole, index) => ({
        before:
          Boolean(texts[index]) && !/\s$/.test(texts[index]) && !walk.separated(hole, "start"),
        after:
          Boolean(texts[index + 1]) &&
          !/^\s/.test(texts[index + 1]) &&
          !walk.separated(hole, "end"),
      }));

    /** A template's texts with holes between them: a hole glued to a word builds that word at
        runtime, so neither is read; one set apart by whitespace, its own or the text's, is read.
        `parts` has one more entry than `holes`. */
    const glue = (parts, holes, node, style) => {
      const sides = sidesOf(
        parts.map(({ text }) => text),
        holes,
      );
      parts.forEach(({ text, node: at }, index) => {
        let own = text;
        if (index > 0 && sides[index - 1].after) own = own.replace(/^\S+/, "");
        if (index < holes.length && sides[index].before) own = own.replace(/\S+$/, "");
        if (own.trim()) push(own, at);
      });
      if (!readHoles) return;
      holes.forEach((hole, index) => {
        if (!sides[index].before && !sides[index].after) visit(hole, style);
      });
      if (sides.some(({ before, after }) => before || after))
        say(node, "glued-template", { sides: new Map(holes.map((hole, i) => [hole, sides[i]])) });
    };

    /** `a + b + …`: the strings written in it are its texts and anything else a hole, read as a
        template is. A word that two adjacent strings glue together is read at the concatenation;
        every other word at its own string. */
    const concatenation = (node, style, operands = gluedOperands(node)) => {
      const runs = [[]];
      const holes = [];
      for (const operand of operands)
        if (
          (operand?.type === "Literal" && typeof operand.value === "string") ||
          (operand?.type === "TemplateLiteral" && !operand.expressions.length)
        )
          runs.at(-1).push({ text: textOf(operand), node: operand });
        else {
          holes.push(operand);
          runs.push([]);
        }
      const texts = runs.map((pieces) => pieces.map(({ text }) => text).join(""));
      const sides = sidesOf(texts, holes);
      // Words two adjacent strings glue together, from every run: one string at the concatenation.
      const crossing = [];
      runs.forEach((pieces, index) => {
        const text = texts[index];
        const words = [...text.matchAll(/\S+/g)].map((match) => ({
          word: match[0],
          from: match.index,
          to: match.index + match[0].length,
        }));
        // A word glued to a hole is built at runtime; it is the hole's, not a class.
        if (index > 0 && sides[index - 1].after) words.shift();
        if (index < holes.length && sides[index].before) words.pop();
        let offset = 0;
        const spans = pieces.map((piece) => {
          const span = { piece, from: offset, to: offset + piece.text.length, words: [] };
          offset = span.to;
          return span;
        });
        for (const { word, from, to } of words) {
          const span = spans.find((candidate) => from >= candidate.from && to <= candidate.to);
          if (span) span.words.push(word);
          else crossing.push(word);
        }
        for (const span of spans)
          if (span.words.length) push(span.words.join(" "), span.piece.node);
      });
      if (crossing.length) push(crossing.join(" "), node);
      holes.forEach((hole, index) => {
        if (!sides[index].before && !sides[index].after) visit(hole, style);
      });
      if (sides.some(({ before, after }) => before || after))
        say(node, "glued-template", { sides: new Map(holes.map((hole, i) => [hole, sides[i]])) });
    };

    /** Whether a callee is the received className itself, a Base UI className callback: a
        className (or *ClassName) parameter, a slot destructured from the props object under that
        key, or that key of the props object. */
    const forwardedCallback = (callee) => {
      if (callee?.type === "Identifier") {
        const found = bindingOf(context, callee);
        if (found.parameter && !found.element)
          return CLASS_KEY.test(found.parameter.key ?? callee.name);
        const slot = propsSlot(found);
        return slot !== undefined && CLASS_KEY.test(slot);
      }
      if (callee?.type !== "MemberExpression") return false;
      const object = unwrap(callee.object);
      const key = memberKey(callee);
      return (
        object?.type === "Identifier" &&
        key !== null &&
        CLASS_KEY.test(key) &&
        propsObject(bindingOf(context, object))
      );
    };

    /** A name at a class site: a parameter is a prop (the received className is opaque by
        contract, and the defaults written for it are read), or, in a same-file function read for
        a call, what that call gave it; a function is a className callback, and any other binding,
        an array method's callback parameter included, is followed to its value. */
    const identifier = (id, style, steps = []) => {
      const found = bindingOf(context, id);
      if (found.parameter && !found.element) {
        const { key, fallback, defaults } = found.parameter;
        // In a same-file function read for a call, the parameter is what the call gave it.
        const argument = argumentOf(found);
        readArgument(argument, steps, style);
        if (fallback)
          hop(found.variable, () =>
            walk.project(fallback, steps, (value) => visit(value, style), say),
          );
        for (const outer of defaults)
          hop(outer.node, () =>
            walk.project(
              outer.node,
              [...outer.steps, ...steps],
              (value) => visit(value, style),
              say,
            ),
          );
        if (key !== null && CLASS_KEY.test(key)) return;
        // Outside a call of its function a parameter is a prop: a default is one value it takes,
        // and a caller gives it any other. In a call, one the call leaves out is its default, or
        // undefined when it has none.
        if (!argument) say(id, "prop");
        return;
      }
      if (found.fn) {
        // A function as a className is a className callback, whose returns are its classes.
        if (!found.fn.body) return say(id, "expression");
        return hop(found.fn, () => returnsOf(found.fn).forEach((value) => visit(value, style)));
      }
      // A slot destructured from the props object (`const { tone } = props`) is that prop, and a
      // className the caller's; the default written for it is read.
      const slot = propsSlot(found);
      if (slot) {
        // In a same-file function read for a call, the props object is what the call gave it;
        // the default written for the props object is read too.
        const props = bindingOf(context, unwrap(found.init));
        const argument = argumentOf(props);
        readArgument(argument, [{ key: slot }, ...steps], style);
        const objectDefault = props.parameter?.objectDefault;
        if (objectDefault)
          for (const defaults of objectsOf(context, objectDefault))
            for (const entry of walk.entriesOf(defaults))
              if (entry.key === slot)
                hop(entry.value, () =>
                  walk.project(entry.value, steps, (value) => visit(value, style), say),
                );
        if (found.fallback)
          hop(found.fallback, () =>
            walk.project(found.fallback, steps, (value) => visit(value, style), say),
          );
        if (!CLASS_KEY.test(slot) && !argument) say(id, "prop");
        return;
      }
      hops += 1;
      try {
        walk.name(id, steps, (value) => visit(value, style), say);
      } finally {
        hops -= 1;
      }
    };

    /** A member at a class site: the received className on the props object (the whole
        parameter, or the rest of a destructured one) is opaque, and a props default written here
        is read, and so is the entry a call gave the object; any other member is an entry of a
        same-file map. */
    const member = (node, style) => {
      const key = memberKey(node);
      const object = unwrap(node.object);
      if (object?.type === "Identifier") {
        const found = bindingOf(context, object);
        if (propsObject(found)) {
          const { objectDefault } = found.parameter;
          const argument = key !== null ? argumentOf(found) : undefined;
          readArgument(argument, [{ key }], style);
          if (objectDefault && key !== null)
            for (const defaults of objectsOf(context, objectDefault))
              for (const entry of walk.entriesOf(defaults))
                if (entry.key === key) hop(entry.value, () => visit(entry.value, style));
          if (key !== null && CLASS_KEY.test(key)) return;
          if (!argument) say(node, "prop");
          return;
        }
      }
      for (const value of walk.values(node, say)) hop(value, () => visit(value, style));
    };

    /** A call at a class site: a class helper, a method that hands on its receiver
        (`[…].filter(Boolean).join(" ")`, `.trim()`, `.concat(…)`), a list's `.map(…)`,
        `Object.values(map)`, `Object.freeze(x)`, or a same-file function, whose parameters read
        the call's arguments. */
    const call = (node, style) => {
      const kind = helperKind(node.callee);
      if (kind) {
        if (hops === 0 && node !== root) consumed.add(node);
        if (kind === "merge") for (const argument of node.arguments) visit(argument, "class");
        else {
          variantConfig(node.arguments[0], true, kind);
          variantConfig(node.arguments[1], false, kind);
        }
        return;
      }
      const callee = unwrap(node.callee);
      // Strings glued into one class at runtime (`["bg-", tone].join("")`, `"bg-".concat(tone)`)
      // are a concatenation, read as `+` is.
      const glued = gluedOperands(node);
      if (glued) return concatenation(node, style, glued);
      if (callee?.type === "MemberExpression") {
        const method = memberKey(callee);
        if (PASS_THROUGH.has(method)) return visit(callee.object, style);
        if (method === "concat") {
          visit(callee.object, style);
          for (const argument of node.arguments) visit(argument, style);
          return;
        }
        const mapper = unwrap(node.arguments[0]);
        if (
          (method === "map" || method === "flatMap") &&
          (mapper?.type === "ArrowFunctionExpression" || mapper?.type === "FunctionExpression")
        )
          return hop(mapper, () => returnsOf(mapper).forEach((value) => visit(value, style)));
        if (globalMethod(context, callee, "Object", "freeze"))
          return visit(node.arguments[0], style);
        if (
          globalMethod(context, callee, "Object", "values") ||
          globalMethod(context, callee, "Object", "entries")
        ) {
          const { found, reasons } = walk.containers(node.arguments[0]);
          for (const { node: at, reason } of reasons) say(at, reason);
          for (const object of found)
            if (object.type === "ObjectExpression")
              for (const entry of walk.entriesOf(object)) {
                // Every value, a computed key's too (`{ [Tone.Danger]: "…" }`).
                const value = entry.reason === "computed-key" ? entry.unknown.value : entry.value;
                if (value) hop(value, () => visit(value, style));
                else say(entry.unknown, entry.reason);
              }
          return;
        }
      }
      // A useCallback's function, which is the value it gives: a className callback memoised.
      const callback = callbackOf(context, node);
      if (callback) return visit(callback, style);
      // A same-file function, a function called where it is written, or a useMemo factory: what
      // it returns.
      const fn = returningFunction(context, node);
      if (fn)
        return hop(fn, () =>
          called(fn, node, () => returnsOf(fn).forEach((value) => visit(value, style))),
        );
      // A recipe's classes land where it is called; its own call stays the site that owns them.
      const recipe = recipeOf(callee);
      if (recipe) return hop(recipe, () => visit(recipe, style));
      // A received className that is a Base UI callback, forwarded with the state
      // (`typeof className === "function" ? className(state) : className`), is the caller's.
      if (forwardedCallback(callee)) return;
      say(node, walk.callReason(node));
    };

    /** A cva or tv config: base, slots, class, className and variants hold classes as values;
        defaultVariants, responsiveVariants, extend and compound selectors are names. cva's first
        argument is its base, unless it is a config itself ({ base }); tv's first argument, and a
        variant function's from the settings, is always a config, whose keys are never classes. */
    const variantConfig = (node, first, kind) => {
      const value = unwrap(node);
      if (!value) return;
      const configs =
        value.type === "ObjectExpression"
          ? [value]
          : value.type === "Identifier" || value.type === "MemberExpression"
            ? objectsOf(context, value)
            : [];
      if (!configs.length) return first ? visit(value, "class") : undefined;
      for (const config of configs) {
        const keys = config.properties.map(keyName);
        if (first && kind === "cva" && !keys.some((key) => CONFIG_KEYS.has(key))) {
          visit(config, "class");
          continue;
        }
        for (const property of config.properties) {
          if (property.type !== "Property") {
            say(property, "spread");
            continue;
          }
          const key = keyName(property);
          if (["base", "slots", "class", "className", "variants"].includes(key))
            visit(property.value, "values");
          else if (key === "compoundVariants" || key === "compoundSlots") {
            const list = unwrap(property.value);
            for (const entry of list?.type === "ArrayExpression" ? list.elements : []) {
              const compound = unwrap(entry);
              if (compound?.type !== "ObjectExpression") continue;
              for (const inner of compound.properties)
                if (["class", "className"].includes(keyName(inner))) visit(inner.value, "values");
            }
          }
        }
      }
    };

    /** A slot map's value: each object it can be is read by its values at every depth; a string
        (react-transition-group's classNames prefix) is no class. */
    const slots = (node) => {
      const { found, reasons } = walk.containers(node);
      for (const { node: at, reason } of reasons) say(at, reason);
      for (const object of found) if (object.type === "ObjectExpression") visit(object, "values");
    };

    function visit(node, style) {
      const value = unwrap(node);
      if (!value) return;
      // One number per style, call and depth; most nodes are read once, so one mark, not a set.
      const mark = (frame * 3 + STYLES.indexOf(style)) * 2 + (hops === 0 ? 0 : 1);
      const marks = seen.get(value);
      if (marks === undefined) seen.set(value, mark);
      else if (marks === mark) return;
      else if (typeof marks === "number") seen.set(value, new Set([marks, mark]));
      else if (marks.has(mark)) return;
      else marks.add(mark);
      if (style === "slots") return slots(value);
      switch (value.type) {
        case "Literal":
          if (typeof value.value === "string") push(value.value, value);
          return;
        case "TemplateLiteral":
          return glue(
            value.quasis.map((quasi) => ({ text: quasi.value.cooked ?? "", node: quasi })),
            value.expressions,
            value,
            style,
          );
        case "TaggedTemplateExpression":
          if (isStringRaw(context, value.tag))
            return glue(
              value.quasi.quasis.map((quasi) => ({ text: quasi.value.raw, node: quasi })),
              value.quasi.expressions,
              value,
              style,
            );
          return say(value, "tagged-template");
        case "BinaryExpression":
          if (value.operator === "+") return concatenation(value, style);
          return say(value, "expression");
        case "ConditionalExpression":
          visit(value.consequent, style);
          visit(value.alternate, style);
          return;
        case "LogicalExpression":
          // `open && "…"` puts a condition on the left; `a || "…"` and `a ?? "…"` put a class there.
          if (value.operator !== "&&") visit(value.left, style);
          visit(value.right, style);
          return;
        case "ArrayExpression":
          for (const element of value.elements)
            visit(element?.type === "SpreadElement" ? element.argument : element, style);
          return;
        case "ObjectExpression":
          for (const entry of walk.entriesOf(value)) {
            // A key only known at runtime (`{ [active]: on }`) is a class in a clsx-style object,
            // read as any class value is; in a map, its value is read whatever the key.
            if (entry.reason === "computed-key")
              visit(style === "values" ? entry.unknown.value : entry.unknown.key, style);
            else if (entry.unknown) say(entry.unknown, entry.reason);
            else if (style === "values") visit(entry.value, "values");
            // { "bg-danger": on }: in a clsx-style object the key is the class; a number is not.
            else if (
              entry.property.key.type !== "Literal" ||
              typeof entry.property.key.value === "string"
            )
              push(entry.key, entry.property.key);
          }
          return;
        case "CallExpression":
          return call(value, style);
        case "NewExpression":
          if (value.callee.type === "Identifier" && value.callee.name === "Set")
            value.arguments.forEach((argument) => visit(argument, style));
          else say(value, "call");
          return;
        case "Identifier":
          return identifier(value, style);
        case "MemberExpression":
          return member(value, style);
        case "ArrowFunctionExpression":
        case "FunctionExpression":
          // A Base UI className callback: `(state) => (state.open ? "…" : "…")`.
          return returnsOf(value).forEach((returned) => visit(returned, style));
        case "SequenceExpression":
          return visit(value.expressions.at(-1), style);
        case "SpreadElement":
          // `cn(...extra)`, `[…].concat(...more)`: the list's strings.
          return visit(value.argument, style);
        default:
          return say(value, "expression");
      }
    }

    visit(root, style);
    return { strings, unresolved };
  }

  /* ---------- sites ---------- */

  /** A site: what reaches it, where it is and, for one on an element, which kit part owns it. */
  const site = (
    value,
    origin,
    { attribute = null, element = null, at },
    style = "class",
    readHoles = true,
  ) => {
    const { strings, unresolved } = readClasses(value, style, readHoles);
    let part;
    let owner;
    return {
      node: value,
      origin,
      attribute,
      element,
      at,
      strings,
      unresolved,
      /** The kit part the element is (identity.js's kitPartOf), or "". */
      get part() {
        return (part ??= element ? kitPartOf(context, element.name) : "");
      },
      /** The part the classes land on, through a render prop too (identity.js's classOwnerOf). */
      get owner() {
        return (owner ??= element
          ? classOwnerOf(context, element)
          : { part: "", via: "self", wrapper: "" });
      },
    };
  };

  /** No site: most nodes of a listened type, which are not remembered. */
  const NONE = Object.freeze([]);
  const remember = (node, compute) => {
    let list = cache.get(node);
    if (!list) cache.set(node, (list = compute()));
    return list;
  };

  /** A slot map holds objects: a classNames string is react-transition-group's prefix, no class. */
  const slotMap = (value) => objectsOf(context, value).length > 0;

  const attributeSites = (attribute) => {
    if (attribute.name.type !== "JSXIdentifier") return NONE;
    const name = attribute.name.name;
    if (!CLASS_KEY.test(name) && !SLOT_MAP_KEY.test(name)) return NONE;
    return remember(attribute, () => {
      const where = { attribute: name, element: attribute.parent, at: attribute };
      if (CLASS_KEY.test(name)) return [site(attribute.value, "attribute", where)];
      if (SLOT_MAP_KEY.test(name) && slotMap(attribute.value))
        return [site(attribute.value, "slot-map", where, "slots")];
      return [];
    });
  };

  /** The class-keyed entries of a readable object spread onto an element, each a site; a spread the
      reader cannot read is left alone. */
  const spreadSites = (spread) =>
    remember(spread, () => {
      const list = [];
      const walk = valueWalker(context, { mode: "vocabulary" });
      for (const object of objectsOf(context, spread.argument)) {
        const last = new Map();
        for (const entry of walk.entriesOf(object))
          if (
            !entry.unknown &&
            (CLASS_KEY.test(entry.key) || (SLOT_MAP_KEY.test(entry.key) && slotMap(entry.value)))
          )
            last.set(entry.key, entry.value);
        for (const [attribute, value] of last)
          list.push(
            site(
              value,
              "spread",
              { attribute, element: spread.parent, at: spread },
              SLOT_MAP_KEY.test(attribute) ? "slots" : "class",
            ),
          );
      }
      return list;
    });

  const keySites = (property) => {
    if (property.parent?.type !== "ObjectExpression") return NONE;
    const key = keyName(property);
    if (key === null || (!CLASS_KEY.test(key) && !SLOT_MAP_KEY.test(key))) return NONE;
    return remember(property, () => {
      if (CLASS_KEY.test(key)) {
        // `class` on a data object (an OSCAL part's "SP800-53" or "sp800-53a") is data, not a class.
        const value = unwrap(property.value);
        if (
          key === "class" &&
          value?.type === "Literal" &&
          typeof value.value === "string" &&
          !classKeyValue(value.value)
        )
          return [];
        return [site(property.value, "key", { attribute: key, at: property })];
      }
      if (SLOT_MAP_KEY.test(key) && slotMap(property.value))
        return [site(property.value, "slot-map", { attribute: key, at: property }, "slots")];
      return [];
    });
  };

  /** Whether a callee can be a helper at all: a name the file could call one by (a module-level
      const that holds one too), or a member of a helper module's namespace. Every other call is
      no site, and is not remembered. A helper held by a const inside a function is read where a
      class site calls it. */
  const mayBeHelper = (callee) => {
    const node = unwrap(callee);
    if (node?.type === "Identifier")
      return (
        aliases.has(node.name) ||
        mergeNames.has(node.name) ||
        variantNames.has(node.name) ||
        held.has(node.name)
      );
    const object = node?.type === "MemberExpression" ? unwrap(node.object) : undefined;
    return object?.type === "Identifier" && namespaces.has(object.name);
  };
  /** `el.classList.add(…)` or `.toggle(…)`: the method, when a call is one. */
  const classListMethod = (callee) => {
    const node = unwrap(callee);
    if (node?.type !== "MemberExpression") return undefined;
    const method = memberKey(node);
    if (method !== "add" && method !== "toggle") return undefined;
    const list = unwrap(node.object);
    return list?.type === "MemberExpression" && memberKey(list) === "classList"
      ? method
      : undefined;
  };
  const callSites = (node) => {
    const method = classListMethod(node.callee);
    if (method)
      // Each class add() is given, and the one toggle() turns on or off (its second argument is
      // the switch).
      return remember(node, () =>
        (method === "add" ? node.arguments : node.arguments.slice(0, 1)).map((argument) =>
          site(argument, "class-list", { attribute: "classList", at: node }),
        ),
      );
    return mayBeHelper(node.callee)
      ? remember(node, () =>
          !consumed.has(node) && helperKind(node.callee)
            ? [site(node, "helper", { at: node })]
            : [],
        )
      : NONE;
  };

  /** `el.className = "…"`, or `+=` with the classes it appends: a DOM element's classes, written in
      place. A `class` member is data (an OSCAL part's). */
  const assignmentSites = (node) => {
    if (node.operator !== "=" && node.operator !== "+=") return NONE;
    const left = unwrap(node.left);
    const key = left?.type === "MemberExpression" ? memberKey(left) : null;
    if (key === null || key === "class" || !CLASS_KEY.test(key)) return NONE;
    return remember(node, () => [site(node.right, "assignment", { attribute: key, at: node })]);
  };

  /** What a module-level const holds, for its strings: `Object.freeze(x)` is x, and the pairs of
      `Object.fromEntries([…])` or `new Map([…])` are their values (a pair's key is a name). */
  const heldValue = (init) => {
    if (init?.type === "CallExpression" && globalMethod(context, init.callee, "Object", "freeze"))
      return heldValue(unwrap(init.arguments[0]));
    const pairs =
      (init?.type === "CallExpression" &&
        globalMethod(context, init.callee, "Object", "fromEntries")) ||
      (init?.type === "NewExpression" &&
        init.callee.type === "Identifier" &&
        init.callee.name === "Map" &&
        !variableOf(context, init.callee)?.defs.length)
        ? unwrap(init.arguments[0])
        : undefined;
    if (pairs?.type !== "ArrayExpression") return init;
    return {
      type: "ArrayExpression",
      elements: pairs.elements.map((pair) => {
        const entry = unwrap(pair);
        return entry?.type === "ArrayExpression" ? entry.elements[1] : null;
      }),
    };
  };

  /** A module-level string that reads as classes is read where it is declared, since the file that
      uses it may be another one; so is each string of a module-level map or list whose strings
      mostly read as classes, except its data: a bare word no rule knows (a tone, a view, "none"),
      and every value of a key fewer than half of whose values across sibling records read as
      classes (a record's tone or label). A bare word is no evidence either way ("flex" is also a
      CSS value, "hidden" an attribute), so a map of them and their like is none. A template is
      read by its own text; its holes are read where it is used. */
  const declarationSites = (declarator) => {
    const declaration = declarator.parent;
    if (generated || declaration.kind !== "const" || !declarator.init || !topLevel(declaration))
      return NONE;
    return remember(declarator, () => {
      const init = heldValue(unwrap(declarator.init));
      if (init.type === "CallExpression" && !isJoin(init)) return [];
      const groups = new Map();
      const strings = stringLeaves(context, init, [], groups);
      if (!strings.length) return [];
      const at = (node) => site(node, "declaration-map", { at: declarator }, "class", false);
      if (strings.length === 1 && strings[0] === init)
        return looksLikeClasses(textOf(init))
          ? [site(init, "declaration", { at: declarator }, "class", false)]
          : [];
      const classy = (list) => list.filter((node) => looksLikeClasses(textOf(node))).length;
      // Most of its strings that are evidence read as classes, or it is no class map: stop once
      // they cannot, even were every string left evidence that reads as classes.
      let evidence = 0;
      let count = 0;
      for (let index = 0; index < strings.length; index++) {
        const text = textOf(strings[index]);
        if (noEvidence(text)) continue;
        evidence += 1;
        if (looksLikeClasses(text)) count += 1;
        else {
          const left = strings.length - index - 1;
          if ((count + left) / (evidence + left) < 0.6) return [];
        }
      }
      if (!evidence || count / evidence < 0.6) return [];
      // A key whose values across sibling records are mostly not classes holds data.
      const data = new Set();
      for (const members of groups.values())
        if (members.length > 1 && classy(members) * 2 < members.length)
          members.forEach((node) => data.add(node));
      return strings
        .filter((node) => !data.has(node) && tokenShaped(textOf(node)) && classWord(textOf(node)))
        .map(at);
    });
  };

  /** Whether a spread sets `key` whatever it is: every object it can be has the key, and the
      reader can read all of it. */
  const setsAlways = (argument, key) => {
    const walk = valueWalker(context, { mode: "vocabulary" });
    const { found, reasons } = walk.containers(argument);
    return (
      !reasons.length &&
      found.length > 0 &&
      found.every(
        (object) =>
          object.type === "ObjectExpression" &&
          walk.entriesOf(object).some((entry) => entry.key === key),
      )
    );
  };

  const sitesAt = (node) => {
    switch (node?.type) {
      case "JSXAttribute":
        return attributeSites(node);
      case "JSXSpreadAttribute":
        return spreadSites(node);
      case "Property":
        return keySites(node);
      case "CallExpression":
        return callSites(node);
      case "VariableDeclarator":
        return declarationSites(node);
      case "AssignmentExpression":
        return assignmentSites(node);
      default:
        return [];
    }
  };

  // The node types a site can be, in a file that can hold them; else module-level strings alone.
  const listened = hasSites
    ? [
        "JSXAttribute",
        "JSXSpreadAttribute",
        "Property",
        "CallExpression",
        "VariableDeclarator",
        "AssignmentExpression",
      ]
    : ["VariableDeclarator"];
  const types = new Set(listened);
  // The first rule that asks for every site records them as the traversal meets them, and each
  // rule after it replays that record when the traversal ends: one rule reads each node, however
  // many judge its classes. A record no traversal finished (its rule never listened) is made by a
  // walk of the tree in the traversal's order.
  let recording = false;
  let recorded;
  const walk = () => {
    const out = [];
    const keys = context.sourceCode.visitorKeys;
    const visit = (node) => {
      if (types.has(node.type)) out.push(...sitesAt(node));
      for (const key of keys[node.type] ?? []) {
        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) if (item && typeof item.type === "string") visit(item);
        } else if (child && typeof child.type === "string") visit(child);
      }
    };
    visit(context.sourceCode.ast);
    return out;
  };

  return {
    hasSites,
    sitesAt,
    /** The sites that give a JSX element its `attribute` (className by default), in source order:
        those that can win, since JSX keeps the last one written. The attribute hides every spread
        before it, and so does a spread that sets it whatever it is. */
    classSitesOf(opening, attribute = "className") {
      const out = [];
      for (const item of [...opening.attributes].reverse()) {
        if (item.type === "JSXSpreadAttribute") {
          out.unshift(...spreadSites(item).filter((found) => found.attribute === attribute));
          if (setsAlways(item.argument, attribute)) break;
        } else if (item.name.type === "JSXIdentifier" && item.name.name === attribute) {
          out.unshift(...attributeSites(item));
          break;
        }
      }
      return out;
    },
    /** Listeners that hand `onSite` every site of the file once. The first rule to ask reads the
        sites as the traversal meets them: in a file whose text names no class and no helper, only
        module-level strings, which can read as classes in any file. Every rule after it is handed
        the same sites, in the same order, when the traversal ends, so a rule that adds listeners
        of its own merges its `Program:exit` with these. */
    visitors(onSite) {
      const replay = () => {
        for (const found of (recorded ??= walk())) onSite(found);
      };
      if (recording) return { "Program:exit": replay };
      recording = true;
      const all = [];
      const each = (node) => {
        for (const found of sitesAt(node)) {
          all.push(found);
          onSite(found);
        }
      };
      return {
        ...Object.fromEntries(listened.map((type) => [type, each])),
        "Program:exit"() {
          recorded = all;
        },
      };
    },
  };
}

/**
 * A class built at runtime, as a finding quotes it: each word of a template or a concatenation that
 * glues a hole to text, the hole written as its expression when that is a short name
 * (`bg-${tone}`), else as `${…}`. Double quotes become single, so the quote around it stays whole.
 * `sides` (the reader's glued-template entry) says which side of each hole is glued; without it,
 * every hole is glued on both.
 */
export function builtClass(node, sourceCode, sides) {
  const hole = (expression) => {
    const glued = sides ? (sides.get(unwrap(expression)) ?? sides.get(expression)) : undefined;
    if (glued && !glued.before && !glued.after) return " ";
    const text = sourceCode.getText(expression);
    const written = `\u0000\${${/^[\w$.]{1,24}$/.test(text) ? text : "…"}}\u0000`;
    return glued ? `${glued.before ? "" : " "}${written}${glued.after ? "" : " "}` : written;
  };
  let written;
  if (node.type === "TemplateLiteral" || node.type === "TaggedTemplateExpression") {
    const template = node.type === "TemplateLiteral" ? node : node.quasi;
    written = template.quasis
      .map(
        (quasi, index) =>
          (quasi.value.cooked ?? quasi.value.raw) +
          (index < template.expressions.length ? hole(template.expressions[index]) : ""),
      )
      .join("");
  } else
    written = (gluedOperands(node) ?? [node])
      .map((value) =>
        (value?.type === "Literal" && typeof value.value === "string") ||
        (value?.type === "TemplateLiteral" && !value.expressions.length)
          ? textOf(value)
          : hole(value),
      )
      .join("");
  return written
    .split(/\s+/)
    .filter((word) => word.includes("\u0000") && !/^(\u0000[^\u0000]*\u0000)+$/.test(word))
    .join(" ")
    .replaceAll("\u0000", "")
    .replaceAll('"', "'");
}
