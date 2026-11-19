// Write notes.json: what the visual layer changed on each screen the Before & after page shows (nav destinations and the records),
// counted from one draw of each screen and each preview it opens. node notes.mjs <build.html> <notes.json>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const fs = await import("fs");
const [, , build, out] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("file://" + build + "#home"); await p.waitForTimeout(300);
const RECORDS = ["campaign", "stigs-mission-computer-rhel9", "frameworks-high", "data-calls-fisma", "component-mc", "policy-page-ac-1", "control-si2", "evidence-page-e1", "check-scan", "person-joel-barrantes", "integration-emass", "ssp", "plan-cp", "policy-editor"];
const routes = await p.evaluate((rec) => [...new Set([...window.PA.navItems().map(([k]) => k), ...rec])].filter((k) => window.PA.S[k] && !/^(before-after|nav-options|study)/.test(k)), RECORDS);
const per = {};
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(40);
  per[r] = await p.evaluate((r) => {
    const PA = window.PA;
    const preticked = (PA.v2clean.stats[r] && PA.v2clean.stats[r].preticked) || 0;
    PA.v2clean.reset();
    const html = PA.S[r]();
    const screen = JSON.parse(JSON.stringify(PA.v2clean.stats[r] || {}));
    const t = document.createElement("template"); t.innerHTML = html;
    const kinds = new Map();
    t.content.querySelectorAll("[data-panel]").forEach((el) => { const k = el.dataset.panel; if (k && !kinds.has(k)) kinds.set(k, el.dataset.id || ""); });
    const dlg = new Map();
    t.content.querySelectorAll("[data-modal]").forEach((el) => { const k = el.dataset.modal; if (k && !dlg.has(k)) dlg.set(k, el.dataset.id || ""); });
    PA.v2clean.reset();
    for (const [k, id] of kinds) { try { PA.P[k] && PA.P[k](id); } catch (e) {} }
    for (const [k, id] of dlg) { try { PA.M[k] && PA.M[k](id); } catch (e) {} }
    const sub = {};
    for (const [key, v] of Object.entries(PA.v2clean.stats)) { const m = key.match(/ · (preview|dialog): (.+)$/); if (m) sub[m[1] + ": " + m[2]] = v; }
    return { screen, sub, kinds: kinds.size, preticked };
  }, r);
}
const pre = Object.fromEntries(routes.map((r) => [r, per[r].preticked]));
const TEXT = {
  status: [["N02", "N06"], (n) => `Status pills follow one map: ${n} hand-drawn pill${n > 1 ? "s" : ""} retoned (neutral and waiting words grey, never blue or amber).`],
  empty: [["N03", "A5"], (n) => `Empty values print a subtle —: ${n} dashed ring${n > 1 ? "s" : ""} and words (No owner, Not set, None…) gone.`],
  banner: [["N01", "A4"], (n) => `${n} banner${n > 1 ? "s" : ""} removed: a register drops one whose count a quick view or tab already says; elsewhere one stays.`],
  "banner-grey": [["N01", "A4"], () => `The one banner left is a grey callout; its glyph alone carries the tone.`],
  "banner-line": [["N01", "A4"], () => `The register's notice is one quiet grey line under the title, no tinted box; its action is a link.`],
  facts: [["A3"], () => `Count line under the register's title dropped; counts stay on tabs, chips and quick views.`],
  columns: [["A5", "N04"], (n) => `${n} column${n > 1 ? "s" : ""} that read the same in every row cut, so the table fits its frame.`],
  toned: [["N05"], (n) => `At most two toned cells a row: ${n} extra coloured cell${n > 1 ? "s" : ""} set in ink.`],
  gadgets: [["N08"], (n) => `${n} bar${n > 1 ? "s" : ""}, ring${n > 1 ? "s" : ""} or donut${n > 1 ? "s" : ""} removed from rows; the number beside each stays.`],
  toolbar: [["N13"], (n) => `Toolbar keeps five quick views and four filters on one line; ${n} more fold under a More chip.`],
  tabs: [["N12", "N18"], (n) => `Tab strip keeps seven slots: ${n} tab${n > 1 ? "s" : ""} fold under More.`],
  "tabs-strip": [["N12"], () => `The section's tab strip no longer stacks above the record's own tabs.`],
  ink: [["N07"], (n) => `${n} change count${n > 1 ? "s" : ""} or plain sentence${n > 1 ? "s" : ""} set in ink instead of red or green.`],
  "panel-primary": [["A18", "N15"], () => `The preview's action is an outlined button, not an ink primary; a repeated action is dropped.`],
  type: [["N10"], (n) => `${n} inline font size${n > 1 ? "s" : ""} snapped to the 12 / 14 / 16 / 20 / 28 scale.`],
  "in-the-app": [["A21"], (n) => `The repeated "In the app" tag is gone from ${n} connector cards.`],
};
const notes = [];
const push = (route, rule, n, where) => {
  const t = TEXT[rule]; if (!t || !n) return;
  const e = { route, finding: t[0][0], text: t[1](n) };
  if (t[0][1]) e.also = t[0].slice(1);
  if (where) e.where = where;
  e.count = n;
  notes.push(e);
};
// Status pills: counted against v1 (inventory of every pill word by route, SP/vanta/v2/V/status-changes.json).
const SC = JSON.parse(fs.readFileSync(new URL("../status-changes.json", import.meta.url)));
const MAP = JSON.parse(fs.readFileSync(new URL("../status-map.json", import.meta.url))).words;
const norm = (t) => t.replace(/\s+/g, " ").trim().toLowerCase().replace(/\d+(?:[.,]\d+)?/g, "n");
for (const r of routes) {
  const { screen, sub } = per[r];
  const sc = SC[r];
  if (sc && sc.n) {
    const ws = sc.words.slice(0, 3).map((w) => `${w} ${(MAP[norm(w)] || {}).tone || "grey"}`).join(", ");
    notes.push({ route: r, finding: "N02", also: ["N06"], text: `One tone per status word: ${sc.n} pill${sc.n > 1 ? "s" : ""} retoned (${ws}); blue is never a status.`, count: sc.n });
  }
  for (const [rule, n] of Object.entries(screen)) if (rule !== "preticked" && rule !== "status") push(r, rule, n);
  if (pre[r]) notes.push({ route: r, finding: "A2", also: ["B8"], text: "Opens with nothing ticked: the filter row shows; the selection bar appears only after the reader ticks a row.", count: pre[r] });
  for (const [where, st] of Object.entries(sub)) for (const [rule, n] of Object.entries(st)) push(r, rule, n, where);
}
// What the stylesheet does everywhere (no markup change, so not counted per screen).
const glob = [
  { route: "overview", finding: "A8", text: "The rail marks the current place ink on grey, like the program menu; the program switcher is a neutral bordered button." },
  { route: "overview", finding: "A9", text: "Program menu children are text without icons; every group but the current page's is folded, and any can be opened." },
  { route: "portfolio", finding: "N17", text: "Avatars are initials on grey (1,142 blue avatars in v1 across 22 pages); blue stays for links and selection." },
  { route: "itcsc", finding: "N06", text: "EXAMPLE is a grey outlined tag (34 on this page, 973 across v1), and a small grey dot inside column headers." },
  { route: "controls", finding: "N10", text: "One type scale: 12 secondary, 14 body, 16 card and section titles, 22 page titles; no half pixels, nothing grows; tables no longer fall back to 16px." },
  { route: "component-mc", finding: "N18", text: "No section label before the section's tabs; the rail already names the section." },
  { route: "evidence", finding: "A5", text: "Tables fit their frame at 1440: headers may wrap, and a table still too wide lets its cells wrap (A5's seven tables now fit)." },
  { route: "controls", finding: "N02", text: "One tone per status word everywhere (241 words, status-map.json): Not assessed, In progress, Draft, Ready and Planned are grey; blue is never a status." },
];
notes.push(...glob);
fs.writeFileSync(out, JSON.stringify(notes, null, 1));
console.log("notes", notes.length, "routes", routes.length, "errors", errs.length);
await b.close();
