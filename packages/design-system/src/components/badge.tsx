import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ComponentProps,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { toneClasses, type Tone } from "../lib/status-tone";
import { Truncate } from "./truncate";

export { toneClasses, tones, type Tone } from "../lib/status-tone";

type BadgeTone = Tone | "brand";
type BadgeAppearance = "subtle" | "bold";

/* A badge that is a link or a button takes a 24px hit area on a touch screen and stops clipping, so
   the area can reach past the pill. A label badge stays unpositioned. Every hover below is scoped
   to a link or a button in the same way, so a label badge never answers the pointer. */
const interactiveBadge =
  "[a]:relative [a]:touch-target [a]:overflow-visible [button]:relative [button]:touch-target [button]:overflow-visible";

const badgeRecipe = cva(
  cn(
    "group/badge inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-050 overflow-hidden rounded-full border-w-default border-solid border-transparent font-medium whitespace-nowrap transition-all duration-fast ease-standard focus-visible:border-focused focus-visible:outline-focused aria-invalid:border-danger aria-invalid:outline-danger! [&>svg]:pointer-events-none [&>svg]:size-150!",
    interactiveBadge,
  ),
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "",
        ghost: "",
        link: "underline-offset-4 [a]:hover:underline [button]:hover:underline",
      },
      size: {
        small:
          "h-250 px-100 py-025 font-body-small has-data-[icon=inline-end]:pe-075 has-data-[icon=inline-start]:ps-075",
        xsmall:
          "h-200 px-050 py-0 font-body-xsmall has-data-[icon=inline-end]:pe-050 has-data-[icon=inline-start]:ps-050",
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
  // The brand hovers draw their words in text.selected: text.brand on the hovered brand fill is
  // 4.18:1, under the 4.5 a label needs.
  brand: {
    subtle: "bg-brand-subtlest text-brand",
    bold: "bg-brand-bold text-inverse",
    text: "text-brand",
    border: "border-brand",
    subtleLinkHover:
      "[a]:hover:bg-brand-subtlest-hovered [a]:hover:text-selected [button]:hover:bg-brand-subtlest-hovered [button]:hover:text-selected",
    boldLinkHover: "[a]:hover:bg-brand-bold-hovered [button]:hover:bg-brand-bold-hovered",
    outlineLinkHover:
      "[a]:hover:bg-brand-subtlest-hovered [a]:hover:text-selected [button]:hover:bg-brand-subtlest-hovered [button]:hover:text-selected",
    ghostHover:
      "[a]:hover:bg-brand-subtlest-hovered [a]:hover:text-selected [button]:hover:bg-brand-subtlest-hovered [button]:hover:text-selected",
  },
  neutral: {
    ...toneClasses.neutral,
    border: "border-default",
    subtleLinkHover: "[a]:hover:bg-neutral-hovered [button]:hover:bg-neutral-hovered",
    boldLinkHover: "[a]:hover:bg-neutral-bold-hovered [button]:hover:bg-neutral-bold-hovered",
    outlineLinkHover:
      "[a]:hover:bg-neutral [a]:hover:text-subtle [button]:hover:bg-neutral [button]:hover:text-subtle",
    ghostHover:
      "[a]:hover:bg-neutral [a]:hover:text-subtle [button]:hover:bg-neutral [button]:hover:text-subtle",
  },
  information: {
    ...toneClasses.information,
    border: "border-information",
    subtleLinkHover: "[a]:hover:bg-information-hovered [button]:hover:bg-information-hovered",
    boldLinkHover:
      "[a]:hover:bg-information-bold-hovered [button]:hover:bg-information-bold-hovered",
    outlineLinkHover: "[a]:hover:bg-information-hovered [button]:hover:bg-information-hovered",
    ghostHover: "[a]:hover:bg-information-hovered [button]:hover:bg-information-hovered",
  },
  success: {
    ...toneClasses.success,
    border: "border-success",
    subtleLinkHover: "[a]:hover:bg-success-hovered [button]:hover:bg-success-hovered",
    boldLinkHover: "[a]:hover:bg-success-bold-hovered [button]:hover:bg-success-bold-hovered",
    outlineLinkHover: "[a]:hover:bg-success-hovered [button]:hover:bg-success-hovered",
    ghostHover: "[a]:hover:bg-success-hovered [button]:hover:bg-success-hovered",
  },
  warning: {
    ...toneClasses.warning,
    border: "border-warning",
    subtleLinkHover: "[a]:hover:bg-warning-hovered [button]:hover:bg-warning-hovered",
    boldLinkHover: "[a]:hover:bg-warning-bold-hovered [button]:hover:bg-warning-bold-hovered",
    outlineLinkHover: "[a]:hover:bg-warning-hovered [button]:hover:bg-warning-hovered",
    ghostHover: "[a]:hover:bg-warning-hovered [button]:hover:bg-warning-hovered",
  },
  danger: {
    ...toneClasses.danger,
    border: "border-danger",
    subtleLinkHover: "[a]:hover:bg-danger-hovered [button]:hover:bg-danger-hovered",
    boldLinkHover: "[a]:hover:bg-danger-bold-hovered [button]:hover:bg-danger-bold-hovered",
    outlineLinkHover: "[a]:hover:bg-danger-hovered [button]:hover:bg-danger-hovered",
    ghostHover: "[a]:hover:bg-danger-hovered [button]:hover:bg-danger-hovered",
  },
};

