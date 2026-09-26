import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Badge, Absent, KeyValue, Person, TextLink } from "../../components";
import { Box, Stack } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/KeyValue",
  component: KeyValue,
  parameters: { layout: "padded" },
  args: { label: "Owner", children: "Dana Whitfield" },
} satisfies Meta<typeof KeyValue>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The tooltip that shows a cut label or value in full, once it has opened. */
const revealed = () =>
  waitFor(() => {
    const popup = document.querySelector<HTMLElement>('[data-slot="truncate-full-text"]');
    expect(popup).not.toBeNull();
    return popup!;
  });

/** Label widths, every kind of value, a wrapping one, a truncating one that reveals itself, and an absent one. */
export const KeyValueMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Values">
        <Box style={{ width: 360 }}>
          <KeyValue label="Control">CTRL-0412</KeyValue>
          <KeyValue label="Owner">
            <Person name="Dana Whitfield" />
          </KeyValue>
          <KeyValue label="Status">
            <Badge variant="secondary" tone="warning">
              Partially satisfied
            </Badge>
          </KeyValue>
          <KeyValue label="Evidence">
            <TextLink render={<a href="#ev" />}>EV-2201 Bank reconciliation, July</TextLink>
          </KeyValue>
          <KeyValue label="Assessor">
            <Absent />
          </KeyValue>
        </Box>
      </Specimens>
      <Specimens title="Label widths: 104 (default) and 160">
        <Box style={{ width: 360 }}>
          <KeyValue label="Owner">Dana Whitfield</KeyValue>
          <KeyValue label="Authorizing official" labelWidth={160}>
            Marcus Oyelaran
          </KeyValue>
        </Box>
      </Specimens>
      <Specimens title="A long value: truncated, with the whole on hover, and wrapped">
        <Box style={{ width: 360 }}>
          <KeyValue label="Statement">
            Accounts inactive for 90 days are disabled automatically by the identity provider.
          </KeyValue>
          <KeyValue label="Statement" wrap>
            Accounts inactive for 90 days are disabled automatically by the identity provider;
            exceptions need a ticket approved by the system owner.
          </KeyValue>
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** A rail: one label width down the column, the facts in the order the reader asks for them. */
const ownerRef = createRef<HTMLDListElement>();
const inspectOwner = fn();

