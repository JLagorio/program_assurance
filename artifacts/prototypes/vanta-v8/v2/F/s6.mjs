export default async (p, H) => {
  await H.go("controls");
  await p.click('#main tr[data-id="SA-24"]'); await H.wait(400);
  await p.click('#panel [data-modal="v2k-map"]'); await H.wait(300);
  await p.selectOption('#modal select[name="req"]', "REQ-641");
  await p.click('#modal [data-v2k="map"]'); await H.wait(500);
  await p.click('#main tr[data-id="SA-24"]'); await H.wait(400);
  await p.click('#panel .v2k-li[data-panel="v7p-req"]'); await H.wait(400);
  console.log("REQ-641 preview:", (await H.panel()).slice(0, 700));
  console.log("arrow:", await p.evaluate(() => !!document.querySelector('#panel .bar-top button[aria-label="Open the full record"]')));
};
