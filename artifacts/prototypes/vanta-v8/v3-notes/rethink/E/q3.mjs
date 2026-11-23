import { open } from "../../v3/P/lib.mjs";
const path = await import("path");
const H = await open({ build: path.resolve(process.argv[2]), start: "overview", width: +(process.env.WIDTH || 390) }), p = H.p;
await H.go(process.argv[3], 600);
await p.evaluate(() => document.querySelector("#main .k3-eye").click()); await p.waitForTimeout(600);
console.log(JSON.stringify(await p.evaluate(() => { const pn = document.querySelector("#panel .k3-pn"); return { pw: pn.clientWidth, tables: [...pn.querySelectorAll("table")].map((t) => ({ sec: (t.closest(".k3-sec") || { querySelector: () => ({ textContent: "" }) }).querySelector("h2").textContent.slice(0, 24), sw: t.scrollWidth, cw: t.parentElement.clientWidth, rows: t.querySelectorAll("tbody tr").length, h: [...t.querySelectorAll("tbody tr")].map((tr) => Math.round(tr.getBoundingClientRect().height)), cells: [...t.querySelector("tbody tr").children].map((td) => [td.className, Math.round(td.getBoundingClientRect().width), td.textContent.slice(0, 30)]) })) }; })));
process.exit(0);
