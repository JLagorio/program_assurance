import { createContext, useContext, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/**
 * How the Aside shows: `rail`, its content always open, at the body's end; `disclosure`, folded
 * under one Details row above the body. An AsideLayout chooses from its own width.
 */
export type AsideDisplay = "rail" | "disclosure";

export const SlotsContext = createContext<{
  panel: HTMLDivElement | null;
  opener: RefObject<HTMLElement | null>;
} | null>(null);

/** Renders a route's contribution into the shell's stable area for it, so the route's React context and state travel with it and unmounting the route removes it. Outside a Shell the children render in place. */
export function AreaPortal({ name, children }: { name: "panel"; children: ReactNode }) {
  const slots = useContext(SlotsContext);
  if (!slots) return children;
  const target = slots[name];
  return target ? createPortal(children, target) : null;
}

/**
 * The Details disclosure's heading while an Aside shows as one, else null. An Inspector.Group of
 * the same name inside it is the disclosure's own content: its title, which would repeat the
 * disclosure's, steps aside.
 */
export const AsideDisclosureContext = createContext<string | null>(null);
export const useAsideDisclosure = () => useContext(AsideDisclosureContext);

/**
 * Whether the content sits in an Aside shown as the rail. The rail pads only its bottom: an
 * Inspector's groups there run its full width, each with the gutter inside its own row.
 */
export const AsideRailContext = createContext(false);
export const useAsideRail = () => useContext(AsideRailContext);

/**
 * How the AsideLayout around an Aside shows it, from the layout's own width; null outside one,
 * where the Aside is the rail in place.
 */
export const AsideLayoutContext = createContext<AsideDisplay | null>(null);
