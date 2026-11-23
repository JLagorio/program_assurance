import sys
p = sys.argv[1]; s = open(p).read()
a = 'const ROUTES = ["dr-sources"].concat(IDS.flatMap((id) => [`dr-source--${id}`, `dr-source--${id}--runs`]), ["acas", "idp"].flatMap((id) => [`dr-source--${id}--scope`, `dr-source--${id}--matching`]));'
b = 'const ROUTES = ["dr-sources"].concat(IDS.flatMap((id) => [`dr-source--${id}`, `dr-source--${id}--runs`]), IDS.filter((id) => id !== "nessus-gw").flatMap((id) => [`dr-source--${id}--scope`, `dr-source--${id}--matching`]));'
assert a in s; s = s.replace(a, b)
anchor = "await b.close();\nconsole.log(fails.length"
flows = open(sys.argv[2]).read()
assert anchor in s; s = s.replace(anchor, flows + anchor, 1)
open(p, "w").write(s)
