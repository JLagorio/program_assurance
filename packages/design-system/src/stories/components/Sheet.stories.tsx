import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  Badge,
  Button,
  Fact,
  Field,
  FilterChip,
  Id,
  Input,
  KeyValue,
  Sheet,
  TextLink,
  Toolbar,
} from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Sheet",
  component: Sheet,
  parameters: { layout: "padded" },
  args: {
    open: false,
    onClose: () => {},
    title: "CTRL-0412",
    subtitle: "Segregation of duties, payables",
    side: "end",
    width: 420,
    children: <Text>Flip open in the controls; Escape closes it again.</Text>,
  },
} satisfies Meta<typeof Sheet>;
export default meta;
type Story = StoryObj<typeof meta>;

// Radix hides the rest of the page (aria-hidden) while the modal is open and traps focus inside it; axe cannot see the trap.
const modalOpen = {
  a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } },
};

type Kind = "end" | "start" | "header" | "toolbar" | "stack" | "wide";
const kinds: { kind: Kind; label: string }[] = [
  { kind: "end", label: "From the end" },
  { kind: "start", label: "From the start" },
  { kind: "header", label: "Eyebrow and facts" },
  { kind: "toolbar", label: "With a toolbar" },
  { kind: "stack", label: "One frame of a stack" },
  { kind: "wide", label: "Wide with a footer" },
];

const facts = (
  <>
    <Fact label="Owner">Dana Whitfield</Fact>
    <Fact label="Frequency">Quarterly</Fact>
    <Fact label="Verified">12 Aug 2026</Fact>
  </>
);

const eyebrow = (
  <>
    <Id>CTRL-0412</Id>
    <Badge tone="success">Verified</Badge>
  </>
);

function Detail() {
  return (
    <Stack space="space.200">
      <Text>
        Payables are entered and approved by different people; the approval list is reviewed
        quarterly against the HR roster.
      </Text>
      <Stack space="space.050">
        <KeyValue label="Family">Finance</KeyValue>
        <KeyValue label="Baseline">Moderate</KeyValue>
        <KeyValue label="Findings">2 open</KeyValue>
        <KeyValue label="Evidence">4 items</KeyValue>
      </Stack>
    </Stack>
  );
}

function SheetStates() {
  const [open, setOpen] = useState<Kind | null>(null);
  const [frame, setFrame] = useState(1);
  const close = () => {
    setOpen(null);
    setFrame(1);
  };
  const header = open === "header" || open === "stack";
  return (
    <Stack space="space.200">
      <Inline space="space.100" shouldWrap>
        {kinds.map((k) => (
          <Button key={k.kind} variant="secondary" onClick={() => setOpen(k.kind)}>
            {k.label}
          </Button>
        ))}
      </Inline>
      <Sheet
        open={open !== null}
        onClose={close}
        title={
          open === "stack" && frame === 2
            ? "Stale admin accounts"
            : header
              ? "Segregation of duties, payables"
              : "CTRL-0412"
        }
        subtitle={
          open === "stack" && frame === 2
            ? "Finding · Dana Whitfield"
            : header
              ? "Finance · Dana Whitfield"
              : "Segregation of duties, payables"
        }
        side={open === "start" ? "start" : "end"}
        width={open === "wide" ? 640 : 420}
        {...(header ? { eyebrow, facts } : {})}
        {...(open === "stack" && frame === 2 ? { onBack: () => setFrame(1) } : {})}
        {...(open === "toolbar"
          ? {
              toolbar: (
                <Toolbar search="" onSearch={() => {}} placeholder="Search evidence">
                  <FilterChip label="Kind" />
                </Toolbar>
              ),
            }
          : {})}
        {...(open === "wide"
          ? {
              footer: (
                <>
                  <Button variant="subtle" onClick={close}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={close}>
                    Save
                  </Button>
                </>
              ),
            }
          : {})}
      >
        {open === "wide" ? (
          <Stack space="space.200">
            <Field label="Owner">
              <Input defaultValue="Dana Whitfield" />
            </Field>
            <Field label="Frequency">
              <Input defaultValue="Quarterly" />
            </Field>
          </Stack>
        ) : open === "stack" && frame === 1 ? (
          <Stack space="space.200">
            <Detail />
            <Text size="small" color="color.text.subtle">
              A link inside opens the next frame of the same sheet:{" "}
              <TextLink>
                <button type="button" onClick={() => setFrame(2)}>
                  FND-2231
                </button>
              </TextLink>
            </Text>
          </Stack>
        ) : (
          <Detail />
        )}
      </Sheet>
    </Stack>
  );
}

