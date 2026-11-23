import { open } from "./lib.mjs";
const { b, p, errs, go } = await open();
const out = await p.evaluate(() => {
  const short = (v, d = 0) => {
    if (v == null) return v;
    if (typeof v === "function") return "fn(" + v.length + ")";
    if (typeof v !== "object") return typeof v === "string" && v.length > 90 ? v.slice(0, 90) + "…" : v;
    if (Array.isArray(v)) return d > 1 ? `[${v.length}]` : { len: v.length, first: short(v[0], d + 1) };
    if (d > 2) return "{" + Object.keys(v).slice(0, 12).join(",") + "}";
    const o = {}; for (const k of Object.keys(v).slice(0, 30)) o[k] = short(v[k], d + 1); return o;
  };
  const r = {};
  r.PAkeys = Object.keys(PA).join(" ");
  r.SSPkeys = Object.keys(PA.SSP).join(" ");
  r.v7p = short(PA.v7p);
  r.v2reqs = short(PA.v2reqs);
  r.v3 = Object.keys(PA.v3).join(" ");
  r.facts = Object.keys(PA.v3.facts).join(" ");
  r.routes = Object.keys(PA.S).filter((k) => /ssp|plan|polic|itcsc|stig|source|trace|requir|evidence|doc/.test(k)).join(" ");
  r.panels = Object.keys(PA.P).join(" ");
  r.modals = Object.keys(PA.M).join(" ");
  return r;
});
console.log(JSON.stringify(out, null, 1));
console.log("errors", errs.slice(0, 5));
await b.close();
