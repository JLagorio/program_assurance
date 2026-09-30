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
  FileCheck2,
  FlaskConical,
  Gauge,
  Library,
  MoreHorizontal,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  DataTable,
  defineColumns,
  Id,
  Inspector,
  LedgerProvider,
  PageHeader,
  PreviewNavigation,
  SearchDialog,
  Section,
  Shell,
  SHELL_STORAGE_KEY,
  shellScript,
  shellScriptFor,
  Stack,
  Tabs,
  TabsContent,
  tokenValue,
  Toolbar,
  useDataTable,
  useSideNav,
  type SearchResult,
  type SideNavChange,
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
  getModifierKey,
  IconButton,
  Input,
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

/** The end items: the colour mode, which stays in the row at every width, and three TopNav.Items. In an End without `overflow` the items fold into More when the top nav is narrower than 48rem; in an End with `overflow`, the older spelling, they stay and `overflow` stands in for all of them below `md`. */
function EndItems() {
  return (
    <>
      <ModeSwitch />
      <Shell.TopNav.Item icon={<CircleHelp />} label="Help" onClick={() => undefined} />
      <Shell.TopNav.Item icon={<Bell />} label="Notifications" onClick={() => undefined} />
      <Shell.TopNav.Item icon={<Settings />} label="Settings" onClick={() => undefined} />
    </>
  );
}

/** What the top nav's search finds: the programs on the page, each known by its identifier. */
const searchRecords: SearchResult[] = programs.map((p) => ({
  id: `program-${p.id.toLowerCase()}`,
  identifier: p.id,
  title: p.title ?? p.id,
  meta: p.phase,
  group: "Programs",
}));

/** The top nav's search: Shell.TopNav.Search opens a SearchDialog over the page's records, from a press on the field (a top nav at least 48rem wide) or the icon (narrower), and from ⌘K or Ctrl+K. */
function RecordSearch({
  label = "Search records",
  shortcut,
}: {
  label?: string | undefined;
  shortcut?: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Shell.TopNav.Search label={label} shortcut={shortcut} onOpen={() => setOpen(true)} />
      <SearchDialog
        open={open}
        onOpenChange={setOpen}
        results={searchRecords}
        onSelect={() => undefined}
        placeholder="Search programs by name or identifier"
      />
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
          <RecordSearch />
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
              <Avatar size="small" hue={avatarHue("Sarah Chen")}>
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
    // A top nav at least 48rem wide shows the search as a field with its shortcut; narrower, the
    // icon button. Either is one button named "Search records" that opens the dialog.
    const topNav = within(canvasElement).getByRole("banner", { name: "Top navigation" });

    const search = within(topNav).getByRole("button", { name: "Search records" });
    await expect(search).toHaveAttribute("aria-haspopup", "dialog");
    await expect(search).toHaveAttribute(
      "aria-keyshortcuts",
      getModifierKey() === "meta" ? "Meta+K" : "Control+K",
    );
    const wide = topNav.getBoundingClientRect().width >= 768;
    await expect(search).toHaveAttribute(
      "data-shell-slot",
      wide ? "topnav-search-field" : "topnav-search-button",
    );
    // The profile is named by the person, not their initials as well; a button that runs an
    // action has no menu chevron.
    const profile = canvasElement.querySelector<HTMLElement>('[data-slot="shell-profile"]');
    if (profile && profile.getClientRects().length > 0) {
      await expect(profile).toHaveAccessibleName("Sarah Chen Compliance lead");
      await expect(profile.querySelector('[data-slot="shell-sidenav-chevron"]')).toBeNull();
    }
    // The splitter resizes the side nav where it is a column beside the page, from `lg`; below
    // `lg` the side nav is an overlay the toggle opens, and there is nothing to resize.
    if (!window.matchMedia("(min-width: 64rem)").matches) {
      await expect(
        within(canvasElement).queryByRole("separator", { name: "Resize side navigation" }),
      ).toBeNull();
      return;
    }
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
    // The separator names the area it resizes, and Enter collapses the side nav, as a double-click
    // does; focus goes to the toggle, which brings it back.
    const nav = within(canvasElement).getByRole("navigation", { name: "Side navigation" });
    await expect(splitter).toHaveAttribute("aria-controls", nav.id);
    await userEvent.keyboard("{Enter}");
    const toggle = within(canvasElement).getByRole("button", { name: "Expand side navigation" });
    await waitFor(() => expect(toggle).toHaveFocus());
    await userEvent.click(toggle);
    await within(canvasElement).findByRole("separator", { name: "Resize side navigation" });
  },
};

/** Below a 48rem top nav the search is an icon button that opens the SearchDialog, and from 48rem the field shows. At 320px the row holds the toggle, the switcher, the mark, Search, Create and More, none over another; ⌘K (Ctrl+K elsewhere) opens the same dialog, and focus returns to the button. */
export const NarrowSearch: Story = {
  name: "Search at 320px",
  globals: { viewport: { value: "ledgerNarrow", isRotated: false } },
  tags: ["narrow"],
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(window.innerWidth).toBe(320));
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
    const topNav = canvas.getByRole("banner", { name: "Top navigation" });
    await expect(within(topNav).queryByRole("searchbox")).toBeNull();
    const search = within(topNav).getByRole("button", { name: "Search records" });
    await expect(search).toHaveAttribute("aria-haspopup", "dialog");
    const create = within(topNav).getByRole("button", { name: "Create" });
    const more = within(topNav).getByRole("button", { name: "More" });
    const [s, c, m] = [search, create, more].map((el) => el.getBoundingClientRect());
    await expect(s!.right).toBeLessThanOrEqual(c!.left);
    await expect(c!.right).toBeLessThanOrEqual(m!.left);
    await expect(m!.right).toBeLessThanOrEqual(window.innerWidth);
    await expect(topNav.scrollWidth).toBeLessThanOrEqual(topNav.clientWidth);

    await userEvent.click(search);
    const dialog = await body.findByRole("dialog", { name: "Search" });
    const input = within(dialog).getByRole("combobox", { name: "Search" });
    await waitFor(() => expect(input).toHaveFocus());
    await userEvent.type(input, "PRG-006");
    const option = await within(dialog).findByRole("option");
    await expect(option).toHaveTextContent("PRG-006");
    await expect(option).toHaveTextContent("Payload integration");
    await expect(input).toHaveAttribute("aria-activedescendant", option.id);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(search).toHaveFocus());

    const mod = getModifierKey() === "meta" ? "Meta" : "Control";
    await userEvent.keyboard(`{${mod}>}k{/${mod}}`);
    await body.findByRole("dialog", { name: "Search" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/** A top nav in a frame the play narrows, as an open panel narrows the row. The end items are the colour mode and three TopNav.Items; Settings is a destination. */
function FoldDemo() {
  const [opened, setOpened] = useState("");
  return (
    <Stack space="space.200">
      <div data-testid="fold-frame" className="w-full rounded-medium border border-default">
        <Shell.TopNav>
          <Shell.TopNav.Start>
            <Shell.AppLogo name="Equinox" render={<a href="#home" aria-label="Equinox home" />} />
          </Shell.TopNav.Start>
          <Shell.TopNav.Middle>
            <RecordSearch />
          </Shell.TopNav.Middle>
          <Shell.TopNav.End>
            <ModeSwitch />
            {/* A menu's trigger stays in the row: its menu anchors to the button. */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Shell.TopNav.Item persistent icon={<Bell />} label="Notifications" />}
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setOpened("Notifications")}>
                  Mark all as read
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Shell.TopNav.Item
              icon={<CircleHelp />}
              label="Help"
              onClick={() => setOpened("Help")}
            />
            <Shell.TopNav.Item
              icon={<Library />}
              label="Library"
              disabledReason="The library is being rebuilt."
            />
            <Shell.TopNav.Item icon={<Settings />} label="Settings" href="#settings" />
          </Shell.TopNav.End>
        </Shell.TopNav>
      </div>
      <Text color="color.text.subtle">{opened ? `Opened ${opened}.` : "Nothing opened yet."}</Text>
    </Stack>
  );
}

/** TopNav.End folds its TopNav.Items into one More menu when the top nav is narrower than 48rem, measured on the row itself, so a panel beside it folds them too; the colour mode, a plain child, and Notifications, a `persistent` item that is a menu's trigger, stay. More lists the items in the row's order, with their icons and names; a destination stays a link and an unavailable item still says why. Narrowed while an item or the search field has focus, focus moves to More (not to the persistent item before it) or to the search's icon instead of dropping to the page, and back to the first item that left when widened. */
export const EndItemsFold: Story = {
  name: "End items fold",
  parameters: { layout: "padded" },
  // Wide, so the play starts with the items in the row and narrows the frame itself.
  globals: { viewport: { value: "ledgerWide", isRotated: false }, frame: "canvas" },
  render: () => <FoldDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const frame = canvas.getByTestId("fold-frame");
    const topNav = canvas.getByRole("banner", { name: "Top navigation" });
    const actions = within(topNav).getByRole("group", { name: "Actions" });
    const narrow = async () => {
      frame.style.maxWidth = "560px";
      await waitFor(() => expect(topNav.getBoundingClientRect().width).toBeLessThan(768));
    };
    await waitFor(() => expect(topNav.getBoundingClientRect().width).toBeGreaterThanOrEqual(768));
    // Wide: every item in the row, and no More.
    const help = within(actions).getByRole("button", { name: "Help" });
    await expect(within(actions).getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "#settings",
    );
    await expect(within(actions).queryByRole("button", { name: "More" })).toBeNull();
    help.focus();
    await narrow();
    await waitFor(() =>
      expect(within(actions).getByRole("button", { name: "More" })).toHaveFocus(),
    );
    frame.style.maxWidth = "";
    await waitFor(() =>
      expect(within(actions).getByRole("button", { name: "Help" })).toHaveFocus(),
    );
    within(topNav).getByRole("button", { name: "Search records" }).focus();
    await narrow();
    await waitFor(() => {
      const icon = within(topNav).getByRole("button", { name: "Search records" });
      expect(icon).toHaveAttribute("data-shell-slot", "topnav-search-button");
      expect(icon).toHaveFocus();
    });
    // Narrow: the colour mode and the persistent trigger stay; the other items are More's rows, in
    // the row's order.
    await expect(within(actions).getByRole("group", { name: "Appearance" })).toBeVisible();
    const notifications = within(actions).getByRole("button", { name: "Notifications" });
    await expect(notifications).toBeVisible();
    // The trigger's props reach the item's button.
    await expect(notifications).toHaveAttribute("aria-haspopup", "menu");
    await expect(within(actions).queryByRole("button", { name: "Help" })).toBeNull();
    await expect(within(actions).queryByRole("link", { name: "Settings" })).toBeNull();
    await expect(topNav.scrollWidth).toBeLessThanOrEqual(topNav.clientWidth);
    const more = within(actions).getByRole("button", { name: "More" });
    await userEvent.click(more);
    const menu = await body.findByRole("menu");
    await waitFor(() => expect(more).toHaveAttribute("aria-expanded", "true"));

    await expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["Help", expect.stringMatching(/^Library/), "Settings"]);
    const library = within(menu).getByRole("menuitem", { name: "Library" });
    await expect(library).toHaveAttribute("aria-disabled", "true");
    await expect(library).toHaveAccessibleDescription("The library is being rebuilt.");
    await expect(within(menu).getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
      "href",
      "#settings",
    );
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Help" }));
    await expect(canvas.getByText("Opened Help.")).toBeVisible();
    await waitFor(() => expect(more).toHaveFocus());

    // The persistent item is a working trigger at the narrow width.
    await userEvent.click(notifications);
    const notices = await body.findByRole("menu");
    await userEvent.click(within(notices).getByRole("menuitem", { name: "Mark all as read" }));
    await expect(canvas.getByText("Opened Notifications.")).toBeVisible();
    await waitFor(() => expect(notifications).toHaveFocus());
  },
};

