import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { Dot } from "../components/badge";
import { Tally, type TallyFill, type TallySegment, type TallyTone } from "../components/tally";
import { Tooltip, TooltipContent } from "../components/tooltip";
import { announce } from "../lib/announce";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Card, CardHead } from "./chart/_card";

/** One item behind a row: a tick in the row, in a TileMap mark's tones and fills. */
export type LadderMark = {
  /** Unique in its node. */
  key: string;
  /** Its name: the first line of its tooltip. */
  label: string;
  /** Its state in words: the tooltip's second line. Colour never says it alone. */
  description?: string | undefined;
  /** @default "neutral" */
  tone?: TallyTone | undefined;
  /** @default "solid" */
  fill?: TallyFill | undefined;
};

/** One node of a level. */
export type LadderNode = {
  /** Unique in the ladder: what a link's ends, `selected` and `highlighted` name. */
  id: string;
  /** The node's name. A card shows two lines of it and a row one; the whole name stays the node's name. */
  title: string;
  /** The figure after the name, "value/total": how much of what stands behind the node is held. */
  value?: number | undefined;
  total?: number | undefined;
  /** The figure in words, for the node's name and its tooltip: "69 of 149 controls held". "69 of 149" unsaid. */
  valueLabel?: string | undefined;
  /** The tally under a card's name: the shares of `total` by state. A row with no `marks` draws it too. */
  segments?: readonly TallySegment[] | undefined;
  /** A row's items, one mark each, in the order given. */
  marks?: readonly LadderMark[] | undefined;
  /**
   * Nothing stands behind the node, and that needs attention: its figure and its wire wear the
   * danger tone, its level's heading counts it, and every node that leads to it counts it before
   * its own figure.
   */
  flagged?: boolean | undefined;
  /**
   * Marks the node with a round Dot before its name, and says why: the words are part of the
   * node's name and a line of its tooltip ("Chosen by the program"). One meaning a ladder; say it
   * beside the ladder too, with the same `Dot shape="round"`, since a mark never stands without
   * its words.
   */
  marked?: string | undefined;
  /** A sentence or two about the node: the last line of its tooltip. */
  description?: string | undefined;
};

/** One level of the ladder: a named run of nodes. */
export type LadderLevel = {
  /** Unique among the levels. */
  id: string;
  /** The level's name, as its nodes are called: "Objectives". */
  label: string;
  /** Its nodes, in the order they read. The ladder never reorders them. */
  nodes: readonly LadderNode[];
  /**
   * `cards` is a name over a tally. `rows` is one line a node (its name, its figure, its marks),
   * each row beside the node of the level before that it is first linked to: for the last level
   * only, and the level of many. @default "cards"
   */
  layout?: "cards" | "rows" | undefined;
  /** What the level says when it holds no node. */
  empty?: string | undefined;
};

/** A link between two nodes of different levels, by their ids, either end first. */
export type LadderLink = { from: string; to: string };

type LadderOwnProps = {
  /** The levels in order, from the first to the last. */
  levels: readonly LadderLevel[];
  /**
   * What is linked to what. A link between neighbouring levels is drawn as a wire. A link that
   * passes over a level is not drawn: it says which nodes of the further level are on the nearer
   * node's path, where the wires alone would say every node the level between leads to.
   */
  links: readonly LadderLink[];
  /** The ladder's accessible name: what its levels are, and what its figures count. */
  label: string;
  /** The chosen node's id: its path is kept and the rest dims. Controlled when given, with null for none. */
  selected?: string | null | undefined;
  /** The node chosen at first, where the ladder keeps the choice itself. */
  defaultSelected?: string | null | undefined;
  /**
   * Called with the node the reader chose, and with null when they let go of it: the chosen node
   * pressed again, Escape, or its details closed.
   */
  onSelect?: ((node: LadderNode | null) => void) | undefined;
  /**
   * Nodes an outside control points at (the flagged ones, a search's matches): the paths through
   * them are kept as a chosen node's is, and none is pressed.
   */
  highlighted?: readonly string[] | undefined;
  /** More about a chosen row, in a card anchored to it. Rows only: a card opens none. */
  details?: ((node: LadderNode) => ReactNode) | undefined;
  /** What a count of flagged nodes says, in a node's name, its tooltip and a heading: "3 approaches with nothing behind them". */
  flagLabel?: ((count: number) => string) | undefined;
  /**
   * `small` is 16px rows in the smallest type, for a ladder that must stand in one window;
   * `medium` is 20px rows. A coarse pointer gets 24px rows either way. @default "medium"
   */
  size?: "small" | "medium" | undefined;
  className?: string | undefined;
};

/** The part's own props, and the native props and ref of its box. */
export type LadderProps = LadderOwnProps &
  Omit<ComponentProps<"div">, keyof LadderOwnProps | "children" | "role">;

