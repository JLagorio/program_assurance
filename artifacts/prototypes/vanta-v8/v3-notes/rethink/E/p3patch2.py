# Pass 3, lane E: assessments (their list, their page, a preview kind of their own), risks, authorization.
import io
F = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto/mod-zzzz-v3-8e-assure.js"
L = io.open(F, encoding="utf-8").read().split("\n")
def at(n, prefix):
    assert L[n - 1].startswith(prefix), (n, L[n - 1][:80])
R = []
def rep(first, last, prefix, text, endprefix=None):
    at(first, prefix)
    if endprefix: at(last, endprefix)
    R.append((first, last, text.strip("\n")))

rep(476, 493, "  function listPage(route) {", r'''
  // One line an assessment. Its row goes to its page; the eye opens its preview (k3e-asm).
  const ACOLS = [{ label: "Assessment" }, { label: "Status", peek: true }, { label: "Window or cadence", cls: "nw" }, { label: "Progress", cls: "nw" }, { label: "Findings", cls: "nw end" }, { label: "Lead" }];
  const asmRow = (a, kindCol) => { const p = a.kind === "control" && a.id !== "init" ? progress(a.id) : null, n = findingsOfAsm(a.id).length + (a.cyf || 0); return { panel: "k3e-asm", id: a.id, cells: [K.name(a.short || a.name, coversLine(a))].concat(kindCol ? [esc(KINDW[a.kind])] : [], [stPill(a.status), windowCell(a), p && p.total ? K.ring(p.done, p.total, "objectives judged") : a.kind === "check" ? mu(plural(a.nruns, "run")) : NONE, n ? K.num(n) : NONE, `<span class="k3e-own">${K.owner(a.lead)}</span>`]) }; };
  const STORDER = ["Active", "Planned", "Proposed", "Overdue", "Due soon", "On schedule", "Completed"];
  const NEEDW = [["publish", "Results to publish"], ["failing", "An overdue run"], ["ending", "Window ends in two weeks"]];
  const askA = (kind, v) => assessments().filter((a) => (!kind || a.kind === kind) && (!v.att || (ATT[v.att] && ATT[v.att](a))) && (!v.st || a.status === v.st) && matchQ(v.q, `${a.name} ${a.lead || ""} ${KINDW[a.kind]}`));
  function listPage(route) {
    const kind = kindOfRoute(route), v = Object.assign({ att: "", q: "", st: "" }, view("asm")), all = assessments(), inKind = all.filter((a) => !kind || a.kind === kind);
    const rows = askA(kind, v);
    const act = all.filter((a) => a.kind === "control" && a.status === "Active"), pr = act.map((a) => progress(a.id));
    const attRow = (id, label, tone) => ({ label, n: all.filter(ATT[id]).length, tone, act: "k3e.a.need", arg: id });
    const sts = STORDER.filter((s) => v.st === s || inKind.some((a) => a.status === s)).map((s) => [s, s, inKind.filter((a) => a.status === s).length]);
    return K.page({ cls: "k3e",
      head: K.head({ title: "Assessments", actions: wsx() ? `<button type="button" class="btn ink" data-modal="v2k-plan">${K.i("plus")}Plan an assessment</button>` : K.btn("Plan an assessment", { primary: true, act: "k3e.a.new", icon: "plus" }) }),
      body: [all.length ? K.cards(K.completion({ title: "Under way", label: "Objectives judged", done: pr.reduce((n, p) => n + p.done, 0), total: pr.reduce((n, p) => n + p.total, 0), unit: "objectives", note: plural(act.length, "active control assessment") }), K.attention({ rows: [attRow("publish", "Results waiting to be published"), attRow("failing", "Monitoring checks overdue", "bad"), attRow("ending", "Windows ending within two weeks")] })) : "",
        K.rail({ label: "Kind", key: "kind", items: KINDS.map(([id, label, r]) => ({ id, label, go: r, on: kind === id, count: all.filter((a) => !id || a.kind === id).length })) }),
        K.toolbar({ id: "assessments", noun: "assessments", search: { act: "k3e.a.q", value: v.q, placeholder: "Search assessments" },
          filters: [{ label: "Status", key: "status", act: "k3e.a.st", value: v.st, options: sts }, { label: "Needs", key: "needs", act: "k3e.a.att", value: v.att, options: NEEDW.map(([id, label]) => [id, label, inKind.filter(ATT[id]).length]) }],
          views: { total: all.length, count: (st) => askA(st.kind || "", { att: st.needs || "", st: st.status || "", q: st.q || "" }).length,
            presets: KINDS.slice(1).map(([id, label]) => ({ label, state: { kind: id }, count: all.filter((a) => a.kind === id).length })).concat([{ label: "Results to publish", state: { needs: "publish" }, count: all.filter(ATT.publish).length }]),
            seed: [{ name: "Overdue monitoring checks", state: { kind: "check", status: "Overdue" }, by: U.ISSM }] } }),
        K.table({ label: "Assessments", cols: kind ? ACOLS : [ACOLS[0], { label: "Kind", cls: "nw" }].concat(ACOLS.slice(1)), rows: rows.map((a) => asmRow(a, !kind)),
          empty: all.length ? { title: "No assessment matches", line: "Clear the search and the filters." } : { title: "No assessment yet", line: "Plan the first one: it names the controls an assessor will judge and when.", action: K.btn("Plan an assessment", { sm: true, act: "k3e.a.new" }) }, foot: `<span class="num">${plural(rows.length, "assessment")}</span>` })] });
  }
  // The card's rows ask the whole list; the row's own filters work with the value alone ("" clears), so a view can ask them again.
  K.on("k3e.a.need", (id) => { setView("asm", { att: id || "", st: "" }); if (kindOfRoute(cur())) K.go("assessments"); else K.redraw(); });
  K.on("k3e.a.att", (id) => { setView("asm", { att: id || "" }); K.redraw(); });
  K.on("k3e.a.st", (st) => { setView("asm", { st: st || "" }); K.redraw(); });
  K.on("k3e.a.q", (q) => { setView("asm", { q: q || "" }); K.redraw(); });
''', '  K.on("k3e.a.q"')

