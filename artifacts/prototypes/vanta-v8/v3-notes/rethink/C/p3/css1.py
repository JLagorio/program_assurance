import io
P = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto/mod-zzzz-v3-8c-controls.css"
s = io.open(P, encoding="utf-8").read()
def cut(a, b, new):
    global s
    i = s.index(a); j = s.index(b, i) + len(b)
    s = s[:i] + new + s[j:]
cut(".k3c .k3-table td:first-child { min-width: 250px; }", ".k3c .k3-nm-d { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; max-width: 62ch; }",
'''.k3c-src { color: var(--ink-2); }
.k3c-pr { color: var(--ink-3); }
.k3c-pr.un { text-decoration: underline dotted var(--warn); text-underline-offset: 3px; }
/* The one row over the list (pass 3). The kit sizes every control in it; on a window too narrow for six chosen filters the
   filters give way, each cut with an ellipsis, before the row breaks in two. */
@media (min-width: 1360px) {
  .k3c .k3-tb { flex-wrap: nowrap; }
  .k3c .k3-tb .k3-flt { flex: 0 1 auto; min-width: 72px; }
  .k3c .k3-tb .k3-flt select { max-width: 100%; }
  .k3c .k3-tb .k3-vmenu, .k3c .k3-tb .k3-clear, .k3c .k3-tb .k3-tools-r { flex: none; }
}
/* A set another page named (a component's controls, the controls an SSP section cites): a token in the row, with its own clear. */
.k3c-set { display: inline-flex; align-items: center; gap: 2px; height: 32px; padding: 0 4px 0 10px; border-radius: 6px; background: var(--brand-soft); color: var(--brand-text); font: 500 13px/1 var(--font); max-width: 300px; min-width: 0; box-sizing: border-box; }
.k3c-set .t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.k3c-set button { flex: none; inline-size: 24px; block-size: 24px; border: 0; border-radius: 4px; background: none; color: inherit; font: 400 17px/1 var(--font); cursor: pointer; }
.k3c-set button:hover { background: var(--canvas); }
.k3c-set button:focus-visible { outline: 2px solid var(--brand); outline-offset: 1px; }
@media (max-width: 1679px) {
  .k3c-pr { display: none; }
  .k3c .k3-table td, .k3c .k3-table th { padding-inline: 10px; }
}
@media (max-width: 1399px) { .k3c .k3-table .k3c-w2, .k3c .k3-table .k3c-own .nm { display: none; } }''')
cut(".k3c-showing { display: flex;", "color: var(--ink-2); }\n", "")
cut(".k3c-eb-r .x { display: grid; min-width: 0; }", ".k3c-eb-r .x .k3c-mu { font-size: 12.5px; line-height: 16px; }",
'''.k3c-eb-r .x { display: flex; gap: 8px; align-items: baseline; min-width: 0; }
.k3c-eb-r .x b { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.k3c-eb-r .x .k3c-mu { flex: none; font-size: 12.5px; line-height: 20px; }''')
cut(".k3c-impl { display: -webkit-box;", ".k3c-impl.wide { -webkit-line-clamp: 6; font-size: 13.5px; line-height: 20px; max-width: 78ch; }",
'''/* The implementation statement: the one text of a control that wraps. Six lines in its row on the page, three over the preview's list. */
.k3c-impl { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-size: 13px; line-height: 19px; color: var(--ink-2); white-space: normal; }
.k3c-impl.wide { -webkit-line-clamp: 6; font-size: 13.5px; line-height: 20px; color: var(--ink); }
p.k3c-implp { margin: 0; }
.k3c-ob .k3-nm-t { font-weight: 400; }''')
cut(".k3c-rec .k3-nm-d { -webkit-line-clamp: 2; max-width: 72ch; }\n.k3c-rec .k3-table td:first-child { min-width: 240px; }\n", ".k3c-prose", ".k3c-prose")
cut(".k3c-rq { display: block;", ".k3-pn .k3-table td.nw { white-space: nowrap; }\n", "")
cut("  .k3c .k3-table td:first-child { min-width: 200px; }\n", "}", "}")
cut("\n/* objectives inside the control's panel */", ".k3c-objs .s { white-space: nowrap; font-size: 12px; }", "")
io.open(P, "w", encoding="utf-8").write(s)
print("ok")
