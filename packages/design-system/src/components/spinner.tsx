import { useLedgerLocale } from "../lib/locale";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";

/* Three sizes on the icon scale, subtle by default, inverse on a bold fill, and a delay so a fast
   load never flashes one. It is a status,
   named "Loading" unless the wait has a better word. */

export type SpinnerSize = "small" | "medium" | "large";

const spinnerSizes: Record<SpinnerSize, string> = {
  small: "size-150",
  medium: "size-200",
  large: "size-300",
};

export type SpinnerProps = ComponentProps<"svg"> & {
  /** `small` (12px) beside text and in a button, the default; `medium` (16px) on its own in a row or a toolbar; `large` (24px) centred in a section that is empty while it loads. */
  size?: SpinnerSize | undefined;
  /** What the wait is, for a screen reader: "Loading", the default; "Saving", "Exporting". Beside a word that already says it, pass that word. */
  label?: string | undefined;
  /** Hide the graphic when its parent already communicates the busy state. */
  isDecorative?: boolean | undefined;
  /** `subtle`, the default, on a surface; `inverse` on a bold fill; `inherit` takes the text colour around it, for a button. */
  appearance?: "subtle" | "inverse" | "inherit" | undefined;
  /** Milliseconds before it appears. Defaults to 0; non-positive values show immediately. Changing a pending delay restarts the wait; once shown, it stays visible until unmounted. */
  delay?: number | undefined;
};

const appearances = { subtle: "icon-subtle", inverse: "icon-inverse", inherit: "" } as const;

/** Something is in flight. */
export function Spinner({
  size = "small",
  label,
  isDecorative = false,
  appearance = "subtle",
  delay = 0,
  className,
  ...props
}: SpinnerProps) {
  const { t } = useLedgerLocale();
  const [shown, setShown] = useState(delay <= 0);
  // Latch an immediate reveal during this render; a subsequent positive delay must not hide it.
  if (!shown && delay <= 0) setShown(true);
  useEffect(() => {
    if (shown) return;
    const t = window.setTimeout(() => setShown(true), delay);
    return () => window.clearTimeout(t);
  }, [delay, shown]);
  if (!shown && delay > 0) return null;
  return (
    <Loader2
      data-slot="spinner"
      role={isDecorative ? undefined : "status"}
      aria-label={isDecorative ? undefined : (label ?? t("loading"))}
      aria-hidden={isDecorative || undefined}
      className={cn(
        "shrink-0 animate-spin motion-reduce:animate-none",
        spinnerSizes[size],
        appearances[appearance],
        className,
      )}
      {...props}
    />
  );
}
