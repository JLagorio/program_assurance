import {
  avatarHue,
  AvatarFallback,
  avatarInitials,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  Badge,
  BreadcrumbItem,
  BreadcrumbLink,
  Avatar,
  Banner,
  Button,
  Count,
  Fact,
  IconButton,
  InputGroup,
  TabsList,
  TabsTrigger,
} from "../../components";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import {
  Archive,
  Bell,
  Boxes,
  Bug,
  CircleHelp,
  ChevronDown,
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
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ModeSwitch } from "../../mode";
import { PageHeader, RecordHeader, ShowPage } from "../../patterns";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Block, Inspector } from "../../shapes";
import { SHELL_STORAGE_KEY, Shell, shellScript, shellScriptFor, useSideNav } from "../../shell";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Shell",
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
        <Shell.SideNav.Item icon={ShieldCheck} badge="1" render={<a href="#queue" />}>
          My queue
        </Shell.SideNav.Item>
        <Shell.SideNav.Item icon={ClipboardList} isActive render={<a href="#programs" />}>
          Programs
        </Shell.SideNav.Item>
        <Shell.SideNav.Item icon={FlaskConical} render={<a href="#campaigns" />}>
          Test campaigns
        </Shell.SideNav.Item>
        <Shell.SideNav.Item icon={Gauge} render={<a href="#portfolio" />}>
          Portfolio
        </Shell.SideNav.Item>
      </Shell.SideNav.Section>
      <Shell.SideNav.Section heading="Risk">
        <Shell.SideNav.Expandable icon={Bug} label="Findings and assets" badge="7" defaultOpen>
          <Shell.SideNav.Item render={<a href="#findings" />}>Findings</Shell.SideNav.Item>
          <Shell.SideNav.Item render={<a href="#assets" />}>Assets</Shell.SideNav.Item>
        </Shell.SideNav.Expandable>
        <Shell.SideNav.Item icon={ShieldAlert} badge="4" render={<a href="#register" />}>
          POA&M and risk
        </Shell.SideNav.Item>
        <Shell.SideNav.Item icon={Archive} render={<a href="#packages" />}>
          Packages
        </Shell.SideNav.Item>
      </Shell.SideNav.Section>
      <Shell.SideNav.Section heading="Libraries">
        <Shell.SideNav.Item icon={FileCheck2} render={<a href="#controls" />}>
          Control catalog
        </Shell.SideNav.Item>
        <Shell.SideNav.Item icon={Boxes} render={<a href="#stigs" />}>
          STIG and SRG library
        </Shell.SideNav.Item>
        <Shell.SideNav.Item icon={Library} render={<a href="#providers" />}>
          Providers
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
        <IconButton key={label} label={label} variant="subtle" icon={<Icon />} />
      ))}
    </>
  );
}

/** The whole system on one product. Banner and panel open and close from the page. */
function Demo({
  banner = false,
  panel = false,
  collapsed = false,
  persist,
}: {
  banner?: boolean;
  panel?: boolean;
  collapsed?: boolean;
  persist?: string | undefined;
}) {
  const [showBanner, setShowBanner] = useState(banner);
  const [showPanel, setShowPanel] = useState(panel);
  return (
    <Shell defaultSideNavCollapsed={collapsed} sideNavShortcut persist={persist}>
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
          <Shell.AppLogo
            name="Equinox"
            secondaryName="Northwind Corp"
            render={<a href="#home" aria-label="Equinox home" />}
          />
        </Shell.TopNav.Start>
        <Shell.TopNav.Middle>
          <InputGroup style={{ width: 480, maxWidth: "100%" }}>
            <InputGroupInput
              type="search"
              placeholder="Search risks, controls, evidence…"
              aria-label="Search"
              className="h-control-small"
            />
            <InputGroupAddon>{<Search />}</InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupText>
                {
                  <span className="flex items-center gap-025">
                    <CommandIcon className="size-100" />K
                  </span>
                }
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <Button variant="primary" iconBefore={<Plus />}>
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
            avatar={
              <Avatar
                size="small"
                role="img"
                aria-label={"Sarah Chen"}
                hue={avatarHue("Sarah Chen")}
                title={"Sarah Chen"}
              >
                <AvatarFallback>{avatarInitials("Sarah Chen", 2)}</AvatarFallback>
              </Avatar>
            }
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
              <Badge variant="secondary" tone="neutral" size="xsmall">
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
            <IconButton
              label="Close preview"
              variant="subtle"
              onClick={() => setShowPanel(false)}
              icon={<X />}
            />
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

export const Frame: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const splitter = within(canvasElement).getByRole("separator", {
      name: "Resize side navigation",
    });
    await waitFor(() => expect(Number(splitter.getAttribute("aria-valuenow"))).toBeGreaterThan(0));
    const initialWidth = Number(splitter.getAttribute("aria-valuenow"));
    splitter.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(Number(splitter.getAttribute("aria-valuenow"))).toBe(initialWidth + 16),
    );
    await expect(splitter).toHaveAttribute("aria-valuetext", `${initialWidth + 16} pixels wide`);
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(Number(splitter.getAttribute("aria-valuenow"))).toBe(initialWidth));
  },
};

