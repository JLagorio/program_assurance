/**
 * What the shell remembers per browser: whether the side nav is collapsed and the widths the
 * reader dragged. The Shell root reads it on mount and writes it on change when `persist` is on.
 * The script applies it before the first paint, the way the mode script does, so a collapsed side
 * nav does not flash open on reload: it sets an attribute and two variables on the root element,
 * and the CSS honours them until React takes over and removes the attribute.
 */

export const SHELL_STORAGE_KEY = "ledger.shell";

export type ShellStored = {
  collapsed?: boolean | undefined;
  sideNavWidth?: number | undefined;
  panelWidth?: number | undefined;
};

/** A stored width is a positive number of pixels; anything else is dropped. The bounds (the area's minimum, half the viewport) are the shell's and apply on restore. */
const storedWidth = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.round(value) : undefined;

/** What the browser remembers, or null. A value that is not the shape written here (edited by hand, another version, another product on the same key) yields only the fields that are. */
export function parseStoredShell(raw: string | null): ShellStored | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const s = parsed as Record<string, unknown>;
    return {
      collapsed: typeof s["collapsed"] === "boolean" ? s["collapsed"] : undefined,
      sideNavWidth: storedWidth(s["sideNavWidth"]),
      panelWidth: storedWidth(s["panelWidth"]),
    };
  } catch {
    return null;
  }
}

export function readShell(key: string): ShellStored | null {
  try {
    return parseStoredShell(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function writeShell(key: string, value: ShellStored): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A private window, or storage turned off: the shell still works, it just forgets.
  }
}

/** Puts the stored widths on the root element so the CSS can honour them, and takes the collapsed attribute off: once React owns the side nav, the attribute's rule (unlayered `display: none`) would beat the flyout's utilities. The head script sets it again before the next paint. */
export function applyShell(value: ShellStored): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  delete root.dataset["shellSidenav"];
  if (value.sideNavWidth)
    root.style.setProperty("--shell-sidenav-stored", `${value.sideNavWidth}px`);
  else root.style.removeProperty("--shell-sidenav-stored");
  if (value.panelWidth) root.style.setProperty("--shell-panel-stored", `${value.panelWidth}px`);
  else root.style.removeProperty("--shell-panel-stored");
}

/** The before-paint script for the document head, for a custom storage key. */
export const shellScriptFor = (key: string): string =>
  `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(key)})||"null");if(!s)return;var d=document.documentElement;if(s.collapsed)d.dataset.shellSidenav="collapsed";if(s.sideNavWidth)d.style.setProperty("--shell-sidenav-stored",s.sideNavWidth+"px");if(s.panelWidth)d.style.setProperty("--shell-panel-stored",s.panelWidth+"px");}catch(e){}})();`;

/** The before-paint script for the default key. */
export const shellScript = shellScriptFor(SHELL_STORAGE_KEY);
