/* The shared look of every floating list: DropdownMenu, Select, Command, Combobox. One place, so a
   menu and a select cannot drift apart. */

/** The floating surface. */
export const menuSurface =
  "z-50 overflow-hidden rounded-large border border-default bg-surface-overlay p-050 shadow-overlay outline-none";

/** Compact rows grow for wrapped labels, descriptions and avatars. */
export const menuItem =
  "flex min-h-row-menu w-full cursor-default select-none items-center gap-100 rounded-medium px-100 py-050 text-start font-body text-default outline-none transition-colors duration-fast ease-standard";

/** The row under the pointer or the keyboard. */
export const menuItemHighlighted = "data-[highlighted]:bg-neutral-subtle-hovered";

/** A committed choice remains distinct from pointer/keyboard highlight. */
export const menuChoiceSelected =
  "data-selected:bg-selected data-selected:text-selected data-selected:data-highlighted:bg-selected-hovered";

/** The row that is the current choice. */
export const menuItemSelected = "bg-selected text-selected";

export const menuItemDisabled = "data-[disabled]:pointer-events-none data-[disabled]:text-disabled";

/** A section heading inside the list. */
export const menuLabel = "px-100 pb-050 pt-075 font-heading-xxsmall uppercase text-subtlest";

/** A hairline between sections. */
export const menuSeparator = "my-050 border-t border-default";
