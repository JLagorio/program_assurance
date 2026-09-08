// A real tarball installed outside the workspace: no aliases, symlinks, or development conditions.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "../..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-consumer-"));
const run = (cmd, args, cwd = dir) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, NODE_OPTIONS: "" } });
try {
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", dir], {
      cwd: root,
      encoding: "utf8",
    }),
  )[0];
  const version = (name) =>
    JSON.parse(fs.readFileSync(path.join(repo, "node_modules", name, "package.json"), "utf8"))
      .version;
  const deps = Object.fromEntries(
    [
      "react",
      "react-dom",
      "tailwindcss",
      "typescript",
      "@types/react",
      "@types/react-dom",
      "vite",
      "@tailwindcss/vite",
    ].map((name) => [name, version(name)]),
  );
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: { ...deps, "@ledger/design-system": `file:./${packed.filename}` },
    }),
  );
  run("npm", [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    ...(process.argv.includes("--offline") ? ["--offline"] : []),
  ]);
  fs.cpSync(path.join(root, "build/consumer-fixture"), dir, { recursive: true });
  run(process.execPath, ["ssr.mjs"]);
  run(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "tsconfig.json"]);
  run(process.execPath, ["node_modules/vite/bin/vite.js", "build"]);
  const css = fs
    .readdirSync(path.join(dir, "dist/assets"))
    .filter((f) => f.endsWith(".css"))
    .map((f) => fs.readFileSync(path.join(dir, "dist/assets", f), "utf8"))
    .join("\n");
  if (!css.includes("--ds-") || !css.includes(".bg-brand-bold"))
    throw new Error("Consumer CSS is missing Ledger tokens or component utilities");
  if (!css.includes("outline-danger") || !css.includes("data-icon"))
    throw new Error("Consumer CSS is missing Badge danger outlines or icon selectors");
  if (!/\.border-default[^{}]*\{[^}]*border-color:\s*var\(--ds-color-border\)/.test(css))
    throw new Error("Consumer CSS is missing the Separator border token");
  if (!/\.bg-skeleton[^{}]*\{[^}]*background(?:-color)?:\s*var\(--ds-color-skeleton\)/.test(css))
    throw new Error("Consumer CSS is missing the Skeleton fill token");
  if (
    !/\[data-disabled\]:not\(\[data-loading\]\)\{background-color:\s*var\(--ds-color-background-disabled\)/.test(
      css,
    ) ||
    !/\[data-disabled\]:not\(\[data-loading\]\)\{color:\s*var\(--ds-color-text-disabled\)/.test(css)
  )
    throw new Error("Consumer CSS is missing Button's disabled styling with its loading exception");
  console.log("Packed consumer declarations, Vite bundle and Tailwind CSS passed");
} finally {
  if (process.argv.includes("--keep")) console.log(`Consumer fixture: ${dir}`);
  else fs.rmSync(dir, { recursive: true, force: true });
}
