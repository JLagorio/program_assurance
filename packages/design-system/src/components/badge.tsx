import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import {
  cloneElement,
  Fragment,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "../lib/status-tone";

export { toneClasses, tones, type Tone } from "../lib/status-tone";

type BadgeTone = Tone | "brand";
type BadgeAppearance = "subtle" | "bold";

const badgeRecipe = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-050 overflow-hidden rounded-full border-w-default border-solid border-transparent font-medium whitespace-nowrap transition-all duration-fast ease-standard focus-visible:border-focused focus-visible:outline-focused aria-invalid:border-danger aria-invalid:outline-danger! [&>svg]:pointer-events-none [&>svg]:size-150!",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "",
        ghost: "",
        link: "underline-offset-4 hover:underline",
      },
      size: {
        small:
          "h-250 px-100 py-025 font-body-small has-data-[icon=inline-end]:pr-075 has-data-[icon=inline-start]:pl-075",
        xsmall:
          "h-200 px-050 py-0 font-body-xsmall has-data-[icon=inline-end]:pr-050 has-data-[icon=inline-start]:pl-050",
      },
    },
    defaultVariants: { variant: "default", size: "small" },
  },
);

type BadgeVariant = NonNullable<VariantProps<typeof badgeRecipe>["variant"]>;

const variantDefaults: Record<BadgeVariant, { tone: BadgeTone; appearance: BadgeAppearance }> = {
  default: { tone: "brand", appearance: "bold" },
  secondary: { tone: "neutral", appearance: "subtle" },
  destructive: { tone: "danger", appearance: "subtle" },
  outline: { tone: "neutral", appearance: "subtle" },
  ghost: { tone: "neutral", appearance: "subtle" },
  link: { tone: "brand", appearance: "subtle" },
};

const badgePalette: Record<
  BadgeTone,
  {
    subtle: string;
    bold: string;
    text: string;
    border: string;
    subtleLinkHover: string;
    boldLinkHover: string;
    outlineLinkHover: string;
    ghostHover: string;
  }
> = {
  brand: {
    subtle: "bg-brand-subtlest text-brand",
    bold: "bg-brand-bold text-inverse",
    text: "text-brand",
    border: "border-brand",
    subtleLinkHover: "[a]:hover:bg-brand-subtlest-hovered",
    boldLinkHover: "[a]:hover:bg-brand-bold-hovered",
    outlineLinkHover: "[a]:hover:bg-brand-subtlest-hovered",
    ghostHover: "hover:bg-brand-subtlest-hovered",
  },
  neutral: {
    ...toneClasses.neutral,
    border: "border-default",
    subtleLinkHover: "[a]:hover:bg-neutral-hovered",
    boldLinkHover: "[a]:hover:bg-neutral-bold-hovered",
    outlineLinkHover: "[a]:hover:bg-neutral [a]:hover:text-subtle",
    ghostHover: "hover:bg-neutral hover:text-subtle",
  },
  information: {
    ...toneClasses.information,
    border: "border-information",
    subtleLinkHover: "[a]:hover:bg-information-hovered",
    boldLinkHover: "[a]:hover:bg-information-bold-hovered",
    outlineLinkHover: "[a]:hover:bg-information-hovered",
    ghostHover: "hover:bg-information-hovered",
  },
  success: {
    ...toneClasses.success,
    border: "border-success",
    subtleLinkHover: "[a]:hover:bg-success-hovered",
    boldLinkHover: "[a]:hover:bg-success-bold-hovered",
    outlineLinkHover: "[a]:hover:bg-success-hovered",
    ghostHover: "hover:bg-success-hovered",
  },
  warning: {
    ...toneClasses.warning,
    border: "border-warning",
    subtleLinkHover: "[a]:hover:bg-warning-hovered",
    boldLinkHover: "[a]:hover:bg-warning-bold-hovered",
    outlineLinkHover: "[a]:hover:bg-warning-hovered",
    ghostHover: "hover:bg-warning-hovered",
  },
  danger: {
    ...toneClasses.danger,
    border: "border-danger",
    subtleLinkHover: "[a]:hover:bg-danger-hovered",
    boldLinkHover: "[a]:hover:bg-danger-bold-hovered",
    outlineLinkHover: "[a]:hover:bg-danger-hovered",
    ghostHover: "hover:bg-danger-hovered",
  },
};

type BadgeRecipeProps = Omit<NonNullable<Parameters<typeof badgeRecipe>[0]>, "size"> & {
  /** Small is 20px; xsmall is 16px for dense rows and tabs. */
  size?: "small" | "xsmall" | undefined;
  /** Overrides the variant's palette. Brand, or one of the five semantic status tones. */
  tone?: BadgeTone | undefined;
  /** Overrides the subtle or bold fill on default, secondary and destructive variants. */
  appearance?: BadgeAppearance | undefined;
};

