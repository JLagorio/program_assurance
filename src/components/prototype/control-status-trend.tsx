import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  Chart,
  Stack,
  useLedgerLocale,
  type ChartColumn,
  type ChartSeries,
} from "@ledger/design-system";
import { useProgramControlStatus, type ProgramControlStatus } from "@/lib/control-status";
import {
  MIN_TREND_DAYS,
  RECENT_POSTURE_DAYS,
  calendarDay,
  postureSeries,
  usePostureTrend,
  type PostureTrend,
} from "@/lib/posture-trend";
import { ReportFailures } from "./work-common";

/*
 * Where a program has stood on its control baseline over time: the share of it satisfied, a point
 * a day, from the daily control status snapshots (posture-trend). The trend starts on the day the
 * first snapshot was taken, and today's point is the live standing the page shows beside it.
 */

/** The one series: the share satisfied, in the satisfied status's tone. */
const SERIES: ChartSeries[] = [{ key: "share", label: "Satisfied", tone: "success" }];

/** A share as the reader's locale writes a percent, to a tenth. */
function usePercent() {
  const { formatNumber } = useLedgerLocale();
  return useCallback(
    (value: number) => formatNumber(value, { style: "percent", maximumFractionDigits: 1 }),
    [formatNumber],
  );
}

/**
 * The program Overview's trend, under the Control status tray: a Chart frame whose line is the
 * share of the control baseline satisfied, a point a day, with its table twin one toggle away and a
 * description that says since when it is tracked. It draws nothing until it holds seven days (the
 * tray above says today's share), nor while it loads, nor for a program with no control baseline;
 * a failure is the region's one alert with Retry.
 */
export function ProgramControlStatusTrend({ programId }: { programId: string }) {
  const { formatNumber, formatDay } = useLedgerLocale();
  const percent = usePercent();
  // The tray above reads the same standing: today's point is it, so the line ends at its share.
  const status = useProgramControlStatus(programId);
  const trend = usePostureTrend(useMemo(() => [programId], [programId]));
  const points = useMemo(
    () => postureSeries(trend.data?.get(programId) ?? [], status.data),
    [trend.data, status.data, programId],
  );
  const columns = useMemo<ChartColumn[]>(() => {
    const count = (value: unknown) => (typeof value === "number" ? formatNumber(value) : "");
    return [
      { key: "satisfied", label: "Controls satisfied", format: count },
      { key: "total", label: "Controls", format: count },
    ];
  }, [formatNumber]);
  if (status.data && !status.data.baseline) return null;
  // Under seven days, loading or failed, there is no trend to draw: the tray says the share, and
  // the region's alert a failure.
  if (points.length < MIN_TREND_DAYS || trend.data === undefined || status.data === undefined)
    return <ReportFailures queries={[trend]} />;
  const day = (value: string) =>
    formatDay(calendarDay(value), { day: "numeric", month: "long", year: "numeric" });
  const first = points[0]!;
  const last = points.at(-1)!;
  const summary =
    first.share == null || last.share == null
      ? undefined
      : `The share satisfied went from ${percent(first.share)} on ${day(first.day)} to ${percent(last.share)} on ${day(last.day)}.`;
  return (
    <Stack space="space.150" className="min-w-0">
      <ReportFailures queries={[trend]} />
      <Chart
        title="Controls satisfied over time"
        titleLevel={2}
        description={`Share of the control baseline, tracked since ${day(first.day)}.`}
        summary={summary}
        data={points}
        x="day"
        xLabel="Day"
        format={percent}
        columns={columns}
      >
        <Chart.Line
          // The days are spaced by time.
          scale="time"
          series={SERIES}
          domain={[0, 1]}
          // A marker on each day while there are few of them.
          dots={points.length <= 31}
          labels="end"
        />
      </Chart>
    </Stack>
  );
}

const TrendContext = createContext<UseQueryResult<PostureTrend, Error> | null>(null);

/**
 * A widget's rows' trends, read once for every row (`useRecentPostureTrend`), for the sparklines in
 * them to draw from. The widget's alert takes the same answer with the rows' other reads.
 */
export function ControlStatusTrends({
  trend,
  children,
}: {
  trend: UseQueryResult<PostureTrend, Error>;
  children: ReactNode;
}) {
  return <TrendContext.Provider value={trend}>{children}</TrendContext.Provider>;
}

/**
 * A program's share satisfied over its last twelve days, beside the number it trends, read from
 * the trends `ControlStatusTrends` holds. Its last point is the live standing, so the line ends at
 * the number. Unnamed, so a screen reader hears the number once. Under seven days it draws
 * nothing, since the number beside it says where the program stands; nor does a trend that could
 * not be read, which the widget's alert says.
 */
export function ControlStatusSparkline({
  programId,
  status,
}: {
  programId: string;
  status: Pick<ProgramControlStatus, "baseline" | "total" | "counts">;
}) {
  const trend = useContext(TrendContext);
  const points = useMemo(
    () => postureSeries(trend?.data?.get(programId) ?? [], status).slice(-RECENT_POSTURE_DAYS),
    [trend?.data, programId, status],
  );
  if (points.length < MIN_TREND_DAYS) return null;
  return (
    <Chart.Sparkline data={points} x="day" y="share" tone="success" width={80} height={20} endDot />
  );
}
