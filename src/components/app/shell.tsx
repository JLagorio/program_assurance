import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Avatar,
  AvatarFallback,
  avatarHue,
  avatarInitials,
  Box,
  Button,
  CommandPalette,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  ModeSwitch,
  Shell,
  Stack,
  useSideNav,
} from "@ledger/design-system";
import {
  Archive,
  Bell,
  Boxes,
  Bug,
  CircleHelp,
  ClipboardList,
  Database,
  FileCheck2,
  FlaskConical,
  Gauge,
  Gavel,
  Library,
  ListChecks,
  MoreHorizontal,
  Package,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkle,
  Users,
} from "lucide-react";
import { database } from "@/lib/database";
import { useRows } from "@/lib/models";
import { labelFor } from "@/lib/records";
import { useWorkspace } from "./workspace";
import { SchemaLayout } from "./schema-shell";

const groups = [
  {
    label: "Work",
    items: [
      { label: "My work", to: "/work", icon: ShieldCheck },
      { label: "Programs", to: "/programs", icon: ClipboardList },
      { label: "Test campaigns", to: "/campaigns", icon: FlaskConical },
      { label: "Portfolio", to: "/", icon: Gauge },
    ],
  },
  {
    label: "Assessment",
    items: [
      { label: "Evidence", to: "/evidence", icon: Archive },
      { label: "Findings & assets", to: "/findings", icon: Bug },
      { label: "POA&M & risk", to: "/register", icon: ShieldAlert },
      { label: "Packages", to: "/packages", icon: Package },
      { label: "Authorization decisions", to: "/briefing", icon: Gavel },
    ],
  },
  {
    label: "Libraries",
    items: [
      { label: "Catalog", to: "/catalog", icon: FileCheck2 },
      { label: "Profiles", to: "/profiles", icon: ShieldCheck },
      { label: "Components", to: "/library/components", icon: Library },
      { label: "Products", to: "/library/products", icon: Boxes },
      { label: "Requirements", to: "/library/requirements", icon: ListChecks },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Supply chain", to: "/vendors", icon: Users },
      { label: "Design system", to: "/components", icon: Sparkle },
      { label: "Schema inspector", to: "/schema", icon: Database },
    ],
  },
] as const;

