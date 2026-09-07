import type { Meta, StoryObj } from "@storybook/react-vite";

import { Breadcrumb } from "../../components";
import { Heading, Stack } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  parameters: { layout: "padded" },
  args: {
    children: (
      <>
        <Breadcrumb.Item asChild>
          <a href="#programs">Programs</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item isCurrent>Atlas payments platform</Breadcrumb.Item>
      </>
    ),
  },
} satisfies Meta<typeof Breadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;

// The matrix stacks several breadcrumb navs; a page has one. A false positive of the layout.
const manyNavs = { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } };

/** Two levels, four, the page alone, in-place crumbs, and a trail too long for its header. */
export const BreadcrumbMatrix: Story = {
  parameters: manyNavs,
  render: () => (
    <Stack space="space.300">
      <Specimens title="Two levels">
        <Breadcrumb>
          <Breadcrumb.Item asChild>
            <a href="#programs">Programs</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item isCurrent>Atlas payments platform</Breadcrumb.Item>
        </Breadcrumb>
      </Specimens>
      <Specimens title="Four levels">
        <Breadcrumb>
          <Breadcrumb.Item asChild>
            <a href="#programs">Programs</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item asChild>
            <a href="#atlas">Atlas payments platform</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item asChild>
            <a href="#controls">Controls</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item isCurrent>AC-2(3) Disable inactive accounts</Breadcrumb.Item>
        </Breadcrumb>
      </Specimens>
      <Specimens title="The page alone">
        <Breadcrumb>
          <Breadcrumb.Item isCurrent>Programs</Breadcrumb.Item>
        </Breadcrumb>
      </Specimens>
      <Specimens title="In place: buttons that change state">
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => undefined}>Payables</Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => undefined}>Approval</Breadcrumb.Item>
          <Breadcrumb.Item isCurrent>Release</Breadcrumb.Item>
        </Breadcrumb>
      </Specimens>
      <Specimens title="Too long for its header: one line, each crumb truncates">
        <div style={{ width: 360 }}>
          <Breadcrumb>
            <Breadcrumb.Item asChild>
              <a href="#programs">Programs</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item asChild>
              <a href="#atlas">Atlas payments platform</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item asChild>
              <a href="#controls">Access control</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item isCurrent>
              AC-2(3) Disable accounts after a period of inactivity
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
      </Specimens>
    </Stack>
  ),
};

/** Above the title in a page header: the way up, then the page. */
export const AboveTitle: Story = {
  render: () => (
    <Stack space="space.100">
      <Breadcrumb>
        <Breadcrumb.Item asChild>
          <a href="#programs">Programs</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item asChild>
          <a href="#atlas">Atlas payments platform</a>
        </Breadcrumb.Item>
      </Breadcrumb>
      <Heading size="large">SCTM</Heading>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  parameters: manyNavs,
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Breadcrumb>
            <Breadcrumb.Item asChild>
              <a href="#programs">Programs</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item isCurrent>Atlas payments platform</Breadcrumb.Item>
          </Breadcrumb>
        }
        doText="The page is last and is not a link."
        dont={
          <Breadcrumb>
            <Breadcrumb.Item asChild>
              <a href="#programs">Programs</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item asChild>
              <a href="#atlas">Atlas payments platform</a>
            </Breadcrumb.Item>
          </Breadcrumb>
        }
        dontText="The page as a link to itself. It reads as one more level up, and the reader loses where they are."
      />
      <Pair
        do={
          <Breadcrumb>
            <Breadcrumb.Item asChild>
              <a href="#programs">Programs</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item asChild>
              <a href="#atlas">Atlas payments platform</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item isCurrent>SCTM</Breadcrumb.Item>
          </Breadcrumb>
        }
        doText="The record tree, from the top: three levels, each a name."
        dont={
          <Breadcrumb>
            <Breadcrumb.Item asChild>
              <a href="#home">Home</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item asChild>
              <a href="#programs">All programs</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item asChild>
              <a href="#atlas">Atlas payments platform</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item asChild>
              <a href="#overview">Overview tab</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item asChild>
              <a href="#sctm">Go to SCTM</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item isCurrent>Current page</Breadcrumb.Item>
          </Breadcrumb>
        }
        dontText="Home, a tab, a verb and 'current page'. The trail is the path the reader took, not the tree."
      />
      <Pair
        do={
          <Breadcrumb>
            <Breadcrumb.Item asChild>
              <a href="#programs">Programs</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item isCurrent>Atlas payments platform</Breadcrumb.Item>
          </Breadcrumb>
        }
        doText="A crumb that goes somewhere is a link, with asChild."
        dont={
          <Breadcrumb>
            <Breadcrumb.Item onClick={() => undefined}>Programs</Breadcrumb.Item>
            <Breadcrumb.Item isCurrent>Atlas payments platform</Breadcrumb.Item>
          </Breadcrumb>
        }
        dontText="A crumb that navigates as a button. It cannot be opened in a new tab, and a screen reader does not hear a link."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
