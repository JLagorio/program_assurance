import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/* Reference material. Atlassian's ButtonGroup spaces buttons; Carbon groups them by importance;
   Base Web's selects among them. This one joins them: buttons that are one control read as one,
   the corners meeting and a hairline between. Spaced actions are an Inline; a choice among views
   is a ToggleGroup. */

export type ButtonGroupProps = {
  /** The group's name, when it is not clear from the buttons: "Export", "Approve". */
  label?: string | undefined;
  /** Buttons or IconButtons of one size and one variant. Two or three; a fourth is a menu. */
  children: ReactNode;
  className?: string | undefined;
};

/** Buttons that belong together read as one control: the corners join and a hairline sits between. A split button is a Button and an IconButton with a chevron. */
export function ButtonGroup({ label, children, className }: ButtonGroupProps) {
  return (
    <span
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-stretch",
        "[&>*]:rounded-none [&>*:first-child]:rounded-s-medium [&>*:last-child]:rounded-e-medium [&>*+*]:border-s [&>*+*]:border-default [&>*]:relative [&>*:hover]:z-10 [&>*:focus-visible]:z-10",
        className,
      )}
    >
      {children}
    </span>
  );
}