const NODE = "[data-ladder-id]";
const MARK = "[data-ladder-mark]";

/** How far apart the wires of one node leave it, and the room they keep from its corners, in pixels. */
const WIRE_PITCH = 3;
const WIRE_INSET = 4;
/** How many names a node's description lists a level before it says how many more. */
const NAMED = 8;

type Wire = { key: string; from: string; to: string };
type Group = { parent: string | null; rows: string[] };

/** What does not change while the values do: where every node stands and what it is linked to. */
type Structure = {
  signature: string;
  /** The ids of each level, in order. */
  ids: string[][];
  levelOf: Map<string, number>;
  /** What a node is linked to, by the level it is in. */
  linked: Map<string, Map<number, string[]>>;
  /** The links between neighbouring levels: from the earlier level to the later. */
  wires: Wire[];
  /** The level drawn as rows, or -1. */
  rows: number;
  /** Whether the rows stand beside the nodes of the level before. */
  parented: boolean;
  /** The rows by the node they stand beside; a last group with no node holds the rest. */
  groups: Group[];
  /** The nodes on each node's path towards the last level. */
  ahead: Map<string, string[]>;
  /** Each node's whole path, worked out when first asked for. */
  paths: Map<string, ReadonlySet<string>>;
};

function push<Key, Value>(map: Map<Key, Value[]>, key: Key, value: Value) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/** The ids and links as one string: the same while only the values change. */
const signatureOf = (levels: readonly LadderLevel[], links: readonly LadderLink[]) =>
  `${levels
    .map(
      (level) =>
        `${level.id}\u0001${level.layout ?? ""}\u0001${level.nodes.map((node) => node.id).join("\u0002")}`,
    )
    .join("\u0003")}\u0004${links.map((link) => `${link.from}\u0002${link.to}`).join("\u0003")}`;

/**
 * The nodes on a node's path one way, level by level: a node of the next level is on it when it is
 * linked to the path in every level between that it has links into, and in one at least.
 */
function walk(
  structure: Pick<Structure, "ids" | "linked">,
  start: string,
  origin: number,
  step: 1 | -1,
  found: (id: string) => void,
) {
  const members: (Set<string> | undefined)[] = [];
  members[origin] = new Set([start]);
  for (let at = origin + step; at >= 0 && at < structure.ids.length; at += step) {
    const here = new Set<string>();
    for (const id of structure.ids[at] ?? []) {
      const links = structure.linked.get(id);
      if (!links) continue;
      let joined = false;
      let agrees = true;
      for (let between = origin; between !== at; between += step) {
        const there = links.get(between);
        if (!there) continue;
        joined = true;
        const path = members[between];
        if (!path || !there.some((other) => path.has(other))) {
          agrees = false;
          break;
        }
      }
      if (joined && agrees) {
        here.add(id);
        found(id);
      }
    }
    members[at] = here;
  }
}

function structureOf(
  levels: readonly LadderLevel[],
  links: readonly LadderLink[],
  signature: string,
): Structure {
  const ids = levels.map((level) => level.nodes.map((node) => node.id));
  const levelOf = new Map<string, number>();
  ids.forEach((level, index) => level.forEach((id) => levelOf.set(id, index)));

  const last = levels.length - 1;
  const rows = last >= 0 && levels[last]?.layout === "rows" && ids[last]?.length ? last : -1;
  const parented = rows > 0 && (ids[rows - 1]?.length ?? 0) > 0;

  const linked = new Map<string, Map<number, string[]>>();
  const join = (from: string, to: string, level: number) => {
    let byLevel = linked.get(from);
    if (!byLevel) linked.set(from, (byLevel = new Map()));
    push(byLevel, level, to);
  };
  const wires: Wire[] = [];
  const known = new Set<string>();
  // A row stands beside the node of the level before that its first link names.
  const beside = new Map<string, string>();
  for (const link of links) {
    const a = levelOf.get(link.from);
    const b = levelOf.get(link.to);
    if (a === undefined || b === undefined || a === b) continue;
    const [from, to, low, high] = a < b ? [link.from, link.to, a, b] : [link.to, link.from, b, a];
    const key = `${from}\u0000${to}`;
    if (known.has(key)) continue;
    known.add(key);
    join(from, to, high);
    join(to, from, low);
    if (high - low === 1) wires.push({ key, from, to });
    if (high === rows && low === rows - 1 && !beside.has(to)) beside.set(to, from);
  }

  const groups: Group[] = [];
  if (rows >= 0) {
    const under = new Map<string, string[]>();
    const loose: string[] = [];
    for (const id of ids[rows] ?? []) {
      const parent = parented ? beside.get(id) : undefined;
      if (parent === undefined) loose.push(id);
      else push(under, parent, id);
    }
    if (parented)
      for (const parent of ids[rows - 1] ?? [])
        groups.push({ parent, rows: under.get(parent) ?? [] });
    if (loose.length) groups.push({ parent: null, rows: loose });
  }

  const ahead = new Map<string, string[]>();
  for (const [id, level] of levelOf) {
    const reached: string[] = [];
    walk({ ids, linked }, id, level, 1, (other) => reached.push(other));
    ahead.set(id, reached);
  }

  return {
    signature,
    ids,
    levelOf,
    linked,
    wires,
    rows,
    parented,
    groups,
    ahead,
    paths: new Map(),
  };
}