/** ⌘K on Apple platforms, Ctrl+K elsewhere, opens the search from anywhere on the page, and the field shows the keys. The shortcut ignores a held key's repeats, other modifiers, text still being composed and a key a control already handled, and does nothing while a dialog is open, so it never stacks a second dialog or closes the one the reader is in. */
export const SearchShortcut: Story = {
  name: "Search shortcut",
  render: () => <Demo dialog />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const mod = getModifierKey() === "meta" ? "Meta" : "Control";
    // A held key's repeat, a key that ends an input method's composition and a key a control
    // inside the page already handled do not open the search.
    const press = (init: KeyboardEventInit, target: EventTarget = document.body) =>
      target.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          code: "KeyK",
          bubbles: true,
          cancelable: true,
          ...(mod === "Meta" ? { metaKey: true } : { ctrlKey: true }),
          ...init,
        }),
      );
    press({ repeat: true });
    press({ isComposing: true });
    canvasElement.addEventListener("keydown", (event) => event.preventDefault(), { once: true });
    press({}, canvasElement);
    await userEvent.keyboard(`{${mod}>}{Shift>}k{/Shift}{/${mod}}`);
    // Give a wrongly opened dialog time to render before saying there is none.
    await new Promise((resolve) => setTimeout(resolve, 150));
    await expect(body.queryByRole("dialog")).toBeNull();
    await userEvent.keyboard(`{${mod}>}k{/${mod}}`);
    const dialog = await body.findByRole("dialog", { name: "Search" });
    await waitFor(() =>
      expect(within(dialog).getByRole("combobox", { name: "Search" })).toHaveFocus(),
    );
    // Pressed again inside the open dialog: still one dialog, still open.
    await userEvent.keyboard(`{${mod}>}k{/${mod}}`);
    await expect(body.getAllByRole("dialog")).toHaveLength(1);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    // Over another dialog it does nothing.
    await userEvent.click(canvas.getByRole("button", { name: "Archive the program" }));
    await body.findByRole("dialog", { name: "Archive the program" });
    await userEvent.keyboard(`{${mod}>}k{/${mod}}`);
    await expect(body.queryByRole("dialog", { name: "Search" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/** A banner above everything and a panel beside the page. Both push the layout; neither covers it. The banner spans the whole width; the panel runs the rest of the window's height beside the top nav, which stops at its edge, and its header sits level with the top nav. */
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
    const header = panel.querySelector<HTMLElement>('[data-slot="shell-panel-header"]')!;
    if (!window.matchMedia("(min-width: 80rem)").matches) return;
    await waitFor(() => {
      const box = panel.getBoundingClientRect();
      const bannerBox = banner.getBoundingClientRect();
      const topNavBox = topNav.getBoundingClientRect();
      const headerBox = header.getBoundingClientRect();
      expect(bannerBox.top).toBe(0);
      expect(Math.abs(bannerBox.right - box.right)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.top - bannerBox.bottom)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.bottom - window.innerHeight)).toBeLessThanOrEqual(1);
      expect(topNavBox.right).toBeLessThanOrEqual(box.left + 1);
      // The two header rules meet: the panel's header is the top nav's row, beside it.
      expect(Math.abs(headerBox.top - topNavBox.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(headerBox.bottom - topNavBox.bottom)).toBeLessThanOrEqual(1);
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

/** Visually hidden links come first in the tab order, one per area; each moves focus to its area. The side nav's link is there only while the side nav shows beside the page (inline or as the icon rail): on a phone, or collapsed to hidden, there is no side nav to skip to. */
export const SkipLinks: Story = {
  name: "Skip links",
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const nav = canvas.getByRole("navigation", { name: /skip to/i });
    const desktop = window.matchMedia("(min-width: 64rem)").matches;
    await expect(within(nav).getAllByRole("link")).toHaveLength(desktop ? 3 : 2);
    const sideNavLink = () => within(nav).queryByRole("link", { name: /skip to side navigation/i });
    if (desktop) {
      await expect(sideNavLink()).toBeInTheDocument();
      // Collapsed to hidden, the side nav's link goes with it, and comes back on expand.
      await userEvent.click(canvas.getByRole("button", { name: "Hide the side nav" }));
      await waitFor(() => expect(sideNavLink()).toBeNull());
      await userEvent.click(canvas.getByRole("button", { name: "Show the side nav" }));
      await waitFor(() => expect(sideNavLink()).toBeInTheDocument());
    } else {
      await expect(sideNavLink()).toBeNull();
    }
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
    // One 48px line on a wide bar; on a phone the message wraps and the bar is taller.
    const wide = window.matchMedia("(min-width: 42rem)").matches;
    const height = () => banner()?.getBoundingClientRect().height ?? 0;
    await expect(banner()).toBeInTheDocument();
    await waitFor(() => expect(topNav.getBoundingClientRect().top).toBe(height()));
    if (wide) await expect(height()).toBe(48);
    await userEvent.click(canvas.getByRole("button", { name: "Drop the banner" }));
    await waitFor(() => {
      expect(banner()).not.toBeInTheDocument();
      expect(topNav.getBoundingClientRect().top).toBe(0);
    });
    await userEvent.click(canvas.getByRole("button", { name: "Raise a banner" }));
    await waitFor(() => {
      expect(banner()).toBeInTheDocument();
      if (wide) expect(height()).toBe(48);
      else expect(height()).toBeGreaterThanOrEqual(48);
      expect(topNav.getBoundingClientRect().top).toBe(height());
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
        <Inline space="space.500" rowSpace="space.200" alignBlock="center" shouldWrap>
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
        <Inline space="space.400" rowSpace="space.200" alignBlock="center" shouldWrap>
          <Shell.SideNav.ToggleButton />
          <Shell.AppSwitcher />
          <Box className="w-layout-sidenav max-w-full">
            <Shell.Profile
              avatar={
                <Avatar size="small" hue={avatarHue("Sarah Chen")}>
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
          <RecordSearch shortcut={null} />
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
    // The end slot's children as given: the mode switch's three buttons and three icon buttons, no
    // list around them. Below `md` its overflow replaces them with one menu button.
    const actions = canvas.getByRole("group", { name: "Actions" });
    const wide = window.matchMedia("(min-width: 48rem)").matches;
    await expect(within(actions).getAllByRole("button")).toHaveLength(wide ? 6 : 1);
    await expect(actions.querySelector("li")).toBeNull();
    await expect(canvas.getByText("Toggle is a button")).toBeVisible();
    const profile = canvas.getByRole("button", { name: /Sarah Chen/ });
    // A menu's trigger: named by the person alone, with the chevron that says it opens a menu.
    await expect(profile).toHaveAccessibleName("Sarah Chen Compliance lead");
    await expect(profile).toHaveAttribute("aria-haspopup", "menu");
    await expect(profile.querySelector('[data-slot="shell-sidenav-chevron"]')).not.toBeNull();
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
                  <Avatar size="small" hue={avatarHue("Sarah Chen")}>
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
    // The panel's scroll padding is the sticky header's height, however it wraps, and a gap.
    expect(parseFloat(getComputedStyle(panel).scrollPaddingBlockStart)).toBe(
      Math.round(header.getBoundingClientRect().height) + 16,
    );
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
  // Close is named after the panel's label.
  await expect(
    within(navigation).getByRole("button", { name: "Close Record preview" }),
  ).toBeVisible();
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
  await userEvent.click(within(panel).getByRole("button", { name: "Close Record preview" }));
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

/** Main's reserved minimum: one list column inside Main's desktop gutters, from the tokens. */
const mainMinimum = () =>
  Number.parseFloat(tokenValue("dimension.layout.list")) +
  2 * Number.parseFloat(tokenValue("space.300"));

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
      // End on both: the side nav reaches half the window, and the panel takes what Main has
      // beyond its minimum, so the page keeps room for its content.
      const main = canvas.getByRole("main");
      const mainMin = mainMinimum();
      const navSplitter = canvas.getByRole("separator", { name: "Resize side navigation" });
      navSplitter.focus();
      await userEvent.keyboard("{End}");
      const panelSplitter = canvas.getByRole("separator", { name: "Resize details" });
      panelSplitter.focus();
      await userEvent.keyboard("{End}");
      const panelMax = 1440 - 720 - mainMin;
      await waitFor(() =>
        expect(stored()).toMatchObject({ sideNavWidth: 720, panelWidth: panelMax }),
      );
      await waitFor(() => expect(main.getBoundingClientRect().width).toBe(mainMin));
      // A narrower window caps both for now and keeps both preferences for later.
      await page.viewport(1280, 900);
      await waitFor(() => {
        expect(nav.getBoundingClientRect().width).toBe(640);
        expect(panel.getBoundingClientRect().width).toBe(1280 - 640 - mainMin);
        expect(main.getBoundingClientRect().width).toBe(mainMin);
      });
      await expect(stored()).toMatchObject({ sideNavWidth: 720, panelWidth: panelMax });
      await page.viewport(1440, 900);
      await waitFor(() => {
        expect(nav.getBoundingClientRect().width).toBe(720);
        expect(panel.getBoundingClientRect().width).toBe(panelMax);
        expect(main.getBoundingClientRect().width).toBe(mainMin);
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

/**
 * Between the large breakpoint and the aside breakpoint (here 1100px) the rail follows the page
 * while the side nav is expanded; collapsed, the side nav leaves the room the rail needs, and the
 * rail sits beside Main with its divider the page's height.
 */
export const RecordRailLaptop: Story = {
  name: "Record rail at 1100px",
  parameters: {
    viewport: {
      options: {
        shellLaptop: {
          name: "Small laptop (1100 by 800)",
          styles: { width: "1100px", height: "800px" },
        },
      },
    },
  },
  globals: { viewport: { value: "shellLaptop", isRotated: false } },
  render: () => <RecordDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(1100));
    const main = canvas.getByRole("main");
    const aside = canvas.getByRole("complementary", { name: "Record properties" });
    const box = (el: HTMLElement) => el.getBoundingClientRect();
    // Expanded: the rail follows the page.
    await waitFor(() => expect(box(aside).top).toBeGreaterThanOrEqual(box(main).bottom - 1));
    // Collapsed: beside Main, from the top of the page to its end.
    await userEvent.click(canvas.getByRole("button", { name: "Collapse side navigation" }));
    await waitFor(() => expect(box(aside).left).toBeGreaterThanOrEqual(box(main).right - 1));
    await expect(Math.abs(box(aside).top - box(main).top)).toBeLessThanOrEqual(1);
    await expect(box(aside).bottom).toBeGreaterThanOrEqual(box(main).bottom - 1);
    await expect(box(main).width).toBeGreaterThanOrEqual(mainMinimum());
    // Expanded again, it follows the page again.
    await userEvent.click(canvas.getByRole("button", { name: "Expand side navigation" }));
    await waitFor(() => expect(box(aside).top).toBeGreaterThanOrEqual(box(main).bottom - 1));
  },
};

/** At 1440px with the side nav and the panel open, End on both splitters: each stops where Main would fall under its minimum, and says so in `aria-valuemax`. */
export const MainMinimum: Story = {
  name: "Main minimum",
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <ResizableShellDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = canvas.getByRole("main");
    const panel = await canvas.findByRole("complementary", { name: "Program details" });
    await waitFor(() => expect(panel.getBoundingClientRect().width).toBe(480));
    const mainMin = mainMinimum();
    for (const label of ["Resize side navigation", "Resize details"]) {
      const splitter = canvas.getByRole("separator", { name: label });
      splitter.focus();
      await userEvent.keyboard("{End}");
      await waitFor(() =>
        expect(main.getBoundingClientRect().width).toBeGreaterThanOrEqual(mainMin),
      );
      // End is the maximum the splitter announced.
      await waitFor(() =>
        expect(splitter.getAttribute("aria-valuenow")).toBe(splitter.getAttribute("aria-valuemax")),
      );
    }
    await expect(main.getBoundingClientRect().width).toBe(mainMin);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    // Home gives the room back to the page.
    const navSplitter = canvas.getByRole("separator", { name: "Resize side navigation" });
    navSplitter.focus();
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(main.getBoundingClientRect().width).toBeGreaterThan(mainMin));
  },
};

const pages = { programs: "Programs", campaigns: "Test campaigns", portfolio: "Portfolio" };
type PageKey = keyof typeof pages;
const pageOrder: PageKey[] = ["programs", "campaigns", "portfolio"];

/** A product's router in miniature: the location is state, and each page sets the document's title after it renders, as a router's head management does. */
function PageChangeDemo({ spokenTitle = false }: { spokenTitle?: boolean }) {
  const [page, setPage] = useState<PageKey>("programs");
  useEffect(() => {
    const was = document.title;
    return () => {
      document.title = was;
    };
  }, []);
  useEffect(() => {
    document.title = `${pages[page]} — Equinox`;
  }, [page]);
  const next = pageOrder[(pageOrder.indexOf(page) + 1) % pageOrder.length] ?? "programs";
  return (
    <Shell
      locationKey={page}
      getPageTitle={spokenTitle ? (key) => pages[key as PageKey] : undefined}
    >
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.SideNav.ToggleButton />
          <Shell.AppLogo name="Equinox" render={<a href="#home" />} />
        </Shell.TopNav.Start>
        <Shell.TopNav.End>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="subtle" />}>Go to</DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {pageOrder.map((key) => (
                <DropdownMenuItem key={key} onClick={() => setPage(key)}>
                  {pages[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </Shell.TopNav.End>
      </Shell.TopNav>
      <Shell.SideNav>
        <Shell.SideNav.Body>
          <Shell.SideNav.Section heading="Work">
            {pageOrder.map((key) => (
              <Shell.SideNav.Item
                key={key}
                icon={ClipboardList}
                isActive={key === page}
                href={`#${key}`}
                onClick={(event) => {
                  event.preventDefault();
                  setPage(key);
                }}
              >
                {pages[key]}
              </Shell.SideNav.Item>
            ))}
          </Shell.SideNav.Section>
        </Shell.SideNav.Body>
      </Shell.SideNav>
      <Shell.Main>
        <PageHeader>
          <PageHeader.Title>{pages[page]}</PageHeader.Title>
          <PageHeader.Actions>
            <Button onClick={() => setPage(next)}>Next page</Button>
          </PageHeader.Actions>
        </PageHeader>
        <Stack space="space.100" className="pt-300">
          {programs.map((p) => (
            <Text key={p.id}>
              {p.id} · {p.title}
            </Text>
          ))}
        </Stack>
      </Shell.Main>
    </Shell>
  );
}

const politeLines = (canvasElement: HTMLElement) =>
  Array.from(
    canvasElement.querySelectorAll('[data-slot="announcer"] [data-politeness="polite"] > div'),
    (line) => line.textContent,
  );

/** `locationKey` from the router: a new page moves focus to Main without scrolling and announces the page's title. A control in the page that survives the change, such as a pager, keeps focus. */
export const PageChange: Story = {
  name: "Page change",
  render: () => <PageChangeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = canvas.getByRole("main");
    // Shell mounts the page's live regions once.
    await expect(canvasElement.querySelectorAll('[data-slot="announcer"]')).toHaveLength(1);
    if (!window.matchMedia("(min-width: 64rem)").matches) return;
    window.scrollTo(0, 240);
    const scrolled = window.scrollY;
    const nav = canvas.getByRole("navigation", { name: "Side navigation" });
    await userEvent.click(within(nav).getByRole("link", { name: "Test campaigns" }));
    await waitFor(() => expect(main).toHaveFocus());
    await expect(window.scrollY).toBe(scrolled);
    await waitFor(() => expect(politeLines(canvasElement)).toContain("Test campaigns — Equinox"));
    // A pager inside the page survives the change, so focus stays on it.
    const pager = canvas.getByRole("button", { name: "Next page" });
    await userEvent.click(pager);
    await waitFor(() =>
      expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Portfolio"),
    );
    await expect(pager).toHaveFocus();
    await waitFor(() => expect(politeLines(canvasElement)).toContain("Portfolio — Equinox"));
    // A menu in the top nav hands focus back to its trigger as it closes; the shell takes it on to
    // Main, so the reader does not start from the navigation again.
    const goTo = canvas.getByRole("button", { name: "Go to" });
    await userEvent.click(goTo);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("menuitem", { name: "Programs" }));
    await waitFor(() =>
      expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Programs"),
    );
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(main).toHaveFocus());
    await expect(goTo).not.toHaveFocus();
    window.scrollTo(0, 0);
  },
};

/** On a phone, choosing a destination in the overlay closes it and hands focus to Main; `getPageTitle` chooses the words. */
export const PageChangePhone: Story = {
  name: "Page change at 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => <PageChangeDemo spokenTitle />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(390));
    await userEvent.click(canvas.getByRole("button", { name: "Expand side navigation" }));
    const nav = await canvas.findByRole("navigation", { name: "Side navigation" });
    await waitFor(() => expect(nav).toHaveAttribute("data-overlay", "open"));
    await userEvent.click(within(nav).getByRole("link", { name: "Test campaigns" }));
    await waitFor(() => expect(canvas.getByRole("main")).toHaveFocus());
    await waitFor(() =>
      expect(canvas.queryByRole("navigation", { name: "Side navigation" })).toBeNull(),
    );
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Test campaigns");
    await waitFor(() => expect(politeLines(canvasElement)).toContain("Test campaigns"));
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
  },
};

/** Closes the side nav from product code, as a Done button inside the overlay would. */
function CloseFromInside() {
  const { collapse } = useSideNav();
  return (
    <Button variant="subtle" onClick={collapse}>
      Done
    </Button>
  );
}

/** A dialog opened from inside the side nav, as an account's Settings would be. */
function SettingsFromInside() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="subtle" />}>Settings</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Opened from the side nav, over its overlay.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Close</DialogClose>
          <DialogClose render={<Button variant="primary" />}>Save settings</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A phone shell without `locationKey`: the side nav alone decides what a chosen link does. */
function DestinationDemo({
  closeOnNavigate,
  settings = false,
}: {
  closeOnNavigate?: boolean | undefined;
  settings?: boolean | undefined;
}) {
  const [page, setPage] = useState<PageKey>("programs");
  const [opens, setOpens] = useState<string[]>([]);
  const [closes, setCloses] = useState<string[]>([]);
  // What SideNav's callbacks report: the cause, and "(desktop)" for a change that was not the
  // phone overlay's, which a product would remember as the reader's preference.
  const change = ({ trigger, isOverlay }: SideNavChange) =>
    isOverlay ? trigger : `${trigger} (desktop)`;
  return (
    <Shell>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.SideNav.ToggleButton />
          <Shell.AppLogo name="Equinox" render={<a href="#home" />} />
        </Shell.TopNav.Start>
      </Shell.TopNav>
      <Shell.SideNav
        closeOnNavigate={closeOnNavigate}
        onExpand={(args) => setOpens((was) => [...was, change(args)])}
        onCollapse={(args) => setCloses((was) => [...was, change(args)])}
      >
        <Shell.SideNav.Body>
          <Shell.SideNav.Section heading="Work">
            {pageOrder.map((key) => (
              <Shell.SideNav.Item
                key={key}
                icon={ClipboardList}
                isActive={key === page}
                href={`#${key}`}
                onClick={(event) => {
                  // A router link: a plain click navigates in place, a modified one is the browser's.
                  event.preventDefault();
                  if (!(event.ctrlKey || event.metaKey || event.shiftKey)) setPage(key);
                }}
              >
                {pages[key]}
              </Shell.SideNav.Item>
            ))}
          </Shell.SideNav.Section>
        </Shell.SideNav.Body>
        <Shell.SideNav.Footer>
          <CloseFromInside />
          {settings ? <SettingsFromInside /> : null}
        </Shell.SideNav.Footer>
      </Shell.SideNav>
      <Shell.Main>
        <PageHeader>
          <PageHeader.Title>{pages[page]}</PageHeader.Title>
        </PageHeader>
        <Text className="pt-200">Opened by: {opens.length ? opens.join(", ") : "nothing yet"}</Text>
        <Text className="pt-100">
          Closed by: {closes.length ? closes.join(", ") : "nothing yet"}
        </Text>
      </Shell.Main>
    </Shell>
  );
}

const openPhoneNav = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await waitFor(() => expect(window.innerWidth).toBe(390));
  await userEvent.click(canvas.getByRole("button", { name: "Expand side navigation" }));
  const nav = await canvas.findByRole("navigation", { name: "Side navigation" });
  await waitFor(() => expect(nav).toHaveAttribute("data-overlay", "open"));
  // Let the slide finish, so what follows (and the axe pass) sees the overlay at rest.
  await Promise.all(nav.getAnimations().map((animation) => animation.finished));
  return nav;
};

/** Without `locationKey`, on a phone: a link chosen in the overlay closes it and moves focus to Main, and `onCollapse` says `navigation`. A click that opens a new tab leaves it open, and a close from inside it by any other means, such as `useSideNav().collapse()`, returns focus to the toggle. */
export const DestinationPhone: Story = {
  name: "Destination at 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => <DestinationDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = canvas.getByRole("main");
    let nav = await openPhoneNav(canvasElement);
    // A modified click belongs to the browser (a new tab): the overlay and the page stay.
    within(nav)
      .getByRole("link", { name: "Portfolio" })
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ctrlKey: true }),
      );
    await expect(nav).toHaveAttribute("data-overlay", "open");
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Programs");
    // The overlay's own opening and closing report `isOverlay` (no "(desktop)" here), so a product
    // keeps the reader's desktop preference apart from them.
    await expect(canvas.getByText("Opened by: toggle-button")).toBeVisible();
    await expect(canvas.getByText("Closed by: nothing yet")).toBeVisible();
    // A plain click: the page changes, the overlay closes and focus lands on Main.
    await userEvent.click(within(nav).getByRole("link", { name: "Test campaigns" }));
    await waitFor(() => expect(main).toHaveFocus());
    await waitFor(() =>
      expect(canvas.queryByRole("navigation", { name: "Side navigation" })).toBeNull(),
    );
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Test campaigns");
    await expect(canvas.getByText("Closed by: navigation")).toBeVisible();
    // Closed from inside by product code: focus goes back to the toggle, not to the body.
    nav = await openPhoneNav(canvasElement);
    await userEvent.click(within(nav).getByRole("button", { name: "Done" }));
    await waitFor(() =>
      expect(canvas.queryByRole("navigation", { name: "Side navigation" })).toBeNull(),
    );
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Expand side navigation" })).toHaveFocus(),
    );
    await expect(canvas.getByText("Closed by: navigation, hook")).toBeVisible();
    // Each callback fires once per real change: two openings, two closings.
    await expect(canvas.getByText("Opened by: toggle-button, toggle-button")).toBeVisible();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
  },
};

