import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage();
p.on("pageerror", (e) => console.log("ERR", e.message.slice(0, 300)));
p.on("console", (m) => { if (m.type() === "error") console.log("CON", m.text().slice(0, 300)); });
await p.goto("file://" + process.argv[2] + "#overview"); await p.waitForTimeout(800);
console.log(await p.evaluate(() => typeof window.PA));
await b.close();
