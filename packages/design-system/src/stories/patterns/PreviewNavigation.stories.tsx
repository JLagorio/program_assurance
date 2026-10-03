import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { LedgerProvider, PageHeader, PreviewNavigation, Shell, Stack, Text } from "../..";
import { Button, KeyValue } from "../../components";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const meta = {
  title: "Patterns/PreviewNavigation",
  component: PreviewNavigation,
  parameters: { layout: "centered" },
} satisfies Meta<typeof PreviewNavigation>;
export default meta;
type Story = StoryObj;

const records = ["Access review evidence", "Recovery exercise evidence", "Audit log retention"];

function Example({ showPosition = false }: { showPosition?: boolean }) {
  const [position, setPosition] = useState(1);
  const name = records[position - 1];
  return (
    <Stack space="space.150">
      <Text>{name}</Text>
      <PreviewNavigation
        position={position}
        total={records.length}
        recordLabel={name}
        showPosition={showPosition}
        onPrevious={() => setPosition((value) => value - 1)}
        onNext={() => setPosition((value) => value + 1)}
        openLink={<a href={`#record-${position}`} target="_blank" rel="noopener noreferrer" />}
      />
    </Stack>
  );
}

/** A preview inside a selection task (RecordBrowser, PickerSheet) belongs to the task: it steps through the results and opens no record of its own. */
export const InTask: Story = {
  name: "In a selection task",
  render: () => {
    function Task() {
      const [position, setPosition] = useState(2);
      return (
        <PreviewNavigation
          position={position}
          total={records.length}
          recordLabel={records[position - 1]}
          onPrevious={() => setPosition((value) => value - 1)}
          onNext={() => setPosition((value) => value + 1)}
        />
      );
    }
    return <Task />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Record navigation" });
    await expect(within(group).queryByRole("link")).toBeNull();
    await userEvent.click(within(group).getByRole("button", { name: "Next record" }));
    await expect(within(group).getByRole("status")).toHaveTextContent(
      "Audit log retention, 3 of 3 records",
    );
  },
};

/** Previous, next and the full record. The status says which record arrived and where it sits; at an endpoint the button stays focused and unavailable, so a repeated Enter stays put. */
export const Collection: Story = {
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Record navigation" });
    const status = within(group).getByRole("status");
    const previous = canvas.getByRole("button", { name: "Previous record" });
    const next = canvas.getByRole("button", { name: "Next record" });
    // The first record is said once the status has settled, so opening a preview is heard.
    await waitFor(() => expect(status).toHaveTextContent("Access review evidence, 1 of 3 records"));
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(next);
    await expect(status).toHaveTextContent("Recovery exercise evidence, 2 of 3 records");
    await expect(canvas.getByRole("link", { name: "Open full record in new tab" })).toHaveAttribute(
      "href",
      "#record-2",
    );
    await userEvent.click(next);
    await expect(status).toHaveTextContent("Audit log retention, 3 of 3 records");
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toHaveFocus();
    // Enter again at the end changes nothing and keeps focus: it never walks back.
    await userEvent.keyboard("{Enter}");
    await expect(status).toHaveTextContent("Audit log retention, 3 of 3 records");
    await expect(next).toHaveFocus();
    // Both buttons stay in the tab order at an endpoint.
    await userEvent.tab({ shift: true });
    await expect(previous).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(status).toHaveTextContent("Recovery exercise evidence, 2 of 3 records");
    await expect(previous).toHaveFocus();
  },
};

/** `showPosition` draws the position before the buttons; the status still says it with the record's name. */
export const VisiblePosition: Story = {
  name: "Visible position",
  render: () => <Example showPosition />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const position = canvasElement.querySelector(
      '[data-slot="preview-navigation-position"]',
    ) as HTMLElement;
    await expect(position).toHaveTextContent("1 of 3");
    await expect(position).toHaveAttribute("aria-hidden", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Next record" }));
    await expect(position).toHaveTextContent("2 of 3");
  },
};

