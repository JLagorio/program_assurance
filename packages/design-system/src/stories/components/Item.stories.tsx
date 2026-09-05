import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExternalLink, MoreHorizontal, Plus } from "lucide-react";

import { Avatar, Badge, Button, Dot, IconButton, Item, Table } from "../../components";
import { Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Item",
  component: Item,
  parameters: { layout: "padded" },
  args: { title: "Bank reconciliation, July" },
} satisfies Meta<typeof Item>;
export default meta;
type Story = StoryObj<typeof meta>;

const more = <IconButton label="More" variant="subtle" size="small" icon={<MoreHorizontal />} />;

/** Each slot in a group of its own, since a group shares its columns; then the states, a titled compact group, and one with nothing in it. */
export const ItemMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-layout-measure">
      <Item.Group>
        <Item title="Title only" />
        <Item title="With meta" meta="PDF · 2.1 MB" />
        <Item title="With a description" description="A description under the title." />
        <Item title="With trailing" trailing="Sep 18, 2026" />
        <Item title="With actions" actions={more} />
      </Item.Group>
      <Item.Group>
        <Item id="MS-C" title="With an id" />
        <Item
          id="RMF-6"
          title="Id, meta and trailing"
          meta="Whitcombe LLP"
          trailing="Sep 18, 2026"
        />
        <Item id="EV-2201" idWidth={120} title="A wider id column, shared by the group" />
      </Item.Group>
      <Item.Group>
        <Item
          leading={<Dot tone="success" />}
          id="MS-D"
          title="Leading mark and id"
          meta="Sep 04"
        />
        <Item
          leading={<Avatar name="Priya Natarajan" size="xsmall" isDecorative />}
          id="MS-E"
          title="Leading avatar"
          description="Marks land at one x whatever they are."
        />
      </Item.Group>
      <Item.Group>
        <Item
          title="Selectable"
          description="onSelect makes the title a button over the row."
          onSelect={() => {}}
        />
        <Item title="Active" onSelect={() => {}} isActive />
        <Item
          title="A link row"
          link={<a href="#row" />}
          trailing={<ExternalLink className="size-icon-small icon-subtlest" />}
        />
        <Item title="Expanded" onSelect={() => {}}>
          <Text size="small" color="color.text.subtle">
            Children start under the title, whatever the row carries before it.
          </Text>
        </Item>
      </Item.Group>
      <Item.Group>
        <Item title="Collapsible" meta="click anywhere" isCollapsible>
          <Text size="small" color="color.text.subtle">
            A plain collapsible row opens on a click anywhere on it.
          </Text>
        </Item>
        <Item
          title="Collapsible link"
          meta="the chevron opens it"
          link={<a href="#row-2" />}
          isCollapsible
          defaultOpen
        >
          <Text size="small" color="color.text.subtle">
            A row that links or selects keeps its click; the chevron is the toggle.
          </Text>
        </Item>
      </Item.Group>
      <Item.Group title="Milestones" count={3} trailing="1 of 3 complete" size="compact">
        <Item
          leading={<Dot tone="success" />}
          id="MS-A"
          idWidth={48}
          title="Kickoff"
          meta="Complete"
          trailing="4 Mar"
        />
        <Item
          leading={<Dot tone="warning" />}
          id="MS-B"
          idWidth={48}
          title="Design review"
          meta="At risk"
          trailing="18 Sep"
        />
        <Item
          leading={<Dot tone="neutral" />}
          id="MS-C"
          idWidth={48}
          title="Authorization"
          meta="Planned"
          trailing="2 Dec"
        />
      </Item.Group>
      <Item.Group
        title="Evidence"
        trailing={
          <Button size="small" variant="subtle" iconBefore={<Plus />}>
            Add
          </Button>
        }
        empty="No evidence linked yet."
      />
    </Stack>
  ),
};

/** Three lists a record page is made of: evidence, milestones, and a conversation. */
export const Lists: Story = {
  render: () => (
    <Stack space="space.400" className="max-w-[640px]">
      <Item.Group title="Evidence" count={2}>
        <Item
          id="EV-2201"
          title="Bank reconciliation, July"
          meta="PDF · 2.1 MB"
          description="Uploaded by Dana Whitfield"
          trailing="12 Aug"
          link={<a href="#ev-2201" />}
        />
        <Item
          id="EV-2202"
          title="Approval matrix"
          meta="XLSX"
          trailing="9 Aug"
          onSelect={() => undefined}
          isActive
          actions={
            <IconButton label="Open" variant="subtle" size="small" icon={<ExternalLink />} />
          }
        />
      </Item.Group>
      <Item.Group title="Milestones" trailing="1 of 3 complete">
        <Item
          leading={<Dot tone="success" />}
          id="MS-A"
          idWidth={48}
          title="Kickoff"
          meta="Complete"
          trailing="4 Mar"
        />
        <Item
          leading={<Dot tone="warning" />}
          id="MS-B"
          idWidth={48}
          title="Design review"
          meta="At risk"
          trailing="18 Sep"
        />
        <Item
          leading={<Dot tone="neutral" />}
          id="MS-C"
          idWidth={48}
          title="Authorization"
          meta="Planned"
          trailing="2 Dec"
        />
      </Item.Group>
      <Item.Group>
        <Item
          leading={<Avatar name="Priya Natarajan" size="xsmall" isDecorative />}
          title="Priya requested a walkthrough"
          description="Wants to see the payables run end to end before signing off."
          trailing="Yesterday"
        >
          <Badge tone="information">Open request</Badge>
        </Item>
      </Item.Group>
    </Stack>
  ),
};

