import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

/*
 * A Do beside a Don't teaches by the difference, so its play asserts what makes the Do right and
 * the Don't wrong: the name, the role, the description or the state a reader meets
 * (Guidance/Writing stories). A story is such a pair when it is named so (the export `Dont`,
 * `DoDont` or `DoAndDont`, or a `name` that starts Don't or Do and don't), or when its code renders
 * the `_lib` Pair, itself or through a component or function of its file. Each has a play that
 * calls `expect`, written in the story or in a function of its file the play reaches, its own or
 * one it takes from the story it spreads or from the meta.
 *
 * The pairs that predate the rule and have no such play yet are listed in dont-play-allow.json
 * with why. The list may only shrink (scripts/check-allow-lists.mjs compares it with its base), and
 * an entry for a pair that has its play now, or for a story that is gone, fails until it is removed.
 */

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const stories = path.join(root, "src/stories");
const allowed = JSON.parse(
  fs.readFileSync(path.join(root, "test/dont-play-allow.json"), "utf8"),
).stories;

const NAMED_EXPORT = /^(?:Dont|DoDont|DoAndDont)$/;
const NAMED = /^(?:do and )?don['’]?t\b/i;

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
const keyOf = (name) => (ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : null);
/** A property of an object literal as written: an assignment, a method or a shorthand. */
const propertyOf = (object, key) =>
  object.properties.find(
    (p) =>
      (ts.isPropertyAssignment(p) ||
        ts.isMethodDeclaration(p) ||
        ts.isShorthandPropertyAssignment(p)) &&
      keyOf(p.name) === key,
  );
const exported = (statement) =>
  !!statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

/** The names the file declares at its top level, each with the node that defines it. */
function declarations(source) {
  const declared = new Map();
  for (const statement of source.statements) {
    if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name)
      declared.set(statement.name.text, statement);
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) declared.set(declaration.name.text, declaration);
      else if (ts.isObjectBindingPattern(declaration.name))
        for (const element of declaration.name.elements)
          if (ts.isIdentifier(element.name)) declared.set(element.name.text, declaration);
    }
  }
  return declared;
}

/** The node and every top-level declaration of its file it names, and the ones those name. */
function reach(node, declared) {
  const seen = new Set([node]);
  const queue = [node];
  while (queue.length > 0) {
    const visit = (child) => {
      if (ts.isIdentifier(child)) {
        const target = declared.get(child.text);
        if (target && !seen.has(target)) {
          seen.add(target);
          queue.push(target);
        }
      }
      ts.forEachChild(child, visit);
    };
    visit(queue.pop());
  }
  return [...seen];
}

/** Whether any of the nodes renders `<Pair …>`. */
function rendersPair(nodes) {
  let found = false;
  const visit = (node) => {
    if (found) return;
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      node.tagName.text === "Pair"
    )
      found = true;
    else ts.forEachChild(node, visit);
  };
  for (const node of nodes) visit(node);
  return found;
}

/** Whether any of the nodes calls `expect`. */
function callsExpect(nodes) {
  let found = false;
  const visit = (node) => {
    if (found) return;
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "expect"
    )
      found = true;
    else ts.forEachChild(node, visit);
  };
  for (const node of nodes) visit(node);
  return found;
}

/**
 * The Do and don't stories of one stories file: each export, its name, and whether it has a play
 * that calls `expect`.
 */