/** `closeOnNavigate={false}` for a side nav whose links change the page in place: the overlay stays open and focus stays on the link. */
export const KeepOpenPhone: Story = {
  name: "Keep open at 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => <DestinationDemo closeOnNavigate={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = await openPhoneNav(canvasElement);
    const link = within(nav).getByRole("link", { name: "Test campaigns" });
    await userEvent.click(link);
    await waitFor(() =>
      expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Test campaigns"),
    );
    await expect(nav).toHaveAttribute("data-overlay", "open");
    await expect(link).toHaveFocus();
    await expect(canvas.getByText("Closed by: nothing yet")).toBeVisible();
  },
};

/** The phone overlay is modal: opening it moves focus to the current page's item, Tab and Shift+Tab go round inside it, and the top nav, Main and the skip links are inert. A dialog opened from inside it keeps its own Tab and Escape, and closing the dialog leaves the overlay open. Its own Close takes the place of the toggle it covers; Close, Escape and the blanket return focus to the toggle. */
export const OverlayFocusPhone: Story = {
  name: "Overlay focus at 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => <DestinationDemo settings />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const toggle = canvas.getByRole("button", { name: "Expand side navigation" });
    const topNav = canvasElement.querySelector<HTMLElement>('[data-slot="shell-topnav"]');
    const main = canvasElement.querySelector<HTMLElement>('[data-slot="shell-main"]');
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    const nav = await canvas.findByRole("navigation", { name: "Side navigation" });
    await waitFor(() => expect(nav).toHaveAttribute("data-overlay", "open"));
    const current = within(nav).getByRole("link", { name: "Programs" });
    await waitFor(() => expect(current).toHaveFocus());
    // Everything else in the shell is inert while the overlay is open.
    await expect(topNav).toHaveAttribute("inert");
    await expect(main).toHaveAttribute("inert");
    // The blanket closes the overlay on a press but is no control: hidden, out of the tab order.
    const scrim = canvasElement.querySelector<HTMLElement>(".shell-scrim");
    await expect(scrim).toHaveAttribute("aria-hidden", "true");
    await expect(scrim).toHaveAttribute("tabindex", "-1");
    // Tab goes round: the three links, Done, Settings, then the overlay's Close, and back to the
    // first link.
    const close = within(nav).getByRole("button", { name: "Close side navigation" });
    const done = within(nav).getByRole("button", { name: "Done" });
    const settings = within(nav).getByRole("button", { name: "Settings" });
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(done).toHaveFocus();
    await userEvent.tab();
    await expect(settings).toHaveFocus();
    await userEvent.tab();
    await expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(settings).toHaveFocus();
    for (let step = 0; step < 7; step += 1) {
      await userEvent.tab();
      await expect(nav.contains(doc.activeElement)).toBe(true);
    }
    // A dialog opened from inside the overlay keeps its own Tab, and its Escape closes only it.
    settings.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = await within(doc.body).findByRole("dialog", { name: "Settings" });
    await waitFor(() => expect(dialog.contains(doc.activeElement)).toBe(true));
    for (let step = 0; step < 3; step += 1) {
      await userEvent.tab();
      await expect(dialog.contains(doc.activeElement)).toBe(true);
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(doc.body).queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(settings).toHaveFocus());
    await expect(nav).toHaveAttribute("data-overlay", "open");
    // The overlay's Close hands focus back to the toggle, and the shell takes input again.
    await userEvent.click(close);
    await waitFor(() =>
      expect(canvas.queryByRole("navigation", { name: "Side navigation" })).toBeNull(),
    );
    await waitFor(() => expect(toggle).toHaveFocus());
    await expect(topNav).not.toHaveAttribute("inert");
    await expect(main).not.toHaveAttribute("inert");
    // Escape does the same.
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(current).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(toggle).toHaveFocus());
    await expect(canvas.getByText("Opened by: toggle-button, toggle-button")).toBeVisible();
    await expect(canvas.getByText("Closed by: toggle-button, escape")).toBeVisible();
  },
};

