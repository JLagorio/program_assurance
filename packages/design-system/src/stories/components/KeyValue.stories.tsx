import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Badge, Absent, KeyValue, Person, TextLink } from "../../components";
import { Editable } from "../../patterns";
import { Box, Stack } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/KeyValue",
  component: KeyValue,
  parameters: { layout: "padded" },
  args: { label: "Owner", children: "Dana Whitfield" },
} satisfies Meta<typeof KeyValue>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * How far a focused element's ring reaches past its box across: its outline's width plus its
 * offset, which is negative for a ring drawn inside the edge.
 */
const ringReach = (el: Element) => {
  const style = getComputedStyle(el);
  return Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
};

/**
 * Whether a focused element's ring lies inside `box` across. A value clips at its own box in
 * every browser (no clip margin, which Safari lacks), so the ring must fit it.
 */
const ringInside = (el: Element, box: DOMRect) => {
  const rect = el.getBoundingClientRect();
  const reach = ringReach(el);
  expect(rect.left - reach).toBeGreaterThanOrEqual(box.left - 0.5);
  expect(rect.right + reach).toBeLessThanOrEqual(box.right + 0.5);
};

/** The tooltip that shows a cut value in full, once it has opened. */
const revealed = () =>
  waitFor(() => {
    const popup = document.querySelector<HTMLElement>('[data-slot="truncate-full-text"]');
    expect(popup).not.toBeNull();
    return popup!;
  });

