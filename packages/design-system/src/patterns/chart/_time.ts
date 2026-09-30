/*
 * The time axis: an instant in epoch milliseconds, the ticks of a span, and their labels. The
 * ticks fall on the starts of hours, days, months and years in the zone the labels are read in, so
 * a tick labelled "Feb" is the first of February there, west of UTC as well as east of it. Pure,
 * with no runtime imports, so `node --test` covers it.
 */

export const DAY = 86_400_000;

export const toMs = (v: unknown): number =>
  v instanceof Date ? v.getTime() : typeof v === "number" ? v : new Date(String(v)).getTime();

/** A date with no time ("2026-09-04"): a calendar day, not an instant, so it reads the same in every zone. */
export const isDateOnly = (v: unknown): boolean =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

type Wall = { year: number; month: number; day: number; hour: number; minute: number };

const wallFormats = new Map<string, Intl.DateTimeFormat>();

/** The wall-clock reading of an instant in a zone; `month` from 0. */
export function wallTime(ms: number, timeZone: string): Wall {
  let format = wallFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
    wallFormats.set(timeZone, format);
  }
  const parts = format.formatToParts(ms);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: part("year"),
    month: part("month") - 1,
    day: part("day"),
    hour: part("hour") % 24,
    minute: part("minute"),
  };
}

/**
 * The instant a wall-clock reading names in a zone. Fields past their range roll over as
 * `Date.UTC` rolls them (month 12 is January of the next year), so a tick steps in wall time.
 */
export function zonedTime(
  year: number,
  month: number,
  day = 1,
  hour = 0,
  timeZone = "UTC",
): number {
  const wall = Date.UTC(year, month, day, hour);
  let t = wall;
  // Two corrections settle the zone's offset, a change of daylight saving included.
  for (let i = 0; i < 2; i++) {
    const w = wallTime(t, timeZone);
    t = wall - (Date.UTC(w.year, w.month, w.day, w.hour, w.minute) - t);
  }
  return t;
}

/** The most ticks a time axis draws. */
export const MAX_TIME_TICKS = 8;

export type TimeTicks = {
  ticks: number[];
  /** A tick's label: the first tick and every tick that starts a new year carry the year. */
  tick: (ms: number) => string;
  /** A point's full date, for the tooltip and the card. */
  full: (ms: number) => string;
};

/**
 * The ticks of a time axis and their labels: hours, days, months or years by the span, at most
 * eight, each at the start of its unit in `timeZone`. Months step by 1, 2, 3, 6 or 12 and years by
 * 1, 2, 5 or 10, aligned to January and to round years, so a quarter tick is a quarter's start.
 */
export function timeTicks(min: number, max: number, locale = "en-US", timeZone = "UTC"): TimeTicks {
  const dateFormat = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone, ...options });
  const hourFmt = dateFormat({ hour: "numeric", minute: "2-digit" });
  const dayFmt = dateFormat({ day: "numeric", month: "short" });
  const dayYearFmt = dateFormat({ day: "numeric", month: "short", year: "numeric" });
  const monthFmt = dateFormat({ month: "short" });
  // The whole year: "Apr 26" would read as a day.
  const monthYearFmt = dateFormat({ month: "short", year: "numeric" });
  const yearFmt = dateFormat({ year: "numeric" });
  const fullFmt = dateFormat({ day: "numeric", month: "short", year: "numeric" });
  const fullTimeFmt = dateFormat({
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const fullDate = (ms: number) => fullFmt.format(ms);
  const span = Math.max(1, max - min);
  const days = span / DAY;
  const start = wallTime(min, timeZone);
  const within = (t: number) => t >= min && t <= max;

  /** Ticks from `first`, `step` units apart, while they stay in the span. */
  const walk = (at: (n: number) => number) => {
    const out: number[] = [];
    for (let n = 0; n < 1000; n++) {
      const t = at(n);
      if (t > max) break;
      if (within(t) && out[out.length - 1] !== t) out.push(t);
    }
    return out;
  };
  /** The first step (of `steps`) whose ticks number at most eight. */
  const fewest = (steps: number[], ticksFor: (step: number) => number[]) => {
    for (const step of steps) {
      const ticks = ticksFor(step);
      if (ticks.length <= MAX_TIME_TICKS) return ticks;
    }
    return ticksFor(steps[steps.length - 1] ?? 1);
  };
  /** Labels by tick: `landmark` for the first and wherever the year changes, `plain` otherwise. */
  const labelled = (
    ticks: number[],
    plain: Intl.DateTimeFormat,
    landmark: Intl.DateTimeFormat,
    landmarks: boolean,
  ) => {
    const labels = new Map<number, string>();
    let year: number | null = null;
    for (const t of ticks) {
      const y = wallTime(t, timeZone).year;
      labels.set(t, landmarks && y !== year ? landmark.format(t) : plain.format(t));
      year = y;
    }
    return (ms: number) => labels.get(ms) ?? plain.format(ms);
  };
  const crossesYear = start.year !== wallTime(max, timeZone).year;

  if (days <= 3) {
    const ticks = fewest([1, 3, 6, 12], (step) => {
      const first = Math.ceil(start.hour / step) * step;
      return walk((n) => zonedTime(start.year, start.month, start.day, first + n * step, timeZone));
    });
    const labels = new Map<number, string>();
    for (const t of ticks)
      labels.set(t, wallTime(t, timeZone).hour === 0 ? dayFmt.format(t) : hourFmt.format(t));
    return {
      ticks,
      tick: (ms) => labels.get(ms) ?? hourFmt.format(ms),
      full: (ms) => fullTimeFmt.format(ms),
    };
  }
  if (days <= 62) {
    // The first midnight at or after `min`.
    const firstDay =
      start.day + (zonedTime(start.year, start.month, start.day, 0, timeZone) < min ? 1 : 0);
    const ticks = fewest([1, 2, 7, 14], (step) =>
      walk((n) => zonedTime(start.year, start.month, firstDay + n * step, 0, timeZone)),
    );
    return { ticks, tick: labelled(ticks, dayFmt, dayYearFmt, crossesYear), full: fullDate };
  }
  if (days <= 800) {
    const ticks = fewest([1, 2, 3, 6, 12], (step) => {
      // The first month start at or after `min` whose month is a multiple of the step.
      const first = Math.ceil(start.month / step) * step;
      return walk((n) => zonedTime(start.year, first + n * step, 1, 0, timeZone));
    });
    return { ticks, tick: labelled(ticks, monthFmt, monthYearFmt, true), full: fullDate };
  }
  const ticks = fewest([1, 2, 5, 10, 20, 50, 100], (step) => {
    const first = Math.ceil(start.year / step) * step;
    return walk((n) => zonedTime(first + n * step, 0, 1, 0, timeZone));
  });
  return { ticks, tick: (ms) => yearFmt.format(ms), full: fullDate };
}
