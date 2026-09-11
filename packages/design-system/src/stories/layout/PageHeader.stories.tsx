import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Inline,
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
      <div>
        <PageHeader.Title>Findings</PageHeader.Title>
        <PageHeader.Description>12 open · 3 need review</PageHeader.Description>
      </div>
      <PageHeader.Actions>
        <Button>Export</Button>
        <Button variant="primary">New finding</Button>
      </PageHeader.Actions>
    </PageHeader>
  ),
};
export const Record: Story = {
  render: () => (
    <PageHeader>
      <Breadcrumb className="col-span-full">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>REQ-104</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader.Title>
        Review privileged access across the platform and supporting services
      </PageHeader.Title>
      <PageHeader.Actions>
        <Button>Request changes</Button>
        <Button variant="primary">Approve</Button>
      </PageHeader.Actions>
      <Inline className="col-span-full" space="space.150">
        <Badge>In review</Badge>
        <span>Alex Morgan</span>
      </Inline>
    </PageHeader>
  ),
};
