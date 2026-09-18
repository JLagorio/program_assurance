import { type Meta, type StoryObj } from "@storybook/react-vite";
import {
  Archive,
  Bell,
  Boxes,
  Bug,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Command as CommandIcon,
  FileCheck2,
  FlaskConical,
  Gauge,
  Library,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Id,
  Inspector,
  LedgerProvider,
  PageHeader,
  PreviewNavigation,
  Section,
  Shell,
  SHELL_STORAGE_KEY,
  shellScript,
  shellScriptFor,
  Stack,
  Tabs,
  TabsContent,
  useSideNav,
} from "../..";
import {
  Avatar,
  AvatarFallback,
  avatarHue,
  avatarInitials,
  Badge,
  Banner,
  BreadcrumbLink,
  Button,
  Count,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  TabsList,
  TabsTrigger,
} from "../../components";
import { ModeSwitch } from "../../mode";
import { Box, Inline, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Layout/Shell",
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

/** Below `md` the end items fold into this one menu, so the row never grows past the window. */
function EndOverflow() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<IconButton label="More" variant="subtle" icon={<MoreHorizontal />} />}
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Help</DropdownMenuItem>
        <DropdownMenuItem>Notifications</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  dialog = false,
  persist,
}: {
  banner?: boolean;
  panel?: boolean;
  collapsed?: boolean;
  dialog?: boolean;
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
        <Shell.TopNav.Start>
          <Shell.SideNav.ToggleButton />
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
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupText>
                <span className="flex items-center gap-025">
                  <CommandIcon className="size-100" />K
                </span>
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <Button variant="primary" iconBefore={<Plus />}>
            Create
          </Button>
        </Shell.TopNav.Middle>
        <Shell.TopNav.End overflow={<EndOverflow />}>
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
            description="Compliance lead"
            onClick={() => undefined}
          />
        </Shell.SideNav.Footer>
        <Shell.SideNav.Splitter />
      </Shell.SideNav>
      <Shell.Main>
        <PageHeader>
          <PageHeader.Lead className="font-body text-subtle">{"Work"}</PageHeader.Lead>
          <PageHeader.Heading>
            <PageHeader.Title>{"Programs"}</PageHeader.Title>
            <PageHeader.Description>
              {"Every programme in flight, with its phase and its next gate."}
            </PageHeader.Description>
          </PageHeader.Heading>
          <PageHeader.Actions>
            <>
              <Button onClick={() => setShowBanner((v) => !v)}>
                {showBanner ? "Drop the banner" : "Raise a banner"}
              </Button>
              <Button onClick={() => setShowPanel((v) => !v)}>
                {showPanel ? "Close the panel" : "Open the panel"}
              </Button>
              <SideNavControls />
              {dialog ? (
                <Dialog>
                  <DialogTrigger render={<Button />}>Archive the program</DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Archive the program</DialogTitle>
                      <DialogDescription>
                        While a dialog is open the side nav shortcut stays out of its way.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
                      <DialogClose render={<Button variant="primary" />}>Archive</DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : null}
            </>
          </PageHeader.Actions>
        </PageHeader>
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
        <Shell.Panel title="PRG-014 · Payload integration" onClose={() => setShowPanel(false)}>
          <Stack space="space.150">
            <Text color="color.text.subtle">
              The selected record, a thread, or a form. The shell owns placement, the heading, the
              close and focus.
            </Text>
            <Text>Phase: Authorise. Owner: Sarah Chen. Next gate: SCA sign-off, 12 September.</Text>
          </Stack>
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
    // Home is the narrowest the side nav goes; End is the widest, half the window.
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(splitter).toHaveAttribute("aria-valuenow", "200"));
    await userEvent.keyboard("{End}");
    await waitFor(() =>
      expect(splitter).toHaveAttribute("aria-valuenow", String(Math.round(window.innerWidth / 2))),
    );
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(splitter).toHaveAttribute("aria-valuenow", "200"));
  },
};

