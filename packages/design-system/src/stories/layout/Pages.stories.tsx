import type { Meta, StoryObj } from "@storybook/react-vite";
import { createContext, useContext, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ChevronDown, MoreHorizontal, Plus } from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  DataTable,
  DateTime,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
  Editable,
  Field,
  FieldLabel,
  HeadingLevelProvider,
  IconButton,
  Inline,
  Input,
  Inspector,
  KeyValue,
  PageHeader,
  Person,
  PreviewNavigation,
  Prose,
  Scroller,
  ScrollerArrow,
  ScrollerViewport,
  Section,
  Shell,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
  Toolbar,
  defineColumns,
  displayedRows,
  showRow,
  tokenValue,
  useDataTable,
  type Tone,
} from "../..";

// Each story is a whole workspace built from this file's own routes, not code to copy, so none is
// in the manifest; the page's prose and Guidance/Recipes carry the composition.
const meta = {
  title: "Layout/Pages",
  tags: ["!manifest"],
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj;
const RecordContext = createContext("Unavailable");

/* ---------- a record page ---------- */

/** The record's Details: state, owner, identifiers and dates, the two a reader changes in place as Editables. The rail beside the body where it fits; on a phone a Details disclosure at the top of Overview, its row carrying the status. */
function RecordDetails() {
  const initialOwner = useContext(RecordContext);
  const [owner, setOwner] = useState(initialOwner);
  const [status, setStatus] = useState("In progress");
  const badge = (
    <Badge variant="secondary" tone={status === "Verified" ? "success" : "information"}>
      {status}
    </Badge>
  );
  return (
    <Shell.Aside label="Details" summary={badge}>
      <Inspector.Group title="Details">
        <KeyValue label="Status">
          <Editable.Select<string>
            label="Status"
            value={status}
            onValueChange={setStatus}
            save={async () => {}}
            options={["In progress", "Ready for review", "Verified"]}
            render={(value) => (
              <Badge variant="secondary" tone={value === "Verified" ? "success" : "information"}>
                {value}
              </Badge>
            )}
          />
        </KeyValue>
        <KeyValue label="Owner">
          <Editable.Select
            label="Owner"
            value={owner}
            onValueChange={setOwner}
            save={async () => {}}
            options={[initialOwner, "Amara Bell", "Dan Whitfield", "Priya Raghavan", "Sarah Chen"]}
            render={(name) => <Person name={name} />}
          />
        </KeyValue>
        <KeyValue label="Identifier">REQ-104</KeyValue>
        <KeyValue label="Updated">
          <DateTime value="2026-09-12" />
        </KeyValue>
      </Inspector.Group>
    </Shell.Aside>
  );
}

type Evidence = { id: string; name: string; state: "Draft" | "Published"; updated: string };
const evidence: Evidence[] = [
  { id: "EVD-210", name: "Quarterly access review", state: "Published", updated: "2026-09-10" },
  { id: "EVD-211", name: "Privileged account register", state: "Published", updated: "2026-09-04" },
  { id: "EVD-212", name: "Revocation test results", state: "Draft", updated: "2026-09-12" },
];
const evidenceColumns = defineColumns<Evidence>((c) => [
  c.id("id"),
  c.text("name", {
    header: "Name",
    minWidth: 200,
    priority: 0,
    cell: (row) => <TextLink href={`#evidence-${row.id}`}>{row.name}</TextLink>,
  }),
  c.status("state", {
    header: "State",
    tone: (row) => (row.state === "Published" ? "success" : "neutral"),
  }),
  c.date("updated", { header: "Updated", width: 120 }),
]);

/** A tab whose only content is a collection: the Toolbar and the table, with no heading over them and no rail beside them. */
function EvidenceTab() {
  const table = useDataTable({
    columns: evidenceColumns,
    data: evidence,
    getRowId: (row) => row.id,
    label: "Evidence",
  });
  return (
    <DataTable
      fill
      responsive
      table={table}
      toolbar={
        <Toolbar
          search={String(table.state.globalFilter ?? "")}
          onSearch={(value) => table.setGlobalFilter(value)}
          placeholder="Search evidence"
          actions={
            <Button size="small" variant="primary" iconBefore={<Plus />}>
              Add evidence
            </Button>
          }
        >
          <DataTable.Columns table={table} />
        </Toolbar>
      }
      empty={{ title: "No evidence yet" }}
    />
  );
}

/** A record: the trail in the Lead with the code as its last level, the name as the h1, one Actions menu; tabs; on Overview the Details, rendered first, and the body's Sections: the rail beside them where it fits, a Details disclosure above them on a phone. */
function RecordPage() {
  const [tab, setTab] = useState("overview");
  return (
    <RecordContext.Provider value="Alex Morgan">
      <Stack space="space.200">
        <PageHeader>
          <PageHeader.Lead render={<Breadcrumb />}>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#requirements">Requirements</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>REQ-104</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </PageHeader.Lead>
          <PageHeader.Heading>
            <PageHeader.Title>Review privileged access</PageHeader.Title>
          </PageHeader.Heading>
          <PageHeader.Actions>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />} />}>
                Actions
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Request review</DropdownMenuItem>
                <DropdownMenuItem>Approve</DropdownMenuItem>
                <DropdownMenuLinkItem href="#schema/requirements/req-104">
                  Inspect record
                </DropdownMenuLinkItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PageHeader.Actions>
        </PageHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="line" aria-label="Requirement sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Stack space="space.300">
              <RecordDetails />
              <Stack space="space.300" className="max-w-layout-measure">
                <Section title="Statement">
                  <Prose>
                    Privileged access to the platform and its supporting services is reviewed every
                    quarter, and access that is no longer needed is revoked within five working
                    days.
                  </Prose>
                </Section>
                <Section title="Acceptance criteria" count={2}>
                  <Prose>
                    {
                      "Every privileged account has a named owner.\nA revoked account cannot sign in."
                    }
                  </Prose>
                </Section>
              </Stack>
            </Stack>
          </TabsContent>
          <TabsContent value="evidence">
            <EvidenceTab />
          </TabsContent>
        </Tabs>
      </Stack>
    </RecordContext.Provider>
  );
}