const besideKey = `${SHELL_STORAGE_KEY}.panel-beside-story`;

/** A record register with the icon rail, in a shell that remembers the reader's side nav. */
function PanelBesideMainDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Shell collapsedSideNav="icons" persist={besideKey}>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.SideNav.ToggleButton />
          <Shell.AppLogo name="Equinox" render={<a href="#home" />} />
        </Shell.TopNav.Start>
      </Shell.TopNav>
      <Shell.SideNav>
        <Shell.SideNav.Body>
          <Nav />
        </Shell.SideNav.Body>
      </Shell.SideNav>
      <Shell.Main>
        <PageHeader>
          <PageHeader.Heading>
            <PageHeader.Title>Programs</PageHeader.Title>
          </PageHeader.Heading>
          <PageHeader.Actions>
            <Button onClick={() => setOpen(true)}>Open details</Button>
          </PageHeader.Actions>
        </PageHeader>
        <Stack space="space.100" className="pt-300">
          {programs.slice(0, 8).map((p) => (
            <Text key={p.id}>
              {p.id} · {p.title}
            </Text>
          ))}
        </Stack>
      </Shell.Main>
      {open ? (
        <Shell.Panel title="Program details" onClose={() => setOpen(false)}>
          <Text>Phase: Authorise. Owner: Sarah Chen.</Text>
        </Shell.Panel>
      ) : null}
    </Shell>
  );
}

