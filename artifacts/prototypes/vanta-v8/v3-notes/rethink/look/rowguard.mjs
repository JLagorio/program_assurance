// A control inside a row acts alone; a long title keeps the header's actions top right. usage: node rowguard.mjs <build> <outdir>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(700); };
let ok = 0, bad = 0; const t = (n, c, x) => { c ? ok++ : bad++; console.log(c ? "ok  " : "FAIL", n, x === undefined || c ? "" : JSON.stringify(x).slice(0, 500)); };
// every place: count controls inside rows that go somewhere, and click the first of each kind
for (const r of ["controls", "requirements", "evidence", "documents", "findings", "risks", "assessments", "system", "system-connections", "authorization", "overview"]) {
  await go(r);
  const inrow = await p.evaluate(() => [...document.querySelectorAll("#main tr[data-go], #main tr[data-panel]")].flatMap((tr) => [...tr.querySelectorAll("button:not(.k3-eye), select, summary, input, a[href]")].filter((c) => !c.matches("[data-panel],[data-modal],[data-go]")).map((c) => (c.tagName + "." + c.className).slice(0, 60))).reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {}));
  console.log("   ", r, JSON.stringify(inrow).slice(0, 300));
  const sel = "#main tr[data-go] summary, #main tr[data-go] button[data-k3]:not(.k3-eye)";
  if (await p.$(sel)) { const h0 = await p.evaluate(() => location.hash); await p.click(sel); await p.waitForTimeout(450); const h1 = await p.evaluate(() => location.hash); t(r + ": a control inside a row does not follow the row", h0 === h1 || !/--/.test(h1), [h0, h1]); await p.keyboard.press("Escape"); }
}
// long title: the header's actions stay on the first line
await go("findings"); const long = await p.evaluate(() => { const rows = [...document.querySelectorAll("#main tr[data-go]")]; rows.sort((a, b) => b.innerText.length - a.innerText.length); return rows[0] && rows[0].getAttribute("data-go"); });
if (long) { await go(long); const g = await p.evaluate(() => { const h = document.querySelector("#main .k3-title"), a = document.querySelector("#main .k3-head-a"); if (!h || !a) return null; const hr = h.getBoundingClientRect(), ar = a.getBoundingClientRect(); return { title: h.innerText.length, lines: Math.round(hr.height / 32), aTop: Math.round(ar.top - hr.top), aRight: Math.round(innerWidth - ar.right) }; }); t("a long title keeps the actions top right", !!g && g.aTop < 20, g); console.log("   ", long, JSON.stringify(g)); await p.screenshot({ path: out + "/longtitle.jpg", type: "jpeg", quality: 60 }); }
console.log(`${ok} ok, ${bad} failed; page errors`, JSON.stringify(errs).slice(0, 300)); await b.close();
