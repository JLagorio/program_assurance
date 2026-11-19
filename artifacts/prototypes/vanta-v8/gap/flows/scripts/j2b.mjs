import { start } from "./walk.mjs";
const W = await start("j2b");
const items = ["Remediate CVE-2024-6387", "Resolve 16 more operational issues", "Treat 2 critical risks", "Close out the Expanded Control Set Assessment", "Remediate 3 operational issues", "Submit SSP 3 for review", "Run the quarterly configuration baseline audit", "Give an owner to 40 open risks", "Revise 54 evidence versions", "88 evidence versions wait on a reviewer", "An offered finding, CVE-2024-6387"];
for (const it of items) {
  await W.go("my-work");
  const e = await W.click(it, { why: "My work row", wait: 600 });
  const st = await W.p.evaluate(() => {
    const m = document.getElementById("main");
    const on = [...m.querySelectorAll(".on, [aria-pressed=true], [aria-selected=true], [aria-current]")].map(e => e.innerText.trim().replace(/\s+/g, " ")).filter(t => t && t.length < 40);
    const rows = m.querySelectorAll("table tbody tr").length;
    const inputs = [...m.querySelectorAll("input[type=search], input[type=text]")].map(i => i.value).filter(Boolean);
    const h = (m.querySelector("h1") || {}).innerText || m.innerText.split("\n")[0];
    const panel = document.getElementById("panel"); 
    return { h: h.slice(0, 60), on: [...new Set(on)].slice(0, 6), rows, inputs, panel: panel.hidden ? null : panel.innerText.slice(0, 80).replace(/\s+/g, " ") };
  });
  console.log(`ROW "${it}" → ${e && e.effect} | ${JSON.stringify(st)}`);
}
await W.done();
