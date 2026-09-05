import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { useState } from "react";

import { Button, DropdownMenu, IconButton, Kbd, NativeSelect, Table } from "../../components";
import { Box, Stack } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  parameters: { layout: "padded" },
  args: {
    align: "start",
    width: 200,
    trigger: (
      <Button variant="secondary" iconAfter={<ChevronDown />}>
        Actions
      </Button>
    ),
    children: (
      <>
        <DropdownMenu.Item>Edit</DropdownMenu.Item>
        <DropdownMenu.Item>Reassign</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item tone="danger">Archive</DropdownMenu.Item>
      </>
    ),
  },
} satisfies Meta<typeof DropdownMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

// Radix hides the rest of the page (aria-hidden) while the modal menu is open and traps focus inside it; axe cannot see the trap.
const modalMenu = {
  a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } },
};

/** One menu, open, holding every item state: plain, with a shortcut, chosen and not, disabled, and the danger item last under its separator. */
export const DropdownMenuMatrix: Story = {
  parameters: modalMenu,
  render: () => (
    <Box style={{ height: 320 }} className="p-400">
      <DropdownMenu
        trigger={
          <Button variant="secondary" iconAfter={<ChevronDown />}>
            Actions
          </Button>
        }
        defaultOpen
        width={240}
      >
        <DropdownMenu.Label>Control</DropdownMenu.Label>
        <DropdownMenu.Item onSelect={() => {}}>Open record</DropdownMenu.Item>
        <DropdownMenu.Item
          onSelect={() => {}}
          trailing={
            <span className="flex items-center gap-025">
              <Kbd>⌘</Kbd>
              <Kbd>E</Kbd>
            </span>
          }
        >
          Edit
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => {}} isSelected closeOnSelect={false}>
          Pin to rail
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => {}} isSelected={false} closeOnSelect={false}>
          Watch
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => {}} disabled>
          Reassign
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onSelect={() => {}} tone="danger">
          Archive
        </DropdownMenu.Item>
      </DropdownMenu>
    </Box>
  ),
};

const rows = [
  { id: "FND-2231", name: "Stale admin accounts", owner: "Dana Whitfield" },
  { id: "FND-2214", name: "Unsigned firmware", owner: "Grace Hoppel" },
  { id: "FND-2240", name: "Backups untested", owner: "Marcus Ryde" },
];

/** Row actions: a kebab at the end of the row, visible on hover and on focus, its menu aligned to the end. */
export const Kebab: Story = {
  render: () => (
    <div style={{ width: 560 }}>
      <Table label="Findings">
        <thead>
          <tr>
            <Table.Header width={110}>Id</Table.Header>
            <Table.Header>Finding</Table.Header>
            <Table.Header width={160}>Owner</Table.Header>
            <Table.Header width={48} aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Table.Row key={r.id}>
              <Table.Id id={r.id} />
              <Table.Cell>{r.name}</Table.Cell>
              <Table.Cell>{r.owner}</Table.Cell>
              <Table.Cell className="max-w-none pe-050 text-right">
                <DropdownMenu
                  align="end"
                  trigger={
                    <IconButton
                      label={`Actions for ${r.id}`}
                      variant="subtle"
                      className="invisible focus-visible:visible group-hover/row:visible data-[state=open]:visible"
                      icon={<MoreHorizontal />}
                    />
                  }
                >
                  <DropdownMenu.Item onSelect={() => {}}>Open</DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => {}}>Reassign</DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={() => {}} tone="danger">
                    Close finding
                  </DropdownMenu.Item>
                </DropdownMenu>
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  ),
};

const columns = ["Owner", "Status", "Severity", "Due", "Family"];

function TogglesDemo() {
  const [shown, setShown] = useState<string[]>(["Owner", "Status", "Due"]);
  return (
    <DropdownMenu
      width={220}
      trigger={
        <Button variant="secondary" size="small" iconAfter={<ChevronDown />}>
          Columns
        </Button>
      }
    >
      <DropdownMenu.Label>Show</DropdownMenu.Label>
      {columns.map((c) => (
        <DropdownMenu.Item
          key={c}
          isSelected={shown.includes(c)}
          closeOnSelect={false}
          onSelect={() => setShown((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))}
        >
          {c}
        </DropdownMenu.Item>
      ))}
      <DropdownMenu.Separator />
      <DropdownMenu.Item onSelect={() => setShown([...columns])}>Reset view</DropdownMenu.Item>
    </DropdownMenu>
  );
}