/**
 * Between the large breakpoint and the panel breakpoint (here 1200px) an open panel sits beside
 * Main, and the side nav yields its width to its icon rail meanwhile, so the register stays in
 * view. Closing the panel gives the side nav back as the reader left it, and the remembered
 * preference never changes. A reader who expands the side nav while the panel is open keeps it
 * expanded until the panel closes.
 */
export const PanelBesideMain: Story = {
  name: "Panel beside Main at 1200px",
  globals: { viewport: { value: "ledgerDesktop", isRotated: false } },
  beforeEach: () => {
    const previous = localStorage.getItem(besideKey);
    localStorage.removeItem(besideKey);
    return () => {
      if (previous === null) localStorage.removeItem(besideKey);
      else localStorage.setItem(besideKey, previous);
    };
  },
  render: () => <PanelBesideMainDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(1200));
    const nav = canvas.getByRole("navigation", { name: "Side navigation" });
    const main = canvas.getByRole("main");
    const width = (el: HTMLElement) => Math.round(el.getBoundingClientRect().width);
    const stored = () => JSON.parse(localStorage.getItem(besideKey) ?? "{}");
    const expanded = Number.parseFloat(tokenValue("dimension.layout.sidenav"));
    await waitFor(() => expect(width(nav)).toBe(expanded));
    await waitFor(() => expect(stored().collapsed).toBe(false));
    const openPanel = async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open details" }));
      return canvas.findByRole("complementary", { name: "Program details" });
    };
    const closePanel = async (panel: HTMLElement) => {
      await userEvent.click(within(panel).getByRole("button", { name: /^Close/ }));
      await waitFor(() => expect(canvas.queryByRole("complementary")).toBeNull());
    };
    // The side nav folds to its icon rail and Main stays in view beside the panel.
    let panel = await openPanel();
    await waitFor(() => expect(nav).toHaveAttribute("data-collapsed", "icons"));
    await waitFor(() => expect(width(nav)).toBe(56));
    await expect(main).toBeVisible();
    await waitFor(() =>
      expect(main.getBoundingClientRect().right).toBeLessThanOrEqual(
        panel.getBoundingClientRect().left + 1,
      ),
    );
    await expect(width(main)).toBeGreaterThanOrEqual(mainMinimum());
    // The toggle offers to expand it (over the mark, on hover or focus, as in the rail).
    await expect(canvas.getByRole("button", { name: "Expand side navigation" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    // The reader's preference is untouched.
    await expect(stored().collapsed).toBe(false);
    // Closing the panel gives the side nav back.
    await closePanel(panel);
    await waitFor(() => expect(width(nav)).toBe(expanded));
    // Expanded while the panel is open, it stays expanded until the panel closes.
    panel = await openPanel();
    await waitFor(() => expect(width(nav)).toBe(56));
    await userEvent.click(canvas.getByRole("button", { name: "Expand side navigation" }));
    await waitFor(() => expect(width(nav)).toBe(expanded));
    await expect(width(main)).toBeGreaterThanOrEqual(mainMinimum());
    await closePanel(panel);
    await expect(width(nav)).toBe(expanded);
    await expect(stored().collapsed).toBe(false);
    // The next panel yields again.
    panel = await openPanel();
    await waitFor(() => expect(width(nav)).toBe(56));
    await closePanel(panel);
    await waitFor(() => expect(width(nav)).toBe(expanded));
  },
};

/** A side nav whose current page sits in a group, with a count and a label too long for it. */
function CurrentPageDemo() {
  return (
    <Shell collapsedSideNav="icons" defaultSideNavCollapsed>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Shell.SideNav.ToggleButton />
          <Shell.AppLogo name="Equinox" render={<a href="#home" />} />
        </Shell.TopNav.Start>
      </Shell.TopNav>
      <Shell.SideNav defaultWidth={200}>
        <Shell.SideNav.Body>
          <Shell.SideNav.Section heading="Work">
            <Shell.SideNav.Item icon={ShieldCheck} badge="3" href="#queue">
              My queue
            </Shell.SideNav.Item>
            <Shell.SideNav.Item icon={ClipboardList} href="#programs">
              Programs
            </Shell.SideNav.Item>
          </Shell.SideNav.Section>
          <Shell.SideNav.Section heading="Risk">
            <Shell.SideNav.Expandable icon={Bug} label="Findings and assets" isActive>
              <Shell.SideNav.Item href="#findings" isActive>
                Findings
              </Shell.SideNav.Item>
              <Shell.SideNav.Item href="#assets">Assets</Shell.SideNav.Item>
            </Shell.SideNav.Expandable>
            <Shell.SideNav.Item icon={ShieldAlert} href="#decisions">
              Authorization decisions and waivers
            </Shell.SideNav.Item>
          </Shell.SideNav.Section>
        </Shell.SideNav.Body>
        <Shell.SideNav.Footer>
          <Shell.Profile
            avatar={
              <Avatar size="small" hue={avatarHue("developer")}>
                <AvatarFallback>{avatarInitials("developer", 1)}</AvatarFallback>
              </Avatar>
            }
            name="developer@program-assurance.local"
            description="Owner"
            aria-haspopup="dialog"
            onClick={() => undefined}
          />
        </Shell.SideNav.Footer>
      </Shell.SideNav>
      <Shell.Main>
        <PageHeader>
          <PageHeader.Heading>
            <PageHeader.Title>Findings</PageHeader.Title>
          </PageHeader.Heading>
        </PageHeader>
      </Shell.Main>
    </Shell>
  );
}

/**
 * The current page stays visible wherever it is. In the icon rail a group that holds the current
 * page takes the current colour, since its items are hidden, and an item with a count keeps the
 * count in its name and shows a dot. Expanded, the group opens on the current page by default;
 * closed, the group shows the current colour again. A label the side nav's width cuts shows its
 * whole name in a tooltip, and so does the profile's name.
 */
export const CurrentPage: Story = {
  name: "Current page",
  globals: { viewport: { value: "ledgerDesktop", isRotated: false } },
  render: () => <CurrentPageDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    await waitFor(() => expect(window.innerWidth).toBe(1200));
    const nav = canvas.getByRole("navigation", { name: "Side navigation" });
    await waitFor(() => expect(nav).toHaveAttribute("data-collapsed", "icons"));
    const group = within(nav).getByRole("button", { name: "Findings and assets" });
    await expect(group).toHaveAttribute("data-current");
    const queue = within(nav).getByRole("link", { name: "My queue 3" });
    await expect(getComputedStyle(queue, "::after").content).not.toBe("none");
    // Expanded: the group is open on its current item, which takes the current colour back.
    await userEvent.click(canvas.getByRole("button", { name: "Expand side navigation" }));
    await waitFor(() => expect(nav).not.toHaveAttribute("data-collapsed"));
    await expect(group).toHaveAttribute("aria-expanded", "true");
    await expect(group).not.toHaveAttribute("data-current");
    await expect(within(nav).getByRole("link", { name: "Findings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(getComputedStyle(queue, "::after").content).toBe("none");
    // Closed, the group holds the current page out of view and says so.
    await userEvent.click(group);
    await expect(group).toHaveAttribute("aria-expanded", "false");
    await expect(group).toHaveAttribute("data-current");
    // The next stop is the cut label; its tooltip gives the whole name.
    await userEvent.tab();
    const long = within(nav).getByRole("link", { name: "Authorization decisions and waivers" });
    await expect(long).toHaveFocus();
    await waitFor(() =>
      expect(doc.querySelector('[data-slot="tooltip-content"][data-open]')).toHaveTextContent(
        "Authorization decisions and waivers",
      ),
    );
    // The profile's cut name shows whole too. It opens a dialog, so it has no menu chevron.
    await userEvent.tab();
    const profile = within(nav).getByRole("button", { name: /^developer@/ });
    await expect(profile).toHaveFocus();
    await expect(profile).toHaveAccessibleName("developer@program-assurance.local Owner");
    await expect(profile.querySelector('[data-slot="shell-sidenav-chevron"]')).toBeNull();
    await waitFor(() =>
      expect(
        [...doc.querySelectorAll('[data-slot="tooltip-content"][data-open]')].some((el) =>
          el.textContent?.includes("developer@program-assurance.local"),
        ),
      ).toBe(true),
    );
  },
};

/** Expanding or collapsing the icon rail moves the top nav's start slot with the side nav, on the same curve: it eases between its own width and the side nav's instead of jumping to its end width on the first frame. */
export const StartSlotMotion: Story = {
  name: "Start slot motion",
  globals: { viewport: { value: "ledgerDesktop", isRotated: false } },
  render: () => <CurrentPageDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(1200));
    const nav = canvas.getByRole("navigation", { name: "Side navigation" });
    const start = canvasElement.querySelector<HTMLElement>('[data-slot="shell-topnav-start"]');
    if (!start) throw new Error("No start slot");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    await waitFor(() => expect(nav).toHaveAttribute("data-collapsed", "icons"));
    const collapsedWidth = start.getBoundingClientRect().width;
    for (const [label, from, to] of [
      ["Expand side navigation", collapsedWidth, 200],
      ["Collapse side navigation", 200, collapsedWidth],
    ] as const) {
      await userEvent.click(canvas.getByRole("button", { name: label }));
      const widths: number[] = [];
      const began = performance.now();
      while (performance.now() - began < 350) {
        await new Promise(requestAnimationFrame);
        widths.push(start.getBoundingClientRect().width);
      }
      await waitFor(() =>
        expect(Math.round(start.getBoundingClientRect().width)).toBe(Math.round(to)),
      );
      const [lo, hi] = [Math.min(from, to), Math.max(from, to)];
      const between = widths.some((w) => w > lo + 0.5 && w < hi - 0.5);
      await expect(between).toBe(!reduced);
    }
  },
};

/** On a phone the banner's message wraps instead of truncating, and the top nav starts under the banner's real height. */
export const BannerPhone: Story = {
  name: "Banner at 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => <Demo banner />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const banner = canvas.getByRole("region", { name: "Banner" });
    const topNav = canvas.getByRole("banner", { name: "Top navigation" });
    await waitFor(() => expect(banner.getBoundingClientRect().height).toBeGreaterThan(48));
    await waitFor(() =>
      expect(
        Math.abs(topNav.getBoundingClientRect().top - banner.getBoundingClientRect().bottom),
      ).toBeLessThanOrEqual(1),
    );
    await expect(canvas.getByText(/evidence uploads lock after that/)).toBeVisible();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
  },
};

