// Maintained catalog components have a story that renders them, and a documentation page.
// Page structure follows the component's needs; accuracy is reviewed with the examples. Existing gaps are
// grandfathered in scripts/ds-check.allow; a new gap fails, and an allowlisted entry that closes must
// leave the allowlist so the list only shrinks. `npm run build` runs this first.
// A part of a compound (`Object.assign(Stat, { Grid: StatGrid })`) is exported so its props table
// generates and is covered by its compound name in a story (Stat.Grid); an export marked
// `@deprecated` is an alias kept for the lint's rename and needs no story. A stories file's meta
// `component` counts as rendered when one of its stories has no `render` of its own, since
// Storybook then renders the component from the story's args.
//
// Two documentation checks fail: a namespace member whose function its module does not export
// (docgen documents a module's exports, so the member gets no props table), and a family page
// whose stories name a `component` but that renders no `<ArgTypes>`. A third reports without
// failing until the families it names close it: an exported family (one source file) with no page
// that shows generated props. `--usage` lists the catalog parts the application under src/ never
// imports; the count prints on every run.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { execFileSync } from "node:child_process";
import { publicApi } from "./ds-public-api.mjs";

const PKG = "packages/design-system/src";
const LAYERS = ["primitives", "components", "patterns", "layout", "mode"];
// Story folders whose files are families and need a page. Tokens are sheets; docs are pages already.
const PAGE_FOLDERS = ["components", "patterns", "primitives", "layout"];
// The application's product source; the shadcn and reui reference installs are not product code.
const APP = "src";
const APP_REFERENCE_INSTALLS = [
  "src/components/ui",
  "src/components/reui",
  "src/components/examples",
];

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(tsx?|mdx)$/.test(p)) out.push(p);
  }
  return out;
};
const parse = (file) =>
  ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
const isCatalogName = (name) => /^[A-Z]/.test(name) && !/^[A-Z0-9_]+$/.test(name);

// name -> file, for every component the package exports from its layers
const exports_ = new Map(
  publicApi
    .filter((e) => e.kind === "value" && isCatalogName(e.name) && !e.deprecated)
    .map((e) => [e.name, e.source]),
);
const publicValues = new Set(publicApi.filter((e) => e.kind === "value").map((e) => e.name));

/** The names a module exports or imports: docgen documents a module's exports, so a compound's member
 * has a props table when its function is exported from the module that declares it. */
const namedIn = (source) => {
  const names = new Set();
  const exported = (node) => node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  for (const statement of source.statements) {
    if (
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
      exported(statement)
    )
      names.add(statement.name?.text);
    else if (ts.isVariableStatement(statement) && exported(statement))
      for (const declaration of statement.declarationList.declarations)
        names.add(declaration.name.getText(source));
    else if (
      ts.isExportDeclaration(statement) &&
      !statement.moduleSpecifier &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    )
      for (const element of statement.exportClause.elements)
        names.add((element.propertyName ?? element.name).text);
    else if (ts.isImportDeclaration(statement)) {
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings))
        for (const element of bindings.elements) names.add(element.name.text);
    }
  }
  return names;
};

// Compound parts: `export const Stat = Object.assign(StatRoot, { Grid: StatGrid })`.
const partOf = new Map(); // StatGrid -> Stat.Grid
const namespaceMembers = []; // { member: "Stat.Grid", value: "StatGrid", named: true }
for (const layer of LAYERS) {
  for (const f of walk(path.join(PKG, layer))) {
    if (!/\.tsx?$/.test(f)) continue;
    const source = parse(f);
    const named = namedIn(source);
    for (const statement of source.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      if (!statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
      for (const declaration of statement.declarationList.declarations) {
        const init = declaration.initializer;
        if (
          !init ||
          !ts.isCallExpression(init) ||
          init.expression.getText(source) !== "Object.assign"
        )
          continue;
        const members = init.arguments[1];
        if (!members || !ts.isObjectLiteralExpression(members)) continue;
        const namespace = declaration.name.getText(source);
        for (const property of members.properties) {
          const key =
            ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property)
              ? property.name.getText(source)
              : null;
          if (!key || !/^[A-Z]/.test(key)) continue;
          const value = ts.isPropertyAssignment(property)
            ? property.initializer.getText(source)
            : key;
          partOf.set(value, `${namespace}.${key}`);
          if (publicValues.has(namespace))
            namespaceMembers.push({
              member: `${namespace}.${key}`,
              value,
              named: named.has(value),
            });
        }
      }
    }
  }
}

const storyTree = walk(path.join(PKG, "stories"));
const storyFiles = storyTree.filter((f) => /\.stories\.tsx?$/.test(f));
const pageFiles = storyTree.filter((f) => f.endsWith(".mdx"));

