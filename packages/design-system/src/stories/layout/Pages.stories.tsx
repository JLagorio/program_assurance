import type { Meta, StoryObj } from "@storybook/react-vite";
import { createContext, useContext, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ChevronDown, Plus } from "lucide-react";
import {
  Badge,
  Button,
  DataTable,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Editable,
  Field,
  FieldLabel,
  Inline,
  Input,
  KeyValue,
  PageHeader,
  PreviewNavigation,
  Person,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Section,
  Shell,
  Stack,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  defineColumns,
  useDataTable,
  type Tone,
} from "../..";

const meta = { title: "Layout/Pages", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj;
const RecordContext = createContext("Unavailable");

function RecordProperties() {
  const initialOwner = useContext(RecordContext);
  const [owner, setOwner] = useState(initialOwner);
  const [status, setStatus] = useState("In progress");
  return (
    <Shell.Aside label="Record properties">
      <Section title="Properties">
        <KeyValue label="Owner">
          <Editable.Select
            label="Owner"
            value={owner}
            onChange={setOwner}
            save={async () => {}}
            options={[
              initialOwner,
              "Amara Bell",
              "Dan Whitfield",
              "Elena Vasquez",
              "Hana Lindqvist",
              "Joel Barrantes",
              "Marcus Ryde",
              "Priya Raghavan",
              "Sarah Chen",
            ]}
            render={(name) => <Person name={name} />}
          />
        </KeyValue>
        <KeyValue label="Status">
          <Editable.Select<string>
            label="Status"
            value={status}
            onChange={setStatus}
            save={async () => {}}
            options={["In progress", "Ready for review", "Verified"]}
            render={(value) => (
              <Badge tone={value === "Verified" ? "success" : "information"}>{value}</Badge>
            )}
          />
        </KeyValue>
      </Section>
    </Shell.Aside>
  );
}

function RecordPage() {
  const [tab, setTab] = useState("overview");
  const [method, setMethod] = useState("Examine");
  return (
    <RecordContext.Provider value="Alex Morgan">
      <Stack space="space.200">
        <PageHeader>
          <PageHeader.Heading>
            <PageHeader.Title>Review privileged access</PageHeader.Title>
            <PageHeader.Description>REQ-104 · Access management</PageHeader.Description>
          </PageHeader.Heading>
          <PageHeader.Actions>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />} />}>
                Actions
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Request review</DropdownMenuItem>
                <DropdownMenuItem>Approve</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PageHeader.Actions>
        </PageHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="line" aria-label="Record sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Section title="Assessment">
              <Stack space="space.200" className="max-w-layout-measure">
                <Field>
                  <FieldLabel htmlFor="review-method">Assessment method</FieldLabel>
                  <Select
                    value={method}
                    onValueChange={(value) => value && setMethod(value)}
                    items={[
                      { value: "Examine", label: "Examine" },
                      { value: "Test", label: "Test" },
                    ]}
                  >
                    <SelectTrigger id="review-method" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} style={{ width: 300 }}>
                      {[
                        [
                          "Examine",
                          "Review the policy, account register and evidence of completed access reviews.",
                        ],
                        [
                          "Test",
                          "Verify that privileged access expires and revoked accounts cannot sign in.",
                        ],
                      ].map(([value, description]) => (
                        <SelectItem key={value} value={value} label={value} aria-label={value}>
                          <span className="flex min-w-0 flex-col gap-025">
                            <span className="font-medium">{value}</span>
                            <span className="font-body-small text-subtle">{description}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="review-note">Review note</FieldLabel>
                  <Input id="review-note" placeholder="What should the reviewer check?" />
                </Field>
                <Inline space="space.100" shouldWrap>
                  <Button variant="primary">Request review</Button>
                  <Button iconBefore={<Plus />}>Add evidence</Button>
                </Inline>
              </Stack>
            </Section>
          </TabsContent>
          <TabsContent value="evidence">
            <Section title="Evidence" count={2}>
              <Button>Attach evidence</Button>
            </Section>
          </TabsContent>
          {tab === "overview" && <RecordProperties />}
        </Tabs>
      </Stack>
    </RecordContext.Provider>
  );
}

function Queue() {
  const [selected, setSelected] = useState(false);
  const [draft, setDraft] = useState("");
  return (
    <Stack space="space.200">
      <PageHeader>
        <PageHeader.Title>Findings</PageHeader.Title>
        <PageHeader.Actions>
          <Button>Import</Button>
        </PageHeader.Actions>
      </PageHeader>
      <Field>
        <FieldLabel htmlFor="queue-filter">Filter findings</FieldLabel>
        <Input id="queue-filter" placeholder="Search findings" />
      </Field>
      <Button onClick={() => setSelected(true)}>Inspect FND-104</Button>
      {selected && (
        <Shell.Panel
          title="Incomplete account review"
          label="Finding preview"
          onClose={() => setSelected(false)}
          actions={
            <PreviewNavigation
              position={1}
              total={1}
              openLink={<a href="#finding-fnd-104" target="_blank" rel="noopener noreferrer" />}
            />
          }
        >
          <Stack space="space.200">
            <KeyValue label="Owner">Alex Morgan</KeyValue>
            <Field>
              <FieldLabel htmlFor="finding-note">Working note</FieldLabel>
              <Input id="finding-note" value={draft} onValueChange={setDraft} />
            </Field>
            <Table label="Linked records" style={{ minWidth: 800 }}>
              <thead>
                <Table.Row>
                  <Table.Header>Record</Table.Header>
                  <Table.Header>Owner</Table.Header>
                  <Table.Header>Assessment</Table.Header>
                </Table.Row>
              </thead>
              <tbody>
                <Table.Row>
                  <Table.Cell>FND-104</Table.Cell>
                  <Table.Cell>Alex Morgan</Table.Cell>
                  <Table.Cell>Needs review</Table.Cell>
                </Table.Row>
              </tbody>
            </Table>
            <Button>Open full record</Button>
          </Stack>
        </Shell.Panel>
      )}
    </Stack>
  );
}

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
  c.text("title", { header: "Risk", minWidth: 240 }),
  c.status("status", { header: "Status", tone: (r) => riskTone[r.status] }),
  c.person("owner", { header: "Owner" }),
  c.date("updated", { header: "Updated", width: 120 }),
]);

