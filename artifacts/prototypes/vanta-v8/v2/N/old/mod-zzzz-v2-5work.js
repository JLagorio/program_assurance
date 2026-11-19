// mod-zzzz-v2-5work (v2-set-): prototype v2, agent L1. Loads after the canon layer and before the visual layer (mod-zzzz-v2-9clean).
// Settings [A7; settings budget]: the six Settings pages (Deadlines, Notifications, Event log, Enclaves & markings, Common control
// providers, Roles & permissions) and their sub-routes are drawn inside one frame: the page's own title and actions on top, then a
// left list of sections, grouped Workspace and My account as Vanta's settings are, beside the page's cards, lists and rules.
// The area tab strip the core router inserts is hidden on these pages by CSS (.main:has(> .v2-set) > .sectabs), not by core.js.
// Every link, data-go, data-panel, data-modal and id of the pages is kept: the frame only moves their markup into its right column.
(() => {
  const PA = window.PA;
  if (!PA || !PA.S || !PA.h) return;
  const { S, h } = PA;
  const { esc } = h;
  const GROUPS = [
    ["Workspace", [
      ["deadlines", "Deadlines", /^deadlines(-(vuln|stig|findings|other))?$/],
      ["notifications-workspace", "Notifications", /^notifications-workspace$/],
      ["permissions", "Roles & permissions", /^permissions(-(matrix|members|changes))?$/],
      ["enclaves", "Enclaves & markings", /^enclaves$/],
      ["common-controls", "Common control providers", /^common-controls$/],
      ["event-log", "Event log", /^event-log(-(reviews|imports|decisions|system))?$/],
    ]],
    ["My account", [["notifications", "Notifications", /^notifications$/]]],
  ];
  const ITEMS = GROUPS.flatMap(([, items]) => items);
  const mine = (r) => ITEMS.some(([, , re]) => re.test(r));
  const nav = (r) => `<nav class="v2-set-nav" aria-label="Settings sections">${GROUPS.map(([g, items]) => `<div class="v2-set-g">${esc(g)}</div>${items.map(([k, l, re]) => {
    const on = re.test(r);
    return `<a class="v2-set-i${on ? " on" : ""}" href="#${k}"${on ? ' aria-current="page"' : ""}>${esc(l)}</a>`;
  }).join("")}`).join("")}</nav>`;
  // The page's head stays on top; everything after it moves into the right column beside the list of sections.
  function frame(html, r) {
    if (typeof html !== "string" || html.includes('class="v2-set"')) return html;
    const t = document.createElement("template");
    t.innerHTML = html;
    const root = t.content.firstElementChild;
    if (!root || !root.classList.contains("main")) return html;
    const first = root.firstElementChild;
    const head = first && first.matches(".ak-ih, .ph, .ak-rh") ? first : null;
    const body = document.createElement("div");
    body.className = "v2-set-body";
    [...root.childNodes].forEach((n) => { if (n !== head) body.appendChild(n); });
    const grid = document.createElement("div");
    grid.className = "v2-set";
    grid.innerHTML = nav(r);
    grid.appendChild(body);
    root.appendChild(grid);
    root.classList.add("v2-setp");
    return t.innerHTML;
  }
  for (const r of Object.keys(S)) {
    if (!mine(r)) continue;
    const f = S[r];
    S[r] = () => frame(f(), r);
    S[r].__canon = true;
    if (f.__from) S[r].__from = f.__from;
  }
  PA.v2settings = { GROUPS, frame };
})();
