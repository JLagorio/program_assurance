// What changed between two releases of a benchmark: node diff.js old.json new.json
const [a, b] = process.argv.slice(2).map((f) => require("./" + f));
const A = new Map(a.rules.map((r) => [r.v, r])), B = new Map(b.rules.map((r) => [r.v, r]));
const added = b.rules.filter((r) => !A.has(r.v)), removed = a.rules.filter((r) => !B.has(r.v));
const sev = [], title = [], cci = [], rev = [], fix = [], check = [];
for (const r of b.rules) { const o = A.get(r.v); if (!o) continue;
  if (o.sev !== r.sev) sev.push([r.v, o.sev, r.sev, r.title]);
  if (o.title !== r.title) title.push([r.v, o.title, r.title]);
  if (o.cci.join() !== r.cci.join()) cci.push([r.v, o.cci.join(" "), r.cci.join(" ")]);
  if (o.rule !== r.rule) rev.push([r.v, o.rule, r.rule]);
  if (o.fix !== r.fix) fix.push(r.v); if (o.check !== r.check) check.push(r.v); }
console.log(a.bench.release, "->", b.bench.release);
console.log("added", added.length, added.map((r) => r.v + " " + r.sev + " " + r.title.slice(0, 90)).join("\n  "));
console.log("removed", removed.length, removed.map((r) => r.v + " " + r.sev + " " + r.title.slice(0, 90)).join("\n  "));
console.log("severity", sev.length, sev.map((x) => x.join(" | ").slice(0, 160)).join("\n  "));
console.log("title", title.length, title.slice(0, 6).map((x) => x.join(" | ").slice(0, 220)).join("\n  "));
console.log("cci", cci.length, cci.slice(0, 6).map((x) => x.join(" | ")).join("\n  "));
console.log("rule revision", rev.length, "fix text", fix.length, "check text", check.length);
