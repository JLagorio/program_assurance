import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cva } from "class-variance-authority";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";

/* Pressed is the selected palette (as Button `isSelected`) with a second cue that is not a fill: a
   1px `color.border.selected` edge, 3:1 on the selected fill, so a pressed item never looks like a
   hovered one (hover stays the neutral tint). The default variant draws the edge on an absolutely
   placed ::after, out of the flex flow, so pressing never changes the item's size; the outline
   variant recolours its own border. In forced colours the item is Highlight (forced-colors.css). */
const pressedEdge =
  "data-pressed:after:pointer-events-none data-pressed:after:absolute data-pressed:after:inset-0 data-pressed:after:border data-pressed:after:border-selected";

const toggleRecipe = cva(
  "group/toggle relative inline-flex shrink-0 items-center justify-center gap-050 rounded-medium font-body font-medium whitespace-nowrap text-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:text-default focus-visible:outline-focused disabled:pointer-events-none disabled:text-disabled aria-invalid:outline-danger data-pressed:bg-selected data-pressed:text-selected data-pressed:hover:bg-selected-hovered [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-medium",
  {
    variants: {
      variant: {
        default: cn("bg-transparent", pressedEdge),
        outline: "border border-input bg-transparent data-pressed:border-selected",
      },
      size: {
        medium: "h-control-medium min-w-control-medium px-100 data-pressed:after:rounded-medium",
        small:
          "h-control-small min-w-control-small rounded-small px-100 font-body-small data-pressed:after:rounded-small [&_svg:not([class*='size-'])]:size-icon-small",
        large: "h-control-large min-w-control-large px-100 data-pressed:after:rounded-medium",
      },
    },
    defaultVariants: { variant: "default", size: "medium" },
  },
);

/** A toggle's height on the control scale: `small` 28px, `medium` 32px (the default), `large` 36px. */
export type ToggleSize =
  | "small"
  | "medium"
  | "large"
  /** @deprecated `sm` is `small`, kept for one version. */
  | "sm"
  /** @deprecated `default` is `medium`, kept for one version. */
  | "default"
  /** @deprecated `lg` is `large`, kept for one version. */
  | "lg";

/** The shadcn spellings the toggle still accepts, for one version. */
const legacySizes: Record<string, "small" | "medium" | "large"> = {
  sm: "small",
  default: "medium",
  lg: "large",
};

/** Package-internal: a size in the kit's words, the deprecated spellings read as their new ones. */
export function toggleSizeWord(size: ToggleSize | null | undefined) {
  if (size === null || size === undefined) return undefined;
  return legacySizes[size] ?? (size as "small" | "medium" | "large");
}

export type ToggleStyleProps = {
  /** `default` is unbordered; `outline` draws a border. */
  variant?: "default" | "outline" | null | undefined;
  /**
   * `small` 28px, `medium` 32px (the default) or `large` 36px, Button's heights. `sm`, `default`
   * and `lg` are the deprecated spellings of `small`, `medium` and `large`.
   */
  size?: ToggleSize | null | undefined;
};

/** The shared styling recipe of Toggle and ToggleGroupItem. */
export function toggleVariants({
  variant,
  size,
  className,
}: ToggleStyleProps & { className?: string | undefined } = {}) {
  return cn(toggleRecipe({ variant, size: toggleSizeWord(size) ?? "medium" }), className);
}

export type ToggleProps<Value extends string = string> = TogglePrimitive.Props<Value> &
  ToggleStyleProps;

export function Toggle<Value extends string = string>({
  className,
  variant = "default",
  size: sizeProp = "medium",
  ...props
}: ToggleProps<Value>) {
  const size = toggleSizeWord(sizeProp) ?? "medium";
  return (
    <TogglePrimitive
      {...props}
      data-slot="toggle"
      data-size={size}
      className={classes(toggleVariants({ variant, size }), className)}
    />
  );
}
