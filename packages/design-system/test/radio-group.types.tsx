import { createRef } from "react";

import { RadioGroup, RadioGroupItem, type RadioGroupProps } from "../src/index";

const props: RadioGroupProps<number> = {
  defaultValue: 1,
  name: "priority",
  form: "preferences",
  required: true,
  readOnly: true,
};

<RadioGroup
  {...props}
  ref={createRef<HTMLDivElement>()}
  inputRef={createRef<HTMLInputElement>()}
  className={(state) => (state.readOnly ? "opacity-50" : "opacity-100")}
  style={(state) => ({ padding: state.required ? 4 : 0 })}
  render={(elementProps, state) => <div {...elementProps} data-required-state={state.required} />}
  onValueChange={(value, details) => {
    const next: number = value;
    const event: Event = details.event;
    if (next === 2 && event.defaultPrevented) details.cancel();
  }}
>
  <RadioGroupItem
    value={1}
    ref={createRef<HTMLElement>()}
    inputRef={createRef<HTMLInputElement>()}
    className={(state) => (state.checked ? "border-brand" : "border-input")}
    style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}
    render={(elementProps, state) => <span {...elementProps} data-checked-state={state.checked} />}
  />
  <RadioGroupItem value={2} nativeButton render={<button ref={createRef<HTMLButtonElement>()} />} />
</RadioGroup>;
