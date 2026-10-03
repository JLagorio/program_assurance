import { useLedgerLocale } from "../../lib/locale";
import { useId, useMemo, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  type PieSectorShapeProps,
} from "recharts";

import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import {
  CardHead,
  Plot,
  Swatch,
  TooltipContent,
  categoricalTone,
  chartColor,
  heights,
  hoveredColor,
  markClass,
  rectAnchor,
  seriesClass,
  surface,
  textureFill,
  textureOf,
  useChartSurface,
  useFrame,
  useFrameReport,
  useMotion,
  usePicked,
  useTooltipMotion,
  useWarnOnce,
  type ChartSeries,
  type ChartTone,
  type Formatter,
  type FrameReport,
  type Texture,
  type TwinSource,
} from "./_shared";

export type DonutSlice = {
  key: string;
  label: string;
  value: number;
  tone?: ChartTone | undefined;
};

/** What was chosen on a ring: the slice, its share of the whole, and its index. */
export type DonutSelection = { slice: DonutSlice; share: number; index: number };

type ChartDonutOwnProps = {
  /** The parts, in order from the top, clockwise. */
  slices?: DonutSlice[] | undefined;
  /** One value against `max`, in place of `slices`: a gauge's score, a single share. It is one slice, named by the ring, in `tone`. */
  value?: number | undefined;
  /** The tone of `value`'s slice: the tone the score earns. `brand` when unsaid. */
  tone?: ChartTone | undefined;
  /** The whole the slices are parts of: the slices take their share of it, and the rest of the ring is the track. The slices' sum when unsaid. */
  max?: number | undefined;
  /** The number in the middle: the total, the share, the one that matters. */
  centerLabel?: ReactNode | undefined;
  /**
   * The ring's accessible name, as `label` names every plot. The Frame's title when unsaid.
   *
   * For one version the earlier spelling still draws the middle: with no `centerLabel`, a `label`
   * that is not a string, or one beside the deprecated `name`, is the centre text, with a warning in
   * development. Write the middle as `centerLabel`; `ledger/no-deprecated-name` fixes it.
   */
  label?: ReactNode | undefined;
  /** One word under the number: what it counts. */
  caption?: string | undefined;
  /** `full` is a ring; `half` is a gauge, open at the bottom, the number at its base. */
  arc?: "full" | "half" | undefined;
  /** The largest diameter in pixels. In a narrower container the ring scales down, keeping its proportions; the number keeps its type size. In the expanded Dialog it draws at 320px, the `large` plot's height, at least. */
  size?: number | undefined;
  /** The ring's thickness in pixels at `size`; it scales with the ring. */
  thickness?: number | undefined;
  /** The number format in the tooltip. */
  format?: Formatter | undefined;
  /**
   * The ring's accessible name.
   * @deprecated Use `label`, which names every plot; `ledger/no-deprecated-name` fixes it.
   */
  name?: string | undefined;
  /** Every slice wears a pattern as well as its colour. The Frame's `texture` sets it. */
  texture?: boolean | undefined;
  /** Draws the ring's skeleton in place of the slices. The Frame sets it from `state="loading"`. */
  loading?: boolean | undefined;
  /** Called when a slice is clicked, or activated with Enter or Space. */
  onSelect?: ((selection: DonutSelection) => void) | undefined;
  /** More about the chosen slice, in a card anchored to it. The card's head (the slice, its value and its share) is the kit's. */
  details?: ((selection: DonutSelection) => ReactNode) | undefined;
  className?: string | undefined;
};

/** The part's own props, and the native props and ref of the ring's box: an `id`, `data-*` for a test, a handler. */
export type ChartDonutProps = ChartDonutOwnProps &
  Omit<ComponentProps<"div">, keyof ChartDonutOwnProps | "children" | "role">;

const RADIAN = Math.PI / 180;
/** The key of the ring's remainder under `max`: drawn as the track, never a slice. */
const REST = "\u0000rest";
/** The narrowest a slice is drawn, in degrees, when more than one shows: wider than its separators, so it can be hovered. */
const MIN_ANGLE = 3;

/** A sector of the ring as the Pie lays it out: a slice, one hidden from the legend, or the rest. */
type Entry = {
  key: string;
  label: string;
  value: number;
  slice: DonutSlice | null;
  /** Hidden from the Frame's legend: its angle stays, so the others keep theirs, and the track shows through. */
  gap: boolean;
};

/**
 * Which of the props names the ring and which draws the middle. `label` names the ring, as on every
 * plot, and `centerLabel` is the middle. For one version the earlier spelling still reads as it did:
 * with no `centerLabel`, a `label` that is not a string (a number, an element), or one beside the
 * deprecated `name`, is the middle, and `name` names the ring.
 */
