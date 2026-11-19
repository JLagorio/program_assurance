import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, route, seed] = process.argv.slice(2); const file = "file://" + path.resolve(html);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto(file + "#home"); await p.waitForTimeout(300);
if (seed) { const st = fs.readFileSync(seed, "utf8"); await p.evaluate((s) => sessionStorage.setItem("pa-v2-state", s), st); await p.goto("about:blank"); await p.goto(file + "#home"); await p.waitForTimeout(300); }
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(500);
const o = await p.evaluate(() => { const W = window.innerWidth; const out = [document.documentElement.scrollWidth]; const walk = (e, d) => { if (d > 7) return; for (const c of e.children) { const r = c.getBoundingClientRect(); if (c.scrollWidth > W + 1 || r.right > W + 1) out.push("  ".repeat(d) + c.tagName + "#" + c.id + "." + (typeof c.className === "string" ? c.className.split(" ").slice(0, 3).join(".") : "") + " sw=" + c.scrollWidth + " r=" + Math.round(r.right)); if (!/TABLE/.test(c.tagName)) walk(c, d + 1); } }; walk(document.body, 0); return out.slice(0, 30); });
console.log(o.join("\n"));
await b.close();
