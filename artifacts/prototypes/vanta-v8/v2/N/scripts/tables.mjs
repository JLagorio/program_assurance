// Dump register tables: node tables.mjs <html> route...  (with PA.v2clean.off to see raw columns)
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, ...routes] = process.argv.slice(2);
const file = "file://" + path.resolve(html);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(file + "#home"); await p.waitForTimeout(500);
for (const raw of [true, false]) {
  for (const r of routes) {
    await p.evaluate(([r, raw]) => { PA.v2clean.off = raw; location.hash = "home"; }, [r, raw]); await p.waitForTimeout(150);
    await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(350);
    const d = await p.evaluate(() => {
      const main = document.getElementById("main");
      return [...main.querySelectorAll("table")].slice(0, 3).map((t) => {
        const head = [...(t.tHead ? t.tHead.rows[0].cells : [])].map((c) => c.textContent.trim().slice(0, 18));
        const rows = [...t.querySelectorAll(":scope > tbody > tr")];
        const frame = t.closest(".frame, .ak-tbl, .ak-table, [class*='table']") || t.parentElement;
        const around = (frame.parentElement || frame).textContent.match(/\d[\d,]*\s*[–-]\s*\d[\d,]*\s+of\s+\d[\d,]*/g);
        const cols = head.map((h, i) => { const vals = rows.map((tr) => (tr.cells[i] ? tr.cells[i].textContent.trim().replace(/\s+/g, " ").slice(0, 22) : "")); const ctl = rows.some((tr) => tr.cells[i] && tr.cells[i].querySelector("button, [role=button], a[href], [data-modal], .btn, [aria-haspopup]")); return `${h}${ctl ? "*" : ""}=${new Set(vals).size === 1 ? "SAME:" + vals[0] : new Set(vals).size}`; });
        const qv = [...main.querySelectorAll(".qv.on, .ak-tab.on, [aria-pressed=true], [aria-selected=true]")].map((x) => x.textContent.trim().replace(/\s+/g, " ").slice(0, 20));
        return { rows: rows.length, pager: around, qv, cols, trData: rows[0] ? [...rows[0].attributes].map((a) => a.name).join(",") : "" };
      });
    });
    console.log((raw ? "RAW " : "V2  ") + r, JSON.stringify(d));
  }
}
await b.close();
