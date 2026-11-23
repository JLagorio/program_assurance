import io, sys
p = "mod-zzzz-v3-1kit.js"
s = io.open(p, encoding="utf-8").read()
def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, old[:90])
    s = s.replace(old, new)

# 1. name: the description is also the cell's tooltip (a compact row cuts it)
rep('K.name = (title, desc, code) => `<span class="k3-nm">${code',
    'K.name = (title, desc, code) => `<span class="k3-nm"${desc ? ` title="${esc(`${title} \\u00b7 ${desc}`)}"` : ""}>${code')

# 2. head: its actions are marked, so a list page can stand them at the end of its toolbar
rep('${actions ? `<div class="k3-head-a">${actions}</div>` : ""}</div>${sub ?',
    '${actions ? `<div class="k3-head-a"><!--k3ha-->${actions}<!--/k3ha--></div>` : ""}</div>${sub ?')

# 3. page / split / rail
i = s.index('  K.page = ({ head, tabs, body, cls }) =>')
j = s.index('  K.cards = (...c) =>')
new_block = r'''  // ——— Pass 3 (Josef, 21 Nov): one row over every table: search, the view, every filter, then the list's actions. A list's
  // kinds and its quick filters are filters in that row, never a strip of tabs or chips, and a view is a named set of them.
  // K.rail and K.chips draw a filter and hand it to the toolbar that follows them on the page; K.page stands a list page's
  // header actions at that toolbar's end. ———
  let PEND = [], TICK = 0, FOLDN = 0, HOLD = false, AUTO = -1;
  const LISTS = {}, SLOT = "<!--k3tr-->", FULL = "__k3full__";
  const fkey = (label) => String(label || "filter").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "filter";
  const unfold = (html) => { const used = []; html.replace(/<!--k3folded:([\d,]+)-->/g, (m, l) => { used.push(...l.split(",")); return m; }); used.forEach((n) => { html = html.replace(new RegExp(`<div class="k3-tools k3-bar k3-fold" data-k3-fold="${n}">[\\s\\S]*?<!--/k3fold-->`), ""); }); return html; };
  const endDraw = () => { PEND = []; TICK++; };
  K.page = ({ head, tabs, body, cls }) => {
    let h = head || "", b = unfold(arr(body).join(""));
    const record = /(^| )k3-rec( |$)/.test(cls || "") || /--/.test(location.hash || "");
    if (!record && b.includes(SLOT)) { const m = h.match(/<div class="k3-head-a"><!--k3ha-->([\s\S]*?)<!--\/k3ha--><\/div>/); if (m) { h = h.replace(m[0], ""); b = b.replace(SLOT, m[1]); } }
    endDraw();
    return `<div class="main k3${cls ? " " + cls : ""}">${h}${tabs || ""}${b}</div>`;
  };
  K.split = (rail, body) => `<div class="k3-stack">${rail}${arr(body).join("")}</div>`;
  const fltHtml = (f) => {
    const on = f.value !== "", optN = (o) => (o.count == null ? "" : ` (${fmt(o.count)})`);
    if (!f.fold) return `<label class="k3-flt${on ? " on" : ""}"><span class="k3-sr">${esc(f.label)}</span><select data-k3-input="${esc(f.act)}" aria-label="${esc(f.label)}"><option value="">${esc(f.label)}</option>${f.options.map((o) => { const sel = String(f.value) === String(o.id); return `<option value="${esc(o.id)}"${sel ? " selected" : ""}>${sel ? esc(f.label) + ": " + esc(o.label) : esc(o.label) + optN(o)}</option>`; }).join("")}</select></label>`;
    const hitO = (o) => (o.go ? ` data-go="${esc(o.go)}"` : K.a(f.act, o.id));
    let html = f.hasNone ? `<option${on ? "" : " selected"}${f.noneGo ? ` data-go="${esc(f.noneGo)}"` : K.a(f.act, f.none)}>${esc(f.label)}</option>` : "", grp = null;
    for (const o of f.options) {
      if ((o.group || null) !== grp) { if (grp) html += "</optgroup>"; grp = o.group || null; if (grp) html += `<optgroup label="${esc(grp)}">`; }
      const sel = on && String(f.value) === String(o.id), nm = `${" ".repeat(o.level || 0)}${o.code ? esc(o.code) + " · " : ""}${esc(o.label)}`;
      html += `<option${sel ? " selected" : ""}${hitO(o)}>${sel ? esc(f.label) + ": " + nm.trim() : nm + optN(o)}</option>`;
    }
    if (grp) html += "</optgroup>";
    return `<label class="k3-flt k3-rsel${on && f.hasNone ? " on" : ""}"><span class="k3-sr">${esc(f.label)}</span><select data-k3-railsel data-k3-fkey="${esc(f.key)}" aria-label="${esc(f.label)}">${html}</select></label>`;
  };
  const pend = (f) => { f.n = ++FOLDN; f.tick = TICK; PEND.push(f); return `<div class="k3-tools k3-bar k3-fold" data-k3-fold="${f.n}">${fltHtml(f)}</div><!--/k3fold-->`; };
  // A list's kinds. items: [{ id | go, label, count, on, level, code } | { head }], the first one "All …"; label names what they
  // are in a word or two ("Kind", "Source", "Family"). Drawn as one filter in the page's toolbar.
  K.rail = ({ items, act, label, key }) => {
    const its = items.filter(Boolean), real = its.filter((it) => !it.head), idOf = (it) => (it.id != null ? it.id : it.go);
    const first = real[0], hasNone = !!first && (first.id === "" || first.id === "all" || /^all\b/i.test(first.label || "")), cur = real.find((it) => it.on && !(hasNone && it === first));
    const options = []; let g = null;
    for (const it of its) { if (it.head) { g = it.head; continue; } if (hasNone && it === first) continue; options.push({ id: idOf(it), label: it.label, count: it.count, go: it.go, level: it.level, code: it.code, group: g }); }
    const name = label || "Kind";
    return pend({ fold: true, label: name, key: key || fkey(name), act, hasNone, none: first ? first.id : "", noneGo: hasNone && first ? first.go : "", value: cur ? String(idOf(cur)) : "", options });
  };
'''
s = s[:i] + new_block + s[j:]

