// What an expression's value is, as far as one file can say: the resolver every rule that follows a
// value shares (the class reader in class-sites.js today; style values from batch 5). It follows a
// name to where it is declared, a member to the entry of a same-file map, a call to the values a
// same-file function returns, and a destructured name to its own slot of the initialiser. What it
// cannot read it says, as `{ node, reason }`, never as nothing:
//
//   imported       a name imported from another module
//   imported-call  a call of a function imported from another module
//   call           a call the reader cannot follow
//   prop           a component's prop other than className, or a parameter
//   reassigned     a variable written after it is declared (a received className written too)
//   escaped        an object handed to something that may change it (contextual mode)
//   member         a member the reader cannot find
//   spread         an entry behind a spread the reader cannot read
//   computed-key   a key only known at runtime (contextual mode)
//   rest           a rest element, which is no one slot of its initialiser
//   shape          a destructuring route into a value of another shape
//   unknown        a name with no declaration the reader can use
//   expression     any other expression
//
// class-sites.js adds glued-template and tagged-template, which only a class can be.
//
// Two modes. `vocabulary` (the default; the token rules) reads every string that can render, as
// Tailwind's scanner would: a dynamic key reads every entry of a readable map, and an object handed
// to a call is still read. `contextual` (a rule that judges what lands on one element, from batch 5)
// takes shadcn's semantics: the last write wins, and a dynamic key or an escaped object is
// unreadable. Ported from @shadcn/lint's sites/collect.ts.

/** Wrappers that change a value's type, not its value. */
const WRAPPERS = new Set([
  "TSAsExpression",
  "TSSatisfiesExpression",
  "TSNonNullExpression",
  "TSTypeAssertion",
  "ChainExpression",
  "JSXExpressionContainer",
  "ParenthesizedExpression",
]);

/** The expression under its type wrappers: `x as const`, `x!`, `a?.b`, `{x}` in JSX. */
export function unwrap(node) {
  while (node && WRAPPERS.has(node.type)) node = node.expression;
  return node;
}

/** A key written as a string (`"a"`, `` `a` ``, `0`), or null. */
export function staticKey(key) {
  if (key?.type === "Literal") return String(key.value);
  if (key?.type === "TemplateLiteral" && key.expressions.length === 0)
    return key.quasis[0]?.value.cooked ?? null;
  return null;
}

/** A property's key when the source fixes it (`a`, `"a"`, `["a"]`), or null. */
export function keyName(property) {
  if (property?.type !== "Property") return null;
  if (property.computed) return staticKey(unwrap(property.key));
  return property.key.type === "Identifier" ? property.key.name : staticKey(property.key);
}

/** The key a member reads when the source fixes it (`a.b`, `a["b"]`, `a[0]`), or null. */
export function memberKey(member) {
  if (!member.computed) return member.property.type === "Identifier" ? member.property.name : null;
  return staticKey(unwrap(member.property));
}

/* ---------- names ---------- */

/** The variable a name refers to where it is written, walking out from its scope. A value is never
    a type: a type alias, an interface or a type parameter of the same name (typescript-eslint
    scopes them) does not hide it. */
export function variableOf(context, identifier) {
  for (let scope = context.sourceCode.getScope(identifier); scope; scope = scope.upper) {
    const variable = scope.set.get(identifier.name);
    if (variable && variable.isValueVariable !== false) return variable;
  }
  return undefined;
}

/** A global's own method (`Object.freeze`, `Object.values`) where no binding hides the global. */
export function globalMethod(context, callee, object, method) {
  const node = unwrap(callee);
  if (node?.type !== "MemberExpression" || memberKey(node) !== method) return false;
  const root = unwrap(node.object);
  return (
    root?.type === "Identifier" && root.name === object && !variableOf(context, root)?.defs.length
  );
}

/** `Object.freeze(x)` is x. */
const frozenOf = (context, call) =>
  call?.type === "CallExpression" && globalMethod(context, call.callee, "Object", "freeze")
    ? call.arguments[0]
    : undefined;

/** `* as` in an import. */
export const NAMESPACE = Symbol("namespace");

/** A value import's binding: its source and the name it imports ("default", or NAMESPACE). A
    type-only import is none. */
export function importOf(variable) {
  const definition = variable?.defs.find((candidate) => candidate.type === "ImportBinding");
  if (!definition) return undefined;
  if (definition.parent.importKind === "type" || definition.node.importKind === "type")
    return undefined;
  const source = String(definition.parent.source.value);
  if (definition.node.type === "ImportNamespaceSpecifier") return { source, imported: NAMESPACE };
  if (definition.node.type === "ImportDefaultSpecifier") return { source, imported: "default" };
  return {
    source,
    imported: definition.node.imported.name ?? String(definition.node.imported.value),
  };
}

/** The expression a reference stands in, above its type wrappers. */
function referenceExpression(node) {
  while (WRAPPERS.has(node.parent?.type) && node.parent.expression === node) node = node.parent;
  return node;
}

const isObjectAssign = (callee) =>
  callee?.type === "MemberExpression" &&
  callee.object.type === "Identifier" &&
  callee.object.name === "Object" &&
  memberKey(callee) === "assign";

/**
 * Whether a variable is written after it is declared: assigned again (`k = …`, `k ??= …`, `k++`),
 * or its object changed through it (`k.a = …`, `delete k.a`, `k.a++`, `({ a: k.b } = …)`,
 * `Object.assign(k, …)`, `k.push(…)`, `k.unshift(…)`, `k.splice(…)`, `k.fill(…)`). A binding keeps
 * the reference, not the contents, so either makes the value it was declared with a guess.
 */
