import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import type { ReactNode } from "react";

import { Badge, Button, Fact, Id, Table, TextLink } from "../../components";
import { PreviewSheet, Section } from "../../patterns";
import { Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

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

/** The sheet's footer, drawn on its own for a pair. */
function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-150 rounded-medium border border-default bg-surface-sunken px-200 py-100">
      {children}
    </div>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Footer>
            <TextLink weight="medium" asChild={false} href="#record">
              Open the full record
            </TextLink>
            <Inline space="space.100">
              <Button>Propose change</Button>
              <Button variant="primary">Allocate</Button>
            </Inline>
          </Footer>
        }
        doText="The first thing in the footer is the way to the record, a link. The actions that make sense without leaving sit at the end."
        dont={
          <Footer>
            <span />
            <Inline space="space.100" shouldWrap>
              <Button>Propose change</Button>
              <Button>Allocate</Button>
              <Button>Export</Button>
              <Button>Archive</Button>
              <Button variant="primary">Open</Button>
            </Inline>
          </Footer>
        }
        dontText="Five buttons and Open as the primary. The way to a page is a link, and a preview that does everything is the record."
      />
      <Pair
        do={
          <Fact.Group>
            <Fact label="Method">Test</Fact>
            <Fact label="Owner">Dan Whitlock</Fact>
            <Fact label="Allocated to">2 elements</Fact>
          </Fact.Group>
        }
        doText="At most three facts under the sheet's title: the ones the reader acts on. The body has the rest."
        dont={
          <Fact.Group>
            <Fact label="Method">Test</Fact>
            <Fact label="Owner">Dan Whitlock</Fact>
            <Fact label="Allocated to">2 elements</Fact>
            <Fact label="Source">SRD 4.2.1</Fact>
            <Fact label="Priority">High</Fact>
            <Fact label="Revision">3</Fact>
            <Fact label="Created">3 Aug 2026</Fact>
            <Fact label="Updated">2h ago</Fact>
          </Fact.Group>
        }
        dontText="Eight facts in the header. It wraps to three lines and the body starts below the fold."
      />
    </Stack>
  ),
};
