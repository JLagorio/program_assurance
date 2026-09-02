import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1 text-[13px] text-muted-foreground">{eyebrow}</div> : null}
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl truncate text-[13px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* Every screen is one of these two shapes:
 *
 *   IndexPage — header, one filter row, one dense table. The only inline
 *               detail surface is the preview rail (IdCell eye action).
 *
 *   ShowPage  — RecordHeader, one tab strip running full width, then the
 *               tab body. The `rail` renders ONLY beside the overview tab;
 *               every other tab is full-width and self-contained.
 */
