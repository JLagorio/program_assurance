import { createRef } from "react";

import {
  FilterChip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
  type PopoverProps,
  type PopoverTriggerProps,
  type PopoverContentProps,
} from "../src/index";

type FilterPayload = { title: string };
const inputRef = createRef<HTMLInputElement>();
const triggerRef = createRef<HTMLButtonElement>();
const rootProps: PopoverProps<FilterPayload> = {
  modal: "trap-focus",
  actionsRef: createRef<{ close(): void; unmount(): void }>(),
  onOpenChange(open, details) {
    const event: Event = details.event;
    if (!open && details.reason === "outside-press" && event.defaultPrevented) details.cancel();
    if (!open) details.preventUnmountOnClose();
  },
};
const triggerProps: PopoverTriggerProps<FilterPayload> = {
  ref: triggerRef,
  payload: { title: "Filters" },
  openOnHover: true,
  delay: 100,
  closeDelay: 200,
  onClick(event) {
    const button: HTMLButtonElement = event.currentTarget;
    void button.form;
    event.preventBaseUIHandler();
  },
};
const contentProps: PopoverContentProps = {
  ref: createRef<HTMLDivElement>(),
  initialFocus: inputRef,
  finalFocus: (interaction) => (interaction === "touch" ? false : triggerRef.current),
  side: "inline-end",
  sideOffset: ({ anchor }) => anchor.width / 10,
  alignOffset: ({ positioner }) => positioner.width / 10,
  dir: "rtl",
  className: (state) => (state.open ? "text-default" : "opacity-0"),
  style: (state) => ({ width: state.open ? 320 : 288 }),
  render: (elementProps, state) => <div {...elementProps} data-placement={state.side} />,
};

<Popover<FilterPayload> {...rootProps}>
  {({ payload }) => (
    <>
      <PopoverTrigger {...triggerProps}>Filters</PopoverTrigger>
      <PopoverContent {...contentProps}>
        <PopoverHeader ref={createRef<HTMLDivElement>()} aria-label="Filter settings">
          <PopoverTitle ref={createRef<HTMLHeadingElement>()} render={<h3 />}>
            {payload?.title}
          </PopoverTitle>
          <PopoverDescription
            ref={createRef<HTMLParagraphElement>()}
            className={() => "text-subtle"}
          >
            Refine records.
          </PopoverDescription>
        </PopoverHeader>
        <input ref={inputRef} aria-label="Search records" />
        <PopoverClose ref={createRef<HTMLButtonElement>()}>Apply</PopoverClose>
      </PopoverContent>
    </>
  )}
</Popover>;
<PopoverTrigger nativeButton={false} render={<span ref={createRef<HTMLSpanElement>()} />} />;
<PopoverClose nativeButton={false} render={<span ref={createRef<HTMLSpanElement>()} />} />;
<FilterChip
  label="Gaps"
  ref={createRef<HTMLButtonElement>()}
  onClick={(event) => {
    const button: HTMLButtonElement = event.currentTarget;
    void button.form;
  }}
/>;
<Popover>
  <PopoverTrigger
    ref={triggerRef}
    render={<FilterChip label="Status" ref={createRef<HTMLButtonElement>()} />}
  />
</Popover>;
// @ts-expect-error FilterChip exposes its native button ref.
<FilterChip label="Gaps" ref={createRef<HTMLDivElement>()} />;
// @ts-expect-error Root controls popup state; trigger composition is a separate part.
<Popover trigger={<button>Filters</button>} />;
