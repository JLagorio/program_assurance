// Inventory every pill word (and other toned marks) a build draws: every screen, every preview and dialog reachable from a screen.
// node inventory.mjs <build.html> <out.json>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build, out] = process.argv;
const fs = await import("fs");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("file://" + build + "#home");
await page.waitForTimeout(300);
const res = await page.evaluate(() => {
  const PA = window.PA;
  const SKIP = /^(before-after|nav-options|study)/;
  const parse = (html) => { const t = document.createElement("template"); t.innerHTML = html || ""; return t.content; };
  const words = {}; // word -> {tones:{tone:count}, where:{route:1}}
  const marks = {};
  const add = (bucket, word, tone, where) => {
    const w = (word || "").replace(/\s+/g, " ").trim(); if (!w) return;
    const o = bucket[w] || (bucket[w] = { tones: {}, where: {} });
    o.tones[tone] = (o.tones[tone] || 0) + 1; o.where[where] = (o.where[where] || 0) + 1;
  };
  const panels = new Map(), modals = new Map();
  const scan = (frag, where) => {
    frag.querySelectorAll(".pill").forEach((el) => {
      const m = el.className.match(/\bp-(ok|bad|warn|info|none)\b/);
      add(words, el.textContent, m ? m[1] : "other:" + el.className, where);
    });
    frag.querySelectorAll("[class]").forEach((el) => {
      if (el.classList.contains("pill")) return;
      const c = el.className && el.className.baseVal === undefined ? el.className : "";
      if (/\bp-(ok|bad|warn|info|none)\b/.test(c) || /(chip|badge|-st\b|status|tone)/.test(c)) add(marks, el.textContent.slice(0, 60), c, where);
    });
    frag.querySelectorAll("[data-panel]").forEach((el) => { const k = el.dataset.panel; if (!k) return; if (!panels.has(k)) panels.set(k, new Set()); panels.get(k).add(el.dataset.id || ""); });
    frag.querySelectorAll("[data-modal]").forEach((el) => { const k = el.dataset.modal; if (!k) return; if (!modals.has(k)) modals.set(k, new Set()); modals.get(k).add(el.dataset.id || ""); });
  };
  const fails = [];
  for (const r of Object.keys(PA.S)) {
    if (SKIP.test(r)) continue;
    try { scan(parse(PA.S[r]()), r); } catch (e) { fails.push(["S", r, String(e)]); }
  }
  for (const [k, ids] of panels) for (const id of ids) {
    try { const p = PA.P[k] && PA.P[k](id); if (p) scan(parse(p.body), "panel:" + k); } catch (e) { fails.push(["P", k, String(e)]); }
  }
  for (const [k, ids] of modals) for (const id of [...ids].slice(0, 12)) {
    try { const m = PA.M[k] && PA.M[k](id); if (m) { scan(parse(m.body), "modal:" + k); scan(parse(m.footer || ""), "modal:" + k); } } catch (e) { fails.push(["M", k, String(e)]); }
  }
  return { words, marks, fails, nS: Object.keys(PA.S).length, nP: panels.size, nM: modals.size };
});
res.errors = errors;
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log("screens", res.nS, "panels", res.nP, "modals", res.nM, "pill words", Object.keys(res.words).length, "marks", Object.keys(res.marks).length, "fails", res.fails.length, "errors", errors.length);
await browser.close();
