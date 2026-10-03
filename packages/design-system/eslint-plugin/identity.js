// Which kit part a JSX tag is, for every rule that judges one. A part is known by its binding, not
// its name: `import { Table as T }` makes `<T.Cell>` the kit's Table.Cell, `import * as L` makes
// `<L.Id>` its Id, and a local `function Table()`, another package's `Table` or a parameter named
// `Table` is no kit part at all.
//
// - kitPartOf is the strict identity the class-policy rules use (cell-plain, id-not-blue,
//   button-icon-slot, use-primitives, prefer-text-link's Button, the product layout rules): the tag's
//   root must be bound, by a value import, to the kit.
// - partNameOf is the identity the behaviour rules use (overlays, footers, navigation, renamed
//   names), which judge a defect any part of that name has: the kit part when the tag is one, else
//   the name as written, and nothing for a parameter or a local that shadows an outer name.
// - kitBindingOf is a binding to the kit whatever name it imports, for what the kit renamed or
//   retired (no-deprecated-name's props and its fix), since a retired name is in no inventory.
//   isKitHomeBinding narrows it for a renamed prop in the kit's own source, where a private part
//   may share a public part's name: only an import of the part's home module counts there.
// - classOwnerOf says which part the classes on an element land on: Base UI's `render` replaces the
//   element, so `<DialogTrigger render={<Button />} className="…">` styles a Button; and a component
//   of the file that hands its className on to a part (`const Pad = (props) => <TabsContent
//   {...props} />`) puts `<Pad className="…">`'s classes on that part.
// - forwardedTo is that hand-on for any prop: the element of a same-file component a prop given at
//   its call site reaches, for a rule that judges a prop, the children or a render.
//
// What the kit is depends on where the lint runs. In a product (the recommended preset) it is an
// import from exactly "@ledger/design-system". In the kit's own source (the package preset sets
// `settings.ledger.kit` to "self"), it is also any relative import that resolves inside the src
// folder the linted file sits in, outside stories/ and lib/, and, in a file outside those folders
// that is no story, a top-level declaration of the file itself, when the part's root name is one
// the package exports (components.json).
//
// A tag or a member root is a value, so a type alias, an interface or a type parameter of the same
// name (typescript-eslint scopes them) neither hides the part nor shadows it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const inventory = JSON.parse(fs.readFileSync(path.join(here, "components.json"), "utf8"));
/** The package's public component names, generated from its barrel during the build. */
export const KIT_PARTS = new Set(inventory.components);
/** Each public part's home: the module under src that declares it (`components/card`). */
const HOMES = inventory.homes ?? {};
/** The one source a product imports the kit from. */
export const PACKAGE = "@ledger/design-system";
/** Folders of the kit's src whose exports are no parts: the documentation and the helpers. */
const NOT_PARTS = new Set(["stories", "lib"]);

/* ---------- names ---------- */

/** A JSX name as written: `Button`, `Shell.TopNav.Item`; "" for a namespaced name (`svg:rect`). */
export const jsxTag = (node) =>
  node?.type === "JSXIdentifier"
    ? node.name
    : node?.type === "JSXMemberExpression"
      ? `${jsxTag(node.object)}.${node.property.name}`
      : "";

/** A member chain of plain names as written (`Kit.Shell.Sidebar`), or "" for anything else. */
const memberTag = (node) =>
  node?.type === "Identifier"
    ? node.name
    : node?.type === "MemberExpression" && !node.computed && node.property.type === "Identifier"
      ? (() => {
          const object = memberTag(node.object);
          return object && `${object}.${node.property.name}`;
        })()
      : "";

/** The dotted name a JSX name or a member expression is written as. */
const written = (node) =>
  node?.type === "MemberExpression" || node?.type === "Identifier" ? memberTag(node) : jsxTag(node);

/** A lowercase JSX name (`a`, `button`, `my-element`) is an intrinsic element, never a variable. */
const intrinsic = (node) => node?.type === "JSXIdentifier" && /^[a-z]/.test(node.name);