/** A filter took the record out of the results: both buttons are unavailable and say why, and the full-record link stays. With `showPosition` the bar says it too. */
export const OutsideResults: Story = {
  name: "Outside results",
  render: () => (
    <Stack space="space.200">
      <PreviewNavigation
        position={0}
        total={3}
        recordLabel="Access review evidence"
        openLink={<a href="#record" target="_blank" rel="noopener noreferrer" />}
      />
      <PreviewNavigation
        position={0}
        total={3}
        showPosition
        openLink={<a href="#record" target="_blank" rel="noopener noreferrer" />}
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openTooltip = () =>
      canvasElement.ownerDocument.querySelector('[data-slot="tooltip-content"][data-open]');
    const [named, plain] = canvas.getAllByRole("group", { name: "Record navigation" });
    await waitFor(() =>
      expect(within(named!).getByRole("status")).toHaveTextContent(
        "Access review evidence, outside the current results",
      ),
    );
    await waitFor(() =>
      expect(within(plain!).getByRole("status")).toHaveTextContent(
        "Record outside the current results",
      ),
    );
    await expect(within(plain!).getByText("Not in results")).toBeVisible();
    const next = within(named!).getByRole("button", { name: "Next record" });
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toHaveAccessibleDescription("Record outside the current results");
    // In forced colours an unavailable step is GrayText, as a native disabled button is, though it
    // stays in the tab order.
    if (window.matchMedia("(forced-colors: active)").matches) {
      const native = canvasElement.ownerDocument.createElement("button");
      native.disabled = true;
      canvasElement.append(native);
      await expect(getComputedStyle(next).color).toBe(getComputedStyle(native).color);
      native.remove();
    }
    // Unavailable, yet reachable: Tab reaches both buttons, and focus shows why.
    await userEvent.tab();
    await expect(within(named!).getByRole("button", { name: "Previous record" })).toHaveFocus();
    await userEvent.tab();
    await expect(next).toHaveFocus();
    await waitFor(() =>
      expect(openTooltip()).toHaveTextContent("Record outside the current results"),
    );
    await userEvent.keyboard("{Escape}");
    await expect(
      within(named!).getByRole("link", { name: "Open full record in new tab" }),
    ).toHaveAttribute("href", "#record");
  },
};

function PanelExample() {
  const [position, setPosition] = useState<number | null>(null);
  const name = position ? records[position - 1] : undefined;
  return (
    <Shell>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Text>Program Assurance</Text>
        </Shell.TopNav.Start>
      </Shell.TopNav>
      <Shell.Main>
        <Stack space="space.200">
          <PageHeader>
            <PageHeader.Heading>
              <PageHeader.Title>Evidence</PageHeader.Title>
            </PageHeader.Heading>
          </PageHeader>
          {records.map((record, index) => (
            <Button key={record} onClick={() => setPosition(index + 1)}>
              Preview {record}
            </Button>
          ))}
        </Stack>
      </Shell.Main>
      {position && name ? (
        <Shell.Panel label="Evidence preview" onClose={() => setPosition(null)}>
          <Shell.Panel.Splitter />
          <Shell.Panel.Header>
            <Shell.Panel.Actions>
              <PreviewNavigation
                position={position}
                total={records.length}
                recordLabel={name}
                onPrevious={position > 1 ? () => setPosition(position - 1) : undefined}
                onNext={position < records.length ? () => setPosition(position + 1) : undefined}
                openLink={
                  <a href={`#evidence-${position}`} target="_blank" rel="noopener noreferrer" />
                }
              />
            </Shell.Panel.Actions>
            <Shell.Panel.Close />
          </Shell.Panel.Header>
          <Shell.Panel.Body>
            <Stack space="space.200">
              <PageHeader>
                <PageHeader.Heading>
                  <PageHeader.Title>{name}</PageHeader.Title>
                </PageHeader.Heading>
                <PageHeader.Actions>
                  <Button size="small" variant="primary">
                    Edit evidence
                  </Button>
                </PageHeader.Actions>
              </PageHeader>
              <KeyValue.Group>
                <KeyValue label="Owner">Dana Whitfield</KeyValue>
                <KeyValue label="Status">Awaiting review</KeyValue>
              </KeyValue.Group>
            </Stack>
          </Shell.Panel.Body>
        </Shell.Panel>
      ) : null}
    </Shell>
  );
}

