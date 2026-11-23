"""Generate the Drata tab's data: proto/mod-zzzz-v4-9drba-data.js (window.PA.DRBA).

Usage: python3 -I gen.py
Reads v4dr/RECS.md, v4dr/<lane>/notes.json (K A B C F, any missing is skipped), Drata's images/index.json
(evidence links: the article, the image number, what it shows; the images themselves are never published),
and v4dr/lead/shots/ (cur-<id>.jpg, aft-<id>.jpg; served as dr/<file>).
"""
import json
import re
from pathlib import Path

V4 = Path(__file__).resolve().parent.parent
PROTO = V4.parent / "proto"
DRATA = Path("/Users/joseflagorio/Development/program_assurance-ux-proposal/docs/products/drata")
SHOTS = V4 / "lead" / "shots"

GROUPS = [("controls", "Controls"), ("evidence", "Evidence"), ("automation", "Automated compliance"), ("ui", "The UI")]
HEAD2GROUP = {"Controls": "controls", "Evidence": "evidence", "Automated compliance": "automation", "The UI": "ui"}

recs, leave, group = [], [], None
for line in (V4 / "RECS.md").read_text().splitlines():
    m = re.match(r"^## (.+)$", line)
    if m:
        group = HEAD2GROUP.get(m.group(1).strip(), "leave" if m.group(1).startswith("Leave") else None)
        continue
    m = re.match(r"^(\d+)\. \*\*\[([^\]]+)\] (.+?)\*\*", line)
    if m and group in HEAD2GROUP.values():
        recs.append({"n": int(m.group(1)), "lanes": m.group(2), "title": m.group(3).rstrip("."), "group": group})
        continue
    m = re.match(r"^- \*\*(.+?)\*\*\s*(.*)$", line)
    if m and group == "leave":
        leave.append((m.group(1) + " " + m.group(2)).strip())

index = {e["file"][len("images/"):] if e["file"].startswith("images/") else e["file"]: e for e in json.loads((DRATA / "images/index.json").read_text())}


def ev(path):
    p = path.split("images/", 1)[-1]
    e = index.get(p)
    if not e:
        return None
    return {"u": e["url"], "t": e["title"], "n": e["n"], "s": e.get("screen") or "", "f": "docs/products/drata/" + e["file"]}


pairs, comps, derived, conflicts, opened, added, lanes_seen = [], [], [], [], [], [], []
for lane in ("K", "A", "B", "C", "F"):
    f = V4 / lane / "notes.json"
    if not f.exists():
        continue
    try:
        d = json.loads(f.read_text())
    except json.JSONDecodeError as err:
        print("unreadable", f, err)
        continue
    lanes_seen.append(lane)
    for p in d.get("pairs") or []:
        if not isinstance(p, dict) or not p.get("id"):
            continue
        if (p.get("after") or {}).get("route") == "dr-components":
            # The gallery is the tab's own Components section; its changes count through the components' rec lists.
            continue
        ch = []
        for c in p.get("changes") or []:
            if not isinstance(c, dict):
                continue
            links = [x for x in (ev(e) for e in (c.get("ev") or []) if isinstance(e, str)) if x]
            ch.append({k: c.get(k) for k in ("n", "rec", "title", "text", "drata")} | {"ev": links})
        pid = p["id"]
        cur = SHOTS / f"cur-{pid}.jpg"
        aft = SHOTS / f"aft-{pid}.jpg"
        pairs.append({
            "id": pid, "lane": lane, "title": p.get("title") or pid, "group": p.get("group") or "ui",
            "new": bool(p.get("new")), "current": p.get("current") or None, "after": p.get("after") or None,
            "cur": f"dr/{cur.name}" if cur.exists() else None, "aft": f"dr/{aft.name}" if aft.exists() else None,
            "changes": ch,
        })
    for c in d.get("components") or []:
        if isinstance(c, dict) and c.get("id"):
            comps.append({"id": c["id"], "rec": c.get("rec") or [], "used": c.get("used") or "", "lane": lane})
    derived += [f"{lane}: {x}" for x in d.get("derived") or [] if isinstance(x, str)]
    conflicts += [f"{lane}: {x}" for x in d.get("conflicts") or [] if isinstance(x, str)]
    opened += [f"{lane}: {x}" for x in d.get("open") or [] if isinstance(x, str)]
    for a in d.get("added") or []:
        if isinstance(a, dict) and a.get("text") and a.get("route"):
            added.append({k: a.get(k) for k in ("text", "pair", "route", "click", "scroll")} | {"lane": lane})

order = {k: i for i, (k, _) in enumerate(GROUPS)}
pairs.sort(key=lambda p: (order.get(p["group"], 9), p["new"], p["lane"]))
covered = {}
for p in pairs:
    for c in p["changes"]:
        r = c.get("rec")
        for n in (r if isinstance(r, list) else [r]):
            if isinstance(n, int):
                covered.setdefault(n, []).append(p["id"])
for c in comps:
    for n in c["rec"]:
        if isinstance(n, int):
            covered.setdefault(n, [])

checks = []
cf = V4 / "lead" / "checks.json"
if cf.exists():
    checks = json.loads(cf.read_text())

data = {
    "groups": [{"key": k, "label": l} for k, l in GROUPS],
    "recs": [r | {"pairs": covered.get(r["n"], [])} for r in recs],
    "pairs": pairs, "components": comps, "leave": leave,
    "derived": derived, "conflicts": conflicts, "open": opened, "added": added, "checks": checks, "lanes": lanes_seen,
}
out = PROTO / "mod-zzzz-v4-9drba-data.js"
out.write_text("// Generated by SP/vanta/v4dr/lead/gen.py from each lane's notes.json; do not edit.\nwindow.PA = window.PA || {};\nwindow.PA.DRBA = " + json.dumps(data, ensure_ascii=False, indent=0) + ";\n")
miss = [r["n"] for r in recs if r["n"] not in covered]
print(f"{len(added)} added, {len(opened)} open; {len(recs)} recs, {len(pairs)} pairs, {len(comps)} components, lanes {lanes_seen}; recs with no change yet: {miss}")
