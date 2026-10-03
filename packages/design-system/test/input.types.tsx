import { createRef } from "react";
import {
  Input,
  Textarea,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  InputGroupTextarea,
} from "../src/index";

<Input
  ref={createRef<HTMLInputElement>()}
  size="small"
  render={<input />}
  onValueChange={(value, details) => {
    if (value === "blocked") details.cancel();
  }}
  className={(state) => (state.focused ? "text-brand" : undefined)}
/>;
<Textarea
  ref={createRef<HTMLTextAreaElement>()}
  rows={3}
  onChange={(event) => event.currentTarget.select()}
/>;
// Textarea takes Input's API: a value callback, render, and state callbacks for class and style.
<Textarea
  render={<textarea />}
  onValueChange={(value, details) => {
    const text: string = value;
    const event: Event = details.event;
    void text;
    void event;
  }}
  className={(state) => (state.focused ? "text-brand" : undefined)}
  style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}
/>;
<Textarea className="w-full" style={{ inlineSize: "100%" }} />;
<InputGroup ref={createRef<HTMLDivElement>()}>
  <InputGroupInput ref={createRef<HTMLInputElement>()} />
  <InputGroupAddon align="inline-end">
    <InputGroupButton icon={<svg />} label="Search" />
    <InputGroupButton size="small">Search</InputGroupButton>
    <InputGroupButton size="icon-xs" aria-label="Search (deprecated square)" />
    <InputGroupButton size="sm">Deprecated spelling</InputGroupButton>
  </InputGroupAddon>
</InputGroup>;
// @ts-expect-error An icon-only InputGroupButton needs its label.
<InputGroupButton icon={<svg />} />;
// @ts-expect-error An icon-only InputGroupButton has no children to name it.
<InputGroupButton icon={<svg />} label="Search">
  Search
</InputGroupButton>;
<InputGroupTextarea ref={createRef<HTMLTextAreaElement>()} />;
// @ts-expect-error Leading and trailing shorthand were removed.
<InputGroup leading="Search" />;
// @ts-expect-error Addons use logical alignment.
<InputGroupAddon align="left" />;
// @ts-expect-error Native textarea refs target textareas.
<Textarea ref={createRef<HTMLInputElement>()} />;
