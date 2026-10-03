import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

/*
 * The Storybook MCP hands an agent a family's first manifest story as the code to copy, so that
 * story renders the family's parts and compiles on its own: it reaches no ref made at module level
 * (alone or held in an object), no storybook/test spy of the file, no element, component or
 * function the stories file declares for itself and no `_lib` helper. A callback the play checks is
 * an arg, `fn()`, which the manifest prints in place. No story in the manifest of the component,
 * pattern, layout and primitive families shows a `_lib` component (Matrix, Specimens, Pair): a
 * comparison is tagged `!manifest`; the token sheets keep theirs (Guidance/Writing stories). And no
 * manifest story's `children` arg is JSX in parentheses, which the manifest prints as text.
 *
 * MCP returns the first three manifest stories, so the second and third are copied too. Each may
 * name a component of its file (the story's one call, `<LoadingDemo />`, or a stand-in such as a
 * demo router link), but its own code names no ref, spy, function or element of the file: a ref or
 * handler check that a regression needs goes in a story tagged `!manifest`, and a formatter is
 * written inline. None of the three reads an arg the manifest prints as written: it writes an arg
 * in only as `{...args}` or `prop={args.key}` on an element of the JSX the story returns, so a
 * read inside a callback, an expression or JSX passed as a prop is left naming an `args` the copy
 * does not have.
 *
 * What a story offers is what Storybook's manifest prints for it: the story function, else its
 * `render` (a named function, `render: Demo`, read as Demo's body), else the meta's `render`, with
 * the args it inlines; and through every helper that code reaches, the helpers those reach.
 */

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const stories = path.join(root, "src/stories");
const FAMILIES = ["components", "patterns", "layout", "primitives"];

/** Families whose first manifest story needs its file's own helpers, and why. Only shrinks. */
const EXCEPTIONS = new Map([
  ["components/Announcer.stories.tsx", "the Transcript that shows what was said is the demo"],
  ["components/Density.stories.tsx", "the page documents a setting, not a part"],
  ["patterns/WorkPane.stories.tsx", "the detail content is the stories file's own"],
  ["layout/Shell.stories.tsx", "the panel's evidence table is the stories file's own"],
  ["primitives/Bleed.stories.tsx", "presentational labels and frames show the spacing"],
  ["primitives/Flex.stories.tsx", "presentational labels and frames show the spacing"],
  ["primitives/Grid.stories.tsx", "presentational labels and frames show the spacing"],
  ["primitives/Inline.stories.tsx", "presentational labels and frames show the spacing"],
  ["primitives/Stack.stories.tsx", "presentational labels and frames show the spacing"],
]);

/** Families whose first manifest story reads an arg the manifest prints as written. Only shrinks. */
const ARGS_EXCEPTIONS = new Map([
  ["components/Attachment.stories.tsx", "the Playground's description follows the state control"],
  [
    "components/Field.stories.tsx",
    "the Playground shows its FieldError while the invalid control is on",
  ],
]);

const unwrap = (node) => {
  while (
    node &&
    (ts.isParenthesizedExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isNonNullExpression(node))
  )
    node = node.expression;
  return node;
};
const isFunction = (node) =>
  !!node &&
  (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node));
const isElement = (node) =>
  !!node && (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node));
/** Whether the expression calls, anywhere inside it, a callee the test accepts. */
const calls = (node, test) => {
  let found = false;
  const visit = (child) => {
    if (found) return;
    if (ts.isCallExpression(child) && test(child.expression)) found = true;
    else ts.forEachChild(child, visit);
  };
  if (node) visit(node);
  return found;
};
const exported = (statement) =>
  !!statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
const keyOf = (name) => (ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : null);
/** A property of an object literal, as written, and as Storybook reads it: spreads are not followed. */
const rawPropertyOf = (object, key) =>
  object && ts.isObjectLiteralExpression(object)
    ? object.properties.find((p) => ts.isPropertyAssignment(p) && keyOf(p.name) === key)
        ?.initializer
    : undefined;
