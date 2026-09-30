import { expect, userEvent, waitFor, within } from "storybook/test";
import { Input, TextLink } from "../../components";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Grid, Heading, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Primitives/Text",
  component: Text,
  parameters: { layout: "padded" },
  args: {
    children: "Deny network communications traffic by default and allow by exception.",
    size: "medium",
  },
} satisfies Meta<typeof Text>;
export default meta;
type Story = StoryObj<typeof meta>;

const sample = "Deny network communications traffic by default and allow by exception.";
const long = `${sample} ${sample} ${sample}`;

function Label({ children }: { children: string }) {
  return (
    <Text size="xsmall" color="color.text.subtlest">
      {children}
    </Text>
  );
}

const sizes = ["large", "medium", "small", "xsmall"] as const;
const weights = ["regular", "medium", "semibold"] as const;
const colors = [
  "color.text",
  "color.text.subtle",
  "color.text.subtlest",
  "color.text.disabled",
  "color.text.brand",
  "color.text.selected",
  "color.text.danger",
  "color.text.warning",
  "color.text.success",
  "color.text.information",
] as const;

/** The four sizes by the three weights; the text colours; alignment; one, two and three lines clamped, each showing the whole on hover; a paragraph at the reading measure; inverse on a bold fill without a colour. */
export const TextMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Stack space="space.100">
        <Label>size by weight</Label>
        <Grid
          templateColumns="72px repeat(3, minmax(0, 1fr))"
          gap="space.100"
          alignItems="baseline"
        >
          <span />
          {weights.map((w) => (
            <Label key={w}>{w}</Label>
          ))}
          {sizes.map((s) => (
            <Stack key={s} space="space.0" className="contents">
              <Label>{s}</Label>
              {weights.map((w) => (
                <Text key={w} size={s} weight={w}>
                  Boundary protection
                </Text>
              ))}
            </Stack>
          ))}
        </Grid>
      </Stack>
      <Stack space="space.100">
        <Label>color; disabled is left out here, it comes from a disabled control</Label>
        <Inline space="space.200" shouldWrap>
          {colors
            .filter((c) => c !== "color.text.disabled")
            .map((c) => (
              <Text key={c} color={c} size="small">
                {c.replace("color.text.", "") === c ? "text" : c.replace("color.text.", "")}
              </Text>
            ))}
        </Inline>
        <Inline space="space.100" shouldWrap>
          <Box
            backgroundColor="color.background.neutral.bold"
            paddingBlock="space.075"
            paddingInline="space.150"
            className="rounded-medium"
          >
            <Text size="small">inverse, from the bold fill</Text>
          </Box>
          <Box
            backgroundColor="color.background.warning.bold"
            paddingBlock="space.075"
            paddingInline="space.150"
            className="rounded-medium"
          >
            <Text size="small">warning.inverse, from the warning bold</Text>
          </Box>
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>align, in a 240px block</Label>
        <Inline space="space.200" alignBlock="start" shouldWrap>
          {(["start", "center", "end"] as const).map((a) => (
            <Box
              key={a}
              backgroundColor="elevation.surface.sunken"
              padding="space.100"
              className="rounded-medium"
              style={{ width: 240 }}
            >
              <Text as="p" size="small" align={a}>
                {a}: two findings carried
              </Text>
            </Box>
          ))}
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>maxLines 1 · 2 · 3, in a 240px block</Label>
        <Inline space="space.200" alignBlock="start" shouldWrap>
          {([1, 2, 3] as const).map((m) => (
            <Box
              key={m}
              backgroundColor="elevation.surface.sunken"
              padding="space.100"
              className="rounded-medium"
              style={{ width: 240 }}
            >
              <Text as="p" size="small" maxLines={m}>
                {long}
              </Text>
            </Box>
          ))}
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>as="p" at the reading measure, body large</Label>
        <Text as="p" size="large" className="max-w-layout-measure">
          {long}
        </Text>
      </Stack>
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack space="space.200">
      {sizes.map((s) => (
        <Inline key={s} space="space.300" alignBlock="baseline">
          <Box style={{ width: 72 }}>
            <Text size="xsmall" color="color.text.subtlest">
              {s}
            </Text>
          </Box>
          <Text size={s}>{sample}</Text>
        </Inline>
      ))}
    </Stack>
  ),
};

