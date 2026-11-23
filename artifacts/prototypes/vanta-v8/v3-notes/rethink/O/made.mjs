import { open, createSP70 } from "../../v3/P/lib.mjs";
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad";
const H = await open({ build: SP + "/vanta/proto/out/v3r-O.html", v3: true });
const seen = await createSP70(H, { nss: true });
console.log("made", seen.code, await H.hash());
console.log(JSON.stringify(await H.p.evaluate(() => ({ guide: PA.v3.fact("program", PA.v2hubs.cur()).guide, gate: PA.v3.fact("gate", "asr-1"), due: PA.v3.fact("lifeDue", PA.v2hubs.cur(), "asr-1"), made: PA.v2hubs.madeOne(PA.v2hubs.cur()), people: PA.v3.fact("people", PA.v2hubs.cur()), ctl: PA.v3.fact("controls", PA.v2hubs.cur()), auth: PA.v3.fact("authorizations", PA.v2hubs.cur()) })), null, 0).slice(0, 4500));
await H.p.screenshot({ path: "made-ov.jpg", type: "jpeg", quality: 60 });

console.log("errs", H.errs);
await H.b.close();
