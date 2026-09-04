import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Avatar,
  Badge,
  Button,
  Editable,
  Fact,
  FilterChip,
  HoverCard,
  Id,
  KeyValue,
  NativeSelect,
  Tabs,
  Breadcrumb,
  Person,
  Table,
  TextLink,
} from "../../components";
import {
  Card,
  DataTable,
  Empty,
  Glance,
  IndexPage,
  PageHeader,
  PageSkeleton,
  PickerSheet,
  PreviewRail,
  PreviewSheet,
  RecordHeader,
  Related,
  Section,
  ShowPage,
  defineColumns,
  useDataTable,
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
  const [open, setOpen] = useState<"plain" | "full" | "stack" | null>(null);
  const [depth, setDepth] = useState(0);
  const close = () => {
    setOpen(null);
    setDepth(0);
  };
  const stacked = open === "stack" && depth > 0;
  const requirementCell = (id: string) =>
    open === "stack" ? (
      <Button variant="link" onClick={() => setDepth(1)}>
        <Id>{id}</Id>
      </Button>
    ) : (
      <TextLink>
        <a href="#req">
          <Id>{id}</Id>
        </a>
      </TextLink>
    );
  return (
    <Stack space="space.200">
      <Specimens title="PreviewSheet">
        <Button variant="secondary" onClick={() => setOpen("plain")}>
          Facts only
        </Button>
        <Button variant="secondary" onClick={() => setOpen("full")}>
          With links and actions
        </Button>
        <Button variant="secondary" onClick={() => setOpen("stack")}>
          Compact header, a frame deeper
        </Button>
      </Specimens>
      <PreviewSheet
        open={open !== null}
        onClose={close}
        onBack={stacked ? () => setDepth(0) : undefined}
        id={stacked ? "REQ-0118" : "CMP-0113"}
        title={stacked ? "The gateway shall encrypt telemetry in transit" : "Telemetry gateway"}
        subtitle={
          stacked
            ? "Requirement · Derived · Dan Whitlock"
            : "Component · Ground segment / Mission control"
        }
        status={
          open === "stack" ? (
            <Badge size="xsmall" tone={stacked ? "success" : "information"}>
              {stacked ? "Verified" : "In assessment"}
            </Badge>
          ) : undefined
        }
        facts={
          open === "stack" ? (
            stacked ? (
              <>
                <Fact label="Method">Test</Fact>
                <Fact label="Owner">Dan Whitlock</Fact>
                <Fact label="Allocated to">2 elements</Fact>
              </>
            ) : (
              <>
                <Fact label="Class">Boundary</Fact>
                <Fact label="Zone">Enclave</Fact>
                <Fact label="Criticality">High</Fact>
              </>
            )
          ) : undefined
        }
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
        {stacked ? (
          <Section title="Shall statement">
            <Text className="pt-150">
              The gateway shall encrypt telemetry in transit between the ground segment and the
              mission control network, using FIPS 140-3 validated modules.
            </Text>
          </Section>
        ) : (
          <Stack space="space.300">
            {open !== "stack" ? (
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
            ) : null}
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
                    <Table.Cell>{requirementCell("REQ-0118")}</Table.Cell>
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
                    <Table.Cell>{requirementCell("REQ-0121")}</Table.Cell>
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
        )}
      </PreviewSheet>
    </Stack>
  );
}
/** Facts only; with a second link and actions; the compact header with status and facts, and a requirement opened a frame deeper with the back chevron. Open one. */
export const PreviewSheetStory: Story = {
  name: "Preview sheet",
  render: () => <PreviewSheetStates />,
};
export const PreviewSheetMatrix: Story = { render: () => <PreviewSheetStates /> };

const programGlance = (
  <Glance
    id="PRG-1041"
    status={
      <Badge size="xsmall" tone="success">
        Authorized
      </Badge>
    }
    title="Ground segment modernization"
    meta="GSM-2 · Production"
  >
    <KeyValue label="Owner">Dan Whitlock</KeyValue>
    <KeyValue label="Assessor">Priya Natarajan</KeyValue>
    <KeyValue label="Assessed">
      <span className="tabular-nums">312/340 · 6 failing</span>
    </KeyValue>
    <KeyValue label="Expires">
      <span className="tabular-nums">2027-03-14</span>
    </KeyValue>
  </Glance>
);

