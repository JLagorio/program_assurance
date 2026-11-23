import io, sys
P = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto/mod-zzzz-v3-8c-controls.js"
L = io.open(P, encoding="utf-8").read().split("\n")
R = []  # (start, end, startswith, new_text)  1-indexed inclusive

R.append((886, 886, "  const preset = (patch)", r'''  const preset = (patch) => { if (!on() || !wsx()) return; const want = normView(patch), have = vw(); if (JSON.stringify(want) !== JSON.stringify(have)) put("view", want); };'''))

R.append((699, 717, "    const frows = [];", r'''    // Findings and risks: one line a record. On the page a column says what it is and when its fix is planned; in the preview the
    // same rows read name, what it is, then the plan.
    const sevW = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "");
    const fr = (hit, title, desc, kind, plan, pk) => Object.assign({}, hit, { cells: page ? [K.name(title, desc), esc(kind), plan || NONE] : [K.name(title, [kind, desc].filter(Boolean).join(" · ")), pk || plan || ""] });
    const frows = [];
    if (typeof V3.facts.findingsOf === "function") { // lane E keeps the findings and the risks they raised
      let fs = [], rs = []; try { fs = V3.fact("findingsOf", code) || []; rs = (typeof V3.facts.risksOf === "function" && V3.fact("risksOf", code)) || []; } catch (e) { fs = []; rs = []; }
      for (const f of fs) { const pl = f.plan && f.plan.planned ? md(f.plan.planned) : ""; frows.push(fr({ panel: f.panel || "k3e-finding", id: f.id }, f.title, [f.source, f.state === "draft" ? "draft results" : ""].filter(Boolean).join(" · "), "Finding", pl ? `<span class="num">${esc(pl)}</span>` : muted("No plan"), pl ? `<span class="num">Fix planned ${esc(pl)}</span>` : muted("No plan"))); }
      for (const x of rs) frows.push(fr({ panel: x.panel || "k3e-risk", id: x.id }, x.title, x.sev ? `${sevW(x.sev)} severity` : "", "Risk", "", " "));
    } else {
      if (fnd && fnd.det !== "satisfied") frows.push(fr({ go: "findings-assessment" }, `${STW(fnd.det)[0]} · ${fnd.res || "Assessment finding"}`, fnd.camp || "", "Finding", "", muted(md(fnd.date))));
      for (const i of iss) frows.push(fr({ panel: "a-risk-issue", id: i.id }, i.title, i.sev || "", "Operational issue", muted(i.poam ? "Has a POA&M item" : "No POA&M item")));
      if (v.risk) frows.push(fr({ panel: "a-risk-risk", id: `${v.risk.id}|overview` }, v.risk.title, v.risk.sev ? `${sevW(v.risk.sev)} severity` : "", "Risk", "", " "));
    }
    const findSec = K.related({ id: "k3c-fnd", title: "Findings and risks", cols: page ? [{ label: "Record" }, { label: "Kind", cls: "nw" }, { label: "Fix planned", cls: "nw" }] : [{ label: "Record" }, { label: "Plan", peek: true }], rows: frows, empty: "No finding or risk names it",
      add: typeof V3.facts.findingsOf === "function" ? { label: "Add finding", act: "k3e.f.add", arg: { control: code, comp: lead0 || "" } } : null }); // lead: lane E's form, opened on this control
    const more = [{ label: "Change responsibility", act: "k3c.resp", arg: code }, { label: "Assign owner", act: "k3c.owner", arg: code }, { label: "Remove from the baseline", act: "k3c.remove", arg: code, danger: true }];
    if (!page) { // the preview: the facts, then every section the page lists, each as its first rows and a way to the rest
      const respNote = r.kind !== "System-specific" && r.offer ? `<p class="k3-muted k3c-under">${esc(r.offer.prov || "")}${r.kind === "Hybrid" && r.own ? ` <b>This system's part:</b> ${esc(r.own)}` : ""}</p>` : "";
      const sections = [statement(code), step ? K.next({ text: step.text, action: step.btn({ primary: true, sm: true }) }) : "", respNote].concat(implCard(code, lead, false),
        [reqSection(code, reqs, evs, false), evSection(code, reqs, evs, false), K.section({ title: "Assessment", body: K.facts(assess) }), objSection(code), findSec]);
      return { label: "Control", title: b.t || code, code, chip: stPill(st), actions: K.menu("More", more, { sm: true }), facts: facts.concat([["Family", esc(`${famOf(code)} ${famName(famOf(code))}`)]]), sections: sections.filter(Boolean) };
    }'''))

