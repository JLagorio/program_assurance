import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { createRef, useState } from "react";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Dialog,
  Dot,
  Field,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "../../components";
import { menuSurface } from "../../components/menu";
import { LedgerProvider } from "../../lib/locale";
import { Stack } from "../../primitives";

const statuses = [
  {
    value: "draft",
    text: "Draft",
    label: (
      <>
        <Dot tone="neutral" /> Draft
      </>
    ),
  },
  {
    value: "review",
    text: "In review",
    label: (
      <>
        <Dot tone="information" /> In review
      </>
    ),
  },
  {
    value: "approved",
    text: "Approved",
    label: (
      <>
        <Dot tone="success" /> Approved
      </>
    ),
  },
  {
    value: "withdrawn",
    text: "Withdrawn",
    label: (
      <>
        <Dot tone="danger" /> Withdrawn
      </>
    ),
  },
];
function StatusItems() {
  return (
    <>
      {statuses.map((s) => (
        <SelectItem key={s.value} value={s.value} label={s.text} disabled={s.value === "withdrawn"}>
          {s.label}
        </SelectItem>
      ))}
    </>
  );
}
const meta = {
  title: "Components/Select",
  component: Select,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj;
const triggerRef = createRef<HTMLButtonElement>();
const renderedRef = createRef<HTMLButtonElement>();
const valueRef = createRef<HTMLSpanElement>();
const popupRef = createRef<HTMLDivElement>();
const changed = fn();

/** Default selected-item alignment, grouped choices and the native trigger contract. */
export const SelectMatrix: Story = {
  name: "Choices",
  render: () => (
    <Stack space="space.200" className="pt-600">
      <Field label="Status" hint="The same status mark used on the record.">
        <Select items={statuses} defaultValue="review" onValueChange={changed}>
          <SelectTrigger
            ref={triggerRef}
            style={(s) => ({ width: 240, outlineOffset: s.open ? 4 : 0 })}
            className={(s) => (s.open ? "font-medium" : "font-regular")}
            render={<button ref={renderedRef} data-native-target="status" />}
          >
            <SelectValue ref={valueRef} placeholder="Choose a status" />
          </SelectTrigger>
          <SelectContent ref={popupRef} style={(s) => ({ outlineOffset: s.open ? 4 : 0 })}>
            <SelectGroup>
              <SelectLabel>Workflow</SelectLabel>
              <StatusItems />
            </SelectGroup>
            <SelectSeparator />
            <SelectItem value={null}>No status</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Unavailable status">
        <Select disabled items={statuses} defaultValue="draft">
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <StatusItems />
          </SelectContent>
        </Select>
      </Field>
      <Field label="Locked status">
        <Select readOnly items={statuses} defaultValue="approved">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <StatusItems />
          </SelectContent>
        </Select>
      </Field>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument,
      canvas = within(canvasElement),
      body = within(doc.body),
      user = userEvent.setup({ document: doc });
    changed.mockClear();
    const trigger = canvas.getByRole("combobox", { name: "Status" });
    await expect(triggerRef.current).toBe(trigger);
    await expect(renderedRef.current).toBe(trigger);
    await expect(valueRef.current).toHaveTextContent("In review");
    await expect(trigger).toHaveAttribute("type", "button");
    await expect(trigger).toHaveAccessibleDescription("The same status mark used on the record.");
    await expect(canvas.getByRole("combobox", { name: "Unavailable status" })).toBeDisabled();
    const locked = canvas.getByRole("combobox", { name: "Locked status" });
    await expect(locked).toHaveAttribute("aria-readonly", "true");
    await user.click(locked);
    await expect(body.queryByRole("listbox")).toBeNull();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const review = await body.findByRole("option", { name: "In review" });
    await waitFor(() => expect(review).toHaveFocus());
    await expect(popupRef.current).toHaveStyle({ outlineOffset: "4px" });
    await expect(canvasElement).not.toContainElement(popupRef.current);
    await expect(body.getByRole("group", { name: "Workflow" })).toContainElement(review);
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(trigger).toHaveTextContent("Approved"));
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(changed).toHaveBeenLastCalledWith(
      "approved",
      expect.objectContaining({ reason: "item-press" }),
    );
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(body.getByRole("option", { name: "Approved" })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    const withdrawn = await body.findByRole("option", { name: "Withdrawn" });
    await expect(withdrawn).toHaveAttribute("aria-disabled", "true");
    await expect(withdrawn).toHaveFocus();
    await user.keyboard("{Enter}");
    await expect(trigger).toHaveTextContent("Approved");
    await user.keyboard("{Home}{Enter}");
    await waitFor(() => expect(trigger).toHaveTextContent("Draft"));
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await user.keyboard("a");
    await waitFor(() => expect(trigger).toHaveTextContent("Approved"));
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(body.getByRole("option", { name: "Approved" })).toHaveFocus());
    await user.keyboard("{End}");
    await waitFor(() => expect(body.getByRole("option", { name: "No status" })).toHaveFocus());
    await user.keyboard("{Enter}");
    await waitFor(() => expect(trigger).toHaveTextContent("Choose a status"));
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

const owners = [
  { id: 1, name: "Dana Whitfield" },
  { id: 2, name: "Priya Raghavan" },
];
function FormDemo() {
  const [status, setStatus] = useState<string | null>(null);
  const [channels, setChannels] = useState<number[]>([1]);
  const [owner, setOwner] = useState<(typeof owners)[number] | null>({ ...owners[0]! });
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState("");
  return (
    <form
      aria-label="Record preferences"
      style={{ maxWidth: 360 }}
      onInvalid={() => setError(true)}
      onReset={() => {
        setStatus(null);
        setChannels([1]);
        setOwner({ ...owners[0]! });
        setError(false);
        setSaved("");
      }}
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))));
      }}
    >
      <Stack space="space.200">
        <Field
          label="Status"
          isRequired
          hint="Choose a workflow status."
          error={error ? "Choose a status before saving." : undefined}
        >
          <Select
            name="status"
            required
            items={statuses}
            value={status}
            onValueChange={(v, details) => {
              if (v === "approved") details.cancel();
              else {
                setStatus(v);
                setError(false);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a status" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <StatusItems />
            </SelectContent>
          </Select>
        </Field>
        <Field label="Delivery channels">
          <Select<number, true>
            multiple
            name="channel"
            items={{ 1: "Email", 2: "In app" }}
            value={channels}
            onValueChange={setChannels}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose channels" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={1}>Email</SelectItem>
              <SelectItem value={2}>In app</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Owner">
          <Select
            name="owner"
            value={owner}
            onValueChange={setOwner}
            itemToStringLabel={(v) => v.name}
            itemToStringValue={(v) => String(v.id)}
            isItemEqualToValue={(a, b) => a.id === b.id}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose an owner" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {owners.map((o) => (
                <SelectItem key={o.id} value={o}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button type="submit">Save</Button>
        <Button type="reset" variant="secondary">
          Reset
        </Button>
        {saved ? <output aria-label="Saved preferences">{saved}</output> : null}
      </Stack>
    </form>
  );
}
/** Native form values, required state, cancellation, multiple/object values and caller-owned reset. */
export const InField: Story = {
  name: "Forms",
  render: () => <FormDemo />,
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument,
      canvas = within(canvasElement),
      body = within(doc.body),
      user = userEvent.setup({ document: doc });
    const form = canvas.getByRole("form", { name: "Record preferences" }) as HTMLFormElement;
    const status = canvas.getByRole("combobox", { name: "Status" });
    await expect(status).toHaveAttribute("aria-required", "true");
    await expect(form.checkValidity()).toBe(false);
    await waitFor(() => expect(status).toHaveAttribute("aria-invalid", "true"));
    await expect(status).toHaveAccessibleDescription("Choose a status before saving.");
    await user.click(status);
    await user.click(await body.findByRole("option", { name: "Approved" }));
    await expect(new FormData(form).get("status")).toBe("");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await user.click(status);
    await user.click(await body.findByRole("option", { name: "In review" }));
    await waitFor(() => expect(new FormData(form).get("status")).toBe("review"));
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    const channels = canvas.getByRole("combobox", { name: "Delivery channels" });
    await user.click(channels);
    await user.click(await body.findByRole("option", { name: "In app" }));
    await expect(new FormData(form).getAll("channel")).toEqual(["1", "2"]);
    await expect(body.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await user.click(canvas.getByRole("combobox", { name: "Owner" }));
    const dana = await body.findByRole("option", { name: "Dana Whitfield" });
    await expect(dana).toHaveAttribute("aria-selected", "true");
    await user.click(body.getByRole("option", { name: "Priya Raghavan" }));
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await user.click(canvas.getByRole("button", { name: "Save" }));
    await expect(canvas.getByRole("status", { name: "Saved preferences" })).toHaveTextContent(
      '"owner":"2"',
    );
    await user.click(canvas.getByRole("button", { name: "Reset" }));
    await expect(status).toHaveTextContent("Choose a status");
    await expect(new FormData(form).getAll("channel")).toEqual(["1"]);
    await expect(new FormData(form).get("owner")).toBe("1");
  },
};

/** Custom scroll-arrow composition for a bounded, grouped list in RTL. */
export const Scrolling: Story = {
  render: () => (
    <LedgerProvider direction="rtl">
      <div className="p-600">
        <Field label="Retention period">
          <Select<number>
            defaultValue={12}
            items={Object.fromEntries(
              Array.from({ length: 30 }, (_, i) => [i + 1, `${i + 1} months`]),
            )}
          >
            <SelectTrigger size="sm" style={{ width: 200 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Positioner sideOffset={4} alignItemWithTrigger={false}>
                <SelectPrimitive.Popup
                  className={menuSurface}
                  dir="rtl"
                  style={{ width: 200, maxHeight: 180 }}
                >
                  <SelectScrollUpButton data-testid="scroll-up" />
                  <SelectPrimitive.List
                    aria-label="Retention period"
                    style={{ maxHeight: 140, overflowY: "auto" }}
                  >
                    {Array.from({ length: 30 }, (_, i) => (
                      <SelectItem key={i} value={i + 1}>
                        {i + 1} months
                      </SelectItem>
                    ))}
                  </SelectPrimitive.List>
                  <SelectScrollDownButton data-testid="scroll-down" />
                </SelectPrimitive.Popup>
              </SelectPrimitive.Positioner>
            </SelectPrimitive.Portal>
          </Select>
        </Field>
        <Field label="Standard retention">
          <Select<number> defaultValue={12}>
            <SelectTrigger style={{ width: 200 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} style={{ maxHeight: 180 }}>
              {Array.from({ length: 30 }, (_, i) => (
                <SelectItem key={i} value={i + 1}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument,
      canvas = within(canvasElement),
      body = within(doc.body),
      user = userEvent.setup({ document: doc });
    const trigger = canvas.getByRole("combobox", { name: "Retention period" });
    await user.click(trigger);
    const list = await body.findByRole("listbox");
    await waitFor(() => expect(body.getByTestId("scroll-down")).toBeVisible());
    const initial = list.scrollTop;
    await user.hover(body.getByTestId("scroll-down"));
    // Base UI requires actual movement; userEvent.hover emits zero movement.
    fireEvent.mouseMove(body.getByTestId("scroll-down"), { movementY: 1 });
    await waitFor(() => expect(list.scrollTop).toBeGreaterThan(initial));
    await user.unhover(body.getByTestId("scroll-down"));
    await waitFor(() => expect(body.getByTestId("scroll-up")).toBeVisible());
    await user.keyboard("{End}{Enter}");
    await waitFor(() => expect(trigger).toHaveTextContent("30 months"));
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    const standard = canvas.getByRole("combobox", { name: "Standard retention" });
    await user.click(standard);
    const standardList = await body.findByRole("listbox", { name: "Standard retention" });
    await waitFor(() =>
      expect(standardList.scrollHeight).toBeGreaterThan(standardList.clientHeight),
    );
    await waitFor(() =>
      expect(within(standardList).getByRole("option", { name: "12" })).toHaveFocus(),
    );
    await user.keyboard("{End}{Enter}");
    await waitFor(() => expect(standard).toHaveTextContent("30"));
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
  },
};

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit record</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Record status">
        <Field label="Status" hint="Choose the next workflow status.">
          <Select items={statuses} defaultValue="review">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <StatusItems />
            </SelectContent>
          </Select>
        </Field>
      </Dialog>
    </>
  );
}
/** A select shares the current modal's portal boundary; Escape closes one layer at a time. */
export const Dialogs: Story = {
  render: () => <DialogDemo />,
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument,
      canvas = within(canvasElement),
      body = within(doc.body),
      user = userEvent.setup({ document: doc });
    const opener = canvas.getByRole("button", { name: "Edit record" });
    await user.click(opener);
    const dialog = await body.findByRole("dialog", { name: "Record status" });
    const trigger = within(dialog).getByRole("combobox", { name: "Status" });
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    const list = await within(dialog).findByRole("listbox", { name: "Status" });
    await waitFor(() =>
      expect(within(list).getByRole("option", { name: "In review" })).toHaveFocus(),
    );
    await waitFor(() => {
      const r = list.getBoundingClientRect();
      expect(list.contains(doc.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))).toBe(true);
    });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await expect(dialog).toBeVisible();
    await expect(trigger).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
