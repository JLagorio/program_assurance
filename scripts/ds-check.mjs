// Maintained catalog components have a story that renders them, and a documentation page.
// Page structure follows the component's needs; accuracy is reviewed with the examples. Existing gaps are
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
const LAYERS = ["primitives", "components", "patterns", "layout", "mode"];
// Story folders whose files are families and need a page. Tokens are sheets; docs are pages already.
const PAGE_FOLDERS = ["components", "patterns", "primitives", "layout"];
// The Shapes catalog is retired, but these APIs remain for existing consumers. Block and
// Inspector still have integration stories; do not recreate demos just to cover these two.
const RETIRED_STORY_EXPORTS = new Set(["ActionBar", "WorkPane"]);

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
        !e.deprecated &&
        !RETIRED_STORY_EXPORTS.has(e.name),
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
console.log("ActionBar and WorkPane retain API checks outside the Storybook catalog.");
process.exit(newGaps.length || stale.length || growth.length ? 1 : 0);