/** Every node on a node's path, towards both ends, the node itself among them. */
function pathOf(structure: Structure, id: string): ReadonlySet<string> {
  const known = structure.paths.get(id);
  if (known) return known;
  const on = new Set<string>();
  const level = structure.levelOf.get(id);
  if (level !== undefined) {
    on.add(id);
    for (const other of structure.ahead.get(id) ?? []) on.add(other);
    walk(structure, id, level, -1, (other) => on.add(other));
  }
  structure.paths.set(id, on);
  return on;
}

type Words = {
  /** A node's name to assistive technology: its title, its figure in words, its mark, its flags. */
  name: string;
  /** Its figure in words. */
  value: string | undefined;
  /** What it leads to that is flagged, in words. */
  flags: string | undefined;
};

type NodeProps = {
  node: LadderNode;
  /** How many flagged nodes it leads to. */
  flags: number;
  words: Words;
  /** Chosen: pressed. */
  pressed: boolean;
  /** On a kept path. */
  lit: boolean;
  /** The ladder's one Tab stop. */
  stop: boolean;
  describedBy: string | undefined;
  format: (value: number) => string;
};

function Figure({ node, format }: Pick<NodeProps, "node" | "format">) {
  if (node.value === undefined && node.total === undefined) return null;
  return (
    <span data-slot="ladder-figure" aria-hidden>
      {node.value === undefined ? null : (
        <span data-slot="ladder-figure-value">{format(node.value)}</span>
      )}
      {node.total === undefined ? null : `/${format(node.total)}`}
    </span>
  );
}

const state = ({ node, pressed, lit, stop, describedBy, words }: NodeProps) => ({
  type: "button" as const,
  "data-ladder-id": node.id,
  "aria-pressed": pressed,
  "aria-label": words.name,
  "aria-describedby": describedBy,
  tabIndex: stop ? 0 : -1,
  ...(lit ? { "data-lit": "" } : {}),
  ...(node.flagged ? { "data-flagged": "" } : {}),
});

/** A node as a card: its name, what it leads to that is flagged, its figure, and its tally. */
const LadderCard = memo(function LadderCard(props: NodeProps & { scale: number | undefined }) {
  const { node, flags, format, scale } = props;
  return (
    <button {...state(props)} data-slot="ladder-node">
      <span data-slot="ladder-node-line">
        <span data-slot="ladder-node-title">
          {node.marked ? <Dot shape="round" /> : null}
          {node.title}
        </span>
        {/* The numbers keep one line, and take the next under a name that leaves them no room. */}
        <span data-slot="ladder-node-numbers">
          {flags > 0 ? (
            <span data-slot="ladder-flag" aria-hidden>
              <span data-slot="ladder-flag-mark" />
              {format(flags)}
            </span>
          ) : null}
          <Figure node={node} format={format} />
        </span>
      </span>
      {node.segments ? (
        <Tally
          size="small"
          segments={node.segments}
          total={node.total}
          scale={scale}
          tone={node.flagged ? "danger" : "neutral"}
        />
      ) : null}
    </button>
  );
});

/** A node as a row: its name, its figure, and a mark for each item behind it. */
const LadderRow = memo(function LadderRow(
  props: NodeProps & {
    /** Whether rows open details, and whether this one's are open. */
    details: boolean;
    open: boolean;
  },
) {
  const { node, format, details, open } = props;
  return (
    <button
      {...state(props)}
      {...(details ? { "aria-haspopup": "dialog" as const, "aria-expanded": open } : {})}
      data-slot="ladder-row"
    >
      <span data-slot="ladder-node-title">
        {node.marked ? <Dot shape="round" /> : null}
        {node.title}
      </span>
      <Figure node={node} format={format} />
      {node.marks ? (
        <span
          data-slot="ladder-marks"
          aria-hidden
          style={{ "--ladder-count": node.marks.length } as CSSProperties}
        >
          {node.marks.map((mark, index) => (
            <span
              key={mark.key}
              data-slot="ladder-mark"
              data-ladder-mark={index}
              data-tone={mark.tone ?? "neutral"}
              data-fill={mark.fill ?? "solid"}
            />
          ))}
        </span>
      ) : node.segments ? (
        <Tally
          size="small"
          segments={node.segments}
          total={node.total}
          tone={node.flagged ? "danger" : "neutral"}
        />
      ) : null}
    </button>
  );
});

