import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, Folder } from "lucide-react";
import { useState } from "react";

import { Badge, Count, Tree } from "../../components";
import { Box } from "../../primitives";

const meta = {
  title: "Components/Tree",
  component: Tree,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tree>;
export default meta;
type Story = StoryObj;

function TreeDemo() {
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
            isSelected={sel === "payables"}
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
            isSelected={sel === "receivables"}
            onSelect={() => setSel("receivables")}
          >
            <Folder className="size-icon-small icon-subtle" /> Receivables
          </Tree.Item>
        </>
      ) : null}
      <Tree.Item
        depth={0}
        hasChildren
        isSelected={sel === "security"}
        onSelect={() => setSel("security")}
        trailing={<Count value={9} />}
      >
        <Folder className="size-icon-small icon-subtle" /> Security
      </Tree.Item>
    </Tree>
  );
}

export const TreeStory: Story = { name: "Tree", render: () => <TreeDemo /> };

/** Depth, guide lines, expanded and collapsed parents, a leaf, a selected row and a trailing slot. */
export const TreeMatrix: Story = {
  render: () => (
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
        <Tree.Item depth={1} lines={[false]} hasChildren>
          Ground segment (collapsed)
        </Tree.Item>
        <Tree.Item depth={1} lines={[false]}>
          A leaf at depth one
        </Tree.Item>
      </Tree>
    </Box>
  ),
};
