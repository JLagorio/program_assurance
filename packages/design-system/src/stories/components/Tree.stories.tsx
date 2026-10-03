import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FileText, Folder, MoreHorizontal } from "lucide-react";
import { createRef, useState } from "react";

import { Badge, Button, Count, IconButton, Id, Item, Tree } from "../../components";
import { Box, Stack } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/Tree",
  component: Tree,
  parameters: { layout: "padded" },
  args: {
    label: "Composition",
    children: [
      <Tree.Item key="1" depth={0} hasChildren isExpanded isSelected>
        Atlas payments platform
      </Tree.Item>,
      <Tree.Item key="2" depth={1} hasChildren>
        Payments API
      </Tree.Item>,
      <Tree.Item key="3" depth={1}>
        keycloak-idp
      </Tree.Item>,
    ],
  },
} satisfies Meta<typeof Tree>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Depth, guide lines, an open and a closed branch, a leaf, the selected row and a trailing slot; then the same tree at xsmall, and one with icons. */
export const TreeMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.300">
      <Specimens title="small (32px), text only">
        <Box className="w-layout-list max-w-full">
          <Tree label="Composition">
            <Tree.Item depth={0} hasChildren isExpanded>
              Atlas payments platform
            </Tree.Item>
            <Tree.Item depth={1} lines={[true]} hasChildren isExpanded>
              Payments API
            </Tree.Item>
            <Tree.Item
              depth={2}
              lines={[true, true]}
              isSelected
              trailing={
                <Badge variant="secondary" tone="warning" size="xsmall">
                  Partial
                </Badge>
              }
            >
              mission-api:2.1.4
            </Tree.Item>
            <Tree.Item depth={2} lines={[true, false]}>
              keycloak-idp
            </Tree.Item>
            <Tree.Item depth={1} lines={[false]} hasChildren trailing={<Count value={4} />}>
              Ground segment
            </Tree.Item>
            <Tree.Item depth={1} lines={[false]}>
              A leaf at depth one
            </Tree.Item>
          </Tree>
        </Box>
      </Specimens>
      <Specimens title="xsmall (24px), with icons on every row">
        <Box className="w-layout-list max-w-full">
          <Tree label="Control families" size="xsmall">
            <Tree.Item depth={0} hasChildren isExpanded trailing={<Count value={12} />}>
              <Folder className="size-icon-small icon-subtle" /> Finance
            </Tree.Item>
            <Tree.Item depth={1} hasChildren isExpanded>
              <Folder className="size-icon-small icon-subtle" /> Payables
            </Tree.Item>
            <Tree.Item depth={2} isSelected>
              <FileText className="size-icon-small icon-subtle" /> CTRL-0412 Segregation of duties
            </Tree.Item>
            <Tree.Item depth={2} lines={[true, false]}>
              <FileText className="size-icon-small icon-subtle" /> CTRL-0418 Vendor master change
            </Tree.Item>
            <Tree.Item depth={1} lines={[false]} hasChildren>
              <Folder className="size-icon-small icon-subtle" /> Receivables
            </Tree.Item>
            <Tree.Item depth={0} hasChildren trailing={<Count value={9} />}>
              <Folder className="size-icon-small icon-subtle" /> Security
            </Tree.Item>
          </Tree>
        </Box>
      </Specimens>
    </Stack>
  ),
};