/** A milestone that folds its tasks: a nested group under the title, opened by the chevron. */
export const Nested: Story = {
  render: () => (
    <Item.Group title="Milestones" trailing="1 of 2 complete" className="max-w-[640px]">
      <Item
        leading={<Dot tone="warning" />}
        id="MS-B"
        idWidth={48}
        title="Design review"
        meta="At risk"
        trailing="18 Sep"
        link={<a href="#ms-b" />}
        isCollapsible
        defaultOpen
      >
        <Item.Group size="compact">
          <Item
            leading={<Dot tone="success" />}
            title="Threat model walkthrough"
            trailing="2 Sep"
          />
          <Item
            leading={<Dot tone="warning" />}
            title="Boundary diagram sign-off"
            meta="Waiting on the ISSM"
            trailing="16 Sep"
          />
          <Item leading={<Dot tone="neutral" />} title="Findings triage" trailing="18 Sep" />
        </Item.Group>
      </Item>
      <Item
        leading={<Dot tone="success" />}
        id="MS-A"
        idWidth={48}
        title="Kickoff"
        meta="Complete"
        trailing="4 Mar"
        link={<a href="#ms-a" />}
        isCollapsible
      >
        <Item.Group size="compact">
          <Item leading={<Dot tone="success" />} title="Charter signed" trailing="1 Mar" />
        </Item.Group>
      </Item>
    </Item.Group>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Item.Group>
            <Item id="MS-B" idWidth={48} title="Design review" meta="At risk" trailing="18 Sep" />
            <Item id="MS-C" idWidth={48} title="Authorization" meta="Planned" trailing="2 Dec" />
          </Item.Group>
        }
        doText="Rows with a name and a date are an Item list."
        dont={
          <Table label="Milestones">
            <thead>
              <tr>
                <Table.Header>Milestone</Table.Header>
              </tr>
            </thead>
            <tbody>
              <Table.Row>
                <Table.Cell>MS-B Design review · At risk · 18 Sep</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>MS-C Authorization · Planned · 2 Dec</Table.Cell>
              </Table.Row>
            </tbody>
          </Table>
        }
        dontText="A one-column table. Nothing to sort, nothing to compare: a table with one column is a list wearing a header."
      />
      <Pair
        do={
          <Item.Group title="Milestones" trailing="1 of 3 complete">
            <Item id="MS-B" idWidth={48} title="Design review" meta="At risk" trailing="18 Sep" />
          </Item.Group>
        }
        doText="The list's heading is the group's: semibold, a rule under it, the read-out at the end."
        dont={
          <div>
            <div className="flex items-center justify-between border-b border-default pb-100">
              <span className="font-body font-semibold">Milestones</span>
              <span className="font-body-small text-subtle">1 of 3 complete</span>
            </div>
            <Item.Group>
              <Item id="MS-B" idWidth={48} title="Design review" meta="At risk" trailing="18 Sep" />
            </Item.Group>
          </div>
        }
        dontText="A heading drawn by hand above the group. It is not the list's name to a screen reader, and every page draws it a little differently."
      />
      <Pair
        do={
          <Item.Group>
            <Item
              id="EV-2201"
              title="Bank reconciliation, July"
              meta="PDF · 2.1 MB"
              description="Uploaded by Dana Whitfield"
              trailing="12 Aug"
            />
          </Item.Group>
        }
        doText="The title one line, the meta a few words, the description one sentence."
        dont={
          <Item.Group>
            <Item
              id="EV-2201"
              title="Bank reconciliation for July prepared by the payables team and reviewed by finance"
              meta="This is a PDF document of about two megabytes uploaded last month"
              description="Dana Whitfield uploaded this artifact on 12 August after the July close, following the request from the assessor for evidence that the reconciliation was performed and reviewed by someone other than the preparer, which is the control's whole point."
              trailing="12 August 2026, 14:32"
            />
          </Item.Group>
        }
        dontText="A paragraph in every slot. The row is a pointer to the record, not the record."
      />
      <Pair
        do={
          <Item.Group>
            <Item title="Approval matrix" meta="XLSX" actions={more} />
          </Item.Group>
        }
        doText="One action on a row, as an icon button, the rest behind it."
        dont={
          <Item.Group>
            <Item
              title="Approval matrix"
              meta="XLSX"
              actions={
                <>
                  <Button size="small" variant="primary">
                    Open
                  </Button>
                  <Button size="small">Download</Button>
                  <Button size="small" variant="subtle">
                    Replace
                  </Button>
                </>
              }
            />
          </Item.Group>
        }
        dontText="A toolbar per row. Three buttons on every line and the list is a wall of buttons."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
