import { Link } from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { Children, useState } from "react";
import { ChevronDown, ChevronLeft, Eye, Search } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
type ButtonSize = "xs" | "sm" | "md";

const buttonBase =
  "inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-[box-shadow,background-color,color] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-button-primary hover:bg-primary-hover",
  secondary: "bg-card text-foreground shadow-button hover:bg-surface-hover",
  ghost: "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
  danger: "bg-danger text-primary-foreground shadow-button-primary hover:bg-danger-hover",
  link: "text-primary hover:underline underline-offset-2 decoration-primary/40",
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: "h-6 px-2 text-12",
  sm: "h-7 px-2.5 text-13",
  md: "h-8 px-3 text-13",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        buttonBase,
        buttonVariants[variant],
        variant === "link" ? "h-auto px-0 text-[13px]" : buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={cn(
        buttonBase,
        "size-7 shrink-0 text-muted-foreground shadow-button hover:bg-subtle hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------- Badge */

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

/* One tone table for every status primitive (Badge, Dot, Meter, StackedBar).
   `text` and `fill` are the solid token; `soft` is the tinted surface a Badge
   sits on. Neutral has no solid token: fills use one alpha of muted-foreground
   and the dot one step darker so it still reads at 6px. Info stays on `info`,
   not `primary`, so data bars do not spend the blue budget. */
const toneClasses: Record<Tone, { text: string; soft: string; fill: string; dot: string }> = {
  neutral: {
    text: "text-muted-foreground",
    soft: "bg-muted",
    fill: "bg-muted-foreground/40",
    dot: "bg-muted-foreground/50",
  },
  success: {
    text: "text-success",
    soft: "bg-success-soft",
    fill: "bg-success",
    dot: "bg-success",
  },
  warning: {
    text: "text-warning",
    soft: "bg-warning-soft",
    fill: "bg-warning",
    dot: "bg-warning",
  },
  danger: { text: "text-danger", soft: "bg-danger-soft", fill: "bg-danger", dot: "bg-danger" },
  info: { text: "text-info", soft: "bg-info-soft", fill: "bg-info", dot: "bg-info" },
};

/** Soft fill, solid text, no ring: the Stripe badge, the Linear tag. */
export function Badge({
  tone = "neutral",
  size = "sm",
  children,
  icon,
  className,
}: {
  tone?: Tone;
  size?: "xs" | "sm";
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm font-medium",
        size === "xs" ? "px-1 py-px text-11" : "px-1.5 py-0.5 text-12 leading-4",
        toneClasses[tone].soft,
        toneClasses[tone].text,
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  return <span className={cn("size-1.5 shrink-0 rounded-full", toneClasses[tone].dot)} />;
}

/** Severity as a Dot plus text — never a pill, so the status column stays the only pill in a row. */
export function Severity({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]",
        tone === "neutral" ? "text-muted-foreground" : "text-foreground",
        className,
      )}
    >
      <Dot tone={tone} />
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}
      {...props}
    />
  );
}

/* ----------------------------------------------------------------- Section */
/* Borderless block: a rule + label, the way Stripe separates page regions. */

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
        <div className="min-w-0">
          <h2 className="text-[13px] font-medium tracking-[-0.005em]">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[14px] font-medium tracking-[-0.01em]">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------- Table */

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-left text-[13px]", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 h-8 whitespace-nowrap border-b border-border bg-background px-3 text-12 font-medium text-muted-foreground first:pl-3 last:pr-3",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "h-10 max-w-0 truncate whitespace-nowrap px-3 align-middle first:pl-3 last:pr-3",
        className,
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "group/row border-b border-border-subtle transition-colors duration-100 last:border-0 hover:bg-surface-hover",
        className,
      )}
      {...props}
    />
  );
}

/* --------------------------------------------------- Row identity + preview */
/* One pattern everywhere: the row itself opens the record page; the eye button
   that appears on hover opens the same row in the preview rail. */