export const InRail: Story = {
  render: () => (
    <Box style={{ width: 300 }} className="border-s border-default ps-200">
      <KeyValue
        ref={ownerRef}
        id="record-owner"
        data-field="owner"
        title="Record owner"
        label="Owner"
        labelWidth={160}
        className="py-075"
        style={{ gridTemplateColumns: "104px minmax(0, 1fr)", maxWidth: 300 }}
        onMouseEnter={inspectOwner}
      >
        <Person name="Dana Whitfield" />
      </KeyValue>
      <KeyValue label="Frequency">Quarterly</KeyValue>
      <KeyValue label="Last verified">12 Aug 2026</KeyValue>
      <KeyValue label="Next due">12 Nov 2026</KeyValue>
      <KeyValue label="Status">
        <Badge variant="secondary" tone="success">
          Verified
        </Badge>
      </KeyValue>
      <KeyValue label="Assessor">
        <Absent />
      </KeyValue>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    inspectOwner.mockClear();
    const canvas = within(canvasElement);
    const owner = canvas.getByTitle("Record owner");
    await expect(ownerRef.current).toBe(owner);
    await expect(owner.tagName).toBe("DL");
    await expect(owner).toHaveAttribute("id", "record-owner");
    await expect(owner).toHaveAttribute("data-field", "owner");
    await expect(owner).toHaveClass("grid", "py-075");
    await expect(owner).not.toHaveClass("py-050");
    await expect(owner.style.gridTemplateColumns).toBe("104px minmax(0px, 1fr)");
    await expect(owner).toHaveStyle({ maxWidth: "300px" });
    await expect(within(owner).getByRole("term")).toHaveTextContent("Owner");
    await expect(within(owner).getByRole("definition")).toHaveTextContent("Dana Whitfield");
    await userEvent.hover(owner);
    await expect(inspectOwner).toHaveBeenCalledTimes(1);
    // A value that fits carries no title and opens nothing.
    const frequency = canvas.getByText("Quarterly");
    await expect(frequency).not.toHaveAttribute("title");
    await userEvent.hover(frequency);
    await new Promise((resolve) => setTimeout(resolve, 450));
    await expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull();
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ maxWidth: 300 }}>
            <KeyValue label="Owner">Dana Whitfield</KeyValue>
            <KeyValue label="Frequency">Quarterly</KeyValue>
            <KeyValue label="Last verified">12 Aug 2026</KeyValue>
          </Box>
        }
        doText="One label width down the rail, so the values make a column."
        dont={
          <Box style={{ maxWidth: 300 }}>
            <KeyValue label="Owner" labelWidth={64}>
              Dana Whitfield
            </KeyValue>
            <KeyValue label="Frequency" labelWidth={96}>
              Quarterly
            </KeyValue>
            <KeyValue label="Last verified" labelWidth={120}>
              12 Aug 2026
            </KeyValue>
          </Box>
        }
        dontText="A width per row. The values stagger and the eye cannot run down them."
      />
      <Pair
        do={
          <Box style={{ maxWidth: 300 }}>
            <KeyValue label="Objective" wrap>
              Payables are approved and paid by different people, so no one person can create and
              settle a vendor invoice.
            </KeyValue>
          </Box>
        }
        doText="A statement wraps."
        dont={
          <Box style={{ maxWidth: 300 }}>
            <KeyValue label="Objective">
              Payables are approved and paid by different people, so no one person can create and
              settle a vendor invoice.
            </KeyValue>
          </Box>
        }
        dontText="A statement truncated. The tooltip holds it, but a hover is not reading."
      />
      <Pair
        do={
          <Box style={{ maxWidth: 300 }}>
            <KeyValue label="Assessor">
              <Absent />
            </KeyValue>
          </Box>
        }
        doText="Nothing there is an Absent: a muted dash."
        dont={
          <Box style={{ maxWidth: 300 }}>
            <KeyValue label="Assessor:">N/A</KeyValue>
          </Box>
        }
        dontText="A colon on the label and N/A for the value. The column is the colon, and N/A says not applicable, which is a different fact."
      />
    </Stack>
  ),
};

export const Playground: Story = {};

/** An identifier or a timestamp with no spaces: `wrap` breaks it inside the rail rather than past it; without `wrap` it truncates and shows the whole on hover. */
export const Unbroken: Story = {
  render: () => (
    <Box style={{ width: 260 }} className="border-s border-default ps-200">
      <KeyValue label="Updated" wrap>
        2026-09-12T18:01:21.982404+00:00
      </KeyValue>
      <KeyValue label="Id" wrap>
        9d028927-4402-5669-9c15-fe3adbe001f8
      </KeyValue>
      <KeyValue label="Id">9d028927-4402-5669-9c15-fe3adbe001f8</KeyValue>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const values = Array.from(canvasElement.querySelectorAll("dd"));
    const box = canvasElement.firstElementChild!.getBoundingClientRect();
    for (const value of values) {
      await expect(value.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 1);
    }
    await expect(values[0]!.scrollWidth).toBeLessThanOrEqual(values[0]!.clientWidth + 1);
    await userEvent.hover(values[2]!);
    const full = await revealed();
    await expect(full).toHaveTextContent("9d028927-4402-5669-9c15-fe3adbe001f8");
    await userEvent.unhover(values[2]!);
  },
};

/**
 * A value that is a control, a TextLink or an Editable, truncates across only: the ellipsis shows,
 * and the control's focus ring and its touch area (24px on its line, where a pointer is coarse)
 * reach above and below the row instead of being cut to it.
 */