/** Label widths, every kind of value, a wrapping one, a truncating one that reveals itself, and an absent one. */
export const KeyValueMatrix: Story = {
  tags: ["!manifest"],
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
      <Specimens title="Label widths: default (104) and wide (160)">
        <Box style={{ width: 360 }}>
          <KeyValue label="Owner">Dana Whitfield</KeyValue>
          <KeyValue label="Authorizing official" labelWidth="wide">
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

export const Playground: Story = {};

/** A rail: one label width down the column, the facts in the order the reader asks for them. */
export const InRail: Story = {
  render: () => (
    <Box style={{ maxWidth: 300 }} className="border-s border-default ps-200">
      <KeyValue label="Owner">
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
    const canvas = within(canvasElement);
    const terms = canvas.getAllByRole("term");
    await expect(terms.map((term) => term.textContent)).toEqual([
      "Owner",
      "Frequency",
      "Last verified",
      "Next due",
      "Status",
      "Assessor",
    ]);
    // One label width down the rail, so the values start in one column.
    const starts = canvas
      .getAllByRole("definition")
      .map((value) => Math.round(value.getBoundingClientRect().left));
    await expect(new Set(starts).size).toBe(1);
    // A value that fits carries no title and opens nothing.
    const frequency = canvas.getByText("Quarterly");
    await expect(frequency).not.toHaveAttribute("title");
    await userEvent.hover(frequency);
    await new Promise((resolve) => setTimeout(resolve, 450));
    await expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull();
  },
};

const ownerRef = createRef<HTMLDListElement>();
const inspectOwner = fn();

/** Native `dl` props, a class, a style and a ref reach the pair's element. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: () => (
    <Box style={{ width: 300, maxWidth: "100%" }}>
      <KeyValue
        ref={ownerRef}
        id="record-owner"
        data-field="owner"
        title="Record owner"
        label="Owner"
        labelWidth="wide"
        className="py-075"
        style={{ gridTemplateColumns: "104px minmax(0, 1fr)", maxWidth: 300 }}
        onMouseEnter={inspectOwner}
      >
        <Person name="Dana Whitfield" />
      </KeyValue>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    inspectOwner.mockClear();
    const owner = within(canvasElement).getByTitle("Record owner");
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
    // At least once: the test browser's own pointer may rest where the pair renders.
    await expect(inspectOwner).toHaveBeenCalled();
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
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
            <KeyValue label="Owner" labelWidth="narrow">
              Dana Whitfield
            </KeyValue>
            <KeyValue label="Frequency" labelWidth="default">
              Quarterly
            </KeyValue>
            <KeyValue label="Last verified" labelWidth="wide">
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
 * reach above and below the row instead of being cut to it. A link that is the whole value is cut
 * to the value's width, with its own ellipsis, and draws its ring inside its edge, so the clip
 * cannot take any side of it in any browser; its whole text shows on hover and on keyboard focus.
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
    // The value clips across only, at its own box: no clip margin, in every browser.
    await expect(style.overflowX).toBe("clip");
    await expect(style.overflowY).toBe("visible");
    await expect(parseFloat(style.overflowClipMargin) || 0).toBe(0);
    await expect(style.textOverflow).toBe("ellipsis");
    await expect(style.whiteSpace).toBe("nowrap");
    // The link is cut to the value's width and ends in its own ellipsis.
    const linkStyle = getComputedStyle(link);
    await expect(linkStyle.display).toBe("inline-block");
    await expect(linkStyle.textOverflow).toBe("ellipsis");
    await expect(link.scrollWidth).toBeGreaterThan(link.clientWidth);
    await expect(link.getBoundingClientRect().right).toBeLessThanOrEqual(
      value.getBoundingClientRect().right + 0.5,
    );
    // Focused, its ring is inside its own edge, so the whole ring is inside the value's clip.
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(parseFloat(getComputedStyle(link).outlineOffset)).toBeLessThan(0);
    ringInside(link, value.getBoundingClientRect());
    // The link, not the value, is what is cut, and focus still reveals the whole text.
    const full = await revealed();
    await expect(full).toHaveTextContent(
      "EV-2201 Bank reconciliation for July, signed by the controller",
    );
    await userEvent.tab();
    await waitFor(() =>
      expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull(),
    );
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
 * when the link inside takes keyboard focus. A label is never cut: one longer than its column
 * wraps to the next line, its first line on the value's baseline, so every reader, a touch screen
 * included, reads the same label.
 */
export const CutValueAndLabel: Story = {
  name: "Cut value, whole label",
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
    // All of the label shows, on more than one line, inside its column.
    await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1);
    const line = parseFloat(getComputedStyle(label).lineHeight);
    await expect(label.getBoundingClientRect().height).toBeGreaterThan(line * 1.5);
    const date = canvas.getByText("12 Nov 2026");
    // The value sits on the label's first line.
    await expect(
      Math.abs(date.getBoundingClientRect().top - label.getBoundingClientRect().top),
    ).toBeLessThan(line / 2);
    // Nothing is cut, so nothing opens on hover.
    await userEvent.hover(label);
    await new Promise((resolve) => setTimeout(resolve, 450));
    await expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull();
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
      <KeyValue.Group labelWidth="wide" aria-label="Details">
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
    // `wide` is dimension.part.keyValueLabelWide, 10rem: 160px at the default text size.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const label = rows[0]!.children[0]!.getBoundingClientRect();
    await expect(Math.round(label.width)).toBe(Math.round(10 * rem));
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

/** `columns` keeps label beside value at any width, as a rail of one-line rows needs; `stacked` always puts the label over the value. The label column grows with the reader's text size: 104 at the default 16px is 130 at 20px. */
export const GroupLayouts: Story = {
  tags: ["!manifest"],
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
    // Drawn in rem: without a labelWidth, dimension.part.keyValueLabel (6.5rem, 104px at 16px).
    await expect(columns.style.gridTemplateColumns).toBe(
      "var(--ds-dimension-part-key-value-label) minmax(0, 1fr)",
    );
    const term = () => Math.round(columns.querySelector("dt")!.getBoundingClientRect().width);
    await expect(term()).toBe(104);
    // The label column grows with the reader's text size, as the label and the value do.
    const root = document.documentElement;
    const before = root.style.fontSize;
    try {
      root.style.fontSize = "20px";
      await waitFor(() => expect(term()).toBe(130));
    } finally {
      root.style.fontSize = before;
    }
    await waitFor(() => expect(term()).toBe(104));
    const stacked = canvas.getByTestId("stacked").querySelector<HTMLElement>("div")!;
    await expect(stacked).toHaveAttribute("data-layout", "stacked");
    await expect(getComputedStyle(stacked).flexDirection).toBe("column");
  },
};

/**
 * `labelWidth` is a named step: `narrow` (88px) for short labels in a card, a glance or a chart's
 * details, `default` (104px) for a rail, `wide` (160px) for labels of about twenty characters, each
 * at the default text size and growing with the reader's. `auto` is as wide as the group's longest
 * label, up to `wide`, for a page body: a short set of labels takes a short column, and a label
 * past `wide` wraps.
 */
