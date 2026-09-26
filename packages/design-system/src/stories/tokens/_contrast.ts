/* Contrast measured in the browser, from computed colours: the same maths as test/contrast.test.mjs
   (oklch to linear sRGB, alpha composited in encoded sRGB, then WCAG luminance), so a story can
   show and assert what the reader actually gets in the mode and contrast the toolbar sets. */

type Rgba = { r: number; g: number; b: number; a: number };

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const encode = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

function fromOklch(L: number, C: number, H: number, a: number): Rgba {
  return fromOklab(L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180), a);
}

function fromOklab(L: number, A: number, B: number, a: number): Rgba {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a,
  };
}

/**
 * A computed colour (`oklch(…)`, `oklab(…)`, as a transition interpolates, `rgb(…)`, `rgba(…)`) in
 * linear sRGB, or null when unreadable.
 */
export function parseColor(css: string): Rgba | null {
  const alpha = (v: string | undefined) =>
    v === undefined ? 1 : v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v);
  const lab = css.match(
    /oklab\(\s*([\d.]+%?)\s+(-?[\d.e-]+)\s+(-?[\d.e-]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/,
  );
  if (lab) {
    const [, L = "0", A = "0", B = "0", alphaValue] = lab;
    const lightness = L.endsWith("%") ? parseFloat(L) / 100 : parseFloat(L);
    return fromOklab(lightness, parseFloat(A), parseFloat(B), alpha(alphaValue));
  }
  const ok = css.match(
    /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+|none)(?:\s*\/\s*([\d.]+%?))?\s*\)/,
  );
  if (ok) {
    const [, L = "0", C = "0", H = "0", A] = ok;
    const lightness = L.endsWith("%") ? parseFloat(L) / 100 : parseFloat(L);
    return fromOklch(lightness, parseFloat(C), H === "none" ? 0 : parseFloat(H), alpha(A));
  }
  const rgb = css.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/,
  );
  if (rgb) {
    const [, r = "0", g = "0", b = "0", A] = rgb;
    return {
      r: decode(parseFloat(r) / 255),
      g: decode(parseFloat(g) / 255),
      b: decode(parseFloat(b) / 255),
      a: alpha(A),
    };
  }
  return null;
}

const over = (fg: Rgba, bg: Rgba): Rgba => ({
  r: decode(fg.a * encode(fg.r) + (1 - fg.a) * encode(bg.r)),
  g: decode(fg.a * encode(fg.g) + (1 - fg.a) * encode(bg.g)),
  b: decode(fg.a * encode(fg.b) + (1 - fg.a) * encode(bg.b)),
  a: 1,
});
const luminance = (c: Rgba) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

/**
 * What is painted behind `el`, from `el` itself upwards: every translucent background composited
 * in order onto the first opaque one (the page surface when none is found), so a fill on a dark
 * surface reads as it does on screen.
 */
export function backdrop(el: Element): Rgba {
  const layers: Rgba[] = [];
  let base: Rgba | null = null;
  for (let node: Element | null = el; node && !base; node = node.parentElement) {
    const parsed = parseColor(getComputedStyle(node).backgroundColor);
    if (!parsed || parsed.a === 0) continue;
    if (parsed.a < 1) layers.push(parsed);
    else base = parsed;
  }
  base ??= parseColor(
    getComputedStyle(document.documentElement).getPropertyValue("--ds-elevation-surface"),
  ) ?? { r: 1, g: 1, b: 1, a: 1 };
  return layers.reduceRight((below, layer) => over(layer, below), base);
}

/** WCAG contrast of `fg`, composited over `behind` when translucent, against `behind`. */
export function contrastRatio(fg: string, behind: Rgba): number {
  const front = parseColor(fg);
  if (!front) return Number.NaN;
  const solidFront = front.a < 1 ? over(front, behind) : front;
  const [hi, lo] = [luminance(solidFront), luminance(behind)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/** Resolves once the colour transitions under `root` have run, so a measure reads the end state. */
export async function settled(root: Element): Promise<void> {
  await Promise.all(
    root.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
  );
}

/** What part of an element carries the colour being measured. */
export type Paint = "border" | "background" | "text" | "outline";

/**
 * The element's paint against the surface behind it (its parent's, for a fill, a boundary or a
 * focus ring, which is drawn outside the element on what surrounds it).
 */
export function measure(el: Element, paint: Paint): number {
  const style = getComputedStyle(el);
  const colour =
    paint === "border"
      ? style.borderTopColor
      : paint === "background"
        ? style.backgroundColor
        : paint === "outline"
          ? style.outlineColor
          : style.color;
  const behind = paint === "text" ? backdrop(el) : backdrop(el.parentElement ?? el);
  return contrastRatio(colour, behind);
}

/** "3.9:1", or an en dash when the colour could not be read. */
export const formatRatio = (ratio: number) =>
  Number.isFinite(ratio) ? `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1` : "–";