function FamiliesDemo() {
  const [open, setOpen] = useState<Record<string, boolean>>({ finance: true, payables: true });
  const [sel, setSel] = useState("ctrl-0412");
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <Tree label="Control families" className="max-w-[420px]">
      <Tree.Item
        depth={0}
        hasChildren
        isExpanded={open["finance"]}
        onExpandedChange={() => toggle("finance")}
        isSelected={sel === "finance"}
        onSelect={() => setSel("finance")}
        trailing={<Count value={12} />}
      >
        <Folder className="size-icon-small icon-subtle" /> Finance
      </Tree.Item>
      {open["finance"] ? (
        <>
          <Tree.Item
            depth={1}
            hasChildren
            isExpanded={open["payables"]}
            onExpandedChange={() => toggle("payables")}
            isSelected={
              sel === "payables" || (!open["payables"] && ["ctrl-0412", "ctrl-0418"].includes(sel))
            }
            onSelect={() => setSel("payables")}
          >
            <Folder className="size-icon-small icon-subtle" /> Payables
          </Tree.Item>
          {open["payables"] ? (
            <>
              <Tree.Item
                depth={2}
                isSelected={sel === "ctrl-0412"}
                onSelect={() => setSel("ctrl-0412")}
                trailing={
                  <Badge variant="secondary" tone="success" size="xsmall">
                    Verified
                  </Badge>
                }
              >
                <FileText className="size-icon-small icon-subtle" /> CTRL-0412 Segregation of duties
              </Tree.Item>
              <Tree.Item
                depth={2}
                lines={[true, false]}
                isSelected={sel === "ctrl-0418"}
                onSelect={() => setSel("ctrl-0418")}
              >
                <FileText className="size-icon-small icon-subtle" /> CTRL-0418 Vendor master change
              </Tree.Item>
            </>
          ) : null}
          <Tree.Item
            depth={1}
            lines={[false]}
            hasChildren
            isExpanded={open["receivables"]}
            onExpandedChange={() => toggle("receivables")}
            isSelected={sel === "receivables"}
            onSelect={() => setSel("receivables")}
          >
            <Folder className="size-icon-small icon-subtle" /> Receivables
          </Tree.Item>
          {open["receivables"] ? (
            <Tree.Item
              depth={2}
              lines={[true, false]}
              isSelected={sel === "ctrl-0520"}
              onSelect={() => setSel("ctrl-0520")}
            >
              <FileText className="size-icon-small icon-subtle" /> CTRL-0520 Credit memo approval
            </Tree.Item>
          ) : null}
        </>
      ) : null}
      <Tree.Item
        depth={0}
        hasChildren
        isExpanded={open["security"]}
        onExpandedChange={() => toggle("security")}
        isSelected={sel === "security"}
        onSelect={() => setSel("security")}
        trailing={<Count value={9} />}
      >
        <Folder className="size-icon-small icon-subtle" /> Security
      </Tree.Item>
    </Tree>
  );
}

export const Playground: Story = {};