/** A banner above the top nav and a panel beside the page. Both push the layout; neither covers it. The panel is the full height of the window: the banner and the top nav stop at its edge. */
export const WithBannerAndPanel: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <Demo banner panel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByRole("complementary", {
      name: "PRG-014 · Payload integration",
    });
    const banner = canvas.getByRole("region", { name: "Banner" });
    const topNav = canvas.getByRole("banner", { name: "Top navigation" });
    if (!window.matchMedia("(min-width: 80rem)").matches) return;
    await waitFor(() => {
      const box = panel.getBoundingClientRect();
      expect(box.top).toBe(0);
      expect(Math.abs(box.height - window.innerHeight)).toBeLessThanOrEqual(1);
      expect(banner.getBoundingClientRect().right).toBeLessThanOrEqual(box.left + 1);
      expect(topNav.getBoundingClientRect().right).toBeLessThanOrEqual(box.left + 1);
    });
  },
};

/** Collapsed on first render. Hover the toggle for the flyout; Ctrl+[ toggles. */
export const Collapsed: Story = { render: () => <Demo collapsed /> };

/** Ctrl+[ toggles the side nav from anywhere on the page, except while a dialog is open. */
export const Shortcut: Story = {
  name: "Side nav shortcut",
  render: () => <Demo dialog />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    if (!window.matchMedia("(min-width: 64rem)").matches) return;
    const toggle = canvas.getByRole("button", { name: "Collapse side navigation" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    // user-event reads a bare "[" as the start of a key code; "[[" is the character.
    const shortcut = () => userEvent.keyboard("{Control>}[[{/Control}");
    await shortcut();
    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "false"));
    await shortcut();
    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "true"));
    // Not while a dialog is open: the same keys leave the side nav alone.
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Archive the program" }));
    const dialog = await body.findByRole("dialog", { name: "Archive the program" });
    await shortcut();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    // Released once the dialog has gone.
    await shortcut();
    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "false"));
    await shortcut();
    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "true"));
  },
};

/** Visually hidden links come first in the tab order, one per area; each moves focus to its area. */
export const SkipLinks: Story = {
  name: "Skip links",
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const nav = canvas.getByRole("navigation", { name: /skip to/i });
    await expect(within(nav).getAllByRole("link")).toHaveLength(3);
    // From the top of the document, the first Tab lands on the first skip link.
    if (doc.activeElement instanceof HTMLElement) doc.activeElement.blur();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: /skip to top navigation/i })).toHaveFocus();
    await userEvent.click(canvas.getByRole("link", { name: /skip to main content/i }));
    await expect(canvas.getByRole("main")).toHaveFocus();
  },
};

/** Dropping the banner pulls the top nav to the top of the window; raising it pushes the top nav down by the banner's height. */
export const BannerToggle: Story = {
  name: "Banner toggle",
  render: () => <Demo banner />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const topNav = canvas.getByRole("banner", { name: "Top navigation" });
    const banner = () => canvas.queryByRole("region", { name: "Banner" });
    await expect(banner()).toBeInTheDocument();
    await waitFor(() => expect(topNav.getBoundingClientRect().top).toBe(48));
    await userEvent.click(canvas.getByRole("button", { name: "Drop the banner" }));
    await waitFor(() => {
      expect(banner()).not.toBeInTheDocument();
      expect(topNav.getBoundingClientRect().top).toBe(0);
    });
    await userEvent.click(canvas.getByRole("button", { name: "Raise a banner" }));
    await waitFor(() => {
      const region = banner();
      expect(region).toBeInTheDocument();
      expect(region?.getBoundingClientRect().height).toBe(48);
      expect(topNav.getBoundingClientRect().top).toBe(48);
    });
  },
};

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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    if (!window.matchMedia("(min-width: 64rem)").matches) return;
    const sideNav = () => canvas.queryByRole("navigation", { name: "Side navigation" });
    // Start expanded, whatever the last run left in storage.
    const expand = canvas.queryByRole("button", { name: "Expand side navigation" });
    if (expand) await userEvent.click(expand);
    await waitFor(() => expect(sideNav()).toBeVisible());
    await userEvent.click(canvas.getByRole("button", { name: "Collapse side navigation" }));
    await waitFor(() => expect(sideNav()).not.toBeInTheDocument());
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(storyKey) ?? "{}").collapsed).toBe(true),
    );
    // The flyout still shows while the browser remembers the side nav collapsed.
    const toggle = canvas.getByRole("button", { name: "Expand side navigation" });
    await userEvent.hover(toggle);
    await waitFor(() => expect(sideNav()).toBeVisible());
    await userEvent.unhover(toggle);
    await waitFor(() => expect(sideNav()).not.toBeInTheDocument());
    // Leave it as found.
    await userEvent.click(toggle);
    await waitFor(() => expect(sideNav()).toBeVisible());
    localStorage.removeItem(storyKey);
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
              description="Compliance lead"
              onClick={() => undefined}
            />
          </Box>
        </Inline>
      </Specimens>
      <Specimens title="Top nav end items, a named group of icon buttons">
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

