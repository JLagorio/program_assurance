// Version 7 audit: every screen a reader can reach is a redrawn one. node audit7.mjs <prototype.html>
// A route counts as redrawn when a version-7 module owns it, the canon layer draws it from an after screen, it is a version-6 screen,
// or it is a meta page. Anything else that is still reachable (linked from a drawn screen or in the nav) is reported.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + path.resolve(process.argv[2]);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.goto(file + "#home"); await p.waitForTimeout(600);
for (let i = 0; i < 12; i++) { const g = await p.$('#nav [data-group][aria-expanded="false"]'); if (!g) break; await g.click(); await p.waitForTimeout(60); }
const info = await p.evaluate(() => {
  const PA = window.PA, S = PA.S, owned = [...(PA.OWNED || [])], canonT = new Set(Object.entries(PA.canon.CANON).filter(([r, x]) => S[x[0]] && S[x[0]].__from && !owned.includes(x[0])).map(([, x]) => x[0]));
  const v6 = (r) => /^(ssp|ssps|ssps-.*|ssp-.*|program-new.*|program-start)$/.test(r), meta = (r) => /^(study|before-after.*)$/.test(r);
  const kind = (r) => owned.includes(r) ? "v7" : canonT.has(r) ? "after" : v6(r) ? "v6" : meta(r) ? "meta" : r.startsWith("after-") ? "alias" : "old";
  const routes = Object.keys(S), nav = PA.navItems ? PA.navItems().map(([k]) => k) : [...document.querySelectorAll("#nav a.item")].map((a) => a.getAttribute("href").slice(1));
  return { routes: routes.map((r) => [r, kind(r)]), owned, nav };
});
const kinds = {}; for (const [, k] of info.routes) kinds[k] = (kinds[k] || 0) + 1;
console.log("routes by kind:", JSON.stringify(kinds));
// Walk every drawn (non-alias) screen once, collect the routes it links to, and check its state.
const drawn = info.routes.filter(([, k]) => k !== "alias").map(([r]) => r);
const linked = new Map(), problems = [];
for (const r of drawn) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(60);
  const o = await p.evaluate(() => { const m = document.getElementById("main"); const html = m.innerHTML; return { h: location.hash.slice(1), placeholder: /Not drawn yet/.test(m.textContent), after: (html.match(/(data-go="|href="#)after-/g) || []).length, callouts: [...m.querySelectorAll(".ak-co")].filter((x) => getComputedStyle(x).display !== "none").length, links: [...m.querySelectorAll("[data-go],a[href^='#']")].map((x) => x.dataset.go || x.getAttribute("href").slice(1)) }; });
  if (o.placeholder) problems.push(`${r}: placeholder`);
  if (o.after) problems.push(`${r}: ${o.after} after- links`);
  if (o.callouts) problems.push(`${r}: ${o.callouts} visible callouts`);
  for (const l of o.links) { if (!linked.has(l)) linked.set(l, r); }
}
const kindOf = new Map(info.routes);
const reachableOld = [...new Set([...info.nav, ...linked.keys()])].filter((r) => kindOf.get(r) === "old").map((r) => `${r} (from ${info.nav.includes(r) ? "nav" : linked.get(r)})`);
const deadLinks = [...linked.keys()].filter((r) => r && !kindOf.has(r) && !/^(home)$/.test(r)).slice(0, 20).map((r) => `${r} (from ${linked.get(r)})`);
console.log("nav items:", info.nav.length, "| nav items drawn the old way:", info.nav.filter((r) => kindOf.get(r) === "old").join(", ") || "none");
console.log("old screens still reachable:", reachableOld.join(", ") || "none");
console.log("links to routes that don't exist:", deadLinks.join(", ") || "none");
console.log("screen problems:", problems.slice(0, 30).join(" | ") || "none");
console.log("errors:", errors.length ? [...new Set(errors)].slice(0, 5).join(" | ") : "none");
await b.close();
