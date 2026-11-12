import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Dot } from "../../components";
import { Trace, type TraceStage } from "../../patterns";

const meta = {
  title: "Patterns/Trace",
  component: Trace,
  parameters: { layout: "padded" },
  args: {
    label: "What the risk Signing keys rotate without a record rests on, and what answers it",
    focus: "risk-1",
    stages: [
      {
        id: "controls",
        label: "Controls",
        nodes: [
          { id: "au-10", code: "AU-10", title: "Non-repudiation", link: <a href="#au-10" /> },
          {
            id: "au-6-3",
            code: "AU-6(3)",
            title: "Correlate audit record repositories",
            link: <a href="#au-6-3" />,
          },
        ],
      },
      {
        id: "requirements",
        label: "Requirements",
        nodes: [
          {
            id: "req-360",
            code: "REQ-360",
            title: "Sign every arm and release record",
            link: <a href="#req-360" />,
          },
          {
            id: "req-349",
            code: "REQ-349",
            title: "Correlate audit records across segments",
            link: <a href="#req-349" />,
          },
        ],
      },
      {
        id: "evidence",
        label: "Evidence",
        nodes: [
          {
            id: "evd-253",
            title: "Signing key rotation log",
            meta: "Collected Oct 2",
            link: <a href="#evd-253" />,
          },
          {
            id: "evd-247",
            title: "Audit correlation test report",
            meta: "Collected Sep 18",
            link: <a href="#evd-247" />,
          },
        ],
      },
      {
        id: "issues",
        label: "Operational issues",
        nodes: [
          {
            id: "issue-1",
            title: "Retired keys are missing from the key history",
            mark: <Dot tone="danger" />,
            meta: "Critical · Open",
            link: <a href="#issue-1" />,
          },
          {
            id: "issue-2",
            title: "Correlation rules skip the ground segment",
            mark: <Dot tone="warning" />,
            meta: "Moderate · Triaged",
            link: <a href="#issue-2" />,
          },
        ],
      },
      {
        id: "risks",
        label: "Risks",
        nodes: [
          {
            id: "risk-1",
            title: "Signing keys rotate without a record",
            mark: <Dot tone="danger" />,
            meta: "Critical · Open",
            link: <a href="#risk-1" />,
          },
        ],
      },
      {
        id: "remediation",
        label: "Remediation",
        nodes: [
          {
            id: "item-1",
            title: "Publish the retired key history",
            meta: "Due Dec 29",
            link: <a href="#item-1" />,
          },
        ],
      },
    ],
    links: [
      { from: "au-10", to: "req-360" },
      { from: "au-6-3", to: "req-349" },
      { from: "req-360", to: "evd-253" },
      { from: "req-349", to: "evd-247" },
      { from: "evd-253", to: "issue-1" },
      { from: "evd-247", to: "issue-2" },
      { from: "issue-1", to: "risk-1" },
      { from: "issue-2", to: "risk-1" },
      { from: "risk-1", to: "item-1" },
    ],
  },
} satisfies Meta<typeof Trace>;
export default meta;
type Story = StoryObj<typeof meta>;

const root = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="trace"]')!;
/** Whether the trace has room for its columns: a phone and a narrow frame stack it, with no wires. */
const inColumns = (trace: HTMLElement) => trace.dataset["layout"] === "columns";