const written = new WeakMap();
export function isWritten(variable) {
  // A scope's variable keeps its references while a file is linted, so each is read once; a
  // single reference handed in on its own (ownWrites) is read each time.
  if (!variable.defs) return writtenNow(variable);
  let known = written.get(variable);
  if (known === undefined) written.set(variable, (known = writtenNow(variable)));
  return known;
}
function writtenNow(variable) {
  return variable.references.some((reference) => {
    if (reference.isWrite() && !reference.init) return true;
    const id = referenceExpression(reference.identifier);
    let member = id;
    while (member.parent?.type === "MemberExpression" && member.parent.object === member)
      member = referenceExpression(member.parent);
    if (member !== id) {
      // A destructuring target: `({ a: k.b } = …)`, `[k.b] = …`.
      let target = member;
      while (
        (target.parent?.type === "Property" &&
          target.parent.value === target &&
          target.parent.parent?.type === "ObjectPattern") ||
        target.parent?.type === "ArrayPattern" ||
        (target.parent?.type === "RestElement" && target.parent.argument === target) ||
        (target.parent?.type === "AssignmentPattern" && target.parent.left === target)
      )
        target = target.parent.type === "Property" ? target.parent.parent : target.parent;
      const outer = target.parent;
      if (
        (outer?.type === "AssignmentExpression" && outer.left === target) ||
        outer?.type === "UpdateExpression" ||
        (outer?.type === "UnaryExpression" && outer.operator === "delete") ||
        ((outer?.type === "ForOfStatement" || outer?.type === "ForInStatement") &&
          outer.left === target)
      )
        return true;
    }
    const call = id.parent;
    if (call?.type === "CallExpression" && call.arguments[0] === id && isObjectAssign(call.callee))
      return true;
    // A list changed in place: `k.push(…)`, `k.unshift(…)`, `k.splice(…)`, `k.fill(…)`.
    const method = id.parent;
    return (
      method?.type === "MemberExpression" &&
      method.object === id &&
      MUTATORS.has(memberKey(method)) &&
      method.parent?.type === "CallExpression" &&
      method.parent.callee === method
    );
  });
}
/** The array methods that put a value into the list they are called on. */
const MUTATORS = new Set(["push", "unshift", "splice", "fill"]);

/**
 * The values a variable's own writes give it, when every write assigns the name itself: `k = v`,
 * `k ??= v`, `k ||= v` and `k &&= v` put `v` in `assigned`, `k += v` puts it in `appended`. Null
 * when any write is of another kind (`k++`, `[k] = …`, `for (k of …)`) or changes its object
 * (`k.a = …`), whose value no expression in the file states.
 */
function ownWrites(variable) {
  const assigned = [];
  const appended = [];
  for (const reference of variable.references) {
    // A read, or the declaration's own initialiser, writes nothing.
    if (!isWritten({ references: [reference] })) continue;
    const write = referenceExpression(reference.identifier).parent;
    if (write?.type !== "AssignmentExpression" || unwrap(write.left) !== reference.identifier)
      return null;
    if (write.operator === "+=") appended.push(write.right);
    else if (["=", "??=", "||=", "&&="].includes(write.operator)) assigned.push(write.right);
    else return null;
  }
  return { assigned, appended };
}

/**
 * Whether an object bound to a variable is handed to something that may keep or change it: passed
 * to a call (other than a reader `opts.reads` names), bound or assigned to another name, returned,
 * stored in an object or an array, or passed as a JSX attribute other than a class or a style.
 * Reading a member or spreading it hands nothing over. Contextual mode only.
 */
export function isEscaped(variable, { reads } = {}) {
  return variable.references.some((reference) => {
    if (!reference.isRead()) return false;
    let value = referenceExpression(reference.identifier);
    let parent = value.parent;
    while (
      (parent?.type === "ConditionalExpression" && parent.test !== value) ||
      parent?.type === "LogicalExpression" ||
      (parent?.type === "SequenceExpression" && parent.expressions.at(-1) === value)
    ) {
      value = referenceExpression(parent);
      parent = value.parent;
    }
    if (parent?.type === "JSXExpressionContainer" && parent.parent?.type === "JSXAttribute") {
      const name = parent.parent.name.type === "JSXIdentifier" ? parent.parent.name.name : "";
      return !/^style$|class/i.test(name);
    }
    if (
      (parent?.type === "CallExpression" || parent?.type === "NewExpression") &&
      parent.arguments.includes(value)
    )
      return !(parent.callee.type === "Identifier" && reads?.has(parent.callee.name));
    return (
      (parent?.type === "VariableDeclarator" && parent.init === value) ||
      (parent?.type === "AssignmentExpression" && parent.right === value) ||
      (parent?.type === "ReturnStatement" && parent.argument === value) ||
      (parent?.type === "ArrowFunctionExpression" && parent.body === value) ||
      (parent?.type === "Property" && parent.value === value) ||
      parent?.type === "ArrayExpression"
    );
  });
}

/* ---------- a binding's value ---------- */

/**
 * The route from a destructured binding to its declarator's pattern, outermost first: `cls` in
 * `const [dot, text, cls] = …` is `[{ index: 2 }]`, `colorCls` in `const { colorCls } = …` is
 * `[{ key: "colorCls" }]`. A default inside the pattern is passed through (its value is read
 * separately); a rest element, or a key the source does not fix, has no route (null).
 */
export function patternSteps(binding, pattern) {
  const steps = [];
  let node = binding;
  while (node !== pattern) {
    const parent = node.parent;
    if (parent?.type === "ArrayPattern") {
      steps.unshift({ index: parent.elements.indexOf(node) });
      node = parent;
    } else if (
      parent?.type === "Property" &&
      parent.value === node &&
      parent.parent?.type === "ObjectPattern"
    ) {
      const key = keyName(parent);
      if (key === null) return null;
      steps.unshift({ key });
      node = parent.parent;
    } else if (parent?.type === "AssignmentPattern" && parent.left === node) node = parent;
    else return null;
  }
  return steps;
}

/** A pattern default around a binding (`{ a = "x" }`, `[a = "x"]`, `(a = "x")`), or undefined. */
const defaultOf = (binding) =>
  binding.parent?.type === "AssignmentPattern" && binding.parent.left === binding
    ? binding.parent.right
    : undefined;

/**
 * The defaults written above a destructured parameter's own, each with the binding's route into
 * it: `pad` in `({ pad } = { pad: "…" })` is `{ node: { pad: "…" }, steps: [{ key: "pad" }] }`.
 */
function outerDefaults(binding, root) {
  const out = [];
  const steps = [];
  let node = defaultOf(binding) ? binding.parent : binding;
  while (node && node !== root) {
    const parent = node.parent;
    if (parent?.type === "ArrayPattern") {
      steps.unshift({ index: parent.elements.indexOf(node) });
      node = parent;
    } else if (
      parent?.type === "Property" &&
      parent.value === node &&
      parent.parent?.type === "ObjectPattern"
    ) {
      const key = keyName(parent);
      if (key === null) return out;
      steps.unshift({ key });
      node = parent.parent;
    } else if (parent?.type === "AssignmentPattern" && parent.left === node) {
      out.push({ node: parent.right, steps: [...steps] });
      node = parent;
    } else return out;
  }
  return out;
}