type BadgeRecipeProps = Omit<NonNullable<Parameters<typeof badgeRecipe>[0]>, "size" | "variant"> & {
  /** The treatment. `default`, the brand bold fill, when neither it nor `tone` is given; `secondary`, the subtle fill, when only `tone` is. */
  variant?: BadgeVariant | null | undefined;
  /** Small is 20px; xsmall is 16px for dense rows and tabs. */
  size?: "small" | "xsmall" | undefined;
  /** Overrides the variant's palette. Brand, or one of the five semantic status tones. */
  tone?: BadgeTone | undefined;
  /** Overrides the subtle or bold fill on default, secondary and destructive variants. */
  appearance?: BadgeAppearance | undefined;
};

/**
 * The treatment a badge takes: the given variant, or, when only a tone is given, `secondary`, the
 * subtle fill in that tone, so `<Badge tone="warning">` is a status and not a loud bold pill.
 * Without either it is `default`, the brand bold fill.
 */
function resolveVariant(variant: BadgeVariant | null | undefined, tone: BadgeTone | undefined) {
  if (variant === null) return null;
  return variant ?? (tone === undefined ? "default" : "secondary");
}

/** One recipe for treatment, palette, emphasis and density, also usable on a native element. */
function badgeVariants({
  variant: variantProp,
  size = "small",
  tone,
  appearance,
  className,
  class: classProp,
}: BadgeRecipeProps = {}) {
  const variant = resolveVariant(variantProp, tone);
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

/* The words in the pill. A pill narrower than its words (a status column, a narrow panel) cuts
   them with an ellipsis, and the whole shows on hover and on keyboard focus of a badge that links,
   while they are cut; the words stay whole in the DOM for a screen reader. Icons stay direct
   children, so their position selectors keep working. A badge with a title of its own shows that
   instead. */
function badgeText(content: ReactNode, reveal: boolean): ReactNode {
  const wrap = (text: string, key?: string) =>
    reveal ? (
      <Truncate key={key} render={<span />}>
        {text}
      </Truncate>
    ) : (
      <span key={key} className="min-w-0 truncate">
        {text}
      </span>
    );
  if (typeof content === "string" || typeof content === "number") return wrap(String(content));
  if (!Array.isArray(content)) return content;
  const out: ReactNode[] = [];
  let run = "";
  let runs = 0;
  const flush = () => {
    // Whitespace alone between two icons is no text, as it is no flex item without the wrapper.
    if (run.trim()) out.push(wrap(run, `badge-text-${runs++}`));
    run = "";
  };
  for (const child of Children.toArray(content)) {
    if (typeof child === "string" || typeof child === "number") run += String(child);
    else {
      flush();
      out.push(child);
    }
  }
  flush();
  return out;
}

export type BadgeProps = useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    /** An optional leading icon. Explicit icon children and their position attributes also work. */
    icon?: ReactNode;
  };