/** A risk, the issues it rests on, the evidence they cite, the requirements and controls behind them, and what is being done. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trace = root(canvasElement);
    await expect(canvas.getByRole("group", { name: /^What the risk Signing keys rotate/ })).toBe(
      trace,
    );
    // Each stage is a list named by the stage, in the chain's order.
    const stages = canvas.getAllByRole("list").filter((list) => list.tagName === "UL");
    await expect(stages).toHaveLength(6);
    await expect(stages[0]).toHaveAccessibleName(/^Controls/);
    await expect(within(stages[3]!).getAllByRole("listitem")).toHaveLength(2);
    // The record the trace is about is the current one, and says what it is linked to.
    const risk = canvas.getByRole("link", { name: /Signing keys rotate without a record/ });
    await expect(risk).toHaveAttribute("aria-current", "true");
    await expect(risk).toHaveAccessibleDescription(
      "Linked to Retired keys are missing from the key history, Correlation rules skip the ground segment, and Publish the retired key history",
    );
    // A wire a link, while the columns stand side by side.
    await waitFor(() =>
      expect(trace.querySelectorAll('[data-slot="trace-wire"]')).toHaveLength(
        inColumns(trace) ? 9 : 0,
      ),
    );
  },
};

/** Hovering or focusing a record lights the records it leads to and comes from, and dims the rest. */
export const Path: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trace = root(canvasElement);
    const lit = () =>
      [...trace.querySelectorAll<HTMLElement>('[data-slot="trace-node"][data-lit]')].map(
        (node) => node.dataset["traceId"],
      );
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: /AU-10/ })).toHaveFocus();
    await expect(trace).toHaveAttribute("data-active");
    // AU-10's path runs to the risk and its remediation, and leaves the other branch out.
    await expect(lit()).toEqual(["au-10", "req-360", "evd-253", "issue-1", "risk-1", "item-1"]);
    await waitFor(() =>
      expect(trace.querySelectorAll('[data-slot="trace-wire"][data-lit]')).toHaveLength(
        inColumns(trace) ? 5 : 0,
      ),
    );
    // The risk's path is every record: both branches lead to it.
    canvas.getByRole("link", { name: /Signing keys rotate without a record/ }).focus();
    await waitFor(() => expect(lit()).toHaveLength(10));
    (canvasElement.ownerDocument.activeElement as HTMLElement).blur();
    await waitFor(() => expect(trace).not.toHaveAttribute("data-active"));
  },
};

/** A link between stages that are not neighbours runs through the stage between them, in a gap of its own. */
export const PassingAStage: Story = {
  args: {
    label: "What the evidence Patch window report supports and what was found against it",
    focus: "evd-12",
    stages: [
      {
        id: "evidence",
        label: "Evidence",
        nodes: [{ id: "evd-12", title: "Patch window report", link: <a href="#evd-12" /> }],
      },
      {
        id: "issues",
        label: "Operational issues",
        nodes: [
          {
            id: "issue-7",
            title: "Patches applied outside the window",
            meta: "Low · Open",
            link: <a href="#issue-7" />,
          },
          {
            id: "issue-8",
            title: "Window not recorded for the ground segment",
            meta: "High · Open",
            link: <a href="#issue-8" />,
          },
        ],
      },
      {
        id: "risks",
        label: "Risks",
        nodes: [
          {
            id: "risk-4",
            title: "Unplanned outage during a pass",
            meta: "High · Open",
            link: <a href="#risk-4" />,
          },
        ],
        empty: "No risk recorded",
      },
      {
        id: "remediation",
        label: "Remediation",
        nodes: [
          {
            id: "item-9",
            title: "Record every window in the change log",
            link: <a href="#item-9" />,
          },
          { id: "item-10", title: "Move patching inside the window", link: <a href="#item-10" /> },
        ],
      },
    ],
    links: [
      { from: "evd-12", to: "issue-7" },
      { from: "evd-12", to: "issue-8" },
      { from: "issue-8", to: "risk-4" },
      { from: "risk-4", to: "item-9" },
      // No risk rests on this issue: its remediation is linked from the issue itself.
      { from: "issue-7", to: "item-10" },
    ],
  },
  play: async ({ canvasElement }) => {
    const trace = root(canvasElement);
    const pass = trace.querySelectorAll<HTMLElement>('[data-slot="trace-pass"]');
    await expect(pass).toHaveLength(1);
    // The gap is room for the wire, and nothing to read.
    await expect(pass[0]).toHaveAttribute("aria-hidden", "true");
    await expect(pass[0]!.closest('[data-slot="trace-stage"]')).toHaveTextContent(/^Risks/);
    await waitFor(() =>
      expect(trace.querySelectorAll('[data-slot="trace-wire"]')).toHaveLength(
        inColumns(trace) ? 5 : 0,
      ),
    );
    if (!inColumns(trace)) return;
    // The wire to the far record does not cross the record of the stage between.
    const risk = trace.querySelector('[data-trace-id="risk-4"]')!.getBoundingClientRect();
    const gap = pass[0]!.getBoundingClientRect();
    await expect(gap.bottom <= risk.top || gap.top >= risk.bottom).toBe(true);
  },
};

