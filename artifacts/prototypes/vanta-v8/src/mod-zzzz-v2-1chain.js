// Prototype v2, agent C1 (v2k-): the assurance chain a reader can walk, and the guard over every dialog. Loads after the v2 core.
// [B1 B4 B10 B11 B12 B17 A18]
// The chain, for any control (SA-24 starts with nothing; SI-2 starts in a campaign's plan):
//   no requirement → Map a requirement → no evidence → Link evidence → not assessed → Add to assessment campaign (or Plan an
//   assessment) → the request Set Ready → Record determination → Publish assessment results → satisfied, or short of satisfied with an
//   assessment finding and an operational issue → Create POA&M item → Create risk → Request acceptance → each step's Record decision,
//   the last the authorizing official's, recorded in package version 2.
// State (PA.v2.state, kept for the tab's session):
//   chain.ctl.<code>   { req, reqTitle, rel, mapNote, ev, evTitle, camp, ready, det, detNote, detBy, published, pubAt }
//   chain.issues       [{ id, ctl, sev, opened, title, camp }]          operational issues the published results opened
//   chain.poams        [{ id, title, issue, owner, planned, created }]   POA&M items created here (for any issue)
//   chain.risks        [{ id, title, issue, poam, lik, imp, sev, owner, threat, created }]
//   chain.acc.<risk>   { step 1..3, state requested|accepted|returned, reason, until, log: [[who, what, when]] }
//   chain.camps        [{ id, title, ssp, from, to, ctl }]               campaigns Plan an assessment made
//   chain.results.<camp> { title, at, by }                               results published here; chain.inc2 the expanded set's increment 2
//   chain.pkg          { submitted, step, decision, atd, note, at }      package version 2's approval
// API, window.PA.v2.chain: view(code), counts(), issues(), afs(), poams(), risks(), acc(riskId), camps(), camp(id), inPlan(code),
//   inc2(), pkg(), ssp3(), go helpers; the source modules read it at draw time.
(function () {
  const PA = window.PA, V = PA && PA.v2;
  if (!V || !PA.AK || !PA.SSP) return;
  const { S, P, M, h, data, ROUTE_NAV } = PA;
  const AK = PA.AK, SSP = PA.SSP;
  const { esc, fmt, pct, pill, tag, gl } = h;
  const TODAY = data.TODAY;
  const two = (n) => String(n).padStart(2, "0");
  const isoOf = (d) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
  const TODAY_ISO = isoOf(TODAY);
  const plus = (days) => { const d = new Date(TODAY.getTime()); d.setDate(d.getDate() + days); return isoOf(d); };
  const md = (iso) => (iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
  const mdy = (iso) => (iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const ME = "Ingrid Solberg";
  const EX = '<span class="ex">Example</span>';
  const ROLE = Object.fromEntries((SSP.roles || []).map(([k, , n]) => [k, n]));
  const AO = ROLE.authorizing_official || "R. Calloway", ISSM = ROLE.security_manager || "Joel Barrantes", ISSO = ROLE.security_officer || "Priya Raghavan";

  // ════════════════ State ════════════════
  const st = (code) => V.get("chain.ctl." + code, null) || {};
  const put = (code, patch) => V.set("chain.ctl." + code, Object.assign({}, st(code), patch));
  const list = (k) => V.get("chain." + k, null) || [];
  const push = (k, item) => V.set("chain." + k, [...list(k), item]);
  const acc = (rid) => V.get("chain.acc." + rid, null);
  const results = (cid) => V.get("chain.results." + cid, null);
  const inc2 = () => V.get("chain.inc2", null);
  const pkg = () => V.get("chain.pkg", null) || {};
  // SSP revision 3's review state is C2's (PA.v2hubs.ssp(): draft, submitted, approved, changes); read it there, never a second copy.
  const ssp3 = () => (PA.v2hubs && PA.v2hubs.ssp ? PA.v2hubs.ssp() : V.get("ssp.rev3.state", "draft"));
  const seq = (k) => { const n = (V.get("chain.seq." + k, 0) || 0) + 1; V.set("chain.seq." + k, n); return n; };

  // ════════════════ The control vocabulary and each control's standing ════════════════
  const ST = { satisfied: ["ok", "Satisfied"], partially_satisfied: ["part", "Partially satisfied"], other_than_satisfied: ["bad", "Other than satisfied"], not_assessed: ["none", "Not assessed"], no_evidence: ["none", "No evidence"], no_requirement: ["none", "No requirement"] };
  const stPill = (s) => pill((ST[s] || ST.no_requirement)[0], (ST[s] || ST.no_requirement)[1]);
  const base = (code) => SSP.ctl(code) || { c: code, t: code, f: String(code).split("-")[0], cs: "no_requirement", r: 0, e: 0, ob: 1, om: 0, oe: 0, oa: 0 };
  // The base plans: the continuous monitoring plan holds SI-2's 10 objectives (WS-X90's records).
  const BASE_PLAN = { conmon: ["SI-2"] };
  const CAMP0 = { conmon: { id: "conmon", title: "WS-X90 continuous monitoring — FY2027", short: "Continuous monitoring FY2027", plan: "Continuous monitoring plan — FY2027 · version 1 · draft", from: "2026-10-01", to: "2027-09-30", lead: "D. Okafor", owner: ISSO, ssp: "SSP 2, published Jul 25", route: "campaign-conmon" } };
  const camps = () => [CAMP0.conmon, ...list("camps").map((c) => ({ ...c, short: c.title, plan: `${c.title} plan · version 1 · draft`, lead: "D. Okafor", owner: ME, route: "campaign-new-" + c.n }))];
  const camp = (id) => camps().find((c) => c.id === id) || null;
  const campOf = (code) => { const s = st(code); if (s.camp) return s.camp; for (const [cid, codes] of Object.entries(BASE_PLAN)) if (codes.includes(code)) return cid; return null; };
  const inPlan = (code) => !!campOf(code);
  const REQ_OPTS = [
    ["REQ-641", "Mission functions continue through the compromise of one element", "Draft · allocated to SYS-WSX90"],
    ["REQ-642", "Cyber resiliency goals and techniques are traced to the design at each block review", "Draft · allocated to SYS-WSX90"],
    ["REQ-643", "A compromised partition is restored from a trusted image within one sortie", "Draft · allocated to CN-109101 Mission Computer"],
  ];
  const EV_OPTS = () => [
    ["ev-crdr", "Cyber resiliency design review record, Block 1", "Document · collected Nov 12 · Example"],
    ...(data.EVIDENCE || []).slice(0, 5).map((e, i) => ["ev-" + i, e[0], `${e[1]} · collected ${md(e[3])}`]),
  ];
  const evTitle = (id) => (EV_OPTS().find((e) => e[0] === id) || [id, id])[1];

  function view(code) {
    const b = base(code), s = st(code);
    let status = b.cs, om = b.om, oe = b.oe, oa = b.oa, reqs = b.r, evs = b.e;
    if (s.req) { om = b.ob; reqs = Math.max(reqs, 1); if (status === "no_requirement") status = "no_evidence"; }
    if (s.ev) { oe = b.ob; evs = Math.max(evs, 1); if (status === "no_evidence") status = "not_assessed"; }
    const cid = campOf(code), c = cid ? camp(cid) : null;
    const judged = s.det && s.published;
    if (judged) { status = s.det; oa = b.ob; }
    const issue = list("issues").find((i) => i.ctl === code) || null;
    const poam = issue ? list("poams").find((p) => p.issue === issue.id || (p.also || []).includes(issue.id)) || null : null;
    const risk = issue ? list("risks").find((r) => r.issue === issue.id || (poam && r.poam === poam.id)) || null : null;
    const reqLabel = s.req || null;
    // The one next step that moves it up the ladder.
    let step = null;
    if (status === "no_requirement") step = { label: "Map a requirement", modal: "v2k-map" };
    else if (status === "no_evidence") step = { label: `Link evidence to ${s.req || "its requirement"}`, modal: "v2k-link" };
    else if (status === "not_assessed") {
      if (!c) step = { label: "Add to assessment campaign", modal: "v2k-addcamp" };
      else if (s.camp && !s.ready) step = { label: "Set Ready in the campaign", route: c.route };
      else if (s.det && !s.published) step = { label: "Publish assessment results", route: c.route };
      else step = { label: "Open assessment campaign", route: c.route };
    } else if (judged && status !== "satisfied") {
      if (issue && !poam) step = { label: "Create POA&M item", modal: "v2k-poam", id: issue.id };
      else if (poam && !risk) step = { label: "Create risk", modal: "v2k-risk", id: issue.id };
      else if (risk && !acc(risk.id)) step = { label: "Request acceptance", modal: "v2k-accept", id: risk.id };
      else step = { label: "Open assessment findings", route: "findings-assessment", q: { rows: [code], note: `Showing ${code}'s assessment findings` } };
    }
    return { code, title: b.t, fam: b.f, base: b.cs, status, ob: b.ob, om, oe, oa, reqs, evs, s, touched: Object.keys(s).length > 0, camp: c, issue, poam, risk, step, det: judged ? s.det : null, db: judged ? "Program assessment" : b.db === "program" ? "Program assessment" : b.db ? "Component assessment" : null };
  }
  const touched = () => Object.keys(V.get("chain.ctl", null) || {});
  // The baseline's counts with every walked control moved from where it started to where it stands.
  function counts() {
    const c = Object.assign({}, SSP.counts.controlStatus);
    for (const code of touched()) { const v = view(code); if (v.base !== v.status) { c[v.base] = (c[v.base] || 0) - 1; c[v.status] = (c[v.status] || 0) + 1; } }
    const i2 = inc2();
    // Increment 2's 20 determinations decide once published: 13 satisfied, 4 partially, 1 other than satisfied; 2 stay not assessed.
    if (i2) { c.not_assessed -= 18; c.satisfied += 13; c.partially_satisfied += 4; c.other_than_satisfied += 1; }
    return c;
  }

  // ════════════════ Records the chain made, in the shapes the registers draw ════════════════
  const issues = () => list("issues");
  const poams = () => list("poams");
  const risks = () => list("risks");
  // Assessment findings: a published determination a control's walk recorded.
  const afs = () => touched().map(view).filter((v) => v.det).map((v) => ({ code: v.code, title: v.title, det: v.det, res: "v2k:" + v.camp.id, resLabel: (results(v.camp.id) || {}).title || v.camp.short, date: v.s.pubAt || TODAY_ISO, chain: true }));
  // The requests a campaign holds for the controls walked into it.
  const requests = (cid) => touched().filter((code) => st(code).camp === cid).map(view);
  const draftDets = (cid) => requests(cid).filter((v) => v.s.det && !v.s.published);
  const SEV = (lik, imp) => { const r = { low: 1, moderate: 2, high: 3 }; const n = (r[lik] || 2) * (r[imp] || 2); return n >= 9 ? "critical" : n >= 6 ? "high" : n >= 3 ? "moderate" : "low"; };
  const sevFromDet = (det) => (det === "other_than_satisfied" ? "high" : "moderate");
  const STEPS = [[1, "ISSO", ISSO], [2, "ISSM", ISSM], [3, "Authorizing official", AO]];
  const accWords = (a) => !a ? "Not requested" : a.state === "accepted" ? `Accepted by ${AO}` : a.state === "returned" ? "Sent back" : `Step ${a.step} of 3 · ${STEPS[a.step - 1][2]}`;
  const accPill = (a) => !a ? pill("none", "Not requested") : a.state === "accepted" ? pill("ok", "Accepted") : a.state === "returned" ? pill("bad", "Sent back") : pill("none", a.step === 3 ? "Awaiting the AO" : "Awaiting acceptance");

  // ════════════════ Links between screens ════════════════
  const goAttr = (route, q) => `data-v2k-go="${esc(route)}"${q ? ` data-v2k-q="${esc(JSON.stringify(q))}"` : ""} role="link" tabindex="0"`;
  const recRoute = (kind, id) => `rec--${kind}--${encodeURIComponent(String(id))}`;
  const ctlRoute = (code) => (code === "SI-2" ? "control-si2" : recRoute("a-tests-control", code));
  document.addEventListener("click", (e) => {
    const t = e.target && e.target.closest ? e.target.closest("[data-v2k-go]") : null;
    if (!t || t.getAttribute("aria-disabled") === "true") return;
    e.preventDefault(); e.stopPropagation();
    let q = null; try { q = t.dataset.v2kQ ? JSON.parse(t.dataset.v2kQ) : null; } catch (x) { q = null; }
    const modal = document.getElementById("modal"); if (modal && !modal.hidden) { const x = modal.querySelector(".dlg-h [data-close-modal]"); if (x) x.click(); }
    const panel = document.getElementById("panel"); if (panel && !panel.hidden && !t.closest("#panel")) { const x = panel.querySelector("#closePanel"); if (x) x.click(); }
    V.go(t.dataset.v2kGo, q);
  }, true);
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target && e.target.matches && e.target.matches("[data-v2k-go]:not(button):not(a)")) { e.preventDefault(); e.target.click(); } }, true);

  // ════════════════ Fields: real inputs that a dialog checks before it closes [B10] ════════════════
  let fid = 0;
  const lab = (label, req, forId) => `<label${forId ? ` for="${forId}"` : ""}>${esc(label)}${req ? ' <span class="req">Required</span>' : ""}</label>`;
  const fld = (label, ctl, { req = false, hint = "", id } = {}) => `<div class="ak-field v2k-f"${req ? " data-v2k-req" : ""}>${lab(label, req, id)}${ctl}${hint ? `<span class="s">${hint}</span>` : ""}</div>`;
  const inp = (name, ph, opt = {}) => { const id = "v2k-" + name + "-" + ++fid; return { id, html: `<input class="v2k-in" id="${id}" type="${opt.type || "text"}" name="${name}" placeholder="${esc(ph || "")}" value="${esc(opt.value || "")}" autocomplete="off"${opt.min ? ` min="${opt.min}"` : ""}>` }; };
  const area = (name, ph, value = "") => { const id = "v2k-" + name + "-" + ++fid; return { id, html: `<textarea class="v2k-in tall" id="${id}" name="${name}" placeholder="${esc(ph || "")}">${esc(value)}</textarea>` }; };
  const choose = (name, opts, value = "", ph = "") => { const id = "v2k-" + name + "-" + ++fid; return { id, html: `<select class="v2k-sel" id="${id}" name="${name}">${ph ? `<option value="">${esc(ph)}</option>` : ""}${opts.map(([v, l]) => `<option value="${esc(v)}"${v === value ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>` }; };
  const radios = (name, opts, value = "") => `<div class="v2k-radios" role="radiogroup">${opts.map(([v, l, hint, off]) => `<label class="v2k-radio${off ? " off" : ""}"><input type="radio" name="${name}" value="${esc(v)}"${v === value ? " checked" : ""}${off ? " disabled" : ""}><span><b>${esc(l)}</b>${hint ? `<small>${hint}</small>` : ""}</span></label>`).join("")}</div>`;
  const F = (label, made, opt = {}) => fld(label, made.html, { ...opt, id: made.id });
  const ro = (label, value) => `<div class="ak-field v2k-f">${lab(label)}<div class="v2k-ro">${value}</div></div>`;
  const desc = (t) => `<p class="ak-desc">${t}</p>`;
  const foot = (label, action, id, extra = "") => `${extra}<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v2-wired data-v2k="${esc(action)}" data-id="${esc(id || "")}">${esc(label)}</button>`;
  const PEOPLE = [[ME, "Security engineer"], [ISSO, "ISSO"], [ISSM, "ISSM"], ["Ray Colston", "System owner"], ["Victor Amsel", "Engineer"], ["Marcus Ryde", "Component owner"]];
  const peopleOpts = (none = "No owner") => [["", none], ...PEOPLE.map(([n, r]) => [n, `${n} · ${r}`])];
  const LEVELS = [["low", "Low"], ["moderate", "Moderate"], ["high", "High"]];

  // The value a field holds: a text input, a choice, a checked radio, a chosen file.
  const valueOf = (f) => {
    const r = f.querySelector('input[type="radio"]');
    if (r) { const c = f.querySelector('input[type="radio"]:checked'); return c ? c.value : ""; }
    const file = f.querySelector('input[type="file"]'); if (file) return file.files && file.files.length ? file.files[0].name : (file.dataset.v2kChosen || "");
    const el = f.querySelector("input, textarea, select"); if (el) return String(el.value || "").trim();
    return "filled"; // a field drawn as a value (a prefilled choice the prototype draws as text) holds one
  };
  const labelOf = (f) => { const l = f.querySelector("label, .v8w-lbl, .v8g-lbl, .pn-label"); return l ? l.textContent.replace(/\s*Required\s*/i, "").replace(/\s+/g, " ").trim() : "This field"; };
  // Check the dialog's required fields; name each one missing beside it and move focus to the first. Returns true when all hold.
  function check(dlg) {
    dlg.querySelectorAll(".v2k-err").forEach((x) => x.remove());
    dlg.querySelectorAll("[aria-invalid='true']").forEach((x) => x.removeAttribute("aria-invalid"));
    const missing = [...dlg.querySelectorAll("[data-v2k-req]")].filter((f) => f.offsetParent !== null || f.getClientRects().length).filter((f) => !valueOf(f));
    missing.forEach((f) => {
      const name = labelOf(f), ctl = f.querySelector("input:not([type=hidden]), textarea, select");
      const id = "v2k-e-" + ++fid;
      f.insertAdjacentHTML("beforeend", `<span class="v2k-err" id="${id}" role="alert">${esc(name)} is required.</span>`);
      if (ctl) { ctl.setAttribute("aria-invalid", "true"); ctl.setAttribute("aria-describedby", id); }
    });
    if (missing.length) { const c = missing[0].querySelector("input:not([type=hidden]):not([type=radio]), textarea, select, input[type=radio]"); if (c) c.focus(); }
    return !missing.length;
  }
  const vals = (dlg) => { const o = {}; dlg.querySelectorAll("input, textarea, select").forEach((el) => { if (!el.name) return; if (el.type === "radio") { if (el.checked) o[el.name] = el.value; } else if (el.type === "checkbox") o[el.name] = el.checked; else o[el.name] = String(el.value || "").trim(); }); return o; };
  const closeDlg = () => { const x = document.querySelector("#modal .dlg-h [data-close-modal]") || document.querySelector("#modal [data-close-modal]"); if (x) x.click(); };

  // ════════════════ The chain's dialogs ════════════════
  const v = (code) => view(code);
  // The controls nobody's requirement maps yet: Map a requirement from the Controls header chooses one of them.
  const unmapped = () => SSP.controls.filter((x) => view(x.c).status === "no_requirement").map((x) => [x.c, `${x.c} ${x.t}`]);
  M["v2k-map"] = (code) => {
    if (!code) {
      const opts = unmapped();
      return { title: "Map a requirement", body: `${desc(`${opts.length} controls of WS-X90's baseline have no requirement that maps them. Choose one; the requirement maps the whole control on SYS-WSX90.`)}
        ${F("Control", choose("ctl", opts, "", "Choose a control"), { req: true })}
        ${F("Requirement", choose("req", REQ_OPTS.map(([k, t]) => [k, `${k} · ${t}`]), "", "Choose a requirement"), { req: true, hint: `Requirements allocated to SYS-WSX90 that map no control yet ${EX}` })}
        ${F("Relationship", choose("rel", [["maps", "Maps to"], ["supports", "Supports"]], "maps"))}
        ${F("Rationale", area("note", "Why this requirement meets the control, in a sentence or two"))}`, footer: foot("Map a requirement", "map", "") };
    }
    const c = v(code);
    const req = choose("req", REQ_OPTS.map(([k, t, s]) => [k, `${k} · ${t}`]), "", "Choose a requirement");
    return { title: "Map a requirement", body: `${desc(`${esc(c.code)} ${esc(c.title)} counts ${c.ob} assessment objectives. The requirement maps the whole control on SYS-WSX90, the one system whose baseline selects it.`)}
      ${F("Requirement", req, { req: true, hint: `Requirements allocated to SYS-WSX90 that map no control yet ${EX}` })}
      ${F("Relationship", choose("rel", [["maps", "Maps to"], ["supports", "Supports"]], "maps"))}
      ${ro("Objectives", `Whole control · ${c.ob} of ${c.ob}`)}
      ${F("Rationale", area("note", "Why this requirement meets the control, in a sentence or two"))}`, footer: foot("Map a requirement", "map", c.code) };
  };
  M["v2k-link"] = (code) => {
    const c = v(code || "SA-24");
    return { title: "Link evidence", body: `${desc(`Evidence cited by ${esc(c.s.req || "the requirement")} covers ${esc(c.code)}'s ${c.ob} objectives once a reviewer has it.`)}
      ${ro("Requirement", `${tag(c.s.req || "—")} ${esc(c.s.reqTitle || "")}`)}
      ${F("Evidence", choose("ev", EV_OPTS().map(([k, t, s]) => [k, `${t} · ${s}`]), "", "Choose evidence"), { req: true })}
      ${F("What it shows", area("note", "The passage or result the assessor should read"))}`, footer: foot("Link evidence", "link", c.code) };
  };
  M["v2k-addcamp"] = (code) => {
    const c = v(code || "SA-24");
    const opts = camps().map((x) => [x.id, x.title, `${x.plan} · holds ${planSize(x.id)} objectives today`]);
    opts.push(["exp", "WS-X90 Expanded Control Set Assessment", "Its plan is published: no draft to add to", true]);
    return { title: "Add to assessment campaign", body: `${desc(`${esc(c.code)} joins the campaign's draft plan as its ${c.ob} assessment objectives, and a request for its evidence goes to the program team.`)}
      ${fld("Campaign", radios("camp", opts, ""), { req: true })}
      <p class="note-p">No campaign fits? <span class="ak-link" role="button" tabindex="0" data-modal="v2k-plan" data-id="${esc(c.code)}">Plan an assessment</span> around ${esc(c.code)} instead.</p>`, footer: foot("Add to assessment campaign", "addcamp", c.code) };
  };
  const planSize = (cid) => (BASE_PLAN[cid] || []).reduce((a, code) => a + base(code).ob, 0) + touched().filter((code) => st(code).camp === cid && !(BASE_PLAN[cid] || []).includes(code)).reduce((a, code) => a + base(code).ob, 0);
  M["v2k-plan"] = (code) => {
    const c = code ? v(code) : null;
    return { title: "Plan an assessment", body: `${desc(c ? `Plans a new campaign around ${esc(c.code)}: its first plan, a draft on SSP 2, holds ${esc(c.code)}'s ${c.ob} assessment objectives.` : "Plans a new campaign with a draft plan on SSP 2. Controls join its plan from their own pages.")}
      ${F("Title", inp("title", c ? `${c.code} assessment` : "Name the campaign"), { req: true })}
      ${F("SSP", choose("ssp", [["ssp2", "SYS-WSX90 · SSP 2, published Jul 25 · 560 controls"]], "ssp2"))}
      <div class="v2k-row2">${F("Window opens", inp("from", "", { type: "date", value: plus(14) }), { req: true })}${F("Window closes", inp("to", "", { type: "date", value: plus(45) }), { req: true })}</div>
      ${ro("Lead assessor", AK.owner("D. Okafor"))}`, footer: foot("Plan an assessment", "plan", c ? c.code : "") };
  };
  M["v2k-ready"] = (code) => {
    const c = v(code);
    return { title: "Set Ready", body: `${desc(`The request for ${esc(c.code)}'s evidence goes to the assessor as Ready, with what it cites: ${esc(c.s.evTitle || "its evidence")}.`)}
      ${F("Note to the assessor", area("note", "Anything the assessor should know before reading it"))}`, footer: foot("Set Ready", "ready", c.code) };
  };
  M["v2k-det"] = (code) => {
    const c = v(code);
    return { title: `Record determination for ${c.code}`, body: `${desc(`Recorded in the campaign's draft results. A draft decides nothing until the results are published.`)}
      ${fld("Determination", radios("det", [["satisfied", "Satisfied"], ["partially_satisfied", "Partially satisfied"], ["other_than_satisfied", "Other than satisfied"]], ""), { req: true })}
      ${F("Rationale", area("note", "What the evidence shows against the objectives; required short of satisfied"), { hint: "Required when the determination is short of satisfied." })}
      ${F("Assessor", choose("by", [["Nadia Fournier", "Nadia Fournier · Assessor"], ["D. Okafor", "D. Okafor · Lead assessor"]], "Nadia Fournier"))}`, footer: foot("Record determination", "det", c.code) };
  };
  M["v2k-publish"] = (cid) => {
    const c = camp(cid) || CAMP0.conmon, d = draftDets(c.id);
    const n = (k) => d.filter((x) => x.s.det === k).length;
    return { title: "Publish assessment results", body: `${desc(`<b>${esc(c.title)}</b>'s draft results hold ${d.length} determination${d.length === 1 ? "" : "s"}: ${n("satisfied")} satisfied, ${n("partially_satisfied")} partially and ${n("other_than_satisfied")} other than satisfied.`)}
      ${desc("Publishing freezes them. WS-X90's control statuses and traces read them from then on, and each determination short of satisfied opens an operational issue.")}
      ${F("Results title", inp("title", "Name the results", { value: `${c.short} results — first set` }), { req: true })}`, footer: foot("Publish assessment results", "publish", c.id) };
  };
  // The expanded set's increment 2 (20 findings in draft), published from the campaign and the Assessments card.
  M["a-tests-publish"] = () => ({ title: "Publish assessment results", body: `${desc("<b>Interim results — expanded control set, increment 2</b> holds 20 findings: 13 satisfied, 4 partially, 1 other than satisfied and 2 not assessed.")}
      ${desc("Publishing freezes them. WS-X90's control statuses and traces read them from then on.")}
      ${F("Results title", inp("title", "Name the results", { value: "Security assessment report — expanded control set, increment 2" }), { req: true })}`, footer: inc2() ? `<button type="button" class="btn" data-close-modal>Close</button><button type="button" class="btn ink" aria-disabled="true" title="Published already">Published ${esc(md((inc2() || {}).at))}</button>` : foot("Publish assessment results", "inc2", "") });
  // Dialogs the prototype draws and does not save: their required fields still hold the primary, and the guard says so [B9].
  M["v2k-export"] = (what) => ({ title: `Export ${what || "records"}`, body: `${desc(`A file of the ${esc(what || "records")} as shown, with the filters applied.`)}
      ${fld("Format", radios("fmt", [["csv", "CSV"], ["xlsx", "Excel workbook"], ["oscal", "OSCAL JSON", "Where the record has an OSCAL form"]], "csv"), { req: true })}`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink">Export</button>` });
  M["v2k-create-check"] = () => ({ title: "Create check", body: `${desc("A check reads WS-X90's records every day and fails when what it tests stops holding.")}
      ${fld("Name", `<div class="ak-input">What the check tests, in one line</div>`, { req: true })}
      ${fld("Control it tests", `<div class="ak-select">Choose a control${AK.i("down")}</div>`, { req: true })}
      ${F("Runs", choose("cadence", [["daily", "Every day"], ["weekly", "Every week"], ["monthly", "Every month"]], "daily"))}`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink">Create check</button>` });
  M["v2k-import-oscal"] = () => ({ title: "Import OSCAL", body: `${desc("A catalog, a profile (baseline) or an overlay as OSCAL JSON or XML. The import is read before anything changes, and a new revision never replaces a published one.")}
      ${fld("File", `<div class="ak-drop">${AK.i("upload")}Drop a file here, or choose one</div>`, { req: true })}
      ${F("It is a", choose("kind", [["profile", "Profile (baseline)"], ["catalog", "Catalog"], ["overlay", "Overlay"]], "profile"))}`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink">Read the file</button>` });
  M["v2k-create-overlay"] = () => ({ title: "Create overlay", body: `${desc("A reusable set of control decisions: each Adds or Removes a control. Programs apply published overlays to their baseline.")}
      ${fld("Name", `<div class="ak-input">Name the overlay</div>`, { req: true })}
      ${F("Catalog", choose("cat", [["r5", "NIST SP 800-53 Rev 5.1.1"]], "r5"))}
      ${F("Purpose", area("purpose", "What the overlay is for and who applies it"))}`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink">Create overlay</button>` });
  M["v2k-create-issue"] = () => ({ title: "Create operational issue", body: `${desc("An issue WS-X90 found in operation, outside an assessment: it gets a remediate-by date from its severity.")}
      ${fld("Title", `<div class="ak-input">What is wrong, where, in one sentence</div>`, { req: true })}
      ${F("Severity", choose("sev", [["critical", "Critical"], ["high", "High"], ["moderate", "Moderate"], ["low", "Low"]], "moderate"))}
      ${fld("Asset", `<div class="ak-select">Choose an asset${AK.i("down")}</div>`)}`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink">Create operational issue</button>` });
  M["v2k-import-scan"] = () => ({ title: "Import scan", body: `${desc("Hosts and findings from an ACAS repository export, a STIG checklist or an SBOM join WS-X90's findings; the file is read before anything changes.")}
      ${fld("File", `<div class="ak-drop">${AK.i("upload")}Drop a .nessus, .ckl, .cklb, CycloneDX or SPDX file, or choose one</div>`, { req: true })}
      ${F("Source", choose("src", [["acas", "ACAS (.nessus)"], ["stig", "STIG checklist"], ["sbom", "SBOM"]], "acas"))}`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink">Read the file</button>` });
  M["v2k-import"] = (what) => ({ title: `Import ${what || "a file"}`, body: `${desc(`The ${esc(what || "file")} is read before anything changes: what it adds, what it updates and what it cannot place.`)}
      ${fld("File", `<div class="ak-drop">${AK.i("upload")}Drop a file here, or choose one</div>`, { req: true })}
      ${F("Note", area("note", "Where it came from, if the file does not say"))}`, footer: `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink">Read the file</button>` });
  const lookup = () => PA.riskLookup || {};
  const issueById = (id) => issues().find((i) => i.id === id) || null;
  M["v2k-poam"] = (iid) => {
    const i = issueById(iid) || (lookup().issue && lookup().issue(iid)) || { id: iid, title: iid };
    return { title: "Create POA&M item", body: `${ro("Answers", esc(i.title))}
      ${F("Title", inp("title", "What the item fixes, in one line"), { req: true })}
      <div class="v2k-row2">${F("Owner", choose("owner", peopleOpts()))}${F("Planned completion", inp("planned", "", { type: "date", value: plus(30) }), { req: true })}</div>
      ${F("Remediation plan", area("plan", "How it will be fixed, and what evidence will show it"))}
      <p class="note-p">The item joins the WS-X90 POA&amp;M and exports to eMASS and OSCAL with its milestones.</p>`, footer: foot("Create POA&M item", "poam", iid) };
  };
  M["v2k-risk"] = (iid) => {
    const i = issueById(iid) || (lookup().issue && lookup().issue(iid)) || { id: iid, title: iid };
    const p = poams().find((x) => x.issue === iid);
    return { title: "Create risk", body: `${ro("Rests on", `${esc(i.title)}${p ? `<br><span class="v2k-mu">Answered by ${esc(p.title)}</span>` : ""}`)}
      ${F("Title", inp("title", "What could happen, to what, in one sentence"), { req: true })}
      ${F("Threat", area("threat", "Who or what, and how"))}
      <div class="v2k-row2">${F("Likelihood", choose("lik", LEVELS, "moderate"))}${F("Impact", choose("imp", LEVELS, "high"))}</div>
      ${F("Owner", choose("owner", peopleOpts()))}`, footer: foot("Create risk", "risk", iid) };
  };
  M["v2k-accept"] = (rid) => {
    const r = riskById(rid);
    return { title: "Request acceptance", body: `${desc(`Each approver in turn accepts the residual risk of <b>${esc(r ? r.title : "this risk")}</b>; the authorizing official's decision is the last, recorded in package version 2.`)}
      <ol class="v2k-steps">${STEPS.map(([n, role, who]) => `<li><span class="v2k-n">${n}</span>${AK.avatar(who, 22)}<b>${esc(who)}</b><span class="v2k-mu">${esc(role)}</span></li>`).join("")}</ol>
      ${F("Why accept it", area("reason", "What makes the residual risk acceptable, and until when"), { req: true })}
      ${F("Accept until", inp("until", "", { type: "date", value: plus(365) }), { req: true, hint: "At most 12 months, or the ATD of Sep 17, 2029, whichever comes first." })}`, footer: foot(`Send to ${ISSO}`, "accept", rid) };
  };
  M["v2k-decide"] = (rid) => {
    const a = acc(rid) || { step: 1 }, r = riskById(rid), [n, role, who] = STEPS[(a.step || 1) - 1];
    const ao = n === 3;
    return { title: ao ? "Record the authorizing official's decision" : "Record decision", body: `${desc(`Step ${n} of 3 · <b>${esc(who)}</b>, ${esc(role)}, decides on accepting <b>${esc(r ? r.title : "the risk")}</b>.${ao ? " The decision is recorded in package version 2 and locks a snapshot of the risk." : ""}`)}
      ${fld("Decision", radios("dec", ao ? [["accept", "Accept the risk", `Until ${esc(mdy((a && a.until) || plus(365)))}`], ["return", "Send back", "The owner treats it before acceptance is asked again"]] : [["approve", "Approve", `Passes it to step ${n + 1}`], ["return", "Send back", "Returns it to the owner"]], ""), { req: true })}
      ${F("Comment", area("note", "Required when sending back"), { hint: "Required when sending back." })}
      <p class="note-p">The prototype records it as ${esc(who)}, who holds the step.</p>`, footer: foot("Record decision", "decide", rid) };
  };
  M["v7p-submit"] = () => {
    const ok1 = ssp3() === "approved", ok2 = !!inc2();
    const row = (ok, label, meta, route) => `<div class="v2k-chk" ${route ? goAttr(route) : ""}>${gl(ok ? "check" : "ring")}<span class="x"><b>${label}</b><span class="v2k-mu">${meta}</span></span></div>`;
    const ready = ok1 && ok2 && !pkg().submitted;
    const sspWord = { draft: `Draft · ${SSP.counts.placeholders} placeholder narratives`, submitted: `Submitted · waiting on ${ISSM}`, changes: `Sent back by ${ISSM}`, approved: "Approved" }[ssp3()] || "Draft";
    return { title: "Submit package version 2 for approval", body: `${desc(`${esc(ISSM)} reviews first; then ${esc(AO)} decides and signs. Version 2 can be submitted once each item below is done.`)}
      <div class="v2k-checklist">${row(ok1, "SSP 3 approved", sspWord, "ssp-review")}${row(ok2, "Increment 2 results published", ok2 ? `Published ${md(inc2().at)}` : "20 findings in draft", "campaign")}${row(true, "POA&amp;M current", `${41 + poams().length} items`, "poam")}</div>
      ${F("Message to the approvers", area("note", "What changed since version 1, in a sentence or two"))}`,
      footer: ready ? foot("Submit", "submit", "") : `<span class="v2k-mu v2k-why">${pkg().submitted ? "Submitted already" : !ok1 && !ok2 ? "Waits on SSP 3 and the increment 2 results" : !ok1 ? "Waits on SSP 3's approval" : "Waits on the increment 2 results"}</span><button type="button" class="btn" data-close-modal>Close</button><button type="button" class="btn ink" aria-disabled="true" data-v2-wired title="${pkg().submitted ? "Submitted already" : "Submit waits on the items above"}">Submit</button>` };
  };
  M["v2k-pkgdecide"] = () => {
    const p = pkg(), ao = p.step === 2;
    return { title: ao ? "Record the authorization decision" : "Record the ISSM review", body: ao
      ? `${desc(`${esc(AO)} decides on package version 2 and signs. Risk acceptances waiting on the AO are decided with it.`)}
        ${fld("Decision", radios("dec", [["ato", "ATO", "Authorization to operate"], ["atoc", "ATO with conditions", "Conditions carry over from version 1 unless changed"], ["dato", "Denial of authorization", "The system stops operating"]], ""), { req: true })}
        ${F("Authorization termination date", inp("atd", "", { type: "date", value: "2029-09-17" }), { req: true })}
        ${F("Rationale", area("note", "Why the residual risk is acceptable, or why it is not"), { req: true })}`
      : `${desc(`${esc(ISSM)} reviews package version 2 before it goes to the authorizing official.`)}
        ${fld("Review", radios("dec", [["approve", "Approve", "Passes it to the authorization decision"], ["return", "Send back", "Returns it to the ISSO"]], ""), { req: true })}
        ${F("Comment", area("note", "Required when sending back"))}`, footer: foot("Record decision", "pkgdecide", "") };
  };

  // ════════════════ What each dialog does ════════════════
  const riskById = (rid) => risks().find((r) => r.id === rid) || (lookup().risk ? lookup().risk(rid) : null);
  const ACTIONS = {
    map(code, o) { code = code || o.ctl; const r = REQ_OPTS.find((x) => x[0] === o.req); put(code, { req: o.req, reqTitle: r ? r[1] : o.req, rel: o.rel, mapNote: o.note, mapAt: TODAY_ISO }); return [`${o.req} maps ${code}: ${base(code).ob} of ${base(code).ob} objectives mapped`, { label: `Open ${code}`, route: ctlRoute(code) }]; },
    link(code, o) { put(code, { ev: o.ev, evTitle: evTitle(o.ev), evNote: o.note, evAt: TODAY_ISO }); return [`Evidence linked to ${st(code).req}: ${code} now waits on an assessor`, { label: `Open ${code}`, route: ctlRoute(code) }]; },
    addcamp(code, o) { const c = camp(o.camp); put(code, { camp: o.camp, campAt: TODAY_ISO }); return [`${base(code).ob} objectives of ${code} added to ${c.title}`, { label: "Open campaign", route: c.route }]; },
    plan(code, o) {
      const n = seq("camp"), id = "new" + n;
      push("camps", { id, n, title: o.title, ssp: "SSP 2, published Jul 25", from: o.from, to: o.to, ctl: code || null });
      if (code) put(code, { camp: id, campAt: TODAY_ISO });
      return [code ? `${base(code).ob} objectives of ${code} planned in ${o.title}` : `${o.title} planned`, { label: "Open campaign", route: "campaign-new-" + n }];
    },
    ready(code, o) { put(code, { ready: true, readyNote: o.note, readyAt: TODAY_ISO }); return [`The request for ${code} is Ready for the assessor`, null]; },
    det(code, o) {
      if (o.det !== "satisfied" && !o.note) return "Rationale is required short of satisfied.";
      put(code, { det: o.det, detNote: o.note, detBy: o.by, detAt: TODAY_ISO }); return [`${ST[o.det][1]} recorded for ${code} in the draft results; it decides nothing until published`, null];
    },
    publish(cid, o) {
      const d = draftDets(cid); if (!d.length) return "The draft results hold no determination yet.";
      V.set("chain.results." + cid, { title: o.title, at: TODAY_ISO, by: "D. Okafor", n: d.length });
      let opened = 0;
      d.forEach((x) => {
        put(x.code, { published: true, pubAt: TODAY_ISO });
        if (x.s.det !== "satisfied" && !issues().some((i) => i.ctl === x.code)) {
          opened++;
          push("issues", { id: "v2k-iss-" + x.code.toLowerCase().replace(/[^a-z0-9]+/g, "-"), ctl: x.code, sev: sevFromDet(x.s.det), opened: TODAY_ISO, camp: cid, title: `${x.code} ${x.title} judged ${ST[x.s.det][1].toLowerCase()} (${camp(cid).short})` });
        }
      });
      return [`${o.title} published: ${d.length} determination${d.length === 1 ? "" : "s"}${opened ? `, ${opened} operational issue${opened === 1 ? "" : "s"} opened` : ""}`, opened ? { label: "Open the issue", go: ["findings", { open: { kind: "a-risk-issue", id: issues()[issues().length - 1].id } }] } : { label: "Open Controls", route: "controls" }];
    },
    inc2(_, o) { V.set("chain.inc2", { title: o.title, at: TODAY_ISO, by: "D. Okafor" }); return ["Increment 2 published: 20 determinations now decide WS-X90's control statuses", { label: "Open Controls", route: "controls" }]; },
    poam(iid, o) {
      const n = seq("poam"), id = "v2k-poam-" + n;
      push("poams", { id, title: o.title, issue: iid, owner: o.owner || "", planned: o.planned, plan: o.plan, created: TODAY_ISO });
      return [`POA&M item created: ${o.title}`, { label: "Open POA&M item", go: ["poam", { open: { kind: "a-risk-poam", id: id + "|overview" } }] }];
    },
    risk(iid, o) {
      const n = seq("risk"), id = "v2k-risk-" + n, p = poams().find((x) => x.issue === iid);
      push("risks", { id, title: o.title, issue: iid, poam: p ? p.id : null, lik: o.lik, imp: o.imp, sev: SEV(o.lik, o.imp), owner: o.owner || "", threat: o.threat, created: TODAY_ISO });
      return [`Risk created: ${o.title}`, { label: "Open risk", go: ["risks", { open: { kind: "a-risk-risk", id: id + "|overview" } }] }];
    },
    accept(rid, o) { V.set("chain.acc." + rid, { step: 1, state: "requested", reason: o.reason, until: o.until, log: [[ME, `requested acceptance: ${o.reason}`, TODAY_ISO]] }); return [`Acceptance requested: step 1 waits on ${ISSO}`, { label: "Open Authorization", route: "authorization" }]; },
    decide(rid, o) {
      const a = acc(rid); if (!a) return "Request acceptance first.";
      if (o.dec === "return" && !o.note) return "Comment is required when sending back.";
      const [n, , who] = STEPS[a.step - 1];
      const log = [...(a.log || []), [who, o.dec === "return" ? `sent it back: ${o.note}` : n === 3 ? `accepted the risk until ${mdy(a.until)}${o.note ? ": " + o.note : ""}` : `approved step ${n}${o.note ? ": " + o.note : ""}`, TODAY_ISO]];
      const next = o.dec === "return" ? { ...a, state: "returned", log } : n === 3 ? { ...a, state: "accepted", at: TODAY_ISO, log } : { ...a, step: n + 1, log };
      V.set("chain.acc." + rid, next);
      return [o.dec === "return" ? `Sent back by ${who}` : n === 3 ? `${AO} accepted the risk; package version 2 records it` : `Step ${n} approved; step ${n + 1} waits on ${STEPS[n][2]}`, { label: "Open Authorization", route: "authorization" }];
    },
    submit(_, o) { V.set("chain.pkg", { submitted: true, step: 1, at: TODAY_ISO, note: o.note }); return [`Package version 2 submitted: ${ISSM} reviews first`, null]; },
    pkgdecide(_, o) {
      const p = pkg();
      if (p.step === 2) { V.set("chain.pkg", { ...p, step: 3, decision: o.dec, atd: o.atd, note: o.note, at: TODAY_ISO }); return [`${AO} signed ${{ ato: "ATO", atoc: "ATO with conditions", dato: "Denial of authorization" }[o.dec]} on package version 2`, null]; }
      if (o.dec === "return") { if (!o.note) return "Comment is required when sending back."; V.set("chain.pkg", { ...p, submitted: false, step: 0, returned: o.note }); return ["Package version 2 sent back to the ISSO", null]; }
      V.set("chain.pkg", { ...p, step: 2 }); return [`ISSM review approved: the decision waits on ${AO}`, null];
    },
  };
  // A wired primary: check, act, close, draw every screen again, say what changed and where it shows.
  document.addEventListener("click", (e) => {
    const b = e.target && e.target.closest ? e.target.closest("#modal [data-v2k]") : null;
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (b.getAttribute("aria-disabled") === "true") return;
    const dlg = b.closest(".dlg"); if (!check(dlg)) return;
    const fn = ACTIONS[b.dataset.v2k]; if (!fn) return;
    const out = fn(b.dataset.id || "", vals(dlg));
    if (typeof out === "string") { // a check only the action can make (a rationale short of satisfied)
      dlg.querySelectorAll(".v2k-err").forEach((x) => x.remove());
      const f = [...dlg.querySelectorAll(".v2k-f")].find((x) => out.startsWith(labelOf(x))) || dlg.querySelector(".v2k-f:last-of-type");
      if (f) { f.insertAdjacentHTML("beforeend", `<span class="v2k-err" role="alert">${esc(out)}</span>`); const c = f.querySelector("textarea, input, select"); if (c) { c.setAttribute("aria-invalid", "true"); c.focus(); } }
      return;
    }
    closeDlg();
    setTimeout(() => { V.redraw(); if (out && out[0]) V.toast(out[0], out[1] || undefined); }, 0);
  }, true);

  // ════════════════ The dialog guard: every other dialog changes something or says it does not [B1 B10] ════════════════
  // A primary is wired when it carries data-v2-wired, or a module's own action (anything but a toast) that changes the page.
  const TOAST_ONLY = /^data-(close-modal|prim|id|v7o-toast|v7p-toast|adtoast|aptoast|risk-toast|v8b-toast|v2k-.*|v2r-.*)$/;
  const NOT_WIRED = /^(Run an agent|Replace Figure \d+|New plan)$/;
  const CLOSERS = /^(cancel|close|back|keep editing|discard|previous|copy link)$/i;
  const titleOf = (dlg) => { const t = dlg.querySelector("#dlgTitle, .dlg-h h4"); return t ? t.textContent.trim() : "This dialog"; };
  const isPrimary = (b) => !!b.closest(".dlg-f") && !CLOSERS.test((b.textContent || "").trim()) && !b.matches(".dlg-h *");
  const wired = (b, dlg) => b.hasAttribute("data-v2-wired") || dlg.hasAttribute("data-v2-wired") || (!NOT_WIRED.test(titleOf(dlg)) && [...b.attributes].some((a) => a.name.startsWith("data-") && !TOAST_ONLY.test(a.name)));
  window.addEventListener("click", (e) => {
    const b = e.target && e.target.closest ? e.target.closest("#modal .dlg-f button, #modal .dlg-f .btn, #modal .dlg-f [role=button]") : null;
    if (!b || !isPrimary(b)) return;
    const dlg = b.closest(".dlg"); if (!dlg) return;
    if (b.hasAttribute("data-v2-wired") || dlg.hasAttribute("data-v2-wired")) return; // C1's and C2's own: they check and act themselves
    if (b.getAttribute("aria-disabled") === "true" || b.disabled) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (!check(dlg)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (wired(b, dlg)) return; // a module's own wiring changes the page
    e.preventDefault(); e.stopImmediatePropagation();
    const t = titleOf(dlg);
    closeDlg();
    setTimeout(() => V.toast(`Not saved: ${t} isn't wired in this prototype`), 0);
  }, true);
  // A verb outside a dialog in C1's screens that only toasted a success ("Exporting 368 artifacts", "Downloading version 1") says
  // instead that it is not wired; a toast that already says so ("prototype", "an example", "There is no…") stays [B1].
  const HONEST = /prototype|example|^there is no|^no |^every waiting/i;
  window.addEventListener("click", (e) => {
    const t = e.target && e.target.closest ? e.target.closest("[data-adtoast], [data-v7p-toast]") : null;
    if (!t || t.closest("#modal") || t.hasAttribute("data-v2-wired")) return;
    if (t.matches("[data-go], [data-modal], [data-panel], [data-v7p-own], [data-v7p-wireset], [data-adcontinue]")) return;
    const attr = t.hasAttribute("data-adtoast") ? "data-adtoast" : "data-v7p-toast", msg = t.getAttribute(attr) || "";
    if (HONEST.test(msg)) return;
    // The module's own handler still runs (it closes its menu) but finds no toast to show while the event passes.
    t.removeAttribute(attr); setTimeout(() => t.setAttribute(attr, msg), 0);
    const label = (t.getAttribute("aria-label") || t.textContent || "This action").replace(/\s+/g, " ").trim().slice(0, 60);
    setTimeout(() => V.toast(`Not saved: ${label} isn't wired in this prototype`), 0);
  }, true);
  // Required fields drawn as text become real inputs as the dialog opens: a text box, a choice, a file.
  const PH = /^(choose|search|select|pick|add|name|what|who|why|how|the |e\.g\.|no owner|unassigned|none|drop|upload|attach)/i;
  function prepare(dlg) {
    if (!dlg || dlg.dataset.v2kPrepared) return;
    dlg.dataset.v2kPrepared = "1";
    if (dlg.hasAttribute("data-v2-wired") || dlg.querySelector(".dlg-f [data-v2-wired]")) return;
    dlg.querySelectorAll(".req").forEach((r) => {
      if (!/required/i.test(r.textContent)) return;
      const lbl = r.closest("label, .v8w-lbl, .v8g-lbl, .pn-label, .k") || r.parentElement;
      const f = lbl.closest(".ak-field, .v8w-field, .v8g-field, .pn-field, .ak-rc, .ak-stepcard") || lbl.parentElement;
      if (!f || f.closest(".dlg-f") || f.dataset.v2kDone) return;
      f.dataset.v2kDone = "1";
      f.setAttribute("data-v2k-req", "");
      if (f.querySelector("input, textarea, select")) return; // a real control already
      const name = (lbl.textContent || "").replace(/\s*Required\s*/i, "").replace(/\s+/g, " ").trim() || "Value";
      const fake = f.querySelector(".ak-input, .ak-select, .ak-drop, .v8g-drop, .a-risk-ro, [class*='-input'], [class*='-select']");
      const id = "v2k-g-" + ++fid;
      if (!fake) { lbl.insertAdjacentHTML("afterend", `<input class="v2k-in" id="${id}" type="text" name="g${fid}" aria-label="${esc(name)}" autocomplete="off">`); return; }
      const text = (fake.textContent || "").replace(/\s+/g, " ").trim();
      if (fake.matches(".ak-drop, .v8g-drop, [class*='drop']")) {
        if ((/\.(ckl|cklb|pdf|png|jpe?g|svg|xml|json|csv|nessus|xlsx?|docx?|spdx|cdx)/i.test(text) || /\bchosen\b/i.test(text)) && !/^(drop|upload|attach|choose)/i.test(text)) return; // a file already chosen
        fake.outerHTML = `<label class="ak-drop v2k-file" for="${id}">${AK.i("upload")}<span class="v2k-fname">${esc(text || "Choose a file")}</span><input id="${id}" class="v2k-sr" type="file" name="g${fid}" aria-label="${esc(name)}"></label>`;
        return;
      }
      if (fake.matches(".ak-select, [class*='-select']") && text && !PH.test(text)) return; // a value already chosen
      const tall = fake.classList.contains("tall");
      fake.outerHTML = tall ? `<textarea class="v2k-in tall" id="${id}" name="g${fid}" placeholder="${esc(text)}" aria-label="${esc(name)}"></textarea>` : `<input class="v2k-in" id="${id}" type="text" name="g${fid}" placeholder="${esc(text)}" aria-label="${esc(name)}" autocomplete="off">`;
      if (lbl.tagName === "LABEL") lbl.setAttribute("for", id);
    });
  }
  document.addEventListener("change", (e) => {
    const f = e.target && e.target.closest ? e.target.closest(".v2k-file") : null;
    if (f && e.target.files && e.target.files[0]) f.querySelector(".v2k-fname").textContent = e.target.files[0].name;
    const fld2 = e.target && e.target.closest ? e.target.closest("[data-v2k-req]") : null;
    if (fld2 && valueOf(fld2)) { fld2.querySelectorAll(".v2k-err").forEach((x) => x.remove()); const c = fld2.querySelector("[aria-invalid]"); if (c) c.removeAttribute("aria-invalid"); }
  });
  document.addEventListener("input", (e) => {
    const fld2 = e.target && e.target.closest ? e.target.closest("[data-v2k-req]") : null;
    if (fld2 && valueOf(fld2)) { fld2.querySelectorAll(".v2k-err").forEach((x) => x.remove()); const c = fld2.querySelector("[aria-invalid]"); if (c) c.removeAttribute("aria-invalid"); }
  });
  const modalEl = document.getElementById("modal");
  if (modalEl && window.MutationObserver) new MutationObserver(() => { const d = modalEl.querySelector(".dlg"); if (d && !modalEl.hidden) prepare(d); }).observe(modalEl, { childList: true, subtree: false, attributes: true, attributeFilter: ["hidden"] });

  // ════════════════ The control preview: the control's standing, then its linked records, each with its add [A18 B4 B17] ════════════════
  const card = (title, count, add, body) => `<div class="ak-card v2k-lk"><div class="v2k-lkh"><b>${esc(title)}</b>${count != null ? `<span class="num v2k-mu">${count}</span>` : ""}${add ? `<span class="v2k-push">${add}</span>` : ""}</div>${body}</div>`;
  const addBtn = (label, attrs) => `<span class="ak-link v2k-add" role="button" tabindex="0" ${attrs}>+ ${esc(label)}</span>`;
  const line = (lead, text, end = "", attrs = "") => `<div class="v2k-li"${attrs ? " " + attrs : ""}>${lead}<span class="x">${text}</span>${end ? `<span class="e">${end}</span>` : ""}</div>`;
  const none = (t) => `<p class="v2k-none">${esc(t)}</p>`;
  const stepBtn = (c, ink = true) => !c.step ? "" : c.step.modal ? `<span class="btn sm${ink ? " ink" : ""}" role="button" tabindex="0" data-modal="${c.step.modal}" data-id="${esc(c.step.id || c.code)}">${esc(c.step.label)}</span>` : `<span class="btn sm${ink ? " ink" : ""}" ${goAttr(c.step.route, c.step.q)}>${esc(c.step.label)}</span>`;
  // Requirements, evidence, findings and risks of a control: the walk's, then what WS-X90's records hold for it.
  // WS-X90's own mappings of a control: the SSP's list, else the requirement the Controls register shows for it.
  const baseReqsOf = (code) => {
    const b = base(code), l = (SSP.requirements && SSP.requirements[code]) || [];
    if (l.length) return l;
    const r = PA.ctlReq ? PA.ctlReq(code) : null;
    return r && b.r ? [[r, `${code}'s requirement`, b.e ? `Evidence for ${r}` : null]] : [];
  };
  function links(code) {
    const c = v(code), b = base(code);
    const baseReqs = baseReqsOf(code);
    // v2 (F): a requirement mapped to the control from the requirement's own Map control (PA.v2reqs) is listed here too.
    const xReqs = PA.v2reqs ? PA.v2reqs.mappedTo(code).filter((k) => k !== c.s.req && !baseReqs.some((x) => x[0] === k)).map((k) => [k, PA.v2reqs.title(k), null, true]) : [];
    const reqs = [...(c.s.req ? [[c.s.req, c.s.reqTitle, c.s.evTitle || null, true]] : []), ...xReqs, ...baseReqs.map(([k, t, e]) => [k, t, e, false])];
    const reqRow = (r) => line(tag(r[0]), esc(r[1] || ""), r[3] ? "Mapped today" : "", `data-panel="v7p-req" data-id="${esc(r[0])}" role="link" tabindex="0"`);
    const evs = [...(c.s.ev ? [[c.s.evTitle, c.s.evReq || c.s.req, "Version 1 · pending review"]] : []), ...baseReqs.filter((r) => r[2]).map(([k, , e]) => [e, k, "Accepted"])];
    const fnd = [];
    if (c.det) fnd.push(line(stPill(c.det), esc((results(c.camp.id) || {}).title || c.camp.short), md(c.s.pubAt), goAttr("findings-assessment", { rows: [code] })));
    if (c.issue) fnd.push(line(gl(c.issue.sev === "high" || c.issue.sev === "critical" ? "diamond" : "clock"), esc(c.issue.title), "Operational issue", `data-panel="a-risk-issue" data-id="${esc(c.issue.id)}" role="link" tabindex="0"`));
    if (c.poam) fnd.push(line(gl("clock"), esc(c.poam.title), "POA&amp;M item", `data-panel="a-risk-poam" data-id="${esc(c.poam.id)}|overview" role="link" tabindex="0"`));
    // Findings and the risks they carry share one card, so a preview keeps three cards [panel budget].
    if (c.risk) fnd.push(line(h.sevPill(c.risk.sev), esc(c.risk.title), `Risk · ${esc(accWords(acc(c.risk.id)))}`, `data-panel="a-risk-risk" data-id="${esc(c.risk.id)}|overview" role="link" tabindex="0"`));
    const fndAdd = c.issue && !c.poam ? addBtn("Create POA&M item", `data-modal="v2k-poam" data-id="${esc(c.issue.id)}"`) : c.poam && !c.risk ? addBtn("Create risk", `data-modal="v2k-risk" data-id="${esc(c.issue.id)}"`) : "";
    return {
      reqs: card("Requirements", reqs.length, c.status === "no_requirement" || !reqs.length ? addBtn("Map a requirement", `data-modal="v2k-map" data-id="${esc(code)}"`) : "", reqs.length ? reqs.map(reqRow).join("") : none(`No requirement maps ${code} yet.`)),
      evs: card("Evidence", evs.length, reqs.length && !c.s.ev && c.status === "no_evidence" ? addBtn("Link evidence", `data-modal="v2k-link" data-id="${esc(code)}"`) : "", evs.length ? evs.map(([t, k, s]) => line(gl(s === "Accepted" ? "check" : "clock"), `${esc(t || "")}<span class="v2k-sub">Cited by ${esc(k || "")} · ${esc(s)}</span>`)).join("") : none(reqs.length ? `${reqs[0][0]} cites no evidence yet.` : "Evidence comes through a requirement that maps the control.")),
      fnd: card("Findings and risks", fnd.length, fndAdd, fnd.length ? fnd.join("") : none(c.camp ? `${c.camp.short}'s plan holds ${code}; nobody has judged it yet.` : `No assessment has judged ${code} yet; a risk rests on an issue its findings open.`)),
      risks: "",
    };
  }
  const objLine = (c) => `${fmt(c.om)} of ${fmt(c.ob)} mapped · ${fmt(c.oe)} with evidence · ${fmt(c.oa)} assessed`;
  P["a-tests-control"] = (id) => {
    const [code0] = String(id || "").split("|");
    const code = code0 || "SA-24", c = v(code);
    const l = links(code);
    const head = AK.recordHead({ title: `${code} ${c.title}`, actions: stepBtn(c, false) });
    const facts = `<dl class="ak-kv v2k-kv"><dt>Status</dt><dd>${stPill(c.status)}</dd><dt>Objectives</dt><dd class="num">${objLine(c)}</dd><dt>Determined by</dt><dd>${c.db ? esc(c.db) : '<span class="v2-dash" aria-label="None">—</span>'}</dd><dt>Campaign</dt><dd>${c.camp ? `<span class="ak-link" ${goAttr(c.camp.route)}>${esc(c.camp.short)}</span>` : '<span class="v2-dash" aria-label="None">—</span>'}</dd></dl>`;
    return { label: "Control preview", body: `<div class="a-tests-pan v2k-pan" data-v2r-full="${esc(ctlRoute(code))}">${head}${facts}${l.reqs}${l.evs}${l.fnd}</div>` };
  };

  // ════════════════ Campaign pages: the continuous monitoring campaign, and each one Plan an assessment made [B11] ════════════════
  const REQ_ST = (vw) => vw.s.det ? (vw.s.published ? ["ok", "Accepted"] : ["none", "Judged · draft"]) : vw.s.ready ? ["none", "Ready"] : ["none", "Not ready"];
  function campaignPage(cid) {
    const c = camp(cid); if (!c) return h.page(AK.recordHead({ crumbs: [["Assessments", "assessments"], ["Not found"]], title: "This campaign is not planned in this session" }), AK.empty({ title: "Nothing here yet", line: "A campaign Plan an assessment makes is kept for the tab's session. Plan one from Assessments or from a control's page." }));
    const rq = requests(cid), d = draftDets(cid), pub = results(cid);
    const tab = V.get("chain.tab." + cid, "requests");
    const baseObj = (BASE_PLAN[cid] || []).map((code) => [code, base(code).ob, "Plan 1 · held since Oct 1"]);
    const objRows = [...baseObj, ...rq.filter((x) => !(BASE_PLAN[cid] || []).includes(x.code)).map((x) => [x.code, x.ob, `Added ${md(x.s.campAt)}`])];
    const nObj = objRows.reduce((a, r) => a + r[1], 0);
    const head = AK.recordHead({ crumbs: [["Assessments", "assessments"], [c.short]], title: c.title,
      actions: `<span class="btn${d.length ? " ink" : ""}" role="button" tabindex="0" ${d.length ? `data-modal="v2k-publish" data-id="${esc(cid)}"` : 'aria-disabled="true" title="The draft results hold no determination yet"'}>Publish assessment results</span>`,
      facts: [["Status", pill("none", c.kind ? "Planned" : "Active")], ["Kind", c.kind || "Control assessment"], ["Window", `<span class="num">${md(c.from)} – ${mdy(c.to)}</span>`], ["Plan", esc(c.plan)], ["Lead assessor", AK.owner(c.lead)], ["Owner", AK.owner(c.owner)]] });
    const tabs = AK.tabs([["Requests", rq.length, null, tab === "requests"], ["Objectives", nObj, null, tab === "objectives"], ["Results", pub ? 1 : d.length ? 1 : 0, null, tab === "results"]].map(([l, n, , on]) => [l, n, null, on]), "Campaign sections").replace(/<span role="tab"([^>]*)>(Requests|Objectives|Results)/g, (m, a, l) => `<span role="tab"${a} tabindex="0" data-v2k-tab="${cid}|${l.toLowerCase()}">${l}`);
    let body;
    if (tab === "objectives") body = `<div class="frame"><div class="tablebox"><table><thead><tr><th>Control</th><th>Objectives</th><th>In the plan</th></tr></thead><tbody>${objRows.map(([code, n, s]) => `<tr tabindex="0" data-panel="a-tests-control" data-id="${esc(code)}"><td class="nm">${esc(code)} ${esc(base(code).t)}</td><td class="num">${n}</td><td>${esc(s)}</td></tr>`).join("")}</tbody></table></div><div class="pager"><span class="num">1–${objRows.length} of ${objRows.length}</span></div></div>`;
    else if (tab === "results") body = pub || d.length ? `<div class="ak-card v2k-res">${line(AK.i(pub ? "task" : "pen"), `<b>${esc(pub ? pub.title : `${c.short} results — draft`)}</b><span class="v2k-sub">${pub ? `Published ${md(pub.at)} by ${esc(pub.by)} · ${pub.n} determination${pub.n === 1 ? "" : "s"}` : `Draft · ${d.length} determination${d.length === 1 ? "" : "s"} · decides nothing until published`}</span>`)}</div>` : AK.empty({ title: "No results yet", line: "Results join the campaign once the assessor records a determination." });
    else body = rq.length ? `<div class="frame"><div class="tablebox"><table><thead><tr><th>Request</th><th>Control</th><th>Evidence</th><th>Status</th><th>Determination</th><th aria-label="Actions"></th></tr></thead><tbody>${rq.map((x) => { const [tn, tw] = REQ_ST(x); const act = !x.s.ready ? `<span class="btn sm" role="button" tabindex="0" data-modal="v2k-ready" data-id="${esc(x.code)}">Set Ready</span>` : !x.s.det ? `<span class="btn sm" role="button" tabindex="0" data-modal="v2k-det" data-id="${esc(x.code)}">Record determination</span>` : ""; return `<tr tabindex="0" data-panel="a-tests-control" data-id="${esc(x.code)}"><td class="nm">Evidence for ${esc(x.code)} ${esc(x.title)}</td><td>${tag(x.code)}</td><td>${esc(x.s.evTitle || "—")}</td><td>${pill(tn, tw)}</td><td>${x.s.det ? esc(ST[x.s.det][1]) : '<span class="v2-dash" aria-label="None">—</span>'}</td><td class="v2k-act">${act}</td></tr>`; }).join("")}</tbody></table></div><div class="pager"><span class="num">1–${rq.length} of ${rq.length}</span></div></div>`
      : AK.empty({ title: "No requests yet", line: `The draft plan holds ${nObj} objectives. A control added from its own page sends a request for its evidence here.` });
    return h.page(head.replace(/<\/div>\s*$/, `${tabs}</div>`), body);
  }
  document.addEventListener("click", (e) => { const t = e.target && e.target.closest ? e.target.closest("[data-v2k-tab]") : null; if (!t) return; e.preventDefault(); e.stopPropagation(); const [cid, tb] = t.dataset.v2kTab.split("|"); V.set("chain.tab." + cid, tb); V.redraw(); const again = document.querySelector(`[data-v2k-tab="${CSS.escape(t.dataset.v2kTab)}"]`); if (again) again.focus(); }, true);
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target && e.target.matches && e.target.matches("[data-v2k-tab]")) { e.preventDefault(); e.target.click(); } }, true);
  V.screen("campaign-conmon", () => campaignPage("conmon"), "assessments");
  // A campaign Plan an assessment made is drawn on first visit (its address works after a reload in the same tab).
  const ensureCamp = () => { const r = V.cur(); const m = /^campaign-new-(\d+)$/.exec(r); if (m && !S[r]) V.screen(r, () => campaignPage("new" + m[1]), "assessments"); };
  window.addEventListener("hashchange", ensureCamp); ensureCamp();
  list("camps").forEach((c) => { if (!S["campaign-new-" + c.n]) V.screen("campaign-new-" + c.n, () => campaignPage(c.id), "assessments"); });
  V.on((path) => { if (String(path).startsWith("chain.camps")) list("camps").forEach((c) => { if (!S["campaign-new-" + c.n]) V.screen("campaign-new-" + c.n, () => campaignPage(c.id), "assessments"); }); });

  // ════════════════ Every screen reads the chain again after a change ════════════════
  V.on((path) => { if (path === "*") { /* reset: the screens read the empty state */ } });

  PA.v2.chain = { view, counts, issues, poams, risks, afs, acc, accWords, accPill, requests, draftDets, camps, camp, campOf, inPlan, inc2, pkg, ssp3, results, stPill, ST, links, baseReqsOf, ctlRoute, recRoute, goAttr, touched, STEPS, AO, ISSM, ISSO, sevOf: SEV, TODAY_ISO, md, mdy, objLine,
    // v2 (F): later modules add wired dialogs through the same primary handler (data-v2k="<action>" looks up ACTIONS) and fields.
    ACTIONS, put, st, push, list, seq, base, plus, ME, REQ_OPTS, EV_OPTS, evTitle, riskById,
    ui: { F, fld, inp, area, choose, radios, ro, desc, foot, check, vals, closeDlg, peopleOpts, LEVELS, PEOPLE, EX } };
})();
