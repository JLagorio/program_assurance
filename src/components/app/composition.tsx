/**
 * Composition presentation — the HBOM / FBOM / SBOM surface.
 *
 * Every component here is pure presentation: the graph, the posture rollup and
 * the reconciliation arithmetic all arrive as props, so this file imports types
 * only and can be dropped into a program page, an asset page or a preview rail
 * without dragging the seed data along.
 *
 * `BomTree` is the load-bearing one. It renders a strict parent-pointer tree as
 * one flat list of indented rows — never nested lists — so a 34-node system and
 * a 300-node one cost the same to read: collapsed below depth 2, filterable,
 * with the subtree's posture summarised on the parent row so a collapsed branch
 * never hides a CAT I.
 */

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

import {
  Badge,
  Button,
  Dot,
  KeyValue,
  Meter,
  Table,
  Toolbar,
  Id,
  Indicator,
  Empty,
} from "@/ds/primitives";
import type { Tone } from "@/ds/primitives";
import { Card } from "@/ds/patterns";
import { Inspector } from "@/ds/shapes";
import { cn } from "@/lib/utils";
import type { CompositionNode } from "@/lib/composition";
import { datasetToday } from "@/lib/dataset-clock";
import type { BomStats, NodePosture, ReconciliationRow } from "@/lib/graph-posture";

/* ------------------------------------------------------------- Shared bits */

const toneDot: Record<Tone, string> = {
  neutral: "bg-muted-foreground/40",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-primary",
};

/** Local copy of `postureTone` so this file stays type-only on the lib side. */
function postureToneOf(p: NodePosture): Tone {
  if (p.rolled.catI > 0) return "danger";
  if (p.rolled.catII > 0) return "warning";
  if (p.rolled.open === 0) return "success";
  return "neutral";
}

function severityToneOf(sev: string): Tone {
  return sev === "CAT I" ? "danger" : sev === "CAT II" ? "warning" : "neutral";
}

