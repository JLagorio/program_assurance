import { useLayoutEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button, Skeleton, Spinner, type SpinnerProps } from "../../components";
import { Stack } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: { layout: "padded" },
  args: { size: "small" },
} satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;

/* The ref is set inside a component of the story's own, not in its args or its returned tree: the
   docs page prints a story's elements as its source, and reading a ref from an element is a
   React 19 error. */
const spinnerRef = fn();
function SavingRow(props: SpinnerProps) {
  return (
    <div className="flex items-center gap-150">
      <Spinner
        {...props}
        ref={spinnerRef}
        aria-label="Saving changes"
        strokeWidth={3}
        data-operation="save"
      />
      <span>Saving changes…</span>
      <Button isLoading>Save</Button>
    </div>
  );
}

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

export const Playground: Story = {
  render: (args) => <SavingRow {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const spinner = canvas.getByRole("status", { name: "Saving changes" });
    await expect(spinnerRef).toHaveBeenCalledWith(spinner);
    await expect(spinner.tagName.toLowerCase()).toBe("svg");
    await expect(spinner).toHaveAttribute("stroke-width", "3");
    await expect(spinner).toHaveAttribute("data-operation", "save");
    await expect(canvas.getAllByRole("status")).toHaveLength(1);
    await expect(canvas.getByRole("button", { name: "Save" })).toHaveAttribute("aria-busy", "true");
  },
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
      <div className="flex flex-wrap items-center gap-150">
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

function Saving() {
  const [saving, setSaving] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-150">
      <Button onClick={() => setSaving(true)}>Save requirement</Button>
      {saving ? (
        <>
          <Spinner label="Saving the requirement" />
          <Button isLoading>Export</Button>
        </>
      ) : null}
    </div>
  );
}

/** A status inserted with its name already set is announced by almost no screen reader, so a Spinner says its name once, politely, through the kit's live regions when it appears. A decorative one, such as a loading Button's, says nothing: its control carries the busy state. */
export const Announced: Story = {
  render: () => <Saving />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const said = () =>
      [...document.querySelectorAll('[data-slot="announcer-region"][data-politeness="polite"]')]
        .map((region) => region.textContent ?? "")
        .join(" ");
    await userEvent.click(canvas.getByRole("button", { name: "Save requirement" }));
    await expect(canvas.getByRole("status", { name: "Saving the requirement" })).toBeVisible();
    await waitFor(() => expect(said()).toContain("Saving the requirement"));
    // The Button's own spinner is decorative: hidden, and not said.
    const exporting = canvas.getByRole("button", { name: "Export" });
    await expect(exporting.querySelector('[data-slot="spinner"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(said()).not.toContain("Loading");
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<Button isLoading>Upload evidence</Button>}
        doText="The button that started the work shows it: `isLoading` keeps its label, its width and the keyboard's focus, and says it is busy."
        dont={<Button disabled>Uploading…</Button>}
        dontText="A disabled button whose label changes. Focus drops to the page for the whole upload, and a screen reader hears nothing until it ends."
      />
      <Pair
        do={
          <div style={{ maxWidth: 320 }} aria-busy>
            <span className="sr-only">Loading the section</span>
            <Stack space="space.150">
              <Skeleton shape="heading" width={200} />
              <Skeleton lines={3} />
            </Stack>
          </div>
        }
        doText="Content on its way holds its shape with a Skeleton; the spinner is for an action."
        dont={
          <div style={{ maxWidth: 320, height: 96 }} className="flex items-center justify-center">
            <Spinner size="large" />
          </div>
        }
        dontText="A large spinner where a register will be. Nothing says what is coming, and the page jumps when it arrives."
      />
    </Stack>
  ),
};
