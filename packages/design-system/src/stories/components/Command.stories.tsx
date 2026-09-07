import type { Meta, StoryObj } from "@storybook/react-vite";

import { FileText, Search, Settings, User } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Command, DropdownMenu, Id, Kbd } from "../../components";
import { CommandKeys } from "../../lib/command-keys";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Command",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

function PaletteBody({ onSelect = () => undefined }: { onSelect?: (() => void) | undefined }) {
  return (
    <>
      <Command.Input placeholder="Type a command…" />
      <Command.List>
        <Command.Group heading="Controls">
          <Command.Item onSelect={onSelect} trailing="Finance">
            <FileText aria-hidden className="size-icon-small icon-subtle" />
            Open CTRL-0412 Segregation of duties
          </Command.Item>
          <Command.Item onSelect={onSelect} trailing="Finance">
            <FileText aria-hidden className="size-icon-small icon-subtle" />
            Open CTRL-0418 Vendor master change approval
          </Command.Item>
          <Command.Item onSelect={onSelect} trailing="Security">
            <FileText aria-hidden className="size-icon-small icon-subtle" />
            Open CTRL-0450 Privileged access review
          </Command.Item>
        </Command.Group>
        <Command.Separator />
        <Command.Group heading="People">
          <Command.Item onSelect={onSelect}>
            <User aria-hidden className="size-icon-small icon-subtle" />
            Assign to Dana Whitfield
          </Command.Item>
          <Command.Item onSelect={onSelect}>
            <User aria-hidden className="size-icon-small icon-subtle" />
            Assign to Priya Natarajan
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Actions">
          <Command.Item onSelect={onSelect} trailing={<Kbd>,</Kbd>}>
            <Settings aria-hidden className="size-icon-small icon-subtle" />
            Open settings
          </Command.Item>
          <Command.Item disabled>
            <Search aria-hidden className="size-icon-small icon-subtle" />
            Advanced search
          </Command.Item>
        </Command.Group>
      </Command.List>
      <Command.Empty>No commands match.</Command.Empty>
      <Command.Footer>
        <CommandKeys choose="to run" />
        <span className="ms-auto">
          <Command.Count />
        </span>
      </Command.Footer>
    </>
  );
}

/** The palette inline: the field, groups of commands with an icon for the kind and a hint at the end, a footer of keys and the live count. Type to filter; the arrows move and Enter runs. */
export const Palette: Story = {
  render: () => (
    <Box className="w-layout-list rounded-large border border-default shadow-raised">
      <Command label="Commands">
        <PaletteBody />
      </Command>
    </Box>
  ),
};

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Open palette <Kbd>⌘K</Kbd>
      </Button>
      <Command.Dialog open={open} onClose={() => setOpen(false)} label="Command palette">
        <PaletteBody onSelect={() => setOpen(false)} />
      </Command.Dialog>
    </>
  );
}

/** `Command.Dialog`: the same body over the page, near the top, gone on Escape, the blanket or a choice. The kit's CommandPalette is this with the commands as data. */
export const AsDialog: Story = { render: () => <DialogDemo /> };

const records = [
  {
    id: "EV-2201",
    title: "Bank reconciliation, July",
    meta: "PDF · Finance · 12 Aug",
    badge: "Current",
    tone: "success",
  },
  {
    id: "EV-2202",
    title: "Approval matrix",
    meta: "XLSX · Finance · 3 Aug",
    badge: "Current",
    tone: "success",
  },
  {
    id: "EV-2190",
    title: "Walkthrough notes, payables",
    meta: "DOCX · Audit · 22 Jun",
    badge: "Stale",
    tone: "warning",
  },
  {
    id: "EV-2104",
    title: "Vendor master extract",
    meta: "CSV · IT · 9 May",
    badge: "Expired",
    tone: "danger",
  },
] as const;

