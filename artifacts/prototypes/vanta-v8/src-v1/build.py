# Build the prototype into one HTML file: python3 -I build.py <out-name> [module.js ...]
# With no modules named, every mod-*.js in this folder is included, in name order.
import glob, os, sys
here = os.path.dirname(os.path.abspath(__file__))
name = sys.argv[1] if len(sys.argv) > 1 else "prototype"
mods = sys.argv[2:] or sorted(os.path.basename(p) for p in glob.glob(os.path.join(here, "mod-*.js")))
read = lambda f: open(os.path.join(here, f)).read()
css = read("core.css") + "".join("\n" + read(m[:-3] + ".css") for m in mods if os.path.exists(os.path.join(here, m[:-3] + ".css")))
js = read("core.js") + "".join(f"\n// ——— module {m} ———\n" + read(m) for m in mods) + "\nwindow.PA.start();\n"
html = read("meta.html") + "<style>\n" + css + "\n</style>\n\n" + read("study.html") + "\n\n" + read("shell.html") + "\n<script>\n" + js + "</script>\n"
os.makedirs(os.path.join(here, "out"), exist_ok=True)
open(os.path.join(here, "out", name + ".html"), "w").write(html)
print("built out/%s.html with %d modules: %s" % (name, len(mods), ", ".join(mods) or "none"))
