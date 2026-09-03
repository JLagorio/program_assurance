import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExternalLink, FileText, Folder, MoreHorizontal } from "lucide-react";
import { useState } from "react";

import {
  Absent,
  Avatar,
  Badge,
  Breadcrumb,
  Count,
  Eyebrow,
  Fact,
  IconButton,
  Item,
  KeyValue,
  Prose,
  Stepper,
  TextLink,
  Timeline,
  Tree,
  Id,
  Person,
  tones,
} from "../../components";
import { Inline, Stack, Text, Box } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";

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
        <Breadcrumb.Item asChild>
          <a href="#programme">Programme</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item asChild>
          <a href="#finance">Finance controls</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => undefined}>Payables</Breadcrumb.Item>
        <Breadcrumb.Item isCurrent>CTRL-0412 Segregation of duties, payables</Breadcrumb.Item>
      </Breadcrumb>
      <Item.Group>
        <Item
          id="EV-2201"
          title="Bank reconciliation, July"
          meta="PDF · 2.1 MB"
          description="Uploaded by Dana Whitfield"
          trailing="12 Aug"
          link={<a href="#ev-2201" />}
        />
        <Item
          id="EV-2202"
          title="Approval matrix"
          meta="XLSX"
          trailing="9 Aug"
          onSelect={() => undefined}
          isActive
          actions={
            <IconButton label="Open" variant="subtle" size="small">
              <ExternalLink className="size-icon-small" />
            </IconButton>
          }
        />
        <Item
          leading={<Avatar name="Priya Natarajan" size="xsmall" />}
          title="Priya requested a walkthrough"
          description="Wants to see the payables run end to end before signing off."
          trailing="Yesterday"
        >
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
      <Fact.Group>
        <Fact label="Owner">Dana Whitfield</Fact>
        <Fact label="Frequency">Quarterly</Fact>
        <Fact label="Assessor">
          <Absent />
        </Fact>
      </Fact.Group>
      <dl>
        <KeyValue label="Control">CTRL-0412</KeyValue>
        <KeyValue label="Status">
          <Badge tone="success">Verified</Badge>
        </KeyValue>
        <KeyValue label="Objective" wrap>
          Payables are approved and paid by different people, so no one person can create and settle
          a vendor invoice.
        </KeyValue>
        <KeyValue label="Last verified">12 Aug 2026</KeyValue>
      </dl>
      <Prose label="Rationale" tone="warning">
        The July run had one exception where the approver also released the payment. Compensating
        review in place.
      </Prose>
      <Eyebrow>Plain eyebrow</Eyebrow>
    </Stack>
  ),
};

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

function TreeDemo() {
  const [open, setOpen] = useState<Record<string, boolean>>({ finance: true, payables: true });
  const [sel, setSel] = useState("ctrl-0412");
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <Tree label="Control families" className="max-w-[420px]">
      <Tree.Item
        depth={0}
        hasChildren
        expanded={open["finance"]}
        onToggle={() => toggle("finance")}
        isSelected={sel === "finance"}
        onSelect={() => setSel("finance")}
        trailing={<Count value={12} />}
      >
        <Folder className="size-icon-small icon-subtle" /> Finance
      </Tree.Item>
      {open["finance"] ? (
        <>
          <Tree.Item
            depth={1}
            hasChildren
            expanded={open["payables"]}
            onToggle={() => toggle("payables")}
            isSelected={sel === "payables"}
            onSelect={() => setSel("payables")}
          >
            <Folder className="size-icon-small icon-subtle" /> Payables
          </Tree.Item>
          {open["payables"] ? (
            <>
              <Tree.Item
                depth={2}
                isSelected={sel === "ctrl-0412"}
                onSelect={() => setSel("ctrl-0412")}
                trailing={
                  <Badge tone="success" size="xsmall">
                    Verified
                  </Badge>
                }
              >
                <FileText className="size-icon-small icon-subtle" /> CTRL-0412 Segregation of duties
              </Tree.Item>
              <Tree.Item
                depth={2}
                lines={[true, false]}
                isSelected={sel === "ctrl-0418"}
                onSelect={() => setSel("ctrl-0418")}
              >
                <FileText className="size-icon-small icon-subtle" /> CTRL-0418 Vendor master change
              </Tree.Item>
            </>
          ) : null}
          <Tree.Item
            depth={1}
            lines={[false]}
            hasChildren
            isSelected={sel === "receivables"}
            onSelect={() => setSel("receivables")}
          >
            <Folder className="size-icon-small icon-subtle" /> Receivables
          </Tree.Item>
        </>
      ) : null}
      <Tree.Item
        depth={0}
        hasChildren
        isSelected={sel === "security"}
        onSelect={() => setSel("security")}
        trailing={<Count value={9} />}
      >
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
      <Avatar.Stack
        names={[
          "Dana Whitfield",
          "Priya Natarajan",
          "Marcus Oyelaran",
          "Lee Anand",
          "Sam Reyes",
          "Noor Haddad",
        ]}
      />
    </Inline>
  ),
};

