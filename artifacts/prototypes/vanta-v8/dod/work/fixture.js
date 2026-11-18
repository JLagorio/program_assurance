// Extract scanRuns and the STIG/SCAP nativeResults from the legacy fixture (read-only).
const fs = require("fs");
const src = fs.readFileSync(process.argv[2], "utf8");
const grab = (name) => {
  const i = src.indexOf(`export const ${name}`);
  const s = src.indexOf("[", src.indexOf("=", i));
  let depth = 0, j = s, inStr = null;
  for (; j < src.length; j++) {
    const ch = src[j];
    if (inStr) { if (ch === "\\") { j++; continue; } if (ch === inStr) inStr = null; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
    if (ch === "/" && src[j + 1] === "/") { j = src.indexOf("\n", j); continue; }
    if (ch === "/" && src[j + 1] === "*") { j = src.indexOf("*/", j) + 1; continue; }
    if (ch === "[") depth++;
    if (ch === "]") { depth--; if (!depth) break; }
  }
  return eval("(" + src.slice(s, j + 1) + ")");
};
const runs = grab("scanRuns"), native = grab("nativeResults");
const out = { runs, native: native.filter((n) => /STIG|SCAP/.test(n.format)) };
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log("runs", runs.length, "native", native.length, "stig/scap", out.native.length);
console.log([...new Set(native.map((n) => n.format))].join(", "));
