/**
 * The assurance tree: the tailored baseline as one tree the workspace can read
 * six ways — baseline → family → control → enhancement → requirement row —
 * with the same aggregate on every node, so a sunburst wedge, a radial bar, a
 * treemap box and the inspector's numbers cannot disagree.
 *
 * Alongside it, the two projections the review canvases add: the closure
 * pipeline (where every requirement, finding and plan item sits on the way to
 * closed) and the requirement chain (one bead traced from obligation to risk,
 * every hop stating its own provenance). Nothing is stored; everything reads
 * the SCTM rows, findings, POA&M, risks and change impacts already in the app.
 */

import { changeById, type ChangeImpact, type ChangeRecord } from "@/lib/baselines";
import { impactForProgram } from "@/lib/change-impact";
import { nodeById } from "@/lib/composition";
import { isOpen, type Finding } from "@/lib/findings";
import { findingsForProgram } from "@/lib/program-actions";
import {
  findingsForRisk,
  poamItems,
  registerRisks,
  type PoamItem,
  type RegisterRisk,
} from "@/lib/register";
import type { ControlOrigination, Sctm, SctmRow, VerificationMethod } from "@/lib/sctm";

/* ── Tree ────────────────────────────────────────────────────────────────── */

export type NodeState = "sat" | "ns" | "nd";

/** The one aggregate every node carries. `w` is rows owed; N/A rows are counted apart. */
export type Agg = {
  w: number;
  sat: number;
  ns: number;
  nd: number;
  na: number;
  cur: number;
  sus: number;
  inv: number;
};

export type TreeKind = "root" | "family" | "control" | "enhancement" | "row";

export type TreeNode = {
  kind: TreeKind;
  id: string;
  label: string;
  title: string;
  children: TreeNode[];
  agg: Agg;
  /** Failing share of owed rows. */
  frac: number;
  st: NodeState;
  /** Control natural key for control, enhancement and row nodes. */
  control: string | null;
  family: string | null;
  /** Leaf only. */
  row: SctmRow | null;
  origination: ControlOrigination | null;
  method: VerificationMethod | null;
  responsibleParty: string | null;
  /** Distinct CN- ids under this node. */
  nodes: string[];
};

export type Tree = {
  root: TreeNode;
  index: Map<string, { node: TreeNode; path: string[] }>;
  byControl: Map<string, TreeNode>;
  controls: TreeNode[];
};

function emptyAgg(): Agg {
  return { w: 0, sat: 0, ns: 0, nd: 0, na: 0, cur: 0, sus: 0, inv: 0 };
}

function addAgg(a: Agg, b: Agg) {
  a.w += b.w;
  a.sat += b.sat;
  a.ns += b.ns;
  a.nd += b.nd;
  a.na += b.na;
  a.cur += b.cur;
  a.sus += b.sus;
  a.inv += b.inv;
}

function rowAgg(r: SctmRow): Agg {
  const a = emptyAgg();
  if (r.determination === "Not applicable") {
    a.na = 1;
    return a;
  }
  a.w = 1;
  if (r.determination === "Satisfied") a.sat = 1;
  else if (r.determination === "Other than satisfied") a.ns = 1;
  else a.nd = 1;
  const everAssessed = r.determination !== "Not assessed" || r.priorDetermination !== null;
  if (everAssessed) {
    if (r.currency === "Current") a.cur = 1;
    else if (r.currency === "Suspect") a.sus = 1;
    else a.inv = 1;
  }
  return a;
}

function stateOf(a: Agg): NodeState {
  return a.ns ? "ns" : a.nd ? "nd" : "sat";
}

function sortKey(id: string): [string, number, number] {
  const m = /^([A-Z]+)-(\d+)(?:\((\d+)\))?/.exec(id);
  return m ? [m[1]!, Number(m[2]), m[3] ? Number(m[3]) : 0] : [id, 0, 0];
}

function byCatalog(a: string, b: string): number {
  const [fa, na, ea] = sortKey(a);
  const [fb, nb, eb] = sortKey(b);
  return fa.localeCompare(fb) || na - nb || ea - eb;
}

function baseOf(id: string): string | null {
  const m = /^([A-Z]+-\d+)\((\d+)\)$/.exec(id);
  return m ? m[1]! : null;
}

