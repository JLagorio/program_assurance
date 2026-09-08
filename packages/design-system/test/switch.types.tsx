import { createRef } from "react";

import { Switch, type SwitchProps } from "../src/index";

const props: SwitchProps = {
  size: "sm",
  id: "email-updates",
  name: "updates",
  form: "preferences",
  value: "enabled",
  uncheckedValue: "disabled",
  defaultChecked: true,
  required: true,
  readOnly: true,
};

<Switch
  {...props}
  ref={createRef<HTMLElement>()}
  inputRef={createRef<HTMLInputElement>()}
  className={(state) => (state.checked ? "bg-brand-bold" : "bg-neutral")}
  style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}
  render={(elementProps, state) => <span {...elementProps} data-readonly-state={state.readOnly} />}
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

<Switch nativeButton render={<button ref={createRef<HTMLButtonElement>()} />} />;
