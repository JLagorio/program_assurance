import sys
f=sys.argv[1]; s=open(f).read()
def rep(a_mark, b_mark, new, incl_b=False):
    global s
    a=s.index(a_mark); b=s.index(b_mark, a)
    s=s[:a]+new+s[b:]
# 1. the page: next line, rows, sections
rep('    const next = g.done ? ""\n', '    return {\n      label: "Gate", title: g.title', '''    return {
      label: "Gate", title: g.title''')
old_sections = s[s.index('      sections: [\n        next,\n'):s.index('  // The preview: the short form, with Open gate.')]
new_sections = '''      sections: [
        nextLine(g),
        g.dls.length ? K.section({ title: "Deliverables", count: g.total ? `${g.ready} of ${g.total} ready` : null, body: K.table({ label: "Deliverables", cols: DL_COLS, rows: dlRows(g) }) })
          : g.total ? K.section({ title: "Deliverables", count: `${g.ready} of ${g.total} ready`, body: K.note("This program's deliverables are counted from its records but not listed yet.") }) : "",
        K.related({ id: "k3o-crit", title: "Criteria", count: g.criteria ? `${g.met} of ${g.criteria} met` : 0, add: g.done ? null : { label: "Add criterion", act: "ov.critadd", arg: g.id }, cols: critCols(g), rows: critRows(g), empty: "No criteria on this gate yet" }),
        conds.length ? K.section({ title: "Actions", count: conds.length, body: K.table({ label: "Actions", cols: ACT_COLS, rows: actRows(conds) }) }) : "",
      ],
    };
  }
'''
s=s.replace(old_sections,new_sections)
# 2. shared builders before gatePage
builders = r'''  // Pass 3: the gate's three lists, one line a row. The page draws them whole; the preview draws the same rows short (the
  // kit keeps the name and the status). A criterion's sentence is the content, so it is the one cell that wraps.
  const whyOf = (d) => `${d.n != null && !d.ok ? fmt(d.n) + " " : ""}${d.why || ""}`;
  const dlStat = (d) => (d.out ? K.status("With the decision", "none") : K.status(d.ok ? "Ready" : "Not ready", d.ok ? "ok" : "warn"));
  const recOf = (d) => (d.kind === "noreq" ? "controls" : d.kind === "conns" ? (has("system-connections") ? "system-connections" : "interconnections") : d.route);
  const dlHit = (g, d, i) => (!d.ok && !d.out && d.btn ? { act: "ov.dl", arg: { g: g.id, i, p: 1 } } : d.panel && PA.P[d.panel] ? { panel: d.panel, id: d.pid } : recOf(d) && !d.out ? { go: recOf(d) } : {});
  const DL_COLS = [{ label: "Deliverable" }, { label: "Status", cls: "nw", peek: true }, { label: "What holds it back" }, { label: "Owner", cls: "nw" }, { label: "", cls: "tight" }];
  const dlRows = (g, short) => g.dls.map((d, i) => {
    const hit = dlHit(g, d, i), why = whyOf(d);
    if (short) return Object.assign({ cells: [K.name(d.name, why), dlStat(d)] }, hit);
    return Object.assign({ cells: [K.name(d.name), dlStat(d), `<span class="${d.ok || d.out ? "k3-muted" : "k3o-why"}" title="${esc(why)}">${d.n != null && !d.ok ? `<b class="num">${fmt(d.n)}</b> ` : ""}${esc(d.why)}</span>`, d.owner ? K.owner(d.owner) : '<span class="k3-none">—</span>', hit.act ? K.btn(d.btn, { sm: true, act: "ov.dl", arg: hit.arg }) : ""] }, hit);
  });
  const critCell = (c) => `<span class="k3o-crt">${c.code ? `<span class="k3-nm-c">${esc(c.code)}</span> ` : ""}${esc(c.text)}</span>`;
  const critStat = (c) => { const [tone, word] = critWord[c.state] || critWord.na; return c.out ? K.status("With the decision", "none") : K.status(word, tone); };
  const critCols = (g) => [{ label: "Criterion", cls: "wrap" }, { label: "Source" }, { label: "Status", cls: "nw", peek: true }].concat(g.crit.some((c) => c.note) ? [{ label: "What meets it" }] : [], [{ label: "", cls: "tight" }]);
  const critRows = (g, short) => g.crit.map((c) => {
    if (short) return { cells: [critCell(c), critStat(c)] };
    const a = { id: g.id, code: c.code, text: c.text, own: c.own || null }, notes = g.crit.some((x) => x.note);
    return { cells: [critCell(c), c.proc ? `<span title="${esc(c.proc)}">${esc(c.proc)}</span>` : '<span class="k3-none">—</span>', critStat(c)].concat(notes ? [c.note ? `<span title="${esc(c.note)}">${esc(c.note)}</span>` : '<span class="k3-none">—</span>'] : [],
      [c.out || g.done ? "" : `<span class="k3o-acts">${K.btn("Assess", { sm: true, act: "ov.crit", arg: a })}${c.own || c.added ? K.btn("Remove", { sm: true, quiet: true, act: "ov.critrm", arg: a }) : ""}</span>`]) };
  });
  const ACT_COLS = [{ label: "Action" }, { label: "Owner", cls: "nw" }, { label: "Due", cls: "nw" }, { label: "Status", cls: "nw", peek: true }];
  const actRows = (conds) => conds.map((c) => ({ cells: [`<span class="k3-nm"><span class="k3-nm-t" title="${esc(c.t)}">${esc(c.t)}</span></span>`, K.owner(c.owner || null), `<span class="num">${esc(md(c.due))}</span>`, K.status(c.closed ? "Closed" : "Open", c.closed ? "ok" : "none")] }));
  // What holds the gate back, with the button that opens it: the page's first line and the preview's.
  function nextLine(g) {
    if (g.done) return "";
    const who = decider(g), open = g.dls.map((d, i) => [d, i]).filter(([d]) => !d.ok && !d.out), unmet = g.crit.filter((c) => !c.out && c.state !== "met");
    return open.length ? K.next({ text: `${plural(open.length, "deliverable")} ${open.length === 1 ? "holds" : "hold"} ${esc(g.short)} back. Start with ${esc(open[0][0].name)}: ${open[0][0].n != null ? fmt(open[0][0].n) + " " : ""}${esc(open[0][0].why)}.`, action: K.btn(open[0][0].btn || "Open", { sm: true, act: "ov.dl", arg: { g: g.id, i: open[0][1], p: 1 } }) })
      : g.total > g.ready ? K.next({ text: `${plural(g.total - g.ready, "deliverable")} of ${fmt(g.total)} not ready.`, action: "" })
      : unmet.length ? K.next({ text: `Every deliverable is ready. ${plural(unmet.length, "criterion", "criteria")} not met${unmet.some((c) => c.code) ? ` (${esc(unmet.map((c) => c.code).filter(Boolean).join(", "))})` : ""}: assess ${unmet.length === 1 ? "it" : "them"}, or pass with actions.`, action: "" })
      : K.next({ text: `Every deliverable is ready and every criterion met. ${who.name ? `${esc(who.name)} decides.` : `Nobody holds ${esc(who.role)} yet.`}`, action: "" });
  }
'''
m='  // The page. One primary in the header: the decision'
s=s.replace(m, builders+m)
# 3. the preview
a=s.index('  // The preview: the short form, with Open gate.'); b=s.index('  K.panel("k3o-gate", (id, o) => {')
peek = r'''  // The preview: the page's facts and its three lists in short form (five rows, the name and the status, then View all),
  // with Open gate. A row that is not ready opens exactly the records that hold it back, as on the page.
  function gatePeek(g) {
    const who = decider(g), mine = who.name === ME, asked = /^Requested/.test(g.requested), conds = condsOf(g), page = gateRoute(g.id);
    const cr = g.crit.filter((c) => !c.out), crOut = g.crit.filter((c) => c.out);
    const act = g.done ? "" : mine ? K.btn("Record decision", { sm: true, primary: true, act: "ov.decide", arg: { id: g.id } })
      : !who.name ? K.btn("Assign the role", { sm: true, act: "ov.assign", arg: who.role })
      : `${asked ? "" : K.btn("Request decision", { sm: true, primary: true, act: "ov.request", arg: { id: g.id } })}${K.btn(`Record as ${who.name}`, { sm: true, act: "ov.decide", arg: { id: g.id }, title: `The prototype acts as ${who.name}, who decides this step` })}`;
    return {
      label: "Gate preview", title: g.title, chip: stat(g), page, open: "Open gate", actions: act,
      facts: [["Kind", esc(g.kind)], ["Increment", esc(`${incName(g.n)} · ${g.phase}`)], g.decided && g.done ? null : ["Due", g.due ? dueLine(g) : null]].concat(decFacts(g, who, asked)),
      sections: [
        nextLine(g),
        g.dls.length ? K.section({ title: "Deliverables", count: g.total ? `${g.ready} of ${g.total} ready` : null, body: K.table({ label: "Deliverables", cols: [{ label: "Deliverable" }, { label: "Status", peek: true }], rows: dlRows(g, true), total: g.dls.length, all: { go: page } }) }) : "",
        g.crit.length ? K.section({ title: "Criteria", count: cr.length ? `${g.met} of ${g.criteria} met` : crOut.length ? null : 0, body: K.table({ label: "Criteria", cls: "k3-wrap", cols: [{ label: "Criterion" }, { label: "Status", peek: true }], rows: critRows(g, true), total: g.crit.length, all: { go: page } }) }) : "",
        conds.length ? K.section({ title: "Actions", count: conds.length, body: K.table({ label: "Actions", cols: ACT_COLS, rows: actRows(conds), total: conds.length, all: { go: page } }) }) : "",
      ],
    };
  }
'''
s=s[:a]+peek+s[b:]
open(f,'w').write(s)