# 4. toolbar
i = s.index('  K.toolbar = ({ search, filters = [], right = "" }) =>')
j = s.index('  // Josef, 20 Nov: clicking a row goes to the record\'s page')
toolbar = r'''  // The one row. id names the list (its saved views are kept under it; every address of one list gives the same id); noun
  // is what it lists, plural ("requirements"). filters: [{ label, key, value, act, options: [[value, label, count]] }].
  // views: false for a small table with no views; or { total, presets: [{ label, state, count }], seed: [{ name, state, by }],
  // count(state) }, a state being { q, <filter key>: value }. right: what stands before the page's actions (a List/Diagram switch).
  const nounOf = (search) => { const m = /^(?:search|find)\s+(?:this\s+\S+\s+)?(.+)$/i.exec((search && search.placeholder) || ""); return m ? m[1].replace(/[….]+$/, "") : "records"; };
  K.toolbar = ({ id, noun, search, filters = [], right = "", views }) => {
    const mine = PEND.filter((f) => f.tick === TICK); PEND = [];
    const fs = mine.concat(filters.filter(Boolean).map((f) => ({ label: f.label, key: f.key || fkey(f.label), act: f.act, value: f.value == null ? "" : String(f.value), fold: false, options: (f.options || []).map((o) => (Array.isArray(o) ? { id: o[0], label: o[1], count: o[2] } : o)) })));
    const route = (location.hash || "").slice(1);
    let lid = views === false ? "" : id || "";
    if (!lid && views !== false && search && AUTO !== TICK && route && !/--/.test(route)) { lid = route; AUTO = TICK; }
    const L = { id: lid, noun: noun || nounOf(search), search, filters: fs, views: views || {} };
    if (lid) LISTS[lid] = L;
    const anyOn = !!(search && search.value) || fs.some((f) => f.value !== "" && (!f.fold || f.hasNone));
    return `<div class="k3-tools k3-bar"${lid ? ` data-k3-list="${esc(lid)}"` : ""}>${search ? `<label class="k3-search"><span class="k3-sr">${esc(search.placeholder || "Search")}</span><input type="search" placeholder="${esc(search.placeholder || "Search")}" value="${esc(search.value || "")}" data-k3-input="${esc(search.act)}" autocomplete="off"></label>` : ""}${lid ? viewsMenu(L) : ""}${fs.map(fltHtml).join("")}${anyOn && lid ? `<button type="button" class="k3-clear"${K.a("k3.view.clear", lid)}>Clear</button>` : ""}<div class="k3-tools-r">${right}${SLOT}</div></div>${mine.length ? `<!--k3folded:${mine.map((f) => f.n).join(",")}-->` : ""}`;
  };
  // ——— Saved views: a view is the list's whole question under a name. Built-in ones come with the list; a reader saves, renames,
  // shares and deletes their own. They live in the session's data like every other V3 record. ———
  const normS = (st) => { const o = {}; Object.keys(st || {}).sort().forEach((k) => { const v = st[k]; if (v != null && v !== "") o[k] = String(v); }); return JSON.stringify(o); };
  const stateOf = (L) => { const st = {}; if (L.search && L.search.value) st.q = L.search.value; L.filters.forEach((f) => { if (f.value !== "" && (!f.fold || f.hasNone)) st[f.key] = f.value; }); return st; };
  const builtins = (L) => {
    const V = L.views || {};
    const pre = V.presets || L.filters.filter((f) => f.chips).flatMap((f) => f.options.slice(0, 6).map((o) => ({ id: `${f.key}:${o.id}`, label: o.label, state: { [f.key]: String(o.id) }, count: o.count })));
    return [{ id: "all", name: V.all || `All ${L.noun}`, state: {}, count: V.total }].concat(pre.map((p) => ({ id: p.id || "p:" + fkey(p.label), name: p.label, state: p.state || {}, count: p.count }))).map((v) => Object.assign(v, { builtin: true }));
  };
  const savedOf = (L) => K.get("views." + L.id, null) || ((L.views || {}).seed || []).map((x, n) => ({ id: "seed-" + n, name: x.name, state: x.state || {}, shared: x.shared !== false, by: x.by || "" }));
  const viewsOf = (L) => builtins(L).concat(savedOf(L));
  const describe = (L, st) => { const parts = []; L.filters.forEach((f) => { const v = st[f.key]; if (v == null || v === "") return; const o = f.options.find((x) => String(x.id) === String(v)); parts.push(`${f.label}: ${o ? o.label : v}`); }); if (st.q) parts.push(`Search “${st.q}”`); return parts.length ? parts.join(" · ") : `Every one of the ${L.noun}`; };
  const VIEWI = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M2.5 4h11M4.5 8h7M6.5 12h3"/></svg>';
  const TICKI = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  const viewNow = (L) => { const key = normS(stateOf(L)), vs = viewsOf(L), curId = K.get("viewcur." + L.id, "all"); const exact = vs.find((v) => v.id === curId && normS(v.state) === key) || vs.find((v) => normS(v.state) === key) || null; return { vs, exact, base: exact || vs.find((v) => v.id === curId) || vs[0] }; };
  const viewsMenu = (L) => {
    const { vs, exact, base } = viewNow(L), V = L.views || {}, saved = vs.filter((v) => !v.builtin);
    const item = (v) => { const n = v.count != null ? v.count : !v.builtin && V.count ? V.count(v.state) : null; return `<button type="button" role="menuitemradio" aria-checked="${exact === v}" class="k3-menu-i k3-vi${exact === v ? " on" : ""}"${K.a("k3.view.pick", [L.id, v.id])}><span class="k3-vi-c">${exact === v ? TICKI : ""}</span><span class="k3-vi-n">${esc(v.name)}</span>${v.shared ? '<span class="k3-vi-s">Shared</span>' : ""}${n == null ? "" : `<span class="k3-vi-ct num">${fmt(n)}</span>`}</button>`; };
    const cmd = (label, act, arg, off) => `<button type="button" role="menuitem" class="k3-menu-i k3-vcmd"${K.a(act, arg)}${off ? ` aria-disabled="true" title="${esc(off)}"` : ""}>${esc(label)}</button>`;
    return `<details class="k3-menu k3-vmenu"><summary class="k3-vbtn" aria-label="View: ${esc(base.name)}${exact ? "" : ", edited"}" title="Saved views">${VIEWI}<span class="k3-vname">${esc(base.name)}</span>${exact ? "" : '<span class="k3-vedit">Edited</span>'}<span class="k3-caret" aria-hidden="true">⌄</span></summary><div class="k3-menu-l k3-vlist" role="menu" aria-label="Views"><div class="k3-vg">Views</div>${vs.filter((v) => v.builtin).map(item).join("")}${saved.length ? `<div class="k3-vg">Saved views</div>${saved.map(item).join("")}` : ""}<div class="k3-vsep" role="separator"></div>${cmd("Save as new view…", "k3.view.save", L.id, exact ? `These filters are already the view “${exact.name}”. Change a filter or the search first.` : "")}${!exact && base && !base.builtin ? cmd(`Save changes to “${base.name}”`, "k3.view.update", [L.id, base.id]) : ""}${!exact ? cmd(`Back to “${base.name}”`, "k3.view.pick", [L.id, base.id]) : ""}${cmd("Manage views…", "k3.view.manage", L.id)}</div></details>`;
  };
  const applyState = (L, st) => {
    let nav = ""; HOLD = true;
    const call = (name, v) => { const fn = ACT[name]; if (!fn) return; try { fn(v, null, null); } catch (e) { console.error(e); } };
    try {
      for (const f of L.filters) {
        const want = st[f.key] == null ? "" : String(st[f.key]);
        if (!f.fold) { call(f.act, want); continue; }
        const o = want === "" ? null : f.options.find((x) => String(x.id) === want);
        if (o) { if (o.go) nav = o.go; else call(f.act, o.id); } else if (f.hasNone) { if (f.noneGo) nav = f.noneGo; else call(f.act, f.none); }
      }
      if (L.search && L.search.act) call(L.search.act, st.q || "");
    } finally { HOLD = false; }
    if (nav && nav !== (location.hash || "").slice(1)) location.hash = nav; else V2.redraw();
  };
  const putSaved = (L, list) => K.set("views." + L.id, list);
  K.on("k3.view.pick", ([lid, vid]) => { const L = LISTS[lid]; if (!L) return; const v = viewsOf(L).find((x) => x.id === vid); if (!v) return; K.set("viewcur." + lid, vid); applyState(L, v.state || {}); });
  K.on("k3.view.clear", (lid) => { const L = LISTS[lid]; if (!L) return; K.set("viewcur." + lid, "all"); applyState(L, {}); });
  const saveForm = (lid) => {
    const L = LISTS[lid]; if (!L) return; const st = stateOf(L);
    K.form({ title: "Save view", submit: "Save view", intro: `This view will ask: <b>${esc(describe(L, st))}</b>.`,
      fields: [{ key: "name", label: "Name", required: true, placeholder: "What you will look for it by" }, { key: "shared", label: "Who sees it", type: "select", required: true, value: "me", options: [["me", "Only me"], ["team", "Everyone on this program"]] }],
      onSubmit: (v) => { if (viewsOf(L).some((x) => x.name.toLowerCase() === v.name.toLowerCase())) return { name: "A view already has that name." }; const view = { id: K.id("vw"), name: v.name, state: st, shared: v.shared === "team", by: "You" }; putSaved(L, savedOf(L).concat(view)); K.set("viewcur." + lid, view.id); K.toast(`View “${v.name}” saved`); K.redraw(); return null; } });
  };
  K.on("k3.view.save", (lid) => saveForm(lid));
  K.on("k3.view.update", ([lid, vid]) => { const L = LISTS[lid]; if (!L) return; const st = stateOf(L), list = savedOf(L), v = list.find((x) => x.id === vid); if (!v) return; putSaved(L, list.map((x) => (x.id === vid ? Object.assign({}, x, { state: st }) : x))); K.set("viewcur." + lid, vid); K.toast(`View “${v.name}” now asks: ${describe(L, st)}`); K.redraw(); });
  let ASK = "";
  const manageBody = (lid) => {
    const L = LISTS[lid]; if (!L) return ""; const sv = savedOf(L), bi = builtins(L), V = L.views || {};
    const row = (v) => (ASK === v.id
      ? `<li class="k3-vm-r ask"><span class="k3-vm-q">Delete “${esc(v.name)}”?${v.shared ? " It leaves everyone’s list of views." : ""}</span><button type="button" class="btn sm k3-danger"${K.a("k3.view.del2", [lid, v.id])}>Delete view</button><button type="button" class="btn sm"${K.a("k3.view.keep", lid)}>Keep</button></li>`
      : `<li class="k3-vm-r"><input class="k3-vm-n" type="text" value="${esc(v.name)}" aria-label="Name of the view ${esc(v.name)}" data-k3-vrename="${esc(lid)}" data-vid="${esc(v.id)}"><span class="k3-vm-w" title="${esc(describe(L, v.state))}">${esc(describe(L, v.state))}${V.count ? ` · ${fmt(V.count(v.state))}` : ""}</span><select aria-label="Who sees ${esc(v.name)}" data-k3-vshare="${esc(lid)}" data-vid="${esc(v.id)}"><option value="me"${v.shared ? "" : " selected"}>Only me</option><option value="team"${v.shared ? " selected" : ""}>Everyone on this program</option></select><button type="button" class="btn sm k3-quiet"${K.a("k3.view.del", [lid, v.id])} aria-label="Delete the view ${esc(v.name)}">Delete</button></li>`);
    return `<div class="k3-vm">${sv.length ? `<ul class="k3-vm-l">${sv.map(row).join("")}</ul>` : `<p class="k3-muted">No saved views yet. Set a search or filters on the list, then save them as a view.</p>`}<p class="k3-muted">Built in: ${bi.map((v) => esc(v.name)).join(" · ")}. A built-in view is not renamed or deleted.</p><div><button type="button" class="btn sm"${K.a("k3.view.new", lid)}>Save the current filters as a view</button></div></div>`;
  };
  K.on("k3.view.manage", (lid) => { const L = LISTS[lid]; if (!L) return; ASK = ""; K.dialog({ title: `Views of ${L.noun}`, wide: true, submit: false, cancel: "Done", body: manageBody(lid) }); });
  K.on("k3.view.new", (lid) => { K.close(); saveForm(lid); });
  K.on("k3.view.del", ([lid, vid]) => { ASK = vid; K.dialogBody(manageBody(lid)); const b = document.querySelector("#modal .k3-vm-r.ask .btn"); if (b) b.focus(); });
  K.on("k3.view.keep", (lid) => { ASK = ""; K.dialogBody(manageBody(lid)); });
  K.on("k3.view.del2", ([lid, vid]) => { const L = LISTS[lid]; if (!L) return; const v = savedOf(L).find((x) => x.id === vid); putSaved(L, savedOf(L).filter((x) => x.id !== vid)); if (K.get("viewcur." + lid, "all") === vid) K.set("viewcur." + lid, "all"); ASK = ""; K.redraw(); K.dialogBody(manageBody(lid)); K.toast(`View “${v ? v.name : ""}” deleted`); const f = document.querySelector("#modal .k3-vm .btn, #modal [data-k3-close]"); if (f) f.focus(); });
  document.addEventListener("change", (e) => {
    if (!V3.on()) return; const t = e.target; if (!t || !t.matches) return;
    const rn = t.matches("[data-k3-vrename]"), sh = t.matches("[data-k3-vshare]"); if (!rn && !sh) return;
    const lid = t.getAttribute(rn ? "data-k3-vrename" : "data-k3-vshare"), vid = t.getAttribute("data-vid"), L = LISTS[lid]; if (!L) return;
    const list = savedOf(L), v = list.find((x) => x.id === vid); if (!v) return;
    if (rn) { const name = t.value.trim(); if (!name || viewsOf(L).some((x) => x.id !== vid && x.name.toLowerCase() === name.toLowerCase())) { t.value = v.name; K.toast(name ? "Another view has that name." : "A view needs a name."); return; } putSaved(L, list.map((x) => (x.id === vid ? Object.assign({}, x, { name }) : x))); K.toast(`View renamed “${name}”`); }
    else { putSaved(L, list.map((x) => (x.id === vid ? Object.assign({}, x, { shared: t.value === "team" }) : x))); K.toast(t.value === "team" ? `“${v.name}” is shared with the program` : `“${v.name}” is yours alone`); }
    K.redraw();
  }, true);
'''
s = s[:i] + toolbar + s[j:]

