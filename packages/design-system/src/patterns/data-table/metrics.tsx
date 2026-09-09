import { BarChart3 } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  type CollapsibleContentProps,
  type CollapsibleProps,
} from "../../components/collapsible";

import { Button, type ButtonProps } from "../../components/button";

import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";

/** Optional table summaries. Closed by default; open and onOpenChange give the caller state ownership. */
export function Metrics(props: CollapsibleProps) {
  return <Collapsible data-slot="data-table-metrics" {...props} />;
}

type MetricsTriggerProps = ComponentPropsWithRef<"button"> & Pick<ButtonProps, "size" | "variant">;

/** A toolbar action that expands the metrics region without changing the table's state. */
export function MetricsTrigger({
  children,
  className,
  size = "small",
  variant = "secondary",
  ...props
}: MetricsTriggerProps) {
  const { t } = useLedgerLocale();
  return (
    <CollapsibleTrigger
      render={
        <Button
          data-slot="data-table-metrics-trigger"
          size={size}
          variant={variant}
          iconBefore={<BarChart3 />}
          className={cn(
            "data-open:bg-selected data-open:text-selected data-open:shadow-none data-open:hover:bg-selected-hovered data-open:active:bg-selected-pressed",
            className,
          )}
          {...props}
        >
          {children ?? t("metrics")}
        </Button>
      }
    ></CollapsibleTrigger>
  );
}

/** Summary content below the toolbar. The app supplies the cards and their calculations. */
export function MetricsContent({ className, ...props }: CollapsibleContentProps) {
  const { t } = useLedgerLocale();
  return (
    <CollapsibleContent
      data-slot="data-table-metrics-content"
      role="region"
      aria-label={t("metrics")}
      className={cn("border-b border-default bg-surface-sunken", className)}
      {...props}
    ></CollapsibleContent>
  );
}
