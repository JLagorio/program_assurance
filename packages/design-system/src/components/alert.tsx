import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { createContext, useContext, type ComponentProps, type ComponentType } from "react";
import { cn } from "../lib/cn";
import { toneClasses, type Tone } from "./badge";

export type AlertProps = ComponentProps<"div"> & {
  /** shadcn's treatment: `default` is the neutral tone, `destructive` (or its Ledger spelling `danger`) the danger tone. */
  variant?: "default" | "destructive" | "danger" | undefined;
  /** Ledger visual meaning; overrides the variant's neutral/danger tone. It also picks the default role and AlertIcon's glyph. */
  tone?: Tone | undefined;
};

const AlertToneContext = createContext<Tone>("neutral");

/**
 * Inline feedback about a record or a region. The role follows the tone: a danger Alert is
 * `role="alert"`, announced at once; every other tone is `role="status"`, polite. Pass `role`
 * to choose another (`note` for static guidance) or `role={undefined}` for none.
 */
export function Alert({ className, variant = "default", tone, ...props }: AlertProps) {
  const danger = variant === "destructive" || variant === "danger";
  const resolvedTone = tone ?? (danger ? "danger" : "neutral");
  return (
    <AlertToneContext.Provider value={resolvedTone}>
      <div
        role={resolvedTone === "danger" ? "alert" : "status"}
        {...props}
        data-slot="alert"
        data-variant={danger ? "danger" : variant}
        data-tone={resolvedTone}
        className={cn(
          // The icon column sizes to content; it is structural, not a design-token dimension.
          "group/alert relative grid min-w-0 gap-075 rounded-medium px-150 py-100 text-start font-body has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-100 [&>svg]:row-span-2 [&>svg]:shrink-0 [&>svg:not([class*='size-'])]:size-icon-medium",
          toneClasses[resolvedTone].subtle,
          className,
        )}
      />
    </AlertToneContext.Provider>
  );
}

type AlertGlyph = ComponentType<ComponentProps<"svg">>;

const toneIcons: Record<Tone, AlertGlyph> = {
  neutral: Info,
  information: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

export type AlertIconProps = ComponentProps<"svg"> & {
  /** The glyph, a Lucide icon or any svg component. Unset, the Alert's tone picks it: Info, CircleCheck, TriangleAlert or CircleAlert, the same as Banner's and the toast list's. */
  icon?: AlertGlyph | undefined;
};

/* The icon's colour on the Alert's fill. A neutral Alert's text is color.text.subtle, and its icon
   is color.icon.subtle beside it: the neutral tone's own icon, color.icon.subtlest, drops under 3:1
   on the neutral fill under increased contrast. */
const iconClass = (tone: Tone) => (tone === "neutral" ? "icon-subtle" : toneClasses[tone].icon);

/** The tone's icon, first in the Alert, so the severity is carried by a shape as well as a colour. Decorative. */
export function AlertIcon({ icon, className, ...props }: AlertIconProps) {
  const tone = useContext(AlertToneContext);
  const Glyph = icon ?? toneIcons[tone];
  return (
    <Glyph
      aria-hidden
      {...props}
      data-slot="alert-icon"
      className={cn("size-icon-medium", iconClass(tone), className)}
    />
  );
}

export type AlertTitleProps = ComponentProps<"div">;
/* An unbroken code, hash or underscored name breaks where it must (`overflow-wrap: anywhere`), in
   the title and the description alike, so it wraps inside the Alert instead of widening the page. */
const WRAP = { overflowWrap: "anywhere" } as const;

export function AlertTitle({ className, style, ...props }: AlertTitleProps) {
  return (
    <div
      {...props}
      data-slot="alert-title"
      className={cn(
        "flex min-w-0 items-start gap-100 font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-2",
        className,
      )}
      style={{ ...WRAP, ...style }}
    />
  );
}

export type AlertDescriptionProps = ComponentProps<"div">;
export function AlertDescription({ className, style, ...props }: AlertDescriptionProps) {
  return (
    <div
      {...props}
      data-slot="alert-description"
      className={cn(
        "min-w-0 group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-2",
        className,
      )}
      style={{ ...WRAP, ...style }}
    />
  );
}

/** The way out: a TextLink to where it is fixed, or a small Button that fixes it. Links are underlined, as in the title and description. Kept in normal flow so long recovery links fit narrow panels. */
export type AlertActionProps = ComponentProps<"div">;
export function AlertAction({ className, ...props }: AlertActionProps) {
  return (
    <div
      {...props}
      data-slot="alert-action"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-100 group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-2",
        className,
      )}
    />
  );
}
