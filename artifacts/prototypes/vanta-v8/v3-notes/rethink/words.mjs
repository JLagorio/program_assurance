// The rethought V3's words and seams: on every menu page, every page a new lane registered and a sample of records, with V3 on:
// words the model retired (element, interconnection, "Open in", preview), old preview kinds a new page still opens, and links
// that leave to an address no lane redrew. usage: node words.mjs <build.html> [out.json]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path"); const fs = await import("fs");
const build = path.resolve(process.argv[2]); const OUT = process.argv[3];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const info = await p.evaluate(() => {
  const menu = PA.v3.menu.flatMap(([, items]) => items.map(([k]) => k));
  const mine = Object.keys(PA.S).filter((k) => menu.some((m) => k === m || k.startsWith(m + "-")) && !/^(before-after|walkthrough)/.test(k));
  const comps = (PA.v3.fact("components") || []).map((c) => c.code);
  const lazy = ["component--CN-109101", "component--CN-109101--software", "component--CN-109101--controls", "component--CN-109101--requirements", "component--CN-109101--findings", "component--CN-109101--connections", "component--f16", "component--" + (comps[0] || "CN-109000")];
  return { menu, mine, lazy };
});
const WORDS = [["element", /\b[Ee]lements?\b/g], ["interconnection", /\b[Ii]nterconnections?\b/g], ["Open in", /\bOpen (it )?in\b/g], ["preview", /\b[Pp]review\b/g], ["Open control", /\bOpen control\b/g]];
const rep = {}, kinds = {}, leaves = {};
for (const r of [...new Set([...info.menu, ...info.mine, ...info.lazy])]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(140);
  const x = await p.evaluate(() => {
    const m = document.getElementById("main"); const txt = m.innerText || "";
    const k = {}; m.querySelectorAll("[data-panel]").forEach((e) => { const n = e.getAttribute("data-panel"); if (!/^k3/.test(n)) k[n] = (k[n] || 0) + 1; });
    const menu = new Set(PA.v3.menu.flatMap(([, items]) => items.map(([q]) => q)));
    const out = {}; m.querySelectorAll('a[href^="#"], [data-go]').forEach((e) => { const t = (e.getAttribute("data-go") || e.getAttribute("href").slice(1)).split("?")[0]; if (!t) return; const to = PA.v3.redirectOf ? PA.v3.redirectOf(t) : t; const base = to.split("--")[0]; const home = [...menu].some((q) => to === q || to.startsWith(q + "-")) || /^component--/.test(to); if (!home) out[to] = (out[to] || 0) + 1; });
    return { hash: location.hash.slice(1), txt, k, out };
  });
  for (const [name, re] of WORDS) { const n = (x.txt.match(re) || []).length; if (n) (rep[name] = rep[name] || {})[r] = n; }
  for (const [k, n] of Object.entries(x.k)) (kinds[k] = kinds[k] || {})[r] = n;
  for (const [k, n] of Object.entries(x.out)) (leaves[k] = leaves[k] || {})[r] = n;
}
const out = { build: path.basename(build), pages: info.menu.length + info.mine.length + info.lazy.length, words: rep, oldPanels: kinds, leaves, errors: errs };
if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log("words:"); for (const [w, m] of Object.entries(rep)) console.log(`  ${w}: ` + Object.entries(m).map(([r, n]) => `${r} ${n}`).join(", ").slice(0, 600));
console.log("old preview kinds opened from new pages:"); for (const [k, m] of Object.entries(kinds)) console.log(`  ${k}: ` + Object.entries(m).map(([r, n]) => `${r} ${n}`).join(", ").slice(0, 300));
console.log("links that leave the ten places:"); for (const [k, m] of Object.entries(leaves)) console.log(`  ${k}: ` + Object.keys(m).join(", ").slice(0, 260));
console.log("page errors", errs.length);
await b.close();
