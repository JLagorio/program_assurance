import {
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";

/**
 * How the Aside shows: `rail` beside Main or following it, its content always open; `disclosure`
 * where it was rendered in the page, folded under one Details row (below the aside breakpoint,
 * wherever it would not sit beside Main).
 */
export type AsideDisplay = "rail" | "disclosure";

export const SlotsContext = createContext<{
  aside: HTMLDivElement | null;
  panel: HTMLDivElement | null;
  opener: RefObject<HTMLElement | null>;
  /** How the Aside shows now. */
  asideDisplay: AsideDisplay;
  /** Where the Aside was rendered in the page: its disclosure shows there. */
  setAsideMarker: Dispatch<SetStateAction<HTMLElement | null>>;
  /** A marker leaving the page: the Aside's content goes back to the shell's slot first. */
  releaseAsideMarker: (node: HTMLElement) => void;
} | null>(null);

/** Renders a route's contribution into the shell's stable area for it, so the route's React context and state travel with it and unmounting the route removes it. Outside a Shell the children render in place. */
export function AreaPortal({ name, children }: { name: "aside" | "panel"; children: ReactNode }) {
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