/** A route composes its header, tabs and supporting context inside the persistent shell. */
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
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </Shell.TopNav.Middle>
        <Shell.TopNav.End overflow={<EndOverflow />}>
          <EndItems />
        </Shell.TopNav.End>
      </Shell.TopNav>
      <Shell.SideNav>
        <Shell.SideNav.Body>
          <Nav />
        </Shell.SideNav.Body>
      </Shell.SideNav>
      <Shell.Main>
        <Stack space="space.200" className="min-w-0">
          <PageHeader>
            <PageHeader.Lead render={<Breadcrumb />}>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    <Id>{"PRG-014"}</Id>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </PageHeader.Lead>
            <PageHeader.Heading>
              <PageHeader.Title>{"Payload integration"}</PageHeader.Title>
              <div className="pt-050 flex flex-wrap items-center gap-100 font-body-small text-subtle">
                {"Authorise · Sarah Chen"}
              </div>
            </PageHeader.Heading>
            <PageHeader.Actions>
              <>
                <Button>Export</Button>
                <Button variant="primary">Submit for assessment</Button>
              </>
            </PageHeader.Actions>
          </PageHeader>
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as typeof tab)}
            className="gap-150"
          >
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
            <TabsContent value={tab}>
              <Stack space="space.300" className="min-w-0 pt-200">
                <Section title={tab} count={tab === "Overview" ? undefined : 12}>
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
                </Section>
                <Section title="Gates" count={3}>
                  <Text color="color.text.subtle">
                    What this record still needs before it moves.
                  </Text>
                </Section>
              </Stack>
            </TabsContent>
            <Shell.Aside label="Record properties">
              {tab === "Overview" ? <Inspector groups={railGroups} /> : null}
            </Shell.Aside>
          </Tabs>
        </Stack>
      </Shell.Main>
    </Shell>
  );
}

/** Context occupies Aside; selected work occupies Panel; modal flows use Sheet. */
export const RecordRail: Story = { name: "Record rail", render: () => <RecordDemo /> };

/** The panel from its parts instead of `title` and `actions`: the header, the title at another level, the actions, the close, the body, the splitter with a name of its own. Without a title, the landmark's name is its `label`. */
function ComposedPanelDemo({ titled = true }: { titled?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <Shell>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.SideNav.ToggleButton />
          <Shell.AppLogo name="Equinox" render={<a href="#home" aria-label="Equinox home" />} />
        </Shell.TopNav.Start>
        <Shell.TopNav.Middle>
          <Button onClick={() => setOpen(true)}>Open the panel</Button>
        </Shell.TopNav.Middle>
      </Shell.TopNav>
      <Shell.SideNav>
        <Shell.SideNav.Body>
          <Nav />
        </Shell.SideNav.Body>
      </Shell.SideNav>
      <Shell.Main>
        <Stack space="space.300">
          <PageHeader>
            <PageHeader.Heading>
              <PageHeader.Title>Programs</PageHeader.Title>
            </PageHeader.Heading>
          </PageHeader>
          <Section title="In flight" count={programs.length}>
            <Text color="color.text.subtle">
              The page's h2, so the panel's h3 follows in order.
            </Text>
          </Section>
        </Stack>
      </Shell.Main>
      {open ? (
        <Shell.Panel label="Preview" onClose={() => setOpen(false)} className="bg-surface-sunken">
          <Shell.Panel.Splitter label="Resize preview" />
          <Shell.Panel.Header className="bg-surface-sunken">
            {titled ? (
              <>
                <Shell.Panel.Title render={<h3 />}>PRG-014 · Payload integration</Shell.Panel.Title>
                <Shell.Panel.Actions>
                  <IconButton
                    label="Previous"
                    variant="subtle"
                    size="small"
                    icon={<ChevronLeft />}
                  />
                  <IconButton label="Next" variant="subtle" size="small" icon={<ChevronRight />} />
                </Shell.Panel.Actions>
              </>
            ) : null}
            <Shell.Panel.Close label="Close preview" />
          </Shell.Panel.Header>
          <Shell.Panel.Body className="p-300">
            <Text color="color.text.subtle">
              The body's padding, the header's surface, the heading's level and the labels are the
              route's here.
            </Text>
          </Shell.Panel.Body>
        </Shell.Panel>
      ) : null}
    </Shell>
  );
}

