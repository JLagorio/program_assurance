import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500); };
const log = {};
// Controls: what do the toolbar look like after Deselect?
await go("controls");
log.controlsToolbar = await p.evaluate(() => { const m = document.getElementById("main"); const t = m.querySelector(".tools, .toolbar, [class*=tools]"); return t ? t.innerText.replace(/\s+/g," ").slice(0,300) : null; });
const des = await p.$("#main :text('Deselect')"); if (des) { await des.click(); await p.waitForTimeout(300); }
log.controlsToolbarAfter = await p.evaluate(() => { const m = document.getElementById("main"); const t = m.querySelector(".tools, .toolbar, [class*=tools]"); return t ? t.innerText.replace(/\s+/g," ").slice(0,300) : null; });
await p.screenshot({ path: `${out}/i-controls-deselected.png` });
// open the first row's panel
const row = await p.$("#main [data-panel]"); log.panelKind = row ? await row.getAttribute("data-panel") : null;
if (row) { await row.click(); await p.waitForTimeout(500); }
log.panel = await p.evaluate(() => { const a = document.getElementById("panel"); return { open: !a.hidden, w: Math.round(a.getBoundingClientRect().width), text: a.innerText.replace(/\s+/g," ").slice(0,400) }; });
await p.screenshot({ path: `${out}/i-controls-panel.png` });
// risks panel
await go("risks");
const r2 = await p.$("#main table [data-panel]"); if (r2) { await r2.click(); await p.waitForTimeout(500); }
log.riskPanel = await p.evaluate(() => { const a = document.getElementById("panel"); return { open: !a.hidden, w: Math.round(a.getBoundingClientRect().width), text: a.innerText.replace(/\s+/g," ").slice(0,300) }; });
await p.screenshot({ path: `${out}/i-risks-panel.png` });
// findings panel
await go("findings");
const r3 = await p.$("#main table [data-panel]"); if (r3) { await r3.click(); await p.waitForTimeout(500); }
await p.screenshot({ path: `${out}/i-findings-panel.png` });
// cmd K
await go("controls"); await p.keyboard.press("Meta+k"); await p.waitForTimeout(400);
log.cmdk = await p.evaluate(() => { const d = document.querySelector("[role=dialog], .cmdk, .palette, #cmdk"); return d ? d.innerText.replace(/\s+/g," ").slice(0,300) : null; });
await p.screenshot({ path: `${out}/i-cmdk.png` });
await p.keyboard.press("Escape");
// program menu full height
await go("overview");
log.progMenu = await p.evaluate(() => { const n = document.getElementById("nav"); return { h: n.scrollHeight, ch: n.clientHeight, text: n.innerText.replace(/\n+/g," | ").slice(0,900) }; });
await p.setViewportSize({ width: 1440, height: 1500 }); await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/i-overview-tall.png` });
console.log(JSON.stringify(log, null, 1)); console.log("ERR", errors.join("\n"));
await b.close();
