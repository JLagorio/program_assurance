// What each kit part sets itself, read from its source when the lint inventory is built
// (`npm run build:lint`, build/lint-inventory.mjs), for eslint-plugin/parts.json:
//
//   root     the classes a part always puts on the element its caller's className reaches
//   props    the classes each value of a prop puts there (`true` for a flag, `*` for any value
//            given, `!x` for any value but x, unset included, `unset` when it is not given)
//   derived  the classes it puts there through a value made from props that the reader cannot
//            map to one prop's values (Box's inverse text on a bold backgroundColor), with the
//            props it is made from, and `unset`, those it puts there when the caller writes none
//            of its props (Alert's neutral tone, Badge's brand bold fill), where the build can
//            tell: a prop is its default, a known test takes its branch, a helper's `if`s are
//            followed
//   sets     each category those classes change, with their keys
//   accepts  what its className prop's `@accepts` tag says a caller may add; the build stops on an
//            entry that is no category and no class the kit knows (eslint-plugin/parts.js)
//   className  false for a part whose props take none, so no caller's class meets what it sets
//   unread   where the reader stopped: the part may set more than the data says there
//
// Each class is filed under the key eslint-plugin/categories.js gives it: its tailwind-merge group
// (`gap`, `text-color`), or `utility:<name>` for a kit @utility the grammar does not place with its
// own kind. A class whose variants style another element (`[&>svg]:size-icon-small`, `*:p-100`) is
// no class of the part's own element and is left out.
//
// The reader is the lint's own (eslint-plugin/values.js), run over the kit's source with
// typescript-eslint and the TypeScript program the inventory builds, so it can ask the type checker
// where syntax alone cannot say. From the expression that takes the caller's className it follows:
//
//   "a b", `a ${x} b`   the words (between a template's holes too, and across a `+`, or a list's
//                       join)
//   p && X, p ? X : Y   X under the prop's value (a flag's true, a compared literal, else `*`)
//   map[p], map[p].x    each entry (or its `x`) under its key; an imported map in the file that
//                       declares it, a map no source writes (`spaceClasses.p`) by its type
//   classFor(p)         the class of each token p's type allows (primitives/tokens)
//   cn(…), classes(…)   each argument; a cva recipe's base, and each axis under the prop the call
//                       gives it
//   helper({ p })       a function's returns, same file or imported, its parameters as the call
//                       gives them (buttonVariants, badgeVariants)
//   const x = …         the value it holds
//   <Part … />          what a part or a component rendered with the className sets, its props
//                       mapped through the attributes (Button through ButtonBase, a part that
//                       renders a Heading or a Stack), under the conditions around the element
//
// A test that reads no prop is part of the root (a context's orientation); a test or a key made
// from one prop besides the caller's className (`placed = alignOf(align, className)`) is that
// prop's value; one made from several props through a value (`const paint = …tone…`) files what
// it selects under `derived`. A helper that only reads the className to decide something else
// (`alignOf`, a literal; `WRAP_BY_CLASS.test`, a flag) hands no class on.
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

import { CATEGORIES, categoriesOf, reachesOthers } from "../eslint-plugin/categories.js";
import { classesOf } from "../eslint-plugin/classes.js";
import { acceptsProblem } from "../eslint-plugin/parts.js";
import {
  bindingOf,
  calledFunction,
  entriesOf,
  keyName,
  memberKey,
  memberValues,
  objectsOf,
  returnsOf,
  unwrap,
} from "../eslint-plugin/values.js";

const require = createRequire(import.meta.url);
const { Linter } = require("eslint");
const tsParser = require("@typescript-eslint/parser");

/** The layout primitives and the type primitives; every other part is a component. */
const LAYOUT_PRIMITIVES = new Set(["Box", "Stack", "Inline", "Flex", "Grid", "Bleed"]);
const TYPE_PRIMITIVES = new Set(["Text", "Heading"]);
/** A part's kind: `layout-primitive`, `type-primitive` or `component`. */
export const kindOf = (name) =>
  LAYOUT_PRIMITIVES.has(name)
    ? "layout-primitive"
    : TYPE_PRIMITIVES.has(name)
      ? "type-primitive"
      : "component";

/** Calls whose arguments are all classes, merged. */
const MERGE = new Set(["cn", "clsx", "cx", "twMerge", "twJoin", "classes", "classNames"]);
/** Class recipes whose config holds classes as values. */
const RECIPES = new Set(["cva", "tv"]);
/** How deep the reader follows helpers and rendered parts before it stops and says so. */
const MAX_DEPTH = 8;
/** At most this many places a part's reader stopped are kept. */
const MAX_UNREAD = 12;
/** What a helper's parameter holds when the call gives it nothing: undefined, which sets no
    class. */
const NOTHING = Object.freeze({ type: "Literal", value: undefined, raw: "undefined" });
/** An expression whose value the build cannot tell when the caller writes no prop. */
const UNKNOWN = Symbol("unknown");
/** The props object of the part's own function, with no prop written. */
const PROPS = Object.freeze({ props: true });
/** A run of statements that returns nothing yet. */
const FALLS_THROUGH = Symbol("falls through");
/** How many steps the build follows a value when the caller writes no prop before it stops. */
const UNSET_DEPTH = 64;
/** Where the reader stops when the className it follows reaches no element. */
const NO_ELEMENT = "the className reaches no element the reader sees";

/* ---------- the parts ---------- */

/** The function a declaration's value is: a function, the first function a call wraps
    (`memo(function …)`), or the root `Object.assign(Root, { … })` extends. */
function functionOf(checker, node, depth = 0) {
  if (!node || depth > 8) return undefined;
  if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node))
    return node.body ? node : undefined;
  if (ts.isVariableDeclaration(node) || ts.isPropertyAssignment(node))
    return functionOf(checker, node.initializer, depth + 1);
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node)
  )
    return functionOf(checker, node.expression, depth + 1);
  // `{ Text: typeof EditableText }`, the type a namespace of parts is cast to.
  if (ts.isPropertySignature(node) && node.type && ts.isTypeQueryNode(node.type))
    return declarationOf(checker, checker.getSymbolAtLocation(node.type.exprName), depth + 1);
  if (ts.isShorthandPropertyAssignment(node))
    return declarationOf(checker, checker.getShorthandAssignmentValueSymbol(node), depth + 1);
  if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node))
    return declarationOf(checker, checker.getSymbolAtLocation(node), depth + 1);
  if (ts.isCallExpression(node))
    for (const arg of node.arguments) {
      const found = functionOf(checker, arg, depth + 1);
      if (found) return found;
    }
  return undefined;
}
function declarationOf(checker, symbol, depth = 0) {
  if (!symbol) return undefined;
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const declaration = target.valueDeclaration ?? target.declarations?.[0];
  return declaration ? functionOf(checker, declaration, depth) : undefined;
}

/**
 * Every public part and member (`Table.Cell`, `Shell.TopNav.Item`) of the barrel's `names`, as
 * the lint inventory finds them: `{ name, fn, props }`, the function that renders it (undefined
 * for a part the kit does not render itself) and the type of its props.
 */
export function publicParts(program, entryFile, names) {
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryFile);
  const exports = new Map(
    checker.getExportsOfModule(checker.getSymbolAtLocation(source)).map((s) => [s.name, s]),
  );
  const parts = [];
  const visit = (name, symbol, type, depth) => {
    const [signature] = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
    // A namespace of parts (`Editable`, an object of Text and Select) is no part; its members are.
    if (signature) {
      const [first] = signature.getParameters();
      parts.push({
        name,
        fn: declarationOf(checker, symbol),
        props: first ? checker.getTypeOfSymbolAtLocation(first, source) : undefined,
      });
    } else if (depth > 0 || !type.getProperties().some((m) => /^[A-Z]\w*$/.test(m.name))) return;
    if (depth >= 3) return;
    for (const member of type.getProperties())
      if (/^[A-Z]\w*$/.test(member.name))
        visit(
          `${name}.${member.name}`,
          member,
          checker.getTypeOfSymbolAtLocation(member, source),
          depth + 1,
        );
  };
  for (const name of names) {
    const part = exports.get(name);
    if (part) visit(name, part, checker.getTypeOfSymbolAtLocation(part, source), 0);
  }
  return parts.sort((a, z) => (a.name < z.name ? -1 : 1));
}

