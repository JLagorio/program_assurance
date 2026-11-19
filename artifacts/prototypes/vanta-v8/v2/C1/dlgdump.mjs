// Open each distinct dialog (gap/flows/modals.json openers) and dump its footer and required fields: node dlgdump.mjs <html> <out.json>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = process.argv.slice(2);
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const file = "file://" + path.resolve(html);
const seen = new Set();
const list = JSON.parse(fs.readFileSync(SP + "/vanta/gap/flows/modals.json", "utf8")).filter((m) => { if (seen.has(m.title)) return false; seen.add(m.title); return !/implementation history|record history/.test(m.title); });
const CAND = 'button, a[href], [role=button], [role=tab], [role=menuitem], [data-go], [data-modal], [data-panel], .btn, summary, input[type=checkbox], input[type=radio], select, [tabindex="0"]';
const b = await chromium.launch(); const res = [];
const q = [...list];
async function worker() {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on("dialog", (d) => d.dismiss().catch(() => {}));
  while (q.length) {
    const m = q.shift();
    await p.goto("about:blank"); await p.goto(file + "#" + m.route); await p.waitForTimeout(300);
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
    const o = await p.evaluate(() => {
      const md = document.getElementById("modal"); if (md.hidden) return null;
      const t = (md.querySelector("#dlgTitle, h4") || {}).textContent;
      const foot = [...md.querySelectorAll(".dlg-f button, .dlg-f .btn, .dlg-f [role=button]")].map((x) => ({ txt: x.innerText.trim(), attrs: [...x.attributes].map((a) => a.name + (a.value && a.name.startsWith("data-") ? "=" + a.value.slice(0, 40) : "")).join(" ") }));
      const reqs = [...md.querySelectorAll(".req, [class*='req']")].filter((x) => /required/i.test(x.textContent)).map((x) => {
        const f = x.closest(".ak-field, .field, [class*='field'], label, div");
        return { label: (f ? f.innerText : x.parentElement.innerText).replace(/\s+/g, " ").slice(0, 80), fieldCls: f ? f.className : "", ctl: f ? f.innerHTML.replace(/\s+/g, " ").slice(0, 400) : "" };
      });
      const inputs = md.querySelectorAll("input, textarea, select").length;
      const modId = md.querySelector(".dlg") ? md.querySelector(".dlg").getAttribute("data-key") : null;
      return { title: t, foot, reqs, inputs, dlgAttrs: [...md.querySelector(".dlg").attributes].map((a) => a.name).join(" ") };
    });
    res.push({ route: m.route, key: m.key, title: m.title, o });
  }
  await p.close();
}
await Promise.all(Array.from({ length: 4 }, worker));
fs.writeFileSync(out, JSON.stringify(res, null, 1)); await b.close(); console.log("done", res.length);
