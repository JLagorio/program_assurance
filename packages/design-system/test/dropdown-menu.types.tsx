import { createRef } from "react";
import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  type DropdownMenuProps,
  type DropdownMenuPortalProps,
  type DropdownMenuTriggerProps,
  type DropdownMenuContentProps,
  type DropdownMenuGroupProps,
  type DropdownMenuLabelProps,
  type DropdownMenuItemProps,
  type DropdownMenuLinkItemProps,
  type DropdownMenuCheckboxItemProps,
  type DropdownMenuRadioGroupProps,
  type DropdownMenuRadioItemProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuShortcutProps,
  type DropdownMenuSubProps,
  type DropdownMenuSubTriggerProps,
  type DropdownMenuSubContentProps,
} from "../src/index";

type MenuPayload = { id: string };
const menuRootProps: DropdownMenuProps<MenuPayload> = {
  modal: false,
  loopFocus: false,
  orientation: "vertical",
  highlightItemOnHover: false,
  actionsRef: createRef<{ close(): void; unmount(): void }>(),
  onOpenChange(open, details) {
    if (!open) {
      details.cancel();
      details.preventUnmountOnClose();
    }
    const event: Event = details.event;
    void event;
  },
};
const menuTriggerProps: DropdownMenuTriggerProps<MenuPayload> = {
  ref: createRef<HTMLButtonElement>(),
  payload: { id: "record" },
  openOnHover: true,
  delay: 200,
  render: (props, state) => <button {...props} data-opened={state.open} />,
};
const menuContentProps: DropdownMenuContentProps = {
  ref: createRef<HTMLDivElement>(),
  side: "inline-end",
  sideOffset: ({ anchor }) => anchor.width / 10,
  alignOffset: ({ positioner }) => positioner.width / 10,
  finalFocus: () => document.getElementById("record-action"),
  className: (state) => (state.open ? "font-medium" : "font-regular"),
  style: (state) => ({ width: state.open ? 240 : 200 }),
};
const menuPortalProps: DropdownMenuPortalProps = {
  container: createRef<HTMLDivElement>(),
  keepMounted: true,
};
const menuGroupProps: DropdownMenuGroupProps = { ref: createRef<HTMLDivElement>() };
const menuLabelProps: DropdownMenuLabelProps = { inset: true, ref: createRef<HTMLDivElement>() };
const menuItemProps: DropdownMenuItemProps = {
  inset: true,
  variant: "destructive",
  nativeButton: true,
  render: <button type="button" ref={createRef<HTMLButtonElement>()} />,
  closeOnClick: false,
  onClick: (event) => event.preventBaseUIHandler(),
  className: (state) => (state.highlighted ? "font-medium" : "font-regular"),
};
const menuLinkProps: DropdownMenuLinkItemProps = {
  href: "/records",
  target: "_blank",
  rel: "noreferrer",
  ref: createRef<HTMLAnchorElement>(),
  render: <a />,
};
const menuCheckboxProps: DropdownMenuCheckboxItemProps = {
  checked: true,
  onCheckedChange: (_, details) => details.cancel(),
};
const menuRadioGroupProps: DropdownMenuRadioGroupProps = {
  value: "date",
  onValueChange: (_, details) => details.cancel(),
};
const menuRadioProps: DropdownMenuRadioItemProps = { value: "date", closeOnClick: true };
const menuSeparatorProps: DropdownMenuSeparatorProps = { ref: createRef<HTMLDivElement>() };
const menuShortcutProps: DropdownMenuShortcutProps = {
  ref: createRef<HTMLSpanElement>(),
  title: "Command E",
};
const menuSubProps: DropdownMenuSubProps = { defaultOpen: false };
const menuSubTriggerProps: DropdownMenuSubTriggerProps = {
  inset: true,
  delay: 100,
  render: <div />,
};
const menuSubContentProps: DropdownMenuSubContentProps = {
  side: "inline-end",
  style: (state) => ({ minWidth: state.open ? 160 : 128 }),
};
<DropdownMenu {...menuRootProps}>
  {({ payload }) => (
    <>
      <DropdownMenuTrigger {...menuTriggerProps} />
      <DropdownMenuContent {...menuContentProps}>
        <DropdownMenuGroup {...menuGroupProps}>
          <DropdownMenuLabel {...menuLabelProps}>{payload?.id}</DropdownMenuLabel>
          <DropdownMenuItem {...menuItemProps}>
            Archive<DropdownMenuShortcut {...menuShortcutProps}>E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuLinkItem {...menuLinkProps}>Open</DropdownMenuLinkItem>
          <DropdownMenuCheckboxItem {...menuCheckboxProps}>Owner</DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup {...menuRadioGroupProps}>
          <DropdownMenuRadioItem {...menuRadioProps}>Date</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator {...menuSeparatorProps} />
        <DropdownMenuSub {...menuSubProps}>
          <DropdownMenuSubTrigger {...menuSubTriggerProps}>Share</DropdownMenuSubTrigger>
          <DropdownMenuSubContent {...menuSubContentProps} />
        </DropdownMenuSub>
      </DropdownMenuContent>
      <DropdownMenuPortal {...menuPortalProps} />
    </>
  )}
</DropdownMenu>;
// @ts-expect-error Compose the trigger as a separate part.
<DropdownMenu trigger={<button />} />;
// @ts-expect-error Checked state belongs on CheckboxItem or RadioGroup.
<DropdownMenuItem isSelected />;
