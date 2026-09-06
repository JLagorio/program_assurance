import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown } from "lucide-react";

import {
  Badge,
  Breadcrumb,
  Button,
  DropdownMenu,
  Fact,
  IconButton,
  Stepper,
  Tabs,
  TextLink,
} from "../../components";
import { RecordHeader } from "../../patterns";
import { Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/RecordHeader",
  component: RecordHeader,
  parameters: { layout: "padded" },
  args: { id: "PRG-1041", title: "Atlas payments platform" },
} satisfies Meta<typeof RecordHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

const facts = (
  <>
    <Fact label="Owner">Dana Whitfield</Fact>
    <Fact label="Method">Test</Fact>
    <Fact label="State">
      <Badge tone="success">Verified</Badge>
    </Fact>
    <Fact label="Allocated to">
      <TextLink asChild={false} href="#cmp">
        Telemetry gateway
      </TextLink>
    </Fact>
  </>
);

/** The id as the trail; with facts (deprecated); the parents in the trail, meta and actions; a sub-page under its record's trail with a strip below; a lifecycle below. */
export const RecordHeaderMatrix: Story = {
  tags: ["contract"],
  // Several record headers in one story mean several trails named "Breadcrumb"; a page has one.
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: () => (
    <Stack space="space.400">
      <RecordHeader id="PRG-1041" title="Atlas payments platform" />
      <RecordHeader
        id="REQ-0118"
        title="The gateway shall encrypt telemetry in transit"
        facts={facts}
      />
      <RecordHeader
        crumbs={
          <>
            <Breadcrumb.Item asChild>
              <a href="#programs">Programs</a>
            </Breadcrumb.Item>
          </>
        }
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
            <DropdownMenu
              align="end"
              trigger={<IconButton label="More actions" size="medium" icon={<ChevronDown />} />}
            >
              <DropdownMenu.Item onSelect={() => {}}>Export SSP</DropdownMenu.Item>
              <DropdownMenu.Item tone="danger" onSelect={() => {}}>
                Archive
              </DropdownMenu.Item>
            </DropdownMenu>
          </>
        }
      />
      <RecordHeader
        crumbs={
          <>
            <Breadcrumb.Item asChild>
              <a href="#programs">Programs</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item asChild>
              <a href="#program">Atlas payments platform</a>
            </Breadcrumb.Item>
          </>
        }
        id="PRG-1041"
        title="Security control traceability matrix"
        below={
          <Tabs defaultValue="Rows" className="contents">
            <Tabs.List label="Sections">
              <Tabs.Tab value="Rows" count={340}>Rows</Tabs.Tab>
              <Tabs.Tab value="Gaps" count={12}>Gaps</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="Rows" />
          </Tabs>
        }
      />
      <RecordHeader
        id="PRG-1041"
        title="Atlas payments platform"
        meta="Updated 2h ago"
        below={
          <Stepper label="Lifecycle">
            <Stepper.Item state="done" label="Categorize" />
            <Stepper.Item state="done" label="Select" />
            <Stepper.Item state="current" label="Implement" />
            <Stepper.Item state="upcoming" label="Assess" />
            <Stepper.Item state="upcoming" label="Authorize" />
          </Stepper>
        }
      />
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<RecordHeader id="REQ-0118" title="Encrypt telemetry in transit" />}
        doText="The trail, the title and the actions. The owner, the method and the state are the rail's Details."
        dont={
          <RecordHeader
            id="REQ-0118"
            title="Encrypt telemetry in transit"
            facts={
              <>
                {facts}
                <Fact label="Source">SRD 4.2.1</Fact>
                <Fact label="Priority">High</Fact>
                <Fact label="Created">3 Aug 2026</Fact>
                <Fact label="Updated">2h ago</Fact>
              </>
            }
          />
        }
        dontText="Eight facts under the title. The strip wraps, and the reader scans a row of labels for the two that matter."
      />
      <Pair
        do={
          <RecordHeader
            id="PRG-1041"
            title="Atlas payments platform"
            meta={<Badge tone="information">In assessment</Badge>}
          />
        }
        doText="Meta is a word or a Badge after the id: the state."
        dont={
          <RecordHeader
            id="PRG-1041"
            title="Atlas payments platform"
            meta="The program is in its assessment phase; the SCA is reviewing the 287 controls in the tailored baseline against the evidence linked so far."
          />
        }
        dontText="A sentence as the meta. It truncates, and the state is buried in it."
      />
      <Pair
        do={
          <RecordHeader
            id="PRG-1041"
            title="Atlas payments platform"
            actions={
              <>
                <Button>Views</Button>
                <Button variant="primary">Record result</Button>
              </>
            }
          />
        }
        doText="One primary and one beside it."
        dont={
          <RecordHeader
            id="PRG-1041"
            title="Atlas payments platform"
            actions={
              <>
                <Button>Export SSP</Button>
                <Button>Schedule</Button>
                <Button>Views</Button>
                <Button variant="primary">Record result</Button>
                <Button variant="danger">Archive</Button>
              </>
            }
          />
        }
        dontText="Five actions in the row, two of them coloured. Past two the rest belong in a menu."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
