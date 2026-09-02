import type { ReactNode } from "react";

/** Nothing here yet: a dashed frame with a title, one line of why, and the action that fills it. */
export function Empty({ title, description, action }: { title: string; description?: string | undefined; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-075 rounded-large border border-dashed border-default px-200 py-300">
      <p className="font-body font-medium text-default">{title}</p>
      {description ? <p className="font-body-small text-subtle">{description}</p> : null}
      {action ? <div className="pt-075">{action}</div> : null}
    </div>
  );
}