function PickerDemo() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <Stack space="space.150">
      <Inline space="space.100" alignBlock="center">
        <Button onClick={() => setOpen(true)}>Link evidence</Button>
        {picked ? (
          <Text size="small" color="color.text.subtle">
            Linked {picked}.
          </Text>
        ) : null}
      </Inline>
      <Command.Dialog
        open={open}
        onClose={() => setOpen(false)}
        label="Link evidence"
        width="large"
      >
        <Command.Input placeholder="Search evidence…" hint={<Command.Count />} autoFocus />
        <Command.List>
          {records.map((r) => (
            <Command.Item
              key={r.id}
              value={`${r.id} ${r.title} ${r.meta}`}
              className="h-auto py-100"
              onSelect={() => {
                setPicked(r.id);
                setOpen(false);
              }}
            >
              <Id className="text-subtle">{r.id}</Id>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{r.title}</span>
                <span className="block truncate font-body-xsmall text-subtle">{r.meta}</span>
              </span>
              <Badge variant="secondary" size="xsmall" tone={r.tone}>
                {r.badge}
              </Badge>
            </Command.Item>
          ))}
        </Command.List>
        <Command.Empty>Nothing matches. Try the id or the file's name.</Command.Empty>
        <Command.Footer>
          <CommandKeys />
        </Command.Footer>
      </Command.Dialog>
    </Stack>
  );
}

/** A picker: `width="large"`, the count in the field, two-line rows with the id before and a Badge after. The kit's RecordPicker is this with the records as data. */
export const Picker: Story = { render: () => <PickerDemo /> };

function LoadingDemo() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const search = (q: string) => {
    setQuery(q);
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setResults(
        ["AC-2 Account management", "AC-3 Access enforcement", "AC-6 Least privilege"].filter((r) =>
          r.toLowerCase().includes(q.toLowerCase()),
        ),
      );
      setLoading(false);
    }, 900);
  };
  return (
    <Box className="w-layout-list rounded-large border border-default shadow-raised">
      <Command label="Controls" shouldFilter={false}>
        <Command.Input
          placeholder="Search controls on the server…"
          value={query}
          onValueChange={search}
        />
        <Command.List>
          {results.map((r) => (
            <Command.Item key={r} value={r}>
              {r}
            </Command.Item>
          ))}
        </Command.List>
        {loading ? <Command.Loading>Searching…</Command.Loading> : null}
        {!loading && query ? <Command.Empty>Nothing matches.</Command.Empty> : null}
      </Command>
    </Box>
  );
}

/** Rows fetched as the reader types: `shouldFilter={false}` hands the query to the caller, and `Command.Loading` holds the list while the rows come. Type "ac". */
export const Loading: Story = { render: () => <LoadingDemo /> };

