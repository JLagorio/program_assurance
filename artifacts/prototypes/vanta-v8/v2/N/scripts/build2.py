# Build like proto/build.py, but with some modules swapped for copies: python3 -I build2.py <out.html> <override-dir>
import glob, os, sys
here = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto"
out, ov = sys.argv[1], sys.argv[2]
mods = sorted(os.path.basename(p) for p in glob.glob(os.path.join(here, "mod-*.js")))
def read(f):
    p = os.path.join(ov, f)
    return open(p if os.path.exists(p) else os.path.join(here, f)).read()
css = read("core.css") + "".join("\n" + read(m[:-3] + ".css") for m in mods if os.path.exists(os.path.join(here, m[:-3] + ".css")))
js = read("core.js") + "".join(f"\n// ——— module {m} ———\n" + read(m) for m in mods) + "\nwindow.PA.start();\n"
html = read("meta.html") + "<style>\n" + css + "\n</style>\n\n" + read("study.html") + "\n\n" + read("shell.html") + "\n<script>\n" + js + "</script>\n"
open(out, "w").write(html)
print("built", out, len(mods))
