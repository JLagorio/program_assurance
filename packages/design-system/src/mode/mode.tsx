import { Monitor, Moon, Sun } from "lucide-react";
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
 * The colour mode. tokens.css and base.css read `data-color-mode` on the root: "light" and "dark" pin a
 * mode; no attribute lets prefers-color-scheme decide. Three parts: the storage functions, a script that
 * applies the stored choice before first paint, and a provider with the three-state control. The mode
 * is per browser (localStorage), never per account, so a shared machine keeps each person's choice.
 */

export type ColorMode = "light" | "dark" | "system";

export const MODE_STORAGE_KEY = "ledger.color-mode";

/** The stored choice; "system" when nothing is stored or storage is unavailable. */
export function readMode(key: string = MODE_STORAGE_KEY): ColorMode {
  try {
    const v = localStorage.getItem(key);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/** Stores the choice; "system" clears it. */
export function writeMode(mode: ColorMode, key: string = MODE_STORAGE_KEY): void {
  try {
    if (mode === "system") localStorage.removeItem(key);
    else localStorage.setItem(key, mode);
  } catch {
    // storage unavailable: the choice lives for the page
  }
}

/** Sets or removes `data-color-mode` on the root. */
export function applyMode(mode: ColorMode, root: HTMLElement = document.documentElement): void {
  if (mode === "system") delete root.dataset["colorMode"];
  else root.dataset["colorMode"] = mode;
}

/**
 * The before-paint script for a custom storage key. Put it in the document head, before the stylesheet
 * is applied to anything, so the first paint already has the stored mode and nothing flashes.
 */
export const modeScriptFor = (key: string): string =>
  `(function(){try{var m=localStorage.getItem(${JSON.stringify(key)});if(m==="light"||m==="dark")document.documentElement.dataset.colorMode=m;}catch(e){}})();`;

/** The before-paint script for the default key. */
export const modeScript = modeScriptFor(MODE_STORAGE_KEY);

type ModeContextValue = {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  /** What is on screen: the mode, or the system's answer when the mode is "system". */
  resolved: "light" | "dark";
};

const ModeContext = createContext<ModeContextValue | null>(null);

/**
 * Owns the choice. Renders nothing itself; on mount it reads storage and applies it (a no-op after the
 * before-paint script), and every change is stored and applied at once.
 */
export function ModeProvider({
  storageKey = MODE_STORAGE_KEY,
  children,
}: {
  storageKey?: string | undefined;
  children: ReactNode;
}) {
  const [mode, setModeState] = useState<ColorMode>("system");
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const stored = readMode(storageKey);
    setModeState(stored);
    applyMode(stored);
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(query.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [storageKey]);

  const setMode = useCallback(
    (next: ColorMode) => {
      setModeState(next);
      writeMode(next, storageKey);
      applyMode(next);
    },
    [storageKey],
  );

  const value = useMemo<ModeContextValue>(
    () => ({ mode, setMode, resolved: mode === "system" ? (systemDark ? "dark" : "light") : mode }),
    [mode, setMode, systemDark],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

/** The current mode and its setter. Throws outside a ModeProvider. */
export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode needs a ModeProvider above it.");
  return ctx;
}

const modes: { value: ColorMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/**
 * The three-state control: light, dark, match the system. Reads the provider; `value` and `onChange`
 * override it, for a settings form that commits later or for a story.
 */
export function ModeSwitch({
  value,
  onChange,
  showLabels = false,
  "aria-label": ariaLabel = "Colour mode",
  className,
}: {
  value?: ColorMode | undefined;
  onChange?: ((mode: ColorMode) => void) | undefined;
  /** Text beside each icon. Off in chrome, on in a settings form. */
  showLabels?: boolean | undefined;
  "aria-label"?: string | undefined;
  className?: string | undefined;
}) {
  const ctx = useContext(ModeContext);
  const current = value ?? ctx?.mode ?? "system";
  const change = onChange ?? ctx?.setMode ?? (() => undefined);
  return (
    <ToggleGroup<ColorMode>
      aria-label={ariaLabel}
      className={className}
      value={current}
      onChange={change}
      items={modes.map(({ value: v, label, icon: Icon }) => ({
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
