import { useEffect, type ComponentProps } from "react";
import { Skeleton } from "../components/skeleton";
import { announce } from "../lib/announce";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

/* A page loads progressively, and a section that loads on its own draws its own Skeleton; this is
   the page skeleton the router shows before any route's data, in the shape of the page that is
   coming, so the real page lands on the same lines: a register (a title, its toolbar row and a
   table's rows, as DataTable's own loading rows) or a record (a trail, a title with its actions,
   a tab strip and the first sections). It says "Loading page" once, through the kit's persistent
   live regions, since a status inserted with its words already in it is heard by almost no screen
   reader. */

export type PageSkeletonVariant = "register" | "record";

export type PageSkeletonProps = ComponentProps<"div"> & {
  /** The page's shape. `register`, the default: a title, a toolbar row, then a table's rows. `record`: a trail, a title with its actions, a tab strip, then sections. The router shows the default for a route it knows nothing about; a record route passes `record` as its pending component. */
  variant?: PageSkeletonVariant | undefined;
  /** How many table rows a register draws, 8 by default: about a screen. */
  rows?: number | undefined;
  /** What the wait is, for a screen reader: "Loading page" by default. It is said once, politely, when the skeleton appears. */
  label?: string | undefined;
};

/** Several skeletons that appear together (a matrix, a remount) are said once. */
const REPEAT_WINDOW = 1000;
let lastSaid = { text: "", at: 0 };
function sayOnce(text: string) {
  const now = Date.now();
  if (text === lastSaid.text && now - lastSaid.at < REPEAT_WINDOW) return;
  lastSaid = { text, at: now };
  announce(text);
}

/** A register's head, toolbar and rows: the shape DataTable keeps while its first rows load. */
function RegisterShape({ rows }: { rows: number }) {
  return (
    <>
      <Skeleton shape="heading" width="min(240px, 60%)" />
      <div className="flex min-w-0 flex-col gap-200">
        <div data-slot="page-skeleton-toolbar" className="flex h-control-medium items-center gap-100">
          <Skeleton shape="block" height="100%" width="min(240px, 45%)" className="shrink" />
          <Skeleton width={72} className="shrink" />
          <Skeleton width={56} className="shrink" />
          <Skeleton shape="block" height="100%" width={112} className="ms-auto shrink" />
        </div>
        <div>
          <div className="flex h-row-header items-center gap-200 border-b border-default">
            <Skeleton width={72} className="shrink" />
            <Skeleton width="min(160px, 40%)" className="shrink" />
            <Skeleton width={64} className="shrink" />
          </div>
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex h-row items-center border-b border-default">
              <Skeleton />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/** A record's trail, title and actions, tab strip and first sections. The Details rail is the shell's Aside, which arrives with the page. */
function RecordShape() {
  return (
    <>
      <div className="flex min-w-0 flex-col gap-100">
        <Skeleton width="min(200px, 50%)" />
        <div className="flex min-w-0 items-center gap-150">
          <Skeleton shape="heading" width="min(320px, 60%)" className="shrink" />
          <Skeleton
            shape="block"
            height="var(--ds-dimension-control-medium)"
            width={88}
            className="ms-auto shrink"
          />
        </div>
      </div>
      <div className="flex gap-250 border-b border-default pb-150">
        <Skeleton width={64} className="shrink" />
        <Skeleton width={56} className="shrink" />
        <Skeleton width={72} className="shrink" />
      </div>
      {[0, 1].map((section) => (
        <div key={section} className="flex max-w-layout-measure flex-col gap-150">
          <Skeleton width="min(160px, 40%)" />
          <Skeleton lines={3} />
        </div>
      ))}
    </>
  );
}

/** What a screen looks like before its data arrives, in the shape of the page that is coming: a register by default, or a record. */
export function PageSkeleton({
  variant = "register",
  rows = 8,
  label,
  className,
  ...props
}: PageSkeletonProps) {
  const { t } = useLedgerLocale();
  const message = label ?? t("loadingPage");
  useEffect(() => {
    sayOnce(message);
  }, [message]);
  return (
    <div
      role="status"
      {...props}
      data-slot="page-skeleton"
      data-variant={variant}
      className={cn("flex min-w-0 flex-col gap-300", className)}
    >
      {/* Found by a reader who browses to it; the announcement above is what is heard. */}
      <span className="sr-only">{message}</span>
      {variant === "record" ? <RecordShape /> : <RegisterShape rows={rows} />}
    </div>
  );
}
