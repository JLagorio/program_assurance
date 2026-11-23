import io
B = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto/"
P = B + "mod-zzzz-v3-8c-controls.js"
s = io.open(P, encoding="utf-8").read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (old[:70], s.count(old))
    s = s.replace(old, new)
# the view: a family or a technique, one at a time
rep('''    if (v.out) v.status = "out";
    return Object.assign(v, { chip: "", mini: "", layer: "", out: false });''', '''    if (v.out) v.status = "out";
    if (v.fam && v.tech) v.tech = ""; // the row's first filter holds a family or a technique, one at a time
    return Object.assign(v, { chip: "", mini: "", layer: "", out: false });''')
rep('''      && (!v.tech || (v.tech === "*" ? r.tech.length > 0 : r.tech.some((t) => t.code === v.tech)))
      && (!v.owner || (v.owner === "none" ? !r.owner : r.owner === v.owner))
      && (!v.comp ||''', '''      && (skip.fam || !v.tech || (v.tech === "*" ? r.tech.length > 0 : r.tech.some((t) => t.code === v.tech)))
      && (!v.owner || (v.owner === "none" ? !r.owner : r.owner === v.owner))
      && (!v.comp ||''')
rep('''return v.resp || v.tech || v.owner || v.comp || v.codes ? [] : outs.filter(''', '''return v.resp || (v.tech && !skip.fam) || v.owner || v.comp || v.codes ? [] : outs.filter(''')
rep('''    // The row over the table: Family, Status, Responsibility, Owner, Source, Technique, in the order a person narrows.
    const famRail = K.rail({ label: "Family", key: "family", act: "k3c.fam", items: [{ id: "", label: "All families", count: noFam.length, on: !v.fam }]
      .concat(fams.map((f) => ({ id: f, code: f, label: famName(f), count: noFam.filter((r) => r.fam === f).length, on: v.fam === f }))) });''',
'''    // The row over the table: Family, Status, Responsibility, Owner, Source, in the order a person narrows. A control is grouped by
    // its family or by the resiliency technique it supports, so the first filter offers both, one at a time.
    const tq = isOut ? [] : techs().map((t) => ({ id: "t:" + t.code, label: t.t, count: noFam.filter((r) => r.tech.some((x) => x.code === t.code)).length, on: v.tech === t.code }));
    const famRail = K.rail({ label: v.tech ? "Technique" : "Family", key: "family", act: "k3c.fam", items: [{ id: "", label: "All families", count: noFam.length, on: !v.fam && !v.tech }, { head: "Control family" }]
      .concat(fams.map((f) => ({ id: f, code: f, label: famName(f), count: noFam.filter((r) => r.fam === f).length, on: v.fam === f })),
        tq.length ? [{ head: "Resiliency technique" }, { id: "t:*", label: "Any technique", count: noFam.filter((r) => r.tech.length > 0).length, on: v.tech === "*" }].concat(tq) : []) });''')
rep('''    const countState = (st) => askRows(all, outs, normView({ q: st.q || "", fam: st.family || "", status:''', '''    const famOfSt = (g) => (/^t:/.test(g || "") ? { tech: g.slice(2) } : { fam: g || "" });
    const countState = (st) => askRows(all, outs, normView({ q: st.q || "", ...famOfSt(st.family), status:''')
rep('''source: st.source || "", tech: st.technique || "" })).length;''', '''source: st.source || "" })).length;''')
rep('''      { label: "Source", act: "k3c.f.source", value: v.source, options: m.rows.filter((r) => r.on || r.key === v.source).map((r) => [r.key, layerShort(r.key)]) },
      { label: "Technique", act: "k3c.f.tech", value: v.tech, options: [["*", "Any technique"]].concat(techs().map((t) => [t.code, t.t])) },
    ],''', '''      { label: "Source", act: "k3c.f.source", value: v.source, options: m.rows.filter((r) => r.on || r.key === v.source).map((r) => [r.key, layerShort(r.key)]) },
    ],''')
rep('''  K.on("k3c.fam", (id) => { setView(id === "__out" ? { status: "out", fam: "" } : { fam: id || "" }); redraw(); });''',
    '''  K.on("k3c.fam", (id) => { setView(id === "__out" ? { status: "out", fam: "", tech: "" } : /^t:/.test(id || "") ? { tech: id.slice(2), fam: "" } : { fam: id || "", tech: "" }); redraw(); });''')
rep('''  for (const k of ["status", "source", "resp", "tech", "owner"]) K.on("k3c.f." + k, (v) => { setView({ [k]: v || "" }); redraw(); });''',
    '''  for (const k of ["status", "source", "resp", "owner"]) K.on("k3c.f." + k, (v) => { setView({ [k]: v || "" }); redraw(); });
  K.on("k3c.f.tech", (v) => { setView(v ? { tech: v, fam: "" } : { tech: "" }); redraw(); });''')
rep('''    if (tx.length) facts.push(["Technique", esc(tx.map((t) => t.t).join(", "))]);''', '''    if (tx.length) facts.push(["Technique", tx.map((t) => K.actLink(t.t, "k3c.gotech", t.code)).join(", ")]);''')
rep('''  K.on("k3c.gofam", (f) => { put("view", Object.assign({}, VIEW0, { fam: f })); K.go("controls"); });''', '''  K.on("k3c.gofam", (f) => { put("view", Object.assign({}, VIEW0, { fam: f })); K.go("controls"); });
  K.on("k3c.gotech", (t) => { put("view", Object.assign({}, VIEW0, { tech: t })); K.go("controls"); });''')
rep('''(search, views, Family, Status, Responsibility, Owner, Source, Technique, then its
// actions)''', '''(search, views, Family or Technique, Status, Responsibility, Owner, Source, then its
// actions)''')
io.open(P, "w", encoding="utf-8").write(s)
C = B + "mod-zzzz-v3-8c-controls.css"
c = io.open(C, encoding="utf-8").read()
a = c.index("/* The one row over the list (pass 3)."); b = c.index("/* A set another page named")
c = c[:a] + '''/* The one row over the list (pass 3). The kit sizes every control in it. On a window too narrow for what the reader chose, the
   search gives way first, then the chosen filters, each cut with an ellipsis: a filter's name is never cut and the row never breaks. */
@media (min-width: 1360px) {
  .k3c .k3-tb { flex-wrap: nowrap; }
  .k3c .k3-tb .k3-search { flex: 0 50 260px; min-width: 120px; }
  .k3c .k3-tb .k3-flt, .k3c .k3-tb .k3-vmenu, .k3c .k3-tb .k3-clear { flex: none; }
  .k3c .k3-tb .k3-flt.on { flex: 0 1 auto; min-width: 96px; }
  .k3c .k3-tb .k3-flt.on select { max-width: 100%; }
  .k3c .k3-tb .k3-tools-r { flex: 0 1 auto; min-width: 0; }
  .k3c .k3-tb .k3-tools-r > * { flex: none; }
  .k3c .k3-tb .k3-tools-r > .k3c-set { flex: 0 1 auto; }
}
''' + c[b:]
io.open(C, "w", encoding="utf-8").write(c)
print("ok")