/** A banner above the top nav and a panel beside the page. Both push the layout; neither covers it. */
export const WithBannerAndPanel: Story = { render: () => <Demo banner panel /> };

/** Collapsed on first render. Hover the toggle for the flyout; Ctrl+[ toggles. */
export const Collapsed: Story = { render: () => <Demo collapsed /> };

const storyKey = `${SHELL_STORAGE_KEY}.story`;
/** Collapse it, drag it, reload: the browser remembers. The shell script for the head is `shellScript`, or `shellScriptFor(key)` for a key of your own. The head script is not in Storybook, so here the side nav may flash on reload; in an app with the script it does not. */
export const Remembered: Story = {
  render: () => <Demo persist={storyKey} />,
  parameters: {
    docs: {
      description: {
        story: `Stored under ${storyKey}. Head script: ${shellScriptFor(storyKey).length} characters; the default is shellScript (${shellScript.length}).`,
      },
    },
  },
};

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
                  <Badge variant="secondary" tone="danger" size="xsmall">
                    New
                  </Badge>
                }
              >
                With a badge
              </Shell.SideNav.Item>
              <Shell.SideNav.Item href="#noicon">No icon</Shell.SideNav.Item>
              <Shell.SideNav.Item icon={ClipboardList} render={<a href="#link" />}>
                A link child
              </Shell.SideNav.Item>
              <Shell.SideNav.Item
                icon={Plus}
                onClick={() => undefined}
                render={<button type="button" />}
              >
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
          <Shell.AppLogo
            name="Equinox"
            secondaryName="Northwind Corp"
            render={<a href="#home" aria-label="Equinox home" />}
          />
          <Shell.AppLogo
            name="Equinox"
            secondaryName="Northwind Corp"
            render={<button type="button" onClick={() => undefined} />}
          >
            <ChevronDown
              aria-hidden
              className="hidden size-icon-small shrink-0 icon-subtle lg:block"
            />
          </Shell.AppLogo>
          <Shell.AppLogo
            name="Meridian"
            secondaryName="Northwind Corp"
            mark={
              <Avatar
                size="small"
                role="img"
                aria-label={"Meridian"}
                hue={avatarHue("Meridian")}
                title={"Meridian"}
              >
                <AvatarFallback>{avatarInitials("Meridian", 2)}</AvatarFallback>
              </Avatar>
            }
          />
        </Inline>
      </Specimens>
      <Specimens title="Toggle button, app switcher, profile">
        <Inline space="space.400" alignBlock="center">
          <Shell.SideNav.ToggleButton />
          <Shell.AppSwitcher />
          <Box className="w-layout-sidenav">
            <Shell.Profile
              avatar={
                <Avatar
                  size="small"
                  role="img"
                  aria-label={"Sarah Chen"}
                  hue={avatarHue("Sarah Chen")}
                  title={"Sarah Chen"}
                >
                  <AvatarFallback>{avatarInitials("Sarah Chen", 2)}</AvatarFallback>
                </Avatar>
              }
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

