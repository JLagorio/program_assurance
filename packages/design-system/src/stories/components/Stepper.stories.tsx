import {
  Avatar,
  AvatarFallback,
  AvatarGroupCount,
  avatarInitials,
  AvatarGroup,
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Person,
  Stepper,
} from "../../components";
import { ChevronDown } from "lucide-react";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { createRef, useRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Stepper",
  component: Stepper,
  parameters: { layout: "padded" },
  args: {
    label: "RMF steps",
    children: [
      <Stepper.Item key="1" state="done" label="Categorize" meta="Done 3 Aug" />,
      <Stepper.Item key="2" state="current" label="Select" meta="In progress" />,
      <Stepper.Item key="3" state="upcoming" label="Implement" />,
    ],
  },
} satisfies Meta<typeof Stepper>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every state on one path, plain and numbered; vertical, plain and numbered, with steps that can be moved to. */
export const StepperMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Horizontal: done, done, current, blocked, upcoming">
        <Stepper label="States" className="w-full">
          <Stepper.Item state="done" label="Done" meta="Feb 27" />
          <Stepper.Item state="done" label="Done" meta="Jul 29" />
          <Stepper.Item state="current" label="Current" meta="10d overdue" />
          <Stepper.Item state="blocked" label="Blocked" meta="2 findings" />
          <Stepper.Item state="upcoming" label="Upcoming" meta="Nov 19" />
        </Stepper>
      </Specimens>
      <Specimens title="Numbered, the done steps selectable">
        <Stepper label="RMF steps" numbered className="w-full">
          <Stepper.Item state="done" label="Categorize" onSelect={() => {}} />
          <Stepper.Item state="done" label="Select" onSelect={() => {}} />
          <Stepper.Item state="current" label="Implement" />
          <Stepper.Item state="upcoming" label="Assess" />
          <Stepper.Item state="upcoming" label="Authorize" />
          <Stepper.Item state="upcoming" label="Monitor" />
        </Stepper>
      </Specimens>
      <Specimens title="Vertical, plain and numbered; the meta wraps">
        <Box style={{ width: 240 }}>
          <Stepper label="Request" orientation="vertical">
            <Stepper.Item state="done" label="Request sent" meta="12 Aug, 09:14" />
            <Stepper.Item state="current" label="Awaiting evidence" meta="Dana Whitfield" />
            <Stepper.Item
              state="blocked"
              label="Review"
              meta="Blocked: the reconciliation is missing its sign-off"
            />
            <Stepper.Item state="upcoming" label="Close" />
          </Stepper>
        </Box>
        <Box style={{ width: 240 }}>
          <Stepper label="Program setup" orientation="vertical" numbered>
            <Stepper.Item state="done" label="Program" meta="Aurora" onSelect={() => {}} />
            <Stepper.Item
              state="done"
              label="Framework"
              meta="NIST 800-53 r5"
              onSelect={() => {}}
            />
            <Stepper.Item state="current" label="Systems" meta="2 scopes" />
            <Stepper.Item state="upcoming" label="Review" meta="Step 4 of 4" />
          </Stepper>
        </Box>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const states = canvas.getByRole("list", { name: "States" });
    // A list whose markers are removed says it is a list, so WebKit keeps "3 of 6".
    await expect(states).toHaveAttribute("role", "list");
    // A strip that fits its container adds no tab stop around its steps; one that scrolls and
    // holds no button is the stop, named after the list.
    const viewport = states.parentElement!;
    await expect(viewport).toHaveAttribute("data-slot", "scroller-viewport");
    if (viewport.scrollWidth <= viewport.clientWidth) {
      await expect(viewport).not.toHaveAttribute("tabindex");
      await expect(viewport).not.toHaveAttribute("role");
    } else {
      await waitFor(() => expect(viewport).toHaveAttribute("tabindex", "0"));
      await expect(viewport).toHaveAccessibleName("States, scrolls");
    }
    // The state is read first; the drawn number is not read.
    const rmf = canvas.getByRole("list", { name: "RMF steps" });
    const select = within(rmf).getByRole("button", { name: "Completed: Select" });
    await expect(within(rmf).getByRole("button", { name: "Current: Implement" })).toBeVisible();
    // A focused step's ring is drawn inside the strip, which clips.
    select.focus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}{Tab}");
    await expect(select).toHaveFocus();
    await expect(getComputedStyle(select, "::after").outlineOffset).toBe("-2px");
    // Down the page a step's ring stops above the next step's marker.
    const setup = canvas.getByRole("list", { name: "Program setup" });
    const program = within(setup).getByRole("button", { name: /Program/ });
    program.focus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}{Tab}");
    await expect(program).toHaveFocus();
    const ring = getComputedStyle(program, "::after");
    const reach =
      program.closest("li")!.getBoundingClientRect().bottom -
      parseFloat(ring.bottom) +
      parseFloat(ring.outlineOffset) +
      parseFloat(ring.outlineWidth);
    // Each step draws a marker for either orientation; the one down the page is the one shown.
    const next = [
      ...setup.querySelectorAll("li")[1]!.querySelectorAll('[data-slot="stepper-marker"]'),
    ].find((marker) => marker.getBoundingClientRect().height > 0)!;
    await expect(reach).toBeLessThan(next.getBoundingClientRect().top);
  },
};

