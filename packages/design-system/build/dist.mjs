// The publishable build: ESM JavaScript with declarations from tsc, then the stylesheets and the
// token data copied beside them so the CSS entries' relative imports still resolve. `dist/` mirrors
// `src/` minus the stories. The consumer's Tailwind scans the shipped `src/` for classes (ledger.css
// says `@source "../"`), so the source stays in the tarball; a bundler with the `development`
// condition uses it directly, everything else uses dist.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
execFileSync("npx", ["tsc", "-p", "tsconfig.build.json"], { cwd: root, stdio: "inherit" });

const copies = [
  ...fs
    .readdirSync(path.join(root, "src/styles"))
    .filter((f) => f.endsWith(".css") && f !== "storybook.css")
    .map((f) => `styles/${f}`),
  ...fs
    .readdirSync(path.join(root, "src/generated"))
    .filter((f) => /\.(css|json)$/.test(f) && f !== "docs.json")
    .map((f) => `generated/${f}`),
];
for (const rel of copies) {
  fs.mkdirSync(path.dirname(path.join(dist, rel)), { recursive: true });
  fs.copyFileSync(path.join(root, "src", rel), path.join(dist, rel));
}

const count = (dir, ext) =>
  fs.readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith(ext)).length;
console.log(
  `dist: ${count(dist, ".js")} modules · ${count(dist, ".d.ts")} declarations · ${copies.length} stylesheets and data files`,
);
