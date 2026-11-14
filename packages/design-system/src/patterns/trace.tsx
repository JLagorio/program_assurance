import { useRender } from "@base-ui/react/use-render";
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { Count } from "../components/badge";
import { Button } from "../components/button";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

/** One record of a stage. */
export type TraceNode = {
  /** Unique in the trace: what a link's ends and `focus` name. */
  id: string;
  /** The record's name. Cut after three lines; the whole name stays the node's name. */
  title: string;
  /** Its identifier, read before the name: "AU-10", "REQ-360". */
  code?: string | undefined;
  /**
   * A mark before the name that carries the record's state: a Dot, an Icon. Colour never says a
   * state alone, so say it in `meta` too, or give the mark a label.
   */
  mark?: ReactNode | undefined;
  /** One short fact under the name: its status, its due day. Text and marks, never a control. */
  meta?: ReactNode | undefined;
  /** The link element (a router's Link, or `<a href>`) the node opens. Without it the node is text. */
  link?: ReactElement | undefined;
};

/** One step of the chain: a named column of records. */
export type TraceStage = {
  /** Unique among the stages. */
  id: string;
  /** The stage's name, as its records are called: "Controls". */
  label: string;
  /** Its records, in the order they read where nothing links them. */
  nodes: readonly TraceNode[];
  /** What the stage says when it holds no record: "No evidence cited". */
  empty?: string | undefined;
  /**
   * The step that closes the stage's gap: a small TextLink whose words are the step, "Link
   * evidence", or a link-styled Button where the step opens over the page. It is drawn whenever it
   * is given: under `empty` while the stage holds no record, and after its records (and their Show
   * more) while it holds some, so a stage that holds part of what it needs carries the step that
   * adds the rest, "Map 3 more objectives". It is not a record: it stays out of the stage's list
   * and count. Give it only where the reader can take the step from the record the trace is about;
   * a stage with nothing wrong in it has none.
   */
  action?: ReactNode | undefined;
};

/**
 * A link between two records, by their ids. It is drawn from the earlier stage to the later one,
 * whichever end is named first, and through any stage between them, one with no record included.
 */
export type TraceLink = { from: string; to: string };

type TraceOwnProps = {
  /** The stages in the order the chain reads, start to end. */
  stages: readonly TraceStage[];
  /** The links between the records of different stages. A link inside one stage is not drawn. */
  links: readonly TraceLink[];
  /** The record the trace is about: it is marked current, and the others are ordered around it. */
  focus?: string | undefined;
  /** The trace's accessible name: what it follows, and from which record. */
  label: string;
  /** How many records a stage shows before the rest fold behind Show more. @default 8 */
  limit?: number | undefined;
  className?: string | undefined;
};

/** The part's own props, and the native props and ref of its box. */
export type TraceProps = TraceOwnProps &
  Omit<ComponentProps<"div">, keyof TraceOwnProps | "children" | "role">;

/** A place in a column: a record, or the gap a link takes through a stage it passes. */
type Entry = { id: string; node?: TraceNode | undefined };
/** One link as the entries it runs through, start to end, with the records at its two ends. */
type Chain = { key: string; from: string; to: string; through: string[] };

const NODE = '[data-slot="trace-node"]';

/** The narrowest a column reads, and the room the wires take between two: steps of the spacing scale. */
const COLUMN = 128;
const GAP = 32;

function push(map: Map<string, string[]>, key: string, value: string) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/**
 * Where everything stands: each stage's records in the order that keeps the wires apart, the
 * records folded behind Show more, and each link as the places it runs through. The order starts
 * at the focus's stage and works outward: a record sits at the middle of the records it is linked
 * to on the side nearer the focus, and one linked to nothing there keeps its place.
 */
