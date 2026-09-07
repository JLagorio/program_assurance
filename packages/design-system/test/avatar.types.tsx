import { createRef } from "react";
import { Avatar, Person } from "../src/index";

const span = createRef<HTMLSpanElement>();
const image = createRef<HTMLImageElement>();
<Avatar
  name="Dana Whitlock"
  ref={span}
  size="xlarge"
  variant="gradient"
  shape="square"
  hue="teal"
  isDecorative
  dir="rtl"
  data-testid="avatar"
  onClick={(event) => event.currentTarget.focus()}
/>;
<Avatar name="Dana Whitlock">
  <Avatar.Image
    ref={image}
    src="/dana.png"
    onLoadingStatusChange={(status) => status === "loaded"}
  />
  <Avatar.Fallback ref={span} delay={300} />
</Avatar>;
<Avatar name="Dana Whitlock" aria-label="Dana Whitlock, online">
  <Avatar.Fallback />
  <Avatar.Badge ref={span} tone="success" data-testid="presence" />
</Avatar>;
<Avatar.Stack ref={span} size="medium" aria-label="Reviewers">
  <Avatar name="Dana Whitlock" />
  <Avatar.Count ref={span}>+2</Avatar.Count>
</Avatar.Stack>;
<Avatar.Stack names={["Dana Whitlock", { name: "Grace Hoppel", src: "/grace.png" }]} max={2} />;
<Person name="Dana Whitlock" ref={span} title="Owner" />;
// @ts-expect-error The name is the identity: the initials, the hue and the accessible name come from it.
<Avatar />;
// @ts-expect-error The package uses its own documented size vocabulary.
<Avatar name="Dana Whitlock" size="sm" />;
// @ts-expect-error A Badge is in a status tone, not a word of its own.
<Avatar.Badge tone="online" />;
// @ts-expect-error A stack is small or medium.
<Avatar.Stack size="xlarge" />;
// @ts-expect-error A span cannot be the image's ref.
<Avatar.Image ref={span} src="/dana.png" />;
// @ts-expect-error Person writes the name; it takes no children.
<Person name="Dana Whitlock">Dana</Person>;
