import { useLedgerLocale } from "../lib/locale";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { IconButton } from "./button";

/* Source shown as source: the code face, one row per line, a line-number gutter that stays put
   when the block scrolls sideways, and a cap on its height so a long document scrolls inside the
   block and not the page. The caller owns highlighting and passes rendered lines. */

export type CodeBlockProps = {
  /** The lines, one entry each: strings, or spans the caller has coloured. */
  lines: ReactNode[];
  /** The number of the first line. 1 by default; the line the excerpt starts at when it is a slice of a file. */
  start?: number | undefined;
  /** Pixels before the block scrolls inside itself. 560 by default; a short excerpt never reaches it. */
  maxHeight?: number | undefined;
  /** Long lines wrap at the block's edge instead of scrolling sideways. Off by default, so code keeps its columns; on for logs and long values. */
  wrap?: boolean | undefined;
  /** The text a Copy button puts on the clipboard, usually the lines joined. Unsaid, there is no button. */
  copy?: string | undefined;
  /** The block's accessible name: the file, the format. "Code" by default. */
  label?: string | undefined;
  className?: string | undefined;
};

/** Source shown as source, with a gutter, a height cap, and a Copy when `copy` is given. */
export function CodeBlock({
  lines,
  start = 1,
  maxHeight = 560,
  wrap = false,
  copy,
  label,
  className,
}: CodeBlockProps) {
  const { t, formatNumber } = useLedgerLocale();
  const width = String(start + lines.length - 1).length;
  return (
    <div className={cn("relative", className)}>
      <div
        role="group"
        aria-label={label ?? t("code")}
        tabIndex={0}
        className="overflow-auto rounded-medium border border-default bg-surface-sunken outline-none focus-visible:outline-focused"
        style={{ maxHeight }}
      >
        <pre
          className={cn(
            "min-w-full py-050 font-code text-default",
            wrap ? "w-full whitespace-pre-wrap break-words" : "w-max",
          )}
        >
          {lines.map((line, i) => (
            <div key={formatNumber(start + i, { useGrouping: false })} className="flex">
              <span
                className="sticky start-0 shrink-0 select-none border-e border-default bg-surface-sunken px-100 text-end text-subtlest tabular-nums"
                style={{ width: `${Math.max(width, 3) + 2.5}ch` }}
              >
                {formatNumber(start + i, { useGrouping: false })}
              </span>
              <span className="min-w-0 px-150">{line}</span>
            </div>
          ))}
        </pre>
      </div>
      {copy !== undefined ? <CopyButton text={copy} /> : null}
    </div>
  );
}

/** Puts the text on the clipboard and says Copied for a moment. */
function CopyButton({ text }: { text: string }) {
  const { t } = useLedgerLocale();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <span className="absolute end-100 top-100">
      <IconButton
        variant="subtle"
        size="small"
        label={copied ? t("copied") : t("copy")}
        icon={copied ? <Check className="icon-success" /> : <Copy />}
        onClick={() => {
          setFailed(false);
          void Promise.resolve()
            .then(() => navigator.clipboard.writeText(text))
            .then(() => {
              setCopied(true);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => setCopied(false), 1400);
            })
            .catch(() => {
              setCopied(false);
              setFailed(true);
            });
        }}
      />
      <span role="status" className="sr-only">
        {failed ? t("copyFailed") : copied ? t("copied") : ""}
      </span>
    </span>
  );
}