/* ---------- a register ---------- */

type Risk = {
  id: string;
  title: string;
  status: "Open" | "Mitigated" | "Accepted";
  owner: string;
  updated: string;
};
const riskTitles = [
  "A password on its own reaches the flightline",
  "Payload telemetry maintenance happens outside the work-order gate",
  "Unlisted hardware was announced onto the internal segment",
  "Primary and alternate bearers converge on one switch port group",
];
const riskOwners = ["Alex Morgan", "Dana Whitfield", "Marcus Ryde", "Priya Raghavan"];
const riskStatuses: Risk["status"][] = ["Open", "Open", "Mitigated", "Accepted"];
const riskTone: Record<Risk["status"], Tone> = {
  Open: "warning",
  Mitigated: "success",
  Accepted: "neutral",
};
const risks: Risk[] = Array.from({ length: 60 }, (_, i) => ({
  id: `RSK-${100 + i}`,
  title: riskTitles[i % riskTitles.length] ?? "",
  status: riskStatuses[(i * 3) % riskStatuses.length] ?? "Open",
  owner: riskOwners[(i * 7) % riskOwners.length] ?? "",
  updated: `2026-0${1 + (i % 9)}-${String(1 + (i % 28)).padStart(2, "0")}`,
}));
const riskColumns = defineColumns<Risk>((c) => [
  c.id("id"),
  c.text("title", {
    header: "Risk",
    minWidth: 200,
    priority: 0,
    cell: (row) => <TextLink href={`#risk-${row.id}`}>{row.title}</TextLink>,
  }),
  c.status("status", { header: "Status", tone: (r) => riskTone[r.status] }),
  c.person("owner", { header: "Owner" }),
  c.date("updated", { header: "Updated", width: 120 }),
]);

