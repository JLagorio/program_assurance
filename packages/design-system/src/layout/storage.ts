/**
 * What the shell remembers per browser: whether the side nav is collapsed and the widths the
 * reader dragged. The Shell root reads it on mount and writes it on change when `persist` is on.
 * The script applies it before the first paint, the way the mode script does, so a collapsed side
 * nav does not flash open on reload: it sets an attribute and two variables on the root element,
 * and the CSS honours them until React takes over.
 */

export const SHELL_STORAGE_KEY = "ledger.shell";

export type ShellStored = {
  collapsed?: boolean | undefined;
  sideNavWidth?: number | undefined;
  panelWidth?: number | undefined;
};

export function readShell(key: string): ShellStored | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ShellStored) : null;
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

/** Puts the stored state on the root element so the CSS can honour it: the collapsed attribute and the two width variables. */
export function applyShell(value: ShellStored): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (value.collapsed) root.dataset["shellSidenav"] = "collapsed";
  else delete root.dataset["shellSidenav"];
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
