import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Badge, Tree, Id } from "@/ds/primitives";
import { Card } from "@/ds/patterns";

const meta = {
  title: "Primitives/Tree",
  component: Tree,
  tags: ["autodocs"],
  args: { label: "System composition", children: null },
  argTypes: {
    label: { control: "text" },
    children: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

type Node = { id: string; name: string; kind: string; version?: string; children?: Node[] };

const root: Node = {
  id: "CN-0001",
  name: "Northwind payroll",
  kind: "System",
  children: [
    {
      id: "CN-0100",
      name: "Ground control",
      kind: "Segment",
      children: [
        { id: "CN-0110", name: "Mission software", kind: "Software", version: "4.2.1" },
        { id: "CN-0220", name: "keycloak-idp", kind: "Service", version: "24.0" },
        {
          id: "CN-0130",
          name: "Core switch",
          kind: "Hardware",
          version: "R2",
          children: [
            { id: "CN-0131", name: "Forwarding ASIC", kind: "Component", version: "B1" },
            { id: "CN-0132", name: "ROMMON", kind: "Firmware", version: "15.9" },
          ],
        },
      ],
    },
    {
      id: "CN-0200",
      name: "Tactical edge",
      kind: "Segment",
      children: [{ id: "CN-0210", name: "Edge gateway", kind: "Hardware", version: "3" }],
    },
  ],
};

type Row = { node: Node; depth: number; lines: boolean[]; last: boolean };

/* The caller owns the flattening: which rows are visible and which guides to draw. */
function flatten(
  node: Node,
  open: Set<string>,
  depth = 0,
  lines: boolean[] = [],
  last = true,
): Row[] {
  const rows: Row[] = [{ node, depth, lines, last }];
  if (node.children && open.has(node.id)) {
    node.children.forEach((child, i) => {
      const isLast = i === node.children!.length - 1;
      rows.push(...flatten(child, open, depth + 1, [...lines, !last], isLast));
    });
  }
  return rows;
}

function Composition() {
  const [open, setOpen] = useState(new Set(["CN-0001", "CN-0100", "CN-0130"]));
  const [selected, setSelected] = useState("CN-0220");
  const rows = flatten(root, open);
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <Card className="max-w-[640px] p-1">
      <Tree label="System composition">
        {rows.map((r) => (
          <Tree.Item
            key={r.node.id}
            depth={r.depth}
            lines={r.lines.slice(1)}
            hasChildren={!!r.node.children?.length}
            expanded={open.has(r.node.id)}
            onToggle={() => toggle(r.node.id)}
            selected={selected === r.node.id}
            onSelect={() => setSelected(r.node.id)}
            trailing={
              r.node.version ? <Id className="text-muted-foreground">{r.node.version}</Id> : null
            }
          >
            <span className={selected === r.node.id ? "truncate font-semibold" : "truncate"}>
              {r.node.name}
            </span>
            <Badge size="xs">{r.node.kind}</Badge>
          </Tree.Item>
        ))}
      </Tree>
    </Card>
  );
}

/** A composition three levels deep: open and close branches, select a row. */
export const Playground: Story = {
  render: () => <Composition />,
};
