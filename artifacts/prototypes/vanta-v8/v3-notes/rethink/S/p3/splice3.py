import sys
p = sys.argv[1]; L = open(p).read().split("\n")
def at(n, prefix): assert L[n-1].lstrip().startswith(prefix), (n, L[n-1][:80])
d = "/".join(__file__.split("/")[:-1]) + "/"
T = open(d + "T.js").read().rstrip("\n").split("\n"); P = open(d + "P.js").read().rstrip("\n").split("\n")
at(670, "const { route, pill, rowBtn, stop, clink, curComp, ctlPanel } = U;"); at(675, "const tabState = "); at(680, 'K.on("k3s.tf"'); at(687, "const two = "); at(688, "const respCell = "); at(799, "const tools = "); at(831, "if ((P0.els || []).length)"); at(832, "if (!isProv) body.push(K.related"); at(835, "function tabSoftware"); at(890, "}"); at(891, "K.lazy(RE"); at(899, "// ——— A component named on another page"); at(900, 'K.panel("k3s-comp"'); at(906, "});"); at(907, 'for (const k of ["v7p-el"')
L[898:906] = P
L[834:890] = T
L[831] = '    if (!isProv) body.push(K.related({ title: "Connections", add: { label: "Add connection", act: "k3s.addConn", arg: c.code }, empty: "No connection to this system yet", cols: [{ label: "Connection" }, { label: "Component", cls: "k3s-w" }, { label: "Agreement", cls: "nw", peek: true }, { label: "Expires", cls: "nw" }], rows: xs.map((x) => ({ panel: "k3s-conn", id: x.id, cells: [K.name(x.name, x.iface || "", ""), firstN(D.endsOf(x).filter((e) => e !== c.code).map((e) => esc(D.nameOf(e)))), agrPill(x), agrExp(x)] })) }));'
L[830] = "    body.push(carriesSec(c, P0));"
L[798] = '  const tools = (code, tab, o) => { const st = tabState(code, tab); return K.toolbar({ id: o.id || "", noun: o.noun || "", views: o.id ? o.views || {} : false, search: o.search ? { act: "k3s.tq", value: st.q, placeholder: o.search } : null, filters: o.filters || [], right: o.add || "" }); };'
L[686:688] = [
 "  // A control's responsibility on one line: whose it is and, where a provider carries it, which one. A provider with no",
 "  // authorization of its own is the state to see first, so it takes the cell as a pill (its name stays in the title).",
 "  const respCell = (ctl) => { const r = D.respOf(ctl); if (r.kind !== \"Inherited\" && r.kind !== \"Hybrid\") return \"This system\"; return r.providerId && D.unauth(r.providerId) ? `<span title=\"${esc(D.respWord(r))}\">${pill(\"warn\", `${r.kind}, provider not authorized`)}</span>` : `${esc(r.kind)} ${mu(\"· \" + esc(r.provider || \"\"))}`; };",
 "  const basisCell = (comp, ctl) => { const b = D.basisOf(comp, ctl), m = /^Mapped by (\\S+)(?: and (\\d+) more)?$/.exec(b); return m ? `Mapped by <span class=\"num\">${esc(m[1])}</span>${m[2] ? ` ${mu(\"+\" + m[2])}` : \"\"}` : b === \"Named in its implementation\" ? \"Named in implementation\" : b ? esc(b) : NONE; };"]
L[679] = L[679] + '\n  K.on("k3s.ts", (id) => { const [c, t] = here(); if (c) { setTab(c, t, { s: id || "" }); K.redraw(); } });'
L[680] = L[680].replace('{ f: f || "", fam: "", q: "" }', '{ f: f || "", fam: "", q: "", s: "" }'); assert 's: ""' in L[680], L[680]
L[674] = L[674].replace('{ fam: "", q: "", f: "" }', '{ fam: "", q: "", f: "", s: "" }'); assert 's: ""' in L[674]
L[669] = "  const { route, pill, rowBtn, stop, clink, curComp, ctlPanel, firstN, agrPill, agrExp, codeCell, BY } = U;"
open(p, "w").write("\n".join(L))
