// Prototype V3, lane X (v3x-): what earlier rounds left open. Inert while V3 is off (PA.v3.S/P/M wrappers; every listener returns
// at once; the workbook hook passes through).
//   SCTM workbook (sctm): its record sheets hold the full registers (640 requirements, 368 evidence artifacts, the 44 operational
//     issues and the 313 assessment findings, each a sheet of its own, C06); a row's number opens the row's record preview beside the
//     workbook, and every record in a cell opens its own (an assessment finding its finding, evidence its artifact); it is Controls'
//     spreadsheet view: Controls offers Open as spreadsheet and the workbook's Close returns to Controls.
//   Posture (posture*): Columns reads by control family or by resiliency technique (NIST SP 800-160 Vol. 2's 14, Table E-1).
//   SSP section links: a link that names an SSP section ("Shown in SSP section 13", "§9") opens the SSP editor at that section.
//   Plans (ssps): New plan creates the draft plan, lists it on Plans and opens its editor (routes plan-scrm, plan-pia, plan-cms).
// State (PA.v2 state, cleared by PA.v2.reset()): v3.X.plans [{ k, at, by, text: { sec: html } }] the plans created in this session;
//   v3.X.cols { [route]: "fam" | "tech" } Posture's columns.
// PA.v3x { synth, sctmDom, techs, techStanding }: what the walk (v3/X/walk.mjs) reads to check the counts.
// Records the snapshot does not hold are filled in deterministically from each control's counts (PA.SSP.controls r, e, cs) and the
// registers' own totals (PA.SCTMD.trTot, lane F's evidence fact), in the snapshot's own pattern, so every count has its rows.
(function () {
  const PA = window.PA, V3 = PA && PA.v3, V = PA && PA.v2;
  if (!V3 || !V || !PA.h || !PA.AK || !PA.SSP) return;
  const { S, P, M, h } = PA;
  const AK = PA.AK, SSP = PA.SSP;
  const { esc, fmt } = h;
  const WSX = "PRG-1090", ME = "Ingrid Solberg", TODAY_ISO = "2026-11-17";
  const on = () => V3.on();
  const here = () => (location.hash || "#home").slice(1);
  const inSctm = () => /^sctm(-|$)/.test(here()); // the workbook and its sheets' addresses (sctm-requirements…)
  const get = (p, d) => V.get("v3.X." + p, d);
  const put = (p, v) => V.set("v3.X." + p, v);
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
  const cmpText = (a, b) => collator.compare(String(a), String(b));
  const uniq = (a) => [...new Set(a.filter((x) => x != null && x !== ""))];
  const rid = (s) => String(s).replace(/[^\w-]/g, "_").slice(0, 150);
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
  const md = (iso) => (iso ? new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  // Parse drawn markup, change it, serialize it again (a failure keeps the page as it was).
  function edit(html, fn) {
    if (typeof html !== "string") return html;
    const t = document.createElement("template"); t.innerHTML = html;
    try { fn(t.content); } catch (e) { console.error("v3x", e); return html; }
    return t.innerHTML;
  }
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  // A small deterministic generator, so the filled-in records are the same on every visit.
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const isoPlus = (iso, days) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

  // ════════════════ Words ════════════════
  const CS = { satisfied: "Satisfied", partially_satisfied: "Partially satisfied", other_than_satisfied: "Other than satisfied", not_assessed: "Not assessed", no_evidence: "No evidence", no_requirement: "No requirement" };
  const DETRANK = { other_than_satisfied: 0, partially_satisfied: 1, not_assessed: 2, satisfied: 3 };
  const EVST = { accepted: "Accepted", pending: "Pending review", needs_revision: "Needs revision" };
  const EVRANK = { needs_revision: 3, pending: 2, accepted: 1 };
  const RES = { init: "SAR · initial authorization", inc1: "Expanded set, increment 1", inc2: "Increment 2" };
  const RESWHO = { init: "D. Okafor", inc1: "Nadia Fournier", inc2: "Nadia Fournier" };
  // Increment 2's 20 determinations (mod-after-tests.js INC2, the list lane F counts from).
  const INC2 = { "AC-17(3)": "satisfied", "AC-17(4)": "partially_satisfied", "AU-6(3)": "satisfied", "AU-12(1)": "satisfied", "CA-3": "partially_satisfied", "CM-8(2)": "satisfied", "CM-11(2)": "satisfied", "CM-12(1)": "not_assessed", "CM-14": "satisfied", "IA-1": "satisfied", "IA-2(1)": "satisfied", "IA-2(2)": "other_than_satisfied", "IA-2(6)": "satisfied", "IA-2(8)": "satisfied", "IA-2(12)": "not_assessed", "IA-3(1)": "partially_satisfied", "IR-9": "satisfied", "MA-3(5)": "partially_satisfied", "SC-28(3)": "satisfied", "SR-10": "satisfied" };
  // The SAR's 313 determinations by results and by determination (mod-risk.js AF_COUNTS; the Findings page's Assessment findings tab).
  const AF_TOT = { init: 68, inc1: 225, inc2: 20 };
  const AF_DET = { satisfied: 187, partially_satisfied: 38, other_than_satisfied: 14, not_assessed: 74 };
  const KINDS = ["Enforcement", "Verification", "Configuration", "Monitoring"]; // the snapshot's titles: kind = (number − 1) mod 4
  const EVKIND = { Enforcement: ["Test record", "enforcement test record"], Verification: ["Document", "verification report"], Configuration: ["Dataset", "configuration export"], Monitoring: ["Scan", "monitoring log extract"] };
  const EVOWN = ["Ingrid Solberg", "Victor Amsel", "Joel Barrantes", "Priya Raghavan", "Wes Duarte"];

  // ════════════════ The full registers behind the SCTM's sheets ════════════════
  const reqNum = (code) => +String(code).replace(/\D/g, "") || 0;
  const reqCode = (n) => `REQ-${String(n).padStart(3, "0")}`;
  let SYN = null; // { reqs: [{ code, t, st, ctl, kind }], afs: [{ id, code, title, det, res, date, syn }] } from the static data
  function synth() {
    if (SYN) return SYN;
    const X = PA.SCTMD || { reqs: {}, af: [], trTot: {} };
    // Requirements: one for every mapping a control's requirement count has that the snapshot does not name, numbered with the codes
    // the snapshot leaves free up to the register's 640; the mappings left over are a second control of the requirement before.
    const known = new Map();
    for (const [code, r] of Object.entries(X.reqs || {})) known.set(code, (r.ctl || []).slice());
    for (const [c, list] of Object.entries(SSP.requirements || {})) for (const [rq] of list) { if (!known.has(rq)) known.set(rq, []); if (!known.get(rq).includes(c)) known.get(rq).push(c); }
    const mapsOf = new Map();
    for (const ctls of known.values()) for (const c of ctls) mapsOf.set(c, (mapsOf.get(c) || 0) + 1);
    const total = (X.trTot && X.trTot.all) || 640;
    const taken = new Set([...known.keys()].map(reqNum));
    const free = []; for (let n = 1; n <= total; n++) if (!taken.has(n)) free.push(n);
    const slots = [];
    for (const c of SSP.controls) { const n = Math.max(0, (c.r || 0) - (mapsOf.get(c.c) || 0)); for (let i = 0; i < n; i++) slots.push(c); }
    const extra = Math.max(0, slots.length - free.length), step = extra ? Math.max(2, Math.floor(slots.length / extra)) : 0;
    const tpl = {};
    for (const [code, r] of Object.entries(X.reqs || {})) { const m = /^[A-Z]{2} (\w+) Requirement \d+$/.exec(r.t || ""); if (m && !tpl[m[1]] && r.st && r.ctl && r.ctl[0]) tpl[m[1]] = [r.st.replace(/\s*This is fictional example language[^.]*\.\s*$/, ""), r.ctl[0]]; }
    const reqs = [];
    let left = extra, fi = 0;
    slots.forEach((c, i) => {
      const prev = reqs[reqs.length - 1];
      if ((left > 0 && step && i % step === step - 1 && prev && !prev.ctl.includes(c.c)) || fi >= free.length) { if (prev && !prev.ctl.includes(c.c)) { prev.ctl.push(c.c); left--; } return; }
      const n = free[fi++], kind = KINDS[(n - 1) % 4], tp = tpl[kind];
      reqs.push({ code: reqCode(n), kind, fam: c.f, ctl: [c.c], t: `${c.f} ${kind} Requirement ${String(n).padStart(3, "0")}`, st: tp ? tp[0].split(tp[1]).join(c.c) : `The assigned component shall meet ${c.c} and record a verifiable implementation state.` });
    });
    reqs.sort((a, b) => reqNum(a.code) - reqNum(b.code));
    // Assessment findings: the SAR's 313 determinations. The snapshot holds every one short of satisfied and a few others; the rest
    // are the controls whose status they decide (Satisfied or Not assessed), increment 2's from its list, then the initial
    // authorization's and increment 1's in the catalog's order, dated within their results' windows.
    const afs = [];
    const have = new Set((X.af || []).map((x) => x.code));
    const cnt = { init: 0, inc1: 0, inc2: 0 }, dcnt = {};
    for (const x of X.af || []) { cnt[x.res] = (cnt[x.res] || 0) + 1; dcnt[x.det] = (dcnt[x.det] || 0) + 1; }
    const want = (det) => Math.max(0, (AF_DET[det] || 0) - (dcnt[det] || 0));
    const add = (code, det, res, date) => { const b = SSP.ctl(code) || {}; afs.push({ id: `${code}|${res}`, code, title: b.t || code, det, res, date, syn: true }); have.add(code); cnt[res]++; dcnt[det] = (dcnt[det] || 0) + 1; };
    // Increment 2 retested controls increment 1 had judged (AU-6(3), AU-12(1)): a control may hold one determination per results.
    const knownIds = new Set((X.af || []).map((x) => x.id));
    for (const [code, det] of Object.entries(INC2)) if (!knownIds.has(`${code}|inc2`) && SSP.ctl(code) && cnt.inc2 < AF_TOT.inc2 && want(det) > 0) add(code, det, "inc2", "2026-11-13");
    const r = rng(1090);
    // A Not assessed determination may also stand on a control whose evidence never came (status No evidence), after the others.
    const pass = (pred) => {
      for (const c of SSP.controls) {
        if (have.has(c.c) || !pred(c)) continue;
        const det = c.cs === "satisfied" ? "satisfied" : "not_assessed";
        if (want(det) <= 0) continue;
        const res = cnt.init < AF_TOT.init && (cnt.inc1 >= AF_TOT.inc1 || afs.length % 5 === 0) ? "init" : cnt.inc1 < AF_TOT.inc1 ? "inc1" : null;
        if (!res) return;
        add(c.c, det, res, res === "init" ? isoPlus("2026-08-03", Math.floor(r() * 19)) : isoPlus("2026-09-16", Math.floor(r() * 55)));
      }
    };
    pass((c) => c.cs === "satisfied" || c.cs === "not_assessed");
    pass((c) => c.cs === "no_evidence");
    SYN = { reqs, afs };
    return SYN;
  }
  // Merge the full registers into the workbook's records (PA.sctm.state.R): what the snapshot and the session's walks hold wins.
  let SYNEV = new Map(); // artifact id → artifact, for the previews
  function widenRecords(R) {
    if (R.__v3x) return R;
    const Y = synth();
    for (const q of Y.reqs) {
      if (R.reqs.has(q.code)) continue;
      const a = V.get("sctm.req." + q.code, null);
      R.reqs.set(q.code, { code: q.code, t: a && a.t != null ? a.t : q.t, st: a && a.st != null ? a.st : q.st, ctl: q.ctl.slice(), els: [], ev: [], from: ["v3x"], syn: true, kind: q.kind });
    }
    R.reqsByCtl.clear();
    for (const q of R.reqs.values()) for (const c of q.ctl) { if (!R.reqsByCtl.has(c)) R.reqsByCtl.set(c, []); R.reqsByCtl.get(c).push(q.code); }
    for (const l of R.reqsByCtl.values()) l.sort(cmpText);
    // Evidence: the requirements that cite it reach the traceability's count (354 of 640), the controls' own evidence counts first;
    // the artifacts reach the Evidence register's total with its review states (lane F's evidence fact: 368, 88 pending, 54 to revise).
    const X = PA.SCTMD || { trTot: {} };
    const citing = (X.trTot && X.trTot.ev) || 354;
    const cites = (code) => (R.evByReq.get(code) || []).length > 0;
    let have = [...R.reqs.values()].filter((q) => cites(q.code)).length;
    const eslot = new Map(SSP.controls.map((c) => [c.c, Math.max(0, (c.e || 0) - (R.reqsByCtl.get(c.c) || []).filter(cites).length)]));
    const fresh = [...R.reqs.values()].filter((q) => q.syn).sort((a, b) => reqNum(a.code) - reqNum(b.code));
    const chosen = [];
    for (const q of fresh) { if (have >= citing) break; if (q.ctl.some((c) => eslot.get(c) > 0)) { chosen.push(q); have++; q.ctl.forEach((c) => eslot.set(c, Math.max(0, (eslot.get(c) || 0) - 1))); } }
    for (const q of fresh) { if (have >= citing) break; if (!chosen.includes(q)) { chosen.push(q); have++; } }
    chosen.sort((a, b) => reqNum(a.code) - reqNum(b.code));
    const F = V3.fact("evidence", WSX) || { total: 368, pending: 88, revise: 54, accepted: 226 };
    const st0 = { pending: 0, needs_revision: 0, accepted: 0 };
    for (const e of R.ev) st0[e.state] = (st0[e.state] || 0) + 1;
    const need = Math.max(chosen.length, F.total - R.ev.length);
    const states = [];
    const push = (s, n) => { for (let i = 0; i < Math.max(0, n); i++) states.push(s); };
    push("pending", F.pending - st0.pending); push("needs_revision", F.revise - st0.needs_revision);
    push("accepted", need - states.length);
    const r = rng(368);
    for (let i = states.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [states[i], states[j]] = [states[j], states[i]]; }
    const twice = need - chosen.length, every = twice > 0 ? Math.max(1, Math.floor(chosen.length / twice)) : 0;
    let k = 0, second = 0;
    SYNEV = new Map();
    const mk = (q, nth) => {
      const [kindWord, noun] = EVKIND[q.kind] || ["Document", "record"];
      const state = states[k] || "accepted", n = k++;
      const collected = isoPlus("2026-09-01", Math.floor(r() * 75));
      const e = { id: `v3x-ev-${n + 1}`, title: `${q.code} ${nth ? "second " : ""}${noun}, ${q.ctl.join(" and ")}`, kind: kindWord, owner: EVOWN[n % EVOWN.length], collected, state, reqs: [q.code], reviewed: state === "pending" ? null : isoPlus(collected, 2 + Math.floor(r() * 9)), rec: false, syn: true };
      R.ev.push(e); SYNEV.set(e.id, e);
      if (!R.evByReq.has(q.code)) R.evByReq.set(q.code, []);
      R.evByReq.get(q.code).push(e); q.ev.push(e.title);
    };
    chosen.forEach((q, i) => { mk(q, 0); if (every && second < twice && i % every === 0) { mk(q, 1); second++; } });
    for (const e of R.ev) if (!e.rec && !e.syn) SYNEV.set(e.id, e); // a title a requirement cites with no register record
    // Assessment findings.
    const ids = new Set(R.afs.map((x) => x.id));
    for (const x of Y.afs) if (!ids.has(x.id)) R.afs.push({ ...x });
    R.afByCtl.clear();
    for (const x of R.afs) { if (!R.afByCtl.has(x.code)) R.afByCtl.set(x.code, []); R.afByCtl.get(x.code).push(x); }
    R.__v3x = true;
    return R;
  }

  // ——— Rows, in the workbook's shapes (mod-zzzz-v2-7sctm.js sheetsOf) ———
  const recCtl = (code) => ({ p: "a-tests-control", id: code, label: code, title: `${code} ${(SSP.ctl(code) || {}).t || ""}`.trim() });
  const recReq = (R, code) => ({ p: "v7p-req", id: code, label: code, title: `${code} ${(R.reqs.get(code) || {}).t || ""}`.trim() });
  const recEl = (R, code) => { const e = R.els.get(code); return { p: "v7p-el", id: code, label: e ? e.name : code, title: e ? `${e.name} · ${code}${e.lru ? " · " + e.lru : ""}` : code }; };
  const recIss = (i) => ({ p: "a-risk-issue", id: i.id, label: i.title, title: i.title });
  const recPoam = (p) => ({ p: "a-risk-poam", id: `${p.id}|overview`, label: p.title, title: p.title });
  const recRisk = (r) => ({ p: "a-risk-risk", id: `${r.id}|overview`, label: r.title, title: r.title });
  const recEv = (e) => (e.rec ? { p: "a-docs-ev", id: `${e.id}|evidence`, label: e.title, title: e.title } : { p: "v3x-ev", id: e.id, label: e.title, title: e.title });
  const SEVR = { critical: 4, high: 3, moderate: 2, low: 1 };
  const bySev = (a, b) => (SEVR[b.sev] || 0) - (SEVR[a.sev] || 0) || cmpText(a.title, b.title);
  function evStateOf(R, reqCodes, v) {
    let best = null;
    for (const q of reqCodes) for (const e of R.evByReq.get(q) || []) if (!best || (EVRANK[e.state] || 0) > (EVRANK[best] || 0)) best = e.state;
    if (best) return EVST[best];
    return v && v.evs > 0 ? EVST.accepted : "";
  }
  function reqRows(R) {
    return [...R.reqs.values()].sort((a, b) => cmpText(a.code, b.code)).map((r) => {
      const iss = R.iss.filter((i) => i.req === r.code).sort(bySev);
      const poams = uniq(iss.flatMap((i) => R.poamByIss.get(i.id) || [])).map((id) => R.poams.find((p) => p.id === id)).filter(Boolean);
      const risks = uniq([...(R.riskByReq.get(r.code) || []), ...iss.flatMap((i) => R.riskByIss.get(i.id) || [])]).map((id) => R.risks.find((x) => x.id === id)).filter(Boolean).sort(bySev);
      const evs = R.evByReq.get(r.code) || [];
      const recs = { req: [recReq(R, r.code)], ctl: r.ctl.slice().sort(cmpText).map(recCtl), alloc: r.els.map((e) => recEl(R, e)), iss: iss.map(recIss), poam: poams.map(recPoam), risk: risks.map(recRisk) };
      const lab = (k) => recs[k].map((x) => x.label).join("; ");
      return { id: "q-" + rid(r.code), recId: r.code, ctls: r.ctl.slice(), recs, v: { req: r.code, t: r.t || "", st: r.st || "", ctl: recs.ctl.map((x) => x.label).join(", "), alloc: lab("alloc"), evn: String(evs.length), ev: evs.map((e) => e.title).join("; "), iss: lab("iss"), poam: lab("poam"), risk: lab("risk") } };
    });
  }
  function evRows(R) {
    return R.ev.map((e, i) => {
      const ctlsOf = uniq(e.reqs.flatMap((q) => (R.reqs.get(q) || {}).ctl || [])).sort(cmpText);
      const recs = { ev: [recEv(e)], req: e.reqs.map((q) => recReq(R, q)), ctl: ctlsOf.map(recCtl) };
      return { id: "e-" + i, recId: e.id, ctls: ctlsOf, recs, v: { ev: e.title, kind: e.kind || "", req: e.reqs.join(", "), ctl: ctlsOf.join(", "), state: EVST[e.state] || "", owner: e.owner || "", coll: e.collected || "", rev: e.reviewed || "" } };
    });
  }
  const AF_COLS = [
    { id: "f", name: "Assessment finding", kind: "rec", w: 330 }, { id: "det", name: "Determination", kind: "status", w: 190 }, { id: "ctl", name: "Control", kind: "recs", w: 120 },
    { id: "fam", name: "Family", kind: "text", w: 96 }, { id: "res", name: "Results", kind: "text", w: 240 }, { id: "date", name: "Determined", kind: "date", w: 132 },
    { id: "who", name: "Assessor", kind: "text", w: 150 }, { id: "iss", name: "Operational issue", kind: "recs", w: 260 },
  ];
  function afRows(R) {
    const list = R.afs.slice().sort((a, b) => (DETRANK[a.det] ?? 9) - (DETRANK[b.det] ?? 9) || cmpText(a.code, b.code) || cmpText(a.res, b.res));
    return list.map((x, k) => {
      const draft = x.res === "inc2" && !R.i2;
      const iss = DETRANK[x.det] <= 1 ? (R.issByCtl.get(x.code) || []).map((id) => R.issById.get(id)).filter(Boolean).sort(bySev) : [];
      const recs = { f: [{ p: "risk-finding", id: x.id, label: `${x.code} ${x.title}`, title: `${x.code} ${x.title}` }], ctl: [recCtl(x.code)], iss: iss.map(recIss) };
      return { id: "af-" + k, recId: x.id, ctls: [x.code], recs, v: { f: `${x.code} ${x.title}`, det: CS[x.det] || cap(x.det), ctl: x.code, fam: (SSP.ctl(x.code) || {}).f || "", res: `${RES[x.res] || x.resLabel || ""}${draft ? " (draft)" : ""}`, date: x.date || "", who: x.chain ? ME : RESWHO[x.res] || "", iss: iss.map((i) => i.title).join("; ") } };
    });
  }
  // A records sheet as spreadsheet-core reads it (mod-zzzz-v2-7sctm.js coreSheet).
  function coreSheet(sh) {
    const columns = sh.cols.map((c) => { const col = { id: c.id, name: c.name, type: c.kind === "num" ? "number" : c.kind === "select" ? "select" : "text", readonly: !c.edit, width: c.w }; if (c.kind === "select") col.options = c.options.slice(); return col; });
    const cells = {};
    for (const r of sh.rows) { const row = {}; for (const c of sh.cols) { const v = r.v[c.id]; if (v != null && v !== "") row[c.id] = c.edit ? { input: String(v), binding: { recordId: r.recId, fieldId: c.id } } : { input: String(v) }; } if (Object.keys(row).length) cells[r.id] = row; }
    return { id: sh.id, name: sh.name, mode: "records", rows: sh.rows.map((r) => ({ id: r.id, recordId: String(r.recId) })), columns, cells, frozenRows: 0, frozenColumns: sh.frozen || 0 };
  }
  const ISS_SHEET = "Operational issues", AF_SHEET = "Assessment findings";
  function widen(wb, ENG) {
    const ST = PA.sctm.state, R = ST.R, sheets = ST.sheets;
    if (!R || !sheets || sheets.some((s) => s.id === "afs")) return null;
    widenRecords(R);
    const by = (id) => sheets.find((s) => s.id === id);
    const sc = by("sctm"), rq = by("reqs"), ev = by("ev"), fd = by("findings");
    if (!sc || !rq || !ev || !fd) return null;
    // SCTM: Mapped by and Evidence state read the full register.
    for (const row of sc.rows) {
      if (row.inh) continue;
      const code = row.recId, reqCodes = R.reqsByCtl.get(code) || [];
      row.recs.reqs = reqCodes.map((q) => recReq(R, q));
      row.v.reqs = row.recs.reqs.map((x) => x.label).join(", ");
      row.v.evst = evStateOf(R, reqCodes, R.view(code));
    }
    sc.note = `One row a control of WS-X90's baseline (${fmt(sc.rows.length)}), read from the SSP revision 3 draft and the assessment chain as this session leaves them. Mapped by lists the requirements of the Requirements sheet that map each control, and Evidence state reads the Evidence sheet. A row's number opens its control.`;
    rq.rows = reqRows(R);
    rq.note = `WS-X90's ${fmt(rq.rows.length)} requirements, the Requirements register's. ${fmt(rq.rows.filter((x) => !(R.reqs.get(x.recId) || {}).syn).length)} are in this prototype's snapshot in full; the others are filled in from each control's requirement and evidence counts, so every control's Requirements number has its rows. Title and Statement are editable.`;
    ev.rows = evRows(R);
    const evn = (s) => ev.rows.filter((x) => x.v.state === EVST[s]).length;
    ev.note = `WS-X90's ${fmt(ev.rows.length)} evidence artifacts with their latest review, as the Evidence register counts them: ${fmt(evn("pending"))} pending review, ${fmt(evn("needs_revision"))} needing revision. ${fmt(ev.rows.filter((x) => x.recs.ev[0].p === "a-docs-ev").length)} are the register's own records; the others are filled in from the requirements that cite them. Every artifact opens its preview.`;
    // Findings becomes two sheets: the operational issues, and the assessment findings beside them.
    fd.rows = fd.rows.filter((x) => x.v.kind === "Operational issue");
    fd.cols = fd.cols.filter((c) => c.id !== "kind" && c.id !== "res").map((c) => (c.id === "sev" ? { ...c, name: "Severity", w: 120 } : c.id === "date" ? { ...c, name: "Opened", w: 120 } : c.id === "f" ? { ...c, name: "Operational issue" } : c));
    fd.name = ISS_SHEET;
    fd.note = `WS-X90's ${fmt(fd.rows.length)} open operational issues, with what this session's walks opened: the controls and requirement each names, the POA&M item that answers it and the risk that rests on it.`;
    const afs = { id: "afs", name: AF_SHEET, cols: AF_COLS, rows: afRows(R), frozen: 1 };
    const pub = afs.rows.filter((x) => !/\(draft\)$/.test(x.v.res)).length;
    afs.note = `WS-X90's ${fmt(afs.rows.length)} determinations: the initial authorization SAR (${fmt(R.afs.filter((x) => x.res === "init").length)}), increment 1 (${fmt(R.afs.filter((x) => x.res === "inc1").length)}) and increment 2 (${fmt(R.afs.filter((x) => x.res === "inc2").length)}${R.i2 ? "" : ", draft until published"})${R.afs.some((x) => x.chain) ? " and what was published today" : ""}, worst first. ${fmt(pub)} decide a control's status. Each opens its finding.`;
    sheets.splice(sheets.indexOf(fd) + 1, 0, afs);
    // The workbook again, the Analysis sheet's formulas reading the renamed sheet.
    const an = wb.sheets.find((s) => s.id === "analysis");
    const anCore = an ? JSON.parse(JSON.stringify(an)) : null;
    if (anCore) for (const row of Object.values(anCore.cells || {})) for (const c of Object.values(row)) if (c && typeof c.input === "string" && /Findings!/.test(c.input)) c.input = /"Operational issue"/.test(c.input) ? `=COUNTA('${ISS_SHEET}'!A:A)` : c.input.replace(/Findings!/g, `'${ISS_SHEET}'!`);
    const core = sheets.map((sh) => (sh.freeform ? anCore : coreSheet(sh))).filter(Boolean);
    return ENG.createWorkbook(wb.name, core);
  }
  const ENG = window.PA_SHEET;
  if (ENG && PA.sctm && typeof ENG.createHistory === "function") {
    const hist0 = ENG.createHistory;
    // build() sets ST.R, ST.sheets and ST.base just before it asks for the workbook's history: the full registers go in there.
    ENG.createHistory = function (wb, n) {
      try {
        if (on() && V3.wsx() && PA.sctm.state && PA.sctm.state.base === wb) {
          const wb2 = widen(wb, ENG);
          if (wb2) { PA.sctm.state.base = wb2; return hist0.call(this, wb2, n); }
        }
      } catch (e) { console.error("v3x sctm", e); }
      return hist0.apply(this, arguments);
    };
  }
  // The sheet tabs say the sheets' own names (lane F's subset names no longer apply), and a row's number opens its record.
  function sctmDom() {
    if (!on() || !inSctm() || !V3.wsx()) return;
    const app = document.getElementById("sx-app"), ST = PA.sctm && PA.sctm.state; if (!app || !ST || !ST.built) return;
    for (const tab of app.querySelectorAll(".sx-tab[data-sx-tab]")) {
      const sh = ST.sheets.find((s) => s.id === tab.dataset.sxTab); if (!sh) continue;
      const first = tab.firstChild;
      if (first && first.nodeType === 3) { const sp = document.createElement("span"); sp.className = "v3x-tn"; sp.textContent = sh.name; tab.replaceChild(sp, first); }
      if (tab.getAttribute("title") && tab.getAttribute("title") !== sh.name) tab.setAttribute("title", sh.name);
    }
    const g = document.getElementById("sx-grid"), sh = g && ST.sheets.find((s) => s.id === g.dataset.sheet);
    if (sh && !sh.freeform) for (const rh of app.querySelectorAll(".sx-rh:not([data-panel])")) {
      const row = sh.rows[(+rh.textContent || 0) - 1]; const own = row && row.recs && (row.recs[sh.cols[0].id] || [])[0];
      if (!own) continue;
      rh.setAttribute("data-panel", own.p); rh.setAttribute("data-id", own.id); rh.setAttribute("title", `Open ${own.label.length > 60 ? own.label.slice(0, 59) + "…" : own.label}`);
    }
    // Close returns to Controls: the workbook is Controls' spreadsheet view.
    ST.from = "controls";
    const back = app.querySelector(".sx-back");
    if (back) { if (back.getAttribute("href") !== "#controls") back.setAttribute("href", "#controls"); const s = back.querySelector("span"); if (s && s.textContent !== "Controls") { s.textContent = "Controls"; back.setAttribute("aria-label", "Close the workbook and return to Controls"); } }
    const x = app.querySelector(".sx-close"); if (x && x.getAttribute("aria-label") !== "Close the workbook and return to Controls") x.setAttribute("aria-label", "Close the workbook and return to Controls");
  }
  PA.v3x = { synth, sctmDom, techs: () => techs(), techStanding: () => techStanding() };
  let sxTimer = 0;
  if (window.MutationObserver) new MutationObserver(() => { if (!on() || !inSctm()) return; if (!sxTimer) sxTimer = requestAnimationFrame(() => { sxTimer = 0; sctmDom(); }); }).observe(document.body || document.documentElement, { childList: true, subtree: true });
  window.addEventListener("hashchange", () => { if (on() && inSctm() && V3.wsx() && PA.sctm && PA.sctm.state) PA.sctm.state.from = "controls"; });

  // ——— Previews for the records the snapshot does not hold ———
  const kv = (rows) => AK.facts(rows.filter(Boolean));
  const pv = (label, title, chip, facts, ...secs) => ({ label, body: `<div class="v7p-pan v3x-pv">${AK.recordHead({ title, chip })}${kv(facts)}${secs.filter(Boolean).join("")}</div>` });
  const recBtn = (p, id, label, end) => `<li class="sx-pv-li"><button type="button" class="sx-pv-a" data-panel="${esc(p)}" data-id="${esc(id)}">${esc(label)}</button>${end ? `<span class="sx-pv-e">${end}</span>` : ""}</li>`;
  const recList = (items) => `<ul class="v3x-ul">${items.join("")}</ul>`;
  V3.P("v3x-ev", (orig, id) => {
    const R = PA.sctm && PA.sctm.state && PA.sctm.state.R;
    const e = SYNEV.get(String(id)) || (R ? R.ev.find((x) => x.id === id) : null);
    if (!e) return { label: "Evidence preview", body: `<div class="v7p-pan">${AK.recordHead({ title: "Evidence artifact" })}<p class="v7p-prose">Open the SCTM workbook to read this artifact.</p></div>` };
    const ctls = uniq(e.reqs.flatMap((q) => ((R && R.reqs.get(q)) || {}).ctl || [])).sort(cmpText);
    return pv("Evidence preview", e.title, h.pill("none", EVST[e.state] || "Accepted"),
      [["Kind", esc(e.kind || "Document")], ["Owner", e.owner ? AK.owner(e.owner) : `<span class="v2-dash" aria-label="Not recorded">—</span>`], ["Collected", e.collected ? esc(md(e.collected)) : `<span class="v2-dash" aria-label="Not recorded">—</span>`], ["Reviewed", e.reviewed ? esc(md(e.reviewed)) : esc(EVST[e.state] === "Pending review" ? "Waiting for a reviewer" : "Not recorded")]],
      AK.section("Cited by", recList(e.reqs.map((q) => recBtn("v7p-req", q, `${q} ${((R && R.reqs.get(q)) || {}).t || ""}`))), { count: e.reqs.length }),
      AK.section("Controls", recList(ctls.map((c) => recBtn("a-tests-control", c, `${c} ${(SSP.ctl(c) || {}).t || ""}`))), { count: ctls.length }));
  });
  // A finding v2's own preview does not hold (mod-risk.js knows the snapshot's 68): one filled in, or one published in this session.
  const SYNAF = () => new Map(synth().afs.map((x) => [x.id, x]));
  V3.P("risk-finding", (orig, id) => {
    const known = new Set(((PA.SCTMD || {}).af || []).map((a) => a.id));
    if (known.has(String(id))) return orig();
    const R = PA.sctm && PA.sctm.state && PA.sctm.state.R;
    const x = (R && R.afs.find((a) => a.id === String(id))) || SYNAF().get(String(id)); if (!x) return orig();
    const draft = x.res === "inc2" && !(R && R.i2);
    return pv("Assessment finding preview", `${x.code} ${x.title}`, null,
      [["Determination", h.pill("none", CS[x.det] || cap(x.det))], ["Results", esc(RES[x.res] || x.resLabel || "Published today")], ["State", draft ? h.pill("none", "Draft") : h.pill("ok", "Published")], ["Determined", esc(md(x.date))], ["Assessor", AK.owner(x.chain ? ME : RESWHO[x.res] || ME)]],
      AK.section("Control", recList([recBtn("a-tests-control", x.code, `${x.code} ${x.title}`, esc(CS[(V3.fact("status", x.code) || (SSP.ctl(x.code) || {}).cs)] || ""))])),
      x.det === "satisfied" ? AK.section("Operational issue", `<p class="v7p-prose">Nothing to remediate.</p>`) : AK.section("Operational issue", `<p class="v7p-prose">None: a determination short of satisfied would open one.</p>`));
  });

  // ════════════════ Controls: Open as spreadsheet ════════════════
  V3.S("controls", (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    return edit(html, (root) => {
      for (const it of root.querySelectorAll('[data-go="sctm"]')) { const d = it.closest("details.sx-wayin"); if (d && d.querySelectorAll("[role=menuitem]").length <= 1) d.remove(); else it.remove(); }
      const btns = root.querySelector(".btns"); if (!btns || btns.querySelector("[data-v3x-sheet]")) return;
      const b = document.createElement("button"); b.type = "button"; b.className = "btn"; b.setAttribute("data-go", "sctm"); b.setAttribute("data-v3x-sheet", "1");
      b.innerHTML = `${AK.i ? AK.i("grid") : ""}Open as spreadsheet`;
      const ink = btns.querySelector(".btn.ink"); btns.insertBefore(b, ink || null);
    });
  });

  // ════════════════ Posture: Columns by control family or by resiliency technique ════════════════
  // The techniques of NIST SP 800-160 Vol. 2 in the framework's order, each with the controls Table E-1 names (the union of its
  // approaches' supporting controls, read from v2's own Cyber resiliency previews, so the sets are the ones that page counts).
  let TECHS = null;
  const frag = (s) => { const t = document.createElement("template"); t.innerHTML = s || ""; return t.content; };
  function techs() {
    if (TECHS) return TECHS;
    const CODE = /^[A-Z]{2}-\d+(\(\d+\))?$/, out = [];
    try {
      V3.force(false, () => {
        const res = frag(S.resiliency ? S.resiliency() : "");
        for (const tr of res.querySelectorAll('tr[data-panel="v7a-tech"]')) {
          const code = tr.dataset.id, t = txt(tr.querySelector("td b") || tr.querySelector("td"));
          const pc = frag((P["v7a-tech"] && P["v7a-tech"](code) || {}).body);
          const ctl = new Set();
          for (const a of pc.querySelectorAll('[data-panel="v7a-app"]')) {
            const ac = frag((P["v7a-app"](a.dataset.id) || {}).body);
            const sec = [...ac.querySelectorAll(".ak-sec, section")].find((x) => /^Supporting controls/.test(txt(x))) || ac;
            for (const e of sec.querySelectorAll("*")) if (!e.children.length && CODE.test(e.textContent.trim())) ctl.add(e.textContent.trim());
          }
          out.push({ code, t, ctl: [...ctl] });
        }
      });
    } catch (e) { console.error("v3x techs", e); }
    if (out.length) TECHS = out;
    return out;
  }
  const READING = {
    posture: ["mapped", "Objectives mapped", "objectives mapped"], "posture-unevidenced": ["unev", "Without evidence", "objectives without evidence"],
    "posture-issues": ["iss", "Open issues", "open issues"], "posture-risks": ["risk", "Open risks", "open risks"],
  };
  const SEVN = { critical: 4, high: 3, moderate: 2, low: 1 };
  const SEVW = ["", "low", "moderate", "high", "critical"];
  // What stands under each technique at the authorization boundary, from the live chain: objectives of the baseline's controls
  // (each control's own view), and the open operational issues and risks that rest on those controls.
  function techStanding() {
    const ch = V.chain, X = PA.SCTMD || {};
    const base = new Map(SSP.controls.map((c) => [c.c, c]));
    const vw = (code) => { const v = ch && ch.view ? ch.view(code) : null, b = base.get(code) || {}; return { ob: (v || b).ob || 0, om: (v || b).om || 0, oe: (v || b).oe || 0 }; };
    const iss = [
      ...(ch && ch.issues ? ch.issues() : []).map((i) => ({ id: i.id, sev: i.sev, title: i.title, ctls: [i.ctl] })),
      ...(X.iss || []).map((i) => ({ id: i.id, sev: i.sev, title: i.title, ctls: uniq([...(i.from || []).map((f) => f[0]), ...(((X.reqs || {})[i.req] || {}).ctl || [])]) })),
    ];
    const risks = [
      ...(ch && ch.risks ? ch.risks() : []).map((r) => ({ id: r.id, sev: r.sev, title: r.title, iss: [r.issue].filter(Boolean), reqs: [] })),
      ...(X.risks || []).map((r) => ({ id: r.id, sev: r.sev, title: r.title, iss: r.iss || [], reqs: r.reqs || [] })),
    ];
    const one = (codes) => {
      const set = new Set(codes.filter((c) => base.has(c)));
      let mapped = 0, ev = 0; const ctls = [];
      for (const c of set) { const v = vw(c); mapped += v.om; ev += v.oe; ctls.push({ c, ...v }); }
      const is = iss.filter((i) => i.ctls.some((c) => set.has(c))), ids = new Set(is.map((i) => i.id));
      const rs = risks.filter((r) => r.iss.some((id) => ids.has(id)) || r.reqs.some((q) => (((X.reqs || {})[q] || {}).ctl || []).some((c) => set.has(c))));
      const worst = (l) => l.reduce((m, x) => Math.max(m, SEVN[x.sev] || 0), 0);
      return { n: set.size, mapped, unev: mapped - ev, iss: is.length, risk: rs.length, issSev: worst(is), riskSev: worst(rs), ctls, is, rs };
    };
    const T = techs();
    return { T, by: T.map((t) => one(t.ctl)), all: one(uniq(T.flatMap((t) => t.ctl))) };
  }
  const TINT = [0, 9, 18, 30, 44, 58];
  const stepOf = (v) => (v <= 0 ? 0 : v <= 2 ? 1 : v <= 5 ? 2 : v <= 12 ? 3 : v <= 30 ? 4 : 5);
  const tintOf = (v) => (v <= 0 ? 0 : v <= 5 ? 1 : v <= 20 ? 2 : v <= 60 ? 3 : v <= 150 ? 4 : 5);
  const SEVBG = { 4: ["var(--bad)", "#fff"], 3: ["var(--bad-soft)", "var(--bad)"], 2: ["var(--warn-soft)", "var(--warn)"], 1: ["var(--band)", "var(--ink-2)"] };
  function techChart(route) {
    const [k, label, unit] = READING[route] || READING.posture;
    const D = techStanding(); if (!D.T.length) return null;
    const rows = Object.entries(READING).map(([r, [kk, lab, un]]) => {
      const cells = D.by.map((x, i) => {
        const v = x[kk], t = D.T[i], sev = kk === "iss" ? x.issSev : kk === "risk" ? x.riskSev : null;
        if (!v) return `<td class="v7a-hz"><span class="v7a-sr">0</span></td>`;
        const style = sev != null ? `--hc:${(SEVBG[sev] || SEVBG[1])[0]};--ht:${(SEVBG[sev] || SEVBG[1])[1]}` : `--hc:color-mix(in srgb, var(--brand) ${TINT[kk === "mapped" || kk === "unev" ? tintOf(v) : stepOf(v)]}%, var(--canvas))`;
        return `<td><button type="button" class="v7a-hc" style="${style}" data-panel="v3x-ptech" data-id="${esc(kk)}:${esc(t.code)}" title="${esc(`${t.t}: ${fmt(v)} ${un}`)}">${fmt(v)}</button></td>`;
      }).join("");
      return `<tr class="${r === route ? "v3x-cur" : ""}"><th scope="row" class="v7a-hel"><span class="v3x-rl">${esc(lab)}</span></th>${cells}<td class="v7a-htot num">${fmt(D.all[kk])}</td></tr>`;
    });
    const head = `<tr><th class="v7a-hel" scope="col">Reading</th>${D.T.map((t) => `<th scope="col" class="v3x-vh" title="${esc(t.t)}"><span>${esc(t.t)}</span></th>`).join("")}<th scope="col" class="v7a-htot">Total</th></tr>`;
    // Both keys: objectives by count, issues and risks by the worst severity standing there.
    const legend = `<div class="legend">${["1–5", "6–20", "21–60", "61–150", "151 or more"].map((l, i) => `<span style="--c:color-mix(in srgb, var(--brand) ${TINT[i + 1]}%, var(--canvas))">${l}</span>`).join("")}<span class="v7a-mu">objectives; a zero is left blank</span></div>
      <div class="legend"><span style="--c:var(--bad)">Critical</span><span style="--c:var(--bad-soft)">High</span><span style="--c:var(--warn-soft)">Moderate</span><span style="--c:var(--band)">Low</span><span class="v7a-mu">issues and risks wear the worst severity standing there</span></div>`;
    return `<section class="v7a-chart v3x-tchart"><div class="v7a-chart-h"><div class="v7a-chart-t"><b>${esc(label)} by resiliency technique</b><span class="v7a-mu num">The authorization boundary · ${D.T.length} techniques · ${fmt(D.all.n)} of the baseline's controls support one · a cell opens what stands there</span></div></div>
      <div class="tablebox"><table class="v7a-heat v3x-theat" aria-label="${esc(label)} by resiliency technique"><thead>${head}</thead><tbody>${rows.join("")}</tbody></table></div>
      <div class="v7a-chart-f">${legend}</div></section>
      <p class="note-p">An objective stands under every technique its control supports in Table E-1 of NIST SP 800-160 Vol. 2, so it may stand under several; Total counts it once. A control no technique names is not placed here. This reading is the boundary's, SYS-WSX90: the snapshot places objectives on the elements inside it by control family only.</p>`;
  }
  ["posture", "posture-unevidenced", "posture-issues", "posture-risks"].forEach((route) => V3.S(route, (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    const cols = (get("cols", null) || {}).posture || "fam";
    return edit(html, (root) => {
      const span = [...root.querySelectorAll(".btns .btn")].find((b) => /^Columns:/.test(txt(b)));
      if (span) {
        const seg = document.createElement("div"); seg.className = "v7a-seg v3x-cols"; seg.setAttribute("role", "group"); seg.setAttribute("aria-label", "Columns");
        seg.innerHTML = [["fam", "Control families"], ["tech", "Resiliency techniques"]].map(([v, l]) => `<button type="button" class="${cols === v ? "on" : ""}" aria-pressed="${cols === v}" data-v3x-cols="${v}">${esc(l)}</button>`).join("");
        span.replaceWith(seg);
      }
      // The callout's icon carries a copy of its sentence (lane F's edit writes the line into both spans): the icon is a glyph only.
      for (const gl of root.querySelectorAll(".ak-banner > .gl")) if (gl.textContent.trim() && gl.nextElementSibling && gl.nextElementSibling.classList.contains("x")) gl.textContent = "";
      if (cols !== "tech") return;
      const chart = root.querySelector("section.v7a-chart"), mine = techChart(route); if (!chart || !mine) return;
      const t = document.createElement("template"); t.innerHTML = mine;
      const note = chart.nextElementSibling && chart.nextElementSibling.matches("p.note-p") ? chart.nextElementSibling : null;
      chart.replaceWith(t.content); if (note) note.remove();
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) if (/elements by control family, counted in assessment objectives/.test(n.nodeValue)) { n.nodeValue = n.nodeValue.replace("elements by control family", "authorization boundary by resiliency technique"); break; }
    });
  }));
  document.addEventListener("click", (e) => {
    if (!on()) return;
    const b = e.target && e.target.closest ? e.target.closest("[data-v3x-cols]") : null; if (!b) return;
    e.preventDefault();
    put("cols", { ...(get("cols", null) || {}), posture: b.dataset.v3xCols });
    if (V.redraw) V.redraw();
  });
  // A cell: what stands under the technique at the boundary, each record opening its own preview.
  V3.P("v3x-ptech", (orig, id) => {
    const [k, code] = String(id || "").split(":");
    const D = techStanding(), i = D.T.findIndex((t) => t.code === code); if (i < 0) return orig();
    const t = D.T[i], x = D.by[i];
    const list = (items) => `<ul class="v3x-ul">${items.join("")}</ul>`;
    const ctls = x.ctls.filter((c) => (k === "unev" ? c.om > c.oe : c.om > 0)).sort((a, b) => (b.om - b.oe) - (a.om - a.oe) || cmpText(a.c, b.c));
    const sev = (s) => (h.sevPill ? h.sevPill(s) : esc(cap(s)));
    const body = k === "iss" ? AK.section("Open issues", list(x.is.slice().sort((a, b) => (SEVN[b.sev] || 0) - (SEVN[a.sev] || 0)).map((r) => recBtn("a-risk-issue", r.id, r.title, sev(r.sev)))), { count: x.is.length })
      : k === "risk" ? AK.section("Open risks", list(x.rs.slice().sort((a, b) => (SEVN[b.sev] || 0) - (SEVN[a.sev] || 0)).map((r) => recBtn("a-risk-risk", `${r.id}|overview`, r.title, sev(r.sev)))), { count: x.rs.length })
      : AK.section("Controls", list(ctls.map((c) => recBtn("a-tests-control", c.c, `${c.c} ${(SSP.ctl(c.c) || {}).t || ""}`, `<span class="num">${fmt(c.om)} of ${fmt(c.ob)} mapped · ${fmt(c.oe)} evidenced</span>`))), { count: ctls.length });
    return { label: "Posture cell preview", body: `<div class="v7a-pan v3x-pv">${AK.recordHead({ title: t.t, chip: AK.chip("Resiliency technique") })}
      ${AK.facts([["Objectives mapped", `<span class="num">${fmt(x.mapped)}</span>`], ["With evidence", `<span class="num">${fmt(x.mapped - x.unev)}</span> <span class="v7a-mu">· ${fmt(x.unev)} without</span>`], ["Open issues", x.iss ? `<span class="num">${fmt(x.iss)}</span> ${sev(SEVW[x.issSev])}` : "None"], ["Open risks", x.risk ? `<span class="num">${fmt(x.risk)}</span> ${sev(SEVW[x.riskSev])}` : "None"], ["Controls in the baseline", `<span class="num">${fmt(x.n)} of ${fmt(t.ctl.length)}</span> <span class="v7a-mu">Table E-1 names</span>`]])}
      ${body}</div>` };
  });

  // ════════════════ SSP section links land at their section ════════════════
  const SEC_RE = /(?:SSP\s*(?:3\s*)?(?:section|§)\s*|§\s*)(\d{1,2}|[ABC])\b/i;
  function sectionOf(el) {
    const own = txt(el); let m = SEC_RE.exec(own);
    // Else the line the link sits in (up to three levels up), when that line names exactly one section ("SSP 3 · §9 … Open the SSP").
    for (let a = el.parentElement, i = 0; !m && a && i < 3 && a.id !== "main" && a.id !== "panel"; a = a.parentElement, i++) {
      const all = txt(a).match(new RegExp(SEC_RE.source, "gi")) || [];
      if (all.length === 1) m = SEC_RE.exec(all[0]); else if (all.length > 1) break;
    }
    if (!m) return null;
    const n = m[1].toUpperCase();
    const s = (SSP.sections || []).find((x) => String(x.n).toUpperCase() === n);
    return s ? s.id : null;
  }
  document.addEventListener("click", (e) => {
    if (!on() || !V3.wsx()) return;
    const t = e.target && e.target.closest ? e.target.closest('[data-go="ssp"], a[href="#ssp"], [data-v2go="ssp"]') : null;
    if (!t || t.closest("#sx-app, .se-app")) return;
    const at = sectionOf(t); if (!at) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    V.go("ssp", { at });
  }, true);

  // ════════════════ Plans: New plan creates the draft ════════════════
  const NEWPLANS = [
    { k: "scrm", route: "plan-scrm", title: "Supply chain risk management plan", abbr: "SCRMP", std: "NIST SP 800-161 Rev 1", ctl: "SR-2", noun: "supply chain risk management plan",
      secs: [["Purpose and scope", null], ["Roles and responsibilities", "People & roles"], ["Supplier inventory", "Composition: the elements and their suppliers"], ["Supply chain risk assessment", "Risks that name a supplier"], ["Controls the plan implements", "SR-1 to SR-12 in the baseline"], ["Monitoring and review", null]] },
    { k: "pia", route: "plan-pia", title: "Privacy impact assessment", abbr: "PIA", std: "OMB M-03-22", ctl: "RA-8", noun: "privacy impact assessment",
      secs: [["System and information collected", "Boundary: data types"], ["Purpose of the collection", null], ["Sharing and interconnections", "Interconnections"], ["Notice and consent", null], ["Safeguards", "PT and AC controls in the baseline"], ["Retention and disposal", null]] },
    { k: "cms", route: "plan-cms", title: "Continuous monitoring strategy", abbr: "CMS", std: "NIST SP 800-137", ctl: "CA-7", noun: "continuous monitoring strategy",
      secs: [["Purpose and scope", null], ["Metrics and frequencies", "Continuous monitoring: recurring checks"], ["Roles and responsibilities", "People & roles"], ["Reporting", "Posture and control status"], ["Reauthorization triggers", "Continuous monitoring: triggers"], ["Review and update", null]] },
  ];
  const planOf = (k) => NEWPLANS.find((x) => x.k === k);
  const made = () => (get("plans", null) || []).filter((x) => x && planOf(x.k));
  const madeOf = (k) => made().find((x) => x.k === k) || null;
  const secId = (i) => "s" + (i + 1);
  // New plan's Create draft makes the draft (the v2 dialog guard lets a primary marked data-v2-wired act for itself); a plan already
  // drafted says so beside its name, and choosing it again opens that draft.
  V3.M("v8d-newplan", (orig) => {
    const o = orig(); if (!o || !V3.wsx()) return o;
    let body = String(o.body);
    for (const x of made()) { const pl = planOf(x.k); body = body.replace(`<b>${esc(pl.title)}</b>`, `<b>${esc(pl.title)}</b> ${h.pill("none", "Draft")}`); }
    return { ...o, body, footer: String(o.footer).replace('data-v8d-act="newplan-ok"', 'data-v8d-act="newplan-ok" data-v2-wired="1"') };
  });
  // Create draft, in New plan: the draft is a record (a second create opens the same draft).
  document.addEventListener("click", (e) => {
    if (!on() || !V3.wsx()) return;
    const t = e.target && e.target.closest ? e.target.closest('[data-v8d-act="newplan-ok"]') : null; if (!t) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const r = document.querySelector('input[name="v8d-np"]:checked'), pl = NEWPLANS[r ? +r.value : 0] || NEWPLANS[0];
    const was = madeOf(pl.k);
    if (!was) put("plans", [...made(), { k: pl.k, at: new Date().toISOString(), by: ME, text: {} }]);
    const x = document.querySelector("[data-close-modal]"); if (x) x.click();
    location.hash = pl.route;
    if (V.toast) V.toast(was ? `${pl.title} is already a draft: it opens where you left it.` : `${pl.title}: a draft, revision 1, from the ${pl.std} template. It is listed on Plans.`);
  }, true);
  const when = (iso) => { const d = new Date(iso); return isNaN(d) ? "Today" : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); };
  // Plans lists the drafts with the plans beside them.
  ["ssps", "ssps-drafts"].forEach((route) => V3.S(route, (orig) => {
    const html = orig(); if (!V3.wsx()) return html;
    const list = made(); if (!list.length) return html;
    return edit(html, (root) => {
      const tab = [...root.querySelectorAll("[role=tab]")].find((t) => t.getAttribute("data-go") === "ssps");
      if (tab) { const ct = tab.querySelector(".ct"); if (ct) ct.textContent = fmt((+ct.textContent.replace(/\D/g, "") || 0) + list.length); }
      if (route !== "ssps" && !(tab && tab.getAttribute("aria-selected") === "true")) return;
      const tbody = root.querySelector("table tbody"), first = tbody && tbody.querySelector("tr"); if (!first) return;
      const heads = [...root.querySelectorAll("table thead th")].map(txt);
      for (const x of list.slice().reverse()) {
        const pl = planOf(x.k), tr = document.createElement("tr");
        tr.setAttribute("tabindex", "0"); tr.setAttribute("data-panel", "v3x-plan"); tr.setAttribute("data-id", pl.k);
        tr.innerHTML = heads.map((hd, i) => {
          const c = hd === "Plan" ? `<span class="v8d-pn" title="${esc(pl.title)}"><span>${esc(pl.title)}</span><span class="ak-code">${esc(pl.abbr)}</span></span>`
            : hd === "Revision" ? `<span class="num">1</span>` : hd === "Status" ? h.pill("none", "Draft") : hd === "Owner" ? AK.owner(x.by || ME)
            : hd === "Editing now" ? `<span class="v2-dash" aria-label="Nobody">Nobody</span>` : hd === "Last edit" ? `<span class="num">${esc(when(x.edited || x.at))}</span>`
            : `<span class="num">0</span>`;
          return `<td${i ? "" : ' class="nm"'}>${c}</td>`;
        }).join("");
        tbody.insertBefore(tr, first);
      }
      const pg = root.querySelector(".pager .num"); if (pg) pg.textContent = pg.textContent.replace(/(\d+)–(\d+) of (\d+)/, (m, a, b, c) => `${a}–${+b + list.length} of ${+c + list.length}`);
    });
  }));
  V3.P("v3x-plan", (orig, k) => {
    const pl = planOf(String(k)), x = pl && madeOf(pl.k); if (!pl || !x) return orig();
    const filled = pl.secs.filter((s, i) => (x.text || {})[secId(i)]).length;
    return { label: "Plan preview", body: `<div class="v8d-pan">${AK.recordHead({ title: pl.title, chip: h.pill("none", "Draft"), actions: `<button type="button" class="btn ink sm" data-go="${pl.route}">Open document</button>` })}
      ${AK.facts([["Revision", "Revision 1"], ["Owner", AK.owner(x.by || ME)], ["Template", esc(pl.std)], ["Control", esc(pl.ctl)], ["Sections written", `<span class="num">${fmt(filled)} of ${fmt(pl.secs.length)}</span>`]])}
      ${AK.section("Sections drawn from records", pl.secs.filter((s) => s[1]).map((s) => `<div class="v8d-prow"><b>${esc(s[0])}</b><span class="v8d-mu">${esc(s[1])}</span></div>`).join(""), { count: pl.secs.filter((s) => s[1]).length })}</div>` };
  });
  // The draft's editor: the template's sections, each written in place and kept for the session.
  NEWPLANS.forEach((pl) => {
    V3.screen(pl.route, () => {
      const x = madeOf(pl.k);
      if (!x) return h.page(AK.indexHead({ title: pl.title, desc: "Not created yet" }), `<div class="card"><p>This plan is not a draft yet. New plan, on Plans, creates it from its template.</p><button type="button" class="btn ink" data-go="ssps">Open Plans</button></div>`);
      const text = x.text || {};
      const secs = pl.secs.map(([t, src], i) => `<section class="v3x-sec" id="v3x-${pl.k}-${secId(i)}"><h2 class="v3x-h">${i + 1}. ${esc(t)}</h2>${src ? `<p class="v3x-src">Reads ${esc(src)} live once published.</p>` : ""}<div class="v3x-ed" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${esc(`Section ${i + 1}, ${t}`)}" data-v3x-plan="${pl.k}" data-v3x-sec="${secId(i)}" data-ph="Write this section">${text[secId(i)] || ""}</div></section>`).join("");
      const filled = pl.secs.filter((s, i) => text[secId(i)]).length;
      return h.page(
        AK.indexHead({ title: pl.title, desc: `WS-X90 · draft, revision 1 · from the ${pl.std} template · implements ${pl.ctl}`, actions: `<button type="button" class="btn" data-go="ssps">Back to Plans</button>` }),
        `<div class="v3x-doc"><div class="v3x-meta">${h.pill("none", "Draft")}<span class="num">${fmt(filled)} of ${fmt(pl.secs.length)} sections written</span><span>Owner ${esc(x.by || ME)}</span></div>${secs}</div>`);
    }, "ssps");
  });
  // Writing a section keeps it (on leaving the section).
  document.addEventListener("focusout", (e) => {
    if (!on()) return;
    const el = e.target && e.target.closest ? e.target.closest("[data-v3x-plan]") : null; if (!el) return;
    const list = made(), x = list.find((p) => p.k === el.dataset.v3xPlan); if (!x) return;
    const v = el.innerHTML.trim() === "<br>" ? "" : el.innerHTML.trim();
    if ((x.text || {})[el.dataset.v3xSec] === v) return;
    x.text = { ...(x.text || {}), [el.dataset.v3xSec]: v }; x.edited = new Date().toISOString();
    put("plans", list);
  });
})();
