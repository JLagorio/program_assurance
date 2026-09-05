import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, Badge, Collapsible, Person, Stepper } from "../../components";
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
};

/** Where a path is drawn: a milestone header on a record, and a wizard's rail. */
export const Paths: Story = {
  render: () => (
    <Stack space="space.600">
      <Stepper label="Milestones" style={{ minWidth: 640 }}>
        <Stepper.Item
          state="done"
          label="MS-A"
          meta="4 Mar · Complete"
          onSelect={() => undefined}
        />
        <Stepper.Item
          state="done"
          label="MS-B"
          meta="29 Jul · Complete"
          onSelect={() => undefined}
        />
        <Stepper.Item
          state="current"
          label="MS-C"
          meta="18 Sep · 10d out"
          onSelect={() => undefined}
        />
        <Stepper.Item
          state="blocked"
          label="MS-D"
          meta="2 Dec · 2 findings"
          onSelect={() => undefined}
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
};

/** A rail of milestones: each step carries its record under the label, the owner and the open task behind a Collapsible, and the rail runs past it. */
export const Milestones: Story = {
  render: () => (
    <Box style={{ width: 520 }}>
      <Stepper label="Activation" orientation="vertical">
        <Stepper.Item state="done" label="Contract signed" meta="12 Aug">
          <Collapsible title={<Person name="Maya Brooks" />} className="border-t-0">
            <Text size="small" color="color.text.subtle">
              Revenue operations. Signed and countersigned; the workspace order is on file.
            </Text>
          </Collapsible>
        </Stepper.Item>
        <Stepper.Item state="current" label="Workspace provisioning" meta="Due 18 Sep">
          <Collapsible title={<Person name="Nina Patel" />} defaultOpen className="border-t-0">
            <Stack space="space.100">
              <Inline space="space.050">
                <Badge size="xsmall" tone="warning">
                  Pending
                </Badge>
                <Badge size="xsmall">Identity setup</Badge>
                <Badge size="xsmall">Medium</Badge>
              </Inline>
              <Text weight="medium">Admin group mapping</Text>
              <Text size="small" color="color.text.subtle">
                SCIM groups are being matched to launch roles before the first admin invites go out.
              </Text>
              <Inline space="space.100" alignBlock="center" spread="space-between">
                <Avatar.Stack names={["Nina Patel", "Owen Fox", "Sam Lee", "Ira Wells"]} max={2} />
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
          </Collapsible>
        </Stepper.Item>
        <Stepper.Item state="upcoming" label="Launch readiness">
          <Collapsible title={<Person name="Leah Stone" />} className="border-t-0">
            <Text size="small" color="color.text.subtle">
              Account executive. Opens when provisioning closes.
            </Text>
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
        dontText="Two steps. Carbon draws the line at three; a thing that is drafted or approved is a Badge, not a path."
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
        doText="In a rail or a panel, vertical: Carbon's preference wherever it fits."
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
              <Badge tone="danger">Blocked</Badge>
            </div>
          </Stack>
        }
        dontText="A red marker with nothing under it, and a badge elsewhere to explain. The reason belongs on the step."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
