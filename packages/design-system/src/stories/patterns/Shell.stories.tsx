import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Archive,
  Bell,
  Boxes,
  Bug,
  CircleHelp,
  ClipboardList,
  Command as CommandIcon,
  FileCheck2,
  FlaskConical,
  Gauge,
  Library,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  Avatar,
  Badge,
  Banner,
  Button,
  Count,
  Fact,
  IconButton,
  Input,
  InputGroup,
  Tabs,
  Tooltip,
} from "../../components";
import { ModeSwitch } from "../../mode";
import { PageHeader, Panel, RecordHeader } from "../../patterns";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Block, Inspector } from "../../shapes";
import { Shell, useSideNav } from "../../shell";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Patterns/Shell",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const programs = Array.from({ length: 28 }, (_, i) => ({
  id: `PRG-${String(i + 1).padStart(3, "0")}`,
  title: ["Ground segment refresh", "Payload integration", "Fleet telemetry", "Range safety"][
    i % 4
  ],
  phase: ["Assess", "Authorise", "Monitor", "Prepare"][i % 4],
}));

/** The hook from product code: the same toggle the top nav's button has. */
function SideNavControls() {
  const nav = useSideNav();
  return (
    <Button onClick={nav.toggle}>
      {nav.isExpanded ? "Hide the side nav" : "Show the side nav"}
    </Button>
  );
}

function Nav() {
  return (
    <>
      <Shell.SideNav.Section heading="Work">
        <Shell.SideNav.Item asChild icon={ShieldCheck} badge="1">
          <a href="#queue">My queue</a>
        </Shell.SideNav.Item>
        <Shell.SideNav.Item asChild icon={ClipboardList} isActive>
          <a href="#programs">Programs</a>
        </Shell.SideNav.Item>
        <Shell.SideNav.Item asChild icon={FlaskConical}>
          <a href="#campaigns">Test campaigns</a>
        </Shell.SideNav.Item>
        <Shell.SideNav.Item asChild icon={Gauge}>
          <a href="#portfolio">Portfolio</a>
        </Shell.SideNav.Item>
      </Shell.SideNav.Section>
      <Shell.SideNav.Section heading="Risk">
        <Shell.SideNav.Expandable icon={Bug} label="Findings and assets" badge="7" defaultOpen>
          <Shell.SideNav.Item asChild>
            <a href="#findings">Findings</a>
          </Shell.SideNav.Item>
          <Shell.SideNav.Item asChild>
            <a href="#assets">Assets</a>
          </Shell.SideNav.Item>
        </Shell.SideNav.Expandable>
        <Shell.SideNav.Item asChild icon={ShieldAlert} badge="4">
          <a href="#register">POA&M and risk</a>
        </Shell.SideNav.Item>
        <Shell.SideNav.Item asChild icon={Archive}>
          <a href="#packages">Packages</a>
        </Shell.SideNav.Item>
      </Shell.SideNav.Section>
      <Shell.SideNav.Section heading="Libraries">
        <Shell.SideNav.Item asChild icon={FileCheck2}>
          <a href="#controls">Control catalog</a>
        </Shell.SideNav.Item>
        <Shell.SideNav.Item asChild icon={Boxes}>
          <a href="#stigs">STIG and SRG library</a>
        </Shell.SideNav.Item>
        <Shell.SideNav.Item asChild icon={Library}>
          <a href="#providers">Providers</a>
        </Shell.SideNav.Item>
      </Shell.SideNav.Section>
    </>
  );
}

function EndItems() {
  return (
    <>
      <ModeSwitch />
      {(
        [
          [CircleHelp, "Help"],
          [Bell, "Notifications"],
          [Settings, "Settings"],
        ] as const
      ).map(([Icon, label]) => (
        <Tooltip key={label} content={label}>
          <IconButton label={label} variant="subtle">
            <Icon className="size-icon-medium" />
          </IconButton>
        </Tooltip>
      ))}
    </>
  );
}

