import { createRef } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  type SelectProps,
  type SelectTriggerProps,
  type SelectValueProps,
  type SelectContentProps,
  type SelectGroupProps,
  type SelectLabelProps,
  type SelectItemProps,
  type SelectSeparatorProps,
  type SelectScrollUpButtonProps,
  type SelectScrollDownButtonProps,
} from "../src/index";

type SelectOwner = { id: number; name: string };
const selectRoot: SelectProps<SelectOwner> = {
  name: "owner",
  form: "record",
  required: true,
  autoComplete: "off",
  readOnly: false,
  inputRef: createRef<HTMLInputElement>(),
  defaultValue: { id: 1, name: "Dana" },
  itemToStringLabel: (owner) => owner.name,
  itemToStringValue: (owner) => String(owner.id),
  isItemEqualToValue: (a, b) => a.id === b.id,
  actionsRef: createRef<{ unmount(): void }>(),
  onValueChange(value, details) {
    const id: number | undefined = value?.id;
    if (id === 2) details.cancel();
  },
  onOpenChange(open, details) {
    if (!open && details.reason === "outside-press") details.cancel();
  },
};
const selectTrigger: SelectTriggerProps = {
  ref: createRef<HTMLButtonElement>(),
  size: "sm",
  id: "owner-trigger",
  style: (state) => ({ width: state.open ? 240 : 200 }),
  className: (state) => (state.disabled ? "font-regular" : "font-medium"),
  render: (props, state) => <button {...props} data-selected={state.value?.id} />,
};
const selectValue: SelectValueProps = {
  ref: createRef<HTMLSpanElement>(),
  placeholder: "Choose owner",
  children: (value: SelectOwner | null) => value?.name ?? "Choose owner",
};
const selectContent: SelectContentProps = {
  ref: createRef<HTMLDivElement>(),
  alignItemWithTrigger: false,
  side: "inline-end",
  dir: "rtl",
  sideOffset: ({ anchor }) => anchor.width / 10,
  alignOffset: ({ positioner }) => positioner.width / 10,
  finalFocus: createRef<HTMLButtonElement>(),
  style: (state) => ({ minWidth: state.open ? 240 : 200 }),
};
const selectGroup: SelectGroupProps = { ref: createRef<HTMLDivElement>() };
const selectLabel: SelectLabelProps = { ref: createRef<HTMLDivElement>() };
const selectItem: SelectItemProps = {
  ref: createRef<HTMLDivElement>(),
  value: { id: 1, name: "Dana" },
  label: "Dana",
  disabled: false,
  className: (state) => (state.selected ? "font-medium" : "font-regular"),
  onClick: (event) => event.preventBaseUIHandler(),
};
const selectSeparator: SelectSeparatorProps = { ref: createRef<HTMLDivElement>() };
const selectUp: SelectScrollUpButtonProps = { ref: createRef<HTMLDivElement>(), keepMounted: true };
const selectDown: SelectScrollDownButtonProps = {
  ref: createRef<HTMLDivElement>(),
  keepMounted: true,
};
<Select {...selectRoot}>
  <SelectTrigger {...selectTrigger}>
    <SelectValue {...selectValue} />
  </SelectTrigger>
  <SelectContent {...selectContent}>
    <SelectGroup {...selectGroup}>
      <SelectLabel {...selectLabel}>Owner</SelectLabel>
      <SelectItem {...selectItem}>Dana</SelectItem>
    </SelectGroup>
    <SelectSeparator {...selectSeparator} />
    <SelectItem value={null}>Unassigned</SelectItem>
    <SelectScrollUpButton {...selectUp} />
    <SelectScrollDownButton {...selectDown} />
  </SelectContent>
</Select>;
<Select<number, true>
  multiple
  defaultValue={[1]}
  onValueChange={(values, details) => {
    const numeric: number[] = values;
    if (numeric.length === 0) details.cancel();
  }}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value={1}>One</SelectItem>
  </SelectContent>
</Select>;
// @ts-expect-error Root owns state; native layout belongs on Trigger.
<Select width={200} />;
// @ts-expect-error Trigger follows shadcn's size names.
<SelectTrigger size="small" />;