/** Where a path is drawn: a milestone header on a record, and a wizard's rail. */
const stepperRef = createRef<HTMLOListElement>();
const stepRef = createRef<HTMLLIElement>();
const selectStep = fn();
const stepperClick = fn();
const guardStep = fn();

export const Paths: Story = {
  render: () => (
    <Stack space="space.600">
      <Stepper
        ref={stepperRef}
        id="milestone-path"
        data-path="milestones"
        label="Milestones"
        aria-label="Milestone navigation"
        style={{ minWidth: 640 }}
        className="gap-100"
        onClick={stepperClick}
      >
        <Stepper.Item
          ref={stepRef}
          id="milestone-a"
          data-step="a"
          title="Milestone A"
          className="rounded-medium"
          style={{ scrollMarginTop: 32 }}
          state="done"
          label="MS-A"
          meta="4 Mar · Complete"
          onSelect={() => selectStep("MS-A")}
        />
        <Stepper.Item
          state="done"
          label="MS-B"
          meta="29 Jul · Complete"
          onSelect={() => selectStep("MS-B")}
        />
        <Stepper.Item
          state="current"
          label="MS-C"
          meta="18 Sep · 10d out"
          onSelect={() => selectStep("MS-C")}
        />
        <Stepper.Item
          state="blocked"
          label="MS-D"
          meta="2 Dec · 2 findings"
          onClickCapture={(event) => {
            guardStep();
            event.preventDefault();
          }}
          onSelect={() => selectStep("MS-D")}
        />
        <Stepper.Item state="upcoming" label="MS-E" meta="14 Jan" onSelect={() => undefined} />
      </Stepper>
      <Box style={{ width: 280 }}>
        <Stepper label="Program setup" orientation="vertical" numbered>
          <Stepper.Item state="done" label="Program" meta="Aurora" onSelect={() => undefined} />
          <Stepper.Item
            state="done"
            label="Framework"
            meta="NIST 800-53 r5"
            onSelect={() => undefined}
          />
          <Stepper.Item state="current" label="Systems" meta="2 scopes" />
          <Stepper.Item state="upcoming" label="Review" meta="Step 4 of 4" />
        </Stepper>
      </Box>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    selectStep.mockClear();
    stepperClick.mockClear();
    guardStep.mockClear();
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list", { name: "Milestone navigation" });
    const step = canvas.getByTitle("Milestone A");
    const first = within(step).getByRole("button", { name: /MS-A/ });
    const blocked = within(list).getByRole("button", { name: /MS-D/ });
    await expect(stepperRef.current).toBe(list);
    await expect(stepRef.current).toBe(step);
    await expect(list.tagName).toBe("OL");
    await expect(step.tagName).toBe("LI");
    await expect(list).toHaveAttribute("id", "milestone-path");
    await expect(list).toHaveAttribute("data-path", "milestones");
    await expect(list).toHaveAttribute("data-orientation", "horizontal");
    await expect(list).toHaveClass("group/stepper", "gap-100");
    await expect(list).toHaveStyle({ minWidth: "640px" });
    await expect(step).toHaveAttribute("id", "milestone-a");
    await expect(step).toHaveAttribute("data-step", "a");
    await expect(step).toHaveClass("group/step", "rounded-medium");
    await expect(step).toHaveStyle({ scrollMarginTop: "32px" });
    await userEvent.click(first);
    await userEvent.keyboard(" ");
    await expect(selectStep).toHaveBeenCalledTimes(2);
    await expect(selectStep).toHaveBeenLastCalledWith("MS-A");
    await expect(stepperClick).toHaveBeenCalledTimes(2);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await expect(selectStep).toHaveBeenLastCalledWith("MS-B");
    await userEvent.click(blocked);
    await userEvent.keyboard("{Enter}");
    await expect(guardStep).toHaveBeenCalledTimes(2);
    await expect(selectStep).toHaveBeenCalledTimes(3);
    // The current step of a path the reader moves along is a button carrying the state itself.
    const current = within(list).getByRole("button", { name: /MS-C/ });
    await expect(current).toHaveAttribute("aria-current", "step");
    await expect(current).toHaveAccessibleName("Current: MS-C 18 Sep · 10d out");
    await expect(current.closest("li")).not.toHaveAttribute("aria-current");
    await expect(within(list).getByRole("button", { name: /MS-E/ })).toHaveAccessibleName(
      "Not started: MS-E 14 Jan",
    );
    const vertical = canvas.getByRole("list", { name: "Program setup" });
    await expect(vertical).toHaveAttribute("data-orientation", "vertical");
    await expect(vertical.style.minWidth).toBe("");
  },
};

