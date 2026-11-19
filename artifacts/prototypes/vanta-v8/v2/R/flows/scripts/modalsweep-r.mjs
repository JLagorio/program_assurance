// R's copy of modalsweep2.mjs adapted to v2 (see notes at the end of the file):
// node modalsweep-r.mjs <html> <modals.json> <out.json>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, inF, out] = process.argv.slice(2);
const file = "file://" + path.resolve(html);
const list = JSON.parse(fs.readFileSync(inF, "utf8")).filter((m) => !/implementation history|record history/.test(m.title));
const CAND = 'button, a[href], [role=button], [role=tab], [role=menuitem], [data-go], [data-modal], [data-panel], .btn, summary, input[type=checkbox], input[type=radio], select, [tabindex="0"]';
const b = await chromium.launch(); const res = [];
const W = 4; const q = [...list];
const ck = `(s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }`;
const TOASTS = () => [...document.querySelectorAll(".ak-toast, #v2-toast:not([hidden])")].map((t) => t.innerText.replace(/\s+/g, " ").trim()).filter(Boolean).join(" || ");
async function mark(p, m) {
  return p.evaluate(({ CAND, key, n, title }) => {
    document.querySelectorAll("[data-r-open]").forEach((e) => e.removeAttribute("data-r-open"));
    const parts = key.split("|");
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width && r.height; };
    const all = [...document.getElementById("main").querySelectorAll(CAND)].filter(vis);
    const top = all.filter((e) => !(e.parentElement && e.parentElement.closest(CAND) && !e.matches("input,select")));
    const txt = (e) => (e.innerText || e.value || e.getAttribute("aria-label") || e.title || "").trim().replace(/\s+/g, " ").slice(0, 70);
    const kk = (e) => [e.tagName, txt(e), e.getAttribute("href"), e.dataset.go, e.dataset.modal, e.dataset.panel, e.getAttribute("role")].join("|");
    let k = 0;
    for (const e of top) if (kk(e) === key) { if (k === n) { e.setAttribute("data-r-open", "1"); return "key"; } k++; }
    if (parts[4]) { const e = all.find((x) => x.dataset.modal === parts[4]); if (e) { e.setAttribute("data-r-open", "1"); return "data-modal"; } }
    if (parts[1]) { const e = top.find((x) => txt(x) === parts[1]); if (e) { e.setAttribute("data-r-open", "1"); return "text"; } }
    return null;
  }, { CAND, key: m.key, n: m.n, title: m.title });
}
async function worker() {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on("dialog", (d) => d.dismiss().catch(() => {}));
  const errors = []; p.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  while (q.length) {
    const m = q.shift();
    await p.goto(file + "#home"); await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
    await p.goto("about:blank"); await p.goto(file + "#" + m.route); await p.waitForTimeout(350);
    let how = await mark(p, m);
    if (!how) { // a selection-bar verb: tick the first row, as a reader would, then look again
      const ticked = await p.evaluate(() => { const c = [...document.querySelectorAll("#main table tbody input[type=checkbox], #main table tbody [role=checkbox]")].find((x) => x.getBoundingClientRect().height > 0); if (!c) return false; c.click(); return true; });
      if (ticked) { await p.waitForTimeout(300); how = await mark(p, m); if (how) how = "after ticking a row: " + how; }
    }
    if (!how) { res.push({ route: m.route, title: m.title, result: "opener not found" }); console.log(m.route, "::", m.title, "→ opener not found"); continue; }
    await p.click("[data-r-open]", { timeout: 1500 }).catch(async () => { await p.evaluate(() => { const e = document.querySelector("[data-r-open]"); if (e) e.click(); }); });
    await p.waitForTimeout(300);
    const st0 = await p.evaluate(({ ck }) => { const f = eval(ck); const md = document.getElementById("modal"); return { open: !md.hidden, main: f(document.getElementById("main").innerHTML), body: md.innerText.replace(/\s+/g, " ").slice(0, 300), title: ((md.querySelector("#dlgTitle, .dlg-h h4, h4, h3") || {}).innerText || "").trim(), req: /Required/.test(md.innerText) }; }, { ck });
    if (!st0.open) { res.push({ route: m.route, title: m.title, how, result: "dialog did not open" }); continue; }
    const presses = [];
    let st1 = null, prim = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      prim = await p.evaluate(() => { const md = document.getElementById("modal"); if (md.hidden) return null; const bs = [...md.querySelectorAll(".dlg-f button, .dlg-f .btn")].filter((x) => x.getBoundingClientRect().height > 0 && !/^(Cancel|Close|Back|Keep editing)$/i.test(x.innerText.trim())); const pb = bs.pop(); if (!pb) return null; document.querySelectorAll("[data-prim]").forEach((x) => x.removeAttribute("data-prim")); pb.setAttribute("data-prim", "1"); return { label: pb.innerText.trim(), disabled: pb.disabled || pb.getAttribute("aria-disabled") === "true" }; });
      if (!prim) break;
      const before = await p.evaluate(({ ck }) => { const f = eval(ck); document.querySelectorAll(".ak-toast").forEach((t) => t.remove()); const vt = document.getElementById("v2-toast"); if (vt) vt.hidden = true; const md = document.getElementById("modal"); return { body: md.innerText.replace(/\s+/g, " ").slice(0, 300) }; }, { ck });
      await p.click("[data-prim]", { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(650);
      st1 = await p.evaluate(({ ck, TS }) => { const f = eval(ck); const T = eval(TS); const md = document.getElementById("modal"); return { open: !md.hidden, hash: location.hash.slice(1), main: f(document.getElementById("main").innerHTML), body: md.hidden ? "" : md.innerText.replace(/\s+/g, " ").slice(0, 300), title: md.hidden ? "" : ((md.querySelector("#dlgTitle, .dlg-h h4, h4, h3") || {}).innerText || "").trim(), toasts: T(), errs: md.hidden ? "" : [...md.querySelectorAll(".v2k-err, [role=alert], .err, .error")].map((e) => e.innerText.trim()).join(" | ").slice(0, 200) }; }, { ck, TS: TOASTS.toString() });
      presses.push({ label: prim.label, disabled: prim.disabled, open: st1.open, title: st1.title, errs: st1.errs, toasts: st1.toasts });
      if (!st1.open || st1.hash !== m.route) break;
      if (st1.body === before.body) break; // nothing changed: stop
      if (!st1.errs) break; // a next step (a wizard), not a validation: stop and record it
      // validation: fill what it asks, as a reader would, and press again
      await p.evaluate((attempt) => {
        const md = document.getElementById("modal"); const fire = (c) => { c.dispatchEvent(new Event("input", { bubbles: true })); c.dispatchEvent(new Event("change", { bubbles: true })); };
        md.querySelectorAll("input, textarea, select").forEach((c) => {
          if (c.closest(".dlg-f") || c.type === "file" || c.type === "hidden") return;
          if (c.type === "checkbox" || c.type === "radio") return;
          if (c.tagName === "SELECT") { if (!c.value) { const o = [...c.options].find((o) => o.value); if (o) { c.value = o.value; fire(c); } } return; }
          if (!c.value) { c.value = c.type === "date" ? "2026-12-01" : c.type === "number" ? "3" : c.type === "email" ? "new.person@example.test" : "Reviewer test value"; fire(c); }
        });
        if (attempt >= 1) { const groups = new Set(); md.querySelectorAll("input[type=radio]").forEach((r) => groups.add(r.name)); groups.forEach((g) => { const rs = [...md.querySelectorAll(`input[type=radio][name="${g}"]`)]; if (rs.length && !rs.some((r) => r.checked)) rs[0].click(); }); const cb = [...md.querySelectorAll(".dlg-b input[type=checkbox], input[type=checkbox]")].filter((c) => !c.closest(".dlg-f")); if (cb.length && !cb.some((c) => c.checked)) cb[0].click(); }
      }, attempt);
      for (const fi of await p.$$("#modal input[type=file]")) await fi.setInputFiles({ name: "reviewer-test.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") }).catch(() => {});
      await p.waitForTimeout(200);
    }
    if (!prim && !st1) { res.push({ route: m.route, title: m.title, how, result: "no primary", body: st0.body }); continue; }
    const NW = /isn.t wired|not wired|does not import|prototype does not|not drawn/i;
    let result;
    if (!st1) result = "no primary";
    else if (st1.hash !== m.route) result = "navigates to " + st1.hash;
    else if (st1.open && st1.errs) result = "held by validation";
    else if (st1.open && st1.title !== st0.title) result = "dialog: next step (" + st1.title.slice(0, 40) + ")";
    else if (st1.open && presses.length && presses[presses.length - 1].label && st1.body !== st0.body) result = "dialog changes in place";
    else if (st1.open) result = "dialog stays, nothing changes" + (prim && prim.disabled ? " (primary disabled)" : "");
    else if (NW.test(st1.toasts)) result = "says not wired";
    else if (st1.main !== st0.main) result = st1.toasts ? "changes state, toast" : "changes state, no toast";
    else if (st1.toasts) result = "closes, toast only";
    else result = "closes silently, nothing changes";
    res.push({ route: m.route, title: m.title, how, presses: presses.length, primary: presses.length ? presses[0].label : null, required: st0.req, result, toast: st1 ? st1.toasts : "", trail: presses });
    console.log(m.route, "::", m.title, "→", result, st1 && st1.toasts ? "| " + st1.toasts.slice(0, 90) : "", "| via", how);
  }
  if (errors.length) res.push({ pageErrors: [...new Set(errors)] });
  await p.close();
}
await Promise.all(Array.from({ length: W }, worker));
fs.writeFileSync(out, JSON.stringify(res, null, 1)); await b.close(); console.log("done", res.length);
// Adapted from gap/flows/scripts/modalsweep2.mjs for v2, same list and same primary rule:
// 1. toasts are read from .ak-toast and from v2's #v2-toast (v2 draws its messages there; the original saw only .ak-toast);
// 2. each dialog starts from a fresh session (v2 keeps workflow state in sessionStorage, which would leak between dialogs);
// 3. an opener whose words changed is found by its data-modal, then its words; a selection-bar verb after ticking one row
//    (v2 opens registers with nothing ticked, so those openers are hidden until a row is chosen);
// 4. a dialog held by validation has its fields filled (text, choice, date, file; then one radio and one box) and is pressed
//    again, up to three presses, and judged on the last press.
