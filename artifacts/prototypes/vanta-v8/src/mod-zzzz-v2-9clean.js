// mod-zzzz-v2-9clean (v2-): the visual layer of prototype v2. It loads after every other module and passes every screen, preview and
// dialog through one cleanup function, PA.v2clean(html, route), which screens drawn later call themselves at draw time.
// The rules (finding ids from SP/vanta/gap): one tone per status word [N02 N06]; empty values print "—" [N03 A5]; banners grey and
// fewer [N01 A4]; no EXAMPLE badges (Josef, 19 Nov; was "EXAMPLE grey" [N06]); registers open with nothing ticked [A2 B8]; no count
// line under a register's title [A3]; constant columns cut, only when the whole register shows and never a status [A5 N04, re-review];
// at most two toned cells a row [N05]; no gadgets in rows [N08]; toolbars fold [N13]; tabs fold [N12 N18];
// avatars grey [N17]; changes in ink [N07]; one primary in a preview, never the header's [A18 N15]; one type scale [N10];
// no "In the app" tag on connector cards [A21]; a page's own strip of its area's pages folds into the side menu (Josef, 19 Nov).
// Every rule is generic and idempotent: it runs over markup it has not seen.
// PA.v2clean.stats[route][rule] counts what each rule changed.
(() => {
  const PA = window.PA;
  if (!PA || !PA.S || !PA.h) return;
  const { S, P, M } = PA;
  const pillFn = PA.h.pill || {};
  const normWord = pillFn.normWord || ((t) => String(t).replace(/\s+/g, " ").trim().toLowerCase().replace(/\d+(?:[.,]\d+)?/g, "n"));
  const toneOf = pillFn.toneOf || ((k) => (k === "info" ? "none" : k));
  const glyphOf = pillFn.glyphOf || ((t) => ({ ok: "check", bad: "diamond", warn: "clock", none: "ring" })[t]);
  const PCLS = { ok: "p-ok", bad: "p-bad", warn: "p-warn", none: "p-none" };

  // ——— Page types (the noise review's: register, record, overview, home, inbox, editor, settings) ———
  const META = /^(before-after|nav-options|study|walkthrough)/;
  const SSP = /^ssp($|-)/;
  const EDITOR = /^(ssp($|-)|plan-|policy-editor|program-new|program-start)/;
  const RECORD = /^(campaign|control-|component-mc|person-|check-|evidence-page-|policy-page-|integration-|stigs-(mission|ethernet|network|maintenance)|data-calls-(fisma|ready|scrm|cusa|fy26|kb)|frameworks-(high|moderate|low|privacy))/;
  const SETTINGS = /^(deadlines|notifications|event-log|enclaves|common-controls|permissions)($|-)/;
  const INBOX = /^(my-work)($|-)/;
  const OVERVIEW = /^(overview|conmon|sse|authorization|itcsc|getting-started|traceability|posture|resiliency|inheritance)($|-)/;
  const REG = ["controls", "policies", "checks", "portfolio", "baseline", "ppsm", "findings", "risks", "interconnections", "poam", "evidence", "data-calls", "sources", "assessments", "people", "threats", "stigs", "suppliers", "ai-drafts", "components", "schedule", "reports", "products", "ssps", "requirements", "composition", "package-room", "frameworks", "inventory", "cyber-te", "integrations", "review-queue"];
  const typeOf = (r, frag) => {
    if (!r) return "other";
    if (META.test(r)) return "meta";
    if (r === "home") return "home";
    if (EDITOR.test(r)) return "editor";
    if (RECORD.test(r)) return "record";
    if (INBOX.test(r)) return "inbox";
    if (SETTINGS.test(r)) return "settings";
    if (OVERVIEW.test(r)) return "overview";
    if (REG.some((b) => r === b || r.startsWith(b + "-"))) return "register";
    // A screen drawn later under a new name: judge by what it holds.
    if (frag) {
      if (frag.querySelector(".ak-rh, .ak-rail, .ak-rec")) return "record";
      if (frag.querySelector(".tools, .views") && frag.querySelector("table")) return "register";
    }
    return "other";
  };

  const STATS = {};
  let CUR = "";
  const bump = (route, rule, n = 1) => { if (!n) return; const s = STATS[route] || (STATS[route] = {}); s[rule] = (s[rule] || 0) + n; };
  const txt = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
  const cls = (el) => (typeof el.className === "string" ? el.className : (el.getAttribute && el.getAttribute("class")) || "");
  const DASH = '<span class="v2-dash" aria-label="None">—</span>';

  // ——— Rule 1: one status map [N02, N06] ———
  // A pill's word decides its tone (core.js STATUS_WORDS and its families); blue is never a status; the glyph follows the tone.
  function statusMap(frag, route) {
    let n = 0;
    frag.querySelectorAll(".pill").forEach((el) => {
      const c = cls(el), m = c.match(/\bp-(ok|bad|warn|info|none|part)\b/);
      const t = txt(el); if (!t) return;
      const tone = toneOf(m ? m[1] : "none", t);
      const want = PCLS[tone];
      if (!m || m[0] !== want) { el.classList.remove("p-ok", "p-bad", "p-warn", "p-info", "p-none", "p-part"); el.classList.add(want); n++; }
      const g = el.querySelector(":scope > .gl"), gw = glyphOf(tone, t);
      if (g && !g.classList.contains(gw)) { g.className = "gl " + gw; n++; }
    });
    // The kit's chips carry a tone class too: the same word, the same tone; a chip that is not a status keeps grey (blue never).
    frag.querySelectorAll(".ak-chip.ok, .ak-chip.bad, .ak-chip.warn, .ak-chip.info").forEach((el) => {
      const c = cls(el), m = c.match(/\b(ok|bad|warn|info)\b/);
      const tone = toneOf(m[1] === "info" ? "none" : m[1], txt(el));
      const want = tone === "none" ? "" : tone;
      if (m[1] !== want) { el.classList.remove("ok", "bad", "warn", "info"); if (want) el.classList.add(want); n++; }
    });
    bump(route, "status", n);
  }

  // ——— Rule 2: empty values print a subtle "—" [N03, A5] ———
  const EMPTY = new Set(["none", "none yet", "none recorded", "not recorded", "nothing recorded", "no owner", "no owner yet", "unassigned", "not assigned", "nobody", "no one", "not set", "not set yet", "not requested", "no renewal set", "no renewal date", "no renewal date set", "renewal not set", "not provided", "no date", "no due date", "not named", "no reviewer", "no approver", "no approver recorded", "unowned", "no value", "not given", "no assignee", "no lead", "not chosen"]);
  const isEmptyWord = (t) => EMPTY.has(String(t).replace(/[.·:]+$/, "").replace(/\s+/g, " ").trim().toLowerCase());
  const editable = (el) => el.querySelector("button, input, select, textarea, details, [contenteditable], [role=button], [role=combobox], [data-modal], .btn");
  function emptyValues(frag, route) {
    let n = 0;
    // A person glyph or a dashed ring beside a "nobody" word, anywhere.
    frag.querySelectorAll(".who, [class*='who '], [class$='who']").forEach((el) => {
      if (!el.isConnected && !el.parentNode) return;
      if (isEmptyWord(txt(el)) && !editable(el)) { el.outerHTML = DASH; n++; }
    });
    // An owner picker for nobody keeps the dashed person glyph alone (Vanta's owner column), its word for screen readers only.
    frag.querySelectorAll(".ak-owner.none .nm, .ak-owner.none > span:not(.ak-av)").forEach((el) => {
      if (isEmptyWord(txt(el)) && !el.classList.contains("v2c-sr")) { el.classList.add("v2c-sr"); n++; }
    });
    // A cell or a facts value that says only that nothing is there, with or without its ring or pill.
    frag.querySelectorAll("td, dd").forEach((el) => {
      const t = txt(el);
      if (!t || t === "—" || !isEmptyWord(t) || editable(el)) return;
      if (el.querySelector("a[href]")) return;
      el.innerHTML = DASH; n++;
    });
    bump(route, "empty", n);
  }

  // ——— Rule 4: no EXAMPLE badges [Josef 19 Nov: "remove all of those EXAMPLE badges, that's just clutter"] ———
  // A badge (.ex, or a tag, chip, pill or bare span that says only "Example") goes: in rows, headers, cards, previews, dialogs and the
  // editors. A footnote the badge introduced stays as a plain grey sentence; a sentence that only spoke of the badge goes ("The host
  // and laptop rows stay Example, as today."). "Example" used as a mark inside a line goes with its separator: a " · Example"
  // segment, "Example · …", "(… is Example)", a title's trailing "Example"; "are Example" in a sentence reads "are examples".
  const EXB = ".ex, [class*='-ex'], .tag, .ak-chip, .chip, .pill, [class*='badge'], span, small";
  // A sentence about the badge itself ("rows stay Example", "marked Example", "the Example tag"), not about invented data.
  const EX_ONLY = /\b(?:stays?|remains?|marked|tagged|labell?ed|shown|kept)\s+(?:as\s+)?(?:an?\s+)?Example\b(?![\w-])|\bExample\s+(?:marks?|tags?|badges?|labels?)\b/;
  const SEG = /\s+[·•]\s+/;
  function exText(s) {
    if (!s || s.indexOf("Example") < 0) return s;
    let out = s;
    // Parentheses that only say it is an example: "(Example)", "(SPDX is Example)", "(Example wording)".
    out = out.replace(/\s*\((?:[^()]*?\s(?:is|are)\s+)?Example(?:\s+[a-z]+)?\)/g, "");
    // A line of " · " segments: a segment that is or says Example goes.
    if (SEG.test(out)) {
      const parts = out.split(/(\s+[·•]\s+)/);
      const keep = [];
      for (let i = 0; i < parts.length; i += 2) {
        const seg = parts[i];
        if (/^\s*Example\s*$/.test(seg) || /\b(?:is|are)\s+Example\s*$/.test(seg)) continue;
        keep.push(seg);
      }
      if (keep.length && keep.length < Math.ceil(parts.length / 2)) {
        const lead = /^\s*Example\s*[·•]/.test(out);
        out = keep.map((x) => x.trim()).filter(Boolean).join(" · ");
        if (lead) out = out.charAt(0).toUpperCase() + out.slice(1);
        if (/^\s/.test(s)) out = " " + out;
      }
    }
    // A sentence: "… are Example." reads "… are examples."; "… is Example." reads "… is an example.".
    out = out.replace(/\b(are)\s+Example\b(?![\w-])/g, "$1 examples").replace(/\b(is)\s+Example\b(?![\w-])/g, "$1 an example");
    return out;
  }
  function examples(frag, route) {
    // A menu kept in a <template> (a row's ⋯ actions) is its own fragment: clean it too.
    const roots = [frag];
    for (let i = 0; i < roots.length; i++) roots[i].querySelectorAll("template").forEach((t) => roots.push(t.content));
    if (roots.length > 1) { roots.slice(1).forEach((r) => exampleIn(r, route)); }
    exampleIn(frag, route);
  }
  function exampleIn(frag, route) {
    let n = 0;
    // The badges themselves.
    frag.querySelectorAll(EXB).forEach((el) => {
      if (!el.parentNode || el.tagName === "I" || !/^example$/i.test(txt(el)) || el.querySelector("*:not(.gl):not(svg):not(svg *)")) return;
      const parent = el.parentNode, prev = el.previousSibling, next = el.nextSibling;
      const last = !next || (next.nodeType === 3 && !next.textContent.trim() && !next.nextSibling);
      el.remove(); n++;
      // Its separator: "Title · [Example]" leaves no dangling dot; "[Example] · rest" none at the start.
      if (prev && prev.nodeType === 3 && last) prev.textContent = prev.textContent.replace(/\s*[·•|,:]\s*$/, "");
      if (next && next.nodeType === 3 && (!prev || (prev.nodeType === 3 && !prev.textContent.trim()))) next.textContent = next.textContent.replace(/^\s*[·•|,:]\s*/, " ");
      // A footnote it introduced: kept as a plain sentence, unless all it says is about the badge.
      if (parent.nodeType === 1 && parent.matches("p, .note-p, .se-small, .ak-note, .pn-hint, small, .foot")) {
        const t = txt(parent);
        if (!t) { parent.remove(); return; }
        if (EX_ONLY.test(t)) {
          const sentences = t.split(/(?<=[.!?])\s+/), rest = sentences.filter((x) => !EX_ONLY.test(x));
          if (!rest.length && !parent.querySelector("a, button, [data-go], [data-modal], [data-panel]")) parent.remove();
        }
      }
    });
    // "Example" said as a mark inside text and in titles.
    const walker = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let t = walker.nextNode(); t; t = walker.nextNode()) if (t.textContent.indexOf("Example") >= 0 && !(t.parentNode && t.parentNode.closest && t.parentNode.closest("script, style, pre, code, textarea"))) nodes.push(t);
    for (const t of nodes) {
      const p = t.parentNode, whole = p && p.nodeType === 1 ? txt(p) : "";
      // A sentence that only spoke of the badge goes from its footnote; the footnote goes when nothing else is left.
      if (p && p.nodeType === 1 && p.matches("p, .note-p, .se-small, .ak-note, .pn-hint, small") && EX_ONLY.test(whole)) {
        const kept = whole.split(/(?<=[.!?])\s+/).filter((x) => !EX_ONLY.test(x)).join(" ");
        if (p.children.length === 0) { if (kept) p.textContent = kept; else p.remove(); n++; continue; }
      }
      const was = t.textContent, now = exText(was);
      if (now !== was) { t.textContent = now; n++; }
    }
    frag.querySelectorAll("[title*='Example'], [aria-label*='Example']").forEach((el) => {
      for (const a of ["title", "aria-label"]) {
        const v = el.getAttribute(a); if (!v || v.indexOf("Example") < 0) continue;
        const w = exText(v).replace(/\s+Example\s*$/, "").trim();
        if (w !== v) { el.setAttribute(a, w); n++; }
      }
    });
    bump(route, "example", n);
  }

  // ——— Rule 3: banners [N01, A4] ———
  // Every tinted banner is a grey callout whose glyph carries the tone (CSS); a register has none; elsewhere one a page.
  const BANNER = ".ak-banner, .next, .ak-await, [class*='banner'], [class*='callout'], [class*='warnbox'], [class*='notice']";
  const isBanner = (el) => {
    const c = cls(el);
    if (/unsaved|prevbar|pill|chip|(^|\s)tag(\s|$)|btn|v2-pop/.test(c)) return false;
    if (el.closest("td, th, button, a, .pill, .dlg-f")) return false;
    return true;
  };
  // On a register a banner goes only when its fact is said elsewhere on the page: a quick view, chip or tab carrying the same
  // count under words the banner uses ("88 artifacts are pending review" beside "Pending review 88"). Otherwise the first one
  // stays as one quiet grey line under the title, no box ("3 open CAT I rules …"). Elsewhere one banner stays, a grey callout.
  const plain = (s) => s.toLowerCase().replace(/[^a-z0-9&]+/g, " ").replace(/\s+/g, " ").trim();
  const STOP = new Set(["the", "and", "for", "with", "are", "has", "have", "its", "their", "from", "that", "this", "which", "into", "not", "yet", "one", "any", "per", "was", "were", "been", "all", "you", "your", "our"]);
  const NOUN = new Set(["asset", "control", "item", "rule", "checklist", "source", "program", "product", "component", "risk", "requirement", "evidence", "artifact", "policy", "people", "person", "member", "supplier", "finding", "issue", "task", "host", "check", "plan", "version", "assessment", "objective", "technique", "framework", "overlay", "agent", "run", "interconnection", "port", "protocol", "stig", "benchmark", "import", "event", "decision", "call", "report", "role", "variant", "system", "element", "milestone", "test", "page", "view"]);
  const stem = (w) => (w.length > 4 && w.endsWith("ies") ? w.slice(0, -3) + "y" : w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
  const words = (s) => plain(s).split(" ").filter((w) => w.length >= 2 && !/^\d/.test(w) && !STOP.has(w)).map(stem);
  const numbers = (s) => (s.match(/(?<![\w.\-])\d[\d,]*(?![\w\-])/g) || []).map((x) => +x.replace(/,/g, ""));
  function banners(frag, route, type) {
    const all = [...frag.querySelectorAll(BANNER)].filter((el) => isBanner(el) && !el.parentElement?.closest(BANNER));
    if (!all.length) return;
    let removed = 0, kept = 0;
    if (type === "register") {
      const facts = [];
      frag.querySelectorAll(".qv, .views > *, .ak-tab, .tabsx > *, [role=tab], .sectab, .ak-chip, [class*='chip'] > *").forEach((el) => {
        if (el.closest(BANNER) || isMarker(el)) return;
        const t = txt(el), cs = numbers(t), ws = words(t).filter((w) => !NOUN.has(w));
        if (cs.length && ws.length) facts.push([cs, ws]);
      });
      const said = (el) => { const t = txt(el), bn = numbers(t), bw = new Set(words(t)); return facts.some(([cs, ws]) => ws.every((w) => bw.has(w)) && cs.some((c) => bn.includes(c))); };
      const head = frag.querySelector(".ph, .ak-ih");
      let line = null;
      all.forEach((el) => {
        if (line || said(el)) { el.remove(); removed++; return; }
        line = el;
      });
      if (line) {
        line.classList.add("v2-line"); kept = 1;
        // Under the title, when the banner stood on its own in the page (not inside a card or a list it heads).
        if (head && head.parentNode && line.parentNode === head.parentNode && line.previousElementSibling !== head) head.after(line);
      }
    } else {
      all.slice(1).forEach((el) => { el.remove(); removed++; });
      all[0].classList.add("v2-callout"); kept = 1;
    }
    bump(route, "banner", removed);
    bump(route, type === "register" ? "banner-line" : "banner-grey", kept);
  }

  // ——— Rule 6: no count line under a register's title [A3] ———
  function factsLine(frag, route) {
    let n = 0;
    const head = frag.querySelector(".ph, .ak-ih, .ak-rh");
    if (!head) return;
    head.querySelectorAll(":scope .facts").forEach((el) => { el.remove(); n++; });
    head.querySelectorAll(".ak-desc").forEach((el) => { if (/\d/.test(txt(el))) { el.remove(); n++; } });
    bump(route, "facts", n);
  }

  // ——— Rule 7: columns that read the same in every row are cut [A5, N04] ———
  const isCheckCol = (cell) => !!cell && !!cell.querySelector(".ak-cb, input[type=checkbox], [role=checkbox], .cb, [class*='check']") && txt(cell).length < 3;
  const CONTROL = "button, [role=button], [role=checkbox], [role=switch], [role=menu], [role=menuitem], [aria-haspopup], input, select, textarea, details, .btn, .ib, .ak-cb, [data-modal], [class*='dots'], [class*='kebab'], [class*='-menu'], [class*='-act']";
  const isControlCell = (c) => !!c && (!!c.querySelector(CONTROL) || (!txt(c) && !!c.querySelector("svg, img, .gl, .ak-i, i")));
  // An actions column: nothing, a symbol, or only styled buttons.
  const isActionCol = (cell) => {
    if (!cell) return false;
    const t = txt(cell);
    if (!t || /^[⋯…·•›→↗✕+]+$/.test(t)) return true;
    const btns = [...cell.querySelectorAll(".btn, button.ib, .ib")];
    return btns.length > 0 && btns.map(txt).join(" ").replace(/\s+/g, " ").trim() === t;
  };
  // v2 (N, re-review): which columns go depends on what the page shows of its register.
  // - A column of data is cut only when the whole register is on screen: no quick view narrows it and its pager (or its count)
  //   shows every row. The first page of a long register agreeing proves nothing (Evidence's All 368 kept its Status).
  // - A status or state column is never cut, nor a setting's On/Off.
  // - Two kinds go on a page that does not show the whole register: an owner column empty in every row (Unassigned, —) when the
  //   register's own counts say nobody owns any of it (No owner 40 beside All 40), and an action word in every row (Assign owner,
  //   Reassess by Dec 12) on the unfiltered register; either stays when it is the row's only action.
  // - A column cut on a register's unfiltered view stays cut on its other views where it still reads the same (MEMO), so columns do
  //   not come and go as the reader moves between quick views.
  const ACTION = /^(assign|add|link|map|request|reassess|review|open|create|upload|set|mark|start|run|approve|accept|connect|invite|remind|renew|plan|schedule|attach|import|export|edit|change|record|publish|submit|send|resolve|close|reopen|treat|take|offer|choose|select|pick|view|show|claim|generate|sync|verify)\b/i;
  const STATUS_HEAD = /\b(status|state)\b/i;
  const OWNER_HEAD = /\b(owners?|assignees?|assigned to|approvers?|reviewers?)\b/i;
  const ROWACT = "a[href], [data-go], [data-panel], [data-modal], button, [role=button], [role=link], summary, .btn";
  const MEMO = new Map();
  const headText = (th) => { const c = th.cloneNode(true); c.querySelectorAll(".ak-co, [aria-hidden='true'], .ex, .v2c-sr").forEach((x) => x.remove()); return txt(c); };
  const labelOf = (td) => { const c = td.querySelector("summary, button, [role=button], .btn, a[href], .pill, .ak-chip, .tag"); return c ? txt(c) : txt(td); };
  const countOf = (el) => { const m = txt(el).match(/(\d[\d,]*)\s*$/); return m ? +m[1].replace(/,/g, "") : null; };
  const nameOf = (el) => txt(el).replace(/\s*\d[\d,]*\s*$/, "").trim();
  // What the page says about the register a table shows: its quick views and its pager.
  function scopeOf(table, nrows) {
    let views = null, pager = null;
    for (let a = table.parentElement, i = 0; a && i < 8 && !(views && pager); a = a.parentElement, i++) {
      if (!pager) pager = [...a.querySelectorAll(".pager, [class*='pager']")].find((p) => !p.closest("table")) || null;
      if (!views && a.querySelectorAll("table").length <= 1) views = a.querySelector(".views") || null;
      if (a.classList && a.classList.contains("main")) break;
    }
    const qvs = views ? [...views.children].filter((c) => !isMarker(c) && /\d/.test(txt(c))) : [];
    const active = qvs.find((c) => c.classList.contains("on") || c.getAttribute("aria-pressed") === "true" || c.getAttribute("aria-selected") === "true") || null;
    const all = qvs.find((c) => /^all\b/i.test(nameOf(c))) || null;
    const allN = all ? countOf(all) : null, activeN = active ? countOf(active) : null;
    // "1–25 of 40" and "25 per page" sit in sibling spans: read each child apart, or "of 40" runs into "25".
    const ptxt = pager ? [...pager.childNodes].map((x) => x.textContent).join(" ") : "";
    const pm = ptxt.match(/(\d[\d,]*)\s*[–-]\s*(\d[\d,]*)\s+of\s+(\d[\d,]*)(?![\d,])/);
    const [a, b, T] = pm ? pm.slice(1).map((x) => +x.replace(/,/g, "")) : [null, null, null];
    const unfiltered = !active || /^all\b/i.test(nameOf(active)) || (allN != null && activeN === allN);
    const shownAll = (!pm || (a <= 1 && b >= T)) && !(activeN != null && activeN > nrows);
    // Nobody owns any of the register: its own No owner count is its whole count (No owner 40 beside All 40).
    const total = allN != null ? allN : unfiltered ? (T != null ? T : nrows) : null;
    const noOwner = qvs.find((c) => /^(no owner|unassigned|without an owner|nobody)\b/i.test(nameOf(c)));
    return { unfiltered, whole: unfiltered && shownAll, nobodyOwns: !!noOwner && total != null && countOf(noOwner) === total };
  }
  function constantColumns(frag, route) {
    let n = 0;
    frag.querySelectorAll("table").forEach((table) => {
      // A screen keeps a constant column on purpose by marking the table, or its frame, .v2-keepcols or data-v2-keep.
      if (table.closest(".v2-keepcols, [data-v2-keep]")) return;
      const head = table.tHead && table.tHead.rows.length === 1 ? table.tHead.rows[0] : null;
      if (!head || head.querySelector("[colspan], [rowspan]")) return;
      const width = head.cells.length;
      const rows = [...table.querySelectorAll(":scope > tbody > tr")].filter((tr) => tr.cells.length === width);
      const heads = [...head.cells].map(headText);
      // One register: this route's table with these headings (its quick views redraw it in place).
      const memoKey = `${route.split(" · ")[0]}|${heads.join("¦")}`;
      const memo = MEMO.get(memoKey);
      // Does the row act some other way than through this column (it opens a preview, or another cell holds a control)?
      const otherAct = (tr, i) => tr.matches("[data-panel], [data-go], [data-modal], [href], [onclick]") || [...tr.cells].some((c, j) => j !== i && !isCheckCol(c) && !!c.querySelector(ROWACT));
      // The register's other views (a filter, a short list, an empty one) lose what its unfiltered view lost, where it still agrees.
      if (memo) {
        if (table.querySelector("tbody [rowspan]")) return;
        const cut = [];
        for (let i = 1; i < width; i++) {
          if (!memo.has(heads[i])) continue;
          const labs = rows.map((tr) => labelOf(tr.cells[i]));
          if (rows.some((tr) => isControlCell(tr.cells[i]) && !otherAct(tr, i))) continue;
          if (labs.every((v) => v === labs[0])) cut.push(i);
        }
        if (cut.length && width - cut.length >= 2) {
          // A row of another width (an empty state across the table) keeps its one cell and loses the span.
          for (const i of cut.slice().reverse()) { head.deleteCell(i); rows.forEach((tr) => tr.deleteCell(i)); n++; }
          table.querySelectorAll(":scope > tbody > tr > [colspan]").forEach((c) => { if (c.colSpan > 1) c.colSpan = Math.max(1, c.colSpan - cut.length); });
          table.querySelectorAll("colgroup").forEach((c) => c.remove());
        }
        return;
      }
      if (table.querySelector("[colspan], [rowspan]") || rows.length < 4) return;
      if (width < 3 || table.querySelectorAll(":scope > tbody > tr").length !== rows.length) return;
      // A matrix (permissions by role, check marks, a comparison) means every column even when a row reads the same:
      // its cells come from a handful of words. Leave it whole.
      const cells = rows.flatMap((tr) => [...tr.cells].slice(1));
      const body = cells.map((c) => txt(c));
      const distinct = new Set(body).size;
      if (width - 1 >= 3 && distinct <= Math.max(4, Math.ceil((width - 1) * 0.75)) && body.every((v) => v.length <= 28)) return;
      // Headings that are permissions (View, Create, Edit, Approve…), or cells that are mostly marks (a glyph alone, ✓, ✕, —): a
      // matrix. A pill is a word with a glyph, not a mark.
      const verbs = [...head.cells].slice(1).filter((th) => /^(view|read|create|add|edit|update|delete|remove|approve|sign|decide|publish|assign|export|import|manage|admin|write|comment|review|accept|submit|own)\b/i.test(txt(th))).length;
      const marks = cells.filter((c) => { const t = txt(c); return /^[✓✔✕✗×—–-]$/.test(t) || (t.length <= 2 && !!c.querySelector(".gl, svg, .ak-i")); }).length;
      if (verbs >= 3 || (cells.length && marks / cells.length >= 0.6)) return;
      // A heatmap (cells shaded by their value) is a chart: every column is a category, kept even when it reads zero.
      const heat = cells.filter((c) => /background/.test(c.getAttribute("style") || "") || /heat|lvl|-h\d\b|shade/.test(cls(c)) || (c.firstElementChild && (/background/.test(c.firstElementChild.getAttribute("style") || "") || /heat|lvl|shade/.test(cls(c.firstElementChild))))).length;
      if (cells.length && heat / cells.length >= 0.3) return;
      // So is a grid of numbers (elements by family, a pivot): mostly counts or nothing across five or more columns.
      if (width - 1 >= 5 && body.filter((v) => v === "" || v === "—" || /^\d[\d,.]*%?$/.test(v)).length / body.length >= 0.7) return;
      const sc = scopeOf(table, rows.length);
      const cut = [];
      for (let i = 1; i < width; i++) {
        const th = head.cells[i], h = heads[i];
        // No heading, a heading that is a control, a status or state, or a column of the row's own buttons and menus: kept.
        if (!h || isControlCell(th) || STATUS_HEAD.test(h) || rows.some((tr) => isActionCol(tr.cells[i]))) continue;
        const labs = rows.map((tr) => labelOf(tr.cells[i]));
        if (!labs.every((v) => v === labs[0])) continue;
        const vals = rows.map((tr) => txt(tr.cells[i]));
        const control = rows.some((tr) => isControlCell(tr.cells[i]));
        if (control && !labs[0]) continue; // an icon button or a ⋯ menu: the row's own actions
        const only = control && rows.some((tr) => !otherAct(tr, i));
        // A setting's value (Chat: Off in every row of a channel matrix) is never a constant to drop.
        if (/^(on|off|yes|no|enabled|disabled)$/i.test(labs[0])) continue;
        const empty = labs[0] === "" || labs[0] === "—" || isEmptyWord(labs[0]) || /^assign (an )?owner$/i.test(labs[0]);
        const action = !empty && ACTION.test(labs[0]);
        let go = false;
        // An owner column empty in every row goes when nobody owns any of the register; rows that agree on one page prove nothing
        // (Findings' first twelve issues are unowned, others are owned: cutting it there would hide that on All 44).
        if (empty) go = !only && (sc.whole || (OWNER_HEAD.test(h) && sc.nobodyOwns));
        else if (action) go = !only && (sc.whole || sc.unfiltered);
        else go = !control && sc.whole && vals.every((v) => v === vals[0]);
        if (go) cut.push(i);
      }
      // Never leave a table with fewer than two columns of content, and leave a table most of whose columns would go (a matrix).
      if (width - cut.length < 2 || cut.length > (width - 1) / 2) return;
      if (sc.unfiltered && cut.length) MEMO.set(memoKey, new Set(cut.map((i) => heads[i])));
      for (const i of cut.reverse()) { head.deleteCell(i); rows.forEach((tr) => tr.deleteCell(i)); n++; }
      // Rows outside tbody (none here) and a colgroup would now be off by one; drop a colgroup.
      if (cut.length) table.querySelectorAll("colgroup").forEach((c) => c.remove());
    });
    bump(route, "columns", n);
  }

  // ——— Rule 8: at most two toned cells a row [N05] ———
  const SEV = /^(critical|high|moderate|medium|low|very high|very low|cat i{1,3}|n cat i{1,3})$/;
  // An inline colour that is a tone (not ink or grey): var(--ok|bad|warn|info|brand) or a saturated hex.
  const tonedStyle = (s) => {
    const m = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(s || ""); if (!m) return false;
    const v = m[1].trim();
    if (/var\(--(ok|bad|warn|info|brand|brand-text)\)/.test(v)) return true;
    const h = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i); if (!h) return false;
    let x = h[1]; if (x.length === 3) x = x.split("").map((c) => c + c).join("");
    const r = parseInt(x.slice(0, 2), 16), g = parseInt(x.slice(2, 4), 16), b = parseInt(x.slice(4, 6), 16);
    return Math.max(r, g, b) - Math.min(r, g, b) > 40;
  };
  const TONE_CLASS = /(^|\s)(bad|warn|ok|late|overdue|danger|soon|due-late|due-soon|is-late|is-bad|is-warn|is-ok|red|amber|green)(\s|$)|-(bad|warn|late|overdue|danger|soon|ok)(\s|$)/;
  const tonedIn = (td) => {
    const out = [];
    td.querySelectorAll(".pill.p-ok, .pill.p-bad, .pill.p-warn, .ak-chip.ok, .ak-chip.bad, .ak-chip.warn").forEach((el) => { if (!el.classList.contains("v2-ink")) out.push(el); });
    td.querySelectorAll("[style]").forEach((el) => { if (tonedStyle(el.getAttribute("style")) && !el.closest("a, .pill, .ak-chip, .btn") && txt(el) && !el.classList.contains("v2-ink")) out.push(el); });
    td.querySelectorAll("[class]").forEach((el) => { const c = cls(el); if (TONE_CLASS.test(c) && !/pill|chip|btn|gl\b|ak-cb|qv|tag/.test(c) && txt(el) && !el.closest(".pill, .ak-chip, a") && !el.classList.contains("v2-ink")) out.push(el); });
    if (tonedStyle(td.getAttribute("style")) && txt(td)) out.push(td);
    return out;
  };
  const kindOf = (els) => {
    const t = normWord(txt(els[0]));
    if (els.some((e) => SEV.test(normWord(txt(e))))) return "sev";
    if (/(late|overdue|in n ?d|n ?d late|ago|^due|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|today|tomorrow|n days?)/.test(t)) return "date";
    if (els.some((e) => e.classList.contains("pill") || e.classList.contains("ak-chip"))) return "status";
    return "text";
  };
  function tonedCells(frag, route) {
    let n = 0;
    frag.querySelectorAll("tbody > tr").forEach((tr) => {
      const cells = [...tr.children].filter((c) => c.tagName === "TD" || c.tagName === "TH");
      const toned = cells.map((td) => [td, tonedIn(td)]).filter(([, e]) => e.length);
      if (toned.length <= 2) return;
      let status = null, dateSev = null;
      for (const [td, els] of toned) { const k = kindOf(els); if (k === "status" && !status) status = td; else if ((k === "date" || k === "sev") && !dateSev) dateSev = td; }
      for (const [td, els] of toned) {
        if (td === status || td === dateSev) continue;
        els.forEach((el) => { el.classList.add("v2-ink"); if (el.classList.contains("pill")) { el.classList.remove("p-ok", "p-bad", "p-warn"); el.classList.add("p-none"); } });
        n++;
      }
    });
    bump(route, "toned", n);
  }

  // ——— Rule 9: no gadgets in rows [N08] ———
  const GADGET = /(^|\s)(bar|stack|tally|meter|prog|progress|donut|minibar|spark|mbar|sbar|ak-prog|ak-donut)(\s|$)|-(mbar|sbar|bar|prog|ring|donut|tally|stack|meter|spark|minibar)(\s|$)/;
  const NOT_GADGET = /(^|\s)(gl|who|ak-ring|pill|tag|btn|qv|flt|tools|views|tabsx|pager|sectabs|ak-cb)(\s|$)|-(selbar|toolbar|tabbar|navbar|topbar|sidebar|actionbar|searchbar|scrollbar|bwrap|prevbar)(\s|$)|bar-top/;
  // A class token whose last part names a bar (bar, cbar, mbar…), a ring, a donut, a tally or a meter; never a toolbar's kind of bar.
  const BAR_PART = /^(bar|[a-z]{1,4}bar|prog|progress|ring|donut|tally|stack|meter|spark|minibar|track)$/;
  const NOT_BAR = /^(selbar|toolbar|tabbar|navbar|topbar|sidebar|actbar|prevbar|bulkbar|searchbar|scrollbar|appbar|titlebar|statusbar|menubar|crumbbar|filterbar|sortbar|editbar)$/;
  const isGadget = (c) => GADGET.test(c) || c.split(/\s+/).some((t) => { const part = t.split("-").pop(); return t.includes("-") && BAR_PART.test(part) && !NOT_BAR.test(part); });
  function rowGadgets(frag, route) {
    let n = 0;
    frag.querySelectorAll("[class]").forEach((el) => {
      const c = cls(el);
      if (!isGadget(c) || NOT_GADGET.test(c) || !el.parentNode) return;
      const row = el.closest("tr, li, [class~='row'], [class*='-row'], [class*='row ']");
      if (!row || row === el || el.closest(".card .minis, .pcard, .completion")) return;
      if (txt(el)) return; // a gadget carries no words: anything with text is a label or a block
      const cell = el.closest("td, li, [class~='row'], [class*='-row']") || row;
      const rest = txt(cell).replace(txt(el), "");
      if (!/\d/.test(rest)) return; // keep a gadget that is the only way the row says its number
      el.remove(); n++;
    });
    bump(route, "gadgets", n);
  }

  // ——— Rule 10: toolbars [N13]: five quick views and four filters on one line, the rest under More ———
  const moreBox = (label, count, inner, extra = "") => `<details class="v2-more${extra}"><summary class="${extra.includes("v2-fmore") ? "flt" : "qv"} v2-more-s">${label}${count ? ` <span class="num">${count}</span>` : ""} ⌄</summary><div class="v2-pop" role="group" aria-label="${label}">${inner}</div></details>`;
  // A hidden marker (the Before & after page's numbered .ak-co callouts, anything hidden) is not a quick view or a tab.
  const isMarker = (el) => el.classList.contains("ak-co") || el.classList.contains("v2c-sr") || el.classList.contains("v2-sr") || el.hidden || el.getAttribute("aria-hidden") === "true" || /display\s*:\s*none/.test(el.getAttribute("style") || "") || el.tagName === "TEMPLATE" || el.tagName === "SCRIPT";
  function toolbars(frag, route) {
    let n = 0;
    frag.querySelectorAll(".views").forEach((v) => {
      if (v.querySelector(":scope > .v2-more")) return;
      const items = [...v.children].filter((c) => !c.classList.contains("v2-more") && !isMarker(c));
      if (items.length <= 5) return;
      const on = items.find((c) => c.classList.contains("on") || c.getAttribute("aria-pressed") === "true" || c.getAttribute("aria-selected") === "true");
      let keep = items.slice(0, 5);
      if (on && !keep.includes(on)) keep = [...items.slice(0, 4), on];
      const rest = items.filter((c) => !keep.includes(c));
      const box = document.createElement("template");
      box.innerHTML = moreBox("More", rest.length, "");
      const pop = box.content.querySelector(".v2-pop");
      rest.forEach((c) => pop.appendChild(c));
      v.appendChild(box.content);
      n += rest.length;
    });
    frag.querySelectorAll(".tools").forEach((t) => {
      if (t.querySelector(".v2-fmore")) return;
      const items = [...t.children].filter((c) => !isMarker(c) && ((c.classList.contains("flt") && !c.classList.contains("sub")) || (c.tagName === "DETAILS" && c.querySelector(":scope > summary.flt") && !c.classList.contains("v2-more"))));
      if (items.length <= 4) return;
      const rest = items.slice(4);
      const box = document.createElement("template");
      box.innerHTML = moreBox("More filters", rest.length, "", " v2-fmore");
      const pop = box.content.querySelector(".v2-pop");
      const anchor = rest[0];
      anchor.parentNode.insertBefore(box.content, anchor);
      rest.forEach((c) => pop.appendChild(c));
      n += rest.length;
    });
    bump(route, "toolbar", n);
  }

  // ——— Rule 11: at most seven tabs in a strip; no second strip on a record; no label before a section's tabs [N12, N18] ———
  function tabs(frag, route, type) {
    let n = 0;
    frag.querySelectorAll(".ak-tabs, .tabsx, [role=tablist]").forEach((strip) => {
      if (strip.querySelector(":scope > .v2-more") || strip.closest(".v2-pop")) return;
      const items = [...strip.children].filter((c) => !c.classList.contains("v2-more") && !c.classList.contains("sec-l") && !isMarker(c));
      if (items.length <= 7) return;
      const on = items.find((c) => c.classList.contains("on") || c.getAttribute("aria-selected") === "true" || c.getAttribute("aria-current") === "page");
      let keep = items.slice(0, 6);
      if (on && !keep.includes(on)) keep = [...items.slice(0, 5), on];
      const rest = items.filter((c) => !keep.includes(c));
      // A button and a menu (not a <details>): on a phone the strip scrolls and the folded tabs stand in it again (CSS).
      const box = document.createElement("template");
      box.innerHTML = `<span class="v2-more v2-tabmore"><button type="button" class="v2-more-b v2-tab-s" aria-expanded="false">More <span class="num">${rest.length}</span> ⌄</button><span class="v2-pop" role="group" aria-label="More tabs" hidden></span></span>`;
      const pop = box.content.querySelector(".v2-pop");
      rest.forEach((c) => pop.appendChild(c));
      strip.appendChild(box.content);
      n += rest.length;
    });
    // Two stacked strips on a record: the section's own strip (drawn after the screen by the core router) is hidden by CSS on .v2-rec.
    if (type === "record") {
      const root = frag.firstElementChild && frag.firstElementChild.classList.contains("main") ? frag.firstElementChild : frag.querySelector(".main");
      if (root && !root.classList.contains("v2-rec")) { root.classList.add("v2-rec"); bump(route, "tabs-strip", 1); }
    }
    frag.querySelectorAll(".sec-l").forEach((el) => { el.remove(); n++; });
    bump(route, "tabs", n);
  }

  // ——— Rule 13: changes in ink [N07] ———
  function changesInk(frag, route) {
    let n = 0;
    frag.querySelectorAll("[style], [class]").forEach((el) => {
      if (el.classList.contains("v2-ink") || el.closest(".pill, .ak-chip, a, .btn, .gl")) return;
      const s = el.getAttribute("style") || "", c = cls(el), t = txt(el);
      const toned = tonedStyle(s) || /(^|\s|-)(add|added|adds|rem|removed|removes|plus|minus|up|down|delta|chg|change|diff-add|diff-rem)(\s|$)/.test(c) && /(^|\s|-)(ok|bad|add|rem|plus|minus|up|down|delta)(\s|$|-)/.test(c);
      if (!toned || !t || el.children.length > 2) return;
      // A count of what changed (+370, −17, 3 added), or a plain sentence printed in red or green.
      if (/^[+−–-]\s?\d[\d,]*(\s|$)/.test(t) || /^\d[\d,]* (added|removed|changed|more|fewer)\b/.test(t) || (t.length <= 16 && /(^|\s)[+−–]\s?\d+\s?d?\b/.test(t)) || (t.length > 38 && !/(late|overdue|failed|expired|past due|days? ago)/i.test(t) && /\s\S+\s\S+\s/.test(t) && tonedStyle(s))) {
        el.classList.add("v2-ink"); n++;
      }
    });
    // A required asterisk in red.
    frag.querySelectorAll("[style*='--bad'], .req, [class*='-req']").forEach((el) => { if (txt(el) === "*" && !el.classList.contains("v2-ink")) { el.classList.add("v2-ink"); n++; } });
    bump(route, "ink", n);
  }

  // ——— Rule 14: a preview's action is a secondary button; at most one primary in a preview [A18, N15] ———
  const wire = (b) => b.getAttribute("data-modal") || b.getAttribute("data-go") || b.getAttribute("href") || [...b.attributes].filter((a) => /^data-/.test(a.name)).map((a) => a.name + "=" + a.value).join("&");
  function panelButtons(frag, route) {
    let n = 0;
    // The first ink button is the preview's own action (its header's): outlined. One primary may stay below it.
    [...frag.querySelectorAll(".btn.ink")].forEach((b, i) => { if (i !== 1) { b.classList.remove("ink"); b.classList.add("v2-sec"); n++; } });
    // The same action twice (the header's and a card's copy) [N15]: keep one, the wired one if only one is wired.
    const byText = new Map();
    frag.querySelectorAll(".btn").forEach((b) => { const t = txt(b); if (t.length < 8 || /^\+/.test(t)) return; (byText.get(t) || byText.set(t, []).get(t)).push(b); });
    for (const list of byText.values()) {
      if (list.length < 2) continue;
      const wired = list.filter((b) => wire(b));
      if (new Set(wired.map(wire)).size > 1) continue; // two different actions under one label
      const keep = wired[0] || list[0];
      list.forEach((b) => { if (b !== keep && b.parentNode) { b.remove(); n++; } });
    }
    bump(route, "panel-primary", n);
  }

  // ——— Rule 16: one type scale [N10]: inline sizes snap to 12 / 14 / 16 / 20 / 28 ———
  // The scale: 12 secondary, 14 body, 16 card and section titles, 20 dialog titles, 22 page titles, 28 editor titles; numbers of
  // 31px and up keep their size. A size snaps to the largest step not more than half a pixel above it, so nothing grows
  // (11-12px marks round up to 12).
  const STEPS = [12, 14, 16, 20, 22, 28];
  const snap = (px) => { if (px >= 31) return px; if (px < 12) return 12; let s = 12; for (const t of STEPS) if (t <= px + 0.5) s = t; return s; };
  function inlineType(frag, route) {
    let n = 0;
    frag.querySelectorAll("[style*='font']").forEach((el) => {
      const s = el.getAttribute("style");
      const out = s.replace(/font-size\s*:\s*([\d.]+)px/gi, (m, v) => { const w = snapIn(+v); return w === +v ? m : (n++, `font-size:${w}px`); })
        .replace(/(font\s*:\s*(?:[\w-]+\s+)*?)([\d.]+)px/gi, (m, pre, v) => { const w = snapIn(+v); return w === +v ? m : (n++, `${pre}${w}px`); })
        .replace(/font-weight\s*:\s*(700|800|900)/gi, () => (n++, "font-weight:600"));
      if (out !== s) el.setAttribute("style", out);
    });
    bump(route, "type", n);
  }

  // ——— Rule 18: an area's pages are its side menu [Josef 19 Nov: "use the nav pattern we did for programs"] ———
  // The shell lists an area's pages beside the rail (core.js). A page's own tab strip that lists exactly those pages (AI agents'
  // Needs approval · Runs · Agents) would be the menu twice: it goes, and its counts move into the menu's items. A page whose title
  // is only the area's name (AI agents) is titled by its page instead (Needs approval), as a program's pages are.
  function areaPages(frag, key, route) {
    const A = PA.area && PA.area(route);
    if (!A || A.items.length < 2) return;
    const norm = (s) => s.replace(/\d[\d,]*/g, "").replace(/\s+/g, " ").trim().toLowerCase();
    const page = new Map(A.items.map(([k, l]) => [norm(l), k]));
    let n = 0;
    frag.querySelectorAll(".ak-tabs, .tabsx, [role=tablist], .views").forEach((strip) => {
      if (!strip.parentNode) return;
      const items = [...strip.children].filter((c) => !isMarker(c) && txt(c));
      const keys = items.map((c) => page.get(norm(txt(c))));
      if (items.length < 2 || keys.some((k) => !k) || new Set(keys).size !== keys.length) return;
      items.forEach((c, i) => { if (PA.areaCount) PA.areaCount(keys[i], countOf(c) == null ? "" : txt(c).match(/(\d[\d,]*)\s*$/)[1]); });
      strip.remove(); n++;
    });
    const cur = A.items.find(([k]) => k === A.current);
    if (cur && norm(cur[1]) !== norm(A.label)) {
      const t = frag.querySelector(".ph h3, .ak-ih .ak-title, .ak-rh .ak-title");
      if (t && !t.children.length && norm(txt(t)) === norm(A.label)) { t.textContent = cur[1]; n++; }
    }
    bump(key, "area-menu", n);
  }

  // ——— Rule 17: no repeated "In the app" tag on connector cards [A21] ———
  function inTheApp(frag, route) {
    let n = 0;
    frag.querySelectorAll("span, small, em, b, i, div").forEach((el) => { if (!el.children.length && /^in the app$/i.test(txt(el)) && el.parentNode) { el.remove(); n++; } });
    bump(route, "in-the-app", n);
  }

  // ——— The cleanup ———
  function clean(html, route, where) {
    if (typeof html !== "string" || !html || html.indexOf("<") < 0 || PA.v2clean.off) return html; // PA.v2clean.off = true: compare without the layer
    route = route || CUR || "";
    if (META.test(route)) return html;
    const key = where ? `${route} · ${where}` : route;
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    const frag = tpl.content;
    const before = (STATS[key] && Object.values(STATS[key]).reduce((a, b) => a + b, 0)) || 0;
    const type = where ? (where.startsWith("dialog") ? "dialog" : "panel") : typeOf(route, frag);
    statusMap(frag, key);
    examples(frag, key);
    emptyValues(frag, key);
    inlineType(frag, key);
    if (!SSP.test(route)) {
      if (type === "panel") { panelButtons(frag, key); banners(frag, key, "panel"); }
      else if (type !== "dialog") {
        areaPages(frag, key, route);
        changesInk(frag, key);
        if (type !== "editor") banners(frag, key, type);
        if (type === "register") { factsLine(frag, key); }
        if (type !== "editor") { constantColumns(frag, key); tonedCells(frag, key); rowGadgets(frag, key); toolbars(frag, key); tabs(frag, key, type); }
        if (/^integration/.test(route)) inTheApp(frag, key);
      }
    }
    const after = (STATS[key] && Object.values(STATS[key]).reduce((a, b) => a + b, 0)) || 0;
    if (after === before) return html; // nothing changed: hand back the markup as it was
    return tpl.innerHTML;
  }
  const v2clean = (html, route) => {
    const t0 = performance.now();
    const out = clean(html, route);
    const ms = performance.now() - t0;
    v2clean.ms[route || CUR] = Math.round(ms * 10) / 10;
    return out;
  };
  v2clean.stats = STATS;
  v2clean.reset = () => { Object.keys(STATS).forEach((k) => delete STATS[k]); };
  v2clean.ms = {};
  v2clean.typeOf = typeOf;
  v2clean.panel = (html, kind) => clean(html, CUR, "panel: " + kind);
  v2clean.dialog = (html, key) => clean(html, CUR, "dialog: " + key);
  PA.v2clean = v2clean;

  // ——— Wrap every screen, preview and dialog (now, and again at start for anything registered after this module) ———
  const wrapS = (k) => {
    const f = S[k]; if (typeof f !== "function" || f.__v2c || META.test(k)) return;
    const g = function () { return v2clean(f.apply(this, arguments), k); };
    Object.keys(f).forEach((p) => { g[p] = f[p]; });
    g.__v2c = true; S[k] = g;
  };
  const wrapP = (k) => {
    const f = P[k]; if (typeof f !== "function" || f.__v2c) return;
    const g = function (id) { const o = f.apply(this, arguments); if (o && typeof o.body === "string") o.body = clean(o.body, CUR, "preview: " + k); return o; };
    Object.keys(f).forEach((p) => { g[p] = f[p]; });
    g.__v2c = true; P[k] = g;
  };
  const wrapM = (k) => {
    const f = M[k]; if (typeof f !== "function" || f.__v2c) return;
    const g = function (id) { const o = f.apply(this, arguments); if (o && typeof o.body === "string") o.body = clean(o.body, CUR, "dialog: " + k); return o; };
    Object.keys(f).forEach((p) => { g[p] = f[p]; });
    g.__v2c = true; M[k] = g;
  };
  const wrapAll = () => { Object.keys(S).forEach(wrapS); Object.keys(P).forEach(wrapP); Object.keys(M).forEach(wrapM); };
  wrapAll();

  // ——— After the router draws: registers open with nothing ticked [A2, B8]; meta pages keep their own look ———
  const proto = document.getElementById("proto");
  function afterRoute() {
    const r = (location.hash || "#home").slice(1);
    CUR = r;
    if (proto) proto.classList.toggle("v2meta", META.test(r));
    setSnap(!META.test(r));
    const main = document.getElementById("main");
    if (!main || META.test(r) || typeOf(r) !== "register") return;
    // A register drawn with rows already chosen shows its selection bar where the filters belong: press its own Deselect, once.
    for (let i = 0; i < 3; i++) {
      const d = [...main.querySelectorAll(".ak-bulk [role=button], .ak-bulk button, .ak-bulk .ak-link, [data-addesel], [data-atdesel], [data-apdesel], [data-aw-desel], [data-ardesel], [data-v8b-desel], [data-v7p-desel]")]
        .find((el) => /^deselect( all)?$/i.test(txt(el)));
      if (!d) break;
      const had = document.activeElement;
      d.click();
      bump(r, "preticked", 1);
      if (had && had !== document.body && document.contains(had)) had.focus({ preventScroll: true });
      else if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    }
  }
  // A folded tab strip's More opens and closes its menu; a click elsewhere or Escape closes it.
  const closeMores = (except) => document.querySelectorAll(".v2-more-b[aria-expanded='true']").forEach((b) => { if (b === except) return; b.setAttribute("aria-expanded", "false"); const p = b.nextElementSibling; if (p) p.hidden = true; });
  document.addEventListener("click", (e) => {
    const b = e.target && e.target.closest ? e.target.closest(".v2-more-b") : null;
    closeMores(b);
    if (!b) return;
    const pop = b.nextElementSibling, open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open)); if (pop) pop.hidden = !open;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const b = document.querySelector(".v2-more-b[aria-expanded='true']"); if (!b) return;
    closeMores(); b.focus();
  });

  // [A5] A table wider than its frame lets its cells wrap (.v2-fit), measured whenever the page area changes or narrows.
  function fitTables() {
    if (META.test(CUR)) return;
    for (const id of ["main", "panel"]) {
      const area = document.getElementById(id); if (!area) continue;
      area.querySelectorAll(".tablebox").forEach((b) => {
        const f = b.closest(".frame") || b;
        if (!f.classList.contains("v2-fit") && b.clientWidth && b.scrollWidth > b.clientWidth + 2) {
          f.classList.add("v2-fit");
          // A code or an identifier (AST-109002, CN-109101) never breaks at its hyphen.
          f.querySelectorAll("td").forEach((td) => { const t = td.textContent.trim(); if (t && t.length <= 24 && !/\s/.test(t)) td.classList.add("v2-tok"); });
        }
      });
    }
  }
  const start0 = PA.start;
  PA.start = function () {
    wrapAll();
    CUR = (location.hash || "#home").slice(1);
    const out = start0.apply(this, arguments);
    window.addEventListener("hashchange", afterRoute);
    afterRoute();
    fitTables();
    const main = document.getElementById("main"), panel = document.getElementById("panel");
    if (window.MutationObserver) { const mo = new MutationObserver(fitTables); if (main) mo.observe(main, { childList: true, subtree: true }); if (panel) mo.observe(panel, { childList: true }); }
    if (window.ResizeObserver && main) new ResizeObserver(fitTables).observe(main);
    return out;
  };

  // ——— Rule 16, the stylesheet half: every off-scale size in the prototype's CSS snaps to the scale outside the meta pages ———
  // Each rule's own size is rewritten in place, so no rule gains weight in the cascade (a later, more specific rule still wins:
  // a scoped copy once let the study page's h1 44px beat the wizard's own 16px). The chrome (rail, menu, top bar) and the meta
  // pages' own rules keep their sizes; on a meta page every edit is put back (setSnap(false)) and redone on leaving it.
  // Page titles are one size (22), section and card titles one (16).
  // Page titles take the kit's 22px, which 386 screens already use (the core header's 28 and the evidence record's 24 come
  // down to it); a program card's title takes the card title's 16. Every other title snaps by number and none grows.
  const TITLE_SIZE = { ".ph h3": 22, ".pcard .nm2": 16 };
  const TITLE_LH = { 22: "30px", 16: "24px" };
  const titleOf = (sel) => TITLE_SIZE[sel] || (/^\.[\w-]+-page \.ak-title$/.test(sel) ? 22 : 0);
  const CHROME = /(^|[\s>+~(,])(\.(ri|ri-l|ri-b|ri-end|top|tile|kbd|search|side|item|gbtn|pnh|pn-sw|pn-swt|pn-facts|pn-sep|pt-bottom|pt-more|pt-shell|rail|menu|modeinfo|mode|mp|ms|swmenu|switch|sw-wrap|avatar)\b|#(rail|nav|bottom|moreMenu|swMenu|menuBtn|swBtn)\b)|^\.g\b/;
  const METASEL = /\bv9n-|\bba-|study|cmp-|\.ba\b|\bbefore|\bzz-/;
  // Below 11px a size is a mark's (a badge, a superscript): it only loses its half pixel.
  const snapIn = (v) => (v < 11 ? Math.round(v) : snap(v));
  const EDITS = [];
  let snapOn = false;
  function collectSnaps() {
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch (e) { continue; }
      const walk = (list) => {
        for (const r of list) {
          if (r.type === 4 && r.cssRules) { walk(r.cssRules); continue; }
          if (r.type !== 1 || !r.style || !r.selectorText) continue;
          const sel = r.selectorText.trim();
          if (CHROME.test(sel) || METASEL.test(sel)) continue;
          const title = titleOf(sel);
          const st = r.style, fs = st.fontSize, sh2 = st.getPropertyValue("font"), fw = st.fontWeight, lh = st.lineHeight;
          if (fs && /^[\d.]+px$/.test(fs)) {
            const v = parseFloat(fs), w = title || snapIn(v);
            if (w !== v) EDITS.push([st, "font-size", fs, w + "px", st.getPropertyPriority("font-size")]);
            if (title && lh && /px$/.test(lh) && lh !== TITLE_LH[title]) EDITS.push([st, "line-height", lh, TITLE_LH[title], st.getPropertyPriority("line-height")]);
          } else if (!fs && sh2 && /\d*\.?\d+px/.test(sh2)) {
            // A shorthand with var() leaves its longhands empty: rewrite the shorthand's own text.
            const ns = sh2.replace(/(^|\s)(\d*\.?\d+)px(\/[\d.]+(?:px)?)?/, (m, pre, v, l) => pre + (title || snapIn(+v)) + "px" + (title ? "/" + TITLE_LH[title] : l || "")).replace(/(^|\s)(700|800|900|bold)(?=\s)/, "$1600");
            if (ns !== sh2) EDITS.push([st, "font", sh2, ns, st.getPropertyPriority("font")]);
          }
          if (fw && /^(700|800|900|bold)$/.test(fw)) EDITS.push([st, "font-weight", fw, "600", st.getPropertyPriority("font-weight")]);
        }
      };
      walk(rules);
    }
    return EDITS.length;
  }
  function setSnap(on) {
    if (on === snapOn) return;
    snapOn = on;
    for (const [st, prop, from, to, prio] of EDITS) st.setProperty(prop, on ? to : from, prio);
  }
  v2clean.snap = setSnap;
  try { v2clean.snapped = collectSnaps(); setSnap(!META.test((location.hash || "#home").slice(1))); } catch (e) { v2clean.snapped = String(e); }
})();
