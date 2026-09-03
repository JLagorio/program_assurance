import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExternalLink, Info, Maximize2, Plus } from "lucide-react";
import { useState } from "react";

import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Editable,
  Fact,
  FilterChip,
  HoverCard,
  IconButton,
  Id,
  Indicator,
  KeyValue,
  NativeSelect,
  Person,
  Table,
  Tabs,
  TextLink,
} from "../../components";
import {
  Card,
  CommandPalette,
  Empty,
  Glance,
  IndexPage,
  PageHeader,
  PageSkeleton,
  type PaletteCommand,
  Panel,
  type PickerRecord,
  PickerSheet,
  PreviewRail,
  PreviewSheet,
  PreviewSplit,
  RecordHeader,
  RecordPicker,
  Related,
  Section,
  ShowPage,
  useCommandPalette,
} from "../../patterns";
import { Stack, Text, Box, Inline } from "../../primitives";
import { Inspector } from "../../shapes";
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

function PickerStates() {
  const [open, setOpen] = useState(false);
  const [frame, setFrame] = useState<"choose" | "details">("choose");
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<(typeof families)[number] | null>(null);
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [chosen, setChosen] = useState<Set<string>>(() => new Set());
  const [fields, setFields] = useState<Record<string, Fields>>({});
  const q = query.trim().toLowerCase();
  const rows = catalogue
    .filter(
      (r) =>
        (!q || r.text.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) &&
        (!family || r.family === family),
    )
    .sort((a, b) => (sort === "asc" ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id)));
  const toggle = (id: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allShown = rows.length > 0 && rows.every((r) => chosen.has(r.id));
  const someShown = rows.some((r) => chosen.has(r.id));
  const fieldOf = (id: string): Fields =>
    fields[id] ?? { responsibility: "Primary", coverage: "Full" };
  const setField = (id: string, patch: Partial<Fields>) =>
    setFields((f) => ({ ...f, [id]: { ...fieldOf(id), ...patch } }));
  const applyAll = (patch: Partial<Fields>) =>
    setFields(Object.fromEntries([...chosen].map((id) => [id, { ...fieldOf(id), ...patch }])));
  const reset = () => {
    setOpen(false);
    setFrame("choose");
  };
  const nextFamily = () =>
    setFamily((f) => (f === null ? families[0] : (families[families.indexOf(f) + 1] ?? null)));
  const chosenRows = catalogue.filter((r) => chosen.has(r.id));
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
          search={{ value: query, onChange: setQuery, placeholder: "Search requirements" }}
          filters={
            <>
              <FilterChip
                label="Family"
                value={family ?? undefined}
                isActive={family !== null}
                onClick={nextFamily}
              />
              <FilterChip label="State" />
            </>
          }
          selected={chosen.size}
          total={rows.length}
          onClear={() => setChosen(new Set())}
          action={{ label: `Continue with ${chosen.size}`, onClick: () => setFrame("details") }}
        >
          <Table>
            <thead>
              <tr>
                <Table.Selection
                  header
                  checked={allShown ? true : someShown ? "indeterminate" : false}
                  onCheckedChange={(checked) =>
                    setChosen((prev) => {
                      const next = new Set(prev);
                      for (const r of rows)
                        if (checked) next.add(r.id);
                        else next.delete(r.id);
                      return next;
                    })
                  }
                  label="Select every row shown"
                />
                <Table.Header
                  width={110}
                  sort={sort}
                  onSort={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
                >
                  Requirement
                </Table.Header>
                <Table.Header>Shall statement</Table.Header>
                <Table.Header width={72}>Family</Table.Header>
                <Table.Header width={96}>State</Table.Header>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Table.Row
                  key={r.id}
                  isSelected={chosen.has(r.id)}
                  onClick={() => toggle(r.id)}
                  className="cursor-pointer"
                >
                  <Table.Selection
                    checked={chosen.has(r.id)}
                    onCheckedChange={() => toggle(r.id)}
                    label={`Select ${r.id}`}
                  />
                  <Table.Cell>
                    <Id>{r.id}</Id>
                  </Table.Cell>
                  <Table.Cell className="truncate" title={r.text}>
                    {r.text}
                  </Table.Cell>
                  <Table.Cell>{r.family}</Table.Cell>
                  <Table.Cell>
                    <Badge size="xsmall" tone={stateTone[r.state]}>
                      {r.state}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
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
          <Table>
            <thead>
              <tr>
                <Table.Header width={110}>Requirement</Table.Header>
                <Table.Header>Shall statement</Table.Header>
                <Table.Header width={130}>Responsibility</Table.Header>
                <Table.Header width={96}>Coverage</Table.Header>
                <Table.Header width={120} />
              </tr>
            </thead>
            <tbody>
              {chosenRows.map((r) => {
                const f = fieldOf(r.id);
                return (
                  <Table.Row key={r.id} isStatic>
                    <Table.Cell>
                      <Id>{r.id}</Id>
                    </Table.Cell>
                    <Table.Cell className="truncate" title={r.text}>
                      {r.text}
                    </Table.Cell>
                    <Table.Cell>
                      <Editable.Select
                        label="Responsibility"
                        options={responsibilities}
                        value={f.responsibility}
                        onChange={(next) => setField(r.id, { responsibility: next })}
                        save={async () => undefined}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Editable.Select
                        label="Coverage"
                        options={coverages}
                        value={f.coverage}
                        onChange={(next) => setField(r.id, { coverage: next })}
                        save={async () => undefined}
                      />
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <Button variant="link" size="small" onClick={() => toggle(r.id)}>
                        Does not apply
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </tbody>
          </Table>
        </PickerSheet>
      )}
    </Stack>
  );
}
/** Frame one chooses from a catalogue of 28 with search, a family filter, a sortable id column and selection that survives the search; frame two sets responsibility and coverage per row with a defaults row. Open it. */
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

const glances = {
  element: (
    <Glance
      id="CN-0300"
      title="Tactical edge"
      meta="Subsystem · Atlas payments platform"
      status={<Indicator tone="warning">v2 pending approval</Indicator>}
      facts={[
        { label: "Class", value: "System" },
        { label: "Zone", value: "Tactical" },
        { label: "Requirements", value: "4 · 2 own" },
        { label: "Controls", value: "341" },
      ]}
    />
  ),
  requirement: (
    <Glance
      id="REQ-0042.4"
      title="The module shall refuse firmware whose security version is below the value recorded in the rollback fuses."
      meta="Derived · revision 1"
      status={
        <Badge size="xsmall" tone="information">
          Approved
        </Badge>
      }
      facts={[
        { label: "Owner", value: "Marcus Ryde" },
        { label: "Method", value: "Test" },
        { label: "Carried by", value: "2 elements" },
        { label: "Verification", value: "Not met" },
      ]}
    />
  ),
  control: (
    <Glance
      id="SI-7(1)"
      title="Software, firmware, and information integrity · integrity checks"
      meta="SI · System and information integrity"
      status={<Indicator tone="success">Satisfied</Indicator>}
      facts={[
        { label: "Owner", value: "Dana Whitlock" },
        { label: "Requirements", value: "2" },
        { label: "Scopes", value: "3 of 3" },
      ]}
    />
  ),
} as const;

/** A glance behind an id; hover or focus it. */
export const GlanceStory: Story = {
  name: "Glance",
  render: () => (
    <Inline space="space.300" alignBlock="center">
      {(Object.keys(glances) as (keyof typeof glances)[]).map((k) => (
        <HoverCard key={k} content={glances[k]} width={300}>
          <TextLink>
            <a href={`#${k}`}>
              <Id>
                {k === "element" ? "CN-0300" : k === "requirement" ? "REQ-0042.4" : "SI-7(1)"}
              </Id>
            </a>
          </TextLink>
        </HoverCard>
      ))}
    </Inline>
  ),
};

/** The three record types at the card's width. */
export const GlanceMatrix: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start">
      {(Object.keys(glances) as (keyof typeof glances)[]).map((k) => (
        <Box
          key={k}
          className="rounded-large border border-default"
          paddingBlock="space.150"
          paddingInline="space.150"
          style={{ width: 300 }}
        >
          {glances[k]}
        </Box>
      ))}
    </Inline>
  ),
};

