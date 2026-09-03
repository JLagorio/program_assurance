import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert, Button, Gates, Progress, Stat, Tiles, tones } from "../../components";
import { Inline, Stack, Text, Box } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Status",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Alerts: Story = {
  render: () => (
    <Stack space="space.200" className="max-w-[560px]">
      <Alert tone="warning" title="3 controls are due this week">
        Verification for CTRL-0412, CTRL-0418 and CTRL-0450 is due by Friday.
      </Alert>
      <Alert tone="danger" title="Evidence expired">
        The bank reconciliation for July no longer covers the period.
      </Alert>
      <Alert tone="success" title="Assessment complete" />
      <Alert tone="information">Only a body. The tone sets the fill and the text.</Alert>
      <Alert tone="neutral" title="Draft">
        Neutral reads as a note, not a warning.
      </Alert>
    </Stack>
  ),
};

export const Bars: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-[480px]">
      {tones.map((t) => (
        <Inline key={t} space="space.300" alignBlock="center">
          <Text size="xsmall" color="color.text.subtlest" className="w-800">
            {t}
          </Text>
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

/** Every tone, plain and titled. */
export const AlertMatrix: Story = {
  render: () => (
    <Matrix
      rows={tones}
      cols={["plain", "titled"] as const}
      rowLabel="tone"
      render={(tone, col) => (
        <Box style={{ width: 300 }}>
          <Alert tone={tone} title={col === "titled" ? "Evidence expires in 12 days" : undefined}>
            {col === "titled"
              ? "Three artifacts on this control were collected more than a year ago."
              : "Three artifacts were collected more than a year ago."}
          </Alert>
        </Box>
      )}
    />
  ),
};

/** Every tone at three values, and the stacked bar at two heights. */
export const ProgressMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={tones}
        cols={["0", "40", "100"] as const}
        rowLabel="tone"
        render={(tone, v) => (
          <Box style={{ width: 160 }}>
            <Progress value={Number(v)} tone={tone} />
          </Box>
        )}
      />
      <Specimens title="Stacked">
        <Box style={{ width: 320 }}>
          <Progress.Stacked
            segments={[
              { key: "s", value: 298, tone: "success", title: "Satisfied" },
              { key: "p", value: 40, tone: "warning", title: "Partial" },
              { key: "o", value: 26, tone: "danger", title: "Other than satisfied" },
              { key: "n", value: 8, tone: "neutral", title: "Not assessed" },
            ]}
          />
        </Box>
        <Box style={{ width: 320 }}>
          <Progress.Stacked
            height={4}
            segments={[
              { key: "s", value: 3, tone: "success" },
              { key: "o", value: 1, tone: "danger" },
            ]}
          />
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** Stat and Stat.Tile in every tone; Tiles as a card and as a band. */
export const StatMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={tones}
        cols={["Stat", "Tile"] as const}
        rowLabel="tone"
        render={(tone, col) =>
          col === "Stat" ? (
            <Stat label="Open findings" value={5} tone={tone} />
          ) : (
            <Box style={{ width: 200 }}>
              <Stat.Tile label="Open findings" value={5} note="1 CAT I" tone={tone} />
            </Box>
          )
        }
      />
      <Specimens title="Tiles · card, 3 columns">
        <Box style={{ width: 600 }}>
          <Tiles cols={3}>
            <Stat.Tile label="Coverage" value="80%" note="298 of 372" tone="success" />
            <Stat.Tile
              label="Not satisfied"
              value={74}
              note="26 other · 40 partial"
              tone="warning"
            />
            <Stat.Tile label="Open findings" value={5} note="1 CAT I" tone="danger" />
          </Tiles>
        </Box>
      </Specimens>
      <Specimens title="Tiles · band, 4 columns">
        <Box style={{ width: 600 }}>
          <Tiles cols={4} frame="band">
            <Stat.Tile label="Coverage" value="80%" />
            <Stat.Tile label="Not satisfied" value={74} />
            <Stat.Tile label="Open findings" value={5} />
            <Stat.Tile label="Gates" value={5} note="Next: MS-C" />
          </Tiles>
        </Box>
      </Specimens>
      <Text size="xsmall" color="color.text.subtlest">
        A tone on a stat is data: the number is a status. Neutral is the default and most numbers
        stay neutral.
      </Text>
    </Stack>
  ),
};

export const GatesStory: Story = {
  name: "Gates",
  render: () => (
    <Stack space="space.100" className="max-w-[420px]">
      <Gates>
        <Gates.Item met label="Owner" />
        <Gates.Item met label="One shall" />
        <Gates.Item
          met={false}
          label="Success criterion"
          reason="Nothing decides that it is met."
          action={
            <Button size="small" variant="link">
              Add
            </Button>
          }
        />
        <Gates.Item
          met={false}
          tone="danger"
          label="Source with rationale"
          reason="SI-7(1) gives no reason."
        />
      </Gates>
    </Stack>
  ),
};

/** Met and unmet in both unmet tones; bare, with a reason, with a reason and an action. */
export const GatesMatrix: Story = {
  render: () => (
    <Matrix
      rows={["met", "unmet · warning", "unmet · danger"] as const}
      cols={["label", "reason", "action"] as const}
      rowLabel="state"
      render={(row, col) => (
        <Box style={{ width: 260 }}>
          <Gates>
            <Gates.Item
              met={row === "met"}
              tone={row.endsWith("danger") ? "danger" : "warning"}
              label="Success criterion"
              reason={col === "label" ? undefined : "Nothing decides that it is met."}
              action={
                col === "action" ? (
                  <Button size="small" variant="link">
                    Add
                  </Button>
                ) : undefined
              }
            />
          </Gates>
        </Box>
      )}
    />
  ),
};
