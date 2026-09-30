import { useLedgerLocale } from "../lib/locale";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type ComponentProps } from "react";

import { announce } from "../lib/announce";
import { cn } from "../lib/cn";

/* Three sizes on the icon scale, subtle by default, inverse on a bold fill, and an optional delay
   so a fast load never flashes one. It is a status, named "Loading" unless the wait has a better
   word, and it says that name through the kit's live regions when it appears: a status inserted
   with its name already set is announced by almost no screen reader. */

export type SpinnerSize = "small" | "medium" | "large";

const spinnerSizes: Record<SpinnerSize, string> = {
  small: "size-150",
  medium: "size-200",
  large: "size-300",
};

export type SpinnerProps = ComponentProps<"svg"> & {
  /** `small` (12px) beside text and in a button, the default; `medium` (16px) on its own in a row or a toolbar; `large` (24px) centred in a section that is empty while it loads. */
  size?: SpinnerSize | undefined;
  /** What the wait is, for a screen reader: "Loading", the default; "Saving", "Exporting". Beside a word that already says it, pass that word. It is said once, politely, when the spinner appears. */
  label?: string | undefined;
  /** Hide the graphic, and say nothing, when its parent already communicates the busy state: a loading Button, a region with its own status. */
  isDecorative?: boolean | undefined;
  /** `subtle`, the default, on a surface; `inverse` on a bold fill; `inherit` takes the text colour around it, for a button. */
  appearance?: "subtle" | "inverse" | "inherit" | undefined;
  /** Milliseconds before it appears; 0, the default, shows it at once. Pass about 400 for a wait that is often shorter, so a fast one never flashes a spinner. Changing a pending delay restarts the wait; once shown, it stays visible until unmounted. */
  delay?: number | undefined;
};

const appearances = { subtle: "icon-subtle", inverse: "icon-inverse", inherit: "" } as const;

/** Several spinners that appear together with one name ("Refreshing" on four charts) are said once. */
const REPEAT_WINDOW = 1000;
let lastSaid = { text: "", at: 0 };
function sayOnce(text: string) {
  const now = Date.now();
  if (text === lastSaid.text && now - lastSaid.at < REPEAT_WINDOW) return;
  lastSaid = { text, at: now };
  announce(text);
}

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
  const name = props["aria-label"] ?? label ?? t("loading");
  const labelledBy = props["aria-labelledby"];
  const silent = isDecorative || props["aria-hidden"] === true || props["aria-hidden"] === "true";
  // Said once, when it first appears: the reveal is the event a reader needs to hear.
  useEffect(() => {
    if (!shown || silent) return;
    const referenced = labelledBy
      ? labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
          .filter(Boolean)
          .join(" ")
      : "";
    sayOnce(props["aria-label"] === undefined && referenced ? referenced : name);
  }, [shown, silent]);
  if (!shown && delay > 0) return null;
  return (
    <Loader2
      role={isDecorative ? undefined : "status"}
      aria-label={isDecorative ? undefined : (label ?? t("loading"))}
      aria-hidden={isDecorative || undefined}
      {...props}
      data-slot="spinner"
      className={cn(
        "shrink-0 animate-spin motion-reduce:animate-none",
        spinnerSizes[size],
        appearances[appearance],
        className,
      )}
    />
  );
}