rep(529, 603, "  const ctlBtn = (code) =>", r'''
  const ctlBtn = (code) => (U.ctlRoute(code) ? K.link(code, U.ctlRoute(code)) : `<span class="num">${esc(code)}</span>`);
  // ——— What an assessment lists, each defined once: its page draws them under its tabs, its preview as short lists of the same rows ———
  const STEPCOLS = [{ label: "Step" }, { label: "Who" }, { label: "State", cls: "nw", peek: true }];
  const stepRows = (a) => { const p = planOf(a.id); return PLAN_STEPS.map(([k, role, who, verb], i) => { const s = (p.steps || []).filter((x) => x.k === k && x.rev === p.rev && x.o !== "return").pop(); const turn = !s && a.status !== "Completed" && ((i === 0 && p.state === "draft") || (i === 1 && p.state === "review")); return { cells: [K.name(`${role} ${verb}`, s ? `Recorded as ${who}${s.rec && s.rec !== who ? " by " + s.rec : ""} · ${md(s.at)}` : a.id === "init" || (p.state === "approved" && !s) ? "Recorded with the plan" : "Not yet"), K.owner(who), s || p.state === "approved" ? h.pill("ok", i ? "Concurred" : "Approved") : turn ? K.btn(i ? "Concur" : "Approve", { sm: true, act: "k3e.a.approve", arg: a.id }) : mu("Waits")] }; }); };
  const PCTLCOLS = [{ label: "Control" }, { label: "Objectives judged", cls: "nw" }, { label: "Determination", peek: true }];
  const planCtlRow = (code) => { const d = ctlDet(code); return { panel: P["k3c-control"] ? "k3c-control" : "a-tests-control", id: code, cells: [K.name(ctlTitle(code), "", code), K.ring(judgedN(code), objectivesOf(code).length, "objectives"), d ? detPill(d.det) + (d.draft ? ` ${mu("draft")}` : "") : mu("Not judged")] }; };
  const detailFacts = (a) => { const pr = a.kind === "control" ? progress(a.id) : null; return a.kind === "control"
    ? [["Kind", esc(KINDW[a.kind])], ["Window", windowCell(a)], ["Plan", esc(planWords(a.id))], ["Lead assessor", K.owner(a.lead)], a.assessor ? ["Assessor", K.owner(a.assessor)] : null, a.owner ? ["Owner", K.owner(a.owner)] : null, a.ssp ? ["Assesses", esc(a.ssp)] : null, a.id === "init" ? null : ["Judged", `<span class="num">${fmt(pr.done)} of ${fmt(pr.total)}</span> objectives`]]
    : a.kind === "cyber" ? [["Kind", "Cyber test"], ["Phase", esc(a.phase || "")], ["Window", windowCell(a)], ["Lead", a.lead ? K.owner(a.lead) : mu("Not named")], ["Test plan", a.plan ? esc(a.plan) : mu("None")]]
    : [["Kind", "Monitoring check"], ["Cadence", esc(a.cadence)], ["Owner", K.owner(a.lead)], ["Last run", a.lastRun ? esc(a.lastRun) : mu("None recorded")], ["Next run", a.due ? `<span class="num${a.status === "Overdue" ? " k3e-late" : ""}">${esc(mdy(a.due))}</span>` : NONE], ["Failing now", a.failing ? K.link(plural(a.failing, "result"), a.route + "--findings") : mu("Nothing")]]; };
  function tabPlan(a) {
    const nx = nextOf(a), L = ctlsOf(a.id);
    return K.aside([nx ? K.next(nx) : "",
      K.section({ title: "Plan approval", body: K.table({ label: "Plan approval", cols: STEPCOLS, rows: stepRows(a) }) }),
      a.id === "init" ? "" : K.related({ title: "Controls in the plan", count: L.length, add: a.status === "Completed" || a.id === "exp" ? null : { label: "Add controls", act: "k3e.a.addctl", arg: a.id }, empty: "The plan names no control yet", cols: PCTLCOLS, rows: L.map(planCtlRow) })],
    [K.details("Details", detailFacts(a))]);
  }
  const oview = (id) => Object.assign({ ctl: "", chip: "all", q: "" }, (view("asmo") || {})[id] || {});
  const setO = (id, patch) => K.set("asmo.view", Object.assign({}, view("asmo"), { [id]: Object.assign({}, oview(id), patch) }));
  const METHODW = { examine: "Examine", interview: "Interview", test: "Test" };
  const OCOLS = [{ label: "Objective" }, { label: "Methods", cls: "nw" }, { label: "Determination", peek: true }, { label: "Recorded as" }, { label: "", cls: "tight" }];
  const objEntries = (code) => { const st = objState(code), d = ctlDet(code); return objectivesOf(code).map((o) => { const s = st[o.i] || null; return { code, o, s, whole: !s && d && d.whole ? d : null }; }); };
  // bare: the row as a preview lists it, with no button and no link beside the determination.
  const objRow = (a, r, ok, bare) => { const s = r.s, arg = { cid: a.id, code: r.code, i: r.o.i }; return { cells: [K.name(r.o.label, `Determine if ${r.o.text}.`), esc((s ? s.methods : r.o.methods).map((m) => METHODW[m] || m).join(", ")),
    s ? `${detPill(s.det)}${s.pub ? "" : ` ${mu("draft")}`}${!bare && SHORT.has(s.det) && U.recGo("k3e-finding", "x") ? ` ${K.link("Finding", U.recGo("k3e-finding", `af:${(s.pub && s.pub.cid) || a.id}:${r.code}:${r.o.i}`))}` : ""}` : r.whole ? `${detPill(r.whole.det)}${bare ? "" : ` ${mu("with the control")}`}` : mu("Not judged"), s ? `<span class="k3e-own">${K.owner(s.by)}</span>` : NONE,
    bare || (s && s.pub) ? "" : K.btn(s ? "Change" : "Judge", { sm: true, quiet: !!s, act: "k3e.a.judge", arg, disabled: a.status === "Completed" ? "This assessment is completed" : ok ? "" : "The plan is approved first" })] }; };
  function tabObjectives(a) {
    const L = ctlsOf(a.id), v = oview(a.id), ok = workable(a.id), nx0 = nextOf(a), nx = nx0 && !/Open the objectives/.test(nx0.action) ? nx0 : null;
    const all = L.flatMap(objEntries), CHIP = { all: () => true, open: (r) => !r.s && !r.whole, short: (r) => (r.s && SHORT.has(r.s.det)) || (r.whole && SHORT.has(r.whole.det)), draft: (r) => (r.s && !r.s.pub) || (r.whole && r.whole.draft) };
    const inCtl = all.filter((r) => (!v.ctl || r.code === v.ctl) && matchQ(v.q, `${r.o.label} ${r.o.text} ${r.code} ${ctlTitle(r.code)}`)), shown = inCtl.filter(CHIP[v.chip] || CHIP.all);
    const rows = []; let last = null;
    for (const r of shown) {
      if (r.code !== last) { last = r.code; const d = ctlDet(r.code); rows.push({ group: `<span class="k3e-grp">${ctlBtn(r.code)} ${esc(ctlTitle(r.code))}<span class="k3e-grp-m">${d ? detPill(d.det) + (d.draft ? mu(" draft") : "") : mu("Not assessed until every objective is judged")}</span></span>` }); }
      rows.push(objRow(a, r, ok, false));
    }
    const chip = (id, label) => ({ id, label, count: inCtl.filter(CHIP[id]).length, on: v.chip === id });
    return [nx ? K.next(nx) : "",
      K.rail({ label: "Control", key: "control", act: "k3e.a.octl", items: [{ id: "", label: "All controls", count: all.length, on: !v.ctl }].concat(L.map((code) => ({ id: code, code, label: ctlTitle(code), count: objectivesOf(code).length, on: v.ctl === code }))) }),
      K.chips([{ id: "", label: "All", count: inCtl.length, on: !CHIP[v.chip] || v.chip === "all" }, chip("open", "Not judged"), chip("short", "Short of satisfied"), chip("draft", "Draft")], "k3e.a.ochip", "State"),
      K.toolbar({ id: "assessment-objectives", noun: "objectives", search: { act: "k3e.a.oq", value: v.q, placeholder: "Search objectives" }, views: { total: all.length } }),
      K.table({ label: "Objectives", cols: OCOLS, rows,
        empty: L.length ? { title: "No objective matches", line: "Clear the search and the filters." } : { title: "No objective yet", line: "Add the controls the plan assesses: each brings its objectives.", action: a.id === "exp" ? "" : K.btn("Add controls", { sm: true, act: "k3e.a.addctl", arg: a.id }) }, foot: `<span class="num">${plural(shown.length, "objective")}</span>` })];
  }
  const REQP = { Accepted: "ok", Ready: "info", Flagged: "warn", "Not ready": "none" };
  const QCOLS = [{ label: "Request" }, { label: "Control", cls: "nw" }, { label: "Owner" }, { label: "Due", cls: "nw" }, { label: "Status", peek: true }, { label: "", cls: "tight" }];
  const reqRow = (a, r, bare) => ({ cells: [K.name(r.title), ctlBtn(r.control), `<span class="k3e-own">${K.owner(r.owner)}</span>`, r.due && r.due !== "—" ? `<span class="num">${esc(r.due)}</span>` : NONE, h.pill(REQP[r.status] || "none", r.status),
    bare || a.status === "Completed" || r.status === "Accepted" ? "" : K.menu("Set", [{ label: "Ready", act: "k3e.a.req", arg: { a: a.id, key: r.key, code: r.control, to: "Ready" } }, { label: "Flagged: evidence falls short", act: "k3e.a.req", arg: { a: a.id, key: r.key, code: r.control, to: "Flagged" } }, { label: "Accepted", act: "k3e.a.req", arg: { a: a.id, key: r.key, code: r.control, to: "Accepted" } }], { sm: true })] });
  const qview = (id) => Object.assign({ q: "", st: "" }, (view("asmq") || {})[id] || {});
  function tabRequests(a) {
    const L = requestsOf(a), ok = workable(a.id), v = qview(a.id);
    const rows = L.filter((r) => (!v.st || r.status === v.st) && matchQ(v.q, `${r.title} ${r.control} ${r.owner || ""}`));
    return [L.length > 8 ? K.toolbar({ views: false, search: { act: "k3e.a.rq", value: v.q, placeholder: "Search requests" }, filters: [{ label: "Status", key: "status", act: "k3e.a.rst", value: v.st, options: Object.keys(REQP).filter((s) => v.st === s || L.some((r) => r.status === s)).map((s) => [s, s, L.filter((r) => r.status === s).length]) }] }) : "",
      K.table({ label: "Requests", cols: QCOLS, rows: rows.map((r) => reqRow(a, r, false)),
        empty: L.length ? { title: "No request matches", line: "Clear the search and the status." } : { title: "No request yet", line: ok ? "A request asks a control's owner for the evidence its objectives need." : "Requests run once the plan is approved." }, foot: `<span class="num">${plural(rows.length, "request")}</span>` })];
  }
  const RESCOLS = [{ label: "Results" }, { label: "State", peek: true }, { label: "Published", cls: "nw" }, { label: "By" }, { label: "Controls", cls: "nw end" }];
  const resRow = (r) => ({ cells: [K.name(r.title, r.rec && r.rec !== r.by ? `Recorded as ${r.by} by ${r.rec}` : ""), r.state === "draft" ? h.pill("warn", "Draft") : h.pill("ok", "Published"), r.at ? `<span class="num">${esc(mdy(r.at))}</span>` : NONE, r.by ? `<span class="k3e-own">${K.owner(r.by)}</span>` : NONE, r.n ? K.num(r.n) : NONE] });
  function tabResults(a) {
    const L = resultsOf(a);
    return [toPublish(a) ? K.next({ text: "A draft decides nothing: the controls keep their status until the lead assessor publishes.", action: K.btn("Publish results", { sm: true, primary: true, act: "k3e.a.publish", arg: a.id }) }) : "",
      K.table({ label: "Results", cols: RESCOLS, rows: L.map(resRow), empty: { title: "No results yet", line: "Results join here once an objective is judged." } })];
  }
  const CYFCOLS = [{ label: "Finding" }, { label: "Severity", peek: true }, { label: "Then" }, { label: "Remediate within", cls: "nw" }];
  const cyfRows = (a) => cyberFinds().filter((f) => a.phase && f.from === a.phase).map((f) => ({ panel: "v7a-cyf", id: f.id, cells: [K.name(f.title), U.sevPill(f.sev.toLowerCase()), esc(f.then), esc(f.within)] }));
  function tabFindings(a) {
    if (a.kind === "cyber") return [K.table({ label: "Findings", cols: CYFCOLS, rows: cyfRows(a), empty: { title: "No finding yet", line: "What the test finds arrives here and in Findings." } })];
    const L = findingsOfAsm(a.id).slice().sort(sortF);
    return [K.table({ label: "Findings", cols: FCOLS, rows: L.map((f) => findingRow(f, false, f.kind)), empty: { title: "No finding", line: a.kind === "check" ? "A failing run's results arrive here and in Findings." : "A determination short of satisfied opens a finding at once." }, foot: `<span class="num">${plural(L.length, "finding")}</span>` })];
  }
  const COVCOLS = [{ label: "Control" }, { label: "Status", cls: "nw", peek: true }];
  function tabCheck(a) {
    const nx = nextOf(a);
    return K.aside([nx ? K.next(nx) : "", K.related({ title: "What it covers", count: a.covers.length, cols: COVCOLS, rows: a.covers.map((code) => U.ctlRow(code)), empty: "It names no control" })], [K.details("Details", detailFacts(a))]);
  }
  const RUNCOLS = [{ label: "Run", cls: "nw" }, { label: "Result", cls: "nw", peek: true }, { label: "By" }, { label: "Note", cls: "main" }];
  const runRows = (a) => {
    const mine = runsOf(a.check).slice().reverse(), seedN = a.nruns - mine.length;
    const rows = mine.map((r) => ({ cells: [`<span class="num">${esc(mdy(r.at))}</span>`, h.pill(r.result === "Failed" ? "bad" : "ok", r.result), `<span class="k3e-own">${K.owner(r.by)}</span>`, esc(r.note || "")] }));
    if (a.lastRun && seedN > 0) rows.push({ cells: [`<span class="num">${esc(runsOf(a.check).length ? (checkRuns()[a.check] || {}).last || "" : a.lastRun)}</span>`, h.pill(a.failing ? "bad" : "ok", a.failing ? "Failed" : "Passed"), `<span class="k3e-own">${K.owner(a.lead)}</span>`, a.failing ? esc(`${plural(a.failing, "result")} failing`) : ""] });
    return { rows, older: seedN > rows.length - mine.length };
  };
  function tabRuns(a) {
    const { rows, older } = runRows(a);
    return [K.table({ label: "Runs", cols: RUNCOLS, rows, empty: { title: "No run recorded", line: "Record each run: a failing one opens findings.", action: K.btn("Record a run", { sm: true, act: "k3e.a.run", arg: a.id }) }, foot: `<span class="num">${plural(a.nruns, "run")}${older ? " · the latest shown" : ""}</span>` })];
  }
  const testsSec = (a) => K.section({ title: "What it tests", body: `<p class="k3e-p">${esc(a.name)}: phase ${esc(a.phase || "")} of the cyber test and evaluation sequence. Its findings arrive in Findings with their plans.</p>` });
  function cyberOverview(a) {
    const nx = nextOf(a);
    return K.aside([nx ? K.next(nx) : "", testsSec(a)], [K.details("Details", detailFacts(a))]);
  }
  function recordPage(route, m) {
    const a = byId(m[1]), tab = m[2] || "";
    if (!a) return K.page({ cls: "k3e", head: K.head({ crumbs: [["Assessments", "assessments"], ["Not found"]], title: "This assessment is not here" }), body: K.empty({ title: "No assessment has that address", line: "It may belong to another program.", action: K.link("Open Assessments", "assessments") }) });
    const hd = head(a, tab);
    const body = a.kind === "control" ? (tab === "objectives" ? tabObjectives(a) : tab === "requests" ? tabRequests(a) : tab === "results" ? tabResults(a) : tab === "findings" ? tabFindings(a) : tabPlan(a)) : a.kind === "cyber" ? (tab === "findings" ? tabFindings(a) : cyberOverview(a)) : tab === "runs" ? tabRuns(a) : tab === "findings" ? tabFindings(a) : tabCheck(a);
    return K.page({ cls: "k3e", head: hd.head, tabs: hd.tabs, body });
  }
  // An assessment's preview (the eye on its row, wherever a row goes to its page): its facts, then every tab and section of
  // the page as a short list of the same rows, each with a way to all of them.
  K.record("k3e-asm", { route: (id) => "assessment--" + id });
  K.panel("k3e-asm", (raw) => {
    const a = byId(String(raw || "").split("|")[0]); if (!a) return null;
    const nx = nextOf(a), base = a.route, c = counts(a), five = (list) => list.slice(0, 5);
    const fL = a.kind === "cyber" ? [] : findingsOfAsm(a.id).slice().sort(sortF);
    const findSec = a.kind === "cyber" ? K.related({ title: "Findings", cols: CYFCOLS, rows: cyfRows(a), empty: "No finding yet", all: { go: base + "--findings" } })
      : K.related({ title: "Findings", count: fL.length, cols: FCOLS, rows: five(fL).map((f) => findingRow(f, false, f.kind)), empty: "No finding", all: { go: base + "--findings" } });
    let sections;
    if (a.kind === "control") {
      const L = ctlsOf(a.id), objs = [], Q = requestsOf(a), R = resultsOf(a);
      for (const code of L) { if (objs.length >= 5) break; objs.push(...objEntries(code)); }
      sections = [K.related({ title: "Plan approval", cols: STEPCOLS, rows: stepRows(a) }),
        a.id === "init" ? "" : K.related({ title: "Controls in the plan", count: L.length, cols: PCTLCOLS, rows: five(L).map(planCtlRow), empty: "The plan names no control yet" }),
        K.related({ title: "Objectives", count: c.objectives, cols: OCOLS, rows: five(objs).map((r) => objRow(a, r, false, true)), empty: "No objective yet", all: { go: base + "--objectives" } }),
        K.related({ title: "Requests", count: Q.length, cols: QCOLS, rows: five(Q).map((r) => reqRow(a, r, true)), empty: "No request yet", all: { go: base + "--requests" } }),
        K.related({ title: "Results", count: R.length, cols: RESCOLS, rows: five(R).map(resRow), empty: "No results yet", all: { go: base + "--results" } }),
        findSec];
    } else if (a.kind === "cyber") sections = [testsSec(a), findSec];
    else sections = [K.related({ title: "What it covers", count: a.covers.length, cols: COVCOLS, rows: a.covers.map((code) => U.ctlRow(code)), empty: "It names no control" }),
      K.related({ title: "Runs", count: a.nruns, cols: RUNCOLS, rows: five(runRows(a).rows), empty: "No run recorded", all: { go: base + "--runs" } }), findSec];
    return { label: KINDW[a.kind], title: a.short || a.name, chip: stPill(a.status), facts: detailFacts(a), sections: [nx ? K.next(nx) : ""].concat(sections) };
  });
''', "  }")

