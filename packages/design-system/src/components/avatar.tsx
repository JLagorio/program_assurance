import { Avatar as Primitive } from "@base-ui/react/avatar";
import { createContext, useContext, type ComponentProps } from "react";

import { token } from "../generated/tokens";
import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "./badge";

/* The circle is a mark that a person is meant: initials by default, a photo when there is one, in
   five sizes. Colour is opt-in. Neutral is the default so a person never reads as a status; tinted,
   bold and gradient take a hue from the name, stable per person, from the accent colours, which
   carry no meaning. Base UI's Avatar underneath tracks the photo: the initials hold the circle until
   it has loaded, and return if it fails. A Badge is a mark on the circle's corner, in a status tone. */

function initials(name: string, count: 1 | 2) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  if (count === 1) return first.toUpperCase();
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export type AvatarSize = "xsmall" | "small" | "medium" | "large" | "xlarge";

const sizes: Record<AvatarSize, { box: string; type: string; initials: 1 | 2; square: string }> = {
  xsmall: {
    box: "size-200",
    type: "font-body-xsmall font-medium",
    initials: 1,
    square: "rounded-xsmall",
  },
  small: {
    box: "size-300",
    type: "font-body-xsmall font-medium",
    initials: 2,
    square: "rounded-small",
  },
  medium: { box: "size-400", type: "font-body font-medium", initials: 2, square: "rounded-medium" },
  large: {
    box: "size-500",
    type: "font-body-large font-medium",
    initials: 2,
    square: "rounded-medium",
  },
  xlarge: { box: "size-800", type: "font-heading-medium", initials: 2, square: "rounded-large" },
};

const hues = ["blue", "teal", "green", "orange", "red", "purple"] as const;

export type AvatarHue = (typeof hues)[number];

export type AvatarVariant = "neutral" | "tinted" | "bold" | "gradient";

const tinted: Record<AvatarHue, string> = {
  blue: "bg-accent-blue-subtler text-accent-blue",
  teal: "bg-accent-teal-subtler text-accent-teal",
  green: "bg-accent-green-subtler text-accent-green",
  orange: "bg-accent-orange-subtler text-accent-orange",
  red: "bg-accent-red-subtler text-accent-red",
  purple: "bg-accent-purple-subtler text-accent-purple",
};

const bold: Record<AvatarHue, string> = {
  blue: "bg-accent-blue-bolder text-inverse",
  teal: "bg-accent-teal-bolder text-inverse",
  green: "bg-accent-green-bolder text-inverse",
  orange: "bg-accent-orange-bolder text-inverse",
  red: "bg-accent-red-bolder text-inverse",
  purple: "bg-accent-purple-bolder text-inverse",
};

/** A stable hue from the name, so one person is the same colour everywhere they appear. */
function hueOf(name: string): AvatarHue {
  let h = 0;
  for (const ch of name) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return hues[h % hues.length] ?? "blue";
}

/** The hue after this one in the ring: the far end of a gradient, always a neighbour so the blend stays clean. */
const after = (hue: AvatarHue): AvatarHue => hues[(hues.indexOf(hue) + 1) % hues.length] ?? "blue";

/** The neutral paint: the fill of a Badge with a hairline, so a person and a category read at the same weight. */
const neutral = "border border-default bg-neutral text-subtle";

/** What the root tells its parts: the name the initials come from and how many fit, the size for a Badge, the radius for a photo. */
const RootContext = createContext<{
  name: string;
  initials: 1 | 2;
  size: AvatarSize;
  radius: string;
} | null>(null);

export type AvatarStackSize = "small" | "medium";

/** What a stack tells the circles inside it: their size and treatment, and whether the group is already named. */
const StackContext = createContext<{
  size: AvatarStackSize;
  variant: AvatarVariant;
  named: boolean;
} | null>(null);

/** A 2px ring in the surface colour, so overlapping circles stay circles. */
const ring = { boxShadow: `0 0 0 2px ${token("elevation.surface")}` } as const;

/** The neutral fill is a translucent wash, so in a stack it is laid over the opaque surface colour: the circle before shows through nothing. */
const backed = {
  backgroundColor: token("elevation.surface"),
  backgroundImage: `linear-gradient(${token("color.background.neutral")}, ${token("color.background.neutral")})`,
} as const;

export type AvatarProps = ComponentProps<"span"> & {
  /** The person's full name. The initials, the hue and the accessible name come from it. */
  name: string;
  /** A photo, as the shorthand for an `Avatar.Image`. The initials hold the circle until it loads, and return if it fails. */
  src?: string | undefined;
  /** `xsmall` is 16px and one initial, beside a name; `small` is 24px, the default, alone in a header or a stack; `medium` is 32px, in a comment or a card; `large` is 40px, in a profile row; `xlarge` is 64px, on a profile page. Inside a stack, the stack's size. */
  size?: AvatarSize | undefined;
  /** `neutral`, the default, is the grey mark: a person never reads as a status. `tinted`, `bold` and `gradient` take a hue from the name, stable per person, from the accent colours, which carry no meaning. Inside a stack, the stack's treatment. */
  variant?: AvatarVariant | undefined;
  /** Pins the hue instead of drawing it from the name: a system's mark, a team's colour. */
  hue?: AvatarHue | undefined;
  /** `circle` for a person, the default; `square` for a thing: a system, a program, a team. */
  shape?: "circle" | "square" | undefined;
  /** The name is written beside it (Person) or the group is named (a labelled Avatar.Stack): hide the avatar from a screen reader so the name is read once. */
  isDecorative?: boolean | undefined;
};

