import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "../lib/cn";

export type CalendarProps = ComponentProps<typeof DayPicker>;

const navButton =
  "inline-flex size-control-small items-center justify-center rounded-medium icon-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused disabled:pointer-events-none disabled:icon-disabled";

function Chevron({ orientation }: { orientation?: "up" | "down" | "left" | "right" | undefined }) {
  return orientation === "left" ? <ChevronLeft className="size-icon-small" /> : <ChevronRight className="size-icon-small" />;
}

/** A month you pick a day (or a range) from. react-day-picker underneath; 32px cells, the selection is the blue budget, today is weight 600 with no dot. */
export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const base = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-150", className)}
      classNames={{
        root: cn(base.root, "font-body text-default"),
        months: "relative flex flex-col gap-200 sm:flex-row",
        month: "flex flex-col gap-150",
        month_caption: "flex h-control-small items-center justify-center px-400",
        caption_label: "font-body font-medium",
        nav: "absolute inset-x-0 top-0 flex h-control-small items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        month_grid: "border-collapse",
        weekdays: "flex",
        weekday: "w-400 text-center font-body-xsmall font-medium text-subtle",
        week: "flex pt-050",
        day: "relative size-400 p-0 text-center",
        day_button: "size-400 rounded-medium font-body outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered focus-visible:outline-focused",
        selected: "[&>button]:bg-brand-bold [&>button]:text-inverse [&>button]:hover:bg-brand-bold-hovered",
        today: "[&>button]:font-semibold",
        outside: "text-subtlest",
        disabled: "text-disabled [&>button]:pointer-events-none",
        hidden: "invisible",
        range_start: "rounded-s-medium bg-selected",
        range_middle: "bg-selected [&>button]:bg-selected [&>button]:text-default [&>button]:hover:bg-selected-hovered",
        range_end: "rounded-e-medium bg-selected",
        ...classNames,
      }}
      components={{ Chevron }}
      {...props}
    />
  );
}
