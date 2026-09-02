import type { ReactNode } from "react";

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