/** A digest is an identity, not a value — 16 hex characters is plenty to read. */
function shortDigest(digest: string): string {
  const cut = digest.indexOf(":");
  const scheme = cut < 0 ? "" : digest.slice(0, cut + 1);
  const body = cut < 0 ? digest : digest.slice(cut + 1);
  return scheme + (body.length > 16 ? `${body.slice(0, 16)}…` : body);
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "Feb 28, 2025" -> 20250228: sortable and comparable without a Date object,
 * because a clock in a render path desynchronises SSR from the client.
 * Unparsable and empty values sort last.
 */
function dateKey(value: string): number {
  const m = /^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/.exec(value.trim());
  if (!m) return Number.POSITIVE_INFINITY;
  const month = months.indexOf(m[1] ?? "");
  if (month < 0) return Number.POSITIVE_INFINITY;
  return Number(m[3]) * 10000 + (month + 1) * 100 + Number(m[2]);
}

/* ----------------------------------------------------------------- BomTree */

/**
 * The shape `BomTree` renders. Build it from `childrenOf` / `postureOf`: one
 * entry per composition node, children in display order, `posture` optional so
 * a cheap tree (an asset subtree, a preview) can skip the rollup entirely.
 */
export type BomTreeNode = {
  node: CompositionNode;
  posture?: NodePosture;
  children: BomTreeNode[];
};

type FlatRow = {
  node: CompositionNode;
  posture: NodePosture | undefined;
  depth: number;
  /** One entry per ancestor level: does that level still have siblings below? */
  lines: boolean[];
  hasChildren: boolean;
  open: boolean;
  /** Descendants beneath this node, excluding itself. */
  subtree: number;
};

type TreeIndex = {
  order: string[];
  parents: Map<string, string | null>;
  nodes: Map<string, CompositionNode>;
  counts: Map<string, number>;
};

function indexTree(root: BomTreeNode): TreeIndex {
  const index: TreeIndex = { order: [], parents: new Map(), nodes: new Map(), counts: new Map() };
  const seen = new Set<string>();

  // Cycle-safe by construction: a repeated id is dropped rather than followed.
  const walk = (entry: BomTreeNode, parent: string | null): number => {
    const id = entry.node.id;
    if (seen.has(id)) return 0;
    seen.add(id);
    index.order.push(id);
    index.parents.set(id, parent);
    index.nodes.set(id, entry.node);
    let total = 0;
    for (const child of entry.children) total += 1 + walk(child, id);
    index.counts.set(id, total);
    return total;
  };

  walk(root, null);
  return index;
}

function ancestorChain(index: TreeIndex, id: string | null | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  let current = id ? (index.parents.get(id) ?? null) : null;
  while (current && !seen.has(current)) {
    seen.add(current);
    out.push(current);
    current = index.parents.get(current) ?? null;
  }
  return out;
}

function matchesQuery(node: CompositionNode, q: string): boolean {
  return (
    node.name.toLowerCase().includes(q) ||
    node.id.toLowerCase().includes(q) ||
    node.kind.toLowerCase().includes(q) ||
    node.supplier.toLowerCase().includes(q) ||
    node.partKey.toLowerCase().includes(q) ||
    node.version.toLowerCase().includes(q) ||
    (node.partNumber ?? "").toLowerCase().includes(q)
  );
}

export function BomTree({
  root,
  selected,
  onSelect,
  defaultExpandedDepth = 2,
  showToolbar = true,
}: {
  root: BomTreeNode;
  /** CN- id of the row to highlight. Its ancestors auto-expand. */
  selected?: string | null;
  onSelect?: (nodeId: string) => void;
  /** Rows deeper than this stay collapsed until the reader opens them. */
  defaultExpandedDepth?: number;
  showToolbar?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState<Map<string, boolean>>(() => new Map());
  const [bulk, setBulk] = useState<boolean | null>(null);

  const index = useMemo(() => indexTree(root), [root]);
  const q = query.trim().toLowerCase();

  const hits = useMemo(() => {
    if (!q) return null;
    const found: string[] = [];
    for (const id of index.order) {
      const node = index.nodes.get(id);
      if (node && matchesQuery(node, q)) found.push(id);
    }
    return found;
  }, [index, q]);

  /** Matches plus every ancestor of a match — the branch the reader needs. */
  const keep = useMemo(() => {
    if (!hits) return null;
    const set = new Set<string>();
    for (const id of hits) {
      set.add(id);
      for (const up of ancestorChain(index, id)) set.add(up);
    }
    return set;
  }, [index, hits]);

  const forced = useMemo(() => new Set(ancestorChain(index, selected)), [index, selected]);

  const rows = useMemo<FlatRow[]>(() => {
    const out: FlatRow[] = [];
    const isOpen = (id: string, depth: number): boolean => {
      const override = manual.get(id);
      if (override !== undefined) return override;
      if (forced.has(id)) return true;
      if (bulk !== null) return bulk;
      return depth < defaultExpandedDepth;
    };

    const push = (entry: BomTreeNode, depth: number, lines: boolean[]) => {
      const id = entry.node.id;
      const children = keep ? entry.children.filter((c) => keep.has(c.node.id)) : entry.children;
      const hasChildren = children.length > 0;
      const open = hasChildren && (keep !== null || isOpen(id, depth));
      out.push({
        node: entry.node,
        posture: entry.posture,
        depth,
        lines,
        hasChildren,
        open,
        subtree: index.counts.get(id) ?? 0,
      });
      if (!open) return;
      children.forEach((child, i) => push(child, depth + 1, [...lines, i < children.length - 1]));
    };

    if (!keep || keep.has(root.node.id)) push(root, 0, []);
    return out;
  }, [root, index, keep, manual, forced, bulk, defaultExpandedDepth]);

  const toggle = (id: string, open: boolean) => {
    setManual((prev) => {
      const next = new Map(prev);
      next.set(id, !open);
      return next;
    });
  };

  return (
    <div>
      {showToolbar ? (
        <Toolbar
          search={query}
          onSearch={setQuery}
          placeholder="Search parts, suppliers"
          actions={
            <>
              <span className="tnum text-12 text-muted-foreground">
                {hits
                  ? `${hits.length} of ${index.order.length} parts`
                  : `${index.order.length} parts`}
              </span>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setManual(new Map());
                  setBulk(true);
                }}
              >
                Expand all
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setManual(new Map());
                  setBulk(false);
                }}
              >
                Collapse all
              </Button>
            </>
          }
        />
      ) : null}

      <Card className="p-1">
        {rows.length === 0 ? (
          <p className="px-2 py-3 text-12 text-muted-foreground">
            No part matches “{query.trim()}”.
          </p>
        ) : (
          <div role="tree" aria-label="System composition">
            {rows.map((r) => (
              <BomTreeRow
                key={r.node.id}
                row={r}
                selected={selected === r.node.id}
                onToggle={() => toggle(r.node.id, r.open)}
                {...(onSelect ? { onSelect: () => onSelect(r.node.id) } : {})}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function BomTreeRow({
  row,
  selected,
  onSelect,
  onToggle,
}: {
  row: FlatRow;
  selected: boolean;
  onSelect?: () => void;
  onToggle: () => void;
}) {
  const { node, posture } = row;
  const open = posture?.rolled.open ?? 0;

  const label = (
    <>
      <span className={cn("min-w-0 truncate text-[12.5px]", selected ? "font-semibold" : "")}>
        {node.name}
      </span>
      <Badge size="xs" className="shrink-0">
        {node.kind}
      </Badge>
      {node.version === "—" ? null : (
        <Id className="shrink-0 text-muted-foreground">{node.version}</Id>
      )}
      {node.asset ? (
        <Id className="hidden shrink-0 text-muted-foreground sm:inline">{node.asset}</Id>
      ) : null}
    </>
  );

  return (
    <div
      role="treeitem"
      aria-level={row.depth + 1}
      aria-selected={selected}
      aria-expanded={row.hasChildren ? row.open : undefined}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-md pr-2 transition-colors duration-100",
        selected ? "bg-primary-soft" : "hover:bg-surface-hover",
      )}
    >
      <span aria-hidden className="flex h-full shrink-0 items-stretch">
        {row.lines.map((line, i) => (
          <span
            key={i}
            className={cn("w-4 border-l", line ? "border-border-subtle" : "border-transparent")}
          />
        ))}
      </span>

      {row.hasChildren ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={row.open ? `Collapse ${node.name}` : `Expand ${node.name}`}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform duration-100",
              row.open ? "rotate-90" : "",
            )}
          />
        </button>
      ) : (
        <span aria-hidden className="inline-flex size-5 shrink-0 items-center justify-center">
          <span className="size-1 rounded-full bg-border-strong" />
        </span>
      )}

      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          title={`${node.id} — ${node.name}`}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 text-left",
            selected ? "text-primary" : "",
          )}
        >
          {label}
        </button>
      ) : (
        <span
          className="flex min-w-0 flex-1 items-center gap-2"
          title={`${node.id} — ${node.name}`}
        >
          {label}
        </span>
      )}

      <span className="flex shrink-0 items-center gap-2">
        {node.attested ? null : (
          <span title="No supplier attestation on file" className="flex items-center">
            <Dot tone="warning" />
          </span>
        )}
        {!row.open && row.subtree > 0 ? (
          <span
            title={`${row.subtree} parts beneath`}
            className="tnum text-11 text-muted-foreground"
          >
            {row.subtree}
          </span>
        ) : null}
        {posture && open > 0 ? (
          <span
            title={`${posture.rolled.catI} CAT I, ${posture.rolled.catII} CAT II, ${posture.rolled.catIII} CAT III open in this subtree`}
            className="flex items-center"
          >
            <Badge size="xs" tone={postureToneOf(posture)}>
              {open} open
            </Badge>
          </span>
        ) : null}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------- NodeRail */