R.append((666, 666, "    const v = vw(); if (v.out) return", r'''    const v = vw(); if (v.status === "out") return "";'''))

R.append((657, 664, "  function viewWords(v) {", r'''  function viewWords(v) {
    const bits = [];
    if (v.fam) bits.push(famName(v.fam)); if (v.status) bits.push(stWord(v.status)); if (v.resp) bits.push(RESPW[v.resp] || ""); if (v.owner) bits.push(v.owner === "none" ? "No owner" : v.owner);
    if (v.source) bits.push(layerShort(v.source)); if (v.tech) bits.push(v.tech === "*" ? "Any technique" : (techs().find((t) => t.code === v.tech) || {}).t || "");
    if (v.comp) bits.push(`on ${compName(v.comp)}`); if (v.codes) bits.push(v.note || "named by another page"); if (v.q) bits.push(`"${v.q}"`);
    return bits.filter(Boolean);
  }'''))

R.append((647, 655, "  const objGroup = (code) => {", r'''  const objSection = (code) => {
    const O = objsOf(code); if (!O) return "";
    return K.related({ id: "k3c-objs", title: "Objectives", label: "Assessment objectives", cols: [{ label: "An assessor determines that" }, { label: "Judged", cls: "nw", peek: true }],
      rows: O.objs.map((o) => ({ cells: [`<span class="k3-nm k3c-ob" title="${esc(o.text)}"><span class="k3-nm-c">${esc(o.label)}</span><span class="k3-nm-t">${esc(o.text)}</span></span>`, O.is(o) ? K.status("Judged", "ok") : K.status("Not judged", "none")] })) });
  };'''))

R.append((628, 642, "  function reqSection(code, reqs, evs, page) {", r'''  function reqSection(code, reqs, evs, page) {
    const kind = reqKind();
    const alloc = (id) => { const els = ((dReq(id) || reqById(id) || {}).els || []).filter((e) => e !== ROOT); return els.length ? `<span title="${esc(els.map(compName).join(", "))}">${esc(compName(els[0]))}${els.length > 1 ? ` ${muted("+" + (els.length - 1))}` : ""}</span>` : muted("The system"); };
    const rows = reqs.map((x) => { const n = evs.filter((e) => e.req === x.id).length, st = page ? (dReq(x.id) || {}).st || "" : "";
      return { panel: kind, id: x.id, cells: page ? [K.name(x.title || x.id, x.today ? "Mapped today" : st, x.id), alloc(x.id), K.num(n), K.btn("Unmap", { sm: true, quiet: true, act: "k3c.req.rm", arg: { code, id: x.id } })]
        : [K.name(x.title || x.id, x.today ? "Mapped today" : "", x.id), n ? `<span class="num">${plural(n, "artifact")}</span>` : muted("No evidence")] }; });
    return K.related({ id: "k3c-reqs", title: "Requirements", add: { label: "Add requirement", act: "k3c.req.add", arg: code }, empty: `No requirement maps ${code} yet`,
      cols: page ? [{ label: "Requirement" }, { label: "Allocated to" }, { label: "Evidence", cls: "nw" }, { label: "", cls: "tight" }] : [{ label: "Requirement" }, { label: "Evidence", peek: true }], rows });
  }
  const EVT = { Accepted: "ok", "Pending review": "warn", "Needs revision": "bad" };
  function evSection(code, reqs, evs, page) {
    const kind = evKind(), rk = reqKind();
    const rows = evs.map((x) => { const id = kind ? artOf(x) : "", to = x.req ? K.recRoute(rk, x.req) : "", st = K.status(x.state, EVT[x.state] || "none");
      return Object.assign(id ? { panel: kind, id } : {}, { cells: page ? [K.name(x.title), to ? K.link(x.req, to) : esc(x.req || ""), st, K.btn("Remove", { sm: true, quiet: true, act: "k3c.ev.rm", arg: { code, title: x.title } })] : [K.name(x.title, x.req ? `Cited by ${x.req}` : ""), st] }); });
    return K.related({ id: "k3c-evs", title: "Evidence", add: reqs.length ? { label: "Add evidence", act: "k3c.ev.add", arg: code } : null, empty: reqs.length ? "Its requirements cite no evidence yet" : "Evidence comes through a requirement that maps the control",
      cols: page ? [{ label: "Evidence" }, { label: "Cited by", cls: "nw" }, { label: "State", cls: "nw" }, { label: "", cls: "tight" }] : [{ label: "Evidence" }, { label: "State", peek: true }], rows });
  }'''))

