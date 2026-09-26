import { useLedgerLocale } from "../lib/locale";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { createContext, useContext, useEffect, useRef, type ComponentProps } from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DateRange,
  type DayButton,
  type Modifiers,
  type Root,
  type Chevron as DayPickerChevron,
  type WeekNumber,
} from "react-day-picker";

import { announce } from "../lib/announce";
import { cn } from "../lib/cn";
import { Button, buttonVariants, type ButtonProps } from "./button";

export type CalendarProps = ComponentProps<typeof DayPicker> & {
  buttonVariant?: ButtonProps["variant"];
  /**
   * More words for a day's accessible name, after the kit's date, today, selected and range
   * words: why a disabled day is not available ("Weekends are closed"), what a marked day holds.
   * Return undefined to add nothing. Keep the rule itself in the field's hint as well, where
   * everyone reads it.
   */
  describeDay?: ((date: Date, modifiers: Modifiers) => string | undefined) | undefined;
};

/* A picker that closes on a completed range and returns focus to a trigger that reads the new
   range turns the calendar's own announcement off, so the range is not said twice. Package-only. */
export const CalendarAnnounceContext = createContext(true);

/**
 * A month you pick a day (or a range) from. react-day-picker underneath; 32px cells, the selection
 * is the blue budget, today is weight 600 with no dot. Words, digits, week start and `lang` follow
 * the LedgerProvider's locale; a completed range is announced.
 */
export function Calendar({
  className,
  classNames,
  formatters,
  labels,
  components,
  locale,
  captionLayout = "label",
  navLayout,
  buttonVariant = "subtle",
  showOutsideDays = true,
  describeDay,
  ...props
}: CalendarProps) {
  const {
    direction,
    t,
    formatCalendarDate,
    formatNumber,
    locale: ledgerLocale,
    weekStartsOn,
  } = useLedgerLocale();
  const announces = useContext(CalendarAnnounceContext);
  const base = getDefaultClassNames();
  const navButton = buttonVariants({
    variant: buttonVariant,
    size: "small",
    className: "size-400 p-0 aria-disabled:text-disabled aria-disabled:pointer-events-none",
  });
  const calendarFormat = locale?.code
    ? (date: Date, options: Intl.DateTimeFormatOptions) =>
        date.toLocaleDateString(locale.code, options)
    : formatCalendarDate;
  const dayLabel = (date: Date, modifiers: Modifiers) =>
    [
      calendarFormat(date, { dateStyle: "full" }),
      modifiers["today"] ? t("today") : null,
      modifiers["range_start"] ? t("dateRangeStart") : null,
      modifiers["range_end"] ? t("dateRangeEnd") : null,
      modifiers["selected"] && !modifiers["range_start"] && !modifiers["range_end"]
        ? t("selected")
        : null,
      describeDay?.(date, modifiers) ?? null,
    ]
      .filter(Boolean)
      .join(", ");
  // A completed range is said once, politely: "September 7 to 11, 2026 selected".
  const pickerProps = (
    props.mode === "range" && props.onSelect && announces
      ? {
          ...props,
          onSelect: (range: DateRange | undefined, ...rest: unknown[]) => {
            (props.onSelect as (range: DateRange | undefined, ...args: unknown[]) => void)(
              range,
              ...rest,
            );
            if (range?.from && range.to) {
              const long = { month: "long", day: "numeric", year: "numeric" } as const;
              const start = calendarFormat(range.from, long);
              const end = calendarFormat(range.to, long);
              // A one-day range (DayPicker's first click) is said as its day, not "7 to 7".
              announce(
                t("dateRangeSelected", {
                  range: start === end ? start : t("dateRangeSpoken", { start, end }),
                }),
              );
            }
          },
        }
      : props
  ) as typeof props;
  return (
    <DayPicker
      dir={direction}
      lang={locale?.code ?? ledgerLocale}
      locale={locale}
      {...(locale ? {} : { weekStartsOn })}
      captionLayout={captionLayout}
      navLayout={navLayout}
      showOutsideDays={showOutsideDays}
      formatters={{
        formatCaption: (date) => calendarFormat(date, { month: "long", year: "numeric" }),
        formatWeekdayName: (date) => calendarFormat(date, { weekday: "short" }),
        formatMonthDropdown: (date) => calendarFormat(date, { month: "long" }),
        formatYearDropdown: (date) => calendarFormat(date, { year: "numeric" }),
        formatDay: (date) => calendarFormat(date, { day: "numeric" }),
        formatWeekNumber: (week) => formatNumber(week),
        ...formatters,
      }}
      labels={{
        labelNav: () => t("dateCalendarNavigation"),
        labelGrid: (date) => calendarFormat(date, { month: "long", year: "numeric" }),
        labelWeekday: (date) => calendarFormat(date, { weekday: "long" }),
        labelPrevious: () => t("previousMonth"),
        labelNext: () => t("nextMonth"),
        labelMonthDropdown: () => t("month"),
        labelYearDropdown: () => t("year"),
        labelWeekNumber: (week) => t("calendarWeek", { week }),
        labelDayButton: dayLabel,
        labelGridcell: (date, modifiers) => dayLabel(date, modifiers ?? {}),
        ...labels,
      }}
      className={cn("w-fit p-150", className)}
      classNames={{
        root: cn(base.root, "font-body text-default"),
        // Below the `sm` window the months always stack: the window is the space there, and a
        // popover sized to its content is one month wide from its first frame instead of
        // shrinking to the screen after it is placed. From `sm` the calendar's own space decides:
        // side by side when it holds them, wrapped under each other when it does not.
        months: "relative flex flex-col gap-200 sm:flex-row sm:flex-wrap sm:justify-center",
        month: cn("flex flex-col gap-150", navLayout === "around" && "relative"),
        month_caption: "flex h-control-small items-center justify-center px-400",
        caption_label: "inline-flex items-center gap-050 font-body font-medium",
        dropdowns: "flex h-control-medium items-center justify-center gap-100",
        dropdown_root:
          "relative flex h-control-small items-center rounded-medium border border-input px-075 focus-within:border-focused focus-within:outline-field-focused",
        dropdown: "absolute inset-0 w-full cursor-pointer opacity-0",
        week_number_header: "w-400",
        week_number: "w-400 text-center font-body-xsmall text-subtle",
        nav: "absolute inset-x-0 top-0 flex h-control-small items-center justify-between",
        button_previous: cn(navButton, navLayout === "around" && "absolute start-0 top-0"),
        button_next: cn(navButton, navLayout === "around" && "absolute end-0 top-0"),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-400 text-center font-body-xsmall font-medium text-subtle",
        week: "flex pt-050",
        day: "group/day relative size-400 p-0 text-center",
        day_button: "size-400",
        today: "[&>button]:font-semibold",
        outside: "[&>button]:text-subtlest",
        disabled: "[&>button]:text-disabled",
        hidden: "invisible",
        range_start: "rounded-s-medium bg-selected",
        range_middle: "bg-selected",
        range_end: "rounded-e-medium bg-selected",
        ...classNames,
      }}
      components={{
        Root: CalendarRoot,
        Chevron: (chevronProps) => (
          <CalendarChevron {...chevronProps} flipInRtl={navLayout !== "around"} />
        ),
        DayButton: CalendarDayButton,
        WeekNumber: CalendarWeekNumber,
        ...components,
      }}
      {...pickerProps}
    />
  );
}

