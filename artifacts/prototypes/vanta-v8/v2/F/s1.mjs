export default async (p, H) => {
  await H.go("my-work");
  const rows = await p.$$("#main a.a-work-mw");
  for (const r of rows) if ((await r.textContent()).includes("Treat 2 critical")) { await r.click(); break; }
  await H.wait(900);
  console.log("hash", await p.evaluate(() => location.hash), "qvOn", await H.qvOn());
  const vis = await H.vis(); console.log("visible rows", vis.length, vis.map((x) => x.slice(0, 80)));
  console.log("all rows", await p.$$eval("#main tbody tr", (t) => t.length));
  console.log("kept", await p.evaluate(() => { const k = document.querySelector("#main .v2-kept"); return k ? k.innerText : ""; }));
  console.log("panel", (await H.panel()).slice(0, 200));
  console.log("qv all", await p.$$eval("#main .qv", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim())));
};
