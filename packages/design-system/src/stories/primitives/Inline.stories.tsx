import { expect, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

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
      style={{ width }}
    >
      {children}
    </Box>
  );
}

/** The space steps; the block alignments against a taller child; wrapping with its own row space; `spread`; a separator; `grow`; and the inline-level row inside a sentence. */
export const InlineMatrix: Story = {
  tags: ["contract"],
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

export const SeparatorAndSpread: Story = {
  render: () => (
    <Stack space="space.300">
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

export const Playground: Story = {
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

export const ListSemanticsContract: Story = {
  tags: ["contract"],
  render: () => (
    <Inline as="ul" separator="/" aria-label="Related records" space="space.100">
      <li>First record</li>
      <li>Second record</li>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list", { name: "Related records" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    await expect(Array.from(list.children).every((child) => child.tagName === "LI")).toBe(true);
    await expect(within(list).queryByText("/")).toBeNull();
  },
};
