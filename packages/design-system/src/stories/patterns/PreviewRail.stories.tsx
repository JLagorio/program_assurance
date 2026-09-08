import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Badge,
  Button,
  Id,
  Indicator,
  KeyValue,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TextLink,
} from "../../components";
import { PreviewRail } from "../../patterns";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Inspector } from "../../shapes";
import { Pair } from "../_lib/pair";

const facts = (
  <Stack space="space.200">
    <Inspector.Group title="Join keys">
      <KeyValue label="CCI">
        <Id>CCI-001453</Id>
      </KeyValue>
      <KeyValue label="Control">
        <Id>AC-17(2)</Id>
      </KeyValue>
      <KeyValue label="Asset">edge-sw-a1</KeyValue>
    </Inspector.Group>
    <Inspector.Group title="Severity">
      <KeyValue label="Raw">High</KeyValue>
      <KeyValue label="Mitigated">
        <Indicator tone="warning">Medium</Indicator>
      </KeyValue>
    </Inspector.Group>
  </Stack>
);

const meta = {
  title: "Patterns/PreviewRail",
  component: PreviewRail,
  parameters: { layout: "padded" },
  args: {
    id: "FND-2231",
    title: "Router management plane accepts unencrypted telnet",
    subtitle: "Finding · edge-sw-a1 · ACAS",
    onClose: () => undefined,
    children: facts,
  },
} satisfies Meta<typeof PreviewRail>;
export default meta;
type Story = StoryObj<typeof meta>;

const openTo = (
  <TextLink size="small" asChild={false} href="#open">
    Open finding
  </TextLink>
);

/** The compact record header with a status, the meta line and the way to the record, over facts in groups; and the id alone. */
export const PreviewRailMatrix: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      <Box className="w-layout-rail">
        <PreviewRail
          id="FND-2231"
          title="Router management plane accepts unencrypted telnet"
          subtitle="Finding · edge-sw-a1 · ACAS"
          status={
            <Badge variant="secondary" size="xsmall" tone="danger">
              CAT I
            </Badge>
          }
          onClose={() => undefined}
          openTo={openTo}
        >
          {facts}
        </PreviewRail>
      </Box>
      <Box className="w-layout-rail">
        <PreviewRail id="RSK-0021" onClose={() => undefined}>
          <Text size="small" color="color.text.subtle">
            Only the id.
          </Text>
        </PreviewRail>
      </Box>
    </Inline>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box className="w-layout-rail">
            <PreviewRail
              id="FND-2214"
              title="SSH permits GSSAPI authentication"
              subtitle="Finding · edge-sw-a1 · ACAS"
              onClose={() => undefined}
              openTo={openTo}
            >
              {facts}
            </PreviewRail>
          </Box>
        }
        doText="Facts and the way to the record. The rail is a preview of the row beside it."
        dont={
          <Box className="w-layout-rail">
            <PreviewRail
              id="FND-2208"
              title="SSH permits GSSAPI authentication"
              subtitle="Finding · edge-sw-a1 · ACAS"
              onClose={() => undefined}
            >
              <Stack space="space.150">
                <Tabs defaultValue="Overview" className="contents">
                  <TabsList
                    variant="line"
                    activateOnFocus
                    aria-label="Sections"
                    className="w-full justify-start"
                  >
                    <TabsTrigger value="Overview">Overview</TabsTrigger>
                    <TabsTrigger value="Evidence">Evidence</TabsTrigger>
                    <TabsTrigger value="History">History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="Overview" />
                </Tabs>
                <Inline space="space.100">
                  <Button size="small" variant="primary">
                    Resolve
                  </Button>
                  <Button size="small">Assign</Button>
                </Inline>
                {facts}
              </Stack>
            </PreviewRail>
          </Box>
        }
        dontText="Tabs and a primary in the rail. It has become the record, beside the list that already opens it."
      />
      <Pair
        do={
          <Box className="w-layout-rail">
            <PreviewRail
              id="FND-2199"
              title="Audit log retention below one year"
              onClose={() => undefined}
              openTo={openTo}
            >
              {facts}
            </PreviewRail>
          </Box>
        }
        doText="The way to the record is a link: Open finding."
        dont={
          <Box className="w-layout-rail">
            <PreviewRail
              id="FND-2187"
              title="Audit log retention below one year"
              onClose={() => undefined}
              openTo={
                <Button size="small" variant="primary">
                  Open
                </Button>
              }
            >
              {facts}
            </PreviewRail>
          </Box>
        }
        dontText="A primary button as the way to the record. The way to a page is a link; a button in a preview does something to the record."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Box className="w-layout-rail">
      <PreviewRail {...args} openTo={openTo} />
    </Box>
  ),
};
