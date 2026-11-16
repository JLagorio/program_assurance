import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Chart, type ChartDueItem } from "../..";
import { DateLabel, Table } from "../../components";
import { Box, Stack } from "../../primitives";

/** The moment the stories are read at: November 16, 2026, so their late and soon stay put. */
const now = new Date("2026-11-16T15:00:00Z");

/** A program's open POA&M items by the day each is due: four late, one due today, two soon. */
const items: ChartDueItem[] = [
  { id: "poam-01", label: "Withdraw the password-only local logon", due: "2026-10-28" },
  { id: "poam-02", label: "Retire the shared maintenance account", due: "2026-11-02" },
  { id: "poam-03", label: "Rotate the timing receiver certificates", due: "2026-11-02" },
  { id: "poam-04", label: "Publish the retired key history", due: "2026-11-10" },
  { id: "poam-05", label: "Reissue the audit direction", due: "2026-11-16" },
  { id: "poam-06", label: "Patch the mission computer firmware", due: "2026-11-17" },
  { id: "poam-07", label: "Close the open ports on the field test set", due: "2026-11-18" },
  { id: "poam-08", label: "Ship the offline credential verifier", due: "2026-11-25" },
  { id: "poam-09", label: "Encrypt the maintenance laptop's swap", due: "2026-12-17" },
  {
    id: "poam-10",
    label: "Require the timing receiver to present its own certificate",
    due: "2027-01-13",
  },
  { id: "poam-11", label: "Retest both authentication objectives", due: "2027-02-13" },
  { id: "poam-12", label: "Make the switch exchange mutual", due: "2027-03-06" },
];

const meta = {
  title: "Patterns/Chart/DueRail",
  component: Chart.DueRail,
  parameters: { layout: "padded" },
  args: { items, now, label: "POA&M items by due date" },
} satisfies Meta<typeof Chart.DueRail>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The rail's dots, in the order a screen reader meets them. */
const dotsOf = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-slot="chart-due-dot"]'));