/* ---------- the source, as the lint reads it ---------- */

/** Each kit file's ESLint view (its source code, scopes and typescript-eslint's services), parsed
    once with the inventory's program, by absolute path. */
function parsedFiles(program, srcDir) {
  const files = new Map();
  // The kit's folder as the base path, or the config would match no file outside the working one.
  const linter = new Linter({ configType: "flat", cwd: path.dirname(path.resolve(srcDir)) });
  const keep = {
    meta: { schema: [] },
    create(context) {
      return {
        Program() {
          files.set(context.filename, {
            context: { sourceCode: context.sourceCode, filename: context.filename, settings: {} },
            services: context.sourceCode.parserServices,
          });
        },
      };
    },
  };
  const inside = `${path.resolve(srcDir)}${path.sep}`;
  for (const file of program.getSourceFiles()) {
    const name = path.resolve(file.fileName);
    if (!name.startsWith(inside) || name.endsWith(".d.ts") || !/\.tsx?$/.test(name)) continue;
    const messages = linter.verify(
      file.text,
      [
        {
          files: ["**/*.ts", "**/*.tsx"],
          // The kit's own disable comments name rules this pass does not load.
          linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "off" },
          languageOptions: {
            parser: tsParser,
            parserOptions: { programs: [program], ecmaFeatures: { jsx: true } },
          },
          plugins: { parts: { rules: { keep } } },
          rules: { "parts/keep": "error" },
        },
      ],
      { filename: name },
    );
    const fatal = messages.find((message) => message.fatal);
    if (fatal || !files.has(name))
      throw new Error(`${path.relative(srcDir, name)}: ${fatal?.message ?? "not read"}`);
  }
  return files;
}

/** The value variable a name refers to where it is written. */
function variableAt(ctx, identifier) {
  for (let scope = ctx.context.sourceCode.getScope(identifier); scope; scope = scope.upper) {
    const found = scope.set.get(identifier.name);
    if (found && found.isValueVariable !== false) return found;
  }
  return undefined;
}

/* ---------- conditions ---------- */

/** No condition: the classes are always there. */
const ALWAYS = Object.freeze({ kind: "always" });
/** A prop atom that names a value, not just "set" or "not set". */
const specific = (when) =>
  when.kind === "prop" && !["*", "false", "unset"].includes(when.value) && !isOther(when.value);
/** A prop value that stands for every value but one, unset included (`!xsmall`, from
    `size !== "xsmall"`). */
const isOther = (value) => value.startsWith("!");
/** Two conditions in force at once, one inside the other: a prop's specific value first (the
    inner's), then the prop atom of either, then the props both are made from. */
function both(outer, inner) {
  if (specific(inner)) return inner;
  if (specific(outer)) return outer;
  if (inner.kind === "prop") return inner;
  if (outer.kind === "prop") return outer;
  if (inner.kind === "derived" && outer.kind === "derived")
    return { kind: "derived", props: [...new Set([...outer.props, ...inner.props])].sort() };
  return inner.kind === "always" ? outer : inner;
}
/** The first condition of a conjunction decides, unless a later one names a prop's value. */
function conjunction(atoms) {
  const [first] = atoms;
  if (!first) return ALWAYS;
  if (specific(first)) return first;
  return (
    atoms.find(specific) ??
    (first.kind === "always" ? (atoms.find((a) => a.kind !== "always") ?? ALWAYS) : first)
  );
}

/* ---------- reading one function ---------- */

/**
 * The reader over the kit's parsed files. `analyse(ctx, fn, depth)` reads a component function:
 * where the caller's className goes, and what reaches the element with it, as
 * `{ emissions, unread, renders, accepts }`: emissions `{ classes, when }` in terms of the
 * function's own props, and the elements (a part or a component) the className reaches, each with
 * the condition it renders under.
 */
