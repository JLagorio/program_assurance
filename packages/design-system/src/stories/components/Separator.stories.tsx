import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, Link2 } from "lucide-react";
import { createRef } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button, IconButton, Item, Separator, Toggle } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: { layout: "padded" },
  args: {},
} satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Horizontal between blocks, vertical between groups in a toolbar, and decorative under a heading. */
export const SeparatorMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Horizontal, between two blocks in a Stack">
        <Box style={{ width: 360 }}>
          <Stack space="space.200">
            <Text>What the control requires.</Text>
            <Separator />
            <Text>How the system meets it.</Text>
          </Stack>
        </Box>
      </Specimens>
      <Specimens title="Vertical, between groups in a toolbar row">
        <Inline space="space.050" alignBlock="center">
          <Toggle aria-label="Bold" icon={<Bold />} />
          <Toggle aria-label="Italic" icon={<Italic />} />
          <Separator orientation="vertical" />
          <IconButton variant="subtle" label="Link" icon={<Link2 />} />
          <Separator orientation="vertical" />
          <Button size="small" variant="subtle">
            Clear
          </Button>
        </Inline>
      </Specimens>
      <Specimens title="Decorative, a rule under a heading: hidden from a screen reader">
        <Box style={{ width: 360 }}>
          <Stack space="space.100">
            <Text weight="semibold">Evidence</Text>
            <Separator isDecorative />
            <Text color="color.text.subtle">Three items, all current.</Text>
          </Stack>
        </Box>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separators = canvas.getAllByRole("separator");
    await expect(separators).toHaveLength(3);
    for (const [index, separator] of separators.entries()) {
      const orientation = index === 0 ? "horizontal" : "vertical";
      await expect(separator).toHaveAttribute("data-slot", "separator");
      await expect(separator).toHaveAttribute("data-orientation", orientation);
      await expect(separator).toHaveAttribute("aria-orientation", orientation);
      await expect(separator.tabIndex).toBe(-1);
      const bounds = separator.getBoundingClientRect();
      await expect(orientation === "horizontal" ? bounds.height : bounds.width).toBe(1);
      await expect(orientation === "horizontal" ? bounds.width : bounds.height).toBeGreaterThan(1);
    }
    const decorative = canvasElement.querySelector('[data-slot="separator"][aria-hidden="true"]');
    await expect(decorative).toHaveAttribute("role", "none");
    await expect(decorative).toHaveAttribute("data-orientation", "horizontal");
    await expect(decorative).not.toHaveAttribute("aria-orientation");
    await expect(decorative).not.toHaveAttribute("tabindex");

    canvas.getByRole("button", { name: "Bold" }).focus();
    for (const name of ["Italic", "Link", "Clear"]) {
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name })).toHaveFocus();
    }
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole("button", { name: "Link" })).toHaveFocus();
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Item.Group>
            <Item title="Bank reconciliation, July" meta="PDF" trailing="12 Aug" />
            <Item title="Approval matrix" meta="XLSX" trailing="9 Aug" />
            <Item title="Access review" meta="CSV" trailing="2 Aug" />
          </Item.Group>
        }
        doText="Rows draw their own hairlines: an Item.Group, a Table."
        dont={
          <Stack space="space.100">
            <Text>Bank reconciliation, July</Text>
            <Separator />
            <Text>Approval matrix</Text>
            <Separator />
            <Text>Access review</Text>
          </Stack>
        }
        dontText="A separator between every row of a hand-made list. The list should be a list."
      />
      <Pair
        do={
          <Stack space="space.200">
            <Text>Above</Text>
            <Separator />
            <Text>Below</Text>
          </Stack>
        }
        doText="The space around the rule is the parent's gap."
        dont={
          <Stack space="space.200">
            <Separator />
            <Text>Above</Text>
            <Separator />
            <Text>Below</Text>
            <Separator />
          </Stack>
        }
        dontText="A rule at the top and the bottom too. A separator sits between two things; with nothing on one side it is a border, and the container draws that."
      />
      <Pair
        do={
          <Inline space="space.100" alignBlock="center">
            <Text>Left</Text>
            <Separator orientation="vertical" />
            <Text>Right</Text>
          </Inline>
        }
        doText="A vertical rule inside a flex row, stretching to the row."
        dont={
          <Stack space="space.100">
            <Text>Left</Text>
            <Separator orientation="vertical" />
            <Text>Right</Text>
          </Stack>
        }
        dontText="A vertical rule in a column. It has nothing to stretch to and draws nothing."
      />
    </Stack>
  ),
};

