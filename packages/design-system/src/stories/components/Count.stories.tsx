import { ChevronDown } from "lucide-react";
import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Count,
  Indicator,
} from "../../components";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Count",
  component: Count,
  parameters: { layout: "padded" },
  args: { value: 3 },
} satisfies Meta<typeof Count>;
export default meta;
type Story = StoryObj<typeof meta>;

const appearances = ["default", "primary", "important", "added", "removed"] as const;

/** Every appearance at one, two and three digits, and past the ceiling. */
export const CountMatrix: Story = {
  render: () => (
    <Grid
      rows={appearances}
      cols={["3", "12", "140", "1400 · max 999"] as const}
      rowLabel="appearance"
      render={(appearance, col) => (
        <Count
          appearance={appearance}
          value={Number(col.split(" ")[0])}
          {...(col.startsWith("1400") ? { max: 999 } : {})}
        />
      )}
    />
  ),
};

/** Named by what it sits beside: a section title, a tab, a related card. */
export const InContext: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-[420px]">
      <Inline space="space.100" alignBlock="center">
        <Text weight="medium">Open findings</Text>
        <Count value={5} />
      </Inline>
      <Inline space="space.100" alignBlock="center">
        <Text weight="medium">Needs your attention</Text>
        <Count value={2} appearance="important" />
      </Inline>
      <Inline space="space.100" alignBlock="center">
        <Text weight="medium">Rows changed</Text>
        <Count value={12} appearance="added" />
        <Count value={3} appearance="removed" />
      </Inline>
      <Collapsible className="border-t border-default" defaultOpen>
        <h3>
          <CollapsibleTrigger className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered">
            Evidence
            <Count value={7} />
            <ChevronDown
              aria-hidden="true"
              className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/collapsible:rotate-180"
            />
          </CollapsibleTrigger>
        </h3>
        <CollapsibleContent>
          <div className="pb-200">
            <Text size="small" color="color.text.subtle">
              Seven artifacts, the newest collected on 28 Aug.
            </Text>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.100" alignBlock="center">
            <Text weight="medium">Findings</Text>
            <Count value={3} />
          </Inline>
        }
        doText="A count beside its name. The name says what is counted."
        dont={<Count value={3} />}
        dontText="A number alone. Three of what?"
      />
      <Pair
        do={<Indicator tone="danger">High</Indicator>}
        doText="A severity is a word with a Dot."
        dont={<Count value={3} appearance="important" />}
        dontText="A red 3 for severity. A count counts; it does not rank."
      />
      <Pair
        do={
          <Inline space="space.100" alignBlock="center">
            <Text weight="medium">Status</Text>
            <Badge variant="secondary" tone="success">
              Verified
            </Badge>
          </Inline>
        }
        doText="A state is a Badge."
        dont={
          <Inline space="space.100" alignBlock="center">
            <Text weight="medium">Status</Text>
            <Count value="Verified" appearance="added" />
          </Inline>
        }
        dontText="A word in a Count. The pill is round because it holds a number."
      />
      <Pair
        do={
          <Inline space="space.100" alignBlock="center">
            <Text weight="medium">Results</Text>
            <Count value={1400} max={999} />
          </Inline>
        }
        doText="Past the ceiling the pill says so and stays three digits."
        dont={
          <Inline space="space.100" alignBlock="center">
            <Text weight="medium">Results</Text>
            <Count value={140213} max={999999} />
          </Inline>
        }
        dontText="Six digits in a pill. The exact number belongs in a Stat, where it can be read."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