/** Array methods whose callback's first parameter is each element of the list they are called on. */
const ELEMENT_METHODS = new Set([
  "map",
  "flatMap",
  "forEach",
  "filter",
  "find",
  "findLast",
  "some",
  "every",
]);

/** The list a callback parameter walks, when the callback is an array method's (`TABS.map((tab)
    => …)`), and the parameter's route into each element: `{ list, steps }`, or undefined. */
function elementOf(fn, root, binding) {
  const call = fn.parent;
  if (call?.type !== "CallExpression" || call.arguments[0] !== fn || fn.params[0] !== root)
    return undefined;
  const callee = unwrap(call.callee);
  if (callee?.type !== "MemberExpression" || !ELEMENT_METHODS.has(memberKey(callee)))
    return undefined;
  const steps = patternSteps(binding, root);
  return steps ? { list: callee.object, steps } : undefined;
}

/**
 * What a name's value is where it is written:
 * - `{ none: true }` for `undefined`;
 * - `{ unreadable }` with its reason; a let or var whose every write assigns the name itself also
 *   carries `writes: { init, steps, fallback, assigned, appended }` (ownWrites), which vocabulary
 *   mode reads;
 * - `{ parameter: { key, fallback, whole, objectDefault, defaults }, element, variable }` for a
 *   parameter never written: the prop it destructures (`key`, or null), the default written beside
 *   it, whether it is the whole props object (with its own object default), and the defaults
 *   written above it; `element` is `{ list, steps }` when it is an array method's callback
 *   parameter (elementOf);
 * - `{ fn, variable }` for a function declaration;
 * - `{ init, steps, fallback, variable }` for a const, let or var with an initialiser that is never
 *   written after it (and for an enum, whose init is its declaration): `steps` is a destructured
 *   binding's route into `init`, and `fallback` the default the pattern gives it.
 */
export function bindingOf(context, identifier) {
  if (identifier.name === "undefined") return { none: true };
  const variable = variableOf(context, identifier);
  const definition = variable?.defs[0];
  if (!definition) return { unreadable: "unknown" };
  if (importOf(variable) || definition.type === "ImportBinding")
    return { unreadable: "imported", variable };
  if (definition.type === "FunctionName") return { fn: definition.node, variable };
  if (definition.type === "TSEnumName") return { init: definition.node, steps: [], variable };
  if (definition.type === "Parameter") {
    if (isWritten(variable)) return { unreadable: "reassigned", variable };
    const binding = definition.name;
    const fallback = defaultOf(binding);
    const slot = fallback ? binding.parent : binding;
    const property =
      slot.parent?.type === "Property" && slot.parent.parent?.type === "ObjectPattern"
        ? slot.parent
        : undefined;
    const fn = definition.node;
    const whole = fn.params?.includes(slot) ?? false;
    let root = binding;
    while (root.parent && root.parent !== fn) root = root.parent;
    const element = fn.params?.includes(root) ? elementOf(fn, root, binding) : undefined;
    return {
      parameter: {
        key: property ? keyName(property) : null,
        fallback,
        whole,
        objectDefault: whole ? fallback : undefined,
        defaults: fn.params?.includes(root) ? outerDefaults(binding, root) : [],
      },
      ...(element ? { element } : {}),
      variable,
    };
  }
  if (definition.type !== "Variable") return { unreadable: "unknown", variable };
  const init = definition.node.init;
  const destructured = definition.name !== definition.node.id;
  const steps = destructured ? patternSteps(definition.name, definition.node.id) : [];
  const fallback = destructured ? defaultOf(definition.name) : undefined;
  if (isWritten(variable)) {
    const writes = ownWrites(variable);
    return writes
      ? { unreadable: "reassigned", variable, writes: { init, steps, fallback, ...writes } }
      : { unreadable: "reassigned", variable };
  }
  if (!init) return { unreadable: "unknown", variable };
  if (!steps) return { unreadable: "rest", variable };
  return destructured ? { init, steps, fallback, variable } : { init, steps: [], variable };
}

/**
 * The import a value is read from, through the consts that hold it (`const t = theme; t.cls`,
 * `const d = getDefaultClassNames(); d.day_button`): `{ root, calls }`, the imported name and every
 * call along the way, outermost first; undefined when the value does not start from an import.
 */
export function importedChain(context, node, calls = [], depth = 0) {
  let value = unwrap(node);
  while (value) {
    if (value.type === "MemberExpression") value = unwrap(value.object);
    else if (value.type === "CallExpression" || value.type === "NewExpression") {
      calls.push(value);
      value = unwrap(value.callee);
    } else if (value.type === "TaggedTemplateExpression") {
      calls.push(value);
      value = unwrap(value.tag);
    } else break;
  }
  if (value?.type !== "Identifier") return undefined;
  if (importOf(variableOf(context, value))) return { root: value, calls };
  const init = depth < 4 ? constInit(context, value) : undefined;
  return init ? importedChain(context, init, calls, depth + 1) : undefined;
}

/** The initialiser of a const, let or var declared with one name and never written after it. */
export function constInit(context, identifier) {
  if (identifier?.type !== "Identifier") return undefined;
  const found = bindingOf(context, identifier);
  return found.init && !found.steps.length ? found.init : undefined;
}

/** A function literal, under its type wrappers. */
const functionLiteral = (node) => {
  const value = unwrap(node);
  return value?.type === "ArrowFunctionExpression" || value?.type === "FunctionExpression"
    ? value
    : undefined;
};

/** A React hook (`useMemo`, `useCallback`, `useState`), imported from react by name or read from
    its namespace (`React.useMemo`). */
function isReactHook(context, callee, hook) {
  const name = unwrap(callee);
  if (name?.type === "Identifier") {
    const binding = importOf(variableOf(context, name));
    return binding?.source === "react" && binding.imported === hook;
  }
  if (name?.type !== "MemberExpression" || memberKey(name) !== hook) return false;
  const object = unwrap(name.object);
  const binding = object?.type === "Identifier" && importOf(variableOf(context, object));
  return (
    binding?.source === "react" &&
    (binding.imported === NAMESPACE || binding.imported === "default")
  );
}

/** The function a `useCallback(fn, deps)` memoises, which is the value it gives: a Base UI
    className or style callback memoised is read as the callback. */
