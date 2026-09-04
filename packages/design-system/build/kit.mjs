// The publishable build: ESM JavaScript and .d.ts declarations for src/ (stories excluded) into
// dist/, by tsc on tsconfig.build.json, then the stylesheets copied beside them so the relative
// @import chain in styles/ledger.css holds. The workspace app keeps resolving the package from
// src/ (see exports in package.json); dist/ is gitignored and exists only after `npm run build`.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });

execFileSync("tsc", ["-p", "tsconfig.build.json"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

// CSS entries: styles/ (storybook.css is Storybook's own) and the generated layer they import.
for (const dir of ["styles", "generated"]) {
  fs.mkdirSync(path.join(dist, dir), { recursive: true });
  for (const file of fs.readdirSync(path.join(src, dir)))
    if (file.endsWith(".css") && file !== "storybook.css")
      fs.copyFileSync(path.join(src, dir, file), path.join(dist, dir, file));
}

const sizes = { ".js": 0, ".d.ts": 0, ".css": 0, ".map": 0 };
let files = 0;
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else {
      files++;
      const key = entry.name.endsWith(".d.ts") ? ".d.ts" : path.extname(entry.name);
      if (key in sizes) sizes[key] += fs.statSync(p).size;
    }
  }
};
walk(dist);
const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(
  `dist/: ${files} files · js ${kb(sizes[".js"])} · d.ts ${kb(sizes[".d.ts"])} · css ${kb(sizes[".css"])} · maps ${kb(sizes[".map"])}`,
);
