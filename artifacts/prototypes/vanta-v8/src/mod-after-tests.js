// After screens for the tests group (a-tests-): Checks and a check's page, Controls, SI-2, Frameworks & overlays,
// Assessments and the Expanded Control Set Assessment, each drawn from BA/dev/tests.final.json with the after kit
// (window.PA.AK). Values are WS-X90's, copied from mod-compliance.js and core.js, or read from the local database on
// 17 Nov 2026: the plan's scheduled assessment tasks, the CVE-2024-6387 issue's owner, evidence versions and their
// reviews, the increment 2 findings and the evidence they cite, control statuses. Anything else carries Example.
(function () {
  const { S, P, M, MODED, ROUTE_NAV, data, h } = window.PA;
  const AK = window.PA.AK;
  const { esc, fmt, pct, gl, pill, tag, bar } = h;
  const EX = '<span class="ex">Example</span>';
  const ME = "Ingrid Solberg";
  const md = AK.md, days = AK.days;

  // ——— Small pieces ———
  const co = (n) => AK.co(n).replace('class="ak-co"', 'class="ak-co a-tests-co"');
  const num = (n) => `<span class="num">${typeof n === "number" ? fmt(n) : esc(n)}</span>`;
  const of = (a, b) => `<span class="num">${fmt(a)} of ${fmt(b)}</span>`;
  const mu = (t) => `<span class="a-tests-mu">${t}</span>`;
  const tr = (s, w) => `<span class="a-tests-tr" style="max-width:${w}px" title="${esc(s)}">${esc(s)}</span>`;
  const go = (r) => `data-go="${esc(r)}" role="link" tabindex="0"`;
  const btn = (label, attrs = "", ink = false) => `<span class="btn sm${ink ? " ink" : ""}" role="button" tabindex="0" ${attrs}>${label}</span>`;
  const ring = (t) => `<span class="who">${gl("ring")}${esc(t)}</span>`;
  const sr = (t) => `<span class="a-tests-sr">${esc(t)}</span>`;
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const plain = (t) => `<p class="note-p">${t}</p>`;
  const dfull = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const nav = (...routes) => routes.forEach((r) => { ROUTE_NAV[r] = "before-after"; });
  // v2 (C1): the assurance chain (mod-zzzz-v2-1chain.js) moves what a reader walks; every screen here reads it at draw time.
  const CH = () => window.PA.v2 && window.PA.v2.chain;
  const ctlPage = (code) => (CH() ? CH().ctlRoute(code) : code === "SI-2" ? "after-control-record" : "controls");
  const ST = {
    satisfied: ["ok", "Satisfied"], partially_satisfied: ["part", "Partially satisfied"], other_than_satisfied: ["bad", "Other than satisfied"],
    not_assessed: ["info", "Not assessed"], no_evidence: ["none", "No evidence"], no_requirement: ["none", "No requirement"], out: ["none", "Not in WS-X90's baseline"],
  };
  const stPill = (s) => pill(ST[s][0], ST[s][1]);
  // A due date: past is red with its age (the kit's), soon is amber, a check that passes shows the day plainly.
  const dueCell = (iso, state) => {
    if (!iso) return AK.due(null);
    if (state === "ok" || state === "done") return AK.due(iso, { done: true, prefix: false });
    if (state === "soon") return `<span class="ak-due warn" title="In ${days(iso)} days">${AK.i("calendar")}${md(iso)}</span>`;
    return AK.due(iso, { prefix: false });
  };
  const more = (label, items, opt = {}) => `<details class="a-tests-more${opt.cls ? " " + opt.cls : ""}"><summary class="btn${opt.sm ? " sm" : ""}" aria-label="${esc(label)}" title="${esc(label)}">${opt.text ? `${esc(opt.text)} ${AK.i("down")}` : AK.i("dots")}</summary><div class="a-tests-menu" role="menu">${items
    .map(([l, a, kind]) => (kind === "help" ? `<p class="a-tests-mhelp">${l}</p>` : `<span role="menuitem" tabindex="0" class="a-tests-mi${kind ? " " + kind : ""}" ${a || ""}>${l}</span>`)).join("")}</div></details>`;
  const ownerPick = (name, what) => `<span class="a-tests-pick" role="button" tabindex="0" data-modal="a-tests-owner" data-id="${esc(what)}" title="Change owner">${AK.owner(name)}</span>`;
  const sectH = (title, count, right = "", c = "") => `<div class="a-tests-sech"><h3>${esc(title)}${count != null ? `<span class="ct num">${esc(count)}</span>` : ""}${c}</h3>${right ? `<span class="a-tests-push">${right}</span>` : ""}</div>`;
  const stackBar = (parts) => { const t = parts.reduce((a, p) => a + p[1], 0) || 1; return `<div class="stack">${parts.filter((p) => p[1]).map(([, n, c]) => `<i style="width:${(n / t) * 100}%;background:${c}"></i>`).join("")}</div><div class="legend">${parts.map(([l, n, c]) => `<span style="--c:${c}">${esc(l)} <b class="num">${fmt(n)}</b></span>`).join("")}</div>`; };
  const avs = (names) => `<span class="a-tests-avs">${names.map((n) => AK.avatar(n, 22)).join("")}</span>`;
  const ringPct = (p) => `<span class="ak-prog"><span class="ak-donut" style="--p:${p}"></span><span class="num">${p}%</span></span>`;
  // v2: a Needs attention card with the total it means (core's attention() sums every row).
  const attCard = (title, total, rows) => `<div class="card v2l-att"><div class="t">${esc(title)} <span class="num">${fmt(total)}</span></div><div class="rows">${rows.map(([g, l, n]) => `<div class="row">${gl(g)}<span>${esc(l)}</span><b class="num">${fmt(n)}</b></div>`).join("")}</div></div>`;

  // ——— State kept while the prototype is open ———
  const SEL = {}, CAT = {}, DEACT = {};
  const READY = {}; // v2 (C1): requests the team set Ready again
  let CQV = "all"; // v2 (C1): the campaign's chosen quick view (All, Ready, Flagged, Accepted)
  let CTLQV = "all"; // v2 (F): the Controls register's chosen quick view; they were words that filtered nothing
  const two = (n) => String(n).padStart(2, "0");
  let INC = "2";
  let lastPanel = null;
  const sel = (key, d = []) => SEL[key] || (SEL[key] = new Set(d));
  const redraw = (focus) => {
    const r = (location.hash || "#home").slice(1);
    const main = document.getElementById("main"), panel = document.getElementById("panel");
    if (S[r]) { const top = main.scrollTop; main.innerHTML = S[r](); main.scrollTop = top; }
    const lab = panel && panel.querySelector(".bar-top span");
    if (panel && !panel.hidden && lastPanel && lab && lab.textContent === lastPanel.label && P[lastPanel.kind]) panel.querySelector(".pbody").innerHTML = P[lastPanel.kind](lastPanel.id).body;
    const el = focus && document.querySelector(focus);
    if (el) el.focus();
  };
  const stop = (e) => { e.stopPropagation(); e.preventDefault(); };
  const act = (e) => {
    const t = e.target;
    if (!t || !t.closest) return false;
    const c = t.closest("[data-atsel]");
    if (c) {
      stop(e);
      const key = c.dataset.atsel, id = c.dataset.atid, s = sel(key);
      if (id === "*") { const ids = c.dataset.atall.split(","); const all = ids.every((i) => s.has(i)); ids.forEach((i) => (all ? s.delete(i) : s.add(i))); }
      else if (s.has(id)) s.delete(id); else s.add(id);
      redraw(`[data-atsel="${key}"][data-atid="${CSS.escape(id)}"]`);
      return true;
    }
    const d = t.closest("[data-atdesel]");
    if (d) { stop(e); SEL[d.dataset.atdesel] = new Set(); redraw(`[data-atsel="${d.dataset.atdesel}"][data-atid="*"]`); return true; }
    // v2 (C1): the campaign's quick views filter its requests (PA.v2.go("campaign", { filter: { qv: "Ready" } }) clicks one).
    const cq = t.closest("[data-atqv]");
    if (cq) { stop(e); CQV = cq.dataset.atqv; redraw(`[data-atqv="${CQV}"]`); return true; }
    const ccq = t.closest("[data-atcqv]");
    if (ccq) { stop(e); CTLQV = ccq.dataset.atcqv; redraw(`[data-atcqv="${CTLQV}"]`); return true; }
    const rsp = t.closest("[data-atresp]");
    if (rsp) { stop(e); RESPQ = rsp.dataset.atresp; redraw(".a-tests-respf summary"); return true; }
    const k = t.closest("[data-atcat]");
    if (k) { stop(e); const [key, v] = k.dataset.atcat.split("|"); CAT[key] = v; redraw(`[data-atcat="${CSS.escape(k.dataset.atcat)}"]`); return true; }
    const i = t.closest("[data-atinc]");
    if (i) { stop(e); INC = i.dataset.atinc; redraw(`[data-atinc="${INC}"]`); return true; }
    const m = t.closest("[data-atmenu]");
    if (m) { stop(e); const it = m.closest(".a-tests-item"); if (it) m.setAttribute("aria-expanded", String(it.classList.toggle("open"))); return true; }
    const x = t.closest("[data-atdeact]");
    if (x) { x.dataset.atdeact.split(",").forEach((k) => { DEACT[k] = true; }); if (SEL.idx) SEL.idx = new Set(); setTimeout(() => redraw(".ak-title"), 0); return false; }
    const y = t.closest("[data-atreact]");
    if (y) { stop(e); delete DEACT[y.dataset.atreact]; redraw(".ak-title"); return true; }
    // v2 (C1) [B9]: Run all now runs the active checks again and says what they found.
    const ra = t.closest("[data-atrunall]");
    if (ra && window.PA.v2) {
      stop(e);
      const at = new Date(); window.PA.v2.set("checks.ran", `Just now · ${two(at.getHours())}:${two(at.getMinutes())}, run by you`);
      const active = CHECKS.filter((x) => !DEACT[x.id]), need = active.filter((x) => x.state !== "ok").length;
      redraw('[data-atrunall]');
      window.PA.v2.toast(`${active.length} checks ran: ${need} still need attention`);
      return true;
    }
    // v2 (C1) [B1]: Set Ready sends the chosen requests back to the assessor as Ready.
    const rd = t.closest("[data-atready]");
    if (rd) {
      stop(e);
      const ids = rd.dataset.atready.split(",").filter(Boolean);
      ids.forEach((id) => { READY[id] = true; });
      if (SEL.req) SEL.req = new Set();
      const x = document.querySelector("#modal .dlg-h [data-close-modal]"); if (x) x.click();
      setTimeout(() => { redraw(".ak-title"); if (window.PA.v2) window.PA.v2.toast(`${ids.length} request${ids.length === 1 ? "" : "s"} back with the assessor as Ready`); }, 0);
      return true;
    }
    const dd = t.closest(".a-tests-more");
    if (dd) { const own = t.closest("[data-modal],[data-go],[data-panel]"); if (!own || !dd.contains(own)) e.stopPropagation(); }
    return false;
  };
  document.addEventListener("click", act, true);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target;
    if (!t || !t.matches) return;
    if (t.matches("[data-atsel], [data-atdesel], [data-atreact], [data-atqv], [data-atcqv], [data-atresp], [data-atrunall]")) { act(e); return; }
    if (t.matches("#panel [data-panel]:not(button), #panel [data-go]:not(button), #panel [data-modal]:not(button)")) { e.preventDefault(); t.click(); }
  }, true);

  // ——— Tables, checkboxes, toolbars and tabs ———
  const cb = (key, id, on, label) => `<span class="a-tests-cb" role="checkbox" tabindex="0" aria-checked="${on}" aria-label="${esc(label)}" data-atsel="${esc(key)}" data-atid="${esc(id)}">${AK.check(on)}</span>`;
  const cbAll = (key, ids, label) => { const s = sel(key); const all = ids.length > 0 && ids.every((i) => s.has(i)); return `<span class="a-tests-cb" role="checkbox" tabindex="0" aria-checked="${all ? "true" : s.size ? "mixed" : "false"}" aria-label="${esc(label)}" data-atsel="${esc(key)}" data-atid="*" data-atall="${esc(ids.join(","))}">${AK.check(all)}</span>`; };
  function tbl({ cols, rows, total, panel = "", nm = 1, cls = "", pager = true, empty = "Nothing matches." }) {
    const body = rows.length ? rows.map((r) => {
      const p = r.panel !== undefined ? r.panel : panel;
      const attrs = r.go ? ` tabindex="0" data-go="${esc(r.go)}"` : p ? ` tabindex="0" data-panel="${esc(p)}" data-id="${esc(r.id || "")}"` : ' class="a-tests-still"';
      return `<tr${r.sel ? ' class="sel"' : ""}${attrs}>${r.cells.map((c, i) => `<td${i === nm ? ' class="nm"' : ""}>${c}</td>`).join("")}</tr>`;
    }).join("") : `<tr class="a-tests-still"><td colspan="${cols.length}">${ring(empty)}</td></tr>`;
    return `<div class="frame a-tests-tight ${cls}"><div class="tablebox"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>${pager ? `<div class="pager"><span class="num">${rows.length ? `1–${rows.length} of ${fmt(total)}` : `0 of ${fmt(total)}`}</span><span>25 per page · ‹ ›</span></div>` : ""}</div>`;
  }
  const filters = (search, list, extra = "") => `<div class="tools"><span class="in">${esc(search)}</span>${list.map((f) => (Array.isArray(f) ? `<span class="flt">${f[0]} ⌄</span>${f[1]}` : `<span class="flt">${f} ⌄</span>`)).join("")}<span class="flt sub">+ Add filter</span><span class="end">${extra}<span class="ib" title="Columns">▥</span><span class="ib" title="Settings">⚙</span></span></div>`;
  function bulkBar(key, search, n, actions, { c = "", attrs = {} } = {}) {
    let html = AK.bulk({ count: n, actions, co: c });
    html = html.replace('<span class="ak-link">Deselect</span>', `<span class="ak-link" role="button" tabindex="0" data-atdesel="${esc(key)}">Deselect</span>`);
    for (const [label, a] of Object.entries(attrs)) html = html.replace(`<span class="btn sm">${esc(label)}</span>`, `<span class="btn sm" role="button" tabindex="0" ${a}>${esc(label)}</span>`);
    return `<div class="tools a-tests-selbar"><span class="in">${esc(search)}</span>${html}</div>`;
  }
  const tabs = (list, cos = {}, end = "", label) => {
    let html = AK.tabs(list, label);
    for (const [lab, n] of Object.entries(cos)) html = html.replace(new RegExp(`(>${reEsc(esc(lab))}(?:<span class="ct num">[^<]*</span>)?)(</span>)`), `$1${co(n)}$2`);
    return end ? html.replace(/<\/div>$/, `${end}</div>`) : html;
  };
  // Line tabs inside a panel re-open the same preview on another tab, so the reader never leaves the list.
  const ptabs = (kind, base, list, cur, cos = {}) => tabs(list.map(([k, l, n]) => [l, n, `@p:${k}`, k === cur]), cos, "", "Record sections")
    .replace(/data-go="@p:([^"]+)"/g, (m, k) => `data-panel="${kind}" data-id="${esc(base + "|" + k)}"`);
  const factsCo = (html, c) => (c ? html.replace("</dl>", `<div class="a-tests-fco">${c}</div></dl>`) : html);

  // ════════════════ Checks ════════════════
  // WS-X90's seven checks (mod-compliance.js). Owners and due dates come from the plan's scheduled assessment tasks
  // (scan, STIG scan, reviews) and from the CVE-2024-6387 operational issue, owned by Ingrid Solberg.
  const CT = { "RA-5": ["Vulnerability Monitoring and Scanning", "satisfied"], "SI-2": ["Flaw Remediation", "not_assessed"], "CM-6": ["Configuration Settings", "satisfied"], "CA-7": ["Continuous Monitoring", "satisfied"], "CA-5": ["Plan of Action and Milestones", "satisfied"], "AC-2": ["Account Management", "satisfied"], "AC-6": ["Least Privilege", "satisfied"] };
  const CHECKS = [
    { id: "scan", name: "Vulnerability scans run at RA-5's frequency", cat: "Vulnerability", ctl: ["RA-5"], owner: "Joel Barrantes", due: "2026-11-15", state: "overdue", fail: 2,
      desc: "Reads RA-5's scan frequency and the scheduled scans of the Continuous monitoring FY2027 plan.", line: "The November scan was due Nov 15.",
      inputs: [["RA-05_ODP[01]", ring("Not set")], ["Plan", "Continuous monitoring FY2027: a monthly mission network scan"], ["Last done", "October scan, due Oct 11 · Joel Barrantes"], ["Now", "November scan, in progress, due Nov 15"]],
      items: [{ t: "RA-5's scan frequency is not set in WS-X90's baseline", tag: "Parameter" }, { t: "Monthly vulnerability scan — mission network: in progress", due: "2026-11-15" }],
      fix: ["Set RA-05_ODP[01] on the program tailoring, for example every 30 days and after each software load.", "Finish the November scan, or move its due date with a reason.", "Import its .nessus results under Evidence sources, so the check reads hosts and plugins too."],
      hist: [["Monthly vulnerability scan — mission network (November)", "2026-11-04", "2026-11-15", "in_progress", "Joel Barrantes"], ["Monthly vulnerability scan — mission network (October)", "2026-10-04", "2026-10-11", "completed", "Joel Barrantes"]],
      comments: [{ who: "Joel Barrantes", when: "Nov 16, 4:10 PM", text: `The November scan waits on the Block 1.1 software load. ${AK.mention("Priya Raghavan")}, can we move its due date to Nov 20? ${EX}` }] },
    { id: "iava", name: "IAVA and IAVB patches inside their windows", ex: true, cat: "Vulnerability", ctl: ["SI-2"], owner: null, due: "2026-11-11", state: "overdue", fail: 3,
      desc: "Reads the IAVM notices against SI-2's patch window and the ACAS repository.", line: "IAVA 2026-A-0117 passed its 21-day window on Nov 11.",
      inputs: [["SI-02_ODP", ring("Not set")], ["Windows used", "IAVA 21 days, IAVB 30 days (DoD default until SI-2 is set)"], ["Notices tracked", `9 ${EX}`], ["Source", `ACAS repository, SYS-WSX90 ${EX}`]],
      items: [{ t: `IAVA 2026-A-0117, OpenSSH on the Mission Computer image ${EX}`, due: "2026-11-11" }, { t: `IAVA 2026-A-0124, Linux kernel 6.6 ${EX}`, due: "2026-11-21" }, { t: `IAVB 2026-B-0052, U-Boot ${EX}`, due: "2026-11-28" }],
      fix: ["Set SI-02_ODP so the window is the program's, not the default.", "Patch or record a POA&M item with milestones for each notice past its window.", "Acknowledge each notice in its IAVM compliance record."], hist: [], comments: [] },
    { id: "stig", name: "No open STIG CAT I; CAT II inside 30 days", ex: true, cat: "Vulnerability", ctl: ["CM-6"], owner: "Joel Barrantes", due: "2026-11-11", state: "overdue", fail: 2,
      desc: "Reads the STIG checklists (.ckl) and the plan's monthly STIG compliance scans.", line: "The November STIG scan was due Nov 11; it is blocked since Nov 1.",
      inputs: [["Scan", "Monthly STIG compliance scan: blocked since Nov 1, due Nov 11"], ["Checklists", `14 of 20 LRUs ${EX}`], ["Open", `CAT I 2 · CAT II 17 · CAT III 41 ${EX}`]],
      items: [{ t: `CAT I · Maintenance Laptop: SSH permits password authentication ${EX}`, tag: "Open" }, { t: `CAT I · Provisioning Workstation: USB mass storage not disabled ${EX}`, tag: "Open" }],
      fix: ["Unblock the November STIG scan (it is blocked since Nov 1).", "Close both CAT I findings or record a POA&M item for each; CAT I cannot wait.", "Import the .ckl or .cklb files under Evidence sources."],
      hist: [["Monthly STIG compliance scan (November)", "2026-11-01", "2026-11-11", "blocked", "Joel Barrantes"], ["Monthly STIG compliance scan (October)", "2026-10-06", "2026-10-13", "completed", "Joel Barrantes"]], comments: [] },
    { id: "sbom", name: "No known-affected component in use", cat: "Vulnerability", ctl: ["RA-5", "SI-2"], owner: "Ingrid Solberg", due: "2026-11-09", state: "overdue", fail: 1,
      desc: "Reads the SBOMs of the components WS-X90 runs against CVE records and their VEX states.", line: "CVE-2024-6387's remediation was due Nov 9.",
      inputs: [["SBOM", "Mission Computer maintenance image, CycloneDX 1.5, Oct 8"], ["Components", "13 · 1 affected"], ["Fixed in", "Mission Computer version 2 (openssh-server 9.8p1), published Nov 12"], ["WS-X90 issue", "Open, high, opened Oct 10 · Ingrid Solberg"]],
      items: [{ t: "CVE-2024-6387 regreSSHion · openssh-server 9.6p1 · CVSS 8.1", due: "2026-11-09" }],
      fix: ["Take Mission Computer version 2 on the Mission Computer element (it carries openssh-server 9.8p1).", "Attach the new SBOM: the VEX state for 9.8p1 is Fixed.", "Close the operational issue with the update record as its evidence."],
      hist: [["CVE-2024-6387 in the OpenSSH server (regreSSHion)", "2026-10-10", "2026-11-09", "open", "Ingrid Solberg"]], comments: [] },
    { id: "expiring", name: "Evidence renewed before it expires", cat: "Evidence", ctl: ["CA-7"], owner: null, ownerNote: "51 of its 54 versions have no owner", due: "2027-02-01", state: "soon", fail: 54,
      desc: "Reads each evidence version's expiry date, 90 days ahead.", line: "The first 5 versions expire Feb 1, 2027.",
      inputs: [["Window", "Expiring within 90 days (by Feb 15)"], ["Expiring", "54 of 368 versions"], ["First", "Feb 1, 5 versions"], ["No owner", "51 of the 54"]],
      items: [{ t: "Evidence for REQ-001, dataset · accepted", due: "2027-02-01" }, { t: "Evidence for REQ-113, dataset · accepted", due: "2027-02-01" }, { t: "Evidence for REQ-002, test record · Wes Duarte", due: "2027-02-02" }, { t: "Evidence for REQ-058, test record · Victor Amsel", due: "2027-02-02" }],
      fix: ["Give each expiring version an owner, so a reminder reaches someone.", "Collect a new version before the date; the old one stays as history.", "Where a source feeds it, renew from the source instead of by hand."], hist: [], comments: [] },
    { id: "poam-review", name: "POA&M reviewed every month", cat: "Monitoring", ctl: ["CA-5"], owner: "Priya Raghavan", due: "2026-11-21", state: "ok", fail: 0,
      desc: "Reads the monthly POA&M review the Continuous monitoring FY2027 plan schedules.", line: "The October review is done; the November review is due Nov 21.",
      inputs: [["Last done", "October review, due Oct 14 · Priya Raghavan"], ["Now", "November review, ready, due Nov 21"]], items: [], fix: [],
      hist: [["Monthly POA&M review (November)", "2026-11-12", "2026-11-21", "ready", "Priya Raghavan"], ["Monthly POA&M review (October)", "2026-10-09", "2026-10-14", "completed", "Priya Raghavan"]], comments: [] },
    { id: "priv-review", name: "Privileged accounts reviewed each quarter", cat: "Monitoring", ctl: ["AC-2", "AC-6"], owner: "Victor Amsel", due: "2026-12-01", state: "ok", fail: 0,
      desc: "Reads the quarterly privileged account review the Continuous monitoring FY2027 plan schedules.", line: "The quarterly review is in progress, due Dec 1.",
      inputs: [["Now", "Quarterly privileged account review, in progress, due Dec 1 · Victor Amsel"]], items: [], fix: [],
      hist: [["Quarterly privileged account review (AC-2, AC-6)", "2026-11-07", "2026-12-01", "in_progress", "Victor Amsel"]], comments: [] },
  ];
  const checkById = (id) => CHECKS.find((x) => x.id === id) || CHECKS[0];
  const CK = { overdue: ["bad", "Overdue"], soon: ["warn", "Due soon"], ok: ["ok", "OK"] };
  const ckPill = (x) => (DEACT[x.id] ? pill("none", "Deactivated") : pill(CK[x.state][0], CK[x.state][1]));
  const pageRoute = (id, tab) => `after-test-page-${id}${tab && tab !== "results" ? "-" + tab : ""}`;
  const HST = { completed: ["ok", "Completed"], in_progress: ["warn", "In progress"], blocked: ["bad", "Blocked"], ready: ["none", "Ready"], open: ["bad", "Open"] };
  const checkTabs = (x) => [["results", "Results"], ["history", "History", x.hist.length], ["tasks", "Tasks", 0], ["controls", "Controls", x.ctl.length], ["comments", "Comments", x.comments.length]];
  // v2 (C1) [B9]: Run all now runs every active check again; each check's Ran says when.
  const ranAt = () => (window.PA.v2 && window.PA.v2.get("checks.ran", null)) || "Today 06:00 · daily";
  const checkFacts = (x) => [["Owner", `${ownerPick(x.owner, x.name)}${x.ownerNote ? `<span class="a-tests-in">${esc(x.ownerNote)}</span>` : ""}`], ["Ran", esc(ranAt())], ["Due", dueCell(x.due, x.state)], ["Control", AK.codes(x.ctl)], ["Data", x.ex ? `Partly ${EX}` : "WS-X90's records"]];
  const checkMenu = (x) => more("More check actions", [["Manage subscribers", `data-modal="a-tests-subs" data-id="${x.id}"`], ["Export check data", `data-modal="v2k-export" data-id="check data"`], [DEACT[x.id] ? "Reactivate monitoring" : "Deactivate check…", DEACT[x.id] ? `data-atreact="${x.id}"` : `data-modal="a-tests-deactivate" data-id="${x.id}"`]]);
  const offChip = (x) => (DEACT[x.id] ? AK.chip("Deactivated until Dec 1", { tone: "warn" }) : "");
  const offCard = (x) => (DEACT[x.id] ? AK.reasonCard({ question: "Why was monitoring deactivated?", reason: "The November scan moves to the Block 1.1 software load; the check comes back on by itself on Dec 1.", who: ME, when: "Today", action: "Reactivate monitoring" })
    .replace('<span class="btn sm">Reactivate monitoring</span>', `<span class="btn sm" role="button" tabindex="0" data-atreact="${x.id}">Reactivate monitoring</span>`) : "");

  // The register, after: a category rail, the two cards counted by due state, owners and due dates, row selection.
  function checksRegister(key, withCo) {
    const c = (n) => (withCo ? co(n) : "");
    // v2: nothing is ticked when the page opens.
    const s = sel(key);
    const cat = CAT[key] || "all";
    const active = CHECKS.filter((x) => !DEACT[x.id]);
    const off = CHECKS.filter((x) => DEACT[x.id]);
    const need = active.filter((x) => x.state !== "ok");
    const list = cat === "off" ? off : active.filter((x) => cat === "all" || x.cat === cat);
    const ok = active.length - need.length;
    const n = (st) => need.filter((x) => x.state === st).length;
    const noDue = need.filter((x) => !x.due).length;
    const item = (k, label, count, bad = true) => `<button type="button" class="a-tests-rail-i${cat === k ? " on" : ""}" aria-pressed="${cat === k}" data-atcat="${key}|${k}"><span>${esc(label)}</span><b class="num${bad && count ? " bad" : ""}">${count}</b></button>`;
    // v2 (C1) [B7]: each category counts the checks it lists (v1's "All 5" counted only those needing attention, beside "7 checks").
    const rail = `<nav class="a-tests-rail" aria-label="Check categories"><div class="a-tests-rail-k">Category${c(5)}</div>${item("all", "All", active.length, false)}${["Vulnerability", "Evidence", "Monitoring"].map((g) => item(g, g, active.filter((x) => x.cat === g).length, false)).join("")}<div class="a-tests-rail-k">Deactivated</div>${item("off", "All deactivated", off.length, false)}</nav>`;
    const att = h.attention([["diamond", "Overdue", n("overdue")], ["clock", "Due soon", n("soon")], ["ring", "No due date", noDue, noDue === 0]], "Needs attention")
      .replace('<div class="t">Needs attention', `<div class="t"><span class="a-tests-tt">Needs attention${c(1)}</span>`);
    const cards = `<div class="pair a-tests-pair">${h.completion({ title: "Checks passing", total: active.length, done: ok, unit: "checks OK" })}${att}</div>`;
    const ids = list.map((x) => x.id);
    const bar = s.size ? bulkBar(key, "Search checks", s.size, ["Assign owner", "Deactivate"], { c: c(4), attrs: { "Assign owner": `data-modal="a-tests-owner" data-id="${s.size} checks"`, Deactivate: `data-modal="a-tests-deactivate" data-id="${[...s].join(",")}"` } })
      : filters("Search checks", ["Status", "Control", "Source", "Owner"]);
    // v2: overdue is one mark, the Status pill: the due date is a plain day and the failing count is ink (v1 also drew a
    // red date, a red flag and a red count). The row opens the check's page; its preview moved from an eye in every row
    // into the row's ⋯ menu.
    const rows = list.map((x) => ({ id: x.id, go: pageRoute(x.id), sel: s.has(x.id), cells: [
      cb(key, x.id, s.has(x.id), `Select ${x.name}`),
      `<span class="a-tests-name"><span class="a-tests-nmt" title="${esc(x.name)}">${esc(x.name)}</span>${x.ex ? EX : ""}</span>`,
      ownerPick(x.owner, x.name), ckPill(x), x.due ? AK.due(x.due, { done: true, prefix: false }) : mu("—"), AK.codes(x.ctl),
      x.fail ? num(x.fail) : mu("0"),
      more(`More actions for ${x.name}`, [["Preview", `data-panel="a-tests-check" data-id="${x.id}"`], ["Assign owner", `data-modal="a-tests-owner" data-id="${esc(x.name)}"`], DEACT[x.id] ? ["Reactivate monitoring", `data-atreact="${x.id}"`] : ["Deactivate…", `data-modal="a-tests-deactivate" data-id="${x.id}"`]], { cls: "a-tests-rowmore" }),
    ] }));
    return h.page(
      h.header("Checks", `<span>Derived from WS-X90's records, run daily</span><span>${CHECKS.length} checks · 5 read real data, 2 are partly Example</span>`, `<span class="btn" role="button" tabindex="0" data-atrunall="1">Run all now</span><span class="btn ink" role="button" tabindex="0" data-modal="v2k-create-check">Create check</span>`),
      `<div class="a-tests-railed">${rail}<div class="a-tests-railmain">${cards}${bar}${tbl({
        cols: [cbAll(key, ids, "Select every check shown"), "Check", `Owner${c(2)}`, `Status${c(3)}`, "Due date", "Control", "Failing", sr("Row actions")],
        // v2-keepcols: the row menu reads the same in every row, and the visual layer would take it for a constant column.
        rows, total: list.length, cls: "v2-keepcols", empty: cat === "off" ? "No check is deactivated." : "No check in this category.",
      })}${AK.note("IAVM notices, STIG checklist counts and their failing items, and the IAVA check's Nov 11 due date are invented: no ACAS or STIG data is loaded. Owners and the other due dates come from the plan's scheduled tasks and the CVE-2024-6387 issue.")}</div></div>`,
    );
  }

  // A check's record: the page, and the same record in the preview the eye keeps.
  const checkStatus = (x) => `<div class="ak-rail-s a-tests-status"><div class="ak-rail-t">Status</div><div>${ckPill(x)}</div><p class="a-tests-p">${esc(x.line)}</p><div class="a-tests-k">${x.ctl.length > 1 ? "Controls it tests" : "Control it tests"}</div>${x.ctl.map((k) => `<div class="a-tests-ctl"><span class="ak-code">${k}</span><span>${esc(CT[k][0])}</span>${stPill(CT[k][1])}</div>`).join("")}</div>`;
  const checkItem = (x, it, i, withCo) => {
    const open = withCo && x.id === "scan" && i === 1 && !window.PA.canon; // shown open only on the comparison page; the real screen opens it from ⋯
    const late = it.due && days(it.due) < 0;
    return `<div class="a-tests-item${open ? " open" : ""}"><div class="a-tests-irow">${AK.check(false)}<div class="a-tests-ib"><b>${it.t}</b><div class="a-tests-isub">${it.due ? dueCell(it.due, late ? "overdue" : x.state === "soon" ? "soon" : "open") : AK.due(null)}${it.tag ? tag(it.tag) : ""}</div></div><button type="button" class="a-tests-dots" data-atmenu aria-expanded="${open}" aria-label="More actions for this item">${AK.i("dots")}</button></div>
      <div class="a-tests-imenu" role="menu"><span role="menuitem" tabindex="0" class="a-tests-mi" data-modal="a-tests-poam" data-id="${x.id}">${AK.i("flag")}Create POA&amp;M item</span><span role="menuitem" tabindex="0" class="a-tests-mi" data-modal="a-tests-task" data-id="${x.id}">${AK.i("task")}Create task</span><span role="menuitem" tabindex="0" class="a-tests-mi" data-modal="a-tests-deactivate" data-id="${x.id}|${i}">${AK.i("ban")}Deactivate monitoring for this item${open ? co(6) : ""}</span></div></div>`;
  };
  const checkResults = (x, withCo) => {
    const head = sectH("Check results", null, `${more("Create", [["POA&amp;M item", `data-modal="a-tests-poam" data-id="${x.id}"`], ["Task", `data-modal="a-tests-task" data-id="${x.id}"`]], { text: "Create", sm: true })}${x.fix.length ? btn(`How to fix ${AK.i("back", "a-tests-flip")}`, `data-panel="a-tests-fix" data-id="${x.id}"`, true) : ""}`, withCo ? co(4) : "");
    if (!x.items.length) return `${head}<div class="a-tests-results"><div class="a-tests-rhead">${gl("check")}<b>Nothing needs remediation</b></div></div>`;
    return `${head}<div class="a-tests-results"><div class="a-tests-rhead">${gl(x.state === "soon" ? "clock" : "diamond")}<b>${x.fail} item${x.fail > 1 ? "s" : ""} need${x.fail > 1 ? "" : "s"} remediation</b></div><div class="a-tests-selall">${AK.check(false)}<span>Select all</span></div>${x.items.map((it, i) => checkItem(x, it, i, withCo)).join("")}${x.fail > x.items.length ? `<div class="a-tests-moreitems">and ${fmt(x.fail - x.items.length)} more</div>` : ""}</div>`;
  };
  const checkInputs = (x) => AK.section("Inputs", `<div class="ak-card"><dl class="ak-kv">${x.inputs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl></div>`, { count: x.inputs.length });
  const histWithin = (r) => {
    if (r[3] === "completed") return mu("Not recorded");
    const d = days(r[2]);
    return d < 0 ? `<span class="a-tests-bad">No · ${-d} day${-d === 1 ? "" : "s"} late</span>` : mu(`Due in ${d} days`);
  };
  const histList = (x) => (x.hist.length ? `<div class="a-tests-hist">${x.hist.map((r) => `<div class="a-tests-hrow">${pill(HST[r[3]][0], HST[r[3]][1])}<div class="a-tests-hb"><b>${esc(r[0])}</b><span class="a-tests-sub">Opened ${md(r[1])} · due ${md(r[2])} · ${r[3] === "completed" ? "done, day not recorded" : histWithin(r)} · ${esc(r[4])}</span></div></div>`).join("")}</div>` : AK.empty({ title: "No remediation history yet", line: "Each failing item joins this list with its due and done dates." }));
  const histTable = (x) => (x.hist.length ? `${filters("Search history", ["Last 90 days", "With due date", "Status"])}${tbl({
    cols: ["Item", "Status", "Opened", "Due", "Done", "Time to complete", "Within deadline", "By"],
    rows: x.hist.map((r) => ({ cells: [tr(r[0], 330), pill(HST[r[3]][0], HST[r[3]][1]), num(md(r[1])), num(md(r[2])), r[3] === "completed" ? mu("Day not recorded") : mu("Not done"), r[3] === "completed" ? mu("Not recorded") : num(`${-days(r[1])} days so far`), histWithin(r), AK.owner(r[4])] })),
    total: x.hist.length, nm: 0,
  })}` : AK.empty({ title: "No remediation history yet", line: "Each failing item joins this list with its due and done dates." }));
  const checkControls = (x) => `<div class="a-tests-list">${x.ctl.map((k) => `<div class="a-tests-lrow"><span class="ak-code">${k}</span><span class="a-tests-grow">${esc(CT[k][0])}</span>${stPill(CT[k][1])}${k === "SI-2" ? `<span class="ak-link" ${go("after-control-record")}>Open</span>` : ""}</div>`).join("")}</div>`;
  const checkComments = (x) => `${AK.comments({ items: x.comments, you: ME })}${x.comments.length ? AK.note("The comment is invented.") : ""}`;
  const checkTasks = (x) => AK.empty({ title: "No tasks yet", line: "Create a task from a failing item: it carries an owner and a due date.", action: "Create task" }).replace('<span class="btn sm ink">Create task</span>', `<span class="btn sm ink" role="button" tabindex="0" data-modal="a-tests-task" data-id="${x.id}">Create task</span>`);

  P["a-tests-check"] = (id) => {
    const [cid, tab0] = String(id || "").split("|");
    const x = checkById(cid), tab = tab0 || "results";
    lastPanel = { kind: "a-tests-check", id, label: "Check preview" };
    const head = factsCo(AK.recordHead({ title: x.name, chip: offChip(x), desc: esc(x.desc), actions: `${btn(`${AK.i("link")}Open page`, go(pageRoute(x.id)))}${co(1)}${checkMenu(x)}${co(7)}`, facts: checkFacts(x).filter((f) => f[0] !== "Data") }), co(2));
    const strip = ptabs("a-tests-check", x.id, checkTabs(x), tab, { History: 5, Comments: 3 });
    const body = tab === "history" ? histList(x) : tab === "tasks" ? checkTasks(x) : tab === "controls" ? checkControls(x) : tab === "comments" ? checkComments(x)
      : `${offCard(x)}${checkResults(x, true)}${checkStatus(x)}${checkInputs(x)}`;
    return { label: "Check preview", body: `<div class="a-tests-pan">${head}${strip}${body}</div>` };
  };
  P["a-tests-fix"] = (id) => {
    const x = checkById(id);
    lastPanel = { kind: "a-tests-fix", id, label: "How to fix" };
    return { label: "How to fix", body: `<div class="a-tests-pan">${AK.recordHead({ title: "How to fix", desc: esc(x.name) })}<ol class="a-tests-steps">${x.fix.map((f) => `<li>${esc(f)}</li>`).join("")}</ol><div class="btns">${btn(`${AK.i("back")}Back to the check`, `data-panel="a-tests-check" data-id="${x.id}"`)}${btn("Create POA&amp;M item", `data-modal="a-tests-poam" data-id="${x.id}"`, true)}</div></div>` };
  };
  function checkPage(x, tab) {
    const head = factsCo(AK.recordHead({ crumbs: [["Checks", "after-test-page"], [x.name]], title: x.name, chip: offChip(x), desc: esc(x.desc), actions: `${checkMenu(x)}${co(7)}`, facts: checkFacts(x) }), co(2))
      .replace(/<\/div>$/, `${tabs(checkTabs(x).map(([k, l, n]) => [l, n, pageRoute(x.id, k), k === tab]), { History: 5, Comments: 3 }, `<span class="a-tests-tabco">${co(1)}</span>`, "Check sections")}</div>`);
    const body = tab === "history" ? histTable(x) : tab === "tasks" ? checkTasks(x) : tab === "controls" ? checkControls(x) : tab === "comments" ? checkComments(x)
      : `${offCard(x)}${AK.withRail(`${checkResults(x, true)}${checkInputs(x)}`, checkStatus(x))}`;
    return h.page(head, body);
  }

  // ════════════════ Controls ════════════════
  // program_control_status for the fourteen rows the register showed; every control reads Unassigned (no owners recorded).
  const CTRL = [
    ["AC-1", "Policy and Procedures", "partially_satisfied", 17, 17, "diamond", "Open assessment findings", "REQ-436"],
    ["AC-2", "Account Management", "satisfied", 26, 26, null, null, "REQ-001"],
    ["AC-2(5)", "Inactivity Logout", "no_evidence", 0, 1, "ring", "Link evidence to REQ-442", "REQ-442"],
    ["AC-2(7)", "Privileged User Accounts", "not_assessed", 4, 4, "clock", "Add to assessment campaign", "REQ-443"],
    ["AC-11", "Device Lock", "other_than_satisfied", 2, 2, "diamond", "Open assessment findings", "REQ-008"],
    // v2 (H): a facility's, a host's and a hybrid row, so the sample shows each responsibility (their own standing, if taken back).
    ["AT-2", "Literacy Training and Awareness", "no_evidence", 0, 10, "ring", "Link evidence to its requirement", null],
    ["AU-7", "Audit Record Reduction and Report Generation", "satisfied", 4, 4, "check", "Inherited", "REQ-353"],
    ["AU-10", "Non-repudiation", "other_than_satisfied", 1, 1, "diamond", "Open assessment findings", "REQ-360"],
    ["IA-2(2)", "Multi-factor Authentication to Non-privileged Accounts", "not_assessed", 1, 1, "clock", "Add to assessment campaign", "REQ-599"],
    ["IA-5", "Authenticator Management", "other_than_satisfied", 10, 10, "diamond", "Open assessment findings", "REQ-039"],
    ["PE-13", "Fire Protection", "no_evidence", 0, 6, "ring", "Link evidence to its requirement", null],
    ["RA-5", "Vulnerability Monitoring and Scanning", "satisfied", 10, 10, null, null, "REQ-054"],
    ["SC-7", "Boundary Protection", "satisfied", 6, 6, null, null, null],
    ["SC-5(3)", "Detection and Monitoring", "other_than_satisfied", 2, 2, "diamond", "Open assessment findings", "REQ-200"],
    ["SI-2", "Flaw Remediation", "not_assessed", 10, 10, "clock", "Open assessment campaign", "REQ-064"],
    ["SI-4(13)", "Analyze Traffic and Event Patterns", "no_requirement", 0, 6, "ring", "Map 3 more objectives", "REQ-262"],
    ["SA-24", "Design For Cyber Resiliency", "no_requirement", 0, 10, "ring", "Map a requirement", null],
  ];
  const CMAP = { "AC-1": 17, "AC-2(5)": 1, "AC-2(7)": 4, "IA-2(2)": 1, "SI-2": 10, "SI-4(13)": 3, "SA-24": 0 };
  // Each control's dated events: published results and the determinations in them, evidence reviews, the inherited assessment.
  const CHIST = {
    "AC-1": [["D. Okafor", "published the expanded control set's increment 1: <b>Partially satisfied</b>", "Nov 12"], ["Nadia Fournier", "judged it Partially satisfied in those results", "Oct 24"], [null, "collected the access control policy and procedure baseline, revision 3.2; review: Sent back", "Sep 18"]],
    "AC-2": [["D. Okafor", "published the initial authorization's results: <b>Satisfied</b>", "Aug 28"], ["Nadia Fournier", "judged it Satisfied in those results", "Aug 20"]],
    "AC-11": [["D. Okafor", "published the initial authorization's results: <b>Other than satisfied</b>", "Aug 28"], ["Nadia Fournier", "judged it Other than satisfied in those results", "Aug 10"]],
    "AU-10": [["D. Okafor", "published the expanded control set's increment 1: <b>Other than satisfied</b>", "Nov 12"], ["Nadia Fournier", "judged it Other than satisfied in those results", "Oct 21"]],
    "IA-2(2)": [["Nadia Fournier", "judged it Other than satisfied in increment 2, a draft that decides nothing until published", "Nov 13"]],
    "IA-5": [["D. Okafor", "published the initial authorization's results: <b>Other than satisfied</b>", "Aug 28"], ["Nadia Fournier", "judged it Other than satisfied in those results", "Aug 3"]],
    "RA-5": [["D. Okafor", "published the initial authorization's results: <b>Satisfied</b>", "Aug 28"], ["Nadia Fournier", "judged it Satisfied in those results", "Aug 18"]],
    "SC-5(3)": [["D. Okafor", "published the expanded control set's increment 1: <b>Other than satisfied</b>", "Nov 12"], ["Nadia Fournier", "judged it Other than satisfied in those results", "Sep 24"]],
    "AU-7": [[null, "inherits 4 of 4 objectives from Audit Log Collector 1, whose component assessment is published", "Version 1"]],
    "SI-2": [["Nadia Fournier", "accepted the account disable trigger test report", "Oct 24"], [null, "collected the account disable trigger test report, LRU-013", "Sep 25"]],
  };
  const ctlById = (code) => CTRL.find((r) => r[0] === code) || CTRL[0];
  // v2 (C1): the requirement the register shows for a control, for its page and preview (the chain's links read it).
  window.PA.ctlReq = (code) => { const r = CTRL.find((x) => x[0] === code); return r ? r[7] : null; };
  // v2: Next step is the words alone; the Status pill beside it already carries the tone (v1 added a glyph).
  const stepCell = (r) => (r[6] ? `<span class="a-tests-ink">${esc(r[6])}</span>` : mu("—"));
  const rung = (label, n, total) => `<div class="a-tests-rung">${gl(n === total && total ? "check" : n ? "part" : "ring")}<span>${esc(label)}</span><b class="num">${fmt(n)} of ${fmt(total)}</b>${bar(total ? pct(n, total) : 0)}</div>`;
  const assignCard = (c) => `<div class="card a-tests-assign"><div class="t"><span class="a-tests-tt">Assignment${c}</span><span>New owner field</span></div><div class="a-tests-assign-b"><div class="a-tests-donut" style="--p:0"><b class="num">0%</b><span>Assigned</span></div><div class="a-tests-legend">${[["Unassigned", 560, "var(--ink-4)"], ["Assigned", 0, "var(--brand)"], ["Needs reassignment", 0, "var(--warn)"]].map(([l, n, col]) => `<div class="a-tests-lg"><i style="--c:${col}"></i><span>${l}</span><b class="num">${fmt(n)}</b></div>`).join("")}</div></div></div>`;

  // v2 (C1): a control the reader walked reads where it stands now: its status, objectives, next step and requirement.
  const chainRow = (r) => {
    const ch = CH(); if (!ch) return r;
    const v = ch.view(r[0]); if (!v.touched && !(r[0] === "IA-2(2)" && ch.inc2())) return r;
    if (!v.touched) return [r[0], r[1], "other_than_satisfied", r[3], r[4], "diamond", "Open assessment findings", r[7]];
    return [r[0], r[1], v.status, v.oe, v.ob, null, v.step ? v.step.label : null, v.s.req || r[7]];
  };
  // v2 (H): Responsibility, from PA.v2host (mod-zzzz-v2-8host.js). An inherited control reads its provider's status and owes
  // WS-X90 no requirement, evidence or next step; the filter lists every control of the baseline with that responsibility.
  const HOSTR = () => window.PA.v2host || null;
  const respOf = (code) => (HOSTR() ? HOSTR().responsibility(code) : { kind: "System-specific" });
  const respRow = (r) => {
    if (respOf(r[0]).kind !== "Inherited") return r;
    const c = window.PA.SSP && window.PA.SSP.ctl(r[0]);
    return [r[0], r[1], c ? c.cs : r[2], null, c ? c.ob : r[4], null, null, null, "inh"];
  };
  const respCell = (code) => { const x = respOf(code); return x.kind === "System-specific" ? "System-specific" : `${esc(x.kind)} ${mu(`· ${esc(x.provider)}`)}`; };
  let RESPQ = "all";
  const RESP_L = { all: "All responsibilities", inh: "Inherited", hyb: "Hybrid", own: "System-specific" };
  const RESP_F = { all: () => true, inh: (code) => respOf(code).kind === "Inherited", hyb: (code) => respOf(code).kind === "Hybrid", own: (code) => respOf(code).kind === "System-specific" };
  const respN = (k) => (window.PA.SSP ? window.PA.SSP.controls.filter((c) => RESP_F[k](c.c)).length : 0);
  // The baseline's controls with one responsibility, in the register's row shape (the sample's own row where it has one).
  const respRows = () => (window.PA.SSP ? window.PA.SSP.controls.filter((c) => RESP_F[RESPQ](c.c)).map((c) => {
    const own = CTRL.find((r) => r[0] === c.c); if (own) return own;
    const v = CH() ? CH().view(c.c) : null, rq = ((window.PA.SSP.requirements || {})[c.c] || [])[0];
    return [c.c, c.t, v ? v.status : c.cs, v ? v.oe : c.oe, c.ob, null, v && v.step ? v.step.label : null, rq ? rq[0] : null];
  }) : []);
  const respMenu = () => `<details class="v2h-flt a-tests-respf"><summary class="flt">Responsibility${RESPQ !== "all" ? `: ${esc(RESP_L[RESPQ])}` : ""} ⌄</summary><div class="v2h-menu" role="menu">${Object.keys(RESP_L).map((k) => `<span role="menuitemradio" tabindex="0" aria-checked="${k === RESPQ}" class="v2h-mi${k === RESPQ ? " on" : ""}" data-atresp="${k}">${esc(RESP_L[k])}${k !== "all" && HOSTR() ? ` <span class="num">${fmt(respN(k))}</span>` : ""}</span>`).join("")}</div></details>`;
  S["after-controls-index"] = () => {
    const key = "ctl";
    // v2: nothing is ticked when the page opens.
    const s = sel(key);
    const ids = CTRL.map((r) => r[0]);
    // v2 (C1): one source per number: the card and the quick views count the baseline as the chain leaves it.
    const cs = CH() ? CH().counts() : { satisfied: 176, no_evidence: 233, not_assessed: 90, partially_satisfied: 34, other_than_satisfied: 13, no_requirement: 14 };
    // v2 (F): the quick views filter the rows (a hub or the launcher asks for one through PA.v2.go(…, { filter: { qv } })).
    const QF = { all: () => true, ev: (r) => r[2] === "no_evidence", na: (r) => r[2] === "not_assessed", short: (r) => r[2] === "partially_satisfied" || r[2] === "other_than_satisfied", noown: () => true };
    const QN = { all: 560, ev: cs.no_evidence, na: cs.not_assessed, short: cs.partially_satisfied + cs.other_than_satisfied, noown: 560 };
    // v2 (H): the Responsibility filter lists the baseline's controls with that responsibility (25 a page); All keeps the sample.
    const ROWS_ALL = (RESPQ === "all" ? CTRL : respRows()).map(chainRow).map(respRow).filter(QF[CTLQV] || QF.all);
    const ROWS = RESPQ === "all" ? ROWS_ALL : ROWS_ALL.slice(0, 25);
    const nInh = HOSTR() ? HOSTR().counts().inh : 0;
    // v2: one summary card, the completion measure, without its mini tiles (Mapped, With evidence and Assessed repeated
    // the statuses). v1's Assignment donut at 0% (one grey ring) is gone: No owner 560 is a quick view, beside the
    // statuses a reader works through. No requirement and Inherited are values of the Status and Determined by filters,
    // so the row keeps five quick views and each count is drawn once.
    return h.page(
      h.header("Controls", `<span>SSP 3 draft · 560 controls in the baseline</span><span>1,791 assessment objectives</span>${nInh ? `<span>${fmt(nInh)} inherited from providers</span>` : ""}`, `${more("More control actions", [["Export controls", 'data-modal="v2k-export" data-id="controls"']])}<span class="btn" data-go="ssp" role="link" tabindex="0">Open the SSP</span><span class="btn ink" role="button" tabindex="0" data-modal="v2k-map" data-id="">Map a requirement</span>`),
      `<div class="a-tests-cards v2l-cards v2l-one">${h.completion({ title: "Controls satisfied", total: 560, done: cs.satisfied, unit: "controls satisfied", note: nInh ? `${fmt(nInh)} inherited` : "updated now" })}</div>`,
      `<div class="views" role="group" aria-label="Quick views">${[["all", "All"], ["ev", "Needs evidence"], ["na", "Not assessed"], ["short", "Short of satisfied"], ["noown", "No owner"]].map(([k2, l]) => `<span class="qv${k2 === CTLQV ? " on" : ""}" role="button" tabindex="0" aria-pressed="${k2 === CTLQV}" data-atcqv="${k2}">${esc(l)} <span class="num">${fmt(QN[k2])}</span></span>`).join("")}</div>`,
      s.size ? bulkBar(key, "Search controls", s.size, ["Assign owner", "Add to assessment campaign"], { c: co(3), attrs: { "Assign owner": `data-modal="a-tests-owner" data-id="${s.size} controls"`, "Add to assessment campaign": `data-modal="a-tests-addcamp" data-id="${s.size}"` } })
        : filters("Search controls", ["Family", "Status", "Determined by"]).replace('<span class="flt sub">', `${respMenu()}<span class="flt sub">`),
      tbl({
        cols: [cbAll(key, ids, "Select every control shown"), "Control", `Owner${co(2)}`, "Status", "Responsibility", `<span class="a-tests-wrap">Objectives with evidence</span>`, "Next step", "Requirement", sr("Row actions")],
        rows: ROWS.map((r, i) => ({ id: r[0], sel: s.has(r[0]), cells: [
          cb(key, r[0], s.has(r[0]), `Select ${r[0]}`), `${tr(`${r[0]} ${r[1]}`, 250)}${i === 0 ? co(4) : ""}`, ownerPick(null, r[0]), stPill(r[2]), respCell(r[0]), r[8] === "inh" ? mu("—") : of(r[3], r[4]), stepCell(r), r[8] === "inh" ? mu("Inherited") : r[7] ? tag(r[7]) : mu("—"),
          more(`More actions for ${r[0]}`, [["Open record", go(ctlPage(r[0]))], ["Assign owner", `data-modal="a-tests-owner" data-id="${r[0]}"`], ...(HOSTR() ? [["Change responsibility", `data-modal="v2h-resp" data-id="${r[0]}"`]] : [])], { cls: "a-tests-rowmore" }),
        ] })),
        total: RESPQ === "all" ? QN[CTLQV] || 560 : ROWS_ALL.length, panel: "a-tests-control",
      }),
      plain("Statuses, objectives and next steps are WS-X90's, from program_control_status. Owner is a new field: WS-X90 records no control owner, so every row reads Unassigned until someone is assigned."),
    );
  };
  P["a-tests-control"] = (id) => {
    const [code, tab0] = String(id || "").split("|");
    const r = ctlById(code), tab = tab0 || "stands";
    lastPanel = { kind: "a-tests-control", id, label: "Control preview" };
    const m = CMAP[r[0]] !== undefined ? CMAP[r[0]] : r[4];
    const assessed = ["satisfied", "partially_satisfied", "other_than_satisfied"].includes(r[2]) ? r[4] : 0;
    const det = r[0] === "AU-7" ? "Component assessment" : assessed ? "Program assessment" : mu("Nobody yet");
    const hist = CHIST[r[0]] || [];
    const head = AK.recordHead({ title: `${r[0]} ${r[1]}`, actions: r[0] === "SI-2" ? btn("Open record", go("after-control-record"), true) : r[6] && r[6] !== "Inherited" ? btn(esc(r[6]), "", true) : "" });
    const kv = `<div class="a-tests-kvco"><dl class="ak-kv"><dt>Status</dt><dd>${stPill(r[2])}</dd><dt>Determined by</dt><dd>${det}</dd><dt>Family</dt><dd>${tag(r[0].split("-")[0])}</dd><dt>Owner</dt><dd>${ownerPick(null, r[0])}</dd><dt>Note</dt><dd><span class="a-tests-noteadd" role="button" tabindex="0">Add a note…</span></dd><dt>Requirements</dt><dd>${r[7] ? tag(r[7]) : ring("None map it")}</dd></dl>${co(4)}</div>`;
    const strip = ptabs("a-tests-control", r[0], [["stands", "Where it stands"], ["history", "History", hist.length]], tab);
    const body = tab === "history"
      ? (hist.length ? AK.activity(hist.map(([who, what, when]) => ({ who, what, when }))) : AK.empty({ title: "Nothing recorded yet", line: "Status changes, owner changes and evidence reviews join this list with who and when." }))
      : `<div class="ak-card"><div class="a-tests-ladder">${rung("Objectives mapped", m, r[4])}${rung("With evidence", r[3], r[4])}${rung("Assessed", assessed, r[4])}</div></div>
        <div class="ak-card"><div class="a-tests-ch"><b>By system</b><span class="ct num">1</span></div><div class="a-tests-lrow">${gl(m === r[4] && m ? "check" : m ? "part" : "ring")}<span class="a-tests-grow">SYS-WSX90 · boundary</span><span class="a-tests-mu">${m} mapped · ${r[3]} with evidence</span></div></div>`;
    return { label: "Control preview", body: `<div class="a-tests-pan">${head}${kv}${strip}${body}</div>` };
  };

  // ════════════════ SI-2, the control's record ════════════════
  const SI2_OBJ = [["SI-02a.[01]", "system flaws are identified"], ["SI-02a.[02]", "system flaws are reported"], ["SI-02a.[03]", "system flaws are corrected"], ["SI-02b.[01]", "software updates related to flaw remediation are tested for effectiveness before installation"], ["SI-02b.[02]", "software updates related to flaw remediation are tested for potential side effects before installation"], ["SI-02b.[03]", "firmware updates related to flaw remediation are tested for effectiveness before installation"], ["SI-02b.[04]", "firmware updates related to flaw remediation are tested for potential side effects before installation"], ["SI-02c.[01]", "security-relevant software updates are installed within [time period] of the release of the updates"], ["SI-02c.[02]", "security-relevant firmware updates are installed within [time period] of the release of the updates"], ["SI-02d.", "flaw remediation is incorporated into the organizational configuration management process"]];
  const SI2R = "after-control-record";
  const si2Route = (tab) => (tab === "impl" ? SI2R : `${SI2R}-${tab}`);
  const SI2_TABS = [["impl", "Implementation"], ["requirements", "Requirements", 1], ["evidence", "Evidence", 1], ["checks", "Checks", 2], ["assessment", "Assessment", 10], ["findings", "Findings", 1], ["history", "Activity", 4]];
  const SI2_ROUTES = [...SI2_TABS.map(([k]) => k), "comments"]; // every address the record answers
  // v2 F (B1): Add evidence is wired: the version it adds is cited by REQ-064 (PA.v2reqs, one source with REQ-064's chain on the
  // Requirements page), so it joins this Evidence tab, its count, the rail's Accepted and the Activity tab, pending review.
  const SI2_EV0 = ["Account disable trigger test report - expiry, disassociation and policy violation, LRU-013", "Test record", "Accepted", "Sep 25", "Mar 25, 2027"];
  const si2Added = () => (window.PA.v2reqs ? window.PA.v2reqs.evidence("REQ-064").filter((e) => e.at) : []);
  const si2Ev = () => [SI2_EV0, ...si2Added().map((e) => [e.title, e.kind || "Document", "Pending review", AK.md(e.at), null])];
  const si2Cards = () => `<div class="grid2 a-tests-sum">
    <div class="card a-tests-sumc"><div class="t a-tests-span"><span class="a-tests-tt">Where it stands${co(2)}</span></div>
      <div class="a-tests-sum-l"><div class="big num">0%</div><span class="a-tests-mu">of its 10 assessment objectives assessed</span>${bar(0)}<div class="foot"><span class="num">10 of 10 with evidence</span><span class="num">10 of 10 mapped</span></div></div>
      <div class="a-tests-tiles"><div class="a-tests-tile"><div class="r"><span>Checks</span><b class="num">0/2 OK</b></div>${bar(0)}</div><div class="a-tests-tile"><div class="r"><span>Evidence</span><b class="num">1/1 accepted</b></div>${bar(100)}</div></div>
      <div class="a-tests-trace a-tests-span">${[["Requirements", "1"], ["Evidence", "1"], ["Findings", "None"], ["POA&M", "None"], ["Risks", "None"]].map(([l, v]) => `<span><small>${esc(l)}</small><b class="num${v === "None" ? " a-tests-mu" : ""}">${v}</b></span>`).join("")}</div></div>
    <div class="card a-tests-sumn"><div class="t">Next step</div>
      <div class="a-tests-nx">${gl("clock")}<span class="a-tests-grow">WS-X90 continuous monitoring — FY2027: its draft plan holds all 10 objectives.</span>${btn("Open assessment campaign", go("campaign-conmon"), true)}</div>
      <div class="a-tests-nx bad">${gl("diamond")}<span class="a-tests-grow"><b>CVE-2024-6387</b> (regreSSHion, high) names SI-2 and RA-5 · remediate by ${dueCell("2026-11-09", "overdue")}</span><span class="ak-link" ${go(pageRoute("sbom"))}>Open check</span></div></div></div>`;
  // v2: Where it stands and Next step are the first tab's Details rail, under the tabs (v1 drew them as two cards between
  // the facts and the tabs). Numbers only: the trace's counts were the tabs' counts again. Next step's button is a
  // secondary, so Add evidence is the page's one primary, and the red CVE callout left the card (the operational issue is
  // on the Findings tab, which still opens the check).
  const si2Rail = () => `${AK.railCard("Where it stands", [["Assessed", `${of(0, 10)} objectives`], ["With evidence", `${of(10, 10)} objectives`], ["Mapped", `${of(10, 10)} objectives`], ["Checks OK", of(0, 2)], ["Accepted", `${of(1, si2Ev().length)} evidence`]])}
    <div class="ak-rail-s v2l-next"><div class="ak-rail-t">Next step</div><p class="a-tests-p">WS-X90 continuous monitoring — FY2027: its draft plan holds all 10 objectives.</p><div>${btn("Open assessment campaign", go("campaign-conmon"))}</div></div>`;
  function si2Page(tab, body) {
    // v2: the title, one status and four facts; Implementation and the parameter are said once, on the first tab.
    const head = factsCo(AK.recordHead({ crumbs: [["Controls", "after-controls-index"], ["SI-2"]], title: "SI-2 Flaw Remediation",
      actions: `${more("More control actions", [["Assign owner", 'data-modal="a-tests-owner" data-id="SI-2"'], ["Open the parameter in Baseline", go("baseline-params")], ...(HOSTR() ? [["Change responsibility", 'data-modal="v2h-resp" data-id="SI-2"']] : [])])}${btn("Add evidence", 'data-modal="a-tests-addev" data-id="SI-2"', true)}`,
      // v2 (H): Responsibility, the fifth fact (SI-2 is WS-X90's own: no provider offers it).
      facts: [["Status", stPill("not_assessed")], ["Family", tag("SI")], ["Owner", ownerPick(null, "SI-2")], ["Determined by", mu("—")], ["Responsibility", respCell("SI-2")]] }), co(1));
    return h.page(head, tabs(SI2_TABS.map(([k, l, n]) => [l, k === "evidence" ? si2Ev().length : n, si2Route(k), k === tab || (k === "history" && tab === "comments")]), { Checks: 5, Activity: 4 }, "", "Control sections"), tab === "impl" ? si2WithRail(body) : body);
  }
  // The rail sits beside the implementation's cards; the tables after them (the STIG rules, the objectives) keep the
  // page's full width, so they fit their frame at 1440.
  const RAIL_END = "<!--v2l-rail-end-->";
  const si2WithRail = (body) => { const [side, rest = ""] = body.split(RAIL_END); return `<div class="v2l-si2">${AK.withRail(side, si2Rail())}</div>${rest}`; };
  S[SI2R] = () => si2Page("impl", `<div class="a-tests-row2 v2l-impl"><div class="card"><div class="t">Implementation in SSP 3 <span>${pill("part", "Partial")}</span></div>
      <p class="a-tests-p">The SYS-WSX90 satisfies the tailored intent of SI-2 through a combination of system-level procedures and mapped component implementations.</p>
      <div class="next">${gl("ring")}<span>Placeholder text: 74 of SSP 3's 560 narratives read like this one.</span><span class="sp ak-link" data-go="ssp" role="link" tabindex="0">Draft it in the SSP</span></div></div>
      <div class="card"><div class="t">Parameter</div><dl class="ak-kv"><dt>SI-02_ODP</dt><dd>${ring("Not set")}</dd><dt>Asks</dt><dd>time period to install security-relevant updates</dd><dt>Read by</dt><dd><span class="ak-link" ${go(pageRoute("iava"))}>IAVA and IAVB patches check</span></dd></dl><div>${btn("Set in Baseline", go("baseline-params"))}</div></div></div>${RAIL_END}
    <h4 class="subhead">Assessment objectives</h4>
    ${tbl({ cols: ["Objective", "Text", "Mapped", "With evidence", "Assessed"], rows: SI2_OBJ.map(([l, t]) => ({ cells: [num(l), tr(t, 470), pill("ok", "Mapped"), pill("ok", "Evidenced"), pill("info", "Not assessed")] })), total: 10, nm: 0 })}`);
  S[si2Route("requirements")] = () => si2Page("requirements", `${tbl({ cols: ["Requirement", "Title", "Allocated to", "Maps", "Evidence"], rows: [{ cells: ["REQ-064", "SI Monitoring Requirement 064", tag("CN-109116 Update & Recovery Controller"), `${tag("SI-2")} ${tag("SI-10")} ${mu("whole controls")}`, num(si2Ev().length)] }], total: 1, nm: 0 })}${plain("REQ-064 maps SI-2 whole, so it covers all 10 objectives on SYS-WSX90, the only system that selects SI-2.")}`);
  S[si2Route("evidence")] = () => si2Page("evidence", tbl({ cols: ["Evidence", "Kind", "Review", "Collected", "Renew by", "Cited by"], rows: si2Ev().map(([t, k, rv, c, rn]) => ({ cells: [tr(t, 420), tag(k), pill(rv === "Accepted" ? "ok" : "none", rv), num(c), rn ? num(rn) : mu("—"), tag("REQ-064")] })), total: si2Ev().length, nm: 0 }));
  S[si2Route("checks")] = () => si2Page("checks", `${sectH("Checks that read SI-2", null, "", co(5))}<div class="a-tests-okline">${AK.progress(0, 2, "OK")}</div>${tbl({
    cols: ["Check", "Owner", "Status", "Due date", "Control"],
    rows: ["iava", "sbom"].map((cid) => { const x = checkById(cid); return { go: pageRoute(cid), cells: [`${tr(x.name, 360)}${x.ex ? EX : ""}`, AK.owner(x.owner), ckPill(x), dueCell(x.due, x.state), AK.codes(x.ctl)] }; }),
    total: 2, nm: 0,
  })}${AK.note("The IAVA and IAVB check and its due date are invented; the SBOM check, its owner and its date are WS-X90's.")}`);
  S[si2Route("assessment")] = () => si2Page("assessment", `<div class="grid2"><div class="card"><div class="t">Plans that hold SI-2</div><div class="a-tests-list"><div class="a-tests-lrow">${gl("check")}<span class="a-tests-grow">WS-X90 continuous monitoring — FY2027 · plan 1, draft</span><span class="a-tests-mu">10 of 10 objectives</span></div><div class="a-tests-lrow">${gl("ring")}<span class="a-tests-grow">WS-X90 Expanded Control Set Assessment · plan 1</span><span class="a-tests-mu">Not held</span></div></div></div>
      <div class="card"><div class="t">Scheduled in that plan</div><div class="a-tests-list"><div class="a-tests-lrow">${gl("check")}<span class="a-tests-grow">Monthly vulnerability scan — mission network (October)</span><span class="a-tests-mu">Due Oct 11 · done</span></div><div class="a-tests-lrow">${gl("clock")}<span class="a-tests-grow">Monthly vulnerability scan — mission network</span>${dueCell("2026-11-15", "overdue")}</div><div class="a-tests-lrow">${gl("ring")}<span class="a-tests-grow">Monthly POA&amp;M review</span>${dueCell("2026-11-21", "open")}</div></div></div></div>
    ${tbl({ cols: ["Objective", "Plan", "Determination"], rows: SI2_OBJ.map(([l]) => ({ cells: [num(l), "Continuous monitoring FY2027 · plan 1", pill("none", "Not yet judged")] })), total: 10, nm: 0 })}`);
  S[si2Route("findings")] = () => si2Page("findings", `<div class="card"><div class="t">Assessment findings <span class="num">0</span></div><p class="note-p">No published or draft result judges SI-2.</p></div>
    ${tbl({ cols: ["Operational issue", "Severity", "Opened", "Remediate by", "Owner"], rows: [{ go: pageRoute("sbom"), cells: [tr("CVE-2024-6387 in the OpenSSH server (regreSSHion)", 400), h.sevPill("high"), num("Oct 10"), dueCell("2026-11-09", "overdue"), AK.owner("Ingrid Solberg")] }], total: 1, nm: 0 })}`);
  // v2: History and Comments are one Activity tab, so the record keeps seven tabs in its strip; both addresses open it.
  const si2History = () => `${sectH("History", 3 + si2Added().length, "", co(4))}${AK.activity([
    ...si2Added().slice().reverse().map((e) => ({ who: ME, what: `added <b>${esc(e.title)}</b>, cited by REQ-064; it waits on Nadia Fournier's review`, when: AK.md(e.at) })),
    { who: "Nadia Fournier", what: `accepted <b>Account disable trigger test report - expiry, disassociation and policy violation, LRU-013</b>, collected Sep 25; renew by Mar 25, 2027`, when: "Oct 24, 2026" },
    { who: null, what: "put all 10 objectives in the draft plan 1 of <b>WS-X90 continuous monitoring — FY2027</b>", when: "Date not recorded" },
    { who: null, what: "recorded <b>REQ-064</b> mapping SI-2 whole on CN-109116 Update & Recovery Controller", when: "Date not recorded" },
  ])}${plain("Newest first. The plan and the mapping carry no date in WS-X90's records.")}`;
  const si2Comments = () => `${sectH("Comments", 1, "", co(3))}${AK.comments({ you: ME, items: [{ who: "D. Okafor", role: "Lead assessor", when: "Nov 16, 2:05 PM", text: `The one evidence version cited is an account-disable test. ${AK.mention("Joel Barrantes")}, attach the openssh-server 9.8p1 patch record so SI-2c can be judged. ${EX}` }] })}${AK.note("The comment is invented; it carries what the Evidence tab's footnote said before.")}`;
  S[si2Route("history")] = () => si2Page("history", `${si2Comments()}${si2History()}`);
  S[si2Route("comments")] = () => si2Page("comments", `${si2Comments()}${si2History()}`);

  // ════════════════ Frameworks & overlays ════════════════
  // The four reference baselines against WS-X90's stack, from mod-compliance.js (GAPS) and program_control_status.
  const BASES = [
    { id: "high", t: "NIST SP 800-53 Rev 5 High baseline", total: 370, in: 346, s: 145, p: 39, n: 52, x: 110, role: "Root of WS-X90's stack",
      miss: "AC-18 AC-18(1) AC-18(3) AC-18(4) AC-18(5) AC-20 AC-20(1) AC-20(2) AU-5(2) CP-2(2) CP-2(5) CP-3(1) CP-4(2) CP-6(2) CP-7(4) CP-8(3) CP-8(4) CP-9(2) CP-9(3) CP-10(4) IA-12(5) PE-11(1) PE-15(1) SC-12(1)" },
    { id: "moderate", t: "NIST SP 800-53 Rev 5 Moderate baseline", total: 287, in: 280, s: 123, p: 30, n: 42, x: 85, role: "Reference", miss: "AC-18 AC-18(1) AC-18(3) AC-20 AC-20(1) AC-20(2) IA-12(5)" },
    { id: "low", t: "NIST SP 800-53 Rev 5 Low baseline", total: 149, in: 147, s: 57, p: 22, n: 25, x: 43, role: "Reference", miss: "AC-18 AC-20" },
    { id: "privacy", t: "NIST SP 800-53 Rev 5 Privacy baseline", total: 96, in: 46, s: 14, p: 10, n: 6, x: 16, role: "Reference", miss: "AC-3(14) AT-3(5) AU-3(3) IR-2(3) IR-8(1) PM-3 PM-4 PM-5(1) PM-6 PM-7 PM-8 PM-9 PM-10 PM-11 PM-13 PM-14 PM-17 PM-18 PM-19 PM-20 PM-20(1) PM-21 PM-22 PM-24 PM-25 PM-26 PM-27 PM-28 PM-31 PT-1 PT-2 PT-3 PT-4 PT-5 PT-5(2) PT-6 PT-6(1) PT-6(2) PT-7 PT-7(1) PT-7(2) PT-8 RA-8 SA-8(33) SC-7(24) SI-12(1) SI-12(2) SI-18 SI-18(4) SI-19" },
  ];
  const baseById = (id) => BASES.find((b) => b.id === id) || BASES[0];
  // The layer of WS-X90's stack that removed a control (mod-compliance.js decisions); anything else was never selected.
  const REMOVED = { "CNSSI 1253 National Security System Allocation": "AU-5(2) CP-10(4) CP-2(2) CP-2(5) CP-3(1) CP-4(2) CP-6(2) CP-7(4) CP-8(3) CP-8(4) CP-9(2) CP-9(3) IA-12(5) PE-11(1) PE-15(1) SC-12(1)", "Mission Assurance Overlay": "AC-18 AC-18(1) AC-18(3) AC-18(4) AC-18(5)", "Customer A Tailoring": "AC-20 AC-20(1) AC-20(2) AC-20(3)" };
  const removedBy = (c) => Object.keys(REMOVED).find((k) => REMOVED[k].split(" ").includes(c)) || null;
  // High baseline by family, against WS-X90's control status: [code, title, in High, in WS-X90, satisfied, short of satisfied, not assessed, no requirement or evidence, left out].
  const FAMS = [["AC", "Access Control", 46, 38, 22, 5, 3, 8, 8], ["AT", "Awareness and Training", 6, 6, 1, 0, 1, 4, 0], ["AU", "Audit and Accountability", 25, 24, 15, 7, 0, 2, 1], ["CA", "Assessment, Authorization, and Monitoring", 14, 14, 5, 2, 4, 3, 0], ["CM", "Configuration Management", 32, 32, 15, 4, 7, 6, 0], ["CP", "Contingency Planning", 35, 24, 8, 3, 1, 12, 11], ["IA", "Identification and Authentication", 26, 25, 3, 2, 13, 7, 1], ["IR", "Incident Response", 18, 18, 8, 1, 1, 8, 0], ["MA", "Maintenance", 12, 12, 4, 2, 0, 6, 0], ["MP", "Media Protection", 10, 10, 1, 0, 4, 5, 0], ["PE", "Physical and Environmental Protection", 25, 23, 6, 1, 2, 14, 2], ["PL", "Planning", 7, 7, 3, 0, 1, 3, 0], ["PS", "Personnel Security", 10, 10, 4, 1, 1, 4, 0], ["RA", "Risk Assessment", 11, 11, 4, 2, 2, 3, 0], ["SA", "System and Services Acquisition", 21, 21, 8, 1, 3, 9, 0], ["SC", "System and Communications Protection", 30, 29, 17, 4, 3, 5, 1], ["SI", "System and Information Integrity", 28, 28, 16, 3, 3, 6, 0], ["SR", "Supply Chain Risk Management", 14, 14, 5, 1, 3, 5, 0]];
  const AC_HIGH = [["AC-1", "Policy and Procedures", "partially_satisfied"], ["AC-2", "Account Management", "satisfied"], ["AC-2(1)", "Automated System Account Management", "satisfied"], ["AC-2(2)", "Automated Temporary and Emergency Account Management", "satisfied"], ["AC-2(3)", "Disable Accounts", "satisfied"], ["AC-2(4)", "Automated Audit Actions", "satisfied"], ["AC-2(5)", "Inactivity Logout", "no_evidence"], ["AC-2(11)", "Usage Conditions", "no_evidence"], ["AC-2(12)", "Account Monitoring for Atypical Usage", "no_evidence"], ["AC-2(13)", "Disable Accounts for High-risk Individuals", "no_evidence"]];
  // Each layer's effect where it sits in WS-X90's stack (mod-compliance.js derive()), and the running count.
  const LAYERS = [["CNSSI 1253 National Security System Allocation", "Overlay", 201, 17, 554], ["Mission Assurance Overlay", "Overlay", 0, 5, 549], ["Deployed Platform Overlay", "Overlay", 1, 0, 550], ["Customer A Tailoring", "Overlay", 0, 4, 546], ["WS-X90 program tailoring", "Tailoring", 14, 0, 560]];
  // v2 (C1) [B9]: both header actions open their dialogs (neither is wired, and each says so when pressed).
  const fwHead = () => h.header("Frameworks & overlays", "<span>Catalog <b>NIST SP 800-53 Rev 5.1.1</b> · 1,014 active controls · 20 families</span>", `<span class="btn" role="button" tabindex="0" data-modal="v2k-import-oscal">Import OSCAL</span><span class="btn ink" role="button" tabindex="0" data-modal="v2k-create-overlay">Create overlay</span>`);
  const baseRoute = (id, tab) => `after-frameworks-${id}${tab && tab !== "controls" ? "-" + tab : ""}`;
  S["after-frameworks"] = () => h.page(
    fwHead(),
    tabs([["Baselines", 4, null, true], ["Overlays", 5, "after-frameworks-overlays"]], {}, `<span class="a-tests-tabco">${co(1)}</span>`, "Frameworks"),
    filters("Search baselines", ["Source", "Status"]),
    tbl({
      cols: ["Baseline", "In WS-X90", `With evidence${co(2)}`, "Satisfied", "Status", `Gap${co(4)}`, sr("Row actions")],
      rows: BASES.map((b, i) => ({ go: baseRoute(b.id), cells: [
        `<span class="a-tests-fwn"><b>${esc(b.t)}${i === 0 ? co(3) : ""}</b><span class="a-tests-sub">NIST SP 800-53B · release 5.1.1</span></span>`,
        of(b.in, b.total), ringPct(pct(b.in - b.x, b.total)), ringPct(pct(b.s, b.total)),
        b.id === "high" ? pill("ok", "In WS-X90's stack") : pill("none", "Reference"),
        `<span class="ak-link" ${go(baseRoute(b.id, "gap"))}>${b.miss.split(" ").length} not in WS-X90</span>`,
        more(`More actions for ${b.t}`, [["Open baseline", go(baseRoute(b.id))], ["Open its gap", go(baseRoute(b.id, "gap"))]], { cls: "a-tests-rowmore" }),
      ] })),
      total: 4,
    }),
    plain("With evidence is each baseline's controls in WS-X90's baseline less those with no requirement or evidence; Satisfied is WS-X90's control status. Exports and the gap now sit on each baseline's page."),
  );
  const OVL = [["CNSSI 1253 National Security System Allocation", 1, 201, 17, 2, true], ["Mission Assurance Overlay", 1, 3, 5, 5, true], ["Deployed Platform Overlay", 1, 3, 0, 4, true], ["Customer A Tailoring", 1, 2, 4, 2, true], ["Customer A rail integration", 1, 6, 2, 1, false]];
  S["after-frameworks-overlays"] = () => h.page(
    fwHead(),
    tabs([["Baselines", 4, "after-frameworks"], ["Overlays", 5, null, true]], {}, "", "Frameworks"),
    filters("Search overlays", ["State", "Catalog edition", "In WS-X90"]),
    tbl({
      cols: ["Overlay", "Version", "State", "Adds", "Removes", "Applied by", "In WS-X90"],
      rows: OVL.map(([t, v, a, r, ap, inW]) => ({ go: "baseline", cells: [esc(t), num(v), pill("ok", "Published"), `<span class="num a-tests-ok">+${a}</span>`, num(`−${r}`), num(`${ap} stacks`), inW ? pill("ok", "Applied") : pill("none", "Not applied")] }))
        .concat([["CNSSI 1253 Classified Information Overlay", 2, "draft", 12, 0], ["CNSSI 1253 Space Platform Overlay", 1, "published", 9, 3]].map(([t, v, st, a, r]) => ({ cells: [`${esc(t)} ${EX}`, num(v), st === "draft" ? pill("warn", "Draft") : pill("ok", "Published"), `<span class="num a-tests-ok">+${a}</span>`, num(`−${r}`), mu("0 stacks"), pill("none", "Not applied")] }))),
      total: 7,
    }),
    AK.note("The two CNSSI 1253 appendix overlays are invented rows; the other five are the workspace's library."),
  );
  function basePage(b, tab) {
    const miss = b.miss.split(" ");
    const head = AK.recordHead({ crumbs: [["Frameworks", "after-frameworks"], [b.t]], title: b.t, desc: `<span class="a-tests-chips">${AK.chip(b.role, b.id === "high" ? { tone: "info" } : {})}${AK.chip("Release 5.1.1")}${AK.chip(`${b.total} controls`)}</span>`,
      actions: `${more("More baseline actions", [[`${AK.i("down")}Export controls`, ""], [`${AK.i("down")}Export gap assessment`, ""], [`${AK.i("pen")}Edit overlays`, go("baseline")]], { text: "More" })}${co(4)}` })
      .replace(/<\/div>$/, `${tabs([["Overview", null, baseRoute(b.id, "overview"), tab === "overview"], ["Controls", b.total, baseRoute(b.id), tab === "controls"], ["Gap", miss.length, baseRoute(b.id, "gap"), tab === "gap"]], {}, `<span class="a-tests-tabco">${co(3)}</span>`, "Baseline sections")}</div>`);
    const completion = h.completion({ title: "Completion", total: b.total, done: b.s, unit: "controls satisfied", note: `${b.in} of ${b.total} in WS-X90's baseline`, minis: [["With evidence", b.in - b.x, b.total], ["Not assessed", b.n, b.total], ["Short of satisfied", b.p, b.total]] });
    const lanes = [["WS-X90 Expanded Control Set Assessment", "active", "2026-09-14", "2026-11-20", "after-audit-record"], ["WS-X90 continuous monitoring — FY2027", "active", "2026-10-01", "2027-09-30", "after-audits-index"], ["WS-X90 cooperative vulnerability identification — FY2027", "planned", "2027-01-11", "2027-02-05", "after-audits-index"]]
      .map(([t, st, a, z, r]) => h.lane(t, st, a, z).replace(/href="#[^"]*"/, `href="#${r}"`)).join("");
    const timeline = `<div class="card a-tests-tlcard"><div class="a-tests-cardh"><b>Assessment timeline</b>${pill("info", "Active")}<span class="a-tests-push">${btn("View assessments", go("after-audits-index"))}</span></div><p class="a-tests-p">Now until Nov 20: the Expanded Control Set Assessment, 3 days left.</p><div class="a-tests-lanes">${lanes}</div></div>`;
    let body;
    if (tab === "overview") {
      body = `<div class="grid2"><div class="card"><div class="t">About this baseline</div><dl class="ak-kv a-tests-kvw"><dt>Source</dt><dd>NIST SP 800-53B, release 5.1.1</dd><dt>Controls</dt><dd class="num">${b.total}</dd><dt>In WS-X90's baseline</dt><dd>${of(b.in, b.total)}</dd><dt>Role</dt><dd>${esc(b.role)}</dd></dl></div>
        <div class="card"><div class="t">${b.id === "high" ? "Layers above it in WS-X90's stack" : "WS-X90's stack"}</div>${b.id === "high" ? `<div class="a-tests-list">${LAYERS.map(([t, k, a, r, run]) => `<div class="a-tests-lrow"><span class="a-tests-grow">${esc(t)}</span>${tag(k)}<span class="num a-tests-mu">+${a} −${r} · ${run}</span></div>`).join("")}</div>` : `<p class="a-tests-p">WS-X90 starts from the High baseline. This baseline is a reference to measure it against.</p>`}</div></div>`;
    } else if (tab === "gap") {
      body = `${tbl({ cols: ["Control", "Family", "Why it is out", "Next step"], rows: miss.map((c) => { const by = removedBy(c); return { cells: [tag(c), tag(c.split("-")[0]), by ? `Removed by ${esc(by)}` : mu("Never selected by the stack"), `<span class="who">${gl("ring")}<span class="a-tests-ink">${by ? "Review the removal" : "Add by tailoring"}</span></span>`] }; }), total: miss.length, nm: 0 })}${plain("Computed from WS-X90's selected controls against this baseline's published selection.")}`;
    } else if (b.id === "high") {
      const ac = FAMS[0];
      body = `${filters("Search controls", ["Control status", "Owner"])}<div class="a-tests-fw"><nav class="a-tests-fwrail" aria-label="Control families"><div class="a-tests-rail-k">Control families</div>${FAMS.map(([c, t, n], i) => `<span class="a-tests-fwi${i ? "" : " on"}"><span><b>${c}</b> ${esc(t)}</span><span class="num">${n}</span></span>`).join("")}</nav>
        <div class="a-tests-fwmain"><div class="grid2 a-tests-fwcards">${completion}${timeline}</div>
        <section class="a-tests-fam"><div class="a-tests-famh"><h3><span class="a-tests-mu">AC</span> Access Control</h3><span class="a-tests-mu num">${ac[2]} controls · ${ac[4]} satisfied · ${ac[8]} not in WS-X90's baseline</span></div>
        ${tbl({ cols: ["Control", "Status", "Owner"], rows: AC_HIGH.map(([c, t, s]) => ({ cells: [tr(`${c} ${t}`, 340), stPill(s), AK.owner(null)] })), total: ac[2], nm: 0 })}</section>
        ${FAMS.slice(1, 6).map(([c, t, n, inn, sat, , , , out]) => `<div class="a-tests-famc"><b>${c}</b><span class="a-tests-grow">${esc(t)}</span><span class="num a-tests-mu">${n} controls · ${sat} satisfied${out ? ` · ${out} not in WS-X90's baseline` : ""}</span>${AK.i("down")}</div>`).join("")}</div></div>`;
    } else {
      body = `<div class="grid2">${completion}${timeline}</div>${plain("This prototype draws the controls family by family for the High baseline, the root of WS-X90's stack.")}`;
    }
    return h.page(head, body);
  }

  // ════════════════ Assessments ════════════════
  // assessment_campaigns, their plans, results and requests for WS-X90 (mod-compliance.js and the local database).
  // v2: Ready is a waiting state, grey like its pill (v1 drew it blue).
  const TRK = (a, r, f, i = 0, n = 0) => [["Not ready", n, "var(--line-strong)"], ["Internal review", i, "var(--warn)"], ["Ready", r, "var(--ink-4)"], ["Flagged", f, "var(--bad)"], ["Accepted", a, "var(--ok)"]];
  const tracker = (parts, title = "Request tracker", c = "") => `<div class="a-tests-box a-tests-trk"><div class="a-tests-box-t">${esc(title)}${c}</div>${stackBar(parts)}</div>`;
  const tline = (steps) => `<ol class="a-tests-tl">${steps.map(([g, t, d]) => `<li class="${g}">${g === "done" ? gl("check") : g === "now" ? gl("clock") : gl("ring")}<span><b>${esc(t)}</b><span>${d}</span></span></li>`).join("")}</ol>`;
  const resRow = (icon, title, meta, action) => `<div class="a-tests-resr">${AK.i(icon)}<span class="a-tests-grow"><b>${esc(title)}</b><span class="a-tests-sub">${meta}</span></span>${action || ""}</div>`;
  // v2 (C1): a published increment 2 and the requests the chain sent read the same on the card, the campaign and Authorization.
  const inc2Row = () => { const i2 = CH() && CH().inc2(); return i2 ? resRow("task", i2.title, `Published ${AK.md(i2.at)} by ${esc(i2.by)} · 20 findings`, btn("Download", 'data-modal="v2k-export" data-id="increment 2 results"')) : resRow("pen", "Interim results — expanded control set, increment 2", "Draft · 20 findings, Nov 11–13 · decides nothing until published", btn("Publish results", 'data-modal="a-tests-publish"', true)); };
  const chainCampBox = (cid, empty) => {
    const ch = CH(), rq = ch ? ch.requests(cid) : [];
    if (!rq.length) return `<div class="a-tests-box"><div class="a-tests-box-t">Request tracker</div><p class="a-tests-p">${empty}</p></div>`;
    const ready = rq.filter((x) => x.s.ready && !x.s.det).length, judged = rq.filter((x) => x.s.det).length, nr = rq.length - ready - judged;
    return tracker(TRK(judged, ready, 0, 0, nr), `Request tracker · ${rq.length}`);
  };
  const chainResRow = (cid) => { const ch = CH(); const r = ch && ch.results(cid), d = ch ? ch.draftDets(cid) : []; return r ? resRow("task", r.title, `Published ${AK.md(r.at)} by ${esc(r.by)} · ${r.n} determination${r.n === 1 ? "" : "s"}`) : d.length ? resRow("pen", "Results — draft", `Draft · ${d.length} determination${d.length === 1 ? "" : "s"} · decides nothing until published`, btn("Publish results", `data-modal="v2k-publish" data-id="${esc(cid)}"`, true)) : resRow("task", "No results yet", "Results join the card once the assessor records findings"); };
  function campCard(cid, c = () => "") {
    if (cid === "exp") return `<div class="card a-tests-camp"><div class="a-tests-camp-h"><div><span class="a-tests-camp-t">WS-X90 Expanded Control Set Assessment${c(1)}</span><div class="a-tests-chips">${pill("info", "Active")}${AK.chip("Control assessment")}${AK.chip("Security assessment plan — expanded control set · version 1")}</div></div>
        <div class="a-tests-camp-r"><span class="a-tests-ppl">${avs(["D. Okafor", "Nadia Fournier"])}<span class="a-tests-mu">Lead assessor and assessor</span></span>${btn("Open campaign", go("after-audit-record"))}${more("More campaign actions", [["Export requests", 'data-modal="v2k-export" data-id="requests"'], ...(CH() && CH().inc2() ? [] : [["Publish results", 'data-modal="a-tests-publish"']])])}</div></div>
      <div class="a-tests-camp-b"><div class="a-tests-box"><div class="a-tests-box-t">Timeline</div>${tline([["done", "Plan published", "Sep 8, 2026"], ["done", "Window opens", "Sep 14, 2026"], ["now", "Window closes", `Nov 20, 2026 · ${days("2026-11-20")} days left`]])}</div>${tracker(TRK(226, 88, 54), "Request tracker · 368")}</div>
      <div class="a-tests-res"><div class="a-tests-res-t">Results${c(4)}</div>${resRow("task", "Security assessment report — expanded control set, increment 1", "Published Nov 12 by D. Okafor · 225 findings", btn("Download", 'data-modal="v2k-export" data-id="increment 1 report"'))}${inc2Row()}</div></div>`;
    if (cid === "conmon") return `<div class="card a-tests-camp"><div class="a-tests-camp-h"><div><span class="a-tests-camp-t">WS-X90 continuous monitoring — FY2027</span><div class="a-tests-chips">${pill("info", "Active")}${AK.chip("Control assessment")}${AK.chip("Continuous monitoring plan — FY2027 · version 1 · Draft")}</div></div>
        <div class="a-tests-camp-r"><span class="a-tests-ppl">${avs(["D. Okafor", "Priya Raghavan"])}<span class="a-tests-mu">Lead assessor and owner</span></span>${btn("Open campaign", go("campaign-conmon"))}</div></div>
      <div class="a-tests-camp-b"><div class="a-tests-box"><div class="a-tests-box-t">Timeline</div>${tline([["todo", "Plan", "Version 1, a draft"], ["done", "Window opens", "Oct 1, 2026"], ["todo", "Window closes", "Sep 30, 2027"]])}</div>${chainCampBox("conmon", `No requests yet. The draft plan holds 10 objectives (SI-2) and 14 scheduled tasks; the next is the mission network scan, ${dueCell("2026-11-15", "overdue")}.`)}</div>
      <div class="a-tests-res">${chainResRow("conmon")}</div></div>`;
    if (/^new\d+$/.test(cid)) { const k = CH() && CH().camp(cid); if (!k) return ""; return `<div class="card a-tests-camp"><div class="a-tests-camp-h"><div><span class="a-tests-camp-t">${esc(k.title)}</span><div class="a-tests-chips">${pill("none", "Planned")}${AK.chip("Control assessment")}${AK.chip(k.plan)}</div></div>
        <div class="a-tests-camp-r"><span class="a-tests-ppl">${avs(["D. Okafor", ME])}<span class="a-tests-mu">Lead assessor and owner</span></span>${btn("Open campaign", go(k.route))}</div></div>
      <div class="a-tests-camp-b"><div class="a-tests-box"><div class="a-tests-box-t">Timeline</div>${tline([["todo", "Plan", "Version 1, a draft"], ["todo", "Window opens", AK.md(k.from)], ["todo", "Window closes", AK.md(k.to)]])}</div>${chainCampBox(cid, "No requests yet. A control added from its own page sends a request for its evidence here.")}</div>
      <div class="a-tests-res">${chainResRow(cid)}</div></div>`; }
    // v2 F (B1, the re-review's new medium): the card's Plan an assessment gives this planned campaign its first plan (a draft on
    // SSP 2, kept in chain.camps as "cvi"), so the card then opens its campaign; the header's plans a new campaign.
    if (cid === "cvi" && CH() && CH().camp("cvi")) { const k = CH().camp("cvi"); return `<div class="card a-tests-camp"><div class="a-tests-camp-h"><div><span class="a-tests-camp-t">${esc(k.title)}</span><div class="a-tests-chips">${pill("none", "Planned")}${AK.chip("Cyber test · CVI")}${AK.chip(k.plan)}</div></div>
        <div class="a-tests-camp-r"><span class="a-tests-ppl">${avs(["Ingrid Solberg"])}<span class="a-tests-mu">Owner</span></span>${btn("Open campaign", go(k.route))}</div></div>
      <div class="a-tests-camp-b"><div class="a-tests-box"><div class="a-tests-box-t">Timeline</div>${tline([["done", "Plan", "Version 1, a draft"], ["todo", "Window opens", AK.md(k.from)], ["todo", "Window closes", AK.md(k.to)]])}</div>${chainCampBox("cvi", "No requests yet. Controls join its draft plan from their own pages.")}</div>
      <div class="a-tests-res">${chainResRow("cvi")}</div></div>`; }
    if (cid === "cvi") return `<div class="card a-tests-camp"><div class="a-tests-camp-h"><div><span class="a-tests-camp-t">WS-X90 cooperative vulnerability identification — FY2027</span><div class="a-tests-chips">${pill("none", "Planned")}${AK.chip("Cyber test · CVI")}<span class="a-tests-mu num">Jan 11 – Feb 5, 2027</span></div></div>
        <div class="a-tests-camp-r"><span class="a-tests-ppl">${avs(["Ingrid Solberg"])}<span class="a-tests-mu">Owner</span></span>${btn("Plan an assessment", 'data-modal="a-tests-plan"')}</div></div>
      <div class="a-tests-res">${resRow("task", "No plan yet", "Plan an assessment to give it objectives and requests")}</div></div>`;
    return `<div class="card a-tests-camp"><div class="a-tests-camp-h"><div><span class="a-tests-camp-t">WS-X90 Initial Authorization Security Assessment</span><div class="a-tests-chips">${pill("ok", "Completed")}${AK.chip("Control assessment")}${AK.chip("Security assessment plan — initial authorization · version 1")}</div></div>
        <div class="a-tests-camp-r"><span class="a-tests-ppl">${avs(["D. Okafor"])}<span class="a-tests-mu">Lead assessor</span></span></div></div>
      <div class="a-tests-camp-b"><div class="a-tests-box"><div class="a-tests-box-t">Timeline</div>${tline([["done", "Plan published", "Jul 28, 2026"], ["done", "Window opens", "Aug 3, 2026"], ["done", "Window closes", "Aug 21, 2026"]])}</div><div class="a-tests-box"><div class="a-tests-box-t">Determinations · 68</div>${stackBar([["Satisfied", 50, "var(--ok)"], ["Partially", 13, "var(--warn)"], ["Other than", 4, "var(--bad)"], ["Not assessed", 1, "var(--ink-4)"]])}</div></div>
      <div class="a-tests-res">${resRow("task", "Security assessment report — initial authorization", "Published Aug 28 by D. Okafor · 68 findings", btn("Download", 'data-modal="v2k-export" data-id="initial authorization report"'))}</div></div>`;
  }
  // v2 (C1) [B7]: the head counts what the tabs list: the Active tab holds the running campaigns and the planned ones.
  const planned = () => (CH() ? CH().camps().filter((k) => /^new/.test(k.id)) : []);
  const asHead = (c = "") => h.header("Assessments", `<span>${4 + planned().length} campaigns · 2 running, ${1 + planned().length} planned, 1 completed</span><span>Lead assessor <b>D. Okafor</b></span>`, `<span class="btn" role="button" tabindex="0" ${go("after-audits-index-assessor")}>Open assessor's view</span>${c}<span class="btn ink" role="button" tabindex="0" data-modal="v2k-plan" data-id="">Plan an assessment</span>`);
  S["after-audits-index"] = () => h.page(
    asHead(co(5)),
    tabs([["Active", 3 + planned().length, null, true], ["Completed", 1, "after-audits-index-completed"]], {}, `<span class="a-tests-tabco">${co(2)}</span>`, "Campaigns"),
    filters("Search campaigns", ["Kind", "Lead assessor", ["Assigned to me", co(3)]]),
    `<div class="a-tests-camps">${campCard("exp", co)}${campCard("conmon")}${planned().map((k) => campCard(k.id)).join("")}${campCard("cvi")}</div>`,
    plain("The Active tab keeps the planned campaigns beside the two running, as an upcoming audit stays on Vanta's Active tab."),
  );
  S["after-audits-index-completed"] = () => h.page(
    asHead(),
    tabs([["Active", 3, "after-audits-index"], ["Completed", 1, null, true]], {}, "", "Campaigns"),
    filters("Search campaigns", ["Kind", "Lead assessor"]),
    `<div class="a-tests-camps">${campCard("init")}</div>`,
  );
  S["after-audits-index-assessor"] = () => h.page(
    h.header("D. Okafor's campaigns", "<span>Lead assessor · WS-X90 Sentinel Mission System</span>", `<span class="btn" role="button" tabindex="0" ${go("after-audits-index")}>Back to the program's view</span>`),
    `<div class="a-tests-stats">${[["clock", "Active", 2], ["calendar", "Planned", 1 + planned().length], ["pen", "Results to publish", (CH() && CH().inc2() ? 0 : 1) + (CH() && CH().draftDets("conmon").length ? 1 : 0)], ["check", "Completed", 1]].map(([i, l, n], k) => `<div class="a-tests-stat"><span class="a-tests-stat-i">${AK.i(i)}</span><span><span class="a-tests-mu">${l}</span><b class="num">${n}</b></span>${k === 0 ? co(5) : ""}</div>`).join("")}</div>`,
    filters("Search campaigns", ["Program", "Status", "Kind"]),
    tbl({
      cols: ["Campaign", "Status", "Requests ready", "Window", "Assessors", sr("Open")],
      // v2 (C1) [B11]: each Open opens the campaign it names; a campaign with no page of its own has no Open.
      rows: [
        { go: "after-audit-record", cells: [tr("WS-X90 Expanded Control Set Assessment", 320), pill("info", "Active"), `<span class="a-tests-prog">${bar(pct(88, 368), "var(--info)")}<span class="num">88 of 368</span></span>`, num("Sep 14 – Nov 20"), avs(["D. Okafor", "Nadia Fournier"]), btn("Open", go("after-audit-record"))] },
        { go: "campaign-conmon", cells: [tr("WS-X90 continuous monitoring — FY2027", 320), pill("info", "Active"), CH() && CH().requests("conmon").length ? num(`${CH().requests("conmon").filter((x) => x.s.ready).length} of ${CH().requests("conmon").length}`) : mu("No requests yet"), num("Oct 1 – Sep 30, 2027"), avs(["D. Okafor"]), btn("Open", go("campaign-conmon"))] },
        ...planned().map((k) => ({ go: k.route, cells: [tr(k.title, 320), pill("none", "Planned"), CH().requests(k.id).length ? num(`${CH().requests(k.id).filter((x) => x.s.ready).length} of ${CH().requests(k.id).length}`) : mu("No requests yet"), num(`${AK.md(k.from)} – ${AK.md(k.to)}`), avs(["D. Okafor"]), btn("Open", go(k.route))] })),
        { cells: [tr("WS-X90 cooperative vulnerability identification — FY2027", 320), pill("none", "Planned"), mu("No plan yet"), num("Jan 11 – Feb 5, 2027"), avs(["D. Okafor"]), mu("")] },
        { cells: [tr("WS-X90 Initial Authorization Security Assessment", 320), pill("ok", "Completed"), mu("Results published Aug 28"), num("Aug 3 – Aug 21"), avs(["D. Okafor"]), mu("")] },
      ],
      total: 4 + planned().length, nm: 0,
    }),
  );

  // ════════════════ The Expanded Control Set Assessment ════════════════
  // Fourteen of its 368 requests: the evidence its controls rest on, with the real review states, reviewers and times.
  const ACC = "Matches the requirement's acceptance criteria and the Block 1 configuration.";
  const REV = "Shows the requirement not met on at least one of its components; resubmit once the finding is closed.";
  const REQUESTS = [
    ["r1", "AC-17(3)", "Managed Access Control Points", "Approved WS-X90 external network baseline showing the single managed access control point", null, "accepted", "satisfied", "Document", "2026-11-09", "Nov 11, 14:00", "2026-11-12", "Approved network baseline and the release boundary scan output confirming one external remote access path through LRU-007 to LRU-014 and no externally reachable listening remote access service on any other LRU."],
    ["r2", "AC-17(4)", "Privileged Commands and Access", "Remote privileged command admission test report, approved list, attestation and window checks", null, "needs_revision", "partially_satisfied", "Test record", "2026-11-10", "Nov 11, 09:00", "2026-11-18", "Test report exercising the three admission checks at LRU-014 with reason codes captured on each refusal, including the off-list command refusal and the failed-attestation laptop case, and recording the out-of-window command that was logged but admitted."],
    ["r3", "AC-17(9)", "Disconnect or Disable Access", "Remote access disconnect and disable test report, 30-second boundary", "Joel Barrantes", "pending", null, "Test record", "2026-11-12", null, "2026-11-14", "Test report timing the operator disconnect action from LRU-014 through to LRU-007 ceasing to forward remote access traffic, with all live sessions terminated inside the 30-second bound and neither LRU rebooted."],
    ["r4", "AC-2(7)", "Privileged User Accounts", "Privileged role table and membership change log export, LRU-013", "Priya Raghavan", "pending", null, "Dataset", "2026-10-07", null, "2026-11-14", "Export of the four approved privileged role definitions with their membership, confirming no account carries a privilege attribute outside a role, together with the 60-day membership change log."],
    ["r5", "AU-14", "Session Audit", "Nonlocal maintenance session transcript sample, LRU-014, three sessions", "Joel Barrantes", "pending", null, "Document", "2026-11-02", null, "2026-11-14", "Three session transcripts forwarded from the Maintenance Access Gateway (LRU-014) to the Security Log Collector (LRU-018), one of them terminated abnormally, reconciled against the gateway session register."],
    ["r6", "CA-3", "Information Exchange", "External exchange agreement register with interim-approval exceptions", null, "needs_revision", "partially_satisfied", "Document", "2026-11-10", "Nov 13, 09:00", "2026-11-18", "Register mapping each enabled LRU-007 exchange and the LRU-008 tactical data link to a signed agreement identifier, with the ground-support telemetry exchange listed under a dated interim approval."],
    ["r7", "CM-8(4)", "Accountability Information", "Component inventory accountability field export, all 20 WS-X90 line replaceable units", "Joel Barrantes", "pending", null, "Dataset", "2026-10-28", null, "2026-11-14", "Repository export showing the accountable position or role on every component record, the refusal of a new record submitted with the field empty, and the six records still carrying the inherited default."],
    ["r8", "CM-11(2)", "Software Installation with Privileged Status", "Installation privilege elevation test, LRU-019 maintenance session to LRU-001", null, "accepted", "satisfied", "Test record", "2026-11-06", "Nov 11, 09:00", "2026-11-12", "Test record showing an installation refused from an unelevated session, an elevation expiring automatically at the end of its bounded window, and the installation record naming identity, window and package identifier."],
    ["r9", "CM-12", "Information Location", "Protected information location map and location-change log, LRU-001 and LRU-015", "Priya Raghavan", "pending", null, "Document", "2026-11-15", null, "2026-11-14", "Information location map export naming the components and access roles for each protected information class, with the dated location-change records produced by a rehearsed relocation exercise."],
    ["r10", "CM-14", "Signed Components", "Boot chain signature verification test, out-of-set certificate injection on LRU-002", null, "accepted", "satisfied", "Test record", "2026-09-22", "Nov 12, 14:00", "2026-11-12", "Test record showing a firmware image signed outside the approved certificate set halting the LRU in its recovery state, with the recovery record naming the failing component and the presenting certificate."],
    ["r11", "IA-2(2)", "Multi-factor Authentication to Non-privileged Accounts", "Non-privileged authentication method inventory, LRU-019 and LRU-017 baselines", null, "needs_revision", "other_than_satisfied", "Test record", "2026-09-29", "Nov 13, 09:00", "2026-11-16", "Test report enumerating every offered authentication method on the Maintenance Laptop (LRU-019) and the Provisioning Workstation (LRU-017), including the disconnected flightline path, and recording which paths still accept a password-only logon."],
    ["r12", "IA-2(8)", "Access to Accounts — Replay Resistant", "Replay resistance test report, LRU-007 gateway and LRU-008 link authentication", null, "accepted", "satisfied", "Test record", "2026-10-06", "Nov 13, 14:00", "2026-11-12", "Test report replaying captured privileged authentication exchanges against the Protected Network Gateway (LRU-007) and the Tactical Data Radio (LRU-008), showing refusal under the replay-detected reason code."],
    ["r13", "IA-3(1)", "Cryptographic Bidirectional Authentication", "Switch port authentication state export, LRU-009 with LRU-002 boot measurement bindings", null, "needs_revision", "partially_satisfied", "Dataset", "2026-10-13", "Nov 13, 09:00", "2026-11-18", "Per-port authentication state export from the Internal Ethernet Switch (LRU-009) showing certificate subjects, quarantine VLAN assignments and the Secure Boot Controller (LRU-002) measurement result that released each device credential."],
    ["r14", "IA-12", "Identity Proofing", "Registration authority identity proofing walkthrough record, LRU-017", "Joel Barrantes", "pending", null, "Document", "2026-11-12", null, "2026-11-14", "Walkthrough record of the identity proofing procedure performed at the Provisioning Workstation (LRU-017), listing the assurance level applied per role and the collection, validation and verification steps."],
  ];
  const reqById = (id) => REQUESTS.find((r) => r[0] === id) || REQUESTS[1];
  // v2: one status a request, in the tracker's words (Not ready, Internal review, Ready, Flagged, Accepted). Ready means
  // the team is done and the request waits on the assessor; the assessor flags or accepts it.
  const teamPill = () => pill("none", "Ready");
  const asPill = (r) => (r[5] === "accepted" ? pill("ok", "Accepted") : r[5] === "needs_revision" && !READY[r[0]] ? pill("bad", "Flagged") : pill("none", "Ready"));
  // v2 (C1): a flagged request the team set Ready again leaves Flagged for Ready in the tracker and the quick views too.
  const reReady = () => REQUESTS.filter((r) => r[5] === "needs_revision" && READY[r[0]]).length;
  const detText = (r) => (r[6] ? `<span class="a-tests-ink">${esc(ST[r[6]][1])}</span>` : mu("—"));
  // v2: a due date is toned only once it is overdue; a request the team has handed over shows its day plainly.
  const reqDue = (r) => (r[5] === "needs_revision" && days(r[10]) < 0 ? AK.due(r[10], { prefix: false }) : AK.due(r[10], { done: true, prefix: false }));
  const reqRoute = (id, tab) => `after-audit-record-${id}${tab && tab !== "evidence" ? "-" + tab : ""}`;
  // The 20 findings of increment 2 (draft): the evidence each cites and how much of it the assessor accepted, and the
  // sentence of the finding that carries its justification.
  const INC2 = [
    ["AC-17(3)", "satisfied", 1, 1, "The approved network baseline shows exactly one external remote access path — the boundary gateway forwarding to the maintenance gateway — and the release boundary scan found no externally reachable listening remote access service on any other LRU."],
    ["AC-17(4)", "partially_satisfied", 0, 1, "The third check is not a check: an out-of-window privileged command was logged and then admitted, so the scheduled maintenance window bounds the record rather than the access."],
    ["AU-6(3)", "satisfied", 0, 1, "Retested against the closed finding: maintenance session transcripts now sit in the correlation key space."],
    ["AU-12(1)", "satisfied", 0, 1, "Rerun after the switch change landed: the internal switch now stamps its own source time on the records it relays."],
    ["CA-3", "partially_satisfied", 0, 1, "The ground-support telemetry exchange is live today under a time-bounded interim approval with its agreement still in draft."],
    ["CM-8(2)", "satisfied", 1, 1, "Daily inventory currency figures are retrievable for each of the last thirty operating days, computed only from automated observations."],
    ["CM-11(2)", "satisfied", 1, 1, "An installation attempted from an unelevated maintenance session was refused outright, and the elevation expired at the end of its bounded window."],
    ["CM-12(1)", "not_assessed", 0, 0, "The discovery capability that would scan the exported data sets is not built, so there is no scheduled run to evidence."],
    ["CM-14", "satisfied", 1, 1, "A firmware image signed by a certificate outside the approved set halted the affected LRU in its recovery state rather than continuing."],
    ["IA-1", "satisfied", 1, 1, "Revision 2.4 came back with the System Security Engineer named as the designated official and no overdue flag standing anywhere in the set."],
    ["IA-2(1)", "satisfied", 1, 1, "A privileged login presenting only the PIN, or only the hardware credential, was refused outright with no reduced-privilege session offered."],
    ["IA-2(2)", "other_than_satisfied", 0, 1, "Disconnected, the laptop does not enforce the pair: a local password-only logon remains available on the flightline as an availability concession."],
    ["IA-2(6)", "satisfied", 1, 1, "The gateway required the separate hardware token on its local console, its network path and its remote support path for both account types."],
    ["IA-2(8)", "satisfied", 1, 1, "A captured privileged authentication exchange replayed against the gateway derived no session key and was refused under the replay-detected reason code."],
    ["IA-2(12)", "not_assessed", 0, 1, "The run stopped before the indeterminate-status case could be driven against the laptop, so the determination waits on a rerun."],
    ["IA-3(1)", "partially_satisfied", 0, 1, "The exchange is not mutual everywhere it claims to be: two attached devices completed the link without validating the switch's certificate."],
    ["IR-9", "satisfied", 1, 1, "The declared spill blocked every external session for the affected enclave and isolated the contaminated port well inside the ten minute threshold."],
    ["MA-3(5)", "partially_satisfied", 0, 1, "The detection half does not exist: a privileged invocation seeded outside any open work order produced its audit record and no alert."],
    ["SC-28(3)", "satisfied", 1, 1, "Every key in the platform inventory resolved to a hardware key store slot, and no command in the fielded set returned plaintext key material."],
    ["SR-10", "satisfied", 1, 1, "All twenty-four units received in the period carry a signed receiving inspection record dated before their stock entry."],
  ];
  const FAM1 = [["SC", 33, 21, 2, 4, 6], ["SA", 31, 11, 2, 1, 17], ["AC", 23, 16, 3, 0, 4], ["SI", 23, 16, 1, 2, 4], ["AU", 17, 10, 3, 1, 3], ["CM", 17, 11, 3, 0, 3], ["IR", 15, 6, 2, 0, 7], ["PE", 11, 4, 0, 1, 6], ["CP", 11, 6, 2, 0, 3], ["PS", 8, 5, 1, 0, 2], ["RA", 8, 3, 1, 0, 4], ["SR", 8, 5, 0, 0, 3]];
  const campHead = (tab) => factsCo(AK.recordHead({ crumbs: [["Assessments", "after-audits-index"], ["Expanded Control Set Assessment"]], title: "Expanded Control Set Assessment",
    actions: `${more("More campaign actions", [["Export requests", 'data-modal="v2k-export" data-id="requests"'], ["Leave assessment", go("after-audits-index")]])}${CH() && CH().inc2() ? `<span class="btn" aria-disabled="true" title="Increment 2 was published ${AK.md(CH().inc2().at)}">Results published</span>` : btn("Publish results", 'data-modal="a-tests-publish"', true)}`,
    facts: [["Kind", AK.chip("Control assessment")], ["Status", pill("info", "Active")], ["Window", `Sep 14 – Nov 20 ·&nbsp;<b>${days("2026-11-20")} days left</b>`], ["Plan", `<span title="Security assessment plan — expanded control set">Version 1, published Sep 8</span>`], ["Lead assessor", AK.owner("D. Okafor")], ["Assessor", AK.owner("Nadia Fournier")]] }), tab === "requests" ? co(1) : "")
    .replace(/<\/div>$/, `${tabs([["Requests", 368, "after-audit-record", tab === "requests"], ["Findings", 245, "after-audit-record-findings", tab === "findings"]], tab === "requests" ? { Findings: 7 } : {}, "", "Campaign sections")}</div>`);
  S["after-audit-record"] = () => {
    const key = "req";
    // v2: nothing is ticked when the page opens; the selection bar replaces the filters only once a row is ticked.
    const s = sel(key);
    // v2 (C1): the quick views are filters: each keeps the sample rows in its status, and the table counts the view's total.
    const stOf = (r) => (r[5] === "accepted" ? "accepted" : r[5] === "needs_revision" && !READY[r[0]] ? "flagged" : "ready");
    const VIEWS = [["all", "All", 368], ["ready", "Ready", 88 + reReady()], ["flagged", "Flagged", 54 - reReady()], ["accepted", "Accepted", 226]];
    const shownReq = REQUESTS.filter((r) => CQV === "all" || stOf(r) === CQV);
    const ids = shownReq.map((r) => r[0]);
    const viewsHtml = `<div class="views" role="group" aria-label="Quick views">${VIEWS.map(([k2, l, n]) => `<span class="qv${k2 === CQV ? " on" : ""}" role="button" tabindex="0" aria-pressed="${k2 === CQV}" data-atqv="${k2}">${esc(l)} <span class="num">${fmt(n)}</span></span>`).join("")}</div>`;
    // v2: the tracker and the quick views count the same 368 requests, in the same words (v1: tracker 368, All 14).
    return h.page(
      campHead("requests"),
      tracker(TRK(226, 88 + reReady(), 54 - reReady()), "Request tracker · 368", co(2)),
      viewsHtml,
      s.size ? bulkBar(key, "Search requests", s.size, ["Set Ready", "Assign owner"], { c: co(6), attrs: { "Set Ready": `data-modal="a-tests-ready" data-id="${[...s].join(",")}"`, "Assign owner": `data-modal="a-tests-owner" data-id="${s.size} requests"` } })
        : filters("Search requests", ["Control", "Owner", "Status", "Due date"]),
      tbl({
        cols: [cbAll(key, ids, "Select every request shown"), "Request", "Control", "Owner", "Status", "Determination", `Due date ${EX}${co(3)}`],
        rows: shownReq.map((r) => ({ id: r[0], go: reqRoute(r[0]), sel: s.has(r[0]), cells: [
          cb(key, r[0], s.has(r[0]), `Select ${r[3]}`),
          `<span class="a-tests-name">${tr(r[3], 260)}${r[5] !== "pending" ? `<span class="a-tests-cmt" title="1 assessor comment">${AK.i("chat")}1</span>` : ""}</span>`,
          tag(r[1]), AK.owner(r[4]), `${asPill(r)}${r[0] === "r2" ? co(4) + co(5) : ""}`, detText(r), reqDue(r),
        ] })),
        total: (VIEWS.find((x) => x[0] === CQV) || VIEWS[0])[2],
      }),
      AK.note("Due dates are invented: WS-X90 records none for a request. Review states, reviewers and the determinations of the draft increment 2 are WS-X90's; the team's Ready is read from each evidence version being under review."),
    );
  };
  S["after-audit-record-findings"] = () => {
    const one = INC === "1";
    const det = one ? [124, 21, 9, 71] : [13, 4, 1, 2];
    const t = det.reduce((a, b) => a + b, 0);
    const i2 = CH() && CH().inc2(); // v2 (C1): increment 2 once published
    return h.page(
      campHead("findings"),
      `<div class="a-tests-box a-tests-trk"><div class="a-tests-box-t">Determination tracker · ${one ? "increment 1, published Nov 12" : i2 ? `increment 2, published ${AK.md(i2.at)}` : "increment 2, draft"}${co(7)}<span class="a-tests-push"><span class="a-tests-seg" role="group" aria-label="Increment"><button type="button" aria-pressed="${one}" data-atinc="1">Increment 1 · 225</button><button type="button" aria-pressed="${!one}" data-atinc="2">Increment 2 · ${i2 ? "" : "draft, "}20</button></span></span></div>${stackBar([["Satisfied", det[0], "var(--ok)"], ["Partially", det[1], "var(--warn)"], ["Other than", det[2], "var(--bad)"], ["Not assessed", det[3], "var(--ink-4)"]])}<p class="note-p num">${one ? `${t} findings judged by Nadia Fournier on each control's statement, published by D. Okafor.` : i2 ? `${t} findings by Nadia Fournier, Nov 11–13, published ${AK.md(i2.at)} by ${esc(i2.by)}: WS-X90's control statuses read them now.` : `${t} findings by Nadia Fournier, Nov 11–13. A draft decides nothing until it is published.`}</p></div>`,
      filters("Search findings", ["Determination", "Family", "Requests accepted"]),
      one
        ? tbl({ cols: ["Family", "Findings", "Satisfied", "Partially", "Other than", "Not assessed"], rows: FAM1.map(([f, n, s2, p, o, x]) => ({ cells: [tag(f), num(n), num(s2), p ? `<span class="num a-tests-warn">${p}</span>` : mu("0"), o ? `<span class="num a-tests-bad">${o}</span>` : mu("0"), x ? num(x) : mu("0")] })), total: 16, nm: 0 })
        : tbl({ cols: ["Control", "Determination", "Requests accepted", "Justification", "Assessor"], rows: INC2.map(([c, d, a, n, j]) => ({ cells: [tag(c), stPill(d), n ? `<span class="a-tests-prog">${AK.progress(a, n, "")}</span>` : mu("None cited"), tr(j, 400), AK.owner("Nadia Fournier")] })), total: 20, nm: 0 }),
      plain(one ? "Increment 1 is counted by family; switch to increment 2 for each finding with its requests and justification." : "Requests accepted counts the evidence each finding cites that the assessor accepted. The justification is the finding's own sentence about what it found."),
    );
  };
  const reqTabs = (r) => [["evidence", "Evidence", 1], ["objectives", "Objectives"], ["activity", "Activity", r[5] === "pending" ? 1 : 2], ["comments", "Assessor comments", r[5] === "pending" ? 0 : 1], ["internal", "Internal comments", 0]];
  const AC174 = [["AC-17(04)(a)[01]", "the execution of privileged commands via remote access is authorized only in a format that provides assessable evidence"], ["AC-17(04)(a)[02]", "access to security-relevant information via remote access is authorized only in a format that provides assessable evidence"], ["AC-17(04)(a)[03]", "the execution of privileged commands via remote access is authorized only for the following needs: [needs]"], ["AC-17(04)(a)[04]", "access to security-relevant information via remote access is authorized only for the following needs: [needs]"], ["AC-17(04)(b)", "the rationale for remote access is documented in the security plan for the system"]];
  function requestPage(r, tab) {
    const flagged = r[5] === "needs_revision", acc = r[5] === "accepted";
    const setStatus = more("Set status", [[`${pill("none", "Not ready")}`, ""], [`${pill("warn", "Internal review")}`, ""], [`${pill("info", "Ready")}`, ""], ["Who sets what: the team moves a request from Not ready through Internal review to Ready; only the assessor flags or accepts it, with a determination and a justification.", "", "help"]], { text: "Set status", sm: true });
    const head = factsCo(AK.recordHead({ back: ["Requests", "after-audit-record"], title: r[3], desc: esc(r[11]),
      actions: `${setStatus}${btn("Flag", `data-modal="a-tests-assess" data-id="${r[0]}|flag"`)}${btn("Accept", `data-modal="a-tests-assess" data-id="${r[0]}|accept"`, true)}`,
      facts: [["Status", asPill(r)], ["Determination", detText(r)], ["Control", `<span class="ak-code">${r[1]}</span><span class="a-tests-in">${esc(r[2])}</span>`], ["Owner", ownerPick(r[4], r[3])], ["Due date", `${reqDue(r)}<span class="a-tests-in">${EX}</span>`], ["Evidence", `Version 1 · ${esc(r[7].toLowerCase())}`]] }))
      .replace(/<\/div>$/, `${tabs(reqTabs(r).map(([k, l, n]) => [l, n, reqRoute(r[0], k), k === tab]), { Activity: 5, "Assessor comments": 4 }, "", "Request sections")}</div>`);
    const thread = flagged || acc ? [{ who: "Nadia Fournier", role: "Assessor", when: r[9], flag: flagged ? `Flagged · ${ST[r[6]][1]}` : "", text: `${acc ? `<b>Accepted · ${ST[r[6]][1]}.</b> ` : ""}${flagged ? REV : ACC}` }] : [];
    let body;
    if (tab === "objectives") {
      body = `${sectH("Objectives", null)}<p class="a-tests-p">The plan holds ${esc(r[1])} by its statement, which covers every objective under it${r[6] ? `; the draft increment 2 judges it ${esc(ST[r[6]][1].toLowerCase())}` : ""}.</p>${r[1] === "AC-17(4)" ? `<div class="a-tests-list">${AC174.map(([l, t]) => `<div class="a-tests-lrow"><span class="ak-code">${l}</span><span class="a-tests-grow">${esc(t)}</span>${r[6] ? stPill(r[6]) : pill("none", "Not judged")}</div>`).join("")}</div>` : plain("This prototype lists the objectives for AC-17(4).")}`;
    } else if (tab === "activity") {
      const items = [{ who: null, what: `recorded version 1, a ${esc(r[7].toLowerCase())} collected ${md(r[8])}, and put it before the assessor`, when: md(r[8]) }];
      if (r[9]) items.push({ who: "Nadia Fournier", what: `${flagged ? "flagged the request" : "accepted the request"}: ${flagged ? REV : ACC}`, when: r[9] });
      body = `${sectH("Activity", items.length)}${AK.activity(items)}`;
    } else if (tab === "comments") {
      body = `${sectH("Assessor comments", thread.length)}${AK.comments({ items: thread, you: ME, external: true, review: ["Request assessor review.", "Checking this box sets the team status to Ready."] })}`;
    } else if (tab === "internal") {
      body = `${sectH("Internal comments", 0)}${AK.comments({ items: [], you: ME, placeholder: "Comment for the team or add others with @…" })}${plain("Only the program's team reads this thread; the assessor does not.")}`;
    } else {
      body = `<div class="ak-shared"><div class="ak-shared-h"><b>Shared with the assessor <span class="num">1</span></b><span class="s">Collected ${dfull(r[8])}</span></div><div class="ak-shared-r">${AK.check(false)}${AK.i("link")}<span class="x"><b>${esc(r[3])}</b><span class="s">${esc(r[7])} · version 1 · collected ${dfull(r[8])}</span></span></div></div>`;
    }
    return h.page(head, body, AK.note("The request's due date is invented. Its evidence, review, reviewer, time and rationale are WS-X90's."));
  }

  // ════════════════ Dialogs ════════════════
  const field = (label, control, hint = "", flag = "") => `<div class="ak-field"><label>${esc(label)}${flag}</label>${control}${hint ? `<span class="s">${hint}</span>` : ""}</div>`;
  const reqd = ' <span class="req">Required</span>', opt = ' <span class="opt">Optional</span>';
  const radio = (label, on, hint = "") => `<div class="a-tests-radio${on ? " on" : ""}"><span class="a-tests-dot" aria-hidden="true"></span><span>${label}${hint ? `<small>${hint}</small>` : ""}</span></div>`;
  const foot = (primary, attrs = "") => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-close-modal ${attrs}>${esc(primary)}</button>`;
  const PEOPLE = [["Priya Raghavan", "ISSO"], ["Joel Barrantes", "ISSM"], ["Ray Colston", "System owner"], ["Victor Amsel", "Engineer"], ["D. Okafor", "Lead assessor"], ["Nadia Fournier", "Assessor"]];
  M["a-tests-owner"] = (id) => ({ title: "Assign owner", body: `<p class="ak-desc">${esc(id ? `Give ${id} one owner, a person or an organization. It replaces any owner now.` : "Choose an owner.")}</p>${AK.ownerPicker({ you: ME, people: PEOPLE })}`, footer: foot("Assign owner") });
  M["a-tests-deactivate"] = (id) => {
    const [cid, item] = String(id || "scan").split("|");
    const many = cid.split(",").filter(Boolean);
    const x = checkById(many[0]);
    const one = item !== undefined;
    return { title: one ? "Deactivate monitoring for this item" : many.length > 1 ? `Deactivate ${many.length} checks` : "Deactivate check", body: `<p class="ak-desc">${esc(one ? `${x.name}: ${String(x.items[+item] ? x.items[+item].t : "this item").replace(/<[^>]+>/g, "").replace("Example", "").trim()}` : many.map((m) => checkById(m).name).join("; "))}</p>
      ${field("Duration", `<div class="a-tests-radios">${radio("Indefinitely", false)}${radio("Until a date", true, `Dec 1, 2026 ${EX}: it switches back on by itself`)}</div>`)}
      ${field("Reason for deactivation", `<div class="ak-input tall">Tell the team and the assessor why this ${one ? "item is" : "check is"} off. The reason shows on the check with your name and the date.</div>`, "", reqd)}
      ${field("Evidence", `<div class="ak-drop">${AK.i("upload")}Upload a file or link a document</div>`, "", opt)}`,
      footer: foot("Deactivate", one ? "" : `data-atdeact="${many.join(",")}"`) };
  };
  M["a-tests-subs"] = (id) => {
    const x = checkById(id);
    return { title: "Manage subscribers", body: `<p class="ak-desc">Subscribers are notified when ${esc(x.name.toLowerCase())} fails, falls due or is deactivated.</p>
      ${field("Add subscribers", `<div class="ak-select">${AK.i("mail")}An email address, a team's mailing list or a Slack channel's address</div>`)}
      <div class="ak-card">${x.owner ? `<div class="a-tests-lrow">${AK.owner(x.owner)}<span class="a-tests-grow"></span><span class="a-tests-mu">Owner, always notified</span></div>` : ""}<div class="a-tests-lrow">${AK.i("mail")}<span class="a-tests-grow">wsx90-issm@program.example ${EX}</span><span class="ak-link">Remove</span></div></div>`, footer: foot("Save subscribers") };
  };
  M["a-tests-poam"] = (id) => {
    const x = checkById(id);
    return { title: "Create POA&M item", body: `${field("Weakness", `<div class="ak-select">${esc(x.items[0] ? x.items[0].t.replace(/<[^>]+>/g, "").replace("Example", "").trim() : x.name)}</div>`)}
      <dl class="ak-kv"><dt>Source</dt><dd>Check · ${esc(x.name)}</dd><dt>Control</dt><dd>${AK.codes(x.ctl)}</dd><dt>Owner</dt><dd>${AK.owner(x.owner)}</dd></dl>
      ${field("Milestones", `<div class="ak-input tall">${x.fix.map((f, i) => `${i + 1}. ${esc(f)}`).join("<br>")}</div>`)}`, footer: foot("Create POA&M item") };
  };
  M["a-tests-task"] = (id) => {
    const x = checkById(id);
    return { title: "Create task", body: `${field("Title", `<div class="ak-select">${esc(x.fix[0] || x.name)}</div>`, "", reqd)}${field("Assignee", AK.owner(x.owner))}${field("Due date", `<div class="ak-select">${AK.i("calendar")}Nov 24, 2026 ${EX}</div>`)}<p class="ak-desc">The task is linked to ${esc(x.name)} and shows on its Tasks tab.</p>`, footer: foot("Create task") };
  };
  M["a-tests-addcamp"] = (id) => ({ title: "Add to assessment campaign", body: `<p class="ak-desc">The ${esc(id || "3")} controls join the campaign's draft plan as the assessment objectives nobody has judged yet.</p>${radio("WS-X90 continuous monitoring — FY2027 · plan 1, draft", true, "Holds 10 objectives today")}${radio("WS-X90 Expanded Control Set Assessment", false, "Its plan is published: no draft to add to")}`, footer: foot("Add to assessment campaign") });
  M["a-tests-addev"] = () => ({ title: "Add evidence", body: `<dl class="ak-kv"><dt>Control</dt><dd>${tag("SI-2")} Flaw Remediation</dd><dt>Cited by</dt><dd>${tag("REQ-064")}</dd></dl><div class="ak-drop">${AK.i("upload")}Drop a file, or choose one: PDF, image, .nessus, .ckl, CycloneDX or SPDX</div>${field("Title", `<div class="ak-select">openssh-server 9.8p1 update record, Mission Computer maintenance image version 2</div>`)}`, footer: foot("Add evidence") });
  M["a-tests-publish"] = () => ({ title: "Publish assessment results", body: `<p class="ak-desc"><b>Interim results — expanded control set, increment 2</b> holds 20 findings: 13 satisfied, 4 partially, 1 other than satisfied and 2 not assessed.</p><p class="ak-desc">Publishing freezes them. WS-X90's control statuses and traces read them from then on.</p>${stackBar([["Satisfied", 13, "var(--ok)"], ["Partially", 4, "var(--warn)"], ["Other than", 1, "var(--bad)"], ["Not assessed", 2, "var(--ink-4)"]])}`, footer: foot("Publish assessment results") });
  // v2 (C1) [B1]: Set Ready is wired: the chosen requests read Ready on the campaign, its tracker and its quick views.
  M["a-tests-ready"] = (id) => { const ids = String(id || "").split(",").filter((x) => REQUESTS.some((r) => r[0] === x)); const n = ids.length || 0; return { title: "Set Ready", body: `<p class="ak-desc">The ${n} request${n === 1 ? "" : "s"} go${n === 1 ? "es" : ""} back to the assessor as Ready. Each flag's justification stays in its assessor thread.</p><div class="ak-field"><label for="at-ready-note">Note to the assessor</label><textarea class="v2k-in tall" id="at-ready-note" name="note" placeholder="What changed since the flag"></textarea></div>`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v2-wired data-atready="${esc(ids.join(","))}">Set Ready</button>` }; };
  M["a-tests-plan"] = () => ({ title: "Plan an assessment", body: `${field("Title", `<div class="ak-select">WS-X90 cooperative vulnerability identification — FY2027</div>`)}${field("SSP", `<div class="ak-select">SYS-WSX90 · SSP 2, published Jul 25 · 560 controls</div>`)}${field("Window", `<div class="ak-select">${AK.i("calendar")}Jan 11 – Feb 5, 2027</div>`)}${field("Lead assessor", AK.owner("D. Okafor"))}`, footer: foot("Plan an assessment") });
  M["a-tests-assess"] = (id) => {
    const [rid, what] = String(id || "r2|flag").split("|");
    const r = reqById(rid), acc = what === "accept";
    return { title: acc ? "Accept request" : "Flag request", body: `<dl class="ak-kv"><dt>Request</dt><dd>${esc(r[3])}</dd><dt>Control</dt><dd>${tag(r[1])}</dd></dl>
      ${field("Determination", `<div class="a-tests-radios">${radio("Satisfied", acc)}${radio("Other than satisfied", !acc)}</div>`, "NIST SP 800-53A's two determinations, on the control's statement.")}
      ${field("Justification", `<div class="ak-input tall">Write why. It posts to the assessor comments and stays with the finding.</div>`, "", reqd)}`, footer: foot(acc ? "Accept" : "Flag") };
  };

  // ════════════════ Routes ════════════════
  S["after-tests-index"] = () => checksRegister("idx", true);
  S["after-test-page"] = () => checksRegister("plain", false);
  for (const x of CHECKS) for (const [k] of checkTabs(x)) { const r = pageRoute(x.id, k); S[r] = () => checkPage(x, k); nav(r); }
  for (const b of BASES) for (const k of ["controls", "overview", "gap"]) { const r = baseRoute(b.id, k); S[r] = () => basePage(b, k); nav(r); }
  for (const r of REQUESTS) for (const [k] of reqTabs(r)) { const route = reqRoute(r[0], k); S[route] = () => requestPage(r, k); nav(route); MODED.add(route); }
  nav("after-tests-index", "after-test-page", "after-controls-index", SI2R, ...SI2_ROUTES.map((k) => si2Route(k)), "after-frameworks", "after-frameworks-overlays",
    "after-audits-index", "after-audits-index-completed", "after-audits-index-assessor", "after-audit-record", "after-audit-record-findings");
  MODED.add("after-audit-record"); MODED.add("after-audit-record-findings");
})();
