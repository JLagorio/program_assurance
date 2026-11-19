// Shared walker: start(), go(route), see(), click(text|selector, opts), shot(name), done()
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const HTML = path.resolve("/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto/out/prototype.html");
const SHOTS = path.resolve("/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/gap/flows/shots");
export async function start(job, width = 1440) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width, height: width > 600 ? 900 : 844 } });
  const errors = []; p.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  p.on("dialog", (d) => { log.push({ step: log.length + 1, note: "native dialog: " + d.message() }); d.dismiss().catch(() => {}); });
  const log = []; let n = 0;
  await p.goto("file://" + HTML + "#home"); await p.waitForTimeout(600);
  const state = () => p.evaluate(() => {
    const m = document.getElementById("main"), pn = document.getElementById("panel"), md = document.getElementById("modal");
    const toasts = [...document.querySelectorAll(".ak-toast")].map((t) => t.innerText.trim().replace(/\s+/g, " ")).join(" || ");
    const otherDlg = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')].filter((e) => e.getBoundingClientRect().height > 0 && !md.contains(e) && !pn.contains(e)).map((e) => ((e.querySelector("h1,h2,h3,h4") || {}).innerText || e.getAttribute("aria-label") || "dialog").trim().slice(0, 80));
    const h = (m.querySelector("h1") || m.querySelector("h2") || {}).innerText || "";
    return { hash: location.hash.slice(1), h1: h.trim().slice(0, 80), modal: md.hidden ? null : ((md.querySelector("h4,h3,h2") || {}).innerText || "dialog").trim(), panel: pn.hidden ? null : ((pn.querySelector(".bar-top span") || {}).innerText || "panel").trim(), toasts, otherDlg, notDrawn: /Not drawn yet/.test(m.innerText) };
  });
  const W = {
    p, log, errors,
    async go(r, why = "") { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400); const s = await state(); log.push({ step: ++n, action: `go #${r}`, why, ...s }); return s; },
    async see(scope = "auto", max = 80) {
      return p.evaluate(({ scope, max }) => {
        const md = document.getElementById("modal"), pn = document.getElementById("panel");
        const od = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')].find((e) => e.getBoundingClientRect().height > 0 && !md.contains(e) && !pn.contains(e));
        const root = scope === "auto" ? (!md.hidden ? md : od ? od : document.getElementById("main")) : scope === "panel" ? pn : document.querySelector(scope);
        const CAND = 'button, a[href], [role=button], [role=tab], [data-go], [data-modal], [data-panel], .btn, summary, input, select, textarea, [tabindex="0"]';
        const out = [];
        for (const e of root.querySelectorAll(CAND)) { const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue; if (e.parentElement && e.parentElement.closest(CAND) && !e.matches("input,select,textarea")) continue; const t = (e.innerText || e.value || e.placeholder || e.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 60); out.push(`${e.tagName.toLowerCase()}${e.dataset.go ? "→" + e.dataset.go : ""}${e.getAttribute("href") ? "→" + e.getAttribute("href") : ""}${e.dataset.modal ? "⊡" + e.dataset.modal : ""}${e.dataset.panel ? "▤" + e.dataset.panel : ""}: ${t}`); if (out.length >= max) break; }
        return out;
      }, { scope, max });
    },
    async text(scope = "#main", len = 1500) { return p.evaluate(({ scope, len }) => { const e = document.querySelector(scope); return e ? e.innerText.slice(0, len) : ""; }, { scope, len }); },
    async click(target, { within = "auto", exact = false, why = "", wait = 400, nth = 0 } = {}) {
      const before = await state(); const mainBefore = await p.evaluate(() => document.getElementById("main").innerHTML.length + ":" + document.getElementById("main").innerText.length);
      const ok = await p.evaluate(({ target, within, exact, nth }) => {
        const md = document.getElementById("modal"), pn = document.getElementById("panel");
        const od = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')].find((e) => e.getBoundingClientRect().height > 0 && !md.contains(e) && !pn.contains(e));
        const roots = within === "auto" ? [!md.hidden ? md : null, od || null, !pn.hidden ? pn : null, document.getElementById("main"), document.getElementById("proto")].filter(Boolean) : [document.querySelector(within)];
        const CAND = 'button, a[href], [role=button], [role=tab], [role=menuitem], [role=option], [data-go], [data-modal], [data-panel], .btn, summary, label, input, [tabindex="0"], tr';
        document.querySelectorAll(".ak-toast").forEach((t) => t.remove());
        for (const root of roots) {
          if (target.startsWith("css:")) { const els = [...root.querySelectorAll(target.slice(4))].filter((e) => e.getBoundingClientRect().height > 0); if (els[nth]) { els[nth].scrollIntoView({ block: "center" }); els[nth].setAttribute("data-walk-hit", "1"); return true; } continue; }
          const visible = [...root.querySelectorAll(CAND)].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.height && e.getAttribute("role") !== "checkbox"; });
          const m = (t) => { t = (t || "").trim().replace(/\s+/g, " "); return exact ? t === target : t.toLowerCase().includes(target.toLowerCase()); };
          let els = visible.filter((e) => m(e.innerText || e.value));
          if (!els.length) els = visible.filter((e) => m(e.getAttribute("aria-label")));
          // innermost-first is wrong for rows: prefer the smallest element that matches
          els.sort((a, b) => (a.innerText || "").length - (b.innerText || "").length);
          if (els[nth]) { els[nth].scrollIntoView({ block: "center" }); els[nth].setAttribute("data-walk-hit", "1"); return true; }
        }
        return false;
      }, { target, within, exact, nth });
      if (!ok) { const s = await state(); log.push({ step: ++n, action: `click "${target}"`, why, result: "NOT FOUND", ...s }); return null; }
      try { await p.click("[data-walk-hit]", { timeout: 2000 }); } catch (e) { await p.evaluate(() => { const e = document.querySelector("[data-walk-hit]"); if (e) e.click(); }); }
      await p.evaluate(() => { const e = document.querySelector("[data-walk-hit]"); if (e) e.removeAttribute("data-walk-hit"); });
      await p.waitForTimeout(wait);
      const s = await state();
      const eff = [];
      if (s.hash !== before.hash) eff.push("→ #" + s.hash + (s.notDrawn ? " (NOT DRAWN)" : ""));
      if (s.modal && s.modal !== before.modal) eff.push("dialog: " + s.modal);
      if (!s.modal && before.modal) eff.push("dialog closed");
      if (s.otherDlg.length) eff.push("overlay: " + s.otherDlg.join(","));
      if (s.panel && s.panel !== before.panel) eff.push("panel: " + s.panel);
      if (s.toasts) eff.push("toast: " + s.toasts);
      const mainAfter = await p.evaluate(() => document.getElementById("main").innerHTML.length + ":" + document.getElementById("main").innerText.length);
      if (s.hash === before.hash && mainAfter !== mainBefore) eff.push("page changed in place");
      const entry = { step: ++n, action: `click "${target}"`, why, effect: eff.join(" ; ") || "(same screen)", ...s }; log.push(entry);
      return entry;
    },
    async type(selector, value, why = "") { await p.fill(selector, value).catch(async () => { await p.click(selector); await p.keyboard.type(value); }); log.push({ step: ++n, action: `type ${selector} = ${value}`, why }); },
    async shot(name, full = false) { const f = `${SHOTS}/${job}-${name}.png`; await p.screenshot({ path: f, fullPage: full }); log.push({ step: n, shot: f }); return f; },
    note(text) { log.push({ step: n, note: text }); },
    async done() { fs.writeFileSync(`${SHOTS}/../log-${job}.json`, JSON.stringify({ log, errors: [...new Set(errors)] }, null, 1)); await b.close(); for (const l of log) console.log(JSON.stringify(l)); console.log("errors:", [...new Set(errors)].slice(0, 4)); },
  };
  return W;
}