/** A compact label with standard variants, semantic palettes and native render composition. */
function Badge({
  className,
  variant: variantProp,
  tone,
  appearance,
  size = "small",
  icon,
  children,
  render,
  ...props
}: BadgeProps) {
  const variant = resolveVariant(variantProp, tone);
  const defaults = variantDefaults[variant ?? "default"];
  const resolvedTone = tone ?? defaults.tone;
  const resolvedAppearance = appearance ?? defaults.appearance;
  const leadingIcon =
    isValidElement<{ "data-icon"?: string }>(icon) && icon.type !== Fragment
      ? cloneElement(icon, { "data-icon": "inline-start" })
      : icon;
  const hasIcon = icon != null && typeof icon !== "boolean";
  const renderElement = isValidElement<{ children?: ReactNode }>(render) ? render : null;
  const content = badgeText(
    children === undefined ? renderElement?.props.children : children,
    props.title === undefined,
  );
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

export type CountProps = Omit<ComponentProps<"span">, "children" | "className"> & {
  /** The number. Anything above `max` renders as `max+`; a string renders as given. */
  value: number | string;
  /** The ceiling, 99 by default: the pill never grows past three characters and a plus. */
  max?: number | undefined;
  /** `default` is the neutral pill; `primary` the brand fill for the one count that must be seen; `important` the danger fill for what needs attention now; `added` and `removed` for a diff. */
  appearance?: keyof typeof countAppearances | undefined;
  className?: string | undefined;
};

/** The sign an added or a removed count carries, so the two differ by more than their fill: "+12", "−3" (U+2212). */
const countSigns: Partial<Record<keyof typeof countAppearances, string>> = {
  added: "+",
  removed: "\u2212",
};

/** A number in a pill: unread items, rows in a group, results behind a filter. It is named by the label beside it. A number reads in the reader's locale; an added or removed count carries its sign. Native span props and the ref reach the pill. */
export function Count({ value, max = 99, appearance = "default", className, ...rest }: CountProps) {
  const { formatNumber } = useLedgerLocale();
  const number =
    typeof value === "number"
      ? value > max
        ? `${formatNumber(max)}+`
        : formatNumber(value)
      : String(value);
  const sign = countSigns[appearance];
  const text = sign && !/^[+\-\u2212]/.test(number) ? `${sign}${number}` : number;
  return (
    <span
      {...rest}
      data-slot="count"
      data-appearance={appearance}
      className={cn(
        "inline-flex h-250 min-w-250 shrink-0 items-center justify-center rounded-full px-075 font-body-small font-medium tabular-nums",
        countAppearances[appearance],
        className,
      )}
    >
      {text}
    </span>
  );
}

export type DotProps = Omit<ComponentProps<"svg">, "children" | "className"> & {
  tone?: Tone | undefined;
  /** The status as a word ("Suspect"), read by a screen reader: with it the dot is an image named by the label; without it the dot is hidden and the text beside it carries the status. A sighted reader still sees colour alone, so a status shows its word beside the dot, or is an Indicator; the label is the last resort. */
  label?: string | undefined;
  className?: string | undefined;
};

/** A 6px status dot, the mark beside a status whose word is written next to it; never the status alone. It is an icon, so it takes the tone's icon colour, which is tuned to read at small sizes. Native svg props and the ref reach the dot. */
export function Dot({ tone = "neutral", label, className, ...rest }: DotProps) {
  return (
    <svg
      viewBox="0 0 8 8"
      {...rest}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-slot="dot"
      data-tone={tone}
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

export type IndicatorProps = Omit<ComponentProps<"span">, "children" | "className"> & {
  /** The severity or the health the Dot carries. `neutral` mutes the text as well: the lowest rung. */
  tone?: Tone | undefined;
  /** The word beside the Dot: "High", "Healthy", "Obligation not stated". It truncates when the row is narrower than it, and shows whole on hover while it is cut. */
  children: ReactNode;
  className?: string | undefined;
};

/** Severity or health as a Dot plus text. Never a pill, so the status column stays the only pill in a row. Native span props and the ref reach the outer span. */
export function Indicator({ tone = "neutral", className, children, ...rest }: IndicatorProps) {
  return (
    <span
      {...rest}
      data-slot="indicator"
      data-tone={tone}
      className={cn(
        "inline-flex max-w-full items-center gap-075 whitespace-nowrap font-body",
        tone === "neutral" ? "text-subtle" : "text-default",
        className,
      )}
    >
      <Dot tone={tone} />
      {/* A word cut by its column shows whole on hover while it is cut, as a Badge's does. */}
      <Truncate render={<span />}>{children}</Truncate>
    </span>
  );
}