export function callbackOf(context, call) {
  if (call?.type !== "CallExpression") return undefined;
  const fn = functionLiteral(call.arguments[0]);
  return fn && isReactHook(context, call.callee, "useCallback") ? fn : undefined;
}

/** The same-file function a call reaches: a function declaration, or a const, let or var whose
    initialiser is a function (or a `useCallback` of one) and which is never written. */
export function calledFunction(context, callee) {
  const name = unwrap(callee);
  if (name?.type !== "Identifier") return undefined;
  const found = bindingOf(context, name);
  if (found.fn) return found.fn.body ? found.fn : undefined;
  const init = found.init && !found.steps.length ? unwrap(found.init) : undefined;
  if (init?.type === "CallExpression" && isReactHook(context, init.callee, "useCallback"))
    return functionLiteral(init.arguments[0]);
  return functionLiteral(init);
}

/** The function whose returns are a call's value: a same-file function it calls, a function it
    calls where it is written (`(() => …)()`), or the factory a `useMemo(() => …, deps)` memoises. */
export function returningFunction(context, call) {
  const fn = calledFunction(context, call.callee) ?? functionLiteral(call.callee);
  if (fn) return fn;
  if (!isReactHook(context, call.callee, "useMemo")) return undefined;
  return functionLiteral(call.arguments[0]);
}

/** Every value a function returns: its expression body, or each `return` through blocks, `if`,
    `switch` and `try`; not the returns of a function nested in it. */
export function returnsOf(fn) {
  // A declaration without a body (`declare function f(): string`, an overload) returns nothing
  // the file writes.
  if (!fn.body) return [];
  if (fn.body.type !== "BlockStatement") return [fn.body];
  const out = [];
  const walk = (statement) => {
    if (!statement) return;
    if (statement.type === "ReturnStatement") {
      if (statement.argument) out.push(statement.argument);
    } else if (statement.type === "BlockStatement") statement.body.forEach(walk);
    else if (statement.type === "IfStatement") {
      walk(statement.consequent);
      walk(statement.alternate);
    } else if (statement.type === "SwitchStatement")
      statement.cases.forEach((branch) => branch.consequent.forEach(walk));
    else if (statement.type === "TryStatement") {
      walk(statement.block);
      walk(statement.handler?.body);
      walk(statement.finalizer);
    } else if (statement.type === "LabeledStatement") walk(statement.body);
  };
  walk(fn.body);
  return out;
}

/* ---------- following a value ---------- */

/**
 * A walk through what an expression can be, shared by every reader: `name` follows a name to its
 * value, `project` a destructured slot into its initialiser, `containers` finds the object and
 * array literals an expression can be, `values` the entries a member read can give, and
 * `separated` whether a value always renders with whitespace at one edge. Each takes
 * `say(node, reason)` for what it cannot read. `opts.mode` is "vocabulary" or "contextual";
 * `opts.reads` names the helpers that read an object without keeping it (contextual escape).
 *
 * Vocabulary mode also reads what contextual mode leaves to the last write: a let or var assigned
 * after it is declared gives its initialiser and every value assigned to it (`k += " x"` when the
 * appended text starts with whitespace), and an array method's callback parameter
 * (`TABS.map((tab) => …)`) gives each element of a list the walk can read.
 */
