/**
 * The assurance workspace: one surface, several ways to read the same tree.
 *
 * Start at the baseline and drill to a single requirement row. The chart, the
 * metric strip and the inspector all follow the same cursor, so a wedge, a
 * number and a sentence can never disagree. Views: sunburst, radial bar,
 * polar, box layout and dependency wheel read the tree at the cursor; the
 * closure pipeline shows where every requirement, finding and plan item sits
 * on the way to closed; blast radius shows what a change order takes away;
 * the thread bundle is all 372 requirements at once, one thread each.
 *
 * Presentation over `assurance-tree`. Colour is state, never decoration:
 * neutral for Satisfied, red for Other than satisfied, hatched for Unknown.
 */

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUp } from "lucide-react";

import {
  Badge,
  Bleed,
  Box,
  Breadcrumb,
  Button,
  Grid,
  Id,
  Inline,
  Stack,
  ToggleGroup,
  token,
  Eyebrow,
} from "@ledger/design-system";
import {
  blasts,
  buildTree,
  chainFor,
  closureData,
  nodeAt,
  stLabel,
  threadAxes,
  threadOrder,
  threadRows,
  zoneAllocations,
  type Agg,
  type Bead,
  type BeadTone,
  type Blast,
  type Hop,
  type Selection,
  type Tree,
  type TreeNode,
} from "@/lib/assurance-tree";
import { nodeById } from "@/lib/composition";
import { useWorkVersion } from "@/lib/control-work";
import { programs } from "@/lib/grc-data";
import { useControlText, useSctm } from "@/lib/sctm";
import { cn } from "@ledger/design-system/cn";

/* ── Geometry ────────────────────────────────────────────────────────────── */

const W = 988;
const H = 774;
const CX = 494;
const CY = 378;
const TAU = Math.PI * 2;

function arc(r0: number, r1: number, a0: number, a1: number): string {
  const P = (r: number, a: number) =>
    `${(CX + Math.cos(a) * r).toFixed(1)},${(CY + Math.sin(a) * r).toFixed(1)}`;
  const big = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${P(r0, a0)} L ${P(r1, a0)} A ${r1},${r1} 0 ${big} 1 ${P(r1, a1)} L ${P(r0, a1)} A ${r0},${r0} 0 ${big} 0 ${P(r0, a0)} Z`;
}

/** State → fill. Hatched for unknown, so it reads as a hole rather than a grey. */
function fillFor(n: TreeNode, leaf: boolean): { className: string; style: CSSProperties } {
  if (n.st === "sat")
    return { className: "fill-current text-subtle", style: { fillOpacity: leaf ? 0.42 : 0.16 } };
  if (n.st === "ns")
    return {
      className: "fill-chart-danger",
      style: { fillOpacity: leaf ? 0.85 : 0.12 + 0.3 * Math.min(1, n.frac * 2.4) },
    };
  return { className: "fill-[url(#hatch)]", style: { fillOpacity: leaf ? 1 : 0.6 } };
}

const toneText: Record<BeadTone, string> = {
  sat: "text-success",
  ns: "text-danger",
  nd: "text-subtle",
  warn: "text-warning",
  info: "text-brand",
  neu: "text-subtle",
};
const toneBg: Record<BeadTone, string> = {
  sat: "bg-success-bold",
  ns: "bg-danger-bold",
  nd: "bg-neutral-bold",
  warn: "bg-warning-bold",
  info: "bg-brand-bold",
  neu: "bg-neutral-bold",
};
const toneSoft: Record<BeadTone, string> = {
  sat: "bg-success border-success-subtle",
  ns: "bg-danger border-danger-subtle",
  nd: "bg-transparent border-bold",
  warn: "bg-warning border-warning-subtle",
  info: "bg-selected border-brand",
  neu: "bg-neutral border-default",
};

const hatch: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(135deg, transparent 0 2px, currentColor 2px 3px)",
};

/** Distinct names, with a count when several parts share one. Eight at most. */
function allocatedNames(ids: string[]): string[] {
  const counts = new Map<string, number>();
  for (const id of ids) {
    const name = nodeById.get(id)?.name ?? id;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, n]) => (n > 1 ? `${name} ×${n}` : name)).slice(0, 8);
}

function nodeTip(n: TreeNode): string {
  const a = n.agg;
  const head =
    n.kind === "family"
      ? `${n.id} — ${n.title}`
      : n.kind === "root"
        ? n.title
        : `${n.label} — ${n.title}`;
  return `${head} · ${a.w} rows · ${a.sat} Satisfied · ${a.ns} Other than satisfied · ${a.nd} with no determination${
    a.sus + a.inv ? ` · ${a.sus + a.inv} on suspect evidence` : ""
  }`;
}

/* ── Views ───────────────────────────────────────────────────────────────── */

type View = "sunburst" | "radial" | "polar" | "box" | "wheel" | "closure" | "blast" | "threads";

const views: { value: View; label: string; note: string }[] = [
  {
    value: "sunburst",
    label: "Sunburst",
    note: "Ring area is decomposed rows; click a wedge to re-root.",
  },
  {
    value: "radial",
    label: "Radial bar",
    note: "Bar length is rows, stacked by determination state.",
  },
  {
    value: "polar",
    label: "Polar",
    note: "Angle is child, radius is share of rows still unresolved, marker area is rows.",
  },
  {
    value: "box",
    label: "Box layout",
    note: "Box area is rows, header colour is failure density.",
  },
  {
    value: "wheel",
    label: "Dependency wheel",
    note: "Ribbons are requirement allocations onto trust zones.",
  },
  {
    value: "closure",
    label: "Closure",
    note: "Where every requirement, finding and plan item sits on the way to closed.",
  },
  {
    value: "blast",
    label: "Blast radius",
    note: "Pick a change order. Watch what it invalidates.",
  },
  {
    value: "threads",
    label: "Threads",
    note: "One thread per requirement: family → determination → evidence → finding → closure.",
  },
];

type Shape = {
  paths: { d: string; className: string; style?: CSSProperties; tip?: string; pick?: () => void }[];
  rects: {
    x: number;
    y: number;
    w: number;
    h: number;
    className: string;
    style?: CSSProperties;
    tip?: string;
    pick?: () => void;
  }[];
  dots: {
    x: number;
    y: number;
    r: number;
    className: string;
    style?: CSSProperties;
    tip?: string;
    pick?: () => void;
  }[];
  labels: {
    x: number;
    y: number;
    t: string;
    className: string;
    size: number;
    anchor?: "start" | "middle" | "end";
    pick?: () => void;
  }[];
  hub: boolean;
};

const empty = (): Shape => ({ paths: [], rects: [], dots: [], labels: [], hub: false });

function vSunburst(n: TreeNode, go: (id: string) => void, hov: (t: string) => void): Shape {
  const s = empty();
  s.hub = true;
  const R = [122, 204, 282, 332, 362];
  const layer = (nodes: TreeNode[], depth: number, a0: number, a1: number) => {
    if (depth > 3 || !nodes.length) return;
    const tot = nodes.reduce((acc, k) => acc + Math.max(1, k.agg.w), 0) || 1;
    let a = a0;
    for (const k of nodes) {
      const span = ((a1 - a0) * Math.max(1, k.agg.w)) / tot;
      const an = a + span;
      const f = fillFor(k, !k.children.length);
      s.paths.push({
        d: arc(R[depth]!, R[depth + 1]!, a + 0.004, an - 0.004),
        className: cn(f.className, "cursor-pointer"),
        style: {
          stroke: token("elevation.surface"),
          ...f.style,
          strokeWidth: depth === 0 ? 1.5 : 0.8,
        },
        tip: nodeTip(k),
        pick: () => go(k.id),
      });
      if (depth === 0 && span > 0.07) {
        const mid = (a + an) / 2;
        const rr = (R[0]! + R[1]!) / 2;
        s.labels.push({
          x: CX + Math.cos(mid) * rr,
          y: CY + Math.sin(mid) * rr,
          t: k.label,
          className: "fill-current text-default font-medium",
          size: 13,
          pick: () => go(k.id),
        });
      }
      if (depth === 1 && span > 0.085) {
        const mid = (a + an) / 2;
        const rr = (R[1]! + R[2]!) / 2;
        s.labels.push({
          x: CX + Math.cos(mid) * rr,
          y: CY + Math.sin(mid) * rr,
          t: k.label,
          className: "fill-current text-default",
          size: 10,
          pick: () => go(k.id),
        });
      }
      layer(k.children, depth + 1, a, an);
      a = an;
    }
  };
  layer(n.children, 0, -Math.PI / 2, TAU - Math.PI / 2);
  void hov;
  return s;
}

function vRadial(n: TreeNode, go: (id: string) => void): Shape {
  const s = empty();
  s.hub = true;
  const kids = [...n.children].sort((a, b) => b.agg.w - a.agg.w);
  const R0 = 128;
  const R1 = 354;
  const maxW = Math.max(...kids.map((k) => k.agg.w), 1);
  const sect = TAU / Math.max(1, kids.length);
  kids.forEach((k, i) => {
    const a0 = i * sect - Math.PI / 2 + sect * 0.12;
    const a1 = (i + 1) * sect - Math.PI / 2 - sect * 0.12;
    const len = (R1 - R0) * Math.max(0.03, k.agg.w / maxW);
    let r = R0;
    const segs: [string, number, CSSProperties][] = [
      ["fill-current text-subtle", k.agg.sat, { fillOpacity: 0.42 }],
      ["fill-chart-danger", k.agg.ns, {}],
      ["fill-[url(#hatch)]", k.agg.nd, {}],
    ];
    for (const [cls, v, style] of segs) {
      if (!v) continue;
      const dr = (len * v) / Math.max(1, k.agg.w);
      s.paths.push({
        d: arc(r, r + dr, a0, a1),
        className: cn(cls, "cursor-pointer"),
        style: { stroke: token("elevation.surface"), ...style, strokeWidth: 0.6 },
        tip: nodeTip(k),
        pick: () => go(k.id),
      });
      r += dr;
    }
    s.paths.push({
      d: arc(R0, R1, a0, a1),
      className: "fill-current text-default cursor-pointer",
      style: { fillOpacity: 0.025 },
      tip: nodeTip(k),
      pick: () => go(k.id),
    });
    const mid = (a0 + a1) / 2;
    s.labels.push({
      x: CX + Math.cos(mid) * (R0 - 16),
      y: CY + Math.sin(mid) * (R0 - 16),
      t: k.label,
      className: "fill-current text-default",
      size: 11,
      pick: () => go(k.id),
    });
    if (k.agg.w / maxW > 0.18)
      s.labels.push({
        x: CX + Math.cos(mid) * (R0 + len + 14),
        y: CY + Math.sin(mid) * (R0 + len + 14),
        t: String(k.agg.w),
        className: "fill-current text-subtle",
        size: 11,
      });
  });
  return s;
}

function vPolar(n: TreeNode, go: (id: string) => void): Shape {
  const s = empty();
  s.hub = true;
  const kids = n.children;
  const R0 = 60;
  const R1 = 328;
  for (const f of [0.25, 0.5, 0.75, 1]) {
    const r = R0 + (R1 - R0) * f;
    s.paths.push({
      d: arc(r - 0.5, r + 0.5, -Math.PI / 2, TAU - Math.PI / 2 - 0.001),
      className: "fill-border",
    });
    s.labels.push({
      x: CX + 4,
      y: CY - r,
      t: `${Math.round(f * 100)}%`,
      className: "fill-current text-subtle",
      size: 10,
      anchor: "start",
    });
  }
  const sect = TAU / Math.max(1, kids.length);
  const pts: [number, number][] = [];
  kids.forEach((k, i) => {
    const a = i * sect - Math.PI / 2;
    const share = Math.min(1, (k.agg.ns + k.agg.nd) / Math.max(1, k.agg.w));
    const r = R0 + (R1 - R0) * share;
    pts.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r]);
    s.paths.push({
      d: `M ${CX},${CY} L ${(CX + Math.cos(a) * R1).toFixed(1)},${(CY + Math.sin(a) * R1).toFixed(1)}`,
      className: "stroke-border fill-none",
    });
    const f = fillFor(k, false);
    s.dots.push({
      x: CX + Math.cos(a) * r,
      y: CY + Math.sin(a) * r,
      r: 4 + Math.min(11, Math.sqrt(k.agg.w) * 1.9),
      className: cn(f.className, "cursor-pointer"),
      style: {
        stroke: token("elevation.surface"),
        fillOpacity: k.st === "sat" ? 0.5 : 0.85,
        strokeWidth: 1.5,
      },
      tip: `${nodeTip(k)} · ${Math.round(share * 100)}% of rows unresolved`,
      pick: () => go(k.id),
    });
    s.labels.push({
      x: CX + Math.cos(a) * (R1 + 22),
      y: CY + Math.sin(a) * (R1 + 22),
      t: k.label,
      className: k.agg.ns ? "fill-chart-danger" : "fill-current text-default",
      size: 11,
      pick: () => go(k.id),
    });
  });
  if (pts.length > 2) {
    s.paths.unshift({
      d: `M ${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L ")} Z`,
      className: "fill-chart-danger stroke-current icon-danger",
      style: { fillOpacity: 0.08, strokeOpacity: 0.45, strokeWidth: 1.5 },
    });
  }
  return s;
}

