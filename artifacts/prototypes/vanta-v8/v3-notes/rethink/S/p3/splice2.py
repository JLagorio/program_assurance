import sys
p = sys.argv[1]; L = open(p).read().split("\n")
def at(n, prefix): assert L[n-1].lstrip().startswith(prefix), (n, L[n-1][:80])
at(601, 'cols: page ? [{ label: "Protocol" }'); at(602, "rows: ports.map"); at(605, 'page ? K.related({ title: "Components it joins"'); at(646, "const seg = D.wsx() ? K.seg"); at(648, 'return K.page({ cls: "k3s", head: U.sysHead("", "components"), tabs'); at(649, '`<div class="k3-tools">')
L[648] = '      auth, K.toolbar({ views: false, right: U.viewSeg("boundary") + U.sysActions("components", "") }),'
L[647] = L[647].replace('U.sysHead("", "components")', 'U.sysHead("", "components", true)'); assert "true)" in L[647]
L[645] = '    // Which authorization\'s boundary is drawn is the one choice of this view: a filter of its row, where the List / Boundary\n    // switch and the page\'s actions stand too (the same row as the list has).\n    const auth = D.wsx() ? K.rail({ label: "Authorization", key: "authorization", items: [{ label: "ATO", on: key === "ato", go: "system-boundary" }, { label: "Block 1.1", on: key === "blk", go: "system-boundary--blk" }, { label: "IATT", on: key === "iatt", go: "system-boundary--iatt" }] }) : "";'
L[604] = '        K.related({ title: "Components it joins", cols: [{ label: "Component" }, { label: "Code", cls: "nw" }, { label: "End", cls: "nw", peek: true }, { label: "Kind", cls: "nw" }, { label: "Where", cls: "nw" }], rows: ends.map((e) => { const c = D.component(e); return { go: route(e), peek: { panel: "k3s-comp", id: e }, cells: [K.name(c.name, "", ""), c.boundary === "inside" ? codeCell(c.code) : NONE, esc(role(e)), esc(c.kind), esc(D.WHERE[c.boundary])] }; }) })] };'
L[600] = '          cols: [{ label: "Protocol" }, { label: "Port", cls: "nw", peek: true }, { label: "Service" }, { label: "Direction", cls: "nw" }, { label: "PPSM state", cls: "nw", peek: true }, { label: "", cls: "tight" }],'
L[601] = '          rows: ports.map((p) => ({ cells: [K.name(p.protocol, "", ""), K.num(p.port), p.service ? esc(p.service) : NONE, esc(p.dir || ""), p.ppsm ? esc(p.ppsm) : NONE, rowBtn("Remove", "k3s.rmPort", [id, p.id], `Remove ${p.protocol} ${p.port}`)] })) }),'
open(p, "w").write("\n".join(L))
