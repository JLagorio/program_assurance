import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Indicator, Tabs, type Tone } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { ActionBar, Block, Inspector, WorkPane } from "../../shapes";

const meta = {
  title: "Shapes/WorkPane",
  component: WorkPane,
  parameters: { layout: "padded" },
} satisfies Meta<typeof WorkPane>;
export default meta;
type Story = StoryObj;

const items: { id: string; title: string; meta: string; tone: Tone }[] = [
  { id: "CTRL-0412", title: "Segregation of duties, payables", meta: "Verified", tone: "success" },
  {
    id: "CTRL-0418",
    title: "Vendor master change approval",
    meta: "In review",
    tone: "information",
  },
  { id: "CTRL-0450", title: "Privileged access review", meta: "Overdue", tone: "danger" },
  { id: "CTRL-0451", title: "Firewall rule recertification", meta: "Due soon", tone: "warning" },
  { id: "CTRL-0472", title: "Backup restore test", meta: "Draft", tone: "neutral" },
];

function Pane() {
  const [active, setActive] = useState("CTRL-0418");
  const current = items.find((i) => i.id === active);
  return (
    <WorkPane
      listLabel={
        <Text size="xsmall" weight="medium" color="color.text.subtlest">
          5 controls
        </Text>
      }
      list={
        <Stack space="space.025">
          {items.map((i) => (
            <WorkPane.Row
              key={i.id}
              id={i.id}
              title={i.title}
              meta={i.meta}
              tone={i.tone}
              isActive={active === i.id}
              onSelect={() => setActive(i.id)}
            />
          ))}
        </Stack>
      }
      detail={
        current ? (
          <Stack space="space.300">
            <ActionBar
              id={current.id}
              title={current.title}
              context="Finance · Quarterly"
              states={[
                { label: "Status", value: current.meta, tone: current.tone },
                { label: "Severity", value: "High", tone: "danger" },
              ]}
              actions={[
                { label: "Request evidence", onSelect: () => undefined },
                {
                  label: "Mark verified",
                  onSelect: () => undefined,
                  primary: true,
                  blocked: current.tone === "success" ? "Already verified." : null,
                },
              ]}
              tabs={
                <Tabs label="Sections">
                  <Tabs.Tab isSelected>Work</Tabs.Tab>
                  <Tabs.Tab>Evidence</Tabs.Tab>
                  <Tabs.Tab>History</Tabs.Tab>
                </Tabs>
              }
            />
            <div className="grid gap-300 lg:grid-cols-main-rail">
              <Stack space="space.300">
                <Block
                  title="Open findings"
                  count={2}
                  action={<Button size="small">Add finding</Button>}
                >
                  <Stack space="space.100">
                    <Indicator tone="danger">Approver released a payment in July</Indicator>
                    <Indicator tone="warning">Vendor bank change without call-back</Indicator>
                  </Stack>
                </Block>
                <Block title="Evidence requests">
                  <Text color="color.text.subtle">None open.</Text>
                </Block>
              </Stack>
              <Inspector
                groups={[
                  {
                    title: "Ownership",
                    rows: [
                      { label: "Owner", value: "Dana Whitfield" },
                      { label: "Assessor", value: "Priya Natarajan" },
                    ],
                  },
                  {
                    title: "Schedule",
                    rows: [
                      { label: "Frequency", value: "Quarterly" },
                      { label: "Next due", value: "18 Sep 2026" },
                    ],
                  },
                ]}
                footer={
                  <Button variant="subtle" size="small">
                    Edit facts
                  </Button>
                }
              />
            </div>
          </Stack>
        ) : null
      }
      empty={<Text color="color.text.subtle">Choose a control.</Text>}
    />
  );
}

export const WorkPaneStory: Story = {
  name: "WorkPane with ActionBar, Blocks and Inspector",
  render: () => <Pane />,
};

const noop = () => {};

/** Every row tone, one active, and the empty detail. */
export const WorkPaneMatrix: Story = {
  render: () => (
    <Box style={{ height: 360 }}>
      <WorkPane
        listLabel={
          <Inline spread="space-between" alignBlock="center">
            <Text size="xsmall" color="color.text.subtlest">
              Access control
            </Text>
            <Text size="xsmall" color="color.text.subtlest">
              6
            </Text>
          </Inline>
        }
        list={
          <Stack space="space.0">
            <WorkPane.Row
              id="AC-2"
              title="Neutral"
              meta="Interview"
              tone="neutral"
              onSelect={noop}
            />
            <WorkPane.Row
              id="AC-3"
              title="Information"
              meta="Test · 1d"
              tone="information"
              onSelect={noop}
            />
            <WorkPane.Row
              id="AC-6"
              title="Success"
              meta="Examine · 3d"
              tone="success"
              onSelect={noop}
            />
            <WorkPane.Row
              id="AC-7"
              title="Warning · active"
              meta="Test · 34d"
              tone="warning"
              isActive
              onSelect={noop}
            />
            <WorkPane.Row
              id="AC-11"
              title="Danger"
              meta="Test · 51d"
              tone="danger"
              onSelect={noop}
            />
            <WorkPane.Row id="AC-17" title="Neutral again" meta="Examine · 8d" onSelect={noop} />
          </Stack>
        }
        detail={null}
        empty={
          <Text size="small" color="color.text.subtle">
            Select a control.
          </Text>
        }
      />
    </Box>
  ),
};
