// Which pages still print the old per-component counts (PA.v7p.EBY's ctl/req, with no rows behind them)?
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + SP + "/proto/out/v3r-S.html#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const FIND = () => {
  const E = PA.v7p.EBY, out = [];
  const txt = (document.getElementById("main").innerText + " " + ((document.getElementById("panel") || {}).innerText || "")).replace(/\s+/g, " ");
  for (const e of Object.values(E)) {
    if (e.type === "platform") continue;
    const mc = PA.v3.fact("controlsOf", e.code).length, mr = PA.v3.fact("requirementsOf", e.code).length;
    const esc = e.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const [n, what, m] of [[e.ctl, "controls", mc], [e.req, "requirements", mr]]) {
      if (n === m || n < 20) continue;
      const re = new RegExp(`(${esc}|${e.code})[^|]{0,90}?\\b${n}\\b|\\b${n}\\b[^|]{0,60}?(${esc}|${e.code})`);
      const hit = re.exec(txt); if (hit) out.push(`${e.name}: ${n} ${what} (rows say ${m}) · "${hit[0].slice(0, 120)}"`);
    }
  }
  for (const [re, what] of [[/\b547 controls\b[^.]{0,40}/, "547 controls placed"], [/\b640 requirement allocations\b/, "640 requirement allocations"], [/\b98\b controls?/, "98 controls"]]) { const h = re.exec(txt); if (h) out.push(`${what} · "${h[0].slice(0, 100)}"`); }
  return out;
};
const routes = await p.evaluate(() => Object.keys(PA.S).filter((k) => !/^(system|component--|k3-)/.test(k) && PA.v3.redirectOf(k) === k && !/^(rec--|before-after|walkthrough|study|program-new)/.test(k)));
console.log(routes.length, "routes");
const hits = {};
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(r === "sctm" || r === "ssp" ? 2500 : 160);
  const f = await p.evaluate(FIND).catch(() => []); if (f.length) hits[r] = f;
}
for (const [k, v] of Object.entries(hits)) console.log(k, "\n   " + v.slice(0, 3).join("\n   ") + (v.length > 3 ? `\n   … ${v.length} in all` : ""));
await b.close();
