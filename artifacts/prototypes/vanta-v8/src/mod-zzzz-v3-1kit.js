// V3 kit (k3-): the page shapes every rethought V3 page is built from. window.PA.v3k
// One list shape (header, one or two summary cards, a category rail with counts, one filter row, the table), one record shape
// (breadcrumb, title, counted line tabs, sections that add in place), one side panel, and one way to add, link, edit and remove.
// Loads after mod-zzzz-v3-0core.js and before every lane. Nothing here draws unless a V3 page calls it; the document listeners
// return at once while V3 is off.
//
//   Markup (each returns an HTML string)
//   head({ crumbs, title, code, chip, sub, actions })       page header: crumbs = [[label, route], …, [label]]
//   tabs([{ label, count, route, on }])                     counted line tabs; each is a link to a route
//   page({ head, tabs, body, cls })                         the page: head, tabs, then body (a string or an array of blocks)
//   split(rail, body)                                       a category rail beside the content
//   rail({ title, items, act, groups })                     items = [{ id, label, count, on, level, head }]; choosing one runs act(id)
//   completion({ title, label, done, total, unit, note, minis, go|act })   minis = [{ label, done, total, go, act, arg }]; go or act
//                                                           makes the label the link to the list it counts
//   attention({ title, rows })                              rows = [{ label, n, tone, go, act, arg }]; a zero is muted and inert
//   cards(a, b)                                             two summary cards side by side
//   toolbar({ search, filters, right })                     search = { act, value, placeholder }; filters = [{ label, value, act, options: [[v, l]] }]
//   table({ cols, rows, empty, foot, label })               cols = [{ label, cls }]; rows = [{ cells, panel, id, go, act, arg, cls }]
//   name(title, desc, code) · ring(done, total) · owner(n) · status(word) · num(n) · tagged(text)      cells
//   chips([{ id, label, count, on }], act)                  counted state chips over a table: choosing one runs act(id)
//   seg([{ label, on, go, act, arg }], label)               a view switch (List · Boundary, List · Workbook)
//   next({ text, action })                                  a record's one next step, with the button that does it
//   section({ title, count, actions, body, id })            a headed block on a record; actions holds its Add button
//   related({ title, count, add, cols, rows, empty })       a card of related records, the same on every record: a count, its own
//                                                           Add (add = { label, act, arg }), the rows, and an empty line with the same Add
//   group({ id, code, title, meta, open, body })            a collapsible category block
//   details(title, rows) · facts(rows)                      labelled properties: rows = [[label, html], …]
//   empty({ title, line, action })
//   btn(label, { primary, sm, go, act, arg, icon, danger, disabled, title })    one button
//   menu(label, items, { sm, primary })                     a More menu, or a primary that opens choices: items = [{ label, go, act, arg, danger }]
//   link(label, route) · actLink(label, act, arg)
//
//   Behaviour
//   on(name, fn)                 an action: any element drawn with a(name, arg) runs fn(arg, el, event) on click, Enter or Space
//   a(name, arg)                 the attributes for it (arg is any JSON value)
//   form({ title, intro, fields, submit, onSubmit, danger })   a dialog with fields; onSubmit(values) returns { field: "message" } to refuse
//                                fields = [{ key, label, type: text|textarea|select|date|number|checks, options, value, required, hint, rows }]
//   pick({ title, intro, items, multi, submit, onPick, create, empty })     choose from existing records, with search;
//                                items = [{ id, title, code, desc, meta, group, held: "Added" or why it cannot be chosen }];
//                                submit(n) → label; create = { label: "Create requirement", onCreate() } is its first line
//   task                         the return bar: task.start({ from: { label, route }, what, steps: [{ label, route, q }], i }),
//                                task.get(), task.step(i), task.end(); the shell draws it on every page while a task is open
//   confirm({ title, text, submit, danger, onOk })
//   dialog({ title, body, submit, onOk, wide })                a dialog with a body of its own; dialogBody(html) redraws it while open
//   close()                      close the kit's dialog
//   panel(kind, fn)              a side panel: fn(id) → { label, title, code, chip, actions, page, open, facts, sections }
//                                (page = the record's route: the panel's ↗ and its Open button go there; none: no ↗)
//   lazy(pattern, draw, nav)     record pages by address: pattern is a RegExp, draw(route, match) its HTML, nav the menu entry it sits under
//   get(path, d) · set(path, v) · push(path, item) · drop(path, test) · patch(path, test, changes)      V3's own session data ("v3r.…")
//   redraw() · toast(text, link) · go(route)
(function () {
  const PA = window.PA; if (!PA || !PA.v3 || !PA.v2) return;
  const V3 = PA.v3, V2 = PA.v2, AK = PA.AK, h = PA.h, esc = h.esc;
  const K = {};
  const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-US") : esc(String(n == null ? "" : n)));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const arr = (x) => (Array.isArray(x) ? x : x == null || x === "" ? [] : [x]);

  // ——— Actions ———
  const ACT = {};
  K.on = (name, fn) => { ACT[name] = fn; };
  K.a = (name, arg) => ` data-k3="${esc(name)}"${arg === undefined ? "" : ` data-k3a="${esc(JSON.stringify(arg))}"`}`;
  const argOf = (el) => { const s = el.getAttribute("data-k3a"); if (s == null) return undefined; try { return JSON.parse(s); } catch (e) { return s; } };
  const hit = (o) => (o.go ? ` data-go="${esc(o.go)}"` : o.act ? K.a(o.act, o.arg) : o.panel ? ` data-panel="${esc(o.panel)}" data-id="${esc(o.id == null ? "" : o.id)}"` : "");
  const live = (o) => !!(o.go || o.act || o.panel);

  // ——— Small parts ———
  K.esc = esc; K.fmt = fmt; K.pct = pct;
  K.i = (k) => (AK ? AK.i(k) : "");
  K.btn = (label, o = {}) => `<button type="button" class="btn${o.primary ? " ink" : ""}${o.sm ? " sm" : ""}${o.danger ? " k3-danger" : ""}${o.quiet ? " k3-quiet" : ""}"${hit(o)}${o.disabled ? ` aria-disabled="true" title="${esc(o.disabled)}"` : o.title ? ` title="${esc(o.title)}"` : ""}>${o.icon ? K.i(o.icon) : ""}${esc(label)}</button>`;
  K.menu = (label, items, o = {}) => `<details class="k3-menu"><summary class="btn${o.primary ? " ink" : ""}${o.sm ? " sm" : ""}${o.quiet ? " k3-quiet" : ""}"${o.aria ? ` aria-label="${esc(o.aria)}"` : ""}>${esc(label)}${o.bare ? "" : '<span class="k3-caret" aria-hidden="true">⌄</span>'}</summary><div class="k3-menu-l" role="menu">${items.filter(Boolean).map((it) => `<button type="button" role="menuitem" class="k3-menu-i${it.danger ? " k3-danger-t" : ""}"${hit(it)}>${esc(it.label)}</button>`).join("")}</div></details>`;
  K.link = (label, route) => `<a class="k3-link" href="#${esc(route)}">${esc(label)}</a>`;
  K.actLink = (label, act, arg) => `<button type="button" class="k3-link"${K.a(act, arg)}>${esc(label)}</button>`;
  K.status = (word, kind) => (word ? h.pill(kind || "", word) : '<span class="k3-none">—</span>');
  K.tagged = (t) => `<span class="tag">${esc(t)}</span>`;
  K.num = (n) => `<span class="num">${fmt(n)}</span>`;
  K.owner = (n) => (AK ? AK.owner(n) : esc(n || "Unassigned"));
  K.name = (title, desc, code) => `<span class="k3-nm"${desc ? ` title="${esc(`${title} \u00b7 ${desc}`)}"` : ""}>${code ? `<span class="k3-nm-c">${esc(code)}</span>` : ""}<span class="k3-nm-t">${esc(title)}</span>${desc ? `<span class="k3-nm-d">${esc(desc)}</span>` : ""}</span>`;
  K.ring = (done, total, unit) => { const p = pct(done, total); return `<span class="k3-ring" title="${fmt(done)} of ${fmt(total)}${unit ? " " + esc(unit) : ""}"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="none" stroke="var(--track)" stroke-width="2.5"${total ? "" : ' stroke-dasharray="2.5 2.5"'}/>${p ? `<circle cx="10" cy="10" r="7.5" fill="none" stroke="${p === 100 ? "var(--ok)" : "var(--ink-2)"}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="${(p / 100) * 47.12} 47.12" transform="rotate(-90 10 10)"/>` : ""}</svg><span class="num">${fmt(done)}/${fmt(total)}</span></span>`; };
  K.bar = (done, total, tone) => `<span class="k3-bar" role="img" aria-label="${pct(done, total)}%"><i style="width:${pct(done, total)}%${tone ? `;background:var(--${tone})` : ""}"></i></span>`;

  // ——— Page ———
  K.crumbs = (list) => `<nav class="k3-crumbs" aria-label="Breadcrumb">${list.map(([l, r], i) => (r && i < list.length - 1 ? `<a href="#${esc(r)}">${esc(l)}</a>` : `<span${i === list.length - 1 ? ' aria-current="page"' : ""}>${esc(l)}</span>`)).join('<span class="sep" aria-hidden="true">›</span>')}</nav>`;
  // Continuity between records: a record's page reached from another record's page says where the reader came from and
  // leads back there. The trail is the pages in the order they were opened; stepping back to the one before drops the last.
  const TRAIL = [], recBase = (r) => String(r || "").split("--").slice(0, 2).join("--");
  V3.navDrawn((route) => {
    const last = TRAIL[TRAIL.length - 1];
    if (last && last.route === route) return;
    if (last) { const h = document.querySelector("#main h1"); if (h) last.title = h.textContent.replace(/\s+/g, " ").trim(); }
    if (last && /--/.test(route) && recBase(last.route) === recBase(route)) { last.route = route; return; }
    const prev = TRAIL[TRAIL.length - 2];
    if (prev && recBase(prev.route) === recBase(route)) { TRAIL.pop(); prev.route = route; } else { TRAIL.push({ route, title: "" }); if (TRAIL.length > 40) TRAIL.shift(); }
  });
  const cameFrom = (crumbs) => {
    const cur = TRAIL[TRAIL.length - 1], p = TRAIL[TRAIL.length - 2];
    const surface = p && /^(sctm|ssp)$/.test(p.route); // v2's two full-window work surfaces: a record opened from one leads back to it
    if (!cur || !p || !/--/.test(cur.route) || !(/--/.test(p.route) || surface) || !(p.title || surface)) return null;
    if (surface) return { route: p.route, title: p.route === "sctm" ? "Workbook" : "System security plan" };
    const t = K.get("task", null); if (t && t.from) return null;
    if ((crumbs || []).some((c) => c && c[1] && recBase(c[1]) === recBase(p.route))) return null;
    return p;
  };
  K.trail = () => TRAIL.map((t) => t.route);
  K.head = ({ crumbs, title, code, chip, sub, actions }) => { const from = cameFrom(crumbs), cr = crumbs && crumbs.length ? K.crumbs(crumbs) : ""; return `<header class="k3-head">${from ? `<div class="k3-crumbline"><a class="k3-back" href="#${esc(from.route)}" title="Back to ${esc(from.title)}">${K.i("back")}<span>${esc(from.title)}</span></a>${cr}</div>` : cr}<div class="k3-head-r"><div class="k3-head-t"><h1 class="k3-title" title="${esc(title)}">${esc(title)}</h1>${code ? `<span class="k3-code">${esc(code)}</span>` : ""}${chip || ""}</div>${actions ? `<div class="k3-head-a"><!--k3ha-->${actions}<!--/k3ha--></div>` : ""}</div>${sub ? `<p class="k3-sub">${sub}</p>` : ""}</header>`; };
  K.tabs = (list, label) => `<nav class="k3-tabs" aria-label="${esc(label || "Sections")}">${list.filter(Boolean).map((t) => `<a href="#${esc(t.route)}" class="k3-tab${t.on ? " on" : ""}"${t.on ? ' aria-current="page"' : ""}>${esc(t.label)}${t.count == null ? "" : `<span class="k3-ct num">${fmt(t.count)}</span>`}</a>`).join("")}</nav>`;
  // ——— Pass 3 (Josef, 21 Nov): one row over every table: search, the view, every filter, then the list's actions. A list's
  // kinds and its quick filters are filters in that row, never a strip of tabs or chips, and a view is a named set of them.
  // K.rail and K.chips draw a filter and hand it to the toolbar that follows them on the page; K.page stands a list page's
  // header actions at that toolbar's end. ———
  let PEND = [], TICK = 0, FOLDN = 0, HOLD = false, AUTO = -1;
  const LISTS = {}, SLOT = "<!--k3tr-->", FULL = "__k3full__";
  const fkey = (label) => String(label || "filter").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "filter";
  const unfold = (html) => { const used = []; html.replace(/<!--k3folded:([\d,]+)-->/g, (m, l) => { used.push(...l.split(",")); return m; }); used.forEach((n) => { html = html.replace(new RegExp(`<div class="k3-tools k3-tb k3-fold" data-k3-fold="${n}">[\\s\\S]*?<!--/k3fold-->`), ""); }); return html; };
  const endDraw = () => { PEND = []; TICK++; };
  K.page = ({ head, tabs, body, cls }) => {
    let h = head || "", b = unfold(arr(body).join(""));
    const record = /(^| )k3-rec( |$)/.test(cls || "") || /--/.test(location.hash || "");
    if (!record && b.includes(SLOT)) { const m = h.match(/<div class="k3-head-a"><!--k3ha-->([\s\S]*?)<!--\/k3ha--><\/div>/); if (m) { h = h.replace(m[0], ""); b = b.replace(SLOT, m[1]); } }
    endDraw();
    return `<div class="main k3${cls ? " " + cls : ""}">${h}${tabs || ""}${b}</div>`;
  };
  K.split = (rail, body) => `<div class="k3-stack">${rail}${arr(body).join("")}</div>`;
  let MCTX = null; // a select is as wide as what it shows: its text measured in the row's own type
  const textW = (t) => { try { if (!MCTX) { MCTX = document.createElement("canvas").getContext("2d"); MCTX.font = `500 13px ${getComputedStyle(document.body).fontFamily}`; } return MCTX.measureText(t).width; } catch (e) { return t.length * 7.4; } };
  const fltHtml = (f) => {
    const on = f.value !== "", optN = (o) => (o.count == null ? "" : ` (${fmt(o.count)})`);
    const cur = on ? f.options.find((o) => String(o.id) === String(f.value)) : null, shown = cur ? `${f.label}: ${cur.code ? cur.code + " \u00b7 " : ""}${cur.label}` : f.label;
    const wd = ` style="width:${Math.min(280, Math.ceil(textW(shown)) + 46)}px"`;
    if (!f.fold) return `<label class="k3-flt${on ? " on" : ""}"><span class="k3-sr">${esc(f.label)}</span><select data-k3-input="${esc(f.act)}" aria-label="${esc(f.label)}"${wd}><option value="">${esc(f.label)}</option>${f.options.map((o) => { const sel = String(f.value) === String(o.id); return `<option value="${esc(o.id)}"${sel ? " selected" : ""}>${sel ? esc(f.label) + ": " + esc(o.label) : esc(o.label) + optN(o)}</option>`; }).join("")}</select></label>`;
    const hitO = (o) => (o.go ? ` data-go="${esc(o.go)}"` : K.a(f.act, o.id));
    let html = f.hasNone ? `<option${on ? "" : " selected"}${f.noneGo ? ` data-go="${esc(f.noneGo)}"` : K.a(f.act, f.none)}>${esc(f.label)}</option>` : "", grp = null;
    for (const o of f.options) {
      if ((o.group || null) !== grp) { if (grp) html += "</optgroup>"; grp = o.group || null; if (grp) html += `<optgroup label="${esc(grp)}">`; }
      const sel = on && String(f.value) === String(o.id), nm = `${" ".repeat(o.level || 0)}${o.code ? esc(o.code) + " · " : ""}${esc(o.label)}`;
      html += `<option${sel ? " selected" : ""}${hitO(o)}>${sel ? esc(f.label) + ": " + nm.trim() : nm + optN(o)}</option>`;
    }
    if (grp) html += "</optgroup>";
    return `<label class="k3-flt k3-rsel${on && f.hasNone ? " on" : ""}"><span class="k3-sr">${esc(f.label)}</span><select data-k3-railsel data-k3-fkey="${esc(f.key)}" aria-label="${esc(f.label)}"${wd}>${html}</select></label>`;
  };
  const pend = (f) => { f.n = ++FOLDN; f.tick = TICK; PEND.push(f); return `<div class="k3-tools k3-tb k3-fold" data-k3-fold="${f.n}">${fltHtml(f)}</div><!--/k3fold-->`; };
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
  K.cards = (...c) => `<div class="k3-cards n${c.filter(Boolean).length}">${c.filter(Boolean).join("")}</div>`;
  K.completion = ({ title = "Completion", label, done, total, unit = "", note, minis = [], tone, go, act, arg }) => `<section class="k3-card k3-comp"><h2 class="k3-card-t">${esc(title)}</h2><div class="k3-comp-b"><div class="k3-comp-m"><span class="k3-comp-l">${go || act ? `<button type="button" class="k3-link k3-comp-go"${hit({ go, act, arg })}>${esc(label)}<span class="k3-go" aria-hidden="true">↗</span></button>` : esc(label)}</span><span class="k3-comp-p num">${pct(done, total)}%</span>${K.bar(done, total, tone)}<div class="k3-comp-f"><span class="num">${fmt(done)} ${esc(unit)}</span><span class="num">${note ? esc(note) : `${fmt(total)} total`}</span></div></div>${minis.length ? `<div class="k3-minis">${minis.map((m) => `<${live(m) ? "button type=\"button\"" : "div"} class="k3-mini"${hit(m)}><span class="l">${esc(m.label)}${live(m) ? '<span class="k3-go" aria-hidden="true">↗</span>' : ""}</span><span class="n num">${fmt(m.done)}/${fmt(m.total)}</span>${K.bar(m.done, m.total)}<span class="p num">${pct(m.done, m.total)}%</span></${live(m) ? "button" : "div"}>`).join("")}</div>` : ""}</div></section>`;
  K.attention = ({ title = "Needs attention", rows = [], empty = "Nothing needs attention" }) => { const any = rows.some((r) => r.n); return `<section class="k3-card k3-att"><h2 class="k3-card-t">${esc(title)}</h2>${any ? `<ul class="k3-att-l">${rows.map((r) => { const z = !r.n, t = z || !live(r) ? "div" : "button"; return `<li><${t}${t === "button" ? ' type="button"' : ""} class="k3-att-r${z ? " z" : ""}${r.tone ? " " + r.tone : ""}"${z ? "" : hit(r)}><span class="l">${esc(r.label)}</span><span class="n num">${fmt(r.n)}</span></${t}></li>`; }).join("")}</ul>` : `<p class="k3-muted">${esc(empty)}</p>`}</section>`; };
  // The one row. id names the list (its saved views are kept under it; every address of one list gives the same id); noun
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
    return `<div class="k3-tools k3-tb"${lid ? ` data-k3-list="${esc(lid)}"` : ""}>${search ? `<label class="k3-search"><span class="k3-sr">${esc(search.placeholder || "Search")}</span><input type="search" placeholder="${esc(search.placeholder || "Search")}" value="${esc(search.value || "")}" data-k3-input="${esc(search.act)}" autocomplete="off"></label>` : ""}${lid ? viewsMenu(L) : ""}<div class="k3-fs">${fs.map(fltHtml).join("")}${anyOn && lid ? `<button type="button" class="k3-clear"${K.a("k3.view.clear", lid)}>Clear</button>` : ""}</div><div class="k3-tools-r">${right}${SLOT}</div></div>${mine.length ? `<!--k3folded:${mine.map((f) => f.n).join(",")}-->` : ""}`;
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
    return `<div class="k3-vm"><p class="k3-muted">The saved views of ${esc(L.noun)}. A view keeps the search and every filter under a name.</p>${sv.length ? `<ul class="k3-vm-l">${sv.map(row).join("")}</ul>` : `<p class="k3-muted">No saved views yet. Set a search or filters on the list, then save them as a view.</p>`}<p class="k3-muted">Built in: ${bi.map((v) => esc(v.name)).join(" · ")}. A built-in view is not renamed or deleted.</p><div><button type="button" class="btn sm"${K.a("k3.view.new", lid)}>Save the current filters as a view</button></div></div>`;
  };
  K.on("k3.view.manage", (lid) => { const L = LISTS[lid]; if (!L) return; ASK = ""; K.dialog({ title: "Manage views", wide: true, submit: false, cancel: "Done", body: manageBody(lid) }); });
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
  // Josef, 20 Nov: clicking a row goes to the record's page; the preview is an eye at the end of the row's first value, shown
  // on hover and focus (always on a touch screen). A row { panel, id } of a kind with a record page (K.record) becomes that; a
  // row that goes to a page may name its preview as peek: { panel, id }.
  const EYE = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="1.9"/></svg>';
  const rowOf = (r) => {
    if (r.panel && !r.go && !r.act) { const to = K.recRoute(r.panel, r.id); if (to) return Object.assign({}, r, { panel: null, go: to, eye: [r.panel, r.id], kind: r.panel }); }
    return r.peek && r.peek.panel ? Object.assign({}, r, { eye: [r.peek.panel, r.peek.id] }) : r;
  };
  const eyeOf = (r, label) => (r.eye ? `<button type="button" class="k3-eye" data-panel="${esc(r.eye[0])}" data-id="${esc(r.eye[1] == null ? "" : r.eye[1])}" aria-label="Preview${label ? " " + esc(label) : ""}" title="Preview">${EYE}</button>` : "");
  const rowAttrs = (r) => (r.eye && r.kind ? ` data-go="${esc(r.go)}" data-id="${esc(r.id == null ? "" : r.id)}" data-rec="${esc(r.kind)}"` : hit(r));
  // In a preview (the side panel) a table is the same rows in another format: the first five, the name and one or two facts
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
  };
  // A column's cls "main" (the name's column where it is not the first) and "wrap" (text that is the content) are the kit's
  // own classes on the cell: the page shell already owns .main and .wrap.
  const ccls = (c) => String(c || "").split(/\s+/).filter(Boolean).map((t) => (t === "main" ? "k3-cm" : t === "wrap" ? "k3-cw" : t)).join(" ");
  const tableOf = ({ cols, rows, empty, foot, label, cls }) => { cols = cols.map((c) => (c && c.cls ? Object.assign({}, c, { cls: ccls(c.cls) }) : c)); return tableOf2({ cols, rows, empty, foot, label, cls }); };
  const tableOf2 = ({ cols, rows, empty, foot, label, cls }) => (rows.length || !empty ? `<div class="frame k3-frame${cls ? " " + cls : ""}"><div class="tablebox"><table class="k3-table"${label ? ` aria-label="${esc(label)}"` : ""}><thead><tr>${cols.map((c) => `<th${c.cls ? ` class="${c.cls}"` : ""}>${esc(c.label || "")}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => (r.group ? `<tr class="k3-grow"><td colspan="${cols.length}">${r.group}</td></tr>` : `<tr class="${live(r) ? "k3-open" : "k3-still"}${r.eye ? " k3-peek" : ""}${r.cls ? " " + r.cls : ""}"${live(r) ? ' tabindex="0"' : ""}${rowAttrs(r)}>${r.cells.map((c, i) => `<td${cols[i] && cols[i].cls ? ` class="${cols[i].cls}"` : ""}>${!i && r.eye ? `<span class="k3-c1"><span class="k3-c1-b">${c == null ? "" : c}</span>${eyeOf(r)}</span>` : c == null ? "" : c}</td>`).join("")}</tr>`)).join("")}</tbody></table></div>${foot ? `<div class="pager">${foot}</div>` : ""}</div>` : K.empty(empty));
  K.section = ({ title, count, actions, body, id, sub }) => `<section class="k3-sec"${id ? ` id="${esc(id)}"` : ""}><div class="k3-sec-h"><h2>${esc(title)}${count == null ? "" : `<span class="k3-ct num">${fmt(count)}</span>`}</h2>${actions ? `<div class="k3-sec-a">${actions}</div>` : ""}</div>${sub ? `<p class="k3-muted">${sub}</p>` : ""}${arr(body).join("")}</section>`;
  K.group = ({ id, code, title, meta, open, body }) => `<details class="k3-group"${id ? ` id="${esc(id)}"` : ""}${open ? " open" : ""}><summary><span class="k3-group-t">${code ? `<span class="c">${esc(code)}</span>` : ""}${esc(title)}</span>${meta ? `<span class="k3-group-m">${meta}</span>` : ""}<span class="k3-chev" aria-hidden="true"></span></summary><div class="k3-group-b">${arr(body).join("")}</div></details>`;
  K.facts = (rows) => `<dl class="k3-facts">${rows.filter(Boolean).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v == null || v === "" ? '<span class="k3-none">—</span>' : v}</dd></div>`).join("")}</dl>`;
  K.details = (title, rows, actions) => `<section class="k3-card k3-det"><div class="k3-sec-h"><h2 class="k3-card-t">${esc(title)}</h2>${actions || ""}</div>${K.facts(rows)}</section>`;
  K.aside = (body, side) => `<div class="k3-aside"><div class="k3-aside-b">${arr(body).join("")}</div><aside class="k3-aside-s">${arr(side).join("")}</aside></div>`;
  K.empty = ({ title, line, action }) => `<div class="k3-empty"><b>${esc(title)}</b>${line ? `<p>${esc(line)}</p>` : ""}${action || ""}</div>`;
  K.note = (html, tone) => `<p class="k3-note${tone ? " " + tone : ""}">${html}</p>`;
  const chipStrip = (list, act, label) => `<div class="k3-chips" role="group" aria-label="${esc(label || "Show")}">${list.filter(Boolean).map((c) => `<button type="button" class="k3-chip${c.on ? " on" : ""}" aria-pressed="${c.on ? "true" : "false"}"${K.a(act, c.id)}>${esc(c.label)}${c.count == null ? "" : `<span class="num">${fmt(c.count)}</span>`}</button>`).join("")}</div>`;
  // A list's quick filters ("All", "No evidence", "Overdue"): one filter in the page's toolbar, and each a built-in view of
  // the list. label names what they say in a word or two ("State", "Lacks"). o.strip keeps the old strip, for what is not a filter.
  K.chips = (list, act, label, o = {}) => {
    const items = list.filter(Boolean); if (o.strip) return chipStrip(items, act, label);
    const all = items.find((c) => c.id === "" || c.id == null || c.id === "all"), cur = items.find((c) => c.on && c !== all), name = o.label || label || "Show";
    return pend({ fold: true, chips: o.preset !== false, label: name, key: o.key || fkey(name), act, hasNone: true, none: all ? all.id : "", noneGo: "", value: cur ? String(cur.id) : "", options: items.filter((c) => c !== all).map((c) => ({ id: c.id, label: c.label, count: c.count })) });
  };
  K.seg = (list, label) => `<span class="k3-seg" role="group" aria-label="${esc(label || "View")}">${list.filter(Boolean).map((x) => (x.go && !x.on ? `<a href="#${esc(x.go)}">${esc(x.label)}</a>` : `<button type="button" class="${x.on ? "on" : ""}" aria-pressed="${x.on ? "true" : "false"}"${x.on || !x.act ? "" : K.a(x.act, x.arg)}>${esc(x.label)}</button>`)).join("")}</span>`;
  K.next = ({ text, action, label }) => `<div class="k3-next"><span class="k">${esc(label || "Next step")}</span><span class="x">${text}</span>${action || ""}</div>`;
  K.related = ({ title, count, add, cols, rows, empty, id, more, cls, label, all, keep }) => { const peek = PEEK && !keep, addBtn = add ? (peek ? K.actLink(add.label, add.act, add.arg) : K.btn(add.label, { sm: true, act: add.act, arg: add.arg, icon: "plus" })) : ""; return K.section({ id, title, count: count == null ? rows.length : count, actions: `${peek ? "" : more || ""}${addBtn}`, body: rows.length ? K.table({ cols, rows, cls, label: label || title, all, keep, total: count }) : `<div class="k3-none-row"><span>${esc(empty || `No ${title.toLowerCase()} yet`)}</span>${add ? K.actLink(add.label, add.act, add.arg) : ""}</div>` }); };

  // ——— Session data: V3's own records live under "v3r." in v2's session state, so Reset clears them and a reload keeps them ———
  const path = (p) => "v3r." + p;
  K.get = (p, d) => V2.get(path(p), d);
  K.set = (p, v) => V2.set(path(p), v);
  K.push = (p, item) => { const l = (K.get(p, []) || []).slice(); l.push(item); K.set(p, l); return item; };
  K.drop = (p, test) => { const l = K.get(p, []) || [], next = l.filter((x) => !test(x)); K.set(p, next); return l.length - next.length; };
  K.patch = (p, test, changes) => { let n = 0; K.set(p, (K.get(p, []) || []).map((x) => (test(x) ? (n++, Object.assign({}, x, changes)) : x))); return n; };
  K.redraw = () => { if (!HOLD) V2.redraw(); };
  K.toast = (text, link) => V2.toast(text, link);
  K.go = (route) => { if ((location.hash || "").slice(1) === route) K.redraw(); else location.hash = route; };
  let uid = 0;
  K.id = (prefix) => `${prefix}-${Date.now().toString(36).slice(-4)}${(uid++).toString(36)}`;

  // ——— The return bar: while work comes from a gate or My work, every page says where it came from and what is next ———
  const stepGo = (st) => { if (!st || !st.route) return; if (st.q) V2.go(st.route, st.q); else K.go(st.route); }; // q: a question for an old page (PA.v2.go)
  K.task = {
    get: () => K.get("task", null),
    start: (t) => { K.set("task", Object.assign({ i: 0 }, t)); stepGo((t.steps || [])[t.i || 0]); },
    step: (i) => { const t = K.get("task", null); if (!t) return; K.set("task", Object.assign({}, t, { i })); stepGo((t.steps || [])[i]); },
    end: (back) => { const t = K.get("task", null); K.set("task", null); if (back && t && t.from) K.go(t.from.route); else { const b = document.getElementById("k3task"); if (b) b.remove(); } },
    bar: () => { const t = K.get("task", null); if (!t || !t.from) return ""; const steps = t.steps || [], i = t.i || 0, st = steps[i], nx = steps[i + 1]; return `<div class="k3-task" id="k3task" role="region" aria-label="Where this work came from"><button type="button" class="k3-task-b"${K.a("k3.task.back")}>${K.i("back")}Back to ${esc(t.from.label)}</button><span class="k3-task-x">${st ? esc(st.label) : esc(t.what || "")}${steps.length > 1 ? `<span class="num"> · ${i + 1} of ${steps.length}</span>` : ""}</span>${nx ? `<button type="button" class="k3-task-n"${K.a("k3.task.next")}>Next: ${esc(nx.label)}</button>` : ""}<button type="button" class="k3-task-e"${K.a("k3.task.end")} aria-label="Stop showing this bar">✕</button></div>`; },
  };
  K.on("k3.task.back", () => K.task.end(true));
  K.on("k3.task.next", () => { const t = K.task.get(); if (t) K.task.step((t.i || 0) + 1); });
  K.on("k3.task.end", () => K.task.end(false));

  // ——— Dialogs: one form, one picker, one confirmation ———
  const modal = () => document.getElementById("modal");
  let DLG = null, opener = null;
  K.close = () => { const m = modal(); if (!m || !DLG) return; DLG = null; m.hidden = true; m.innerHTML = ""; if (opener && document.contains(opener)) opener.focus(); opener = null; };
  const open = (spec, html) => {
    const m = modal(); if (!m) return;
    opener = document.activeElement; DLG = spec;
    m.innerHTML = `<div class="dlg k3-dlg${spec.wide ? " wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="k3DlgT"><div class="dlg-h"><h4 id="k3DlgT">${esc(spec.title)}</h4><button type="button" class="ib" data-k3-close aria-label="Close">✕</button></div>${html}</div>`;
    m.hidden = false;
    const f = m.querySelector("[data-k3-first]") || m.querySelector("input, select, textarea, button.btn");
    if (f) f.focus();
  };
  const field = (f) => {
    const id = "k3f-" + f.key, v = f.value == null ? "" : f.value, req = f.required ? ' aria-required="true"' : "";
    let ctl;
    if (f.type === "textarea") ctl = `<textarea id="${id}" name="${esc(f.key)}" rows="${f.rows || 4}"${req}>${esc(v)}</textarea>`;
    else if (f.type === "select") ctl = `<select id="${id}" name="${esc(f.key)}"${req}>${f.required && v ? "" : `<option value="">${esc(f.placeholder || "Choose…")}</option>`}${f.options.map((o) => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(ov)}"${String(ov) === String(v) ? " selected" : ""}>${esc(ol)}</option>`; }).join("")}</select>`;
    else if (f.type === "checks") ctl = `<div class="k3-checks" id="${id}">${f.options.map((o) => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<label><input type="checkbox" name="${esc(f.key)}" value="${esc(ov)}"${arr(v).map(String).includes(String(ov)) ? " checked" : ""}> ${esc(ol)}</label>`; }).join("")}</div>`;
    else ctl = `<input id="${id}" name="${esc(f.key)}" type="${f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}" value="${esc(v)}"${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ""}${req}>`;
    return `<div class="k3-f${f.half ? " half" : ""}" data-k3-field="${esc(f.key)}"><label for="${id}">${esc(f.label)}${f.required ? "" : ' <span class="opt">optional</span>'}</label>${ctl}${f.hint ? `<p class="hint">${esc(f.hint)}</p>` : ""}<p class="err" role="alert" hidden></p></div>`;
  };
  K.form = (spec) => open(spec, `<form class="dlg-b k3-form" data-k3-form novalidate>${spec.intro ? `<p class="k3-muted">${spec.intro}</p>` : ""}<div class="k3-fields">${spec.fields.map(field).join("")}</div></form><div class="dlg-f"><button type="button" class="btn" data-k3-close>Cancel</button><button type="button" class="btn ink${spec.danger ? " k3-danger" : ""}" data-k3-submit>${esc(spec.submit || spec.title)}</button></div>`);
  const pickRows = (spec, q, chosen) => {
    const ql = (q || "").trim().toLowerCase();
    const list = spec.items.filter((it) => !ql || `${it.title} ${it.desc || ""} ${it.meta || ""} ${it.code || ""} ${it.group || ""}`.toLowerCase().includes(ql));
    if (!list.length) return `<p class="k3-muted k3-pick-none">${esc(ql ? "Nothing matches that search." : spec.empty || "Nothing left to choose.")}</p>`;
    let g = null;
    return list.slice(0, 200).map((it) => { const head = it.group && it.group !== g ? `<div class="k3-pick-g">${esc((g = it.group))}</div>` : ""; return `${head}<label class="k3-pick-i${it.held ? " held" : ""}"><input type="${spec.multi ? "checkbox" : "radio"}" name="k3pick" value="${esc(it.id)}"${chosen.has(String(it.id)) ? " checked" : ""}${it.held ? " disabled" : ""}><span class="b">${K.name(it.title, it.desc, it.code)}</span><span class="m">${it.held ? esc(it.held) : it.meta ? esc(it.meta) : ""}</span></label>`; }).join("") + (list.length > 200 ? `<p class="k3-muted k3-pick-none">${fmt(list.length - 200)} more: search to narrow.</p>` : "");
  };
  const pickLabel = (spec, n) => (typeof spec.submit === "function" ? spec.submit(n) : spec.submit || "Add");
  K.pick = (spec) => { spec.chosen = new Set(); open(Object.assign(spec, { wide: true }), `<div class="dlg-b k3-pick">${spec.intro ? `<p class="k3-muted">${spec.intro}</p>` : ""}<label class="k3-search wide"><span class="k3-sr">Search</span><input type="search" placeholder="${esc(spec.search || "Search")}" data-k3-pickq data-k3-first autocomplete="off"></label>${spec.create ? `<button type="button" class="k3-pick-new" data-k3-picknew>${K.i("plus")}${esc(spec.create.label)}</button>` : ""}<div class="k3-pick-l" data-k3-pickl>${pickRows(spec, "", spec.chosen)}</div>${spec.extra ? `<div class="k3-fields">${spec.extra.map(field).join("")}</div>` : ""}</div><div class="dlg-f"><span class="k3-pick-n num" data-k3-pickn></span><button type="button" class="btn" data-k3-close>Cancel</button><button type="button" class="btn ink" data-k3-submit aria-disabled="true">${esc(pickLabel(spec, 0))}</button></div>`); };
  // A dialog with a body of its own (switches, a live preview): body is HTML; redraw it with K.dialogBody(html) while it is open.
  K.dialog = (spec) => open(Object.assign(spec, { confirm: true }), `<div class="dlg-b" data-k3-dbody>${spec.body || ""}</div><div class="dlg-f"><button type="button" class="btn" data-k3-close>${esc(spec.cancel || "Cancel")}</button>${spec.submit === false ? "" : `<button type="button" class="btn ink${spec.danger ? " k3-danger" : ""}" data-k3-submit>${esc(spec.submit || spec.title)}</button>`}</div>`);
  K.dialogBody = (html) => { const b = document.querySelector("#modal [data-k3-dbody]"); if (b) b.innerHTML = html; };
  K.confirm = (spec) => open(Object.assign(spec, { confirm: true }), `<div class="dlg-b"><p class="k3-confirm">${spec.text}</p></div><div class="dlg-f"><button type="button" class="btn" data-k3-close data-k3-first>${esc(spec.cancel || "Cancel")}</button><button type="button" class="btn ink${spec.danger ? " k3-danger" : ""}" data-k3-submit>${esc(spec.submit || spec.title)}</button></div>`);
  // A file the page makes (an export). In the published page the viewer's own Save prompt takes it; opened from disk the
  // browser downloads it; where neither can, the text opens in a dialog to copy. A lane never builds a download link itself.
  K.save = (filename, text) => {
    const size = `${Math.max(1, Math.round(text.length / 1024))} KB`;
    const asText = () => K.confirm({ title: `Copy ${filename}`, wide: true, submit: "Copy", cancel: "Close", text: `This view cannot save a file. Copy the ${size} of text and paste it into a spreadsheet.</p><textarea class="k3-savet" readonly rows="10" aria-label="${esc(filename)}">${esc(text)}</textarea><p hidden>`, onOk: () => { try { navigator.clipboard.writeText(text).then(() => K.toast(`${filename} copied`), () => K.toast("This view cannot copy for you: select the text and copy it.")); } catch (e) { K.toast("This view cannot copy for you: select the text and copy it."); } } });
    const viaLink = () => { try { const a = document.createElement("a"), u = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); return true; } catch (e) { return false; } };
    const cl = window.claude;
    if (!cl || typeof cl.use !== "function") { if (viaLink()) K.toast(`${filename} downloaded`); else asText(); return; }
    Promise.resolve(cl.use("downloads")).then((d) => (d ? d.save({ filename, data: text }).then(() => K.toast(`${filename} saved`), (e) => { if (!e || e.code !== "declined") asText(); }) : asText()), asText);
  };
  const values = (root) => { const out = {}; root.querySelectorAll("[data-k3-field]").forEach((w) => { const k = w.getAttribute("data-k3-field"); const boxes = w.querySelectorAll('input[type="checkbox"]'); if (boxes.length) out[k] = [...boxes].filter((b) => b.checked).map((b) => b.value); else { const c = w.querySelector("input, select, textarea"); out[k] = c ? c.value.trim() : ""; } }); return out; };
  const refuse = (root, errs) => { let first = null; root.querySelectorAll("[data-k3-field]").forEach((w) => { const k = w.getAttribute("data-k3-field"), e = w.querySelector(".err"), msg = errs[k]; w.classList.toggle("bad", !!msg); if (e) { e.hidden = !msg; e.textContent = msg || ""; } if (msg && !first) first = w.querySelector("input, select, textarea"); }); if (first) first.focus(); };
  const submit = () => {
    const spec = DLG, m = modal(); if (!spec || !m) return;
    if (spec.confirm) { K.close(); spec.onOk && spec.onOk(); return; }
    if (spec.items) {
      const ids = [...spec.chosen]; if (!ids.length) return;
      const extra = values(m), errs = {}; (spec.extra || []).forEach((f) => { if (f.required && !String(extra[f.key] || "").length) errs[f.key] = `Enter ${f.label.toLowerCase()}.`; });
      if (Object.keys(errs).length) { refuse(m, errs); return; }
      K.close(); spec.onPick && spec.onPick(spec.multi ? ids : ids[0], extra); return;
    }
    const v = values(m), errs = {};
    spec.fields.forEach((f) => { if (f.required && !(Array.isArray(v[f.key]) ? v[f.key].length : v[f.key])) errs[f.key] = f.type === "select" || f.type === "checks" ? `Choose ${f.label.toLowerCase()}.` : `Enter ${f.label.toLowerCase()}.`; });
    const more = Object.keys(errs).length ? null : spec.onSubmit && spec.onSubmit(v);
    const all = Object.assign(errs, more && typeof more === "object" ? more : {});
    if (Object.keys(all).length) { refuse(m, all); return; }
    K.close();
  };

  // ——— The side panel: one anatomy for every record seen from another record ———
  // A record's page by address: <noun>--<id>. K.record(kind, { noun, home: [label, route], nav, route(id) }) names it; the kinds
  // the lanes drew as panels get theirs from the panel's own definition (title, facts, sections), laid out as a page.
  const REC = {}, PDEF = {};
  K.record = (kind, o) => { REC[kind] = o; };
  K.recRoute = (kind, id) => { const r = REC[kind]; if (!r || id == null || id === "") return ""; return r.route ? r.route(String(id)) : `${r.noun}--${encodeURIComponent(String(id))}`; };
  K.recOf = (kind) => REC[kind] || null;
  const NOUNS = { "k3c-control": ["control", "Controls", "controls", "controls"], "k3d-req": ["requirement", "Requirements", "requirements", "requirements"], "k3d-ev": ["artifact", "Evidence", "evidence", "evidence"],
    "k3e-finding": ["finding", "Findings", "findings", "findings"], "k3e-risk": ["risk", "Risks", "risks", "risks"], "k3e-tech": ["technique", "Threats", "risks-threats", "risks"],
    "k3s-conn": ["connection", "Connections", "system-connections", "system"], "k3o-gate": ["gate", "Overview", "overview", "overview"] };
  K.record("k3s-comp", { route: (id) => "component--" + id });
  const recPage = (kind, id) => {
    const R = REC[kind], fn = PDEF[kind]; let r = null; try { r = fn ? fn(id, { page: true }) : null; } catch (e) { console.error(e); r = null; }
    const home = R.home || ["Overview", "overview"];
    if (!r) return K.page({ cls: "k3-rec " + kind, head: K.head({ crumbs: [home, ["Not found"]], title: "This record is no longer here" }), body: K.empty({ title: "Nothing at this address", line: "It may have been removed, or the address names a record this program does not hold.", action: K.btn(`Back to ${home[0]}`, { go: home[1] }) }) });
    return K.page({ cls: "k3-rec " + kind, head: K.head({ crumbs: r.crumbs || [home, [r.code || r.title]], title: r.title, code: r.code, chip: r.chip, sub: r.sub || "", actions: r.actions || "" }),
      body: r.facts || r.side ? K.aside(arr(r.sections), (r.facts ? [K.details("Details", r.facts)] : []).concat(arr(r.side))) : arr(r.sections) });
  };
  K.panel = (kind, fn) => {
    PDEF[kind] = fn;
    const N = NOUNS[kind];
    if (N && !REC[kind]) { K.record(kind, { noun: N[0], home: [N[1], N[2]], nav: N[3] }); V3.lazyRoute(new RegExp("^" + N[0] + "--(.+)$"), (route, m) => { let id = m[1]; try { id = decodeURIComponent(id); } catch (e) { /* as typed */ } return recPage(kind, id); }, N[3]); }
    PA.P[kind] = (id) => {
      let r = null; PEEK = { kind, id }; try { r = fn(id); } finally { PEEK = null; }
      if (!r) { endDraw(); return { label: "Preview", body: K.empty({ title: "This record is no longer here" }) }; }
      const full = r.page || K.recRoute(kind, id) || "";
      const fin = (html) => { html = unfold(html); endDraw(); return full ? html.split(FULL).join(esc(full)) : html.replace(new RegExp(`<a class="k3-pk-all" href="#${FULL}">[^<]*</a>`, "g"), ""); };
      return { label: r.label || "Preview", body: fin(`<div class="k3-pn" data-v2r-full="${esc(full)}"><div class="k3-pn-h"><h4>${esc(r.title)}</h4>${r.code ? `<span class="k3-code">${esc(r.code)}</span>` : ""}${r.chip || ""}</div>${r.actions || r.page ? `<div class="k3-pn-a">${r.actions || ""}${r.page ? `<a class="btn sm" href="#${esc(r.page)}">${esc(r.open || "Open")}</a>` : ""}</div>` : ""}${r.facts ? K.facts(r.facts) : ""}${arr(r.sections).join("")}</div>`) };
    };
  };
  K.openPanel = (kind, id) => { const main = document.getElementById("main"); if (!main) return; const t = document.createElement("span"); t.hidden = true; t.setAttribute("data-panel", kind); t.setAttribute("data-id", id); main.appendChild(t); t.click(); t.remove(); };

  // ——— Record pages by address ———
  K.lazy = (pattern, draw, nav) => V3.lazyRoute(pattern, draw, nav);
  K.screen = (route, fn, nav) => V3.screen(route, fn, nav);

  // A control inside a row that opens or goes somewhere acts alone: the core asks this before it follows the row.
  const INROW = "button, select, input, textarea, label, summary, a[href], [data-k3]";
  V3.rowGuard = (e) => {
    if (!V3.on() || e.type !== "click") return false;
    const t = e.target, row = t && t.closest && t.closest("tr[data-go], tr[data-panel], tr[data-k3]");
    if (!row) return false;
    const c = t.closest(INROW);
    return !!(c && c !== row && row.contains(c) && !c.matches("[data-panel], [data-modal], [data-go]"));
  };
  // ——— One listener for everything above ———
  const run = (el, e) => { const fn = ACT[el.getAttribute("data-k3")]; if (!fn) return; if (el.getAttribute("aria-disabled") === "true") return; const menu = el.closest("details.k3-menu"); if (menu) menu.open = false; fn(argOf(el), el, e); };
  document.addEventListener("click", (e) => {
    if (!V3.on()) return;
    const t = e.target; if (!t || !t.closest) return;
    document.querySelectorAll("details.k3-menu[open]").forEach((d) => { if (!d.contains(t)) d.open = false; });
    if (DLG) {
      if (t.closest("[data-k3-close]")) { e.preventDefault(); K.close(); return; }
      const s = t.closest("[data-k3-submit]"); if (s) { e.preventDefault(); if (s.getAttribute("aria-disabled") !== "true") submit(); return; }
      if (t.closest("[data-k3-picknew]")) { e.preventDefault(); const c = DLG.create; K.close(); if (c && c.onCreate) c.onCreate(); return; }
    }
    const el = t.closest("[data-k3]");
    if (el && el.matches("tr") && V3.rowGuard(e)) return;
    if (el && !t.closest("a[href]")) { if (t.closest("input, select, textarea, label") && !el.matches("button")) return; e.preventDefault(); run(el, e); }
  }, true);
  document.addEventListener("keydown", (e) => {
    if (!V3.on()) return;
    const t = e.target; if (!t || !t.matches) return;
    if (DLG && e.key === "Escape") { e.preventDefault(); e.stopPropagation(); K.close(); return; }
    if (DLG && e.key === "Enter" && t.matches(".k3-form input")) { e.preventDefault(); submit(); return; }
    if ((e.key === "Enter" || e.key === " ") && t.matches("tr[data-k3], [data-k3]:not(button):not(input):not(select)")) { e.preventDefault(); run(t, e); }
    if (e.key === "Enter" && t.matches("tr[data-go]")) { e.preventDefault(); location.hash = t.getAttribute("data-go"); }
  }, true);
  let typing = null;
  const input = (e) => {
    if (!V3.on()) return;
    const t = e.target; if (!t || !t.matches) return;
    if (DLG && t.matches("[data-k3-pickq]")) { const l = document.querySelector("[data-k3-pickl]"); if (l) l.innerHTML = pickRows(DLG, t.value, DLG.chosen); return; }
    if (DLG && t.matches('input[name="k3pick"]')) {
      if (!DLG.multi) DLG.chosen.clear();
      t.checked ? DLG.chosen.add(t.value) : DLG.chosen.delete(t.value);
      const n = DLG.chosen.size, b = document.querySelector("#modal [data-k3-submit]"), c = document.querySelector("[data-k3-pickn]");
      if (b) { b.setAttribute("aria-disabled", String(!n)); b.textContent = pickLabel(DLG, n); }
      if (c) c.textContent = DLG.multi && n ? `${n} chosen` : "";
      return;
    }
    if (t.matches("[data-k3-railsel]")) { const o = t.selectedOptions && t.selectedOptions[0]; if (!o) return; const to = o.getAttribute("data-go"); if (to) { location.hash = to; return; } const f = ACT[o.getAttribute("data-k3")]; if (f) f(argOf(o), o, e); return; }
    if (t.matches("[data-k3-input]")) {
      const name = t.getAttribute("data-k3-input"), fn = ACT[name]; if (!fn) return;
      if (t.matches("select")) { fn(t.value, t, e); return; }
      clearTimeout(typing); const v = t.value, pos = t.selectionStart;
      typing = setTimeout(() => { fn(v, t, e); const again = document.querySelector(`[data-k3-input="${CSS.escape(name)}"]`); if (again && again !== document.activeElement && again.matches("input")) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (x) { /* a search field in some browsers */ } } }, 180);
    }
  };
  document.addEventListener("input", input, true);

  PA.v3k = K;
})();