/** A page that is one collection: the name alone in the header, then the table filling the rest of the window under its Toolbar (the search, the saved views, a filter, Columns, Settings and the collection's overflow, and one small primary). A failed refresh keeps the rows under one alert with Retry, and the table re-fits under it. */
function RegisterPage() {
  const [refreshFailed, setRefreshFailed] = useState(false);
  const table = useDataTable({
    columns: riskColumns,
    data: risks,
    getRowId: (r) => r.id,
    pageSize: 20,
    label: "Risks",
  });
  return (
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Risks</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {refreshFailed && (
        <Alert variant="danger">
          <AlertTitle>The risks could not be refreshed</AlertTitle>
          <AlertDescription>The rows below are the ones loaded before.</AlertDescription>
          <AlertAction>
            <Button size="small" onClick={() => setRefreshFailed(false)}>
              Retry
            </Button>
          </AlertAction>
        </Alert>
      )}
      <DataTable
        fill
        responsive
        table={table}
        toolbar={
          <Toolbar
            search={String(table.state.globalFilter ?? "")}
            onSearch={(value) => table.setGlobalFilter(value)}
            placeholder="Search risks"
            views={
              <DataTable.Presets
                table={table}
                variant="menu"
                presets={[
                  { id: "all", label: "All risks" },
                  { id: "open", label: "Open", filters: [{ id: "status", value: ["Open"] }] },
                ]}
              />
            }
            filters={<DataTable.Filter table={table} column="status" />}
            actions={
              <Button size="small" variant="primary" iconBefore={<Plus />}>
                Create risk
              </Button>
            }
          >
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <IconButton
                    label="Collection actions"
                    icon={<MoreHorizontal />}
                    size="small"
                    variant="secondary"
                  />
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRefreshFailed(true)}>Refresh</DropdownMenuItem>
                <DropdownMenuItem>Export</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Toolbar>
        }
        empty={{ title: "No risks yet" }}
      />
    </Stack>
  );
}

/* ---------- a preview beside a register ---------- */

type Finding = {
  id: string;
  title: string;
  status: "Open" | "In review" | "Closed";
  owner: string;
  due: string;
};
const findings: Finding[] = [
  {
    id: "FND-104",
    title: "Incomplete account review",
    status: "Open",
    owner: "Alex Morgan",
    due: "2026-10-15",
  },
  {
    id: "FND-105",
    title: "Stale access for departed staff",
    status: "In review",
    owner: "Priya Raghavan",
    due: "2026-10-22",
  },
  {
    id: "FND-106",
    title: "Shared administrator credentials",
    status: "Open",
    owner: "Marcus Ryde",
    due: "2026-11-01",
  },
];
const findingTone: Record<Finding["status"], Tone> = {
  Open: "warning",
  "In review": "information",
  Closed: "success",
};

const findingColumns = defineColumns<Finding>((c) => [
  c.id("id"),
  c.text("title", {
    header: "Finding",
    minWidth: 200,
    priority: 0,
    cell: (row) => <TextLink href={`#finding-${row.id}`}>{row.title}</TextLink>,
  }),
  c.status("status", { header: "Status", tone: (row) => findingTone[row.status] }),
  c.person("owner", { header: "Owner" }),
  c.date("due", { header: "Due", width: 120 }),
]);

