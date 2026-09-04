import type { Meta, StoryObj } from "@storybook/react-vite";

import { KeyValue, TextLink } from "../../components";
import { PreviewRail } from "../../patterns";
import { Box, Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/PreviewRail",
  component: PreviewRail,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PreviewRail>;
export default meta;
type Story = StoryObj;

/** With a title and an open-record link, and with the id alone. */
export const PreviewRailMatrix: Story = {
  parameters: {
    // Two rails, two unnamed asides; a page has one. A false positive of the layout, not a defect.
    a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } },
  },
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      <Box className="w-layout-rail">
        <PreviewRail
          id="FND-2231"
          title="Router management plane accepts unencrypted telnet"
          onClose={() => {}}
          openTo={
            <TextLink size="small">
              <a href="#open">Open</a>
            </TextLink>
          }
        >
          <Stack space="space.100">
            <KeyValue label="CCI">CCI-001453</KeyValue>
            <KeyValue label="Asset">edge-sw-a1</KeyValue>
          </Stack>
        </PreviewRail>
      </Box>
      <Box className="w-layout-rail">
        <PreviewRail id="RSK-0021" onClose={() => {}}>
          <Text size="small" color="color.text.subtle">
            Only the id.
          </Text>
        </PreviewRail>
      </Box>
    </Inline>
  ),
};
