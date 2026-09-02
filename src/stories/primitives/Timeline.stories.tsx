import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, Timeline, type Tone } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Timeline",
  component: Timeline,
  tags: ["autodocs"],
  args: { children: null },
  argTypes: { children: { control: false }, className: { control: false } },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

const events: { title: string; actor: string; time: string; tone: Tone }[] = [
  {
    title: "Risk accepted by the authorizing official",
    actor: "K. Lund",
    time: "2h",
    tone: "success",
  },
  {
    title: "Determination recorded: other than satisfied",
    actor: "M. Okafor",
    time: "1d",
    tone: "danger",
  },
  { title: "Evidence EV-0418 linked", actor: "D. Reyes", time: "3d", tone: "info" },
  { title: "Narrative updated", actor: "D. Reyes", time: "3d", tone: "neutral" },
  { title: "Assigned to D. Reyes", actor: "S. Chen", time: "8d", tone: "neutral" },
];

/** Ring-and-dot markers, title, actor beneath, relative time on the right. Static. */
export const History: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[560px] space-y-2">
      <Spec>default marker · tone Dot in a ring</Spec>
      <Timeline>
        {events.map((e) => (
          <Timeline.Item key={e.title} tone={e.tone} title={e.title} meta={e.actor} time={e.time} />
        ))}
      </Timeline>
    </div>
  ),
};

/** Activity feed: Avatar markers, sticky day groups with counts, unread rows emphasised, each row a button. */
export const Activity: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[560px]">
      <Timeline>
        <Timeline.Group label="Today" count={2}>
          {events.slice(0, 2).map((e, i) => (
            <Timeline.Item
              key={e.title}
              marker={<Avatar name={e.actor} size="sm" />}
              title={e.title}
              meta={`${e.actor} · Control`}
              time={e.time}
              emphasis={i === 0}
              onSelect={() => {}}
            />
          ))}
        </Timeline.Group>
        <Timeline.Group label="This week" count={3}>
          {events.slice(2).map((e) => (
            <Timeline.Item
              key={e.title}
              marker={<Avatar name={e.actor} size="sm" />}
              title={e.title}
              meta={`${e.actor} · Control`}
              time={e.time}
              onSelect={() => {}}
            />
          ))}
        </Timeline.Group>
      </Timeline>
    </div>
  ),
};

/** Audit trail with a body under each event. */
export const WithBody: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[560px]">
      <Timeline>
        <Timeline.Item
          tone="danger"
          title="Status changed"
          meta="M. Okafor · Assessor"
          time="2026-08-30 14:12"
        >
          Ready for assessment → Other than satisfied. Two objectives have no procedure written.
        </Timeline.Item>
        <Timeline.Item
          tone="info"
          title="Evidence linked"
          meta="D. Reyes · Engineer"
          time="2026-08-27 09:40"
        >
          EV-0418 Weekly account review export.
        </Timeline.Item>
        <Timeline.Item
          tone="neutral"
          title="Created"
          meta="S. Chen · ISSO"
          time="2026-08-14 11:03"
        />
      </Timeline>
    </div>
  ),
};
