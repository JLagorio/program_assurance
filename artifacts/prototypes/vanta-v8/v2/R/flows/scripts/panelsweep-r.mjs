// R: adapted for v2 (v2 toast, fresh session, opener fallbacks). Open each distinct preview panel and click each of its controls: node panelsweep.mjs <html> <panels.json> <out.json>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, inF, out] = process.argv.slice(2);
const file = "file://" + path.resolve(html);
const list = JSON.parse(fs.readFileSync(inF, "utf8"));
const CAND = 'button, a[href], [role=button], [role=tab], [data-go], [data-modal], [data-panel], .btn, summary, [tabindex="0"]';
const b = await chromium.launch(); const res = []; const q = [...list];
const finder = ({ CAND, key, n, root }) => {
  let k = 0; const R = document.querySelector(root);
  for (const e of R.querySelectorAll(CAND)) {
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (e.parentElement && e.parentElement.closest(CAND) && e.parentElement.closest(CAND) !== R && R.contains(e.parentElement.closest(CAND))) continue;
    const txt = (e.innerText || e.value || e.getAttribute("aria-label") || e.title || "").trim().replace(/\s+/g, " ").slice(0, 70);
    const kk = [e.tagName, txt, e.getAttribute("href"), e.dataset.go, e.dataset.modal, e.dataset.panel, e.getAttribute("role")].join("|");
    if (kk === key) { if (k === n) return e; k++; }
  }
  return null;
};
async function worker() {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on("dialog", (d) => d.dismiss().catch(() => {}));
  const openPanel = async (m) => {
    await p.goto(file + "#home"); await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
    await p.goto("about:blank"); await p.goto(file + "#" + m.route); await p.waitForTimeout(300);
    let h = await p.evaluateHandle(finder, { CAND: CAND + ", tr", key: m.key, n: m.n, root: "#main" });
    let el = h.asElement();
    if (!el) { const parts = m.key.split("|"); h = await p.evaluateHandle(({ kind, txt }) => { const vis = (e) => e.getBoundingClientRect().height > 0; const M = document.getElementById("main"); let e = kind ? [...M.querySelectorAll("[data-panel]")].find((x) => x.dataset.panel === kind && vis(x)) : null; if (!e && txt) e = [...M.querySelectorAll("tr, button, a, [role=button]")].find((x) => vis(x) && (x.innerText || "").trim().replace(/\s+/g, " ").startsWith(txt.slice(0, 24))); return e || null; }, { kind: parts[5], txt: parts[1] }); el = h.asElement(); if (el) m.how = "fallback"; }
    if (!el) return false;
    await el.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(300);
    return p.evaluate(() => !document.getElementById("panel").hidden);
  };
  while (q.length) {
    const m = q.shift(); const item = { panel: m.title, route: m.route, controls: [] };
    if (!(await openPanel(m))) { item.error = "panel did not open"; res.push(item); continue; }
    const ctrls = await p.evaluate(({ CAND }) => {
      const R = document.getElementById("panel"); const seen = new Map(); const outl = [];
      for (const e of R.querySelectorAll(CAND)) {
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
        const pc = e.parentElement && e.parentElement.closest(CAND); if (pc && R.contains(pc)) continue;
        const txt = (e.innerText || e.value || e.getAttribute("aria-label") || e.title || "").trim().replace(/\s+/g, " ").slice(0, 70);
        if (/^Close /.test(txt)) continue;
        const key = [e.tagName, txt, e.getAttribute("href"), e.dataset.go, e.dataset.modal, e.dataset.panel, e.getAttribute("role")].join("|");
        const n = seen.get(key) || 0; seen.set(key, n + 1); if (n >= 1) continue;
        outl.push({ key, n, txt, tag: e.tagName });
      }
      return outl.slice(0, 14);
    }, { CAND });
    for (const c of ctrls) {
      if (!(await openPanel(m))) break;
      const before = await p.evaluate(() => { document.querySelectorAll(".ak-toast").forEach((t) => t.remove()); const vt = document.getElementById("v2-toast"); if (vt) vt.hidden = true; const ck = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }; return { hash: location.hash.slice(1), panel: ck(document.getElementById("panel").innerHTML), main: ck(document.getElementById("main").innerHTML) }; });
      const h = await p.evaluateHandle(finder, { CAND, key: c.key, n: c.n, root: "#panel" });
      const el = h.asElement(); if (!el) { item.controls.push({ ...c, effect: "not found" }); continue; }
      await el.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(300);
      const a = await p.evaluate(() => { const ck = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }; const md = document.getElementById("modal"), pn = document.getElementById("panel"); return { hash: location.hash.slice(1), panelHidden: pn.hidden, panel: ck(pn.innerHTML), main: ck(document.getElementById("main").innerHTML), modal: md.hidden ? null : ((md.querySelector("h4") || {}).innerText || "dialog"), toasts: [...document.querySelectorAll(".ak-toast, #v2-toast:not([hidden])")].map((t) => t.innerText.replace(/\s+/g, " ")).join(" || "), menu: [...document.querySelectorAll('[role="menu"], .menu, .ak-menu')].filter((e) => e.getBoundingClientRect().height > 0).map((e) => e.innerText.replace(/\s+/g, " ").slice(0, 80)).filter(Boolean).join(" ¦ ") }; });
      const parts = [];
      if (a.hash !== before.hash) parts.push("nav:" + a.hash);
      if (a.modal) parts.push("modal:" + a.modal);
      if (a.toasts) parts.push("toast:" + a.toasts);
      if (a.menu) parts.push("menu:" + a.menu);
      if (a.panelHidden) parts.push("panel closed");
      else if (a.panel !== before.panel) parts.push("panel changes");
      if (a.hash === before.hash && a.main !== before.main) parts.push("page changes");
      item.controls.push({ ...c, effect: parts.join(" ; ") || "nothing" });
    }
    item.how = m.how || "key"; res.push(item); console.log(m.title, item.controls.filter((c) => c.effect === "nothing").map((c) => c.txt).join(" | "));
  }
  await p.close();
}
await Promise.all(Array.from({ length: 5 }, worker));
fs.writeFileSync(out, JSON.stringify(res, null, 1)); await b.close(); console.log("done", res.length);