# 5. table: in a preview a table is a short list
rep('''  K.table = ({ cols, rows, empty, foot, label, cls }) => { rows = rows.map((r) => (r && !r.group ? rowOf(r) : r)); return tableOf({ cols, rows, empty, foot, label, cls }); };''',
r'''  // In a preview (the side panel) a table is the same rows in another format: the first five, the name and one or two facts
  // (the columns marked peek: true, else the first that holds a status), then "View all" to where the page lists them
  // (all: { go }, else the record's page). keep: true draws the whole table there too.
  let PEEK = null;
  const peekIx = (cols, data) => { const flag = cols.map((c, n) => (c.peek && n ? n : -1)).filter((n) => n > 0); if (flag.length) return [0].concat(flag.slice(0, 2)); for (let n = 1; n < cols.length; n++) if (data.some((r) => /class="pill/.test(String(r.cells[n] == null ? "" : r.cells[n])))) return [0, n]; return cols.length > 1 ? [0, 1] : [0]; };
  K.table = ({ cols, rows, empty, foot, label, cls, keep, all, total }) => {
    rows = rows.map((r) => (r && !r.group ? rowOf(r) : r));
    if (!PEEK || keep) return tableOf({ cols, rows, empty, foot, label, cls });
    const data = rows.filter((r) => !r.group), ix = peekIx(cols, data), n = total == null ? data.length : Math.max(total, data.length);
    if (!data.length && empty) return K.empty(empty);
    return `${tableOf({ cols: ix.map((c, k) => ({ label: cols[c].label, cls: k ? "end" : "" })), rows: data.slice(0, 5).map((r) => Object.assign({}, r, { cells: ix.map((c) => r.cells[c]) })), label, cls: `k3-pk${cls ? " " + cls : ""}` })}${n > 5 ? `<a class="k3-pk-all" href="#${all && all.go ? esc(all.go) : FULL}">${esc((all && all.label) || `View all ${fmt(n)}`)}</a>` : ""}`;
  };''')

