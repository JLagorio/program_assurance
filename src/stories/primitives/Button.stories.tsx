import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, MoreHorizontal, Plus, Trash2 } from "lucide-react";

import { Button, IconButton } from "@/ds/primitives";

const meta = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Request evidence", variant: "secondary", size: "md", disabled: false },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "ghost", "danger", "link"],
    },
    size: { control: "inline-radio", options: ["xs", "sm", "md"] },
    disabled: { control: "boolean" },
    children: { control: "text" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const variants = ["primary", "secondary", "ghost", "danger", "link"] as const;
const sizes = ["xs", "sm", "md"] as const;

/** Every variant by every size, plus disabled and with-icon columns. This is the contract. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="overflow-x-auto">
      <table className="text-left text-[13px]">
        <thead>
          <tr>
            <th className="h-8 pr-6 text-[12px] font-medium text-muted-foreground">variant</th>
            {sizes.map((s) => (
              <th key={s} className="h-8 pr-6 text-[11px] font-medium text-muted-foreground">
                {s}
              </th>
            ))}
            <th className="h-8 pr-6 text-[12px] font-medium text-muted-foreground">disabled</th>
            <th className="h-8 pr-6 text-[12px] font-medium text-muted-foreground">with icon</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr key={v} className="border-t border-border-subtle">
              <td className="py-3 pr-6 text-[11px] text-muted-foreground">{v}</td>
              {sizes.map((s) => (
                <td key={s} className="py-3 pr-6">
                  <Button variant={v} size={s}>
                    Request evidence
                  </Button>
                </td>
              ))}
              <td className="py-3 pr-6">
                <Button variant={v} disabled>
                  Request evidence
                </Button>
              </td>
              <td className="py-3 pr-6">
                <Button variant={v}>
                  {v === "danger" ? <Trash2 className="size-4" /> : <Plus className="size-4" />}
                  {v === "danger" ? "Delete finding" : "New finding"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

/** How buttons actually sit together on a page header and in a modal footer. */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[720px] space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="mb-1 text-[13px] text-muted-foreground">PRG-1041</div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Findings & assets</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost">
            <Download className="size-4" />
            Export
          </Button>
          <Button variant="secondary">Link evidence</Button>
          <Button variant="primary">
            <Plus className="size-4" />
            New finding
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-pop">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Submit for authorization</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            This locks the package and notifies the authorizing official.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 bg-subtle px-5 py-3">
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Submit</Button>
        </div>
      </div>
    </div>
  ),
};

export const IconButtons: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-2">
      <IconButton aria-label="More">
        <MoreHorizontal className="size-4" />
      </IconButton>
      <IconButton aria-label="Add">
        <Plus className="size-4" />
      </IconButton>
      <IconButton aria-label="Download">
        <Download className="size-4" />
      </IconButton>
      <IconButton aria-label="Delete" disabled>
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  ),
};
