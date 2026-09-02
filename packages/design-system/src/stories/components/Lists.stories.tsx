import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExternalLink, FileText, Folder } from "lucide-react";
import { useState } from "react";

import { Absent, Avatar, Badge, Breadcrumb, Count, Eyebrow, Fact, IconButton, Item, KeyValue, Prose, Stepper, Timeline, Tree } from "../../components";
import { Inline, Stack } from "../../primitives";

const meta = {
  title: "Components/Lists",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Items: Story = {
  render: () => (
    <Stack space="space.400" className="max-w-[640px]">
      <Breadcrumb>
        <Breadcrumb.Item asChild><a href="#programme">Programme</a></Breadcrumb.Item>
        <Breadcrumb.Item asChild><a href="#finance">Finance controls</a></Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => undefined}>Payables</Breadcrumb.Item>
        <Breadcrumb.Item isCurrent>CTRL-0412 Segregation of duties, payables</Breadcrumb.Item>
      </Breadcrumb>
      <Item.Group>
        <Item id="EV-2201" title="Bank reconciliation, July" meta="PDF · 2.1 MB" description="Uploaded by Dana Whitfield" trailing="12 Aug" link={<a href="#ev-2201" />} />
        <Item id="EV-2202" title="Approval matrix" meta="XLSX" trailing="9 Aug" onSelect={() => undefined} isActive actions={<IconButton label="Open" variant="subtle" size="small"><ExternalLink className="size-icon-small" /></IconButton>} />
        <Item leading={<Avatar name="Priya Natarajan" size="xsmall" />} title="Priya requested a walkthrough" description="Wants to see the payables run end to end before signing off." trailing="Yesterday">
          <Badge tone="information">Open request</Badge>
        </Item>
      </Item.Group>
      <Item.Group empty="No linked evidence yet." />
    </Stack>
  ),
};

export const Facts: Story = {
  render: () => (
    <Stack space="space.400" className="max-w-[420px]">
      <dl className="flex flex-wrap gap-300">
        <Fact label="Owner">Dana Whitfield</Fact>
        <Fact label="Frequency">Quarterly</Fact>
        <Fact label="Assessor"><Absent /></Fact>
      </dl>
      <dl>
        <KeyValue label="Control">CTRL-0412</KeyValue>
        <KeyValue label="Status"><Badge tone="success">Verified</Badge></KeyValue>
        <KeyValue label="Objective" wrap>Payables are approved and paid by different people, so no one person can create and settle a vendor invoice.</KeyValue>
        <KeyValue label="Last verified">12 Aug 2026</KeyValue>
      </dl>
      <Prose label="Rationale" tone="warning">The July run had one exception where the approver also released the payment. Compensating review in place.</Prose>
      <Eyebrow>Plain eyebrow</Eyebrow>
    </Stack>
  ),
};

export const TimelineStory: Story = {
  name: "Timeline",
  render: () => (
    <Timeline className="max-w-[480px]">
      <Timeline.Group label="This week" count={2}>
        <Timeline.Item tone="success" title="Verified by Priya Natarajan" meta="All 3 evidence items reviewed" time="2h ago" emphasis onSelect={() => undefined} />
        <Timeline.Item tone="information" title="Evidence linked" meta="Bank reconciliation, July" time="Yesterday" trailing={<Count value={1} appearance="primary" />} />
      </Timeline.Group>
      <Timeline.Group label="August">
        <Timeline.Item tone="warning" title="Due date moved" meta="14 Sep → 18 Sep" time="28 Aug" isActive onSelect={() => undefined}>
          Moved to line up with the quarter close.
        </Timeline.Item>
        <Timeline.Item marker={<Avatar name="Dana Whitfield" size="xsmall" />} title="Dana Whitfield took ownership" time="20 Aug" />
        <Timeline.Item title="Control created" time="3 Aug" />
      </Timeline.Group>
    </Timeline>
  ),
};

export const Steppers: Story = {
  render: () => (
    <Stack space="space.600">
      <Stepper>
        <Stepper.Item state="done" label="Categorise" meta="Done 3 Aug" first onSelect={() => undefined} />
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

function TreeDemo() {
  const [open, setOpen] = useState<Record<string, boolean>>({ finance: true, payables: true });
  const [sel, setSel] = useState("ctrl-0412");
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <Tree label="Control families" className="max-w-[420px]">
      <Tree.Item depth={0} hasChildren expanded={open["finance"]} onToggle={() => toggle("finance")} isSelected={sel === "finance"} onSelect={() => setSel("finance")} trailing={<Count value={12} />}>
        <Folder className="size-icon-small icon-subtle" /> Finance
      </Tree.Item>
      {open["finance"] ? (
        <>
          <Tree.Item depth={1} hasChildren expanded={open["payables"]} onToggle={() => toggle("payables")} isSelected={sel === "payables"} onSelect={() => setSel("payables")}>
            <Folder className="size-icon-small icon-subtle" /> Payables
          </Tree.Item>
          {open["payables"] ? (
            <>
              <Tree.Item depth={2} isSelected={sel === "ctrl-0412"} onSelect={() => setSel("ctrl-0412")} trailing={<Badge tone="success" size="xsmall">Verified</Badge>}>
                <FileText className="size-icon-small icon-subtle" /> CTRL-0412 Segregation of duties
              </Tree.Item>
              <Tree.Item depth={2} lines={[true, false]} isSelected={sel === "ctrl-0418"} onSelect={() => setSel("ctrl-0418")}>
                <FileText className="size-icon-small icon-subtle" /> CTRL-0418 Vendor master change
              </Tree.Item>
            </>
          ) : null}
          <Tree.Item depth={1} lines={[false]} hasChildren isSelected={sel === "receivables"} onSelect={() => setSel("receivables")}>
            <Folder className="size-icon-small icon-subtle" /> Receivables
          </Tree.Item>
        </>
      ) : null}
      <Tree.Item depth={0} hasChildren isSelected={sel === "security"} onSelect={() => setSel("security")} trailing={<Count value={9} />}>
        <Folder className="size-icon-small icon-subtle" /> Security
      </Tree.Item>
    </Tree>
  );
}

export const TreeStory: Story = { name: "Tree", render: () => <TreeDemo /> };

export const Inlines: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="center">
      <Avatar name="Dana Whitfield" />
      <Avatar name="Priya Natarajan" size="xsmall" />
      <Avatar.Stack names={["Dana Whitfield", "Priya Natarajan", "Marcus Oyelaran", "Lee Anand", "Sam Reyes", "Noor Haddad"]} />
    </Inline>
  ),
};
