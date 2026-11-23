import sys, re
p = sys.argv[1]; L = open(p).read().split("\n")
def at(n, prefix): assert L[n-1].lstrip().startswith(prefix), (n, L[n-1][:80])
d = "/".join(__file__.split("/")[:-1]) + "/"
A = open(d + "A.js").read().rstrip("\n").split("\n"); B = open(d + "B.js").read().rstrip("\n").split("\n"); C = open(d + "C.js").read().rstrip("\n").split("\n")
at(336, "const view = "); at(346, 'K.on("k3s.attc"'); at(347, "const authInForce"); at(355, "const sysHead"); at(362, "const insideRow"); at(402, 'K.screen("system-connected"'); at(403, 'K.on("k3s.export"'); at(406, "PA.v3s.ui = "); at(462, "const cview"); at(475, '}, "system");'); at(476, "const connRoute"); at(416, "const { route, pill, rowBtn, stop, clink } = U;"); at(595, "Object.assign(U, {")
# bottom-up
L[461:475] = C
L[415] = "  const { route, pill, rowBtn, stop, clink, NONE, BY, firstN, agrPill, agrExp, codeCell } = U;"
L[405] = L[405].replace("agrWord, sysHead,", "agrWord: agrPill, agrPill, agrExp, agrOf, firstN, codeCell, daysTo, NONE, BY, insideCols, sysActions, sysHead,")
assert "agrPill, agrExp" in L[405]
L[361:402] = B
h = L[354]; m = re.match(r'^(  const sysHead = \(sub, tab\) => K\.head\(\{ title: "System", code: .*?, actions: )(K\.menu\("More", .*\)) \+ primaryFor\(tab, sub\) \}\);$', h); assert m, h
L[354:355] = ["  const sysActions = (tab, sub) => " + m.group(2) + " + primaryFor(tab, sub);", m.group(1).replace("(sub, tab)", "(sub, tab, bare)") + 'bare ? "" : sysActions(tab, sub) });']
L[335:346] = A
open(p, "w").write("\n".join(L))
