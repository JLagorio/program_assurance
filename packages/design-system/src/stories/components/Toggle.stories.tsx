import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Pin } from "lucide-react";
import { createRef, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Toggle } from "../../components";
import { Stack, Text } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix, Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  parameters: { layout: "padded" },
  args: { "aria-label": "Bold", children: <Bold aria-hidden /> },
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;

const pinRef = createRef<HTMLButtonElement>();
const renderedRef = createRef<HTMLButtonElement>();

function PinnedRecord() {
  const [pinned, setPinned] = useState(false);
  return (
    <Specimens title="Controlled state and a required pin">
      <Toggle
        ref={pinRef}
        id="record-pin"
        pressed={pinned}
        onPressedChange={setPinned}
        className={(state) => (state.pressed ? "underline" : "no-underline")}
        style={(state) => ({ minWidth: state.pressed ? 140 : 120 })}
        render={<button ref={renderedRef} title="Pin this record" />}
      >
        <Pin aria-hidden /> Pin record
      </Toggle>
      <Text>{pinned ? "This record appears first." : "This record follows the usual order."}</Text>
      <Toggle
        defaultPressed
        aria-describedby="required-pin-reason"
        onPressedChange={(pressed, details) => {
          if (!pressed) details.cancel();
        }}
      >
        <Pin aria-hidden /> Pin required record
      </Toggle>
      <Text id="required-pin-reason">Required records stay pinned while under review.</Text>
    </Specimens>
  );
}

/** Standard variants and sizes, independent state, and a controlled record action. */
export const ToggleMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Matrix
        rows={["default", "outline"] as const}
        cols={["small", "medium", "large", "pressed", "disabled"] as const}
        render={(variant, state) => (
          <Toggle
            variant={variant}
            size={state === "small" || state === "large" ? state : "medium"}
            aria-label={`${variant} ${state} bold`}
            defaultPressed={state === "pressed"}
            disabled={state === "disabled"}
          >
            <Bold aria-hidden />
          </Toggle>
        )}
      />
      <PinnedRecord />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of ["default", "outline"]) {
      for (const [size, height] of [
        ["small", 28],
        ["medium", 32],
        ["large", 36],
      ] as const) {
        const toggle = canvas.getByRole("button", { name: `${variant} ${size} bold` });
        await expect(toggle).toHaveAttribute("type", "button");
        await expect(toggle).toHaveAttribute("data-slot", "toggle");
        await expect(toggle).toHaveAttribute("data-size", size);
        await expect(toggle.getBoundingClientRect().height).toBe(height);
        await expect(toggle).toHaveAttribute("aria-pressed", "false");
        await userEvent.click(toggle);
        await expect(toggle).toHaveAttribute("aria-pressed", "true");
      }
      await expect(canvas.getByRole("button", { name: `${variant} pressed bold` })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      const disabled = canvas.getByRole("button", { name: `${variant} disabled bold` });
      await expect(disabled).toBeDisabled();
      await userEvent.click(disabled, { pointerEventsCheck: 0 });
      await expect(disabled).toHaveAttribute("aria-pressed", "false");
    }
    const pin = canvas.getByRole("button", { name: "Pin record" });
    await expect(pinRef.current).toBe(pin);
    await expect(renderedRef.current).toBe(pin);
    await expect(pin).toHaveAttribute("id", "record-pin");
    await expect(pin).toHaveAttribute("title", "Pin this record");
    await userEvent.click(pin);
    await expect(pin).toHaveAttribute("aria-pressed", "true");
    await expect(pin).toHaveClass("underline");
    await expect(pin).toHaveStyle({ minWidth: "140px" });
    await expect(canvas.getByText("This record appears first.")).toBeVisible();
    await userEvent.keyboard("{Enter}");
    await expect(pin).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    await expect(pin).toHaveAttribute("aria-pressed", "true");
    const required = canvas.getByRole("button", { name: "Pin required record" });
    await userEvent.click(required);
    await userEvent.keyboard("{Enter} ");
    await expect(required).toHaveAttribute("aria-pressed", "true");
  },
};

export const Playground: Story = {};

/**
 * `sm`, `default` and `lg` are the deprecated spellings of `small`, `medium` and `large`, kept for
 * one version: each draws and reports its new word, and `ledger/no-deprecated-name` rewrites them.
 */
