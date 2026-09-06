// Storybook is the contract: every component @ledger/design-system exports has a story that renders it,
// every family has a Matrix story that lays out its variants and states, and every family has a page
// on the template (the H2 set below), each heading present or marked not applicable. Existing gaps are
// grandfathered in scripts/ds-check.allow; a new gap fails, and an allowlisted entry that closes must
// leave the allowlist so the list only shrinks. `npm run build` runs this first.
// A part of a compound (`Object.assign(Stat, { Grid: StatGrid })`) is exported so its props table
// generates and is covered by its compound name in a story (Stat.Grid); an export marked
// `@deprecated` is an alias kept for the lint's rename and needs no story.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { execFileSync } from "node:child_process";
import { publicApi } from "./ds-public-api.mjs";

const PKG = "packages/design-system/src";
const LAYERS = ["primitives", "components", "patterns", "shapes", "shell", "mode"];
// The page template. A family page carries every heading; under one that does not apply it says so
// ("Not applicable: …") rather than leaving it out, so the reader knows it was considered.
const TEMPLATE = [
  "Anatomy",
  "Variants",
  "Sizes",
  "States",
  "Modifiers",
  "Content",
  "Style",
  "Accessibility",
  "Props",
  "Related",
  "Don't",
];
// Story folders whose files are families and need a page. Tokens are sheets; docs are pages already.
const PAGE_FOLDERS = ["components", "patterns", "primitives"];

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(tsx?|mdx)$/.test(p)) out.push(p);
  }
  return out;
};

// name -> file, for every component the package exports from its layers
const exports_ = new Map(
  publicApi
    .filter(
      (e) =>
        e.kind === "value" &&
        /^[A-Z]/.test(e.name) &&
        !/^[A-Z0-9_]+$/.test(e.name) &&
        !e.deprecated,
    )
    .map((e) => [e.name, e.source]),
);
const partOf = new Map();
for (const layer of LAYERS) {
  for (const f of walk(path.join(PKG, layer))) {
    if (!/\.tsx?$/.test(f)) continue;
    const src = fs.readFileSync(f, "utf8");
    for (const m of src.matchAll(/^export const ([A-Z]\w*) = Object\.assign\(\w+, \{([^}]*)\}\)/gm))
      for (const part of m[2].matchAll(/(\w+): ([A-Z]\w*)/g))
        partOf.set(part[2], `${m[1]}.${part[1]}`);
  }
}

const storyTree = walk(path.join(PKG, "stories"));
const storyFiles = storyTree.filter((f) => /\.stories\.tsx?$/.test(f));
const pageFiles = storyTree.filter((f) => f.endsWith(".mdx"));
// Only executable syntax counts; imports and comments cannot manufacture coverage.
const storyReferences = new Set();
const contractFiles = new Set();
for (const file of [...storyFiles, "packages/design-system/.storybook/preview.tsx"]) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) return;
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node))
      storyReferences.add(node.tagName.getText(source));
    if (ts.isCallExpression(node)) storyReferences.add(node.expression.getText(source));
    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(source) === "tags" &&
      ts.isArrayLiteralExpression(node.initializer) &&
      node.initializer.elements.some((e) => ts.isStringLiteral(e) && e.text === "contract")
    )
      contractFiles.add(file);
    ts.forEachChild(node, visit);
  };
  visit(source);
}
const storyCount = storyFiles.reduce(
  (n, f) => n + (fs.readFileSync(f, "utf8").match(/^export const /gm) ?? []).length,
  0,
);

const inStories = (name) =>
  storyReferences.has(name) || [...storyReferences].some((ref) => ref.startsWith(`${name}.`));
const covered = (name) => inStories(name) || (partOf.has(name) && inStories(partOf.get(name)));

// every component family (a file under components/, patterns/, shapes/, shell/) has a Matrix story:
// a story file that imports from it and exports a name ending in Matrix; a part counts under its
// compound name (chart/frame.tsx's ChartFrame as Chart.Frame)
const families = new Map(); // file -> first export
for (const [name, f] of exports_)
  if (!/\/primitives\//.test(f) && !families.has(f)) families.set(f, name);
const namesOf = (file) => [...exports_].filter(([, f]) => f === file).map(([n]) => n);
const matrixOf = (file) =>
  storyFiles.some((sf) => {
    const text = fs.readFileSync(sf, "utf8").replace(/^import[^\n]*\n/gm, "");
    return (
      contractFiles.has(sf) &&
      namesOf(file).some(
        (n) =>
          new RegExp(`(?<![\\w.$])${n}(?![\\w$])`).test(text) ||
          (partOf.has(n) &&
            new RegExp(`(?<![\\w.$])${partOf.get(n).replace(".", "\\.")}(?![\\w$])`).test(text)),
      )
    );
  });

// every story file in a page folder has an MDX page (`<Meta of={…}>` importing it), and every page
// carries the template's headings
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
  if (!page) {
    pageGaps.push(`page:${stem}`);
    continue;
  }
  const headings = new Set(
    [...fs.readFileSync(page, "utf8").matchAll(/^## ([^\n]+)/gm)].map((m) => m[1].trim()),
  );
  for (const h of TEMPLATE) if (!headings.has(h)) pageGaps.push(`page:${stem}#${h}`);
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
const noMatrix = [...families]
  .filter(([f]) => !matrixOf(f))
  .map(([f]) => `matrix:${path.basename(f, ".tsx")}`)
  .sort();
const gaps = [...missing, ...noMatrix, ...pageGaps.sort()];
const newGaps = gaps.filter((n) => !allow.has(n));
const stale = [...allow].filter((n) => !gaps.includes(n)).sort();

const pagesChecked = storyFiles.filter((sf) =>
  PAGE_FOLDERS.includes(path.basename(path.dirname(sf))),
).length;
const pagesComplete =
  pagesChecked - new Set(pageGaps.map((g) => g.replace(/^page:/, "").replace(/#.*$/, ""))).size;
console.log(
  `${exports_.size} exports · ${exports_.size - missing.length} with a story · ${missing.length} without · ${families.size} families · ${families.size - noMatrix.length} with a Matrix · ${pagesChecked} pages · ${pagesComplete} on the template · ${storyCount} stories in ${storyFiles.length} files (${allow.size} grandfathered)`,
);
if (newGaps.length) {
  console.log(
    `\nNew gaps (add the story or the page section under ${PKG}/stories, coverage exceptions cannot grow):`,
  );
  for (const n of newGaps) console.log(`  ${n}${exports_.has(n) ? `  ← ${exports_.get(n)}` : ""}`);
}
if (stale.length) {
  console.log("\nAllowlisted entries that are closed. Remove them from scripts/ds-check.allow:");
  for (const n of stale) console.log(`  ${n}`);
}
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
console.log(
  `${publicApi.length} public API symbols resolved through TypeScript · ${contractFiles.size} files with explicit contracts`,
);
process.exit(newGaps.length || stale.length || growth.length ? 1 : 0);