/** A record page: the header keeps its facts; the rail, every Inspector group, is the ShowPage's, beside the body of the overview tab under the tab strip; every other tab runs full width. */
function RecordDemo() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  return (
    <Shell>
      <Shell.TopNav>
        <Shell.TopNav.Start toggle={<Shell.SideNav.ToggleButton />}>
          <Shell.AppLogo
            name="Equinox"
            secondaryName="Northwind Corp"
            render={<a href="#home" aria-label="Equinox home" />}
          />
        </Shell.TopNav.Start>
        <Shell.TopNav.Middle>
          <InputGroup style={{ width: 480, maxWidth: "100%" }}>
            <InputGroupInput
              type="search"
              placeholder="Search…"
              aria-label="Search"
              className="h-control-small"
            />
            <InputGroupAddon>{<Search />}</InputGroupAddon>
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
        <ShowPage
          tab={tab}
          onTabChange={(value) => setTab(value as typeof tab)}
          header={
            <RecordHeader
              crumbs={
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              }
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
          }
          tabs={
            <TabsList
              variant="line"
              activateOnFocus
              aria-label="Record"
              className="w-full justify-start"
            >
              {tabs.map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          }
          rail={tab === "Overview" ? <Inspector groups={railGroups} /> : null}
        >
          <Block title={tab} count={tab === "Overview" ? undefined : 12}>
            <Stack space="space.100">
              <Text color="color.text.subtle">
                {tab === "Overview"
                  ? "The overview's work, beside the rail."
                  : `The ${tab} tab's work, the full width.`}
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
        </ShowPage>
      </Shell.Main>
    </Shell>
  );
}

/** The record's rail: details and related information, every Inspector group, in the ShowPage's rail beside the overview tab, under the tab strip; the other tabs run full width. The shell's panel holds the detail of a selected row or a panel the reader opens, never the rail; the peek is a Sheet. */
export const RecordRail: Story = { name: "Record rail", render: () => <RecordDemo /> };

/** A side nav column on its own, for a pair. */
function NavBox({ children }: { children: React.ReactNode }) {
  return (
    <Box
      className="w-layout-sidenav rounded-medium border border-default p-150"
      backgroundColor="elevation.surface.sunken"
    >
      <Stack space="space.200">{children}</Stack>
    </Box>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <NavBox>
            <Shell.SideNav.Section heading="Work">
              <Shell.SideNav.Item icon={ShieldCheck} href="#queue" badge="1">
                My queue
              </Shell.SideNav.Item>
              <Shell.SideNav.Item icon={ClipboardList} href="#programs" isActive>
                Programs
              </Shell.SideNav.Item>
              <Shell.SideNav.Item icon={FlaskConical} href="#campaigns">
                Test campaigns
              </Shell.SideNav.Item>
            </Shell.SideNav.Section>
          </NavBox>
        }
        doText="The side nav holds objects and queues: what the reader opens. A phase is a state of a program, reached by opening it."
        dont={
          <NavBox>
            <Shell.SideNav.Section heading="Programs">
              <Shell.SideNav.Item icon={ClipboardList} href="#categorize">
                Categorize
              </Shell.SideNav.Item>
              <Shell.SideNav.Item icon={ClipboardList} href="#select" isActive>
                Select
              </Shell.SideNav.Item>
              <Shell.SideNav.Item icon={ClipboardList} href="#implement">
                Implement
              </Shell.SideNav.Item>
              <Shell.SideNav.Item icon={ClipboardList} href="#assess">
                Assess
              </Shell.SideNav.Item>
              <Shell.SideNav.Item icon={ClipboardList} href="#authorize">
                Authorize
              </Shell.SideNav.Item>
            </Shell.SideNav.Section>
          </NavBox>
        }
        dontText="Phases in the side nav. Five destinations that are one program's states, and every other program is nowhere."
      />
      <Pair
        do={
          <NavBox>
            <Shell.SideNav.Section heading="Risk">
              <Shell.SideNav.Expandable icon={Bug} label="Findings and assets" defaultOpen>
                <Shell.SideNav.Item href="#findings" isActive>
                  Findings
                </Shell.SideNav.Item>
                <Shell.SideNav.Item href="#assets">Assets</Shell.SideNav.Item>
              </Shell.SideNav.Expandable>
            </Shell.SideNav.Section>
          </NavBox>
        }
        doText="Two levels at most: a section, an expandable, its items. What a level deeper would hold is the page's tabs."
        dont={
          <NavBox>
            <Shell.SideNav.Section heading="Risk">
              <Shell.SideNav.Expandable icon={Bug} label="Findings and assets" defaultOpen>
                <Shell.SideNav.Expandable label="Assets" defaultOpen>
                  <Shell.SideNav.Expandable label="Servers" defaultOpen>
                    <Shell.SideNav.Item href="#prod">Production</Shell.SideNav.Item>
                    <Shell.SideNav.Item href="#stage">Staging</Shell.SideNav.Item>
                  </Shell.SideNav.Expandable>
                </Shell.SideNav.Expandable>
              </Shell.SideNav.Expandable>
            </Shell.SideNav.Section>
          </NavBox>
        }
        dontText="Four levels deep. The nav stops at two: past that the tree is the page, and the nav is an outline of it."
      />
      <Pair
        do={
          <Box className="rounded-medium border border-default" backgroundColor="elevation.surface">
            <Shell.TopNav.End>
              <EndItems />
            </Shell.TopNav.End>
          </Box>
        }
        doText="The end slot is icon buttons, each named, with no gaps between them: mode, help, notifications, settings."
        dont={
          <Box className="rounded-medium border border-default" backgroundColor="elevation.surface">
            <Shell.TopNav.End>
              <Button variant="primary" size="small">
                Upgrade
              </Button>
              <Button size="small">Help centre</Button>
              <Button size="small">What's new</Button>
            </Shell.TopNav.End>
          </Box>
        }
        dontText="Text buttons and a primary in the end slot. The top nav is a place to get around, not a place to sell; the create action is the middle slot's."
      />
    </Stack>
  ),
};