function arrange(
  stages: readonly TraceStage[],
  links: readonly TraceLink[],
  focus: string | undefined,
  limit: number,
  expanded: ReadonlySet<string>,
) {
  const stageOf = new Map<string, number>();
  stages.forEach((stage, index) => stage.nodes.forEach((node) => stageOf.set(node.id, index)));

  // Each link once, from the earlier stage to the later one.
  const pairs: { from: string; to: string }[] = [];
  const known = new Set<string>();
  for (const link of links) {
    const a = stageOf.get(link.from);
    const b = stageOf.get(link.to);
    if (a === undefined || b === undefined || a === b) continue;
    const [from, to] = a < b ? [link.from, link.to] : [link.to, link.from];
    const key = `${from}\u0000${to}`;
    if (known.has(key)) continue;
    known.add(key);
    pairs.push({ from, to });
  }

  // The records each stage shows, in the caller's order: the focus is never folded.
  const hidden = new Set<string>();
  const folded = stages.map((stage) => {
    if (expanded.has(stage.id) || stage.nodes.length <= limit) return 0;
    const shown = new Set(stage.nodes.slice(0, limit).map((node) => node.id));
    if (focus !== undefined && stageOf.get(focus) === stages.indexOf(stage) && !shown.has(focus)) {
      shown.delete(stage.nodes[limit - 1]!.id);
      shown.add(focus);
    }
    for (const node of stage.nodes) if (!shown.has(node.id)) hidden.add(node.id);
    return stage.nodes.length - shown.size;
  });

  const columns: Entry[][] = stages.map((stage) =>
    stage.nodes.filter((node) => !hidden.has(node.id)).map((node) => ({ id: node.id, node })),
  );
  const chains: Chain[] = [];
  for (const { from, to } of pairs) {
    if (hidden.has(from) || hidden.has(to)) continue;
    const through = [from];
    for (let at = stageOf.get(from)! + 1; at < stageOf.get(to)!; at += 1) {
      const id = `pass:${chains.length}:${at}`;
      columns[at]!.push({ id });
      through.push(id);
    }
    through.push(to);
    chains.push({ key: `${from}\u0000${to}`, from, to, through });
  }

  const before = new Map<string, string[]>();
  const after = new Map<string, string[]>();
  for (const chain of chains)
    for (let at = 0; at + 1 < chain.through.length; at += 1) {
      push(after, chain.through[at]!, chain.through[at + 1]!);
      push(before, chain.through[at + 1]!, chain.through[at]!);
    }
  // A place in a column, measured from the column's middle, since the columns are centred.
  const places = (column: Entry[]) =>
    new Map(column.map((entry, index) => [entry.id, index - (column.length - 1) / 2]));
  const order = (column: Entry[], near: Map<string, string[]>, beside: Entry[]) => {
    const at = places(beside);
    const own = places(column);
    return column
      .map((entry, index) => {
        const linked = (near.get(entry.id) ?? [])
          .map((id) => at.get(id))
          .filter((place): place is number => place !== undefined);
        const middle = linked.length
          ? linked.reduce((sum, place) => sum + place, 0) / linked.length
          : own.get(entry.id)!;
        return { entry, index, middle };
      })
      .sort((a, b) => a.middle - b.middle || a.index - b.index)
      .map((item) => item.entry);
  };
  const start = (focus === undefined ? undefined : stageOf.get(focus)) ?? 0;
  for (let at = start + 1; at < columns.length; at += 1)
    columns[at] = order(columns[at]!, before, columns[at - 1]!);
  for (let at = start - 1; at >= 0; at -= 1)
    columns[at] = order(columns[at]!, after, columns[at + 1]!);

  return { columns, chains, folded };
}

/** The records a record leads to and comes from, through any number of links: its path. */
function pathOf(active: string | null, chains: readonly Chain[]) {
  if (active === null) return null;
  const next = new Map<string, string[]>();
  const previous = new Map<string, string[]>();
  for (const chain of chains) {
    push(next, chain.from, chain.to);
    push(previous, chain.to, chain.from);
  }
  const reached = new Set([active]);
  for (const way of [next, previous]) {
    const queue = [active];
    for (let at = 0; at < queue.length; at += 1)
      for (const id of way.get(queue[at]!) ?? [])
        if (!reached.has(id)) {
          reached.add(id);
          queue.push(id);
        }
  }
  return reached;
}

function Node({
  node,
  current,
  lit,
  description,
}: {
  node: TraceNode;
  current: boolean;
  lit: boolean;
  /** What the record is linked to, in words, for a reader who cannot see the wires. */
  description: string | undefined;
}) {
  const describedBy = useId();
  const body = useRender({
    defaultTagName: node.link ? "a" : "div",
    render: node.link,
    props: {
      ...(current ? { "aria-current": "true" as const } : {}),
      ...(description ? { "aria-describedby": describedBy } : {}),
      children: (
        <>
          {node.mark ? <span data-slot="trace-node-mark">{node.mark}</span> : null}
          <span data-slot="trace-node-text">
            {node.code ? <span data-slot="trace-node-code">{node.code}</span> : null}
            <span data-slot="trace-node-title" title={node.title}>
              {node.title}
            </span>
            {node.meta ? <span data-slot="trace-node-meta">{node.meta}</span> : null}
          </span>
        </>
      ),
      ...{ "data-slot": "trace-node-body" },
    },
  });
  return (
    <li data-slot="trace-node" data-trace-id={node.id} {...(lit ? { "data-lit": "" } : {})}>
      {body}
      {description ? (
        <span id={describedBy} hidden>
          {description}
        </span>
      ) : null}
    </li>
  );
}

