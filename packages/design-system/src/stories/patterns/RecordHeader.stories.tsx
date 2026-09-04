import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Breadcrumb, Button, Fact, Tabs, TextLink } from "../../components";
import { RecordHeader } from "../../patterns";
import { Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/RecordHeader",
  component: RecordHeader,
  parameters: { layout: "padded" },
} satisfies Meta<typeof RecordHeader>;
export default meta;
type Story = StoryObj;

/** Id and title; with a back chevron, meta and actions; with facts; with a breadcrumb and a row below. */
export const RecordHeaderMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <RecordHeader id="PRG-1041" title="Atlas payments platform" />
      <RecordHeader
        id="REQ-0118"
        title="The gateway shall encrypt telemetry in transit"
        facts={
          <>
            <Fact label="Owner">Dana Whitfield</Fact>
            <Fact label="Method">Test</Fact>
            <Fact label="State">
              <Badge tone="success">Verified</Badge>
            </Fact>
            <Fact label="Allocated to">
              <TextLink>
                <a href="#cmp">Telemetry gateway</a>
              </TextLink>
            </Fact>
          </>
        }
      />
      <RecordHeader
        back={<a href="#back" />}
        id="PRG-1041"
        title="Atlas payments platform"
        meta={
          <Inline space="space.100" alignBlock="center">
            <Badge tone="information">In assessment</Badge>
            <Text size="small" color="color.text.subtle">
              NIST SP 800-53 Rev. 5 · High
            </Text>
          </Inline>
        }
        actions={
          <>
            <Button variant="secondary">Views</Button>
            <Button variant="primary">Record assessment result</Button>
          </>
        }
      />
      <RecordHeader
        breadcrumb={
          <Breadcrumb>
            <Breadcrumb.Item>Programs</Breadcrumb.Item>
            <Breadcrumb.Item>Atlas payments platform</Breadcrumb.Item>
            <Breadcrumb.Item isCurrent>SCTM</Breadcrumb.Item>
          </Breadcrumb>
        }
        id="PRG-1041"
        title="Security control traceability matrix"
        below={
          <Tabs label="Sections">
            <Tabs.Tab isSelected count={340}>
              Rows
            </Tabs.Tab>
            <Tabs.Tab count={12}>Gaps</Tabs.Tab>
          </Tabs>
        }
      />
    </Stack>
  ),
};