function mkNode(
  kind: TreeKind,
  id: string,
  label: string,
  title: string,
  extra: Partial<TreeNode> = {},
): TreeNode {
  return {
    kind,
    id,
    label,
    title,
    children: [],
    agg: emptyAgg(),
    frac: 0,
    st: "sat",
    control: null,
    family: null,
    row: null,
    origination: null,
    method: null,
    responsibleParty: null,
    nodes: [],
    ...extra,
  };
}

function finish(n: TreeNode): Agg {
  const a = n.row ? rowAgg(n.row) : emptyAgg();
  const nodes = new Set<string>(n.row ? n.row.responsibleNodes : []);
  for (const k of n.children) {
    addAgg(a, finish(k));
    for (const id of k.nodes) nodes.add(id);
  }
  n.agg = a;
  n.frac = a.w ? a.ns / a.w : 0;
  n.st = stateOf(a);
  n.nodes = [...nodes];
  return a;
}

export function buildTree(sctm: Sctm, baselineLabel: string): Tree {
  const byControl = new Map<string, SctmRow[]>();
  for (const r of sctm.rows) {
    const list = byControl.get(r.control);
    if (list) list.push(r);
    else byControl.set(r.control, [r]);
  }

  const controlNodes = new Map<string, TreeNode>();
  for (const [id, rows] of byControl) {
    const first = rows[0]!;
    const node = mkNode(baseOf(id) ? "enhancement" : "control", id, id, first.controlTitle, {
      control: id,
      family: first.family,
      origination: first.origination,
      method: first.method,
      responsibleParty: first.responsibleParty,
    });
    node.children = rows.map((r) =>
      mkNode("row", r.key, r.requirement, r.statement, {
        control: id,
        family: r.family,
        row: r,
        origination: r.origination,
        method: r.method,
        responsibleParty: r.responsibleParty,
      }),
    );
    controlNodes.set(id, node);
  }

  const families = new Map<string, TreeNode>();
  const ids = [...controlNodes.keys()].sort(byCatalog);
  for (const id of ids) {
    const node = controlNodes.get(id)!;
    const base = baseOf(id);
    const parent = base ? controlNodes.get(base) : undefined;
    if (parent) {
      parent.children.push(node);
      continue;
    }
    const fam = node.family!;
    let f = families.get(fam);
    if (!f) {
      const rows = byControl.get(id)!;
      f = mkNode("family", fam, fam, rows[0]!.familyName, { family: fam });
      families.set(fam, f);
    }
    f.children.push(node);
  }

  const root = mkNode("root", "root", baselineLabel, baselineLabel);
  root.children = [...families.values()].sort((a, b) => a.id.localeCompare(b.id));
  finish(root);

  const index = new Map<string, { node: TreeNode; path: string[] }>();
  const walk = (n: TreeNode, path: string[]) => {
    index.set(n.id, { node: n, path });
    for (const k of n.children) walk(k, [...path, k.id]);
  };
  walk(root, []);

  return { root, index, byControl: controlNodes, controls: ids.map((id) => controlNodes.get(id)!) };
}

/** Resolve a drill path to its node, stopping at the last hop that exists. */
export function nodeAt(tree: Tree, path: string[]): TreeNode {
  let n = tree.root;
  for (const id of path) {
    const k = n.children.find((c) => c.id === id);
    if (!k) break;
    n = k;
  }
  return n;
}

/** Trust-zone allocations under a node: how many owed rows land on each zone. */
export function zoneAllocations(n: TreeNode): Map<string, number> {
  const per = new Map<string, number>();
  const walk = (x: TreeNode) => {
    if (x.row && x.row.determination !== "Not applicable") {
      for (const id of x.row.responsibleNodes) {
        const z = nodeById.get(id)?.zone ?? "External";
        per.set(z, (per.get(z) ?? 0) + 1);
      }
    }
    for (const k of x.children) walk(k);
  };
  walk(n);
  return per;
}

/* ── Closure pipeline ────────────────────────────────────────────────────── */

export type BeadTone = "sat" | "ns" | "nd" | "warn" | "info" | "neu";
export type BeadKind = "control" | "finding" | "poam";

export type Bead = {
  key: string;
  kind: BeadKind;
  id: string;
  tone: BeadTone;
  currency: SctmRow["currency"] | null;
  tip: string;
  /** The control the bead hangs off, for the chain. */
  control: string;
};

export type ClosureColumn = {
  key: "nd" | "nof" | "fnd" | "poam" | "val" | "end";
  label: string;
  note: string;
  action: string;
  tone: BeadTone;
  beads: Bead[];
};

