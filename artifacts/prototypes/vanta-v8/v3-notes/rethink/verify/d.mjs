// Driver: node d.mjs <cmd> <cmd> ...   Each run starts fresh at #overview with V3 on.
// cmds:
//   nav:<text>            click a program menu entry (exact text, case-insensitive)
//   c:<regex>             click first visible match in #main        (cN:<regex> picks the Nth match: c2:...)
//   p:<regex>             click in #panel        m:<regex> click in modal      a:<regex> anywhere
//   t[:sel[:max]]         print text of selector (default #main, 1500)
//   b[:sel]               print clickables (buttons, links, tabs, data-go/panel/modal) in selector
//   in[:sel]              print inputs/selects/textareas/contenteditable in selector
//   f:<css>:<value>       fill input matched by css
//   sel:<css>:<label>     select option by label
//   k:<Key>               press key
//   type:<text>           keyboard type
//   s:<name>              screenshot
//   back                  history back
//   h                     print state
//   x:<js>                evaluate js, print result
//   w:<ms>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const build = SP + "/vanta/proto/out/prototype-v3r2.html", out = SP + "/vanta/v3r/verify";
const b = await chromium.launch();
const VW = Number(process.env.VW || 1440), VH = Number(process.env.VH || 900);
const page = await b.newPage({ viewport: { width: VW, height: VH }, hasTouch: VW < 600 });
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
page.on("dialog", async (d) => { console.log("  [native dialog]", d.type(), d.message().slice(0, 200)); await d.accept().catch(() => {}); });
await page.goto("file://" + build + "#overview"); await page.waitForTimeout(700);
await page.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await page.waitForTimeout(450);
await page.evaluate(() => { location.hash = "overview"; }); await page.waitForTimeout(450);
let clicks = 0;
const state = () => page.evaluate(() => {
  const vis = (e) => e && e.offsetParent !== null && getComputedStyle(e).visibility !== "hidden";
  const panel = document.querySelector("#panel");
  const modal = document.querySelector("#modal");
  const pOpen = panel && vis(panel) && panel.innerText.trim().length > 0 && panel.getBoundingClientRect().width > 50;
  const mOpen = modal && vis(modal) && modal.innerText.trim().length > 0;
  const toast = [...document.querySelectorAll("[class*=toast],[role=status],[aria-live]")].filter(vis).map((e) => e.innerText.trim()).filter(Boolean).join(" / ").slice(0, 200);
  const h1 = [...document.querySelectorAll("#main h1")].filter(vis).map((e) => e.innerText.trim().replace(/\s+/g, " ")).join(" | ");
  const crumbs = (document.querySelector("#main .crumbs, #main nav[aria-label*=read i], #main [class*=crumb]") || {}).innerText;
  return { hash: location.hash, h1, crumbs: crumbs ? crumbs.replace(/\s+/g, " ").slice(0, 120) : undefined,
    panel: pOpen ? panel.innerText.trim().replace(/\s+/g, " ").slice(0, 90) : undefined,
    modal: mOpen ? modal.innerText.trim().replace(/\s+/g, " ").slice(0, 90) : undefined, toast: toast || undefined,
    scrollY: Math.round((document.querySelector("#main") || {}).scrollTop || 0) + "/" + Math.round(window.scrollY) };
});
const SCOPE = { c: "#main", p: "#panel", m: "#modal", a: "body", nav: "#nav" };
async function click(scope, rx, nth, exact) {
  const h = await page.evaluateHandle(([scope, rx, nth, exact]) => {
    const root = document.querySelector(scope); if (!root) return null;
    const re = new RegExp(rx, "i");
    const vis = (e) => { const r = e.getBoundingClientRect(); return e.offsetParent !== null && r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
    const own = (e) => (e.innerText || e.textContent || "").trim().replace(/\s+/g, " ");
    const lab = (e) => [own(e), e.getAttribute("aria-label") || "", e.getAttribute("title") || ""];
    let els = [...root.querySelectorAll("*")].filter((e) => vis(e) && lab(e).some((t) => t && (exact ? t.toLowerCase() === rx.toLowerCase() : re.test(t))));
    // keep the deepest matches (no matching descendant)
    els = els.filter((e) => !els.some((o) => o !== e && e.contains(o)));
    return els[nth - 1] || null;
  }, [scope, rx, nth, exact]);
  const el = h.asElement();
  if (!el) { console.log(`  !! no match for /${rx}/ in ${scope}`); return false; }
  const desc = await el.evaluate((e) => { const c = e.closest("a,button,[data-go],[data-panel],[data-modal],[role=tab],[role=button],[role=link],tr[tabindex],[onclick],label,summary,input,select") ; return (c ? `<${c.tagName.toLowerCase()}${c.dataset.go ? " data-go=" + c.dataset.go : ""}${c.dataset.panel ? " data-panel=" + c.dataset.panel + " id=" + c.dataset.id : ""}${c.dataset.modal ? " data-modal=" + c.dataset.modal : ""}${c.getAttribute("href") ? " href=" + c.getAttribute("href") : ""}${[...c.attributes].filter((a) => /^data-/.test(a.name) && !/^data-(go|panel|id|modal)$/.test(a.name)).map((a) => " " + a.name + "=" + a.value.slice(0, 40)).join("")}>` : "(no clickable ancestor: <" + e.tagName.toLowerCase() + " class=" + e.className + ">)") + " “" + (e.innerText || "").trim().replace(/\s+/g, " ").slice(0, 70) + "”"; });
  try { await el.scrollIntoViewIfNeeded({ timeout: 1500 }); await el.click({ timeout: 2500 }); }
  catch (e) { console.log("  !! click failed (" + String(e.message).split("\n")[0].slice(0, 120) + "), dispatching"); await el.evaluate((e) => e.click()); }
  clicks++; await page.waitForTimeout(550);
  console.log(`  click#${clicks} ${desc}\n     -> ${JSON.stringify(await state())}`);
  return true;
}
for (const raw of process.argv.slice(2)) {
  const i = raw.indexOf(":"); const cmd = i < 0 ? raw : raw.slice(0, i); const arg = i < 0 ? "" : raw.slice(i + 1);
  console.log("» " + raw.slice(0, 160));
  const mm = cmd.match(/^(nav|c|p|m|a)(\d*)(=?)$/);
  if (mm && arg) { await click(SCOPE[mm[1]], mm[1] === "nav" ? "^" + arg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "( ›)?( ?[0-9]+)?$" : arg, Number(mm[2] || 1), mm[3] === "="); continue; }
  if (cmd === "t") { const [sel, max] = arg ? arg.split("::") : []; console.log("  " + await page.evaluate(([s, n]) => { const e = document.querySelector(s); return e ? e.innerText.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").replace(/\n/g, " ⏎ ").slice(0, n) : "(none)"; }, [sel || "#main", Number(max || 1500)])); continue; }
  if (cmd === "b") { console.log("  " + await page.evaluate((s) => { const root = document.querySelector(s); if (!root) return "(none)"; const vis = (e) => e.offsetParent !== null && e.getBoundingClientRect().width > 0; const seen = new Map(); [...root.querySelectorAll("a,button,[data-go],[data-modal],[role=tab],[role=button],summary,[data-panel]:not(tr),[data-act],[data-do]")].filter(vis).forEach((e) => { const t = ((e.innerText || "").trim().replace(/\s+/g, " ") || e.getAttribute("aria-label") || e.getAttribute("title") || "?").slice(0, 60); const k = t + (e.dataset.go ? "→" + e.dataset.go : e.getAttribute("href") && e.tagName === "A" ? "→" + e.getAttribute("href") : e.dataset.modal ? "◻" + e.dataset.modal : e.dataset.panel ? "▷" + e.dataset.panel : e.disabled || e.getAttribute("aria-disabled") === "true" ? "(disabled)" : ""); seen.set(k, (seen.get(k) || 0) + 1); }); const rows = root.querySelectorAll("tr[data-panel]").length; return [...seen].map(([k, n]) => n > 1 ? k + " ×" + n : k).join(" | ").slice(0, 3500) + (rows ? ` || rows[data-panel]: ${rows} (${[...new Set([...root.querySelectorAll("tr[data-panel]")].map((r) => r.dataset.panel || "∅"))].join(",")})` : ""); }, arg || "#main")); continue; }
  if (cmd === "in") { console.log("  " + await page.evaluate((s) => { const root = document.querySelector(s); if (!root) return "(none)"; const vis = (e) => e.offsetParent !== null; return [...root.querySelectorAll("input,select,textarea,[contenteditable=true],[contenteditable='']")].filter(vis).map((e) => { const l = e.closest("label") || (e.id && document.querySelector(`label[for="${e.id}"]`)); return `${e.tagName.toLowerCase()}${e.type ? "[" + e.type + "]" : ""}${e.name ? "#" + e.name : e.id ? "#" + e.id : ""}${e.className ? "." + String(e.className).split(" ")[0] : ""} “${(l ? l.innerText : e.getAttribute("aria-label") || e.placeholder || "").trim().replace(/\s+/g, " ").slice(0, 40)}”=${JSON.stringify((e.value !== undefined ? e.value : e.innerText || "").slice(0, 50))}${e.disabled ? "(disabled)" : ""}${e.readOnly ? "(readonly)" : ""}`; }).join(" | ").slice(0, 3000) || "(no inputs)"; }, arg || "#main")); continue; }
  if (cmd === "f") { const [css, ...v] = arg.split("::"); try { await page.fill(css, v.join("::"), { timeout: 2000 }); console.log("  filled"); } catch (e) { console.log("  !! fill failed " + e.message.split("\n")[0]); } continue; }
  if (cmd === "sel") { const [css, ...v] = arg.split("::"); try { await page.selectOption(css, { label: v.join("::") }, { timeout: 2000 }); console.log("  selected"); } catch (e) { console.log("  !! select failed " + e.message.split("\n")[0]); } await page.waitForTimeout(300); continue; }
  if (cmd === "k") { await page.keyboard.press(arg); await page.waitForTimeout(400); console.log("  " + JSON.stringify(await state())); continue; }
  if (cmd === "type") { await page.keyboard.type(arg); await page.waitForTimeout(300); continue; }
  if (cmd === "s") { await page.screenshot({ path: `${out}/${arg}.jpg`, type: "jpeg", quality: 60 }); console.log("  shot " + arg + ".jpg"); continue; }
  if (cmd === "back") { await page.goBack().catch(() => {}); await page.waitForTimeout(550); console.log("  " + JSON.stringify(await state())); continue; }
  if (cmd === "h") { console.log("  " + JSON.stringify(await state()) + " clicks=" + clicks); continue; }
  if (cmd === "x") { try { console.log("  " + JSON.stringify(await page.evaluate(arg)).slice(0, 3000)); } catch (e) { console.log("  !! " + e.message.split("\n")[0]); } continue; }
  if (cmd === "w") { await page.waitForTimeout(Number(arg)); continue; }

  if (cmd === "go") { await page.evaluate((h) => { location.hash = h; }, arg); await page.waitForTimeout(600); console.log("  " + JSON.stringify(await state())); continue; }
  if (cmd === "ov") { console.log("  " + JSON.stringify(await page.evaluate(() => { const de = document.documentElement; const vw = window.innerWidth; const vis = (e) => e.offsetParent !== null && e.getBoundingClientRect().width > 0; const scrollers = (e) => { let p = e.parentElement; while (p && p !== document.body) { const cs = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX)) return p; p = p.parentElement; } return null; }; const over = [...document.querySelectorAll("body *")].filter(vis).filter((e) => { const r = e.getBoundingClientRect(); return (r.right > vw + 2 || r.left < -2) && !scrollers(e); }).slice(0, 8).map((e) => e.tagName.toLowerCase() + "." + String(e.className).slice(0, 40) + " r=" + Math.round(e.getBoundingClientRect().right) + " “" + (e.innerText || "").trim().slice(0, 30) + "”"); const sc = [...document.querySelectorAll("body *")].filter(vis).filter((e) => e.scrollWidth > e.clientWidth + 4 && /(auto|scroll)/.test(getComputedStyle(e).overflowX)).slice(0, 8).map((e) => e.tagName.toLowerCase() + "." + String(e.className).slice(0, 40) + " sw=" + e.scrollWidth + " cw=" + e.clientWidth); return { vw, docScrollW: de.scrollWidth, bodyScrollW: document.body.scrollWidth, sideways: de.scrollWidth > vw + 1, overflowing: over, innerScrollers: sc }; }))); continue; }
  if (cmd === "hov") { const h = await page.evaluateHandle((rx) => { const re = new RegExp(rx, "i"); const vis = (e) => e.offsetParent !== null && e.getBoundingClientRect().width > 0; return [...document.querySelectorAll("#main tr, #main [role=row], #main li, #main .k3-row")].filter(vis).find((r) => re.test((r.innerText || "").replace(/\s+/g, " "))) || null; }, arg); const el = h.asElement(); if (!el) { console.log("  !! no row for /" + arg + "/"); continue; } await el.scrollIntoViewIfNeeded().catch(() => {}); await el.hover().catch((e) => console.log("  !! hover failed")); await page.waitForTimeout(350); console.log("  row: " + await el.evaluate((r) => { const vis = (e) => { const cs = getComputedStyle(e); const b = e.getBoundingClientRect(); return e.offsetParent !== null && b.width > 0 && cs.visibility !== "hidden" && Number(cs.opacity) > 0.05; }; return "<" + r.tagName.toLowerCase() + [...r.attributes].map((a) => " " + a.name + "=" + a.value.slice(0, 50)).join("") + "> text=“" + (r.innerText || "").replace(/\s+/g, " ").slice(0, 140) + "” controls=[" + [...r.querySelectorAll("a,button,[data-go],[data-panel],[role=button]")].map((e) => (vis(e) ? "" : "(hidden)") + ((e.innerText || "").trim().slice(0, 30) || e.getAttribute("aria-label") || e.getAttribute("title") || "?") + [...e.attributes].filter((a) => /^data-/.test(a.name)).map((a) => " " + a.name + "=" + a.value.slice(0, 30)).join("")).join(" | ") + "]"; })); continue; }
  if (cmd === "hc") { /* hover a row then click a control in it by label regex: hc:<rowrx>::<ctlrx> */ const [rrx, crx] = arg.split("::"); const h = await page.evaluateHandle((rx) => { const re = new RegExp(rx, "i"); const vis = (e) => e.offsetParent !== null && e.getBoundingClientRect().width > 0; return [...document.querySelectorAll("#main tr, #main [role=row], #main li")].filter(vis).find((r) => re.test((r.innerText || "").replace(/\s+/g, " "))) || null; }, rrx); const el = h.asElement(); if (!el) { console.log("  !! no row for /" + rrx + "/"); continue; } await el.scrollIntoViewIfNeeded().catch(() => {}); await el.hover().catch(() => {}); await page.waitForTimeout(300); const ch = await el.evaluateHandle((r, crx) => { const re = new RegExp(crx, "i"); return [...r.querySelectorAll("a,button,[role=button],[data-panel],[data-go]")].find((e) => re.test((e.innerText || "").trim() + " " + (e.getAttribute("aria-label") || "") + " " + (e.getAttribute("title") || ""))) || null; }, crx); const ce = ch.asElement(); if (!ce) { console.log("  !! no control /" + crx + "/ in row"); continue; } const viz = await ce.evaluate((e) => { const cs = getComputedStyle(e); const b = e.getBoundingClientRect(); return { w: Math.round(b.width), opacity: cs.opacity, vis: cs.visibility, label: e.getAttribute("aria-label") || e.getAttribute("title") || (e.innerText || "").trim().slice(0, 30) }; }); try { await ce.click({ timeout: 2500 }); } catch (e) { console.log("  !! click failed: " + String(e.message).split("\n")[0].slice(0, 100)); } clicks++; await page.waitForTimeout(550); console.log(`  click#${clicks} row-control ${JSON.stringify(viz)}\n     -> ${JSON.stringify(await state())}`); continue; }
  if (cmd === "sf") { await page.screenshot({ path: `${out}/${arg}.png`, fullPage: false }); console.log("  shot " + arg + ".png"); continue; }

  if (cmd === "el") { console.log("  element-words: " + JSON.stringify(await page.evaluate(() => { const t = document.body.innerText.replace(/\s+/g, " "); const out = []; const re = /.{0,40}\belements?\b.{0,30}/gi; let m; while ((m = re.exec(t)) && out.length < 6) out.push(m[0]); const oi = []; const re2 = /.{0,25}\bOpen in\b.{0,25}/g; while ((m = re2.exec(t)) && oi.length < 6) oi.push(m[0]); return { element: out, openIn: oi }; }))); continue; }

  if (cmd === "ce") { const [css, ...v] = arg.split("::"); try { const loc = page.locator(css).first(); await loc.scrollIntoViewIfNeeded({ timeout: 2000 }); await loc.click({ timeout: 2500 }); clicks++; await page.keyboard.press("Meta+ArrowDown"); await page.keyboard.type(v.join("::")); await page.waitForTimeout(300); const info = await loc.evaluate((e) => ({ ce: e.isContentEditable, tag: e.tagName, text: (e.innerText || e.value || "").slice(-120) })); console.log("  typed into " + JSON.stringify(info)); } catch (e) { console.log("  !! ce failed " + e.message.split("\n")[0]); } continue; }
  if (cmd === "blur") { await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.waitForTimeout(400); console.log("  " + JSON.stringify(await state())); continue; }

  if (cmd === "dbl") { try { await page.locator(arg).first().dblclick({ timeout: 2500 }); clicks++; await page.waitForTimeout(400); console.log("  dblclicked; active=" + await page.evaluate(() => { const a = document.activeElement; return a ? a.tagName + "." + String(a.className).slice(0, 40) + " ce=" + a.isContentEditable : "none"; })); } catch (e) { console.log("  !! dbl failed " + e.message.split("\n")[0]); } continue; }
  if (cmd === "zero") { clicks = 0; continue; }
  console.log("  ?? unknown");
}
if (errs.length) console.log("pageerrors:", errs.slice(0, 5));
await b.close();
