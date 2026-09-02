import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { useState } from "react";

import {
  ActionBar,
  Block,
  Disclosure,
  Inspector,
  WorkPane,
  WorkPaneRow,
} from "@/components/app/shapes";
import {
  Badge,
  Button,
  EmptyState,
  IdCell,
  Mono,
  Person,
  TabStrip,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";
import type { Tone } from "@/components/app/ui";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Shapes/Shapes",
  component: WorkPane,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="max-w-[1100px] p-6">
        <Story />
      </div>
    ),
  ],
  args: { list: null, detail: null },
  argTypes: {
    list: { control: false },
    detail: { control: false },
    listLabel: { control: false },
    empty: { control: false },
  },
} satisfies Meta<typeof WorkPane>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

const labels: Record<Tone, string> = {
  neutral: "Not assessed",
  success: "Satisfied",
  warning: "Partially satisfied",
  danger: "Other than satisfied",
  info: "In assessment",
};

const controls: { id: string; title: string; meta: string; tone: Tone }[] = [
  { id: "AC-2", title: "Account management", meta: "Examine · 3d", tone: "success" },
  {
    id: "AC-2(1)",
    title: "Automated system account management",
    meta: "Test · 3d",
    tone: "success",
  },
  { id: "AC-2(3)", title: "Disable accounts", meta: "Test · 34d", tone: "warning" },
  { id: "AC-3", title: "Access enforcement", meta: "Examine · 12d", tone: "success" },
  {
    id: "AC-6(1)",
    title: "Authorize access to security functions",
    meta: "Test · 51d",
    tone: "danger",
  },
  { id: "AC-7", title: "Unsuccessful logon attempts", meta: "Test · 1d", tone: "info" },
  { id: "AC-11", title: "Device lock", meta: "Interview", tone: "neutral" },
  { id: "AC-17", title: "Remote access", meta: "Examine · 8d", tone: "success" },
];

const findings = [
  { id: "FND-2231", title: "Shared admin account on jump host", status: "Overdue", tone: "danger" },
  {
    id: "FND-2237",
    title: "Inactive accounts not disabled after 90 days",
    status: "Remediated",
    tone: "success",
  },
] as const;

