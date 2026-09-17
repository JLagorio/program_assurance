import { cloneElement, type ReactElement, type ReactNode } from "react";
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
  return (
    <Inline space="space.050" alignBlock="center" data-slot="preview-navigation">
      <span className="sr-only" role="status" aria-live="polite">
        {position > 0
          ? t("recordPosition", { position: formatNumber(position), total: formatNumber(total) })
          : t("recordOutsideResults")}
      </span>
      <IconButton
        label={t("previousRecord")}
        variant="subtle"
        icon={<ChevronLeft />}
        disabled={position <= 1 || !onPrevious}
        onClick={onPrevious}
      />
      <IconButton
        label={t("nextRecord")}
        variant="subtle"
        icon={<ChevronRight />}
        disabled={position <= 0 || position >= total || !onNext}
        onClick={onNext}
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
