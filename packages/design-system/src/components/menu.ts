/* The shared look of every floating list: DropdownMenu, Select, Command, Combobox. One place, so a
   menu and a select cannot drift apart. */

/** The floating surface. */
export const menuSurface =
  "relative z-50 overflow-hidden rounded-large border border-default bg-surface-overlay p-050 shadow-overlay outline-none";

/**
 * Compact rows grow taller for a description line or an avatar. A label stays on one line: the
 * list is as wide as its longest label, within the space the window leaves, and a label wider than
 * that ends in an ellipsis (`menuItemLabel`) instead of being cut mid-word.
 */
export const menuItem =
  "flex min-h-row-menu w-full cursor-default select-none items-center gap-100 rounded-medium px-100 py-050 text-start font-body text-default outline-none transition-colors duration-fast ease-standard";

/**
 * The row under the pointer or the keyboard. The tint alone is about 1.1:1, so the row the keyboard
 * is on also draws the inset focus outline: on `:focus-visible` where the list moves focus to its
 * rows (DropdownMenu, Select), and on the highlight itself where focus stays in the input and the
 * row is the active descendant (Combobox, SearchDialog; CommandItem draws the same outline on its
 * selected row while the field has focus). The row under the pointer keeps the tint alone, since
 * the pointer already shows where it is. In forced colours the row is Highlight
 * (forced-colors.css).
 */
export const menuItemHighlighted =
  "data-[highlighted]:bg-neutral-subtle-hovered focus-visible:[&:not(:hover)]:outline-field-focused data-[slot=combobox-item]:data-[highlighted]:[&:not(:hover)]:outline-field-focused data-[slot=search-dialog-result]:data-[highlighted]:[&:not(:hover)]:outline-field-focused";

/** A committed choice remains distinct from pointer/keyboard highlight. */
export const menuChoiceSelected =
  "data-selected:bg-selected data-selected:text-selected data-selected:data-highlighted:bg-selected-hovered";

/** The row that is the current choice. */
export const menuItemSelected = "bg-selected text-selected";

export const menuItemDisabled = "data-[disabled]:pointer-events-none data-[disabled]:text-disabled";

/** A row's label: one line that gives way with an ellipsis when the list reaches the window's edge. */
export const menuItemLabel = "min-w-0 truncate";

/** A row's second line: a short description, or why the row is unavailable. It wraps and stays
    readable on a disabled row, because it is the explanation. */
export const menuItemDescription =
  "block whitespace-normal break-words font-body-small text-subtle";

/** A section heading inside the list. */
export const menuLabel = "px-100 pb-050 pt-075 font-heading-xxsmall uppercase text-subtlest";

/** A hairline between sections. */
export const menuSeparator = "my-050 border-t border-default";