/** Native img props and ref, and Base UI's `onLoadingStatusChange`. Rendered only once the photo has loaded. */
export type AvatarImageProps = Primitive.Image.Props;
/** Native span props and ref, and Base UI's `delay`. Shown until the photo has loaded, and when it fails; the initials when it has no children. */
export type AvatarFallbackProps = Primitive.Fallback.Props;
/** Native span props and ref target the +n circle. */
export type AvatarCountProps = ComponentProps<"span">;
/** Native span props and ref target the mark on the circle's corner. */
export type AvatarBadgeProps = ComponentProps<"span"> & {
  /** What the mark says, in a status tone: `success` for present, `danger` for away, `neutral`, the default, for a mark that is not a status. */
  tone?: Tone | undefined;
};

function AvatarImage({ className, alt = "", ...props }: AvatarImageProps) {
  const root = useContext(RootContext);
  return (
    <Primitive.Image
      data-slot="avatar-image"
      alt={alt}
      className={classes(cn("size-full object-cover", root?.radius), className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  const root = useContext(RootContext);
  return (
    <Primitive.Fallback
      data-slot="avatar-fallback"
      className={classes(cn("flex size-full items-center justify-center", root?.radius), className)}
      {...props}
    >
      {children ?? (root ? initials(root.name, root.initials) : null)}
    </Primitive.Fallback>
  );
}

/** The Badge at each size: its box, and whether an icon fits in it. */
const badgeSizes: Record<AvatarSize, string> = {
  xsmall: "size-075 [&>svg]:hidden",
  small: "size-100 [&>svg]:hidden",
  medium: "size-150 [&>svg]:size-100",
  large: "size-150 [&>svg]:size-100",
  xlarge: "size-200 [&>svg]:size-150",
};

/** A mark on the circle's corner: a dot in a status tone, or an icon in it from `medium` up. Ringed in the surface colour, so it reads as sitting on the circle. */
function AvatarBadge({ tone = "neutral", className, style, ...props }: AvatarBadgeProps) {
  const root = useContext(RootContext);
  const size = root?.size ?? "small";
  return (
    <span
      data-slot="avatar-badge"
      data-tone={tone}
      data-size={size}
      style={{ ...ring, ...style }}
      className={cn(
        "absolute end-0 bottom-0 z-10 inline-flex shrink-0 select-none items-center justify-center rounded-full [&>svg]:shrink-0",
        toneClasses[tone].bold,
        badgeSizes[size],
        className,
      )}
      {...props}
    />
  );
}

/** Initials, or a photo, in a circle named by the full name. */
function AvatarRoot({
  name,
  src,
  size,
  variant,
  hue,
  shape = "circle",
  isDecorative,
  className,
  style,
  children,
  role,
  title,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  ...props
}: AvatarProps) {
  const stack = useContext(StackContext);
  const resolvedSize: AvatarSize = size ?? stack?.size ?? "small";
  const resolvedVariant = variant ?? stack?.variant ?? "neutral";
  const decorative = isDecorative ?? stack?.named ?? false;
  const s = sizes[resolvedSize];
  const h = hue ?? hueOf(name);
  const paint =
    resolvedVariant === "tinted"
      ? tinted[h]
      : resolvedVariant === "bold"
        ? bold[h]
        : resolvedVariant === "gradient"
          ? "text-inverse"
          : neutral;
  const gradient =
    resolvedVariant === "gradient"
      ? {
          backgroundImage: `linear-gradient(135deg, ${token(`color.background.accent.${h}.bolder`)}, ${token(`color.background.accent.${after(h)}.bolder`)})`,
        }
      : undefined;
  const radius = shape === "circle" ? "rounded-full" : s.square;
  return (
    <RootContext.Provider value={{ name, initials: s.initials, size: resolvedSize, radius }}>
      <Primitive.Root
        data-slot="avatar"
        data-size={resolvedSize}
        data-variant={resolvedVariant}
        data-shape={shape}
        role={role ?? (decorative ? undefined : "img")}
        aria-label={ariaLabel ?? (decorative ? undefined : name)}
        aria-hidden={ariaHidden ?? (decorative || undefined)}
        title={title ?? name}
        style={(state) => {
          const loaded = state.imageLoadingStatus === "loaded";
          return {
            ...(stack ? ring : undefined),
            ...(stack && (loaded || resolvedVariant === "neutral") ? backed : undefined),
            ...(loaded ? undefined : gradient),
            ...style,
          };
        }}
        className={(state) =>
          cn(
            // No overflow clipping: the photo and the fallback carry the radius, so a Badge can sit on the corner.
            "relative inline-flex shrink-0 select-none items-center justify-center",
            radius,
            s.box,
            s.type,
            // A loaded photo sits on the neutral circle with its hairline; the treatment is the fallback's.
            state.imageLoadingStatus === "loaded" ? neutral : paint,
            className,
          )
        }
        {...props}
      >
        {children !== undefined ? (
          children
        ) : (
          <>
            {src ? <AvatarImage src={src} /> : null}
            <AvatarFallback />
          </>
        )}
      </Primitive.Root>
    </RootContext.Provider>
  );
}

export type PersonProps = Omit<ComponentProps<"span">, "children"> & {
  /** The person's full name, written beside the avatar. */
  name: string;
  /** The person's photo, if there is one. */
  src?: string | undefined;
  /** The avatar's colour treatment; `neutral` by default. */
  variant?: AvatarVariant | undefined;
};

/** An Avatar with the name beside it: how a person is written in a row, a fact or a rail. */
export function Person({ name, src, variant, className, ...props }: PersonProps) {
  return (
    <StackContext.Provider value={null}>
      <span
        data-slot="person"
        className={cn("flex min-w-0 items-center gap-075", className)}
        {...props}
      >
        <Avatar name={name} src={src} variant={variant} size="xsmall" isDecorative />
        <span className="truncate">{name}</span>
      </span>
    </StackContext.Provider>
  );
}

/** One person in a stack: a name, or a name with a photo. */
export type AvatarStackPerson = string | { name: string; src?: string | undefined };

export type AvatarStackProps = ComponentProps<"span"> & {
  /** The people, in order, as the shorthand: the group is named by all of them. Omit it and compose Avatars and an `Avatar.Count` as children. */
  names?: AvatarStackPerson[] | undefined;
  /** How many avatars to show before the rest fold into a +n, 4 by default. Shorthand only. */
  max?: number | undefined;
  /** `small` is 24px, the default; `medium` is 32px, on a profile or a card. Every circle and the +n take it. */
  size?: AvatarStackSize | undefined;
  /** The colour treatment of every circle; `neutral` by default. */
  variant?: AvatarVariant | undefined;
};

const stack: Record<AvatarStackSize, { overlap: string; more: string }> = {
  small: { overlap: "-space-x-050", more: "size-300 font-body-xsmall font-medium" },
  medium: { overlap: "-space-x-100", more: "size-400 font-body font-medium" },
};

/** The +n at the end of a stack: a neutral circle at the stack's size, holding what the caller writes in it. */
function AvatarCount({ className, style, ...props }: AvatarCountProps) {
  const inStack = useContext(StackContext);
  const size = inStack?.size ?? "small";
  return (
    <span
      data-slot="avatar-count"
      data-size={size}
      style={inStack ? { ...ring, ...backed, ...style } : style}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full",
        neutral,
        inStack && "relative",
        stack[size].more,
        className,
      )}
      {...props}
    />
  );
}

/**
 * Up to `max` avatars overlapping, then a +n. With `names`, a group named by every name, so the +n
 * hides no one from a screen reader. With children, the caller composes the circles and the count
 * and names the group with `aria-label`; the circles inside a named group are decorative.
 */
export function AvatarStack({
  names,
  max = 4,
  size = "small",
  variant = "neutral",
  className,
  children,
  role,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: AvatarStackProps) {
  const shorthand = children === undefined;
  const people = (names ?? []).map((p) => (typeof p === "string" ? { name: p } : p));
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  const label =
    ariaLabel ?? (shorthand && people.length ? people.map((p) => p.name).join(", ") : undefined);
  const named = label !== undefined || ariaLabelledBy !== undefined;
  return (
    <StackContext.Provider value={{ size, variant, named }}>
      <span
        data-slot="avatar-stack"
        data-size={size}
        role={role ?? "group"}
        aria-label={label}
        aria-labelledby={ariaLabelledBy}
        className={cn("flex items-center", stack[size].overlap, className)}
        {...props}
      >
        {shorthand ? (
          <>
            {shown.map((p, i) => (
              <Avatar key={`${i}-${p.name}`} name={p.name} src={p.src} />
            ))}
            {rest > 0 ? <AvatarCount aria-hidden>+{rest}</AvatarCount> : null}
          </>
        ) : (
          children
        )}
      </span>
    </StackContext.Provider>
  );
}

/** A person's mark, on Base UI's Avatar: the shorthand `name`/`src`, or `Avatar.Image` and `Avatar.Fallback` composed, with an `Avatar.Badge` on the corner; `Avatar.Stack` for the people on a thing and `Avatar.Count` for the rest of them. Native span props and the ref target the root. */
export const Avatar = Object.assign(AvatarRoot, {
  Image: AvatarImage,
  Fallback: AvatarFallback,
  Badge: AvatarBadge,
  Stack: AvatarStack,
  Count: AvatarCount,
});
