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
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";

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
            className={cn(
              active &&
                "bg-selected text-selected hover:bg-selected-hovered active:bg-selected-pressed shadow-none",
              className,
            )}
            {...props}
          >
            {active ? t("groupedBy", { field: active.label }) : t("groupBy")}
          </Button>
        }
      />
      <DropdownMenuContent align="start" style={{ minWidth: 200 }}>
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
