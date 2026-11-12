import {
  memo,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { Tooltip, TooltipContent } from "../components/tooltip";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

/** A mark's colour: a chart tone, or a step of the one-hue scale for how far along. */
export type TileMapTone =
  | "neutral"
  | "brand"
  | "information"
  | "success"
  | "warning"
  | "danger"
  | "sequential.1"
  | "sequential.2"
  | "sequential.3"
  | "sequential.4"
  | "sequential.5";

/** How a mark carries its tone: filled, hollow, or `empty` for an item with nothing to say. */
export type TileMapFill = "solid" | "outline" | "empty";

/** One item of the set. */
export type TileMapMark = {
  /** Unique in the map: what `selected` names and `onSelect` hands back. */
  id: string;
  /** Its name: the tooltip's first line, and what assistive technology hears. */
  label: string;
  /** Its state in words, after the name: the tooltip's second line. Colour never says it alone. */
  description?: string | undefined;
  /** @default "neutral" */
  tone?: TileMapTone | undefined;
  /** @default "solid" */
  fill?: TileMapFill | undefined;
  /** Drawn faint: outside what the reader asked about. */
  dimmed?: boolean | undefined;
  /** The items that belong to it. Grid draws them as slim bars after it; Skyline stacks them above it. */
  parts?: readonly TileMapMark[] | undefined;
};

/** A named run of marks: a row in Grid, a district in Skyline. */
export type TileMapGroup = {
  id: string;
  /** Its short name, a code: "AC". */
  label: string;
  /** Its full name, cut with an ellipsis where it does not fit. */
  title?: string | undefined;
  /** What the group comes to, at its end: a count. */
  value?: ReactNode | undefined;
  marks: readonly TileMapMark[];
};

export type TileMapLayout = "grid" | "skyline" | "strip";

type TileMapOwnProps = {
  /** The groups in order, each with its marks in order. */
  groups: readonly TileMapGroup[];
  /** `grid` is a row a group; `skyline` is one street, each group a district; `strip` is every mark in one wrapped run with no words drawn, the whole set at a glance inside a card. @default "grid" */
  layout?: TileMapLayout | undefined;
  /** The map's accessible name: what the marks are and what their colour says. */
  label: string;
  /** The chosen mark's id. */
  selected?: string | null | undefined;
  /**
   * Makes the marks buttons: called when one is clicked or chosen with Enter or Space. The map is
   * then one Tab stop, and the arrow keys move between marks. Without it the map is one image
   * named by `label`, so give the same facts as a table beside it.
   */
  onSelect?: ((mark: TileMapMark, group: TileMapGroup) => void) | undefined;
  /** In Skyline, how many parts stack above an item before a second column starts. @default 6 */
  partRows?: number | undefined;
  className?: string | undefined;
};

/** The part's own props, and the native props and ref of its box. */
export type TileMapProps = TileMapOwnProps &
  Omit<ComponentProps<"div">, keyof TileMapOwnProps | "children" | "role">;

const MARK = '[data-slot="tile-map-mark"]';
const GROUP = '[data-slot="tile-map-group"]';

const markName = (mark: TileMapMark) =>
  mark.description ? `${mark.label}, ${mark.description}` : mark.label;

function Mark({
  mark,
  part,
  interactive,
  selected,
  stop,
}: {
  mark: TileMapMark;
  part?: boolean | undefined;
  interactive: boolean;
  selected: string | null;
  stop: string | null;
}) {
  const shared = {
    "data-slot": "tile-map-mark",
    "data-id": mark.id,
    "data-tone": mark.tone ?? "neutral",
    "data-fill": mark.fill ?? "solid",
    ...(part ? { "data-part": "" } : {}),
    ...(mark.dimmed ? { "data-dimmed": "" } : {}),
  };
  return interactive ? (
    <button
      type="button"
      aria-label={markName(mark)}
      {...(mark.id === selected ? { "aria-current": "true" as const } : {})}
      tabIndex={mark.id === stop ? 0 : -1}
      {...shared}
    />
  ) : (
    <span aria-hidden {...shared} />
  );
}

const Group = memo(function Group({
  group,
  prefix,
  interactive,
  selected,
  stop,
  partRows,
}: {
  group: TileMapGroup;
  prefix: string;
  interactive: boolean;
  /** The chosen mark and the Tab stop, when they are in this group. */
  selected: string | null;
  stop: string | null;
  partRows: number;
}) {
  const heading = `${prefix}-${group.id}`;
  return (
    <div
      data-slot="tile-map-group"
      {...(interactive ? { role: "group", "aria-labelledby": heading } : {})}
    >
      <div data-slot="tile-map-group-header" id={heading}>
        <span data-slot="tile-map-group-label">{group.label}</span>
        <span data-slot="tile-map-group-title">{group.title}</span>
        <span data-slot="tile-map-group-value">{group.value}</span>
      </div>
      <div data-slot="tile-map-marks">
        {group.marks.map((mark) => (
          <div data-slot="tile-map-stack" key={mark.id}>
            <Mark mark={mark} interactive={interactive} selected={selected} stop={stop} />
            {mark.parts?.length ? (
              <div
                data-slot="tile-map-parts"
                style={
                  { "--tile-map-rows": Math.min(mark.parts.length, partRows) } as CSSProperties
                }
              >
                {mark.parts.map((item) => (
                  <Mark
                    key={item.id}
                    mark={item}
                    part
                    interactive={interactive}
                    selected={selected}
                    stop={stop}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * The map's one tooltip: it follows the pointer and keyboard focus from mark to mark, so a
 * thousand marks cost one popup. The words are the mark's name and state, which a button mark
 * already says to assistive technology.
 */
function Tip({
  root,
  marks,
}: {
  root: RefObject<HTMLDivElement | null>;
  marks: ReadonlyMap<string, { mark: TileMapMark; group: TileMapGroup }>;
}) {
  const [hot, setHot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const show = (event: Event) => {
      const target =
        event.target instanceof Element ? event.target.closest<HTMLElement>(MARK) : null;
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
  const mark = hot?.isConnected ? marks.get(hot.dataset["id"] ?? "")?.mark : undefined;
  return (
    <Tooltip
      open={!!mark}
      onOpenChange={(open) => {
        if (!open) setHot(null);
      }}
    >
      {mark && hot ? (
        <TooltipContent anchor={hot} data-slot="tile-map-tooltip">
          <span className="flex flex-col">
            <span className="font-medium">{mark.label}</span>
            {mark.description ? <span>{mark.description}</span> : null}
          </span>
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}

/**
 * Every item of a set as one small mark, grouped: a catalog's controls by family, a fleet's
 * hosts by site. It answers what a table cannot at a glance: how much of the whole is in, where
 * the changes fall, which groups are untouched. Colour says a mark's state, never alone: each
 * mark names itself and its state in a tooltip and to assistive technology, and a `TileMap.Key`
 * beside the map says what each colour means.
 */
function TileMapRoot({
  groups,
  layout = "grid",
  label,
  selected = null,
  onSelect,
  partRows = 6,
  className,
  onClick,
  onKeyDown,
  onFocus,
  ref,
  ...props
}: TileMapProps) {
  const { direction } = useLedgerLocale();
  const own = useRef<HTMLDivElement | null>(null);
  const prefix = useId();
  const interactive = !!onSelect;
  const marks = useMemo(() => {
    const map = new Map<string, { mark: TileMapMark; group: TileMapGroup }>();
    for (const group of groups)
      for (const mark of group.marks) {
        map.set(mark.id, { mark, group });
        for (const part of mark.parts ?? []) map.set(part.id, { mark: part, group });
      }
    return map;
  }, [groups]);
  // The map's one Tab stop: the mark last focused, else the chosen one, else the first.
  const [focused, setFocused] = useState<string | null>(null);
  const first = groups.find((group) => group.marks.length)?.marks[0]?.id ?? null;
  const stop =
    focused && marks.has(focused) ? focused : selected && marks.has(selected) ? selected : first;
  const groupOf = (id: string | null) => (id ? (marks.get(id)?.group.id ?? null) : null);
  const stopGroup = groupOf(stop);
  const selectedGroup = groupOf(selected);

  const markAt = (target: EventTarget) =>
    target instanceof Element ? target.closest<HTMLElement>(MARK) : null;

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = markAt(event.target);
    const node = own.current;
    if (!current || !node) return;
    const all = [...node.querySelectorAll<HTMLElement>(MARK)];
    const index = all.indexOf(current);
    const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    const ofGroup = (step: 1 | -1) => {
      const list = [...node.querySelectorAll<HTMLElement>(GROUP)];
      const at = list.indexOf(current.closest<HTMLElement>(GROUP)!);
      for (let i = at + step; i >= 0 && i < list.length; i += step) {
        const mark = list[i]?.querySelector<HTMLElement>(MARK);
        if (mark) return mark;
      }
      return undefined;
    };
    const next =
      event.key === forward
        ? all[index + 1]
        : event.key === back
          ? all[index - 1]
          : event.key === "ArrowDown"
            ? ofGroup(1)
            : event.key === "ArrowUp"
              ? ofGroup(-1)
              : event.key === "Home"
                ? all[0]
                : event.key === "End"
                  ? all.at(-1)
                  : undefined;
    if (!next) return;
    event.preventDefault();
    next.focus();
  };

  return (
    <div
      {...props}
      ref={(node) => {
        own.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-slot="tile-map"
      data-layout={layout}
      role={interactive ? "group" : "img"}
      aria-label={label}
      className={cn(className)}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        const id = markAt(event.target)?.dataset["id"];
        const found = id ? marks.get(id) : undefined;
        if (found && onSelect) onSelect(found.mark, found.group);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (interactive && !event.defaultPrevented) move(event);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        const id = markAt(event.target)?.dataset["id"];
        if (id) setFocused(id);
      }}
    >
      <div data-slot="tile-map-groups">
        {groups.map((group) => (
          <Group
            key={group.id}
            group={group}
            prefix={prefix}
            interactive={interactive}
            selected={selectedGroup === group.id ? selected : null}
            stop={stopGroup === group.id ? stop : null}
            partRows={partRows}
          />
        ))}
      </div>
      <Tip root={own} marks={marks} />
    </div>
  );
}

/** One line of a key: what a colour means, and how many marks wear it. */
export type TileMapKeyItem = {
  label: ReactNode;
  tone?: TileMapTone | undefined;
  fill?: TileMapFill | undefined;
  /** How many marks wear it. */
  value?: ReactNode | undefined;
};

export type TileMapKeyProps = Omit<ComponentProps<"ul">, "children"> & {
  /** The colours in the order the reader meets them. */
  items: readonly TileMapKeyItem[];
};

/** What each colour of a TileMap means: a swatch drawn as the mark is, its meaning and its count. */
export function TileMapKey({ items, className, ...props }: TileMapKeyProps) {
  return (
    <ul {...props} data-slot="tile-map-key" className={cn(className)}>
      {items.map((item, index) => (
        <li data-slot="tile-map-key-item" key={index}>
          <span
            aria-hidden
            data-slot="tile-map-mark"
            data-tone={item.tone ?? "neutral"}
            data-fill={item.fill ?? "solid"}
          />
          <span>{item.label}</span>
          {item.value === undefined ? null : (
            <span data-slot="tile-map-key-value">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export const TileMap = Object.assign(TileMapRoot, { Key: TileMapKey });
