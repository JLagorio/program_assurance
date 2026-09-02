import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

function CardRoot({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("overflow-hidden rounded-lg border border-border bg-card", className)}
      {...props}
    />
  );
}

/* Borderless block: a rule + label, the way Stripe separates page regions. */

function CardHeader({
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

export const Card = Object.assign(CardRoot, { Header: CardHeader });
