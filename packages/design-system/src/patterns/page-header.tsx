import type { ReactNode } from "react";

/** The top of an index page: an eyebrow, the title, one line, the actions. */
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: string; description?: string | undefined; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-300">
      <div className="flex min-w-0 flex-col gap-050">
        {eyebrow ? <div className="font-body text-subtle">{eyebrow}</div> : null}
        <h1 className="font-heading-medium text-default">{title}</h1>
        {description ? <p className="truncate font-body text-subtle">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-100">{actions}</div> : null}
    </div>
  );
}