export type ClosureData = {
  columns: ClosureColumn[];
  findings: Finding[];
  poams: PoamItem[];
  risks: RegisterRisk[];
  findingsByControl: Map<string, Finding[]>;
  poamsByControl: Map<string, PoamItem[]>;
};

const activeLife = new Set(["Open", "Triaged"]);
const validateLife = new Set(["Remediating", "Retest pending"]);
const doneLife = new Set(["Closed", "False positive", "Risk accepted"]);
const poamOpen = (p: PoamItem) => p.status === "Ongoing" || p.status === "Overdue";

function sevTone(f: Finding): BeadTone {
  return f.rawSeverity === "CAT I" ? "ns" : f.rawSeverity === "CAT II" ? "warn" : "info";
}

export function closureData(tree: Tree, programId: string, family: string | null): ClosureData {
  const controls = tree.controls.filter((c) => c.agg.w > 0);
  const inSet = new Set(controls.map((c) => c.id));
  const findings = findingsForProgram(programId).filter((f) => inSet.has(f.control));
  const findingsByControl = new Map<string, Finding[]>();
  for (const f of findings) {
    const l = findingsByControl.get(f.control);
    if (l) l.push(f);
    else findingsByControl.set(f.control, [f]);
  }
  const poams = poamItems.filter((p) => p.program === programId);
  const poamsByControl = new Map<string, PoamItem[]>();
  const controlOfPoam = new Map<string, string>();
  for (const p of poams) {
    const fs = findings.filter((f) => f.poam === p.id);
    const first = fs[0]?.control ?? null;
    if (first) controlOfPoam.set(p.id, first);
    for (const c of new Set(fs.map((f) => f.control))) {
      const l = poamsByControl.get(c);
      if (l) l.push(p);
      else poamsByControl.set(c, [p]);
    }
  }
  const risks = registerRisks.filter((r) => r.program === programId);

  const famOK = (c: string | null) => !family || c === family;
  const ctlFam = (id: string) => tree.byControl.get(id)?.family ?? null;
  const currencyOf = (c: TreeNode): SctmRow["currency"] | null => {
    const rows = c.children.filter((k) => k.row).map((k) => k.row!);
    if (rows.some((r) => r.currency === "Invalidated")) return "Invalidated";
    if (rows.some((r) => r.currency === "Suspect")) return "Suspect";
    return rows.length ? "Current" : null;
  };
  const ctlBead = (c: TreeNode, tone: BeadTone, tail: string): Bead => ({
    key: `control:${c.id}`,
    kind: "control",
    id: c.id,
    tone,
    currency: currencyOf(c),
    tip: `${c.id} — ${c.title} · ${tail}`,
    control: c.id,
  });
  const fndBead = (f: Finding, tone: BeadTone): Bead => ({
    key: `finding:${f.id}`,
    kind: "finding",
    id: f.id,
    tone,
    currency: null,
    tip: `${f.id} — ${f.title} · ${f.rawSeverity} · ${f.lifecycle} · ${f.control}`,
    control: f.control,
  });
  const poamBead = (p: PoamItem): Bead => ({
    key: `poam:${p.id}`,
    kind: "poam",
    id: p.id,
    tone:
      p.status === "Overdue"
        ? "ns"
        : p.status === "Completed"
          ? "sat"
          : p.status === "Risk accepted"
            ? "neu"
            : "warn",
    currency: null,
    tip: `${p.id} — ${p.title} · ${p.status} · due ${p.scheduledCompletion}`,
    control: controlOfPoam.get(p.id) ?? "",
  });

  const nd = controls.filter((c) => c.st === "nd" && famOK(c.family));
  const failing = controls.filter((c) => c.st === "ns" && famOK(c.family));
  const noF = failing.filter((c) => !findingsByControl.has(c.id));
  const fA = findings.filter((f) => activeLife.has(f.lifecycle) && famOK(ctlFam(f.control)));
  const fV = findings.filter((f) => validateLife.has(f.lifecycle) && famOK(ctlFam(f.control)));
  const fD = findings.filter((f) => doneLife.has(f.lifecycle) && famOK(ctlFam(f.control)));
  const pO = poams.filter((p) => poamOpen(p) && famOK(ctlFam(controlOfPoam.get(p.id) ?? "")));
  const pD = poams.filter((p) => !poamOpen(p) && famOK(ctlFam(controlOfPoam.get(p.id) ?? "")));

  const columns: ClosureColumn[] = [
    {
      key: "nd",
      label: "No determination",
      note: "Row decomposed, nothing assessed.",
      action: "Record determination",
      tone: "nd",
      beads: nd.map((c) =>
        ctlBead(
          c,
          "nd",
          `${c.agg.nd} of ${c.agg.w} rows undetermined · owner ${c.responsibleParty ?? "unassigned"}`,
        ),
      ),
    },
    {
      key: "nof",
      label: "Failed, no finding",
      note: "Nothing routes these to remediation.",
      action: "Create finding",
      tone: "ns",
      beads: noF.map((c) =>
        ctlBead(c, "ns", `Other than satisfied · no finding · evidence ${currencyOf(c) ?? "—"}`),
      ),
    },
    {
      key: "fnd",
      label: "Finding of record",
      note: "Open or triaged, awaiting a plan.",
      action: "Create POA&M item",
      tone: "ns",
      beads: fA.map((f) => fndBead(f, sevTone(f))),
    },
    {
      key: "poam",
      label: "In POA&M",
      note: "Dated, owned, resourced.",
      action: "Reassess",
      tone: "warn",
      beads: pO.map(poamBead),
    },
    {
      key: "val",
      label: "Ready for validation",
      note: "Needs a retest.",
      action: "Record determination",
      tone: "info",
      beads: fV.map((f) => fndBead(f, "info")),
    },
    {
      key: "end",
      label: "Closed or accepted",
      note: "Off the worklist.",
      action: "Export",
      tone: "sat",
      beads: [
        ...fD.map((f) => fndBead(f, f.lifecycle === "Closed" ? "sat" : "neu")),
        ...pD.map(poamBead),
      ],
    },
  ];

  return { columns, findings, poams, risks, findingsByControl, poamsByControl };
}

