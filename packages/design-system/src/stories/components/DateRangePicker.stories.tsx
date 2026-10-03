import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  DateRangePicker,
  Field,
  FieldDescription,
  FieldLabel,
  type DateRangePreset,
} from "../../components";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const presets: DateRangePreset[] = [
  { label: "September 2026", value: { start: "2026-09-01", end: "2026-09-30" } },
  { label: "Q3 2026", value: { start: "2026-07-01", end: "2026-09-30" } },
  { label: "Q4 2026", value: { start: "2026-10-01", end: "2026-12-31" } },
  { label: "FY 2026", value: { start: "2025-10-01", end: "2026-09-30" } },
];

const meta = {
  title: "Components/DateRangePicker",
  component: DateRangePicker,
  parameters: { layout: "padded" },
  args: {
    "aria-label": "Reporting period",
    defaultValue: { start: "2026-09-07", end: "2026-09-11" },
    onValueChange: fn(),
  },
} satisfies Meta<typeof DateRangePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Opens the month from its trigger and waits for the grid. */
const openMonths = async (trigger: HTMLElement, name: string) => {
  await userEvent.click(trigger);
  const popup = await within(trigger.ownerDocument.body).findByRole("dialog", { name });
  await waitFor(() => expect(popup.querySelector('[role="grid"]')).not.toBeNull());
  return popup;
};
const closed = async (trigger: HTMLElement) => {
  await waitFor(() => expect(within(trigger.ownerDocument.body).queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(trigger).toHaveFocus());
};

/**
 * The controls. The first day chosen starts a new range and the second ends it; the popover then
 * closes, focus returns to the trigger and the range is reported. Until the end is chosen the
 * footer says so, and a screen reader hears it.
 */
export const Playground: Story = {
  render: (args) => (
    <div style={{ maxWidth: 280, minHeight: 440 }}>
      <DateRangePicker {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Reporting period" });
    await expect(trigger).toHaveAttribute("data-slot", "date-range-picker");
    await expect(trigger).toHaveTextContent(/Sep 7\s–\s11, 2026/);
    await expect(trigger).toHaveAccessibleDescription("September 7, 2026 to September 11, 2026");
    const popup = within(await openMonths(trigger, "Reporting period"));
    // The months open on the range's first day, the one day in the Tab order.
    await waitFor(() =>
      expect(popup.getByRole("button", { name: /September 7, 2026/ })).toHaveFocus(),
    );
    await userEvent.click(popup.getByRole("button", { name: /September 14, 2026/ }));
    await expect(popup.getByText("Choose the end date.")).toBeVisible();
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await userEvent.click(popup.getByRole("button", { name: /September 18, 2026/ }));
    await closed(trigger);
    await expect(args.onValueChange).toHaveBeenCalledWith({
      start: "2026-09-14",
      end: "2026-09-18",
    });
    await expect(trigger).toHaveAccessibleDescription("September 14, 2026 to September 18, 2026");
  },
};

/**
 * Presets beside the month: choosing one sets the range and closes. The preset that matches the
 * value is pressed and carries a check, not only a tint. On a phone the presets wrap above the
 * month.
 */
export const WithPresets: Story = {
  render: () => (
    <form aria-label="Report" style={{ maxWidth: 320, minHeight: 480 }}>
      <Field>
        <FieldLabel>Reporting period</FieldLabel>
        <DateRangePicker presets={presets} startName="from" endName="to" />
        <FieldDescription>The days the report covers, inclusive.</FieldDescription>
      </Field>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole("form", { name: "Report" }) as HTMLFormElement;
    const trigger = canvas.getByRole("button", { name: "Reporting period" });
    await expect(trigger).toHaveTextContent("Choose dates");
    await expect(trigger).toHaveAccessibleDescription(/The days the report covers/);
    const popup = within(await openMonths(trigger, "Reporting period"));
    // With no range the months open on today, past the presets before them. Near a month's end the
    // next month also shows today as an outside day, so the check reads the focused day's name.
    await waitFor(() =>
      expect(trigger.ownerDocument.activeElement).toHaveAccessibleName(/, Today$/),
    );
    const presetGroup = within(popup.getByRole("group", { name: "Presets" }));
    await userEvent.click(presetGroup.getByRole("button", { name: "Q3 2026" }));
    await closed(trigger);
    await expect(trigger).toHaveTextContent(/Jul 1\s–\sSep 30, 2026/);
    await expect(new FormData(form).get("from")).toBe("2026-07-01");
    await expect(new FormData(form).get("to")).toBe("2026-09-30");

    const again = within(await openMonths(trigger, "Reporting period"));
    await expect(again.getByRole("button", { name: "Q3 2026" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(again.getByRole("button", { name: "Q4 2026" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await userEvent.click(again.getByRole("button", { name: "Clear" }));
    await closed(trigger);
    await expect(trigger).toHaveTextContent("Choose dates");
    await expect(new FormData(form).get("from")).toBe("");
  },
};

/** `min`, `max` and `isDateUnavailable` as on DatePicker. A preset that reaches outside them is disabled but stays reachable, and says why. */
export const MinAndMax: Story = {
  render: () => (
    <div style={{ maxWidth: 320, minHeight: 480 }}>
      <Field>
        <FieldLabel>Audit window</FieldLabel>
        <DateRangePicker presets={presets} min="2026-09-01" max="2026-12-31" />
        <FieldDescription>Between Sep 1 and Dec 31, 2026.</FieldDescription>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Audit window" });
    const popup = within(await openMonths(trigger, "Audit window"));
    const early = popup.getByRole("button", { name: "Q3 2026" });
    await expect(early).toHaveAttribute("aria-disabled", "true");
    await expect(early).not.toHaveAttribute("disabled");
    await expect(early).toHaveAccessibleDescription("The earliest date is Sep 1, 2026.");
    // Pressing it chooses nothing and leaves the months open.
    await userEvent.click(early);
    await expect(
      within(canvasElement.ownerDocument.body).getByRole("dialog", { name: "Audit window" }),
    ).toBeVisible();
    await expect(trigger).toHaveTextContent("Choose dates");
    await expect(popup.getByRole("button", { name: "Q4 2026" })).toBeEnabled();
    await expect(popup.getByRole("button", { name: "Q4 2026" })).not.toHaveAttribute(
      "aria-disabled",
    );
    // The months open on today's month, held inside the limits, so the check holds on any day:
    // stepping back stops at the month of `min`, and the control says it is unavailable there.
    const previous = () => popup.getByRole("button", { name: "Previous month" });
    for (let step = 0; step < 4 && previous().getAttribute("aria-disabled") !== "true"; step += 1) {
      await userEvent.click(previous());
    }
    await expect(popup.getAllByRole("grid")[0]).toHaveAccessibleName("September 2026");
    await expect(previous()).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Escape}");
    await closed(trigger);
  },
};

/** The mistakes the page is written to prevent. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Pair
      do={
        <div style={{ maxWidth: 280 }}>
          <Field>
            <FieldLabel>Program period</FieldLabel>
            <DateRangePicker defaultValue={{ start: "2026-10-01", end: "2027-09-30" }} />
          </Field>
        </div>
      }
      doText="One field for one range: the ends constrain each other and the trigger reads the whole range."
      dont={
        <div style={{ maxWidth: 280 }}>
          <Field>
            <FieldLabel>Starts on</FieldLabel>
            <DateRangePicker
              aria-label="Starts on"
              defaultValue={{ start: "2026-10-01", end: "2026-10-01" }}
            />
          </Field>
        </div>
      }
      dontText="A range picker for one day. A single day is a DatePicker; a start and an end that stand apart are two DatePickers with min and max."
    />
  ),
};
