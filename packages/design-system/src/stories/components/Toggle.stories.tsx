import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Pin } from "lucide-react";
import { createRef, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Toggle } from "../../components";
import { Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";

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
  render: () => (
    <Stack space="space.400">
      <Matrix
        rows={["default", "outline"] as const}
        cols={["sm", "default", "lg", "pressed", "disabled"] as const}
        render={(variant, state) => (
          <Toggle
            variant={variant}
            size={state === "sm" || state === "lg" ? state : "default"}
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
        ["sm", 28],
        ["default", 32],
        ["lg", 36],
      ] as const) {
        const toggle = canvas.getByRole("button", { name: `${variant} ${size} bold` });
        await expect(toggle).toHaveAttribute("type", "button");
        await expect(toggle).toHaveAttribute("data-slot", "toggle");
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
