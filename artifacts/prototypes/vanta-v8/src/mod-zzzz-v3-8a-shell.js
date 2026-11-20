// V3 shell: what the rethought pages share beyond the kit. The menu's ten entries are program pages (so the program's menu never
// leaves), an old page marks the menu entry it folded into, a menu entry whose lane is not in the build opens the page it will
// replace, and the return bar (PA.v3k.task) floats over every page while a task is open. Inert while V3 is off.
(function () {
  const PA = window.PA, V3 = PA && PA.v3, K = PA && PA.v3k; if (!V3 || !K) return;
  const S = PA.S;
  const MENU = V3.menu.flatMap(([, items]) => items.map(([k]) => k));
  PA.navRegister({ program: ["system", "documents"] });
  Object.assign(PA.icons, { system: PA.icons.system || PA.icons.composition, documents: PA.icons.documents || PA.icons.ssps });

  // Old page → the menu entry it lives under now.
  const entryOf = (v) => MENU.find((k) => v === k || String(v).startsWith(k + "-")) || null;
  const HOME = { ssp: "documents", itcsc: "documents", sctm: "controls", "control-si2": "controls", campaign: "assessments" };
  for (const [from, to] of Object.entries(V3.MERGED)) { const e = entryOf(to); if (e) HOME[from] = e; }
  V3.navOf = (route, key) => (MENU.indexOf(key) >= 0 ? key : HOME[key] || entryOf(key) || key);

  // Until its lane is in the build, a new menu entry opens the page it will replace.
  const STANDIN = { system: "composition", documents: "ssps", "overview-team": "people", "overview-activity": "activity" };
  for (const [route, old] of Object.entries(STANDIN)) V3.redirect(route, () => (S[route] ? null : old));

  // The return bar floats over the foot of every page while a task is open. It sits outside #main, so a page that redraws
  // itself (the workbook) never fights it.
  const proto = document.getElementById("proto");
  let drawn = "";
  const place = () => {
    const have = document.getElementById("k3task");
    if (!V3.on() || !K.task.get()) { if (have) have.remove(); return; }
    const html = K.task.bar();
    // Compared with what was last written, never with the node's own markup: the browser writes it back differently, and a
    // bar replaced on every look made the full-window workbook (which redraws when the page changes) answer for ever.
    if (have && html === drawn) return;
    if (have) have.remove();
    drawn = html;
    (proto || document.body).insertAdjacentHTML("beforeend", html);
  };
  PA.v2.on((path) => { if (path === "*" || String(path).indexOf("v3r.task") === 0) setTimeout(place, 0); });
  window.addEventListener("v3change", place);
  window.addEventListener("hashchange", () => setTimeout(place, 0));
  V3.ready(place);
  K.words = { component: "component", Component: "Component" }; // the product's word for what v2 called an element
  // v2's own surfaces that V3 keeps as they are (the SSP editor, the workbook, a policy's page, an old preview) still print
  // "element". Inside a program, with V3 on, what they draw is read once more and the word put right: in text, and in the
  // labels a pointer or a screen reader reads. The pages about the prototype itself (Before & after) are not in a program and
  // keep the words they quote. V3 off: nothing is watched.
  const WORD = [[/\bElements\b/g, "Components"], [/\belements\b/g, "components"], [/\bElement\b/g, "Component"], [/\belement\b/g, "component"], [/\bELEMENTS?\b/g, (m) => (m.length > 7 ? "COMPONENTS" : "COMPONENT")]];
  const reword = (v) => { if (!v || !/lement|LEMENT/.test(v)) return v; let o = v; for (const [re, w] of WORD) o = o.replace(re, w); return o; };
  const ATTRS = ["title", "aria-label", "placeholder"];
  const fixTree = (root) => {
    if (!root) return;
    if (root.nodeType === 3) { const o = reword(root.nodeValue); if (o !== root.nodeValue) root.nodeValue = o; return; }
    if (root.nodeType !== 1 || root.closest("script, style, textarea, #v3cmp")) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const v = n.nodeValue; if (v && v.length > 6 && /lement|LEMENT/.test(v)) { const p = n.parentElement; if (p && p.closest("script, style, textarea")) continue; const o = reword(v); if (o !== v) n.nodeValue = o; } }
    for (const a of ATTRS) { const sel = `[${a}*="lement"]`; (root.matches && root.matches(sel) ? [root] : []).concat([...root.querySelectorAll(sel)]).forEach((e) => { const v = e.getAttribute(a), o = reword(v); if (o !== v) e.setAttribute(a, o); }); }
  };
  const wordsOn = () => V3.on() && proto && proto.classList.contains("inprog");
  let wordQ = [], wordT = 0;
  const wordRun = () => { wordT = 0; const q = wordQ; wordQ = []; if (!wordsOn()) return; for (const n of q) if (n.isConnected) fixTree(n); };
  const wordObs = new MutationObserver((recs) => { if (!wordsOn()) return; for (const r of recs) for (const n of r.addedNodes) if (n.nodeType === 1 || n.nodeType === 3) wordQ.push(n); if (wordQ.length && !wordT) wordT = setTimeout(wordRun, 30); });
  V3.ready(() => { for (const id of ["main", "panel", "modal"]) { const e = document.getElementById(id); if (e) wordObs.observe(e, { childList: true, subtree: true }); } });
  V3.navDrawn(() => setTimeout(() => { if (wordsOn()) for (const id of ["main", "panel"]) fixTree(document.getElementById(id)); }, 0));

  // ——— Navigation option 2 (Josef, 20 Nov: "move to navigation 2 instead of 3"): one sidebar with two levels. At the workspace's
  // level it lists the workspace's destinations; open a program (or an area with several pages) and it becomes that menu, with
  // ‹ Workspace on top to go back up a level without leaving the page. core.js still draws its rail (hidden by this layer's
  // CSS) and its menu; this reads the first and rearranges the second after every draw. Wide screens only: a phone keeps its
  // bottom bar and ☰. ———
  const esc = PA.h.esc;
  let UP = false, lastRoute = null, stash = "", lastProg = "WS-X90";
  const inside = () => proto.classList.contains("inprog") || proto.classList.contains("inarea");
  const railItems = () => [...document.querySelectorAll("#rail a.ri")].map((a) => ({ href: a.getAttribute("href") || "#", label: ((a.querySelector(".ri-l") || {}).textContent || "").trim(), icon: (a.querySelector("svg") || {}).outerHTML || "", badge: ((a.querySelector(".ri-b") || {}).textContent || "").trim(), on: a.classList.contains("on"), end: a.classList.contains("ri-end") }));
  const LONG = { "My work": "My work", Review: "Review queue", "AI agents": "AI agents" };
  function draw2() {
    const nav = document.getElementById("nav"); if (!nav || !V3.on()) return;
    const prog = nav.querySelector(".pn-swt b"); if (prog && prog.textContent.trim()) lastProg = prog.textContent.trim();
    const deep = inside() && !UP;
    proto.classList.toggle("v3n-deep", deep);
    if (deep) { if (!nav.querySelector(".v3n-back")) nav.insertAdjacentHTML("afterbegin", '<button type="button" class="v3n-back" data-v3n="up"><span aria-hidden="true">‹</span>Workspace</button>'); return; }
    if (inside() && !nav.querySelector(".v3n-ws")) stash = nav.innerHTML;
    const inProg = proto.classList.contains("inprog"); let ended = false;
    nav.innerHTML = '<div class="v3n-ws">Workspace</div>' + railItems().map((x) => {
      const here = x.on && !inProg, sep = x.end && !ended ? '<div class="pn-sep" aria-hidden="true"></div>' : ""; if (x.end) ended = true;
      return `${sep}<a class="item${here ? " on" : ""}" href="${esc(x.href)}"${here ? ' aria-current="page"' : ""}>${x.icon}${esc(LONG[x.label] || x.label)}${x.badge ? `<span class="c num">${esc(x.badge)}</span>` : ""}</a>`
        + (x.href === "#portfolio" ? `<button type="button" class="item v3n-sub${inProg ? " on" : ""}" data-v3n="in"${inProg ? ' aria-current="page"' : ""}><span class="v3n-sl">${esc(lastProg)}</span><span aria-hidden="true">›</span></button>` : "");
    }).join("");
    nav.setAttribute("aria-label", "Workspace");
  }
  V3.navDrawn((route) => { if (route !== lastRoute) { UP = false; lastRoute = route; stash = ""; } draw2(); });
  document.addEventListener("click", (e) => {
    if (!V3.on()) return; const b = e.target.closest && e.target.closest("[data-v3n]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (b.getAttribute("data-v3n") === "up") { UP = true; draw2(); const f = document.querySelector("#nav a.item"); if (f) f.focus(); return; }
    UP = false;
    if (proto.classList.contains("inprog") && stash) { const nav = document.getElementById("nav"); nav.innerHTML = stash; nav.setAttribute("aria-label", lastProg); draw2(); const f = nav.querySelector("a.item.on") || nav.querySelector("a.item"); if (f) f.focus(); }
    else location.hash = "overview";
  }, true);
  window.addEventListener("v3change", () => { UP = false; setTimeout(draw2, 0); });
  V3.ready(() => setTimeout(draw2, 0));
  PA.v3nav = { level: () => (inside() && !UP ? "inside" : "workspace"), up: () => { UP = true; draw2(); } };
})();
