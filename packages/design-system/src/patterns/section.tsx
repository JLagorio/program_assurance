import type { ReactNode } from "react";

/** A titled region of a page with a rule under its heading. Prefer Block for work and Collapsible for reference; Section is the plain one. */
export function Section({ title, description, action, children, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string | undefined }) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between gap-200 border-b border-default pb-100">
        <div className="flex min-w-0 flex-col gap-025">
          <h2 className="font-body font-medium text-default">{title}</h2>
          {description ? <p className="font-body-small text-subtle">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-100">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
