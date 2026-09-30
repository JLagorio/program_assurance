import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Input } from "../../components";
import { Box, Heading, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Primitives/Inline",
  component: Inline,
  parameters: { layout: "padded" },
  args: { space: "space.100", alignBlock: "center" },
} satisfies Meta<typeof Inline>;
export default meta;
type Story = StoryObj<typeof meta>;

function Chip({ label }: { label: string }) {
  return (
    <Box
      as="span"
      backgroundColor="color.background.neutral"
      paddingBlock="space.025"
      paddingInline="space.100"
      className="rounded-small"
    >
      <Text size="small">{label}</Text>
    </Box>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text size="xsmall" color="color.text.subtlest">
      {children}
    </Text>
  );
}

function Frame({ children, width = 360 }: { children: React.ReactNode; width?: number }) {
  return (
    <Box
      backgroundColor="elevation.surface.sunken"
      padding="space.100"
      className="rounded-medium"
      style={{ width, maxWidth: "100%" }}
    >
      {children}
    </Box>
  );
}

/** The space steps; the block alignments against a taller child; wrapping with its own row space; `spread`; a separator; `grow`; and the inline-level row inside a sentence. */
export const InlineMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Stack space="space.100">
        <Label>space</Label>
        {(["space.050", "space.100", "space.200"] as const).map((s) => (
          <Inline key={s} space={s}>
            <Chip label="Satisfied" />
            <Chip label="Partially satisfied" />
            <Chip label="Not assessed" />
          </Inline>
        ))}
      </Stack>
      <Stack space="space.100">
        <Label>alignBlock: start · center · baseline · end, beside a title</Label>
        <Inline space="space.200" alignBlock="start" shouldWrap>
          {(["start", "center", "baseline", "end"] as const).map((a) => (
            <Stack key={a} space="space.050">
              <Label>{a}</Label>
              <Frame width={220}>
                <Inline space="space.100" alignBlock={a}>
                  <Heading size="small" as="div">
                    AC-2
                  </Heading>
                  <Chip label="Satisfied" />
                  <Text size="xsmall" color="color.text.subtlest">
                    12 May
                  </Text>
                </Inline>
              </Frame>
            </Stack>
          ))}
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>shouldWrap with rowSpace · spread · grow fill</Label>
        <Inline space="space.200" alignBlock="start" shouldWrap>
          <Frame width={300}>
            <Inline space="space.100" rowSpace="space.050" shouldWrap>
              {Array.from({ length: 8 }, (_, i) => (
                <Chip key={i} label={`Tag ${i + 1}`} />
              ))}
            </Inline>
          </Frame>
          <Frame width={240}>
            <Inline spread="space-between" alignBlock="center">
              <Text weight="medium">Findings</Text>
              <Chip label="24" />
            </Inline>
          </Frame>
          <Frame width={240}>
            <Inline space="space.100" alignBlock="center">
              <Inline grow="fill">
                <Chip label="fills" />
              </Inline>
              <Chip label="hugs" />
            </Inline>
          </Frame>
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>separator: decorative, hidden from a screen reader</Label>
        <Inline space="space.100" separator="·" alignBlock="center">
          <Text size="small" color="color.text.subtlest">
            SC-7(5)
          </Text>
          <Text size="small" color="color.text.subtlest">
            Boundary protection
          </Text>
          <Text size="small" color="color.text.subtlest">
            Assessed 12 days ago
          </Text>
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>display inline-flex, as a span, inside a sentence</Label>
        <Text as="p">
          Assessed by{" "}
          <Inline as="span" display="inline-flex" space="space.050" alignBlock="center">
            <Chip label="Whitcombe LLP" />
            <Text size="small" color="color.text.subtlest">
              external
            </Text>
          </Inline>{" "}
          on 12 August, with two findings carried.
        </Text>
      </Stack>
    </Stack>
  ),
};

