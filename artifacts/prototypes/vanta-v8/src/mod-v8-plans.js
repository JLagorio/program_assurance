// Builder 2, version 8 (v8d-): the contingency, incident response and configuration management plans as live documents beside
// the SSP, the Plans register, and a page per person with onboarding, access, training and offboarding.
// Routes, all claimed with PA.own: plan-cp, plan-irp and plan-cmp (full window) with plan-*-history; ssps (Plans) with ssps-drafts,
// ssps-review and ssps-published; person-<slug> for the 11 people with -onboarding, -access, -training, -offboarding,
// -comments and -activity.
// Added to others' screens: a document switcher in the SSP editor's header (PA.decorate "ssp", no edit to the editor's file),
// and "Open person" in the person preview that every row of People opens (PA.decoratePanel "a-people-person").
// Real (local database, read Nov 17, and the prototype's own data): program roles (no periods recorded) and roles in other
// programs, evidence owners and titles, Ingrid Solberg's issue and POA&M item, WS-X90's two configuration baselines and their
// 20 component pins with SHA-256, the component functions, the FY2027 ConMon checks and tasks, the significant-change trigger,
// the Block 1.1 scope changes, the ATT&CK techniques and the risks that name them, SSP text, control narratives and REQ-439.
// Example: plan prose the evidence doesn't hold, presence, comments, AI drafts, versions, contacts, RTO and RPO, the alternate
// site's address, approvals, accounts, onboarding and training states, and Victor Amsel leaving on Dec 1.
// Pieces beyond the kit: the plan editor and its history (drawn on the SSP editor's se-/sd- and the history's sh- classes),
// the document switcher, an owner picker that writes, and the offboarding steps.
(function () {
  const PA = window.PA;
  const D = PA && PA.SSP, AK = PA && PA.AK;
  if (!D || !AK) return;
  const { S, P, M, ROUTE_NAV, h } = PA;
  const U = D.ui, esc = U.esc;
  const EX = '<span class="ex">Example</span>';
  const EXS = '<span class="ex" data-v8d-skip contenteditable="false">Example</span>';
  const ME = "Ingrid Solberg";

  // ——— Small helpers ———
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const route = () => (location.hash || "#home").slice(1);
  const NARROW = () => matchMedia("(max-width: 1000px)").matches;
  const RM = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ini = (n) => String(n).replace(/\./g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
  const firstSentences = (t, n = 2) => ((String(t).match(/[^.!?]+[.!?]+(\s|$)/g) || [t]).slice(0, n).join("").trim());
  const md = AK.md;
  const whenOrDay = (x) => (String(x).length <= 10 ? md(x) : U.when(x));
  const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const mu = (t) => `<span class="v8d-mu">${t}</span>`;
  const num = (n) => `<span class="num">${h.fmt(n)}</span>`;
  const btn = (label, attrs = "", ink = false) => `<button type="button" class="btn sm${ink ? " ink" : ""}" ${attrs}>${label}</button>`;
  const IP = {
    live: "M2.5 8a5.5 5.5 0 0 1 9.4-3.9M13.5 8a5.5 5.5 0 0 1-9.4 3.9M12 1.8v2.5H9.5M4 14.2v-2.5h2.5",
    open: "M9 2.5h4.5V7M13.5 2.5 7.5 8.5M11.5 9.5v4h-9v-9h4", cloud: "M4.5 12.5h7a2.5 2.5 0 0 0 .3-5A3.5 3.5 0 0 0 5 6.8a2.9 2.9 0 0 0-.5 5.7zM6.3 9.6l1.3 1.3 2.2-2.4",
    toc: "M3 4h10M3 8h10M3 12h6", undo: "M6 4 3 7l3 3M3 7h7a3 3 0 0 1 0 6H8", redo: "M10 4l3 3-3 3M13 7H6a3 3 0 0 0 0 6h2",
    cplus: "M3 3h10v7H7l-3 3v-3H3zM8 4.5v4M6 6.5h4", lock: "M4 7.5h8v6H4zM5.5 7.5v-2a2.5 2.5 0 0 1 5 0v2", right: "M6 3.5 10.5 8 6 12.5",
    docs: "M4 2.5h6l2.5 2.5v8.5H4zM10 2.5V5h2.5M6 8h4M6 10.5h4", info: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 7.2v3.6M8 5.2v.01",
    key: "M10 2.5a3.5 3.5 0 1 1-3.3 4.6L2.5 11.3V13.5h2.2v-1.5h1.5v-1.5h1.5l.5-.5A3.5 3.5 0 0 1 10 2.5z",
  };
  const I = (k, cls = "") => (IP[k] ? `<svg class="ak-i se-i ${cls}" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IP[k]}"/></svg>` : AK.i(k, cls));
  // People's colours: the SSP's own where it has them, the rest from the token set.
  const COL = { "Amara Bell": "var(--info)", "Ray Colston": "var(--mode)", "R. Calloway": "var(--ink)", "Nadia Fournier": "var(--brand-text)", "Victor Amsel": "var(--warn)", "Wes Duarte": "var(--ok)" };
  const col = (n) => COL[n] || (D.people.find((p) => p.name === n) || {}).color || "var(--ink-3)";
  const av = (n, s = 26) => `<span class="sd-av" style="--c:${col(n)};--s:${s}px" title="${esc(n)}">${esc(ini(n))}</span>`;
  const dot = (n) => `<span class="sh-who"><span class="sh-dot" style="--c:${col(n)}"></span>${esc(n)}</span>`;
  const tbl = (cols, rows, cls = "") => `<div class="sd-tablebox"><table class="sd-table ${cls}"><thead><tr>${cols.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const ROLE = { "R. Calloway": "Authorizing official", "D. Okafor": "Lead assessor (SCA)", "Nadia Fournier": "Assessor", "Local developer": "Assessor", "Joel Barrantes": "ISSM", "Priya Raghavan": "ISSO", "Ray Colston": "System owner", "Ingrid Solberg": "Security engineer", "Marcus Ryde": "Component owner", "Amara Bell": "Plan owner", "Victor Amsel": "Access reviewer", "Wes Duarte": "Resiliency engineer" };
  const mentions = (t) => { let s = esc(t); for (const n of Object.keys(ROLE)) s = s.split("@" + esc(n)).join(`<span class="ak-at">@${esc(n)}</span>`); return s; };
  const srcChip = ([k, l]) => `<span class="se-src" title="${esc(k + ": " + l)}"><span class="k">${esc(k)}</span>${esc(l.length > 46 ? l.slice(0, 45) + "…" : l)}</span>`;

  // ═════════ Records the plans read (real unless marked) ═════════
  // WS-X90's configuration baselines (configuration_baselines and component_pins, local database, Nov 17).
  const PINS = [
    ["LRU-001", "Mission Computer", "MC-FW 4.2.1", "MC-FW 4.3.0", "1846192884af"], ["LRU-002", "Secure Boot Controller", "SBC-FW 2.0.7", "SBC-FW 2.1.0", "09e8e0a59146"],
    ["LRU-003", "Cryptographic Services Module", "CSM-FW 3.4.2", "CSM-FW 3.4.2", "66857a576a3f"], ["LRU-004", "Navigation Processor", "NAV-FW 1.9.0", "NAV-FW 1.9.0", "b886f32a38ac"],
    ["LRU-005", "Timing Receiver", "TR-FW 5.1.3", "TR-FW 5.1.3", "cb33b4744c97"], ["LRU-006", "Navigation Sensor Interface", "NSI-FW 1.2.0", "NSI-FW 1.2.0", "2f8a742c1866"],
    ["LRU-007", "Protected Network Gateway", "PNG-FW 6.0.4", "PNG-FW 6.1.1", "85ee4f4d9caf"], ["LRU-008", "Tactical Data Radio", "TDR-FW 8.2.0", "TDR-FW 8.3.0", "81c7ed9bb684"],
    ["LRU-009", "Internal Ethernet Switch", "IES-OS 15.2(7)", "IES-OS 15.2(7)", "ee664b48dc56"], ["LRU-010", "Payload Interface Controller", "PIC-FW 2.6.1", "PIC-FW 2.6.1", "180e43660ca3"],
    ["LRU-011", "Payload Safety Interlock", "PSI-FW 1.0.9", "PSI-FW 1.0.9", "cb1b3dc8114b"], ["LRU-012", "Payload Telemetry Unit", "PTU-FW 3.3.0", "PTU-FW 3.3.0", "50a4f88141e5"],
    ["LRU-013", "Platform Management Controller", "PMC-SW 4.2.1", "PMC-SW 4.2.1", "b15e037913a9"], ["LRU-014", "Maintenance Access Gateway", "MAG-FW 2.2.5", "MAG-FW 2.3.0", "bd8ecd166c49"],
    ["LRU-015", "Secure Storage Module", "SSM-FW 1.4.0", "SSM-FW 1.5.0", "9b9965c49955"], ["LRU-016", "Update & Recovery Controller", "URC-FW 3.0.2", "URC-FW 3.0.2", "1d6a6020e3be"],
    ["LRU-017", "Provisioning Workstation", "PWS image 2026.06", "PWS image 2026.10", "c6a311de15ba"], ["LRU-018", "Security Log Collector", "SLC 4.2.1 (rule set 3.4)", "SLC 4.3.0 (rule set 3.6)", "bec07546e7cc"],
    ["LRU-019", "Maintenance Laptop", "MLT image 2026.06", "MLT non-persistent image 2026.10", "b8e3c3591125"], ["LRU-020", "Configuration Repository", "CFG-REPO 2.8.0", "CFG-REPO 2.9.0", "8a7a833e87a0"],
  ];
  // What each unit does (system_components.description).
  const FN = {
    "LRU-001": "Runs mission software and hosts security enforcement services.", "LRU-002": "Enforces authenticated boot and platform integrity state.",
    "LRU-003": "Provides protected cryptographic operations and key use.", "LRU-004": "Processes navigation data and integrity checks.",
    "LRU-005": "Provides trusted timing input and holdover monitoring.", "LRU-006": "Aggregates navigation sensor inputs.",
    "LRU-007": "Mediates external communications and network policy enforcement.", "LRU-008": "Provides mission data communications.",
    "LRU-009": "Provides internal segmented data transport.", "LRU-010": "Mediates commands and telemetry between mission compute and payload.",
    "LRU-011": "Provides independent authorization and state interlocks.", "LRU-012": "Collects and forwards payload health and status telemetry.",
    "LRU-013": "Hosts platform health, inventory, and administrative services.", "LRU-014": "Controls technician maintenance sessions and service access.",
    "LRU-015": "Stores protected configuration, audit, and recovery material.", "LRU-016": "Stages authenticated updates and controlled recovery.",
    "LRU-017": "Performs controlled provisioning and configuration workflows.", "LRU-018": "Collects and correlates exported platform security logs.",
    "LRU-019": "Authorized support endpoint used for bounded maintenance activity.", "LRU-020": "Stores approved configuration baselines and signed release metadata.",
  };
  const NAME = Object.fromEntries(PINS.map((p) => [p[0], p[1]]));
  // Recovery order with an RTO and RPO each (Example: nobody has measured them).
  const RECOVERY = [["LRU-001", "4 h", "Last signed image"], ["LRU-002", "4 h", "Last signed image"], ["LRU-003", "4 h", "Keys sealed in LRU-015"], ["LRU-011", "4 h", "Last signed image"],
    ["LRU-004", "6 h", "Last signed image"], ["LRU-005", "6 h", "Holdover"], ["LRU-006", "6 h", "Last signed image"], ["LRU-007", "8 h", "Last signed configuration"],
    ["LRU-008", "8 h", "Last signed configuration"], ["LRU-009", "8 h", "Last signed configuration"], ["LRU-010", "8 h", "Last signed image"], ["LRU-012", "12 h", "1 h of telemetry"],
    ["LRU-013", "12 h", "24 h"], ["LRU-014", "12 h", "Last signed configuration"], ["LRU-015", "12 h", "24 h, the backup cycle"], ["LRU-016", "12 h", "Last signed image"],
    ["LRU-018", "24 h", "1 h"], ["LRU-020", "24 h", "24 h"], ["LRU-017", "48 h", "PWS image 2026.06"], ["LRU-019", "48 h", "MLT image 2026.06"]];
  // The Block 1.1 changes on Scope changes (mod-after-people.js DRAFTS); the analysis and significance columns are Example.
  const CHANGES = [["LRU-001", "Separation kernel added for SC-29(1)", "done", "Yes"], ["LRU-002", "Measured boot of every partition for SC-34", "done", "Yes"],
    ["LRU-007", "Separate subnets per security domain for SC-7(22)", "done", "Yes"], ["LRU-008", "Fallback protocol for CP-11", "analysis", ""],
    ["LRU-014", "Session non-persistence for SI-14", "analysis", ""], ["LRU-015", "Mission state replication for SC-36", "none", ""],
    ["LRU-017", "", "none", ""], ["LRU-018", "Pattern baselining for SI-4(13)", "done", "No"], ["LRU-019", "Non-persistent image for SI-14", "analysis", ""],
    ["LRU-020", "Signed image builds for SI-14(1)", "done", "No"]];
  const SIA = { done: ["ok", "Done"], analysis: ["warn", "In analysis"], none: ["none", "Not started"] };
  // ATT&CK techniques WS-X90's risks name (the threats data, mod-v7-analysis.js); playbook status is Example.
  const PLAYBOOKS = [
    ["Credential misuse at the flightline", ["T1078", "T1110", "T1552"], "A password on its own reaches WS-X90 at the flightline", "critical", ["warn", "Drafted"]],
    ["Signed command integrity", ["T1565", "T1553"], "Payload arm and release records become unverifiable as signing keys rotate", "critical", ["warn", "Drafted"]],
    ["Firmware and boot tampering", ["T1601", "T1542", "T1495", "T0839"], "A partition that has failed its own integrity check keeps flying the mission", "high", ["warn", "Drafted"]],
    ["Physical access and removable media", ["T1200", "T1091", "T1052"], "An unsealed service connector leaves a physical route into the maintenance path", "high", ["none", "Not written"]],
    ["Boundary exfiltration and denial of service", ["T1048", "T1499", "T1498"], "Low-rate exhaustion and unattributable egress at the WS-X90 external boundary", "high", ["none", "Not written"]],
    ["Insider threat and spillage", ["T1005", "T1052"], "Insider threat and spillage have an escalation path and no named owner", "moderate", ["none", "Not written"]],
  ];
  const sev = (s) => h.sevPill ? h.sevPill(s) : h.pill(s === "critical" || s === "high" ? "bad" : "warn", s);
  // The FY2027 plan's scheduled tasks and its recurring checks (mod-v7-program.js).
  const TASKS = [["t5", "Monthly STIG compliance scan", "blocked", "2026-11-11", "Joel Barrantes"], ["t6", "Monthly vulnerability scan — mission network", "in_progress", "2026-11-15", "Joel Barrantes"],
    ["t7", "Monthly POA&M review", "ready", "2026-11-21", "Priya Raghavan"], ["t8", "Quarterly privileged account review (AC-2, AC-6)", "in_progress", "2026-12-01", "Victor Amsel"],
    ["t9", "Quarterly audit log review sampling (AU-6)", "planned", "2026-12-23", "Nadia Fournier"], ["t10", "Quarterly configuration baseline audit (CM-2, CM-3)", "planned", "2026-12-28", ME],
    ["t11", "Annual control subset assessment — AC and IA families", "planned", "2027-02-11", "Nadia Fournier"], ["t12", "Incident response tabletop (IR-3)", "planned", "2027-03-13", "Priya Raghavan"],
    ["t13", "Contingency plan test on a whole article (CP-4)", "planned", "2027-04-12", "Amara Bell"], ["t14", "Cyber resiliency exercise — Redundancy and Non-Persistence (SA-24)", "planned", "2027-06-01", "Wes Duarte"]];
  const TST = { blocked: ["bad", "Blocked"], in_progress: ["warn", "In progress"], ready: ["info", "Ready"], planned: ["none", "Planned"] };
  const CHECKS = [["vuln", "ACAS vulnerability scan, mission network", "Monthly", "Joel Barrantes"], ["stig", "STIG compliance scan", "Monthly", "Joel Barrantes"],
    ["poamr", "POA&M review", "Monthly", "Priya Raghavan"], ["par", "Privileged account review", "Quarterly", "Victor Amsel"], ["au6", "Audit log review sampling", "Quarterly", "Nadia Fournier"],
    ["cm", "Configuration baseline audit", "Quarterly", ME], ["subset", "Reassessment sample: AC and IA controls", "Yearly", "Nadia Fournier"],
    ["ir", "Incident response tabletop", "Yearly", "Priya Raghavan"], ["cp", "Contingency plan test on a whole article", "Yearly", "Amara Bell"], ["sa24", "Cyber resiliency exercise", "Yearly", "Wes Duarte"]];
  const sspNarr = (code) => { const c = D.ctl(code); return c ? firstSentences(c.n, 2) : ""; };
  const sspSec = (id) => ((D.sec(id) || {}).text || [""])[0];

  // ——— Blocks a plan section draws from records ———
  const live = (src, open, inner, opt = {}) => `<div class="sd-live${opt.cls ? " " + opt.cls : ""}"><div class="sd-live-h"><span class="sd-live-tag">${I("live")}Live</span><span>${src}</span><span class="se-sync">· synced 2 min ago</span><span class="se-lacts">${open ? `<button type="button" class="se-lb" data-go="${open}">${I("open")}${esc(opt.openLabel || "Open record")}</button>` : ""}${opt.extra || ""}</span></div>${inner}</div>`;
  const fromSsp = (label, text, opt = {}) => `<div class="sd-live v8d-ssp"><div class="sd-live-h"><span class="sd-live-tag">${I("link")}From the SSP</span><span>${esc(label)}${opt.ex ? " " + EX : ""}</span>${opt.ph ? `<span class="ak-chip warn">Placeholder text</span>` : ""}<span class="se-lacts"><button type="button" class="se-lb" data-go="ssp">${I("pen")}Edit in the SSP</button></span></div><p class="sd-p v8d-quote">${esc(text)}</p></div>`;
  const fromPlan = (key, label, text) => `<div class="sd-live v8d-ssp"><div class="sd-live-h"><span class="sd-live-tag">${I("link")}From the ${esc(PLANS[key].noun)}</span><span>${esc(label)}</span><span class="se-lacts"><button type="button" class="se-lb" data-go="${PLANS[key].route}">${I("open")}Open plan</button></span></div><p class="sd-p v8d-quote">${esc(text)}</p></div>`;
  const evid = (rows) => live(`Evidence · ${plural(rows.length, "artifact")}`, "evidence", tbl(["Evidence", "Owner"], rows.map(([t, o]) => [esc(t), o ? esc(o) : mu("No owner")])), { openLabel: "Open evidence" });
  const roleRows = (rows) => tbl(["Role", "Name", "In this plan"], rows.map(([r, n, x, ex]) => [esc(r), `${esc(n)}${ex ? " " + EX : ""}`, esc(x)]));
  const checkFacts = (rows) => `<div class="sd-tablebox"><table class="sd-table se-facts"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${v}</td></tr>`).join("")}</tbody></table></div>`;

  // ═════════ The three plans ═════════
  const PLANS = {
    cp: {
      key: "cp", route: "plan-cp", abbr: "CP", title: "WS-X90 Contingency Plan", noun: "contingency plan", std: "NIST SP 800-34 Rev 1", ctl: "CP-2", rev: 4, owner: "Amara Bell", state: "draft",
      pub: { rev: "3.1", at: "2026-07-28", ev: "WS-X90 contingency planning policy and recovery procedure set, revision 3.1, with distribution record", approvals: [["ISSM", "Joel Barrantes", "2026-07-21"], ["System owner", "Ray Colston", "2026-07-28"]] },
      steps: [["ISSM review", [["Joel Barrantes", "ISSM"]]], ["Approval", [["Ray Colston", "System owner"], ["R. Calloway", "Authorizing official"]]]],
      people: [["Amara Bell", "cp7.b", "Editing"], ["Joel Barrantes", "cp4.a", "Viewing"]],
      test: ["cp", "Contingency plan test on a whole article (CP-4)", "2027-04-12", "Amara Bell"],
      note: "Presence, comments, AI drafts, versions, the contacts, every RTO and RPO and the alternate site's address are examples. Roles, units and their functions, the CP-4 check, the risk, the SSP's text and the evidence are WS-X90's.",
      secs: [
        { id: "cp1", t: "Introduction and scope", p: 100, paras: [
          ["a", "This plan returns WS-X90 Sentinel Mission System to mission-ready after a disruption, from one failed line-replaceable unit to the loss of a whole article. It follows NIST SP 800-34 Rev 1 and answers CP-2 and its enhancements in the WS-X90 baseline."],
          ["b", "It covers the authorization boundary SYS-WSX90 and the ground support that provisions and maintains it. Identity services inherited from the corporate identity provider are recovered under that provider's own plan."]],
          blocks: [() => fromSsp("Section 5 · Authorization boundary", sspSec("s5")), () => fromSsp("CP-2 Contingency Plan · implementation narrative", sspNarr("CP-2"), { ph: !!(D.ctl("CP-2") || {}).ph })] },
        { id: "cp2", t: "Concept of operations", p: 100, paras: [
          ["a", "WS-X90 keeps flying through a compromised element. A failed partition integrity check drops the Mission Computer (LRU-001) into restricted safe mode instead of stopping the platform, and the mission continues on what it can still trust."],
          ["b", "Recovery runs in three phases: activation and notification, recovery, and reconstitution. Ground support performs every phase from the Provisioning Workstation (LRU-017); nothing is recovered over the tactical data link."]],
          blocks: [() => fromSsp("Section 4 · Mission and purpose", sspSec("s4"), { ex: !!(D.sec("s4") || {}).ex }), () => fromSsp("CP-12 Safe Mode · implementation narrative", sspNarr("CP-12"))] },
        { id: "cp3", t: "Roles and responsibilities", p: 100, src: "Program roles", paras: [],
          blocks: [() => live("Program roles · 6 of WS-X90's 7 holders, and the plan owner", "people-roles", roleRows([["Authorizing official", "R. Calloway", "Decides on continued operation after a whole article is lost"], ["ISSM", "Joel Barrantes", "Activates the plan; first approver"], ["ISSO", "Priya Raghavan", "Runs notification; records the event"], ["System owner", "Ray Colston", "Releases spares; approves reconstitution"], ["Lead assessor (SCA)", "D. Okafor", "Observes the CP-4 test"], ["Plan owner", "Amara Bell", "Keeps this plan; owns the CP-4 check", true]]), { openLabel: "Open roles" })] },
        { id: "cp4", t: "Activation and notification", p: 90, paras: [
          ["a", "The ISSM activates this plan when a unit cannot return to service within its recovery time objective, or when a whole article is lost. The ISSO notifies in the order below and records each call in the security log."],
          ["b", "Notification starts within 30 minutes of activation and ends when every name below, or their alternate, has answered.", { ex: true }]],
          blocks: [() => `<div class="sd-live v8d-plain"><div class="sd-live-h"><span>Contact list ${EX}</span></div>${tbl(["Order", "Role", "Name", "Primary", "Alternate"], [["1", "ISSM", "Joel Barrantes", "DSN 555-0141", "Priya Raghavan"], ["2", "System owner", "Ray Colston", "DSN 555-0177", "Joel Barrantes"], ["3", "ISSO", "Priya Raghavan", "DSN 555-0102", ME], ["4", "Authorizing official", "R. Calloway", "DSN 555-0110", "Through the ISSM"], ["5", "Depot spares cage", "Duty officer", "DSN 555-0190", "Ray Colston"]].map((r) => r.map(esc)))}</div>`] },
        { id: "cp5", t: "Recovery priorities", p: 60, src: "System tree and component records", paras: [
          ["a", "Units recover in mission order. The platform's objective is four hours for a whole article; it comes from the program's risk register, where it has never been measured on a whole article."]],
          blocks: [() => live(`System tree · 20 units, their functions from the component records · RTO and RPO ${EX}`, "composition", tbl(["#", "Unit", "Mission function", "RTO", "RPO"], RECOVERY.map(([l, rto, rpo], i) => [String(i + 1), `<span class="se-mono se-nw">${l}</span> ${esc(NAME[l])}`, esc(FN[l]), `<span class="se-nw">${esc(rto)}</span>`, esc(rpo)])), { openLabel: "Open composition" }),
            () => `<p class="v8d-risk">${h.pill("warn", "Risk · moderate")}<span>The four-hour recovery objective has never been measured on a whole article</span><button type="button" class="se-lb" data-go="risks">${I("open")}Open risks</button></p>`] },
        { id: "cp6", t: "Recovery and reconstitution", p: 100, paras: [
          ["a", "Recovery replaces or reimages the failed unit from the signed image in the Configuration Repository (LRU-020); the Update & Recovery Controller (LRU-016) stages it and the Secure Boot Controller (LRU-002) refuses anything unsigned."],
          ["b", "Reconstitution is complete when the unit passes measured boot, its configuration matches the Block 1 production baseline, and the ISSM closes the event. Keys and recovery material come back from the Secure Storage Module (LRU-015), never from the ground."]],
          blocks: [() => fromPlan("cmp", "Section 4 · Baselines", "Block 1 is the configuration the initial authorization assessed: firmware and software versions of every unit, hardened per the WS-X90 STIG profile.")] },
        { id: "cp7", t: "Alternate storage and backups", p: 80, src: "Evidence", paras: [
          ["a", "Backups of the Secure Storage Module leave the platform sealed and reach the alternate site each quarter; the 2026 Q3 transfer register records the receipt."],
          ["b", "Alternate site: Depot spares cage, Building 1140. It holds two spare mission computers and one complete ground support kit, inventoried each quarter.", { ex: true }]],
          blocks: [() => evid([["Backup transfer register extract, sealing to alternate-site receipt, 2026 Q3", "Joel Barrantes"], ["Monthly backup verification and scratch-restore report, LRU-016 to LRU-015, cycles 2026-07 to 2026-09", null], ["Secure Storage Module backup sealing policy and raw-partition inspection record, LRU-015", null], ["Maintenance alert log extract for overdue and failed backup verifications, LRU-016", ME]])] },
        { id: "cp8", t: "Plan testing", p: 70, src: "Continuous monitoring", paras: [
          ["a", "The plan is tested once a year on a whole article, which is the test the four-hour objective is waiting for. The semi-annual exercise restores a representative article only."]],
          blocks: [() => live("Continuous monitoring · recurring check", "conmon", checkFacts([["Check", "Contingency plan test on a whole article (CP-4)"], ["Cadence", "Yearly"], ["Owner", AK.owner("Amara Bell")], ["Next due", AK.due("2027-04-12")], ["Status", h.pill("none", "Planned")], ["Last exercise", "Semi-annual recovery exercise record, partial restore of representative article"]]), { openLabel: "Open check" }),
            () => fromSsp("CP-4 Contingency Plan Testing · implementation narrative", sspNarr("CP-4"))] },
      ],
      comments: [
        { id: "cpc1", at: "cp4", pid: "cp4.a", quote: "cannot return to service within its recovery time objective", thread: [["Joel Barrantes", "ISSM", "2026-11-14T10:20", "Which objective: the unit's or the platform's four hours? The activation test needs one number."], ["Amara Bell", "Plan owner", "2026-11-14T11:02", "The unit's, from the table in section 5. I'll say so in the next version."]] },
        { id: "cpc2", at: "cp7", pid: "cp7.b", quote: "Depot spares cage, Building 1140", thread: [["Ray Colston", "System owner", "2026-11-16T15:40", "The depot moves in March. Plan for both sites until then. @Amara Bell"]], task: { to: "Amara Bell", due: "2026-12-04" } },
        { id: "cpc3", at: "cp6", pid: "cp6.a", quote: "refuses anything unsigned", resolved: true, thread: [["D. Okafor", "Lead assessor (SCA)", "2026-11-13T09:15", "I'll ask to see the refusal during the CP-4 test."], ["Amara Bell", "Plan owner", "2026-11-13T10:02", "Added to the test plan. Resolving."]] },
      ],
      sugg: [
        { id: "cpg1", at: "cp4", kind: "insert", after: "cp4.b", pid: "cp4.g1", for: "Amara Bell", text: "Notification runs ISSM, system owner, ISSO, then the authorizing official when a whole article is lost. Each call is logged on the Security Log Collector (LRU-018) with the time it was made and answered.", sources: [["Program roles", "WS-X90 · 7 holders"], ["Evidence", "Incident report delivery path test report, LRU-007 primary and LRU-008 fallback"]] },
        { id: "cpg2", at: "cp6", kind: "replace", pid: "cp6.b", for: "Joel Barrantes", text: "Reconstitution is complete when the unit passes measured boot, its pin matches the published baseline with the same SHA-256, and the ISSM closes the event in the security log. Keys and recovery material come back from the Secure Storage Module (LRU-015), never from the ground.", sources: [["Configuration baseline", "Block 1 · 20 pins with SHA-256"], ["Evidence", "Restricted-state hold and controlled recovery test, LRU-002 with LRU-016"]] },
      ],
      draft: { id: "cpg3", at: "cp7", kind: "insert", after: "cp7.a", pid: "cp7.g3", for: ME, label: "Draft how backups leave the platform", text: "Each backup set is sealed on the Secure Storage Module (LRU-015) before it leaves the platform. The transfer register records who carried it and when the alternate site received it, and a scratch restore each month proves the set reads back.", sources: [["Evidence", "Backup transfer register extract, sealing to alternate-site receipt, 2026 Q3"], ["Evidence", "Monthly backup verification and scratch-restore report"]] },
      checks: [["high", "RTO and RPO of 20 units are examples", "Nobody has measured them, and the platform's four hours comes from a risk.", "cp5"], ["medium", "The SSP's CP-2 narrative is placeholder text", "This plan is what it should say; edit it in the SSP.", "cp1"], ["low", "The alternate site moves in March", "Ray Colston asks for both sites until then.", "cp7"]],
      versions: [
        { v: 14, at: "2026-11-17T09:48", who: ["Amara Bell"], changes: [["cp7", "Alternate site edited"]] },
        { v: 13, at: "2026-11-16T15:12", who: ["Amara Bell", "Joel Barrantes"], changes: [["cp4", "Activation criteria rewritten"], ["cp4", "Comment"]], was: { "cp7.b": "Alternate site: the depot spares cage. It holds two spare mission computers." } },
        { v: 12, at: "2026-11-14T10:05", who: ["Amara Bell"], kind: "named", name: "Recovery steps for the ISSM", changes: [["cp6", "Recovery paragraph rewritten"]], was: { "cp4.a": "The ISSM activates this plan when the platform cannot fly its mission. The ISSO notifies the people below." } },
        { v: 11, at: "2026-11-12T16:30", who: ["Amara Bell"], kind: "start", name: "Revision 4 started from revision 3.1", changes: [], was: { "cp6.a": "Recovery reimages the failed unit from the Configuration Repository (LRU-020) through the Update & Recovery Controller (LRU-016)." } },
      ],
    },
    irp: {
      key: "irp", route: "plan-irp", abbr: "IRP", title: "WS-X90 Incident Response Plan", noun: "incident response plan", std: "NIST SP 800-61 Rev 2", ctl: "IR-8", rev: 4, owner: "Priya Raghavan", state: "changes",
      reason: "The reporting windows are proposed. A signed plan names the CSSP's window and who makes the call.",
      round: { by: "Priya Raghavan", at: "2026-11-12T17:10", decided: "2026-11-13T14:05" },
      pub: { rev: "3", at: "2026-06-09", ev: "WS-X90 incident response plan revision 3, approval page and distribution list", approvals: [["ISSM", "Joel Barrantes", "2026-06-02"], ["System owner", "Ray Colston", "2026-06-09"]] },
      steps: [["ISSM review", [["Joel Barrantes", "ISSM"]]], ["Approval", [["Ray Colston", "System owner"]]]],
      people: [["Priya Raghavan", "ir4.a", "Editing"], ["Joel Barrantes", "ir2", "Viewing"]],
      test: ["ir", "Incident response tabletop (IR-3)", "2027-03-13", "Priya Raghavan"],
      note: "Presence, comments, AI drafts, versions, the review round, playbook status, the CSSP and the proposed reporting windows are examples. Roles, techniques and the risks that name them, the IR-3 check, the SSP's text and the evidence are WS-X90's; the 72-hour window is DFARS 252.204-7012's.",
      secs: [
        { id: "ir1", t: "Introduction and scope", p: 100, paras: [
          ["a", "This plan is how WS-X90 prepares for, detects, contains and learns from cyber incidents on the platform and its ground support. It follows NIST SP 800-61 Rev 2 and answers IR-8 in the WS-X90 baseline."],
          ["b", "It covers SYS-WSX90, with the Provisioning Workstation and the Maintenance Laptop wherever they are. Incidents on the corporate identity provider are that provider's to handle; WS-X90 reports what it sees."]],
          blocks: [() => fromSsp("Section 2 · Security categorization", `Confidentiality ${D.system.cia[0]}, integrity ${D.system.cia[1]}, availability ${D.system.cia[2]}. WS-X90 is Platform IT and a national security system.`), () => fromSsp("IR-8 Incident Response Plan · implementation narrative", sspNarr("IR-8"))] },
        { id: "ir2", t: "Roles", p: 90, src: "Program roles", paras: [],
          blocks: [() => live("Program roles · 4 of WS-X90's 7 holders, and the CSSP", "people-roles", roleRows([["ISSM", "Joel Barrantes", "Incident lead; declares and closes incidents"], ["ISSO", "Priya Raghavan", "First responder; reports to the CSSP"], ["System owner", "Ray Colston", "Takes an article out of service"], ["Authorizing official", "R. Calloway", "Told of CAT 1 and CAT 2; decides on continued operation"], ["CSSP", "Program CSSP watch desk", "Receives every report; runs network defense", true]]), { openLabel: "Open roles" })] },
        { id: "ir3", t: "Preparation", p: 100, src: "Evidence", paras: [
          ["a", "Detection rests on the Security Log Collector (LRU-018): rule set 3.4 correlates platform logs and opens a record in the protected incident store on the Secure Storage Module (LRU-015)."],
          ["b", "Responders train each year (IR-2) and rehearse in the tabletop below. Forensic capture of the mission computer's executable region and the secure boot integrity state is designed in, not improvised."]],
          blocks: [() => evid([["Forensic capture design record, LRU-001 executable region and LRU-002 integrity state, retention configuration", ME], ["Incident record schema and state-machine configuration export, LRU-018 v3.4", "Victor Amsel"], ["Automated triage timing test report, LRU-018 rule set 3.4 to LRU-015 incident store, build 4.2.1", "Wes Duarte"], ["Protected incident store extract, 12 auto-opened records, LRU-015, 2026-09-15 to 2026-10-15", "Victor Amsel"]])] },
        { id: "ir4", t: "Detection and analysis", p: 50, paras: [
          ["a", "An alert becomes an incident when the ISSO confirms it against the incident record schema. The ISSO categorizes it with the CJCSM 6510.01B categories and starts the clock below."]],
          blocks: [() => `<div class="sd-live v8d-plain"><div class="sd-live-h"><span>Reporting timelines · 4 proposed, 1 required</span></div>${tbl(["Report", "To", "Window", "Basis"], [["A confirmed incident, any category", "ISSM", "1 hour", "p"], ["CAT 1 or CAT 2: root or user intrusion", "CSSP", "1 hour from confirmation", "p"], ["CAT 1 or CAT 2", "Authorizing official", "24 hours", "p"], ["An incident that takes an article out of service", "System owner", "Same shift", "p"], ["A cyber incident affecting covered defense information", "DoD Cyber Crime Center (DC3)", "72 hours from discovery", "DFARS 252.204-7012"]].map(([a, b, c, d]) => [esc(a), esc(b), `<span class="se-nw">${esc(c)}</span>`, d === "p" ? `<span class="tag">Proposed</span> ${EX}` : esc(d)]))}</div>`] },
        { id: "ir5", t: "Playbooks", p: 50, src: "Threats", paras: [
          ["a", "Each playbook answers the ATT&CK techniques WS-X90's own risks name, worst risk first."]],
          blocks: [() => live(`Threats · ATT&amp;CK techniques named by ${h.fmt(23)} of WS-X90's 40 open risks · playbook status ${EX}`, "threats", tbl(["Playbook", "Techniques", "Risk it answers", "Severity", "Status"], PLAYBOOKS.map(([t, codes, risk, s, st2]) => [esc(t), `<span class="v8d-codes">${codes.map((c) => `<span class="ak-code">${c}</span>`).join("")}</span>`, esc(risk), sev(s), h.pill(st2[0], st2[1])])), { openLabel: "Open threats" })] },
        { id: "ir6", t: "Containment, eradication and recovery", p: 100, paras: [
          ["a", "Containment isolates before it investigates: the Protected Network Gateway (LRU-007) drops to its restricted state and the mission computer enters safe mode on a failed integrity check, so the mission keeps what it needs and an attacker loses the link."],
          ["b", "Eradication reimages from signed builds in the Configuration Repository (LRU-020); recovery follows the contingency plan. Evidence is captured before anything is reimaged."]],
          blocks: [() => fromPlan("cp", "Section 6 · Recovery and reconstitution", "Recovery replaces or reimages the failed unit from the signed image in the Configuration Repository (LRU-020); the Update & Recovery Controller (LRU-016) stages it and the Secure Boot Controller (LRU-002) refuses anything unsigned.")] },
        { id: "ir7", t: "Post-incident activity", p: 100, src: "Evidence", paras: [
          ["a", "Within ten working days the ISSM holds a lessons-learned review. Each weakness becomes an operational issue and, where it needs work, a POA&M item; this plan and the SSP change through their own reviews."]],
          blocks: [() => evid([["Incident-to-weakness reporting procedure revision 2, with four worked cases", "Wes Duarte"], ["Incident state-transition log sample, 18 tracked incidents, LRU-018 to LRU-015", null]])] },
        { id: "ir8", t: "Testing", p: 100, src: "Continuous monitoring", paras: [
          ["a", "The tabletop walks one playbook a year against the reporting clock; the annual capability test injects a detection case and an account-abuse case into the platform itself."]],
          blocks: [() => live("Continuous monitoring · recurring check", "conmon", checkFacts([["Check", "Incident response tabletop (IR-3)"], ["Cadence", "Yearly"], ["Owner", AK.owner("Priya Raghavan")], ["Next due", AK.due("2027-03-13")], ["Status", h.pill("none", "Planned")], ["Last test", "Annual incident response capability test report, injected detection and account-abuse cases"]]), { openLabel: "Open check" }),
            () => fromSsp("IR-3 Incident Response Testing · implementation narrative", sspNarr("IR-3"))] },
      ],
      comments: [
        { id: "irc1", at: "ir4", pid: "ir4.a", quote: "starts the clock below", thread: [["Joel Barrantes", "ISSM", "2026-11-13T14:05", "The CSSP's window can't be proposed in a signed plan. Name it, and who makes the call."], ["Priya Raghavan", "ISSO", "2026-11-13T16:20", "Asked the CSSP for their published window. Back by Nov 20."]], task: { to: "Priya Raghavan", due: "2026-11-20" } },
        { id: "irc2", at: "ir3", pid: "ir3.b", quote: "designed in, not improvised", thread: [["D. Okafor", "Lead assessor (SCA)", "2026-11-15T10:40", "Point me at the forensic capture design record; I'll sample it for IR-4."], ["Priya Raghavan", "ISSO", "2026-11-15T11:05", "It's Ingrid's: the forensic capture design record for LRU-001 and LRU-002, listed under section 3."]] },
        { id: "irc3", at: "ir6", pid: "ir6.b", quote: "Evidence is captured before anything is reimaged", resolved: true, thread: [["Joel Barrantes", "ISSM", "2026-11-12T09:30", "Keep this sentence; the assessor will test it."], ["Priya Raghavan", "ISSO", "2026-11-12T09:41", "Kept."]] },
      ],
      sugg: [
        { id: "irg1", at: "ir4", kind: "replace", pid: "ir4.a", for: "Priya Raghavan", text: "An alert becomes an incident when the ISSO confirms it against the incident record schema (LRU-018 v3.4). The ISSO categorizes it with the CJCSM 6510.01B categories, records the category in the incident store and starts the reporting clock below.", sources: [["Evidence", "Incident record schema and state-machine configuration export, LRU-018 v3.4"], ["Evidence", "Incident state-transition log sample, 18 tracked incidents"]] },
        { id: "irg2", at: "ir7", kind: "insert", after: "ir7.a", pid: "ir7.g1", for: "Joel Barrantes", text: "Each review records the ATT&CK technique the incident used, so the playbook that answers it is revised in the same meeting.", sources: [["Threats", "31 techniques named by risks"], ["Evidence", "Incident-to-weakness reporting procedure revision 2"]] },
      ],
      draft: { id: "irg3", at: "ir6", kind: "insert", after: "ir6.b", pid: "ir6.g3", for: ME, label: "Draft containment for a physical intrusion", text: "For a physical intrusion (T1200, T1091), containment seals the service connector and pulls the unit's log from the Security Log Collector before anyone touches the unit; the Maintenance Access Gateway (LRU-014) refuses sessions until the ISSM releases it.", sources: [["Threats", "T1200 Hardware Additions · T1091 Replication Through Removable Media"], ["Risk", "An unsealed service connector leaves a physical route into the maintenance path"]] },
      checks: [["high", "4 reporting windows are proposed", "Joel Barrantes requested changes until the CSSP's window is named.", "ir4"], ["medium", "3 playbooks are not written", "Physical access, boundary exfiltration and insider threat.", "ir5"], ["low", "Insider threat has no named owner", "The risk says so; this plan can name one.", "ir2"]],
      versions: [
        { v: 9, at: "2026-11-17T08:40", who: ["Priya Raghavan"], changes: [["ir4", "Detection paragraph rewritten"], ["ir4", "Reporting timelines added"]] },
        { v: 8, at: "2026-11-13T14:05", who: ["Joel Barrantes"], kind: "review", name: "Changes requested by Joel Barrantes", changes: [["ir4", "Comment"]], was: { "ir4.a": "An alert becomes an incident when the ISSO confirms it. The ISSO reports it promptly." } },
        { v: 7, at: "2026-11-12T17:10", who: ["Priya Raghavan"], kind: "named", name: "Sent to the ISSM", changes: [["ir6", "Containment paragraph rewritten"]], was: {} },
        { v: 6, at: "2026-11-10T09:30", who: ["Priya Raghavan"], kind: "start", name: "Revision 4 started from revision 3", changes: [], was: { "ir6.a": "Containment isolates the affected unit before anyone investigates it." } },
      ],
    },
    cmp: {
      key: "cmp", route: "plan-cmp", abbr: "CMP", title: "WS-X90 Configuration Management Plan", noun: "configuration management plan", std: "NIST SP 800-128", ctl: "CM-9", rev: 5, owner: ME, state: "draft",
      pub: { rev: "4.0", at: "2026-07-24", ev: "WS-X90 configuration management policy revision 4.0 and CM procedure set, with dissemination record", approvals: [["ISSM", "Joel Barrantes", "2026-07-22"], ["System owner", "Ray Colston", "2026-07-24"]] },
      steps: [["ISSM review", [["Joel Barrantes", "ISSM"]]], ["CCB chair", [["Ray Colston", "System owner"]]]],
      people: [["Marcus Ryde", "cm1.b", "Editing"], ["Priya Raghavan", "cm5", "Viewing"]],
      test: ["cm", "Configuration baseline audit (CM-2, CM-3)", "2026-12-28", ME],
      note: "Presence, comments, AI drafts, versions, the board's cadence and each change's analysis and significance are examples. The board's members, the baselines, all 20 pins and their SHA-256, the Block 1.1 changes, the trigger, the checks, the SSP's text and the evidence are WS-X90's.",
      secs: [
        { id: "cm1", t: "Introduction and scope", p: 100, paras: [
          ["a", "This plan controls every change to WS-X90's configuration, from one unit's firmware pin to a new block of the platform. It follows NIST SP 800-128 and answers CM-9 in the WS-X90 baseline."],
          ["b", "Configuration items are the twenty units of SYS-WSX90 and the images ground support builds. A change takes effect only when the Configuration Repository (LRU-020) holds it signed."]],
          blocks: [() => fromSsp("CM-9 Configuration Management Plan · implementation narrative", sspNarr("CM-9"))] },
        { id: "cm2", t: "Configuration control board", p: 90, src: "Program roles", paras: [
          ["a", "The board meets every second Tuesday and decides by the chair, after the ISSM's security impact analysis.", { ex: true }]],
          blocks: [() => live("Program roles and the SSP's editors · 6", "people-roles", tbl(["Board role", "Name", "Holds"], [["Chair", "Ray Colston", "System owner"], ["Member", "Joel Barrantes", "ISSM"], ["Member", "Priya Raghavan", "ISSO"], ["Member", ME, "Security engineer"], ["Member", "Marcus Ryde", "Component owner"], ["Observer", "D. Okafor", "Lead assessor (SCA)"]].map((r) => r.map(esc))), { openLabel: "Open roles" })] },
        { id: "cm3", t: "Configuration items", p: 100, src: "Configuration baselines", paras: [],
          blocks: [() => live("Configuration baselines · Block 1 (published Jul 20) and Block 1.1 (draft) · 20 component pins", "inventory", tbl(["Unit", "Element", "Block 1", "Block 1.1", "SHA-256"], PINS.map(([l, n, a, b, sha]) => [`<span class="se-mono se-nw">${l}</span>`, esc(n), `<span class="se-nw">${esc(a)}</span>`, a === b ? `<span class="se-nw v8d-mu">Unchanged</span>` : `<b class="se-nw">${esc(b)}</b>`, `<span class="se-mono">${sha}…</span>`])), { openLabel: "Open inventory" })] },
        { id: "cm4", t: "Baselines", p: 100, src: "Configuration baselines", paras: [
          ["a", "Block 1 is the configuration the initial authorization assessed. The Provisioning Workstation and Maintenance Laptop images are its STIG-hardened builds; their checklists live with the STIGs."]],
          blocks: [() => live("Configuration baselines · 2", "inventory", tbl(["Baseline", "Version", "State", "Published"], [["WS-X90 Block 1 production configuration", "1", h.pill("ok", "Published"), "Jul 20, 2026"], ["WS-X90 Block 1.1 configuration (proposed)", "2", h.pill("none", "Draft"), mu("Not published")]].map(([a, b, c, d]) => [esc(a), b, c, d])) + `<p class="sd-p v8d-quote">Block 1: the configuration the initial authorization assessed, firmware and software versions of every line-replaceable unit, hardened per the WS-X90 STIG profile. Block 1.1: proposed for FY2027, secure boot and gateway firmware updates, the non-persistent maintenance image and the separation kernel on the mission computer.</p>`, { openLabel: "Open inventory", extra: `<button type="button" class="se-lb" data-go="stigs">${I("open")}STIG checklists</button>` })] },
        { id: "cm5", t: "Change control", p: 60, src: "Scope changes", paras: [
          ["a", "Every change starts as a change record in the Configuration Repository, goes through security impact analysis and reaches the board. Emergency changes are allowed for a failed unit and are reviewed at the next board."]],
          blocks: [() => live(`Scope changes · 10 proposed for Block 1.1 · analysis ${EX}`, "inventory-changes", tbl(["Unit", "From", "To", "Why", "Analysis (CM-4)", "Significant"], CHANGES.map(([l, why, a, sig]) => { const p = PINS.find((x) => x[0] === l); return [`<span class="se-mono se-nw">${l}</span>`, `<span class="se-nw">${esc(p[2])}</span>`, `<span class="se-nw">${esc(p[3])}</span>`, why ? esc(why) : `<span class="v8d-bad">No change note recorded</span>`, h.pill(SIA[a][0], SIA[a][1]), sig ? esc(sig) : mu("Not decided")]; })), { openLabel: "Open scope changes" })] },
        { id: "cm6", t: "Security impact analysis", p: 80, src: "Reauthorization triggers", paras: [
          ["a", "The ISSM's analysis asks what each change does to the controls that rest on the unit and whether it is significant. A change to the boundary, to cryptography or to how the mission computer separates its partitions is significant and goes to the authorizing official."],
          ["b", "Block 1.1 is significant as a whole: it is the reauthorization trigger for a new configuration in the SSP, now under review in continuous monitoring."]],
          blocks: [() => live("Continuous monitoring · reauthorization trigger", "conmon", checkFacts([["Trigger", "Significant change: a new configuration in the SSP"], ["Reads", "SSP 3 drafts the Block 1.1 configuration"], ["State", h.pill("warn", "Review")], ["Changes analysed", `5 of 10 · 3 significant ${EX}`]]), { openLabel: "Open triggers" })] },
        { id: "cm7", t: "Configuration monitoring", p: 70, src: "Continuous monitoring", paras: [
          ["a", "Monitoring compares every unit with its pin: monthly STIG scans of the two ground support images, a quarterly configuration baseline audit, and a monthly reconciliation of applied changes against the security log."]],
          blocks: [() => live("Continuous monitoring · 2 recurring checks", "conmon", tbl(["Check", "Cadence", "Owner", "Next due", "Status"], [["Configuration baseline audit (CM-2, CM-3)", "Quarterly", AK.owner(ME), AK.due("2026-12-28", { prefix: false }), h.pill("none", "Planned")], ["STIG compliance scan (CM-6)", "Monthly", AK.owner("Joel Barrantes"), AK.due("2026-11-11", { prefix: false }), h.pill("bad", "Blocked")]].map(([a, b, c, d, e]) => [esc(a), b, c, d, e])), { openLabel: "Open checks" }),
            () => evid([["Monthly applied-change reconciliation output, LRU-020 against LRU-018, September and October 2026", null], ["Baseline rollback exercise to N-2 retained version, LRU-020 to LRU-016, baseline 5.3.2", null], ["Change record CR-2026-0418 test result, control validation statement and signer identity", null]]),
            () => fromSsp("Section 13 · Continuous monitoring strategy", sspSec("s13"), { ex: !!(D.sec("s13") || {}).ex })] },
      ],
      comments: [
        { id: "cmc1", at: "cm5", pid: "cm5.a", quote: "Emergency changes are allowed for a failed unit", thread: [["Joel Barrantes", "ISSM", "2026-11-16T09:10", "Who approves an emergency change at night? Name my alternate."]] },
        { id: "cmc2", at: "cm6", pid: "cm6.b", quote: "Block 1.1 is significant as a whole", thread: [["Ray Colston", "System owner", "2026-11-17T08:55", "Agreed. I'll brief the AO at the December board."]] },
        { id: "cmc3", at: "cm1", pid: "cm1.b", quote: "holds it signed", resolved: true, thread: [["Marcus Ryde", "Component owner", "2026-11-16T11:25", "CFG-REPO 2.9.0 signs image builds too, not only configurations."], [ME, "Security engineer", "2026-11-16T11:40", "It's in Block 1.1's pin for LRU-020. Resolving."]] },
      ],
      sugg: [
        { id: "cmg1", at: "cm5", kind: "insert", after: "cm5.a", pid: "cm5.g1", for: ME, text: "LRU-017's image moves from 2026.06 to 2026.10 with no change note. A pin with no recorded reason cannot pass security impact analysis, so the board sends it back until the reason is recorded.", sources: [["Configuration baseline", "Block 1.1 · LRU-017 pin"], ["Scope changes", "10 proposed for Block 1.1"]] },
        { id: "cmg2", at: "cm6", kind: "replace", pid: "cm6.a", for: "Joel Barrantes", text: "For each change the ISSM records which controls rest on the unit, what the change does to each, and whether it is significant. A change to the boundary, to cryptography or to partition separation on the mission computer is significant and goes to the authorizing official before the board approves it.", sources: [["Reauthorization trigger", "Significant change: a new configuration in the SSP"], ["Evidence", "Change record CR-2026-0418 test result"]] },
      ],
      draft: { id: "cmg3", at: "cm5", kind: "insert", after: "cm5.a", pid: "cm5.g3", for: ME, label: "Draft the emergency change procedure", text: "At night the ISSO, as the ISSM's alternate, may approve a change that returns a failed unit to service. The change record is opened within four hours and the board reviews it at its next meeting.", sources: [["Comment", "Joel Barrantes on emergency changes"], ["Evidence", "Unapproved change release refusal test and change-record aging query output, LRU-020"]] },
      checks: [["high", "LRU-017 changes with no change note", "Its image moves to 2026.10 without a recorded reason.", "cm5"], ["medium", "5 of 10 changes have no finished analysis", "Block 1.1 can't reach the board until they do.", "cm5"], ["medium", "The STIG compliance scan is blocked", "Due Nov 11; it is the check behind CM-6.", "cm7"]],
      versions: [
        { v: 7, at: "2026-11-17T10:05", who: [ME], changes: [["cm6", "Security impact analysis rewritten"]] },
        { v: 6, at: "2026-11-16T11:20", who: ["Marcus Ryde"], changes: [["cm1", "Scope paragraph edited"]], was: { "cm6.a": "The ISSM analyses each change for its security impact before the board decides." } },
        { v: 5, at: "2026-11-14T09:00", who: [ME], kind: "start", name: "Revision 5 started from revision 4.0", changes: [], was: { "cm1.b": "Configuration items are the twenty units of SYS-WSX90. A change takes effect when the board approves it." } },
      ],
    },
  };
  const KEYS = ["cp", "irp", "cmp"];
  const DOCS = [["ssp", "WS-X90 System Security Plan", "SSP"], ["cp", PLANS.cp.title, "CP"], ["irp", PLANS.irp.title, "IRP"], ["cmp", PLANS.cmp.title, "CMP"]];

  // ——— Text store: paragraph ids per section, and their current text ———
  const TX = {}, PEX = new Set();
  for (const k of KEYS) {
    const pl = PLANS[k];
    TX[k] = { order: {}, text: {} };
    for (const s of pl.secs) {
      TX[k].order[s.id] = (s.paras || []).map(([pid]) => s.id + "." + pid);
      for (const [pid, t, o] of s.paras || []) { TX[k].text[s.id + "." + pid] = t; if (o && o.ex) PEX.add(s.id + "." + pid); }
    }
  }
  const secOf = (pl, id) => pl.secs.find((s) => s.id === id);
  const secNo = (pl, id) => pl.secs.findIndex((s) => s.id === id) + 1;
  const secLabel = (pl, id) => { const s = secOf(pl, String(id).split(".")[0]); return s ? `${secNo(pl, s.id)} ${s.t}` : String(id); };

  // ——— Session state (module variables, so it survives route changes) ———
  const ST = {};
  const st = (k) => ST[k] || (ST[k] = { side: "comments", touched: false, active: null, cfilter: "open", mtab: "comments", atab: "checks", out: false, sessionV: null, drafted: false, drafting: false, state: PLANS[k].state, sent: null, newc: null });
  const HST = {};
  const hst = (k) => HST[k] || (HST[k] = { sel: 0, changes: true, named: false, sheet: false, hit: -1 });
  const stateOf = (k) => (k === "ssp" ? sspState()[0] : st(k).state);
  const locked = (pl) => st(pl.key).state === "review";
  function sspState() {
    const e = D.session.find((x) => x.kind === "submit");
    if (!e) return ["draft"];
    if (/requested changes/i.test(e.what)) return ["changes"];
    if (/Withdrew/i.test(e.what)) return ["draft"];
    return ["review", /approved/i.test(e.what) ? "AO review" : "ISSM review"];
  }
  const STATE = { draft: ["none", "Draft", ""], review: ["warn", "In review", "warn"], changes: ["bad", "Changes requested", "bad"], published: ["ok", "Published", "ok"] };
  const statePill = (s) => h.pill(STATE[s][0], STATE[s][1]);
  const stateChip = (s) => AK.chip(STATE[s][1], STATE[s][2] ? { tone: STATE[s][2] } : { tone: "warn" });
  const saveText = (pl) => `Saved · version ${pl.versions[0].v}`;

  // ——— Versions: each older version keeps the paragraphs that differ from the version after it ———
  function textAt(pl, idx) {
    const t = Object.assign({}, TX[pl.key].text);
    for (let i = 1; i <= idx && i < pl.versions.length; i++) Object.assign(t, pl.versions[i].was || {});
    return t;
  }
  function change(pl, pid, oldText, what) {
    const s = st(pl.key);
    if (!s.sessionV || pl.versions[0] !== s.sessionV) {
      const top = pl.versions[0];
      top.was = top.was || {};
      s.sessionV = { v: top.v + 1, at: D.now(), who: [ME], changes: [], was: {}, session: true };
      pl.versions.unshift(s.sessionV);
    }
    const prev = pl.versions[1];
    prev.was = prev.was || {};
    if (!(pid in prev.was)) prev.was[pid] = oldText;
    const sec = pid.split(".")[0];
    if (!s.sessionV.changes.some((c) => c[0] === sec && c[1] === what)) s.sessionV.changes.push([sec, what]);
    s.sessionV.at = D.now();
  }
  function restore(pl, idx) {
    const target = textAt(pl, idx), cur = Object.assign({}, TX[pl.key].text), top = pl.versions[0];
    top.was = top.was || {};
    const V = { v: top.v + 1, at: D.now(), who: [ME], kind: "restore", name: `Restored from version ${pl.versions[idx].v}`, changes: [], was: {} };
    for (const pid of new Set([...Object.keys(cur), ...Object.keys(target)])) {
      const a = cur[pid] == null ? null : cur[pid], b = target[pid] == null ? null : target[pid];
      if (a === b) continue;
      top.was[pid] = a; TX[pl.key].text[pid] = b;
      const sec = pid.split(".")[0];
      if (!V.changes.some((c) => c[0] === sec)) V.changes.push([sec, "Restored"]);
    }
    pl.versions.unshift(V);
    st(pl.key).sessionV = null;
    return V;
  }

  // ═════════ The plan editor (full window, on the SSP editor's classes) ═════════
  const swBtn = (cur) => `<button type="button" class="v8d-swb" data-v8d-act="docs" data-cur="${cur}" aria-haspopup="menu" aria-expanded="false" aria-label="Switch plan" title="Switch plan">${I("docs")}${I("down")}</button>`;
  function docLine(k) {
    if (k === "ssp") { const s = sspState(); return `Revision ${D.doc.revision} · ${s[0] === "review" ? "In review" : s[0] === "changes" ? "Changes requested" : "Draft"}`; }
    const pl = PLANS[k];
    return `Revision ${pl.rev} · ${STATE[stateOf(k)][1]} · ${saveText(pl)}`;
  }
  const docsMenu = (cur) => `<div class="se-menu" role="menu" aria-label="Plans">${DOCS.map(([k, t, a]) => `<button type="button" class="se-mi${k === cur ? " on" : ""}" role="menuitemradio" aria-checked="${k === cur}" data-v8d-go="${k === "ssp" ? "ssp" : PLANS[k].route}"><span class="ak-code">${a}</span><span class="se-mi-t"><b>${esc(t)}</b><span>${esc(docLine(k))}</span></span>${k === cur ? `<span class="se-mi-c">${AK.i("check")}</span>` : ""}</button>`).join("")}<div class="se-mi-g">WS-X90's plans</div><button type="button" class="se-mi" role="menuitem" data-v8d-go="ssps">${I("toc")}<span class="se-mi-t"><b>All plans</b><span>The Plans register</span></span></button></div>`;

  function markText(pl, pid, t) {
    const R = [];
    for (const c of pl.comments) { if (c.pid !== pid) continue; const i = t.indexOf(c.quote); if (i >= 0) R.push([i, i + c.quote.length, c]); }
    R.sort((a, b) => a[0] - b[0]);
    let out = "", pos = 0;
    for (const [s0, e0, c] of R) { if (s0 < pos) continue; out += esc(t.slice(pos, s0)) + `<span class="sd-mark${c.resolved ? " resolved" : ""}${st(pl.key).active === c.id ? " on" : ""}" data-v8d-cid="${c.id}">${esc(t.slice(s0, e0))}</span>`; pos = e0; }
    return out + esc(t.slice(pos));
  }
  function paraHTML(pl, pid) {
    const t = TX[pl.key].text[pid];
    if (t == null) return "";
    const ed = !locked(pl), pres = pl.people.find((p) => p[1] === pid && p[2] === "Editing");
    const c = pres ? col(pres[0]) : "";
    return `${pres ? `<div class="v8d-who" style="--c:${c}">${av(pres[0], 18)}${esc(pres[0])} is editing</div>` : ""}<p class="sd-p v8d-ed${pres ? " v8d-live" : ""}" data-v8d-p="${pid}"${pres ? ` style="--c:${c}"` : ""}${ed ? ' contenteditable="true" spellcheck="false" role="textbox" aria-multiline="true"' : ""} aria-label="${esc(secLabel(pl, pid))}, paragraph">${markText(pl, pid, t)}${PEX.has(pid) ? " " + EXS : ""}${pres ? `<span class="sd-cur" data-v8d-skip contenteditable="false" style="--c:${c}" data-name="${esc(pres[0])}"></span>` : ""}</p>`;
  }
  function aiBlock(pl, g) {
    const base = g.kind === "replace" ? TX[pl.key].text[g.pid] || "" : "";
    const body = g.kind === "replace" ? U.diff(base, g.text) : `<ins class="sd-ins">${esc(g.text)}</ins>`;
    const acts = locked(pl) ? `<span class="se-aib-w">${I("lock")}Locked while the plan is in review</span>` : `<button type="button" class="btn sm" data-v8d-act="accept" data-id="${g.id}">${I("check")}Accept</button><button type="button" class="btn sm" data-v8d-act="reject" data-id="${g.id}">${I("x")}Reject</button><button type="button" class="se-lb" data-v8d-act="card" data-id="${g.id}">${I("chat")}In the margin</button>`;
    return `<div class="se-aib" data-v8d-sid="${g.id}"><div class="se-aib-h"><span class="se-aib-l">${I("sparkle")}Narrative drafter · AI agent</span><span class="se-aib-w">Asked by ${esc(g.for)} · ${g.kind === "insert" ? "adds a paragraph" : "rewrites this paragraph"}</span></div>
      <div class="v8d-aitext">${body}</div><div class="se-srcs"><span class="se-k">Sources</span>${g.sources.map(srcChip).join("")}</div><div class="se-aib-b">${acts}</div></div>`;
  }
  const aiAfter = (pl, pid) => pl.sugg.filter((g) => !g.done && (g.kind === "replace" ? g.pid === pid : g.after === pid)).map((g) => aiBlock(pl, g)).join("");
  function secHTML(pl, s, i) {
    const paras = (TX[pl.key].order[s.id] || []).map((pid) => (TX[pl.key].text[pid] == null ? "" : paraHTML(pl, pid) + aiAfter(pl, pid))).join("");
    return `<section class="se-sec v8d-sec" id="v8d-${s.id}" data-at="${s.id}" aria-labelledby="v8d-h-${s.id}"><h2 class="sd-h1" id="v8d-h-${s.id}"><span class="sd-num">${i + 1}</span>${esc(s.t)}</h2>${paras}${(s.blocks || []).map((f) => f(pl)).join("")}</section>`;
  }
  const pageHTML = (pl) => `<header class="se-cover"><h1 class="sd-title">${esc(pl.title)}</h1><div class="sd-sub">SYS-WSX90 · Revision ${pl.rev} · ${STATE[stateOf(pl.key)][1]} · ${esc(pl.std)} · ${pl.ctl}</div></header>${pl.secs.map((s, i) => secHTML(pl, s, i)).join("")}`;
  const presenceDots = (pl, sid) => { const ps = pl.people.filter((p) => p[1].split(".")[0] === sid); return ps.length ? `<span class="se-dots" aria-hidden="true">${ps.map((p) => `<span class="se-dot" style="--c:${col(p[0])}" title="${esc(p[0])}"></span>`).join("")}</span>` : ""; };
  function outlineHTML(pl) {
    return `<div class="se-out-h"><b>Contents</b><button type="button" class="se-ib se-out-x" data-v8d-act="contents" aria-label="Close contents">${I("x")}</button></div>
      <ul class="se-ol">${pl.secs.map((s, i) => `<li class="se-oli"><button type="button" class="se-o" data-v8d-act="goto" data-at="${s.id}"><span class="ak-donut se-ring" style="--p:${s.p}" aria-hidden="true"></span><span class="se-o-n">${i + 1}</span><span class="se-o-t">${esc(s.t)}</span>${s.src ? `<span class="se-o-live" title="Live data: ${esc(s.src)}">${I("live")}</span>` : ""}${presenceDots(pl, s.id)}<span class="se-sr">, ${s.p}% complete</span></button></li>`).join("")}</ul>
      <div class="se-out-f v8d-outf"><dl class="ak-kv"><dt>Structure</dt><dd>${esc(pl.std)}</dd><dt>Answers</dt><dd><span class="ak-code">${pl.ctl}</span></dd><dt>On record</dt><dd>Revision ${pl.pub.rev}</dd><dt>Owner</dt><dd>${AK.owner(pl.owner)}</dd></dl></div>`;
  }
  function headHTML(pl) {
    const s = st(pl.key), n = pl.comments.filter((c) => !c.resolved).length, state = stateOf(pl.key);
    const sub = state === "review" ? ["In review", "In review", false] : state === "changes" ? ["Resubmit for review", "Resubmit", true] : ["Submit for review", "Submit", true];
    return `<header class="se-head">
      <div class="se-head-l">${AK.back("Plans", "ssps")}
        <div class="se-head-row"><span class="se-title v8d-title" role="heading" aria-level="1" title="${esc(pl.title)}">${esc(pl.title)}</span>${swBtn(pl.key)}
          <span class="se-chips">${AK.chip("Revision " + pl.rev)}${stateChip(state)}${AK.chip(pl.ctl)}</span>
          <span class="se-save" id="v8d-save" role="status" aria-live="polite">${I("cloud")}<span class="se-save-t">${esc(saveText(pl))}</span></span></div></div>
      <div class="se-head-r">
        <div class="se-pres" role="group" aria-label="People in this plan">${pl.people.map(([nm, at, doing]) => `<button type="button" class="se-pav" data-v8d-act="goto" data-at="${at.split(".")[0]}" aria-label="${esc(`${nm}, ${ROLE[nm] || ""}: ${doing} ${secLabel(pl, at)}`)}" title="${esc(`${nm} · ${doing} ${secLabel(pl, at)}`)}">${av(nm, 26)}</button>`).join("")}<span class="se-you">+ you</span></div>
        <button type="button" class="se-pstack" data-modal="v8d-people" data-id="${pl.key}" aria-label="People in this plan: ${pl.people.length} others and you">${pl.people.map((p) => av(p[0], 22)).join("")}</button>
        <button type="button" class="se-hb${s.side === "comments" ? " on" : ""}" data-v8d-act="side" data-side="comments" aria-pressed="${s.side === "comments"}" aria-label="Comments: ${n} open">${I("chat")}<span class="num">${n}</span></button>
        <button type="button" class="se-ib se-hist" data-go="${pl.route}-history" aria-label="Version history" title="Version history">${I("history")}</button>
        <button type="button" class="se-ib se-morebtn" data-v8d-act="more" data-id="${pl.key}" aria-haspopup="menu" aria-expanded="false" aria-label="More">${I("dots")}</button>
        <button type="button" class="btn${sub[2] ? " ink" : ""} se-submit" data-modal="v8d-submit" data-id="${pl.key}"><span class="se-l">${sub[0]}</span><span class="se-s">${sub[1]}</span></button>
      </div></header>`;
  }
  function toolbarHTML(pl) {
    const b = (cmd, label, icon) => `<button type="button" class="se-tbb" data-v8d-cmd="${cmd}" aria-label="${label}" title="${label}">${icon}</button>`;
    return `<div class="se-tb" role="toolbar" aria-label="Plan tools">
      <button type="button" class="se-tbb se-tbc" data-v8d-act="contents" aria-label="Contents">${I("toc")}<span>Contents</span></button><span class="se-sep se-tbc"></span>
      ${b("undo", "Undo", I("undo"))}${b("redo", "Redo", I("redo"))}<span class="se-sep"></span>
      ${b("bold", "Bold", "<b>B</b>")}${b("italic", "Italic", "<i>I</i>")}${b("underline", "Underline", "<u>U</u>")}<span class="se-sep"></span>
      <button type="button" class="se-tbb" data-v8d-act="comment" aria-label="Add comment" title="Add comment on the selected words">${I("cplus")}</button>
      <span class="se-tbsp"></span>${locked(pl) ? `<span class="se-modechip">${AK.chip("Locked for review", { icon: "eye" })}</span>` : ""}
      <button type="button" class="se-tbb se-asst${st(pl.key).side === "assist" ? " on" : ""}" data-v8d-act="side" data-side="assist" aria-pressed="${st(pl.key).side === "assist"}">${I("sparkle")}<span>Assist</span></button>
    </div>`;
  }
  const byFirst = (a, b) => a.thread[0][2].localeCompare(b.thread[0][2]);
  function commentCard(pl, c) {
    const on = st(pl.key).active === c.id, [who, role, iso, text] = c.thread[0];
    return `<article class="se-card${on ? " on" : ""}${c.resolved ? " done" : ""}" data-v8d-card="${c.id}" tabindex="0" aria-label="Thread by ${esc(who)} on ${esc(secLabel(pl, c.at))}">
      <div class="se-ch">${av(who, 28)}<div class="se-cw"><b>${esc(who)}</b><span class="se-role">${esc(role)}</span></div>${c.resolved ? `<button type="button" class="se-ib" data-v8d-act="reopen" data-id="${c.id}" aria-label="Reopen thread" title="Reopen">${I("history")}</button>` : `<button type="button" class="se-ib" data-v8d-act="resolve" data-id="${c.id}" aria-label="Resolve thread" title="Resolve">${I("check")}</button>`}</div>
      <div class="se-ct"><span>${esc(U.when(iso))}</span><span>· ${esc(secLabel(pl, c.at))}</span></div>
      <blockquote class="se-q1">${esc(c.quote)}</blockquote>
      ${c.task ? `<div class="se-task">${I("task")}<span>Assigned to ${esc(c.task.to)}</span>${AK.due(c.task.due)}</div>` : ""}
      <div class="se-cx">${mentions(text)}</div>
      ${c.thread.slice(1).map(([w, , t2, x]) => `<div class="se-rep">${av(w, 22)}<div><div class="se-rep-h"><b>${esc(w)}</b><span>${esc(U.when(t2))}</span></div><div class="se-cx">${mentions(x)}</div></div></div>`).join("")}
      ${c.resolved ? `<div class="se-res">${I("check")}Resolved${c.resolvedBy ? " by " + esc(c.resolvedBy) : ""}</div>` : on ? `<div class="se-rb"><textarea class="se-ta" data-v8d-reply="${c.id}" rows="2" placeholder="Reply or add others with @" aria-label="Reply to ${esc(who)}"></textarea><div class="se-rb-b"><button type="button" class="btn sm" data-v8d-act="deact">Cancel</button><button type="button" class="btn sm" data-v8d-act="reply" data-id="${c.id}">Reply</button></div></div>` : ""}
    </article>`;
  }
  function suggCard(pl, g) {
    const on = st(pl.key).active === g.id, base = g.kind === "replace" ? TX[pl.key].text[g.pid] || "" : "";
    const what = g.kind === "replace" && !g.done ? U.diff(base, g.text) : `<ins class="sd-ins">${esc(g.text)}</ins>`;
    const done = g.done ? `<div class="se-res">${I(g.done === "accepted" ? "check" : "x")}${g.done === "accepted" ? "Accepted" : "Rejected"} by ${esc(g.doneBy)}</div>` : locked(pl) ? `<p class="se-hint">Locked while the plan is in review.</p>` : `<div class="se-gb"><button type="button" class="btn sm" data-v8d-act="accept" data-id="${g.id}">${I("check")}Accept</button><button type="button" class="btn sm" data-v8d-act="reject" data-id="${g.id}">${I("x")}Reject</button></div>`;
    return `<article class="se-card se-g ai${on ? " on" : ""}${g.done ? " done" : ""}" data-v8d-card="${g.id}" tabindex="0" aria-label="AI draft for ${esc(secLabel(pl, g.at))}">
      <div class="se-ch"><span class="se-aiav" aria-hidden="true">${I("sparkle")}</span><div class="se-cw"><b>Narrative drafter · AI agent</b><span class="se-role">Asked by ${esc(g.for)}</span></div></div>
      <div class="se-ct"><span>${esc(secLabel(pl, g.at))}</span><span>· ${g.kind === "insert" ? "Adds a paragraph" : "Rewrites a paragraph"}</span></div>
      <div class="se-cx se-gx">${what}</div><div class="se-srcs"><span class="se-k">Sources</span>${g.sources.map(srcChip).join("")}</div>${done}</article>`;
  }
  function newCommentCard(pl) {
    const c = st(pl.key).newc;
    return c ? `<article class="se-card se-new-c on" data-v8d-card="new"><div class="se-ch">${av(ME, 28)}<div class="se-cw"><b>${ME}</b><span class="se-role">Security engineer</span></div></div><blockquote class="se-q1">${esc(c.quote)}</blockquote>
      <textarea class="se-ta" data-v8d-reply="new" rows="2" placeholder="Comment or add others with @" aria-label="New comment"></textarea><div class="se-rb-b"><button type="button" class="btn sm" data-v8d-act="cancelnew">Cancel</button><button type="button" class="btn sm" data-v8d-act="post">Comment</button></div></article>` : "";
  }
  function marginHTML(pl) {
    const s = st(pl.key), tab = s.mtab;
    const open = pl.comments.filter((c) => !c.resolved), done = pl.comments.filter((c) => c.resolved), pend = pl.sugg.filter((g) => !g.done), closed = pl.sugg.filter((g) => g.done);
    const items = tab === "comments" ? (s.cfilter === "open" ? open : done).slice().sort(byFirst).map((c) => commentCard(pl, c)) : (s.cfilter === "open" ? pend : closed).map((g) => suggCard(pl, g));
    return `<div class="se-mh"><div class="se-mtabs" role="tablist" aria-label="Threads">${[["comments", "Comments", open.length], ["sugg", "AI drafts", pend.length]].map(([k, l, n]) => `<button type="button" role="tab" aria-selected="${tab === k}" class="se-mtab${tab === k ? " on" : ""}" data-v8d-act="mtab" data-k="${k}">${l}<span class="ct num">${n}</span></button>`).join("")}<span class="se-tbsp"></span><button type="button" class="se-ib" data-v8d-act="side" data-side="" aria-label="Close comments">${I("x")}</button></div>
      <div class="se-mf"><div class="se-seg" role="group" aria-label="Show threads">${[["open", "Open"], ["done", tab === "comments" ? "Resolved" : "Decided"]].map(([k, l]) => `<button type="button" aria-pressed="${s.cfilter === k}" data-v8d-act="cfilter" data-k="${k}">${l}</button>`).join("")}</div><span class="se-hint">Oldest first</span></div></div>
      <div class="se-cards">${tab === "comments" ? newCommentCard(pl) : ""}${items.length ? items.join("") : `<p class="se-none">${s.cfilter === "open" ? (tab === "comments" ? "No open threads." : "No AI drafts waiting.") : "Nothing here yet."}</p>`}</div>`;
  }
  function assistHTML(pl) {
    const s = st(pl.key), t = s.atab, pend = pl.sugg.filter((g) => !g.done);
    const sevPill = (x) => (x === "high" ? h.pill("bad", "High") : x === "medium" ? h.pill("warn", "Medium") : h.pill("none", "Low"));
    const body = t === "checks"
      ? pl.checks.map(([x, title, detail, at]) => `<div class="se-chk"><div class="se-chk-h">${sevPill(x)}<b>${esc(title)}</b></div><p>${esc(detail)}</p><button type="button" class="se-lb" data-v8d-act="goto" data-at="${at}">${I("right")}Go to section ${esc(secLabel(pl, at))}</button></div>`).join("")
      : `<div class="se-chk"><div class="se-chk-h"><span class="se-aiav" aria-hidden="true">${I("sparkle")}</span><b>Narrative drafter</b>${h.pill("info", "AI agent")}</div><p>Drafts plan text from WS-X90's records and cites what it read. A draft is credited to the agent and to the person who asked, and changes nothing until a person accepts it.</p>
        ${pend.length ? `<div class="v8d-alist">${pend.map((g) => `<button type="button" class="se-lb" data-v8d-act="card" data-id="${g.id}">${I("right")}Section ${esc(secLabel(pl, g.at))} · asked by ${esc(g.for)}</button>`).join("")}</div>` : `<p class="se-hint">No drafts waiting.</p>`}
        ${s.drafted ? `<p class="se-hint">${I("check")}Drafted · waiting in section ${esc(secLabel(pl, pl.draft.at))}</p>` : `<button type="button" class="btn sm se-gen" data-v8d-act="draft"${s.drafting ? ' aria-disabled="true"' : ""}>${I("sparkle")}${s.drafting ? "Drafting…" : esc(pl.draft.label)}</button>`}
        <button type="button" class="se-lb" data-go="ai-drafts">${I("open")}Open AI agents</button></div>`;
    return `<div class="se-ah"><span class="se-at">${I("sparkle")}Assist</span><span class="se-tbsp"></span><button type="button" class="se-ib" data-v8d-act="side" data-side="" aria-label="Close Assist">${I("x")}</button></div>
      <div class="se-atabs" role="tablist" aria-label="Assist">${[["checks", "Checks", pl.checks.length], ["agent", "Narrative drafter", pend.length]].map(([k, l, n]) => `<button type="button" role="tab" aria-selected="${t === k}" class="se-atab${t === k ? " on" : ""}" data-v8d-act="atab" data-k="${k}">${l}<span class="ct num">${n}</span></button>`).join("")}</div>
      <div class="se-ab">${body}</div>
      <p class="se-afoot">${I("info")}Checks read this plan against WS-X90's records. AI drafts wait for a person.</p>`;
  }
  function topCard(pl) {
    const s = st(pl.key);
    if (s.state === "review") return `<div class="v8d-lock" role="status">${I("lock")}<span>Locked for ${esc(pl.steps[0][1][0][0])}'s review since ${esc(U.when(s.sent))}. Comments stay open.</span>${btn("Review status", `data-modal="v8d-submit" data-id="${pl.key}"`)}</div>`;
    if (s.state === "changes") return `<div class="v8d-top">${AK.reasonCard({ question: "Changes requested by Joel Barrantes", reason: pl.reason, who: "Joel Barrantes · ISSM", when: U.when(pl.round.decided), action: "Resubmit" }).replace('<span class="btn sm">Resubmit</span>', btn("Resubmit", `data-modal="v8d-submit" data-id="${pl.key}"`))}</div>`;
    return "";
  }
  function editorHTML(pl) {
    const s = st(pl.key);
    if (NARROW() && !s.touched) s.side = "";
    return `<div class="se-app v8d-app${NARROW() && s.side ? " se-ov" : ""}${s.out ? " out-open" : ""}" id="v8d-app" data-plan="${pl.key}" data-mode="edit">${headHTML(pl)}${toolbarHTML(pl)}
      <div class="se-body" data-side="${s.side}">
        <nav class="se-out" aria-label="Contents">${outlineHTML(pl)}</nav>
        <div class="se-scroll" id="v8d-scroll"><div class="se-cols">
          <div class="sd-desk se-desk"><div class="se-note">${AK.note(pl.note)}</div>${topCard(pl)}<article class="sd-page se-page v8d-page" aria-label="${esc(pl.title)}">${pageHTML(pl)}</article></div>
          <aside class="se-margin flow" id="v8d-margin" aria-label="Comments and AI drafts">${marginHTML(pl)}</aside>
        </div></div>
        <aside class="se-assist" aria-label="Assist">${assistHTML(pl)}</aside>
      </div>
      <div class="se-scrim" data-v8d-act="scrim" aria-hidden="true"></div>
    </div>`;
  }

  // ═════════ Version history (full window, on the SSP history's classes) ═════════
  function histDoc(pl, idx, show) {
    const cur = textAt(pl, idx), prev = idx + 1 < pl.versions.length ? textAt(pl, idx + 1) : null;
    let n = 0;
    const secs = pl.secs.map((s, i) => {
      const paras = (TX[pl.key].order[s.id] || []).map((pid) => {
        const b = cur[pid] == null ? null : cur[pid], a = prev ? (prev[pid] == null ? null : prev[pid]) : b;
        if (a == null && b == null) return "";
        if (!show || a === b) return b == null ? "" : `<p class="sd-p">${esc(b)}</p>`;
        n++;
        if (a == null) return `<p class="sd-p" data-v8d-chg><ins class="sd-ins">${esc(b)}</ins></p>`;
        if (b == null) return `<p class="sd-p" data-v8d-chg><del class="sd-del">${esc(a)}</del></p>`;
        return `<p class="sd-p" data-v8d-chg>${U.diff(a, b)}</p>`;
      }).join("");
      const liveLine = s.src ? `<p class="sh-quiet">${I("live")}Live section · ${esc(s.src)} · read from the records, not versioned here</p>` : "";
      return `<section class="sh-sec"><h2 class="sd-h1"><span class="sd-num">${i + 1}</span>${esc(s.t)}</h2>${paras}${liveLine}</section>`;
    }).join("");
    return { html: `<header class="se-cover"><h1 class="sd-title">${esc(pl.title)}</h1><div class="sd-sub">SYS-WSX90 · Revision ${pl.rev} · ${esc(pl.std)}</div></header>${secs}`, n };
  }
  const vName = (pl, e) => e.name || `Version ${e.v}`;
  function vItem(pl, e, i, on) {
    const chip = (i === 0 ? AK.chip("Current", { tone: "info" }) : e.kind === "restore" ? AK.chip("Restored") : e.kind === "review" ? AK.chip("Review", { tone: "bad" }) : "") + (e.session ? AK.chip("This session", { tone: "ok" }) : "");
    return `<div class="sh-v${on ? " on" : ""}"><button type="button" class="sh-v-main" data-v8d-act="hsel" data-i="${i}" aria-pressed="${on}"><span class="sh-v-l1"><span class="sh-v-n${e.name ? "" : " plain"}">${esc(e.name || U.when(e.at))}</span>${chip}</span><span class="sh-v-s">Version ${e.v}${e.name ? " · " + esc(U.when(e.at)) : ""}</span></button>
      <div class="sh-v-w">${e.who.map(dot).join("")}</div>${e.changes.length ? `<div class="sh-v-c">${e.changes.map(([sec, what]) => `<span class="sh-cl">${esc(secLabel(pl, sec))} · ${esc(what)}</span>`).join("")}</div>` : ""}</div>`;
  }
  function histSide(pl) {
    const hs = hst(pl.key), V = pl.versions;
    const items = V.map((e, i) => (hs.named && i && !e.name ? "" : vItem(pl, e, i, hs.sel === i))).join("");
    const ap = pl.pub.approvals.map(([role, who, d]) => `<div class="ak-appr-r"><span class="ak-ring sm done"></span>${AK.avatar(who, 22)}<b>${esc(who)}</b><span class="t">${esc(role)}</span><span class="ak-ok">${AK.i("check")}Approved ${esc(md(d))}</span></div>`).join("");
    const pub = `<div class="sh-v${hs.sel === "pub" ? " on" : ""}"><button type="button" class="sh-v-main" data-v8d-act="hsel" data-i="pub" aria-pressed="${hs.sel === "pub"}"><span class="sh-v-l1"><span class="sh-v-n">${I("lock")}Revision ${esc(pl.pub.rev)} published</span>${AK.chip("Frozen")}</span><span class="sh-v-s">${esc(md(pl.pub.at))} ${EX}</span></button><div class="sh-v-ap">${ap}</div><p class="sh-v-note">${I("link")}On record: ${esc(pl.pub.ev)}</p></div>`;
    return `<aside class="sh-side${hs.sheet ? " open" : ""}" aria-label="Versions"><div class="sh-vh"><div class="sh-vh-r"><h2>Versions</h2><button type="button" class="se-ib sh-side-x" data-v8d-act="hsheet" aria-label="Close versions">${I("x")}</button></div>
      <div class="sh-tg"><span>Only named versions</span><button type="button" class="sh-sw" role="switch" aria-checked="${hs.named}" aria-label="Only named versions" data-v8d-act="hnamed"></button></div>
      <div class="sh-tg"><span>Show changes</span><button type="button" class="sh-sw" role="switch" aria-checked="${hs.changes}" aria-label="Show changes" data-v8d-act="hchanges"></button></div></div>
      <div class="sh-vl"><div class="sh-g"><h3 class="sh-g-h">Revision ${pl.rev}</h3>${items}</div><div class="sh-g"><h3 class="sh-g-h">Earlier</h3>${pub}</div></div>
      <div class="sh-vf"><p class="sh-v-note">${I("info")}Every edit saves a version. Restoring makes a new version, so nothing is lost.</p></div></aside>`;
  }
  function histHTML(pl) {
    const hs = hst(pl.key), V = pl.versions;
    if (hs.sel !== "pub" && (typeof hs.sel !== "number" || hs.sel >= V.length)) hs.sel = 0;
    const isPub = hs.sel === "pub", idx = isPub ? V.length - 1 : hs.sel, e = V[idx];
    const doc = histDoc(pl, idx, hs.changes && !isPub);
    const why = idx === 0 ? "This is the current version." : locked(pl) ? "The plan is locked for review." : "";
    const restoreBtn = why ? `<button type="button" class="btn sm ink" aria-disabled="true" title="${esc(why)}">${I("history")}Restore this version</button>` : `<button type="button" class="btn sm ink" data-modal="v8d-restore" data-id="${pl.key}">${I("history")}Restore this version</button>`;
    const head = `<header class="sh-top">${AK.back("Back to editing", pl.route)}<div class="sh-top-t"><h1>Version history</h1><div class="sh-top-s">${esc(pl.title)} · Revision ${pl.rev} · ${STATE[stateOf(pl.key)][1]}</div></div>
      <div class="sh-acts">${why ? `<span class="sh-why">${esc(why)}</span>` : ""}<button type="button" class="btn sm sh-vbtn" data-v8d-act="hsheet" aria-haspopup="dialog" aria-expanded="${hs.sheet}">${I("toc")}Versions</button>${swBtn(pl.key)}${restoreBtn}</div></header>`;
    const label = isPub ? `Revision ${pl.pub.rev} · the signed text, as revision ${pl.rev} started from it` : `${vName(pl, e)} · ${U.when(e.at)} · ${e.who.join(", ")}`;
    const bar = `<div class="sh-bar"><div class="sh-bar-r"><div class="sh-bar-t"><span class="ak-chip">${I("eye")}Read only</span><span>${esc(label)}</span></div><div class="sh-bar-n"><span class="sh-bar-c">${isPub || !hs.changes ? "Changes hidden" : idx === V.length - 1 ? "First version of this revision" : plural(doc.n, "change") + " from version " + V[idx + 1].v}</span>${doc.n ? `<button type="button" class="btn sm" data-v8d-act="hprev">${AK.i("down", "v8d-up")}Previous change</button><button type="button" class="btn sm" data-v8d-act="hnext">${AK.i("down")}Next change</button>` : ""}</div></div></div>`;
    return `<div class="sh-root v8d-hist" data-plan="${pl.key}">${head}<div class="sh-hb"><div class="sh-docpane" id="v8d-hpane">${bar}<div class="sd-desk"><article class="sd-page sh-doc" style="--c:${col(e.who[0])}" aria-label="${esc(pl.title)}, read only">${doc.html}</article><div class="v8d-hnote">${AK.note("Every version, its authors and its text before this revision are examples; the redlines are drawn from them word by word.")}</div></div></div>${histSide(pl)}</div><div class="sh-scrim" data-v8d-act="hsheet"${hs.sheet ? "" : " hidden"}></div></div>`;
  }

  // ═════════ Plans: the register ═════════
  function sspRow() {
    const e = D.session.find((x) => ["edit", "accept", "section", "restore"].includes(x.kind));
    const last = e ? [e.time, e.who] : [D.versions[0].at, D.versions[0].who[0]];
    const accepted = (g) => D.session.some((x) => x.kind === "accept" && x.at === g.at);
    return { key: "ssp", title: D.doc.title, abbr: "SSP", rev: D.doc.revision, state: sspState()[0], owner: "Priya Raghavan", editing: D.people.filter((p) => p.doing === "Editing").map((p) => p.name), last, comments: D.comments.filter((c) => !c.resolved).length, ai: D.suggestions.filter((g) => g.ai && !accepted(g)).length, route: "ssp" };
  }
  const planRow = (k) => { const pl = PLANS[k], top = pl.versions[0]; return { key: k, title: pl.title, abbr: pl.abbr, rev: pl.rev, state: stateOf(k), owner: pl.owner, editing: pl.people.filter((p) => p[2] === "Editing").map((p) => p[0]), last: [top.at, top.who[0]], comments: pl.comments.filter((c) => !c.resolved).length, ai: pl.sugg.filter((g) => !g.done).length, route: pl.route }; };
  const allRows = () => [sspRow(), ...KEYS.map(planRow)];
  function reviewRows() {
    const rows = [];
    for (const r of allRows()) if (r.state === "review") rows.push({ key: r.key, plan: r.title, rev: `Revision ${r.rev}`, by: ME, at: r.key === "ssp" ? (D.session.find((x) => x.kind === "submit") || {}).time : st(r.key).sent, wait: r.key === "ssp" && sspState()[1] === "AO review" ? "R. Calloway · AO" : "Joel Barrantes · ISSM", dec: h.pill("warn", "In review"), ex: false });
    if (st("irp").state === "changes") rows.push({ key: "irp", plan: PLANS.irp.title, rev: "Revision 4", by: PLANS.irp.round.by, at: PLANS.irp.round.at, wait: "Priya Raghavan · ISSO", dec: h.pill("bad", `Changes requested ${md(PLANS.irp.round.decided.slice(0, 10))}`), ex: true });
    if (sspState()[0] === "changes") rows.push({ key: "ssp", plan: D.doc.title, rev: `Revision ${D.doc.revision}`, by: ME, at: (D.session.find((x) => x.kind === "submit") || {}).time, wait: "Priya Raghavan · ISSO", dec: h.pill("bad", "Changes requested"), ex: false });
    const r2 = D.versions.find((v) => v.kind === "published");
    rows.push({ key: "ssp", plan: D.doc.title, rev: "Revision 2", by: "Priya Raghavan", at: (r2 && r2.approvals && r2.approvals[0][2]) || "2026-07-21", wait: "Nobody", dec: h.pill("ok", "Approved Jul 25"), ex: true });
    for (const k of KEYS) { const pl = PLANS[k]; rows.push({ key: k, plan: pl.title, rev: `Revision ${pl.pub.rev}`, by: pl.owner, at: pl.pub.approvals[0][2], wait: "Nobody", dec: h.pill("ok", `Approved ${md(pl.pub.at)}`), ex: true }); }
    return rows;
  }
  const PUBS = () => [{ key: "ssp", plan: D.doc.title, rev: "Revision 2", at: (D.revisions.find((r) => r.v === 2) || {}).published || "2026-07-25", by: "R. Calloway", rec: "Frozen in Program Assurance", ex: false }, ...KEYS.map((k) => ({ key: k, plan: PLANS[k].title, rev: `Revision ${PLANS[k].pub.rev}`, at: PLANS[k].pub.at, by: "Ray Colston", rec: PLANS[k].pub.ev, ex: true }))];
  const SHORT = { SSP: "System security plan", CP: "Contingency plan", IRP: "Incident response plan", CMP: "Configuration management plan" };
  const planCell = (title, abbr) => `<span class="v8d-pn" title="${esc(title)}"><span>${esc(SHORT[abbr] || title)}</span><span class="ak-code">${abbr}</span></span>`;
  const panelOf = (key) => (key === "ssp" ? ["ssp", D.system.code] : ["v8d-plan", key]);
  function withPanels(html, keys) { let i = 0; return html.replace(/<tr tabindex="0" data-panel="v8d-plan" data-id="[^"]*">/g, () => { const [p, id] = panelOf(keys[i++]); return `<tr tabindex="0" data-panel="${p}" data-id="${esc(id)}">`; }); }
  function regHTML(tab) {
    const rows = allRows(), rv = reviewRows(), pubs = PUBS();
    let body;
    if (tab === "review") body = h.tools("Search reviews", ["Plan", "Decision"]) + withPanels(h.table(["Plan", "Revision", "Submitted by", "Submitted", "Waiting on", "Decision"], rv.map((r) => ({ id: r.key, cells: [`${planCell(r.plan, r.key === "ssp" ? "SSP" : PLANS[r.key].abbr)}${r.ex ? " " + EX : ""}`, esc(r.rev), AK.owner(r.by), r.at ? `<span class="num">${esc(md(String(r.at).slice(0, 10)))}</span>` : mu("Not recorded"), r.wait === "Nobody" ? mu("Nobody") : AK.owner(r.wait.split(" · ")[0]), r.dec] })), rv.length, "v8d-plan"), rv.map((r) => r.key));
    else if (tab === "published") body = h.tools("Search revisions", ["Plan"]) + withPanels(h.table(["Plan", "Revision", "Published", "Signed by", "On record"], pubs.map((r) => ({ id: r.key, cells: [`${planCell(r.plan, r.key === "ssp" ? "SSP" : PLANS[r.key].abbr)}${r.ex ? " " + EX : ""}`, esc(r.rev), `<span class="num">${esc(md(r.at))}</span>`, AK.owner(r.by), `<span class="v8d-cut">${esc(r.rec)}</span>`] })), pubs.length, "v8d-plan"), pubs.map((r) => r.key));
    else body = h.tools("Search plans", ["Status", "Owner"]) + withPanels(h.table(["Plan", "Revision", "Status", "Owner", "Editing now", "Last edit", "Comments", "AI drafts"], rows.map((r) => ({ id: r.key, cells: [planCell(r.title, r.abbr), num(r.rev), statePill(r.state), AK.owner(r.owner), r.editing.length ? `<span class="v8d-eds" title="${esc(r.editing.join(", "))}">${r.editing.map((n) => av(n, 22)).join("")}<span class="se-sr">${esc(r.editing.join(", "))}</span></span>` : mu("Nobody"), `<span class="v8d-eds" title="${esc(r.last[1])}"><span class="num">${esc(U.when(r.last[0]))}</span><span class="se-sr"> by ${esc(r.last[1])}</span></span>`, r.comments ? num(r.comments) : mu("0"), r.ai ? `<span class="v8d-ai">${I("sparkle")}<span class="num">${r.ai}</span></span>` : mu("0")] })), rows.length, "v8d-plan"), rows.map((r) => r.key));
    const note = tab === "plans" ? "Presence, comments and AI drafts in the CP, IRP and CMP are examples, and so are their versions. The SSP row is the SSP editor's own; the revisions on record are WS-X90's evidence." : tab === "review" ? "The IRP's review round and the approval dates of the earlier revisions are examples; a plan you submit in this session joins the list." : "Publication dates of the CP, IRP and CMP revisions are examples; the records that hold them are WS-X90's evidence. SSP revision 2's date is WS-X90's.";
    return `<div class="v8d-reg">${h.page(
      AK.indexHead({ title: "Plans", desc: "WS-X90's system security plan and the plans beside it, each a live document with its history, comments and AI drafts", actions: `<button type="button" class="btn ink" data-modal="v8d-newplan">${AK.i("plus")}New plan</button>` }),
      AK.tabs([["Plans", rows.length, "ssps", tab === "plans"], ["Reviews", rv.length, "ssps-review", tab === "review"], ["Published", pubs.length, "ssps-published", tab === "published"]], "Plans"),
      body, AK.note(note))}</div>`;
  }
  function approvalSteps(pl) {
    const s = st(pl.key);
    return pl.steps.map(([label, aps], i) => ({ label: `Step ${i + 1} · ${label}`, approvers: aps.map(([who, role]) => {
      if (s.state === "review") return { who, role, state: i === 0 ? "sent" : "waiting", when: i === 0 ? md(String(s.sent).slice(0, 10)) : "" };
      if (s.state === "changes" && pl.round) return { who, role, state: i === 0 ? "changes" : "waiting", when: i === 0 ? md(pl.round.decided.slice(0, 10)) : "" };
      return { who, role, state: "waiting" };
    }) }));
  }
  const approvalHTML = (pl) => AK.approval({ title: "Approval", sub: "Everyone in a step approves before the next step starts", steps: approvalSteps(pl) });
  P["v8d-plan"] = (key) => {
    const pl = PLANS[key];
    if (!pl) return null;
    const top = pl.versions[0], state = stateOf(key), tst = pl.test;
    const ed = pl.people.map(([n, at, doing]) => `<div class="v8d-prow">${av(n, 24)}<b>${esc(n)}</b><span class="v8d-mu">${esc(doing)} · section ${esc(secLabel(pl, at))}</span></div>`).join("");
    const lives = pl.secs.filter((x) => x.src).map((x) => `<div class="v8d-prow">${I("live")}<b>${esc(secLabel(pl, x.id))}</b><span class="v8d-mu">${esc(x.src)}</span></div>`).join("");
    return { label: "Plan preview", body: `<div class="v8d-pan">${AK.recordHead({ title: pl.title, chip: statePill(state), actions: btn("Open document", `data-go="${pl.route}"`, true) })}
      ${AK.facts([["Revision", `Revision ${pl.rev}`], ["Owner", AK.owner(pl.owner)], ["Saved", `Version ${top.v}`], ["Last edit", esc(U.when(top.at))]])}
      ${AK.section("Editing now", ed, { count: pl.people.length })}
      ${AK.section("Sections drawn from records", lives, { count: pl.secs.filter((x) => x.src).length })}
      ${AK.section("Approval", approvalHTML(pl))}
      ${AK.section("Test", AK.task({ title: tst[1], source: "Recurring check · continuous monitoring", owner: tst[3], due: tst[2] }))}
      <div class="btns">${btn(`${I("history")}Version history`, `data-go="${pl.route}-history"`)}${btn(`${I("send")}${state === "review" ? "Review status" : state === "changes" ? "Resubmit" : "Submit for review"}`, `data-modal="v8d-submit" data-id="${key}"`)}</div>
      ${AK.note("Presence, the version count and the approval steps are examples; the sections' records and the test are WS-X90's.")}</div>` };
  };

  // ——— Dialogs for the plans ———
  M["v8d-submit"] = (key) => {
    const pl = PLANS[key];
    if (!pl) return null;
    const s = st(key), open = pl.comments.filter((c) => !c.resolved).length, pend = pl.sugg.filter((g) => !g.done).length;
    if (s.state === "review") return { title: "In review", body: `<div class="v8d-dlg"><p class="ak-desc">${esc(pl.title)}, revision ${pl.rev}, waits for ${esc(pl.steps[0][1][0][0])}. Editing is locked; comments stay open.</p>${approvalHTML(pl)}</div>`,
      footer: `<button type="button" class="btn" data-close-modal>Close</button><button type="button" class="btn" data-v8d-act="withdraw" data-id="${key}">Withdraw request</button>` };
    const changed = new Set(pl.versions.slice(0, -1).flatMap((v) => v.changes.filter((c) => c[1] !== "Comment").map((c) => c[0]))).size;
    const again = s.state === "changes";
    return { title: again ? "Resubmit for review" : "Submit for review", body: `<div class="v8d-dlg"><p class="ak-desc">Submitting locks revision ${pl.rev} of the ${esc(pl.noun)} for review.</p>
      ${again ? AK.reasonCard({ question: "Changes requested by Joel Barrantes", reason: pl.reason, who: "Joel Barrantes · ISSM", when: U.when(pl.round.decided) }) : ""}
      <dl class="ak-kv v8d-kv"><dt>Since ${esc(pl.pub.rev)}</dt><dd>${plural(pl.versions.length - 1, "version")} · ${plural(changed, "section")} changed</dd><dt>Open comments</dt><dd>${open} stay open in the review</dd><dt>AI drafts</dt><dd>${pend ? `${pend} not decided; they stay drafts` : "None waiting"}</dd></dl>
      ${approvalHTML(pl)}
      <div class="ak-field"><label for="v8d-msg">Message to the approvers <span class="opt">Optional</span></label><textarea id="v8d-msg" class="se-ta" rows="3" placeholder="What changed, and what to read first"></textarea></div></div>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v8d-act="submit-ok" data-id="${key}">${again ? "Resubmit" : "Submit for review"}</button>` };
  };
  M["v8d-restore"] = (key) => {
    const pl = PLANS[key], hs = hst(key);
    if (!pl) return null;
    const idx = hs.sel === "pub" ? pl.versions.length - 1 : hs.sel, e = pl.versions[idx];
    const target = textAt(pl, idx), cur = TX[key].text;
    const n = Object.keys(Object.assign({}, cur, target)).filter((pid) => (cur[pid] == null ? null : cur[pid]) !== (target[pid] == null ? null : target[pid])).length;
    return { title: "Restore this version?", body: `<div class="v8d-dlg"><p class="ak-desc">Restoring makes version ${pl.versions[0].v + 1} from ${esc(vName(pl, e))}. Every version stays in the history.</p>
      <ul class="v8d-ul"><li>${plural(n, "paragraph")} go back to how ${esc(vName(pl, e))} had them.</li><li>Sections drawn from records keep reading the records.</li><li>Revision ${esc(pl.pub.rev)} stays published and frozen.</li></ul></div>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v8d-act="restore-ok" data-id="${key}">Restore</button>` };
  };
  M["v8d-people"] = (key) => {
    const pl = PLANS[key];
    if (!pl) return null;
    return { title: "People in this plan", body: `<div class="v8d-dlg">${pl.people.map(([n, at, doing]) => `<div class="v8d-prow">${av(n, 28)}<b>${esc(n)}</b><span class="v8d-mu">${esc(ROLE[n] || "")} · ${esc(doing)} section ${esc(secLabel(pl, at))}</span></div>`).join("")}<div class="v8d-prow">${av(ME, 28)}<b>${ME} (you)</b><span class="v8d-mu">Security engineer</span></div></div>` };
  };
  M["v8d-newplan"] = () => ({ title: "New plan", body: `<div class="v8d-dlg"><p class="ak-desc">A plan starts from its NIST template, and sections that name records read them live.</p>
    <div class="v8d-opts">${[["Supply chain risk management plan", "NIST SP 800-161 Rev 1", "SR-2"], ["Privacy impact assessment", "OMB M-03-22", "RA-8"], ["Continuous monitoring strategy", "NIST SP 800-137", "CA-7"]].map(([t, s, c], i) => `<label class="v8d-opt"><input type="radio" name="v8d-np" value="${i}"${i ? "" : " checked"}><span><b>${esc(t)}</b><span class="v8d-mu">${esc(s)} · ${c}</span></span></label>`).join("")}</div>
    <p class="v8d-mu">WS-X90 already has its SSP, contingency, incident response and configuration management plans.</p></div>`,
    footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v8d-act="newplan-ok">Create draft</button>` });

  // ═════════ People: a page per person ═════════
  const PRG = { "PRG-1090": "WS-X90 Sentinel Mission System", "PRG-2101": "Customer A · X800 Rail Integration", "PRG-2102": "Customer B · X800 Palletized Integration", "PRG-2201": "Customer C · G25 Battery Control Fielding", "PRG-0994": "Legacy billing gateway", "PRG-1041": "Atlas payments platform", "PRG-1007": "Field operations mobile" };
  // [name, WS-X90 RMF role [label, short] | null, what it does, roles in other programs (program_role_assignments), evidence owned in WS-X90, SSP access]
  const PEOPLE = [
    ["Joel Barrantes", ["Information system security manager", "ISSM"], "Second step of a risk acceptance; owns continuous monitoring", [["ISSO", "PRG-2102"], ["ISSO", "PRG-2201"]], 19, "Editor"],
    ["Priya Raghavan", ["Information system security officer", "ISSO"], "First step of a risk acceptance; owns the package", [["System owner", "PRG-1007"]], 22, "Editor"],
    ["Ray Colston", ["System owner", "SO"], "Owns the POA&M and the remediation budget", [["Assessor", "PRG-2102"], ["Lead assessor", "PRG-2102"]], 0, "Editor"],
    ["R. Calloway", ["Authorizing official", "AO"], "Signs the authorization decision; the last step of a risk acceptance", [["Authorizing official", "PRG-0994"], ["Authorizing official", "PRG-1041"]], 0, "Viewer"],
    ["D. Okafor", ["Lead assessor", "SCA"], "Publishes assessment results", [["Lead assessor", "PRG-0994"], ["Lead assessor", "PRG-1041"]], 0, "Commenter"],
    ["Nadia Fournier", ["Assessor", "SCA"], "Records determinations; reviews evidence", [["ISSO", "PRG-2101"]], 0, "Commenter"],
    ["Local developer", ["Assessor", "SCA"], "Records determinations", [], 0, null],
    [ME, null, "Security engineer; keeps the configuration management plan", [["Control owner", "PRG-2101"]], 27, "Editor"],
    ["Amara Bell", null, "Owns the contingency plan and its whole-article test", [["Control owner", "PRG-2101"], ["Control owner", "PRG-2102"]], 0, null],
    ["Victor Amsel", null, "Reviews privileged accounts each quarter", [["Reviewer", "PRG-2101"]], 17, null],
    ["Wes Duarte", null, "Owns the cyber resiliency exercise", [["Program manager", "PRG-2201"]], 25, null],
  ];
  const PERSON = Object.fromEntries(PEOPLE.map(([n, role, acts, other, ev, ssp]) => [n, { n, slug: slug(n), role, acts, other, ev, ssp }]));
  const VICTOR_EV = ["Incident record schema and state-machine configuration export, LRU-018 v3.4", "Protected incident store extract, 12 auto-opened records, LRU-015, 2026-09-15 to 2026-10-15", "External interface exposure survey, LRU-007, 2026 Q4", "Destruction certificates for six retired units, LRU-003 / LRU-015 / LRU-019"];
  const ISSUES = { [ME]: [["CVE-2024-6387 in the OpenSSH server (regreSSHion)", "high"]] };
  const POAMS = { [ME]: ["Remediate CVE-2024-6387 on the Mission Computer"] };
  const plansOf = (n) => [...(n === "Priya Raghavan" ? [["ssp", D.doc.title]] : []), ...KEYS.filter((k) => PLANS[k].owner === n).map((k) => [k, PLANS[k].title])];
  // The package room (mod-risk.js) and the quarterly privileged account review's accounts (mod-after-people.js; the accounts are Example there).
  const ROOM = { "R. Calloway": ["Full package · sign", "2027-09-17"], "D. Okafor": ["Full package", "2027-03-31"], "Joel Barrantes": ["Full package · share", "2027-09-17"], "Priya Raghavan": ["Full package · share", "2027-09-17"], "Ray Colston": ["Read only", "2027-09-17"] };
  const PRIV = { "Joel Barrantes": ["j.barrantes-adm", "Maintenance Access Gateway", "Keep"], "Priya Raghavan": ["p.raghavan-adm", "Platform Management Controller", "Keep"], "Wes Duarte": ["w.duarte-adm", "Platform Management Controller", "Not decided"] };
  const Q8140 = { "R. Calloway": ["611", "Authorizing Official/Designating Representative", "Advanced", "CGRC", 14, ["ok", "Qualified"]], "D. Okafor": ["612", "Security Control Assessor", "Advanced", "CISSP", 26, ["ok", "Qualified"]], "Nadia Fournier": ["612", "Security Control Assessor", "Intermediate", "CASP+", 9, ["warn", "Learning hours due Jan 31"]], "Local developer": ["612", "Security Control Assessor", "Basic", "Security+", 0, ["bad", "Not qualified"]], "Joel Barrantes": ["722", "Information Systems Security Manager", "Advanced", "CISSP", 31, ["ok", "Qualified"]], "Priya Raghavan": ["461", "Systems Security Analyst", "Intermediate", "Security+", 18, ["ok", "Qualified"]], "Ray Colston": ["801", "Program Manager", "Intermediate", "DAU PM", 6, ["warn", "Qualifying by Mar 1"]] };
  // Accounts each person holds (Example): system, role held, how it is read.
  const EMASS = { ISSM: "ISSM", ISSO: "ISSO", SO: "System owner", AO: "AO", SCA: "SCA validator" };
  function accountsOf(n) {
    const p = PERSON[n], sh = p.role ? p.role[1] : null, out = [];
    const add = (id, sys, role, how, opt = {}) => out.push(Object.assign({ id, sys, role, how }, opt));
    add("entra", "Entra ID", "Member", "int", { grant: "CAC registration" });
    add("emass", "eMASS · system 4471", sh ? EMASS[sh] : "Viewer", "man", { pending: n === "Local developer" });
    if (sh !== "AO") add("jira", "Jira · WS-X90", sh === "ISSM" ? "Administrator" : sh === "SCA" || sh === "SO" ? "Reporter" : "Developer", "int");
    if (["ISSM", "ISSO"].includes(sh) || !sh) if (n !== "Victor Amsel") add("gitlab", "GitLab · WS-X90", sh === "ISSM" || n === ME ? "Maintainer" : "Developer", "int", { pending: n === "Amara Bell" });
    if (!["AO", "SCA"].includes(sh)) add("net", "Mission network (SIPRNet)", sh === "ISSM" ? "Privileged user" : "User", "man");
    add("pa", "Program Assurance", p.ssp || (sh === "SCA" ? "Commenter" : "Contributor"), "int", { grant: "Program roles" });
    if (ROOM[n]) add("room", "Package room", ROOM[n][0], "app", { grant: "Shared by Joel Barrantes", until: ROOM[n][1] });
    if (PRIV[n]) add("priv", PRIV[n][0], `Privileged on ${(PINS.find((x) => x[1] === PRIV[n][1]) || [PRIV[n][1]])[0]}`, "rev", { grant: "AC-2 request", decision: PRIV[n][2] });
    return out;
  }
  const USED = { entra: "Today", emass: "Nov 14", jira: "Today", gitlab: "Yesterday", net: "Nov 12", pa: "Today", room: "Nov 12", priv: "Nov 10" };
  const STALE = { "Victor Amsel": { net: "41 days ago" }, "R. Calloway": { emass: "Oct 2" }, "Local developer": { emass: "Never" } };
  // Onboarding: the union of the person's role task sets (the RMF assessor set's items are the prototype's; the others Example).
  const ITEMS = {
    dd: (acct) => ({ k: "dd-" + acct.id, t: `DD Form 2875 · ${acct.sys.split(/ · | \(/)[0]}`, set: "Program access", owner: "approver" }),
    rob: { k: "rob", t: "Rules of behavior (PL-4)", set: "Program access", owner: "self" },
    sf312: { k: "sf312", t: "SF-312 nondisclosure agreement", set: "Program access", owner: "Security office" },
    bi: { k: "bi", t: "Background investigation", set: "Program access", owner: "Security office" },
    cac: { k: "cac", t: "CAC issued", set: "Program access", owner: "Security office" },
    cyber: { k: "cyber", t: "Cyber Awareness Challenge (AT-2)", set: "Program access", owner: "self" },
    q8140: { k: "8140", t: "DoD 8140 qualification", owner: "self" },
    rbt: { k: "rbt", t: "Role-based training (AT-3)", owner: "self" },
    pa: { k: "pa", t: "Privileged account request (AC-2)", owner: "ISSM" },
    ao: { k: "ao", t: "AO appointment letter", owner: "Security office" },
  };
  const SETS = { SCA: "RMF assessor tasks", ISSM: "ISSM and ISSO tasks", ISSO: "ISSM and ISSO tasks", AO: "Authorizing official tasks", SO: "System owner tasks" };
  // Open items (Example): [status, due, last reminded].
  const OPEN = {
    "Joel Barrantes": { rbt: ["open", "2026-12-15", "Nov 10"] }, "Ray Colston": { 8140: ["progress", "2027-03-01", null] }, "D. Okafor": { rbt: ["open", "2027-01-15", null] },
    "Nadia Fournier": { 8140: ["progress", "2027-01-31", "Nov 3"] },
    "Local developer": { "dd-emass": ["progress", "2026-11-20", null], rob: ["open", "2026-11-12", "Nov 14"], 8140: ["open", "2027-02-01", null], rbt: ["open", "2026-12-01", null], cyber: ["open", "2026-11-24", null] },
    [ME]: { cyber: ["open", "2026-11-30", null] }, "Amara Bell": { "dd-gitlab": ["open", "2026-11-10", "Nov 12"] }, "Wes Duarte": { rob: ["open", "2026-11-20", "Nov 13"] },
  };
  const DONE_ON = ["2026-08-04", "2026-08-11", "2026-08-18", "2026-09-02", "2026-09-15", "2026-10-03"];
  const REM = {};
  const DONE = {}; // v2 C2 (B13): onboarding tasks completed in this session, name + key → the day
  function onboardingOf(n) {
    const p = PERSON[n], sh = p.role ? p.role[1] : null, accts = accountsOf(n), rows = [];
    accts.filter((a) => ["emass", "jira", "gitlab", "net"].includes(a.id)).forEach((a) => rows.push(ITEMS.dd(a)));
    rows.push(ITEMS.rob, ITEMS.sf312, ITEMS.bi, ITEMS.cac, ITEMS.cyber);
    const set = sh ? SETS[sh] : n === ME ? "Security engineer tasks" : null;
    if (sh === "AO") rows.push(Object.assign({}, ITEMS.ao, { set }));
    if (sh) rows.push(Object.assign({}, ITEMS.q8140, { set }));
    if (set) rows.push(Object.assign({}, ITEMS.rbt, { set }));
    if (PRIV[n]) rows.push(Object.assign({}, ITEMS.pa, { set: set || "Privileged access" }));
    const approver = n === "Joel Barrantes" ? "Ray Colston" : "Joel Barrantes";
    return rows.map((r, i) => {
      const o = (OPEN[n] || {})[r.k], owner = r.owner === "self" ? n : r.owner === "approver" || r.owner === "ISSM" ? approver : r.owner;
      const doneOn = DONE[n + r.k] || DONE_ON[(i + n.length) % DONE_ON.length];
      return Object.assign({}, r, { owner, status: o ? o[0] : "done", due: o ? o[1] : doneOn, reminded: REM[n + r.k] || (o ? o[2] : null), done: o ? null : doneOn, approver });
    });
  }
  // v2 C2 (N02): a task nobody has started reads To do (grey); Open is red in the one status map, kept for open issues and risks.
  const obPill = (r) => (r.status === "done" ? h.pill("ok", "Complete") : AK.days(r.due) < 0 ? h.pill("bad", "Overdue") : r.status === "progress" ? h.pill("warn", "In progress") : h.pill("none", "To do"));
  const trainingOf = (n) => {
    const ob = onboardingOf(n), find = (k) => ob.find((r) => r.k === k);
    const rows = [["DoD Cyber Awareness Challenge", "Yearly", find("cyber")], ["Insider threat awareness", "Yearly", { status: "done", done: "2026-09-15", due: "2027-09-15" }]];
    if (find("rbt")) rows.push(["Role-based training (AT-3)", "Yearly", find("rbt")]);
    return rows;
  };
  const tasksOf = (n) => TASKS.filter((t) => t[4] === n).sort((a, b) => a[3].localeCompare(b[3]));
  const checksOf = (n) => CHECKS.filter((c) => c[3] === n);
  const nextDue = (n) => { const t = tasksOf(n)[0], o = onboardingOf(n).filter((r) => r.status !== "done").sort((a, b) => a.due.localeCompare(b.due))[0]; const c = [t && t[3], o && o.due].filter(Boolean).sort()[0]; return c || null; };
  // Offboarding (Victor Amsel leaving on Dec 1 is Example), and any offboarding started in this session.
  const OFF = { "Victor Amsel": { date: "2026-12-01", reason: "Moves to another program", by: "Joel Barrantes", at: "2026-11-16T15:58", successor: "Nadia Fournier", owners: { ev: "Nadia Fournier" }, access: {}, equip: {}, debrief: null, closed: null } };
  // v2 C2 (B5, B13): what these pages change is written to the shared state, so People, the access review and the Schedule read the
  // same thing: people.off (each offboarding, its new owners), people.open and people.done (onboarding), people.added (people added
  // with Add person). PA.v8people adds a person and starts their onboarding task set; restore() reads the state back after a reload.
  const OFF0 = JSON.stringify(OFF), OPEN0 = JSON.stringify(OPEN);
  const pubPeople = () => { const V2 = PA.v2; if (!V2) return; V2.set("people.off", JSON.parse(JSON.stringify(OFF))); V2.set("people.open", JSON.parse(JSON.stringify(OPEN))); V2.set("people.done", Object.assign({}, DONE)); };
  const addDaysIso = (iso, k) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + k); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const OB_DAYS = { rob: 3, sf312: 5, cyber: 7, cac: 10, bi: 30, 8140: 60, rbt: 30, ao: 14, pa: 14 };
  function addPerson(a) {
    if (!a || !a.n) return null;
    if (!PERSON[a.n]) {
      const role = a.short ? [a.roleLabel || a.short, a.short] : null;
      PEOPLE.push([a.n, role, a.acts || "", [], 0, null]);
      PERSON[a.n] = { n: a.n, slug: slug(a.n), role, acts: a.acts || (role ? role[0] : "Task owner"), other: [], ev: 0, ssp: null, start: a.start || null };
      if (!OPEN[a.n]) { OPEN[a.n] = {}; onboardingOf(a.n).forEach((r) => { OPEN[a.n][r.k] = ["open", addDaysIso(a.start || "2026-11-17", r.k.startsWith("dd-") ? 7 : OB_DAYS[r.k] || 14), null]; }); }
    }
    const p = PERSON[a.n];
    for (const t of PTABS) { const r = `person-${p.slug}${t === "overview" ? "" : "-" + t}`; if (!S[r]) { if (PA.v2 && PA.v2.screen) PA.v2.screen(r, () => personHTML(a.n, t), "people"); else S[r] = () => personHTML(a.n, t); ROUTE_NAV[r] = "people"; } }
    return p;
  }
  function restorePeople() {
    const V2 = PA.v2; if (!V2) return;
    (V2.get("people.added", []) || []).forEach(addPerson);
    const o = V2.get("people.off"), op = V2.get("people.open"), dn = V2.get("people.done");
    if (o) { Object.keys(OFF).forEach((k) => delete OFF[k]); Object.assign(OFF, JSON.parse(JSON.stringify(o))); }
    if (op) { Object.keys(OPEN).forEach((k) => delete OPEN[k]); Object.assign(OPEN, JSON.parse(JSON.stringify(op))); }
    if (dn) Object.assign(DONE, dn);
  }
  function resetPeople() {
    Object.keys(OFF).forEach((k) => delete OFF[k]); Object.assign(OFF, JSON.parse(OFF0));
    Object.keys(OPEN).forEach((k) => delete OPEN[k]); Object.assign(OPEN, JSON.parse(OPEN0));
    Object.keys(DONE).forEach((k) => delete DONE[k]);
  }
  PA.v8people = { add: (a) => { const p = addPerson(a); pubPeople(); return p ? `person-${p.slug}-onboarding` : null; }, onboarding: (n) => (PERSON[n] ? onboardingOf(n) : []), restore: restorePeople, reset: resetPeople, slug: (n) => slug(n), has: (n) => !!PERSON[n] };
  function workOf(n) {
    const p = PERSON[n], items = [];
    if (p.ev) items.push({ k: "ev", t: `${p.ev} evidence artifacts`, sub: n === "Victor Amsel" ? VICTOR_EV.slice(0, 2).join(" · ") : "Evidence in WS-X90", go: "evidence" });
    tasksOf(n).forEach((t) => items.push({ k: t[0], t: t[1], sub: `Task · due ${md(t[3])}`, go: "schedule" }));
    checksOf(n).forEach((c) => items.push({ k: "chk-" + c[0], t: `${c[1]} check`, sub: `${c[2]} · continuous monitoring`, go: "conmon" }));
    plansOf(n).forEach(([k, t]) => items.push({ k: "plan-" + k, t, sub: "Plan owner", go: k === "ssp" ? "ssps" : PLANS[k].route }));
    (ISSUES[n] || []).forEach(([t]) => items.push({ k: "iss", t, sub: "Operational issue owner", go: "findings" }));
    (POAMS[n] || []).forEach((t) => items.push({ k: "poam", t, sub: "POA&M item owner", go: "poam" }));
    return items;
  }
  const EQUIP = [["cac", "CAC", "Security office"], ["gfe", "Government laptop GFE-2219", "Program office"], ["token", "Hardware token for the mission network", "Security office"]];
  function offSteps(n) {
    const o = OFF[n];
    if (!o) return null;
    const work = workOf(n), accts = accountsOf(n);
    const s2 = work.every((w) => o.owners[w.k]), s3 = accts.every((a) => o.access[a.id]), s4 = EQUIP.every(([k]) => o.equip[k]), s5 = !!o.debrief, s6 = !!o.closed;
    const done = [true, s2, s3, s4, s5, s6];
    return { o, work, accts, done, cur: done.indexOf(false) < 0 ? 6 : done.indexOf(false) };
  }

  const personTabs = (p, tab) => {
    const ob = onboardingOf(p.n), off = OFF[p.n], cm = COMMENTS[p.n] || [];
    return [["Overview", null, `person-${p.slug}`, tab === "overview"], ["Onboarding", `${ob.filter((r) => r.status === "done").length}/${ob.length}`, `person-${p.slug}-onboarding`, tab === "onboarding"], ["Access", accountsOf(p.n).length, `person-${p.slug}-access`, tab === "access"], ["Training", trainingOf(p.n).length + 1, `person-${p.slug}-training`, tab === "training"], ["Offboarding", off ? (off.closed ? "Closed" : md(off.date)) : null, `person-${p.slug}-offboarding`, tab === "offboarding"], ["Comments", cm.length, `person-${p.slug}-comments`, tab === "comments"], ["Activity", activityOf(p.n).length, `person-${p.slug}-activity`, tab === "activity"]];
  };
  function personHead(p, tab) {
    const ob = onboardingOf(p.n), done = ob.filter((r) => r.status === "done").length, off = OFF[p.n], nd = nextDue(p.n);
    const chip = off ? AK.chip(off.closed ? "Offboarded" : `Leaves ${md(off.date)}`, { tone: off.closed ? "" : "warn" }) + (p.n === "Victor Amsel" ? " " + EX : "") : p.role ? h.tag(p.role[1]) : AK.chip("No RMF role");
    return AK.recordHead({ crumbs: [["People", "people"], [p.n]], title: p.n + (p.n === ME ? " (you)" : ""), chip, desc: esc(p.acts),
      facts: [["WS-X90 role", p.role ? esc(p.role[0]) : mu("No RMF role")], ["Programs", num(1 + new Set(p.other.map((x) => x[1]).filter((c) => c !== "PRG-1090")).size)], ["Sponsor", AK.owner(p.n === "Joel Barrantes" ? "Ray Colston" : "Joel Barrantes")], ["Next due", AK.due(nd)], ["Onboarding", AK.progress(done, ob.length)]],
      actions: `<button type="button" class="btn" data-modal="a-people-remind" data-id="${esc(p.n)}">${AK.i("mail")}Send reminder</button><button type="button" class="btn ink" data-modal="risk-role" data-id="${esc(p.n)}">${p.role ? "Change role" : "Assign a role"}</button>`,
      tabs: personTabs(p, tab) });
  }
  const railFor = (p) => AK.railCard("Details", [["Organization", `${p.role && p.role[1] === "SCA" ? "Independent assessor" : "Program office"} ${EX}`], ["Clearance", `${p.role && p.role[1] === "AO" ? "Top secret" : "Secret"} ${EX}`], ["SSP access", p.ssp ? esc(p.ssp) : mu("None")], ["Accounts", num(accountsOf(p.n).length)], ["Since", AK.due(null, { none: "Not recorded" })]]) + AK.railCard("Task sets", [["Applies", esc(["Program access", ...new Set(onboardingOf(p.n).map((r) => r.set).filter((s) => s && s !== "Program access"))].join(", "))], ["Defined in", `<span class="ak-link" role="link" tabindex="0" data-go="people-task-sets">Role task sets</span>`]]);
  function overviewBody(p) {
    const roles = [];
    if (p.role) roles.push([esc(["ISSM", "ISSO"].includes(p.role[1]) ? p.role[1] : p.role[0]), esc(PRG["PRG-1090"]), mu("Not recorded")]);
    else roles.push([esc(ROLE[p.n] || "Task owner") + " " + EX, esc(PRG["PRG-1090"]), mu("Not recorded")]);
    p.other.forEach(([r, code]) => roles.push([esc(r), `<span title="${code}">${esc(PRG[code] || code)}</span>`, mu("Not recorded")]));
    plansOf(p.n).forEach(([k, t]) => roles.push([`Plan owner ${k === "ssp" ? "" : EX}`, esc(t), mu("Revision open")]));
    if (p.ssp) roles.push([`SSP ${esc(p.ssp.toLowerCase())}`, esc(D.doc.title), mu("Revision 3")]);
    const tiles = [["Evidence", p.ev, "evidence"], ["Operational issues", (ISSUES[p.n] || []).length, "findings"], ["POA&M items", (POAMS[p.n] || []).length, "poam"], ["Risks", 0, "risks"], ["Open tasks", tasksOf(p.n).length, "schedule"], ["Checks", checksOf(p.n).length, "conmon"], ["Plans", plansOf(p.n).length, "ssps"]];
    const tasks = tasksOf(p.n), obOpen = onboardingOf(p.n).filter((r) => r.status !== "done");
    return [
      AK.section("Roles", h.table(["Role", "Program", "Period"], roles.map((r, i) => ({ id: String(i), cells: r })), roles.length, "") + `<p class="v8d-mu v8d-pad">From program roles across the workspace, the plans and document access. No role records its period.</p>`, { count: roles.length }),
      AK.section("Records they own in WS-X90", `<div class="v8d-own">${tiles.map(([l, n, go]) => `<button type="button" class="v8d-tile" data-go="${go}"><b class="num${n ? "" : " v8d-mu"}">${n}</b><span>${l}</span></button>`).join("")}</div>${p.n === "Victor Amsel" ? `<p class="v8d-mu v8d-pad">Evidence includes: ${esc(VICTOR_EV.slice(0, 2).join("; "))}.</p>` : ""}`),
      AK.section("Open tasks", tasks.length || obOpen.length ? `<div class="v8d-tasks">${tasks.map((t) => AK.task({ title: t[1], source: `${TST[t[2]][1]} · WS-X90 continuous monitoring — FY2027`, due: t[3] })).join("")}${obOpen.map((r) => AK.task({ title: r.t, source: `Onboarding · ${r.set || "Program access"}`, due: r.due, kind: "Onboarding" })).join("")}</div>` : AK.empty({ title: "No open tasks", line: "Nothing in WS-X90's Schedule or onboarding names them." }), { count: tasks.length + obOpen.length }),
    ].join("");
  }
  function onboardingBody(p) {
    const ob = onboardingOf(p.n), late = ob.filter((r) => r.status !== "done" && AK.days(r.due) < 0), done = ob.filter((r) => r.status === "done").length;
    const rows = ob.map((r) => ({ id: `${p.n}|${r.k}`, cells: [`<b class="v8d-b" title="${esc(r.set || "Program access")}">${esc(r.t)}</b>`, AK.owner(r.owner), r.status === "done" ? `<span class="num">${esc(md(r.done))}</span>` : AK.due(r.due, { prefix: false }), obPill(r),
      r.status === "done" ? mu("Not needed") : `<span class="v8d-rem">${r.reminded ? `Last reminded on ${esc(r.reminded)}` : "Not reminded yet"}${r.owner === ME ? btn("Done", `data-v8d-act="ob-done" data-who="${esc(p.n)}" data-k="${r.k}" aria-label="Mark ${esc(r.t)} complete"`) : `<button type="button" class="btn sm v8d-ib" data-v8d-act="remind" data-who="${esc(p.n)}" data-k="${r.k}" aria-label="Remind ${esc(r.owner)} about ${esc(r.t)}" title="Remind">${AK.i("mail")}</button>`}</span>`,
      r.status === "done" ? `<span class="v8d-evl" title="${r.k.startsWith("dd-") ? "Approved by " + esc(r.approver) : ""}">${I("link")}${r.k.startsWith("dd-") ? "DD 2875 · signed" : r.k === "bi" ? "Favorable" : r.k === "cyber" ? "Certificate" : r.k === "8140" ? "Certification" : "Signed copy"}</span>` : `<span class="ak-link" role="button" tabindex="0" data-v8d-act="upload" data-who="${esc(p.n)}">${AK.i("upload")}Add evidence</span>`] }));
    return `${late.length ? AK.banner({ tone: "bad", text: `<b>${plural(late.length, "onboarding task")} overdue:</b> ${esc(late.map((r) => r.t).join("; "))}.` }) : ""}
      <div class="v8d-obh"><span>${AK.progress(done, ob.length)}</span><span class="v8d-mu">The union of ${esc(["Program access", ...new Set(ob.map((r) => r.set).filter((s) => s && s !== "Program access"))].join(" and "))}. A DD Form 2875 per system account.</span></div>
      ${h.table(["Task", "Owner", "Due", "Status", "Reminders", "Evidence"], rows, rows.length, "v8d-ob")}`;
  }
  // v2 C2 (B13): each onboarding task opens; an open one can be marked complete, which moves the person's progress and People.
  P["v8d-ob"] = (id) => {
    const [n, k] = String(id || "").split("|"), p = PERSON[n];
    if (!p) return null;
    const r = onboardingOf(n).find((x) => x.k === k);
    if (!r) return null;
    const done = r.status === "done";
    const act = done ? "" : `<button type="button" class="btn sm ink" data-v8d-act="ob-done" data-who="${esc(n)}" data-k="${esc(k)}" data-v2-wired>Mark complete</button>`;
    return { label: "Onboarding task preview", body: `<div class="v8d-obp">${AK.recordHead({ title: r.t, chip: obPill(r), actions: act })}
      ${AK.facts([["Person", AK.owner(n)], ["Owner", AK.owner(r.owner)], [done ? "Completed" : "Due", done ? esc(md(r.done)) : AK.due(r.due)], ["Task set", esc(r.set || "Program access")]])}
      ${done ? `<p class="v8d-mu v8d-pad">${AK.i("check")} Completed ${esc(md(r.done))}.</p>` : `<p class="v8d-mu v8d-pad">${r.owner === n ? `${esc(n)} completes this one; marking it complete records that it is done.` : `${esc(r.owner)} completes this one for ${esc(n)}.`} ${r.reminded ? `Last reminded on ${esc(r.reminded)}.` : "Not reminded yet."}</p>`}</div>` };
  };
  function verified(a, n) {
    if (a.pending) return `<span class="v8d-ver">${h.gl("ring")}Waiting for its DD Form 2875</span>`;
    if (a.how === "int") return `<span class="v8d-ver ok">${I("live")}Verified via integration on Nov 12, 14:02</span>`;
    if (a.how === "app") return `<span class="v8d-ver ok">${AK.i("check")}Recorded in the package room · expires ${esc(md(a.until))}</span>`;
    if (a.how === "rev") return `<span class="v8d-ver">${AK.i("check")}Quarterly review · ${esc(a.decision)} ${EX}</span>`;
    return `<span class="v8d-ver">${AK.i("check")}Manual check · Oct 31 · ${n === "Joel Barrantes" ? "Ray Colston" : "Joel Barrantes"}</span>`;
  }
  function accessBody(p) {
    const accts = accountsOf(p.n), int = accts.filter((a) => a.how === "int").length;
    const rows = accts.map((a) => ({ id: a.id, cells: [`<b class="v8d-b">${esc(a.sys)}</b>`, esc(a.role), a.grant ? esc(a.grant) + (a.how === "rev" || a.how === "app" ? "" : "") : `DD 2875 · ${p.n === "Joel Barrantes" ? "Ray Colston" : "Joel Barrantes"}`, verified(a, p.n), a.pending ? mu("Never") : (() => { const u = (STALE[p.n] || {})[a.id] || USED[a.id]; return /days ago|Never|Oct/.test(u) ? `<span class="v8d-warn">${esc(u)}</span>` : esc(u); })()] }));
    return `<div class="v8d-obh"><span class="v8d-mu">${plural(accts.length, "account")} · ${int} read by an integration (Entra ID, Jira, GitLab, Program Assurance) · ${accts.length - int} checked by hand or in the app</span>${btn(`${AK.i("plus")}Request access`, `data-modal="ak-approvers" data-id="${esc(p.n)}'s DD Form 2875"`)}</div>
      ${h.table(["System", "Role held", "Granted by", "Verified", "Last used"], rows, rows.length, "")}`;
  }
  function trainingBody(p) {
    const rows = trainingOf(p.n).map(([t, cad, r], i) => ({ id: String(i), cells: [`<b class="v8d-b">${esc(t)}</b>`, h.tag(cad), r.status === "done" ? h.pill("ok", "Complete") : obPill(r), r.done ? `<span class="num">${esc(md(r.done))}</span>` : mu("Not yet"), r.status === "done" ? AK.due(r.due === r.done ? "2027-" + r.done.slice(5) : r.due, { prefix: false }) : AK.due(r.due, { prefix: false })] }));
    const q = Q8140[p.n];
    const q8 = q ? `<div class="v8d-q"><div class="v8d-qh">${h.tag(q[0])}<b>${esc(q[1])}</b>${h.pill(q[5][0], q[5][1])}${EX}</div><dl class="ak-kv"><dt>Proficiency</dt><dd>${esc(q[2])}</dd><dt>Certification</dt><dd>${esc(q[3])}</dd><dt>Learning hours</dt><dd>${AK.progress(q[4], 20, "hours this year")}</dd></dl></div>` : AK.empty({ title: "No DCWF work role recorded", line: "DoD 8140 applies to the RMF roles; this person holds none in WS-X90." });
    return `${h.table(["Training", "Cadence", "Status", "Completed", "Next due"], rows, rows.length, "")}
      ${AK.section("DoD 8140 qualification", q8, { action: `<span class="ak-link" role="link" tabindex="0" data-go="people-8140">Open DoD 8140 qualifications</span>` })}`;
  }
  const pick = (n, k, cur) => `<button type="button" class="v8d-pick" data-v8d-act="pick" data-who="${esc(n)}" data-k="${esc(k)}" aria-haspopup="menu" aria-expanded="false" aria-label="New owner${cur ? ": " + esc(cur) : ""}">${cur ? AK.owner(cur) : `<span class="v8d-mu">Choose new owner</span>`}${AK.i("down")}</button>`;
  function offboardingBody(p) {
    const x = offSteps(p.n);
    if (!x) {
      const w = workOf(p.n), a = accountsOf(p.n);
      return `${AK.empty({ title: "No offboarding started", line: `Starting asks for the last day and the reason, then lists the ${plural(w.length, "record")} to reassign and the ${plural(a.length, "account")} to remove.` }).replace(/<\/div>$/, `${btn("Start offboarding", `data-modal="v8d-offboard" data-id="${esc(p.n)}"`, true)}</div>`)}`;
    }
    const { o, work, accts, done, cur } = x, n = p.n;
    const st2 = (i) => (done[i] ? h.pill("ok", "Done") : i === cur ? h.pill("warn", "In progress") : h.pill("none", "Not started"));
    const card = (i, title, body, act = "") => `<section class="ak-card v8d-step${i === cur ? " now" : ""}" id="v8d-off-${i}" aria-labelledby="v8d-offh-${i}"><div class="v8d-sh">${done[i] ? h.gl("check") : `<span class="ak-step-n">${i + 1}</span>`}<h3 id="v8d-offh-${i}">${esc(title)}</h3>${st2(i)}<span class="v8d-sp"></span>${act}</div>${body}</section>`;
    const reassigned = work.filter((w) => o.owners[w.k]).length;
    const s1 = `<dl class="ak-kv"><dt>Last day</dt><dd>${AK.due(o.date, { prefix: false })}</dd><dt>Reason</dt><dd>${esc(o.reason)}</dd><dt>Requested by</dt><dd>${AK.owner(o.by)} <span class="v8d-mu">${esc(U.when(o.at))}</span></dd><dt>Successor</dt><dd>${AK.owner(o.successor)}</dd></dl>`;
    const s2 = `<p class="v8d-mu v8d-pad">${reassigned} of ${plural(work.length, "item")} have a new owner.</p><div class="v8d-work">${work.map((w) => `<div class="v8d-wrow"><span class="x"><b>${esc(w.t)}</b><span class="v8d-mu">${esc(w.sub)}</span></span>${pick(n, w.k, o.owners[w.k])}</div>`).join("")}</div>`;
    const accRow = (a) => { const s = o.access[a.id]; const state = s ? `<span class="v8d-ver ok">${AK.i("check")}${s[0] === "int" ? `Disabled · verified via integration ${esc(U.when(s[1]))}` : `Disabled · manual check by ${esc(s[2])}, ${esc(U.when(s[1]))}`}</span>` : a.how === "int" ? `<span class="v8d-ver">${I("live")}Disables at 17:00 on ${esc(md(o.date))} · verified via integration</span>` : `<span class="v8d-ver">${h.gl("ring")}Manual check owed on ${esc(md(o.date))}</span>`;
      return `<div class="v8d-wrow"><span class="x"><b>${esc(a.sys)}</b><span class="v8d-mu">${esc(a.role)}</span></span>${state}${s ? "" : btn(a.how === "int" ? "Disable now" : "Record manual check", `data-v8d-act="off-acc" data-who="${esc(n)}" data-k="${a.id}" data-how="${a.how === "int" ? "int" : "man"}"`)}</div>`; };
    const s3 = `<div class="v8d-work">${accts.map(accRow).join("")}</div>`;
    const s4 = `<div class="v8d-work">${EQUIP.map(([k, t, to]) => `<div class="v8d-wrow"><span class="x"><b>${esc(t)}</b><span class="v8d-mu">Returned to ${esc(to)}</span></span>${o.equip[k] ? `<span class="v8d-ver ok">${AK.i("check")}Returned ${esc(U.when(o.equip[k]))}</span>` : btn("Mark returned", `data-v8d-act="off-eq" data-who="${esc(n)}" data-k="${k}"`)}</div>`).join("")}</div>`;
    const s5 = o.debrief ? `<p class="v8d-ver ok">${AK.i("check")}SF-312 debriefing recorded by ${ME}, ${esc(U.when(o.debrief))}</p>` : `<p class="v8d-mu v8d-pad">The security office debriefs ${esc(n)} on the SF-312 before the last day. Scheduled for ${esc(md(o.date === "2026-12-01" ? "2026-11-30" : o.date))}.</p>`;
    const req = (D.requirements["AC-2(3)"] || [])[0] || ["REQ-439", "Platform accounts disabled within 72 hours of expiry, disassociation or policy violation"];
    const evRows = accts.map((a) => { const s = o.access[a.id]; return [esc(a.sys), s ? esc(U.when(s[1])) : mu("Not yet"), s ? (s[0] === "int" ? "Integration" : `Manual · ${esc(s[2])}`) : mu("Not yet")]; });
    const s6 = `<p class="v8d-pad">${o.closed ? `${AK.i("check")} Closed ${esc(U.when(o.closed))}. ` : ""}AC-2(3) evidence for <span class="ak-code">${esc(req[0])}</span> ${esc(req[1])}: every account disabled within the window.</p>${tbl(["Account", "Disabled", "Verified by"], evRows)}`;
    return `<div class="v8d-off">${card(0, "Notice", s1)}${card(1, "Reassign work", s2, btn("Reassign all to " + esc(o.successor), `data-v8d-act="off-all" data-who="${esc(n)}"`))}${card(2, "Remove access", s3)}${card(3, "Return equipment", s4)}${card(4, "Security debrief", s5, o.debrief ? "" : btn("Record debrief", `data-v8d-act="off-deb" data-who="${esc(n)}"`))}${card(5, "Close", s6, o.closed ? "" : `<button type="button" class="btn sm ink" data-v8d-act="off-close" data-who="${esc(n)}"${cur < 5 ? ` aria-disabled="true" title="Finish steps ${cur + 1} to 5 first"` : ""}>Close offboarding</button>`)}</div>`;
  }
  const COMMENTS = {
    "Victor Amsel": [{ who: "Joel Barrantes", role: "ISSM", when: "Nov 16, 4:05 PM", text: `Victor leaves Dec 1, the day his privileged account review is due. ${AK.mention("Nadia Fournier")}, can you take it?` }, { who: "Nadia Fournier", role: "Assessor", when: "Nov 16, 4:40 PM", text: "Yes, if the review moves to me before Nov 24." }],
    "Local developer": [{ who: "Joel Barrantes", role: "ISSM", when: "Nov 14, 9:30 AM", text: "eMASS access waits for the signed DD Form 2875. Rules of behavior first, please." }],
    "Joel Barrantes": [{ who: "Ray Colston", role: "System owner", when: "Nov 10, 9:12 AM", text: "Your role-based training is due Dec 15; the ISSM course runs Dec 3." }],
    "Amara Bell": [{ who: "Joel Barrantes", role: "ISSM", when: "Nov 12, 2:10 PM", text: "GitLab still needs your DD Form 2875 before the CP-4 test scripts can move there." }],
  };
  function activityOf(n) {
    const p = PERSON[n], a = [];
    if (OFF[n]) { const o = OFF[n]; if (o.closed) a.push({ who: ME, what: "closed the offboarding", when: U.when(o.closed) }); a.push({ who: o.by, what: `started offboarding: last day ${md(o.date)}`, when: U.when(o.at) }); }
    a.push({ who: null, what: "verified the Entra ID, Jira and GitLab accounts through the integration", when: "Nov 12, 2:02 PM" });
    onboardingOf(n).filter((r) => r.status === "done").slice(0, 3).forEach((r) => a.push({ who: r.k.startsWith("dd-") ? r.approver : n, what: r.k.startsWith("dd-") ? `approved ${esc(r.t)}` : `completed ${esc(r.t)}`, when: md(r.done) }));
    if (p.role) a.push({ who: null, what: `recorded ${esc(n)} as ${esc(p.role[0].toLowerCase())} of WS-X90`, when: "Sep 12" });
    return a;
  }
  function personHTML(n, tab) {
    const p = PERSON[n];
    let body;
    if (tab === "onboarding") body = onboardingBody(p);
    else if (tab === "access") body = accessBody(p);
    else if (tab === "training") body = trainingBody(p);
    else if (tab === "offboarding") body = AK.withRail(offboardingBody(p), OFF[n] ? AK.railCard("Steps", [["Progress", AK.progress(offSteps(n).done.filter(Boolean).length, 6, "steps")]]) + `<div class="ak-rail-s">${AK.steps(["Notice", "Reassign work", "Remove access", "Return equipment", "Security debrief", "Close"], offSteps(n).cur)}</div>` : railFor(p));
    else if (tab === "comments") body = AK.comments({ items: COMMENTS[n] || [] });
    else if (tab === "activity") body = AK.activity(activityOf(n));
    else body = AK.withRail(overviewBody(p), railFor(p));
    const notes = { overview: "Roles, programs, evidence counts, the issue, the POA&M item, tasks and checks are WS-X90's. Organization, clearance and plan ownership are examples; no role records a period.", onboarding: "Every onboarding state, date, reminder and the task sets beyond the RMF assessor set are examples.", access: "Accounts, their roles, verification dates and last use are examples; the package room access is the prototype's.", training: "Training dates and every DoD 8140 line are examples, as on the DoD 8140 qualifications tab.", offboarding: n === "Victor Amsel" ? "Victor Amsel leaving on Dec 1, his equipment and the debrief are examples; the work he owns and REQ-439 are WS-X90's." : "Offboarding steps are proposed; the work they list is WS-X90's.", comments: "Comments are examples.", activity: "Activity is an example drawn from this person's records." };
    return `<div class="v8d-person">${h.page(personHead(p, tab), body, AK.note(notes[tab] || notes.overview))}</div>`;
  }
  M["v8d-offboard"] = (n) => {
    const p = PERSON[n];
    if (!p) return null;
    const others = PEOPLE.map((x) => x[0]).filter((x) => x !== n);
    return { title: `Start offboarding ${n}`, body: `<div class="v8d-dlg"><p class="ak-desc">Offboarding lists the work to reassign and every account to remove, and closes with the AC-2(3) evidence.</p>
      <div class="ak-field"><label for="v8d-off-date">Last day</label><input id="v8d-off-date" class="v8d-in" type="date" value="2026-12-15" min="2026-11-17"></div>
      <div class="ak-field"><label for="v8d-off-reason">Reason</label><select id="v8d-off-reason" class="v8d-in"><option>Leaves the program</option><option>Leaves the organization</option><option>Changes role</option><option>Contract ends</option></select></div>
      <div class="ak-field"><label for="v8d-off-succ">Successor</label><select id="v8d-off-succ" class="v8d-in">${others.map((x) => `<option${x === "Joel Barrantes" ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></div>
      <p class="v8d-mu">${plural(workOf(n).length, "record")} to reassign · ${plural(accountsOf(n).length, "account")} to remove</p></div>`,
      footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v8d-act="off-start" data-id="${esc(n)}">Start offboarding</button>` };
  };

  // ═════════ Routes ═════════
  const OWN = ["ssps", "ssps-drafts", "ssps-review", "ssps-published"];
  S["ssps"] = () => regHTML("plans");
  S["ssps-drafts"] = () => regHTML("plans");
  S["ssps-review"] = () => regHTML("review");
  S["ssps-published"] = () => regHTML("published");
  // Opening a history (or choosing a version) shows the first change, as the SSP's history does.
  let HJUMP = true;
  const jumpFirst = () => { const pane = document.getElementById("v8d-hpane"), f = pane && pane.querySelector("[data-v8d-chg]"); if (pane && f) pane.scrollTop = Math.max(0, f.getBoundingClientRect().top - pane.getBoundingClientRect().top - 120); };
  window.addEventListener("hashchange", () => { HJUMP = true; });
  for (const k of KEYS) {
    const pl = PLANS[k];
    S[pl.route] = () => editorHTML(pl);
    S[pl.route + "-history"] = () => { if (HJUMP) { HJUMP = false; setTimeout(jumpFirst, 0); } return histHTML(pl); };
    PA.fullWindow(pl.route);
    OWN.push(pl.route, pl.route + "-history");
  }
  for (const r of OWN) ROUTE_NAV[r] = "ssps";
  const PTABS = ["overview", "onboarding", "access", "training", "offboarding", "comments", "activity"];
  for (const p of Object.values(PERSON)) for (const t of PTABS) { const r = `person-${p.slug}${t === "overview" ? "" : "-" + t}`; S[r] = () => personHTML(p.n, t); ROUTE_NAV[r] = "people"; OWN.push(r); }
  PA.own(OWN);

  // ═════════ Additions to others' screens ═════════
  // The SSP editor: the document switcher beside its title, and its way back says Plans.
  PA.decorate("ssp", (html) => {
    if (typeof html !== "string" || html.indexOf('id="se-title"') < 0) return html;
    return html.replace(/(<input class="se-title" id="se-title"[^>]*>)/, `$1${swBtn("ssp")}`).replace(/(<span class="ak-back"[^>]*data-go="ssps"[^>]*>[\s\S]*?)System security plans(<\/span>)/, "$1Plans$2");
  });
  // People: the person preview (each row of the register opens it) gets Open person. The register itself is left as drawn:
  // decorating a canonical screen drops the mark the version 7 audit reads.
  PA.decoratePanel("a-people-person", (html, id) => {
    const nm = String(id || "R. Calloway").split("|")[0], p = PERSON[nm];
    if (!p || typeof html !== "string" || html.indexOf('<div class="ak-rail-s">') < 0) return html;
    return html.replace('<div class="ak-rail-s">', `<div class="btns v8d-openp">${btn(`${AK.i("user")}Open person`, `data-go="person-${p.slug}"`, true)}<span class="v8d-mu">Onboarding, access, training and offboarding</span></div><div class="ak-rail-s">`);
  });

  // ═════════ Events ═════════
  const main = () => document.getElementById("main");
  function rerender(focusSel) {
    const r = route(), m = main();
    if (!S[r] || !m) return;
    const keep = {};
    ["#v8d-scroll", "#v8d-hpane", ".sh-side", "#v8d-margin"].forEach((s) => { const el = $(s, m); if (el) keep[s] = el.scrollTop; });
    const top = m.scrollTop;
    m.innerHTML = S[r]();
    for (const [s, v] of Object.entries(keep)) { const el = $(s, m); if (el) el.scrollTop = v; }
    m.scrollTop = top;
    if (focusSel) { const f = $(focusSel, m); if (f) f.focus({ preventScroll: true }); }
  }
  const curPlan = () => { const a = document.getElementById("v8d-app") || $(".v8d-hist"); return a ? PLANS[a.dataset.plan] : null; };
  const closeModalNow = () => { const x = document.querySelector("#modal [data-close-modal]"); if (x) x.click(); };
  // A popover for menus: the plan switcher, the editor's More menu and the owner pickers.
  let POP = null, POPFOR = null;
  function closePop() { if (POP) POP.hidden = true; if (POPFOR) { POPFOR.setAttribute("aria-expanded", "false"); POPFOR = null; } }
  function openPop(btnEl, html) {
    if (!POP) { POP = document.createElement("div"); POP.className = "se-pop v8d-pop"; POP.id = "v8d-pop"; document.body.appendChild(POP); }
    if (POPFOR === btnEl && !POP.hidden) return closePop();
    closePop();
    POP.innerHTML = html; POP.hidden = false; POPFOR = btnEl; btnEl.setAttribute("aria-expanded", "true");
    const r = btnEl.getBoundingClientRect(), w = Math.min(POP.offsetWidth || 320, innerWidth - 16);
    POP.style.top = Math.min(r.bottom + 6, innerHeight - POP.offsetHeight - 8) + "px";
    POP.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px";
    const f = POP.querySelector("button"); if (f) f.focus({ preventScroll: true });
  }
  function scrollToSec(id) {
    const sc = document.getElementById("v8d-scroll"), el = document.getElementById("v8d-" + id);
    if (!sc || !el) return;
    sc.scrollTo({ top: Math.max(0, sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - 16), behavior: RM() ? "auto" : "smooth" });
  }
  function setSide(pl, side) {
    const s = st(pl.key);
    s.side = s.side === side ? "" : side; s.touched = true;
    if (side === "comments" && !s.side) s.active = null;
    rerender();
  }
  function activate(pl, id, opts = {}) {
    const s = st(pl.key);
    s.active = id; s.touched = true;
    const c = pl.comments.find((x) => x.id === id), g = pl.sugg.find((x) => x.id === id);
    if (g) { s.mtab = "sugg"; s.cfilter = g.done ? "done" : "open"; }
    if (c) { s.mtab = "comments"; s.cfilter = c.resolved ? "done" : "open"; }
    s.side = "comments";
    rerender();
    const card = document.querySelector(`#v8d-margin [data-v8d-card="${id}"]`);
    if (card) { card.scrollIntoView({ block: "nearest", behavior: RM() ? "auto" : "smooth" }); if (opts.focus) { const ta = card.querySelector("textarea"); (ta || card).focus({ preventScroll: true }); } }
    if (opts.doc) { const mk = document.querySelector(`#v8d-scroll [data-v8d-cid="${id}"], #v8d-scroll [data-v8d-sid="${id}"]`); if (mk) mk.scrollIntoView({ block: "center", behavior: RM() ? "auto" : "smooth" }); }
  }
  function setSaving(pl) { const el = document.getElementById("v8d-save"); if (el) el.innerHTML = `<span class="se-spin" aria-hidden="true"></span><span class="se-save-t">Saving…</span>`; }
  function setSaved(pl) { const el = document.getElementById("v8d-save"); if (el) el.innerHTML = `${I("cloud")}<span class="se-save-t">${esc(saveText(pl))}</span>`; }
  const plainText = (el) => { const c = el.cloneNode(true); c.querySelectorAll("[data-v8d-skip]").forEach((x) => x.remove()); return c.textContent.replace(/\s+/g, " ").trim(); };
  let typeTimer = 0, typeEl = null;
  function commitPara(el) {
    const pl = curPlan();
    if (!pl || !el) return;
    const pid = el.dataset.v8dP, old = TX[pl.key].text[pid], now = plainText(el);
    if (now !== old) { TX[pl.key].text[pid] = now; change(pl, pid, old, "Text edited"); }
    setSaved(pl);
  }
  document.addEventListener("input", (e) => {
    const el = e.target.closest && e.target.closest("[data-v8d-p]");
    if (!el) return;
    const pl = curPlan(); if (!pl) return;
    setSaving(pl); typeEl = el; clearTimeout(typeTimer);
    typeTimer = setTimeout(() => commitPara(el), RM() ? 0 : 700);
  });
  document.addEventListener("focusout", (e) => { const el = e.target.closest && e.target.closest("[data-v8d-p]"); if (el && typeEl === el) { clearTimeout(typeTimer); commitPara(el); typeEl = null; } });
  document.addEventListener("mousedown", (e) => { if (e.target.closest && e.target.closest(".v8d-app .se-tb button[data-v8d-cmd], .v8d-app [data-v8d-act='comment']")) e.preventDefault(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (POP && !POP.hidden) { const f = POPFOR; closePop(); if (f) f.focus(); e.preventDefault(); return; }
    const pl = curPlan(); if (!pl) return;
    if ($(".v8d-hist") && hst(pl.key).sheet) { hst(pl.key).sheet = false; rerender(); return; }
    const s = st(pl.key);
    if (document.getElementById("modal") && !document.getElementById("modal").hidden) return;
    if (s.out) { s.out = false; rerender(); return; }
    if (NARROW() && s.side) { s.side = ""; rerender(); return; }
    if (s.active && !(e.target.closest && e.target.closest("textarea"))) { s.active = null; rerender(); }
  });
  window.addEventListener("hashchange", () => { closePop(); for (const k of KEYS) { hst(k).sheet = false; st(k).out = false; } });
  window.addEventListener("resize", () => { const a = document.getElementById("v8d-app"); if (!a) return; const pl = curPlan(); a.classList.toggle("se-ov", NARROW() && !!st(pl.key).side); });

  const ACT = {
    docs: (b) => openPop(b, docsMenu(b.dataset.cur)),
    more: (b, pl) => openPop(b, `<div class="se-menu" role="menu" aria-label="More">${[["side", "comments", "chat", "Comments"], ["side", "assist", "sparkle", "Assist"]].map(([a, sd, ic, l]) => `<button type="button" class="se-mi" role="menuitem" data-v8d-act="${a}" data-side="${sd}" data-plan="${pl.key}">${I(ic)}<span class="se-mi-t"><b>${l}</b></span></button>`).join("")}<button type="button" class="se-mi" role="menuitem" data-v8d-go="${pl.route}-history">${I("history")}<span class="se-mi-t"><b>Version history</b><span>${esc(saveText(pl))}</span></span></button><button type="button" class="se-mi" role="menuitem" data-v8d-go="ssps">${I("toc")}<span class="se-mi-t"><b>All plans</b></span></button></div>`),
    side: (b, pl) => { closePop(); setSide(pl, b.dataset.side || st(pl.key).side); },
    contents: (b, pl) => { const s = st(pl.key); s.out = !s.out; const a = document.getElementById("v8d-app"); if (a) a.classList.toggle("out-open", s.out); },
    scrim: (b, pl) => { const s = st(pl.key); s.out = false; if (NARROW()) s.side = ""; rerender(); },
    goto: (b, pl) => { const s = st(pl.key); if (s.out) { s.out = false; const a = document.getElementById("v8d-app"); if (a) a.classList.remove("out-open"); } if (NARROW() && s.side) { s.side = ""; rerender(); } scrollToSec(b.dataset.at.split(".")[0]); },
    mtab: (b, pl) => { const s = st(pl.key); s.mtab = b.dataset.k; s.cfilter = "open"; rerender(`#v8d-margin [data-v8d-act="mtab"][data-k="${b.dataset.k}"]`); },
    atab: (b, pl) => { st(pl.key).atab = b.dataset.k; rerender(`.se-assist [data-v8d-act="atab"][data-k="${b.dataset.k}"]`); },
    cfilter: (b, pl) => { st(pl.key).cfilter = b.dataset.k; rerender(`#v8d-margin [data-v8d-act="cfilter"][data-k="${b.dataset.k}"]`); },
    card: (b, pl) => activate(pl, b.dataset.id, { doc: false }),
    deact: (b, pl) => { st(pl.key).active = null; rerender(); },
    resolve: (b, pl) => { const c = pl.comments.find((x) => x.id === b.dataset.id); if (!c) return; c.resolved = true; c.resolvedBy = ME; if (st(pl.key).active === c.id) st(pl.key).active = null; rerender(); U.toast("Thread resolved", null); },
    reopen: (b, pl) => { const c = pl.comments.find((x) => x.id === b.dataset.id); if (!c) return; c.resolved = false; st(pl.key).cfilter = "open"; rerender(); U.toast("Thread reopened", null); },
    reply: (b, pl) => { const c = pl.comments.find((x) => x.id === b.dataset.id), ta = document.querySelector(`[data-v8d-reply="${b.dataset.id}"]`); if (!c || !ta || !ta.value.trim()) { if (ta) ta.focus(); return; } c.thread.push([ME, "Security engineer", D.now(), ta.value.trim()]); rerender(`[data-v8d-card="${c.id}"]`); U.toast("Reply posted", null); },
    comment: (b, pl) => {
      const sel = getSelection(), node = sel && sel.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : null, p = node && (node.nodeType === 1 ? node : node.parentElement).closest("[data-v8d-p]");
      const q = sel ? sel.toString().replace(/\s+/g, " ").trim() : "";
      if (!p || !q) { U.toast("Select the words to comment on first", null); return; }
      const s = st(pl.key); s.newc = { pid: p.dataset.v8dP, quote: q.slice(0, 140) }; s.side = "comments"; s.mtab = "comments"; s.cfilter = "open"; s.touched = true; rerender('[data-v8d-reply="new"]');
    },
    cancelnew: (b, pl) => { st(pl.key).newc = null; rerender(); },
    post: (b, pl) => { const s = st(pl.key), ta = document.querySelector('[data-v8d-reply="new"]'); if (!s.newc || !ta || !ta.value.trim()) { if (ta) ta.focus(); return; } const id = "n" + Date.now(); pl.comments.push({ id, at: s.newc.pid.split(".")[0], pid: s.newc.pid, quote: s.newc.quote, thread: [[ME, "Security engineer", D.now(), ta.value.trim()]] }); s.newc = null; s.active = id; rerender(`[data-v8d-card="${id}"]`); U.toast("Comment added", null); },
    accept: (b, pl) => {
      const g = pl.sugg.find((x) => x.id === b.dataset.id);
      if (!g || g.done || locked(pl)) return;
      const T = TX[pl.key], what = `AI draft accepted · Narrative drafter for ${g.for}`;
      if (g.kind === "replace") { const old = T.text[g.pid]; T.text[g.pid] = g.text; change(pl, g.pid, old, what); }
      else { const ord = T.order[g.at], i = ord.indexOf(g.after); ord.splice(i < 0 ? ord.length : i + 1, 0, g.pid); T.text[g.pid] = g.text; change(pl, g.pid, null, what); }
      g.done = "accepted"; g.doneBy = ME;
      if (st(pl.key).active === g.id) st(pl.key).active = null;
      rerender(); U.toast(`AI draft accepted into section ${secLabel(pl, g.at)} · ${saveText(pl)}`, null);
    },
    reject: (b, pl) => { const g = pl.sugg.find((x) => x.id === b.dataset.id); if (!g || g.done) return; g.done = "rejected"; g.doneBy = ME; rerender(); U.toast("AI draft rejected; the text is unchanged", null); },
    draft: (b, pl) => {
      const s = st(pl.key);
      if (s.drafted || s.drafting) return;
      s.drafting = true; rerender();
      setTimeout(() => { s.drafting = false; s.drafted = true; pl.sugg.push(Object.assign({}, pl.draft, { fresh: true })); if (route() === pl.route) rerender(); U.toast(`Narrative drafter drafted a paragraph for section ${secLabel(pl, pl.draft.at)}`, null); }, RM() ? 0 : 900);
    },
    "submit-ok": (b) => {
      const pl = PLANS[b.dataset.id]; if (!pl) return;
      const s = st(pl.key), top = pl.versions[0];
      top.was = top.was || {};
      s.state = "review"; s.sent = D.now(); s.sessionV = null;
      pl.versions.unshift({ v: top.v + 1, at: s.sent, who: [ME], kind: "named", name: "Submitted for ISSM review", changes: [], was: {} });
      closeModalNow(); rerender(); U.toast(`${pl.title} submitted · ${pl.steps[0][1][0][0]} is asked first`, null);
    },
    withdraw: (b) => { const pl = PLANS[b.dataset.id]; if (!pl) return; st(pl.key).state = "draft"; closeModalNow(); rerender(); U.toast("Review request withdrawn; the plan is a draft again", null); },
    "newplan-ok": () => { const r = document.querySelector('input[name="v8d-np"]:checked'); const t = ["Supply chain risk management plan", "Privacy impact assessment", "Continuous monitoring strategy"][r ? +r.value : 0]; closeModalNow(); U.toast(`${t}: a draft from its template is proposed for the next version`, null); },
    // History
    hsel: (b, pl) => { const hs = hst(pl.key); hs.sel = b.dataset.i === "pub" ? "pub" : +b.dataset.i; hs.hit = -1; if (NARROW()) hs.sheet = false; rerender(`[data-v8d-act="hsel"][data-i="${b.dataset.i}"]`); const pane = document.getElementById("v8d-hpane"); if (pane) pane.scrollTop = 0; jumpFirst(); },
    hsheet: (b, pl) => { const hs = hst(pl.key); hs.sheet = !hs.sheet; rerender(hs.sheet ? ".sh-side .sh-v.on button" : ".sh-vbtn"); },
    hnamed: (b, pl) => { const hs = hst(pl.key); hs.named = !hs.named; rerender('[data-v8d-act="hnamed"]'); },
    hchanges: (b, pl) => { const hs = hst(pl.key); hs.changes = !hs.changes; rerender('[data-v8d-act="hchanges"]'); },
    hnext: (b, pl) => hop(pl, 1), hprev: (b, pl) => hop(pl, -1),
    "restore-ok": (b) => { const pl = PLANS[b.dataset.id]; if (!pl) return; const hs = hst(pl.key), idx = hs.sel === "pub" ? pl.versions.length - 1 : hs.sel, from = pl.versions[idx].v; const V = restore(pl, idx); hs.sel = 0; closeModalNow(); rerender(); U.toast(`Version ${from} restored as version ${V.v}`, null); },
    // People
    remind: (b) => { REM[b.dataset.who + b.dataset.k] = "Nov 17"; rerender(); U.toast(`Reminder sent to ${b.dataset.who === ME ? "you" : b.dataset.who}`, null); },
    "ob-done": (b) => {
      const n = b.dataset.who, k = b.dataset.k, o = OPEN[n], r = PERSON[n] && onboardingOf(n).find((x) => x.k === k);
      if (o) delete o[k];
      DONE[n + k] = "2026-11-17";
      pubPeople();
      if (PA.v2 && PA.v2.redraw) PA.v2.redraw(); else rerender();
      const ob = PERSON[n] ? onboardingOf(n) : [], dn = ob.filter((x) => x.status === "done").length;
      U.toast(`${r ? r.t : "Task"} complete · onboarding ${dn} of ${ob.length}`, null);
    },
    upload: () => U.toast("Evidence attaches from a file or a link to the record", null),
    pick: (b) => { const n = b.dataset.who, k = b.dataset.k; openPop(b, `<div class="se-menu" role="menu" aria-label="New owner">${PEOPLE.map((x) => x[0]).filter((x) => x !== n).map((x) => `<button type="button" class="se-mi" role="menuitem" data-v8d-act="picked" data-who="${esc(n)}" data-k="${esc(k)}" data-to="${esc(x)}">${av(x, 22)}<span class="se-mi-t"><b>${esc(x)}${x === ME ? " (you)" : ""}</b><span>${esc(ROLE[x] || "")}</span></span></button>`).join("")}</div>`); },
    picked: (b) => { const o = OFF[b.dataset.who]; if (!o) return; o.owners[b.dataset.k] = b.dataset.to; closePop(); rerender(`[data-v8d-act="pick"][data-k="${b.dataset.k}"]`); U.toast(`Reassigned to ${b.dataset.to}`, null); },
    "off-all": (b) => { const n = b.dataset.who, o = OFF[n]; if (!o) return; workOf(n).forEach((w) => { if (!o.owners[w.k]) o.owners[w.k] = o.successor; }); rerender(); U.toast(`Everything ${n} owns moves to ${o.successor}`, null); },
    "off-acc": (b) => { const o = OFF[b.dataset.who]; if (!o) return; o.access[b.dataset.k] = b.dataset.how === "int" ? ["int", D.now()] : ["man", D.now(), ME]; rerender(); U.toast(b.dataset.how === "int" ? "Disabled; the integration confirmed it" : "Manual check recorded", null); },
    "off-eq": (b) => { const o = OFF[b.dataset.who]; if (!o) return; o.equip[b.dataset.k] = D.now(); rerender(); },
    "off-deb": (b) => { const o = OFF[b.dataset.who]; if (!o) return; o.debrief = D.now(); rerender(); U.toast("SF-312 debriefing recorded", null); },
    "off-close": (b) => { const n = b.dataset.who, x = offSteps(n); if (!x) return; if (x.cur < 5) { U.toast(`Finish step ${x.cur + 1} first: ${["Notice", "Reassign work", "Remove access", "Return equipment", "Security debrief"][x.cur]}`, null); return; } x.o.closed = D.now(); rerender(); U.toast(`Offboarding closed · AC-2(3) evidence saved for ${n}`, null); },
    "off-start": (b) => {
      const n = b.dataset.id, d = document.getElementById("v8d-off-date"), r = document.getElementById("v8d-off-reason"), s = document.getElementById("v8d-off-succ");
      OFF[n] = { date: (d && d.value) || "2026-12-15", reason: (r && r.value) || "Leaves the program", by: ME, at: D.now(), successor: (s && s.value) || "Joel Barrantes", owners: {}, access: {}, equip: {}, debrief: null, closed: null };
      closeModalNow(); rerender(); U.toast(`Offboarding started for ${n}`, null);
    },
  };
  function hop(pl, dir) {
    const pane = document.getElementById("v8d-hpane"), els = pane ? [...pane.querySelectorAll("[data-v8d-chg]")] : [];
    if (!els.length) return;
    const hs = hst(pl.key);
    hs.hit = (hs.hit + dir + els.length) % els.length;
    const el = els[hs.hit];
    $$(".v8d-hit", pane).forEach((x) => x.classList.remove("v8d-hit")); el.classList.add("v8d-hit");
    pane.scrollTo({ top: Math.max(0, pane.scrollTop + el.getBoundingClientRect().top - pane.getBoundingClientRect().top - 140), behavior: RM() ? "auto" : "smooth" });
  }
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (POP && !POP.hidden && !POP.contains(t) && !(POPFOR && POPFOR.contains(t))) closePop();
    const go = t.closest("[data-v8d-go]");
    if (go) { closePop(); location.hash = go.dataset.v8dGo; return; }
    const cmd = t.closest("[data-v8d-cmd]");
    if (cmd) { try { document.execCommand(cmd.dataset.v8dCmd); } catch (err) { /* formatting is a courtesy */ } return; }
    const a = t.closest("[data-v8d-act]");
    const pl = curPlan() || (a && a.dataset.plan && PLANS[a.dataset.plan]);
    if (a && ACT[a.dataset.v8dAct]) { if (a.getAttribute("aria-disabled") === "true" && a.dataset.v8dAct !== "off-close") return; ACT[a.dataset.v8dAct](a, pl || PLANS[a.dataset.id] || PLANS.cp, e); if (/^(off-|picked|remind)/.test(a.dataset.v8dAct)) pubPeople(); return; }
    if (!pl || !t.closest("#v8d-app")) return;
    const mk = t.closest("[data-v8d-cid]");
    if (mk) { activate(pl, mk.dataset.v8dCid, { doc: false }); return; }
    const card = t.closest("[data-v8d-card]");
    if (card && card.dataset.v8dCard !== "new" && !t.closest("textarea, button, a, input") && st(pl.key).active !== card.dataset.v8dCard) activate(pl, card.dataset.v8dCard, { doc: true });
  });
  // Keyboard: Enter on a margin card or a mark activates it, as a click does.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !(e.target instanceof Element)) return;
    const card = e.target.matches("[data-v8d-card]") ? e.target : null, el = e.target.matches("[data-v8d-act]:not(button)") ? e.target : null;
    if (el) { e.preventDefault(); el.click(); return; }
    const pl = curPlan();
    if (card && pl && card.dataset.v8dCard !== "new") { e.preventDefault(); activate(pl, card.dataset.v8dCard, { doc: true, focus: true }); }
  });
})();
