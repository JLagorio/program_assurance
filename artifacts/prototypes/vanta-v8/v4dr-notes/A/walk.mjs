// Lane A's walk: node walk.mjs <build>. Opens every route of lane A with V3 on at 1440x900 and 390x844; fails on a console error,
// a page wider than the window, or a table cell taller than one line; clicks every button and link once and fails on one that
// does nothing; then runs the four scripted checks of A.md.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2];
console.log("build", build);
const CODE = "AC-17(4)", TABS = ["", "--requirements", "--evidence", "--assessment", "--findings", "--risks", "--history"];
const b = await chromium.launch();
const fails = [], errs = [], outside = new Set();
let clicked = 0, routesSeen = 0, cells = 0;
const page = async (w, h) => {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  // An error counts while one of lane A's pages is open; a link that leaves them (See current, Back to the Drata tab) lands on
  // another lane's page, whose errors are that lane's.
  const mine = () => /#dr-control/.test(p.url());
  p.on("pageerror", (e) => { if (mine()) errs.push(`${w}: ${e.message}`); else outside.add(p.url().split("#")[1] || ""); });
  p.on("console", (m) => { if (m.type() !== "error") return; if (mine()) errs.push(`${w} ${p.url().split("#")[1]}: ${m.text()}`); else outside.add(p.url().split("#")[1] || ""); });
  await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
  await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
  return p;
};
const go = async (p, r) => { await p.evaluate((r) => { if (PA.v3k.close) try { PA.v3k.close(); } catch (e) { /* none open */ } const c = document.getElementById("closePanel"); if (c && document.body.classList.contains("panel-open")) c.click(); if (location.hash.slice(1) === r) PA.v3k.redraw(); else location.hash = r; }, r); await p.waitForTimeout(420); };
const sig = (p) => p.evaluate(() => { const s = location.hash + "|" + document.body.innerHTML; let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h + ":" + s.length; });

// ——— Routes at both widths ———
const p0 = await page(1440, 900);
const outCode = await p0.evaluate(() => (PA.dra.rows().find((r) => r.out && r.out.layer) || {}).code);
const ROUTES = ["dr-controls"].concat(TABS.map((t) => `dr-control--${CODE}${t}`), ["dr-control--AC-2", `dr-control--${outCode}`, "dr-control--AU-14", "dr-control--AU-14--assessment", "dr-control--AU-14--evidence", "dr-control--AC-2(3)"]);
await p0.close();
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await page(w, h);
  for (const r of ROUTES) {
    await go(p, r); routesSeen++;
    const res = await p.evaluate(() => {
      const out = { wide: document.documentElement.scrollWidth > window.innerWidth + 1 ? document.documentElement.scrollWidth : 0, tall: [], n: 0, title: (document.querySelector("#main h1") || {}).textContent || "" };
      for (const td of document.querySelectorAll("#main table td")) { out.n++; if (td.closest(".k3-cw") || td.classList.contains("k3-cw")) continue; const hgt = td.getBoundingClientRect().height; if (hgt > 54) out.tall.push(`${Math.round(hgt)}px: ${td.textContent.trim().slice(0, 50)}`); }
      return out;
    });
    cells += res.n;
    if (!res.title) fails.push(`${w} ${r}: no h1`);
    if (res.wide) fails.push(`${w} ${r}: page ${res.wide}px wide`);
    if (res.tall.length) fails.push(`${w} ${r}: ${res.tall.length} cells taller than one line, e.g. ${res.tall[0]}`);
  }
  await p.close();
}

// ——— Every button and link once (1440) ———
let p = await page(1440, 900);
const LIST = `(() => { const main = document.getElementById("main"); const seen = new Set(), out = [];
  const add = (el) => { if (seen.has(el)) return; if (el.getAttribute("aria-disabled") === "true" || el.disabled) return; if (el.getAttribute("aria-current") === "page" || el.getAttribute("aria-checked") === "true") return; /* the current tab and the current view are where the reader already is */ if (el.closest(".drk-review")) { if (!el.matches("a[href]")) return; } seen.add(el); out.push(el); };
  main.querySelectorAll("button, a[href], summary, [data-go]:not(tr), [data-k3]:not(tr)").forEach((el) => { if (el.matches("input, select, label")) return; if (el.closest("tbody tr") && el.closest("tbody tr") !== el.closest("tbody").querySelector("tr")) return; add(el); });
  main.querySelectorAll("tbody").forEach((tb) => { const r = tb.querySelector("tr[data-go], tr[data-panel], tr[data-k3]"); if (r) add(r); });
  return out; })()`;