/** The same record at both densities: the hover card's body, and the top of a PreviewSheet's body under the sheet's own header. */
function GlanceStates() {
  return (
    <Stack space="space.300">
      <Specimens title="Glance, in a HoverCard (hover or focus the id)">
        <HoverCard content={programGlance} width={300}>
          <span tabIndex={0} className="rounded-xsmall outline-none focus-visible:outline-focused">
            <Id>PRG-1041</Id>
          </span>
        </HoverCard>
      </Specimens>
      <Specimens title="Glance">
        <Box className="w-[300px] rounded-large border border-default" padding="space.150">
          {programGlance}
        </Box>
      </Specimens>
      <Specimens title="Peek: rows only, two columns">
        <Box className="w-[640px] rounded-large border border-default" padding="space.150">
          <Glance density="peek">
            <KeyValue label="Class">Boundary</KeyValue>
            <KeyValue label="Zone">Enclave</KeyValue>
            <KeyValue label="Criticality">High</KeyValue>
            <KeyValue label="Supplier">Raytheon · 4.2</KeyValue>
            <KeyValue label="Attested">Yes</KeyValue>
          </Glance>
        </Box>
      </Specimens>
    </Stack>
  );
}
export const GlanceStory: Story = { name: "Glance", render: () => <GlanceStates /> };
export const GlanceMatrix: Story = { render: () => <GlanceStates /> };

const families = ["AC", "AU", "CM", "IA", "SC", "SI"] as const;
const statements = [
  "The system shall encrypt telemetry in transit.",
  "The system shall log every privileged command.",
  "The system shall lock an account after five failed attempts.",
  "The system shall verify firmware signatures before boot.",
  "The system shall retain audit records for one year.",
  "The system shall separate operator and maintainer roles.",
  "The system shall time out an idle session after fifteen minutes.",
];
const catalogue = Array.from({ length: 28 }, (_, i) => ({
  id: `REQ-${String(101 + i).padStart(4, "0")}`,
  text: statements[i % statements.length]!,
  family: families[i % families.length]!,
  state: (["Approved", "Draft", "Verified"] as const)[i % 3]!,
}));
const stateTone = { Approved: "information", Draft: "neutral", Verified: "success" } as const;
const responsibilities = ["Primary", "Supporting", "Inherited"] as const;
const coverages = ["Full", "Partial"] as const;
type Fields = {
  responsibility: (typeof responsibilities)[number];
  coverage: (typeof coverages)[number];
};

type Catalogue = (typeof catalogue)[number];
type ChosenRow = Catalogue & Fields;

const catalogueColumns = defineColumns<Catalogue>((c) => [
  c.id("id", { header: "Requirement", width: 110 }),
  c.text("text", { header: "Shall statement", sortable: false }),
  c.text("family", { header: "Family", width: 72 }),
  c.status("state", { header: "State", width: 96, tone: (r) => stateTone[r.state] }),
]);