/** Both sizes, a Person, and a stack that overflows. */
export const AvatarMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={["xsmall", "small"] as const}
        cols={["one word", "two words", "initials of three"] as const}
        rowLabel="size"
        render={(size, col) => (
          <Avatar
            name={
              col === "one word"
                ? "Dana"
                : col === "two words"
                  ? "Dana Whitlock"
                  : "Dana W. Whitlock"
            }
            size={size}
          />
        )}
      />
      <Specimens title="Person and Stack">
        <Person name="Dana Whitlock" />
        <Avatar.Stack names={["Dana Whitlock", "Grace Hoppel", "Linus Aarto"]} />
        <Avatar.Stack
          names={[
            "Dana Whitlock",
            "Grace Hoppel",
            "Linus Aarto",
            "Marcus Ryde",
            "Priya Raghavan",
            "Sarah Chen",
          ]}
          max={4}
        />
      </Specimens>
    </Stack>
  ),
};

/** Short, long enough to wrap, a lone current page, and a link child. */
export const BreadcrumbMatrix: Story = {
  render: () => (
    <Stack space="space.200">
      <Breadcrumb>
        <Breadcrumb.Item>Programs</Breadcrumb.Item>
        <Breadcrumb.Item isCurrent>Atlas payments platform</Breadcrumb.Item>
      </Breadcrumb>
      <Box style={{ width: 360 }}>
        <Breadcrumb>
          <Breadcrumb.Item>Programs</Breadcrumb.Item>
          <Breadcrumb.Item>Atlas payments platform</Breadcrumb.Item>
          <Breadcrumb.Item>Controls</Breadcrumb.Item>
          <Breadcrumb.Item>Access control</Breadcrumb.Item>
          <Breadcrumb.Item isCurrent>
            AC-2(3) Disable accounts after a period of inactivity
          </Breadcrumb.Item>
        </Breadcrumb>
      </Box>
      <Breadcrumb>
        <Breadcrumb.Item isCurrent>Only the page</Breadcrumb.Item>
      </Breadcrumb>
      <Breadcrumb>
        <Breadcrumb.Item asChild>
          <a href="#programs">A link child</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item isCurrent>Here</Breadcrumb.Item>
      </Breadcrumb>
    </Stack>
  ),
};

/** An Id in text, in a link, and the list with many and with none. */
export const IdMatrix: Story = {
  render: () => (
    <Stack space="space.200">
      <Text>
        Finding <Id>FND-2231</Id> rolls up to <Id>RSK-0021</Id>.
      </Text>
      <Text>
        Inside a link it is blue because the link is:{" "}
        <TextLink>
          <a href="#f">
            <Id>FND-2231</Id>
          </a>
        </TextLink>
        .
      </Text>
      <Id.List ids={["AC-2", "AC-2(1)", "AC-2(3)", "AC-3", "AC-6(1)", "AC-7", "AC-11", "AC-17"]} />
      <Id.List ids={[]} />
      <Id.List ids={[]} empty="No controls" />
    </Stack>
  ),
};