/** In context: the panel's outer bar holds only the navigation and Close, and is named by `label`; the record's name and its actions are the inner PageHeader, its title the h2. */
export const InPanel: Story = {
  name: "In the panel",
  parameters: { layout: "fullscreen" },
  render: () => <PanelExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole("button", { name: "Preview Recovery exercise evidence" });
    await userEvent.click(opener);
    const panel = await canvas.findByRole("complementary", { name: "Evidence preview" });
    const outer = panel.querySelector('[data-slot="shell-panel-header"]') as HTMLElement;
    await expect(within(outer).queryByRole("heading")).toBeNull();
    await expect(within(outer).queryByText("Recovery exercise evidence")).toBeNull();
    await expect(within(outer).getByRole("group", { name: "Record navigation" })).toBeVisible();
    const title = within(panel).getByRole("heading", {
      level: 2,
      name: "Recovery exercise evidence",
    });
    await expect(title.closest('[data-slot="page-header"]')).not.toBeNull();
    await expect(within(panel).getByRole("button", { name: "Edit evidence" })).toBeVisible();
    const status = within(outer).getByRole("status");
    await waitFor(() =>
      expect(status).toHaveTextContent("Recovery exercise evidence, 2 of 3 records"),
    );
    const next = within(outer).getByRole("button", { name: "Next record" });
    await userEvent.click(next);
    await expect(
      within(panel).getByRole("heading", { level: 2, name: "Audit log retention" }),
    ).toBeVisible();
    await expect(status).toHaveTextContent("Audit log retention, 3 of 3 records");
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toHaveFocus();
    // Escape closes a tooltip open in the panel first; with none open it closes the panel.
    await userEvent.unhover(next);
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[data-slot="tooltip-content"][data-open]'),
      ).toBeNull(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("complementary")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

/** Every word is a LedgerProvider message; right to left, the chevrons point the way the records go. */
export const Localized: Story = {
  render: () => (
    <Stack space="space.300">
      <LedgerProvider
        locale="es"
        messages={{
          previousRecord: "Registro anterior",
          nextRecord: "Registro siguiente",
          openFullRecord: "Abrir registro en otra pestaña",
          recordPosition: "Registro {position} de {total}",
          recordPositionNamed: "{record}, registro {position} de {total}",
          recordNavigation: "Navegación de registros",
        }}
      >
        <Example />
      </LedgerProvider>
      <div data-testid="rtl">
        <LedgerProvider
          locale="ar-EG"
          direction="rtl"
          messages={{
            previousRecord: "السجل السابق",
            nextRecord: "السجل التالي",
            openFullRecord: "فتح السجل كاملًا في علامة تبويب جديدة",
            recordPositionNamed: "{record}، {position} من {total}",
            recordNavigation: "التنقل بين السجلات",
          }}
        >
          <Example />
        </LedgerProvider>
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const spanish = within(canvas.getByRole("group", { name: "Navegación de registros" }));
    await userEvent.click(spanish.getByRole("button", { name: "Registro siguiente" }));
    await expect(spanish.getByRole("status")).toHaveTextContent(
      "Recovery exercise evidence, registro 2 de 3",
    );
    await expect(spanish.getByRole("button", { name: "Registro anterior" })).not.toHaveAttribute(
      "aria-disabled",
    );
    await expect(
      spanish.getByRole("link", { name: "Abrir registro en otra pestaña" }),
    ).toHaveAttribute("href", "#record-2");
    const arabic = within(within(canvas.getByTestId("rtl")).getByRole("group"));
    const next = arabic.getByRole("button", { name: "السجل التالي" });
    // In a right-to-left provider both chevrons turn to face the reading direction.
    for (const button of [next, arabic.getByRole("button", { name: "السجل السابق" })]) {
      const icon = button.querySelector("svg") as SVGElement;
      await expect(getComputedStyle(icon).rotate).toBe("180deg");
    }
    await userEvent.click(next);
    await expect(arabic.getByRole("status")).toHaveTextContent("٢ من ٣");
  },
};

/** The position counts the whole result the table shows, across its pages, and the status names the record that arrived. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  parameters: { layout: "padded" },
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div data-testid="whole-result">
            <PreviewNavigation
              position={28}
              total={62}
              recordLabel="Access review evidence"
              showPosition
              onPrevious={() => undefined}
              onNext={() => undefined}
              openLink={<a href="#record-28" target="_blank" rel="noopener noreferrer" />}
            />
          </div>
        }
        doText="The record's place in the whole filtered and sorted result: 28 of 62."
        dont={
          <div data-testid="one-page">
            <PreviewNavigation
              position={3}
              total={25}
              recordLabel="Access review evidence"
              showPosition
              onPrevious={() => undefined}
              onNext={() => undefined}
              openLink={<a href="#record-28" target="_blank" rel="noopener noreferrer" />}
            />
          </div>
        }
        dontText="Its place on the table's current page: 3 of 25, when the result holds 62, and Next stops at the page's end."
      />
      <Pair
        do={
          <div data-testid="named">
            <PreviewNavigation
              position={2}
              total={3}
              recordLabel="Recovery exercise evidence"
              onPrevious={() => undefined}
              onNext={() => undefined}
            />
          </div>
        }
        doText="recordLabel: the reader hears which record arrived, Recovery exercise evidence, 2 of 3 records."
        dont={
          <div data-testid="unnamed">
            <PreviewNavigation
              position={2}
              total={3}
              onPrevious={() => undefined}
              onNext={() => undefined}
            />
          </div>
        }
        dontText="No recordLabel. Each step is heard as a number, 2 of 3 records, and never as a record."
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = (id: string) => within(canvas.getByTestId(id)).getByRole("status");
    await waitFor(() =>
      expect(status("whole-result")).toHaveTextContent("Access review evidence, 28 of 62 records"),
    );
    await waitFor(() =>
      expect(status("one-page")).toHaveTextContent("Access review evidence, 3 of 25 records"),
    );
    await waitFor(() =>
      expect(status("named")).toHaveTextContent("Recovery exercise evidence, 2 of 3 records"),
    );
    await waitFor(() => expect(status("unnamed")).toHaveTextContent("2 of 3 records"));
    await expect(status("unnamed")).not.toHaveTextContent("evidence");
  },
};
