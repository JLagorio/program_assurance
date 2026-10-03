import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { PreviewNavigation, PreviewSheet, Section } from "../..";
import { Badge, Button, Fact, Id, Table, TextLink } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const meta = {
  title: "Patterns/PreviewSheet",
  component: PreviewSheet,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PreviewSheet>;
export default meta;
type Story = StoryObj;

function CollectionReview() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const names = ["Access review evidence", "Recovery exercise evidence"];
  return (
    <>
      <Button onClick={() => setOpen(true)}>Review evidence</Button>
      <PreviewSheet
        open={open}
        onClose={() => setOpen(false)}
        title={names[index]}
        navigation={
          <PreviewNavigation
            position={index + 1}
            total={names.length}
            recordLabel={names[index]}
            onPrevious={index > 0 ? () => setIndex(index - 1) : undefined}
            onNext={index < names.length - 1 ? () => setIndex(index + 1) : undefined}
            openLink={
              <a href={`#evidence-${index + 1}`} target="_blank" rel="noopener noreferrer" />
            }
          />
        }
        actions={
          <Button size="small" variant="primary">
            Edit artifact
          </Button>
        }
      >
        <Section title="Details">
          <Fact label="Review">Awaiting decision</Fact>
        </Section>
      </PreviewSheet>
    </>
  );
}

const openTooltip = () => document.querySelector('[data-slot="tooltip-content"][data-open]');

