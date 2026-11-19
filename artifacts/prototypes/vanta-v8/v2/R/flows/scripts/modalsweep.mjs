// Open each distinct dialog and press its primary: node modalsweep.mjs <html> <modals.json> <out.json>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, inF, out] = process.argv.slice(2);
const file = "file://" + path.resolve(html);
const list = JSON.parse(fs.readFileSync(inF, "utf8")).filter((m) => !/implementation history|record history/.test(m.title));
const CAND = 'button, a[href], [role=button], [role=tab], [role=menuitem], [data-go], [data-modal], [data-panel], .btn, summary, input[type=checkbox], input[type=radio], select, [tabindex="0"]';
const b = await chromium.launch(); const res = [];
const W = 4; const q = [...list];
async function worker() {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on("dialog", (d) => d.dismiss().catch(() => {}));
  while (q.length) {
    const m = q.shift();
    await p.goto("about:blank"); await p.goto(file + "#" + m.route); await p.waitForTimeout(350);
    const h = await p.evaluateHandle(({ CAND, key, n }) => {
      let k = 0;
      for (const e of document.getElementById("main").querySelectorAll(CAND)) {
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
        if (e.parentElement && e.parentElement.closest(CAND) && !e.matches("input,select")) continue;
        const txt = (e.innerText || e.value || e.getAttribute("aria-label") || e.title || "").trim().replace(/\s+/g, " ").slice(0, 70);
        const kk = [e.tagName, txt, e.getAttribute("href"), e.dataset.go, e.dataset.modal, e.dataset.panel, e.getAttribute("role")].join("|");
        if (kk === key) { if (k === n) return e; k++; }
      }
      return null;
    }, { CAND, key: m.key, n: m.n });
    const el = h.asElement(); if (!el) { res.push({ ...m, result: "opener not found" }); continue; }
    await el.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(300);
    const st0 = await p.evaluate(() => { const md = document.getElementById("modal"); const ck = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }; return { open: !md.hidden, main: ck(document.getElementById("main").innerHTML), body: md.innerText.replace(/\s+/g, " ").slice(0, 300), req: /Required/.test(md.innerText) }; });
    if (!st0.open) { res.push({ ...m, result: "dialog did not open" }); continue; }
    const prim = await p.evaluate(() => { const md = document.getElementById("modal"); const bs = [...md.querySelectorAll(".dlg-f button, .dlg-f .btn")].filter((x) => x.getBoundingClientRect().height > 0 && !/^(Cancel|Close|Back|Keep editing)$/i.test(x.innerText.trim()) && !x.hasAttribute("data-close-modal")); const pb = bs.pop(); if (!pb) return null; pb.setAttribute("data-prim", "1"); return { label: pb.innerText.trim(), disabled: pb.disabled || pb.getAttribute("aria-disabled") === "true" }; });
    if (!prim) { res.push({ ...m, result: "no primary", body: st0.body }); continue; }
    await p.evaluate(() => document.querySelectorAll(".ak-toast").forEach((t) => t.remove()));
    await p.click("[data-prim]", { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(600);
    const st1 = await p.evaluate(() => { const md = document.getElementById("modal"); const ck = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }; return { open: !md.hidden, hash: location.hash.slice(1), main: ck(document.getElementById("main").innerHTML), body: md.hidden ? "" : md.innerText.replace(/\s+/g, " ").slice(0, 300), toasts: [...document.querySelectorAll(".ak-toast")].map((t) => t.innerText.replace(/\s+/g, " ")).join(" || ") }; });
    let result;
    if (st1.hash !== m.route) result = "navigates to " + st1.hash;
    else if (st1.open && st1.body !== st0.body) result = "dialog changes (next step or validation)";
    else if (st1.open) result = "dialog stays, nothing changes" + (prim.disabled ? " (primary disabled)" : "");
    else if (st1.toasts && st1.main !== st0.main) result = "closes, toast, page changes";
    else if (st1.toasts) result = "closes, toast only";
    else if (st1.main !== st0.main) result = "closes, page changes, no toast";
    else result = "closes silently, nothing changes";
    res.push({ route: m.route, title: m.title, primary: prim.label, required: st0.req, result, toast: st1.toasts, after: st1.body.slice(0, 160) });
    console.log(m.route, "::", m.title, "→", result, st1.toasts ? "| " + st1.toasts.slice(0, 80) : "");
  }
  await p.close();
}
await Promise.all(Array.from({ length: W }, worker));
fs.writeFileSync(out, JSON.stringify(res, null, 1)); await b.close(); console.log("done", res.length);