function reader({ program, files, classByToken }) {
  const checker = program.getTypeChecker();
  const fileOf = (tsNode) => files.get(path.resolve(tsNode.getSourceFile().fileName));
  const esOf = (tsNode) => {
    const there = fileOf(tsNode);
    const node = there?.services.tsNodeToESTreeNodeMap.get(tsNode);
    return node ? { there, node } : undefined;
  };
  const typeOf = (ctx, node) => {
    const tsNode = ctx.services.esTreeNodeToTSNodeMap.get(node);
    return tsNode ? { tsNode, type: checker.getTypeAtLocation(tsNode) } : undefined;
  };
  /** The declaration an imported (or any) name resolves to, through aliases. */
  const declared = (ctx, node) => {
    const tsNode = ctx.services.esTreeNodeToTSNodeMap.get(node);
    const symbol = tsNode && checker.getSymbolAtLocation(tsNode);
    if (!symbol) return undefined;
    const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    return target.valueDeclaration ?? target.declarations?.[0];
  };

  /** The literal values a node's type allows, as strings; undefined unless it is a union of
      string and number literals. */
  const literalsOf = (ctx, node) => {
    const found = typeOf(ctx, node);
    if (!found) return undefined;
    const type = checker.getNonNullableType(found.type);
    const members = type.isUnion() ? type.types : [type];
    if (!members.length || !members.every((m) => m.isStringLiteral() || m.isNumberLiteral()))
      return undefined;
    return members.map((m) => String(m.value));
  };
  /** Whether a node's type allows only true and false. */
  const isFlag = (ctx, node) => {
    const found = typeOf(ctx, node);
    if (!found) return false;
    const type = checker.getNonNullableType(found.type);
    const members = type.isUnion() ? type.types : [type];
    return members.every((m) => m.flags & (ts.TypeFlags.BooleanLiteral | ts.TypeFlags.Boolean));
  };

  function analyse(ctx, fn, depth = 0) {
    const emissions = [];
    const unread = [];
    const renders = [];
    const say = (at, node, why) => {
      const text = at.context.sourceCode.getText(node).replace(/\s+/g, " ");
      unread.push(
        `${why}: ${text.length > 60 ? `${text.slice(0, 57)}…` : text} (${path.basename(at.context.filename)}:${node.loc.start.line})`,
      );
    };
    const emit = (text, when) => {
      const classes = text.split(/\s+/).filter(Boolean);
      if (classes.length) emissions.push({ classes, when });
    };

    /* ---- which binding is which prop ---- */

    /** The prop a node stands for in `fn` (`size`, `props.size`), through the parameters a
        helper is read with (`env`), else undefined. */
    const propOf = (at, node, env) => {
      const value = unwrap(node);
      if (value?.type === "Identifier") {
        const bound = env.get(variableAt(at, value));
        if (bound) return propOf(bound.at, bound.node, bound.env);
        if (at !== ctx) return undefined;
        const found = bindingOf(at.context, value);
        if (found.parameter && found.variable?.defs[0]?.node === fn)
          return found.parameter.key ?? undefined;
        return undefined;
      }
      if (value?.type === "MemberExpression" && !value.computed && at === ctx) {
        const object = unwrap(value.object);
        if (object?.type !== "Identifier") return undefined;
        const found = bindingOf(at.context, object);
        if (found.parameter && found.variable?.defs[0]?.node === fn && found.parameter.key === null)
          return memberKey(value) ?? undefined;
      }
      return undefined;
    };

    /** The props an expression is made from, through the names that hold them. */
    const propsIn = (at, node, env, seen = new Set()) => {
      const out = new Set();
      const visit = (current, where, scopeEnv) => {
        if (!current || typeof current !== "object" || seen.has(current)) return;
        seen.add(current);
        const prop = propOf(where, current, scopeEnv);
        if (prop) return void out.add(prop);
        if (current.type === "Identifier") {
          const bound = scopeEnv.get(variableAt(where, current));
          if (bound) return visit(bound.node, bound.at, bound.env);
          const found = bindingOf(where.context, current);
          if (found.init && found.variable?.scope.type !== "module")
            visit(found.init, where, scopeEnv);
          if (found.fallback) visit(found.fallback, where, scopeEnv);
          return;
        }
        for (const key of Object.keys(current)) {
          if (key === "parent" || key === "loc" || key === "range") continue;
          const child = current[key];
          if (Array.isArray(child)) child.forEach((item) => visit(item, where, scopeEnv));
          else if (child && typeof child.type === "string") visit(child, where, scopeEnv);
        }
      };
      visit(node, at, env);
      return [...out].sort();
    };
    const madeOf = (at, node, env) => {
      const props = propsIn(at, node, env);
      return props.length ? { kind: "derived", props } : ALWAYS;
    };

    /** The values the function's prop allows, as strings (`true` and `false` for a flag), or
        undefined when its type is no union of literals. */
    const ownProps = fn.params[0] ? typeOf(ctx, fn.params[0]) : undefined;
    const valuesOfProp = (prop) => {
      const symbol = ownProps?.type.getProperty(prop);
      if (!symbol) return undefined;
      const type = checker.getNonNullableType(
        checker.getTypeOfSymbolAtLocation(symbol, ownProps.tsNode),
      );
      const members = type.isUnion() ? type.types : [type];
      if (members.every((m) => m.flags & (ts.TypeFlags.BooleanLiteral | ts.TypeFlags.Boolean)))
        return ["true", "false"];
      if (members.every((m) => m.isStringLiteral() || m.isNumberLiteral()))
        return members.map((m) => String(m.value));
      return undefined;
    };
    /** The one prop a value is made from besides the caller's className, which a part reads to
        defer to the caller's own class (`alignOf(align, className)`), or undefined. */
    const soleProp = (at, node, env) => {
      const props = propsIn(at, node, env).filter((prop) => prop !== "className");
      return props.length === 1 ? props[0] : undefined;
    };

    /** What a test says about props when it holds (`negate`: when it does not). */
    const conditionOf = (at, test, env, negate = false) => {
      const value = unwrap(test);
      if (!value) return ALWAYS;
      if (value.type === "UnaryExpression" && value.operator === "!")
        return conditionOf(at, value.argument, env, !negate);
      if (value.type === "CallExpression" && unwrap(value.callee)?.name === "Boolean")
        return conditionOf(at, value.arguments[0], env, negate);
      const prop = propOf(at, value, env);
      if (prop)
        return {
          kind: "prop",
          prop,
          value: isFlag(at, value) ? String(!negate) : negate ? "unset" : "*",
        };
      if (
        value.type === "BinaryExpression" &&
        ["===", "==", "!==", "!="].includes(value.operator)
      ) {
        const [left, right] = [unwrap(value.left), unwrap(value.right)];
        const literal = [left, right].find((side) => side?.type === "Literal");
        const other = literal === left ? right : left;
        const named = literal && other && propOf(at, other, env);
        const equal = ["===", "=="].includes(value.operator) !== negate;
        // `p != null` is the prop given, `p == null` not; `p !== "x"` is every value but "x", unset
        // included, which `*` (given, any value) is not.
        if (named && literal.value === null)
          return { kind: "prop", prop: named, value: equal ? "unset" : "*" };
        if (named)
          return {
            kind: "prop",
            prop: named,
            value: equal ? String(literal.value) : `!${literal.value}`,
          };
        // A value made from one prop (`placed === "end"`, placed from align): that prop's value.
        const sole = literal && other && soleProp(at, other, env);
        if (sole && equal && valuesOfProp(sole)?.includes(String(literal.value)))
          return { kind: "prop", prop: sole, value: String(literal.value) };
      }
      if (value.type === "LogicalExpression" && value.operator === "&&" && !negate)
        return conjunction([conditionOf(at, value.left, env), conditionOf(at, value.right, env)]);
      if (value.type === "Identifier") {
        // A name that holds a test of a prop (`const vertical = orientation === "vertical"`).
        const bound = env.get(variableAt(at, value));
        if (bound) return conditionOf(bound.at, bound.node, bound.env, negate);
        const found = bindingOf(at.context, value);
        const inner = found.init && !found.steps?.length ? unwrap(found.init) : undefined;
        if (["BinaryExpression", "UnaryExpression", "LogicalExpression"].includes(inner?.type))
          return conditionOf(at, inner, env, negate);
      }
      // A flag made from one flag prop (`wrap = wrapsOf(wrapProp, className)`): that prop.
      const sole = isFlag(at, value) ? soleProp(at, value, env) : undefined;
      if (sole && valuesOfProp(sole)?.[0] === "true")
        return { kind: "prop", prop: sole, value: String(!negate) };
      return madeOf(at, value, env);
    };
    /** The condition a map key puts on an entry: the prop's value when the key is a prop, or is
        made from one prop whose values include the entry's key (TEXT_ALIGN[placed]). */
    const keyed = (at, key, entry, env) => {
      const prop = propOf(at, key, env);
      if (prop) return { kind: "prop", prop, value: entry };
      const sole = soleProp(at, key, env);
      if (sole && valuesOfProp(sole)?.includes(entry))
        return { kind: "prop", prop: sole, value: entry };
      return madeOf(at, key, env);
    };

    /* ---- what the part sets when its caller writes no prop ---- */

    /** The value an expression has when the caller writes no prop (a prop is its default, else
        undefined), as far as it can be told without running the code: a primitive, `{ object,
        at, env }` for an object literal, PROPS for the props object, or UNKNOWN. */
    const known = new WeakMap();
    const unsetValue = (at, node, env, depth = 0) => {
      const byEnv = known.get(node);
      if (byEnv?.has(env)) return byEnv.get(env);
      const found = valueWhenUnset(at, node, env, depth);
      // An answer the depth cut short is not kept.
      if (found !== UNKNOWN && node && typeof node === "object") {
        if (!byEnv) known.set(node, new Map([[env, found]]));
        else byEnv.set(env, found);
      }
      return found;
    };
    const valueWhenUnset = (at, node, env, depth) => {
      const value = unwrap(node);
      if (!value || depth > UNSET_DEPTH) return UNKNOWN;
      const next = (inner, there = at, scope = env) => unsetValue(there, inner, scope, depth + 1);
      switch (value.type) {
        case "Literal":
          return value.regex ? UNKNOWN : value.value;
        case "TemplateLiteral": {
          let text = value.quasis[0]?.value.cooked ?? "";
          for (const [index, hole] of value.expressions.entries()) {
            const part = next(hole);
            if (part === UNKNOWN || (part !== null && typeof part === "object")) return UNKNOWN;
            text += String(part) + (value.quasis[index + 1]?.value.cooked ?? "");
          }
          return text;
        }
        case "ObjectExpression":
          return { object: value, at, env };
        case "Identifier": {
          if (value.name === "undefined") return undefined;
          const bound = env.get(variableAt(at, value));
          if (bound) return next(bound.node, bound.at, bound.env);
          const found = bindingOf(at.context, value);
          if (found.parameter) {
            // The part's own props: one the caller does not write is its default, or undefined;
            // the props object, or its rest, is the caller's props, none of them written.
            if (at !== ctx || found.variable?.defs[0]?.node !== fn) return UNKNOWN;
            if (found.parameter.key === null) return PROPS;
            // Children are what a caller writes between the tags, which no attribute shows.
            if (found.parameter.key === "children") return UNKNOWN;
            return found.parameter.fallback ? next(found.parameter.fallback) : undefined;
          }
          if (found.unreadable === "imported") {
            const declaration = declared(at, value);
            const init =
              declaration && ts.isVariableDeclaration(declaration) && declaration.initializer
                ? esOf(declaration.initializer)
                : undefined;
            return init ? next(init.node, init.there, new Map()) : UNKNOWN;
          }
          if (found.init && !found.steps?.length) return next(found.init);
          return UNKNOWN;
        }
        case "MemberExpression": {
          const object = next(value.object);
          if (object === UNKNOWN) return UNKNOWN;
          if (object === PROPS) return memberKey(value) === "children" ? UNKNOWN : undefined;
          const key = value.computed
            ? (memberKey(value) ?? next(value.property))
            : memberKey(value);
          if (key === UNKNOWN || key === null) return UNKNOWN;
          if (object === null || object === undefined) return UNKNOWN;
          if (typeof object !== "object") return UNKNOWN;
          const entries = entriesOf(object.at.context, object.object);
          const index = entries.findLastIndex((entry) => entry.key === String(key));
          // A spread or a computed key after the entry, or anywhere when there is none, may
          // write it.
          if (entries.slice(index + 1).some((entry) => entry.unknown)) return UNKNOWN;
          if (index < 0) return undefined;
          return next(entries[index].value, object.at, object.env);
        }
        case "LogicalExpression": {
          const left = next(value.left);
          if (left === UNKNOWN) return UNKNOWN;
          if (value.operator === "??")
            return left === null || left === undefined ? next(value.right) : left;
          if (value.operator === "||") return left ? left : next(value.right);
          return left ? next(value.right) : left;
        }
        case "ConditionalExpression": {
          const test = next(value.test);
          if (test === UNKNOWN) return UNKNOWN;
          return next(test ? value.consequent : value.alternate);
        }
        case "UnaryExpression": {
          const argument = next(value.argument);
          if (argument === UNKNOWN) return UNKNOWN;
          if (value.operator === "!") return !argument;
          if (value.operator === "void") return undefined;
          if (value.operator === "-" && typeof argument === "number") return -argument;
          return UNKNOWN;
        }
        case "BinaryExpression": {
          if (!["===", "!==", "==", "!="].includes(value.operator)) return UNKNOWN;
          const [left, right] = [next(value.left), next(value.right)];
          const known = (side) => side !== UNKNOWN && (side === null || typeof side !== "object");
          if (!known(left) || !known(right)) return UNKNOWN;
          const equal = value.operator.length === 3 ? left === right : left == right;
          return value.operator.startsWith("!") ? !equal : equal;
        }
        case "CallExpression": {
          const callee = unwrap(value.callee);
          if (callee?.type === "Identifier" && callee.name === "Boolean") {
            const argument = next(value.arguments[0]);
            return argument === UNKNOWN ? UNKNOWN : Boolean(argument);
          }
          const helper = callee?.type === "Identifier" ? helperOf(at, callee) : undefined;
          if (!helper) return UNKNOWN;
          const scope = bindParameters(helper.there, helper.fn, at, value.arguments, env);
          return unsetReturn(helper.there, helper.fn, scope, depth + 1, (returned) =>
            unsetValue(helper.there, returned, scope, depth + 2),
          );
        }
        default:
          return UNKNOWN;
      }
    };
    /** What a function returns when the caller writes no prop, through `answer` of its return
        expression: a body that is one expression, or statements of declarations, `if`s whose
        test is known, and a return. UNKNOWN past anything else. */
    const unsetReturn = (there, helper, env, depth, answer) => {
      if (!helper.body || depth > UNSET_DEPTH) return UNKNOWN;
      if (helper.body.type !== "BlockStatement") return answer(helper.body);
      const run = (statements) => {
        for (const statement of statements) {
          if (statement.type === "VariableDeclaration" || statement.type === "EmptyStatement")
            continue;
          if (statement.type === "ReturnStatement")
            return statement.argument ? answer(statement.argument) : undefined;
          if (statement.type === "IfStatement") {
            const test = unsetValue(there, statement.test, env, depth + 1);
            if (test === UNKNOWN) return UNKNOWN;
            const branch = test ? statement.consequent : statement.alternate;
            if (!branch) continue;
            const result = run(branch.type === "BlockStatement" ? branch.body : [branch]);
            if (result !== FALLS_THROUGH) return result;
            continue;
          }
          return UNKNOWN;
        }
        return FALLS_THROUGH;
      };
      const result = run(helper.body.body);
      return result === FALLS_THROUGH ? undefined : result;
    };

    /** The classes an expression certainly puts on the element when the caller writes no prop:
        a class string it evaluates to, every argument of a merge, the branch a known test takes
        (both branches' shared classes when the test is unknown), a recipe's base and the option
        each axis takes, a helper's return. */
    const unsetClasses = (at, node, env, depth = 0) => {
      const value = unwrap(node);
      const none = new Set();
      if (!value || depth > UNSET_DEPTH) return none;
      const next = (inner, there = at, scope = env) => unsetClasses(there, inner, scope, depth + 1);
      const words = (text) => new Set(text.split(/\s+/).filter(Boolean));
      const union = (sets) => new Set(sets.flatMap((set) => [...set]));
      if (value.type === "LogicalExpression") {
        const left = unsetValue(at, value.left, env, depth + 1);
        if (left === UNKNOWN) return none;
        if (value.operator === "&&") return left ? next(value.right) : none;
        const takesLeft =
          value.operator === "??" ? left !== null && left !== undefined : Boolean(left);
        return next(takesLeft ? value.left : value.right);
      }
      if (value.type === "ConditionalExpression") {
        const test = unsetValue(at, value.test, env, depth + 1);
        if (test !== UNKNOWN) return next(test ? value.consequent : value.alternate);
        const [yes, no] = [next(value.consequent), next(value.alternate)];
        return new Set([...yes].filter((cls) => no.has(cls)));
      }
      if (value.type === "ArrayExpression")
        return union(value.elements.filter(Boolean).map((element) => next(element)));
      if (value.type === "TemplateLiteral") {
        const own = value.quasis.map((quasi, index) => {
          let text = quasi.value.cooked ?? "";
          if (index > 0 && !/^\s/.test(text)) text = text.replace(/^\S*/, "");
          if (index < value.quasis.length - 1 && !/\s$/.test(text)) text = text.replace(/\S*$/, "");
          return words(text);
        });
        return union([...own, ...value.expressions.map((hole) => next(hole))]);
      }
      if (value.type === "CallExpression") {
        const callee = unwrap(value.callee);
        const called = callee?.type === "Identifier" ? callee.name : undefined;
        if (called && MERGE.has(called)) return union(value.arguments.map((arg) => next(arg)));
        if (
          callee?.type === "MemberExpression" &&
          memberKey(callee) === "join" &&
          unwrap(callee.object)?.type === "ArrayExpression"
        )
          return next(callee.object);
        if (called) {
          const recipe = unwrap(bindingOf(at.context, callee).init);
          if (recipe?.type === "CallExpression" && RECIPES.has(unwrap(recipe.callee)?.name))
            return unsetRecipe(at, recipe, value, env, depth + 1);
          const helper = helperOf(at, callee);
          if (helper) {
            const scope = bindParameters(helper.there, helper.fn, at, value.arguments, env);
            const found = unsetReturn(helper.there, helper.fn, scope, depth + 1, (returned) =>
              unsetClasses(helper.there, returned, scope, depth + 2),
            );
            return found instanceof Set ? found : none;
          }
        }
        return none;
      }
      if (value.type === "Identifier") {
        const bound = env.get(variableAt(at, value));
        if (bound) return next(bound.node, bound.at, bound.env);
        const found = bindingOf(at.context, value);
        if (found.init && !found.steps?.length && !found.parameter) {
          const text = unsetValue(at, value, env, depth + 1);
          return typeof text === "string" ? words(text) : next(found.init);
        }
      }
      const text = unsetValue(at, value, env, depth + 1);
      return typeof text === "string" ? words(text) : none;
    };
    /** A cva recipe's classes when the call is all the caller wrote: its base, and each axis's
        option under the value the call gives it, else the recipe's default. */
    const unsetRecipe = (at, recipe, callNode, env, depth) => {
      const [base, config] = recipe.arguments;
      const out = new Set(base ? unsetClasses(at, base, env, depth + 1) : []);
      const object = unwrap(config);
      if (object?.type !== "ObjectExpression") return out;
      const given = new Map();
      const arg = unwrap(callNode.arguments[0]);
      if (arg?.type === "ObjectExpression")
        for (const entry of entriesOf(at.context, arg))
          if (!entry.unknown) given.set(entry.key, entry.value);
      const entries = entriesOf(at.context, object);
      const defaults = entries.find((entry) => entry.key === "defaultVariants");
      const fallback = new Map();
      for (const inner of defaults ? objectsOf(at.context, defaults.value) : [])
        for (const entry of entriesOf(at.context, inner))
          if (!entry.unknown) fallback.set(entry.key, entry.value);
      const variants = entries.find((entry) => entry.key === "variants");
      for (const axes of variants ? objectsOf(at.context, variants.value) : [])
        for (const axis of entriesOf(at.context, axes)) {
          if (axis.unknown) continue;
          let chosen = given.has(axis.key)
            ? unsetValue(at, given.get(axis.key), env, depth + 1)
            : undefined;
          if (chosen === undefined && fallback.has(axis.key))
            chosen = unsetValue(at, fallback.get(axis.key), new Map(), depth + 1);
          if (chosen === UNKNOWN || chosen === undefined || chosen === null) continue;
          for (const options of objectsOf(at.context, axis.value))
            for (const option of entriesOf(at.context, options))
              if (!option.unknown && option.key === String(chosen))
                for (const cls of unsetClasses(at, option.value, env, depth + 1)) out.add(cls);
        }
      return out;
    };
    /** Whether a node inside the part's function is reached when the caller writes no prop: every
        branch around it is one a known test takes. */
    const reachedUnset = (node) => {
      for (
        let child = node, parent = node.parent;
        parent && child !== fn;
        child = parent, parent = parent.parent
      ) {
        let test;
        let wants;
        if (parent.type === "IfStatement" || parent.type === "ConditionalExpression") {
          if (parent.consequent === child) [test, wants] = [parent.test, "truthy"];
          else if (parent.alternate === child) [test, wants] = [parent.test, "falsy"];
        } else if (parent.type === "LogicalExpression" && parent.right === child)
          [test, wants] = [
            parent.left,
            parent.operator === "&&" ? "truthy" : parent.operator === "||" ? "falsy" : "nullish",
          ];
        if (!test) continue;
        const known = unsetValue(ctx, test, new Map());
        if (known === UNKNOWN) return false;
        const holds =
          wants === "truthy"
            ? Boolean(known)
            : wants === "falsy"
              ? !known
              : known === null || known === undefined;
        if (!holds) return false;
      }
      return true;
    };

    /* ---- reading a class expression ---- */

    const reading = new Set();
    const once = (key, run) => {
      if (reading.has(key)) return;
      reading.add(key);
      try {
        run();
      } finally {
        reading.delete(key);
      }
    };

    const read = (at, node, when, scope) => {
      const value = unwrap(node);
      if (!value) return;
      switch (value.type) {
        case "Literal":
          if (typeof value.value === "string") emit(value.value, when);
          return;
        case "TemplateLiteral":
          value.quasis.forEach((quasi, index) => {
            let text = quasi.value.cooked ?? "";
            // A word glued to a hole is no class of its own.
            if (index > 0 && !/^\s/.test(text)) text = text.replace(/^\S*/, "");
            if (index < value.quasis.length - 1 && !/\s$/.test(text))
              text = text.replace(/\S*$/, "");
            emit(text, when);
          });
          value.expressions.forEach((hole) => read(at, hole, when, scope));
          return;
        case "LogicalExpression":
          if (value.operator === "&&")
            return read(at, value.right, both(when, conditionOf(at, value.left, scope.env)), scope);
          read(at, value.left, when, scope);
          return read(at, value.right, when, scope);
        case "ConditionalExpression":
          read(at, value.consequent, both(when, conditionOf(at, value.test, scope.env)), scope);
          return read(
            at,
            value.alternate,
            both(when, conditionOf(at, value.test, scope.env, true)),
            scope,
          );
        case "ArrayExpression":
          value.elements.forEach((element) => element && read(at, element, when, scope));
          return;
        case "BinaryExpression":
          if (value.operator !== "+") return say(at, value, "expression");
          // "a b " + x: each side, a word glued across the + being no class of its own.
          return [value.left, value.right].forEach((side, index) => {
            const literal = unwrap(side);
            if (literal?.type !== "Literal" || typeof literal.value !== "string")
              return read(at, side, when, scope);
            let text = literal.value;
            if (index === 0 && !/\s$/.test(text)) text = text.replace(/\S*$/, "");
            if (index === 1 && !/^\s/.test(text)) text = text.replace(/^\S*/, "");
            emit(text, when);
          });
        case "Identifier":
          return name(at, value, when, scope);
        case "MemberExpression":
          return member(at, value, when, scope);
        case "CallExpression":
          return call(at, value, when, scope);
        default:
          return say(at, value, "expression");
      }
    };

    const name = (at, node, when, scope) => {
      if (node.name === "undefined") return;
      const own = variableAt(at, node);
      if (own && scope.skip.has(own)) return;
      const bound = scope.env.get(own);
      if (bound) return read(bound.at, bound.node, when, { ...scope, env: bound.env });
      if (propOf(at, node, scope.env)) return say(at, node, "a prop's own value");
      const found = bindingOf(at.context, node);
      if (found.none) return;
      if (found.unreadable === "imported") return imported(at, node, when, scope);
      if (found.unreadable || found.parameter)
        return say(at, node, found.unreadable ?? "a parameter");
      if (found.fn) return say(at, node, "a function");
      if (found.steps?.length) return say(at, node, "destructured");
      if (found.fallback) read(at, found.fallback, when, scope);
      return once(found.variable, () => read(at, found.init, when, scope));
    };

    /** A name imported from another kit file: its declaration there, read in that file; one the
        kit does not declare, by its type when that is a string literal or a union of them. */
    const imported = (at, node, when, scope) => {
      const declaration = declared(at, node);
      if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer) {
        const init = esOf(declaration.initializer);
        if (init)
          return once(init.node, () =>
            read(init.there, init.node, when, { ...scope, env: new Map() }),
          );
      }
      const values = literalsOf(at, node);
      if (values) return values.forEach((text) => emit(text, when));
      return say(at, node, "imported");
    };

    /** The object literals a map expression is: `{ at, object }` each, in the file that writes
        it. */
    const mapsOf = (at, node, env) => {
      const value = unwrap(node);
      if (value?.type === "Identifier") {
        const bound = env.get(variableAt(at, value));
        if (bound) return mapsOf(bound.at, bound.node, bound.env);
        if (bindingOf(at.context, value).unreadable === "imported") {
          const declaration = declared(at, value);
          const init =
            declaration && ts.isVariableDeclaration(declaration) && declaration.initializer
              ? esOf(declaration.initializer)
              : undefined;
          return init
            ? objectsOf(init.there.context, init.node).map((object) => ({ at: init.there, object }))
            : [];
        }
      }
      if (value?.type === "MemberExpression" && !value.computed) {
        const key = memberKey(value);
        return mapsOf(at, value.object, env).flatMap(({ at: there, object }) =>
          entriesOf(there.context, object)
            .filter((entry) => entry.key === key)
            .flatMap((entry) =>
              objectsOf(there.context, entry.value).map((inner) => ({ at: there, object: inner })),
            ),
        );
      }
      return objectsOf(at.context, value).map((object) => ({ at, object }));
    };

    const member = (at, node, when, scope) => {
      if (propOf(at, node, scope.env)) return say(at, node, "a prop's own value");
      if (node.computed && memberKey(node) === null) {
        // map[key]: each entry under its key, those the key's type allows.
        const allowed = literalsOf(at, node.property);
        const maps = mapsOf(at, node.object, scope.env);
        if (maps.length) {
          for (const { at: there, object } of maps)
            for (const entry of entriesOf(there.context, object)) {
              if (entry.unknown) {
                say(there, entry.unknown, entry.reason);
                continue;
              }
              if (allowed && !allowed.includes(entry.key)) continue;
              read(there, entry.value, both(when, keyed(at, node.property, entry.key, scope.env)), {
                ...scope,
                env: there === at ? scope.env : new Map(),
              });
            }
          return;
        }
        // A map no source writes: its type's entries, each a string literal.
        const found = typeOf(at, node.object);
        let any = false;
        for (const entry of found?.type.getProperties() ?? []) {
          if (allowed && !allowed.includes(entry.name)) continue;
          const type = checker.getTypeOfSymbolAtLocation(entry, found.tsNode);
          for (const m of type.isUnion() ? type.types : [type])
            if (m.isStringLiteral()) {
              any = true;
              emit(m.value, both(when, keyed(at, node.property, entry.name, scope.env)));
            }
        }
        if (!any) say(at, node, "a member");
        return;
      }
      // map[key].name (toneClasses[tone].icon): each entry's `name`, under the entry's key.
      const object = unwrap(node.object);
      if (
        !node.computed &&
        object?.type === "MemberExpression" &&
        object.computed &&
        memberKey(object) === null
      ) {
        const key = memberKey(node);
        const allowed = literalsOf(at, object.property);
        const maps = mapsOf(at, object.object, scope.env);
        for (const { at: there, object: map } of maps)
          for (const entry of entriesOf(there.context, map)) {
            if (entry.unknown || (allowed && !allowed.includes(entry.key))) continue;
            const condition = both(when, keyed(at, object.property, entry.key, scope.env));
            for (const inner of objectsOf(there.context, entry.value))
              for (const field of entriesOf(there.context, inner))
                if (!field.unknown && field.key === key)
                  read(there, field.value, condition, {
                    ...scope,
                    env: there === at ? scope.env : new Map(),
                  });
          }
        if (maps.length) return;
      }
      // obj.key: the entry the source names, under the props the object is made from.
      const inner = both(when, madeOf(at, node.object, scope.env));
      const values = memberValues(at.context, node, {});
      if (values.length) return values.forEach((entry) => read(at, entry, inner, scope));
      const key = memberKey(node);
      let any = false;
      for (const { at: there, object } of mapsOf(at, node.object, scope.env))
        for (const entry of entriesOf(there.context, object))
          if (entry.key === key) {
            any = true;
            read(there, entry.value, inner, { ...scope, env: new Map() });
          }
      if (!any) say(at, node, "a member");
    };

    /** A function a call names, in its own file or another kit file. */
    const helperOf = (at, callee) => {
      const local = calledFunction(at.context, callee);
      if (local) return { there: at, fn: local };
      const declaration = declared(at, callee);
      const tsFn = declaration && functionOf(checker, declaration);
      const found = tsFn && esOf(tsFn);
      return found ? { there: found.there, fn: found.node } : undefined;
    };

    /** Each parameter of a helper bound to what the call gives it, read in the caller: a
        destructured parameter's key to that entry of the call's object. One the call does not
        give (`toggleVariants({ variant, size })`'s className) is its default, or nothing. */
    const bindParameters = (there, helper, at, args, env) => {
      const bound = new Map();
      const absent = (target, fallback) =>
        bound.set(
          variableAt(there, target),
          fallback ? { at: there, node: fallback, env: new Map() } : { at, node: NOTHING, env },
        );
      helper.params.forEach((param, index) => {
        const arg = args[index];
        const pattern = param.type === "AssignmentPattern" ? param.left : param;
        if (arg?.type === "SpreadElement") return;
        if (pattern.type === "Identifier") {
          if (arg) bound.set(variableAt(there, pattern), { at, node: arg, env });
          else absent(pattern, param.type === "AssignmentPattern" ? param.right : undefined);
          return;
        }
        if (pattern.type !== "ObjectPattern") return;
        const object = arg ? unwrap(arg) : undefined;
        const entries = object?.type === "ObjectExpression" ? entriesOf(at.context, object) : [];
        // Every key the call gives is known: no spread, no computed key.
        const complete =
          !arg || (object?.type === "ObjectExpression" && !entries.some((e) => e.unknown));
        for (const property of pattern.properties) {
          if (property.type !== "Property") continue;
          const target =
            property.value.type === "AssignmentPattern" ? property.value.left : property.value;
          if (target.type !== "Identifier") continue;
          const entry = entries.findLast((candidate) => candidate.key === keyName(property));
          if (entry) bound.set(variableAt(there, target), { at, node: entry.value, env });
          else if (complete)
            absent(
              target,
              property.value.type === "AssignmentPattern" ? property.value.right : undefined,
            );
        }
      });
      return bound;
    };

    const call = (at, node, when, scope) => {
      const callee = unwrap(node.callee);
      const called = callee?.type === "Identifier" ? callee.name : undefined;
      if (called && MERGE.has(called)) {
        node.arguments.forEach((arg) => read(at, arg, when, scope));
        return;
      }
      // ["a", b].join(" "): the list's classes.
      if (
        callee?.type === "MemberExpression" &&
        memberKey(callee) === "join" &&
        unwrap(callee.object)?.type === "ArrayExpression"
      )
        return read(at, callee.object, when, scope);
      if (scope.depth > MAX_DEPTH) return say(at, node, "too deep");
      if (called === "classFor" && node.arguments.length === 1) {
        // A token: the class of each token the argument's type allows.
        const [arg] = node.arguments;
        const tokens = literalsOf(at, arg);
        if (!tokens) return say(at, node, "a token");
        for (const token of tokens)
          if (classByToken[token])
            emit(classByToken[token], both(when, keyed(at, arg, token, scope.env)));
        return;
      }
      if (called) {
        const recipe = unwrap(bindingOf(at.context, callee).init);
        if (recipe?.type === "CallExpression" && RECIPES.has(unwrap(recipe.callee)?.name))
          return cva(at, recipe, node, when, scope);
      }
      const helper = called ? helperOf(at, callee) : undefined;
      if (helper) {
        const env = bindParameters(helper.there, helper.fn, at, node.arguments, scope.env);
        return once(helper.fn, () =>
          returnsOf(helper.fn).forEach((returned) =>
            read(helper.there, returned, when, { ...scope, env, depth: scope.depth + 1 }),
          ),
        );
      }
      return say(at, node, "a call");
    };

    /** A cva recipe called for the part: its base, and each axis's options under the value the
        call gives the axis (a prop's value, or the axis's own name). */
    const cva = (at, recipe, callNode, when, scope) => {
      const [base, config] = recipe.arguments;
      if (base) read(at, base, when, scope);
      const given = new Map();
      const arg = unwrap(callNode.arguments[0]);
      if (arg?.type === "ObjectExpression")
        for (const entry of entriesOf(at.context, arg))
          if (!entry.unknown) given.set(entry.key, entry.value);
      const object = unwrap(config);
      if (object?.type !== "ObjectExpression") return;
      for (const entry of entriesOf(at.context, object)) {
        if (entry.key === "compoundVariants") {
          say(at, entry.value, "compound variants");
          continue;
        }
        if (entry.key !== "variants") continue;
        const axes = objectsOf(at.context, entry.value).flatMap((o) => entriesOf(at.context, o));
        for (const axis of axes) {
          if (axis.unknown) continue;
          const passed = given.get(axis.key);
          const options = objectsOf(at.context, axis.value).flatMap((o) =>
            entriesOf(at.context, o),
          );
          for (const option of options) {
            if (option.unknown) continue;
            const condition = passed
              ? keyed(at, passed, option.key, scope.env)
              : { kind: "prop", prop: axis.key, value: option.key };
            read(at, option.value, both(when, condition), scope);
          }
        }
      }
    };

    /* ---- where the className goes ---- */

    /** The object pattern the function's body destructures a name into (`const { className,
        ...props } = toolbarProps`), if any. */
    const destructuring = (identifier) => {
      if (fn.body?.type !== "BlockStatement") return undefined;
      for (const statement of fn.body.body)
        for (const declarator of statement.type === "VariableDeclaration"
          ? statement.declarations
          : [])
          if (
            declarator.id.type === "ObjectPattern" &&
            unwrap(declarator.init)?.type === "Identifier" &&
            unwrap(declarator.init).name === identifier.name
          )
            return declarator.id;
      return undefined;
    };
    const [first] = fn.params;
    let pattern = first?.type === "AssignmentPattern" ? first.left : first;
    // function Toolbar(toolbarProps) { const { className, ...props } = toolbarProps; … }
    if (pattern?.type === "Identifier") pattern = destructuring(pattern) ?? pattern;
    let classBinding;
    let rest;
    let whole;
    /** The props a pattern takes out of what it destructures, as the rest it leaves. */
    let destructured = new Set();
    const readPattern = (object) => {
      const names = new Set();
      let left;
      for (const property of object.properties) {
        if (property.type === "RestElement" && property.argument.type === "Identifier")
          left = property.argument;
        else if (property.type === "Property") {
          names.add(keyName(property));
          if (keyName(property) !== "className") continue;
          const target =
            property.value.type === "AssignmentPattern" ? property.value.left : property.value;
          if (target.type === "Identifier") classBinding = target;
        }
      }
      // A rest names what the props become; without one, the props object itself is passed on.
      if (left) {
        rest = left;
        destructured = new Set([...destructured, ...names]);
      }
    };
    if (pattern?.type === "ObjectPattern") {
      readPattern(pattern);
      // function ChartFrameView({ view, ...props }) { const { title, className } = props; … }
      const inner = !classBinding && rest ? destructuring(rest) : undefined;
      if (inner) readPattern(inner);
    } else if (pattern?.type === "Identifier") whole = pattern;

    /** The conditions around a node inside `fn`: the tests of the branches it is in. */
    const around = (node) => {
      const tests = [];
      for (
        let child = node, parent = node.parent;
        parent && child !== fn;
        child = parent, parent = parent.parent
      ) {
        if (parent.type === "IfStatement" || parent.type === "ConditionalExpression") {
          if (parent.consequent === child) tests.unshift(conditionOf(ctx, parent.test, new Map()));
          else if (parent.alternate === child)
            tests.unshift(conditionOf(ctx, parent.test, new Map(), true));
        } else if (
          parent.type === "LogicalExpression" &&
          parent.operator === "&&" &&
          parent.right === child
        )
          tests.unshift(conditionOf(ctx, parent.left, new Map()));
      }
      return tests.reduce(both, ALWAYS);
    };

    /** Whether a call hands on the classes it is given: a merge, or a helper that returns a
        string. One that reads the className to decide something else (`alignOf(align,
        className)`, a literal; `WRAP_BY_CLASS.test(className)`, a flag) does not. */
    const handsOn = (call) => {
      const callee = unwrap(call.callee);
      if (callee?.type === "Identifier" && MERGE.has(callee.name)) return true;
      const found = typeOf(ctx, call);
      if (!found) return true;
      const type = checker.getNonNullableType(found.type);
      return (type.isUnion() ? type.types : [type]).some(
        (m) => m.flags & (ts.TypeFlags.String | ts.TypeFlags.Any | ts.TypeFlags.Unknown),
      );
    };
    /** Up from a read of the className through what hands a class on: a helper's argument (an
        entry of its object argument too), a branch, a list, a template. */
    const outward = (reference) => {
      let node = reference;
      for (;;) {
        const parent = node.parent;
        if (!parent) return node;
        if (["TSAsExpression", "TSNonNullExpression", "ChainExpression"].includes(parent.type))
          node = parent;
        else if (
          parent.type === "CallExpression" &&
          parent.arguments.includes(node) &&
          handsOn(parent)
        )
          node = parent;
        else if (parent.type === "ConditionalExpression" && parent.test !== node) node = parent;
        else if (parent.type === "LogicalExpression" || parent.type === "ArrayExpression")
          node = parent;
        else if (parent.type === "TemplateLiteral") node = parent;
        else if (
          parent.type === "Property" &&
          parent.value === node &&
          parent.parent?.type === "ObjectExpression" &&
          parent.parent.parent?.type === "CallExpression" &&
          parent.parent.parent.arguments.includes(parent.parent) &&
          (keyName(parent) !== "className" ||
            /(?:Variants|Recipe|Classes)$/.test(unwrap(parent.parent.parent.callee)?.name ?? ""))
        )
          node = parent.parent.parent;
        else return node;
      }
    };
    /** The JSX element a class expression is the className of. */
    const elementOf = (node) => {
      let holder = node.parent;
      while (holder && ["JSXExpressionContainer", "TSAsExpression"].includes(holder.type))
        holder = holder.parent;
      return holder?.type === "JSXAttribute" ? holder.parent : undefined;
    };

    const skip = new Set();
    const sinks = [];
    const follow = (identifier, depth) => {
      const found = variableAt(ctx, identifier);
      if (!found) return;
      if (depth === 0) skip.add(found);
      for (const reference of found.references) {
        if (reference.init) continue;
        const sink = outward(reference.identifier);
        const holder = sink.parent;
        if (
          holder?.type === "VariableDeclarator" &&
          holder.init === sink &&
          holder.id.type === "Identifier" &&
          depth < 3
        ) {
          follow(holder.id, depth + 1);
          continue;
        }
        sinks.push(sink);
      }
    };
    if (classBinding) follow(classBinding, 0);
    const forwarded = rest ?? whole;
    const spreads = [];
    /** The rest goes into an object of props with no class of the part's own (useRender's). */
    let handedOn = false;
    if (forwarded) {
      const found = variableAt(ctx, forwarded);
      for (const reference of found?.references ?? []) {
        const parent = reference.identifier.parent;
        if (parent?.type === "JSXSpreadAttribute" && !classBinding) spreads.push(parent.parent);
        if (parent?.type === "SpreadElement" && parent.parent?.type === "ObjectExpression")
          handedOn = true;
        if (whole && parent?.type === "MemberExpression" && memberKey(parent) === "className") {
          skip.add(parent);
          sinks.push(outward(parent));
        }
      }
    }

    /** An element and the part its `render` prop renders it as, which gets the element's
        className and props merged with its own (`<Primitive.Input className={className}
        render={<InputGroupInput size={size} />} />`): that part as an element of its own, with the
        element's attributes before its own. */
    const rendersAs = (element) => {
      const attribute = element.attributes.findLast(
        (a) => a.type === "JSXAttribute" && a.name.name === "render",
      );
      const value = attribute?.value && unwrap(attribute.value);
      const as = value?.type === "JSXElement" ? value.openingElement : undefined;
      if (!as) return [element];
      const inherited = element.attributes.filter(
        (a) => a.type !== "JSXAttribute" || !["render", "className"].includes(a.name.name),
      );
      return [element, { ...as, attributes: [...inherited, ...as.attributes] }];
    };
    const scope = { env: new Map(), skip, depth };
    // The classes the element certainly carries when the caller writes no prop, for what a part
    // makes from several props (`derived`'s `unset`).
    const unset = new Set();
    for (const sink of sinks) {
      const when = around(sink);
      read(ctx, sink, when, scope);
      const reached = reachedUnset(sink);
      if (reached) for (const cls of unsetClasses(ctx, sink, new Map())) unset.add(cls);
      const element = elementOf(sink);
      if (element)
        for (const each of rendersAs(element)) renders.push({ element: each, when, reached });
    }
    for (const element of spreads) {
      // The rest reaches the element with its className, unless an attribute after it replaces it.
      const index = element.attributes.findIndex(
        (a) => a.type === "JSXSpreadAttribute" && unwrap(a.argument)?.name === forwarded.name,
      );
      const replaced = element.attributes
        .slice(index + 1)
        .some((a) => a.type === "JSXAttribute" && a.name.name === "className");
      if (!replaced)
        for (const each of rendersAs(element))
          renders.push({ element: each, when: around(element), reached: reachedUnset(element) });
    }
    if (!sinks.length && !spreads.length && !handedOn && (classBinding || forwarded))
      say(ctx, classBinding ?? forwarded, NO_ELEMENT);

    return {
      emissions,
      unread,
      renders,
      unset,
      forwardedName: forwarded?.name,
      destructured,
      propOf: (node) => propOf(ctx, node, new Map()),
      propsIn: (node) => propsIn(ctx, node, new Map()),
    };
  }

  /** The function a JSX element renders, when the kit writes it: `{ tsFn, there, fn }`. */
  const renderedFunction = (ctx, element) => {
    const declaration = declared(ctx, element.name);
    const tsFn = declaration && functionOf(checker, declaration);
    const found = tsFn && esOf(tsFn);
    return found ? { tsFn, there: found.there, fn: found.node } : undefined;
  };

  return { analyse, renderedFunction, esOf };
}