/** The register of findings: its name alone in the header, then the table. The eye on each row's id opens the preview beside it, and the table stays mounted underneath, so its search survives. */
function Queue() {
  const [selected, setSelected] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const table = useDataTable({
    columns: findingColumns,
    data: findings,
    getRowId: (row) => row.id,
    label: "Findings",
    preview: {
      onPreview: (row) => setSelected(row.id),
      activeId: selected,
    },
  });
  // Previous and next walk every row the search and filters leave, across pages.
  const order = displayedRows(table).map((row) => row.id);
  const position = selected ? order.indexOf(selected) + 1 : 0;
  const step = (by: number) => {
    const next = order[position - 1 + by];
    if (!next) return;
    showRow(table, next);
    setSelected(next);
  };
  const finding = findings.find((row) => row.id === selected);
  return (
    <Stack space="space.200" className="min-w-0">
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Findings</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      <DataTable
        fill
        responsive
        table={table}
        toolbar={
          <Toolbar
            search={String(table.state.globalFilter ?? "")}
            onSearch={(value) => table.setGlobalFilter(value)}
            placeholder="Search findings"
            actions={
              <Button size="small" variant="primary" iconBefore={<Plus />}>
                Create finding
              </Button>
            }
          >
            <DataTable.Columns table={table} />
          </Toolbar>
        }
        empty={{ title: "No findings yet" }}
      />
      {finding && (
        <Shell.Panel label="Finding preview" onClose={() => setSelected(null)}>
          <Shell.Panel.Splitter />
          <Shell.Panel.Header>
            <Shell.Panel.Actions>
              <PreviewNavigation
                position={position}
                total={order.length}
                recordLabel={finding.title}
                onPrevious={() => step(-1)}
                onNext={() => step(1)}
                openLink={
                  <a href={`#finding-${finding.id}`} target="_blank" rel="noopener noreferrer" />
                }
              />
            </Shell.Panel.Actions>
            <Shell.Panel.Close />
          </Shell.Panel.Header>
          <Shell.Panel.Body>
            <Stack space="space.200">
              <PageHeader>
                <PageHeader.Heading>
                  <PageHeader.Title>{finding.title}</PageHeader.Title>
                </PageHeader.Heading>
                <PageHeader.Actions>
                  <Button size="small" variant="primary">
                    Edit finding
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <IconButton
                          label="More finding actions"
                          icon={<MoreHorizontal />}
                          size="small"
                          variant="subtle"
                        />
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Close finding</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </PageHeader.Actions>
              </PageHeader>
              <HeadingLevelProvider>
                <Stack space="space.200">
                  <KeyValue.Group>
                    <KeyValue label="Identifier">{finding.id}</KeyValue>
                    <KeyValue label="Status">
                      <Badge variant="secondary" tone={findingTone[finding.status]}>
                        {finding.status}
                      </Badge>
                    </KeyValue>
                    <KeyValue label="Owner">
                      <Person name={finding.owner} />
                    </KeyValue>
                    <KeyValue label="Due">
                      <DateTime value={finding.due} />
                    </KeyValue>
                  </KeyValue.Group>
                  <Field>
                    <FieldLabel htmlFor="finding-note">Working note</FieldLabel>
                    <Input
                      id="finding-note"
                      value={drafts[finding.id] ?? ""}
                      onValueChange={(value) =>
                        setDrafts((current) => ({ ...current, [finding.id]: value }))
                      }
                    />
                  </Field>
                  <Section title="Linked records">
                    <Prose>Two controls and one test run cite this finding.</Prose>
                  </Section>
                </Stack>
              </HeadingLevelProvider>
            </Stack>
          </Shell.Panel.Body>
        </Shell.Panel>
      )}
    </Stack>
  );
}
/* ---------- the workspace ---------- */

function Workspace({ initial = "record" }: { initial?: "record" | "queue" | "register" }) {
  const [route, setRoute] = useState(initial);
  return (
    <Shell>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.AppLogo name="Workspace" render={<a href="#home" />} />
        </Shell.TopNav.Start>
        <Shell.TopNav.Middle>
          <Scroller orientation="horizontal" className="max-w-full">
            <ScrollerViewport role="group" aria-label="Example routes">
              <Inline space="space.100" className="w-max">
                <Button onClick={() => setRoute("record")}>Record route</Button>
                <Button onClick={() => setRoute("queue")}>Queue route</Button>
                <Button onClick={() => setRoute("register")}>Register route</Button>
              </Inline>
            </ScrollerViewport>
            <ScrollerArrow edge="start" />
            <ScrollerArrow edge="end" />
          </Scroller>
        </Shell.TopNav.Middle>
      </Shell.TopNav>
      <Shell.Main>
        {route === "record" ? <RecordPage /> : route === "queue" ? <Queue /> : <RegisterPage />}
      </Shell.Main>
    </Shell>
  );
}