/** A list of toggles: `isSelected` makes each a checkbox item with the check at the end, and `closeOnSelect={false}` keeps the menu open. */
export const Toggles: Story = { render: () => <TogglesDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ height: 200 }}>
            <DropdownMenu
              trigger={
                <Button variant="secondary" iconAfter={<ChevronDown />}>
                  Actions
                </Button>
              }
              defaultOpen
            >
              <DropdownMenu.Item>Edit</DropdownMenu.Item>
              <DropdownMenu.Item>Reassign</DropdownMenu.Item>
              <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item tone="danger">Archive</DropdownMenu.Item>
            </DropdownMenu>
          </Box>
        }
        doText="Four verbs, the one that removes something last, under a separator, in red."
        dont={
          <Box style={{ height: 200 }}>
            <DropdownMenu
              trigger={
                <Button variant="secondary" iconAfter={<ChevronDown />}>
                  Actions
                </Button>
              }
              defaultOpen
            >
              <DropdownMenu.Item>Archive</DropdownMenu.Item>
              <DropdownMenu.Item>Edit</DropdownMenu.Item>
              <DropdownMenu.Item>Reassign</DropdownMenu.Item>
              <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
            </DropdownMenu>
          </Box>
        }
        dontText="Archive first, dressed like the rest. The first item takes focus when the menu opens, so Enter twice archives."
      />
      <Pair
        do={
          <div style={{ width: 220 }}>
            <NativeSelect aria-label="Status" defaultValue="review">
              <option value="draft">Draft</option>
              <option value="review">In review</option>
              <option value="verified">Verified</option>
            </NativeSelect>
          </div>
        }
        doText="A value in a form is a NativeSelect or a Select."
        dont={
          <DropdownMenu
            trigger={
              <Button variant="secondary" iconAfter={<ChevronDown />}>
                In review
              </Button>
            }
          >
            <DropdownMenu.Item isSelected={false}>Draft</DropdownMenu.Item>
            <DropdownMenu.Item isSelected>In review</DropdownMenu.Item>
            <DropdownMenu.Item isSelected={false}>Verified</DropdownMenu.Item>
          </DropdownMenu>
        }
        dontText="A menu as a form field. It has no label, no invalid state, and does not submit; only a cell edited in place uses a menu for a value."
      />
      <Pair
        do={
          <Box style={{ height: 200 }} className="flex justify-end">
            <DropdownMenu
              align="end"
              defaultOpen
              trigger={<IconButton label="More" variant="subtle" icon={<MoreHorizontal />} />}
            >
              <DropdownMenu.Item>Copy link</DropdownMenu.Item>
              <DropdownMenu.Item>Export</DropdownMenu.Item>
              <DropdownMenu.Item>Print</DropdownMenu.Item>
            </DropdownMenu>
          </Box>
        }
        doText="Under five items behind a menu button; a kebab's menu up to a dozen."
        dont={
          <Box style={{ height: 440 }} className="flex justify-end">
            <DropdownMenu
              align="end"
              defaultOpen
              trigger={<IconButton label="More" variant="subtle" icon={<MoreHorizontal />} />}
            >
              {[
                "Copy link",
                "Export",
                "Print",
                "Share",
                "Duplicate",
                "Move",
                "Rename",
                "Add to board pack",
                "Watch",
                "Pin to rail",
                "Open in new tab",
                "Show history",
                "Compare",
                "Archive",
              ].map((a) => (
                <DropdownMenu.Item key={a}>{a}</DropdownMenu.Item>
              ))}
            </DropdownMenu>
          </Box>
        }
        dontText="Fourteen items in one list. The reader scans a page to find one verb; the rest belong on the record's actions or nowhere."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Box style={{ height: 200 }}>
      <DropdownMenu {...args} />
    </Box>
  ),
};