/** A variable that holds a value; a type alias, an interface or a type parameter does not. */
const isValue = (variable) => variable.isValueVariable !== false;

/** The value variable a name refers to where it is written, walking out from its scope; none for
    an intrinsic element, whatever the file declares under its name. Remembered per node and name,
    since every rule that asks what a tag is asks it of the same node. */
const variables = new WeakMap();
function variableOf(context, node, name) {
  if (intrinsic(node)) return undefined;
  let known = variables.get(node);
  if (!known) variables.set(node, (known = new Map()));
  if (known.has(name)) return known.get(name);
  let found;
  for (let scope = context.sourceCode.getScope(node); scope; scope = scope.upper) {
    const variable = scope.set.get(name);
    if (variable && isValue(variable)) {
      found = variable;
      break;
    }
  }
  known.set(name, found);
  return found;
}

/* ---------- what the kit is, per file ---------- */

/** Per file: whether it is the kit's own source, and the src folder it sits in. */
const files = new WeakMap();
function fileOf(context) {
  const { sourceCode } = context;
  if (files.has(sourceCode)) return files.get(sourceCode);
  const self = context.settings?.ledger?.kit === "self";
  let src;
  if (self && context.filename && path.isAbsolute(context.filename)) {
    // The innermost folder named src above the file: the kit's own, wherever it is checked out.
    for (let dir = path.dirname(context.filename); ; dir = path.dirname(dir)) {
      if (path.basename(dir) === "src") {
        src = dir;
        break;
      }
      if (path.dirname(dir) === dir) break;
    }
  }
  // Whether the file is the kit's documentation (its stories tree, or a story file), and whether
  // its own top-level declarations can be parts: not in a story, and not in the folders whose
  // exports are no parts.
  const inside = src ? path.relative(src, context.filename).split(path.sep) : [];
  const story =
    Boolean(src) && (inside[0] === "stories" || /\.stories\.[cm]?[jt]sx?$/.test(context.filename));
  const declares = Boolean(src) && !story && !NOT_PARTS.has(inside[0]);
  const file = {
    self,
    src,
    story,
    declares,
    dir: path.dirname(context.filename ?? ""),
    // What each tag is and where its classes land, answered once for every rule that asks.
    parts: new WeakMap(),
    owners: new WeakMap(),
    // Which element of each same-file component a prop reaches (forwardedTo), per component, and
    // the elements each one hands it to (receiverAt).
    forwards: new WeakMap(),
    receivers: new WeakMap(),
    // The names the file declares a component under (declaredComponents), once asked.
    components: undefined,
    // Each component's JSX elements (elementsIn).
    elements: new WeakMap(),
  };
  files.set(sourceCode, file);
  return file;
}

/** Whether the linted file is the kit's own source (the package preset's `settings.ledger.kit`). */
export const isKitSourceFile = (context) => fileOf(context).self;

/** Whether the linted file is the kit's documentation: under its src/stories, or a story file. */
export const isKitStoryFile = (context) => fileOf(context).story;

/** The kit's src folder when the linted file is its own source, else undefined; the class reader
    resolves the kit's helper modules (lib/cn, lib/base-ui) against it. */
export const kitSrcOf = (context) => fileOf(context).src;

/** Whether an import source is the kit, as this file sees it. */
function isKitSource(context, source) {
  if (source === PACKAGE) return true;
  const file = fileOf(context);
  if (!file.self || !file.src || typeof source !== "string" || !source.startsWith("."))
    return false;
  const inside = path.relative(file.src, path.resolve(file.dir, source));
  if (inside.startsWith("..") || path.isAbsolute(inside)) return false;
  return !NOT_PARTS.has(inside.split(path.sep)[0]);
}

/** A value import's binding: its source and the name it imports, or NAMESPACE for `* as`. */
const NAMESPACE = Symbol("namespace");
function importOf(variable) {
  const definition = variable.defs.find((candidate) => candidate.type === "ImportBinding");
  if (!definition) return undefined;
  const declaration = definition.parent;
  const specifier = definition.node;
  if (declaration.importKind === "type" || specifier.importKind === "type") return undefined;
  const source = declaration.source.value;
  if (specifier.type === "ImportNamespaceSpecifier") return { source, imported: NAMESPACE };
  if (specifier.type === "ImportSpecifier")
    return { source, imported: specifier.imported.name ?? specifier.imported.value };
  return { source, imported: undefined };
}

