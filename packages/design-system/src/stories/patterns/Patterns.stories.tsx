import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { useState } from "react";

import {
  Avatar,
  Badge,
  Button,
  Fact,
  FilterChip,
  Id,
  KeyValue,
  Tabs,
  Breadcrumb,
  Person,
  Table,
  TextLink,
} from "../../components";
import {
  Card,
  Empty,
  IndexPage,
  PageHeader,
  PageSkeleton,
  PreviewRail,
  PreviewSheet,
  RecordHeader,
  Related,
  Section,
  ShowPage,
} from "../../patterns";
import { Stack, Text, Box, Inline } from "../../primitives";
import { Specimens } from "../_lib/matrix";

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
            <Button variant="primary">
              <Plus className="size-icon-small" />
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
      header={
        <RecordHeader
          back={<a href="#controls" />}
          breadcrumb={
            <Text size="small" color="color.text.subtle">
              Finance controls / Payables
            </Text>
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
        <Tabs label="Sections">
          {["overview", "evidence", "history"].map((t) => (
            <Tabs.Tab key={t} isSelected={tab === t} onClick={() => setTab(t)}>
              {t[0]?.toUpperCase() + t.slice(1)}
            </Tabs.Tab>
          ))}
        </Tabs>
      }
      showRail={tab === "overview"}
      rail={
        <Stack space="space.300">
          <dl>
            <KeyValue label="Owner">Dana Whitfield</KeyValue>
            <KeyValue label="Status">
              <Badge tone="success">Verified</Badge>
            </KeyValue>
            <KeyValue label="Frequency">Quarterly</KeyValue>
          </dl>
          <Related title="Related controls" count={2}>
            <Related.Row
              label="CTRL-0418 Vendor master change"
              meta="Finance"
              onClick={() => undefined}
            />
            <Related.Row
              label="CTRL-0419 Payment release"
              meta="Finance"
              trailing="Due 18 Sep"
              onClick={() => undefined}
            />
          </Related>
          <Related title="Assessors" empty="No assessor assigned." />
        </Stack>
      }
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
        <dl>
          <KeyValue label="Owner">
            <Avatar name="Priya Natarajan" size="xsmall" /> Priya Natarajan
          </KeyValue>
          <KeyValue label="Status">
            <Badge tone="danger">Overdue</Badge>
          </KeyValue>
        </dl>
      </PreviewRail>
    </div>
  ),
};

export const Loading: Story = { render: () => <PageSkeleton rows={5} /> };

function PreviewSheetStates() {
  const [open, setOpen] = useState<"plain" | "full" | null>(null);
  return (
    <Stack space="space.200">
      <Specimens title="PreviewSheet">
        <Button variant="secondary" onClick={() => setOpen("plain")}>
          Facts only
        </Button>
        <Button variant="secondary" onClick={() => setOpen("full")}>
          With links and actions
        </Button>
      </Specimens>
      <PreviewSheet
        open={open !== null}
        onClose={() => setOpen(null)}
        id="CMP-0113"
        title="Telemetry gateway"
        subtitle="Component · Ground segment / Mission control"
        openTo={<a href="#record" />}
        links={
          open === "full" ? (
            <TextLink>
              <a href="#controls">Control set and revisions</a>
            </TextLink>
          ) : null
        }
        actions={
          open === "full" ? (
            <>
              <Button variant="secondary">Propose change</Button>
              <Button variant="primary">Allocate</Button>
            </>
          ) : null
        }
      >
        <Stack space="space.300">
          <Section title="Element">
            <Fact.Group>
              <Fact label="Id">
                <Id>CMP-0113</Id>
              </Fact>
              <Fact label="Class">Boundary</Fact>
              <Fact label="Zone">Enclave</Fact>
              <Fact label="Criticality">High</Fact>
            </Fact.Group>
          </Section>
          <Section title="Requirements">
            <Table>
              <thead>
                <tr>
                  <Table.Header width={110}>Requirement</Table.Header>
                  <Table.Header>Shall statement</Table.Header>
                  <Table.Header width={96}>State</Table.Header>
                </tr>
              </thead>
              <tbody>
                <Table.Row>
                  <Table.Cell>
                    <TextLink>
                      <a href="#req">
                        <Id>REQ-0118</Id>
                      </a>
                    </TextLink>
                  </Table.Cell>
                  <Table.Cell className="truncate">
                    The gateway shall encrypt telemetry in transit.
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="xsmall" tone="success">
                      Verified
                    </Badge>
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>
                    <TextLink>
                      <a href="#req">
                        <Id>REQ-0121</Id>
                      </a>
                    </TextLink>
                  </Table.Cell>
                  <Table.Cell className="truncate">
                    The gateway shall log every command it forwards.
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="xsmall" tone="warning">
                      Allocated
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              </tbody>
            </Table>
          </Section>
        </Stack>
      </PreviewSheet>
    </Stack>
  );
}
/** Facts only, and with a second link and actions. Open one. */
export const PreviewSheetStory: Story = {
  name: "Preview sheet",
  render: () => <PreviewSheetStates />,
};
export const PreviewSheetMatrix: Story = { render: () => <PreviewSheetStates /> };