/* ── Requirement chain ───────────────────────────────────────────────────── */

export type Hop = {
  t: string;
  l: string;
  tone: BeadTone;
  m: string;
  mono?: boolean;
};

export type Selection = { kind: BeadKind; id: string };

export function chainFor(
  tree: Tree,
  closure: ClosureData,
  sel: Selection,
  baselineLabel: string,
  categorization: string,
): Hop[] {
  let ctl: TreeNode | null = null;
  let fnd: Finding | null = null;
  let pit: PoamItem | null = null;
  if (sel.kind === "control") ctl = tree.byControl.get(sel.id) ?? null;
  if (sel.kind === "finding") {
    fnd = closure.findings.find((f) => f.id === sel.id) ?? null;
    if (fnd) ctl = tree.byControl.get(fnd.control) ?? null;
  }
  if (sel.kind === "poam") {
    pit = closure.poams.find((p) => p.id === sel.id) ?? null;
    const f = pit ? closure.findings.find((x) => x.poam === pit!.id) : null;
    if (f) ctl = tree.byControl.get(f.control) ?? null;
  }

  const out: Hop[] = [];
  out.push({
    t: "Obligation",
    l: baselineLabel,
    tone: "neu",
    m: `Profile pinned from the published baseline. Categorized ${categorization}.`,
  });
  if (ctl) {
    const fam = tree.root.children.find((f) => f.id === ctl!.family);
    if (fam) {
      out.push({
        t: "Family",
        l: `${fam.id} — ${fam.title}`,
        tone: "neu",
        m: `${fam.agg.w} rows owed · ${fam.agg.sat} Satisfied · ${fam.agg.ns} Other than satisfied · ${fam.agg.nd} with no determination`,
      });
    }
    const base = baseOf(ctl.id);
    const baseNode = base ? tree.byControl.get(base) : null;
    if (baseNode) {
      out.push({
        t: "Base control",
        l: `${baseNode.id} — ${baseNode.title}`,
        tone: baseNode.st,
        m: `${stLabel(baseNode.st)} · ${baseNode.origination ?? "—"} · ${baseNode.children.filter((k) => k.kind === "enhancement").length} enhancements in this baseline`,
      });
    }
    const rows = ctl.children.filter((k) => k.row).map((k) => k.row!);
    out.push({
      t: "Requirement",
      l: `${ctl.id} — ${ctl.title}`,
      tone: ctl.st,
      mono: true,
      m: [
        ctl.origination,
        ctl.method,
        `${rows.length} requirement row${rows.length === 1 ? "" : "s"}`,
        `owner ${ctl.responsibleParty ?? "unassigned"}`,
      ]
        .filter(Boolean)
        .join(" · "),
    });
    const assessed = rows.filter(
      (r) => r.determination !== "Not assessed" && r.determination !== "Not applicable",
    );
    if (assessed.length) {
      // One hop per distinct determination, not per row: seventeen rows that
      // say the same thing are one statement with seventeen subjects.
      const groups = new Map<string, SctmRow[]>();
      for (const r of assessed) {
        const key = `${r.determination}|${r.determinationNote}|${r.currency}`;
        const g = groups.get(key);
        if (g) g.push(r);
        else groups.set(key, [r]);
      }
      for (const g of groups.values()) {
        const r = g[0]!;
        const subjects = g.length === 1 ? r.requirement : `${r.requirement} +${g.length - 1} more`;
        out.push({
          t: `Determination · ${subjects}`,
          l: r.determination,
          tone: r.determination === "Satisfied" ? "sat" : "ns",
          m: `${r.determinationNote !== "—" ? r.determinationNote : "Determination recorded against the whole control statement."} Evidence currency: ${r.currency}.`,
        });
      }
    } else {
      out.push({
        t: "Determination",
        l: "Unknown",
        tone: "nd",
        m: `No assessment row was decomposed for this requirement, so no determination exists. Unknown with an owner (${ctl.responsibleParty ?? "unassigned"}) and a resolution path — not N/A.`,
      });
    }
    if (ctl.nodes.length) {
      out.push({
        t: "Allocation",
        l: `${ctl.nodes.length} component${ctl.nodes.length === 1 ? "" : "s"}`,
        tone: "neu",
        m:
          ctl.nodes
            .slice(0, 4)
            .map((id) => nodeById.get(id)?.name ?? id)
            .join(" · ") + (ctl.nodes.length > 4 ? ` · +${ctl.nodes.length - 4} more` : ""),
      });
    }
    const assertion = rows[0]?.assertion;
    if (assertion && assertion !== "—") {
      out.push({
        t: `Implementation · ${rows[0]!.allocationScope === "component" ? "component scope" : "system scope"}`,
        l:
          rows[0]!.allocationScope === "component"
            ? "Allocated at component scope"
            : "Allocated to the system as a whole",
        tone: "neu",
        m: assertion,
      });
    }
  }

  const fl = fnd ? [fnd] : ctl ? (closure.findingsByControl.get(ctl.id) ?? []) : [];
  if (fl.length) {
    for (const f of fl) {
      out.push({
        t: "Finding",
        l: `${f.id} — ${f.title}`,
        tone: sevTone(f),
        m: `${f.rawSeverity}${f.mitigatedSeverity !== f.rawSeverity ? ` graded down to ${f.mitigatedSeverity}` : ""} · ${f.lifecycle} · ${f.source}${f.rule ? ` · ${f.rule}` : ""} · ${f.cci}`,
      });
    }
  } else if (ctl && ctl.st === "ns") {
    out.push({
      t: "Finding",
      l: "None raised",
      tone: "nd",
      m: "This failure carries no finding of record, so nothing routes it to remediation and it will not appear on any worklist. Create a finding to open the closure path.",
    });
  }

  const pl = pit ? [pit] : ctl ? (closure.poamsByControl.get(ctl.id) ?? []) : [];
  if (pl.length) {
    for (const p of pl) {
      out.push({
        t: "Plan of action",
        l: `${p.id} — ${p.title}`,
        tone: p.status === "Overdue" ? "ns" : p.status === "Completed" ? "sat" : "warn",
        m: `${p.status} · due ${p.scheduledCompletion} · ${p.owner || "unassigned"}${p.resources ? ` · ${p.resources}` : ""}`,
      });
    }
  } else if (ctl && ctl.st === "ns") {
    out.push({
      t: "Plan of action",
      l: "No item",
      tone: "nd",
      m: "No POA&M item covers this requirement.",
    });
  }

  const seen = new Set<string>();
  for (const r of closure.risks) {
    const rf = findingsForRisk(r.id);
    if (!rf.some((f) => fl.some((x) => x.id === f.id))) continue;
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push({
      t: "Risk",
      l: `${r.id} — ${r.title}`,
      tone: r.residual >= 60 ? "ns" : "warn",
      m: `${r.treatment} · ${r.disposition} · authored inherent ${r.inherent} → residual ${r.residual} · last reviewed ${r.reviewed}`,
    });
  }
  return out;
}