const topLevel = (node) =>
  node?.type === "Program" ||
  ((node?.type === "ExportNamedDeclaration" || node?.type === "ExportDefaultDeclaration") &&
    node.parent?.type === "Program");

/** A top-level function, class or single-name const of the file itself. */
function declaredAtTop(variable) {
  if (!["module", "global"].includes(variable.scope.type)) return false;
  return variable.defs.some((definition) =>
    definition.type === "FunctionName" || definition.type === "ClassName"
      ? topLevel(definition.node.parent)
      : definition.type === "Variable" &&
        definition.node.id?.type === "Identifier" &&
        topLevel(definition.parent?.parent),
  );
}

/**
 * What a variable is as the root of a kit part's name: the part's root name ("Table"), NAMESPACE
 * for a namespace import of the kit, or "" when it is no kit binding. Remembered per variable, and
 * a variable belongs to one file's scope.
 */
const roots = new WeakMap();
function kitRootOf(context, variable) {
  if (roots.has(variable)) return roots.get(variable);
  let root = "";
  const binding = importOf(variable);
  if (binding) {
    if (isKitSource(context, binding.source))
      root =
        binding.imported === NAMESPACE
          ? NAMESPACE
          : KIT_PARTS.has(binding.imported)
            ? binding.imported
            : "";
  } else if (fileOf(context).declares && KIT_PARTS.has(variable.name) && declaredAtTop(variable))
    root = variable.name;
  roots.set(variable, root);
  return root;
}

/** The kit part a name stands for, from the variable its root refers to and the rest of it. */
function partFrom(context, variable, rest) {
  if (!variable) return "";
  const root = kitRootOf(context, variable);
  if (root === NAMESPACE) return rest.length && KIT_PARTS.has(rest[0]) ? rest.join(".") : "";
  return root ? [root, ...rest].join(".") : "";
}

/** The kit part a dotted name stands for where `node` is, or "". */
function resolve(context, node, name) {
  if (!name) return "";
  const [head, ...rest] = name.split(".");
  return partFrom(context, variableOf(context, node, head), rest);
}

/* ---------- the three questions ---------- */

/**
 * The kit part a JSX name (or a member expression) stands for, as a canonical dotted name
 * (`Table.Cell`, `Shell.TopNav.Item`), or "" when its root is not bound to the kit: an alias
 * resolves to the name it imports, a namespace's root is dropped, and a type-only import, a local
 * look-alike, another package's part and a parameter are none.
 */
export const kitPartOf = (context, nameNode) => {
  const { parts } = fileOf(context);
  let part = parts.get(nameNode);
  if (part === undefined)
    parts.set(nameNode, (part = resolve(context, nameNode, written(nameNode))));
  return part;
};

/** Whether a variable is no part at all: a parameter, or a local that shadows an outer value of
    its name (an outer type of that name is no part it could shadow). */
function notAPart(variable) {
  if (variable.defs.some(({ type }) => type === "Parameter" || type === "CatchClause")) return true;
  if (["module", "global"].includes(variable.scope.type)) return false;
  for (let scope = variable.scope.upper; scope; scope = scope.upper) {
    const outer = scope.set.get(variable.name);
    if (outer && isValue(outer)) return true;
  }
  return false;
}

/**
 * What a name is bound to where it is written: `bound`, the kit's name for it when its root is a
 * value import from the kit (a part, or a name that is no part today, such as a retired export) or
 * from a source `sources` matches, else ""; and the variable its root refers to.
 */