export const Space: Story = {
  render: () => (
    <Stack space="space.300">
      {(["space.050", "space.100", "space.200"] as const).map((s) => (
        <Stack key={s} space="space.050">
          <Label>{s}</Label>
          <Inline space={s}>
            <Chip label="Satisfied" />
            <Chip label="Partially satisfied" />
            <Chip label="Not assessed" />
          </Inline>
        </Stack>
      ))}
    </Stack>
  ),
};

/** As a span with `display="inline-flex"` the row stays inline-level, so it sits inside a sentence. */
export const InText: Story = {
  render: () => (
    <Text as="p">
      Assessed by{" "}
      <Inline as="span" display="inline-flex" space="space.050" alignBlock="center">
        <Chip label="Whitcombe LLP" />
        <Text size="small" color="color.text.subtlest">
          external
        </Text>
      </Inline>{" "}
      on 12 August, with two findings carried.
    </Text>
  ),
};

function DraftNotes() {
  const [notes, setNotes] = useState(["Summary", "Detail"]);
  return (
    <Stack space="space.100">
      <Inline separator="·" space="space.100" alignBlock="center" shouldWrap>
        {notes.map((note) => (
          <label key={note}>
            <Text as="div" size="small">
              {note}
            </Text>
            <Input aria-label={`${note} note`} defaultValue={note} />
          </label>
        ))}
      </Inline>
      <Inline space="space.100">
        <Button onClick={() => setNotes((current) => [...current].reverse())}>Reverse notes</Button>
        <Button onClick={() => setNotes((current) => current.slice(1))}>Remove first note</Button>
      </Inline>
    </Stack>
  );
}

export const SeparatorAndSpread: Story = {
  render: () => (
    <Stack space="space.300">
      <DraftNotes />
      <Inline space="space.100" separator="·" alignBlock="center">
        <Text size="small" color="color.text.subtlest">
          SC-7(5)
        </Text>
        <Text size="small" color="color.text.subtlest">
          Boundary protection
        </Text>
        <Text size="small" color="color.text.subtlest">
          Assessed 12 days ago
        </Text>
      </Inline>
      <Box
        backgroundColor="elevation.surface.sunken"
        padding="space.100"
        className="rounded-medium"
      >
        <Inline spread="space-between" alignBlock="center">
          <Text weight="medium">Findings</Text>
          <Chip label="24" />
        </Inline>
      </Box>
      <Box style={{ maxWidth: 360 }}>
        <Inline space="space.100" rowSpace="space.100" shouldWrap>
          {Array.from({ length: 9 }, (_, i) => (
            <Chip key={i} label={`Tag ${i + 1}`} />
          ))}
        </Inline>
      </Box>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = canvas.getByRole("textbox", { name: "Summary note" });
    await userEvent.clear(summary);
    await userEvent.type(summary, "Retained draft");
    await userEvent.click(canvas.getByRole("button", { name: "Reverse notes" }));
    await expect(canvas.getByRole("textbox", { name: "Summary note" })).toBe(summary);
    await expect(summary).toHaveValue("Retained draft");
    await userEvent.click(canvas.getByRole("button", { name: "Remove first note" }));
    await expect(canvas.queryByRole("textbox", { name: "Detail note" })).toBeNull();
    await expect(canvas.getByRole("textbox", { name: "Summary note" })).toBe(summary);
    await expect(summary).toHaveValue("Retained draft");
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.100" separator="·" alignBlock="center">
            <Text size="small" color="color.text.subtlest">
              SC-7(5)
            </Text>
            <Text size="small" color="color.text.subtlest">
              Assessed 12 days ago
            </Text>
          </Inline>
        }
        doText="The dot is `separator`: drawn between the children, hidden from a screen reader."
        dont={
          <Inline space="space.100" alignBlock="center">
            <Text size="small" color="color.text.subtlest">
              SC-7(5)
            </Text>
            <Text size="small" color="color.text.subtlest">
              ·
            </Text>
            <Text size="small" color="color.text.subtlest">
              Assessed 12 days ago
            </Text>
          </Inline>
        }
        dontText="The dot as a child. A screen reader reads it, and it takes a gap on each side that the last item's absence does not close."
      />
      <Pair
        do={
          <Frame width={260}>
            <Inline space="space.100" rowSpace="space.050" shouldWrap>
              {Array.from({ length: 6 }, (_, i) => (
                <Chip key={i} label={`Tag ${i + 1}`} />
              ))}
            </Inline>
          </Frame>
        }
        doText="A row of chips wraps: `shouldWrap`, with `rowSpace` tighter than `space`."
        dont={
          <Frame width={260}>
            <Inline space="space.100">
              {Array.from({ length: 6 }, (_, i) => (
                <Chip key={i} label={`Tag ${i + 1}`} />
              ))}
            </Inline>
          </Frame>
        }
        dontText="A row that does not wrap. The sixth chip is past the edge, and the card scrolls sideways or clips it."
      />
      <Pair
        do={
          <Inline as="ul" space="space.100">
            <Inline as="li">
              <Chip label="Atlas" />
            </Inline>
            <Inline as="li">
              <Chip label="Vault" />
            </Inline>
          </Inline>
        }
        doText={
          'A list of chips is a list: `as="ul"` with `li` children, and the space between them.'
        }
        dont={
          <Inline as="ul" space="space.100" separator="·">
            <Inline as="li">
              <Chip label="Atlas" />
            </Inline>
            <Inline as="li">
              <Chip label="Vault" />
            </Inline>
          </Inline>
        }
        dontText="A separator on a list element. The dot is a span between list items, which a list may not contain; the list is no longer a list."
      />
    </Stack>
  ),
};

