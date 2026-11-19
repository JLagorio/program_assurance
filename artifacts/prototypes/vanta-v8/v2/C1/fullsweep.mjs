// Open each distinct preview (gap/flows/panels.json) and press ↗: where it lands. node fullsweep.mjs <html> <out.json>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = process.argv.slice(2);
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const file = "file://" + path.resolve(html);
const list = JSON.parse(fs.readFileSync(SP + "/vanta/gap/flows/panels.json", "utf8"));
const CAND = 'button, a[href], [role=button], [role=tab], [data-go], [data-modal], [data-panel], .btn, summary, [tabindex="0"], tr';
const b = await chromium.launch(); const res = []; const q = [...list];
async function worker() {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  while (q.length) {
    const m = q.shift(); errs.length = 0;
    await p.goto("about:blank"); await p.goto(file + "#" + m.route); await p.waitForTimeout(300);
    const h = await p.evaluateHandle(({ CAND, key, n }) => {
      let k = 0; const R = document.getElementById("main");
      for (const e of R.querySelectorAll(CAND)) {
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
        if (e.parentElement && e.parentElement.closest(CAND) && e.parentElement.closest(CAND) !== R && R.contains(e.parentElement.closest(CAND))) continue;
        const txt = (e.innerText || e.value || e.getAttribute("aria-label") || e.title || "").trim().replace(/\s+/g, " ").slice(0, 70);
        const kk = [e.tagName, txt, e.getAttribute("href"), e.dataset.go, e.dataset.modal, e.dataset.panel, e.getAttribute("role")].join("|");
        if (kk === key) { if (k === n) return e; k++; }
      }
      return null;
    }, { CAND, key: m.key, n: m.n });
    let el = h.asElement();
    if (!el) { const h2 = await p.evaluateHandle(() => [...document.querySelectorAll('#main [data-panel]')].find((e) => e.dataset.panel && e.getBoundingClientRect().height > 0) || null); el = h2.asElement(); }
    if (!el) { res.push({ panel: m.title, route: m.route, result: "opener not found" }); continue; }
    await el.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(350);
    const st = await p.evaluate(() => { const x = document.getElementById("panel"); return { open: !x.hidden, full: !!x.querySelector('.bar-top button[aria-label="Open the full record"]'), label: (x.querySelector(".bar-top span") || {}).textContent }; });
    if (!st.open) { res.push({ panel: m.title, route: m.route, result: "panel did not open" }); continue; }
    if (!st.full) { res.push({ panel: m.title, route: m.route, kind: st.label, result: "no ↗ (cut)" }); continue; }
    await p.click('#panel .bar-top button[aria-label="Open the full record"]').catch(() => {}); await p.waitForTimeout(500);
    const af = await p.evaluate(() => ({ hash: location.hash.slice(1), title: ((document.querySelector("#main .ak-title, #main h3, #main h2") || {}).textContent || "").trim().slice(0, 80), notDrawn: /Not drawn yet|not in the prototype/.test(document.getElementById("main").innerText), panel: !document.getElementById("panel").hidden, sideways: document.getElementById("main").scrollWidth > document.getElementById("main").clientWidth + 2 }));
    res.push({ panel: m.title, route: m.route, kind: st.label, result: af.hash === m.route ? "stayed" : af.notDrawn ? "landed on nothing" : "opened page", ...af, errors: [...errs] });
  }
  await p.close();
}
await Promise.all(Array.from({ length: 4 }, worker));
fs.writeFileSync(out, JSON.stringify(res, null, 1)); await b.close();
const by = {}; res.forEach((r) => { by[r.result] = (by[r.result] || 0) + 1; }); console.log(by);
res.forEach((r) => console.log(`${r.result.padEnd(18)} ${r.route.padEnd(16)} ${String(r.kind || "").padEnd(28)} → ${r.hash || ""} · ${r.title || ""}${r.errors && r.errors.length ? " · ERR " + r.errors[0] : ""}`));
