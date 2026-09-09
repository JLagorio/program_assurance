import { createRef } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxTrigger,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  type ComboboxProps,
} from "../src/index";

<Combobox<string>
  items={["a"]}
  value="a"
  onValueChange={(value, details) => {
    if (value === "a") details.cancel();
  }}
/>;
<Combobox<string, true>
  multiple
  items={["a"]}
  value={["a"]}
  onValueChange={(values) => values.map((value) => value.toUpperCase())}
/>;
const objectRoot: ComboboxProps<{ id: number; label: string }> = {
  items: [{ id: 1, label: "One" }],
  defaultValue: { id: 1, label: "One" },
  itemToStringValue: (item) => String(item.id),
  onValueChange: (item) => item?.id,
};
<Combobox {...objectRoot} />;
<ComboboxInput
  ref={createRef<HTMLInputElement>()}
  render={<input />}
  showClear
  className={(state) => (state.open ? "text-brand" : "text-default")}
/>;
<ComboboxContent ref={createRef<HTMLDivElement>()} keepMounted side="top" />;
<ComboboxChips ref={createRef<HTMLDivElement>()}>
  <ComboboxChip showRemove={false}>A</ComboboxChip>
  <ComboboxChipsInput ref={createRef<HTMLInputElement>()} />
</ComboboxChips>;
// @ts-expect-error Multiple selection must use arrays.
<Combobox<string, true> multiple value="a" />;
// @ts-expect-error Single selection must use one value.
<Combobox<string> value={["a"]} />;
// @ts-expect-error Input refs describe inputs.
<ComboboxInput ref={createRef<HTMLDivElement>()} />;
// @ts-expect-error Base UI composition uses render.
<ComboboxTrigger asChild />;
// @ts-expect-error The configured API was removed.
<Combobox options={[]} onChange={() => {}} />;