export function IdCell({
  id,
  onPreview,
  active,
  tone = "primary",
}: {
  id: ReactNode;
  onPreview?: () => void;
  active?: boolean;
  tone?: "primary" | "muted";
}) {
  return (
    <Td className="max-w-none">
      <span className="flex items-center gap-1.5">
        <Mono
          className={cn(
            "transition-colors duration-100",
            active ? "text-primary" : "text-muted-foreground",
            tone === "primary" && !active ? "group-hover/row:text-primary" : null,
          )}
        >
          {id}
        </Mono>
        {onPreview ? (
          <button
            type="button"
            aria-label="Preview row"
            title="Preview"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className={cn(
              "ml-auto inline-flex size-5 shrink-0 items-center justify-center rounded transition-colors focus-visible:opacity-100 focus-visible:outline-none",
              active
                ? "bg-primary-soft text-primary opacity-100"
                : "text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground group-hover/row:opacity-100",
            )}
          >
            <Eye className="size-3.5" />
          </button>
        ) : null}
      </span>
    </Td>
  );
}

/** The right rail is a preview surface only — never the record itself. */
export function PreviewRail({
  id,
  title,
  onClose,
  openTo,
  children,
}: {
  id: ReactNode;
  title?: ReactNode;
  onClose: () => void;
  openTo?: ReactNode;
  children: ReactNode;
}) {
  return (
    <aside className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          Preview
        </span>
        <Mono>{id}</Mono>
        <button
          onClick={onClose}
          className="ml-auto text-[12px] text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>
      {title ? <h2 className="mt-1.5 text-[13.5px] font-medium leading-snug">{title}</h2> : null}
      {openTo ? <div className="mt-1.5 text-[12.5px]">{openTo}</div> : null}
      <div className="mt-3">{children}</div>
    </aside>
  );
}

/** Compact record-page header: back chevron, id, title, meta — no breadcrumb. */
export function RecordHeader({
  backTo,
  backParams,
  id,
  title,
  meta,
  actions,
  below,
}: {
  backTo: string;
  backParams?: Record<string, string>;
  id: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  /** Persistent state strip rendered under the title row (e.g. lifecycle). */
  below?: ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-start gap-2.5">
        <Link
          to={backTo}
          params={backParams as never}
          aria-label="Back"
          className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <Mono className="text-muted-foreground">{id}</Mono>
            {meta ? (
              <span className="truncate text-[12px] text-muted-foreground">{meta}</span>
            ) : null}
          </div>
          <h1 className="mt-0.5 text-[18px] font-semibold leading-tight tracking-[-0.015em]">
            {title}
          </h1>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {below}
    </div>
  );
}

/* -------------------------------------------------------------------- Tabs */

