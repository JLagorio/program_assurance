import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert, Progress, Stat, Tiles, tones } from "../../components";
import { Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Status",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Alerts: Story = {
  render: () => (
    <Stack space="space.200" className="max-w-[560px]">
      <Alert tone="warning" title="3 controls are due this week">Verification for CTRL-0412, CTRL-0418 and CTRL-0450 is due by Friday.</Alert>
      <Alert tone="danger" title="Evidence expired">The bank reconciliation for July no longer covers the period.</Alert>
      <Alert tone="success" title="Assessment complete" />
      <Alert tone="information">Only a body. The tone sets the fill and the text.</Alert>
      <Alert tone="neutral" title="Draft">Neutral reads as a note, not a warning.</Alert>
    </Stack>
  ),
};

export const Bars: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-[480px]">
      {tones.map((t) => (
        <Inline key={t} space="space.300" alignBlock="center">
          <Text size="xsmall" color="color.text.subtlest" className="w-800">{t}</Text>
          <Progress value={t === "neutral" ? 20 : 64} tone={t} />
        </Inline>
      ))}
      <Progress.Stacked
        segments={[
          { key: "verified", value: 41, tone: "success", title: "41 verified" },
          { key: "review", value: 12, tone: "information", title: "12 in review" },
          { key: "due", value: 6, tone: "warning", title: "6 due" },
          { key: "overdue", value: 3, tone: "danger", title: "3 overdue" },
          { key: "todo", value: 18, tone: "neutral", title: "18 not started" },
        ]}
      />
    </Stack>
  ),
};

export const Stats: Story = {
  render: () => (
    <Stack space="space.400">
      <Tiles cols={4}>
        <Stat.Tile label="Controls" value={80} note="Across 6 families" />
        <Stat.Tile label="Verified" value={41} tone="success" note="51% of scope" />
        <Stat.Tile label="Overdue" value={3} tone="danger" note="Oldest 12 days" />
        <Stat.Tile label="Blocked" value={0} note="Nothing waiting on you" />
      </Tiles>
      <Tiles cols={3} frame="band">
        <Stat.Tile label="Evidence items" value={214} />
        <Stat.Tile label="Expiring" value={9} tone="warning" />
        <Stat.Tile label="Assessors" value={5} />
      </Tiles>
      <Inline space="space.600">
        <Stat label="Open findings" value={17} />
        <Stat label="Critical" value={2} tone="danger" />
        <Stat label="Closed this month" value={31} tone="success" />
      </Inline>
    </Stack>
  ),
};
