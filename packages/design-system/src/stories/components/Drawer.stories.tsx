import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Checkbox, Drawer, Field, Input } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Drawer",
  component: Drawer,
  parameters: { layout: "padded" },
  args: {
    open: false,
    onClose: () => {},
    title: "Quick actions",
    description: "The bottom sheet, for a narrow screen.",
    children: <Text>Flip open in the controls; Escape closes it again.</Text>,
  },
} satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;

// Radix hides the rest of the page (aria-hidden) while the modal is open and traps focus inside it; axe cannot see the trap.
const modalOpen = {
  a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } },
};

type Kind = "actions" | "filters" | "long";
const kinds: { kind: Kind; label: string }[] = [
  { kind: "actions", label: "Quick actions" },
  { kind: "filters", label: "Filters with a footer" },
  { kind: "long", label: "Body that scrolls" },
];

const actions = (
  <Stack space="space.050">
    <Button variant="subtle" isFullWidth>
      Mark verified
    </Button>
    <Button variant="subtle" isFullWidth>
      Request evidence
    </Button>
    <Button variant="subtle" isFullWidth>
      Reassign
    </Button>
  </Stack>
);

const filters = (
  <Stack space="space.100">
    <Checkbox defaultChecked>Overdue</Checkbox>
    <Checkbox>In review</Checkbox>
    <Checkbox>Verified</Checkbox>
    <Checkbox>Draft</Checkbox>
  </Stack>
);

function DrawerStates() {
  const [open, setOpen] = useState<Kind | null>(null);
  const close = () => setOpen(null);
  return (
    <Stack space="space.200">
      <Inline space="space.100" shouldWrap>
        {kinds.map((k) => (
          <Button key={k.kind} variant="secondary" onClick={() => setOpen(k.kind)}>
            {k.label}
          </Button>
        ))}
      </Inline>
      <Drawer
        open={open !== null}
        onClose={close}
        title={open === "filters" ? "Filters" : open === "long" ? "Evidence" : "Quick actions"}
        description={
          open === "filters"
            ? "Narrow the register."
            : open === "long"
              ? "Everything attached to the control."
              : "For CTRL-0412."
        }
        {...(open === "filters"
          ? {
              footer: (
                <>
                  <Button variant="subtle" onClick={close}>
                    Clear
                  </Button>
                  <Button variant="primary" onClick={close}>
                    Apply
                  </Button>
                </>
              ),
            }
          : {})}
      >
        {open === "filters" ? (
          filters
        ) : open === "long" ? (
          <Stack space="space.200">
            {Array.from({ length: 12 }, (_, i) => (
              <Field key={i} label={`Evidence ${i + 1}`}>
                <Input defaultValue={`Artifact ${i + 1}`} readOnly />
              </Field>
            ))}
          </Stack>
        ) : (
          actions
        )}
      </Drawer>
    </Stack>
  );
}

/** Every state one click away, since an open drawer covers the page: quick actions, filters with a footer, and a body that scrolls under the handle. */
export const DrawerMatrix: Story = { render: () => <DrawerStates /> };

/** Quick actions for one record, held open. Drag the handle down to close it. */
export const OpenMatrix: Story = {
  name: "Open",
  parameters: modalOpen,
  render: () => (
    <Drawer open onClose={() => {}} title="Quick actions" description="For CTRL-0412.">
      {actions}
    </Drawer>
  ),
};

function DontDemo() {
  const [open, setOpen] = useState<"actions" | "form" | null>(null);
  const close = () => setOpen(null);
  return (
    <Stack space="space.400">
      <Pair
        do={
          <Button variant="secondary" onClick={() => setOpen("actions")}>
            Open: three actions
          </Button>
        }
        doText="A short list of things to do with the record under the thumb."
        dont={
          <Button variant="secondary" onClick={() => setOpen("form")}>
            Open: a form
          </Button>
        }
        dontText="A form in a drawer. The keyboard covers half of it, the reader scrolls inside a sheet that also drags, and a Dialog or a page was the answer."
      />
      <Drawer
        open={open === "actions"}
        onClose={close}
        title="Quick actions"
        description="For CTRL-0412."
      >
        {actions}
      </Drawer>
      <Drawer
        open={open === "form"}
        onClose={close}
        title="New finding"
        footer={
          <>
            <Button variant="subtle" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={close}>
              Create
            </Button>
          </>
        }
      >
        <Stack space="space.200">
          {["Title", "Owner", "Severity", "Due", "Source", "Notes"].map((l) => (
            <Field key={l} label={l}>
              <Input />
            </Field>
          ))}
        </Stack>
      </Drawer>
    </Stack>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. Open each. */
export const Dont: Story = { render: () => <DontDemo /> };

export const Playground: Story = {};
