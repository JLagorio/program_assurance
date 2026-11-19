// After screens for the people group (a-people-): People, a person, Privileged access reviews, an access review, Inventory,
// Scope changes, the Mission Computer record and role task sets, each drawn from BA/dev/people.final.json with the after kit
// (window.PA.AK). Values are WS-X90's, copied from mod-risk.js (role holders, the Schedule's open tasks, the Sep 18 ATO's
// conditions, the package room), mod-system.js (the 20 assets, their components and firmware, the Block 1.1 changes) and
// mod-platform.js (the Mission Computer record); anything the data does not hold carries Example.
// after_flags honoured: People says it holds WS-X90's role holders and task owners and that the workspace's 6 other people are
// left out (Josef's call); R. Calloway's own act leads his Work and the ATO's conditions sit under it as what his decision set,
// met by the program, so his row keeps "No open tasks"; the quarterly review's schedule is the Continuous monitoring check's
// cadence, which Create ▾ › Schedule repeats rather than adds; Mission Computer draws only Published as a pill.
// Pieces built here beyond the kit: row checkboxes, menus (••• and ▾), a donut, an account decision control, a checklist,
// an unsaved-changes bar and a toast host.
(function () {
  const { S, P, M, ROUTE_NAV, data, h } = window.PA;
  const AK = window.PA.AK;
  const { esc, fmt, gl, pill, tag } = h;
  const EX = '<span class="ex">Example</span>';
  const ME = "Ingrid Solberg";
  const co = (n) => AK.co(n);
  const md = AK.md, days = AK.days;
  const route = () => (location.hash || "").slice(1);
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const strip = (s) => String(s).replace(/<[^>]+>/g, "");
  const btn = (label, attrs = "", ink = false, sm = true) => `<span class="btn${sm ? " sm" : ""}${ink ? " ink" : ""}" role="button" tabindex="0" ${attrs}>${label}</span>`;
  const mu = (t) => `<span class="a-people-mu">${t}</span>`;
  const ring = (t) => `<span class="who">${gl("ring")}${esc(t)}</span>`;
  const num = (t) => `<span class="num">${t}</span>`;
  const tr = (s, w) => `<span class="a-people-tr" style="max-width:${w}px" title="${esc(s)}">${esc(s)}</span>`;
  const two = (top, sub, w) => `<span class="a-people-2l"${w ? ` style="max-width:${w}px"` : ""}><span class="a-people-2t" title="${esc(strip(top))}">${top}</span>${sub ? `<span class="a-people-2s" title="${esc(strip(sub))}">${sub}</span>` : ""}</span>`;
  const li = (lead, main, end = "") => `<div class="a-people-li">${lead}<span class="x">${main}</span>${end ? `<span class="a-people-le">${end}</span>` : ""}</div>`;
  const secHead = (title, count, action = "", c = "") => `<div class="a-people-ch"><b>${esc(title)}</b>${count != null ? `<span class="ct num">${esc(count)}</span>` : ""}${c}${action ? `<span class="a-people-push">${action}</span>` : ""}</div>`;
  const field = (label, control, flag = "", hint = "") => `<div class="ak-field"><label>${esc(label)}${flag}</label>${control}${hint ? `<span class="s">${hint}</span>` : ""}</div>`;
  const REQ = ' <span class="req">Required</span>';
  const OPT = ' <span class="opt">Optional</span>';
  const select = (v) => `<div class="ak-select">${esc(v)} ${AK.i("down")}</div>`;
  const input = (v, tall = false, filled = false) => `<div class="ak-input${tall ? " tall" : ""}${filled ? " a-people-val" : ""}">${esc(v)}</div>`;
  const radio = (label, on, hint = "") => `<div class="a-people-radio${on ? " on" : ""}"><span class="a-people-dot" aria-hidden="true"></span><span>${esc(label)}${hint ? `<small>${esc(hint)}</small>` : ""}</span></div>`;
  const checkRow = (label, on, hint = "") => `<div class="a-people-radio">${AK.check(on)}<span>${esc(label)}${hint ? `<small>${esc(hint)}</small>` : ""}</span></div>`;
  const foot = (primary, toastText, link) => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-close-modal${toastText ? ` data-aptoast="${esc(toastText)}"` : ""}${link ? ` data-aplink="${esc(link)}"` : ""}>${esc(primary)}</button>`;
  const avChip = (n) => `<span class="ak-chip a-people-tochip">${AK.avatar(n, 18)}${esc(n)}</span>`;

  // ——— Data: WS-X90's role holders (program_role_assignments) and the open tasks of its Schedule (mod-risk.js) ———
  const ROLES = [
    ["R. Calloway", "Authorizing official", "AO", "Signs the authorization decision; the last step of a risk acceptance"],
    ["D. Okafor", "Lead assessor", "SCA", "Publishes assessment results"],
    ["Nadia Fournier", "Assessor", "SCA", "Records determinations; reviews evidence"],
    ["Local developer", "Assessor", "SCA", "Records determinations"],
    ["Joel Barrantes", "Information system security manager", "ISSM", "Second step of a risk acceptance; owns continuous monitoring"],
    ["Priya Raghavan", "Information system security officer", "ISSO", "First step of a risk acceptance; owns the package"],
    ["Ray Colston", "System owner", "SO", "Owns the POA&M and the remediation budget"],
  ];
  const TASKS = [
    ["t5", "Monthly STIG compliance scan", "blocked", "2026-11-01", "2026-11-11", "Joel Barrantes"],
    ["t6", "Monthly vulnerability scan — mission network", "in_progress", "2026-11-04", "2026-11-15", "Joel Barrantes"],
    ["t7", "Monthly POA&M review", "ready", "2026-11-12", "2026-11-21", "Priya Raghavan"],
    ["t8", "Quarterly privileged account review (AC-2, AC-6)", "in_progress", "2026-11-07", "2026-12-01", "Victor Amsel"],
    ["t9", "Quarterly audit log review sampling (AU-6)", "planned", "2026-12-03", "2026-12-23", "Nadia Fournier"],
    ["t10", "Quarterly configuration baseline audit (CM-2, CM-3)", "planned", "2026-12-08", "2026-12-28", "Ingrid Solberg"],
    ["t11", "Annual control subset assessment — AC and IA families", "planned", "2027-01-12", "2027-02-11", "Nadia Fournier"],
    ["t12", "Incident response tabletop (IR-3)", "planned", "2027-02-16", "2027-03-13", "Priya Raghavan"],
    ["t13", "Contingency plan test on a whole article (CP-4)", "planned", "2027-03-23", "2027-04-12", "Amara Bell"],
    ["t14", "Cyber resiliency exercise — Redundancy and Non-Persistence (SA-24)", "planned", "2027-05-02", "2027-06-01", "Wes Duarte"],
  ];
  const TSTAT = { blocked: "Blocked", in_progress: "In progress", ready: "Ready", planned: "Planned" };
  const OWNERS_ONLY = ["Victor Amsel", "Ingrid Solberg", "Amara Bell", "Wes Duarte"];
  const PERSONS = [...ROLES.map(([n, role, short, acts]) => ({ n, role, short, acts })), ...OWNERS_ONLY.map((n) => ({ n, role: null }))].map((p) => {
    const open = TASKS.filter((t) => t[5] === p.n).sort((a, b) => a[4].localeCompare(b[4]));
    const late = open.filter((t) => days(t[4]) < 0).length;
    const next = open[0] || null;
    const status = late ? ["bad", `${late} past due`] : next && days(next[4]) <= 14 ? ["warn", "Due soon"] : next ? ["none", "Planned"] : null;
    return { ...p, open, late, next, status };
  });
  const PERSON = Object.fromEntries(PERSONS.map((p) => [p.n, p]));
  const BY_DUE = PERSONS.filter((p) => p.next).sort((a, b) => a.next[4].localeCompare(b.next[4])).concat(PERSONS.filter((p) => !p.next));
  const BY_ROLE = PERSONS;
  // The Sep 18 ATO's conditions (mod-risk.js CONDITIONS), soonest first, and the package room's recipients (RECIPIENTS, ACCESS).
  const CONDS = [
    ["Expanded control set assessment before Milestone C", "2026-11-20", "WS-X90 Expanded Control Set Assessment ends Nov 20"],
    ["High-severity remediation items closed within 90 days", "2026-12-17", "12 high issues open"],
    ["SA-24 design review reported at the annual authorization review", "2027-09-18", "Annual authorization review"],
  ];
  const ROOM = { "R. Calloway": ["Full package · sign", "2027-09-17", ["Opened the SSP (version 1)", "Nov 12, 11:05"]], "D. Okafor": ["Full package", "2027-03-31"], "Joel Barrantes": ["Full package · share", "2027-09-17", ["Shared with the receiving AO's representative", "Nov 14, 16:20"]], "Priya Raghavan": ["Full package · share", "2027-09-17"], "Ray Colston": ["Read only", "2027-09-17"] };
  // Every DoD 8140 line is Example, as on today's DoD 8140 qualifications tab.
  const Q8140 = {
    "R. Calloway": ["611", "Authorizing Official/Designating Representative", "Advanced", "CGRC", 14, ["ok", "Qualified"]],
    "D. Okafor": ["612", "Security Control Assessor", "Advanced", "CISSP", 26, ["ok", "Qualified"]],
    "Nadia Fournier": ["612", "Security Control Assessor", "Intermediate", "CASP+", 9, ["warn", "Learning hours due Jan 31"]],
    "Local developer": ["612", "Security Control Assessor", "Basic", "Security+", 0, ["bad", "Not qualified"]],
    "Joel Barrantes": ["722", "Information Systems Security Manager", "Advanced", "CISSP", 31, ["ok", "Qualified"]],
    "Priya Raghavan": ["461", "Systems Security Analyst", "Intermediate", "Security+", 18, ["ok", "Qualified"]],
    "Ray Colston": ["801", "Program Manager", "Intermediate", "DAU PM", 6, ["warn", "Qualifying by Mar 1"]],
  };

  // ——— Data: privileged access reviews (WS-X90's task t8; the account lines and the other two reviews are Example) ———
  const PARS = [
    { id: "q1", t: "Quarterly privileged account review (AC-2, AC-6)", sched: "Quarterly schedule · Continuous monitoring check", scope: "Platform Management Controller, Maintenance Access Gateway", st: ["warn", "In review"], rev: "Victor Amsel", started: "2026-11-07", due: "2026-12-01", done: null, step: 1 },
    { id: "q0", t: "Privileged account review, Q3", sched: "Quarterly schedule · Continuous monitoring check", scope: "All LRUs with privileged accounts", st: ["ok", "Completed"], rev: "Victor Amsel", started: "2026-08-07", due: "2026-09-01", done: "2026-09-01", acc: [21, 21], ex: true, step: 3 },
    { id: "ml", t: "Maintenance Laptop local accounts", sched: "One-time review", scope: "Maintenance Laptop · LRU-019", st: ["none", "Draft"], rev: "Priya Raghavan", started: null, due: "2026-12-13", done: null, acc: [0, 6], ex: true, step: 0 },
  ];
  const ACCTS = [
    { id: "svc-maint-07", sys: "Platform Management Controller", owner: null, dec: "revoke", active: true, task: ["Remove svc-maint-07", "Joel Barrantes", "2026-11-24"] },
    { id: "j.barrantes-adm", sys: "Maintenance Access Gateway", owner: "Joel Barrantes", dec: "keep" },
    { id: "p.raghavan-adm", sys: "Platform Management Controller", owner: "Priya Raghavan", dec: "keep" },
    { id: "field-tech-03", sys: "Maintenance Access Gateway", owner: null, dec: "revoke", active: true },
    { id: "w.duarte-adm", sys: "Platform Management Controller", owner: "Wes Duarte", dec: null },
  ];
  const ACCT_OF = { "Joel Barrantes": "j.barrantes-adm", "Priya Raghavan": "p.raghavan-adm", "Wes Duarte": "w.duarte-adm" };
  const HIDDEN = { total: 13, keep: 7, owners: 13 }; // the 13 accounts the panel folds: all owned, 7 kept, 6 not decided

  // ——— Data: SYS-WSX90's 20 assets with their components and Block 1 firmware (mod-system.js SD) ———
  const SUBS = [["CN-109001", "Mission Computing Subsystem"], ["CN-109002", "Navigation & Timing Subsystem"], ["CN-109003", "Communications Subsystem"], ["CN-109004", "Payload Interface Subsystem"], ["CN-109005", "Platform Management Subsystem"], ["CN-109006", "Ground Support Subsystem"]];
  const INV = [
    ["AST-109001", "Mission Computer", "LRU-001", "MC-FW 4.2.1", "CN-109001", "hardware"],
    ["AST-109002", "Secure Boot Controller", "LRU-002", "SBC-FW 2.0.7", "CN-109001", "hardware"],
    ["AST-109003", "Cryptographic Services Module", "LRU-003", "CSM-FW 3.4.2", "CN-109001", "hardware"],
    ["AST-109004", "Navigation Processor", "LRU-004", "NAV-FW 1.9.0", "CN-109002", "hardware"],
    ["AST-109005", "Timing Receiver", "LRU-005", "TR-FW 5.1.3", "CN-109002", "hardware"],
    ["AST-109006", "Navigation Sensor Interface", "LRU-006", "NSI-FW 1.2.0", "CN-109002", "hardware"],
    ["AST-109007", "Protected Network Gateway", "LRU-007", "PNG-FW 6.0.4", "CN-109003", "hardware"],
    ["AST-109008", "Tactical Data Radio", "LRU-008", "TDR-FW 8.2.0", "CN-109003", "hardware"],
    ["AST-109009", "Internal Ethernet Switch", "LRU-009", "IES-OS 15.2(7)", "CN-109003", "hardware"],
    ["AST-109010", "Payload Interface Controller", "LRU-010", "PIC-FW 2.6.1", "CN-109004", "hardware"],
    ["AST-109011", "Payload Safety Interlock", "LRU-011", "PSI-FW 1.0.9", "CN-109004", "hardware"],
    ["AST-109012", "Payload Telemetry Unit", "LRU-012", "PTU-FW 3.3.0", "CN-109004", "hardware"],
    ["AST-109013", "Platform Management Controller", "LRU-013", "PMC-SW 4.2.1", "CN-109005", "hardware"],
    ["AST-109014", "Maintenance Access Gateway", "LRU-014", "MAG-FW 2.2.5", "CN-109005", "hardware"],
    ["AST-109015", "Secure Storage Module", "LRU-015", "SSM-FW 1.4.0", "CN-109005", "hardware"],
    ["AST-109016", "Update & Recovery Controller", "LRU-016", "URC-FW 3.0.2", "CN-109005", "hardware"],
    ["AST-109017", "Provisioning Workstation", "LRU-017", "PWS image 2026.06", "CN-109006", "hardware"],
    ["AST-109018", "Security Log Collector", "LRU-018", "SLC 4.2.1 (rule set 3.4)", "CN-109006", "software"],
    ["AST-109019", "Maintenance Laptop", "LRU-019", "MLT image 2026.06", "CN-109006", "hardware"],
    ["AST-109020", "Configuration Repository", "LRU-020", "CFG-REPO 2.8.0", "CN-109006", "software"],
  ];
  const PICK_PEOPLE = [[ME, ""], ["Priya Raghavan", "ISSO"], ["Joel Barrantes", "ISSM"], ["Ray Colston", "System owner"]];
  // The 10 firmware changes WS-X90 Block 1.1 (proposed) makes against Block 1, and the scope log's dated entries.
  const B11 = "WS-X90 Block 1.1 configuration (proposed)";
  const DRAFTS = [
    ["CN-109101", "LRU-001", "MC-FW 4.2.1", "MC-FW 4.3.0", "Separation kernel added for SC-29(1)"],
    ["CN-109102", "LRU-002", "SBC-FW 2.0.7", "SBC-FW 2.1.0", "Measured boot of every partition for SC-34"],
    ["CN-109107", "LRU-007", "PNG-FW 6.0.4", "PNG-FW 6.1.1", "Separate subnets per security domain for SC-7(22)"],
    ["CN-109108", "LRU-008", "TDR-FW 8.2.0", "TDR-FW 8.3.0", "Fallback protocol for CP-11"],
    ["CN-109114", "LRU-014", "MAG-FW 2.2.5", "MAG-FW 2.3.0", "Session non-persistence for SI-14"],
    ["CN-109115", "LRU-015", "SSM-FW 1.4.0", "SSM-FW 1.5.0", "Mission state replication for SC-36"],
    ["CN-109117", "LRU-017", "PWS image 2026.06", "PWS image 2026.10", ""],
    ["CN-109118", "LRU-018", "SLC 4.2.1 (rule set 3.4)", "SLC 4.3.0 (rule set 3.6)", "Pattern baselining for SI-4(13)"],
    ["CN-109119", "LRU-019", "MLT image 2026.06", "MLT non-persistent image 2026.10", "Non-persistent image for SI-14"],
    ["CN-109120", "LRU-020", "CFG-REPO 2.8.0", "CFG-REPO 2.9.0", "Signed image builds for SI-14(1)"],
  ].map(([el, lru, from, to, why]) => ({ id: "d:" + lru, el, lru, from, to, why }));
  const LOG = [
    { id: "l1", t: "LRU-001 Mission Computer takes Mission Computer", sub: "X800 Missile component set version 1", st: ["ok", "Recorded"], el: "CN-109101", src: "Library assignment", when: "2026-11-17" },
    { id: "l2", t: "LRU-018 Security Log Collector takes Audit Log Collector", sub: "G25 launch control component set version 1", st: ["ok", "Recorded"], el: "CN-109118", src: "Library assignment", when: "2026-11-17" },
    { id: "l3", t: "Host 10.20.4.99 marked not in boundary", sub: "A contractor's test set on the flightline network", st: ["ok", "Reason recorded"], el: "SYS-WSX90", src: "ACAS import", when: "2026-11-03", ex: true },
    { id: "l4", t: "A spare Maintenance Laptop returned to depot", sub: "Removed from the boundary", st: ["ok", "Recorded"], el: "CN-109119", src: "Inventory", when: "2026-10-21", ex: true },
    { id: "l5", t: "20 assets recorded on the boundary's components", sub: "", st: ["ok", "Recorded"], el: "SYS-WSX90", src: "Inventory", when: "2026-09-12" },
    { id: "l6", t: "WS-X90 Block 1 production configuration: 20 component pins", sub: "", st: ["ok", "Published"], el: "SYS-WSX90", src: "Configuration", when: "2026-07-20" },
  ];

  // ——— Data: the Mission Computer (mod-platform.js) ———
  const MC_CHANGED = [["AC-17(2)", "Protection of Confidentiality and Integrity Using Encryption", "To review"], ["SC-23", "Session Authenticity", "To review"], ["RA-5", "Vulnerability Monitoring and Scanning", "Not claimed"], ["SI-2", "Flaw Remediation", "Not claimed"]];
  const CONS = [
    { id: "x800", name: "X800 Missile", kind: "Product", el: "Element GS-MC", inh: null },
    { id: "wsx90", name: "WS-X90 Sentinel Mission System", kind: "PRG-1090", el: "LRU-001", inh: "50 of 54" },
    { id: "cusa", name: "Customer A · X800 Rail Integration", kind: "PRG-2101", el: "CA-GS-MC", inh: "53 of 54" },
    { id: "cusb", name: "Customer B · X800 Palletized Integration", kind: "PRG-2102", el: "CB-GS-MC", inh: "54 of 54" },
  ];
  const COMMENTS = [
    { who: "Ingrid Solberg", when: "Nov 14, 2:10 PM", text: `Offered CVE-2024-6387 from LRU-001. Version 2 carries OpenSSH 9.8p1. ${AK.mention("Priya Raghavan")}, accepting opens an issue in Customer A and Customer B.` },
    { who: "Priya Raghavan", role: "Owner", when: "Nov 15, 9:02 AM", text: "Reviewing. AC-17(2) and SC-23 need a look before anyone takes version 2." },
  ];

  // ——— State kept while the prototype is open: chosen rows, chip filters, owners and decisions set here ———
  const DEF = { pr: ["Joel Barrantes", "Priya Raghavan"], inv: ["AST-109001", "AST-109002", "AST-109003"], chg: DRAFTS.map((d) => d.id), acct: ["svc-maint-07", "field-tech-03"] };
  const SEL = {};
  const sel = (k) => SEL[k] || (SEL[k] = new Set(DEF[k] || []));
  const QV = {};
  const OWN = {};
  const DEC = {};
  let PICK = null; // no owner picker open at load (the comparison page drew one open)
  let LASTP = null;
  const decOf = (a) => (a.id in DEC ? DEC[a.id] : a.dec);
  function acctState() {
    const shown = ACCTS.map((a) => ({ ...a, d: decOf(a) }));
    const keep = HIDDEN.keep + shown.filter((a) => a.d === "keep").length;
    const revoke = shown.filter((a) => a.d === "revoke").length;
    const change = shown.filter((a) => a.d === "change").length;
    const decided = keep + revoke + change;
    return { shown, keep, revoke, change, decided, nd: HIDDEN.total + ACCTS.length - decided, owners: HIDDEN.owners + shown.filter((a) => a.owner).length, noted: shown.filter((a) => a.d === "revoke" && a.task).length, active: shown.filter((a) => a.d === "revoke" && a.active).length };
  }

  function redraw(focus) {
    const r = route();
    if (!S[r]) return;
    const main = document.getElementById("main"), top = main.scrollTop;
    main.innerHTML = S[r]();
    main.scrollTop = top;
    const el = focus && main.querySelector(focus);
    if (el) el.focus();
  }
  function redrawPanel(focus) {
    const panel = document.getElementById("panel");
    if (!LASTP || !panel || panel.hidden) return;
    const pb = panel.querySelector(".pbody"), p = P[LASTP[0]] && P[LASTP[0]](LASTP[1]);
    if (!pb || !p) return;
    const top = pb.scrollTop;
    pb.innerHTML = p.body;
    pb.scrollTop = top;
    const el = focus && pb.querySelector(focus);
    if (el) el.focus();
  }
  function toast(text, link) {
    document.querySelectorAll(".a-people-toastw").forEach((n) => n.remove());
    const w = document.createElement("div");
    w.className = "a-people-toastw";
    w.innerHTML = AK.toast(text, link);
    (document.getElementById("proto") || document.body).appendChild(w);
    setTimeout(() => w.remove(), 3200);
  }
  const closeMenus = (keep) => document.querySelectorAll("details.a-people-dd[open]").forEach((d) => { if (d !== keep) d.open = false; });
  const stop = (e) => { e.stopPropagation(); e.preventDefault(); };
  const inPanel = (el) => !!el.closest("#panel");

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    const hit = (s) => t.closest(s);
    let x;
    if ((x = hit("[data-apsel]"))) {
      stop(e);
      const key = x.dataset.apsel, id = x.dataset.apid, s = sel(key);
      if (id === "*") { const ids = x.dataset.apall.split("|").filter(Boolean); const all = ids.every((i) => s.has(i)); ids.forEach((i) => (all ? s.delete(i) : s.add(i))); }
      else if (s.has(id)) s.delete(id); else s.add(id);
      const f = `[data-apsel="${key}"][data-apid="${CSS.escape(id)}"]`;
      if (inPanel(x)) redrawPanel(f); else redraw(f);
      return;
    }
    if ((x = hit("[data-apdesel]"))) {
      stop(e);
      const key = x.dataset.apdesel;
      SEL[key] = new Set();
      if (inPanel(x)) redrawPanel(`[data-apsel="${key}"]`); else redraw(`[data-apsel="${key}"][data-apid="*"]`);
      return;
    }
    if ((x = hit("[data-apq]"))) { stop(e); QV[x.dataset.apq] = x.dataset.apv; redraw(`[data-apq="${x.dataset.apq}"][data-apv="${CSS.escape(x.dataset.apv)}"]`); return; }
    if ((x = hit("[data-apown]"))) { stop(e); OWN[x.dataset.apown] = x.dataset.apname; PICK = null; redraw(`[data-appick="${x.dataset.apown}"] > summary`); toast(`${x.dataset.apname} owns ${x.dataset.apown}`); return; }
    if ((x = hit("[data-apdec]"))) {
      stop(e);
      const id = x.dataset.apdec, k = x.dataset.apk, a = ACCTS.find((y) => y.id === id);
      DEC[id] = decOf(a) === k ? null : k;
      redraw(); redrawPanel(`[data-apdec="${CSS.escape(id)}"][data-apk="${k}"]`);
      return;
    }
    if ((x = hit("[data-apbulk]"))) {
      stop(e);
      const k = x.dataset.apbulk, n = sel("acct").size;
      sel("acct").forEach((id) => { DEC[id] = k; });
      redraw(); redrawPanel(`[data-apbulk="${k}"]`);
      toast(`${n} account${n === 1 ? "" : "s"} marked ${k === "keep" ? "Keep" : "Revoke"}`);
      return;
    }
    if ((x = hit("details.a-people-dd > summary"))) { e.stopPropagation(); closeMenus(x.parentElement); return; }
    if ((x = hit("[data-aptoast]"))) toast(x.dataset.aptoast, x.dataset.aplink);
    if ((x = hit(".a-people-popw, .a-people-menu"))) {
      const item = hit(".a-people-mi, .ak-pop-f");
      if (item) { const d = item.closest("details"); if (d) setTimeout(() => { d.open = false; }); }
      if (!hit("[data-modal], [data-go], [data-panel]")) e.stopPropagation();
      return;
    }
    if (!hit("details.a-people-dd")) closeMenus(null);
  }, true);
  document.addEventListener("toggle", (e) => {
    const d = e.target;
    if (!d || !d.matches || !d.matches("details.a-people-pick")) return;
    if (d.open) PICK = d.dataset.appick; else if (PICK === d.dataset.appick) PICK = null;
  }, true);
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (!t || !t.matches) return;
    if (e.key === "Escape" && document.querySelector("details.a-people-dd[open]")) { const open = t.closest && t.closest("details.a-people-dd[open]"); closeMenus(null); if (open) open.querySelector("summary").focus(); return; }
    if (e.key !== "Enter" && e.key !== " ") return;
    if (t.matches("[data-apsel], [data-apdesel], [data-apq], [data-apown], [data-apdec], [data-apbulk], .a-people-mi:not([data-modal]):not([data-go]):not([data-panel]), span[data-aptoast]")) { e.preventDefault(); e.stopPropagation(); t.click(); return; }
    if (t.matches("#panel .a-people-pan [data-panel]:not(button), #panel .a-people-pan [data-modal]:not(button), #panel .a-people-pan [data-go]:not(button), .ak-pop-f[data-modal]")) { e.preventDefault(); e.stopPropagation(); t.click(); }
  }, true);
  window.addEventListener("hashchange", () => { LASTP = null; document.querySelectorAll(".a-people-toastw").forEach((n) => n.remove()); });

  // ——— Shared pieces: checkboxes, tables, tabs with callouts, chips, toolbars, the selection bar, menus ———
  const cb = (key, id, label) => { const on = sel(key).has(id); return `<span class="a-people-cb" role="checkbox" tabindex="0" aria-checked="${on}" aria-label="${esc(label)}" data-apsel="${esc(key)}" data-apid="${esc(id)}">${AK.check(on)}</span>`; };
  const cbAll = (key, ids, label) => { const s = sel(key); const all = ids.length > 0 && ids.every((i) => s.has(i)); const some = ids.some((i) => s.has(i)); return `<span class="a-people-cb" role="checkbox" tabindex="0" aria-checked="${all ? "true" : some ? "mixed" : "false"}" aria-label="${esc(label)}" data-apsel="${esc(key)}" data-apid="*" data-apall="${esc(ids.join("|"))}">${AK.check(all)}</span>`; };
  function tbl({ cols, rows, total, panel = "", nm = 1, cls = "", pager = true, label = "" }) {
    const body = rows.length ? rows.map((r) => {
      const pk = r.panel !== undefined ? r.panel : panel;
      const attrs = r.go ? ` data-go="${esc(r.go)}"` : pk ? ` data-panel="${esc(pk)}" data-id="${esc(r.id || "")}"` : "";
      return `<tr tabindex="0"${r.sel ? ' class="sel"' : ""}${attrs}>${r.cells.map((c, i) => `<td${i === nm ? ' class="nm"' : ""}>${c}</td>`).join("")}</tr>`;
    }).join("") : `<tr class="a-people-empty"><td colspan="${cols.length}">${ring("Nothing matches this view.")}</td></tr>`;
    return `<div class="frame ${cls}"><div class="tablebox"><table${label ? ` aria-label="${esc(label)}"` : ""}><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>${pager ? `<div class="pager"><span class="num">${rows.length ? `1–${rows.length} of ${fmt(total)}` : `0 of ${fmt(total)}`}</span><span>25 per page · ‹ ›</span></div>` : ""}</div>`;
  }
  const tabCo = (html, cos) => { for (const [lab, n] of Object.entries(cos)) if (n) html = html.replace(new RegExp(`(>${reEsc(esc(lab))}(?:<span class="ct num">[^<]*</span>)?)(</span>)`), `$1${co(n)}$2`); return html; };
  const tabs = (list, cos = {}, label) => tabCo(AK.tabs(list, label), cos);
  const ptabs = (kind, base, list, cur, cos = {}) => tabs(list.map(([k, l, n]) => [l, n, `@p:${k}`, k === cur]), cos, "Record sections")
    .replace(/data-go="@p:([^"]+)"/g, (m, k) => `data-panel="${kind}" data-id="${esc(base + "|" + k)}"`);
  const chips = (key, list, c = "") => { const on = QV[key] || list[0][0]; return `<div class="views a-people-views" role="group" aria-label="Quick views">${list.map(([v, l, n]) => `<button type="button" class="qv a-people-qv${on === v ? " on" : ""}" aria-pressed="${on === v}" data-apq="${esc(key)}" data-apv="${esc(v)}">${esc(l)} <span class="num">${fmt(n)}</span></button>`).join("")}${c}</div>`; };
  const menuItems = (items) => items.map(([l, a, s]) => `<span role="menuitem" tabindex="0" class="a-people-mi" ${a || ""}>${l}${s ? `<span class="s">${s}</span>` : ""}</span>`).join("");
  const more = (label, items) => `<details class="a-people-dd a-people-more"><summary class="btn" aria-label="${esc(label)}" title="${esc(label)}">${AK.i("dots")}</summary><div class="a-people-menu" role="menu">${menuItems(items)}</div></details>`;
  const dd = (label, items, { ink = false, sm = false, start = false } = {}) => `<details class="a-people-dd"><summary class="btn${ink ? " ink" : ""}${sm ? " sm" : ""}">${label}${AK.i("down")}</summary><div class="a-people-menu${start ? " start" : ""}" role="menu">${menuItems(items)}</div></details>`;
  const fltDD = (label, items) => `<details class="a-people-dd a-people-fdd"><summary class="flt">${esc(label)} ⌄</summary><div class="a-people-menu start" role="menu">${menuItems(items)}</div></details>`;
  const filters = (search, list, end = "") => `<div class="tools a-people-tools"><span class="in">${esc(search)}</span>${list.map((f) => (f.startsWith("<") ? f : `<span class="flt">${esc(f)} ⌄</span>`)).join("")}<span class="flt sub">+ Add filter</span>${end ? `<span class="a-people-push">${end}</span>` : ""}</div>`;
  function bulk(key, actions, c = "") {
    let html = AK.bulk({ count: sel(key).size, actions: actions.map((a) => a[0]), co: c });
    html = html.replace('<span class="ak-link">Deselect</span>', `<span class="ak-link" role="button" tabindex="0" data-apdesel="${esc(key)}">Deselect</span>`);
    for (const [label, attrs] of actions) if (attrs) html = html.replace(`<span class="btn sm">${esc(label)}</span>`, `<span class="btn sm" role="button" tabindex="0" ${attrs}>${esc(label)}</span>`);
    return html;
  }
  const selbar = (search, key, actions, c) => `<div class="tools a-people-selbar"><span class="in">${esc(search)}</span>${bulk(key, actions, c)}</div>`;
  const ownerEdit = (n, attrs, label = "Unassigned") => `<span class="a-people-own" role="button" tabindex="0" ${attrs} title="Change owner">${AK.owner(n, { label })}${AK.i("pen")}</span>`;

  // ═════════════ 1. People ═════════════
  const peopleHead = () => AK.indexHead({ title: "People", desc: "Role holders and task owners of WS-X90",
    actions: `${more("More people actions", [["Send one-time reminder", 'data-modal="a-people-remind" data-id="all"'], ["Manage recurring reminders", 'data-modal="a-people-recurring"'], ["Export", 'data-aptoast="People exported (.csv)"']])}${btn("Assign a role", 'data-modal="risk-role"', true, false)}` });
  const peopleTabs = (cur, c = 0) => tabs([["People", 11, "after-people-register", cur === "people"], ["Roles", 6, "after-people-roles", cur === "roles"], ["DoD 8140 qualifications", 7, "people-8140", false], ["Privileged access reviews", 3, "after-access-reviews", cur === "access"]], { People: c }, "People");
  const personCell = (n) => `<span class="a-people-pers">${AK.avatar(n, 26)}<span>${esc(n)}</span></span>`;
  const roleCell = (p) => (p.role ? `<span class="a-people-role">${tr(p.role, 236)}${tag(p.short)}</span>` : mu("No RMF role"));
  const statusCell = (p) => (p.status ? pill(p.status[0], p.status[1]) : mu("No open tasks"));
  const nextCell = (p) => (p.next ? two(AK.due(p.next[4]), esc(p.next[1]), 220) : AK.due(null));
  function peopleScreen({ key, byRole = false, withCo = false }) {
    const c = (n) => (withCo ? co(n) : "");
    const F = { all: () => true, late: (p) => p.late > 0, soon: (p) => !!p.status && p.status[0] === "warn", nostart: (p) => !!p.role, planned: (p) => !!p.status && p.status[0] === "none", none: (p) => !p.status };
    const count = (k) => PERSONS.filter(F[k]).length;
    const list = (byRole ? BY_ROLE : BY_DUE).filter(F[QV[key] || "all"] || F.all);
    const s = sel(key), chosen = [...s];
    const bar = s.size
      ? selbar("Search people", key, [["Send reminder", `data-modal="a-people-remind" data-id="${esc(chosen.join("|"))}"`], ["Change role", `data-modal="a-people-change-role" data-id="${esc(chosen.join("|"))}"`], ["End role", `data-modal="a-people-end" data-id="${esc(chosen.join("|"))}"`]], c(5))
      : filters("Search people", ["Role", fltDD("Task status", [["Past due", `data-apq="${key}" data-apv="late"`, String(count("late"))], ["Due soon", `data-apq="${key}" data-apv="soon"`, String(count("soon"))], ["Planned", `data-apq="${key}" data-apv="planned"`, String(count("planned"))], ["No open tasks", `data-apq="${key}" data-apv="none"`, String(count("none"))]]), "Organization"]);
    return h.page(
      peopleHead(),
      peopleTabs("people", withCo ? 2 : 0),
      AK.banner({ tone: "warn", text: "WS-X90 has no reminders scheduled. <b>Joel Barrantes</b> has 2 tasks past due.", action: "Schedule reminders" })
        .replace('<span class="btn sm">Schedule reminders</span>', btn("Schedule reminders", 'data-modal="a-people-recurring"')),
      chips(key, [["all", "All", 11], ["late", "Past due", 1], ["soon", "Due soon", 2], ["nostart", "No start date", 7]], c(1)),
      bar,
      tbl({
        cols: [cbAll(key, list.map((p) => p.n), "Select every person"), "Person", "Role", `Task status${c(3)}`, "Next due", `Last reminded${c(4)}`, "Since"],
        rows: list.map((p) => ({ id: p.n, sel: s.has(p.n), cells: [cb(key, p.n, `Select ${p.n}`), personCell(p.n), roleCell(p), statusCell(p), nextCell(p), mu("Never"), p.role ? ring("Not recorded") : ""] })),
        total: list.length, panel: "a-people-person", cls: "a-people-tight", label: "People",
      }),
      AK.note("The banner, the reminders, the selection bar and the Roles tab are proposed, and the list leaves out the workspace's 6 people with no WS-X90 role or task. Tasks and due dates are WS-X90's Schedule; Last reminded reads Never because WS-X90 has sent none."),
    );
  }
  S["after-people-register"] = () => peopleScreen({ key: "pr", withCo: true });

  // ═════════════ 2. A person (the drawer behind which People is sorted by role) ═════════════
  S["after-person-drawer"] = () => peopleScreen({ key: "pd", byRole: true });
  const addLink = (label, n, kind) => `<span class="ak-link a-people-add" role="button" tabindex="0" data-modal="${kind}" data-id="${esc(label + "|" + n)}">${AK.i("plus")}${esc(label)}</span>`;
  P["a-people-person"] = (id) => {
    const [n0, tab0] = String(id || "R. Calloway").split("|");
    const p = PERSON[n0] || PERSON["R. Calloway"];
    const ao = p.short === "AO";
    const work = ao ? 1 + CONDS.length : p.open.length;
    const tl = [["work", "Work", work], ["access", "Access"], ["quals", "Qualifications"]];
    if (ao) tl.push(["decisions", "Decisions", 1]);
    if (p.role) tl.push(["handover", "Hand over"]);
    const tab = tl.some((x) => x[0] === tab0) ? tab0 : "work";
    LASTP = ["a-people-person", id];
    const withCo = route() === "after-person-drawer" && ao && tab === "work";
    const c = (k) => (withCo ? co(k) : "");
    const head = `<div class="a-people-ph">${AK.avatar(p.n, 40)}<div class="a-people-pht"><h4>${esc(p.n)}</h4>${mu(p.role ? `${esc(p.role)} · ${esc(p.short)}` : "No RMF role in WS-X90")}</div>
      ${more(`More actions for ${p.n}`, [[p.role ? "Change role" : "Assign a role", `data-modal="risk-role"${p.role ? ` data-id="${esc(p.n)}"` : ""}`], ["Send reminder", `data-modal="a-people-remind" data-id="${esc(p.n)}"`], ...(p.role ? [["End role", `data-modal="a-people-end" data-id="${esc(p.n)}"`]] : [])])}</div>`;
    const facts = AK.railCard("Details", [
      ["Role", p.role ? `${esc(p.role)} ${tag(p.short)}` : mu("No RMF role")],
      ...(p.role ? [["Since", addLink("Add start date", p.n, "a-people-date")], ["Ends", addLink("Add end date", p.n, "a-people-date")]] : []),
      ["Program", "WS-X90 Sentinel Mission System"],
      ["Note", addLink("Add note", p.n, "a-people-note")],
    ], { co: c(5) });
    let body = "";
    if (tab === "work") {
      const taskRow = (t) => AK.task({ title: t[1], source: `${TSTAT[t[2]]} · WS-X90 continuous monitoring — FY2027`, due: t[4] });
      body = `<div class="a-people-wh"><h5>Open work</h5>${AK.remind({ label: "Remind" }).replace('<span class="btn sm">', `<span class="btn sm" role="button" tabindex="0" data-modal="a-people-remind" data-id="${esc(p.n)}">`)}${c(2)}</div>
        ${ao ? `<div class="a-people-work"><div class="a-people-tg">His decision${c(1)}</div>
          ${AK.task({ title: "Decide package version 2", source: "Not submitted: SSP 3 is a draft and the increment 2 results are unpublished", due: null })}
          <div class="a-people-tg">Conditions his Sep 18 ATO set · met by the program</div>
          ${CONDS.map(([t, d, s]) => AK.task({ title: t, source: s, due: d })).join("")}</div>
          <p class="a-people-ho">Ending R. Calloway's period? <span class="ak-link" role="link" tabindex="0" data-panel="a-people-person" data-id="R. Calloway|handover">Hand over</span>${c(4)}</p>`
        : p.open.length ? `<div class="a-people-work">${p.open.map(taskRow).join("")}</div>` : AK.empty({ title: "No open work", line: "No task in WS-X90's Schedule names them." })}`;
    } else if (tab === "access") {
      const room = ROOM[p.n], acct = ACCT_OF[p.n], a = acct && ACCTS.find((x) => x.id === acct);
      body = `${AK.card(`${secHead("Package room")}${room ? li(gl("check"), esc(room[0]), `Expires ${md(room[1])}`) + (room[2] ? li(gl("info"), esc(room[2][0]), esc(room[2][1])) : "") : li(gl("ring"), "No access to the authorization package")}`)}
        ${AK.card(`${secHead("Privileged accounts", null, a ? EX : "")}${a ? li(gl(decOf(a) === "keep" ? "check" : decOf(a) === "revoke" ? "diamond" : "ring"), `<span class="a-people-mono">${esc(a.id)}</span> · ${esc(a.sys)}`, decOf(a) === "keep" ? "Keep" : decOf(a) === "revoke" ? "Revoke" : "Not decided") : li(gl("ring"), "None in the quarterly review")}`)}`;
    } else if (tab === "quals") {
      const q = Q8140[p.n];
      body = AK.card(`${secHead("DoD 8140", null, q ? EX : "")}${q ? `${li(gl(q[5][0] === "ok" ? "check" : q[5][0] === "warn" ? "clock" : "diamond"), `${tag(q[0])} ${esc(q[1])} · ${esc(q[2])}`, pill(q[5][0], q[5][1]))}${li(gl("info"), `Foundational ${esc(q[3])} · ${q[4]} of 20 learning hours`)}` : li(gl("ring"), "No DCWF work role recorded")}`);
    } else if (tab === "decisions") {
      body = `${AK.card(`${secHead("ATO with conditions", null, pill("ok", "Signed"))}<dl class="ak-kv"><dt>Decided</dt><dd>Sep 18, 2026</dd><dt>ATD</dt><dd>Sep 17, 2029</dd><dt>Package</dt><dd>Version 1 · published Sep 2</dd><dt>Conditions</dt><dd>3 open</dd></dl>`)}
        ${AK.card(`${secHead("Package version 2", null, pill("none", "Pending"))}${li(gl("ring"), "Not submitted: SSP 3 is a draft and the increment 2 results are unpublished")}`)}`;
    } else {
      const moves = ao ? ["Package version 2's decision moves to the successor", "Signing in the package room moves on the end date", "The Sep 18 decision and its three conditions stay signed by R. Calloway"] : [`What the role does moves to the successor: ${p.acts.charAt(0).toLowerCase() + p.acts.slice(1)}`, "Package room access ends on the end date"];
      body = AK.card(`<b class="a-people-q">End ${esc(p.n)}'s period as ${esc(p.role.toLowerCase())}?</b><p class="a-people-p">Ending asks the successor and the end date, then names what moves. WS-X90 keeps one ${esc(p.role.toLowerCase())} at a time.</p>
        <div class="a-people-moves"><span class="a-people-mu">What moves ${EX}</span>${moves.map((m) => li(gl("info"), esc(m))).join("")}</div>
        <div class="btns">${btn("End role", `data-modal="a-people-end" data-id="${esc(p.n)}"`, true)}</div>`);
    }
    const note = ao ? AK.note("Remind, the Hand over tab and End role are proposed; the work is package version 2 and the Sep 18 ATO's three conditions, from WS-X90's records.") : AK.note("Remind and the tabs are proposed; the work is WS-X90's Schedule.");
    return { label: "Person preview", body: `<div class="a-people-pan">${head}${facts}${ptabs("a-people-person", p.n, tl, tab, { Work: c(3) ? 3 : 0 })}${body}${note}</div>` };
  };

  // ═════════════ 3. Privileged access reviews ═════════════
  function donut(parts, total, unit) {
    const r = 34, C = 2 * Math.PI * r, gap = 2;
    let off = 0;
    const segs = parts.filter((x) => x[0] > 0).map(([n, col, label]) => {
      const len = (n / total) * C, dash = Math.max(len - gap, 0.5);
      const s = `<circle cx="44" cy="44" r="${r}" fill="none" style="stroke:${col}" stroke-width="12" stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 44 44)"><title>${esc(label)}: ${n}</title></circle>`;
      off += len;
      return s;
    }).join("");
    return `<svg class="a-people-donut" width="104" height="104" viewBox="0 0 88 88" role="img" aria-label="${esc(parts.map(([n, , l]) => `${l} ${n}`).join(", "))}">${segs}<text x="44" y="43" text-anchor="middle" class="a-people-dn">${total}</text><text x="44" y="56" text-anchor="middle" class="a-people-du">${esc(unit)}</text></svg>`;
  }
  function donutCard(c) {
    const k = acctState();
    const parts = [[k.keep, "var(--ok)", "Keep", "check"], [k.revoke, "var(--bad)", "Revoke", "diamond"], ...(k.change ? [[k.change, "var(--warn)", "Change privileges", "clock"]] : []), [k.nd, "var(--track)", "Not decided", "ring"]];
    return AK.card(`${secHead("Accounts in the quarterly review", null, "", `${EX}${c}`)}
      <div class="a-people-dw">${donut(parts, HIDDEN.total + ACCTS.length, "accounts")}<div class="a-people-dl">${parts.map(([n, , l, g]) => `<div class="a-people-dlr">${gl(g)}<span>${esc(l)}</span><b class="num">${n}</b></div>`).join("")}</div></div>`, { cls: "a-people-dcard" });
  }
  function todoCard() {
    const rows = [
      ["q1", "Complete review", "Quarterly privileged account review", "Victor Amsel", "2026-12-01", false],
      ["q1|changes", "Remove access", "svc-maint-07 and field-tech-03, revoked and still active", undefined, "2026-11-24", true],
      ["ml", "Start review", "Maintenance Laptop local accounts", "Priya Raghavan", "2026-12-13", true],
    ];
    return AK.card(`${secHead("To-do list", 3)}<div class="a-people-todos">${rows.map(([id, t, s, o, d, ex]) => {
      let html = AK.task({ title: t, source: s, owner: o, due: d });
      if (ex) html = html.replace("<span></span>", EX);
      return html.replace('<div class="ak-task', `<div role="button" tabindex="0" data-panel="a-people-par" data-id="${id}" class="a-people-todo ak-task`);
    }).join("")}</div>`, { cls: "a-people-tcard" });
  }
  function reviewCells(r) {
    const k = acctState();
    const acc = r.id === "q1" ? `${num(`${k.decided} of ${HIDDEN.total + ACCTS.length}`)} ${EX}` : num(`${r.acc[0]} of ${r.acc[1]}`);
    return [
      two(`${esc(r.t)}${r.ex ? " " + EX : ""}`, esc(r.sched), 330),
      AK.owner(r.rev),
      r.started ? num(md(r.started)) : mu("Not started"),
      r.done ? num(md(r.due)) : AK.due(r.due, { prefix: false }),
      r.done ? num(md(r.done)) : "",
      pill(r.st[0], r.st[1]),
      acc,
    ];
  }
  function accessScreen(withCo) {
    const c = (n) => (withCo ? co(n) : "");
    return h.page(
      peopleHead(),
      peopleTabs("access"),
      `<div class="grid2 a-people-cards">${donutCard(c(1))}${todoCard()}</div>`,
      filters("Search reviews", ["Reviewer", "Status"], `${dd("Create", [["One-time review", 'data-modal="a-people-review-new"'], ["Schedule", 'data-modal="a-people-schedule"', "Repeats a check"]], { ink: true, sm: true })}${c(2)}`),
      tbl({ cols: ["Review", "Reviewer", "Started", `Due${c(3)}`, "Completed", "Status", "Accounts decided"], rows: PARS.map((r) => ({ id: r.id, cells: reviewCells(r) })), total: 3, panel: "a-people-par", nm: 0, cls: "a-people-tight", label: "Privileged access reviews" }),
      AK.note("The account split, the Q3 and Maintenance Laptop reviews and the removal step are invented. The quarterly review (Victor Amsel, Nov 7 to Dec 1) is WS-X90's Schedule task and repeats with the Privileged account review check on Continuous monitoring."),
    );
  }
  S["after-access-reviews"] = () => accessScreen(true);

  // ═════════════ 4. A privileged access review (the panel) ═════════════
  S["after-access-review"] = () => accessScreen(false);
  const SEG = [["keep", "Keep", "ok", "check"], ["revoke", "Revoke", "bad", "x"], ["change", "Change privileges", "warn", "pen"]];
  const seg = (id, d) => `<span class="a-people-seg" role="radiogroup" aria-label="Decision for ${esc(id)}">${SEG.map(([k, l, tone, ic]) => `<span role="radio" tabindex="0" aria-checked="${d === k}" class="a-people-sb${d === k ? " on " + tone : ""}" data-apdec="${esc(id)}" data-apk="${k}">${d === k ? AK.i(ic) : ""}${l}</span>`).join("")}</span>`;
  const stepper = (step) => `<div class="wiz a-people-wiz" aria-label="Review steps">${["Draft", "In review", "Completed"].map((s, i) => `<span class="${i === step ? "on" : ""}"><i>${i < step ? "✓" : i + 1}</i>${s}</span>`).join("")}</div>`;
  function acctRow(a, first, c) {
    const d = a.d, on = sel("acct").has(a.id);
    const need = d === "revoke" && !a.task;
    return `<div class="a-people-acct${on ? " sel" : ""}">
      <div class="a-people-ah">${cb("acct", a.id, `Select ${a.id}`)}<span class="x"><b class="a-people-mono">${esc(a.id)}</b><span class="s">${esc(a.sys)}</span></span>${ownerEdit(a.owner, `data-modal="a-people-acct-owner" data-id="${esc(a.id)}"`)}${first ? c(2) : ""}</div>
      <div class="a-people-ad">${seg(a.id, d)}${first ? c(1) : ""}${d === "revoke" && a.active ? pill("bad", "Still active") : ""}</div>
      ${d === "revoke" && a.task ? `<div class="a-people-at">${AK.task({ title: a.task[0], owner: a.task[1], due: a.task[2] })}${first ? c(3) : ""}</div>` : ""}
      ${need ? `<div class="a-people-need">${AK.i("flag")}<span class="ak-link" role="button" tabindex="0" data-modal="a-people-task" data-id="${esc(a.id)}">Add a note or create a task</span><span class="req">Required</span></div>` : ""}
    </div>`;
  }
  P["a-people-par"] = (id) => {
    const [rid, tab0] = String(id || "q1").split("|");
    const r = PARS.find((x) => x.id === rid) || PARS[0];
    const tab = tab0 || "accounts";
    LASTP = ["a-people-par", id];
    const withCo = route() === "after-access-review" && r.id === "q1" && tab === "accounts";
    const c = (k) => (withCo ? co(k) : "");
    if (r.id !== "q1") {
      const done = r.id === "q0";
      return { label: "Access review preview", body: `<div class="a-people-pan">
        <div class="a-people-rh"><div class="a-people-rht"><h4>${esc(r.t)} ${EX}</h4>${pill(r.st[0], r.st[1])}</div><div class="a-people-rha">${done ? btn(`${AK.i("upload")}Export`) : btn("Start review", 'data-aptoast="Review started"', true)}</div></div>
        ${AK.facts([["Reviewer", AK.owner(r.rev)], ["Started", r.started ? md(r.started) : mu("Not started")], ["Due", done ? md(r.due) : AK.due(r.due)], ["Scope", esc(r.scope)]])}
        ${stepper(r.step)}
        ${AK.card(`${secHead("Conduct the review")}${[["Assign an owner to each account", done ? 21 : 2, r.acc[1]], ["Keep, revoke or change each account", r.acc[0], r.acc[1]], ["Note or task for each revoked account", done ? 1 : 0, done ? 1 : 0]].map(([l, d2, t]) => `<div class="a-people-cl${t && d2 === t ? " done" : ""}"><span class="ak-ring sm${t && d2 === t ? " done" : ""}"></span><span>${l}</span><b class="num">${t ? `${d2} of ${t}` : "None revoked"}</b></div>`).join("")}`, { cls: "a-people-check" })}
        ${AK.note(done ? "This review and its counts are invented: the quarter before WS-X90's records start." : "This review, its six accounts and its owner are invented.")}</div>` };
    }
    const k = acctState(), total = HIDDEN.total + ACCTS.length;
    const why = k.nd ? `${k.nd} account${k.nd === 1 ? "" : "s"} not decided` : k.active ? `${k.active} revoked account${k.active === 1 ? "" : "s"} still active` : "";
    const head = `<div class="a-people-rh"><div class="a-people-rht"><h4>${esc(r.t)}</h4>${pill(r.st[0], r.st[1])}</div>
      <div class="a-people-rha">${why ? `<span class="btn sm ink a-people-off" role="button" aria-disabled="true" aria-describedby="a-people-why" tabindex="0">Complete review</span><span class="a-people-mu" id="a-people-why">${why}</span>` : btn("Complete review", 'data-aptoast="Review completed"', true)}</div></div>`;
    const changed = k.shown.filter((a) => a.d === "revoke" || a.d === "change");
    let body;
    if (tab === "changes") {
      body = `<div class="a-people-chgs">${changed.map((a) => AK.card(`<div class="a-people-ah a-people-ah2"><span class="x"><b class="a-people-mono">${esc(a.id)}</b><span class="s">${esc(a.sys)}</span></span>${pill(a.d === "revoke" ? "bad" : "warn", a.d === "revoke" ? "Revoke" : "Change privileges")}</div>
        <dl class="ak-kv"><dt>Note</dt><dd>${a.id === "svc-maint-07" ? "Contractor maintenance account; the support contract ended Oct 31." : `<span class="a-people-need">${AK.i("flag")}<span class="ak-link" role="button" tabindex="0" data-modal="a-people-task" data-id="${esc(a.id)}">Add a note or create a task</span><span class="req">Required</span></span>`}</dd>
        <dt>Task</dt><dd>${a.task ? `${esc(a.task[0])} · ${pill("none", "Open")}` : mu("None")}</dd>
        <dt>Assigned to</dt><dd>${a.task ? AK.owner(a.task[1]) : mu("Nobody")}</dd>
        <dt>Remediation</dt><dd>${a.active ? pill("bad", "Still active") : pill("none", "Not started")}</dd></dl>`)).join("") || AK.empty({ title: "No access changes", line: "Nothing is revoked or changed yet." })}</div>`;
    } else {
      const accts = k.shown;
      body = `${sel("acct").size ? bulk("acct", [["Keep", 'data-apbulk="keep"'], ["Revoke", 'data-apbulk="revoke"'], ["Assign owner", `data-modal="a-people-acct-owner" data-id="${esc([...sel("acct")].join("|"))}"`], ["Create task", `data-modal="a-people-task" data-id="${esc([...sel("acct")].join("|"))}"`]], c(5)) : `<div class="tools a-people-tools a-people-ptools"><span class="in">Search accounts</span><span class="flt">Decision ⌄</span><span class="flt">Owner ⌄</span></div>`}
        <div class="a-people-accts">${accts.map((a, i) => acctRow(a, i === 0, c)).join("")}</div>
        <p class="a-people-ho">${num(`${HIDDEN.total} more accounts`)} · <span class="ak-link" role="button" tabindex="0">Show all ${total}</span></p>`;
    }
    return { label: "Access review preview", body: `<div class="a-people-pan">${head}
      ${AK.facts([["Reviewer", AK.owner(r.rev)], ["Started", md(r.started)], ["Due", AK.due(r.due)], ["Scope", esc(r.scope)]])}
      ${stepper(r.step)}
      ${AK.card(`${secHead("Conduct the review", null, "", c(4))}${[["Assign an owner to each account", k.owners, total], ["Keep, revoke or change each account", k.decided, total], ["Note or task for each revoked account", k.noted, k.revoke]].map(([l, d2, t]) => `<div class="a-people-cl${t && d2 === t ? " done" : ""}"><span class="ak-ring sm${t && d2 === t ? " done" : ""}"></span><span>${l}</span><b class="num">${t ? `${d2} of ${t}` : "None revoked"}</b></div>`).join("")}`, { cls: "a-people-check" })}
      ${ptabs("a-people-par", r.id, [["accounts", "Accounts", total], ["changes", "Access changes", changed.length]], tab)}
      ${body}
      ${AK.note("Every account, owner, decision, task and count in this panel is invented; the review, Victor Amsel, Nov 7 and Dec 1 are WS-X90's.")}</div>` };
  };

  // ═════════════ 5. Inventory ═════════════
  const invHead = () => AK.indexHead({ title: "Inventory", desc: "SYS-WSX90 authorization boundary · WS-X90 Block 1 production configuration", actions: `${btn("Import scan", "", false, false)}${btn("Add asset", "", true, false)}` });
  const invTabs = (cur) => tabs([["Assets", 20, "after-inventory", cur === "assets"], ["Discovered by scans", 5, null, false], ["Scope changes", 16, "after-scope-changes", cur === "changes"]], {}, "Inventory");
  function picker(id, c = "") {
    const names = PICK_PEOPLE.map((p) => p[0]);
    let i = 0;
    return `<div class="a-people-popw">${AK.ownerPicker({ you: ME, people: PICK_PEOPLE })
      .replace("<span>Search people</span></div>", `<span>Search people</span>${c}</div>`)
      .replace(/<div class="ak-pop-r">/g, () => `<div class="ak-pop-r" role="option" tabindex="0" data-apown="${esc(id)}" data-apname="${esc(names[i++] || ME)}">`)
      .replace(`${AK.i("x")}Unassign owner`, `${AK.i("plus")}Assign an organization`)
      .replace('<div class="ak-pop-f">', `<div class="ak-pop-f" role="button" tabindex="0" data-modal="a-people-assign" data-id="${esc(id)}">`)}</div>`;
  }
  const ownerCell = (id, c = "") => { const o = OWN[id]; return `<details class="a-people-dd a-people-pick" data-appick="${esc(id)}"${PICK === id ? " open" : ""}><summary class="a-people-ownbtn${o ? " set" : ""}" aria-label="Owner of ${esc(id)}">${o ? AK.owner(o) : `${AK.avatar(null, 20)}<span>Assign owner</span>`}${AK.i("down")}</summary>${picker(id, c)}</details>`; };
  const scopeCell = (a) => `<details class="a-people-dd a-people-scoped"><summary class="a-people-scope" aria-label="Scope of ${esc(a[0])}">In SYS-WSX90${AK.i("down")}</summary><div class="a-people-menu" role="menu">${menuItems([["Mark not in boundary…", `data-modal="ak-reason" data-id="${esc(`Mark not in boundary|${a[0]} ${a[1]} (${a[2]}) leaves SYS-WSX90. The reason, the date and any evidence show on the asset and under Scope changes.`)}"`]])}</div></details>`;
  S["after-inventory"] = () => {
    const v = QV.inv || "all";
    const list = INV.filter((a) => (v === "all" ? true : v.startsWith("sub:") ? a[4] === v.slice(4) : a[5] === v.slice(5)));
    const s = sel("inv"), chosen = [...s];
    const noOwner = INV.filter((a) => !OWN[a[0]]).length;
    const item = (val, label, n, full) => `<button type="button" class="a-people-ki${v === val ? " on" : ""}" aria-pressed="${v === val}" data-apq="inv" data-apv="${esc(val)}"${full ? ` title="${esc(full)}" aria-label="${esc(full)}, ${n}"` : ""}><span>${esc(label)}</span><span class="num">${n}</span></button>`;
    const kinds = `<nav class="a-people-kinds" aria-label="Asset groups"><div class="a-people-kh a-people-kh0">${co(1)}</div>${item("all", "All assets", INV.length)}<div class="a-people-kh">By subsystem</div>${SUBS.map(([code, n]) => item("sub:" + code, n.replace(/ Subsystem$/, ""), INV.filter((a) => a[4] === code).length, n)).join("")}<div class="a-people-kh">By kind</div>${item("kind:hardware", "Hardware", INV.filter((a) => a[5] === "hardware").length)}${item("kind:software", "Software", INV.filter((a) => a[5] === "software").length)}</nav>`;
    const bar = s.size
      ? selbar("Search assets", "inv", [["Assign owner", `data-modal="a-people-assign" data-id="${esc(chosen.join("|"))}"`], ["Mark not in boundary", `data-modal="ak-reason" data-id="${esc(`Mark not in boundary|${s.size} asset${s.size === 1 ? "" : "s"} leave SYS-WSX90. The reason, the date and any evidence show on each asset and under Scope changes.`)}"`], ["Export", `data-aptoast="${s.size} assets exported (.csv)"`]], co(3))
      : filters("Search assets", [fltDD("Owner", [["All owners"], ["No owner", "", String(noOwner)]]), "Element"], btn(`${AK.i("upload")}Export`, 'data-aptoast="Inventory exported (.csv)"'));
    return h.page(
      invHead(),
      invTabs("assets"),
      noOwner ? AK.banner({ tone: "warn", text: `<b>${noOwner} asset${noOwner === 1 ? "" : "s"}</b> ${noOwner === 1 ? "has" : "have"} no owner.`, action: "Assign owners" }).replace('<span class="btn sm">Assign owners</span>', btn("Assign owners", `data-modal="a-people-assign" data-id="${esc(INV.filter((a) => !OWN[a[0]]).map((a) => a[0]).join("|"))}"`)) : AK.banner({ tone: "ok", text: "Every asset has an owner." }),
      `<div class="a-people-inv">${kinds}<div class="a-people-invr">${bar}${tbl({
        cols: [cbAll("inv", list.map((a) => a[0]), "Select every asset"), "Asset", "Name", "Component", "Firmware", "Owner", `Scope${co(4)}`],
        rows: list.map((a, i) => ({ id: a[0], sel: s.has(a[0]), cells: [cb("inv", a[0], `Select ${a[0]}`), esc(a[0]), tr(a[1], 178), tag(a[2]), tr(a[3], 134), ownerCell(a[0], i === 0 && a[0] === "AST-109001" ? co(2) : ""), scopeCell(a)] })),
        total: list.length, panel: "sys-asset", cls: "a-people-tight a-people-invt", label: "Assets",
      })}</div></div>`,
      AK.note("The selection bar, the owner picker's organization and the scope menu are proposed. Components gets the same checkbox column and bar, for its 26 components with no owner."),
    );
  };

  // ═════════════ 6. Scope changes ═════════════
  S["after-scope-changes"] = () => {
    const s = sel("chg"), ids = [...DRAFTS.map((d) => d.id), ...LOG.map((l) => l.id)];
    const bar = s.size
      ? selbar("Search changes", "chg", [["Assign approvers and submit", `data-modal="ak-approvers" data-id="${esc(s.size === 10 ? "the 10 firmware changes of WS-X90 Block 1.1" : `${s.size} changes`)}"`], ["Export", `data-aptoast="${s.size} changes exported (.csv)"`]], co(3))
      : filters("Search changes", ["Change", fltDD("Status", [["Not reviewed", "", "10"], ["Waiting on approval", "", "0"], ["Approved", "", "0"], ["Disapproved", "", "0"], ["Recorded", "", "6"]]), "Element", "Source"], `<span class="ib" title="Download" role="button" tabindex="0" data-aptoast="Scope changes exported (.csv)">${AK.i("upload")}</span>`);
    const rows = [
      ...DRAFTS.map((d) => ({ id: d.id, sel: s.has(d.id), cells: [cb("chg", d.id, `Select ${d.lru} ${d.to}`), two(esc(`${d.lru} ${d.from} → ${d.to}`), esc(`${d.why ? d.why + " · " : ""}${B11}`), 520), pill("none", "Not reviewed"), tag(d.el), "Block 1.1", mu("Draft")] })),
      ...LOG.map((l) => ({ id: l.id, sel: s.has(l.id), cells: [cb("chg", l.id, `Select ${l.t}`), two(`${esc(l.t)}${l.ex ? " " + EX : ""}`, l.sub ? esc(l.sub) : "", 520), pill(l.st[0], l.st[1]), tag(l.el), esc(l.src), num(md(l.when))] })),
    ];
    return h.page(
      invHead(),
      invTabs("changes"),
      `<p class="a-people-lede">Changes to the boundary and its configurations, for CM-3 change control.${co(1)}</p>`,
      bar,
      tbl({ cols: [cbAll("chg", ids, "Select every change"), "Change", `Status${co(2)}`, "Element", "Source", "When"], rows, total: rows.length, panel: "a-people-chg", cls: "a-people-tight", label: "Scope changes" }),
      AK.note("The Status column, its words and the approver step are proposed; Vanta's Code changes shows statuses but no approval, so the step is borrowed from its policy approvals. The host and laptop rows stay Example, as today."),
    );
  };
  P["a-people-chg"] = (id) => {
    LASTP = ["a-people-chg", id];
    const d = DRAFTS.find((x) => x.id === id);
    if (d) {
      return { label: "Change preview", body: `<div class="a-people-pan">${AK.recordHead({ title: `${d.lru} ${d.from} → ${d.to}`, chip: pill("none", "Not reviewed") })}
        <div class="btns">${btn("Assign approvers and submit", `data-modal="ak-approvers" data-id="${esc(`${d.lru} ${d.to}`)}"`, true)}</div>
        ${AK.facts([["Element", tag(d.el)], ["Configuration", B11], ["Why", d.why ? esc(d.why) : mu("Not recorded")], ["Control", "CM-3 change control"]])}
        ${AK.approval({ title: "Approval", sub: "Not submitted. Assign approvers and submit sends it to the ISSM.", steps: [{ label: "Step 1 · ISSM", approvers: [{ who: "Joel Barrantes", role: "ISSM", state: "waiting" }] }], note: `${EX} Once submitted, the change reads Waiting on Joel Barrantes until he approves or disapproves it.` })}
        ${AK.note("The approval step and its approver are proposed; the change and its configuration are WS-X90's.")}</div>` };
    }
    const l = LOG.find((x) => x.id === id) || LOG[0];
    return { label: "Change preview", body: `<div class="a-people-pan">${AK.recordHead({ title: l.t, chip: `${pill(l.st[0], l.st[1])}${l.ex ? EX : ""}` })}
      ${AK.facts([["Element", tag(l.el)], ["Source", esc(l.src)], ["When", md(l.when)]])}
      ${l.sub ? AK.card(`<p class="a-people-p">${esc(l.sub)}</p>`) : ""}
      ${AK.note(l.ex ? "This entry is invented, as on today's Scope changes; the boundary is WS-X90's." : "The Status words are proposed; the entry is WS-X90's.")}</div>` };
  };

  // ═════════════ 7. The Mission Computer ═════════════
  const MC_TABS = (cur) => [["Overview", null, "after-component-record", cur === "overview"], ["Assessment", 61], ["Where used", 4], ["Findings", 1], ["SBOM", 13], ["Versions", 2], ["Tasks", 0, "after-component-record-tasks", cur === "tasks"], ["Activity", 4, "after-component-record-activity", cur === "activity"], ["Comments", 2, "after-component-record-comments", cur === "comments"]];
  function mcHead(cur, withCo) {
    let head = AK.recordHead({
      crumbs: [["Components", "components"], ["Mission Computer"]],
      title: "Mission Computer",
      actions: `${btn(`Version 2${AK.i("down")}`, "", false, false)}${dd("Create task", [["Create task", 'data-modal="a-people-mc-task"'], ["Remind consumers to take version 2", 'data-modal="a-people-remind-cons"']])}${btn("Review offer", 'data-panel="plat-offer" data-id="cve"', true, false)}`,
      facts: [["Status", pill("ok", "Published")], ["Owner", ownerEdit("Priya Raghavan", 'data-modal="a-people-comp-owner"')], ["Version", "2 · Nov 12"], ["Business line", "Air Defense"], ["Component set", "X800 Missile component set"], ["Reassess", `<span class="a-people-ic">${AK.i("clock")}Yearly ${EX}</span>`]],
      tabs: MC_TABS(cur),
    });
    if (withCo) head = tabCo(head.replace("</dl>", `<div class="a-people-fco">${co(1)}</div></dl>`), { Activity: 3 });
    return head;
  }
  const mcComments = (c = "") => AK.card(`${secHead("Comments", 2, "", `${EX}${c}`)}${AK.comments({ items: COMMENTS, you: ME })}`, { cls: "a-people-cmc" });
  function mcRail(c) {
    return `${AK.railCard("Details", [["Version", "2 · published Nov 12"], ["Previous", "1 · assessed Sep 30"], ["Assessor", AK.owner("Elena Vasquez")], ["Determinations", "52 carried · 2 to review"], ["SBOM", "CycloneDX 1.5 · 13 components"], ["Open CVEs", `<span class="a-people-2l"><span>0 on version 2</span><span class="a-people-bad">1 on version 1</span></span>`]], { co: c })}
      <div class="ak-rail-s"><div class="ak-rail-t">Controls <span class="a-people-ct num">61</span></div><div class="a-people-pills">${[["ok", "Satisfied", 42], ["part", "Partially satisfied", 6], ["bad", "Other than satisfied", 4], ["info", "Not assessed", 7], ["warn", "To review", 2]].map(([k, l, n]) => `<div class="a-people-pr">${pill(k, l)}<b class="num">${n}</b></div>`).join("")}</div></div>
      <div class="ak-rail-s"><div class="ak-rail-t">Offer waiting</div><dl class="ak-kv"><dt>Finding</dt><dd>CVE-2024-6387</dd><dt>Review by</dt><dd>${AK.owner("Priya Raghavan")}</dd><dt>Since</dt><dd>Nov 14 · 3 days</dd></dl><span class="ak-link" role="link" tabindex="0" data-panel="plat-offer" data-id="cve">Review offer</span></div>`;
  }
  S["after-component-record"] = () => {
    const changed = AK.card(`${secHead("What changed in version 2", null, tag("Software"))}<p class="a-people-p">The maintenance image carries OpenSSH server 9.8p1 in place of 9.6p1, which fixes CVE-2024-6387 (regreSSHion). Nothing else in the image changes.</p>
      <div class="a-people-ctls">${MC_CHANGED.map(([cd, t, st]) => `<div class="a-people-ctl"><span class="ak-code">${esc(cd)}</span><span class="x">${esc(t)}</span>${st === "To review" ? pill("warn", st) : pill("none", st)}</div>`).join("")}</div>`);
    const used = AK.card(`${secHead("Where used", 4, btn(`${AK.i("mail")}Send reminder`, 'data-modal="a-people-remind-cons"'), co(5))}
      <div class="a-people-used"><div class="a-people-ur hd"><span>Consumer</span><span>Controls inherited</span><span>Version</span><span>Reminder</span></div>
      ${CONS.map((x) => `<div class="a-people-ur" role="button" tabindex="0" data-panel="plat-consumer" data-id="${x.id}"><span class="a-people-2l"><span class="a-people-2t"><b>${esc(x.name)}</b> ${x.kind === "Product" ? tag("Product") : ""}</span><span class="a-people-2s">${esc(x.el)}${x.kind !== "Product" ? ` · ${esc(x.kind)}` : ""}</span></span>${x.inh ? num(x.inh) : mu("Product")}<span class="a-people-warn">Version 1 · behind</span>${x.kind === "Product" ? "<span></span>" : mu("Not reminded yet")}</div>`).join("")}</div>`);
    const banner = AK.banner({ tone: "bad", text: "<b>CVE-2024-6387</b> (high, 8.1) is open on version 1: 3 programs use it, 2 hold no issue for it yet.", action: "Open findings" }).replace('<span class="btn sm">Open findings</span>', btn("Open findings", 'data-go="component-mc-findings"'));
    return h.page(mcHead("overview", true), AK.withRail(`${changed}${used}${banner}${mcComments(co(2))}`, mcRail(co(4))),
      AK.note("The comments, Create task, the Tasks tab, the reminders and the yearly reassessment are invented; Not reminded yet holds because nothing has asked a consumer to take version 2."));
  };
  S["after-component-record-tasks"] = () => h.page(mcHead("tasks"), AK.withRail(AK.empty({ title: "No tasks yet", line: "Create a task to ask a consumer to take version 2, or to review AC-17(2) and SC-23.", action: "Create task" }).replace('<span class="btn sm ink">Create task</span>', btn("Create task", 'data-modal="a-people-mc-task"', true)), mcRail("")), AK.note("The Tasks tab is proposed."));
  S["after-component-record-activity"] = () => h.page(mcHead("activity"), AK.withRail(AK.card(`${secHead("Activity", 4)}${AK.activity([
    { who: "Elena Vasquez", what: "completed the version 1 component assessment · 52 determinations", when: "Sep 30" },
    { who: null, what: "recorded SBOM version 1 · CycloneDX 1.5, 13 components", when: "Oct 8" },
    { who: null, what: "recorded version 2 as published, with its SBOM", when: "Nov 12" },
    { who: "Ingrid Solberg", what: "offered CVE-2024-6387 from WS-X90", when: "Nov 14" },
  ])}`), mcRail("")), AK.note("The Activity tab is proposed; its four events are the Mission Computer's, from its versions, SBOMs and offer."));
  S["after-component-record-comments"] = () => h.page(mcHead("comments"), AK.withRail(mcComments(), mcRail("")), AK.note("The comments are invented."));

  // ═════════════ 8. Role task sets (a screen we lack): the Assessor role ═════════════
  const roleHead = (cur) => AK.recordHead({ crumbs: [["People", "after-people-register"], ["Roles", "after-people-roles"], ["Assessor"]], title: "Assessor", chip: tag("SCA"), desc: "Records determinations; reviews evidence",
    actions: btn("Edit role", "", false, false), tabs: [["Tasks", 4, "after-role-task-sets", cur === "tasks"], ["Holders", 2, "after-role-task-sets-holders", cur === "holders"]] });
  const trow = (icon, title, sub, link, attrs = "", c = "") => `<div class="a-people-trow"><span class="a-people-ti">${AK.i(icon)}</span><span class="x"><b>${esc(title)}</b>${sub ? `<span class="s">${esc(sub)}</span>` : ""}</span><span class="a-people-tl"><span class="ak-link" role="button" tabindex="0" ${attrs}>${esc(link)} ›</span>${c}</span></div>`;
  S["after-role-task-sets"] = () => h.page(
    roleHead("tasks"),
    `<div class="ak-banner warn a-people-unsaved" role="status">${gl("clock")}<span class="x"><b>You have unsaved changes</b></span><span class="a-people-push">${btn("Preview tasks")}${btn("Discard", 'data-aptoast="Changes discarded"')}${btn("Save", 'data-aptoast="You updated tasks for Assessor" data-aplink="Enable recurring reminders"', true)}</span>${co(2)}</div>`,
    AK.card(`<div class="a-people-set"><span class="a-people-seti">${AK.i("task")}</span><span class="a-people-2l"><b>RMF assessor tasks ${EX}</b><span class="a-people-2s">Task set · Used by 2 roles (Assessor, Lead assessor)</span></span><span class="btns">${btn("Preview tasks")}${btn("Unlink task set")}</span>${co(1)}</div>`),
    `<div class="a-people-holders"><span class="a-people-mu">Holders</span><span class="a-people-hd">${AK.owner("Nadia Fournier")}${AK.progress(2, 3)}</span><span class="a-people-hd">${AK.owner("Local developer")}${AK.progress(0, 3)}</span>${co(4)}</div>`,
    AK.card(`${secHead("Onboarding and recurring")}<p class="a-people-p a-people-mu">What a holder completes on taking the role, and again each year</p>
      ${trow("user", "DoD 8140 qualification", "612 Security Control Assessor: foundational and 20 learning hours a year", "1 work role")}
      ${trow("pen", "Rules of behavior (PL-4)", "Signed before privileged access is granted", "1 document")}
      ${trow("history", "Role-based training (AT-3)", "Recurs yearly", "1 training")}
      ${trow("link", "Privileged account request (AC-2)", "Approved by the ISSM", "Add")}
      ${trow("plus", "Custom task", "Require the holder or the ISSM to complete a task", "Add", 'data-modal="a-people-custom"', co(3))}`),
    AK.card(`${secHead("Offboarding")}<p class="a-people-p a-people-mu">What the ISSM completes when a holder's period ends</p>
      ${trow("ban", "Remove privileged accounts (AC-2)", "", "1 task")}
      ${trow("send", "Hand over open determinations", "", "Add")}`),
    AK.note("Every task, task set and count on this screen is invented; the Assessor role, its acts and its two holders are WS-X90's."),
  );
  S["after-role-task-sets-holders"] = () => h.page(
    roleHead("holders"),
    tbl({ cols: ["Holder", "Since", "Tasks", "Next task"], rows: [
      { id: "Nadia Fournier", cells: [personCell("Nadia Fournier"), ring("Not recorded"), AK.progress(2, 3), `Role-based training (AT-3) · ${AK.due("2027-01-31")}`] },
      { id: "Local developer", cells: [personCell("Local developer"), ring("Not recorded"), AK.progress(0, 3), "DoD 8140 qualification · Not qualified"] },
    ], total: 2, panel: "a-people-person", nm: 0, label: "Holders" }),
    AK.note("Task counts and next tasks are invented; the holders are WS-X90's."),
  );
  // The Roles tab: the six RMF roles; Assessor opens its role page.
  const ROLE_LIST = [
    ["Authorizing official", "AO", ["R. Calloway"], "Signs the authorization decision; the last step of a risk acceptance", null],
    ["Lead assessor", "SCA", ["D. Okafor"], "Publishes assessment results", "RMF assessor tasks"],
    ["Assessor", "SCA", ["Nadia Fournier", "Local developer"], "Records determinations; reviews evidence", "RMF assessor tasks"],
    ["Information system security manager", "ISSM", ["Joel Barrantes"], "Second step of a risk acceptance; owns continuous monitoring", null],
    ["Information system security officer", "ISSO", ["Priya Raghavan"], "First step of a risk acceptance; owns the package", null],
    ["System owner", "SO", ["Ray Colston"], "Owns the POA&M and the remediation budget", null],
  ];
  S["after-people-roles"] = () => h.page(
    peopleHead(),
    peopleTabs("roles"),
    filters("Search roles", ["Task set"]),
    tbl({ cols: ["Role", "Holders", "Acts it holds", "Task set", "Tasks"], rows: ROLE_LIST.map(([r, s, hs, acts, set]) => ({ id: r, go: r === "Assessor" ? "after-role-task-sets" : undefined, panel: r === "Assessor" ? "" : "a-people-role", cells: [`<span class="a-people-role">${esc(r)} ${tag(s)}</span>`, `<span class="a-people-hs">${AK.avatars(hs)}<span>${esc(hs.join(", "))}</span></span>`, tr(acts, 250), set ? `${esc(set)} ${EX}` : mu("None"), set ? num(4) : mu("0")] })), total: 6, nm: 0, cls: "a-people-tight", label: "Roles" }),
    AK.note("Task sets and their counts are invented; the six roles, their holders and their acts are WS-X90's."),
  );
  P["a-people-role"] = (r) => {
    const x = ROLE_LIST.find((y) => y[0] === r) || ROLE_LIST[0];
    LASTP = ["a-people-role", r];
    return { label: "Role preview", body: `<div class="a-people-pan">${AK.recordHead({ title: x[0], chip: tag(x[1]), desc: esc(x[3]) })}
      ${AK.railCard("Details", [["Holders", x[2].map((n) => AK.owner(n)).join(" ")], ["Task set", x[4] ? `${esc(x[4])} ${EX}` : mu("None")]])}
      ${x[4] ? `<div class="btns">${btn("Open the Assessor's tasks", 'data-go="after-role-task-sets"')}</div>` : AK.empty({ title: "No task set", line: "Link a task set to give each holder onboarding and offboarding tasks.", action: "Link task set" })}
      ${AK.note("Task sets are proposed; the role and its holders are WS-X90's.")}</div>` };
  };

  // ——— Dialogs ———
  const namesOf = (id) => (id === "all" ? PERSONS.filter((p) => p.open.length).map((p) => p.n) : String(id || "").split("|").filter(Boolean));
  M["a-people-remind"] = (id) => {
    const names = namesOf(id), n = names.length;
    return { title: "Send a reminder", body: `<p class="ak-desc">Each person gets one email listing their open WS-X90 tasks and when each is due.</p>
      ${field("Send to", `<div class="a-people-tos">${names.map(avChip).join("")}</div>`, "", `${n} selected ${n === 1 ? "person" : "personnel"}`)}
      ${field("Method", select("Email"))}
      ${field("Message", input("Your open WS-X90 tasks are listed below. Reply here if a date needs to move.", true), OPT)}`,
      footer: foot("Send reminder", `Reminder sent to ${n} ${n === 1 ? "person" : "people"}`) };
  };
  M["a-people-recurring"] = () => ({ title: "Recurring reminders", body: `<p class="ak-desc">WS-X90 has no reminders scheduled. A recurring reminder emails each person their open tasks.</p>
    ${field("Send", select("Every Monday"))}${field("To", select("People with tasks past due or due within 14 days"))}${field("Method", select("Email"))}
    ${AK.note("The schedule is proposed; nothing is sent until it is saved.")}`, footer: foot("Schedule reminders", "Reminders scheduled for every Monday") });
  M["a-people-end"] = (id) => {
    const ps = String(id || "R. Calloway").split("|").map((n) => PERSON[n]).filter((p) => p && p.role);
    if (!ps.length) return { title: "End role", body: `<p class="ak-desc">The people chosen hold no RMF role in WS-X90.</p>`, footer: `<button type="button" class="btn" data-close-modal>Close</button>` };
    const one = ps.length === 1 ? ps[0] : null;
    const moves = one && one.short === "AO" ? ["Package version 2's decision moves to the successor", "Signing in the package room moves on the end date", "The Sep 18 decision and its three conditions stay signed by R. Calloway"] : ps.map((p) => `${p.short}: ${p.acts.charAt(0).toLowerCase() + p.acts.slice(1)}`);
    return { title: one ? `End ${one.n}'s period as ${one.role.toLowerCase()}` : `End ${ps.length} roles`, body: `<p class="ak-desc">WS-X90 keeps one holder of each of these roles at a time, so each needs a successor.</p>
      ${ps.map((p) => field(`Successor as ${p.short}`, select(`Choose the next ${p.role.toLowerCase()}`), REQ)).join("")}
      ${field("Ends", select("Nov 17, 2026"))}
      <div class="ak-field"><label>What moves ${EX}</label><div class="a-people-moves">${moves.map((m) => li(gl("info"), esc(m))).join("")}</div></div>`,
      footer: foot("End role", one ? `${one.n}'s period ends Nov 17` : `${ps.length} periods end Nov 17`) };
  };
  M["a-people-date"] = (id) => { const [label, n] = String(id || "Add start date|").split("|"); return { title: label, body: `<p class="ak-desc">${esc(n)}'s period in the role.</p>${field(label.replace("Add ", "").replace(/^./, (c) => c.toUpperCase()), select("Nov 17, 2026"))}`, footer: foot("Save", `${label.replace("Add ", "").replace(/^./, (c) => c.toUpperCase())} saved`) }; };
  M["a-people-note"] = (id) => { const n = String(id || "").split("|")[1] || ""; return { title: "Add note", body: `${field("Note", input(`What others should know about ${n}'s role in WS-X90`, true))}<p class="ak-desc">The note shows on the person, with your name and the date.</p>`, footer: foot("Add note", "Note added") }; };
  M["a-people-change-role"] = (id) => { const names = namesOf(id); return { title: "Change role", body: `${field("People", `<div class="a-people-tos">${names.map(avChip).join("")}</div>`)}${field("Role", select("Choose a role"), REQ)}${field("Starts", select("Nov 17, 2026"))}<p class="ak-desc">WS-X90 has one authorizing official and one lead assessor at a time; giving either role ends the current holder's period.</p>`, footer: foot("Change role", "Roles changed") }; };
  M["a-people-review-new"] = () => ({ title: "Create one-time review", body: `${field("Name", input("Name the review"), REQ)}${field("Reviewer", select("Search people"), REQ)}${field("Scope", select("Choose systems or LRUs"), REQ)}${field("Due date", select("Choose a date"))}`, footer: foot("Create review", "Review created as a draft") });
  M["a-people-schedule"] = () => ({ title: "Schedule access reviews", body: `<p class="ak-desc">A schedule repeats with a check on Continuous monitoring, so the review and the check keep one cadence.</p>
    ${field("Repeats with", select("Privileged account review · Quarterly · AC-2, AC-6"), "", "The check's owner, Victor Amsel, reviews each quarter.")}
    ${field("Each review takes", select("24 days, ending on the check's due date"))}
    <div class="ak-field"><label>Next reviews ${EX}</label><div class="a-people-moves">${[["Feb 5 – Mar 1, 2027", "Created Jan 29"], ["May 8 – Jun 1, 2027", "Created May 1"]].map(([w, c2]) => li(gl("ring"), esc(w), esc(c2))).join("")}</div></div>`, footer: foot("Save schedule", "Schedule saved") });
  M["a-people-acct-owner"] = (id) => { const ids = String(id || "").split("|").filter(Boolean); return { title: "Assign owner", body: `<p class="ak-desc">${ids.length === 1 ? `The owner answers for ${esc(ids[0])}.` : `The owner answers for ${ids.length} accounts.`}</p>${AK.ownerPicker({ you: ME, people: PICK_PEOPLE.concat([["Wes Duarte", ""]]) })}`, footer: foot("Assign owner", "Owner assigned") }; };
  M["a-people-task"] = (id) => { const ids = String(id || "").split("|").filter(Boolean); const one = ids.length === 1 ? ids[0] : null; return { title: one ? `Note or task for ${one}` : "Create task", body: `<p class="ak-desc">A revoked account needs a note or a task before the review completes.</p>${field("Note", input("Why the account goes, and anything the remover needs", true), OPT)}${field("Task", input(one ? `Remove ${one}` : `Remove ${ids.length} accounts`, false, true))}${field("Assignee", select("Joel Barrantes"))}${field("Due date", select("Nov 24, 2026"))}`, footer: foot("Create task", "Task created") }; };
  M["a-people-assign"] = (id) => { const ids = String(id || "").split("|").filter(Boolean); const n = ids.length; return { title: "Assign owner", body: `<p class="ak-desc">${n === 1 ? `${esc(ids[0])} takes this owner.` : `${n} assets take this owner.`} An owner is a person or an organization.</p>${field("Person", select("Search people"))}${field("Or an organization", select("Search organizations"))}`, footer: foot("Assign owner", `Owner assigned to ${n} asset${n === 1 ? "" : "s"}`) }; };
  M["a-people-remind-cons"] = () => ({ title: "Remind consumers to take version 2", body: `<p class="ak-desc">Each program that runs version 1 gets one email, and its Where used line records the reminder.</p>
    ${field("Send to", `<div class="a-people-tos">${["WS-X90 Sentinel Mission System", "Customer A · X800 Rail Integration", "Customer B · X800 Palletized Integration"].map((n) => `<span class="ak-chip">${esc(n)}</span>`).join("")}</div>`, "", "3 programs · each program's ISSM")}
    ${field("Method", select("Email"))}
    ${field("Message", input("Version 2 of the Mission Computer fixes CVE-2024-6387. Take it from Where used; AC-17(2) and SC-23 are to review.", true, true))}`, footer: foot("Send reminder", "Reminder sent to 3 programs") });
  M["a-people-mc-task"] = () => ({ title: "Create task", body: `${field("Task", input("What is done, in one line"), REQ)}${field("Assignee", select("Search people"))}${field("Due date", select("Choose a date"))}${field("About", select("Mission Computer · version 2"))}`, footer: foot("Create task", "Task created") });
  M["a-people-comp-owner"] = () => ({ title: "Change owner", body: `<p class="ak-desc">The owner reviews offers and publishes versions of the Mission Computer.</p>${AK.ownerPicker({ you: ME, people: [["Priya Raghavan", "Owner"], ["Marcus Ryde", ""], ["Elena Vasquez", "Assessor"]] })}`, footer: foot("Save owner", "Owner saved") });
  M["a-people-custom"] = () => ({ title: "Create custom task", body: `${field("Task name", input("Name the task"), REQ)}${field("Instructions", input("What the assignee does, and what counts as done", true))}
    <div class="ak-field"><label>Assignee</label><div role="radiogroup" aria-label="Assignee">${radio("The ISSM", false)}${radio("Each holder of the role", true, "Holders see it in their reminders.")}</div></div>
    <div class="ak-field"><label>Proof${OPT}</label>${checkRow("Upload a file", true)}${checkRow("Answer in text", false)}</div>`, footer: foot("Create", "Custom task created") });

  ["after-people-register", "after-person-drawer", "after-access-reviews", "after-access-review", "after-inventory", "after-scope-changes", "after-component-record",
    "after-component-record-tasks", "after-component-record-activity", "after-component-record-comments", "after-role-task-sets", "after-role-task-sets-holders", "after-people-roles"]
    .forEach((r) => { ROUTE_NAV[r] = "before-after"; });
})();
