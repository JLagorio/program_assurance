import { Check, CircleAlert, Copy } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useLedgerLocale } from "../lib/locale";
import { Button, IconButton, type ButtonProps } from "./button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/* Puts text on the clipboard: a command, a configuration, an identifier. The button keeps its name
   and its width; the result shows in a tooltip that opens by itself, as a check or an alert in the
   icon, and in a polite status for a screen reader, so a failed write is never silent. */

type CopyStatus = "idle" | "copied" | "failed";

type CopyButtonSharedProps = Omit<
  ButtonProps,
  | "children"
  | "iconBefore"
  | "iconAfter"
  | "isLoading"
  | "isSelected"
  | "variant"
  | "size"
  | "render"
  | "disabledReason"
  | "aria-label"
> & {
  /** The text put on the clipboard. */
  text: string;
  /** Secondary is the default, as on Button and IconButton; subtle beside an identifier or in a block. */
  variant?: "primary" | "secondary" | "subtle" | undefined;
  /** Medium (32px) by default for the labelled form, small (28px) for the icon-only form. */
  size?: "small" | "medium" | undefined;
  /** Called with the text once the clipboard holds it. */
  onCopied?: ((text: string) => void) | undefined;
  /** Called when the browser refuses the write (no permission, an insecure page, no clipboard). */
  onCopyError?: ((error: unknown) => void) | undefined;
};

export type CopyButtonProps = CopyButtonSharedProps &
  (
    | {
        /**
         * The icon-only form: the accessible name and the tooltip, such as "Copy ID". Name what is
         * copied when more than one copy sits on the screen.
         */
        label: string;
        children?: undefined;
      }
    | {
        label?: undefined;
        /** The visible label of the labelled form. "Copy" (the `copy` message) by default. */
        children?: ReactNode | undefined;
      }
  );

/** How long the result shows before the button returns to rest. A failure stays longer. */
const shown: Record<Exclude<CopyStatus, "idle">, number> = { copied: 2000, failed: 4000 };

/**
 * A button that copies `text` to the clipboard and says whether it worked: "Copied" or "Could not
 * copy" in a tooltip, a check or an alert in place of the icon, and a polite status message. With
 * `label` it is an icon-only IconButton; otherwise a labelled Button.
 */
export function CopyButton({
  text,
  label,
  children,
  variant = "secondary",
  size,
  onCopied,
  onCopyError,
  onClick,
  ...props
}: CopyButtonProps) {
  const { t } = useLedgerLocale();
  const [status, setStatus] = useState<CopyStatus>("idle");
  // Each result is a new line in the status region, so a second copy is heard as well.
  const [results, setResults] = useState(0);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const settle = (next: Exclude<CopyStatus, "idle">) => {
    setStatus(next);
    setResults((count) => count + 1);
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus("idle");
      setOpen(false);
    }, shown[next]);
  };
  const copy: NonNullable<ButtonProps["onClick"]> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    void Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(
        () => true,
        (error: unknown) => {
          settle("failed");
          onCopyError?.(error);
          return false;
        },
      )
      .then((copied) => {
        if (!copied) return;
        settle("copied");
        onCopied?.(text);
      });
  };
  const icon =
    status === "copied" ? (
      <Check className={variant === "primary" ? undefined : "icon-success"} />
    ) : status === "failed" ? (
      <CircleAlert className={variant === "primary" ? undefined : "icon-danger"} />
    ) : (
      <Copy />
    );
  const result =
    status === "copied" ? t("copied") : status === "failed" ? t("copyFailed") : undefined;
  const control =
    label !== undefined ? (
      <IconButton
        {...props}
        data-slot="copy-button"
        label={label}
        icon={icon}
        variant={variant}
        size={size ?? "small"}
        isTooltipDisabled
        onClick={copy}
      />
    ) : (
      <Button
        {...props}
        data-slot="copy-button"
        variant={variant}
        size={size ?? "medium"}
        iconBefore={icon}
        onClick={copy}
      >
        {children ?? t("copy")}
      </Button>
    );
  const tip = result ?? label;
  return (
    <>
      <Tooltip
        open={open && tip !== undefined}
        onOpenChange={(next) => {
          // The labelled form's name is on screen, so hover and focus open nothing until a result.
          if (next && label === undefined && result === undefined) return;
          setOpen(next);
        }}
      >
        <TooltipTrigger render={control} closeOnClick={false} />
        {tip !== undefined ? <TooltipContent>{tip}</TooltipContent> : null}
      </Tooltip>
      <span role="status" data-copy-button-status="" className="sr-only">
        {result !== undefined ? <span key={results}>{result}</span> : null}
      </span>
    </>
  );
}
