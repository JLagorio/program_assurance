// Prototype v2, agent C2 (v2c-): hubs that land where they point, state that reaches every screen, a new program that is a
// program, people onboarding and access reviews, and one source per count. Loads after the v2 core and before the visual layer.
// API, window.PA.v2hubs:
//   count(route, label)      the number a screen's quick view, chip or tab shows for label (read from the screen as drawn, so a
//                            count elsewhere and the list it opens agree); null when the screen draws no such view
//   rows(route, test)        { n, names } of the rows of a screen's table that pass test(tr): what a "rows" question keeps
//   cur() / made() / setCur(code) / madeOne(code)   the current program and the programs created in this session
//   ssp()                    SSP revision 3's review state: "draft", "submitted", "approved" or "changes"
// Markup it reads anywhere: data-v2go="<route>" with data-v2q='<question JSON>' opens the route asked that question (PA.v2.go);
// data-v2prog="<program code>" makes that program the current one before the link is followed.
(function () {
  const PA = window.PA, V2 = PA && PA.v2;
  if (!V2) return;
  const { S, P, M, ROUTE_NAV, h } = PA, AK = PA.AK;
  const esc = h.esc, fmt = h.fmt;
  const get = (p, d) => V2.get(p, d);
  // Counts read from other screens are kept until anything changes (a click, a route, a state write).
  let cache = {};
  // When the reader last followed a link (a click, or Enter on one): a program page reached otherwise (an address typed or set by
  // a script, as the flows scripts do) opens WS-X90's, while the reader's own links keep a created program current.
  let NAVAT = 0;
  const NAVSEL = "a[href^='#'], [data-go], [data-v2go]";
  document.addEventListener("click", (e) => { cache = {}; if (e.target && e.target.closest && e.target.closest(NAVSEL)) NAVAT = Date.now(); }, true);
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target && e.target.closest && e.target.closest(NAVSEL)) NAVAT = Date.now(); }, true);
  V2.on(() => { cache = {}; });
  window.addEventListener("hashchange", () => { cache = {}; });

  // ——— Links that carry a question ———
  // A link from a workspace page (Home, My work, the queue…) into a program's pages names WS-X90's records, the only program whose
  // records those pages hold: following it makes WS-X90 the current program again, unless the link names a program itself.
  const here = () => (location.hash || "#home").slice(1);
  function intoProgram(to, el) {
    if (!to || el.closest("[data-v2prog]")) return;
    if (progKey(to) && to !== "program-start" && !progKey(here()) && get("prog.cur", WSX) !== WSX) setCur(WSX);
  }
  function follow(el, e) {
    const route = el.dataset.v2go;
    let q = null;
    try { q = el.dataset.v2q ? JSON.parse(el.dataset.v2q) : null; } catch (x) { q = null; }
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (el.dataset.v2prog) setCur(el.dataset.v2prog); else intoProgram(route, el);
    const panel = document.getElementById("panel"), modal = document.getElementById("modal");
    if (modal && !modal.hidden) { const x = modal.querySelector("[data-close-modal]"); if (x) x.click(); }
    if (panel && !panel.hidden && !el.closest("#panel")) { const x = panel.querySelector("#closePanel"); if (x) x.click(); }
    V2.go(route, q);
  }
  document.addEventListener("click", (e) => {
    const t = e.target; if (!t || !t.closest) return;
    const el = t.closest("[data-v2go]");
    if (el) { if (el.getAttribute("aria-disabled") !== "true") follow(el, e); return; }
    const pg = t.closest("[data-v2prog]");
    if (pg) { setCur(pg.dataset.v2prog); return; }
    const a = t.closest("a[href^='#'], [data-go]");
    if (a) intoProgram(a.dataset.go || (a.getAttribute("href") || "").slice(1), a);
  }, true);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = e.target && e.target.closest && e.target.closest("[data-v2go]");
    if (el && el === e.target && !/^(A|BUTTON)$/.test(el.tagName)) follow(el, e);
  }, true);
  const goAttrs = (route, q, prog) => `data-v2go="${esc(route)}"${q ? ` data-v2q="${esc(JSON.stringify(q))}"` : ""}${prog ? ` data-v2prog="${esc(prog)}"` : ""}`;

  // ——— One source per count: read a number from the screen the link opens ———
  // The screens are taken as the canon layer (and any earlier v2 module) left them, before the visual layer: drawn only to be read.
  const RAWS = {};
  ["findings", "findings-vulns", "risks", "evidence", "campaign", "controls", "schedule", "poam", "inventory", "people", "people-access"].forEach((r) => { if (S[r]) RAWS[r] = S[r]; });
  let DRAWING = false;
  function frag(route) {
    if (cache[route]) return cache[route];
    const f = RAWS[route] || S[route];
    if (!f) return null;
    let html = "";
    try { DRAWING = true; html = f(); } catch (e) { return null; } finally { DRAWING = false; }
    const t = document.createElement("template");
    t.innerHTML = typeof html === "string" ? html : "";
    t.content.querySelectorAll(".ak-co, .co, .v2-sr").forEach((x) => x.remove());
    return (cache[route] = t.content);
  }
  function count(route, label) {
    const c = frag(route); if (!c) return null;
    const want = String(label).toLowerCase();
    const el = [...c.querySelectorAll(".qv, [role='tab'], .tab, .ak-tab, .a-people-ki")].find((x) => x.textContent.replace(/\s+/g, " ").trim().toLowerCase().startsWith(want));
    if (!el) return null;
    const m = el.textContent.replace(/,/g, "").slice(want.length).match(/(\d+)/);
    return m ? +m[1] : null;
  }
  function rows(route, test) {
    const c = frag(route); if (!c) return { n: 0, names: [] };
    const hit = [...c.querySelectorAll("tbody tr")].filter((tr) => { try { return test(tr); } catch (e) { return false; } });
    return { n: hit.length, names: hit.map((tr) => { const nm = tr.querySelector(".nm") || tr.cells[1] || tr.cells[0]; return (nm ? nm.textContent : tr.textContent).replace(/\s+/g, " ").trim(); }) };
  }

  // ——— Programs: the current one, and the ones created in this session ———
  const WSX = "PRG-1090";
  const made = () => get("prog.made", []) || [];
  const madeOne = (code) => made().find((d) => d.code === code) || null;
  const cur = () => { const c = get("prog.cur", WSX); return c === WSX || madeOne(c) ? c : WSX; };
  function setCur(code) { if (code && code !== get("prog.cur", WSX)) V2.set("prog.cur", code); }
  const ssp = () => get("ssp.rev3.state", "draft");

  PA.v2hubs = { count, rows, cur, made, madeOne, setCur, ssp, goAttrs, drawing: () => DRAWING };
  // The SSP submit page keeps its review state here; after a reload it reads it back, and a reset clears it.
  if (PA.sspReview) { const s = get("ssp.rev3"); if (s) PA.sspReview.restore(s); }
  V2.on((p) => { if (p === "*" && PA.sspReview) PA.sspReview.restore(null); });

  // A decoration over a screen as it is drawn (kept with the canon layer's marks on the function).
  function deco(match, fn) {
    for (const k of Object.keys(S)) {
      if (!(match instanceof RegExp ? match.test(k) : k === match)) continue;
      const f = S[k];
      const g = function () { return fn(f.apply(this, arguments), k); };
      Object.keys(f).forEach((p) => { g[p] = f[p]; });
      S[k] = g;
    }
  }
  const parse = (html) => { const t = document.createElement("template"); t.innerHTML = html; return t; };

  // ——— B2: the CVE the top Urgent row names opens from the Vulnerabilities list it lands on ———
  deco("findings-vulns", (html) => {
    if (typeof html !== "string" || html.indexOf("CVE-2024-6387") < 0) return html;
    const t = parse(html);
    const tr = [...t.content.querySelectorAll("tbody tr")].find((x) => x.textContent.includes("CVE-2024-6387"));
    if (!tr || tr.hasAttribute("data-panel")) return html;
    tr.setAttribute("data-panel", "a-risk-issue"); tr.setAttribute("data-id", "c0fdce4e");
    return t.innerHTML;
  });

  // ——— B5: Authorization says where SSP revision 3 is once it is submitted ———
  const SSP_WORD = { submitted: "In review", approved: "With the AO", changes: "Changes requested" };
  deco(/^authorization/, (html) => {
    const s = ssp();
    if (typeof html !== "string" || !SSP_WORD[s] || html.indexOf("Revision 3") < 0) return html;
    const t = parse(html);
    for (const tr of t.content.querySelectorAll("tbody tr")) {
      const c = tr.cells;
      if (!c || c.length < 4 || !/System security plan/.test(c[0].textContent) || !/Revision 3/.test(c[1].textContent)) continue;
      const pill = c[3].querySelector(".pill");
      if (pill) pill.outerHTML = h.pill("none", SSP_WORD[s]);
      if (c[4]) c[4].textContent = s === "changes" ? "Sent back by the ISSM" : `Submitted ${get("ssp.rev3.when", "today")}`;
      if (c[5]) c[5].textContent = s === "approved" ? "Waits on R. Calloway's signature" : s === "changes" ? "Draft the categorization rationale in section 2" : "Waits on Joel Barrantes, ISSM";
    }
    return t.innerHTML;
  });

  // ——— A15: assessment mode keeps the campaign's pages together: Controls joins Requests and Findings under the band ———
  if (S.controls && !S["campaign-controls"]) { const ctl = S.controls; V2.screen("campaign-controls", () => ctl(), "assessments"); if (PA.MODED) PA.MODED.add("campaign-controls"); }

  // ——— B6: a created program is the current program; its pages are its own ———
  const PROG_PAGES = ["overview", "getting-started", "itcsc", "composition", "inventory", "stigs", "interconnections", "ppsm", "sources", "baseline", "controls", "ssps", "requirements", "evidence", "checks", "policies", "assessments", "cyber-te", "findings", "poam", "risks", "threats", "posture", "resiliency", "sse", "traceability", "inheritance", "authorization", "package-room", "conmon", "schedule", "people", "ssp", "campaign", "control-si2"];
  const PROG_SET = new Set(PROG_PAGES);
  function progKey(r) {
    if (PROG_SET.has(r)) return r;
    if (/^(person-|plan-)/.test(r)) return "people";
    const n = ROUTE_NAV[r];
    if (n && PROG_SET.has(n)) return n;
    return PROG_PAGES.slice().sort((a, b) => b.length - a.length).find((k) => r.startsWith(k + "-")) || null;
  }
  PA.v2hubs.progKey = progKey;
  const LABEL = Object.assign({ ssp: "System security plan", campaign: "Assessments", "control-si2": "Controls" }, Object.fromEntries((PA.navItems ? PA.navItems() : []).map(([k, l]) => [k, l])));
  // What each page of a new program holds: nothing yet, said once, with the one step that starts it.
  const EMPTY = {
    requirements: ["No requirements yet", "Import the customer's requirements document, then map each requirement to the controls it meets.", ["Import requirements", 'data-modal="pn-reqs"']],
    sources: ["No evidence source connected", "Connect ACAS, the STIG checklists or the product's evidence, and each source files its evidence here.", ["Open integrations", 'data-go="integrations"']],
    ssp: ["SSP revision 1 is a draft with nothing described", "Every planned implementation starts empty; the starter guide's Draft the SSP step opens it.", null],
    ssps: ["One SSP, revision 1, in draft", "Nothing is described yet, so there is nothing to submit for review.", null],
    assessments: ["No assessment campaign", "Plan one once the SSP is published; the starter guide's Plan an assessment step says what it will cover.", null],
    authorization: ["No authorization package", "The package is assembled from the published SSP, the assessment results and the POA&M.", null],
    controls: ["No control is mapped yet", "The baseline's controls wait for requirements and evidence; nothing has been recorded against them.", ["Open the baseline", 'data-go="baseline"']],
    evidence: ["No evidence yet", "Evidence arrives from connected sources or uploads, each against a requirement.", ["Connect a source", 'data-go="sources"']],
    findings: ["No operational issues", "Issues open from scans, assessments and offers once the program has any.", null],
    risks: ["No risks recorded", "Risks are raised from findings and issues, or written by hand.", null],
    poam: ["No POA&M items", "Remediation items follow from operational issues and risks.", null],
    people: ["Roles as the wizard recorded them", "Invite people from the program's page; each role holder's onboarding starts when they join.", null],
  };
  function newPage(route, d) {
    const k = progKey(route) || route, label = LABEL[k] || k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, " ");
    const [title, line, act] = EMPTY[k] || [`Nothing recorded for ${d.code} yet`, `${label} fills in as ${d.name} records its work.`, null];
    const action = act ? `<span class="btn sm" role="button" tabindex="0" ${act[1]}>${esc(act[0])}</span>` : "";
    const empty = AK.empty({ title, line }).replace(/<\/div>\s*$/, `${action}</div>`);
    const crumbs = `<nav class="v2c-crumbs" aria-label="Breadcrumb"><span class="ak-link" role="link" tabindex="0" data-go="portfolio">Programs</span><span aria-hidden="true">›</span><span class="ak-link" role="link" tabindex="0" data-go="program-start">${esc(d.name)}</span></nav>`;
    const body = h.page(`<div class="v2c-newp" data-v2c-prog="${esc(d.code)}">${crumbs}${h.header(label, "", "")}</div>`, empty);
    return route === "ssp" || route.indexOf("ssp-") === 0 ? `<div class="v2c-fw">${AK.back(`Back to ${d.name}`, "program-start")}${body}</div>` : body;
  }
  // Every program page draws the current program: WS-X90's screens for WS-X90, a created program's own (empty) pages for it.
  for (const k of Object.keys(S)) {
    if (!progKey(k) || k === "program-start") continue;
    const f = S[k];
    const g = function () {
      const c = cur();
      if (c === WSX || DRAWING) return f.apply(this, arguments);
      const d = madeOne(c);
      if (!d) return f.apply(this, arguments);
      const pk = progKey(k);
      if ((pk === "overview" || pk === "getting-started") && S["program-start"]) return S["program-start"]();
      return newPage(k, d);
    };
    Object.keys(f).forEach((p) => { g[p] = f[p]; });
    S[k] = g;
  }
  // The created program's page belongs to it: opening it makes the program current. A campaign in assessment mode is WS-X90's.
  window.addEventListener("hashchange", () => {
    const r = (location.hash || "").slice(1);
    // V3 (mod-zzzz-v3-0core.js): switching V3 never changes the current program, and V3's own rule decides links (inert while off).
    const V3 = PA.v3; if (V3 && (V3.toggling || (V3.on() && V3.keepProgram && V3.keepProgram(r)))) return;
    if (r === "program-start") { const d = made()[0]; if (d && !madeOne(get("prog.cur"))) setCur(d.code); }
    else if (PA.MODED && PA.MODED.has(r) && cur() !== WSX) setCur(WSX);
    else if (cur() !== WSX && progKey(r) && Date.now() - NAVAT > 1500) setCur(WSX);
  });

  // ——— Dialogs C2 wires: they check their required fields, name what is missing, and change what they say ———
  const fieldErr = (id, msg) => {
    const el = document.getElementById(id), err = document.getElementById(id + "-err");
    if (el) { if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid"); }
    if (err) { err.hidden = !msg; err.textContent = msg || ""; }
  };
  const valOf = (id) => { const el = document.getElementById(id); return el ? String(el.value || "").trim() : ""; };
  const closeModal = () => { const x = document.querySelector("#modal .dlg-h [data-close-modal]"); if (x) x.click(); };
  const input = (id, label, opt = {}) => `<div class="ak-field v2c-f"><label for="${id}">${esc(label)}${opt.req ? ' <span class="req">Required</span>' : ""}</label>${opt.select
    ? `<select id="${id}" class="v2c-in">${opt.select.map((o) => `<option value="${esc(Array.isArray(o) ? o[0] : o)}"${opt.value === (Array.isArray(o) ? o[0] : o) ? " selected" : ""}>${esc(Array.isArray(o) ? o[1] : o)}</option>`).join("")}</select>`
    : `<input id="${id}" class="v2c-in" type="${opt.type || "text"}"${opt.value ? ` value="${esc(opt.value)}"` : ""}${opt.ph ? ` placeholder="${esc(opt.ph)}"` : ""} autocomplete="off">`}<p class="v2c-err" id="${id}-err" role="alert" hidden></p>${opt.hint ? `<span class="s">${esc(opt.hint)}</span>` : ""}</div>`;
  PA.v2hubs.ui = { input, fieldErr, valOf, closeModal };
  const ACT = {};
  PA.v2hubs.act = (name, fn) => { ACT[name] = fn; };
  document.addEventListener("click", (e) => {
    const b = e.target && e.target.closest && e.target.closest("[data-v2c-act]");
    if (!b || !ACT[b.dataset.v2cAct]) return;
    e.preventDefault(); e.stopPropagation();
    ACT[b.dataset.v2cAct](b, e);
  }, true);
  const wired = (label, act, extra = "") => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v2-wired data-v2c-act="${act}"${extra}>${esc(label)}</button>`;
  PA.v2hubs.wired = wired;
  // A dialog the prototype does not save says so, by name, instead of a success toast.
  const notWired = (title, label) => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v2-wired data-v2c-act="not-wired" data-title="${esc(title)}">${esc(label)}</button>`;
  PA.v2hubs.notWired = notWired;
  ACT["not-wired"] = (b) => { closeModal(); V2.toast(`Not saved: ${b.dataset.title} isn't wired in this prototype`); };

  // ——— B13: Add person starts the person's onboarding task set ———
  if (PA.v8people) PA.v8people.restore();
  V2.on((p) => { if (p !== "*") return; if (PA.v8people) PA.v8people.reset(); if (PA.accessReview) PA.accessReview.reset(); });
  const ROLES = [["SCA", "Assessor", "Records determinations; reviews evidence"], ["ISSO", "Information system security officer", "Keeps the package and the SSP current"], ["SO", "System owner", "Owns the system and its remediation"], ["", "No RMF role", "Owns tasks and evidence"]];
  M["v2c-add-person"] = () => ({ title: "Add person",
    body: `<div class="v2c-dlg"><p class="ak-desc">Adding a person to WS-X90 starts the onboarding tasks of their role's task set: a DD Form 2875 for each system account, the rules of behavior, training and the role's own tasks.</p>
      ${input("v2c-p-name", "Name", { req: true, ph: "First and last name" })}
      ${input("v2c-p-role", "Role in WS-X90", { select: ROLES.map(([k, l]) => [k, l]), value: "SCA" })}
      ${input("v2c-p-start", "Start date", { type: "date", value: "2026-11-17" })}</div>`,
    footer: wired("Add person", "add-person") });
  ACT["add-person"] = () => {
    const n = valOf("v2c-p-name").replace(/\s+/g, " ");
    if (!n) { fieldErr("v2c-p-name", "Enter the person's name."); document.getElementById("v2c-p-name").focus(); return; }
    if ((PA.v8people && PA.v8people.has(n)) || (get("people.added", []) || []).some((a) => a.n.toLowerCase() === n.toLowerCase())) { fieldErr("v2c-p-name", `${n} is already in WS-X90's people.`); document.getElementById("v2c-p-name").focus(); return; }
    fieldErr("v2c-p-name", "");
    const short = valOf("v2c-p-role"), role = ROLES.find((r) => r[0] === short) || ROLES[3];
    const a = { n, short: short || null, roleLabel: short ? role[1] : null, acts: role[2], start: valOf("v2c-p-start") || "2026-11-17" };
    V2.set("people.added", (get("people.added", []) || []).concat([a]));
    const route = PA.v8people ? PA.v8people.add(a) : null;
    const tasks = PA.v8people ? PA.v8people.onboarding(n).length : 0;
    closeModal();
    if (route) location.hash = route;
    V2.toast(`${n} added · onboarding started with ${tasks} tasks`, { label: "Open People", route: "people" });
  };

  // ——— B9: Inventory's Add asset adds the asset; Import scan says the prototype does not import ———
  M["v2c-import-scan"] = () => ({ title: "Import scan",
    body: `<div class="v2c-dlg"><p class="ak-desc">An ACAS (.nessus) or STIG Viewer (.ckl) export matches its hosts to SYS-WSX90's assets; hosts it cannot match wait under Discovered by scans.</p>
      ${input("v2c-s-kind", "Scanner", { select: ["ACAS · .nessus", "STIG Viewer · .ckl", "SCAP Compliance Checker · .xml"] })}
      <div class="ak-field v2c-f"><span class="v2c-lbl">File</span><span class="v2c-file">No file chosen: the prototype reads no files</span></div></div>`,
    footer: notWired("Import scan", "Import scan") });
  const invSubs = () => (PA.invData ? PA.invData.subs : []);
  M["v2c-add-asset"] = () => ({ title: "Add asset",
    body: `<div class="v2c-dlg"><p class="ak-desc">The asset joins SYS-WSX90's inventory under the subsystem you choose. An owner can be named from its row.</p>
      ${input("v2c-a-name", "Name", { req: true, ph: "As it reads on the unit's label" })}
      ${input("v2c-a-lru", "LRU", { req: true, ph: "LRU-021" })}
      ${input("v2c-a-fw", "Firmware or software", { ph: "Version, as the unit reports it" })}
      ${input("v2c-a-sub", "Subsystem", { select: invSubs().map(([code, nm]) => [code, nm]), value: (invSubs()[5] || [])[0] })}
      ${input("v2c-a-kind", "Kind", { select: [["hardware", "Hardware"], ["software", "Software"]], value: "hardware" })}</div>`,
    footer: wired("Add asset", "add-asset") });
  ACT["add-asset"] = () => {
    const name = valOf("v2c-a-name"), lru = valOf("v2c-a-lru").toUpperCase();
    fieldErr("v2c-a-name", name ? "" : "Enter the asset's name."); fieldErr("v2c-a-lru", lru ? "" : "Enter the LRU, as in LRU-021.");
    if (!name || !lru) { document.getElementById(!name ? "v2c-a-name" : "v2c-a-lru").focus(); return; }
    const id = PA.invData ? PA.invData.nextId() : "AST-109021";
    const a = { id, name, lru, fw: valOf("v2c-a-fw") || "Not reported", sub: valOf("v2c-a-sub"), kind: valOf("v2c-a-kind") || "hardware", at: "2026-11-17" };
    V2.set("inv.added", (get("inv.added", []) || []).concat([a]));
    closeModal();
    V2.go("inventory", { rows: [id], open: { kind: "sys-asset", id }, note: "Showing the asset you added" });
    V2.toast(`${id} ${name} added to SYS-WSX90 · ${PA.invData ? PA.invData.count() : ""} assets`);
  };
  // An added asset's preview reads what was entered (the asset preview otherwise knows only the 20 recorded assets).
  if (P["sys-asset"]) {
    const f = P["sys-asset"];
    P["sys-asset"] = (id) => {
      const a = (get("inv.added", []) || []).find((x) => x.id === id);
      if (!a) return f(id);
      const sub = (invSubs().find((s) => s[0] === a.sub) || [a.sub, a.sub])[1];
      return { label: "Asset preview", body: `<div class="v2c-pan">${AK.recordHead({ title: `${a.id} ${a.name}`, chip: h.pill("ok", "In scope") })}
        ${AK.facts([["LRU", esc(a.lru)], ["Subsystem", esc(sub)], ["Kind", a.kind === "software" ? "Software" : "Hardware"], ["Firmware", esc(a.fw)], ["Owner", h.who(null)], ["Recorded", "Nov 17, 2026"]])}
        <p class="note-p">Added in this session; no scan has seen it yet.</p></div>` };
    };
  }
})();
