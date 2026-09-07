import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, Download, Plus } from "lucide-react";

import { Button, DropdownMenu, IconButton } from "../../components";
import { PageHeader, RecordHeader } from "../../patterns";
import { Stack } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/PageHeader",
  component: PageHeader,
  parameters: { layout: "padded" },
  args: { title: "Programs" },
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Title alone; with an eyebrow and a line; with actions; a line that truncates with its tooltip. */
export const PageHeaderMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <PageHeader title="Programs" />
      <PageHeader
        eyebrow="Libraries"
        title="Control catalog"
        description="800-53 Rev 5, CNSSI 1253 overlays and the CCI decomposition."
      />
      <PageHeader
        title="Findings and assets"
        description="One technical fact per row."
        actions={
          <>
            <Button variant="secondary" iconBefore={<Download />}>
              Export
            </Button>
            <Button variant="primary" iconBefore={<Plus />}>
              New finding
            </Button>
          </>
        }
      />
      <PageHeader
        title="Programs"
        description="Each program scopes one or more systems, categorizes each under CNSSI 1253, and assesses the tailored NIST SP 800-53 Rev. 5 control set it selects."
        actions={
          <DropdownMenu
            align="end"
            trigger={<IconButton label="More" icon={<ChevronDown />} size="medium" />}
          >
            <DropdownMenu.Item onSelect={() => {}}>Export</DropdownMenu.Item>
          </DropdownMenu>
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
        do={<PageHeader title="Programs" description="5 programs · 2 in assessment" />}
        doText="The line is a count or a constraint: what the rows are, right now."
        dont={
          <PageHeader
            title="Programs"
            description="Each program scopes one or more systems, categorizes each under CNSSI 1253, and assesses the tailored NIST SP 800-53 Rev. 5 control set it selects."
          />
        }
        dontText="The model explained under the title. It truncates on every screen, and the reader who needs it is not on this page."
      />
      <Pair
        do={
          <PageHeader
            title="Findings"
            actions={
              <>
                <Button variant="secondary">Export</Button>
                <Button variant="primary">New finding</Button>
              </>
            }
          />
        }
        doText="One primary, one beside it; the rest in a menu."
        dont={
          <PageHeader
            title="Findings"
            actions={
              <>
                <Button variant="primary">Import</Button>
                <Button variant="primary">Export</Button>
                <Button variant="primary">New finding</Button>
              </>
            }
          />
        }
        dontText="Three primaries. The page has one thing to do, and the eye cannot find it."
      />
      <Pair
        do={<RecordHeader id="PRG-1041" title="Atlas payments platform" />}
        doText="A record has an id, a way back and facts: a RecordHeader."
        dont={<PageHeader eyebrow="PRG-1041" title="Atlas payments platform" />}
        dontText="A record's name in an index header, its id as the eyebrow. Nothing says where it came from or what state it is in."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