/** The whole system on one product. Banner and panel open and close from the page. */
function Demo({
  banner = false,
  panel = false,
  collapsed = false,
}: {
  banner?: boolean;
  panel?: boolean;
  collapsed?: boolean;
}) {
  const [showBanner, setShowBanner] = useState(banner);
  const [showPanel, setShowPanel] = useState(panel);
  return (
    <Shell defaultSideNavCollapsed={collapsed} sideNavShortcut>
      {showBanner ? (
        <Shell.Banner>
          <Banner tone="warning" action={<a href="#renew">Ask for an extension</a>}>
            The audit window closes in three days; evidence uploads lock after that.
          </Banner>
        </Shell.Banner>
      ) : null}
      <Shell.TopNav>
        <Shell.TopNav.Start toggle={<Shell.SideNav.ToggleButton />}>
          <Shell.AppSwitcher onClick={() => undefined} />
          <Shell.AppLogo asChild name="Equinox" secondaryName="Northwind Corp">
            <a href="#home" aria-label="Equinox home" />
          </Shell.AppLogo>
        </Shell.TopNav.Start>
        <Shell.TopNav.Middle>
          <InputGroup
            leading={<Search />}
            trailing={
              <span className="flex items-center gap-025">
                <CommandIcon className="size-100" />K
              </span>
            }
            width={480}
          >
            <Input
              type="search"
              placeholder="Search risks, controls, evidence…"
              aria-label="Search"
              className="h-control-small"
            />
          </InputGroup>
          <Button variant="primary">
            <Plus className="size-icon-small" />
            Create
          </Button>
        </Shell.TopNav.Middle>
        <Shell.TopNav.End>
          <EndItems />
        </Shell.TopNav.End>
      </Shell.TopNav>
      <Shell.SideNav>
        <Shell.SideNav.Body>
          <Nav />
        </Shell.SideNav.Body>
        <Shell.SideNav.Footer>
          <Shell.Profile
            avatar={<Avatar name="Sarah Chen" size="small" />}
            name="Sarah Chen"
            role="Compliance lead"
            onClick={() => undefined}
          />
        </Shell.SideNav.Footer>
        <Shell.SideNav.Splitter label="Resize side navigation" />
      </Shell.SideNav>
      <Shell.Main>
        <PageHeader
          eyebrow="Work"
          title="Programs"
          description="Every programme in flight, with its phase and its next gate."
          actions={
            <>
              <Button onClick={() => setShowBanner((v) => !v)}>
                {showBanner ? "Drop the banner" : "Raise a banner"}
              </Button>
              <Button onClick={() => setShowPanel((v) => !v)}>
                {showPanel ? "Close the panel" : "Open the panel"}
              </Button>
              <SideNavControls />
            </>
          }
        />
        <Stack space="space.100" className="pt-300">
          {programs.map((p) => (
            <Inline
              key={p.id}
              space="space.200"
              alignBlock="center"
              className="border-b border-default py-100"
            >
              <Text size="small" color="color.text.subtle" className="tabular-nums">
                {p.id}
              </Text>
              <Text>{p.title}</Text>
              <Badge tone="neutral" size="xsmall">
                {p.phase}
              </Badge>
            </Inline>
          ))}
        </Stack>
      </Shell.Main>
      {showPanel ? (
        <Shell.Panel label="Preview">
          <Shell.Panel.Splitter label="Resize preview" />
          <Inline
            space="space.100"
            alignBlock="center"
            spread="space-between"
            className="border-b border-default px-200 py-100"
          >
            <Text weight="medium">PRG-014 · Payload integration</Text>
            <IconButton label="Close preview" variant="subtle" onClick={() => setShowPanel(false)}>
              <X className="size-icon-medium" />
            </IconButton>
          </Inline>
          <Box padding="space.200">
            <Stack space="space.150">
              <Text color="color.text.subtle">
                Whatever the product puts here: a PreviewRail, a thread, a form. The area is the
                shell's; the preview is not.
              </Text>
              <Text>
                Phase: Authorise. Owner: Sarah Chen. Next gate: SCA sign-off, 12 September.
              </Text>
            </Stack>
          </Box>
        </Shell.Panel>
      ) : null}
    </Shell>
  );
}

export const Frame: Story = { render: () => <Demo /> };

/** A banner above the top nav and a panel beside the page. Both push the layout; neither covers it. */
export const WithBannerAndPanel: Story = { render: () => <Demo banner panel /> };

