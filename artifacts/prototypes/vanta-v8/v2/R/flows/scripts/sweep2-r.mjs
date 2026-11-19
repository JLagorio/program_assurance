// R: sweep2.mjs adapted for v2: v2 toast read, fresh session per click
// Click every visible control on each route and record what it does: node sweep.mjs <html> <out.json> <routesFile> [workers]
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out, routesFile, W = "4"] = process.argv.slice(2);
const file = "file://" + path.resolve(html);
const routes = fs.readFileSync(routesFile, "utf8").split(/\s+/).filter(Boolean);
const b = await chromium.launch();
const results = {};
const CAND = 'button, a[href], [role=button], [role=tab], [role=menuitem], [data-go], [data-modal], [data-panel], .btn, summary, input[type=checkbox], input[type=radio], select, [tabindex="0"]';
async function worker(id, queue) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on("dialog", (d) => d.dismiss().catch(() => {}));
  p.on("popup", (pp) => pp.close().catch(() => {}));
  const errors = []; p.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  await p.goto(file + "#home"); await p.waitForTimeout(600);
  while (queue.length) {
    const r = queue.shift();
    const res = { route: r, controls: [], errors: [] };
    const nav = async () => { await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} }).catch(() => {}); await p.goto("about:blank"); await p.goto(file + "#" + r); await p.waitForTimeout(350); };
    await nav();
    const info = await p.evaluate(() => ({ hash: location.hash.slice(1), title: (document.querySelector("#main h1, #main h2") || {}).innerText || "", text: document.getElementById("main").innerText.slice(0, 400), full: document.getElementById("proto").classList.contains("fullwin") }));
    Object.assign(res, info);
    const list = await p.evaluate((CAND) => {
      const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
      const roots = [document.getElementById("main")];
      const seen = new Map(); const outl = [];
      for (const root of roots) for (const e of root.querySelectorAll(CAND)) {
        if (!vis(e)) continue;
        if (e.parentElement && e.parentElement.closest(CAND) && !e.matches("input,select")) continue; // the outer control only
        const txt = (e.innerText || e.value || e.getAttribute("aria-label") || e.title || "").trim().replace(/\s+/g, " ").slice(0, 70);
        const key = [e.tagName, txt, e.getAttribute("href"), e.dataset.go, e.dataset.modal, e.dataset.panel, e.getAttribute("role")].join("|");
        const n = (seen.get(key) || 0); seen.set(key, n + 1);
        if (e.tagName === "TR" && n >= 1) continue; // one row per panel kind
        if (n >= 2) continue;
        outl.push({ key, n, tag: e.tagName, txt, href: e.getAttribute("href"), go: e.dataset.go || null, modal: e.dataset.modal || null, panel: e.dataset.panel || null, attrs: [...e.attributes].map((a) => a.name).filter((a) => a.startsWith("data-")).join(",") });
      }
      return outl;
    }, CAND);
    for (const c of list) {
      await nav();
      const before = await p.evaluate(() => {
        document.querySelectorAll(".ak-toast").forEach((t) => t.remove()); { const vt = document.getElementById("v2-toast"); if (vt) vt.hidden = true; }
        const ck = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
        const m = document.getElementById("main"), pn = document.getElementById("panel"), md = document.getElementById("modal");
        return { hash: location.hash.slice(1), main: ck(m.innerHTML), panel: pn.hidden ? null : ck(pn.innerHTML), modal: md.hidden ? null : 1, kids: document.body.children.length + document.getElementById("proto").children.length, exp: document.querySelectorAll('[aria-expanded="true"]').length, full: document.getElementById("proto").classList.contains("fullwin"), bodyLen: document.body.innerText.length };
      });
      const handle = await p.evaluateHandle(({ CAND, key, n }) => {
        const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        let k = 0;
        for (const e of document.getElementById("main").querySelectorAll(CAND)) {
          if (!vis(e)) continue;
          if (e.parentElement && e.parentElement.closest(CAND) && !e.matches("input,select")) continue;
          const txt = (e.innerText || e.value || e.getAttribute("aria-label") || e.title || "").trim().replace(/\s+/g, " ").slice(0, 70);
          const kk = [e.tagName, txt, e.getAttribute("href"), e.dataset.go, e.dataset.modal, e.dataset.panel, e.getAttribute("role")].join("|");
          if (kk === key) { if (k === n) return e; k++; }
        }
        return null;
      }, { CAND, key: c.key, n: c.n });
      const el = handle.asElement();
      if (!el) { res.controls.push({ ...c, effect: "not-found-after-reset" }); continue; }
      let effect = "nothing", detail = "";
      try {
        if (c.tag === "SELECT") { effect = "select"; detail = await el.evaluate((s) => [...s.options].map((o) => o.text).join(" / ").slice(0, 120)); res.controls.push({ ...c, effect, detail }); continue; }
        await el.click({ timeout: 1500 });
      } catch (e) { res.controls.push({ ...c, effect: "click-failed", detail: String(e).slice(0, 100) }); continue; }
      await p.waitForTimeout(260);
      const after = await p.evaluate(() => {
        const ck = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
        const m = document.getElementById("main"), pn = document.getElementById("panel"), md = document.getElementById("modal");
        const toasts = [...document.querySelectorAll(".ak-toast, #v2-toast:not([hidden])")].map((t) => t.innerText.trim().replace(/\s+/g, " ")).join(" || ");
        const dlg = md.hidden ? null : ((md.querySelector("h4, h2, h3") || {}).innerText || "dialog");
        const pl = pn.hidden ? null : ((pn.querySelector(".bar-top span") || {}).innerText || "panel");
        const menus = [...document.querySelectorAll('[role="menu"], .menu, [data-admenu-open], .ak-menu')].filter((e) => e.getBoundingClientRect().height > 0).map((e) => e.innerText.trim().replace(/\s+/g, " ").slice(0, 120)).filter(Boolean);
        const otherDlg = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')].filter((e) => e.getBoundingClientRect().height > 0 && !md.contains(e) && !pn.contains(e)).map((e) => ((e.querySelector("h1,h2,h3,h4") || {}).innerText || e.getAttribute("aria-label") || "dialog").trim().slice(0, 80));
        return { hash: location.hash.slice(1), main: ck(m.innerHTML), panel: pn.hidden ? null : ck(pn.innerHTML), panelLabel: pl, modal: dlg, toasts, menus, otherDlg, kids: document.body.children.length + document.getElementById("proto").children.length, exp: document.querySelectorAll('[aria-expanded="true"]').length, full: document.getElementById("proto").classList.contains("fullwin"), bodyLen: document.body.innerText.length, notDrawn: /Not drawn yet/.test(m.innerText) };
      });
      const parts = [];
      if (after.hash !== before.hash) parts.push("nav:" + after.hash + (after.notDrawn ? " (NOT DRAWN)" : ""));
      if (after.modal) parts.push("modal:" + after.modal.trim());
      if (after.otherDlg.length) parts.push("dialog:" + after.otherDlg.join(","));
      if (after.panelLabel && after.panel !== before.panel) parts.push("panel:" + after.panelLabel.trim());
      if (after.toasts) parts.push("toast:" + after.toasts);
      if (after.menus.length) parts.push("menu:" + after.menus.join(" ¦ "));
      if (after.hash === before.hash && after.main !== before.main) parts.push("in-place");
      if (!parts.length && (after.exp !== before.exp || after.kids !== before.kids || after.full !== before.full || after.bodyLen !== before.bodyLen)) parts.push("other-change");
      effect = parts.length ? parts.join(" ; ") : "nothing";
      res.controls.push({ ...c, effect });
      // close anything open
      await p.keyboard.press("Escape").catch(() => {});
    }
    res.errors = [...new Set(errors.splice(0))];
    results[r] = res;
    fs.writeFileSync(out, JSON.stringify(results, null, 1));
    console.log(`[w${id}] ${r}: ${res.controls.length} controls, ${res.controls.filter((c) => c.effect === "nothing").length} nothing, ${res.controls.filter((c) => /^toast:/.test(c.effect)).length} toast-only`);
  }
  await p.close();
}
const queue = [...routes];
await Promise.all(Array.from({ length: +W }, (_, i) => worker(i, queue)));
fs.writeFileSync(out, JSON.stringify(results, null, 1));
await b.close(); console.log("done", Object.keys(results).length);
