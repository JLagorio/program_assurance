/**
 * The control that opened a surface (a Dialog, a PickerSheet, a flow of frames), read as the surface
 * first renders, before any field takes focus, so focus can go back there when it closes: a surface
 * keeps it with `const [opener] = useState(currentOpener)` and gives it to its `finalFocus` while it
 * is still drawn. A menu item goes with its menu: the menu's trigger is the control that stays.
 */
export function currentOpener(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body) return null;
  if (active.closest('[role="menu"]'))
    return document.querySelector<HTMLElement>('[aria-haspopup="menu"][aria-expanded="true"]');
  return active;
}