/** One recipe for treatment, palette, emphasis and density, also usable on a native element. */
function badgeVariants({
  variant = "default",
  size = "small",
  tone,
  appearance,
  className,
  class: classProp,
}: BadgeRecipeProps = {}) {
  const defaults = variantDefaults[variant ?? "default"];
  const palette = badgePalette[tone ?? defaults.tone];
  const emphasis = appearance ?? defaults.appearance;
  const unfilledText = (tone ?? defaults.tone) === "neutral" ? "text-default" : palette.text;
  const paint =
    variant === null
      ? undefined
      : variant === "outline"
        ? cn(palette.border, unfilledText, palette.outlineLinkHover)
        : variant === "ghost"
          ? cn(unfilledText, palette.ghostHover)
          : variant === "link"
            ? palette.text
            : cn(
                palette[emphasis],
                emphasis === "bold" ? palette.boldLinkHover : palette.subtleLinkHover,
              );
  return cn(
    badgeRecipe({ variant, size }),
    paint,
    (tone ?? defaults.tone) === "danger" && "focus-visible:outline-danger!",
    classProp,
    className,
  );
}

export type BadgeProps = useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** An optional leading icon. Explicit icon children and their position attributes also work. */
    icon?: ReactNode;
  };

/** A compact label with standard variants, semantic palettes and native render composition. */
function Badge({
  className,
  variant = "default",
  tone,
  appearance,
  size = "small",
  icon,
  children,
  render,
  ...props
}: BadgeProps) {
  const defaults = variantDefaults[variant ?? "default"];
  const resolvedTone = tone ?? defaults.tone;
  const resolvedAppearance = appearance ?? defaults.appearance;
  const leadingIcon =
    isValidElement<{ "data-icon"?: string }>(icon) && icon.type !== Fragment
      ? cloneElement(icon, { "data-icon": "inline-start" })
      : icon;
  const hasIcon = icon != null && typeof icon !== "boolean";
  const renderElement = isValidElement<{ children?: ReactNode }>(render) ? render : null;
  const content = children === undefined ? renderElement?.props.children : children;
  const hasChildren = children !== undefined || hasIcon;
  const composedChildren = hasIcon ? (
    <>
      {leadingIcon}
      {content}
    </>
  ) : (
    content
  );
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: badgeVariants({ variant, tone, appearance, size, className }),
        ...(hasChildren ? { children: composedChildren } : {}),
      },
      props,
    ),
    render:
      renderElement && hasChildren
        ? cloneElement(renderElement, { children: composedChildren })
        : render,
    state: {
      slot: "badge",
      variant,
      tone: resolvedTone,
      appearance: resolvedAppearance,
      size,
    },
  });
}

export { Badge, badgeVariants };

const countAppearances = {
  default: "bg-neutral text-subtle",
  primary: "bg-brand-bold text-inverse",
  important: "bg-danger-bold text-inverse",
  added: "bg-success text-success",
  removed: "bg-danger text-danger",
} as const;

export type CountProps = {
  /** The number. Anything above `max` renders as `max+`; a string renders as given. */
  value: number | string;
  /** The ceiling, 99 by default: the pill never grows past three characters and a plus. */
  max?: number;
  /** `default` is the neutral pill; `primary` the brand fill for the one count that must be seen; `important` the danger fill for what needs attention now; `added` and `removed` for a diff. */
  appearance?: keyof typeof countAppearances;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className">;

/** A number in a pill: unread items, rows in a group, results behind a filter. It is named by the label beside it. */
export function Count({ value, max = 99, appearance = "default", className, ...rest }: CountProps) {
  const text = typeof value === "number" && value > max ? `${max}+` : String(value);
  return (
    <span
      className={cn(
        "inline-flex h-250 min-w-250 shrink-0 items-center justify-center rounded-full px-075 font-body-small font-medium tabular-nums",
        countAppearances[appearance],
        className,
      )}
      {...rest}
    >
      {text}
    </span>
  );
}

export type DotProps = {
  tone?: Tone | undefined;
  /** What the dot says when no text sits beside it: the status as a word ("Suspect", "No supplier attestation on file"). With it the dot is an image named by the label; without it the dot is hidden and the text beside it carries the status. */
  label?: string | undefined;
  className?: string | undefined;
};

/** A 6px status dot. It is an icon, so it takes the tone's icon colour, which is tuned to read at small sizes. */
export function Dot({ tone = "neutral", label, className }: DotProps) {
  return (
    <svg
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      viewBox="0 0 8 8"
      className={cn(
        "inline-block size-075 shrink-0 align-middle",
        toneClasses[tone].icon,
        className,
      )}
    >
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  );
}

export type IndicatorProps = {
  /** The severity or the health the Dot carries. `neutral` mutes the text as well: the lowest rung. */
  tone?: Tone | undefined;
  /** The word beside the Dot: "High", "Healthy", "Obligation not stated". It truncates when the row is narrower than it. */
  children: ReactNode;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"span">, "children" | "className">;

/** Severity or health as a Dot plus text. Never a pill, so the status column stays the only pill in a row. */
export function Indicator({ tone = "neutral", className, children, ...rest }: IndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-075 whitespace-nowrap font-body",
        tone === "neutral" ? "text-subtle" : "text-default",
        className,
      )}
      {...rest}
    >
      <Dot tone={tone} />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