/** A row of chips wraps (`shouldWrap`), so it fits any width it is given. */
export const Playground: Story = {
  args: { shouldWrap: true },
  render: (args) => (
    <Frame>
      <Inline {...args}>
        <Chip label="Satisfied" />
        <Chip label="Partially satisfied" />
        <Chip label="Not assessed" />
      </Inline>
    </Frame>
  ),
};

export const ListSemantics: Story = {
  render: () => (
    <Stack space="space.200">
      <Inline as="ul" separator="/" aria-label="Related records" space="space.100">
        <li>First record</li>
        <li>Second record</li>
      </Inline>
      <Inline as="dl" separator="·" space="space.100" data-testid="pairs">
        <dt>Owner</dt>
        <dd>Priya Raman</dd>
      </Inline>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list", { name: "Related records" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    await expect(Array.from(list.children).every((child) => child.tagName === "LI")).toBe(true);
    await expect(within(list).queryByText("/")).toBeNull();
    const pairs = canvas.getByTestId("pairs");
    await expect(Array.from(pairs.children).map((child) => child.tagName)).toEqual(["DT", "DD"]);
  },
};

/**
 * `grow="fill"` takes the room between a fixed start and end and may shrink below its content,
 * so a one-line Text inside it cuts instead of pushing the row past its frame; `shrink="none"`
 * keeps the id beside it whole.
 */
export const GrowFillTruncates: Story = {
  render: () => (
    <Frame width={240}>
      <Inline space="space.100" alignBlock="center" data-testid="row">
        <Box as="span" shrink="none" data-testid="id">
          <Text size="small" color="color.text.subtlest">
            SC-7
          </Text>
        </Box>
        <Inline grow="fill" data-testid="fill">
          <Text maxLines={1}>Boundary protection with deny by default and allow by exception</Text>
        </Inline>
        <Chip label="Open" />
      </Inline>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const row = canvas.getByTestId("row").getBoundingClientRect();
    const fill = canvas.getByTestId("fill");
    await expect(fill.getBoundingClientRect().right).toBeLessThanOrEqual(row.right + 0.5);
    const text = fill.firstElementChild as HTMLElement;
    await expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
    const id = canvas.getByTestId("id");
    const line = parseFloat(getComputedStyle(id.firstElementChild as HTMLElement).lineHeight);
    await expect(id.getBoundingClientRect().height).toBeLessThan(line * 1.5);
  },
};

