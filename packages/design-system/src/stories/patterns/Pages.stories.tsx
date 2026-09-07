import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { useState } from "react";

import {
  Avatar,
  Badge,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  Button,
  FilterChip,
  KeyValue,
  Tabs,
  TextLink,
} from "../../components";
import {
  Card,
  Empty,
  IndexPage,
  PageHeader,
  PageSkeleton,
  PreviewRail,
  RecordHeader,
  Section,
  ShowPage,
} from "../../patterns";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Inspector } from "../../shapes";
import { Pair } from "../_lib/pair";
import { panelGroups } from "../_lib/patterns-fixtures";

const meta = {
  title: "Patterns/Pages",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Index: Story = {
  render: () => (
    <IndexPage
      header={
        <PageHeader
          eyebrow="Finance"
          title="Controls"
          description="Every control in scope for the FY26 programme, with its owner and status."
          actions={
            <Button variant="primary" iconBefore={<Plus />}>
              New control
            </Button>
          }
        />
      }
      filters={
        <>
          <FilterChip label="Owner" value="Dana Whitfield" isActive />
          <FilterChip label="Status" />
          <FilterChip label="Family" />
        </>
      }
    >
      <Empty
        title="No controls match"
        description="Clear a filter or widen the date range."
        action={<Button size="small">Clear filters</Button>}
      />
    </IndexPage>
  ),
};

function Show() {
  const [tab, setTab] = useState("overview");
  return (
    <ShowPage
      tab={tab}
      onTabChange={setTab}
      header={
        <RecordHeader
          crumbs={
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href="#controls">Controls</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#payables">Payables</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          }
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
        <Tabs.List label="Sections">
          {["overview", "evidence", "history"].map((t) => (
            <Tabs.Tab key={t} value={t}>
              {t[0]?.toUpperCase() + t.slice(1)}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      }
      rail={tab === "overview" ? <Inspector groups={panelGroups} /> : null}
    >
      <Section title="Objective" description="What the control prevents.">
        <Text className="pt-150">
          Payables are approved and paid by different people, so no one person can create and settle
          a vendor invoice.
        </Text>
      </Section>
      <Card>
        <Card.Header
          title="Evidence"
          description="Three items, all current."
          action={<Button size="small">Link evidence</Button>}
        />
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
      <PreviewRail
        id="CTRL-0450"
        title="Privileged access review"
        onClose={() => undefined}
        openTo={
          <TextLink size="small">
            <a href="#open">Open control</a>
          </TextLink>
        }
      >
        <div>
          <KeyValue label="Owner">
            <Avatar name="Priya Natarajan" size="xsmall" /> Priya Natarajan
          </KeyValue>
          <KeyValue label="Status">
            <Badge tone="danger">Overdue</Badge>
          </KeyValue>
        </div>
      </PreviewRail>
    </div>
  ),
};

export const Loading: Story = { render: () => <PageSkeleton rows={5} /> };

/** An index with filters, a show page with its rail on the overview tab and one without. */
export const ArchetypesMatrix: Story = {
  // Several record headers in one story mean several trails named "breadcrumb"; a page has one.
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: () => (
    <Stack space="space.600">
      <IndexPage
        header={<PageHeader title="Programs" description="Every program in the boundary." />}
        filters={
          <Inline space="space.100">
            <FilterChip label="Baseline" value="Rev. 5" isActive />
            <FilterChip label="Impact" />
          </Inline>
        }
      >
        <Card>
          <Box padding="space.200">
            <Text size="small" color="color.text.subtle">
              The register
            </Text>
          </Box>
        </Card>
      </IndexPage>
      <ShowPage
        tab="Overview"
        header={<RecordHeader id="PRG-1041" title="Atlas payments platform" />}
        tabs={
          <Tabs.List label="Sections">
            <Tabs.Tab value="Overview">Overview</Tabs.Tab>
            <Tabs.Tab value="Controls" count={26}>
              Controls
            </Tabs.Tab>
          </Tabs.List>
        }
        rail={<Inspector groups={panelGroups} />}
      >
        <Section title="Control coverage">
          <Text size="small" color="color.text.subtle">
            Body beside the rail.
          </Text>
        </Section>
      </ShowPage>
      <ShowPage
        header={
          <RecordHeader id="FND-2231" title="Router management plane accepts unencrypted telnet" />
        }
      >
        <Section title="Finding statement">
          <Text size="small" color="color.text.subtle">
            Body without a rail.
          </Text>
        </Section>
      </ShowPage>
    </Stack>
  ),
};

/** The mistakes the overview is written to prevent, each beside the right way. */
export const Dont: Story = {
  // Independent page examples repeat their main and navigation landmarks.
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <ShowPage
            tab="Controls"
            header={<RecordHeader id="PRG-1041" title="Atlas payments platform" />}
            tabs={
              <Tabs.List label="Sections">
                <Tabs.Tab value="Overview">Overview</Tabs.Tab>
                <Tabs.Tab value="Controls" count={26}>
                  Controls
                </Tabs.Tab>
              </Tabs.List>
            }
          >
            <Section title="Controls" count={26}>
              <Text as="p" size="small" color="color.text.subtle" className="pt-150">
                The tab runs full width.
              </Text>
            </Section>
          </ShowPage>
        }
        doText="The rail is the overview tab's. Every other tab runs the full width."
        dont={
          <ShowPage
            tab="Controls"
            header={<RecordHeader id="PRG-1041" title="Atlas payments platform" />}
            tabs={
              <Tabs.List label="Sections">
                <Tabs.Tab value="Overview">Overview</Tabs.Tab>
                <Tabs.Tab value="Controls" count={26}>
                  Controls
                </Tabs.Tab>
              </Tabs.List>
            }
            rail={<Inspector groups={panelGroups} />}
          >
            <Section title="Controls" count={26}>
              <Text as="p" size="small" color="color.text.subtle" className="pt-150">
                A table squeezed beside the rail.
              </Text>
            </Section>
          </ShowPage>
        }
        dontText="The rail beside every tab. A register of 26 controls shares its width with facts about the program."
      />
      <Pair
        do={
          <IndexPage
            header={<PageHeader title="Programs" description="5 programs · 2 in assessment" />}
          >
            <Card>
              <Card.Body>
                <Text size="small" color="color.text.subtle">
                  The register
                </Text>
              </Card.Body>
            </Card>
          </IndexPage>
        }
        doText="An index is a header and one table; the record opens from it."
        dont={
          <IndexPage header={<PageHeader title="Programs" />}>
            <Stack space="space.300">
              <Card>
                <Card.Body>
                  <Text size="small" color="color.text.subtle">
                    The register
                  </Text>
                </Card.Body>
              </Card>
              <RecordHeader id="PRG-1041" title="Atlas payments platform" />
              <Section title="Control coverage">
                <Text as="p" size="small" color="color.text.subtle" className="pt-150">
                  The record, inline under the table.
                </Text>
              </Section>
            </Stack>
          </IndexPage>
        }
        dontText="The record inline under the index. Two pages on one, and the reader scrolls past the list to find where they are."
      />
    </Stack>
  ),
};