const nativeRef = createRef<HTMLDivElement>();
const compositionRefs = {
  separator: createRef<HTMLDivElement>(),
  element: createRef<HTMLHRElement>(),
};
const compositionEvents = {
  separator: fn(),
  element: fn(),
};

/** Native props target the divider; render composes the same contract onto a horizontal rule. */
export const NativeComposition: Story = {
  render: () => (
    <Stack space="space.300">
      <Box style={{ width: 360 }}>
        <Stack space="space.150">
          <Text weight="semibold">Evidence summary</Text>
          <Separator
            ref={nativeRef}
            id="evidence-divider"
            title="Evidence summary and attachments"
            lang="en"
            dir="ltr"
            data-example="native-divider"
            className="w-800 self-stretch"
            style={{ maxWidth: 120 }}
          />
          <Text>Three attached records</Text>
        </Stack>
      </Box>
      <Inline space="space.150" alignBlock="center">
        <Text>Draft</Text>
        <Separator
          ref={compositionRefs.separator}
          orientation="vertical"
          isDecorative
          role="separator"
          aria-hidden={false}
          aria-orientation="vertical"
          aria-label="Workflow stages"
          data-example="composed-divider"
          className={({ orientation }) =>
            orientation === "vertical" ? "self-stretch" : "max-w-layout-measure"
          }
          style={({ orientation }) => ({
            minHeight: orientation === "vertical" ? 32 : 1,
            marginInlineStart: 4,
          })}
          onPointerEnter={compositionEvents.separator}
          render={
            <hr
              ref={compositionRefs.element}
              title="Between workflow stages"
              className="align-middle"
              style={{ marginInlineEnd: 8 }}
              onPointerEnter={compositionEvents.element}
            />
          }
        />
        <Text>Reviewed</Text>
      </Inline>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const native = canvas.getByTitle("Evidence summary and attachments");
    await expect(nativeRef.current).toBe(native);
    await expect(native.tagName).toBe("DIV");
    await expect(native).toHaveAttribute("id", "evidence-divider");
    await expect(native).toHaveAttribute("lang", "en");
    await expect(native).toHaveAttribute("dir", "ltr");
    await expect(native).toHaveAttribute("data-example", "native-divider");
    await expect(native).toHaveClass("w-800", "self-stretch");
    await expect(native).toHaveStyle({ maxWidth: "120px" });
    await expect(native.getBoundingClientRect().width).toBe(64);

    const composed = canvas.getByRole("separator", { name: "Workflow stages" });
    await expect(compositionRefs.separator.current).toBe(composed);
    await expect(compositionRefs.element.current).toBe(composed);
    await expect(composed.tagName).toBe("HR");
    await expect(composed).toHaveAttribute("data-slot", "separator");
    await expect(composed).toHaveAttribute("data-orientation", "vertical");
    await expect(composed).toHaveAttribute("aria-hidden", "false");
    await expect(composed).toHaveAttribute("aria-orientation", "vertical");
    await expect(composed).toHaveAttribute("data-example", "composed-divider");
    await expect(composed).toHaveAttribute("title", "Between workflow stages");
    await expect(composed).toHaveClass("self-stretch", "align-middle");
    await expect(composed).toHaveStyle({
      minHeight: "32px",
      marginInlineStart: "4px",
      marginInlineEnd: "8px",
      borderTopWidth: "0px",
    });
    await expect(composed.getBoundingClientRect().width).toBe(1);
    await expect(composed.tabIndex).toBe(-1);
    compositionEvents.separator.mockClear();
    compositionEvents.element.mockClear();
    await userEvent.hover(composed);
    await expect(compositionEvents.separator).toHaveBeenCalledTimes(1);
    await expect(compositionEvents.element).toHaveBeenCalledTimes(1);
  },
};

export const Playground: Story = {};
