import { useLedgerLocale } from "../lib/locale";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { ToggleGroup, ToggleGroupItem, type ToggleGroupProps } from "../components/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";

/**
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

/** Stores the choice and says whether storage took it. */
function store(mode: ColorMode, key: string): boolean {
  try {
    if (mode === "system") localStorage.removeItem(key);
    else localStorage.setItem(key, mode);
    return true;
  } catch {
    return false;
  }
}

/** Stores the choice; "system" clears it. */
export function writeMode(mode: ColorMode, key: string = MODE_STORAGE_KEY): void {
  store(mode, key);
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

/* The choice is an external store: storage is the source, so the switch shows the stored mode
   from the first client render (the server renders System), a provider hears another on the page
   with the same key, and a tab hears another tab's choice through the storage event. */

/** A choice storage refused (a private window, blocked site data): it lives for the page. */
const unstored = new Map<string, ColorMode>();
/** The providers on this page, by key, told when one of them changes the choice. */
const listeners = new Map<string, Set<() => void>>();

const snapshot = (key: string): ColorMode => unstored.get(key) ?? readMode(key);

function subscribe(key: string, listener: () => void) {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(listener);
  // Another tab chose: this page takes the same mode. A cleared storage has a null key.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== key) return;
    applyMode(snapshot(key));
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    set.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const darkQuery = "(prefers-color-scheme: dark)";
function subscribeSystem(listener: () => void) {
  const query = window.matchMedia(darkQuery);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
const systemIsDark = () => window.matchMedia(darkQuery).matches;
const serverMode = (): ColorMode => "system";
const serverDark = () => false;

/**
 * Owns the choice. Renders nothing itself. It reads the stored mode as an external store, so the
 * switch shows the reader's choice from the first client render and follows a change made in
 * another tab; on mount it applies the stored mode (a no-op after the before-paint script), and
 * every change is stored and applied at once.
 */
export function ModeProvider({
  storageKey = MODE_STORAGE_KEY,
  children,
}: {
  storageKey?: string | undefined;
  children: ReactNode;
}) {
  const subscribeMode = useCallback(
    (listener: () => void) => subscribe(storageKey, listener),
    [storageKey],
  );
  const mode = useSyncExternalStore(subscribeMode, () => snapshot(storageKey), serverMode);
  const systemDark = useSyncExternalStore(subscribeSystem, systemIsDark, serverDark);

  useEffect(() => {
    applyMode(snapshot(storageKey));
  }, [storageKey]);

  const setMode = useCallback(
    (next: ColorMode) => {
      if (store(next, storageKey)) unstored.delete(storageKey);
      else unstored.set(storageKey, next);
      applyMode(next);
      for (const listener of listeners.get(storageKey) ?? []) listener();
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

/** Each mode's icon and the locale message that names it (Light, Dark, System by default). */
const modes: {
  value: ColorMode;
  message: "lightMode" | "darkMode" | "systemMode";
  icon: typeof Sun;
}[] = [
  { value: "light", message: "lightMode", icon: Sun },
  { value: "dark", message: "darkMode", icon: Moon },
  { value: "system", message: "systemMode", icon: Monitor },
];

/**
 * The switch takes its ToggleGroup's props too (its native props, `ref`, `disabled`, `size`, which
 * is `small` by default), except the group's value, which is one mode: `value` and `onChange`.
 */
export type ModeSwitchProps = Omit<
  ToggleGroupProps<ColorMode>,
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "multiple"
  | "onChange"
  | "children"
  | "aria-label"
  | "className"
> & {
  /** The mode shown as chosen. Unsaid, the provider's. */
  value?: ColorMode | undefined;
  /** Called with the chosen mode. Unsaid, the choice goes to the provider, unless `value` is given. */
  onChange?: ((mode: ColorMode) => void) | undefined;
  /** Text beside each icon. Off in chrome, on in a settings form. */
  showLabels?: boolean | undefined;
  /** The group's name: the locale's "Appearance" by default. */
  "aria-label"?: string | undefined;
  className?: string | undefined;
};

/**
 * The three-state control: light, dark, match the system. Reads the provider; `value` and `onChange`
 * override it, for a settings form that commits later or for a story. Icons only, each item's name
 * shows in a tooltip on hover and keyboard focus, as an IconButton's does.
 */
export function ModeSwitch({
  value,
  onChange,
  showLabels = false,
  "aria-label": ariaLabel,
  className,
  ...props
}: ModeSwitchProps) {
  const { t } = useLedgerLocale();
  const ctx = useContext(ModeContext);
  const current = value ?? ctx?.mode ?? "system";
  const change = onChange ?? (value === undefined ? ctx?.setMode : undefined) ?? (() => undefined);
  return (
    <ToggleGroup<ColorMode>
      size="small"
      {...props}
      aria-label={ariaLabel ?? t("colorMode")}
      className={className}
      value={[current]}
      onValueChange={([next]) => {
        if (next !== undefined) change(next);
      }}
    >
      {modes.map(({ value: v, message, icon: Icon }) => {
        const name = t(message);
        const item = (key?: string) => (
          <ToggleGroupItem key={key} value={v}>
            <Icon className="size-icon-small" aria-hidden />
            <span className={showLabels ? undefined : "sr-only"}>{name}</span>
          </ToggleGroupItem>
        );
        return showLabels ? (
          item(v)
        ) : (
          <Tooltip key={v}>
            <TooltipTrigger render={item()} />
            <TooltipContent>{name}</TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}
