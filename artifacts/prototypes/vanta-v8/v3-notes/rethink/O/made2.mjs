import { open, createSP70 } from "../../v3/P/lib.mjs";
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const H = await open({ build: SP + "/vanta/proto/out/v3r-O.html", v3: true });
await createSP70(H, { nss: true });
await H.p.click('#k3o-life tbody tr'); await H.wait(500);
console.log("panel:", (await H.panel()).replace(/\s+/g, " ").slice(0, 700));
await H.p.screenshot({ path: "tmp/made-panel.jpg", type: "jpeg", quality: 60 });
await H.go("overview-team"); await H.p.screenshot({ path: "tmp/made-team.jpg", type: "jpeg", quality: 60 });
console.log("team:", (await H.main()).replace(/\s+/g, " ").slice(0, 500));
// not passed, then request again (WS-X90)
await H.p.evaluate(() => { PA.v2.reset(); PA.v3.set(true); }); await H.wait(400); await H.go("overview");
await H.p.evaluate(() => PA.v3k.openPanel("k3o-gate", "pdr-2")); await H.wait(400);
await H.click("Record as Marcus Ryde", "#panel", { exact: true, sel: "button" });
await H.p.selectOption("#k3f-o", "no"); await H.p.fill("#k3f-why", "The boundary is not reviewed."); await H.p.click("#modal [data-k3-submit]"); await H.wait(500);
console.log("after not passed:", (await H.panel()).replace(/\s+/g, " ").slice(0, 260), "| next:", (await H.txt("#k3o-next")).replace(/\s+/g, " ").slice(0, 120));
await H.click("Request decision", "#panel", { exact: true, sel: "button" }); await H.wait(300); await H.p.click("#modal [data-k3-submit]"); await H.wait(500);
console.log("after request:", (await H.panel()).replace(/\s+/g, " ").slice(0, 330));
console.log("errs", H.errs);
await H.b.close();
