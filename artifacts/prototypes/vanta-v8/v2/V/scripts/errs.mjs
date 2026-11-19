import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
let cur = "home"; const hits = [];
p.on("pageerror", (e) => hits.push([cur, "pageerror", String(e).slice(0, 200)]));
p.on("requestfailed", (r) => hits.push([cur, "requestfailed", r.url().slice(0, 160)]));
await p.goto("file://" + build + "#home"); await p.waitForTimeout(300);
const routes = await p.evaluate(() => Object.keys(PA.S).filter((k) => !k.startsWith("after-")));
for (const r of routes) { cur = r; await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(15); }
console.log(hits.slice(0, 20).map((h) => h.join(" | ")).join("\n"));
await b.close();
