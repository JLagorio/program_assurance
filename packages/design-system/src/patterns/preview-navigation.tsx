import { cloneElement, useLayoutEffect, useRef, type ReactElement, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { IconButton, buttonVariants } from "../components/button";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Inline } from "../primitives/inline";

export type PreviewNavigationProps = {
  /** One-based position in the displayed results; zero means outside those results. */
  position: number;
  total: number;
  onPrevious?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
  /** A real anchor/router link. The application owns the record destination. */
  openLink: ReactElement<{
    children?: ReactNode;
    className?: string;
    "aria-label"?: string;
    title?: string;
  }>;
};

/** Consistent collection navigation for a preview header. No routing or row state lives here. */
export function PreviewNavigation({
  position,
  total,
  onPrevious,
  onNext,
  openLink,
}: PreviewNavigationProps) {
  const { t, formatNumber } = useLedgerLocale();
  const previousButton = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const activated = useRef<HTMLButtonElement | null>(null);
  useLayoutEffect(() => {
    const source = activated.current;
    activated.current = null;
    if (
      source?.disabled &&
      (document.activeElement === source || document.activeElement === document.body)
    ) {
      const target = [previousButton.current, nextButton.current].find(
        (button) => button && !button.disabled,
      );
      (target ?? group.current?.querySelector<HTMLAnchorElement>("a[href]"))?.focus();
    }
  }, [position, total]);
  return (
    <Inline ref={group} space="space.050" alignBlock="center" data-slot="preview-navigation">
      <span className="sr-only" role="status" aria-live="polite">
        {position > 0
          ? t("recordPosition", { position: formatNumber(position), total: formatNumber(total) })
          : t("recordOutsideResults")}
      </span>
      <IconButton
        ref={previousButton}
        isTooltipDisabled
        label={t("previousRecord")}
        variant="subtle"
        icon={<ChevronLeft />}
        disabled={position <= 1 || !onPrevious}
        onClick={() => {
          activated.current = previousButton.current;
          onPrevious?.();
        }}
      />
      <IconButton
        ref={nextButton}
        isTooltipDisabled
        label={t("nextRecord")}
        variant="subtle"
        icon={<ChevronRight />}
        disabled={position <= 0 || position >= total || !onNext}
        onClick={() => {
          activated.current = nextButton.current;
          onNext?.();
        }}
      />
      {cloneElement(openLink, {
        "aria-label": t("openFullRecord"),
        title: t("openFullRecord"),
        className: cn(
          buttonVariants({ variant: "subtle", size: "small" }),
          "size-control-small shrink-0 px-0",
          openLink.props.className,
        ),
        children: <ExternalLink aria-hidden="true" />,
      })}
    </Inline>
  );
}
