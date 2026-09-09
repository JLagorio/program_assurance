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
<InputGroup ref={createRef<HTMLDivElement>()}>
  <InputGroupInput ref={createRef<HTMLInputElement>()} />
  <InputGroupAddon align="inline-end">
    <InputGroupButton size="icon-xs" aria-label="Search" />
  </InputGroupAddon>
</InputGroup>;
<InputGroupTextarea ref={createRef<HTMLTextAreaElement>()} />;
// @ts-expect-error Leading and trailing shorthand were removed.
<InputGroup leading="Search" />;
// @ts-expect-error Addons use logical alignment.
<InputGroupAddon align="left" />;
// @ts-expect-error Native textarea refs target textareas.
<Textarea ref={createRef<HTMLInputElement>()} />;
