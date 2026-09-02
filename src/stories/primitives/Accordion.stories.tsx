import type { Meta, StoryObj } from "@storybook/react-vite";

import { Accordion, Id } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  args: { type: "single", defaultValue: "statement", children: null },
  argTypes: {
    type: { control: "inline-radio", options: ["single", "multiple"] },
    defaultValue: { control: false },
    value: { control: false },
    onValueChange: { control: false },
    className: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const objectives = [
  "the time period after which to disable accounts is defined",
  "accounts are disabled when they have expired",
  "accounts are disabled when they are no longer associated with a user",
  "accounts are disabled when they violate organizational policy",
];

const sections = (
  <>
    <Accordion.Item value="statement" title="Control statement">
      <p className="text-[13px] leading-relaxed">
        Disable accounts within an organization-defined time period when the accounts have expired,
        are no longer associated with a user or individual, are in violation of organizational
        policy, or have been inactive for the defined period.
      </p>
    </Accordion.Item>
    <Accordion.Item value="objectives" title="Assessment objectives" count={objectives.length}>
      <ol className="space-y-1.5 text-[13px]">
        {objectives.map((o, i) => (
          <li key={o} className="flex items-baseline gap-2">
            <Id className="text-muted-foreground">AC-2(3)[0{i + 1}]</Id>
            <span>{o}</span>
          </li>
        ))}
      </ol>
    </Accordion.Item>
    <Accordion.Item value="discussion" title="Discussion">
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Disabling expired, inactive, or otherwise anomalous accounts supports the concepts of least
        privilege and least functionality, which reduce the attack surface of the system.
      </p>
    </Accordion.Item>
  </>
);

/** One open at a time; opening another closes the first. The open one can close. */
export const Single: Story = {
  render: (args) => (
    <div className="max-w-[720px] space-y-2">
      <Spec>type single · same row as Collapsible</Spec>
      <Accordion {...args}>{sections}</Accordion>
    </div>
  ),
};

/** Independent sections under one keyboard model. */
export const Multiple: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[720px]">
      <Accordion type="multiple" defaultValue={["statement", "objectives"]}>
        {sections}
      </Accordion>
    </div>
  ),
};
