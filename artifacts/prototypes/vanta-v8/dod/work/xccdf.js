// Parse a DISA manual XCCDF benchmark: node xccdf.js <in.xml> <out.json>. Regex-based, read-only.
const fs = require("fs");
const x = fs.readFileSync(process.argv[2], "utf8");
const un = (s) => String(s || "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const tag = (src, t) => { const m = src.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? un(m[1]).trim() : ""; };
const head = x.slice(0, x.indexOf("<Group"));
const bench = {
  title: tag(head, "title"), version: tag(head, "version"),
  status: (head.match(/<status date="([^"]+)">([^<]*)</) || []).slice(1),
  release: (head.match(/<plain-text id="release-info">([^<]*)</) || [])[1] || "",
};
const rules = [];
for (const g of x.matchAll(/<Group id="(V-\d+)">([\s\S]*?)<\/Group>/g)) {
  const body = g[2];
  const r = body.match(/<Rule id="([^"]+)" weight="[^"]*" severity="([^"]+)">/);
  const desc = un(tag(body, "description"));
  rules.push({
    v: g[1], rule: r[1], sev: r[2],
    title: tag(body.slice(body.indexOf("<Rule")), "title"),
    stigId: tag(body, "version"),
    cci: [...body.matchAll(/<ident system="http:\/\/cyber.mil\/cci">(CCI-\d+)<\/ident>/g)].map((m) => m[1]),
    disc: (desc.match(/<VulnDiscussion>([\s\S]*?)<\/VulnDiscussion>/) || [, ""])[1].trim(),
    fix: tag(body, "fixtext"),
    check: tag(body, "check-content"),
  });
}
const by = { high: 0, medium: 0, low: 0 };
for (const r of rules) by[r.sev]++;
fs.writeFileSync(process.argv[3], JSON.stringify({ bench, rules }));
console.log(JSON.stringify(bench), "rules", rules.length, JSON.stringify(by));
