import { classByToken, type ClassToken } from "../generated/classes";
import { spaceClasses, bleedClasses, type SpaceToken } from "../generated/space";

export type { SpaceToken, ClassToken };
export { spaceClasses, bleedClasses };

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

export const classFor = (token: ClassToken): string => classByToken[token];

/** True when the token is a surface, in which case the element publishes it as the current surface. */
export const isSurface = (token: string) => token === "elevation.surface" || token.startsWith("elevation.surface.");