R.append((603, 621, "  const implSt = (im)", r'''  const implSt = (im) => (im && im.status && IMPLW(im.status) ? K.status(IMPLW(im.status)[0], IMPLW(im.status)[1]) : NONE);
  const sspLink = (code) => { let to = null; try { to = typeof V3.facts.sspAt === "function" ? V3.fact("sspAt", code) : null; } catch (e) { to = null; } return to ? K.link(`Open the SSP at ${code}`, to) : K.actLink(`Open the SSP at ${code}`, "k3c.ssp", code); };
  // Pass 3: one line a place. On the page the statement has its own column, the one text that may wrap; in the preview a row is
  // the place and its status, under the text of the place the preview leads with.
  function implCard(code, lead, page) {
    const comps = compsOf(code), others = comps.filter((c) => c !== lead), order = lead ? [lead].concat(others) : comps;
    const sys = implOf(code, ""), b = SSP.ctl(code);
    const where = (name, im, from) => `<span class="k3-nm"><span class="k3-nm-t">${name}</span>${page ? "" : `<span class="k3-nm-d">${from ? "In the system's text" : im && im.text ? "Written" : "Not written"}</span>`}</span>`;
    // lead: a component the system's text names is not given that whole text again, row after row: one line says where it is.
    const text = (im, from) => (from ? muted("In the system's text, which names this component") : im && im.text ? `<span class="k3c-impl wide">${esc(im.text)}</span>` : `<span class="k3c-mu">Not written yet.</span> <span class="k3-link">Write it</span>`);
    const sysRow = { act: "k3c.impl", arg: { code, comp: "" }, cells: [where("The system as a whole", sys, false), text(sys, false), implSt(sys), ""] };
    const row = (c) => { const im = implShown(code, c), from = !!(im && im.fromSsp); return { act: "k3c.impl", arg: { code, comp: c }, cls: c === lead ? "k3c-lead" : "", cells: [where(compLink(c), im, from), text(im, from), implSt(im), K.btn("Remove", { sm: true, quiet: true, act: "k3c.comp.rm", arg: { code, comp: c }, title: `Remove ${compName(c)} from ${code}` })] }; };
    const rev = SSP.doc ? `SSP revision ${SSP.doc.revision} (${String(SSP.doc.state || "").toLowerCase()})` : "the SSP";
    const under = `<p class="k3-muted k3c-under">${b ? `Section 11 of ${esc(rev)} prints the system's text. ${sspLink(code)}` : "It prints in section 11 of the next SSP revision."}</p>`;
    const cols = [{ label: "Where", cls: "nw" }, { label: "Implementation statement", cls: "wrap main" }, { label: "Status", cls: "nw", peek: true }, { label: "", cls: "tight" }], add = { label: "Add component", act: "k3c.comp.add", arg: code };
    if (page && lead) {
      const im = implShown(code, lead), name = compName(lead);
      return [K.section({ id: "k3c-impl-lead", title: `${name}'s implementation`, actions: im ? implSt(im) : "", body: im && im.text ? `<p class="k3c-prose">${esc(im.text)}</p>${im.fromSsp ? `<p class="k3-muted">From the control's implementation in the system security plan, which names this component. Write this component's own text to replace it here.</p>` : ""}` : `<div class="k3-none-row"><span>Nothing is written yet for how ${esc(name)} implements ${esc(code)}.</span>${K.actLink("Write implementation", "k3c.impl", { code, comp: lead })}</div>` }),
        K.related({ id: "k3c-impl", title: "Implemented elsewhere", add, cols, rows: [sysRow].concat(others.map(row)) }) + under];
    }
    const rows = lead ? order.map(row).concat([sysRow]) : [sysRow].concat(order.map(row));
    if (page) return [K.related({ id: "k3c-impl", title: "Implementation", add, cols, rows }) + under];
    const first = lead ? implShown(code, lead) : sys, said = first && first.text ? `<p class="k3c-impl k3c-implp" title="${esc(lead ? compName(lead) : "The system as a whole")}">${esc(first.text)}</p>` : "";
    return [K.section({ id: "k3c-impl", title: "Implementation", count: rows.length, actions: K.actLink(add.label, add.act, add.arg), body: [said, K.table({ cols, rows, label: "Implementation" })] }) + under];
  }'''))