/** Collapsed on first render. Hover the toggle for the flyout; Ctrl+[ toggles. */
export const Collapsed: Story = { render: () => <Demo collapsed /> };

/** Every part on its own: the items and their states, the levels, the logo's forms, the buttons, the end list. */
export const ShellMatrix: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Stack space="space.400">
      <Specimens title="Side nav items and levels">
        <Box
          className="w-layout-sidenav rounded-medium border border-default p-150"
          backgroundColor="elevation.surface.sunken"
        >
          <Stack space="space.200">
            <Shell.SideNav.Section heading="States">
              <Shell.SideNav.Item icon={ClipboardList} href="#plain">
                Plain
              </Shell.SideNav.Item>
              <Shell.SideNav.Item icon={Gauge} href="#active" isActive>
                Active
              </Shell.SideNav.Item>
              <Shell.SideNav.Item icon={ShieldCheck} href="#count" badge={<Count value={7} />}>
                With a count
              </Shell.SideNav.Item>
              <Shell.SideNav.Item
                icon={Bell}
                href="#badge"
                badge={
                  <Badge tone="danger" size="xsmall">
                    New
                  </Badge>
                }
              >
                With a badge
              </Shell.SideNav.Item>
              <Shell.SideNav.Item href="#noicon">No icon</Shell.SideNav.Item>
              <Shell.SideNav.Item asChild icon={ClipboardList}>
                <a href="#link">A link child</a>
              </Shell.SideNav.Item>
              <Shell.SideNav.Item icon={Plus} onClick={() => undefined}>
                A button
              </Shell.SideNav.Item>
            </Shell.SideNav.Section>
            <Shell.SideNav.Section heading="Levels">
              <Shell.SideNav.Expandable
                icon={Bug}
                label="Findings and assets"
                badge="12"
                defaultOpen
              >
                <Shell.SideNav.Item href="#open" isActive>
                  Findings
                </Shell.SideNav.Item>
                <Shell.SideNav.Expandable label="Assets" defaultOpen>
                  <Shell.SideNav.Item href="#servers">Servers</Shell.SideNav.Item>
                  <Shell.SideNav.Item href="#endpoints">Endpoints</Shell.SideNav.Item>
                </Shell.SideNav.Expandable>
              </Shell.SideNav.Expandable>
              <Shell.SideNav.Expandable icon={Boxes} label="Libraries">
                <Shell.SideNav.Item href="#hidden">Hidden until opened</Shell.SideNav.Item>
              </Shell.SideNav.Expandable>
            </Shell.SideNav.Section>
          </Stack>
        </Box>
      </Specimens>
      <Specimens title="App logo: plain, with a secondary name, as a link, as a switcher, with a mark of its own">
        <Inline space="space.500" alignBlock="center">
          <Shell.AppLogo name="Equinox" />
          <Shell.AppLogo name="Equinox" secondaryName="Northwind Corp" />
          <Shell.AppLogo asChild name="Equinox" secondaryName="Northwind Corp">
            <a href="#home" aria-label="Equinox home" />
          </Shell.AppLogo>
          <Shell.AppLogo name="Equinox" secondaryName="Northwind Corp" onClick={() => undefined} />
          <Shell.AppLogo
            name="Meridian"
            secondaryName="Northwind Corp"
            mark={<Avatar name="Meridian" size="small" />}
          />
        </Inline>
      </Specimens>
      <Specimens title="Toggle button, app switcher, profile">
        <Inline space="space.400" alignBlock="center">
          <Shell.SideNav.ToggleButton />
          <Shell.AppSwitcher />
          <Box className="w-layout-sidenav">
            <Shell.Profile
              avatar={<Avatar name="Sarah Chen" size="small" />}
              name="Sarah Chen"
              role="Compliance lead"
              onClick={() => undefined}
            />
          </Box>
        </Inline>
      </Specimens>
      <Specimens title="Top nav end items, a list that folds into More below the medium breakpoint">
        <Box className="rounded-medium border border-default" backgroundColor="elevation.surface">
          <Shell.TopNav.End>
            <EndItems />
          </Shell.TopNav.End>
        </Box>
      </Specimens>
    </Stack>
  ),
};

