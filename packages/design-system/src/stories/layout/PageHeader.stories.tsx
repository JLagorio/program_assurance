import { expect, waitFor, within } from "storybook/test";
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
  HeadingLevelProvider,
  PageHeader,
  PageHeaderLead,
  PageHeaderTitle,
  Section,
} from "../..";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  subcomponents: { PageHeaderTitle, PageHeaderLead },
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

/** A full-label primary beside a long title on a phone: the actions take the next row, right-aligned, and the title keeps its measure instead of breaking a word a line. */
export const Stacked: Story = {
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  tags: ["narrow"],
  render: () => (
    <PageHeader>
      <PageHeader.Lead>Assessment campaigns</PageHeader.Lead>
      <PageHeader.Heading>
        <PageHeader.Title>WS-X90 Expanded Control Set Assessment</PageHeader.Title>
      </PageHeader.Heading>
      <PageHeader.Actions>
        <Button variant="primary">Edit assessment campaign</Button>
      </PageHeader.Actions>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const header = canvas.getByRole("banner").getBoundingClientRect();
    const title = canvas.getByRole("heading", { level: 1 }).getBoundingClientRect();
    const action = canvas
      .getByRole("button", { name: "Edit assessment campaign" })
      .getBoundingClientRect();
    await expect(action.top).toBeGreaterThanOrEqual(title.bottom);
    await expect(Math.round(action.right)).toBe(Math.round(header.right));
    await expect(title.width).toBeGreaterThan(200);
    await expect(action.right).toBeLessThanOrEqual(window.innerWidth);
  },
};

/** The same Title at three levels. On a page it is the h1. In a preview or a panel body, which starts its outline at 2, it takes that level from the context and the content after it goes one below through a HeadingLevelProvider. `render` sets the element outright, for a surface with its own title part. The type style is the same in all three, so a preview never copies the Title's classes onto a raw heading. */
export const TitleLevels: Story = {
  name: "Title levels",
  render: () => (
    <div className="flex flex-col gap-400">
      <PageHeader>
        <PageHeader.Title>Access review</PageHeader.Title>
      </PageHeader>
      {/* A header inside a panel or a sheet is not a banner landmark; the page's is. */}
      <HeadingLevelProvider level={2}>
        <aside aria-label="Preview" className="flex flex-col gap-200">
          <PageHeader>
            <PageHeader.Title>Quarterly access review evidence</PageHeader.Title>
            <PageHeader.Actions>
              <Button size="small" variant="primary">
                Edit artifact
              </Button>
            </PageHeader.Actions>
          </PageHeader>
          <HeadingLevelProvider>
            <Section title="Versions">Three versions recorded.</Section>
          </HeadingLevelProvider>
        </aside>
      </HeadingLevelProvider>
      <section aria-label="Version review">
        <PageHeader>
          <PageHeader.Title render={<h2 />}>Recovery exercise evidence</PageHeader.Title>
        </PageHeader>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = canvas.getByRole("heading", { name: "Access review" });
    const preview = canvas.getByRole("heading", { name: "Quarterly access review evidence" });
    const rendered = canvas.getByRole("heading", { name: "Recovery exercise evidence" });
    await expect(page.tagName).toBe("H1");
    await expect(preview.tagName).toBe("H2");
    await expect(rendered.tagName).toBe("H2");
    await expect(canvas.getByRole("heading", { name: "Versions" }).tagName).toBe("H3");
    for (const title of [preview, rendered]) {
      await expect(title).toHaveAttribute("data-slot", "page-header-title");
      await expect(title.className).toBe(page.className);
    }
  },
};