/** A working tree: click a row to select it, its chevron to open it; Tab in once, then the arrows move and open, Enter selects. A collapsed parent shows its hidden child's selection. */
export const Families: Story = {
  render: () => <FamiliesDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const finance = canvas.getByRole("treeitem", { name: /Finance/ });
    const payables = canvas.getByRole("treeitem", { name: /Payables/ });
    const control = () => canvas.getByRole("treeitem", { name: /CTRL-0412/ });
    // Out towards the parent and in towards the children, mirrored in right to left.
    const rtl = getComputedStyle(finance).direction === "rtl";
    const [out, inward] = rtl ? ["{ArrowRight}", "{ArrowLeft}"] : ["{ArrowLeft}", "{ArrowRight}"];
    await userEvent.click(control());
    await userEvent.keyboard(out);
    await expect(payables).toHaveFocus();
    await userEvent.keyboard(out);
    await expect(payables).toHaveAttribute("aria-expanded", "false");
    await expect(payables).toHaveAttribute("aria-selected", "true");
    await expect(canvas.queryByRole("treeitem", { name: /CTRL-0412/ })).not.toBeInTheDocument();
    await userEvent.keyboard(`${inward}${inward}`);
    await expect(control()).toHaveFocus();
    await userEvent.keyboard("{ArrowDown} ");
    await expect(canvas.getByRole("treeitem", { name: /CTRL-0418/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.keyboard("{ArrowUp}{Home}");
    await expect(finance).toHaveFocus();
    await userEvent.keyboard("{End}{Enter}");
    await expect(canvas.getByRole("treeitem", { name: /Security/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const chevron = within(payables).getByRole("button", { hidden: true });
    // The chevron is the kit's 20px row control, out of the Tab order (the row takes the keys), and
    // takes a 24px hit area on a touch screen without moving the row.
    await expect(chevron).toHaveAttribute("data-slot", "icon-button");
    await expect(chevron.getBoundingClientRect().width).toBe(20);
    await expect(chevron).toHaveAttribute("tabindex", "-1");
    await expect(chevron).toHaveClass("touch-target");
    await expect(getComputedStyle(chevron).position).toBe("relative");
    await userEvent.click(chevron);
    await expect(payables).toHaveFocus();
    await expect(payables).toHaveAttribute("aria-expanded", "false");
    // The row's name is its label; the Count beside it is its description, heard after the name.
    await expect(finance).toHaveAccessibleName("Finance");
    await expect(finance).toHaveAccessibleDescription("12");
    // A click on the row's static Count selects the row, as a click on its label does.
    await userEvent.click(within(finance).getByText("12"));
    await expect(finance).toHaveAttribute("aria-selected", "true");
    await expect(finance).toHaveFocus();
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Tree label="Control families">
            <Tree.Item depth={0} hasChildren isExpanded>
              <Folder className="size-icon-small icon-subtle" /> Finance
            </Tree.Item>
            <Tree.Item depth={1}>
              <FileText className="size-icon-small icon-subtle" /> CTRL-0412 Segregation of duties
            </Tree.Item>
            <Tree.Item depth={1} lines={[false]}>
              <FileText className="size-icon-small icon-subtle" /> CTRL-0418 Vendor master change
            </Tree.Item>
          </Tree>
        }
        doText="An icon on every row, or on none, so labels at one level align."
        dont={
          <Tree label="Control families">
            <Tree.Item depth={0} hasChildren isExpanded>
              <Folder className="size-icon-small icon-subtle" /> Finance
            </Tree.Item>
            <Tree.Item depth={1}>CTRL-0412 Segregation of duties</Tree.Item>
            <Tree.Item depth={1} lines={[false]}>
              <FileText className="size-icon-small icon-subtle" /> CTRL-0418 Vendor master change
            </Tree.Item>
          </Tree>
        }
        dontText="Icons on some rows. The labels of one level land at two x positions."
      />
      <Pair
        do={
          <Item.Group>
            <Item title="Finance" meta="12 controls" isCollapsible>
              <Item.Group size="compact">
                <Item title="CTRL-0412 Segregation of duties" />
                <Item title="CTRL-0418 Vendor master change" />
              </Item.Group>
            </Item>
            <Item title="Security" meta="9 controls" isCollapsible>
              <Item.Group size="compact">
                <Item title="CTRL-0901 Shared accounts" />
              </Item.Group>
            </Item>
          </Item.Group>
        }
        doText="One level of nesting is a collapsible Item list."
        dont={
          <Tree label="Control families">
            <Tree.Item depth={0} hasChildren isExpanded>
              Finance
            </Tree.Item>
            <Tree.Item depth={1}>CTRL-0412 Segregation of duties</Tree.Item>
            <Tree.Item depth={1} lines={[false]}>
              CTRL-0418 Vendor master change
            </Tree.Item>
            <Tree.Item depth={0} hasChildren>
              Security
            </Tree.Item>
          </Tree>
        }
        dontText="A tree one level deep. A tree is for several levels; one level is an accordion or a list."
      />
      <Pair
        do={
          <Tree label="Control families">
            <Tree.Item depth={0} hasChildren isSelected>
              Finance
            </Tree.Item>
            <Tree.Item depth={0} hasChildren>
              Security
            </Tree.Item>
          </Tree>
        }
        doText="The selected control is inside a collapsed Finance, so Finance shows the selection."
        dont={
          <Tree label="Control families">
            <Tree.Item depth={0} hasChildren>
              Finance
            </Tree.Item>
            <Tree.Item depth={0} hasChildren>
              Security
            </Tree.Item>
          </Tree>
        }
        dontText="Nothing selected on screen while a hidden child is. The reader loses where they are."
      />
      <Pair
        do={
          <Tree label="Collections">
            <Tree.Item depth={0} hasChildren isExpanded>
              Alpha collection
            </Tree.Item>
            <Tree.Item depth={1}>Alpha entry</Tree.Item>
            <Tree.Item depth={1} lines={[false]}>
              Beta entry
            </Tree.Item>
          </Tree>
        }
        doText="A collection's entries are its children in the one tree. Entries with columns of their own are a Table.Tree."
        dont={
          <Tree label="Collections">
            <Tree.Item
              depth={0}
              style={{ height: "auto", minHeight: 64, alignItems: "start" }}
              trailing={
                <Tree label="Collection entries">
                  <Tree.Item depth={0}>Alpha entry</Tree.Item>
                  <Tree.Item depth={0}>Beta entry</Tree.Item>
                </Tree>
              }
            >
              Alpha collection
            </Tree.Item>
          </Tree>
        }
        dontText="A tree inside a row. The tree pattern has no tree within a tree item: the row's arrow keys and its name stop meaning what they say."
      />
    </Stack>
  ),
};

function TreeDemo() {
  const [selected, setSelected] = useState("");
  const [items, setItems] = useState(["Alpha", "Beta", "Charlie"]);
  return (
    <>
      <Tree label="Keyboard hierarchy">
        {items.map((item) => (
          <Tree.Item
            key={item}
            depth={0}
            isSelected={item === selected}
            onSelect={() => setSelected(item)}
            actions={
              <Button
                size="xsmall"
                variant="subtle"
                onClick={() => setItems((rows) => rows.filter((row) => row !== item))}
              >
                Remove {item}
              </Button>
            }
          >
            {item}
          </Tree.Item>
        ))}
      </Tree>
    </>
  );
}

export const Keyboard: Story = {
  render: () => <TreeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tree = canvas.getByRole("tree", { name: "Keyboard hierarchy" });
    const entries = () => tree.querySelectorAll('[role="treeitem"][tabindex="0"]');
    await expect(entries()).toHaveLength(1);
    await userEvent.click(canvas.getByText("Beta", { exact: true }));
    await expect(entries()).toHaveLength(1);
    await expect(entries()[0]).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("c");
    await expect(document.activeElement).toHaveTextContent("Charlie");
    await expect(entries()).toHaveLength(1);
    await expect(document.activeElement).toHaveAttribute("aria-posinset", "3");
    await expect(document.activeElement).toHaveAttribute("aria-setsize", "3");
    // A row's actions are its own stops, outside its name and description.
    const charlie = canvas.getByRole("treeitem", { name: "Charlie" });
    await expect(charlie).not.toHaveAttribute("aria-describedby");
    await userEvent.click(canvas.getByRole("button", { name: "Remove Charlie" }));
    await waitFor(() => expect(document.activeElement).toHaveTextContent("Beta"));
    await expect(entries()).toHaveLength(1);
    await expect(document.activeElement).toHaveAttribute("aria-setsize", "2");
  },
};

const nativeRootRef = createRef<HTMLDivElement>();
const nativeRowRef = createRef<HTMLDivElement>();
const nativeFocus = fn();
const nativeKey = fn();
const rowClick = fn();
const rowSelect = fn();

/** Native attributes, styles, refs and handlers reach the tree and its rows; a caller's handler runs first, and `preventDefault()` cancels the built-in behaviour: a reserved key, a locked selection. */
function NativeAttributesDemo() {
  const [showGamma, setShowGamma] = useState(true);
  return (
    <Tree
      ref={nativeRootRef}
      id="collections-tree"
      label="Collections"
      data-collection="alpha"
      style={{ maxWidth: 640 }}
      onFocusCapture={nativeFocus}
      onKeyDown={(event) => {
        nativeKey(event.key);
        if (event.key === "b") event.preventDefault();
      }}
    >
      <Tree.Item
        ref={nativeRowRef}
        id="alpha-entry"
        title="Alpha entry"
        depth={0}
        data-entry="alpha"
        onClick={(event) => {
          rowClick();
          event.preventDefault();
        }}
        onSelect={rowSelect}
        onKeyDown={(event) => {
          if (event.key === "End") event.preventDefault();
        }}
      >
        Alpha entry (selection locked)
      </Tree.Item>
      <Tree.Item
        depth={0}
        aria-label="Beta entry"
        onSelect={() => undefined}
        actions={
          <Button size="xsmall" variant="subtle" onClick={() => setShowGamma(false)}>
            Remove Gamma entry
          </Button>
        }
      >
        Beta entry
      </Tree.Item>
      {showGamma ? (
        <Tree.Item depth={0} onSelect={() => undefined}>
          Gamma entry
        </Tree.Item>
      ) : null}
    </Tree>
  );
}

export const NativeAttributes: Story = {
  render: () => <NativeAttributesDemo />,
  play: async ({ canvasElement }) => {
    nativeFocus.mockClear();
    nativeKey.mockClear();
    rowClick.mockClear();
    rowSelect.mockClear();
    const canvas = within(canvasElement);
    const tree = canvas.getByRole("tree", { name: "Collections" });
    const alpha = canvas.getByRole("treeitem", { name: /Alpha entry/ });
    const beta = canvas.getByRole("treeitem", { name: "Beta entry" });
    const gamma = canvas.getByRole("treeitem", { name: "Gamma entry" });
    await expect(nativeRootRef.current).toBe(tree);
    await expect(nativeRowRef.current).toBe(alpha);
    await expect(tree).toHaveAttribute("id", "collections-tree");
    await expect(tree).toHaveAttribute("data-collection", "alpha");
    await expect(tree).toHaveAttribute("data-slot", "tree");
    await expect(tree).toHaveStyle({ maxWidth: "640px" });
    await expect(alpha).toHaveAttribute("id", "alpha-entry");
    await expect(alpha).toHaveAttribute("data-entry", "alpha");
    await expect(alpha).toHaveAttribute("data-slot", "tree-item");
    await expect(alpha).toHaveAttribute("title", "Alpha entry");
    // A caller's onClick that prevents the default keeps the row from selecting.
    await userEvent.click(alpha);
    await expect(rowClick).toHaveBeenCalledTimes(1);
    await expect(rowSelect).not.toHaveBeenCalled();
    await expect(nativeFocus).toHaveBeenCalled();
    await userEvent.keyboard("{ArrowDown}");
    await expect(beta).toHaveFocus();
    await expect(beta).toHaveAttribute("aria-posinset", "2");
    await expect(beta).toHaveAttribute("aria-setsize", "3");
    // The root reserves "b"; the row reserves End.
    await userEvent.keyboard("{Home}{End}");
    await expect(alpha).toHaveFocus();
    await userEvent.keyboard("g");
    await expect(gamma).toHaveFocus();
    await userEvent.keyboard("b");
    await expect(gamma).toHaveFocus();
    await expect(nativeKey).toHaveBeenCalledWith("b");
    await expect(tree.querySelectorAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1);
    // A row's action that removes another row leaves focus on the action.
    const remove = canvas.getByRole("button", { name: "Remove Gamma entry" });
    await userEvent.click(remove);
    await expect(gamma).not.toBeInTheDocument();
    await expect(remove).toHaveFocus();
    await expect(beta).toHaveAttribute("aria-setsize", "2");
  },
};

const revealed = () =>
  waitFor(() => {
    const popup = document.querySelector<HTMLElement>('[data-slot="truncate-full-text"]');
    expect(popup).not.toBeNull();
    return popup!;
  });

const cut = (el: Element) => el.scrollWidth > el.clientWidth + 1;

function LongNamesDemo() {
  const [selected, setSelected] = useState("ground");
  const [open, setOpen] = useState(true);
  return (
    <Box style={{ width: 280, maxWidth: "100%" }}>
      <Tree label="Program elements">
        <Tree.Item
          depth={0}
          hasChildren
          isExpanded={open}
          onExpandedChange={setOpen}
          isSelected={selected === "ground"}
          onSelect={() => setSelected("ground")}
          hint="SYS-01 · Moderate baseline, tailored for the ground segment"
          trailing={
            <Badge variant="secondary" tone="warning" size="xsmall">
              Draft
            </Badge>
          }
          actions={
            <IconButton
              size="xxsmall"
              variant="subtle"
              label="Row actions for Ground segment"
              icon={<MoreHorizontal />}
            />
          }
        >
          Ground segment
        </Tree.Item>
        {open ? (
          <>
            <Tree.Item
              depth={1}
              isSelected={selected === "ac-2"}
              onSelect={() => setSelected("ac-2")}
              hint={
                <>
                  Enhancement <Id>AC-2(2)</Id>
                </>
              }
              trailing={<Count value={12} />}
            >
              AC-2 Automated temporary and emergency account management for privileged users
            </Tree.Item>
            <Tree.Item
              depth={1}
              lines={[false]}
              isSelected={selected === "unnamed"}
              onSelect={() => setSelected("unnamed")}
              trailing="Choose a program profile"
            >
              Unnamed system
            </Tree.Item>
          </>
        ) : null}
      </Tree>
    </Box>
  );
}

/**
 * In a narrow tree a long label is cut to its one line, and shows whole on hover and while its row
 * has keyboard focus. `hint` holds a code or a profile beside the name and takes only the room the
 * label leaves, so it is cut first; text in `trailing` gives way beside the label; the menu button
 * sits in `actions`. The row's name is its label alone; the hint and the trailing are its
 * description.
 */
export const LongNames: Story = {
  render: () => <LongNamesDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ground = canvas.getByRole("treeitem", { name: "Ground segment" });
    const control = canvas.getByRole("treeitem", { name: /^AC-2 Automated/ });
    const unnamed = canvas.getByRole("treeitem", { name: "Unnamed system" });
    const label = (row: HTMLElement) => row.querySelector('[data-slot="tree-item-label"]')!;
    // Every row keeps its one line: the label stays inside its row.
    for (const row of [ground, control, unnamed]) {
      const box = row.getBoundingClientRect();
      const text = label(row).getBoundingClientRect();
      await expect(text.top).toBeGreaterThanOrEqual(box.top);
      await expect(text.bottom).toBeLessThanOrEqual(box.bottom);
    }
    // The long label is cut, and a hint is cut before the label it sits beside.
    await expect(cut(label(control).querySelector('[data-slot="truncate"]')!)).toBe(true);
    const hint = ground.querySelector('[data-slot="tree-item-hint"] [data-slot="truncate"]')!;
    await expect(cut(hint)).toBe(true);
    await expect(cut(label(ground).querySelector('[data-slot="truncate"]')!)).toBe(false);
    // Text in trailing gives way beside the label; neither is cut to nothing.
    const trailing = unnamed.querySelector('[data-slot="tree-item-trailing"]')!;
    await expect(label(unnamed).getBoundingClientRect().width).toBeGreaterThan(60);
    await expect(trailing.getBoundingClientRect().width).toBeGreaterThan(60);
    // Name and description: the label, then the hint and the trailing; the menu is neither.
    await expect(ground).toHaveAccessibleDescription(
      "SYS-01 · Moderate baseline, tailored for the ground segment Draft",
    );
    await expect(control).toHaveAccessibleDescription("Enhancement AC-2(2) 12");
    await expect(unnamed).toHaveAccessibleDescription("Choose a program profile");
    const menu = canvas.getByRole("button", { name: "Row actions for Ground segment" });
    await expect(ground).toContainElement(menu);
    // Keyboard focus on the row with the cut label shows the whole label.
    await userEvent.click(ground);
    await userEvent.keyboard("{ArrowDown}");
    await expect(control).toHaveFocus();
    const popup = await revealed();
    await expect(popup).toHaveTextContent(
      "AC-2 Automated temporary and emergency account management for privileged users",
    );
    // A composed hint, cut beside the long label, is its own tooltip too: the focus shows one.
    const composed = control.querySelector('[data-slot="tree-item-hint"] [data-slot="truncate"]')!;
    await expect(composed).toHaveAttribute("title", "Enhancement AC-2(2)");
    await expect(document.querySelectorAll('[data-slot="truncate-full-text"]')).toHaveLength(1);
    await userEvent.keyboard("{ArrowDown}");
    await expect(unnamed).toHaveFocus();
    // The row's focus reveals its name alone; text in trailing is its own tooltip on hover.
    await waitFor(() => {
      const shown = [...document.querySelectorAll('[data-slot="truncate-full-text"]')];
      expect(shown.map((popup) => popup.textContent)).toEqual(["Unnamed system"]);
    });
    await expect(trailing.querySelector('[data-slot="truncate"]')).toHaveAttribute(
      "title",
      "Choose a program profile",
    );
  },
};

/** The rows of a tree that only shows shape carry no selection state and do not answer the pointer. */
export const ReadOnly: Story = {
  render: () => (
    <Box className="w-layout-list max-w-full">
      <Tree label="System composition">
        <Tree.Item depth={0} hasChildren isExpanded>
          Atlas payments platform
        </Tree.Item>
        <Tree.Item depth={1}>Payments API</Tree.Item>
        <Tree.Item depth={1} lines={[false]}>
          keycloak-idp
        </Tree.Item>
      </Tree>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = canvas.getAllByRole("treeitem");
    await expect(rows).toHaveLength(3);
    for (const row of rows) {
      await expect(row).not.toHaveAttribute("aria-selected");
      await expect(row).not.toHaveClass("cursor-pointer");
    }
    // Still one entry stop, and the arrows still move.
    await userEvent.click(rows[0]!);
    await userEvent.keyboard("{ArrowDown}");
    await expect(rows[1]).toHaveFocus();
  },
};

/** A right-to-left tree the reader opens with the keys: Left opens, Right closes. */
function ReceivablesRightToLeft() {
  const [open, setOpen] = useState<Record<string, boolean>>({ receivables: true });
  const [selected, setSelected] = useState("ctrl-0510");
  const toggle = (key: string) => setOpen((value) => ({ ...value, [key]: !value[key] }));
  return (
    <Tree label="Receivables">
      <Tree.Item
        depth={0}
        hasChildren
        expanded={open["receivables"]}
        onToggle={() => toggle("receivables")}
        isSelected={selected === "receivables"}
        onSelect={() => setSelected("receivables")}
      >
        Receivables
      </Tree.Item>
      {open["receivables"] ? (
        <>
          <Tree.Item
            depth={1}
            isSelected={selected === "ctrl-0510"}
            onSelect={() => setSelected("ctrl-0510")}
          >
            CTRL-0510 Credit limits
          </Tree.Item>
          <Tree.Item
            depth={1}
            lines={[false]}
            hasChildren
            isExpanded={open["collections"] ?? false}
            onExpandedChange={(next) => setOpen((value) => ({ ...value, collections: next }))}
            isSelected={selected === "collections"}
            onSelect={() => setSelected("collections")}
          >
            Collections
          </Tree.Item>
          {open["collections"] ? (
            <Tree.Item
              depth={2}
              lines={[false, false]}
              isSelected={selected === "ctrl-0530"}
              onSelect={() => setSelected("ctrl-0530")}
            >
              CTRL-0530 Write-offs
            </Tree.Item>
          ) : null}
        </>
      ) : null}
    </Tree>
  );
}

/**
 * The selected row is the selected fill and a 2px bar at its start edge in the selected colour, a
 * second cue at 3:1 on the fill, so the selection never rests on a faint tint alone; in forced
 * colours the row is Highlight. In a right-to-left tree the bar is on the right and a closed
 * branch's chevron points left. `expanded` and `onToggle`, the old names for `isExpanded` and
 * `onExpandedChange`, still open a branch; Collections reports its next state through
 * `onExpandedChange`.
 */
export const SelectedAndRightToLeft: Story = {
  tags: ["!manifest"],
  name: "Selected and right to left",
  render: () => (
    <Stack space="space.300">
      <Specimens title="Left to right">
        <Box className="w-layout-list max-w-full">
          <Tree label="Payables">
            <Tree.Item depth={0} hasChildren isExpanded>
              Payables
            </Tree.Item>
            <Tree.Item depth={1} isSelected>
              CTRL-0412 Segregation of duties
            </Tree.Item>
            <Tree.Item depth={1} lines={[false]}>
              CTRL-0418 Vendor master change
            </Tree.Item>
          </Tree>
        </Box>
      </Specimens>
      <Specimens title="Right to left, with the deprecated expanded and onToggle">
        <Box className="w-layout-list max-w-full" dir="rtl">
          <ReceivablesRightToLeft />
        </Box>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const forced = matchMedia("(forced-colors: active)").matches;
    for (const [treeName, rowName] of [
      ["Payables", "CTRL-0412 Segregation of duties"],
      ["Receivables", "CTRL-0510 Credit limits"],
    ] as const) {
      const tree = canvas.getByRole("tree", { name: treeName });
      const selected = within(tree).getByRole("treeitem", { name: rowName, selected: true });
      const bar = getComputedStyle(selected, "::before");
      const plain = within(tree)
        .getAllByRole("treeitem")
        .find((row) => row !== selected)!;
      await expect(getComputedStyle(plain, "::before").content).toBe("none");
      if (forced) {
        await expect(bar.display).toBe("none");
        continue;
      }
      await expect(bar.position).toBe("absolute");
      await expect(bar.width).toBe("2px");
      await expect(bar.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      const box = selected.getBoundingClientRect();
      const barLeft = parseFloat(bar.left);
      const barRight = parseFloat(bar.right);
      // The bar hugs the row's start edge: the left in LTR, the right in RTL. The Receivables tree
      // is right to left by its own provider, and so is every tree under the Direction toolbar.
      if (getComputedStyle(selected).direction === "rtl") await expect(barRight).toBe(0);
      else await expect(barLeft).toBe(0);
      await expect(box.width).toBeGreaterThan(0);
    }
    const rtl = canvas.getByRole("tree", { name: "Receivables" });
    await expect(within(rtl).getByRole("treeitem", { name: "Receivables" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    const closed = within(rtl).getByRole("treeitem", { name: "Collections" });
    await expect(closed).toHaveAttribute("aria-expanded", "false");
    const chevron = closed.querySelector("svg")!;
    await expect(getComputedStyle(chevron).rotate).toBe("180deg");
    // A read-only tree carries no selection state: only the one selected row says aria-selected.
    const ltr = canvas.getByRole("tree", { name: "Payables" });
    await expect(within(ltr).getByRole("treeitem", { name: "Payables" })).not.toHaveAttribute(
      "aria-selected",
    );
    // Right to left, Left opens and moves in, Right moves out and closes.
    await userEvent.click(closed);
    await expect(closed).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(closed).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{ArrowLeft}");
    await expect(within(rtl).getByRole("treeitem", { name: "CTRL-0530 Write-offs" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(closed).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(closed).toHaveAttribute("aria-expanded", "false");
    // The deprecated `expanded` and `onToggle` still close a branch: Right moves out, then closes.
    const receivables = within(rtl).getByRole("treeitem", { name: "Receivables" });
    await userEvent.keyboard("{ArrowRight}");
    await expect(receivables).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(receivables).toHaveAttribute("aria-expanded", "false");
  },
};
