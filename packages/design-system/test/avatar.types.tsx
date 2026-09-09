import { createRef } from "react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  Person,
} from "../src/index";

const span = createRef<HTMLSpanElement>();
<Avatar
  ref={span}
  size="xlarge"
  variant="gradient"
  shape="square"
  hue="teal"
  aria-label="Dana Whitlock"
  role="img"
  render={<span />}
  className={(state) => (state.imageLoadingStatus === "loaded" ? "text-default" : undefined)}
  style={(state) => ({ opacity: state.imageLoadingStatus === "loaded" ? 1 : 0.8 })}
>
  <AvatarImage
    ref={createRef<HTMLImageElement>()}
    src="/dana.png"
    alt=""
    onLoadingStatusChange={(status) => status === "loaded"}
  />
  <AvatarFallback ref={span} delay={300}>
    DW
  </AvatarFallback>
  <AvatarBadge ref={span} tone="success" />
</Avatar>;
<AvatarGroup ref={createRef<HTMLDivElement>()} role="group" aria-label="Reviewers">
  <Avatar>
    <AvatarFallback>DW</AvatarFallback>
  </Avatar>
  <AvatarGroupCount>+2</AvatarGroupCount>
</AvatarGroup>;
<Person name="Dana Whitlock" ref={span} title="Owner" />;
// @ts-expect-error The shorthand was removed; compose image and fallback explicitly.
<Avatar name="Dana Whitlock" />;
// @ts-expect-error Group contents belong to the caller.
<AvatarGroup names={["Dana Whitlock"]} />;
// @ts-expect-error A Badge uses a status tone.
<AvatarBadge tone="online" />;
// @ts-expect-error Image refs target images.
<AvatarImage ref={span} src="/dana.png" />;
// @ts-expect-error Person writes the name; it takes no children.
<Person name="Dana Whitlock">Dana</Person>;
