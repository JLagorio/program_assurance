import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { PreviewSheet, Section } from "../..";
import { Badge, Button, Fact, Id, Table, TextLink } from "../../components";
import { Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Patterns/PreviewSheet",
  component: PreviewSheet,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PreviewSheet>;
export default meta;
type Story = StoryObj;

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
      <TextLink render={<a href="#req" />}>
        <Id>{id}</Id>
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
/** Facts only; with a second link and actions; the compact header with status and facts, and a requirement opened a frame deeper with the back chevron. Open one. */
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
    await expect(page.getByRole("heading", { name: "Telemetry gateway" })).toHaveFocus();
    // Verify modal behavior rather than prescribing Base UI's background-hiding technique.
    await expect(page.queryByRole("button", { name: "Facts only" })).toBeNull();
    for (let index = 0; index < 4; index += 1) {
      await userEvent.tab();
      await expect(page.getByRole("dialog")).toContainElement(
        canvasElement.ownerDocument.activeElement as HTMLElement,
      );
    }
    await expect(page.queryByRole("button", { name: "Back" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Facts only" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "With links and actions" }));
    await expect(await page.findByRole("link", { name: "Open component record" })).toHaveAttribute(
      "href",
      "#record",
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    const opener = canvas.getByRole("button", { name: "Compact header, a frame deeper" });
    await userEvent.click(opener);
    await userEvent.click(await page.findByRole("button", { name: "REQ-0118" }));
    await expect(
      page.getByRole("dialog", { name: "The gateway shall encrypt telemetry in transit" }),
    ).toBeVisible();
    await userEvent.click(page.getByRole("button", { name: "Back" }));
    await expect(page.getByRole("dialog", { name: "Telemetry gateway" })).toBeVisible();
    await expect(page.queryByRole("button", { name: "Back" })).toBeNull();
    await expect(page.getByRole("dialog")).toContainElement(
      canvasElement.ownerDocument.activeElement as HTMLElement,
    );
    await userEvent.keyboard("{Escape}");
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