/**
 * A wrapping meta line with a separator: each fact keeps the dot after it on its own line, so no
 * line starts with a dot, and the dot that would end a line is hidden.
 */
export const WrappedSeparator: Story = {
  render: () => (
    <Frame width={260}>
      <Inline space="space.100" rowSpace="space.050" separator="·" shouldWrap data-testid="meta">
        {[
          "Due 12 Oct 2026",
          "Owner Priya Raman",
          "3 findings",
          "Assessed 12 days ago",
          "Moderate",
        ].map((fact) => (
          <Text key={fact} size="small" color="color.text.subtle">
            {fact}
          </Text>
        ))}
      </Inline>
    </Frame>
  ),
  play: async ({ canvas }) => {
    const meta = canvas.getByTestId("meta");
    const pairs = Array.from(
      meta.querySelectorAll<HTMLElement>(':scope > [data-slot="inline-item"]'),
    );
    await expect(pairs).toHaveLength(5);
    const tops = new Set(pairs.map((pair) => Math.round(pair.getBoundingClientRect().top)));
    await expect(tops.size).toBeGreaterThan(1);
    await waitFor(() => expect(meta.querySelectorAll("[data-line-end]").length).toBeGreaterThan(0));
    // Every separator is hidden exactly when it ends a line; the last child has none.
    const misplaced = () =>
      pairs.flatMap((pair, i) => {
        const separator = pair.querySelector<HTMLElement>('[data-slot="inline-separator"]');
        const next = pairs[i + 1];
        if (!next) return separator ? [`${i}: a separator after the last child`] : [];
        if (!separator) return [`${i}: no separator`];
        const endsLine =
          next.getBoundingClientRect().top >= pair.getBoundingClientRect().bottom - 0.5;
        const shown = getComputedStyle(separator).visibility === "visible";
        return shown === endsLine
          ? [`${i}: ${shown ? "shown at a line end" : "hidden mid-line"}`]
          : [];
      });
    await expect(misplaced()).toEqual([]);
    for (const separator of meta.querySelectorAll('[data-slot="inline-separator"]'))
      await expect(separator).toHaveAttribute("aria-hidden", "true");
    // A child that changes its own size, with no render of the row and no change to the row's
    // size (a name that loads, a date that updates itself, the face swapping in), moves the line
    // breaks, and the marks follow. Fixed widths in the 244px line make the breaks exact, with
    // 20px or more to spare: A B / C / D E, then A grows to A / B C / D E on the same three lines.
    const children = pairs.map((pair) => pair.firstElementChild as HTMLElement);
    const size = (widths: number[]) =>
      children.forEach((child, i) => {
        child.style.flex = "none";
        child.style.width = `${widths[i]}px`;
      });
    const lines = () => {
      const tops = pairs.map((pair) => Math.round(pair.getBoundingClientRect().top));
      const order = [...new Set(tops)];
      return tops.map((top) => order.indexOf(top));
    };
    size([60, 60, 120, 110, 60]);
    await waitFor(() => expect(lines()).toEqual([0, 0, 1, 2, 2]));
    await waitFor(() => expect(misplaced()).toEqual([]));
    const height = meta.getBoundingClientRect().height;
    size([200, 60, 120, 110, 60]);
    await expect(lines()).toEqual([0, 1, 1, 2, 2]);
    await expect(meta.getBoundingClientRect().height).toBe(height);
    await waitFor(() => expect(misplaced()).toEqual([]));
    for (const child of children) child.removeAttribute("style");
    await waitFor(() => expect(misplaced()).toEqual([]));
  },
};