for (const r of ROUTES) {
  await go(p, r);
  const n = await p.evaluate((L) => eval(L).length, LIST);
  for (let i = 0; i < n; i++) {
    await go(p, r);
    const label = await p.evaluate(([L, i]) => { const el = eval(L)[i]; return el ? (el.getAttribute("aria-label") || el.textContent || el.getAttribute("href") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40) : null; }, [LIST, i]);
    if (label == null) continue;
    const before = await sig(p);
    await p.evaluate(([L, i]) => { const el = eval(L)[i]; if (el) el.click(); }, [LIST, i]);
    await p.waitForTimeout(260);
    const after = await sig(p); clicked++;
    if (before === after) fails.push(`${r}: "${label}" does nothing`);
    await p.evaluate(() => { try { PA.v3k.close(); } catch (e) { /* none */ } });
  }
}

// ——— The scripted checks, on a fresh session ———
await p.close();
p = await page(1440, 900);
const step = async (name, fn) => { try { const r = await fn(); if (r !== true) fails.push(`${name}: ${r}`); else console.log("ok", name); } catch (e) { fails.push(`${name}: ${e.message}`); } };
await go(p, "dr-controls");
await step("B4: the default view folds Rationale, and Owner while no control has one", async () => {
  const r = await p.evaluate(() => ({ th: [...document.querySelectorAll("#main .k3-table th")].map((t) => t.textContent), line: (document.querySelector(".dra-ownl") || {}).textContent || "" }));
  if (r.th.includes("Rationale")) return "Rationale drawn with no tailored-out control listed";
  if (r.th.includes("Owner")) return "Owner drawn though every value is No owner";
  return /No owner on any of/.test(r.line) || `no owner line: ${r.line}`;
});
await step("choose three rows, then Select all", async () => {
  await p.evaluate(() => { [...document.querySelectorAll("input[data-dra-sel]")].slice(0, 3).forEach((x) => x.click()); });
  await p.waitForTimeout(150);
  const n3 = await p.evaluate(() => (document.querySelector(".drk-sel-n b") || {}).textContent);
  if (n3 !== "3") return `selection bar shows ${n3}`;
  await p.evaluate(() => { const b = [...document.querySelectorAll(".drk-sel-b")].find((x) => /Select all/.test(x.textContent)); b.click(); });
  await p.waitForTimeout(150);
  const all = await p.evaluate(() => [(document.querySelector(".drk-sel-n b") || {}).textContent, PA.dra.count()]);
  if (+all[0].replace(/,/g, "") !== all[1]) return `Select all chose ${all[0]} of ${all[1]}`;
  await p.evaluate(() => { const b = [...document.querySelectorAll(".drk-sel-b, .drk-sel button")].find((x) => /Clear/.test(x.textContent)); b.click(); }); await p.waitForTimeout(150);
  return (await p.evaluate(() => !document.querySelector(".drk-sel"))) || "Clear left the bar";
});
await step("mark two controls out of scope; they stay listed with the reason", async () => {
  const codes = await p.evaluate(() => { const xs = [...document.querySelectorAll("input[data-dra-sel]")].slice(3, 5); xs.forEach((x) => x.click()); return xs.map((x) => x.getAttribute("data-dra-sel")); });
  await p.waitForTimeout(150);
  await p.evaluate(() => { [...document.querySelectorAll(".drk-sel-b")].find((x) => /Mark out of scope/.test(x.textContent)).click(); }); await p.waitForTimeout(250);
  await p.fill("#modal textarea", "Mission system has no remote path for this; covered by the host's tailoring decision of Nov 2026.");
  await p.click("#modal [data-k3-submit]"); await p.waitForTimeout(400);
  await p.evaluate(() => { const r = document.querySelector('[data-drk-key="scope"][value="out"]'); r.click(); }); await p.waitForTimeout(400);
  const hasWhy = await p.evaluate(() => [...document.querySelectorAll("#main .k3-table th")].some((t) => t.textContent === "Rationale"));
  if (!hasWhy) return "Scope › Out of scope shows no Rationale column";
  const res = await p.evaluate((codes) => codes.map((c) => { const x = document.querySelector(`input[data-dra-sel="${CSS.escape(c)}"]`); const tr = x && x.closest("tr"); return tr ? [tr.classList.contains("dra-out"), /Mission system has no remote path/.test(tr.textContent)] : null; }), codes);
  return res.every((x) => x && x[0] && x[1]) || `rows after marking: ${JSON.stringify(res)}`;
});
await go(p, `dr-control--${CODE}`);
await step("Compare: apply the statement, and the statement changes", async () => {
  const before = await p.evaluate(() => { const r = [...document.querySelectorAll("#main tbody tr")].find((tr) => /Changed from library/.test(tr.textContent)); return r ? r.querySelector(".dra-line").textContent : null; });
  if (!before) return "no row reads Changed from library";
  await p.evaluate(() => { [...document.querySelectorAll("#main button")].find((x) => x.textContent.trim() === "Compare").click(); }); await p.waitForTimeout(300);
  await p.click('#modal [data-drk-cmp="apply"][data-i="0"]'); await p.waitForTimeout(150);
  await p.click("#modal [data-k3-submit]"); await p.waitForTimeout(400);
  const after = await p.evaluate(() => { const r = [...document.querySelectorAll("tbody tr")].find((tr) => /Mission Computer/.test(tr.textContent)); return r ? r.querySelector(".dra-line").textContent : null; });
  return (after && after !== before) || `statement unchanged: ${after}`;
});
await step("Send to reviewers moves the stage", async () => {
  const s0 = await p.evaluate(() => (document.querySelector(".dra-stg li.dra-now") || {}).textContent);
  await p.evaluate(() => { [...document.querySelectorAll("#main button")].find((x) => x.textContent.trim() === "Send to reviewers").click(); }); await p.waitForTimeout(350);
  const s1 = await p.evaluate(() => (document.querySelector(".dra-stg li.dra-now") || {}).textContent);
  return (s0 !== s1 && /Needs approval/.test(s1)) || `stage ${s0} → ${s1}`;
});
await go(p, `dr-control--${CODE}--requirements`);
await step("map a suggestion, then undo it", async () => {
  const n0 = await p.evaluate(() => document.querySelectorAll(".k3-sec tbody tr").length);
  await p.evaluate(() => { [...document.querySelectorAll(".drk-sug button")].find((x) => x.textContent.trim() === "Map").click(); }); await p.waitForTimeout(350);
  const n1 = await p.evaluate(() => document.querySelectorAll(".k3-sec tbody tr").length);
  if (n1 !== n0 + 1) return `rows ${n0} → ${n1} after Map`;
  await p.evaluate(() => { [...document.querySelectorAll(".dra-sgdone button, .dra-sgdone .k3-link")].find((x) => /Undo/.test(x.textContent)).click(); }); await p.waitForTimeout(350);
  const n2 = await p.evaluate(() => document.querySelectorAll(".k3-sec tbody tr").length);
  return n2 === n0 || `rows ${n1} → ${n2} after Undo`;
});