function bindingOf(context, node, name, sources) {
  const [head, ...rest] = name.split(".");
  const variable = variableOf(context, node, head);
  const part = partFrom(context, variable, rest);
  if (part) return { bound: part, variable };
  const binding = variable && importOf(variable);
  if (binding?.imported && (isKitSource(context, binding.source) || sources?.test(binding.source)))
    return {
      bound:
        binding.imported === NAMESPACE ? rest.join(".") : [binding.imported, ...rest].join("."),
      variable,
    };
  return { bound: "", variable };
}

/**
 * The kit's name for a tag or a member chain when its root is bound to an import from the kit, or
 * from a source `sources` matches (the product's shell), aliases and namespaces resolved; "" for
 * anything else. A fix that renames a part writes only where this holds.
 */
export function kitBindingOf(context, nameNode, { sources } = {}) {
  const name = written(nameNode);
  return name ? bindingOf(context, nameNode, name, sources).bound : "";
}

/** A relative import's module under the kit's src, without its extension; a folder is its index. */
const modules = new Map();
function moduleOf(file, source) {
  const resolved = path.resolve(file.dir, source);
  let inside = modules.get(resolved);
  if (inside === undefined) {
    inside = path
      .relative(file.src, resolved)
      .replace(/\.[cm]?[jt]sx?$/, "")
      .split(path.sep)
      .join("/");
    try {
      if (fs.statSync(resolved).isDirectory()) inside = `${inside}/index`;
    } catch {
      // A file named without its extension, which is no folder.
    }
    modules.set(resolved, inside);
  }
  return inside;
}

/**
 * Whether a tag that kitBindingOf binds to `part` is that part where a rename applies to it. In a
 * product, the kit's import is the part. In the kit's own source a private part may share a public
 * part's name (the chart's own Card, a local Switch), so only a relative import of the part's home
 * module (components.json's `homes`), or of a barrel (an index module), counts, and a declaration
 * of the file itself never does. A name the inventory does not list (ChartDonut) has no home to
 * compare, and its import decides.
 */
export function isKitHomeBinding(context, nameNode, part) {
  const file = fileOf(context);
  if (!part || !file.self) return Boolean(part);
  const [head] = written(nameNode).split(".");
  const variable = variableOf(context, nameNode, head);
  const binding = variable && importOf(variable);
  if (!binding) return false;
  if (binding.source === PACKAGE || !file.src) return true;
  const root = part.split(".")[0];
  const home = Object.hasOwn(HOMES, root) ? HOMES[root] : undefined;
  if (!home) return true;
  const inside = moduleOf(file, binding.source);
  return inside === home || /(^|\/)index$/.test(inside);
}

/**
 * The name a behaviour rule judges a tag by: the kit's name when it is bound to the kit
 * (kitBindingOf); for another package's part, the name it imports (`import { DialogContent as
 * Content }` is DialogContent, `UI.DialogContent` is DialogContent), since it has the same defect;
 * for a local look-alike, the name as written; and "" when its root is a parameter or a local that
 * shadows an outer name, which is no part at all.
 */
export function partNameOf(context, nameNode, { sources } = {}) {
  const name = written(nameNode);
  if (!name) return "";
  const { bound, variable } = bindingOf(context, nameNode, name, sources);
  if (bound) return bound;
  const binding = variable && importOf(variable);
  if (binding) {
    const rest = name.split(".").slice(1);
    if (binding.imported === NAMESPACE) return rest.join(".");
    return binding.imported ? [binding.imported, ...rest].join(".") : name;
  }
  return !variable || !notAPart(variable) ? name : "";
}

/**
 * Whether a tag's root is a parameter or a local that shadows an outer value of its name (the
 * kit's import, a top-level component): what it renders is not the outer one, so a rule that
 * judges any component by its props leaves it alone. A parameter that shadows nothing (`({ Action
 * }) => <Action … />`) is a component the caller gives, which such a rule still judges.
 */
export function shadowsOuterName(context, nameNode) {
  const [head] = written(nameNode).split(".");
  const variable = head ? variableOf(context, nameNode, head) : undefined;
  if (!variable || ["module", "global"].includes(variable.scope.type)) return false;
  for (let scope = variable.scope.upper; scope; scope = scope.upper) {
    const outer = scope.set.get(variable.name);
    if (outer && isValue(outer)) return true;
  }
  return false;
}