function CalendarRoot({ className, rootRef, ...props }: ComponentProps<typeof Root>) {
  return <div data-slot="calendar" ref={rootRef} className={className} {...props} />;
}
function CalendarChevron({
  orientation,
  className,
  flipInRtl,
  ...props
}: ComponentProps<typeof DayPickerChevron> & { flipInRtl: boolean }) {
  const Icon =
    orientation === "left" ? ChevronLeft : orientation === "right" ? ChevronRight : ChevronDown;
  return (
    <Icon
      aria-hidden
      className={cn(
        "size-icon-small",
        flipInRtl && (orientation === "left" || orientation === "right") && "rtl:rotate-180",
        className,
      )}
      {...props}
    />
  );
}
function CalendarWeekNumber({
  children,
  week: _week,
  ...props
}: ComponentProps<typeof WeekNumber>) {
  return (
    <th {...props}>
      <div className="flex size-400 items-center justify-center">{children}</div>
    </th>
  );
}

export type CalendarDayButtonProps = ComponentProps<typeof DayButton>;
/** DayPicker owns selection and keyboard navigation; Button supplies the shared native button styling. */
export function CalendarDayButton({ className, day, modifiers, ...props }: CalendarDayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers["focused"]) ref.current?.focus();
  }, [modifiers["focused"]]);
  return (
    <Button
      ref={ref}
      variant="subtle"
      size="medium"
      data-day={`${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, "0")}-${String(day.date.getDate()).padStart(2, "0")}`}
      data-selected-single={
        Boolean(modifiers["selected"]) &&
        !modifiers["range_start"] &&
        !modifiers["range_end"] &&
        !modifiers["range_middle"]
      }
      data-range-start={modifiers["range_start"]}
      data-range-end={modifiers["range_end"]}
      data-range-middle={modifiers["range_middle"]}
      className={cn(
        // In forced colours the browser drops the fills that mark the selection; the selected
        // day and the range keep their own colours there, so the choice stays visible.
        "data-[selected-single=true]:forced-color-adjust-none data-[range-start=true]:forced-color-adjust-none data-[range-end=true]:forced-color-adjust-none data-[range-middle=true]:forced-color-adjust-none",
        "size-400 p-0 font-body font-regular text-default data-[selected-single=true]:bg-brand-bold data-[selected-single=true]:text-inverse data-[selected-single=true]:hover:bg-brand-bold-hovered data-[range-start=true]:bg-brand-bold data-[range-start=true]:text-inverse data-[range-start=true]:hover:bg-brand-bold-hovered data-[range-end=true]:bg-brand-bold data-[range-end=true]:text-inverse data-[range-end=true]:hover:bg-brand-bold-hovered data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-selected data-[range-middle=true]:text-default data-[range-middle=true]:hover:bg-selected-hovered",
        getDefaultClassNames().day_button,
        className,
      )}
      {...props}
    />
  );
}
