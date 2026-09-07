import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Badge, Tabs, ToggleGroup } from "../../components";
import { Empty, Section } from "../../patterns";
import { Box, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
  args: { defaultValue: "controls", activation: "automatic", children: null },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

type SectionTab = { value: string; label: string; count?: number };

const sections: SectionTab[] = [
  { value: "overview", label: "Overview" },
  { value: "controls", label: "Controls", count: 26 },
  { value: "evidence", label: "Evidence", count: 3 },
  { value: "history", label: "History" },
];

function Strip({ tabs, label = "Sections" }: { tabs: SectionTab[]; label?: string }) {
  return (
    <Tabs.List label={label}>
      {tabs.map((t) => (
        <Tabs.Tab key={t.value} value={t.value} count={t.count ?? null}>
          {t.label}
        </Tabs.Tab>
      ))}
    </Tabs.List>
  );
}

function Panels({ tabs }: { tabs: SectionTab[] }) {
  return (
    <>
      {tabs.map((t) => (
        <Tabs.Panel key={t.value} value={t.value}>
          <Text as="p" color="color.text.subtle" className="pt-150">
            {t.label}: the view. Sections, a Card, a Table.
          </Text>
        </Tabs.Panel>
      ))}
    </>
  );
}

/** A record's sections: one strip, one panel showing, the selection held by the strip. */
export const Record: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Strip tabs={sections} />
      <Panels tabs={sections} />
    </Tabs>
  ),
};

function Held() {
  const [tab, setTab] = useState("controls");
  return (
    <Stack space="space.200">
      <Tabs value={tab} onValueChange={setTab}>
        <Strip tabs={sections} />
        <Panels tabs={sections} />
      </Tabs>
      <Text size="small" color="color.text.subtle">
        The caller holds it: ?tab={tab}
      </Text>
    </Stack>
  );
}

/** The selection as the caller's state. On a record it is the router's search param, so a view has a URL. */
export const Controlled: Story = { render: () => <Held /> };

function Linked() {
  const [tab, setTab] = useState("controls");
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <Tabs.List label="Sections">
        {sections.map((t) => (
          <Tabs.Tab key={t.value} value={t.value} count={t.count ?? null} asChild>
            <a href={`#${t.value}`}>{t.label}</a>
          </Tabs.Tab>
        ))}
      </Tabs.List>
      <Panels tabs={sections} />
    </Tabs>
  );
}

/** `asChild`: the router's Link takes the tab's role and classes; the count follows its label. The router sets `value` from the URL. */
export const AsLinks: Story = { render: () => <Linked /> };

/** Automatic selects the tab the arrows land on; manual moves focus and Enter or Space selects. Focus a tab and press Right. */
export const Activation: Story = {
  render: () => (
    <Stack space="space.400">
      {(["automatic", "manual"] as const).map((activation) => (
        <Stack key={activation} space="space.100">
          <Text size="small" weight="medium">
            {activation}
          </Text>
          <Tabs defaultValue="overview" activation={activation}>
            <Strip tabs={sections} label={`${activation} activation`} />
            <Panels tabs={sections} />
          </Tabs>
        </Stack>
      ))}
    </Stack>
  ),
};

const six: SectionTab[] = [
  { value: "overview", label: "Overview" },
  { value: "controls", label: "Controls", count: 340 },
  { value: "systems", label: "Systems", count: 12 },
  { value: "findings", label: "Findings", count: 7 },
  { value: "evidence", label: "Evidence", count: 41 },
  { value: "history", label: "History" },
];

