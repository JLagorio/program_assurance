import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Badge, Button, Indicator, KeyValue, Tabs, type Tone } from "../../components";
import { ActionBar, Block, Inspector, WorkPane } from "../../shapes";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/Shapes",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const items: { id: string; title: string; meta: string; tone: Tone }[] = [
  { id: "CTRL-0412", title: "Segregation of duties, payables", meta: "Verified", tone: "success" },
  { id: "CTRL-0418", title: "Vendor master change approval", meta: "In review", tone: "information" },
  { id: "CTRL-0450", title: "Privileged access review", meta: "Overdue", tone: "danger" },
  { id: "CTRL-0451", title: "Firewall rule recertification", meta: "Due soon", tone: "warning" },
  { id: "CTRL-0472", title: "Backup restore test", meta: "Draft", tone: "neutral" },
];

function Pane() {
  const [active, setActive] = useState("CTRL-0418");
  const current = items.find((i) => i.id === active);
  return (
    <WorkPane
      listLabel={<Text size="xsmall" weight="medium" color="color.text.subtlest">5 controls</Text>}
      list={
        <Stack space="space.025">
          {items.map((i) => (
            <WorkPane.Row key={i.id} id={i.id} title={i.title} meta={i.meta} tone={i.tone} isActive={active === i.id} onSelect={() => setActive(i.id)} />
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
                { label: "Mark verified", onSelect: () => undefined, primary: true, blocked: current.tone === "success" ? "Already verified." : null },
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
                <Block title="Open findings" count={2} action={<Button size="small">Add finding</Button>}>
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
                  { title: "Ownership", rows: [{ label: "Owner", value: "Dana Whitfield" }, { label: "Assessor", value: "Priya Natarajan" }] },
                  { title: "Schedule", rows: [{ label: "Frequency", value: "Quarterly" }, { label: "Next due", value: "18 Sep 2026" }] },
                ]}
                footer={<Button variant="subtle" size="small">Edit facts</Button>}
              />
            </div>
          </Stack>
        ) : null
      }
      empty={<Text color="color.text.subtle">Choose a control.</Text>}
    />
  );
}

export const WorkPaneStory: Story = { name: "WorkPane with ActionBar, Blocks and Inspector", render: () => <Pane /> };

export const InspectorGroups: Story = {
  render: () => (
    <div className="max-w-[300px]">
      <Inspector.Group title="Ownership" action={<Button variant="link" size="xsmall">Edit</Button>}>
        <KeyValue label="Owner">Dana Whitfield</KeyValue>
        <KeyValue label="Assessor">Priya Natarajan</KeyValue>
      </Inspector.Group>
      <Inspector.Group title="Status">
        <KeyValue label="Current"><Badge tone="information">In review</Badge></KeyValue>
      </Inspector.Group>
    </div>
  ),
};