/** A window under 30rem tall (a phone on its side, a page zoomed to 400%): the banner and the top nav scroll away with the page instead of pinning a share of the height. */
export const ShortWindow: Story = {
  name: "Short window",
  parameters: {
    viewport: {
      options: {
        shellLandscape: {
          name: "Phone on its side (844 by 390)",
          styles: { width: "844px", height: "390px" },
        },
      },
    },
  },
  globals: { viewport: { value: "shellLandscape", isRotated: false } },
  render: () => <Demo banner />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerHeight).toBe(390));
    const banner = canvas.getByRole("region", { name: "Banner" });
    const topNav = canvas.getByRole("banner", { name: "Top navigation" });
    await expect(getComputedStyle(banner).position).toBe("static");
    await expect(getComputedStyle(topNav).position).toBe("static");
    try {
      window.scrollTo(0, 600);
      await waitFor(() => expect(topNav.getBoundingClientRect().bottom).toBeLessThanOrEqual(0));
    } finally {
      window.scrollTo(0, 0);
    }
  },
};

const defaultsKey = `${SHELL_STORAGE_KEY}.default-widths-story`;

/** A SideNav's `defaultWidth` is the width until the reader resizes it, and is never remembered: a remembering shell stores only a width the reader dragged or keyed. */
export const DefaultWidths: Story = {
  name: "Default widths",
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  beforeEach: () => {
    const previous = localStorage.getItem(defaultsKey);
    const root = document.documentElement;
    const nav = root.style.getPropertyValue("--shell-sidenav-stored");
    localStorage.removeItem(defaultsKey);
    root.style.removeProperty("--shell-sidenav-stored");
    return () => {
      if (previous === null) localStorage.removeItem(defaultsKey);
      else localStorage.setItem(defaultsKey, previous);
      root.style.setProperty("--shell-sidenav-stored", nav);
    };
  },
  render: () => <ResizableShellDemo persist={defaultsKey} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stored = () => JSON.parse(localStorage.getItem(defaultsKey) ?? "{}");
    const nav = canvas.getByRole("navigation", { name: "Side navigation" });
    await waitFor(() => expect(Math.round(nav.getBoundingClientRect().width)).toBe(320));
    await waitFor(() => expect(stored().collapsed).toBe(false));
    await expect(stored().sideNavWidth).toBeUndefined();
    const splitter = canvas.getByRole("separator", { name: "Resize side navigation" });
    splitter.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(stored().sideNavWidth).toBe(336));
    await expect(Math.round(nav.getBoundingClientRect().width)).toBe(336);
  },
};

