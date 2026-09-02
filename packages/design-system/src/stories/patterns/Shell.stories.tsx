import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive, Bell, Bug, CircleHelp, ClipboardList, Command as CommandIcon, FileCheck2, Gauge, Search, Settings, ShieldCheck } from "lucide-react";

import { Avatar, Badge, IconButton, Input, InputGroup, Tooltip } from "../../components";
import { PageHeader } from "../../patterns";
import { Shell } from "../../shell";
import { Text } from "../../primitives";

const meta = {
  title: "Patterns/Shell",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Frame: Story = {
  render: () => (
    <Shell
      sidebar={
        <Shell.Sidebar
          brand={<Shell.Brand mark={<Shell.Mark />} name="Equinox" detail="Northwind Corp" onClick={() => undefined} />}
          footer={<Shell.User avatar={<Avatar name="Sarah Chen" size="small" />} name="Sarah Chen" role="Compliance lead" onClick={() => undefined} />}
        >
          <Shell.NavGroup label="Work">
            <Shell.NavItem asChild icon={ShieldCheck} badge="1"><a href="#queue">My queue</a></Shell.NavItem>
            <Shell.NavItem asChild icon={ClipboardList} isActive><a href="#programs">Programs</a></Shell.NavItem>
            <Shell.NavItem asChild icon={Gauge}><a href="#portfolio">Portfolio</a></Shell.NavItem>
          </Shell.NavGroup>
          <Shell.NavGroup label="Risk">
            <Shell.NavItem asChild icon={Bug} badge="7"><a href="#findings">Findings and assets</a></Shell.NavItem>
            <Shell.NavItem asChild icon={FileCheck2}><a href="#controls">Control catalog</a></Shell.NavItem>
            <Shell.NavItem asChild icon={Archive}><a href="#evidence">Evidence</a></Shell.NavItem>
          </Shell.NavGroup>
        </Shell.Sidebar>
      }
      topBar={
        <Shell.TopBar
          actions={
            <>
              <Badge tone="warning" className="hidden sm:inline-flex">Audit window open</Badge>
              {([[CircleHelp, "Help"], [Bell, "Notifications"], [Settings, "Settings"]] as const).map(([Icon, label]) => (
                <Tooltip key={label} content={label}>
                  <IconButton label={label} variant="subtle"><Icon className="size-icon-medium" /></IconButton>
                </Tooltip>
              ))}
            </>
          }
        >
          <InputGroup leading={<Search />} trailing={<span className="flex items-center gap-025"><CommandIcon className="size-100" />K</span>} width={420}>
            <Input type="search" placeholder="Search risks, controls, evidence…" aria-label="Search" className="h-control-small" />
          </InputGroup>
        </Shell.TopBar>
      }
    >
      <PageHeader eyebrow="Work" title="Programs" description="Every programme in flight, with its phase and its next gate." />
      <Text color="color.text.subtle" className="pt-300">The page.</Text>
    </Shell>
  ),
};
