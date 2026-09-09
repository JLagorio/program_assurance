import { Progress as BaseProgress } from "@base-ui/react/progress";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressStacked,
  ProgressTrack,
  ProgressValue,
} from "../../components";
import { Stack } from "../../primitives";
const meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: { layout: "padded" },
  args: { value: 64 },
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;
const progressRef = createRef<HTMLDivElement>();
export const ValuesAndRanges: Story = {
  render: () => (
    <Stack space="space.300">
      <Progress ref={progressRef} value={64} aria-label="Assessment progress">
        <ProgressValue />
      </Progress>
      <Progress
        value={20}
        min={10}
        max={30}
        aria-label="Evidence gathered"
        size="large"
        tone="success"
      >
        <ProgressValue />
      </Progress>
      <Progress value={150} aria-label="Complete review" />
      <Progress value={null} aria-label="Loading evidence" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      progress = canvas.getByRole("progressbar", { name: "Assessment progress" });
    await expect(progressRef.current).toBe(progress);
    await expect(progress).toHaveAttribute("aria-valuenow", "64");
    const range = canvas.getByRole("progressbar", { name: "Evidence gathered" });
    await expect(range).toHaveAttribute("aria-valuemin", "10");
    await expect(range).toHaveAttribute("aria-valuemax", "30");
    await expect(
      range.querySelector<HTMLElement>('[data-slot="progress-indicator"]')?.style.width,
    ).toBe("50%");
    await expect(canvas.getByRole("progressbar", { name: "Complete review" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    await expect(canvas.getByRole("progressbar", { name: "Loading evidence" })).not.toHaveAttribute(
      "aria-valuenow",
    );
  },
};
export const LabelAndValue: Story = {
  render: () => (
    <Progress value={41} max={80} tone="success">
      <ProgressLabel>Controls verified</ProgressLabel>
      <ProgressValue>{(_, value) => `${value} of 80`}</ProgressValue>
    </Progress>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("progressbar", { name: "Controls verified" })).toHaveAttribute(
      "aria-valuenow",
      "41",
    );
    await expect(canvas.getByText("41 of 80")).toBeVisible();
  },
};
function Coverage() {
  const [filter, setFilter] = useState("All controls");
  return (
    <Stack space="space.200">
      <ProgressStacked
        label="Control coverage"
        segments={[
          {
            key: "met",
            value: 12,
            tone: "success",
            title: "12 met",
            onClick: () => setFilter("Met controls"),
          },
          {
            key: "gap",
            value: 3,
            tone: "danger",
            title: "3 gaps",
            onClick: () => setFilter("Control gaps"),
          },
          {
            key: "unknown",
            value: 4,
            tone: "neutral",
            appearance: "hatched",
            title: "4 unassessed",
          },
        ]}
      />
      <p role="status">{filter}</p>
    </Stack>
  );
}
export const StackedCoverage: Story = {
  render: () => <Coverage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "3 gaps" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Control gaps");
  },
};

/** The styled track and indicator also compose with a native Base UI root. */
export const CustomTrack: Story = {
  render: () => (
    <BaseProgress.Root value={30} aria-label="Upload progress">
      <ProgressTrack className="h-100">
        <ProgressIndicator />
      </ProgressTrack>
    </BaseProgress.Root>
  ),
};