/** The rail on its own, named by `label`. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "POA&M items by due date" });
    await expect(within(list).getAllByRole("img")).toHaveLength(items.length);
  },
};

/** The items' table, as the register under the rail lists them. */
function ItemsTable() {
  return (
    <Table label="POA&M items">
      <thead>
        <tr>
          <Table.Header>POA&amp;M item</Table.Header>
          <Table.Header width={240}>Due</Table.Header>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <Table.Row key={item.id} data-id={item.id}>
            <Table.Cell>{item.label}</Table.Cell>
            <Table.Cell>
              <DateLabel value={item.due} now={now} />
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/**
 * A register's dated items on one axis, above the table that lists them. Today is ruled across;
 * a late dot is hatched in the danger tone and stands before the rule, a dot due today or within
 * two days is ringed in the warning tone, and the rest are neutral. Dots that would touch stand on
 * one another. Every dot is a row of the table, which says the same day in the same words.
 */
export const AboveItsTable: Story = {
  render: (args) => (
    <Stack space="space.200">
      <Chart title="POA&M items by due date" description="12 open · 4 late" xLabel="POA&M item">
        <Chart.DueRail items={args.items} now={args.now} />
      </Chart>
      <ItemsTable />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rail = canvasElement.querySelector<HTMLElement>('[data-slot="chart-due-rail"]')!;
    // The dots are a list named by the Frame's title, in date order.
    const list = canvas.getByRole("list", { name: "POA&M items by due date" });
    const dots = dotsOf(list);
    await expect(dots).toHaveLength(items.length);
    await expect(dots.map((dot) => dot.dataset["id"])).toEqual(items.map((item) => item.id));
    // A dot says its item, its day and, late or soon, the words the table's DateLabel says.
    await expect(dots[0]).toHaveAccessibleName(
      "Withdraw the password-only local logon, Oct 28, 2026, Overdue",
    );
    await expect(dots[4]).toHaveAccessibleName(
      "Reissue the audit direction, Nov 16, 2026, Due today",
    );
    await expect(dots[5]).toHaveAccessibleName(
      "Patch the mission computer firmware, Nov 17, 2026, Due tomorrow",
    );
    await expect(dots[7]).toHaveAccessibleName(
      "Ship the offline credential verifier, due Nov 25, 2026",
    );
    // The table holds every dot: one row each, saying the same.
    const table = canvas.getByRole("table");
    const rows = within(table).getAllByRole("row").slice(1);
    await expect(rows).toHaveLength(dots.length);
    for (const dot of dots) {
      const row = table.querySelector<HTMLElement>(`tr[data-id="${dot.dataset["id"]}"]`);
      await expect(row).not.toBeNull();
      const item = items.find((i) => i.id === dot.dataset["id"])!;
      await expect(row).toHaveTextContent(item.label);
      if (dot.dataset["state"] === "overdue") await expect(row).toHaveTextContent("Overdue");
    }
    // Late and soon are told by shape as well as colour: late is hatched, soon is ringed.
    const shape = (dot: HTMLElement) => {
      const style = getComputedStyle(dot);
      return {
        hatched: style.backgroundImage.includes("gradient"),
        ringed: style.boxShadow !== "none",
      };
    };
    const late = dots.filter((dot) => dot.dataset["state"] === "overdue");
    const soon = dots.filter((dot) => ["today", "soon"].includes(dot.dataset["state"] ?? ""));
    const rest = dots.filter((dot) => dot.dataset["state"] === "upcoming");
    await expect(late).toHaveLength(4);
    await expect(soon).toHaveLength(3);
    for (const dot of late) await expect(shape(dot).hatched).toBe(true);
    for (const dot of soon) await expect(shape(dot)).toEqual({ hatched: false, ringed: true });
    for (const dot of rest) await expect(shape(dot)).toEqual({ hatched: false, ringed: false });
    // Late dots stand before today's rule, and the rest after it.
    const rule = rail
      .querySelector<HTMLElement>('[data-slot="chart-due-today"]')!
      .getBoundingClientRect();
    for (const dot of late) await expect(dot.getBoundingClientRect().right).toBeLessThan(rule.left);
    for (const dot of [...soon, ...rest])
      await expect(dot.getBoundingClientRect().left).toBeGreaterThan(rule.right);
    // Two items due on one day stand one on the other.
    const [second, third] = [dots[1]!, dots[2]!].map((dot) => dot.getBoundingClientRect());
    await expect(Math.abs(second!.left - third!.left)).toBeLessThan(1);
    await expect(second!.top).not.toBe(third!.top);
  },
};

/**
 * Inside a Frame the rail is a chart like any other: the Table toggle lays its items out as the
 * table twin (the item and its day, with the words when it is late or soon) and the CSV holds
 * the ISO days; while the Frame loads, the rail's skeleton holds its place.
 */
export const InAFrame: Story = {
  render: (args) => (
    <Stack space="space.400">
      <Chart title="POA&M items by due date" description="12 open · 4 late" xLabel="POA&M item">
        <Chart.DueRail items={args.items} now={args.now} />
      </Chart>
      <Chart title="POA&M items by due date, loading" state="loading">
        <Chart.DueRail items={args.items} now={args.now} />
      </Chart>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [frame, loading] = canvas.getAllByRole("figure");
    await userEvent.click(within(frame!).getByRole("button", { name: "Table" }));
    const twin = await within(frame!).findByRole("table");
    const rows = within(twin).getAllByRole("row");
    await expect(rows).toHaveLength(items.length + 1);
    await expect(rows[0]).toHaveTextContent("POA&M itemDue");
    await expect(rows[1]).toHaveTextContent("Oct 28, 2026 · Overdue");
    // The table stands in for the rail.
    await expect(frame!.querySelector('[data-slot="chart-due-rail"]')).toBeNull();
    await userEvent.click(within(frame!).getByRole("button", { name: "Table" }));
    await waitFor(() =>
      expect(frame!.querySelector('[data-slot="chart-due-rail"]')).not.toBeNull(),
    );
    // Loading: the skeleton, busy, and no dots.
    const busy = loading!.querySelector<HTMLElement>('[data-slot="chart-due-rail"]')!;
    await expect(busy).toHaveAttribute("aria-busy", "true");
    await expect(dotsOf(loading!)).toHaveLength(0);
  },
};

/**
 * On a phone the rail keeps its axis to the screen's width: the dots stand closer and on one
 * another more, the month labels thin out so none runs past the end, and nothing scrolls sideways.
 */
export const Narrow: Story = {
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  render: (args) => (
    <Box>
      <Chart.DueRail {...args} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    const rail = canvasElement.querySelector<HTMLElement>('[data-slot="chart-due-rail"]')!;
    const box = rail.getBoundingClientRect();
    await expect(dotsOf(rail)).toHaveLength(items.length);
    for (const dot of dotsOf(rail)) {
      const at = dot.getBoundingClientRect();
      await expect(at.left).toBeGreaterThanOrEqual(box.left);
      await expect(at.right).toBeLessThanOrEqual(box.right);
    }
    for (const tick of rail.querySelectorAll('[data-slot="chart-due-tick"]'))
      await expect(tick.getBoundingClientRect().right).toBeLessThanOrEqual(box.right);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};
