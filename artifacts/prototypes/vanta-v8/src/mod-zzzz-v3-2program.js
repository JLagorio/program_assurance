// Prototype V3, lane P (v3p-): a created program is real. While V3 is on and the current program is one created in this session,
// every program page draws that program's own records: what the wizard wrote (its system and elements, its baseline, its roles,
// a draft ITCSC), each build page's first action, and the chain from requirement to authorization package. Inert while V3 is off.
// State (PA.v2 session state, cleared by PA.v2.reset): v3.P.<program code>.<kind> = [records]; kinds: el (elements added after
// creation), ic (interconnections), port (ports & protocols), tl (tailoring decisions), pol (policies), stig (checklists), req
// (requirements, each with ctl: [control codes]), ev (evidence, each against a requirement), nar ({ control: narrative }), ssp
// ({ state, at }), camp (assessment campaigns), iss (operational issues), poam, risk, pkg (authorization packages), prov (added
// providers), itcsc ({ pm, ao } signatures). Counts are derived from these records at draw time.
// Facts for other lanes: PA.v3.facts.program(code) → { code, name, controls: { total, satisfied, …, inherited, hybrid }, records,
// stage, guide: { done, total } } for a created program (null otherwise); PA.v3.facts.lifeDue(code, stepId) → its due day.
(function () {
  const PA = window.PA; if (!PA || !PA.v3 || !PA.v2 || !PA.v2hubs || !PA.AK) return;
  const V2 = PA.v2, V3 = PA.v3, HUBS = PA.v2hubs, AK = PA.AK, { S, P, M, h } = PA;
  const { esc, fmt, pill } = h;
  const WSX = "PRG-1090", ME = "Ingrid Solberg", TODAY_ISO = "2026-11-17";
  const UI = HUBS.ui;
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "s"}`;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const DASH = '<span class="v2-dash" aria-label="None">—</span>';
  const mu = (t) => `<span class="v3p-mu">${t}</span>`;
  const dt = (iso) => new Date(iso + "T12:00:00");
  const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const addDays = (iso, n) => { const d = dt(iso); d.setDate(d.getDate() + n); return isoOf(d); };
  const dayDiff = (a, b) => Math.round((dt(b) - dt(a)) / 86400000);
  const mdy = (iso) => (iso ? dt(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
  const parse = (html) => { const t = document.createElement("template"); t.innerHTML = html; return t; };
  const short = (d) => (d.name.split(/\s+/)[0] || d.code);

  // ════════════════ Created programs and their records ════════════════
  const madeList = () => HUBS.made() || [];
  const one = (code) => (code && code !== WSX ? HUBS.madeOne(code) : null);
  const curMade = () => (V3.on() ? one(HUBS.cur()) : null);
  const K = (code, k) => `v3.P.${code}.${k}`;
  const get = (code, k, d) => { const v = V2.get(K(code, k)); return v === undefined ? d : v; };
  const put = (code, k, v) => V2.set(K(code, k), v);
  const recs = (code, k) => get(code, k, []) || [];
  const push = (code, k, rec) => { put(code, k, recs(code, k).concat([rec])); return rec; };
  const seqId = (code, k, pre) => `${pre}-${String(recs(code, k).length + 1).padStart(3, "0")}`;
  const sys0 = (d) => (d.systems && d.systems[0]) || { code: d.code, name: d.name, els: [] };
  const liveEls = (s) => (s.els || []).filter((e) => e.state !== "removed");
  const elCode = (s, e) => (e.from === "product" ? (s.prefix || "") + e.code : e.code);
  const TYPE = { subsystem: "Subsystem", hardware: "Hardware", software: "Software", firmware: "Firmware", service: "Service", other: "Other", platform: "Platform", policy: "Policy", process: "Process" };
  const ROLES = [["ao", "Authorizing official"], ["issm", "ISSM"], ["isso", "ISSO"], ["owner", "System owner"], ["lead", "Lead assessor (SCA)"], ["assessors", "Assessors"]];
  const holder = (d, k) => { const r = d.roles || {}; if (k === "assessors") return (r.assessors || []).slice(); const v = k === "owner" && r.owner === "=sys" ? sys0(d).owner : r[k]; return v ? [v] : []; };
  const rolesFilled = (d) => ROLES.filter(([k]) => holder(d, k).length).length;

  // The baseline the wizard resolved: read from the wizard's own baseline preview (its map lists every control with its title).
  const CTLC = {};
  function wizControls(d) {
    const key = d.code + "|" + JSON.stringify([d.base, d.combine, d.overlays, d.tailoring]);
    if (CTLC[key]) return CTLC[key];
    let body = "";
    const c0 = HUBS.cur; HUBS.cur = () => d.code;
    try { const o = P["pn-baseline"] && P["pn-baseline"](); body = o && o.body ? o.body : ""; } catch (e) { body = ""; } finally { HUBS.cur = c0; }
    const out = [], re = /<i class="(base|add)" title="([^"]+)"/g; let m;
    while ((m = re.exec(body))) { const t = unesc(m[2]).replace(/ · (from the baseline|added|removed)$/, ""); const i = t.indexOf(" "); out.push({ c: i > 0 ? t.slice(0, i) : t, t: i > 0 ? t.slice(i + 1) : "" }); }
    const stack = (body.match(/<div class="pn-tbl">[\s\S]*?<\/table><\/div>/) || [""])[0];
    return (CTLC[key] = { list: out, stack });
  }
  const titleOf = (code) => { const c = PA.SSP && PA.SSP.ctl ? PA.SSP.ctl(code) : null; return c ? c.t : ""; };
  function controls(d) {
    const w = wizControls(d), tl = recs(d.code, "tl");
    const rem = new Set(tl.filter((x) => x.act === "remove").map((x) => x.code));
    const list = w.list.filter((x) => !rem.has(x.c));
    const have = new Set(list.map((x) => x.c));
    tl.filter((x) => x.act === "add" && !have.has(x.code)).forEach((x) => { list.push({ c: x.code, t: x.title || titleOf(x.code), added: true }); have.add(x.code); });
    return list;
  }
  // Providers: the host the wizard chose, then those added here.
  const HOST = () => (PA.v2host && PA.v2host.PROV) || {};
  const provIds = (d) => { const P0 = HOST(), out = []; if (d.host && P0[d.host]) out.push(d.host); for (const id of recs(d.code, "prov")) if (P0[id] && !out.includes(id)) out.push(id); return out; };
  function offerMap(d) {
    const m = new Map(); if (!PA.v2host) return m;
    for (const pid of provIds(d)) for (const o of PA.v2host.offersOf(pid)) if (!m.has(o.code)) m.set(o.code, Object.assign({}, o, { pid, kind: HOST()[pid].forceHybrid ? "Hybrid" : o.kind }));
    return m;
  }
  const STW = { satisfied: "Satisfied", partially_satisfied: "Partially satisfied", other_than_satisfied: "Other than satisfied", not_assessed: "Not assessed", no_evidence: "No evidence", no_requirement: "No requirement" };
  const ORDER = ["satisfied", "partially_satisfied", "other_than_satisfied", "not_assessed", "no_evidence", "no_requirement"];
  // Each control's standing: inherited controls read the provider's status (as WS-X90's do); the program's own and hybrid controls
  // climb by its records: a requirement that maps it, evidence against that requirement, then an assessor's determination.
  function standing(d) {
    const code = d.code, reqs = recs(code, "req"), evs = recs(code, "ev"), offers = offerMap(d), det = get(code, "det", {}) || {};
    const byCtl = new Map(); reqs.forEach((r) => (r.ctl || []).forEach((c) => { if (!byCtl.has(c)) byCtl.set(c, []); byCtl.get(c).push(r.id); }));
    const evReq = new Set(evs.map((e) => e.req));
    const out = new Map();
    for (const x of controls(d)) {
      const o = offers.get(x.c) || null, rq = byCtl.get(x.c) || [];
      const own = det[x.c] ? det[x.c] : rq.length ? (rq.some((id) => evReq.has(id)) ? "not_assessed" : "no_evidence") : "no_requirement";
      const kind = o ? o.kind : "System-specific";
      out.set(x.c, { c: x.c, t: x.t, kind, offer: o, own, cs: kind === "Inherited" ? o.st || "satisfied" : own, reqs: rq });
    }
    return out;
  }
  function counts(d) {
    const c = { total: 0, inherited: 0, hybrid: 0 }; ORDER.forEach((k) => (c[k] = 0));
    for (const s of standing(d).values()) { c.total++; c[s.cs] = (c[s.cs] || 0) + 1; if (s.kind === "Inherited") c.inherited++; if (s.kind === "Hybrid") c.hybrid++; }
    return c;
  }

  // ════════════════ The life cycle, dated back from the target authorization date ════════════════
  // The archive's 19-step template (the lifecycle layer's), each step [key, phase, kind, line, tick, title, days before the ATO].
  const PH = [["MSA", "Materiel solution analysis"], ["TMRR", "Technology maturation & risk reduction"], ["EMD", "Engineering & manufacturing development"], ["Test", "Integration, test & production approval"], ["Ops", "Production, deployment & operations"]];
  const KIND = { rev: "Engineering review", ms: "Milestone decision", rmf: "RMF action", op: "Operational" };
  const T = [["asr", 0, "rev", "ASR", "ASR", "ASR · Alternative systems review", 1260, 3], ["ms-a", 0, "ms", "Milestone A", "A", "Milestone A decision", 1215, 1], ["cat", 0, "rmf", "Categorize", "Cat", "Categorize the system", 1180, 2],
    ["srr", 1, "rev", "SRR", "SRR", "SRR · System requirements review", 1090, 3], ["sfr", 1, "rev", "SFR", "SFR", "SFR · System functional review", 1000, 2], ["sel", 1, "rmf", "Select controls", "Sel", "Select security controls", 950, 1],
    ["pdr", 1, "rev", "PDR", "PDR", "PDR · Preliminary design review", 840, 4], ["strat", 1, "rmf", "RMF strategy", "Strat", "AO approval of the RMF strategy", 790, 2], ["ms-b", 2, "ms", "Milestone B", "B", "Milestone B decision", 730, 1],
    ["ssp", 2, "rmf", "SSP", "SSP", "Develop the SSP", 640, 1], ["cdr", 2, "rev", "CDR", "CDR", "CDR · Critical design review", 550, 4], ["trr", 3, "rev", "TRR", "TRR", "TRR · Test readiness review", 390, 2],
    ["iatt", 3, "rmf", "IATT", "IATT", "IATT · Interim authority to test", 360, 1], ["svr", 3, "rev", "SVR", "SVR", "SVR · System verification review", 210, 3], ["prr", 3, "rev", "PRR", "PRR", "PRR · Production readiness review", 150, 2],
    ["sar", 4, "rmf", "SAR", "SAR", "Final assessment and SAR", 50, 2], ["ms-c", 4, "ms", "Milestone C", "C", "Milestone C decision", 20, 1], ["ato", 4, "rmf", "ATO", "ATO", "ATO · Authority to operate", 0, 2], ["ioc", 4, "op", "IOC", "IOC", "IOC · Initial operational capability", -40, 3]];
  const startOf = (d) => (d.startOn && d.startOn > TODAY_ISO ? d.startOn : String(d.at || TODAY_ISO).slice(0, 10));
  const targetOf = (d) => d.targetOn || addDays(startOf(d), 300);
  function schedule(d) {
    const start = startOf(d), target = targetOf(d), span = Math.max(30, dayDiff(start, target)), f = span >= 1260 ? 1 : span / 1260;
    return T.map(([key, ph, kind, line, tick, title, gap, crit]) => ({ id: `${key}-1`, key, ph, kind, line, tick, title, crit, due: addDays(target, -Math.round(gap * f)) }));
  }
  const ITCSC_SIGNED = (d) => { const s = get(d.code, "itcsc", {}) || {}; return s.pm && s.ao ? (s.pm.at > s.ao.at ? s.pm.at : s.ao.at) : null; };
  function stepState(d, st) {
    const key = `${d.code}.${st.id}`.replace(/[^A-Za-z0-9_.:-]/g, "_"), dec = V2.get("life.dec." + key), req = V2.get("life.req." + key);
    if (st.key === "cat" || st.key === "sel") { const at = ITCSC_SIGNED(d); return at ? { s: "completed", w: "Completed", at } : { s: "awaiting", w: "In review", at: String(d.at || TODAY_ISO).slice(0, 10) }; }
    if (dec) return { s: dec.o === "no" ? "failed" : st.kind === "rmf" || st.kind === "op" ? "completed" : "passed", w: dec.o === "no" ? "Failed" : st.kind === "rmf" || st.kind === "op" ? "Completed" : "Passed", at: dec.at };
    if (req) return { s: "in_review", w: "In review" };
    return { s: "not_started", w: "Not started" };
  }
  const isDone = (s) => s === "completed" || s === "passed";
  function stage(d) {
    const sch = schedule(d), nx = sch.find((st) => !isDone(stepState(d, st).s)) || null;
    return { steps: sch, next: nx, phase: nx ? PH[nx.ph][0] : PH[4][0], line: ["Increment 1", nx ? PH[nx.ph][0] : PH[4][0], nx ? `next ${nx.line} ${AK.md(nx.due)}` : "every step done"].join(" · ") };
  }

  // ════════════════ The starter guide: each step read from the record it names ════════════════
  function guide(d) {
    const code = d.code, sch = schedule(d), due = (k, off = 0) => addDays((sch.find((s) => s.key === k) || sch[0]).due, off);
    const reqs = recs(code, "req"), mapped = reqs.filter((r) => (r.ctl || []).length), evs = recs(code, "ev"), sspS = get(code, "ssp", {}) || {}, camps = recs(code, "camp"), pkgs = recs(code, "pkg");
    const sig = get(code, "itcsc", {}) || {}, nsig = (sig.pm ? 1 : 0) + (sig.ao ? 1 : 0), roles = rolesFilled(d), need = ROLES.filter(([k]) => k !== "assessors").filter(([k]) => !holder(d, k).length);
    const hold = (k) => holder(d, k)[0] || null;
    return [
      { id: "itcsc", title: "Sign the ITCSC", sub: nsig === 2 ? `Signed by the PM and the AO · ${mdy(ITCSC_SIGNED(d))}` : `Draft from the wizard · ${nsig} of 2 signatures (PM and AO)`, done: nsig === 2, owner: hold("issm"), due: due("cat"), route: "itcsc", act: "Open ITCSC" },
      { id: "baseline", title: "Choose the control baseline", sub: `${plural(controls(d).length, "control")} · chosen in the wizard`, done: controls(d).length > 0, owner: ME, due: String(d.at || TODAY_ISO).slice(0, 10), route: "baseline", act: "Open baseline" },
      { id: "roles", title: "Assign roles", sub: `${roles} of 6 roles${need.length ? ` · ${need.map((x) => x[1]).join(", ")} to name` : ""}`, done: !need.length, owner: ME, due: String(d.at || TODAY_ISO).slice(0, 10), route: "people", act: "Open People" },
      { id: "reqs", title: "Create the requirements", sub: reqs.length ? `${plural(reqs.length, "requirement")} recorded` : "None recorded yet", done: reqs.length > 0, owner: hold("isso"), due: due("srr", -14), route: "requirements", act: "Open requirements" },
      { id: "map", title: "Map requirements to controls", sub: reqs.length ? `${mapped.length} of ${plural(reqs.length, "requirement")} map a control` : "Waits for a requirement", done: reqs.length > 0 && mapped.length === reqs.length, owner: hold("isso"), due: due("srr"), route: "requirements", act: "Open requirements" },
      { id: "evidence", title: "Upload evidence", sub: evs.length ? `${plural(evs.length, "evidence file")} against ${plural(new Set(evs.map((e) => e.req)).size, "requirement")}` : "None uploaded yet", done: evs.length > 0, owner: hold("issm"), due: due("ssp", -30), route: "evidence", act: "Open evidence" },
      { id: "ssp", title: "Write and publish the SSP", sub: sspS.state === "published" ? `Revision 1 published ${mdy(sspS.at)}` : `Revision 1 draft · ${sspReady(d).have} of ${plural(sspReady(d).need.length, "narrative")} written`, done: sspS.state === "published", owner: ME, due: due("ssp"), route: "ssps", act: "Open the SSP" },
      { id: "assess", title: "Plan an assessment", sub: camps.length ? `${camps[0].title} · planned` : sspS.state === "published" ? "The SSP is published: plan the campaign" : "Waits for the published SSP", done: camps.length > 0, owner: hold("lead"), due: due("sar", -60), route: "assessments", act: "Open assessments" },
      { id: "package", title: "Start the authorization package", sub: pkgs.length ? `${pkgs[0].title} · ${pkgs[0].state}` : `For ${hold("ao") || "the AO"}, by ${mdy(addDays(targetOf(d), -30))}`, done: pkgs.length > 0, owner: hold("issm"), due: addDays(targetOf(d), -30), route: "authorization", act: "Open authorization" },
    ];
  }
  function sspReady(d) {
    const nar = get(d.code, "nar", {}) || {}, st = standing(d), need = [...st.values()].filter((s) => s.kind !== "Inherited" && s.reqs.length).map((s) => s.c);
    return { need, have: need.filter((c) => (nar[c] || "").trim()).length, nar };
  }

  // ════════════════ Markup in v2's look ════════════════
  const btn = (label, attrs = "", ink = false) => `<button type="button" class="btn sm${ink ? " ink" : ""}" ${attrs}>${label}</button>`;
  const crumbs = (d, here) => AK.crumbs([["Programs", "portfolio"], [d.name, "overview"]].concat(here ? [[here]] : []));
  const head = (d, title, actions = "", desc = "") => `<div class="v3p-head">${crumbs(d, title)}${AK.indexHead({ title, desc, actions })}</div>`;
  const page = (...parts) => h.page(`<div class="v3p" data-v3p-prog="${esc(PA.v2hubs.cur())}">${parts.join("")}</div>`);
  function tbl(cols, rows, kind) {
    if (!rows.length) return "";
    return `<div class="frame"><div class="tablebox"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr tabindex="0"${kind ? ` data-panel="${esc(kind)}" data-id="${esc(r.id)}"` : ""}>${r.cells.map((c, i) => `<td${i ? "" : ' class="nm"'}>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="pager"><span class="num">1–${rows.length} of ${fmt(rows.length)}</span></div></div>`;
  }
  const empty = (title, line, action) => `<div class="ak-empty v3p-empty"><div class="ak-empty-i" aria-hidden="true"></div><b>${esc(title)}</b>${line ? `<p>${esc(line)}</p>` : ""}${action || ""}</div>`;
  const newBtn = (kind, label, ink = true, id = "") => btn(esc(label), `data-modal="v3p-new" data-id="${esc(kind + (id ? "|" + id : ""))}"`, ink);
  const card = (title, body, end = "") => `<section class="ak-card v3p-card"><div class="v3p-card-h"><b>${esc(title)}</b>${end ? `<span class="v3p-push">${end}</span>` : ""}</div>${body}</section>`;
  const kv = (rows) => `<dl class="ak-kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
  const stPill = (cs) => pill("none", STW[cs] || cs);
  const link = (label, route, extra = "") => `<span class="ak-link" role="link" tabindex="0" data-go="${esc(route)}"${extra}>${esc(label)}</span>`;

  // ════════════════ Pages ════════════════
  const PAGES = {};
  // Overview: the control status band at 0, the life cycle, the setup guide (one copy; Getting started opens this page).
  PAGES.overview = (d) => {
    const c = counts(d), sg = stage(d), g = guide(d), dn = g.filter((x) => x.done).length, s0 = sys0(d);
    const band = `<section class="ak-card v3p-band" aria-label="Control status"><div class="v3p-card-h"><b>Control status</b><span class="v3p-push">${mu(`<span class="num">${fmt(c.satisfied)} of ${fmt(c.total)}</span> satisfied · <span class="num">${pct(c.satisfied, c.total)}%</span>`)}</span></div>
      <div class="v3p-cs">${ORDER.map((k) => `<span class="v3p-csi" data-cs="${k}"><b class="num">${fmt(c[k])}</b><span>${STW[k]}</span></span>`).join("")}</div>
      <p class="v3p-hint">${c.inherited ? `${plural(c.inherited, "control")} inherited from ${esc(provIds(d).map((id) => HOST()[id].name).join(" and "))} read the provider's status; ` : ""}every other control starts at No requirement and climbs as requirements, evidence and an assessment are recorded. ${link("Open Controls", "controls")}</p></section>`;
    const nx = sg.next, life = `<section class="ak-card v3p-card"><div class="v3p-card-h"><b>Lifecycle · Increment 1 · ${esc(sg.phase)}</b><span class="v3p-push">${link("Open Lifecycle", "lifecycle")}</span></div>${strip(d, true)}
      <p class="v3p-hint">${nx ? `Next: ${esc(nx.title)} · ${AK.due(nx.due)}` : "Every step done"} · ATO due ${esc(mdy(targetOf(d)))}, the target authorization date set in the wizard.</p></section>`;
    const setup = `<section class="ak-card v3p-guide" aria-labelledby="v3p-g-t"><div class="v3p-card-h"><b id="v3p-g-t">Setup</b><span class="v3p-push">${AK.progress(dn, g.length, "done")}</span></div>
      ${g.map((t) => `<div class="v3p-step${t.done ? " done" : ""}" data-v3p-step="${t.id}">${AK.task({ title: t.title, source: t.sub, owner: t.owner, due: t.due, done: t.done })}${btn(esc(t.act), `data-go="${t.route}"`, !t.done && t === g.find((x) => !x.done))}</div>`).join("")}
      <p class="v3p-hint">Each step is done when its record exists: nothing here is ticked by hand.</p></section>`;
    const team = card("Team", `<ul class="pn-team">${ROLES.map(([k, l]) => `<li><span class="k">${esc(l.replace(" (SCA)", ""))}</span>${holder(d, k).length ? holder(d, k).map((x) => AK.owner(x)).join("") : AK.owner(null)}</li>`).join("")}</ul>`, link("Open People", "people"));
    const inh = inheritsCard(d);
    const rh = AK.recordHead({ crumbs: [["Programs", "portfolio"], [d.name]], title: d.name, desc: `<span class="pn-chiprow">${AK.chip(d.code)}${AK.chip(s0.code)}</span>`,
      facts: [["Systems", fmt((d.systems || []).length || 1)], ["Elements", fmt(allEls(d).length)], ["Controls", fmt(c.total)], ["Roles", `${rolesFilled(d)} of 6`], ["Target authorization", esc(mdy(targetOf(d)))]] });
    return page(rh, band, `<div class="v3p-two"><div class="v3p-col">${setup}</div><aside class="v3p-col">${life}${productCard(d)}${inh}${team}</aside></div>`);
  };
  function inheritsCard(d) {
    const ids = provIds(d); if (!ids.length) return card("What the program inherits", `<p class="v3p-hint">No host system or provider: every control of the baseline is the program's own. ${link("Open Host & providers", "hosts")}</p>`);
    const st = [...standing(d).values()], inh = st.filter((s) => s.kind === "Inherited"), hyb = st.filter((s) => s.kind === "Hybrid"), sat = inh.filter((s) => s.cs === "satisfied").length;
    return card("What the program inherits", `${kv([["Provider", esc(ids.map((id) => HOST()[id].name).join(", "))], ["Inherited", `<span class="num">${fmt(inh.length)}</span> · ${fmt(sat)} satisfied by the provider`], ["Hybrid", `<span class="num">${fmt(hyb.length)}</span> · the program writes its own part`]])}
      <p class="v3p-hint">Inherited means the provider implements and assesses the control, so it counts by the provider's status, as WS-X90's do.</p>`, link("Open Host & providers", "hosts"));
  }
  const allEls = (d) => (d.systems || []).flatMap((s) => liveEls(s).map((e) => ({ code: elCode(s, e), name: e.name, type: e.type, sys: s.code, from: e.from, pin: e.pin }))).concat(recs(d.code, "el").map((e) => ({ code: e.code, name: e.name, type: e.type, sys: e.sys || sys0(d).code, from: "added", at: e.at })));

  // Lifecycle: the template's steps dated back from the target authorization date.
  function strip(d, compact) {
    const sch = schedule(d), states = sch.map((st) => stepState(d, st)), nxI = states.findIndex((s) => !isDone(s.s));
    const phs = PH.map(([sh, long], p) => { const idx = sch.map((s, i) => [s, i]).filter(([s]) => s.ph === p); const state = idx.every(([, i]) => isDone(states[i].s)) ? "done" : nxI >= 0 && sch[nxI].ph === p ? "on" : "todo"; return `<span class="v2g-sph ${state}" style="flex:${idx.length}" title="${esc(long)}"><b>${esc(sh)}</b>${compact ? "" : `<span>${esc(long)}</span>`}</span>`; }).join("");
    const marks = sch.map((s, i) => { const w = states[i], cls = `${s.kind === "ms" ? "ms" : ""} ${isDone(w.s) ? "done" : i === nxI ? "on" : "todo"}`, label = `${s.title}, ${w.w}, ${isDone(w.s) ? "decided" : "due"} ${AK.md(isDone(w.s) && w.at ? w.at : s.due)}`;
      return compact ? `<span class="v2g-mk ${cls}" title="${esc(label)}"><i></i></span>` : `<button type="button" class="v2g-mk ${cls}" data-panel="a-work-gate" data-id="${esc(s.id)}" aria-label="${esc(label)}" title="${esc(label)}"><i aria-hidden="true"></i><span class="v2g-mkl" aria-hidden="true">${esc(s.tick)}</span></button>`; }).join("");
    const N = sch.length; let x = 0; const a = sch.map((s, i) => [i, s.due]).filter((p) => p[1] <= TODAY_ISO).pop(), b = sch.map((s, i) => [i, s.due]).find((p) => p[1] > TODAY_ISO);
    x = !a ? 0 : !b ? N : a[0] + 0.5 + (dayDiff(a[1], TODAY_ISO) / Math.max(1, dayDiff(a[1], b[1]))) * (b[0] - a[0]);
    const xp = Math.max(0, Math.min(100, (x / N) * 100)), p = nxI >= 0 ? ((nxI + 0.5) / N) * 100 : 100;
    const today = `<span class="v2g-today${xp > 80 ? " end" : ""}" style="left:${xp.toFixed(1)}%" aria-hidden="true"><span>Today</span></span>`;
    return `<div class="v2g-strip${compact ? " v2g-compact" : ""}" role="group" aria-label="Increment 1: phases and steps"><span class="v2g-sphs">${phs}</span><span class="v2g-mks"><span class="v2g-prog" style="width:${p.toFixed(1)}%" aria-hidden="true"></span>${marks}${compact ? "" : today}</span></div>`;
  }
  const DELIV = { cat: ["ITCSC", "itcsc"], sel: ["Baseline", "baseline"], srr: ["Requirements", "requirements"], ssp: ["SSP revision 1", "ssps"], sar: ["Assessment campaign", "assessments"], ato: ["Authorization package", "authorization"], iatt: ["Authorization package", "authorization"], ioc: ["Continuous monitoring", "conmon"] };
  function deliv(d, st) {
    const x = DELIV[st.key]; if (!x) return DASH;
    const sspS = get(d.code, "ssp", {}) || {};
    const ok = st.key === "cat" || st.key === "sel" ? !!ITCSC_SIGNED(d) : st.key === "srr" ? recs(d.code, "req").length > 0 : st.key === "ssp" ? sspS.state === "published" : st.key === "sar" ? recs(d.code, "camp").length > 0 : st.key === "ato" || st.key === "iatt" ? recs(d.code, "pkg").length > 0 : false;
    const w = st.key === "cat" || st.key === "sel" ? (ok ? "Signed" : "Draft · awaiting signatures") : ok ? "Recorded" : "Not started";
    return `<a class="v2g-dl" href="#${x[1]}" title="${esc(w)}"><i class="v2g-dot${ok ? " ok" : ""}" aria-hidden="true"></i><span class="v2-sr">${ok ? "Ready" : "Not ready"}: </span>${esc(x[0])}</a>`;
  }
  PAGES.lifecycle = (d) => {
    const sch = schedule(d), sg = stage(d), nx = sg.next;
    const row = (st) => { const w = stepState(d, st), done = isDone(w.s), when = done && w.at ? `<span class="ak-due">${AK.i("calendar")}Decided ${AK.md(w.at)}</span>` : AK.due(st.due);
      const crit = st.key === "cat" || st.key === "sel" ? (done ? 1 : 0) : 0;
      const sig = done ? `Signed ${AK.md(w.at)}` : "Awaiting signature";
      const what = st.key === "cat" ? ` <span class="v3p-sub">${esc(sig)} · ${esc(sys0(d).cia ? sys0(d).cia.map((l, i) => "CIA"[i] + " " + l).join(" · ") : "")}, categorized ${esc(AK.md(String(d.at || TODAY_ISO).slice(0, 10)))} in the wizard</span>` : st.key === "sel" ? ` <span class="v3p-sub">${esc(sig)} · ${esc(plural(controls(d).length, "control"))}, chosen ${esc(AK.md(String(d.at || TODAY_ISO).slice(0, 10)))} in the wizard</span>` : "";
      return `<div class="v2g-row${st === nx ? " on" : ""}" role="listitem" data-panel="a-work-gate" data-id="${esc(st.id)}" data-v3p-step="${esc(st.key)}"><span class="v2g-c1"><button type="button" class="v2g-nm" data-panel="a-work-gate" data-id="${esc(st.id)}">${esc(st.title)}</button>${what}</span><span class="v2g-c2">${esc(KIND[st.kind])}</span><span class="v2g-c3">${when}</span><span class="v2g-c4">${pill(done ? "ok" : "none", w.w)}</span><span class="v2g-c5">${deliv(d, st)}</span><span class="v2g-c6"><span class="num">${crit} of ${st.crit}</span><span class="v2g-c6l"> criteria met</span></span></div>`; };
    const phases = PH.map(([sh, long], p) => { const list = sch.filter((s) => s.ph === p), dn = list.filter((s) => isDone(stepState(d, s).s)).length, on = nx && nx.ph === p;
      return `<details class="v2g-phase${on ? " on" : ""}"${on || p === 0 ? " open" : ""}><summary><span class="v2g-pht"><b>${esc(sh)}</b><span>${esc(long)}</span></span><span class="v2g-phc num">${dn} of ${list.length} done</span></summary><div class="v2g-rows" role="list" aria-label="${esc(long)}"><div class="v2g-rh" aria-hidden="true"><span>Step</span><span>Kind</span><span>Due or decided</span><span>Status</span><span>Deliverables</span><span>Criteria</span></div>${list.map(row).join("")}</div></details>`; }).join("");
    const desc = `${esc(d.name)} · Increment 1${nx ? ` · next ${esc(nx.line)}, ${esc(AK.md(nx.due))}` : " · every step done"} · ATO due ${esc(mdy(targetOf(d)))}`;
    return page(crumbs(d, "Lifecycle"), `<div class="v2g-life">${AK.indexHead({ title: "Lifecycle", desc })}${strip(d, false)}<div class="v2g-phases">${phases}</div>
      <p class="note-p v2g-note">Dated back from the target authorization date set in the wizard, ${esc(mdy(targetOf(d)))}: the ATO is due then and every earlier step keeps the template's order and spacing, ${dayDiff(startOf(d), targetOf(d)) >= 1260 ? "as the template sets it" : `scaled to fit between the start, ${esc(mdy(startOf(d)))}, and the target`}. Categorize and Select read the wizard's categorization and baseline and complete when the PM and the AO sign the ITCSC.</p></div>`);
  };

  // Composition: the system and the elements the wizard wrote, and Create element.
  PAGES.composition = (d) => {
    const els = allEls(d), s0 = sys0(d);
    const rows = els.map((e) => ({ id: `el|${e.code}`, cells: [`<b>${esc(e.code)}</b> ${esc(e.name)}`, esc(TYPE[e.type] || e.type || "Element"), esc(e.sys), e.from === "library" ? `Library · ${esc(e.pin || "")}` : e.from === "product" ? "Product" : e.from === "added" && e.at ? `Created ${esc(AK.md(e.at))}` : "Program's own"] }));
    return page(head(d, "Composition", newBtn("el", "Create element"), `${esc(s0.code)} ${esc(s0.name)} · the authorization boundary system · ${plural(els.length, "element")}`),
      els.length ? tbl(["Element", "Type", "System", "Source"], rows, "v3p-rec") : empty("No elements yet", `${s0.code} has no elements: create the first one.`, newBtn("el", "Create element")));
  };
  // Boundary: what the boundary holds (the system and its elements) and what carries it.
  PAGES.boundary = (d) => {
    const els = allEls(d), s0 = sys0(d), ids = provIds(d);
    return page(head(d, "Boundary", "", `What ${esc(d.name)}'s authorization will cover`),
      card(`Inside the boundary · ${s0.code}`, tbl(["Element", "Type"], els.map((e) => ({ id: `el|${e.code}`, cells: [`<b>${esc(e.code)}</b> ${esc(e.name)}`, esc(TYPE[e.type] || e.type || "Element")] })), "v3p-rec") || `<p class="v3p-hint">No elements yet. ${link("Open Composition", "composition")}</p>`),
      card("Outside: what carries it", ids.length ? kv(ids.map((id) => [HOST()[id].kind, `${esc(HOST()[id].name)} · its own authorization: ${esc(HOST()[id].auth.word)}`])) : `<p class="v3p-hint">No host system or provider. ${link("Open Host & providers", "hosts")}</p>`),
      card("Interconnections", recs(d.code, "ic").length ? tbl(["Interconnection", "Type", "Agreement"], recs(d.code, "ic").map((x) => ({ id: `ic|${x.id}`, cells: [`<b>${esc(x.id)}</b> ${esc(x.to)}`, esc(x.type), esc(x.agree)] })), "v3p-rec") : `<p class="v3p-hint">None recorded. ${link("Open Interconnections", "interconnections")}</p>`));
  };
  PAGES.people = (d) => page(head(d, "People & roles", "", `The roles the wizard recorded for ${esc(d.name)}`),
    tbl(["Role", "Held by"], ROLES.map(([k, l]) => ({ id: k, cells: [esc(l), holder(d, k).length ? holder(d, k).map((x) => AK.owner(x)).join(" ") : DASH] })), ""));
  // Simple registers: a table and the page's first action.
  const REG = {
    interconnections: ["ic", "Interconnections", "Add interconnection", ["Interconnection", "Type", "Data", "Agreement"], (x) => [`<b>${esc(x.id)}</b> ${esc(x.to)}`, esc(x.type), esc(x.data || ""), pill("none", x.agree)], "No interconnection recorded", "Record each external system it connects to, with the agreement that covers it."],
    ppsm: ["port", "Ports & protocols", "Add port", ["Port", "Protocol", "Service", "Direction"], (x) => [`<b>${esc(x.port)}</b>`, esc(x.proto), esc(x.svc), esc(x.dir)], "No port or protocol recorded", "List each port, protocol and service the system uses, for the PPSM registration."],
    policies: ["pol", "Policies", "Upload policy", ["Policy", "Family", "File", "Uploaded"], (x) => [`<b>${esc(x.id)}</b> ${esc(x.title)}`, esc(x.fam), esc(x.file || "Not attached"), esc(AK.md(x.at))], "No policy uploaded", "Upload the program's policies and procedures, each against the control family it answers."],
    stigs: ["stig", "STIG checklists", "Import checklist", ["Checklist", "Element", "File", "Imported"], (x) => [`<b>${esc(x.title)}</b>`, esc(x.el), esc(x.file || "Not attached"), esc(AK.md(x.at))], "No STIG checklist imported", "Import a checklist for each element whose software a STIG covers."],
    findings: ["iss", "Findings", "Create operational issue", ["Operational issue", "Severity", "Control", "Opened"], (x) => [`<b>${esc(x.id)}</b> ${esc(x.title)}`, pill(x.sev === "Critical" || x.sev === "High" ? "bad" : x.sev === "Moderate" ? "warn" : "none", x.sev), esc(x.ctl || "—"), esc(AK.md(x.at))], "No operational issues", "Issues open from scans, assessments and offers; record one by hand when it is found."],
    poam: ["poam", "POA&M", "Create POA&M item", ["POA&M item", "Answers", "Planned completion", "Status"], (x) => [`<b>${esc(x.id)}</b> ${esc(x.title)}`, esc(x.answers || "—"), esc(AK.md(x.due)), pill("none", "Open")], "No POA&M items", "Remediation items follow from operational issues and risks."],
    risks: ["risk", "Risks", "Create risk", ["Risk", "Level", "Owner", "Recorded"], (x) => [`<b>${esc(x.id)}</b> ${esc(x.title)}`, pill(x.sev === "High" || x.sev === "Very high" ? "bad" : x.sev === "Moderate" ? "warn" : "none", x.sev), x.owner ? AK.owner(x.owner) : DASH, esc(AK.md(x.at))], "No risks recorded", "Risks are raised from findings and issues, or written by hand."],
  };
  for (const [route, [kind, title, act, cols, cells, et, el]] of Object.entries(REG)) {
    PAGES[route] = (d) => { const L = recs(d.code, kind); return page(head(d, title, newBtn(kind, act)), L.length ? tbl(cols, L.map((x) => ({ id: `${kind}|${x.id}`, cells: cells(x) })), "v3p-rec") : empty(et, el, newBtn(kind, act))); };
  }
  // Baseline: the stack the wizard resolved, the program's own tailoring decisions since, and Tailor a control.
  PAGES.baseline = (d) => {
    const w = wizControls(d), tl = recs(d.code, "tl"), n = controls(d).length;
    return page(head(d, "Baseline", newBtn("tl", "Tailor a control"), `${plural(n, "control")} · as the wizard resolved the stack${tl.length ? `, then ${plural(tl.length, "tailoring decision")} since` : ""}`),
      card("Stack", w.stack ? w.stack : `<p class="v3p-hint">The wizard's stack could not be read.</p>`),
      card("Tailoring since creation", tl.length ? tbl(["Control", "Decision", "Rationale", "By"], tl.map((x) => ({ id: `tl|${x.code}`, cells: [`<b>${esc(x.code)}</b> ${esc(x.title || titleOf(x.code))}`, pill("none", x.act === "add" ? "Adds" : "Removes"), esc(x.why), AK.owner(x.by)] })), "v3p-rec") : `<p class="v3p-hint">No decision since the wizard: the baseline stands as the stack forms it.</p>`, `<span class="num">${tl.length}</span>`));
  };
  // Controls: every control of the baseline with its standing.
  PAGES.controls = (d) => {
    const st = [...standing(d).values()], c = counts(d), q = (V2.get(K(d.code, "ctlq")) || "all");
    const show = q === "all" ? st : st.filter((s) => s.cs === q);
    const views = `<div class="views">${[["all", "All", st.length]].concat(ORDER.filter((k) => c[k]).map((k) => [k, STW[k], c[k]])).map(([k, l, n]) => `<span class="qv${q === k ? " on" : ""}" role="button" tabindex="0" data-v3p-ctlq="${k}">${esc(l)} <span class="num">${fmt(n)}</span></span>`).join("")}</div>`;
    const rows = show.slice(0, 200).map((s) => ({ id: s.c, cells: [`<b>${esc(s.c)}</b> ${esc(s.t)}`, stPill(s.cs), esc(s.kind === "System-specific" ? "System-specific" : `${s.kind} · ${HOST()[s.offer.pid].name}`), s.reqs.length ? esc(s.reqs.join(", ")) : DASH] }));
    return page(head(d, "Controls", "", `${plural(c.total, "control")} in ${esc(d.name)}'s baseline · ${fmt(c.satisfied)} satisfied`), views,
      tbl(["Control", "Control status", "Responsibility", "Requirements"], rows, "v3p-ctl") + (show.length > 200 ? `<p class="v3p-hint">The first 200 of ${fmt(show.length)} are shown; a quick view narrows them.</p>` : ""));
  };
  // Requirements: Create requirement, then Map control from its preview.
  PAGES.requirements = (d) => {
    const L = recs(d.code, "req"), evs = recs(d.code, "ev");
    return page(head(d, "Requirements", newBtn("req", "Create requirement")),
      L.length ? tbl(["Requirement", "Controls", "Evidence", "Owner"], L.map((r) => ({ id: `req|${r.id}`, cells: [`<b>${esc(r.id)}</b> ${esc(r.title)}`, (r.ctl || []).length ? AK.codes(r.ctl) : `<span class="ak-link" role="button" tabindex="0" data-modal="v3p-new" data-id="map|${esc(r.id)}">Map control</span>`, fmt(evs.filter((e) => e.req === r.id).length), r.owner ? AK.owner(r.owner) : DASH] })), "v3p-rec")
        : empty("No requirements yet", "Create each requirement the system must meet, then map it to the controls it answers.", newBtn("req", "Create requirement")));
  };
  PAGES.evidence = (d) => {
    const L = recs(d.code, "ev"), reqs = recs(d.code, "req");
    const act = reqs.length ? newBtn("ev", "Upload evidence") : "";
    return page(head(d, "Evidence", act),
      L.length ? tbl(["Evidence", "Requirement", "Kind", "Uploaded"], L.map((e) => ({ id: `ev|${e.id}`, cells: [`<b>${esc(e.id)}</b> ${esc(e.title)}`, esc(e.req), esc(e.kind), esc(AK.md(e.at))] })), "v3p-rec")
        : empty("No evidence yet", reqs.length ? "Upload evidence against a requirement: it moves the controls that requirement maps to Not assessed." : "Evidence is uploaded against a requirement: create a requirement first.", reqs.length ? act : btn("Open requirements", 'data-go="requirements"', true)));
  };
  // The SSP: revision 1, a narrative to write per control a requirement maps, and Publish once those are written.
  PAGES.ssps = (d) => {
    const s = get(d.code, "ssp", {}) || {}, r = sspReady(d), pub = s.state === "published", ready = r.need.length > 0 && r.have === r.need.length;
    const why = pub ? `Published ${mdy(s.at)} by ${s.by}` : !r.need.length ? "Publish needs a narrative for each control a requirement maps: no requirement maps a control yet." : ready ? "Every mapped control has its narrative: revision 1 can be published." : `Publish needs a narrative for each control a requirement maps: ${r.have} of ${r.need.length} written.`;
    const act = pub ? "" : ready ? btn("Publish revision 1", 'data-modal="v3p-new" data-id="publish"', true) : btn("Publish revision 1", `aria-disabled="true" data-v3p-why="${esc(why)}"`, true);
    const st = standing(d), rows = r.need.map((c) => ({ id: `nar|${c}`, cells: [`<b>${esc(c)}</b> ${esc(st.get(c).t)}`, (r.nar[c] || "").trim() ? esc((r.nar[c] || "").slice(0, 90)) + ((r.nar[c] || "").length > 90 ? "…" : "") : mu("Not written"), pub ? pill("ok", "Published") : (r.nar[c] || "").trim() ? pill("none", "Written") : `<span class="ak-link" role="button" tabindex="0" data-modal="v3p-new" data-id="nar|${esc(c)}">Write narrative</span>`] }));
    const c = counts(d);
    return page(head(d, "Plans", act, `SSP revision 1 · ${pub ? "Published" : "Draft"}`),
      card("System security plan · revision 1", `${kv([["State", pill(pub ? "ok" : "none", pub ? "Published" : "Draft")], ["Controls", `<span class="num">${fmt(c.total)}</span> · ${fmt(c.inherited)} inherited`], ["Narratives", `<span class="num">${r.have} of ${r.need.length}</span> mapped controls written`]])}<p class="v3p-hint" data-v3p-ssp-why>${esc(why)}</p>`),
      rows.length ? tbl(["Control", "Narrative", "State"], rows, "v3p-rec") : empty("Nothing to describe yet", "A control gets its narrative once a requirement maps it.", btn("Open requirements", 'data-go="requirements"', true)));
  };
  PAGES.assessments = (d) => {
    const L = recs(d.code, "camp"), s = get(d.code, "ssp", {}) || {}, pub = s.state === "published";
    const act = pub ? newBtn("camp", "Plan assessment") : btn("Plan assessment", 'aria-disabled="true" data-v3p-why="Plan assessment waits for the published SSP: publish revision 1 on Plans first."', true);
    return page(head(d, "Assessments", act),
      L.length ? tbl(["Campaign", "Scope", "Window", "Lead"], L.map((x) => ({ id: `camp|${x.id}`, cells: [`<b>${esc(x.id)}</b> ${esc(x.title)}`, `${plural(x.scope.length, "control")}`, `${esc(AK.md(x.start))} – ${esc(AK.md(x.end))}`, x.lead ? AK.owner(x.lead) : DASH] })), "v3p-rec")
        : empty("No assessment campaign", pub ? "The SSP is published: plan the campaign over the controls that have evidence." : "An assessment is planned once the SSP is published; Plans says what publishing needs.", pub ? act : btn("Open Plans", 'data-go="ssps"', true)));
  };
  PAGES.authorization = (d) => {
    const L = recs(d.code, "pkg");
    return page(head(d, "Authorization", L.length ? "" : newBtn("pkg", "Start package")),
      L.length ? tbl(["Package", "Decision sought", "For", "State"], L.map((x) => ({ id: `pkg|${x.id}`, cells: [`<b>${esc(x.id)}</b> ${esc(x.title)}`, esc(x.type), x.ao ? AK.owner(x.ao) : DASH, pill("none", x.state)] })), "v3p-rec")
        : empty("No authorization package", `The package gathers the SSP, the assessment results and the POA&M for ${holder(d, "ao")[0] || "the AO"}.`, newBtn("pkg", "Start package")));
  };
  PAGES.itcsc = (d) => {
    const s0 = sys0(d), sig = get(d.code, "itcsc", {}) || {}, nss = d.overlays && d.overlays.indexOf("OVL-CNSSI-1253-ALLOCATION") >= 0;
    const signRow = (k, role, who) => { const v = sig[k]; return `<div class="v3p-sign">${AK.owner(who)}<span class="x"><b>${esc(role)}</b>${v ? `<span class="v3p-sub">Signed ${esc(mdy(v.at))}</span>` : `<span class="v3p-sub">Not signed</span>`}</span>${v ? pill("ok", "Signed") : btn(`Sign as ${esc(role.toLowerCase())}`, `data-v3p-sign="${k}"`, false)}</div>`; };
    const pm = d.sponsor || holder(d, "owner")[0] || ME, ao = holder(d, "ao")[0] || "the AO", both = sig.pm && sig.ao;
    return page(head(d, "ITCSC", "", `AF ITCSC v2.0 · version 1 · ${both ? `signed ${mdy(ITCSC_SIGNED(d))}` : "draft from the wizard"}`),
      `<div class="v3p-two"><div class="v3p-col">${card("§6 Mission", `<p class="v3p-p">${esc(d.mission || "")}</p>`)}${card("§7 National security system", kv([["NSS", nss ? "Yes · CNSSI 1253 applies" : "Not answered as an NSS: CNSSI 1253 is not applied"]]))}
        ${card("§10 Categorization", kv([["System", `${esc(s0.code)} ${esc(s0.name)}`], ["Levels", esc((s0.cia || []).map((l, i) => ["Confidentiality", "Integrity", "Availability"][i] + " " + l).join(" · "))], ["Rationale", esc(s0.rationale || "")]]))}
        ${card("§11 Roles", kv(ROLES.map(([k, l]) => [l, holder(d, k).length ? holder(d, k).map((x) => AK.owner(x)).join(" ") : DASH])))}</div>
        <aside class="v3p-col">${card("Approval", `${signRow("pm", "Program manager", pm)}${signRow("ao", "Authorizing official", ao)}<p class="v3p-hint">${both ? "Both signatures are recorded: Categorize and Select read Completed on Lifecycle." : "Done once both have signed: Categorize and Select on Lifecycle wait for it."}</p>`)}</aside></div>`);
  };
  PAGES.hosts = (d) => {
    const ids = provIds(d), st = [...standing(d).values()].filter((s) => s.offer);
    const provs = ids.length ? ids.map((id) => { const p = HOST()[id], mine = st.filter((s) => s.offer.pid === id); return card(p.name, kv([["Kind", esc(p.kind)], ["Its authorization", esc(p.auth.word)], ["Of this baseline", `<span class="num">${fmt(mine.length)}</span> offered · ${fmt(mine.filter((s) => s.kind === "Inherited").length)} inherited · ${fmt(mine.filter((s) => s.kind === "Hybrid").length)} hybrid`]]), `<span class="ak-link" role="button" tabindex="0" data-panel="v2h-prov" data-id="${esc(id)}">Preview</span>`); }).join("") : "";
    const rows = st.map((s) => ({ id: s.c, cells: [`<b>${esc(s.c)}</b> ${esc(s.t)}`, esc(s.kind), `${esc(HOST()[s.offer.pid].name)} · ${stPill(s.offer.st || "satisfied")}`, s.kind === "Hybrid" ? `${stPill(s.own)} ${mu("· its part: not written")}` : mu("The provider's")] }));
    return page(head(d, "Host & providers", btn("Add provider", 'data-modal="v3p-new" data-id="prov"', true), ids.length ? `${esc(d.name)} inherits from ${esc(ids.map((id) => HOST()[id].name).join(" and "))}` : `${esc(d.name)} has no host system or provider yet`),
      provs || empty("No host system or provider", "Add a provider when one offers controls: the controls it implements are inherited by default.", btn("Add provider", 'data-modal="v3p-new" data-id="prov"', true)),
      rows.length ? card("Controls they hold", tbl(["Control", "Responsibility", "Provider's part", `${short(d)}'s standing`], rows, "v3p-ctl"), `<span class="num">${rows.length}</span>`) : "");
  };
  PAGES.activity = (d) => {
    const ev = [{ who: ME, what: `created ${esc(d.name)} in the wizard`, at: String(d.at || TODAY_ISO).slice(0, 10) }];
    const add = (k, f) => recs(d.code, k).forEach((x) => ev.push({ who: x.by || ME, what: f(x), at: x.at || TODAY_ISO }));
    add("req", (x) => `created <b>${esc(x.id)}</b> ${esc(x.title)}`); add("ev", (x) => `uploaded evidence <b>${esc(x.id)}</b> against ${esc(x.req)}`); add("el", (x) => `created element <b>${esc(x.code)}</b>`);
    add("camp", (x) => `planned <b>${esc(x.title)}</b>`); add("pkg", (x) => `started <b>${esc(x.title)}</b>`); add("iss", (x) => `opened <b>${esc(x.id)}</b>`); add("risk", (x) => `recorded risk <b>${esc(x.id)}</b>`); add("poam", (x) => `created <b>${esc(x.id)}</b>`);
    const s = get(d.code, "ssp", {}) || {}; if (s.state === "published") ev.push({ who: s.by || ME, what: "published SSP revision 1", at: s.at });
    const sig = get(d.code, "itcsc", {}) || {}; for (const [k, l] of [["pm", "program manager"], ["ao", "authorizing official"]]) if (sig[k]) ev.push({ who: sig[k].by, what: `signed the ITCSC as ${l}`, at: sig[k].at });
    return page(head(d, "Activity", "", `${esc(d.name)}'s event log`), AK.activity(ev.reverse().map((x) => ({ who: x.who, what: x.what, when: AK.md(x.at) }))));
  };
  PAGES.sctm = (d) => {
    const reqs = recs(d.code, "req"), maps = reqs.reduce((a, r) => a + (r.ctl || []).length, 0);
    return page(head(d, "SCTM workbook", "", `${esc(d.name)} · SSP revision 1 ${(get(d.code, "ssp", {}) || {}).state === "published" ? "published" : "draft"}`),
      empty(`${short(d)}'s SCTM workbook has nothing to trace yet`, `The workbook traces requirements to controls and evidence: ${d.name} has ${plural(reqs.length, "requirement")} and ${plural(maps, "mapping")} so far. It opens on them once there are some.`, `${btn("Open requirements", 'data-go="requirements"', true)} ${btn("Open Controls", 'data-go="controls"')}`));
  };
  const LATER = { threats: ["No threats recorded", "Threats join once the program's risks name the ATT&CK techniques they concern."], resiliency: ["No cyber resiliency choice yet", "The program chooses its SA-24 techniques with the baseline's tailoring."], "cyber-te": ["No cyber test planned", "Cyber T&E is planned with the test strategy, after the SSP."], conmon: ["Continuous monitoring starts after authorization", "The ConMon plan joins the package; checks start once the system operates."], posture: ["No posture yet", "Posture counts the program's mapped and evidenced objectives once requirements map controls."] };
  for (const [k, [t, l]] of Object.entries(LATER)) PAGES[k] = (d) => page(head(d, (PA.v3.menu.flatMap((g) => g[1]).find((x) => x[0] === k) || [k, k])[1]), empty(t, l));
  const ALIAS = { "getting-started": "overview", "program-start": "overview", inventory: "composition", traceability: "requirements", sources: "evidence", "package-room": "authorization", checks: "conmon", schedule: "conmon", ssp: "ssps", campaign: "assessments", "control-si2": "controls", sse: "lifecycle", inheritance: "hosts" };
  const ROUTES = /^(overview|getting-started|program-start|lifecycle|people|person-|boundary|interconnections|ppsm|composition|inventory|hosts|itcsc|baseline|threats|resiliency|requirements|traceability|controls|control-si2|ssps|ssp|plan-|policies|stigs|assessments|campaign|evidence|sources|cyber-te|findings|poam|risks|authorization|package-room|conmon|checks|schedule|posture|activity|sctm|sse|inheritance)($|-)/;
  function pageKey(r) {
    if (/^lifecycle-/.test(r)) return null; // a step's own page (the lifecycle layer's)
    const m = ROUTES.exec(r); if (!m) return null;
    let k = m[1]; if (k === "person-") k = "people"; if (k === "plan-") k = "ssps";
    return ALIAS[k] || k;
  }
  V3.S(ROUTES, (orig, r) => { const d = curMade(); const k = d && pageKey(r); if (!d || !k || !PAGES[k]) return orig(); try { return PAGES[k](d, r); } catch (e) { console.error(e); return orig(); } });
  V3.redirect("program-start", "overview");
  document.addEventListener("click", (e) => {
    if (!V3.on()) return;
    const q = e.target.closest && e.target.closest("[data-v3p-ctlq]"); if (q) { const d = curMade(); if (d) { V2.set(K(d.code, "ctlq"), q.dataset.v3pCtlq); V2.redraw(); } return; }
    const w = e.target.closest && e.target.closest("[data-v3p-why]"); if (w) { e.preventDefault(); V2.toast(w.dataset.v3pWhy); return; }
    const sg = e.target.closest && e.target.closest("[data-v3p-sign]"); if (sg) { const d = curMade(); if (!d) return; const s = Object.assign({}, get(d.code, "itcsc", {}) || {}), k = sg.dataset.v3pSign; s[k] = { by: k === "pm" ? d.sponsor || holder(d, "owner")[0] || ME : holder(d, "ao")[0] || "the AO", at: TODAY_ISO }; put(d.code, "itcsc", s); V2.redraw(); V2.toast(s.pm && s.ao ? "ITCSC signed by the PM and the AO: Categorize and Select are complete" : `Signed as ${k === "pm" ? "program manager" : "authorizing official"} · 1 of 2 signatures`, { label: "Open Lifecycle", route: "lifecycle" }); }
  });

  // ════════════════ Dialogs: each writes a record its page lists ════════════════
  const area = (id, label, opt = {}) => `<div class="ak-field v2c-f"><label for="${id}">${esc(label)}${opt.req ? ' <span class="req">Required</span>' : ""}</label><textarea id="${id}" class="v2c-in" rows="${opt.rows || 3}"${opt.ph ? ` placeholder="${esc(opt.ph)}"` : ""}>${esc(opt.value || "")}</textarea><p class="v2c-err" id="${id}-err" role="alert" hidden></p>${opt.hint ? `<span class="s">${esc(opt.hint)}</span>` : ""}</div>`;
  const people = () => { const S0 = PA.SSP || {}, set = new Set([ME]); (S0.people || []).forEach((p) => set.add(p.name)); return [...set].map((n) => [n, n]); };
  const reqOpts = (d) => recs(d.code, "req").map((r) => [r.id, `${r.id} ${r.title}`]);
  const FORMS = {
    el: { title: "Create element", label: "Create element", fields: (d) => [["name", "Name", { req: true, ph: "As it reads on the unit's label" }], ["code", "Code", { req: true, value: (sys0(d).prefix && !/^CD-$/.test(sys0(d).prefix) ? sys0(d).prefix : sys0(d).code + "-"), hint: "Unique in the system." }], ["type", "Type", { select: Object.entries(TYPE).slice(0, 6) }]],
      save: (d, v) => { const code = v.code.toUpperCase(); if (allEls(d).some((e) => e.code === code)) return ["code", `${code} is already an element of ${sys0(d).code}.`]; push(d.code, "el", { code, name: v.name, type: v.type, sys: sys0(d).code, at: TODAY_ISO, by: ME }); return [`${code} ${v.name} created in ${sys0(d).code}`, "composition", `el|${code}`]; } },
    ic: { title: "Add interconnection", label: "Add interconnection", fields: () => [["to", "Connects to", { req: true, ph: "The external system" }], ["type", "Type", { select: [["Data link", "Data link"], ["Network", "Network"], ["Removable media", "Removable media"], ["RF", "RF"], ["Maintenance port", "Maintenance port"]] }], ["data", "Data", { ph: "What crosses it, each way" }], ["agree", "Agreement", { select: [["ISA to draft", "ISA to draft"], ["MOU to draft", "MOU to draft"], ["Signed ISA", "Signed ISA"]] }]],
      save: (d, v) => { const x = push(d.code, "ic", Object.assign({ id: seqId(d.code, "ic", "IC"), at: TODAY_ISO, by: ME }, v)); return [`${x.id} to ${v.to} recorded`, "interconnections", `ic|${x.id}`]; } },
    port: { title: "Add port", label: "Add port", fields: () => [["port", "Port", { req: true, ph: "443" }], ["proto", "Protocol", { select: [["TCP", "TCP"], ["UDP", "UDP"], ["MIL-STD-1553B", "MIL-STD-1553B"], ["MIL-STD-1760", "MIL-STD-1760"]] }], ["svc", "Service", { req: true, ph: "What listens on it" }], ["dir", "Direction", { select: [["Inbound", "Inbound"], ["Outbound", "Outbound"], ["Both", "Both"]] }]],
      save: (d, v) => { const x = push(d.code, "port", Object.assign({ id: seqId(d.code, "port", "PPS"), at: TODAY_ISO, by: ME }, v)); return [`Port ${v.port} ${v.proto} recorded for PPSM`, "ppsm", `port|${x.id}`]; } },
    pol: { title: "Upload policy", label: "Upload policy", fields: () => [["title", "Title", { req: true }], ["fam", "Control family", { select: [["AC", "AC · Access control"], ["AT", "AT · Awareness and training"], ["AU", "AU · Audit and accountability"], ["CM", "CM · Configuration management"], ["IA", "IA · Identification and authentication"], ["IR", "IR · Incident response"], ["SC", "SC · System and communications protection"]] }], ["file", "File name", { ph: "The prototype keeps the name, not the file" }]],
      save: (d, v) => { const x = push(d.code, "pol", Object.assign({ id: seqId(d.code, "pol", "POL"), at: TODAY_ISO, by: ME }, v)); return [`${x.id} ${v.title} uploaded`, "policies", `pol|${x.id}`]; } },
    stig: { title: "Import checklist", label: "Import checklist", fields: (d) => [["title", "STIG", { req: true, ph: "As the checklist names it" }], ["el", "Element", { select: allEls(d).map((e) => [e.code, `${e.code} ${e.name}`]) }], ["file", "File name", { ph: ".ckl or .cklb; the prototype keeps the name" }]],
      save: (d, v) => { const x = push(d.code, "stig", Object.assign({ id: seqId(d.code, "stig", "CKL"), at: TODAY_ISO, by: ME }, v)); return [`${v.title} imported against ${v.el}`, "stigs", `stig|${x.id}`]; } },
    tl: { title: "Tailor a control", label: "Save decision", fields: () => [["act", "Decision", { select: [["add", "Add a control"], ["remove", "Remove a control"]] }], ["code", "Control", { req: true, ph: "SC-7(20)" }], ["why", "Rationale", { req: true, area: true }]],
      save: (d, v) => { const code = v.code.toUpperCase().replace(/\s+/g, ""), have = new Set(controls(d).map((x) => x.c)); if (!/^[A-Z]{2}-\d+(\(\d+\))?$/.test(code)) return ["code", "Enter a control, as SC-7(20)."]; if (v.act === "add" && have.has(code)) return ["code", `${code} is already in the baseline.`]; if (v.act === "remove" && !have.has(code)) return ["code", `${code} is not in the baseline.`]; push(d.code, "tl", { code, act: v.act, why: v.why, title: titleOf(code) || (controls(d).find((x) => x.c === code) || {}).t || "", by: ME, at: TODAY_ISO }); return [`${code} ${v.act === "add" ? "added to" : "removed from"} the baseline · ${plural(controls(d).length, "control")}`, "baseline", `tl|${code}`]; } },
    req: { title: "Create requirement", label: "Create requirement", fields: (d) => [["title", "Title", { req: true, ph: "What the system must do, in one line" }], ["text", "Statement", { area: true, req: true }], ["owner", "Owner", { select: [["", "No owner"]].concat(people()), value: holder(d, "isso")[0] || "" }], ["ctl", "Map to control", { ph: "Optional: a control of the baseline, as AC-2", hint: "Map it now or later, from its preview." }]],
      save: (d, v) => { const id = seqId(d.code, "req", "REQ"), c = (v.ctl || "").toUpperCase().replace(/\s+/g, ""); if (c && !controls(d).some((x) => x.c === c)) return ["ctl", `${c} is not in ${d.name}'s baseline.`]; push(d.code, "req", { id, title: v.title, text: v.text, owner: v.owner || null, ctl: c ? [c] : [], at: TODAY_ISO, by: ME }); return [`${id} created${c ? ` and mapped to ${c}` : ""}`, "requirements", `req|${id}`]; } },
    map: { title: "Map control", label: "Map control", fields: (d, ctx) => [["req", "Requirement", { select: reqOpts(d), value: ctx }], ["ctl", "Control", { req: true, ph: "A control of the baseline, as AC-2" }]],
      save: (d, v) => { const c = v.ctl.toUpperCase().replace(/\s+/g, ""); if (!controls(d).some((x) => x.c === c)) return ["ctl", `${c} is not in ${d.name}'s baseline.`]; const L = recs(d.code, "req").map((r) => r.id === v.req ? Object.assign({}, r, { ctl: (r.ctl || []).includes(c) ? r.ctl : (r.ctl || []).concat([c]) }) : r); put(d.code, "req", L); return [`${v.req} maps ${c} · ${c} reads ${STW[standing(d).get(c).cs]}`, "requirements", `req|${v.req}`]; } },
    ev: { title: "Upload evidence", label: "Upload evidence", fields: (d, ctx) => [["title", "Title", { req: true, ph: "What the file shows" }], ["req", "Against requirement", { select: reqOpts(d), value: ctx }], ["kind", "Kind", { select: [["Test report", "Test report"], ["Configuration export", "Configuration export"], ["Scan result", "Scan result"], ["Design document", "Design document"], ["Screenshot", "Screenshot"]] }], ["file", "File name", { ph: "The prototype keeps the name, not the file" }]],
      save: (d, v) => { if (!v.req) return ["req", "Choose the requirement it supports."]; const x = push(d.code, "ev", Object.assign({ id: seqId(d.code, "ev", "EV"), at: TODAY_ISO, by: ME }, v)); return [`${x.id} uploaded against ${v.req}`, "evidence", `ev|${x.id}`]; } },
    nar: { title: "Write narrative", label: "Save narrative", fields: (d, ctx) => [["text", `How ${short(d)} implements ${ctx}`, { area: true, req: true, rows: 5, value: (get(d.code, "nar", {}) || {})[ctx] || "" }]],
      save: (d, v, ctx) => { put(d.code, "nar", Object.assign({}, get(d.code, "nar", {}) || {}, { [ctx]: v.text })); const r = sspReady(d); return [`Narrative for ${ctx} saved · ${r.have} of ${r.need.length} written`, "ssps", `nar|${ctx}`]; } },
    publish: { title: "Publish SSP revision 1", label: "Publish revision 1", fields: (d) => [["note", "What changed", { area: true, value: "First published revision: the planned implementation of every control, with a narrative for each control a requirement maps." }]],
      save: (d) => { const r = sspReady(d); if (!r.need.length || r.have < r.need.length) return ["note", `Publish needs a narrative for each mapped control: ${r.have} of ${r.need.length} written.`]; put(d.code, "ssp", { state: "published", at: TODAY_ISO, by: ME }); return ["SSP revision 1 published: an assessment can be planned", "assessments", null]; } },
    camp: { title: "Plan assessment", label: "Plan assessment", fields: (d) => [["title", "Title", { req: true, value: `${short(d)} initial control assessment` }], ["start", "Start", { type: "date", value: addDays(TODAY_ISO, 30) }], ["end", "End", { type: "date", value: addDays(TODAY_ISO, 60) }], ["lead", "Lead assessor", { select: [["", "No one yet"]].concat(people()), value: holder(d, "lead")[0] || "" }]],
      save: (d, v) => { if ((get(d.code, "ssp", {}) || {}).state !== "published") return ["title", "Plan assessment waits for the published SSP."]; if (v.end && v.start && v.end < v.start) return ["end", "End after the start."]; const scope = [...standing(d).values()].filter((s) => s.kind !== "Inherited" && s.reqs.length).map((s) => s.c); const x = push(d.code, "camp", Object.assign({ id: seqId(d.code, "camp", "CMP"), scope, at: TODAY_ISO, by: ME }, v)); return [`${x.title} planned over ${plural(scope.length, "control")}`, "assessments", `camp|${x.id}`]; } },
    iss: { title: "Create operational issue", label: "Create operational issue", fields: (d) => [["title", "Title", { req: true }], ["sev", "Severity", { select: [["High", "High"], ["Moderate", "Moderate"], ["Low", "Low"], ["Critical", "Critical"]] }], ["ctl", "Control", { ph: "Optional, as AC-2" }]],
      save: (d, v) => { const x = push(d.code, "iss", Object.assign({ id: seqId(d.code, "iss", "ISS"), at: TODAY_ISO, by: ME }, v, { ctl: (v.ctl || "").toUpperCase() })); return [`${x.id} opened`, "findings", `iss|${x.id}`]; } },
    poam: { title: "Create POA&M item", label: "Create POA&M item", fields: (d) => [["title", "Title", { req: true }], ["answers", "Answers", { select: [["", "Nothing yet"]].concat(recs(d.code, "iss").map((x) => [x.id, `${x.id} ${x.title}`]), recs(d.code, "risk").map((x) => [x.id, `${x.id} ${x.title}`])) }], ["due", "Planned completion", { type: "date", value: addDays(TODAY_ISO, 90) }]],
      save: (d, v) => { const x = push(d.code, "poam", Object.assign({ id: seqId(d.code, "poam", "POAM"), at: TODAY_ISO, by: ME }, v)); return [`${x.id} created`, "poam", `poam|${x.id}`]; } },
    risk: { title: "Create risk", label: "Create risk", fields: () => [["title", "Title", { req: true }], ["sev", "Level", { select: [["Moderate", "Moderate"], ["High", "High"], ["Low", "Low"], ["Very high", "Very high"]] }], ["owner", "Owner", { select: [["", "No owner"]].concat(people()) }]],
      save: (d, v) => { const x = push(d.code, "risk", Object.assign({ id: seqId(d.code, "risk", "RSK"), at: TODAY_ISO, by: ME }, v, { owner: v.owner || null })); return [`${x.id} recorded`, "risks", `risk|${x.id}`]; } },
    pkg: { title: "Start package", label: "Start package", fields: (d) => [["title", "Title", { req: true, value: `${short(d)} authorization package` }], ["type", "Decision sought", { select: [["ATO", "ATO"], ["IATT", "IATT"]] }]],
      save: (d, v) => { const x = push(d.code, "pkg", Object.assign({ id: seqId(d.code, "pkg", "PKG"), state: "Draft", ao: holder(d, "ao")[0] || null, at: TODAY_ISO, by: ME }, v)); return [`${x.title} started for ${x.ao || "the AO"}`, "authorization", `pkg|${x.id}`]; } },
    prov: { title: "Add provider", label: "Add provider", fields: (d) => [["pid", "Provider", { select: Object.values(HOST()).filter((p) => !provIds(d).includes(p.id) && !(p.kind === "Host system" && d.host)).map((p) => [p.id, `${p.name} · ${p.kind}`]) }]],
      save: (d, v) => { if (!v.pid) return ["pid", "Choose a provider."]; push(d.code, "prov", v.pid); const p = HOST()[v.pid], c = counts(d); return [`${p.name} added · ${plural(c.inherited, "control")} inherited, ${fmt(c.hybrid)} hybrid`, "hosts", null]; } },
  };
  const fid = (k) => `v3p-f-${k}`;
  M["v3p-new"] = () => null;
  V3.M("v3p-new", (orig, id) => {
    const d = curMade(); const [kind, ctx] = String(id || "").split("|"); const f = FORMS[kind];
    if (!d || !f) return { title: "Not available", body: `<p class="ak-desc">This action belongs to a program created in this session.</p>`, footer: `<button type="button" class="btn" data-close-modal>Close</button>` };
    const fields = f.fields(d, ctx).map(([k, label, o]) => (o.area ? area(fid(k), label, o) : UI.input(fid(k), label, o))).join("");
    return { title: kind === "map" && ctx ? `Map control · ${ctx}` : kind === "nar" ? `Write narrative · ${ctx}` : f.title, body: `<div class="v2c-dlg v3p-dlg" data-v3p-kind="${esc(kind)}" data-v3p-ctx="${esc(ctx || "")}">${fields}</div>`, footer: HUBS.wired(f.label, "v3p-save", ` data-kind="${esc(kind)}" data-ctx="${esc(ctx || "")}"`) };
  });
  HUBS.act("v3p-save", (b) => {
    const d = curMade(), kind = b.dataset.kind, ctx = b.dataset.ctx, f = FORMS[kind]; if (!d || !f) return;
    const defs = f.fields(d, ctx), v = {}; let bad = null;
    for (const [k, label, o] of defs) { const x = UI.valOf(fid(k)); v[k] = x; const miss = o.req && !x; UI.fieldErr(fid(k), miss ? `${label} is required.` : ""); if (miss && !bad) bad = fid(k); }
    if (bad) { const el = document.getElementById(bad); if (el) el.focus(); return; }
    const out = f.save(d, v, ctx);
    if (Array.isArray(out) && out.length === 2 && document.getElementById(fid(out[0]))) { UI.fieldErr(fid(out[0]), out[1]); document.getElementById(fid(out[0])).focus(); return; }
    UI.closeModal();
    const [msg, route, open] = out;
    V2.go(route, open ? { open: { kind: "v3p-rec", id: open } } : null);
    V2.toast(msg);
  });

  // ════════════════ Previews of the program's records and controls ════════════════
  function recPreview(d, id) {
    const [kind, key] = String(id || "").split("|");
    const find = (k, f) => recs(d.code, k).find(f) || null;
    const head0 = (title, chip, actions = "") => AK.recordHead({ title, chip, actions });
    if (kind === "req") { const r = find("req", (x) => x.id === key); if (!r) return null; const evs = recs(d.code, "ev").filter((e) => e.req === r.id), st = standing(d);
      return { label: "Requirement preview", body: `<div class="a-tests-pan">${head0(`${r.id} ${r.title}`, "", `${newBtn("map", "Map control", true, r.id)} ${newBtn("ev", "Upload evidence", false, r.id)}`)}${AK.facts([["Owner", r.owner ? AK.owner(r.owner) : DASH], ["Created", esc(AK.md(r.at))], ["Evidence", fmt(evs.length)]])}
        ${card("Statement", `<p class="v3p-p">${esc(r.text || "")}</p>`)}${card("Controls it maps", (r.ctl || []).length ? (r.ctl || []).map((c) => `<div class="v3p-li"><b>${esc(c)}</b> ${esc((st.get(c) || {}).t || "")} ${stPill((st.get(c) || {}).cs || "no_requirement")}</div>`).join("") : `<p class="v3p-hint">No control yet: Map control.</p>`, `<span class="num">${(r.ctl || []).length}</span>`)}
        ${card("Evidence", evs.length ? evs.map((e) => `<div class="v3p-li"><b>${esc(e.id)}</b> ${esc(e.title)} ${mu(esc(e.kind))}</div>`).join("") : `<p class="v3p-hint">None yet: Upload evidence moves its controls to Not assessed.</p>`, `<span class="num">${evs.length}</span>`)}</div>` }; }
    const MAP = { el: ["Element", () => allEls(d).find((e) => e.code === key), (e) => [["Code", esc(e.code)], ["Type", esc(TYPE[e.type] || e.type || "")], ["System", esc(e.sys)], ["Source", e.from === "library" ? "Library component" : e.from === "product" ? "Product" : "Program's own"]], (e) => `${e.code} ${e.name}`],
      ic: ["Interconnection", () => find("ic", (x) => x.id === key), (x) => [["Type", esc(x.type)], ["Data", esc(x.data || "—")], ["Agreement", esc(x.agree)], ["Recorded", esc(AK.md(x.at))]], (x) => `${x.id} ${x.to}`],
      port: ["Port", () => find("port", (x) => x.id === key), (x) => [["Protocol", esc(x.proto)], ["Service", esc(x.svc)], ["Direction", esc(x.dir)]], (x) => `Port ${x.port}`],
      pol: ["Policy", () => find("pol", (x) => x.id === key), (x) => [["Family", esc(x.fam)], ["File", esc(x.file || "Not attached")], ["Uploaded", esc(AK.md(x.at))]], (x) => `${x.id} ${x.title}`],
      stig: ["Checklist", () => find("stig", (x) => x.id === key), (x) => [["Element", esc(x.el)], ["File", esc(x.file || "Not attached")], ["Imported", esc(AK.md(x.at))]], (x) => x.title],
      tl: ["Tailoring decision", () => find("tl", (x) => x.code === key), (x) => [["Decision", x.act === "add" ? "Adds" : "Removes"], ["Rationale", esc(x.why)], ["By", AK.owner(x.by)], ["On", esc(AK.md(x.at))]], (x) => `${x.code} ${x.title || ""}`],
      ev: ["Evidence", () => find("ev", (x) => x.id === key), (x) => [["Against", esc(x.req)], ["Kind", esc(x.kind)], ["File", esc(x.file || "Not attached")], ["Uploaded", esc(AK.md(x.at))]], (x) => `${x.id} ${x.title}`],
      nar: ["Narrative", () => ({ c: key, text: (get(d.code, "nar", {}) || {})[key] || "" }), (x) => [["Control", esc(x.c)], ["Narrative", x.text ? esc(x.text) : "Not written"]], (x) => `${x.c} narrative`],
      camp: ["Assessment campaign", () => find("camp", (x) => x.id === key), (x) => [["Scope", plural(x.scope.length, "control")], ["Window", `${esc(AK.md(x.start))} – ${esc(AK.md(x.end))}`], ["Lead", x.lead ? AK.owner(x.lead) : DASH], ["State", "Planned"]], (x) => `${x.id} ${x.title}`],
      iss: ["Operational issue", () => find("iss", (x) => x.id === key), (x) => [["Severity", esc(x.sev)], ["Control", esc(x.ctl || "—")], ["Opened", esc(AK.md(x.at))]], (x) => `${x.id} ${x.title}`],
      poam: ["POA&M item", () => find("poam", (x) => x.id === key), (x) => [["Answers", esc(x.answers || "—")], ["Planned completion", esc(AK.md(x.due))]], (x) => `${x.id} ${x.title}`],
      risk: ["Risk", () => find("risk", (x) => x.id === key), (x) => [["Level", esc(x.sev)], ["Owner", x.owner ? AK.owner(x.owner) : DASH], ["Recorded", esc(AK.md(x.at))]], (x) => `${x.id} ${x.title}`],
      pkg: ["Authorization package", () => find("pkg", (x) => x.id === key), (x) => [["Decision sought", esc(x.type)], ["For", x.ao ? AK.owner(x.ao) : DASH], ["State", esc(x.state)], ["Started", esc(AK.md(x.at))]], (x) => `${x.id} ${x.title}`] };
    const m = MAP[kind]; if (!m) return null; const x = m[1](); if (!x) return null;
    const act = kind === "nar" && (get(d.code, "ssp", {}) || {}).state !== "published" ? newBtn("nar", x.text ? "Edit narrative" : "Write narrative", true, key) : "";
    return { label: `${m[0]} preview`, body: `<div class="a-tests-pan">${head0(m[3](x), "", act)}${AK.facts(m[2](x))}</div>` };
  }
  V3.P("v3p-rec", (orig, id) => { const d = curMade(); return (d && recPreview(d, id)) || { label: "Preview", body: `<p class="note-p">This record belongs to a program created in this session.</p>` }; });
  function ctlPreview(d, code) {
    const s = standing(d).get(code); if (!s) return null;
    const p = s.offer ? HOST()[s.offer.pid] : null, reqs = recs(d.code, "req").filter((r) => (r.ctl || []).includes(code));
    const provPart = s.offer ? card(`${p.name}'s part`, `${kv([["Responsibility", esc(s.kind)], ["Provider's status", stPill(s.offer.st || "satisfied")]])}<p class="v3p-p">${esc(String(s.offer.prov || "").replace(/WS-X90/g, short(d)))}</p>`) : "";
    const own = s.kind === "Inherited" ? "" : card(`${short(d)}'s part`, `${kv([["Control status", stPill(s.own)], ["Its part", s.kind === "Hybrid" ? "Not written yet: the narrative says what the program does itself" : "The whole control"]])}`);
    return { label: "Control preview", body: `<div class="a-tests-pan">${AK.recordHead({ title: `${code} ${s.t}`, chip: stPill(s.cs), actions: s.kind === "Inherited" ? "" : newBtn("req", "Create requirement", true) })}${AK.facts([["Program", esc(d.name)], ["Responsibility", esc(s.kind)], ["Requirements", fmt(reqs.length)]])}
      ${provPart}${own}${card("Requirements that map it", reqs.length ? reqs.map((r) => `<div class="v3p-li"><b>${esc(r.id)}</b> ${esc(r.title)}</div>`).join("") : `<p class="v3p-hint">${s.kind === "Inherited" ? "None needed: the provider implements and assesses it." : `No requirement of ${esc(d.name)} maps ${esc(code)} yet.`}</p>`, `<span class="num">${reqs.length}</span>`)}</div>` };
  }
  V3.P("v3p-ctl", (orig, code) => { const d = curMade(); return (d && ctlPreview(d, code)) || { label: "Control preview", body: `<p class="note-p">This control belongs to a program created in this session.</p>` }; });
  // The control preview the host pages open (a-tests-control) and the provider's preview read the created program's own standing.
  V3.P("a-tests-control", (orig, code) => { const d = curMade(); return d ? ctlPreview(d, code) || orig() : orig(); });
  V3.P("v2h-prov", (orig, id) => {
    const d = curMade(), o = orig(); if (!d || !o || typeof o.body !== "string") return o;
    const st = [...standing(d).values()].filter((s) => s.offer && s.offer.pid === id), t = parse(o.body);
    for (const c of t.content.querySelectorAll(".ak-card")) { const b = c.querySelector(".v2k-lkh b"); if (b && /^What (WS-X90 takes|it offers WS-X90|it offers)$/.test(b.textContent.trim())) c.outerHTML = `<div class="ak-card v2k-lk"><div class="v2k-lkh"><b>What ${esc(short(d))} takes</b><span class="num v2k-mu">${fmt(st.length)}</span></div><dl class="ak-kv"><dt>Inherited</dt><dd class="num">${fmt(st.filter((s) => s.kind === "Inherited").length)}</dd><dt>Hybrid</dt><dd class="num">${fmt(st.filter((s) => s.kind === "Hybrid").length)}</dd></dl></div>`; }
    let body = t.innerHTML.replace(/Show its controls/g, "Show its controls").replace(/Offered as WS-X90/g, `Offered to ${esc(short(d))}`);
    return { label: o.label, body };
  });

  // ════════════════ The shell: the current program changes only from the switcher or a link that names a program ════════════════
  // A03: the hubs layer treats a link followed from a page it does not count as a program's (Lifecycle, Boundary, Host & providers,
  // the workbook, record pages) as a link from a workspace page, and makes WS-X90 current. While V3 is on, such a click keeps the
  // program: the click marks itself, and the state write that would switch is dropped.
  const PROGPAGE = (r) => !!(HUBS.progKey(r) || /^(lifecycle|boundary|hosts|sctm|activity|rec--|program-start|overview)/.test(r));
  let HOLD = false;
  const mark = (e) => {
    if (!V3.on()) return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const a = t.closest("a[href^='#'], [data-go], [data-v2go]"); if (!a || a.closest("[data-v2prog]")) return;
    if (PROGPAGE((location.hash || "#home").slice(1)) && one(HUBS.cur())) { HOLD = true; setTimeout(() => { HOLD = false; }, 0); }
  };
  window.addEventListener("click", mark, true);
  window.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") mark(e); }, true);
  const set0 = V2.set;
  V2.set = function (path, v) { if (HOLD && path === "prog.cur" && V3.on() && v === WSX) return v; return set0.apply(this, arguments); };
  V3.keepProgram = () => true;
  // A16: a switch between two programs at the same address draws the new one.
  let drawn = 0, switched = 0;
  V3.navDrawn(() => { drawn++; });
  V2.on((path) => {
    if (path !== "prog.cur" || !V3.on() || V3.toggling) return;
    const at = drawn; switched++;
    setTimeout(() => { if (drawn === at && V3.on()) V3.refresh(); }, 80);
  });
  // The line under the switcher reads the created program's own stage.
  V3.navDrawn(() => { const d = curMade(); if (!d) return; const el = document.querySelector("#nav .v2g-head"); if (el) el.textContent = stage(d).line; });

  // ════════════════ Programs, Home, My work and search read the created programs' own records ════════════════
  const ownerOf = (d) => sys0(d).owner || holder(d, "owner")[0] || null;
  // A13, A23: a created program's row counts its inherited controls by the provider's status, names the system owner from the
  // wizard and opens a preview like the other rows; the No owner view counts it only when nobody owns its system.
  V3.S("portfolio", (orig) => {
    const html = orig(), L = madeList(); if (!L.length || typeof html !== "string") return html;
    const t = parse(html), C = t.content, ths = [...C.querySelectorAll("thead th")].map((x) => x.textContent.trim()), oi = ths.indexOf("Owner");
    const noOwnOn = !!C.querySelector('.qv.on[data-v7o-v="noown"]');
    let owned = 0;
    for (const d of L) {
      const tr = C.querySelector(`tbody tr[data-v2prog="${CSS.escape(d.code)}"]`), own = ownerOf(d); if (own) owned++;
      if (!tr) continue;
      if (noOwnOn && own) { tr.remove(); continue; }
      const c = counts(d), sat = tr.querySelector(".v2-pf-sat");
      if (sat) sat.innerHTML = `<b class="num">${pct(c.satisfied, c.total)}%</b><span class="v7o-mu"><span class="num">${fmt(c.satisfied)} of ${fmt(c.total)}</span></span>`;
      if (oi >= 0 && tr.cells[oi]) tr.cells[oi].innerHTML = own ? AK.owner(own) : DASH;
      const fl = tr.querySelector(".v2g-pfl"); if (fl) fl.textContent = stage(d).line + (provIds(d)[0] ? ` · Host: ${HOST()[provIds(d)[0]].name}` : "");
      tr.removeAttribute("data-go"); tr.removeAttribute("data-v2prog"); tr.setAttribute("data-panel", "v7o-prog"); tr.setAttribute("data-id", d.code);
    }
    const n = C.querySelector('.qv[data-v7o-v="noown"] .num'); if (n) n.textContent = fmt(Math.max(0, (+n.textContent.replace(/[^\d]/g, "") || 0) - owned));
    return t.innerHTML;
  });
  V3.P("v7o-prog", (orig, code) => {
    const d = one(code); if (!d) return orig();
    const c = counts(d), sg = stage(d), nx = sg.next, own = ownerOf(d), g = guide(d);
    return { label: "Program preview", body: `<div class="v7o-pan">${AK.recordHead({ title: d.name, chip: pill("none", "Planned"), actions: `<a class="btn sm ink" href="#overview" data-v2prog="${esc(d.code)}">Open program</a>` })}${AK.facts([["Code", esc(d.code)], ["Owner", own ? AK.owner(own) : DASH], ["System", esc(sys0(d).code)], ["Target authorization", esc(mdy(targetOf(d)))]])}
      ${card("Control status", `<div class="v7o-big num">${pct(c.satisfied, c.total)}%<span class="v7o-mu"> satisfied</span></div>${kv(ORDER.filter((k) => c[k]).map((k) => [STW[k], `<span class="num">${fmt(c[k])}</span>`]))}<p class="v3p-hint">${c.inherited ? `${plural(c.inherited, "inherited control")} count by the provider's status.` : "Every control is the program's own."}</p>`, `<span class="num">${fmt(c.total)}</span>`)}
      ${card("Stage", nx ? `<div class="v3p-li">${esc(sg.line)}</div><div class="v3p-li">${esc(nx.title)} ${AK.due(nx.due)}</div>` : "Every step done")}
      ${card("Setup", `${AK.progress(g.filter((x) => x.done).length, g.length, "done")}`)}</div>` };
  });
  V3.S("home", (orig) => {
    const html = orig(), L = madeList(); if (!L.length || typeof html !== "string") return html;
    const t = parse(html);
    for (const d of L) {
      const a = t.content.querySelector(`a.pcard[data-v2prog="${CSS.escape(d.code)}"]`); if (!a) continue;
      const c = counts(d), p = pct(c.satisfied, c.total);
      const big = a.querySelector(".big"); if (big) big.textContent = `${p}%`;
      const bar = a.querySelector(".bar i"); if (bar) bar.style.width = `${p}%`;
      const ft = a.querySelector(".foot .num"); if (ft) ft.textContent = `${fmt(c.satisfied)} of ${fmt(c.total)} controls satisfied`;
      const cl = a.querySelector(".v2g-cardl"); if (cl) cl.textContent = stage(d).line;
      a.setAttribute("href", "#overview");
    }
    return t.innerHTML;
  });
  // A17: each open setup step with an owner is a task in My work, linked to the step's page (the program named on the link).
  function setupRows(mine) {
    return madeList().map((d) => [d, guide(d).filter((x) => !x.done && x.owner && (!mine || x.owner === ME))]).filter(([, r]) => r.length);
  }
  if (PA.mywork && PA.mywork.data) { const f0 = PA.mywork.data; PA.mywork.data = function () { const out = f0.apply(this, arguments); if (!V3.on()) return out; for (const [d, rows] of setupRows(false)) out.push({ title: `Setup · ${d.name}`, glyph: "ring", rows: rows.map((x) => ({ k: "act", t: x.title, m: x.sub, o: [x.owner], r: x.route, me: x.owner === ME })) }); return out; }; }
  V3.S(/^my-work(-mine)?$/, (orig, r) => {
    const html = orig(), groups = setupRows(r === "my-work-mine"); if (!groups.length || typeof html !== "string" || html.indexOf("a-work-mwg") < 0) return html;
    const t = parse(html), C = t.content, sq = (C.querySelector('.a-work-sq[title="Work item"]') || C.querySelector(".a-work-sq") || {}).innerHTML || "", chev = (C.querySelector(".a-work-chv") || {}).outerHTML || "";
    const av = (n) => `<span class="a-work-av" title="${esc(n)}">${AK.avatar(n, 22)}</span>`;
    const html2 = groups.map(([d, rows]) => `<details class="a-work-mwg v3p-mwg" open data-v3p-prog="${esc(d.code)}"><summary>${chev}${h.gl("ring")}<b>Setup · ${esc(d.name)}</b><span class="ct num">${rows.length}</span></summary><div class="a-work-mwl">${rows.map((x) => `<a class="a-work-mw" href="#${esc(x.route)}" data-v2prog="${esc(d.code)}"><span class="a-work-sq" title="Work item">${sq}</span><span class="a-work-mwt"><span class="a-work-mwtt">${esc(x.title)}</span><span class="m">${esc(x.sub)} · due ${esc(AK.md(x.due))}</span></span><span class="a-work-mwo"><span class="ak-avs">${av(x.owner)}</span></span></a>`).join("")}</div></details>`).join("");
    const box = C.querySelector(".mw"); if (box) box.insertAdjacentHTML("beforeend", html2);
    return t.innerHTML;
  });
  // A22: ⌘K finds created programs by name, code and system code (the palette asks the wire layer first; V3 answers with them).
  if (PA.v2wire && PA.v2wire.ask) {
    const ask0 = PA.v2wire.ask;
    PA.v2wire.ask = function (q) {
      const a = ask0.apply(this, arguments); if (a || !V3.on()) return a;
      const s = String(q || "").toLowerCase().trim(), sn = s.replace(/[^a-z0-9]/g, ""); if (s.length < 2) return a;
      const d = madeList().find((x) => [x.name, x.code, sys0(x).code].some((v) => { const l = String(v || "").toLowerCase(); return l.includes(s) || (sn.length > 2 && l.replace(/[^a-z0-9]/g, "").includes(sn)); }));
      if (!d) return a;
      return { t: "program", code: d.code, name: d.name, sub: `${sys0(d).code} · created in this session · ${stage(d).line}`, to: "Overview", glyph: h.icon("portfolio"), key: "program:" + d.code, act: () => { HUBS.setCur(d.code); return { go: "overview" }; } };
    };
  }
  // The palette labels that answer's group: a program, not an answer.
  document.addEventListener("input", (e) => {
    if (!V3.on() || !e.target || e.target.id !== "v8w-k-q") return;
    setTimeout(() => { const l = document.querySelector(".v8w-k-list"); if (!l) return; const o = l.querySelector('[data-v8w-k="0"]'), gh = l.querySelector(".v8w-k-gh span"); if (o && gh && gh.textContent === "Answer" && /created in this session/.test(o.textContent)) gh.textContent = "Programs"; }, 0);
  }, true);

  // ════════════════ The wizard: a blank program starts blank; nothing is preselected or pre-applied ════════════════
  // The wizard keeps its draft to itself, so V3 changes it through the wizard's own controls: an input with its field path
  // (data-pf), or a control with its action (data-pn), dispatched inside the page.
  const inMain = (el) => { const m = document.getElementById("main"); if (!m) return; el.hidden = true; m.appendChild(el); return el; };
  const setD = (path, value) => { const el = inMain(document.createElement("input")); if (!el) return; el.setAttribute("data-pf", path); el.value = value; el.dispatchEvent(new Event("input", { bubbles: true })); el.remove(); };
  const fire = (attrs) => { const el = inMain(document.createElement("span")); if (!el) return; for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); el.click(); el.remove(); };
  const CNSSI = "OVL-CNSSI-1253-ALLOCATION";
  const OTHER_SYS = ["SYS-WSX90", "X800-A-CUSA", "X800-C-CUSB", "R210-STD-CUSA", "G25-VEH-CUSC", "G40-TRN-CUSC"];
  const takenSys = () => new Map(OTHER_SYS.map((c) => [c, c === "SYS-WSX90" ? "WS-X90 Sentinel Mission System" : "a customer program"]).concat(madeList().flatMap((d) => (d.systems || []).map((s) => [String(s.code || "").toUpperCase(), d.name]))));
  const freeSys = () => { const t = takenSys(); for (let k = 1; k < 100; k++) { const c = `SYS-23${String(k).padStart(2, "0")}`; if (!t.has(c)) return c; } return "SYS-2399"; };
  let gen = 0; const GENS = {};
  const G = () => (GENS[gen] = GENS[gen] || { init: false, start: "product", hostPicked: false, nss: null, codes: {} });
  const newGen = () => { gen++; };
  let madeN = madeList().length;
  V2.on((path) => { if (path === "*" || path === "prog.made") { const n = madeList().length; if (n > madeN && V3.on()) setTimeout(() => V2.toast(`Program created · ${madeList()[0].code}: its Overview shows what the wizard wrote`), 80); if (n !== madeN) newGen(); madeN = n; } });
  const WIZ = /^program-new(-details|-systems|-baseline|-team|-review)?$/;
  V3.S(WIZ, (orig, r) => {
    if (r === "program-new" && PA.pnStartFrom === "itcsc") { newGen(); G().start = "itcsc"; }
    let html = orig(); const g = G();
    if (!g.init) { g.init = true; queueMicrotask(() => { setD("tailoring.length", "0"); if (!g.hostPicked) fire({ "data-pn": "set", "data-f": "hostPick", "data-v": "" }); }); }
    if (typeof html !== "string") return html;
    const t = parse(html), C = t.content;
    if (r === "program-new") { const on = C.querySelector('[data-pn="start"][aria-checked="true"]'); if (on) g.start = on.getAttribute("data-v"); }
    if (r === "program-new-details" && g.start !== "product") {
      const nm = C.querySelector("#pn-name"); if (nm && !nm.getAttribute("placeholder")) nm.setAttribute("placeholder", "The program's name, as its customer knows it");
      const ms = C.querySelector("#pn-mission"); if (ms && !ms.getAttribute("placeholder")) ms.setAttribute("placeholder", "What the program delivers, and for whom");
      for (const n of C.querySelectorAll(".note-p")) n.innerHTML = n.innerHTML.replace(/Customer D, its mission, sponsor and dates are examples; the code/, "The code");
    }
    if (r === "program-new-systems") {
      const nm = C.querySelector("#pn-s0-name"); if (nm && !nm.getAttribute("placeholder")) nm.setAttribute("placeholder", "The system's name");
      for (const inp of C.querySelectorAll('input[data-pf$=".code"][data-pf^="systems."]')) { const k = inp.getAttribute("data-pf").split(".")[1]; g.codes[k] = inp.value; inp.closest(".pn-field").insertAdjacentHTML("beforeend", `<span class="pn-status v3p-sysst" data-v3p-sysst="${k}" aria-live="polite">${sysStatus(k, inp.value)}</span>`); }
      if (/From the ITCSC/.test(html) && g.nss === null) g.nss = "yes";
      const host = C.querySelector(".pn-host");
      const nss = `<div class="pn-sub v3p-nss"><h3 class="pn-h3" id="v3p-nss-l">National security system</h3><div class="pn-field"><span class="pn-label" id="v3p-nss-q">Is it a national security system? <span class="req">Required</span></span><span class="pn-hint">ITCSC §7. A national security system takes CNSSI 1253's allocation on top of its baseline.</span>
        <div class="pn-seg" role="radiogroup" aria-labelledby="v3p-nss-q">${[["yes", "Yes, a national security system"], ["no", "No"]].map(([v, l]) => `<button type="button" role="radio" aria-checked="${g.nss === v}" tabindex="${g.nss === v || (!g.nss && v === "yes") ? 0 : -1}" data-v3p-nss="${v}">${l}</button>`).join("")}</div>
        <span class="pn-err" id="v3p-nss-err" hidden></span></div>${g.nss ? `<p class="pn-say">${h.gl("info")}<span class="x">${g.nss === "yes" ? "CNSSI 1253 National Security System Allocation is applied in step 4, Baseline." : "CNSSI 1253 is not applied."}</span></p>` : ""}</div>`;
      if (host) host.insertAdjacentHTML("afterend", nss);
      if (g.start === "product" && host && !g.hostPicked) { const say = host.querySelector(".pn-say .x"); if (say && /^No host system/.test(say.textContent)) say.insertAdjacentHTML("beforeend", " This product's Eject Launch and Rail configurations usually ride F-16 Block 70: choose it above if this variant does."); }
    }
    if (r === "program-new-baseline") {
      if (g.nss === "no") for (const p of C.querySelectorAll(".pn-say")) if (/A national security system usually adds CNSSI 1253/.test(p.textContent)) p.innerHTML = `${h.gl("info")}<span class="x">Answered in step 3 as not a national security system, so CNSSI 1253 is not applied.</span>`;
      if (g.start === "product") { const tail = [...C.querySelectorAll(".pn-sub")].find((s) => /Program tailoring/.test(s.textContent)); if (tail) tail.insertAdjacentHTML("beforeend", `<div class="v3p-sugs"><p class="pn-hint">Suggested for this product's customer variants: nothing is applied until you add it.</p><ul class="pn-decs">${SUG.map((x, i) => `<li>${AK.chip(x.act === "add" ? "Adds" : "Removes")}<span class="t"><b class="pn-code">${esc(x.code)}</b></span><span class="s">${esc(x.why)}</span><button type="button" class="btn sm" data-v3p-sug="${i}">Add</button></li>`).join("")}</ul></div>`); }
      for (const n of C.querySelectorAll(".pn-h3")) n.innerHTML = n.innerHTML.replace(/ <span class="ex">Example<\/span>/, "");
    }
    return t.innerHTML;
  });
  const SUG = [{ code: "PE-17", act: "remove", why: "No alternate work site: the variant is integrated and maintained only at the customer's depot." }, { code: "SR-4", act: "add", why: "The customer asks for provenance records for the variant's components." }];
  function sysStatus(k, code) {
    const c = String(code || "").trim().toUpperCase(); if (!c) return "";
    const t = takenSys(), dup = Object.entries(G().codes).some(([j, v]) => j !== String(k) && String(v || "").toUpperCase() === c);
    if (t.has(c)) return `<span class="v3p-bad">${esc(c)} is ${esc(t.get(c))}'s system. ${esc(freeSys())} is free.</span>`;
    if (dup) return `<span class="v3p-bad">${esc(c)} is another system of this draft.</span>`;
    return `<span class="pn-ok">${h.gl("check")}${esc(c)} is free${c === freeSys() ? " · the next free code" : ""}</span>`;
  }
  const sysProblem = () => { for (const [k, v] of Object.entries(G().codes)) { const c = String(v || "").toUpperCase(); if (c && (takenSys().has(c) || Object.entries(G().codes).some(([j, w]) => j !== k && String(w || "").toUpperCase() === c))) return k; } return null; };
  document.addEventListener("click", (e) => {
    if (!V3.on() || !e.target.closest) return;
    const st = e.target.closest('[data-pn="start"]');
    if (st) { const v = st.getAttribute("data-v"), g = G(); g.start = v; if (v === "blank" || v === "copy" || v === "import") { const c = freeSys(); setD("systems.0.code", c); setD("systems.0.prefix", c + "-"); g.codes = { 0: c }; } if (v === "blank") { setD("name", ""); setD("mission", ""); setD("sponsor", ""); setD("systems.0.name", ""); } return; }
    const hp = e.target.closest('[data-pn="set"][data-f="hostPick"]'); if (hp && e.isTrusted) { G().hostPicked = true; return; }
    if (e.target.closest('[data-pn="leave-discard"]')) { newGen(); return; }
    const n = e.target.closest("[data-v3p-nss]");
    if (n) {
      const g = G(), v = n.getAttribute("data-v3p-nss"); g.nss = v;
      fire({ "data-pn": "ovl-remove", "data-v": CNSSI });
      if (v === "yes") { fire({ "data-pn": "ovl-add", "data-v": CNSSI }); for (let i = 0; i < 6; i++) fire({ "data-pn": "ovl-up", "data-v": CNSSI }); }
      else fire({ "data-pn": "set", "data-f": "v3nss", "data-v": "no" });
      if (PA.SSP && PA.SSP.ui && PA.SSP.ui.toast) PA.SSP.ui.toast(v === "yes" ? "A national security system: CNSSI 1253 is applied in the baseline" : "Not a national security system: CNSSI 1253 is not applied");
      const again = document.querySelector(`[data-v3p-nss="${v}"]`); if (again) again.focus();
      return;
    }
    const sg = e.target.closest("[data-v3p-sug]");
    if (sg) {
      const x = SUG[+sg.getAttribute("data-v3p-sug")]; if (!x) return;
      fire({ "data-modal": "pn-tailor" });
      if (x.act === "remove") fire({ "data-pn": "set", "data-f": "tw.act", "data-v": "remove" });
      const q = inMain(document.createElement("input")); q.setAttribute("data-twq", "1"); q.value = x.code; q.dispatchEvent(new Event("input", { bubbles: true })); q.remove();
      fire({ "data-pn": "tw-add" });
      const ta = [...document.querySelectorAll("#modal textarea[data-tw]")].pop();
      if (ta && !ta.value) { ta.value = x.why; ta.dispatchEvent(new Event("input", { bubbles: true })); ta.focus(); }
    }
  });
  // Continue on Systems needs the national security system answer and system codes no other system holds (A20, A21).
  window.addEventListener("click", (e) => {
    if (!V3.on() || !e.target.closest) return;
    const b = e.target.closest('[data-pn="next"], [data-pn="to-review"], [data-pn="create"]'); if (!b) return;
    const r = (location.hash || "").slice(1); if (!WIZ.test(r)) return;
    const g = G(), bad = sysProblem();
    if (r === "program-new-systems" && !g.nss) { e.preventDefault(); e.stopImmediatePropagation(); const er = document.getElementById("v3p-nss-err"); if (er) { er.hidden = false; er.textContent = "Answer whether the system is a national security system: ITCSC §7 asks it."; } const f = document.querySelector('[data-v3p-nss="yes"]'); if (f) { f.focus(); f.scrollIntoView({ block: "center" }); } return; }
    if ((r === "program-new-systems" || r === "program-new-review") && bad !== null) { e.preventDefault(); e.stopImmediatePropagation(); if (r === "program-new-review") { location.hash = "program-new-systems"; return; } const inp = document.querySelector(`[data-pf="systems.${bad}.code"]`); if (inp) { inp.setAttribute("aria-invalid", "true"); inp.focus(); } }
  }, true);
  document.addEventListener("input", (e) => {
    if (!V3.on()) return;
    const t = e.target, f = t && t.getAttribute && t.getAttribute("data-pf"), m = f && /^systems\.(\d+)\.code$/.exec(f); if (!m || !t.isConnected || t.hidden) return;
    const g = G(); g.codes[m[1]] = t.value.toUpperCase();
    if (g.start !== "product") setD(`systems.${m[1]}.prefix`, t.value.toUpperCase() + "-");
    const s = document.querySelector(`[data-v3p-sysst="${m[1]}"]`); if (s) s.innerHTML = sysStatus(m[1], t.value);
    if (!sysProblem()) t.removeAttribute("aria-invalid");
  });
  // A18: dialogs a created program reaches name no other customer.
  V3.M("pn-invite", (orig) => { const o = orig(); if (o && typeof o.body === "string") o.body = o.body.replace(/name@customer-d\.mil/g, "name@agency.mil"); return o; });
  V3.M("pn-reqs", (orig) => { const o = orig(); if (o && typeof o.body === "string") o.body = o.body.replace(/Customer D's requirements document/g, "The customer's requirements document").replace(/<p class="ak-desc">/, '<p class="ak-desc">The prototype reads no file: dropping one records nothing. '); return o; });
  // A25: a program made from a product keeps the product's inherits card, with the rule its numbers follow.
  function productCard(d) {
    if (d.start !== "product") return "";
    let html = ""; try { html = V3.force(false, () => S["program-start"]()); } catch (e) { return ""; }
    const t = parse(html), c = [...t.content.querySelectorAll(".pn-card")].find((x) => /What the program inherits from/.test(x.textContent)); if (!c) return "";
    for (const b of c.querySelectorAll(".btns")) b.remove();
    const hint = c.querySelector(".pn-hint"); if (hint) hint.insertAdjacentHTML("beforeend", " Inherited counts the controls a kept product element claims with nothing changed behind it, whatever the product assessment found; satisfied counts that assessment's determinations. The two answer different questions, so they can differ.");
    return c.outerHTML;
  }

  // ════════════════ Facts for other lanes ════════════════
  V3.facts.program = (code) => { const d = one(code || HUBS.cur()); if (!d) return null; const g = guide(d); return { code: d.code, name: d.name, controls: counts(d), stage: stage(d), guide: { done: g.filter((x) => x.done).length, total: g.length, steps: g }, records: Object.fromEntries(["req", "ev", "camp", "iss", "poam", "risk", "pkg", "el", "ic", "port", "pol"].map((k) => [k, recs(d.code, k).length])) }; };
  V3.facts.lifeDue = (code, id) => { const d = one(code); if (!d) return undefined; const st = schedule(d).find((s) => s.id === id || s.key === id); return st ? st.due : undefined; };
  // A step's preview and page (the lifecycle layer's) print the dates it counts from the day the program was made: read the
  // created program's schedule instead, and Categorize and Select's state from the ITCSC.
  const OFF = [30, 75, 110, 200, 290, 340, 450, 500, 560, 650, 740, 900, 930, 1080, 1140, 1240, 1270, 1290, 1330];
  function redate(d, html, id) {
    if (typeof html !== "string") return html;
    const key = String(id || "").split("|").pop(), i = T.findIndex((t) => `${t[0]}-1` === key); if (i < 0) return html;
    const st = schedule(d)[i], old = AK.md(addDays(String(d.at || TODAY_ISO).slice(0, 10), OFF[i])), w = stepState(d, st);
    let out = html.replace(new RegExp(`<span class="ak-due[^"]*">(?:(?!</span>).)*?Due ${old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</span>`, "g"), AK.due(st.due));
    if (st.key === "cat" || st.key === "sel") out = out.replace(/<span class="pill p-none"><span class="gl ring"><\/span>Not started<\/span>/, pill(isDone(w.s) ? "ok" : "none", w.w));
    return out;
  }
  V3.P("a-work-gate", (orig, id) => { const o = orig(), d = curMade(); if (!d || !o || typeof o.body !== "string") return o; return Object.assign({}, o, { body: redate(d, o.body, id) }); });
  V3.S(/^lifecycle-[a-z-]+-1$/, (orig, r) => { const d = curMade(); return d ? redate(d, orig(), r.replace(/^lifecycle-/, "")) : orig(); });
  // Lane F's facts answer WS-X90 only: once every lane has loaded, a created program's code answers from its own records.
  V3.ready(() => {
    const wrapF = (name, mine) => { const f = V3.facts[name]; V3.facts[name] = (prog, ...a) => { const d = one(prog); if (d) return mine(d); return typeof f === "function" ? f(prog, ...a) : undefined; }; };
    const bySev = (L) => L.reduce((a, x) => { a[x.sev] = (a[x.sev] || 0) + 1; return a; }, {});
    wrapF("controls", (d) => counts(d));
    wrapF("issues", (d) => { const L = recs(d.code, "iss"); return { open: L.length, bySev: bySev(L), pastDue: 0 }; });
    wrapF("risks", (d) => { const L = recs(d.code, "risk"); return { open: L.length, noOwner: L.filter((x) => !x.owner).length, bySev: bySev(L) }; });
    wrapF("poam", (d) => { const L = recs(d.code, "poam"); return { items: L.length, open: L.length, completed: 0 }; });
    wrapF("evidence", (d) => { const L = recs(d.code, "ev"); return { total: L.length, accepted: 0, pending: L.length, revise: 0 }; });
    wrapF("requirements", (d) => ({ total: recs(d.code, "req").length, drafts: 0 }));
    wrapF("setup", (d) => { const g = guide(d); return { done: g.filter((x) => x.done).length, total: g.length, steps: g }; });
    wrapF("people", (d) => ROLES.flatMap(([k, l]) => holder(d, k).map((n) => ({ name: n, role: l, rmf: k }))));
    const st0 = V3.facts.status; V3.facts.status = (code, prog) => { const d = one(prog) || curMade(); if (d) { const s = standing(d).get(code); return s ? s.cs : undefined; } return typeof st0 === "function" ? st0(code, prog) : undefined; };
  });
  PA.v3p = { counts, standing, schedule, stage, guide, controls, recs };
})();
