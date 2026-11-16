import { CircleAlert } from "lucide-react";
import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";

import { announce } from "../lib/announce";
import { cn } from "../lib/cn";

/* A workspace's one finalizing act, docked under the work: what is judged and what is left at its
   start, the act at its end. It takes DataTable.SelectionBar's anatomy (the count, then the
   verbs) at the 60px of dimension.layout.footer, and stays at the foot of the window while the
   work scrolls above it. The summary is said whenever it changes, so a reader judging by key hears
   the count move without looking down; a failure is said at once. */

/** A FootBar takes its box's native props and `ref` too. */
export type FootBarProps = Omit<ComponentProps<"div">, "children"> & {
  /** What is judged, at medium weight, a count in its words: "56 of 58 recorded", "3 decided". Said whenever it changes. With `failed`, what did not go: "Not sent". */
  summary: ReactNode;
  /** After the summary, in the subtle colour: "5 controls not satisfied", "85 left", "58 determinations kept as a draft". Said with it. */
  detail?: ReactNode;
  /** Before the act, what is left and so why it waits: "To judge" and a link to each record left. The act itself waits with Button's `disabledReason`. */
  reason?: ReactNode;
  /** The one act, at the bar's end: a 36px primary Button, a sign Button with Return beside it, or a PageHeader.Slot that waits on someone, with Remind. Never two primaries. */
  actions?: ReactNode;
  /** The act did not go through: the summary takes the danger tone and its icon, and is said at once. Keep the draft and say so in `detail`; the act retries ("Send again"). */
  failed?: boolean | undefined;
};

/** A workspace's foot bar: what is judged, what is left, and the one act, pinned under the work. */
export function FootBar({
  summary,
  detail,
  reason,
  actions,
  failed = false,
  className,
  ...props
}: FootBarProps) {
  const said = useRef<HTMLSpanElement>(null);
  const saidDetail = useRef<HTMLSpanElement>(null);
  const last = useRef<string | null>(null);
  // The summary and its detail are said as they change, never on the first render: the bar
  // arriving with the page is not news, a count moving is. A failure interrupts.
  useEffect(() => {
    const words = (node: HTMLElement | null) =>
      (node?.textContent ?? "").replace(/\s+/g, " ").trim();
    const text = [words(said.current), words(saidDetail.current)].filter(Boolean).join(", ");
    if (last.current === null) {
      last.current = text;
      return;
    }
    if (text === last.current) return;
    last.current = text;
    announce(text, { politeness: failed ? "assertive" : "polite" });
  });
  return (
    <div
      {...props}
      data-slot="foot-bar"
      data-failed={failed ? "" : undefined}
      className={cn(
        "sticky bottom-0 z-10 flex min-h-layout-footer flex-wrap items-center gap-x-200 gap-y-100 border-t border-default bg-surface-current px-300 py-100 shadow-overflow",
        className,
      )}
    >
      <p data-slot="foot-bar-summary" className="flex min-w-0 grow items-center gap-100 font-body">
        {failed ? (
          <CircleAlert aria-hidden="true" className="size-icon-small shrink-0 icon-danger" />
        ) : null}
        <span ref={said} className={cn("font-medium", failed ? "text-danger" : "text-default")}>
          {summary}
        </span>
        {detail ? (
          <>
            {failed ? null : (
              <span aria-hidden="true" className="text-subtle">
                ·
              </span>
            )}
            <span ref={saidDetail} className="text-subtle">
              {detail}
            </span>
          </>
        ) : null}
      </p>
      {reason || actions ? (
        <div
          data-slot="foot-bar-end"
          className="ms-auto flex min-w-0 flex-wrap items-center justify-end gap-x-150 gap-y-100"
        >
          {reason ? (
            <span
              data-slot="foot-bar-reason"
              className="flex min-w-0 flex-wrap items-center gap-x-100 font-body text-subtle"
            >
              {reason}
            </span>
          ) : null}
          {actions ? (
            // The act never runs past the bar: in a narrow one each part of it takes at most the
            // bar's width, and a wait and its Remind take a line each.
            <div
              data-slot="foot-bar-actions"
              className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-100 *:max-w-full"
            >
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
