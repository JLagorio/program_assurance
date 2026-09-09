import {
  Avatar,
  Box,
  Button,
  buttonVariants,
  CommandPalette,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  IconButton,
  ModeSwitch,
  Shell as DsShell,
  Stack,
} from "@ledger/design-system";

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Archive,
  Bell,
  Boxes,
  Bug,
  CircleHelp,
  ClipboardList,
  FileCheck2,
  FlaskConical,
  Gauge,
  Gavel,
  Library,
  Package as PackageIcon,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkle,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { currentSession, useWorkVersion } from "@/lib/control-work";
import { findings } from "@/lib/findings";
import { programs, risks } from "@/lib/grc-data";
import { useProgramsVersion } from "@/lib/program-store";
import { useRisksVersion } from "@/lib/risk-store";
import { openTasks, tasksAssignedTo, useTasksVersion } from "@/lib/tasks";

/**
 * The product's frame on the package's navigation system. The side nav holds objects and queues;
 * it never holds phases, because a phase is a state of a program, reached by opening it. A record's
 * rail is its ShowPage's, beside the overview tab; a route renders the detail of a selected row into
 * DsShell.Panel from wherever it is, and the shell places it.
 */
const navGroups: {
  label: string;
  items: { label: string; to: string; icon: typeof Gauge; badge?: string }[];
}[] = [
  {
    label: "Work",
    items: [
      { label: "My work", to: "/work", icon: ShieldCheck, badge: "" },
      { label: "Programs", to: "/programs", icon: ClipboardList },
      { label: "Test campaigns", to: "/campaigns", icon: FlaskConical },
      { label: "Portfolio", to: "/", icon: Gauge },
    ],
  },
  {
    label: "Risk",
    items: [
      { label: "Findings & assets", to: "/findings", icon: Bug, badge: "7" },
      { label: "POA&M & risk", to: "/register", icon: ShieldAlert, badge: "4" },
      { label: "Packages", to: "/packages", icon: PackageIcon },
      { label: "Authorization decisions", to: "/briefing", icon: Gavel },
    ],
  },
  {
    label: "Libraries",
    items: [
      { label: "Control catalog", to: "/controls", icon: FileCheck2 },
      { label: "STIG & SRG library", to: "/stigs", icon: Boxes },
      { label: "Providers", to: "/library/components", icon: Library },
      { label: "Evidence", to: "/evidence", icon: Archive },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Supply chain", to: "/vendors", icon: Users },
      { label: "Design system", to: "/components", icon: Sparkle },
    ],
  },
];

const topNavEnd = [
  [CircleHelp, "Help and shortcuts"],
  [Bell, "Notifications"],
  [Settings, "Settings"],
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useTasksVersion();
  useWorkVersion();
  useRisksVersion();
  useProgramsVersion();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const session = currentSession();
  const openCount = openTasks(tasksAssignedTo(currentSession().name)).length;
  return (
    <DsShell sideNavShortcut persist>
      <DsShell.TopNav>
        <DsShell.TopNav.Start toggle={<DsShell.SideNav.ToggleButton />}>
          <DsShell.AppLogo asChild name="Equinox" secondaryName="Northwind Corp">
            <Link to="/" aria-label="Equinox home" />
          </DsShell.AppLogo>
        </DsShell.TopNav.Start>
        <DsShell.TopNav.Middle>
          <Button
            variant="secondary"
            iconBefore={<Search />}
            onClick={() => setSearchOpen(true)}
            aria-label="Search programs, risks, and findings"
          >
            Search programs, risks, and findings
          </Button>
        </DsShell.TopNav.Middle>
        <DsShell.TopNav.End>
          <ModeSwitch />
          {topNavEnd.map(([Icon, label]) => (
            <IconButton
              key={label}
              label={label}
              variant="subtle"
              icon={<Icon />}
              onClick={() =>
                label === "Help and shortcuts"
                  ? setHelpOpen(true)
                  : label === "Settings"
                    ? setSettingsOpen(true)
                    : void navigate({ to: "/work" })
              }
            />
          ))}
        </DsShell.TopNav.End>
      </DsShell.TopNav>
      <DsShell.SideNav>
        <DsShell.SideNav.Body>
          {navGroups.map((group) => (
            <DsShell.SideNav.Section key={group.label} heading={group.label}>
              {group.items.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                return (
                  <DsShell.SideNav.Item
                    key={item.label}
                    asChild
                    icon={item.icon}
                    isActive={active}
                    badge={
                      item.to === "/work"
                        ? openCount
                          ? String(openCount)
                          : undefined
                        : item.badge || undefined
                    }
                  >
                    <Link to={item.to}>{item.label}</Link>
                  </DsShell.SideNav.Item>
                );
              })}
            </DsShell.SideNav.Section>
          ))}
        </DsShell.SideNav.Body>
        <DsShell.SideNav.Footer>
          <DsShell.Profile
            avatar={<Avatar name={session.name} size="small" />}
            name={session.name}
            role={session.role}
            onClick={() => setSettingsOpen(true)}
          />
        </DsShell.SideNav.Footer>
        <DsShell.SideNav.Splitter label="Resize side navigation" />
      </DsShell.SideNav>
      <DsShell.Main>{children}</DsShell.Main>
      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        placeholder="Search programs, risks, and findings…"
        commands={[
          ...programs.map((program) => ({
            id: program.id,
            group: "Programs",
            label: `${program.id} · ${program.name}${program.archivedAt ? " (archived)" : ""}`,
            run: () => {
              void navigate({ to: "/programs/$programId", params: { programId: program.id } });
            },
          })),
          ...risks.map((risk) => ({
            id: risk.id,
            group: "Risks",
            label: `${risk.id} · ${risk.title}`,
            run: () => {
              void navigate({ to: "/risks/$riskId", params: { riskId: risk.id } });
            },
          })),
          ...findings.map((finding) => ({
            id: finding.id,
            group: "Findings",
            label: `${finding.id} · ${finding.title}`,
            run: () => {
              void navigate({ to: "/findings/$findingId", params: { findingId: finding.id } });
            },
          })),
        ]}
      />
      <Dialog
        open={helpOpen}
        onOpenChange={(next) => {
          if (!next) {
            setHelpOpen(false);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Help and shortcuts</DialogTitle>
            <DialogDescription>
              Find records with the search button. My work shows requests, tasks, and mentions
              assigned to you.
            </DialogDescription>
          </DialogHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <Stack space="space.150">
              <p>
                Use Tab to move between controls and Enter or Space to activate buttons. Press
                Escape to close a dialog.
              </p>
              <p>On a program record, ⌘K or Ctrl+K opens its command palette.</p>
              <Link to="/work" className={buttonVariants({ variant: "secondary" })}>
                Open my work
              </Link>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
      <Dialog
        open={settingsOpen}
        onOpenChange={(next) => {
          if (!next) {
            setSettingsOpen(false);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Profile and appearance</DialogTitle>
            <DialogDescription>{`Acting as ${session.name} · ${session.role}`}</DialogDescription>
          </DialogHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <Stack space="space.150">
              <p>Choose the appearance for this browser.</p>
              <ModeSwitch />
              <p>
                The role switch in the lower corner lets you review the prototype with a different
                role.
              </p>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </DsShell>
  );
}