export const LabelWidths: Story = {
  tags: ["!manifest"],
  name: "Label widths",
  render: () => (
    <Stack space="space.300">
      {(["narrow", "default", "wide"] as const).map((width) => (
        <Specimens key={width} title={width}>
          <Box style={{ width: 360, maxWidth: "100%" }} data-testid={`width-${width}`}>
            <KeyValue.Group labelWidth={width} layout="columns">
              <KeyValue label="Owner">Dana Whitfield</KeyValue>
              <KeyValue label="Next due">12 Nov 2026</KeyValue>
            </KeyValue.Group>
          </Box>
        </Specimens>
      ))}
      <Specimens title="auto: the longest label sets the column">
        <Box style={{ width: 360, maxWidth: "100%" }} data-testid="width-auto">
          <KeyValue.Group labelWidth="auto" layout="columns">
            <KeyValue label="Owner">Dana Whitfield</KeyValue>
            <KeyValue label="Frequency">Quarterly</KeyValue>
            <KeyValue label="Last verified">12 Aug 2026</KeyValue>
          </KeyValue.Group>
        </Box>
      </Specimens>
      <Specimens title="auto: a label past wide wraps">
        <Box style={{ width: 360, maxWidth: "100%" }} data-testid="width-auto-long">
          <KeyValue.Group labelWidth="auto" layout="columns">
            <KeyValue label="Owner">Dana Whitfield</KeyValue>
            <KeyValue label="Authorizing official for the boundary">Marcus Oyelaran</KeyValue>
          </KeyValue.Group>
        </Box>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const terms = (id: string) =>
      Array.from(canvas.getByTestId(id).querySelectorAll("dt")).map((term) =>
        term.getBoundingClientRect(),
      );
    const values = (id: string) =>
      Array.from(canvas.getByTestId(id).querySelectorAll("dd")).map(
        (value) => value.getBoundingClientRect().left,
      );
    // Each step is its token, in rem: 5.5, 6.5 and 10rem.
    for (const [width, size] of [
      ["narrow", 5.5],
      ["default", 6.5],
      ["wide", 10],
    ] as const)
      for (const term of terms(`width-${width}`))
        await expect(Math.round(term.width)).toBe(Math.round(size * rem));
    // auto: one column down the group, as wide as its longest label and narrower than wide.
    const auto = terms("width-auto");
    await expect(new Set(auto.map((term) => Math.round(term.width))).size).toBe(1);
    await expect(auto[0]!.width).toBeLessThan(10 * rem);
    await expect(new Set(values("width-auto").map(Math.round)).size).toBe(1);
    const longest = canvas.getByText("Last verified");
    await expect(longest.scrollWidth).toBeLessThanOrEqual(longest.clientWidth + 1);
    await expect(longest.getBoundingClientRect().height).toBeLessThan(
      parseFloat(getComputedStyle(longest).lineHeight) * 1.5,
    );
    // A label past wide: the column stops at wide and the label wraps, whole.
    const long = terms("width-auto-long");
    await expect(Math.round(long[1]!.width)).toBe(Math.round(10 * rem));
    const wrapped = canvas.getByText("Authorizing official for the boundary");
    await expect(wrapped.getBoundingClientRect().height).toBeGreaterThan(
      parseFloat(getComputedStyle(wrapped).lineHeight) * 1.5,
    );
    await expect(new Set(values("width-auto-long").map(Math.round)).size).toBe(1);
  },
};

/**
 * An `auto` label column in an `auto` group: labels beside their values while the group is at
 * least 20rem (`dimension.container.xs`) wide, and over them below it, as a page body narrows to a
 * panel or a phone.
 */