/* ---------- the data ---------- */

/** A condition the rendered element's attributes put on what it renders, in the renderer's
    props: null when the rendered part cannot have that value there. */
function mapThrough(when, element, outer) {
  if (when.kind === "always") return ALWAYS;
  const attribute = (prop) =>
    element.attributes.findLast((a) => a.type === "JSXAttribute" && a.name.name === prop);
  const spread = element.attributes.some(
    (a) => a.type === "JSXSpreadAttribute" && unwrap(a.argument)?.name === outer.forwardedName,
  );
  const passes = (prop) => spread && !outer.destructured.has(prop);
  if (when.kind === "prop") {
    const given = attribute(when.prop);
    if (given) {
      const value = given.value === null ? { type: "Literal", value: true } : unwrap(given.value);
      if (value?.type === "Literal") {
        const literal = String(value.value);
        if (when.value === literal || (when.value === "*" && value.value)) return ALWAYS;
        if (when.value === "true" && value.value === true) return ALWAYS;
        if (isOther(when.value) && when.value.slice(1) !== literal) return ALWAYS;
        return null;
      }
      const prop = outer.propOf(value);
      if (prop) return { kind: "prop", prop, value: when.value };
      const props = outer.propsIn(value);
      return props.length ? { kind: "derived", props } : ALWAYS;
    }
    if (passes(when.prop)) return when;
    // Not given: unset, so only a condition on its absence holds, or one on any other value.
    return ["false", "unset"].includes(when.value) || isOther(when.value) ? ALWAYS : null;
  }
  const props = new Set();
  for (const prop of when.props) {
    const given = attribute(prop);
    if (given?.value) outer.propsIn(unwrap(given.value)).forEach((p) => props.add(p));
    else if (passes(prop)) props.add(prop);
  }
  return props.size ? { kind: "derived", props: [...props].sort() } : ALWAYS;
}

