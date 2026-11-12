/** The type an element renders with, read from the page: its element, size, line height, weight
    and tracking (in px, to the thousandth). A title on the heading ramp is checked against it, so a
    part that moves onto Heading keeps exactly what it drew. */
export function typeOf(element: Element) {
  const style = getComputedStyle(element);
  return {
    tag: element.tagName,
    size: style.fontSize,
    lineHeight: style.lineHeight,
    weight: style.fontWeight,
    tracking: Math.round(parseFloat(style.letterSpacing) * 1000) / 1000,
  };
}

/** The ramp's four styles as they render at the browser's default text size. */
export const ramp = {
  display: { size: "32px", lineHeight: "40px", weight: "600", tracking: -0.64 },
  page: { size: "24px", lineHeight: "30px", weight: "600", tracking: -0.36 },
  overlay: { size: "17px", lineHeight: "24px", weight: "600", tracking: -0.255 },
  section: { size: "15px", lineHeight: "22px", weight: "600", tracking: -0.225 },
} as const;
