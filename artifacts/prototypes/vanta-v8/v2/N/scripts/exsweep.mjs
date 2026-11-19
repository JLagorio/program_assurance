// Every route, and every preview and dialog its markup names: where does "Example" still show? node exsweep.mjs <html> <out.json>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, outFile] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
const routes = await p.evaluate(() => Object.keys(PA.S));
console.log("routes", routes.length);
const hits = [], pairsP = new Map(), pairsM = new Map();
const scan = (s) => {
  // Text "Example" as a word, case-sensitive, in visible markup or attributes (title, aria-label); badge class too.
  const out = [];
  const re = /(class="[^"]*\bex\b[^"]*")|[^<>"]{0,60}\bExample\b[^<>"]{0,60}/g;
  let m; while ((m = re.exec(s))) out.push(m[0].trim().slice(0, 140));
  return out;
};
for (const r of routes) {
  const d = await p.evaluate((r) => {
    let html = ""; try { html = PA.S[r](); } catch (e) { return { err: String(e).slice(0, 120) }; }
    if (typeof html !== "string") return { html: "" };
    const t = document.createElement("template"); t.innerHTML = html;
    const P = [...t.content.querySelectorAll("[data-panel]")].map((e) => [e.getAttribute("data-panel"), e.getAttribute("data-id") || ""]);
    const M = [...t.content.querySelectorAll("[data-modal]")].map((e) => [e.getAttribute("data-modal"), e.getAttribute("data-id") || ""]);
    return { html, P, M };
  }, r);
  if (d.err) { hits.push({ where: r, err: d.err }); continue; }
  for (const x of scan(d.html)) hits.push({ where: r, text: x });
  for (const [k, id] of d.P || []) if (k && !pairsP.has(k + "|" + id)) pairsP.set(k + "|" + id, [k, id, r]);
  for (const [k, id] of d.M || []) if (k && !pairsM.has(k + "|" + id)) pairsM.set(k + "|" + id, [k, id, r]);
}
console.log("previews", pairsP.size, "dialogs", pairsM.size);
for (const [k, id, r] of pairsP.values()) {
  const d = await p.evaluate(([k, id, r]) => { try { const o = PA.P[k] && PA.P[k](id); return o ? (o.label || "") + " " + (o.body || "") : ""; } catch (e) { return "ERR " + String(e).slice(0, 100); } }, [k, id, r]);
  for (const x of scan(d)) hits.push({ where: `${r} · preview ${k}:${id}`, text: x });
}
for (const [k, id, r] of pairsM.values()) {
  const d = await p.evaluate(([k, id, r]) => { try { const o = PA.M[k] && PA.M[k](id); return o ? [o.title, o.body, o.footer].join(" ") : ""; } catch (e) { return "ERR " + String(e).slice(0, 100); } }, [k, id, r]);
  for (const x of scan(d)) hits.push({ where: `${r} · dialog ${k}:${id}`, text: x });
}
const byText = {};
for (const h of hits) if (h.text) (byText[h.text] = byText[h.text] || []).push(h.where);
fs.writeFileSync(outFile, JSON.stringify({ routes: routes.length, previews: pairsP.size, dialogs: pairsM.size, hits: hits.length, errors, byText }, null, 1));
console.log("hits", hits.length, "distinct", Object.keys(byText).length, "page errors", errors.length);
await b.close();