export function valueWalker(context, opts = {}) {
  const contextual = opts.mode === "contextual";
  const path = opts.path ?? new Set();
  /** Runs `fn` unless `key` is already on the route, so a value that refers to itself stops. */
  const guard = (key, fn) => {
    if (path.has(key)) return;
    path.add(key);
    try {
      fn();
    } finally {
      path.delete(key);
    }
  };

  // The calls each same-file function is being read for, innermost last: while a function's returns
  // are read for a call, its parameters read what that call gives them (`box(288)` gives `w` 288),
  // and one the call leaves out is its default, or nothing. `opts.given` carries the calls a value
  // was reached under (bindings()) into a walk that reads it later.
  const given = new Map([...(opts.given ?? new Map())].map(([fn, calls]) => [fn, [...calls]]));
  let frames = 0;
  /** Reads `read()` with `fn`'s parameters bound to `call`'s arguments. */
  const called = (fn, call, read) => {
    const calls = given.get(fn) ?? [];
    calls.push({ args: call.arguments ?? [], frame: ++frames });
    given.set(fn, calls);
    try {
      return read();
    } finally {
      calls.pop();
      if (!calls.length) given.delete(fn);
    }
  };
  /** The calls in force, to carry into a later walk (`opts.given`). */
  const bindings = () => new Map([...given].map(([fn, calls]) => [fn, [...calls]]));
  /** The innermost call being read, as a number that differs for each call (0 outside one). */
  const frame = () => Math.max(0, ...[...given.values()].map((calls) => calls.at(-1).frame));
  /** Whether a parameter's function is being read for a call. */
  const readForCall = (found) => {
    const definition = found.variable?.defs[0];
    return definition?.type === "Parameter" && given.has(definition.node);
  };
  /**
   * What the call a parameter's function is read for gives the parameter: `{ node, steps }`, the
   * argument and the parameter's route into it (`tone` in `({ tone })` is its `tone` entry; the
   * rest of an object pattern, `...rest`, is the argument itself, read by key); `{ absent: true }`
   * when the call leaves it out; `{ unknown }` when a spread argument hides it; undefined when the
   * function is not being read for a call.
   */
  const argumentOf = (found) => {
    const definition = found.variable?.defs[0];
    if (definition?.type !== "Parameter") return undefined;
    const fn = definition.node;
    const args = given.get(fn)?.at(-1)?.args;
    if (!args) return undefined;
    let slot = definition.name;
    while (slot.parent && slot.parent !== fn) slot = slot.parent;
    const index = fn.params.indexOf(slot);
    const spread = args.slice(0, index + 1).find((arg) => arg.type === "SpreadElement");
    if (index < 0 || spread) return { unknown: spread ?? definition.name };
    if (!args[index]) return { absent: true };
    const pattern = slot.type === "AssignmentPattern" ? slot.left : slot;
    let binding = definition.name;
    if (binding.parent?.type === "RestElement" && binding.parent.parent?.type === "ObjectPattern")
      binding = binding.parent.parent;
    const steps = binding === pattern ? [] : patternSteps(binding, pattern);
    return steps ? { node: args[index], steps } : { unknown: definition.name };
  };

  /** Why a call cannot be read: its function is imported (held in a const too: `const v =
      buttonVariants; v()`), or it is any other call. */
  const callReason = (call) => {
    const callee = unwrap(call.callee);
    return callee?.type === "Identifier" && importedChain(context, callee)
      ? "imported-call"
      : "call";
  };

  /** A name's value, followed along `steps` when it is a destructured slot, handed to `onValue`.
      A parameter is a prop the file does not write; its defaults are read. */
  const name = (identifier, steps, onValue, say) => {
    const found = bindingOf(context, identifier);
    if (found.none) return;
    if (found.writes && !contextual)
      return guard(found.variable, () => written(found, steps, onValue, say));
    if (found.unreadable) return say(identifier, found.unreadable);
    if (found.element && !contextual)
      return guard(found.variable, () => elements(found.element, steps, onValue, say));
    if (found.parameter) {
      const { fallback, whole, defaults } = found.parameter;
      // In a same-file function read for a call, the parameter is what the call gives it, and
      // its defaults; one the call leaves out with no default is undefined.
      const argument = argumentOf(found);
      if (argument?.unknown) return say(argument.unknown, "spread");
      const read = [
        ...(argument?.node ? [argument] : []),
        ...(fallback && !whole ? [{ node: fallback, steps: [] }] : []),
        ...defaults,
      ];
      if (!read.length) return argument ? undefined : say(identifier, "prop");
      guard(found.variable, () =>
        read.forEach((entry) => project(entry.node, [...entry.steps, ...steps], onValue, say)),
      );
      return;
    }
    if (found.fn) return say(identifier, "expression");
    if (
      contextual &&
      unwrap(found.init)?.type === "ObjectExpression" &&
      isEscaped(found.variable, opts)
    )
      return say(identifier, "escaped");
    if (found.fallback) guard(found.fallback, () => project(found.fallback, steps, onValue, say));
    guard(found.variable, () => project(found.init, [...found.steps, ...steps], onValue, say));
  };

  /** A let or var written after it is declared (vocabulary mode): its initialiser, every value
      assigned to it, and each appended value that starts with whitespace. */
  const written = ({ writes }, steps, onValue, say) => {
    const { init, steps: own, fallback, assigned, appended } = writes;
    if (fallback) project(fallback, steps, onValue, say);
    if (init) {
      if (own) project(init, [...own, ...steps], onValue, say);
      else say(init, "rest");
    }
    for (const value of assigned) project(value, steps, onValue, say);
    for (const value of appended)
      if (separated(value, "start")) project(value, steps, onValue, say);
      else say(value, "reassigned");
  };

  /** Each element of the list an array method's callback walks, along the parameter's route. */
  const elements = ({ list, steps: own }, steps, onValue, say) => {
    const call = unwrap(list);
    if (call?.type === "CallExpression" && globalMethod(context, call.callee, "Object", "values")) {
      const { found, reasons } = containers(call.arguments[0]);
      for (const { node, reason } of reasons) say(node, reason);
      for (const object of found)
        if (object.type === "ObjectExpression")
          for (const entry of entriesOf(object))
            if (entry.reason === "computed-key")
              project(entry.unknown.value, [...own, ...steps], onValue, say);
            else if (entry.unknown) say(entry.unknown, entry.reason);
            else project(entry.value, [...own, ...steps], onValue, say);
      return;
    }
    const { found, reasons } = containers(list);
    for (const { node, reason } of reasons) say(node, reason);
    if (!found.length && !reasons.length) say(list, "expression");
    for (const container of found)
      if (container.type !== "ArrayExpression") say(container, "shape");
      else
        for (const element of container.elements)
          if (element?.type === "SpreadElement") say(element, "spread");
          else if (element) project(element, [...own, ...steps], onValue, say);
  };

  /**
   * Whether every value an expression can take renders as text whose `side` ("start" or "end") is
   * whitespace, or as nothing (`""`): `" x"` at the start, `on ? "x " : ""` at the end. A value the
   * walk cannot read, a number, a prop, and anything that renders as a word (`false`, `undefined`,
   * `a && " x"`) are not.
   */
  const separated = (node, side) => {
    const edge = side === "start" ? /^\s/ : /\s$/;
    const seen = new Set();
    let ok = true;
    const no = () => {
      ok = false;
    };
    const once = (key, fn) => {
      if (seen.has(key)) return no();
      seen.add(key);
      fn();
    };
    const check = (expression) => {
      const value = unwrap(expression);
      if (!ok) return;
      switch (value?.type) {
        case "Literal":
          if (typeof value.value !== "string" || (value.value && !edge.test(value.value))) no();
          return;
        case "TemplateLiteral": {
          const text =
            (side === "start" ? value.quasis[0] : value.quasis.at(-1)).value.cooked ?? "";
          if (value.expressions.length ? !edge.test(text) : text && !edge.test(text)) no();
          return;
        }
        case "ConditionalExpression":
          check(value.consequent);
          check(value.alternate);
          return;
        case "LogicalExpression":
          if (value.operator === "&&") return no();
          check(value.left);
          check(value.right);
          return;
        case "Identifier": {
          const found = bindingOf(context, value);
          if (!found.init || found.unreadable) return no();
          return once(found.variable, () => {
            if (found.fallback) project(found.fallback, [], check, no);
            project(found.init, found.steps, check, no);
          });
        }
        case "MemberExpression":
          for (const member of values(value, no)) check(member);
          return;
        case "CallExpression": {
          const frozen = frozenOf(context, value);
          if (frozen) return check(frozen);
          const fn = returningFunction(context, value);
          if (!fn) return no();
          return once(fn, () => returnsOf(fn).forEach(check));
        }
        default:
          return no();
      }
    };
    check(node);
    return ok;
  };

  /** Follows `steps` into a value through its branches; a shape the steps cannot enter is
      unreadable, never read whole: its other slots were never this binding's. */
  const project = (node, steps, onValue, say) => {
    if (!steps.length) return onValue(node);
    const value = unwrap(node);
    const [step, ...rest] = steps;
    switch (value?.type) {
      case "ConditionalExpression":
        project(value.consequent, steps, onValue, say);
        project(value.alternate, steps, onValue, say);
        return;
      case "LogicalExpression":
        if (value.operator !== "&&") project(value.left, steps, onValue, say);
        project(value.right, steps, onValue, say);
        return;
      case "Identifier":
        return name(value, steps, onValue, say);
      case "ArrayExpression": {
        if (!("index" in step)) return say(value, "shape");
        const before = value.elements.slice(0, step.index + 1);
        if (before.some((element) => element?.type === "SpreadElement"))
          return say(value, "spread");
        const element = value.elements[step.index];
        return element ? project(element, rest, onValue, say) : undefined;
      }
      case "ObjectExpression": {
        if (!("key" in step)) return say(value, "shape");
        const entries = entriesOf(value);
        const last = entries.findLastIndex((entry) => entry.key === step.key);
        if (last < 0)
          return entries.some((entry) => entry.unknown) ? say(value, "spread") : undefined;
        return project(entries[last].value, rest, onValue, say);
      }
      case "CallExpression": {
        const frozen = frozenOf(context, value);
        if (frozen) return project(frozen, steps, onValue, say);
        // `const [cls] = useState(…)`: the state starts as the initial value, or what a lazy
        // initialiser returns.
        if ("index" in step && step.index === 0 && isReactHook(context, value.callee, "useState")) {
          const initial = functionLiteral(value.arguments[0]);
          if (!initial)
            return value.arguments[0] && project(value.arguments[0], rest, onValue, say);
          return guard(initial, () =>
            returnsOf(initial).forEach((returned) => project(returned, rest, onValue, say)),
          );
        }
        return say(value, callReason(value));
      }
      default:
        return say(node, "shape");
    }
  };

  /** An object's entries in source order, same-file spreads flattened in; an entry the walk cannot
      read is `{ unknown, reason }`. */
  const entriesOf = (object, depth = 0) => {
    const entries = [];
    if (object.type === "TSEnumDeclaration") {
      // An enum's members, each with its initialiser; a member with none is a number.
      for (const member of object.body?.members ?? object.members ?? []) {
        const key = member.id.type === "Identifier" ? member.id.name : staticKey(member.id);
        if (key !== null && member.initializer)
          entries.push({ key, value: member.initializer, property: member });
      }
      return entries;
    }
    for (const property of object.properties) {
      if (property.type === "SpreadElement") {
        const inner =
          depth < 4 ? containers(property.argument) : { found: [], reasons: ["spread"] };
        const objects = inner.found.filter(({ type }) => type === "ObjectExpression");
        for (const found of objects) entries.push(...entriesOf(found, depth + 1));
        if (!objects.length || inner.reasons.length)
          entries.push({ unknown: property, reason: "spread" });
        continue;
      }
      const key = keyName(property);
      if (key === null) entries.push({ unknown: property, reason: "computed-key" });
      else entries.push({ key, value: property.value, property });
    }
    return entries;
  };

  /**
   * The object and array literals an expression can be, through branches, names, members and
   * same-file functions, as `{ found, reasons }`: the reasons are what it could not read, each with
   * its node, for the caller to say or not.
   */
  const containers = (node) => {
    const found = [];
    const reasons = [];
    const say = (at, reason, extra) => reasons.push({ node: at, reason, ...extra });
    const collect = (expression) => {
      const value = unwrap(expression);
      if (!value) return;
      switch (value.type) {
        case "ObjectExpression":
        case "ArrayExpression":
        case "TSEnumDeclaration":
          found.push(value);
          return;
        case "ConditionalExpression":
          collect(value.consequent);
          collect(value.alternate);
          return;
        case "LogicalExpression":
          if (value.operator !== "&&") collect(value.left);
          collect(value.right);
          return;
        case "Identifier":
          return name(value, [], collect, say);
        case "MemberExpression":
          for (const member of values(value, say)) guard(member, () => collect(member));
          return;
        case "CallExpression": {
          const frozen = frozenOf(context, value);
          if (frozen) return collect(frozen);
          const fn = returningFunction(context, value);
          if (fn) return guard(fn, () => called(fn, value, () => returnsOf(fn).forEach(collect)));
          return say(value, callReason(value));
        }
        case "Literal":
        case "TemplateLiteral":
          return;
        default:
          return say(value, "expression");
      }
    };
    collect(node);
    return { found, reasons };
  };

  /** The values a member read can give: the entry of a same-file map or list for a key the source
      fixes; in vocabulary mode, every entry for a key only known at runtime, a computed one too. */
  const values = (member, say) => {
    const key = memberKey(member);
    const object = unwrap(member.object);
    if (object?.type === "Identifier") {
      const found = bindingOf(context, object);
      if (found.parameter && (contextual || !found.element)) {
        // A same-file function's parameter read for a call is what the call gives it; one the
        // call leaves out, with no default, is undefined and has no member.
        const argument = argumentOf(found);
        if (!argument) return (say(member, "prop"), []);
        if (argument.absent && !found.parameter.fallback && !found.parameter.defaults.length)
          return [];
      }
      if (found.unreadable === "imported") return (say(member, "imported"), []);
    }
    const { found, reasons } = containers(member.object);
    if (!found.length) {
      // Said at the member, with the node the reason is about (`at`): an import held in a const
      // (`const t = theme; t.cls`) is still that import.
      if (reasons.length) say(member, reasons[0].reason, { at: reasons[0].at ?? reasons[0].node });
      else say(member, "member");
      return [];
    }
    for (const { node, reason } of reasons) say(node, reason);
    const out = [];
    for (const container of found) {
      if (container.type === "ArrayExpression") {
        if (key === null) {
          if (contextual) say(member, "computed-key");
          else
            for (const element of container.elements)
              if (element?.type === "SpreadElement") say(element, "spread");
              else if (element) out.push(element);
        } else if (!/^\d+$/.test(key)) say(member, "member");
        else {
          const index = Number(key);
          const before = container.elements.slice(0, index + 1);
          if (before.some((element) => element?.type === "SpreadElement")) say(container, "spread");
          else if (container.elements[index]) out.push(container.elements[index]);
        }
        continue;
      }
      const entries = entriesOf(container);
      if (key === null) {
        if (contextual) say(member, "computed-key");
        else
          for (const entry of entries)
            // A key the map computes (`{ [Tone.Danger]: "…" }`) may be the one asked for too.
            if (entry.reason === "computed-key") out.push(entry.unknown.value);
            else if (entry.unknown) say(entry.unknown, entry.reason);
            else out.push(entry.value);
        continue;
      }
      if (contextual) {
        // The last write wins, and a spread the reader cannot see after it may overwrite it.
        const last = entries.findLastIndex((entry) => entry.key === key);
        const after = entries.slice(last + 1).some((entry) => entry.unknown);
        if (after) say(member, "spread");
        else if (last >= 0) out.push(entries[last].value);
        else say(member, "member");
        continue;
      }
      const hits = entries.filter((entry) => entry.key === key);
      if (hits.length) out.push(...hits.map((entry) => entry.value));
      else say(member, entries.some((entry) => entry.unknown) ? "spread" : "member");
    }
    return out;
  };

  return {
    name,
    project,
    entriesOf,
    containers,
    values,
    separated,
    guard,
    callReason,
    path,
    called,
    bindings,
    frame,
    argumentOf,
    readForCall,
  };
}