/** Plain, with a header, with a description and an action. */
export const CardMatrix: Story = {
  render: () => (
    <Stack space="space.200" className="w-layout-list">
      <Card>
        <Box padding="space.200">
          <Text>Plain card</Text>
        </Box>
      </Card>
      <Card>
        <Card.Header title="With a header" />
        <Box padding="space.200">
          <Text size="small" color="color.text.subtle">
            Body
          </Text>
        </Box>
      </Card>
      <Card>
        <Card.Header
          title="Description and action"
          description="Everything derived from the live matrix."
          action={
            <Button size="small" variant="subtle">
              Edit
            </Button>
          }
        />
        <Box padding="space.200">
          <Text size="small" color="color.text.subtle">
            Body
          </Text>
        </Box>
      </Card>
    </Stack>
  ),
};

/** Title only, with a description, with an action. */
export const EmptyMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Empty title="No findings" />
      <Empty title="No findings" description="Nothing on this control has been observed yet." />
      <Empty
        title="No findings"
        description="Nothing on this control has been observed yet."
        action={<Button size="small">Record a finding</Button>}
      />
    </Stack>
  ),
};

/** Title alone, with an eyebrow and description, with actions. */
export const PageHeaderMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <PageHeader title="Programs" />
      <PageHeader
        eyebrow="Libraries"
        title="Control catalog"
        description="800-53 Rev 5, CNSSI 1253 overlays and the CCI decomposition."
      />
      <PageHeader
        title="Findings and assets"
        description="One technical fact per row."
        actions={
          <>
            <Button variant="secondary">Export</Button>
            <Button variant="primary">New finding</Button>
          </>
        }
      />
    </Stack>
  ),
};

/** Three rows and the default eight. */
export const PageSkeletonMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <PageSkeleton rows={3} />
      <PageSkeleton />
    </Stack>
  ),
};

/** With a title and an open-record link, and with the id alone. */
export const PreviewRailMatrix: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      <Box className="w-layout-rail">
        <PreviewRail
          id="FND-2231"
          title="Router management plane accepts unencrypted telnet"
          onClose={() => {}}
          openTo={
            <TextLink size="small">
              <a href="#open">Open</a>
            </TextLink>
          }
        >
          <Stack space="space.100">
            <KeyValue label="CCI">CCI-001453</KeyValue>
            <KeyValue label="Asset">edge-sw-a1</KeyValue>
          </Stack>
        </PreviewRail>
      </Box>
      <Box className="w-layout-rail">
        <PreviewRail id="RSK-0021" onClose={() => {}}>
          <Text size="small" color="color.text.subtle">
            Only the id.
          </Text>
        </PreviewRail>
      </Box>
    </Inline>
  ),
};

