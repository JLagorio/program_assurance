import { open } from "./lib.mjs";
const { b, p, errs, go } = await open();
const out = await p.evaluate(() => {
  const r = {};
  r.routes = Object.keys(PA.S).filter((k) => /polic|plan-|itcsc|stig|source|evidence|ssp|doc|requirement|trace/.test(k)).join(" ");
  r.nav = JSON.stringify(Object.fromEntries(Object.entries(PA.ROUTE_NAV).filter(([k]) => /polic|plan-|itcsc|stig|source|evidence|ssp|requirement|trace/.test(k))));
  r.SCTMDreqs = Object.keys(PA.SCTMD.reqs).length + " " + JSON.stringify(Object.values(PA.SCTMD.reqs)[0]).slice(0, 500);
  r.SCTMDev = PA.SCTMD.ev.length + " " + JSON.stringify(PA.SCTMD.ev.slice(0, 2)).slice(0, 700);
  r.SCTMDtrTot = JSON.stringify(PA.SCTMD.trTot);
  r.evLookupAll = (() => { try { const a = PA.evLookup.all(); return (Array.isArray(a) ? a.length : Object.keys(a).join(",")) + " " + JSON.stringify(Array.isArray(a) ? a.slice(0, 2) : a).slice(0, 900); } catch (e) { return "ERR " + e.message; } })();
  r.synth = (() => { const y = PA.v3x.synth(); return y.reqs.length + " " + JSON.stringify(y.reqs.slice(0, 2)).slice(0, 500); })();
  r.v2reqsInfo = JSON.stringify(PA.v2reqs.info("REQ-001")).slice(0, 900);
  r.v2reqsInfo2 = JSON.stringify(PA.v2reqs.info("REQ-300")).slice(0, 500);
  r.v2reqsMap = JSON.stringify(PA.v2reqs.mappings("REQ-001")).slice(0, 500);
  r.v2reqsEv = JSON.stringify(PA.v2reqs.evidence("REQ-001")).slice(0, 500);
  const t0 = performance.now(); let err = null; try { PA.sctm.build(); } catch (e) { err = e.message; }
  r.build = { ms: Math.round(performance.now() - t0), err, reqs: PA.sctm.state.R && PA.sctm.state.R.reqs.size, ev: PA.sctm.state.R && PA.sctm.state.R.ev.length };
  if (PA.sctm.state.R) { const R = PA.sctm.state.R; r.Rreq = JSON.stringify([R.reqs.get("REQ-001"), R.reqs.get("REQ-300"), R.reqs.get("REQ-640")]).slice(0, 1200); r.Rev = JSON.stringify([R.ev[0], R.ev[5], R.ev[6], R.ev[200], R.ev[R.ev.length - 1]]).slice(0, 1500);
    const st = {}; for (const e of R.ev) st[e.state + (e.rec ? "/rec" : e.syn ? "/syn" : e.cited ? "/cited" : "/other")] = (st[e.state + (e.rec ? "/rec" : e.syn ? "/syn" : e.cited ? "/cited" : "/other")] || 0) + 1; r.RevStates = JSON.stringify(st);
    const kinds = {}; for (const e of R.ev) kinds[e.kind] = (kinds[e.kind] || 0) + 1; r.RevKinds = JSON.stringify(kinds);
    r.reqWithEls = [...R.reqs.values()].filter((q) => q.els.length).length; r.reqWithEv = [...R.reqs.values()].filter((q) => (R.evByReq.get(q.code) || []).length).length; r.reqNoCtl = [...R.reqs.values()].filter((q) => !q.ctl.length).length; }
  return r;
});
for (const [k, v] of Object.entries(out)) console.log(k, "=", typeof v === "string" ? v : JSON.stringify(v), "\n");
console.log("errors", errs.slice(0, 5));
await b.close();
