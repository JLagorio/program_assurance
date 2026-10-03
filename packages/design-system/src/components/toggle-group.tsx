import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { toggleSizeWord, toggleVariants, type ToggleProps, type ToggleStyleProps } from "./toggle";

type ToggleGroupContextValue = ToggleStyleProps & {
  spacing: number;
  orientation: "horizontal" | "vertical";
  /** A single-select group's pressed value, whose item holds the group's one tab stop. */
  pressed: string | undefined;
  /** Whether an enabled item holds that value, so the stop can move to it. */
  stopClaimed: boolean;
  /** The pressed item says it is there, and enabled; the cleanup takes the claim back. */
  claimStop: () => () => void;
  /** Focus is inside the group, where Base UI's roving stop follows it. */
  focusInside: boolean;
};

// Outside a group an item keeps its own size and variant.
const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  size: undefined,
  variant: undefined,
  spacing: 2,
  orientation: "horizontal",
  pressed: undefined,
  stopClaimed: false,
  claimStop: () => () => undefined,
  focusInside: false,
});

export type ToggleGroupProps<Value extends string = string> = ToggleGroupPrimitive.Props<Value> &
  ToggleStyleProps & {
    /**
     * The gap between items in 4px steps on the space scale: 2 (8px, `space.100`) by default, 0
     * joins the items. 1 to 6, 8, 10, 12 and 16 are the steps; a number between two steps takes the
     * smaller.
     */
    spacing?: number | undefined;
  };

/** The gap for `spacing` in 4px steps, on the space tokens. */
const gaps: ReadonlyArray<readonly [number, string]> = [
  [16, "gap-800"],
  [12, "gap-600"],
  [10, "gap-500"],
  [8, "gap-400"],
  [6, "gap-300"],
  [5, "gap-250"],
  [4, "gap-200"],
  [3, "gap-150"],
  [2, "gap-100"],
  [1, "gap-050"],
];
const gapFor = (spacing: number) => gaps.find(([step]) => spacing >= step)?.[1] ?? "gap-0";

