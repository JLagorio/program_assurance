// Storybook is the contract: every component @ledger/design-system exports has a story that renders it,
// every family has a Matrix story that lays out its variants and states, and every family has a page
// on the template (the H2 set below), each heading present or marked not applicable. Existing gaps are
// grandfathered in scripts/ds-check.allow; a new gap fails, and an allowlisted entry that closes must
// leave the allowlist so the list only shrinks. `npm run build` runs this first.
import fs from "node:fs";
import path from "node:path";

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
const exports_ = new Map();
for (const layer of LAYERS) {
  const dir = path.join(PKG, layer);
  if (!fs.existsSync(dir)) continue;
  for (const f of walk(dir)) {
    if (!/\.tsx?$/.test(f) || f.endsWith("index.ts") || f.endsWith("tokens.ts")) continue;
    for (const m of fs.readFileSync(f, "utf8").matchAll(/^export (?:function|const) ([A-Z]\w*)/gm))
      exports_.set(m[1], f);
  }
}

const storyTree = walk(path.join(PKG, "stories"));
const storyFiles = storyTree.filter((f) => /\.stories\.tsx?$/.test(f));
const pageFiles = storyTree.filter((f) => f.endsWith(".mdx"));
const stories = storyFiles
  .map((f) => fs.readFileSync(f, "utf8").replace(/^import[^\n]*\n/gm, ""))
  .join("\n");
const storyCount = storyFiles.reduce(
  (n, f) => n + (fs.readFileSync(f, "utf8").match(/^export const /gm) ?? []).length,
  0,
);

const covered = (name) => new RegExp(`(?<![\\w.$])${name}(?![\\w$])`).test(stories);

// every component family (a file under components/, patterns/, shapes/, shell/) has a Matrix story:
// a story file that imports from it and exports a name ending in Matrix
const families = new Map(); // file -> first export
for (const [name, f] of exports_)
  if (!/\/primitives\//.test(f) && !families.has(f)) families.set(f, name);
const namesOf = (file) => [...exports_].filter(([, f]) => f === file).map(([n]) => n);
const matrixOf = (file) =>
  storyFiles.some((sf) => {
    const text = fs.readFileSync(sf, "utf8").replace(/^import[^\n]*\n/gm, "");
    return (
      /^export const \w*Matrix\b/m.test(text) &&
      namesOf(file).some((n) => new RegExp(`(?<![\\w.$])${n}(?![\\w$])`).test(text))
    );
  });

// every story file in a page folder has an MDX page (`<Meta of={…}>` importing it), and every page
// carries the template's headings
const pageOf = (storyFile) => {
  const stem = path.basename(storyFile).replace(/\.stories\.tsx?$/, "");
  const dir = path.dirname(storyFile);
  return pageFiles.find(
    (p) =>
      path.dirname(p) === dir &&
      new RegExp(`from "\\./${stem}\\.stories"`).test(fs.readFileSync(p, "utf8")),
  );
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
    `\nNew gaps (add the story or the page section under ${PKG}/stories, or list the entry in scripts/ds-check.allow with a reason):`,
  );
  for (const n of newGaps) console.log(`  ${n}${exports_.has(n) ? `  ← ${exports_.get(n)}` : ""}`);
}
if (stale.length) {
  console.log("\nAllowlisted entries that are closed. Remove them from scripts/ds-check.allow:");
  for (const n of stale) console.log(`  ${n}`);
}
if (process.argv.includes("--write-allow")) {
  fs.writeFileSync(
    allowPath,
    "# Package exports without a story, families (matrix:<file>) without a Matrix story, and family pages\n" +
      "# (page:<family>, page:<family>#<heading>) missing from the template. Shrink this list; never grow it.\n" +
      gaps.join("\n") +
      "\n",
  );
  console.log(`\nwrote ${allowPath} with ${gaps.length} entries`);
  process.exit(0);
}
process.exit(newGaps.length || stale.length ? 1 : 0);
