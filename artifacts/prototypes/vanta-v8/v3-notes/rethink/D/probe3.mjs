import { open } from "./lib.mjs";
const { b, p, errs, go } = await open();
const routes = process.argv.slice(2);
const out = await p.evaluate((routes) => {
  const r = {};
  for (const k of routes) {
    let html = ""; try { html = PA.S[k] ? PA.S[k]() : "(no screen)"; } catch (e) { html = "ERR " + e.message; }
    const t = document.createElement("template"); t.innerHTML = html;
    const rows = [...t.content.querySelectorAll("table tbody tr")];
    r[k] = { len: html.length, tabs: [...t.content.querySelectorAll(".tabs a, .tabs button, [role=tab]")].map((a) => a.textContent.trim().replace(/\s+/g, " ")).slice(0, 12), heads: [...t.content.querySelectorAll("table thead th")].map((x) => x.textContent.trim()), n: rows.length,
      rows: rows.slice(0, +(window.__n || 8)).map((tr) => ({ attrs: [...tr.attributes].map((a) => `${a.name}=${a.value.slice(0, 60)}`).join(" "), cells: [...tr.children].map((td) => td.textContent.trim().replace(/\s+/g, " ").slice(0, 70)) })),
      btns: [...t.content.querySelectorAll(".hd button, .hd a, header button, header a")].map((x) => x.outerHTML.slice(0, 200)).slice(0, 8) };
  }
  return r;
}, routes);
console.log(JSON.stringify(out, null, 1));
console.log("errors", errs.slice(0, 5));
await b.close();