/** The walk the exported readers share for a file, in each mode, when a caller brings no state of
    its own (a route, calls in force, the helpers that read an object): every walk ends with its
    route and its calls as it found them, so one serves them all. */
const walkers = new WeakMap();
function walkerOf(context, opts) {
  if (opts.path || opts.given?.size || opts.reads) return valueWalker(context, opts);
  const mode = opts.mode === "contextual" ? "contextual" : "vocabulary";
  let byMode = walkers.get(context.sourceCode);
  if (!byMode) walkers.set(context.sourceCode, (byMode = {}));
  return (byMode[mode] ??= valueWalker(context, { mode }));
}

/** An object's entries in source order, same-file spreads flattened in, each `{ key, value,
    property }` or, where the reader cannot read it, `{ unknown, reason }`. */
export function entriesOf(context, object, opts = {}) {
  return walkerOf(context, opts).entriesOf(object);
}

/**
 * Every object literal an expression can be: a literal, a same-file binding, a member of a map,
 * either branch, what a same-file function returns. What it cannot read goes to `onUnreadable`.
 */
export function objectsOf(context, expression, opts = {}) {
  const { found, reasons } = walkerOf(context, opts).containers(expression);
  for (const reason of reasons) opts.onUnreadable?.(reason);
  return found.filter(({ type }) => type === "ObjectExpression");
}

