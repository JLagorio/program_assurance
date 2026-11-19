// node shots.mjs <html> <outDir> <width> [--full] route…  (viewport shots; --full adds a full-page shot)
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
let [html, out, w, ...routes] = process.argv.slice(2);
const full = routes[0] === "--full"; if (full) routes = routes.slice(1);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +w > 600 ? 900 : 844 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
const info = {};
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500);
  await p.evaluate(() => { const m = document.getElementById("main"); if (m) m.scrollTop = 0; window.scrollTo(0,0); });
  await p.screenshot({ path: `${out}/${w}-${r}.png` });
  if (full) await p.screenshot({ path: `${out}/${w}-${r}-full.png`, fullPage: true });
  info[r] = await p.evaluate(() => {
    const m = document.getElementById("main"); const t = (s) => [...m.querySelectorAll(s)].length;
    return { h: m.scrollHeight, title: (m.querySelector("h1")||{}).textContent, cards: t(".card"), pcards: t(".pcard"), frames: t(".frame"), tables: t("table"), pills: t(".pill"), qv: t(".qv"), flt: t(".flt"), tabsx: t(".tabsx span, .sectab"), btnInk: t(".btn.ink"), btn: t(".btn"), panelOpen: !document.getElementById("panel").hidden, moded: document.getElementById("proto").classList.contains("moded"), full: document.getElementById("proto").classList.contains("fullwin") };
  });
}
console.log(JSON.stringify(info, null, 0)); console.log("ERR", errors.join("\n"));
await b.close();