const panelGroups = [
  {
    title: "Identity",
    rows: [
      { label: "Id", value: "PRG-014" },
      { label: "Kind", value: "Program" },
      { label: "Framework", value: "NIST 800-53 r5, moderate" },
    ],
  },
  {
    title: "Ownership",
    rows: [
      { label: "Owner", value: "Sarah Chen" },
      { label: "ISSO", value: "Dana Whitfield" },
    ],
  },
  {
    title: "Dates",
    rows: [
      { label: "Created", value: "12 Mar 2026" },
      { label: "Next gate", value: "12 Sep 2026" },
    ],
  },
];

/** A panel surface in a box the size of the shell's Panel area. */
function PanelBox({ height = 300, children }: { height?: number; children: React.ReactNode }) {
  return (
    <div
      style={{ width: 320, height }}
      className="overflow-y-auto rounded-medium border border-default bg-surface"
    >
      {children}
    </div>
  );
}

const filler = Array.from({ length: 6 }, (_, i) => (
  <Text key={i} color="color.text.subtle">
    Line {i + 1} of the panel's body. The area scrolls; the header and the footer stay put.
  </Text>
));

export const PanelStory: Story = {
  name: "Panel",
  render: () => (
    <PanelBox height={420}>
      <Panel flush>
        <Inspector groups={panelGroups} />
      </Panel>
    </PanelBox>
  ),
};

