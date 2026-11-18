// mod-v9-navlab (v9n-): Navigation options. Five wireframed ways to keep the workspace's navigation apart from a program's.
// Route: nav-options (Experiments › Navigation options). Each frame is a scale model of a 1440 × 900 screen, or a 390 × 780 phone,
// and it works: open a program, move around in it, switch programs with ▾, leave it. Only the navigation is drawn; pages are grey.
// The items are the prototype's own: the workspace's destinations, and WS-X90's 32 pages in today's groups.
(() => {
  const PA = window.PA;
  if (!PA || !PA.S || !PA.h) return;
  const { S, h } = PA;
  const { esc, header, page } = h;
  if (PA.own) PA.own(["nav-options"]);

  // ——— What the navigation holds ———
  const WS = [["home", "Home"], ["my-work", "My work", 6], ["review", "Review queue", 148], ["programs", "Programs"], ["products", "Products"], ["library", "Library"], ["agents", "AI agents"], ["settings", "Settings"]];
  const SHORT = { "my-work": "My work", review: "Review", agents: "Agents" };
  const WS_TABS = {
    programs: ["All programs", "Risks", "POA&M", "Authorizations"], review: ["Waiting on me", "All"], products: ["Products", "Components", "Suppliers"],
    library: ["Frameworks & overlays", "Integrations", "Data calls", "Reports & exports"], agents: ["Needs approval", "Runs", "Agents"],
    settings: ["Deadlines", "Notifications", "Event log", "Enclaves & markings", "Common control providers", "Roles & permissions"],
  };
  const PG = [
    [null, [["overview", "Overview"], ["getting-started", "Getting started", "25%"], ["itcsc", "ITCSC"]]],
    ["System", [["composition", "Composition"], ["inventory", "Inventory"], ["stigs", "STIG checklists"], ["interconnections", "Interconnections"], ["ppsm", "Ports & protocols"], ["sources", "Evidence sources"]]],
    ["Compliance", [["baseline", "Baseline"], ["controls", "Controls"], ["plans", "Plans"], ["requirements", "Requirements"], ["evidence", "Evidence", 142], ["checks", "Checks"], ["policies", "Policies"]]],
    ["Assess", [["assessments", "Assessments"], ["cyber-te", "Cyber T&E"]]],
    ["Risk", [["findings", "Findings", 44], ["poam", "POA&M"], ["risks", "Risks"], ["threats", "Threats"]]],
    ["Analysis", [["posture", "Posture"], ["resiliency", "Cyber resiliency"], ["sse", "Security engineering"], ["traceability", "Traceability"], ["inheritance", "Inheritance"]]],
    ["Authorize", [["authorization", "Authorization"], ["package-room", "Package room"]]],
    ["Monitor", [["conmon", "Continuous monitoring"], ["schedule", "Schedule"]]],
    [null, [["team", "Team"]]],
  ];
  const CLOSED = ["Analysis", "Monitor"];
  const PITEMS = PG.flatMap(([g, its], gi) => its.map(([k, l, c]) => ({ g, gi, k, l, c })));
  const TABG = PG.map(([g, its], gi) => ({ label: g || (gi === 0 ? "Overview" : its[0][1]), its }));
  const PROGS = ((PA.data && PA.data.PROGRAMS) || []).map((p) => ({ code: p.code, name: p.name }));
  if (!PROGS.length) PROGS.push({ code: "PRG-1090", name: "WS-X90 Sentinel Mission System" });
  const OTHERS = ((PA.data && PA.data.OTHER) || []).length;
  const split = (n) => { const i = n.indexOf(" · "); return i > 0 ? [n.slice(0, i), n.slice(i + 3)] : [n.split(" ")[0], n.split(" ").slice(1).join(" ")]; };

  // ——— The five options ———
  const PAGES = PITEMS.length;
  // Measured in the frames at 1440 × 900 (probe-v9.mjs): where a program page's first block starts, from the top of the screen.
  const TOPS = [153, 153, 153, 153, 258];
  const OPTS = [
    {
      id: "nested", name: "Nested under Programs",
      line: "One sidebar. Inside a program, its menu opens under Programs; everywhere else, Programs is one item. Global things stay global.",
      watch: () => (ST.v1 === "last"
        ? `The program's ${PAGES} pages make one long list. With Programs last, nothing is pushed down: Products, Library and Settings stay above the program.`
        : `In its usual place, the program's ${PAGES} pages push Products, Library, AI agents and Settings down, out of view until you scroll.`),
      facts: () => [["Navigation width in a program", "240 px"], ["Elsewhere", "240 px"], ["From a program page to Settings", ST.v1 === "last" ? "1 click" : "1 click, after scrolling"], ["A program page's content starts", `${TOPS[0]} px down`]],
      th: [[0, 10, 24, 90, "col"], [4, 15, 14, 3], [4, 21, 12, 3], [4, 27, 15, 3], [4, 34, 13, 3], [5, 40, 17, 56, "p"], [27, 17, 30, 5], [27, 27, 66, 4], [27, 35, 60, 4], [27, 43, 63, 4]],
    },
    {
      id: "drill", name: "Drill into the program",
      line: "One sidebar with two levels. Open a program and the sidebar becomes its menu; ‹ Workspace goes back up a level.",
      watch: () => "Inside a program the workspace is one level up, so My work's 6 and the Review queue's 148 are out of sight until you go back.",
      facts: () => [["Navigation width in a program", "240 px"], ["Elsewhere", "240 px"], ["From a program page to Settings", "2 clicks: ‹ Workspace, then Settings"], ["A program page's content starts", `${TOPS[0]} px down`]],
      th: [[0, 10, 24, 90, "col"], [3, 14, 9, 3], [2, 20, 20, 76, "p"], [27, 17, 30, 5], [27, 27, 66, 4], [27, 35, 60, 4], [27, 43, 63, 4]],
    },
    {
      id: "rail", name: "Icon rail and program menu",
      line: "A narrow rail of workspace icons that never changes. Inside a program, the program's menu sits beside it.",
      watch: () => "Two columns of navigation inside a program: 304 px, 64 more than today's sidebar.",
      facts: () => [["Navigation width in a program", "304 px"], ["Elsewhere", "64 px"], ["From a program page to Settings", "1 click"], ["A program page's content starts", `${TOPS[0]} px down`]],
      th: [[0, 10, 7, 90, "col"], [2, 15, 3, 4], [2, 23, 3, 4], [2, 31, 3, 4], [7, 10, 21, 90, "p"], [32, 17, 30, 5], [32, 27, 62, 4], [32, 35, 56, 4], [32, 43, 59, 4]],
    },
    {
      id: "top", name: "Workspace in the top bar",
      line: "The workspace's links move into the top bar beside search. The sidebar appears only inside a program, as its menu.",
      watch: () => "Seven links share the top bar with search: on a narrower window the last ones fold into More.",
      facts: () => [["Navigation width in a program", "240 px"], ["Elsewhere", "0 px"], ["From a program page to Settings", "1 click"], ["A program page's content starts", `${TOPS[0]} px down`]],
      th: [[8, 3, 7, 4], [17, 3, 7, 4], [26, 3, 7, 4], [35, 3, 7, 4], [0, 10, 24, 90, "p"], [27, 17, 30, 5], [27, 27, 66, 4], [27, 35, 60, 4], [27, 43, 63, 4]],
    },
    {
      id: "tabs", name: "Program as a record with tabs",
      line: "The sidebar stays the workspace's. A program page has a header and two rows of tabs, like any record.",
      watch: () => `${PAGES} pages in two rows of tabs: most pages are a click deeper, and the header and tabs push every program page's content ${TOPS[4] - TOPS[0]} px further down.`,
      facts: () => [["Navigation width in a program", "240 px"], ["Elsewhere", "240 px"], ["From a program page to Settings", "1 click"], ["A program page's content starts", `${TOPS[4]} px down`]],
      th: [[0, 10, 24, 90, "col"], [4, 15, 14, 3], [4, 21, 12, 3], [4, 27, 15, 3], [4, 34, 13, 3], [27, 15, 38, 7, "p"], [27, 26, 66, 4, "p"], [27, 33, 46, 3, "p"], [27, 42, 63, 4], [27, 50, 58, 4]],
    },
  ];
  const CMP = [
    ["240 px", "240 px", "1", `${TOPS[0]} px`, "☰ opens the same list"],
    ["240 px", "240 px", "2", `${TOPS[0]} px`, "☰ opens the level you're on"],
    ["304 px", "64 px", "1", `${TOPS[0]} px`, "A bottom bar, and ☰ for the program"],
    ["240 px", "0 px", "1", `${TOPS[0]} px`, "☰ opens the workspace above the program"],
    ["240 px", "240 px", "1", `${TOPS[4]} px`, "The tabs scroll sideways"],
  ];

  // ——— State ———
  const START = () => ({ route: "p:risks", prog: 0, open: new Set(PG.filter(([g]) => g && !CLOSED.includes(g)).map(([g]) => g)), level: "program", hasProg: true, drawer: false, sw: false });
  const ST = Object.assign({ opt: 0, screen: null, v1: "last" }, START());
  const cur = () => PROGS[ST.prog] || PROGS[0];
  const inProg = () => ST.route.startsWith("p:");
  const key = () => ST.route.slice(2);
  const pItem = (k) => PITEMS.find((x) => x.k === k) || PITEMS[0];
  const wItem = (k) => WS.find(([x]) => x === k) || WS[0];
  const opt = () => OPTS[ST.opt].id;
  const fmtc = (c) => (c == null ? "" : typeof c === "number" ? c.toLocaleString("en-US") : String(c));

  // ——— Pieces ———
  const it = (to, label, count, cls = "") => {
    const on = ST.route === to;
    return `<button type="button" class="v9n-it${on ? " on" : ""}${cls ? " " + cls : ""}" data-v9n-to="${to}"${on ? ' aria-current="page"' : ""}><span class="v9n-l">${esc(label)}</span>${count != null ? `<span class="v9n-c num">${esc(fmtc(count))}</span>` : ""}</button>`;
  };
  const wsItems = (list, parentOfProgram) => list.map(([k, l, c]) => it("w:" + k, l, c, k === "programs" && parentOfProgram && inProg() ? "parent" : "")).join("");
  const swMenu = () => `<div class="v9n-menu" role="menu">${PROGS.map((p, i) => `<button type="button" role="menuitemradio" aria-checked="${i === ST.prog}" class="v9n-it${i === ST.prog ? " on" : ""}" data-v9n-prog="${i}"><span class="v9n-l">${esc(p.name)}</span></button>`).join("")}<button type="button" role="menuitem" class="v9n-it" data-v9n-to="w:programs"><span class="v9n-l">All programs</span><span class="v9n-c num">${PROGS.length + OTHERS}</span></button></div>`;
  const switcher = (cls = "") => { const [a, b] = split(cur().name); return `<button type="button" class="v9n-sw${cls}" data-v9n-sw aria-haspopup="menu" aria-expanded="${ST.sw}"><span class="v9n-swt"><b>${esc(a)}</b><small>${esc(b)}</small></span><span aria-hidden="true">▾</span></button>`; };
  const progHead = () => `<div class="v9n-ph">${switcher()}${ST.sw ? swMenu() : ""}<div class="v9n-pf num">${esc(cur().code)}</div></div>`;
  const progMenu = () => PG.map(([g, its]) => {
    const open = !g || ST.open.has(g);
    const head = g ? `<button type="button" class="v9n-g" data-v9n-g="${esc(g)}" aria-expanded="${open}">${esc(g)}<span aria-hidden="true">${open ? "▾" : "›"}</span></button>` : "";
    return head + (open ? its.map(([k, l, c]) => it("p:" + k, l, c)).join("") : "");
  }).join("");
  const progBlock = () => progHead() + progMenu();

  const nestedSide = () => {
    const order = ST.v1 === "last" ? ["home", "my-work", "review", "products", "library", "agents", "settings", "programs"] : WS.map(([k]) => k);
    return order.map((k) => {
      const [, l, c] = wItem(k);
      if (k !== "programs") return it("w:" + k, l, c);
      return (ST.v1 === "last" ? '<div class="v9n-sep" aria-hidden="true"></div>' : "") + it("w:programs", l, c, inProg() ? "parent" : "") + (inProg() ? `<div class="v9n-nest">${progBlock()}</div>` : "");
    }).join("");
  };
  const drillSide = () => {
    if (ST.level === "program" && ST.hasProg) return `<button type="button" class="v9n-it v9n-back" data-v9n-level="workspace"><span class="v9n-l">‹ Workspace</span></button>${progBlock()}`;
    return WS.map(([k, l, c]) => it("w:" + k, l, c) + (k === "programs" && ST.hasProg
      ? `<button type="button" class="v9n-it v9n-sub" data-v9n-level="program"><span class="v9n-l">${esc(split(cur().name)[0])}</span><span class="v9n-c" aria-hidden="true">›</span></button>` : "")).join("");
  };
  const railBtn = (k, cls = "") => {
    const [, l, c] = wItem(k), on = ST.route === "w:" + k || (k === "programs" && inProg());
    return `<button type="button" class="v9n-ri${on ? " on" : ""}${cls}" data-v9n-to="w:${k}"${ST.route === "w:" + k ? ' aria-current="page"' : ""}><i aria-hidden="true"></i>${esc(SHORT[k] || l)}${c != null ? `<span class="v9n-b num">${fmtc(c)}</span>` : ""}</button>`;
  };
  const topLinks = () => `<nav class="v9n-tl" aria-label="Workspace">${WS.filter(([k]) => k !== "settings").map(([k, l, c]) => it("w:" + k, l, c, k === "programs" && inProg() ? "parent" : "")).join("")}</nav>`;
  const gear = () => `<button type="button" class="v9n-it v9n-gear${ST.route === "w:settings" ? " on" : ""}" data-v9n-to="w:settings" aria-label="Settings"${ST.route === "w:settings" ? ' aria-current="page"' : ""}>⚙</button>`;

  // ——— Pages: grey placeholders under a real title ———
  const W = [92, 78, 85, 64, 88, 70, 81, 58];
  const bars = (n, off = 0) => Array.from({ length: n }, (_, i) => `<span class="v9n-bar" style="width:${W[(i + off) % W.length]}%"></span>`).join("");
  const rows = (n, off = 0) => `<div class="v9n-rows">${Array.from({ length: n }, (_, i) => `<div class="v9n-row"><span class="v9n-bar" style="width:${18 + ((i + off) * 7) % 20}%"></span><span class="v9n-bar" style="width:${26 + ((i + off) * 11) % 24}%"></span><span class="v9n-bar v9n-end" style="width:10%"></span></div>`).join("")}</div>`;
  const tabsStatic = (list) => `<div class="v9n-tabs">${list.map((t, i) => `<span class="v9n-tab${i ? "" : " on"}">${esc(t)}</span>`).join("")}</div>`;
  const wsPage = (k, ph) => {
    const [, l] = wItem(k);
    let body;
    if (k === "programs") body = `<div class="v9n-rows">${PROGS.map((p, i) => `<button type="button" class="v9n-row" data-v9n-prog="${i}" data-v9n-enter><span class="v9n-rn">${esc(p.name)}</span><span class="v9n-rc num">${esc(p.code)}</span></button>`).join("")}<div class="v9n-row v9n-more">${OTHERS} more programs</div></div>`;
    else if (k === "home") body = `<div class="v9n-cards">${PROGS.slice(0, ph ? 2 : 3).map((p, i) => `<button type="button" class="v9n-card" data-v9n-prog="${i}" data-v9n-enter><b>${esc(split(p.name)[0])}</b>${bars(2, i)}</button>`).join("")}</div>${rows(4)}`;
    else body = rows(ph ? 6 : 9, k.length);
    return `<h3 class="v9n-h">${esc(l)}</h3>${WS_TABS[k] ? tabsStatic(WS_TABS[k]) : ""}${body}`;
  };
  const recordTop = (x) => {
    const sub = TABG[x.gi].its;
    return `<div class="v9n-rh"><div class="v9n-crumb">Programs</div><div class="v9n-rht">${switcher(" v9n-swr")}<span class="v9n-pf num">${esc(cur().code)}</span>${ST.sw ? swMenu() : ""}</div></div>`
      + `<div class="v9n-tabs" role="tablist" aria-label="${esc(split(cur().name)[0])}">${TABG.map((t, i) => `<button type="button" role="tab" aria-selected="${i === x.gi}" class="v9n-tab${i === x.gi ? " on" : ""}" data-v9n-to="p:${t.its[0][0]}">${esc(t.label)}</button>`).join("")}</div>`
      + (sub.length > 1 ? `<div class="v9n-tabs v9n-sub2">${sub.map(([k, l, c]) => `<button type="button" class="v9n-tab${ST.route === "p:" + k ? " on" : ""}" data-v9n-to="p:${k}"${ST.route === "p:" + k ? ' aria-current="page"' : ""}>${esc(l)}${c != null ? ` <span class="v9n-c num">${fmtc(c)}</span>` : ""}</button>`).join("")}</div>` : "");
  };
  const progPage = (ph) => {
    const x = pItem(key());
    const body = x.k === "overview" ? `<div class="v9n-cards">${[0, 1, 2].slice(0, ph ? 2 : 3).map((i) => `<div class="v9n-card">${bars(3, i)}</div>`).join("")}</div>${rows(4)}` : `<div class="v9n-tool2">${bars(1, x.k.length)}</div>${rows(ph ? 6 : 9, x.k.length)}`;
    if (opt() === "tabs") return recordTop(x) + `<div class="v9n-first">${body}</div>`;
    return `<div class="v9n-crumb">${esc(`Programs › ${split(cur().name)[0]}${x.g ? " › " + x.g : ""}`)}</div><h3 class="v9n-h">${esc(x.l)}</h3>${body}`;
  };

  // ——— Frames ———
  const avail = () => {
    const b = document.getElementById("v9n-box");
    if (b && b.clientWidth) return b.clientWidth - 2;
    const w = window.innerWidth || 1440;
    return Math.max(260, w > 860 ? w - 240 - 82 : w - 34);
  };
  const screen = () => ST.screen || (avail() < 640 ? "phone" : "desktop");
  const zoom = (base) => Math.max(0.1, Math.min(1, avail() / base)).toFixed(4);
  const desk = () => {
    const o = opt(), ip = inProg();
    const top = `<div class="v9n-top"><span class="v9n-logo" aria-hidden="true"></span>${o === "top" ? topLinks() : ""}<span class="v9n-search${o === "top" ? " v9n-s2" : ""}">Search <kbd>⌘K</kbd></span>${o === "top" ? gear() : ""}<span class="v9n-dot" aria-hidden="true"></span><span class="v9n-dot" aria-hidden="true"></span></div>`;
    let cols = "";
    if (o === "nested") cols = `<div class="v9n-side">${nestedSide()}</div>`;
    else if (o === "drill") cols = `<div class="v9n-side">${drillSide()}</div>`;
    else if (o === "rail") cols = `<div class="v9n-rail">${WS.map(([k]) => railBtn(k, k === "settings" ? " v9n-last" : "")).join("")}</div>${ip ? `<div class="v9n-side v9n-pside">${progBlock()}</div>` : ""}`;
    else if (o === "top") cols = ip ? `<div class="v9n-side v9n-pside">${progBlock()}</div>` : "";
    else cols = `<div class="v9n-side">${wsItems(WS, true)}</div>`;
    return `<div class="v9n-scr v9n-d" style="zoom:${zoom(1440)}">${top}<div class="v9n-body">${cols}<div class="v9n-pg">${ip ? progPage(false) : wsPage(key(), false)}</div></div></div>`;
  };
  const drawerBody = (o) => {
    if (o === "nested") return nestedSide();
    if (o === "drill") return drillSide();
    if (o === "rail") return ST.drawer === "more" ? wsItems(WS.slice(4), false) : progBlock();
    if (o === "top") return `<div class="v9n-chips">${wsItems(WS, true)}</div>${inProg() ? progBlock() : ""}`;
    return wsItems(WS, true);
  };
  const phone = () => {
    const o = opt(), ip = inProg();
    const title = ip ? split(cur().name)[0] : wItem(key())[1];
    const burger = o === "rail" && !ip ? "" : `<button type="button" class="v9n-burger" data-v9n-drawer="${o === "rail" ? "prog" : "nav"}" aria-expanded="${!!ST.drawer && ST.drawer !== "more"}" aria-label="${o === "rail" ? "Open the program's menu" : "Open the navigation"}">☰</button>`;
    const bot = o === "rail" ? `<div class="v9n-bot">${WS.slice(0, 4).map(([k]) => railBtn(k)).join("")}<button type="button" class="v9n-ri${ST.drawer === "more" ? " on" : ""}" data-v9n-drawer="more" aria-expanded="${ST.drawer === "more"}"><i aria-hidden="true"></i>More</button></div>` : "";
    const drawer = ST.drawer ? `<button type="button" class="v9n-scrim" data-v9n-drawer="" aria-label="Close the menu"></button><div class="v9n-drw${o === "rail" ? " v9n-drw-r" : ""}">${drawerBody(o)}</div>` : "";
    return `<div class="v9n-scr v9n-p" style="zoom:${zoom(390)}"><div class="v9n-top">${burger}<span class="v9n-ttl">${esc(title)}</span><span class="v9n-dot v9n-ms" aria-hidden="true"></span></div><div class="v9n-pg v9n-ppg">${ip ? progPage(true) : wsPage(key(), true)}</div>${bot}${drawer}</div>`;
  };

  // ——— The page ———
  const th = (parts) => `<span class="v9n-th" aria-hidden="true"><i class="v9n-tt"></i>${parts.map(([x, y, w, hh, c]) => `<i class="${c ? "v9n-t" + c : ""}" style="left:${x}%;top:${y}%;width:${w}%;height:${hh}%"></i>`).join("")}</span>`;
  const draw = () => {
    const o = OPTS[ST.opt], scr = screen();
    const thumbs = `<div class="v9n-opts" role="group" aria-label="Navigation options">${OPTS.map((x, i) => `<button type="button" class="v9n-opt" data-v9n-opt="${i}" aria-pressed="${i === ST.opt}">${th(x.th)}<b>${i + 1} · ${esc(x.name)}</b></button>`).join("")}</div>`;
    const seg = (label, attr, items, val) => `<span class="v9n-seg" role="group" aria-label="${esc(label)}">${items.map(([k, l]) => `<button type="button" data-v9n-${attr}="${k}" aria-pressed="${val === k}">${esc(l)}</button>`).join("")}</span>`;
    const tool = `<div class="v9n-tool">${seg("Screen", "scr", [["desktop", "Desktop · 1440"], ["phone", "Phone · 390"]], scr)}${o.id === "nested" ? seg("Where Programs sits", "v1", [["last", "Programs last"], ["inplace", "Programs in its usual place"]], ST.v1) : ""}<button type="button" class="btn" data-v9n-reset>Start over</button><span class="v9n-hint">Try it in the frame: open Programs, choose a program, switch with ▾, then go to My work.</span></div>`;
    const frame = `<div class="v9n-box" id="v9n-box" role="region" aria-label="Wireframe of option ${ST.opt + 1}: ${esc(o.name)}">${scr === "phone" ? phone() : desk()}</div>`;
    const notes = `<div class="v9n-notes"><div class="v9n-nt"><h4>${ST.opt + 1} · ${esc(o.name)}</h4><p>${esc(o.line)}</p><p><b>Watch for:</b> ${esc(o.watch())}</p></div><dl class="v9n-kv">${o.facts().map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="num">${esc(v)}</dd></div>`).join("")}</dl></div>`;
    const cmp = `<div class="v9n-cmpw"><h4>All five on a 1440 × 900 screen</h4><div class="v9n-cmp"><table><thead><tr><th>Option</th><th>Navigation width in a program</th><th>Elsewhere</th><th>Clicks from a program page to Settings</th><th>A program page's content starts</th><th>On a phone</th></tr></thead><tbody>${CMP.map((r, i) => `<tr${i === ST.opt ? ' class="on"' : ""}><td><button type="button" class="v9n-tlink" data-v9n-opt="${i}">${i + 1} · ${esc(OPTS[i].name)}</button></td><td class="num">${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td><td>${esc(r[4])}</td></tr>`).join("")}</tbody></table></div></div>`;
    return thumbs + tool + frame + notes + cmp;
  };
  const fit = () => {
    const b = document.getElementById("v9n-box"), s = b && b.querySelector(".v9n-scr");
    if (!s) return;
    s.style.zoom = String(Math.max(0.1, Math.min(1, (b.clientWidth - 2) / (s.classList.contains("v9n-p") ? 390 : 1440))));
  };
  const redraw = (focus) => {
    const root = document.getElementById("v9n-root");
    if (!root) return;
    root.innerHTML = draw();
    fit();
    if (focus) { const el = root.querySelector(focus); if (el) el.focus({ preventScroll: true }); }
  };
  const go = (to) => {
    ST.route = to; ST.sw = false; ST.drawer = false;
    if (to.startsWith("p:")) { ST.level = "program"; ST.hasProg = true; const x = pItem(to.slice(2)); if (x.g) ST.open.add(x.g); }
  };

  document.addEventListener("click", (e) => {
    const root = document.getElementById("v9n-root");
    if (!root || !root.contains(e.target)) return;
    const t = e.target.closest("[data-v9n-to],[data-v9n-g],[data-v9n-sw],[data-v9n-prog],[data-v9n-opt],[data-v9n-scr],[data-v9n-v1],[data-v9n-level],[data-v9n-drawer],[data-v9n-reset]");
    if (!t) { if (ST.sw && !e.target.closest(".v9n-menu")) { ST.sw = false; redraw(); } return; }
    e.preventDefault();
    const d = t.dataset;
    let focus = null;
    if (d.v9nOpt !== undefined) { ST.opt = +d.v9nOpt; ST.sw = false; ST.drawer = false; if (inProg()) ST.level = "program"; focus = `.v9n-opt[data-v9n-opt="${ST.opt}"]`; }
    else if (d.v9nScr) { ST.screen = d.v9nScr; ST.drawer = false; ST.sw = false; focus = `[data-v9n-scr="${d.v9nScr}"]`; }
    else if (d.v9nV1) { ST.v1 = d.v9nV1; focus = `[data-v9n-v1="${d.v9nV1}"]`; }
    else if (d.v9nReset !== undefined) { Object.assign(ST, START()); focus = "[data-v9n-reset]"; }
    else if (d.v9nSw !== undefined) { ST.sw = !ST.sw; focus = ST.sw ? '.v9n-menu [aria-checked="true"]' : "[data-v9n-sw]"; }
    else if (d.v9nProg !== undefined) { ST.prog = +d.v9nProg; ST.sw = false; ST.drawer = false; ST.hasProg = true; ST.level = "program"; if (d.v9nEnter !== undefined || !inProg()) go("p:overview"); focus = "[data-v9n-sw]"; }
    else if (d.v9nG) { if (ST.open.has(d.v9nG)) ST.open.delete(d.v9nG); else ST.open.add(d.v9nG); focus = `[data-v9n-g="${d.v9nG}"]`; }
    else if (d.v9nLevel) { ST.level = d.v9nLevel; focus = d.v9nLevel === "workspace" ? '[data-v9n-level="program"]' : '[data-v9n-level="workspace"]'; }
    else if (d.v9nDrawer !== undefined) { const want = d.v9nDrawer || false; ST.drawer = want && ST.drawer !== want ? want : false; ST.sw = false; focus = ST.drawer ? ".v9n-drw button" : (want === "more" ? '[data-v9n-drawer="more"]' : ".v9n-burger"); }
    else if (d.v9nTo) { go(d.v9nTo); focus = `.v9n-scr [data-v9n-to="${d.v9nTo}"]`; }
    redraw(focus);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !document.getElementById("v9n-root") || !(ST.sw || ST.drawer)) return;
    e.stopPropagation(); e.preventDefault();
    const back = ST.sw ? "[data-v9n-sw]" : ST.drawer === "more" ? '[data-v9n-drawer="more"]' : ".v9n-burger";
    ST.sw = false; ST.drawer = false;
    redraw(back);
  }, true);
  window.addEventListener("resize", () => {
    const root = document.getElementById("v9n-root");
    if (!root) return;
    const shown = root.querySelector(".v9n-p") ? "phone" : "desktop";
    if (!ST.screen && screen() !== shown) redraw(); else fit();
  });

  S["nav-options"] = () => {
    setTimeout(fit, 0);
    return page(
      header("Navigation options", `<span>5 wireframes</span><span>Only the navigation is drawn</span><span>Colour marks the program's menu</span>`, ""),
      `<div class="v9n" id="v9n-root">${draw()}</div>`,
    );
  };
})();
