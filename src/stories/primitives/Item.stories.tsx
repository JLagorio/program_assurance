import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontal } from "lucide-react";

import { Badge, Dot, IconButton, Item, Person, type Tone } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Item",
  component: Item,
  tags: ["autodocs"],
  args: {
    id: "M-3",
    title: "Rotate shared credentials on the jump host",
    meta: "In progress",
    trailing: "2026-09-14",
  },
  argTypes: {
    id: { control: "text" },
    idWidth: { control: "number" },
    title: { control: "text" },
    description: { control: "text" },
    meta: { control: "text" },
    trailing: { control: "text" },
    active: { control: "boolean" },
    leading: { control: false },
    actions: { control: false },
    to: { control: false },
    params: { control: false },
    onSelect: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[640px]">
      <Item.Group>
        <Item {...args} leading={<Dot tone="info" />} />
      </Item.Group>
    </div>
  ),
};

const milestones: { id: string; title: string; status: string; tone: Tone; date: string }[] = [
  {
    id: "M-1",
    title: "Inventory local accounts",
    status: "Completed",
    tone: "success",
    date: "2026-08-20",
  },
  {
    id: "M-2",
    title: "Disable the shared admin account",
    status: "Completed",
    tone: "success",
    date: "2026-08-27",
  },
  {
    id: "M-3",
    title: "Rotate shared credentials on the jump host",
    status: "In progress",
    tone: "info",
    date: "2026-09-14",
  },
  {
    id: "M-4",
    title: "Enrol the jump host in the 90-day inactivity job",
    status: "Planned",
    tone: "neutral",
    date: "2026-09-30",
  },
];

const notes = [
  {
    program: "PRG-1041",
    note: "Tactical edge scope stays at A=Low; the CP family is covered by the ground segment.",
    by: "K. Lund",
    at: "2026-08-31",
  },
  {
    program: "PRG-1044",
    note: "Overlay CNSSI privacy applied; PT family enters the baseline.",
    by: "D. Reyes",
    at: "2026-08-29",
  },
];

/** Milestones: Dot lead, an id column, title, status inline, date on the right. Static rows. */
export const Milestones: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[640px] space-y-2">
      <Spec>Item.Group · leading + id (idWidth 40) + title + meta + trailing</Spec>
      <Item.Group>
        {milestones.map((m) => (
          <Item
            key={m.id}
            leading={<Dot tone={m.tone} />}
            id={m.id}
            idWidth={40}
            title={m.title}
            meta={m.status}
            trailing={m.date}
          />
        ))}
      </Item.Group>
    </div>
  ),
};

/** Decision notes: a description line under the title, a Person as the trailing value, row actions. */
export const WithDescription: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[640px]">
      <Item.Group>
        {notes.map((n) => (
          <Item
            key={n.program}
            id={n.program}
            title={n.note}
            description={`Decided ${n.at}`}
            trailing={<Person name={n.by} />}
            actions={
              <IconButton aria-label="More">
                <MoreHorizontal className="size-3.5" />
              </IconButton>
            }
          />
        ))}
      </Item.Group>
    </div>
  ),
};

/** Rows that go somewhere: `to` renders a link, `onSelect` a button; one is active. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[640px]">
      <Item.Group>
        <Item
          to="/risks/$riskId"
          params={{ riskId: "RSK-0112" }}
          id="RSK-0112"
          title="Unattributed privileged access on the jump host"
          meta="Open"
          trailing={
            <Badge tone="danger" size="xs">
              High
            </Badge>
          }
        />
        <Item
          onSelect={() => {}}
          active
          id="RSK-0098"
          title="Backup encryption keys stored with backups"
          meta="Risk accepted"
          trailing={
            <Badge tone="warning" size="xs">
              Moderate
            </Badge>
          }
        />
        <Item
          onSelect={() => {}}
          id="RSK-0077"
          title="Audit records retained 30 days; policy requires 90"
          meta="Open"
          trailing={
            <Badge tone="neutral" size="xs">
              Low
            </Badge>
          }
        />
      </Item.Group>
    </div>
  ),
};

/** Nothing to list: the group renders its `empty` line instead of an empty frame. */
export const NoRows: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[640px]">
      <Item.Group empty="No milestones recorded." />
    </div>
  ),
};