/** A stage with nothing in it says so: the gap in the chain is part of what the trace shows. */
export const EmptyStage: Story = {
  args: {
    label: "What the requirement REQ-412 answers and what proves it",
    focus: "req-412",
    stages: [
      {
        id: "controls",
        label: "Controls",
        nodes: [{ id: "sc-8", code: "SC-8", title: "Transmission confidentiality and integrity" }],
      },
      {
        id: "requirements",
        label: "Requirements",
        nodes: [{ id: "req-412", code: "REQ-412", title: "Encrypt the command uplink" }],
      },
      { id: "evidence", label: "Evidence", nodes: [], empty: "No evidence linked" },
    ],
    links: [{ from: "sc-8", to: "req-412" }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("No evidence linked")).toBeVisible();
    // Without a link element a record is text: nothing in this trace takes focus.
    await expect(canvas.queryAllByRole("link")).toHaveLength(0);
    await expect(canvas.getByText("Encrypt the command uplink").closest("[aria-current]")).not.toBe(
      null,
    );
  },
};

const many: TraceStage[] = [
  {
    id: "controls",
    label: "Controls",
    nodes: [{ id: "ac-2", code: "AC-2", title: "Account management", link: <a href="#ac-2" /> }],
  },
  {
    id: "requirements",
    label: "Requirements",
    nodes: Array.from({ length: 11 }, (_, index) => ({
      id: `req-${index + 1}`,
      code: `REQ-${100 + index}`,
      title: `Account rule ${index + 1}`,
      link: <a href={`#req-${index + 1}`} />,
    })),
  },
];

/** A stage shows `limit` records and folds the rest behind Show more, with their wires. */
export const Folded: Story = {
  args: {
    label: "The requirements that meet AC-2",
    focus: "ac-2",
    limit: 4,
    stages: many,
    links: many[1]!.nodes.map((node) => ({ from: "ac-2", to: node.id })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trace = root(canvasElement);
    const shown = () => trace.querySelectorAll('[data-slot="trace-node"]').length;
    await expect(shown()).toBe(5);
    const more = canvas.getByRole("button", { name: "Show 7 more" });
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(more);
    await expect(shown()).toBe(12);
    const fewer = canvas.getByRole("button", { name: "Show fewer" });
    await expect(fewer).toHaveAttribute("aria-expanded", "true");
    await waitFor(() =>
      expect(trace.querySelectorAll('[data-slot="trace-wire"]')).toHaveLength(
        inColumns(trace) ? 11 : 0,
      ),
    );
    await userEvent.click(fewer);
    await expect(shown()).toBe(5);
  },
};

/** On a phone the stages stack in the chain's order and the wires leave; each record still says what it is linked to. */
export const Phone: Story = {
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trace = root(canvasElement);
    await waitFor(() => expect(trace).toHaveAttribute("data-layout", "stack"));
    await expect(trace.querySelector('[data-slot="trace-wires"]')).toBe(null);
    const page = canvasElement.ownerDocument.documentElement;
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
    await expect(canvas.getByRole("link", { name: /REQ-360/ })).toHaveAccessibleDescription(
      "Linked to AU-10 Non-repudiation and Signing key rotation log",
    );
  },
};

const box = createRef<HTMLDivElement>();

/** Native props and the ref reach the trace's box. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: (args) => <Trace {...args} ref={box} id="risk-trace" data-testid="trace" />,
  play: async ({ canvasElement }) => {
    const trace = root(canvasElement);
    await expect(box.current).toBe(trace);
    await expect(trace).toHaveAttribute("id", "risk-trace");
    await expect(trace).toHaveAttribute("data-testid", "trace");
  },
};
