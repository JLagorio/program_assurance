import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Badge, Dot, Id, Indicator, Table, tones } from "../../components";
import { Box, Inline, Stack } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix: Grid } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/Indicator",
  component: Indicator,
  parameters: { layout: "padded" },
  args: { children: "High", tone: "danger" },
} satisfies Meta<typeof Indicator>;
export default meta;
type Story = StoryObj<typeof meta>;

const labels = {
  neutral: "Low",
  information: "Informational",
  success: "Healthy",
  warning: "Medium",
  danger: "High",
} as const;

/** Every tone as an Indicator, a bare Dot, and a Dot that says its name. A Dot with a `label` is an image with that name; a bare Dot is hidden, and the words beside it carry the status. */
export const IndicatorMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Grid
      rows={tones}
      cols={["Indicator", "Dot", "Dot with a label"] as const}
      rowLabel="tone"
      render={(tone, col) =>
        col === "Indicator" ? (
          <Indicator tone={tone}>{labels[tone]}</Indicator>
        ) : col === "Dot" ? (
          <Dot tone={tone} data-testid={`bare-${tone}`} />
        ) : (
          <Dot tone={tone} label={labels[tone]} />
        )
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const tone of tones) {
      // Named: an image a screen reader hears as the status.
      const named = canvas.getByRole("img", { name: labels[tone] });
      await expect(named).toHaveAttribute("data-slot", "dot");
      await expect(named).toHaveAttribute("data-tone", tone);
      await expect(named).not.toHaveAttribute("aria-hidden");
      // Bare: hidden, no role, no name.
      const bare = canvas.getByTestId(`bare-${tone}`);
      await expect(bare).toHaveAttribute("aria-hidden", "true");
      await expect(bare).not.toHaveAttribute("role");
      await expect(bare).not.toHaveAttribute("aria-label");
      // The Indicator's own Dot is hidden beside its word.
      const indicator = canvas
        .getAllByText(labels[tone])
        .map((word) => word.closest('[data-slot="indicator"]'))
        .find(Boolean);
      await expect(indicator?.querySelector('[data-slot="dot"]')).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    }
  },
};

const rows = [
  {
    id: "F-0231",
    title: "Shared admin account on the payables host",
    severity: "High",
    sev: "danger",
    status: "Open",
    tone: "danger",
  },
  {
    id: "F-0228",
    title: "Backup restore untested this quarter",
    severity: "Medium",
    sev: "warning",
    status: "In remediation",
    tone: "information",
  },
  {
    id: "F-0219",
    title: "Expired certificate on the reporting proxy",
    severity: "Low",
    sev: "neutral",
    status: "Closed",
    tone: "success",
  },
] as const;

/** In a table: severity is the Indicator, status the row's one pill. */
export const InRows: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <Table label="Findings">
        <thead>
          <tr>
            <Table.Header width={88}>Id</Table.Header>
            <Table.Header minWidth={200}>Finding</Table.Header>
            <Table.Header width={104}>Severity</Table.Header>
            <Table.Header width={128}>Status</Table.Header>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Table.Row key={r.id}>
              <Table.Cell>
                <Id>{r.id}</Id>
              </Table.Cell>
              <Table.Cell>{r.title}</Table.Cell>
              <Table.Cell>
                <Indicator tone={r.sev}>{r.severity}</Indicator>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="secondary" size="xsmall" tone={r.tone}>
                  {r.status}
                </Badge>
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  ),
};

