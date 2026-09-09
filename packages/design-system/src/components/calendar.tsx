import { useLedgerLocale } from "../lib/locale";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, type ComponentProps } from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Root,
  type Chevron as DayPickerChevron,
  type WeekNumber,
} from "react-day-picker";

import { cn } from "../lib/cn";
import { Button, buttonVariants, type ButtonProps } from "./button";

export type CalendarProps = ComponentProps<typeof DayPicker> & {
  buttonVariant?: ButtonProps["variant"];
};

/** A month you pick a day (or a range) from. react-day-picker underneath; 32px cells, the selection is the blue budget, today is weight 600 with no dot. */
export function Calendar({
  className,
  classNames,
  formatters,
  labels,
  components,
  locale,
  captionLayout = "label",
  buttonVariant = "subtle",
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const { direction, t, formatCalendarDate } = useLedgerLocale();
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
  return (
    <DayPicker
      dir={direction}
      locale={locale}
      captionLayout={captionLayout}
      showOutsideDays={showOutsideDays}
      formatters={{
        formatCaption: (date) => calendarFormat(date, { month: "long", year: "numeric" }),
        formatWeekdayName: (date) => calendarFormat(date, { weekday: "short" }),
        formatMonthDropdown: (date) => calendarFormat(date, { month: "long" }),
        ...formatters,
      }}
      labels={{
        labelPrevious: () => t("previousMonth"),
        labelNext: () => t("nextMonth"),
        labelMonthDropdown: () => t("month"),
        labelYearDropdown: () => t("year"),
        labelWeekNumber: (week) => t("calendarWeek", { week }),
        labelDayButton: (date, modifiers) =>
          [
            calendarFormat(date, { dateStyle: "full" }),
            modifiers["today"] ? t("today") : null,
            modifiers["selected"] ? t("selected") : null,
          ]
            .filter(Boolean)
            .join(", "),
        ...labels,
      }}
      className={cn("w-fit p-150", className)}
      classNames={{
        root: cn(base.root, "font-body text-default"),
        months: "relative flex flex-col gap-200 sm:flex-row",
        month: "flex w-full flex-col gap-150",
        month_caption: "flex h-control-small items-center justify-center px-400",
        caption_label: "inline-flex items-center gap-050 font-body font-medium",
        dropdowns: "flex h-control-medium items-center justify-center gap-100",
        dropdown_root:
          "relative flex h-control-small items-center rounded-medium border border-input px-075 focus-within:outline-focused",
        dropdown: "absolute inset-0 w-full cursor-pointer opacity-0",
        week_number_header: "w-400",
        week_number: "w-400 text-center font-body-xsmall text-subtle",
        nav: "absolute inset-x-0 top-0 flex h-control-small items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
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
        Chevron: CalendarChevron,
        DayButton: CalendarDayButton,
        WeekNumber: CalendarWeekNumber,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarRoot({ className, rootRef, ...props }: ComponentProps<typeof Root>) {
  return <div data-slot="calendar" ref={rootRef} className={className} {...props} />;
}
function CalendarChevron({
  orientation,
  className,
  ...props
}: ComponentProps<typeof DayPickerChevron>) {
  const Icon =
    orientation === "left" ? ChevronLeft : orientation === "right" ? ChevronRight : ChevronDown;
  return (
    <Icon
      aria-hidden
      className={cn(
        "size-icon-small",
        (orientation === "left" || orientation === "right") && "rtl:rotate-180",
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
        "size-400 p-0 font-body font-regular text-default data-[selected-single=true]:bg-brand-bold data-[selected-single=true]:text-inverse data-[selected-single=true]:hover:bg-brand-bold-hovered data-[range-start=true]:bg-brand-bold data-[range-start=true]:text-inverse data-[range-start=true]:hover:bg-brand-bold-hovered data-[range-end=true]:bg-brand-bold data-[range-end=true]:text-inverse data-[range-end=true]:hover:bg-brand-bold-hovered data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-selected data-[range-middle=true]:text-default data-[range-middle=true]:hover:bg-selected-hovered",
        getDefaultClassNames().day_button,
        className,
      )}
      {...props}
    />
  );
}
