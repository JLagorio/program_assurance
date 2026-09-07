import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Button, HoverCard, KeyValue, Table, TextLink } from "../../components";
import { Glance } from "../../patterns";
import { Grid, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const glance = (
  <Glance
    id="CTRL-0412"
    status={<Badge tone="success">Verified</Badge>}
    title="Segregation of duties, payables"
    meta="Finance · Dana Whitfield"
    facts={[
      { label: "Verified", value: "12 Aug 2026" },
      { label: "Next review", value: "14 Sep 2026" },
      { label: "Findings", value: "2 open" },
    ]}
  />
);

const link = (text: string, href: string) => (
  <TextLink>
    <a href={href}>{text}</a>
  </TextLink>
);

const meta = {
  title: "Components/HoverCard",
  component: HoverCard,
  parameters: { layout: "padded" },
  args: {
    side: "bottom",
    align: "start",
    width: 300,
    delay: 400,
    content: glance,
    children: link("CTRL-0412", "#p"),
  },
} satisfies Meta<typeof HoverCard>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every side, held open, each with a Glance: the id, one status, the title, the meta line, the facts. */
export const HoverCardMatrix: Story = {
  render: () => (
    <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="space.0" style={{ paddingTop: 80 }}>
      {(["top", "right", "left", "bottom"] as const).map((side) => (
        <div
          key={side}
          style={{ height: 220 }}
          className={`flex items-center ${side === "right" ? "justify-start" : side === "left" ? "justify-end" : "justify-center"}`}
        >
          <HoverCard content={glance} side={side} width={300} defaultOpen>
            {link(`CTRL-0412 · ${side}`, `#${side}`)}
          </HoverCard>
        </div>
      ))}
    </Grid>
  ),
};

const rows = [
  { id: "CTRL-0412", name: "Segregation of duties, payables", owner: "Dana Whitfield" },
  { id: "CTRL-0418", name: "Vendor master change approval", owner: "Dana Whitfield" },
  { id: "CTRL-0450", name: "Privileged access review", owner: "Priya Natarajan" },
];

/** On an id in a register: rest on it and the Glance opens; click and the record opens. Tab to it and it opens too. */
export const OnAnId: Story = {
  name: "On an id",
  render: () => (
    <div style={{ width: 560 }}>
      <Table label="Controls">
        <thead>
          <tr>
            <Table.Header width={120}>Id</Table.Header>
            <Table.Header>Control</Table.Header>
            <Table.Header width={160}>Owner</Table.Header>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Table.Row key={r.id}>
              <Table.Cell>
                <HoverCard content={glance} width={300}>
                  {link(r.id, `#${r.id}`)}
                </HoverCard>
              </Table.Cell>
              <Table.Cell>{r.name}</Table.Cell>
              <Table.Cell>{r.owner}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div style={{ height: 200 }}>
            <HoverCard content={glance} width={300} defaultOpen>
              {link("CTRL-0412", "#a")}
            </HoverCard>
          </div>
        }
        doText="Facts only. The click opens the record, and everything in the card is there too."
        dont={
          <div style={{ height: 200 }}>
            <HoverCard
              width={300}
              defaultOpen
              content={
                <Stack space="space.100">
                  {glance}
                  <Inline space="space.100">
                    <Button size="small" variant="primary">
                      Open record
                    </Button>
                    <Button size="small">Reassign</Button>
                  </Inline>
                </Stack>
              }
            >
              {link("CTRL-0412", "#b")}
            </HoverCard>
          </div>
        }
        dontText="Buttons in a hover card. A screen reader never hears the card, a keyboard cannot reach into it, and it closes as the pointer travels."
      />
      <Pair
        do={
          <HoverCard content={glance} width={300}>
            {link("CTRL-0412", "#c")}
          </HoverCard>
        }
        doText="The trigger is a link: focusable, so Tab opens the card, and Enter opens the record."
        dont={
          <HoverCard content={glance} width={300}>
            <span>CTRL-0412</span>
          </HoverCard>
        }
        dontText="A plain span as the trigger. Hover shows the card; the keyboard never reaches it, and there is nothing to click."
      />
      <Pair
        do={
          <div style={{ height: 320 }}>
            <HoverCard content={glance} width={300} defaultOpen>
              {link("CTRL-0412", "#d")}
            </HoverCard>
          </div>
        }
        doText="At most four facts; the rest belong to the peek and the record."
        dont={
          <div style={{ height: 320 }}>
            <HoverCard
              width={300}
              defaultOpen
              content={
                <Stack space="space.0">
                  {(
                    [
                      ["Id", "CTRL-0412"],
                      ["Title", "Segregation of duties, payables"],
                      ["Family", "Finance"],
                      ["Owner", "Dana Whitfield"],
                      ["Status", "Verified"],
                      ["Verified", "12 Aug 2026"],
                      ["Next review", "14 Sep 2026"],
                      ["Findings", "2 open"],
                      ["Evidence", "4 items"],
                      ["Procedure", "Revision 4"],
                    ] as const
                  ).map(([label, value]) => (
                    <KeyValue key={label} label={label} labelWidth={88}>
                      {value}
                    </KeyValue>
                  ))}
                </Stack>
              }
            >
              {link("CTRL-0412", "#e")}
            </HoverCard>
          </div>
        }
        dontText="The whole record in a card. It is a page the reader cannot scroll or keep; a peek is a few facts and a way in."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <div style={{ height: 240 }} className="flex items-center justify-center">
      <HoverCard {...args} />
      <Text size="small" color="color.text.subtle" className="ps-200">
        Rest on the id.
      </Text>
    </div>
  ),
};
