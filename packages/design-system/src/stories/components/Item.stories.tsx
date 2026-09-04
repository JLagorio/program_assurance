import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExternalLink, MoreHorizontal } from "lucide-react";

import { Avatar, Badge, Breadcrumb, IconButton, Item } from "../../components";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Item",
  component: Item,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Item>;
export default meta;
type Story = StoryObj;

export const Items: Story = {
  render: () => (
    <Stack space="space.400" className="max-w-[640px]">
      <Breadcrumb>
        <Breadcrumb.Item asChild>
          <a href="#programme">Programme</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item asChild>
          <a href="#finance">Finance controls</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => undefined}>Payables</Breadcrumb.Item>
        <Breadcrumb.Item isCurrent>CTRL-0412 Segregation of duties, payables</Breadcrumb.Item>
      </Breadcrumb>
      <Item.Group>
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
        <Item
          leading={<Avatar name="Priya Natarajan" size="xsmall" />}
          title="Priya requested a walkthrough"
          description="Wants to see the payables run end to end before signing off."
          trailing="Yesterday"
        >
          <Badge tone="information">Open request</Badge>
        </Item>
      </Item.Group>
      <Item.Group empty="No linked evidence yet." />
    </Stack>
  ),
};

/** Every slot and every state of a row, then a group with nothing in it. */
export const ItemMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-layout-measure">
      <Item.Group>
        <Item title="Title only" />
        <Item id="MS-C" title="With an id" />
        <Item id="MS-C" idWidth={120} title="Wider id column" meta="Sep 04" />
        <Item
          leading={
            <Badge tone="success" size="xsmall">
              Done
            </Badge>
          }
          title="Leading badge"
          description="A description under the title."
        />
        <Item id="RMF-6" title="Meta and trailing" meta="Whitcombe LLP" trailing="Sep 18, 2026" />
        <Item
          title="With actions"
          actions={
            <IconButton label="More" variant="subtle" size="small" icon={<MoreHorizontal />} />
          }
        />
        <Item
          title="Selectable"
          description="onSelect makes the row a button."
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
            Children render under the row, outside its button.
          </Text>
        </Item>
      </Item.Group>
      <Item.Group empty="No milestones recorded." />
    </Stack>
  ),
};
