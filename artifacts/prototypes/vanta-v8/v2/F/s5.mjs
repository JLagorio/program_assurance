export default async (p, H) => {
  const fresh = async (r) => { await H.go("home"); await H.go(r); };
  const prim = async () => { await p.click("#modal .dlg-f .btn.ink"); await H.wait(450); };
  const errs = () => p.evaluate(() => [...document.querySelectorAll("#modal .v2k-err")].map((e) => e.textContent).join(" | "));
  // 1. Evidence: Accept, Send back without a reason, then with one
  await fresh("evidence");
  console.log("qv0", await p.$$eval("#main .qv", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim()).join(" | ")));
  await p.click('#main tr[data-panel="a-docs-ev"]'); await H.wait(400);
  await p.locator('#panel [data-modal="a-docs-review"]', { hasText: "Accept" }).first().click(); await H.wait(300);
  await prim();
  console.log("accept ->", await H.toast(), "| modal open:", !!(await H.modal()));
  console.log("qv1", await p.$$eval("#main .qv", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim()).join(" | ")));
  console.log("row1", (await H.vis())[0]);
  await fresh("evidence");
  await p.locator('#main tr[data-panel="a-docs-ev"]').nth(1).click(); await H.wait(400);
  await p.locator('#panel [data-modal="a-docs-review"]', { hasText: "Send back" }).first().click(); await H.wait(300);
  await prim();
  console.log("send back empty ->", await errs());
  await p.fill('#modal textarea[name="why"]', "Add the alert log for the injected offset."); await prim();
  console.log("send back ->", await H.toast());
  console.log("qv2", await p.$$eval("#main .qv", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim()).join(" | ")));
  // 2. Upload with no file
  await fresh("evidence");
  await p.locator("#main .ph button", { hasText: "Add evidence" }).first().click(); await H.wait(200);
  await p.locator("[role=menuitem][data-modal='a-docs-upload'][data-id='upload|']:visible").first().click(); await H.wait(300);
  await prim();
  console.log("upload empty ->", await errs(), "| open:", !!(await H.modal()));
  await p.setInputFiles('#modal input[type=file]', { name: "alert-log-export.csv", mimeType: "text/csv", buffer: Buffer.from("a,b\n1,2\n") });
  await p.selectOption('#modal select[name="req"]', "REQ-004");
  await prim();
  console.log("upload ->", await H.toast());
  console.log("qv3", await p.$$eval("#main .qv", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim()).join(" | ")));
  console.log("first row", (await H.vis())[0]);
  // 3. POA&M header
  await fresh("poam");
  console.log("poam items0", (await H.main()).match(/Items \d+/)?.[0]);
  await p.click('#main .ph [data-modal="a-risk-poam-new"]'); await H.wait(300);
  await prim(); console.log("poam empty ->", await errs());
  const iss = await p.$eval('#modal select[name="issue"] option:nth-child(2)', (o) => o.value);
  await p.selectOption('#modal select[name="issue"]', iss); await p.fill('#modal input[name="title"]', "Close the gap the issue names"); await prim();
  console.log("poam ->", await H.toast(), "|", (await H.main()).match(/Items \d+/)?.[0]);
  // 4. Risks header
  await fresh("risks");
  await p.click('#main .ph [data-modal="a-risk-new-risk"]'); await H.wait(300);
  await p.fill('#modal input[name="title"]', "Unsigned firmware reaches a fielded unit"); await prim();
  console.log("risk ->", await H.toast(), "|", (await H.main()).match(/Register\s*\d+/)?.[0]);
  // 5. Schedule
  await fresh("schedule");
  await p.click('#main .ph [data-modal="a-work-task-new"]'); await H.wait(300);
  await p.fill('#modal input[name="title"]', "Collect the alert log export"); await prim();
  console.log("task ->", await H.toast(), "|", await p.$$eval("#main .a-work-chips .qv", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim()).join(" | ")));
  // 6. SI-2 Add evidence
  await fresh("control-si2");
  await p.click('#main [data-modal="a-tests-addev"]'); await H.wait(300);
  await prim(); console.log("si2 empty ->", await errs());
  await p.setInputFiles('#modal input[type=file]', { name: "openssh-9.8p1-update.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") });
  await prim(); console.log("si2 ->", await H.toast());
  await fresh("control-si2-evidence");
  console.log("si2 evidence tab:", (await H.vis()).length, "rows |", await p.$$eval("#main [role=tab]", (t) => t.map((x) => x.textContent.replace(/\s+/g, " ").trim()).join(" | ")));
  // 7. Assessments card Plan an assessment
  await fresh("assessments");
  await p.click('#main [data-modal="a-tests-plan"]'); await H.wait(300);
  await prim(); console.log("plancvi ->", await H.toast());
  console.log("cvi card:", (await H.main()).match(/cooperative vulnerability identification[^]{0,200}/)?.[0]?.slice(0, 200));
  // 8. Treat 2 critical risks
  await fresh("my-work");
  for (const r of await p.$$("#main a.a-work-mw")) if ((await r.textContent()).includes("Treat 2 critical")) { await r.click(); break; }
  await H.wait(800);
  console.log("treat2 ->", await p.evaluate(() => location.hash), (await H.vis()).length, "rows", await H.qvOn(), await p.$eval("#main .a-risk-tools", (t) => t.innerText.replace(/\s+/g, " ")));
  // 9. Gate outcomes, Ask Priya, Edit asset
  await fresh("schedule");
  await p.click('#main [data-panel="a-work-gate"][data-id="pdr"]'); await H.wait(400);
  await p.click('#panel [data-modal="v2f-outcomes"]'); await H.wait(300);
  await prim(); console.log("outcomes empty ->", await errs());
  await p.check('#modal input[name="oc-AR.1"]'); await prim();
  console.log("outcomes ->", await H.toast(), "| panel:", (await H.panel()).match(/Gate criteria \d+/)?.[0]);
  await fresh("inheritance");
  await p.click('#main tr[data-panel="v7a-src"]'); await H.wait(400);
  const ask = await p.$('#panel [data-v2f-ask]'); console.log("ask button:", !!ask);
  if (ask) { await ask.click(); await H.wait(400); console.log("ask ->", await H.toast(), "|", (await H.panel()).match(/Asked on [A-Za-z]+ \d+/)?.[0]); }
  await fresh("inventory");
  await p.click('#main tr[data-panel="sys-asset"]'); await H.wait(400);
  await p.click('#panel [data-modal="v2f-asset"]'); await H.wait(300);
  await p.fill('#modal input[name="serial"]', "SN-4471-A"); await prim();
  console.log("asset ->", await H.toast(), "|", (await H.panel()).match(/Serial number [^ ]+/)?.[0]);
  // 10. Launcher
  await p.keyboard.press("Meta+k"); await H.wait(300);
  await p.fill("#v8w-k-q", "which controls lack evidence?"); await H.wait(300);
  console.log("launcher:", await p.$eval(".v8w-k-list", (l) => l.innerText.replace(/\s+/g, " ").slice(0, 200)));
  await p.keyboard.press("Enter"); await H.wait(700);
  console.log("answer ->", await p.evaluate(() => location.hash), await H.qvOn());
  await p.keyboard.press("Meta+k"); await H.wait(300);
  await p.fill("#v8w-k-q", "why is the boundary drawn this way?"); await H.wait(300);
  console.log("launcher2:", await p.$eval(".v8w-k-list", (l) => l.innerText.replace(/\s+/g, " ").slice(0, 200)));
};