function donutLabels(
  label: ReactNode,
  centerLabel: ReactNode,
  legacyName: string | undefined,
): { center: ReactNode; ownName: string | undefined; legacy: boolean } {
  const legacyCenter =
    centerLabel === undefined &&
    label !== undefined &&
    label !== null &&
    (typeof label !== "string" || legacyName !== undefined);
  if (legacyCenter) return { center: label, ownName: legacyName, legacy: true };
  return {
    center: centerLabel,
    ownName: (typeof label === "string" ? label : undefined) ?? legacyName,
    legacy: legacyName !== undefined,
  };
}

/** A ring of slices on a `color.chart.track` with a number in the middle; or half a ring, a gauge. A click on a slice chooses it. */
export function ChartDonut({
  slices: slicesProp,
  value,
  tone: valueTone,
  max,
  centerLabel,
  label,
  caption,
  arc = "full",
  size: sizeProp = 120,
  thickness: thicknessProp = 12,
  format: formatProp,
  name: legacyName,
  texture: textureProp,
  loading: loadingProp,
  onSelect,
  details,
  className,
  "aria-describedby": describedBy,
  ...native
}: ChartDonutProps) {
  const { t, formatNumber } = useLedgerLocale();
  const { center, ownName, legacy } = donutLabels(label, centerLabel, legacyName);
  useWarnOnce(
    legacy,
    "Ledger Chart.Donut: `label` names the ring and `centerLabel` draws the middle. `name` is deprecated for `label`, and a `label` drawn in the middle is deprecated for `centerLabel`.",
  );

  const {
    name: frameName,
    titleId,
    hidden,
    highlighted,
    format,
    formatX,
    loading,
    texture,
    offstage,
    expanded,
  } = useFrame(ownName, formatProp, undefined, loadingProp, undefined, textureProp);
  const chooses = Boolean(onSelect || details);
  const surfaceProps = useChartSurface({
    name: frameName,
    titleId,
    chooses,
    describedBy,
    count: 0,
    describe: () => "",
  });
  const name = surfaceProps.name;
  // Expanded, the ring takes the room the Dialog gives a plot, thickness in proportion.
  const grow = expanded ? Math.max(1, heights.large / sizeProp) : 1;
  const size = sizeProp * grow;
  const thickness = thicknessProp * grow;
  const id = useId();
  const motion = useMotion();
  const tooltipMotion = useTooltipMotion();
  const { picked, pick, clear } = usePicked<DonutSelection>();
  const slices = useMemo<DonutSlice[]>(
    () =>
      slicesProp ??
      (value !== undefined
        ? [{ key: "value", label: frameName ?? t("value"), value, tone: valueTone ?? "brand" }]
        : []),
    [slicesProp, value, valueTone, frameName, t],
  );
  const series: ChartSeries[] = slices.map((s) => ({ key: s.key, label: s.label }));
  const sum = slices.reduce((n, s) => n + s.value, 0);
  // The whole is `max`, else every slice's sum, the hidden ones included: hiding a slice from the
  // legend leaves the others their angles, and a share is always of the same whole.
  const whole = max !== undefined ? Math.max(max, sum) : sum;
  const entries: Entry[] = [
    ...slices.map((s) => ({
      key: s.key,
      label: s.label,
      value: s.value,
      slice: s,
      gap: hidden.has(s.key),
    })),
    ...(whole > sum ? [{ key: REST, label: "", value: whole - sum, slice: null, gap: true }] : []),
  ];
  const half = arc === "half";
  const outer = size / 2;
  const inner = outer - thickness;
  const boxHeight = half ? outer + 4 : size;
  const angles = half ? { startAngle: 180, endAngle: 0 } : { startAngle: 90, endAngle: -270 };
  // `size` is the largest the ring gets: in a narrower container (a block, a grid track or a flex
  // row) the box keeps its ratio and the geometry is given in shares of the box (Recharts reads
  // radii against half the box's shorter side), so the ring and its thickness scale together, as
  // through a viewBox.
  const maxRadius = Math.min(size, boxHeight) / 2;
  const share = (px: number) => `${(px / maxRadius) * 100}%`;
  const radii = { innerRadius: share(inner), outerRadius: share(outer) };
  const cy = half ? `${(outer / boxHeight) * 100}%` : "50%";
  const toneOf = (s: DonutSlice) => s.tone ?? categoricalTone(slices.indexOf(s));
  const textures: Record<string, Texture> = {};
  if (texture) slices.forEach((s, i) => (textures[s.key] = textureOf(i)));
  const fillOf = (s: DonutSlice) =>
    texture
      ? textureFill(id, s.key, textureOf(slices.indexOf(s)), chartColor(toneOf(s)))
      : chartColor(toneOf(s));
  const shareText = (s: DonutSlice) =>
    formatNumber(whole ? s.value / whole : 0, { style: "percent", maximumFractionDigits: 0 });
  // A score against a scale with nothing to choose is a meter: its value, its range, its name.
  const meter = !chooses && slices.length === 1 && max !== undefined && Boolean(name);
  const legend = useMemo<ChartSeries[]>(
    () =>
      slices.map((s, i) => ({ key: s.key, label: s.label, tone: s.tone ?? categoricalTone(i) })),
    [slices],
  );
  const table = useMemo<TwinSource>(
    () => ({
      kind: "custom",
      build: ({ xLabel }) => ({
        columns: [
          { label: xLabel ?? t("chartCategory"), numeric: false },
          { label: t("value"), numeric: true },
          { label: t("chartShare"), numeric: true },
        ],
        // Every slice's share of the whole, whichever the legend hides: the table is the data.
        rows: slices.map((s) => {
          const part = whole ? s.value / whole : 0;
          return {
            key: s.key,
            cells: [
              { text: s.label, csv: s.label },
              { text: format(s.value), csv: String(s.value) },
              {
                text: formatNumber(part, { style: "percent", maximumFractionDigits: 0 }),
                csv: String(Number(part.toFixed(4))),
              },
            ],
          };
        }),
      }),
    }),
    [slices, whole, t, format, formatNumber],
  );
  const report = useMemo<FrameReport>(
    () => ({ series: legend, swatch: "square", format, height: boxHeight, table }),
    [legend, format, boxHeight, table],
  );
  useFrameReport(report);
  if (offstage) return null;
  if (loading)
    return (
      <div
        {...native}
        role={name ? "group" : undefined}
        aria-label={name ? t("loadingLabel", { label: name }) : undefined}
        aria-busy
        aria-hidden={name ? undefined : true}
        className={cn("relative inline-block w-fit max-w-full shrink-0 animate-pulse", className)}
      >
        {/* Sized as the loaded ring's box is, so nothing moves when the slices arrive. */}
        <svg
          viewBox={`0 0 ${size} ${boxHeight}`}
          width={size}
          height={boxHeight}
          className="block h-auto max-w-full"
          aria-hidden
        >
          <circle
            cx={outer}
            cy={outer}
            r={outer - thickness / 2}
            fill="none"
            stroke={token("color.skeleton")}
            strokeWidth={thickness}
          />
        </svg>
      </div>
    );
  const focusable = chooses && Boolean(name);
  const choose = (index: number, sector: PieSectorShapeProps) => {
    const entry = entries[index];
    const s = entry?.slice;
    if (!entry || !s || entry.gap) return;
    const r = ((sector.innerRadius ?? inner) + (sector.outerRadius ?? outer)) / 2;
    const a = -(sector.midAngle ?? 0) * RADIAN;
    const selection = { slice: s, share: whole ? s.value / whole : 0, index: slices.indexOf(s) };
    onSelect?.(selection);
    if (details)
      pick(
        selection,
        rectAnchor({
          x: (sector.cx ?? outer) + r * Math.cos(a) - 4,
          y: (sector.cy ?? outer) + r * Math.sin(a) - 4,
          width: 8,
          height: 8,
        }),
      );
  };
  const card = picked ? (
    <>
      <CardHead
        swatch={
          <Swatch
            color={chartColor(toneOf(picked.item.slice))}
            shape="square"
            texture={textures[picked.item.slice.key]}
          />
        }
        title={picked.item.slice.label}
        subtitle={t("shareOfTotal", {
          share: formatNumber(picked.item.share, { style: "percent", maximumFractionDigits: 0 }),
          total: format(whole),
        })}
        value={format(picked.item.slice.value)}
      />
      {details?.(picked.item)}
    </>
  ) : null;
  const visible = entries.filter((e) => !e.gap).length;
  // How the ring's svg is named: a meter with its value and range; an image when nothing chooses;
  // plain when its slices are the tab stops, the Plot's group carrying the name.
  const chart: Record<string, unknown> = meter
    ? {
        accessibilityLayer: false,
        role: "meter",
        ...(titleId ? { "aria-labelledby": titleId } : { "aria-label": name }),
        "aria-valuenow": slices[0]?.value,
        "aria-valuemin": 0,
        "aria-valuemax": whole,
        "aria-valuetext": t("shareOfTotal", {
          share: format(slices[0]?.value ?? 0),
          total: format(whole),
        }),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      }
    : chooses
      ? { accessibilityLayer: false }
      : surfaceProps.chart;
  const renderSector = (p: PieSectorShapeProps, index: number) => {
    const entry = entries[index];
    const s = entry?.slice;
    // A hidden slice and the rest keep their angle and draw nothing: the track shows through.
    if (!entry || !s || entry.gap) return <g pointerEvents="none" />;
    const chosen = picked ? picked.item.slice.key === s.key : false;
    const sector = (
      <Sector
        cx={p.cx}
        cy={p.cy}
        innerRadius={p.innerRadius}
        outerRadius={(p.outerRadius ?? outer) + (p.isActive || chosen ? 2 : 0)}
        startAngle={p.startAngle}
        endAngle={p.endAngle}
        fill={p.isActive && !texture ? hoveredColor(toneOf(s)) : fillOf(s)}
        stroke={surface()}
        strokeWidth={visible > 1 ? 2 : 0}
        {...(p.className ? { className: p.className } : {})}
      />
    );
    if (!focusable) return sector;
    const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      choose(index, p);
    };
    return (
      <g
        data-chart-tile={s.key}
        role="button"
        tabIndex={0}
        aria-label={t("chartPoint", {
          category: s.label,
          values: t("chartValueShare", { value: format(s.value), share: shareText(s) }),
        })}
        aria-haspopup={details ? "dialog" : undefined}
        aria-expanded={details ? chosen : undefined}
        className="group/slice outline-none"
        onKeyDown={onKeyDown}
      >
        {sector}
        {/* The keyboard's ring: an arc along the slice's inner edge, in the hole, where no other slice paints. */}
        <Sector
          data-slot="chart-mark-focus"
          cx={p.cx}
          cy={p.cy}
          innerRadius={Math.max(0, (p.innerRadius ?? inner) - 5)}
          outerRadius={Math.max(0, (p.innerRadius ?? inner) - 2)}
          startAngle={p.startAngle}
          endAngle={p.endAngle}
          fill={token("color.border.focused")}
          className="pointer-events-none opacity-0 group-focus-visible/slice:opacity-100"
        />
      </g>
    );
  };
  return (
    <Plot
      {...native}
      // Choosing, the box is the named group and carries the description; else the svg does.
      aria-describedby={chooses ? describedBy : undefined}
      name={name}
      width={size}
      height={boxHeight}
      className={cn("inline-block shrink-0", className)}
      semantics={chooses ? "wrapper" : "surface"}
      card={card}
      anchor={picked?.anchor}
      onClose={clear}
      {...(texture
        ? {
            textures: {
              id,
              entries: slices.map((s, i) => ({
                key: s.key,
                color: chartColor(toneOf(s)),
                texture: textureOf(i),
              })),
            },
          }
        : {})}
    >
      <>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: size, height: boxHeight }}
        >
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }} {...chart}>
            {/* The track is the whole, not data: the pointer passes through it and the tooltip never names it. */}
            <Pie
              data={[{ key: "track", value: 1 }]}
              dataKey="value"
              cx="50%"
              cy={cy}
              {...radii}
              fill={token("color.chart.track")}
              stroke="none"
              isAnimationActive={false}
              rootTabIndex={-1}
              tooltipType="none"
              className="pointer-events-none"
              {...angles}
            />
            <Pie
              data={entries}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy={cy}
              {...radii}
              stroke={surface()}
              strokeWidth={visible > 1 ? 2 : 0}
              minAngle={visible > 1 ? MIN_ANGLE : 0}
              rootTabIndex={-1}
              shape={renderSector}
              {...motion}
              {...angles}
              {...(chooses
                ? {
                    onClick: (item: unknown, index: number) =>
                      choose(index, item as PieSectorShapeProps),
                  }
                : {})}
            >
              {entries.map((e) => (
                <Cell
                  key={e.key}
                  {...(e.slice ? seriesClass(e.key, highlighted, chooses && !e.gap) : {})}
                  {...(picked && e.slice ? markClass(picked.item.slice.key === e.key) : {})}
                />
              ))}
            </Pie>
            <Tooltip
              {...tooltipMotion}
              content={
                <TooltipContent
                  series={series}
                  swatch="square"
                  format={format}
                  formatX={formatX}
                  textures={textures}
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
        {center !== undefined || caption ? (
          <div
            // A meter says its value itself; the number would be heard twice.
            aria-hidden={meter || undefined}
            className={cn(
              "pointer-events-none absolute inset-x-0 flex flex-col items-center text-center",
              half ? "bottom-0" : "inset-y-0 justify-center",
            )}
          >
            {center !== undefined ? (
              <span className="font-heading-overlay text-default">{center}</span>
            ) : null}
            {caption ? <span className="font-body-xsmall text-subtle">{caption}</span> : null}
          </div>
        ) : null}
      </>
    </Plot>
  );
}
