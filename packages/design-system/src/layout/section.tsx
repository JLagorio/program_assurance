import { useId, type ComponentProps, type ReactNode } from "react";
import { Count } from "../components/badge";
import { cn } from "../lib/cn";

export type SectionProps = Omit<ComponentProps<"section">, "title"> & {
  title: ReactNode;
  count?: number | string | null | undefined;
  description?: ReactNode;
  action?: ReactNode;
  /** Draw a rule under the heading when the content needs separation. */
  divided?: boolean;
};

/** Optional presentation for a titled region. Compose disclosure with Collapsible when needed. */
export function Section({
  title,
  count,
  description,
  action,
  divided = false,
  className,
  children,
  ...props
}: SectionProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className={cn("min-w-0", className)} {...props}>
      <div
        className={cn(
          "flex items-start justify-between gap-100 pb-100",
          divided && "border-b border-default",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-025">
          <div className="flex min-w-0 items-baseline gap-100">
            <h2 id={titleId} className="min-w-0 break-words font-body font-medium text-default">
              {title}
            </h2>
            {count != null ? <Count value={count} /> : null}
          </div>
          {description ? <p className="font-body-small text-subtle">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-100">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
