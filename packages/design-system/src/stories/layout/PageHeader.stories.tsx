import { expect, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  PageHeader,
} from "../..";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Collection: Story = {
  render: () => (
    <PageHeader>
      <PageHeader.Heading>
        <PageHeader.Title>Findings</PageHeader.Title>
        <PageHeader.Description>12 open · 3 need review</PageHeader.Description>
      </PageHeader.Heading>
      <PageHeader.Actions>
        <Button variant="primary">New finding</Button>
      </PageHeader.Actions>
    </PageHeader>
  ),
};
/** The breadcrumb is the Lead, across both columns; the title and its line are the Heading, the first column. */
export const Record: Story = {
  render: () => (
    <PageHeader>
      <PageHeader.Lead render={<Breadcrumb />}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>REQ-104</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageHeader.Lead>
      <PageHeader.Heading>
        <PageHeader.Title>
          Review privileged access across the platform and supporting services
        </PageHeader.Title>
        <PageHeader.Description>REQ-104 · Access management</PageHeader.Description>
      </PageHeader.Heading>
      <PageHeader.Actions>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button />}>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Request changes</DropdownMenuItem>
            <DropdownMenuItem>Approve</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader.Actions>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole("banner").getBoundingClientRect();
    const lead = canvas.getByRole("navigation", { name: "breadcrumb" }).getBoundingClientRect();
    const title = canvas.getByRole("heading", { level: 1 }).getBoundingClientRect();
    const action = canvas.getByRole("button", { name: "Actions" }).getBoundingClientRect();
    await expect(Math.round(lead.right)).toBe(Math.round(header.right));
    await expect(Math.round(title.left)).toBe(Math.round(lead.left));
    await expect(title.top).toBeGreaterThanOrEqual(lead.bottom);
    await expect(action.left).toBeGreaterThan(title.right);
  },
};

/** A long title wraps beside its permanent action, including on a phone. */
export const Constrained: Story = {
  render: () => (
    <div style={{ width: 320, maxWidth: "100%" }}>
      <PageHeader>
        <PageHeader.Title>
          Executable firmware shall be cryptographically authenticated before execution.
        </PageHeader.Title>
        <PageHeader.Actions>
          <Button size="small">Actions</Button>
        </PageHeader.Actions>
      </PageHeader>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByRole("heading").getBoundingClientRect();
    const action = canvas.getByRole("button", { name: "Actions" }).getBoundingClientRect();
    await expect(action.top).toBe(title.top);
    await expect(action.left).toBeGreaterThan(title.right);
    await expect(action.right).toBeLessThanOrEqual(canvasElement.getBoundingClientRect().right);
  },
};
