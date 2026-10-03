import { Select as SelectPrimitive } from "@base-ui/react/select";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, createRef, useState } from "react";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import {
  FieldLabel,
  FieldDescription,
  FieldError,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Dot,
  Field,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../components";

import { menuSurface } from "../../components/menu";
import { LedgerProvider } from "../../lib/locale";
import { Stack } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

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

/**
 * The usage to copy: a Select in a Field, its labels in `items` so the closed trigger reads the
 * chosen value's words, and one SelectItem per value.
 */
export const Usage: Story = {
  render: () => (
    <Field className="max-w-layout-measure">
      <FieldLabel>Priority</FieldLabel>
      <Select
        name="priority"
        items={{ low: "Low", medium: "Medium", high: "High" }}
        defaultValue="medium"
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Priority" });
    await expect(trigger).toHaveTextContent("Medium");
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("option", { name: "High" }));
    await waitFor(() => expect(trigger).toHaveTextContent("High"));
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Grouped choices, keyboard selection and the native trigger contract. */
export const SelectMatrix: Story = {
  tags: ["!manifest"],
  name: "Choices",
  render: () => (
    <Stack space="space.200" className="pt-600">
      <Field>
        <FieldLabel>Status</FieldLabel>
        <Select items={statuses} defaultValue="review" onValueChange={changed}>
          <SelectTrigger
            ref={triggerRef}
            style={(s) => ({ width: 240, cursor: s.open ? "default" : "pointer" })}
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
        <FieldDescription>The same status mark used on the record.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Unavailable status</FieldLabel>
        <Select disabled items={statuses} defaultValue="draft">
          <SelectTrigger size="small">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <StatusItems />
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Locked status</FieldLabel>
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
    const small = canvas.getByRole("combobox", { name: "Unavailable status" });
    await expect(small).toBeDisabled();
    // `small` is the 28px control Input and Button call small; `sm` is its deprecated spelling.
    await expect(small).toHaveAttribute("data-size", "small");
    await expect(small.getBoundingClientRect().height).toBe(28);
    await expect(trigger).toHaveAttribute("data-size", "medium");
    const locked = canvas.getByRole("combobox", { name: "Locked status" });
    await expect(locked).toHaveAttribute("aria-readonly", "true");
    await user.click(locked);
    await expect(body.queryByRole("listbox")).toBeNull();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const review = await body.findByRole("option", { name: "In review" });
    await waitFor(() => expect(review).toHaveFocus());
    await expect(trigger).toHaveStyle({ cursor: "default" });
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
  const fieldId = useId();

  const [status, setStatus] = useState<string | null>(null);
  const [channels, setChannels] = useState<number[]>([1]);
  const [owner, setOwner] = useState<(typeof owners)[number] | null>({ ...owners[0]! });
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState("");
  const fieldError4 = error ? "Choose a status before saving." : undefined;
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
        <Field data-invalid={Boolean(fieldError4)}>
          <FieldLabel id={`${fieldId}-status-4-label`} htmlFor={`${fieldId}-status-4`}>
            {"Status"}
            <span aria-hidden="true" className="text-danger">
              {" "}
              *
            </span>
          </FieldLabel>
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
            <SelectTrigger
              id={`${fieldId}-status-4`}
              aria-labelledby={`${fieldId}-status-4-label`}
              aria-required={true}
              aria-invalid={Boolean(fieldError4)}
              aria-describedby={`${fieldId}-status-4-message`}
            >
              <SelectValue placeholder="Choose a status" />
            </SelectTrigger>
            <SelectContent aria-labelledby={`${fieldId}-status-4-label`}>
              <StatusItems />
            </SelectContent>
          </Select>
          {fieldError4 ? (
            <FieldError id={`${fieldId}-status-4-message`}>{fieldError4}</FieldError>
          ) : (
            <FieldDescription id={`${fieldId}-status-4-message`}>
              {"Choose a workflow status."}
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel
            id={`${fieldId}-delivery-channels-5-label`}
            htmlFor={`${fieldId}-delivery-channels-5`}
          >
            {"Delivery channels"}
          </FieldLabel>
          <Select<number, true>
            multiple
            name="channel"
            items={{ 1: "Email", 2: "In app" }}
            value={channels}
            onValueChange={setChannels}
          >
            <SelectTrigger
              id={`${fieldId}-delivery-channels-5`}
              aria-labelledby={`${fieldId}-delivery-channels-5-label`}
            >
              <SelectValue placeholder="Choose channels" />
            </SelectTrigger>
            <SelectContent aria-labelledby={`${fieldId}-delivery-channels-5-label`}>
              <SelectItem value={1}>Email</SelectItem>
              <SelectItem value={2}>In app</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel id={`${fieldId}-owner-6-label`} htmlFor={`${fieldId}-owner-6`}>
            {"Owner"}
          </FieldLabel>
          <Select
            name="owner"
            value={owner}
            onValueChange={setOwner}
            itemToStringLabel={(v) => v.name}
            itemToStringValue={(v) => String(v.id)}
            isItemEqualToValue={(a, b) => a.id === b.id}
          >
            <SelectTrigger id={`${fieldId}-owner-6`} aria-labelledby={`${fieldId}-owner-6-label`}>
              <SelectValue placeholder="Choose an owner" />
            </SelectTrigger>
            <SelectContent aria-labelledby={`${fieldId}-owner-6-label`}>
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
/**
 * Native form values, required state, cancellation, multiple/object values and caller-owned reset.
 * Its ids and ARIA are explicit, and win over the Field's.
 */
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

/** Custom scroll-arrow composition for a bounded list, and the standard Content in RTL. */
export const Scrolling: Story = {
  render: () => (
    <div style={{ maxWidth: 240 }}>
      <Stack space="space.200">
        <Field>
          <FieldLabel>Retention period</FieldLabel>
          <Select<number>
            defaultValue={12}
            items={Object.fromEntries(
              Array.from({ length: 30 }, (_, i) => [i + 1, `${i + 1} months`]),
            )}
          >
            <SelectTrigger size="small" style={{ width: 200 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Positioner sideOffset={4} alignItemWithTrigger={false}>
                <SelectPrimitive.Popup
                  className={menuSurface}
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
        <LedgerProvider direction="rtl">
          <div dir="rtl">
            <Field>
              <FieldLabel>Standard retention</FieldLabel>
              <Select<number> defaultValue={12}>
                <SelectTrigger style={{ width: 200 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ maxHeight: 180 }}>
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
      </Stack>
    </div>
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
    // The arrow spans the popup's inner box, flush with its border.
    const popup = list.parentElement!;
    const arrowBox = body.getByTestId("scroll-down").getBoundingClientRect();
    const popupBox = popup.getBoundingClientRect();
    await expect(Math.round(arrowBox.left)).toBe(Math.round(popupBox.left + popup.clientLeft));
    await expect(Math.round(arrowBox.width)).toBe(popup.clientWidth);
    await expect(Math.round(arrowBox.height)).toBe(24);
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
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false);
          }
        }}
      >
        <DialogContent width="medium" className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Record status</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select items={statuses} defaultValue="review">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <StatusItems />
                </SelectContent>
              </Select>
              <FieldDescription>Choose the next workflow status.</FieldDescription>
            </Field>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
/** A select stays interactive above its dialog; Escape closes one layer at a time. */
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
    // Position the nested list after its dialog anchor has finished arriving.
    await waitFor(() =>
      expect(dialog.getAnimations().every((animation) => animation.playState !== "running")).toBe(
        true,
      ),
    );
    await user.keyboard("{ArrowDown}");
    const list = await body.findByRole("listbox", { name: "Status" });
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

/**
 * In a Field the trigger needs no ids: the label names it, the hint and the error describe it,
 * and the Field's `invalid`, `required` and `disabled` reach it. It fills the Field.
 */
export const BoundInField: Story = {
  name: "Bound in a Field",
  render: () => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Field invalid required>
        <FieldLabel>Status</FieldLabel>
        <Select items={{ open: "Open", closed: "Closed" }}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>Open work shows on the owner's list.</FieldDescription>
        <FieldError>Choose a status.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Program</FieldLabel>
        <Select items={{ atlas: "Atlas payments" }} defaultValue="atlas">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="atlas">Atlas payments</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole("combobox", { name: "Status" });
    await expect(status).toHaveAttribute("aria-invalid", "true");
    await expect(status).toHaveAttribute("aria-required", "true");
    await expect(status).toHaveAccessibleDescription(
      "Open work shows on the owner's list. Choose a status.",
    );
    const program = canvas.getByRole("combobox", { name: "Program" });
    await expect(program).toBeDisabled();
    const field = status.closest<HTMLElement>('[data-slot="field"]')!;
    await expect(status.getBoundingClientRect().width).toBe(field.getBoundingClientRect().width);
    await userEvent.click(status);
    const page = within(canvasElement.ownerDocument.body);
    // The open list is named by the Field's label too.
    await expect(await page.findByRole("listbox", { name: "Status" })).toBeInTheDocument();
    await userEvent.click(await page.findByRole("option", { name: "Closed" }));
    await expect(status).toHaveTextContent("Closed");
    await waitFor(() => expect(page.queryByRole("listbox")).not.toBeInTheDocument());
  },
};

const systems = [
  { value: "cn-109101", label: "CN-109101 · Mission Computer" },
  {
    value: "cn-109102",
    label: "CN-109102 · Flight management system with the extended integrated display suite",
  },
  {
    value: "digest",
    label: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  },
];

/**
 * The list opens below its trigger, from the trigger's start edge, at least as wide as the trigger
 * and as wide as its longest option up to the measure; past that an option wraps, even an unbroken
 * digest. `alignItemWithTrigger` opts into the list that opens over the trigger with the chosen
 * option on the value.
 */
export const Placement: Story = {
  render: () => (
    // Clear of the frame's edge, so the list's collision padding does not shift it.
    <div className="max-w-full ps-300" style={{ width: 264 }}>
      <Stack space="space.300">
        <Field>
          <FieldLabel>System</FieldLabel>
          <Select items={systems} defaultValue="cn-109101">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {systems.map((system) => (
                <SelectItem key={system.value} value={system.value}>
                  {system.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Workflow status</FieldLabel>
          <Select items={statuses} defaultValue="approved">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger>
              <StatusItems />
            </SelectContent>
          </Select>
        </Field>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument,
      canvas = within(canvasElement),
      body = within(doc.body),
      user = userEvent.setup({ document: doc });
    const trigger = canvas.getByRole("combobox", { name: "System" });
    await user.click(trigger);
    const list = await body.findByRole("listbox", { name: "System" });
    const popup = list.closest<HTMLElement>('[data-slot="select-content"]')!;
    const mission = within(list).getByRole("option", { name: "CN-109101 · Mission Computer" });
    await waitFor(() => expect(mission).toHaveFocus());
    const t = trigger.getBoundingClientRect();
    const viewport = doc.documentElement.clientWidth;
    await waitFor(() => {
      const p = popup.getBoundingClientRect();
      // Below the trigger and from its start edge (shifted back only where the list is wider than
      // the room after the trigger), never narrower than it.
      expect(p.top).toBeGreaterThanOrEqual(t.bottom);
      if (t.left + p.width <= viewport - 5) expect(Math.round(p.left)).toBe(Math.round(t.left));
      else expect(p.right).toBeLessThanOrEqual(viewport);
      expect(p.width).toBeGreaterThanOrEqual(t.width);
    });
    const p = popup.getBoundingClientRect();
    await expect(p.width).toBeLessThanOrEqual(Math.min(720, doc.documentElement.clientWidth));
    // Each option's text stays inside its row: a long label and an unbroken digest wrap.
    for (const option of within(list).getAllByRole("option")) {
      const text = option.querySelector<HTMLElement>('[data-slot="option-text"]')!;
      const row = option.getBoundingClientRect();
      await expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(row.right);
    }
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    const aligned = canvas.getByRole("combobox", { name: "Workflow status" });
    await user.click(aligned);
    const alignedList = await body.findByRole("listbox", { name: "Workflow status" });
    const alignedPopup = alignedList.closest<HTMLElement>('[data-slot="select-content"]')!;
    await waitFor(() =>
      expect(alignedPopup.getBoundingClientRect().top).toBeLessThan(
        aligned.getBoundingClientRect().bottom,
      ),
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
  },
};

/**
 * In a Field the trigger fills it, as an Input does; outside one, in a toolbar or a rail, it fits
 * its value. A value longer than the room truncates inside the trigger instead of widening it.
 */
export const Width: Story = {
  render: () => (
    <div className="max-w-full" style={{ width: 320 }}>
      <Stack space="space.300">
        <Field>
          <FieldLabel>Profile</FieldLabel>
          <Select
            items={{
              nist: "NIST SP 800-53 Rev 5.1.1 Security and Privacy Controls for Information Systems",
            }}
            defaultValue="nist"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nist">
                NIST SP 800-53 Rev 5.1.1 Security and Privacy Controls for Information Systems
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div data-testid="toolbar" className="flex items-center gap-100">
          <Select items={{ all: "All", open: "Open" }} defaultValue="all">
            <SelectTrigger aria-label="Show" size="small">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const profile = canvas.getByRole("combobox", { name: "Profile" });
    const field = profile.closest<HTMLElement>('[data-slot="field"]')!;
    await expect(profile.getBoundingClientRect().width).toBe(field.getBoundingClientRect().width);
    const value = profile.querySelector<HTMLElement>('[data-slot="select-value"]')!;
    await expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    await expect(field.scrollWidth).toBeLessThanOrEqual(field.clientWidth);
    const show = canvas.getByRole("combobox", { name: "Show" });
    await expect(show.getBoundingClientRect().width).toBeLessThan(
      canvas.getByTestId("toolbar").getBoundingClientRect().width / 2,
    );
  },
};

const baselines = [
  { value: "low", label: "Low", description: "149 controls for a low-impact system" },
  {
    value: "moderate",
    label: "Moderate",
    description: "287 controls for a moderate-impact system",
  },
  {
    value: "high",
    label: "High",
    reason: "Needs the privacy overlay, which this program has not adopted",
  },
];

/**
 * An option's description line tells similar options apart; `disabledReason` says why an option
 * cannot be chosen, readable on the disabled row. Neither joins the option's name or the value on
 * the closed trigger.
 */
export const Descriptions: Story = {
  render: () => (
    <div className="w-layout-list max-w-full">
      <Field>
        <FieldLabel>Baseline</FieldLabel>
        <Select items={baselines} defaultValue="moderate">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {baselines.map((baseline) => (
              <SelectItem
                key={baseline.value}
                value={baseline.value}
                description={baseline.description}
                disabledReason={baseline.reason}
              >
                {baseline.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument,
      canvas = within(canvasElement),
      body = within(doc.body),
      user = userEvent.setup({ document: doc });
    const trigger = canvas.getByRole("combobox", { name: "Baseline" });
    await expect(trigger).toHaveTextContent(/^Moderate$/);
    await user.click(trigger);
    const moderate = await body.findByRole("option", { name: "Moderate" });
    await expect(moderate).toHaveAccessibleDescription("287 controls for a moderate-impact system");
    const high = body.getByRole("option", { name: "High" });
    await expect(high).toHaveAttribute("aria-disabled", "true");
    await expect(high).toHaveAccessibleDescription(
      "Needs the privacy overlay, which this program has not adopted",
    );
    await waitFor(() => expect(moderate).toHaveFocus());
    await user.keyboard("{ArrowDown}{Enter}");
    // The disabled option is reached but not chosen.
    await expect(trigger).toHaveTextContent(/^Moderate$/);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
  },
};

/** The mistake the page is written to prevent, beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Pair
      do={
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select items={{ open: "Open", closed: "Closed" }} defaultValue="open">
            <SelectTrigger>
              <SelectValue placeholder="Choose a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      }
      doText="A Field's label names the choice, so it stays in view once a value is chosen."
      dont={
        <Select items={{ open: "Open", closed: "Closed" }} defaultValue="open">
          <SelectTrigger aria-label="Status of the finding">
            <SelectValue placeholder="Select status…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      }
      dontText="The placeholder is the only label: once a value is chosen, nothing on screen says what the field is."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox", { name: "Status" })).toHaveTextContent("Open");
    await expect(canvas.queryByText("Status of the finding")).toBeNull();
  },
};
