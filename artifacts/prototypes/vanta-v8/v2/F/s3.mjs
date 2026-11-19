export default async (p, H) => {
  const req = async (id) => { await H.go("home"); await H.go("requirements"); await p.click(`#main tr[data-id="${id}"]`); await H.wait(400); };
  // fold: the old page's address opens the Requirements page with the preview
  await H.go("rec--v7p-req--REQ-439"); await H.wait(400);
  console.log("fold hash", await p.evaluate(() => location.hash), "| panel:", (await H.panel()).slice(0, 120));
  // REQ-599: register evidence by title
  await req("REQ-599");
  console.log("599:", (await H.panel()).slice(0, 900));
  // a chain line opens its own preview
  await p.click('#panel .v2f-li[data-panel="a-docs-ev"]'); await H.wait(400);
  console.log("ev line ->", (await H.panel()).slice(0, 160));
  await req("REQ-599");
  await p.click('#panel .v2f-li[data-panel="a-risk-risk"]'); await H.wait(400);
  console.log("risk line ->", (await H.panel()).slice(0, 160));
  await req("REQ-599");
  await p.click('#panel .v2f-li[data-panel="a-risk-issue"]'); await H.wait(400);
  console.log("issue line ->", (await H.panel()).slice(0, 160));
  await req("REQ-599");
  await p.click('#panel .v2f-li[data-panel="a-risk-poam"]'); await H.wait(400);
  console.log("poam line ->", (await H.panel()).slice(0, 160));
  // Map control from REQ-004 (cites no evidence) onto a control nobody maps; then Link evidence
  await req("REQ-004");
  await p.click('#panel [data-modal="v7p-map"]'); await H.wait(300);
  console.log("map dialog:", (await H.modal()).slice(0, 300));
  await p.click('#modal [data-v2k="reqmap"]'); await H.wait(300);
  console.log("empty ->", (await H.modal()).match(/[A-Z][a-z]+ is required\./g));
  const opt = await p.$eval('#modal select[name="ctl"] optgroup option', (o) => o.value);
  await p.selectOption('#modal select[name="ctl"]', opt);
  await p.click('#modal [data-v2k="reqmap"]'); await H.wait(500);
  console.log("mapped", opt, "toast:", await H.toast());
  console.log("panel after:", (await H.panel()).slice(0, 600));
  console.log("row:", (await p.$eval('#main tr[data-id="REQ-004"]', (t) => t.innerText.replace(/\s+/g, " "))));
  await p.click('#panel [data-modal="v7p-link-ev"]'); await H.wait(300);
  await p.selectOption('#modal select[name="ev"]', "ev-crdr");
  await p.click('#modal [data-v2k="reqev"]'); await H.wait(500);
  console.log("linked toast:", await H.toast());
  console.log("row:", (await p.$eval('#main tr[data-id="REQ-004"]', (t) => t.innerText.replace(/\s+/g, " "))));
  console.log("qv:", await p.$$eval("#main .qv", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim())));
  console.log("panel ev:", (await H.panel()).match(/Evidence \d+[^F]*/));
  await H.go("controls"); await p.click(`#main tr[data-id="${opt}"]`); await H.wait(400);
  console.log("control preview:", (await H.panel()).slice(0, 500));
};
