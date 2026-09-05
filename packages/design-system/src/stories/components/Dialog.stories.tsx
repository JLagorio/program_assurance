import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  Badge,
  Button,
  Dialog,
  Field,
  Id,
  Input,
  KeyValue,
  Table,
  Textarea,
} from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: { layout: "padded" },
  args: {
    open: false,
    onClose: () => {},
    title: "Schedule assessment",
    description: "The assessor and the program owner are notified.",
    width: "medium",
    children: <Text>Flip open in the controls; Escape closes it again.</Text>,
  },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

// Radix hides the rest of the page (aria-hidden) while the modal is open and traps focus inside it; axe cannot see the trap.
const modalOpen = {
  a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } },
};

type Kind = "medium" | "large" | "aside" | "scrolling" | "eyebrow" | "pending";
const kinds: { kind: Kind; label: string }[] = [
  { kind: "medium", label: "Medium" },
  { kind: "large", label: "Large" },
  { kind: "aside", label: "Large with an aside" },
  { kind: "scrolling", label: "Scrolling body" },
  { kind: "eyebrow", label: "With an eyebrow" },
  { kind: "pending", label: "Pending" },
];

function Form() {
  return (
    <Stack space="space.200">
      <Field label="Assessor" isRequired>
        <Input placeholder="Choose an assessor" />
      </Field>
      <Field label="Window">
        <Input placeholder="14–18 Sep 2026" />
      </Field>
      <Field label="Notes">
        <Textarea rows={3} placeholder="Anything the assessor should know first." />
      </Field>
    </Stack>
  );
}

const aside = (
  <Stack space="space.050">
    <KeyValue label="Control">
      <Id>CTRL-0412</Id>
    </KeyValue>
    <KeyValue label="Owner">Dana Whitfield</KeyValue>
    <KeyValue label="Status">
      <Badge tone="information">In review</Badge>
    </KeyValue>
    <KeyValue label="Last verified">12 Aug 2026</KeyValue>
  </Stack>
);

const eyebrow = (
  <>
    <Id>CTRL-0412</Id>
    <Badge tone="information">In review</Badge>
  </>
);

function DialogStates() {
  const [open, setOpen] = useState<Kind | null>(null);
  const [saving, setSaving] = useState(false);
  const close = () => {
    setOpen(null);
    setSaving(false);
  };
  const large = open === "large" || open === "aside" || open === "scrolling";
  const pending = open === "pending" && saving;
  return (
    <Stack space="space.200">
      <Inline space="space.100" shouldWrap>
        {kinds.map((k) => (
          <Button key={k.kind} variant="secondary" onClick={() => setOpen(k.kind)}>
            {k.label}
          </Button>
        ))}
      </Inline>
      <Dialog
        open={open !== null}
        onClose={close}
        title="Schedule assessment"
        description="The assessor and the program owner are notified."
        width={large ? "large" : "medium"}
        {...(open === "aside" ? { aside } : {})}
        {...(open === "eyebrow" ? { eyebrow } : {})}
        pending={pending}
        footer={
          <>
            <Button variant="subtle" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={pending}
              onClick={() => {
                if (open === "pending") {
                  setSaving(true);
                  setTimeout(close, 1500);
                } else close();
              }}
            >
              Schedule
            </Button>
          </>
        }
      >
        {open === "scrolling" ? (
          <Stack space="space.200">
            {Array.from({ length: 9 }, (_, i) => (
              <Field key={i} label={`Field ${i + 1}`}>
                <Input />
              </Field>
            ))}
          </Stack>
        ) : (
          <Form />
        )}
      </Dialog>
    </Stack>
  );
}

/** Every state one click away, since an open dialog covers the page: medium, large, with an aside, a body that scrolls, an eyebrow, and pending while it saves. */
export const DialogMatrix: Story = { render: () => <DialogStates /> };

/** Large, with an eyebrow, a description, an aside and a footer, held open. */
export const OpenMatrix: Story = {
  name: "Open",
  parameters: modalOpen,
  render: () => (
    <Dialog
      open
      onClose={() => {}}
      width="large"
      eyebrow={eyebrow}
      title="Schedule assessment"
      description="The assessor and the program owner are notified."
      aside={aside}
      footer={
        <>
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary">Schedule</Button>
        </>
      }
    >
      <Form />
    </Dialog>
  ),
};

const rows = [
  ["CTRL-0412", "Segregation of duties, payables"],
  ["CTRL-0418", "Vendor master change approval"],
  ["CTRL-0450", "Privileged access review"],
] as const;

function DontDemo() {
  const [open, setOpen] = useState<"task" | "record" | "verb" | "ok" | null>(null);
  const close = () => setOpen(null);
  return (
    <Stack space="space.400">
      <Pair
        do={
          <Button variant="secondary" onClick={() => setOpen("task")}>
            Open: one task
          </Button>
        }
        doText="A short task with a verb at the end: two or three fields and Schedule."
        dont={
          <Button variant="secondary" onClick={() => setOpen("record")}>
            Open: a record
          </Button>
        }
        dontText="A record in a dialog: facts, a table, everything. It is a page, or a Sheet beside the list; the reader cannot keep it or link to it."
      />
      <Pair
        do={
          <Button variant="secondary" onClick={() => setOpen("verb")}>
            Open: the verb
          </Button>
        }
        doText="The primary says the act, as the button that opened the dialog did: Schedule."
        dont={
          <Button variant="secondary" onClick={() => setOpen("ok")}>
            Open: OK
          </Button>
        }
        dontText="OK and Done. Neither says what happens, and the reader confirms without knowing what."
      />
      <Dialog
        open={open === "task" || open === "verb"}
        onClose={close}
        title="Schedule assessment"
        footer={
          <>
            <Button variant="subtle" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={close}>
              Schedule
            </Button>
          </>
        }
      >
        <Form />
      </Dialog>
      <Dialog
        open={open === "ok"}
        onClose={close}
        title="Schedule assessment"
        footer={
          <>
            <Button variant="subtle" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={close}>
              OK
            </Button>
          </>
        }
      >
        <Form />
      </Dialog>
      <Dialog
        open={open === "record"}
        onClose={close}
        width="large"
        eyebrow={eyebrow}
        title="Segregation of duties, payables"
        description="Finance · Dana Whitfield · Quarterly"
        aside={aside}
        footer={
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        }
      >
        <Stack space="space.200">
          <Text>
            Payables are entered and approved by different people; the approval list is reviewed
            quarterly against the HR roster.
          </Text>
          <Table label="Findings">
            <thead>
              <tr>
                <Table.Header width={120}>Id</Table.Header>
                <Table.Header>Finding</Table.Header>
              </tr>
            </thead>
            <tbody>
              {rows.map(([id, name]) => (
                <Table.Row key={id}>
                  <Table.Id id={id} />
                  <Table.Cell>{name}</Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Stack>
      </Dialog>
    </Stack>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. Open each. */
export const Dont: Story = { render: () => <DontDemo /> };

export const Playground: Story = {};
