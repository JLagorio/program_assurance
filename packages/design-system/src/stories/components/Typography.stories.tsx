import type { Meta, StoryObj } from "@storybook/react-vite";

import { Absent, Eyebrow, Prose, tones } from "../../components";
import { Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Typography",
  component: Eyebrow,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Eyebrow>;
export default meta;
type Story = StoryObj;

/** Eyebrow in every tone; Absent; Prose in every tone. */
export const TypographyMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Eyebrow">
        {tones.map((t) => (
          <Eyebrow key={t} tone={t}>
            {t}
          </Eyebrow>
        ))}
      </Specimens>
      <Specimens title="Absent">
        <Text>
          Assessor: <Absent />
        </Text>
      </Specimens>
      <Stack space="space.200" className="max-w-layout-measure">
        {tones.map((t) => (
          <Prose key={t} label={`${t} prose`} tone={t}>
            The condition, stated against CCI-001453. Management traffic on the tactical edge
            segment is not cryptographically protected.
          </Prose>
        ))}
      </Stack>
    </Stack>
  ),
};
