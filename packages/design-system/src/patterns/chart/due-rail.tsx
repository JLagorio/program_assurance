import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";

import { Skeleton } from "../../components/skeleton";
import { tokenValue } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import { parseIsoDay } from "../../lib/locale-format";
import {
  DAY,
  timeTicks,
  useFrame,
  useFrameReport,
  type FrameReport,
  type TwinSource,
} from "./_shared";

/* The due rail: dated items as dots on one time axis, today ruled across. A dot stands on its
   day; dots that would touch stand on one another, so the rail is as tall as its busiest week.
   Late and soon are told by shape as well as colour: a late dot is hatched in the danger tone, as a
   Meter's late mark is, and a dot due today or soon is ringed in the warning tone. The rail is
   never the only way to a date: every dot is a row of the table it stands above, and the Frame's
   table twin lists them all. The paint is in src/styles/chart.css. */

/** One dated item on the rail. */
export type ChartDueItem = {
  /** The item's key, the same as its row's in the table under the rail. */
  id: string;
  /** What the item is, as its row names it: "Withdraw the password-only local logon". */
  label: string;
  /** The day it is due, an ISO day: "2026-12-13". */
  due: string;
};

export type ChartDueRailProps = Omit<ComponentProps<"div">, "children"> & {
  /** The dated items, in any order: the rail draws them by day, and lists them in that order to a screen reader. */
  items: ChartDueItem[];
  /** The moment today is judged from, in the provider's zone; by default the clock at render. */
  now?: Date | number | undefined;
  /** The rail's name outside a Frame: "POA&M items by due date". Inside one, the Frame's title. */
  label?: string | undefined;
  /** Draws the rail's skeleton in place of the dots. The Frame sets it from `state="loading"`. */
  loading?: boolean | undefined;
};

/** Where a due day stands against today, as DateLabel says it. */
type DueState = "overdue" | "today" | "soon" | "upcoming";

/** How many days ahead read as soon, as DateLabel's default. */
const SOON_WITHIN = 2;

type Dated = ChartDueItem & { day: number; state: DueState; days: number };

/** A dot's place: its column's centre from the rail's start, and how many dots stand under it. */
type Placed = Dated & { x: number; stack: number };

/** The rail's pitch (a dot and the gap after it) and a dot, in px, from the tokens. */
const metric = (name: "space.150" | "space.100" | "space.250") =>
  Number.parseFloat(tokenValue(name)) || 0;

/** A width to lay the dots out at before the rail has been measured. */
const UNMEASURED = 480;

/**
 * The columns the dots stand in at a width: each day's place on the axis, rounded to a column one
 * pitch wide, and kept on its side of today, so a late dot never stands past the rule and a dot
 * not yet late never stands before it.
 */
function placeDots(dated: Dated[], min: number, max: number, today: number, width: number) {
  const pitch = metric("space.150") || 12;
  const dot = metric("space.100") || 8;
  const usable = Math.max(width - pitch, pitch);
  const columns = Math.max(2, Math.floor(usable / pitch) + 1);
  const step = usable / (columns - 1);
  const at = (ms: number) => pitch / 2 + ((ms - min) / Math.max(max - min, 1)) * usable;
  const todayX = at(today);
  const centre = (column: number) => pitch / 2 + column * step;
  // The last column wholly before the rule, and the first wholly after it.
  const before = Math.max(0, Math.floor((todayX - dot / 2 - 1 - pitch / 2) / step));
  const after = Math.min(columns - 1, Math.ceil((todayX + dot / 2 + 1 - pitch / 2) / step));
  const stacks = new Map<number, number>();
  const placed: Placed[] = dated.map((item) => {
    let column = Math.round((at(item.day) - pitch / 2) / step);
    column = item.state === "overdue" ? Math.min(column, before) : Math.max(column, after);
    column = Math.min(Math.max(column, 0), columns - 1);
    const stack = stacks.get(column) ?? 0;
    stacks.set(column, stack + 1);
    return { ...item, x: centre(column), stack };
  });
  return { placed, todayX, tallest: Math.max(1, ...stacks.values()), pitch, at };
}

