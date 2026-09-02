import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Alert, Id } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Alert",
  component: Alert,
  tags: ["autodocs"],
  args: {
    tone: "warning",
    title: "The campaign record declares Pass. The run log returns Fail.",
  },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["neutral", "success", "warning", "danger", "info"],
    },
    title: { control: "text" },
    children: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[272px]">
      <Alert {...args} />
    </div>
  ),
};

const gaps = [
  {
    id: "AC-2(3)[02]",
    statement: "accounts are disabled when they have expired",
    declared: "Pass",
  },
  {
    id: "AC-2(3)[03]",
    statement: "accounts are disabled when they are no longer associated with a user",
    declared: "Pass",
  },
];

/** Every tone as a one-line rail banner, then the two body forms. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[720px] space-y-8">
      <div className="max-w-[272px] space-y-3">
        <Spec>title only · rail width 272</Spec>
        <Alert tone="danger" title="Shared responsibility with no consumer obligation stated." />
        <Alert tone="warning" title="Evidence is 34 days old; the SLA is 30." />
        <Alert tone="success" title="Every objective in scope has a signed run." />
        <Alert tone="info" title="Derived from the composition graph, not asserted." />
        <Alert tone="neutral" title="Not assessed in this scope." />
      </div>

      <div className="space-y-3">
        <Spec>title + body · above a table</Spec>
        <Alert tone="danger" title="2 objectives have no procedure written">
          <div className="space-y-1.5 text-[12.5px]">
            {gaps.map((g) => (
              <div key={g.id} className="flex items-baseline gap-2">
                <Id className="shrink-0">{g.id}</Id>
                <span className="min-w-0 leading-snug text-foreground">{g.statement}</span>
                <span className="ml-auto shrink-0">
                  <Badge tone="success" size="xs">
                    {g.declared}
                  </Badge>
                </span>
              </div>
            ))}
          </div>
          <p className="pt-2 text-[12px] leading-relaxed text-muted-foreground">
            Nothing is written to execute against these objectives, so no run can ever move them.
          </p>
        </Alert>
      </div>

      <div className="max-w-[420px] space-y-3">
        <Spec>body only · running text</Spec>
        <Alert tone="danger" className="leading-relaxed">
          CN-0220 keycloak-idp offers AC-2(3) as Hybrid — shared responsibility — and states no
          consumer obligation. Until the obligation is written down, nobody implements it and no
          assessor tests it.
        </Alert>
      </div>
    </div>
  ),
};
