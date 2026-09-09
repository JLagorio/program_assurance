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

export function avatarInitials(name: string, count: 1 | 2 = 2) {
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
export function avatarHue(name: string): AvatarHue {
  let h = 0;
  for (const ch of name) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return hues[h % hues.length] ?? "blue";
}

/** The hue after this one in the ring: the far end of a gradient, always a neighbour so the blend stays clean. */
const after = (hue: AvatarHue): AvatarHue => hues[(hues.indexOf(hue) + 1) % hues.length] ?? "blue";

/** The neutral paint: the fill of a Badge with a hairline, so a person and a category read at the same weight. */
const neutral = "border border-default bg-neutral text-subtle";

const GroupContext = createContext(false);
const RootContext = createContext<{ size: AvatarSize; radius: string } | null>(null);

/** A 2px ring in the surface colour, so overlapping circles stay circles. */
const ring = { boxShadow: `0 0 0 2px ${token("elevation.surface")}` } as const;

export type AvatarProps = Primitive.Root.Props & {
  size?: AvatarSize | undefined;
  variant?: AvatarVariant | undefined;
  hue?: AvatarHue | undefined;
  shape?: "circle" | "square" | undefined;
};

/** Native img props and ref, and Base UI's `onLoadingStatusChange`. Rendered only once the photo has loaded. */
export type AvatarImageProps = Primitive.Image.Props;
/** Native span props and ref, and Base UI's `delay`. Shows caller-supplied initials or other fallback content while the photo loads or fails. */
export type AvatarFallbackProps = Primitive.Fallback.Props;
/** Native div props and ref target the +n circle. */
export type AvatarGroupCountProps = ComponentProps<"div">;
/** Native span props and ref target the mark on the circle's corner. */
export type AvatarBadgeProps = ComponentProps<"span"> & {
  /** What the mark says, in a status tone: `success` for present, `danger` for away, `neutral`, the default, for a mark that is not a status. */
  tone?: Tone | undefined;
};

export function AvatarImage({ className, alt = "", ...props }: AvatarImageProps) {
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

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  const root = useContext(RootContext);
  return (
    <Primitive.Fallback
      data-slot="avatar-fallback"
      className={classes(cn("flex size-full items-center justify-center", root?.radius), className)}
      {...props}
    >
      {children}
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
export function AvatarBadge({ tone = "neutral", className, style, ...props }: AvatarBadgeProps) {
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

/** Base UI image loading and composition, styled with Ledger sizes and accent treatments. */
export function Avatar({
  size = "small",
  variant = "neutral",
  hue = "blue",
  shape = "circle",
  className,
  style,
  ...props
}: AvatarProps) {
  const grouped = useContext(GroupContext);
  const s = sizes[size];
  const paint =
    variant === "tinted"
      ? tinted[hue]
      : variant === "bold"
        ? bold[hue]
        : variant === "gradient"
          ? "text-inverse"
          : neutral;
  const radius = shape === "circle" ? "rounded-full" : s.square;
  return (
    <RootContext.Provider value={{ size, radius }}>
      <Primitive.Root
        data-slot="avatar"
        data-size={size}
        data-variant={variant}
        data-shape={shape}
        className={(state) =>
          cn(
            "relative inline-flex shrink-0 select-none items-center justify-center",
            radius,
            s.box,
            s.type,
            state.imageLoadingStatus === "loaded" ? neutral : paint,
            typeof className === "function" ? className(state) : className,
          )
        }
        style={(state) => ({
          ...(grouped ? ring : {}),
          ...(grouped && variant === "neutral"
            ? { backgroundColor: token("elevation.surface.raised") }
            : {}),
          ...(variant === "gradient" && state.imageLoadingStatus !== "loaded"
            ? {
                backgroundImage: `linear-gradient(135deg, ${token(`color.background.accent.${hue}.bolder`)}, ${token(`color.background.accent.${after(hue)}.bolder`)})`,
              }
            : {}),
          ...(typeof style === "function" ? style(state) : style),
        })}
        {...props}
      />
    </RootContext.Provider>
  );
}

export type AvatarGroupProps = ComponentProps<"div">;
export function AvatarGroup({ className, ...props }: AvatarGroupProps) {
  return (
    <GroupContext.Provider value={true}>
      <div
        data-slot="avatar-group"
        className={cn(
          // eslint-disable-next-line ledger/no-margin -- Overlap is the geometry of an avatar group.
          "group/avatar-group flex items-center [&>*+*]:-ms-075",
          className,
        )}
        {...props}
      />
    </GroupContext.Provider>
  );
}
export function AvatarGroupCount({ className, style, ...props }: AvatarGroupCountProps) {
  return (
    <div
      data-slot="avatar-group-count"
      style={{ ...ring, ...style }}
      className={cn(
        "relative flex size-300 shrink-0 items-center justify-center rounded-full bg-surface-raised font-body-xsmall text-subtle group-has-[[data-size=medium]]/avatar-group:size-400 [&>svg]:size-icon-small",
        className,
      )}
      {...props}
    />
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

/** A person's avatar and visible name, composed from the public parts. */
export function Person({ name, src, variant, className, ...props }: PersonProps) {
  return (
    <span
      data-slot="person"
      className={cn("flex min-w-0 items-center gap-075", className)}
      {...props}
    >
      <Avatar aria-hidden="true" size="xsmall" variant={variant} hue={avatarHue(name)}>
        {src && <AvatarImage src={src} />}
        <AvatarFallback>{avatarInitials(name, 1)}</AvatarFallback>
      </Avatar>
      <span className="truncate">{name}</span>
    </span>
  );
}