R.append((474, 480, '  K.on("k3c.fam"', r'''  K.on("k3c.fam", (id) => { setView(id === "__out" ? { status: "out", fam: "" } : { fam: id || "" }); redraw(); });
  K.on("k3c.chip", (id) => { const o = CHIP2[id] || {}; setView({ status: o.status || "", resp: o.resp || "" }); redraw(); });
  // The kit applies a view by calling the search's action last, with no element: a set another page named goes with the old question.
  K.on("k3c.q", (v, el) => { setView(el ? { q: v || "" } : { q: v || "", comp: "", codes: null, note: "" }); redraw(); });
  for (const k of ["status", "source", "resp", "tech", "owner"]) K.on("k3c.f." + k, (v) => { setView({ [k]: v || "" }); redraw(); });
  K.on("k3c.mini", (k) => { const s = MINI2[k] || ""; setView({ status: vw().status === s ? "" : s }); redraw(); });
  K.on("k3c.layer", (k) => { setView({ source: vw().source === k ? "" : k }); redraw(); });
  K.on("k3c.unset", () => { setView({ comp: "", codes: null, note: "" }); redraw(); });
  K.on("k3c.clear", () => { put("view", Object.assign({}, VIEW0)); redraw(); });'''))

R.append((451, 452, '    return K.page({ head: head("list"), cls: "k3c", body: K.split(rail, [K.cards(', r'''    return K.page({ head: head("list"), cls: "k3c", body: K.split(rail, [K.cards(K.completion({ label: "Controls satisfied", done: sat, total: all.length, unit: "controls" }), base),
      K.toolbar({ id: "controls", noun: "controls", search: { act: "k3c.q", value: v.q, placeholder: "Search controls" }, filters: [{ label: "Status", act: "k3c.f.status", value: v.status, options: LADDER.map((k) => [k, SSP.STATUS[k][0]]) }], views: { total: all.length, all: "All controls" } }), table]) });'''))

R.append((440, 440, '    const rail = K.rail({ title: "Control families", act: "k3c.fam", label: "Control family"', None))
R.append((448, 448, "      rows: shown.slice(page * PER", None))

