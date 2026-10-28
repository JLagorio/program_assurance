import { Scroller, ScrollerArrow, ScrollerViewport } from "../../components/scroller";
import { cn } from "../../lib/cn";
import type { SpreadsheetToolbarProps } from "./types";
/** A shared workbook strip: normal Tab navigation, horizontal overflow and visible edge arrows. */
export function SpreadsheetToolbar({
  label,
  children,
  className,
  ...props
}: SpreadsheetToolbarProps) {
  return (
    <div
      {...props}
      className={cn("min-w-0", className)}
      role="group"
      aria-label={label}
      data-slot="spreadsheet-toolbar"
    >
      <Scroller orientation="horizontal">
        <ScrollerViewport>
          <div data-slot="spreadsheet-tools">{children}</div>
        </ScrollerViewport>
        <ScrollerArrow edge="start" />
        <ScrollerArrow edge="end" />
      </Scroller>
    </div>
  );
}