function pairsIn(text, file = "story.stories.tsx") {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declared = declarations(source);
  const objects = new Map();
  let meta;
  for (const statement of source.statements) {
    if (ts.isExportAssignment(statement)) {
      const value = unwrap(statement.expression);
      const target = ts.isIdentifier(value) ? unwrap(declared.get(value.text)?.initializer) : value;
      if (target && ts.isObjectLiteralExpression(target)) meta = target;
    }
    if (!ts.isVariableStatement(statement) || !exported(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const object = unwrap(declaration.initializer);
      if (ts.isIdentifier(declaration.name) && object && ts.isObjectLiteralExpression(object))
        objects.set(declaration.name.text, object);
    }
  }
  /** The play a story object has, its own or the one it takes from a story it spreads. */
  const playOf = (object, seen = new Set()) => {
    const own = propertyOf(object, "play");
    if (own) return own;
    for (const property of object.properties) {
      if (!ts.isSpreadAssignment(property)) continue;
      const spread = unwrap(property.expression);
      const from = ts.isIdentifier(spread)
        ? (objects.get(spread.text) ?? unwrap(declared.get(spread.text)?.initializer))
        : spread;
      if (from && ts.isObjectLiteralExpression(from) && !seen.has(from)) {
        seen.add(from);
        const inherited = playOf(from, seen);
        if (inherited) return inherited;
      }
    }
    return undefined;
  };
  const metaPlay = meta ? propertyOf(meta, "play") : undefined;
  const pairs = [];
  for (const [exportName, object] of objects) {
    if (object === meta) continue;
    const nameProperty = propertyOf(object, "name");
    const named =
      nameProperty && ts.isPropertyAssignment(nameProperty)
        ? unwrap(nameProperty.initializer)
        : undefined;
    const name = named && ts.isStringLiteralLike(named) ? named.text : exportName;
    const isPair =
      NAMED_EXPORT.test(exportName) || NAMED.test(name) || rendersPair(reach(object, declared));
    if (!isPair) continue;
    const play = playOf(object) ?? metaPlay;
    pairs.push({ exportName, name, asserts: Boolean(play) && callsExpect(reach(play, declared)) });
  }
  return pairs;
}

/** Every Do and don't story in the package, keyed `<folder>/<file>::<export>`. */
function packagePairs() {
  const found = [];
  for (const folder of fs.readdirSync(stories, { withFileTypes: true })) {
    if (!folder.isDirectory() || folder.name.startsWith("_")) continue;
    const dir = path.join(stories, folder.name);
    const files = fs.readdirSync(dir).filter((file) => file.endsWith(".stories.tsx"));
    for (const file of files.sort()) {
      const text = fs.readFileSync(path.join(dir, file), "utf8");
      for (const pair of pairsIn(text, file))
        found.push({ ...pair, key: `${folder.name}/${file}::${pair.exportName}` });
    }
  }
  return found;
}

test("a pair is found by its name, or by the Pair it renders, itself or through its file", () => {
  const source = `
    import * as pairLayout from "../_lib/pair";
    const { Pair } = pairLayout;
    const meta = { title: "Components/Example" };
    export default meta;
    function Examples() {
      return <Pair do={<b />} doText="" dont={<i />} dontText="" />;
    }
    const check = async () => {
      await expect(1).toBe(1);
    };
    export const Playground = {};
    export const Dont = { render: () => <span /> };
    export const DoDont = { name: "Do and don't", render: () => <span />, play: check };
    export const Guidance = { render: () => <Pair do={<b />} doText="" dont={<i />} dontText="" /> };
    export const Through = { render: () => <Examples />, play: async () => {} };
    export const Spread = { ...DoDont, name: "Don't, again" };
  `;
  assert.deepEqual(pairsIn(source), [
    { exportName: "Dont", name: "Dont", asserts: false },
    { exportName: "DoDont", name: "Do and don't", asserts: true },
    { exportName: "Guidance", name: "Guidance", asserts: false },
    { exportName: "Through", name: "Through", asserts: false },
    { exportName: "Spread", name: "Don't, again", asserts: true },
  ]);
});

test("every Do and don't story has a play that asserts what makes the Do right and the Don't wrong", () => {
  const missing = packagePairs()
    .filter((pair) => !pair.asserts && !(pair.key in allowed))
    .map((pair) => pair.key);
  assert.deepEqual(
    missing,
    [],
    `These stories show a Do beside a Don't with no play that calls expect. Assert what makes the Do right and the Don't wrong, the name, the role, the description or the state a reader meets (Guidance/Writing stories): ${missing.join(", ")}`,
  );
});

test("dont-play-allow.json names only pairs that still have no play", () => {
  const pairs = new Map(packagePairs().map((pair) => [pair.key, pair]));
  const stale = Object.keys(allowed).filter((key) => pairs.get(key)?.asserts !== false);
  assert.deepEqual(
    stale,
    [],
    `These entries name a story that has its play now, or that is no longer a Do and don't story: remove them from test/dont-play-allow.json. ${stale.join(", ")}`,
  );
});
