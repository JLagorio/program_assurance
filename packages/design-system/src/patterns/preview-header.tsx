import type { ReactNode } from "react";
import { Id } from "../components/id";

/** Shared identity layout; the surface supplies its own heading and landmark semantics. */
export function PreviewHeader({
  id,
  status,
  title,
  subtitle,
  actions,
}: {
  id: ReactNode;
  status?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-075">
      <div className="flex items-start gap-100">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-100">
          <Id className="min-w-0 break-words font-body-small text-subtle">{id}</Id>
          {status}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-050">{actions}</div> : null}
      </div>
      {title}
      {subtitle}
    </div>
  );
}
