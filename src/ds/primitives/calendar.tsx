import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = ComponentProps<typeof DayPicker>;

const navButton =
  "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-40";

function Chevron({ orientation }: { orientation?: "up" | "down" | "left" | "right" }) {
  return orientation === "left" ? (
    <ChevronLeft className="size-3.5" />
  ) : (
    <ChevronRight className="size-3.5" />
  );
}

/* A month you pick a day (or a range) from. react-day-picker underneath; the
   kit's look on top: 13px, 32px cells, the selection is the blue budget, today
   is weight 600 with no dot. DatePicker puts one in a Popover. */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const base = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: cn(base.root, "text-[13px]"),
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-3",
        month_caption: "flex h-7 items-center justify-center px-8",
        caption_label: "text-[13px] font-medium",
        nav: "absolute inset-x-0 top-0 flex h-7 items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        month_grid: "border-collapse",
        weekdays: "flex",
        weekday: "w-8 text-center text-[11px] font-medium text-muted-foreground",
        week: "mt-1 flex",
        day: "relative size-8 p-0 text-center",
        day_button:
          "size-8 rounded-md text-[13px] transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary-hover",
        today: "[&>button]:font-semibold",
        outside: "text-muted-foreground/60",
        disabled: "text-muted-foreground/40 [&>button]:pointer-events-none",
        hidden: "invisible",
        range_start: "rounded-l-md bg-primary-soft",
        range_middle:
          "bg-primary-soft [&>button]:bg-transparent [&>button]:text-foreground [&>button]:hover:bg-primary-soft",
        range_end: "rounded-r-md bg-primary-soft",
        ...classNames,
      }}
      components={{ Chevron }}
      {...props}
    />
  );
}
