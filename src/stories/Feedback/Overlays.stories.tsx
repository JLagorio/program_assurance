import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef } from "react";

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Drawer,
  Field,
  KeyValue,
  Menu,
  Modal,
  PageHeader,
  Person,
  Select,
  Table,
  Textarea,
  Id,
} from "@/components/app/ui";
import { Spec } from "../_lib/tokens";

const noop = () => {};

const meta = {
  title: "Feedback/Overlays",
  component: Modal,
  tags: ["autodocs"],
  args: { open: true, onClose: noop, title: "Submit for authorization", children: null },
  argTypes: {
    open: { control: "boolean" },
    width: { control: "inline-radio", options: ["md", "lg"] },
    title: { control: "text" },
    description: { control: "text" },
    onClose: { control: false },
    children: { control: false },
    aside: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const people = ["D. Reyes", "K. Lund", "M. Okafor", "S. Chen", "A. Whitfield", "J. Park"];

/** Menu owns its open state; this flips it once on mount so the story shows the popover. */
function AutoOpen({ open, toggle }: { open: boolean; toggle: () => void }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (!open) toggle();
  }, [open, toggle]);
  return null;
}

/** Popover anchored to its trigger: label, items with an Avatar lead, one selected, trailing hint. */
export const MenuOpen: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="h-[300px]">
      <Menu
        width={220}
        trigger={({ open, toggle }) => (
          <>
            <Button onClick={toggle} aria-expanded={open}>
              Assign
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
            <AutoOpen open={open} toggle={toggle} />
          </>
        )}
      >
        {(close) => (
          <>
            <Menu.Label>Assign to</Menu.Label>
            {people.slice(0, 4).map((p) => (
              <Menu.Item key={p} selected={p === "D. Reyes"} onSelect={close}>
                <span className="flex items-center gap-2">
                  <Avatar name={p} size="xs" />
                  {p}
                </span>
              </Menu.Item>
            ))}
            <Menu.Label>More</Menu.Label>
            <Menu.Item onSelect={close} trailing="⌘E">
              Request evidence
            </Menu.Item>
            <Menu.Item onSelect={close}>Mark not applicable</Menu.Item>
          </>
        )}
      </Menu>
    </div>
  ),
};

/** Page content behind an overlay so the scrim and blur have something to sit on. */
const behindPage: Decorator = (Story) => (
  <>
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="PKG-2026-114"
        title="Northwind payroll · Authorization package"
        description="340 controls, 7 open findings. Ready for the authorizing official."
        actions={<Button variant="primary">Submit package</Button>}
      />
      <Card>
        <CardHeader title="Open findings" description="Across 5 controls" />
        <div className="h-[220px]" />
      </Card>
    </div>
    <Story />
  </>
);

const evidence = [
  { id: "EV-0412", title: "IdP account lifecycle policy", kind: "Policy", age: "3d" },
  { id: "EV-0418", title: "Weekly account review export", kind: "Export", age: "6d" },
  { id: "EV-0421", title: "Inactive-account job run log", kind: "Log", age: "1d" },
  { id: "EV-0377", title: "Access review sign-off, Q2", kind: "Attestation", age: "71d" },
  { id: "EV-0402", title: "Jump host local-accounts screenshot", kind: "Screenshot", age: "34d" },
];

/** Modal with description, aside facts and a footer. onClose is a no-op here. */
export const ModalOpen: Story = {
  parameters: { layout: "fullscreen", controls: { disable: true } },
  decorators: [behindPage],
  args: {
    description: "This locks PKG-2026-114 and notifies the authorizing official.",
    children: (
      <div className="space-y-4">
        <Field label="Authorizing official">
          <Select defaultValue="K. Lund">
            {people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Decision memo" hint="Attached to the authorization record.">
          <Textarea defaultValue="All moderate-baseline controls assessed. Seven findings remain open under POA&M with owners and due dates assigned." />
        </Field>
      </div>
    ),
    aside: (
      <dl>
        <KeyValue label="Package">
          <Id>PKG-2026-114</Id>
        </KeyValue>
        <KeyValue label="Controls">
          <span className="tnum">340</span>
        </KeyValue>
        <KeyValue label="Satisfied">
          <span className="tnum">212</span>
        </KeyValue>
        <KeyValue label="Open findings">
          <Badge tone="danger" size="xs">
            7
          </Badge>
        </KeyValue>
        <KeyValue label="Submitted by">
          <Person name="D. Reyes" />
        </KeyValue>
      </dl>
    ),
    footer: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Submit package</Button>
      </>
    ),
  },
};

