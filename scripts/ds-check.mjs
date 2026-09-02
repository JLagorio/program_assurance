// Storybook is the contract: every component the kit exports has a story that renders it.
// Existing gaps are grandfathered in scripts/ds-check.allow; a new export without a story fails,
// and an allowlisted name that gains a story must leave the allowlist so the list only shrinks.
import fs from "node:fs";
import path from "node:path";

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
};

const exports_ = new Map(); // name -> file
for (const f of walk("src/ds")) {
  if (f.endsWith("index.ts")) continue;
  for (const m of fs.readFileSync(f, "utf8").matchAll(/^export (?:function|const) ([A-Z]\w*)/gm))
    exports_.set(m[1], f);
}

const stories = walk("src/stories")
  .filter((f) => /\.stories\.tsx?$/.test(f))
  .map((f) => fs.readFileSync(f, "utf8").replace(/^import[^\n]*\n/gm, ""))
  .join("\n");

const covered = (name) => new RegExp(`(?<![\\w.$])${name}(?![\\w$])`).test(stories);
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
const newGaps = missing.filter((n) => !allow.has(n));
const stale = [...allow].filter((n) => !missing.includes(n)).sort();

console.log(
  `${exports_.size} exports · ${exports_.size - missing.length} with a story · ${missing.length} without (${allow.size} grandfathered)`,
);
if (newGaps.length) {
  console.log(
    "\nNew exports without a story (add one under src/stories, or list the name in scripts/ds-check.allow with a reason):",
  );
  for (const n of newGaps) console.log(`  ${n}  ← ${exports_.get(n)}`);
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
    "# Kit exports that do not have a story yet. Shrink this list; never grow it.\n" +
      missing.join("\n") +
      "\n",
  );
  console.log(`\nwrote ${allowPath} with ${missing.length} names`);
  process.exit(0);
}
process.exit(newGaps.length || stale.length ? 1 : 0);
