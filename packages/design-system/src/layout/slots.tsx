import { createContext, useContext, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export const SlotsContext = createContext<{
  aside: HTMLDivElement | null;
  panel: HTMLDivElement | null;
  opener: RefObject<HTMLElement | null>;
} | null>(null);

/** Renders a route's contribution into the shell's stable area for it, so the route's React context and state travel with it and unmounting the route removes it. Outside a Shell the children render in place. */
export function AreaPortal({ name, children }: { name: "aside" | "panel"; children: ReactNode }) {
  const slots = useContext(SlotsContext);
  if (!slots) return children;
  const target = slots[name];
  return target ? createPortal(children, target) : null;
}