/** A version review in a collection: PreviewNavigation in the outer header carries the full-record link, so `openTo` is left out, and the status names the record as it steps. */
export const CollectionTask: Story = {
  render: CollectionReview,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const opener = canvas.getByRole("button", { name: "Review evidence" });
    await userEvent.click(opener);
    const first = await page.findByRole("dialog", { name: "Access review evidence" });
    const navigationHeader = first.querySelector('[data-slot="sheet-header"]') as HTMLElement;
    const recordHeader = first.querySelector('[data-slot="page-header"]') as HTMLElement;
    // The record header opens the SheetBody, the sheet's one scroller.
    await expect(recordHeader.closest('[data-slot="sheet-body"]')).not.toBeNull();
    await expect(within(navigationHeader).queryByRole("heading")).toBeNull();
    await expect(
      within(navigationHeader).queryByRole("button", { name: "Edit artifact" }),
    ).toBeNull();
    await expect(within(navigationHeader).getByRole("button", { name: "Close" })).toBeVisible();
    // The record's name is PageHeader.Title rendered as the sheet's title: the h2 that names the
    // modal, with the body's sections one level below.
    const recordTitle = within(recordHeader).getByRole("heading", {
      name: "Access review evidence",
      level: 2,
    });
    await expect(recordTitle).toHaveFocus();
    await expect(recordTitle).toHaveAttribute("data-slot", "page-header-title");
    await expect(first).toHaveAttribute("aria-labelledby", recordTitle.id);
    await expect(within(first).getByRole("heading", { name: "Details", level: 3 })).toBeVisible();
    await expect(
      within(first).getAllByRole("heading", { name: "Access review evidence" }),
    ).toHaveLength(1);
    await expect(
      within(recordHeader)
        .getByRole("button", { name: "Edit artifact" })
        .closest('[data-slot="page-header-actions"]'),
    ).not.toBeNull();
    await expect(within(first).getAllByRole("link")).toHaveLength(1);
    await expect(first.querySelector('[data-slot="sheet-footer"]')).toBeNull();
    await expect(within(first).getByRole("button", { name: "Previous record" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    const nextButton = within(first).getByRole("button", { name: "Next record" });
    await userEvent.click(nextButton);
    const next = page.getByRole("dialog", { name: "Recovery exercise evidence" });
    // At the last record Next stays focused and unavailable; Escape still dismisses the sheet.
    await expect(nextButton).toHaveAttribute("aria-disabled", "true");
    await expect(nextButton).toHaveFocus();
    await expect(
      within(next).getByRole("link", { name: "Open full record in new tab" }),
    ).toHaveAttribute("href", "#evidence-2");
    await expect(within(next).getByRole("status")).toHaveTextContent(
      "Recovery exercise evidence, 2 of 2 records",
    );
    await userEvent.unhover(nextButton);
    await waitFor(() => expect(openTooltip()).toBeNull());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

function PreviewSheetStates() {
  const [open, setOpen] = useState<"plain" | "full" | "stack" | null>(null);
  const [depth, setDepth] = useState(0);
  // The control in the parent frame that opened the nested one, where Back returns focus.
  const [openedFrom, setOpenedFrom] = useState<string | null>(null);
  const backTo = useRef<HTMLButtonElement>(null);
  // Close and Escape dismiss the whole preview: every frame goes, and the next open starts at the root.
  const close = () => {
    setOpen(null);
    setDepth(0);
  };
  const stacked = open === "stack" && depth > 0;
  const requirementCell = (id: string) =>
    open === "stack" ? (
      <Button
        ref={id === openedFrom ? backTo : undefined}
        variant="link"
        onClick={() => {
          setOpenedFrom(id);
          setDepth(1);
        }}
      >
        <Id>{id}</Id>
      </Button>
    ) : (
      <TextLink render={<a href="#req" />}>
        <Id>{id}</Id>
      </TextLink>
    );
  return (
    <Stack space="space.200">
      <Inline space="space.150" rowSpace="space.150" alignBlock="center" shouldWrap>
        <Button variant="secondary" onClick={() => setOpen("plain")}>
          Facts only
        </Button>
        <Button variant="secondary" onClick={() => setOpen("full")}>
          With links and actions
        </Button>
        <Button variant="secondary" onClick={() => setOpen("stack")}>
          Compact header, a frame deeper
        </Button>
      </Inline>
      <PreviewSheet
        open={open !== null}
        onClose={close}
        onBack={stacked ? () => setDepth(0) : undefined}
        backFocus={stacked ? backTo : undefined}
        id={stacked ? "REQ-0118" : "CMP-0113"}
        title={stacked ? "The gateway shall encrypt telemetry in transit" : "Telemetry gateway"}
        subtitle={
          stacked
            ? "Requirement · Derived · Dan Whitlock"
            : "Component · Ground segment / Mission control"
        }
        status={
          open === "stack" ? (
            <Badge variant="secondary" size="xsmall" tone={stacked ? "success" : "information"}>
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
        openTo={<a href="#record">{open === "full" ? "Open component record" : undefined}</a>}
        links={
          open === "full" ? (
            <TextLink render={<a href="#controls" />}>Control set and revisions</TextLink>
          ) : null
        }
        actions={
          open === "full" ? (
            <>
              <Button size="small" variant="secondary">
                Propose change
              </Button>
              <Button size="small" variant="primary">
                Allocate
              </Button>
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
                      <Badge variant="secondary" size="xsmall" tone="success">
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
                      <Badge variant="secondary" size="xsmall" tone="warning">
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
/** Facts only; with a second link and actions; the compact header with status and facts, and a requirement opened a frame deeper. Back pops that frame and returns focus to the requirement that opened it; Close and Escape dismiss the whole preview from any frame. Open one. */
export const PreviewSheetStory: Story = {
  name: "Preview sheet",
  render: () => <PreviewSheetStates />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Facts only" }));
    await expect(await page.findByRole("link", { name: "Open the full record" })).toHaveAttribute(
      "href",
      "#record",
    );
    await expect(
      page
        .getByRole("link", { name: "Open the full record" })
        .closest('[data-slot="sheet-header"]'),
    ).not.toBeNull();
    await expect(page.getByRole("heading", { name: "Telemetry gateway" })).toHaveFocus();
    // Verify modal behavior rather than prescribing Base UI's background-hiding technique.
    await expect(page.queryByRole("button", { name: "Facts only" })).toBeNull();
    for (let index = 0; index < 4; index += 1) {
      await userEvent.tab();
      await waitFor(() =>
        expect(page.getByRole("dialog")).toContainElement(
          canvasElement.ownerDocument.activeElement as HTMLElement,
        ),
      );
    }
    await expect(page.queryByRole("button", { name: "Back to previous record" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Facts only" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "With links and actions" }));
    await expect(await page.findByRole("link", { name: "Open component record" })).toHaveAttribute(
      "href",
      "#record",
    );
    const fullDialog = page.getByRole("dialog", { name: "Telemetry gateway" });
    const fullRecordHeader = fullDialog.querySelector('[data-slot="page-header"]') as HTMLElement;
    await expect(within(fullRecordHeader).getByRole("button", { name: "Allocate" })).toBeVisible();
    const footer = fullDialog.querySelector('[data-slot="sheet-footer"]') as HTMLElement;
    await expect(
      within(footer).getByRole("link", { name: "Control set and revisions" }),
    ).toBeVisible();
    await expect(within(footer).queryByRole("button")).toBeNull();
    await expect(within(footer).queryByRole("link", { name: "Open component record" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    const opener = canvas.getByRole("button", { name: "Compact header, a frame deeper" });
    await userEvent.click(opener);
    await userEvent.click(await page.findByRole("button", { name: "REQ-0118" }));
    await expect(
      page.getByRole("dialog", { name: "The gateway shall encrypt telemetry in transit" }),
    ).toBeVisible();
    const nestedDialog = page.getByRole("dialog", {
      name: "The gateway shall encrypt telemetry in transit",
    });
    // The link that opened the frame went with the parent frame: the new frame's title takes focus.
    await waitFor(() =>
      expect(
        within(nestedDialog).getByRole("heading", {
          name: "The gateway shall encrypt telemetry in transit",
        }),
      ).toHaveFocus(),
    );
    const nestedHeader = nestedDialog.querySelector('[data-slot="sheet-header"]') as HTMLElement;
    const back = within(nestedHeader).getByRole("button", { name: "Back to previous record" });
    await expect(back).toBeVisible();
    // Back is an arrow at the start of the bar, apart from previous and next, and it follows the
    // reading direction.
    await expect(back.querySelector("svg")).toHaveClass("lucide-arrow-left");
    await expect(within(nestedHeader).queryByText("REQ-0118")).toBeNull();
    await expect(within(nestedHeader).queryByText("Verified")).toBeNull();
    await expect(within(nestedDialog).getByText("REQ-0118")).toBeVisible();
    await expect(within(nestedDialog).getByText("Verified")).toBeVisible();
    await expect(
      within(nestedDialog).getByText("Requirement · Derived · Dan Whitlock"),
    ).toHaveAttribute("id", nestedDialog.getAttribute("aria-describedby"));
    // Back pops one frame and returns focus to the control in the parent frame that opened it.
    await userEvent.click(back);
    await expect(page.getByRole("dialog", { name: "Telemetry gateway" })).toBeVisible();
    await expect(page.queryByRole("button", { name: "Back to previous record" })).toBeNull();
    await waitFor(() => expect(page.getByRole("button", { name: "REQ-0118" })).toHaveFocus());
    // Escape from a nested frame dismisses the whole preview, and the next open starts at the root.
    await userEvent.keyboard("{Enter}");
    await expect(
      await page.findByRole("dialog", { name: "The gateway shall encrypt telemetry in transit" }),
    ).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(opener).toHaveFocus();
    await userEvent.click(opener);
    await expect(await page.findByRole("dialog", { name: "Telemetry gateway" })).toBeVisible();
    await expect(page.queryByRole("button", { name: "Back to previous record" })).toBeNull();
    // Close does the same as Escape.
    await userEvent.click(await page.findByRole("button", { name: "REQ-0121" }));
    await userEvent.click(within(page.getByRole("dialog")).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(opener).toHaveFocus();
  },
};

/** Completing work may remove the opener; the surviving queue control is the return target. */
function CompletePreview() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const queueRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={queueRef}>Requirement queue</Button>
      {!done ? <Button onClick={() => setOpen(true)}>Review requirement</Button> : null}
      <PreviewSheet
        open={open}
        onClose={() => setOpen(false)}
        id="REQ-0118"
        title="Review telemetry requirement"
        finalFocus={queueRef}
        openTo={<a href="#requirement">Open requirement</a>}
        actions={
          <Button
            size="small"
            variant="primary"
            onClick={() => {
              setDone(true);
              setOpen(false);
            }}
          >
            Complete review
          </Button>
        }
      >
        Evidence is ready for review.
      </PreviewSheet>
    </>
  );
}
export const CompleteReview: Story = {
  render: () => <CompletePreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Review requirement" }));
    const dialog = await page.findByRole("dialog", { name: "Review telemetry requirement" });
    await expect(dialog).not.toHaveAttribute("aria-describedby");
    await userEvent.click(within(dialog).getByRole("button", { name: "Complete review" }));
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(canvas.queryByRole("button", { name: "Review requirement" })).toBeNull();
    await expect(canvas.getByRole("button", { name: "Requirement queue" })).toHaveFocus();
  },
};

/** A version review whose footer holds the related links, or the full-record link again. */
function ReviewWithLinks({ repeat, trigger }: { repeat: boolean; trigger: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{trigger}</Button>
      <PreviewSheet
        open={open}
        onClose={() => setOpen(false)}
        id="REQ-0118"
        title="Review telemetry requirement"
        openTo={<a href="#requirement-0118">Open requirement</a>}
        links={
          repeat ? (
            <TextLink href="#requirement-0118">Open the full requirement</TextLink>
          ) : (
            <TextLink href="#control-si-7">SI-7, the control it implements</TextLink>
          )
        }
      >
        Evidence is ready for review.
      </PreviewSheet>
    </>
  );
}

/** The footer holds related destinations; the full record is the outer header's link, once. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={<ReviewWithLinks repeat={false} trigger="Review, related links" />}
      doText="links for related records, here the control the requirement implements; the full record is the outer header's link."
      dont={<ReviewWithLinks repeat trigger="Review, repeated link" />}
      dontText="The full-record link again in the footer. The reader meets two ways to the same place, and the footer's job, the related records, is gone."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const toRecord = (dialog: HTMLElement) =>
      within(dialog)
        .getAllByRole("link")
        .filter((link) => link.getAttribute("href") === "#requirement-0118");
    for (const [trigger, count] of [
      ["Review, related links", 1],
      ["Review, repeated link", 2],
    ] as const) {
      const opener = canvas.getByRole("button", { name: trigger });
      await userEvent.click(opener);
      const dialog = await page.findByRole("dialog", { name: "Review telemetry requirement" });
      await expect(toRecord(dialog)).toHaveLength(count);
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(opener).toHaveFocus());
    }
  },
};
