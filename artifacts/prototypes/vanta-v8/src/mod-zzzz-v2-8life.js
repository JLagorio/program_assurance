// Prototype v2, agent G (v2g-): the program's lifecycle, its stages, gates and deliverables [Josef, Nov 19: "Where do program
// lifecycle gates / stages live with deliverables for each stage? … We need more stages too."].
// - The archive's 19-step template (supabase/demo/original-poc.json.gz, lifecycleGates and programMilestones) in five acquisition
//   phases: milestones A, B and C, engineering reviews, RMF actions and IOC, for each of WS-X90's increments: Increment 1 · Block 1
//   (fielded: its ATO Sep 18, 2026, IOC after it) and Increment 2 · Block 1.1 (its PDR in review now, the CDR after it).
// - Lifecycle (route lifecycle): the phase strip, then the steps by phase. A page a step (lifecycle-<id>), reached by ↗ from the gate
//   preview (P["a-work-gate"], which mod-after-work.js hands to preview() here): deliverables (the program's own records, each taking
//   its state from that record), criteria, approval and decision.
// - Request decision and Record decision write PA.v2 state; Lifecycle, the line under the program switcher, the Overview's strip,
//   Home, Programs, the Review queue and My work read it.
// API, window.PA.v2life (read at draw time):
//   stage(code)  { increment, phase, phaseLong, next: { id, title, short, due, status, ready, total, href } } or null
//   step(id)     { id, title, kind, phase, due, status, href } of a WS-X90 step ("iatt-2", "ato-1"), or null
//   href(id)     "#lifecycle-<id>"
//   headLine()   the line under the program switcher;  preview(id)  the gate preview { label, body }
// State: life.req.<program>.<step> = { at, by, msg } a decision asked for; life.dec.<program>.<step> = { o: "yes" | "cond" | "no",
// c, at, by, rec } a decision recorded (false once it is asked again); life.hist.<program>.<step> = the decisions before.
(function () {
  const PA = window.PA, V = PA && PA.v2;
  if (!V || !PA.AK || !PA.h) return;
  const { S, P, M, h } = PA;
  const AK = PA.AK, { esc, fmt, pill, gl } = h;
  const TODAY = PA.data.TODAY, TODAY_ISO = "2026-11-17", WSX = "PRG-1090", ME = "Ingrid Solberg";
  const pad = (n) => String(n).padStart(2, "0");
  const dt = (iso) => new Date(iso + "T12:00:00");
  const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (iso, n) => { const d = dt(iso); d.setDate(d.getDate() + n); return isoOf(d); };
  const days = (iso) => Math.round((dt(iso) - TODAY) / 86400000);
  const md = (iso) => AK.md(iso);
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const mu = (t) => `<span class="v2g-mu">${t}</span>`;
  const DASH = '<span class="v2-dash" aria-label="None">—</span>';
  const has = (r) => !!(r && S[r]);

  // ════════════════ The template: five phases, nineteen steps ════════════════
  const PH = [["MSA", "Materiel solution analysis"], ["TMRR", "Technology maturation & risk reduction"], ["EMD", "Engineering & manufacturing development"], ["Test", "Integration, test & production approval"], ["Ops", "Production, deployment & operations"]];
  const KIND = { rev: "Engineering review", ms: "Milestone decision", rmf: "RMF action", op: "Operational" };
  // [key, phase, kind, line (in a sentence), tick (under its mark), name (its page's title), cyber criterion, NIST SP 800-160 Vol. 1
  // outcomes beside it, what the step is]. PDR's and CDR's criteria are the outcomes they carry (mod-after-work.js, PA.lifeGates).
  const T = [
    ["asr", 0, "rev", "ASR", "ASR", "ASR · Alternative systems review", "Preliminary boundary and data types identified", ["BA.4", "BA.5"], "The program office evaluates candidate concepts against user requirements."],
    ["ms-a", 0, "ms", "Milestone A", "A", "Milestone A decision", "System categorization brief accepted", [], "Funding approved for prototyping and technology maturation."],
    ["cat", 0, "rmf", "Categorize", "Cat", "Categorize the system", "FIPS-199 categorization signed by the AO", ["SN.4"], "The program and its security team set the confidentiality, integrity and availability impact levels."],
    ["srr", 1, "rev", "SRR", "SRR", "SRR · System requirements review", "Security requirements traced into the spec", ["SR.2", "SR.4"], "Every system performance requirement is defined, actionable and understood."],
    ["sfr", 1, "rev", "SFR", "SFR", "SFR · System functional review", "Functional decomposition of the security boundary", ["SR.1"], "The functional baseline is established against the specification."],
    ["sel", 1, "rmf", "Select controls", "Sel", "Select security controls", "Tailored baseline approved by the SCA", [], "A NIST SP 800-53 Rev. 5 baseline is selected and tailored to the system."],
    ["pdr", 1, "rev", "PDR", "PDR", "PDR · Preliminary design review", "SCA review of the conceptual boundary", [], "The allocated baseline is reviewed for readiness to enter detailed design."],
    ["strat", 1, "rmf", "RMF strategy", "Strat", "AO approval of the RMF strategy", "Signed RMF security strategy memo", ["RM.3"], "The authorizing official approves the security strategy before Milestone B."],
    ["ms-b", 2, "ms", "Milestone B", "B", "Milestone B decision", "AO-approved RMF strategy on file", [], "Formal program start: detailed engineering and manufacturing development is authorized."],
    ["ssp", 2, "rmf", "SSP", "SSP", "Develop the SSP", "SSP baselined in the authorization package", [], "Implementation statements say how the hardware and software meet each control."],
    ["cdr", 2, "rev", "CDR", "CDR", "CDR · Critical design review", "SCA assessment of the SSP: design must support selected controls", [], "The detailed design is mature and stable, 75 to 90% of drawings, and ready for fabrication."],
    ["trr", 3, "rev", "TRR", "TRR", "TRR · Test readiness review", "IATT prerequisites: scans and safety checks complete", ["IN.5"], "The system, facilities and safety protocols are ready for formal developmental test."],
    ["iatt", 3, "rmf", "IATT", "IATT", "IATT · Interim authority to test", "Signed IATT memo with expiry", [], "A time-bound AO approval to connect the system to a government test range or network."],
    ["svr", 3, "rev", "SVR", "SVR", "SVR · System verification review", "Control verification results recorded", ["VE.3", "VE.5"], "The physical system is verified against its design specifications."],
    ["prr", 3, "rev", "PRR", "PRR", "PRR · Production readiness review", "Supply-chain risk controls (SR family) assessed", ["AQ.4"], "The manufacturing line is audited for its ability to produce at scale."],
    ["sar", 4, "rmf", "SAR", "SAR", "Final assessment and SAR", "SAR delivered with risk recommendation to the AO", ["VA.7"], "Independent penetration test, code analysis and scans; the SCA issues the security assessment report."],
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
  // PDR's and CDR's outcomes when mod-after-work.js is not in the build.
  const GATE0 = {
    pdr: [["AR.4", "Identified stakeholder protection concerns are addressed by the system architecture.", "System Architecture Definition", "check"], ["AR.5", "Traceability of the security aspects of system architecture elements to key architecturally relevant stakeholder and system requirements is established.", "System Architecture Definition", "check"], ["AR.7", "Security aspects of system elements, their interactions, and their interfaces are defined.", "System Architecture Definition", "clock"], ["SR.6", "Traceability of the security aspects of system requirements and associated security-relevant constraints to stakeholder requirements is established.", "System Requirements Definition", "ring"]],
    cdr: [["DE.2", "System requirements are allocated to address their security aspects.", "Design Definition", "ring"], ["DE.3", "Security interfaces and security aspects of interfaces between system elements composing the system are defined.", "Design Definition", "ring"], ["DE.4", "Security design characteristics of each system element are defined.", "Design Definition", "ring"], ["DE.6", "Traceability of security design characteristics is established.", "Design Definition", "ring"]],
  };
  // Who decides: the chief engineer a review, the milestone decision authority a milestone, the ISSM, SCA and AO an RMF action.
  const WHO = { ce: ["Marcus Ryde", "Chief engineer"], mda: ["R. Feldman", "Milestone decision authority"], issm: ["Joel Barrantes", "ISSM"], sca: ["D. Okafor", "Lead assessor (SCA)"], ao: ["R. Calloway", "Authorizing official"], pm: ["Ray Colston", "Program manager"] };
  const CHAIN = { rev: ["ce"], ms: ["mda"], op: ["pm"], cat: ["issm", "ao"], sel: ["issm", "sca"], strat: ["issm", "ao"], ssp: ["issm", "sca"], iatt: ["issm", "sca", "ao"], sar: ["sca", "ao"], ato: ["issm", "sca", "ao"] };

  // ════════════════ WS-X90's two increments ════════════════
  const COND1 = "Close the high-severity remediation items within 90 days, complete the expanded control set assessment by Nov 20, and report the SA-24 design review at the annual authorization review.";
  const WS = [
    { n: 1, name: "Increment 1 · Block 1", state: "Fielded", steps: {
      asr: { at: "2023-03-14" }, "ms-a": { at: "2023-05-02" }, cat: { at: "2023-06-20" }, srr: { at: "2023-10-10" }, sfr: { at: "2024-01-23" }, sel: { at: "2024-03-05" },
      pdr: { at: "2024-06-11" }, strat: { at: "2024-07-30" }, "ms-b": { at: "2024-09-24" }, ssp: { at: "2024-11-19" }, cdr: { at: "2025-02-11" },
      trr: { at: "2025-10-21" }, iatt: { at: "2025-11-18" }, svr: { at: "2026-04-21" }, prr: { at: "2026-06-09" },
      sar: { at: "2026-08-28" }, "ms-c": { at: "2026-09-10" }, ato: { at: "2026-09-18", o: "cond", c: COND1 }, ioc: { at: "2026-10-15" } } },
    { n: 2, name: "Increment 2 · Block 1.1", state: "In development", steps: {
      asr: { skip: "Not required for Increment 2: Block 1's materiel solution carries over." },
      "ms-a": { skip: "Not required for Increment 2: the program passed Milestone A with Increment 1." },
      cat: { at: "2026-09-02" }, srr: { at: "2026-09-22" }, sfr: { at: "2026-10-13" }, sel: { at: "2026-10-27" },
      pdr: { due: "2026-11-24", req: { at: "2026-11-10", by: "Ray Colston" } }, strat: { due: "2026-12-15" }, "ms-b": { due: "2027-01-26" }, ssp: { due: "2027-02-23" },
      cdr: { due: "2027-03-23" }, trr: { due: "2027-04-27" }, iatt: { due: "2027-05-18" }, svr: { due: "2027-08-17" },
      prr: { skip: "Not required for Increment 2: Block 1.1 changes software and configuration on fielded hardware, so no production line is new." },
      sar: { due: "2027-09-14" }, "ms-c": { skip: "Not required for Increment 2: Block 1.1 is fielded under Block 1's Milestone C." }, ato: { due: "2027-10-26" }, ioc: { due: "2027-12-07" } } },
  ];
  // The customer programs: a plausible stage (synthetic). Their step in review is the gate the Review queue lists for them.
  const CUST = {
    "PRG-2101": { cur: "sar", due: "2026-12-01", title: "Delta assessment results review", req: "2026-11-13", owner: "Dan Whitfield" },
    "PRG-2102": { cur: "ssp", due: "2026-11-16", title: "Variant security plan approval", req: "2026-11-13", owner: "Hana Lindqvist" },
    "PRG-2201": { cur: "pdr", due: "2026-11-19", title: "Customer configuration review", req: "2026-11-13", owner: "Marcus Ryde" },
  };
  const NAMES = { "PRG-1090": "WS-X90 Sentinel Mission System", "PRG-2101": "Customer A · X800 Rail Integration", "PRG-2102": "Customer B · X800 Palletized Integration", "PRG-2201": "Customer C · G25 Battery Control Fielding", "PRG-1041": "Atlas payments platform", "PRG-1013": "Corporate identity provider", "PRG-1007": "Field operations mobile", "PRG-0994": "Legacy billing gateway", "PRG-1028": "Northwind data warehouse" };
  // A created program takes the template for Increment 1, dated from today (days after today a step is due).
  const OFF = [30, 75, 110, 200, 290, 340, 450, 500, 560, 650, 740, 900, 930, 1080, 1140, 1240, 1270, 1290, 1330];

  // ════════════════ Programs and their tracks ════════════════
  const H = () => PA.v2hubs;
  const curCode = () => (H() ? H().cur() : WSX);
  const madeOne = (code) => (H() && H().madeOne ? H().madeOne(code) : null);
  const nameOf = (code) => NAMES[code] || ((madeOne(code) || {}).name) || code;
  const mk = (prog, n, i, extra) => {
    const [key, ph, kind, line, tick, name, crit, outs, desc] = T[i];
    return Object.assign({ id: `${key}-${n}`, key, i, n, prog, ph, kind, line, tick, name, crit, outs, desc }, extra || {});
  };
  const STA = { "In progress": null, "At risk": "at_risk", Blocked: "blocked" };
  let CACHE = null;
  V.on(() => { CACHE = null; });
  function tracks(code) {
    if (!code) return null;
    if (CACHE && CACHE[code]) return CACHE[code];
    let ts = null;
    if (code === WSX) ts = WS.map((inc) => ({ n: inc.n, name: inc.name, state: inc.state, steps: T.map((t, i) => mk(WSX, inc.n, i, inc.steps[t[0]])) }));
    else if (madeOne(code)) { const from = /^\d{4}-\d{2}-\d{2}/.test(String(madeOne(code).at || "")) ? String(madeOne(code).at).slice(0, 10) : TODAY_ISO; ts = [{ n: 1, name: "Increment 1", state: "Planned", made: true, steps: T.map((t, i) => mk(code, 1, i, { due: addDays(from, OFF[i]) })) }]; }
    else if (CUST[code]) {
      const c = CUST[code], ci = T.findIndex((t) => t[0] === c.cur);
      ts = [{ n: 1, name: null, state: "Synthetic", steps: T.map((t, i) => mk(code, 1, i, i < ci ? { at: addDays(c.due, -42 * (ci - i)) } : i === ci ? { due: c.due, req: { at: c.req, by: null }, title: c.title } : { due: addDays(c.due, 45 * (i - ci)) })).map((s) => Object.assign(s, { id: `${code}:${s.key}`, owner: c.owner })) }];
    } else {
      const A = PA.v2lifeArchive && PA.v2lifeArchive.programs[code];
      if (A) ts = [{ n: 1, name: null, state: "Archive", arch: true, steps: T.map((t, i) => { const [s, planned, actual, owner, art] = A[i] || ["Planned", null, null, null, null];
        return mk(code, 1, i, { id: `${code}:${t[0]}`, due: planned, at: s === "Complete" ? actual || planned : null, fixed: STA[s] || null, req: s === "In progress" ? { at: "2026-09-12", by: null } : null, owner, art, arch: s }); }) }];
    }
    CACHE = CACHE || {};
    CACHE[code] = ts;
    return ts;
  }
  const allSteps = (code) => (tracks(code) || []).flatMap((t) => t.steps);
  const key2 = (st) => `${st.prog}.${st.id}`.replace(/[^A-Za-z0-9_.:-]/g, "_");
  // A decision: one recorded in this session, else the record's own (a step with a decided day).
  function decision(st) {
    if (!st || st.skip) return null;
    const u = V.get("life.dec." + key2(st));
    if (u !== undefined) return u || null;
    return st.at ? { o: st.o || "yes", c: st.c || "", at: st.at, by: deciderOf(st)[0], seed: true } : null;
  }
  function request(st) {
    if (!st || st.skip) return null;
    const u = V.get("life.req." + key2(st));
    if (u !== undefined) return u || null;
    return st.req || null;
  }
  const STW = { not_started: "Not started", in_review: "In review", at_risk: "At risk", blocked: "Blocked", failed: "Failed", completed: "Completed", passed: "Passed", waived: "Waived" };
  const STK = { not_started: "none", in_review: "none", at_risk: "warn", blocked: "bad", failed: "bad", completed: "ok", passed: "ok", waived: "none" };
  function status(st) {
    if (st.skip) return "waived";
    const d = decision(st);
    if (d) return d.o === "no" ? "failed" : st.kind === "rmf" || st.kind === "op" ? "completed" : "passed";
    if (st.fixed) return st.fixed;
    return request(st) ? "in_review" : "not_started";
  }
  const DONE = new Set(["passed", "completed", "waived"]);
  const done = (st) => DONE.has(status(st));
  const stPill = (st) => pill(STK[status(st)], STW[status(st)]);
  const dueOf = (st) => { const d = decision(st); return d ? d.at : st.due || st.at || null; };
  const titleOf = (st) => st.title || st.name;
  const chainOf = (st) => (CHAIN[st.key] || CHAIN[st.kind] || ["pm"]).map((k) => WHO[k]);
  function deciderOf(st) { const c = chainOf(st); return c[c.length - 1]; }
  const named = (st) => st.prog === WSX; // a created program has named nobody to its roles yet
  const curTrack = (ts) => (ts || []).find((t) => t.steps.some((s) => !done(s))) || (ts || [])[(ts || []).length - 1] || null;
  const nextOf = (t) => (t ? t.steps.find((s) => !done(s)) || null : null);
  const pageOf = (st) => (st.prog === WSX || madeOne(st.prog)) && !String(st.id).includes(":"); // a step of a program with pages here

  // ════════════════ Deliverables: the program's own records, each taking its state from that record ════════════════
  const PK = { asr: "ASR package", "ms-a": "MS-A package", srr: "SRR package", sfr: "SFR package", pdr: "PDR package", strat: "RMF strategy memo", "ms-b": "MS-B package", cdr: "CDR package", trr: "TRR package", iatt: "IATT memo", svr: "SVR package", prr: "PRR package" };
  const MEMO = new Set(["strat", "iatt"]);
  const docOwner = (st) => (st.kind === "ms" ? "Ray Colston" : MEMO.has(st.key) ? "Joel Barrantes" : "Marcus Ryde");
  const noReq = () => { try { const c = V.chain && V.chain.counts && V.chain.counts(); return c && c.no_requirement != null ? Math.max(0, c.no_requirement) : 14; } catch (e) { return 14; } };
  const sspState = () => (H() && H().ssp ? H().ssp() : "draft");
  function docState(st) {
    const d = decision(st);
    if (d && d.o !== "no") return { ok: true, w: `${MEMO.has(st.key) ? "Signed" : "Approved"} ${md(d.at)}` };
    if (st.prog === WSX && st.id === "pdr-2") return { ok: true, w: "Submitted Nov 10" };
    if (st.prog === WSX && st.id === "strat-2") return { ok: false, w: "Draft" };
    if (d && d.o === "no") return { ok: false, w: "Sent back" };
    return { ok: false, w: "Not started" };
  }
  function deliverables(st) {
    if (st.skip) return [];
    const k = st.key, n = st.n, ok = done(st);
    if (st.arch) return [{ t: st.art || "No deliverable recorded", ok: st.arch === "Complete", w: st.arch === "Complete" ? "Complete" : st.arch, plain: true }];
    if (CUST[st.prog]) return PK[k] ? [{ t: PK[k], ok, w: ok ? "Approved" : status(st) === "in_review" ? "In review" : "Not started", plain: true }] : [];
    const pkg = PK[k] ? [Object.assign({ t: PK[k], doc: `${st.prog}|${st.id}`, own: docOwner(st) }, docState(st))] : [];
    const NS = [false, "Not started"];
    const R = (t, r, own, w, open = NS) => (ok ? { t, r, own, ok: true, w } : { t, r, own, ok: open[0], w: open[1] });
    if (st.prog !== WSX) { // a created program: its own pages, nothing recorded yet
      const own = { cat: ["ITCSC", "itcsc"], srr: ["Requirements", "requirements"], sel: ["Baseline", "baseline"], ssp: ["SSP revision 1", "ssp"], sar: ["Assessment campaign", "assessments"], ato: ["Authorization decision", "authorization"], ioc: ["Continuous monitoring", "conmon"] }[k];
      return pkg.concat(own ? [R(own[0], own[1], null, "Recorded")] : []);
    }
    const nr = noReq(), s3 = sspState();
    const rev3 = () => ({ t: "SSP revision 3", r: "ssp", own: "Priya Raghavan", ok: ok || s3 === "approved", w: ok ? "Approved" : ({ draft: "Draft", submitted: "In review", approved: "Approved", changes: "Changes requested" }[s3] || "Draft") });
    const bnd = (w, open) => R("Boundary", "boundary", "Priya Raghavan", w, open);
    const L = {
      cat: [R("ITCSC", "itcsc", "Priya Raghavan", n === 1 ? "Version 1, signed Jun 20, 2023" : "Version 3, signed Sep 2")],
      srr: [R("Requirements", "requirements", ME, "Traced into the specification")],
      sfr: [R(n === 1 ? "Block 1 configuration" : "Block 1.1 configuration", "composition-config", "Marcus Ryde", n === 1 ? "Published Jul 20" : "Proposed")],
      sel: [R("Baseline", "baseline", ME, "Approved by the SCA")],
      pdr: n === 1 ? [bnd("Reviewed by the SCA")] : [R("Requirements", "requirements", ME, "Traced", [nr === 0, nr === 0 ? "Every control traced" : `${plural(nr, "control")} with no requirement`]), R("SCTM workbook", "sctm", ME, "Current", [true, "Current"]), R("Interconnections", "interconnections", "Priya Raghavan", "Agreements current", [true, "Agreements current"]), bnd("Reviewed by the SCA", [false, "SCA review pending"])],
      ssp: n === 1 ? [R("SSP revision 1", "ssp-history", "Priya Raghavan", "Superseded by revision 2")] : [rev3()],
      cdr: n === 1 ? [R("SCTM workbook", "sctm", ME, "Current")] : [R("SCTM workbook", "sctm", ME, "Current", [true, "Current"]), rev3()],
      trr: [R("STIG checklists", "stigs", "Joel Barrantes", "Scanned"), R("Ports & protocols", "ppsm", "Priya Raghavan", "Registered")],
      iatt: n === 1 ? [] : [bnd("Covered by the IATT")],
      svr: [R(n === 1 ? "Cyber T&E event" : "Cyber T&E · CVI FY2027", "cyber-te", "Wes Duarte", "Results recorded", n === 1 ? NS : [false, "Planned Jan 11"])],
      prr: [R("Suppliers and SBOMs", "suppliers", "Marcus Ryde", "SR family assessed")],
      sar: n === 1 ? [R("Initial Authorization Security Assessment", "assessments-completed", "D. Okafor", "Completed Aug 21"), R("Security assessment report", "assessments-completed", "D. Okafor", "Published Aug 28")] : [R("Assessment campaign", "assessments", "D. Okafor", "Completed", [false, "Not planned"]), R("Security assessment report", "assessments", "D. Okafor", "Published")],
      "ms-c": [R("Security assessment report", "assessments-completed", "D. Okafor", "Published Aug 28")],
      ato: [R("Authorization decision", "authorization", "R. Calloway", n === 1 ? "ATO with conditions, Sep 18" : "Recorded"), R("POA&M", "poam", "Priya Raghavan", "In the package"), R("Package room", "package-room", "Priya Raghavan", "Version 1 shared")],
      ioc: [R("Continuous monitoring", "conmon", "Joel Barrantes", "Active")],
    };
    return pkg.concat(L[k] || []);
  }
  const readyOf = (st) => { const dl = deliverables(st); return { ready: dl.filter((d) => d.ok).length, total: dl.length }; };

  // ════════════════ Criteria ════════════════
  function criteria(st) {
    if (st.skip) return [];
    const ok = done(st), d = decision(st), all = ok && d && (d.seed || d.o === "yes");
    if ((st.key === "pdr" || st.key === "cdr") && !st.arch && !CUST[st.prog]) {
      const live = st.prog === WSX && st.n === 2;
      const base = PA.lifeGates ? PA.lifeGates.crit(st.key, live) : GATE0[st.key];
      return (base.length ? base : GATE0[st.key]).map(([code, t, proc, g]) => {
        const glyph = all ? "check" : live ? g : "ring";
        return { code, t, proc, met: glyph === "check", g: glyph };
      });
    }
    // WS-X90's SRR, Milestone B, TRR and SVR of Increment 2 carry the outcomes Security engineering places under each review.
    if (st.prog === WSX && st.n === 2 && !st.arch && PA.sseOutcomes && ["srr", "ms-b", "trr", "svr"].includes(st.key)) {
      const L = PA.sseOutcomes(st.key);
      if (L && L.length) return L.map(([code, t, proc, g]) => ({ code, t, proc, met: g === "check", g }));
    }
    return [{ code: null, t: st.crit, proc: "Cyber criterion", met: !!all || (ok && !d) }].concat(st.arch || CUST[st.prog] ? [] : st.outs.map((c) => ({ code: c, t: OUT[c][0], proc: OUT[c][1], met: !!all }))).map((x) => Object.assign(x, { g: x.g || (x.met ? "check" : "ring") }));
  }

  // ════════════════ The stage: where a program is ════════════════
  function stage(code) {
    const ts = tracks(code); if (!ts || !ts.length) return null;
    const t = curTrack(ts), nx = nextOf(t);
    const inc = t && t.name ? t.name.split(" · ")[0] : null;
    if (!nx) return { code, increment: inc, incName: t.name, phase: PH[4][0], phaseLong: PH[4][1], next: null };
    const r = readyOf(nx);
    return { code, increment: inc, incName: t.name, phase: PH[nx.ph][0], phaseLong: PH[nx.ph][1],
      next: { id: nx.id, title: titleOf(nx), short: nx.line, due: dueOf(nx), status: STW[status(nx)], late: !!dueOf(nx) && days(dueOf(nx)) < 0, ready: r.ready, total: r.total, href: pageOf(nx) ? `#lifecycle-${nx.id}` : null, panel: pageOf(nx) ? "a-work-gate" : "v2g-pgate" } };
  }
  const stageLine = (code, withReady) => {
    const sg = stage(code); if (!sg) return "";
    const nx = sg.next;
    return [sg.increment, sg.phase, nx ? `next ${nx.short} ${nx.due ? md(nx.due) : ""}`.trim() : "every step done", withReady && nx && nx.total ? `${nx.ready} of ${nx.total} ready` : ""].filter(Boolean).join(" · ");
  };
  // A step of the current program by its id, else WS-X90's (a link from a workspace page names WS-X90's steps).
  function find(id) {
    id = String(id || "");
    if (id.includes("|")) return byRef(id);
    if (id === "pdr" || id === "cdr") id += "-2"; // the Schedule's two gates were Increment 2's
    if (id.includes(":")) return allSteps(id.split(":")[0]).find((s) => s.id === id) || null;
    const c = curCode();
    return allSteps(c).find((s) => s.id === id) || allSteps(WSX).find((s) => s.id === id) || null;
  }
  const byRef = (ref) => { const [prog, id] = String(ref || "").split("|"); return allSteps(prog).find((s) => s.id === id) || null; };
  const ref = (st) => `${st.prog}|${st.id}`;

  // ════════════════ Drawing: the strip, the rows, the deliverables ════════════════
  const gid = (st) => st.id;
  const panelOf = (st) => (pageOf(st) ? "a-work-gate" : "v2g-pgate");
  const progAttr = (st) => (st.prog === WSX ? ' data-v2prog="PRG-1090"' : "");
  function todayAt(t) {
    const N = t.steps.length, pts = t.steps.map((s, i) => [i, dueOf(s)]).filter((p) => p[1]);
    if (!pts.length) return null;
    let a = null, b = null;
    for (const p of pts) { if (p[1] <= TODAY_ISO) a = p; else if (!b) b = p; }
    const x = !a ? 0 : !b ? N : a[0] + 0.5 + ((dt(TODAY_ISO) - dt(a[1])) / (dt(b[1]) - dt(a[1]))) * (b[0] - a[0]);
    return Math.max(0, Math.min(100, (x / N) * 100));
  }
  function strip(t, opt = {}) {
    const nx = nextOf(t);
    const phs = PH.map(([sh, long], p) => {
      const list = t.steps.filter((s) => s.ph === p);
      const state = list.every(done) ? "done" : nx && nx.ph === p ? "on" : "todo";
      return `<span class="v2g-sph ${state}" style="flex:${list.length}" title="${esc(long)}"><b>${esc(sh)}</b>${opt.compact ? "" : `<span>${esc(long)}</span>`}</span>`;
    }).join("");
    const marks = t.steps.map((s) => {
      const stt = status(s), cls = `${s.kind === "ms" ? "ms" : ""} ${stt === "waived" ? "skip" : done(s) ? "done" : s === nx ? "on" : "todo"}`;
      const label = `${titleOf(s)}, ${STW[stt]}${dueOf(s) && stt !== "waived" ? `, ${done(s) ? "decided" : "due"} ${md(dueOf(s))}` : ""}`;
      if (opt.compact) return `<span class="v2g-mk ${cls}" title="${esc(label)}"><i></i></span>`;
      return `<button type="button" class="v2g-mk ${cls}" data-panel="${panelOf(s)}" data-id="${esc(gid(s))}" aria-label="${esc(label)}" title="${esc(label)}"><i aria-hidden="true"></i><span class="v2g-mkl" aria-hidden="true">${esc(s.tick)}</span></button>`;
    }).join("");
    const N = t.steps.length, x = todayAt(t), p = nx ? ((nx.i + 0.5) / N) * 100 : 100;
    const today = x == null ? "" : `<span class="v2g-today${x > 80 ? " end" : ""}" style="left:${x.toFixed(1)}%" aria-hidden="true"><span>Today</span></span>`;
    const inner = `<span class="v2g-sphs">${phs}</span><span class="v2g-mks"><span class="v2g-prog" style="width:${p.toFixed(1)}%" aria-hidden="true"></span>${marks}${today}</span>`;
    if (opt.compact) {
      const sg = stage(t.steps[0].prog);
      return `<a class="v2g-strip compact" href="#lifecycle" aria-label="${esc(`Open Lifecycle: ${t.name ? t.name + ", " : ""}${sg ? sg.phaseLong : ""}`)}">${inner}</a>`;
    }
    return `<div class="v2g-strip" role="group" aria-label="${esc(`${t.name || "Lifecycle"}: phases and steps`)}">${inner}</div>`;
  }
  const dot = (ok) => `<i class="v2g-dot${ok ? " ok" : ""}" aria-hidden="true"></i><span class="v2-sr">${ok ? "Ready: " : "Not ready: "}</span>`;
  function dlLink(d, st) {
    if (d.plain) return `<span class="v2g-dl${d.ok ? " ok" : ""}">${dot(d.ok)}${esc(d.t)}</span>`;
    if (d.doc) return `<button type="button" class="v2g-dl${d.ok ? " ok" : ""}" data-panel="v2g-doc" data-id="${esc(d.doc)}">${dot(d.ok)}${esc(d.t)}</button>`;
    if (d.r && has(d.r)) return `<a class="v2g-dl${d.ok ? " ok" : ""}" href="#${esc(d.r)}"${progAttr(st)}>${dot(d.ok)}${esc(d.t)}</a>`;
    return `<span class="v2g-dl${d.ok ? " ok" : ""}">${dot(d.ok)}${esc(d.t)}</span>`;
  }
  function dueCell(st) {
    if (st.skip) return mu(st.prog === WSX ? `Not required for Increment ${st.n}` : "Not required");
    const d = decision(st);
    if (d) return mu(`Decided ${md(d.at)}`);
    return st.due ? AK.due(st.due, { prefix: true }) : DASH;
  }
  const rowsHead = `<div class="v2g-rh" aria-hidden="true"><span>Step</span><span>Kind</span><span>Due or decided</span><span>Status</span><span>Deliverables</span><span>Criteria</span></div>`;
  function row(st, on) {
    const dl = deliverables(st), cr = criteria(st), met = cr.filter((c) => c.met).length;
    return `<div class="v2g-row${on ? " on" : ""}${st.skip ? " skip" : ""}" role="listitem" data-panel="${panelOf(st)}" data-id="${esc(gid(st))}">`
      + `<span class="v2g-c1"><button type="button" class="v2g-nm" data-panel="${panelOf(st)}" data-id="${esc(gid(st))}">${esc(titleOf(st))}</button></span>`
      + `<span class="v2g-c2">${esc(KIND[st.kind])}</span><span class="v2g-c3">${dueCell(st)}</span><span class="v2g-c4">${stPill(st)}</span>`
      + `<span class="v2g-c5">${dl.length ? dl.map((d) => dlLink(d, st)).join("") : DASH}</span>`
      + `<span class="v2g-c6">${cr.length ? `<span class="num">${met} of ${cr.length}</span><span class="v2g-c6l"> criteria met</span>` : DASH}</span></div>`;
  }
  function phases(t) {
    const nx = nextOf(t), curPh = nx ? nx.ph : PH.length - 1; // every step done: the last phase stays open
    return `<div class="v2g-phases">${PH.map(([sh, long], p) => {
      const list = t.steps.filter((s) => s.ph === p), live = list.filter((s) => !s.skip), dn = live.filter(done).length, skip = list.length - live.length;
      return `<details class="v2g-phase${p === curPh ? " on" : ""}"${p === curPh ? " open" : ""}><summary><span class="v2g-pht"><b>${esc(sh)}</b><span>${esc(long)}</span></span><span class="v2g-phc num">${dn} of ${live.length} done${skip ? ` · ${skip} not required` : ""}</span></summary><div class="v2g-rows" role="list" aria-label="${esc(long)}">${rowsHead}${list.map((s) => row(s, s === nx)).join("")}</div></details>`;
    }).join("")}</div>`;
  }
  const NOTE_WSX = "Increment dates, decisions, approvers and the review packages are illustrative; the 19 steps, their kinds and cyber criteria are the archive's template, and each deliverable opens WS-X90's own record, its state read from it.";
  const NOTE_MADE = "Dated from today by the archive's 19-step template; nothing is recorded against it yet.";
  const foot = (code) => `<p class="note-p v2g-note">${esc(code === WSX ? NOTE_WSX : NOTE_MADE)}</p>`;

  // ════════════════ Lifecycle ════════════════
  const VIEW = {};
  document.addEventListener("click", (e) => {
    const b = e.target && e.target.closest ? e.target.closest("[data-v2g-inc]") : null; if (!b) return;
    e.preventDefault();
    VIEW[curCode()] = +b.getAttribute("data-v2g-inc");
    V.redraw();
    const again = document.querySelector(`[data-v2g-inc="${b.getAttribute("data-v2g-inc")}"]`); if (again) again.focus();
  });
  function lifecyclePage() {
    const code = curCode(), ts = tracks(code);
    if (!ts) return h.page(AK.indexHead({ title: "Lifecycle" }), AK.empty({ title: "No lifecycle for this program", line: "Its steps join the page once the program records them." }));
    const ct = curTrack(ts), t = ts.find((x) => x.n === VIEW[code]) || ct, nx = nextOf(t);
    const sw = ts.length > 1 ? `<div class="v2g-incsw" role="group" aria-label="Increment">${ts.map((x) => `<button type="button" class="v2g-inc${x === t ? " on" : ""}" aria-pressed="${x === t}" data-v2g-inc="${x.n}">${esc(x.name)} <small>${esc(x === ct ? "Current" : x.state)}</small></button>`).join("")}</div>` : "";
    const r = nx ? readyOf(nx) : null;
    const desc = `${esc(nameOf(code))} · ${esc(t.name || "")}${nx ? ` · next <span class="ak-link" role="link" tabindex="0" data-go="lifecycle-${esc(nx.id)}">${esc(nx.line)}</span>, ${nx.due ? md(nx.due) : ""}${r && r.total ? ` · ${r.ready} of ${r.total} deliverables ready` : ""}` : " · every step done"}`;
    return h.page(`<div class="v2g-life">${AK.indexHead({ title: "Lifecycle", desc, actions: sw })}${strip(t)}${phases(t)}${foot(code)}</div>`);
  }
  V.screen("lifecycle", lifecyclePage, "lifecycle");
  // An address for each of WS-X90's increments (a link, a reload or the Before & after page opens that increment).
  for (const inc of WS) V.screen(`lifecycle-increment-${inc.n}`, () => { VIEW[curCode()] = inc.n; return lifecyclePage(); }, "lifecycle");

  // ════════════════ A gate's page and its preview ════════════════
  function actions(st, where) {
    if (st.skip || !pageOf(st)) return "";
    const s = status(st), t = nextOf(curTrack(tracks(st.prog))), cur = t && t.id === st.id;
    const out = (st.key === "pdr" || st.key === "cdr") && st.prog === WSX && st.n === 2 && !done(st) ? `<button type="button" class="btn${where === "page" ? "" : " sm"}" data-modal="v2f-outcomes" data-id="${st.key}">Add security outcomes</button>` : "";
    if (s === "in_review") return `${out}<button type="button" class="btn ink${where === "page" ? "" : " sm"}" data-modal="v2g-decide" data-id="${esc(ref(st))}">Record decision</button>`;
    if (cur && (s === "not_started" || s === "failed" || s === "at_risk" || s === "blocked")) return `${out}<button type="button" class="btn ink${where === "page" ? "" : " sm"}" data-modal="v2g-request" data-id="${esc(ref(st))}">Request decision</button>`;
    return out;
  }
  function approval(st) {
    const c = chainOf(st), d = decision(st), q = request(st), nm = named(st);
    if (st.skip) return "";
    const steps = c.map(([who, role], i) => ({ label: c.length > 1 ? `Step ${i + 1}` : "Decides", approvers: [{ who: nm ? who : role, role: nm ? role : "Named when the decision is asked for", state: d ? (d.o === "no" && i === c.length - 1 ? "changes" : "approved") : q ? (i === 0 ? "sent" : "waiting") : "waiting", when: d ? md(d.at) : q && i === 0 ? `${md(q.at)} · waiting ${Math.max(0, -days(q.at))} days` : "" }] }));
    const sub = d ? `Decided ${md(d.at)}` : q ? `Requested ${md(q.at)}${q.by ? ` by ${q.by}` : ""} · decided when every step approves` : "Not requested yet";
    return AK.approval({ title: "Approval", sub, steps });
  }
  const DEC = { yes: "Approved", cond: "Approved with conditions", no: "Not approved" };
  function decisionBlock(st) {
    const d = decision(st);
    if (st.skip) return `<p class="v2g-p">${esc(st.skip)}</p>`;
    if (!d) {
      const nx = nextOf(curTrack(tracks(st.prog))), who = named(st) ? `${deciderOf(st)[0]}, ${deciderOf(st)[1].toLowerCase()},` : `The ${deciderOf(st)[1].toLowerCase()}`;
      const line = status(st) === "in_review" ? ` ${who} decides once the deliverables and criteria are reviewed.` : nx && nx.id !== st.id && pageOf(st) ? ` It is asked for once ${nx.line} is decided.` : "";
      return `<p class="v2g-p">${mu("Not decided.")}${esc(line)}</p>`;
    }
    return `<dl class="ak-kv v2g-kv"><dt>Decision</dt><dd>${pill(d.o === "no" ? "bad" : d.o === "cond" ? "warn" : "ok", DEC[d.o])}</dd><dt>Decided by</dt><dd>${AK.owner(named(st) ? d.by : deciderOf(st)[1])}</dd><dt>Decided on</dt><dd class="num">${esc(md(d.at))}</dd>${d.c ? `<dt>Conditions</dt><dd>${esc(d.c)}</dd>` : ""}${d.rec && d.rec !== d.by ? `<dt>Recorded by</dt><dd>${AK.owner(d.rec)}</dd>` : ""}</dl>`;
  }
  function dlList(st) {
    const dl = deliverables(st);
    if (!dl.length) return mu(st.skip ? "None: the step is not required." : "None: the decision is the record.");
    return `<ul class="v2g-dls">${dl.map((d) => `<li class="${d.ok ? "ok" : ""}">${dlLink(d, st)}<span class="v2g-dlw">${esc(d.w)}</span>${d.own ? `<span class="v2g-dlo">${esc(d.own)}</span>` : ""}</li>`).join("")}</ul>`;
  }
  function critList(st) {
    const cr = criteria(st);
    if (!cr.length) return mu("None: the step is not required.");
    return `<div class="a-work-crit v2g-crit">${cr.map((c) => `<div>${gl(c.g)}<span><span>${esc(c.t)}</span><small>${c.code ? `${h.tag(c.code)} ` : ""}${esc(c.proc)}</small></span></div>`).join("")}</div>`;
  }
  function activity(st) {
    const ev = [], q = request(st), d = decision(st), hist = V.get("life.hist." + key2(st), []) || [];
    for (const x of hist) ev.push({ who: x.by, what: `recorded <b>${esc(DEC[x.o])}</b>${x.c ? `: ${esc(x.c)}` : ""}`, when: md(x.at), at: x.at });
    if (q) ev.push({ who: q.by || null, what: `asked ${esc(chainOf(st)[0][0])} for a decision${q.msg ? `: ${esc(q.msg)}` : ""}`, when: md(q.at), at: q.at });
    if (d) ev.push({ who: named(st) ? d.by : null, what: `recorded <b>${esc(DEC[d.o])}</b>`, when: md(d.at), at: d.at + "z" });
    return ev.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
  function facts(st) {
    const t = (tracks(st.prog) || []).find((x) => x.n === st.n);
    const d = decision(st), q = request(st);
    const out = [["Increment", t && t.name ? esc(t.name) : DASH], ["Phase", esc(PH[st.ph][1])], ["Kind", esc(KIND[st.kind])],
      [d ? "Decided" : "Due", st.skip ? mu("Not required") : d ? `<span class="num">${esc(md(d.at))}</span>` : st.due ? AK.due(st.due) : DASH]];
    if (!st.skip) out.push(["Decides", named(st) ? AK.owner(deciderOf(st)[0]) + mu(` · ${esc(deciderOf(st)[1])}`) : esc(deciderOf(st)[1])]);
    if (q) out.push(["Requested", `${esc(md(q.at))}${q.by ? mu(` · ${esc(q.by)}`) : ""}`]);
    else if (!d && !st.skip) out.push(["Requested", mu("Not yet")]);
    return out;
  }
  function gatePage(id) {
    const st = find(id);
    if (!st || !pageOf(st)) return h.page(AK.recordHead({ crumbs: [["Lifecycle", "lifecycle"], ["Not found"]], title: "This step is not in the program's lifecycle" }), `<p class="note-p"><span class="ak-link" role="link" tabindex="0" data-go="lifecycle">Open Lifecycle</span></p>`);
    VIEW[st.prog] = st.n;
    const t = (tracks(st.prog) || []).find((x) => x.n === st.n);
    const r = readyOf(st), cr = criteria(st), met = cr.filter((c) => c.met).length;
    const head = AK.recordHead({ crumbs: [["Lifecycle", "lifecycle"], [t && t.name ? `${t.name} · ${PH[st.ph][0]}` : PH[st.ph][0]]], title: titleOf(st), chip: stPill(st), desc: esc(st.desc), actions: actions(st, "page") });
    const body = st.skip ? AK.section("Not required", `<p class="v2g-p">${esc(st.skip)}</p>`)
      : AK.section("Deliverables", dlList(st), { count: r.total ? `${r.ready} of ${r.total} ready` : undefined })
      + AK.section("Criteria", critList(st), { count: cr.length ? `${met} of ${cr.length} met` : undefined })
      + AK.section("Decision", `${approval(st)}${decisionBlock(st)}`)
      + (activity(st).length ? AK.section("Activity", AK.activity(activity(st))) : "");
    const rail = AK.railCard("Gate details", facts(st));
    return h.page(`<div class="v2g-gate">${head}${AK.withRail(body, rail)}${foot(st.prog)}</div>`);
  }
  // Every step of WS-X90 has its page; a created program's steps share Increment 1's addresses.
  for (const inc of WS) for (const tt of T) { const id = `${tt[0]}-${inc.n}`; V.screen(`lifecycle-${id}`, () => gatePage(id), "lifecycle"); }
  // The old address of the Schedule's gate record pages opens the gate's page.
  for (const g of ["pdr", "cdr"]) V.screen(`rec--a-work-gate--${g}`, () => gatePage(`${g}-2`), "lifecycle");

  function preview(id) {
    const st = find(id); if (!st) return null;
    if (!pageOf(st)) return otherPreview(st);
    const r = readyOf(st), cr = criteria(st), met = cr.filter((c) => c.met).length, d = decision(st), q = request(st);
    const head = AK.recordHead({ title: titleOf(st), chip: stPill(st), actions: actions(st, "panel") });
    const t = (tracks(st.prog) || []).find((x) => x.n === st.n);
    const fx = AK.facts([["Increment", t && t.name ? esc(t.name) : DASH], ["Phase", esc(PH[st.ph][0])], [d ? "Decided" : "Due", st.skip ? mu("Not required") : d ? esc(md(d.at)) : st.due ? AK.due(st.due) : DASH], ["Decides", named(st) ? AK.owner(deciderOf(st)[0]) : esc(deciderOf(st)[1])]]);
    const dsec = st.skip ? "" : AK.section("Deliverables", dlList(st), { count: r.total ? `${r.ready} of ${r.total} ready` : undefined });
    const csec = st.skip ? "" : AK.section("Criteria", critList(st), { count: cr.length ? `${met} of ${cr.length} met` : undefined });
    const dec = d ? AK.section("Decision", decisionBlock(st)) : st.skip ? `<p class="v2g-p">${esc(st.skip)}</p>` : q ? approval(st) : "";
    return { label: "Lifecycle gate preview", body: `<div class="a-work-pan v2g-pan" data-v2r-full="lifecycle-${esc(st.id)}">${head}${fx}${dec}${dsec}${csec}</div>` };
  }
  // A gate of a program this workspace holds no pages for (the archive's programs, the customer programs): its preview alone.
  function otherPreview(st) {
    const d = decision(st), cr = criteria(st), dl = deliverables(st);
    const head = AK.recordHead({ title: titleOf(st), chip: stPill(st) });
    const fx = AK.facts([["Program", esc(nameOf(st.prog))], ["Phase", esc(PH[st.ph][1])], [d ? "Decided" : "Due", d ? esc(md(d.at)) : st.due ? AK.due(st.due) : DASH], ["Owner", AK.owner(st.owner || null)]]);
    const note = st.arch ? "From the archive's program milestones: the status, planned day, owner and deliverable as recorded. The workspace holds no record behind the deliverable." : "The customer program's lifecycle steps and dates are illustrative.";
    return { label: "Lifecycle gate preview", body: `<div class="a-work-pan v2g-pan">${head}${fx}${AK.section("Deliverables", `<ul class="v2g-dls">${dl.map((x) => `<li class="${x.ok ? "ok" : ""}">${dlLink(x, st)}<span class="v2g-dlw">${esc(x.w)}</span></li>`).join("")}</ul>`)}${AK.section("Criteria", critList(st), { count: `${cr.filter((c) => c.met).length} of ${cr.length} met` })}<p class="note-p">${esc(note)}</p></div>` };
  }
  P["v2g-pgate"] = (id) => { const st = find(id); const o = st ? otherPreview(st) : { label: "Lifecycle gate preview", body: "<p class=\"note-p\">This step is not in the prototype.</p>" }; if (PA.canon) o.body = PA.canon.rewrite(o.body); return o; };

  // An engineering review's package or a memo: a document with a preview.
  const DOC_PARTS = {
    asr: ["Candidate concepts and the analysis of alternatives", "Preliminary boundary and the data types it holds", "Initial threat and mission-impact summary"],
    "ms-a": ["Acquisition strategy", "System categorization brief", "Technology maturation plan", "Cost and schedule estimate"],
    srr: ["System specification", "Security requirements and their trace to stakeholder needs", "Requirements verification matrix", "Open risks"],
    sfr: ["Functional baseline", "Functional decomposition of the security boundary", "Interface descriptions", "Open risks"],
    pdr: ["Allocated baseline and the Block 1.1 changes", "Security architecture views", "Interface control documents: MIL-STD-1553B and MIL-STD-1760", "Threat summary from the threat model", "Requirements traceability from the SCTM workbook", "Open risks and their treatment"],
    strat: ["RMF roles and responsibilities", "Authorization approach and boundary", "Continuous monitoring strategy", "Signatures: ISSM and AO"],
    "ms-b": ["Acquisition program baseline", "Cybersecurity strategy, with the AO-approved RMF strategy", "Test and evaluation master plan", "Life-cycle sustainment plan"],
    cdr: ["Product baseline drawings", "Security design characteristics of each element", "Allocation of the selected controls to the design", "SCA assessment of the SSP", "Open risks"],
    trr: ["Test configuration and procedures", "Vulnerability scans and STIG results", "Safety checks", "IATT prerequisites"],
    iatt: ["Test configuration and its boundary", "Conditions of the test connection", "Expiry", "Signatures: ISSM, SCA and AO"],
    svr: ["Verification results against the specification", "Control verification results", "Cyber T&E findings"],
    prr: ["Production line audit", "Supply-chain risk controls (SR family)", "Component sources and SBOMs"],
  };
  P["v2g-doc"] = (id) => {
    const st = byRef(id) || find(String(id).split("|")[1]);
    if (!st || !PK[st.key]) return { label: "Document preview", body: '<p class="note-p">This document is not in the prototype.</p>' };
    const ds = docState(st), parts = DOC_PARTS[st.key] || [];
    const head = AK.recordHead({ title: `${PK[st.key]}${st.prog === WSX ? ` · Increment ${st.n}` : ""}`, chip: pill(ds.ok ? "ok" : "none", ds.w.replace(/ [A-Z][a-z]{2} \d.*$/, "") || ds.w) });
    const gate = pageOf(st) ? `<span class="ak-link" role="link" tabindex="0" data-go="lifecycle-${esc(st.id)}">${esc(titleOf(st))}</span>` : esc(titleOf(st));
    const fx = AK.facts([["For", gate], ["Owner", named(st) ? AK.owner(docOwner(st)) : DASH], ["State", esc(ds.w)], ["Marking", h.tag("CUI")]]);
    const body = `<div class="a-work-pan v2g-pan">${head}${fx}${AK.section("Contents", `<ol class="v2g-parts">${parts.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`, { count: parts.length })}<p class="note-p">The package's sections are illustrative; the review decides on it as one document.</p></div>`;
    return { label: "Document preview", body: PA.canon ? PA.canon.rewrite(body) : body };
  };

  // ════════════════ Request decision, Record decision ════════════════
  const CH = V.chain, U = CH && CH.ui;
  if (U) {
    M["v2g-request"] = (rf) => {
      const st = byRef(rf); if (!st) return { title: "Request decision", body: '<p class="note-p">This step is not in the prototype.</p>' };
      const c = chainOf(st), nm = named(st);
      const steps = `<ol class="v2g-chain">${c.map(([who, role], i) => `<li>${AK.owner(nm ? who : role)}${nm ? mu(` · ${esc(role)}`) : ""}${c.length > 1 ? mu(` · step ${i + 1}`) : ""}</li>`).join("")}</ol>`;
      return { title: "Request decision", body: `${U.desc(`${esc(titleOf(st))}. ${nm ? `${esc(c[0][0])} is asked first; the step` : "The step"} reads In review, and joins the Review queue, until the decision is recorded.`)}
        ${U.ro("Approval", steps)}
        ${U.F("Decide by", U.inp("by", "", { type: "date", value: st.due && st.due >= TODAY_ISO ? st.due : TODAY_ISO, min: TODAY_ISO }), { req: true })}
        ${U.F("Message", U.area("msg", "What the approvers should look at first"))}`, footer: U.foot("Request decision", "v2g-request", rf) };
    };
    M["v2g-decide"] = (rf) => {
      const st = byRef(rf); if (!st) return { title: "Record decision", body: '<p class="note-p">This step is not in the prototype.</p>' };
      const [who, role] = deciderOf(st), r = readyOf(st), cr = criteria(st), met = cr.filter((x) => x.met).length;
      return { title: "Record decision", body: `${U.desc(`${esc(titleOf(st))} · ${r.total ? `${r.ready} of ${r.total} deliverables ready` : "no deliverables"} · ${met} of ${cr.length} criteria met.`)}
        ${U.ro("Decided by", named(st) ? `${AK.owner(who)}${mu(` · ${esc(role)}`)}` : esc(role))}
        ${U.fld("Decision", U.radios("dec", [["yes", "Approve", "Every criterion is met or needs nothing more."], ["cond", "Approve with conditions", "The step passes; the conditions are tracked to a day."], ["no", "Not approved", "The step stays open and is asked again once the conditions are met."]]), { req: true })}
        ${U.F("Conditions", U.area("cond", "What must be done, by whom and by when"), { hint: "Required with conditions or when not approved." })}
        ${U.F("Decided on", U.inp("at", "", { type: "date", value: TODAY_ISO }), { req: true })}`, footer: U.foot("Record decision", "v2g-decide", rf) };
    };
    CH.ACTIONS["v2g-request"] = (rf, o) => {
      const st = byRef(rf); if (!st) return "Decide by: this step is not in the prototype.";
      if (o.by && o.by < TODAY_ISO) return "Decide by: choose today or a later day.";
      const k = key2(st), d = decision(st);
      if (d && d.o === "no") { V.set("life.hist." + k, (V.get("life.hist." + k, []) || []).concat([d])); V.set("life.dec." + k, false); }
      V.set("life.req." + k, { at: TODAY_ISO, by: ME, msg: o.msg || "", until: o.by || null });
      const first = named(st) ? chainOf(st)[0][0] : `the ${chainOf(st)[0][1].toLowerCase()}`;
      return [`Decision on ${st.line} requested from ${first}`, { label: "Open the Review queue", route: "review-queue" }];
    };
    CH.ACTIONS["v2g-decide"] = (rf, o) => {
      const st = byRef(rf); if (!st) return "Decision: this step is not in the prototype.";
      if (!o.dec) return "Decision: choose one.";
      if ((o.dec === "cond" || o.dec === "no") && !o.cond) return o.dec === "no" ? "Conditions: say what must change before it is asked again." : "Conditions: say what must be done, and by when.";
      if (o.at && o.at > TODAY_ISO) return "Decided on: a decision cannot be dated after today.";
      const k = key2(st);
      V.set("life.dec." + k, { o: o.dec, c: o.cond || "", at: o.at || TODAY_ISO, by: named(st) ? deciderOf(st)[0] : deciderOf(st)[1], rec: ME });
      if (!request(st)) V.set("life.req." + k, { at: o.at || TODAY_ISO, by: ME, msg: "" });
      const nx = nextOf(curTrack(tracks(st.prog)));
      const word = { yes: "approved", cond: "approved with conditions", no: "not approved" }[o.dec];
      return [`${st.line} ${word}${nx && nx.id !== st.id ? `: next ${nx.line}, ${md(dueOf(nx))}` : ""}`, { label: "Open Lifecycle", route: "lifecycle" }];
    };
    // Add security outcomes (mod-zzzz-v2-4wire.js) opens the gate on Lifecycle now, not on the Schedule.
    if (CH.ACTIONS.outcomes) { const f = CH.ACTIONS.outcomes; CH.ACTIONS.outcomes = (g, o) => { const out = f(g, o); if (Array.isArray(out) && out[1]) out[1] = { label: "Open the gate", route: `lifecycle-${g}-2` }; return out; }; }
  }

  // ════════════════ The chrome: the line under the switcher, the rail's counts ════════════════
  function headLine() {
    const code = curCode(), sg = stage(code); if (!sg) return "";
    return `<a class="v2g-head" href="#lifecycle" title="Open Lifecycle">${esc(stageLine(code, true))}</a>`;
  }
  function refreshChrome() {
    const el = document.querySelector("#nav .v2g-head");
    if (el) { const t = document.createElement("template"); t.innerHTML = headLine(); if (t.content.firstElementChild) el.replaceWith(t.content.firstElementChild); }
    const set = (route, n) => { if (n == null) return; for (const b of document.querySelectorAll(`#rail a.ri[href="#${route}"] .ri-b, #bottom a.ri[href="#${route}"] .ri-b`)) b.textContent = fmt(n); };
    try { if (PA.mywork) set("my-work", PA.mywork.data().reduce((a, g) => a + g.rows.length, 0)); } catch (e) { /* the count stays as drawn */ }
    try { if (PA.reviewQueue) set("review-queue", PA.reviewQueue.total()); } catch (e) { /* the count stays as drawn */ }
  }
  // Only a change the stage reads (a decision, a request, a program, a mapping, the SSP's review) redraws the line and the counts.
  let pending = null;
  V.on((path) => { if (!/^(life\.|prog\.|chain\.|ssp\.|\*)/.test(String(path))) return; clearTimeout(pending); pending = setTimeout(refreshChrome, 0); });

  // ════════════════ The Overview: the strip under its header ════════════════
  function ovStrip(code) {
    const ts = tracks(code); if (!ts) return "";
    const t = curTrack(ts), sg = stage(code), nx = sg && sg.next;
    let txt = "Every step done";
    if (nx) {
      const dd = nx.due ? days(nx.due) : null, nr = nx.total - nx.ready;
      const when = dd == null ? "" : dd < 0 ? `, ${plural(-dd, "day")} past due` : dd === 0 ? " today" : ` in ${plural(dd, "day")}`;
      txt = `Next: ${nx.short}${when}${nx.total ? ` · ${nr ? `${plural(nr, "deliverable")} not ready` : "every deliverable ready"}` : ""}`;
    }
    const link = nx && nx.href ? `<a class="v2g-ovs-n" href="${nx.href}">${esc(txt)}</a>` : `<span class="v2g-ovs-n">${esc(txt)}</span>`;
    return `<section class="v2g-ovs" aria-label="Lifecycle"><div class="v2g-ovs-h"><a class="v2g-ovs-t" href="#lifecycle">${esc(t.name || "Lifecycle")} · ${esc(sg ? sg.phase : "")}</a>${link}</div>${strip(t, { compact: true })}</section>`;
  }
  const parse = (html) => { const t = document.createElement("template"); t.innerHTML = html; return t; };
  function wrapS(route, fn) {
    const f = S[route]; if (typeof f !== "function") return;
    const g = function () { const html = f.apply(this, arguments); try { return fn(html); } catch (e) { console.error(e); return html; } };
    Object.keys(f).forEach((p) => { g[p] = f[p]; });
    S[route] = g;
  }
  wrapS("overview", (html) => {
    if (typeof html !== "string" || curCode() !== WSX) return html;
    const t = parse(html), rh = t.content.querySelector(".ak-rh, .ph");
    for (const dtEl of t.content.querySelectorAll(".ak-rail dt")) if (dtEl.textContent.trim() === "Lifecycle") { const dd = dtEl.nextElementSibling; if (dd && dd.tagName === "DD") dd.remove(); dtEl.remove(); }
    if (rh) rh.insertAdjacentHTML("afterend", ovStrip(WSX));
    const main = t.content.querySelector(".main"); if (main && rh && !main.querySelector(".v2g-note")) main.insertAdjacentHTML("beforeend", `<p class="note-p v2g-note">The increments' dates and gate decisions are illustrative.</p>`);
    return t.innerHTML;
  });

  // ════════════════ Home and Programs: the stage of each program ════════════════
  const lateMark = (sg) => (sg && sg.next && sg.next.late ? `${gl("diamond")}<span class="v2-sr">Past due: </span>` : "");
  wrapS("home", (html) => {
    if (typeof html !== "string" || html.indexOf("pcard") < 0) return html;
    const t = parse(html);
    for (const a of t.content.querySelectorAll("a.pcard")) {
      const code = ((a.querySelector(".code") || {}).textContent || "").trim(), sg = stage(code), ft = a.querySelector(".foot");
      if (!sg || !ft || a.querySelector(".v2g-cardl")) continue;
      ft.insertAdjacentHTML("afterend", `<div class="v2g-cardl">${lateMark(sg)}${esc(stageLine(code, false))}</div>`);
    }
    const main = t.content.querySelector(".main"); if (main && !main.querySelector(".v2g-note")) main.insertAdjacentHTML("beforeend", `<p class="note-p v2g-note">Each card's stage comes from the program's lifecycle; WS-X90's dates and the customer programs' stages are illustrative.</p>`);
    return t.innerHTML;
  });
  const hostOf = (code) => { try { const x = PA.v2host && PA.v2host.hostOf(code); return x && x.name ? x.name : null; } catch (e) { return null; } };
  const lateCount = () => Object.keys(NAMES).concat(((H() && H().made()) || []).map((d) => d.code)).filter((c) => { const sg = stage(c); return sg && sg.next && sg.next.late; }).length;
  wrapS("portfolio", (html) => {
    if (typeof html !== "string" || html.indexOf("v7o-name") < 0) return html;
    const t = parse(html), C = t.content;
    const ths = [...C.querySelectorAll("thead th")], gi = ths.findIndex((x) => x.textContent.trim() === "Next gate");
    const lateOn = !!C.querySelector('.qv[data-v7o-v="late"][aria-pressed="true"], .qv.on[data-v7o-v="late"]');
    let removed = 0;
    for (const tr of C.querySelectorAll("tbody tr")) {
      const grp = tr.querySelector("td[colspan]");
      if (grp) { if (gi >= 0) grp.setAttribute("colspan", String(Math.max(1, (+grp.getAttribute("colspan") || 6) - 1))); continue; }
      const code = tr.getAttribute("data-id") || tr.getAttribute("data-v2prog") || "";
      const sg = stage(code);
      if (lateOn && sg && !(sg.next && sg.next.late)) { tr.remove(); removed++; continue; }
      if (gi >= 0 && tr.cells[gi]) tr.cells[gi].remove();
      const cell = tr.querySelector(".v7o-name") && tr.querySelector(".v7o-name").closest("td");
      const host = hostOf(code);
      if (cell && sg) cell.insertAdjacentHTML("beforeend", `<span class="v2g-pfl">${lateMark(sg)}${esc(stageLine(code, false))}${host ? ` · Host: ${esc(host)}` : ""}</span>`);
    }
    if (gi >= 0) ths[gi].remove();
    const chip = C.querySelector('.qv[data-v7o-v="late"] .num'); if (chip) chip.textContent = fmt(lateCount());
    if (removed) { const pg = C.querySelector(".pager .num"); if (pg) pg.textContent = pg.textContent.replace(/(\d+)–(\d+) of (\d+)/, (m, a, b, c) => `${a}–${Math.max(0, +b - removed)} of ${Math.max(0, +c - removed)}`); }
    // Grouping rows that lost every program under the filter go too.
    for (const tr of [...C.querySelectorAll("tbody tr")]) { if (!tr.querySelector("td[colspan]")) continue; const nx = tr.nextElementSibling; if (!nx || nx.querySelector("td[colspan]")) tr.remove(); }
    // One footnote: the stage line's source joins the page's own.
    const note = C.querySelector(".note-p");
    if (note) { note.innerHTML = note.innerHTML.replace(/ and Next gate the earliest gate not yet passed/, ""); note.insertAdjacentHTML("beforeend", " Each stage and next step come from the program's lifecycle: the archive's own for the five archived programs, WS-X90's increments, and a plausible stage for the three customer programs."); }
    return t.innerHTML;
  });
  if (P["v7o-prog"]) {
    const f = P["v7o-prog"];
    P["v7o-prog"] = (code) => {
      const o = f(code); if (!o || typeof o.body !== "string") return o;
      const sg = stage(code); if (!sg) return o;
      const t = parse(o.body);
      const card = [...t.content.querySelectorAll(".ak-card")].find((c) => { const b = c.querySelector(".v7o-ch b"); return b && b.textContent.trim() === "Next gate"; });
      if (!card) return o;
      const nx = sg.next;
      const open = nx ? (nx.href ? `<a class="ak-link" href="${nx.href}"${code === WSX ? ' data-v2prog="PRG-1090"' : ""}>${esc(nx.title)}</a>` : `<span class="ak-link" role="button" tabindex="0" data-panel="v2g-pgate" data-id="${esc(nx.id)}">${esc(nx.title)}</span>`) : "Every step done";
      card.innerHTML = `<div class="v7o-ch"><b>Stage</b>${nx ? `<span class="v7o-push">${pill(STK[Object.keys(STW).find((k) => STW[k] === nx.status)] || "none", nx.status)}</span>` : ""}</div>`
        + `<div class="v7o-li">${gl(nx && nx.late ? "diamond" : "clock")}<span class="x">${esc([sg.increment, sg.phaseLong].filter(Boolean).join(" · "))}</span></div>`
        + (nx ? `<div class="v7o-li">${gl("ring")}<span class="x">${open}</span><span class="v7o-le">${nx.due ? AK.due(nx.due) : ""}</span></div>` : "")
        + (code === WSX ? `<div class="v7o-li"><span class="x"><a class="ak-link" href="#lifecycle" data-v2prog="PRG-1090">Open Lifecycle</a></span></div>` : "");
      o.body = t.innerHTML;
      return o;
    };
  }

  // ════════════════ The Review queue: gates to decide open the gate ════════════════
  // The queue's own gate rows name each program's step in review; WS-X90's are the steps asked for a decision (PDR, then any other).
  const QGATE = { g1: "PRG-0994:srr", g2: "PRG-1028:cdr", g3: "PRG-1041:prr", g5: "PRG-2102:ssp", g6: "PRG-1007:ioc", g7: "PRG-2201:pdr", g8: "PRG-2101:sar" };
  const wsxInReview = () => [WSX].concat(((H() && H().made()) || []).map((d) => d.code)).flatMap((c) => allSteps(c).filter((s) => status(s) === "in_review"));
  const qDelta = () => wsxInReview().length - 1; // the queue drew WS-X90's PDR as one gate row (g4)
  if (PA.reviewQueue && PA.reviewQueue.total) { const f = PA.reviewQueue.total; PA.reviewQueue.total = () => f() + qDelta(); }
  const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const rowDay = (tr) => { const m = /([A-Z][a-z]{2}) (\d{1,2})(?:, (\d{4}))?/.exec((tr.cells[5] || {}).textContent || ""); return m ? isoOf(new Date(+(m[3] || 2026), MON[m[1]], +m[2], 12)) : "9999"; };
  function queueFix(html) {
    if (typeof html !== "string" || html.indexOf("a-work-rq") < 0 && html.indexOf("v2-rq") < 0) return html;
    const t = parse(html), C = t.content, g4 = C.querySelector('tr[data-id="gate:g4"]'), mine = wsxInReview(), d = mine.length - 1;
    for (const [g, id] of Object.entries(QGATE)) { const tr = C.querySelector(`tr[data-id="gate:${g}"]`); if (tr) { tr.setAttribute("data-panel", "v2g-pgate"); tr.setAttribute("data-id", id); } }
    const bump = (el) => { if (el) el.textContent = fmt(Math.max(0, (+el.textContent.replace(/[^\d]/g, "") || 0) + d)); };
    if (d) { bump(C.querySelector(".ak-tabs .ak-tab .ct")); for (const o of C.querySelectorAll('[data-aw-kind=""] .num, [data-aw-kind="gate"] .num')) bump(o); }
    if (!g4) return t.innerHTML;
    const rows = mine.map((st) => {
      const tr = g4.cloneNode(true), q = request(st) || { at: TODAY_ISO }, first = named(st) ? chainOf(st)[0][0] : null;
      tr.setAttribute("data-panel", "a-work-gate"); tr.setAttribute("data-id", st.prog === WSX ? st.id : ref(st));
      if (st.prog !== WSX && tr.cells[3]) tr.cells[3].innerHTML = `<span class="a-work-tr" style="max-width:170px" title="${esc(nameOf(st.prog))}">${esc(nameOf(st.prog))}</span>`;
      const cb = tr.querySelector("[data-aw-id]"); if (cb) { cb.setAttribute("data-aw-id", `gate:${st.id}`); cb.setAttribute("aria-label", `Select ${titleOf(st)}`); }
      const nm = tr.cells[1] && tr.cells[1].querySelector(".a-work-tr"); if (nm) { nm.textContent = `${titleOf(st)} · Increment ${st.n}`; nm.setAttribute("title", `${titleOf(st)} · Increment ${st.n}`); }
      if (tr.cells[4]) tr.cells[4].innerHTML = first ? AK.owner(first) : esc(chainOf(st)[0][1]);
      if (tr.cells[5]) tr.cells[5].innerHTML = `<span class="num">${esc(md(q.at))}</span> <span class="a-work-mu num">· ${Math.max(0, -days(q.at))}d</span>`;
      if (tr.cells[6]) tr.cells[6].innerHTML = q.by ? AK.owner(q.by) : '<span class="a-work-mu">—</span>';
      return { tr, at: q.at };
    });
    const body = g4.parentNode; g4.remove();
    for (const r of rows) { const after = [...body.querySelectorAll("tr")].find((x) => rowDay(x) > r.at); if (after) body.insertBefore(r.tr, after); else body.appendChild(r.tr); }
    const all = C.querySelector("thead [data-aw-all]"); if (all) all.setAttribute("data-aw-all", all.getAttribute("data-aw-all").split(",").filter((x) => x !== "gate:g4").concat(mine.map((s) => `gate:${s.id}`)).join(","));
    // The rows shown hold the gates: the pager counts them with the rest (or alone, under the Gates filter).
    const pg = C.querySelector(".pager .num"); if (pg && d) pg.textContent = pg.textContent.replace(/(\d+)–(\d+) of ([\d,]+)/, (m, a, b, c) => `${a}–${Math.max(0, +b + d)} of ${fmt(Math.max(0, +c.replace(/,/g, "") + d))}`);
    return t.innerHTML;
  }
  wrapS("review-queue", queueFix);

  // ════════════════ My work: the next gate's deliverables that are not ready ════════════════
  function dueGroup() {
    const sg = stage(WSX), nx = sg && sg.next; if (!nx) return null;
    const st = find(nx.id); if (!st) return null;
    const low = (w) => (/^[A-Z][a-z]/.test(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w);
    const rows = deliverables(st).filter((d) => !d.ok).map((d) => ({ k: d.doc ? "doc" : "act", t: `${d.t}: ${low(d.w)}`, m: `${nx.short} deliverable · Increment ${st.n}`, o: [d.own || null], r: d.doc || !has(d.r) ? `lifecycle-${st.id}` : d.r, me: d.own === ME }));
    if (!rows.length) return null;
    return { title: `Due for ${nx.short} · ${md(nx.due)}`, glyph: "clock", rows, life: true };
  }
  if (PA.mywork && PA.mywork.data) { const f = PA.mywork.data; PA.mywork.data = () => { const out = f(); const g = dueGroup(); if (g) out.splice(1, 0, g); return out; }; }
  function mwRow(x, sq) {
    const icon = (sq[x.k] || "");
    return `<a class="a-work-mw" href="#${esc(x.r)}" data-v2prog="PRG-1090"><span class="a-work-sq" title="${x.k === "doc" ? "Document" : "Work item"}">${icon}</span><span class="a-work-mwt"><span class="a-work-mwtt">${esc(x.t)}</span><span class="m">${esc(x.m)}</span></span><span class="a-work-mwo"><span class="ak-avs">${x.o.map((n) => `<span class="a-work-av" title="${esc(n || "No owner")}">${AK.avatar(n, 24)}${n ? "" : '<span class="v2-sr">No owner</span>'}</span>`).join("")}</span></span></a>`;
  }
  function mwFix(mineOnly) {
    return (html) => {
      if (typeof html !== "string" || html.indexOf("a-work-mwg") < 0) return html;
      const g = dueGroup(); if (!g) return html;
      const rows = mineOnly ? g.rows.filter((x) => x.me) : g.rows;
      if (!rows.length) return html;
      const t = parse(html), C = t.content, groups = C.querySelectorAll("details.a-work-mwg");
      const sq = {}; for (const s of C.querySelectorAll(".a-work-sq")) { const k = s.getAttribute("title") === "Document" ? "doc" : "act"; if (!sq[k]) sq[k] = s.innerHTML; }
      const chev = C.querySelector(".a-work-chv"), chevHtml = chev ? chev.outerHTML : "";
      const html2 = `<details class="a-work-mwg v2g-mwg" open><summary>${chevHtml}${gl("clock")}<b>${esc(g.title)}</b><span class="ct num">${rows.length}</span></summary><div class="a-work-mwl">${rows.map((x) => mwRow(x, sq)).join("")}</div></details>`;
      if (groups[0]) groups[0].insertAdjacentHTML("afterend", html2); else { const box = C.querySelector(".mw"); if (box) box.insertAdjacentHTML("afterbegin", html2); }
      return t.innerHTML;
    };
  }
  wrapS("my-work", mwFix(false));
  wrapS("my-work-mine", mwFix(true));

  PA.v2life = {
    stage, href: (id) => `#lifecycle-${id}`, headLine, preview,
    step: (id) => { const st = allSteps(WSX).find((s) => s.id === id); return st ? { id: st.id, title: titleOf(st), kind: KIND[st.kind], phase: PH[st.ph][0], due: dueOf(st), status: STW[status(st)], href: `#lifecycle-${st.id}` } : null; },
    steps: (code) => allSteps(code || WSX).map((st) => ({ id: st.id, title: titleOf(st), kind: KIND[st.kind], phase: PH[st.ph][0], increment: st.n, due: dueOf(st), status: STW[status(st)] })),
  };
})();