/** Large width: a dense table as the body. */
export const ModalLarge: Story = {
  parameters: { layout: "fullscreen", controls: { disable: true } },
  decorators: [behindPage],
  args: {
    width: "lg",
    title: "Link evidence",
    description: "Evidence already collected for AC-2(3). Pick what supports this assessment.",
    children: (
      <Table>
        <thead>
          <tr>
            <Table.Header className="w-[96px]">Evidence</Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header className="w-[120px]">Kind</Table.Header>
            <Table.Header className="w-[72px] text-right">Age</Table.Header>
          </tr>
        </thead>
        <tbody>
          {evidence.map((e) => (
            <Table.Row key={e.id}>
              <Table.Id id={e.id} />
              <Table.Cell>{e.title}</Table.Cell>
              <Table.Cell>
                <Badge size="xs">{e.kind}</Badge>
              </Table.Cell>
              <Table.Cell className="text-right">
                {e.age.endsWith("d") && parseInt(e.age, 10) > 30 ? (
                  <Badge tone="warning" size="xs">
                    {e.age}
                  </Badge>
                ) : (
                  <span className="tnum text-muted-foreground">{e.age}</span>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    ),
    footer: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Link 2 items</Button>
      </>
    ),
  },
};

/** Right-side detail surface with subtitle and footer. */
export const DrawerOpen: Story = {
  parameters: { layout: "fullscreen", controls: { disable: true } },
  decorators: [behindPage],
  render: () => (
    <Drawer
      open
      onClose={noop}
      title="Shared admin account on jump host"
      subtitle="FND-2231 · opened 2026-08-14 by D. Reyes"
      footer={
        <>
          <Button variant="ghost">Close</Button>
          <Button variant="primary">Open finding</Button>
        </>
      }
    >
      <dl>
        <KeyValue label="Control">
          <Id>AC-2(3)</Id>
        </KeyValue>
        <KeyValue label="Severity">
          <Badge tone="danger" size="xs">
            Critical
          </Badge>
        </KeyValue>
        <KeyValue label="Status">
          <Badge tone="danger">Overdue</Badge>
        </KeyValue>
        <KeyValue label="Owner">
          <Person name="D. Reyes" />
        </KeyValue>
        <KeyValue label="Due">
          <span className="tnum">2026-08-28</span>
        </KeyValue>
      </dl>
      <p className="mt-4 text-[13px] leading-relaxed">
        The jump host has a local administrator account shared by the operations team. Access is not
        attributable to an individual and the account is not covered by the 90-day inactivity job.
      </p>
      <div className="mt-4">
        <Button size="sm">
          <Plus className="size-3.5" />
          Add evidence
        </Button>
      </div>
    </Drawer>
  ),
};

/** Avatar at both sizes, Person, and an AvatarStack overflowing its max. */
export const People: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Spec>Avatar · xs</Spec>
        <div className="flex items-center gap-2">
          {people.map((p) => (
            <Avatar key={p} name={p} size="xs" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Spec>Avatar · sm</Spec>
        <div className="flex items-center gap-2">
          {people.map((p) => (
            <Avatar key={p} name={p} size="sm" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Spec>Person</Spec>
        <div className="space-y-1.5">
          {people.slice(0, 3).map((p) => (
            <Person key={p} name={p} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Spec>AvatarStack · 6 names, max 4</Spec>
        <Avatar.Stack names={people} />
      </div>
    </div>
  ),
};
