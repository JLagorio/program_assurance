# apply (old, new) pairs to walk.mjs; each old must occur exactly once unless a count is given
import io, sys, json
pairs = json.load(open(sys.argv[1]))
t = io.open("walk.mjs", encoding="utf-8").read()
for p in pairs:
    old, new = p[0], p[1]; n = p[2] if len(p) > 2 else 1
    c = t.count(old)
    if c != n: print("MISMATCH", c, "!=", n, ":", old[:100]); sys.exit(1)
    t = t.replace(old, new)
io.open("walk.mjs", "w", encoding="utf-8").write(t)
print("applied", len(pairs))
