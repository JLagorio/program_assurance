// Prototype v2 core: shared state, navigation that carries a question, and the helpers every v2 module uses.
// Loads after the canon layer and before the other v2 modules (name order). API, window.PA.v2:
//   state                  the data the workflow changes, kept for the tab's session (sessionStorage when the browser allows it)
//   get(path, d)           read a dotted path ("controls.SA-24.status"); d when it is missing
//   set(path, v)           write a dotted path, save it, and call every listener with (path, v)
//   seed(path, v)          set only when the path is empty: a module's first data, kept across redraws and reloads
//   on(fn)                 fn(path, value) after every set; returns a function that stops listening
//   reset()                forget the session's changes and draw the screen again
//   go(route, q)           open a screen with a question, q = { filter, open: { kind, id }, focus: "<selector>", rows: ["text", …], note }
//                          filter: { qv: "<quick view or tab label>" }; rows keeps only the table rows holding one of the texts
//   take(route)            the question waiting for that screen, once (a screen that reads it itself draws the answer;
//                          one nobody takes is answered after the draw: quick view clicked, rows kept, preview opened, focus moved)
//   peek(route)            the same without taking it
//   redraw()               draw the current screen again where it was scrolled, and the open preview
//   lastPanel()            { kind, id } of the preview opened last
//   toast(text, link)      one status message; link = { label, route } or { label, go: [route, q] }
//   screen(route, fn, nav) register a screen a v2 module draws (canon link rewrite, the visual layer, the navigation key)
//   cur()                  the current route
(function () {
  const PA = window.PA, { S, P, ROUTE_NAV } = PA;
  const esc = PA.h.esc;
  const KEY = "pa-v2-state";
  let state = {};
  try { state = JSON.parse(sessionStorage.getItem(KEY) || "{}") || {}; } catch (e) { state = {}; }
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage off: this visit only */ } };
  const parts = (path) => String(path).split(".");
  function get(path, d) { let o = state; for (const k of parts(path)) { if (o == null || typeof o !== "object" || !(k in o)) return d; o = o[k]; } return o; }
  const subs = new Set();
  function set(path, v) {
    const ks = parts(path); let o = state;
    for (const k of ks.slice(0, -1)) { if (o[k] == null || typeof o[k] !== "object") o[k] = {}; o = o[k]; }
    o[ks[ks.length - 1]] = v; save();
    for (const fn of [...subs]) { try { fn(path, v); } catch (e) { console.error(e); } }
    return v;
  }
  const seed = (path, v) => (get(path) === undefined ? set(path, v) : get(path));
  const on = (fn) => { subs.add(fn); return () => subs.delete(fn); };
  const cur = () => (location.hash || "#home").slice(1);

  // Questions waiting for a screen.
  const waiting = {};
  const take = (route) => { const q = waiting[route] || null; delete waiting[route]; return q; };
  const peek = (route) => waiting[route] || null;
  function answer(route) {
    const q = take(route); if (!q) return;
    const main = document.getElementById("main"); if (!main) return;
    const steps = [];
    if (q.filter && q.filter.qv) steps.push(() => {
      const want = q.filter.qv.toLowerCase();
      const el = [...main.querySelectorAll('.qv, [role="tab"], .chip, .tab, .sectab')].find((x) => x.textContent.trim().toLowerCase().startsWith(want));
      if (el && !el.classList.contains("on") && el.getAttribute("aria-selected") !== "true") el.click();
    });
    if (q.rows && q.rows.length) steps.push(() => keepRows(main, q.rows, q.note));
    if (q.open) steps.push(() => {
      const el = main.querySelector(`[data-panel="${CSS.escape(q.open.kind)}"][data-id="${CSS.escape(String(q.open.id))}"]`);
      if (el) { el.scrollIntoView({ block: "center" }); el.click(); }
    });
    if (q.focus) steps.push(() => { const el = main.querySelector(q.focus); if (el) { el.scrollIntoView({ block: "center" }); if (!el.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); } });
    let i = 0; const next = () => { if (i < steps.length) { steps[i++](); setTimeout(next, 30); } }; next();
  }
  function keepRows(main, texts, note) {
    const rows = [...main.querySelectorAll("tbody tr")];
    if (!rows.length) return;
    const want = texts.map((t) => String(t).toLowerCase());
    let kept = 0;
    for (const tr of rows) { const hit = want.some((t) => tr.textContent.toLowerCase().includes(t)); tr.hidden = !hit; if (hit) kept++; }
    const frame = rows[0].closest(".frame, table");
    if (frame && !main.querySelector(".v2-kept")) frame.insertAdjacentHTML("beforebegin", `<div class="v2-kept" role="status"><span>${esc(note || "Showing the records you opened")} <span class="num">${kept}</span></span><button type="button" class="v2-kept-all">Show all</button></div>`);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".v2-kept-all"); if (!b) return;
    const main = document.getElementById("main");
    main.querySelectorAll("tbody tr[hidden]").forEach((tr) => { tr.hidden = false; });
    const k = main.querySelector(".v2-kept"); if (k) k.remove();
  });
  function go(route, q) {
    if (q) waiting[route] = q;
    if (cur() === route) { redraw(); setTimeout(() => answer(route), 0); } else location.hash = route;
  }
  // This listener is added before the core router's (modules load before PA.start), so the answer runs after the router draws.
  window.addEventListener("hashchange", () => { const r = cur(); setTimeout(() => answer(r), 0); });

  // The preview opened last, for redraws and the full-record button.
  let last = null;
  const note = (t) => { if (t && t.dataset && t.dataset.panel) last = { kind: t.dataset.panel, id: t.dataset.id }; };
  document.addEventListener("click", (e) => { if (e.target.closest) note(e.target.closest("[data-panel]")); }, true);
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.closest) note(e.target.closest("[data-panel]")); }, true);

  function redraw() {
    const r = cur(), main = document.getElementById("main");
    if (!main || !S[r]) return;
    const tabs = main.querySelector(".sectabs"), tabsHtml = tabs ? tabs.outerHTML : "";
    const top = main.scrollTop;
    main.innerHTML = S[r]();
    if (tabsHtml) (main.querySelector(".main") || main).insertAdjacentHTML("afterbegin", tabsHtml);
    main.scrollTop = top;
    const panel = document.getElementById("panel");
    if (panel && !panel.hidden && last && P[last.kind]) { const o = P[last.kind](last.id), pb = panel.querySelector(".pbody"); if (o && pb) pb.innerHTML = o.body; }
  }

  let timer = null;
  function toast(text, link) {
    let el = document.getElementById("v2-toast");
    if (!el) { el = document.createElement("div"); el.id = "v2-toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.innerHTML = `<span>${esc(text)}</span>${link ? `<button type="button" class="v2-toast-link">${esc(link.label)}</button>` : ""}`;
    el.hidden = false;
    const b = el.querySelector(".v2-toast-link");
    if (b) b.addEventListener("click", () => { el.hidden = true; if (link.go) go(link.go[0], link.go[1]); else if (link.route) location.hash = link.route; });
    clearTimeout(timer); timer = setTimeout(() => { el.hidden = true; }, 6000);
  }

  function screen(route, fn, nav) {
    const late = !!PA.v2clean; // registered after the visual layer wrapped every screen: clean it here
    S[route] = () => { let html = fn(); if (PA.canon) html = PA.canon.rewrite(html); if (late && PA.v2clean) html = PA.v2clean(html, route); return html; };
    if (nav) ROUTE_NAV[route] = nav;
    return S[route];
  }

  function reset() { state = {}; save(); for (const fn of [...subs]) { try { fn("*", null); } catch (e) { console.error(e); } } redraw(); toast("The prototype's data is back to where it started."); }

  PA.v2 = { get state() { return state; }, get, set, seed, on, reset, go, take, peek, redraw, lastPanel: () => last, toast, screen, cur };
})();