/** Slot actions and landmark labels retain the contract of the product-supplied props. */
export const Forwarding: Story = {
  render: () => <ForwardingExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("main", { name: "Account content" })).toHaveAttribute(
      "id",
      "account-content",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Account console" }));
    await expect(canvas.getByText("Opened 1 time")).toBeVisible();
    await userEvent.keyboard(" ");
    await expect(canvas.getByText("Opened 2 time")).toBeVisible();
    const link = canvas.getByRole("link", { name: "Records 3" });
    await expect(link).toHaveAttribute("href", "#records");
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(link.querySelector("a")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Focus destination" }));
    await expect(link).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(canvas.getByText("Navigated 0 times")).toBeVisible();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Navigated 2 times")).toBeVisible();
    await expect(link.style.paddingInlineStart).toContain("calc(");
    await expect(link.style.opacity).toBe("0.9");
  },
};

function ForwardingExample() {
  const [count, setCount] = useState(0);
  const [navigated, setNavigated] = useState(0);
  const rootRef = useRef<HTMLAnchorElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  return (
    <Stack>
      <Shell.AppLogo
        name="Account console"
        onClick={() => setCount((n) => n + 1)}
        render={<button type="button" />}
      />
      <Shell.SideNav.Expandable label="Workspace" defaultOpen>
        <Shell.SideNav.Item
          ref={rootRef}
          icon={Archive}
          badge={3}
          isActive
          style={{ opacity: 0.9 }}
          onClick={() => setNavigated((n) => n + 1)}
          render={
            <a
              ref={linkRef}
              href="#records"
              onClick={(event) => {
                event.preventDefault();
                setNavigated((n) => n + 1);
              }}
            />
          }
        >
          Records
        </Shell.SideNav.Item>
      </Shell.SideNav.Expandable>
      <Button
        onClick={() => {
          if (rootRef.current === linkRef.current) rootRef.current?.focus();
        }}
      >
        Focus destination
      </Button>
      <Text>Navigated {navigated} times</Text>
      <Shell.Main id="account-content" label="Account content">
        <Text>Opened {count} time</Text>
      </Shell.Main>
    </Stack>
  );
}
