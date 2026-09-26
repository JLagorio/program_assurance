import type { ReactNode } from "react";
import { Id } from "../components/id";

/** Shared identity layout; the surface supplies its own heading and landmark semantics. The id and status keep their full width beside the actions; when the row cannot hold both, the actions take the next row, at the end, rather than breaking the id. */
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
      <div className="flex flex-wrap items-start gap-100">
        <div className="flex min-w-0 grow flex-wrap items-center gap-100">
          <Id className="min-w-0 break-words font-body-small text-subtle">{id}</Id>
          {status}
        </div>
        {actions ? (
          <div className="ms-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-050">
            {actions}
          </div>
        ) : null}
      </div>
      {title}
      {subtitle}
    </div>
  );
}
