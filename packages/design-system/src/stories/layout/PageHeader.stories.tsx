import { expect, waitFor, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, MoreHorizontal } from "lucide-react";
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
  DropdownMenuLinkItem,
  HeadingLevelProvider,
  IconButton,
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

/** The header in its own frame: a `div` stamped `page-header`, never a landmark. */
const headerOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="page-header"]')!;

/** A register's header is its name and nothing else: the create action is the toolbar's primary, and no sentence sits under the title. */
export const Collection: Story = {
  render: () => (
    <PageHeader>
      <PageHeader.Heading>
        <PageHeader.Title>Findings</PageHeader.Title>
      </PageHeader.Heading>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = headerOf(canvasElement);
    await expect(header.tagName).toBe("DIV");
    await expect(canvas.queryByRole("banner")).toBeNull();
    await expect(canvas.getByRole("heading", { level: 1, name: "Findings" })).toBeVisible();
    await expect(header.querySelector('[data-slot="page-header-description"]')).toBeNull();
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

/** A record: the trail is the Lead, across both columns, with the code as its last level; the name is the Title; one Actions menu sits at the end of the title's row, a default-size Button with a trailing chevron, whose destination (Inspect record, last) is a link item. */
export const Record: Story = {
  render: () => (
    <PageHeader>
      <PageHeader.Lead render={<Breadcrumb />}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#requirements">Requirements</BreadcrumbLink>
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
      </PageHeader.Heading>
      <PageHeader.Actions>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />} />}>
            Actions
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Request changes</DropdownMenuItem>
            <DropdownMenuItem>Approve</DropdownMenuItem>
            <DropdownMenuLinkItem href="#schema/requirements/req-104">
              Inspect record
            </DropdownMenuLinkItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader.Actions>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("banner")).toBeNull();
    const header = headerOf(canvasElement).getBoundingClientRect();
    const lead = canvas.getByRole("navigation", { name: "Breadcrumb" }).getBoundingClientRect();
    const title = canvas.getByRole("heading", { level: 1 }).getBoundingClientRect();
    const action = canvas.getByRole("button", { name: "Actions" }).getBoundingClientRect();
    await expect(Math.round(lead.right)).toBe(Math.round(header.right));
    await expect(Math.round(title.left)).toBe(Math.round(lead.left));
    await expect(title.top).toBeGreaterThanOrEqual(lead.bottom);
    // Beside the title while the row holds its measure, else on the next row at the end.
    if (action.top >= title.bottom)
      await expect(Math.round(action.right)).toBe(Math.round(header.right));
    else await expect(action.left).toBeGreaterThan(title.right);
  },
};

/** Outside the register and record shapes, a page that needs one line of orientation (a settings page, a setup step) puts it in Description, under the title. A register or a record page has none: a code belongs in the trail, and counts and states in the page's properties. */
export const WithDescription: Story = {
  name: "With a description",
  render: () => (
    <PageHeader>
      <PageHeader.Heading>
        <PageHeader.Title>Notification settings</PageHeader.Title>
        <PageHeader.Description>
          Choose which changes to your records send you an email.
        </PageHeader.Description>
      </PageHeader.Heading>
    </PageHeader>
  ),
  play: async ({ canvasElement }) => {
    const title = within(canvasElement).getByRole("heading", { level: 1 });
    const description = canvasElement.querySelector('[data-slot="page-header-description"]')!;
    await expect(description.tagName).toBe("P");
    await expect(description.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      title.getBoundingClientRect().bottom,
    );
  },
};

/** A long title wraps beside a small action, as in a preview's inner header, including in a 320px frame. */
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
      <PageHeader.Lead render={<Breadcrumb />}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#campaigns">Assessment campaigns</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>CMP-12</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageHeader.Lead>
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
    const header = headerOf(canvasElement).getBoundingClientRect();
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

/** The same Title at three levels. On a page it is the h1. In a preview or a panel body, which starts its outline at 2, it takes that level from the context, beside one small primary and a subtle overflow, and the content after it goes one below through a HeadingLevelProvider. `render` sets the element outright, for a surface with its own title part. The type style is the same in all three, so a preview never copies the Title's classes onto a raw heading, and no header is a banner landmark. */
export const TitleLevels: Story = {
  name: "Title levels",
  render: () => (
    <div className="flex flex-col gap-400">
      <PageHeader>
        <PageHeader.Title>Access review</PageHeader.Title>
      </PageHeader>
      <HeadingLevelProvider level={2}>
        <aside aria-label="Preview" className="flex flex-col gap-200">
          <PageHeader>
            <PageHeader.Title>Quarterly access review evidence</PageHeader.Title>
            <PageHeader.Actions>
              <Button size="small" variant="primary">
                Edit artifact
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <IconButton
                      label="More artifact actions"
                      icon={<MoreHorizontal />}
                      size="small"
                      variant="subtle"
                    />
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Replace file</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </PageHeader.Actions>
          </PageHeader>
          <HeadingLevelProvider>
            <Section title="Versions">Three versions recorded.</Section>
          </HeadingLevelProvider>
        </aside>
      </HeadingLevelProvider>
      <div role="dialog" aria-label="Version review">
        <PageHeader>
          <PageHeader.Title render={<h2 />}>Recovery exercise evidence</PageHeader.Title>
        </PageHeader>
      </div>
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
    // A header inside a dialog (a portalled PreviewSheet) is not a second banner.
    await expect(canvas.queryByRole("banner")).toBeNull();
    const dialog = canvas.getByRole("dialog", { name: "Version review" });
    await expect(dialog.querySelector('[data-slot="page-header"]')?.tagName).toBe("DIV");
  },
};