export function stLabel(st: NodeState): string {
  return st === "ns"
    ? "Other than satisfied"
    : st === "sat"
      ? "Satisfied"
      : "Unknown — no determination";
}

/* ── Blast radius ────────────────────────────────────────────────────────── */

export type BlastGroup = { node: string; name: string; zone: string; rows: SctmRow[] };

export type Blast = {
  change: ChangeRecord;
  impact: ChangeImpact;
  rows: SctmRow[];
  suspect: number;
  invalidated: number;
  groups: BlastGroup[];
  families: { id: string; n: number }[];
};

export function blasts(programId: string, sctm: Sctm): Blast[] {
  const byKey = new Map(sctm.rows.map((r) => [r.key, r]));
  return impactForProgram(programId)
    .map((impact) => {
      const change = changeById(impact.change);
      if (!change) return null;
      const inv = impact.invalidatedRows.map((k) => byKey.get(k)).filter((r): r is SctmRow => !!r);
      const sus = impact.suspectRows.map((k) => byKey.get(k)).filter((r): r is SctmRow => !!r);
      const rows = [...inv, ...sus];
      const touched = new Set(impact.touched.map((t) => t.node));
      const groupsMap = new Map<string, SctmRow[]>();
      for (const r of rows) {
        const primary =
          r.responsibleNodes.find((n) => touched.has(n)) ?? r.responsibleNodes[0] ?? "—";
        const l = groupsMap.get(primary);
        if (l) l.push(r);
        else groupsMap.set(primary, [r]);
      }
      const groups: BlastGroup[] = [...groupsMap.entries()]
        .sort(([, a], [, b]) => b.length - a.length)
        .slice(0, 10)
        .map(([node, list]) => ({
          node,
          name: nodeById.get(node)?.name ?? node,
          zone: nodeById.get(node)?.zone ?? "External",
          rows: list,
        }));
      const fam = new Map<string, number>();
      for (const r of rows) fam.set(r.family, (fam.get(r.family) ?? 0) + 1);
      return {
        change,
        impact,
        rows,
        suspect: sus.length,
        invalidated: inv.length,
        groups,
        families: [...fam.entries()].sort(([, a], [, b]) => b - a).map(([id, n]) => ({ id, n })),
      };
    })
    .filter((b): b is Blast => !!b);
}