/** The default meta object of a stories file: `const meta = {…}` exported as default, or inline. */
const metaObject = (source) => {
  let name = null;
  let inline = null;
  for (const statement of source.statements)
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      let expression = statement.expression;
      while (ts.isSatisfiesExpression(expression) || ts.isAsExpression(expression))
        expression = expression.expression;
      if (ts.isIdentifier(expression)) name = expression.text;
      else if (ts.isObjectLiteralExpression(expression)) inline = expression;
    }
  if (inline) return inline;
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(source) !== name || !declaration.initializer) continue;
      let expression = declaration.initializer;
      while (ts.isSatisfiesExpression(expression) || ts.isAsExpression(expression))
        expression = expression.expression;
      if (ts.isObjectLiteralExpression(expression)) return expression;
    }
  }
  return null;
};
const propertyOf = (object, key, source) =>
  object?.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText(source) === key);

// Only executable syntax counts; imports and comments cannot manufacture coverage.
const storyReferences = new Set();
const metaComponentOf = new Map(); // stories file -> its meta `component`
for (const file of [...storyFiles, "packages/design-system/.storybook/preview.tsx"]) {
  const source = parse(file);
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) return;
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))
      storyReferences.add(node.tagName.getText(source));
    if (ts.isCallExpression(node)) storyReferences.add(node.expression.getText(source));
    ts.forEachChild(node, visit);
  };
  visit(source);
  const meta = metaObject(source);
  const component = propertyOf(meta, "component", source)?.initializer.getText(source);
  if (!component) continue;
  metaComponentOf.set(file, component);
  const metaRenders = Boolean(propertyOf(meta, "render", source));
  // A story object with no `render` (its own or the meta's) renders the meta's component.
  const rendersComponent = source.statements.some(
    (statement) =>
      ts.isVariableStatement(statement) &&
      statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      statement.declarationList.declarations.some((declaration) => {
        let expression = declaration.initializer;
        while (
          expression &&
          (ts.isSatisfiesExpression(expression) || ts.isAsExpression(expression))
        )
          expression = expression.expression;
        return (
          expression &&
          ts.isObjectLiteralExpression(expression) &&
          !propertyOf(expression, "render", source) &&
          !metaRenders
        );
      }),
  );
  if (rendersComponent) storyReferences.add(component);
}
const storyCount = storyFiles.reduce(
  (n, f) => n + (fs.readFileSync(f, "utf8").match(/^export const /gm) ?? []).length,
  0,
);

const inStories = (name) =>
  storyReferences.has(name) || [...storyReferences].some((ref) => ref.startsWith(`${name}.`));
const covered = (name) => inStories(name) || (partOf.has(name) && inStories(partOf.get(name)));

// Every story file in a page folder has an MDX page (`<Meta of={…}>` importing it).
const pageOf = (storyFile) => {
  const stem = path.basename(storyFile).replace(/\.stories\.tsx?$/, "");
  const dir = path.dirname(storyFile);
  // The page named like the story file, else the one whose <Meta of={…}> is that file's namespace
  // (a part page may import an overview's stories to embed one; that does not make it the overview's page).
  const named = pageFiles.find((p) => path.dirname(p) === dir && path.basename(p, ".mdx") === stem);
  if (named) return named;
  return pageFiles.find((p) => {
    if (path.dirname(p) !== dir) return false;
    const text = fs.readFileSync(p, "utf8");
    const ns = text.match(new RegExp(`import \\* as (\\w+) from "\\./${stem}\\.stories"`));
    return ns ? new RegExp(`<Meta of=\\{${ns[1]}\\}`).test(text) : false;
  });
};
const pageGaps = [];
for (const sf of storyFiles) {
  const folder = path.basename(path.dirname(sf));
  if (!PAGE_FOLDERS.includes(folder)) continue;
  const stem = path.basename(sf).replace(/\.stories\.tsx?$/, "");
  const page = pageOf(sf);
  if (!page) pageGaps.push(`page:${stem}`);
}

const allowPath = "scripts/ds-check.allow";
const allow = new Set(
  fs.existsSync(allowPath)
    ? fs
        .readFileSync(allowPath, "utf8")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"))
    : [],
);

const missing = [...exports_.keys()].filter((n) => !covered(n)).sort();
const gaps = [...missing, ...pageGaps.sort()];
const newGaps = gaps.filter((n) => !allow.has(n));
const stale = [...allow].filter((n) => !gaps.includes(n)).sort();

const pagesChecked = storyFiles.filter((sf) =>
  PAGE_FOLDERS.includes(path.basename(path.dirname(sf))),
).length;
const pagesComplete = pagesChecked - pageGaps.length;
console.log(
  `${exports_.size} exports · ${exports_.size - missing.length} with a story · ${missing.length} without · ${pagesComplete}/${pagesChecked} family pages · ${storyCount} stories in ${storyFiles.length} files (${allow.size} grandfathered)`,
);
if (newGaps.length) {
  console.log(
    `\nNew gaps (add the story or page under ${PKG}/stories, coverage exceptions cannot grow):`,
  );
  for (const n of newGaps) console.log(`  ${n}${exports_.has(n) ? `  ← ${exports_.get(n)}` : ""}`);
}
if (stale.length) {
  console.log("\nAllowlisted entries that are closed. Remove them from scripts/ds-check.allow:");
  for (const n of stale) console.log(`  ${n}`);
}

/* ---------- documentation checks: props tables ---------- */

