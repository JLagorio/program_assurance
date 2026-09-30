import { ChevronDown } from "lucide-react";
import { createRef } from "react";
import { expect, within } from "storybook/test";
import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Count,
  Indicator,
} from "../../components";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { LedgerProvider } from "../../lib/locale";
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

const cols = ["3", "12", "140", "1400 · max 999", "1400 · max 9999"] as const;

/** Every appearance at one, two and three digits, past the default ceiling of 99 and past a ceiling of 999, and under a ceiling of 9999, where the number takes the locale's grouping. An added count carries a plus and a removed one a minus, so the two differ by more than their fill. */
export const CountMatrix: Story = {
  render: () => (
    <Grid
      rows={appearances}
      cols={cols}
      rowLabel="appearance"
      render={(appearance, col) => (
        <Count
          appearance={appearance}
          value={Number(col.split(" ")[0])}
          data-cell={`${appearance} ${col}`}
          {...(col.includes("max") ? { max: Number(col.split("max ")[1]) } : {})}
        />
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const shown = ["3", "12", "99+", "999+", "1,400"];
    const signs = { default: "", primary: "", important: "", added: "+", removed: "\u2212" };
    for (const appearance of appearances)
      for (const [i, col] of cols.entries()) {
        const count = canvasElement.querySelector(`[data-cell="${appearance} ${col}"]`);
        await expect(count).toHaveTextContent(`${signs[appearance]}${shown[i]}`, {
          normalizeWhitespace: false,
        });
        await expect(count).toHaveAttribute("data-appearance", appearance);
      }
  },
};

/** Under a LedgerProvider the number reads in the reader's locale: 1.189 in German, and the ceiling too. */
export const Locale: Story = {
  render: () => (
    <LedgerProvider locale="de-DE">
      <Inline space="space.200" alignBlock="center">
        <Inline space="space.100" alignBlock="center">
          <Text weight="medium">Kontrollen</Text>
          <Count value={1189} max={9999} data-testid="grouped" />
        </Inline>
        <Inline space="space.100" alignBlock="center">
          <Text weight="medium">Ergebnisse</Text>
          <Count value={14000} max={9999} data-testid="capped" />
        </Inline>
      </Inline>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("grouped")).toHaveTextContent("1.189");
    await expect(canvas.getByTestId("capped")).toHaveTextContent("9.999+");
  },
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
      <Inline space="space.100" alignBlock="center" data-testid="rows-changed">
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Added and removed read apart in words and in forced colours, not by the fill alone.
    await expect(canvas.getByTestId("rows-changed")).toHaveTextContent("Rows changed+12\u22123");
    // A Count in a trigger is part of its name.
    await expect(canvas.getByRole("button", { name: "Evidence 7" })).toBeInTheDocument();
  },
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

const countRef = createRef<HTMLSpanElement>();

/** Native attributes, a class and a ref reach the pill, so a product can give a count a test id or a tooltip; `max` and `appearance` take `undefined` as their default. */
export const NativeAttributes: Story = {
  render: () => (
    <Inline space="space.100" alignBlock="center">
      <Text>Findings</Text>
      <Count
        ref={countRef}
        value={120}
        max={undefined}
        appearance={undefined}
        data-testid="findings"
        title="120 open findings"
        className="align-middle"
      />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const count = within(canvasElement).getByTestId("findings");
    await expect(countRef.current).toBe(count);
    await expect(count).toHaveTextContent("99+");
    await expect(count).toHaveAttribute("title", "120 open findings");
    await expect(count).toHaveAttribute("data-slot", "count");
    await expect(count).toHaveAttribute("data-appearance", "default");
    await expect(count).toHaveClass("align-middle");
  },
};
