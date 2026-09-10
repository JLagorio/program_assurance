import { expect, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown } from "lucide-react";

import {
  Badge,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  IconButton,
  Stepper,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Count,
} from "../../components";
import { RecordHeader } from "../../patterns";
import { Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/RecordHeader",
  component: RecordHeader,
  parameters: { layout: "padded" },
  args: { id: "PRG-1041", title: "Atlas payments platform" },
} satisfies Meta<typeof RecordHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The id as the trail; the parents in the trail, meta and actions; a sub-page under its record's trail with a strip below; a lifecycle below. */
export const RecordHeaderMatrix: Story = {
  // Several record headers in one story mean several trails named "breadcrumb"; a page has one.
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: () => (
    <Stack space="space.400">
      <RecordHeader id="PRG-1041" title="Atlas payments platform" />
      <RecordHeader
        crumbs={
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
            </BreadcrumbItem>
          </>
        }
        id="PRG-1041"
        title="Atlas payments platform"
        meta={
          <Inline space="space.100" alignBlock="center">
            <Badge variant="secondary" tone="information">
              In assessment
            </Badge>
            <Text size="small" color="color.text.subtle">
              NIST SP 800-53 Rev. 5 · High
            </Text>
          </Inline>
        }
        actions={
          <>
            <Button variant="secondary">Views</Button>
            <Button variant="primary">Record assessment result</Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<IconButton label="More actions" size="medium" icon={<ChevronDown />} />}
              />
              <DropdownMenuContent align="end" style={{ width: 200 }}>
                <DropdownMenuItem onClick={() => {}}>Export SSP</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => {}}>
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />
      <RecordHeader
        crumbs={
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#program">Atlas payments platform</BreadcrumbLink>
            </BreadcrumbItem>
          </>
        }
        id="PRG-1041"
        title="Security control traceability matrix"
        below={
          <Tabs defaultValue="Rows" className="contents">
            <TabsList
              variant="line"
              activateOnFocus
              aria-label="Sections"
              className="w-full justify-start"
            >
              <TabsTrigger value="Rows">
                Rows
                <Count value={340} max={9999} />
              </TabsTrigger>
              <TabsTrigger value="Gaps">
                Gaps
                <Count value={12} max={9999} />
              </TabsTrigger>
            </TabsList>
            <TabsContent value="Rows" />
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

/** Optional parent levels can resolve to an empty fragment or array. The current id starts the trail in both cases. */
export const EmptyParentLevels: Story = {
  args: { crumbs: [] },
  // Independent record examples repeat their navigation landmarks.
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: (args) => (
    <Stack space="space.400">
      <RecordHeader {...args} crumbs={<>{args.crumbs}</>} />
      <RecordHeader
        {...args}
        id="REQ-0118"
        title="The gateway shall encrypt telemetry in transit"
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const trails = within(canvasElement).getAllByRole("navigation", { name: "breadcrumb" });
    await expect(trails).toHaveLength(2);
    for (const trail of trails) {
      const current = within(trail).getByRole("link", { current: "page" });
      await expect(current).toBeVisible();
      await expect(within(trail).getAllByRole("listitem")).toHaveLength(1);
      await expect(within(trail).getAllByRole("link")).toHaveLength(1);
      for (const separator of trail.querySelectorAll('[data-slot="breadcrumb-separator"]')) {
        await expect(separator).not.toBeVisible();
      }
    }
  },
};

export const Playground: Story = {};
