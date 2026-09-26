import { createContext, useContext, type ReactNode } from "react";

/* The heading-level context: which level, h1 to h6, a heading placed here takes. A part that
   renders a heading (Heading, PageHeader.Title, Section.Title, Shell.Panel.Title, CollapsibleHeader,
   AccordionTrigger, Inspector.Group, Item.Group, Related, EmptyTitle) reads it and falls back to
   its own default when no provider is above it, so a page without one renders as it always has.
   A titled Section and Shell.Panel.Body provide the next level to what they hold. Context follows
   the React tree, portals included: content portalled into another region keeps the level where
   it is rendered, so a portal that starts a new outline wraps its content in a provider. */

/** A heading's level: 1 is the page's title, 2 a section under it, down to 6. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const HeadingLevelContext = createContext<HeadingLevel | undefined>(undefined);

/** One level below, no deeper than 6. */
export function nextHeadingLevel(level: HeadingLevel): HeadingLevel {
  return Math.min(level + 1, 6) as HeadingLevel;
}

/** The element for a level: `h1` to `h6`. */
export function headingTag(level: HeadingLevel) {
  return `h${level}` as const;
}

export type HeadingLevelProviderProps = {
  /** The level a heading placed directly inside takes, 1 to 6. Leave it out to go one below the surrounding level; outside every provider the surrounding level is the page title's, so the first provider gives 2. */
  level?: HeadingLevel | undefined;
  children?: ReactNode | undefined;
};

/** Sets the heading level for everything inside: `level` to start an outline (a portalled region, a dialog's body), or nothing to go one level below the surrounding one. */
export function HeadingLevelProvider({ level, children }: HeadingLevelProviderProps) {
  const surrounding = useContext(HeadingLevelContext);
  const value = level ?? nextHeadingLevel(surrounding ?? 1);
  return <HeadingLevelContext.Provider value={value}>{children}</HeadingLevelContext.Provider>;
}

/** For the kit's parts: sets the level as given, `undefined` included, so a part can keep one element tree whether or not it changes the level (a Section whose title mounts later). Not exported from the package. */
export function HeadingLevelScope({
  level,
  children,
}: {
  level: HeadingLevel | undefined;
  children?: ReactNode | undefined;
}) {
  return <HeadingLevelContext.Provider value={level}>{children}</HeadingLevelContext.Provider>;
}

/** The level a heading placed here takes, or `undefined` outside every provider, where each part keeps its own default. */
export function useHeadingLevel(): HeadingLevel | undefined {
  return useContext(HeadingLevelContext);
}
