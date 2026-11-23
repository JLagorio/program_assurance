// Lane C's walk: node walk.mjs <build>. Every route of lane C with V3 on at 1440×900 and 390×844 (console errors, page width,
// one-line cells), every button and link clicked once (a button must do something), then the three flows: a scope rule changed
// moves the counts, Apply goes through the counts step, and one asset matched with the picker drops the consequence count.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2];
console.log("build", build);
const IDS = ["acas", "stig-mc", "stig-asd", "stig-sw", "stig-gw", "scap-lt", "sbom-mc", "sbom-pic", "sarif-tel", "idp", "inv-cfg", "jira", "nessus-gw"];
const ROUTES = ["dr-sources"].concat(IDS.flatMap((id) => [`dr-source--${id}`, `dr-source--${id}--runs`]), ["acas", "idp"].flatMap((id) => [`dr-source--${id}--scope`, `dr-source--${id}--matching`]));
const fails = [];
const fail = (m) => { fails.push(m); console.log("FAIL", m); };
const b = await chromium.launch();
let clicked = 0, inert = 0;

async function open(vp) {
  const p = await b.newPage({ viewport: vp });
  p.on("pageerror", (e) => fail(`${vp.width}: page error ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error") fail(`${vp.width}: console ${m.text()}`); });
  await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
  await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
  return p;
}
const go = async (p, r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(450); };
const layout = (p) => p.evaluate(() => {
  const out = { wide: document.documentElement.scrollWidth > window.innerWidth + 1, sw: document.documentElement.scrollWidth, tall: [] };
  for (const td of document.querySelectorAll("#main td")) {
    if (td.closest(".k3-wrap")) continue;
    const r = td.getBoundingClientRect(); if (!r.height) continue;
    if (r.height > 52) out.tall.push(`${Math.round(r.height)}px: ${td.innerText.slice(0, 50).replace(/\s+/g, " ")}`);
  }
  out.h1 = (document.querySelector("#main h1") || {}).innerText || "";
  return out;
});

// 1. Every route at both widths
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const p = await open(vp);
  for (const r of ROUTES) {
    await go(p, r);
    const L = await layout(p);
    if (!L.h1) fail(`${vp.width} ${r}: no h1`);
    if (L.wide) fail(`${vp.width} ${r}: page ${L.sw}px wide`);
    if (vp.width === 1440 && L.tall.length) fail(`${vp.width} ${r}: ${L.tall.length} tall cells, e.g. ${L.tall[0]}`);
  }
  await p.close();
}
console.log(`routes: ${ROUTES.length} at 1440 and 390`);

// 2. Every button and link once (each distinct one across the routes)
{
  const p = await open({ width: 1440, height: 900 });
  const seen = new Set();
  const snap = () => p.evaluate(() => { const m = document.getElementById("modal"), pn = document.getElementById("panel"), t = document.querySelector(".toast, #toast, [role=status]"); return [location.hash, document.getElementById("main").innerHTML.length, document.getElementById("main").innerHTML, m && !m.hidden ? m.innerHTML : "", pn && !pn.hidden ? pn.innerHTML : "", t ? t.textContent : "", [...document.querySelectorAll("details[open]")].length].join("|"); });
  const tidy = async (r) => {
    await p.evaluate(() => { const m = document.getElementById("modal"); if (m && !m.hidden) { const c = m.querySelector("[data-close-modal], .k3-x, [data-k3-cancel]"); if (c) c.click(); } const c2 = document.getElementById("closePanel"); const pn = document.getElementById("panel"); if (pn && !pn.hidden && c2) c2.click(); document.querySelectorAll("details[open]").forEach((d) => d.removeAttribute("open")); });
    await p.keyboard.press("Escape"); await p.waitForTimeout(120);
    const h = await p.evaluate(() => location.hash.slice(1)); if (h !== r) await go(p, r);
  };
  for (const r of ROUTES) {
    await go(p, r);
    const n = await p.evaluate(() => document.querySelectorAll("#main button:not([aria-current]), #main a[href]:not([aria-current]), #main summary, #main [data-go]:not(tr)").length);
    for (let i = 0; i < n; i++) {
      const sig = await p.evaluate((i) => { const el = document.querySelectorAll("#main button:not([aria-current]), #main a[href]:not([aria-current]), #main summary, #main [data-go]:not(tr)")[i]; if (!el) return null; const r = el.getBoundingClientRect(); if (!r.width || !r.height || el.closest("details:not([open])") && el.tagName !== "SUMMARY") return null; return [el.tagName, (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40), el.getAttribute("data-k3") || "", el.getAttribute("href") || el.getAttribute("data-go") || "", el.getAttribute("data-k3a") || "", el.getAttribute("aria-disabled") || ""].join("~"); }, i);
      if (!sig || seen.has(sig)) continue; seen.add(sig);
      if (/~true$/.test(sig)) continue; // disabled with a reason: nothing to do by design
      const before = await snap();
      try {
        await p.evaluate((i) => { const el = document.querySelectorAll("#main button:not([aria-current]), #main a[href]:not([aria-current]), #main summary, #main [data-go]:not(tr)")[i]; el.scrollIntoView({ block: "center" }); el.click(); }, i);
      } catch (e) { fail(`${r}: click ${sig}: ${e.message}`); continue; }
      await p.waitForTimeout(260); clicked++;
      const after = await snap();
      if (after === before) { inert++; fail(`${r}: button did nothing: ${sig}`); }
      await tidy(r);
    }
  }
  await p.close();
  console.log(`clicks: ${clicked} distinct buttons and links, ${inert} did nothing`);
}

// 3. The flows
{
  const p = await open({ width: 1440, height: 900 });
  const count = () => p.evaluate(() => [...document.querySelectorAll(".drc-live-n b")].map((b) => b.textContent));
  await go(p, "dr-source--acas--scope");
  const c0 = await count();
  await p.selectOption('select[data-drc-rule="2"]', "in"); await p.waitForTimeout(350);
  const c1 = await count();
  if (c0[0] === c1[0]) fail(`scope: the count did not move (${c0} → ${c1})`); else console.log(`scope rule: in scope ${c0[0]} → ${c1[0]}, out ${c0[1]} → ${c1[1]}`);
  await p.click(".drc-acts .btn.ink"); await p.waitForTimeout(300);
  const mv = await p.evaluate(() => (document.querySelector(".drk-mv-s") || {}).innerText || "");
  if (!/Moving/.test(mv)) fail("apply: no counts step"); else console.log(`counts step: ${mv.replace(/\s+/g, " ")}`);
  await p.click(".drc-acts .btn.ink"); await p.waitForTimeout(350);
  const ap = await p.evaluate(() => ({ st: (document.querySelector(".drc-live") || {}).innerText || "", applied: PA.drc.appliedOf(PA.drc.SRC[0]) !== null, cur: !!document.querySelector(".drk-mv") }));
  if (!ap.applied || ap.cur) fail("apply: rules not applied"); else console.log("applied: the rules count now");
  await go(p, "dr-source--acas--matching");
  const n0 = await p.evaluate(() => (document.querySelector(".drc-cons") || {}).innerText || "");
  const first = await p.evaluate(() => { const s = document.querySelector("select[data-drc-match]"); return s ? s.getAttribute("data-drc-match") : null; });
  await p.selectOption(`select[data-drc-match="${first}"]`, "CN-109107"); await p.waitForTimeout(350);
  const n1 = await p.evaluate(() => (document.querySelector(".drc-cons") || {}).innerText || "");
  const num = (s) => Number((s.match(/(\d+) (host|account)s? not matched/) || [])[1] || 0);
  if (!(num(n1) < num(n0))) fail(`matching: the consequence did not fall (${n0} → ${n1})`); else console.log(`match ${first}: ${num(n0)} → ${num(n1)} not matched`);
  await go(p, "dr-source--idp--matching");
  const a0 = await p.evaluate(() => (document.querySelector(".drc-cons") || {}).innerText || "");
  const af = await p.evaluate(() => { const s = document.querySelector("select[data-drc-match]"); return s ? s.getAttribute("data-drc-match") : null; });
  await p.selectOption(`select[data-drc-match="${af}"]`, { index: 1 }); await p.waitForTimeout(350);
  const a1 = await p.evaluate(() => (document.querySelector(".drc-cons") || {}).innerText || "");
  if (!(num(a1) < num(a0))) fail(`identity matching: did not fall (${a0} → ${a1})`); else console.log(`match ${af}: ${num(a0)} → ${num(a1)} not matched`);
  const rev = await p.evaluate(() => /Access revoked/.test(document.getElementById("main").innerText));
  if (!rev) fail("identity: the deleted account is not kept"); else console.log("identity: deleted account kept with Access revoked");
  await p.close();
}
await b.close();
console.log(fails.length ? `${fails.length} failures` : "walk passed: 0 failures");
process.exit(fails.length ? 1 : 0);
