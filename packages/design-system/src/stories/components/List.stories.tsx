import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Alert, AlertDescription, AlertTitle, List, TextLink } from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Box, Stack, Text } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/List",
  component: List,
  parameters: { layout: "padded" },
  args: { ordered: false, spacing: "tight" },
  render: (args) => (
    <List {...args}>
      <List.Item>Choose a profile for the program.</List.Item>
      <List.Item>Add at least one system.</List.Item>
      <List.Item>Name an owner for each system.</List.Item>
    </List>
  ),
} satisfies Meta<typeof List>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Bulleted and numbered, tight and loose, a nested list and a numbered list that starts later. */
export const ListMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.300">
      <Specimens title="bulleted, tight (the default)">
        <List>
          <List.Item>Profile</List.Item>
          <List.Item>Systems</List.Item>
          <List.Item>Owners</List.Item>
        </List>
      </Specimens>
      <Specimens title="numbered, loose">
        <Box style={{ maxWidth: 360 }}>
          <List ordered spacing="loose">
            <List.Item>Export the evidence register from the identity provider.</List.Item>
            <List.Item>
              Attach it to the assessment, with the date of the export in its name so the
              reviewer can tell the versions apart.
            </List.Item>
            <List.Item>Ask the assessor to review it.</List.Item>
          </List>
        </Box>
      </Specimens>
      <Specimens title="nested, and numbered from 8">
        <List>
          <List.Item>
            Access control
            <List>
              <List.Item>AC-2 Account management</List.Item>
              <List.Item>AC-3 Access enforcement</List.Item>
            </List>
          </List.Item>
          <List.Item>Audit and accountability</List.Item>
        </List>
        <List ordered start={8}>
          <List.Item>Review</List.Item>
          <List.Item>Authorize</List.Item>
        </List>
      </Specimens>
    </Stack>
  ),
};

/** The items are list items of a real list, so a screen reader says how many there are; `start` numbers from where the text left off. */
export const Semantics: Story = {
  render: () => (
    <Stack space="space.200">
      <List aria-label="Before you create the program" data-testid="bulleted">
        <List.Item>Choose a profile.</List.Item>
        <List.Item>
          Add a system, or <TextLink href="#library">take one from the library</TextLink>.
        </List.Item>
      </List>
      <List ordered start={3} aria-label="Remaining steps">
        <List.Item>Review</List.Item>
        <List.Item>Authorize</List.Item>
      </List>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const bulleted = canvas.getByRole("list", { name: "Before you create the program" });
    await expect(bulleted.tagName).toBe("UL");
    await expect(bulleted).toHaveAttribute("data-slot", "list");
    await expect(getComputedStyle(bulleted).listStyleType).toBe("disc");
    await expect(within(bulleted).getAllByRole("listitem")).toHaveLength(2);
    await expect(within(bulleted).getByRole("link")).toHaveAttribute("href", "#library");
    const numbered = canvas.getByRole("list", { name: "Remaining steps" });
    await expect(numbered.tagName).toBe("OL");
    await expect(numbered).toHaveAttribute("start", "3");
    await expect(getComputedStyle(numbered).listStyleType).toBe("decimal");
    const [first] = within(numbered).getAllByRole("listitem");
    await expect(first).toHaveAttribute("data-slot", "list-item");
  },
};

/** Validation messages in an Alert: the list takes the alert's colour and size and keeps its inset. */
export const InAnAlert: Story = {
  render: () => (
    <Box style={{ maxWidth: 420 }}>
      <Alert tone="danger">
        <AlertTitle>The program cannot be created yet</AlertTitle>
        <AlertDescription>
          <List>
            <List.Item>Choose a profile.</List.Item>
            <List.Item>Name an owner for Tactical edge segment.</List.Item>
          </List>
        </AlertDescription>
      </Alert>
    </Box>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);
  },
};

/** Right to left: the inset, and the bullets in it, move to the right. */
export const RightToLeft: Story = {
  render: () => (
    <LedgerProvider direction="rtl" locale="ar">
      <List data-testid="rtl">
        <List.Item>اختر ملف التعريف</List.Item>
        <List.Item>أضف نظامًا</List.Item>
      </List>
    </LedgerProvider>
  ),
  play: async ({ canvas }) => {
    const list = canvas.getByTestId("rtl");
    const style = getComputedStyle(list);
    await expect(style.paddingRight).not.toBe("0px");
    await expect(style.paddingLeft).toBe("0px");
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <List>
            <List.Item>Choose a profile.</List.Item>
            <List.Item>Add a system.</List.Item>
          </List>
        }
        doText="Two things to fix are a list: a screen reader says there are two."
        dont={
          <Stack space="space.025">
            <Text>• Choose a profile.</Text>
            <Text>• Add a system.</Text>
          </Stack>
        }
        dontText="Bullets typed into text. It looks like a list and is read as two sentences starting with a bullet."
      />
      <Pair
        do={
          <List ordered>
            <List.Item>Export the register.</List.Item>
            <List.Item>Attach it.</List.Item>
          </List>
        }
        doText="Steps in order are numbered."
        dont={
          <List>
            <List.Item>Export the register.</List.Item>
            <List.Item>Attach it.</List.Item>
          </List>
        }
        dontText="Bullets for an order the reader must follow. Nothing says which comes first."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
