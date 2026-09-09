import { useRef, useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import {
  avatarHue,
  AvatarFallback,
  avatarInitials,
  Badge,
  Avatar,
  Button,
  Dot,
  IconButton,
  Item,
} from "../../components";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { ExternalLink, MoreHorizontal, Plus } from "lucide-react";
import { Stack, Text } from "../../primitives";

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
          leading={
            <Avatar
              size="xsmall"
              aria-hidden="true"
              hue={avatarHue("Priya Natarajan")}
              title={"Priya Natarajan"}
            >
              <AvatarFallback>{avatarInitials("Priya Natarajan", 1)}</AvatarFallback>
            </Avatar>
          }
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
          leading={
            <Avatar
              size="xsmall"
              aria-hidden="true"
              hue={avatarHue("Priya Natarajan")}
              title={"Priya Natarajan"}
            >
              <AvatarFallback>{avatarInitials("Priya Natarajan", 1)}</AvatarFallback>
            </Avatar>
          }
          title="Priya requested a walkthrough"
          description="Wants to see the payables run end to end before signing off."
          trailing="Yesterday"
        >
          <Badge variant="secondary" tone="information">
            Open request
          </Badge>
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
export const Playground: Story = {
  render: (args) => (
    <Item.Group>
      <Item {...args} />
    </Item.Group>
  ),
};

/** A record row keeps its link, disclosure and secondary actions independent. */
export const NativeIntegration: Story = {
  render: function Example() {
    const row = useRef<HTMLLIElement>(null);
    const link = useRef<HTMLAnchorElement>(null);
    const [locked, setLocked] = useState(true);
    const [action, setAction] = useState("Ready");
    return (
      <Stack>
        <Item.Group id="record-actions" title="Record actions">
          <Item
            ref={row}
            aria-label="Assessment package row"
            tabIndex={-1}
            style={{ maxWidth: 640 }}
            title="Assessment package"
            id="PKG-1041"
            isCollapsible
            onOpenChange={(_open, details) => {
              if (locked) details.cancel();
            }}
            link={
              <a
                id="assessment-package-link"
                ref={link}
                href="#package"
                onClick={(event) => {
                  event.preventDefault();
                  setAction("Opened record");
                }}
              />
            }
            actions={
              <Button size="small" onClick={() => setAction("Downloaded")}>
                Download
              </Button>
            }
          >
            <Text>Evidence and approval details</Text>
          </Item>
        </Item.Group>
        <Button onClick={() => setLocked(false)}>Allow details</Button>
        <Button onClick={() => row.current?.focus()}>Focus row</Button>
        <Button onClick={() => link.current?.focus()}>Focus record link</Button>
        <Text role="status">{action}</Text>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Assessment package" });
    await expect(link).toHaveAttribute("id", "assessment-package-link");
    await expect(link).toHaveAttribute("href", "#package");
    const toggle = canvas.getByRole("button", { name: "Assessment package" });
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(canvas.getByRole("button", { name: "Allow details" }));
    await userEvent.click(toggle);
    await expect(await canvas.findByText("Evidence and approval details")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Download" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Downloaded");
    await userEvent.click(canvas.getByRole("button", { name: "Focus row" }));
    await expect(canvas.getByRole("listitem", { name: "Assessment package row" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Focus record link" }));
    await expect(link).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(canvas.getByRole("status")).toHaveTextContent("Downloaded");
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Opened record");
  },
};