export const ComposedPanel: Story = {
  name: "Composed panel",
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <ComposedPanelDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = "PRG-014 · Payload integration";
    const panel = await canvas.findByRole("complementary", { name });
    await expect(within(panel).getByRole("heading", { level: 3 })).toBeVisible();
    await expect(
      within(panel).getByRole("separator", { name: "Resize preview" }),
    ).toBeInTheDocument();
    await expect(within(panel).getByRole("button", { name: "Next" })).toBeVisible();
    const opener = canvas.getByRole("button", { name: "Open the panel" });
    await userEvent.click(within(panel).getByRole("button", { name: "Close preview" }));
    await waitFor(() =>
      expect(canvas.queryByRole("complementary", { name })).not.toBeInTheDocument(),
    );
    await userEvent.click(opener);
    await canvas.findByRole("complementary", { name });
  },
};

/** The parts without a title: the landmark is named by `label`, not by a heading. */
export const LabelledPanel: Story = {
  name: "Labelled panel",
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <ComposedPanelDemo titled={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByRole("complementary", { name: "Preview" });
    await expect(panel).toHaveAttribute("aria-label", "Preview");
    await expect(panel).not.toHaveAttribute("aria-labelledby");
    await expect(within(panel).queryByRole("heading")).toBeNull();
    await expect(within(panel).getByRole("button", { name: "Close preview" })).toBeVisible();
  },
};

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

/** Every part forwards its native props and its ref: an area takes a data attribute, the toggle a ref, the profile is a menu's trigger through render. */
export const Forwarding: Story = {
  render: () => <ForwardingExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("main", { name: "Account content" })).toHaveAttribute(
      "id",
      "account-content",
    );
    await expect(canvas.getByRole("banner", { name: "Top navigation" })).toHaveAttribute(
      "data-testid",
      "nav",
    );
    // The end slot's children as given: the mode switch's three buttons and three icon buttons, no list around them.
    const actions = canvas.getByRole("group", { name: "Actions" });
    await expect(within(actions).getAllByRole("button")).toHaveLength(6);
    await expect(actions.querySelector("li")).toBeNull();
    await expect(canvas.getByText("Toggle is a button")).toBeVisible();
    const profile = canvas.getByRole("button", { name: /Sarah Chen/ });
    await userEvent.click(profile);
    await within(canvasElement.ownerDocument.body).findByRole("menuitem", { name: "Sign out" });
    await waitFor(() => expect(profile).toHaveAttribute("aria-expanded", "true"));
    await userEvent.keyboard("{Escape}");
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
  const [toggleIsButton, setToggleIsButton] = useState(false);
  const rootRef = useRef<HTMLAnchorElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  return (
    <Stack>
      <Shell.TopNav data-testid="nav">
        <Shell.TopNav.Start>
          <Shell.SideNav.ToggleButton
            ref={(node) => setToggleIsButton(node instanceof HTMLButtonElement)}
          />
          <Shell.AppLogo name="Equinox" />
        </Shell.TopNav.Start>
        <Shell.TopNav.End overflow={<EndOverflow />}>
          <EndItems />
        </Shell.TopNav.End>
      </Shell.TopNav>
      <Text>{toggleIsButton ? "Toggle is a button" : "Toggle is not a button"}</Text>
      <Box className="w-layout-sidenav">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Shell.Profile
                avatar={
                  <Avatar
                    size="small"
                    role="img"
                    aria-label="Sarah Chen"
                    hue={avatarHue("Sarah Chen")}
                  >
                    <AvatarFallback>{avatarInitials("Sarah Chen", 2)}</AvatarFallback>
                  </Avatar>
                }
                name="Sarah Chen"
                description="Compliance lead"
              />
            }
          />
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Box>
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