rep(609, 611, '  K.on("k3e.a.octl"', r'''
  const objAsm = () => (/^assessment--([\w-]+?)--(objectives|requests)$/.exec(cur()) || [])[1] || "";
  K.on("k3e.a.octl", (code) => { const id = objAsm(); if (id) { setO(id, { ctl: code || "" }); K.redraw(); } });
  K.on("k3e.a.oq", (q) => { const id = objAsm(); if (id) { setO(id, { q: q || "" }); K.redraw(); } });
  K.on("k3e.a.ochip", (chip) => { const id = objAsm(); if (id) { setO(id, { chip: chip || "all" }); K.redraw(); } });
  const setQ = (patch) => { const id = objAsm(); if (!id) return; K.set("asmq.view", Object.assign({}, view("asmq"), { [id]: Object.assign({}, qview(id), patch) })); K.redraw(); };
  K.on("k3e.a.rq", (q) => setQ({ q: q || "" }));
  K.on("k3e.a.rst", (st) => setQ({ st: st || "" }));
''', '  K.on("k3e.a.ochip"')

rep(693, 721, "  function registerPage() {", r'''
  const askR = (v) => risks().filter((r) => (!v.sev || r.sev === v.sev) && (!v.tech || r.tech.some((t) => t[0] === v.tech)) && matchQ(v.q, `${r.title} ${r.threat} ${r.owner} ${r.tech.map((t) => t.join(" ")).join(" ")}`));
  const RISKCOLS = [{ label: "Risk" }, { label: "Severity", peek: true }, { label: "Response" }, { label: "Findings", cls: "nw end" }, { label: "Techniques", cls: "nw" }, { label: "Response due", cls: "nw" }, { label: "Owner" }];
  function registerPage() {
    const v = Object.assign({ chip: "open", q: "", sev: "", tech: "" }, view("rsk")), all = risks(); if (!CHIPR[v.chip]) v.chip = "open";
    const narrowed = askR(v);
    const rows = narrowed.filter(CHIPR[v.chip]).sort((a, b) => (SEVN[b.sev] || 0) - (SEVN[a.sev] || 0) || String(a.due || "9").localeCompare(String(b.due || "9")));
    const chip = (id, label) => ({ id, label, count: narrowed.filter(CHIPR[id]).length, on: v.chip === id });
    const techOpts = uniq(all.flatMap((r) => r.tech.map((t) => t[0])).concat(v.tech ? [v.tech] : [])).sort().map((c) => [c, `${c} ${techName(c)}`.trim(), risksOfTech(c).length]);
    return K.page({ cls: "k3e", head: headOf(), tabs: tabs("risks"), body: [
      K.chips([{ id: "", label: "Open", count: narrowed.length, on: v.chip === "open" }, chip("noowner", "No owner"), chip("late", "Response past due"), chip("accept", "Acceptance requested")], "k3e.r.chip", "State"),
      K.toolbar({ id: "risks", noun: "risks", search: { act: "k3e.r.q", value: v.q, placeholder: "Search risks" },
        filters: [{ label: "Severity", key: "severity", act: "k3e.r.sev", value: v.sev, options: Object.keys(SEVW).filter((k) => v.sev === k || all.some((r) => r.sev === k)).map((k) => [k, SEVW[k], all.filter((r) => r.sev === k).length]) }, techOpts.length ? { label: "Technique", key: "technique", act: "k3e.r.ftech", value: v.tech, options: techOpts } : null],
        views: { total: all.length, count: (st) => askR({ sev: st.severity || "", tech: st.technique || "", q: st.q || "" }).filter(CHIPR[st.state] || CHIPR.open).length, seed: [{ name: "High, response past due", state: { state: "late", severity: "high" }, by: U.ISSM }] } }),
      K.table({ label: "Risks", cols: RISKCOLS,
        rows: rows.map((r) => { const n = findingsOfRisk(r.id).length; return { panel: "k3e-risk", id: r.id, cells: [K.name(r.title, r.threat), sevPill(r.sev), esc(respWord(r)), n ? K.num(n) : NONE, r.tech.length ? `<span class="num k3e-mu">${esc(r.tech.slice(0, 2).map((t) => t[0]).join(", "))}${r.tech.length > 2 ? ` +${r.tech.length - 2}` : ""}</span>` : NONE, r.due ? `<span class="num${late(r) ? " k3e-late" : ""}">${esc(md(r.due))}</span>` : NONE, `<span class="k3e-own">${K.owner(r.owner)}</span>`] }; }),
        empty: all.length ? { title: "No risk matches", line: "Clear the search and the filters." } : { title: "No risk yet", line: "A risk says what a finding could lead to, how likely and how bad, and what is done about it.", action: K.btn("Create risk", { sm: true, act: "k3e.r.new" }) }, foot: `<span class="num">${plural(rows.length, "risk")}</span>` })] });
  }
  const techList = () => allTechs().map((t) => { const rs = risksOfTech(t.code); return Object.assign({ rs, worst: rs.map((r) => r.sev).sort((a, b) => (SEVN[b] || 0) - (SEVN[a] || 0))[0] || "" }, t); });
  const askT = (v) => techList().filter((t) => (!v.tmx || t.matrix === v.tmx) && (!v.trs || (v.trs === "named") === t.rs.length > 0) && matchQ(v.tq, `${t.code} ${t.name} ${t.tactics}`));
  function threatsPage() {
    const v = Object.assign({ tq: "", tmx: "", trs: "" }, view("rsk")), base = techList();
    const L = askT(v).sort((a, b) => (SEVN[b.worst] || 0) - (SEVN[a.worst] || 0) || b.rs.length - a.rs.length || a.code.localeCompare(b.code));
    const named = base.filter((t) => t.rs.length).length;
    return K.page({ cls: "k3e", head: headOf(), tabs: tabs("threats"), body: [
      K.toolbar({ id: "techniques", noun: "techniques", search: { act: "k3e.r.tq", value: v.tq, placeholder: "Search techniques" },
        filters: [{ label: "Matrix", key: "matrix", act: "k3e.r.tmx", value: v.tmx, options: uniq(base.map((t) => t.matrix).filter(Boolean)).sort().map((m) => [m, m, base.filter((t) => t.matrix === m).length]) }, { label: "Risks", key: "risks", act: "k3e.r.trs", value: v.trs, options: [["named", "Named by a risk", named], ["none", "Named by no risk", base.length - named]] }],
        views: { total: base.length, count: (st) => askT({ tq: st.q || "", tmx: st.matrix || "", trs: st.risks || "" }).length, seed: [{ name: "Named by a risk", state: { risks: "named" }, by: U.ISSM }] } }),
      K.table({ label: "ATT&CK techniques", cols: [{ label: "ATT&CK technique" }, { label: "Matrix", cls: "nw" }, { label: "Risks", cls: "nw end" }, { label: "Worst", cls: "nw" }, { label: "Countering controls", cls: "nw" }],
        rows: L.map((t) => ({ panel: "k3e-tech", id: t.code, cells: [K.name(t.name, t.tactics, t.code), esc(t.matrix), t.rs.length ? K.num(t.rs.length) : NONE, t.worst ? sevPill(t.worst) : NONE, t.counter ? `<span class="num">${esc(t.counter)}</span>` : NONE] })),
        empty: { title: wsx() && base.length ? "No technique matches" : "No technique named yet", line: wsx() && base.length ? "Clear the search and the filters." : "Link an ATT&CK technique on a risk's page: it then lists here with its risks." }, foot: `<span class="num">${plural(L.length, "technique")}</span>` })] });
  }
  V3.S(/^risks(-snapshots|-library)?$/, () => registerPage());
  K.screen("risks-threats", threatsPage, "risks");
  // Each works with the value alone ("" clears), so a view can ask the list's whole question again.
  const rset = (patch) => { setView("rsk", patch); K.redraw(); };
  K.on("k3e.r.chip", (id) => rset({ chip: id || "open" }));
  K.on("k3e.r.q", (q) => rset({ q: q || "" }));
  K.on("k3e.r.sev", (sev) => rset({ sev: sev || "" }));
  K.on("k3e.r.ftech", (tech) => rset({ tech: tech || "" }));
  K.on("k3e.r.tq", (tq) => rset({ tq: tq || "" }));
  K.on("k3e.r.tmx", (tmx) => rset({ tmx: tmx || "" }));
  K.on("k3e.r.trs", (trs) => rset({ trs: trs || "" }));
  K.on("k3e.r.tech", (tech) => { setView("rsk", { tech: tech || "", chip: "open" }); K.go("risks"); });
''', '  K.on("k3e.r.tech"')

