import { createRef } from "react";
import { Combobox, type ComboboxRootProps } from "../src/index";

<Combobox
  options={[{ value: "a", label: "A" }]}
  value="a"
  onChange={(value) => value.toUpperCase()}
  ref={createRef<HTMLInputElement>()}
/>;
<Combobox.Root<string> items={["a"]} value="a" onValueChange={(value) => value?.toUpperCase()} />;
<Combobox.Root<string, true>
  multiple
  items={["a"]}
  value={["a"]}
  onValueChange={(values) => values.map((value) => value.toUpperCase())}
/>;
const objectRoot: ComboboxRootProps<{ id: number; label: string }> = {
  items: [{ id: 1, label: "One" }],
  defaultValue: { id: 1, label: "One" },
  itemToStringValue: (item) => String(item.id),
  onValueChange: (item) => item?.id,
};
<Combobox.Root {...objectRoot} />;
<Combobox.Input
  ref={createRef<HTMLInputElement>()}
  render={<input />}
  className={(state) => (state.open ? "text-brand" : "text-default")}
/>;
<Combobox.Content ref={createRef<HTMLDivElement>()} keepMounted side="top" />;
// @ts-expect-error Multiple selection must use arrays.
<Combobox.Root<string, true> multiple value="a" />;
// @ts-expect-error Single selection must use one value.
<Combobox.Root<string> value={["a"]} />;
// @ts-expect-error Input refs describe inputs, not the surrounding group.
<Combobox.Input ref={createRef<HTMLDivElement>()} />;
// @ts-expect-error Base UI composition uses render, not asChild.
<Combobox.Trigger asChild />;

// @ts-expect-error The shorthand now exposes the editable input, not a button.
<Combobox options={[]} onChange={() => {}} ref={createRef<HTMLButtonElement>()} />;
