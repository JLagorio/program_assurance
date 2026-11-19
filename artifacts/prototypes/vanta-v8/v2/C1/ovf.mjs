import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, route, seed] = process.argv.slice(2); const file = "file://" + path.resolve(html);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(file + "#home"); await p.waitForTimeout(300);
if (seed) { const st = fs.readFileSync(seed, "utf8"); await p.evaluate((s) => sessionStorage.setItem("pa-v2-state", s), st); await p.goto("about:blank"); await p.goto(file + "#home"); await p.waitForTimeout(300); }
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(500);
const o = await p.evaluate(() => { const W = window.innerWidth; const out = []; document.querySelectorAll("#main *").forEach((e) => { const r = e.getBoundingClientRect(); if (r.right > W + 1 && r.width > 0) out.push([e.tagName + "." + (typeof e.className === "string" ? e.className.split(" ").slice(0, 3).join(".") : ""), Math.round(r.right), Math.round(r.width), (e.innerText || "").slice(0, 40).replace(/\s+/g, " ")]); }); return out.slice(0, 15); });
console.log(o.map((x) => x.join(" | ")).join("\n"));
await b.close();
