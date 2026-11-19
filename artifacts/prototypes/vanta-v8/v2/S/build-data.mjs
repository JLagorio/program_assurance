// Agent S: build the SCTM workbook's snapshot (mod-zzzz-v2-7sctm-data.js) from the prototype's own modules.
// It reads the records other modules hold in closures (so the workbook can join them) and writes them as PA.SCTMD.
// Nothing is invented: every row comes from one of the arrays named below; the joins are by code, title or id.
//   node build-data.mjs            (from anywhere)
import fs from "fs";
import path from "path";
import vm from "vm";

const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const PROTO = path.join(SP, "vanta/proto");
const read = (f) => fs.readFileSync(path.join(PROTO, f), "utf8");
const line = (src, start) => { const l = src.split("\n").find((x) => x.startsWith(start)); if (!l) throw new Error("missing " + start); return l; };
const json = (src, name) => { const l = line(src, `  const ${name} = `); return JSON.parse(l.slice(`  const ${name} = `.length, l.lastIndexOf(";"))); };

// ——— mod-v7-analysis.js: WS-X90's traceability rows, requirement statements, elements and families ———
const an = read("mod-v7-analysis.js");
const D = json(an, "D");
// tr: [code, title, controls[], hasEvidence, findings[[label, det]], issues[[title, sev, state]], risks[[title, sev, state]], evidence[titles], remediation[[title, status, planned]]]
// pd: "element:familyIndex" -> [n, controls[[code, ob, om, oe]], n, requirementsToEvidence[[code, objectives]], issues, risks]

// ——— mod-after-risk.js: operational issues, POA&M items, risks, assessment findings ———
const rk = read("mod-after-risk.js");
const ISS = json(rk, "ISS_RAW"), POAM = json(rk, "POAM_RAW"), RISKS = json(rk, "RISKS_RAW"), AF = json(rk, "AF_RAW");

// ——— mod-v7-program.js: the Requirements register's rows (statement, elements, controls, evidence) ———
const pg = read("mod-v7-program.js");
const REQS = json(pg, "REQS");

// ——— mod-after-tests.js: the Controls register's requirement for each of its rows ———
const ts = read("mod-after-tests.js");
const ctrlSrc = ts.slice(ts.indexOf("  const CTRL = ["), ts.indexOf("];", ts.indexOf("  const CTRL = [")) + 2);
const CTRL = vm.runInNewContext(ctrlSrc.replace("const CTRL =", "CTRL =") + "; CTRL", {});

// ——— core.js: PA.data.EVIDENCE; mod-after-docs.js: the Evidence register's artifacts ———
const core = read("core.js");
const evCore = core.slice(core.indexOf("  const EVIDENCE = ["), core.indexOf("];", core.indexOf("  const EVIDENCE = [")) + 2);
const EVIDENCE = vm.runInNewContext(evCore.replace("const EVIDENCE =", "EVIDENCE =") + "; EVIDENCE", {});
const dc = read("mod-after-docs.js");
const a = dc.indexOf("  const R_BACK = "), b = dc.indexOf("  const EV_ALL = ");
const evSrc = dc.slice(a, b) + "  const EV_ALL = [...EV_TOP, ...EV_MINE, ...EV_BACK, ...EV_OK]; EV_ALL";
const EV_ALL = vm.runInNewContext(evSrc, { data: { EVIDENCE }, ME: "Ingrid Solberg" });

// ——— Join ———
const norm = (t) => String(t || "").replace(/\s+/g, " ").trim();
const reqs = {};
const req = (code) => (reqs[code] ||= { t: "", st: null, ctl: [], els: [], ev: [], iss: [], rk: [], rem: [], from: [] });
const addU = (arr, v) => { if (v != null && v !== "" && !arr.includes(v)) arr.push(v); };
for (const [c, t, ctl, , , iss, rks, ev, rem] of D.tr) {
  const r = req(c); r.t ||= t; ctl.forEach((x) => addU(r.ctl, x)); ev.forEach((x) => addU(r.ev, norm(x)));
  r.iss.push(...iss); r.rk.push(...rks); r.rem.push(...rem); addU(r.from, "trace");
}
for (const [c, t, st, els, ctl, ev] of REQS) {
  const r = req(c); r.t ||= t; r.st = st; els.forEach((x) => addU(r.els, x)); ctl.forEach((x) => addU(r.ctl, x)); ev.forEach((x) => addU(r.ev, norm(x))); addU(r.from, "register");
}
for (const row of CTRL) if (row[7]) { const r = req(row[7]); addU(r.ctl, row[0]); addU(r.from, "controls"); }
for (const e of EV_ALL) if (e.req && /^REQ-\d+$/.test(e.req[0])) { const r = req(e.req[0]); r.t ||= e.req[1]; addU(r.from, "evidence"); }
// Statements the posture reads (pQ holds a requirement's title-length summary): a title where none is known.
for (const [c, q] of Object.entries(D.pQ)) { if (reqs[c] && !reqs[c].t) reqs[c].t = q; }
// Where a requirement stands: the elements whose posture cell lists it as owing evidence (leaf elements only).
const parentOf = {};
{ const stack = []; for (const [code, , , depth] of D.els) { stack[depth] = code; parentOf[code] = depth > 1 ? stack[depth - 1] : null; } }
const depthOf = Object.fromEntries(D.els.map((e) => [e[0], e[3]]));
const placed = {};
for (const [k, v] of Object.entries(D.pd)) { const [el] = k.split(":"); for (const [c] of v[3]) (placed[c] ||= new Set()).add(el); }
for (const [c, set] of Object.entries(placed)) {
  if (!reqs[c]) continue; // only requirements whose controls the snapshot knows
  if (reqs[c].els.length) continue;
  const leaves = [...set].filter((el) => ![...set].some((o) => o !== el && isAncestor(el, o)));
  reqs[c].els = leaves.sort(); reqs[c].elFrom = "posture";
}
function isAncestor(a, b) { let p = parentOf[b]; while (p) { if (p === a) return true; p = parentOf[p]; } return false; }