/** A record page: the trail, the name and one Actions menu; tabs; the body's Sections on Overview with the Details rail beside them, which leaves with the tab; and a tab that is a register, which fills the work area. */
export const Record: Story = {
  render: Workspace,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shell = canvasElement.querySelector('[data-slot="shell"]');
    const asideOf = () => canvasElement.querySelector('[data-slot="shell-aside"]');
    // One h1, the name; the code is the trail's last level, not the title.
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const trail = canvas.getByRole("navigation", { name: "Breadcrumb" });
    await expect(within(trail).getByRole("link", { current: "page" })).toHaveTextContent("REQ-104");
    // The page header is not a landmark: the top nav is the page's one banner.
    await expect(canvas.getAllByRole("banner")).toHaveLength(1);
    await expect(
      canvasElement.querySelector('[data-slot="page-header-description"]'),
    ).not.toBeInTheDocument();
    if (window.matchMedia(`(width >= ${tokenValue("dimension.breakpoint.aside")})`).matches) {
      // The Details rail is the Aside, outside Main, with its group at h2 under the page's h1.
      const aside = await canvas.findByRole("complementary", { name: "Details" });
      await expect(canvas.getByRole("main")).not.toContainElement(aside);
      await expect(within(aside).getByRole("heading", { name: "Details" }).tagName).toBe("H2");
      await expect(within(aside).getByText("Alex Morgan")).toBeVisible();
      await expect(within(aside).getByText("REQ-104")).toBeVisible();
    } else {
      // On a phone the Details are a disclosure at the top of Overview, inside Main: its row, an
      // h2's button, carries the status, closed until the reader opens it.
      const details = await canvas.findByRole("region", { name: "Details" });
      await expect(canvas.getByRole("main")).toContainElement(details);
      const toggle = within(details).getByRole("button", { name: /^Details\s*In progress$/ });
      await expect(toggle.closest("h2")).not.toBeNull();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(toggle);
      await waitFor(() => expect(within(details).getByText("Alex Morgan")).toBeVisible());
      await expect(within(details).getByText("REQ-104")).toBeVisible();
    }
    // The body's Sections sit under the h1.
    await expect(canvas.getByRole("heading", { name: "Statement" }).tagName).toBe("H2");
    const screen = within(canvasElement.ownerDocument.body);
    const actions = canvas.getByRole("button", { name: "Actions" });
    const restingColor = getComputedStyle(actions).backgroundColor;
    await userEvent.click(actions);
    const menu = await screen.findByRole("menu");
    await expect(actions).toHaveAttribute("aria-expanded", "true");
    await expect(actions).not.toHaveAttribute("aria-pressed");
    await waitFor(() => expect(getComputedStyle(actions).backgroundColor).not.toBe(restingColor));
    // A destination in the menu is a link, the last item.
    const items = within(menu).getAllByRole("menuitem");
    await expect(items.at(-1)).toHaveTextContent("Inspect record");
    await expect(items.at(-1)?.tagName).toBe("A");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(actions).toHaveFocus());
    // A tab that is a register: the Toolbar first, no heading over it, no rail beside it.
    await userEvent.click(canvas.getByRole("tab", { name: "Evidence" }));
    await waitFor(() => expect(asideOf()).not.toBeInTheDocument());
    const panel = canvas.getByRole("tabpanel", { name: "Evidence" });
    await expect(panel).toBeVisible();
    await expect(within(panel).queryByRole("heading")).toBeNull();
    await expect(within(panel).getByRole("searchbox", { name: "Search evidence" })).toBeVisible();
    await expect(
      within(panel).getByRole("link", { name: "Quarterly access review" }),
    ).toHaveAttribute("href", "#evidence-EVD-210");
    await userEvent.click(canvas.getByRole("button", { name: "Queue route" }));
    await expect(canvasElement.querySelector('[data-slot="shell"]')).toBe(shell);
    await expect(asideOf()).not.toBeInTheDocument();
  },
};

