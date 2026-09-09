import { createRef } from "react";
import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import type { GroupImperativeHandle, PanelImperativeHandle } from "react-resizable-panels";
import {
  Button,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
  DrawerSwipeHandle,
  Calendar,
  CalendarDayButton,
  DatePicker,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@ledger/design-system";

const handle = BaseDrawer.createHandle<{ id: string }>();
<Drawer
  handle={handle}
  snapPoints={[0.5, 1]}
  onSnapPointChange={(point) => {
    const value: number | string | null = point;
    void value;
  }}
  onOpenChange={(open, details) => {
    if (!open) details.cancel();
  }}
>
  {({ payload }) => (
    <>
      <DrawerTrigger
        handle={handle}
        payload={{ id: "review" }}
        ref={createRef<HTMLButtonElement>()}
        render={<Button />}
      >
        Open
      </DrawerTrigger>
      <DrawerContent
        ref={createRef<HTMLDivElement>()}
        initialFocus={createRef<HTMLButtonElement>()}
        finalFocus={false}
        render={<section />}
        className={(state) => (state.open ? "p-200" : undefined)}
      >
        <DrawerHeader ref={createRef<HTMLDivElement>()}>
          <DrawerTitle ref={createRef<HTMLHeadingElement>()}>{payload?.id}</DrawerTitle>
          <DrawerDescription>Review</DrawerDescription>
        </DrawerHeader>
        <DrawerSwipeHandle ref={createRef<HTMLDivElement>()} />
        <DrawerFooter>
          <DrawerClose render={<Button />} ref={createRef<HTMLButtonElement>()}>
            Close
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </>
  )}
</Drawer>;
<DrawerPortal container={createRef<HTMLDivElement>()} keepMounted>
  <DrawerOverlay
    ref={createRef<HTMLDivElement>()}
    className={(state) => (state.open ? "bg-blanket" : undefined)}
  />
</DrawerPortal>;
<Calendar
  mode="range"
  selected={{ from: new Date() }}
  onSelect={(range) => {
    const date: Date | undefined = range?.from;
    void date;
  }}
  captionLayout="dropdown"
  showWeekNumber
  buttonVariant="subtle"
  components={{ DayButton: (props) => <CalendarDayButton {...props} data-custom="day" /> }}
/>;
<DatePicker
  ref={createRef<HTMLButtonElement>()}
  form="review"
  name="due"
  defaultValue="2026-09-14"
  onChange={(iso) => {
    const date: string = iso;
    void date;
  }}
  aria-describedby="due-hint"
/>;
<Pagination ref={createRef<HTMLElement>()} aria-label="Pages">
  <PaginationContent ref={createRef<HTMLUListElement>()}>
    <PaginationItem ref={createRef<HTMLLIElement>()}>
      <PaginationPrevious href="?page=1" text="Earlier" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink
        ref={createRef<HTMLAnchorElement>()}
        href="?page=2"
        target="_blank"
        rel="noreferrer"
        isActive
      >
        2
      </PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis ref={createRef<HTMLSpanElement>()} />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="?page=3" text="Later" />
    </PaginationItem>
  </PaginationContent>
</Pagination>;
<ResizablePanelGroup
  id="review"
  elementRef={createRef<HTMLDivElement>()}
  groupRef={createRef<GroupImperativeHandle>()}
  defaultLayout={{ list: 30, detail: 70 }}
  onLayoutChanged={(layout, meta) => {
    const value: boolean = meta.isUserInteraction;
    void [layout, value];
  }}
>
  <ResizablePanel
    id="list"
    elementRef={createRef<HTMLDivElement>()}
    panelRef={createRef<PanelImperativeHandle>()}
    defaultSize="30%"
    minSize={150}
    collapsedSize="0%"
    collapsible
    onResize={(size, id, previous) => {
      void [size.asPercentage, id, previous?.inPixels];
    }}
  >
    List
  </ResizablePanel>
  <ResizableHandle
    elementRef={createRef<HTMLDivElement>()}
    withHandle
    disabled
    aria-label="Resize"
  />
  <ResizablePanel id="detail">Detail</ResizablePanel>
</ResizablePanelGroup>;
// @ts-expect-error Drawer is state-only; dismissal uses onOpenChange.
<Drawer onClose={() => {}} />;
// @ts-expect-error Dimensions and focus belong to Content, not Root.
<Drawer returnFocusRef={createRef<HTMLButtonElement>()} />;
// @ts-expect-error Pagination now composes native parts; it does not own page state.
<Pagination page={1} pageCount={3} />;
// @ts-expect-error Persistence belongs to the caller's native useDefaultLayout hook.
<ResizablePanelGroup persist="review" />;
// @ts-expect-error Use native aria-label on the separator.
<ResizableHandle label="Resize" />;