export const ControlInAValue: Story = {
  render: () => (
    <Box style={{ maxWidth: 280 }} className="border-s border-default ps-200">
      <KeyValue label="Frequency">Quarterly</KeyValue>
      <KeyValue label="Evidence">
        <TextLink render={<a href="#ev" />}>
          EV-2201 Bank reconciliation for July, signed by the controller
        </TextLink>
      </KeyValue>
      <KeyValue label="Next due">12 Nov 2026</KeyValue>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: /EV-2201 Bank reconciliation/ });
    const value = link.closest("dd")!;
    const style = getComputedStyle(value);
    await expect(style.overflowX).toBe("clip");
    await expect(style.overflowY).toBe("visible");
    await expect(style.textOverflow).toBe("ellipsis");
    await expect(style.whiteSpace).toBe("nowrap");
    await expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    const box = link.getBoundingClientRect();
    const at = (dy: number) =>
      canvasElement.ownerDocument.elementFromPoint(
        value.getBoundingClientRect().left + 8,
        box.top + box.height / 2 + dy,
      );
    if (matchMedia("(any-pointer: coarse)").matches) {
      await expect(at(-11.5)).toBe(link);
      await expect(at(11.5)).toBe(link);
    } else await expect(getComputedStyle(link, "::before").content).toBe("none");
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
  },
};

/**
 * A composed value (a code and a title, a TextLink) reveals its whole text too: on hover, and
 * when the link inside takes keyboard focus. A label that is cut reveals itself the same way.
 */
export const CutValueAndLabel: Story = {
  render: () => (
    <Box style={{ maxWidth: 300 }} className="border-s border-default ps-200">
      <KeyValue label="Requirement">
        REQ-001 ·{" "}
        <TextLink href="#req-001">AC enforcement requirement for the tactical edge</TextLink>
      </KeyValue>
      <KeyValue label="Planned completion date">12 Nov 2026</KeyValue>
    </Box>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link");
    await userEvent.tab();
    await expect(link).toHaveFocus();
    const value = await revealed();
    await expect(value).toHaveTextContent(
      "REQ-001 · AC enforcement requirement for the tactical edge",
    );
    await userEvent.tab();
    await waitFor(() =>
      expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull(),
    );
    const label = canvas.getByText("Planned completion date");
    await expect(label.tagName).toBe("DT");
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    await userEvent.hover(label);
    await expect(await revealed()).toHaveTextContent("Planned completion date");
    await userEvent.unhover(label);
  },
};

/**
 * A rail's facts as one definition list: KeyValue.Group gives every row one label width, so the
 * values make a column, and a screen reader hears one list of pairs instead of one list per fact.
 */
export const Group: Story = {
  render: () => (
    <Box style={{ maxWidth: 320 }} className="border-s border-default ps-200">
      <KeyValue.Group labelWidth={124} aria-label="Details">
        <KeyValue label="Owner">
          <Person name="Dana Whitfield" />
        </KeyValue>
        <KeyValue label="Frequency">Quarterly</KeyValue>
        <KeyValue label="Last verified">12 Aug 2026</KeyValue>
        <KeyValue label="Authorizing official">Marcus Oyelaran</KeyValue>
        <KeyValue label="Status">
          <Badge variant="secondary" tone="success">
            Verified
          </Badge>
        </KeyValue>
        <KeyValue label="Assessor">
          <Absent label="Not recorded" />
        </KeyValue>
      </KeyValue.Group>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const lists = canvasElement.querySelectorAll("dl");
    await expect(lists).toHaveLength(1);
    const group = lists[0]!;
    await expect(group).toHaveAttribute("data-slot", "key-value-group");
    await expect(group).toHaveAttribute("aria-label", "Details");
    const rows = Array.from(group.children) as HTMLElement[];
    await expect(rows).toHaveLength(6);
    for (const row of rows) {
      await expect(row.tagName).toBe("DIV");
      await expect(row.children[0]!.tagName).toBe("DT");
      await expect(row.children[1]!.tagName).toBe("DD");
    }
    // One label width down the group: every value starts at the same place.
    const starts = rows.map((row) => Math.round(row.children[1]!.getBoundingClientRect().left));
    await expect(new Set(starts).size).toBe(1);
    const label = rows[0]!.children[0]!.getBoundingClientRect();
    await expect(Math.round(label.width)).toBeGreaterThanOrEqual(124);
    await expect(within(group).getByText("Not recorded")).toHaveAttribute(
      "data-slot",
      "visually-hidden",
    );
  },
};

