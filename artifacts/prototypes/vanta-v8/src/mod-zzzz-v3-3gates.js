// Prototype V3, lane G (v3g-): gates read their records, and decisions reach every page. Findings A15 B01 B02 B05 B06 B07 B08 B09
// B10 B11 B12 B13 B14 B15 B23 B26 B27 B29 B30 C01 C05 C21 (SP/vanta/review). Inert while V3 is off: every screen, preview and dialog
// goes through PA.v3.S/P/M, every listener returns at once, every wrapper of a v2 function hands back v2's answer.
// - A decision records only the decision. Deliverables and criteria read their records at draw time (Interconnections' agreements,
//   the SCA's boundary review, the controls with no requirement, SSP revision 3, the security outcomes); Approve waits while any of
//   them is open; with conditions, each condition is tracked with an owner and a due day on Lifecycle, the gate and its owner's
//   My work until closed. A request names each step's holder; each step is recorded on its own, as risk acceptance does, and a step
//   recorded by somebody else says whom it was recorded as.
// - One status per security outcome per increment, read by every gate and by Lifecycle's Security outcomes view, which Security
//   engineering folds into (sse → lifecycle-outcomes).
// - One authorization record per decision: Lifecycle's IATT and ATO steps write it; Authorization's decision history, Boundary and
//   the package read it. Package room becomes Authorization's Sharing tab.
// State (PA.v2 session state): life.req / life.dec / life.hist in v2's own shapes; under v3.G: req.<k> { names, at };
//   steps.<k> [{ i, who, role, o, note, at, rec }]; cond.<k> [{ id, t, owner, due, at }]; condx.<id> { at, by, how, rec };
//   auth.<k> { type, decided, by, atd, scope, conditions }; rec.<k> { rec, risk, note, at, by }; out.<inc>.<code> { s, at, by };
//   bnd { state, at, by, note }; ssp21 { state, at, by, comment }. <k> is "<program>.<step id>".
// Facts: authorizations(prog), conditions(prog), gate(id), outcome(code, inc).
(function () {
  const PA = window.PA, V = PA && PA.v2, X = PA && PA.v3;
  if (!V || !X || !PA.AK || !PA.h || !V.chain || !V.chain.ui) return;
  const { S, P, h } = PA;
  const AK = PA.AK, { esc, fmt, pill, gl } = h;
  const CH = V.chain, U = CH.ui;
  const on = () => X.on();
  const TODAY_ISO = "2026-11-17", WSX = "PRG-1090", ME = "Ingrid Solberg";
  const pad = (n) => String(n).padStart(2, "0");
  const dt = (iso) => new Date(String(iso).slice(0, 10) + "T12:00:00");
  const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (iso, n) => { const d = dt(iso); d.setDate(d.getDate() + n); return isoOf(d); };
  const days = (iso) => Math.round((dt(iso) - dt(TODAY_ISO)) / 86400000);
  const md = (iso) => (iso ? AK.md(String(iso).slice(0, 10)) : "");
  const mdy = (iso) => (iso ? dt(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const mu = (t) => `<span class="v2g-mu">${t}</span>`;
  const DASH = '<span class="v2-dash" aria-label="None">—</span>';
  const has = (r) => !!(r && S[r]);
  const parse = (html) => { const t = document.createElement("template"); t.innerHTML = html; return t; };
  const G = (p, d) => { const v = V.get("v3.G." + p, d); return v === undefined ? d : v; };
  const Gset = (p, v) => V.set("v3.G." + p, v);
  const safe = (s) => String(s).replace(/[^A-Za-z0-9_-]/g, "_");
  const goQ = (route, q) => `data-v2go="${esc(route)}"${q ? ` data-v2q="${esc(JSON.stringify(q))}"` : ""}`;

  // ════════════════ The template (v2's, mod-zzzz-v2-8life.js; its internals are not exposed) ════════════════
  const PH = [["MSA", "Materiel solution analysis"], ["TMRR", "Technology maturation & risk reduction"], ["EMD", "Engineering & manufacturing development"], ["Test", "Integration, test & production approval"], ["Ops", "Production, deployment & operations"]];
  const KIND = { rev: "Engineering review", ms: "Milestone decision", rmf: "RMF action", op: "Operational" };
  const T = [
    ["asr", 0, "rev", "ASR", "ASR", "ASR · Alternative systems review", "Preliminary boundary and data types identified", ["BA.4", "BA.5"], "The program office evaluates candidate concepts against user requirements."],
    ["ms-a", 0, "ms", "Milestone A", "A", "Milestone A decision", "System categorization brief accepted", [], "Funding approved for prototyping and technology maturation."],
    ["cat", 0, "rmf", "Categorize", "Cat", "Categorize the system", "FIPS-199 categorization signed by the AO", ["SN.4"], "The program and its security team set the confidentiality, integrity and availability impact levels."],
    ["srr", 1, "rev", "SRR", "SRR", "SRR · System requirements review", "Security requirements traced into the spec", ["SR.2", "SR.4"], "Every system performance requirement is defined, actionable and understood."],
    ["sfr", 1, "rev", "SFR", "SFR", "SFR · System functional review", "Functional decomposition of the security boundary", ["SR.1"], "The functional baseline is established against the specification."],
    ["sel", 1, "rmf", "Select controls", "Sel", "Select security controls", "Tailored baseline approved by the AO", [], "A NIST SP 800-53 Rev. 5 baseline is selected and tailored to the system; the AO approves it and the SCA reviews it."],
    ["pdr", 1, "rev", "PDR", "PDR", "PDR · Preliminary design review", "SCA review of the conceptual boundary", [], "The allocated baseline is reviewed for readiness to enter detailed design."],
    ["strat", 1, "rmf", "RMF strategy", "Strat", "AO approval of the RMF strategy", "Signed RMF security strategy memo", ["RM.3"], "The authorizing official approves the security strategy before Milestone B."],
    ["ms-b", 2, "ms", "Milestone B", "B", "Milestone B decision", "AO-approved RMF strategy on file", [], "Formal program start: detailed engineering and manufacturing development is authorized."],
    ["ssp", 2, "rmf", "SSP", "SSP", "Develop the SSP", "SSP baselined in the authorization package", [], "Implementation statements say how the hardware and software meet each control; the AO approves the plan and the SCA reviews it."],
    ["cdr", 2, "rev", "CDR", "CDR", "CDR · Critical design review", "SCA assessment of the SSP: design must support selected controls", [], "The detailed design is mature and stable, 75 to 90% of drawings, and ready for fabrication."],
    ["trr", 3, "rev", "TRR", "TRR", "TRR · Test readiness review", "IATT prerequisites: scans and safety checks complete", ["IN.5"], "The system, facilities and safety protocols are ready for formal developmental test."],
    ["iatt", 3, "rmf", "IATT", "IATT", "IATT · Interim authority to test", "Signed IATT memo with expiry", [], "A time-bound AO approval to connect the system to a government test range or network."],
    ["svr", 3, "rev", "SVR", "SVR", "SVR · System verification review", "Control verification results recorded", ["VE.3", "VE.5"], "The physical system is verified against its design specifications."],
    ["prr", 3, "rev", "PRR", "PRR", "PRR · Production readiness review", "Supply-chain risk controls (SR family) assessed", ["AQ.4"], "The manufacturing line is audited for its ability to produce at scale."],
    ["sar", 4, "rmf", "SAR", "SAR", "Final assessment and SAR", "SAR delivered with risk recommendation to the AO", ["VA.7"], "Independent penetration test, code analysis and scans; the SCA issues the security assessment report with a risk recommendation."],
    ["ms-c", 4, "ms", "Milestone C", "C", "Milestone C decision", "SAR risk posture accepted", [], "Low-rate initial production is authorized."],
    ["ato", 4, "rmf", "ATO", "ATO", "ATO · Authority to operate", "ATO memo with POA&M and expiry date", ["RM.6"], "The AO signs the ATO memo, accepting the residual cybersecurity risk."],
    ["ioc", 4, "op", "IOC", "IOC", "IOC · Initial operational capability", "ConMon plan and cATO pipeline controls active", ["TR.7", "OP.5"], "The first units reach operational squadrons and continuous monitoring begins."],
  ];
  const OUT = {
    "BA.4": ["Alternative solution class(es) that consider(s) identified security aspects is/are analyzed.", "Business or Mission Analysis"],
    "BA.5": ["Selection of the preferred alternative solution class(es) is informed by the security aspects of the solution space.", "Business or Mission Analysis"],
    "SN.4": ["Stakeholder assets and asset classes are identified.", "Stakeholder Needs and Requirements Definition"],
    "SR.1": ["Security aspects of the system description – including system interfaces, functions, and boundaries for a system solution – are defined.", "System Requirements Definition"],
    "SR.2": ["Security-relevant system requirements and security-driven design constraints are defined.", "System Requirements Definition"],
    "SR.4": ["Security aspects of the system requirements are analyzed.", "System Requirements Definition"],
    "RM.3": ["Security-relevant risk treatments are selected.", "Risk Management"],
    "IN.5": ["Security aspects of system external interfaces (system to external environment) and system internal interfaces (between implemented system elements) are checked.", "Integration"],
    "VE.3": ["Security aspects of the system, system element, or artifact are verified.", "Verification"],
    "VE.5": ["Objective evidence that the realized system fulfills the security requirements and security aspects of the architecture and design is provided.", "Verification"],
    "AQ.4": ["A product or service that complies with the security criteria in the agreement is accepted.", "Acquisition"],
    "VA.7": ["Objective evidence of the successful validation of security aspects is provided.", "Validation"],
    "RM.6": ["Security-relevant risks are recorded and maintained in the risk profile.", "Risk Management"],
    "TR.7": ["The installed system is activated and ready for trustworthy secure operation.", "Transition"],
    "OP.5": ["Security aspects of system performance during operation are monitored.", "Operation"],
  };
  const GATE0 = {
    pdr: [["AR.4", "Identified stakeholder protection concerns are addressed by the system architecture.", "System Architecture Definition"], ["AR.5", "Traceability of the security aspects of system architecture elements to key architecturally relevant stakeholder and system requirements is established.", "System Architecture Definition"], ["AR.7", "Security aspects of system elements, their interactions, and their interfaces are defined.", "System Architecture Definition"], ["SR.6", "Traceability of the security aspects of system requirements and associated security-relevant constraints to stakeholder requirements is established.", "System Requirements Definition"]],
    cdr: [["DE.2", "System requirements are allocated to address their security aspects.", "Design Definition"], ["DE.3", "Security interfaces and security aspects of interfaces between system elements composing the system are defined.", "Design Definition"], ["DE.4", "Security design characteristics of each system element are defined.", "Design Definition"], ["DE.6", "Traceability of security design characteristics is established.", "Design Definition"]],
  };
  // Who holds each step. The SCA reviews the baseline and the plan; the AO (or the AODR) decides them [B27].
  const WHO = { ce: ["Marcus Ryde", "Chief engineer"], mda: ["R. Feldman", "Milestone decision authority"], issm: ["Joel Barrantes", "ISSM"], sca: ["D. Okafor", "Lead assessor (SCA)"], ao: ["R. Calloway", "Authorizing official"], aodr: ["Lena Marsh", "AODR"], pm: ["Ray Colston", "Program manager"] };
  const CHAIN = { rev: ["ce"], ms: ["mda"], op: ["pm"], cat: ["issm", "ao"], sel: ["issm", "sca", "ao"], strat: ["issm", "ao"], ssp: ["issm", "sca", "ao"], iatt: ["issm", "sca", "ao"], sar: ["sca", "ao"], ato: ["issm", "sca", "ao"] };
  const PEOPLE = [["Marcus Ryde", "Chief engineer"], ["R. Feldman", "Milestone decision authority"], ["Ray Colston", "Program manager"], ["Joel Barrantes", "ISSM"], ["Priya Raghavan", "ISSO"], ["D. Okafor", "Lead assessor (SCA)"], ["R. Calloway", "Authorizing official"], ["Lena Marsh", "AODR"], [ME, "Security engineer"], ["Victor Amsel", "Engineer"], ["Wes Duarte", "Test lead"]];
  const roleOfName = (n) => (PEOPLE.find((p) => p[0] === n) || [n, ""])[1];

  const COND1 = [
    ["Close the high-severity remediation items within 90 days", "2026-12-17", "Priya Raghavan"],
    ["Complete the expanded control set assessment", "2026-11-20", "D. Okafor"],
    ["Report the SA-24 design review at the annual authorization review", "2027-09-18", ME],
  ];
  const WS = [
    { n: 1, name: "Increment 1 · Block 1", state: "Fielded", steps: {
      asr: { at: "2023-03-14" }, "ms-a": { at: "2023-05-02" }, cat: { at: "2023-06-20" }, srr: { at: "2023-10-10" }, sfr: { at: "2024-01-23" }, sel: { at: "2024-03-05" },
      pdr: { at: "2024-06-11" }, strat: { at: "2024-07-30" }, "ms-b": { at: "2024-09-24" }, ssp: { at: "2024-11-19" }, cdr: { at: "2025-02-11" },
      trr: { at: "2025-10-21" }, iatt: { at: "2025-11-18" }, svr: { at: "2026-04-21" }, prr: { at: "2026-06-09" },
      sar: { at: "2026-08-28" }, "ms-c": { at: "2026-09-10" }, ato: { at: "2026-09-18", o: "cond", c: COND1.map((x) => x[0]).join("; ") }, ioc: { at: "2026-10-15" } } },
    { n: 2, name: "Increment 2 · Block 1.1", state: "In development", steps: {
      asr: { skip: "Not required for Increment 2: Block 1's materiel solution carries over." },
      "ms-a": { skip: "Not required for Increment 2: the program passed Milestone A with Increment 1." },
      cat: { at: "2026-09-02" }, srr: { at: "2026-09-22" }, sfr: { at: "2026-10-13" }, sel: { at: "2026-10-27" },
      pdr: { due: "2026-11-24", req: { at: "2026-11-10", by: "Ray Colston" } }, strat: { due: "2026-12-15" }, "ms-b": { due: "2027-01-26" }, ssp: { due: "2027-02-23" },
      cdr: { due: "2027-03-23" }, trr: { due: "2027-04-27" }, iatt: { due: "2027-05-18" }, svr: { due: "2027-08-17" },
      prr: { skip: "Not required for Increment 2: Block 1.1 changes software and configuration on fielded hardware, so no production line is new." },
      sar: { due: "2027-09-14" }, "ms-c": { skip: "Not required for Increment 2: Block 1.1 is fielded under Block 1's Milestone C." }, ato: { due: "2027-10-26" }, ioc: { due: "2027-12-07" } } },
  ];
  const OFF = [30, 75, 110, 200, 290, 340, 450, 500, 560, 650, 740, 900, 930, 1080, 1140, 1240, 1270, 1290, 1330];
  const NAMES = { "PRG-1090": "WS-X90 Sentinel Mission System" };

  // ════════════════ Programs and their tracks (WS-X90's increments; a created program's Increment 1) ════════════════
  const H = () => PA.v2hubs;
  const curCode = () => (H() ? H().cur() : WSX);
  const madeOne = (code) => (H() && H().madeOne ? H().madeOne(code) : null);
  const nameOf = (code) => NAMES[code] || ((madeOne(code) || {}).name) || code;
  const mk = (prog, n, i, extra) => {
    const [key, ph, kind, line, tick, name, crit, outs, desc] = T[i];
    return Object.assign({ id: `${key}-${n}`, key, i, n, prog, ph, kind, line, tick, name, crit, outs, desc }, extra || {});
  };
  let CACHE = null;
  V.on(() => { CACHE = null; });
  function tracks(code) {
    if (!code) return null;
    if (CACHE && CACHE[code]) return CACHE[code];
    let ts = null;
    if (code === WSX) ts = WS.map((inc) => ({ n: inc.n, name: inc.name, state: inc.state, steps: T.map((t, i) => mk(WSX, inc.n, i, inc.steps[t[0]])) }));
    else if (madeOne(code)) { const at = String(madeOne(code).at || ""), from = /^\d{4}-\d{2}-\d{2}/.test(at) ? at.slice(0, 10) : TODAY_ISO; ts = [{ n: 1, name: "Increment 1", state: "Planned", made: true, steps: T.map((t, i) => mk(code, 1, i, { due: addDays(from, OFF[i]) })) }]; }
    CACHE = CACHE || {};
    CACHE[code] = ts;
    return ts;
  }
  const allSteps = (code) => (tracks(code) || []).flatMap((t) => t.steps);
  const key2 = (st) => `${st.prog}.${st.id}`.replace(/[^A-Za-z0-9_.:-]/g, "_");
  const ref = (st) => `${st.prog}|${st.id}`;
  const byRef = (rf) => { const [prog, id] = String(rf || "").split("|"); return allSteps(prog).find((s) => s.id === id) || null; };
  function find(id) {
    id = String(id || "");
    if (id.includes("|")) return byRef(id);
    if (id === "pdr" || id === "cdr") id += "-2";
    if (id.includes(":")) return null;
    return allSteps(curCode()).find((s) => s.id === id) || allSteps(WSX).find((s) => s.id === id) || null;
  }
  const stepOf = (prog, id) => allSteps(prog).find((s) => s.id === id) || null;
  const named = (st) => st.prog === WSX;
  const pageOf = (st) => !!st && (st.prog === WSX || !!madeOne(st.prog));
  const titleOf = (st) => st.name;

  // ════════════════ Requests, steps and decisions ════════════════
  const reqOf = (st) => G("req." + key2(st), null);
  const stepsOf = (st) => G("steps." + key2(st), []) || [];
  function chainOf(st) {
    const keys = CHAIN[st.key] || CHAIN[st.kind] || ["pm"], q = reqOf(st);
    return keys.map((k, i) => {
      const nm = q && q.names && q.names[i];
      const last = i === keys.length - 1;
      return { k, who: nm ? nm[0] : named(st) ? WHO[k][0] : null, role: nm ? nm[1] : WHO[k][1], last, reviews: !last && k === "sca" && (st.key === "sel" || st.key === "ssp") };
    });
  }
  const holderName = (c) => c.who || c.role;
  function decision(st) {
    if (!st || st.skip) return null;
    const u = V.get("life.dec." + key2(st));
    if (u !== undefined) return u || null;
    if (!st.at) return null;
    const c = chainOf(st), last = c[c.length - 1];
    return { o: st.o || "yes", c: st.c || "", at: st.at, by: holderName(last), seed: true };
  }
  function request(st) {
    if (!st || st.skip) return null;
    const u = V.get("life.req." + key2(st));
    if (u !== undefined) return u || null;
    return st.req || null;
  }
  const STW = { not_started: "Not started", in_progress: "In progress", in_review: "In review", at_risk: "At risk", blocked: "Blocked", failed: "Failed", completed: "Completed", passed: "Passed", passed_cond: "Passed with conditions", waived: "Waived" };
  const STK = { not_started: "none", in_progress: "none", in_review: "none", at_risk: "warn", blocked: "bad", failed: "bad", completed: "ok", passed: "ok", passed_cond: "warn", waived: "none" };
  const sspState = () => (H() && H().ssp ? H().ssp() : "draft");
  function status(st) {
    if (st.skip) return "waived";
    const d = decision(st);
    if (d) return d.o === "no" ? "failed" : d.o === "cond" ? "passed_cond" : st.kind === "rmf" || st.kind === "op" ? "completed" : "passed";
    if (request(st)) return "in_review";
    if (st.prog === WSX && st.id === "ssp-2") return "in_progress"; // SSP revision 3 is being written [B14]
    return "not_started";
  }
  const DONE = new Set(["passed", "passed_cond", "completed", "waived"]);
  const done = (st) => DONE.has(status(st));
  const stPill = (st) => pill(STK[status(st)], STW[status(st)]);
  const dueOf = (st) => { const d = decision(st); return d ? d.at : st.due || st.at || null; };
  const curTrack = (ts) => (ts || []).find((t) => t.steps.some((s) => !done(s))) || (ts || [])[(ts || []).length - 1] || null;
  const nextOf = (t) => (t ? t.steps.find((s) => !done(s)) || null : null);

  // ════════════════ Deliverables: each reads its record; a decision never changes one [B01 B02 B12 B14 B26] ════════════════
  const PK = { asr: "ASR package", "ms-a": "MS-A package", srr: "SRR package", sfr: "SFR package", pdr: "PDR package", strat: "RMF strategy memo", "ms-b": "MS-B package", cdr: "CDR package", trr: "TRR package", iatt: "IATT memo", svr: "SVR package", prr: "PRR package" };
  const MEMO = new Set(["strat", "iatt"]);
  const docOwner = (st) => (st.kind === "ms" ? "Ray Colston" : MEMO.has(st.key) ? "Joel Barrantes" : "Marcus Ryde");
  // Control status counts come from lane F's store (PA.v3.fact("controls")), else the chain's.
  const noReq = () => { const f = X.fact("controls", WSX); if (f && f.no_requirement != null) return Math.max(0, f.no_requirement); try { const c = CH.counts && CH.counts(); return c && c.no_requirement != null ? Math.max(0, c.no_requirement) : 14; } catch (e) { return 14; } };
  const placeholders = () => { try { return PA.SSP.counts.placeholders; } catch (e) { return 74; } };
  function icState() {
    const L = PA.v8bIC || [];
    const ex = L.filter((x) => x.agr && x.agr.st === "Expired"), un = L.filter((x) => x.agr && x.agr.st === "Draft");
    return { ex, un, names: ex.concat(un).map((x) => x.name) };
  }
  const bndRev = () => G("bnd", null);
  function dls(st) {
    if (st.skip) return [];
    const k = st.key, n = st.n, d = decision(st), seed = !!(d && d.seed);
    const R = (t, r, own, ok, w, extra) => Object.assign({ t, r, own, ok: !!ok, w }, extra || {});
    const pkg = !PK[k] ? [] : MEMO.has(k)
      ? [{ t: PK[k], doc: ref(st), own: docOwner(st), out: true, ok: !!(d && d.o !== "no"), w: d && d.o !== "no" ? `Signed ${md(d.at)} with the decision` : "Draft · signed with the decision" }]
      : [{ t: PK[k], doc: ref(st), own: docOwner(st), ok: seed || (st.prog === WSX && st.id === "pdr-2"), w: seed ? `Approved ${md(d.at)}` : st.prog === WSX && st.id === "pdr-2" ? "Submitted Nov 10" : "Not submitted" }];
    if (st.prog !== WSX) { // a created program: its own records, nothing recorded against them yet
      const own = { cat: ["ITCSC", "itcsc"], srr: ["Requirements", "requirements"], sel: ["Baseline", "baseline"], ssp: ["SSP revision 1", "ssp"], sar: ["Assessment campaign", "assessments"], ato: ["Authorization decision", "authorization"], ioc: ["Continuous monitoring", "conmon"] }[k];
      return pkg.concat(own ? [R(own[0], own[1], null, false, "Not recorded", k === "ato" ? { out: true, w: "Recorded with the decision" } : null)] : []);
    }
    if (seed) { // decided before this session: the records it was decided on
      const L = {
        cat: [R("ITCSC", "itcsc", "Priya Raghavan", true, n === 1 ? "Version 1, signed Jun 20, 2023" : "Version 3, signed Sep 2")],
        srr: [R("Requirements", "requirements", ME, true, "Traced into the specification")],
        sfr: [R(n === 1 ? "Block 1 configuration" : "Block 1.1 configuration", "composition-config", "Marcus Ryde", true, n === 1 ? "Published Jul 20" : "Proposed")],
        sel: [R("Baseline", "baseline", ME, true, "Approved by the AO, reviewed by the SCA")],
        pdr: [R("Boundary", "boundary", "Priya Raghavan", true, "Reviewed by the SCA")],
        ssp: [R("SSP revision 1", "ssp-history", "Priya Raghavan", true, "Superseded by revision 2")],
        cdr: [R("SCTM workbook", "sctm", ME, true, "Current")],
        trr: [R("STIG checklists", "stigs", "Joel Barrantes", true, "Scanned"), R("Ports & protocols", "ppsm", "Priya Raghavan", true, "Registered")],
        iatt: [R("Test configuration", "boundary", "Priya Raghavan", true, "Developmental test article")],
        svr: [R("Cyber T&E event", "cyber-te", "Wes Duarte", true, "Results recorded")],
        prr: [R("Suppliers and SBOMs", "suppliers", "Marcus Ryde", true, "SR family assessed")],
        sar: [R("Initial Authorization Security Assessment", "assessments-completed", "D. Okafor", true, "Completed Aug 21"), R("Security assessment report", "assessments-completed", "D. Okafor", true, "Published Aug 28 · recommends authorization with conditions")],
        "ms-c": [R("Security assessment report", "assessments-completed", "D. Okafor", true, "Published Aug 28")],
        ato: [R("Authorization decision", "authorization", "R. Calloway", true, "ATO with conditions, Sep 18", { out: true }), R("POA&M", "poam", "Priya Raghavan", true, "In the package"), R("Package version 1", "authorization", "Priya Raghavan", true, "Published Sep 2")],
        ioc: [R("Continuous monitoring", "conmon", "Joel Barrantes", true, "Active")],
      };
      return pkg.concat(L[k] || []);
    }
    const nr = noReq(), s3 = sspState(), ic = icState(), b = bndRev(), rec = G("rec." + safe(WSX) + ".sar-" + n, null);
    const rev3 = () => R("SSP revision 3", "ssp", "Priya Raghavan", s3 === "approved", { draft: `In progress · draft, ${plural(placeholders(), "placeholder narrative")}`, submitted: "In review with the ISSM", approved: "Approved", changes: "Changes requested by the ISSM" }[s3] || "In progress · draft");
    const bnd = R("Boundary", "boundary-block-1-1", "Priya Raghavan", !!(b && b.state === "accepted"), !b ? "SCA review not requested" : b.state === "requested" ? `SCA review requested ${md(b.at)}` : b.state === "accepted" ? `Reviewed by the SCA ${md(b.at)}` : "The SCA asked for changes");
    const icBad = ic.ex.length + ic.un.length;
    const L = {
      pdr: [R("Requirements", "sctm", ME, nr === 0, nr === 0 ? "Every control traced" : `${plural(nr, "control")} with no requirement`, nr ? { go: ["sctm", { view: "noreq" }] } : null),
        R("SCTM workbook", "sctm", ME, true, "Current"),
        R("Interconnections", "interconnections", "Priya Raghavan", !icBad, icBad ? [ic.ex.length ? `${ic.ex.length} expired` : "", ic.un.length ? `${ic.un.length} unsigned` : ""].filter(Boolean).join(" · ") : "Agreements current", icBad ? { go: ["interconnections", { rows: ic.names, note: "Showing the agreements PDR waits on" }] } : null),
        bnd],
      ssp: [rev3()],
      cdr: [R("SCTM workbook", "sctm", ME, true, "Current"), rev3()],
      trr: [R("STIG checklists", "stigs", "Joel Barrantes", false, "Block 1.1 not scanned"), R("Ports & protocols", "ppsm", "Priya Raghavan", false, "Block 1.1 changes not registered")],
      iatt: [rev3(), R("Test configuration", "boundary-iatt", "Priya Raghavan", false, "Not reviewed by the SCA")],
      svr: [R("Cyber T&E · CVI FY2027", "cyber-te", "Wes Duarte", false, "Planned Jan 11")],
      sar: [R("Assessment campaign · Increment 2", "assessments", "D. Okafor", false, "Not planned"), R("Security assessment report", "assessments", "D. Okafor", false, "Not started")],
      ato: [R("Authorization decision", "authorization", "R. Calloway", !!(d && d.o !== "no"), d && d.o !== "no" ? `Recorded ${md(d.at)}` : "Recorded with the decision", { out: true }), R("POA&M", "poam", "Priya Raghavan", true, `${fmt(poamN())} items, current`), R("SCA's risk recommendation", `lifecycle-sar-${n}`, "D. Okafor", !!rec, rec ? REC_W[rec.rec] : "Not recorded")],
      ioc: [R("Continuous monitoring", "conmon", "Joel Barrantes", false, "Not started for Increment 2")],
    };
    return pkg.concat(L[k] || []);
  }
  const inputs = (st) => dls(st).filter((x) => !x.out);
  const readyOf = (st) => { const l = inputs(st); return { ready: l.filter((x) => x.ok).length, total: l.length }; };

  // ════════════════ Security outcomes: one status per outcome per increment [B13 C01] ════════════════
  const SSE_KEYS = ["srr", "pdr", "ms-b", "cdr", "trr", "svr"];
  const G2S = { check: "met", clock: "part", part: "part", diamond: "not", ring: "na" };
  const OS = { met: ["ok", "Met"], part: ["warn", "Partly met"], not: ["bad", "Not met"], na: ["none", "Not assessed"] };
  const OG = { met: "check", part: "clock", not: "diamond", na: "ring", out: "ring" };
  const TXT = {};
  function sseList(key) { // the outcomes Security engineering placed under Increment 2's review, as recorded
    try {
      if ((key === "pdr" || key === "cdr") && PA.lifeGates) { const l = PA.lifeGates.crit(key, true); if (l && l.length) return l.map(([code, t, proc, g]) => { TXT[code] = [t, proc]; return { code, t, proc, s: G2S[g] || "na" }; }); }
      if (PA.sseOutcomes) { const l = PA.sseOutcomes(key); if (l && l.length) return l.map(([code, t, proc, g]) => { TXT[code] = [t, proc]; return { code, t, proc, s: G2S[g] || "na" }; }); }
    } catch (e) { /* the template's outcomes stand */ }
    return null;
  }
  // Increment 2's status before this session: the latest review that assessed it, else Met where a step decided before this session
  // carries it, else Not assessed.
  function base2(code) {
    let s = null;
    for (const k of SSE_KEYS) { const l = sseList(k), x = l && l.find((y) => y.code === code); if (x && x.s !== "na") s = x.s; }
    if (s) return s;
    for (const t of T) if (t[7].includes(code) && WS[1].steps[t[0]] && WS[1].steps[t[0]].at) return "met";
    return "na";
  }
  function outcome(code, n) {
    const u = G(`out.${n}.${safe(code)}`, null);
    if (u && u.s) return u.s;
    return n === 1 ? "met" : base2(code);
  }
  const textOf = (code) => (OUT[code] || TXT[code] || [code, ""])[0];
  const procOf = (code) => (OUT[code] || TXT[code] || ["", ""])[1];
  function outcomesOf(st) { // the outcome codes a step carries
    if (st.key === "pdr" || st.key === "cdr") { const l = (PA.lifeGates && PA.lifeGates.crit(st.key, st.prog === WSX && st.n === 2)) || GATE0[st.key]; l.forEach(([c, t, p]) => { TXT[c] = TXT[c] || [t, p]; }); return l.map((x) => x[0]); }
    if (st.prog === WSX && st.n === 2 && ["srr", "ms-b", "trr", "svr"].includes(st.key)) { const l = sseList(st.key); if (l) return l.map((x) => x.code); }
    return st.outs;
  }
  // The step's cyber criterion: some are the decision's own record (a signed memo, the SAR's recommendation, the ATO memo).
  function cyber(st) {
    if (st.key === "pdr" || st.key === "cdr") return null; // their criteria are the outcomes they carry (v2's rule)
    const d = decision(st), seed = !!(d && d.seed), base = { code: null, t: st.crit, proc: "Cyber criterion" };
    if (MEMO.has(st.key) || st.key === "ato" || st.key === "sar") return Object.assign(base, { out: true, proc: "Recorded with the decision", s: d && d.o !== "no" ? "met" : "out" });
    if (seed) return Object.assign(base, { s: "met" });
    if (st.prog !== WSX) return Object.assign(base, { s: "na" });
    if (st.key === "ms-b") { const sd = decision(stepOf(st.prog, "strat-" + st.n)); return Object.assign(base, { proc: "Reads the RMF strategy's decision", s: sd && sd.o !== "no" ? "met" : "na" }); }
    if (st.key === "ssp") return Object.assign(base, { proc: "Reads SSP revision 3's approval", s: sspState() === "approved" ? "met" : "na" });
    const u = G("crit." + key2(st), null);
    return Object.assign(base, { s: u && u.s ? u.s : "na" });
  }
  function crit(st) {
    if (st.skip) return [];
    const d = decision(st), seed = !!(d && d.seed), W = st.prog === WSX;
    const list = [];
    const cy = cyber(st); if (cy) list.push(cy);
    for (const c of outcomesOf(st)) list.push({ code: c, t: textOf(c), proc: procOf(c), s: W ? outcome(c, st.n) : seed ? "met" : "na" });
    return list;
  }
  const critIn = (st) => crit(st).filter((c) => !c.out);
  const metOf = (st) => { const l = critIn(st); return { met: l.filter((c) => c.s === "met").length, total: l.length }; };
  const openOf = (st) => ({ dl: inputs(st).filter((x) => !x.ok), cr: critIn(st).filter((c) => c.s !== "met") });

  // ════════════════ Conditions: tracked with an owner and a due day until closed [B10] ════════════════
  const REC_W = { auth: "Recommends authorization", authc: "Recommends authorization with conditions", deny: "Recommends denial" };
  const highOpen = () => {
    const f = X.fact("issues", WSX);
    if (f && f.bySev && f.bySev.high != null) return f.bySev.high;
    try { return 12 + CH.issues().filter((i) => i.sev === "high" && !i.closed).length; } catch (e) { return 12; }
  };
  const poamN = () => {
    const f = X.fact("poam", WSX);
    if (f && f.items != null) return f.items;
    try { return 41 + CH.poams().length; } catch (e) { return 41; }
  };
  function conds(prog) {
    const out = [];
    if (prog === WSX) COND1.forEach(([t, due, owner], i) => out.push({ id: `ato1-${i + 1}`, step: "ato-1", t, due, owner, at: "2026-09-18", seed: true }));
    const all = G("cond." + safe(prog), {}) || {};
    for (const [sid, list] of Object.entries(all)) for (const c of list || []) out.push(Object.assign({ step: sid }, c));
    return out.map((c) => {
      const x = G("condx." + safe(c.id), null);
      let closed = x ? Object.assign({ how: "" }, x) : null;
      if (!closed && c.id === "ato1-2") { const i2 = CH.inc2 && CH.inc2(); if (i2) closed = { at: i2.at, by: i2.by || "D. Okafor", how: `${i2.title || "The expanded control set's increment 2 results"} published` }; }
      const progress = c.id === "ato1-1" ? `${plural(highOpen(), "high issue")} open` : c.id === "ato1-2" ? "The campaign ends Nov 20" : c.id === "ato1-3" ? "Annual review" : "";
      return Object.assign({}, c, { prog, closed, progress });
    });
  }
  const condById = (id) => { for (const prog of [WSX].concat(((H() && H().made()) || []).map((d) => d.code))) { const c = conds(prog).find((x) => x.id === id); if (c) return c; } return null; };
  const condsOfStep = (st) => conds(st.prog).filter((c) => c.step === st.id);
  const condRow = (c, withGate) => {
    const st = stepOf(c.prog, c.step);
    return `<div class="v3g-cnd${c.closed ? " done" : ""}" role="button" tabindex="0" data-panel="v3g-cond" data-id="${esc(c.id)}">${gl(c.closed ? "check" : "clock")}<span class="x"><b>${esc(c.t)}</b><span class="v2g-mu">${esc([withGate && st ? `${st.line}${st.prog === WSX ? ` · Increment ${st.n}` : ""}` : "", c.closed ? `Closed ${md(c.closed.at)}` : c.progress].filter(Boolean).join(" · "))}</span></span>${AK.owner(c.owner || null)}${c.closed ? mu("Closed") : AK.due(c.due, { prefix: false })}</div>`;
  };

  // ════════════════ Authorization records: one per decision, written by the IATT and ATO steps [B06 B09 C05] ════════════════
  const AUTH_SEED = [
    { id: "iatt-1", inc: 1, type: "IATT", decided: "2025-11-18", by: "R. Calloway", atd: "2026-08-31", scope: "Increment 1 test configuration: the Block 1 developmental test article", conditions: [] },
    { id: "ato-1", inc: 1, type: "ATO with conditions", decided: "2026-09-18", by: "R. Calloway", atd: "2029-09-17", scope: "Increment 1 · Block 1, the six subsystems as fielded", conditions: COND1.map((x) => x[0]) },
  ];
  function authorizations(prog) {
    prog = prog || WSX;
    if (prog !== WSX) return Object.entries(G("auth." + safe(prog), {}) || {}).map(([id, a]) => Object.assign({ id, inc: 1 }, a));
    const out = AUTH_SEED.map((a) => Object.assign({}, a));
    for (const id of ["iatt-2", "ato-2"]) {
      const st = stepOf(WSX, id), a = G("auth." + safe(WSX) + "." + id, null), d = decision(st);
      if (a && d) out.push(Object.assign({ id, inc: 2 }, a));
      else out.push({ id, inc: 2, type: id.startsWith("iatt") ? "IATT" : "ATO", decided: null, planned: st.due, by: null, atd: null, scope: id.startsWith("iatt") ? "Increment 2 test configuration: Block 1.1 and the flight test instrumentation" : "Increment 2 · Block 1.1", conditions: [], state: status(st) });
    }
    return out;
  }
  const authOf = (id) => authorizations(WSX).find((a) => a.id === id) || null;

  // ════════════════ Drawing: the strip, the rows, the lists ════════════════
  const panelOf = () => "a-work-gate";
  function todayAt(t) {
    const N = t.steps.length, pts = t.steps.map((s, i) => [i, dueOf(s)]).filter((p) => p[1]);
    if (!pts.length) return null;
    let a = null, b = null;
    for (const p of pts) { if (p[1] <= TODAY_ISO) a = p; else if (!b) b = p; }
    const x = !a ? 0 : !b ? N : a[0] + 0.5 + ((dt(TODAY_ISO) - dt(a[1])) / (dt(b[1]) - dt(a[1]))) * (b[0] - a[0]);
    return Math.max(0, Math.min(100, (x / N) * 100));
  }
  function strip(t) {
    const nx = nextOf(t);
    const phs = PH.map(([sh, long], p) => {
      const list = t.steps.filter((s) => s.ph === p);
      const state = list.every(done) ? "done" : nx && nx.ph === p ? "on" : "todo";
      return `<span class="v2g-sph ${state}" style="flex:${list.length}" title="${esc(long)}"><b>${esc(sh)}</b><span>${esc(long)}</span></span>`;
    }).join("");
    const marks = t.steps.map((s) => {
      const stt = status(s), cls = `${s.kind === "ms" ? "ms" : ""} ${stt === "waived" ? "skip" : done(s) ? "done" : s === nx ? "on" : "todo"}`;
      const label = `${titleOf(s)}, ${STW[stt]}${dueOf(s) && stt !== "waived" ? `, ${done(s) ? "decided" : "due"} ${md(dueOf(s))}` : ""}`;
      return `<button type="button" class="v2g-mk ${cls}" data-panel="a-work-gate" data-id="${esc(ref(s))}" aria-label="${esc(label)}" title="${esc(label)}"><i aria-hidden="true"></i><span class="v2g-mkl" aria-hidden="true">${esc(s.tick)}</span></button>`;
    }).join("");
    const N = t.steps.length, x = todayAt(t), p = nx ? ((nx.i + 0.5) / N) * 100 : 100;
    const today = x == null ? "" : `<span class="v2g-today${x > 80 ? " end" : ""}" style="left:${x.toFixed(1)}%" aria-hidden="true"><span>Today</span></span>`;
    return `<div class="v2g-strip" role="group" aria-label="${esc(`${t.name || "Lifecycle"}: phases and steps`)}"><span class="v2g-sphs">${phs}</span><span class="v2g-mks"><span class="v2g-prog" style="width:${p.toFixed(1)}%" aria-hidden="true"></span>${marks}${today}</span></div>`;
  }
  const dot = (d) => `<i class="v2g-dot${d.ok ? " ok" : ""}${d.out ? " v3g-out" : ""}" aria-hidden="true"></i><span class="v2-sr">${d.out ? "Recorded with the decision: " : d.ok ? "Ready: " : "Not ready: "}</span>`;
  function dlLink(d, st) {
    const cls = `v2g-dl${d.ok ? " ok" : ""}`;
    if (d.doc) return `<button type="button" class="${cls}" data-panel="v2g-doc" data-id="${esc(d.doc)}">${dot(d)}${esc(d.t)}</button>`;
    if (d.go && has(d.go[0])) return `<a class="${cls}" href="#${esc(d.go[0])}" ${goQ(d.go[0], d.go[1])} data-v2prog="${esc(st.prog)}">${dot(d)}${esc(d.t)}</a>`;
    if (d.r && has(d.r)) return `<a class="${cls}" href="#${esc(d.r)}" data-v2prog="${esc(st.prog)}">${dot(d)}${esc(d.t)}</a>`;
    return `<span class="${cls}">${dot(d)}${esc(d.t)}</span>`;
  }
  function dueCell(st) {
    if (st.skip) return mu(st.prog === WSX ? `Not required for Increment ${st.n}` : "Not required");
    const d = decision(st);
    if (d) return mu(`Decided ${md(d.at)}`);
    return st.due ? AK.due(st.due, { prefix: true }) : DASH;
  }
  const rowsHead = `<div class="v2g-rh" aria-hidden="true"><span>Step</span><span>Kind</span><span>Due or decided</span><span>Status</span><span>Deliverables</span><span>Criteria</span></div>`;
  function row(st, on2) {
    const dl = dls(st), m = metOf(st);
    return `<div class="v2g-row${on2 ? " on" : ""}${st.skip ? " skip" : ""}" role="listitem" data-panel="a-work-gate" data-id="${esc(ref(st))}">`
      + `<span class="v2g-c1"><button type="button" class="v2g-nm" data-panel="a-work-gate" data-id="${esc(ref(st))}">${esc(titleOf(st))}</button></span>`
      + `<span class="v2g-c2">${esc(KIND[st.kind])}</span><span class="v2g-c3">${dueCell(st)}</span><span class="v2g-c4">${stPill(st)}</span>`
      + `<span class="v2g-c5">${dl.length ? dl.map((d) => dlLink(d, st)).join("") : DASH}</span>`
      + `<span class="v2g-c6">${m.total ? `<span class="num">${m.met} of ${m.total}</span><span class="v2g-c6l"> criteria met</span>` : DASH}</span></div>`;
  }
  function phases(t) {
    const nx = nextOf(t), curPh = nx ? nx.ph : PH.length - 1;
    return `<div class="v2g-phases">${PH.map(([sh, long], p) => {
      const list = t.steps.filter((s) => s.ph === p), live = list.filter((s) => !s.skip), dn = live.filter(done).length, skip = list.length - live.length;
      return `<details class="v2g-phase${p === curPh ? " on" : ""}"${p === curPh ? " open" : ""}><summary><span class="v2g-pht"><b>${esc(sh)}</b><span>${esc(long)}</span></span><span class="v2g-phc num">${dn} of ${live.length} done${skip ? ` · ${skip} not required` : ""}</span></summary><div class="v2g-rows" role="list" aria-label="${esc(long)}">${rowsHead}${list.map((s) => row(s, s === nx)).join("")}</div></details>`;
    }).join("")}</div>`;
  }
  const NOTE = "Increment dates, decisions, approvers and the review packages are illustrative; the 19 steps, their kinds and cyber criteria are the archive's template. Each deliverable and criterion reads its own record, so a decision never marks one ready.";
  const foot = () => `<p class="note-p v2g-note">${esc(NOTE)}</p>`;
  const viewTabs = (cur) => AK.tabs([["Steps", null, cur === "steps" ? null : "lifecycle", cur === "steps"], ["Security outcomes", allOutcomes().length, cur === "outcomes" ? null : "lifecycle-outcomes", cur === "outcomes"]], "Lifecycle views");

  // ════════════════ Lifecycle ════════════════
  const VIEW = {};
  document.addEventListener("click", (e) => {
    if (!on()) return;
    const b = e.target && e.target.closest ? e.target.closest("[data-v3g-inc]") : null; if (!b) return;
    e.preventDefault();
    VIEW[WSX] = +b.getAttribute("data-v3g-inc");
    V.redraw();
    const again = document.querySelector(`[data-v3g-inc="${b.getAttribute("data-v3g-inc")}"]`); if (again) again.focus();
  });
  function condSection(prog, n) {
    const list = conds(prog).filter((c) => !c.closed && (!n || (stepOf(prog, c.step) || {}).n === n));
    if (!list.length) return "";
    return AK.section("Open conditions", `<div class="v3g-cnds">${list.map((c) => condRow(c, true)).join("")}</div>`, { count: list.length });
  }
  function lifecyclePage() {
    const code = WSX, ts = tracks(code);
    const ct = curTrack(ts), t = ts.find((x) => x.n === VIEW[code]) || ct, nx = nextOf(t);
    const sw = `<div class="v2g-incsw" role="group" aria-label="Increment">${ts.map((x) => `<button type="button" class="v2g-inc${x === t ? " on" : ""}" aria-pressed="${x === t}" data-v3g-inc="${x.n}">${esc(x.name)} <small>${esc(x === ct ? "Current" : x.state)}</small></button>`).join("")}</div>`;
    const r = nx ? readyOf(nx) : null;
    const desc = `${esc(nameOf(code))} · ${esc(t.name || "")}${nx ? ` · next <span class="ak-link" role="link" tabindex="0" data-go="lifecycle-${esc(nx.id)}">${esc(nx.line)}</span>, ${nx.due ? md(nx.due) : ""}${r && r.total ? ` · ${r.ready} of ${r.total} deliverables ready` : ""}` : " · every step done"}`;
    return h.page(`<div class="v2g-life v3g-life">${AK.indexHead({ title: "Lifecycle", desc, actions: sw })}${viewTabs("steps")}${strip(t)}${condSection(code, t.n)}${phases(t)}${foot()}</div>`);
  }
  X.S("lifecycle", (orig) => (X.wsx() ? lifecyclePage() : orig()));
  for (const inc of WS) X.S(`lifecycle-increment-${inc.n}`, (orig) => { if (!X.wsx()) return orig(); VIEW[WSX] = inc.n; return lifecyclePage(); });

  // ════════════════ Lifecycle's Security outcomes: what Security engineering showed, read from the one store [C01 B13 B30] ════════
  const REVS = [["srr", "SRR", "System requirements review"], ["pdr", "PDR", "Preliminary design review"], ["ms-b", "Milestone B", "Engineering and manufacturing development decision"], ["cdr", "CDR", "Critical design review"], ["trr", "TRR", "Test readiness review"], ["svr", "SVR", "System verification review"]];
  function allOutcomes() {
    const out = [];
    for (const [k] of REVS) { const st = stepOf(WSX, k + "-2"); if (!st) continue; for (const c of outcomesOf(st)) out.push({ st, code: c }); }
    return out;
  }
  function outcomesPage() {
    const ts = tracks(WSX), t2 = ts[1];
    const cards = REVS.map(([k, short, long]) => {
      const st = stepOf(WSX, k + "-2"), cr = crit(st).filter((c) => c.code), met = cr.filter((c) => c.s === "met").length;
      return `<a class="v3g-rev" href="#lifecycle-${esc(st.id)}" title="${esc(long)}"><span class="k">${esc(short)}</span>${stPill(st)}<span class="d">${dueCell(st)}</span><span class="m num">${met} of ${cr.length} met</span></a>`;
    }).join("");
    const rows = [];
    for (const [k, short, long] of REVS) {
      const st = stepOf(WSX, k + "-2"), cr = crit(st).filter((c) => c.code);
      rows.push(`<tr class="v3g-grp"><td colspan="3"><a class="ak-link" href="#lifecycle-${esc(st.id)}">${esc(short)}</a> ${mu(esc(long))} ${mu("·")} ${stPill(st)} ${mu(`· ${cr.filter((c) => c.s === "met").length} of ${cr.length} met`)}</td></tr>`);
      for (const c of cr) rows.push(`<tr tabindex="0" data-panel="v3g-outcome" data-id="${esc(`2|${c.code}|${st.id}`)}"><td class="nm"><span class="v3g-oc">${h.tag(c.code)} ${esc(c.t)}</span></td><td>${esc(c.proc)}</td><td>${pill(...OS[c.s] || OS.na)}</td></tr>`);
    }
    const all = allOutcomes(), uniq = [...new Set(all.map((x) => x.code))], n = (s) => uniq.filter((c) => outcome(c, 2) === s).length;
    const band = `<p class="v3g-band num">${plural(uniq.length, "outcome")} at Increment 2's reviews · ${fmt(n("met"))} met · ${fmt(n("part"))} partly met · ${fmt(n("not"))} not met · ${fmt(n("na"))} not assessed</p>`;
    return h.page(`<div class="v2g-life v3g-life">${AK.indexHead({ title: "Lifecycle", desc: `${esc(nameOf(WSX))} · ${esc(t2.name)} · the NIST SP 800-160 Vol. 1 security outcomes each gate carries`, actions: `<span class="btn sm" role="button" tabindex="0" data-modal="v2f-outcomes" data-id="cdr">Add security outcomes</span>` })}${viewTabs("outcomes")}
      <div class="v3g-revs" role="group" aria-label="Increment 2's reviews, in order">${cards}</div>${band}
      <div class="frame"><div class="tablebox"><table class="v3g-otbl"><thead><tr><th>Security outcome</th><th>Process</th><th>Status</th></tr></thead><tbody>${rows.join("")}</tbody></table></div></div>
      <p class="note-p">Outcomes are NIST SP 800-160 Vol. 1 Rev. 1's, as printed. Each has one status for the increment, which every gate that carries it reads; a gate's decision never changes it. The statuses placed under each review are illustrative; the evidence titles are WS-X90's.</p></div>`);
  }
  X.screen("lifecycle-outcomes", () => (X.wsx() ? outcomesPage() : h.page(AK.indexHead({ title: "Lifecycle" }), AK.empty({ title: "No security outcomes yet", line: "Outcomes join the gates once the program records them." }))), "lifecycle");
  X.redirect("sse", "lifecycle-outcomes");
  X.P("v3g-outcome", (orig, id) => {
    const [n, code, sid] = String(id || "").split("|"), st = stepOf(WSX, sid), s = outcome(code, +n || 2), u = G(`out.${n}.${safe(code)}`, null);
    const where = allOutcomes().filter((x) => x.code === code).map((x) => x.st);
    const head = AK.recordHead({ title: textOf(code), chip: pill(...OS[s]) });
    const fx = AK.facts([["Outcome", h.tag(code)], ["Process", esc(procOf(code))], ["Increment", `Increment ${esc(n)}`], ["Recorded", u ? `${esc(md(u.at))} · ${esc(u.by)}` : mu("As Security engineering placed it")]]);
    const gates = AK.section("Gates that carry it", `<ul class="v2g-dls">${where.map((w) => `<li><a class="v2g-dl" href="#lifecycle-${esc(w.id)}">${esc(w.name)}</a><span class="v2g-dlw">${esc(STW[status(w)])}</span></li>`).join("")}</ul>`, { count: where.length });
    return { label: "Security outcome preview", body: `<div class="a-work-pan v2g-pan">${head}${fx}${gates}${st ? "" : ""}<p class="note-p">One status for Increment ${esc(n)}: each gate above reads it.</p></div>` };
  });

  // ════════════════ A gate's page and its preview ════════════════
  function actions(st, where) {
    if (st.skip || !pageOf(st)) return "";
    const s = status(st), sm = where === "page" ? "" : " sm";
    const out = (st.key === "pdr" || st.key === "cdr") && st.prog === WSX && st.n === 2 && !done(st) && where === "page" ? `<button type="button" class="btn" data-modal="v2f-outcomes" data-id="${st.key}">Add security outcomes</button>` : "";
    if (s === "in_review") { const c = chainOf(st), i = Math.min(stepsOf(st).length, c.length - 1); return `${out}<button type="button" class="btn ink${sm}" data-modal="v2g-decide" data-id="${esc(ref(st))}">${c.length > 1 ? `Record step ${i + 1} of ${c.length}` : "Record decision"}</button>`; }
    if (!done(st)) return `${out}<button type="button" class="btn ink${sm}" data-modal="v2g-request" data-id="${esc(ref(st))}">Request decision</button>`;
    return out;
  }
  function approval(st) {
    if (st.skip) return "";
    const c = chainOf(st), d = decision(st), q = request(st), recd = stepsOf(st);
    const steps = c.map((x, i) => {
      const r = recd[i];
      const state = d ? (d.o === "no" && i === c.length - 1 ? "changes" : "approved") : q ? (r ? "approved" : i === recd.length ? "sent" : "waiting") : "waiting";
      const when = d ? md((r && r.at) || d.at) : r ? md(r.at) : q && i === recd.length ? `${md(q.at)} · waiting ${Math.max(0, -days(q.at))} days` : "";
      return { label: c.length > 1 ? `Step ${i + 1}${x.reviews ? " · reviews" : x.last ? " · decides" : ""}` : "Decides", approvers: [{ who: holderName(x), role: x.who ? x.role : "Named when the decision is asked for", state, when }] };
    });
    const cur = c[Math.min(recd.length, c.length - 1)];
    const sub = d ? `Decided ${md(d.at)}` : q ? `Requested ${md(q.at)}${q.by ? ` by ${q.by}` : ""} · ${c.length > 1 ? `step ${Math.min(recd.length, c.length - 1) + 1} of ${c.length} waits on ${holderName(cur)}` : `waits on ${holderName(cur)}`}` : "Not requested yet";
    return AK.approval({ title: "Approval", sub, steps });
  }
  const DEC = { yes: "Approved", cond: "Approved with conditions", no: "Not approved" };
  function decWord(st, d) {
    if (st.key === "ato" || st.key === "iatt") { const a = st.prog === WSX ? authOf(st.id) : G("auth." + safe(st.prog) + "." + st.id, null); if (a && a.type && (a.decided || d.seed)) return a.type + (st.key === "iatt" && d.o === "cond" ? " with conditions" : ""); }
    return DEC[d.o];
  }
  function decisionBlock(st) {
    const d = decision(st);
    if (st.skip) return `<p class="v2g-p">${esc(st.skip)}</p>`;
    if (!d) {
      const q = request(st), c = chainOf(st), cur = c[Math.min(stepsOf(st).length, c.length - 1)];
      return `<p class="v2g-p">${mu("Not decided.")}${q ? ` ${esc(holderName(cur))} holds the current step.` : " Request decision names who holds each step."}</p>`;
    }
    const recd = stepsOf(st), last = recd[recd.length - 1], rec = d.rec || (last && last.rec);
    const a = st.key === "ato" || st.key === "iatt" ? (st.prog === WSX ? authOf(st.id) : G("auth." + safe(st.prog) + "." + st.id, null)) : null;
    const nC = condsOfStep(st).length;
    return `<dl class="ak-kv v2g-kv"><dt>Decision</dt><dd>${pill(d.o === "no" ? "bad" : d.o === "cond" ? "warn" : "ok", decWord(st, d))}</dd><dt>Decided by</dt><dd>${AK.owner(d.by)}</dd><dt>Decided on</dt><dd class="num">${esc(md(d.at))}</dd>${a && a.atd ? `<dt>ATD</dt><dd class="num">${esc(mdy(a.atd))}</dd>` : ""}${a && a.scope ? `<dt>Covers</dt><dd>${esc(a.scope)}</dd>` : ""}${nC ? `<dt>Conditions</dt><dd>${plural(nC, "condition")}, tracked below</dd>` : d.c && d.o === "no" ? `<dt>What must change</dt><dd>${esc(d.c)}</dd>` : ""}${rec && rec !== d.by ? `<dt>Recorded</dt><dd>By ${esc(rec)}, as ${esc(d.by)}</dd>` : ""}</dl>`;
  }
  function dlList(st) {
    const dl = dls(st);
    if (!dl.length) return mu(st.skip ? "None: the step is not required." : "None: the decision is the record.");
    return `<ul class="v2g-dls">${dl.map((d) => `<li class="${d.ok ? "ok" : ""}">${dlLink(d, st)}<span class="v2g-dlw">${esc(d.w)}</span>${d.own ? `<span class="v2g-dlo">${esc(d.own)}</span>` : ""}</li>`).join("")}</ul>`;
  }
  function critList(st) {
    const cr = crit(st);
    if (!cr.length) return mu("None: the step is not required.");
    return `<div class="a-work-crit v2g-crit">${cr.map((c) => `<div${c.code && st.prog === WSX ? ` class="v3g-crow" role="button" tabindex="0" data-panel="v3g-outcome" data-id="${esc(`${st.n}|${c.code}|${st.id}`)}"` : ""}>${gl(OG[c.s] || "ring")}<span><span>${esc(c.t)}</span><small>${c.code ? `${h.tag(c.code)} ` : ""}${esc(c.proc)}${c.code ? ` · ${esc((OS[c.s] || OS.na)[1])}` : c.out ? "" : ` · ${esc((OS[c.s] || OS.na)[1])}`}</small></span></div>`).join("")}</div>`;
  }
  function activity(st) {
    const ev = [], q = request(st), d = decision(st), hist = V.get("life.hist." + key2(st), []) || [];
    for (const x of hist) ev.push({ who: x.by, what: `recorded <b>${esc(DEC[x.o] || "")}</b>${x.c ? `: ${esc(x.c)}` : ""}`, when: md(x.at), at: x.at });
    if (q) ev.push({ who: q.by || null, what: `asked ${esc(holderName(chainOf(st)[0]))} for a decision${q.msg ? `: ${esc(q.msg)}` : ""}`, when: md(q.at), at: q.at });
    for (const r of stepsOf(st)) ev.push({ who: r.who, what: `recorded step ${r.i + 1}: <b>${esc(STEPW[r.o] || r.o)}</b>${r.rec && r.rec !== r.who ? ` ${mu(`· entered by ${esc(r.rec)}`)}` : ""}${r.note ? `: ${esc(r.note)}` : ""}`, when: md(r.at), at: r.at + "y" + r.i });
    if (d && d.seed) ev.push({ who: d.by, what: `recorded <b>${esc(decWord(st, d))}</b>`, when: md(d.at), at: d.at + "z" });
    for (const c of condsOfStep(st)) if (c.closed) ev.push({ who: c.closed.by, what: `closed the condition <b>${esc(c.t)}</b>${c.closed.how ? `: ${esc(c.closed.how)}` : ""}`, when: md(c.closed.at), at: c.closed.at + "zz" });
    return ev.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  const STEPW = { approve: "Approved", return: "Sent back", yes: "Approved", cond: "Approved with conditions", no: "Not approved", ato: "ATO", atoc: "ATO with conditions", dato: "DATO", iatt: "IATT", iattc: "IATT with conditions", auth: "Recommends authorization", authc: "Recommends authorization with conditions", deny: "Recommends denial" };
  function facts(st) {
    const t = (tracks(st.prog) || []).find((x) => x.n === st.n), d = decision(st), q = request(st), c = chainOf(st), last = c[c.length - 1];
    const out = [["Increment", t && t.name ? esc(t.name) : DASH], ["Phase", esc(PH[st.ph][1])], ["Kind", esc(KIND[st.kind])],
      [d ? "Decided" : "Due", st.skip ? mu("Not required") : d ? `<span class="num">${esc(md(d.at))}</span>` : st.due ? AK.due(st.due) : DASH]];
    if (!st.skip) out.push(["Decides", last.who ? AK.owner(last.who) + mu(` · ${esc(last.role)}`) : `${esc(last.role)} ${mu("· named when the decision is asked for")}`]);
    if (q) out.push(["Requested", `${esc(md(q.at))}${q.by ? mu(` · ${esc(q.by)}`) : ""}`]);
    else if (!d && !st.skip) out.push(["Requested", mu("Not yet")]);
    return out;
  }
  function gatePage(st) {
    VIEW[st.prog] = st.n;
    const t = (tracks(st.prog) || []).find((x) => x.n === st.n);
    const r = readyOf(st), m = metOf(st), cl = condsOfStep(st);
    const head = AK.recordHead({ crumbs: [["Lifecycle", "lifecycle"], [t && t.name ? `${t.name} · ${PH[st.ph][0]}` : PH[st.ph][0]]], title: titleOf(st), chip: stPill(st), desc: esc(st.desc), actions: actions(st, "page") });
    const body = st.skip ? AK.section("Not required", `<p class="v2g-p">${esc(st.skip)}</p>`)
      : AK.section("Deliverables", dlList(st), { count: r.total ? `${r.ready} of ${r.total} ready` : undefined })
      + AK.section("Criteria", critList(st), { count: m.total ? `${m.met} of ${m.total} met` : undefined })
      + AK.section("Decision", `${approval(st)}${decisionBlock(st)}${recBlock(st)}`)
      + (cl.length ? AK.section("Conditions", `<div class="v3g-cnds">${cl.map((c) => condRow(c, false)).join("")}</div>`, { count: `${cl.filter((c) => !c.closed).length} open` }) : "")
      + (activity(st).length ? AK.section("Activity", AK.activity(activity(st))) : "");
    return h.page(`<div class="v2g-gate">${head}${AK.withRail(body, AK.railCard("Gate details", facts(st)))}${foot()}</div>`);
  }
  // The SAR step records the SCA's risk recommendation [B23].
  function recBlock(st) {
    if (st.key !== "sar") return "";
    const r = G("rec." + key2(st), null);
    if (st.prog === WSX && st.n === 1) return `<dl class="ak-kv v2g-kv v3g-rec"><dt>SCA's recommendation</dt><dd>${esc(REC_W.authc)}</dd><dt>Residual risk</dt><dd>Moderate</dd><dt>Recorded by</dt><dd>${AK.owner("D. Okafor")}</dd></dl>`;
    if (!r) return `<p class="v2g-p">${mu("The SCA's risk recommendation is recorded at step 1, before the AO decides.")}</p>`;
    return `<dl class="ak-kv v2g-kv v3g-rec"><dt>SCA's recommendation</dt><dd>${esc(REC_W[r.rec])}</dd>${r.risk ? `<dt>Residual risk</dt><dd>${esc(r.risk)}</dd>` : ""}<dt>Recorded by</dt><dd>${AK.owner(r.by)}</dd>${r.note ? `<dt>Why</dt><dd>${esc(r.note)}</dd>` : ""}</dl>`;
  }
  for (const inc of WS) for (const tt of T) {
    const id = `${tt[0]}-${inc.n}`;
    X.S(`lifecycle-${id}`, (orig) => (X.wsx() ? gatePage(stepOf(WSX, id)) : orig()));
  }
  for (const g of ["pdr", "cdr"]) X.S(`rec--a-work-gate--${g}`, (orig) => (X.wsx() ? gatePage(stepOf(WSX, `${g}-2`)) : orig()));

  function preview(st) {
    const r = readyOf(st), m = metOf(st), d = decision(st), q = request(st), c = chainOf(st), last = c[c.length - 1];
    const head = AK.recordHead({ title: titleOf(st), chip: stPill(st), actions: actions(st, "panel") });
    const t = (tracks(st.prog) || []).find((x) => x.n === st.n);
    const fx = AK.facts([["Increment", t && t.name ? esc(t.name) : DASH], ["Phase", esc(PH[st.ph][0])], [d ? "Decided" : "Due", st.skip ? mu("Not required") : d ? esc(md(d.at)) : st.due ? AK.due(st.due) : DASH], ["Decides", last.who ? AK.owner(last.who) : esc(last.role)]]);
    const dsec = st.skip ? "" : AK.section("Deliverables", dlList(st), { count: r.total ? `${r.ready} of ${r.total} ready` : undefined });
    const csec = st.skip ? "" : AK.section("Criteria", critList(st), { count: m.total ? `${m.met} of ${m.total} met` : undefined });
    const cl = condsOfStep(st);
    const dec = d ? AK.section("Decision", decisionBlock(st)) : st.skip ? `<p class="v2g-p">${esc(st.skip)}</p>` : q ? approval(st) : "";
    const csec2 = cl.length ? AK.section("Conditions", `<div class="v3g-cnds">${cl.map((x) => condRow(x, false)).join("")}</div>`, { count: `${cl.filter((x) => !x.closed).length} open` }) : "";
    return { label: "Lifecycle gate preview", body: `<div class="a-work-pan v2g-pan" data-v2r-full="lifecycle-${esc(st.id)}">${head}${fx}${dec}${csec2}${dsec}${csec}</div>` };
  }
  X.P("a-work-gate", (orig, id) => { const st = find(id); return st && pageOf(st) ? preview(st) : orig(); });

  // ════════════════ Request decision: each step's holder named, an early request said so [A15 B08 B11] ════════════════
  const optsFor = (k, st) => {
    if (!named(st)) return PEOPLE.map(([n, r]) => [n, `${n} · ${r}`]);
    if (k === "ao") return [[WHO.ao[0], `${WHO.ao[0]} · ${WHO.ao[1]}`], [WHO.aodr[0], `${WHO.aodr[0]} · ${WHO.aodr[1]}, for the AO`]];
    return [[WHO[k][0], `${WHO[k][0]} · ${WHO[k][1]}`]];
  };
  function earlyLines(st) {
    const out = [], dd = st.due ? days(st.due) : null;
    const earlier = allSteps(st.prog).filter((s) => s.n === st.n && s.i < st.i && !done(s));
    if (dd != null && dd > 45) out.push(`Due ${mdy(st.due)}, in ${plural(dd, "day")}: a decision this far ahead is unusual.`);
    if (earlier.length) out.push(`${plural(earlier.length, "earlier step")} ${earlier.length === 1 ? "is" : "are"} still open: ${earlier.slice(0, 4).map((s) => s.line).join(", ")}${earlier.length > 4 ? ", …" : ""}.`);
    const op = openOf(st), n = op.dl.length + op.cr.length;
    if (n) out.push(`${plural(op.dl.length, "deliverable")} and ${plural(op.cr.length, "criterion", "criteria")} are open: Approve waits until they are closed; the decider can approve with conditions or not approve.`);
    return out;
  }
  const warnBox = (lines) => (lines.length ? `<div class="v3g-warn" role="note">${lines.map((l) => `<p>${gl("clock")}<span>${esc(l)}</span></p>`).join("")}</div>` : "");
  X.M("v2g-request", (orig, rf) => {
    const st = byRef(rf); if (!st || !pageOf(st)) return orig();
    const keys = CHAIN[st.key] || CHAIN[st.kind] || ["pm"];
    const rows = keys.map((k, i) => {
      const last = i === keys.length - 1, opts = optsFor(k, st), label = keys.length > 1 ? `Step ${i + 1} · ${WHO[k][1]}${last ? ", decides" : k === "sca" && (st.key === "sel" || st.key === "ssp") ? ", reviews" : ""}` : "Decides";
      if (opts.length === 1) return U.ro(label, `${AK.owner(opts[0][0])}${mu(` · ${esc(WHO[k][1])}`)}<input type="hidden" name="who${i}" value="${esc(opts[0][0])}">`);
      return U.F(label, U.choose(`who${i}`, opts, named(st) ? opts[0][0] : "", named(st) ? "" : "Choose who holds the step"), { req: true, hint: named(st) ? "" : "A created program names nobody to its roles yet: name the person, who alone records the step." });
    }).join("");
    return { title: "Request decision", body: `${U.desc(`${esc(titleOf(st))}. Each step is recorded on its own, in order; the step reads In review, and joins the Review queue, until the last one is recorded.`)}
      ${warnBox(earlyLines(st))}${rows}
      ${U.F("Decide by", U.inp("by", "", { type: "date", value: st.due && st.due >= TODAY_ISO ? st.due : TODAY_ISO, min: TODAY_ISO }), { req: true })}
      ${U.F("Message", U.area("msg", "What the approvers should look at first"))}`, footer: U.foot("Request decision", "v3g-request", rf) };
  });
  CH.ACTIONS["v3g-request"] = (rf, o) => {
    const st = byRef(rf); if (!st) return "Decide by: this step is not in the prototype.";
    if (o.by && o.by < TODAY_ISO) return "Decide by: choose today or a later day.";
    const keys = CHAIN[st.key] || CHAIN[st.kind] || ["pm"];
    const names = keys.map((k, i) => { const n = o["who" + i]; return n ? [n, named(st) ? (n === WHO.aodr[0] ? WHO.aodr[1] : WHO[k][1]) : roleOfName(n)] : null; });
    if (names.some((x) => !x)) return `Step ${names.findIndex((x) => !x) + 1}: choose who holds it.`;
    const k = key2(st), d = decision(st);
    if (d && d.o === "no") { V.set("life.hist." + k, (V.get("life.hist." + k, []) || []).concat([d])); V.set("life.dec." + k, false); }
    Gset("req." + k, { names, at: TODAY_ISO });
    Gset("steps." + k, []);
    V.set("life.req." + k, { at: TODAY_ISO, by: ME, msg: o.msg || "", until: o.by || null });
    return [`Decision on ${st.line} requested: step 1 waits on ${names[0][0]}`, { label: "Open the gate", route: `lifecycle-${st.id}` }];
  };

  // ════════════════ Record decision: one step at a time; Approve waits on open items; conditions tracked [A15 B02 B08 B10 B11 B23] ═
  const DUE30 = addDays(TODAY_ISO, 30);
  const ownerOpts = () => PEOPLE.map(([n, r]) => [n, `${n} · ${r}`]);
  function condFields(st) {
    return [1, 2, 3].map((j) => `<div class="v3g-cf">${U.F(`Condition ${j}`, U.inp(`cond${j}`, j === 1 ? "What must be done" : "Another condition, if any"))}<div class="v2k-row2">${U.F(`Owner of condition ${j}`, U.choose(`own${j}`, ownerOpts(), "", "Choose an owner"))}${U.F(`Due day of condition ${j}`, U.inp(`due${j}`, "", { type: "date", value: j === 1 ? DUE30 : "", min: TODAY_ISO }))}</div></div>`).join("");
  }
  const openList = (op) => `<div class="v3g-open"><b>Open now</b><ul>${op.dl.map((x) => `<li>${esc(x.t)}: ${esc(x.w)}</li>`).join("")}${op.cr.map((c) => `<li>${c.code ? esc(c.code) + " " : ""}${esc((c.t.length > 90 ? c.t.slice(0, 88) + "…" : c.t).replace(/\.$/, ""))}: ${esc((OS[c.s] || OS.na)[1])}</li>`).join("")}</ul></div>`;
  X.M("v2g-decide", (orig, rf) => {
    const st = byRef(rf); if (!st || !pageOf(st)) return orig();
    const c = chainOf(st), recd = stepsOf(st), i = Math.min(recd.length, c.length - 1), cur = c[i], last = i === c.length - 1;
    const r = readyOf(st), m = metOf(st), op = openOf(st), blocked = op.dl.length + op.cr.length > 0, who = holderName(cur);
    const why = `Waits on ${[op.dl.length ? plural(op.dl.length, "open deliverable") : "", op.cr.length ? plural(op.cr.length, "open criterion", "open criteria") : ""].filter(Boolean).join(" and ")}`;
    const parts = [U.desc(`${esc(titleOf(st))} · ${r.total ? `${r.ready} of ${r.total} deliverables ready` : "no deliverables to review"} · ${m.met} of ${m.total} criteria met.`)];
    parts.push(U.ro(c.length > 1 ? `Step ${i + 1} of ${c.length}` : "Decides", `${AK.owner(who)}${mu(` · ${esc(cur.role)}${cur.reviews ? " · reviews" : c.length > 1 && last ? " · decides" : ""}`)}`));
    let footLabel = "Record decision";
    if (!last && st.key === "sar" && i === 0) {
      parts.push(U.fld("Risk recommendation", U.radios("rec", [["auth", "Recommend authorization", "The residual risk is acceptable as assessed"], ["authc", "Recommend authorization with conditions", "Acceptable once the conditions are met"], ["deny", "Recommend denial", "The residual risk is not acceptable"]]), { req: true }));
      parts.push(U.F("Residual risk", U.choose("risk", [["Low", "Low"], ["Moderate", "Moderate"], ["High", "High"], ["Very high", "Very high"]], "Moderate")));
      parts.push(U.F("Why", U.area("note", "What the assessment found that the AO should weigh"), { req: true }));
      footLabel = "Record the recommendation";
    } else if (!last) {
      parts.push(U.fld("Decision", U.radios("dec", [["approve", cur.reviews ? "Reviewed: pass it on" : "Approve", `Passes it to step ${i + 2}, ${holderName(c[i + 1])}`], ["return", "Send back", "Ends the request; it is asked again once the comment is answered"]]), { req: true }));
      parts.push(U.F("Comment", U.area("note", "Required when sending back"), { hint: "Required when sending back." }));
      footLabel = `Record step ${i + 1}`;
    } else {
      if (blocked) parts.push(openList(op));
      const opts = st.key === "ato" ? [["ato", "ATO", blocked ? why : "Authorization to operate", blocked], ["atoc", "ATO with conditions", "Each condition is tracked with its owner and due day"], ["dato", "DATO", "Denial of authorization to operate"]]
        : st.key === "iatt" ? [["iatt", "IATT", blocked ? why : "Interim authority to test, with an expiry", blocked], ["iattc", "IATT with conditions", "Each condition is tracked with its owner and due day"], ["no", "Not approved", "The step stays open and is asked again"]]
        : [["yes", "Approve", blocked ? why : "Every deliverable is ready and every criterion met", blocked], ["cond", "Approve with conditions", "The step passes; each condition is tracked with its owner and due day"], ["no", "Not approved", "The step stays open and is asked again"]];
      parts.push(U.fld("Decision", U.radios("dec", opts), { req: true }));
      parts.push(condFields(st));
      if (st.key === "ato" || st.key === "iatt") {
        const atd = st.key === "iatt" ? addDays(TODAY_ISO, 270) : addDays(TODAY_ISO, 1095);
        const scope = st.prog === WSX ? (st.key === "iatt" ? `Increment ${st.n} test configuration: Block 1.1 and the flight test instrumentation` : `Increment ${st.n} · Block 1.1`) : nameOf(st.prog);
        parts.push(`<div class="v2k-row2">${U.F("Authorization termination date", U.inp("atd", "", { type: "date", value: atd, min: TODAY_ISO }), { hint: "Required when it authorizes." })}${U.F("Covers", U.inp("scope", "", { value: scope }))}</div>`);
      }
      parts.push(U.F("Comment", U.area("note", "Required when not approved"), { hint: "Required when not approved." }));
    }
    parts.push(U.F("Decided on", U.inp("at", "", { type: "date", value: TODAY_ISO }), { req: true }));
    if (who !== ME) parts.push(`<p class="note-p">Recorded as ${esc(who)}, who holds the step; the record keeps your name as the one who entered it.</p>`);
    return { title: c.length > 1 ? `Record step ${i + 1} of ${c.length}` : "Record decision", body: parts.join(""), footer: U.foot(footLabel, "v3g-decide", rf) };
  });
  const V2O = { yes: "yes", cond: "cond", no: "no", ato: "yes", atoc: "cond", dato: "no", iatt: "yes", iattc: "cond" };
  const AUTH_T = { ato: "ATO", atoc: "ATO with conditions", dato: "DATO", iatt: "IATT", iattc: "IATT" };
  CH.ACTIONS["v3g-decide"] = (rf, o) => {
    const st = byRef(rf); if (!st) return "Decision: this step is not in the prototype.";
    if (!request(st)) return "Decision: request the decision first.";
    if (o.at && o.at > TODAY_ISO) return "Decided on: a decision cannot be dated after today.";
    const c = chainOf(st), recd = stepsOf(st), i = Math.min(recd.length, c.length - 1), cur = c[i], last = i === c.length - 1, k = key2(st);
    const at = o.at || TODAY_ISO, who = holderName(cur);
    if (!last && st.key === "sar" && i === 0) {
      if (!o.rec) return "Risk recommendation: choose one.";
      Gset("rec." + k, { rec: o.rec, risk: o.risk || "", note: o.note || "", at, by: who, recBy: ME });
      Gset("steps." + k, recd.concat([{ i, who, role: cur.role, o: o.rec, note: o.note || "", at, rec: ME }]));
      return [`SCA's recommendation recorded as ${who}: ${REC_W[o.rec].toLowerCase()}; step 2 waits on ${holderName(c[1])}`, { label: "Open the gate", route: `lifecycle-${st.id}` }];
    }
    if (!o.dec) return "Decision: choose one.";
    if (!last) {
      if (o.dec === "return") {
        if (!o.note) return "Comment: say what must change before it is asked again.";
        Gset("steps." + k, []);
        V.set("life.req." + k, false);
        return [`${st.line} sent back by ${who}: ${o.note}`, { label: "Open the gate", route: `lifecycle-${st.id}` }];
      }
      Gset("steps." + k, recd.concat([{ i, who, role: cur.role, o: "approve", note: o.note || "", at, rec: ME }]));
      return [`Step ${i + 1} recorded as ${who}; step ${i + 2} waits on ${holderName(c[i + 1])}`, { label: "Open the gate", route: `lifecycle-${st.id}` }];
    }
    const op = openOf(st), blocked = op.dl.length + op.cr.length > 0, v2o = V2O[o.dec] || "yes";
    if (v2o === "yes" && blocked) return "Decision: Approve waits on the open deliverables and criteria; choose approve with conditions, or not approved.";
    const conds2 = [1, 2, 3].map((j) => ({ j, t: String(o["cond" + j] || "").trim(), owner: o["own" + j] || "", due: o["due" + j] || "" })).filter((x) => x.t);
    if (v2o === "cond") {
      if (!conds2.length) return "Condition 1: say what must be done.";
      const bad = conds2.find((x) => !x.owner); if (bad) return `Owner of condition ${bad.j}: choose who closes it.`;
      const late = conds2.find((x) => !x.due || x.due < TODAY_ISO); if (late) return `Due day of condition ${late.j}: choose today or a later day.`;
    }
    if (v2o === "no" && !o.note) return "Comment: say what must change before it is asked again.";
    const grants = st.key === "ato" || st.key === "iatt" ? v2o !== "no" : false;
    if (grants && (!o.atd || o.atd <= at)) return "Authorization termination date: choose a day after the decision.";
    Gset("steps." + k, recd.concat([{ i, who, role: cur.role, o: o.dec, note: o.note || "", at, rec: ME }]));
    if (v2o === "cond") Gset("cond." + k, conds2.map((x, j) => ({ id: `${k}#${j + 1}`, t: x.t, owner: x.owner, due: x.due, at })));
    if (st.key === "ato" || st.key === "iatt") Gset("auth." + k, { type: AUTH_T[o.dec] || (v2o === "no" ? (st.key === "ato" ? "DATO" : "Not approved") : "IATT"), decided: at, by: who, atd: grants ? o.atd : null, scope: o.scope || "", conditions: conds2.map((x) => x.t) });
    V.set("life.dec." + k, { o: v2o, c: v2o === "cond" ? conds2.map((x) => x.t).join("; ") : o.note || "", at, by: who, rec: ME });
    const nx = nextOf(curTrack(tracks(st.prog)));
    const word = st.key === "ato" || st.key === "iatt" ? `${AUTH_T[o.dec] || "not approved"}${o.dec === "iattc" ? " with conditions" : ""} recorded` : { yes: "approved", cond: "approved with conditions", no: "not approved" }[v2o];
    return [`${st.line} ${word} as ${who}${v2o === "cond" ? `: ${plural(conds2.length, "condition")} tracked` : ""}${nx && nx.id !== st.id ? ` · next ${nx.line}` : ""}`, { label: "Open the gate", route: `lifecycle-${st.id}` }];
  };

  // ════════════════ Facts for the other lanes ════════════════
  X.facts.authorizations = (prog) => authorizations(prog || WSX).map((a) => ({ id: a.id, inc: a.inc, type: a.type, decided: a.decided, by: a.by, atd: a.atd, scope: a.scope, conditions: a.conditions || [], planned: a.planned || null }));
  X.facts.conditions = (prog) => conds(prog || curCode()).map((c) => ({ id: c.id, step: c.step, t: c.t, owner: c.owner, due: c.due, closed: c.closed ? c.closed.at : null, progress: c.progress }));
  X.facts.gate = (id) => { const st = find(id); if (!st) return null; const r = readyOf(st), m = metOf(st), d = decision(st); return { id: st.id, prog: st.prog, title: titleOf(st), status: STW[status(st)], due: st.due || null, decided: d ? d.at : null, decision: d ? d.o : null, ready: r.ready, total: r.total, met: m.met, criteria: m.total, open: openOf(st).dl.length + openOf(st).cr.length }; };
  X.facts.outcome = (code, inc) => { const s = outcome(code, inc || 2); return { code, inc: inc || 2, status: s, word: (OS[s] || OS.na)[1] }; };

  // ════════════════ Pages that read the records: Authorization, ConMon, Package room [B05 B06 B09 C05] ════════════════
  const authRowCells = (a) => {
    const st = stepOf(WSX, a.id), dec = !!a.decided;
    const typePill = dec ? pill(a.type === "DATO" || a.type === "Not approved" ? "bad" : a.type === "ATO with conditions" ? "warn" : "ok", a.type) : `<span class="v3g-ring">${gl("ring")}${esc(a.planned && days(a.planned) >= 0 ? "Planned" : STW[status(st)] || "Planned")}</span>`;
    return [typePill, esc(a.scope), dec ? `<span class="num">${esc(mdy(a.decided))}</span>` : mu(`Due ${esc(mdy(a.planned))}`), dec ? `<span class="num">${esc(mdy(a.decided))}</span>` : mu("—"), a.atd ? `<span class="num">${esc(mdy(a.atd))}</span>` : mu("—"), a.by ? AK.owner(a.by) : mu("Not decided")];
  };
  function authFix(html) {
    if (typeof html !== "string" || !X.wsx()) return html;
    const t = parse(html), C = t.content;
    // Decision history: package version 2's row as drawn, then one row per authorization record, newest first.
    const sec = [...C.querySelectorAll("section.ak-sec")].find((s) => /^Decision history/.test((s.querySelector("h3") || {}).textContent || ""));
    if (sec) {
      const tb = sec.querySelector("tbody"), v2row = tb && tb.querySelector('tr[data-id="v2"]'), proto = tb && (tb.querySelector('tr[data-id="v1"]') || tb.querySelector("tr"));
      if (tb && proto) {
        const recs = authorizations(WSX).slice().sort((a, b) => ((b.decided || b.planned || "") > (a.decided || a.planned || "") ? 1 : -1));
        const planned = recs.filter((a) => !a.decided), decided = recs.filter((a) => a.decided);
        const rows = planned.concat(decided).map((a) => {
          const tr = proto.cloneNode(true); tr.setAttribute("data-id", "v3g:" + a.id); tr.setAttribute("data-panel", "v7p-decision");
          const cells = authRowCells(a); [...tr.cells].forEach((td, i) => { td.innerHTML = cells[i] != null ? cells[i] : ""; });
          return tr;
        });
        tb.innerHTML = ""; if (v2row) tb.appendChild(v2row); rows.forEach((r) => tb.appendChild(r));
        const ct = sec.querySelector("h3 .ct"); if (ct) ct.textContent = String(tb.querySelectorAll("tr").length);
      }
    }
    for (const n of C.querySelectorAll(".note-p")) if (/The IATT row and/.test(n.textContent)) n.innerHTML = n.innerHTML.replace(/The IATT row and the two/, "The two").replace(/<span class="ex">Example<\/span>\s*/, "");
    let out = t.innerHTML.replace(/12 high issues open/g, `${plural(highOpen(), "high issue")} open`);
    return out;
  }
  X.S("authorization", (orig) => authFix(orig()));
  X.P("v7p-decision", (orig, id) => {
    if (!String(id || "").startsWith("v3g:")) return orig();
    const a = authOf(String(id).slice(4)); if (!a) return orig();
    const st = stepOf(WSX, a.id), dec = !!a.decided;
    const head = AK.recordHead({ title: `${a.type} · Increment ${a.inc}`, chip: dec ? pill(a.type === "DATO" ? "bad" : a.type === "ATO with conditions" ? "warn" : "ok", "Decided") : stPill(st) });
    const fx = AK.facts([["Decision", dec ? esc(a.type) : mu("Not decided")], ["Decided by", a.by ? AK.owner(a.by) : mu("—")], [dec ? "Decided" : "Due", esc(mdy(a.decided || a.planned))], ["ATD", a.atd ? esc(mdy(a.atd)) : mu("—")]]);
    const conds2 = a.id === "ato-1" ? conds(WSX).filter((c) => c.step === "ato-1") : conds(WSX).filter((c) => c.step === a.id);
    const body = `${head}${fx}${AK.section("Covers", `<p class="v2g-p">${esc(a.scope)}</p>`)}${conds2.length ? AK.section("Conditions", `<div class="v3g-cnds">${conds2.map((c) => condRow(c, false)).join("")}</div>`, { count: conds2.length }) : ""}<p class="note-p">The ${esc(a.type)} is recorded by Lifecycle's ${esc(st ? st.line : "")} step: <a class="ak-link" href="#lifecycle-${esc(a.id)}">open the step</a>.</p>`;
    return { label: "Decision preview", body: `<div class="a-work-pan v2g-pan">${body}</div>` };
  });
  X.S(/^conmon/, (orig) => { const html = orig(); return typeof html === "string" && X.wsx() ? html.replace(/12 high issues open/g, `${plural(highOpen(), "high issue")} open`) : html; });
  X.S(/^package-room/, (orig) => { const html = orig(); return typeof html === "string" && X.wsx() ? html.replace(/POA&amp;M current: 41 items/g, `POA&amp;M current: ${fmt(poamN())} items`).replace(/POA&M current: 41 items/g, `POA&M current: ${fmt(poamN())} items`) : html; });

  // ════════════════ A condition: its preview, and Close condition, recorded as its owner [B10] ════════════════
  const autoClose = (c) => c.id === "ato1-1" ? (highOpen() > 0 ? `It closes once no high-severity issue is open: ${plural(highOpen(), "is", "are")} open now.` : "") : c.id === "ato1-2" ? (c.closed ? "" : "It closes when the expanded control set's increment 2 results are published.") : "";
  X.P("v3g-cond", (orig, id) => {
    const c = condById(id); if (!c) return orig();
    const st = stepOf(c.prog, c.step), auto = autoClose(c);
    const head = AK.recordHead({ title: c.t, chip: c.closed ? pill("ok", "Closed") : pill("none", "Open"), actions: c.closed || auto ? "" : `<button type="button" class="btn ink sm" data-modal="v3g-close" data-id="${esc(c.id)}">Close condition</button>` });
    const fx = AK.facts([["Gate", st ? `<a class="ak-link" href="#lifecycle-${esc(st.id)}" data-v2prog="${esc(c.prog)}">${esc(st.name)}</a>` : DASH], ["Owner", AK.owner(c.owner || null)], [c.closed ? "Closed" : "Due", c.closed ? esc(md(c.closed.at)) : AK.due(c.due)], ["Raised", esc(md(c.at))]]);
    const prog = c.closed ? `<p class="v2g-p">Closed by ${esc(c.closed.by)}${c.closed.how ? `: ${esc(c.closed.how)}` : ""}.</p>` : `<p class="v2g-p">${esc(c.progress ? c.progress + ". " : "")}${esc(auto || "Its owner closes it, saying what met it; it stays on Lifecycle, the gate and the owner's My work until then.")}</p>`;
    return { label: "Condition preview", body: `<div class="a-work-pan v2g-pan">${head}${fx}${prog}</div>` };
  });
  X.M("v3g-close", (orig, id) => {
    const c = condById(id); if (!c) return orig();
    return { title: "Close condition", body: `${U.desc(`${esc(c.t)}. ${esc(c.owner || "Its owner")} closes it; the gate keeps the record.`)}${U.F("What closed it", U.area("how", "The record that meets it: an agreement signed, a review recorded, a POA&M item closed"), { req: true })}${U.F("Closed on", U.inp("at", "", { type: "date", value: TODAY_ISO }), { req: true })}${c.owner && c.owner !== ME ? `<p class="note-p">Recorded as ${esc(c.owner)}, who owns the condition; the record keeps your name as the one who entered it.</p>` : ""}`, footer: U.foot("Close condition", "v3g-close", id) };
  });
  CH.ACTIONS["v3g-close"] = (id, o) => {
    const c = condById(id); if (!c) return "What closed it: this condition is not in the prototype.";
    if (autoClose(c)) return "What closed it: " + autoClose(c);
    if (o.at && o.at > TODAY_ISO) return "Closed on: choose today or an earlier day.";
    Gset("condx." + safe(id), { at: o.at || TODAY_ISO, by: c.owner || ME, how: o.how || "", rec: ME });
    const st = stepOf(c.prog, c.step);
    return [`Condition closed as ${c.owner || ME}: ${c.t}`, st ? { label: "Open the gate", route: `lifecycle-${st.id}` } : null];
  };

  // ════════════════ My work: conditions to close, decisions the reader asked for [B10 B30] ════════════════
  const progs = () => [WSX].concat(((H() && H().made()) || []).map((d) => d.code));
  function mwRows() {
    const cond = [], wait = [];
    for (const prog of progs()) {
      for (const c of conds(prog)) if (!c.closed) { const st = stepOf(prog, c.step); cond.push({ k: "act", t: c.t, m: `${st ? st.line : ""} condition${prog === WSX && st ? ` · Increment ${st.n}` : ""} · due ${md(c.due)}${c.progress ? ` · ${c.progress}` : ""}`, o: [c.owner || null], r: st ? `lifecycle-${st.id}` : "lifecycle", q: { open: { kind: "v3g-cond", id: c.id } }, me: c.owner === ME, prog }); }
      for (const st of allSteps(prog)) {
        const q = request(st); if (!q || q.by !== ME || decision(st)) continue;
        const c = chainOf(st), i = Math.min(stepsOf(st).length, c.length - 1);
        wait.push({ k: "act", t: `${st.name}${prog === WSX ? ` · Increment ${st.n}` : ""}: the decision waits on ${holderName(c[i])}`, m: `Requested ${md(q.at)}${c.length > 1 ? ` · step ${i + 1} of ${c.length}` : ""}`, o: [holderName(c[i])], r: `lifecycle-${st.id}`, me: true, prog });
      }
    }
    return { cond, wait };
  }
  // The next gate's deliverables that are not ready, read as Lifecycle reads them (v2 drew this group from its own readiness).
  function dueRows() {
    const t = curTrack(tracks(WSX)), nx = nextOf(t); if (!nx) return null;
    const low = (w) => (/^[A-Z][a-z]/.test(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w);
    return { nx, rows: inputs(nx).filter((d) => !d.ok).map((d) => ({ k: d.doc ? "doc" : "act", t: `${d.t}: ${low(d.w)}`, m: `${nx.line} deliverable · Increment ${nx.n}`, o: [d.own || null], r: d.go ? d.go[0] : d.doc || !has(d.r) ? `lifecycle-${nx.id}` : d.r, q: d.go ? d.go[1] : null, me: d.own === ME, prog: WSX })) };
  }
  if (PA.mywork && typeof PA.mywork.data === "function") {
    const data0 = PA.mywork.data;
    PA.mywork.data = function () {
      const out = data0.apply(this, arguments); if (!on()) return out;
      try {
        const { cond, wait } = mwRows();
        const due = dueRows(), gi = out.findIndex((g) => g.life);
        if (gi >= 0) { if (due && due.rows.length) out[gi] = Object.assign({}, out[gi], { title: `Due for ${due.nx.line} · ${md(due.nx.due)}`, rows: due.rows }); else out.splice(gi, 1); }
        if (cond.length) out.splice(1, 0, { title: "Conditions to close", glyph: "clock", rows: cond, v3: true });
        const w = out.find((g) => g.title === "Waiting on others"); if (w && wait.length) w.rows = w.rows.concat(wait);
      } catch (e) { console.error(e); }
      return out;
    };
  }
  function mwHtml(mine) {
    return (html) => {
      if (typeof html !== "string" || html.indexOf("a-work-mwg") < 0) return html;
      const t = parse(html), C = t.content;
      const sq = {}; for (const s of C.querySelectorAll(".a-work-sq")) { const k = s.getAttribute("title") === "Document" ? "doc" : "act"; if (!sq[k]) sq[k] = s.innerHTML; }
      const chev = C.querySelector(".a-work-chv"), chevHtml = chev ? chev.outerHTML : "";
      const rowH = (x) => `<a class="a-work-mw" href="#${esc(x.r)}"${x.q ? ` ${goQ(x.r, x.q)}` : ""} data-v2prog="${esc(x.prog || WSX)}"><span class="a-work-sq" title="${x.k === "doc" ? "Document" : "Work item"}">${sq[x.k] || ""}</span><span class="a-work-mwt"><span class="a-work-mwtt">${esc(x.t)}</span><span class="m">${esc(x.m)}</span></span><span class="a-work-mwo"><span class="ak-avs">${x.o.map((n) => `<span class="a-work-av" title="${esc(n || "No owner")}">${AK.avatar(n, 24)}${n ? "" : '<span class="v2-sr">No owner</span>'}</span>`).join("")}</span></span></a>`;
      const group = (title, glyph, rows, cls) => `<details class="a-work-mwg ${cls}" open><summary>${chevHtml}${gl(glyph)}<b>${esc(title)}</b><span class="ct num">${rows.length}</span></summary><div class="a-work-mwl">${rows.map(rowH).join("")}</div></details>`;
      const { cond, wait } = mwRows(), keep = (l) => (mine ? l.filter((x) => x.me) : l);
      // Lifecycle's group: the next gate's open deliverables as Lifecycle reads them.
      const old = C.querySelector("details.v2g-mwg"), due = dueRows(), drows = due ? keep(due.rows) : [];
      if (old) { if (drows.length) old.outerHTML = group(`Due for ${due.nx.line} · ${md(due.nx.due)}`, "clock", drows, "v2g-mwg"); else old.remove(); }
      else if (drows.length) { const g0 = C.querySelector("details.a-work-mwg"); if (g0) g0.insertAdjacentHTML("afterend", group(`Due for ${due.nx.line} · ${md(due.nx.due)}`, "clock", drows, "v2g-mwg")); }
      const crow = keep(cond);
      if (crow.length) { const g0 = C.querySelector("details.a-work-mwg"), box = C.querySelector(".mw"); const html2 = group("Conditions to close", "clock", crow, "v3g-mwg"); if (g0) g0.insertAdjacentHTML("afterend", html2); else if (box) box.insertAdjacentHTML("afterbegin", html2); }
      if (wait.length) {
        const wg = [...C.querySelectorAll("details.a-work-mwg")].find((d) => /Waiting on others/.test((d.querySelector("summary b") || {}).textContent || ""));
        if (wg) { const l = wg.querySelector(".a-work-mwl"); if (l) l.insertAdjacentHTML("beforeend", wait.map(rowH).join("")); const ct = wg.querySelector("summary .ct"); if (ct) ct.textContent = String(wg.querySelectorAll(".a-work-mw").length); }
        else { const box = C.querySelector(".mw"); if (box) box.insertAdjacentHTML("beforeend", `<details class="a-work-mwg v3g-mwg" open><summary>${chevHtml}<span class="gl info a-work-glg"></span><b>Waiting on others</b><span class="ct num">${wait.length}</span></summary><div class="a-work-mwl">${wait.map(rowH).join("")}</div></details>`); }
      }
      return t.innerHTML;
    };
  }
  X.S("my-work", (orig) => mwHtml(false)(orig()));
  X.S("my-work-mine", (orig) => mwHtml(true)(orig()));

  // ════════════════ SSP revision 3's review: the comment it needs is said at the button; the rationale comes from the ITCSC [B07 B29] ═
  const ITC = { cat: "C High · I High · A Moderate", why: "Mission plans and payload commands set confidentiality and integrity High. Losing the tactical data link degrades the mission without ending it, so availability is Moderate." };
  const rationaleOwn = () => { try { const D = PA.SSP; return !!(D.system.rationale && String(D.system.rationale).trim()) || ((D.sec("s2") || {}).text || []).some((x) => String(x).trim()) || D.session.some((e) => e.at === "s2" && (e.kind === "accept" || e.kind === "edit")); } catch (e) { return false; } };
  X.S("ssp-review", (orig) => {
    const html = orig(); if (typeof html !== "string" || !X.wsx()) return html;
    const t = parse(html), C = t.content;
    for (const li of C.querySelectorAll(".sh-rd li")) {
      const b = li.querySelector("b"); if (!b || !/categorization has no rationale/i.test(b.textContent)) continue;
      li.className = "done";
      li.innerHTML = `${gl("check")}<div class="sh-rd-b"><div class="sh-rd-t"><b>Categorization rationale from the signed ITCSC</b><span class="sh-rd-tag ok">ITCSC version 3, signed Sep 2</span></div><p>${esc(ITC.cat)}. ${esc(ITC.why)} Signed by Ray Colston and R. Calloway; section 2 reads it from there.</p></div>`;
    }
    const cnt = C.querySelector(".sh-cnt"); if (cnt) cnt.innerHTML = cnt.innerHTML.replace(/<b class="sh-bad">[^<]*<\/b> · /, "");
    C.querySelectorAll(".sh-blocker").forEach((x) => x.remove());
    const sub = C.querySelector('.sh-acts [data-sh-act="submit"]');
    if (sub) { sub.setAttribute("aria-describedby", "v3g-rc-hint"); sub.insertAdjacentHTML("beforebegin", `<span class="v3g-hint" id="v3g-rc-hint">${rcHint()}</span>`); }
    return t.innerHTML;
  });
  const rcText = () => { const el = document.getElementById("sh-rc"); return el ? el.value.trim() : ""; };
  const rcHint = () => (rcText() ? "Review comment written" : `Needs a review comment for the ISSM: <a class="ak-link" href="#sh-rc" data-v3g-rc>write it below</a>`);
  document.addEventListener("input", (e) => { if (!on() || !e.target || e.target.id !== "sh-rc") return; const hn = document.getElementById("v3g-rc-hint"); if (hn) hn.innerHTML = rcHint(); });
  window.addEventListener("click", (e) => {
    if (!on() || V.cur() !== "ssp-review" || !e.target || !e.target.closest) return;
    const a = e.target.closest("[data-v3g-rc]");
    if (a) { e.preventDefault(); e.stopPropagation(); const el = document.getElementById("sh-rc"); if (el) { el.scrollIntoView({ block: "center" }); el.focus(); } return; }
    const b = e.target.closest('[data-sh-act="submit"], [data-sh-act="submit-draft"]'); if (!b) return;
    const txt = rcText();
    if (!txt) { e.preventDefault(); e.stopPropagation(); const el = document.getElementById("sh-rc"); const hn = document.getElementById("v3g-rc-hint"); if (hn) hn.innerHTML = `Write the review comment first: <a class="ak-link" href="#sh-rc" data-v3g-rc>it is below</a>`; if (el) { el.setAttribute("aria-invalid", "true"); el.scrollIntoView({ block: "center" }); el.focus(); } V.toast("Submit for review needs a review comment for the ISSM first."); return; }
    if (rationaleOwn()) return; // the page's own submit runs
    // The rationale comes from the signed ITCSC: submit for the ISSM's review, as the page's own submit does once it has one.
    e.preventDefault(); e.stopPropagation();
    const D = PA.SSP, at = D.now ? D.now() : new Date().toISOString();
    try { if (PA.sspReview) PA.sspReview.restore({ state: "submitted", at, asDraft: false, comment: txt, key: null }); } catch (x) { /* the shared state below is the record */ }
    V.set("ssp.rev3", { state: "submitted", at, asDraft: false, comment: txt, key: null, day: String(at).slice(0, 10), when: D.ui && D.ui.when ? D.ui.when(at) : "" });
    V.redraw();
    V.toast("Submitted for review. Joel Barrantes, the ISSM, is emailed.");
  }, true);

  // ════════════════ Boundary: Increment 2 · Block 1.1, with the SCA's review; the IATT reads its record [B09 B12] ════════════════
  const segFix = (C, cur) => {
    const seg = C.querySelector(".v2h-seg"); if (!seg) return;
    const ato = seg.querySelector('[data-v2h-auth="ato"]');
    if (ato && !seg.querySelector("[data-v3g-blk]")) ato.insertAdjacentHTML("afterend", `<button type="button" class="v2h-segb${cur === "blk" ? " on" : ""}" aria-pressed="${cur === "blk"}" data-v3g-blk>Block 1.1</button>`);
    if (cur === "blk") seg.querySelectorAll("[data-v2h-auth]").forEach((b) => { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); });
  };
  document.addEventListener("click", (e) => { if (!on() || !e.target || !e.target.closest) return; const b = e.target.closest("[data-v3g-blk]"); if (!b) return; e.preventDefault(); location.hash = "boundary-block-1-1"; }, true);
  function iattLine() { const a = authOf("iatt-2"); return a && a.decided ? `${a.type} signed ${mdy(a.decided)}${a.atd ? ` · ATD ${mdy(a.atd)}` : ""}` : `Planned ${mdy(a ? a.planned : "2027-05-18")} · not decided`; }
  X.S("boundary", (orig) => { const html = orig(); if (typeof html !== "string" || !X.wsx()) return html; const t = parse(html); segFix(t.content, "ato"); return t.innerHTML; });
  X.S("boundary-iatt", (orig) => {
    const html = orig(); if (typeof html !== "string" || !X.wsx()) return html;
    const t = parse(html), C = t.content; segFix(C, "iatt");
    const s = C.querySelector(".v2h-cap .v2h-s"); if (s) s.textContent = iattLine();
    const a = authOf("iatt-2");
    if (a && a.decided) for (const td of C.querySelectorAll(".v2h-cov td")) td.innerHTML = td.innerHTML.replace(/IATT · (planned )?[A-Z][a-z]{2} \d{1,2}, \d{4}/, `IATT · ${mdy(a.decided)}`);
    return t.innerHTML;
  });
  function bndCard() {
    const b = bndRev();
    const state = !b ? `${pill("none", "Not requested")} ${mu("D. Okafor, lead assessor (SCA), reviews the Block 1.1 design boundary before PDR decides.")}`
      : b.state === "requested" ? `${pill("none", "Requested")} ${mu(`${esc(md(b.at))} by ${esc(b.by)} · waits on D. Okafor`)}`
        : b.state === "accepted" ? `${pill("ok", "Reviewed")} ${mu(`${esc(md(b.at))} by D. Okafor${b.note ? `: ${esc(b.note)}` : ""}`)}`
          : `${pill("bad", "Changes requested")} ${mu(`${esc(md(b.at))} by D. Okafor: ${esc(b.note || "")}`)}`;
    const act = !b || b.state === "changes" ? `<button type="button" class="btn sm ink" data-modal="v3g-bndreq" data-id="blk">${b ? "Request the review again" : "Request the SCA's review"}</button>` : b.state === "requested" ? `<button type="button" class="btn sm" data-modal="v3g-bndrec" data-id="blk">Record the review</button>` : "";
    return AK.section("SCA boundary review", `<p class="v2g-p v3g-side">${state}</p><p class="v2g-p">${mu("PDR's Boundary deliverable reads this review: it is ready once the SCA records it.")} <a class="ak-link" href="#lifecycle-pdr-2">Open PDR</a></p>`, { action: act });
  }
  X.screen("boundary-block-1-1", () => {
    if (!X.wsx() || !S.boundary) return h.page(AK.indexHead({ title: "Boundary" }), AK.empty({ title: "No Block 1.1 boundary", line: "This view is WS-X90's Increment 2." }));
    const base = X.force(false, () => S.boundary()), iat = X.force(false, () => (S["boundary-iatt"] ? S["boundary-iatt"]() : ""));
    const t = parse(base), C = t.content, ti = parse(iat).content;
    segFix(C, "blk");
    const d = C.querySelector(".ak-ih .ak-desc"); if (d) d.textContent = "Increment 2 · Block 1.1, the design boundary PDR reviews: the six subsystems with Block 1.1's changes";
    const cap = C.querySelector(".v2h-cap");
    if (cap) { const b = cap.querySelector("b"); if (b) b.textContent = "Increment 2 · Block 1.1"; const s = cap.querySelector(".v2h-s"); if (s) s.textContent = `Design boundary · PDR due ${md("2026-11-24")} · IATT ${authOf("iatt-2") && authOf("iatt-2").decided ? "signed " + mdy(authOf("iatt-2").decided) : "planned " + mdy("2027-05-18")}`; const l = cap.querySelector("[data-go]"); if (l) { l.setAttribute("data-go", "lifecycle-pdr-2"); l.textContent = "Open PDR"; } }
    for (const el of C.querySelectorAll(".v2h-el[data-id]")) { const m = ti.querySelector(`.v2h-el[data-id="${el.getAttribute("data-id")}"] .v2h-s`), s = el.querySelector(".v2h-s"); if (m && s) s.textContent = m.textContent; }
    const bd = C.querySelector(".v2h-bd"); if (bd) bd.setAttribute("aria-label", (bd.getAttribute("aria-label") || "").replace(/^ATO · Increment 1 · Block 1/, "Increment 2 · Block 1.1"));
    for (const td of C.querySelectorAll(".v2h-cov td")) td.innerHTML = td.innerHTML.replace(/^ATO · Sep 18, 2026$/, "Not yet authorized");
    const ih = C.querySelector(".ak-ih"); if (ih) ih.insertAdjacentHTML("afterend", bndCard());
    const n = C.querySelector(".v2h-foot"); if (n) n.textContent = "Block 1.1's changes per subsystem come from the draft configuration on Composition; the SCA's review and its dates are illustrative.";
    return t.innerHTML;
  }, "boundary");
  X.M("v3g-bndreq", (orig) => ({ title: "Request the SCA's boundary review", body: `${U.desc("D. Okafor, lead assessor (SCA), reviews the Block 1.1 design boundary for PDR: what is inside, the interconnections it keeps and the services it inherits.")}${U.F("Review by", U.inp("by", "", { type: "date", value: "2026-11-24", min: TODAY_ISO }), { req: true })}${U.F("Message", U.area("msg", "What the SCA should look at first"))}`, footer: U.foot("Request review", "v3g-bndreq", "blk") }));
  CH.ACTIONS["v3g-bndreq"] = (id, o) => { if (o.by && o.by < TODAY_ISO) return "Review by: choose today or a later day."; Gset("bnd", { state: "requested", at: TODAY_ISO, by: ME, msg: o.msg || "", until: o.by || null }); return ["SCA boundary review requested: it waits on D. Okafor", { label: "Open PDR", route: "lifecycle-pdr-2" }]; };
  X.M("v3g-bndrec", (orig) => ({ title: "Record the SCA's boundary review", body: `${U.desc("The lead assessor's review of the Block 1.1 design boundary.")}${U.fld("Review", U.radios("rv", [["accepted", "Accepted", "The boundary is ready for PDR"], ["changes", "Changes requested", "Say what must change"]]), { req: true })}${U.F("Comment", U.area("note", "Required when asking for changes"))}<p class="note-p">Recorded as D. Okafor, who holds the review; the record keeps your name as the one who entered it.</p>`, footer: U.foot("Record review", "v3g-bndrec", "blk") }));
  CH.ACTIONS["v3g-bndrec"] = (id, o) => {
    if (!o.rv) return "Review: choose one.";
    if (o.rv === "changes" && !o.note) return "Comment: say what must change.";
    Gset("bnd", { state: o.rv, at: TODAY_ISO, by: "D. Okafor", note: o.note || "", rec: ME });
    return [o.rv === "accepted" ? "SCA boundary review recorded as D. Okafor: PDR's Boundary deliverable is ready" : "The SCA asked for changes to the Block 1.1 boundary", { label: "Open PDR", route: "lifecycle-pdr-2" }];
  };

  // ════════════════ Two SSP revisions: Increment 1's annual update feeds package version 2; SSP 3 feeds Increment 2's IATT [B15] ═══
  const s21 = () => G("ssp21", null) || { state: "none" };
  const S21W = { none: "Not started", draft: "Draft", submitted: "In review with the ISSM", approved: "Approved by the ISSM", changes: "Changes requested by the ISSM" };
  X.M("v3g-ssp21", (orig) => {
    const s = s21();
    const head = U.desc("Revision 2.1 is Increment 1 · Block 1's FY2027 annual update: revision 2 as fielded, with the year's changes. Package version 2 holds it; SSP revision 3 drafts Block 1.1 for Increment 2's IATT and ATO.");
    if (s.state === "none" || s.state === "changes") return { title: s.state === "none" ? "Start the annual SSP update" : "Submit the annual SSP update again", body: `${head}${U.F("Review comment", U.area("comment", "What changed since revision 2, for the ISSM"), { req: true })}`, footer: U.foot(s.state === "none" ? "Start and submit for review" : "Submit for review", "v3g-ssp21", "submit") };
    if (s.state === "submitted") return { title: "Record the ISSM's review", body: `${head}${U.fld("Review", U.radios("rv", [["approved", "Approve", "Package version 2 can hold it"], ["changes", "Request changes", "Say what must change"]]), { req: true })}${U.F("Comment", U.area("note", "Required when requesting changes"))}<p class="note-p">Recorded as Joel Barrantes, the ISSM; the record keeps your name as the one who entered it.</p>`, footer: U.foot("Record review", "v3g-ssp21", "review") };
    return { title: "Annual SSP update", body: `${head}<p class="v2g-p">${esc(S21W[s.state])} ${esc(md(s.at))}.</p>`, footer: '<button type="button" class="btn" data-close-modal>Close</button>' };
  });
  CH.ACTIONS["v3g-ssp21"] = (id, o) => {
    if (id === "submit") { Gset("ssp21", { state: "submitted", at: TODAY_ISO, by: ME, comment: o.comment || "" }); return ["Revision 2.1, the annual update, submitted: it waits on Joel Barrantes, the ISSM", { label: "Open Authorization", route: "authorization" }]; }
    if (!o.rv) return "Review: choose one.";
    if (o.rv === "changes" && !o.note) return "Comment: say what must change.";
    Gset("ssp21", Object.assign({}, s21(), { state: o.rv, at: TODAY_ISO, by: "Joel Barrantes", note: o.note || "", rec: ME }));
    return [o.rv === "approved" ? "Revision 2.1 approved as Joel Barrantes: package version 2 can hold it" : "Joel Barrantes asked for changes to revision 2.1", { label: "Open Authorization", route: "authorization" }];
  };
  const s21Btn = () => { const s = s21(); return s.state === "approved" ? "" : `<button type="button" class="btn sm" data-modal="v3g-ssp21" data-id="r21">${s.state === "submitted" ? "Record the ISSM's review" : s.state === "changes" ? "Submit again" : "Start the annual update"}</button>`; };
  // Package version 2's checklist names the annual update, not SSP 3 (the chain's dialog, as V3 reads it).
  X.M("v7p-submit", (orig) => {
    const o = orig(); if (!o || !X.wsx() || typeof o.body !== "string") return o;
    const s = s21(), ok = s.state === "approved", p = CH.pkg ? CH.pkg() : {}, i2 = CH.inc2 ? CH.inc2() : null;
    const t = parse(o.body), C = t.content;
    for (const row of C.querySelectorAll(".v2k-chk")) {
      const b = row.querySelector("b"); if (!b) continue;
      if (/SSP 3/.test(b.textContent)) { row.removeAttribute("data-v2k-go"); row.setAttribute("data-v2go", "ssps"); row.innerHTML = `${gl(ok ? "check" : "ring")}<span class="x"><b>Annual SSP update approved</b><span class="v2k-mu">Revision 2.1, Increment 1 · ${esc(S21W[s.state])}</span></span>`; }
      if (/POA&amp;M current|POA&M current/.test(b.innerHTML)) { const m = row.querySelector(".v2k-mu"); if (m) m.textContent = `${fmt(poamN())} items`; }
    }
    const desc = C.querySelector(".ak-desc"); if (desc) desc.innerHTML = desc.innerHTML.replace(/\.$/, ". SSP revision 3 is Increment 2's and feeds its IATT, not this update.");
    o.body = t.innerHTML;
    const ready = ok && !!i2 && !p.submitted;
    o.footer = ready ? U.foot("Submit", "submit", "") : `<span class="v2k-mu v2k-why">${p.submitted ? "Submitted already" : !ok && !i2 ? "Waits on the annual SSP update and the increment 2 results" : !ok ? "Waits on the annual SSP update's approval" : "Waits on the increment 2 results"}</span><button type="button" class="btn" data-close-modal>Close</button><button type="button" class="btn ink" aria-disabled="true" data-v2-wired title="Submit waits on the items above">Submit</button>`;
    return o;
  });
  // Plans: revision 3 is Increment 2's; revision 2.1 is Increment 1's annual update.
  X.S(/^ssps($|-)/, (orig) => {
    const html = orig(); if (typeof html !== "string" || !X.wsx()) return html;
    const t = parse(html), C = t.content, s = s21();
    const tr = C.querySelector('tbody tr[data-id="SYS-WSX90"]');
    if (tr && tr.cells[2]) tr.cells[2].innerHTML = `Revision 3 ${mu("· Increment 2 · Block 1.1")}`;
    const ih = C.querySelector(".ak-ih");
    if (ih) ih.insertAdjacentHTML("afterend", AK.section("WS-X90's two drafts", `<ul class="v2g-dls"><li><span class="v2g-dl">Revision 2.1 · Increment 1 · Block 1, FY2027 annual update</span><span class="v2g-dlw">${esc(S21W[s.state])}${s.at ? " " + esc(md(s.at)) : ""} · feeds package version 2</span>${s21Btn()}</li><li><a class="v2g-dl" href="#ssp">Revision 3 · Increment 2 · Block 1.1</a><span class="v2g-dlw">${esc({ draft: "Draft", submitted: "In review with the ISSM", approved: "Approved", changes: "Changes requested" }[sspState()] || "Draft")} · feeds Increment 2's IATT, due May 18, 2027</span></li></ul>`, { count: 2 }));
    return t.innerHTML;
  });

  // ════════════════ Authorization: its Sharing tab is the package room; the package names the annual update and the SCA's word [C21 B15 B23] ═
  const SHARE = [["Recipients", ""], ["Access requests", "-requests"], ["Access log", "-log"]];
  function shareBody(sub) {
    const src = "package-room" + (SHARE.find((x) => x[0] === sub) || SHARE[0])[1];
    const html = S[src] ? X.force(false, () => S[src]()) : "";
    const t = parse(html), C = t.content, tabs = C.querySelector(".ak-tabs");
    let body = "";
    if (tabs) { let n = tabs.nextElementSibling; while (n) { if (!n.classList.contains("note-p")) body += n.outerHTML; n = n.nextElementSibling; } }
    const counts = {}; if (tabs) for (const tb of tabs.querySelectorAll(".ak-tab")) { const ct = tb.querySelector(".ct"); counts[tb.firstChild ? tb.firstChild.textContent.trim() : ""] = ct ? ct.textContent : null; }
    const sub2 = AK.tabs(SHARE.map(([l, r]) => [l, counts[l] != null ? counts[l] : null, l === sub ? null : "authorization-sharing" + r, l === sub]), "Sharing");
    return `<div class="v3g-share">${sub2}<div class="v3g-share-b">${body}</div><p class="note-p">Who can open the package, who asked, and every open, watermarked and logged. Version 1 is shared with the program's role holders; the access request, the two non-program recipients and the log are illustrative.</p><div class="btns"><span class="btn sm" role="button" tabindex="0" data-go="package-room-preview">Preview as recipient</span><span class="btn sm" role="button" tabindex="0" data-modal="a-risk-share" data-id="">Share the package</span></div></div>`;
  }
  function authTabs(html, sharing) {
    const t = parse(html), C = t.content, tabs = C.querySelector(".ak-rh .ak-tabs, .ak-tabs");
    if (tabs) {
      if (!tabs.querySelector("[data-v3g-share]")) tabs.insertAdjacentHTML("beforeend", `<span role="tab" aria-selected="false" class="ak-tab" data-v3g-share data-go="authorization-sharing" tabindex="0">Sharing<span class="ct num">7</span></span>`);
      if (sharing) {
        tabs.querySelectorAll(".ak-tab").forEach((x) => { x.classList.remove("on"); x.setAttribute("aria-selected", "false"); });
        const sh = tabs.querySelector("[data-v3g-share]"); sh.classList.add("on"); sh.setAttribute("aria-selected", "true"); sh.removeAttribute("data-go");
      }
    }
    for (const b of C.querySelectorAll('[data-go="package-room"]')) { b.setAttribute("data-go", "authorization-sharing"); if (/Open package room/.test(b.textContent)) b.textContent = b.textContent.replace("Open package room", "Sharing"); }
    for (const ttl of C.querySelectorAll(".ak-rail-t")) if (ttl.textContent.trim() === "Package room") ttl.textContent = "Sharing";
    return t.innerHTML;
  }
  function pkgFix(html) {
    if (typeof html !== "string") return html;
    const t = parse(html), C = t.content, s = s21();
    const sec = [...C.querySelectorAll("section.ak-sec")].find((x) => /^In the package/.test((x.querySelector("h3") || {}).textContent || ""));
    if (sec) for (const tr of sec.querySelectorAll("tbody tr")) {
      const c = tr.cells; if (!c || c.length < 6) continue;
      if (/System security plan/.test(c[0].textContent) && /Revision 3/.test(c[1].textContent)) { c[1].textContent = "Revision 2.1, annual update"; c[3].innerHTML = pill(s.state === "approved" ? "ok" : "none", S21W[s.state]); c[4].innerHTML = s.at ? `<span class="num">${esc(md(s.at))}</span>` : mu("—"); c[5].textContent = "Increment 1 · Block 1 as fielded, with FY2027's changes; SSP 3 is Increment 2's"; tr.setAttribute("data-go", "ssps"); }
      if (/Security assessment report/.test(c[0].textContent) && /Initial authorization/.test(c[1].textContent)) c[5].textContent = `${c[5].textContent.trim()} · SCA recommends authorization with conditions`;
      if (/^POA&M/.test(c[0].textContent.trim())) c[1].textContent = `${fmt(poamN())} items`;
    }
    for (const n of C.querySelectorAll(".ak-appr-n, .ak-desc, .v7p-p")) n.innerHTML = n.innerHTML.replace(/once SSP 3 is approved/, "once the annual SSP update (revision 2.1) is approved").replace(/version 2, the FY2027 annual update, is a draft\./, "version 2, Increment 1's FY2027 annual update, is a draft; Increment 2's IATT and ATO are recorded on Lifecycle.");
    return t.innerHTML;
  }
  X.S("authorization", (orig) => authTabs(pkgFix(orig()), false));
  for (const [l, r] of SHARE) X.screen("authorization-sharing" + r, () => {
    if (!X.wsx() || !S.authorization) return h.page(AK.indexHead({ title: "Authorization" }), AK.empty({ title: "Nothing shared yet", line: "The package is shared once it is assembled." }));
    const html = authTabs(S.authorization(), true), t = parse(html), C = t.content;
    const rh = C.querySelector(".ak-rh"), body = rh && rh.parentNode;
    if (rh && body) { let n = rh.nextSibling; while (n) { const nx = n.nextSibling; n.remove(); n = nx; } rh.insertAdjacentHTML("afterend", shareBody(l)); }
    return t.innerHTML;
  }, "authorization");
  // A tab of Authorization chosen on the Sharing tab opens Authorization at that tab.
  window.addEventListener("click", (e) => {
    if (!on() || !/^authorization-sharing/.test(V.cur()) || !e.target || !e.target.closest) return;
    const tb = e.target.closest('[data-v7p-tab^="auth|"]'); if (!tb) return;
    e.preventDefault(); e.stopPropagation();
    const k = tb.getAttribute("data-v7p-tab");
    location.hash = "authorization";
    setTimeout(() => { const again = document.querySelector(`#main [data-v7p-tab="${k}"]`); if (again) again.click(); }, 80);
  }, true);
  X.redirect("package-room", "authorization-sharing");
  X.redirect("package-room-requests", "authorization-sharing-requests");
  X.redirect("package-room-log", "authorization-sharing-log");
  X.redirect("package-room-settings", "authorization-sharing");
  X.redirect("package-room-versions", "authorization");

  // ════════════════ PA.v2life, read by other pages (Boundary, Security engineering): V3's statuses while V3 is on ════════════════
  if (PA.v2life) {
    const L = PA.v2life, step0 = L.step;
    if (typeof step0 === "function") L.step = function (id) { if (!on()) return step0.apply(this, arguments); const st = stepOf(WSX, id); return st ? { id: st.id, title: titleOf(st), kind: KIND[st.kind], phase: PH[st.ph][0], due: dueOf(st), status: STW[status(st)], href: `#lifecycle-${st.id}` } : null; };
    // The line under the program switcher counts the next gate's deliverables as Lifecycle does.
    const head0 = L.headLine;
    const myHead = () => { const t = curTrack(tracks(WSX)), nx = nextOf(t), r = nx ? readyOf(nx) : null; return `<a class="v2g-head" href="#lifecycle" title="Open Lifecycle">${esc([t.name.split(" · ")[0], nx ? PH[nx.ph][0] : PH[4][0], nx ? `next ${nx.line} ${md(nx.due)}` : "every step done", r && r.total ? `${r.ready} of ${r.total} ready` : ""].filter(Boolean).join(" · "))}</a>`; };
    if (typeof head0 === "function") L.headLine = function () { return on() && X.wsx() ? myHead() : head0.apply(this, arguments); };
    let pend = null;
    V.on((path) => { if (!on() || !/^(life\.|v3\.G|prog\.|chain\.|ssp\.|\*)/.test(String(path))) return; clearTimeout(pend); pend = setTimeout(() => { if (!on() || !X.wsx()) return; const el = document.querySelector("#nav .v2g-head"); if (el) { const t = parse(myHead()); if (t.content.firstElementChild) el.replaceWith(t.content.firstElementChild); } }, 20); });
  }
})();