export const QueueWithPanel: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <Workspace initial="queue" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "Search findings" });
    await userEvent.type(search, "account");
    // The eye sits on the row's first value: the id, or the name where the id has folded away.
    const eye = /^Preview (FND-104|Incomplete account review)$/;
    const opener = await canvas.findByRole("button", { name: eye });
    await userEvent.click(opener);
    // The landmark is named by its label, never by the record.
    const panel = await canvas.findByRole("complementary", { name: "Finding preview" });
    await expect(canvasElement.querySelector("main")).not.toContainElement(panel);
    await waitFor(() => expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth + 1));
    // The outer header is navigation only; the inner PageHeader names the record as its h2.
    const outer = panel.querySelector<HTMLElement>('[data-slot="shell-panel-header"]')!;
    await expect(within(outer).queryByRole("heading")).toBeNull();
    await expect(within(outer).queryByText("Incomplete account review")).toBeNull();
    await expect(within(outer).getByRole("button", { name: "Next record" })).toBeVisible();
    await expect(within(outer).getByRole("link", { name: /^Open full record/ })).toHaveAttribute(
      "href",
      "#finding-FND-104",
    );
    const title = within(panel).getByRole("heading", { name: "Incomplete account review" });
    await expect(title.tagName).toBe("H2");
    await expect(title).toHaveAttribute("data-slot", "page-header-title");
    await expect(within(panel).getByRole("heading", { name: "Linked records" }).tagName).toBe("H3");
    await expect(within(panel).getByRole("button", { name: "Edit finding" })).toBeVisible();
    await expect(
      within(panel).queryByRole("button", { name: "Open full record" }),
    ).not.toBeInTheDocument();
    // From the large breakpoint the panel sits beside Main; below it, it replaces Main.
    const wide = window.matchMedia("(min-width: 64rem)").matches;
    if (!wide) {
      await expect(canvasElement.querySelector("main")).not.toBeVisible();
      await expect(
        canvas.queryByRole("link", { name: "Skip to main content" }),
      ).not.toBeInTheDocument();
      await waitFor(() => expect(panel).toHaveFocus());
    }
    await userEvent.type(
      within(panel).getByRole("textbox", { name: "Working note" }),
      "Request evidence",
    );
    if (wide) {
      // Beside the page the panel is the full height of the window; the top nav stops at its edge.
      await waitFor(() => {
        const box = panel.getBoundingClientRect();
        expect(box.top).toBe(0);
        expect(Math.abs(box.height - window.innerHeight)).toBeLessThanOrEqual(1);
        expect(
          canvas.getByRole("banner", { name: "Top navigation" }).getBoundingClientRect().right,
        ).toBeLessThanOrEqual(box.left + 1);
      });
      const resize = canvas.getByRole("separator", { name: "Resize Finding preview" });
      resize.focus();
      const before = Number(resize.getAttribute("aria-valuenow"));
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() =>
        expect(Number(resize.getAttribute("aria-valuenow"))).toBeGreaterThan(before),
      );
    }
    await userEvent.click(within(panel).getByRole("button", { name: "Close Finding preview" }));
    await waitFor(() => expect(opener).toHaveFocus());
    await expect(search).toHaveValue("account");
    await userEvent.click(opener);
    const note = await canvas.findByRole("textbox", { name: "Working note" });
    await expect(note).toHaveValue("Request evidence");
    note.focus();
    // Escape in a field belongs to the field: the panel stays open and the note keeps focus.
    await userEvent.keyboard("{Escape}");
    await expect(note).toHaveFocus();
    const reopened = canvas.getByRole("complementary", { name: "Finding preview" });
    // Outside a field, Escape closes the panel and focus returns to the opener.
    reopened.focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(opener).toHaveFocus());
    // Previous and next follow the table's displayed rows: with the search cleared, all three.
    await userEvent.clear(search);
    await userEvent.click(await canvas.findByRole("button", { name: eye }));
    const walking = await canvas.findByRole("complementary", { name: "Finding preview" });
    // The position is said with the record's name, once the region has settled.
    await waitFor(() =>
      expect(within(walking).getByRole("status")).toHaveTextContent(
        /Incomplete account review.*\b1 of 3\b/,
      ),
    );
    await userEvent.click(within(walking).getByRole("button", { name: "Next record" }));
    await expect(
      within(walking).getByRole("heading", { name: "Stale access for departed staff" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(within(walking).getByRole("status")).toHaveTextContent(
        /Stale access for departed staff.*\b2 of 3\b/,
      ),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Record route" }));
    await expect(
      canvas.queryByRole("complementary", { name: "Finding preview" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("heading", { level: 1, name: "Review privileged access" }),
    ).toBeVisible();
  },
};

/** The register that is the page, inside the shell: it fills the window under its header, the pagination sits at Main's bottom inset, the frame never shows fewer than six rows under its toolbar, and an alert that appears above it keeps the fit. */
export const Register: Story = {
  render: () => <Workspace initial="register" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByRole("table", { name: "Risks" }).parentElement!;
    const tokens = getComputedStyle(document.documentElement);
    const rows =
      parseFloat(tokens.getPropertyValue("--ds-dimension-row-header")) +
      6 * parseFloat(tokens.getPropertyValue("--ds-dimension-row"));
    const rem = parseFloat(tokens.fontSize);
    const fits = async () => {
      await waitFor(() =>
        expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight),
      );
      const pagination = canvas.getByRole("navigation", { name: /pagination/i });
      await expect(pagination.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        window.innerHeight,
      );
      await expect(frame.scrollHeight).toBeGreaterThan(frame.clientHeight);
      // Never fewer than a header and six rows, whatever the toolbar above takes.
      await expect(frame.clientHeight).toBeGreaterThanOrEqual(rows * rem - 1);
    };
    await fits();
    frame.scrollTop = 200;
    const header = canvas.getAllByRole("columnheader")[0]!;
    await waitFor(() =>
      expect(
        Math.abs(header.getBoundingClientRect().top - frame.getBoundingClientRect().top),
      ).toBeLessThanOrEqual(1),
    );
    // The header is the name alone; the toolbar's search comes first and holds the one primary.
    const pageHeader = canvasElement.querySelector<HTMLElement>('[data-slot="page-header"]')!;
    await expect(within(pageHeader).queryByRole("button")).toBeNull();
    await expect(
      pageHeader.querySelector('[data-slot="page-header-description"]'),
    ).not.toBeInTheDocument();
    await expect(canvas.getByRole("searchbox", { name: "Search risks" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Create risk" })).toBeVisible();
    // The name is a link to the record.
    await expect(canvas.getAllByRole("link", { name: riskTitles[0] ?? "" })[0]).toHaveAttribute(
      "href",
      "#risk-RSK-100",
    );
    // A failed refresh keeps the rows under one alert, and the table re-fits under it.
    const before = frame.clientHeight;
    // The overflow sits beside Columns and Settings, or in More when the row runs out of room.
    const inline = canvas.queryByRole("button", { name: "Collection actions" });
    if (!inline?.checkVisibility())
      await userEvent.click(canvas.getByRole("button", { name: /^More filters/ }));
    await userEvent.click(
      await within(document.body).findByRole("button", { name: "Collection actions" }),
    );
    await userEvent.click(await within(document.body).findByRole("menuitem", { name: "Refresh" }));
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "The risks could not be refreshed",
    );
    await waitFor(() => expect(frame.clientHeight).toBeLessThan(before));
    await fits();
  },
};

/** The same workspace at phone width: a focused panel with the queue retained underneath. */
export const CompactQueue: Story = {
  ...QueueWithPanel,
  globals: { viewport: { value: "ledgerNarrow", isRotated: false } },
  play: async (context) => {
    await QueueWithPanel.play?.(context);
    const canvas = within(context.canvasElement);
    const routes = canvas.getByRole("group", { name: "Example routes" });
    canvas.getByRole("button", { name: "Record route" }).focus();
    await userEvent.tab();
    await userEvent.tab();
    const last = canvas.getByRole("button", { name: "Register route" });
    await expect(last).toHaveFocus();
    await waitFor(() => {
      expect(last.getBoundingClientRect().right).toBeLessThanOrEqual(
        routes.getBoundingClientRect().right + 1,
      );
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 1);
    });
  },
};

/* ---------- focus and the sticky shell ---------- */

function FocusInView() {
  return (
    <Shell>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.AppLogo name="Workspace" render={<a href="#home" />} />
        </Shell.TopNav.Start>
      </Shell.TopNav>
      <Shell.Main>
        <Stack space="space.300">
          <PageHeader>
            <PageHeader.Heading>
              <PageHeader.Title>Controls</PageHeader.Title>
            </PageHeader.Heading>
          </PageHeader>
          <Section title="Recently changed">
            {/* A list one row tall that scrolls inside itself. */}
            <div
              role="group"
              aria-label="Recently changed controls"
              className="h-500 overflow-y-auto"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex h-500 items-center px-050">
                  <Button size="small">{`CTRL-${400 + i}`}</Button>
                </div>
              ))}
            </div>
          </Section>
          <Section title="All controls">
            <Stack space="space.300">
              {Array.from({ length: 40 }, (_, i) => (
                <div key={i}>
                  <Button size="small">{`Open CTRL-${500 + i}`}</Button>
                </div>
              ))}
            </Stack>
          </Section>
        </Stack>
      </Shell.Main>
    </Shell>
  );
}

