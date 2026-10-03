import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ActionBar } from "../../patterns";
import { BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "../../components";

const requestEvidence = fn();
const markSatisfied = fn();

// ActionBar is deprecated: its stories stay in the sidebar and in every test run, and leave the
// manifest MCP reads, so an agent is never offered it as code to copy.
const meta = {
  title: "Patterns/ActionBar",
  component: ActionBar,
  tags: ["!manifest"],
  parameters: { layout: "padded" },
  args: {
    crumbs: (
      <>
        <BreadcrumbItem>
          <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#atlas">Atlas</BreadcrumbLink>
        </BreadcrumbItem>
      </>
    ),
    id: "AC-2(3)",
    title: "Disable accounts",
    context: "Atlas ground segment",
    states: [
      { label: "Implementation", value: "Partially satisfied", tone: "warning" },
      { label: "Assessment", value: "Not assessed", tone: "neutral" },
      { label: "Evidence", value: "34d", tone: "success" },
    ],
    actions: [
      { label: "Request evidence", onSelect: requestEvidence },
      {
        label: "Mark satisfied",
        onSelect: markSatisfied,
        primary: true,
        blocked: "2 findings still open",
      },
    ],
  },
} satisfies Meta<typeof ActionBar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A work surface's pinned header: the trail ending in the id, the title, the state axes as facts, and the actions that change them. Mark satisfied is blocked: it stays in the row and in the tab order, disabled, and the reason under the row is its description, so a keyboard or screen-reader user reaches it and hears why. */
export const Blocked: Story = {
  name: "A blocked action",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: "Disable accounts" })).toBeVisible();
    await expect(canvas.getByText("AC-2(3)")).toBeVisible();
    const request = canvas.getByRole("button", { name: "Request evidence" });
    const mark = canvas.getByRole("button", { name: "Mark satisfied" });
    await expect(mark).toHaveAttribute("aria-disabled", "true");
    await expect(mark).toHaveAccessibleDescription("Mark satisfied: 2 findings still open");
    await expect(request).not.toHaveAttribute("aria-describedby");
    // Tab reaches the blocked action after the one that can run.
    request.focus();
    await userEvent.tab();
    await expect(mark).toHaveFocus();
    markSatisfied.mockClear();
    await userEvent.keyboard("{Enter}");
    await expect(markSatisfied).not.toHaveBeenCalled();
    requestEvidence.mockClear();
    await userEvent.click(request);
    await expect(requestEvidence).toHaveBeenCalledTimes(1);
  },
};

/** Every action can run: nothing is written under the row. */
export const Ready: Story = {
  args: {
    actions: [
      { label: "Request evidence", onSelect: requestEvidence },
      { label: "Mark satisfied", onSelect: markSatisfied, primary: true },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mark = canvas.getByRole("button", { name: "Mark satisfied" });
    await expect(mark).not.toHaveAttribute("aria-disabled");
    await expect(mark).not.toHaveAttribute("aria-describedby");
    markSatisfied.mockClear();
    await userEvent.click(mark);
    await expect(markSatisfied).toHaveBeenCalledTimes(1);
  },
};
