# Pass 3, lane E: the findings half of the module (toolbar in one row, one-line rows, the preview lists what the page lists).
import io, sys
F = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto/mod-zzzz-v3-8e-assure.js"
L = io.open(F, encoding="utf-8").read().split("\n")
def at(n, prefix):
    assert L[n - 1].startswith(prefix), (n, L[n - 1][:80])
R = []  # (first, last, text)
def rep(first, last, prefix, text):
    at(first, prefix); R.append((first, last, text.strip("\n")))

rep(204, 204, "  const fview = (route) =>", r'''
  const fview = (route) => { const v = Object.assign({ chip: "open", q: "", sev: "", comp: "", ctl: "", page: 0 }, view("fnd")); if (!CHIPF[v.chip]) v.chip = "open"; if (route === "findings-poam") v.chip = "poam"; return v; };
''')
rep(208, 208, "  const filtered = (route) =>", r'''
  const narrow = (src, v) => { CC = null; return findings().filter((f) => (!src || f.kind === src) && (!v.sev || f.sev === v.sev) && (!v.comp || onComp(f, compIn(v.comp), compCtls(v.comp))) && (!v.ctl || f.control === v.ctl) && matchQ(v.q, `${f.title} ${whereOf(f)} ${f.control || ""} ${f.owner || ""}`)); };
  const filtered = (route) => { const v = fview(route), src = srcOfRoute(route), base = findings().filter((f) => !src || f.kind === src), narrowed = narrow(src, v); return { v, src, base, narrowed, rows: narrowed.filter(CHIPF[v.chip] || CHIPF.open) }; };
  // A view's count: the same question asked of the view's own state ({ q, source, state, severity, component, control }).
  const countView = (st) => narrow(st.source || "", { q: st.q || "", sev: st.severity || "", comp: st.component || "", ctl: st.control || "" }).filter(CHIPF[st.state] || CHIPF.open).length;
''')
rep(210, 210, "  const planCell = (f) =>", r'''
  const planCell = (f) => { const p = planOfFinding(f); if (!p) return mu("None"); return `<span class="k3e-plan"${f.via ? ' title="The plan of its operational issue"' : ""}>${p.planned ? `<span class="num${p.late ? " k3e-late" : ""}">${esc(md(p.planned))}</span>` : mu("No date")}${p.total ? K.ring(p.reached, p.total, "milestones") : ""}</span>`; };
''')
rep(213, 218, "  const stateTag = (f) =>", r'''
  const stateWord = (f) => (f.state === "draft" ? "Draft results" : f.state === "deact" ? "Deactivated" : f.state === "fixed" ? "Fixed in a newer version" : "");
  const stateTag = (f) => (stateWord(f) ? `<span class="k3e-tag">${K.tagged(stateWord(f))}</span>` : "");
  // One line a finding: its name, then what a person sorts and narrows by, each in a column of its own.
  const SRCW = { issue: "Operational issue", af: "Assessment", vuln: "Vulnerability", stig: "STIG rule" };
  const sevCol = (f) => `${sevCell(f)}${f.state === "draft" ? ` ${mu("draft")}` : ""}`;
  const ownCell = (n) => `<span class="k3e-own">${K.owner(n)}</span>`;
  const ctlCell = (f) => (f.control ? `<span class="num">${esc(f.control)}</span>` : NONE);
  const findingRow = (f, poam, src) => { const p = planOfFinding(f), name = K.name(f.title, [f.state === "deact" || f.state === "fixed" ? stateWord(f) : "", f.kind === "issue" || f.issueId ? f.req || "" : f.where || ""].filter(Boolean).join(" · ")); return { panel: "k3e-finding", id: f.id, cells: poam
    ? [name, sevCol(f), ctlCell(f), p && p.planned ? `<span class="num${p.late ? " k3e-late" : ""}">${esc(mdy(p.planned))}</span>` : mu("No date"), p && p.total ? K.ring(p.reached, p.total, "milestones") : mu("None"), p && p.resources ? esc(p.resources) : NONE, ownCell(f.owner)]
    : [name].concat(src ? [] : [esc(SRCW[f.kind] || f.source || "")], [sevCol(f), ctlCell(f), f.components[0] ? `<span class="k3e-cut">${esc(compName(f.components[0]))}</span>${f.components.length > 1 ? mu(` +${f.components.length - 1}`) : ""}` : NONE, dueCell(f), planCell(f), ownCell(f.owner)]) }; };
  const FCOLS = [{ label: "Finding" }, { label: "Severity", peek: true }, { label: "Control", cls: "nw" }, { label: "Component" }, { label: "Due", cls: "nw" }, { label: "Plan", cls: "nw" }, { label: "Owner" }];
  const FCOLS_ALL = [FCOLS[0], { label: "Source", cls: "nw" }].concat(FCOLS.slice(1));
  const PCOLS = [{ label: "Finding" }, { label: "Severity", peek: true }, { label: "Control", cls: "nw" }, { label: "Planned completion", cls: "nw" }, { label: "Milestones", cls: "nw" }, { label: "Resources" }, { label: "Owner" }];
''')
rep(220, 237, "  function findingsPage(route) {", r'''
  // One list at nine addresses: the source is a filter whose values are addresses, the state a filter, and both are views.
  function findingsPage(route) {
    const { v, src, base, narrowed, rows } = filtered(route), poam = v.chip === "poam";
    const list = rows.slice().sort(sortF), page = Math.min(v.page || 0, Math.max(0, Math.ceil(list.length / PER) - 1));
    const open = findings().filter(isOpen);
    const comps = uniq(open.flatMap((f) => f.components).concat(v.comp ? [v.comp] : [])).map((c) => [c, compName(c)]).sort((a, b) => a[1].localeCompare(b[1]));
    const ctls = uniq(open.map((f) => f.control).filter(Boolean).concat(v.ctl ? [v.ctl] : [])).sort((a, b) => a.localeCompare(b, "en", { numeric: true })).map((c) => [c, c]);
    const chip = (id, label) => ({ id, label, count: narrowed.filter(CHIPF[id]).length, on: v.chip === id });
    const fxn = narrowed.filter(CHIPF.fixed).length, preset = (label, state) => ({ label, state, count: countView(state) });
    return K.page({ cls: "k3e",
      head: K.head({ title: "Findings", actions: K.menu("More", [{ label: "Export POA&M", act: "k3e.export" }, { label: "Import scan results", act: "k3e.import" }]) + K.btn("Add finding", { primary: true, act: "k3e.f.add", icon: "plus" }) }),
      body: [
        K.rail({ label: "Source", key: "source", items: SRCS.map(([id, label, r]) => ({ id, label, go: r, on: src === id, count: open.filter((f) => !id || f.kind === id).length })) }),
        K.chips([{ id: "", label: "Open", count: narrowed.filter(CHIPF.open).length, on: v.chip === "open" }, chip("late", "Past due"), chip("poam", "On the POA&M"), chip("noowner", "No owner"), chip("deact", "Deactivated"), fxn || v.chip === "fixed" ? chip("fixed", "Fixed") : null], "k3e.f.chip", "State"),
        K.toolbar({ id: "findings", noun: "findings", search: { act: "k3e.f.q", value: v.q, placeholder: "Search findings" },
          filters: [{ label: "Severity", key: "severity", act: "k3e.f.sev", value: v.sev, options: Object.keys(SEVW).map((k) => [k, SEVW[k]]) }, comps.length ? { label: "Component", key: "component", act: "k3e.f.comp", value: v.comp, options: comps } : null, ctls.length ? { label: "Control", key: "control", act: "k3e.f.ctl", value: v.ctl, options: ctls } : null],
          views: { total: open.length, count: countView,
            presets: [preset("Past due", { state: "late" }), preset("On the POA&M", { state: "poam" }), preset("No owner", { state: "noowner" })].concat(SRCS.slice(1).map(([id, label]) => preset(label, { source: id }))),
            seed: [{ name: "High, past due", state: { state: "late", severity: "high" }, by: ISSM }] } }),
        K.table({ label: "Findings", cols: poam ? PCOLS : src ? FCOLS : FCOLS_ALL, rows: list.slice(page * PER, page * PER + PER).map((f) => findingRow(f, poam, src)),
          empty: base.length ? { title: "No finding matches", line: "Clear the search and the filters, or choose another state." } : { title: wsx() ? "Nothing found here" : "No finding yet", line: "An assessment's result short of satisfied, a scan's result and what the team notices all arrive here.", action: K.btn("Add finding", { sm: true, act: "k3e.f.add" }) },
          foot: pager(list.length, page, "k3e.f.page") })] });
  }
''')
rep(238, 244, "  const fset = (patch) =>", r'''
  const fset = (patch) => { setView("fnd", Object.assign({ page: 0 }, patch)); if (cur() === "findings-poam" && patch.chip && patch.chip !== "poam") K.go("findings"); else K.redraw(); };
  // Each works with the value alone ("" clears), so a view can ask the list's whole question again.
  K.on("k3e.f.chip", (id) => fset({ chip: id || "open" }));
  K.on("k3e.f.q", (q) => fset({ q: q || "" }));
  K.on("k3e.f.sev", (sev) => fset({ sev: sev || "" }));
  K.on("k3e.f.comp", (comp) => fset({ comp: comp || "" }));
  K.on("k3e.f.ctl", (ctl) => fset({ ctl: ctl || "" }));
  K.on("k3e.f.page", (page) => { setView("fnd", { page }); K.redraw(); });
  K.on("k3e.f.clear", () => fset({ ctl: "", comp: "" }));
''')
rep(319, 319, "  const riskRow = (r) =>", r'''
  const RCOLS = [{ label: "Risk" }, { label: "Severity", peek: true }, { label: "Response" }, { label: "Owner" }];
  const riskRow = (r) => ({ panel: "k3e-risk", id: r.id, cells: [K.name(r.title), sevPill(r.sev), esc(respWord(r)), ownCell(r.owner)] });
''')
rep(339, 379, '  K.panel("k3e-finding", (raw, opt) => {', r'''
  K.panel("k3e-finding", (raw, opt) => {
    const page = !!(opt && opt.page), f = findingById(String(raw || "")) || findingById(String(raw || "").split("|")[0]); if (!f) return null;
    const src = f.via ? findingById(f.via) : null, pf = src || f, p = planOfFinding(pf), r = riskOfFinding(f) || (src ? riskOfFinding(src) : null), nx = nextOfFinding(f), a = f.asm ? assessmentById(f.asm) : null;
    const carry = !f.components.length && f.kind === "af" ? compsOfCtl(f.control) : [], where = f.components.length ? f.components : carry;
    const facts = [
      ["Source", a ? `${esc(f.source)} · ${K.link(a.short || a.name, a.route + (f.kind === "af" ? "--findings" : ""))}` : esc(f.source)],
      f.objective ? ["Objective", `<span class="num">${esc(f.objective)}</span>${f.methods && f.methods.length ? mu(" · " + f.methods.map((m) => m[0].toUpperCase() + m.slice(1)).join(", ")) : ""}`] : null,
      f.req ? ["Requirement", K.recRoute && P["k3d-req"] ? K.link(f.req, recGo("k3d-req", f.req)) : `<span class="num">${esc(f.req)}</span>`] : null,
      ["Owner", `${K.owner(f.owner)} ${K.actLink(f.owner ? "Change" : "Assign", "k3e.f.owner", f.id)}`],
      f.due ? ["Remediate by", `<span class="num${f.late ? " k3e-late" : ""}">${esc(mdy(f.due))}</span>${f.late ? mu(` · ${plural(days(TODAY, f.due), "day")} past`) : ""}`] : null,
      f.opened ? ["Found", `<span class="num">${esc(mdy(f.opened))}</span>${f.by ? mu(` · recorded as ${esc(f.by)}${f.rec && f.rec !== f.by ? " by " + esc(f.rec) : ""}`) : ""}`] : null,
      f.state === "deact" && f.deact ? ["Deactivated", `${esc(f.deact.reason)}${mu(` · ${esc(md(f.deact.at))} · ${esc(f.deact.by || "")}`)}`] : null,
      f.state === "deact" && f.deact && f.deact.note ? ["Why", esc(f.deact.note)] : null,
      f.fixedOn && f.fixedOn.length ? ["Fixed", `${f.fixedOn.map(compLink).join(", ")} took a version that fixes it`] : null,
    ];
    // What the page lists, the preview lists: the kit draws each table there as a short list of the same rows.
    const hist = p ? get("hist", {})[p.id] || [] : [];
    const msDone = (m) => m.done || m.status === "completed";
    const msAct = (m) => (msDone(m) ? (m.done && get("msd", {})[p.id + ":" + m.key] ? K.btn("Undo", { sm: true, quiet: true, act: "k3e.f.msdone", arg: { plan: p.id, key: m.key, undo: true } }) : "") : K.btn("Mark reached", { sm: true, quiet: true, act: "k3e.f.msdone", arg: { plan: p.id, key: m.key } }));
    const msState = (m) => (msDone(m) ? h.pill("ok", "Reached") : m.planned && iso(m.planned) < TODAY ? h.pill("bad", "Past its date") : m.status === "in_progress" ? h.pill("info", "Under way") : h.pill("none", "Planned"));
    const msTable = p && p.ms.length ? K.table({ label: "Milestones", cols: [{ label: "Milestone" }, { label: "Planned", cls: "nw", peek: true }, { label: "State", cls: "nw", peek: true }, { label: "", cls: "tight" }], rows: p.ms.map((m) => ({ cells: [K.name(m.title), m.planned ? `<span class="num">${esc(mdy(m.planned))}</span>` : NONE, msState(m), msAct(m)] })) }) : "";
    const planSec = p
      ? K.section({ title: "Plan", count: p.total, actions: K.btn("Add milestone", { sm: true, act: "k3e.f.ms", arg: pf.id, icon: "plus" }), body: [
        K.facts([["Plan", esc(p.title)], p.text ? ["How", esc(p.text)] : null, ["Planned completion", `${p.planned ? `<span class="num${p.late ? " k3e-late" : ""}">${esc(mdy(p.planned))}</span>` : mu("No date")} ${K.actLink("Change planned date", "k3e.f.move", pf.id)}`], hist.length ? ["Moved", `${hist.length === 1 ? "Once" : hist.length + " times"}${mu(" · " + esc(hist[hist.length - 1].reason))}`] : null, ["Resources", `${p.resources ? esc(p.resources) : mu("None recorded")} ${K.actLink(p.resources ? "Edit" : "Add", "k3e.f.res", pf.id)}`], f.via ? ["Belongs to", K.link(clip((src || {}).title || "its operational issue", 60), recGo("k3e-finding", f.via))] : null]),
        msTable || `<div class="k3-none-row"><span>No milestone yet</span>${K.actLink("Add milestone", "k3e.f.ms", pf.id)}</div>`] })
      : K.section({ title: "Plan", body: `<div class="k3-none-row"><span>No plan yet: with one, the finding is on the POA&amp;M</span>${f.state === "deact" || f.state === "fixed" ? "" : K.actLink("Create plan", "k3e.f.plan", f.id)}</div>` });
    const riskSec = K.related({ title: "Risk", count: r ? 1 : 0, add: r ? null : { label: "Create risk", act: "k3e.f.risk", arg: f.id }, more: r ? "" : K.btn("Link a risk", { sm: true, quiet: true, act: "k3e.f.rlink", arg: f.id }), cols: RCOLS, rows: r ? [riskRow(r)] : [], empty: "No risk rests on it yet" });
    const found = f.note || f.text || (f.cve ? `${f.cve.title}. CVSS ${f.cve.cvss || "—"}${f.cve.iava ? " · " + f.cve.iava : ""} · ${f.cve.status}.` : "") || (f.stig ? `${f.stig.stig} on ${f.stig.asset}: the rule is open.` : "");
    const foundSec = found ? K.section({ title: "What was found", body: `${f.text ? `<p class="k3e-p">${esc(f.text)}</p>` : ""}${f.note || !f.text ? `<p class="k3e-p">${esc(f.note || found)}</p>` : ""}` }) : "";
    const ctlSec = K.related({ title: "Control", count: f.control ? 1 : 0, cols: [{ label: "Control" }, { label: "Status", cls: "nw", peek: true }], rows: f.control ? [ctlRow(f.control)] : [], empty: "It names no control" });
    const compSec = K.related({ title: f.components.length || !carry.length ? "Components" : `Components that carry ${f.control}`, count: where.length, cols: [{ label: "Component" }, { label: "Kind", cls: "nw", peek: true }], rows: where.map(compRow), empty: "It stands on the system as a whole" });
    const menu = K.menu("More", [{ label: f.owner ? "Change owner" : "Assign owner", act: "k3e.f.owner", arg: f.id }, p ? { label: "Change planned date", act: "k3e.f.move", arg: pf.id } : null, f.state === "fixed" ? null : f.state === "deact" ? { label: "Reactivate", act: "k3e.f.react", arg: f.id } : { label: "Deactivate", act: "k3e.f.deact", arg: f.id, danger: true }], { sm: !page });
    const body = (pg) => [stepLine(nx, pg), foundSec, planSec, riskSec, ctlSec, compSec];
    const out = { label: SRC[f.kind], title: f.title, chip: `${sevCell(f)}${stateTag(f)}`, actions: menu, facts, sections: body(false) };
    if (!page) return out;
    // The page: a short title with the full sentence under it, and the next step's button as the header's one primary.
    const short = clip(f.title, 64), srcTab = SRCS.find((x) => x[0] === f.kind) || SRCS[0];
    return Object.assign(out, { title: short, sub: short !== f.title ? esc(f.title) : "", crumbs: [["Findings", "findings"], [srcTab[1], srcTab[2]], [clip(f.title, 40)]], actions: menu + stepBtn(nx, true), sections: body(true) });
  });
''')
at(384, "    u: {")
assert "findingRow, FCOLS," in L[383]
L[383] = L[383].replace("findingRow, FCOLS,", "findingRow, FCOLS, FCOLS_ALL, RCOLS, ownCell, sevCol, stateWord,")
for first, last, text in sorted(R, reverse=True):
    L[first - 1:last] = text.split("\n")
io.open(F, "w", encoding="utf-8").write("\n".join(L))
print("patched", len(R), "regions; lines now", len(L))