export function NodeRail({
  node,
  posture,
}: {
  node: CompositionNode;
  posture?: NodePosture | null;
}) {
  return (
    <>
      <Inspector.Group title="Component">
        <KeyValue label="Node">
          <Id>{node.id}</Id>
        </KeyValue>
        <KeyValue label="Kind">{node.kind}</KeyValue>
        <KeyValue label="Class">{node.class}</KeyValue>
        <KeyValue label="Version">
          {node.version === "—" ? <Empty /> : <Id>{node.version}</Id>}
        </KeyValue>
        <KeyValue label="Criticality">{node.criticality}</KeyValue>
        <KeyValue label="Trust zone">{node.zone}</KeyValue>
        {node.asset ? (
          <KeyValue label="Asset">
            <Id>{node.asset}</Id>
          </KeyValue>
        ) : null}
      </Inspector.Group>

      <Inspector.Group title="Supply chain">
        <KeyValue label="Supplier">{node.supplier}</KeyValue>
        <KeyValue label="Origin">{node.origin}</KeyValue>
        <KeyValue label="Part key">
          <span title={node.partKey}>
            <Id>{node.partKey}</Id>
          </span>
        </KeyValue>
        {node.partNumber ? (
          <KeyValue label="Part number">
            <Id>{node.partNumber}</Id>
          </KeyValue>
        ) : null}
        {node.digest ? (
          <KeyValue label="Digest">
            <span title={node.digest}>
              <Id>{shortDigest(node.digest)}</Id>
            </span>
          </KeyValue>
        ) : null}
        {node.eol ? <KeyValue label="End of life">{node.eol}</KeyValue> : null}
        <KeyValue label="BOM source">{node.bomSource}</KeyValue>
        <KeyValue label="BOM document">{node.bom ? <Id>{node.bom}</Id> : <Empty />}</KeyValue>
        <KeyValue label="Attested">
          <Badge size="xs" tone={node.attested ? "success" : "warning"}>
            {node.attested ? "On file" : "Not on file"}
          </Badge>
        </KeyValue>
      </Inspector.Group>

      {posture ? (
        <Inspector.Group title="Posture">
          <KeyValue label="Subtree">
            {posture.nodes} {posture.nodes === 1 ? "node" : "nodes"}
          </KeyValue>
          <KeyValue label="Open">
            <span className="tnum">{posture.rolled.open}</span>
          </KeyValue>
          <KeyValue label="Worst">
            {posture.worst ? (
              <Indicator tone={severityToneOf(posture.worst)}>{posture.worst}</Indicator>
            ) : (
              <Empty />
            )}
          </KeyValue>
          <KeyValue label="On this part">
            <span className="tnum">
              {posture.own.open} open of {posture.own.total}
            </span>
          </KeyValue>
          <KeyValue label="Unattested">
            <span className={cn("tnum", posture.unattested > 0 ? "text-warning" : "")}>
              {posture.unattested}
            </span>
          </KeyValue>
          <KeyValue label="Suppliers">
            <span title={posture.suppliers.join(", ")}>{posture.suppliers.length}</span>
          </KeyValue>
        </Inspector.Group>
      ) : null}

      {node.note && node.note !== "—" ? (
        <Inspector.Group title="Note">
          <div className="pt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {node.note}
          </div>
        </Inspector.Group>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------- PostureStrip */

export function PostureStrip({ posture }: { posture: NodePosture }) {
  const { rolled } = posture;
  const legend: { key: string; label: string; value: number; tone: Tone }[] = [
    { key: "i", label: "CAT I", value: rolled.catI, tone: "danger" },
    { key: "ii", label: "CAT II", value: rolled.catII, tone: "warning" },
    { key: "iii", label: "CAT III", value: rolled.catIII, tone: "neutral" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="tnum text-20 font-semibold leading-none">{rolled.open}</span>
        <span className="tnum text-12 text-muted-foreground">
          open across {posture.nodes} {posture.nodes === 1 ? "node" : "nodes"} · {posture.own.open}{" "}
          on this part · {rolled.total} recorded
        </span>
        {posture.worst ? (
          <span className="ml-auto flex items-center">
            <Indicator tone={severityToneOf(posture.worst)}>Worst {posture.worst}</Indicator>
          </span>
        ) : null}
      </div>

      <Meter.Stacked
        segments={legend.map((l) => ({
          key: l.key,
          value: l.value,
          tone: l.tone,
          title: `${l.label} — ${l.value}`,
        }))}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {legend.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5 text-12">
            <span className={cn("size-1.5 rounded-full", toneDot[l.tone])} />
            <span className="text-muted-foreground">{l.label}</span>
            <span className="tnum font-medium">{l.value}</span>
          </span>
        ))}
        {rolled.open === 0 ? (
          <span className="text-12 text-muted-foreground">No open findings in this subtree</span>
        ) : null}
        <span className="tnum ml-auto text-12 text-muted-foreground">
          {posture.unattested} unattested · {posture.suppliers.length} suppliers
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- ReconciliationTable */

function CatTriple({
  catI,
  catII,
  catIII,
  total,
}: {
  catI: number;
  catII: number;
  catIII: number;
  total: number;
}) {
  return (
    <span
      className="tnum flex items-center gap-1 text-12"
      title={`${catI} CAT I, ${catII} CAT II, ${catIII} CAT III of ${total} open`}
    >
      <span className={catI > 0 ? "font-medium text-danger" : "text-muted-foreground"}>{catI}</span>
      <span className="text-border-strong">/</span>
      <span className={catII > 0 ? "font-medium text-warning" : "text-muted-foreground"}>
        {catII}
      </span>
      <span className="text-border-strong">/</span>
      <span className={catIII > 0 ? "text-foreground" : "text-muted-foreground"}>{catIII}</span>
      <span className="ml-1 text-muted-foreground">· {total}</span>
    </span>
  );
}

export function ReconciliationTable({
  rows,
  onSelect,
}: {
  rows: ReconciliationRow[];
  onSelect?: (assetId: string) => void;
}) {
  return (
    <Table className="table-fixed">
      <colgroup>
        <col style={{ width: "96px" }} />
        <col style={{ width: "184px" }} />
        <col style={{ width: "136px" }} />
        <col style={{ width: "136px" }} />
        <col style={{ width: "76px" }} />
        <col style={{ width: "116px" }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Asset</Table.Header>
          <Table.Header>Component</Table.Header>
          <Table.Header>Scanner declared</Table.Header>
          <Table.Header>Register tracked</Table.Header>
          <Table.Header className="text-right">Delta</Table.Header>
          <Table.Header>State</Table.Header>
          <Table.Header>Note</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Table.Row
            key={r.asset}
            className={onSelect ? "cursor-pointer" : undefined}
            onClick={onSelect ? () => onSelect(r.asset) : undefined}
          >
            <Table.Id id={r.asset} tone={onSelect ? "primary" : "muted"} />
            <Table.Cell className="truncate" title={r.name}>
              {r.name}
            </Table.Cell>
            <Table.Cell>
              <CatTriple
                catI={r.declared.catI}
                catII={r.declared.catII}
                catIII={r.declared.catIII}
                total={r.declared.total}
              />
            </Table.Cell>
            <Table.Cell>
              <CatTriple
                catI={r.derived.catI}
                catII={r.derived.catII}
                catIII={r.derived.catIII}
                total={r.derived.total}
              />
            </Table.Cell>
            <Table.Cell className={cn("tnum text-right", r.delta === 0 ? "" : "text-warning")}>
              {r.delta > 0 ? `+${r.delta}` : r.delta}
            </Table.Cell>
            <Table.Cell>
              <Badge size="xs" tone={r.agrees ? "success" : "warning"}>
                {r.agrees ? "Reconciled" : "Unreconciled"}
              </Badge>
            </Table.Cell>
            <Table.Cell className="truncate" title={r.note}>
              {r.note}
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/* --------------------------------------------------------------- BomSummary */

function MeterRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: Tone;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-[108px] shrink-0 truncate text-12 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1">
        <Meter value={pct} tone={tone} />
      </span>
      <span className="tnum w-8 shrink-0 text-right text-12 font-medium">{value}</span>
      <span className="tnum w-9 shrink-0 text-right text-12 text-muted-foreground">{pct}%</span>
    </div>
  );
}

/** Provenance is the point of a supply-chain read-out, so it carries colour. */
const originTone: Record<string, Tone> = {
  Internal: "info",
  Domestic: "info",
  Allied: "info",
  Foreign: "warning",
  Unknown: "danger",
};

export function BomSummary({ stats }: { stats: BomStats }) {
  const metrics: { label: string; value: number; note: string; warn: boolean }[] = [
    { label: "Parts", value: stats.nodes, note: "in the composition", warn: false },
    { label: "Suppliers", value: stats.suppliers, note: "distinct", warn: false },
    {
      label: "Unattested",
      value: stats.unattested,
      note: "no attestation on file",
      warn: stats.unattested > 0,
    },
    {
      label: "Unsigned BOMs",
      value: stats.unsignedBoms,
      note: "delivered without a signature",
      warn: stats.unsignedBoms > 0,
    },
    {
      label: "Mission critical",
      value: stats.missionCritical,
      note: "criticality analysis",
      warn: false,
    },
  ];

  return (
    <div className="space-y-5 pt-3">
      <div className="grid grid-cols-2 border-y border-border md:grid-cols-5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="border-b border-border px-4 py-3 first:pl-0 md:border-b-0 md:border-r md:last:border-r-0"
          >
            <div className="text-[12px] text-muted-foreground">{m.label}</div>
            <div className="mt-0.5">
              <span
                className={cn(
                  "tnum text-[20px] font-semibold tracking-[-0.02em]",
                  m.warn ? "text-warning" : "",
                )}
              >
                {m.value}
              </span>
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">{m.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-3">
        <div>
          <h3 className="pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            By class
          </h3>
          {stats.byClass.map((c) => (
            <MeterRow
              key={c.class}
              label={c.class}
              value={c.count}
              total={stats.nodes}
              tone="info"
            />
          ))}
        </div>
        <div>
          <h3 className="pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            By BOM source
          </h3>
          {stats.bySource.map((s) => (
            <MeterRow
              key={s.source}
              label={s.source}
              value={s.count}
              total={stats.nodes}
              tone="info"
            />
          ))}
        </div>
        <div>
          <h3 className="pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            By supplier origin
          </h3>
          {stats.byOrigin.map((o) => (
            <MeterRow
              key={o.origin}
              label={o.origin}
              value={o.count}
              total={stats.nodes}
              tone={originTone[o.origin] ?? "info"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- SupplyChainTable */

type SupplierRow = {
  supplier: string;
  origins: string[];
  parts: number;
  attested: number;
  unattested: number;
  critical: number;
  eol: string;
  eolKey: number;
};

function groupSuppliers(nodes: CompositionNode[]): SupplierRow[] {
  const map = new Map<string, SupplierRow>();

  for (const node of nodes) {
    let row = map.get(node.supplier);
    if (!row) {
      row = {
        supplier: node.supplier,
        origins: [],
        parts: 0,
        attested: 0,
        unattested: 0,
        critical: 0,
        eol: "—",
        eolKey: Number.POSITIVE_INFINITY,
      };
      map.set(node.supplier, row);
    }
    row.parts += 1;
    if (node.attested) row.attested += 1;
    else row.unattested += 1;
    if (node.criticality === "Mission critical") row.critical += 1;
    if (!row.origins.includes(node.origin)) row.origins.push(node.origin);
    if (node.eol) {
      const key = dateKey(node.eol);
      if (key < row.eolKey) {
        row.eolKey = key;
        row.eol = node.eol;
      }
    }
  }

  // Worst provenance first: what the reader has to chase sits at the top.
  return [...map.values()].sort(
    (a, b) =>
      b.unattested - a.unattested || b.parts - a.parts || a.supplier.localeCompare(b.supplier),
  );
}

export function SupplyChainTable({
  nodes,
  asOf = datasetToday,
}: {
  nodes: CompositionNode[];
  /** Injected clock — a render path never calls `new Date()`. */
  asOf?: string;
}) {
  const rows = useMemo(() => groupSuppliers(nodes), [nodes]);
  const today = dateKey(asOf);

  return (
    <Table className="table-fixed">
      <colgroup>
        <col />
        <col style={{ width: "116px" }} />
        <col style={{ width: "68px" }} />
        <col style={{ width: "80px" }} />
        <col style={{ width: "164px" }} />
        <col style={{ width: "100px" }} />
        <col style={{ width: "136px" }} />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Supplier</Table.Header>
          <Table.Header>Origin</Table.Header>
          <Table.Header className="text-right">Parts</Table.Header>
          <Table.Header className="text-right">Critical</Table.Header>
          <Table.Header>Attestation</Table.Header>
          <Table.Header className="text-right">Unattested</Table.Header>
          <Table.Header>Earliest EOL</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const origin = r.origins[0] ?? "Unknown";
          const past = r.eolKey <= today;
          return (
            <Table.Row key={r.supplier}>
              <Table.Cell className="truncate" title={r.supplier}>
                {r.supplier}
              </Table.Cell>
              <Table.Cell className="truncate" title={r.origins.join(", ")}>
                <Badge size="xs" tone={originTone[origin] ?? "neutral"}>
                  {r.origins.length > 1 ? `${origin} +${r.origins.length - 1}` : origin}
                </Badge>
              </Table.Cell>
              <Table.Cell className="tnum text-right">{r.parts}</Table.Cell>
              <Table.Cell className="tnum text-right">{r.critical}</Table.Cell>
              <Table.Cell>
                <span className="flex items-center gap-2">
                  <span className="w-20">
                    <Meter.Stacked
                      height={4}
                      segments={[
                        { key: "a", value: r.attested, tone: "success" },
                        { key: "u", value: r.unattested, tone: "warning" },
                      ]}
                    />
                  </span>
                  <span className="tnum text-12 text-muted-foreground">
                    {r.attested}/{r.parts}
                  </span>
                </span>
              </Table.Cell>
              <Table.Cell className={cn("tnum text-right", r.unattested > 0 ? "text-warning" : "")}>
                {r.unattested}
              </Table.Cell>
              <Table.Cell className={cn("tnum", past && "text-danger")}>
                {r.eol === "—" ? <Empty /> : r.eol}
                {past ? <span className="pl-1 text-11">past</span> : null}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}
