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
  tones,
} from "../../components";
import { Stack } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix } = storyLayout;
const { Pair } = pairLayout;
const meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: { layout: "padded" },
  args: { value: 64 },
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;
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

/** A value in its range, a range that does not start at zero, a value past the end (clamped), and `value={null}`: a wait whose length is unknown, a hatched bar whose stripes move, never a full one. */
export const ValuesAndRanges: Story = {
  render: () => (
    <Stack space="space.300">
      <Progress value={64} aria-label="Assessment progress">
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
    await expect(progress).toHaveAttribute("aria-valuenow", "64");
    if (matchMedia("(forced-colors: active)").matches) {
      for (const bar of canvas.getAllByRole("progressbar")) {
        const track = bar.querySelector('[data-slot="progress-track"]')!;
        const indicator = bar.querySelector('[data-slot="progress-indicator"]')!;
        await expect(getComputedStyle(track).outlineStyle).toBe("solid");
        await expect(getComputedStyle(indicator).backgroundColor).not.toBe(
          getComputedStyle(track).backgroundColor,
        );
      }
    }
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
    const waiting = canvas.getByRole("progressbar", { name: "Loading evidence" });
    await expect(waiting).not.toHaveAttribute("aria-valuenow");
    // The unknown wait says so in the locale's words, not Base UI's English.
    await expect(waiting).toHaveAttribute("aria-valuetext", "In progress");
    const stripes = waiting.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!;
    await expect(stripes).toHaveAttribute("data-indeterminate");
    if (!matchMedia("(forced-colors: active)").matches) {
      // Hatched, not a full fill: the stripes are drawn over a transparent bar.
      await expect(getComputedStyle(stripes).backgroundImage).toContain("linear-gradient");
      await expect(getComputedStyle(stripes).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    }
    // The stripes move, and stand still under reduced motion.
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    await expect(getComputedStyle(stripes).animationName).toBe(
      still ? "none" : "ds-progress-stripes",
    );
  },
};

/** Every tone, determinate and waiting, on the page and on the sunken surface (a metrics strip, a pinned row). Each fill holds 3:1 against the track on every surface; a warning bar, filled or waiting, is `color.chart.warning.bold`, since the warning bold fill is a light orange made to carry dark text. */
export const Tones: Story = {
  tags: ["!manifest"],
  render: () => (
    <Matrix
      rows={tones}
      cols={["64%", "Waiting", "64% on sunken"] as const}
      rowLabel="tone"
      render={(tone, col) => (
        <div
          style={{ width: 240, maxWidth: "100%" }}
          className={col === "64% on sunken" ? "bg-surface-sunken p-100" : undefined}
        >
          <Progress
            tone={tone}
            value={col === "Waiting" ? null : 64}
            aria-label={`${tone}, ${col === "Waiting" ? "waiting" : col === "64%" ? "64 percent" : "64 percent on sunken"}`}
          />
        </div>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const bars = within(canvasElement).getAllByRole("progressbar");
    await expect(bars).toHaveLength(tones.length * 3);
    const indicator = (name: string) =>
      within(canvasElement)
        .getByRole("progressbar", { name })
        .querySelector<HTMLElement>('[data-slot="progress-indicator"]')!;
    await expect(indicator("warning, 64 percent")).toHaveClass("bg-chart-warning-bold");
    await expect(indicator("warning, 64 percent")).not.toHaveClass("bg-warning-bold");
    if (!matchMedia("(forced-colors: active)").matches) {
      for (const tone of tones)
        for (const name of [`${tone}, 64 percent`, `${tone}, 64 percent on sunken`]) {
          const fill = getComputedStyle(indicator(name)).backgroundColor;
          const track = getComputedStyle(
            indicator(name).closest<HTMLElement>('[data-slot="progress-track"]')!,
          ).backgroundColor;
          await expect(fill, `${name}: the fill differs from its track`).not.toBe(track);
        }
      // A waiting warning bar's stripes are the filled bar's orange, not the warning icon's.
      await expect(getComputedStyle(indicator("warning, waiting")).color).toBe(
        getComputedStyle(indicator("warning, 64 percent")).backgroundColor,
      );
    }
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
/** A coverage bar whose segments filter what is under it: a group of buttons named by the bar, where the segment that does not click is read as its title. The bar does not clip its segments, so a focused segment's ring shows whole; on a touch screen each segment's hit area is 24px tall. */
export const StackedCoverage: Story = {
  render: () => <Coverage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("group", { name: "Control coverage" });
    // No part of the breakdown is lost: the unassessed segment is read as its title.
    await expect(bar).toHaveTextContent("4 unassessed");
    await expect(getComputedStyle(bar).overflow).toBe("visible");
    await userEvent.click(canvas.getByRole("button", { name: "3 gaps" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Control gaps");
    // The keyboard reaches each segment, and its ring is drawn whole.
    await userEvent.tab({ shift: true });
    const met = canvas.getByRole("button", { name: "12 met" });
    await expect(met).toHaveFocus();
    await expect(getComputedStyle(met).outlineStyle).toBe("solid");
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Met controls");
    if (matchMedia("(any-pointer: coarse)").matches) {
      const target = getComputedStyle(met, "::before");
      await expect(parseFloat(target.height)).toBeGreaterThanOrEqual(24);
    }
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <ProgressStacked
            label="Control coverage"
            segments={[
              { key: "met", value: 41, tone: "success", title: "41 met" },
              { key: "gap", value: 6, tone: "danger", title: "6 gaps" },
              {
                key: "unknown",
                value: 9,
                tone: "neutral",
                appearance: "hatched",
                title: "9 unassessed",
              },
            ]}
          />
        }
        doText="A share of a whole (coverage, controls by state) is ProgressStacked, or a number in words: it is a measure, not a task that finishes."
        dont={
          <Progress value={73} tone="success">
            <ProgressLabel>Control coverage</ProgressLabel>
            <ProgressValue />
          </Progress>
        }
        dontText="Coverage as a progressbar. A screen reader hears a task 73 percent done, and the gaps and the unassessed controls disappear into the rest of the bar."
      />
      <Pair
        do={<Progress value={null} aria-label="Importing the catalogue" />}
        doText="A wait whose length is unknown is `value={null}`: hatched, and said as in progress."
        dont={<Progress value={100} aria-label="Importing the catalogue" />}
        dontText="A full bar for a wait. It reads as finished while the work is still running."
      />
    </Stack>
  ),
};

const progressRef = createRef<HTMLDivElement>();

/** A ref and native attributes reach the progressbar itself. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: () => (
    <Progress ref={progressRef} value={64} aria-label="Assessment progress" data-example="native" />
  ),
  play: async ({ canvasElement }) => {
    const progress = within(canvasElement).getByRole("progressbar", {
      name: "Assessment progress",
    });
    await expect(progressRef.current).toBe(progress);
    await expect(progress).toHaveAttribute("data-example", "native");
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