const propertyOf = (object, key) => unwrap(rawPropertyOf(object, key));
/** Whether the manifest writes the `children` arg into the code: with no render, at `args.children`, or into an element that spreads the args and has no children of its own. */
const injectsChildren = (render) => {
  if (!render) return true;
  let found = false;
  const isArgs = (node) => ts.isIdentifier(node) && node.text === "args";
  const visit = (node) => {
    if (found) return;
    if (
      ts.isPropertyAccessExpression(node) &&
      isArgs(node.expression) &&
      node.name.text === "children"
    )
      found = true;
    else if (
      (ts.isJsxSelfClosingElement(node) ||
        (ts.isJsxElement(node) && node.children.every((c) => ts.isJsxText(c) && !c.text.trim()))) &&
      (ts.isJsxElement(node) ? node.openingElement : node).attributes.properties.some(
        (a) => ts.isJsxSpreadAttribute(a) && isArgs(a.expression),
      )
    )
      found = true;
    else ts.forEachChild(node, visit);
  };
  visit(render);
  return found;
};
const tagsOf = (object) => {
  const tags = propertyOf(object, "tags");
  return tags && ts.isArrayLiteralExpression(tags)
    ? tags.elements.filter(ts.isStringLiteralLike).map((tag) => tag.text)
    : [];
};
const parse = (file, text = fs.readFileSync(file, "utf8")) =>
  ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

/** What each name a `_lib` module exports is: "component", "function" or data (left out). */
const libraries = new Map();
function libraryExports(specifier, from) {
  const base = path.resolve(path.dirname(from), specifier);
  const file = [".tsx", ".ts", ""].map((ext) => base + ext).find((f) => fs.existsSync(f));
  if (!file) return new Map();
  if (libraries.has(file)) return libraries.get(file);
  const kinds = new Map();
  const kind = (name, node) =>
    isFunction(node) && kinds.set(name, /^[A-Z]/.test(name) ? "component" : "function");
  for (const statement of parse(file).statements) {
    if (!exported(statement)) continue;
    if (ts.isFunctionDeclaration(statement) && statement.name) kind(statement.name.text, statement);
    if (ts.isVariableStatement(statement))
      for (const d of statement.declarationList.declarations)
        if (ts.isIdentifier(d.name)) kind(d.name.text, unwrap(d.initializer));
  }
  libraries.set(file, kinds);
  return kinds;
}

