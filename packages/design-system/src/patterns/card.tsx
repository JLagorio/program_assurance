import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

import { cn } from "../lib/cn";

/** The raised surface, recorded for children that read the surface they sit on (sticky table headers). */
export const raisedSurface = { "--ds-utility-elevation-surface-current": "var(--ds-elevation-surface-raised)" } as CSSProperties;

/** A framed block on the raised surface. */
function CardRoot({ className, style, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("overflow-hidden rounded-large border border-default bg-surface-raised", className)} style={{ ...raisedSurface, ...style }} {...props} />;
}

/** A rule and a label at the top of a Card, the way Stripe separates page regions. */
function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string | undefined }) {
  return (
    <div className={cn("flex items-center justify-between gap-200 border-b border-default px-200 py-150", className)}>
      <div className="flex min-w-0 flex-col gap-025">
        <h2 className="font-heading-xsmall text-default">{title}</h2>
        {description ? <p className="font-body text-subtle">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-100">{action}</div> : null}
    </div>
  );
}

export const Card = Object.assign(CardRoot, { Header: CardHeader });