/** The name a message gives a tag: the kit part it is, or the name as written. */
export const displayNameOf = (context, nameNode) =>
  kitPartOf(context, nameNode) || jsxTag(nameNode);

const unwrap = (node) => {
  while (
    node &&
    [
      "JSXExpressionContainer",
      "TSAsExpression",
      "TSSatisfiesExpression",
      "TSNonNullExpression",
    ].includes(node.type)
  )
    node = node.expression;
  return node;
};

/** The name a render function's first parameter hands its props on under: `props` in
    `(props) => …`, `rest` in `({ children, ...rest }) => …` when className stays in the rest. */
function forwardedName(fn) {
  const [first] = fn.params;
  if (first?.type === "Identifier") return first.name;
  if (first?.type !== "ObjectPattern") return undefined;
  const rest = first.properties.find((property) => property.type === "RestElement");
  const keeps = first.properties.some(
    (property) =>
      property.type === "Property" && (property.key.name ?? property.key.value) === "className",
  );
  return !keeps && rest?.argument.type === "Identifier" ? rest.argument.name : undefined;
}

/**
 * The element a `render` prop puts in this element's place, when the element's props (its
 * className with them) reach it: `render={<Button />}`, or a render function whose returned
 * element spreads the function's first parameter. Undefined when there is none, when the value
 * cannot be read, or when the function renders without handing its props on.
 */
export function renderedElementOf(opening) {
  const attribute = opening.attributes.findLast(
    (candidate) => candidate.type === "JSXAttribute" && candidate.name.name === "render",
  );
  const value = unwrap(attribute?.value);
  if (value?.type === "JSXElement") return value;
  if (value?.type !== "ArrowFunctionExpression" && value?.type !== "FunctionExpression")
    return undefined;
  const spread = forwardedName(value);
  if (!spread) return undefined;
  const body =
    value.body.type === "BlockStatement"
      ? unwrap(value.body.body.find((statement) => statement.type === "ReturnStatement")?.argument)
      : unwrap(value.body);
  if (body?.type !== "JSXElement") return undefined;
  const forwards = body.openingElement.attributes.some(
    (candidate) =>
      candidate.type === "JSXSpreadAttribute" &&
      candidate.argument.type === "Identifier" &&
      candidate.argument.name === spread,
  );
  return forwards ? body : undefined;
}

/* ---------- components of the file that hand a prop on ---------- */

/** `memo(…)`, `forwardRef(…)` and `React.memo(…)`, which declare a component around a function. */
const COMPONENT_CALL = /^(React\.)?(memo|forwardRef)$/;

/** The capitalised names the file declares once, as a function or a const, in any scope: the
    only names componentOf can find a component under, gathered once per file so that a tag the
    file imports (most of them) is answered without a scope lookup. */
function declaredComponents(context) {
  const file = fileOf(context);
  if (file.components === undefined) {
    const scopes = context.sourceCode.scopeManager?.scopes;
    // Without a scope manager every name is asked of its scope, as before the list.
    file.components = scopes ? new Set() : null;
    // A module declares nothing in the global scope, which holds the ~1,300 browser and TS lib
    // globals; walking it per file cost more than the list saves.
    const isModule = context.sourceCode.ast.sourceType === "module";
    for (const scope of scopes ?? [])
      if (!(isModule && scope.type === "global"))
        for (const variable of scope.variables)
          if (
            /^[A-Z]/.test(variable.name) &&
            variable.defs.length === 1 &&
            (variable.defs[0].type === "FunctionName" || variable.defs[0].parent?.kind === "const")
          )
            file.components.add(variable.name);
  }
  return file.components;
}

/** The function a capitalised JSX name stands for when the file declares it: a function, or a
    const that holds one (under memo or forwardRef too). An import, a parameter, a member name and
    anything else are none. */