/** Names whose identifier here is a declaration or a key, not a use. */
function isUse(node) {
  const parent = node.parent;
  if (
    (ts.isPropertyAccessExpression(parent) ||
      ts.isPropertyAssignment(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isPropertySignature(parent) ||
      ts.isJsxAttribute(parent) ||
      ts.isQualifiedName(parent)) &&
    parent.name === node
  )
    return false;
  if (ts.isBindingElement(parent) && parent.propertyName === node) return false;
  return !(ts.isTypeReferenceNode(parent) || ts.isTypeQueryNode(parent));
}

/** Every story of a stories file, in order, with what its manifest code reaches. */
function storiesOf(file, text) {
  const source = parse(file, text);
  /** name -> { kind: "ref" | "spy" | "own" | "lib-component" | "lib-function", node? } */
  const helpers = new Map();
  const namespaces = new Map();
  const declarations = new Map();
  const exports = [];
  let meta;
  const fromLibrary = (local, kinds, name) => {
    const kind = kinds.get(name);
    if (kind) helpers.set(local, { kind: `lib-${kind}` });
  };
  /** The local names of storybook/test's `fn`, whose spies are the stories file's own. */
  const spies = new Set();
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const specifier = statement.moduleSpecifier.text;
      const clause = statement.importClause;
      if (specifier === "storybook/test" && clause?.namedBindings && !clause.isTypeOnly)
        for (const element of clause.namedBindings.elements ?? [])
          if ((element.propertyName ?? element.name).text === "fn") spies.add(element.name.text);
      if (!/(^|\/)_lib\//.test(specifier) || !clause || clause.isTypeOnly) continue;
      const kinds = libraryExports(specifier, file);
      const bindings = clause.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) namespaces.set(bindings.name.text, kinds);
      if (bindings && ts.isNamedImports(bindings))
        for (const element of bindings.elements)
          fromLibrary(element.name.text, kinds, (element.propertyName ?? element.name).text);
    } else if (ts.isFunctionDeclaration(statement) && statement.name) {
      declarations.set(statement.name.text, statement);
      if (exported(statement)) exports.push({ name: statement.name.text, story: statement });
      else helpers.set(statement.name.text, { kind: "own", node: statement });
    } else if (ts.isClassDeclaration(statement) && statement.name) {
      helpers.set(statement.name.text, { kind: "own", node: statement });
    } else if (ts.isExportAssignment(statement)) {
      const value = unwrap(statement.expression);
      meta = ts.isIdentifier(value) ? declarations.get(value.text) : value;
    } else if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) {
        const init = unwrap(d.initializer);
        // const { Matrix, Specimens } = storyLayout, the binding Guidance/Writing stories asks for.
        if (ts.isObjectBindingPattern(d.name)) {
          const kinds = init && ts.isIdentifier(init) && namespaces.get(init.text);
          if (kinds)
            for (const element of d.name.elements)
              if (ts.isIdentifier(element.name))
                fromLibrary(
                  element.name.text,
                  kinds,
                  keyOf(element.propertyName ?? element.name) ?? "",
                );
          continue;
        }
        if (!ts.isIdentifier(d.name)) continue;
        const name = d.name.text;
        declarations.set(name, init);
        if (exported(statement)) exports.push({ name, story: init });
        else if (isFunction(init) || isElement(init))
          helpers.set(name, { kind: "own", node: init });
        else if (
          init &&
          ts.isCallExpression(init) &&
          /(^|\.)(forwardRef|memo|lazy)$/.test(init.expression.getText(source))
        )
          helpers.set(name, { kind: "own", node: init });
        // A ref made here, alone or held in an object or a list (`{ nav: createRef() }`), and a
        // storybook/test spy (`fn()`) are the file's own: copied, the code reaches neither.
        else if (calls(init, (callee) => /(^|\.)createRef$/.test(callee.getText(source))))
          helpers.set(name, { kind: "ref" });
        else if (calls(init, (callee) => ts.isIdentifier(callee) && spies.has(callee.text)))
          helpers.set(name, { kind: "spy" });
      }
    }
  }
  meta = unwrap(meta);
  const metaOff = tagsOf(meta).includes("!manifest");

  /** The helpers the nodes use, and through each of the file's own, the helpers it uses. */
  function reach(nodes, seen) {
    const found = [];
    const visit = (node, locals, via) => {
      if (ts.isIdentifier(node)) {
        const helper = isUse(node) && !locals.has(node.text) && helpers.get(node.text);
        if (helper && !seen.has(node.text)) {
          seen.add(node.text);
          found.push(via ? `${node.text} (through ${via})` : node.text);
          if (helper.node) walk(helper.node, via ?? node.text);
        }
        return;
      }
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        namespaces.get(node.expression.text)?.has(node.name.text)
      ) {
        found.push(node.getText(source));
        return;
      }
      ts.forEachChild(node, (child) => visit(child, locals, via));
    };
    const walk = (node, via) => {
      // A name the code declares for itself shadows the module's.
      const locals = new Set();
      const bind = (name) => {
        if (ts.isIdentifier(name)) locals.add(name.text);
        else name?.elements?.forEach((element) => element.name && bind(element.name));
      };
      const collect = (child) => {
        if (
          (ts.isVariableDeclaration(child) ||
            ts.isParameter(child) ||
            ts.isBindingElement(child)) &&
          child.name
        )
          bind(child.name);
        if (ts.isFunctionDeclaration(child) && child.name && child !== node) bind(child.name);
        ts.forEachChild(child, collect);
      };
      collect(node);
      if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node))
        ts.forEachChild(node, (child) => child !== node.name && visit(child, locals, via));
      else visit(node, locals, via);
    };
    for (const node of nodes) walk(node, undefined);
    return found;
  }

  return exports.map(({ name, story }) => {
    story = unwrap(story);
    const off = metaOff || tagsOf(story).includes("!manifest");
    let render = isFunction(story)
      ? story
      : (propertyOf(story, "render") ?? propertyOf(meta, "render"));
    const seen = new Set();
    if (render && ts.isIdentifier(render)) {
      seen.add(render.text);
      render = unwrap(declarations.get(render.text));
    }
    const nodes = render ? [render] : [];
    // The args reach the code where the render reads them, or as the component's props.
    const readsArgs = !render || /\bargs\b/.test(render.getText(source));
    if (readsArgs)
      nodes.push(...[propertyOf(meta, "args"), propertyOf(story, "args")].filter((args) => !!args));
    const found = reach(nodes, seen);
    const library = found.filter((use) => {
      const helper = helpers.get(use.split(" ")[0]);
      return helper ? helper.kind === "lib-component" : /^\w+\.[A-Z]/.test(use);
    });
    // The manifest writes a `children` arg in as the element's children, and JSX written in
    // parentheses keeps them, as text: `<Alert>(<>…</>)</Alert>`.
    const children =
      rawPropertyOf(propertyOf(story, "args"), "children") ??
      rawPropertyOf(propertyOf(meta, "args"), "children");
    const parens =
      readsArgs &&
      injectsChildren(render) &&
      !!children &&
      ts.isParenthesizedExpression(children) &&
      isElement(unwrap(children));
    // What the printed code itself names that copying it cannot bring: a ref, a spy, or a
    // function or element of the file. A component of the file is allowed: the reader sees one
    // call, or a stand-in (a demo router link) they replace with their own.
    const dangling = found.filter((use) => {
      const helper = !use.includes(" (through ") && helpers.get(use);
      if (!helper) return false;
      return (
        helper.kind === "ref" ||
        helper.kind === "spy" ||
        (helper.kind === "own" && !/^[A-Z]/.test(use))
      );
    });
    const keys = new Set(
      [propertyOf(meta, "args"), propertyOf(story, "args")].flatMap((args) =>
        args && ts.isObjectLiteralExpression(args)
          ? args.properties.flatMap((p) => (p.name && keyOf(p.name)) || [])
          : [],
      ),
    );
    const argsLeft = render && isFunction(render) ? argsNotWritten(render, keys) : [];
    return { story: name, off, helpers: found, library, parens, dangling, argsLeft };
  });
}

