// Collect, per tone, the words drawn in that tone across all nav routes (pills, and coloured text outside pills).
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(600);
const nav = await p.evaluate(() => PA.navItems().map(([r]) => r).filter((r) => !["study", "before-after", "nav-options"].includes(r)));
const out = {};
for (const r of nav) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400);
  const got = await p.evaluate(() => {
    const res = [];
    const tone = (c) => { const m = c.match(/rgba?\((\d+), (\d+), (\d+)/); if (!m) return null; const [R, G, B] = m.slice(1).map(Number); const mx = Math.max(R, G, B), mn = Math.min(R, G, B); if (mx - mn < 28) return null; if (R > G && R > B && G < 90) return "red"; if (R > B && G > B && R > 150) return "amber"; if (G > R && G > B) return "green"; if (B > R && B > G) return "blue"; if (R > G && B > G) return "violet"; return "other"; };
    document.querySelectorAll("#main .pill").forEach((e) => { if (!e.getClientRects().length) return; const k = (e.className.match(/p-(ok|bad|warn|none|info)/) || [])[1] || "?"; res.push(["pill:" + k, e.textContent.trim().replace(/\d+/g, "N").slice(0, 40)]); });
    document.querySelectorAll("#main *").forEach((e) => { if (e.closest(".pill,.tag,.gl,button,a,.btn,.qv,.ex")) return; if (![...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) return; if (!e.getClientRects().length) return; const t = tone(getComputedStyle(e).color); if (t) res.push(["text:" + t, e.textContent.trim().replace(/\d+/g, "N").replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) N/g, "DATE").slice(0, 40)]); });
    return res;
  });
  out[r] = got;
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
const agg = {};
for (const [r, list] of Object.entries(out)) for (const [k, t] of list) { agg[k] = agg[k] || {}; agg[k][t] = agg[k][t] || new Set(); agg[k][t].add(r); }
for (const [k, m] of Object.entries(agg).sort()) { const items = Object.entries(m).sort((a, b) => b[1].size - a[1].size); console.log(`\n${k}: ${items.length} distinct words`); console.log(items.slice(0, 40).map(([t, s]) => `${t} (${s.size})`).join(" | ")); }
await b.close();
