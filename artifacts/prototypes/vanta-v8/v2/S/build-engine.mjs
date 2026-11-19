// Agent S: bundle the repo's spreadsheet core (packages/spreadsheet-core) and IronCalc 0.8.4's WASM into one prototype module,
// mod-zzzz-v2-7sctm-engine.js. Reads the repo; writes only into the prototype folder.   node build-engine.mjs
import { createRequire } from "module";
import fs from "fs";
import path from "path";
const REPO = "/Users/joseflagorio/Development/program_assurance-design-system";
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const require = createRequire(path.join(REPO, "package.json"));
const esbuild = require("esbuild");
const here = path.join(SP, "vanta/v2/S/engine");
const res = await esbuild.build({
  entryPoints: [path.join(here, "entry.ts")], bundle: true, format: "iife", minify: true, target: "es2020", write: false,
  alias: { "@core": path.join(REPO, "packages/spreadsheet-core/src") }, nodePaths: [path.join(REPO, "node_modules")],
  absWorkingDir: REPO, logLevel: "error", legalComments: "inline", charset: "utf8",
  define: { "import.meta.url": '"about:blank"' },
});
let js = res.outputFiles[0].text;
if (/<\/script/i.test(js)) js = js.replace(/<\/script/gi, "<\\/script");
const wasm = fs.readFileSync(path.join(REPO, "node_modules/@ironcalc/wasm/wasm_bg.wasm")).toString("base64");
const head = "// SCTM workbook engine (agent S): packages/spreadsheet-core (Program Assurance, implemented independently of Macro) and\n" +
  "// @ironcalc/wasm 0.8.4 (MIT/Apache-2.0), bundled by SP/vanta/v2/S/build-engine.mjs. Never edit by hand.\n";
const out = head + `window.PA_SHEET_WASM = "${wasm}";\n` + js + "\n";
fs.writeFileSync(path.join(SP, "vanta/proto/mod-zzzz-v2-7sctm-engine.js"), out);
console.log("engine js", js.length, "wasm b64", wasm.length, "module", out.length);