/**
 * Dated items as dots on one time axis, above the table that lists them, with today ruled across:
 * the POA&M items by the day each is due, the evidence by the day it expires. A dot due before
 * today is hatched in the danger tone; one due today or within two days is ringed in the warning
 * tone; the rest are neutral. Each dot is named by its item, its day and, when it is late or soon,
 * the words DateLabel uses, and the dots are a list in date order. They do not open anything: the
 * row of the table under the rail opens the record, and the Frame's Table toggle lists them too.
 * Native `div` props and the ref reach the rail's box.
 */
export function ChartDueRail({
  items,
  now,
  label,
  loading: loadingProp,
  className,
  style,
  ref: callerRef,
  ...native
}: ChartDueRailProps) {
  const { t, locale, formatDay, zonedParts } = useLedgerLocale();
  const { name, titleId, loading, offstage } = useFrame(label, undefined, undefined, loadingProp);
  const box = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [offstage, loading]);

  const moment = now === undefined ? Date.now() : +now;
  const todayParts = zonedParts(moment);
  const today = Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day);

  // Each item's day and where it stands against today, in date order; an item with no ISO day is
  // left off the rail.
  const dated = useMemo(() => {
    const out: Dated[] = [];
    for (const item of items) {
      const parsed = parseIsoDay(item.due);
      if (!parsed) continue;
      const day = Date.UTC(parsed.year, parsed.month - 1, parsed.day);
      const days = Math.round((day - today) / DAY);
      const state: DueState =
        days < 0 ? "overdue" : days === 0 ? "today" : days <= SOON_WITHIN ? "soon" : "upcoming";
      out.push({ ...item, day, days, state });
    }
    return out.sort((a, b) => a.day - b.day || a.label.localeCompare(b.label, locale));
  }, [items, today, locale]);

  /** The day in full, the words DateLabel uses for it, and the dot's name. */
  const words = useMemo(() => {
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return (item: Dated) => {
      const parsed = parseIsoDay(item.due);
      const day = parsed ? formatDay(parsed, { dateStyle: "medium" }) : item.due;
      const state =
        item.state === "overdue"
          ? t("dateOverdue")
          : item.state === "today"
            ? t("dateDueToday")
            : item.state === "soon"
              ? t("dateDueSoon", { relative: relative.format(item.days, "day") })
              : "";
      return {
        day,
        state,
        name: state
          ? t("chartDueDotState", { label: item.label, day, state })
          : t("chartDueDot", { label: item.label, day }),
      };
    };
  }, [locale, formatDay, t]);

  // The table twin: an item a row, with its day and, when it is late or soon, the words.
  const table = useMemo<TwinSource>(
    () => ({
      kind: "custom",
      build: ({ xLabel }) => ({
        columns: [
          { label: xLabel ?? t("chartDueItem"), numeric: false },
          { label: t("chartDue"), numeric: false },
        ],
        rows: dated.map((item) => {
          const said = words(item);
          return {
            key: item.id,
            cells: [
              { text: item.label, csv: item.label },
              { text: said.state ? `${said.day} · ${said.state}` : said.day, csv: item.due },
            ],
          };
        }),
      }),
    }),
    [dated, words, t],
  );
  const report = useMemo<FrameReport>(() => ({ table }), [table]);
  useFrameReport(report);

  const span = useMemo(() => {
    const days = [today, ...dated.map((item) => item.day)];
    const first = Math.min(...days);
    const last = Math.max(...days);
    // Room at either end, so the first and last dots stand clear of the rail's edges.
    const pad = Math.max(DAY, (last - first) * 0.04);
    return { min: first - pad, max: last + pad };
  }, [dated, today]);
  const ticks = useMemo(() => timeTicks(span.min, span.max, locale, "UTC", true), [span, locale]);

  if (offstage) return null;

  const setBox = (node: HTMLDivElement | null) => {
    box.current = node;
    if (typeof callerRef === "function") callerRef(node);
    else if (callerRef) callerRef.current = node;
  };

  if (loading)
    return (
      <div
        {...native}
        ref={setBox}
        data-slot="chart-due-rail"
        aria-busy
        aria-label={name ? t("loadingLabel", { label: name }) : undefined}
        role={name ? "group" : undefined}
        className={cn("min-w-0", className)}
        style={style}
      >
        <Skeleton shape="block" height={metric("space.250") * 4 || 80} />
      </div>
    );

  const measured = width || UNMEASURED;
  const { placed, todayX, tallest, pitch, at } = placeDots(
    dated,
    span.min,
    span.max,
    today,
    measured,
  );
  const band = metric("space.250") || 20;
  // From the top: today's words, the dots standing on the axis, then the ticks and their labels.
  const axisY = band + tallest * pitch + pitch / 2;
  const height = axisY + band;
  // Tick labels at least five pitches apart, and none so near the end that it would run past it.
  const shownTicks: number[] = [];
  for (const tick of ticks.ticks) {
    const x = at(tick);
    const last = shownTicks[shownTicks.length - 1];
    if (x > measured - pitch * 5) continue;
    if (last !== undefined && x - at(last) < pitch * 5) continue;
    shownTicks.push(tick);
  }
  // Today's words sit after the rule, or before it near the rail's end.
  const todayEnd = todayX > measured - pitch * 6;
  const px = (n: number) => `${Math.round(n * 100) / 100}px`;
  const listName = label ?? (titleId ? undefined : name);
  return (
    <div
      {...native}
      ref={setBox}
      data-slot="chart-due-rail"
      className={cn("relative min-w-0", className)}
      style={{ blockSize: px(height), ...style }}
    >
      <span aria-hidden data-slot="chart-due-axis" style={{ insetBlockStart: px(axisY) }} />
      {shownTicks.map((tick) => (
        <span
          key={tick}
          aria-hidden
          data-slot="chart-due-tick"
          className="absolute overflow-hidden font-body-xsmall whitespace-nowrap text-subtlest tabular-nums"
          style={{
            insetInlineStart: px(at(tick)),
            insetBlockStart: px(axisY),
            maxInlineSize: px(measured - at(tick)),
          }}
        >
          {ticks.tick(tick)}
        </span>
      ))}
      <span
        aria-hidden
        data-slot="chart-due-today"
        className="absolute"
        style={{
          insetInlineStart: px(todayX),
          insetBlockStart: 0,
          blockSize: px(axisY + pitch / 2),
        }}
      />
      <span
        aria-hidden
        className="absolute font-body-xsmall font-medium whitespace-nowrap text-default"
        style={
          todayEnd
            ? { insetInlineEnd: px(measured - todayX + pitch / 2), insetBlockStart: 0 }
            : { insetInlineStart: px(todayX + pitch / 2), insetBlockStart: 0 }
        }
      >
        {t("today")}
      </span>
      <ol
        role="list"
        aria-label={listName}
        aria-labelledby={listName ? undefined : titleId}
        data-slot="chart-due-dots"
        className="absolute inset-0"
      >
        {placed.map((item) => {
          const said = words(item);
          return (
            <li
              key={item.id}
              className="absolute flex items-center justify-center"
              style={
                {
                  insetInlineStart: px(item.x - pitch / 2),
                  insetBlockStart: px(axisY - pitch * (item.stack + 1)),
                  inlineSize: px(pitch),
                  blockSize: px(pitch),
                } as CSSProperties
              }
            >
              <span
                role="img"
                aria-label={said.name}
                title={said.name}
                data-slot="chart-due-dot"
                data-state={item.state}
                data-id={item.id}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