type Said = { title: string; lines: (string | undefined)[] };

/**
 * The ladder's one tooltip: it follows the pointer and keyboard focus from node to node and from
 * mark to mark, so four hundred marks cost one popup. It says a cut name whole, the figure in
 * words and the node's description; a mark says its item and its state.
 */
function Tip({
  root,
  say,
  quiet,
}: {
  root: RefObject<HTMLDivElement | null>;
  say: (target: HTMLElement) => Said | undefined;
  /** A card is open on the ladder: the tooltip stands down. */
  quiet: boolean;
}) {
  const [hot, setHot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const show = (event: Event) => {
      const target =
        event.target instanceof Element
          ? (event.target.closest<HTMLElement>(MARK) ?? event.target.closest<HTMLElement>(NODE))
          : null;
      setHot(target);
    };
    const hide = () => setHot(null);
    node.addEventListener("pointerover", show);
    node.addEventListener("pointerleave", hide);
    node.addEventListener("focusin", show);
    node.addEventListener("focusout", hide);
    return () => {
      node.removeEventListener("pointerover", show);
      node.removeEventListener("pointerleave", hide);
      node.removeEventListener("focusin", show);
      node.removeEventListener("focusout", hide);
    };
  }, [root]);
  const said = hot?.isConnected && !quiet ? say(hot) : undefined;
  return (
    <Tooltip
      open={!!said}
      onOpenChange={(open) => {
        if (!open) setHot(null);
      }}
    >
      {said && hot ? (
        <TooltipContent anchor={hot} data-slot="ladder-tooltip">
          <span className="flex flex-col">
            <span className="font-medium">{said.title}</span>
            {said.lines.map((line, index) => (line ? <span key={index}>{line}</span> : null))}
          </span>
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}

const NO_WIRES: readonly string[] = [];

/** The wires, drawn once for a structure and a width: a change of values redraws none of them. */
const Wires = memo(function Wires({
  wires,
  paths,
  lit,
  flagged,
}: {
  wires: readonly Wire[];
  paths: readonly string[];
  lit: ReadonlySet<string> | null;
  flagged: ReadonlySet<string>;
}) {
  return (
    <svg data-slot="ladder-wires" aria-hidden focusable="false">
      {paths.length === wires.length
        ? wires.map((wire, index) => (
            <path
              key={wire.key}
              data-slot="ladder-wire"
              d={paths[index]}
              {...(lit?.has(wire.key) ? { "data-lit": "" } : {})}
              {...(flagged.has(wire.to) ? { "data-flagged": "" } : {})}
            />
          ))
        : null}
    </svg>
  );
});

/**
 * Ordered levels of nodes with many-to-many links between them, read as one picture: how much of
 * a layered structure is held, and where the holes are. A node is a name, a figure and a tally;
 * the last level, the level of many, is one line a node with a mark for each item behind it.
 * Choosing a node keeps the paths through it and dims the rest, and the headings then count what
 * is kept. The values may change while the structure stays: the wires are measured again only
 * when a value moves a card. To assistive technology it is a list of levels, each a named list of
 * buttons that say what they are linked to; the wires are hidden. It is one Tab stop, and the
 * arrow keys move between nodes.
 * It stacks by what it holds: where it has less room than its levels need side by side, they
 * stand one under another, with no wires.
 */
export function Ladder({
  levels,
  links,
  label,
  selected: selectedProp,
  defaultSelected = null,
  onSelect,
  highlighted,
  details,
  flagLabel,
  size = "medium",
  className,
  onClick,
  onKeyDown,
  onFocus,
  onPointerDownCapture,
  ref,
  ...props
}: LadderProps) {
  const { t, locale, direction, formatNumber } = useLedgerLocale();
  const prefix = useId();
  const own = useRef<HTMLDivElement | null>(null);
  const list = useRef<HTMLOListElement | null>(null);
  const room = useRef<HTMLSpanElement | null>(null);

  // The structure is worked out again only when an id or a link changes, never for a value.
  const signature = signatureOf(levels, links);
  const [kept, setKept] = useState(() => structureOf(levels, links, signature));
  const structure = kept.signature === signature ? kept : structureOf(levels, links, signature);
  if (structure !== kept) setKept(structure);

  const nodes = useMemo(() => {
    const map = new Map<string, LadderNode>();
    for (const level of levels) for (const node of level.nodes) map.set(node.id, node);
    return map;
  }, [levels]);

  const [inner, setInner] = useState<string | null>(defaultSelected);
  const wanted = selectedProp === undefined ? inner : selectedProp;
  const chosen = wanted !== null && nodes.has(wanted) ? wanted : null;

  // The paths kept: through the chosen node and through every highlighted one.
  const sources = useMemo(
    () => [...new Set([chosen, ...(highlighted ?? [])])].filter((id) => id !== null),
    // The ids, not the array a caller builds on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chosen, highlighted?.join("\u0000")],
  );
  const path = useMemo(() => {
    const known = sources.filter((id) => structure.levelOf.has(id));
    if (!known.length) return null;
    const on = new Set<string>();
    const wires = new Set<string>();
    for (const source of known) {
      const reached = pathOf(structure, source);
      for (const id of reached) on.add(id);
      // A wire is lit when both its ends are on one path.
      for (const wire of structure.wires)
        if (reached.has(wire.from) && reached.has(wire.to)) wires.add(wire.key);
    }
    return { on, wires };
  }, [structure, sources]);

  const flagged = useMemo(() => {
    const set = new Set<string>();
    for (const node of nodes.values()) if (node.flagged) set.add(node.id);
    return set;
  }, [nodes]);

  const format = useCallback((value: number) => formatNumber(value), [formatNumber]);
  const sayFlags = useCallback(
    (count: number) => flagLabel?.(count) ?? t("ladderFlagged", { count: formatNumber(count) }),
    [flagLabel, t, formatNumber],
  );
  const flagsOf = useCallback(
    (id: string) => (structure.ahead.get(id) ?? []).filter((other) => flagged.has(other)).length,
    [structure, flagged],
  );
  const wordsOf = useCallback(
    (node: LadderNode): Words => {
      const value =
        node.valueLabel ??
        (node.value !== undefined && node.total !== undefined
          ? t("ladderValue", { value: formatNumber(node.value), total: formatNumber(node.total) })
          : node.value !== undefined
            ? formatNumber(node.value)
            : undefined);
      const count = flagsOf(node.id);
      const flags = count > 0 ? sayFlags(count) : undefined;
      return {
        name: [value ? `${node.title}: ${value}` : node.title, node.marked, flags]
          .filter(Boolean)
          .join(", "),
        value,
        flags,
      };
    },
    [t, formatNumber, flagsOf, sayFlags],
  );

  // What each node is linked to, level by level, as its description.
  const relations = useMemo(() => {
    const names = new Intl.ListFormat(locale, { type: "conjunction" });
    const said = new Map<string, string>();
    for (const [id, byLevel] of structure.linked) {
      const parts: string[] = [];
      for (const level of [...byLevel.keys()].sort((a, b) => a - b)) {
        const titles = (byLevel.get(level) ?? []).map((other) => nodes.get(other)?.title ?? other);
        const shown = titles.slice(0, NAMED);
        if (titles.length > NAMED)
          shown.push(t("listMore", { count: formatNumber(titles.length - NAMED) }));
        parts.push(
          t("ladderLinked", { level: levels[level]?.label ?? "", items: names.format(shown) }),
        );
      }
      said.set(id, parts.join(". "));
    }
    return said;
  }, [structure, nodes, levels, locale, t, formatNumber]);

  // The ladder's one Tab stop: the node last focused, else the chosen one, else the first.
  const [focused, setFocused] = useState<string | null>(null);
  const first = structure.ids.find((level) => level.length)?.[0] ?? null;
  const stop = focused !== null && nodes.has(focused) ? focused : (chosen ?? first);

  const elementOf = useCallback(
    (id: string) =>
      own.current?.querySelector<HTMLElement>(`[data-ladder-id="${CSS.escape(id)}"]`) ?? null,
    [],
  );

  // A press on the row whose card is open is the press that closes it: its click lets the row go
  // and never opens the card again. Noted as the press lands, before anything closes the card.
  const pressed = useRef<{ id: string; closed: boolean } | null>(null);
  const select = (node: LadderNode | null) => {
    if (selectedProp === undefined) setInner(node?.id ?? null);
    onSelect?.(node);
    if (!node) return;
    const reached = pathOf(structure, node.id);
    const counts = levels.map((level, index) =>
      t("ladderPathCount", {
        shown: formatNumber((structure.ids[index] ?? []).filter((id) => reached.has(id)).length),
        total: formatNumber(level.nodes.length),
        level: level.label,
      }),
    );
    announce(
      t("ladderPath", {
        node: node.title,
        counts: new Intl.ListFormat(locale, { type: "conjunction" }).format(counts),
      }),
    );
  };

  // The levels stand side by side while the ladder has the room they need to read: a card's level
  // its longest word, the rows a name, a figure and their marks. The stylesheet works that room
  // out from the tokens, for the levels this ladder holds, and it is read here. In less the levels
  // stack. Then the wires, measured where the nodes stand. The structure and the width decide
  // both; a value does not, so a change of values measures nothing unless it moves a card.
  const [stacked, setStacked] = useState(false);
  const [drawn, setDrawn] = useState(NO_WIRES);
  useLayoutEffect(() => {
    const root = own.current;
    const body = list.current;
    const needed = room.current;
    if (!root || !body || !needed) return;
    const draw = () => {
      // A ladder that is not on the page (a hidden tab panel, a page a phone's panel covers) has
      // no box and no room to read. It keeps the form it had, and is measured when it is shown.
      if (root.getClientRects().length === 0) return;
      const narrow = root.clientWidth < needed.offsetWidth;
      if (narrow !== stacked) {
        // The levels move first, and the wires are measured where they then stand.
        setStacked(narrow);
        return;
      }
      const paths: string[] = [];
      if (!stacked && structure.wires.length) {
        const frame = root.getBoundingClientRect();
        const boxes = new Map<string, DOMRect>();
        for (const element of root.querySelectorAll<HTMLElement>(NODE))
          boxes.set(element.dataset["ladderId"] ?? "", element.getBoundingClientRect());
        const middle = (box: DOMRect) => box.top + box.height / 2 - frame.top;
        // A node's wires leave it in the order of where they go, a few pixels apart.
        const ports = new Map<string, { wire: number; towards: number }[]>();
        structure.wires.forEach((wire, index) => {
          const from = boxes.get(wire.from);
          const to = boxes.get(wire.to);
          if (!from || !to) return;
          push(ports, `${wire.from}\u0000end`, { wire: index, towards: middle(to) });
          push(ports, `${wire.to}\u0000start`, { wire: index, towards: middle(from) });
        });
        const leaves = new Map<string, number>();
        for (const [key, attached] of ports) {
          const box = boxes.get(key.slice(0, key.indexOf("\u0000")));
          if (!box) continue;
          const at = middle(box);
          const span = Math.max(
            0,
            Math.min(box.height - 2 * WIRE_INSET, (attached.length - 1) * WIRE_PITCH),
          );
          attached
            .sort((a, b) => a.towards - b.towards)
            .forEach((port, index) =>
              leaves.set(
                `${key}\u0000${port.wire}`,
                attached.length > 1 ? at - span / 2 + (index * span) / (attached.length - 1) : at,
              ),
            );
        }
        const round = (value: number) => Math.round(value * 10) / 10;
        structure.wires.forEach((wire, index) => {
          const from = boxes.get(wire.from);
          const to = boxes.get(wire.to);
          const y1 = leaves.get(`${wire.from}\u0000end\u0000${index}`);
          const y2 = leaves.get(`${wire.to}\u0000start\u0000${index}`);
          if (!from || !to || y1 === undefined || y2 === undefined) {
            paths.push("");
            return;
          }
          // Out of the side that faces the next level, whichever way the page reads.
          const forward = from.left + from.width / 2 <= to.left + to.width / 2;
          const x1 = round((forward ? from.right : from.left) - frame.left);
          const x2 = round((forward ? to.left : to.right) - frame.left);
          const bend = round((x2 - x1) / 2);
          paths.push(
            `M${x1} ${round(y1)}C${x1 + bend} ${round(y1)} ${x2 - bend} ${round(y2)} ${x2} ${round(y2)}`,
          );
        });
      }
      setDrawn((current) =>
        current.length === paths.length && current.every((d, index) => d === paths[index])
          ? current
          : paths,
      );
    };
    draw();
    if (typeof ResizeObserver === "undefined") return;
    // A resize is answered in the next frame, never inside the observer's own delivery: the answer
    // can move what is observed (a ladder that stacks grows taller), which a browser reports as a
    // loop. The levels' own widths move the nodes when a name's column grows as a web font
    // arrives, the room needed changes with the type, and a card that gains or loses a line (a
    // figure grown by a digit) moves the cards of its level, though the level keeps its size.
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    });
    observer.observe(root);
    observer.observe(body);
    observer.observe(needed);
    for (const level of body.children) observer.observe(level);
    for (const card of root.querySelectorAll('[data-slot="ladder-node"]')) observer.observe(card);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [structure, size, stacked]);

  // The card of a chosen row, anchored to the row once it is on the page.
  const row =
    chosen !== null && details && structure.levelOf.get(chosen) === structure.rows
      ? nodes.get(chosen)
      : undefined;
  const more = row && details ? details(row) : null;
  const open = more !== null && more !== undefined && more !== false;
  const anchor = useRef<HTMLElement | null>(null);
  const [anchored, setAnchored] = useState<string | null>(null);
  useLayoutEffect(() => {
    anchor.current = open && chosen !== null ? elementOf(chosen) : null;
    setAnchored(anchor.current ? chosen : null);
  }, [open, chosen, elementOf, structure]);

  const nodeAt = (target: EventTarget | null) =>
    target instanceof Element
      ? (target.closest<HTMLElement>(NODE)?.dataset["ladderId"] ?? null)
      : null;

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const id = nodeAt(event.target);
    const level = id === null ? undefined : structure.levelOf.get(id);
    if (id === null || level === undefined) return;
    const here = structure.ids[level] ?? [];
    const index = here.indexOf(id);
    const across = (step: 1 | -1) => {
      const there = structure.ids[level + step];
      if (!there?.length) return undefined;
      // The first node there that this one is linked to, else the one that stands as far down.
      const to = structure.linked.get(id)?.get(level + step) ?? [];
      const near = there.find((other) => to.includes(other));
      return (
        near ??
        there[Math.round((index / Math.max(1, here.length - 1)) * Math.max(0, there.length - 1))]
      );
    };
    const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    const next =
      event.key === "ArrowDown"
        ? here[index + 1]
        : event.key === "ArrowUp"
          ? here[index - 1]
          : event.key === forward
            ? across(1)
            : event.key === back
              ? across(-1)
              : event.key === "Home"
                ? event.ctrlKey || event.metaKey
                  ? first
                  : here[0]
                : event.key === "End"
                  ? event.ctrlKey || event.metaKey
                    ? structure.ids.flat().at(-1)
                    : here.at(-1)
                  : undefined;
    if (next === undefined || next === null) return;
    event.preventDefault();
    elementOf(next)?.focus();
  };

  // What the tooltip says of the node or the mark under the pointer or the focus.
  const say = (target: HTMLElement): Said | undefined => {
    const node = nodes.get(target.closest<HTMLElement>(NODE)?.dataset["ladderId"] ?? "");
    if (!node) return undefined;
    const index = target.dataset["ladderMark"];
    const mark = index === undefined ? undefined : node.marks?.[Number(index)];
    if (mark) return { title: mark.label, lines: [mark.description] };
    const words = wordsOf(node);
    return { title: node.title, lines: [words.value, node.marked, words.flags, node.description] };
  };

  const scaleOf = (level: LadderLevel) => {
    const largest = Math.max(0, ...level.nodes.map((node) => node.total ?? 0));
    return (node: LadderNode) =>
      largest > 0 && node.total !== undefined ? node.total / largest : undefined;
  };
  const shared = (node: LadderNode) => {
    const lit = path !== null && path.on.has(node.id);
    const linkedTo = relations.get(node.id);
    const description = [lit ? t("ladderOnPath") : undefined, linkedTo].filter(Boolean).join(". ");
    return {
      node,
      flags: flagsOf(node.id),
      words: wordsOf(node),
      pressed: node.id === chosen,
      lit,
      stop: node.id === stop,
      format,
      description,
      describedBy: description ? `${prefix}-${node.id}` : undefined,
    };
  };
  const describe = (id: string | undefined, description: string) =>
    id ? (
      <span id={id} hidden>
        {description}
      </span>
    ) : null;

  /** A level's heading: its name, how many nodes it holds or keeps, and how many of them are flagged. */
  const heading = (level: LadderLevel, index: number, rowsHeading = false) => {
    const all = structure.ids[index] ?? [];
    const shown = path ? all.filter((id) => path.on.has(id)) : all;
    const flags = shown.filter((id) => flagged.has(id)).length;
    return (
      <div
        data-slot="ladder-level-header"
        id={`${prefix}-level-${index}`}
        {...(rowsHeading ? { "data-rows": "" } : {})}
      >
        <span data-slot="ladder-level-label">{level.label}</span>
        <span data-slot="ladder-level-count">
          {path
            ? t("ladderShown", {
                shown: formatNumber(shown.length),
                total: formatNumber(all.length),
              })
            : formatNumber(all.length)}
        </span>
        {flags > 0 ? (
          <span data-slot="ladder-flag" title={sayFlags(flags)}>
            <span data-slot="ladder-flag-mark" aria-hidden />
            <span aria-hidden>{formatNumber(flags)}</span>
            <span className="sr-only">{sayFlags(flags)}</span>
          </span>
        ) : null}
      </div>
    );
  };

  const tree = structure.rows >= 0;
  const rowsLevel = tree ? levels[structure.rows] : undefined;
  const parentLevel = tree && structure.parented ? levels[structure.rows - 1] : undefined;
  // The levels drawn as columns of cards: every one but the rows and the level they stand beside.
  const columns = levels
    .map((level, index) => ({ level, index }))
    .filter(
      ({ index }) =>
        !tree ||
        (index !== structure.rows && !(structure.parented && index === structure.rows - 1)),
    );
  const tracks = [
    ...columns.map(() => "var(--ladder-card-track)"),
    ...(tree
      ? [
          ...(parentLevel ? ["var(--ladder-card-track)"] : []),
          "var(--ladder-name-track)",
          "max-content",
          "var(--ladder-marks-track)",
        ]
      : []),
  ].join(" ");
  const parentScale = parentLevel ? scaleOf(parentLevel) : undefined;

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
      data-slot="ladder"
      data-size={size}
      data-layout={stacked ? "stack" : "columns"}
      {...(path ? { "data-active": "" } : {})}
      className={cn(className)}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        const id = nodeAt(event.target);
        const node = id === null ? undefined : nodes.get(id);
        if (!node) return;
        const again = pressed.current;
        pressed.current = null;
        if (again && again.id === node.id) {
          if (!again.closed) select(null);
          return;
        }
        select(node.id === chosen ? null : node);
      }}
      onPointerDownCapture={(event) => {
        onPointerDownCapture?.(event);
        const id = nodeAt(event.target);
        pressed.current = open && id !== null && id === chosen ? { id, closed: false } : null;
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        // A key is not that press: Enter on a row whose press was dragged away still chooses it.
        pressed.current = null;
        if (event.defaultPrevented) return;
        if (event.key === "Escape" && chosen !== null && nodeAt(event.target) !== null) {
          event.preventDefault();
          select(null);
        } else move(event);
      }}
      onFocus={(event: FocusEvent<HTMLDivElement>) => {
        onFocus?.(event);
        const id = nodeAt(event.target);
        if (id !== null) setFocused(id);
      }}
    >
      {structure.wires.length ? (
        <Wires
          wires={structure.wires}
          paths={drawn}
          lit={path ? path.wires : null}
          flagged={flagged}
        />
      ) : null}
      {/* Nothing drawn: the room this ladder's levels need side by side, for the part to read. */}
      <span data-slot="ladder-room" aria-hidden>
        <span
          ref={room}
          style={
            {
              "--ladder-cards": levels.length - (tree ? 1 : 0),
              "--ladder-rows": tree ? 1 : 0,
            } as CSSProperties
          }
        />
      </span>
      <ol
        ref={list}
        data-slot="ladder-levels"
        style={{ "--ladder-columns": tracks } as CSSProperties}
      >
        {columns.map(({ level, index }) => {
          const scale = scaleOf(level);
          return (
            <li key={level.id} data-slot="ladder-level">
              {heading(level, index)}
              {level.nodes.length ? (
                <ul data-slot="ladder-nodes" aria-labelledby={`${prefix}-level-${index}`}>
                  {level.nodes.map((node) => {
                    const { description, ...rest } = shared(node);
                    return (
                      <li key={node.id}>
                        <LadderCard {...rest} scale={scale(node)} />
                        {describe(rest.describedBy, description)}
                      </li>
                    );
                  })}
                </ul>
              ) : level.empty ? (
                <p data-slot="ladder-empty">{level.empty}</p>
              ) : null}
            </li>
          );
        })}
        {rowsLevel ? (
          <li data-slot="ladder-level" data-tree={parentLevel ? "parented" : "alone"}>
            {parentLevel ? heading(parentLevel, structure.rows - 1) : null}
            {heading(rowsLevel, structure.rows, true)}
            <ul
              data-slot="ladder-groups"
              aria-labelledby={`${prefix}-level-${parentLevel ? structure.rows - 1 : structure.rows}`}
            >
              {structure.groups.map((group) => {
                const parent = group.parent === null ? undefined : nodes.get(group.parent);
                const card = parent ? shared(parent) : undefined;
                return (
                  <li key={group.parent ?? "\u0000"} data-slot="ladder-group">
                    {parent && card ? (
                      <div data-slot="ladder-group-node">
                        <LadderCard
                          node={card.node}
                          flags={card.flags}
                          words={card.words}
                          pressed={card.pressed}
                          lit={card.lit}
                          stop={card.stop}
                          format={card.format}
                          describedBy={card.describedBy}
                          scale={parentScale?.(parent)}
                        />
                        {describe(card.describedBy, card.description)}
                      </div>
                    ) : null}
                    {group.rows.length ? (
                      <ul
                        data-slot="ladder-rows"
                        aria-label={
                          parent
                            ? t("ladderRows", { level: rowsLevel.label, node: parent.title })
                            : rowsLevel.label
                        }
                      >
                        {group.rows.map((id) => {
                          const node = nodes.get(id);
                          if (!node) return null;
                          const { description, ...rest } = shared(node);
                          return (
                            <li key={id}>
                              <LadderRow
                                {...rest}
                                details={!!details}
                                open={open && id === chosen}
                              />
                              {describe(rest.describedBy, description)}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </li>
        ) : null}
      </ol>
      <Tip root={own} say={say} quiet={open} />
      {open && row && anchored === chosen ? (
        <Card
          anchor={anchor}
          label={label}
          onClose={() => {
            if (pressed.current) pressed.current.closed = true;
            select(null);
          }}
          refocus={() => anchor.current?.focus()}
        >
          <CardHead title={row.title} subtitle={wordsOf(row).value} />
          {more}
        </Card>
      ) : null}
    </div>
  );
}
