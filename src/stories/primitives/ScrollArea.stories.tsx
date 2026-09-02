import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Id, ScrollArea } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  args: { orientation: "vertical", children: null },
  argTypes: {
    orientation: { control: "inline-radio", options: ["vertical", "horizontal", "both"] },
    children: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const families = [
  "Access Control",
  "Awareness and Training",
  "Audit and Accountability",
  "Assessment, Authorization, and Monitoring",
  "Configuration Management",
  "Contingency Planning",
  "Identification and Authentication",
  "Incident Response",
  "Maintenance",
  "Media Protection",
  "Physical and Environmental Protection",
  "Planning",
  "Program Management",
  "Personnel Security",
  "PII Processing and Transparency",
  "Risk Assessment",
  "System and Services Acquisition",
  "System and Communications Protection",
  "System and Information Integrity",
  "Supply Chain Risk Management",
];

const codes = [
  "AC",
  "AT",
  "AU",
  "CA",
  "CM",
  "CP",
  "IA",
  "IR",
  "MA",
  "MP",
  "PE",
  "PL",
  "PM",
  "PS",
  "PT",
  "RA",
  "SA",
  "SC",
  "SI",
  "SR",
];

/** A rail-height list. The bar shows on hover and is the same on every OS. */
export const Vertical: Story = {
  render: () => (
    <div className="space-y-2">
      <ScrollArea className="h-[240px] w-[320px] rounded-md border border-border">
        <ul className="p-1">
          {families.map((f, i) => (
            <li
              key={f}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-13 hover:bg-surface-hover"
            >
              <Id className="w-8">{codes[i]}</Id>
              <span className="truncate">{f}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
      <Spec>hover the list · thumb: border-strong, 6px · corner square</Spec>
    </div>
  ),
};

/** A row of chips wider than its box. */
export const Horizontal: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ScrollArea orientation="horizontal" className="w-[420px] rounded-md border border-border">
      <div className="flex w-max gap-1.5 p-2">
        {families.map((f) => (
          <Badge key={f} size="xs">
            {f}
          </Badge>
        ))}
      </div>
    </ScrollArea>
  ),
};