/** Every state one click away, since an open sheet covers the page: either edge, the header with an eyebrow and facts, a toolbar, a stack with its back chevron, and wide with a footer. */
export const SheetMatrix: Story = { render: () => <SheetStates /> };

/** From the end, with an eyebrow, a subtitle, three facts, a toolbar and a footer, held open. */
export const OpenMatrix: Story = {
  name: "Open",
  parameters: modalOpen,
  render: () => (
    <Sheet
      open
      onClose={() => {}}
      title="Segregation of duties, payables"
      subtitle="Finance · Dana Whitfield"
      eyebrow={eyebrow}
      facts={facts}
      toolbar={
        <Toolbar search="" onSearch={() => {}} placeholder="Search evidence">
          <FilterChip label="Kind" />
        </Toolbar>
      }
      footer={
        <TextLink>
          <a href="#record">Open the full record</a>
        </TextLink>
      }
    >
      <Detail />
    </Sheet>
  ),
};

function DontDemo() {
  const [open, setOpen] = useState<"peek" | "whole" | "end" | "start" | null>(null);
  const close = () => setOpen(null);
  return (
    <Stack space="space.400">
      <Pair
        do={
          <Button variant="secondary" onClick={() => setOpen("peek")}>
            Open: a peek
          </Button>
        }
        doText="The record's detail beside the list, with the way to the full record in the footer."
        dont={
          <Button variant="secondary" onClick={() => setOpen("whole")}>
            Open: the whole record
          </Button>
        }
        dontText="The whole record in a sheet, with its own tabs and actions. The reader cannot link to it, and the list behind is a blanket."
      />
      <Pair
        do={
          <Button variant="secondary" onClick={() => setOpen("end")}>
            Open: from the end
          </Button>
        }
        doText="A record's detail comes from the end, beside the list it belongs to."
        dont={
          <Button variant="secondary" onClick={() => setOpen("start")}>
            Open: from the start
          </Button>
        }
        dontText="A record from the start edge, over the navigation. The start is for things about the navigation itself."
      />
      <Sheet
        open={open === "peek" || open === "end"}
        onClose={close}
        title="Segregation of duties, payables"
        subtitle="Finance · Dana Whitfield"
        eyebrow={eyebrow}
        facts={facts}
        footer={
          <TextLink>
            <a href="#record">Open the full record</a>
          </TextLink>
        }
      >
        <Detail />
      </Sheet>
      <Sheet
        open={open === "whole"}
        onClose={close}
        width={720}
        title="Segregation of duties, payables"
        subtitle="Finance · Dana Whitfield"
        eyebrow={eyebrow}
        toolbar={
          <Inline space="space.075">
            {["Overview", "Evidence", "Findings", "History", "Settings"].map((t) => (
              <FilterChip key={t} label={t} isActive={t === "Overview"} />
            ))}
          </Inline>
        }
        footer={
          <>
            <Button variant="subtle">Reassign</Button>
            <Button variant="subtle">Defer</Button>
            <Button variant="primary">Verify</Button>
          </>
        }
      >
        <Detail />
      </Sheet>
      <Sheet
        open={open === "start"}
        onClose={close}
        side="start"
        title="Segregation of duties, payables"
        subtitle="Finance · Dana Whitfield"
        eyebrow={eyebrow}
        facts={facts}
      >
        <Detail />
      </Sheet>
    </Stack>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. Open each. */
export const Dont: Story = { render: () => <DontDemo /> };

export const Playground: Story = {};
