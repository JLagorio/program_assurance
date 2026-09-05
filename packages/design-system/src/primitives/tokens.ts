import { classByToken, type ClassToken } from "../generated/classes";
import { spaceClasses, bleedClasses, bleedTokens, type BleedToken, type SpaceToken } from "../generated/space";

export type { SpaceToken, BleedToken, ClassToken };
export { spaceClasses, bleedClasses, bleedTokens };
export type { LayoutElement, TextElement, HeadingElement } from "./_elements";

/** Background tokens a Box may paint: semantic backgrounds and elevation surfaces. */
export type BackgroundToken = Extract<
  ClassToken,
  | `color.background.${string}`
  | "elevation.surface"
  | `elevation.surface.${string}`
  | "color.blanket"
  | "color.skeleton"
  | `color.skeleton.${string}`
  | "utility.elevation.surface.current"
>;

/** Text colour tokens. */
export type TextColorToken = Extract<ClassToken, "color.text" | `color.text.${string}`>;

/** The colours a Heading may take: the text colour, or its inverse on a bold fill. A tone is for a word, not a title. */
export type HeadingColorToken = Extract<
  TextColorToken,
  "color.text" | "color.text.inverse" | "color.text.warning.inverse"
>;

export const classFor = (token: ClassToken): string => classByToken[token];

/** True when the token is a surface, in which case the element publishes it as the current surface. */
export const isSurface = (token: string) => token === "elevation.surface" || token.startsWith("elevation.surface.");

/** The text colour a bold fill needs: inverse on every bold, bolder and boldest; the warning bold is light, so its own inverse. */
export const inverseFor = (token: string): TextColorToken | undefined =>
  token.startsWith("color.background.warning.bold")
    ? "color.text.warning.inverse"
    : /\.bold(er|est)?(\.|$)/.test(token)
      ? "color.text.inverse"
      : undefined;