/** An Indicator truncates its word when the column is narrower than it, and shows the whole on hover while it is cut; the whole stays in the DOM for a screen reader. The Dot never shrinks. A word that fits reveals nothing. */
export const Truncation: Story = {
  render: () => (
    <Stack space="space.150">
      <Box style={{ width: 160 }} className="border border-default px-100 py-050">
        <Indicator tone="danger">Obligation not stated by the consumer</Indicator>
      </Box>
      <Box style={{ width: 160 }} className="border border-default px-100 py-050">
        <Indicator tone="warning">Medium</Indicator>
      </Box>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cut = canvas.getByText("Obligation not stated by the consumer");
    const indicator = cut.closest<HTMLElement>('[data-slot="indicator"]')!;
    await expect(cut.scrollWidth).toBeGreaterThan(cut.clientWidth);
    await expect(getComputedStyle(cut).textOverflow).toBe("ellipsis");
    await expect(indicator.getBoundingClientRect().right).toBeLessThanOrEqual(
      indicator.parentElement!.getBoundingClientRect().right,
    );
    const dot = indicator.querySelector('[data-slot="dot"]')!.getBoundingClientRect();
    await expect(dot.width).toBe(6);
    await expect(indicator).toHaveTextContent("Obligation not stated by the consumer");
    await userEvent.hover(cut);
    await waitFor(() =>
      expect(document.querySelector('[data-slot="truncate-full-text"]')).toHaveTextContent(
        "Obligation not stated by the consumer",
      ),
    );
    await userEvent.unhover(cut);
    await waitFor(() =>
      expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull(),
    );
    const fits = canvas.getByText("Medium");
    await expect(fits.scrollWidth).toBeLessThanOrEqual(fits.clientWidth);
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.200" alignBlock="center">
            <Indicator tone="danger">High</Indicator>
            <Badge variant="secondary" tone="danger">
              Open
            </Badge>
          </Inline>
        }
        doText="Severity as an Indicator, status as the row's one pill."
        dont={
          <Inline space="space.100" alignBlock="center">
            <Badge variant="secondary" tone="danger">
              High
            </Badge>
            <Badge variant="secondary" tone="danger">
              Open
            </Badge>
          </Inline>
        }
        dontText="Two pills in a row. The eye cannot tell the rank from the state."
      />
      <Pair
        do={<Indicator tone="warning">Suspect</Indicator>}
        doText="The status as its word, with the Dot beside it: every reader gets the word."
        dont={<Dot tone="warning" label="Suspect" />}
        dontText="A Dot alone in a cell. A label names it for a screen reader, but a sighted reader sees colour alone."
      />
      <Pair
        do={
          <Badge variant="secondary" tone="success">
            Verified
          </Badge>
        }
        doText="A record's state is a Badge."
        dont={<Indicator tone="success">Verified</Indicator>}
        dontText="A state as an Indicator. The Dot ranks; it does not name a stage."
      />
      <Pair
        do={
          <Inline space="space.300" alignBlock="center">
            <Indicator tone="danger">High</Indicator>
            <Indicator tone="warning">Medium</Indicator>
            <Indicator tone="neutral">Low</Indicator>
          </Inline>
        }
        doText="The lowest rung is neutral and muted, so the scale reads from loud to quiet."
        dont={
          <Inline space="space.300" alignBlock="center">
            <Indicator tone="danger">High</Indicator>
            <Indicator tone="warning">Medium</Indicator>
            <Indicator tone="success">Low</Indicator>
          </Inline>
        }
        dontText="Low in success green. A low severity is not good news; it is a small problem."
      />
    </Stack>
  ),
};

export const Playground: Story = {};

const indicatorRef = createRef<HTMLSpanElement>();
const dotRef = createRef<SVGSVGElement>();

/** Native attributes, a class and a ref reach the Indicator's span and the Dot's svg, and each names itself last with `data-slot` and its `data-tone`. */
export const NativeAttributes: Story = {
  render: () => (
    <Inline space="space.200" alignBlock="center">
      <Indicator ref={indicatorRef} tone="danger" data-testid="severity" className="align-middle">
        High
      </Indicator>
      <Dot ref={dotRef} tone="warning" label="Suspect" data-testid="suspect" />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const indicator = canvas.getByTestId("severity");
    await expect(indicatorRef.current).toBe(indicator);
    await expect(indicator).toHaveAttribute("data-slot", "indicator");
    await expect(indicator).toHaveAttribute("data-tone", "danger");
    await expect(indicator).toHaveClass("align-middle");
    const dot = canvas.getByRole("img", { name: "Suspect" });
    await expect(dotRef.current).toBe(dot);
    await expect(dot).toHaveAttribute("data-testid", "suspect");
    await expect(dot).toHaveAttribute("data-slot", "dot");
  },
};
