import { ChevronDown, Layers } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

import { Button } from "../../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";

/**
 * The look of a toolbar trigger whose choice is in force: Group by with a field, Filters with a
 * filter, Metrics while open. The selected palette without `aria-pressed`, which would make a
 * menu trigger a toggle; the trigger's words say the state. Group by and Filters mark it with
 * `data-active-trigger`, Metrics with Base UI's `data-panel-open`, and forced colours key on those.
 */
export const activeTriggerClass =
  "bg-selected text-selected hover:bg-selected-hovered active:bg-selected-pressed shadow-none";

type GroupByProps<Value extends string> = Omit<
  ComponentPropsWithRef<"button">,
  "value" | "onChange" | "children"
> & {
  /** Available grouping fields. The empty string is reserved for no grouping. */
  options: ReadonlyArray<{ value: Value; label: string }>;
  value: Value | "";
  /** The caller regroups its rows; search, filters and selection keep their own state. */
  onValueChange: (value: Value | "") => void;
};

/** One toolbar menu for grouping, shared by DataTable and custom collection renderers. */
export function GroupBy<Value extends string>({
  options,
  value,
  onValueChange,
  className,
  ...props
}: GroupByProps<Value>) {
  const { t } = useLedgerLocale();
  const active = options.find((option) => option.value === value);
  if (!options.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="small"
            iconBefore={<Layers />}
            iconAfter={<ChevronDown />}
            className={cn(active && activeTriggerClass, className)}
            {...(active ? { "data-active-trigger": "" } : {})}
            {...props}
          >
            {active ? t("groupedBy", { field: active.label }) : t("groupBy")}
          </Button>
        }
      />
      <DropdownMenuContent align="start" style={{ minWidth: token("dimension.part.tableGroupBy") }}>
        <DropdownMenuRadioGroup
          aria-label={t("groupBy")}
          value={value}
          onValueChange={(next: string) => {
            if (next === "") onValueChange("");
            else {
              const option = options.find((option) => option.value === next);
              if (option) onValueChange(option.value);
            }
          }}
        >
          <DropdownMenuRadioItem value="" closeOnClick>
            {t("noGrouping")}
          </DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} closeOnClick>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
