import { open } from "./lib.mjs";
const { b, p, errs, go } = await open();
await go("ssp", 900);
const out = await p.evaluate(() => {
  const r = {};
  const cut = (s, n) => (s.length > n ? s.slice(0, n) + " …" : s);
  r.head = cut(document.querySelector(".se-app > :first-child").outerHTML.replace(/<svg.*?<\/svg>/g, "<svg/>"), 1800);
  for (const id of ["s5", "s7", "s8", "s9", "s10", "s11"]) { const el = document.getElementById("se-s-" + id); r[id] = el ? cut(el.outerHTML.replace(/<svg.*?<\/svg>/g, "<svg/>"), id === "s8" ? 3800 : 1500) : null; }
  const c = document.querySelector('.se-ctl'); r.ctl = c ? cut(c.outerHTML.replace(/<svg.*?<\/svg>/g, "<svg/>"), 2600) : null;
  r.fam = [...document.querySelectorAll(".se-fam")].slice(0, 3).map((f) => f.id + " lazy=" + f.dataset.lazy + " " + f.children.length);
  return r;
});
for (const [k, v] of Object.entries(out)) console.log(k, "=", typeof v === "string" ? v : JSON.stringify(v), "\n");
console.log("errors", errs.slice(0, 5));
await b.close();