/**
 * The stages of a chain as columns of records joined by wires: what a requirement answers, what
 * proves it, what was found against it and what is being done. It shows several hops at once,
 * where a record page's tables show one. Hovering or focusing a record lights its path. To
 * assistive technology it is a list of stages, each a named list of records that say what they
 * are linked to; in a narrow container the stages stack and the wires leave.
 */
export function Trace({
  stages,
  links,
  focus,
  label,
  limit = 8,
  className,
  onPointerOver,
  onPointerLeave,
  onFocus,
  onBlur,
  ref,
  ...props
}: TraceProps) {
  const { t, locale, formatPlural } = useLedgerLocale();
  const prefix = useId();
  const own = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [active, setActive] = useState<string | null>(null);
  const [stacked, setStacked] = useState(false);
  const [wires, setWires] = useState<{ key: string; d: string }[]>([]);

  const { columns, chains, folded } = useMemo(
    () => arrange(stages, links, focus, Math.max(1, limit), expanded),
    [stages, links, focus, limit, expanded],
  );
  const lit = useMemo(() => pathOf(active, chains), [active, chains]);

  // What each record is linked to, by name, as its description.
  const descriptions = useMemo(() => {
    const names = new Map<string, string>();
    for (const stage of stages)
      for (const node of stage.nodes)
        names.set(node.id, node.code ? `${node.code} ${node.title}` : node.title);
    const linked = new Map<string, string[]>();
    for (const chain of chains) {
      push(linked, chain.from, names.get(chain.to) ?? chain.to);
      push(linked, chain.to, names.get(chain.from) ?? chain.from);
    }
    const list = new Intl.ListFormat(locale, { type: "conjunction" });
    return new Map(
      [...linked].map(([id, items]) => [id, t("traceLinkedTo", { items: list.format(items) })]),
    );
  }, [stages, chains, locale, t]);

  // The columns stand side by side while each has room to read; in less they stack, and the
  // wires, which would cross the records, leave. Measured on the part's own box.
  const count = stages.length;
  useLayoutEffect(() => {
    const node = own.current;
    if (!node) return;
    const measure = () => setStacked(node.clientWidth < count * COLUMN + (count - 1) * GAP);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [count]);

  // Each wire, drawn from where its records stand: out of the side of one that faces the next,
  // straight through any gap it takes in a stage between, and into the facing side of the last.
  useLayoutEffect(() => {
    const node = own.current;
    if (!node || stacked) {
      setWires((current) => (current.length ? [] : current));
      return;
    }
    const draw = () => {
      const frame = node.getBoundingClientRect();
      const boxes = new Map<string, DOMRect>();
      for (const element of node.querySelectorAll<HTMLElement>("[data-trace-id]"))
        boxes.set(element.dataset["traceId"] ?? "", element.getBoundingClientRect());
      const round = (value: number) => Math.round(value * 10) / 10;
      const next: { key: string; d: string }[] = [];
      for (const chain of chains) {
        let d = "";
        for (let at = 0; at + 1 < chain.through.length; at += 1) {
          const a = boxes.get(chain.through[at]!);
          const b = boxes.get(chain.through[at + 1]!);
          if (!a || !b) {
            d = "";
            break;
          }
          const forward = a.left + a.width / 2 <= b.left + b.width / 2;
          const x1 = round((forward ? a.right : a.left) - frame.left);
          const y1 = round(a.top + a.height / 2 - frame.top);
          const x2 = round((forward ? b.left : b.right) - frame.left);
          const y2 = round(b.top + b.height / 2 - frame.top);
          const bend = round((x2 - x1) / 2);
          d += `${at === 0 ? `M${x1} ${y1}` : `L${x1} ${y1}`}C${x1 + bend} ${y1} ${x2 - bend} ${y2} ${x2} ${y2}`;
        }
        if (d) next.push({ key: chain.key, d });
      }
      setWires((current) =>
        current.length === next.length &&
        current.every((wire, index) => wire.key === next[index]!.key && wire.d === next[index]!.d)
          ? current
          : next,
      );
    };
    draw();
    if (typeof ResizeObserver === "undefined") return;
    // A record's own box changes as its text wraps or a web font arrives.
    const observer = new ResizeObserver(draw);
    observer.observe(node);
    for (const element of node.querySelectorAll<HTMLElement>("[data-trace-id]"))
      observer.observe(element);
    return () => observer.disconnect();
  }, [chains, columns, stacked]);

  const nodeAt = (target: EventTarget | null) =>
    target instanceof Element
      ? (target.closest<HTMLElement>(NODE)?.dataset["traceId"] ?? null)
      : null;

  return (
    <div
      {...props}
      ref={(node) => {
        own.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      role="group"
      aria-label={label}
      data-slot="trace"
      data-layout={stacked ? "stack" : "columns"}
      {...(lit ? { "data-active": "" } : {})}
      className={cn(className)}
      onPointerOver={(event: PointerEvent<HTMLDivElement>) => {
        onPointerOver?.(event);
        setActive(nodeAt(event.target));
      }}
      onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
        onPointerLeave?.(event);
        setActive(null);
      }}
      onFocus={(event: FocusEvent<HTMLDivElement>) => {
        onFocus?.(event);
        setActive(nodeAt(event.target));
      }}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget)) setActive(null);
      }}
    >
      {wires.length ? (
        <svg data-slot="trace-wires" aria-hidden focusable="false">
          {wires.map((wire) => {
            const [from, to] = wire.key.split("\u0000");
            const on = !!lit && lit.has(from ?? "") && lit.has(to ?? "");
            return (
              <path
                key={wire.key}
                data-slot="trace-wire"
                d={wire.d}
                {...(on ? { "data-lit": "" } : {})}
              />
            );
          })}
        </svg>
      ) : null}
      <ol
        data-slot="trace-stages"
        style={{ gridTemplateColumns: stacked ? undefined : `repeat(${count}, minmax(0, 1fr))` }}
      >
        {stages.map((stage, index) => {
          const heading = `${prefix}-${index}`;
          const column = columns[index] ?? [];
          const more = folded[index] ?? 0;
          const open = expanded.has(stage.id) && stage.nodes.length > limit;
          return (
            <li key={stage.id} data-slot="trace-stage">
              <div data-slot="trace-stage-header" id={heading}>
                <span>{stage.label}</span>
                <Count value={stage.nodes.length} max={999} />
              </div>
              <div data-slot="trace-stage-body">
                {stage.nodes.length ? (
                  <ul data-slot="trace-nodes" aria-labelledby={heading}>
                    {column.map((entry) =>
                      entry.node ? (
                        <Node
                          key={entry.id}
                          node={entry.node}
                          current={entry.id === focus}
                          lit={!!lit && lit.has(entry.id)}
                          description={descriptions.get(entry.id)}
                        />
                      ) : (
                        // The gap a link takes through a stage it passes: room, and nothing to read.
                        <li
                          key={entry.id}
                          data-slot="trace-pass"
                          data-trace-id={entry.id}
                          role="presentation"
                          aria-hidden
                        />
                      ),
                    )}
                  </ul>
                ) : stage.empty ? (
                  <p data-slot="trace-empty">{stage.empty}</p>
                ) : null}
                {more > 0 || open ? (
                  <Button
                    size="small"
                    variant="subtle"
                    aria-expanded={open}
                    onClick={() =>
                      setExpanded((current) => {
                        const next = new Set(current);
                        if (next.has(stage.id)) next.delete(stage.id);
                        else next.add(stage.id);
                        return next;
                      })
                    }
                  >
                    {open
                      ? t("traceShowFewer")
                      : formatPlural(more, {
                          one: t("traceShowMoreOne"),
                          other: t("traceShowMoreOther"),
                        })}
                  </Button>
                ) : null}
                {/* The stage's step: after its records and their Show more, outside their list, or
                    under what a stage with nothing in it says. */}
                {stage.action ? <div data-slot="trace-action">{stage.action}</div> : null}
                {!stage.nodes.length && column.length ? (
                  // A stage with nothing in it still gives each link that passes it a gap of its own,
                  // under what it says and its step, so the wire runs through it and never over them.
                  <div data-slot="trace-passes" aria-hidden>
                    {column.map((entry) => (
                      <div key={entry.id} data-slot="trace-pass" data-trace-id={entry.id} />
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
