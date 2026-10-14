import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import { ChangeReview } from "../../patterns/change-review";

const meta = {
  title: "Patterns/ChangeReview",
  component: ChangeReview,
  parameters: { layout: "padded" },
  args: {
    changes: [
      {
        id: "policy-statement",
        record: "Service policy",
        field: "Statement",
        before: "Review service access every year and record the decision.",
        after: "Review service access every quarter and record the decision.",
      },
      {
        id: "test-owner",
        record: "Recovery exercise",
        field: "Owner",
        before: "Alex Morgan",
        after: "Dana Lee",
      },
    ],
    onInspect: fn(),
  },
  render: (args) => <ChangeReview {...args} />,
} satisfies Meta<typeof ChangeReview>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Review the actual recorded and proposed values; each disclosure opens the complete comparison. */
export const Playground: Story = {
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("table", { name: "Proposed changes" })).toBeVisible();
    const opener = canvas.getByRole("button", {
      name: "Show details for Service policy · Statement",
    });
    opener.focus();
    await userEvent.keyboard("{Enter}");
    const comparison = canvas.getByRole("group", { name: "Service policy · Statement" });
    await expect(comparison).toHaveTextContent("year");
    await expect(comparison).toHaveTextContent("quarter");
    await waitFor(() => expect(args.onInspect).toHaveBeenCalledWith("policy-statement"));
    await userEvent.click(
      canvas.getByRole("button", { name: "Hide details for Service policy · Statement" }),
    );
    await expect(canvas.queryByRole("group", { name: "Service policy · Statement" })).toBeNull();
    const search = canvas.getByRole("searchbox", { name: "Find a change" });
    await userEvent.type(search, "Recovery");
    await expect(canvas.getByText("Recovery exercise")).toBeVisible();
    await expect(canvas.queryByText("Service policy")).toBeNull();
    await userEvent.clear(search);
    await expect(canvas.getByText("Service policy")).toBeVisible();
  },
};

/** A rejected save retains every proposal and its issues; Retry belongs to the supplied command. */
export const WithIssues: Story = {
  args: {
    changes: [
      {
        id: "owner-conflict",
        record: "Recovery exercise",
        field: "Owner",
        before: "Alex Morgan",
        after: "Dana Lee",
        issue: "The owner changed in another session. Reload and review the current value.",
      },
    ],
    error: "The recorded values changed. Your proposed values are retained.",
    onRetry: fn(),
  },
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("Your proposed values are retained");
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
    await userEvent.click(
      canvas.getByRole("button", { name: "Show details for Recovery exercise · Owner" }),
    );
    await expect(
      canvas.getByRole("group", { name: "Recovery exercise · Owner" }),
    ).toHaveTextContent("Dana Lee");
    await expect(
      canvas.getAllByText(/The owner changed in another session/).length,
    ).toBeGreaterThan(0);
    await expect(args.onInspect).toHaveBeenCalledWith("owner-conflict");
  },
};

/** Busy review keeps its values and inspection available; a repeated Retry cannot start a second save. */
export const Pending: Story = {
  args: {
    pending: true,
    error: "The previous attempt did not complete. Retrying the same change set.",
    onRetry: fn(),
  },
  play: async ({ canvas, canvasElement, args }) => {
    await expect(canvasElement.querySelector('[data-slot="change-review"]')).toHaveAttribute(
      "aria-busy",
      "true",
    );
    const retry = canvas.getByRole("button", { name: "Retry" });
    await userEvent.click(retry);
    await expect(args.onRetry).not.toHaveBeenCalled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Show details for Service policy · Statement" }),
    );
    await expect(canvas.getByRole("group", { name: "Service policy · Statement" })).toBeVisible();
  },
};

/** More than a page remains bounded, and search reaches changes beyond the first page. */
export const ManyChanges: Story = {
  args: {
    changes: Array.from({ length: 80 }, (_, index) => ({
      id: `change-${index + 1}`,
      record: `Record ${index + 1}`,
      field: "Statement",
      before: `Recorded statement ${index + 1}`,
      after: `Proposed statement ${index + 1}`,
    })),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("row").length).toBeLessThanOrEqual(26);
    await expect(canvas.getByText("Record 1")).toBeVisible();
    await expect(canvas.queryByText("Record 26")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(canvas.getByText("Record 26")).toBeVisible();
    await userEvent.type(canvas.getByRole("searchbox", { name: "Find a change" }), "Record 80");
    await expect(canvas.getByText("Record 80")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Show details for Record 80 · Statement" }),
    );
    await expect(canvas.getByRole("group", { name: "Record 80 · Statement" })).toHaveTextContent(
      "Proposed statement 80",
    );
  },
};

/** An empty review says why there is no decision to make and adds no transaction action. */
export const Empty: Story = {
  args: { changes: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No proposed changes")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: /Apply|Save/ })).toBeNull();
  },
};

/** On a phone the row's remaining fields stay in its disclosure and the full Diff stays in bounds. */
export const Phone: Story = {
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  play: async ({ canvas, canvasElement }) => {
    const fields = await canvas.findByRole("button", {
      name: /^Show \d+ more fields for Service policy · Statement$/,
    });
    await userEvent.click(fields);
    await expect(fields).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(
      canvas.getByRole("button", { name: "Show details for Service policy · Statement" }),
    );
    const comparison = canvas.getByRole("group", { name: "Service policy · Statement" });
    await expect(comparison).toHaveTextContent("year");
    await expect(comparison).toHaveTextContent("quarter");
    const page = canvasElement.ownerDocument.documentElement;
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
  },
};

/** Native attributes, class names and the root ref remain the caller's; the part owns its slot. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  args: {
    id: "review-native",
    title: "Review native attributes",
    className: "max-w-full",
    ref: fn(),
  },
  render: (args) => <ChangeReview {...args} data-slot="custom-change-review" />,
  play: async ({ canvasElement, args }) => {
    const root = canvasElement.querySelector("#review-native");
    await expect(root).toHaveAttribute("data-slot", "change-review");
    await expect(root).toHaveAttribute("title", "Review native attributes");
    await expect(root).toHaveClass("max-w-full");
    await expect(args.ref).toHaveBeenCalledWith(root);
  },
};
