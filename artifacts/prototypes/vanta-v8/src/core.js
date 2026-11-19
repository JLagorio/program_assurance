
(() => {
  const TODAY = new Date("2026-11-17T12:00:00");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmt = (n) => Number(n).toLocaleString("en-US");
  const pct = (a, b) => Math.round((a / b) * 100);
  const day = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const gl = (k) => `<span class="gl ${k}"></span>`;
  const PILL = {
    ok: ["p-ok", "check"], bad: ["p-bad", "diamond"], warn: ["p-warn", "clock"], part: ["p-warn", "part"],
    none: ["p-none", "ring"], info: ["p-info", "info"],
  };
  // v2: one tone per status word, everywhere (SP/vanta/v2/V/status-map.json). The word decides the tone, not the caller:
  // green done or satisfied, red failed, late, critical or high, amber partial, moderate or due soon, grey every neutral or waiting state.
  // Blue is never a status. The glyph follows the tone. STATUS_WORDS holds every pill word v1 drew; a new word falls to the families below.
  const STATUS_WORDS = {"accepted":"ok","accredited cssp":"ok","active":"none","added":"none","adds":"none","affected":"bad","all held":"ok","applied":"ok","approved":"ok","approved and signed":"ok","approved jul n":"ok","approved jun n":"ok","at risk":"warn","ato with conditions":"warn","authorized":"ok","awaiting rescan":"none","block n":"none","block n proposed":"none","blocked":"bad","cal green":"ok","cal not listed":"none","cal temporary":"none","cal yellow":"warn","cal: not applicable":"none","cancelled":"none","changed":"none","changes requested":"bad","changes requested nov n":"bad","claimed":"ok","complete":"ok","completed":"ok","compliant":"ok","component":"none","component assessment":"none","conflict":"bad","connected":"ok","control linked":"ok","counterfeit alert":"bad","critical":"bad","current":"ok","current version":"ok","cve-n-n":"bad","cve-n-n fixed":"ok","cyclonedx n":"none","daily digest":"none","decided":"ok","dmsms notice":"warn","done":"ok","draft":"none","draft results":"none","drafted":"none","drafting":"none","due feb n, n":"none","due jan n, n":"none","due jun n, n":"none","due mar n, n":"none","due nov n · in nd":"warn","due soon":"warn","evidence":"ok","evidenced":"ok","failed":"bad","fix in version n":"none","fixed":"ok","flagged":"bad","green":"ok","high":"bad","hosted model":"none","hours due jan n, n":"none","iatt":"none","immediately":"none","implemented":"ok","import failed":"bad","imported":"ok","importing":"none","in analysis":"none","in baseline":"ok","in progress":"none","in review":"none","in scope":"ok","in use":"ok","in ws-xn's stack":"ok","in-enclave model":"none","in-enclave, issm approves":"none","inherited":"ok","internal review":"none","isa · draft":"none","isa · signed":"ok","issue open":"none","learning hours due":"none","learning hours due jan n":"none","library vn · n behind":"warn","linked":"ok","locked":"ok","low":"none","mapped":"ok","matches a source":"ok","matches version n":"ok","medium":"warn","met":"ok","missed by n days":"bad","moa · signed":"ok","moderate":"warn","modified":"none","mou · expired":"bad","n behind":"warn","n cat i":"bad","n cat ii":"warn","n cat iii":"none","n due soon":"warn","n high":"bad","n of n objectives":"warn","n on track":"ok","n overdue":"bad","n past due":"bad","n to review":"none","n version behind":"warn","n · openssh-server npn":"bad","needed":"none","needs a connection":"none","needs a date":"none","needs answers":"bad","needs review":"none","needs revision":"bad","new":"none","new draft interconnection":"none","no":"none","no document":"none","no evidence":"none","no issue yet":"bad","no known cve":"ok","no renewal set":"none","no requirement":"none","non-compliant":"bad","none":"none","none yet":"none","not a finding":"ok","not applicable":"none","not applied":"none","not assessed":"none","not authorized":"none","not claimed":"none","not connected":"none","not implemented":"bad","not listed":"none","not met":"bad","not qualified":"bad","not read":"none","not ready":"none","not registered":"bad","not requested":"none","not required":"none","not reviewed":"none","not scheduled":"none","not selected":"none","not started":"none","not taken":"none","not written":"none","not yet judged":"none","not yet tested":"none","nothing behind it":"bad","off":"none","off · cui":"none","offer waiting":"none","offered":"none","ok":"ok","on":"ok","on time":"ok","on version n":"none","one":"none","one at a time":"none","open":"bad","open cve":"bad","operational issue opened":"none","other than satisfied":"bad","overdue":"bad","partial":"warn","partially compliant":"warn","partially implemented":"warn","partially satisfied":"warn","partly approved":"warn","partly held":"warn","partly met":"warn","partly verified":"warn","past cadence":"bad","patch staged":"none","pending":"none","pending review":"none","planned":"none","poa&m item created":"ok","proposed":"none","published":"ok","published · frozen":"ok","qualified":"ok","qualifying":"none","qualifying by mar n":"none","qualifying by mar n, n":"none","queued":"none","ready":"none","reason recorded":"ok","reassess by dec n":"none","reassessing":"none","recorded":"ok","reference":"none","registered":"ok","rejected":"bad","removed":"none","removes":"none","review":"none","reviewed":"ok","revoke":"bad","risk · moderate":"warn","same":"none","satisfied":"ok","sent":"ok","sent back":"bad","signed":"ok","still active":"bad","superseded":"none","temporary":"none","this release":"ok","to do":"none","to review":"none","unanswered":"none","unchanged":"none","up to date":"ok","validating":"none","verified":"ok","version n · behind":"warn","version n · current":"ok","version n · n behind":"warn","version n · nov n":"none","version n · published":"ok","waiting":"none","waiting on assessor":"none","waiting on you":"none","weekly digest":"none","with conditions":"warn","works from a file":"none","yellow":"warn","yes":"none","you are here":"none"};
  const normWord = (t) => String(t == null ? "" : t).replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().toLowerCase().replace(/\d+(?:[.,]\d+)?/g, "n");
  const TONE_FAMILY = [
    ["none", /^(adds|removes|added|removed|changed|unchanged|modified|[+−–-] ?n\b)/],
    ["bad", /(overdue|past due|\blate\b|expired|fail|blocked|reject|denied|not met|sent back|changes requested|critical|^high$|^n high$|cat i$|other than satisfied|not registered|not implemented|not qualified|past cadence|open cves?$|counterfeit|needs answers|needs revision|error|non-?compliant|^red$|breach|missed|^open$|flagged|nothing behind)/],
    ["warn", /(partial|partly|incomplete|moderate|^medium$|due soon|in n ?d\b|^yellow$|with conditions|behind|expir(es|ing) soon|at risk|notice|cat ii$|conditional|caution|degraded)/],
    ["none", /^(not |no |non-? ?applicable|un(answered|assessed|known|changed|scheduled)|n\/a$|draft|pending|planned|proposed|in progress|in review|under review|in analysis|ready|active$|queued|waiting|scheduled|submitted|validating|importing|cancel|withdrawn|paused|on hold|low$|info|new$|to do|to review|optional|off\b|inactive|archived|superseded|retired|you are here|reference|temporary|drafting|drafted|reassessing|qualifying|needs a |needs review|needed|awaiting|due )/],
    ["ok", /(^satisfied$|complete|^done$|accepted|approved|published|signed|^met$|passed|^pass$|^ok$|current|up to date|authori[sz]ed|registered|^green$|^on$|decided|imported|in scope|allocated|resolved|closed|fixed|implemented|in use|on track|^compliant$|accredited|verified|healthy|connected|enabled|mapped$|covered$|inherited$|linked$|recorded$|locked$|qualified$|on time|evidenced|^sent$|created$|reviewed$|no known)/],
  ];
  const toneOf = (k, t) => {
    const w = normWord(t);
    if (STATUS_WORDS[w]) return STATUS_WORDS[w];
    for (const [tone, re] of TONE_FAMILY) if (re.test(w)) return tone;
    return k === "ok" || k === "bad" ? k : k === "warn" || k === "part" ? "warn" : "none";
  };
  const GLYPH = { ok: "check", bad: "diamond", warn: "clock", none: "ring" };
  const glyphOf = (tone, t) => (tone === "warn" && /partial|partly|part\b|shared/.test(normWord(t)) ? "part" : GLYPH[tone]);
  const pill = (k, t) => { const tone = toneOf(k, t); return `<span class="pill ${PILL[tone][0]}">${gl(glyphOf(tone, t))}${esc(t)}</span>`; };
  Object.assign(pill, { toneOf, glyphOf, normWord, words: STATUS_WORDS, tones: PILL }); // the visual layer (mod-zzzz-v2-9clean) reads the same map
  const tag = (t) => `<span class="tag">${esc(t)}</span>`;
  // v2: initials on grey (blue is for links and selection); nobody prints a subtle dash, not a ring and "No owner".
  const who = (n) => (n ? `<span class="who"><span class="avatar" style="width:24px;height:24px;font-size:11px">${esc(n.split(" ").map((p) => p[0]).join("").slice(0, 2))}</span><span style="color:var(--ink)">${esc(n)}</span></span>` : `<span class="v2-dash" aria-label="None">—</span>`);
  const bar = (p, c = "var(--ok)") => `<div class="bar"><i style="width:${p}%;background:${c}"></i></div>`;

  function header(title, facts, actions) {
    return `<div class="ph"><div style="display:grid;gap:6px;min-width:0"><h3>${esc(title)}</h3>${facts ? `<div class="facts">${facts}</div>` : ""}</div><div class="btns">${actions || ""}</div></div>`;
  }
  function completion({ title, total, done, unit, minis = [], note = "updated now", color }) {
    const p = pct(done, total);
    return `<div class="card"><div class="t">${esc(title)} <span class="num">${fmt(total)} total</span></div>
      <div class="big num">${p}%</div>${bar(p, color)}
      <div class="foot"><span class="num">${fmt(done)} ${esc(unit)}</span><span>${esc(note)}</span></div>
      ${minis.length ? `<div class="minis">${minis.map(([l, n, of]) => `<div class="mini">${esc(l)}<b class="num">${fmt(n)}</b>${of ? bar(pct(n, of)) : ""}</div>`).join("")}</div>` : ""}</div>`;
  }
  function attention(rows, title = "Needs attention") {
    const total = rows.filter((r) => typeof r[2] === "number" && !r[3]).reduce((a, r) => a + r[2], 0);
    return `<div class="card"><div class="t">${esc(title)} <span class="num">${fmt(total)}</span></div><div class="rows">${rows
      .map(([g, l, n, muted]) => `<div class="row">${gl(g)}<span${muted ? ' class="muted"' : ""}>${esc(l)}</span><b class="num${muted ? " muted" : ""}">${typeof n === "number" ? fmt(n) : esc(n)}</b></div>`)
      .join("")}</div></div>`;
  }
  function tools(search, filters = [], extra = "") {
    return `<div class="tools"><span class="in">${esc(search)}</span>${filters.map((f) => `<span class="flt">${esc(f)} ⌄</span>`).join("")}<span class="flt sub">+ Add filter</span><span class="end">${extra}<span class="ib">▥</span><span class="ib">⚙</span></span></div>`;
  }
  function views(list) { return `<div class="views">${list.map(([l, n], i) => `<span class="qv${i ? "" : " on"}">${esc(l)} <span class="num">${fmt(n)}</span></span>`).join("")}</div>`; }
  function table(cols, rows, total, panelKey) {
    return `<div class="frame"><div class="tablebox"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows
      .map((r) => `<tr tabindex="0" data-panel="${esc(panelKey || "")}" data-id="${esc(r.id || "")}">${r.cells.map((c, i) => `<td${i ? "" : ' class="nm"'}>${c}</td>`).join("")}</tr>`)
      .join("")}</tbody></table></div><div class="pager"><span class="num">1–${rows.length} of ${fmt(total)}</span><span>25 per page · ‹ ›</span></div></div>`;
  }
  const page = (...parts) => `<div class="main">${parts.join("")}</div>`;
  const pair = (a, b) => `<div class="pair">${a}${b}</div>`;

  // ——— Data (WS-X90 and the workspace, read from the local database on 17 Nov 2026) ———
  const PROGRAMS = [
    // v2 (H): WS-X90's satisfied count is the live one (the 52 controls it inherits from F-16 Block 70 and the Squadron operations
    // facility read their providers' status, 227 by default); 176 is its own before inheritance, for a build without mod-zzzz-v2-8host.
    { code: "PRG-1090", name: "WS-X90 Sentinel Mission System", get sat() { const H = window.PA && window.PA.v2host; return H ? H.counts().sat : 176; }, total: 560, href: "#overview", note: "2 assessments active" },
    { code: "PRG-2101", name: "Customer A · X800 Rail Integration", sat: 116, total: 374, note: "1 version behind X800 Missile" },
    { code: "PRG-2102", name: "Customer B · X800 Palletized Integration", sat: 143, total: 370, note: "On X800 Missile version 2" },
    { code: "PRG-2201", name: "Customer C · G25 Battery Control Fielding", sat: 56, total: 287, note: "Built from G25 Launch Control Station" },
  ];
  const OTHER = ["Atlas payments platform", "Corporate identity provider", "Field operations mobile", "Legacy billing gateway", "Northwind data warehouse"];
  const CONTROLS = [
    ["AC-1 Policy and Procedures", "part", "Partially satisfied", 17, 17, "REQ-436"],
    ["AC-2 Account Management", "ok", "Satisfied", 26, 26, "REQ-001"],
    ["AC-2(5) Inactivity Logout", "none", "No evidence", 0, 1, "REQ-442"],
    ["AC-2(7) Privileged User Accounts", "info", "Not assessed", 4, 4, "REQ-443"],
    ["AC-11 Device Lock", "bad", "Other than satisfied", 2, 2, "REQ-012"],
    ["SI-2 Flaw Remediation", "none", "No evidence", 0, 10, "REQ-064"],
  ];
  const REQS = [
    ["REQ-001", "AC Enforcement Requirement 001"], ["REQ-002", "AC Verification Requirement 002"], ["REQ-003", "AC Configuration Requirement 003"],
    ["REQ-004", "AC Monitoring Requirement 004"], ["REQ-005", "AC Enforcement Requirement 005"], ["REQ-006", "AC Verification Requirement 006"],
  ];
  const EVIDENCE = [
    ["Time source comparison test report, LRU-005 60-second cadence with injected 1.5-second offset", "Test record", "Ingrid Solberg", "2026-11-15"],
    ["Maintenance session teardown verification test report, LRU-014 and LRU-007", "Test record", "Joel Barrantes", "2026-11-15"],
    ["Pinned toolchain record export, LRU-020 build environment for release 4.2", "Dataset", "Joel Barrantes", "2026-11-15"],
    ["Authorized internal-connection register and switch enforcement state, LRU-009 and LRU-020", "Dataset", "Priya Raghavan", "2026-11-15"],
    ["Protected information location map and location-change log, LRU-001 and LRU-015", "Document", "Priya Raghavan", "2026-11-15"],
    ["Destruction certificates for six retired units, LRU-003 / LRU-015 / LRU-019", "Document", "Victor Amsel", "2026-11-15"],
  ];
  const SLA = { critical: 15, high: 30, moderate: 90, low: 180 };
  const ISSUES = [
    ["Payload arm and release commands signed under a rotated key cannot be verified at all (AU-10)", "critical", "2026-10-21"],
    ["Disconnected Maintenance Laptop still offers a password-only logon on the flightline (IA-2(2))", "critical", "2026-11-13"],
    ["Unmet requirement REQ-100", "high", "2026-08-07"],
    ["Unmet requirement REQ-008", "high", "2026-08-10"],
    ["Unmet requirement REQ-068", "high", "2026-08-13"],
    ["Session-table occupancy missing from the gateway counter export (SC-5(3))", "high", "2026-09-24"],
  ];
  const RISKS = [
    ["A password on its own reaches WS-X90 at the flightline", "critical", "moderate", "high"],
    ["Payload arm and release records become unverifiable as signing keys rotate", "critical", "moderate", "high"],
    ["Risk arising from REQ-068", "high", "moderate", "high"],
    ["Risk arising from REQ-100", "high", "moderate", "high"],
    ["Low-rate exhaustion and unattributable egress at the WS-X90 external boundary", "high", "moderate", "high"],
    ["An unsealed service connector leaves a physical route into the maintenance path", "high", "moderate", "high"],
  ];
  const POAM = [["Remediate REQ-008", "In progress"], ["Remediate REQ-015", "In progress"], ["Remediate REQ-024", "In progress"], ["Remediate REQ-032", "In progress"], ["Remediate REQ-039", "Completed"], ["Remediate REQ-045", "In progress"]];
  const ASSETS = [["AST-109001", "Mission Computer"], ["AST-109002", "Secure Boot Controller"], ["AST-109003", "Cryptographic Services Module"], ["AST-109004", "Navigation Processor"], ["AST-109005", "Timing Receiver"], ["AST-109006", "Navigation Sensor Interface"]];
  const CAMPAIGNS = [
    ["WS-X90 Expanded Control Set Assessment", "active", "Control assessment", "2026-09-14", "2026-11-20"],
    ["WS-X90 continuous monitoring — FY2027", "active", "Control assessment", "2026-10-01", "2027-09-30"],
    ["WS-X90 cooperative vulnerability identification — FY2027", "planned", "Cyber test", "2027-01-11", "2027-02-05"],
    ["WS-X90 Initial Authorization Security Assessment", "completed", "Control assessment", "2026-08-03", "2026-08-21"],
  ];
  const sevPill = (s) => pill(s === "critical" ? "bad" : s === "high" ? "bad" : s === "moderate" ? "warn" : "none", s[0].toUpperCase() + s.slice(1));
  const dueOf = (opened, sev) => { const d = new Date(opened + "T12:00:00"); d.setDate(d.getDate() + SLA[sev]); return d; };
  const dueCell = (d) => {
    const diff = Math.round((d - TODAY) / 86400000);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (diff < 0) return `<span style="color:var(--bad);font-weight:500">${label} · ${-diff}d late</span>`;
    if (diff <= 14) return `<span style="color:var(--warn);font-weight:500">${label} · in ${diff}d</span>`;
    return `<span class="num">${label}</span>`;
  };

  // ——— Navigation: option 3. A rail of the workspace's destinations that never changes, and, inside a program, the program's menu beside it ———
  // v2 (N): a rail destination with several pages shows them the way a program's pages show: a menu beside the rail, the area's name
  // at its top where a program's switcher sits, its pages listed (in groups where it has groups), the current one marked. No tab strip.
  // [route, label, count, pages, first of the bottom group].
  const RAIL = [
    ["home", "Home"], ["my-work", "My work", () => badge.myWork()], ["review-queue", "Review", () => badge.review()], ["portfolio", "Programs"],
    ["products", "Products", null, [["products", "Products"], ["components", "Components"], ["suppliers", "Suppliers"]]],
    ["frameworks", "Library", null, [["frameworks", "Frameworks & overlays"], ["integrations", "Integrations"], ["data-calls", "Data calls"], ["reports", "Reports & exports"]]],
    ["ai-drafts", "AI agents", null, [["ai-drafts", "Needs approval"], ["ai-drafts-runs", "Runs"], ["ai-drafts-agents", "Agents"]]],
    ["study", "About", null, [["study", "Design study"], ["before-after", "Before & after"], ["nav-options", "Navigation options"]], true],
    ["deadlines", "Settings", null, [["deadlines", "Deadlines"], ["notifications-workspace", "Workspace notifications"], ["permissions", "Roles & permissions"], ["enclaves", "Enclaves & markings"], ["common-controls", "Host systems & providers"], ["event-log", "Event log"], ["notifications", "Notifications"]]],
  ];
  const RAIL_ICON = { study: "about", deadlines: "settings" };
  // An area's menu in groups, where it has groups (Settings: the workspace's, then the reader's own); otherwise its pages in one list.
  const AREA_GROUPS = {
    deadlines: [["Workspace", [["deadlines", "Deadlines"], ["notifications-workspace", "Notifications"], ["permissions", "Roles & permissions"], ["enclaves", "Enclaves & markings"], ["common-controls", "Host systems & providers"], ["event-log", "Event log"]]],
      ["My account", [["notifications", "Notifications"]]]],
  };
  // The program's menu: WS-X90's pages in their groups.
  const PROGRAM = [
    [null, [["overview", "Overview"], ["lifecycle", "Lifecycle"], ["getting-started", "Getting started", () => badge.started()], ["itcsc", "ITCSC"]]],
    ["System", [["boundary", "Boundary"], ["hosts", "Host & providers"], ["composition", "Composition"], ["inventory", "Inventory"], ["stigs", "STIG checklists"], ["interconnections", "Interconnections"], ["ppsm", "Ports & protocols"], ["sources", "Evidence sources"]]],
    ["Compliance", [["baseline", "Baseline"], ["controls", "Controls"], ["ssps", "Plans"], ["requirements", "Requirements"], ["sctm", "SCTM workbook"], ["evidence", "Evidence", () => badge.of("evidence", 368)], ["checks", "Checks"], ["policies", "Policies"]]],
    ["Assess", [["assessments", "Assessments"], ["cyber-te", "Cyber T&E"]]],
    ["Risk", [["findings", "Findings", () => badge.of("findings", 44)], ["poam", "POA&M"], ["risks", "Risks"], ["threats", "Threats"]]],
    ["Analysis", [["posture", "Posture"], ["resiliency", "Cyber resiliency"], ["sse", "Security engineering"], ["traceability", "Traceability"], ["inheritance", "Inheritance"]]],
    ["Authorize", [["authorization", "Authorization"], ["package-room", "Package room"]]],
    ["Monitor", [["conmon", "Continuous monitoring"], ["schedule", "Schedule"]]],
    [null, [["people", "People"]]],
  ];
  // Every page the navigation names, for labels and for routes with no screen yet.
  const NAV = [[null, [["home", "Home"], ["my-work", "My work"], ["review-queue", "Review queue"], ["portfolio", "Programs"], ["ai-drafts", "AI agents"]]], ...RAIL.filter((r) => r[3]).map((r) => [r[1], r[3]]), ...PROGRAM];
  const CLOSED = new Set(["Monitor", "Analysis"]);
  const ICONS = {"lifecycle": "M1.5 8h9M3.5 6v4M7 6v4M12.5 5.5L15 8l-2.5 2.5L10 8z", "boundary": "M3 2.5h10a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 12V4A1.5 1.5 0 0 1 3 2.5zM5 6h3v4H5z", "hosts": "M1.5 12h13M3 12V9.5h10V12M6 9.5V5.5h4v4", "sctm": "M2.5 3h11v10h-11zM2.5 6.5h11M2.5 10h11M6.5 3v10","settings":"M8 5.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8zM6.9 1.8h2.2l.3 1.7 1.3.6 1.4-1 1.6 1.6-1 1.4.6 1.3 1.7.3v2.2l-1.7.3-.6 1.3 1 1.4-1.6 1.6-1.4-1-1.3.6-.3 1.7H6.9l-.3-1.7-1.3-.6-1.4 1-1.6-1.6 1-1.4-.6-1.3-1.7-.3V6.9l1.7-.3.6-1.3-1-1.4 1.6-1.6 1.4 1 1.3-.6z", "about": "M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM8 7.3v3.9M8 4.9h.01", "more": "M3 8a1 1 0 1 0 2 0 1 1 0 0 0-2 0zM7 8a1 1 0 1 0 2 0 1 1 0 0 0-2 0zM11 8a1 1 0 1 0 2 0 1 1 0 0 0-2 0z", "nav-options": "M2.5 3h11v10h-11zM6.5 3v10M9 6h2.5M9 8.5h2.5", "itcsc": "M4 2.5h8v11H4zM6 5.5h4M6 8h4M6 10.5h2", "stigs": "M8 2l5 2v4c0 3-2.2 5.2-5 6-2.8-.8-5-3-5-6V4zM5.8 8l1.6 1.6 3.1-3.1", "interconnections": "M6.5 9.5l3-3M5.2 7.3 4 8.5a2.1 2.1 0 0 0 3 3l1.2-1.2M10.8 8.7 12 7.5a2.1 2.1 0 0 0-3-3L7.8 5.7", "ppsm": "M2.5 5h11v6h-11zM5 8h0M8 8h0M11 8h0", "sse": "M8 5.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6 5 5M11 11l1.4 1.4M3.6 12.4 5 11M11 5l1.4-1.4", "permissions": "M4 7.5h8v6H4zM5.7 7.5V5.6a2.3 2.3 0 0 1 4.6 0v1.9", "home": "M3 7.5 8 3l5 4.5V13H3z", "my-work": "M2.5 9.5h3l1 2h3l1-2h3M3 4h10l1 5.5V13H2V9.5z", "components": "M8 2l5.5 3v6L8 14l-5.5-3V5zM8 8l5.5-3M8 8 2.5 5M8 8v6", "overview": "M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z", "baseline": "M8 2.5l5.5 3L8 8.5 2.5 5.5zM2.5 8.5 8 11.5l5.5-3M2.5 11 8 14l5.5-3", "controls": "M8 2l5 2v4c0 3-2.2 5-5 6-2.8-1-5-3-5-6V4z", "ssps": "M4 2h5.5L12 4.5V14H4zM9.5 2v2.5H12M6 8h4M6 10.5h2.5", "getting-started": "M8 2.5a5.5 5.5 0 1 0 5.5 5.5M8 2.5V8h5.5", "requirements": "M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01", "evidence": "M4 2h5.5L12 4.5V14H4zM9.5 2v2.5H12", "assessments": "M5 3H3.5v11h9V3H11M6 2h4v2H6z", "findings": "M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5", "poam": "M3.5 14V2.5h8l-1.5 3 1.5 3h-8", "risks": "M8 2.5l6 11H2zM8 6.5v3M8 11.5h.01", "inventory": "M2.5 3h11v4h-11zM2.5 9h11v4h-11zM5 5h.01M5 11h.01", "sources": "M6 2v3M10 2v3M4.5 5h7v3a3.5 3.5 0 0 1-7 0zM8 11.5V14", "authorization": "M6 2.5h4l-.5 5h-3zM3 10h10v2.5H3zM4 14h8", "study": "M3 3h4a1 1 0 0 1 1 1v9a1 1 0 0 0-1-1H3zM13 3H9a1 1 0 0 0-1 1v9a1 1 0 0 1 1-1h4z", "before-after": "M2.5 3.5h5v9h-5zM8.5 3.5h5v9h-5zM10 6.5l1.5 1.5L10 9.5", "review-queue": "M3 3h10v10H3zM6 8l1.5 1.5L10.5 6", "composition": "M8 2v4M8 6H4v3M8 6h4v3M4 9v1.5M12 9v1.5M2.5 10.5h3v3h-3zM10.5 10.5h3v3h-3zM6.5 2h3v.01", "checks": "M3 8.5l3 3 7-7", "policies": "M4 2h8v12H4zM6 5h4M6 8h4M6 11h2", "cyber-te": "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 5.5v5M5.5 8h5", "ai-drafts": "M8 2l1.3 3.2L12.5 6.5 9.3 7.8 8 11 6.7 7.8 3.5 6.5l3.2-1.3zM12.5 11l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z", "threats": "M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM8 8h.01", "posture": "M2.5 2.5h3v3h-3zM6.5 2.5h3v3h-3zM10.5 2.5h3v3h-3zM2.5 6.5h3v3h-3zM6.5 6.5h3v3h-3zM2.5 10.5h3v3h-3z", "resiliency": "M8 2l5 2v4c0 3-2.2 5-5 6-2.8-1-5-3-5-6V4zM5.5 8l1.8 1.8L10.5 6.5", "traceability": "M3 4h3v3H3zM10 9h3v3h-3zM6 5.5h2a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1", "inheritance": "M8 2.5v3M8 5.5 4 9M8 5.5l4 3.5M2.5 9h3v3h-3zM10.5 9h3v3h-3zM6.5 1h3v2.5h-3z", "package-room": "M3 6l5-3.5L13 6v7.5H3zM6.5 13.5V9.5h3v4", "conmon": "M2 8h3l1.5-4 3 8L11 8h3", "schedule": "M3 3.5h10v10H3zM3 6.5h10M6 2v3M10 2v3", "portfolio": "M8 2.5v3M3.5 8.5v-3h9v3M2 8.5h3v3H2zM6.5 8.5h3v3h-3zM11 8.5h3v3h-3z", "products": "M8 2l5.5 3v6L8 14l-5.5-3V5z", "suppliers": "M2 12.5h12M3.5 12.5V6l3 2V6l3 2V6l3 2v4.5", "people": "M6 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2 13.5c0-2.2 1.8-4 4-4s4 1.8 4 4M11 4.5a2 2 0 0 1 0 4M12.5 13.5c0-1.5-.6-2.7-1.5-3.4", "frameworks": "M3 3h4a1 1 0 0 1 1 1v9a1 1 0 0 0-1-1H3zM13 3H9a1 1 0 0 0-1 1v9a1 1 0 0 1 1-1h4z", "integrations": "M6 2v3M10 2v3M4.5 5h7v3a3.5 3.5 0 0 1-7 0zM8 11.5V14", "data-calls": "M3 3h10v7H7l-3 3v-3H3z", "reports": "M4 14V8M8 14V3M12 14v-4", "deadlines": "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 5v3l2 1.5", "notifications": "M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3zM6.5 14h3", "event-log": "M3 3h10M3 6.5h10M3 10h6M3 13.5h8", "enclaves": "M4 7V5a4 4 0 0 1 8 0v2M3 7h10v7H3zM8 10v1.5", "common-controls": "M8 2l5 2v4c0 3-2.2 5-5 6-2.8-1-5-3-5-6V4zM8 5v6M5.5 8h5"};
  const icon = (k) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[k] || 'M6 8h4'}"/></svg>`;
  const ROUTE_NAV = { campaign: "assessments", "ssp-history": "ssps", "ssp-review": "ssps" };
  ["program-new", "program-new-details", "program-new-systems", "program-new-baseline", "program-new-team", "program-new-review"].forEach((r) => { ROUTE_NAV[r] = "portfolio"; });
  const PKEYS = new Set(PROGRAM.flatMap(([, items]) => items.map(([k]) => k)));
  const WHOME = new Map(); // a workspace page → the rail destination it belongs to
  RAIL.forEach(([k, , , pages]) => { WHOME.set(k, k); (pages || []).forEach(([t]) => WHOME.set(t, k)); });
  const KEYS = [...PKEYS, ...WHOME.keys()].sort((a, b) => b.length - a.length);
  // The nav item a route belongs to: one a module named for it, its own, or the longest item it starts with (stigs-open is STIG checklists).
  const navKey = (r) => ROUTE_NAV[r] || (PKEYS.has(r) || WHOME.has(r) ? r : KEYS.find((k) => r.startsWith(k + "-")) || r);
  // v2 C2 (B7): a badge is a function read when the menu is drawn: the count the page it opens shows (its All view), the queue's
  // own total, My work's rows, the starter guide's share done; a created program's pages show their own (no WS-X90 badge).
  const badge = {
    hubs: () => window.PA && window.PA.v2hubs,
    wsx: () => { const H = badge.hubs(); return !H || H.cur() === "PRG-1090"; },
    of: (route, d) => { if (!badge.wsx()) return null; const H = badge.hubs(), n = H ? H.count(route, "All") : null; return n == null ? d : n; },
    myWork: () => { const W = window.PA && window.PA.mywork; return W ? W.data().reduce((a, g) => a + g.rows.length, 0) : null; },
    review: () => { const Q = window.PA && window.PA.reviewQueue; return Q ? Q.total() : null; },
    started: () => { const H = badge.hubs(); if (H && !badge.wsx()) { const g = window.PA.pnGuide && window.PA.pnGuide(); return g ? `${pct(g.done, g.total)}%` : null; } const G = window.PA && window.PA.gs; return G ? `${G.pct()}%` : null; },
  };
  const navCount = (c) => { if (typeof c === "function") { try { c = c(); } catch (e) { c = null; } } return c == null || c === "" ? "" : typeof c === "string" ? esc(c) : fmt(c); };
  function programHead() {
    const p = PROGRAMS[0];
    return `<div class="pnh"><div class="sw-wrap"><button class="switch pn-sw" type="button" id="swBtn" aria-haspopup="menu" aria-expanded="false"><span class="pn-swt"><b>WS-X90</b><small>Sentinel Mission System</small></span><span aria-hidden="true">▾</span></button>`
      + `<div class="swmenu" id="swMenu" role="menu" hidden>${PROGRAMS.map((q) => `<a role="menuitem" href="${q.href || "#portfolio"}">${esc(q.name)} <small>${esc(q.code)}</small></a>`).join("")}<a role="menuitem" href="#portfolio">All programs <small>${PROGRAMS.length + OTHER.length}</small></a><a role="menuitem" href="#program-new">Create program <small>New</small></a></div></div>`
      + `<div class="pn-facts"><span>${esc(p.code)}</span><span>Impact High</span></div>${lifeLine()}</div>`;
  }
  // v2 G: the program's stage, one grey line under the switcher that opens Lifecycle (mod-zzzz-v2-8life.js draws it for the current program).
  const lifeLine = () => { const L = window.PA && window.PA.v2life; if (!L || !L.headLine) return ""; try { return L.headLine(); } catch (e) { return ""; } };
  // v2 (N): the area a workspace page belongs to (its rail destination, when that holds several pages) and the area's menu.
  const areaOf = (route) => {
    const current = navKey(route);
    if (PKEYS.has(current)) return null;
    const r = RAIL.find(([k]) => k === WHOME.get(current));
    return r && r[3] && r[3].length > 1 ? r : null;
  };
  const areaMenu = (r) => AREA_GROUPS[r[0]] || [[null, r[3]]];
  // The item a route marks: the one named for the route itself (notifications-workspace), else its nav item (deadlines-vuln is Deadlines).
  const areaItem = (route, r) => { const its = areaMenu(r).flatMap(([, x]) => x); return ((its.find(([k]) => k === route) || its.find(([k]) => k === navKey(route))) || [null])[0]; };
  // Counts a page's own tab strip carried before the visual layer folded the strip into the menu (route → count text).
  const AREA_COUNTS = {};
  // The area's name sits where a program's switcher sits; its pages follow, in their groups, as a program's pages do.
  const areaNav = (route, r) => {
    const on = areaItem(route, r);
    return `<div class="pnh pn-areah"><div class="pn-area"><b>${esc(r[1])}</b></div></div>` + areaMenu(r).map(([g, items]) => (g ? `<div class="g pn-ag">${esc(g)}</div>` : "")
      + items.map(([k, l]) => `<a class="item${k === on ? " on" : ""}" href="#${k}"${k === on ? ' aria-current="page"' : ""}>${icon(k)}${esc(l)}${AREA_COUNTS[k] ? `<span class="c num">${esc(AREA_COUNTS[k])}</span>` : ""}</a>`).join("")).join("");
  };
  function drawNav(route) {
    const current = navKey(route), inProg = PKEYS.has(current), home = inProg ? "portfolio" : WHOME.get(current), area = inProg ? null : areaOf(route);
    proto.classList.toggle("inprog", inProg); shell.classList.toggle("inprog", inProg);
    proto.classList.toggle("inarea", !!area); shell.classList.toggle("inarea", !!area);
    const railItem = ([k, l, c, , end]) => `<a class="ri${k === home ? " on" : ""}${end ? " ri-end" : ""}" href="#${k}"${k === home && !inProg ? ' aria-current="page"' : ""}>${icon(RAIL_ICON[k] || k)}<span class="ri-l">${esc(l)}</span>${c != null ? `<span class="ri-b num">${navCount(c)}</span>` : ""}</a>`;
    document.getElementById("rail").innerHTML = RAIL.map(railItem).join("");
    const nav = document.getElementById("nav"), mb = document.getElementById("menuBtn");
    nav.innerHTML = inProg ? programHead() + PROGRAM.map(([g, items], gi) => {
      const holds = items.some(([k]) => k === current);
      const open = !g || holds || !CLOSED.has(g);
      const head = g ? `<button type="button" class="g gbtn" data-group="${esc(g)}" aria-expanded="${open}">${esc(g)}<span aria-hidden="true">${open ? "⌄" : "›"}</span></button>` : gi ? '<div class="pn-sep" aria-hidden="true"></div>' : "";
      return head + (open ? items.map(([k, l, c]) => `<a class="item${k === current ? " on" : ""}" href="#${k}"${k === current ? ' aria-current="page"' : ""}>${icon(k)}${esc(l)}${c ? `<span class="c num">${navCount(c)}</span>` : ""}</a>`).join("") : "");
    }).join("") : area ? areaNav(route, area) : "";
    nav.setAttribute("aria-label", area ? area[1] : "WS-X90");
    if (mb) mb.setAttribute("aria-label", area ? `Open the ${area[1]} menu` : "Open the program's menu");
    // A phone: four destinations and More along the bottom; ☰ opens the program's menu, or the area's.
    const more = RAIL.slice(4), moreOn = more.some(([k]) => k === home);
    document.getElementById("bottom").innerHTML = RAIL.slice(0, 4).map(railItem).join("")
      + `<button type="button" class="ri${moreOn ? " on" : ""}" id="moreBtn" aria-expanded="false" aria-controls="moreMenu">${icon("more")}<span class="ri-l">More</span></button>`
      + `<div class="pt-more" id="moreMenu" hidden>${more.map(([k, l]) => `<a href="#${k}"${k === home ? ' aria-current="page"' : ""}>${icon(RAIL_ICON[k] || k)}${esc(l)}</a>`).join("")}</div>`;
  }
  // The area a route belongs to, for the visual layer: its name, its pages and the one the route marks; and a page's count for the menu.
  const area = (route) => { const r = areaOf(route); return r ? { key: r[0], label: r[1], items: areaMenu(r).flatMap(([, x]) => x), current: areaItem(route, r) } : null; };
  const areaCount = (route, text) => {
    AREA_COUNTS[route] = text == null ? "" : String(text);
    const a = document.querySelector(`#nav a.item[href="#${CSS.escape(route)}"]`); if (!a) return;
    let c = a.querySelector(".c");
    if (!AREA_COUNTS[route]) { if (c) c.remove(); return; }
    if (!c) { c = document.createElement("span"); c.className = "c num"; a.appendChild(c); }
    c.textContent = AREA_COUNTS[route];
  };


  // ——— Screens ———
  const S = {}; const M = {}; const MODED = new Set(["campaign"]);
  S.home = () => page(
    header("Home", "", `<a class="btn" href="#my-work">View my work</a><span class="btn ink" data-go="program-new" role="link" tabindex="0">Create program</span>`),
    `<div class="next" style="justify-content:space-between">${gl("clock")}<span><b>Mission Computer version 2</b> is published: 4 consumers are behind and 2 controls wait for review.</span><a class="sp" href="#components" style="font-weight:500">Open component →</a></div>`,
    `<h4 class="subhead">Controls satisfied, by program</h4>`,
    `<div class="grid3">${PROGRAMS.map((p) => { const v = pct(p.sat, p.total); return `<a class="pcard" href="${p.href || "#home"}"><div class="nm2"><span>${esc(p.name)}</span><span class="code">${p.code}</span></div><div class="big num">${v}%</div>${bar(v)}<div class="foot"><span class="num">${p.sat} controls satisfied</span><span class="num">${p.total} total</span></div><div class="note-p">${esc(p.note)}</div></a>`; }).join("")}</div>`,
    `<div class="card"><div class="t">Other programs <span class="num">${OTHER.length}</span></div><div class="rows">${OTHER.map((n) => `<div class="row">${gl("ring")}<span>${esc(n)}</span><b class="muted" style="font-size:13px;font-weight:400">Open →</b></div>`).join("")}</div></div>`,
  );
  S["my-work"] = () => {
    const g = (title, glyph, rows) => `<div class="mwg"><h4>${gl(glyph)}${esc(title)} <span class="ct num">${rows.length}</span></h4>${rows.map(([t, meta, href]) => `<a class="mwrow" href="${href}">${t}<span class="meta">${esc(meta)}</span></a>`).join("")}</div>`;
    return page(
      header("My work", "", ""),
      `<div class="views"><span class="qv on">All</span><span class="qv">Assigned to me</span><span class="qv">My teams</span><span class="qv">Needs my approval</span></div>`,
      `<div class="mw">
        ${g("Urgent", "diamond", [["<b>Resolve 17 operational issues past their remediation date</b>", "WS-X90 · 2 critical", "#findings"], ["<b>Treat 2 critical risks</b>: a password alone reaches WS-X90; unverifiable arm and release records", "WS-X90", "#risks"]])}
        ${g("Coming soon", "clock", [["<b>Close out the Expanded Control Set Assessment</b> — 89 controls not assessed", "WS-X90 · ends Nov 20", "#campaign"], ["<b>Remediate 3 operational issues</b> due within two weeks", "WS-X90", "#findings"], ["<b>Publish SSP 3</b> for WS-X90", "Draft", "#controls"]])}
        ${g("Unscheduled", "ring", [["<b>Give an owner to 40 open risks</b>", "WS-X90", "#risks"], ["<b>Revise 54 evidence versions</b> sent back by reviewers", "WS-X90", "#evidence"]])}
        ${g("Waiting on others", "info", [["<b>88 evidence versions</b> wait on a reviewer", "WS-X90", "#evidence"], ["<b>An offered finding, CVE-2024-6387</b>, waits on Priya Raghavan", "Mission Computer", "#components"]])}
      </div>`,
    );
  };
  S.overview = () => page(
    header("WS-X90 Sentinel Mission System", "<span>PRG-1090</span><span>Impact <b>High</b></span><span>Lead assessor <b>D. Okafor</b></span><span>Authorizing official <b>R. Calloway</b></span>", `<span class="btn">⋯</span><a class="btn ink" href="#authorization">Open package</a>`),
    pair(
      completion({ title: "Controls satisfied", total: 560, done: 176, unit: "controls", minis: [["Mapped", 546, 560], ["With evidence", 312, 560], ["Assessed", 223, 560]] }),
      attention([["diamond", "Issues past due", 17], ["diamond", "Critical issues", 2], ["clock", "Critical or high risks", 12], ["ring", "Evidence to revise", 54], ["ring", "Risks with no owner", 40]]),
    ),
    `<div class="card"><div class="t">Assessments <span><a href="#assessments">View all</a></span></div>${CAMPAIGNS.map(([t, s, k, a, b]) => lane(t, s, a, b)).join("")}</div>`,
    `<div class="grid2">${completion({ title: "POA&M completed", total: 41, done: 7, unit: "items completed", note: "33 in progress · 1 open" })}${completion({ title: "Evidence accepted", total: 368, done: 226, unit: "artifacts accepted", note: "88 pending · 54 to revise" })}</div>`,
  );
  function lane(t, s, a, b) {
    const start = new Date("2026-08-01"), end = new Date("2027-10-01"), span = end - start;
    const L = Math.max(0, ((new Date(a) - start) / span) * 100), W = Math.max(1.5, ((new Date(b) - new Date(a)) / span) * 100), T = ((TODAY - start) / span) * 100;
    const c = s === "active" ? "var(--info)" : s === "completed" ? "var(--ok)" : "var(--ink-4)";
    return `<div class="lane"><a href="${s === "active" && t.includes("Expanded") ? "#campaign" : "#assessments"}" style="color:var(--ink);font-weight:500;text-decoration:none">${esc(t)}</a><div class="tl"><i style="left:${L}%;width:${W}%;background:${c}"></i><span class="today" style="left:${T}%"></span></div>${pill(s === "active" ? "info" : s === "completed" ? "ok" : "none", s[0].toUpperCase() + s.slice(1))}</div>`;
  }
  S.baseline = () => page(
    header("Baseline", "<span>NIST SP 800-53 Rev 5 High baseline, then the program's overlays and tailoring</span>", `<span class="btn">Replay</span><span class="btn ink" data-open="overlays">Edit overlays</span>`),
    pair(
      completion({ title: "Controls in the baseline", total: 560, done: 560, unit: "controls selected", color: "var(--ink)", note: "after every layer" }),
      `<div class="card"><div class="t">Change the baseline</div><p style="color:var(--ink-2)">Edit overlays shows the count before and after, names what moves, and waits while an assessment is open.</p><div class="next">${gl("clock")}<span>2 assessments are active: changes wait until they close</span></div></div>`,
    ),
    `<div class="card"><div class="t">Controls by family <span class="num">560</span></div>${[["SA", 68], ["SC", 66], ["SI", 54], ["AC", 52], ["CM", 43], ["IA", 36], ["AU", 35], ["IR", 32], ["CP", 27], ["PE", 26]].map(([f, n]) => `<div class="lane" style="grid-template-columns:60px minmax(0,1fr) 50px"><b>${f}</b><div class="bar"><i style="width:${(n / 68) * 100}%;background:var(--ink-3)"></i></div><span class="num" style="text-align:end">${n}</span></div>`).join("")}</div>`,
  );
  S.controls = () => page(
    header("Controls", "", `<span class="btn">Export ▾</span><span class="btn">Publish SSP 3</span><span class="btn ink">Map a requirement</span>`),
    pair(
      completion({ title: "Controls satisfied", total: 560, done: 176, unit: "controls", minis: [["Mapped", 546, 560], ["With evidence", 312, 560], ["Assessed", 223, 560]] }),
      attention([["diamond", "Short of satisfied", 47], ["clock", "Not assessed", 89], ["ring", "No evidence", 234], ["ring", "No requirement", 14], ["ring", "No owner", "—", true]]),
    ),
    views([["All", 560], ["Needs evidence", 234], ["Not assessed", 89], ["Short of satisfied", 47], ["Inherited", 15]]),
    tools("Search controls", ["Family", "Status", "Determined by"]),
    table(["Control", "Status", "Objectives with evidence", "Owner", "Requirement"], CONTROLS.map(([n, k, s, e, o, r]) => ({ id: n.split(" ")[0], cells: [esc(n), pill(k, s), `<span class="num">${e} of ${o}</span>`, who(null), tag(r)] })), 560, "control"),
  );
  S.requirements = () => page(
    header("Requirements", "", `<span class="btn">Import requirements</span><span class="btn ink">Create requirement</span>`),
    pair(
      completion({ title: "Requirements allocated", total: 640, done: 640, unit: "allocated to a system", minis: [["Map a control", 640, 640], ["With an owner", 0, 640]] }),
      attention([["ring", "No owner", 640], ["ring", "Unallocated", 0, true]]),
    ),
    tools("Search requirements", ["Type", "Allocation", "Owner"]),
    table(["Requirement", "Title", "Allocation", "Controls", "Owner"], REQS.map(([c, t]) => ({ id: c, cells: [esc(c), esc(t), pill("ok", "Allocated"), pill("ok", "Mapped"), who(null)] })), 640),
  );
  S.evidence = () => page(
    header("Evidence", "", `<span class="btn">Export ▾</span><span class="btn ink">Add evidence ▾</span>`),
    pair(
      completion({ title: "Evidence accepted", total: 368, done: 226, unit: "artifacts accepted" }),
      attention([["diamond", "Needs revision", 54], ["clock", "Pending review", 88], ["ring", "No renewal date set", "—", true]]),
    ),
    views([["All", 368], ["Pending review", 88], ["Needs revision", 54], ["Requires my approval", 0]]),
    tools("Search evidence", ["Kind", "Review", "Owner", "Renew by"]),
    table(["Evidence", "Kind", "Owner", "Review", "Collected", "Renew by"], EVIDENCE.map(([t, k, o, d]) => ({ id: t.slice(0, 20), cells: [`<span style="display:inline-block;max-width:420px;overflow:hidden;text-overflow:ellipsis;vertical-align:bottom">${esc(t)}</span>`, tag(k), who(o), pill("warn", "Pending review"), `<span class="num">${day(d)}</span>`, `<span class="who">${gl("ring")}Not set</span>`] })), 368, "evidence"),
  );
  S.assessments = () => page(
    header("Assessments", "", `<span class="btn ink">Plan an assessment</span>`),
    pair(
      completion({ title: "Determinations in published results", total: 313, done: 187, unit: "satisfied", note: "38 partially · 14 other than · 74 not assessed" }),
      attention([["clock", "Ends within a week", 1], ["clock", "Controls not assessed", 89], ["ring", "Assessments planned", 1]]),
    ),
    table(["Assessment", "Kind", "Status", "Window"], CAMPAIGNS.map(([t, s, k, a, b]) => ({ id: t, cells: [`<a href="${t.includes("Expanded") ? "#campaign" : "#assessments"}" style="color:var(--ink);text-decoration:none">${esc(t)}</a>`, tag(k), pill(s === "active" ? "info" : s === "completed" ? "ok" : "none", s[0].toUpperCase() + s.slice(1)), `<span class="num">${day(a)} – ${day(b)}</span>`] })), 4),
  );
  S.campaign = () => page(
    `<div class="next">${gl("info")}<span>Assessment mode: the band above replaces the top bar while you work inside this assessment.</span><a class="sp" href="#assessments" style="font-weight:500">Leave assessment →</a></div>`,
    header("Evidence for the assessor", "<span>WS-X90 Expanded Control Set Assessment · Sep 14 – Nov 20</span>", `<span class="btn">Export ▾</span><span class="btn ink">Mark ready for assessor</span>`),
    `<div class="card"><div class="t">Evidence readiness <span class="num">368</span></div><div class="stack"><i style="width:${(226 / 368) * 100}%;background:var(--ok)"></i><i style="width:${(88 / 368) * 100}%;background:var(--info)"></i><i style="width:${(54 / 368) * 100}%;background:var(--bad)"></i></div><div class="legend"><span style="--c:var(--ok)">Accepted 226</span><span style="--c:var(--info)">Ready for the assessor 88</span><span style="--c:var(--bad)">Flagged 54</span><span style="--c:var(--ink-4)">Not ready —</span></div><p class="note-p">Today's review states shown as the two-sided flow: the team moves evidence to Ready, only the assessor flags or accepts it.</p></div>`,
    `<div class="tabsx"><span class="on">All <span class="ct">368</span></span><span>Not ready</span><span>Ready <span class="ct">88</span></span><span>Flagged <span class="ct">54</span></span><span>Accepted <span class="ct">226</span></span></div>`,
    table(["Evidence", "Owner", "Assessor's status"], EVIDENCE.slice(0, 5).map(([t, k, o]) => ({ id: t.slice(0, 20), cells: [`<span style="display:inline-block;max-width:520px;overflow:hidden;text-overflow:ellipsis;vertical-align:bottom">${esc(t)}</span>`, who(o), pill("info", "Ready for the assessor")] })), 368, "evidence"),
  );
  S.findings = () => page(
    header("Findings", "", `<span class="btn">Import scan</span><span class="btn ink">Create operational issue</span>`),
    pair(
      completion({ title: "Operational issues closed", total: 53, done: 9, unit: "closed", note: "44 open" }),
      attention([["diamond", "Past their remediation date", 17], ["clock", "Due within two weeks", 3], ["diamond", "Critical", 2], ["diamond", "High", 12]]),
    ),
    `<div class="tabsx"><span class="on">By issue <span class="ct">44</span></span><span>By asset</span><span>Assessment findings <span class="ct">313</span></span><span>Deactivated</span></div>`,
    tools("Search findings", ["Severity", "Status", "Owner", "Remediate by"]),
    table(["Operational issue", "Severity", "Opened", "Remediate by", "Owner"], ISSUES.map(([t, s, o]) => ({ id: t.slice(0, 24), cells: [`<span style="display:inline-block;max-width:460px;overflow:hidden;text-overflow:ellipsis;vertical-align:bottom">${esc(t)}</span>`, sevPill(s), `<span class="num">${day(o)}</span>`, dueCell(dueOf(o, s)), who(null)] })), 44, "issue"),
    `<p class="note-p">Remediate by uses proposed windows (critical 15 days, high 30, moderate 90, low 180), set once in Settings.</p>`,
  );
  S.poam = () => page(
    header("POA&M", "<span>WS-X90 plan of action and milestones</span>", `<span class="btn">Export OSCAL</span><span class="btn ink">Create POA&amp;M item</span>`),
    pair(
      completion({ title: "POA&M items completed", total: 41, done: 7, unit: "completed" }),
      attention([["clock", "In progress", 33], ["ring", "Not started", 1], ["ring", "No owner", "—", true]]),
    ),
    tools("Search POA&M items", ["Status", "Owner", "Planned completion"]),
    table(["POA&M item", "Status", "Answers", "Owner"], POAM.map(([t, s]) => ({ id: t, cells: [esc(t), s === "Completed" ? pill("ok", s) : pill("warn", s), tag(t.replace("Remediate ", "")), who(null)] })), 41),
  );
  S.risks = () => page(
    header("Risks", "", `<span class="btn">Snapshots</span><span class="btn ink">Create risk</span>`),
    pair(
      `<div class="card"><div class="t">Open risks <span class="num">40</span></div><div class="big num">40</div><div class="stack"><i style="width:5%;background:var(--bad)"></i><i style="width:25%;background:#e36f2c"></i><i style="width:45%;background:var(--warn)"></i><i style="width:25%;background:var(--ink-4)"></i></div><div class="legend"><span style="--c:var(--bad)">Critical 2</span><span style="--c:#e36f2c">High 10</span><span style="--c:var(--warn)">Moderate 18</span><span style="--c:var(--ink-4)">Low 10</span></div></div>`,
      attention([["ring", "No owner", 40], ["diamond", "Critical or high", 12], ["clock", "Awaiting acceptance", "—", true]]),
    ),
    tools("Search risks", ["Severity", "Status", "Owner", "ATT&CK technique"]),
    table(["Risk", "Severity", "Likelihood", "Impact", "Owner"], RISKS.map(([t, s, l, i]) => ({ id: t.slice(0, 24), cells: [`<span style="display:inline-block;max-width:460px;overflow:hidden;text-overflow:ellipsis;vertical-align:bottom">${esc(t)}</span>`, sevPill(s), esc(l[0].toUpperCase() + l.slice(1)), esc(i[0].toUpperCase() + i.slice(1)), who(null)] })), 40, "risk"),
  );
  S.inventory = () => page(
    header("Inventory", "<span>SYS-WSX90 authorization boundary</span>", `<span class="btn">Import scan</span><span class="btn ink">Add asset</span>`),
    pair(
      completion({ title: "Assets in the boundary", total: 20, done: 20, unit: "in scope", color: "var(--ink)", note: "scope changes are logged" }),
      attention([["ring", "Hosts from scans with no asset", "—", true], ["ring", "No owner", "—", true]]),
    ),
    tools("Search assets", ["Element", "Owner", "In scope"]),
    table(["Asset", "Name", "Element", "In scope"], ASSETS.map(([a, n]) => ({ id: a, cells: [esc(a), esc(n), tag("SYS-WSX90"), pill("ok", "In scope")] })), 20),
  );
  S.sources = () => page(
    header("Evidence sources", "<span>What feeds this program's evidence, and whether it is current</span>", `<span class="btn ink">Add source</span>`),
    `<div class="tabsx"><span class="on">Connected <span class="ct">1</span></span><span>Errors <span class="ct">0</span></span><span>Directory</span></div>`,
    `<div class="frame"><div class="tablebox"><table><thead><tr><th>Source</th><th>Kind</th><th>Reads</th><th>Last imported</th><th>Status</th></tr></thead><tbody>
      <tr><td class="nm">Mission Computer maintenance image SBOM</td><td>${tag("CycloneDX 1.5")}</td><td class="num">13 components · 1 open CVE</td><td class="num">Oct 8</td><td>${pill("ok", "Imported")}</td></tr>
      <tr><td class="nm">ACAS repository, SYS-WSX90 <span class="ex">Example</span></td><td>${tag(".nessus")}</td><td class="muted">Hosts, findings by plugin</td><td class="muted">—</td><td>${pill("none", "Not set up")}</td></tr>
      <tr><td class="nm">STIG checklists, flightline LRUs <span class="ex">Example</span></td><td>${tag(".ckl / .cklb")}</td><td class="muted">CAT I / II / III open</td><td class="muted">—</td><td>${pill("none", "Not set up")}</td></tr>
    </tbody></table></div></div>`,
    `<div class="card"><div class="t">Add source</div><div class="wiz"><span class="on"><i>1</i>Source type</span><span><i>2</i>System</span><span><i>3</i>Match hosts</span><span><i>4</i>Scope</span><span><i>5</i>Severity threshold</span><span><i>6</i>Review and import</span></div><p class="note-p">An upload wizard rather than a live connection: scans on closed networks arrive as files. Each import says what it read, what it skipped and why, and which controls it informs.</p></div>`,
  );
  S.authorization = () => page(
    header("Authorization", "<span>WS-X90 Sentinel Mission System authorization package · version 2</span>", `<span class="btn">Export OSCAL ▾</span><span class="btn ink">Share with the AO</span>`),
    `<div class="card"><div class="t">Package</div><div class="wiz"><span><i>✓</i>Draft</span><span class="on"><i>2</i>Review</span><span><i>3</i>Published to the AO</span><span><i>4</i>Decision</span></div></div>`,
    `<div class="grid2"><div class="card"><div class="t">What the package holds</div><div class="rows">
      <div class="row">${gl("clock")}<span>System security plan · SSP 3</span><b class="muted" style="font-size:13px;font-weight:400">Draft</b></div>
      <div class="row">${gl("check")}<span>Security assessment report · 313 determinations</span><b class="muted" style="font-size:13px;font-weight:400">Published results</b></div>
      <div class="row">${gl("check")}<span>POA&amp;M · 41 items</span><b class="muted" style="font-size:13px;font-weight:400">7 completed</b></div>
      <div class="row">${gl("ring")}<span>Risk snapshot for the decision</span><b class="muted" style="font-size:13px;font-weight:400">Taken at publish</b></div></div></div>
      <div class="card"><div class="t">Who can open it</div><div class="rows">
      <div class="row">${who("R. Calloway")}<b class="muted" style="font-size:13px;font-weight:400">Authorizing official</b></div>
      <div class="row">${who("D. Okafor")}<b class="muted" style="font-size:13px;font-weight:400">Lead assessor</b></div>
      <div class="row">${who("Joel Barrantes")}<b class="muted" style="font-size:13px;font-weight:400">ISSM</b></div></div>
      <p class="note-p">A private room: access expires, every open is logged, files are watermarked.</p></div></div>`,
  );
  S.components = () => page(
    header("Components", "<span>Assessed once, used everywhere</span>", `<a class="btn" href="#components">Component sets</a><span class="btn ink">Create component</span>`),
    pair(
      completion({ title: "Components assessed", total: 2, done: 2, unit: "with a published assessment", note: "across 2 component sets shown" }),
      attention([["clock", "Controls to review", 2], ["info", "Offers waiting", 1], ["diamond", "Open CVEs in use", 1], ["clock", "Consumers behind", 4]]),
    ),
    table(["Component", "Component set", "Version", "Owner", "Controls satisfied", "Offers", "Open CVEs"], [
      { id: "mc", cells: ["Mission Computer", tag("X800 Missile"), "2 " + pill("ok", "Published"), who("Priya Raghavan"), `<span class="num">42 of 61</span> · <span style="color:var(--warn)">2 to review</span>`, `<span class="num">1</span>`, `<span class="num" style="color:var(--bad)">1</span>`] },
      { id: "alc", cells: ["Audit Log Collector", tag("G25 launch control"), "1 " + pill("ok", "Published"), who("Marcus Ryde"), `<span class="num">13 of 14</span>`, "—", "—"] },
    ], 2, "component"),
  );
  S.study = () => `<div class="main" style="max-width:none;padding:0">${document.getElementById("study-src").innerHTML}</div>`;

  // ——— Panels ———
  const P = {};
  P.control = (id) => {
    const c = CONTROLS.find((r) => r[0].startsWith(id + " ")) || CONTROLS[5];
    const [n, k, s, e, o, r] = c;
    const noEv = k === "none";
    return { label: "Control preview", body: `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><h4>${esc(n)}</h4>${noEv ? '<span class="btn sm ink">Add evidence</span>' : '<span class="btn sm">Edit</span>'}</div>
      <dl class="kv"><dt>Status</dt><dd>${pill(k, s)}</dd><dt>Objectives</dt><dd class="num">${o} of ${o} mapped · ${e} with evidence</dd><dt>Requirement</dt><dd>${tag(r)}</dd><dt>Owner</dt><dd>${who(null)}</dd></dl>
      ${noEv ? `<div class="next">${gl("ring")}<span>${esc(r)} cites no evidence</span><span class="sp" style="color:var(--brand-text);font-weight:500">Add evidence →</span></div>` : ""}
      <div class="sect"><div class="sh">Requirements<span class="num">1</span></div><div class="sb"><span><b style="color:var(--ink);font-weight:500">${esc(r)}</b> · maps ${o} of ${o}</span></div></div>
      <div class="sect"><div class="sh">Evidence<span class="num">${e ? 1 : 0}</span></div><div class="sb">${e ? "Cited by its requirement." : "Nothing cited yet."}</div></div>
      <div class="sect"><div class="sh">Findings<span class="num">${k === "bad" ? 1 : 0}</span></div><div class="sb">${k === "bad" ? "Other than satisfied in published results." : "No finding recorded."}</div></div>` };
  };
  P.evidence = () => ({ label: "Evidence preview", body: `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><h4>Time source comparison test report, LRU-005</h4><span class="btn sm ink">Review</span></div>
      <dl class="kv"><dt>Review</dt><dd>${pill("warn", "Pending review")}</dd><dt>Kind</dt><dd>${tag("Test record")}</dd><dt>Owner</dt><dd>${who("Ingrid Solberg")}</dd><dt>Collected</dt><dd>Nov 15</dd><dt>Renew by</dt><dd><span class="who">${gl("ring")}Not set</span></dd></dl>
      <div class="sect"><div class="sh">Versions<span class="num">1</span></div><div class="sb">Version 1 · collected Nov 15 · pending review</div></div>
      <div class="sect"><div class="sh">Cited by</div><div class="sb">The requirement it supports, and the controls they map.</div></div>
      <p class="note-p">Get started → Draft → Submit for review → Accepted, with a renewal date and reminders.</p>` });
  P.issue = (id) => {
    const r = ISSUES.find((x) => x[0].startsWith(id)) || ISSUES[0];
    return { label: "Operational issue preview", body: `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><h4>${esc(r[0])}</h4><span class="btn sm ink">Create POA&amp;M item</span></div>
      <dl class="kv"><dt>Severity</dt><dd>${sevPill(r[1])}</dd><dt>Opened</dt><dd>${day(r[2])}</dd><dt>Remediate by</dt><dd>${dueCell(dueOf(r[2], r[1]))}</dd><dt>Owner</dt><dd>${who(null)}</dd></dl>
      <div class="sect"><div class="sh">Why it fails</div><div class="sb">The rule, the cause in one sentence, and each failing item as a link.</div></div>
      <div class="sect"><div class="sh">Not applicable?</div><div class="sb">Deactivate with a reason, optional evidence and an end date that switches it back on.</div></div>` };
  };
  P.risk = (id) => {
    const r = RISKS.find((x) => x[0].startsWith(id)) || RISKS[0];
    return { label: "Risk preview", body: `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><h4>${esc(r[0])}</h4><span class="btn sm ink">Request acceptance</span></div>
      <dl class="kv"><dt>Severity</dt><dd>${sevPill(r[1])}</dd><dt>Likelihood</dt><dd>${esc(r[2])}</dd><dt>Impact</dt><dd>${esc(r[3])}</dd><dt>Owner</dt><dd>${who(null)}</dd></dl>
      <div class="sect"><div class="sh">Acceptance, in order</div><div class="sb"><div class="chain">
        <div class="step">${gl("ring")}<span>ISSO · Priya Raghavan</span><span class="muted">Not started</span></div>
        <div class="step">${gl("ring")}<span>ISSM · Joel Barrantes</span><span class="muted">Not started</span></div>
        <div class="step">${gl("ring")}<span>Authorizing official · R. Calloway</span><span class="muted">Last step</span></div></div></div></div>
      <p class="note-p">On acceptance a snapshot of the risk is locked: what the AO saw on the day of the decision.</p>` };
  };
  P.component = (id) => ({ label: "Component preview", body: id === "alc" ? `<h4>Audit Log Collector</h4><dl class="kv"><dt>Version</dt><dd>1 · ${pill("ok", "Published")}</dd><dt>Controls</dt><dd class="num">13 of 14 satisfied</dd><dt>Owner</dt><dd>${who("Marcus Ryde")}</dd></dl><div class="sect"><div class="sh">Used by</div><div class="sb">WS-X90 inherits AU-7 from it on LRU-018.</div></div>` : `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:start"><h4>Mission Computer</h4><span class="btn sm ink">Review offer</span></div>
      <dl class="kv"><dt>Version</dt><dd>2 · ${pill("ok", "Published")} Nov 12</dd><dt>Controls</dt><dd class="num">42 of 61 satisfied · 2 to review · 52 carried</dd><dt>Owner</dt><dd>${who("Priya Raghavan")}</dd></dl>
      <div class="next">${gl("info")}<span>CVE-2024-6387 offered from WS-X90 by Ingrid Solberg</span><span class="sp" style="color:var(--brand-text);font-weight:500">Accept or return →</span></div>
      <div class="sect"><div class="sh">Where used<span class="num">4</span></div><div class="sb">1 product · 3 programs · 4 consumers behind version 2</div></div>` });

  // ——— Router ———
  const shell = document.getElementById("shell"), panel = document.getElementById("panel"), main = document.getElementById("main"), proto = document.getElementById("proto");
  let opener = null;
  function closePanel() { panel.hidden = true; panel.innerHTML = ""; if (opener) { opener.focus(); opener = null; } }
  function openPanel(kind, id, from) {
    const p = P[kind] && P[kind](id); if (!p) return;
    opener = from;
    panel.innerHTML = `<div class="bar-top"><span>${esc(p.label)}</span><span class="sp"></span><button type="button" aria-label="Open the full record">↗</button><button type="button" id="closePanel" aria-label="Close ${esc(p.label)}">✕</button></div><div class="pbody">${p.body}</div>`;
    panel.hidden = false;
    document.getElementById("closePanel").focus();
  }
  const modal = document.getElementById("modal");
  let modalOpener = null;
  function closeModal() { modal.hidden = true; modal.innerHTML = ""; if (modalOpener) { modalOpener.focus(); modalOpener = null; } }
  function openModal(key, id, from) {
    const m = M[key] && M[key](id); if (!m) return;
    modalOpener = from;
    modal.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlgTitle"><div class="dlg-h"><h4 id="dlgTitle">${esc(m.title)}</h4><button type="button" class="ib" data-close-modal aria-label="Close">✕</button></div><div class="dlg-b">${m.body}</div><div class="dlg-f">${m.footer || '<button type="button" class="btn" data-close-modal>Cancel</button>'}</div></div>`;
    modal.hidden = false;
    modal.querySelector("[data-close-modal]").focus();
  }
  const label = (key) => { for (const [, items] of NAV) for (const [k, l] of items) if (k === key) return l; return key; };
  function route() {
    const r = (location.hash || "#home").slice(1);
    const key = S[r] ? r : NAV.some(([, items]) => items.some(([k]) => k === r)) ? r : "home";
    closePanel(); closeModal();
    proto.classList.toggle("moded", MODED.has(key));
    shell.classList.remove("navopen");
    drawNav(key);
    // v2 (N): an area's pages are in its menu beside the rail; no section tab strip is drawn over the page.
    main.innerHTML = S[key] ? S[key]() : page(header(label(key), "<span>Not drawn yet</span>", ""), `<div class="card"><p class="note-p">This screen is in the plan and not drawn in this version.</p></div>`);
    main.scrollTop = 0;
  }
  function trigger(e) {
    const m = e.target.closest("[data-modal]");
    if (m) { e.preventDefault(); openModal(m.dataset.modal, m.dataset.id, m); return true; }
    const t = e.target.closest("[data-panel]");
    if (t && t.dataset.panel && !e.target.closest("a[href]")) { openPanel(t.dataset.panel, t.dataset.id, t); return true; }
    const tab = e.target.closest("[data-go]");
    if (tab) { location.hash = tab.dataset.go; return true; }
    return false;
  }
  main.addEventListener("click", trigger);
  panel.addEventListener("click", (e) => { if (e.target.closest("#closePanel")) closePanel(); else trigger(e); });
  main.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("tr[data-panel], [data-modal]:not(button), [data-go]:not(button)")) { e.preventDefault(); trigger(e); }
  });
  modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close-modal]")) closeModal(); else trigger(e); });
  document.getElementById("nav").addEventListener("click", (e) => {
    const g = e.target.closest("[data-group]"); if (!g) return;
    const name = g.dataset.group; CLOSED.has(name) ? CLOSED.delete(name) : CLOSED.add(name);
    drawNav((location.hash || "#home").slice(1));
    const again = document.querySelector(`[data-group="${CSS.escape(name)}"]`); if (again) again.focus();
  });
  // The program switcher (at the top of the program's menu, drawn again with it), the program's menu on a phone, and the phone's More.
  const menuBtn = document.getElementById("menuBtn");
  const swEls = () => [document.getElementById("swBtn"), document.getElementById("swMenu")];
  const swItems = () => { const m = swEls()[1]; return m ? [...m.querySelectorAll("a")] : []; };
  const swClose = (focus) => { const [b, m] = swEls(); if (!m || m.hidden) return; m.hidden = true; b.setAttribute("aria-expanded", "false"); if (focus) b.focus(); };
  const moreEls = () => [document.getElementById("moreBtn"), document.getElementById("moreMenu")];
  const moreClose = (focus) => { const [b, m] = moreEls(); if (!m || m.hidden) return; m.hidden = true; b.setAttribute("aria-expanded", "false"); if (focus) b.focus(); };
  document.addEventListener("click", (e) => {
    const t = e.target; if (!t || !t.closest) return;
    const sb = t.closest("#swBtn");
    if (sb) { const m = swEls()[1]; const open = m.hidden; m.hidden = !open; sb.setAttribute("aria-expanded", String(open)); if (open && swItems()[0]) swItems()[0].focus(); return; }
    if (t.closest("#swMenu a") || !t.closest(".sw-wrap")) swClose(false);
    const mb = t.closest("#moreBtn");
    if (mb) { const m = moreEls()[1]; const open = m.hidden; m.hidden = !open; mb.setAttribute("aria-expanded", String(open)); if (open) { const a = m.querySelector("a"); if (a) a.focus(); } return; }
    if (t.closest("#moreMenu a") || !t.closest("#bottom")) moreClose(false);
  });
  document.addEventListener("keydown", (e) => {
    const t = e.target; if (!t || !t.closest) return;
    if (t.closest("#swBtn") && e.key === "ArrowDown") { const m = swEls()[1]; if (m && m.hidden) { e.preventDefault(); t.closest("#swBtn").click(); } return; }
    if (t.closest("#moreMenu") && e.key === "Escape") { e.preventDefault(); moreClose(true); return; }
    if (!t.closest("#swMenu")) return;
    const items = swItems(), i = items.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); swClose(true); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); items[(i + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length].focus(); }
    else if (e.key === "Home" || e.key === "End") { e.preventDefault(); items[e.key === "Home" ? 0 : items.length - 1].focus(); }
    else if (e.key === "Tab") swClose(false);
  });
  window.addEventListener("hashchange", () => { swClose(false); moreClose(false); });
  menuBtn.addEventListener("click", () => { menuBtn.setAttribute("aria-expanded", String(shell.classList.toggle("navopen"))); });
  window.addEventListener("hashchange", () => menuBtn.setAttribute("aria-expanded", "false"));
  // Every page the navigation reaches, rail pages and the program's: [route, label].
  const navItems = () => [...RAIL.flatMap(([k, l, , pages]) => pages || [[k, l]]), ...PROGRAM.flatMap(([, items]) => items.map(([k, l]) => [k, l]))];
  window.PA = { S, P, M, MODED, ROUTE_NAV, navKey, navItems, area, areaCount, icons: ICONS, data: { TODAY, PROGRAMS, OTHER, CONTROLS, REQS, EVIDENCE, SLA, ISSUES, RISKS, POAM, ASSETS, CAMPAIGNS },
    h: { esc, fmt, pct, day, gl, pill, tag, who, bar, header, completion, attention, tools, views, table, page, pair, lane, sevPill, dueOf, dueCell, icon },
    start() { window.addEventListener("hashchange", route); route(); } };
})();
