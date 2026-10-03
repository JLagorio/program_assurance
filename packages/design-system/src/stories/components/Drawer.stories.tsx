import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useRef, useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerSwipeHandle,
  DrawerTitle,
  DrawerTrigger,
  DatePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import * as pairLayout from "../_lib/pair";
import * as typeStyle from "../_lib/type-style";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { typeOf, ramp } = typeStyle;
const { Pair } = pairLayout;

const meta = {
  title: "Components/Drawer",
  component: Drawer,
  subcomponents: { DrawerContent, DrawerBody, DrawerFooter },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * `width` is how wide a drawer grows: `small` 320px, `medium` 384px (the default) and `large`
 * 760px at the default text size. A bottom or top drawer takes it, centred, on a window from `sm`
 * (640px) up, and runs edge to edge on a phone; a side drawer takes it within 75% of the window.
 */
export const Widths: Story = {
  render: () => (
    <div className="flex flex-wrap gap-100">
      {(["small", "medium", "large"] as const).map((width) => (
        <Drawer key={width} showSwipeHandle>
          <DrawerTrigger render={<Button />}>{`Open ${width}`}</DrawerTrigger>
          <DrawerContent width={width}>
            <DrawerHeader>
              <DrawerTitle>{`Evidence, ${width}`}</DrawerTitle>
              <DrawerDescription>For CTRL-0412.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody>EV-2201 Bank reconciliation, July.</DrawerBody>
            <DrawerFooter>
              <DrawerClose render={<Button />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
      <Drawer swipeDirection="right" showSwipeHandle>
        <DrawerTrigger render={<Button />}>Open large side</DrawerTrigger>
        <DrawerContent width="large">
          <DrawerHeader>
            <DrawerTitle>Evidence, large side</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>EV-2201 Bank reconciliation, July.</DrawerBody>
          <DrawerFooter>
            <DrawerClose render={<Button />}>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const wide = window.matchMedia("(width >= 40rem)").matches;
    for (const width of ["small", "medium", "large"] as const) {
      await userEvent.click(canvas.getByRole("button", { name: `Open ${width}` }));
      const popup = await body.findByRole("dialog", { name: `Evidence, ${width}` });
      await expect(popup).toHaveAttribute("data-width", width);
      const viewport = popup.closest<HTMLElement>('[data-slot="drawer-viewport"]')!;
      const room = viewport.getBoundingClientRect().width;
      await waitFor(() => {
        const box = popup.getBoundingClientRect();
        // From sm up it is its step, centred; on a phone it runs edge to edge.
        expect(Math.abs(box.width - (wide ? Math.min(stepPx(width), room) : room))).toBeLessThan(1);
        expect(Math.abs(box.left - (room - box.right))).toBeLessThan(1);
      });
      await userEvent.click(within(popup).getByRole("button", { name: "Close" }));
      await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    }
    await userEvent.click(canvas.getByRole("button", { name: "Open large side" }));
    const side = await body.findByRole("dialog", { name: "Evidence, large side" });
    // A side drawer takes its step within 75% of the window.
    await waitFor(() =>
      expect(
        Math.abs(
          side.getBoundingClientRect().width - Math.min(stepPx("large"), window.innerWidth * 0.75),
        ),
      ).toBeLessThan(1),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/** A bottom drawer of quick actions, which opens with focus on the first one and returns it to the trigger on Escape. */
export const Actions: Story = {
  render: function QuickActions() {
    const actionRef = useRef<HTMLButtonElement>(null);
    return (
      <Drawer showSwipeHandle>
        <DrawerTrigger render={<Button />}>Quick actions</DrawerTrigger>
        <DrawerContent initialFocus={actionRef}>
          <DrawerHeader>
            <DrawerTitle>Control actions</DrawerTitle>
            <DrawerDescription>For CTRL-0412.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="flex flex-col gap-100">
            <Button ref={actionRef} variant="subtle">
              Mark verified
            </Button>
            <Button variant="subtle">Request evidence</Button>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose render={<Button />}>Done</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Quick actions" });
    await userEvent.click(trigger);
    const popup = await body.findByRole("dialog", { name: "Control actions" });
    // The drawer's title is Heading's `overlay` size, its h2.
    await expect(typeOf(within(popup).getByRole("heading", { name: "Control actions" }))).toEqual({
      tag: "H2",
      ...ramp.overlay,
    });
    await expect(popup).toHaveAccessibleDescription("For CTRL-0412.");
    await waitFor(() =>
      expect(within(popup).getByRole("button", { name: "Mark verified" })).toHaveFocus(),
    );
    await userEvent.tab({ shift: true });
    await expect(popup.contains(canvasElement.ownerDocument.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

const popupRef = createRef<HTMLDivElement>();

/** DrawerContent forwards its ref and native attributes to the popup, the dialog itself. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: () => (
    <Drawer>
      <DrawerTrigger render={<Button />}>Quick actions</DrawerTrigger>
      <DrawerContent ref={popupRef} data-example="actions">
        <DrawerHeader>
          <DrawerTitle>Control actions</DrawerTitle>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose render={<Button />}>Done</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Quick actions" }));
    const popup = await body.findByRole("dialog", { name: "Control actions" });
    await expect(popupRef.current).toBe(popup);
    await expect(popup).toHaveAttribute("data-example", "actions");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};
export const Positions: Story = {
  render: () => (
    <div className="flex flex-wrap gap-100">
      {(["down", "up", "left", "right"] as const).map((direction) => (
        <Drawer key={direction} swipeDirection={direction} showSwipeHandle>
          <DrawerTrigger render={<Button />}>Swipe {direction}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{direction} drawer</DrawerTitle>
              <DrawerDescription>Swipe toward the edge to dismiss.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              {Array.from({ length: 30 }, (_, i) => (
                <p key={i} className="py-100">
                  Evidence item {i + 1}
                </p>
              ))}
            </DrawerBody>
            <DrawerFooter>
              <DrawerClose render={<Button />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    for (const direction of ["down", "up", "left", "right"]) {
      await userEvent.click(canvas.getByRole("button", { name: `Swipe ${direction}` }));
      const popup = await body.findByRole("dialog", { name: `${direction} drawer` });
      await waitFor(() =>
        expect(popup.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight),
      );
      // The body is the scroller; with nothing to focus in it, it is a tab stop of its own.
      const region = await within(popup).findByRole("group", { name: "Content, scrolls" });
      await expect(region).toHaveAttribute("data-slot", "drawer-body");
      await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
      // The popup records the overlay surface as the current one for what sits on it.
      await expect(popup.style.getPropertyValue("--ds-utility-elevation-surface-current")).toBe(
        "var(--ds-elevation-surface-overlay)",
      );
      // Without a width it is medium, and it never runs past the window.
      await expect(popup).toHaveAttribute("data-width", "medium");
      await expect(popup.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth);
      await userEvent.click(within(popup).getByRole("button", { name: "Close" }));
      await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    }
  },
};
/** The width a drawer grows to, in px at the reader's text size: `dimension.part.drawerSmall`, `.drawer` and `.drawerLarge`. */
const stepPx = (width: "small" | "medium" | "large") =>
  ({ small: 20, medium: 24, large: 47.5 })[width] *
  parseFloat(getComputedStyle(document.documentElement).fontSize);

function SnapDemo() {
  const [snapPoint, setSnapPoint] = useState<number | string | null>(0.5);
  return (
    <Drawer
      snapPoints={[0.5, 1]}
      snapPoint={snapPoint}
      onSnapPointChange={setSnapPoint}
      showSwipeHandle
    >
      <DrawerTrigger render={<Button />}>Open snap points</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Evidence</DrawerTitle>
          <DrawerDescription>Drag between half height and full height.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <Button onClick={() => setSnapPoint(snapPoint === 1 ? 0.5 : 1)}>
            {snapPoint === 1 ? "Collapse" : "Expand"}
          </Button>
          {Array.from({ length: 40 }, (_, i) => (
            <p key={i} className="py-100">
              Evidence item {i + 1}
            </p>
          ))}
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose render={<Button />}>Done</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
export const SnapPoints: Story = { render: () => <SnapDemo /> };
function Filters() {
  const [pending, setPending] = useState(false);
  return (
    <Drawer
      showSwipeHandle
      onOpenChange={(open, details) => {
        if (!open && pending) details.cancel();
      }}
    >
      <DrawerTrigger render={<Button />}>Filter controls</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-200">
          <Select defaultValue="draft" items={{ draft: "Draft", ready: "Ready" }}>
            <SelectTrigger aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
            </SelectContent>
          </Select>
          <DatePicker aria-label="Due date" defaultValue="2026-09-14" />
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose render={<Button />}>Close</DrawerClose>
          <Button onClick={() => setPending(!pending)}>{pending ? "Finish saving" : "Save"}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
export const NestedPopups: Story = {
  render: () => <Filters />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const opener = canvas.getByRole("button", { name: "Filter controls" });
    await userEvent.click(opener);
    const dialog = await body.findByRole("dialog", { name: "Filters" });
    await expect(dialog).not.toHaveAttribute("aria-describedby");
    const trigger = within(dialog).getByRole("combobox", { name: "Status" });
    await userEvent.click(trigger);
    await body.findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await expect(dialog).toBeVisible();
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole("option", { name: "Ready" }));
    await expect(trigger).toHaveTextContent("Ready");
    const date = within(dialog).getByRole("button", { name: "Due date" });
    await userEvent.click(date);
    // The calendar is named by the field's label, or by the locale's "Choose a date" without one.
    const calendar = await body.findByRole("dialog", { name: /^(Due date|Choose a date)$/ });
    await userEvent.click(within(calendar).getByRole("button", { name: /September 18, 2026/ }));
    await expect(date).toHaveTextContent("Sep 18, 2026");
    await waitFor(() => expect(date).toHaveFocus());
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await userEvent.keyboard("{Escape}");
    await expect(dialog).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await expect(dialog).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: "Finish saving" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
export const NestedDrawers: Story = {
  render: () => (
    <Drawer showSwipeHandle>
      <DrawerTrigger render={<Button />}>Open parent</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Parent drawer</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <Drawer showSwipeHandle>
            <DrawerTrigger render={<Button />}>Open child</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Child drawer</DrawerTitle>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose render={<Button />}>Close child</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose render={<Button />}>Close parent</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open parent" }));
    const parent = await body.findByRole("dialog", { name: "Parent drawer" });
    const trigger = within(parent).getByRole("button", { name: "Open child" });
    await userEvent.click(trigger);
    await body.findByRole("dialog", { name: "Child drawer" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Child drawer" })).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};
/** Portal/Overlay remain available when a product needs to compose the native viewport and popup directly; Base UI's VirtualKeyboardProvider goes around the portal, as DrawerContent puts it. */
export const CustomComposition: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger render={<Button />}>Custom drawer</DrawerTrigger>
      <BaseDrawer.VirtualKeyboardProvider>
        <DrawerPortal>
          <DrawerOverlay />
          <BaseDrawer.Viewport className="fixed inset-0 z-overlay flex items-end">
            <BaseDrawer.Popup
              className="drawer-popup group/drawer-popup flex w-full flex-col rounded-t-xxlarge bg-surface-overlay"
              data-swipe-axis="y"
            >
              <DrawerSwipeHandle />
              <BaseDrawer.Content className="drawer-content">
                <DrawerHeader>
                  <DrawerTitle>Quick review</DrawerTitle>
                </DrawerHeader>
                <DrawerFooter>
                  <DrawerClose render={<Button />}>Done</DrawerClose>
                </DrawerFooter>
              </BaseDrawer.Content>
            </BaseDrawer.Popup>
          </BaseDrawer.Viewport>
        </DrawerPortal>
      </BaseDrawer.VirtualKeyboardProvider>
    </Drawer>
  ),
};

/** A drawer's words, drawn in place so a Do and a Don't sit side by side. */
function DrawerWords({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string | undefined;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Stack space="space.150">
      <Stack space="space.050">
        <Text weight="semibold">{title}</Text>
        {description && (
          <Text size="small" color="color.text.subtle">
            {description}
          </Text>
        )}
      </Stack>
      <Stack space="space.100">{children}</Stack>
      <Inline space="space.100" alignInline="end" shouldWrap>
        {footer}
      </Inline>
    </Stack>
  );
}

/**
 * The title says what the drawer acts on and the description names the object; each action is a
 * verb and its object, and the drawer ends with Done. Bare verbs under "Options" leave the reader to
 * remember what they had selected.
 */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <DrawerWords
          title="Control actions"
          description="For AC-2 Account management"
          footer={<Button variant="subtle">Done</Button>}
        >
          <Button>Assign control</Button>
          <Button>Export control</Button>
        </DrawerWords>
      }
      doText="The title and the description say what is acted on, and each action names its object."
      dont={
        <DrawerWords title="Options" footer={<Button variant="subtle">OK</Button>}>
          <Button>Assign</Button>
          <Button>Export</Button>
        </DrawerWords>
      }
      dontText="Options, two bare verbs and OK: nothing says which control they act on or what OK does."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("For AC-2 Account management")).toBeVisible();
    for (const name of ["Assign control", "Export control", "Done"])
      await expect(canvas.getByRole("button", { name })).toBeVisible();
    // The Don't's actions name no object.
    await expect(canvas.getByRole("button", { name: "Assign" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "OK" })).toBeVisible();
  },
};
