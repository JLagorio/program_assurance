import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { VisuallyHidden } from "../primitives/visually-hidden";

/* Meter: N of M as its marks, one an item, always beside the count it draws. Its marks are a
   Tally's segments standing apart, painted by src/styles/tally.css as a Ladder row's are. */

/** The marks' size: `medium` 8px beside body text, `large` 12px beside larger text. */
export type MeterSize = "medium" | "large";

export type MeterProps = Omit<ComponentProps<"span">, "children"> & {
  /** How many are met, N: drawn first, filled. */
  value: number;
  /** How many there are, M: one mark each. For a few items, up to about twenty; past that, a Tally beside the number. */
  max: number;
  /** How many of the rest are late: drawn after the met marks, hatched in the danger tone, so their shape says it as well as their colour, and said after the count ("3 late"). @default 0 */
  late?: number | undefined;
  /** `medium` is 8px marks beside `font.body`; `large` 12px marks beside `font.body.large`. @default "medium" */
  size?: MeterSize | undefined;
  /** What is counted: "Checks met". With it the meter is an image named by it and its count ("Checks met: 2 of 10"); without it the marks are decoration and the count beside them is the text a screen reader reads. */
  label?: string | undefined;
};

/** A count: a whole number, never below nothing. */
const whole = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

/**
 * N of M as its marks, one an item, beside the count in words: two of ten checks met, one of
 * twelve items closed with three late. The marks are neutral: filled is met, hollow is open, and
 * a late item is hatched in the danger tone, told by its shape as well as its colour. The count
 * is always drawn, so the marks never stand without their number. For how many of a large group
 * are in each state use a Tally; for every item of a set, a TileMap. The span's native props and
 * ref reach the meter's box.
 */
export function Meter({
  value,
  max,
  late = 0,
  size = "medium",
  label,
  className,
  ...props
}: MeterProps) {
  const { t, formatNumber } = useLedgerLocale();
  const total = whole(max);
  const met = Math.min(whole(value), total);
  const overdue = Math.min(whole(late), total - met);
  const reading = t("meterValue", { value: formatNumber(met), total: formatNumber(total) });
  const lateWords = overdue ? t("meterLate", { count: formatNumber(overdue) }) : "";
  // The count drawn in two weights: the value in the text colour, the rest of the words subtle.
  const [before = "", after = ""] = t("meterValue", { total: formatNumber(total) }).split(
    "{value}",
  );
  const named = label
    ? { role: "img", "aria-label": `${label}: ${lateWords ? `${reading}, ${lateWords}` : reading}` }
    : {};
  return (
    <span {...props} {...named} data-slot="meter" data-size={size} className={cn(className)}>
      <span aria-hidden data-slot="meter-marks">
        {Array.from({ length: total }, (_, index) => {
          const state = index < met ? "met" : index < met + overdue ? "late" : "open";
          return (
            <span
              key={index}
              data-slot="meter-mark"
              data-state={state}
              data-tone={state === "late" ? "danger" : "neutral"}
              data-fill={state === "met" ? "solid" : "outline"}
            />
          );
        })}
      </span>
      <span
        data-slot="meter-value"
        className={cn(
          "whitespace-nowrap tabular-nums text-subtle",
          size === "large" ? "font-body-large" : "font-body",
        )}
      >
        {before}
        <span className="font-medium text-default">{formatNumber(met)}</span>
        {after}
        {lateWords ? <VisuallyHidden>{`, ${lateWords}`}</VisuallyHidden> : null}
      </span>
    </span>
  );
}