// Operational issues: the requirement each names ("Unmet requirement REQ-…") or the traceability row that lists it.
const issById = Object.fromEntries(ISS.map((i) => [i[0], i]));
const issueReq = {};
for (const i of ISS) { const m = /^Unmet requirement (REQ-\d+)/.exec(i[5]); if (m) issueReq[i[0]] = m[1]; }
for (const [c, r] of Object.entries(reqs)) for (const [t] of r.iss) {
  const hit = ISS.find((i) => norm(i[5]).startsWith(norm(t).slice(0, 80)));
  if (hit && !issueReq[hit[0]]) issueReq[hit[0]] = c;
}
// Risks: "Risk arising from REQ-…", else the traceability row that lists the risk beside the issue.
const riskReq = {};
for (const x of RISKS) { const m = /^Risk arising from (REQ-\d+)/.exec(x[1]); if (m) (riskReq[x[0]] ||= []).push(m[1]); }
for (const [c, r] of Object.entries(reqs)) for (const [t] of r.rk) {
  const hit = RISKS.find((x) => norm(x[1]).startsWith(norm(t).slice(0, 80)));
  if (hit) { const l = (riskReq[hit[0]] ||= []); if (!l.includes(c)) l.push(c); }
}
// A risk rests on the issues of the requirements it arises from.
const riskIss = {};
for (const x of RISKS) {
  const rq = riskReq[x[0]] || [];
  riskIss[x[0]] = ISS.filter((i) => rq.includes(issueReq[i[0]])).map((i) => i[0]);
}
// POA&M items name the issues they answer (POAM_RAW[6]).
const out = {
  note: "Generated by SP/vanta/v2/S/build-data.mjs from the prototype's modules: mod-v7-analysis.js (D.tr, D.pd, D.pQ, D.els, D.fams), mod-after-risk.js (ISS_RAW, POAM_RAW, RISKS_RAW, AF_RAW), mod-v7-program.js (REQS), mod-after-tests.js (CTRL), mod-after-docs.js (EV_*) and core.js (EVIDENCE). Never edit by hand.",
  built: new Date().toISOString().slice(0, 10),
  trTot: D.trTot,
  els: D.els.map(([code, name, type, depth]) => [code, name, type, depth, parentOf[code]]),
  fams: D.fams.map(([f, t]) => [f, t]),
  reqs,
  iss: ISS.map(([id, sev, opened, owner, poam, title, from]) => ({ id, sev, opened, owner: owner || null, poam: poam || null, title, from: from ? from.split(",").map((x) => x.split(":")) : [], req: issueReq[id] || null })),
  poam: POAM.map(([id, title, status, owner, planned, ms, issues, plan]) => ({ id, title, status, owner: owner || null, planned: planned || null, ms: (ms || []).length, done: (ms || []).filter((m) => m[2] === "completed").length, issues: issues || [], plan: plan || "" })),
  risks: RISKS.map(([id, title, sev, lik, imp, owner, threat, due, tech]) => ({ id, title, sev, lik, imp, owner: owner || null, threat, due: due || null, tech: (tech || []).map((t) => t[0]), reqs: riskReq[id] || [], iss: riskIss[id] || [] })),
  af: AF.map(([code, title, det, res, date]) => ({ id: `${code}|${res}`, code, title, det, res, date })),
  ev: EV_ALL.map((e) => ({ id: e.id, title: norm(e.title), kind: e.kind, owner: e.owner || null, collected: e.collected, state: e.state, req: e.req && /^REQ-/.test(e.req[0]) ? e.req[0] : null, reviewed: e.reviewed || null })),
};
const js = `// SCTM workbook snapshot (agent S). ${out.note}\n(function () { window.PA.SCTMD = ${JSON.stringify(out)}; })();\n`;
fs.writeFileSync(path.join(PROTO, "mod-zzzz-v2-7sctm-data.js"), js);
const nCtl = new Set(Object.values(reqs).flatMap((r) => r.ctl)).size;
console.log("requirements", Object.keys(reqs).length, "controls with known requirements", nCtl, "issues", out.iss.length, "with requirement", out.iss.filter((i) => i.req).length,
  "risks", out.risks.length, "with requirement", out.risks.filter((r) => r.reqs.length).length, "poam", out.poam.length, "af", out.af.length, "evidence", out.ev.length, "bytes", js.length);
