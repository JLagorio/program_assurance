// Prototype v2, agent F (v2f-): a requirement's chain is a component of its preview on the Requirements page, not a page of its own.
// Josef, 19 Nov: "The requirements chains should show on the requirements page as a component, probably not its own record."
// - P["v7p-req"]: the statement, then one Chain card: Controls mapped, Allocated to, Evidence, Findings, Risks, Remediation, each
//   stage with its count and each record opening its own preview (a control, an element, an artifact, an operational issue, a risk,
//   a POA&M item). Map control and Link evidence stay in the preview's header, and are wired.
// - No ↗ on a requirement's preview (mod-zzzz-v2-1records.js lists v7p-req among the kinds with no page). The old page's address,
//   rec--v7p-req--<id>, opens the Requirements page with that requirement's preview open.
// - One source: what a reader maps or links here counts on the register (mod-v7-program.js reads PA.v2reqs), on each control's
//   preview and page (mod-zzzz-v2-1chain.js, -1records.js), on Traceability, and moves the control's walk (chain.ctl.<code>).
// State (PA.v2.state): reqx.map [{ req, ctl, rel, note, at }] controls mapped from a requirement; reqx.ev [{ req, ev, title, note, at }].
// API, window.PA.v2reqs: info, mappings, evidence, follow, mappedTo(ctl), mappedAt(req, ctl), title, row(r), gainedEvidence(),
//   gained(code), open(code) (the Requirements page with the requirement's preview open).
(function () {
  const PA = window.PA, V = PA && PA.v2;
  if (!V || !PA.AK || !PA.v7p || !V.chain || !V.chain.ui) return;
  const { S, P, M, h } = PA;
  const AK = PA.AK, SSP = PA.SSP, CH = V.chain, U = CH.ui, R7 = PA.v7p;
  const { esc, fmt, pill, tag, sevPill } = h;
  const TODAY_ISO = CH.TODAY_ISO, md = CH.md;
  const DETS = new Set(["satisfied", "partially_satisfied", "other_than_satisfied"]);
  const rw = (html) => (PA.canon ? PA.canon.rewrite(html) : html);
  let fid = 0;

  // ════════════════ What a requirement is, and what the session added to it ════════════════
  // The register's rows (mod-v7-program.js), and the three drafts Map a requirement offers on a control (REQ-641…643).
  const OPT_ELS = { "REQ-641": ["CN-109000"], "REQ-642": ["CN-109000"], "REQ-643": ["CN-109101"] };
  const rowOf = (code) => R7.REQS.find((r) => r[0] === code) || null;
  const optOf = (code) => (CH.REQ_OPTS || []).find((r) => r[0] === code) || null;
  function info(code) {
    const r = rowOf(code);
    if (r) return { code, title: r[1], statement: r[2], els: r[3], ctls: r[4], ev: r[5], review: !!r[6] };
    const o = optOf(code);
    if (o) return { code, title: o[1], statement: null, note: o[2], els: OPT_ELS[code] || ["CN-109000"], ctls: [], ev: [], review: false };
    return null;
  }
  const title = (code) => { const i = info(code); return i ? i.title : code; };
  const maps = () => V.get("reqx.map", null) || [];
  const evs = () => V.get("reqx.ev", null) || [];

  // Controls it maps: its own, those a control's walk mapped to it (Map a requirement), those mapped here (Map control).
  function mappings(code) {
    const i = info(code), out = new Map();
    (i ? i.ctls : []).forEach((c) => out.set(c, { ctl: c, base: true }));
    CH.touched().forEach((c) => { const s = CH.st(c); if (s.req === code && !out.has(c)) out.set(c, { ctl: c, base: false, at: s.mapAt }); });
    maps().filter((m) => m.req === code).forEach((m) => { if (!out.has(m.ctl)) out.set(m.ctl, { ctl: m.ctl, base: false, at: m.at }); });
    return [...out.values()];
  }
  const mappedTo = (ctl) => [...new Set(maps().filter((m) => m.ctl === ctl).map((m) => m.req))];
  const mappedAt = (req, ctl) => { const m = maps().find((x) => x.req === req && x.ctl === ctl); return m ? m.at : TODAY_ISO; };

  // Evidence it cites: its own (with the register's review where the register lists it), then what was linked in the session.
  const EVST = { pending: "Pending review", needs_revision: "Needs revision", accepted: "Accepted" };
  const reg = (t) => (PA.evLookup ? PA.evLookup.byTitle(t) : null);
  function evidence(code) {
    const i = info(code), out = [];
    (i ? i.ev : []).forEach((t) => { const e = reg(t); out.push({ title: t, state: e ? EVST[e.state] || "Accepted" : "Accepted", id: e ? e.id : null, base: true }); });
    CH.touched().forEach((c) => { const s = CH.st(c); if (s.ev && s.evTitle && (s.evReq || s.req) === code && !out.some((x) => x.title === s.evTitle)) { const e = reg(s.evTitle); out.push({ title: s.evTitle, state: "Pending review", at: s.evAt, id: e ? e.id : null }); } });
    evs().filter((x) => x.req === code).forEach((x) => { if (!out.some((y) => y.title === x.title)) { const e = reg(x.title); out.push({ title: x.title, state: e ? EVST[e.state] || "Pending review" : "Pending review", at: x.at, id: e ? e.id : null, kind: x.kind }); } });
    return out;
  }
  const gained = (code) => { const i = info(code); return i && !i.ev.length ? evidence(code).length : 0; };
  // Requirements that cited no evidence and cite some now (the register's Cite no evidence and Traceability's No evidence count them).
  const gainedSet = () => { const s = new Set(); [...evs().map((x) => x.req), ...CH.touched().map((c) => CH.st(c)).filter((x) => x.ev).map((x) => x.evReq || x.req)].forEach((r) => { if (r && gained(r)) s.add(r); }); return s; };

  // What follows: the findings on the controls it maps, the operational issues, risks and POA&M items that rest on them.
  const TRx = (code) => (PA.v7aTR || []).find((r) => r.code === code) || null;
  const look = (kind, t) => (PA.riskLookup && PA.riskLookup.byTitle ? PA.riskLookup.byTitle(kind, t) : null);
  const REM = { in_progress: "In progress", completed: "Completed", planned: "Planned", open: "Open" };
  function follow(code) {
    const ctls = mappings(code).map((m) => m.ctl), tr = TRx(code), ev = evidence(code);
    const fnd = [], iss = [], rsk = [], rem = [], seen = new Set();
    ctls.forEach((c) => { // the session's walk first: a determination published on a mapped control and what it opened
      const v = CH.view(c);
      if (v.det) { seen.add(c); fnd.push({ ctl: c, title: v.title, det: v.det, today: true }); }
      if (v.issue && !iss.some((x) => x.id === v.issue.id)) iss.push({ id: v.issue.id, title: v.issue.title, sev: v.issue.sev, open: true, today: true });
      if (v.poam && !rem.some((x) => x.id === v.poam.id)) rem.push({ id: v.poam.id, title: v.poam.title, status: "Open", planned: v.poam.planned, today: true });
      if (v.risk && !rsk.some((x) => x.id === v.risk.id)) rsk.push({ id: v.risk.id, title: v.risk.title, sev: v.risk.sev, open: true, today: true });
    });
    if (tr) { // WS-X90's chain for it, as Traceability reads it
      tr.f.forEach(([t, d]) => { const c = String(t).split(" ")[0]; if (!seen.has(c)) { seen.add(c); fnd.push({ ctl: c, title: String(t).slice(c.length + 1), det: d }); } });
      tr.i.forEach(([t, s, st]) => { const x = look("issue", t); iss.push({ id: x ? x.id : null, title: x ? x.title : t, sev: s, open: st === "open" }); });
      tr.k.forEach(([t, s, st]) => { const x = look("risk", t); rsk.push({ id: x ? x.id : null, title: x ? x.title : t, sev: s, open: st === "open" }); });
      tr.rem.forEach(([t, s, due]) => { const x = look("poam", t); rem.push({ id: x ? x.id : null, title: x ? x.title : t, status: REM[s] || s, planned: due }); });
    } else if (ev.length) { // a finding cites evidence: once it cites some, each mapped control's determination is a finding on it
      ctls.forEach((c) => { const b = SSP.ctl(c); if (b && DETS.has(b.cs) && !seen.has(c)) { seen.add(c); fnd.push({ ctl: c, title: b.t, det: b.cs }); } });
    }
    iss.filter((i) => i.id && !i.today).forEach((i) => { // what the session created on one of WS-X90's issues
      CH.poams().filter((p) => p.issue === i.id || (p.also || []).includes(i.id)).forEach((p) => { if (!rem.some((x) => x.id === p.id)) rem.push({ id: p.id, title: p.title, status: "Open", planned: p.planned, today: true }); });
      CH.risks().filter((r) => r.issue === i.id).forEach((r) => { if (!rsk.some((x) => x.id === r.id)) rsk.push({ id: r.id, title: r.title, sev: r.sev, open: true, today: true }); });
    });
    return { fnd, iss, rsk, rem };
  }

  // A register row with the session's controls and evidence (Controls, Objectives, Evidence and the Cite no evidence view read it).
  function row(r) {
    const m = mappings(r[0]).map((x) => x.ctl), e = evidence(r[0]).map((x) => x.title);
    if (m.length === r[4].length && e.length === r[5].length) return r;
    const x = r.slice(); x[4] = m; x[5] = e; return x;
  }

  // ════════════════ The chain, drawn ════════════════
  const pv = (kind, id) => `data-panel="${esc(kind)}" data-id="${esc(id)}" role="link" tabindex="0"`;
  const li = (lead, text, end, attrs) => `<div class="v2f-li"${attrs ? " " + attrs : ""}>${lead ? `<span class="v2f-ld">${lead}</span>` : ""}<span class="x">${text}</span>${end ? `<span class="e">${end}</span>` : ""}</div>`;
  const none = (t) => `<p class="v2f-none">${t}</p>`;
  const stage = (name, n, body) => `<li class="v2f-st${n ? "" : " gap"}"><span class="v2f-dot" aria-hidden="true"></span><div class="v2f-sb"><div class="v2f-sh"><b>${esc(name)}</b><span class="num v2f-ct">${fmt(n)}</span></div>${body}</div></li>`;
  const today = (x, w = "today") => (x.today || x.at ? ` · ${w}` : "");
  function chainCard(code) {
    const i = info(code) || { els: [], ctls: [], ev: [], review: false };
    const m = mappings(code), ev = evidence(code), f = follow(code);
    const ctlL = m.map((x) => {
      const v = CH.view(x.ctl);
      const word = i.review && x.ctl === "SI-4(13)" ? "3 of 6 objectives" : (CH.ST[v.status] || [])[1] || "";
      return li(tag(x.ctl), esc(v.title), `${esc(word)}${x.base ? "" : " · mapped today"}`, pv("a-tests-control", x.ctl));
    });
    const elL = i.els.map((e) => { const el = R7.EBY[e], c = R7.COMP[e]; return li(tag(c ? c[0] : e), esc(el ? el.name : e), c ? esc(e) : "", pv("v7p-el", e)); });
    const evL = ev.map((x, k) => li("", esc(x.title), `${esc(x.state)}${x.at ? ` · linked ${esc(md(x.at))}` : ""}`, x.id ? pv("a-docs-ev", `${x.id}|evidence`) : pv("v2f-ev", `${code}|${k}`)));
    const fL = [
      ...f.fnd.map((x) => li(tag(x.ctl), esc(x.title), `${CH.stPill(x.det)}${today(x)}`, pv("a-tests-control", x.ctl))),
      ...f.iss.map((x) => li("", esc(x.title), `${sevPill(x.sev)}${x.open ? "" : " Closed"}${today(x)}`, x.id ? pv("a-risk-issue", x.id) : "")),
    ];
    const kL = f.rsk.map((x) => li("", esc(x.title), `${sevPill(x.sev)}${x.open ? "" : " Closed"}${today(x)}`, x.id ? pv("a-risk-risk", `${x.id}|overview`) : ""));
    const rL = f.rem.map((x) => li("", esc(x.title), `${esc(x.status)}${x.planned ? ` · ${esc(md(x.planned))}` : ""}${today(x)}`, x.id ? pv("a-risk-poam", `${x.id}|overview`) : ""));
    const openWork = f.iss.some((x) => x.open) || f.rsk.some((x) => x.open);
    const linkEv = `<span class="ak-link" role="button" tabindex="0" data-modal="v7p-link-ev" data-id="${esc(code)}">Link evidence</span>`;
    return `<div class="ak-card v2f-chain"><ol class="v2f-sts" aria-label="${esc(code)}'s chain">
      ${stage("Controls mapped", m.length, ctlL.length ? ctlL.join("") : none("No control mapped yet. Map control maps one on SYS-WSX90."))}
      ${stage("Allocated to", i.els.length, elL.length ? elL.join("") : none("Allocated to no element yet."))}
      ${stage("Evidence", ev.length, evL.length ? evL.join("") : none(`None cited, so no control it maps is covered with evidence. ${linkEv}`))}
      ${stage("Findings", fL.length, fL.length ? fL.join("") : none(ev.length ? "No assessment finding cites its evidence yet." : "A finding judges what evidence shows; it cites none yet."))}
      ${stage("Risks", kL.length, kL.length ? kL.join("") : none("No risk rests on it."))}
      ${stage("Remediation", rL.length, rL.length ? rL.join("") : none(openWork ? "Nothing planned yet." : "Nothing to remediate."))}
    </ol></div>`;
  }

  // ════════════════ The requirement's preview ════════════════
  const origReq = P["v7p-req"];
  const ptabs = (code, list, cur) => AK.tabs(list.map(([k, l, n]) => [l, n, `@v2f:${k}`, k === cur]), "Record sections").replace(/data-go="@v2f:([^"]+)"/g, (m0, k) => `data-panel="v7p-req" data-id="${esc(code + "|" + k)}"`);
  function events(code) {
    const out = [];
    maps().filter((x) => x.req === code).forEach((x) => out.push({ who: CH.ME, what: `mapped <b>${esc(x.ctl)}</b> to ${esc(code)}`, when: md(x.at) }));
    CH.touched().forEach((c) => { const s = CH.st(c); if (s.req === code && s.mapAt && !maps().some((x) => x.req === code && x.ctl === c)) out.push({ who: CH.ME, what: `mapped ${esc(code)} to <b>${esc(c)}</b>`, when: md(s.mapAt) }); });
    evs().filter((x) => x.req === code).forEach((x) => out.push({ who: CH.ME, what: `linked <b>${esc(x.title)}</b>`, when: md(x.at) }));
    return out;
  }
  P["v7p-req"] = (id) => {
    const [code, tab0] = String(id || "").split("|"), tab = tab0 || "overview";
    const i = info(code);
    if (!i) return origReq(id);
    const head = AK.recordHead({ title: `${i.code} ${i.title}`, actions: `<button type="button" class="btn sm" data-modal="v7p-link-ev" data-id="${esc(code)}">Link evidence</button><button type="button" class="btn sm ink" data-modal="v7p-map" data-id="${esc(code)}">Map control</button>` });
    const facts = AK.facts([["Owner", R7.ownerEdit(code)], ["State", pill("none", "Draft")], ["Version", "1"]]);
    const acts = [...(R7.acts ? R7.acts(code) : []), ...events(code)];
    let thread = "", nThread = 0;
    if (rowOf(code)) { const t = document.createElement("template"); t.innerHTML = origReq(code + "|comments").body; const cm = t.content.querySelector(".ak-cm"); if (cm) { thread = cm.outerHTML; nThread = cm.querySelectorAll(".ak-c").length; } }
    const strip = ptabs(code, [["overview", "Overview"], ["comments", "Comments", nThread], ["activity", "Activity", acts.length]], tab);
    let body;
    if (tab === "comments") body = thread || AK.comments({ items: [] });
    else if (tab === "activity") body = acts.length ? AK.activity(acts) : AK.empty({ title: "Nothing recorded yet", line: "Each mapping, allocation and evidence link joins this list with who and when." });
    else body = `${AK.section("Statement", i.statement ? `<p class="v7p-prose">${esc(i.statement)}</p>` : none(`Its statement is not in the prototype's data. ${esc(i.note || "Draft")}.`))}${AK.section("Chain", chainCard(code))}`;
    return { label: "Requirement preview", body: rw(`<div class="v7p-pan v7p-wide v2f-pan">${head}${facts}${strip}${body}</div>`) };
  };
  // An artifact the chain names that the evidence register's first pages do not list: what the prototype knows of it.
  P["v2f-ev"] = (id) => {
    const [code, k] = String(id || "").split("|"), e = evidence(code)[+k] || null;
    if (!e) return { label: "Evidence preview", body: AK.empty({ title: "Not in this requirement's chain", line: "It may have been unlinked; open the requirement again." }) };
    const head = AK.recordHead({ title: e.title });
    const facts = AK.facts([["Review", pill(e.state === "Accepted" ? "ok" : e.state === "Needs revision" ? "bad" : "none", e.state)], ["Version", "1"], ["Cited by", tag(code)], ["Linked", e.at ? esc(md(e.at)) : "Sep 12"]]);
    return { label: "Evidence preview", body: rw(`<div class="v7p-pan v2f-pan">${head}${facts}${AK.section("Cited by", li(tag(code), esc(title(code)), "", pv("v7p-req", code)))}${none("The evidence register's first page lists its newest artifacts; this one is known here by its title.")}</div>`) };
  };

  // ════════════════ Map control and Link evidence, wired (one action each, from the preview, the register's bar, Traceability) ════════════════
  const selHtml = (name, label, groups, opt = {}) => {
    const id = "v2f-" + name + "-" + ++fid;
    const o = (v, l) => `<option value="${esc(v)}">${esc(l)}</option>`;
    const html = `<select class="v2k-sel" id="${id}" name="${name}"><option value="">${esc(opt.ph || "Choose")}</option>${groups.filter((g) => g[1].length).map(([g, list]) => `<optgroup label="${esc(g)}">${list.map(([v, l]) => o(v, l)).join("")}</optgroup>`).join("")}</select>`;
    return U.fld(label, html, { req: true, id, hint: opt.hint || "" });
  };
  const allReqs = () => [...R7.REQS.map((r) => [r[0], r[1]]), ...(CH.REQ_OPTS || []).map((r) => [r[0], r[1]])];
  function controlChoice(exclude) {
    const all = (SSP.controls || []).filter((x) => !exclude.has(x.c));
    const none0 = all.filter((x) => CH.view(x.c).status === "no_requirement"), rest = all.filter((x) => CH.view(x.c).status !== "no_requirement");
    return selHtml("ctl", "Control", [[`No requirement maps it yet · ${none0.length}`, none0.map((x) => [x.c, `${x.c} ${x.t}`])], [`Mapped by other requirements · ${rest.length}`, rest.map((x) => [x.c, `${x.c} ${x.t}`])]], { ph: "Choose a control", hint: "From SYS-WSX90's control baseline: 560 controls." });
  }
  const objectives = `<div class="ak-field v2k-f"><label>Objectives</label>${U.radios("obj", [["whole", "Whole control", "Every objective the control counts"], ["some", "Chosen objectives", "Choose them on the control's page", true]], "whole")}</div>`;
  M["v7p-map"] = (id) => {
    const isReq = /^REQ-/.test(id || "");
    if (isReq || !id) {
      const code = isReq ? id : "";
      const mapped = new Set(code ? mappings(code).map((m) => m.ctl) : []);
      return { title: "Map control", body: `${U.desc(code ? `${esc(code)} maps the control on SYS-WSX90, the system it is allocated within. Its objectives then count as mapped, and as evidenced once it cites evidence.` : "Choose the requirement and the control it meets.")}
        ${code ? U.ro("Requirement", `${tag(code)} ${esc(title(code))}`) : selHtml("req", "Requirement", [["Requirements", allReqs()]], { ph: "Choose a requirement" })}
        ${U.ro("System", "SYS-WSX90 · WS-X90 Sentinel Mission System")}
        ${controlChoice(mapped)}
        ${U.F("Relationship", U.choose("rel", [["maps", "Maps to"], ["supports", "Supports"]], "maps"))}
        ${objectives}
        ${U.F("Rationale", U.area("note", "Why does this requirement meet the control?"))}`, footer: U.foot("Map control", "reqmap", code) };
    }
    // From a control (the objectives preview's Map a requirement): choose the requirement.
    const ctl = id, have = new Set([...(SSP.requirements && SSP.requirements[ctl] ? SSP.requirements[ctl].map((x) => x[0]) : []), ...R7.REQS.filter((r) => r[4].includes(ctl)).map((r) => r[0])]);
    const v0 = CH.view(ctl);
    return { title: "Map a requirement", body: `${U.desc(`${esc(ctl)} ${esc(v0.title)} counts ${v0.ob} assessment objectives. The requirement maps the whole control on SYS-WSX90.`)}
      ${selHtml("req", "Requirement", [["Requirements", allReqs().filter(([k]) => !have.has(k) && !mappings(k).some((m) => m.ctl === ctl)).map(([k, t]) => [k, `${k} · ${t}`])]], { ph: "Choose a requirement" })}
      ${U.F("Relationship", U.choose("rel", [["maps", "Maps to"], ["supports", "Supports"]], "maps"))}
      ${U.F("Rationale", U.area("note", "Why does this requirement meet the control?"))}`, footer: U.foot("Map a requirement", "reqmap", ctl) };
  };
  CH.ACTIONS.reqmap = (id, o) => {
    const req = /^REQ-/.test(id || "") ? id : o.req, ctl = id && !/^REQ-/.test(id) ? id : o.ctl;
    if (!req) return "Requirement is required.";
    if (!ctl) return "Control is required.";
    if (mappings(req).some((m) => m.ctl === ctl)) return `Control: ${req} maps ${ctl} already.`;
    const v0 = CH.view(ctl);
    V.set("reqx.map", [...maps(), { req, ctl, rel: o.rel || "maps", note: o.note || "", at: TODAY_ISO }]);
    if (!CH.st(ctl).req && v0.status === "no_requirement") CH.put(ctl, { req, reqTitle: title(req), rel: o.rel || "maps", mapNote: o.note || "", mapAt: TODAY_ISO });
    const e = evidence(req)[0];
    if (e && !CH.st(ctl).ev && CH.view(ctl).status === "no_evidence") CH.put(ctl, { ev: "req:" + req, evTitle: e.title, evAt: TODAY_ISO, evReq: req });
    const v1 = CH.view(ctl);
    return [`${req} maps ${ctl}: ${fmt(v1.ob)} of ${fmt(v1.ob)} objectives mapped${v1.status !== v0.status ? `; ${ctl} reads ${CH.ST[v1.status][1]} now` : ""}`, { label: `Open ${req}`, go: ["requirements", { open: { kind: "v7p-req", id: req } }] }];
  };
  const evChoice = () => CH.EV_OPTS().map(([k, t, s]) => [k, `${t} · ${String(s).replace(/ · Example$/, "")}`]);
  M["v7p-link-ev"] = (id) => {
    const reqs = id === "selected" ? R7.selected() : id ? [id] : [];
    const noev = allReqs().filter(([k]) => !evidence(k).length).map(([k, t]) => [k, `${k} · ${t}`]);
    return { title: "Link evidence", body: `${U.desc(reqs.length > 1 ? `Links one evidence version to ${reqs.length} chosen requirements. A requirement that cites evidence moves the controls it maps past No evidence.` : "A requirement that cites evidence moves the controls it maps past No evidence: an assessor examines what it cites.")}
      ${reqs.length ? U.ro(reqs.length > 1 ? "Requirements" : "Requirement", reqs.map((r) => `${tag(r)} ${esc(title(r))}`).join("<br>")) : selHtml("req", "Requirement", [[`Cite no evidence yet · ${noev.length}`, noev]], { ph: "Choose a requirement" })}
      ${selHtml("ev", "Evidence", [["Evidence versions", evChoice()]], { ph: "Choose evidence" })}
      ${U.F("What it shows", U.area("note", "The passage or result the assessor should read"))}`, footer: U.foot("Link evidence", "reqev", id || "") };
  };
  M["v7a-link-ev"] = (id) => M["v7p-link-ev"](id && /^REQ-/.test(id) ? id : "");
  CH.ACTIONS.reqev = (id, o) => {
    const reqs = id === "selected" ? R7.selected() : id ? [id] : o.req ? [o.req] : [];
    if (!reqs.length) return "Requirement is required.";
    if (!o.ev) return "Evidence is required.";
    const t = CH.evTitle(o.ev), add = reqs.filter((r) => !evidence(r).some((e) => e.title === t));
    if (!add.length) return `Evidence: ${reqs.join(", ")} cite${reqs.length === 1 ? "s" : ""} it already.`;
    V.set("reqx.ev", [...evs(), ...add.map((req) => ({ req, ev: o.ev, title: t, note: o.note || "", at: TODAY_ISO }))]);
    const moved = [];
    add.forEach((req) => mappings(req).forEach((m) => { if (!CH.st(m.ctl).ev && CH.view(m.ctl).status === "no_evidence") { CH.put(m.ctl, { ev: o.ev, evTitle: t, evNote: o.note || "", evAt: TODAY_ISO, evReq: req }); moved.push(m.ctl); } }));
    if (id === "selected" && R7.clearSelected) R7.clearSelected();
    return [`Evidence linked to ${add.length === 1 ? add[0] : `${add.length} requirements`}${moved.length ? `: ${moved.join(", ")} ${moved.length === 1 ? "waits" : "wait"} on an assessor now` : ""}`, add.length === 1 ? { label: `Open ${add[0]}`, go: ["requirements", { open: { kind: "v7p-req", id: add[0] } }] } : null];
  };

  // ════════════════ The old requirement page folds into the Requirements page ════════════════
  function openPreview(kind, id) {
    const main = document.getElementById("main"); if (!main) return;
    const t = document.createElement("span"); t.hidden = true; t.setAttribute("data-panel", kind); t.setAttribute("data-id", id);
    main.appendChild(t); t.click(); t.remove();
  }
  const showOn = (code) => {
    const el = [...document.querySelectorAll('#main [data-panel="v7p-req"]')].find((x) => x.getAttribute("data-id") === code);
    if (el) { el.scrollIntoView({ block: "center" }); el.click(); } else openPreview("v7p-req", code);
  };
  function open(code) { if (V.cur() === "requirements") { showOn(code); return; } location.hash = "requirements"; setTimeout(() => showOn(code), 60); }
  function fold() {
    const m = /^rec--v7p-req--(.*)$/.exec(V.cur()); if (!m) return;
    let id = m[1]; try { id = decodeURIComponent(id); } catch (e) { /* keep it as written */ }
    const code = id.split("|")[0];
    try { history.replaceState(null, "", "#requirements"); } catch (e) { location.replace("#requirements"); }
    setTimeout(() => showOn(code), 0);
  }
  window.addEventListener("hashchange", fold);
  fold();
  // A question for the Requirements page whose requirement is not on its first page still opens the preview.
  window.addEventListener("hashchange", () => { const q = V.cur() === "requirements" && V.peek("requirements"); if (q && q.open && q.open.kind === "v7p-req") { V.take("requirements"); setTimeout(() => showOn(String(q.open.id)), 0); } });

  PA.v2reqs = { info, title, mappings, evidence, follow, mappedTo, mappedAt, row, gained, gainedSet, gainedEvidence: () => gainedSet().size, open, chainCard };
})();
