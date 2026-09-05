import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, Folder } from "lucide-react";
import { useState } from "react";

import { Badge, Count, Item, Tree } from "../../components";
import { Box, Stack } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Tree",
  component: Tree,
  parameters: { layout: "padded" },
  args: {
    label: "Composition",
    children: [
      <Tree.Item key="1" depth={0} hasChildren expanded isSelected>
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
  render: () => (
    <Stack space="space.300">
      <Specimens title="small (32px), text only">
        <Box className="w-layout-list">
          <Tree label="Composition">
            <Tree.Item depth={0} hasChildren expanded>
              Atlas payments platform
            </Tree.Item>
            <Tree.Item depth={1} lines={[true]} hasChildren expanded>
              Payments API
            </Tree.Item>
            <Tree.Item
              depth={2}
              lines={[true, true]}
              isSelected
              trailing={
                <Badge tone="warning" size="xsmall">
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
        <Box className="w-layout-list">
          <Tree label="Control families" size="xsmall">
            <Tree.Item depth={0} hasChildren expanded trailing={<Count value={12} />}>
              <Folder className="size-icon-small icon-subtle" /> Finance
            </Tree.Item>
            <Tree.Item depth={1} hasChildren expanded>
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
        expanded={open["finance"]}
        onToggle={() => toggle("finance")}
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
            expanded={open["payables"]}
            onToggle={() => toggle("payables")}
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
                  <Badge tone="success" size="xsmall">
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
            expanded={open["receivables"]}
            onToggle={() => toggle("receivables")}
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
        expanded={open["security"]}
        onToggle={() => toggle("security")}
        isSelected={sel === "security"}
        onSelect={() => setSel("security")}
        trailing={<Count value={9} />}
      >
        <Folder className="size-icon-small icon-subtle" /> Security
      </Tree.Item>
    </Tree>
  );
}

/** A working tree: click a row to select it, its chevron to open it; Tab in once, then the arrows move and open, Enter selects. A collapsed parent shows its hidden child's selection. */
export const Families: Story = { render: () => <FamiliesDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Tree label="Control families">
            <Tree.Item depth={0} hasChildren expanded>
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
        doText="An icon on every row, or on none: Carbon's rule, so labels at one level align."
        dont={
          <Tree label="Control families">
            <Tree.Item depth={0} hasChildren expanded>
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
            <Tree.Item depth={0} hasChildren expanded>
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
        dontText="A tree one level deep. Carbon: a tree is for several levels; one level is an accordion or a list."
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
    </Stack>
  ),
};

export const Playground: Story = {};
