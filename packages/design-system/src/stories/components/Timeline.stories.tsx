import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, Badge, Count, Timeline, tones } from "../../components";
import { Box, Text } from "../../primitives";

const meta = {
  title: "Components/Timeline",
  component: Timeline,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Timeline>;
export default meta;
type Story = StoryObj;

export const TimelineStory: Story = {
  name: "Timeline",
  render: () => (
    <Timeline className="max-w-[480px]">
      <Timeline.Group label="This week" count={2}>
        <Timeline.Item
          tone="success"
          title="Verified by Priya Natarajan"
          meta="All 3 evidence items reviewed"
          time="2h ago"
          emphasis
          onSelect={() => undefined}
        />
        <Timeline.Item
          tone="information"
          title="Evidence linked"
          meta="Bank reconciliation, July"
          time="Yesterday"
          trailing={<Count value={1} appearance="primary" />}
        />
      </Timeline.Group>
      <Timeline.Group label="August">
        <Timeline.Item
          tone="warning"
          title="Due date moved"
          meta="14 Sep → 18 Sep"
          time="28 Aug"
          isActive
          onSelect={() => undefined}
        >
          Moved to line up with the quarter close.
        </Timeline.Item>
        <Timeline.Item
          marker={<Avatar name="Dana Whitfield" size="xsmall" />}
          title="Dana Whitfield took ownership"
          time="20 Aug"
        />
        <Timeline.Item title="Control created" time="3 Aug" />
      </Timeline.Group>
    </Timeline>
  ),
};

/** Every tone as a marker, the active and emphasised rows, a custom marker, a trailing slot, and a group. */
export const TimelineMatrix: Story = {
  render: () => (
    <Box className="max-w-layout-measure">
      <Timeline>
        <Timeline.Group label="Tones" count={5}>
          {tones.map((tone) => (
            <Timeline.Item
              key={tone}
              tone={tone}
              title={`A ${tone} event`}
              meta="Dana Whitlock"
              time="2h ago"
              timeTitle="2026-09-02 14:10"
            />
          ))}
        </Timeline.Group>
        <Timeline.Group label="States">
          <Timeline.Item title="Selectable" meta="onSelect makes it a button" onSelect={() => {}} />
          <Timeline.Item title="Active" onSelect={() => {}} isActive />
          <Timeline.Item title="Emphasised (unread)" emphasis />
          <Timeline.Item
            title="Custom marker"
            marker={<Avatar name="Dana Whitlock" size="xsmall" />}
          />
          <Timeline.Item
            title="Trailing slot"
            trailing={
              <Badge tone="danger" size="xsmall">
                CAT I
              </Badge>
            }
          />
          <Timeline.Item title="With children">
            <Text size="small" color="color.text.subtle">
              Detail under the row.
            </Text>
          </Timeline.Item>
        </Timeline.Group>
      </Timeline>
    </Box>
  ),
};
