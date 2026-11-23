import { open } from "../../../v3/P/lib.mjs";
const H = await open({ build: process.argv[2], v3: true, start: "overview" }); const p = H.p;
const st = () => p.evaluate(() => ({ hash: location.hash, on: [...document.querySelectorAll("#main .k3-tb .k3-flt.on select")].map((s) => s.getAttribute("aria-label") + "=" + s.options[s.selectedIndex].text), view: (document.querySelector("#main .k3-vname") || {}).textContent, rows: document.querySelectorAll("#main tbody tr").length, foot: (document.querySelector("#main .pager") || {}).textContent }));
for (const t of ["Risks without an owner", "Evidence waiting on review"]) { await H.go("overview"); await p.click(`#main .k3-att-r:has-text("${t}")`); await H.wait(700); console.log(t, JSON.stringify(await st())); }
await H.go("overview-activity"); console.log(JSON.stringify(await st()));
console.log(await p.evaluate(() => [...document.querySelectorAll("#main .k3-tb select")].map((s) => s.outerHTML.slice(0, 260)).join("\n")));
await H.b.close();
