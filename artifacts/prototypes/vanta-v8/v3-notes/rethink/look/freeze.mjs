// The return bar and the full-window workbook; record pages at phone width. usage: node freeze.mjs <build> <outdir>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
let ok = 0, bad = 0; const t = (n, c, x) => { c ? ok++ : bad++; console.log(c ? "ok  " : "FAIL", n, x === undefined || c ? "" : JSON.stringify(x).slice(0, 500)); };
await p.evaluate(() => { PA.v3k.task.start({ from: { label: "PDR", route: "overview" }, what: "14 controls with no requirement", steps: [{ label: "14 controls with no requirement" }] }); PA.v2.go("sctm", { view: "noreq" }); });
const alive = await Promise.race([p.waitForTimeout(1500).then(() => p.evaluate(() => ({ hash: location.hash, bar: !!document.getElementById("k3task"), cells: document.querySelectorAll("#main td, #main [role=gridcell]").length }))), new Promise((r) => setTimeout(() => r(null), 8000))]);
t("a return bar over the workbook does not freeze the page", !!alive && alive.bar, alive);
if (alive) { const g = await p.evaluate(() => { const bar = document.getElementById("k3task"), x = bar.querySelector(".k3-task-e"), r = bar.getBoundingClientRect(), xr = x.getBoundingClientRect(); return { h: Math.round(r.height), sameLine: Math.abs((xr.top + xr.height / 2) - (r.top + r.height / 2)) < 6 }; }); t("the bar is one line and its close is on it", g.h < 50 && g.sameLine, g); await p.screenshot({ path: out + "/bar.jpg", type: "jpeg", quality: 60, clip: { x: 300, y: 820, width: 900, height: 80 } });
  await p.evaluate(() => PA.v3k.task.end(false)); }
await p.setViewportSize({ width: 390, height: 844 });
for (const r of ["control--AC-2", "requirement--REQ-001"]) { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(700); const g = await p.evaluate(() => { const a = document.querySelector("#main .k3-aside"); if (!a) return null; const c = [...a.children].map((e) => e.getBoundingClientRect()); return { cols: getComputedStyle(a).gridTemplateColumns, stacked: c.length < 2 || c[1].top >= c[0].bottom - 1, over: document.documentElement.scrollWidth > innerWidth + 1 }; }); t(r + " at 390: one column, nothing covered", !g || (g.stacked && !g.over), g); await p.screenshot({ path: `${out}/rec390-${r.split("--")[0]}.jpg`, type: "jpeg", quality: 55 }); }
console.log(`${ok} ok, ${bad} failed; page errors`, JSON.stringify(errs).slice(0, 300)); await b.close(); process.exit(0);