R.append((389, 425, '  const outRow = (r) =>', r'''  // A set another page names (a component's controls, the controls a section of the SSP cites) stands in the row as a token.
  const setToken = (v) => { const t = v.comp ? `Carried by ${compName(v.comp)}` : v.codes ? v.note || `${plural(v.codes.length, "control")} another page named` : ""; return t ? `<span class="k3c-set" title="${esc(t)}"><span class="t">${esc(t)}</span><button type="button" aria-label="Show every control again" title="Show every control again"${K.a("k3c.unset")}>×</button></span>` : ""; };
  const respCell = (r) => (r.resp.kind === "System-specific" || !r.resp.provider ? esc(r.resp.kind === "System-specific" ? "This system" : r.resp.kind)
    : `<span title="${esc(r.resp.word)}${r.resp.unauth ? ", which is not authorized" : ""}">${esc(r.resp.kind)}<span class="k3c-pr${r.resp.unauth ? " un" : ""}"> · ${esc(r.resp.provider)}</span></span>`);
  const outRow = (r) => ({ cls: "k3c-out", panel: "k3c-control", id: r.code, cells: [K.name(r.title || r.code, "", r.code), K.status("Tailored out", "none"), `<span class="k3c-src">${esc(layerShort(r.by))} removed it</span>`, NONE, NONE, NONE, K.btn("Restore", { sm: true, act: "k3c.restore", arg: r.code })] });
  const LADDER = ["no_requirement", "no_evidence", "not_assessed", "other_than_satisfied", "partially_satisfied", "satisfied"];
  const PRESETS = [["No requirement", { status: "no_requirement" }], ["Needs evidence", { status: "no_evidence" }], ["Not assessed", { status: "not_assessed" }], ["Short of satisfied", { status: "short" }], ["Inherited", { responsibility: "inherited" }]];
  const SEED = [{ name: "Access control, needs evidence", state: { family: "AC", status: "no_evidence" }, by: "Ingrid Solberg", shared: true }];
  function listWSX() {
    takeQuestion();
    const v = vw(), m = model(prog()), all = rowsWSX(prog()), c = counts(all), outs = outRows(), isOut = v.status === "out";
    const shown = askRows(all, outs, v), noFam = askRows(all, outs, v, { fam: true }), noSt = applyView(all, v, { status: true }), outN = outView(outs, v).length;
    const total = shown.length, pages = Math.max(1, Math.ceil(total / PER)), page = Math.min(v.page || 0, pages - 1), slice = shown.slice(page * PER, page * PER + PER);
    const fams = FAM().concat(uniq(all.map((r) => r.fam)).filter((f) => !FAM().includes(f)));
    // The row over the table: Family, Status, Responsibility, Owner, Source, Technique, in the order a person narrows.
    const famRail = K.rail({ label: "Family", key: "family", act: "k3c.fam", items: [{ id: "", label: "All families", count: noFam.length, on: !v.fam }]
      .concat(fams.map((f) => ({ id: f, code: f, label: famName(f), count: noFam.filter((r) => r.fam === f).length, on: v.fam === f }))) });
    const stItem = (k) => ({ id: k, label: stWord(k), count: k === "out" ? outN : noSt.filter(stTest(k)).length, on: v.status === k });
    const stRail = K.rail({ label: "Status", key: "status", act: "k3c.f.status", items: [{ id: "", label: "All statuses", count: noSt.length, on: !v.status }]
      .concat(LADDER.map(stItem), [{ head: "Several statuses" }], ["short", "has_req", "has_ev", "assessed"].map(stItem), [{ head: "Outside the baseline" }, stItem("out")]) });
    const cards = K.cards(
      K.completion({ label: "Controls satisfied", done: c.satisfied, total: c.total, unit: "controls", minis: [["req", "With a requirement"], ["ev", "With evidence"], ["assessed", "Assessed"]].map(([k, l]) => ({ label: l, done: all.filter(miniTest[k]).length, total: c.total, act: "k3c.mini", arg: k })) }),
      baselineCard(m, v));
    const people = uniq(all.map((r) => r.owner).filter(Boolean)).sort();
    const countState = (st) => askRows(all, outs, normView({ q: st.q || "", fam: st.family || "", status: st.status || "", resp: st.responsibility || "", owner: st.owner || "", source: st.source || "", tech: st.technique || "" })).length;
    const tools = K.toolbar({ id: "controls", noun: "controls", search: { act: "k3c.q", value: v.q, placeholder: "Search controls" }, right: setToken(v), filters: [
      { label: "Responsibility", act: "k3c.f.resp", value: v.resp, options: Object.keys(RESPW).map((k) => [k, RESPW[k]]) },
      { label: "Owner", act: "k3c.f.owner", value: v.owner, options: [["none", "No owner"]].concat(people.map((p) => [p, p])) },
      { label: "Source", act: "k3c.f.source", value: v.source, options: m.rows.filter((r) => r.on || r.key === v.source).map((r) => [r.key, layerShort(r.key)]) },
      { label: "Technique", act: "k3c.f.tech", value: v.tech, options: [["*", "Any technique"]].concat(techs().map((t) => [t.code, t.t])) },
    ], views: { total: all.length, all: "All controls", presets: PRESETS.map(([label, state]) => ({ label, state, count: countState(state) })), seed: SEED, count: countState } });
    const row = (r) => (r.out ? outRow(r) : { panel: "k3c-control", id: r.code, cells: [
      K.name(r.title || r.code, r.line || (r.syn ? "Tailored in here: nothing recorded yet" : "Implementation not written"), r.code),
      stPill(r.status), `<span class="k3c-src" title="${esc(layerName(r.src))}">${esc(layerShort(r.src))}</span>`, respCell(r),
      K.num(compsOf(r.code).length), K.ring(r.oe, r.ob, "objectives with evidence"), K.owner(r.owner)] });
    const from = total ? page * PER + 1 : 0, to = Math.min(total, page * PER + PER);
    const foot = `<span class="num">${fmt(from)}–${fmt(to)} of ${fmt(total)}</span>${isOut ? "" : '<span class="k3c-same">The workbook holds the same rows.</span>'}<span class="k3c-pg">${K.btn("Previous", { sm: true, act: "k3c.page", arg: page - 1, disabled: page <= 0 ? "This is the first page" : "" })}${K.btn("Next", { sm: true, act: "k3c.page", arg: page + 1, disabled: page >= pages - 1 ? "This is the last page" : "" })}</span>`;
    const table = K.table({ label: "Controls", cols: [{ label: "Control" }, { label: "Status" }, { label: "Source", cls: "nw" }, { label: "Responsibility", cls: "nw" }, { label: "Components", cls: "nw k3c-w2" }, { label: "Evidence", cls: "nw" }, { label: "Owner", cls: "k3c-own" }],
      rows: slice.map(row), foot, empty: { title: isOut ? "Nothing is tailored out here" : "No controls match", line: isOut ? "No layer removed a control that matches." : "Clear a filter or choose another family.", action: anyFilter(v) ? K.btn("Clear filters", { sm: true, act: "k3c.clear" }) : "" } });
    return K.page({ head: head("list"), cls: "k3c", body: K.split(famRail + stRail, [cards, tools, table]) });
  }'''))

