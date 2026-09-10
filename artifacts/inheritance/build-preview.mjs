import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "esbuild";
import { compile, optimize } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

const directory = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(directory, "../..");
const compiler = await compile(await readFile(path.join(directory, "preview.css"), "utf8"), {
  base: directory,
  onDependency() {},
});
const scanner = new Scanner({ sources: compiler.sources });
const css = optimize(compiler.build(scanner.scan()), { minify: true }).code;
const result = await build({
  entryPoints: [path.join(directory, "preview.tsx")],
  bundle: true,
  write: false,
  platform: "browser",
  format: "iife",
  minify: true,
  jsx: "automatic",
  target: "es2022",
  alias: { "@ledger/design-system": path.join(workspace, "packages/design-system/src/index.ts") },
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "none",
  metafile: true,
});
const font = await readFile(
  path.join(
    workspace,
    "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
  ),
);
const fontCss = `@font-face{font-family:Geist;font-style:normal;font-weight:100 900;font-display:swap;src:url(data:font/woff2;base64,${font.toString("base64")}) format('woff2')}`;
const script = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const template = await readFile(path.join(directory, "template.html"), "utf8");
const html = template
  .replace("<!-- LEDGER_STYLES -->", () => `<style>${fontCss}${css}</style>`)
  .replace("<!-- LEDGER_SCRIPT -->", () => `<script>${script}</script>`);
if (Buffer.byteLength(html) > 1_000_000) throw new Error("Inline preview exceeds 1 MB.");
await writeFile(path.join(directory, "assurance-workflow.html"), html);
await writeFile(path.join(directory, "ledger-inheritance.html"), html);
await writeFile(
  path.join(directory, "build-info.json"),
  JSON.stringify(
    {
      artifact: "assurance-workflow.html",
      bytes: Buffer.byteLength(html),
      cssBytes: Buffer.byteLength(css),
      scriptBytes: Buffer.byteLength(script),
      ledgerInputs: Object.entries(result.metafile.inputs)
        .filter(([file]) => file.includes("packages/design-system/src/"))
        .map(([file]) => file),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Built assurance-workflow.html (${Buffer.byteLength(html)} bytes) from @ledger/design-system.`,
);
