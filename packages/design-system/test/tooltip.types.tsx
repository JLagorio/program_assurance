import { createRef } from "react";

import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  type TooltipProps,
  type TooltipProviderProps,
  type TooltipTriggerProps,
  type TooltipContentProps,
} from "../src/index";

type Action = { label: string };
const provider: TooltipProviderProps = { delay: 300, closeDelay: 100, timeout: 300 };
const root: TooltipProps<Action> = {
  trackCursorAxis: "x",
  disableHoverablePopup: false,
  actionsRef: createRef<{ close(): void; unmount(): void }>(),
  onOpenChange(open, details) {
    if (!open && details.reason === "outside-press") details.cancel();
    const event: Event = details.event;
    void event;
  },
};
const trigger: TooltipTriggerProps<Action> = {
  ref: createRef<HTMLButtonElement>(),
  payload: { label: "Save" },
  delay: 100,
  closeDelay: 50,
  closeOnClick: false,
  disabled: false,
  onClick(event) {
    const button: HTMLButtonElement = event.currentTarget;
    void button.form;
    event.preventBaseUIHandler();
  },
};
const content: TooltipContentProps = {
  ref: createRef<HTMLDivElement>(),
  side: "inline-end",
  sideOffset: ({ anchor }) => anchor.width / 10,
  alignOffset: ({ positioner }) => positioner.width / 10,
  className: (state) => (state.open ? "font-medium" : "font-regular"),
  style: (state) => ({ maxWidth: state.open ? 300 : 260 }),
  render: (props, state) => <div {...props} data-placement={state.side} />,
};
<TooltipProvider {...provider}>
  <Tooltip<Action> {...root}>
    {({ payload }) => (
      <>
        <TooltipTrigger {...trigger}>Save</TooltipTrigger>
        <TooltipContent {...content}>{payload?.label}</TooltipContent>
      </>
    )}
  </Tooltip>
</TooltipProvider>;
<TooltipTrigger render={<a href="/records" ref={createRef<HTMLAnchorElement>()} />} />;
<TooltipTrigger render={<span ref={createRef<HTMLSpanElement>()} tabIndex={0} />} />;
// @ts-expect-error Trigger adds hover/focus behavior, not useButton's nativeButton API.
<TooltipTrigger nativeButton={false} />;
// @ts-expect-error Content is composed as a separate part.
<Tooltip content="Save">
  <button>Save</button>
</Tooltip>;
