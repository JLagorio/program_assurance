import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldLabel,
  Input,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
  type SheetWidth,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Heading, Inline, Stack, Text } from "../../primitives";
import * as pairLayout from "../_lib/pair";
import * as typeStyle from "../_lib/type-style";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;
const { typeOf, ramp } = typeStyle;

const meta = {
  title: "Components/Sheet",
  component: Sheet,
  subcomponents: { SheetContent, SheetBody, SheetFooter, SheetClose },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Sheet>;
export default meta;
type Story = StoryObj<typeof meta>;

function Edges() {
  const [side, setSide] = useState<"top" | "right" | "bottom" | "left">("right");
  return (
    <>
      <div className="flex gap-100">
        {(["top", "right", "bottom", "left"] as const).map((edge) => (
          <Button key={edge} onClick={() => setSide(edge)}>
            {edge}
          </Button>
        ))}
      </div>
      <Sheet>
        <SheetTrigger render={<Button />}>Preview record</SheetTrigger>
        <SheetContent side={side}>
          <SheetHeader>
            <SheetTitle>Assessment record</SheetTitle>
            <SheetDescription>Current review details.</SheetDescription>
          </SheetHeader>
          <SheetBody className="pt-0">
            <div
              data-testid="sticky-label"
              className="sticky top-0 bg-surface-current pb-100 pt-150"
            >
              <Heading size="overlay">Evidence</Heading>
            </div>
            {Array.from({ length: 25 }, (_, i) => (
              <p className="py-100" key={i}>
                Evidence {i + 1}
              </p>
            ))}
          </SheetBody>
          <SheetFooter>
            <SheetClose render={<Button />}>Done</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

const widths: SheetWidth[] = ["small", "medium", "large", "xlarge", "fullscreen"];

/** Every prop on SheetContent. */
export const Playground: StoryObj<typeof SheetContent> = {
  args: { side: "end", width: "medium", showCloseButton: true },
  argTypes: {
    side: { control: "inline-radio", options: ["start", "end", "top", "bottom"] },
    width: { control: "inline-radio", options: widths },
    showCloseButton: { control: "boolean" },
  },
  render: (args) => (
    <Sheet>
      <SheetTrigger render={<Button />}>Open sheet</SheetTrigger>
      <SheetContent {...args}>
        <SheetHeader>
          <SheetTitle>Member details</SheetTitle>
          <SheetDescription>Dana Whitfield</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p className="font-body">Joined in March. Owns four open tasks.</p>
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button />}>Done</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Open sheet" });
    await userEvent.click(trigger);
    const popup = await body.findByRole("dialog", { name: "Member details" });
    await userEvent.click(within(popup).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/**
 * Four edges, with the body as the one scroller between a fixed header and footer. Headings in the
 * body start one level below the sheet's title, and a sticky label painted with the current surface
 * matches the sheet, not the page.
 */
export const EdgesAndScrolling: Story = {
  render: () => <Edges />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    for (const side of ["right", "left", "top", "bottom"]) {
      await userEvent.click(canvas.getByRole("button", { name: side }));
      await userEvent.click(canvas.getByRole("button", { name: "Preview record" }));
      const popup = await body.findByRole("dialog", { name: "Assessment record" });
      await expect(popup).toHaveAttribute("data-side", side);
      // The sheet's title is Heading's `overlay` size, its h2.
      await expect(
        typeOf(within(popup).getByRole("heading", { name: "Assessment record" })),
      ).toEqual({ tag: "H2", ...ramp.overlay });
      await expect(getComputedStyle(popup).animationName).toBe(
        `ds-slide-in-${side === "right" ? "end" : side === "left" ? "start" : side}`,
      );
      await expect(within(popup).getByRole("heading", { name: "Evidence" }).tagName).toBe("H3");
      await expect(
        getComputedStyle(within(popup).getByTestId("sticky-label")).backgroundColor,
      ).toBe(getComputedStyle(popup).backgroundColor);
      await userEvent.click(within(popup).getByRole("button", { name: "Done" }));
      await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    }
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Preview record" })).toHaveFocus(),
    );
  },
};

const expectedWidth: Record<SheetWidth, number> = {
  small: 320,
  medium: 420,
  large: 760,
  xlarge: 960,
  fullscreen: Number.POSITIVE_INFINITY,
};

/**
 * The five widths for a sheet at the start or end edge: `small` for filters, `medium` (the
 * default) for a form, `large` for a table of about four columns, `xlarge` for a table beside a
 * preview, and `fullscreen`, which covers the window. Each is capped by the window.
 */
export const Widths: Story = {
  render: () => (
    <div className="flex flex-wrap gap-100">
      {widths.map((width) => (
        <Sheet key={width}>
          <SheetTrigger render={<Button />}>Open {width}</SheetTrigger>
          <SheetContent side="end" width={width}>
            <SheetHeader>
              <SheetTitle>A {width} sheet</SheetTitle>
            </SheetHeader>
            <SheetBody>
              <p className="font-body">The width is chosen by the task, never set in pixels.</p>
            </SheetBody>
            <SheetFooter>
              <SheetClose render={<Button />}>Done</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    for (const width of widths) {
      await userEvent.click(canvas.getByRole("button", { name: `Open ${width}` }));
      const popup = await body.findByRole("dialog", { name: `A ${width} sheet` });
      await expect(popup).toHaveAttribute("data-width", width);
      await waitFor(() =>
        expect(popup.getBoundingClientRect().width).toBeCloseTo(
          Math.min(expectedWidth[width], window.innerWidth),
          0,
        ),
      );
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    }
  },
};

function PendingSheet() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <Sheet open={open} pending={pending} onOpenChange={setOpen}>
      <SheetTrigger render={<Button />}>Edit filters</SheetTrigger>
      <SheetContent side="end" width="small">
        <SheetHeader>
          <SheetTitle>Edit filters</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <Field>
            <FieldLabel>Name contains</FieldLabel>
            <Input defaultValue="review" />
          </Field>
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button variant="subtle" />}>Cancel</SheetClose>
          <Button variant="primary" isLoading={pending} onClick={() => setPending(true)}>
            Save filters
          </Button>
          {pending ? (
            <Button variant="subtle" onClick={() => setPending(false)}>
              Stop waiting
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * `pending` on the root holds the sheet: Escape, the blanket, Close and SheetClose do nothing
 * while the command runs, the built-in Close keeps focus, and the popup is busy.
 */
export const Pending: Story = {
  render: () => <PendingSheet />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Edit filters" });
    await userEvent.click(trigger);
    const popup = await body.findByRole("dialog", { name: "Edit filters" });
    const sheet = within(popup);
    await userEvent.click(sheet.getByRole("button", { name: "Save filters" }));
    await expect(popup).toHaveAttribute("aria-busy", "true");
    // Cancel is unavailable but keeps focus; pressing it does nothing.
    const cancel = sheet.getByRole("button", { name: "Cancel" });
    await expect(cancel).toHaveAttribute("aria-disabled", "true");
    cancel.focus();
    await userEvent.keyboard("{Enter}");
    await expect(cancel).toHaveFocus();
    const close = sheet.getByRole("button", { name: "Close" });
    close.focus();
    await expect(close).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Enter}");
    await expect(close).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    // A press on the blanket leaves the pending sheet open and keeps focus where it was.
    await userEvent.click(
      canvasElement.ownerDocument.querySelector<HTMLElement>('[data-slot="sheet-overlay"]')!,
    );
    await expect(popup).toBeVisible();
    await expect(close).toHaveFocus();
    await userEvent.click(sheet.getByRole("button", { name: "Stop waiting" }));
    await expect(popup).not.toHaveAttribute("aria-busy");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const NestedAndRTL: Story = {
  render: () => (
    <LedgerProvider direction="rtl">
      <Sheet>
        <SheetTrigger render={<Button />}>Open details</SheetTrigger>
        <SheetContent side="end">
          <SheetHeader>
            <SheetTitle>Record details</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <Dialog>
              <DialogTrigger render={<Button />}>Edit record</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit record</DialogTitle>
                </DialogHeader>
                <DialogBody>
                  <p>Changes apply to this record.</p>
                </DialogBody>
              </DialogContent>
            </Dialog>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open details" }));
    const sheet = await body.findByRole("dialog", { name: "Record details" });
    await expect(sheet).toHaveAttribute("data-side", "left");
    await expect(getComputedStyle(sheet).animationName).toBe("ds-slide-in-start");
    await userEvent.click(within(sheet).getByRole("button", { name: "Edit record" }));
    await body.findByRole("dialog", { name: "Edit record" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Edit record" })).toBeNull());
    await waitFor(() =>
      expect(within(sheet).getByRole("button", { name: "Edit record" })).toHaveFocus(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/** SheetPortal and SheetOverlay frame a custom Base UI popup at an edge, as Dialog's parts do. */
export const CustomPortal: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button />}>Open custom sheet</SheetTrigger>
      <SheetPortal>
        <SheetOverlay />
        <BaseDialog.Popup className="fixed inset-y-0 end-0 z-overlay flex w-full max-w-[360px] flex-col gap-150 bg-surface-overlay p-200 text-default shadow-overlay">
          <SheetTitle>Custom review sheet</SheetTitle>
          <p className="font-body">Portal and blanket frame a caller-owned layout.</p>
          <SheetClose render={<Button />}>Done</SheetClose>
        </BaseDialog.Popup>
      </SheetPortal>
    </Sheet>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Open custom sheet" });
    await userEvent.click(trigger);
    const popup = await body.findByRole("dialog", { name: "Custom review sheet" });
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="sheet-overlay"]'),
    ).not.toBeNull();
    await userEvent.click(within(popup).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** A sheet's words, drawn without the sheet: its title, its count and its footer. */
function SheetWords({ title, count, footer }: { title: string; count: string; footer: ReactNode }) {
  return (
    <Stack space="space.150">
      <Text weight="semibold">{title}</Text>
      <Text size="small" color="color.text.subtle">
        {count}
      </Text>
      <Inline space="space.100" alignInline="end" shouldWrap>
        {footer}
      </Inline>
    </Stack>
  );
}

/** The mistake the page is written to prevent, beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Pair
      do={
        <SheetWords
          title="Add controls to Flight computer"
          count="12 chosen of 340"
          footer={
            <>
              <Button variant="subtle">Cancel</Button>
              <Button variant="primary">Add 12 controls</Button>
            </>
          }
        />
      }
      doText="The title says what the selection is for and where it goes, and the primary says how many it adds."
      dont={
        <SheetWords
          title="Select items"
          count="12 selected"
          footer={<Button variant="primary">Done</Button>}
        />
      }
      dontText="A title and a Done that say neither what is chosen nor what happens to it."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Add 12 controls" })).toBeVisible();
  },
};