export function ToggleGroup<Value extends string = string>({
  className,
  variant,
  size: sizeProp,
  spacing = 2,
  orientation = "horizontal",
  dir,
  children,
  value,
  defaultValue,
  onValueChange,
  multiple,
  onFocus,
  onBlur,
  ...props
}: ToggleGroupProps<Value>) {
  const { direction } = useLedgerLocale();
  const keyboardDirection = dir === "ltr" || dir === "rtl" ? dir : direction;
  const size = toggleSizeWord(sizeProp);
  // The group's value as Base UI holds it: the controlled value, or a copy of the uncontrolled one
  // that follows every change the group accepts.
  const [uncontrolled, setUncontrolled] = useState<readonly Value[]>(defaultValue ?? []);
  const current = value ?? uncontrolled;
  // A single-select group is a set of choices like a radio group: Tab lands on the pressed item,
  // not the first, so the reader starts on the current choice (APG radio group). Base UI keeps
  // the stop on the first item; the pressed item takes it once it is known to be there and enabled.
  const pressed = !multiple && current.length === 1 ? current[0] : undefined;
  const [claims, setClaims] = useState(0);
  const claimStop = useCallback(() => {
    setClaims((count) => count + 1);
    return () => setClaims((count) => count - 1);
  }, []);
  // While focus is inside, Base UI's roving stop follows it, so Tab from any item leaves the
  // group; once focus leaves, the stop goes back to the pressed item.
  const [focusInside, setFocusInside] = useState(false);
  const context = useMemo(
    () => ({
      variant,
      size,
      spacing,
      orientation,
      pressed,
      stopClaimed: claims > 0,
      claimStop,
      focusInside,
    }),
    [variant, size, spacing, orientation, pressed, claims, claimStop, focusInside],
  );

  return (
    <DirectionProvider direction={keyboardDirection}>
      <ToggleGroupContext.Provider value={context}>
        <ToggleGroupPrimitive
          dir={dir ?? direction}
          orientation={orientation}
          {...props}
          {...(value !== undefined ? { value } : {})}
          {...(defaultValue !== undefined ? { defaultValue } : {})}
          {...(multiple !== undefined ? { multiple } : {})}
          onValueChange={(next, details) => {
            onValueChange?.(next, details);
            if (!details.isCanceled && value === undefined) setUncontrolled(next);
          }}
          onFocus={(event) => {
            onFocus?.(event);
            setFocusInside(true);
          }}
          onBlur={(event) => {
            onBlur?.(event);
            const next = event.relatedTarget;
            if (!(next instanceof Node) || !event.currentTarget.contains(next))
              setFocusInside(false);
          }}
          data-slot="toggle-group"
          data-variant={variant ?? undefined}
          data-size={size}
          data-spacing={spacing}
          // A row too narrow for every item wraps onto the next line, so each choice stays in
          // view and in reach and nothing paints past the row. Three places keep one line. A
          // joined group (spacing 0) is one control, and wrapping would break its borders and
          // corners; in a narrower row it goes in a horizontal Scroller. In a table cell,
          // wrapping would let an auto-sized column squeeze the group to one item a line; the
          // cell keeps one line and the table's frame scrolls. Inside a horizontal Scroller (a
          // saved-views strip), the Scroller scrolls it.
          className={classes(
            cn(
              "group/toggle-group flex w-fit flex-row flex-wrap items-center rounded-medium data-[size=small]:rounded-small data-[spacing=0]:flex-nowrap data-[orientation=vertical]:flex-col data-[orientation=vertical]:flex-nowrap data-[orientation=vertical]:items-stretch [td_&]:flex-nowrap [th_&]:flex-nowrap [[data-slot=scroller][data-orientation=horizontal]_&]:flex-nowrap",
              gapFor(spacing),
            ),
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
  size = "medium",
  ...props
}: ToggleGroupItemProps<Value>) {
  const context = useContext(ToggleGroupContext);
  const resolvedVariant = context.variant || variant;
  const resolvedSize = toggleSizeWord(context.size || size) ?? "medium";
  const joined = context.spacing === 0;
  const horizontal = context.orientation === "horizontal";
  const { claimStop } = context;
  const holdsValue = context.pressed !== undefined && props.value === context.pressed;
  const isStop = holdsValue && !props.disabled;
  useLayoutEffect(() => (isStop ? claimStop() : undefined), [isStop, claimStop]);
  // Once the pressed item has claimed the stop, it is the one item Tab reaches from outside; arrow
  // keys still move focus to every item, and inside the group Base UI's stop follows focus.
  const tabIndex = context.stopClaimed && !context.focusInside ? (isStop ? 0 : -1) : undefined;

  return (
    <TogglePrimitive
      {...(tabIndex !== undefined ? { tabIndex } : {})}
      {...props}
      data-slot="toggle-group-item"
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      data-spacing={context.spacing}
      className={classes(
        cn(
          toggleVariants({ variant: resolvedVariant, size: resolvedSize }),
          // Relative, so a visually hidden label (an icon-only item's name) is positioned against
          // the item and stays inside any scroller around the group.
          "relative focus:z-10 focus-visible:z-10",
          // The pressed edge (toggle.tsx) follows the joined item's corners.
          joined && "rounded-none px-100 data-pressed:after:rounded-none",
          joined &&
            (horizontal
              ? "first:rounded-s-medium last:rounded-e-medium first:data-pressed:after:rounded-s-medium last:data-pressed:after:rounded-e-medium"
              : "first:rounded-t-medium last:rounded-b-medium first:data-pressed:after:rounded-t-medium last:data-pressed:after:rounded-b-medium"),
          joined &&
            resolvedVariant === "outline" &&
            (horizontal ? "border-s-0 first:border-s" : "border-t-0 first:border-t"),
        ),
        className,
      )}
    />
  );
}
