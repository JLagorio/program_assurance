// Parse DISA's CCI list into { CCI: [definition, [rev5 index...], status] } (read-only input path as argv[2]).
const z = require("zlib"), fs = require("fs");
const x = z.gunzipSync(fs.readFileSync(process.argv[2])).toString();
const meta = (x.match(/<metadata>[\s\S]*?<\/metadata>/) || [""])[0];
console.log(meta.replace(/\s+/g, " ").slice(0, 300));
const out = {};
for (const m of x.matchAll(/<cci_item id="(CCI-\d+)">([\s\S]*?)<\/cci_item>/g)) {
  const body = m[2];
  const def = (body.match(/<definition>([\s\S]*?)<\/definition>/) || [, ""])[1].trim();
  const status = (body.match(/<status>([\s\S]*?)<\/status>/) || [, ""])[1].trim();
  const refs = [...body.matchAll(/<reference ([^>]*)\/>/g)].map((r) => Object.fromEntries([...r[1].matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]])));
  const rev5 = refs.filter((r) => /800-53/.test(r.title) && r.version === "5").map((r) => r.index);
  out[m[1]] = [def, rev5, status];
}
fs.writeFileSync(process.argv[3], JSON.stringify(out));
console.log("ccis", Object.keys(out).length, "with rev5", Object.values(out).filter((v) => v[1].length).length);
for (const c of ["CCI-000765", "CCI-001851", "CCI-000803", "CCI-000044", "CCI-000366", "CCI-000169", "CCI-001849", "CCI-000057", "CCI-000381", "CCI-001199", "CCI-001764", "CCI-002605", "CCI-001233"]) console.log(c, JSON.stringify(out[c]).slice(0, 260));