type BoxItem<T> = { w: number; node: T; bx: number; by: number; bw: number; bh: number };
function squarify<T>(
  items: { w: number; node: T }[],
  x: number,
  y: number,
  w: number,
  h: number,
): BoxItem<T>[] {
  const out: BoxItem<T>[] = [];
  let rest = [...items].sort((a, b) => b.w - a.w);
  let X = x;
  let Y = y;
  let Wd = w;
  let Ht = h;
  let total = rest.reduce((s, i) => s + i.w, 0) || 1;
  while (rest.length && Wd > 1 && Ht > 1) {
    const vert = Wd >= Ht;
    const side = vert ? Ht : Wd;
    let row: typeof rest = [];
    let sum = 0;
    let best = Infinity;
    for (const it of rest) {
      const s = sum + it.w;
      const len = (s / total) * (vert ? Wd : Ht);
      const worst = Math.max(
        ...[...row, it].map((r) => {
          const dd = (r.w / s) * side;
          return Math.max(len / dd, dd / len);
        }),
      );
      if (worst <= best) {
        row.push(it);
        sum = s;
        best = worst;
      } else break;
    }
    if (!row.length) {
      row = [rest[0]!];
      sum = rest[0]!.w;
    }
    const len = (sum / total) * (vert ? Wd : Ht);
    let off = 0;
    for (const it of row) {
      const dd = (it.w / sum) * side;
      out.push(
        vert
          ? { ...it, bx: X, by: Y + off, bw: len, bh: dd }
          : { ...it, bx: X + off, by: Y, bw: dd, bh: len },
      );
      off += dd;
    }
    if (vert) {
      X += len;
      Wd -= len;
    } else {
      Y += len;
      Ht -= len;
    }
    total -= sum;
    rest = rest.slice(row.length);
  }
  return out;
}