function PanelFocusDemo() {
  const [row, setRow] = useState<number | null>(null);
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
              <PageHeader.Title>Findings</PageHeader.Title>
            </PageHeader.Heading>
          </PageHeader>
          <Inline space="space.100" shouldWrap>
            {[1, 2, 3].map((n) => (
              <Button key={n} onClick={() => setRow(n)}>
                {`Preview finding ${n}`}
              </Button>
            ))}
          </Inline>
        </Stack>
      </Shell.Main>
      {row !== null && (
        <Shell.Panel title={`Finding ${row}`} onClose={() => setRow(null)}>
          <Stack space="space.100">
            <Input type="search" aria-label="Filter evidence" />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="small" iconAfter={<ChevronDown />} />}>
                Evidence actions
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Request evidence</DropdownMenuItem>
                <DropdownMenuItem>Export evidence</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Text>{`Evidence for finding ${row}.`}</Text>
          </Stack>
        </Shell.Panel>
      )}
    </Shell>
  );
}

/**
 * The panel's focus contract on a wide screen, where it sits beside Main: opening it moves focus
 * into it (at every width, not only where it covers Main), Escape in a field or a menu inside it
 * belongs to the field or the menu, and closing it returns focus to the control the reader last
 * used in Main, here the third row's opener pressed while the first row's preview was open.
 */
export const PanelFocus: Story = {
  name: "Panel focus",
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <PanelFocusDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const first = canvas.getByRole("button", { name: "Preview finding 1" });
    first.focus();
    await userEvent.keyboard("{Enter}");
    const panel = await canvas.findByRole("complementary", { name: "Finding 1" });
    await waitFor(() => expect(panel).toHaveFocus());
    const filter = within(panel).getByRole("searchbox", { name: "Filter evidence" });
    await userEvent.click(filter);
    await userEvent.keyboard("AC-2{Escape}");
    await expect(canvas.getByRole("complementary", { name: "Finding 1" })).toBeInTheDocument();
    await expect(filter).toHaveFocus();
    // Escape in a menu opened from the panel closes the menu, not the panel.
    const actions = within(panel).getByRole("button", { name: "Evidence actions" });
    await userEvent.click(actions);
    await body.findByRole("menu");
    await waitFor(() => expect(actions).toHaveAttribute("aria-expanded", "true"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(actions).toHaveFocus());
    await expect(canvas.getByRole("complementary", { name: "Finding 1" })).toBeInTheDocument();
    // Another row's opener while the panel is open: the panel stays and shows that row.
    const third = canvas.getByRole("button", { name: "Preview finding 3" });
    await userEvent.click(third);
    await canvas.findByRole("complementary", { name: "Finding 3" });
    await userEvent.click(within(panel).getByRole("button", { name: "Close details" }));
    await waitFor(() => expect(third).toHaveFocus());
    await expect(canvas.queryByRole("complementary")).not.toBeInTheDocument();
    // Escape from the panel itself closes it and returns focus to its opener.
    const second = canvas.getByRole("button", { name: "Preview finding 2" });
    second.focus();
    await userEvent.keyboard("{Enter}");
    const reopened = await canvas.findByRole("complementary", { name: "Finding 2" });
    await waitFor(() => expect(reopened).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(second).toHaveFocus());
    await expect(canvas.queryByRole("complementary")).not.toBeInTheDocument();
  },
};

const panelWidthsKey = `${SHELL_STORAGE_KEY}.panel-widths-story`;
const panelDefaults = { issue: 560, control: 640 } as const;
const panelNames = { issue: "Operational issue preview", control: "Control preview" } as const;

/** Two registers' previews with different default widths, in a shell that remembers widths. The splitter reports its resizes under the buttons. */
function PanelWidthsDemo() {
  const [open, setOpen] = useState<keyof typeof panelDefaults | null>(null);
  const [resizes, setResizes] = useState<string[]>([]);
  return (
    <Shell persist={panelWidthsKey}>
      <Shell.TopNav>
        <Shell.TopNav.Start>
          <Text>Program Assurance</Text>
        </Shell.TopNav.Start>
      </Shell.TopNav>
      <Shell.Main>
        <Stack space="space.200">
          <PageHeader>
            <PageHeader.Heading>
              <PageHeader.Title>Findings</PageHeader.Title>
            </PageHeader.Heading>
          </PageHeader>
          <Inline space="space.100" shouldWrap>
            <Button onClick={() => setOpen("issue")}>Preview issue</Button>
            <Button onClick={() => setOpen("control")}>Preview control</Button>
          </Inline>
          <Text color="color.text.subtle" data-testid="resizes">
            {resizes.length ? resizes.join("; ") : "No resize yet."}
          </Text>
        </Stack>
      </Shell.Main>
      {open && (
        <Shell.Panel
          key={open}
          label={panelNames[open]}
          defaultWidth={panelDefaults[open]}
          onClose={() => setOpen(null)}
        >
          <Shell.Panel.Splitter
            onResizeStart={({ initialWidth }) => setResizes((r) => [...r, `start ${initialWidth}`])}
            onResizeEnd={({ initialWidth, finalWidth }) =>
              setResizes((r) => [...r, `end ${initialWidth} to ${finalWidth}`])
            }
          />
          <Shell.Panel.Header>
            <Shell.Panel.Close />
          </Shell.Panel.Header>
          <Shell.Panel.Body>
            <Text>{`The ${panelNames[open].toLowerCase()} opens at ${panelDefaults[open]}px until the reader resizes a panel.`}</Text>
          </Shell.Panel.Body>
        </Shell.Panel>
      )}
    </Shell>
  );
}

/** A system colour as the browser draws it now, for comparing with a computed colour in forced colours. */
const systemColour = (name: string) => {
  const probe = document.createElement("div");
  probe.style.cssText = `background-color: ${name}; forced-color-adjust: none`;
  document.body.append(probe);
  const colour = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return colour;
};

/** Two frames, so a width the shell set in a style has been laid out before it is measured. */
const nextFrames = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/**
 * A panel's `defaultWidth` is its own and is never remembered: the issue preview opens at 560px
 * and the control preview at 640px, and nothing is stored. Close and the splitter are named after
 * the panel's `label`, and the splitter names the panel it resizes (`aria-controls`). A key step
 * or a drag lands at once, without the columns easing behind it: the arrows step 16px, with Shift
 * or Page Up and Page Down 64px, Home and End go to the minimum and the maximum, and a key that
 * changes nothing reports no resize. The width the reader chose is remembered and outranks every
 * default from then on.
 */
