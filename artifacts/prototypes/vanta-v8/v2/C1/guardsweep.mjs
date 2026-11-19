// Open each distinct dialog (gap/flows/modals.json openers, else a dialog opener of the same title on the route), fill required fields
// only after one empty press, press the primary: what happens. node guardsweep.mjs <html> <out.json>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = process.argv.slice(2);
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const file = "file://" + path.resolve(html);
const seen = new Set();
const list = JSON.parse(fs.readFileSync(SP + "/vanta/gap/flows/modals.json", "utf8")).filter((m) => { if (seen.has(m.title)) return false; seen.add(m.title); return !/implementation history|record history/.test(m.title); });
const CAND = 'button, a[href], [role=button], [role=tab], [role=menuitem], [data-go], [data-modal], [data-panel], .btn, summary, input[type=checkbox], input[type=radio], select, [tabindex="0"]';
const b = await chromium.launch(); const res = []; const q = [...list];
async function worker() {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  p.on("dialog", (d) => d.dismiss().catch(() => {}));
  while (q.length) {
    const m = q.shift(); errs.length = 0;
    await p.goto("about:blank"); await p.goto(file + "#" + m.route); await p.waitForTimeout(300);
    await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
    const h = await p.evaluateHandle(({ CAND, key, n, modal }) => {
      let k = 0;
      for (const e of document.getElementById("main").querySelectorAll(CAND)) {
        const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
        if (e.parentElement && e.parentElement.closest(CAND) && !e.matches("input,select")) continue;
        const txt = (e.innerText || e.value || e.getAttribute("aria-label") || e.title || "").trim().replace(/\s+/g, " ").slice(0, 70);
        const kk = [e.tagName, txt, e.getAttribute("href"), e.dataset.go, e.dataset.modal, e.dataset.panel, e.getAttribute("role")].join("|");
        if (kk === key) { if (k === n) return e; k++; }
      }
      return modal ? [...document.querySelectorAll(`#main [data-modal="${modal}"]`)].find((e) => e.getBoundingClientRect().height > 0) || null : null;
    }, { CAND, key: m.key, n: m.n, modal: m.key.split("|")[4] || "" });
    const el = h.asElement(); if (!el) { res.push({ route: m.route, title: m.title, result: "opener not found" }); continue; }
    await el.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(300);
    const st0 = await p.evaluate(() => { const md = document.getElementById("modal"); return { open: !md.hidden, title: (md.querySelector("#dlgTitle, h4") || {}).textContent, req: md.querySelectorAll("[data-v2k-req]").length, main: document.getElementById("main").innerHTML.length + ":" + location.hash }; });
    if (!st0.open) { res.push({ route: m.route, title: m.title, result: "dialog did not open" }); continue; }
    const prim = await p.evaluate(() => { const md = document.getElementById("modal"); const bs = [...md.querySelectorAll(".dlg-f button, .dlg-f .btn")].filter((x) => x.getBoundingClientRect().height > 0 && !/^(Cancel|Close|Back|Keep editing|Discard|Copy link)$/i.test(x.innerText.trim())); const pb = bs.pop(); if (!pb) return null; pb.setAttribute("data-prim", "1"); return { label: pb.innerText.trim(), wired: pb.hasAttribute("data-v2-wired"), disabled: pb.getAttribute("aria-disabled") === "true" || pb.disabled }; });
    if (!prim) { res.push({ route: m.route, title: st0.title, result: "no primary" }); continue; }
    let blocked = null;
    if (st0.req) {
      await p.click("[data-prim]", { timeout: 1500 }).catch(() => {}); await p.waitForTimeout(250);
      blocked = await p.evaluate(() => ({ open: !document.getElementById("modal").hidden, errs: [...document.querySelectorAll("#modal .v2k-err")].map((e) => e.textContent).join(" ") }));
      // fill every required field
      await p.evaluate(() => {
        document.querySelectorAll("#modal [data-v2k-req]").forEach((f) => {
          const r = f.querySelector('input[type=radio]:not([disabled])'); if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); return; }
          const fi = f.querySelector('input[type=file]'); if (fi) { fi.dataset.v2kChosen = "test.pdf"; return; }
          const s = f.querySelector("select"); if (s) { const o = [...s.options].find((x) => x.value); if (o) s.value = o.value; s.dispatchEvent(new Event("change", { bubbles: true })); return; }
          const t = f.querySelector("input, textarea"); if (t && !t.value) { t.value = t.type === "date" ? "2026-12-01" : "Test value"; t.dispatchEvent(new Event("input", { bubbles: true })); }
        });
      });
    }
    await p.evaluate(() => { const t = document.getElementById("v2-toast"); if (t) t.hidden = true; document.querySelectorAll(".ak-toast").forEach((x) => x.remove()); });
    if (await p.$("[data-prim]")) await p.click("[data-prim]", { timeout: 1500 }).catch(() => {});
    await p.waitForTimeout(500);
    const st1 = await p.evaluate(() => { const md = document.getElementById("modal"); const t = document.getElementById("v2-toast"); return { open: !md.hidden, hash: location.hash.slice(1), main: document.getElementById("main").innerHTML.length + ":" + location.hash, v2toast: t && !t.hidden ? t.innerText.replace(/\s+/g, " ") : "", toasts: [...document.querySelectorAll(".ak-toast, .compliance-toast, #risk-toast:not([hidden])")].map((x) => x.innerText.replace(/\s+/g, " ")).join(" || ") }; });
    let result;
    if (/^Not saved/.test(st1.v2toast)) result = "NOT SAVED toast";
    else if (st1.hash !== m.route) result = "navigates to " + st1.hash;
    else if (st1.open) result = prim.disabled ? "stays (primary disabled)" : "stays open";
    else if (st1.main !== st0.main) result = "closes, page changes" + (st1.v2toast || st1.toasts ? ", toast" : "");
    else if (st1.v2toast || st1.toasts) result = "closes, TOAST ONLY: " + (st1.v2toast || st1.toasts).slice(0, 60);
    else result = "closes SILENTLY";
    res.push({ route: m.route, title: st0.title, primary: prim.label, wired: prim.wired, req: st0.req, blocked, result, errors: [...errs] });
  }
  await p.close();
}
await Promise.all(Array.from({ length: 4 }, worker));
fs.writeFileSync(out, JSON.stringify(res, null, 1)); await b.close();
const by = {}; res.forEach((r) => { const k = r.result.split(":")[0]; by[k] = (by[k] || 0) + 1; }); console.log(by);
res.forEach((r) => console.log(`${r.route.padEnd(16)} ${String(r.title).slice(0, 38).padEnd(38)} req=${r.req ?? "-"} ${r.blocked ? (r.blocked.open ? "BLOCKS" : "noblock") : "      "} → ${r.result}${r.errors && r.errors.length ? " · ERR " + r.errors[0].slice(0, 80) : ""}`));
