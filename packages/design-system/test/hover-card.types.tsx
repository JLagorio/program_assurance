import { createRef } from "react";

import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  type HoverCardProps,
  type HoverCardTriggerProps,
  type HoverCardContentProps,
} from "../src/index";

type RecordPreview = { title: string };
const rootProps: HoverCardProps<RecordPreview> = {
  defaultOpen: true,
  defaultTriggerId: "record-preview",
  actionsRef: createRef<{ close(): void; unmount(): void }>(),
  onOpenChange(open, details) {
    const event: Event = details.event;
    if (open && event.defaultPrevented) details.cancel();
    if (!open) details.preventUnmountOnClose();
  },
};
const triggerProps: HoverCardTriggerProps<RecordPreview> = {
  href: "/records/1",
  payload: { title: "Record one" },
  delay: 100,
  closeDelay: 200,
  ref: createRef<HTMLAnchorElement>(),
  onClick(event) {
    const anchor: HTMLAnchorElement = event.currentTarget;
    void anchor.href;
    event.preventBaseUIHandler();
  },
};
const contentProps: HoverCardContentProps = {
  ref: createRef<HTMLDivElement>(),
  dir: "rtl",
  side: "inline-start",
  sideOffset: ({ anchor }) => anchor.width / 10,
  align: "end",
  alignOffset: ({ positioner }) => positioner.width / 10,
  className: (state) => (state.open ? "text-default" : "opacity-0"),
  style: (state) => ({ width: state.open ? 300 : 256 }),
  render: (elementProps, state) => <div {...elementProps} data-placement={state.side} />,
};

<HoverCard<RecordPreview> {...rootProps}>
  {({ payload }) => (
    <>
      <HoverCardTrigger {...triggerProps}>Record one</HoverCardTrigger>
      <HoverCardContent {...contentProps}>{payload?.title}</HoverCardContent>
    </>
  )}
</HoverCard>;
<HoverCardTrigger
  render={<button type="button" ref={createRef<HTMLButtonElement>()} />}
  className={(state) => (state.open ? "text-brand" : "text-default")}
  style={(state) => ({ opacity: state.open ? 1 : 0.8 })}
/>;
// @ts-expect-error Trigger delays belong to the trigger, not the non-DOM root.
<HoverCard delay={100} />;
// @ts-expect-error PreviewCard triggers preserve anchor semantics without a nativeButton API.
<HoverCardTrigger nativeButton />;