export const PanelWidths: Story = {
  name: "Panel widths",
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  beforeEach: () => {
    const previous = localStorage.getItem(panelWidthsKey);
    const root = document.documentElement;
    const stored = root.style.getPropertyValue("--shell-panel-stored");
    localStorage.removeItem(panelWidthsKey);
    root.style.removeProperty("--shell-panel-stored");
    return () => {
      if (previous === null) localStorage.removeItem(panelWidthsKey);
      else localStorage.setItem(panelWidthsKey, previous);
      root.style.setProperty("--shell-panel-stored", stored);
    };
  },
  render: () => <PanelWidthsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stored = () => JSON.parse(localStorage.getItem(panelWidthsKey) ?? "{}");
    const width = (el: HTMLElement) => Math.round(el.getBoundingClientRect().width);
    const open = async (which: keyof typeof panelDefaults) => {
      await userEvent.click(
        canvas.getByRole("button", {
          name: which === "issue" ? "Preview issue" : "Preview control",
        }),
      );
      return canvas.findByRole("complementary", { name: panelNames[which] });
    };
    const close = async (panel: HTMLElement, name: string) => {
      await userEvent.click(within(panel).getByRole("button", { name: `Close ${name}` }));
      await waitFor(() => expect(canvas.queryByRole("complementary")).toBeNull());
    };

    // Each panel opens at its own default, and neither default is stored.
    const issue = await open("issue");
    await waitFor(() => expect(width(issue)).toBe(560));
    await expect(stored().panelWidth).toBeUndefined();
    await close(issue, panelNames.issue);
    const control = await open("control");
    await waitFor(() => expect(width(control)).toBe(640));
    await expect(stored().panelWidth).toBeUndefined();

    const splitter = within(control).getByRole("separator", { name: "Resize Control preview" });
    await expect(splitter).toHaveAttribute("aria-controls", control.id);
    await expect(splitter).toHaveAttribute("aria-valuenow", "640");
    const resizes = canvas.getByTestId("resizes");
    // Read once: a probe added inside waitFor would wake its observer forever.
    const highlight = systemColour("Highlight");

    // A key step lands on the next frame, not after the columns' 240ms ease.
    splitter.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(splitter).toHaveAttribute("aria-valuenow", "656");
    await nextFrames();
    await expect(width(control)).toBe(656);
    await userEvent.keyboard("{Shift>}{ArrowLeft}{/Shift}");
    await nextFrames();
    await expect(width(control)).toBe(720);
    await userEvent.keyboard("{PageDown}");
    await nextFrames();
    await expect(width(control)).toBe(656);
    await userEvent.keyboard("{PageUp}");
    await nextFrames();
    await expect(width(control)).toBe(720);
    await expect(resizes).toHaveTextContent(/end 656 to 720$/);
    // In forced colours the focused band is drawn in Highlight.
    if (window.matchMedia("(forced-colors: active)").matches)
      await waitFor(() => expect(getComputedStyle(splitter).backgroundColor).toBe(highlight));
    // End at the maximum changes nothing and reports nothing.
    const reported = resizes.textContent;
    await userEvent.keyboard("{End}");
    await expect(resizes.textContent).toBe(reported);
    await userEvent.keyboard("{Home}");
    await nextFrames();
    await expect(width(control)).toBe(240);
    await waitFor(() => expect(stored().panelWidth).toBe(240));

    // A drag follows the pointer: the width is the pointer's as soon as it moves.
    const box = splitter.getBoundingClientRect();
    const start = { clientX: box.x + box.width / 2, clientY: box.y + 200 };
    const end = { ...start, clientX: start.clientX - 200 };
    // One session, so the button is still held for the second call.
    const user = userEvent.setup();
    await user.pointer([
      { target: splitter, keys: "[MouseLeft>]", coords: start },
      { target: splitter, coords: end },
    ]);
    await nextFrames();
    await expect(width(control)).toBe(440);
    // In forced colours the band held by the pointer is drawn in Highlight.
    if (window.matchMedia("(forced-colors: active)").matches)
      await waitFor(() => expect(getComputedStyle(splitter).backgroundColor).toBe(highlight));
    await user.pointer({ target: splitter, keys: "[/MouseLeft]", coords: end });
    await waitFor(() => expect(stored().panelWidth).toBe(440));
    await expect(resizes).toHaveTextContent(/end 240 to 440$/);

    // The reader's width outranks the other panel's default.
    await close(control, panelNames.control);
    const again = await open("issue");
    await waitFor(() => expect(width(again)).toBe(440));
    await close(again, panelNames.issue);
  },
};

/** A window 320 by 256, a phone on its side or a page zoomed to 400%: the panel's header scrolls away with its content instead of holding a share of the height, and Escape still closes the panel. */
export const PanelShortWindow: Story = {
  name: "Panel in a short window",
  parameters: {
    viewport: {
      options: {
        shellShort: { name: "Short (320 by 256)", styles: { width: "320px", height: "256px" } },
      },
    },
  },
  globals: { viewport: { value: "shellShort", isRotated: false } },
  render: () => <PanelFocusDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(window.innerHeight).toBe(256));
    const opener = canvas.getByRole("button", { name: "Preview finding 2" });
    await userEvent.click(opener);
    const panel = await canvas.findByRole("complementary", { name: "Finding 2" });
    const header = panel.querySelector<HTMLElement>('[data-slot="shell-panel-header"]')!;
    await expect(getComputedStyle(header).position).toBe("static");
    // Nothing sticks over the content, so the scroll padding no longer reserves the header's height.
    await expect(Number.parseFloat(getComputedStyle(panel).scrollPaddingBlockStart)).toBeLessThan(
      header.getBoundingClientRect().height,
    );
    await waitFor(() => expect(panel).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

/** A desktop window 1280 by 400 with a banner: the banner and the top nav scroll away, and the panel beside the page then holds the window's whole height, as the side nav does, instead of leaving the banner's height empty above it. */
export const PanelShortWideWindow: Story = {
  name: "Panel in a short wide window",
  parameters: {
    viewport: {
      options: {
        shellShortWide: {
          name: "Short (1280 by 400)",
          styles: { width: "1280px", height: "400px" },
        },
      },
    },
  },
  globals: { viewport: { value: "shellShortWide", isRotated: false } },
  render: () => <Demo banner panel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByRole("complementary", {
      name: "PRG-014 · Payload integration",
    });
    // The layout projects render it at a phone or in a frame, where the panel replaces Main.
    if (!window.matchMedia("(min-width: 64rem) and (max-height: 29.99rem)").matches) return;
    try {
      window.scrollTo(0, 400);
      await waitFor(() => {
        const box = panel.getBoundingClientRect();
        expect(Math.abs(box.top)).toBeLessThanOrEqual(1);
        expect(Math.abs(box.bottom - window.innerHeight)).toBeLessThanOrEqual(1);
      });
    } finally {
      window.scrollTo(0, 0);
    }
  },
};

type PanelEvidence = { id: string; name: string; state: string };
const panelEvidence: PanelEvidence[] = [
  { id: "EV-101", name: "Access review export", state: "Accepted" },
  { id: "EV-102", name: "Joiner and leaver log", state: "In review" },
  { id: "EV-103", name: "Privileged account list", state: "Accepted" },
  { id: "EV-104", name: "Quarterly recertification", state: "Requested" },
];
const panelEvidenceColumns = defineColumns<PanelEvidence>((c) => [
  c.id("id", { header: "ID", width: 96 }),
  c.text("name", { header: "Evidence", minWidth: 180, priority: 0 }),
  c.text("state", { header: "State", width: 120 }),
]);

/** A collection inside the panel, as a record preview's tab holds one: the toolbar's search, the rows. */
function PanelEvidenceTable() {
  const table = useDataTable({
    columns: panelEvidenceColumns,
    data: panelEvidence,
    getRowId: (r) => r.id,
    label: "Evidence",
  });
  return (
    <DataTable
      table={table}
      responsive
      toolbar={
        <Toolbar
          search={table.state.globalFilter}
          onSearch={table.setGlobalFilter}
          placeholder="Search evidence"
        />
      }
      empty={{ title: "No evidence yet", description: "Requested evidence appears here." }}
    />
  );
}

/**
 * A table's search inside the panel: Escape clears the query and leaves the panel open, and a
 * second Escape in the empty field still belongs to the field. Escape from the panel's surface,
 * outside any field, closes it and returns focus to the opener.
 */
export const PanelTable: Story = {
  name: "Table in a panel",
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: function Render() {
    const [open, setOpen] = useState(false);
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
                <PageHeader.Title>Controls</PageHeader.Title>
              </PageHeader.Heading>
            </PageHeader>
            <Inline space="space.100">
              <Button onClick={() => setOpen(true)}>Preview AC-2</Button>
            </Inline>
          </Stack>
        </Shell.Main>
        {open && (
          <Shell.Panel
            title="AC-2 Account management"
            defaultWidth={560}
            onClose={() => setOpen(false)}
          >
            <PanelEvidenceTable />
          </Shell.Panel>
        )}
      </Shell>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole("button", { name: "Preview AC-2" });
    opener.focus();
    await userEvent.keyboard("{Enter}");
    const panel = await canvas.findByRole("complementary", { name: "AC-2 Account management" });
    await waitFor(() => expect(panel).toHaveFocus());
    const search = within(panel).getByRole("searchbox", { name: "Search evidence" });
    await userEvent.click(search);
    await userEvent.keyboard("export");
    await waitFor(() => expect(within(panel).queryByText("Joiner and leaver log")).toBeNull());
    // The first Escape clears the query; the panel and the reader's place in it stay.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(search).toHaveValue(""));
    await expect(await within(panel).findByText("Joiner and leaver log")).toBeVisible();
    await expect(search).toHaveFocus();
    // The field is empty now: its Escape is still the field's, not the panel's.
    await userEvent.keyboard("{Escape}");
    await expect(
      canvas.getByRole("complementary", { name: "AC-2 Account management" }),
    ).toBeInTheDocument();
    // Escape from the panel's surface, outside any field, closes it.
    panel.focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("complementary")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
