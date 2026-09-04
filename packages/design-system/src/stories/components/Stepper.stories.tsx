import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stepper } from "../../components";
import { Box, Stack } from "../../primitives";

const meta = {
  title: "Components/Stepper",
  component: Stepper,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Stepper>;
export default meta;
type Story = StoryObj;

export const Steppers: Story = {
  render: () => (
    <Stack space="space.600">
      <Stepper>
        <Stepper.Item
          state="done"
          label="Categorise"
          meta="Done 3 Aug"
          first
          onSelect={() => undefined}
        />
        <Stepper.Item state="done" label="Select" meta="Done 10 Aug" onSelect={() => undefined} />
        <Stepper.Item state="current" label="Implement" meta="In progress" />
        <Stepper.Item state="blocked" label="Assess" meta="Blocked on evidence" />
        <Stepper.Item state="upcoming" label="Authorise" />
        <Stepper.Item state="upcoming" label="Monitor" last />
      </Stepper>
      <Stepper orientation="vertical" className="max-w-[280px]">
        <Stepper.Item state="done" label="Request sent" meta="12 Aug, 09:14" first />
        <Stepper.Item state="current" label="Awaiting evidence" meta="Dana Whitfield" />
        <Stepper.Item state="upcoming" label="Review" last />
      </Stepper>
    </Stack>
  ),
};

/** Every step state, horizontal and vertical, with and without meta. */
export const StepperMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Stepper>
        <Stepper.Item state="done" label="Done" meta="Feb 27" first />
        <Stepper.Item state="done" label="Done" meta="Jul 29" />
        <Stepper.Item state="current" label="Current" meta="10d overdue" />
        <Stepper.Item state="blocked" label="Blocked" meta="2 findings" />
        <Stepper.Item state="upcoming" label="Upcoming" meta="Nov 19" last />
      </Stepper>
      <Box style={{ width: 260 }}>
        <Stepper orientation="vertical">
          <Stepper.Item state="done" label="Categorize" first />
          <Stepper.Item state="current" label="Select" meta="You are here" onSelect={() => {}} />
          <Stepper.Item state="upcoming" label="Implement" />
          <Stepper.Item state="upcoming" label="Assess" last />
        </Stepper>
      </Box>
    </Stack>
  ),
};