R.append((373, 388, "  function baselineCard(m, v) {", r'''  function baselineCard(m, v) {
    const here = get("added", []).length + get("removed", []).length;
    const line = (r) => `<li><button type="button" class="k3c-ly${v.source === r.key ? " on" : ""}${r.on ? "" : " off"}" aria-pressed="${v.source === r.key}" title="${esc(`Show the controls ${r.name} added`)}"${K.a("k3c.layer", r.key)}><span class="l">${esc(r.name)}</span><span class="d num">${!r.on ? "Not applied" : r.key === "high" ? "" : `${r.added.length ? "+" + fmt(r.added.length) : ""}${r.added.length && r.removed.length ? " " : ""}${r.removed.length ? "−" + fmt(r.removed.length) : ""}${r.added.length || r.removed.length ? "" : "No change"}`}</span><span class="n num">${fmt(r.count)}</span></button></li>`;
    const w = changedHere() ? waitLine() : "";
    return `<section class="k3-card k3c-base" aria-label="Baseline"><div class="k3-sec-h"><h2 class="k3-card-t">Baseline</h2>${K.btn("Edit baseline", { sm: true, act: "k3c.baseline" })}</div><div class="k3c-base-n"><span class="num">${fmt(m.set.size)}</span> controls, from ${plural(m.rows.filter((r) => r.on).length, "layer")} in the order they apply</div><ul class="k3c-lys">${m.rows.map(line).join("")}</ul>${here || w ? `<p class="k3-muted k3c-base-f">${here ? `${plural(here, "tailoring decision")} made here. ` : ""}${esc(w)}</p>` : ""}</section>`;
  }'''))

