// About › Walkthrough findings (route walkthrough): the 19 November walkthrough of v2 (version 15), finding by finding, each with
// links to the screen it is about, and the reader's answer: Confirm or Not a problem, and a note. Reads window.PA.REVIEW
// (mod-zzzz-v2-9review-data.js). Answers are kept in the artifact's database, in the viewer's own private folder,
// data/users/<viewer id>/<item id> ({ verdict: "yes" | "no" | null, note, at }), when the published page can use db and user;
// otherwise, or once a save is refused, in this browser. Claude Code can't read this artifact's data (it belongs to another
// organization, which keeps its artifact data from Claude Code), so the reader sends their answers with Copy my answers.
(function () {
  const PA = window.PA;
  if (!PA || !PA.REVIEW) return;
  const { S, h } = PA;
  const { esc, fmt, header, pill } = h;
  const D = PA.REVIEW;
  const ROUTE = "walkthrough";
  const WSX = "PRG-1090";
  const LANE = Object.fromEntries(D.lanes.map((l) => [l.key, l]));
  const THEME = Object.fromEntries(D.themes.map((t) => [t.key, t]));
  const BYID = Object.fromEntries(D.findings.map((f) => [f.id, f]));
  const DROPPED = new Set(D.dropped);
  const STANDING = D.findings.filter((f) => !DROPPED.has(f.id));
  const SEV = { blocker: ["bad", "Blocker"], major: ["warn", "Major"], minor: ["none", "Minor"] };
  const SEV_ORDER = { blocker: 0, major: 1, minor: 2 };
  const KIND = { flow: "Flow", duplication: "Duplication", inconsistency: "Inconsistency", "dead-end": "Dead end", missing: "Missing", wording: "Wording" };
  const WORDS = {
    finding: ["Confirm", "Not a problem", "What's off about it, or what you'd do instead"],
    proposal: ["Agree", "Disagree", "What you'd change"],
    dropped: ["Agree to drop it", "Keep it", "Why it should stay"],
  };
  const TABS = [["findings", "Findings"], ["dup", "Duplicated data"], ["menu", "Menu order"], ["fix", "What to fix first"], ["dropped", "Dropped"]];
  const MENU_ITEMS = () => [{ id: "menu-order" }, ...D.menu.merges, ...D.menu.moves, D.menu.tweak];
  const PROPOSALS = () => [...D.dup, ...MENU_ITEMS(), ...D.fixes, ...D.dropped.map((id) => ({ id: "drop-" + id }))];

  // ——— What the reader is looking at (kept for the visit, and the tab across reloads in this tab) ———
  const blank = () => ({ lane: "all", theme: "all", sev: [], ans: "all", checked: false, q: "" });
  let F = blank();
  let tab = "findings";
  try { const t = sessionStorage.getItem("wr-tab"); if (TABS.some(([k]) => k === t)) tab = t; } catch (e) { /* storage off: the first tab */ }
  let returnTo = null; // the card whose Show me link the reader followed, scrolled back to when they come back

  // ——— Answers ———
  const answers = new Map(); // id -> { verdict, note, at }
  const dirty = new Set(); // changed here and not yet confirmed
  const inflight = new Set(), again = new Set(); // being written; changed again while being written
  const status = new Map(); // id -> "saving" | "saved" | "failed" | "local"
  const noteTimers = new Map(); // a note being typed, written once the typing pauses
  let store = "loading"; // loading | slow | db | local
  const retried = new Set(); // a save that failed for a passing reason and was sent once more
  let storeWhy = "";
  let db = null, uid = null, col = null, loadTimer = null;
  const LOCAL_KEY = "wr-answers-v1";
  const ans = (id) => answers.get(id) || { verdict: null, note: "" };
  const answered = (id) => { const a = ans(id); return !!(a.verdict || (a.note && a.note.trim())); };

  function readLocal() {
    try { const o = JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}"); Object.entries(o).forEach(([k, v]) => { if (v && typeof v === "object") answers.set(k, { verdict: v.verdict || null, note: v.note || "", at: v.at || "" }); }); } catch (e) { /* nothing kept, or storage off */ }
  }
  function writeLocal() {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(Object.fromEntries(answers))); return true; } catch (e) { return false; }
  }
  function setStore(s, why) { store = s; storeWhy = why || ""; drawBar(); }
  // Fall back to this browser: what was answered here stays, and what this browser kept before fills in the rest.
  function toLocal(why) {
    clearTimeout(loadTimer);
    const here = new Map(answers);
    readLocal();
    here.forEach((v, k) => answers.set(k, v));
    dirty.clear(); again.clear();
    const kept = writeLocal();
    [...status.keys()].forEach((k) => status.set(k, kept ? "local" : "failed"));
    setStore("local", why);
    answers.forEach((v, k) => sync(k));
  }

  async function connect() {
    const c = window.claude;
    if (!c || typeof c.use !== "function") { readLocal(); setStore("local"); return; }
    loadTimer = setTimeout(() => { if (store === "loading") setStore("slow"); }, 10000);
    try {
      const [d, u] = await Promise.all([c.use("db"), c.use("user")]);
      const id = d && u ? await u.id() : null;
      if (!d || !id) { toLocal(""); return; }
      db = d; uid = id;
      try { if ((await u.can("data.write")) === false) { toLocal("this page can't save them for you"); return; } } catch (e) { /* not told: try, and fall back if a save is refused */ }
      col = db.collection("data/users/" + uid);
      col.onSnapshot((snap) => {
        if (store === "local") return;
        snap.docs.forEach((doc) => {
          if (dirty.has(doc.id) || inflight.has(doc.id)) return;
          const v = doc.data() || {};
          const cur = ans(doc.id);
          const ta = document.getElementById("wr-t-" + doc.id);
          const keepNote = ta && document.activeElement === ta;
          answers.set(doc.id, { verdict: v.verdict === "yes" || v.verdict === "no" ? v.verdict : null, note: keepNote ? cur.note : typeof v.note === "string" ? v.note : "", at: v.at || "" });
          sync(doc.id);
        });
        if (!snap.metadata.fromCache) clearTimeout(loadTimer);
        const wasReady = store === "db";
        setStore(snap.metadata.fromCache && store === "loading" ? "loading" : "db");
        if (store === "db" && !wasReady) flushDirty();
      }, () => { if (store !== "local") toLocal("your saved answers couldn't be loaded"); });
    } catch (e) {
      toLocal("");
    }
  }

  // One write at a time a document; a change made while one is in flight is written after it, from the latest state.
  function save(id) {
    if (store === "local") { dirty.delete(id); status.set(id, writeLocal() ? "local" : "failed"); sync(id); drawBar(); return; }
    if (!db || !col || store === "loading" || store === "slow") { dirty.add(id); status.set(id, "waiting"); sync(id); return; }
    if (inflight.has(id)) { again.add(id); return; }
    const a = ans(id);
    const body = { verdict: a.verdict || null, note: a.note || "", at: new Date().toISOString() };
    inflight.add(id); status.set(id, "saving"); sync(id);
    col.doc(id).set(body).then(() => {
      inflight.delete(id); retried.delete(id);
      if (!again.has(id)) dirty.delete(id);
      status.set(id, "saved");
      if (again.delete(id)) save(id); else { sync(id); drawBar(); }
    }, (e) => {
      inflight.delete(id); again.delete(id);
      const passing = e && (e.code === "unavailable" || e.code === "resource_exhausted");
      // A passing failure is sent once more after a short pause; anything else means this page can't save here.
      if (passing && !retried.has(id)) { retried.add(id); setTimeout(() => save(id), 700 + Math.floor(Math.random() * 800)); return; }
      retried.delete(id);
      if (passing) { status.set(id, "failed"); sync(id); drawBar(); return; }
      toLocal("the page couldn't save them");
    });
  }
  function flushDirty() { [...dirty].filter((id) => !inflight.has(id) && !noteTimers.has(id)).forEach((id) => save(id)); }

  function setVerdict(id, v) {
    const a = ans(id);
    answers.set(id, { ...a, verdict: a.verdict === v ? null : v });
    dirty.add(id); sync(id); drawBar(); save(id);
  }
  function setNote(id, text, now) {
    const a = ans(id);
    if (a.note === text && !now) return;
    answers.set(id, { ...a, note: text });
    dirty.add(id);
    clearTimeout(noteTimers.get(id));
    if (now) { noteTimers.delete(id); save(id); drawBar(); }
    else noteTimers.set(id, setTimeout(() => { noteTimers.delete(id); save(id); drawBar(); }, 900));
  }

  // ——— Drawing ———
  const made = () => { try { return (PA.v2hubs && PA.v2hubs.made && PA.v2hubs.made()) || []; } catch (e) { return []; } };
  const curProg = () => { try { return PA.v2hubs && PA.v2hubs.cur ? PA.v2hubs.cur() : WSX; } catch (e) { return WSX; } };
  // The program a finding's links open: a created program for the first walkthrough (the current one if it is created, else the newest),
  // WS-X90 for the others.
  function progFor(f) {
    if (f.lane !== "A") return WSX;
    const list = made(); if (!list.length) return null;
    const c = curProg();
    return list.some((d) => d.code === c) ? c : list[0].code;
  }
  function linkHtml(l, f) {
    const prog = progFor(f);
    const pa = prog ? ` data-v2prog="${esc(prog)}"` : "";
    if (l.t === "route") return `<a class="wr-go" href="#${esc(l.r)}"${pa} data-wr-from="${esc(f.id)}">${esc(l.label)}</a>`;
    if (l.t === "panel") return `<button type="button" class="wr-go wr-pv" data-panel="${esc(l.k)}" data-id="${esc(l.id)}"${pa}>${esc(l.label)}</button>`;
    if (l.t === "dialog") return `<span class="wr-dlg">Dialog: ${esc(l.label)}</span>`;
    return `<span class="wr-dlg">${esc(l.label)}</span>`;
  }

  function answerHtml(id, type, label) {
    const [yes, no, ph] = WORDS[type];
    const a = ans(id);
    const open = !!(a.note && a.note.trim());
    return `<div class="wr-ans" data-wr-item="${esc(id)}" data-wr-type="${type}">
      <div class="wr-ans-row">
        <div class="wr-seg wr-vs" role="group" aria-label="Your answer on ${esc(label)}">
          <button type="button" data-wr-v="yes" aria-pressed="${a.verdict === "yes"}">${esc(yes)}</button>
          <button type="button" data-wr-v="no" aria-pressed="${a.verdict === "no"}">${esc(no)}</button>
        </div>
        <button type="button" class="wr-link" data-wr-noteopen aria-expanded="${open}" aria-controls="wr-n-${esc(id)}">${open ? "Note" : "Add a note"}</button>
        <span class="wr-st" aria-live="polite">${statusText(id)}</span>
      </div>
      <div class="wr-note" id="wr-n-${esc(id)}"${open ? "" : " hidden"}>
        <label class="wr-sr" for="wr-t-${esc(id)}">Note on ${esc(label)}</label>
        <textarea id="wr-t-${esc(id)}" data-wr-note rows="3" placeholder="${esc(ph)}">${esc(a.note || "")}</textarea>
      </div>
    </div>`;
  }
  function statusText(id) {
    const s = status.get(id);
    if (s === "saving") return "Saving…";
    if (s === "saved") return "Saved";
    if (s === "local") return "Kept in this browser";
    if (s === "waiting") return "Saves once your answers load";
    if (s === "failed") return "Not saved yet: change it again to retry";
    return "";
  }
  // Bring one answer block in line with its state without drawing it again (a note being typed keeps its focus and caret).
  function sync(id) {
    document.querySelectorAll(`.wr-ans[data-wr-item="${CSS.escape(id)}"]`).forEach((el) => {
      const a = ans(id);
      el.querySelectorAll("[data-wr-v]").forEach((b) => b.setAttribute("aria-pressed", String(a.verdict === b.dataset.wrV)));
      const ta = el.querySelector("[data-wr-note]");
      if (ta && document.activeElement !== ta && ta.value !== (a.note || "")) ta.value = a.note || "";
      const hasNote = !!(a.note && a.note.trim());
      const wrap = el.querySelector(".wr-note"), btn = el.querySelector("[data-wr-noteopen]");
      if (hasNote && wrap.hidden) { wrap.hidden = false; btn.setAttribute("aria-expanded", "true"); btn.textContent = "Note"; }
      const st = el.querySelector(".wr-st"); if (st) st.textContent = statusText(id);
      const card = el.closest(".wr-card"); if (card) card.classList.toggle("wr-done", answered(id));
    });
  }

  function counts() {
    const fa = STANDING.filter((f) => answered(f.id));
    const pa = PROPOSALS().filter((p) => answered(p.id));
    return {
      f: fa.length, fYes: STANDING.filter((f) => ans(f.id).verdict === "yes").length, fNo: STANDING.filter((f) => ans(f.id).verdict === "no").length,
      notes: [...answers.entries()].filter(([, a]) => a.note && a.note.trim()).length, p: pa.length, pAll: PROPOSALS().length,
    };
  }
  const STORE_TEXT = {
    loading: "Loading your answers…",
    slow: "Your saved answers can't be reached yet. What you choose now is saved once they can.",
    db: "Your answers are saved with this page, so they're here the next time you open it.",
    local: "Your answers are kept in this browser.",
  };
  function barHtml() {
    const c = counts();
    return `<div class="wr-prog">
        <div class="wr-prog-n"><b class="num">${fmt(c.f)}</b> of <span class="num">${fmt(STANDING.length)}</span> findings answered
          <span class="wr-dim">· ${fmt(c.fYes)} confirmed · ${fmt(c.fNo)} not a problem · ${fmt(c.notes)} with a note · ${fmt(c.p)} of ${fmt(c.pAll)} proposals answered</span></div>
        <div class="bar wr-meter"><i style="width:${Math.round((100 * c.f) / STANDING.length)}%"></i></div>
      </div>
      <p class="wr-store">${esc(store === "local" && storeWhy ? `Your answers are kept in this browser: ${storeWhy}.` : STORE_TEXT[store] || "")}</p>
      <div class="wr-copy"><button type="button" class="btn sm ink" data-wr-copy>Copy my answers</button><span class="wr-hint">When you're done, paste them into our chat: that's how they reach me.</span><span class="wr-st" aria-live="polite" id="wr-copy-st"></span></div>
      <textarea class="wr-copytext" id="wr-copytext" readonly hidden aria-label="Your answers as text"></textarea>`;
  }
  function drawBar() { const el = document.getElementById("wr-bar"); if (el) { const had = document.activeElement && el.contains(document.activeElement) ? document.activeElement.dataset.wrCopy : null; el.innerHTML = barHtml(); if (had != null) { const b = el.querySelector("[data-wr-copy]"); if (b) b.focus(); } } }

  // ——— Findings ———
  const sevCount = (list, s) => list.filter((f) => f.sev === s).length;
  function match(f) {
    if (F.lane !== "all" && f.lane !== F.lane) return false;
    if (F.theme !== "all" && f.theme !== F.theme) return false;
    if (F.sev.length && !F.sev.includes(f.sev)) return false;
    if (F.checked && !f.lead) return false;
    const a = ans(f.id);
    if (F.ans === "open" && answered(f.id)) return false;
    if (F.ans === "yes" && a.verdict !== "yes") return false;
    if (F.ans === "no" && a.verdict !== "no") return false;
    if (F.ans === "note" && !(a.note && a.note.trim())) return false;
    if (F.q) {
      const q = F.q.toLowerCase();
      const hay = [f.id, f.what, f.why, f.fix, f.evidence, f.where, ...f.links.map((l) => l.label)].join(" ").toLowerCase();
      if (!q.split(/\s+/).filter(Boolean).every((w) => hay.includes(w))) return false;
    }
    return true;
  }
  const filtered = () => STANDING.filter(match);
  const sortF = (a, b) => SEV_ORDER[a.sev] - SEV_ORDER[b.sev] || a.id.localeCompare(b.id);

  // V3 (mod-zzzz-v3-9ba.js): what V3 does about the finding, and a way to see it there. Show me keeps showing v2.
  function v3Html(f) {
    const l = PA.v3ba && PA.v3ba.ledger(f.id); if (!l) return "";
    const word = l.status === "fixed" ? "Fixed in V3" : l.status === "partly" ? "Partly fixed in V3" : "Not fixed in V3";
    return `<div class="wr-v3"><span class="wr-v3-st wr-v3-${esc(l.status || "not")}">${word}</span><span class="wr-v3-t">${esc(l.text || "")}${l.why ? ` ${esc(l.why)}` : ""}</span>${l.see ? `<button type="button" class="wr-go wr-v3-go" data-v3-see="${esc(JSON.stringify(l.see))}">See it in V3</button>` : ""}</div>`;
  }
  document.addEventListener("click", (e) => {
    const t = e.target && e.target.closest ? e.target.closest(".wr .wr-go:not([data-v3-see])") : null;
    if (t && PA.v3 && PA.v3.on()) PA.v3.set(false, { redraw: false });
  }, true);
  function cardHtml(f) {
    const [tone, sevLabel] = SEV[f.sev];
    const lead = f.lead;
    const same = (f.same || []).filter((x) => BYID[x]);
    return `<article class="wr-card${answered(f.id) ? " wr-done" : ""}" id="wr-${esc(f.id)}" aria-labelledby="wr-h-${esc(f.id)}">
      <div class="wr-card-h">
        <h4 class="wr-id" id="wr-h-${esc(f.id)}" tabindex="-1">${esc(f.id)}</h4>${pill(tone, sevLabel)}<span class="tag">${esc(KIND[f.kind] || f.kind)}</span><span class="tag">${esc(THEME[f.theme].label)}</span>
        ${lead ? `<span class="wr-rc ${lead.verdict === "held" ? "ok" : "no"}">${lead.verdict === "held" ? "Re-checked: held" : "Re-checked: didn't hold"}</span>` : ""}
      </div>
      <p class="wr-what">${esc(f.what)}</p>
      <dl class="wr-dl"><dt>Why it matters</dt><dd>${esc(f.why)}</dd><dt>Suggested fix</dt><dd>${esc(f.fix)}</dd></dl>
      ${f.links.length ? `<div class="wr-show"><span class="wr-k">Show me</span>${f.links.map((l) => linkHtml(l, f)).join("")}</div>` : ""}
      ${lead ? `<p class="wr-lead"><b>What I saw when I re-ran it:</b> ${esc(lead.note)}</p>` : ""}
      ${v3Html(f)}
      ${same.length ? `<p class="wr-same">Also found as ${same.map((x) => `<button type="button" class="wr-link" data-wr-jump="${esc(x)}">${esc(x)}</button>`).join(", ")}</p>` : ""}
      <details class="wr-ev"><summary>How the reviewer found it</summary><p>${esc(f.evidence)}</p><p class="wr-dim">Recorded at: ${esc(f.where)}</p></details>
      ${answerHtml(f.id, "finding", f.id)}
    </article>`;
  }
  function laneNote(key) {
    if (key !== "A") return "";
    const list = made();
    if (!list.length) return `<div class="wr-callout"><p><b>These need a program you created.</b> None is created in this browser yet, so their links open WS-X90. Create one the way the reviewer did: on Create program, press Continue on each step and then Create program. The defaults reproduce what the reviewer saw.</p><a class="btn sm" href="#program-new">Create program</a></div>`;
    const p = list.find((d) => d.code === curProg()) || list[0];
    return `<div class="wr-callout"><p>Their links open <b>${esc(p.name || p.code)}</b> (${esc(p.code)}), ${list.length > 1 ? "the program you created that's current" : "the program you created"}.</p></div>`;
  }
  function listHtml() {
    const rows = filtered();
    const head = `<p class="wr-count" aria-live="polite">Showing <b class="num">${fmt(rows.length)}</b> of <span class="num">${fmt(STANDING.length)}</span> findings${JSON.stringify(F) !== JSON.stringify(blank()) ? ` · <button type="button" class="wr-link" data-wr-clear>Clear filters</button>` : ""}</p>`;
    if (!rows.length) return head + `<div class="wr-empty"><p><b>No finding matches.</b> Change or clear the filters to see the others.</p></div>`;
    const lanes = F.lane === "all" ? D.lanes : D.lanes.filter((l) => l.key === F.lane);
    return head + lanes.map((l) => {
      const list = rows.filter((f) => f.lane === l.key).sort(sortF);
      if (!list.length) return "";
      return `<section class="wr-lane" aria-labelledby="wr-lane-${l.key}"><h3 id="wr-lane-${l.key}">${esc(l.label)} <span class="num">${fmt(list.length)}</span></h3>
        <p class="wr-intro">${esc(l.intro)}</p>${laneNote(l.key)}${list.map(cardHtml).join("")}</section>`;
    }).join("");
  }
  function filtersHtml() {
    const segBtn = (k, v, label, n, pressed) => `<button type="button" data-wr-f="${k}" data-wr-val="${esc(v)}" aria-pressed="${pressed}">${esc(label)} <span class="num">${fmt(n)}</span></button>`;
    const laneN = (k) => STANDING.filter((f) => f.lane === k).length;
    const opt = (v, label, cur) => `<option value="${esc(v)}"${cur === v ? " selected" : ""}>${esc(label)}</option>`;
    return `<div class="wr-filters" role="search" aria-label="Filter findings">
      <div class="wr-seg" role="group" aria-label="Walkthrough">${segBtn("lane", "all", "All", STANDING.length, F.lane === "all")}${D.lanes.map((l) => segBtn("lane", l.key, l.short, laneN(l.key), F.lane === l.key)).join("")}</div>
      <div class="wr-seg" role="group" aria-label="Severity">${["blocker", "major", "minor"].map((s) => segBtn("sev", s, SEV[s][1], sevCount(STANDING, s), F.sev.includes(s))).join("")}</div>
      <label class="wr-sel"><span>Theme</span><select data-wr-f="theme">${opt("all", "All themes", F.theme)}${D.themes.map((t) => opt(t.key, `${t.label} (${t.ids.filter((i) => !DROPPED.has(i)).length})`, F.theme)).join("")}</select></label>
      <label class="wr-sel"><span>Your answer</span><select data-wr-f="ans">${opt("all", "Any", F.ans)}${opt("open", "Not answered", F.ans)}${opt("yes", "Confirmed", F.ans)}${opt("no", "Not a problem", F.ans)}${opt("note", "With a note", F.ans)}</select></label>
      <label class="wr-chk"><input type="checkbox" data-wr-f="checked"${F.checked ? " checked" : ""}> Re-checked by me</label>
      <input type="search" class="wr-q" data-wr-f="q" placeholder="Find findings" aria-label="Find findings" value="${esc(F.q)}">
    </div>`;
  }

  // ——— Proposals ———
  const idLinks = (ids) => (ids || []).filter((x) => BYID[x]).map((x) => `<button type="button" class="wr-link" data-wr-jump="${esc(x)}">${esc(x)}</button>`).join(", ");
  const PAGE_LABEL = { "review-queue": "Review queue", "ai-drafts": "AI agents", "common-controls": "Settings › Host systems & providers", integrations: "Library › Integrations" };
  const navLabel = (r) => { const m = new Map(PA.navItems ? PA.navItems() : []); return PAGE_LABEL[r] || m.get(r) || r; };
  const pageLink = (r) => `<a class="wr-go" href="#${esc(r)}" data-v2prog="${WSX}">${esc(navLabel(r))}</a>`;
  function dupHtml() {
    return `<p class="wr-intro">Every job below is shown on two or more pages, and the copies disagree. Each row says where, what disagrees, and which page should own it; the others would read from it.</p>
      ${D.dup.map((r) => `<article class="wr-card${answered(r.id) ? " wr-done" : ""}" id="wr-${esc(r.id)}">
        <div class="wr-card-h"><h4 class="wr-id" tabindex="-1">${esc(r.job)}</h4><span class="tag">${fmt(r.pages.length)} pages</span></div>
        <div class="wr-show"><span class="wr-k">Pages</span>${r.pages.map(pageLink).join("")}</div>
        <dl class="wr-dl"><dt>What disagrees</dt><dd>${esc(r.what)}</dd><dt>Should belong to</dt><dd>${esc(r.owner)}</dd>${r.ids.length ? `<dt>Findings</dt><dd>${idLinks(r.ids)}</dd>` : ""}</dl>
        ${answerHtml(r.id, "proposal", r.job)}
      </article>`).join("")}`;
  }
  function menuHtml() {
    const M = D.menu;
    const column = (groups, title) => `<div class="wr-menu-col"><h4>${esc(title)}</h4>${groups.map((g) => `<div class="wr-menu-g">${g.group ? `<div class="wr-menu-gh">${esc(g.group)}${g.closed ? ' <span class="wr-dim">(folded)</span>' : ""}</div>` : ""}<ul>${g.pages.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>`).join("")}</div>`;
    const item = (m) => `<article class="wr-card${answered(m.id) ? " wr-done" : ""}" id="wr-${esc(m.id)}">
        <div class="wr-card-h"><h4 class="wr-id" tabindex="-1">${esc(m.from)} → ${esc(m.to)}</h4></div>
        <p class="wr-what">${esc(m.why)}</p>${m.ids && m.ids.length ? `<p class="wr-same">Findings: ${idLinks(m.ids)}</p>` : ""}
        ${answerHtml(m.id, "proposal", `${m.from} into ${m.to}`)}
      </article>`;
    return `<p class="wr-intro">The program menu groups pages by kind of record today. The duplicated-data reviewer proposes ordering it by RMF step, with each page under the step it serves. ${esc(M.result)}</p>
      <div class="wr-menu">${column(M.today, "Today")}${column(M.proposed, "Proposed")}</div>
      <details class="wr-ev"><summary>Why today's order misreads</summary><ul class="wr-why">${M.why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></details>
      <article class="wr-card${answered("menu-order") ? " wr-done" : ""}" id="wr-menu-order"><div class="wr-card-h"><h4 class="wr-id" tabindex="-1">Order the menu by RMF step</h4></div>
        <p class="wr-what">Overview and Lifecycle first, then Prepare, Categorize & select, Implement, Assess, Authorize and Monitor, as in the Proposed column.</p>
        ${answerHtml("menu-order", "proposal", "ordering the menu by RMF step")}</article>
      <article class="wr-card${answered(M.tweak.id) ? " wr-done" : ""}" id="wr-${esc(M.tweak.id)}"><div class="wr-card-h"><h4 class="wr-id" tabindex="-1">Evidence under Implement</h4></div>
        <p class="wr-what">${esc(M.tweak.text)}</p>${answerHtml(M.tweak.id, "proposal", "Evidence under Implement")}</article>
      <h3 class="wr-sub">Pages folded into the pages that own their jobs</h3>${M.merges.map(item).join("")}
      <h3 class="wr-sub">Moved out of the program menu</h3>${M.moves.map(item).join("")}`;
  }
  function fixHtml() {
    return `<p class="wr-intro">The order I'd fix them in if you want a next round. Each clears the findings listed under it.</p>
      <ol class="wr-fixes">${D.fixes.map((x, i) => `<li><article class="wr-card${answered(x.id) ? " wr-done" : ""}" id="wr-${esc(x.id)}">
        <div class="wr-card-h"><span class="wr-n num">${i + 1}</span><h4 class="wr-id" tabindex="-1">${esc(x.title)}</h4></div>
        <p class="wr-what">${esc(x.text)}</p><p class="wr-same">Clears ${idLinks(x.ids)}</p>
        ${answerHtml(x.id, "proposal", x.title)}</article></li>`).join("")}</ol>`;
  }
  function droppedHtml() {
    return `<p class="wr-intro">A finding I re-ran that didn't hold, so it's left out of the counts above.</p>
      ${D.dropped.map((id) => { const f = BYID[id]; return `<article class="wr-card${answered("drop-" + id) ? " wr-done" : ""}" id="wr-${esc(f.id)}">
        <div class="wr-card-h"><h4 class="wr-id" tabindex="-1">${esc(f.id)}</h4>${pill(SEV[f.sev][0], SEV[f.sev][1])}<span class="tag">${esc(LANE[f.lane].short)}</span><span class="wr-rc no">Re-checked: didn't hold</span></div>
        <p class="wr-what"><span class="wr-dim">The reviewer reported:</span> ${esc(f.what)}</p>
        <p class="wr-lead"><b>What I saw when I re-ran it:</b> ${esc(f.lead.note)}</p>
        <div class="wr-show"><span class="wr-k">Show me</span>${f.links.map((l) => linkHtml(l, f)).join("")}</div>
        <details class="wr-ev"><summary>How the reviewer found it</summary><p>${esc(f.evidence)}</p></details>
        ${answerHtml("drop-" + id, "dropped", "dropping " + id)}</article>`; }).join("")}`;
  }

  function bodyHtml() {
    if (tab === "dup") return dupHtml();
    if (tab === "menu") return menuHtml();
    if (tab === "fix") return fixHtml();
    if (tab === "dropped") return droppedHtml();
    return filtersHtml() + `<div id="wr-list">${listHtml()}</div>`;
  }
  const tabCount = (k) => (k === "findings" ? STANDING.length : k === "dup" ? D.dup.length : k === "menu" ? MENU_ITEMS().length : k === "fix" ? D.fixes.length : D.dropped.length);
  function tabsHtml() {
    return `<div class="wr-tabs" role="tablist" aria-label="Walkthrough findings">${TABS.map(([k, l]) => `<button type="button" role="tab" id="wr-tab-${k}" aria-controls="wr-body" aria-selected="${tab === k}" tabindex="${tab === k ? 0 : -1}" data-wr-tab="${k}">${esc(l)} <span class="num">${fmt(tabCount(k))}</span></button>`).join("")}</div>`;
  }
  function themesHtml() {
    const big = D.themes.filter((t) => t.big), rest = D.themes.filter((t) => !t.big);
    const n = (t) => t.ids.filter((i) => !DROPPED.has(i)).length;
    return `<div class="wr-themes">${big.map((t, i) => `<button type="button" class="wr-theme" data-wr-theme="${esc(t.key)}"><span class="wr-theme-n num">${i + 1}</span><span class="wr-theme-t">${esc(t.label)}</span><span class="wr-theme-d">${esc(t.text)}</span><span class="wr-theme-c">${fmt(n(t))} findings →</span></button>`).join("")}</div>
      <p class="wr-also">Also: ${rest.map((t) => `<button type="button" class="wr-link" data-wr-theme="${esc(t.key)}">${esc(t.label)} (${fmt(n(t))})</button>`).join(" · ")}</p>`;
  }

  S[ROUTE] = () => {
    const blockers = sevCount(STANDING, "blocker"), major = sevCount(STANDING, "major"), minor = sevCount(STANDING, "minor");
    const facts = `<span><b class="num">${fmt(STANDING.length)}</b> findings</span><span class="num">${fmt(blockers)} blockers · ${fmt(major)} major · ${fmt(minor)} minor</span><span>1 dropped</span><span>Walked ${esc(D.summary.date)} on ${esc(D.summary.version)}</span>`;
    if (returnTo) { const id = returnTo; returnTo = null; setTimeout(() => { const c = document.getElementById("wr-" + id); if (c) { c.scrollIntoView({ block: "start" }); const hd = c.querySelector(".wr-id"); if (hd) hd.focus({ preventScroll: true }); } }, 80); }
    return `<div class="main wr">${header("Walkthrough findings", facts, "")}
      <p class="wr-lede">${esc(D.summary.answer)}</p>
      ${themesHtml()}
      <p class="wr-lede wr-small">${esc(D.summary.recheck)} Confirm each finding, mark it not a problem, or leave a note. When you're done, press Copy my answers and paste the text into our chat.</p>
      ${PA.v3ba ? `<p class="wr-lede wr-small"><b>V3 fixes ${PA.v3ba.count()} of them.</b> Each card says what V3 does, with See it in V3; Show me still shows v2. All of V3 is on Before & after's <a href="#before-after-v3">V3 tab</a>.</p>` : ""}
      <div class="wr-bar" id="wr-bar">${barHtml()}</div>
      ${tabsHtml()}
      <div id="wr-body" role="tabpanel" aria-labelledby="wr-tab-${tab}">${bodyHtml()}</div>
      <section class="wr-overall" aria-labelledby="wr-overall-h"><h3 class="wr-sub" id="wr-overall-h">Anything else?</h3>
        <p class="wr-intro">Something the reviewers missed, or what you'd like done next.</p>${answerHtml("overall", "proposal", "the review as a whole")}</section>
    </div>`;
  };

  // ——— Interaction ———
  const onPage = () => (location.hash || "").slice(1) === ROUTE;
  const redrawList = () => { const el = document.getElementById("wr-list"); if (el) el.innerHTML = listHtml(); };
  const redrawBody = () => { const el = document.getElementById("wr-body"); if (el) { el.innerHTML = bodyHtml(); el.setAttribute("aria-labelledby", "wr-tab-" + tab); } };
  function setTab(k, focus) {
    tab = k;
    try { sessionStorage.setItem("wr-tab", k); } catch (e) { /* this visit only */ }
    document.querySelectorAll("[data-wr-tab]").forEach((b) => { const on = b.dataset.wrTab === k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    redrawBody();
  }
  function jump(id) {
    if (DROPPED.has(id)) { setTab("dropped"); }
    else {
      if (tab !== "findings") setTab("findings");
      const f = BYID[id];
      if (f && !match(f)) { F = blank(); redrawBody(); }
    }
    const c = document.getElementById("wr-" + id);
    if (c) { c.scrollIntoView({ behavior: "smooth", block: "start" }); const hd = c.querySelector(".wr-id"); if (hd) hd.focus({ preventScroll: true }); }
  }
  function copyText() {
    const line = (id, label) => { const a = ans(id); if (!answered(id)) return null; const v = a.verdict === "yes" ? "Yes" : a.verdict === "no" ? "No" : "No verdict"; return `${label}: ${v}${a.note && a.note.trim() ? ` · ${a.note.trim().replace(/\s+/g, " ")}` : ""}`; };
    const out = ["Walkthrough findings: my answers"];
    STANDING.forEach((f) => { const l = line(f.id, f.id); if (l) out.push(l); });
    D.dup.forEach((r) => { const l = line(r.id, "Duplicated data · " + r.job); if (l) out.push(l); });
    const mo = line("menu-order", "Menu · order by RMF step"); if (mo) out.push(mo);
    const tw = line(D.menu.tweak.id, "Menu · Evidence under Implement"); if (tw) out.push(tw);
    [...D.menu.merges, ...D.menu.moves].forEach((m) => { const l = line(m.id, `Menu · ${m.from} → ${m.to}`); if (l) out.push(l); });
    D.fixes.forEach((x, i) => { const l = line(x.id, `Fix ${i + 1} · ${x.title}`); if (l) out.push(l); });
    D.dropped.forEach((id) => { const l = line("drop-" + id, `Dropped ${id} (yes = drop it)`); if (l) out.push(l); });
    const ov = line("overall", "Anything else"); if (ov) out.push(ov);
    if (out.length === 1) out.push("(nothing answered yet)");
    return out.join("\n");
  }

  document.addEventListener("click", (e) => {
    if (!onPage() || !e.target || !e.target.closest) return;
    const t = e.target;
    const v = t.closest("[data-wr-v]");
    if (v) { const box = v.closest("[data-wr-item]"); if (box) setVerdict(box.dataset.wrItem, v.dataset.wrV); return; }
    const no = t.closest("[data-wr-noteopen]");
    if (no) {
      const box = no.closest("[data-wr-item]"), wrap = box.querySelector(".wr-note"), ta = wrap.querySelector("textarea");
      const open = wrap.hidden;
      if (!open && ta.value.trim()) { ta.focus(); return; }
      wrap.hidden = !open; no.setAttribute("aria-expanded", String(open));
      if (open) ta.focus();
      return;
    }
    const tb = t.closest("[data-wr-tab]");
    if (tb) { setTab(tb.dataset.wrTab); return; }
    const th = t.closest("[data-wr-theme]");
    if (th) { F = { ...blank(), theme: th.dataset.wrTheme }; if (tab !== "findings") setTab("findings"); else redrawBody(); const b = document.getElementById("wr-body"); if (b) b.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    const fb = t.closest("button[data-wr-f]");
    if (fb) {
      const k = fb.dataset.wrF, val = fb.dataset.wrVal;
      if (k === "lane") F.lane = val;
      if (k === "sev") F.sev = F.sev.includes(val) ? F.sev.filter((x) => x !== val) : [...F.sev, val];
      document.querySelectorAll(`button[data-wr-f="${k}"]`).forEach((b) => b.setAttribute("aria-pressed", String(k === "lane" ? F.lane === b.dataset.wrVal : F.sev.includes(b.dataset.wrVal))));
      redrawList(); return;
    }
    if (t.closest("[data-wr-clear]")) { F = blank(); redrawBody(); const q = document.querySelector(".wr-q"); if (q) q.focus(); return; }
    const j = t.closest("[data-wr-jump]");
    if (j) { jump(j.dataset.wrJump); return; }
    const from = t.closest("[data-wr-from]");
    if (from) { returnTo = from.dataset.wrFrom; return; }
    if (t.closest("[data-wr-copy]")) {
      const text = copyText(), st = document.getElementById("wr-copy-st"), box = document.getElementById("wr-copytext");
      const fallback = () => { if (box) { box.hidden = false; box.value = text; box.focus(); box.select(); } if (st) st.textContent = "Select the text below and copy it"; };
      try { navigator.clipboard.writeText(text).then(() => { if (st) st.textContent = "Copied"; if (box) box.hidden = true; }, fallback); } catch (err) { fallback(); }
    }
  });
  document.addEventListener("input", (e) => {
    if (!onPage() || !e.target || !e.target.closest) return;
    const t = e.target;
    if (t.matches("[data-wr-note]")) { const box = t.closest("[data-wr-item]"); if (box) setNote(box.dataset.wrItem, t.value, false); return; }
    if (t.matches("input.wr-q")) { F.q = t.value.trim(); redrawList(); }
  });
  document.addEventListener("change", (e) => {
    if (!onPage() || !e.target || !e.target.closest) return;
    const t = e.target;
    if (t.matches("select[data-wr-f]")) { F[t.dataset.wrF] = t.value; redrawList(); return; }
    if (t.matches("input[type=checkbox][data-wr-f]")) { F.checked = t.checked; redrawList(); }
  });
  document.addEventListener("focusout", (e) => {
    if (!onPage() || !e.target || !e.target.matches || !e.target.matches("[data-wr-note]")) return;
    const box = e.target.closest("[data-wr-item]");
    if (box && noteTimers.has(box.dataset.wrItem)) setNote(box.dataset.wrItem, e.target.value, true);
  });
  document.addEventListener("keydown", (e) => {
    if (!onPage() || !e.target || !e.target.closest) return;
    const tb = e.target.closest("[data-wr-tab]");
    if (tb && (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "Home" || e.key === "End")) {
      e.preventDefault();
      const i = TABS.findIndex(([k]) => k === tb.dataset.wrTab);
      const n = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
      setTab(TABS[n][0], true);
    }
  });
  // Keep a note being typed from being lost to a page change: write it now.
  window.addEventListener("hashchange", () => { [...noteTimers.keys()].forEach((id) => { clearTimeout(noteTimers.get(id)); noteTimers.delete(id); save(id); }); });

  connect();
})();