/** A desktop panel responds to its own width, independently of the viewport. */
function PanelHeaderWidthDemo({
  width,
  composed = false,
  withNavigation = true,
  bodyHeader = false,
}: {
  width: number;
  composed?: boolean;
  withNavigation?: boolean;
  bodyHeader?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(1);
  const title = `AC Enforcement Requirement ${String(position).padStart(3, "0")}`;
  const navigation = (
    <PreviewNavigation
      position={position}
      total={3}
      onPrevious={position > 1 ? () => setPosition((value) => value - 1) : undefined}
      onNext={position < 3 ? () => setPosition((value) => value + 1) : undefined}
      openLink={<a href={`#requirement-${position}`} target="_blank" rel="noopener noreferrer" />}
    />
  );
  return (
    <Shell>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Text>Program Assurance</Text>
        </Shell.TopNav.Start>
      </Shell.TopNav>
      <Shell.Main>
        <Stack space="space.200">
          <PageHeader>
            <PageHeader.Heading>
              <PageHeader.Title>Requirements</PageHeader.Title>
            </PageHeader.Heading>
          </PageHeader>
          <Section title="Records">
            <Button onClick={() => setOpen(true)}>Open preview</Button>
          </Section>
        </Stack>
      </Shell.Main>
      {open &&
        (composed || bodyHeader ? (
          <Shell.Panel
            label={bodyHeader ? "Record preview" : undefined}
            defaultWidth={width}
            onClose={() => setOpen(false)}
          >
            <Shell.Panel.Splitter />
            <Shell.Panel.Header data-testid="composed-header">
              {!bodyHeader && (
                <Shell.Panel.Title render={<h3 data-testid="composed-title" />}>
                  {title}
                </Shell.Panel.Title>
              )}
              <Shell.Panel.Actions data-testid="composed-actions">{navigation}</Shell.Panel.Actions>
              <Shell.Panel.Close data-testid="composed-close" />
            </Shell.Panel.Header>
            <Shell.Panel.Body>
              {bodyHeader ? (
                <PageHeader>
                  <PageHeader.Heading>
                    <h2 className="font-heading-small">{title}</h2>
                  </PageHeader.Heading>
                  <PageHeader.Actions>
                    <Button size="small" variant="primary">
                      Edit engineering requirement
                    </Button>
                    <IconButton
                      label="More system actions"
                      icon={<MoreHorizontal />}
                      size="small"
                      variant="subtle"
                    />
                  </PageHeader.Actions>
                </PageHeader>
              ) : (
                <Text>The selected requirement's details.</Text>
              )}
            </Shell.Panel.Body>
          </Shell.Panel>
        ) : (
          <Shell.Panel
            title={title}
            actions={withNavigation ? navigation : undefined}
            defaultWidth={width}
            onClose={() => setOpen(false)}
          >
            <Text>The selected requirement's details.</Text>
          </Shell.Panel>
        ))}
    </Shell>
  );
}

async function checkPanelHeaderWidth(canvasElement: HTMLElement, width: number, composed = false) {
  const canvas = within(canvasElement);
  const opener = canvas.getByRole("button", { name: "Open preview" });
  await userEvent.click(opener);
  const panel = await canvas.findByRole("complementary", {
    name: "AC Enforcement Requirement 001",
  });
  const content = within(panel);
  const heading = content.getByRole("heading", { name: "AC Enforcement Requirement 001" });
  const header = heading.closest('[data-slot="shell-panel-header"]') as HTMLElement;
  const actions = header.querySelector('[data-slot="shell-panel-actions"]') as HTMLElement;
  const close = content.getByRole("button", { name: "Close details" });
  await waitFor(() => {
    const titleBox = heading.getBoundingClientRect();
    const actionBox = actions.getBoundingClientRect();
    const closeBox = close.getBoundingClientRect();
    expect(Math.abs(panel.getBoundingClientRect().width - width)).toBeLessThanOrEqual(1);
    expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
    expect(actionBox.right).toBeLessThanOrEqual(closeBox.left);
    expect(
      Math.abs((actionBox.top + actionBox.bottom) / 2 - (closeBox.top + closeBox.bottom) / 2),
    ).toBeLessThanOrEqual(1);
    if (width < 400) {
      expect(titleBox.width).toBeGreaterThanOrEqual(width - 36);
      expect(titleBox.bottom).toBeLessThanOrEqual(actionBox.top);
      expect(titleBox.height).toBeLessThanOrEqual(
        parseFloat(getComputedStyle(heading).lineHeight) * 3,
      );
    } else {
      expect(titleBox.right).toBeLessThanOrEqual(actionBox.left);
      expect(
        Math.abs((titleBox.top + titleBox.bottom) / 2 - (closeBox.top + closeBox.bottom) / 2),
      ).toBeLessThanOrEqual(1);
      expect(header.getBoundingClientRect().height).toBe(48);
    }
  });
  if (composed) {
    await expect(content.getByTestId("composed-header")).toBe(header);
    await expect(content.getByTestId("composed-title")).toBe(heading);
    await expect(heading.tagName).toBe("H3");
    await expect(content.getByTestId("composed-actions")).toBe(actions);
    await expect(content.getByTestId("composed-close")).toBe(close);
  }
  const next = content.getByRole("button", { name: "Next record" });
  await userEvent.click(next);
  await expect(content.getByRole("status")).toHaveTextContent("2 of 3 records");
  await expect(content.getByRole("link", { name: "Open full record in new tab" })).toHaveAttribute(
    "href",
    "#requirement-2",
  );
  await expect(next).toHaveFocus();
  await userEvent.click(close);
  await waitFor(() => expect(opener).toHaveFocus());
  await expect(canvas.queryByRole("complementary")).not.toBeInTheDocument();
  await userEvent.click(opener);
  const reopened = await canvas.findByRole("complementary", {
    name: "AC Enforcement Requirement 002",
  });
  reopened.focus();
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(opener).toHaveFocus());
  await expect(canvas.queryByRole("complementary")).not.toBeInTheDocument();
  await userEvent.click(opener);
}

