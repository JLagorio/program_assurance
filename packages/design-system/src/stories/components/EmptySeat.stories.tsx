import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { EmptySeat, Person } from "../../components";
import { Stack } from "../../primitives";

const meta = {
  title: "Components/EmptySeat",
  component: EmptySeat,
  parameters: { layout: "padded" },
  args: { label: "No owner" },
} satisfies Meta<typeof EmptySeat>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A role nobody holds, said in words beside the avatar's empty form. Without `onSelect` it only reports. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const seat = canvasElement.querySelector<HTMLElement>('[data-slot="empty-seat"]')!;
    // The words say the role and that nobody holds it, and they are what a screen reader reads.
    await expect(seat).toHaveTextContent("No owner");
    await expect(canvas.getByText("No owner")).toBeVisible();
    // The dashed circle is the avatar's empty form: drawn, and hidden from assistive technology.
    const mark = seat.querySelector<HTMLElement>('[data-slot="empty-seat-mark"]')!;
    await expect(mark).toHaveAttribute("aria-hidden", "true");
    await expect(getComputedStyle(mark).borderStyle).toBe("dashed");
    // A seat that only reports is no button and no Tab stop.
    await expect(canvas.queryByRole("button")).toBeNull();
    await userEvent.tab();
    await expect(seat.contains(document.activeElement)).toBe(false);
  },
};

/** With `onSelect`, the whole seat is a button that fills it: here, the one that opens Assign owner. It keeps the seat's words as its name. */
export const Pressable: Story = {
  args: { label: "No owner", onSelect: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const seat = canvas.getByRole("button", { name: "No owner" });
    // Reached by keyboard, and Enter fills it as a click does.
    await userEvent.tab();
    await expect(seat).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onSelect).toHaveBeenCalledTimes(1);
    await userEvent.click(seat);
    await expect(args.onSelect).toHaveBeenCalledTimes(2);
    // The dashed circle is inside the button, so the whole seat is the target.
    await expect(seat.querySelector('[data-slot="empty-seat-mark"]')).not.toBeNull();
  },
};

/** In a column narrower than its words, the label ends in an ellipsis and shows whole on hover and keyboard focus; the circle keeps its size. */
export const InANarrowColumn: Story = {
  render: () => (
    <div data-testid="column" style={{ width: 120, maxWidth: "100%" }}>
      <EmptySeat label="No authorizing official" onSelect={() => {}} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const column = canvas.getByTestId("column").getBoundingClientRect();
    const seat = canvas.getByRole("button", { name: "No authorizing official" });
    await expect(seat.getBoundingClientRect().right).toBeLessThanOrEqual(column.right + 1);
    const mark = seat.querySelector<HTMLElement>('[data-slot="empty-seat-mark"]')!;
    await expect(Math.round(mark.getBoundingClientRect().width)).toBe(16);
  },
};

const assign = fn();

/** Seats beside the people who hold theirs: a Person where someone holds the role, an EmptySeat where nobody does. Each seat names its role, so two empty seats never read alike. */
export const BesideAPerson: Story = {
  render: () => (
    <Stack space="space.100">
      <Person name="Ray Colston" />
      <EmptySeat label="No owner" onSelect={() => assign("owner")} />
      <EmptySeat label="No assessor" onSelect={() => assign("assessor")} />
      <EmptySeat label="No authorizing official" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Two seats the reader can fill, each named for its role; the third only reports.
    const buttons = canvas.getAllByRole("button");
    await expect(buttons.map((button) => button.textContent)).toEqual(["No owner", "No assessor"]);
    await expect(canvas.getByText("No authorizing official").closest("button")).toBeNull();
    // Tab goes from one fillable seat to the next and passes over the one that only reports.
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "No owner" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "No assessor" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(assign).toHaveBeenCalledWith("assessor");
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};
