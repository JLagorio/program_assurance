import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { AlertDialog, Button, Checkbox } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/AlertDialog",
  component: AlertDialog,
  parameters: { layout: "padded" },
  args: {
    open: false,
    onClose: () => {},
    onConfirm: () => {},
    title: "Archive this program?",
    description: "Its controls, evidence and findings stay readable; nothing can be edited.",
    confirmLabel: "Archive",
    tone: "danger",
  },
} satisfies Meta<typeof AlertDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

// Radix hides the rest of the page (aria-hidden) while the modal is open and traps focus inside it; axe cannot see the trap.
const modalOpen = {
  a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } },
};

type Kind = "primary" | "danger" | "pending" | "control";
const kinds: { kind: Kind; label: string }[] = [
  { kind: "primary", label: "Primary" },
  { kind: "danger", label: "Danger" },
  { kind: "pending", label: "Pending" },
  { kind: "control", label: "With a control" },
];

function AlertDialogStates() {
  const [open, setOpen] = useState<Kind | null>(null);
  const [saving, setSaving] = useState(false);
  const close = () => {
    setOpen(null);
    setSaving(false);
  };
  const danger = open === "danger" || open === "control";
  return (
    <Stack space="space.200">
      <Inline space="space.100" shouldWrap>
        {kinds.map((k) => (
          <Button key={k.kind} variant="secondary" onClick={() => setOpen(k.kind)}>
            {k.label}
          </Button>
        ))}
      </Inline>
      <AlertDialog
        open={open !== null}
        onClose={close}
        onConfirm={() => {
          if (open === "pending") {
            setSaving(true);
            setTimeout(close, 1500);
          } else close();
        }}
        title={danger ? "Archive this program?" : "Submit for authorization?"}
        description={
          danger
            ? "Its controls, evidence and findings stay readable; nothing can be edited."
            : "The package locks and the authorizing official is notified."
        }
        tone={danger ? "danger" : "primary"}
        confirmLabel={danger ? "Archive" : "Submit"}
        pending={open === "pending" && saving}
      >
        {open === "control" ? <Checkbox>Also close its open findings</Checkbox> : null}
      </AlertDialog>
    </Stack>
  );
}

/** Every state one click away, since an open dialog covers the page: primary, danger, pending while it saves, and with one control the decision needs. */
export const AlertDialogMatrix: Story = { render: () => <AlertDialogStates /> };

/** A danger decision, held open. Focus is on Cancel. */
export const OpenMatrix: Story = {
  name: "Open",
  parameters: modalOpen,
  render: () => (
    <AlertDialog
      open
      onClose={() => {}}
      onConfirm={() => {}}
      title="Archive this program?"
      description="Its controls, evidence and findings stay readable; nothing can be edited."
      tone="danger"
      confirmLabel="Archive"
    />
  ),
};

function DontDemo() {
  const [open, setOpen] = useState<"question" | "sure" | "danger" | "save" | null>(null);
  const close = () => setOpen(null);
  return (
    <Stack space="space.400">
      <Pair
        do={
          <Button variant="secondary" onClick={() => setOpen("question")}>
            Open: the question
          </Button>
        }
        doText="The title asks with the object in it, the description says what happens, the button says the verb."
        dont={
          <Button variant="secondary" onClick={() => setOpen("sure")}>
            Open: are you sure
          </Button>
        }
        dontText='"Are you sure?" and Yes. Sure of what? The reader who arrived by accident cannot tell what Yes does.'
      />
      <Pair
        do={
          <Button variant="secondary" onClick={() => setOpen("danger")}>
            Open: cannot be undone
          </Button>
        }
        doText="A word before an act that removes, closes or cannot be undone."
        dont={
          <Button variant="secondary" onClick={() => setOpen("save")}>
            Open: a routine save
          </Button>
        }
        dontText="A word before a save. The act is reversible and frequent; the dialog is a toll, and the reader learns to click through it."
      />
      <AlertDialog
        open={open === "question" || open === "danger"}
        onClose={close}
        onConfirm={close}
        title="Archive this program?"
        description="Its controls, evidence and findings stay readable; nothing can be edited."
        tone="danger"
        confirmLabel="Archive"
      />
      <AlertDialog
        open={open === "sure"}
        onClose={close}
        onConfirm={close}
        title="Are you sure?"
        tone="danger"
        confirmLabel="Yes"
        cancelLabel="No"
      />
      <AlertDialog
        open={open === "save"}
        onClose={close}
        onConfirm={close}
        title="Save changes?"
        description="The control's owner and frequency will be updated."
        confirmLabel="Save"
      />
    </Stack>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. Open each. */
export const Dont: Story = { render: () => <DontDemo /> };

export const Playground: Story = {};