export const HeaderAt240: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  name: "Panel header · 240px",
  render: () => <PanelHeaderWidthDemo width={240} />,
  play: ({ canvasElement }) => checkPanelHeaderWidth(canvasElement, 240),
};
export const HeaderAt320: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  name: "Panel header · 320px",
  render: () => <PanelHeaderWidthDemo width={320} />,
  play: ({ canvasElement }) => checkPanelHeaderWidth(canvasElement, 320),
};
export const HeaderAt640: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  name: "Panel header · 640px",
  render: () => <PanelHeaderWidthDemo width={640} />,
  play: ({ canvasElement }) => checkPanelHeaderWidth(canvasElement, 640),
};
export const ComposedHeaderAt240: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  name: "Composed panel header · 240px",
  render: () => <PanelHeaderWidthDemo width={240} composed />,
  play: ({ canvasElement }) => checkPanelHeaderWidth(canvasElement, 240, true),
};

export const TitleOnlyAt240: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  name: "Panel title and close · 240px",
  render: () => <PanelHeaderWidthDemo width={240} withNavigation={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole("button", { name: "Open preview" });
    await userEvent.click(opener);
    const panel = await canvas.findByRole("complementary", {
      name: "AC Enforcement Requirement 001",
    });
    const heading = within(panel).getByRole("heading", { name: "AC Enforcement Requirement 001" });
    const close = within(panel).getByRole("button", { name: "Close details" });
    const header = heading.closest('[data-slot="shell-panel-header"]') as HTMLElement;
    await expect(header.querySelector('[data-slot="shell-panel-actions"]')).toBeNull();
    await waitFor(() => {
      const titleBox = heading.getBoundingClientRect();
      const closeBox = close.getBoundingClientRect();
      expect(Math.abs(panel.getBoundingClientRect().width - 240)).toBeLessThanOrEqual(1);
      expect(titleBox.width).toBeGreaterThanOrEqual(160);
      expect(titleBox.right).toBeLessThanOrEqual(closeBox.left);
      expect(
        Math.abs((titleBox.top + titleBox.bottom) / 2 - (closeBox.top + closeBox.bottom) / 2),
      ).toBeLessThanOrEqual(1);
      expect(header.getBoundingClientRect().height).toBe(Math.max(48, titleBox.height + 17));
    });
    await userEvent.click(close);
    await waitFor(() => expect(opener).toHaveFocus());
    await userEvent.click(opener);
  },
};

