import { createRef } from "react";

import { Checkbox, type CheckboxProps } from "../src/index";

const props: CheckboxProps = {
  checked: false,
  indeterminate: true,
  name: "selection",
  form: "preferences",
  value: "yes",
  uncheckedValue: "no",
  required: true,
  readOnly: true,
};

<Checkbox
  {...props}
  ref={createRef<HTMLElement>()}
  inputRef={createRef<HTMLInputElement>()}
  className={(state) => (state.indeterminate ? "border-brand" : "border-input")}
  style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}
  render={(elementProps, state) => (
    <span {...elementProps} data-mixed-state={state.indeterminate} />
  )}
  onCheckedChange={(checked, details) => {
    const next: boolean = checked;
    const event: Event = details.event;
    if (!next && event.defaultPrevented) details.cancel();
  }}
  onClick={(event) => {
    const target: HTMLElement = event.currentTarget;
    target.focus();
    event.preventBaseUIHandler();
  }}
/>;
<Checkbox nativeButton render={<button ref={createRef<HTMLButtonElement>()} />} />;
// @ts-expect-error Mixed presentation is independent of the boolean checked state.
<Checkbox checked="indeterminate" />;
