// Dump the registries of a build: node explore.mjs <html>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + path.resolve(process.argv[2]);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.goto(file + "#home"); await p.waitForTimeout(600);
const info = await p.evaluate(() => {
  const PA = window.PA;
  return { S: Object.keys(PA.S).filter((k) => !k.startsWith("after-")), P: Object.keys(PA.P), M: Object.keys(PA.M), nav: PA.navItems(), data: Object.keys(PA.data), v2: Object.keys(PA.v2 || {}), hkeys: Object.keys(PA.h) };
});
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "registry.json"), JSON.stringify(info, null, 1));
console.log("S", info.S.length, "P", info.P.length, "M", info.M.length, "nav", info.nav.length);
console.log("P:", info.P.join(" "));
console.log("M:", info.M.join(" "));
console.log("h:", info.hkeys.join(" "));
console.log("errors", errors);
await b.close();