function vBox(n: TreeNode, go: (id: string) => void): Shape {
  const s = empty();
  const boxes = squarify(
    n.children.map((k) => ({ w: Math.max(1, k.agg.w), node: k })),
    10,
    10,
    W - 20,
    H - 20,
  );
  for (const b of boxes) {
    const k = b.node;
    s.rects.push({
      x: b.bx,
      y: b.by,
      w: Math.max(0, b.bw - 3),
      h: Math.max(0, b.bh - 3),
      className: "fill-card stroke-border cursor-pointer",
      tip: nodeTip(k),
      pick: () => go(k.id),
    });
    const hdr = Math.min(24, b.bh * 0.3);
    const f = fillFor(k, false);
    s.rects.push({
      x: b.bx,
      y: b.by,
      w: Math.max(0, b.bw - 3),
      h: hdr,
      className: cn(f.className, "cursor-pointer"),
      style: {
        ...f.style,
        fillOpacity: k.st === "sat" ? 0.22 : (f.style.fillOpacity as number) + 0.1,
      },
      tip: nodeTip(k),
      pick: () => go(k.id),
    });
    if (b.bw > 60 && hdr >= 13) {
      s.labels.push({
        x: b.bx + 7,
        y: b.by + hdr / 2,
        t: k.label,
        className: "fill-current text-default font-medium",
        size: 12,
        anchor: "start",
        pick: () => go(k.id),
      });
      if (b.bw > 150)
        s.labels.push({
          x: b.bx + b.bw - 10,
          y: b.by + hdr / 2,
          t: `${k.agg.w} rows · ${k.agg.ns} failing`,
          className: "fill-current text-subtle",
          size: 11,
          anchor: "end",
        });
    }
    if (k.children.length && b.bw > 90 && b.bh > hdr + 26) {
      const inner = squarify(
        k.children.map((g) => ({ w: Math.max(1, g.agg.w), node: g })),
        b.bx + 5,
        b.by + hdr + 4,
        b.bw - 13,
        b.bh - hdr - 12,
      );
      for (const ib of inner) {
        const g = ib.node;
        const gf = fillFor(g, !g.children.length);
        s.rects.push({
          x: ib.bx,
          y: ib.by,
          w: Math.max(0, ib.bw - 2),
          h: Math.max(0, ib.bh - 2),
          className: cn(gf.className, "cursor-pointer"),
          style: { stroke: token("elevation.surface"), ...gf.style, strokeWidth: 0.6 },
          tip: nodeTip(g),
          pick: () => go(g.id),
        });
        if (ib.bw > 52 && ib.bh > 14)
          s.labels.push({
            x: ib.bx + 4,
            y: ib.by + ib.bh / 2,
            t: g.label,
            className: "fill-current text-default",
            size: 10,
            anchor: "start",
            pick: () => go(g.id),
          });
      }
    }
  }
  return s;
}

function vWheel(n: TreeNode, go: (id: string) => void): Shape {
  const s = empty();
  s.hub = true;
  const zones = ["Public", "DMZ", "Management", "Enclave", "Isolated", "External"];
  const left = n.children
    .map((k) => ({ node: k, per: zoneAllocations(k) }))
    .map((l) => ({ ...l, tot: [...l.per.values()].reduce((a, b) => a + b, 0) }))
    .filter((l) => l.tot > 0);
  const zTot = new Map<string, number>();
  for (const l of left) for (const [z, v] of l.per) zTot.set(z, (zTot.get(z) ?? 0) + v);
  const zLive = zones.filter((z) => zTot.get(z));
  const grand = left.reduce((a, l) => a + l.tot, 0) || 1;
  const R = 318;
  const GAP = 0.03;
  const halfA = Math.PI - GAP * (left.length + 1);
  const halfB = Math.PI - GAP * (zLive.length + 1);
  const segA = new Map<string, { a0: number; a1: number; used: number; node: TreeNode }>();
  const segB = new Map<string, { a0: number; a1: number; used: number }>();
  let a = -Math.PI / 2 + GAP;
  for (const l of left) {
    const sp = (halfA * l.tot) / grand;
    segA.set(l.node.id, { a0: a, a1: a + sp, used: a, node: l.node });
    a += sp + GAP;
  }
  let b = Math.PI / 2 + GAP;
  for (const z of zLive) {
    const sp = (halfB * (zTot.get(z) ?? 0)) / grand;
    segB.set(z, { a0: b, a1: b + sp, used: b });
    b += sp + GAP;
  }
  const P = (r: number, ang: number) =>
    `${(CX + Math.cos(ang) * r).toFixed(1)},${(CY + Math.sin(ang) * r).toFixed(1)}`;
  for (const [id, sg] of segA) {
    const k = sg.node;
    const f = fillFor(k, false);
    s.paths.push({
      d: arc(R, R + 16, sg.a0, sg.a1),
      className: cn(f.className, "cursor-pointer"),
      style: { stroke: token("elevation.surface"), fillOpacity: k.st === "sat" ? 0.5 : 0.9 },
      tip: nodeTip(k),
      pick: () => go(id),
    });
    const mid = (sg.a0 + sg.a1) / 2;
    s.labels.push({
      x: CX + Math.cos(mid) * (R + 30),
      y: CY + Math.sin(mid) * (R + 30),
      t: k.label,
      className: k.agg.ns ? "fill-chart-danger" : "fill-current text-default",
      size: 11,
      pick: () => go(id),
    });
  }
  for (const z of zLive) {
    const sg = segB.get(z)!;
    s.paths.push({
      d: arc(R, R + 16, sg.a0, sg.a1),
      className: "fill-current text-subtle stroke-card",
      style: { fillOpacity: 0.7 },
      tip: `${z} zone · ${zTot.get(z)} requirement allocations`,
    });
    const mid = (sg.a0 + sg.a1) / 2;
    s.labels.push({
      x: CX + Math.cos(mid) * (R + 34),
      y: CY + Math.sin(mid) * (R + 34),
      t: z,
      className: "fill-current text-default",
      size: 11,
    });
  }
  const ribbons: Shape["paths"] = [];
  for (const l of left) {
    const sa = segA.get(l.node.id)!;
    for (const z of zLive) {
      const v = l.per.get(z);
      if (!v) continue;
      const sb = segB.get(z)!;
      const wa = ((sa.a1 - sa.a0) * v) / l.tot;
      const wb = ((sb.a1 - sb.a0) * v) / (zTot.get(z) ?? 1);
      const a0 = sa.used;
      const a1 = sa.used + wa;
      const b0 = sb.used;
      const b1 = sb.used + wb;
      sa.used = a1;
      sb.used = b1;
      const f = fillFor(l.node, false);
      ribbons.push({
        d: `M ${P(R, a0)} A ${R},${R} 0 0 1 ${P(R, a1)} Q ${CX},${CY} ${P(R, b0)} A ${R},${R} 0 0 1 ${P(R, b1)} Q ${CX},${CY} ${P(R, a0)} Z`,
        className: cn(f.className, "cursor-pointer"),
        style: {
          fillOpacity: l.node.st === "ns" ? 0.14 + 0.3 * Math.min(1, l.node.frac * 2.4) : 0.2,
        },
        tip: `${l.node.label} → ${z} zone · ${v} allocations`,
        pick: () => go(l.node.id),
      });
    }
  }
  s.paths.unshift(...ribbons);
  return s;
}

/* ── Threads ─────────────────────────────────────────────────────────────── */

type Axis = { a: number; k: string } | null;

