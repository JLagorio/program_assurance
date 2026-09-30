import { useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { CopyButton } from "./copy-button";

/* Source shown as source: the code face, one row per line, a line-number gutter that stays put
   when the block scrolls sideways, and a cap on its height so a long document scrolls inside the
   block and not the page. The caller owns highlighting and passes rendered lines, or passes the
   text as `code` and the block splits it. */

export type CodeBlockProps = Omit<ComponentProps<"div">, "children"> & {
  /** The lines, one entry each: strings, or spans the caller has coloured. */
  lines?: ReactNode[] | undefined;
  /** The text as one string, split at its line breaks, in place of `lines`: a serialised record, a log. */
  code?: string | undefined;
  /** The number of the first line. 1 by default; the line the excerpt starts at when it is a slice of a file. */
  start?: number | undefined;
  /** The line-number gutter. On by default; off for a value that is not a file (a record's JSON, a rule), where a line number points at nothing. */
  showLineNumbers?: boolean | undefined;
  /** Pixels before the block scrolls inside itself. 560 by default (`dimension.part.codeBlock`); a short excerpt never reaches it. */
  maxHeight?: number | undefined;
  /** Long lines wrap at the block's edge instead of scrolling sideways. Off by default, so code keeps its columns; on for logs and long values. */
  wrap?: boolean | undefined;
  /** The text a Copy button puts on the clipboard, usually the lines joined. Unsaid, there is no button. */
  copy?: string | undefined;
  /** The block's accessible name: the file, the format. "Code" by default. */
  label?: string | undefined;
  className?: string | undefined;
};

/** Whether a scroll frame has more than it shows, either way: then it is a tab stop, so the keyboard can scroll it. */
function useScrolls() {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    if (el.firstElementChild) resize.observe(el.firstElementChild);
    return () => resize.disconnect();
  }, []);
  return [ref, scrolls] as const;
}

/** Source shown as source, with a gutter, a height cap, and a Copy when `copy` is given. Native div props and the ref reach the outer box. */
export function CodeBlock({
  lines: linesProp,
  code,
  start = 1,
  showLineNumbers = true,
  maxHeight,
  wrap = false,
  copy,
  label,
  className,
  ...props
}: CodeBlockProps) {
  const { t, formatNumber } = useLedgerLocale();
  const [frame, scrolls] = useScrolls();
  const lines = linesProp ?? code?.replace(/\r\n?/g, "\n").split("\n") ?? [];
  const width = String(start + lines.length - 1).length;
  return (
    <div {...props} className={cn("relative", className)} data-slot="code-block">
      <div
        ref={frame}
        role="group"
        aria-label={label ?? t("code")}
        // A tab stop only while there is more to scroll to; a block that shows everything is text.
        tabIndex={scrolls ? 0 : undefined}
        className={cn(
          "overflow-auto rounded-medium border border-default bg-surface-sunken outline-none focus-visible:outline-focused",
          // The Copy sits inside the frame: one line still holds it, and the lines can scroll out
          // from under it.
          copy !== undefined && "min-h-control-large",
        )}
        style={{ maxHeight: maxHeight ?? token("dimension.part.codeBlock") }}
      >
        <pre
          className={cn(
            "min-w-full py-050 font-code text-default",
            wrap ? "w-full whitespace-pre-wrap break-words" : "w-max",
            copy !== undefined && "pe-500",
          )}
        >
          {lines.map((line, i) => (
            <div key={formatNumber(start + i, { useGrouping: false })} className="flex">
              {showLineNumbers ? (
                <span
                  aria-hidden
                  className="sticky start-0 shrink-0 select-none border-e border-default bg-surface-sunken px-100 text-end text-subtlest tabular-nums"
                  style={{ width: `${Math.max(width, 3) + 2.5}ch` }}
                >
                  {formatNumber(start + i, { useGrouping: false })}
                </span>
              ) : null}
              <span className="min-w-0 px-150">{line}</span>
            </div>
          ))}
        </pre>
      </div>
      {copy !== undefined ? (
        // An opaque surface, so a line scrolled under the button never shows through it.
        <span className="absolute end-050 top-050 rounded-medium bg-surface-sunken">
          <CopyButton text={copy} label={t("copy")} variant="subtle" size="small" />
        </span>
      ) : null}
    </div>
  );
}