export const WeightsAndColors: Story = {
  render: () => (
    <Stack space="space.300">
      <Inline space="space.300">
        {weights.map((w) => (
          <Text key={w} weight={w}>
            {w}
          </Text>
        ))}
      </Inline>
      <Inline space="space.300" shouldWrap>
        {colors.filter((c) => c !== "color.text.disabled").map((c) => (
          <Text key={c} color={c} size="small">
            {c.replace("color.text.", "") === c ? "default" : c.replace("color.text.", "")}
          </Text>
        ))}
      </Inline>
      <Box
        backgroundColor="color.background.neutral.bold"
        padding="space.150"
        className="rounded-medium"
      >
        <Text>inverse, on neutral.bold, from the fill</Text>
      </Box>
      <Box style={{ width: 240 }}>
        <Text maxLines={2} color="color.text.subtle" size="small">
          {long}
        </Text>
      </Box>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Stack space="space.050">
            <Text as="p">{sample}</Text>
            <Text as="p" size="small" color="color.text.danger">
              Two findings are past their due date.
            </Text>
          </Stack>
        }
        doText="Running text is neutral. Colour says something: the danger line is a fact with a tone."
        dont={
          <Stack space="space.050">
            <Text as="p" color="color.text.brand">
              {sample}
            </Text>
            <Text as="p" size="small" color="color.text.success">
              Two findings are past their due date.
            </Text>
          </Stack>
        }
        dontText="Colour as decoration. Brand on a sentence reads as a link; success under an overdue count says the opposite of the words."
      />
      <Pair
        do={
          <Box style={{ maxWidth: 320 }}>
            <Text as="p">{sample}</Text>
          </Box>
        }
        doText="Body copy is `medium`, the UI size, or `large` for a statement read at length."
        dont={
          <Box style={{ maxWidth: 320 }}>
            <Text as="p" size="xsmall">
              {sample}
            </Text>
          </Box>
        }
        dontText="A paragraph in `xsmall`. Eleven pixels is for a count or a date beside something; a sentence in it is not read."
      />
      <Pair
        do={
          <Stack space="space.050">
            <Heading size="xsmall">Assessment results</Heading>
            <Text as="p" size="small" color="color.text.subtle">
              Two findings carried from the last cycle.
            </Text>
          </Stack>
        }
        doText="A title is a Heading: the level is in the outline and the size is the heading ramp."
        dont={
          <Stack space="space.050">
            <Text as="p" size="large" weight="semibold">
              Assessment results
            </Text>
            <Text as="p" size="small" color="color.text.subtle">
              Two findings carried from the last cycle.
            </Text>
          </Stack>
        }
        dontText="A Text made to look like a title. It is not in the outline, and its size is a body size with a weight, not the heading ramp."
      />
    </Stack>
  ),
};

export const Playground: Story = {};

export const LabelAssociation: Story = {
  render: () => (
    <Stack space="space.100">
      <Text as="label" htmlFor="text-label-name">
        Display name
      </Text>
      <Input id="text-label-name" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Display name" });
    await userEvent.click(canvas.getByText("Display name"));
    await expect(input).toHaveFocus();
  },
};

/** The tooltip that shows a clamped Text in full, once it has opened. */
const revealed = () =>
  waitFor(() => {
    const popup = document.querySelector<HTMLElement>('[data-slot="truncate-full-text"]');
    expect(popup).not.toBeNull();
    return popup!;
  });

/**
 * A clamped Text shows the whole of itself while it is cut: on hover, and when the link it sits
 * in takes keyboard focus. A Text that fits shows nothing, and a `title` of your own replaces
 * the tooltip.
 */
export const MaxLinesReveal: Story = {
  render: () => (
    <Stack space="space.200">
      <Box style={{ maxWidth: 240 }}>
        <Text as="p" size="small" maxLines={2} data-testid="clamped">
          {long}
        </Text>
      </Box>
      <Box style={{ maxWidth: 240 }}>
        <TextLink href="#sc-7">
          <Text maxLines={1}>{sample}</Text>
        </TextLink>
      </Box>
      <Box style={{ maxWidth: 240 }}>
        <Text as="p" size="small" maxLines={1} title="Deny by default" data-testid="titled">
          {sample}
        </Text>
      </Box>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const clamped = canvas.getByTestId("clamped");
    await expect(clamped.tagName).toBe("P");
    await expect(clamped).toHaveClass("line-clamp-2", "font-body-small");
    await expect(clamped.scrollHeight).toBeGreaterThan(clamped.clientHeight);
    await userEvent.hover(clamped);
    await expect(await revealed()).toHaveTextContent(long);
    await userEvent.unhover(clamped);
    await waitFor(() =>
      expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull(),
    );
    await userEvent.tab();
    await expect(canvas.getByRole("link")).toHaveFocus();
    await expect(await revealed()).toHaveTextContent(sample);
    await userEvent.tab();
    const titled = canvas.getByTestId("titled");
    await expect(titled).toHaveAttribute("title", "Deny by default");
    await userEvent.hover(titled);
    await new Promise((resolve) => setTimeout(resolve, 450));
    await expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull();
  },
};

const comment = `Reviewed with the system owner on 12 August.
Two service accounts are exempt:
  svc-backup
  svc-monitor`;

