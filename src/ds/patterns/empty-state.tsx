import type { ReactNode } from "react";

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

/* Right-side detail surface. Used for previews and record detail that should
   not take the user off the page. */