const railGroups = [
  {
    title: "Identity",
    rows: [
      { label: "Id", value: "PRG-014" },
      { label: "Kind", value: "Program" },
      { label: "Phase", value: "Authorise" },
      { label: "Framework", value: "NIST 800-53 r5, moderate" },
    ],
  },
  {
    title: "Ownership",
    rows: [
      { label: "Owner", value: "Sarah Chen" },
      { label: "ISSO", value: "Dana Whitfield" },
      { label: "AO", value: "Col. Reyes" },
    ],
  },
  {
    title: "Dates",
    rows: [
      { label: "Created", value: "12 Mar 2026" },
      { label: "Last change", value: "Yesterday" },
      { label: "Next gate", value: "12 Sep 2026" },
    ],
  },
  {
    title: "Counts",
    rows: [
      { label: "Controls", value: "312" },
      { label: "Findings", value: "7 open" },
      { label: "POA&M", value: "4" },
    ],
  },
];
const tabs = ["Overview", "Controls", "Evidence", "Findings"] as const;

/** A record page: the header keeps its facts, the rail is the panel, always there, and it stays while the tabs change. */
function RecordDemo() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  return (
    <Shell>
      <Shell.TopNav>
        <Shell.TopNav.Start toggle={<Shell.SideNav.ToggleButton />}>
          <Shell.AppLogo asChild name="Equinox" secondaryName="Northwind Corp">
            <a href="#home" aria-label="Equinox home" />
          </Shell.AppLogo>
        </Shell.TopNav.Start>
        <Shell.TopNav.Middle>
          <InputGroup leading={<Search />} width={480}>
            <Input
              type="search"
              placeholder="Search…"
              aria-label="Search"
              className="h-control-small"
            />
          </InputGroup>
        </Shell.TopNav.Middle>
        <Shell.TopNav.End>
          <EndItems />
        </Shell.TopNav.End>
      </Shell.TopNav>
      <Shell.SideNav>
        <Shell.SideNav.Body>
          <Nav />
        </Shell.SideNav.Body>
      </Shell.SideNav>
      <Shell.Main>
        <Stack space="space.200">
          <RecordHeader
            back={<a href="#programs" aria-label="Back to programs" />}
            id="PRG-014"
            title="Payload integration"
            meta="Authorise · Sarah Chen"
            actions={
              <>
                <Button>Export</Button>
                <Button variant="primary">Submit for assessment</Button>
              </>
            }
            facts={
              <>
                <Fact label="Phase">Authorise</Fact>
                <Fact label="Owner">Sarah Chen</Fact>
                <Fact label="Next gate">12 Sep</Fact>
              </>
            }
          />
          <Tabs label="Record">
            {tabs.map((t) => (
              <Tabs.Tab key={t} isSelected={tab === t} onClick={() => setTab(t)}>
                {t}
              </Tabs.Tab>
            ))}
          </Tabs>
          <Block title={tab} count={tab === "Overview" ? undefined : 12}>
            <Stack space="space.100">
              <Text color="color.text.subtle">
                The {tab} tab's work. The rail stays while the tab changes.
              </Text>
              {programs.slice(0, 8).map((p) => (
                <Inline
                  key={p.id}
                  space="space.200"
                  alignBlock="center"
                  className="border-b border-default py-100"
                >
                  <Text size="small" color="color.text.subtle" className="tabular-nums">
                    {p.id}
                  </Text>
                  <Text>{p.title}</Text>
                </Inline>
              ))}
            </Stack>
          </Block>
          <Block title="Gates" count={3}>
            <Text color="color.text.subtle">What this record still needs before it moves.</Text>
          </Block>
        </Stack>
      </Shell.Main>
      <Shell.Panel label="Details">
        <Shell.Panel.Splitter label="Resize details" />
        <Panel flush>
          <Inspector groups={railGroups} />
        </Panel>
      </Shell.Panel>
    </Shell>
  );
}

/** The record's rail: details and related information in the shell's panel, always there on a record, never dismissed, staying while the tabs change. The peek is a Sheet, not this. */
export const RecordRail: Story = { name: "Record rail", render: () => <RecordDemo /> };
