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
            // Base UI marks an open Collapsible's trigger `data-panel-open`: the active look Group by
            // and Filters take (activeTriggerClass), written out so each class is in the source.
            "data-panel-open:bg-selected data-panel-open:text-selected data-panel-open:shadow-none data-panel-open:hover:bg-selected-hovered data-panel-open:active:bg-selected-pressed",
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
