import type { Meta, StoryObj } from "@storybook/react-vite";
import { createContext, useContext, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ChevronDown, Plus } from "lucide-react";
import {
  Badge,
  Button,
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
          <div>
            <PageHeader.Title>Review privileged access</PageHeader.Title>
            <PageHeader.Description>REQ-104 · Access management</PageHeader.Description>
          </div>
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
        <Shell.Panel title="FND-104" onClose={() => setSelected(false)}>
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

function Workspace({ initial = "record" }: { initial?: "record" | "queue" }) {
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
          </Inline>
        </Shell.TopNav.Middle>
      </Shell.TopNav>
      <Shell.Main>{route === "record" ? <RecordPage /> : <Queue />}</Shell.Main>
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
  globals: { viewport: { value: "layoutWide", isRotated: false } },
  render: () => <Workspace initial="queue" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const filter = canvas.getByRole("textbox", { name: "Filter findings" });
    await userEvent.type(filter, "access");
    const opener = canvas.getByRole("button", { name: "Inspect FND-104" });
    await userEvent.click(opener);
    const panel = await canvas.findByRole("complementary", { name: "FND-104" });
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
    await expect(canvas.queryByRole("complementary", { name: "FND-104" })).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("heading", { level: 1, name: "Review privileged access" }),
    ).toBeVisible();
  },
};

/** The same workspace at phone width: a focused panel with the queue retained underneath. */
export const CompactQueue: Story = {
  ...QueueWithPanel,
  globals: { viewport: { value: "ledgerNarrow", isRotated: false } },
};
