export default async (p, H) => {
  await H.go("evidence");
  // Add evidence menu → Upload a file
  const btns = await p.$$eval("#main .ph summary, #main .ph button, #main .ph .btn", (b) => b.map((x) => x.textContent.trim()));
  console.log("header buttons:", btns);
  await p.locator("#main .ph button", { hasText: "Add evidence" }).first().click(); await H.wait(200);
  await p.locator("[role=menuitem][data-modal='a-docs-upload'][data-id='upload|']:visible").first().click(); await H.wait(300);
  console.log("dialog:", (await H.modal()).slice(0, 300));
  console.log("footer:", await p.$eval("#modal .dlg-f", (f) => f.innerHTML));
  await p.click("#modal .dlg-f .btn.ink"); await H.wait(400);
  console.log("after primary: modal open?", !!(await H.modal()), "toast:", await H.toast(), "| ak-toast:", await p.evaluate(() => { const t = document.querySelector(".ak-toast"); return t ? t.innerText : ""; }));
  // Review evidence Accept
  await H.go("home"); await H.go("evidence");
  await p.click('#main tr[data-panel="a-docs-ev"]'); await H.wait(400);
  await p.locator('#panel [data-modal="a-docs-review"]', { hasText: "Accept" }).first().click(); await H.wait(300);
  console.log("review dialog:", (await H.modal()).slice(0, 400));
  await p.click("#modal .dlg-f .btn.ink"); await H.wait(400);
  console.log("after Save review: modal:", (await H.modal()).slice(0, 300), "toast:", await H.toast());
};