/** The values a member read can give (`styles.box`, `tones[tone]`, `list[0]`). What it cannot read
    goes to `onUnreadable`. */
export function memberValues(context, member, opts = {}) {
  const say = (node, reason) => opts.onUnreadable?.({ node, reason });
  return walkerOf(context, opts).values(member, say);
}

const isNumberLeaf = (leaf) =>
  (leaf.type === "Literal" && typeof leaf.value === "number") || leaf.type === "UnaryExpression";
const isStringLeaf = (leaf) =>
  (leaf.type === "Literal" && typeof leaf.value === "string") || leaf.type === "TemplateLiteral";
/** A number leaf's value: a number literal's, or a negative literal's. */
const numberValue = (leaf) =>
  leaf.type === "Literal" ? leaf.value : -Number(unwrap(leaf.argument)?.value);
/** A string or a template written as text, which makes a `+` a concatenation. */
const isText = (node) =>
  (node?.type === "Literal" && typeof node.value === "string") || node?.type === "TemplateLiteral";
/** The text a string or a template starts with. */
const textStart = (node) =>
  node.type === "Literal" ? node.value : (node.quasis[0]?.value.cooked ?? "");
/** A length unit written straight after a number: `${W}px`, `W + "rem"`. */
const UNIT = /^(px|rem|em|ch|ex|pt|pc|cm|mm|in|q)(?![a-z%-])/i;
/** Whether a node is written inside another. */
const inside = (node, outer) => node.range[0] >= outer.range[0] && node.range[1] <= outer.range[1];
/** A literal the reader makes from a leaf, written where the leaf is: W's 288 in `${W}px` read as
    "288px", or the 6.5 of `WIDTH / 16` at WIDTH's 104. */
const madeFrom = (leaf, value) => ({
  type: "Literal",
  value,
  raw: typeof value === "string" ? JSON.stringify(value) : String(value),
  range: leaf.range,
  loc: leaf.loc,
  parent: leaf.parent,
});
const ARITHMETIC = {
  "*": (a, b) => a * b,
  "/": (a, b) => a / b,
  "%": (a, b) => a % b,
};

/**
 * The literal values an expression can be, through branches, names, destructured slots, members
 * and same-file functions (each parameter read as its call gives it): string and number literals, a
 * negative number, and templates (whole). What it cannot read goes to `onUnreadable` as
 * `{ node, reason }`; `opts.given` is the calls the expression was reached under (bindings()).
 *
 * With `opts.named` (a style value) it also reads what a value is built from. The strings of a
 * template's holes and of a concatenation's operands are values of their own (`` `999 1 ${MIN}` ``
 * gives MIN's "8rem", `"calc(100% - " + GUTTER + ")"` GUTTER's "24px"), and a number written
 * straight before a length unit is that length (`` `${W}px` ``, `` `${288}px` `` and `W + "px"`
 * give "288px"). In a sum of lengths (`+` or `-` with no text) a named number is a length
 * (`top + GAP`); one written in the sum itself is an offset the file computes with (`offset - 1`).
 * A factor of `*`, `/` or `%` is a count or a ratio, not a length, whichever side it is on, so a
 * product gives a number only when every factor is one the file writes (`2 * 16` is 32, `WIDTH /
 * 16` of a 104 is 6.5), said where its first factor from elsewhere is; `depth * INDENT` and
 * `rows * ROW` give none.
 */