function componentOf(context, nameNode) {
  if (nameNode?.type !== "JSXIdentifier" || !/^[A-Z]/.test(nameNode.name)) return undefined;
  if (declaredComponents(context)?.has(nameNode.name) === false) return undefined;
  const variable = variableOf(context, nameNode, nameNode.name);
  if (!variable || variable.defs.length !== 1) return undefined;
  const [definition] = variable.defs;
  if (definition.type === "FunctionName") return definition.node;
  if (
    definition.type !== "Variable" ||
    definition.parent?.kind !== "const" ||
    definition.node.id !== definition.name
  )
    return undefined;
  let init = unwrap(definition.node.init);
  for (let depth = 0; init?.type === "CallExpression" && depth < 3; depth++) {
    if (!COMPONENT_CALL.test(memberTag(init.callee))) return undefined;
    init = unwrap(init.arguments[0]);
  }
  return init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression"
    ? init
    : undefined;
}

/** The props pattern a component's body destructures its props object with, as its first const
    of that shape at the top of the body (`const { className, ...rest } = props;`), or undefined. */
function bodyPatternOf(fn, name) {
  if (fn.body?.type !== "BlockStatement") return undefined;
  for (const statement of fn.body.body) {
    if (statement.type !== "VariableDeclaration" || statement.kind !== "const") continue;
    const declarator = statement.declarations.find(
      (candidate) =>
        candidate.id.type === "ObjectPattern" &&
        unwrap(candidate.init)?.type === "Identifier" &&
        unwrap(candidate.init).name === name,
    );
    if (declarator) return declarator;
  }
  return undefined;
}

/** How a destructuring pattern holds `prop`: `{ local }`, the name it is destructured to, or
    `{ rest }`, the rest that still carries it; null when it drops it, undefined when the lint
    cannot tell (a computed key). */
function patternHolds(pattern, prop) {
  for (const property of pattern.properties) {
    if (property.type !== "Property") continue;
    if (property.computed) return undefined;
    if ((property.key.name ?? property.key.value) !== prop) continue;
    const value =
      property.value?.type === "AssignmentPattern" ? property.value.left : property.value;
    return value?.type === "Identifier" ? { local: value.name } : undefined;
  }
  const rest = pattern.properties.find((property) => property.type === "RestElement");
  return rest?.argument.type === "Identifier" ? { rest: rest.argument.name } : null;
}

/** How a component's first parameter holds `prop`: `{ whole }`, the props object; `{ local }`, the
    name it is destructured to; `{ rest }`, the rest of a destructured object, which still carries
    it. A props object the body destructures (`const { className } = props`) holds it both ways,
    with the destructuring's `declarator`. Undefined when it holds no such prop the lint can
    follow. */
function carrierOf(fn, prop) {
  let first = fn.params[0];
  if (first?.type === "AssignmentPattern") first = first.left;
  if (first?.type === "Identifier") {
    const declarator = bodyPatternOf(fn, first.name);
    const held = declarator && patternHolds(declarator.id, prop);
    return held ? { whole: first.name, ...held, declarator } : { whole: first.name };
  }
  if (first?.type !== "ObjectPattern") return undefined;
  return patternHolds(first, prop) ?? undefined;
}

/** Whether an identifier is what the carrier names where it is written: `fn`'s own parameter of
    that name, or a name its body's props destructuring declares, not a local that shadows them. */
const isCarriedBy = (context, identifier, fn, carrier) => {
  const definition = variableOf(context, identifier, identifier.name)?.defs[0];
  if (definition?.type === "Parameter") return definition.node === fn;
  return (
    Boolean(carrier.declarator) &&
    definition?.type === "Variable" &&
    definition.node === carrier.declarator
  );
};

/** Whether a value hands on what the carrier holds: the destructured name, the props object's
    member of that key (`props.className`, `rest.className`), or either inside a call's arguments,
    a template, a condition or a fallback (`cn("p-0", className)`). */