rep(755, 786, "  const techRow = (r, c, n, page) =>", r'''
  const TCOLS = [{ label: "Technique" }, { label: "Matrix", cls: "nw", peek: true }, { label: "Countering controls", cls: "nw" }, { label: "", cls: "tight" }];
  const techRow = (r, c, n) => { const t = allTechs().find((x) => x.code === c) || {}, un = addedTech(r, c) ? K.btn("Unlink", { sm: true, quiet: true, act: "k3e.r.techrm", arg: { id: r.id, code: c } }) : ""; return { panel: "k3e-tech", id: c, cells: [K.name(n, t.tactics || "", c), esc(t.matrix || ""), t.counter ? `<span class="num">${esc(t.counter)}</span>` : NONE, un] }; };
  const RFCOLS = [{ label: "Finding" }, { label: "Severity", peek: true }, { label: "Plan", cls: "nw", peek: true }, { label: "Owner" }];
  K.panel("k3e-risk", (raw, opt) => {
    const page = !!(opt && opt.page), id = String(raw || "").split("|")[0], r = riskById(id); if (!r) return null;
    const fs = findingsOfRisk(id), nx = nextOf(r), a = r.acc, due = get("rdue", {})[id] || r.due;
    const accSec = r.resp === "accept" || a ? K.section({ title: "Acceptance", actions: !a || a.state === "returned" ? K.btn("Request acceptance", { sm: true, act: "k3e.r.accreq", arg: id }) : "", body: a
      ? [K.facts([["Why", esc(a.reason || "")], ["Until", a.until ? `<span class="num">${esc(mdy(a.until))}</span>` : NONE]]), K.table({ label: "Acceptance steps", cols: [{ label: "Step" }, { label: "State", cls: "tight", peek: true }], rows: (CH.STEPS || []).map(([n, role, who]) => { const done = a.state === "accepted" || n < a.step, turn = a.state === "requested" && n === a.step; return { cells: [K.name(`${n}. ${role}`, who), done ? h.pill("ok", n === 3 ? "Accepted" : "Approved") : turn ? K.btn(`Record as ${who}`, { sm: true, act: "k3e.r.accstep", arg: id }) : a.state === "returned" && n === a.step ? h.pill("warn", "Sent back") : mu("Waits")] }; }) })]
      : `<div class="k3-none-row"><span>Not requested yet</span>${K.actLink("Request acceptance", "k3e.r.accreq", id)}</div>` }) : "";
    const menu = K.menu("More", [{ label: "Edit assessment", act: "k3e.r.assess", arg: id }, { label: "Change response", act: "k3e.r.resp", arg: id }, { label: r.owner ? "Change owner" : "Assign owner", act: "k3e.r.owner", arg: id }], { sm: !page });
    const threat = r.threat ? K.section({ title: "Threat", body: `<p class="k3e-p">${esc(r.threat)}</p>` }) : "";
    // What the page lists, the preview lists: the findings behind it and the techniques it names, the same rows.
    const fSec = K.related({ title: "Findings behind it", count: fs.length, add: { label: "Link findings", act: "k3e.r.fadd", arg: id }, cols: RFCOLS, rows: fs.slice().sort(U.sortF).map((f) => ({ panel: "k3e-finding", id: f.id, cells: [K.name(f.title, U.whereOf(f)), U.sevCol(f), U.planCell(f), U.ownCell(f.owner)] })), empty: "No finding is linked" });
    const tSec = K.related({ title: "ATT&CK techniques", count: r.tech.length, add: { label: "Link technique", act: "k3e.r.techadd", arg: id }, cols: TCOLS, rows: r.tech.map(([c, n]) => techRow(r, c, n)), empty: "It names no technique yet" });
    const body = (pg) => [U.stepLine(nx, pg), threat, accSec, fSec, tSec];
    const out = { label: "Risk", title: r.title, chip: sevPill(r.sev), actions: menu,
      facts: [["Assessment", `${esc(LVW[r.lik] || r.lik || "")} likelihood · ${esc(LVW[r.imp] || r.imp || "")} impact ${K.actLink("Edit", "k3e.r.assess", id)}`], ["Response", `${esc(respWord(r))} ${K.actLink("Change", "k3e.r.resp", id)}`], ["Owner", `${K.owner(r.owner)} ${K.actLink(r.owner ? "Change" : "Assign", "k3e.r.owner", id)}`], due ? ["Response due", `<span class="num${late(r) ? " k3e-late" : ""}">${esc(mdy(due))}</span>`] : null, r.created ? ["Created", `<span class="num">${esc(mdy(r.created))}</span>`] : null],
      sections: body(false) };
    if (!page) return out;
    const short = U.clip(r.title, 64);
    return Object.assign(out, { title: short, sub: short !== r.title ? esc(r.title) : "", crumbs: [["Risks", "risks"], [U.clip(r.title, 40)]], actions: menu + U.stepBtn(nx, true), sections: body(true) });
  });
  K.panel("k3e-tech", (code, opt) => {
    const page = !!(opt && opt.page), t = allTechs().find((x) => x.code === code); if (!t) return null;
    const rs = risksOfTech(code), cc = counterOf(code), link = { label: "Link to a risk", act: "k3e.t.link", arg: code };
    const ccRow = (c) => { const st = inBaseline(c) ? V3.fact("status", c) : null, cells = [K.name(U.ctlTitle(c) || c, "", U.ctlTitle(c) ? c : ""), inBaseline(c) ? "In the baseline" : mu("Not selected"), st ? U.detPill(st) : NONE]; return U.ctlRoute(c) ? { panel: "k3c-control", id: c, cells } : { cells }; };
    const out = { label: "ATT&CK technique", title: t.name, code, chip: K.tagged(t.matrix), facts: [["Tactics", t.tactics ? esc(t.tactics) : NONE], ["Printed in", esc(t.matrix === "ICS" ? "NIST SP 800-160 Vol. 2, Appendix G" : "NIST SP 800-160 Vol. 2, Appendix F")], page ? ["Risks", rs.length ? K.actLink(plural(rs.length, "risk"), "k3e.r.tech", code) : mu("None")] : null],
      sections: [K.related({ title: "Risks that name it", count: rs.length, add: page ? null : link, cols: U.RCOLS, rows: rs.map((r) => U.riskRow(r)), empty: "No risk names it yet" }),
        K.related({ title: "Countering controls", count: cc.length, cols: [{ label: "Control" }, { label: "Baseline", cls: "nw", peek: true }, { label: "Status", cls: "nw", peek: true }], rows: cc.map(ccRow), empty: "The appendix prints no control against it" })] };
    return page ? Object.assign(out, { crumbs: [["Risks", "risks"], ["Threats", "risks-threats"], [code]], actions: K.btn(link.label, { primary: true, act: link.act, arg: link.arg, icon: "plus" }) }) : out;
  });
''', "  });")

