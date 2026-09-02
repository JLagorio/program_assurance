import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Avatar, Badge, Button, FilterChip, KeyValue, Tabs } from "../../components";
import { Card, Empty, IndexPage, PageHeader, PageSkeleton, PreviewRail, RecordHeader, Related, Section, ShowPage } from "../../patterns";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/Pages",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Index: Story = {
  render: () => (
    <IndexPage
      header={<PageHeader eyebrow="Finance" title="Controls" description="Every control in scope for the FY26 programme, with its owner and status." actions={<Button variant="primary"><Plus className="size-icon-small" />New control</Button>} />}
      filters={
        <>
          <FilterChip label="Owner" value="Dana Whitfield" isActive />
          <FilterChip label="Status" />
          <FilterChip label="Family" />
        </>
      }
    >
      <Empty title="No controls match" description="Clear a filter or widen the date range." action={<Button size="small">Clear filters</Button>} />
    </IndexPage>
  ),
};

function Show() {
  const [tab, setTab] = useState("overview");
  return (
    <ShowPage
      header={
        <RecordHeader
          back={<a href="#controls" />}
          breadcrumb={<Text size="small" color="color.text.subtle">Finance controls / Payables</Text>}
          id="CTRL-0412"
          meta="Updated 2h ago by Priya Natarajan"
          title="Segregation of duties, payables"
          actions={
            <>
              <Button>Request evidence</Button>
              <Button variant="primary">Mark verified</Button>
            </>
          }
        />
      }
      tabs={
        <Tabs label="Sections">
          {["overview", "evidence", "history"].map((t) => (
            <Tabs.Tab key={t} isSelected={tab === t} onClick={() => setTab(t)}>{t[0]?.toUpperCase() + t.slice(1)}</Tabs.Tab>
          ))}
        </Tabs>
      }
      showRail={tab === "overview"}
      rail={
        <Stack space="space.300">
          <dl>
            <KeyValue label="Owner">Dana Whitfield</KeyValue>
            <KeyValue label="Status"><Badge tone="success">Verified</Badge></KeyValue>
            <KeyValue label="Frequency">Quarterly</KeyValue>
          </dl>
          <Related title="Related controls" count={2}>
            <Related.Row label="CTRL-0418 Vendor master change" meta="Finance" onClick={() => undefined} />
            <Related.Row label="CTRL-0419 Payment release" meta="Finance" trailing="Due 18 Sep" onClick={() => undefined} />
          </Related>
          <Related title="Assessors" empty="No assessor assigned." />
        </Stack>
      }
    >
      <Section title="Objective" description="What the control prevents.">
        <Text className="pt-150">Payables are approved and paid by different people, so no one person can create and settle a vendor invoice.</Text>
      </Section>
      <Card>
        <Card.Header title="Evidence" description="Three items, all current." action={<Button size="small">Link evidence</Button>} />
        <Stack space="space.0" className="p-200">
          <Text color="color.text.subtle">The card body.</Text>
        </Stack>
      </Card>
    </ShowPage>
  );
}

export const ShowStory: Story = { name: "Show", render: () => <Show /> };

export const Preview: Story = {
  render: () => (
    <div className="max-w-[320px]">
      <PreviewRail id="CTRL-0450" title="Privileged access review" onClose={() => undefined} openTo={<Button variant="link">Open control</Button>}>
        <dl>
          <KeyValue label="Owner"><Avatar name="Priya Natarajan" size="xsmall" /> Priya Natarajan</KeyValue>
          <KeyValue label="Status"><Badge tone="danger">Overdue</Badge></KeyValue>
        </dl>
      </PreviewRail>
    </div>
  ),
};

export const Loading: Story = { render: () => <PageSkeleton rows={5} /> };