/** Every state on one strip, and the strip in a narrow space, where it scrolls. */
export const TabsMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="States">
        <Tabs defaultValue="selected">
          <Tabs.List label="States">
            <Tabs.Tab value="plain">Plain</Tabs.Tab>
            <Tabs.Tab value="selected">Selected</Tabs.Tab>
            <Tabs.Tab value="count" count={12}>
              Count
            </Tabs.Tab>
            <Tabs.Tab value="zero" count={0 || null}>
              Zero hidden
            </Tabs.Tab>
            <Tabs.Tab
              value="trailing"
              trailing={
                <Badge variant="secondary" tone="warning" size="xsmall">
                  Draft
                </Badge>
              }
            >
              Trailing
            </Tabs.Tab>
            <Tabs.Tab value="disabled" disabled>
              Disabled
            </Tabs.Tab>
            <Tabs.Tab value="link" asChild>
              <a href="#link">Link</a>
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="selected" />
        </Tabs>
      </Specimens>
      <Specimens title="Selected with a count">
        <Tabs defaultValue="controls">
          <Tabs.List label="Selected">
            <Tabs.Tab value="controls" count={340}>
              Controls
            </Tabs.Tab>
            <Tabs.Tab value="findings" count={7}>
              Findings
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="controls" />
        </Tabs>
      </Specimens>
      <Specimens title="Narrow: the strip scrolls, never wraps">
        <Box style={{ width: 320 }}>
          <Tabs defaultValue="findings">
            <Strip tabs={six} label="Narrow" />
            <Tabs.Panel value="findings" />
          </Tabs>
        </Box>
      </Specimens>
    </Stack>
  ),
};

const twelve: SectionTab[] = [
  ...six,
  { value: "controls-2", label: "Controls v2" },
  { value: "controls-3", label: "Controls v3" },
  { value: "requirements", label: "Requirements", count: 88 },
  { value: "timeline", label: "Timeline" },
  { value: "team", label: "Team", count: 9 },
  { value: "activity", label: "Activity" },
];

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <ToggleGroup
            aria-label="Scope"
            size="small"
            items={[
              { value: "all", label: "All" },
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ]}
            value="open"
            onChange={() => {}}
          />
        }
        doText="One register, three scopes: a ToggleGroup, or FilterChips. The rows are the same content narrowed."
        dont={
          <Tabs defaultValue="open">
            <Tabs.List label="Scope">
              <Tabs.Tab value="all" count={40}>
                All
              </Tabs.Tab>
              <Tabs.Tab value="open" count={26}>
                Open
              </Tabs.Tab>
              <Tabs.Tab value="closed" count={14}>
                Closed
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="open" />
          </Tabs>
        }
        dontText="Tabs over the same table. A tab is a different view of the record; a filter is the same view with fewer rows, and the reader compares by flipping."
      />
      <Pair
        do={
          <Tabs defaultValue="overview">
            <Strip tabs={sections} label="Four" />
            <Tabs.Panel value="overview" />
          </Tabs>
        }
        doText="Four views, each a noun, the record's day in order. Six is the most."
        dont={
          <Tabs defaultValue="overview">
            <Strip tabs={twelve} label="Twelve" />
            <Tabs.Panel value="overview" />
          </Tabs>
        }
        dontText="Twelve, two of them experiments. The strip scrolls and the reader hunts. Past six, regroup, or move a section into the rail."
      />
      <Pair
        do={
          <Tabs defaultValue="evidence">
            <Tabs.List label="Sections, evidence empty">
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="evidence">Evidence</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="evidence">
              <Box paddingBlock="space.200">
                <Empty
                  title="No evidence yet"
                  description="Link a document or a screenshot to the control and it appears here."
                  size="compact"
                />
              </Box>
            </Tabs.Panel>
          </Tabs>
        }
        doText="The section has nothing yet: the tab opens, and its panel says so and what fills it."
        dont={
          <Tabs defaultValue="overview">
            <Tabs.List label="Sections, evidence disabled">
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="evidence" disabled>
                Evidence
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="overview" />
          </Tabs>
        }
        dontText="A disabled tab for an empty section. The reader cannot learn why, or what to do."
      />
      <Pair
        do={
          <Section title="Objective" description="What the control prevents.">
            <Text as="p" size="small" color="color.text.subtle" className="pt-150">
              One view: no strip. The page is its sections.
            </Text>
          </Section>
        }
        doText="A record with one view has no strip."
        dont={
          <Tabs defaultValue="overview">
            <Tabs.List label="One tab">
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="overview" />
          </Tabs>
        }
        dontText="A strip of one. Nothing to select; the rule and the indicator are noise."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Tabs {...args}>
      <Strip tabs={sections} />
      <Panels tabs={sections} />
    </Tabs>
  ),
};
