import { cn } from "../lib/cn";

/* Reference material. None of Carbon, Base Web or Atlassian has a divider on its own; Atlassian's
   menus and Carbon's toolbars draw one inside. Radix Separator is the model for the roles: a rule
   that splits groups of controls is a separator; a rule that only draws a line is decorative. */

export type SeparatorProps = {
  /** `horizontal` spans its container, the default; `vertical` stretches to the height of the flex row it sits in. */
  orientation?: "horizontal" | "vertical" | undefined;
  /** The rule only draws a line: between a heading and its body, between two cards. It is hidden from a screen reader. Off by default, when the rule splits groups of controls in a toolbar or a menu. */
  isDecorative?: boolean | undefined;
  className?: string | undefined;
};

/** A hairline between siblings, `color.border`. */
export function Separator({ orientation = "horizontal", isDecorative, className }: SeparatorProps) {
  return (
    <div
      role={isDecorative ? "none" : "separator"}
      aria-orientation={isDecorative ? undefined : orientation}
      aria-hidden={isDecorative || undefined}
      className={cn(
        "shrink-0 border-default",
        orientation === "vertical" ? "w-0 self-stretch border-s" : "h-0 w-full border-t",
        className,
      )}
    />
  );
}