async function checkPanelRecordHeaderWidth(canvasElement: HTMLElement, width: number) {
  const canvas = within(canvasElement);
  const opener = canvas.getByRole("button", { name: "Open preview" });
  await userEvent.click(opener);
  const panel = await canvas.findByRole("complementary", { name: "Record preview" });
  const heading = within(panel).getByRole("heading", { name: "AC Enforcement Requirement 001" });
  const header = heading.closest('[data-slot="page-header"]') as HTMLElement;
  const navigation = panel.querySelector('[data-slot="shell-panel-header"]') as HTMLElement;
  await expect(within(navigation).queryByRole("heading")).toBeNull();
  await expect(
    within(navigation).queryByRole("button", { name: "Edit engineering requirement" }),
  ).toBeNull();
  await expect(navigation.querySelector('[data-slot="preview-navigation"]')).not.toBeNull();
  await expect(within(navigation).getByRole("button", { name: "Close details" })).toBeVisible();
  await expect(navigation.getBoundingClientRect().height).toBe(48);

  const actions = header.querySelector('[data-slot="page-header-actions"]') as HTMLElement;
  for (const button of actions.querySelectorAll("button")) {
    await expect(getComputedStyle(button).whiteSpace).toBe("nowrap");
    await expect(button.getBoundingClientRect().height).toBe(28);
  }
  await waitFor(() => {
    const titleBox = heading.getBoundingClientRect();
    const actionBox = actions.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();
    expect(Math.abs(panelBox.width - width)).toBeLessThanOrEqual(1);
    expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth);
    expect(actionBox.right).toBeLessThanOrEqual(panelBox.right);
    if (width < 400) {
      expect(titleBox.width).toBeGreaterThanOrEqual(width - 36);
      expect(titleBox.bottom).toBeLessThanOrEqual(actionBox.top);
    } else {
      expect(titleBox.width).toBeGreaterThanOrEqual(100);
      expect(titleBox.right).toBeLessThanOrEqual(actionBox.left);
      expect(titleBox.top).toBe(actionBox.top);
    }
  });
  await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  await userEvent.click(within(panel).getByRole("button", { name: "Close details" }));
  await waitFor(() => expect(opener).toHaveFocus());
  await userEvent.click(opener);
}

export const BodyHeaderAt240: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  name: "Panel record header · 240px",
  render: () => <PanelHeaderWidthDemo width={240} bodyHeader />,
  play: ({ canvasElement }) => checkPanelRecordHeaderWidth(canvasElement, 240),
};
export const BodyHeaderAt340: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  name: "Panel record header · 340px",
  render: () => <PanelHeaderWidthDemo width={340} bodyHeader />,
  play: ({ canvasElement }) => checkPanelRecordHeaderWidth(canvasElement, 340),
};

const widthsStoryKey = `${SHELL_STORAGE_KEY}.widths-story`;

function ResizableShellDemo({
  persist,
  direction = "ltr",
}: {
  persist?: string;
  direction?: "ltr" | "rtl";
}) {
  const [panelOpen, setPanelOpen] = useState(true);
  return (
    <LedgerProvider direction={direction}>
      <Shell persist={persist}>
        <Shell.TopNav>
          <Shell.TopNav.Start>
            <Shell.SideNav.ToggleButton />
            <Shell.AppLogo name="Equinox" render={<a href="#home" />} />
          </Shell.TopNav.Start>
        </Shell.TopNav>
        <Shell.SideNav defaultWidth={320}>
          <Shell.SideNav.Body>
            <Shell.SideNav.Item href="#programs">Programs</Shell.SideNav.Item>
          </Shell.SideNav.Body>
          <Shell.SideNav.Splitter />
        </Shell.SideNav>
        <Shell.Main>
          <h1 className="font-heading-medium">Programs</h1>
          <Button onClick={() => setPanelOpen(true)}>Open details</Button>
        </Shell.Main>
        {panelOpen && (
          <Shell.Panel
            title="Program details"
            defaultWidth={480}
            onClose={() => setPanelOpen(false)}
          >
            Preferred widths return when there is room for the desktop layout.
          </Shell.Panel>
        )}
      </Shell>
    </LedgerProvider>
  );
}

