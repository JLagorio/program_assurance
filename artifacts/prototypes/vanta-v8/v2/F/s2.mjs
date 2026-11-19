export default async (p, H) => {
  const out = process.env.OUT || "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/v2/F/shots";
  const fs = await import("node:fs"); fs.mkdirSync(out, { recursive: true });
  const id = process.env.REQ || "REQ-008";
  await H.go("requirements");
  await p.click(`#main tr[data-id="${id}"]`); await H.wait(500);
  console.log("panel:", (await H.panel()).slice(0, 1500));
  console.log("arrow:", await p.evaluate(() => !!document.querySelector('#panel .bar-top button[aria-label="Open the full record"]')));
  await p.screenshot({ path: `${out}/${process.env.TAG || "req"}-${id}.png`, fullPage: false });
};