function vThreads(
  tree: Tree,
  closure: ReturnType<typeof closureData>,
  axis: Axis,
  setAxis: (a: Axis) => void,
): Shape & { sel: ReturnType<typeof threadRows> } {
  const s = empty();
  const rows = threadRows(tree, closure);
  const AX = [60, 260, 460, 660, 860];
  const TOP = 22;
  const Hb = 650;
  const total = rows.length || 1;
  const families = tree.root.children.map((f) => f.id);
  const orders = [families, ...threadAxes.slice(1).map((ax) => threadOrder[ax.key])];
  const maps = AX.map((_, ai) => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.k[ai]!, (counts.get(r.k[ai]!) ?? 0) + 1);
    const ks = orders[ai]!.filter((k) => counts.get(k));
    const gap = ks.length > 6 ? 3 : 10;
    const avail = Hb - gap * (ks.length - 1);
    let hs = ks.map((k) => Math.max(7, ((counts.get(k) ?? 0) / total) * avail));
    const sum = hs.reduce((x, y) => x + y, 0);
    hs = hs.map((h) => (h / sum) * avail);
    const map = new Map<string, { y: number; h: number; n: number; used: number }>();
    let y = TOP;
    ks.forEach((k, i) => {
      map.set(k, { y, h: hs[i]!, n: counts.get(k) ?? 0, used: 0 });
      y += hs[i]! + gap;
    });
    return { map, ks };
  });
  const cls: Record<string, string> = {
    "No plan": "stroke-current icon-danger",
    "In plan": "stroke-current icon-warning",
    "Closed or accepted": "stroke-current icon-success",
    "Not owed": "stroke-current icon-subtle",
  };
  for (const r of rows) {
    const pts = maps.map((m, ai) => {
      const nd = m.map.get(r.k[ai]!)!;
      const yy = nd.y + ((nd.used++ + 0.5) / nd.n) * nd.h;
      return [AX[ai]! + 5.5, yy];
    });
    let p = `M ${pts[0]![0]!.toFixed(1)},${pts[0]![1]!.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const dx = (pts[i]![0]! - pts[i - 1]![0]!) * 0.44;
      p += ` C ${(pts[i - 1]![0]! + dx).toFixed(1)},${pts[i - 1]![1]!.toFixed(1)} ${(pts[i]![0]! - dx).toFixed(1)},${pts[i]![1]!.toFixed(1)} ${pts[i]![0]!.toFixed(1)},${pts[i]![1]!.toFixed(1)}`;
    }
    const hit = !axis || r.k[axis.a] === axis.k;
    s.paths.push({
      d: p,
      className: cn("fill-none", cls[r.k[4]!] ?? "stroke-current icon-subtle"),
      style: {
        strokeOpacity: hit ? (axis ? 0.8 : r.k[4] === "Not owed" ? 0.22 : 0.5) : 0.05,
        strokeWidth: hit && axis ? 1.5 : 1,
      },
      tip: `${r.control.id} — ${r.control.title}`,
    });
  }
  maps.forEach((m, ai) => {
    for (const k of m.ks) {
      const nd = m.map.get(k)!;
      const on = !!axis && axis.a === ai && axis.k === k;
      s.rects.push({
        x: AX[ai]!,
        y: nd.y,
        w: 11,
        h: Math.max(3, nd.h),
        className: cn(
          "cursor-pointer",
          on ? "fill-current" : axis ? "fill-current icon-subtlest" : "fill-current text-default",
        ),
        style: on ? {} : { fillOpacity: axis ? 1 : 0.7 },
        tip: `${threadAxes[ai]!.label} · ${k} · ${nd.n} requirements`,
        pick: () => setAxis(on ? null : { a: ai, k }),
      });
      s.labels.push({
        x: ai === 0 ? AX[0]! - 6 : AX[ai]! + 17,
        y: nd.y + nd.h / 2,
        t: ai === 0 ? k : `${k} · ${nd.n}`,
        className: on ? "fill-current" : "fill-current text-subtle",
        size: 11,
        anchor: ai === 0 ? "end" : "start",
        pick: () => setAxis(on ? null : { a: ai, k }),
      });
    }
    s.labels.push({
      x: ai === 0 ? AX[0]! - 6 : AX[ai]!,
      y: 8,
      t: threadAxes[ai]!.label,
      className: "fill-current text-default font-medium",
      size: 12,
      anchor: ai === 0 ? "end" : "start",
    });
  });
  return { ...s, sel: rows.filter((r) => !axis || r.k[axis.a] === axis.k) };
}

/* ── Blast ───────────────────────────────────────────────────────────────── */

function vBlast(b: Blast | null): Shape {
  const s = empty();
  if (!b) return s;
  const R1 = 146;
  const R2 = 286;
  for (const [i, r] of [66, 106, R1, 216, R2].entries()) {
    s.paths.push({
      d: arc(r - 0.5, r + 0.5, -Math.PI / 2, TAU - Math.PI / 2 - 0.001),
      className: "fill-chart-danger",
      style: { fillOpacity: 0.2 - i * 0.03 },
    });
  }
  const total = b.rows.length || 1;
  let acc = 0;
  b.groups.forEach((g) => {
    const share = g.rows.length / total;
    const a0 = acc * TAU - Math.PI / 2;
    const a1 = (acc + share) * TAU - Math.PI / 2;
    const mid = (acc + share / 2) * TAU - Math.PI / 2;
    acc += share;
    const x = CX + Math.cos(mid) * R1;
    const y = CY + Math.sin(mid) * R1;
    s.paths.push({
      d: `M ${CX},${CY} L ${x.toFixed(1)},${y.toFixed(1)}`,
      className: "stroke-current icon-danger fill-none",
      style: { strokeOpacity: 0.3, strokeWidth: 1 + Math.min(4, g.rows.length / 14) },
    });
    s.dots.push({
      x,
      y,
      r: 5 + Math.min(9, g.rows.length * 0.3),
      className: "fill-chart-danger",
      tip: `${g.name} · ${g.zone} · ${g.rows.length} affected requirements`,
    });
    const n = g.rows.length;
    const pad = (a1 - a0) * 0.06;
    g.rows.forEach((r, j) => {
      const da = n === 1 ? mid : a0 + pad + ((a1 - a0 - pad * 2) * j) / (n - 1);
      const dx = CX + Math.cos(da) * R2;
      const dy = CY + Math.sin(da) * R2;
      const inv = r.currency === "Invalidated";
      s.paths.push({
        d: `M ${x.toFixed(1)},${y.toFixed(1)} Q ${(CX + Math.cos((mid + da) / 2) * (R1 + 74)).toFixed(1)},${(CY + Math.sin((mid + da) / 2) * (R1 + 74)).toFixed(1)} ${dx.toFixed(1)},${dy.toFixed(1)}`,
        className: cn(
          "fill-none",
          inv ? "stroke-current icon-danger" : "stroke-current icon-warning",
        ),
        style: { strokeOpacity: 0.3, strokeWidth: 1 },
      });
      s.dots.push({
        x: dx,
        y: dy,
        r: inv ? 3.2 : 2.6,
        className: inv ? "fill-chart-danger" : "fill-chart-warning",
        tip: `${r.control} ${r.requirement} — ${r.statement} · ${r.currency} · ${r.determination}`,
      });
    });
  });
  s.dots.push({ x: CX, y: CY, r: 16, className: "fill-current text-default" });
  s.labels.push({
    x: CX,
    y: CY + 38,
    t:
      b.change.node !== "—"
        ? (nodeById.get(b.change.node)?.name ?? b.change.subject)
        : b.change.subject,
    className: "fill-current text-default font-medium",
    size: 13,
  });
  s.labels.push({
    x: 10,
    y: 14,
    t: `inner ring — ${b.groups.length} components that contain or reach it`,
    className: "fill-current text-subtle",
    size: 11,
    anchor: "start",
  });
  s.labels.push({
    x: 10,
    y: 32,
    t: `outer ring — ${b.rows.length} requirements allocated to them`,
    className: "fill-current text-subtle",
    size: 11,
    anchor: "start",
  });
  return s;
}

/* ── Closure ─────────────────────────────────────────────────────────────── */

function ClosurePipeline({
  columns,
  total,
  sel,
  onPick,
}: {
  columns: ReturnType<typeof closureData>["columns"];
  total: number;
  sel: Selection | null;
  onPick: (b: Bead) => void;
}) {
  // The fan: every requirement in the set on the left, landing in the columns.
  const n = columns.length;
  const max = Math.max(...columns.map((c) => c.beads.length), 1);
  const raw = columns.map((c) => 10 + 46 * Math.sqrt(c.beads.length / max));
  const sum = raw.reduce((a, b) => a + b, 0);
  const gap = 5;
  const BUD = 132 - gap * (n - 1);
  const hs = raw.map((h) => (h / sum) * BUD);
  const x0 = 160;
  const cw = W / n;
  let y = 14;
  const y00 = y;
  const fan = columns.map((c, i) => {
    const y0 = y;
    const y1 = y + hs[i]!;
    y = y1 + gap;
    const xc = cw * i + cw / 2;
    const hw = Math.max(11, Math.min(30, hs[i]! * 1.15));
    return {
      d: `M ${x0},${y0.toFixed(1)} C ${x0 + 160},${y0.toFixed(1)} ${(xc - hw).toFixed(1)},34 ${(xc - hw).toFixed(1)},144 L ${(xc + hw).toFixed(1)},144 C ${(xc + hw).toFixed(1)},34 ${x0 + 160},${y1.toFixed(1)} ${x0},${y1.toFixed(1)} Z`,
      tone: c.tone,
    };
  });
  const yEnd = y - gap;
  const fanClass: Record<BeadTone, string> = {
    sat: "fill-chart-success stroke-current icon-success",
    ns: "fill-chart-danger stroke-current icon-danger",
    nd: "fill-current text-subtle stroke-current icon-subtle",
    warn: "fill-chart-warning stroke-current icon-warning",
    info: "fill-current stroke-current icon-brand",
    neu: "fill-current text-subtle stroke-current icon-subtle",
  };
  return (
    <Stack className="min-h-0">
      <div className="relative">
        <svg viewBox={`0 0 ${W} 150`} className="block w-full" preserveAspectRatio="none">
          <path
            d={`M 124,${y00} L 160,${y00} L 160,${yEnd.toFixed(1)} L 124,${yEnd.toFixed(1)} Z`}
            className="fill-current text-default stroke-current icon-default"
            style={{ fillOpacity: 0.07, strokeOpacity: 0.22 }}
          />
          {fan.map((f, i) => (
            <path
              key={i}
              d={f.d}
              className={fanClass[f.tone]}
              style={{ fillOpacity: 0.16, strokeOpacity: 0.5, strokeWidth: 0.8 }}
            />
          ))}
        </svg>
        <div className="absolute" style={{ left: "1.5%", top: "8%", width: "10%" }}>
          <div className="tabular-nums font-heading-small font-semibold">{total}</div>
          <Box className="font-body-xsmall text-subtle" paddingBlockStart="space.050">
            requirements
            <br />
            decomposed
          </Box>
        </div>
      </div>
      <Grid
        className="min-h-0 flex-1 border-t border-default"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        gap="space.0"
      >
        {columns.map((c, i) => (
          <Stack
            key={c.key}
            className={cn("min-h-0 px-150 pt-150", i < n - 1 ? "border-r border-default" : null)}
          >
            <Inline space="space.100" alignBlock="baseline">
              <span
                className={cn("tabular-nums font-heading-small font-semibold", toneText[c.tone])}
              >
                {c.beads.length}
              </span>
              <span className="font-body-small font-medium">{c.label}</span>
            </Inline>
            <Box className="font-body-xsmall text-subtle" paddingBlockStart="space.050">
              {c.note}
            </Box>
            <Inline
              className="pt-150 content-start overflow-y-auto pb-150"
              style={{ maxHeight: 340 }}
              space="space.050"
              shouldWrap
            >
              {c.beads.map((b) => {
                const on = !!sel && sel.kind === b.kind && sel.id === b.id;
                const stale = b.currency === "Suspect" || b.currency === "Invalidated";
                return (
                  <button
                    key={b.key}
                    type="button"
                    title={b.tip}
                    onClick={() => onPick(b)}
                    className={cn(
                      "size-icon-small shrink-0 rounded-small border transition-colors",
                      on
                        ? cn(toneBg[b.tone], "border-transparent outline-focused")
                        : toneSoft[b.tone],
                      stale && !on
                        ? b.currency === "Invalidated"
                          ? "border-dashed border-danger-subtle"
                          : "border-dashed border-warning-subtle"
                        : null,
                    )}
                    style={
                      b.tone === "nd" && !on
                        ? { ...hatch, color: token("color.icon.subtle") }
                        : undefined
                    }
                  />
                );
              })}
              {c.beads.length === 0 ? (
                <span className="font-body-xsmall text-subtle">None</span>
              ) : null}
            </Inline>
            <Box className="mt-auto border-t border-default" paddingBlock="space.100">
              <Button
                size="small"
                className="w-full"
                disabled={!sel || !c.beads.some((b) => b.kind === sel.kind && b.id === sel.id)}
              >
                {c.action}
              </Button>
            </Box>
          </Stack>
        ))}
      </Grid>
    </Stack>
  );
}

/* ── Inspector pieces ────────────────────────────────────────────────────── */

function Bar({ parts }: { parts: { className: string; v: number; style?: CSSProperties }[] }) {
  const total = parts.reduce((a, p) => a + p.v, 0) || 1;
  return (
    <Inline className="w-full overflow-hidden rounded-full bg-neutral h-075">
      {parts.map((p, i) =>
        p.v ? (
          <div
            key={i}
            className={p.className}
            style={{ width: `${(p.v / total) * 100}%`, ...p.style }}
          />
        ) : null,
      )}
    </Inline>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Inline className="font-body" space="space.100" alignBlock="baseline">
      <span className="flex-1 truncate">{label}</span>
      <span className="tabular-nums shrink-0">{children}</span>
    </Inline>
  );
}

function ChainList({ hops }: { hops: Hop[] }) {
  return (
    <Stack as="ol" space="space.0">
      {hops.map((h, i) => (
        <Inline key={i} as="li" space="space.150">
          <Stack className="w-150" alignInline="center">
            <Box paddingBlockStart="space.050">
              <span className={cn("shrink-0 rounded-full", toneBg[h.tone], "size-100")} />
            </Box>
            {i < hops.length - 1 ? <span className="w-px flex-1 bg-neutral" /> : null}
          </Stack>
          <Box className="min-w-0 flex-1" paddingBlockEnd="space.150">
            <Eyebrow>{h.t}</Eyebrow>
            <div
              className={cn(
                "font-body font-medium",
                h.tone === "neu" ? "text-default" : toneText[h.tone],
              )}
            >
              {h.l}
            </div>
            <Box className="font-body-small text-subtle" paddingBlockStart="space.025">
              {h.m}
            </Box>
          </Box>
        </Inline>
      ))}
    </Stack>
  );
}

/* ── Workspace ───────────────────────────────────────────────────────────── */

export function ControlWorkspace({ programId }: { programId: string }) {
  const program = programs.find((p) => p.id === programId);
  const text = useControlText();
  const sctm = useSctm(programId, text);
  const workVersion = useWorkVersion();
  const baselineLabel = program?.baseline ?? "NIST SP 800-53 Rev. 5";
  const crumbRoot = baselineLabel.replace(/^NIST SP /, "").replace(" — ", " ");
  const categorization = program
    ? `${program.confidentiality} / ${program.integrity} / ${program.availability}`
    : "—";

  const tree = useMemo(() => buildTree(sctm, baselineLabel), [sctm, baselineLabel]);
  const [path, setPath] = useState<string[]>([]);
  const [view, setView] = useState<View>("sunburst");
  const [hov, setHov] = useState<string | null>(null);
  const [sel, setSel] = useState<Selection | null>(null);
  const [axis, setAxis] = useState<Axis>(null);
  const [chg, setChg] = useState<string | null>(null);
  const navigate = useNavigate();

  const cur = nodeAt(tree, path);
  const go = (id: string) => {
    const e = tree.index.get(id);
    if (e) {
      setPath(e.path);
      setHov(null);
    }
  };
  const up = () => {
    setPath((p) => p.slice(0, -1));
    setHov(null);
  };

  const closure = useMemo(
    () => closureData(tree, programId, cur.kind === "family" ? cur.id : cur.family),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree, programId, cur.id, workVersion],
  );
  const blastList = useMemo(
    () => blasts(programId, sctm).sort((x, y) => y.rows.length - x.rows.length),
    [programId, sctm],
  );
  const blast = blastList.find((b) => b.change.id === chg) ?? blastList[0] ?? null;

  const threads = view === "threads" ? vThreads(tree, closure, axis, setAxis) : null;
  const shape: Shape =
    view === "sunburst"
      ? vSunburst(cur, go, setHov)
      : view === "radial"
        ? vRadial(cur, go)
        : view === "polar"
          ? vPolar(cur, go)
          : view === "box"
            ? vBox(cur, go)
            : view === "wheel"
              ? vWheel(cur, go)
              : view === "blast"
                ? vBlast(blast)
                : view === "threads" && threads
                  ? threads
                  : empty();

  const a: Agg = cur.agg;
  const pct = (v: number, t: number) => (t ? Math.round((v / t) * 100) : 0);
  const kids = [...cur.children].sort((x, y) => y.agg.ns - x.agg.ns || y.agg.w - x.agg.w);
  const isControl = cur.kind === "control" || cur.kind === "enhancement";
  const leafRows = (cur.kind === "row" ? [cur] : cur.children.filter((k) => k.row)).map(
    (k) => k.row!,
  );
  const primaryAct =
    isControl || cur.kind === "row"
      ? cur.st === "nd"
        ? "Record determination"
        : cur.st === "ns"
          ? "Create finding"
          : "Accept as input"
      : "Record determination";
  const chain = sel ? chainFor(tree, closure, sel, baselineLabel, categorization) : [];
  const viewNote = views.find((v) => v.value === view)?.note ?? "";

  const crumbs = [
    { l: crumbRoot, path: [] as string[] },
    ...path.map((id, i) => ({
      l: tree.index.get(id)?.node.label ?? id,
      path: path.slice(0, i + 1),
    })),
  ];

  return (
    <Box paddingBlockStart="space.150">
      {/* Header: crumbs · views · primary action */}
      <Inline
        className="border-b border-default pb-150"
        space="space.150"
        alignBlock="center"
        shouldWrap
      >
        <Breadcrumb className="min-w-0">
          {crumbs.map((c, i) => (
            <Breadcrumb.Item
              key={i}
              isCurrent={i === crumbs.length - 1}
              onClick={() => {
                setPath(c.path);
                setHov(null);
              }}
            >
              {c.l}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
        <Inline className="ml-auto" space="space.100" alignBlock="center">
          <ToggleGroup
            items={views.map((v) => ({ value: v.value, label: v.label }))}
            value={view}
            onChange={(v) => {
              setView(v);
              setHov(null);
            }}
          />
          <Button
            size="small"
            variant="primary"
            disabled={!cur.control}
            onClick={() => {
              if (cur.control)
                void navigate({
                  to: "/programs/$programId/controls/$controlId",
                  params: { programId, controlId: cur.control },
                  search: { tab: undefined },
                });
            }}
          >
            {primaryAct}
          </Button>
        </Inline>
      </Inline>

      {/* Metric strip: the same aggregate the chart and the inspector read. */}
      <Inline
        className="py-150"
        space="space.300"
        rowSpace="space.100"
        alignBlock="baseline"
        shouldWrap
      >
        {[
          { n: a.w, l: "rows in scope", c: "text-default" },
          { n: a.sat, l: "Satisfied", c: "text-success" },
          { n: a.ns, l: "Other than satisfied", c: "text-danger" },
          { n: a.nd, l: "No determination", c: "text-subtle" },
          { n: a.sus + a.inv, l: "Suspect or invalidated evidence", c: "text-warning" },
        ].map((m, i) => (
          <Inline
            key={m.l}
            className={cn(i ? "border-l border-default ps-300" : null)}
            space="space.100"
            alignBlock="baseline"
          >
            <span className={cn("tabular-nums font-heading-small font-semibold", m.c)}>{m.n}</span>
            <span className="font-body-small text-subtle">{m.l}</span>
          </Inline>
        ))}
        <span className="ml-auto font-body-small text-subtle">
          {cur.kind === "root"
            ? "Whole tailored baseline"
            : cur.kind === "family"
              ? `Family ${cur.id}`
              : `Requirement ${cur.label}`}
          {" · "}
          {kids.length ? `${kids.length} children` : "leaf row"}
        </span>
      </Inline>

      <Grid gap="space.300" templateColumns={{ lg: "minmax(0,1fr) 300px" }}>
        {/* Main */}
        <div className="min-w-0">
          <div className="font-body-small text-subtle">{viewNote}</div>

          {view === "closure" ? (
            <Box paddingBlockStart="space.100">
              <div className="rounded-medium border border-default bg-surface">
                <ClosurePipeline
                  columns={closure.columns}
                  total={a.w}
                  sel={sel}
                  onPick={(b) =>
                    setSel(
                      sel && sel.kind === b.kind && sel.id === b.id
                        ? null
                        : { kind: b.kind, id: b.id },
                    )
                  }
                />
              </div>
            </Box>
          ) : (
            <Box paddingBlockStart="space.100">
              <div className="relative rounded-medium border border-default bg-surface">
                {view === "blast" ? (
                  <Inline className="border-b border-default p-150" space="space.100" shouldWrap>
                    {blastList.map((b) => {
                      const on = b === blast;
                      return (
                        <button
                          key={b.change.id}
                          type="button"
                          onClick={() => setChg(b.change.id)}
                          className={cn(
                            "rounded-medium border px-150 py-100 text-left transition-colors",
                            on
                              ? "border-brand bg-selected"
                              : "border-default hover:bg-surface-hovered",
                          )}
                        >
                          <Inline className="font-body-small" space="space.100" alignBlock="center">
                            <Id>{b.change.id}</Id>
                            <Badge
                              size="xsmall"
                              tone={b.change.impact === "Significant" ? "danger" : "neutral"}
                            >
                              {b.change.impact}
                            </Badge>
                          </Inline>
                          <div className="font-body">
                            {b.change.node !== "—"
                              ? (nodeById.get(b.change.node)?.name ?? b.change.subject)
                              : b.change.subject}
                          </div>
                          <div className="font-body-xsmall text-subtle">
                            <span className="line-through">{b.change.from}</span> → {b.change.to}
                          </div>
                          <Box className="font-body" paddingBlockStart="space.050">
                            <span
                              className={cn(
                                "tabular-nums font-body-large font-semibold",
                                b.invalidated ? "text-danger" : "text-warning",
                              )}
                            >
                              {b.rows.length}
                            </span>{" "}
                            <span className="font-body-xsmall text-subtle">
                              determinations in question
                            </span>
                          </Box>
                        </button>
                      );
                    })}
                    {blastList.length === 0 ? (
                      <span className="font-body text-subtle">
                        No change orders touch this program.
                      </span>
                    ) : null}
                  </Inline>
                ) : null}
                <div className="relative">
                  <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="block w-full"
                    onMouseLeave={() => setHov(null)}
                  >
                    <defs>
                      <pattern
                        id="hatch"
                        patternUnits="userSpaceOnUse"
                        width="6"
                        height="6"
                        patternTransform="rotate(45)"
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="6"
                          className="stroke-current icon-subtle"
                          strokeWidth="2"
                        />
                      </pattern>
                    </defs>
                    {shape.paths.map((p, i) => (
                      <path
                        key={`p${i}`}
                        d={p.d}
                        className={p.className}
                        style={p.style}
                        onClick={p.pick}
                        onMouseEnter={p.tip ? () => setHov(p.tip!) : undefined}
                      >
                        {p.tip ? <title>{p.tip}</title> : null}
                      </path>
                    ))}
                    {shape.rects.map((r, i) => (
                      <rect
                        key={`r${i}`}
                        x={r.x}
                        y={r.y}
                        width={r.w}
                        height={r.h}
                        rx={4}
                        className={r.className}
                        style={r.style}
                        onClick={r.pick}
                        onMouseEnter={r.tip ? () => setHov(r.tip!) : undefined}
                      >
                        {r.tip ? <title>{r.tip}</title> : null}
                      </rect>
                    ))}
                    {shape.dots.map((d, i) => (
                      <circle
                        key={`d${i}`}
                        cx={d.x}
                        cy={d.y}
                        r={d.r}
                        className={d.className}
                        style={d.style}
                        onClick={d.pick}
                        onMouseEnter={d.tip ? () => setHov(d.tip!) : undefined}
                      >
                        {d.tip ? <title>{d.tip}</title> : null}
                      </circle>
                    ))}
                    {shape.labels.map((l, i) => (
                      <text
                        key={`l${i}`}
                        x={l.x}
                        y={l.y}
                        fontSize={l.size}
                        textAnchor={l.anchor ?? "middle"}
                        dominantBaseline="middle"
                        className={cn(
                          l.className,
                          l.pick ? "cursor-pointer" : "pointer-events-none",
                        )}
                        onClick={l.pick}
                      >
                        {l.t}
                      </text>
                    ))}
                  </svg>
                  {shape.hub ? (
                    <button
                      type="button"
                      onClick={path.length ? up : undefined}
                      className={cn(
                        "absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface px-150 py-250 text-center",
                        path.length ? "cursor-pointer" : "pointer-events-none",
                      )}
                      style={{ width: 200 }}
                    >
                      <Eyebrow>
                        {cur.kind === "root"
                          ? "baseline"
                          : cur.kind === "family"
                            ? `family ${cur.id}`
                            : cur.kind}
                      </Eyebrow>
                      <div
                        className={cn(
                          "tabular-nums font-heading-large font-semibold",
                          a.ns ? "text-danger" : a.nd ? "text-subtle" : "text-default",
                        )}
                      >
                        {a.ns || a.nd || a.w}
                      </div>
                      <div className="font-body-small text-subtle">
                        {a.ns
                          ? "Other than satisfied"
                          : a.nd
                            ? "with no determination"
                            : "rows, all Satisfied"}
                      </div>
                      <Box className="truncate font-body font-medium" paddingBlockStart="space.050">
                        {cur.kind === "root"
                          ? baselineLabel
                          : cur.kind === "family"
                            ? cur.title
                            : `${cur.label} — ${cur.title}`}
                      </Box>
                      {path.length ? (
                        <Box
                          className="inline-flex items-center gap-050 font-body-small text-brand"
                          paddingBlockStart="space.050"
                        >
                          <ArrowUp className="size-150" /> up one level
                        </Box>
                      ) : null}
                    </button>
                  ) : null}
                </div>
                <Box
                  className="truncate border-t border-default font-body-small text-subtle"
                  paddingInline="space.150"
                  paddingBlock="space.100"
                >
                  {hov ?? nodeTip(cur)}
                </Box>
              </div>
            </Box>
          )}
        </div>

        {/* Inspector */}
        <aside className="lg:sticky-rail lg:overflow-y-auto">
          {view === "closure" && sel ? (
            <Stack space="space.150">
              <div>
                <Eyebrow>Requirement chain</Eyebrow>
                <div className="font-body text-subtle">
                  {sel.kind === "control" ? `requirement ${sel.id}` : sel.id}
                </div>
              </div>
              <ChainList hops={chain} />
              <Inline space="space.100">
                <Button size="small" variant="primary" disabled>
                  {sel.kind === "poam"
                    ? "Reassess"
                    : sel.kind === "finding"
                      ? "Create POA&M item"
                      : tree.byControl.get(sel.id)?.st === "nd"
                        ? "Record determination"
                        : "Create finding"}
                </Button>
                <Button size="small" onClick={() => setSel(null)}>
                  Clear
                </Button>
              </Inline>
              <p className="font-body-xsmall text-subtle">
                Response ≠ determination: contributor input stays attributed.
              </p>
            </Stack>
          ) : view === "closure" ? (
            <Stack space="space.100">
              <Eyebrow>Requirement chain</Eyebrow>
              <p className="font-body">Select a bead to trace its chain</p>
              <p className="font-body-small text-subtle">
                Baseline → family → control → requirement row → determination → allocation → finding
                → plan item → risk. Every hop states its own provenance.
              </p>
            </Stack>
          ) : view === "blast" && blast ? (
            <Stack space="space.200">
              <div>
                <Eyebrow>Consequence</Eyebrow>
                <Inline space="space.100" alignBlock="baseline">
                  <span className="tabular-nums font-heading-large font-semibold">
                    {blast.rows.length}
                  </span>
                  <span className="font-body-small text-subtle">
                    of {tree.root.agg.w} rows
                    <br />
                    need a fresh look
                  </span>
                </Inline>
                <Box paddingBlockStart="space.100">
                  <Bar
                    parts={[
                      { className: "bg-warning-bold", v: blast.suspect },
                      { className: "bg-danger-bold", v: blast.invalidated },
                      {
                        className: "bg-transparent",
                        v: Math.max(0, tree.root.agg.w - blast.rows.length),
                      },
                    ]}
                  />
                </Box>
              </div>
              <Stack space="space.050">
                <Row label="Suspect — determination stands, flagged">
                  <span className="text-warning">{blast.suspect}</span>
                </Row>
                <Row label="Invalidated — must be reassessed">
                  <span className="text-danger">{blast.invalidated}</span>
                </Row>
                <Row label="Components in the blast">{blast.groups.length}</Row>
              </Stack>
              <div>
                <Box
                  className="font-heading-xxsmall uppercase text-subtlest"
                  paddingBlockEnd="space.050"
                >
                  Families touched
                </Box>
                <Stack space="space.050">
                  {blast.families.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => go(f.id)}
                      className="flex w-full items-center gap-100 font-body-small"
                    >
                      <Id className="text-left w-400">{f.id}</Id>
                      <span className="flex-1 overflow-hidden rounded-full bg-neutral h-075">
                        <span
                          className="block h-full bg-danger-bold"
                          style={{ width: `${(f.n / (blast.families[0]?.n ?? 1)) * 100}%` }}
                        />
                      </span>
                      <span className="tabular-nums text-right w-300">{f.n}</span>
                    </button>
                  ))}
                </Stack>
              </div>
              <p className="font-body-small text-subtle">{blast.change.analysis}</p>
              <Inline space="space.100">
                <Button size="small" variant="primary" disabled>
                  Reassess affected rows
                </Button>
                <Button size="small" disabled>
                  Report change
                </Button>
              </Inline>
            </Stack>
          ) : view === "threads" && threads ? (
            <Stack space="space.150">
              <div>
                <Eyebrow>
                  {axis ? `${threadAxes[axis.a]!.label} · ${axis.k}` : "All requirements"}
                </Eyebrow>
                <Inline space="space.100" alignBlock="baseline">
                  <span className="tabular-nums font-heading-large font-semibold">
                    {threads.sel.length}
                  </span>
                  <span className="font-body-small text-subtle">threads</span>
                </Inline>
              </div>
              {axis ? (
                <Button size="small" onClick={() => setAxis(null)}>
                  Release selection
                </Button>
              ) : null}
              <Stack space="space.050">
                {threadOrder.closure.map((k) => (
                  <Row key={k} label={k}>
                    {threads.sel.filter((r) => r.k[4] === k).length}
                  </Row>
                ))}
              </Stack>
              <Box
                className="font-heading-xxsmall uppercase text-subtlest"
                paddingBlockStart="space.050"
              >
                In this bundle
              </Box>
              <Inline space="space.050" shouldWrap>
                {threads.sel.slice(0, 60).map((r) => (
                  <button
                    key={r.control.id}
                    type="button"
                    onClick={() => {
                      setView("sunburst");
                      go(r.control.id);
                    }}
                    className={cn(
                      "rounded-small px-075 py-025 font-body-xsmall",
                      r.control.st === "ns"
                        ? "bg-danger text-danger"
                        : r.control.st === "nd"
                          ? "bg-neutral text-subtle"
                          : "bg-neutral text-default",
                    )}
                  >
                    {r.control.id}
                  </button>
                ))}
                {threads.sel.length > 60 ? (
                  <span className="font-body-xsmall text-subtle">
                    +{threads.sel.length - 60} more
                  </span>
                ) : null}
              </Inline>
            </Stack>
          ) : (
            <Stack space="space.200">
              <div>
                <Eyebrow>
                  {cur.kind === "root"
                    ? "Baseline"
                    : cur.kind === "family"
                      ? "Control family"
                      : cur.kind === "enhancement"
                        ? "Control enhancement"
                        : cur.kind === "row"
                          ? "Requirement row"
                          : "Control"}
                </Eyebrow>
                <Inline space="space.100" alignBlock="center">
                  <Id className="text-default">{cur.kind === "root" ? crumbRoot : cur.label}</Id>
                </Inline>
                <div className="font-body font-medium">{cur.title}</div>
                <Inline className="pt-075" space="space.050" shouldWrap>
                  {cur.control ? (
                    <>
                      <Badge
                        size="xsmall"
                        tone={
                          cur.origination === "Common"
                            ? "information"
                            : cur.origination === "Hybrid"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {cur.origination ?? "—"}
                      </Badge>
                      <Badge size="xsmall">{cur.method ?? "—"}</Badge>
                      <Badge size="xsmall" tone={cur.st === "ns" ? "danger" : "neutral"}>
                        {stLabel(cur.st)}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Badge size="xsmall">{a.w} rows</Badge>
                      <Badge size="xsmall" tone={a.ns ? "danger" : "neutral"}>
                        {a.ns} failing
                      </Badge>
                      <Badge size="xsmall">{a.nd} unknown</Badge>
                    </>
                  )}
                </Inline>
              </div>
              <div>
                <Box
                  className="font-heading-xxsmall uppercase text-subtlest"
                  paddingBlockEnd="space.050"
                >
                  Determinations in scope
                </Box>
                <Bar
                  parts={[
                    { className: "bg-neutral-bold", v: a.sat },
                    { className: "bg-danger-bold", v: a.ns },
                    { className: "text-subtlest", v: a.nd, style: hatch },
                  ]}
                />
                <Stack className="pt-075" space="space.025">
                  <Row label="Satisfied">{a.sat}</Row>
                  <Row label="Other than satisfied">
                    <span className={a.ns ? "text-danger" : undefined}>{a.ns}</span>
                  </Row>
                  <Row label="No determination">{a.nd}</Row>
                </Stack>
              </div>
              <div>
                <Box
                  className="font-heading-xxsmall uppercase text-subtlest"
                  paddingBlockEnd="space.050"
                >
                  Evidence currency
                </Box>
                <Bar
                  parts={[
                    { className: "bg-success-bold", v: a.cur },
                    { className: "bg-warning-bold", v: a.sus },
                    { className: "bg-danger-bold", v: a.inv },
                  ]}
                />
                <p className="pt-075 font-body-small text-subtle">
                  {a.cur + a.sus + a.inv
                    ? `${a.cur} Current · ${a.sus} Suspect · ${a.inv} Invalidated. A suspect row means a change order touched an allocated component after the determination was recorded.`
                    : "No determinations in scope, so no evidence to age."}
                </p>
              </div>
              {leafRows.length ? (
                <div>
                  <Box
                    className="font-heading-xxsmall uppercase text-subtlest"
                    paddingBlockEnd="space.050"
                  >
                    Determination of record
                  </Box>
                  <Stack space="space.100">
                    {leafRows.map((r) => (
                      <div key={r.key}>
                        <Inline space="space.100" alignBlock="center">
                          <Badge
                            size="xsmall"
                            tone={
                              r.determination === "Satisfied"
                                ? "success"
                                : r.determination === "Other than satisfied"
                                  ? "danger"
                                  : "neutral"
                            }
                          >
                            {r.determination === "Not assessed" ? "Unknown" : r.determination}
                          </Badge>
                          <span className="font-body-small text-subtle">{r.requirement}</span>
                        </Inline>
                        <p className="pt-025 font-body-small text-subtle">
                          {r.determinationNote !== "—"
                            ? r.determinationNote
                            : r.determination === "Not assessed"
                              ? `No determination exists for this row. Owner ${r.responsibleParty} — Unknown with a resolution path, never N/A.`
                              : "Determination recorded against the whole control statement."}
                        </p>
                      </div>
                    ))}
                  </Stack>
                </div>
              ) : null}
              {cur.nodes.length ? (
                <div>
                  <Box
                    className="font-heading-xxsmall uppercase text-subtlest"
                    paddingBlockEnd="space.050"
                  >
                    Allocated to
                  </Box>
                  <Inline space="space.050" shouldWrap>
                    {allocatedNames(cur.nodes).map((name) => (
                      <Badge key={name} size="xsmall">
                        {name}
                      </Badge>
                    ))}
                    {allocatedNames(cur.nodes).length > 8 ? (
                      <span className="font-body-xsmall text-subtle">
                        +{allocatedNames(cur.nodes).length - 8}
                      </span>
                    ) : null}
                  </Inline>
                </div>
              ) : null}
              {kids.length ? (
                <div>
                  <Box
                    className="font-heading-xxsmall uppercase text-subtlest"
                    paddingBlockEnd="space.050"
                  >
                    {cur.kind === "root"
                      ? "Families, worst first"
                      : cur.kind === "family"
                        ? "Controls, worst first"
                        : "Rows and enhancements"}
                  </Box>
                  <Bleed inline="space.100">
                    {kids.slice(0, 40).map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => go(k.id)}
                        className="flex h-control-small w-full items-center gap-100 rounded-small px-100 text-left hover:bg-surface-hovered"
                      >
                        <span
                          className={cn(
                            "shrink-0 rounded-full",
                            k.st === "ns"
                              ? "bg-danger-bold"
                              : k.st === "nd"
                                ? "bg-neutral-bold"
                                : "bg-neutral-bold",
                            "size-075",
                          )}
                        />
                        <Id
                          className="shrink-0 truncate whitespace-nowrap text-subtle"
                          style={{ width: 76 }}
                        >
                          {k.label}
                        </Id>
                        <span className="min-w-0 flex-1 truncate font-body-small">{k.title}</span>
                        <span
                          className={cn(
                            "shrink-0 font-body-xsmall",
                            k.agg.ns ? "text-danger" : k.agg.nd ? "text-subtle" : "text-subtlest",
                          )}
                        >
                          {k.agg.ns
                            ? `${k.agg.ns} failing`
                            : k.agg.nd
                              ? `${k.agg.nd} unknown`
                              : "clear"}
                        </span>
                      </button>
                    ))}
                    {kids.length > 40 ? (
                      <Box className="font-body-xsmall text-subtle" paddingInline="space.100">
                        +{kids.length - 40} more
                      </Box>
                    ) : null}
                  </Bleed>
                </div>
              ) : null}
              <p className="font-body-xsmall text-subtle">
                {cur.control
                  ? "Recorded through the control record · response ≠ determination."
                  : "Drill to a requirement row to record a determination."}
              </p>
            </Stack>
          )}
        </aside>
      </Grid>
    </Box>
  );
}
