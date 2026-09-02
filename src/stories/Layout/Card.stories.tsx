import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Plus } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardHeader,
  Dot,
  Fact,
  KeyValue,
  PageHeader,
  Person,
  RecordHeader,
  RelatedCard,
  RelatedRow,
  Section,
  Id,
} from "@/components/app/ui";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Layout/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: { className: { control: false }, children: { control: false } },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const coverage = [
  { label: "Satisfied", value: 212, tone: "success" },
  { label: "Partially satisfied", value: 64, tone: "warning" },
  { label: "Other than satisfied", value: 23, tone: "danger" },
  { label: "Not assessed", value: 41, tone: "neutral" },
] as const;

function CoverageList() {
  return (
    <ul className="space-y-1.5 text-[13px]">
      {coverage.map((c) => (
        <li key={c.label} className="flex items-center gap-1.5">
          <Dot tone={c.tone} />
          <span className="text-muted-foreground">{c.label}</span>
          <span className="tnum ml-auto font-medium">{c.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Bare Card, Card with a CardHeader, and CardHeader carrying an action. */
export const Cards: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-[960px] gap-6 md:grid-cols-3">
      <div className="space-y-2">
        <Spec>Card</Spec>
        <Card className="p-4">
          <CoverageList />
        </Card>
      </div>
      <div className="space-y-2">
        <Spec>Card + CardHeader</Spec>
        <Card>
          <CardHeader title="Assessment coverage" description="340 controls in scope" />
          <div className="p-4">
            <CoverageList />
          </div>
        </Card>
      </div>
      <div className="space-y-2">
        <Spec>Card + CardHeader with action</Spec>
        <Card>
          <CardHeader
            title="Assessment coverage"
            description="340 controls in scope"
            action={
              <Button size="sm">
                <Download className="size-3.5" />
                Export
              </Button>
            }
          />
          <div className="p-4">
            <CoverageList />
          </div>
        </Card>
      </div>
    </div>
  ),
};

const objectives = [
  "AC-2(3)[01] the time period after which to disable accounts is defined",
  "AC-2(3)[02] accounts are disabled when they have expired",
  "AC-2(3)[03] accounts are disabled when they are no longer associated with a user",
  "AC-2(3)[04] accounts are disabled when they violate organizational policy",
];

/** Borderless page regions: a rule and a label, optionally with an action on the rule. */
export const Sections: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[720px] space-y-8">
      <Section title="Implementation statement">
        <p className="pt-3 text-[13px] leading-relaxed">
          Accounts are reviewed weekly by the ISSO. Accounts inactive for 90 days are disabled
          automatically by the IdP; exceptions require a ticket approved by the system owner.
        </p>
      </Section>
      <Section
        title="Assessment objectives"
        action={
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        }
      >
        <ul className="divide-y divide-border-subtle pt-1">
          {objectives.map((o) => (
            <li key={o} className="py-2 text-[13px]">
              {o}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  ),
};

/** The record-rail property list: Mono, Badge and Person values in a 104px-labelled dl. */
export const KeyValues: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card className="max-w-[400px] px-4 py-2">
      <dl>
        <KeyValue label="Control">
          <Id>AC-2(3)</Id>
        </KeyValue>
        <KeyValue label="Status">
          <Badge tone="warning" size="xs">
            Partially satisfied
          </Badge>
        </KeyValue>
        <KeyValue label="Owner">
          <Person name="D. Reyes" />
        </KeyValue>
        <KeyValue label="Package">
          <Id>PKG-2026-114</Id>
        </KeyValue>
        <KeyValue label="Last assessed">
          <span className="tnum">2026-08-14</span>
        </KeyValue>
        <KeyValue label="Method">Examine, Test</KeyValue>
      </dl>
    </Card>
  ),
};

const related = [
  { id: "FND-2231", title: "Shared admin account on jump host", tone: "danger", age: "3d" },
  {
    id: "FND-2237",
    title: "Inactive accounts not disabled after 90 days",
    tone: "warning",
    age: "12d",
  },
  { id: "FND-2240", title: "Service account without owner", tone: "neutral", age: "41d" },
] as const;

/** RelatedCard with three rows (one clickable) beside an empty one. */
export const Related: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-[800px] gap-6 md:grid-cols-2">
      <RelatedCard
        title="Findings"
        count={3}
        action={
          <Button variant="link" size="xs">
            View all
          </Button>
        }
      >
        {related.map((r, i) =>
          i === 0 ? (
            <RelatedRow
              key={r.id}
              lead={<Dot tone={r.tone} />}
              label={r.title}
              meta={<Id className="text-muted-foreground">{r.id}</Id>}
              trailing={r.age}
              onClick={() => {}}
            />
          ) : (
            <RelatedRow
              key={r.id}
              lead={<Dot tone={r.tone} />}
              label={r.title}
              meta={<Id className="text-muted-foreground">{r.id}</Id>}
              trailing={r.age}
            />
          ),
        )}
      </RelatedCard>
      <RelatedCard
        title="Evidence"
        count={0}
        empty="No evidence linked"
        action={
          <Button variant="link" size="xs">
            Link evidence
          </Button>
        }
      />
    </div>
  ),
};

/** PageHeader on an index page; RecordHeader on a record page with a facts strip below. */
export const Headers: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[880px] space-y-12">
      <div className="space-y-3">
        <Spec>PageHeader · eyebrow, description, actions</Spec>
        <PageHeader
          eyebrow="PRG-1041 · Northwind payroll"
          title="Findings & assets"
          description="Open findings across the authorization boundary, grouped by the control they fail."
          actions={
            <>
              <Button variant="ghost">
                <Download className="size-4" />
                Export
              </Button>
              <Button variant="primary">
                <Plus className="size-4" />
                New finding
              </Button>
            </>
          }
        />
      </div>

      <div className="space-y-3">
        <Spec>RecordHeader · meta, actions, below strip</Spec>
        <RecordHeader
          backTo="/controls"
          id="AC-2(3)"
          title="Disable accounts"
          meta="NIST SP 800-53 r5 · Access control · Moderate baseline"
          actions={
            <>
              <Button>Request evidence</Button>
              <Button variant="primary">Assess</Button>
            </>
          }
          below={
            <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5 border-t border-border pt-2.5">
              <Fact label="Status">
                <Badge size="xs" tone="warning">
                  Partially satisfied
                </Badge>
              </Fact>
              <Fact label="Owner">
                <Person name="D. Reyes" />
              </Fact>
              <Fact label="Package">
                <Id>PKG-2026-114</Id>
              </Fact>
              <Fact label="Next assessment">
                <span className="tnum">2026-09-14</span>
              </Fact>
            </dl>
          }
        />
      </div>
    </div>
  ),
};
