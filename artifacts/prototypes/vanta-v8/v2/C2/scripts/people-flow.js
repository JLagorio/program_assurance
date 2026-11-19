const out = {};
const go = async (r) => { await page.evaluate((x) => { location.hash = x; }, r); await page.waitForTimeout(450); };
const txt = (sel) => page.$eval(sel, (x) => x.textContent.replace(/\s+/g, " ").trim()).catch(() => null);
await go("people");
out.peopleTabs = await page.$$eval("#main .ak-tab", (t) => t.map((x) => x.textContent.replace(/\s+/g, " ").trim()));
out.head = await page.$$eval("#main .ph .btn, #main .ak-ih .btn, #main .btns .btn", (b) => b.map((x) => x.textContent.trim()).filter(Boolean));
await page.click('#main [data-modal="v2c-add-person"]');
await page.waitForTimeout(250);
await page.click('#modal [data-v2c-act="add-person"]');
await page.waitForTimeout(200);
out.emptyErr = await txt("#v2c-p-name-err");
out.stillOpen = await page.$eval("#modal", (m) => !m.hidden);
await page.fill("#v2c-p-name", "Maya Chen");
await page.selectOption("#v2c-p-role", "SCA");
await page.click('#modal [data-v2c-act="add-person"]');
await page.waitForTimeout(600);
out.landed = await page.evaluate(() => location.hash);
out.obRows = await page.$$eval("#main tbody tr", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim().slice(0, 60)));
out.progress1 = await txt("#main .v8d-obh");
await page.click("#main tbody tr[data-panel='v8d-ob']");
await page.waitForTimeout(350);
out.preview = await txt("#panel .pbody");
await page.click('#panel [data-v8d-act="ob-done"]');
await page.waitForTimeout(500);
out.progress2 = await txt("#main .v8d-obh");
out.previewAfter = await txt("#panel .pbody");
await go("people");
out.mayaRow = await page.$$eval("#main tbody tr", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim()).filter((x) => /Maya/.test(x)));
out.peopleTabs2 = await page.$$eval("#main .ak-tab", (t) => t.map((x) => x.textContent.replace(/\s+/g, " ").trim()));
// offboarding: reassign all of Victor's work to Nadia Fournier
const before = await page.$$eval("#main tbody tr", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim()).filter((x) => /Victor Amsel|Nadia Fournier/.test(x)));
out.beforeReassign = before;
await go("person-victor-amsel-offboarding");
await page.click('#main [data-v8d-act="off-all"]');
await page.waitForTimeout(400);
await go("people");
out.afterReassign = await page.$$eval("#main tbody tr", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim()).filter((x) => /Victor Amsel|Nadia Fournier/.test(x)));
await go("people-access");
out.accessRow = await page.$$eval("#main tbody tr", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim()).slice(0, 1));
out.todo = await txt("#main .a-people-tcard");
// access review: Complete review says what is owed, decisions move the count, then it completes
await page.click("#main tbody tr[data-panel='a-people-par']");
await page.waitForTimeout(350);
await page.click("#panel [data-apcomplete]");
await page.waitForTimeout(300);
out.owed1 = await txt("#panel .a-people-owed");
await page.click("#panel [data-apshowall]");
await page.waitForTimeout(250);
for (let guard = 0; guard < 20; guard++) {
  const und = await page.$$("#panel .a-people-acct");
  let clicked = false;
  for (const acct of und) {
    const on = await acct.$(".a-people-sb.on");
    if (!on) { const keep = await acct.$('[data-apk="keep"]'); await keep.click(); await page.waitForTimeout(120); clicked = true; break; }
  }
  if (!clicked) break;
}
out.owed2 = await txt("#panel .a-people-owed");
out.row2 = await page.$$eval("#main tbody tr", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim()).slice(0, 1));
// owners for the two unowned accounts
for (let guard = 0; guard < 4; guard++) {
  const un = await page.$('#panel .a-people-own[data-modal="a-people-acct-owner"]:has-text("Unassigned")');
  if (!un) break;
  await un.click(); await page.waitForTimeout(200);
  await page.click("#modal [data-apowner-ok]"); await page.waitForTimeout(150);
  out.ownerErr = await txt("#ap-acct-owner-err");
  await page.selectOption("#ap-acct-owner", "Joel Barrantes");
  await page.click("#modal [data-apowner-ok]"); await page.waitForTimeout(250);
}
out.owed3 = await txt("#panel .a-people-owed");
// a note or task for each revoked account
for (let guard = 0; guard < 4; guard++) {
  const need = await page.$('#panel .a-people-need [data-modal="a-people-task"]');
  if (!need) break;
  await need.click(); await page.waitForTimeout(200);
  await page.click("#modal [data-aptask-ok]"); await page.waitForTimeout(250);
}
out.owed4 = await txt("#panel .a-people-owed");
await page.click("#panel [data-apcomplete]");
await page.waitForTimeout(400);
out.after = await txt("#panel .a-people-rh");
out.rowDone = await page.$$eval("#main tbody tr", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim()).slice(0, 1));
await go("people");
out.nadia = await page.$$eval("#main tbody tr", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim()).filter((x) => /Nadia Fournier/.test(x)));
return out;