/** Every slot and every state of a row, then a group with nothing in it. */
export const ItemMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-layout-measure">
      <Item.Group>
        <Item title="Title only" />
        <Item id="MS-C" title="With an id" />
        <Item id="MS-C" idWidth={120} title="Wider id column" meta="Sep 04" />
        <Item
          leading={
            <Badge tone="success" size="xsmall">
              Done
            </Badge>
          }
          title="Leading badge"
          description="A description under the title."
        />
        <Item id="RMF-6" title="Meta and trailing" meta="Whitcombe LLP" trailing="Sep 18, 2026" />
        <Item
          title="With actions"
          actions={
            <IconButton label="More" variant="subtle" size="small">
              <MoreHorizontal className="size-icon-small" />
            </IconButton>
          }
        />
        <Item
          title="Selectable"
          description="onSelect makes the row a button."
          onSelect={() => {}}
        />
        <Item title="Active" onSelect={() => {}} isActive />
        <Item
          title="A link row"
          link={<a href="#row" />}
          trailing={<ExternalLink className="size-icon-small icon-subtlest" />}
        />
        <Item title="Expanded" onSelect={() => {}}>
          <Text size="small" color="color.text.subtle">
            Children render under the row, outside its button.
          </Text>
        </Item>
      </Item.Group>
      <Item.Group empty="No milestones recorded." />
    </Stack>
  ),
};

/** Label widths, a wrapping value, and an absent one. */
export const KeyValueMatrix: Story = {
  render: () => (
    <Stack space="space.100" className="w-layout-list">
      <KeyValue label="Owner">Dana Whitlock</KeyValue>
      <KeyValue label="Owner" labelWidth={160}>
        Wider label column
      </KeyValue>
      <KeyValue label="Statement" wrap>
        Accounts inactive for 90 days are disabled automatically by the identity provider;
        exceptions need a ticket approved by the system owner.
      </KeyValue>
      <KeyValue label="Assessor">
        <Absent />
      </KeyValue>
      <KeyValue label="Status">
        <Badge tone="warning">Partially satisfied</Badge>
      </KeyValue>
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

/** Depth, guide lines, expanded and collapsed parents, a leaf, a selected row and a trailing slot. */
export const TreeMatrix: Story = {
  render: () => (
    <Box className="w-layout-list">
      <Tree label="Composition">
        <Tree.Item depth={0} hasChildren expanded>
          Atlas payments platform
        </Tree.Item>
        <Tree.Item depth={1} lines={[true]} hasChildren expanded>
          Payments API
        </Tree.Item>
        <Tree.Item
          depth={2}
          lines={[true, true]}
          isSelected
          trailing={
            <Badge tone="warning" size="xsmall">
              Partial
            </Badge>
          }
        >
          mission-api:2.1.4
        </Tree.Item>
        <Tree.Item depth={2} lines={[true, false]}>
          keycloak-idp
        </Tree.Item>
        <Tree.Item depth={1} lines={[false]} hasChildren>
          Ground segment (collapsed)
        </Tree.Item>
        <Tree.Item depth={1} lines={[false]}>
          A leaf at depth one
        </Tree.Item>
      </Tree>
    </Box>
  ),
};

/** Eyebrow in every tone; Absent; Prose in every tone; Fact. */
export const TypographyMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Eyebrow">
        {tones.map((t) => (
          <Eyebrow key={t} tone={t}>
            {t}
          </Eyebrow>
        ))}
      </Specimens>
      <Specimens title="Absent">
        <Text>
          Assessor: <Absent />
        </Text>
      </Specimens>
      <Stack space="space.200" className="max-w-layout-measure">
        {tones.map((t) => (
          <Prose key={t} label={`${t} prose`} tone={t}>
            The condition, stated against CCI-001453. Management traffic on the tactical edge
            segment is not cryptographically protected.
          </Prose>
        ))}
      </Stack>
      <Fact.Group>
        <Fact label="Controls">340</Fact>
        <Fact label="Satisfied">298</Fact>
        <Fact label="Open findings">5</Fact>
        <Fact label="Owner">Dana Whitfield</Fact>
        <Fact label="Frequency">Quarterly</Fact>
        <Fact label="Assessor">
          <Absent />
        </Fact>
      </Fact.Group>
    </Stack>
  ),
};
