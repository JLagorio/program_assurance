import { Link, useRouterState } from "@tanstack/react-router";
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
import type { ReactNode } from "react";

import {
  Avatar,
  DensitySwitch,
  IconButton,
  Inline,
  Input,
  InputGroup,
  ModeSwitch,
  Shell as DsShell,
  Tooltip,
} from "@ledger/design-system";

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
      { label: "My queue", to: "/scope", icon: ShieldCheck, badge: "1" },
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
  return (
    <DsShell sideNavShortcut persist>
      <DsShell.TopNav>
        <DsShell.TopNav.Start toggle={<DsShell.SideNav.ToggleButton />}>
          <DsShell.AppLogo asChild name="Equinox" secondaryName="Northwind Corp">
            <Link to="/" aria-label="Equinox home" />
          </DsShell.AppLogo>
        </DsShell.TopNav.Start>
        <DsShell.TopNav.Middle>
          <InputGroup
            leading={<Search />}
            trailing={
              <Inline
                className="pointer-events-none"
                as="span"
                space="space.025"
                alignBlock="center"
              >
                <CommandIcon className="size-100" />K
              </Inline>
            }
            width={420}
          >
            <Input
              type="search"
              placeholder="Search risks, controls, evidence…"
              aria-label="Search"
              size="small"
            />
          </InputGroup>
        </DsShell.TopNav.Middle>
        <DsShell.TopNav.End>
          <DensitySwitch />
          <ModeSwitch />
          {topNavEnd.map(([Icon, label]) => (
            <Tooltip key={label} content={label}>
              <IconButton label={label} variant="subtle" icon={<Icon />} />
            </Tooltip>
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
                    badge={item.badge}
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
            avatar={<Avatar name="Sarah Chen" size="small" />}
            name="Sarah Chen"
            role="Compliance lead"
            onClick={() => undefined}
          />
        </DsShell.SideNav.Footer>
        <DsShell.SideNav.Splitter label="Resize side navigation" />
      </DsShell.SideNav>
      <DsShell.Main>{children}</DsShell.Main>
    </DsShell>
  );
}