/** Focus stays in view. The page keeps what focus scrolls to clear of the sticky top nav (its scroll padding is the top nav's height and `space.200`); a list that scrolls inside itself brings each focused row wholly into its own view, with no page margin taller than the list. */
export const FocusStaysInView: Story = {
  name: "Focus stays in view",
  render: () => <FocusInView />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = document.documentElement;
    const topNav = canvas.getByRole("banner", { name: "Top navigation" });
    const tall = window.innerHeight >= 480;
    if (tall)
      await expect(parseFloat(getComputedStyle(root).scrollPaddingTop)).toBe(
        Math.round(topNav.getBoundingClientRect().height) + 16,
      );
    // Every row of the one-row list comes wholly into the list's view as it takes focus.
    const list = canvas.getByRole("group", { name: "Recently changed controls" });
    const first = within(list).getByRole("button", { name: "CTRL-400" });
    first.focus();
    for (let i = 0; i < 6; i++) {
      const row = within(list).getByRole("button", { name: `CTRL-${400 + i}` });
      if (i > 0) await userEvent.tab();
      await expect(row).toHaveFocus();
      await waitFor(() => {
        const box = row.getBoundingClientRect();
        const view = list.getBoundingClientRect();
        expect(box.top).toBeGreaterThanOrEqual(view.top - 0.5);
        expect(box.bottom).toBeLessThanOrEqual(view.bottom + 0.5);
      });
    }
    // A control under the sticky top nav scrolls out from under it when it takes focus.
    if (tall) {
      const target = canvas.getByRole("button", { name: "Open CTRL-520" });
      window.scrollTo({ top: 0, behavior: "instant" });
      const offset = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: offset - 8, behavior: "instant" });
      target.focus();
      await waitFor(() =>
        expect(target.getBoundingClientRect().top).toBeGreaterThanOrEqual(
          topNav.getBoundingClientRect().bottom,
        ),
      );
    }
  },
};