/** A rail of milestones: each step carries its record under the label, the owner and the open task behind a Collapsible, and the rail runs past it. */
export const Milestones: Story = {
  render: () => (
    <Box style={{ maxWidth: 520 }}>
      <Stepper label="Activation" orientation="vertical">
        <Stepper.Item state="done" label="Contract signed" meta="12 Aug">
          <Collapsible className="border-t border-default border-t-0">
            <h3>
              <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered">
                <Person name="Maya Brooks" />
                <ChevronDown
                  aria-hidden="true"
                  className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/collapsible:rotate-180"
                />
              </CollapsibleTrigger>
            </h3>
            <CollapsibleContent>
              <div className="pb-200">
                <Text size="small" color="color.text.subtle">
                  Revenue operations. Signed and countersigned; the workspace order is on file.
                </Text>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Stepper.Item>
        <Stepper.Item state="current" label="Workspace provisioning" meta="Due 18 Sep">
          <Collapsible defaultOpen className="border-t border-default border-t-0">
            <h3>
              <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered">
                <Person name="Nina Patel" />
                <ChevronDown
                  aria-hidden="true"
                  className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/collapsible:rotate-180"
                />
              </CollapsibleTrigger>
            </h3>
            <CollapsibleContent>
              <div className="pb-200">
                <Stack space="space.100">
                  <Inline space="space.050" shouldWrap>
                    <Badge variant="secondary" size="xsmall" tone="warning">
                      Pending
                    </Badge>
                    <Badge variant="secondary" tone="neutral" size="xsmall">
                      Identity setup
                    </Badge>
                    <Badge variant="secondary" tone="neutral" size="xsmall">
                      Medium
                    </Badge>
                  </Inline>
                  <Text weight="medium">Admin group mapping</Text>
                  <Text size="small" color="color.text.subtle">
                    SCIM groups are being matched to launch roles before the first admin invites go
                    out.
                  </Text>
                  <Inline space="space.100" alignBlock="center" spread="space-between">
                    <AvatarGroup role="group" aria-label="Reviewers">
                      {["Nina Patel", "Owen Fox", "Sam Lee", "Ira Wells"]
                        .slice(0, 2)
                        .map((name) => (
                          <Avatar key={name} role="img" aria-label={name}>
                            <AvatarFallback>{avatarInitials(name)}</AvatarFallback>
                          </Avatar>
                        ))}
                      <AvatarGroupCount>+2</AvatarGroupCount>
                    </AvatarGroup>
                    <Inline space="space.100" alignBlock="center">
                      <Text size="xsmall" color="color.text.subtle">
                        3 comments
                      </Text>
                      <Text size="xsmall" color="color.text.subtle">
                        Today
                      </Text>
                    </Inline>
                  </Inline>
                </Stack>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Stepper.Item>
        <Stepper.Item state="upcoming" label="Launch readiness">
          <Collapsible className="border-t border-default border-t-0">
            <h3>
              <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered">
                <Person name="Leah Stone" />
                <ChevronDown
                  aria-hidden="true"
                  className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/collapsible:rotate-180"
                />
              </CollapsibleTrigger>
            </h3>
            <CollapsibleContent>
              <div className="pb-200">
                <Text size="small" color="color.text.subtle">
                  Account executive. Opens when provisioning closes.
                </Text>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Stepper.Item>
      </Stepper>
    </Box>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Stepper label="Authorization" className="w-full">
            <Stepper.Item state="done" label="Categorize" />
            <Stepper.Item state="current" label="Select" />
            <Stepper.Item state="upcoming" label="Implement" />
            <Stepper.Item state="upcoming" label="Assess" />
          </Stepper>
        }
        doText="Three or more steps in a fixed order."
        dont={
          <Stepper label="Approval" className="w-full">
            <Stepper.Item state="current" label="Draft" />
            <Stepper.Item state="upcoming" label="Approved" />
          </Stepper>
        }
        dontText="Two steps. The line is three; a thing that is drafted or approved is a Badge, not a path."
      />
      <Pair
        do={
          <Stepper label="Authorization" className="w-full">
            <Stepper.Item state="done" label="Categorize" meta="3 Aug" />
            <Stepper.Item state="current" label="Select" meta="Priya Natarajan" />
            <Stepper.Item state="upcoming" label="Implement" />
          </Stepper>
        }
        doText="One or two words on the step; the date or the owner under it."
        dont={
          <Stepper label="Authorization" className="w-full">
            <Stepper.Item
              state="done"
              label="Categorize the system and its information types"
              meta="3 Aug"
            />
            <Stepper.Item state="current" label="Select the baseline and tailor the control set" />
            <Stepper.Item state="upcoming" label="Implement the controls across the boundary" />
          </Stepper>
        }
        dontText="A sentence on every step. The labels truncate and the path reads as three ellipses."
      />
      <Pair
        do={
          <Box style={{ width: 220 }}>
            <Stepper label="Request" orientation="vertical">
              <Stepper.Item state="done" label="Request sent" meta="12 Aug" />
              <Stepper.Item state="current" label="Awaiting evidence" meta="Dana Whitfield" />
              <Stepper.Item state="upcoming" label="Review" />
            </Stepper>
          </Box>
        }
        doText="In a rail or a panel, vertical: preferred wherever it fits."
        dont={
          <Box style={{ width: 220 }} className="overflow-hidden">
            <Stepper label="Request" style={{ minWidth: 0 }}>
              <Stepper.Item state="done" label="Request sent" meta="12 Aug" />
              <Stepper.Item state="current" label="Awaiting evidence" meta="Dana Whitfield" />
              <Stepper.Item state="upcoming" label="Review" />
            </Stepper>
          </Box>
        }
        dontText="Horizontal in a 220px rail. Every label truncates and the metas collide."
      />
      <Pair
        do={
          <Stepper label="Authorization" className="w-full">
            <Stepper.Item state="done" label="Categorize" />
            <Stepper.Item state="blocked" label="Select" meta="Baseline not approved" />
            <Stepper.Item state="upcoming" label="Implement" />
          </Stepper>
        }
        doText="A blocked step says why, in its helper text."
        dont={
          <Stack space="space.100">
            <Stepper label="Authorization" className="w-full">
              <Stepper.Item state="done" label="Categorize" />
              <Stepper.Item state="blocked" label="Select" />
              <Stepper.Item state="upcoming" label="Implement" />
            </Stepper>
            <div>
              <Badge variant="secondary" tone="danger">
                Blocked
              </Badge>
            </div>
          </Stack>
        }
        dontText="A red marker with nothing under it, and a badge elsewhere to explain. The reason belongs on the step."
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A sentence on a step is cut to its one line, and shows whole while the pointer is on it.
    const sentence = "Select the baseline and tailor the control set";
    const label = canvas.getByText(sentence);
    await expect(label).toHaveAttribute("data-slot", "truncate");
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth + 1);
    await userEvent.hover(label);
    await waitFor(() =>
      expect(document.querySelector('[data-slot="truncate-full-text"]')).toHaveTextContent(
        sentence,
      ),
    );
    await userEvent.unhover(label);
  },
};