/* ── Threads ─────────────────────────────────────────────────────────────── */

export const threadAxes = [
  { key: "family", label: "Family" },
  { key: "determination", label: "Determination" },
  { key: "currency", label: "Evidence currency" },
  { key: "finding", label: "Finding" },
  { key: "closure", label: "Closure" },
] as const;

export type ThreadRow = { control: TreeNode; k: [string, string, string, string, string] };

export const threadOrder: Record<(typeof threadAxes)[number]["key"], string[]> = {
  family: [],
  determination: ["Satisfied", "Other than satisfied", "None recorded"],
  currency: ["Current", "Suspect", "Invalidated", "None"],
  finding: ["Of record", "None raised", "Not needed"],
  closure: ["Closed or accepted", "In plan", "No plan", "Not owed"],
};

export function threadRows(tree: Tree, closure: ClosureData): ThreadRow[] {
  const rows = tree.controls
    .filter((c) => c.agg.w > 0)
    .map((c): ThreadRow => {
      const det =
        c.st === "sat" ? "Satisfied" : c.st === "ns" ? "Other than satisfied" : "None recorded";
      const first = c.children.find((k) => k.row)?.row ?? null;
      const ev = c.agg.cur + c.agg.sus + c.agg.inv ? (first?.currency ?? "None") : "None";
      const fs = closure.findingsByControl.get(c.id) ?? [];
      const fnd = fs.length ? "Of record" : c.st === "sat" ? "Not needed" : "None raised";
      const ps = closure.poamsByControl.get(c.id) ?? [];
      const clo = ps.length
        ? ps.every((p) => !poamOpen(p))
          ? "Closed or accepted"
          : "In plan"
        : c.st === "sat"
          ? "Not owed"
          : "No plan";
      return { control: c, k: [c.family!, det, ev, fnd, clo] };
    });
  const families = tree.root.children.map((f) => f.id);
  const orders = [families, ...threadAxes.slice(1).map((a) => threadOrder[a.key])];
  rows.sort((a, b) => {
    for (let i = 0; i < 5; i++) {
      const d = orders[i]!.indexOf(a.k[i]!) - orders[i]!.indexOf(b.k[i]!);
      if (d) return d;
    }
    return byCatalog(a.control.id, b.control.id);
  });
  return rows;
}

export { isOpen };
