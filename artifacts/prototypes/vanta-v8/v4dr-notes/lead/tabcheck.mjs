// Check the Drata tab: node tabcheck.mjs <build.html> [shot-dir]
// Draws before-after-drata with V3 off and on, at 1440 and 390: no console error, no page wider than the window, the tab first
// in the strip, the overview's card, every Open button routes somewhere that draws, every jump link lands, the zoom opens.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2], shots = process.argv[3];
console.log("build", build);
const browser = await chromium.launch();
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log("FAIL", m); } };
for (const [w, hgt] of [[1440, 900], [390, 844]]) {
  for (const v3 of [false, true]) {
    const page = await browser.newPage({ viewport: { width: w, height: hgt } });
    const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    await page.goto("file://" + build + "#overview"); await page.waitForTimeout(700);
    await page.evaluate((on) => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(on); }, v3);
    await page.evaluate(() => { location.hash = "before-after"; }); await page.waitForTimeout(500);
    const card = await page.$(".drba-call"); ok(!!card, `${w} v3=${v3} overview card`);
    const first = await page.$eval(".ba-tabs [role=tab]:nth-child(2)", (e) => e.textContent).catch(() => "");
    ok(/^Drata/.test(first.trim()), `${w} v3=${v3} Drata tab second after Overview, got "${first}"`);
    await page.evaluate(() => { location.hash = "before-after-drata"; }); await page.waitForTimeout(600);
    const st = await page.evaluate(() => ({
      h2: (document.querySelector(".drba-hero h2") || {}).textContent || "",
      over: document.documentElement.scrollWidth - window.innerWidth,
      sel: (document.querySelector('.ba-tabs [aria-selected="true"]') || {}).textContent || "",
      pairs: document.querySelectorAll(".drba-pair").length, comps: document.querySelectorAll(".drba-comp").length,
      jumps: [...document.querySelectorAll("[data-drba-jump]")].map((a) => a.dataset.drbaJump).filter((id) => !document.getElementById(id)),
    }));
    ok(st.h2.includes("Drata"), `${w} v3=${v3} hero drawn`);
    ok(st.over <= 1, `${w} v3=${v3} page wider than window by ${st.over}`);
    ok(/^Drata/.test(st.sel.trim()), `${w} v3=${v3} tab selected "${st.sel}"`);
    ok(st.jumps.length === 0, `${w} v3=${v3} jump targets missing: ${st.jumps.slice(0, 5)}`);
    if (shots) await page.screenshot({ path: `${shots}/tab-${w}-${v3 ? "v3" : "v2"}.jpg`, type: "jpeg", quality: 60, fullPage: false });
    if (w === 1440 && v3) {
      // Every Open button routes somewhere that draws.
      const btns = await page.$$eval("[data-drba-open]", (bs) => bs.map((b) => b.dataset.drbaOpen));
      for (const b of btns) {
        await page.evaluate(() => { location.hash = "before-after-drata"; }); await page.waitForTimeout(350);
        await page.click(`[data-drba-open="${b}"]`); await page.waitForTimeout(900);
        const r = await page.evaluate(() => ({ hash: location.hash, txt: (document.getElementById("main") || {}).innerText || "", v3: PA.v3.on() }));
        ok(r.hash !== "#before-after-drata" && r.txt.trim().length > 40 && r.v3, `open ${b} → ${r.hash} (v3 ${r.v3}, ${r.txt.trim().length} chars)`);
      }
      console.log(`opened ${btns.length} screens`);
      // Every item new in version 24 opens its own route, and that route draws.
      const added = await page.evaluate(() => (PA.DRBA.added || []).map((a, i) => ({ i, route: a.route })));
      for (const a of added) {
        await page.evaluate(() => { location.hash = "before-after-drata"; }); await page.waitForTimeout(350);
        await page.click(`[data-drba-added="${a.i}"]`); await page.waitForTimeout(900);
        const r = await page.evaluate(() => ({ hash: location.hash, txt: (document.getElementById("main") || {}).innerText || "", v3: PA.v3.on() }));
        const dec = (x) => { try { return decodeURIComponent(x); } catch { return x; } };
        const want = dec("#" + a.route), got = dec(r.hash);
        ok((got === want || got.startsWith(want + "--")) && r.txt.trim().length > 40 && r.v3, `added ${a.i} → ${got}, wanted ${want} (${r.txt.trim().length} chars)`);
      }
      console.log(`opened ${added.length} new items`);
    }
    ok(errs.length === 0, `${w} v3=${v3} console errors: ${errs.slice(0, 3).join(" | ")}`);
    console.log(`${w} v3=${v3}: ${st.pairs} pairs, ${st.comps} components`);
    await page.close();
  }
}
await browser.close();
console.log(`${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
