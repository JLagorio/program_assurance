import { createContext, useContext, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export const SlotsContext = createContext<{
  aside: HTMLDivElement | null;
  panel: HTMLDivElement | null;
  opener: RefObject<HTMLElement | null>;
} | null>(null);

/** Stable destinations preserve route context and state. Unmounting a route removes its contribution. */
export function Slot({ name, children }: { name: "aside" | "panel"; children: ReactNode }) {
  const slots = useContext(SlotsContext);
  if (!slots) return children;
  const target = slots[name];
  return target ? createPortal(children, target) : null;
}