/**
 * In a narrow panel the group puts each label over its value, so neither is cut: `auto` stacks
 * the rows when a value would have less than 8rem beside its label.
 */
export const GroupInANarrowPanel: Story = {
  render: () => (
    <Stack space="space.300">
      {[360, 220].map((width) => (
        <Box
          key={width}
          data-testid={`panel-${width}`}
          style={{ width, maxWidth: "100%" }}
          className="border-s border-default ps-200"
        >
          <KeyValue.Group>
            <KeyValue label="Implementation status">Partially implemented</KeyValue>
            <KeyValue label="Frequency">Quarterly</KeyValue>
          </KeyValue.Group>
        </Box>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    const rowOf = (width: number) =>
      canvas.getByTestId(`panel-${width}`).querySelector<HTMLElement>('[data-slot="key-value"]')!;
    const beside = (row: HTMLElement) => {
      const [term, value] = [row.children[0]!, row.children[1]!].map((el) =>
        el.getBoundingClientRect(),
      );
      return Math.abs(term!.top - value!.top) < 4;
    };
    const wide = rowOf(360);
    if (wide.getBoundingClientRect().width >= 104 + 12 + 128) await expect(beside(wide)).toBe(true);
    const narrow = rowOf(220);
    await expect(beside(narrow)).toBe(false);
    const [term, value] = [narrow.children[0]!, narrow.children[1]!];
    await expect(value.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      term.getBoundingClientRect().bottom - 1,
    );
    // Stacked, the label has the row's width and is not cut.
    await expect(term.scrollWidth).toBeLessThanOrEqual(term.clientWidth + 1);
  },
};

/** `columns` keeps label beside value at any width, as a rail of one-line rows needs; `stacked` always puts the label over the value. */
export const GroupLayouts: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="columns">
        <Box style={{ width: 240, maxWidth: "100%" }}>
          <KeyValue.Group layout="columns" data-testid="columns">
            <KeyValue label="Owner">Dana Whitfield</KeyValue>
            <KeyValue label="Next due">12 Nov 2026</KeyValue>
          </KeyValue.Group>
        </Box>
      </Specimens>
      <Specimens title="stacked">
        <Box style={{ width: 240, maxWidth: "100%" }}>
          <KeyValue.Group layout="stacked" data-testid="stacked">
            <KeyValue label="Owner">Dana Whitfield</KeyValue>
            <KeyValue label="Next due">12 Nov 2026</KeyValue>
          </KeyValue.Group>
        </Box>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const columns = canvas.getByTestId("columns").querySelector<HTMLElement>("div")!;
    await expect(columns).toHaveAttribute("data-layout", "columns");
    await expect(columns.style.gridTemplateColumns).toBe("104px minmax(0px, 1fr)");
    const stacked = canvas.getByTestId("stacked").querySelector<HTMLElement>("div")!;
    await expect(stacked).toHaveAttribute("data-layout", "stacked");
    await expect(getComputedStyle(stacked).flexDirection).toBe("column");
  },
};

/**
 * The group ends at the value: a KeyValue inside a row's value, as a peek's facts would be, is its
 * own definition list again rather than a row of a list it does not sit in.
 */
export const GroupEndsAtTheValue: Story = {
  render: () => (
    <Box style={{ maxWidth: 360 }} className="border-s border-default ps-200">
      <KeyValue.Group>
        <KeyValue label="Owner" wrap>
          <Stack space="space.050">
            <Person name="Dana Whitfield" />
            <KeyValue label="Team">Identity services</KeyValue>
          </Stack>
        </KeyValue>
      </KeyValue.Group>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="key-value-group"]')!;
    const value = group.querySelector(":scope > div > dd")!;
    const inner = value.querySelector("dl")!;
    await expect(inner).not.toBeNull();
    await expect(inner).toHaveAttribute("data-slot", "key-value");
    await expect(Array.from(inner.children).map((child) => child.tagName)).toEqual(["DT", "DD"]);
    await expect(within(inner).getByRole("term")).toHaveTextContent("Team");
  },
};
