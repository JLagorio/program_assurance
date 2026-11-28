// Before & after › Review all (route before-after-review): every screen of the flow study in all four versions, side by
// side, with Joe's feedback on each. Versions: v2 (V3 off), V3 (V3 on), the Drata after-screen (dr-… routes) and the
// Canvas Kit mockup (PA.ckba, drawn live). Screens come from PA.ckba.meta (one per Canvas Kit mockup, matched to the
// prototype by its route) plus every Drata pair whose screen has no mockup. v2 screenshots are rv/v2-<key>.jpg
// (rv/shoot.mjs, listed in PA.RVSHOTS); V3 uses ck/cur-<id>.jpg, or dr/cur-<pair>.jpg, or rv/v3-<key>.jpg.
// Feedback (PA.fb): likes and dislikes per version, a Keep choice per screen, and notes, pinned to a spot or not, also
// on any live screen through the floating Feedback button. Saved in the artifact's db collection "feedback" (Claude
// reads it with db_list), or in this browser's localStorage when the db is not reachable. Nothing of v2 or V3 changes.
(function () {
  const PA = window.PA; if (!PA || !PA.S) return;
  const { S, ROUTE_NAV, h } = PA;
  const { esc, header } = h;
  const ROUTE = "before-after-review";
  const W = 1440;
  const VERS = [["v2", "v2"], ["v3", "V3"], ["dr", "Drata"], ["ck", "Canvas Kit"]];
  const VLABEL = Object.fromEntries(VERS);
  const TAGS = ["Keep this", "Change", "Remove", "Question"];

  // ——— Feedback store ———
  const LKEY = "pa-rv-feedback";
  const items = new Map();
  let mode = "loading"; // "db" | "local" | "loading"
  let col = null;
  const listeners = new Set();
  const changed = () => listeners.forEach((f) => { try { f(); } catch (e) { /* a view that went away */ } });
  const safeId = (s) => String(s).replace(/[^A-Za-z0-9_\-.~:@+]/g, "_").slice(0, 180);
  const newId = () => "n-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  // This browser keeps a copy of the feedback (LKEY) and, apart, what was changed here and not yet saved to the
  // artifact (PKEY: id -> {op: "put"|"del", at, v: the doc put}). Only those changes go up on reconnect, so a note deleted on another
  // device, or here while offline, is not brought back from the copy.
  const PKEY = "pa-rv-feedback-pending";
  let pending = {};
  let failed = 0;
  let storeOk = true; // false once this browser refuses to keep the copy (storage off or full)
  function loadLocal() {
    try { const all = JSON.parse(localStorage.getItem(LKEY) || "{}"); Object.entries(all).forEach(([k, v]) => items.set(k, v)); } catch (e) { /* storage off */ }
    try {
      const p = localStorage.getItem(PKEY);
      if (p != null) pending = JSON.parse(p) || {};
      // A copy written before changes were tracked: everything in it may be unsaved, so it goes up as before.
      else items.forEach((v, k) => { pending[k] = { op: "put", at: v.at || "", v }; });
    } catch (e) { pending = {}; }
  }
  function saveLocal() {
    const was = storeOk;
    try { localStorage.setItem(LKEY, JSON.stringify(Object.fromEntries(items))); localStorage.setItem(PKEY, JSON.stringify(pending)); storeOk = true; } catch (e) { storeOk = false; }
    if (was !== storeOk) changed();
  }
  let localTimer = null;
  function useLocal() { if (mode === "db") return; mode = "local"; changed(); }
  // Each change made here goes up once; it leaves the queue only when its own write succeeds, so a rejected one is
  // kept (and shown as not saved) for the next time the page opens.
  // Every write is numbered; a write that ends clears or replaces the queued change for its id only if no later write
  // of that id has queued one since, so a slow older write never wipes a newer choice.
  let seq = Date.now(); // above any number a queued change kept from an earlier visit holds
  const newer = (id, n) => !pending[id] || (pending[id].n || 0) <= n;
  const settle = (id, n) => { if (newer(id, n)) delete pending[id]; saveLocal(); };
  const queue = (id, n, q) => { if (newer(id, n)) pending[id] = { ...q, n }; failed++; saveLocal(); changed(); };
  function sync() {
    Object.entries(pending).forEach(([k, p]) => {
      const n = (p.n = ++seq);
      const done = () => settle(k, n);
      const fail = (_k, v) => { if (newer(k, n) && v) items.set(k, v); queue(k, n, p); };
      const srv = items.get(k);
      if (p.op === "del") {
        if (srv && String(srv.at || "") <= String(p.at || "")) { items.delete(k); col.doc(k).delete().then(done, () => fail(k)); }
        else delete pending[k];
      } else {
        const v = p.v || local.get(k);
        if (v && (!srv || String(v.at || "") > String(srv.at || ""))) { items.set(k, v); col.doc(k).set(v).then(done, () => fail(k, v)); }
        else delete pending[k];
      }
    });
  }
  let local = new Map();
  async function init() {
    loadLocal();
    const c = window.claude;
    if (!c || typeof c.use !== "function") { useLocal(); return; }
    localTimer = setTimeout(useLocal, 10000);
    let db = null;
    try { db = await c.use("db"); } catch (e) { db = null; }
    if (!db) { clearTimeout(localTimer); useLocal(); return; }
    col = db.collection("feedback");
    col.onSnapshot((snap) => {
      clearTimeout(localTimer);
      local = new Map(items);
      items.clear();
      snap.docs.forEach((d) => { const v = d.data(); if (v) items.set(d.id, v); });
      const was = mode; mode = "db";
      // What was changed on this device before the db answered goes up once, where it is newer than the server's.
      if (was !== "db") sync();
      // A change still queued here (a write that failed) shows over the server's copy until it goes up.
      else Object.entries(pending).forEach(([k, p]) => { if (p.op === "del") items.delete(k); else if (p.v) items.set(k, p.v); });
      saveLocal();
      changed();
    }, () => { clearTimeout(localTimer); col = null; mode = "local"; changed(); });
  }
  async function put(id, doc) {
    id = safeId(id);
    items.set(id, doc); changed();
    if (mode === "db" && col) {
      // Queued before the write, so a reload while it is in flight retries it.
      const n = ++seq; pending[id] = { op: "put", at: doc.at || "", v: doc, n }; saveLocal();
      try { await col.doc(id).set(doc); settle(id, n); }
      catch (e) { queue(id, n, { op: "put", at: doc.at || "", v: doc }); toast("Could not save to the artifact; kept on this device"); }
    } else { pending[id] = { op: "put", at: doc.at || "", v: doc, n: ++seq }; saveLocal(); }
  }
  async function drop(id) {
    id = safeId(id);
    items.delete(id); changed();
    if (mode === "db" && col) {
      const n = ++seq; pending[id] = { op: "del", at: new Date().toISOString(), n }; saveLocal();
      try { await col.doc(id).delete(); settle(id, n); }
      catch (e) { queue(id, n, { op: "del", at: new Date().toISOString() }); toast("Could not delete from the artifact; will retry next time"); }
    } else { pending[id] = { op: "del", at: new Date().toISOString(), n: ++seq }; saveLocal(); }
  }
  const all = () => [...items.entries()].map(([id, v]) => ({ id, ...v }));
  const votes = (screen) => all().filter((x) => x.kind === "vote" && x.screen === screen);
  const vote = (screen, ver) => { const v = items.get(safeId(`vote~${screen}~${ver}`)); return v ? v.vote : ""; };
  const keep = (screen) => { const v = items.get(safeId(`keep~${screen}`)); return v ? v.keep : ""; };
  const notes = (screen) => all().filter((x) => x.kind === "note" && x.screen === screen).sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const now = () => new Date().toISOString();
  function setVote(screen, ver, v, ctx) {
    const id = `vote~${screen}~${ver}`;
    if (vote(screen, ver) === v || !v) return drop(id);
    return put(id, { kind: "vote", screen, ver, vote: v, title: ctx && ctx.title, route: ctx && ctx.route, at: now() });
  }
  function setKeep(screen, k, ctx) {
    const id = `keep~${screen}`;
    if (keep(screen) === k || !k) return drop(id);
    return put(id, { kind: "keep", screen, keep: k, title: ctx && ctx.title, at: now() });
  }
  PA.fb = { all, put, drop, vote, keep, notes, mode: () => mode, on: (f) => { listeners.add(f); return () => listeners.delete(f); } };

  // ——— Screens ———
  const shots = () => PA.RVSHOTS || {};
  const DR = () => (PA.DRBA && PA.DRBA.pairs) || [];
  function screens() {
    const meta = (PA.ckba && PA.ckba.meta) || [];
    const out = [];
    const byRoute = new Map();
    meta.forEach((m) => {
      const pattern = m.now === false;
      const s = { key: m.id, title: m.title, group: m.group || "Canvas Kit", route: m.route || null, ck: m.id, pattern, dr: [] };
      out.push(s);
      if (m.route && !pattern && !byRoute.has(m.route)) byRoute.set(m.route, s);
    });
    const extra = [];
    DR().forEach((p) => {
      const cur = p.current && p.current.route, aft = p.after && p.after.route;
      if (!aft) return;
      const d = { id: p.id, title: p.title, route: aft, img: p.aft || `dr/aft-${p.id}.jpg`, cur: p.new ? null : p.cur || `dr/cur-${p.id}.jpg` };
      const s = cur && byRoute.get(cur);
      if (s) s.dr.push(d);
      else extra.push({ key: "dr:" + p.id, title: p.title, group: "Drata screens with no Canvas Kit mockup yet", route: p.new ? null : cur || null, ck: null, pattern: false, dr: [d], v3img: d.cur });
    });
    return out.concat(extra);
  }
  const fileId = (k) => String(k).replace(/[^A-Za-z0-9_-]/g, "_");
  const imgV2 = (s) => (shots()["v2-" + fileId(s.key)] ? `rv/v2-${fileId(s.key)}.jpg` : null);
  const imgV3 = (s) => (s.ck && !s.pattern && !shots()["v3-" + fileId(s.key)] ? `ck/cur-${s.ck}.jpg` : shots()["v3-" + fileId(s.key)] ? `rv/v3-${fileId(s.key)}.jpg` : s.v3img || null);
  const has = (s, v) => (v === "ck" ? !!s.ck : v === "dr" ? s.dr.length > 0 : !s.pattern && !!s.route);
  const reviewed = (s) => votes(s.key).length > 0 || !!keep(s.key) || notes(s.key).length > 0;

  // ——— Open a version live ———
  // The screen a live page was opened from, so feedback there goes to that card even where two screens share a page
  // (authorization-decisions and authorization-conditions are both v2's authorization).
  let origin = null;
  function openLive(s, v, drIdx) {
    origin = { key: s.key, ver: v, route: v === "dr" ? (s.dr[drIdx || 0] || {}).route : v === "v2" ? v2route(s.route) : s.route, sub: drIdx || 0 };
    if (v === "ck") { location.hash = "before-after-canvas"; setTimeout(() => { const t = document.getElementById("ckba-" + s.ck); if (t) t.scrollIntoView({ block: "start" }); }, 400); return; }
    const route = v === "dr" ? (s.dr[drIdx || 0] || {}).route : s.route;
    if (!route) return;
    if (PA.v2hubs && PA.v2hubs.cur() !== "PRG-1090") PA.v2hubs.setCur("PRG-1090");
    if (v === "v2") { const r2 = v2route(route); if (PA.v3 && PA.v3.on()) PA.v3.set(false, { redraw: false }); return goV2(r2); }
    if (PA.v3ba && PA.v3ba.see) PA.v3ba.see({ route, prog: "wsx" });
    else { if (PA.v3 && !PA.v3.on()) PA.v3.set(true); location.hash = route; }
  }

  // The page v2 draws for a route: V3's own pages name their v2 page (PA.v3.compareAs).
  function v2route(r) { return (PA.v3 && PA.v3.wasOf && PA.v3.wasOf(r)) || r; }
  function goV2(route) { if ((location.hash || "").slice(1) === route) { if (PA.v3) PA.v3.refresh(); } else location.hash = route; }

  // ——— Pieces ———
  const ICON = { up: "👍", down: "👎", pin: "📍", note: "💬" };
  const pinsOf = (key, ver, sub) => notes(key).filter((n) => n.ver === ver && n.x != null && (n.sub || 0) === (sub || 0));
  function pinLayer(key, ver, sub) {
    const ids = notes(key).filter((n) => n.x != null).map((n) => n.id);
    return pinsOf(key, ver, sub).map((n) => `<button type="button" class="rv-pin" style="left:${Number(n.x)}%;top:${Number(n.y)}%" data-rv-note="${esc(n.id)}" aria-label="Note ${ids.indexOf(n.id) + 1}: ${esc(n.text || "")}">${ids.indexOf(n.id) + 1}</button>`).join("");
  }
  function voteBtns(key, ver) {
    const v = vote(key, ver);
    return `<span class="rv-votes" data-rv-votes="${esc(key)}|${ver}"><button type="button" class="rv-vb${v === "up" ? " on up" : ""}" data-rv-vote="${esc(key)}|${ver}|up" aria-pressed="${v === "up"}" aria-label="Like ${VLABEL[ver]}">${ICON.up}</button><button type="button" class="rv-vb${v === "down" ? " on down" : ""}" data-rv-vote="${esc(key)}|${ver}|down" aria-pressed="${v === "down"}" aria-label="Dislike ${VLABEL[ver]}">${ICON.down}</button></span>`;
  }
  function stage(s, ver, sub) {
    const k = esc(s.key);
    const wrap = (inner, cls) => `<div class="rv-stage${cls ? " " + cls : ""}" data-rv-stage="${k}|${ver}|${sub || 0}">${inner}<div class="rv-pins">${pinLayer(s.key, ver, sub)}</div></div>`;
    if (ver === "ck") return wrap(`<div class="rv-fit" data-rv-fit data-rv-ck="${esc(s.ck)}"><div class="rv-ph">Drawing the mockup…</div></div>`, "rv-st-ck");
    let img = null, alt = "";
    if (ver === "v2") { img = imgV2(s); alt = `${s.title} in v2`; }
    if (ver === "v3") { img = imgV3(s); alt = `${s.title} in V3`; }
    if (ver === "dr") { const d = s.dr[sub || 0]; img = d && d.img; alt = `${d ? d.title : s.title}, after Drata`; }
    if (!img && ver === "v2" && shots()["v2-" + fileId(s.key)] === 0) return wrap(`<div class="rv-none"><p>v2 has no page for this screen. It is new in V3.</p></div>`);
    if (!img) return wrap(`<div class="rv-none"><p>${ver === "v2" ? "No v2 screenshot yet." : "No screenshot yet."}</p><button type="button" class="btn sm" data-rv-open="${k}|${ver}|${sub || 0}">Open it live</button></div>`);
    return wrap(`<img src="${esc(img)}" alt="${esc(alt)}" loading="lazy" draggable="false">`);
  }
  function pane(s, ver) {
    const k = esc(s.key);
    if (!has(s, ver)) {
      const why = ver === "ck" ? "No Canvas Kit mockup yet." : ver === "dr" ? "Drata's study did not redraw this screen." : "No screen for this today: it is a new Canvas Kit pattern.";
      return `<div class="rv-pane rv-pane-off" data-rv-pane="${k}|${ver}"><div class="rv-ph-h"><span class="rv-vt rv-${ver}">${VLABEL[ver]}</span></div><div class="rv-empty">${esc(why)}</div></div>`;
    }
    const subs = ver === "dr" ? s.dr : [null];
    return `<div class="rv-pane" data-rv-pane="${k}|${ver}">
      <div class="rv-ph-h"><span class="rv-vt rv-${ver}">${VLABEL[ver]}</span>${voteBtns(s.key, ver)}<span class="rv-sp"></span>
        <button type="button" class="rv-ib" data-rv-arm="${k}|${ver}" aria-pressed="false" title="Pin a note to a spot">${ICON.pin}<span>Pin</span></button>
        <button type="button" class="rv-ib" data-rv-add="${k}|${ver}" title="Add a note">${ICON.note}<span>Note</span></button>
        <button type="button" class="rv-ib" data-rv-open="${k}|${ver}|0" title="Open it live">↗</button></div>
      ${subs.map((d, i) => `${d && subs.length > 1 ? `<div class="rv-sub">${esc(d.title)}</div>` : ""}${stage(s, ver, i)}`).join("")}
    </div>`;
  }
  function keepRow(s) {
    const kv = keep(s.key);
    const opts = VERS.filter(([v]) => has(s, v)).concat([["mix", "Mix"]]);
    return `<div class="rv-keep" data-rv-keeprow="${esc(s.key)}"><span class="rv-keep-l">Keep</span>${opts.map(([v, l]) => `<button type="button" class="rv-chip${kv === v ? " on" : ""}" data-rv-keep="${esc(s.key)}|${v}" aria-pressed="${kv === v}">${l}</button>`).join("")}</div>`;
  }
  function noteList(s) {
    const ns = notes(s.key), pinned = ns.filter((n) => n.x != null);
    if (!ns.length) return `<p class="rv-quiet">No notes yet. Tap 💬 Note, or 📍 Pin and then the spot you mean.</p>`;
    return `<ul class="rv-nl">${ns.map((n) => `<li data-rv-li="${esc(n.id)}"><span class="rv-vt rv-${esc(n.ver)}">${esc(VLABEL[n.ver] || n.ver || "")}</span>${n.x != null ? `<span class="rv-pn">${pinned.indexOf(n) + 1}</span>` : ""}${n.tag ? `<span class="rv-tag">${esc(n.tag)}</span>` : ""}<span class="rv-nt">${esc(n.text || "")}</span><button type="button" class="rv-x" data-rv-del="${esc(n.id)}" aria-label="Delete note">✕</button></li>`).join("")}</ul>`;
  }
  function counts(s) {
    const n = notes(s.key).length, kv = keep(s.key);
    return `${kv ? `<span class="rv-kept">Keep: ${esc(kv === "mix" ? "Mix" : VLABEL[kv] || kv)}</span>` : ""}${n ? `<span class="num">${n} ${n === 1 ? "note" : "notes"}</span>` : ""}${!reviewed(s) ? `<span class="rv-new">Not reviewed</span>` : ""}`;
  }
  function card(s) {
    const k = esc(s.key);
    const avail = VERS.filter(([v]) => has(s, v)).map(([v]) => v);
    return `<section class="rv-card" id="rv-${safeId(s.key)}" data-rv-card="${k}">
      <div class="rv-ch"><div><h3 tabindex="-1">${esc(s.title)}</h3><div class="facts rv-facts" data-rv-counts="${k}">${counts(s)}</div></div></div>
      <div class="rv-vtabs" role="tablist" aria-label="Versions of ${esc(s.title)}">${VERS.map(([v, l]) => `<button type="button" role="tab" class="rv-vtab rv-${v}${avail.includes(v) ? "" : " off"}" data-rv-goto="${k}|${v}">${l}</button>`).join("")}</div>
      <div class="rv-track" data-rv-track="${k}">${VERS.map(([v]) => pane(s, v)).join("")}</div>
      ${keepRow(s)}
      <div class="rv-notes" data-rv-notes="${k}">${noteList(s)}</div>
    </section>`;
  }

  // ——— The page ———
  let filter = "all";
  let layout = null; // "swipe" | "grid"; default from the width
  try { const l = localStorage.getItem("pa-rv-layout"); if (l === "swipe" || l === "grid") layout = l; } catch (e) { /* storage off */ }
  const lay = () => layout || (window.innerWidth >= 1100 ? "grid" : "swipe");
  function storeLine() {
    const m = mode;
    return m === "local" && !storeOk ? `<span class="rv-store warn">Not saved: this browser will not keep it and the artifact cannot be reached. Use Copy all feedback before you leave.</span>` : m === "db" && failed && !storeOk ? `<span class="rv-store warn">${failed} change${failed > 1 ? "s" : ""} could not be saved to the artifact, and this browser will not keep them. Use Copy all feedback before you leave.</span>` : m === "db" && failed ? `<span class="rv-store warn">${failed} change${failed > 1 ? "s" : ""} could not be saved to the artifact; kept on this device and sent next time it opens.</span>` : m === "db" ? `<span class="rv-store ok">Saved to the artifact. Claude can read it.</span>` : m === "local" ? `<span class="rv-store warn">Saved on this device only. Use Copy all feedback to send it.</span>` : `<span class="rv-store">Connecting…</span>`;
  }
  function summary() {
    const ss = screens(), r = ss.filter(reviewed).length, n = all().filter((x) => x.kind === "note").length;
    return `<span class="num">${ss.length} screens</span><span class="num">${r} reviewed</span><span class="num">${n} notes</span>`;
  }
  function draw() {
    const tabsHtml = S["before-after"] ? (() => { const t = document.createElement("template"); t.innerHTML = S["before-after"](); const el = t.content.querySelector(".ba-tabs"); if (el) el.querySelectorAll('[role="tab"]').forEach((x) => { const sel = x.dataset.go === ROUTE; x.setAttribute("aria-selected", String(sel)); x.classList.toggle("on", sel); }); return el ? el.outerHTML : ""; })() : "";
    const ss = screens();
    const shown = ss.filter((s) => filter === "all" || (filter === "todo" ? !reviewed(s) : filter === "notes" ? notes(s.key).length > 0 : true));
    const groups = [...new Set(ss.map((s) => s.group))];
    setTimeout(after, 0);
    return `<div class="main ba rv rv-${lay()}">${header("Before, v1, v2 and V3", `<span data-rv-sum>${summary()}</span>`, "")}${tabsHtml}
      <section class="rv-hero"><h2>Review all: every screen in every version</h2>
        <p class="ba-lede">Each screen as it is in <b>v2</b>, in <b>V3</b>, after <b>Drata</b>'s patterns and as a <b>Canvas Kit</b> mockup. Swipe between them (or see them side by side on a wide screen), tap 👍 or 👎 on each, pick what to <b>Keep</b> for the screen, and leave notes: 💬 Note for the whole version, 📍 Pin then tap the spot you mean. Tap a screenshot to see it full size. The 💬 Feedback button works on every other screen of the prototype too.</p>
        <div class="rv-bar">
          <div class="ba-switch" role="group" aria-label="Show">${[["all", "All"], ["todo", "Not reviewed"], ["notes", "With notes"]].map(([k, l]) => `<button type="button" data-rv-filter="${k}" aria-pressed="${filter === k}">${l}</button>`).join("")}</div>
          <div class="ba-switch" role="group" aria-label="Layout">${[["swipe", "Swipe"], ["grid", "Side by side"]].map(([k, l]) => `<button type="button" data-rv-layout="${k}" aria-pressed="${lay() === k}">${l}</button>`).join("")}</div>
          <label class="rv-jump"><span>Go to</span><select data-rv-jump><option value="">Screen…</option>${groups.map((g) => `<optgroup label="${esc(g)}">${ss.filter((s) => s.group === g).map((s) => `<option value="rv-${safeId(s.key)}">${esc(s.title)}${reviewed(s) ? " ✓" : ""}</option>`).join("")}</optgroup>`).join("")}</select></label>
        </div>
        <div class="rv-bar"><span data-rv-store>${storeLine()}</span><button type="button" class="btn sm" data-rv-export>Copy all feedback</button><button type="button" class="btn sm" data-rv-showjson>Show as text</button></div>
        <div class="rv-json" hidden><textarea readonly rows="8" aria-label="All feedback as JSON"></textarea></div>
      </section>
      ${groups.map((g) => { const list = shown.filter((s) => s.group === g); return list.length ? `<h4 class="ckba-g rv-g">${esc(g)} <span class="num">${list.length}</span></h4>${list.map(card).join("")}` : ""; }).join("")}
      ${shown.length ? "" : `<p class="rv-quiet">Nothing here: every screen is reviewed.</p>`}
    </div>`;
  }

  // Draw each Canvas Kit mockup when it comes near the screen, and scale it to its pane.
  const io = typeof IntersectionObserver === "function" ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); drawCk(e.target); } }), { rootMargin: "600px 600px" }) : null;
  function drawCk(el) {
    if (!PA.ckba || el.dataset.drawn) return;
    el.dataset.drawn = "1";
    el.innerHTML = PA.ckba.draw(el.dataset.rvCk);
    fit(el);
  }
  function fit(el) {
    const app = el.firstElementChild; if (!app || !el.dataset.drawn) return;
    const z = Math.min(1, (el.clientWidth || 1) / W);
    app.style.transformOrigin = "0 0"; app.style.width = W + "px";
    app.style.transform = z < 1 ? `scale(${z})` : "";
    el.style.height = `${Math.ceil(app.offsetHeight * z)}px`;
  }
  const fitAll = () => document.querySelectorAll(".rv [data-rv-fit]").forEach(fit);
  window.addEventListener("resize", () => { if (document.querySelector(".rv")) fitAll(); });
  function after() {
    document.querySelectorAll(".rv [data-rv-fit]").forEach((el) => { if (io) io.observe(el); else drawCk(el); });
    document.querySelectorAll(".rv [data-rv-track]").forEach(syncTabs);
    document.querySelectorAll(".rv [data-rv-track]").forEach((t) => t.addEventListener("scroll", () => syncTabs(t), { passive: true }));
    if (pendingJump) { const id = pendingJump; pendingJump = null; const t = document.getElementById(id); if (t) t.scrollIntoView({ block: "start" }); }
  }
  let pendingJump = null;
  function syncTabs(track) {
    const key = track.dataset.rvTrack, card = track.closest(".rv-card"); if (!card) return;
    const panes = [...track.children];
    let best = 0, bd = Infinity;
    const x = track.scrollLeft;
    panes.forEach((p, i) => { const d = Math.abs(p.offsetLeft - track.offsetLeft - x); if (d < bd) { bd = d; best = i; } });
    card.querySelectorAll(".rv-vtab").forEach((b, i) => { const on = lay() === "swipe" && i === best; b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on)); });
    void key;
  }

  // Update the parts of a card that feedback changes, leaving the screenshots and mockups as they are.
  function refresh() {
    const root = document.querySelector(".rv");
    if (root) {
      const ss = screens();
      root.querySelectorAll("[data-rv-card]").forEach((c) => {
        const s = ss.find((x) => x.key === c.dataset.rvCard); if (!s) return;
        const set = (sel, html) => { const el = c.querySelector(sel); if (el) el.innerHTML = html; };
        set("[data-rv-counts]", counts(s));
        const kr = c.querySelector(".rv-keep"); if (kr) kr.outerHTML = keepRow(s);
        set("[data-rv-notes]", noteList(s));
        c.querySelectorAll("[data-rv-votes]").forEach((v) => { const [, ver] = v.dataset.rvVotes.split("|"); v.outerHTML = voteBtns(s.key, ver); });
        c.querySelectorAll("[data-rv-stage]").forEach((st) => { const [, ver, sub] = st.dataset.rvStage.split("|"); const p = st.querySelector(".rv-pins"); if (p) p.innerHTML = pinLayer(s.key, ver, Number(sub)); });
      });
      const sm = root.querySelector("[data-rv-sum]"); if (sm) sm.innerHTML = summary();
      const st = root.querySelector("[data-rv-store]"); if (st) st.innerHTML = storeLine();
    }
    drawFab(); drawLivePins();
    const zm = document.getElementById("rv-zoom"); if (zm && !zm.hidden && zm.dataset.stage) { const [k, ver, sub] = zm.dataset.stage.split("|"); const p = zm.querySelector(".rv-pins"); if (p) p.innerHTML = pinLayer(k, ver, Number(sub)); }
  }
  PA.fb.on(refresh);

  // ——— Composer: a bottom sheet for a note ———
  let draft = null; // { screen, ver, sub, x, y, el, route, title, v3, live }
  function sheet() {
    let el = document.getElementById("rv-sheet");
    if (!el) { el = document.createElement("div"); el.id = "rv-sheet"; el.className = "rv-sheet-back"; el.hidden = true; document.body.appendChild(el); }
    return el;
  }
  function openComposer(d) {
    draft = d;
    const el = sheet();
    const where = d.x != null || d.px != null ? `📍 Pinned${d.el ? `: ${esc(d.el)}` : " to a spot"}` : "The whole screen";
    const s = d.screen && screens().find((x) => x.key === d.screen);
    const prev = d.live ? notes(d.screen).filter((n) => n.ver === d.ver) : [];
    const v = vote(d.screen, d.ver);
    el.innerHTML = `<div class="rv-sheet" role="dialog" aria-modal="true" aria-labelledby="rv-sh-t">
      <div class="rv-sh-h"><div><b id="rv-sh-t">${esc((s && s.title) || d.title || d.screen)}</b><span class="rv-vt rv-${esc(d.ver)}">${esc(VLABEL[d.ver] || d.ver)}</span></div><button type="button" class="rv-x" data-rv-sh="close" aria-label="Close">✕</button></div>
      ${d.live ? `<div class="rv-sh-votes"><button type="button" class="rv-vb${v === "up" ? " on up" : ""}" data-rv-vote="${esc(d.screen)}|${esc(d.ver)}|up" aria-pressed="${v === "up"}">${ICON.up} Like</button><button type="button" class="rv-vb${v === "down" ? " on down" : ""}" data-rv-vote="${esc(d.screen)}|${esc(d.ver)}|down" aria-pressed="${v === "down"}">${ICON.down} Dislike</button><button type="button" class="rv-ib" data-rv-sh="pin">${ICON.pin} Pin to a spot</button></div>` : ""}
      <p class="rv-where">${where}</p>
      <div class="rv-tags">${TAGS.map((t) => `<button type="button" class="rv-chip" data-rv-tag="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join("")}</div>
      <textarea id="rv-text" rows="4" placeholder="What do you like, or what should change?"></textarea>
      <div class="rv-sh-f"><button type="button" class="btn" data-rv-sh="close">Cancel</button><button type="button" class="btn ink" data-rv-sh="save">Save note</button></div>
      ${prev.length ? `<div class="rv-sh-prev"><b>Notes on this screen</b>${noteListOf(prev)}</div>` : ""}
    </div>`;
    el.hidden = false;
    setTimeout(() => { const t = document.getElementById("rv-text"); if (t) t.focus(); }, 30);
  }
  const noteListOf = (ns) => `<ul class="rv-nl">${ns.map((n) => `<li><span class="rv-pn">${n.x != null || n.px != null ? "📍" : "💬"}</span>${n.tag ? `<span class="rv-tag">${esc(n.tag)}</span>` : ""}<span class="rv-nt">${esc(n.text || "")}</span><button type="button" class="rv-x" data-rv-del="${esc(n.id)}" aria-label="Delete note">✕</button></li>`).join("")}</ul>`;
  function closeComposer() { const el = sheet(); el.hidden = true; el.innerHTML = ""; draft = null; }
  function saveDraft() {
    if (!draft) return;
    const t = document.getElementById("rv-text");
    const text = (t && t.value || "").trim();
    const tagEl = document.querySelector("#rv-sheet [data-rv-tag][aria-pressed='true']");
    const tag = tagEl ? tagEl.dataset.rvTag : "";
    if (!text && !tag) { if (t) { t.focus(); t.placeholder = "Write a note, or pick a tag, first."; } return; }
    const d = draft;
    const doc = { kind: "note", screen: d.screen, ver: d.ver, text, tag, at: now(), title: d.title || null, route: d.route || null, v3: !!d.v3 };
    if (d.sub) doc.sub = d.sub;
    if (d.x != null) { doc.x = Math.round(d.x * 10) / 10; doc.y = Math.round(d.y * 10) / 10; }
    if (d.px != null) { doc.px = Math.round(d.px * 10) / 10; doc.py = Math.round(d.py); }
    if (d.el) doc.el = d.el;
    put(newId(), doc);
    closeComposer();
    toast(mode === "db" ? "Note saved" : "Note saved on this device");
  }

  // ——— Pinning ———
  let arm = null; // review: "key|ver"; live: "live"
  function setArm(a) {
    arm = a;
    document.querySelectorAll("[data-rv-arm]").forEach((b) => { const on = b.dataset.rvArm === a; b.setAttribute("aria-pressed", String(on)); b.classList.toggle("on", on); });
    document.querySelectorAll("[data-rv-stage]").forEach((st) => { const [k, ver] = st.dataset.rvStage.split("|"); st.classList.toggle("armed", a === `${k}|${ver}`); });
    const z = document.getElementById("rv-zoom"); if (z) z.classList.toggle("armed", !!a && a === z.dataset.arm);
    let hint = document.getElementById("rv-hint");
    if (a) {
      if (!hint) { hint = document.createElement("div"); hint.id = "rv-hint"; hint.className = "rv-hint"; document.body.appendChild(hint); }
      hint.innerHTML = `<span>${ICON.pin} Tap the spot you mean</span><button type="button" class="btn sm" data-rv-unarm>Cancel</button>`;
    } else if (hint) hint.remove();
  }
  function describe(el) {
    if (!el) return "";
    const t = (el.closest("button, a, th, td, tr, h1, h2, h3, h4, label, li, [role=tab]") || el);
    const txt = (t.innerText || t.textContent || "").replace(/\s+/g, " ").trim().slice(0, 70);
    const head = (() => { let n = t; while (n && n.id !== "main") { const hd = n.querySelector && n.querySelector(":scope > h2, :scope > h3, :scope > h4, :scope > .card-h, :scope > header"); if (hd && hd !== t) return (hd.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40); n = n.parentElement; } return ""; })();
    return [head, txt].filter(Boolean).join(" › ");
  }

  // ——— Full-size viewer ———
  function zoom(stageEl) {
    const img = stageEl.querySelector("img"); if (!img) return;
    let z = document.getElementById("rv-zoom");
    if (!z) { z = document.createElement("div"); z.id = "rv-zoom"; z.className = "rv-zoom"; z.hidden = true; document.body.appendChild(z); }
    const [k, ver, sub] = stageEl.dataset.rvStage.split("|");
    z.dataset.stage = stageEl.dataset.rvStage; z.dataset.arm = `${k}|${ver}`;
    z.innerHTML = `<div class="rv-zh"><span class="rv-vt rv-${esc(ver)}">${esc(VLABEL[ver])}</span><b>${esc(img.alt)}</b><span class="rv-sp"></span><button type="button" class="rv-ib" data-rv-arm="${esc(k)}|${esc(ver)}" aria-pressed="false">${ICON.pin}<span>Pin</span></button><button type="button" class="rv-ib" data-rv-zfit>Fit</button><button type="button" class="rv-x" data-rv-zclose aria-label="Close">✕</button></div>
      <div class="rv-zs"><div class="rv-stage rv-zstage" data-rv-stage="${esc(z.dataset.stage)}"><img src="${esc(img.getAttribute("src"))}" alt="${esc(img.alt)}"><div class="rv-pins">${pinLayer(k, ver, Number(sub))}</div></div></div>`;
    z.hidden = false; z.classList.remove("fit");
    document.documentElement.classList.add("rv-noscroll");
  }
  function closeZoom() { const z = document.getElementById("rv-zoom"); if (z) { z.hidden = true; z.innerHTML = ""; } document.documentElement.classList.remove("rv-noscroll"); if (arm && arm !== "live") setArm(null); }

  // ——— Floating Feedback button on every other screen ———
  const cur = () => (location.hash || "#home").slice(1);
  function liveCtx() {
    const r = cur();
    if (r === ROUTE) return null;
    const ss = screens();
    if (r === "before-after-canvas") {
      // The Canvas Kit tab lists every mockup: feedback goes to the mockup in view, as on its Review all card.
      const mid = innerHeight / 2;
      const sec = [...document.querySelectorAll('#main [id^="ckba-"]')].find((el) => { const b = el.getBoundingClientRect(); return b.top <= mid && b.bottom >= mid && ss.some((x) => x.ck && "ckba-" + x.ck === el.id); });
      const m = sec && ss.find((x) => x.ck && "ckba-" + x.ck === sec.id);
      return m ? { screen: m.key, ver: "ck", title: m.title, route: r } : { screen: "page:" + r, ver: "ck", title: "Canvas Kit tab", route: r };
    }
    const isDr = r.startsWith("dr-");
    const v3 = !!(PA.v3 && PA.v3.on());
    const ver = isDr ? "dr" : v3 ? "v3" : "v2";
    let s = null, sub = 0;
    const o = origin && origin.route === r && origin.ver === ver && ss.find((x) => x.key === origin.key);
    if (o) { s = o; sub = origin.sub; }
    else if (isDr) { for (const x of ss) { const i = x.dr.findIndex((d) => d.route === r); if (i >= 0) { s = x; sub = i; break; } } }
    // With V3 off, a V3 page shows as the v2 page it replaced (PA.v3.compareAs), so the screen is found by that too.
    else s = ss.find((x) => x.route === r && !x.pattern) || (!v3 ? ss.find((x) => x.route && !x.pattern && v2route(x.route) === r) : null);
    const hd = document.querySelector("#main h1, #main h2");
    return { screen: s ? s.key : "route:" + r, ver, sub, title: s ? s.title : (hd ? hd.textContent.trim().slice(0, 80) : r), route: r, v3, live: true };
  }
  function drawFab() {
    let b = document.getElementById("rv-fab");
    const c = liveCtx();
    if (!c) { if (b) b.hidden = true; return; }
    if (!b) { b = document.createElement("button"); b.type = "button"; b.id = "rv-fab"; b.className = "rv-fab"; b.setAttribute("data-rv-fab", ""); document.body.appendChild(b); }
    const n = notes(c.screen).filter((x) => x.ver === c.ver).length;
    b.hidden = false;
    b.innerHTML = `💬 <span>Feedback</span>${n ? `<span class="rv-fab-n">${n}</span>` : ""}`;
    b.setAttribute("aria-label", `Feedback on this screen (${VLABEL[c.ver]})${n ? `, ${n} notes` : ""}`);
  }
  function drawLivePins() {
    const main = document.getElementById("main"); if (!main) return;
    let layer = main.querySelector(":scope > .rv-livepins");
    const c = liveCtx();
    // The Canvas Kit tab holds every mockup, so its pins are every pinned note made on it, whichever mockup it names.
    const list = !c ? [] : c.route === "before-after-canvas" ? all().filter((n) => n.kind === "note" && n.ver === "ck" && n.px != null && n.route === c.route).sort((x, y) => String(x.at).localeCompare(String(y.at))) : notes(c.screen).filter((n) => n.ver === c.ver && n.px != null && n.route === c.route);
    if (!list.length) { if (layer) layer.remove(); return; }
    if (!layer) { layer = document.createElement("div"); layer.className = "rv-livepins"; main.appendChild(layer); }
    layer.innerHTML = list.map((n, i) => `<button type="button" class="rv-pin" style="left:${Number(n.px)}%;top:${Number(n.py)}px" data-rv-note="${esc(n.id)}" aria-label="Note ${i + 1}: ${esc(n.text || "")}">${i + 1}</button>`).join("");
  }
  // The card a live page was opened from holds only until the reader leaves that page.
  window.addEventListener("hashchange", () => { if (origin) { if (cur() === origin.route) origin.seen = true; else if (origin.seen) origin = null; } closeComposer(); if (arm) setArm(null); setTimeout(() => { drawFab(); drawLivePins(); }, 60); });
  let fabTimer = null;
  window.addEventListener("scroll", () => { if (cur() !== "before-after-canvas" || fabTimer) return; fabTimer = setTimeout(() => { fabTimer = null; drawFab(); }, 200); }, { passive: true });
  window.addEventListener("v3change", () => setTimeout(() => { drawFab(); drawLivePins(); }, 60));

  // A pin's note, shown in place.
  function showNote(id, at) {
    const n = items.get(id); if (!n) return;
    let pop = document.getElementById("rv-pop");
    if (!pop) { pop = document.createElement("div"); pop.id = "rv-pop"; pop.className = "rv-pop"; document.body.appendChild(pop); }
    pop.innerHTML = `<div>${n.tag ? `<span class="rv-tag">${esc(n.tag)}</span>` : ""}${esc(n.text || "")}</div><div class="rv-pop-f"><span>${esc(VLABEL[n.ver] || "")}${n.el ? ` · ${esc(n.el)}` : ""}</span><button type="button" class="rv-x" data-rv-del="${esc(id)}" aria-label="Delete note">Delete</button></div>`;
    const r = at.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(window.innerWidth - 288, r.left - 8)) + "px";
    pop.style.top = Math.min(window.innerHeight - 140, r.bottom + 6) + "px";
    pop.hidden = false;
  }
  const hidePop = () => { const p = document.getElementById("rv-pop"); if (p) p.hidden = true; };

  function toast(t) {
    let el = document.getElementById("rv-toast");
    if (!el) { el = document.createElement("div"); el.id = "rv-toast"; el.className = "rv-toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = t; el.classList.add("on");
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("on"), 2200);
  }
  function exportText() {
    return JSON.stringify({ exported: now(), saved: mode, feedback: all().sort((a, b) => String(a.at).localeCompare(String(b.at))) }, null, 1);
  }

  // ——— Events ———
  const find = (k) => screens().find((s) => s.key === k);
  // Pinning captures the tap before the prototype's own handlers see it.
  document.addEventListener("click", (e) => {
    const t = e.target; if (!arm || !t || !t.closest) return;
    if (t.closest("#rv-hint, #rv-sheet, [data-rv-arm], [data-rv-unarm], .rv-zh")) return;
    if (arm === "live") {
      const main = document.getElementById("main");
      if (!main || !main.contains(t)) return;
      e.preventDefault(); e.stopPropagation();
      const r = main.getBoundingClientRect();
      const c = liveCtx(); if (!c) { setArm(null); return; }
      const d = { ...c, px: ((e.clientX - r.left) / r.width) * 100, py: e.clientY - r.top + main.scrollTop, el: describe(t) };
      setArm(null); openComposer(d); return;
    }
    const st = t.closest("[data-rv-stage]");
    if (!st) return;
    const [k, ver, sub] = st.dataset.rvStage.split("|");
    if (arm !== `${k}|${ver}`) return;
    e.preventDefault(); e.stopPropagation();
    const r = st.getBoundingClientRect();
    const s = find(k);
    setArm(null);
    openComposer({ screen: k, ver, sub: Number(sub) || 0, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, title: s && s.title, route: s && s.route });
  }, true);

  document.addEventListener("click", (e) => {
    const t = e.target; if (!t || !t.closest) return;
    const q = (sel) => t.closest(sel);
    let b;
    if (!q("#rv-pop") && !q("[data-rv-note]")) hidePop();
    if ((b = q("[data-rv-fab]"))) { const c = liveCtx(); if (c) openComposer(c); return; }
    if ((b = q("[data-rv-sh]"))) {
      const a = b.dataset.rvSh;
      if (a === "close") closeComposer();
      else if (a === "save") saveDraft();
      else if (a === "pin") { closeComposer(); setArm("live"); }
      return;
    }
    if ((b = q("[data-rv-tag]"))) { const on = b.getAttribute("aria-pressed") !== "true"; b.parentElement.querySelectorAll("[data-rv-tag]").forEach((x) => { x.setAttribute("aria-pressed", "false"); x.classList.remove("on"); }); if (on) { b.setAttribute("aria-pressed", "true"); b.classList.add("on"); } return; }
    if (t === document.getElementById("rv-sheet")) { closeComposer(); return; }
    if ((b = q("[data-rv-unarm]"))) { setArm(null); return; }
    if ((b = q("[data-rv-vote]"))) {
      const [k, ver, v] = b.dataset.rvVote.split("|"); const s = find(k); const c = liveCtx();
      setVote(k, ver, v, { title: s ? s.title : c && c.title, route: s ? s.route : c && c.route }).then(() => {
        const sh = document.querySelector("#rv-sheet:not([hidden]) .rv-sh-votes");
        if (sh) sh.querySelectorAll("[data-rv-vote]").forEach((x) => { const vv = x.dataset.rvVote.split("|")[2], on = vote(k, ver) === vv; x.classList.toggle("on", on); x.classList.toggle(vv, on); x.setAttribute("aria-pressed", String(on)); });
      });
      return;
    }
    if ((b = q("[data-rv-note]"))) { e.preventDefault(); showNote(b.dataset.rvNote, b); return; }
    if ((b = q("[data-rv-del]"))) { drop(b.dataset.rvDel); hidePop(); const sh = document.querySelector("#rv-sheet:not([hidden])"); if (sh && draft) {
        // Rebuild the sheet's list, keeping what was being typed and the tag chosen.
        const ta = sh.querySelector("#rv-text"), txt = ta ? ta.value : "", tg = (sh.querySelector("[data-rv-tag][aria-pressed='true']") || {}).dataset;
        openComposer(draft);
        const ta2 = document.querySelector("#rv-sheet #rv-text"); if (ta2) { ta2.value = txt; ta2.focus(); }
        if (tg && tg.rvTag) { const c = [...document.querySelectorAll("#rv-sheet [data-rv-tag]")].find((x) => x.dataset.rvTag === tg.rvTag); if (c) { c.setAttribute("aria-pressed", "true"); c.classList.add("on"); } }
      }
      return; }
    if ((b = q("[data-rv-zclose]"))) { closeZoom(); return; }
    if ((b = q("[data-rv-zfit]"))) { document.getElementById("rv-zoom").classList.toggle("fit"); return; }
    if ((b = q("[data-rv-arm]"))) { const a = b.dataset.rvArm; setArm(arm === a ? null : a); return; }
    if (!q(".rv") && !q("#rv-zoom")) return;
    if ((b = q("[data-rv-keep]"))) { const [k, v] = b.dataset.rvKeep.split("|"); const s = find(k); setKeep(k, v, { title: s && s.title }); return; }
    if ((b = q("[data-rv-add]"))) { const [k, ver] = b.dataset.rvAdd.split("|"); const s = find(k); openComposer({ screen: k, ver, title: s && s.title, route: s && s.route }); return; }
    if ((b = q("[data-rv-open]"))) { const [k, ver, sub] = b.dataset.rvOpen.split("|"); const s = find(k); if (s) openLive(s, ver, Number(sub)); return; }
    if ((b = q("[data-rv-goto]"))) {
      const [k, ver] = b.dataset.rvGoto.split("|");
      const p = document.querySelector(`[data-rv-pane="${CSS.escape(k + "|" + ver)}"]`);
      if (p) { const tr = p.parentElement; tr.scrollTo({ left: p.offsetLeft - tr.offsetLeft, behavior: "smooth" }); if (lay() === "grid") p.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      return;
    }
    if ((b = q("[data-rv-filter]"))) { filter = b.dataset.rvFilter; PA.v3 && PA.v3.refresh ? PA.v3.refresh() : (document.getElementById("main").innerHTML = draw()); return; }
    if ((b = q("[data-rv-layout]"))) { layout = b.dataset.rvLayout; try { localStorage.setItem("pa-rv-layout", layout); } catch (x) { /* storage off */ } const root = document.querySelector(".rv"); if (root) { root.classList.remove("rv-swipe", "rv-grid"); root.classList.add("rv-" + layout); root.querySelectorAll("[data-rv-layout]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.rvLayout === layout))); setTimeout(() => { fitAll(); document.querySelectorAll(".rv [data-rv-track]").forEach(syncTabs); }, 30); } return; }
    if ((b = q("[data-rv-export]"))) {
      const txt = exportText();
      const done = () => toast("All feedback copied");
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => showJson(txt)); else showJson(txt);
      return;
    }
    if ((b = q("[data-rv-showjson]"))) { const w = document.querySelector(".rv-json"); if (w && !w.hidden) { w.hidden = true; return; } showJson(exportText()); return; }
    const st = q("[data-rv-stage]");
    if (st && !arm && st.querySelector("img") && !q(".rv-zstage")) { zoom(st); return; }
  });
  function showJson(txt) { const w = document.querySelector(".rv-json"); if (!w) return; w.hidden = false; const ta = w.querySelector("textarea"); ta.value = txt; ta.focus(); ta.select(); }
  document.addEventListener("change", (e) => {
    const s = e.target.closest && e.target.closest("[data-rv-jump]");
    if (s && s.value) { const el = document.getElementById(s.value); if (el) { el.scrollIntoView({ block: "start", behavior: "smooth" }); const hh = el.querySelector("h3"); if (hh) hh.focus({ preventScroll: true }); } s.value = ""; }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (arm) { setArm(null); return; }
    const z = document.getElementById("rv-zoom"); if (z && !z.hidden) { closeZoom(); return; }
    const sh = document.getElementById("rv-sheet"); if (sh && !sh.hidden) closeComposer();
    hidePop();
  });

  ROUTE_NAV[ROUTE] = "before-after";
  const g = function () { return draw(); }; g.__v2c = true; S[ROUTE] = g;
  if (PA.BA2 && Array.isArray(PA.BA2.groups) && !PA.BA2.groups.some((x) => x.key === "review")) PA.BA2.groups.unshift({ key: "review", short: "Review all", label: "Review all: every screen, every version", intro: "" });
  PA.rv = { count: () => screens().length, screens, jump: (key) => { pendingJump = "rv-" + safeId(key); location.hash = ROUTE; }, export: exportText };
  init();
  if (PA.v3 && PA.v3.ready) PA.v3.ready(() => setTimeout(() => { drawFab(); drawLivePins(); }, 100)); else setTimeout(drawFab, 500);
})();