function PickerStates() {
  const [open, setOpen] = useState(false);
  const [frame, setFrame] = useState<"choose" | "details">("choose");
  const [fields, setFields] = useState<Record<string, Fields>>({});

  // Frame one chooses: the table holds the search, the family facet, the sort and the selection,
  // and the selection survives the search because it is kept by row id.
  const choose = useDataTable({
    columns: catalogueColumns,
    data: catalogue,
    getRowId: (r) => r.id,
    selectable: true,
    label: "Requirements",
    initialState: { sorting: [{ id: "id", desc: false }] },
  });
  const chosenIds = Object.keys(choose.state.rowSelection);
  const chosen = new Set(chosenIds);
  const fieldOf = (id: string): Fields =>
    fields[id] ?? { responsibility: "Primary", coverage: "Full" };
  const setField = (id: string, patch: Partial<Fields>) =>
    setFields((f) => ({ ...f, [id]: { ...fieldOf(id), ...patch } }));
  const applyAll = (patch: Partial<Fields>) =>
    setFields(Object.fromEntries(chosenIds.map((id) => [id, { ...fieldOf(id), ...patch }])));
  const reset = () => {
    setOpen(false);
    setFrame("choose");
  };
  const chosenRows: ChosenRow[] = catalogue
    .filter((r) => chosen.has(r.id))
    .map((r) => ({ ...r, ...fieldOf(r.id) }));

  // Frame two fills in the fields the model requires, in place; "Does not apply" is a row action.
  const detailColumns = useMemo(
    () =>
      defineColumns<ChosenRow>((c) => [
        c.id("id", { header: "Requirement", width: 110, sortable: false }),
        c.text("text", { header: "Shall statement", sortable: false }),
        c.status("responsibility", {
          header: "Responsibility",
          width: 150,
          sortable: false,
          tone: () => "neutral",
          editable: {
            options: responsibilities,
            onChange: (row, next) =>
              setField(row.id, { responsibility: next as Fields["responsibility"] }),
            save: async () => undefined,
          },
        }),
        c.status("coverage", {
          header: "Coverage",
          width: 120,
          sortable: false,
          tone: (r) => (r.coverage === "Full" ? "success" : "warning"),
          editable: {
            options: coverages,
            onChange: (row, next) => setField(row.id, { coverage: next as Fields["coverage"] }),
            save: async () => undefined,
          },
        }),
        c.custom("apply", {
          header: "",
          width: 130,
          align: "end",
          cell: (r) => (
            <Button
              variant="link"
              size="small"
              onClick={() => choose.getRow(r.id).toggleSelected(false)}
            >
              Does not apply
            </Button>
          ),
        }),
      ]),
    // the chooser table is stable for the life of the story
    [],
  );
  const details = useDataTable({
    columns: detailColumns,
    data: chosenRows,
    getRowId: (r) => r.id,
    label: "Chosen requirements",
  });

  return (
    <Stack space="space.200">
      <Specimens title="PickerSheet">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Allocate requirements
        </Button>
        <Text size="small" color="color.text.subtle">
          {chosen.size} chosen so far
        </Text>
      </Specimens>
      {frame === "choose" ? (
        <PickerSheet
          open={open}
          onClose={reset}
          title="Allocate requirements"
          subtitle="Flight computer · 14 allocated today"
          search={{
            value: String(choose.state.globalFilter ?? ""),
            onChange: (v) => choose.setGlobalFilter(v),
            placeholder: "Search requirements",
          }}
          filters={
            <>
              <DataTable.Filter table={choose} column="family" />
              <DataTable.Filter table={choose} column="state" />
            </>
          }
          selected={chosen.size}
          total={choose.getRowCount()}
          onClear={() => choose.resetRowSelection()}
          action={{ label: `Continue with ${chosen.size}`, onClick: () => setFrame("details") }}
        >
          <DataTable
            table={choose}
            onRowClick={(r) => choose.getRow(r.id).toggleSelected()}
            className="rounded-none border-0"
            empty={{ title: "No requirements match", description: "Clear the search or a filter." }}
          />
        </PickerSheet>
      ) : (
        <PickerSheet
          open={open}
          onClose={reset}
          onBack={() => setFrame("choose")}
          title="Allocate requirements"
          subtitle="Flight computer · responsibility and coverage for each"
          toolbar={
            <Inline space="space.150" alignBlock="center">
              <Text size="small" color="color.text.subtle">
                Apply to all
              </Text>
              <Box style={{ width: 140 }}>
                <NativeSelect
                  aria-label="Responsibility for all"
                  className="[&>select]:h-control-small"
                  defaultValue=""
                  onChange={(e) =>
                    e.target.value &&
                    applyAll({ responsibility: e.target.value as Fields["responsibility"] })
                  }
                >
                  <option value="">Responsibility</option>
                  {responsibilities.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </NativeSelect>
              </Box>
              <Box style={{ width: 120 }}>
                <NativeSelect
                  aria-label="Coverage for all"
                  className="[&>select]:h-control-small"
                  defaultValue=""
                  onChange={(e) =>
                    e.target.value && applyAll({ coverage: e.target.value as Fields["coverage"] })
                  }
                >
                  <option value="">Coverage</option>
                  {coverages.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </NativeSelect>
              </Box>
            </Inline>
          }
          selected={chosen.size}
          action={{ label: `Allocate ${chosen.size} to Flight computer`, onClick: reset }}
        >
          <DataTable table={details} className="rounded-none border-0" />
        </PickerSheet>
      )}
    </Stack>
  );
}
/** Frame one is a DataTable in the sheet: search, the family and state facets, a sortable id column and a selection that survives the search; frame two is a second DataTable whose responsibility and coverage cells edit in place, with a defaults row and "Does not apply" per row. Open it. */
export const PickerSheetStory: Story = { name: "Picker sheet", render: () => <PickerStates /> };
export const PickerSheetMatrix: Story = { render: () => <PickerStates /> };

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
