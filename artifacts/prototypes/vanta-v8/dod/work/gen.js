// Build the compact data literal for mod-v8-dod.js from the parsed DISA benchmarks, the CCI list and SP 800-160 Vol. 1.
// node gen.js > data.json   (reads ./*.json written by xccdf.js, cci.js and the p160 extract)
const fs = require("fs");
const J = (f) => JSON.parse(fs.readFileSync(__dirname + "/" + f, "utf8"));
const CCI = J("cci.json"), P160 = J("p160.json");
const BM = {
  rhel9: ["rhel9-v2r9.json", "Red Hat Enterprise Linux 9", "RHEL 9"],
  rhel9n: ["rhel9-v2r10.json", "Red Hat Enterprise Linux 9", "RHEL 9"],
  swndm: ["ios-sw-ndm-v3r6.json", "Cisco IOS Switch NDM", "Cisco IOS Switch NDM"],
  swndmn: ["ios-sw-ndm-v3r7.json", "Cisco IOS Switch NDM", "Cisco IOS Switch NDM"],
  swl2s: ["ios-sw-l2s-v3r1.json", "Cisco IOS Switch L2S", "Cisco IOS Switch L2S"],
  rtndm: ["xe-rt-ndm-v3r7.json", "Cisco IOS XE Router NDM", "Cisco IOS XE Router NDM"],
  rtrtr: ["xe-rt-rtr-v3r5.json", "Cisco IOS XE Router RTR", "Cisco IOS XE Router RTR"],
  win11: ["win11-v2r9.json", "Microsoft Windows 11", "Windows 11"],
  asd: ["asd-v6r5.json", "Application Security and Development", "ASD"],
};
const src = {};
for (const [k, [f]] of Object.entries(BM)) src[k] = J(f);
const SEV = { high: 1, medium: 2, low: 3 };
const vnum = (v) => v.replace("V-", "");
const rev = (r) => r.rule.replace(/^SV-\d+/, "").replace(/_rule$/, "");
const iso = (s) => { const m = s.match(/(\d\d) (\w{3}) (\d{4})/); const mo = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" }[m[2]]; return `${m[3]}-${mo}-${m[1]}`; };

// ——— Statuses for WS-X90's checklists (Example), by rule. O open, N not a finding, A not applicable, R not reviewed.
const pickBy = (rules, taken, sev, re, n, stride = 1) => {
  const out = [];
  const cand = rules.filter((r) => (!sev || r.sev === sev) && re.test(r.title) && !taken.has(r.v));
  for (let off = 0; off < stride && out.length < n; off += Math.max(1, Math.floor(stride / 3)))
    for (let i = off; i < cand.length && out.length < n; i += stride) if (!taken.has(cand[i].v)) { out.push(cand[i].v); taken.add(cand[i].v); }
  for (let i = 0; i < cand.length && out.length < n; i++) if (!taken.has(cand[i].v)) { out.push(cand[i].v); taken.add(cand[i].v); }
  return out;
};
const fillBy = (rules, taken, sev, n, stride = 7) => { // anything left, spread through the benchmark
  const out = [], cand = rules.filter((r) => (!sev || r.sev === sev) && !taken.has(r.v));
  for (let i = 3; i < cand.length && out.length < n; i += stride) { out.push(cand[i].v); taken.add(cand[i].v); }
  for (let i = 0; i < cand.length && out.length < n; i++) if (!taken.has(cand[i].v)) { out.push(cand[i].v); taken.add(cand[i].v); }
  return out;
};
function assign(key, plan) {
  const rules = src[key].rules, taken = new Set(), st = {};
  const put = (list, s) => list.forEach((v) => { st[v] = s; taken.add(v); });
  for (const [s, fixed] of plan.fixed || []) put(fixed, s);
  for (const [s, sev, re, n, stride] of plan.pick || []) put(pickBy(rules, taken, sev, re, n - 0, stride), s);
  for (const [s, sev, n, stride] of plan.fill || []) put(fillBy(rules, taken, sev, n, stride), s);
  return rules.map((r) => st[r.v] || "N").join("");
}
const count = (rules, s) => { const c = { O: [0, 0, 0], N: 0, A: 0, R: 0 }; rules.forEach((r, i) => { if (s[i] === "O") c.O[SEV[r.sev] - 1]++; else c[s[i]]++; }); return c; };

const ST = {};
ST.rhel9 = assign("rhel9", {
  fixed: [["O", ["V-258230", "V-257789", "V-257824"]]],
  pick: [
    ["A", "medium", /graphical/i, 12, 1],
    ["O", "medium", /audit|faillock|tmux|USBGuard|AIDE|rsyslog|chrony|pwquality|SSH|sshd|sudo|umask|core dump|kernel/i, 21, 13],
    ["O", "low", /./, 5, 2],
    ["R", "medium", /documented|approved|authorized|unless required|organization|must be configured to use|must be a/i, 33, 3],
  ],
});
ST.win11 = assign("win11", {
  fixed: [["O", ["V-253416"]], ["A", ["V-253254", "V-253282", "V-253364", "V-253365", "V-253379", "V-253491"]]],
  pick: [
    ["O", "medium", /audit|password|account|lock|SMB|PowerShell|Defender|firewall|camera|Bluetooth|remote|logon|session/i, 17, 6],
    ["O", "low", /./, 3, 3],
    ["R", "medium", /must be|only|backup|review|configured to/i, 18, 7],
  ],
});
ST.swndm = assign("swndm", { fixed: [["O", ["V-220604", "V-220606", "V-220600"]], ["A", ["V-220619"]], ["R", ["V-220618"]]] });
ST.swl2s = assign("swl2s", { fixed: [["O", ["V-220641", "V-220642", "V-220636"]], ["A", ["V-220624", "V-220637", "V-220629"]]] });
ST.rtndm = assign("rtndm", {
  pick: [["O", "medium", /NTP|audit failure/i, 2, 1], ["A", "medium", /certificate/i, 1, 1], ["R", "medium", /backup|account of last resort|concurrent/i, 3, 1]],
});
ST.rtrtr = assign("rtrtr", {
  pick: [
    ["A", null, /BGP|multicast|PIM|MSDP|MPLS|LDP|IGMP|MLD|VRF|PE router|provider edge|Rendezvous|6to4|ISATAP|Teredo|IPv6/i, 45, 1],
    ["O", null, /log/i, 1, 1],
    ["O", "medium", /uRPF|unicast reverse|ingress|egress|filter|ACL|deny/i, 3, 4],
    ["O", "low", /./, 2, 3],
    ["R", "medium", /./, 5, 9],
  ],
});
ST.asd = assign("asd", {
  pick: [
    ["A", null, /SAML|WS-Security|WS_Security|cookie|web|HTTP|browser|SOAP|session ID|URL|XML/i, 25, 1],
    ["O", "medium", /input|validat|error|log|audit|session|password|crypt|vulnerab|injection|overflow/i, 9, 5],
    ["O", "low", /./, 2, 5],
    ["R", "medium", /program manager|tester|test|design|code review|configuration management|training|documented|plan|process|must be reviewed/i, 48, 2],
  ],
});

// ——— The checklists: one per asset and STIG.
const CK = [
  { slug: "mission-computer-rhel9", ast: "AST-109001", asset: "Mission Computer", lru: "LRU-001", bm: "rhel9", tool: "STIG Viewer 2.18", fmt: "CKL", imp: "2026-10-13", by: "Joel Barrantes", file: "disa-stig-checklist-mission-computing-rhel-9.ckl", sha: "92da0d70283b16d143d492b7d104a482d4c18c754a181d50ee7b13f82839b666", real: 1, cadence: 90, owner: "Joel Barrantes", prev: "2026-07-13" },
  { slug: "mission-computer-asd", ast: "AST-109001", asset: "Mission Computer", lru: "LRU-001", bm: "asd", tool: "STIG Viewer 3.6", fmt: "CKLB", imp: "2026-11-04", by: "Ingrid Solberg", file: "LRU-001_mission-software_ASD_V6R5.cklb", sha: "3be1c0f7a2d94e8b51c6a0d7e2f94b38c5a17d6e0f2b9c84d1a3e5f7b9c0d2e4", cadence: 180, owner: "Ingrid Solberg", sub: "Mission software, OFP 7.3", prev: null },
  { slug: "ethernet-switch-ndm", ast: "AST-109009", asset: "Internal Ethernet Switch", lru: "LRU-009", bm: "swndm", tool: "STIG Viewer 2.18", fmt: "CKL", imp: "2026-08-18", by: "Priya Raghavan", file: "LRU-009_Cisco_IOS_Switch_NDM_V3R6.ckl", sha: "a41c9e07b3d28f6e19c5a0b7d4e83f2c6b1a9d0e7f3c58b2a6d4e1f09c7b3a5d", cadence: 90, owner: "Priya Raghavan", queued: 1, prev: "2026-05-12" },
  { slug: "ethernet-switch-l2s", ast: "AST-109009", asset: "Internal Ethernet Switch", lru: "LRU-009", bm: "swl2s", tool: "STIG Viewer 2.18", fmt: "CKL", imp: "2026-08-18", by: "Priya Raghavan", file: "LRU-009_Cisco_IOS_Switch_L2S_V3R1.ckl", sha: "5d0e2b8c4f17a93e6c2d0b5a8e4f1c7d3b9a6e2f0c8d5b1a7e3f9c4d2b6a0e18", cadence: 90, owner: "Priya Raghavan", queued: 1, prev: "2026-05-12" },
  { slug: "network-gateway-ndm", ast: "AST-109007", asset: "Protected Network Gateway", lru: "LRU-007", bm: "rtndm", tool: "Evaluate-STIG 1.2508.1", fmt: "CKLB", imp: "2026-09-30", by: "evaluate-stig-runner", auto: 1, file: "LRU-007_Cisco_IOS-XE_Router_NDM_V3R7.cklb", sha: "c7f3a9e15b2d80c4e6a1f7d3b9c25e8a0d4f6b1c3e7a9d5f2b8c0e4a6d1f3b97", cadence: 90, owner: "Joel Barrantes", prev: "2026-06-30" },
  { slug: "network-gateway-rtr", ast: "AST-109007", asset: "Protected Network Gateway", lru: "LRU-007", bm: "rtrtr", tool: "Evaluate-STIG 1.2508.1", fmt: "CKLB", imp: "2026-09-30", by: "evaluate-stig-runner", auto: 1, file: "LRU-007_Cisco_IOS-XE_Router_RTR_V3R5.cklb", sha: "0e8b4d2f6a1c97e3b5d0f8a2c4e6b9d1f3a5c7e9b0d2f4a6c8e1b3d5f7a9c0e2", cadence: 90, owner: "Joel Barrantes", prev: "2026-06-30" },
  { slug: "maintenance-laptop-win11", ast: "AST-109019", asset: "Maintenance Laptop", lru: "LRU-019", bm: "win11", tool: "SCC 5.10.1", fmt: "XCCDF", imp: "2026-10-14", by: "Joel Barrantes", file: "scap-compliance-scan-maintenance-laptop-windows-11.xccdf.xml", sha: "68d0f8194eff8eaae8945b05b6daa0139c4bf1eb6976dab05ec18737ab0d971a", real: 1, cadence: 30, owner: "Joel Barrantes", prev: "2026-09-14" },
];

// ——— Hand-written finding details (Example) for the rules a reader opens first; the rest are derived from the check text.
const FD = {
  "mission-computer-rhel9:V-258230": "fips-mode-setup --check returns \"FIPS mode is disabled.\" MC-FW 4.2.1 boots without fips=1; key operations run on the Cryptographic Services Module (LRU-003), not in the kernel's crypto API.",
  "mission-computer-rhel9:V-257789": "grub2 superusers is \"root\" on the MC-FW 4.2.1 image. The Secure Boot Controller (LRU-002) verifies the chain, but single-user mode is reachable from the maintenance console with the shared name.",
  "mission-computer-rhel9:V-257824": "dnf.conf has clean_requirements_on_remove unset; openssh 8.7p1 packages remain beside 9.8p1 after the CVE-2024-6387 update on the maintenance image.",
  "maintenance-laptop-win11:V-253416": "SCC result: fail. HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WinRM\\Client\\AllowBasic is 1 on the depot image MLT 2026.06; the flightline diagnostic tool still connects with Basic.",
  "ethernet-switch-ndm:V-220604": "snmp-server group MGMT v3 auth uses MD5 on IES-OS 15.2(7); the check requires SHA (FIPS-validated HMAC).",
  "ethernet-switch-ndm:V-220606": "ntp server 10.90.4.2 is configured without ntp authenticate or a trusted key.",
  "ethernet-switch-l2s:V-220641": "Ports Gi1/0/19 to Gi1/0/24 are shut down but remain in VLAN 1.",
  "ethernet-switch-l2s:V-220642": "Gi1/0/7 (Payload Telemetry Unit) is an access port in VLAN 1.",
};
const CMT = {
  "mission-computer-rhel9:V-258230": [["Priya Raghavan", "ISSO", "Oct 15", "FIPS mode stays off while LRU-003 does every key operation. Either MC-FW 4.3 boots with fips=1 or we ask the AO for a risk acceptance."], ["Joel Barrantes", "ISSM", "Oct 16", "MC-FW 4.3 is planned for Jan 30. No acceptance unless it slips; this is CAT I and was due Nov 12."]],
  "mission-computer-rhel9:V-257824": [["Ingrid Solberg", "Security engineer", "Nov 2", "Taking version 2 of the Mission Computer under the CVE-2024-6387 item removes the old packages; linking that POA&M item."]],
  "maintenance-laptop-win11:V-253416": [["Joel Barrantes", "ISSM", "Oct 20", "Same password-only path the cyber T&E finding names. Tracked under the switch exchange item."]],
};
const POAM = {
  "mission-computer-rhel9:V-257824": ["def9d690", "Remediate CVE-2024-6387 on the Mission Computer"],
  "maintenance-laptop-win11:V-253416": ["65d17707", "Remove the password-only path and make the switch exchange mutual"],
  "ethernet-switch-ndm:V-220604": ["65d17707", "Remove the password-only path and make the switch exchange mutual"],
};
// The gateway's logging rule answered by the boundary gateway item.
{
  const r = src.rtrtr.rules, s = ST.rtrtr;
  const i = r.findIndex((x, k) => s[k] === "O" && /log/i.test(x.title));
  if (i >= 0) POAM["network-gateway-rtr:" + r[i].v] = ["08b61d0b", "Restore state-level visibility and operator attribution at the boundary gateway"];
}

const trim = (s, n) => { s = String(s || "").replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + " …" : s; };
const firstCmd = (check) => { const m = String(check || "").match(/^\s*\$ (.+)$/m); return m ? m[1].trim() : ""; };

// ——— Rows, details, CCIs.
const out = { bm: {}, ck: [], det: {}, fd: {}, cm: CMT, poam: POAM, cci: {}, ccid: {}, newer: {} };
const usedCci = new Set(), detCci = new Set();
const pack = (key) => src[key].rules.map((r) => { r.cci.forEach((c) => usedCci.add(c)); return [vnum(r.v), rev(r), SEV[r.sev], r.title.replace(/\|/g, "/"), r.cci.map((c) => +c.slice(4)).join(",")].join("|"); }).join("\n");
for (const k of ["rhel9", "swndm", "swl2s", "rtndm", "rtrtr", "win11", "asd"]) {
  const b = src[k].bench, rules = src[k].rules;
  const n = [0, 0, 0]; rules.forEach((r) => n[SEV[r.sev] - 1]++);
  out.bm[k] = { t: BM[k][1], s: BM[k][2], ver: `V${b.version}R${b.release.match(/Release: (\d+)/)[1]}`, date: iso(b.release), n, rows: pack(k) };
}
for (const c of CK) {
  const s = ST[c.bm], rules = src[c.bm].rules;
  out.ck.push({ ...c, st: s, c: count(rules, s) });
  rules.forEach((r, i) => {
    const key = `${c.slug}:${r.v}`;
    const want = s[i] === "O" || POAM[key] || CMT[key] || (c.bm === "rhel9" && r.v === "V-257824") || (c.bm === "swndm" && r.v === "V-220621") || (c.bm === "swl2s" && r.v === "V-220623");
    if (!want) return;
    if (!out.det[`${c.bm}:${vnum(r.v)}`]) { out.det[`${c.bm}:${vnum(r.v)}`] = [r.stigId, trim(r.disc, 420), trim(r.check, 700), trim(r.fix, 520)]; r.cci.forEach((x) => detCci.add(x)); }
    if (s[i] === "O") {
      const cmd = firstCmd(r.check);
      out.fd[key] = FD[key] || (cmd ? `Ran "${trim(cmd, 110)}" on ${c.lru}: the output does not show the setting the check requires.` : `Reviewed the configuration exported from ${c.lru} on ${c.imp}: the setting the check requires is not present.`);
    }
  });
}
// The two RHEL 9 V2R10 rules a new release adds, with their text.
const nr = src.rhel9n.rules, or = src.rhel9.rules, A = new Map(or.map((r) => [r.v, r])), B = new Map(nr.map((r) => [r.v, r]));
const added = nr.filter((r) => !A.has(r.v)), removed = or.filter((r) => !B.has(r.v));
added.forEach((r) => { out.det[`rhel9:${vnum(r.v)}`] = [r.stigId, trim(r.disc, 420), trim(r.check, 700), trim(r.fix, 520)]; r.cci.forEach((x) => { usedCci.add(x); detCci.add(x); }); });
const retitled = nr.filter((r) => A.has(r.v) && A.get(r.v).title !== r.title).map((r) => [vnum(r.v), A.get(r.v).title, r.title]);
const changed = (f) => nr.filter((r) => A.has(r.v) && A.get(r.v)[f] !== r[f]).length;
out.newer.rhel9 = { ver: "V2R10", date: iso(src.rhel9n.bench.release), n: [29, 401, 15], total: nr.length,
  added: added.map((r) => [vnum(r.v), rev(r), SEV[r.sev], r.title, r.cci.map((c) => +c.slice(4)).join(",")]),
  removed: removed.map((r) => [vnum(r.v), SEV[r.sev], r.title]), retitled, fix: changed("fix"), check: changed("check"), revs: nr.filter((r) => A.has(r.v) && A.get(r.v).rule !== r.rule).length };
const sn = src.swndmn.rules, so = new Map(src.swndm.rules.map((r) => [r.v, r]));
out.newer.swndm = { ver: "V3R7", date: iso(src.swndmn.bench.release), n: [8, 35, 0], total: sn.length, added: [], removed: [], retitled: [],
  fixed: sn.filter((r) => so.has(r.v) && so.get(r.v).fix !== r.fix).map((r) => [vnum(r.v), SEV[r.sev], r.title]),
  fix: sn.filter((r) => so.has(r.v) && so.get(r.v).fix !== r.fix).length, check: sn.filter((r) => so.has(r.v) && so.get(r.v).check !== r.check).length, revs: sn.filter((r) => so.has(r.v) && so.get(r.v).rule !== r.rule).length };
for (const c of usedCci) { const x = CCI[c]; out.cci[+c.slice(4)] = x ? x[1].join(";") : ""; }
for (const c of detCci) { const x = CCI[c]; if (x) out.ccid[+c.slice(4)] = x[0]; }

// ——— NIST SP 800-160 Vol. 1 Rev. 1: groups, processes, outcomes as printed.
const items = P160.items;
out.p160 = { src: { title: P160.source.title, url: P160.source.url, published: P160.source.published, pages: P160.source.pages },
  groups: items.filter((i) => i.kind === "process-group").map((g) => [g.code.replace("group.", ""), g.title, items.filter((p) => p.parent === g.code).map((p) => p.code.replace("process.", ""))]),
  proc: Object.fromEntries(items.filter((i) => i.kind === "process").map((p) => [p.code.replace("process.", ""), [p.title, p.props.section, items.filter((o) => o.parent === p.code).sort((a, b) => a.ordinal - b.ordinal).map((o) => o.title)]])) };

process.stdout.write(JSON.stringify(out));
for (const c of out.ck) console.error(c.slug, JSON.stringify(c.c), "len", c.st.length);
console.error("det", Object.keys(out.det).length, "cci", Object.keys(out.cci).length, "ccid", Object.keys(out.ccid).length, "fd", Object.keys(out.fd).length, "poam", JSON.stringify(Object.keys(out.poam)));