/** Id and title; with a back chevron, meta and actions; with facts; with a breadcrumb and a row below. */
export const RecordHeaderMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <RecordHeader id="PRG-1041" title="Atlas payments platform" />
      <RecordHeader
        id="REQ-0118"
        title="The gateway shall encrypt telemetry in transit"
        facts={
          <>
            <Fact label="Owner">Dana Whitfield</Fact>
            <Fact label="Method">Test</Fact>
            <Fact label="State">
              <Badge tone="success">Verified</Badge>
            </Fact>
            <Fact label="Allocated to">
              <TextLink>
                <a href="#cmp">Telemetry gateway</a>
              </TextLink>
            </Fact>
          </>
        }
      />
      <RecordHeader
        back={<a href="#back" />}
        id="PRG-1041"
        title="Atlas payments platform"
        meta={
          <Inline space="space.100" alignBlock="center">
            <Badge tone="information">In assessment</Badge>
            <Text size="small" color="color.text.subtle">
              NIST SP 800-53 Rev. 5 · High
            </Text>
          </Inline>
        }
        actions={
          <>
            <Button variant="secondary">Views</Button>
            <Button variant="primary">Record assessment result</Button>
          </>
        }
      />
      <RecordHeader
        breadcrumb={
          <Breadcrumb>
            <Breadcrumb.Item>Programs</Breadcrumb.Item>
            <Breadcrumb.Item>Atlas payments platform</Breadcrumb.Item>
            <Breadcrumb.Item isCurrent>SCTM</Breadcrumb.Item>
          </Breadcrumb>
        }
        id="PRG-1041"
        title="Security control traceability matrix"
        below={
          <Tabs label="Sections">
            <Tabs.Tab isSelected count={340}>
              Rows
            </Tabs.Tab>
            <Tabs.Tab count={12}>Gaps</Tabs.Tab>
          </Tabs>
        }
      />
    </Stack>
  ),
};

/** Rows with every slot, an action, and the empty case. */
export const RelatedMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="w-layout-rail">
      <Related
        title="Linked findings"
        count={2}
        action={
          <Button size="xsmall" variant="subtle">
            Link
          </Button>
        }
      >
        <Related.Row
          lead={
            <Badge tone="danger" size="xsmall">
              CAT I
            </Badge>
          }
          label="FND-2231"
          meta="Router management plane accepts unencrypted telnet"
          onClick={() => {}}
        />
        <Related.Row
          label="FND-2214"
          meta="SSH permits GSSAPI authentication"
          trailing={<Person name="Dana Whitlock" />}
        />
      </Related>
      <Related title="Risks" />
      <Related title="Packages" empty="Not in a package yet" />
    </Stack>
  ),
};

/** Title; with a description; with an action. */
export const SectionMatrix: Story = {
  render: () => (
    <Stack space="space.400" className="max-w-layout-measure">
      <Section title="Control coverage">
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Section>
      <Section
        title="Control coverage"
        description="Everything below is derived from the live matrix."
      >
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Section>
      <Section
        title="Control coverage"
        action={
          <TextLink size="small">
            <a href="#all">Full timeline</a>
          </TextLink>
        }
      >
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Section>
    </Stack>
  ),
};

/** An index with filters, a show page with its rail and without. */
export const ArchetypesMatrix: Story = {
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
        header={<RecordHeader id="PRG-1041" title="Atlas payments platform" />}
        tabs={
          <Tabs label="Sections">
            <Tabs.Tab isSelected>Overview</Tabs.Tab>
            <Tabs.Tab count={26}>Controls</Tabs.Tab>
          </Tabs>
        }
        showRail
        rail={
          <Stack space="space.100">
            <KeyValue label="Owner">
              <Person name="Grace Hoppel" />
            </KeyValue>
            <KeyValue label="Status">
              <Badge tone="information">In assessment</Badge>
            </KeyValue>
          </Stack>
        }
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
