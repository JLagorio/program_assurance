import io
t = io.open("walk.mjs", encoding="utf-8").read()
def sub(old, new):
    global t
    assert t.count(old) == 1, (t.count(old), old[:90])
    t = t.replace(old, new)
sub('''await H.go("findings-issues");
const open0 = await chip("Open"), iss0 = (await fact("issues", "PRG-1090")).open;
ok((await rail())[1].on && open0 === (await rail())[1].n && open0 === iss0, "6 Operational issues: the tab's count, the Open chip and fact(issues) are one number", [open0, (await rail())[1], iss0]);''',
'''await H.go("findings"); const issN = (await rail())[1].n;
await H.go("findings-issues");
const open0 = await chip("Open"), iss0 = (await fact("issues", "PRG-1090")).open;
ok((await rail())[1].on && open0 === issN && open0 === iss0, "6 Operational issues: the Source filter's count, the list's own count and fact(issues) are one number", [open0, issN, iss0]);''')
sub('''/Moved once/.test((await msec("Plan")).text)''', '''/Moved\\s*Once/.test((await msec("Plan")).text)''')
sub('''await p.reload(); await w(900); await H.go("overview"); await H.go("findings-issues");
ok((await chip("Open")) === open0 - 1 && (await chip("Deactivated")) === 1, "6 still deactivated after a reload");''',
'''await p.reload(); await w(900); await H.go("overview"); await H.go("findings-issues");
ok((await stateOn()) === "Deactivated" && (await rows()).length === 1, "6 still deactivated after a reload, and the list still asks for the deactivated ones", [await stateOn(), (await rows()).length]);
await pick("state", "");
ok((await chip("Open")) === open0 - 1 && (await chip("Deactivated")) === 1, "6 the open findings are one fewer");''')
sub('''ok((await rows()).length === 1 && /CVE-2024-6387/.test((await rows())[0]) && /Fixed in a newer version/.test((await rows())[0]), "10 the Fixed chip lists it, marked fixed", await rows());''',
'''ok((await rows()).length === 1 && /CVE-2024-6387/.test((await rows())[0]) && (await stateOn()) === "Fixed", "10 the Fixed state lists it", await rows());''')
new = r'''
// ——— 12. Pass 3: one row over every table, one line a row, views, and previews that list what their pages list ———
const clearRow = async () => { await ev(() => { const c = document.querySelector("#main .k3-clear"); if (c) c.click(); }); await w(550); };
const tallRows = () => ev(() => [...document.querySelectorAll("#main .k3-table tbody tr")].filter((tr) => tr.getClientRects().length && tr.getBoundingClientRect().height > 44).length);
for (const [r, list, first] of [["findings", "findings", "Source"], ["findings-poam", "findings", "Source"], ["assessments", "assessments", "Kind"], ["risks", "risks", "State"], ["risks-threats", "techniques", "Matrix"], ["assessment--exp--objectives", "assessment-objectives", "Control"]]) {
  await H.go(r, 550); const b = await bar(), tall = await tallRows();
  ok(!!b && b.list === list && b.filters[0] === first && b.strips === 0 && (NARROW || b.rows === 1) && tall === 0 && !!b.view, `12 ${r}: one row (search, view, filters, actions) and every row one line`, [b, tall]);
}
await H.go("findings", 550); await clearRow();
const vAll = await footN(), items0 = await viewItems();
ok(/^All findings/.test(items0[0]) && ["Past due", "On the POA&M", "No owner", "Operational issues", "STIG rules"].every((l) => items0.some((x) => x.startsWith(l))) && items0.some((x) => /^High, past due/.test(x) && /Shared/.test(x)), "12 the view menu: All findings, the built-in views (its states and its sources) and a shared saved view", items0);
await pick("state", "Past due"); await p.selectOption('#main select[data-k3-input="k3e.f.sev"]', "high"); await w(600);
const seedN = await footN(), bSeed = await bar();
ok(seedN > 0 && seedN < vAll && bSeed.view === "High, past due" && !bSeed.edited && (await stateOn()) === "Past due", "12 Past due and High are the saved view High, past due: the row names it", [seedN, vAll, bSeed.view, bSeed.edited]);
await search("REQ");
const mineN = await footN(), mineRows = (await rows()).slice(0, 6), bEd = await bar();
ok(mineN > 0 && mineN < seedN && bEd.edited, "12 a search on top of it: the view reads as edited", [mineN, seedN, bEd.view, bEd.edited]);
ok(await viewMenu("Save as new view"), "12 Save as new view is in the menu");
await p.fill("#modal input[name=name]", "Walk: late high requirements"); await p.selectOption("#modal select[name=shared]", "team"); await submit();
const bSaved = await bar();
ok(bSaved.view === "Walk: late high requirements" && !bSaved.edited && (await footN()) === mineN, "12 saved: it is the row's view", bSaved);
await viewMenu("All findings");
ok((await footN()) === vAll && (await stateOn()) === "" && (await H.val("#main .k3-search input")) === "" && !(await bar()).edited, "12 All findings clears the search and every filter", [await footN(), vAll]);
await viewMenu("STIG rules");
ok((await hash()) === "findings-stig" && (await bar()).view === "STIG rules" && (await rail())[4].on && (await bar()).list === "findings", "12 a source is a view too: STIG rules is the same list at its own address", [await hash(), (await bar()).view]);
await H.go("risks", 500); await H.go("findings-stig", 550);
await viewMenu("Walk: late high requirements");
ok((await hash()) === "findings" && (await bar()).view === "Walk: late high requirements" && !(await bar()).edited && (await footN()) === mineN && JSON.stringify((await rows()).slice(0, 6)) === JSON.stringify(mineRows) && (await H.val("#main .k3-search input")) === "REQ" && (await stateOn()) === "Past due", "12 left and picked again from another address, the saved view asks the same question: the same rows", [await hash(), await footN(), mineN]);
await viewMenu("Manage views"); await w(200);
ok(await ev(() => [...document.querySelectorAll("#modal .k3-vm-r .k3-vm-n")].map((x) => x.value).join("|") === "High, past due|Walk: late high requirements"), "12 Manage views lists the saved views, each renamed, shared or deleted there", await ev(() => [...document.querySelectorAll("#modal .k3-vm-r .k3-vm-n")].map((x) => x.value)));
await ev(() => { const r = [...document.querySelectorAll("#modal .k3-vm-r")].find((x) => (x.querySelector(".k3-vm-n") || {}).value === "Walk: late high requirements"); [...r.querySelectorAll(".btn")].find((b) => /Delete/.test(b.textContent)).click(); }); await w(200);
await ev(() => [...document.querySelectorAll("#modal .k3-vm-r.ask .btn")].find((b) => /Delete view/.test(b.textContent)).click()); await w(300);
ok(await ev(() => [...document.querySelectorAll("#modal .k3-vm-r .k3-vm-n")].map((x) => x.value).join("|") === "High, past due"), "12 deleted there, after it asked");
await ev(() => document.querySelector("#modal [data-k3-close]").click()); await w(250);
ok(!(await viewItems()).some((x) => /^Walk:/.test(x)), "12 and the menu no longer lists it");
await clearRow();
// previews: what the page lists, in another format
const facts = () => ev(() => [...document.querySelectorAll("#panel .k3-pn .k3-facts dt")].map((x) => x.textContent.trim()));
const fullOf = () => ev(() => { const x = document.querySelector("#panel .k3-pn"); return x ? decodeURIComponent(x.getAttribute("data-v2r-full") || "") : ""; });
const shortLists = () => ev(() => { const pn = document.querySelector("#panel .k3-pn"); return !!pn && [...pn.querySelectorAll("table")].every((t) => t.scrollWidth <= t.parentElement.clientWidth + 2 && t.querySelectorAll("tbody tr").length <= 5) && [...pn.querySelectorAll("tbody tr")].every((tr) => tr.getBoundingClientRect().height <= 44); });
const lacks = async (ps, pf) => (await msecs()).filter((t) => !/^(Overview|Details|Status|Summary)$/.test(t) && !ps.includes(t) && !pf.includes(t));
await H.go("assessments", 550); await eye("Expanded control set assessment");
const aS = await psecs(), aF = await facts();
ok(/Control assessment/.test(await plabel()) && ["Plan approval", "Controls in the plan", "Objectives", "Requests", "Results", "Findings"].every((x) => aS.includes(x)) && aF.includes("Plan") && (await fullOf()) === "assessment--exp", "12 an assessment's eye opens a preview of its own: its facts, then every tab and section of its page", [await plabel(), aS, aF]);
ok((await shortLists()) && (await ev(() => [...document.querySelectorAll("#panel .k3-pk-all")].map((a) => a.getAttribute("href")))).includes("#assessment--exp--objectives"), "12 each as a short list: five rows at most, one line each, no wider than the panel, with a way to all of them");
await closePanel(); await clickRow("Expanded control set assessment");
ok((await hash()) === "assessment--exp" && !(await lacks(aS, aF)).length, "12 its row goes to the page, which lists nothing the preview lacks", await lacks(aS, aF));
await H.go("assessments-checks", 550); await ev(() => document.querySelector("#main .k3-eye").click()); await w(500);
const cS = await psecs();
ok(/Monitoring check/.test(await plabel()) && ["What it covers", "Runs", "Findings"].every((x) => cS.includes(x)), "12 a monitoring check's preview lists what it covers, its runs and its findings", cS);
await closePanel();
await H.go("findings", 550); await ev(() => document.querySelector("#main .k3-eye").click()); await w(500);
const fS = await psecs(), fF = await facts(), fFull = await fullOf();
ok(["Plan", "Risk", "Control"].every((x) => fS.includes(x)) && fS.some((x) => /^Components/.test(x)) && (await shortLists()), "12 a finding's preview lists its plan, its risk, its control and its components", fS);
await closePanel(); await H.go(fFull, 550);
ok(/^finding--/.test(fFull) && !(await lacks(fS, fF)).length, "12 and its page lists nothing the preview lacks", [fFull, await lacks(fS, fF)]);
await H.go("risks", 550); await clearRow(); await ev(() => document.querySelector("#main .k3-eye").click()); await w(500);
const rS = await psecs(), rF = await facts(), rFull = await fullOf();
ok(["Findings behind it", "ATT&CK techniques"].every((x) => rS.includes(x)) && (await shortLists()), "12 a risk's preview lists the findings behind it and its techniques", rS);
await closePanel(); await H.go(rFull, 550);
ok(/^risk--/.test(rFull) && !(await lacks(rS, rF)).length, "12 and its page lists nothing the preview lacks", [rFull, await lacks(rS, rF)]);
await H.go("authorization-monitoring", 550);
ok(await ev(() => { const trs = [...document.querySelectorAll('#main .k3-table tbody tr[data-go^="assessment--"]')]; return trs.length > 0 && trs.every((tr) => !!tr.querySelector(".k3-eye")); }), "12 on Authorization, every row that goes to an assessment has its eye");
await ev(() => document.querySelector('#main tr[data-go^="assessment--"] .k3-eye').click()); await w(500);
ok(/Monitoring check/.test(await plabel()) && (await psecs()).includes("Runs"), "12 and it opens the check's preview", await plabel());
await closePanel();
'''
sub('''
// ——— V3 off ———''', new + '''
// ——— V3 off ———''')
io.open("walk.mjs", "w", encoding="utf-8").write(t)
