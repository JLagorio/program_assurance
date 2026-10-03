import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, waitFor, within } from "storybook/test";

import { Section, StickyRail, tokenValue } from "../..";
import { Stepper } from "../../components";
import { Grid, Stack, Text } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const meta = {
  title: "Layout/StickyRail",
  component: StickyRail,
  // A page: the rail sticks to the document's scroll, so the story is the page.
  parameters: { layout: "fullscreen" },
  args: {},
} satisfies Meta<typeof StickyRail>;
export default meta;
type Story = StoryObj<typeof meta>;

const steps = ["Program", "Profiles", "Systems", "Review"];
const sections = [
  "Name and owner",
  "Mission",
  "Boundary",
  "Interconnections",
  "Schedule",
  "People",
  "Baseline",
  "Inheritance",
  "Evidence",
  "Notes",
];

const rail = createRef<HTMLDivElement>();

/** A wizard's page: the steps in a 200px column beside the form from the large breakpoint, above it below. */
function WizardPage() {
  return (
    <div className="p-300">
      <Grid gap="space.300" templateColumns={{ lg: "200px minmax(0,1fr)" }}>
        <StickyRail from="lg" ref={rail} data-testid="steps" className="pe-100">
          <Stepper orientation="responsive" label="Program setup">
            {steps.map((label, index) => (
              <Stepper.Item
                key={label}
                label={label}
                state={index < 1 ? "done" : index === 1 ? "current" : "upcoming"}
                meta={`Step ${index + 1} of ${steps.length}`}
              />
            ))}
          </Stepper>
        </StickyRail>
        <Stack space="space.400" className="min-w-0">
          {sections.map((title) => (
            <Section key={title} title={title}>
              <Stack space="space.150">
                <Text>
                  Each step of the setup is a form the reader works down. The steps stay in view
                  beside it, so the reader always sees where they are and what is left.
                </Text>
                <Text color="color.text.subtle">
                  The form runs longer than the window; the rail stays under the top of the page.
                </Text>
              </Stack>
            </Section>
          ))}
        </Stack>
      </Grid>
    </div>
  );
}

/** Where the rail stops: `space.300` under the top nav's height, outside a Shell. */
const stopsAt = () =>
  Number.parseFloat(tokenValue("dimension.layout.topnav")) +
  Number.parseFloat(tokenValue("space.300"));

/** Without `from` the rail always sticks: a column that is beside the content at every width. */
export const Always: Story = {
  render: () => (
    <div className="p-300">
      <Grid gap="space.200" templateColumns="minmax(0,1fr) minmax(0,2fr)">
        <StickyRail data-testid="always">
          <Text weight="semibold">On this page</Text>
        </StickyRail>
        <Stack space="space.400" className="min-w-0">
          {sections.map((title) => (
            <Section key={title} title={title}>
              <Text>The content beside the rail runs longer than the window.</Text>
            </Section>
          ))}
        </Stack>
      </Grid>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const always = within(canvasElement).getByTestId("always");
    await expect(always).not.toHaveAttribute("data-from");
    await expect(getComputedStyle(always).position).toBe("sticky");
  },
};

/**
 * `from="lg"`: from the large breakpoint the steps stay in view beside the form as the page
 * scrolls, stopping `space.300` under the top nav's height (the banner and the top nav in a
 * Shell); below it they sit above the form in the flow and scroll away with it. The rail forwards
 * its native props, its class and its ref, and names itself with `data-slot`.
 */
export const WizardSteps: Story = {
  name: "Wizard steps",
  render: () => <WizardPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const steps = canvas.getByTestId("steps");
    await expect(rail.current).toBe(steps);
    await expect(steps).toHaveAttribute("data-slot", "sticky-rail");
    await expect(steps).toHaveClass("pe-100");
    await expect(within(steps).getByRole("list", { name: "Program setup" })).toBeVisible();
    const large = window.matchMedia(`(width >= ${tokenValue("dimension.breakpoint.lg")})`).matches;
    await expect(getComputedStyle(steps).position).toBe(large ? "sticky" : "static");
    const scroller = canvasElement.ownerDocument.scrollingElement;
    if (!scroller) return;
    try {
      scroller.scrollTop = 600;
      if (large) {
        await waitFor(() =>
          expect(Math.abs(steps.getBoundingClientRect().top - stopsAt())).toBeLessThanOrEqual(1),
        );
      } else {
        await waitFor(() => expect(steps.getBoundingClientRect().bottom).toBeLessThan(0));
      }
    } finally {
      scroller.scrollTop = 0;
    }
  },
};

/** A wizard's steps, beside the form from `lg` and above it below: `from="lg"` or not. */
function StepsBesideForm({ from, testId }: { from?: "lg" | undefined; testId: string }) {
  return (
    <Grid gap="space.200" templateColumns={{ lg: "160px minmax(0,1fr)" }}>
      <StickyRail from={from} data-testid={testId}>
        <Stepper orientation="responsive" label="Program setup">
          {steps.map((label, index) => (
            <Stepper.Item
              key={label}
              label={label}
              state={index < 1 ? "done" : index === 1 ? "current" : "upcoming"}
            />
          ))}
        </Stepper>
      </StickyRail>
      <Text>The step's form, which the reader works down.</Text>
    </Grid>
  );
}

/** A rail whose grid stacks it above the content on a phone takes `from` with that breakpoint, so the steps scroll away there instead of staying over the form. The story is a phone. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  parameters: { layout: "padded" },
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => (
    <Pair
      do={<StepsBesideForm from="lg" testId="with-from" />}
      doText='from="lg": below the breakpoint the steps sit above the form in the flow and scroll away with the page.'
      dont={<StepsBesideForm testId="without-from" />}
      dontText="No from. On a phone, where the steps stack above the form, they stay stuck under the top nav and cover the form the reader is filling in."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const large = window.matchMedia(`(width >= ${tokenValue("dimension.breakpoint.lg")})`).matches;
    await expect(getComputedStyle(canvas.getByTestId("with-from")).position).toBe(
      large ? "sticky" : "static",
    );
    await expect(getComputedStyle(canvas.getByTestId("without-from")).position).toBe("sticky");
  },
};