export function leaves(context, expression, opts = {}) {
  const out = [];
  const say = (node, reason) => opts.onUnreadable?.({ node, reason });
  const walk = walkerOf(context, opts);
  const numbers = (push) => (leaf) => {
    if (isNumberLeaf(leaf)) push(leaf);
  };
  /** A sum's operand's numbers that are named: one written in the sum itself is an offset the
      file computes with (`offset - 1`, `digits + 1.5`), not a length of its own. */
  const named = (push, node) => (leaf) => {
    if (isNumberLeaf(leaf) && !inside(leaf, node)) push(leaf);
  };
  /** `a + b + …`: a concatenation when any operand is text, else a sum of lengths. */
  const sum = (node, push) => {
    const operands = [];
    const flatten = (operand) => {
      const value = unwrap(operand);
      if (value?.type === "BinaryExpression" && value.operator === "+") {
        flatten(value.left);
        flatten(value.right);
      } else operands.push(value);
    };
    flatten(node);
    const concatenation = operands.some(isText);
    operands.forEach((operand, index) => {
      const after = operands[index + 1];
      const unit = isText(after) ? UNIT.exec(textStart(after))?.[1] : undefined;
      visit(operand, (leaf) => {
        if (isStringLeaf(leaf)) push(leaf);
        else if (isNumberLeaf(leaf)) {
          if (unit) push(madeFrom(leaf, `${numberValue(leaf)}${unit}`));
          else if (!concatenation) named(push, node)(leaf);
        }
      });
    });
  };
  /** `a * b`, `a / b`, `a % b`: the value when every factor is a number the file writes. */
  const product = (node, push) => {
    const [left, right] = [node.left, node.right].map((side) => {
      const found = [];
      visit(
        side,
        numbers((leaf) => found.push(leaf)),
      );
      return found;
    });
    for (const a of left)
      for (const b of right) {
        const value = ARITHMETIC[node.operator](numberValue(a), numberValue(b));
        if (Number.isFinite(value))
          push(madeFrom([a, b].find((leaf) => !inside(leaf, node)) ?? a, value));
      }
  };
  const visit = (node, push = (leaf) => out.push(leaf)) => {
    const value = unwrap(node);
    if (!value) return;
    const next = (child) => visit(child, push);
    switch (value.type) {
      case "Literal":
        push(value);
        return;
      case "TemplateLiteral":
        push(value);
        if (opts.named)
          value.expressions.forEach((hole, index) => {
            const unit = UNIT.exec(value.quasis[index + 1]?.value.cooked ?? "")?.[1];
            visit(hole, (leaf) => {
              if (isStringLeaf(leaf)) push(leaf);
              else if (unit && isNumberLeaf(leaf))
                push(madeFrom(leaf, `${numberValue(leaf)}${unit}`));
            });
          });
        return;
      case "UnaryExpression":
        if (value.operator === "-" && unwrap(value.argument)?.type === "Literal") push(value);
        else if (opts.named && value.operator === "-")
          visit(
            value.argument,
            numbers((leaf) => push(madeFrom(leaf, -numberValue(leaf)))),
          );
        else say(value, "expression");
        return;
      case "BinaryExpression":
        if (opts.named && value.operator === "+") return sum(value, push);
        if (opts.named && value.operator === "-") {
          visit(value.left, named(push, value));
          visit(value.right, named(push, value));
          return;
        }
        if (opts.named && Object.hasOwn(ARITHMETIC, value.operator)) return product(value, push);
        return say(value, "expression");
      case "ConditionalExpression":
        next(value.consequent);
        next(value.alternate);
        return;
      case "LogicalExpression":
        if (value.operator !== "&&") next(value.left);
        next(value.right);
        return;
      case "Identifier":
        return walk.name(value, [], next, say);
      case "MemberExpression":
        for (const member of walk.values(value, say)) walk.guard(member, () => next(member));
        return;
      case "CallExpression": {
        const frozen = frozenOf(context, value);
        if (frozen) return next(frozen);
        const fn = returningFunction(context, value);
        if (fn)
          return walk.guard(fn, () => walk.called(fn, value, () => returnsOf(fn).forEach(next)));
        return say(value, walk.callReason(value));
      }
      default:
        return say(value, "expression");
    }
  };
  visit(expression);
  return out;
}

/**
 * Every object literal a style can be, where it is written, each with the calls it was reached
 * under (`{ object, given }`, for leaves()'s `opts.given`): the object itself and each object it
 * spreads in; either branch, and both sides of `||` and `??` (the right of `&&`); a same-file
 * binding or a map's entry; what a function returns, when the style is one (Base UI's
 * `style={(state) => ({ … })}`), a same-file function is called (each parameter read as the call
 * gives it: `box(288)`) or `useMemo(() => …)` memoises it; the objects handed to a same-file
 * helper (`sized(defaults, style)`) or to `Object.assign`, which merge them into the style. A
 * received `style` is the caller's and gives nothing. What it cannot read goes to `onUnreadable`
 * as `{ node, reason }`: style is for computed values, so it is no finding.
 */
export function styleEntries(context, expression, opts = {}) {
  const out = [];
  const seen = new Map();
  const say = (node, reason) => opts.onUnreadable?.({ node, reason });
  const walk = walkerOf(context, opts);
  const visit = (node) => {
    const value = unwrap(node);
    if (!value) return;
    // A node is read once for each call it is read under: `box(8)` and `box(288)` both.
    const key = `${walk.frame()}`;
    let keys = seen.get(value);
    if (!keys) seen.set(value, (keys = new Set()));
    if (keys.has(key)) return;
    keys.add(key);
    switch (value.type) {
      case "ObjectExpression":
        out.push({ object: value, given: walk.bindings() });
        for (const property of value.properties)
          if (property.type === "SpreadElement") visit(property.argument);
        return;
      case "ConditionalExpression":
        visit(value.consequent);
        visit(value.alternate);
        return;
      case "LogicalExpression":
        if (value.operator !== "&&") visit(value.left);
        visit(value.right);
        return;
      case "Identifier": {
        // A function declaration passed as the style is a style callback too.
        const fn = bindingOf(context, value).fn;
        if (fn) return walk.guard(fn, () => returnsOf(fn).forEach(visit));
        return walk.name(value, [], visit, say);
      }
      case "MemberExpression":
        for (const member of walk.values(value, say)) walk.guard(member, () => visit(member));
        return;
      case "ArrowFunctionExpression":
      case "FunctionExpression":
        return walk.guard(value, () => returnsOf(value).forEach(visit));
      case "CallExpression": {
        const frozen = frozenOf(context, value);
        if (frozen) return visit(frozen);
        const callback = callbackOf(context, value);
        if (callback) return visit(callback);
        // Object.assign(target, …objects) is every object it is handed, merged.
        if (globalMethod(context, value.callee, "Object", "assign")) {
          for (const argument of value.arguments)
            visit(argument.type === "SpreadElement" ? argument.argument : argument);
          return;
        }
        const fn = returningFunction(context, value);
        if (fn) walk.guard(fn, () => walk.called(fn, value, () => returnsOf(fn).forEach(visit)));
        else say(value, walk.callReason(value));
        if (calledFunction(context, value.callee))
          for (const argument of value.arguments)
            visit(argument.type === "SpreadElement" ? argument.argument : argument);
        return;
      }
      case "Literal":
      case "TemplateLiteral":
        return;
      default:
        return say(value, "expression");
    }
  };
  visit(expression);
  return out;
}

/** Every object literal a style can be (styleEntries), without the calls each was reached under. */
export function styleObjects(context, expression, opts = {}) {
  return styleEntries(context, expression, opts).map(({ object }) => object);
}