rep('''  K.related = ({ title, count, add, cols, rows, empty, id, more, cls, label }) => { const addBtn = add ? K.btn(add.label, { sm: true, act: add.act, arg: add.arg, icon: "plus" }) : ""; return K.section({ id, title, count: count == null ? rows.length : count, actions: `${more || ""}${addBtn}`, body: rows.length ? K.table({ cols, rows, cls, label: label || title }) :''',
'''  K.related = ({ title, count, add, cols, rows, empty, id, more, cls, label, all, keep }) => { const peek = PEEK && !keep, addBtn = add ? (peek ? K.actLink(add.label, add.act, add.arg) : K.btn(add.label, { sm: true, act: add.act, arg: add.arg, icon: "plus" })) : ""; return K.section({ id, title, count: count == null ? rows.length : count, actions: `${peek ? "" : more || ""}${addBtn}`, body: rows.length ? K.table({ cols, rows, cls, label: label || title, all, keep, total: count }) :''')

# 6. chips: a filter in the row (a strip only where a lane asks for one by name)
rep('''  K.chips = (list, act, label) => `<div class="k3-chips"''', '''  const chipStrip = (list, act, label) => `<div class="k3-chips"''')
rep('''  K.seg = (list, label) =>''', '''  // A list's quick filters ("All", "No evidence", "Overdue"): one filter in the page's toolbar, and each a built-in view of
  // the list. label names what they say in a word or two ("State", "Lacks"). o.strip keeps the old strip, for what is not a filter.
  K.chips = (list, act, label, o = {}) => {
    const items = list.filter(Boolean); if (o.strip) return chipStrip(items, act, label);
    const all = items.find((c) => c.id === "" || c.id == null || c.id === "all"), cur = items.find((c) => c.on && c !== all), name = o.label || label || "Show";
    return pend({ fold: true, chips: o.preset !== false, label: name, key: o.key || fkey(name), act, hasNone: true, none: all ? all.id : "", noneGo: "", value: cur ? String(cur.id) : "", options: items.filter((c) => c !== all).map((c) => ({ id: c.id, label: c.label, count: c.count })) });
  };
  K.seg = (list, label) =>''')