export const Playground: Story = {};

/** Five steps on a small phone: the strip keeps the width its labels need and scrolls inside its container, arrows at the edges where a pointer can hover, instead of running past the window. */
export const Narrow: Story = {
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  tags: ["narrow"],
  render: () => (
    <Stepper label="Authorization steps">
      <Stepper.Item state="done" label="Categorize" meta="Done 3 Aug" />
      <Stepper.Item state="done" label="Select" meta="Done 21 Aug" />
      <Stepper.Item state="current" label="Implement" meta="In progress" />
      <Stepper.Item state="upcoming" label="Assess" />
      <Stepper.Item state="upcoming" label="Authorize" />
    </Stepper>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    const list = within(canvasElement).getByRole("list", { name: "Authorization steps" });
    const viewport = list.parentElement!;
    await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    await expect(viewport.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    // Steps that only report hold nothing the keyboard reaches, so the overflowing strip is the
    // stop: a group named after the list.
    await waitFor(() => expect(viewport).toHaveAttribute("tabindex", "0"));
    await expect(viewport).toHaveAttribute("role", "group");
    await expect(viewport).toHaveAccessibleName("Authorization steps, scrolls");
  },
};

const steps = ["Program", "Framework", "Systems", "Review"] as const;

/** A wizard's rail beside its step. */
function WizardDemo() {
  const [index, setIndex] = useState(1);
  const heading = useRef<HTMLHeadingElement>(null);
  const go = (next: number, focusHeading: boolean) => {
    setIndex(next);
    if (focusHeading) requestAnimationFrame(() => heading.current?.focus());
  };
  return (
    <Inline space="space.400" alignBlock="start" shouldWrap>
      <Box style={{ width: 200, maxWidth: "100%" }}>
        <Stepper label="Program setup" orientation="vertical" numbered>
          {steps.map((step, i) => (
            <Stepper.Item
              key={step}
              state={i < index ? "done" : i === index ? "current" : "upcoming"}
              label={step}
              // Every done step and the next one can be moved to.
              {...(i < index || i === index + 1 ? { onSelect: () => go(i, false) } : {})}
            />
          ))}
        </Stepper>
      </Box>
      <Stack space="space.200">
        <h2
          ref={heading}
          tabIndex={-1}
          className="font-heading-small outline-none focus-visible:outline-focused"
        >
          {steps[index]}
        </h2>
        <Text color="color.text.subtle">
          Step {index + 1} of {steps.length}
        </Text>
        <Inline space="space.100">
          <Button onClick={() => go(Math.max(0, index - 1), true)}>Back</Button>
          <Button variant="primary" onClick={() => go(Math.min(steps.length - 1, index + 1), true)}>
            Continue
          </Button>
        </Inline>
      </Stack>
    </Inline>
  );
}

/**
 * A wizard's rail: every done step and the next one can be moved to, and the current step stays a
 * button, so the step the reader activates keeps focus as it becomes current. Continue and Back
 * change the step from outside the rail, so they move focus to the new step's heading.
 */
export const Wizard: Story = {
  render: () => <WizardDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rail = canvas.getByRole("list", { name: "Program setup" });
    const systems = within(rail).getByRole("button", { name: "Not started: Systems" });
    // Upcoming steps with no way to them only report: no button, not a stop.
    await expect(within(rail).queryByRole("button", { name: /Review/ })).toBeNull();
    await userEvent.click(systems);
    // The same element, now current, still has focus.
    await expect(systems).toHaveFocus();
    await expect(systems).toHaveAttribute("aria-current", "step");
    await expect(systems).toHaveAccessibleName("Current: Systems");
    await expect(within(rail).getByRole("button", { name: "Completed: Framework" })).toBeVisible();
    // Activating the current step does nothing.
    await userEvent.keyboard("{Enter}");
    await expect(systems).toHaveFocus();
    await expect(systems).toHaveAttribute("aria-current", "step");
    // Continue moves focus to the step it opens.
    await userEvent.click(canvas.getByRole("button", { name: "Continue" }));
    const review = canvas.getByRole("heading", { name: "Review" });
    await waitFor(() => expect(review).toHaveFocus());
    await expect(within(rail).getByRole("button", { name: "Current: Review" })).toHaveAttribute(
      "aria-current",
      "step",
    );
  },
};