/** The prototype frame and the backend inspector are two views of the same workspace. */
export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname.startsWith("/records/") || pathname === "/schema" ? (
    <SchemaLayout>{children}</SchemaLayout>
  ) : (
    <PrototypeLayout>{children}</PrototypeLayout>
  );
}
function PrototypeLayout({ children }: { children: ReactNode }) {
  const workspace = useWorkspace();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const programs = useRows("programs");
  const risks = useRows("risks");
  const findings = useRows("assessment_findings");
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    const result = await database().auth.signOut({ scope: "local" });
    if (result.error) setError(result.error.message);
  }
  const commands = [
    ...(programs.data ?? []).map((row) => ({
      id: `program-${row.id}`,
      group: "Programs",
      label: `${row.code} · ${row.name}`,
      run: () => void navigate({ to: "/programs/$programId", params: { programId: row.id } }),
    })),
    ...(risks.data ?? []).map((row) => ({
      id: `risk-${row.id}`,
      group: "Risks",
      label: row.title,
      run: () => void navigate({ to: "/risks/$riskId", params: { riskId: row.id } }),
    })),
    ...(findings.data ?? []).map((row) => ({
      id: `finding-${row.id}`,
      group: "Findings",
      label: row.title,
      run: () => void navigate({ to: "/findings/$findingId", params: { findingId: row.id } }),
    })),
  ];
  return (
    <Shell sideNavShortcut persist>
      <RouteNavigation pathname={pathname} />
      <Shell.TopNav>
        <Shell.TopNav.Start toggle={<Shell.SideNav.ToggleButton />}>
          <Shell.AppLogo
            name="Equinox"
            secondaryName={workspace.name}
            render={<Link to="/" aria-label="Equinox home" />}
          />
        </Shell.TopNav.Start>
        <Shell.TopNav.Middle>
          <Button variant="secondary" iconBefore={<Search />} onClick={() => setSearchOpen(true)}>
            Search programs, risks, and findings
          </Button>
        </Shell.TopNav.Middle>
        <Shell.TopNav.End>
          <ModeSwitch />
          {/* The three actions as buttons from the medium breakpoint; one More menu below it. */}
          <span className="hidden md:contents">
            <IconButton
              label="Help and shortcuts"
              variant="subtle"
              icon={<CircleHelp />}
              onClick={() => setHelpOpen(true)}
            />
            <IconButton
              label="Open my work"
              variant="subtle"
              icon={<Bell />}
              onClick={() => void navigate({ to: "/work" })}
            />
            <IconButton
              label="Settings"
              variant="subtle"
              icon={<Settings />}
              onClick={() => setSettingsOpen(true)}
            />
          </span>
          <span className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<IconButton label="More" variant="subtle" icon={<MoreHorizontal />} />}
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setHelpOpen(true)}>
                  Help and shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void navigate({ to: "/work" })}>
                  My work
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        </Shell.TopNav.End>
      </Shell.TopNav>
      <Shell.SideNav>
        <Shell.SideNav.Body>
          {groups.map((group) => (
            <Shell.SideNav.Section key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <Shell.SideNav.Item
                  key={item.to}
                  icon={item.icon}
                  isActive={item.to === "/" ? pathname === "/" : pathname.startsWith(item.to)}
                  render={<Link to={item.to} />}
                >
                  {item.label}
                </Shell.SideNav.Item>
              ))}
            </Shell.SideNav.Section>
          ))}
        </Shell.SideNav.Body>
        <Shell.SideNav.Footer>
          <Shell.Profile
            avatar={
              <Avatar size="small" hue={avatarHue(workspace.email)} title={workspace.email}>
                <AvatarFallback>{avatarInitials(workspace.email, 2)}</AvatarFallback>
              </Avatar>
            }
            name={workspace.email}
            description={labelFor(workspace.role)}
            onClick={() => setSettingsOpen(true)}
          />
        </Shell.SideNav.Footer>
        <Shell.SideNav.Splitter label="Resize side navigation" />
      </Shell.SideNav>
      <Shell.Main>{children}</Shell.Main>
      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        placeholder="Search programs, risks, and findings…"
        commands={commands}
      />
      {searchOpen && (programs.isError || risks.isError || findings.isError) && (
        <Box padding="space.200">
          <p role="alert">
            Search records could not be loaded. Retry the connection before searching.
          </p>
        </Box>
      )}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help and shortcuts</DialogTitle>
            <DialogDescription>
              Work in the prototype and inspect the same saved records in the schema view.
            </DialogDescription>
          </DialogHeader>
          <Box padding="space.250">
            <Stack space="space.200">
              <p>
                Use the search button to find programs, risks, and findings. Tab moves between
                controls; Enter or Space activates them; Escape closes a dialog.
              </p>
              <p>
                Create a program, define its systems and scope, then connect implementation,
                assessment, evidence, and remediation records.
              </p>
              <Button render={<Link to="/schema" />}>Open schema inspector</Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile and appearance</DialogTitle>
            <DialogDescription>
              {workspace.email} · {labelFor(workspace.role)}
            </DialogDescription>
          </DialogHeader>
          <Box padding="space.250">
            <Stack space="space.200">
              <p>{workspace.name}</p>
              <ModeSwitch />
              {error && <p role="alert">{error}</p>}
              <Button onClick={() => void signOut()}>Sign out</Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
function RouteNavigation({ pathname }: { pathname: string }) {
  const { collapse } = useSideNav();
  const current = useRef(collapse);
  current.current = collapse;
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    if (!window.matchMedia("(min-width: 64rem)").matches) {
      current.current();
      const frame = requestAnimationFrame(() => document.querySelector("main")?.focus());
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [pathname]);
  return null;
}
