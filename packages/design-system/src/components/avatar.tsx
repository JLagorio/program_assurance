import { useState, type CSSProperties } from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";

/* Reference material. The circle is a mark that a person is meant: initials by default, a photo when
   there is one, in five sizes. Colour is opt-in. Neutral is the default so a person never reads as a
   status; tinted, bold and gradient take a hue from the name, stable per person, from the accent
   colours, which carry no meaning. */

function initials(name: string, count: 1 | 2) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  if (count === 1) return first.toUpperCase();
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

const sizes = {
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
} as const;

export type AvatarSize = keyof typeof sizes;

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

export type AvatarProps = {
  /** The person's full name. The initials, the hue and the accessible name come from it. */
  name: string;
  /** A photo. It fills the circle; the initials return if it fails to load. */
  src?: string | undefined;
  /** `xsmall` is 16px and one initial, beside a name; `small` is 24px, the default, alone in a header or a stack; `medium` is 32px, in a comment or a card; `large` is 40px, in a profile row; `xlarge` is 64px, on a profile page. */
  size?: AvatarSize | undefined;
  /** `neutral`, the default, is the grey mark: a person never reads as a status. `tinted`, `bold` and `gradient` take a hue from the name, stable per person, from the accent colours, which carry no meaning. */
  variant?: AvatarVariant | undefined;
  /** Pins the hue instead of drawing it from the name: a system's mark, a team's colour. */
  hue?: AvatarHue | undefined;
  /** `circle` for a person, the default; `square` for a thing: a system, a program, a team. */
  shape?: "circle" | "square" | undefined;
  /** The name is written beside it (Person) or the group is named (Avatar.Stack): hide the avatar from a screen reader so the name is read once. */
  isDecorative?: boolean | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
};

/** Initials, or a photo, in a circle named by the full name. */
function AvatarRoot({
  name,
  src,
  size = "small",
  variant = "neutral",
  hue,
  shape = "circle",
  isDecorative,
  className,
  style,
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const photo = src && failedSrc !== src ? src : null;
  const s = sizes[size];
  const h = hue ?? hueOf(name);
  const paint = photo
    ? "border border-default bg-neutral"
    : variant === "tinted"
      ? tinted[h]
      : variant === "bold"
        ? bold[h]
        : variant === "gradient"
          ? "text-inverse"
          : "border border-default bg-neutral text-subtle";
  const gradient =
    !photo && variant === "gradient"
      ? {
          backgroundImage: `linear-gradient(135deg, ${token(`color.background.accent.${h}.bolder`)}, ${token(`color.background.accent.${after(h)}.bolder`)})`,
        }
      : {};
  return (
    <span
      role={isDecorative ? undefined : "img"}
      aria-label={isDecorative ? undefined : name}
      aria-hidden={isDecorative || undefined}
      title={name}
      style={{ ...gradient, ...style }}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden",
        shape === "circle" ? "rounded-full" : s.square,
        s.box,
        s.type,
        paint,
        className,
      )}
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedSrc(photo)}
        />
      ) : (
        initials(name, s.initials)
      )}
    </span>
  );
}

export type PersonProps = {
  /** The person's full name, written beside the avatar. */
  name: string;
  /** The person's photo, if there is one. */
  src?: string | undefined;
  /** The avatar's colour treatment; `neutral` by default. */
  variant?: AvatarVariant | undefined;
  className?: string | undefined;
};

/** An Avatar with the name beside it: how a person is written in a row, a fact or a rail. */
export function Person({ name, src, variant, className }: PersonProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-075", className)}>
      <Avatar name={name} src={src} variant={variant} size="xsmall" isDecorative />
      <span className="truncate">{name}</span>
    </span>
  );
}

/** One person in a stack: a name, or a name with a photo. */
export type AvatarStackPerson = string | { name: string; src?: string | undefined };

export type AvatarStackProps = {
  /** The people, in order. The group is named by all of them. */
  names: AvatarStackPerson[];
  /** How many avatars to show before the rest fold into a +n, 4 by default. */
  max?: number | undefined;
  /** `small` is 24px, the default; `medium` is 32px, on a profile or a card. */
  size?: "small" | "medium" | undefined;
  /** The colour treatment of every circle; `neutral` by default. */
  variant?: AvatarVariant | undefined;
};

const stack = {
  small: { overlap: "-space-x-050", more: "size-300 font-body-xsmall font-medium" },
  medium: { overlap: "-space-x-100", more: "size-400 font-body font-medium" },
} as const;

/** A 2px ring in the surface colour, so overlapping circles stay circles. */
const ring = { boxShadow: `0 0 0 2px ${token("elevation.surface")}` } as const;

/** Up to `max` avatars overlapping, then a +n. A group named by every name, so the +n hides no one from a screen reader. */
export function AvatarStack({
  names,
  max = 4,
  size = "small",
  variant = "neutral",
}: AvatarStackProps) {
  const people = names.map((p) => (typeof p === "string" ? { name: p } : p));
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span
      role="group"
      aria-label={people.map((p) => p.name).join(", ")}
      className={cn("flex items-center", stack[size].overlap)}
    >
      {shown.map((p) => (
        <Avatar
          key={p.name}
          name={p.name}
          src={p.src}
          size={size}
          variant={variant}
          isDecorative
          className="relative"
          style={ring}
        />
      ))}
      {rest > 0 ? (
        <span
          aria-hidden
          style={ring}
          className={cn(
            "relative inline-flex items-center justify-center rounded-full border border-default bg-neutral text-subtle",
            stack[size].more,
          )}
        >
          +{rest}
        </span>
      ) : null}
    </span>
  );
}

export const Avatar = Object.assign(AvatarRoot, { Stack: AvatarStack });
