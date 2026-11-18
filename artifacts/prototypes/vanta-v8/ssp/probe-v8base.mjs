import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.addInitScript(() => { window.__testDecor = true; });
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(500);
for (let i = 0; i < 12; i++) { const g = await p.$('#nav [data-group][aria-expanded="false"]'); if (!g) break; await g.click(); await p.waitForTimeout(40); }
console.log(await p.evaluate(() => [...document.querySelectorAll("#nav a.item")].map((a) => a.textContent.trim().replace(/\d+%?$/, "")).join(" · ")));
console.log("decorate hooks:", await p.evaluate(() => typeof window.PA.decorate + "/" + typeof window.PA.decoratePanel));
console.log("errors:", errors.join(" | ") || "none");
await b.close();