/** A condition from a rendered part's data (root, a prop's value, derived), as `when`. */
const fromRecord = (record) => {
  const out = [];
  for (const classes of Object.values(record.root ?? {})) out.push({ classes, when: ALWAYS });
  for (const [prop, byKey] of Object.entries(record.props ?? {}))
    for (const byValue of Object.values(byKey))
      for (const [value, classes] of Object.entries(byValue))
        out.push({ classes, when: { kind: "prop", prop, value } });
  for (const { props, classes } of Object.values(record.derived ?? {}))
    out.push({ classes, when: { kind: "derived", props } });
  return out;
};

const sorted = (object) =>
  Object.fromEntries(Object.entries(object).sort(([a], [z]) => (a < z ? -1 : a > z ? 1 : 0)));

/** An attribute a JSX element writes, by name (the last, as React reads it). */
const attributeOf = (element, prop) =>
  element.attributes.findLast((a) => a.type === "JSXAttribute" && a.name.name === prop);

/** A part's record from its emissions: each class under its key, by condition, and of what it
    makes from several props, the classes `unset` says it carries when the caller writes none. */
function recordOf(emissions, unset = new Set()) {
  const root = {};
  const props = {};
  const derived = {};
  const sets = {};
  const add = (list, cls) => {
    if (!list.includes(cls)) list.push(cls);
  };
  for (const { classes, when } of emissions)
    for (const cls of classes) {
      const [parsed] = classesOf(cls);
      if (!parsed || reachesOthers(parsed.variants)) continue;
      const { key, categories } = categoriesOf(cls);
      for (const category of categories) add((sets[category] ??= []), key);
      if (when.kind === "always") add((root[key] ??= []), cls);
      else if (when.kind === "prop")
        add((((props[when.prop] ??= {})[key] ??= {})[when.value] ??= []), cls);
      else {
        const entry = (derived[key] ??= { props: [], classes: [] });
        for (const prop of when.props) add(entry.props, prop);
        add(entry.classes, cls);
      }
    }
  for (const entry of Object.values(derived)) entry.props.sort();
  return {
    root: sorted(Object.fromEntries(Object.entries(root).map(([k, v]) => [k, v.sort()]))),
    props: sorted(
      Object.fromEntries(
        Object.entries(props).map(([prop, byKey]) => [
          prop,
          sorted(
            Object.fromEntries(
              Object.entries(byKey).map(([key, byValue]) => [
                key,
                sorted(Object.fromEntries(Object.entries(byValue).map(([v, c]) => [v, c.sort()]))),
              ]),
            ),
          ),
        ]),
      ),
    ),
    derived: sorted(
      Object.fromEntries(
        Object.entries(derived).map(([key, { props, classes }]) => {
          const always = classes.filter((cls) => unset.has(cls)).sort();
          return [
            key,
            { props, classes: classes.sort(), ...(always.length ? { unset: always } : {}) },
          ];
        }),
      ),
    ),
    sets: Object.fromEntries(
      CATEGORIES.filter((category) => sets[category]).map((category) => [
        category,
        sets[category].sort(),
      ]),
    ),
  };
}

