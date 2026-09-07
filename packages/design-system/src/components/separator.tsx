import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { classes } from "../lib/base-ui";

export type SeparatorProps = SeparatorPrimitive.Props & {
  /** Hide a purely visual rule from assistive technology. Native role and ARIA props can override these defaults. */
  isDecorative?: boolean | undefined;
};

/** A Base UI separator with a one-pixel `color.border` rule and parent-owned spacing. */
export function Separator({
  orientation = "horizontal",
  isDecorative = false,
  className,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      {...(isDecorative
        ? { role: "none", "aria-hidden": true, "aria-orientation": undefined }
        : undefined)}
      {...props}
      className={classes(
        "h-auto shrink-0 border-0 border-default " +
          (orientation === "vertical" ? "w-0 self-stretch border-s" : "h-0 w-full border-t"),
        className,
      )}
    />
  );
}
