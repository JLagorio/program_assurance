// V3 lane O (k3o-): the program's Overview is the program's record. Its stage strip is the lifecycle, opened in place; a gate is
// a record that opens in a panel; a deliverable that is not ready takes the reader to exactly the records that hold it back and
// brings them back. It replaces Lifecycle (and its gate pages), Security engineering, Getting started, People & roles and Activity.
// Inert while V3 is off (V3.S / K.screen pages, kit actions, V3.redirect; every listener returns at once).
//
// Pages
//   overview            the record: the lifecycle (increment, phases, the open phase's steps), the next gate's checklist, one
//                       completion card, one needs-attention card, Details and Team at the side
//   overview-team       the program's roles with who holds each, and its people; Assign a role and Add a person in place
//   overview-activity   the program's activity, newest first (chips by kind)
// Record: a gate, kind k3o-gate (id = the step's id, "pdr-2"). Its page is gate--<id> (the kit draws it from the definition
//   below, called with { page: true }): the decision is the header's primary, what holds the gate back is rows that go to their
//   records, its criteria are a table with its own Add. Its preview (the eye on a step's row) is the short form.
//   IATT and ATO steps have no gate page: their page is Authorization.
// Opening the Overview on something (set, then go to overview):
//   K.set("ov.view", { inc: 1 | 2 | null, phase: "MSA" | "TMRR" | "EMD" | "Test" | "Ops" | null })   null = the current one
// Session data (K.get/K.set; Reset clears it): ov.view; ov.act (the Activity chip); p.<program>.team.roles { role: holder },
//   p.<program>.team.people [{ name, org }]; p.<program>.gate.<id>.crit [{ id, text, proc, s, note }] criteria written on a gate.
// A gate's request, decision and actions are written where lane G reads them (PA.v2 state life.req / life.dec / v3.G.steps /
//   v3.G.cond / v3.G.out), so every page that reads a gate follows. Deliverables and criteria are read from lane G's gate page at
//   draw time; a deliverable whose records can be counted is counted here (controls with no requirement, connections without a
//   current agreement, the boundary's SCA review, SSP placeholders), and that count is the one count of readiness:
//   fact("gate", id), fact("nextGate") and the line under the program switcher all read it.
// Facts published: nextGate() → { id, name, due, ready, total }; people(prog) (lane F's, with this page's assignments applied).
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k, V2 = PA && PA.v2;
  if (!V3 || !K || !V2 || !PA.h || !PA.AK) return;
  const { S, h } = PA, AK = PA.AK, esc = h.esc, fmt = K.fmt;
  const WSX = "PRG-1090", ME = "Ingrid Solberg", TODAY = "2026-11-17";
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const dt = (iso) => new Date(String(iso).slice(0, 10) + "T12:00:00");
  const days = (iso) => Math.round((dt(iso) - dt(TODAY)) / 86400000);
  const md = (iso) => (iso ? dt(iso).toLocaleDateString("en-US", dt(iso).getFullYear() === dt(TODAY).getFullYear() ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }) : "");
  const prog = () => V3.prog(), wsx = () => V3.wsx();
  const pk = (p) => `p.${prog()}.${p}`;
  const fact = (n, ...a) => V3.fact(n, ...a);
  const has = (r) => { if (!S[r] && V3.lazy) V3.lazy(r); return !!S[r]; };
  const tpl = (html) => { const t = document.createElement("template"); t.innerHTML = html || ""; return t.content; };
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const safe = (s) => String(s).replace(/[^A-Za-z0-9_-]/g, "_");
  const list = (names) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);
  const openModal = (kind, id) => { const main = document.getElementById("main"); if (!main) return; const t = document.createElement("span"); t.hidden = true; t.setAttribute("data-modal", kind); t.setAttribute("data-id", id == null ? "" : id); main.appendChild(t); t.click(); t.remove(); };

  // ════════════════ Team: one record a program. Lane F's people, with what this page assigns and adds ════════════════
  const people0 = V3.facts.people;
  const ROLES0 = [["Authorizing official", "AO", "Categorization, IATT and ATO"], ["Authorizing official designated representative", "AODR", null], ["Milestone decision authority", null, "Milestones A, B and C"], ["Program manager and system owner", "PM/SO", "Operational steps"], ["Lead assessor", "SCA", "Control selection and the SAR"], ["Information system security manager", "ISSM", "RMF steps, first"], ["Information system security officer", "ISSO", null], ["Information system security engineer", "ISSE", null], ["Chief engineer", null, "Engineering reviews: SRR, SFR, PDR, CDR"]];
  const RMFW = { ao: "AO", issm: "ISSM", isso: "ISSO", owner: "PM/SO", lead: "SCA", assessors: "SCA" };
  const ROLEW = { ISSM: "Information system security manager", ISSO: "Information system security officer", "System owner": "Program manager and system owner", "Lead assessor (SCA)": "Lead assessor" };
  // WS-X90's people are lane F's; a created program's are lane P's, which wraps the fact after this module loads.
  let inTeam = false;
  const people00 = (code) => { try { return (typeof people0 === "function" ? people0(code) : null) || []; } catch (e) { return []; } };
  const basePeople = (code) => { if (code === WSX || inTeam) return people00(code); inTeam = true; try { return fact("people", code) || []; } finally { inTeam = false; } };
  function team(code) {
    code = code || prog();
    const base = basePeople(code);
    const held = K.get(`p.${code}.team.roles`, {}) || {}, added = K.get(`p.${code}.team.people`, []) || [];
    const roles = [];
    for (const p of base) { const role = ROLEW[p.role] || p.role; if (!roles.some((r) => r.role === role)) roles.push({ role, rmf: RMFW[p.rmf] || p.rmf || null, decides: p.decides || null, holder: p.name, was: p.name }); }
    for (const [role, rmf, decides] of ROLES0) if (code !== WSX && !roles.some((r) => r.role === role)) roles.push({ role, rmf, decides, holder: null, was: null });
    for (const r of roles) if (r.role in held) r.holder = held[r.role] || null;
    const people = base.map((p) => ({ name: p.name, org: p.org || "", ssp: p.ssp || null })).concat(added.map((p) => ({ name: p.name, org: p.org || "", ssp: null, added: true })));
    if (!people.some((p) => p.name === ME) && code !== WSX) people.unshift({ name: ME, org: "Program office", ssp: null });
    for (const p of people) p.roles = roles.filter((r) => r.holder === p.name);
    return { roles, people };
  }
  const holderOf = (role) => { const r = team().roles.find((x) => x.role === role); return r ? r.holder : null; };
  const roleShort = (r) => (r.rmf && team().roles.filter((x) => x.rmf === r.rmf).length === 1 ? r.rmf : r.role);
  if (typeof people0 === "function") V3.facts.people = (code) => {
    const base = people0(code);
    const c = code || WSX;
    if (inTeam || !V3.on() || !Array.isArray(base) || (!Object.keys(K.get(`p.${c}.team.roles`, {}) || {}).length && !(K.get(`p.${c}.team.people`, []) || []).length)) return base;
    const t = team(c);
    return t.people.map((p) => { const b = base.find((x) => x.name === p.name) || {}; const rs = p.roles; return Object.assign({}, b, { name: p.name, org: p.org, ssp: p.ssp, role: rs.length ? rs.map((r) => r.role).join(" · ") : "No role held", rmf: (rs.find((r) => r.rmf) || {}).rmf || null, decides: rs.map((r) => r.decides).filter(Boolean).join("; ") || null }); });
  };

  // ════════════════ The lifecycle: steps, and a gate read from its records ════════════════
  const PHASES = [["MSA", "Materiel solution analysis"], ["TMRR", "Technology maturation and risk reduction"], ["EMD", "Engineering and manufacturing development"], ["Test", "Integration, test and production approval"], ["Ops", "Production, deployment and operations"]];
  const INC = { 1: "Increment 1 · Block 1", 2: "Increment 2 · Block 1.1" };
  const DECIDER = { "Engineering review": "Chief engineer", "Milestone decision": "Milestone decision authority", Operational: "Program manager and system owner", "RMF action": "Authorizing official" };
  const WORD = { Waived: "Not required", Failed: "Not passed", "Passed with conditions": "Passed with actions" };
  const TONE = { Passed: "ok", Completed: "ok", "Passed with actions": "warn", "Not passed": "bad", "In review": "none", "In progress": "none", "Not started": "none", "Not required": "none" };
  const DONE = new Set(["Passed", "Completed", "Passed with actions", "Not required"]);
  const tmpl = () => { try { return (PA.v2life && PA.v2life.steps ? PA.v2life.steps(WSX) : []) || []; } catch (e) { return []; } };
  const isAuth = (id) => /^(iatt|ato)-\d+$/.test(String(id));
  const gate0 = V3.facts.gate; // lane G's
  const g0 = (id) => { try { return typeof gate0 === "function" ? gate0(id) : null; } catch (e) { return null; } };
  let CACHE = {};
  V2.on(() => { CACHE = {}; });
  const incs = () => (wsx() ? [1, 2] : [1]);
  const incName = (n) => (wsx() ? INC[n] : "Increment 1");

  // What holds a deliverable back, counted from its records.
  const noReq = () => { const c = fact("controls", WSX); return c && c.no_requirement != null ? Math.max(0, c.no_requirement) : null; };
  function connsOpen() {
    const f = fact("connections");
    if (Array.isArray(f)) return f.filter((c) => c.needsAgreement).map((c) => c.name);
    return (PA.v8bIC || []).filter((x) => x.agr && (x.agr.st === "Expired" || x.agr.st === "Draft")).map((x) => x.name);
  }
  function count(d) { // a deliverable of a step not decided yet: the number, the words and the button
    if (d.out) return d;
    if (d.name === "Requirements" && d.route === "sctm") {
      const n = noReq(); if (n == null) return d;
      return Object.assign(d, { kind: "noreq", ok: n === 0, n, why: n ? `${n === 1 ? "control" : "controls"} with no requirement` : "Every control has a requirement", btn: `Open ${plural(n, "control")}` });
    }
    if (d.name === "Interconnections") {
      const names = connsOpen(), n = names.length;
      return Object.assign(d, { name: "Connections", kind: "conns", names, ok: !n, n, why: n ? `${n === 1 ? "connection" : "connections"} without a current agreement` : "Every agreement is current", btn: `Open ${plural(n, "connection")}` });
    }
    if (d.name === "Boundary" && !d.ok) return Object.assign(d, { kind: "boundary", n: 1, why: /not requested/.test(d.why) ? "SCA review to request" : /requested/.test(d.why) ? "SCA review waiting on D. Okafor" : "change the SCA asked for", btn: "Open the boundary" });
    if (/^SSP revision/.test(d.name) && !d.ok) { const m = /([\d,]+) placeholder/.exec(d.why); return Object.assign(d, m ? { n: +m[1].replace(/,/g, ""), why: "placeholder narratives to write" } : {}, { btn: "Open the SSP" }); }
    if (!d.ok) d.btn = `Open ${d.name}`;
    return d;
  }
  const ownKey = (prog0, id) => `p.${prog0}.gate.${safe(id)}.crit`;
  const gateRoute = (id) => K.recRoute("k3o-gate", id) || "overview";
  function gate(id) {
    id = String(id || "");
    const ck = prog() + "|" + id;
    if (CACHE[ck]) return CACHE[ck];
    const f = g0(id); if (!f) return null;
    if (f.prog !== prog()) return null;
    const key = id.replace(/-\d+$/, ""), n = +(/-(\d+)$/.exec(id) || [0, 1])[1];
    const t = tmpl().find((s) => s.id === id) || tmpl().find((s) => s.id.replace(/-\d+$/, "") === key) || {};
    const status = WORD[f.status] || f.status || "Not started";
    const g = { id, prog: f.prog, key, n, title: f.title || t.title || id, kind: t.kind || "", phase: t.phase || "", status, done: DONE.has(status), due: (f.prog !== WSX && fact("lifeDue", f.prog, id)) || f.due || null, decided: f.decided || null, decision: f.decision || null, desc: "", dls: [], crit: [], chain: [], requested: "", ready: f.ready || 0, total: f.total || 0, met: f.met || 0, criteria: f.criteria || 0 };
    g.short = g.title.split(" · ")[0];
    if (f.prog === WSX && S["lifecycle-" + id] && status !== "Not required") {
      let c = null;
      try { c = tpl(V3.force(true, () => S["lifecycle-" + id]())); } catch (e) { c = null; }
      if (c) {
        g.desc = txt(c.querySelector(".ak-desc"));
        for (const sec of c.querySelectorAll("section.ak-sec")) {
          const hd = txt(sec.querySelector("h3"));
          if (/^Deliverables/.test(hd)) for (const li of sec.querySelectorAll(".v2g-dls > li")) {
            const a = li.querySelector(".v2g-dl"); if (!a) continue;
            const sr = txt(a.querySelector(".v2-sr")); let q = null;
            try { q = a.getAttribute("data-v2q") ? JSON.parse(a.getAttribute("data-v2q")) : null; } catch (e) { q = null; }
            g.dls.push({ name: txt(a).replace(sr, "").trim(), ok: li.classList.contains("ok"), why: txt(li.querySelector(".v2g-dlw")), owner: txt(li.querySelector(".v2g-dlo")), out: /with the decision/i.test(sr), route: (a.getAttribute("href") || "").replace(/^#/, ""), q, panel: a.getAttribute("data-panel"), pid: a.getAttribute("data-id") });
          }
          else if (/^Criteria/.test(hd)) for (const row of sec.querySelectorAll(".v2g-crit > div")) {
            const gl = row.querySelector(".gl"), small = row.querySelector("small"), code = txt(small && small.querySelector(".tag")), st = txt(small);
            g.crit.push({ code: code || null, text: txt(row.querySelector("span > span")), proc: st.replace(code, "").split(" · ")[0].trim(), out: /with the decision/i.test(st), state: !gl ? "na" : gl.classList.contains("check") ? "met" : gl.classList.contains("clock") || gl.classList.contains("part") ? "part" : gl.classList.contains("diamond") ? "not" : "na" });
          }
          else if (/^Decision/.test(hd)) {
            g.requested = txt(sec.querySelector(".ak-appr-h .s"));
            for (const s of sec.querySelectorAll(".ak-appr-step")) g.chain.push({ k: txt(s.querySelector(".k")), who: txt(s.querySelector("b")), role: txt(s.querySelector(".t")), state: txt(s.querySelector(".ak-appr-r > :last-child")) });
          }
        }
        if (!g.done) g.dls.forEach(count);
        const inp = g.dls.filter((d) => !d.out), cr = g.crit.filter((x) => !x.out);
        if (inp.length || !g.total) { g.ready = inp.filter((d) => d.ok).length; g.total = inp.length; }
        if (cr.length) { g.met = cr.filter((x) => x.state === "met").length; g.criteria = cr.length; }
        const picked = new Set(((f.prog === WSX && n === 2 && V2.get(`gate.${key}.added`, null)) || []).map((x) => x.code));
        for (const x of g.crit) { if (x.code && picked.has(x.code)) x.added = true; const u = x.out ? null : x.code ? V2.get(`v3.G.out.${n}.${safe(x.code)}`, null) : V2.get(`v3.G.crit.${f.prog}.${id}`, null); x.note = (u && u.note) || ""; }
      }
    }
    // Criteria written on this gate (its own Add): they count as the others do.
    const own = (K.get(ownKey(f.prog, id), []) || []).map((c) => ({ own: c.id, code: null, text: c.text, proc: c.proc || "Written on this gate", state: c.s || "na", note: c.note || "" }));
    if (own.length && status !== "Not required") { g.crit.push(...own); g.criteria += own.length; g.met += own.filter((c) => c.state === "met").length; }
    CACHE[ck] = g;
    return g;
  }
  function steps(n) {
    const src = tmpl().filter((s) => s.increment === (wsx() ? n : 1));
    return src.map((s) => {
      const f = g0(s.id); if (!f || f.prog !== prog()) return null;
      const status = WORD[f.status] || f.status || "Not started";
      return { id: s.id, n, title: s.title, short: s.title.split(" · ")[0], kind: s.kind, phase: s.phase, status, done: DONE.has(status), due: (!wsx() && fact("lifeDue", prog(), s.id)) || f.due || null, decided: f.decided || null };
    }).filter(Boolean);
  }
  const curInc = () => incs().find((n) => steps(n).some((s) => !s.done)) || incs()[incs().length - 1];
  const nextStep = () => steps(curInc()).find((s) => !s.done) || null;
  const curPhase = (n) => { const s = steps(n).find((x) => !x.done); return s ? s.phase : PHASES[PHASES.length - 1][0]; };
  // Who decides a step: the holder of its deciding role on the Team tab; who reviews first, from the gate's chain.
  function decider(g) {
    const role = DECIDER[g.kind] || "Program manager and system owner", r = team().roles.find((x) => x.role === role);
    const last = g.chain[g.chain.length - 1];
    return { role, name: r ? r.holder : last ? last.who : null };
  }
  V3.facts.gate = (id) => { const f = g0(id); if (!f || !V3.on() || f.prog !== WSX || prog() !== WSX) return f; const g = gate(f.id); return g ? Object.assign({}, f, { ready: g.ready, total: g.total, met: g.met, criteria: g.criteria, open: (g.total - g.ready) + (g.criteria - g.met) }) : f; };
  V3.facts.nextGate = () => { const s = nextStep(); if (!s) return null; const g = gate(s.id) || {}; return { id: s.id, name: s.title, due: s.due, ready: g.ready || 0, total: g.total || 0 }; };

  // ════════════════ The view: which increment and phase are open ════════════════
  const view = () => { const v = K.get("ov.view", null) || {}; const inc = incs().includes(v.inc) ? v.inc : curInc(); return { inc, phase: PHASES.some((p) => p[0] === v.phase) ? v.phase : curPhase(inc) }; };
  K.on("ov.inc", (v) => { K.set("ov.view", { inc: +v || null, phase: null }); K.redraw(); });
  K.on("ov.phase", (p) => { K.set("ov.view", { inc: view().inc, phase: p }); K.redraw(); });
  let PEND = null; // what an old address asked for, taken by the next draw of the Overview
  const pend = (o) => { PEND = Object.assign({ at: Date.now() }, o); };

  // ════════════════ Parts ════════════════
  const dueLine = (s) => {
    if (s.decided && (s.done || !s.due)) return `<span class="num">Decided ${esc(md(s.decided))}</span>`;
    if (!s.due) return '<span class="k3-none">—</span>';
    const d = days(s.due), near = d <= 14;
    return `<span class="num${d < 0 ? " k3o-late" : ""}">Due ${esc(md(s.due))}${near ? ` · ${d < 0 ? `${plural(-d, "day")} late` : d === 0 ? "today" : `in ${plural(d, "day")}`}` : ""}</span>`;
  };
  const stat = (s) => K.status(s.status, TONE[s.status] || "none");
  const mark = (s, nx) => `<i class="${s.status === "Not required" ? "skip" : s.done ? "done" : nx && nx.id === s.id ? "now" : ""}" title="${esc(`${s.short} · ${s.status}`)}"></i>`;
  function strip(n, open) {
    const all = steps(n), nx = all.find((s) => !s.done) || null;
    return `<div class="k3o-strip" role="group" aria-label="Phases of ${esc(incName(n))}">${PHASES.map(([code, long]) => {
      const l = all.filter((s) => s.phase === code), need = l.filter((s) => s.status !== "Not required"), dn = need.filter((s) => s.done).length;
      const state = nx && nx.phase === code ? "now" : need.length && dn === need.length ? "done" : l.length && !need.length ? "skip" : "";
      return `<button type="button" class="k3o-ph${open === code ? " on" : ""}${state ? " " + state : ""}" aria-pressed="${open === code}"${K.a("ov.phase", code)}><span class="k3o-ph-c">${esc(code)}</span><span class="k3o-ph-n">${esc(long)}</span><span class="k3o-marks" aria-hidden="true">${l.map((s) => mark(s, nx)).join("")}</span><span class="k3o-ph-m num">${need.length ? `${dn} of ${need.length} done` : "Not required"}</span></button>`;
    }).join("")}</div>`;
  }
  const readyCell = (s) => { if (s.status === "Not required") return '<span class="k3-none">—</span>'; const g = gate(s.id); return g && g.total ? K.ring(g.ready, g.total, "deliverables ready") : '<span class="k3-none">—</span>'; };
  const stepRow = (s, nx) => Object.assign({ cells: [K.name(s.title), esc(s.kind), dueLine(s), stat(s), readyCell(s)], cls: nx && nx.id === s.id ? "k3o-now" : "" }, s.status === "Not required" ? {} : isAuth(s.id) ? { go: "authorization" } : { panel: "k3o-gate", id: s.id });
  function stepsTable(n, phase) {
    const all = steps(n), nx = all.find((s) => !s.done) || null, rows = all.filter((s) => s.phase === phase);
    return K.table({ label: `${phase} steps`, cols: [{ label: "Step" }, { label: "Kind", cls: "nw" }, { label: "Due or decided", cls: "nw" }, { label: "Status" }, { label: "Ready", cls: "nw" }], rows: rows.map((s) => stepRow(s, nx)), empty: { title: "No steps in this phase" } });
  }
  // A deliverable's row: its state, its name, why it is not ready as a number, and the button that opens exactly those records.
  const dlRow = (g, d, i, inPanel) => `<li class="k3o-dl${d.ok ? " ok" : d.out ? " out" : ""}"><span class="k3o-dl-s" aria-hidden="true"></span><span class="k3o-dl-b"><span class="k3o-dl-n"><span class="k3-sr">${d.ok ? "Ready: " : d.out ? "Recorded with the decision: " : "Not ready: "}</span>${esc(d.name)}</span><span class="k3o-dl-w">${d.n != null && !d.ok ? `<b class="num">${fmt(d.n)}</b> ` : ""}${esc(d.why)}</span></span>${!d.ok && !d.out && d.btn ? K.btn(d.btn, { sm: true, primary: g.dls.findIndex((x) => !x.ok && !x.out) === i, act: "ov.dl", arg: { g: g.id, i, p: inPanel ? 1 : 0 } }) : ""}</li>`;
  const dlList = (g, inPanel) => `<ul class="k3o-dls">${g.dls.map((d, i) => dlRow(g, d, i, inPanel)).join("")}</ul>`;
  const critWord = { met: ["ok", "Met"], part: ["warn", "Partly met"], not: ["bad", "Not met"], na: ["none", "Not assessed"] };
  // The gate's one next step, with the button that does it.
  function nextOf(g, inPanel) {
    if (g.done) return "";
    const open = g.dls.map((d, i) => [d, i]).filter(([d]) => !d.ok && !d.out), who = decider(g), mine = who.name === ME, asked = /^Requested/.test(g.requested);
    if (open.length) return ""; // the first deliverable that is not ready carries the button: that is the next step
    if (g.total > g.ready) return K.next({ text: `${plural(g.total - g.ready, "deliverable")} of ${fmt(g.total)} not ready.`, action: "" }); // a gate whose deliverables are not listed (a created program's)
    if (mine) return K.next({ text: "Every deliverable is ready. The decision is yours.", action: K.btn("Record decision", { sm: true, primary: true, act: "ov.decide", arg: { id: g.id } }) });
    if (!who.name) return K.next({ text: `Every deliverable is ready. Nobody holds ${esc(who.role)} yet.`, action: K.btn("Assign the role", { sm: true, primary: true, act: "ov.assign", arg: who.role }) });
    if (asked) return K.next({ text: `Every deliverable is ready. ${esc(g.requested)}.`, action: K.btn(`Record as ${who.name}`, { sm: true, act: "ov.decide", arg: { id: g.id } }) });
    return K.next({ text: `Every deliverable is ready. ${esc(who.name)} decides.`, action: K.btn("Request decision", { sm: true, primary: true, act: "ov.request", arg: { id: g.id } }) });
  }
  function nextGateCard() {
    const s = nextStep();
    if (!s) return `<section class="k3-card k3o-gate"><span class="k3o-k">Lifecycle</span><h2 class="k3-card-t">Every step is decided</h2><p class="k3-muted">The program's increments have passed every gate.</p></section>`;
    if (isAuth(s.id)) return `<section class="k3-card k3o-gate"><div class="k3o-gate-h"><div><span class="k3o-k">Next gate</span><h2 class="k3-card-t">${esc(s.title)}</h2><p class="k3-muted">${esc(s.kind)} · ${dueLine(s)}</p></div></div>${K.next({ text: "The authorization package is this step's page.", action: K.btn("Open Authorization", { sm: true, primary: true, go: "authorization" }) })}</section>`;
    const g = gate(s.id), who = decider(g);
    return `<section class="k3-card k3o-gate" id="k3o-next"><div class="k3o-gate-h"><div><span class="k3o-k">Next gate</span><h2 class="k3-card-t"><a class="k3-link k3o-gate-t" href="#${esc(gateRoute(g.id))}">${esc(g.title)}</a></h2><p class="k3-muted">${esc(g.kind)} · ${dueLine(g)}${who.name ? ` · ${esc(who.name)} decides` : ""}</p></div>${g.total ? `<div class="k3o-gate-r">${K.ring(g.ready, g.total, "deliverables ready")}<span>deliverables ready</span></div>` : ""}</div>${g.dls.length ? dlList(g, false) : ""}${nextOf(g, false)}</section>`;
  }

  // ════════════════ Opening exactly the records that hold a deliverable back, with the return bar ════════════════
  K.on("ov.dl", (a) => {
    const g = gate(a.g), d = g && g.dls[a.i]; if (!d) return;
    let route = d.route, q = d.q || null;
    if (d.kind === "noreq") {
      if (V3.facts.baseline) { K.set("ctl.view", { chip: "noreq" }); route = "controls"; q = null; } // lane C's list, on its No requirement chip
      else { route = "k3o-noreq"; q = null; } // until lane C lands: the same controls as a plain list (the workbook hangs under the return bar)
    } else if (d.kind === "conns") {
      if (has("system-connections")) { K.set("sys.cview", { q: "", f: "noagr" }); route = "system-connections"; q = null; }
      else { route = "interconnections"; q = { rows: d.names, note: `Showing the ${plural(d.names.length, "connection")} ${g.short} waits on` }; }
    } else if (d.kind === "boundary") route = has("boundary-block-1-1") ? "boundary-block-1-1" : "system-boundary";
    if (!route) return;
    const label = `${d.n != null ? fmt(d.n) + " " : ""}${d.why}`;
    K.task.start({ from: { label: g.short, route: a.p ? gateRoute(g.id) : "overview" }, what: `${d.name}: ${label}`, steps: [q ? { label, route, q } : { label, route }] });
  });

  // Stand-in until lane C's Controls takes "ctl.view": exactly the controls with no requirement, each opening its panel.
  K.screen("k3o-noreq", () => {
    const rows = ((PA.SSP && PA.SSP.controls) || []).filter((c) => fact("status", c.c) === "no_requirement"), fam = Object.fromEntries(((PA.SSP && PA.SSP.families) || []).map((f) => [f.f, f.t]));
    return K.page({ head: K.head({ crumbs: [["Controls", "controls"], ["No requirement"]], title: "Controls with no requirement", sub: "A control joins a gate's Requirements deliverable once a requirement maps it. Open a control to map one." }),
      body: K.table({ label: "Controls with no requirement", cols: [{ label: "Control" }, { label: "Family" }, { label: "Status" }], rows: rows.map((c) => ({ panel: "a-tests-control", id: c.c, cells: [K.name(c.t, "", c.c), esc(fam[c.f] || c.f || ""), K.status("No requirement", "none")] })), empty: { title: "Every control has a requirement", line: "Nothing holds the Requirements deliverable back." }, foot: `<span class="num">${fmt(rows.length)} of ${fmt(((PA.SSP && PA.SSP.controls) || []).length)} controls</span>` }) });
  }, "controls");

  // ════════════════ The gate: its page (gate--<id>) and its preview ════════════════
  const decFacts = (g, who, asked) => (g.decided
    ? [["Decision", `${stat(g)} <span class="num">${esc(md(g.decided))}</span>`], ["Decided by", K.owner((g.chain[g.chain.length - 1] || {}).who || who.name)], K.get(`why.${safe(g.prog + "." + g.id)}`, "") ? ["Rationale", esc(K.get(`why.${safe(g.prog + "." + g.id)}`, ""))] : null]
    : [["Decides", `${K.owner(who.name)}<span class="k3-muted"> · ${esc(who.role)}</span>`], g.chain.length > 1 ? ["Reviews first", esc(list(g.chain.slice(0, -1).map((c) => `${c.who}, ${c.role}`)))] : null, ["Requested", asked ? esc(g.requested.replace(/^Requested /, "")) : '<span class="k3-none">Not requested yet</span>']]);
  const condsOf = (g) => (fact("conditions", g.prog) || []).filter((c) => c.step === g.id);
  // The page. One primary in the header: the decision (the holder's Record decision; anyone else's Request decision, and
  // "Record as <holder>", which is the prototype acting as that person and says so).
  function gatePage(g) {
    const who = decider(g), mine = who.name === ME, asked = /^Requested/.test(g.requested), arg = { id: g.id };
    const open = g.dls.map((d, i) => [d, i]).filter(([d]) => !d.ok && !d.out), unmet = g.crit.filter((c) => !c.out && c.state !== "met"), conds = condsOf(g);
    const asWho = who.name && !mine ? K.btn(`Record as ${who.name}`, { primary: asked, act: "ov.decide", arg, title: `The prototype acts as ${who.name}, who decides this step` }) : "";
    const primary = g.done ? "" : mine ? K.btn("Record decision", { primary: true, act: "ov.decide", arg })
      : !who.name ? K.btn("Assign the role", { primary: true, act: "ov.assign", arg: who.role })
      : asked ? asWho : `${asWho}${K.btn("Request decision", { primary: true, act: "ov.request", arg })}`;
    const next = g.done ? ""
      : open.length ? K.next({ text: `${plural(open.length, "deliverable")} ${open.length === 1 ? "holds" : "hold"} ${esc(g.short)} back. Start with ${esc(open[0][0].name)}: ${open[0][0].n != null ? fmt(open[0][0].n) + " " : ""}${esc(open[0][0].why)}.`, action: K.btn(open[0][0].btn || "Open", { sm: true, act: "ov.dl", arg: { g: g.id, i: open[0][1], p: 1 } }) })
      : g.total > g.ready ? K.next({ text: `${plural(g.total - g.ready, "deliverable")} of ${fmt(g.total)} not ready.`, action: "" })
      : unmet.length ? K.next({ text: `Every deliverable is ready. ${plural(unmet.length, "criterion", "criteria")} not met${unmet.some((c) => c.code) ? ` (${esc(unmet.map((c) => c.code).filter(Boolean).join(", "))})` : ""}: assess ${unmet.length === 1 ? "it" : "them"}, or pass with actions.`, action: "" })
      : K.next({ text: `Every deliverable is ready and every criterion met. ${who.name ? `${esc(who.name)} decides.` : `Nobody holds ${esc(who.role)} yet.`}`, action: "" });
    const recOf = (d) => (d.kind === "noreq" ? "controls" : d.kind === "conns" ? (has("system-connections") ? "system-connections" : "interconnections") : d.route);
    const dlRows = g.dls.map((d, i) => {
      const a = { g: g.id, i, p: 1 }, live = !d.ok && !d.out && d.btn;
      const cells = [K.name(d.name), d.out ? '<span class="k3-muted">With the decision</span>' : `<span class="k3o-rs${d.ok ? " ok" : ""}"><i class="k3o-dl-s" aria-hidden="true"></i>${d.ok ? "Ready" : "Not ready"}</span>`, `<span class="${d.ok || d.out ? "k3-muted" : "k3o-why"}">${d.n != null && !d.ok ? `<b class="num">${fmt(d.n)}</b> ` : ""}${esc(d.why)}</span>`, d.owner ? K.owner(d.owner) : '<span class="k3-none">—</span>', live ? K.btn(d.btn, { sm: true, act: "ov.dl", arg: a }) : ""];
      return Object.assign({ cells }, live ? { act: "ov.dl", arg: a } : d.panel && PA.P[d.panel] ? { panel: d.panel, id: d.pid } : recOf(d) && !d.out ? { go: recOf(d) } : {});
    });
    const critRows = g.crit.map((c) => {
      const [tone, word] = critWord[c.state] || critWord.na, a = { id: g.id, code: c.code, text: c.text, own: c.own || null };
      return { cells: [K.name(c.text, c.proc || "", c.code || ""), c.out ? '<span class="k3-muted">With the decision</span>' : K.status(word, tone), c.note ? esc(c.note) : '<span class="k3-none">—</span>',
        c.out || g.done ? "" : `<span class="k3o-acts">${K.btn("Assess", { sm: true, act: "ov.crit", arg: a })}${c.own || c.added ? K.btn("Remove", { sm: true, quiet: true, act: "ov.critrm", arg: a }) : ""}</span>`] };
    });
    return {
      label: "Gate", title: g.title, chip: stat(g), sub: esc(g.desc || ""), crumbs: [["Overview", "overview"], [g.title]],
      actions: `${K.menu("More", [{ label: "Export the gate", act: "ov.gexport", arg: g.id }, !g.done && mine && !asked ? { label: "Request a review first", act: "ov.request", arg } : null])}${primary}`,
      facts: [["Kind", esc(g.kind)], ["Increment", esc(incName(g.n))], ["Phase", esc(`${g.phase} · ${(PHASES.find((x) => x[0] === g.phase) || ["", ""])[1]}`)], g.decided && g.done ? ["Decided", `<span class="num">${esc(md(g.decided))}</span>`] : ["Due", g.due ? dueLine(g) : null]],
      side: [K.details("Decision", decFacts(g, who, asked).concat(g.done ? [] : [["Recorded by", `<span class="k3-muted">${mine ? `You hold ${esc(who.role)}: the decision is yours.` : who.name ? `${esc(who.name)} alone; anyone else requests it. "Record as ${esc(who.name)}" is the prototype acting as that person.` : `Nobody holds ${esc(who.role)} yet.`}</span>`]]), g.done ? "" : K.link("Team", "overview-team"))],
      sections: [
        next,
        g.dls.length ? K.section({ title: "Deliverables", count: g.total ? `${g.ready} of ${g.total} ready` : null, body: K.table({ label: "Deliverables", cols: [{ label: "Deliverable" }, { label: "Status", cls: "nw" }, { label: "What holds it back" }, { label: "Owner", cls: "nw" }, { label: "", cls: "tight" }], rows: dlRows }) })
          : g.total ? K.section({ title: "Deliverables", count: `${g.ready} of ${g.total} ready`, body: K.note("This program's deliverables are counted from its records but not listed yet.") }) : "",
        K.related({ id: "k3o-crit", title: "Criteria", count: g.criteria ? `${g.met} of ${g.criteria} met` : 0, add: g.done ? null : { label: "Add criterion", act: "ov.critadd", arg: g.id }, cols: [{ label: "Criterion" }, { label: "Status", cls: "nw" }, { label: "What meets it" }, { label: "", cls: "tight" }], rows: critRows, empty: "No criteria on this gate yet" }),
        conds.length ? K.section({ title: "Actions", count: conds.length, body: K.table({ label: "Actions", cols: [{ label: "Action" }, { label: "Owner", cls: "nw" }, { label: "Due", cls: "nw" }, { label: "Status", cls: "nw" }], rows: conds.map((c) => ({ cells: [K.name(c.t), K.owner(c.owner || null), `<span class="num">${esc(md(c.due))}</span>`, K.status(c.closed ? "Closed" : "Open", c.closed ? "ok" : "none")] })) }) }) : "",
      ],
    };
  }
  // The preview: the short form, with Open gate. What it lists is still doable from it.
  function gatePeek(g) {
    const who = decider(g), mine = who.name === ME, asked = /^Requested/.test(g.requested);
    const cr = g.crit.filter((c) => !c.out), crOut = g.crit.filter((c) => c.out), conds = condsOf(g);
    const critRows = g.crit.map((c) => { const [tone, word] = critWord[c.state] || critWord.na; return `<li class="k3o-cr"><span class="k3o-cr-b"><span class="k3o-cr-t">${esc(c.text)}</span><span class="k3o-cr-m">${c.code ? `<span class="k3-code">${esc(c.code)}</span> ` : ""}${esc(c.proc || "")}</span></span>${c.out ? `<span class="k3-muted">With the decision</span>` : `${K.status(word, tone)}${g.done ? "" : K.btn("Assess", { sm: true, quiet: true, act: "ov.crit", arg: { id: g.id, code: c.code, text: c.text, own: c.own || null } })}`}</li>`; }).join("");
    const act = g.done ? "" : mine ? K.btn("Record decision", { sm: true, primary: true, act: "ov.decide", arg: { id: g.id } })
      : !who.name ? K.btn("Assign the role", { sm: true, act: "ov.assign", arg: who.role })
      : `${asked ? "" : K.btn("Request decision", { sm: true, primary: true, act: "ov.request", arg: { id: g.id } })}${K.btn(`Record as ${who.name}`, { sm: true, act: "ov.decide", arg: { id: g.id }, title: `The prototype acts as ${who.name}, who decides this step` })}`;
    return {
      label: "Gate preview", title: g.title, chip: stat(g), page: gateRoute(g.id), open: "Open gate", actions: act,
      facts: [["Kind", esc(g.kind)], ["Increment", esc(`${incName(g.n)} · ${g.phase}`)], g.decided && g.done ? null : ["Due", g.due ? dueLine(g) : null]].concat(decFacts(g, who, asked)),
      sections: [
        nextOf(g, true),
        g.dls.length ? K.section({ title: "Deliverables", count: g.total ? `${g.ready} of ${g.total} ready` : null, body: dlList(g, true) }) : "",
        g.crit.length ? K.section({ title: "Criteria", count: cr.length ? `${g.met} of ${g.criteria} met` : crOut.length ? null : 0, body: `<ul class="k3o-crs">${critRows}</ul>` }) : "",
        conds.length ? K.section({ title: "Actions", count: conds.length, body: `<ul class="k3o-crs">${conds.map((c) => `<li class="k3o-cr"><span class="k3o-cr-b"><span class="k3o-cr-t">${esc(c.t)}</span><span class="k3o-cr-m">${esc(c.owner || "No owner")} · due ${esc(md(c.due))}</span></span>${K.status(c.closed ? "Closed" : "Open", c.closed ? "ok" : "none")}</li>`).join("")}</ul>` }) : "",
      ],
    };
  }
  K.panel("k3o-gate", (id, o) => {
    if (isAuth(id)) { const f = g0(id); return f && f.prog === prog() ? { label: "Gate", title: f.title, crumbs: [["Overview", "overview"], [f.title]], sections: [K.next({ text: "The authorization package is this step's page.", action: K.btn("Open Authorization", { sm: true, primary: true, go: "authorization" }) })] } : null; }
    const g = gate(id); if (!g) return null;
    return o && o.page ? gatePage(g) : gatePeek(g);
  });
  const key2 = (g) => `${g.prog}.${g.id}`;
  K.on("ov.request", (a) => {
    const g = gate(a.id); if (!g) return; const who = decider(g), open = g.dls.filter((d) => !d.ok && !d.out);
    K.form({ title: "Request decision", submit: "Request decision", intro: `${esc(g.title)} waits on ${esc(who.name || who.role)}, ${esc(who.role)}.${open.length ? ` ${plural(open.length, "deliverable")} ${open.length === 1 ? "is" : "are"} not ready, so it cannot pass yet.` : ""}`,
      fields: [{ key: "note", label: "Message", type: "textarea", rows: 3 }],
      onSubmit: () => { if (g.status === "Not passed") V2.set("life.dec." + key2(g), false); V2.set("life.req." + key2(g), { at: TODAY, by: ME }); K.redraw(); K.toast(`Decision requested: ${g.short} waits on ${who.name || who.role}`); } });
  });
  K.on("ov.decide", (a) => {
    const g = gate(a.id); if (!g || g.done) return;
    const who = decider(g), acting = who.name !== ME, by = who.name || ME;
    const open = g.dls.filter((d) => !d.ok && !d.out), unmet = g.crit.filter((c) => !c.out && c.state !== "met");
    K.form({ title: "Record decision", submit: "Record decision",
      intro: `${esc(g.title)} · ${g.total ? `${g.ready} of ${g.total} deliverables ready` : "no deliverables"} · ${g.met} of ${g.criteria} criteria met.${acting && who.name ? ` <b>The prototype is acting as ${esc(who.name)}</b>, ${esc(who.role)}, who decides this step. In the product only ${esc(who.name)} sees this form.` : ""}`,
      fields: [
        { key: "o", label: "Decision", type: "select", required: true, options: [["yes", "Pass"], ["cond", "Pass with actions"], ["no", "Not passed"]] },
        { key: "why", label: "Rationale", type: "textarea", rows: 3, required: true },
        { key: "acts", label: "Actions", type: "textarea", rows: 3, hint: "For Pass with actions: one action a line. Each is tracked with its owner and due day until it is closed." },
        { key: "owner", label: "Owner of the actions", type: "select", options: team().people.map((p) => p.name), half: true },
        { key: "due", label: "Actions due", type: "date", half: true },
      ],
      onSubmit: (v) => {
        // lead: only a plain Pass waits on every deliverable. Pass with actions is how a gate passes with something open: each
        // action is tracked to its owner and due day (the form refused both, so the only decision it would record was Not passed).
        if (v.o === "yes" && !open.length && g.total > g.ready) return { o: `Pass waits on ${plural(g.total - g.ready, "deliverable")} not ready. Choose Pass with actions and say what closes ${g.total - g.ready === 1 ? "it" : "them"}, or Not passed.` };
        if (v.o === "yes" && open.length) return { o: `Pass waits on ${list(open.map((d) => d.name))}: ${open[0].n != null ? fmt(open[0].n) + " " : ""}${open[0].why}. Choose Pass with actions and say what closes ${open.length === 1 ? "it" : "them"}, or Not passed.` };
        if (v.o === "yes" && unmet.length) return { o: `Pass waits on ${plural(unmet.length, "criterion", "criteria")} not met${unmet.some((c) => c.code) ? ` (${unmet.map((c) => c.code).filter(Boolean).join(", ")})` : ""}. Assess them, or choose Pass with actions.` };
        const acts = v.o === "cond" ? String(v.acts || "").split(/\n+/).map((x) => x.trim()).filter(Boolean) : [];
        if (v.o === "cond" && !acts.length) return { acts: "Enter at least one action, one a line." };
        if (v.o === "cond" && !v.owner) return { owner: "Choose who closes the actions." };
        if (v.o === "cond" && (!v.due || v.due < TODAY)) return { due: "Choose today or a later day." };
        const k = key2(g), chain = g.chain.length ? g.chain : [{ who: by, role: who.role }];
        V2.set("v3.G.steps." + k, chain.map((c, i) => ({ i, who: i === chain.length - 1 ? by : c.who, role: c.role, o: i === chain.length - 1 ? v.o : "approve", note: i === chain.length - 1 ? v.why : "Recorded with the decision", at: TODAY, rec: ME })));
        if (acts.length) V2.set("v3.G.cond." + k, acts.map((t, j) => ({ id: `${k}#${j + 1}`, t, owner: v.owner, due: v.due, at: TODAY })));
        K.set("why." + safe(k), v.why);
        V2.set("life.dec." + k, { o: v.o, c: v.o === "cond" ? acts.join("; ") : v.why, at: TODAY, by, rec: ME });
        const nx = nextStep();
        K.redraw();
        K.toast(`${g.short} ${v.o === "yes" ? "passed" : v.o === "cond" ? `passed with ${plural(acts.length, "action")}` : "not passed"}, recorded ${acting && who.name ? `as ${who.name}` : "by you"}${v.o !== "no" && nx && nx.id !== g.id ? ` · next: ${nx.short}` : ""}`, v.o !== "no" && nx && nx.id !== g.id ? { label: `Open ${nx.short}`, route: isAuth(nx.id) ? "authorization" : gateRoute(nx.id) } : undefined);
      } });
  });
  K.on("ov.crit", (a) => {
    const g = gate(a.id); if (!g) return; const c = g.crit.find((x) => (a.own ? x.own === a.own : a.code ? x.code === a.code : !x.own && x.text === a.text)); if (!c) return;
    K.form({ title: a.code ? `Assess ${a.code}` : "Assess the criterion", submit: "Record", intro: esc(c.text) + (a.code ? ` <span class="k3-muted">One status per security outcome per increment: every gate that carries ${esc(a.code)} reads it.</span>` : ""),
      fields: [{ key: "s", label: "Status", type: "select", required: true, value: c.state === "na" ? "" : c.state, options: [["met", "Met"], ["part", "Partly met"], ["not", "Not met"]] }, { key: "note", label: "What meets it", type: "textarea", rows: 3 }],
      onSubmit: (v) => { if (a.own) K.patch(ownKey(g.prog, g.id), (x) => x.id === a.own, { s: v.s, note: v.note }); else V2.set(a.code ? `v3.G.out.${g.n}.${safe(a.code)}` : `v3.G.crit.${key2(g)}`, { s: v.s, at: TODAY, by: ME, note: v.note }); K.redraw(); K.toast(`${a.code || "Criterion"} recorded: ${critWord[v.s][1].toLowerCase()}`); } });
  });
  // Add criterion: where NIST SP 800-160 Vol. 1 gives the gate's process outcomes it does not hold yet (v2's own list, read from
  // its dialog), choose among them; the picker's first line, and every other gate, writes one.
  function outcomeItems(g) {
    if (g.prog !== WSX || g.n !== 2 || !PA.M["v2f-outcomes"] || !/^(pdr|cdr)$/.test(g.key)) return [];
    let m = null; try { m = V3.force(false, () => PA.M["v2f-outcomes"](g.key)); } catch (e) { m = null; }
    const c = tpl(m && m.body), proc = (/gives (.+?), which/.exec(txt(c.querySelector("p"))) || [0, "Security outcome"])[1], held = new Set(g.crit.map((x) => x.code));
    return [...c.querySelectorAll("label")].map((l) => ({ id: txt(l.querySelector("b")), code: txt(l.querySelector("b")), title: txt(l.querySelector("small")), group: proc })).filter((x) => x.id && !held.has(x.id));
  }
  K.on("ov.critadd", (id) => {
    const g = gate(id); if (!g || g.done) return;
    const write = () => K.form({ title: "Add criterion", submit: "Add criterion", intro: `What ${esc(g.short)} must meet to pass. It starts not assessed, and Pass waits on it.`,
      fields: [{ key: "text", label: "Criterion", type: "textarea", rows: 3, required: true }, { key: "proc", label: "Where it comes from", placeholder: "DoDI 8510.01, the program's test plan, …" }],
      onSubmit: (v) => { if (g.crit.some((x) => x.text.toLowerCase() === v.text.toLowerCase())) return { text: "This gate already holds that criterion." }; K.push(ownKey(g.prog, g.id), { id: K.id("cr"), text: v.text, proc: v.proc || "", s: "na", note: "" }); K.redraw(); K.toast(`Criterion added to ${g.short}: not assessed yet`); } });
    const items = outcomeItems(g);
    if (!items.length) { write(); return; }
    K.pick({ title: "Add criteria", multi: true, search: "Search security outcomes", intro: `The outcomes NIST SP 800-160 Vol. 1 gives ${esc(items[0].group)} that ${esc(g.short)} does not hold yet. Each becomes a criterion, not assessed until someone records it.`,
      submit: (n) => (n ? `Add ${plural(n, "criterion", "criteria")}` : "Add criteria"), items, create: { label: "Write a criterion", onCreate: write },
      onPick: (ids) => { const have = V2.get(`gate.${g.key}.added`, null) || []; V2.set(`gate.${g.key}.added`, have.concat(ids.map((c) => { const it = items.find((x) => x.id === c); return { code: c, title: it ? it.title : c, proc: it ? it.group : "" }; }))); K.redraw(); K.toast(`${plural(ids.length, "criterion", "criteria")} added to ${g.short}: ${ids.join(", ")}`); } });
  });
  K.on("ov.critrm", (a) => {
    const g = gate(a.id), c = g && g.crit.find((x) => (a.own ? x.own === a.own : x.added && x.code === a.code)); if (!c) return;
    K.confirm({ title: "Remove criterion", text: `${esc(c.text)}<br><span class="k3-muted">It leaves ${esc(g.short)}'s criteria and its count.${c.code ? ` ${esc(c.code)} keeps its status for the other gates that carry it.` : " Nothing else reads it."}</span>`, submit: "Remove criterion", danger: true,
      onOk: () => { if (a.own) K.drop(ownKey(g.prog, g.id), (x) => x.id === a.own); else V2.set(`gate.${g.key}.added`, (V2.get(`gate.${g.key}.added`, null) || []).filter((x) => x.code !== a.code)); K.redraw(); K.toast("Criterion removed"); } });
  });
  // Exports are files the page makes (K.save): the lifecycle, a gate, the team, the activity shown.
  const csv = (rows) => rows.map((r) => r.map((c) => { c = String(c == null ? "" : c); return /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c; }).join(",")).join("\n") + "\n";
  K.on("ov.gexport", (id) => {
    const g = gate(id); if (!g) return;
    K.save(`${g.prog}-${g.id}.csv`, csv([["Gate", g.title], ["Status", g.status], ["Due", g.due || ""], ["Decided", g.decided || ""], [], ["Deliverable", "State", "What holds it back", "Owner"]].concat(g.dls.map((d) => [d.name, d.ok ? "Ready" : d.out ? "With the decision" : "Not ready", `${d.n != null && !d.ok ? d.n + " " : ""}${d.why}`, d.owner || ""]), [[], ["Criterion", "Code", "Status", "What meets it"]], g.crit.map((c) => [c.text, c.code || "", c.out ? "With the decision" : (critWord[c.state] || critWord.na)[1], c.note || ""]))));
  });

  // ════════════════ The Overview ════════════════
  const progRec = () => {
    if (wsx()) return { name: "WS-X90 Sentinel Mission System", code: WSX };
    const m = PA.v2hubs && PA.v2hubs.madeOne ? PA.v2hubs.madeOne(prog()) : null;
    return { name: (m && m.name) || prog(), code: prog() };
  };
  function authChip() {
    const l = (fact("authorizations", prog()) || []).filter((a) => a.decided).sort((a, b) => String(b.decided).localeCompare(String(a.decided)));
    const a = l[0], word = a ? a.type : "Not authorized";
    return `<a class="k3o-chip" href="#authorization" title="Open Authorization">${K.status(word, !a ? "none" : /condition/i.test(word) ? "warn" : /DATO|Not approved/.test(word) ? "bad" : "ok")}</a>`;
  }
  const tabs = (on) => K.tabs([{ label: "Overview", route: "overview", on: on === "overview" }, { label: "Team", count: team().people.length, route: "overview-team", on: on === "team" }, { label: "Activity", route: "overview-activity", on: on === "activity" }], "Program");
  const head = (actions) => { const p = progRec(); return K.head({ crumbs: [["Programs", "portfolio"], [p.code]], title: p.name, code: p.code, chip: authChip(), actions }); };
  const more = () => K.menu("More", [{ label: "Program settings", go: has("program-settings") ? "program-settings" : "settings" }, { label: "Export the lifecycle", act: "ov.export" }]);
  K.on("ov.export", () => K.save(`${prog()}-lifecycle.csv`, csv([["Increment", "Phase", "Step", "Kind", "Due", "Decided", "Status", "Deliverables ready", "Deliverables"]].concat(incs().flatMap((n) => steps(n).map((x) => { const g = x.status === "Not required" ? null : gate(x.id); return [incName(n), x.phase, x.title, x.kind, x.due || "", x.decided || "", x.status, g ? g.ready : "", g ? g.total : ""]; }))))));
  K.on("ov.texport", () => { const t = team(); K.save(`${prog()}-team.csv`, csv([["Role", "RMF role", "Held by", "Decides"]].concat(t.roles.map((r) => [r.role, r.rmf || "", r.holder || "", r.decides || ""]), [[], ["Person", "Organization", "Roles"]], t.people.map((x) => [x.name, x.org || "", x.roles.map((r) => r.role).join("; ")])))); });
  K.on("ov.aexport", () => { const rows = [...document.querySelectorAll("#main table.k3o-log tr")].map((tr) => [...tr.cells].map((c) => txt(c))); if (rows.length) K.save(`${prog()}-activity.csv`, csv(rows)); });
  const goAct = (route, q) => ({ act: "ov.go", arg: { r: route, q: q || null } });
  // A count opens its list on exactly those records: the new pages keep their filters as kit data (lanes C, D, E document the
  // shapes), set before going; where a lane is not in the build the old page's question stands.
  const hasF = (f) => typeof V3.facts[f] === "function";
  const goSet = (route, key, view, old) => ({ act: "ov.go", arg: { r: route, set: [key, view], q: null, old: old || null } });
  K.on("ov.go", (a) => { if (a.set) K.set(a.set[0], a.set[1]); if (a.q) V2.go(a.r, a.q); else K.go(a.r); });
  function standing() {
    const c0 = fact("controls", prog()), i = fact("issues", prog()), r = fact("risks", prog()), e = fact("evidence", prog()), ib = fact("inbox");
    const bl = hasF("baseline") && wsx() ? fact("baseline") : null, fc = hasF("findingCounts") && wsx() ? fact("findingCounts") : null;
    const c = c0 && bl && bl.total != null ? Object.assign({}, c0, { total: bl.total }) : c0; // the baseline's total is lane C's
    const issues = fc && fc.bySource && fc.bySource.issue != null ? fc.bySource.issue : i ? i.open : null; // open operational issues are lane E's
    const comp = c ? K.completion(Object.assign({ title: "Controls", label: "Controls satisfied", done: c.satisfied, total: c.total, unit: "controls" }, hasF("baseline") ? goSet("controls", "ctl.view", { status: "satisfied" }) : goAct("controls"), { minis: [Object.assign({ label: "With evidence", done: c.total - c.no_evidence - c.no_requirement, total: c.total }, hasF("baseline") ? goSet("controls", "ctl.view", { mini: "ev" }) : goAct("controls")), Object.assign({ label: "Assessed", done: c.satisfied + c.partially_satisfied + c.other_than_satisfied, total: c.total }, hasF("baseline") ? goSet("controls", "ctl.view", { mini: "assessed" }) : goAct("controls"))] })) : "";
    const att = K.attention({ rows: [
      issues != null ? Object.assign({ label: "Operational issues", n: issues }, hasF("findingCounts") ? goSet("findings-issues", "fnd.view", { chip: "open" }) : goAct("findings")) : null,
      r ? Object.assign({ label: "Risks without an owner", n: r.noOwner }, hasF("findingCounts") ? goSet("risks", "rsk.view", { chip: "noowner" }) : goAct("risks", { filter: { qv: "No owner" } })) : null,
      e ? Object.assign({ label: "Evidence waiting on review", n: e.pending }, hasF("evPanel") ? goSet("evidence", "evd.view", { rail: "", chip: "pending" }) : goAct("evidence", { filter: { qv: "Pending review" } })) : null,
      ib ? Object.assign({ label: "Your tasks", n: ib.assigned }, goAct("my-work", { filter: { qv: "Assigned to me" } })) : null].filter(Boolean) });
    return comp ? K.cards(comp, att) : K.cards(att);
  }
  function sideOf(orig) {
    const c = tpl(typeof orig === "function" ? (() => { try { return orig(); } catch (e) { return ""; } })() : ""), kv = {};
    const dl = c.querySelector(".ak-rail dl.ak-kv"); let hid = null;
    if (dl) for (const d of dl.querySelectorAll("dt")) kv[txt(d)] = txt(d.nextElementSibling);
    const host = c.querySelector(".ak-rail [data-panel='v2h-prov']");
    const base = fact("baseline"), ng = fact("nextGate");
    if (!wsx() && !dl) { // lane P's program: what the wizard recorded
      const m = (PA.v2hubs && PA.v2hubs.madeOne && PA.v2hubs.madeOne(prog())) || {}, sy = (m.systems || [])[0] || {}, cia = sy.cia || [];
      const hp = m.host && PA.v2host && PA.v2host.providers ? (PA.v2host.providers() || []).find((x) => x.id === m.host) : null;
      if (sy.code) kv.System = sy.code; if (sy.type) kv.Type = sy.type;
      if (hp) { kv["Host system"] = hp.name; kv.__host = hp.id; }
      if (cia.length === 3) kv.Categorization = `C ${cia[0]} · I ${cia[1]} · A ${cia[2]}`;
      kv.Baseline = "Control baseline";
    }
    const rows = [
      kv.System ? ["System", `${hasF("components") ? K.actLink(kv.System, "ov.go", { r: "system", set: ["sys.view", { rail: "", q: "", att: "" }] }) : K.link(kv.System, "system")}${kv.Type ? `<span class="k3-muted"> · ${esc(kv.Type)}</span>` : ""}`] : null,
      (hid = host ? host.getAttribute("data-id") : kv.__host || null, kv["Host system"]) ? ["Host system", K.link(kv["Host system"], hid && has("component--" + hid) ? "component--" + hid : hid ? "rec--v2h-prov--" + hid : "system")] : null,
      kv.Categorization ? ["Categorization", K.link(kv.Categorization, "itcsc")] : null,
      kv.Baseline ? ["Baseline", ((label) => (hasF("baseline") ? K.actLink(label, "ov.go", { r: "controls", set: ["ctl.view", {}] }) : K.link(label, "controls")))(`${kv.Baseline.replace(/\s*·.*$/, "")} · ${fmt(base && base.total != null ? base.total : (fact("controls", prog()) || {}).total || 0)} controls`)] : null,
      ng ? ["Next gate", `${K.link(ng.name.split(" · ")[0], isAuth(ng.id) ? "authorization" : gateRoute(ng.id))}<span class="k3-muted num"> · ${esc(md(ng.due))}</span>`] : null,
      kv["Next date"] ? ["Next date", esc(kv["Next date"])] : null,
    ];
    const t = team(), rmf = t.roles.filter((r) => r.rmf || r.role === "Chief engineer");
    return [K.details("Details", rows), K.details("Team", rmf.map((r) => [roleShort(r), r.holder ? `<span class="k3o-pers" role="button" tabindex="0" data-panel="a-people-person" data-id="${esc(r.holder)}">${K.owner(r.holder)}</span>` : K.actLink("Assign", "ov.assign", r.role)]), K.link("Manage", "overview-team"))];
  }
  function lifecycle() {
    const v = view(), cur = curInc();
    const sel = incs().length > 1 ? `<label class="k3-flt on"><span class="k3-sr">Increment</span><select data-k3-input="ov.inc">${incs().slice().reverse().map((n) => `<option value="${n}"${n === v.inc ? " selected" : ""}>${esc(incName(n))} · ${n === cur ? "current" : "fielded"}</option>`).join("")}</select></label>` : `<span class="k3-muted">${esc(incName(v.inc))}</span>`;
    const ato = v.inc !== cur ? (fact("authorizations", prog()) || []).filter((a) => a.inc === v.inc && a.decided && /ATO/.test(a.type)).pop() : null;
    const note = ato ? `<p class="k3-muted">${esc(incName(v.inc))} is fielded under the ${esc(ato.type)} of ${esc(dt(ato.decided).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))}. ${K.link("Open Authorization", "authorization")}</p>` : "";
    return K.section({ id: "k3o-life", title: "Lifecycle", actions: sel, body: [strip(v.inc, v.phase), note, stepsTable(v.inc, v.phase)] });
  }
  function overview(orig) {
    if (!steps(curInc()).length) return null; // a program with no lifecycle here: the earlier page
    const p = PEND && Date.now() - PEND.at < 1500 ? PEND : null; PEND = null;
    if (p && (p.now || p.inc)) { const want = p.inc ? { inc: p.inc, phase: null } : null, v = K.get("ov.view", null); if (JSON.stringify(want) !== JSON.stringify(v || null)) K.set("ov.view", want); }
    const guide = !wsx() ? guideCard() : "";
    return K.page({ cls: "k3o", head: head(more()), tabs: tabs("overview"), body: [K.aside([lifecycle(), guide || nextGateCard()], sideOf(orig)), standing()] });
  }
  // A created program (lane P's): its own steps, counts and people; its setup guide is its next step.
  function guideCard() {
    const f = fact("program", prog()), gd = f && f.guide; if (!gd || !gd.steps) return "";
    const first = gd.steps.findIndex((s) => !s.done);
    return `<section class="k3-card k3o-gate" id="k3o-next"><div class="k3o-gate-h"><div><span class="k3o-k">Next step</span><h2 class="k3-card-t">Set up the program</h2><p class="k3-muted">Each step reads its records: it is done when they are.</p></div><div class="k3o-gate-r">${K.ring(gd.done, gd.total, "steps done")}<span>steps done</span></div></div><ul class="k3o-dls">${gd.steps.map((s, i) => `<li class="k3o-dl${s.done ? " ok" : ""}"><span class="k3o-dl-s" aria-hidden="true"></span><span class="k3o-dl-b"><span class="k3o-dl-n"><span class="k3-sr">${s.done ? "Done: " : "To do: "}</span>${esc(s.title || s.label || "")}</span><span class="k3o-dl-w">${esc(s.sub || "")}</span></span>${!s.done && s.route ? K.btn(s.act || "Open", { sm: true, primary: i === first, go: s.route }) : ""}</li>`).join("")}</ul></section>`;
  }
  V3.S("overview", (orig) => { let html = null; try { html = overview(orig); } catch (e) { console.error(e); html = null; } return html == null ? orig() : html; });

  // ════════════════ Team ════════════════
  const personCell = (n) => (n ? `<span class="k3o-pers">${K.owner(n)}${n === ME ? '<span class="k3-muted"> · you</span>' : ""}</span>` : '<span class="k3-none">Nobody yet</span>');
  K.on("ov.assign", (role) => {
    const t = team(), r = t.roles.find((x) => x.role === role);
    K.form({ title: "Assign a role", submit: "Assign the role", intro: r ? `${esc(r.role)}${r.holder ? ` is held by ${esc(r.holder)}; the new holder takes it from today.` : " is held by nobody yet."}${r.decides ? ` Decides: ${esc(r.decides)}.` : ""}` : "The holder takes the role from today; the gates it decides name them at once.",
      fields: [{ key: "role", label: "Role", type: "select", required: true, value: role || "", options: t.roles.map((x) => [x.role, x.rmf ? `${x.role} (${x.rmf})` : x.role]) }, { key: "who", label: "Person", type: "select", required: true, options: t.people.map((p) => p.name) }],
      onSubmit: (v) => {
        const x = t.roles.find((y) => y.role === v.role); if (!x) return { role: "Choose a role." };
        if (x.holder === v.who) return { who: `${v.who} already holds this role.` };
        K.set(pk("team.roles"), Object.assign({}, K.get(pk("team.roles"), {}) || {}, { [v.role]: v.who }));
        K.redraw(); K.toast(`${v.who} holds ${v.role}${x.holder ? `, taken from ${x.holder}` : ""}`);
      } });
  });
  K.on("ov.person", () => {
    const t = team();
    K.form({ title: "Add a person", submit: "Add the person", fields: [{ key: "name", label: "Name", required: true }, { key: "org", label: "Organization", value: "Program office", half: true }, { key: "role", label: "Role", type: "select", half: true, options: t.roles.map((x) => [x.role, x.rmf ? `${x.role} (${x.rmf})` : x.role]), hint: "Optional: the role they take from today." }],
      onSubmit: (v) => {
        if (t.people.some((p) => p.name.toLowerCase() === v.name.toLowerCase())) return { name: "This person is already on the program." };
        K.push(pk("team.people"), { name: v.name, org: v.org });
        if (v.role) K.set(pk("team.roles"), Object.assign({}, K.get(pk("team.roles"), {}) || {}, { [v.role]: v.name }));
        K.redraw(); K.toast(`${v.name} added${v.role ? ` as ${v.role}` : ""}`);
      } });
  });
  function teamPage() {
    const t = team(), rmf = t.roles.filter((r) => r.rmf), other = t.roles.filter((r) => !r.rmf);
    const roleRow = (r) => ({ cells: [K.name(r.role, r.decides ? `Decides: ${r.decides}` : "", r.rmf || ""), r.holder ? `<span class="k3o-pers" role="button" tabindex="0" data-panel="a-people-person" data-id="${esc(r.holder)}">${personCell(r.holder)}</span>` : personCell(null), K.btn(r.holder ? "Reassign" : "Assign", { sm: true, quiet: !!r.holder, act: "ov.assign", arg: r.role })] });
    const rolesT = K.table({ label: "Roles", cols: [{ label: "Role" }, { label: "Held by" }, { label: "", cls: "tight" }], rows: [].concat(rmf.map(roleRow), other.length ? [{ group: "Other responsibilities" }] : [], other.map(roleRow)) });
    const known = (n) => !!(PA.P["a-people-person"] && wsx() && !t.people.find((p) => p.name === n).added);
    const peopleT = K.table({ label: "People", cols: [{ label: "Person" }, { label: "Roles" }, { label: "Organization" }, { label: "SSP access" }], rows: t.people.map((p) => Object.assign({ cells: [personCell(p.name), p.roles.length ? esc(p.roles.map(roleShort).join(" · ")) : '<span class="k3-none">No role held</span>', esc(p.org || ""), p.ssp ? esc(p.ssp) : '<span class="k3-none">—</span>'] }, known(p.name) ? { panel: "a-people-person", id: p.name } : {})), empty: { title: "Nobody on the program yet", line: "Add the first person.", action: K.btn("Add a person", { sm: true, act: "ov.person" }) } });
    const moreM = wsx() ? K.menu("More", [has("people-8140") ? { label: "DoD 8140 qualifications", go: "people-8140" } : null, has("people-access") ? { label: "Privileged access reviews", go: "people-access" } : null, has("people-task-sets") ? { label: "Role task sets", go: "people-task-sets" } : null, { label: "Export the team", act: "ov.texport" }]) : "";
    return K.page({ cls: "k3o", head: head(moreM), tabs: tabs("team"), body: [
      K.section({ title: "Roles", count: t.roles.length, actions: K.btn("Assign a role", { sm: true, icon: "plus", act: "ov.assign", arg: "" }), sub: "Who holds each role today. A gate names the holder of its deciding role, and only that person records its decision.", body: rolesT }),
      K.section({ title: "People", count: t.people.length, actions: K.btn("Add a person", { sm: true, icon: "plus", act: "ov.person" }), body: peopleT })] });
  }
  K.screen("overview-team", teamPage, "overview");
  // Lane P draws its own page over every address that starts with "overview" while a created program is current, and wraps
  // pages registered after it as they appear. The Team and Activity tabs are this lane's for every program: keep them on top.
  const TOP = {};
  const onTop = (route, draw) => { const fix = () => { if (!S[route] || S[route] === TOP[route]) return false; V3.S(route, () => draw()); TOP[route] = S[route]; return true; }; fix(); window.addEventListener("hashchange", fix); V3.ready(() => { if (fix() && V3.on() && (location.hash || "").slice(1) === route) K.redraw(); }); };
  onTop("overview-team", teamPage);

  // ════════════════ Activity ════════════════
  const ACT_KINDS = [["", "All", "activity"], ["reviews", "Evidence reviews", "activity-reviews"], ["imports", "Imports", "activity-imports"], ["decisions", "Decisions and publications", "activity-decisions"], ["system", "Daily job", "activity-system"]];
  K.on("ov.act", (k) => { K.set("ov.act", k || ""); K.redraw(); });
  function activityPage() {
    const kind = K.get("ov.act", "") || "", cur = ACT_KINDS.find((x) => x[0] === kind) || ACT_KINDS[0];
    let c = null;
    try { c = tpl(V3.force(true, () => (S[cur[2]] ? S[cur[2]]() : ""))); } catch (e) { c = null; }
    const counts = {};
    if (c) for (const el of c.querySelectorAll("[role='tab']")) { const n = el.querySelector(".ct, .num"); if (n) counts[txt(el).replace(txt(n), "").trim()] = +txt(n).replace(/,/g, "") || 0; }
    const tbl = c && c.querySelector('table[aria-label="Events"]');
    const body = tbl ? `<div class="frame k3-frame"><div class="tablebox"><table class="k3-table k3o-log" aria-label="Activity">${tbl.querySelector("thead").outerHTML}${tbl.querySelector("tbody").outerHTML}</table></div>${c.querySelector(".pager .num") ? `<div class="pager"><span class="num">${esc(txt(c.querySelector(".pager .num")))}</span></div>` : ""}</div>` : K.empty({ title: "No activity yet", line: "What is decided, reviewed, imported and published in this program is listed here, newest first." });
    return K.page({ cls: "k3o", head: head(K.menu("More", [{ label: "Export the activity as CSV", act: "ov.aexport" }])), tabs: tabs("activity"), body: [tbl ? K.chips(ACT_KINDS.map(([id, label]) => ({ id, label, count: counts[label], on: id === kind })), "ov.act", "Kind of activity") : "", body] });
  }
  const activityAny = () => (wsx() ? activityPage() : K.page({ cls: "k3o", head: head(""), tabs: tabs("activity"), body: K.empty({ title: "No activity yet", line: "What is decided, reviewed, imported and published in this program is listed here, newest first." }) }));
  K.screen("overview-activity", activityAny, "overview");
  onTop("overview-activity", activityAny);

  // ════════════════ Folding: old addresses open their new home ════════════════
  V3.redirect(/^lifecycle(-increment-\d+)?$/, (r) => { const m = /increment-(\d+)$/.exec(r); pend(m ? { inc: +m[1] } : { now: true }); return "overview"; });
  V3.redirect(/^(lifecycle-outcomes|sse)(-|$)/, () => { const s = nextStep(); if (s && !isAuth(s.id)) return gateRoute(s.id); pend({ now: true }); return "overview"; });
  V3.redirect(/^lifecycle-([a-z-]+-\d+)$/, (r) => { const id = r.replace(/^lifecycle-/, ""); if (/^(increment|outcomes)/.test(id)) return null; return isAuth(id) ? "authorization" : gateRoute(id); });
  V3.redirect(/^rec--a-work-gate--/, (r) => { const k = r.replace(/^rec--a-work-gate--/, ""); return gateRoute(/-\d+$/.test(k) ? k : k + "-2"); });
  V3.redirect(/^gate--(iatt|ato)-\d+$/, "authorization");
  V3.redirect(/^getting-started(-|$)/, "overview");
  V3.redirect(/^people(-roles)?$/, "overview-team");
  V3.redirect(/^activity(-\w+)?$/, (r) => { const k = r.replace(/^activity-?/, ""); if (ACT_KINDS.some((x) => x[0] === k)) setTimeout(() => { if (K.get("ov.act", "") !== k) { K.set("ov.act", k); K.redraw(); } }, 0); return "overview-activity"; });
  V3.compareAs("overview-team", "people");

  // The line under the program switcher: the same count, and it opens the Overview on the current phase.
  if (PA.v2life && typeof PA.v2life.headLine === "function") {
    const head0 = PA.v2life.headLine;
    const mine = () => { const s = nextStep(), g = s ? gate(s.id) : null, n = curInc(); return `<a class="v2g-head" href="#overview" data-k3o-now="1" title="Open the lifecycle on Overview">${esc([incName(n).split(" · ")[0], s ? s.phase : PHASES[4][0], s ? `next ${s.short} ${md(s.due)}` : "every step done", g && g.total ? `${g.ready} of ${g.total} ready` : ""].filter(Boolean).join(" · "))}</a>`; };
    PA.v2life.headLine = function () { if (!V3.on() || !wsx()) return head0.apply(this, arguments); try { return mine(); } catch (e) { return head0.apply(this, arguments); } };
    let pendHead = null;
    const again = () => { clearTimeout(pendHead); pendHead = setTimeout(() => { if (!V3.on() || !wsx()) return; const el = document.querySelector("#nav .v2g-head"); if (!el) return; let html = ""; try { html = mine(); } catch (e) { return; } const t = tpl(html).firstElementChild; if (t && el.outerHTML !== t.outerHTML) el.replaceWith(t); }, 60); };
    V2.on(again);
    V3.navDrawn(again);
    document.addEventListener("click", (e) => { if (!V3.on()) return; const a = e.target && e.target.closest ? e.target.closest("[data-k3o-now]") : null; if (!a) return; pend({ now: true }); if ((location.hash || "").slice(1) === "overview") { e.preventDefault(); K.set("ov.view", null); K.redraw(); } }, true);
  }
})();
