// Storybook is the contract: every component @ledger/design-system exports has a story that renders it,
// and every family has a Matrix story that lays out its variants and states. Existing gaps are
// grandfathered in scripts/ds-check.allow; a new export without a story fails, and an allowlisted name
// that gains a story must leave the allowlist so the list only shrinks. `npm run build` runs this first.
import fs from "node:fs";
import path from "node:path";

const PKG = "packages/design-system/src";
const LAYERS = ["primitives", "components", "patterns", "shapes", "shell"];

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
};

// name -> file, for every component the package exports from its layers
const exports_ = new Map();
for (const layer of LAYERS) {
  const dir = path.join(PKG, layer);
  if (!fs.existsSync(dir)) continue;
  for (const f of walk(dir)) {
    if (f.endsWith("index.ts") || f.endsWith("tokens.ts")) continue;
    for (const m of fs.readFileSync(f, "utf8").matchAll(/^export (?:function|const) ([A-Z]\w*)/gm))
      exports_.set(m[1], f);
  }
}

const storyFiles = walk(path.join(PKG, "stories")).filter((f) => /\.stories\.tsx?$/.test(f));
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
const gaps = [...missing, ...noMatrix];
const newGaps = gaps.filter((n) => !allow.has(n));
const stale = [...allow].filter((n) => !gaps.includes(n)).sort();

console.log(
  `${exports_.size} exports · ${exports_.size - missing.length} with a story · ${missing.length} without · ${families.size} families · ${families.size - noMatrix.length} with a Matrix · ${storyCount} stories in ${storyFiles.length} files (${allow.size} grandfathered)`,
);
if (newGaps.length) {
  console.log(
    `\nNew gaps (add a story under ${PKG}/stories, or list the name in scripts/ds-check.allow with a reason):`,
  );
  for (const n of newGaps) console.log(`  ${n}${exports_.has(n) ? `  ← ${exports_.get(n)}` : ""}`);
}
if (stale.length) {
  console.log(
    "\nAllowlisted names that now have a story. Remove them from scripts/ds-check.allow:",
  );
  for (const n of stale) console.log(`  ${n}`);
}
if (process.argv.includes("--write-allow")) {
  fs.writeFileSync(
    allowPath,
    "# Package exports without a story, and families (matrix:<file>) without a Matrix story. Shrink this list; never grow it.\n" +
      gaps.join("\n") +
      "\n",
  );
  console.log(`\nwrote ${allowPath} with ${gaps.length} names`);
  process.exit(0);
}
process.exit(newGaps.length || stale.length ? 1 : 0);