/** A record's register tab: the header, the tab strip, a section heading, and the register filling the rest of the window. A note added above it re-fits the page. */
function RegisterPage() {
  const [noted, setNoted] = useState(false);
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
          <PageHeader.Title>WS-X90 Sentinel Mission System</PageHeader.Title>
          <PageHeader.Description>PRG-1090 · Program</PageHeader.Description>
        </PageHeader.Heading>
        <PageHeader.Actions>
          <Button onClick={() => setNoted(true)}>Add note</Button>
        </PageHeader.Actions>
      </PageHeader>
      <Tabs value="risk">
        <TabsList variant="line" aria-label="Program sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
        </TabsList>
        <TabsContent value="risk">
          <Stack space="space.150" className="pt-200">
            {noted && (
              <Text role="status">
                The register was reviewed on 12 Sep 2026; no risk was closed.
              </Text>
            )}
            <Section title="Risk register">
              <DataTable
                fill
                table={table}
                toolbar={
                  <Inline space="space.100" alignBlock="center" shouldWrap>
                    <DataTable.Search table={table} placeholder="Find risks" />
                    <DataTable.Filter table={table} column="status" />
                    <Inline className="ml-auto" space="space.100" alignBlock="center">
                      <DataTable.Columns table={table} />
                      <Button size="small" variant="primary" iconBefore={<Plus />}>
                        Record risk
                      </Button>
                    </Inline>
                  </Inline>
                }
                empty={{ title: "No risks yet" }}
              />
            </Section>
          </Stack>
        </TabsContent>
      </Tabs>
    </Stack>
  );
}

function Workspace({ initial = "record" }: { initial?: "record" | "queue" | "register" }) {
  const [route, setRoute] = useState(initial);
  return (
    <Shell>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.AppLogo name="Workspace" render={<a href="#home" />} />
        </Shell.TopNav.Start>
        <Shell.TopNav.Middle>
          <Inline space="space.100">
            <Button onClick={() => setRoute("record")}>Record route</Button>
            <Button onClick={() => setRoute("queue")}>Queue route</Button>
            <Button onClick={() => setRoute("register")}>Register route</Button>
          </Inline>
        </Shell.TopNav.Middle>
      </Shell.TopNav>
      <Shell.Main>
        {route === "record" ? <RecordPage /> : route === "queue" ? <Queue /> : <RegisterPage />}
      </Shell.Main>
    </Shell>
  );
}