/** Restoring on a phone preserves both preferred widths for the next desktop layout. */
export const PersistedWidths: Story = {
  parameters: {
    viewport: {
      options: {
        shellPhone390: { name: "Phone (390px)", styles: { width: "390px", height: "844px" } },
      },
    },
  },
  globals: { viewport: { value: "shellPhone390", isRotated: false } },
  beforeEach: () => {
    const previous = localStorage.getItem(widthsStoryKey);
    const root = document.documentElement;
    const nav = root.style.getPropertyValue("--shell-sidenav-stored");
    const panel = root.style.getPropertyValue("--shell-panel-stored");
    localStorage.setItem(
      widthsStoryKey,
      JSON.stringify({ collapsed: false, sideNavWidth: 320, panelWidth: 480 }),
    );
    return () => {
      if (previous === null) localStorage.removeItem(widthsStoryKey);
      else localStorage.setItem(widthsStoryKey, previous);
      root.style.setProperty("--shell-sidenav-stored", nav);
      root.style.setProperty("--shell-panel-stored", panel);
    };
  },
  render: () => <ResizableShellDemo persist={widthsStoryKey} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stored = () => JSON.parse(localStorage.getItem(widthsStoryKey) ?? "{}");
    await waitFor(() => expect(stored()).toMatchObject({ sideNavWidth: 320, panelWidth: 480 }));
    const toggle = canvas.getByRole("button", { name: "Expand side navigation" });
    await userEvent.click(toggle);
    const nav = await canvas.findByRole("navigation", { name: "Side navigation" });
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(320));
    await userEvent.click(canvas.getByRole("button", { name: "Close side navigation" }));
    if (import.meta.env.MODE !== "test" || !("__vitest_browser__" in globalThis)) return;
    const { page } = await import("vitest/browser");
    try {
      await page.viewport(1440, 900);
      await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(320));
      const panel = canvas.getByRole("complementary", { name: "Program details" });
      await waitFor(() => expect(panel.getBoundingClientRect().width).toBe(480));
      const navSplitter = canvas.getByRole("separator", { name: "Resize side navigation" });
      navSplitter.focus();
      await userEvent.keyboard("{End}");
      const panelSplitter = canvas.getByRole("separator", { name: "Resize details" });
      panelSplitter.focus();
      await userEvent.keyboard("{End}");
      await waitFor(() => expect(stored()).toMatchObject({ sideNavWidth: 720, panelWidth: 720 }));
      await page.viewport(1280, 900);
      await waitFor(() => {
        expect(nav.getBoundingClientRect().width).toBe(640);
        expect(panel.getBoundingClientRect().width).toBe(640);
      });
      await expect(stored()).toMatchObject({ sideNavWidth: 720, panelWidth: 720 });
      await page.viewport(1440, 900);
      await waitFor(() => {
        expect(nav.getBoundingClientRect().width).toBe(720);
        expect(panel.getBoundingClientRect().width).toBe(720);
      });
    } finally {
      await page.viewport(390, 844);
    }
  },
};

/** Both logical edges follow the physical pointer and arrow keys in RTL. */
export const RightToLeftSplitters: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <ResizableShellDemo direction="rtl" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cases = [
      {
        area: canvas.getByRole("navigation", { name: "Side navigation" }),
        label: "Resize side navigation",
        initial: 320,
        sign: -1,
      },
      {
        area: await canvas.findByRole("complementary", { name: "Program details" }),
        label: "Resize details",
        initial: 480,
        sign: 1,
      },
    ];
    for (const { area, label, initial, sign } of cases) {
      const splitter = canvas.getByRole("separator", { name: label });
      await waitFor(() => expect(area.getBoundingClientRect().width).toBe(initial));
      splitter.focus();
      await userEvent.keyboard(sign === 1 ? "{ArrowRight}" : "{ArrowLeft}");
      await waitFor(() => expect(area.getBoundingClientRect().width).toBe(initial + 16));
      const box = splitter.getBoundingClientRect();
      const start = { clientX: box.x + box.width / 2, clientY: box.y + 100 };
      const end = { ...start, clientX: start.clientX + sign * 32 };
      await userEvent.pointer([
        { target: splitter, keys: "[MouseLeft>]", coords: start },
        { target: splitter, coords: end },
        { target: splitter, keys: "[/MouseLeft]", coords: end },
      ]);
      await waitFor(() => expect(area.getBoundingClientRect().width).toBe(initial + 48));
      splitter.focus();
      await userEvent.keyboard(sign === 1 ? "{ArrowLeft}" : "{ArrowRight}");
      await waitFor(() => expect(area.getBoundingClientRect().width).toBe(initial + 32));
    }
  },
};

/** On a phone the rail follows the page and starts where the page's content ends, not a screen down; the end items are one menu. */
export const RecordRailPhone: Story = {
  name: "Record rail at 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  tags: ["narrow"],
  render: () => <RecordDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const main = canvas.getByRole("main");
    const aside = canvas.getByRole("complementary", { name: "Record properties" });
    const contentBottom = Math.max(
      ...Array.from(main.querySelectorAll("*")).map((el) => el.getBoundingClientRect().bottom),
    );
    await expect(aside.getBoundingClientRect().top - contentBottom).toBeLessThan(64);
    await expect(canvas.getByRole("button", { name: "More" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Help" })).toBeNull();
  },
};
