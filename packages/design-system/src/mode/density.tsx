import { AlignJustify, Rows3 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ToggleGroup } from "../components/toggle";

/*
 * The row density. density.css reads `data-density` on the root: "compact" resolves
 * `dimension.row` to `dimension.row.compact`, so every table in the app follows one setting and no
 * table takes a density prop. The same three parts as the colour mode: storage, a before-paint
 * script, a provider with the control. Per browser, never per account. A table that is compact by
 * design (a picker's) sets the attribute on its own frame instead.
 */

export type Density = "default" | "compact";

export const DENSITY_STORAGE_KEY = "ledger.density";

/** The stored choice; "default" when nothing is stored or storage is unavailable. */
export function readDensity(key: string = DENSITY_STORAGE_KEY): Density {
  try {
    return localStorage.getItem(key) === "compact" ? "compact" : "default";
  } catch {
    return "default";
  }
}

/** Stores the choice; "default" clears it. */
export function writeDensity(density: Density, key: string = DENSITY_STORAGE_KEY): void {
  try {
    if (density === "default") localStorage.removeItem(key);
    else localStorage.setItem(key, density);
  } catch {
    // storage unavailable: the choice lives for the page
  }
}

/** Sets or removes `data-density` on the root. */
export function applyDensity(density: Density, root: HTMLElement = document.documentElement): void {
  if (density === "default") delete root.dataset["density"];
  else root.dataset["density"] = density;
}

/** The before-paint script for a custom storage key; put it in the document head beside the mode script. */
export const densityScriptFor = (key: string): string =>
  `(function(){try{if(localStorage.getItem(${JSON.stringify(key)})==="compact")document.documentElement.dataset.density="compact";}catch(e){}})();`;

/** The before-paint script for the default key. */
export const densityScript = densityScriptFor(DENSITY_STORAGE_KEY);

type DensityContextValue = { density: Density; setDensity: (density: Density) => void };

const DensityContext = createContext<DensityContextValue | null>(null);

/** Owns the choice: reads storage on mount (a no-op after the before-paint script), stores and applies every change. */
export function DensityProvider({
  storageKey = DENSITY_STORAGE_KEY,
  children,
}: {
  storageKey?: string | undefined;
  children: ReactNode;
}) {
  const [density, setDensityState] = useState<Density>("default");

  useEffect(() => {
    const stored = readDensity(storageKey);
    setDensityState(stored);
    applyDensity(stored);
  }, [storageKey]);

  const setDensity = useCallback(
    (next: Density) => {
      setDensityState(next);
      writeDensity(next, storageKey);
      applyDensity(next);
    },
    [storageKey],
  );

  const value = useMemo<DensityContextValue>(
    () => ({ density, setDensity }),
    [density, setDensity],
  );
  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

/** The current density and its setter. Throws outside a DensityProvider. */
export function useDensity(): DensityContextValue {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error("useDensity needs a DensityProvider above it.");
  return ctx;
}

const densities: { value: Density; label: string; icon: typeof Rows3 }[] = [
  { value: "default", label: "Comfortable", icon: Rows3 },
  { value: "compact", label: "Compact", icon: AlignJustify },
];

/** The two-state control. Reads the provider; `value` and `onChange` override it, for a settings form or a story. */
export function DensitySwitch({
  value,
  onChange,
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
  const ctx = useContext(DensityContext);
  const current = value ?? ctx?.density ?? "default";
  const change = onChange ?? ctx?.setDensity ?? (() => undefined);
  return (
    <ToggleGroup<Density>
      aria-label={ariaLabel}
      className={className}
      value={current}
      onChange={change}
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
