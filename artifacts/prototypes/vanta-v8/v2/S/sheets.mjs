// Agent S: one screenshot a sheet of the SCTM workbook. node sheets.mjs <build.html> <outDir> [width]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [file, out, w = "1440"] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +w < 500 ? 844 : 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + file + "#sctm"); await p.waitForSelector("#sx-body .sx-c"); await p.waitForTimeout(500);
for (const sid of ["sctm", "controls", "reqs", "ev", "findings", "risks", "analysis"]) {
  await p.click("#sx-tab-" + sid); await p.waitForTimeout(250);
  await p.screenshot({ path: `${out}/sctm-${sid}-${w}.png` });
}
console.log("errors", errs);
await b.close();