/** The header's forms, a subheader, a footer; the record's rail with no header at all; the trigger for a dismissible panel. */
export const PanelMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Plain · with an icon and two actions · with a back button and a subheader">
        <Inline space="space.300" alignBlock="start">
          <PanelBox>
            <Panel title="Details" onClose={() => undefined}>
              <Stack space="space.100">{filler}</Stack>
            </Panel>
          </PanelBox>
          <PanelBox>
            <Panel
              title="Comments"
              icon={<Info className="size-icon-small icon-subtle" />}
              actions={
                <>
                  <IconButton label="Expand" variant="subtle">
                    <Maximize2 className="size-icon-medium" />
                  </IconButton>
                  <IconButton label="Open in a new tab" variant="subtle">
                    <ExternalLink className="size-icon-medium" />
                  </IconButton>
                </>
              }
              onClose={() => undefined}
            >
              <Stack space="space.100">{filler}</Stack>
            </Panel>
          </PanelBox>
          <PanelBox>
            <Panel
              title="Add fields"
              subheader="Default field scheme"
              onBack={() => undefined}
              onClose={() => undefined}
            >
              <Stack space="space.100">{filler}</Stack>
            </Panel>
          </PanelBox>
        </Inline>
      </Specimens>
      <Specimens title="With a footer · the record's rail, never dismissed · the trigger of a dismissible panel, closed and open">
        <Inline space="space.300" alignBlock="start">
          <PanelBox>
            <Panel
              title="Edit settings"
              onClose={() => undefined}
              footer={
                <>
                  <Button>Cancel</Button>
                  <Button variant="primary">Save</Button>
                </>
              }
            >
              <Stack space="space.100">{filler}</Stack>
            </Panel>
          </PanelBox>
          <PanelBox height={420}>
            <Panel flush>
              <Inspector groups={panelGroups} />
            </Panel>
          </PanelBox>
          <Inline space="space.100" alignBlock="center">
            <Panel.Trigger isOpen={false} onClick={() => undefined} />
            <Panel.Trigger isOpen onClick={() => undefined} />
          </Inline>
        </Inline>
      </Specimens>
    </Stack>
  ),
};

const splitRows = [
  { id: "PRG-001", title: "Ground segment refresh", phase: "Assess" },
  { id: "PRG-002", title: "Payload integration", phase: "Authorise" },
  { id: "PRG-003", title: "Fleet telemetry", phase: "Monitor" },
  { id: "PRG-004", title: "Range safety", phase: "Prepare" },
];