const familyPages = pageFiles.filter((p) => PAGE_FOLDERS.includes(path.basename(path.dirname(p))));
const argTypesOf = new Set();
for (const page of familyPages)
  for (const m of fs.readFileSync(page, "utf8").matchAll(/<ArgTypes\s+of=\{([\w.]+)\}/g))
    argTypesOf.add(m[1]);
// A part has a props table when a page renders one for it, for it as a namespace member
// (Chart.Frame covers ChartFrame), or for a member of it as a namespace (Chart.Frame covers Chart).
const hasProps = (name) =>
  argTypesOf.has(name) ||
  [...metaComponentOf.values()].includes(name) ||
  (partOf.has(name) && argTypesOf.has(partOf.get(name))) ||
  [...argTypesOf].some((shown) => shown.startsWith(`${name}.`));
const grouped = (entries) => {
  const byKey = new Map();
  for (const [key, value] of entries) byKey.set(key, [...(byKey.get(key) ?? []), value]);
  return [...byKey].map(([key, values]) => `${key}: ${values.join(", ")}`);
};
const report = (title, lines) => {
  if (!lines.length) return;
  console.log(`\n${title}`);
  for (const line of lines) console.log(`  ${line}`);
};

// Docgen documents what a module exports: a member whose function the module keeps private gets
// no props table on its page or in MCP docs-show. This fails.
const unnamedMembers = namespaceMembers.filter(({ named }) => !named);
report(
  `${unnamedMembers.length} namespace members are not exported from their module, so docgen lists no props for them (export the part's function by name as well; AGENTS.md):`,
  grouped(unnamedMembers.map(({ member }) => member.split(".")).map(([ns, key]) => [ns, key])),
);

// An exported family (one source file) has a page that shows the props of at least one of its parts.
// This reports without failing until the DataTable family's pages show theirs.
const bySource = new Map();
for (const [name, source] of exports_)
  bySource.set(source, [...(bySource.get(source) ?? []), name]);
const familiesWithoutProps = [...bySource]
  .filter(([, names]) => !names.some(hasProps))
  .map(([source, names]) => `${source}: ${names.join(", ")}`);
report(
  `${familiesWithoutProps.length} exported families have no page with generated props (add <ArgTypes of={Part} /> to the family's page):`,
  familiesWithoutProps,
);

// A family page whose stories name a component shows that component's generated props,
// here or on the component's own page. This fails.
const pagesWithoutProps = [];
for (const [storiesFile, component] of metaComponentOf) {
  if (!PAGE_FOLDERS.includes(path.basename(path.dirname(storiesFile)))) continue;
  const page = pageOf(storiesFile);
  if (!page || fs.readFileSync(page, "utf8").includes("<ArgTypes")) continue;
  if (argTypesOf.has(component)) continue;
  pagesWithoutProps.push(`${path.relative(PKG, page)} (component: ${component})`);
}
report(
  `${pagesWithoutProps.length} family pages render no <ArgTypes> for their stories' component:`,
  pagesWithoutProps,
);

// Which catalog parts the application renders: the prototype is the kit's test vehicle.
const appUses = new Set();
for (const file of walk(APP)) {
  if (!/\.tsx?$/.test(file) || APP_REFERENCE_INSTALLS.some((dir) => file.startsWith(`${dir}/`)))
    continue;
  if (!fs.readFileSync(file, "utf8").includes("@ledger/design-system")) continue;
  for (const statement of parse(file).statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== "@ledger/design-system") continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings))
      for (const element of bindings.elements)
        appUses.add((element.propertyName ?? element.name).text);
  }
}
const usedByApp = (name) =>
  appUses.has(name) || (partOf.has(name) && appUses.has(partOf.get(name).split(".")[0]));
const unusedByApp = [...exports_.keys()].filter((name) => !usedByApp(name)).sort();
console.log(
  `\nThe application imports ${exports_.size - unusedByApp.length} of ${exports_.size} catalog parts${
    process.argv.includes("--usage")
      ? "; not imported:"
      : " (`npm run ds:check -- --usage` lists the rest)"
  }`,
);
if (process.argv.includes("--usage"))
  for (const line of grouped(unusedByApp.map((name) => [path.basename(exports_.get(name)), name])))
    console.log(`  ${line}`);

// Compare with the committed baseline. Editing the exception file cannot authorize new gaps.
const requestedBaseline = process.env.DS_BASE_REF || "HEAD";
const baselineRef = /^0+$/.test(requestedBaseline) ? "HEAD^" : requestedBaseline;
let baseline;
try {
  baseline = execFileSync("git", ["show", `${baselineRef}:${allowPath}`], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch {
  console.error(`Cannot read coverage baseline ${baselineRef}; fetch it before checking.`);
  process.exit(1);
}
const previous = new Set(
  baseline
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#")),
);
const growth = [...allow].filter((entry) => !previous.has(entry));
if (growth.length) console.error("Coverage exceptions may not grow:", growth.join(", "));
console.log(`${publicApi.length} public API symbols resolved through TypeScript`);
process.exit(
  newGaps.length ||
    stale.length ||
    growth.length ||
    unnamedMembers.length ||
    pagesWithoutProps.length
    ? 1
    : 0,
);
