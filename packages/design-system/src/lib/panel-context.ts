import { createContext } from "react";

/** Set inside a Panel: whether its body is flush. The Inspector reads it to drop its stickiness and run its rules edge to edge. Not a part; it lives beside `cn`. */
export const PanelContext = createContext<{ flush: boolean } | null>(null);