/** The list, and beside it the rail of the chosen row, sized by the reader. */
function SplitDemo({ open }: { open: boolean }) {
  const [selected, setSelected] = useState<string | null>(open ? "PRG-002" : null);
  const row = splitRows.find((r) => r.id === selected);
  return (
    <PreviewSplit open={row !== undefined}>
      <Table>
        <thead>
          <tr>
            <Table.Header width={120}>Program</Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header width={120}>Phase</Table.Header>
          </tr>
        </thead>
        <tbody>
          {splitRows.map((r) => (
            <Table.Row key={r.id} isSelected={r.id === selected} onClick={() => setSelected(r.id)}>
              <Table.Id id={r.id} />
              <Table.Cell>{r.title}</Table.Cell>
              <Table.Cell>{r.phase}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
      {row ? (
        <PreviewRail id={row.id} title={row.title} onClose={() => setSelected(null)}>
          <Text color="color.text.subtle">
            Phase {row.phase}. The rail beside a table, sized by the reader; the record's own rail
            is the shell's panel.
          </Text>
        </PreviewRail>
      ) : null}
    </PreviewSplit>
  );
}
export const PreviewSplitStory: Story = { name: "Preview split", render: () => <SplitDemo open /> };
export const PreviewSplitMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Closed: the list at full width">
        <SplitDemo open={false} />
      </Specimens>
      <Specimens title="Open: the rail the reader sizes, from 18% to 45%">
        <SplitDemo open />
      </Specimens>
    </Stack>
  ),
};

const commands: PaletteCommand[] = [
  { id: "assess", group: "Record", label: "Record an assessment", hint: "A", run: () => undefined },
  { id: "export", group: "Record", label: "Export the SSP", hint: "⇧E", run: () => undefined },
  { id: "controls", group: "Go to", label: "Controls", run: () => undefined },
  { id: "findings", group: "Go to", label: "Findings", run: () => undefined },
  { id: "mode", group: "Preferences", label: "Switch the colour mode", run: () => undefined },
];

function PaletteDemo() {
  const palette = useCommandPalette();
  return (
    <Stack space="space.150">
      <Button onClick={() => palette.setOpen(true)}>Open the palette, or press ⌘K</Button>
      <CommandPalette
        open={palette.open}
        onClose={() => palette.setOpen(false)}
        commands={commands}
      />
    </Stack>
  );
}
export const CommandPaletteStory: Story = {
  name: "Command palette",
  render: () => <PaletteDemo />,
};
/** Open, with three groups and hints on two commands: the one state a palette has. */
export const CommandPaletteMatrix: Story = {
  render: () => <CommandPalette open onClose={() => undefined} commands={commands} />,
};

const pickerRecords: PickerRecord[] = [
  {
    id: "EV-0412",
    title: "Firewall ruleset export",
    meta: "Evidence · 12 Aug 2026",
    badge: { label: "Fresh", tone: "success" },
  },
  {
    id: "EV-0388",
    title: "Access review, Q2",
    meta: "Evidence · 30 Jun 2026",
    badge: { label: "Stale", tone: "warning" },
  },
  { id: "EV-0301", title: "Pen test report", meta: "Evidence · 14 Mar 2026" },
  { id: "EV-0290", title: "Backup restore drill", keywords: "dr disaster recovery" },
];

function PickerDemo() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PickerRecord | null>(null);
  return (
    <Stack space="space.150">
      <Inline space="space.100" alignBlock="center">
        <Button onClick={() => setOpen(true)}>Link evidence</Button>
        {picked ? <Text color="color.text.subtle">Linked {picked.id}.</Text> : null}
      </Inline>
      <RecordPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={setPicked}
        records={pickerRecords}
        title="Link evidence"
        placeholder="Search evidence…"
      />
    </Stack>
  );
}
export const RecordPickerStory: Story = { name: "Record picker", render: () => <PickerDemo /> };
/** Open, with a badge, without one, with a meta line, without one. */
export const RecordPickerMatrix: Story = {
  render: () => (
    <RecordPicker
      open
      onClose={() => undefined}
      onPick={() => undefined}
      records={pickerRecords}
      title="Link evidence"
      placeholder="Search evidence…"
    />
  ),
};
