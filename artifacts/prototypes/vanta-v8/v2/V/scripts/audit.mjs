// Live audit of a build: banners, EXAMPLE tags, gadgets in rows, tab strips, toolbars, avatars, toned cells per row, inline font sizes.
// node audit.mjs <build.html> <out.json> [routes-regex]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const fs = await import("fs");
const [, , build, out, only] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
await page.goto("file://" + build + "#home");
await page.waitForTimeout(200);
const routes = await page.evaluate((only) => Object.keys(window.PA.S).filter((k) => !k.startsWith("after-") && !/^(before-after|nav-options|study)/.test(k) && (!only || new RegExp(only).test(k))), only || "");
const result = {};
for (const r of routes) {
  const t0 = Date.now();
  await page.evaluate((r) => { location.hash = r; }, r);
  await page.waitForTimeout(20);
  const m = await page.evaluate(() => {
    const main = document.getElementById("main");
    const mw = main.getBoundingClientRect().width;
    const rgb = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); if (p.length > 3 && p[3] === 0) return null; const a = p.length > 3 ? p[3] : 1; return p.slice(0, 3).map((v) => Math.round(v * a + 255 * (1 - a))); };
    const chroma = (c) => { const v = rgb(c); if (!v) return 0; return (Math.max(...v) - Math.min(...v)) / 255; };
    const cls = (el) => (typeof el.className === "string" ? el.className : "").trim() || el.tagName.toLowerCase();
    const out = { banners: [], examples: [], rowGadgets: [], tabs: [], toolbar: null, avatars: [], toned: 0, rows: 0, maxToned: 0, fonts: {}, overflowX: false, facts: [] };
    const all = main.querySelectorAll("*");
    for (const el of all) {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el); const c = cls(el);
      const txt = (el.textContent || "").trim();
      const bgC = chroma(cs.backgroundColor);
      if (r.width >= mw * 0.5 && r.height >= 28 && r.height <= 240 && bgC >= 0.03 && !/^(td|th|tr|table|tbody|thead|button|a)$/i.test(el.tagName) && !el.closest(".pill") && txt.length > 8) out.banners.push([c, Math.round(r.height), txt.slice(0, 60)]);
      if (/^example$/i.test(txt) && el.children.length === 0) out.examples.push([c, el.closest("th") ? "th" : el.closest("td") ? "td" : "", cs.color]);
      const inRow = el.closest("tr, li, [class*='row']");
      if (inRow && inRow !== el && /(^|[\s-])(bar|ring|donut|stack|prog|progress|meter|tally|seg|strip|mbar|sbar)(\s|$|-)/i.test(c) && r.width >= 16 && r.height <= 40) out.rowGadgets.push([c, cls(inRow).slice(0, 40)]);
      if (/avatar|(^|[\s-])av(\s|$)|(^|[\s-])ini(\s|$)/.test(c) && bgC >= 0.03) out.avatars.push(c);
      if (el.children.length === 0 && txt) { const k = cs.fontSize + "/" + cs.fontWeight; out.fonts[k] = (out.fonts[k] || 0) + 1; }
    }
    // tab strips: containers whose children include 3+ tab-like items
    main.querySelectorAll("[role=tablist], [class*='tab']").forEach((el) => { const kids = [...el.children].filter((k) => k.getBoundingClientRect().width > 0); if (kids.length >= 3 && kids.every((k) => k.getBoundingClientRect().height < 60)) out.tabs.push([cls(el), kids.length]); });
    // toned cells a row
    main.querySelectorAll("tbody tr").forEach((tr) => {
      let n = 0; out.rows++;
      tr.querySelectorAll(":scope > td").forEach((td) => { const toned = [...td.querySelectorAll("*")].concat([td]).some((e) => { const cs = getComputedStyle(e); return chroma(cs.color) >= 0.15 && e.textContent.trim() && !e.closest("a") || chroma(cs.backgroundColor) >= 0.03; }); if (toned) n++; });
      out.toned += n; out.maxToned = Math.max(out.maxToned, n);
    });
    const v = main.querySelector(".views"), t = main.querySelector(".tools");
    out.toolbar = { views: v ? v.children.length : 0, filters: t ? t.querySelectorAll(".flt").length : 0 };
    out.overflowX = main.scrollWidth > main.clientWidth + 2 || [...main.querySelectorAll(".tablebox, .frame")].some((f) => f.scrollWidth > f.clientWidth + 2);
    const ph = main.querySelector(".ph .facts"); if (ph) out.facts.push(ph.textContent.trim().slice(0, 80));
    return out;
  });
  m.ms = Date.now() - t0;
  result[r] = m;
}
fs.writeFileSync(out, JSON.stringify({ errors, result }, null, 1));
console.log("routes", routes.length, "errors", errors.length);
await browser.close();