function handsOn(context, node, fn, prop, carrier) {
  const value = unwrap(node);
  if (!value) return false;
  const again = (child) => handsOn(context, child, fn, prop, carrier);
  switch (value.type) {
    case "Identifier":
      return value.name === carrier.local && isCarriedBy(context, value, fn, carrier);
    case "MemberExpression": {
      const object = unwrap(value.object);
      return (
        !value.computed &&
        value.property.name === prop &&
        object?.type === "Identifier" &&
        (object.name === carrier.whole || object.name === carrier.rest) &&
        isCarriedBy(context, object, fn, carrier)
      );
    }
    case "CallExpression":
      return value.arguments.some((argument) =>
        again(argument.type === "SpreadElement" ? argument.argument : argument),
      );
    case "TemplateLiteral":
      return value.expressions.some(again);
    case "ConditionalExpression":
      return again(value.consequent) || again(value.alternate);
    case "LogicalExpression":
      return again(value.left) || again(value.right);
    case "ArrayExpression":
      return value.elements.some((element) =>
        again(element?.type === "SpreadElement" ? element.argument : element),
      );
    default:
      return false;
  }
}

/** Whether a JSX element of `fn` is handed the call site's `prop`: the last attribute that can set
    it decides, the props object (or the rest that carries it) spread onto the element, or the
    prop written from what the carrier holds. Children written inside the element replace the
    children a spread brings, so then one of them must be the carrier's. */
function receives(context, opening, fn, prop, carrier) {
  if (prop === "children") {
    const written = opening.parent.children.filter(
      (child) => !(child.type === "JSXText" && !child.value.trim()),
    );
    if (written.length)
      return written.some(
        (child) =>
          child.type === "JSXExpressionContainer" &&
          handsOn(context, child.expression, fn, prop, carrier),
      );
  }
  for (const item of [...opening.attributes].reverse()) {
    if (item.type === "JSXSpreadAttribute") {
      const argument = unwrap(item.argument);
      if (
        argument?.type === "Identifier" &&
        (argument.name === carrier.whole || argument.name === carrier.rest) &&
        isCarriedBy(context, argument, fn, carrier)
      )
        return true;
    } else if (item.name.type === "JSXIdentifier" && item.name.name === prop)
      return handsOn(context, item.value, fn, prop, carrier);
  }
  return false;
}

/** The `index`th element of a component's body that is handed `prop`, in source order, or
    undefined past the last: the elements are judged only as far as a caller asks, and each once
    per component and prop, since the first one is most often where the prop lands. */
function receiverAt(context, fn, prop, index) {
  const { receivers } = fileOf(context);
  let byProp = receivers.get(fn);
  if (!byProp) receivers.set(fn, (byProp = new Map()));
  let found = byProp.get(prop);
  if (!found) {
    const carrier = carrierOf(fn, prop);
    found = { carrier, elements: carrier ? elementsIn(context, fn) : [], next: 0, list: [] };
    byProp.set(prop, found);
  }
  while (found.list.length <= index && found.next < found.elements.length) {
    const node = found.elements[found.next++];
    if (receives(context, node, fn, prop, found.carrier)) found.list.push(node);
  }
  return found.list[index];
}

/** A component's JSX opening elements in source order, gathered once for every prop asked. */
function elementsIn(context, fn) {
  const { elements } = fileOf(context);
  let found = elements.get(fn);
  if (found) return found;
  const keys = context.sourceCode.visitorKeys;
  found = [];
  const visit = (node) => {
    if (node.type === "JSXOpeningElement") found.push(node);
    for (const key of keys[node.type] ?? [])
      for (const child of [node[key]].flat())
        if (child && typeof child.type === "string") visit(child);
  };
  visit(fn.body);
  elements.set(fn, found);
  return found;
}

/** How many components of the file a prop is followed through, the one it is given to first. */
const REACH = 4;
/** What a component hands a prop to when every element it hands it to comes back round. */
const ROUND = Symbol("round");

/**
 * Where `prop` lands from inside the component `fn`, `route` the components it has come through:
 * its first receiver in source order that is no component of the file (a kit part, an element, an
 * import), or where a receiver that is one hands it on in turn. A receiver that renders a component
 * already on the route (a component that renders itself, two that render each other) is passed
 * over for the next one; one that hands the prop to nothing is where it lands; past REACH
 * components, the receiver is. Null when `fn` hands it to nothing, ROUND when every receiver comes
 * back round.
 */