at(811, '    out.push({ part: "Security assessment report"')
assert 'open: drafts.length ? "Open the results" : "Open Assessments" });' in L[810]
L[810] = L[810].replace('open: drafts.length ? "Open the results" : "Open Assessments" });', 'open: drafts.length ? "Open the results" : "Open Assessments", peek: drafts.length === 1 ? { panel: "k3e-asm", id: drafts[0].id } : null });')

at(827, '      K.section({ title: "What the package holds"')
L[826] = r'''      K.section({ title: "What the package holds", count: L.length, body: K.table({ label: "Package", cols: [{ label: "Part" }, { label: "Holds" }, { label: "Ready", cls: "nw" }, { label: "State" }], rows: L.map((x) => Object.assign(x.act ? { act: "k3e.z.open", arg: { go: x.go, set: x.act } } : { go: x.go }, x.peek && !x.act ? { peek: x.peek } : {}, { cells: [K.name(x.part), esc(x.holds), h.pill(x.ready ? "ok" : "warn", x.ready ? "Ready" : "Not ready"), mu(esc(x.state))] })) }) })],'''

at(845, '    return [K.related({ title: "What ongoing authorization owes"')
L[844] = r'''    return [K.related({ title: "What ongoing authorization owes", count: checks.length, cols: [{ label: "Report or check" }, { label: "Cadence", cls: "nw" }, { label: "Next", cls: "nw" }, { label: "State", cls: "nw", peek: true }], rows: checks.map((a) => ({ panel: "k3e-asm", id: a.id, cells: [K.name(a.name, a.covers && a.covers.length ? a.covers.join(", ") : ""), esc(a.cadence), a.due ? `<span class="num${a.status === "Overdue" ? " k3e-late" : ""}">${esc(md(a.due))}</span>` : NONE, h.pill(a.status === "Overdue" ? "bad" : a.status === "Due soon" ? "warn" : "ok", a.status)] })), empty: f ? "No monitoring check is planned yet: plan them on Assessments" : "Monitoring starts with the first decision" }),'''

at(850, '    return [K.toolbar({ right: K.btn("Share with a person"')
L[849] = L[849].replace('K.toolbar({ right:', 'K.toolbar({ views: false, right:')

for first, last, text in sorted(R, reverse=True):
    L[first - 1:last] = text.split("\n")
io.open(F, "w", encoding="utf-8").write("\n".join(L))
print("patched", len(R), "regions; lines now", len(L))