/**
 * What a story's code reads of its args that the manifest prints as it is. The manifest writes an
 * arg in place only as `{...args}` or `prop={args.key}` on an element of the JSX the code returns
 * (an element's children, never JSX inside a prop or an expression), and `{args.children}`; then
 * it drops the parameter. Any other read stays `args.key`, under a parameter the copy no longer
 * has, or under an untyped `(args) =>`, and neither compiles on its own. A component's props with
 * their type written in (`function Demo({ open = false }: { open?: boolean })`) copy as they are.
 */
function argsNotWritten(render, keys) {
  const [first, ...more] = render.parameters;
  const left = [];
  const named = first && ts.isIdentifier(first.name) ? first.name.text : null;
  const uses = (param) => {
    const names = new Set();
    const bind = (n) =>
      ts.isIdentifier(n) ? names.add(n.text) : n.elements?.forEach((e) => e.name && bind(e.name));
    bind(param.name);
    let used = false;
    const visit = (n) => {
      if (used) return;
      if (ts.isIdentifier(n) && names.has(n.text) && isUse(n) && n.parent !== param) used = true;
      else ts.forEachChild(n, visit);
    };
    visit(render.body);
    return used;
  };
  if (first && !first.type && named !== "args" && uses(first)) left.push(first.name.getText());
  for (const param of more) if (!param.type && uses(param)) left.push(param.name.getText());
  if (named !== "args") return left;
  const written = new Set();
  const isArgs = (n) => !!n && ts.isIdentifier(n) && n.text === "args";
  const argOf = (e) =>
    e && ts.isPropertyAccessExpression(e) && isArgs(e.expression) ? e.name.text : null;
  const walk = (node) => {
    node = unwrap(node);
    if (!node) return;
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      for (const a of opening.attributes.properties) {
        if (ts.isJsxSpreadAttribute(a) && isArgs(a.expression)) written.add(a.expression);
        else if (ts.isJsxAttribute(a) && a.initializer && ts.isJsxExpression(a.initializer)) {
          const key = argOf(a.initializer.expression);
          if (key && keys.has(key)) written.add(a.initializer.expression.expression);
        }
      }
    }
    if (!ts.isJsxElement(node) && !ts.isJsxFragment(node)) return;
    for (const child of node.children) {
      if (ts.isJsxExpression(child)) {
        if (argOf(child.expression) === "children" && keys.has("children"))
          written.add(child.expression.expression);
      } else walk(child);
    }
  };
  if (ts.isBlock(render.body)) {
    for (const statement of render.body.statements)
      if (ts.isReturnStatement(statement)) walk(statement.expression);
  } else walk(render.body);
  const visit = (n) => {
    if (isArgs(n) && isUse(n) && n.parent !== first && !written.has(n)) {
      const key = argOf(n.parent);
      left.push(key ? `args.${key}` : "args");
    }
    ts.forEachChild(n, visit);
  };
  visit(render.body);
  return [...new Set(left)];
}

const files = FAMILIES.flatMap((folder) =>
  fs
    .readdirSync(path.join(stories, folder))
    .filter((name) => name.endsWith(".stories.tsx"))
    .map((name) => `${folder}/${name}`),
);
const analysed = new Map(files.map((file) => [file, storiesOf(path.join(stories, file))]));
const firstInManifest = (file) => analysed.get(file)?.find((story) => !story.off);