export const DeprecatedSizes: Story = {
  tags: ["!manifest"],
  name: "Deprecated size spellings",
  render: () => (
    <Specimens title="Deprecated spellings draw the new sizes">
      <Toggle size="sm" aria-label="Legacy sm bold">
        <Bold aria-hidden />
      </Toggle>
      <Toggle size="default" aria-label="Legacy default bold">
        <Bold aria-hidden />
      </Toggle>
      <Toggle size="lg" aria-label="Legacy lg bold">
        <Bold aria-hidden />
      </Toggle>
    </Specimens>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [legacy, word, height] of [
      ["sm", "small", 28],
      ["default", "medium", 32],
      ["lg", "large", 36],
    ] as const) {
      const toggle = canvas.getByRole("button", { name: `Legacy ${legacy} bold` });
      await expect(toggle).toHaveAttribute("data-size", word);
      await expect(toggle.getBoundingClientRect().height).toBe(height);
    }
  },
};

/** A caller's `data-slot` never renames the part: the toggle's identity comes after its props. */
export const Identity: Story = {
  render: () => (
    <Toggle aria-label="Bold" data-slot="format-bold" data-testid="bold" className="w-fit">
      <Bold aria-hidden />
    </Toggle>
  ),
  play: async ({ canvasElement }) => {
    const toggle = within(canvasElement).getByTestId("bold");
    await expect(toggle).toHaveAttribute("data-slot", "toggle");
    await expect(toggle).toHaveClass("w-fit");
  },
};

/**
 * Pressed is the selected palette with a 1px `color.border.selected` edge, so a pressed toggle
 * never looks like a hovered one: hover stays the neutral tint and adds no edge. The edge is drawn
 * out of the flow, so pressing never changes the toggle's size. In forced colours pressed is
 * Highlight.
 */
export const PressedAgainstHover: Story = {
  tags: ["!manifest"],
  name: "Pressed against hover",
  render: () => (
    <Stack space="space.200">
      <Specimens title="Hovered, and pressed">
        <Toggle aria-label="Hovered bold">
          <Bold aria-hidden />
        </Toggle>
        <Toggle aria-label="Pressed bold" defaultPressed>
          <Bold aria-hidden />
        </Toggle>
        <Toggle variant="outline" aria-label="Pressed outline bold" defaultPressed>
          <Bold aria-hidden />
        </Toggle>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hovered = canvas.getByRole("button", { name: "Hovered bold" });
    const pressed = canvas.getByRole("button", { name: "Pressed bold" });
    const outline = canvas.getByRole("button", { name: "Pressed outline bold" });
    const size = pressed.getBoundingClientRect();
    await userEvent.hover(hovered);
    await expect(getComputedStyle(hovered, "::after").content).toBe("none");
    await expect(getComputedStyle(hovered).backgroundColor).not.toBe(
      getComputedStyle(pressed).backgroundColor,
    );
    if (!matchMedia("(forced-colors: active)").matches) {
      const edge = getComputedStyle(pressed, "::after");
      await expect(edge.position).toBe("absolute");
      await expect(edge.borderTopStyle).toBe("solid");
      await expect(edge.borderTopWidth).toBe("1px");
      await expect(edge.borderTopColor).toBe(getComputedStyle(outline).borderTopColor);
      await expect(getComputedStyle(hovered).borderTopColor).not.toBe(edge.borderTopColor);
    }
    await userEvent.click(pressed);
    await expect(pressed).toHaveAttribute("aria-pressed", "false");
    await expect(pressed.getBoundingClientRect().width).toBe(size.width);
    await userEvent.click(pressed);
    await expect(pressed).toHaveAttribute("aria-pressed", "true");
    await expect(pressed.getBoundingClientRect().width).toBe(size.width);
  },
};

/**
 * The name says what pressing turns on and stays the same; the pressed state says whether it is on.
 * A name that flips with the state says the state twice, and a speech user cannot know which word
 * to say.
 */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: function ConstantName() {
    const [shown, setShown] = useState(false);
    return (
      <Pair
        do={<Toggle variant="outline">Show as table</Toggle>}
        doText="One name, pressed or not: a screen reader hears Show as table, pressed."
        dont={
          <Toggle variant="outline" pressed={shown} onPressedChange={setShown}>
            {shown ? "Hide table" : "Show table"}
          </Toggle>
        }
        dontText="Show table, then Hide table: the words change with the state the button already reports."
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const constant = canvas.getByRole("button", { name: "Show as table" });
    await userEvent.click(constant);
    await expect(constant).toHaveAttribute("aria-pressed", "true");
    await expect(constant).toHaveAccessibleName("Show as table");
    const flipping = canvas.getByRole("button", { name: "Show table" });
    await userEvent.click(flipping);
    await expect(flipping).toHaveAttribute("aria-pressed", "true");
    await expect(flipping).toHaveAccessibleName("Hide table");
  },
};
