// worst case: every filter of a list on, at 1440: how many rows does the toolbar take?
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright"); const path = await import("path");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +(process.env.W || 1440), height: 900 } });
p.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
await p.goto("file://" + path.resolve(process.argv[2]) + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r of process.argv.slice(3)) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(350);
  // pick, in each select, its longest option
  for (let k = 0; k < 6; k++) { const done = await p.evaluate((k) => { const ss = [...document.querySelectorAll("#main .k3-tb .k3-flt select")]; const s = ss[k]; if (!s) return true; let best = 1, len = 0; [...s.options].forEach((o, i) => { if (i && o.textContent.length > len) { len = o.textContent.length; best = i; } }); s.selectedIndex = best; s.dispatchEvent(new Event("input", { bubbles: true })); s.dispatchEvent(new Event("change", { bubbles: true })); return false; }, k); await p.waitForTimeout(250); if (done) break; }
  const s = await p.$("#main .k3-tb input[type=search]"); if (s) { await s.fill("a"); await p.waitForTimeout(450); }
  console.log(r, JSON.stringify(await p.evaluate(() => { const t = document.querySelector("#main .k3-tb"); const kids = [...t.children].flatMap((c) => (c.classList.contains("k3-fs") ? [...c.children] : [c])).filter((e) => e.getClientRects().length); return { rows: new Set(kids.map((e) => Math.round((e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2) / 10))).size, on: [...t.querySelectorAll(".k3-flt select")].map((s) => s.options[s.selectedIndex].text), view: (t.querySelector(".k3-vbtn") || { textContent: "" }).textContent.trim(), trows: document.querySelectorAll("#main table tbody tr").length, spare: Math.round(t.getBoundingClientRect().right - kids[kids.length - 1].getBoundingClientRect().right) }; })));
}
await b.close();
