import { ArrowDown, ArrowUp, X } from "lucide-react";
import type { ComponentProps, ReactNode, Ref } from "react";
import { IconButton } from "../components/button";
import { Input } from "../components/input";
import { Text } from "../primitives/text";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

export type FindBarProps = Omit<ComponentProps<"div">, "children"> & {
  query: string;
  onQueryChange: (query: string) => void;
  count: number;
  /** Zero-based current match. Null means no current match. */
  index: number | null;
  onNavigate: (index: number) => void;
  onClose?: (() => void) | undefined;
  label?: string | undefined;
  loading?: boolean | undefined;
  /** True when the count is a lower bound. */
  truncated?: boolean | undefined;
  /** Replacement, scope or case options supplied by the host. */
  children?: ReactNode;
  inputRef?: Ref<HTMLInputElement> | undefined;
};
/** A controlled, wrapping find row. Enter/Shift+Enter cycle matches; Escape dismisses when provided. */
export function FindBar({
  query,
  onQueryChange,
  count,
  index,
  onNavigate,
  onClose,
  label,
  loading = false,
  truncated = false,
  children,
  inputRef,
  className,
  onKeyDown,
  ...props
}: FindBarProps) {
  const { t } = useLedgerLocale();
  const total = Math.max(0, Math.trunc(Number.isFinite(count) ? count : 0));
  const current =
    index === null || !Number.isFinite(index) || !total
      ? -1
      : Math.min(total - 1, Math.max(0, Math.trunc(index)));
  const move = (direction: number) => {
    if (!total || loading) return;
    onNavigate(
      current < 0 ? (direction > 0 ? 0 : total - 1) : (current + direction + total) % total,
    );
  };
  return (
    <div
      {...props}
      className={cn("flex min-w-0 flex-wrap items-center gap-100", className)}
      data-slot="find-bar"
      role="group"
      aria-label={label ?? t("find")}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229)
          return;
        if (event.key === "Escape" && onClose) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <Input
        ref={inputRef}
        size="small"
        className="min-w-0 flex-1"
        aria-label={label ?? t("find")}
        value={query}
        onValueChange={onQueryChange}
        onKeyDown={(event) => {
          if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229)
            return;
          if (event.key === "Enter" && !event.altKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            move(event.shiftKey ? -1 : 1);
          }
        }}
      />
      <Text size="small" role="status" aria-atomic="true">
        {loading ? t("loading") : t("findPosition", { index: current + 1, count: total })}
        {truncated && !loading ? "+" : ""}
      </Text>
      <div className="flex shrink-0 items-center gap-050">
        <IconButton
          size="small"
          icon={<ArrowUp />}
          label={t("findPrevious")}
          disabled={!total || loading}
          onClick={() => move(-1)}
        />
        <IconButton
          size="small"
          icon={<ArrowDown />}
          label={t("findNext")}
          disabled={!total || loading}
          onClick={() => move(1)}
        />
        {onClose && (
          <IconButton size="small" icon={<X />} label={t("findClose")} onClick={onClose} />
        )}
      </div>
      {children}
    </div>
  );
}
