import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "../lib/cn";

/* Reference material. Atlassian's Spinner has five sizes on its icon scale and a delay so a fast
   load never flashes one; Carbon's Loading is small inline or large over a section. This is three
   sizes on the icon scale, subtle by default, inverse on a bold fill, and a delay. It is a status,
   named "Loading" unless the wait has a better word. */

export type SpinnerSize = "small" | "medium" | "large";

const spinnerSizes: Record<SpinnerSize, string> = {
  small: "size-150",
  medium: "size-200",
  large: "size-300",
};

export type SpinnerProps = {
  /** `small` (12px) beside text and in a button, the default; `medium` (16px) on its own in a row or a toolbar; `large` (24px) centred in a section that is empty while it loads. */
  size?: SpinnerSize | undefined;
  /** What the wait is, for a screen reader: "Loading", the default; "Saving", "Exporting". Beside a word that already says it, pass that word. */
  label?: string | undefined;
  /** `subtle`, the default, on a surface; `inverse` on a bold fill; `inherit` takes the text colour around it, for a button. */
  appearance?: "subtle" | "inverse" | "inherit" | undefined;
  /** Milliseconds before it appears, so a fast load never flashes one. 0 by default; 300 for a load that is usually quick. */
  delay?: number | undefined;
  className?: string | undefined;
};

const appearances = { subtle: "icon-subtle", inverse: "icon-inverse", inherit: "" } as const;

/** Something is in flight. */
export function Spinner({
  size = "small",
  label = "Loading",
  appearance = "subtle",
  delay = 0,
  className,
}: SpinnerProps) {
  const [shown, setShown] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return;
    const t = window.setTimeout(() => setShown(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);
  if (!shown) return null;
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn(
        "shrink-0 animate-spin",
        spinnerSizes[size],
        appearances[appearance],
        className,
      )}
    />
  );
}
