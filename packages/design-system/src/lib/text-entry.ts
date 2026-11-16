/* Where typing keeps its keys. A page shortcut (a sign Button's Command+Enter, a workspace's
   decision keys) answers from anywhere but a field that takes text: there the key is the field's,
   a letter typed or a composer's own Command+Enter. A checkbox, a radio, a button or a range takes
   no text, so the shortcut still answers from it. Not a part; it lives beside `cn`. */

/** The elements that take text, besides an input of a type that does. */
const TEXT_ENTRY =
  "textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox'], [role='combobox'], [role='searchbox'], [role='spinbutton']";

/** The inputs that take no text, where a page's shortcut still answers. */
const KEY_INPUTS = new Set([
  "checkbox",
  "radio",
  "button",
  "submit",
  "reset",
  "range",
  "color",
  "file",
  "image",
]);

/** Whether a key event's target is, or sits in, a field that takes text. */
export function takesText(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLInputElement) return !KEY_INPUTS.has(target.type);
  return target.closest(TEXT_ENTRY) !== null;
}
