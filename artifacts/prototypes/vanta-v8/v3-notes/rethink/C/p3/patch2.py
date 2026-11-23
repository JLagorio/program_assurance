import io
P = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto/mod-zzzz-v3-8c-controls.js"
s = io.open(P, encoding="utf-8").read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (old[:60], s.count(old))
    s = s.replace(old, new)
rep('K.rail({ title: "Control families", act: "k3c.fam", label: "Control family", items:', 'K.rail({ act: "k3c.fam", label: "Family", key: "family", items:')
rep('r.reqs.length ? esc(r.reqs.join(", ")) : NONE]', 'r.reqs.length ? `<span title="${esc(r.reqs.join(", "))}">${esc(r.reqs[0])}${r.reqs.length > 1 ? ` ${muted("+" + (r.reqs.length - 1))}` : ""}</span>` : NONE]')
rep('''//   fam "AC" · chip noreq|noev|notassessed|short|inherited · q "text" · status <control status key> · source <layer key> ·
//   resp own|hybrid|inherited · tech <technique code, or "*" for any> · owner <name, or "none"> · layer <layer key: what it added
//   and removed> · mini req|ev|assessed|params · comp <component code: the controls it carries> · codes ["AC-2", …] with note
//   "the words over them" · out true (Tailored out) · page n''', '''//   fam "AC" · q "text" · status <control status key, or short|has_req|has_ev|assessed, or out for Tailored out> · source <layer
//   key> · resp own|hybrid|inherited|unauth · tech <technique code, or "*" for any> · owner <name, or "none"> · comp <component
//   code: the controls it carries> · codes ["AC-2", …] with note "the words over them" · page n. The older words are still read:
//   chip noreq|noev|notassessed|short|inherited, mini req|ev|assessed|params, layer <layer key>, out true.
// Pass 3: the list has one row over its table (search, views, Family, Status, Responsibility, Owner, Source, Technique, then its
// actions); comp and codes stand in that row as a token; every table cell is one line, but the implementation statement.''')
io.open(P, "w", encoding="utf-8").write(s)
print("ok")