/** The rows' states in one list, then the list's: empty, loading. The cursor row is the one Enter would choose; it tints as a menu's does. */
export const CommandMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="rows">
        <Command
          label="Rows"
          value="ac-3"
          style={{ width: 480 }}
          className="rounded-large border border-default"
        >
          <Command.Input placeholder="Type to filter…" />
          <Command.List>
            <Command.Group heading="Records">
              <Command.Item value="ac-2">AC-2 Account management</Command.Item>
              <Command.Item value="ac-3" trailing={<Kbd>⌘ 3</Kbd>}>
                AC-3 Access enforcement, the cursor
              </Command.Item>
              <Command.Item
                value="ac-6"
                trailing={
                  <Badge variant="secondary" tone="warning">
                    Partial
                  </Badge>
                }
              >
                AC-6 Least privilege
              </Command.Item>
              <Command.Item value="ac-7" disabled>
                AC-7 Unsuccessful logon attempts
              </Command.Item>
            </Command.Group>
            <Command.Separator />
            <Command.Group heading="Actions">
              <Command.Item value="new">
                <FileText aria-hidden className="size-icon-small icon-subtle" />
                New finding
              </Command.Item>
            </Command.Group>
          </Command.List>
          <Command.Empty>Nothing matches.</Command.Empty>
          <Command.Footer>
            <CommandKeys />
            <span className="ms-auto">
              <Command.Count />
            </span>
          </Command.Footer>
        </Command>
      </Specimens>
      <Specimens title="empty · loading">
        <Command
          label="Empty"
          style={{ width: 480 }}
          className="rounded-large border border-default"
        >
          <Command.Input value="zzz" onValueChange={() => undefined} hint={<Command.Count />} />
          <Command.List>
            <Command.Item value="ac-2">AC-2 Account management</Command.Item>
          </Command.List>
          <Command.Empty>Nothing matches. Try the id or the file's name.</Command.Empty>
        </Command>
        <Command
          label="Loading"
          shouldFilter={false}
          style={{ width: 480 }}
          className="rounded-large border border-default"
        >
          <Command.Input placeholder="Search evidence…" hint={null} />
          <Command.List></Command.List>
          <Command.Loading>Searching…</Command.Loading>
        </Command>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <DropdownMenu trigger={<Button>Actions</Button>}>
            <DropdownMenu.Item>Record assessment</DropdownMenu.Item>
            <DropdownMenu.Item>Link evidence</DropdownMenu.Item>
            <DropdownMenu.Item>Export report</DropdownMenu.Item>
            <DropdownMenu.Item tone="danger">Archive</DropdownMenu.Item>
          </DropdownMenu>
        }
        doText="Four actions behind one button are a DropdownMenu. The reader reads them; nothing needs filtering."
        dont={
          <Box style={{ width: 480 }} className="rounded-large border border-default">
            <Command label="Actions">
              <Command.Input placeholder="Type to filter…" />
              <Command.List>
                <Command.Item value="record">Record assessment</Command.Item>
                <Command.Item value="link">Link evidence</Command.Item>
                <Command.Item value="export">Export report</Command.Item>
                <Command.Item value="archive">Archive</Command.Item>
              </Command.List>
            </Command>
          </Box>
        }
        dontText="A Command for four rows. The field asks the reader to type before four things they could have read."
      />
      <Pair
        do={
          <Box style={{ width: 480 }} className="rounded-large border border-default">
            <Command label="Evidence">
              <Command.Input value="q3 recon" onValueChange={() => undefined} hint={null} />
              <Command.List>
                <Command.Item value="ev-2201">EV-2201 Bank reconciliation, July</Command.Item>
              </Command.List>
              <Command.Empty>
                Nothing matches. Try the id, or the file's name without the quarter.
              </Command.Empty>
            </Command>
          </Box>
        }
        doText="Nothing matched: the Empty says so and what to try."
        dont={
          <Box style={{ width: 480 }} className="rounded-large border border-default">
            <Command label="Evidence, blank">
              <Command.Input value="q3 recon" onValueChange={() => undefined} hint={null} />
              <Command.List>
                <Command.Item value="ev-2201">EV-2201 Bank reconciliation, July</Command.Item>
              </Command.List>
            </Command>
          </Box>
        }
        dontText="No Empty. The list is blank under the field and the reader wonders whether it is still searching."
      />
      <Pair
        do={
          <Box style={{ width: 480 }} className="rounded-large border border-default">
            <Command label="Commands">
              <Command.Input placeholder="Type a command…" />
              <Command.List>
                <Command.Item value="assessment" trailing={<Kbd>A</Kbd>}>
                  Record assessment
                </Command.Item>
                <Command.Item value="export" trailing={<Kbd>E</Kbd>}>
                  Export report
                </Command.Item>
              </Command.List>
            </Command>
          </Box>
        }
        doText="A verb and its object, the shortcut at the end as keys."
        dont={
          <Box style={{ width: 480 }} className="rounded-large border border-default">
            <Command label="Commands, sentences">
              <Command.Input placeholder="Type a command…" />
              <Command.List>
                <Command.Item value="assessment">
                  Press A to record a new assessment for this control
                </Command.Item>
                <Command.Item value="export">You can export the report by pressing E</Command.Item>
              </Command.List>
            </Command>
          </Box>
        }
        dontText="Sentences with the key inside them. The reader scans labels; the shortcut is a cap at the end, not a clause."
      />
    </Stack>
  ),
};
