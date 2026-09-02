import type { Meta, StoryObj } from "@storybook/react-vite";

import { Collapsible, Id } from "@/ds/primitives";

const meta = {
  title: "Primitives/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
  args: { title: "Control statement", defaultOpen: false, children: null },
  argTypes: {
    title: { control: "text" },
    count: { control: "number" },
    defaultOpen: { control: "boolean" },
    open: { control: false },
    onOpenChange: { control: false },
    className: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

const objectives = [
  "the time period after which to disable accounts is defined",
  "accounts are disabled when they have expired",
  "accounts are disabled when they are no longer associated with a user",
  "accounts are disabled when they violate organizational policy",
];

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[720px]">
      <Collapsible {...args}>
        <p className="text-[13px] leading-relaxed">
          Disable accounts within an organization-defined time period when the accounts have
          expired, are no longer associated with a user or individual, are in violation of
          organizational policy, or have been inactive for the defined period.
        </p>
      </Collapsible>
    </div>
  ),
};

/** Reference material closed, then open with a count. Each one is independent; for one-at-a-time, use Accordion. */
export const ClosedAndOpen: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[720px]">
      <Collapsible title="Control statement">
        <p className="text-[13px] leading-relaxed">
          Disable accounts within an organization-defined time period when the accounts have
          expired, are no longer associated with a user or individual, are in violation of
          organizational policy, or have been inactive for the defined period.
        </p>
      </Collapsible>
      <Collapsible title="Assessment objectives" count={objectives.length} defaultOpen>
        <ol className="space-y-1.5 text-[13px]">
          {objectives.map((o, i) => (
            <li key={o} className="flex items-baseline gap-2">
              <Id className="text-muted-foreground">AC-2(3)[0{i + 1}]</Id>
              <span>{o}</span>
            </li>
          ))}
        </ol>
      </Collapsible>
      <Collapsible title="Discussion">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Disabling expired, inactive, or otherwise anomalous accounts supports the concepts of
          least privilege and least functionality, which reduce the attack surface of the system.
        </p>
      </Collapsible>
    </div>
  ),
};