function FindingsTable() {
  return (
    <Table>
      <thead>
        <tr>
          <Th className="w-[104px]">Finding</Th>
          <Th>Title</Th>
          <Th className="w-[128px]">Status</Th>
        </tr>
      </thead>
      <tbody>
        {findings.map((f) => (
          <Tr key={f.id}>
            <IdCell id={f.id} />
            <Td>{f.title}</Td>
            <Td>
              <Badge tone={f.tone}>{f.status}</Badge>
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

function WorkPaneDemo() {
  const [active, setActive] = useState("AC-2(3)");
  const current = controls.find((c) => c.id === active);
  return (
    <WorkPane
      listLabel={
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground/80">
            Access control
          </span>
          <span className="tnum text-[11px] text-muted-foreground">{controls.length}</span>
        </div>
      }
      list={
        <div className="space-y-px">
          {controls.map((c) => (
            <WorkPaneRow
              key={c.id}
              id={c.id}
              title={c.title}
              meta={c.meta}
              tone={c.tone}
              active={c.id === active}
              onSelect={() => setActive(c.id)}
            />
          ))}
        </div>
      }
      detail={
        current ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-baseline gap-2.5">
                <Mono className="text-muted-foreground">{current.id}</Mono>
                <h1 className="text-[17px] font-semibold leading-tight tracking-[-0.015em]">
                  {current.title}
                </h1>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge size="xs" tone={current.tone}>
                  {labels[current.tone]}
                </Badge>
                <span className="text-[12px] text-muted-foreground">{current.meta}</span>
              </div>
            </div>
            <Block
              title="Findings"
              count={findings.length}
              action={
                <Button size="xs">
                  <Plus className="size-3.5" />
                  New finding
                </Button>
              }
            >
              <FindingsTable />
            </Block>
          </div>
        ) : null
      }
      empty={<EmptyState title="Select a control" />}
    />
  );
}

/** Master–detail: eight rows, one active; the detail pane carries a Block. */
export const WorkPaneStory: Story = {
  name: "WorkPane",
  render: () => <WorkPaneDemo />,
};

const tabs = (
  <TabStrip
    items={[
      { key: "overview", label: "Overview", active: true, onSelect: noop },
      { key: "objectives", label: "Objectives", onSelect: noop },
      { key: "evidence", label: "Evidence", onSelect: noop },
      { key: "history", label: "History", onSelect: noop },
    ]}
  />
);

/** Identity, two states as Badges, one primary action and one blocked action carrying its reason. */
export const ActionBarStory: Story = {
  name: "ActionBar",
  render: () => (
    <div className="space-y-10">
      <div className="space-y-3">
        <Spec>primary allowed · secondary blocked (reason on hover)</Spec>
        <ActionBar
          breadcrumb="Programs / Northwind payroll / Controls"
          id="AC-2(3)"
          title="Disable accounts"
          context="NIST SP 800-53 r5 · Access control · Moderate baseline"
          states={[
            { label: "Assessment", value: "Partially satisfied", tone: "warning" },
            { label: "Evidence", value: "34d", tone: "warning" },
          ]}
          actions={[
            { label: "Mark satisfied", onSelect: noop, blocked: "2 findings still open" },
            { label: "Request evidence", onSelect: noop, primary: true },
          ]}
          tabs={tabs}
        />
      </div>
      <div className="space-y-3">
        <Spec>every action blocked · reason rendered inline</Spec>
        <ActionBar
          id="PKG-2026-114"
          title="Northwind payroll · Authorization package"
          context="Moderate · FedRAMP-aligned · 340 controls"
          states={[
            { label: "Lifecycle", value: "In assessment", tone: "info" },
            { label: "Findings", value: "7 open", tone: "danger" },
          ]}
          actions={[
            { label: "Submit", onSelect: noop, primary: true, blocked: "7 findings still open" },
          ]}
        />
      </div>
    </div>
  ),
};

/** Sticky facts beside scrolling content: two groups of label/value rows. */
export const InspectorStory: Story = {
  name: "Inspector",
  render: () => (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_272px]">
      <div className="space-y-3 text-[13px] leading-relaxed">
        <p>
          Accounts are reviewed weekly by the ISSO. Accounts inactive for 90 days are disabled
          automatically by the IdP; exceptions require a ticket approved by the system owner.
        </p>
        <p className="text-muted-foreground">
          The jump host has a local administrator account shared by the operations team. Access is
          not attributable to an individual and the account is not covered by the 90-day inactivity
          job.
        </p>
      </div>
      <Inspector
        groups={[
          {
            title: "Ownership",
            rows: [
              { label: "Owner", value: <Person name="D. Reyes" /> },
              { label: "Assessor", value: <Person name="K. Lund" /> },
              { label: "Package", value: <Mono>PKG-2026-114</Mono> },
            ],
          },
          {
            title: "Assessment",
            rows: [
              {
                label: "Status",
                value: (
                  <Badge size="xs" tone="warning">
                    Partially satisfied
                  </Badge>
                ),
              },
              { label: "Method", value: "Examine, Test" },
              { label: "Last assessed", value: <span className="tnum">2026-08-14</span> },
              { label: "Next due", value: <span className="tnum">2026-09-14</span> },
            ],
          },
        ]}
        footer={
          <Button variant="link" size="xs">
            Edit properties
          </Button>
        }
      />
    </div>
  ),
};

const objectives = [
  "the time period after which to disable accounts is defined",
  "accounts are disabled when they have expired",
  "accounts are disabled when they are no longer associated with a user",
  "accounts are disabled when they violate organizational policy",
];

/** Reference material closed and open, then a Block of work with a count and an action. */
export const DisclosureAndBlock: Story = {
  render: () => (
    <div className="max-w-[720px]">
      <Disclosure title="Control statement">
        <p className="text-[13px] leading-relaxed">
          Disable accounts within an organization-defined time period when the accounts have
          expired, are no longer associated with a user or individual, are in violation of
          organizational policy, or have been inactive for the defined period.
        </p>
      </Disclosure>
      <Disclosure title="Assessment objectives" count={objectives.length} defaultOpen>
        <ol className="space-y-1.5 text-[13px]">
          {objectives.map((o, i) => (
            <li key={o} className="flex items-baseline gap-2">
              <Mono className="text-muted-foreground">AC-2(3)[0{i + 1}]</Mono>
              <span>{o}</span>
            </li>
          ))}
        </ol>
      </Disclosure>
      <Block
        title="Findings"
        count={findings.length}
        action={
          <Button size="xs">
            <Plus className="size-3.5" />
            New finding
          </Button>
        }
      >
        <FindingsTable />
      </Block>
    </div>
  ),
};