function landingFrom(context, fn, prop, route) {
  let receiver = receiverAt(context, fn, prop, 0);
  if (!receiver) return null;
  for (let index = 1; receiver; receiver = receiverAt(context, fn, prop, index++)) {
    const inner = componentOf(context, receiver.name);
    if (!inner) return receiver;
    if (route.has(inner)) continue;
    if (route.size >= REACH) return receiver;
    route.add(inner);
    const landed = landingFrom(context, inner, prop, route);
    route.delete(inner);
    if (landed !== ROUND) return landed ?? receiver;
  }
  return ROUND;
}

/**
 * Where a prop given to a JSX element lands when the element is a component of this file that
 * hands it on: `{ element, wrapper }`, the opening element that receives it (followed through the
 * file's components it is handed to in turn, up to REACH components in all) and the component's
 * name as written; undefined when the element is no such component or the prop reaches no element.
 * A wrapper is a capitalised same-file component, a function or a const that holds one, whose first
 * parameter forwards the prop: the props object or the rest that still carries it, spread onto an
 * element, or the prop destructured (in the parameter, or from the props object at the top of the
 * body) and written onto one. Of the elements it hands the prop to, the first in source order
 * counts, passing over one that renders a component already on the way. Which part the element is
 * stays the caller's question, by its rule's identity (kitPartOf, partNameOf, classOwnerOf).
 * Remembered per component and prop.
 */
export function forwardedTo(context, opening, prop) {
  const fn = componentOf(context, opening.name);
  if (!fn) return undefined;
  const { forwards } = fileOf(context);
  let byProp = forwards.get(fn);
  if (!byProp) forwards.set(fn, (byProp = new Map()));
  let element = byProp.get(prop);
  if (element === undefined) {
    const landed = landingFrom(context, fn, prop, new Set([fn]));
    byProp.set(prop, (element = landed === ROUND ? null : landed));
  }
  return element ? { element, wrapper: jsxTag(opening.name) } : undefined;
}

/**
 * The part the classes on a JSX element land on. `via` is "self" when the element wears them,
 * "render" when its `render` puts a kit part in its place, which then owns them, and "wrapper" when
 * it is a component of this file that hands its className on to a part (forwardedTo, which stops
 * after REACH components); `wrapper` names the element that renders or forwards (as the kit part
 * it is, or as written). A render element that is no kit part (`render={<a />}`) leaves the classes
 * with the element itself.
 */
export function classOwnerOf(context, opening) {
  const { owners } = fileOf(context);
  let owner = owners.get(opening);
  if (!owner) owners.set(opening, (owner = propOwnerOf(context, opening, "className")));
  return owner;
}

/**
 * The part a prop given to a JSX element lands on, as classOwnerOf says it of className: the kit
 * part the element is, the one its `render` puts in its place, or the one a component of this file
 * hands the prop on to (`style` through `<Pane style={…}>`); `{ part: "" }` when none.
 */
export function propOwnerOf(context, opening, prop) {
  const own = partHere(context, opening);
  if (own.part) return own;
  // A prop reaches a component of the file as an attribute or in a spread.
  const given = opening.attributes.some(
    (item) => item.type === "JSXSpreadAttribute" || item.name.name === prop,
  );
  const forwarded = given ? forwardedTo(context, opening, prop) : undefined;
  // The element it lands on as the part it is or renders: forwardedTo has followed the file's
  // components as far as it reaches.
  const inner = forwarded ? partHere(context, forwarded.element).part : "";
  return inner ? { part: inner, via: "wrapper", wrapper: forwarded.wrapper } : own;
}

/** The part an element is, or the kit part its `render` puts in its place. */
function partHere(context, opening) {
  const self = kitPartOf(context, opening.name);
  const rendered = renderedElementOf(opening);
  const part = rendered ? kitPartOf(context, rendered.openingElement.name) : "";
  if (part) return { part, via: "render", wrapper: self || jsxTag(opening.name) };
  return { part: self, via: "self", wrapper: "" };
}