export const AutoLabelColumn: Story = {
  name: "Auto label column",
  render: () => (
    <Stack space="space.300">
      {[480, 260].map((width) => (
        <Box
          key={width}
          data-testid={`page-${width}`}
          style={{ width, maxWidth: "100%" }}
          className="border-s border-default ps-200"
        >
          <KeyValue.Group labelWidth="auto">
            <KeyValue label="Requirement reference">REQ-001</KeyValue>
            <KeyValue label="Planned completion">12 Nov 2026</KeyValue>
            <KeyValue label="Owner">Dana Whitfield</KeyValue>
          </KeyValue.Group>
        </Box>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const rowsOf = (width: number) =>
      Array.from(
        canvas
          .getByTestId(`page-${width}`)
          .querySelectorAll<HTMLElement>('[data-slot="key-value"]'),
      );
    const beside = (row: HTMLElement) =>
      Math.abs(
        row.children[0]!.getBoundingClientRect().top - row.children[1]!.getBoundingClientRect().top,
      ) < 4;
    for (const width of [480, 260]) {
      const group = canvas
        .getByTestId(`page-${width}`)
        .querySelector<HTMLElement>('[data-slot="key-value-group"]')!;
      await expect(group).toHaveAttribute("data-label-width", "auto");
      const rows = rowsOf(width);
      if (group.getBoundingClientRect().width >= 20 * rem) {
        for (const row of rows) await expect(beside(row)).toBe(true);
        // The values make one column, after the longest label.
        const starts = rows.map((row) => Math.round(row.children[1]!.getBoundingClientRect().left));
        await expect(new Set(starts).size).toBe(1);
      } else
        for (const row of rows) {
          await expect(beside(row)).toBe(false);
          const [term, value] = [row.children[0]!, row.children[1]!];
          await expect(value.getBoundingClientRect().top).toBeGreaterThanOrEqual(
            term.getBoundingClientRect().bottom - 1,
          );
          // Stacked, label and value have the row's width: the label is not cut, and a long
          // value (an id, a URN) truncates in the row rather than running past it.
          for (const part of [term, value])
            await expect(
              Math.abs(part.getBoundingClientRect().width - row.clientWidth),
            ).toBeLessThan(1);
          await expect(term.scrollWidth).toBeLessThanOrEqual(term.clientWidth + 1);
        }
    }
    // The 260px body is under 20rem at any text size the story runs at, so it stacks.
    await expect(beside(rowsOf(260)[0]!)).toBe(false);
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

function NextAction() {
  const [value, setValue] = useState("Confirm the boundary diagram");
  return (
    <Editable.Text
      label="Next action"
      value={value}
      onValueChange={setValue}
      save={() => Promise.resolve()}
    />
  );
}

/**
 * A control at either edge of a value keeps its whole focus ring, and an Editable its tint, ring
 * and field, in every browser: a link draws its ring inside its own edge, the value keeps
 * `space.050` at its end, and a value that is an Editable does not clip, so the Editable reaches
 * past the text column and stays on it, in line with the plain values.
 */
export const RingRoom: Story = {
  name: "Ring room",
  render: () => (
    <Box style={{ maxWidth: 320 }} className="border-s border-default ps-200">
      <KeyValue.Group>
        <KeyValue label="Owner">
          <TextLink href="#owner">Dana Whitfield</TextLink>
        </KeyValue>
        <KeyValue label="Next action">
          <NextAction />
        </KeyValue>
        <KeyValue label="Frequency">Quarterly</KeyValue>
      </KeyValue.Group>
    </Box>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Dana Whitfield" });
    await userEvent.tab();
    await expect(link).toHaveFocus();
    ringInside(link, link.closest("dd")!.getBoundingClientRect());
    // The Editable's value does not clip: nothing between the Editable and the rail cuts its
    // reach, and the Editable's text starts where the plain value's does.
    const row = canvas.getByRole("button", { name: /Next action/ });
    const value = row.closest("dd")!;
    const rail = value.closest("dl")!.parentElement!;
    for (let el = row.parentElement; el && el !== rail; el = el.parentElement)
      await expect(getComputedStyle(el).overflowX).toBe("visible");
    await userEvent.tab();
    await expect(row).toHaveFocus();
    ringInside(row, rail.getBoundingClientRect());
    const plain = canvas.getByText("Quarterly").closest("dd")!;
    await expect(
      Math.abs(row.getBoundingClientRect().left - plain.getBoundingClientRect().left),
    ).toBeLessThan(0.5);
    // The field reaches past the value's text column by its bleed and keeps both sides; at the
    // end it stays inside the value, so the value is not taken for cut text.
    await userEvent.keyboard("{Enter}");
    const field = await canvas.findByRole("textbox", { name: "Next action" });
    await expect(field).toHaveFocus();
    const box = field.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(rail.getBoundingClientRect().left - 0.5);
    await expect(box.right).toBeLessThanOrEqual(value.getBoundingClientRect().right + 0.5);
    await expect(value.scrollWidth).toBeLessThanOrEqual(value.clientWidth);
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByRole("button", { name: /Next action/ })).toHaveFocus();
  },
};
