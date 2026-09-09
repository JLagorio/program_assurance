import { useLayoutEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button, Spinner } from "../../components";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: { layout: "padded" },
  args: { size: "small", ref: fn() },
} satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="flex items-center gap-150">
      <Spinner {...args} aria-label="Saving changes" strokeWidth={3} data-operation="save" />
      <span>Saving changes…</span>
      <Button isLoading>Save</Button>
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const spinner = canvas.getByRole("status", { name: "Saving changes" });
    await expect(args.ref).toHaveBeenCalledWith(spinner);
    await expect(spinner.tagName.toLowerCase()).toBe("svg");
    await expect(spinner).toHaveAttribute("stroke-width", "3");
    await expect(spinner).toHaveAttribute("data-operation", "save");
    await expect(canvas.getAllByRole("status")).toHaveLength(1);
    await expect(canvas.getByRole("button", { name: "Save" })).toHaveAttribute("aria-busy", "true");
  },
};

export const SizesAndAppearance: Story = {
  render: () => (
    <div className="flex flex-col gap-200">
      {(["subtle", "inverse", "inherit"] as const).map((appearance) => (
        <div
          key={appearance}
          className={
            appearance === "inverse"
              ? "flex items-center gap-200 rounded-medium bg-brand-bold p-150 text-inverse"
              : "flex items-center gap-200 p-150 text-default"
          }
        >
          <span>{appearance}</span>
          {(["small", "medium", "large"] as const).map((size) => (
            <Spinner
              key={size}
              size={size}
              appearance={appearance}
              label={size + " " + appearance}
            />
          ))}
        </div>
      ))}
    </div>
  ),
};

function Delayed() {
  const [key, setKey] = useState(0);
  const [delay, setDelay] = useState(60_000);
  // A synchronous later delay must not hide an already revealed spinner.
  useLayoutEffect(() => {
    if (delay === 0) setDelay(60_000);
  }, [delay]);
  return (
    <div className="flex flex-col items-start gap-150">
      <p>The spinner waits until the delay expires. A new operation resets the wait.</p>
      <div className="flex items-center gap-150">
        <Button
          onClick={() => {
            setDelay(300);
            setKey((n) => n + 1);
          }}
        >
          Start operation
        </Button>
        <Button onClick={() => setDelay(0)}>Show now</Button>
        <Button onClick={() => setDelay(60_000)}>Delay again</Button>
      </div>
      <Spinner key={key} delay={delay} label="Pending operation" />
    </div>
  );
}

export const Delay: Story = {
  render: () => <Delayed />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("status")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Show now" }));
    await expect(canvas.getByRole("status", { name: "Pending operation" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Delay again" }));
    await expect(canvas.getByRole("status")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Start operation" }));
    await expect(canvas.queryByRole("status")).toBeNull();
    await expect(await canvas.findByRole("status")).toBeVisible();
  },
};