R.append((333, 353, "  const CHIPS = [", r'''  const respKey = (r) => (r.resp.kind === "Inherited" ? "inherited" : r.resp.kind === "Hybrid" ? "hybrid" : "own");
  // Several statuses at once, which the Status filter offers under the six: the controls an assessor found short, and what the
  // Completion card's bars count. "out" is what a layer or the program removed.
  const STSET = { short: (r) => r.status === "partially_satisfied" || r.status === "other_than_satisfied", has_req: (r) => r.status !== "no_requirement", has_ev: (r) => r.status !== "no_requirement" && r.status !== "no_evidence", assessed: (r) => DETS.has(r.status) };
  const STSETW = { short: "Short of satisfied", has_req: "With a requirement", has_ev: "With evidence", assessed: "Assessed", out: "Tailored out" };
  const stTest = (s) => STSET[s] || ((r) => r.status === s);
  const stWord = (s) => STSETW[s] || STW(s)[0];
  const RESPW = { own: "This system", hybrid: "Hybrid", inherited: "Inherited", unauth: "Provider not authorized" };
  const miniTest = { req: STSET.has_req, ev: STSET.has_ev, assessed: STSET.assessed };

  // ——— The view: the search and the six filters of the list's one row live in the session, so a redraw and Back keep them.
  // Pass 3: every part of the question is a control in that row. What other pages still send in the older words (chip, mini,
  // layer, out) is read as the filter it always was; a set another page names (codes, comp) stands in the row as a token. ———
  const VIEW0 = { fam: "", chip: "", q: "", status: "", source: "", resp: "", tech: "", owner: "", layer: "", mini: "", comp: "", codes: null, note: "", out: false, page: 0 };
  const CHIP2 = { noreq: { status: "no_requirement" }, noev: { status: "no_evidence" }, notassessed: { status: "not_assessed" }, short: { status: "short" }, inherited: { resp: "inherited" } };
  const MINI2 = { req: "has_req", ev: "has_ev", assessed: "assessed" };
  const normView = (raw) => {
    const v = Object.assign({}, VIEW0, raw);
    if (v.chip) Object.assign(v, CHIP2[v.chip] || {});
    if (v.mini === "params") { v.codes = uniq(params().map((p) => p.ctl)); v.note = "Controls whose statement has parameters"; } else if (MINI2[v.mini]) v.status = MINI2[v.mini];
    if (v.layer) v.source = v.layer;
    if (v.out) v.status = "out";
    return Object.assign(v, { chip: "", mini: "", layer: "", out: false });
  };
  const vw = () => normView(get("view", {}));
  const setView = (patch, keepPage) => { put("view", Object.assign({}, vw(), keepPage ? {} : { page: 0 }, patch)); };
  const anyFilter = (v) => !!(v.fam || v.q || v.status || v.source || v.resp || v.tech || v.owner || v.comp || v.codes);
  function applyView(rows, v, skip = {}) {
    if (v.status === "out" && !skip.status) return [];
    const q = (v.q || "").trim().toLowerCase(), codes = v.codes ? new Set(v.codes) : null, st = v.status && !skip.status ? stTest(v.status) : null;
    return rows.filter((r) => (skip.fam || !v.fam || r.fam === v.fam) && (!st || st(r)) && (!v.source || r.src === v.source)
      && (!v.resp || (v.resp === "unauth" ? !!r.resp.unauth : respKey(r) === v.resp))
      && (!v.tech || (v.tech === "*" ? r.tech.length > 0 : r.tech.some((t) => t.code === v.tech)))
      && (!v.owner || (v.owner === "none" ? !r.owner : r.owner === v.owner))
      && (!v.comp || compsOf(r.code).includes(v.comp)) && (!codes || codes.has(r.code))
      && (!q || `${r.code} ${r.title} ${r.line}`.toLowerCase().includes(q)));
  }
  // The controls a layer or the program removed answer the family, the source (the layer that removed them) and the search.
  const outView = (outs, v, skip = {}) => { const q = (v.q || "").trim().toLowerCase(); return v.resp || v.tech || v.owner || v.comp || v.codes ? [] : outs.filter((r) => (skip.fam || !v.fam || r.fam === v.fam) && (!v.source || r.by === v.source) && (!q || `${r.code} ${r.title}`.toLowerCase().includes(q))); };
  const askRows = (all, outs, v, skip) => (v.status === "out" ? outView(outs, v, skip) : applyView(all, v, skip));'''))

R.sort(key=lambda x: -x[0])
for (a, b, pre, new) in R:
    assert L[a-1].startswith(pre), (a, L[a-1][:80])
    if new is None:
        continue
    L[a-1:b] = new.split("\n")
io.open(P, "w", encoding="utf-8").write("\n".join(L))
print("ok", len(L))