export function Tabs({
  items,
  active,
}: {
  items: { label: string; to?: string; count?: number }[];
  active: string;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-border">
      {items.map((item) => {
        const isActive = item.label === active;
        const content = (
          <span
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 border-b-2 px-0.5 pb-2.5 pt-1 text-[13px] transition-colors",
              isActive
                ? "border-primary font-medium text-foreground"
                : "border-transparent font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                {item.count}
              </span>
            ) : null}
          </span>
        );
        return item.to ? (
          <Link key={item.label} to={item.to}>
            {content}
          </Link>
        ) : (
          <button key={item.label}>{content}</button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ Filter chips */

export function FilterChip({
  label,
  value,
  active,
  className,
  ...props
}: ComponentProps<"button"> & {
  label: string;
  value?: string;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border border-dashed px-2 text-[13px] transition-colors",
        active
          ? "border-solid border-primary/30 bg-primary-soft text-primary"
          : "border-border-strong text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground",
        className,
      )}
      {...props}
    >
      <span className="text-[13px] leading-none">+</span>
      {label}
      {value ? <span className="font-medium text-foreground">{value}</span> : null}
    </button>
  );
}

/* ------------------------------------------------------------- Key / value */

/** One rail row. `wrap` lets a long value run to several lines instead of truncating. */
export function KeyValue({
  label,
  wrap,
  children,
}: {
  label: string;
  wrap?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 py-[5px]">
      <dt className="truncate text-[12.5px] text-muted-foreground">{label}</dt>
      <dd
        className={cn("min-w-0 text-[12.5px] text-foreground", wrap ? "leading-snug" : "truncate")}
      >
        {children}
      </dd>
    </div>
  );
}

/** Collapsible property group for the record detail rail. */
export function RailGroup({
  title,
  children,
  action,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-border py-3 first:pt-0 last:border-0">
      <div className="flex h-6 items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="group inline-flex items-center gap-1 text-[13px] font-medium text-foreground"
          aria-expanded={open}
        >
          {title}
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              open ? "" : "-rotate-90",
            )}
          />
        </button>
        {action ? <span className="ml-auto flex items-center">{action}</span> : null}
      </div>
      {open ? <dl className="pt-1.5">{children}</dl> : null}
    </section>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-[12px] tracking-tight text-foreground", className)}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------ Progress bar */

export function Meter({ value, tone = "info" }: { value: number; tone?: Tone }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", toneClasses[tone].fill)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/** Segmented proportional bar. One primitive for every coverage read-out. */
export function StackedBar({
  segments,
  height = 8,
}: {
  segments: {
    key: string;
    value: number;
    tone: Tone;
    title?: string;
    onClick?: () => void;
  }[];
  height?: number;
}) {
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
  return (
    <span
      className="flex w-full overflow-hidden rounded-full bg-muted"
      style={{ height: `${height}px` }}
    >
      {segments
        .filter((s) => s.value > 0)
        .map((s) =>
          s.onClick ? (
            <button
              key={s.key}
              type="button"
              title={s.title}
              onClick={s.onClick}
              className={cn("h-full transition-[width] duration-[120ms]", toneClasses[s.tone].fill)}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ) : (
            <span
              key={s.key}
              title={s.title}
              className={cn("h-full transition-[width] duration-[120ms]", toneClasses[s.tone].fill)}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ),
        )}
    </span>
  );
}

/* ------------------------------------------------------------- Page header */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1 text-[13px] text-muted-foreground">{eyebrow}</div> : null}
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl truncate text-[13px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* --------------------------------------------------------- Page archetypes */
/* Every screen is one of these two shapes:
 *
 *   IndexPage — header, one filter row, one dense table. The only inline
 *               detail surface is the preview rail (IdCell eye action).
 *
 *   ShowPage  — RecordHeader, one tab strip running full width, then the
 *               tab body. The `rail` renders ONLY beside the overview tab;
 *               every other tab is full-width and self-contained.
 */

export function IndexPage({
  header,
  filters,
  children,
}: {
  header: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="animate-slide-up space-y-4">
      {header}
      {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
      {children}
    </div>
  );
}

/** Underline tab strip; buttons for in-page tabs. Border meets the rail's rule. */
export function TabStrip({
  items,
  className,
}: {
  items: {
    key: string;
    label: ReactNode;
    active?: boolean;
    onSelect?: () => void;
    to?: string;
    params?: Record<string, string>;
    disabled?: boolean;
    trailing?: ReactNode;
  }[];
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-4 overflow-x-auto border-b border-border", className)}
    >
      {items.map((item) => {
        const content = (
          <span
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 pb-2.5 pt-1 text-[13px] transition-colors",
              item.active
                ? "border-primary font-medium text-foreground"
                : "border-transparent font-medium text-muted-foreground hover:text-foreground",
              item.disabled ? "opacity-60" : null,
            )}
          >
            {item.label}
            {item.trailing}
          </span>
        );
        if (item.to) {
          return (
            <Link key={item.key} to={item.to} params={item.params as never}>
              {content}
            </Link>
          );
        }
        return (
          <button key={item.key} onClick={item.onSelect} disabled={!item.onSelect}>
            {content}
          </button>
        );
      })}
    </div>
  );
}

export function ShowPage({
  header,
  tabs,
  showRail,
  rail,
  children,
}: {
  header: ReactNode;
  tabs?: ReactNode;
  /** True only on the overview tab — the rail never renders elsewhere. */
  showRail?: boolean;
  rail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="animate-slide-up space-y-4">
      {header}
      {tabs}
      <div className={cn("grid", showRail && rail ? "lg:grid-cols-[minmax(0,1fr)_272px]" : "")}>
        <div className={cn("min-w-0 space-y-7 pt-6", showRail && rail ? "lg:pr-6" : "")}>
          {children}
        </div>
        {showRail && rail ? (
          <aside className="pt-6 lg:border-l lg:border-border lg:pl-6">{rail}</aside>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Form inputs */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[12px] font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const controlBase =
  "h-8 w-full rounded-md border border-input bg-card px-2.5 text-[13px] text-foreground outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlBase, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(controlBase, "select-chevron appearance-none pr-8", className)}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlBase, "h-auto min-h-[68px] resize-y py-1.5 leading-snug", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ Modal */

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  aside,
  children,
  width = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  width?: "md" | "lg";
}) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-10">
      <div
        className="fixed inset-0 bg-foreground/25 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-xl bg-card shadow-pop",
          width === "lg" ? "max-w-[860px]" : "max-w-[520px]",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="text-[15px] font-medium tracking-[-0.01em]">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className={cn("grid", aside ? "md:grid-cols-[minmax(0,1fr)_300px]" : "")}>
          <div className="px-5 py-4">{children}</div>
          {aside ? (
            <div className="border-t border-border bg-subtle px-5 py-4 md:border-l md:border-t-0">
              {aside}
            </div>
          ) : null}
        </div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-subtle px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/* ----------------------------------------------------------- Related card */
/* A bordered card that owns one related object type: title, count, a few
   dense rows, and a single link out to the full list. */

export function RelatedCard({
  title,
  count,
  action,
  children,
  empty = "Nothing linked yet",
}: {
  title: ReactNode;
  count?: number;
  action?: ReactNode;
  children?: ReactNode;
  empty?: string;
}) {
  const has = Children.count(children) > 0;
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex h-9 items-center gap-2 border-b border-border px-3">
        <span className="truncate text-[12.5px] font-medium">{title}</span>
        {typeof count === "number" ? (
          <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
            {count}
          </span>
        ) : null}
        {action ? <span className="ml-auto flex items-center">{action}</span> : null}
      </div>
      {has ? (
        <div className="divide-y divide-border/70">{children}</div>
      ) : (
        <div className="px-3 py-3 text-[12.5px] text-muted-foreground">{empty}</div>
      )}
    </div>
  );
}

/** One line inside a RelatedCard: label, optional meta, optional trailing value. */
export function RelatedRow({
  lead,
  label,
  meta,
  trailing,
  onClick,
}: {
  lead?: ReactNode;
  label: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {lead ? <span className="flex shrink-0 items-center">{lead}</span> : null}
      <span className="min-w-0 flex-1 truncate text-[12.5px]">{label}</span>
      {meta ? (
        <span className="shrink-0 truncate text-[12px] text-muted-foreground">{meta}</span>
      ) : null}
      {trailing ? (
        <span className="tnum shrink-0 text-[12px] text-muted-foreground">{trailing}</span>
      ) : null}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex h-8 w-full items-center gap-2 px-3 text-left transition-colors hover:bg-muted/60"
      >
        {inner}
      </button>
    );
  }
  return <div className="flex h-8 items-center gap-2 px-3">{inner}</div>;
}

/* ------------------------------------------------------------- Avatar */
/* People are named everywhere; text-only names read as a spreadsheet. One
   neutral style: colour is reserved for state, and a red avatar beside a red
   badge made the two indistinguishable. */

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({
  name,
  size = "sm",
  className,
}: {
  name: string;
  size?: "xs" | "sm";
  className?: string;
}) {
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-secondary-foreground ring-1 ring-inset ring-border-subtle",
        size === "xs" ? "size-4 text-[9px]" : "size-5 text-[10px]",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function Person({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <Avatar name={name} size="xs" />
      <span className="truncate text-12 text-muted-foreground">{name}</span>
    </span>
  );
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((n) => (
        <Avatar key={n} name={n} size="xs" className="-ml-1 first:ml-0 ring-background" />
      ))}
      {rest > 0 ? (
        <span className="-ml-1 inline-flex size-4 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground ring-1 ring-inset ring-border-subtle">
          +{rest}
        </span>
      ) : null}
    </span>
  );
}

/* --------------------------------------------------------------- Kbd */

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border-subtle bg-surface-2 px-1 font-sans text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

/* -------------------------------------------------------------- Menu */
/* Small, keyboard-dismissible dropdown. No portal — anchored to trigger. */

export function Menu({
  trigger,
  align = "start",
  width = 200,
  children,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  align?: "start" | "end";
  width?: number;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            style={{ width }}
            className={cn(
              "absolute top-[calc(100%+4px)] z-40 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-pop",
              align === "end" ? "right-0" : "left-0",
            )}
          >
            {children(() => setOpen(false))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function MenuItem({
  children,
  selected,
  onSelect,
  trailing,
}: {
  children: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-13 transition-colors duration-100",
        selected ? "bg-primary-soft text-primary" : "text-foreground hover:bg-surface-hover",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className="shrink-0 text-11 text-muted-foreground">{trailing}</span> : null}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 pb-1 pt-1.5 text-11 font-medium uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </div>
  );
}

/* ------------------------------------------------- Toolbar / segmented */

export function Toolbar({
  search,
  onSearch,
  placeholder = "Search",
  children,
  actions,
}: {
  search?: string;
  onSearch?: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2.5 pt-3">
      {onSearch ? (
        <span className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="h-7 w-[200px] pl-7 text-13"
          />
        </span>
      ) : null}
      {children}
      {actions ? <span className="ml-auto flex items-center gap-2">{actions}</span> : null}
    </div>
  );
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex h-7 items-center gap-0.5 rounded-md bg-muted p-0.5">
      {items.map((i) => (
        <button
          key={i.value}
          type="button"
          onClick={() => onChange(i.value)}
          aria-pressed={value === i.value}
          className={cn(
            "inline-flex h-6 items-center rounded-[5px] px-2 text-12 font-medium transition-colors duration-100",
            value === i.value
              ? "bg-card text-foreground shadow-hairline"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------- Empty state */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5 rounded-lg border border-dashed border-border px-4 py-6">
      <p className="text-13 font-medium">{title}</p>
      {description ? <p className="text-12 text-muted-foreground">{description}</p> : null}
      {action ? <div className="pt-1.5">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Drawer */
/* Right-side detail surface. Used for previews and record detail that should
   not take the user off the page. */

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-card shadow-pop animate-slide-up"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-[14px] font-medium tracking-[-0.01em]">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 truncate text-12 text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-subtle px-4 py-2.5">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------- Facts & text */
/* The small reading primitives every rail, summary and detail body had been
   re-declaring locally (nine copies of Dash, seven of ProseBlock, three of
   WrapValue and IdList, three of Fact). One definition each. */

/** Uppercase micro-label: 11px, weight 500, 0.06em. Tone colours it for a callout. */
export function Label({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.06em]",
        tone === "neutral" ? "text-muted-foreground" : toneClasses[tone].text,
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The absent value. */
export function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

/** A wrapping run of Mono ids; `empty` when there are none. */
export function IdList({ ids, empty = "—" }: { ids: string[]; empty?: string }) {
  if (ids.length === 0) return <span className="text-[12.5px] text-muted-foreground">{empty}</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <Mono key={id} className="text-[11.5px] text-muted-foreground">
          {id}
        </Mono>
      ))}
    </span>
  );
}

/** Labelled paragraph for a rail or detail body: Label over 12.5px relaxed prose. */
export function Prose({
  label,
  tone = "neutral",
  children,
  className,
}: {
  label: string;
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pt-1.5", className)}>
      <Label tone={tone}>{label}</Label>
      <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">{children}</p>
    </div>
  );
}

/** Inline `label value` pair for the facts strip under a RecordHeader. Renders dt/dd; wrap a row of them in a <dl>. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <dt className="shrink-0 text-[12px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-[12.5px] font-medium">{children}</dd>
    </div>
  );
}

/* --------------------------------------------------------------- Numbers */

/** One cell of a `Tiles` grid: label, big tabular number, one-line note. Zero reads muted. */
export function Tile({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: Tone;
}) {
  return (
    <div className="bg-background px-4 py-3">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div
        className={cn(
          "tnum mt-0.5 text-[20px] font-semibold tracking-[-0.02em]",
          value === 0 ? "text-muted-foreground" : tone === "neutral" ? "" : toneClasses[tone].text,
        )}
      >
        {value}
      </div>
      {note ? (
        <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{note}</div>
      ) : null}
    </div>
  );
}

/** Bare number over its label, for an unframed summary row. */
export function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="border-b border-border-subtle py-2 last:border-0 md:border-0">
      <div
        className={cn(
          "tnum text-20 font-semibold leading-none",
          tone === "neutral" ? "text-foreground" : toneClasses[tone].text,
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-12 text-muted-foreground">{label}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- Notice */

/** Tinted callout in a rail or above a table: Dot, a title in the tone colour, optional body. */
export function Notice({
  tone = "warning",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md px-3 py-2.5 text-[12.5px] leading-snug",
        toneClasses[tone].soft,
        toneClasses[tone].text,
        className,
      )}
    >
      {title ? (
        <div className="flex items-start gap-2 font-medium">
          <span className="pt-1.5">
            <Dot tone={tone} />
          </span>
          <span className="min-w-0">{title}</span>
        </div>
      ) : null}
      {children ? <div className={title ? "pt-1.5" : ""}>{children}</div> : null}
    </div>
  );
}
