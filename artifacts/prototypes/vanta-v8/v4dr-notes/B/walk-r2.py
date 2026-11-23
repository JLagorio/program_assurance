import sys
p = sys.argv[1]
s = open(p).read()
reps = [
('const ROUTES = ["dr-evidence", "dr-evidence--v3x-ev-270", "dr-evidence--v3x-ev-95", "dr-evidence-pick", "dr-import", "dr-import--review"];',
 'const ROUTES = ["dr-evidence", "dr-evidence--v3x-ev-270", "dr-evidence--v3x-ev-95", "dr-evidence--ckl-mission-computer-rhel9", "dr-evidence--ckl-maintenance-laptop-win11", "dr-evidence-pick", "dr-import", "dr-import--review", "dr-import--poam"];\nconst FILES = { sctm: "WS-X90 SCTM.xlsx", poam: "WS-X90 POA&M.xlsx" };'),
('''  for (const at of [1, 2, 3, 4]) { await go("dr-import"); await p.evaluate((at) => { PA.v3k.set("dr.B.imp", Object.assign({ file: "WS-X90 SCTM.xlsx" }, PA.v3k.get("dr.B.imp", {}) || {}, { at })); PA.v2.redraw(); }, at); await p.waitForTimeout(300); await checkPage(`dr-import step ${at + 1} @${vp.width}`); }''',
 '''  for (const kind of ["sctm", "poam"]) for (const at of [1, 2, 3, 4]) { await go("dr-import"); await p.evaluate(([at, kind, file]) => { PA.v3k.set("dr.B.imp", { file, kind, at }); PA.v2.redraw(); }, [at, kind, FILES[kind]]); await p.waitForTimeout(300); await checkPage(`dr-import ${kind} step ${at + 1} @${vp.width}`); }'''),
('''for (const at of [1, 2, 3, 4]) await clickAll("dr-import", async () => { await p.evaluate((at) => { PA.v3k.set("dr.B.imp", { file: "WS-X90 SCTM.xlsx", at }); PA.v2.redraw(); }, at); await p.waitForTimeout(300); });''',
 '''for (const kind of ["sctm", "poam"]) for (const at of [1, 2, 3, 4]) await clickAll("dr-import", async () => { await p.evaluate(([at, kind, file]) => { PA.v3k.set("dr.B.imp", { file, kind, at }); PA.v2.redraw(); }, [at, kind, FILES[kind]]); await p.waitForTimeout(300); });'''),
]
for a, b in reps:
    assert a in s, a[:60]
    s = s.replace(a, b)
anchor = 'if (errs.length) fail(`console errors'
flows = open(sys.argv[2]).read()
assert anchor in s
s = s.replace(anchor, flows + anchor, 1)
open(p, 'w').write(s)