/** The `@accepts` entries of a part's className prop, as written. */
function acceptsOf(checker, propsType) {
  const className = propsType?.getProperty("className");
  if (!className) return undefined;
  const tags = className.getJsDocTags(checker).filter((tag) => tag.name === "accepts");
  return tags.flatMap((tag) =>
    ts
      .displayPartsToString(tag.text ?? [])
      .split(/\s+/)
      .filter(Boolean),
  );
}

/**
 * parts.json's `parts`: every public part and member, by name, with the file and line of the
 * function that renders it, its kind, what it sets (root, props, derived), what its className
 * accepts and where the reader stopped. `names` are the barrel's public names; `srcDir` the kit's
 * src.
 */
export function partsData(program, entryFile, srcDir, names) {
  const checker = program.getTypeChecker();
  const parts = publicParts(program, entryFile, names);
  const files = parsedFiles(program, srcDir);
  // The token classes, from the generated table primitives read them through (classFor); none in
  // a tree without it.
  const tokens = program.getSourceFile(path.join(srcDir, "generated/classes.ts"));
  const tableSymbol =
    tokens &&
    checker
      .getExportsOfModule(checker.getSymbolAtLocation(tokens))
      .find((symbol) => symbol.name === "classByToken");
  const classByToken = tableSymbol
    ? Object.fromEntries(
        checker
          .getTypeOfSymbolAtLocation(tableSymbol, tokens)
          .getProperties()
          .map((entry) => [entry.name, checker.getTypeOfSymbolAtLocation(entry, tokens).value]),
      )
    : {};
  const { analyse, renderedFunction, esOf } = reader({ program, files, classByToken });
  const partByFn = new Map();
  for (const part of parts) if (part.fn && !partByFn.has(part.fn)) partByFn.set(part.fn, part.name);

  const records = new Map();
  const inProgress = new Set();
  /** What a function sets, with what the elements it renders set, as emissions and unread. */
  const emissionsOf = (tsFn, depth) => {
    const found = esOf(tsFn);
    if (!found) return { emissions: [], unread: [], unset: new Set() };
    const result = analyse(found.there, found.node, depth);
    const emissions = [...result.emissions];
    const unread = [...result.unread];
    const unset = new Set(result.unset);
    for (const { element, when, reached } of result.renders) {
      const rendered = renderedFunction(found.there, element);
      if (!rendered || rendered.tsFn === tsFn || depth > MAX_DEPTH) continue;
      const partName = partByFn.get(rendered.tsFn);
      const opening = element.openingElement ?? element;
      let inner;
      if (partName) {
        const record = recordFor(partName) ?? {};
        inner = fromRecord(record);
        // What the rendered part makes from props this element gives it none of, when nothing is
        // written, is there when the caller writes nothing here either.
        if (reached)
          for (const { props, unset: classes = [] } of Object.values(record.derived ?? {}))
            if (!props.some((prop) => attributeOf(opening, prop)))
              classes.forEach((cls) => unset.add(cls));
      } else {
        const own = emissionsOf(rendered.tsFn, depth + 1);
        inner = own.emissions;
        if (reached) own.unset.forEach((cls) => unset.add(cls));
      }
      for (const emission of inner) {
        const mapped = mapThrough(emission.when, opening, result);
        if (mapped) emissions.push({ classes: emission.classes, when: both(when, mapped) });
      }
    }
    return { emissions, unread, unset };
  };
  /** A part's record, read once; a part that renders itself through a cycle stops there. */
  function recordFor(name) {
    if (records.has(name)) return records.get(name);
    if (inProgress.has(name)) return undefined;
    inProgress.add(name);
    const part = parts.find((candidate) => candidate.name === name);
    const record = { kind: kindOf(name) };
    if (part.fn) {
      const source = part.fn.getSourceFile();
      Object.assign(record, {
        file: path.relative(srcDir, source.fileName).split(path.sep).join("/"),
        line: source.getLineAndCharacterOfPosition(part.fn.getStart()).line + 1,
      });
      const { emissions, unread, unset } = emissionsOf(part.fn, 0);
      Object.assign(record, recordOf(emissions, unset));
      // A part whose props take no className: no caller's class meets what it sets.
      const takesClassName = Boolean(part.props?.getProperty("className"));
      if (!takesClassName) record.className = false;
      const accepts = acceptsOf(checker, part.props);
      if (accepts?.length) {
        const problems = accepts.map((entry) => acceptsProblem(name, entry)).filter(Boolean);
        if (problems.length) throw new Error(problems.join("\n"));
        record.accepts = accepts;
      }
      const stops = [
        ...new Set(takesClassName ? unread : unread.filter((stop) => !stop.startsWith(NO_ELEMENT))),
      ];
      if (stops.length) record.unread = stops.slice(0, MAX_UNREAD);
    } else record.unread = ["the kit renders no function of its own for it"];
    inProgress.delete(name);
    records.set(name, record);
    return record;
  }
  return Object.fromEntries(parts.map((part) => [part.name, recordFor(part.name)]));
}