/** `preserveLineBreaks` keeps the breaks and the indentation typed into authored text: a comment, a note, a statement. */
export const PreserveLineBreaks: Story = {
  render: () => (
    <Stack space="space.200">
      <Box style={{ maxWidth: 360 }}>
        <Text as="p" preserveLineBreaks data-testid="kept">
          {comment}
        </Text>
      </Box>
      <Box style={{ maxWidth: 360 }}>
        <Text as="p" data-testid="run">
          {comment}
        </Text>
      </Box>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const kept = canvas.getByTestId("kept");
    await expect(getComputedStyle(kept).whiteSpace).toBe("pre-wrap");
    const lineHeight = parseFloat(getComputedStyle(kept).lineHeight);
    await expect(kept.getBoundingClientRect().height).toBeGreaterThanOrEqual(lineHeight * 4 - 1);
    await expect(canvas.getByTestId("run").getBoundingClientRect().height).toBeLessThan(
      kept.getBoundingClientRect().height,
    );
  },
};

/**
 * A one-line clamp on the default `span`, inside a narrow block and inside a row: the span becomes
 * a block of the frame's width and cuts with an ellipsis, so the page never scrolls sideways.
 */
export const OneLineOnASpan: Story = {
  render: () => (
    <Stack space="space.200">
      <Box style={{ width: 200, maxWidth: "100%" }} data-testid="frame">
        <Text maxLines={1} data-testid="cut">
          {sample}
        </Text>
      </Box>
      <Box style={{ width: 200, maxWidth: "100%" }}>
        <Inline space="space.100" alignBlock="baseline">
          <Text size="small" color="color.text.subtlest">
            SC-7
          </Text>
          <Inline grow="fill">
            <Text maxLines={1} data-testid="cut-in-row">
              {sample}
            </Text>
          </Inline>
        </Inline>
      </Box>
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    const frame = canvas.getByTestId("frame");
    for (const id of ["cut", "cut-in-row"]) {
      const cut = canvas.getByTestId(id);
      await expect(cut.tagName).toBe("SPAN");
      await expect(getComputedStyle(cut).textOverflow).toBe("ellipsis");
      await expect(cut.scrollWidth).toBeGreaterThan(cut.clientWidth);
      await expect(cut.getBoundingClientRect().width).toBeLessThanOrEqual(
        frame.getBoundingClientRect().width + 0.5,
      );
    }
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/**
 * `numeric` sets tabular numerals: every digit one width, so counts in a column line up. A
 * table's cells have them already, even under a type utility on the table itself.
 */
export const Numeric: Story = {
  render: () => (
    <Stack space="space.200">
      <Stack space="space.050" alignInline="end" className="w-fit">
        <Text size="small" numeric data-testid="numeric">
          111
        </Text>
        <Text size="small" numeric>
          102
        </Text>
        <Text size="small" data-testid="proportional">
          111
        </Text>
      </Stack>
      <table className="w-fit font-body">
        <caption className="sr-only">Open items</caption>
        <tbody>
          <tr>
            <th scope="row" className="pe-200 text-start font-regular">
              Access control
            </th>
            <td className="text-end" data-testid="cell">
              111
            </td>
          </tr>
          <tr>
            <th scope="row" className="pe-200 text-start font-regular">
              Audit
            </th>
            <td className="text-end">102</td>
          </tr>
        </tbody>
      </table>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByTestId("numeric")).fontVariantNumeric).toContain(
      "tabular-nums",
    );
    await expect(
      getComputedStyle(canvas.getByTestId("proportional")).fontVariantNumeric,
    ).not.toContain("tabular-nums");
    await expect(getComputedStyle(canvas.getByTestId("cell")).fontVariantNumeric).toContain(
      "tabular-nums",
    );
  },
};

const hash = "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";

/**
 * A word longer than its line, an id, a hash or a URL, breaks where it would overflow, so it
 * never widens its block or the page; the words around it break as usual.
 */
export const UnbrokenWord: Story = {
  render: () => (
    <Box style={{ width: 240, maxWidth: "100%" }} data-testid="frame">
      <Text as="p" size="small" data-testid="long">
        Evidence digest {hash} recorded for the boundary protection test.
      </Text>
    </Box>
  ),
  play: async ({ canvas, canvasElement }) => {
    const long = canvas.getByTestId("long");
    await expect(getComputedStyle(long).overflowWrap).toBe("break-word");
    await expect(long.scrollWidth).toBeLessThanOrEqual(long.clientWidth);
    await expect(long.getBoundingClientRect().width).toBeLessThanOrEqual(
      canvas.getByTestId("frame").getBoundingClientRect().width + 0.5,
    );
    const root = canvasElement.ownerDocument.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};