test("a family's first manifest story renders its parts and nothing of the file's own", () => {
  assert.ok(files.length > 100, `only ${files.length} stories files were found`);
  const problems = [];
  for (const file of files) {
    if (EXCEPTIONS.has(file)) continue;
    const first = firstInManifest(file);
    if (first?.helpers.length)
      problems.push(`${file} ${first.story} leans on ${first.helpers.join(", ")}`);
  }
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("the second and third manifest stories name no ref, spy, function or element of their file", () => {
  const problems = [];
  for (const [file, list] of analysed)
    for (const story of list.filter((s) => !s.off).slice(1, 3))
      if (story.dangling.length)
        problems.push(
          `${file} ${story.story} names ${story.dangling.join(", ")}: pass a callback as an fn() arg, move a ref check into a story tagged !manifest, or write the value inline`,
        );
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("the first three manifest stories read their args only where the manifest writes them in", () => {
  const problems = [];
  for (const [file, list] of analysed)
    list
      .filter((s) => !s.off)
      .slice(0, 3)
      .forEach((story, index) => {
        if (index === 0 && ARGS_EXCEPTIONS.has(file)) return;
        if (story.argsLeft.length)
          problems.push(
            `${file} ${story.story} reads ${story.argsLeft.join(", ")}, which the manifest prints as written: read an arg as prop={args.key} on an element of the returned JSX, write the value in, or check the handler in a story tagged !manifest`,
          );
      });
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("no story in the manifest shows a _lib component", () => {
  const problems = [];
  for (const [file, list] of analysed)
    for (const story of list)
      if (!story.off && story.library.length)
        problems.push(
          `${file} ${story.story} renders ${story.library.join(", ")}: tag it !manifest`,
        );
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("no story in the manifest prints a JSX arg's parentheses as text", () => {
  const problems = [];
  for (const [file, list] of analysed)
    for (const story of list)
      if (!story.off && story.parens)
        problems.push(`${file} ${story.story}: write its children in the render, not in args`);
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("every exception still needs its helpers", () => {
  for (const [file, reason] of EXCEPTIONS) {
    assert.ok(reason, `${file} has no reason`);
    assert.ok(files.includes(file), `${file} is gone: drop it from EXCEPTIONS`);
    assert.ok(
      firstInManifest(file)?.helpers.length,
      `${file} no longer needs an exception: drop it`,
    );
  }
  for (const [file, reason] of ARGS_EXCEPTIONS) {
    assert.ok(reason, `${file} has no reason`);
    assert.ok(files.includes(file), `${file} is gone: drop it from ARGS_EXCEPTIONS`);
    assert.ok(
      firstInManifest(file)?.argsLeft.length,
      `${file} no longer needs an exception: drop it from ARGS_EXCEPTIONS`,
    );
  }
});

/** One story per way a story's code reads its args, as the manifest writes them in or not. */
const ARGS_FIXTURE = `
import { fn as spy } from "storybook/test";
import { Button, Field, Input, Text } from "../../components";
const meta = { title: "Components/ArgsFixture", args: { label: "Owner" } };
export default meta;
export const Spread = { render: (args) => <Field {...args}><Input /></Field> };
export const Prop = { args: { onClick: spy() }, render: (args) => <Field><Button onClick={args.onClick}>Save</Button></Field> };
export const Block = { args: { onClick: spy() }, render: (args) => { const word = "Save"; return <Button onClick={args.onClick}>{word}</Button>; } };
export const Children = { args: { children: "Save" }, render: (args) => <Button>{args.children}</Button> };
export const Unused = { render: (args) => <Button>Save</Button> };
export const Typed = { render: function Demo({ label = "Owner" }: { label?: string }) { return <Text>{label}</Text>; } };
export const InAnExpression = { render: (args) => <Field><Text>{args.label}</Text></Field> };
export const InAProp = { render: (args) => <Field label={<Text title={args.label} />} /> };
export const InACallback = { args: { onClick: spy() }, render: (args) => <Button onClick={() => args.onClick()}>Save</Button> };
export const NotAnArg = { render: (args) => <Button onClick={args.missing}>Save</Button> };
export const Mixed = { args: { onClick: spy() }, render: (args) => <Button onClick={args.onClick} title={args.label ? "Save" : "Send"} /> };
export const Destructured = { render: ({ label }) => <Text>{label}</Text> };
`;

test("the args check sees each read the manifest prints as written", () => {
  const found = Object.fromEntries(
    storiesOf(path.join(stories, "components/ArgsFixture.stories.tsx"), ARGS_FIXTURE).map(
      (story) => [story.story, story.argsLeft],
    ),
  );
  assert.deepEqual(found, {
    Spread: [],
    Prop: [],
    Block: [],
    Children: [],
    Unused: [],
    Typed: [],
    InAnExpression: ["args.label"],
    InAProp: ["args.label"],
    InACallback: ["args.onClick"],
    NotAnArg: ["args.missing"],
    Mixed: ["args.label"],
    Destructured: ["{ label }"],
  });
});

/**
 * One story per way the manifest's code reaches a helper, two that reach none, and the children
 * args whose parentheses the manifest prints.
 */
const FIXTURE = `
import { createRef } from "react";
import { fn as spy } from "storybook/test";
import { Button, Field, Input, Text } from "../../components";
import * as storyLayout from "../_lib/matrix";
const { Specimens } = storyLayout;
const fieldRef = createRef<HTMLInputElement>();
const refs = { field: createRef<HTMLInputElement>() };
const saved = spy();
const more = (
  <Button>More</Button>
);
const format = (n: number) => String(n);
const label = "Owner";
function Items() {
  return <Text>{label}</Text>;
}
function Named() {
  return <Specimens title="States"><Button>{label}</Button></Specimens>;
}
function Outer() {
  return <Named />;
}
function WithRef() {
  return <Input ref={fieldRef} />;
}
const meta = { title: "Components/Fixture", args: { format: undefined }, render: () => <Items /> };
export default meta;
export const Comparison = { tags: ["!manifest"], render: () => <Specimens title="All" /> };
export const MetaRender = {};
export const NamedRender = { render: Named };
export const Through = { render: () => <Outer /> };
export const Args = { args: { format }, render: (args) => <Text {...args} /> };
export const Ref = { render: () => <Field><Input ref={fieldRef} /></Field> };
export const Member = { render: () => <storyLayout.Matrix rows={[]} cols={[]} render={() => null} /> };
export const Shadowed = { render: () => { const format = (n: number) => n; return <Text>{format(1)}</Text>; } };
export const Plain = { render: () => <Button>{label}</Button> };
export const RefInObject = { render: () => <Input ref={refs.field} /> };
export const Spy = { render: () => <Button onClick={saved}>Save</Button> };
export const Element = { render: () => <Text>{more}</Text> };
export const ArgSpy = { args: { onClick: spy() }, render: (args) => <Button {...args}>Save</Button> };
export const Parenthesized = {
  args: { children: (
    <Text>One</Text>
  ) },
  render: (args) => <Field {...args} />,
};
export const OwnChildren = {
  args: { children: (<Text>One</Text>) },
  render: (args) => <Field {...args}><Text>Two</Text></Field>,
};
export const Unparenthesized = { args: { children: <Text>One</Text> }, render: (args) => <Field {...args} /> };
export const RefThrough = { render: () => <WithRef /> };
`;

test("the check sees each way a story reaches a helper", () => {
  const found = Object.fromEntries(
    storiesOf(path.join(stories, "components/Fixture.stories.tsx"), FIXTURE).map((story) => [
      story.story,
      {
        off: story.off,
        helpers: story.helpers,
        library: story.library,
        parens: story.parens,
        dangling: story.dangling,
      },
    ]),
  );
  const reaches = (helpers, library = [], parens = false, dangling = []) => ({
    off: false,
    helpers,
    library,
    parens,
    dangling,
  });
  assert.deepEqual(found, {
    Comparison: {
      off: true,
      helpers: ["Specimens"],
      library: ["Specimens"],
      parens: false,
      dangling: [],
    },
    MetaRender: reaches(["Items"]),
    NamedRender: reaches(["Specimens"], ["Specimens"]),
    Through: reaches(
      ["Outer", "Named (through Outer)", "Specimens (through Outer)"],
      ["Specimens (through Outer)"],
    ),
    Args: reaches(["format"], [], false, ["format"]),
    Ref: reaches(["fieldRef"], [], false, ["fieldRef"]),
    Member: reaches(["storyLayout.Matrix"], ["storyLayout.Matrix"]),
    Shadowed: reaches([]),
    Plain: reaches([]),
    RefInObject: reaches(["refs"], [], false, ["refs"]),
    Spy: reaches(["saved"], [], false, ["saved"]),
    Element: reaches(["more"], [], false, ["more"]),
    ArgSpy: reaches([]),
    Parenthesized: reaches([], [], true),
    OwnChildren: reaches([]),
    Unparenthesized: reaches([]),
    RefThrough: reaches(["WithRef", "fieldRef (through WithRef)"]),
  });
});
