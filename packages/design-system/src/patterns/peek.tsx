import { useState, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../components/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { IconButton } from "../components/button";
import { cn } from "../lib/cn";

export type PeekProps = Omit<ComponentProps<"span">, "children"> & {
  /** A real link. Its click and modified-click navigation remain intact. */
  trigger: ReactElement;
  /** Accessible name for the explicit keyboard/touch preview button and popup. */
  label: string;
  /** Informational content, often Glance; fetch only after onOpenChange(true). */
  children: ReactNode;
  /** Actions in the explicit preview popup, never required in the hover summary. */
  actions?: ReactNode;
  /** Lets the host start a lazy read. Opening either surface reports true. */
  onOpenChange?: ((open: boolean) => void) | undefined;
};

/** A navigable link with a hover/focus summary and an explicit keyboard/touch action popup. */
export function Peek({
  trigger,
  label,
  children,
  actions,
  onOpenChange,
  className,
  ...props
}: PeekProps) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <span
      {...props}
      className={cn("inline-flex min-w-0 max-w-full items-baseline gap-025", className)}
      data-slot="peek"
    >
      <HoverCard
        open={hover && !open}
        onOpenChange={(next) => {
          setHover(next);
          onOpenChange?.(next || open);
        }}
      >
        <HoverCardTrigger render={trigger} delay={350} className="min-w-0 truncate" />
        <HoverCardContent align="start">{children}</HoverCardContent>
      </HoverCard>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setHover(false);
          onOpenChange?.(next);
        }}
      >
        <PopoverTrigger
          render={
            <IconButton
              size="xxsmall"
              className="shrink-0"
              variant="subtle"
              label={label}
              icon={<Eye />}
              isTooltipDisabled
              onClick={(event) => event.stopPropagation()}
            />
          }
        />
        <PopoverContent
          aria-label={label}
          align="start"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex min-w-0 flex-col gap-150">
            {children}
            {actions && <div className="flex flex-wrap items-center gap-100">{actions}</div>}
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
}
