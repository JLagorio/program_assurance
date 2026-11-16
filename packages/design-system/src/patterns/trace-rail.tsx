import type { ComponentProps, ReactNode } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { VisuallyHidden } from "../primitives/visually-hidden";

/* Trace.Rail: a chain as one line of fixed stations, the record's own station marked. The line's
   legs are derived from the stations at their two ends; the paint is trace.css's. */

/**
 * What stands at a station: `held` records (a dot with their count), `draft` records only (a dashed
 * ring), a `gap` the record owes and does not have (a hollow ring in the warning colour, the line
 * broken on both sides), or `none`, nothing recorded and nothing owed (a small mark).
 */
export type TraceRailState = "held" | "draft" | "gap" | "none";

/** The tone of the worst record at a station: the dot's fill, and the ring of the record's own. */
export type TraceRailTone = "neutral" | "success" | "warning" | "danger";

/**
 * `medium` is a record page's: the stations' names over the line and what stands at each under it.
 * `small` sits in a record's body: the names under the dots and no words. `xsmall` fits a table
 * row: the dots alone.
 */
export type TraceRailSize = "medium" | "small" | "xsmall";

/** One station of the chain. */
export type TraceRailStop = {
  /** Unique among the stations: what `focus` names. */
  id: string;
  /** The station's name, as its records are called: "Controls", "Evidence". */
  label: string;
  /** What stands there. A station is never left out: one with nothing in it is `none` or a `gap`. */
  state: TraceRailState;
  /** How many records stand there: drawn in the dot of a `held` station, at `medium` and `small`. */
  count?: number | undefined;
  /** The tone of the worst record there: the dot's fill. Colour never says it alone: say it in `value`, and in `description` where the value is not drawn. @default "neutral" */
  tone?: TraceRailTone | undefined;
  /**
   * What stands there, at `medium`, under the dot, worst first: the records' links ("AC-11",
   * "AU-4"), a judgement ("Other than satisfied"), counts by severity ("1 critical"), a Meter. For
   * a `gap`, what is missing ("No evidence"), which may be the link or the link-styled Button that
   * opens its fix; a gap given none says "Missing".
   */
  value?: ReactNode | undefined;
  /** One short fact under `value`, at `medium`: "published Aug 28", "39d late". */
  meta?: ReactNode | undefined;
  /**
   * What the station says where its value is not drawn (`small`, `xsmall`), read after its name:
   * "No evidence", "2, other than satisfied". Without it a string `value` is read, else the state's
   * own words (Missing, Drafts only, Nothing recorded).
   */
  description?: string | undefined;
};

type TraceRailOwnProps = {
  /** The stations in the chain's order, every one of them, every time. */
  stops: readonly TraceRailStop[];
  /** The station of the record the rail is about: drawn as a ring, and the current item. */
  focus?: string | undefined;
  /** The rail's accessible name: what chain, around which record ("The chain around this risk"). */
  label: string;
  /** @default "medium" */
  size?: TraceRailSize | undefined;
  className?: string | undefined;
};

/** The part's own props, and the native props and ref of its box. */
export type TraceRailProps = TraceRailOwnProps &
  Omit<ComponentProps<"div">, keyof TraceRailOwnProps | "children">;

/** How a leg of the line stands: the link holds, waits on a draft, is broken by a gap, or meets nothing. */
type LegState = "holds" | "waiting" | "broken" | "none";

/**
 * Each leg, from a station to the next, as the link between the nearest stations either side that
 * hold anything: a link runs through a station with nothing recorded. A gap at either end breaks
 * it, a draft makes it wait, and with nothing at one end there is no link.
 */
function legsOf(stops: readonly TraceRailStop[], focus: string | undefined): LegState[] {
  const state = (stop: TraceRailStop): TraceRailState => (stop.id === focus ? "held" : stop.state);
  const legs: LegState[] = [];
  for (let at = 0; at + 1 < stops.length; at += 1) {
    let from = at;
    while (from >= 0 && state(stops[from]!) === "none") from -= 1;
    let to = at + 1;
    while (to < stops.length && state(stops[to]!) === "none") to += 1;
    if (from < 0 || to >= stops.length) {
      legs.push("none");
      continue;
    }
    const ends = [state(stops[from]!), state(stops[to]!)];
    legs.push(ends.includes("gap") ? "broken" : ends.includes("draft") ? "waiting" : "holds");
  }
  return legs;
}

/**
 * A chain around one record as a line of fixed stations, in the chain's order: what stands at
 * each, the record's own station ringed, and the legs between them solid where the link holds,
 * dashed where it waits on a draft and broken in the warning colour on either side of a gap,
 * which says what is missing in words. Every station is drawn every time, so a station's place is
 * its meaning and a gap lines up down a column of rails. It is the compact form of Trace: Trace
 * draws each record and the links between them; the rail says what stands at each station. To
 * assistive technology it is a list named by `label`, each station read by its name, its count
 * and its words, the record's own the current item. At `medium` in less than 36rem it runs down
 * the page.
 */
export function TraceRail({
  stops,
  focus,
  label,
  size = "medium",
  className,
  ...props
}: TraceRailProps) {
  const { t, formatNumber } = useLedgerLocale();
  const legs = legsOf(stops, focus);
  const words = size === "medium";
  const defaults: Record<TraceRailState, string | undefined> = {
    held: undefined,
    draft: t("traceRailDraft"),
    gap: t("traceRailGap"),
    none: t("traceRailNone"),
  };

  return (
    <div {...props} data-slot="trace-rail" data-size={size} className={cn(className)}>
      <ol data-slot="trace-rail-stops" aria-label={label}>
        {stops.map((stop, index) => {
          const current = stop.id === focus;
          const state = current ? "held" : stop.state;
          const counted = state === "held" && !current && stop.count !== undefined;
          const count = counted ? Math.max(0, Math.floor(stop.count!)) : undefined;
          // A gap always says so in words: its value, else "Missing".
          const value = words ? (stop.value ?? (state === "gap" ? defaults.gap : undefined)) : null;
          // What is read where the value is not drawn.
          const said =
            value === null || value === undefined
              ? (stop.description ??
                (typeof stop.value === "string" ? stop.value : undefined) ??
                defaults[state])
              : undefined;
          const spoken = [count === undefined ? undefined : formatNumber(count), said].filter(
            Boolean,
          );
          return (
            <li
              key={stop.id}
              data-slot="trace-rail-stop"
              data-state={current ? "current" : state}
              data-tone={stop.tone ?? "neutral"}
              {...(current ? { "aria-current": "true" as const } : {})}
            >
              {size === "xsmall" ? (
                <VisuallyHidden>{stop.label}</VisuallyHidden>
              ) : (
                <span data-slot="trace-rail-label">{stop.label}</span>
              )}
              <span data-slot="trace-rail-track" aria-hidden>
                <span data-slot="trace-rail-leg" data-side="in" data-state={legs[index - 1]} />
                <span data-slot="trace-rail-dot">
                  {count !== undefined && size !== "xsmall"
                    ? count > 99
                      ? `${formatNumber(99)}+`
                      : formatNumber(count)
                    : null}
                </span>
                <span data-slot="trace-rail-leg" data-side="out" data-state={legs[index]} />
              </span>
              {spoken.length ? <VisuallyHidden>{`, ${spoken.join(", ")}`}</VisuallyHidden> : null}
              {value !== null && value !== undefined ? (
                <span data-slot="trace-rail-value">{value}</span>
              ) : null}
              {words && stop.meta ? <span data-slot="trace-rail-meta">{stop.meta}</span> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