export const Record: Story = {
  render: () => <Workspace />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shell = canvasElement.querySelector(".shell-root");
    const aside = await canvas.findByRole("complementary", { name: "Record properties" });
    await expect(within(aside).getByText("Alex Morgan")).toBeVisible();
    await expect(canvas.getByRole("main")).not.toContainElement(aside);
    const screen = within(canvasElement.ownerDocument.body);
    const actions = canvas.getByRole("button", { name: "Actions" });
    const restingColor = getComputedStyle(actions).backgroundColor;
    await userEvent.click(actions);
    await screen.findByRole("menu");
    await expect(actions).toHaveAttribute("aria-expanded", "true");
    await expect(actions).not.toHaveAttribute("aria-pressed");
    await waitFor(() => expect(getComputedStyle(actions).backgroundColor).not.toBe(restingColor));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(actions).toHaveFocus());
    await userEvent.click(canvas.getByRole("combobox", { name: "Assessment method" }));
    const examine = await screen.findByRole("option", { name: "Examine" });
    await waitFor(() => expect(within(examine).getByText(/Review the policy/)).toBeVisible());
    await expect(examine.scrollHeight).toBeLessThanOrEqual(examine.clientHeight + 1);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(canvas.getByRole("combobox", { name: "Assessment method" })).toHaveTextContent(
      "Test",
    );
    await userEvent.click(canvas.getByRole("tab", { name: "Evidence" }));
    await waitFor(() =>
      expect(
        canvas.queryByRole("complementary", { name: "Record properties" }),
      ).not.toBeInTheDocument(),
    );
    await expect(canvas.getByRole("tabpanel", { name: "Evidence" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Queue route" }));
    await expect(canvasElement.querySelector(".shell-root")).toBe(shell);
    await expect(
      canvas.queryByRole("complementary", { name: "Record properties" }),
    ).not.toBeInTheDocument();
  },
};

export const QueueWithPanel: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <Workspace initial="queue" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const filter = canvas.getByRole("textbox", { name: "Filter findings" });
    await userEvent.type(filter, "access");
    const opener = canvas.getByRole("button", { name: "Inspect FND-104" });
    await userEvent.click(opener);
    const panel = await canvas.findByRole("complementary", { name: "Incomplete account review" });
    await expect(canvasElement.querySelector("main")).not.toContainElement(panel);
    await waitFor(() => expect(panel.scrollWidth).toBeLessThanOrEqual(panel.clientWidth + 1));
    const wide = window.matchMedia("(min-width: 80rem)").matches;
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
      const resize = canvas.getByRole("separator", { name: "Resize details" });
      resize.focus();
      const before = Number(resize.getAttribute("aria-valuenow"));
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() =>
        expect(Number(resize.getAttribute("aria-valuenow"))).toBeGreaterThan(before),
      );
    }
    await userEvent.click(within(panel).getByRole("button", { name: "Close details" }));
    await waitFor(() => expect(opener).toHaveFocus());
    await expect(filter).toHaveValue("access");
    await userEvent.click(opener);
    const note = await canvas.findByRole("textbox", { name: "Working note" });
    await expect(note).toHaveValue("Request evidence");
    note.focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(opener).toHaveFocus());
    await userEvent.click(opener);
    await userEvent.click(canvas.getByRole("button", { name: "Record route" }));
    await expect(
      canvas.queryByRole("complementary", { name: "Incomplete account review" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("heading", { level: 1, name: "Review privileged access" }),
    ).toBeVisible();
  },
};

/** The register that is the page, inside the shell: it fills the window under the header and the tabs, the pagination sits at Main's bottom inset, and a note added above it keeps the fit. */
export const Register: Story = {
  render: () => <Workspace initial="register" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByRole("table", { name: "Risks" }).parentElement!;
    const fits = async () => {
      await waitFor(() =>
        expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight),
      );
      const pagination = canvas.getByRole("navigation", { name: /pagination/i });
      await expect(pagination.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        window.innerHeight,
      );
      await expect(frame.scrollHeight).toBeGreaterThan(frame.clientHeight);
    };
    await fits();
    frame.scrollTop = 200;
    const header = canvas.getAllByRole("columnheader")[0]!;
    await waitFor(() =>
      expect(
        Math.abs(header.getBoundingClientRect().top - frame.getBoundingClientRect().top),
      ).toBeLessThanOrEqual(1),
    );
    const before = frame.clientHeight;
    await userEvent.click(canvas.getByRole("button", { name: "Add note" }));
    await expect(canvas.getByText(/The register was reviewed/)).toBeVisible();
    await waitFor(() => expect(frame.clientHeight).toBeLessThan(before));
    await fits();
  },
};

/** The same workspace at phone width: a focused panel with the queue retained underneath. */
export const CompactQueue: Story = {
  ...QueueWithPanel,
  globals: { viewport: { value: "ledgerNarrow", isRotated: false } },
};