# 7. redraw holds while a view is applied
rep('''  K.redraw = () => V2.redraw();''', '''  K.redraw = () => { if (!HOLD) V2.redraw(); };''')

# 8. the panel: a preview draws its tables as short lists and names the record's page for "View all"
rep('''      const r = fn(id); if (!r) return { label: "Preview", body: K.empty({ title: "This record is no longer here" }) };
      const full = r.page || K.recRoute(kind, id) || "";
      return { label: r.label || "Preview", body: `<div class="k3-pn" data-v2r-full="${esc(full)}">''',
'''      let r = null; PEEK = { kind, id }; try { r = fn(id); } finally { PEEK = null; }
      if (!r) { endDraw(); return { label: "Preview", body: K.empty({ title: "This record is no longer here" }) }; }
      const full = r.page || K.recRoute(kind, id) || "";
      const fin = (html) => { html = unfold(html); endDraw(); return full ? html.split(FULL).join(esc(full)) : html.replace(new RegExp(`<a class="k3-pk-all" href="#${FULL}">[^<]*</a>`, "g"), ""); };
      return { label: r.label || "Preview", body: fin(`<div class="k3-pn" data-v2r-full="${esc(full)}">''')
rep('''${r.facts ? K.facts(r.facts) : ""}${arr(r.sections).join("")}</div>` };''', '''${r.facts ? K.facts(r.facts) : ""}${arr(r.sections).join("")}</div>`) };''')

io.open(p, "w", encoding="utf-8").write(s)
print("ok", len(s))