// ——— Version 24, on a fresh session (the checks above leave controls out of scope and the Scope filter on) ———
await p.close();
p = await page(1440, 900);
const rowsText = () => p.evaluate(() => [...document.querySelectorAll("#main .k3-table tbody tr")].map((tr) => tr.textContent.replace(/\s+/g, " ")));
await go(p, "dr-controls");
await step("v24: the Judged in part facet lists AU-14 at 3/5", async () => {
  await p.click('input[data-drk-key="jd"][value="part"]'); await p.waitForTimeout(400);
  const rows = await rowsText();
  await p.click('input[data-drk-key="jd"][value=""]'); await p.waitForTimeout(300);
  return (rows.length === 1 && /AU-14/.test(rows[0]) && /3\/5/.test(rows[0])) || `rows: ${JSON.stringify(rows)}`;
});
await step("v24: the Parameters set facet lists AC-2(3) and SA-24", async () => {
  await p.click('input[data-drk-key="pm"][value="set"]'); await p.waitForTimeout(400);
  const rows = await rowsText();
  await p.click('input[data-drk-key="pm"][value=""]'); await p.waitForTimeout(300);
  return (rows.length === 2 && rows.some((r) => /AC-2\(3\)/.test(r)) && rows.some((r) => /SA-24/.test(r))) || `rows: ${JSON.stringify(rows)}`;
});
await go(p, "dr-control--AU-14");
await step("v24: AU-14 reads 3 of 5 judged with 2 to plan; planning moves them into the campaign", async () => {
  const well = () => p.evaluate(() => ({ card: (document.querySelector("#main .drk-sunken") || {}).textContent || "", pri: [...document.querySelectorAll("#main .btn.ink")].map((x) => x.textContent).join("|") }));
  const s0 = await well();
  if (!/3 of 5 objectives judged/.test(s0.card) || !/Not judged, to plan\s*2/.test(s0.card)) return `card: ${s0.card.slice(0, 300)}`;
  if (!/Plan the 2 left/.test(s0.pri)) return `primary: ${s0.pri}`;
  await p.evaluate(() => [...document.querySelectorAll("#main .btn.ink")].find((x) => /Plan the 2 left/.test(x.textContent)).click()); await p.waitForTimeout(300);
  await p.click("#modal [data-k3-submit]"); await p.waitForTimeout(400);
  const s1 = await well();
  if (!/Planned in/.test(s1.card) || !/Open assessment campaign/.test(s1.pri)) return `after planning: ${s1.pri} · ${s1.card.slice(0, 200)}`;
  await go(p, "dr-control--AU-14--assessment");
  const w = await p.evaluate(() => [...document.querySelectorAll("#main .k3-table tbody tr")].map((tr) => tr.lastElementChild.textContent.trim()));
  return (w.filter((x) => x === "Satisfied").length === 3 && w.filter((x) => x === "Planned").length === 2) || `objectives: ${w.join(",")}`;
});
await go(p, "dr-control--AC-2(3)");
await step("v24: Compare on AC-2(3) shows Parameters beside the other two, and Use template writes it", async () => {
  await p.evaluate(() => { [...document.querySelectorAll(".dra-impl button")].find((x) => x.textContent.trim() === "Compare").click(); }); await p.waitForTimeout(350);
  const f = await p.evaluate(() => [...document.querySelectorAll("#modal tbody tr")].map((tr) => tr.firstElementChild.textContent.trim() + "=" + (tr.children[1] || {}).textContent));
  if (f.length !== 3 || !/^Parameters=72 hours; 90 days/.test(f[2] || "")) return `fields: ${JSON.stringify(f)}`;
  await p.click('#modal [data-drk-cmp="apply"][data-i="2"]'); await p.waitForTimeout(150);
  await p.click("#modal [data-k3-submit]"); await p.waitForTimeout(400);
  const k = await p.evaluate(() => JSON.stringify(PA.v3k.get("dr.A.cmp", {})));
  return /time period \(disable accounts within\)/.test(k) || `stored: ${k}`;
});
await go(p, "dr-control--AU-14--evidence");
await step("v24: the control's evidence is lane B's; Link evidence writes through PA.drB and the evidence record shows it", async () => {
  if (!(await p.evaluate(() => !!PA.drB))) return "PA.drB is not in this build";
  const cnt = () => p.evaluate(() => [document.querySelectorAll("#main .k3-table tbody tr").length, PA.drB.linksFor("AU-14").length]);
  const n0 = await cnt();
  if (n0[0] !== n0[1]) return `rows ${n0[0]} but PA.drB.linksFor gives ${n0[1]}`;
  await p.evaluate(() => [...document.querySelectorAll("#main button")].find((x) => /Link evidence/.test(x.textContent)).click()); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector("#modal .k3-pick-i:not(.held) input").click()); await p.waitForTimeout(150);
  await p.click("#modal [data-k3-submit]"); await p.waitForTimeout(450);
  await p.evaluate(() => { const m = document.querySelector("#modal [data-k3-close]"); if (m && !document.getElementById("modal").hidden) m.click(); }); await p.waitForTimeout(200);
  const n1 = await cnt();
  if (n1[0] !== n0[0] + 1 || n1[1] !== n0[1] + 1) return `after Link: rows ${n0[0]} → ${n1[0]}, links ${n0[1]} → ${n1[1]}`;
  const added = await p.evaluate(() => { const was = new Set(); return PA.drB.linksFor("AU-14").map((x) => x.route); });
  let shown = false;
  for (const r of added) { await go(p, r); if (await p.evaluate(() => /AU-14/.test(document.getElementById("main").textContent))) { shown = true; } else { shown = false; break; } }
  if (!shown) return "an evidence record linked to AU-14 does not list it";
  await go(p, "dr-control--AU-14--evidence");
  await p.evaluate(() => [...[...document.querySelectorAll("#main tbody tr")].pop().querySelectorAll("button")].find((x) => x.textContent.trim() === "Unlink").click()); await p.waitForTimeout(400);
  const n2 = await cnt();
  return (n2[1] === n1[1] - 1 && n2[0] === n1[0] - 1) || `after Unlink: rows ${n2[0]}, links ${n1[1]} → ${n2[1]}`;
});
await step("v24: the evidence drawer walks the control's list (lane A calls no D.walkable)", async () => {
  await go(p, "dr-control--AC-2--evidence");
  const eyes = await p.$$("#main [data-panel=drb-ev]");
  if (eyes.length < 2) return `only ${eyes.length} eyes`;
  await eyes[0].click({ force: true }); await p.waitForTimeout(350);
  const a = await p.evaluate(() => (document.querySelector("#panel .drk-dw-pos") || {}).textContent || "");
  await p.click("#panel .drk-dw-b[data-drk-key=down]"); await p.waitForTimeout(350);
  const c = await p.evaluate(() => (document.querySelector("#panel .drk-dw-pos") || {}).textContent || "");
  await p.evaluate(() => document.getElementById("closePanel").click());
  return (a === `1 of ${eyes.length}` && c === `2 of ${eyes.length}`) || `walk ${a} → ${c}`;
});
await p.close(); await b.close();
for (const e of errs) fails.push("console: " + e);
if (outside.size) console.log(`errors on pages outside lane A (not counted): ${[...outside].join(", ")}`);
console.log(`routes ${routesSeen} (2 widths) · cells ${cells} · clicked ${clicked} · failures ${fails.length}`);
fails.slice(0, 40).forEach((f) => console.log("FAIL", f));
process.exit(fails.length ? 1 : 0);
