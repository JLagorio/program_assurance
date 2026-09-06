import { AlignJustify, Rows3 } from "lucide-react";
import type { ReactNode } from "react";

import { ToggleGroup } from "../components/toggle";

/*
 * Row density is a table's setting, not the document's. `Table` takes `density`; a DataTable keeps
 * the reader's choice with the rest of its view and offers it as Compact rows in its Columns menu;
 * a picker's table is compact by design. density.css resolves dimension.row to its compact value
 * under `data-density="compact"` on any frame, which is what `Table density` sets. The app-wide
 * provider, script and switch of 0.5 are kept for one release as no-ops, so a product that mounted
 * them keeps rendering while `ledger/no-deprecated-name` points at the table's setting.
 */

export type Density = "default" | "compact";

/** @deprecated Density is a table's: `Table density`, or Compact rows in a DataTable's Columns menu. Nothing is stored under this key any more. */
export const DENSITY_STORAGE_KEY = "ledger.density";

/** @deprecated Density is a table's. Returns `default`. */
export function readDensity(_key?: string): Density {
  return "default";
}

/** @deprecated Density is a table's. Does nothing. */
export function writeDensity(_density: Density, _key?: string): void {
  // the setting lives with each table's view now
}

/** @deprecated Density is a table's. Does nothing. */
export function applyDensity(_density: Density, _root?: HTMLElement): void {
  // the setting lives with each table's view now
}

/** @deprecated Density is a table's. An empty script. */
export const densityScriptFor = (_key: string): string => "";

/** @deprecated Density is a table's. An empty script. */
export const densityScript = "";

/** @deprecated Density is a table's. Renders its children and touches nothing. */
export function DensityProvider({
  children,
}: {
  storageKey?: string | undefined;
  children: ReactNode;
}) {
  return <>{children}</>;
}

/** @deprecated Density is a table's. Returns `default` and a setter that does nothing. */
export function useDensity(): { density: Density; setDensity: (density: Density) => void } {
  return { density: "default", setDensity: () => undefined };
}

const densities: { value: Density; label: string; icon: typeof Rows3 }[] = [
  { value: "default", label: "Comfortable", icon: Rows3 },
  { value: "compact", label: "Compact", icon: AlignJustify },
];

/** @deprecated The control of the app-wide setting. A DataTable's Columns menu carries Compact rows; a table that is compact by design passes `density`. */
export function DensitySwitch({
  value = "default",
  onChange = () => undefined,
  showLabels = false,
  "aria-label": ariaLabel = "Row density",
  className,
}: {
  value?: Density | undefined;
  onChange?: ((density: Density) => void) | undefined;
  showLabels?: boolean | undefined;
  "aria-label"?: string | undefined;
  className?: string | undefined;
}) {
  return (
    <ToggleGroup<Density>
      aria-label={ariaLabel}
      className={className}
      value={value}
      onChange={onChange}
      items={densities.map(({ value: v, label, icon: Icon }) => ({
        value: v,
        label: (
          <>
            <Icon className="size-icon-small" />
            <span className={showLabels ? undefined : "sr-only"}>{label}</span>
          </>
        ),
      }))}
    />
  );
}
