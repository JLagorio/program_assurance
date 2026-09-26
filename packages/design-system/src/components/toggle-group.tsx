import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import type { VariantProps } from "class-variance-authority";
import { createContext, useContext, type CSSProperties } from "react";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { toggleVariants, type ToggleProps } from "./toggle";

const ToggleGroupContext = createContext<
  VariantProps<typeof toggleVariants> & {
    spacing: number;
    orientation: "horizontal" | "vertical";
  }
>({ size: "default", variant: "default", spacing: 2, orientation: "horizontal" });

export type ToggleGroupProps<Value extends string = string> = ToggleGroupPrimitive.Props<Value> &
  VariantProps<typeof toggleVariants> & {
    /** Gap in 4px spacing units. Use zero to join the items. */
    spacing?: number | undefined;
  };

export function ToggleGroup<Value extends string = string>({
  className,
  variant,
  size,
  spacing = 2,
  orientation = "horizontal",
  dir,
  style,
  children,
  ...props
}: ToggleGroupProps<Value>) {
  const { direction } = useLedgerLocale();
  const keyboardDirection = dir === "ltr" || dir === "rtl" ? dir : direction;
  const gap = { "--gap": spacing } as CSSProperties;

  return (
    <DirectionProvider direction={keyboardDirection}>
      <ToggleGroupContext.Provider value={{ variant, size, spacing, orientation }}>
        <ToggleGroupPrimitive
          data-slot="toggle-group"
          data-variant={variant}
          data-size={size}
          data-spacing={spacing}
          dir={dir ?? direction}
          orientation={orientation}
          {...props}
          style={
            typeof style === "function"
              ? (state) => ({ ...gap, ...style(state) })
              : { ...gap, ...style }
          }
          // A row too narrow for every item wraps onto the next line, so each choice stays in
          // view and in reach and nothing paints past the row. Three places keep one line. A
          // joined group (spacing 0) is one control, and wrapping would break its borders and
          // corners; in a narrower row it goes in a horizontal Scroller. In a table cell,
          // wrapping would let an auto-sized column squeeze the group to one item a line; the
          // cell keeps one line and the table's frame scrolls. Inside a horizontal Scroller (a
          // saved-views strip), the Scroller scrolls it.
          className={classes(
            "group/toggle-group flex w-fit flex-row flex-wrap items-center gap-[calc(var(--ds-space-050)*var(--gap))] rounded-medium data-[size=sm]:rounded-small data-[spacing=0]:flex-nowrap data-[orientation=vertical]:flex-col data-[orientation=vertical]:flex-nowrap data-[orientation=vertical]:items-stretch [td_&]:flex-nowrap [th_&]:flex-nowrap [[data-slot=scroller][data-orientation=horizontal]_&]:flex-nowrap",
            className,
          )}
        >
          {children}
        </ToggleGroupPrimitive>
      </ToggleGroupContext.Provider>
    </DirectionProvider>
  );
}

export type ToggleGroupItemProps<Value extends string = string> = ToggleProps<Value>;

export function ToggleGroupItem<Value extends string = string>({
  className,
  variant = "default",
  size = "default",
  ...props
}: ToggleGroupItemProps<Value>) {
  const context = useContext(ToggleGroupContext);
  const resolvedVariant = context.variant || variant;
  const resolvedSize = context.size || size;
  const joined = context.spacing === 0;
  const horizontal = context.orientation === "horizontal";

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      data-spacing={context.spacing}
      {...props}
      className={classes(
        cn(
          toggleVariants({ variant: resolvedVariant, size: resolvedSize }),
          // Relative, so a visually hidden label (an icon-only item's name) is positioned against
          // the item and stays inside any scroller around the group.
          "relative focus:z-10 focus-visible:z-10",
          joined && "rounded-none px-100",
          joined &&
            (horizontal
              ? "first:rounded-s-medium last:rounded-e-medium"
              : "first:rounded-t-medium last:rounded-b-medium"),
          joined &&
            resolvedVariant === "outline" &&
            (horizontal ? "border-s-0 first:border-s" : "border-t-0 first:border-t"),
        ),
        className,
      )}
    />
  );
}
