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
          className={classes(
            "group/toggle-group flex w-fit flex-row items-center gap-[calc(var(--ds-space-050)*var(--gap))] rounded-medium data-[size=sm]:rounded-small data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
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
          "focus:z-10 focus-visible:z-10",
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
